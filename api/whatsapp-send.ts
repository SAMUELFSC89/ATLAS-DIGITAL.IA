import { getWhatsAppConnectionInfo, sendWhatsAppTemplate } from "./whatsapp-service.js";
import type { PositioningSnapshot } from "../src/lib/positioningPdf.js";
import { scoreForLocalPosition } from "./radar.js";
import { recordCrmInteraction } from "./crm-store.js";

const MAX_PARAM_LENGTH = 300;

// Chave pública do app web do Firebase (a mesma que já vai no navegador).
const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || "AIzaSyCqIc_q1LJLCtPLtlB0j_daTwvyCP7XkrE";

/**
 * Confere o token de login do Firebase no serviço do Google e devolve o e-mail
 * do usuário. Usa apenas fetch, para não depender de nenhuma biblioteca no servidor.
 */
async function getAuthenticatedEmail(req: any): Promise<string | null> {
  const header: string = req.headers?.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;
  try {
    const origin: string = req.headers?.origin || (req.headers?.host ? `https://${req.headers.host}` : "");
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(origin ? { Referer: `${origin}/` } : {}) },
      body: JSON.stringify({ idToken: match[1] }),
    });
    if (!response.ok) return null;
    const data: any = await response.json();
    return data?.users?.[0]?.email || null;
  } catch (err) {
    console.warn("[Auth] Não foi possível conferir o login:", (err as Error).message);
    return null;
  }
}

function applyCors(res: any): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function parsePositioningSnapshot(input: unknown): PositioningSnapshot | undefined {
  if (!input || typeof input !== "object") return;
  const raw = input as Partial<PositioningSnapshot>;
  const cleanText = (value: unknown, limit: number) => typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, limit)
    : "";
  const companyName = cleanText(raw.companyName, 180);
  const city = cleanText(raw.city, 90);
  if (!companyName || !city) return;
  const reviewsCount = raw.reviewsCount;
  const local = raw.localSearch;
  const query = cleanText(local?.query, 240);
  const position = local?.position;
  const score = local?.score;
  const checkedAt = cleanText(local?.checkedAt, 30);
  const hasPosition = typeof position === "number" && Number.isInteger(position) && position >= 1 && position <= 60;
  const hasScore = typeof score === "number" && hasPosition && score === scoreForLocalPosition(position);
  return {
    companyName,
    city,
    state: cleanText(raw.state, 2),
    hasGoogleProfile: raw.hasGoogleProfile === true,
    hasWebsite: raw.hasWebsite === true,
    hasHttpsWebsite: raw.hasHttpsWebsite === true,
    hasSocialProfile: raw.hasSocialProfile === true,
    hasPublicPhone: raw.hasPublicPhone === true,
    hasConfirmedWhatsApp: raw.hasConfirmedWhatsApp === true,
    rating: typeof raw.rating === "number" && raw.rating >= 1 && raw.rating <= 5 ? raw.rating : null,
    reviewsCount: typeof reviewsCount === "number" && Number.isSafeInteger(reviewsCount) && reviewsCount > 0 ? reviewsCount : 0,
    localSearch: hasPosition && hasScore && query && Number.isFinite(Date.parse(checkedAt))
      ? { query, position, score, checkedAt, resultsChecked: null }
      : undefined,
  };
}

/**
 * GET  -> situação da conexão e modelos aprovados da empresa logada.
 * POST -> envia um modelo aprovado para um único número. O painel chama uma
 *         vez por destinatário, com intervalo, para respeitar o ritmo da Meta.
 */
export default async function handler(req: any, res: any) {
  applyCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  // A empresa é sempre a do login verificado, nunca um valor enviado pelo navegador.
  const email = await getAuthenticatedEmail(req);
  if (!email) {
    return res.status(401).json({ code: "unauthenticated", error: "Sessão expirada. Saia e entre novamente." });
  }

  try {
    if (req.method === "GET") {
      return res.status(200).json(await getWhatsAppConnectionInfo(email));
    }

    if (req.method === "POST") {
      const { to, templateName, languageCode, bodyParams, positioning, companyName } = req.body || {};
      const digits = String(to || "").replace(/\D/g, "");
      if (digits.length < 12 || digits.length > 15) {
        return res.status(400).json({ success: false, error: "Número de destino inválido." });
      }
      if (!templateName || typeof templateName !== "string") {
        return res.status(400).json({ success: false, error: "Escolha um modelo de mensagem aprovado." });
      }
      const params: string[] = Array.isArray(bodyParams)
        ? bodyParams.slice(0, 10).map((value) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_PARAM_LENGTH) || "-")
        : [];

      const snapshot = parsePositioningSnapshot(positioning);
      if (positioning !== undefined && !snapshot) {
        return res.status(400).json({ success: false, error: "Dados insuficientes para gerar o PDF de posicionamento." });
      }

      const result = await sendWhatsAppTemplate(email, digits, templateName, String(languageCode || "pt_BR"), params, snapshot);
      if (result.success && !result.simulated && result.messageId) {
        try {
          await recordCrmInteraction(email, {
            id: result.messageId, phone: digits, direction: "outbound",
            company: typeof companyName === "string" ? companyName : undefined,
          });
        } catch (err) {
          console.error("[CRM] Falha ao registrar envio:", err instanceof Error ? err.name : "unknown");
          return res.status(200).json({ ...result, crmWarning: "Mensagem enviada. O CRM não conseguiu registrar o contato." });
        }
      }
      return res.status(result.success ? 200 : 502).json(result);
    }

    return res.status(405).json({ error: "Método não suportado." });
  } catch (err: any) {
    console.error("[WhatsApp Send] Falha inesperada:", err);
    return res.status(500).json({ success: false, error: "Falha inesperada no envio." });
  }
}
