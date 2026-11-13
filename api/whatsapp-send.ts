import { applyCors, getAuthenticatedEmail } from "./_lib/auth.ts";
import { getWhatsAppConnectionInfo, sendWhatsAppTemplate } from "./whatsapp-service.ts";

const MAX_PARAM_LENGTH = 300;

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
