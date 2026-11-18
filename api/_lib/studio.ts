import { createHash, randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuthenticatedEmail } from '../radar.js';
import { db, orderId, saoPauloDay } from './express-store.js';
import { ExpressAssetError, rasterInfo } from './express-assets.js';
import { claudeConfigured, claudeText, type ClaudeContent } from './express-claude.js';
import { BRIEFING_PROMPT, DIRECTION_PROMPT, MENU_PROMPT, SITE_PROMPT, STUDIO_MANUAL } from './studio-manual.js';
import { normalizeBrazilianWhatsApp } from '../../src/lib/contact.js';
import { SCENE_TYPES, StudioValidationError, sanitizeStudioSite, sanitizeTokens, type StudioAsset } from '../../src/lib/studioSite.js';
import {
  BRIEFING_FIELDS, CLIENT_FIELDS, type StudioBriefing, type StudioClient, type StudioDirection, type StudioIdea,
  type StudioProject, type StudioProjectSummary, type StudioStep,
} from '../../src/lib/studioProject.js';

const projects = () => db().collection('studioProjects');
const files = (id: string) => projects().doc(id).collection('files');
const accessDoc = () => db().collection('studioInternal').doc('access');
const ownerEmail = () => (process.env.ATLAS_CONTACT_OWNER_EMAIL || 'samuelfsc89@gmail.com').trim().toLowerCase();
const studioModel = () => process.env.ATLAS_STUDIO_CLAUDE_MODEL?.trim() || process.env.ATLAS_EXPRESS_CLAUDE_MODEL?.trim() || 'claude-sonnet-5-5';
const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
const ASSET_MAX_BYTES = 750 * 1024;
const MAX_PHOTOS = 16;
const STEP_TIMEOUT = 280000;

class StudioError extends Error { constructor(public status: number, message: string) { super(message); } }
type User = { email: string; owner: boolean };

const text = (value: unknown, max: number) => typeof value === 'string'
  ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max) : '';

async function identify(req: Request): Promise<User | null> {
  const email = (await getAuthenticatedEmail(req, true))?.toLowerCase();
  if (!email) return null;
  if (email === ownerEmail()) return { email, owner: true };
  const allowed: string[] = (await accessDoc().get()).data()?.emails || [];
  return allowed.includes(email) ? { email, owner: false } : null;
}

async function load(user: User, id: unknown) {
  if (!orderId(id)) throw new StudioError(400, 'Projeto inválido.');
  const snapshot = await projects().doc(id).get();
  const project = snapshot.data() as StudioProject | undefined;
  if (!project || (!user.owner && project.ownerEmail !== user.email)) throw new StudioError(404, 'Projeto não encontrado.');
  return project;
}

function sanitizeClient(input: any): StudioClient {
  const client = Object.fromEntries(CLIENT_FIELDS.map(field => [field.key, text(input?.[field.key], field.max)])) as unknown as StudioClient;
  const missing = CLIENT_FIELDS.find(field => field.required && !client[field.key]);
  if (missing) throw new StudioError(400, `Preencha o campo "${missing.label}".`);
  client.whatsapp = normalizeBrazilianWhatsApp(client.whatsapp);
  if (!client.whatsapp) throw new StudioError(400, 'Informe um WhatsApp brasileiro com DDD.');
  return client;
}

function sanitizeBriefing(input: any): StudioBriefing {
  const briefing = Object.fromEntries(BRIEFING_FIELDS.map(field => [field.key, text(input?.[field.key], 700)])) as unknown as StudioBriefing;
  briefing.objecoes = (Array.isArray(input?.objecoes) ? input.objecoes : []).slice(0, 6)
    .map((item: any) => ({ objecao: text(item?.objecao, 300), resposta: text(item?.resposta, 400) })).filter((item: any) => item.objecao);
  briefing.sensacao = (Array.isArray(input?.sensacao) ? input.sensacao : []).slice(0, 3).map((word: unknown) => text(word, 30)).filter(Boolean);
  if (!briefing.negocio || !briefing.publico || briefing.sensacao.length < 3) throw new StudioValidationError('Briefing incompleto.');
  return briefing;
}

