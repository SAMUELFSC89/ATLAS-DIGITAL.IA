import { createHash } from 'node:crypto';
import { PREVIEW_PAGES, type ExpressBusiness, type ExpressPreview, type ExpressVisual, type PreviewPageId } from '../../src/lib/expressOrder.js';
import { db, previews, saoPauloDay, settings } from './express-store.js';
import { DEFAULT_VISUAL_PROMPT } from '../../src/lib/expressVisualPrompt.js';
import { extractVisualImage, getVisualInteraction, parseVisualPlan, startVisualImage, startVisualResearch, type VisualPlan } from './express-visual-provider.js';

const jobs = () => db().collection('expressVisualJobs');
const nowPlusWeek = () => Date.now() + 7 * 24 * 3600000;
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
  batch.create(jobs().doc(id), { phase: 'research', operation: 'idle', activeId: '',
    activePage: '', interactions: {}, brandColor, creativePrompt, promptUpdatedAt: config?.visualPromptUpdatedAt || 0,
    createdAt: Date.now(), leaseUntil: 0, nextPollAt: 0 });
  await batch.commit();
}

const safeFailure = (status?: number) => status === 429
  ? 'O serviço de imagens atingiu o limite temporário. Sua prévia foi salva. Fale com a Atlas para continuar.'
  : status === 403 || status === 404 || status === 400
    ? 'A geração visual ainda não está disponível para esta configuração. Fale com a Atlas para preparar sua prévia.'
    : 'Não foi possível concluir todas as imagens agora. As telas prontas foram preservadas. Fale com a Atlas para continuar.';

export async function advanceVisualPreview(id: string): Promise<ExpressVisual | null> {
  const jobRef = jobs().doc(id), previewRef = previews().doc(id);
  const claimed = await db().runTransaction(async tx => {
    const [p, j] = await tx.getAll(previewRef, jobRef);
    const preview = p.data() as (ExpressPreview & { visual: ExpressVisual }) | undefined;
    const job = j.data();
    if (!preview?.visual || !job) return null;
    const now = Date.now();
    if (['ready', 'error'].includes(preview.visual.status)) return { preview, job, claimed: false };
    if (preview.visual.expiresAt <= now ||
      (job.operation === 'starting' && job.leaseUntil <= now)) {
      const visual: ExpressVisual = { ...preview.visual, status: 'error', message: 'Esta geração foi interrompida. Fale com a Atlas para continuar a partir dos dados salvos.' };
      tx.update(previewRef, { visual });
      return { preview: { ...preview, visual }, job, claimed: false };
    }
    if (job.leaseUntil > now || job.nextPollAt > now) return { preview, job, claimed: false };
    const operation = job.activeId ? 'polling' : 'starting';
    tx.update(jobRef, { operation, leaseUntil: now + 35000, nextPollAt: now + 5000 });
    return { preview, job, claimed: true };
  });
  if (!claimed) return null;
  if (!claimed.claimed) return claimed.preview.visual;
  const { preview, job } = claimed;
  try {
    const page = job.phase === 'research' ? null : preview.visual.pages.find(item => item.status !== 'ready');
    if (job.phase !== 'research' && !page) {
      const visual: ExpressVisual = { ...preview.visual, status: 'ready' };
      await previewRef.update({ visual });
      await jobRef.update({ operation: 'idle', leaseUntil: 0 });
      return visual;
    }
    const result = job.activeId
      ? await getVisualInteraction(job.activeId)
      : job.phase === 'research' ? await startVisualResearch(preview.business, job.creativePrompt || DEFAULT_VISUAL_PROMPT)
        : await startVisualImage({ business: preview.business, plan: job.plan as VisualPlan,
          page: page!.id, device: preview.visual.device, brandColor: job.brandColor || '',
          creativePrompt: job.creativePrompt || DEFAULT_VISUAL_PROMPT, firstInteraction: job.interactions?.home });
    if (!result.id) throw new Error('Missing visual interaction');
    // Persist the provider ID before processing output, so refreshes resume instead of regenerating.
    await jobRef.update({ activeId: result.id, activePage: page?.id || '', operation: 'polling' });
    if (!['completed', 'in_progress'].includes(result.status)) throw new Error('Visual interaction failed');
    let visual: ExpressVisual = { ...preview.visual };
    let patch: Record<string, unknown>;
    if (result.status === 'completed') {
      if (job.phase === 'research') {
        const plan = parseVisualPlan(result);
        visual = { ...visual, status: 'generating', references: plan.references, searchSuggestions: plan.searchSuggestions };
        patch = { phase: 'pages', plan, activeId: '', activePage: '', operation: 'idle', leaseUntil: 0 };
      } else {
        const image = extractVisualImage(result);
        visual = { ...visual, pages: visual.pages.map(item => item.id === page!.id ? {
          ...item, status: 'ready', imageUrl: `/api/site-express?view=image&id=${id}&page=${item.id}`,
          width: image.width, height: image.height,
        } : item) };
        if (visual.pages.every(item => item.status === 'ready')) visual.status = 'ready';
        patch = { [`interactions.${page!.id}`]: result.id, activeId: '', activePage: '', operation: 'idle', leaseUntil: 0 };
      }
    } else {
      if (page) visual = { ...visual, pages: visual.pages.map(item => item.id === page.id ? { ...item, status: 'generating' } : item) };
      patch = { leaseUntil: 0, nextPollAt: Date.now() + 5000 };
    }
    const batch = db().batch();
    batch.update(jobRef, patch);
    batch.update(previewRef, { visual });
    await batch.commit();
    return visual;
  } catch (error) {
    const status = Number((error as { status?: number }).status) || 0;
    const visual: ExpressVisual = { ...preview.visual, status: 'error', message: safeFailure(status) };
    console.warn('[Site Express Visual] Etapa interrompida.', { phase: job.phase, status, reason: error instanceof Error ? error.name : 'unknown' });
    await previewRef.update({ visual });
    await jobRef.update({ leaseUntil: 0, operation: 'failed' });
    return visual;
  }
}

export async function readVisualImage(id: string, page: PreviewPageId) {
  const [p, j] = await Promise.all([previews().doc(id).get(), jobs().doc(id).get()]);
  const visual = p.data()?.visual as ExpressVisual | undefined;
  const interactionId = j.data()?.interactions?.[page];
  if (!visual || visual.expiresAt <= Date.now() || !interactionId ||
    visual.pages.find(item => item.id === page)?.status !== 'ready') return null;
  const result = await getVisualInteraction(interactionId);
  return extractVisualImage(result);
}
