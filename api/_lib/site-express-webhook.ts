import { mercadoPagoRequest, verifyMercadoPagoSignature } from './express-providers.js';
import { orderId, sendReceipt } from './express-store.js';
import { recordExpressPayment } from './express-payment.js';

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
      typeof signature !== 'string' || typeof requestId !== 'string') {
    console.warn('[Site Express Webhook] Parâmetro ou cabeçalho de autenticação ausente.', {
      paymentId: typeof paymentId === 'string' && /^\d{1,25}$/.test(paymentId),
      signature: typeof signature === 'string', requestId: typeof requestId === 'string',
    });
    return res.status(401).end();
  }
  if (!verifyMercadoPagoSignature(paymentId, requestId, signature, secret)) {
    console.warn('[Site Express Webhook] O Mercado Pago enviou uma assinatura inválida.');
    return res.status(401).end();
  }

  try {
    // The signed notification identifies the payment. All financial data comes from the authenticated API.
    const payment = await mercadoPagoRequest('v1/payments/' + paymentId);
    const id = payment.external_reference;
    if (!orderId(id) || String(payment.id) !== paymentId) return res.status(200).end();
    const updated = await recordExpressPayment(payment);
    if (updated) await sendReceipt(id, updated);
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Site Express Mercado Pago]', error instanceof Error ? error.name : 'unknown');
    return res.status(503).end();
  }
}
