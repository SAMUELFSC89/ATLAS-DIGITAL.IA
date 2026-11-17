import { verifyExpressSignature } from './express-providers.js';
import { db, dueDate, orderId, orders, sendReceipt } from './express-store.js';
import type { ExpressOrder } from '../../src/lib/expressOrder.js';

export default async function expressWebhook(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  const secret = process.env.STRIPE_EXPRESS_WEBHOOK_SECRET?.trim();
  const signature = req.headers?.['stripe-signature'];
  if (!secret) return res.status(503).end();
  if (typeof signature !== 'string') return res.status(400).end();

  const chunks: Buffer[] = [];
  let size = 0;
  try {
    for await (const chunk of req) {
      const part = Buffer.from(chunk);
      size += part.length;
      if (size > 1024 * 1024) return res.status(413).end();
      chunks.push(part);
    }
  } catch { return res.status(400).end(); }
  const raw = Buffer.concat(chunks);
  if (!verifyExpressSignature(raw, signature, secret)) return res.status(400).end();

  try {
    const event = JSON.parse(raw.toString('utf8'));
    const session = event.data?.object;
    if (event.type === 'charge.refunded' && session?.refunded && typeof session.payment_intent === 'string') {
      const matches = await orders().where('stripePaymentIntent', '==', session.payment_intent).limit(1).get();
      if (!matches.empty) await matches.docs[0].ref.update({ status: 'refunded', refundedAt: Date.now() });
      return res.json({ received: true });
    }
    if (!['checkout.session.completed', 'checkout.session.expired'].includes(event.type)) return res.json({ received: true });
    const id = session?.metadata?.atlas_express_order;
    if (!orderId(id)) return res.json({ received: true });
    if (event.type === 'checkout.session.completed' && session.payment_status !== 'paid') return res.json({ received: true });

    const ref = orders().doc(id);
    const updated = await db().runTransaction(async tx => {
      const order = (await tx.get(ref)).data();
      if (!order || event.livemode !== (order.mode === 'live') || session.client_reference_id !== id ||
          (order.stripeSessionId && order.stripeSessionId !== session.id)) return null;
      if (event.type === 'checkout.session.expired') {
        if (order.status === 'pending') tx.update(ref, { status: 'expired' });
        return null;
      }
      if (session.amount_total !== order.amount || session.currency !== 'brl' || typeof event.created !== 'number' ||
          typeof session.payment_intent !== 'string') throw new Error('Payment does not match order');
      if (order.status === 'refunded') return null;
      if (order.status !== 'pending') return order as ExpressOrder;
      const patch = { status: 'paid' as const, paidAt: event.created * 1000, dueAt: dueDate(event.created),
        stripeSessionId: session.id, stripePaymentIntent: session.payment_intent };
      tx.update(ref, patch);
      return { ...(order as ExpressOrder), id, ...patch };
    });
    if (updated) await sendReceipt(id, updated);
    return res.json({ received: true });
  } catch (error) {
    console.error('[Site Express Webhook]', error instanceof Error ? error.name : 'unknown');
    return res.status(503).end();
  }
}
