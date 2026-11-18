import { createHash } from 'node:crypto';
import { PREVIEW_PAGES, type ExpressPreview, type ExpressVisual, type PreviewPageId } from '../../src/lib/expressOrder.js';
import { db, previews, publicOrigin, saoPauloDay, settings } from './express-store.js';
import { DEFAULT_VISUAL_PROMPT } from '../../src/lib/expressVisualPrompt.js';
import { claudeText, extractSiteHtml, previewPrompt, SITE_SECTIONS } from './express-claude.js';
import { renderSiteShots } from './express-render.js';

const jobs = () => db().collection('expressVisualJobs');
/** Private: generated markup never goes to the visitor, only the screenshots. */
export const sites = () => db().collection('expressSites');
const shots = () => db().collection('expressSiteShots');
const nowPlusWeek = () => Date.now() + 7 * 24 * 3600000;
export const sectionFor: Record<PreviewPageId, typeof SITE_SECTIONS[number]> = { home: 'inicio', services: 'servicos', about: 'sobre', contact: 'contato' };

export function initialVisual(device: 'mobile' | 'desktop'): ExpressVisual {
  return { status: 'researching', device, expiresAt: nowPlusWeek(), references: [],
    pages: PREVIEW_PAGES.map(page => ({ ...page, status: 'pending' })) };
}

export async function reserveVisualBudget(ip: string) {
  const day = saoPauloDay(Date.now());
  const hash = createHash('sha256').update(ip).digest('hex');
  const global = db().collection('expressVisualLimits').doc(day);
  const own = global.collection('clients').doc(hash);
  const configured = Number(process.env.ATLAS_EXPRESS_VISUAL_DAILY_LIMIT || 12);
  const daily = Number.isInteger(configured) && configured > 0 && configured <= 1000 ? configured : 12;
  return db().runTransaction(async tx => {
    const [all, client] = await tx.getAll(global, own);
    const total = all.data()?.count || 0, count = client.data()?.count || 0;
    if (total >= daily || count >= 3) return false;
    const expiresAt = new Date(Date.now() + 3 * 86400000);
    tx.set(global, { count: total + 1, expiresAt });
    tx.set(own, { count: count + 1, expiresAt });
    return true;
  });
}

export async function createVisualPreview(id: string, preview: Omit<ExpressPreview, 'id'>, brandColor: string) {
  const config = (await settings().get()).data();
  const creativePrompt = typeof config?.visualPrompt === 'string' ? config.visualPrompt.slice(0, 8000) : DEFAULT_VISUAL_PROMPT;
  const batch = db().batch();
  batch.create(previews().doc(id), { ...preview, createdAt: Date.now() });
  batch.create(jobs().doc(id), { phase: 'site', engine: 'claude', brandColor, creativePrompt,
    promptUpdatedAt: config?.visualPromptUpdatedAt || 0, createdAt: Date.now(), leaseUntil: 0 });
  await batch.commit();
}

const safeFailure = (status?: number) => status === 429
  ? 'A criação da prévia está temporariamente indisponível. Seus dados foram salvos. Fale com a Atlas para continuar.'
  : status === 401 || status === 403 || status === 404 || status === 400
    ? 'A geração da prévia ainda não está disponível para esta configuração. Fale com a Atlas para preparar sua prévia.'
    : 'Não foi possível concluir a prévia agora. Seus dados foram salvos. Fale com a Atlas para continuar.';

const LEASE = { site: 290000, shots: 120000 } as const;

