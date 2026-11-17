import { mercadoPagoRequest } from './express-providers.js';
import { db, dueDate, orderId, orders, sendReceipt } from './express-store.js';
import type { ExpressOrder } from '../../src/lib/expressOrder.js';

export async function recordExpressPayment(payment: any, expectedId?: string): Promise<ExpressOrder | null> {
  const id = payment.external_reference;
  const paymentId = String(payment.id);
  if (!orderId(id) || (expectedId && expectedId !== id) || !/^\d{1,25}$/.test(paymentId) ||
      !['approved', 'refunded', 'charged_back'].includes(payment.status)) return null;

  const ref = orders().doc(id);
  return db().runTransaction(async tx => {
    const order = (await tx.get(ref)).data();
    if (!order || order.provider !== 'mercadopago' ||
        !['test', 'live'].includes(order.mode) ||
        (order.mode === 'live' && payment.live_mode !== true) ||
        (order.mode === 'test' && process.env.ATLAS_EXPRESS_CHECKOUT_MODE?.trim() !== 'test')) return null;
    if (order.mercadoPagoPaymentId && order.mercadoPagoPaymentId !== paymentId) return null;
    if (payment.currency_id !== 'BRL' || Math.round(Number(payment.transaction_amount) * 100) !== order.amount) return null;
    if (payment.status === 'refunded' || payment.status === 'charged_back') {
      tx.update(ref, { status: 'refunded', refundedAt: Date.now(), mercadoPagoPaymentId: paymentId });
      return null;
    }
    if (order.status === 'refunded') return null;
    if (order.status !== 'pending') return { ...order, id } as ExpressOrder;
    const approvedAt = Date.parse(payment.date_approved);
    if (!Number.isFinite(approvedAt)) throw new Error('Missing payment approval timestamp');
    const patch = { status: 'paid' as const, paidAt: approvedAt, dueAt: dueDate(approvedAt), mercadoPagoPaymentId: paymentId };
    tx.update(ref, patch);
    return { ...(order as ExpressOrder), id, ...patch };
  });
}

export async function reconcileExpressPayment(id: string) {
  const ref = orders().doc(id);
  const now = Date.now();
  const claimed = await db().runTransaction(async tx => {
    const order = (await tx.get(ref)).data();
    if (!order || order.status !== 'pending' || order.provider !== 'mercadopago' ||
        order.mode !== process.env.ATLAS_EXPRESS_CHECKOUT_MODE?.trim() || !['test', 'live'].includes(order.mode) ||
        !order.mercadoPagoPreferenceId || now - order.createdAt > 24 * 3600000 ||
        now < (order.nextPaymentCheckAt || 0)) return false;
    tx.update(ref, { nextPaymentCheckAt: now + 30000 });
    return true;
  });
  if (!claimed) return null;
  const filter = new URLSearchParams({ external_reference: id, sort: 'date_created', criteria: 'desc', limit: '10' });
  const search = await mercadoPagoRequest('v1/payments/search?' + filter);
  for (const candidate of Array.isArray(search.results) ? search.results : []) {
    const order = await recordExpressPayment(candidate, id);
    if (order) {
      try { await sendReceipt(id, order); }
      catch { console.warn('[Site Express] Falha ao enviar a confirmação do pedido.'); }
      return order;
    }
  }
  return null;
}
