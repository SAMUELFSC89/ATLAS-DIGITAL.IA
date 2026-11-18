import type { Request, Response } from 'express';
import type { ExpressAsset, ExpressOrder } from '../../src/lib/expressOrder.js';
import { DEFAULT_VISUAL_PROMPT } from '../../src/lib/expressVisualPrompt.js';
import { claudeConfigured, claudeText, extractSiteHtml, finalPrompt } from './express-claude.js';
import { resolveExpressAssets } from './express-assets.js';
import { db, orders, previews, publicOrigin, settings } from './express-store.js';
import { sites } from './express-visual-store.js';

/** Public slug → order. Kept separate so the published page never exposes order data. */
const published = () => db().collection('expressPublished');
const domains = () => db().collection('expressDomains');
const FINAL_STATUSES = ['paid', 'production', 'delivered'];

export const slugFor = (name: string, id: string) => {
  const base = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'site';
  return `${base}-${id.slice(0, 6)}`;
};
export const publishedUrl = (slug: string) => `${publicOrigin()}/s/${slug}`;

export function normalizeDomain(value: unknown) {
  if (typeof value !== 'string') return '';
  const host = value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (host.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host)) return '';
  if (/(^|\.)(atlasdigital\.ia\.br|vercel\.app|vercel\.com|localhost)$/.test(host)) return '';
  return host;
}

async function loadOrder(id: string) {
  const order = (await orders().doc(id).get()).data() as (ExpressOrder & { siteNotes?: string; siteSlug?: string; siteDomain?: string }) | undefined;
  if (!order || !FINAL_STATUSES.includes(order.status)) return null;
  return order;
}

export async function saveSiteNotes(id: string, notes: unknown) {
  if (typeof notes !== 'string' || notes.length > 6000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(notes)) return 'Escreva os ajustes com até 6.000 caracteres.';
  if (!(await loadOrder(id))) return 'Os ajustes só podem ser registrados em pedidos pagos.';
  await orders().doc(id).update({ siteNotes: notes.trim(), siteNotesAt: Date.now() });
  return '';
}

/** Replaces the project's photos and logo with the selection made in the panel (existing and newly uploaded files). */
export async function saveSiteAssets(id: string, body: any) {
  const order = await loadOrder(id);
  if (!order) return 'As fotos só podem ser alteradas em pedidos pagos.';
  const assets: ExpressAsset[] = await resolveExpressAssets({ ...body, sourcePreviewId: order.previewId }, order.previewId);
  const photo = assets.find(asset => asset.kind === 'photo')?.url || '';
  const batch = db().batch();
  batch.update(previews().doc(order.previewId), { 'business.assets': assets, 'business.photo': photo });
  batch.update(orders().doc(id), { 'business.assets': assets, 'business.photo': photo });
  await batch.commit();
  return '';
}

/** Generates the final page with every saved adjustment and publishes it on the Atlas domain. */
export async function finalizeSite(id: string) {
  if (!claudeConfigured()) return { error: 'Cadastre ANTHROPIC_API_KEY na Vercel para finalizar com o Claude.' };
  const ref = orders().doc(id);
  const claimed = await db().runTransaction(async tx => {
    const order = (await tx.get(ref)).data();
    if (!order || !FINAL_STATUSES.includes(order.status)) return null;
    if (order.finalizeLeaseUntil > Date.now()) return 'busy' as const;
    tx.update(ref, { finalizeLeaseUntil: Date.now() + 290000 });
    return order as ExpressOrder & { siteNotes?: string; siteSlug?: string; siteVersion?: number };
  });
  if (!claimed) return { error: 'O site só pode ser finalizado em pedidos pagos.' };
  if (claimed === 'busy') return { error: 'Este site já está sendo finalizado. Aguarde alguns minutos e atualize.' };
  try {
    const [site, config, preview] = await Promise.all([sites().doc(claimed.previewId).get(), settings().get(), previews().doc(claimed.previewId).get()]);
    const business = preview.data()?.business || claimed.business;
    const prompt = finalPrompt(business, {
      previewHtml: typeof site.data()?.html === 'string' ? site.data()!.html : '(sem prévia em HTML: crie o site completo a partir dos dados)',
      notes: claimed.siteNotes || '', origin: publicOrigin(),
      creativePrompt: typeof config.data()?.visualPrompt === 'string' ? config.data()!.visualPrompt : DEFAULT_VISUAL_PROMPT,
    });
    const html = extractSiteHtml(await claudeText(prompt.system, prompt.user, 270000, 48000));
    const slug = claimed.siteSlug || slugFor(business.name, id);
    const version = (claimed.siteVersion || 0) + 1;
    const batch = db().batch();
    batch.set(sites().doc(claimed.previewId), { finalHtml: html, finalVersion: version, finalAt: Date.now() }, { merge: true });
    batch.set(published().doc(slug), { orderId: id, previewId: claimed.previewId });
    batch.update(ref, { siteSlug: slug, siteVersion: version, siteFinalAt: Date.now(), finalizeLeaseUntil: 0,
      ...(claimed.status === 'paid' && { status: 'production' }) });
    await batch.commit();
    return { url: publishedUrl(slug), version };
  } catch (error) {
    await ref.update({ finalizeLeaseUntil: 0 });
    const status = Number((error as { status?: number }).status) || 0;
    console.warn('[Site Express Final] Falha ao finalizar.', { status, reason: error instanceof Error ? error.message.slice(0, 80) : 'unknown' });
    return { error: status === 429 ? 'O Claude está com limite de uso no momento. Tente novamente em alguns minutos.'
      : status === 401 || status === 403 ? 'A chave da API do Claude foi recusada. Confira ANTHROPIC_API_KEY na Vercel.'
        : 'Não foi possível finalizar agora. Seus ajustes foram preservados; tente novamente.' };
  }
}

