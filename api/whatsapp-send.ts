import { getWhatsAppConnectionInfo, sendWhatsAppTemplate } from "./whatsapp-service.js";

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
      const { to, templateName, languageCode, bodyParams } = req.body || {};
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

      const result = await sendWhatsAppTemplate(email, digits, templateName, String(languageCode || "pt_BR"), params);
      return res.status(result.success ? 200 : 502).json(result);
    }

    return res.status(405).json({ error: "Método não suportado." });
  } catch (err: any) {
    console.error("[WhatsApp Send] Falha inesperada:", err);
    return res.status(500).json({ success: false, error: "Falha inesperada no envio." });
  }
}