function sanitizeIdeas(input: any) {
  const ideas: StudioIdea[] = (Array.isArray(input?.ideas) ? input.ideas : []).slice(0, 8)
    .filter((idea: any) => Object.hasOwn(SCENE_TYPES, idea?.sceneType))
    .map((idea: any, index: number) => ({
      id: `ideia-${index + 1}`, title: text(idea.title, 80), description: text(idea.description, 400),
      feeling: text(idea.feeling, 120), sceneType: idea.sceneType, assets: text(idea.assets, 300),
      original: text(idea.id, 40),
    }))
    .filter((idea: StudioIdea) => idea.title && idea.description);
  if (ideas.length < 4) throw new StudioValidationError('Cardápio com poucas ideias.');
  const recommended = ideas.find(idea => (idea as StudioIdea & { original: string }).original === input?.recommendedId)?.id || ideas[0].id;
  return { ideas: ideas.map(({ original: _original, ...idea }: StudioIdea & { original?: string }) => idea), recommendedId: recommended };
}

function sanitizeDirection(input: any): StudioDirection {
  const roteiro = (Array.isArray(input?.roteiro) ? input.roteiro : []).slice(0, 10)
    .filter((scene: any) => Object.hasOwn(SCENE_TYPES, scene?.type))
    .map((scene: any) => ({
      title: text(scene.title, 120), type: scene.type, tone: ['base', 'alt', 'destaque'].includes(scene.tone) ? scene.tone : 'base',
      entrada: text(scene.entrada, 400), durante: text(scene.durante, 400), saida: text(scene.saida, 400),
      objetivo: text(scene.objetivo, 200), assets: text(scene.assets, 300),
    }));
  if (roteiro.length < 4) throw new StudioValidationError('Roteiro com poucas cenas.');
  return {
    tokens: sanitizeTokens(input?.tokens),
    rationale: { palette: text(input?.rationale?.palette, 500), typography: text(input?.rationale?.typography, 500), motion: text(input?.rationale?.motion, 500) },
    roteiro,
    assetsList: (Array.isArray(input?.assetsList) ? input.assetsList : []).slice(0, 30).map((item: any) => ({
      file: text(item?.file, 80), description: text(item?.description, 300), source: text(item?.source, 120), prompt: text(item?.prompt, 700),
    })).filter((item: any) => item.file),
  };
}

/** Claude is asked for bare JSON; this tolerates a fenced block or text around the object. */
function parseJson(reply: string) {
  const fenced = reply.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? reply;
  const start = fenced.indexOf('{'), end = fenced.lastIndexOf('}');
  if (start < 0 || end <= start) throw new StudioValidationError('Resposta sem JSON.');
  try { return JSON.parse(fenced.slice(start, end + 1)); } catch { throw new StudioValidationError('JSON inválido.'); }
}

async function imageBlocks(project: StudioProject, id: string): Promise<ClaudeContent[]> {
  const blocks: ClaudeContent[] = [];
  for (const asset of project.assets) {
    const saved = (await files(id).doc(asset.id).get()).data();
    if (!saved?.data) continue;
    blocks.push({ type: 'text', text: `Imagem id="${asset.id}" tipo=${asset.kind === 'logo' ? 'logo' : 'foto'} arquivo="${asset.name}" (${asset.width}x${asset.height}):` });
    blocks.push({ type: 'image', source: { type: 'base64', media_type: asset.mimeType, data: Buffer.from(saved.data).toString('base64') } });
  }
  return blocks;
}

const block = (label: string, value: unknown) => `<${label}>\n${typeof value === 'string' ? value : JSON.stringify(value)}\n</${label}>`;