/** Connects a client domain: maps it to the published site and, when a Vercel token is configured, adds it to the project. */
export async function connectDomain(id: string, value: unknown) {
  const domain = normalizeDomain(value);
  if (!domain) return { error: 'Informe um domínio válido, como suaempresa.com.br.' };
  const order = await loadOrder(id);
  if (!order?.siteSlug) return { error: 'Finalize o site antes de conectar um domínio.' };
  const taken = (await domains().doc(domain).get()).data();
  if (taken && taken.orderId !== id) return { error: 'Este domínio já está ligado a outro site.' };
  const token = process.env.VERCEL_TOKEN?.trim(), project = process.env.VERCEL_PROJECT_ID?.trim();
  let vercel: 'added' | 'manual' | 'failed' = 'manual';
  if (token && project) {
    const team = process.env.VERCEL_TEAM_ID?.trim();
    const response = await fetch(`https://api.vercel.com/v10/projects/${encodeURIComponent(project)}/domains${team ? `?teamId=${encodeURIComponent(team)}` : ''}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: domain }), signal: AbortSignal.timeout(15000),
    }).catch(() => null);
    const result = await response?.json().catch(() => null);
    vercel = response?.ok || result?.error?.code === 'domain_already_in_use' && result?.error?.projectId === project ? 'added' : 'failed';
    // Also answer on www.<domain>; failure here does not block the main domain.
    if (vercel === 'added' && !domain.startsWith('www.')) {
      await fetch(`https://api.vercel.com/v10/projects/${encodeURIComponent(project)}/domains${team ? `?teamId=${encodeURIComponent(team)}` : ''}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'www.' + domain }), signal: AbortSignal.timeout(15000),
      }).catch(() => null);
    }
  }
  if (vercel === 'failed') return { error: 'A Vercel não aceitou o domínio. Confira se ele não está em outro projeto e tente novamente.' };
  const batch = db().batch();
  if (order.siteDomain && order.siteDomain !== domain) batch.delete(domains().doc(order.siteDomain));
  batch.set(domains().doc(domain), { orderId: id, slug: order.siteSlug, createdAt: Date.now() });
  batch.update(orders().doc(id), { siteDomain: domain });
  await batch.commit();
  return { domain, vercel };
}

/** Serves a finalized site by slug (atlasdigital.ia.br/s/…) or by the connected client domain. */
export async function servePublished(req: Request, res: Response) {
  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
  const host = normalizeDomain(req.query.host);
  let target = slug && /^[a-z0-9-]{3,60}$/.test(slug) ? (await published().doc(slug).get()).data() : undefined;
  if (!target && host) {
    const mapped = (await domains().doc(host).get()).data() || (host.startsWith('www.') ? (await domains().doc(host.slice(4)).get()).data() : undefined);
    if (mapped?.slug) target = (await published().doc(mapped.slug).get()).data();
  }
  const html = target ? (await sites().doc(target.previewId).get()).data()?.finalHtml : undefined;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // An opaque origin keeps the generated page away from the Atlas session, cookies and storage.
  res.setHeader('Content-Security-Policy', 'sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-top-navigation-by-user-activation');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (typeof html !== 'string') return res.status(404).send('<!doctype html><meta charset="utf-8"><title>Site não encontrado</title><p style="font-family:sans-serif;padding:2rem">Site não encontrado.</p>');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
  return res.status(200).send(html);
}
