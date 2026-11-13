import { GoogleGenAI } from "@google/genai";
import { readDb, writeDb, decrypt, getFirestoreAdmin } from "./db-helper.js";
import { recordCrmInteraction } from "./crm-store.js";
import { createPositioningPdf, type PositioningSnapshot } from "../src/lib/positioningPdf.js";

const WHATSAPP_GRAPH_URL = "https://graph.facebook.com/v24.0";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Chave GEMINI_API_KEY não configurada. Respostas do Webhook usarão fallback inteligente.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-whatsapp-service',
        }
      }
    });
  }
  return aiClient;
}

/**
 * Envia uma mensagem oficial via WhatsApp Cloud API de forma multi-tenant.
 */
export async function sendWhatsAppMessage(empresaId: string, telefoneDestino: string, mensagem: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log(`[WhatsApp Service] Iniciando envio para ${telefoneDestino} representando a empresa: ${empresaId}`);

  const db = await readDb();
  const company = db[empresaId];

  if (!company || company.status !== "connected") {
    return { success: false, error: `WhatsApp não está configurado ou está desconectado para a empresa: ${empresaId}` };
  }

  const { phoneNumberId, accessToken } = company;
  if (!phoneNumberId || !accessToken) {
    return { success: false, error: `Credenciais de WhatsApp inválidas ou ausentes para a empresa: ${empresaId}` };
  }

  const decryptedToken = decrypt(accessToken);

  // Se o token for simulado ou estarmos em ambiente de desenvolvimento sem tokens reais
  if (decryptedToken.startsWith("EAAG") && decryptedToken.endsWith("EAAG")) {
    console.log(`[WhatsApp Service] [SIMULADO] Mensagem enviada com sucesso para ${telefoneDestino}. Conteúdo: "${mensagem}"`);
    
    // Incrementa métricas simuladas
    company.messagesToday = (company.messagesToday || 0) + 1;
    if (company.openConversations === 0) {
      company.openConversations = 1;
    }
    db[empresaId] = company;
    await writeDb(db);

    return { success: true, messageId: `wmid.Simulated_${Math.floor(Math.random() * 1000000)}` };
  }

  try {
    const url = `${WHATSAPP_GRAPH_URL}/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${decryptedToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: telefoneDestino,
        type: "text",
        text: {
          body: mensagem
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[WhatsApp Service] Erro ao enviar mensagem via Meta API:`, data);
      return { success: false, error: data.error?.message || "Erro desconhecido na Meta Cloud API" };
    }

    console.log(`[WhatsApp Service] Mensagem enviada com sucesso via Meta API! ID:`, data.messages?.[0]?.id);

    // Atualiza estatísticas da empresa
    company.messagesToday = (company.messagesToday || 0) + 1;
    db[empresaId] = company;
    await writeDb(db);

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err: any) {
    console.error(`[WhatsApp Service] Falha na requisição de rede para Meta API:`, err);
    return { success: false, error: err.message || "Erro de rede ao conectar com Meta" };
  }
}

/** Processa lotes de mensagens assinados pela Meta. */
export async function handleIncomingWebhookMessage(body: any): Promise<{ processed: boolean }> {
  if (body?.object !== "whatsapp_business_account" || !Array.isArray(body.entry)) return { processed: false };
  const companies = getFirestoreAdmin().collection("companies");
  let processed = false;
  for (const entry of body.entry) {
    for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
      const value = change?.value;
      const phoneNumberId = value?.metadata?.phone_number_id;
      const outbound = change?.field === "smb_message_echoes";
      const messages = outbound ? value?.message_echoes : change?.field === "messages" ? value?.messages : undefined;
      if (!Array.isArray(messages) || !messages.length || typeof phoneNumberId !== "string") continue;
      const matches = await companies.where("phoneNumberId", "==", phoneNumberId).get();
      const connected = matches.docs.filter(doc => {
        const company = doc.data();
        return company.status === "connected" && company.whatsappBusinessAccountId === entry.id;
      });
      if (connected.length !== 1) continue;
      const target = connected[0];
      const company = target.data();
      for (const message of messages) {
        const phone = outbound ? message?.to : message?.from;
        if (typeof phone !== "string" || typeof message?.id !== "string" || /^wmid\.Simulated_/i.test(message.id) ||
          ["edit", "revoke", "reaction", "system"].includes(message.type)) continue;
        const name = (Array.isArray(value.contacts) ? value.contacts : [])
          .find(contact => contact?.wa_id === phone)?.profile?.name;
        const text = message.text?.body ?? message.document?.caption;
        const recorded = await recordCrmInteraction(target.id, {
          id: message.id, phone, timestamp: message.timestamp,
          direction: outbound ? "outbound" : "inbound",
          name: typeof name === "string" ? name : undefined,
          text: typeof text === "string" ? text : undefined,
        });
        processed ||= recorded;
        if (recorded && !outbound && company.autoReplyEnabled !== false && typeof text === "string" && text.trim()) {
          await replyToIncomingMessage(target.id, company.verifiedName, phone, typeof name === "string" ? name : "Cliente", text);
        }
      }
    }
  }
  return { processed };
}

