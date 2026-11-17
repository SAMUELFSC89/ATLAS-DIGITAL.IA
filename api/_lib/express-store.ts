import { createHash } from 'node:crypto';
import { getFirestoreAdmin } from '../db-helper.js';
import { EXPRESS_HOURS, expressDate, expressMoney, type ExpressOrder } from '../../src/lib/expressOrder.js';
import { sendExpressEmail } from './express-providers.js';

export const orderId = (value: unknown): value is string => typeof value === 'string' &&
  /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value);
export const db = getFirestoreAdmin;
export const orders = () => db().collection('expressOrders');
export const previews = () => db().collection('expressPreviews');
export const settings = () => db().collection('expressInternal').doc('settings');
export const saoPauloDay = (ms: number) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(ms);
export const defaultCapacity = 3;

export function checkoutEnabled() {
  return Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() && process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim() &&
    process.env.RESEND_API_KEY?.trim() && process.env.ATLAS_EXPRESS_FROM_EMAIL?.trim());
}

export function publicOrigin() {
  return process.env.ATLAS_EXPRESS_PUBLIC_ORIGIN?.trim().replace(/\/$/, '') || 'https://atlasdigital.ia.br';
}

export async function rateLimit(ip: string, action: string, perIp: number, total: number) {
  const hour = Math.floor(Date.now() / 3600000);
  const hash = createHash('sha256').update(ip).digest('hex');
  const collection = db().collection('expressLimits');
  const global = collection.doc(`${action}-${hour}`);
  const client = global.collection('clients').doc(hash);
  return db().runTransaction(async tx => {
    const [all, own] = await tx.getAll(global, client);
    const globalCount = all.data()?.count || 0;
    const clientCount = own.data()?.count || 0;
    if (globalCount >= total || clientCount >= perIp) return false;
    const expiresAt = new Date((hour + 2) * 3600000);
    tx.set(global, { count: globalCount + 1, expiresAt });
    tx.set(client, { count: clientCount + 1, expiresAt });
    return true;
  });
}

export async function sendReceipt(id: string, order: ExpressOrder) {
  if (!order.dueAt || order.receiptSentAt) return;
  await sendExpressEmail(order.email, 'Pedido confirmado · Atlas Digital',
    [
      `O pagamento do Site Express para ${order.business.name} foi confirmado.`,
      `Pedido ${id} · ${expressMoney(order.amount)}`,
      `Entrega até ${expressDate(order.dueAt)} (horário de Brasília).`,
      `Acompanhe seu pedido em ${publicOrigin()}/site-express?pedido=${id}`,
    ].join('\n\n'), `express-receipt/${id}`);
  await orders().doc(id).update({ receiptSentAt: Date.now() });
}

export async function sendDelivery(id: string, finalUrl: string, resend: boolean) {
  const ref = orders().doc(id);
  const attempt = await db().runTransaction(async tx => {
    const order = (await tx.get(ref)).data();
    if (!order || (resend ? order.status !== 'delivered' : !['paid', 'production'].includes(order.status))) return null;
    const now = Date.now();
    if (order.deliveryLeaseUntil > now) return null;
    const pending = order.deliveryAttempt;
    if (pending && pending.url !== finalUrl) return null;
    const version = pending?.version || (order.deliveryVersion || 0) + 1;
    tx.update(ref, { deliveryLeaseUntil: now + 30000, deliveryAttempt: { url: finalUrl, version } });
    return { email: order.email, name: order.business.name, version };
  });
  if (!attempt) return false;

  try {
    await sendExpressEmail(attempt.email, 'Seu site está pronto · Atlas Digital',
      [`O site de ${attempt.name} está pronto.`, finalUrl, `Pedido ${id}`].join('\n\n'),
      `express-delivery/${id}/${attempt.version}`);
  } catch (error) {
    await ref.update({ deliveryLeaseUntil: 0 });
    throw error;
  }
  await db().runTransaction(async tx => {
    const current = (await tx.get(ref)).data();
    if (current?.deliveryAttempt?.version !== attempt.version) return;
    tx.update(ref, { ...(current.status === 'refunded' ? {} : { status: 'delivered' }),
      finalUrl, deliveredAt: current.deliveredAt || Date.now(), lastEmailAt: Date.now(),
      deliveryVersion: attempt.version, deliveryAttempt: null, deliveryLeaseUntil: 0 });
  });
  return true;
}

export function dueDate(approvedAt: number) {
  return approvedAt + EXPRESS_HOURS * 3600000;
}