export async function runStep(step: StudioStep, project: StudioProject, id: string, feedback: string) {
  const note = feedback ? '\n' + block('pedido_de_ajuste', feedback) : '';
  const call = (prompt: string, content: string | ClaudeContent[], maxTokens: number) =>
    claudeText(STUDIO_MANUAL + '\n\n' + prompt, content, STEP_TIMEOUT, maxTokens, studioModel());
  if (step === 'briefing') {
    const reply = await call(BRIEFING_PROMPT, block('dados_do_cliente', project.client) + note, 6000);
    return { briefing: sanitizeBriefing(parseJson(reply)), briefingApproved: false };
  }
  const images = await imageBlocks(project, id);
  if (step === 'cardapio') {
    const reply = await call(MENU_PROMPT, [{ type: 'text', text: block('briefing_aprovado', project.briefing) + block('dados_do_cliente', project.client) + note }, ...images], 8000);
    return { ...sanitizeIdeas(parseJson(reply)), protagonistId: FieldValue.delete(), supportIds: FieldValue.delete() };
  }
  if (step === 'direcao') {
    const chosen = (project.ideas || []).filter(idea => idea.id === project.protagonistId || project.supportIds?.includes(idea.id))
      .map(idea => ({ ...idea, papel: idea.id === project.protagonistId ? 'PROTAGONISTA' : 'apoio' }));
    const reply = await call(DIRECTION_PROMPT, [{ type: 'text', text: block('briefing_aprovado', project.briefing) + block('ideias_escolhidas', chosen) + block('dados_do_cliente', project.client) + note }, ...images], 12000);
    return { direction: sanitizeDirection(parseJson(reply)), directionApproved: false };
  }
  const reply = await call(SITE_PROMPT, [{ type: 'text', text: block('briefing_aprovado', project.briefing) + block('direcao_aprovada', project.direction)
    + block('dados_do_cliente', project.client) + block('imagens_do_cliente', project.assets.map(asset => ({ id: asset.id, tipo: asset.kind, arquivo: asset.name }))) + note }, ...images], 20000);
  const site = sanitizeStudioSite(parseJson(reply), new Set(project.assets.map(asset => asset.id)));
  // The approved direction is authoritative for colors, fonts and motion, and the WhatsApp comes from the client data.
  site.tokens = project.direction!.tokens;
  site.meta.whatsapp = project.client.whatsapp;
  if (!site.meta.logoAssetId) {
    const logo = project.assets.find(asset => asset.kind === 'logo');
    if (logo) site.meta.logoAssetId = logo.id;
  }
  return { site };
}

function prerequisite(step: StudioStep, project: StudioProject) {
  if (step === 'cardapio' && !project.briefingApproved) return 'Aprove o briefing antes de montar o cardápio de cenas.';
  if (step === 'direcao' && !project.protagonistId) return 'Escolha a cena protagonista antes da direção criativa.';
  if (step === 'site' && !project.directionApproved) return 'Aprove a direção criativa antes de construir o site.';
  return '';
}

/** Approvals of the generated step and of every later step are reset, so the flow never skips a review. */
const RESET: Record<StudioStep, Record<string, unknown>> = {
  briefing: { briefingApproved: false, directionApproved: false },
  cardapio: { directionApproved: false },
  direcao: { directionApproved: false },
  site: {},
};

async function countGeneration(user: User) {
  const ref = db().collection('studioLimits').doc(saoPauloDay(Date.now())).collection('users').doc(createHash('sha256').update(user.email).digest('hex'));
  const limit = user.owner ? 200 : Number(process.env.ATLAS_STUDIO_DAILY_LIMIT || 40);
  return db().runTransaction(async tx => {
    const count = (await tx.get(ref)).data()?.count || 0;
    if (count >= limit) return false;
    tx.set(ref, { count: count + 1, expiresAt: new Date(Date.now() + 3 * 86400000) });
    return true;
  });
}

async function generate(user: User, id: unknown, step: unknown, feedback: unknown) {
  if (!['briefing', 'cardapio', 'direcao', 'site'].includes(step as string)) throw new StudioError(400, 'Etapa inválida.');
  if (!claudeConfigured()) throw new StudioError(503, 'A chave do Claude não está configurada na Vercel.');
  const current = step as StudioStep;
  const project = await load(user, id);
  const ref = projects().doc(id as string);
  await db().runTransaction(async tx => {
    const fresh = (await tx.get(ref)).data() as StudioProject;
    const problem = prerequisite(current, fresh);
    if (problem) throw new StudioError(409, problem);
    if (fresh.busy && fresh.busy.until > Date.now()) throw new StudioError(409, 'Já existe uma geração em andamento neste projeto. Aguarde terminar.');
    tx.update(ref, { busy: { step: current, until: Date.now() + STEP_TIMEOUT + 15000 } });
  });
  if (!(await countGeneration(user))) {
    await ref.update({ busy: FieldValue.delete() });
    throw new StudioError(429, 'O limite diário de gerações foi atingido. Tente amanhã ou fale com a Atlas.');
  }
  try {
    const patch = await runStep(current, project, id as string, text(feedback, 1500));
    await ref.update({ ...RESET[current], ...patch, stage: current, busy: FieldValue.delete(), lastError: FieldValue.delete(), updatedAt: Date.now() });
  } catch (error) {
    const status = Number((error as { status?: number }).status) || 0;
    const message = status === 429 ? 'O Claude está com limite de uso no momento. Tente de novo em alguns minutos.'
      : status === 401 || status === 403 ? 'A chave do Claude foi recusada. Confira ANTHROPIC_API_KEY na Vercel.'
      : status === 413 ? 'A resposta ficou longa demais. Gere de novo; se repetir, simplifique as observações.'
      : status === 422 ? 'O Claude recusou este pedido. Revise as observações e os dados do cliente.'
      : error instanceof StudioValidationError ? 'A resposta veio incompleta. Gere de novo.'
      : 'Não foi possível concluir esta etapa agora. Gere de novo em instantes.';
    console.warn('[Criador de sites] Etapa interrompida.', { step: current, status, reason: error instanceof Error ? error.message.slice(0, 80) : 'unknown' });
    await ref.update({ busy: FieldValue.delete(), lastError: { step: current, message, at: Date.now() } });
    throw new StudioError(502, message);
  }
  return (await ref.get()).data();
}

