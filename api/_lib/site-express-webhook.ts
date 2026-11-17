import { mercadoPagoRequest, verifyMercadoPagoSignature } from './express-providers.js';
import { db, dueDate, orderId, orders, sendReceipt } from './express-store.js';
import type { ExpressOrder } from '../../src/lib/expressOrder.js';

export default async function expressWebhook(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
  if (!secret || !process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim()) return res.status(503).end();

  const query = new URL(req.url || '/', 'https://atlasdigital.ia.br').searchParams;
  const topic = query.get('type') || req.query?.type;
  if (topic !== 'payment') return res.status(200).end();
  const paymentId = query.get('data.id') || req.query?.['data.id'];
  const signature = req.headers?.['x-signature'];
  const requestId = req.headers?.['x-request-id'];
  if (typeof paymentId !== 'string' || !/^\d{1,25}$/.test(paymentId) ||
      typeof signature !== 'string' || typeof requestId !== 'string' ||
      !verifyMercadoPagoSignature(paymentId, requestId, signature, secret)) return res.status(401).end();

  try {
    // The signed notification identifies the payment. All financial data comes from the authenticated API.
    const payment = await mercadoPagoRequest('v1/payments/' + paymentId);
    const id = payment.external_reference;
    if (!orderId(id) || String(payment.id) !== paymentId) return res.status(200).end();
    if (!['approved', 'refunded', 'charged_back'].includes(payment.status)) return res.status(200).end();

    const ref = orders().doc(id);
    const updated = await db().runTransaction(async tx => {
      const order = (await tx.get(ref)).data();
      if (!order || order.provider !== 'mercadopago' || payment.live_mode !== (order.mode === 'live')) return null;
      if (order.mercadoPagoPaymentId && order.mercadoPagoPaymentId !== paymentId) return null;
      if (payment.currency_id !== 'BRL' || Math.round(Number(payment.transaction_amount) * 100) !== order.amount) return null;
      if (payment.status === 'refunded' || payment.status === 'charged_back') {
        tx.update(ref, { status: 'refunded', refundedAt: Date.now(), mercadoPagoPaymentId: paymentId });
        return null;
      }
      if (order.status === 'refunded') return null;
      if (order.status !== 'pending') return order as ExpressOrder;
      const approvedAt = Date.parse(payment.date_approved);
      if (!Number.isFinite(approvedAt)) throw new Error('Missing payment approval timestamp');
      const patch = { status: 'paid' as const, paidAt: approvedAt, dueAt: dueDate(approvedAt), mercadoPagoPaymentId: paymentId };
      tx.update(ref, patch);
      return { ...(order as ExpressOrder), id, ...patch };
    });
    if (updated) await sendReceipt(id, updated);
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Site Express Mercado Pago]', error instanceof Error ? error.name : 'unknown');
    return res.status(503).end();
  }
}
