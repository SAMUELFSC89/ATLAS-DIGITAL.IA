import crypto from "crypto";
import { safeEqual } from "./_lib/auth.ts";
import { handleIncomingWebhookMessage } from "./whatsapp-service.ts";

const MAX_BODY_BYTES = 1024 * 1024;

/**
 * Corpo exatamente como a Meta enviou, necessário para conferir a assinatura.
 * No Express ele é guardado em req.rawBody (ver server.ts); na Vercel o corpo
 * continua disponível para leitura no próprio request.
 */
async function readRawBody(req: any): Promise<Buffer | null> {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (typeof req.rawBody === "string") return Buffer.from(req.rawBody);
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const timer = setTimeout(() => resolve(null), 5000);
    const finish = (value: Buffer | null) => {
      clearTimeout(timer);
      resolve(value);
    };
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) return finish(null);
      chunks.push(Buffer.from(chunk));
    });
    req.on("end", () => finish(Buffer.concat(chunks)));
    req.on("error", () => finish(null));
  });
}

function hasValidSignature(rawBody: Buffer, header: unknown, appSecret: string): boolean {
  if (typeof header !== "string" || !header.startsWith("sha256=")) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  return safeEqual(header, expected);
}

export default async function handler(req: any, res: any) {
  // Verificação do endereço feita pela Meta ao cadastrar o webhook
  if (req.method === "GET") {
    const verifyToken = process.env.META_VERIFY_TOKEN;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (!verifyToken) {
      console.error("[Webhook] META_VERIFY_TOKEN não está configurado; verificação recusada.");
      return res.status(403).end();
    }
    if (mode === "subscribe" && typeof token === "string" && safeEqual(token, verifyToken)) {
      res.setHeader("Content-Type", "text/plain");
      return res.status(200).send(String(challenge ?? ""));
    }
    return res.status(403).end();
  }

  if (req.method === "POST") {
    const appSecret = process.env.META_CLIENT_SECRET;
    if (!appSecret) {
      console.error("[Webhook] META_CLIENT_SECRET não está configurado; evento recusado.");
      return res.status(503).json({ error: "Webhook não configurado." });
    }

    // Só a Meta conhece o App Secret, então só ela consegue assinar o corpo.
    const rawBody = await readRawBody(req);
    if (!rawBody || !hasValidSignature(rawBody, req.headers["x-hub-signature-256"], appSecret)) {
      console.warn("[Webhook] Evento recusado: assinatura X-Hub-Signature-256 ausente ou inválida.");
      return res.status(401).json({ error: "Assinatura inválida." });
    }

    let body: any;
    try {
      body = JSON.parse(rawBody.toString("utf-8"));
    } catch {
      return res.status(400).json({ error: "Corpo inválido." });
    }

    const result = await handleIncomingWebhookMessage(body);
    return res.status(200).json({ status: "success", processed: result.processed });
  }

  return res.status(405).end();
}