async function upload(user: User, body: any) {
  await load(user, body?.id);
  if (!orderId(body?.assetId) || !['photo', 'logo'].includes(body?.kind) || typeof body?.data !== 'string' ||
    body.data.length > Math.ceil(ASSET_MAX_BYTES / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.data)) {
    throw new StudioError(400, 'Arquivo inválido. Selecione a imagem novamente.');
  }
  const data = Buffer.from(body.data, 'base64');
  if (data.length < 40 || data.length > ASSET_MAX_BYTES) throw new StudioError(400, 'A imagem precisa ter até 750 KB após a preparação.');
  let info;
  try { info = rasterInfo(data); } catch (error) { throw new StudioError(400, error instanceof ExpressAssetError ? error.message : 'Imagem inválida.'); }
  const name = text(body.name, 120).replace(/[/\\]/g, '') || 'imagem';
  const asset: StudioAsset = { id: body.assetId, kind: body.kind, name, ...info, url: `/api/studio?view=asset&id=${body.id}&asset=${body.assetId}` };
  const ref = projects().doc(body.id);
  await db().runTransaction(async tx => {
    const fresh = (await tx.get(ref)).data() as StudioProject;
    const others = fresh.assets.filter(item => item.id !== asset.id && (asset.kind !== 'logo' || item.kind !== 'logo'));
    if (asset.kind === 'photo' && others.filter(item => item.kind === 'photo').length >= MAX_PHOTOS) throw new StudioError(409, `Cada projeto aceita até ${MAX_PHOTOS} fotos.`);
    tx.set(files(body.id).doc(asset.id), { data, createdAt: Date.now() });
    tx.update(ref, { assets: [...others, asset], updatedAt: Date.now() });
  });
  return asset;
}

