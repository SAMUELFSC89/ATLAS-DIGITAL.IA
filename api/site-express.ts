import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { getAuthenticatedEmail } from './radar.js';
import { normalizeBrazilianWhatsApp } from '../src/lib/contact.js';
import { EXPRESS_PRICE, type ExpressBusiness, type ExpressOrder } from '../src/lib/expressOrder.js';
import { findExpressPlace, generateExpressContent, publicUrl, stripeRequest } from './_lib/express-providers.js';
import { checkoutEnabled, db, defaultCapacity, orderId, orders, previews, publicOrigin, rateLimit, saoPauloDay, sendDelivery, sendReceipt, settings } from './_lib/express-store.js';

const clean = (value: unknown, length: number) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, length) : '';
const canBuy = (mode: string) => mode === 'live' || mode === 'test';

async function startCheckout(req: Request, res: Response) {
  const { previewId, id, email, acceptsScope } = req.body || {};
  const mode = process.env.ATLAS_EXPRESS_CHECKOUT_MODE?.trim() || '';
  if (!checkoutEnabled() || !canBuy(mode)) return res.status(503).json({ error: 'A compra online ainda não está disponível. Fale com a Atlas.' });
  const secret = process.env.STRIPE_SECRET_KEY!.trim();
  if ((mode === 'live' && !secret.startsWith('sk_live_') && !secret.startsWith('rk_live_')) ||
      (mode === 'test' && !secret.startsWith('sk_test_') && !secret.startsWith('rk_test_'))) {
    return res.status(503).json({ error: 'Checkout indisponível no momento.' });
  }
  if (!orderId(previewId) || !orderId(id) || typeof email !== 'string' || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || acceptsScope !== true) {
    return res.status(400).json({ error: 'Confira o e-mail de entrega e confirme as condições do pacote.' });
  }

  const ref = orders().doc(id);
  const now = Date.now();
  const day = saoPauloDay(now);
  const selected = await db().runTransaction(async tx => {
    const existing = (await tx.get(ref)).data();
    if (existing) {
      if (existing.previewId === previewId && existing.status === 'expired') return { reason: 'expired' } as const;
      if (existing.previewId !== previewId || existing.email !== email || existing.status !== 'pending' || existing.mode !== mode) {
        return { reason: 'conflict' } as const;
      }
      return { expiresAt: existing.expiresAt as number, existingUrl: existing.checkoutUrl as string | undefined };
    }
    const [draftSnapshot, configSnapshot] = await tx.getAll(previews().doc(previewId), settings());
    const preview = draftSnapshot.data();
    if (!preview) return { reason: 'invalid' } as const;
    const existingForPreview = await tx.get(orders().where('previewId', '==', previewId));
    if (existingForPreview.docs.some(doc => doc.data().mode === mode && !['expired', 'refunded'].includes(doc.data().status))) {
      return { reason: 'conflict' } as const;
    }
    const capacity = configSnapshot.data()?.capacity ?? defaultCapacity;
    const slots = await tx.get(orders().where('reservedDay', '==', day));
    if (slots.docs.filter(doc => doc.data().mode === mode && !['expired', 'refunded'].includes(doc.data().status)).length >= capacity) {
      return { reason: 'full' } as const;
    }
    const expiresAt = Math.floor(now / 1000) + 40 * 60;
    tx.set(settings(), { lastReservationAt: now }, { merge: true });
    tx.create(ref, {
      previewId, email, business: preview.business, status: 'pending', mode,
      amount: EXPRESS_PRICE, createdAt: now, reservedDay: day, expiresAt,
    });
    return { expiresAt, existingUrl: undefined };
  });
  if ('reason' in selected) {
    if (selected.reason === 'expired') return res.status(409).json({ error: 'Este checkout expirou. Tente novamente.' });
    if (selected.reason === 'invalid') return res.status(404).json({ error: 'Esta prévia não foi encontrada.' });
    if (selected.reason === 'full') return res.status(409).json({ error: 'As vagas Express de hoje estão preenchidas. Volte amanhã ou consulte a Atlas pelo WhatsApp.' });
    return res.status(409).json({ error: 'Já existe uma tentativa de compra para esta prévia. Use o checkout já aberto ou fale com a Atlas.' });
  }
  if (selected.expiresAt <= now / 1000) {
    return res.status(409).json({ error: 'Este checkout expirou. Atualize a página e tente novamente.' });
  }
  if (selected.existingUrl) return res.json({ url: selected.existingUrl });
  if (selected.expiresAt - Math.floor(now / 1000) < 31 * 60) {
    return res.status(409).json({ error: 'A tentativa anterior não foi concluída. Fale com a Atlas para retomar seu pedido.' });
  }

  const base = publicOrigin() + '/site-express';
  const session = await stripeRequest('checkout/sessions', new URLSearchParams({
    mode: 'payment', 'payment_method_types[0]': 'card', customer_email: email,
    'line_items[0][price_data][currency]': 'brl',
    'line_items[0][price_data][unit_amount]': String(EXPRESS_PRICE),
    'line_items[0][price_data][product_data][name]': 'Atlas Digital · Site Express',
    'line_items[0][quantity]': '1',
    'metadata[atlas_express_order]': id, client_reference_id: id,
    expires_at: String(selected.expiresAt),
    success_url: `${base}?pedido=${id}`,
    cancel_url: `${base}?previa=${previewId}`,
  }), `atlas-express-${id}`);
  if (!/^cs_(test|live)_\w+$/.test(session.id) || !publicUrl(session.url)) throw new Error('Invalid Stripe session');
  await ref.update({ stripeSessionId: session.id, checkoutUrl: session.url });
  return res.json({ url: session.url });
}