async function replyToIncomingMessage(email: string, companyName: string | undefined, phone: string, name: string, text: string) {
  const company = companyName || "nossa equipe";
  let reply = "";
  const ai = getAiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Você é o assistente de atendimento da empresa "${company}".
Responda à mensagem do cliente de forma profissional, objetiva e simpática, em até três parágrafos.
Cliente: ${name}
Mensagem: ${text}`,
      });
      reply = response.text || "";
    } catch {
      console.error("[WhatsApp Webhook] Falha ao gerar resposta automática.");
    }
  }
  await sendWhatsAppMessage(email, phone, reply ||
    `Olá, ${name}! Obrigado pelo contato com ${company}. Como podemos ajudar você hoje?`);
}

export interface WhatsAppTemplateSummary {
  name: string;
  language: string;
  category: string;
  body: string;
  variableCount: number;
  headerFormat?: string;
}

export interface WhatsAppConnectionInfo {
  connected: boolean;
  simulated: boolean;
  displayPhoneNumber: string;
  verifiedName: string;
  templates: WhatsAppTemplateSummary[];
  templatesError?: string;
}

function isSimulatedToken(token: string): boolean {
  return token.startsWith("EAAG") && token.endsWith("EAAG");
}

/**
 * Situação da conexão do WhatsApp da empresa e os modelos de mensagem
 * aprovados pela Meta, que são o único formato aceito para iniciar conversas.
 */
export async function getWhatsAppConnectionInfo(empresaId: string): Promise<WhatsAppConnectionInfo> {
  const db = await readDb();
  const company = db[empresaId];
  const info: WhatsAppConnectionInfo = {
    connected: false,
    simulated: false,
    displayPhoneNumber: company?.displayPhoneNumber || "",
    verifiedName: company?.verifiedName || "",
    templates: [],
  };
  if (!company || company.status !== "connected" || !company.accessToken || !company.phoneNumberId) {
    return info;
  }
  info.connected = true;

  const token = decrypt(company.accessToken);
  if (isSimulatedToken(token)) {
    info.simulated = true;
    return info;
  }
  if (!company.whatsappBusinessAccountId) {
    info.templatesError = "O ID da conta do WhatsApp Business (WABA ID) não está preenchido em Automações.";
    return info;
  }

  try {
    const url = `${WHATSAPP_GRAPH_URL}/${company.whatsappBusinessAccountId}/message_templates?fields=name,status,language,category,components&limit=100`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data: any = await response.json();
    if (!response.ok) {
      info.templatesError = data?.error?.message || "A Meta não devolveu a lista de modelos.";
      return info;
    }
    info.templates = (data.data || [])
      .filter((tpl: any) => tpl.status === "APPROVED")
      .map((tpl: any) => {
        const body: string = (tpl.components || []).find((c: any) => c.type === "BODY")?.text || "";
        const variables = new Set((body.match(/\{\{\d+\}\}/g) || []));
        const headerFormat = (tpl.components || []).find((c: any) => c.type === "HEADER")?.format;
        return { name: tpl.name, language: tpl.language, category: tpl.category, body, variableCount: variables.size, headerFormat };
      });
  } catch (err: any) {
    info.templatesError = err.message || "Erro de rede ao consultar a Meta.";
  }
  return info;
}

/**
 * Envia um modelo de mensagem aprovado pela Meta. É o formato exigido para
 * falar com quem ainda não escreveu para a empresa nas últimas 24 horas.
 */
export async function sendWhatsAppTemplate(
  empresaId: string,
  telefoneDestino: string,
  templateName: string,
  languageCode: string,
  bodyParams: string[],
  positioning?: PositioningSnapshot,
): Promise<{ success: boolean; simulated?: boolean; messageId?: string; error?: string }> {
  const db = await readDb();
  const company = db[empresaId];
  if (!company || company.status !== "connected" || !company.phoneNumberId || !company.accessToken) {
    return { success: false, error: "O WhatsApp da empresa não está conectado. Conecte em Automações." };
  }

  const token = decrypt(company.accessToken);
  try {
    const pdf = positioning ? await createPositioningPdf(positioning) : undefined;
    if (isSimulatedToken(token)) {
      return { success: true, simulated: true, messageId: `wmid.Simulated_${Date.now()}` };
    }

    const phoneUrl = `${WHATSAPP_GRAPH_URL}/${company.phoneNumberId}`;
    const components = [];
    if (pdf) {
      const media = new FormData();
      media.set("messaging_product", "whatsapp");
      media.set("type", "application/pdf");
      media.set("file", new Blob([pdf.doc.output("arraybuffer")], { type: "application/pdf" }), pdf.filename);
      const upload = await fetch(`${phoneUrl}/media`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: media,
      });
      const uploaded = await upload.json();
      if (!upload.ok || typeof uploaded.id !== "string" || !uploaded.id) {
        return { success: false, error: uploaded?.error?.message || "A Meta não aceitou o PDF." };
      }
      components.push({
        type: "header",
        parameters: [{ type: "document", document: { id: uploaded.id, filename: pdf.filename } }],
      });
    }

    if (bodyParams.length > 0) {
      components.push({ type: "body", parameters: bodyParams.map((text) => ({ type: "text", text })) });
    }

    const template = {
      name: templateName,
      language: { code: languageCode },
      ...(components.length ? { components } : {}),
    };
    const response = await fetch(`${phoneUrl}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: telefoneDestino,
        type: "template",
        template,
      }),
    });
    const data: any = await response.json();
    if (!response.ok) {
      return { success: false, error: data?.error?.message || "A Meta recusou o envio." };
    }
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Erro de rede ao conectar com a Meta." };
  }
}