export default async function studio(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const view = req.query.view;
    if (req.method === 'GET' && view === 'asset') {
      if (!orderId(req.query.id) || !orderId(req.query.asset)) return res.status(400).end();
      const project = (await projects().doc(req.query.id).get()).data() as StudioProject | undefined;
      const asset = project?.assets.find(item => item.id === req.query.asset);
      const saved = asset ? (await files(req.query.id).doc(asset.id).get()).data() : null;
      if (!asset || !saved?.data) return res.status(404).end();
      res.setHeader('Content-Type', asset.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.status(200).send(Buffer.from(saved.data));
    }
    const user = await identify(req);
    if (req.method === 'GET' && view === 'me') return res.json({ allowed: Boolean(user), owner: user?.owner === true, claudeReady: claudeConfigured() });
    if (!user) return res.status(403).json({ error: 'Acesso ao criador de sites não liberado para esta conta.' });

    if (req.method === 'GET') {
      if (view === 'access') {
        if (!user.owner) return res.status(403).json({ error: 'Somente o dono da Atlas gerencia acessos.' });
        return res.json({ emails: (await accessDoc().get()).data()?.emails || [] });
      }
      if (view === 'projects') {
        const snapshot = await (user.owner ? projects().orderBy('updatedAt', 'desc').limit(100) : projects().where('ownerEmail', '==', user.email).limit(100)).get();
        const list: StudioProjectSummary[] = snapshot.docs.map(doc => {
          const project = doc.data() as StudioProject;
          return { id: doc.id, name: project.client.name, segment: project.client.segment, stage: project.stage, ownerEmail: project.ownerEmail, updatedAt: project.updatedAt };
        }).sort((a, b) => b.updatedAt - a.updatedAt);
        return res.json({ projects: list });
      }
      if (view === 'project') return res.json({ project: { ...(await load(user, req.query.id)), id: req.query.id } });
      return res.status(404).json({ error: 'Rota não encontrada.' });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não suportado.' });
    const body = req.body || {};
    const respond = async (id: string) => res.json({ project: { ...(await projects().doc(id).get()).data(), id } });
    switch (body.action) {
      case 'access': {
        if (!user.owner) return res.status(403).json({ error: 'Somente o dono da Atlas gerencia acessos.' });
        const email = text(body.email, 254).toLowerCase();
        if (!EMAIL.test(email) || email === ownerEmail()) return res.status(400).json({ error: 'Informe um e-mail válido.' });
        await accessDoc().set({ emails: body.allow === false ? FieldValue.arrayRemove(email) : FieldValue.arrayUnion(email) }, { merge: true });
        return res.json({ emails: (await accessDoc().get()).data()?.emails || [] });
      }
      case 'create': {
        const id = randomUUID();
        const now = Date.now();
        await projects().doc(id).create({ ownerEmail: user.email, stage: 'dados', client: sanitizeClient(body.client), assets: [], createdAt: now, updatedAt: now });
        return respond(id);
      }
      case 'client': {
        await load(user, body.id);
        await projects().doc(body.id).update({ client: sanitizeClient(body.client), updatedAt: Date.now() });
        return respond(body.id);
      }
      case 'upload': return res.json({ asset: await upload(user, body) });
      case 'removeAsset': {
        const project = await load(user, body.id);
        if (!orderId(body.assetId)) return res.status(400).json({ error: 'Arquivo inválido.' });
        await projects().doc(body.id).update({ assets: project.assets.filter(asset => asset.id !== body.assetId), updatedAt: Date.now() });
        await files(body.id).doc(body.assetId).delete();
        return respond(body.id);
      }
      case 'generate': {
        const project = await generate(user, body.id, body.step, body.feedback);
        return res.json({ project: { ...project, id: body.id } });
      }
      case 'briefing': {
        const project = await load(user, body.id);
        if (!project.briefing) return res.status(409).json({ error: 'Gere o briefing primeiro.' });
        let briefing: StudioBriefing;
        try { briefing = sanitizeBriefing(body.briefing); } catch { return res.status(400).json({ error: 'Preencha negócio, público e as três palavras de sensação.' }); }
        await projects().doc(body.id).update({ briefing, briefingApproved: body.approve === true, ...(body.approve === true ? {} : RESET.briefing), updatedAt: Date.now() });
        return respond(body.id);
      }
      case 'choose': {
        const project = await load(user, body.id);
        const ids = new Set((project.ideas || []).map(idea => idea.id));
        if (!ids.has(body.protagonistId)) return res.status(400).json({ error: 'Escolha a cena protagonista.' });
        const supportIds = (Array.isArray(body.supportIds) ? body.supportIds : []).filter((value: string) => ids.has(value) && value !== body.protagonistId).slice(0, 7);
        await projects().doc(body.id).update({ protagonistId: body.protagonistId, supportIds, directionApproved: false, updatedAt: Date.now() });
        return respond(body.id);
      }
      case 'approveDirection': {
        const project = await load(user, body.id);
        if (!project.direction) return res.status(409).json({ error: 'Gere a direção criativa primeiro.' });
        await projects().doc(body.id).update({ directionApproved: true, updatedAt: Date.now() });
        return respond(body.id);
      }
      case 'delete': {
        await load(user, body.id);
        const saved = await files(body.id).listDocuments();
        const batch = db().batch();
        saved.forEach(doc => batch.delete(doc));
        batch.delete(projects().doc(body.id));
        await batch.commit();
        return res.json({ ok: true });
      }
    }
    return res.status(400).json({ error: 'Ação inválida.' });
  } catch (error) {
    if (error instanceof StudioError) return res.status(error.status).json({ error: error.message });
    console.error('[Criador de sites]', req.query.view, req.body?.action, error instanceof Error ? error.name : 'unknown');
    return res.status(503).json({ error: 'Não conseguimos concluir agora. Tente novamente em instantes.' });
  }
}