async function admin(req: Request, res: Response) {
  const email = await getAuthenticatedEmail(req, true);
  const owner = (process.env.ATLAS_CONTACT_OWNER_EMAIL || 'samuelfsc89@gmail.com').trim().toLowerCase();
  if (!email || email.toLowerCase() !== owner) return res.status(403).json({ error: 'Área restrita à conta verificada da Atlas.' });
  if (req.method === 'GET') {
    const [snapshots, config] = await Promise.all([
      orders().orderBy('createdAt', 'desc').limit(100).get(), settings().get(),
    ]);
    return res.json({ orders: snapshots.docs.map(doc => {
      const { previewId, business, email, status, amount, createdAt, dueAt, receiptSentAt, deliveredAt, finalUrl, mode, deliveryAttempt } = doc.data();
      return { id: doc.id, previewId, business, email, status, amount, createdAt, dueAt, receiptSentAt, deliveredAt, finalUrl, mode, deliveryUrl: deliveryAttempt?.url };
    }), capacity: config.data()?.capacity ?? defaultCapacity });
  }
  if (req.method !== 'POST') return res.status(405).end();
  const { id, action, capacity } = req.body || {};
  if (action === 'capacity') {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 30) return res.status(400).json({ error: 'Defina de 1 a 30 vagas por dia.' });
    await settings().set({ capacity }, { merge: true });
    return res.json({ ok: true });
  }
  if (!orderId(id)) return res.status(400).json({ error: 'Pedido inválido.' });
  const ref = orders().doc(id);
  if (action === 'production') {
    const changed = await db().runTransaction(async tx => {
      if ((await tx.get(ref)).data()?.status !== 'paid') return false;
      tx.update(ref, { status: 'production' });
      return true;
    });
    return changed ? res.json({ ok: true }) : res.status(409).json({ error: 'A produção só começa em um pedido pago.' });
  }
  if (action === 'receipt') {
    const order = (await ref.get()).data() as ExpressOrder | undefined;
    if (!order || !['paid', 'production', 'delivered'].includes(order.status)) return res.status(409).json({ error: 'Pedido sem pagamento confirmado.' });
    await sendReceipt(id, order);
    return res.json({ ok: true });
  }
  if (action === 'deliver' || action === 'resend') {
    const finalUrl = publicUrl(action === 'resend' ? (await ref.get()).data()?.finalUrl : req.body.finalUrl);
    if (!finalUrl) return res.status(400).json({ error: 'Informe o link HTTPS do site final.' });
    const sent = await sendDelivery(id, finalUrl, action === 'resend');
    return sent ? res.json({ ok: true }) : res.status(409).json({ error: 'Confira o estado do pedido e o link da entrega anterior.' });
  }
  return res.status(400).json({ error: 'Ação inválida.' });
}

export default async function siteExpress(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const view = req.query.view;
    if (view === 'admin') return await admin(req, res);
    if (req.method === 'GET') {
      if (view === 'config') return res.json({ checkout: checkoutEnabled() && canBuy(process.env.ATLAS_EXPRESS_CHECKOUT_MODE || ''),
        sandbox: process.env.ATLAS_EXPRESS_CHECKOUT_MODE === 'test' });
      if (!orderId(req.query.id)) return res.status(400).json({ error: 'Link inválido.' });
      if (view === 'order') {
        const order = (await orders().doc(req.query.id).get()).data();
        if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });
        return res.json({ status: order.status, dueAt: order.dueAt, deliveredAt: order.deliveredAt });
      }
      const preview = (await previews().doc(req.query.id).get()).data();
      if (!preview) return res.status(404).json({ error: 'Prévia não encontrada.' });
      return res.json({ ...preview, id: req.query.id });
    }
    if (req.method !== 'POST') return res.status(405).end();
    if (view !== 'checkout' && view !== 'lookup' && view !== 'generate') return res.status(400).json({ error: 'Ação inválida.' });
    const forwarded = req.headers['x-vercel-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown';
    if (!(await rateLimit(ip, view, view === 'checkout' ? 16 : 6, view === 'checkout' ? 100 : 40))) {
      return res.status(429).json({ error: 'Limite temporário atingido. Tente novamente mais tarde.' });
    }
    if (view === 'checkout') return await startCheckout(req, res);
    if (view === 'lookup') {
      const place = await findExpressPlace(clean(req.body?.googleLink, 800)).catch(() => null);
      return place ? res.json(place) : res.status(404).json({ error: 'Não conseguimos identificar o perfil. Preencha os dados manualmente para continuar.' });
    }
    const input = req.body?.business;
    const whatsapp = normalizeBrazilianWhatsApp(clean(input?.whatsapp, 30));
    const business: ExpressBusiness = {
      name: clean(input?.name, 100), city: clean(input?.city, 100), segment: clean(input?.segment, 80),
      services: clean(input?.services, 500), whatsapp, photo: publicUrl(input?.photo),
    };
    if (!business.name || !business.city || !business.segment || !business.services || !whatsapp ||
        (input?.photo && !business.photo)) {
      return res.status(400).json({ error: 'Confira os campos e use um WhatsApp brasileiro com DDD. Para foto, informe um link HTTPS.' });
    }
    if (!process.env.GEMINI_API_KEY?.trim()) return res.status(503).json({ error: 'O gerador está indisponível no momento.' });
    const content = await generateExpressContent(business);
    const id = randomUUID();
    await previews().doc(id).create({ business, ...content, createdAt: Date.now() });
    return res.json({ id, business, ...content });
  } catch (error) {
    console.error('[Site Express]', req.query.view, error instanceof Error ? error.name : 'unknown');
    return res.status(503).json({ error: 'Não conseguimos concluir agora. Tente novamente em instantes.' });
  }
}
