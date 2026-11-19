import { getFirestoreAdmin } from './db-helper.js';
import { CONTACT_CAMPAIGN_KEYS, normalizeBrazilianWhatsApp, type ContactCampaign } from '../src/lib/contact.js';
import type { Request, Response } from 'express';

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function handler(req: Request, res: Response) {
  // Compatibility only: normal traffic uses dedicated Vercel functions.
  if (req.query?.expressEndpoint === 'site') {
    const {default:siteExpress}=await import('./_lib/site-express.js');
    return siteExpress(req,res);
  }
  if (req.query?.expressEndpoint === 'webhook') {
    const {default:expressWebhook}=await import('./_lib/site-express-webhook.js');
    return expressWebhook(req,res);
  }
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não suportado.' });
  }
  const contentType = req.headers['content-type']?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    return res.status(415).json({ error: 'Formato de envio inválido.' });
  }

  const body = req.body;
  const id = text(body?.id);
  const name = text(body?.name);
  const email = text(body?.email);
  const rawWhatsApp = text(body?.whatsapp);
  const whatsapp = rawWhatsApp.length <= 24 ? normalizeBrazilianWhatsApp(rawWhatsApp) : '';
  if (!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(id)) {
    return res.status(400).json({ error: 'Envio inválido. Recarregue a página e tente novamente.' });
  }
  if (name.length < 2 || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name) ||
      email.length > 254 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email) || !whatsapp) {
    return res.status(400).json({ error: 'Confira seu nome, e-mail e número de WhatsApp com DDD.' });
  }
  if (text(body?.website)) {
    return res.status(400).json({ error: 'Não foi possível enviar seu contato. Recarregue a página e tente novamente.' });
  }

  const campaign: ContactCampaign = {};
  for (const key of CONTACT_CAMPAIGN_KEYS) {
    const value = text(body?.campaign?.[key]);
    if (value) campaign[key] = value.slice(0, 200);
  }

  try {
    const contact = getFirestoreAdmin().collection('siteContacts').doc(id);
    try {
      await contact.create({ name, email, whatsapp, campaign, createdAt: new Date().toISOString() });
    } catch (error) {
      if ((error as { code?: number })?.code !== 6) throw error;
      // A retry after a lost response may have already committed this request.
      const saved = (await contact.get()).data();
      if (saved?.name !== name || saved.email !== email || saved.whatsapp !== whatsapp) {
        return res.status(409).json({ error: 'Tente enviar seu contato novamente.' });
      }
    }
    return res.status(200).json({ ok: true });
  } catch {
    console.error('[Contato] Falha ao gravar no Firestore.');
    return res.status(503).json({ error: 'Não conseguimos salvar seu contato agora. Tente novamente em instantes.' });
  }
}
