import { createHmac, timingSafeEqual } from 'node:crypto';
import { handleIncomingWebhookMessage } from './whatsapp-service.js';

const MAX_BODY_BYTES = 1024 * 1024;

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query || {};
    const expected = process.env.META_VERIFY_TOKEN?.trim() || 'atlasdigital';
    if (mode !== 'subscribe' || token !== expected || typeof challenge !== 'string') return res.status(403).end();
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(challenge);
  }
  if (req.method !== 'POST') return res.status(405).end();

  const secret = process.env.META_APP_SECRET?.trim() || process.env.META_CLIENT_SECRET?.trim();
  if (!secret) return res.status(503).end();
  const signature = req.headers?.['x-hub-signature-256'];
  if (typeof signature !== 'string' || !/^sha256=[a-f0-9]{64}$/i.test(signature)) return res.status(401).end();
  let body: Buffer;
  try {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      const bytes = Buffer.from(chunk);
      size += bytes.length;
      if (size > MAX_BODY_BYTES) return res.status(413).end();
      chunks.push(bytes);
    }
    body = Buffer.concat(chunks);
  } catch {
    return res.status(400).end();
  }
  const expected = createHmac('sha256', secret).update(body).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex'))) return res.status(401).end();

  let payload: unknown;
  try {
    payload = JSON.parse(body.toString('utf8'));
  } catch {
    return res.status(400).end();
  }
  try {
    const result = await handleIncomingWebhookMessage(payload);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[WhatsApp Webhook] Falha ao gravar evento:', error instanceof Error ? error.name : 'unknown');
    return res.status(503).end();
  }
}