export async function advanceVisualPreview(id: string): Promise<ExpressVisual | null> {
  const jobRef = jobs().doc(id), previewRef = previews().doc(id);
  const claimed = await db().runTransaction(async tx => {
    const [p, j] = await tx.getAll(previewRef, jobRef);
    const preview = p.data() as (ExpressPreview & { visual: ExpressVisual }) | undefined;
    const job = j.data();
    if (!preview?.visual || !job) return null;
    const now = Date.now();
    if (['ready', 'error'].includes(preview.visual.status)) return { preview, job, claimed: false };
    if (preview.visual.expiresAt <= now || job.engine !== 'claude') {
      const visual: ExpressVisual = { ...preview.visual, status: 'error', message: 'Esta geração foi interrompida. Fale com a Atlas para continuar a partir dos dados salvos.' };
      tx.update(previewRef, { visual });
      return { preview: { ...preview, visual }, job, claimed: false };
    }
    if (job.leaseUntil > now) return { preview, job, claimed: false };
    tx.update(jobRef, { leaseUntil: now + LEASE[job.phase as keyof typeof LEASE] });
    return { preview, job, claimed: true };
  });
  if (!claimed) return null;
  if (!claimed.claimed) return claimed.preview.visual;
  const { preview, job } = claimed;
  let phase = job.phase as 'site' | 'shots';
  let visual: ExpressVisual = preview.visual;
  try {
    if (phase === 'site') {
      const prompt = previewPrompt(preview.business, { creativePrompt: job.creativePrompt || DEFAULT_VISUAL_PROMPT,
        brandColor: job.brandColor || '', origin: publicOrigin() });
      const html = extractSiteHtml(await claudeText(prompt.system, prompt.user, 270000));
      visual = { ...visual, status: 'generating', pages: visual.pages.map(item => ({ ...item, status: 'generating' })) };
      const batch = db().batch();
      batch.set(sites().doc(id), { html, createdAt: Date.now() }, { merge: true });
      batch.update(previewRef, { visual });
      // Persist the complete site before a separate request starts the renderer.
      batch.update(jobRef, { phase: 'shots', leaseUntil: 0 });
      await batch.commit();
      return visual;
    }
    const site = (await sites().doc(id).get()).data();
    if (typeof site?.html !== 'string') throw new Error('Missing generated site');
    const images = await renderSiteShots(site.html, visual.device, publicOrigin());
    const batch = db().batch();
    for (const image of images) {
      batch.set(shots().doc(`${id}_${image.section}`), { data: image.buffer, width: image.width, height: image.height, createdAt: Date.now() });
    }
    visual = { ...visual, status: 'ready', pages: visual.pages.map(item => {
      const image = images.find(shot => shot.section === sectionFor[item.id]);
      return { ...item, status: 'ready', imageUrl: `/api/site-express?view=image&id=${id}&page=${item.id}&v=${Date.now()}`, width: image?.width, height: image?.height };
    }) };
    batch.update(previewRef, { visual });
    batch.update(jobRef, { phase: 'done', leaseUntil: 0 });
    await batch.commit();
    return visual;
  } catch (error) {
    const issue = error as { status?: number; terminal?: boolean };
    const status = Number(issue.status) || 0;
    const failed: ExpressVisual = { ...visual, status: 'error', message: safeFailure(status) };
    console.warn('[Site Express Claude] Etapa interrompida.', { phase, status, reason: error instanceof Error ? error.message.slice(0, 80) : 'unknown' });
    const failure = db().batch();
    failure.update(previewRef, { visual: failed });
    failure.update(jobRef, { phase, leaseUntil: 0, lastError: { status, terminal: issue.terminal === true, at: Date.now() } });
    await failure.commit();
    await settings().set({ visualLastIssue: { status, phase, at: Date.now() } }, { merge: true });
    return failed;
  }
}

export async function resumeVisualPreview(id: string) {
  const ref = previews().doc(id), task = jobs().doc(id);
  return db().runTransaction(async tx => {
    const [p, j] = await tx.getAll(ref, task);
    const visual = p.data()?.visual as ExpressVisual | undefined, job = j.data();
    if (!visual || !job || visual.status !== 'error' || visual.expiresAt <= Date.now() || (job.retries || 0) >= 3) return false;
    const phase = job.engine === 'claude' && job.phase === 'shots' ? 'shots' : 'site';
    const { message: _message, ...saved } = visual;
    tx.update(ref, { visual: { ...saved, status: phase === 'site' ? 'researching' : 'generating' } });
    tx.update(task, { engine: 'claude', phase, leaseUntil: 0, retries: (job.retries || 0) + 1 });
    return true;
  });
}

export async function readVisualImage(id: string, page: PreviewPageId) {
  const [p, s] = await Promise.all([previews().doc(id).get(), shots().doc(`${id}_${sectionFor[page]}`).get()]);
  const visual = p.data()?.visual as ExpressVisual | undefined;
  const data = s.data()?.data;
  if (!visual || visual.expiresAt <= Date.now() || !data) return null;
  return { buffer: Buffer.from(data), mimeType: 'image/jpeg' };
}

