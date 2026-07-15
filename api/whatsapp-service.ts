import { GoogleGenAI } from "@google/genai";
import { readDb, writeDb, decrypt } from "./db-helper.ts";

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

  const db = readDb();
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
    writeDb(db);

    return { success: true, messageId: `wmid.Simulated_${Math.floor(Math.random() * 1000000)}` };
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
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
    writeDb(db);

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err: any) {
    console.error(`[WhatsApp Service] Falha na requisição de rede para Meta API:`, err);
    return { success: false, error: err.message || "Erro de rede ao conectar com Meta" };
  }
}

/**
 * Processa as mensagens recebidas no Webhook oficial da Meta.
 * Identifica o Phone Number ID, busca a respectiva empresa, ativa a IA contextualizada e responde.
 */
export async function handleIncomingWebhookMessage(body: any): Promise<{ processed: boolean; error?: string }> {
  try {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    
    if (!value || !value.messages || value.messages.length === 0) {
      return { processed: false }; // Evento não é de mensagem de texto (pode ser status de entrega)
    }

    const metadata = value.metadata;
    const phoneNumberId = metadata?.phone_number_id;
    
    if (!phoneNumberId) {
      return { processed: false, error: "Nenhum phone_number_id encontrado no evento." };
    }

    // Busca qual empresa possui esse phoneNumberId em suas configurações
    const db = readDb();
    let targetEmpresaId: string | null = null;
    let targetCompany: any = null;

    for (const [empresaId, company] of Object.entries(db)) {
      if ((company as any).phoneNumberId === phoneNumberId && (company as any).status === "connected") {
        targetEmpresaId = empresaId;
        targetCompany = company;
        break;
      }
    }

    if (!targetEmpresaId || !targetCompany) {
      console.warn(`[WhatsApp Webhook] Mensagem recebida para o Phone Number ID: ${phoneNumberId}, mas nenhuma empresa SaaS correspondente está conectada.`);
      return { processed: false, error: `Nenhuma empresa conectada para o Phone Number ID: ${phoneNumberId}` };
    }

    const messageObj = value.messages[0];
    const from = messageObj.from;
    const clientName = value.contacts?.[0]?.profile?.name || "Cliente";
    const textBody = messageObj.text?.body;

    if (!textBody) {
      return { processed: true }; // Mensagem vazia ou tipo não textual
    }

    console.log(`[WhatsApp Webhook] Mensagem recebida de [${clientName}] (${from}) para a empresa [${targetEmpresaId}]. Conteúdo: "${textBody}"`);

    // Atualiza número de conversas abertas
    targetCompany.openConversations = Math.max(targetCompany.openConversations || 1, Math.floor(1 + Math.random() * 5));
    db[targetEmpresaId] = targetCompany;
    writeDb(db);

    // Formula a resposta utilizando Inteligência Artificial (Gemini) de acordo com o contexto do nicho/empresa
    let aiResponse = "";
    const ai = getAiClient();

    if (ai) {
      try {
        const prompt = `Você é o assistente virtual inteligente da empresa "${targetCompany.verifiedName || targetEmpresaId}".
        O cliente se chama "${clientName}" e enviou a seguinte mensagem no WhatsApp:
        "${textBody}"

        Sua missão é responder de forma extremamente prestativa, profissional, objetiva e simpática, alinhada com as melhores práticas de atendimento ao cliente.
        Mantenha a resposta curta (máximo 2 ou 3 parágrafos) e adequada para leitura rápida em chat de WhatsApp. Se o cliente demonstrar interesse em auditorias ou SEO, mencione o "Atlas Score" da Atlas Digital.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt
        });

        aiResponse = response.text || "";
      } catch (err) {
        console.error("[WhatsApp Webhook] Erro ao consultar Gemini SDK:", err);
      }
    }

    // Fallback inteligente se Gemini falhar ou não estiver disponível
    if (!aiResponse) {
      aiResponse = `Olá, ${clientName}! Obrigado pelo seu contato com a ${targetCompany.verifiedName || "nossa equipe"}. Eu sou o assistente inteligente da empresa e já recebi sua mensagem. Como posso ajudar você hoje?`;
    }

    // Despacha a resposta oficial
    const result = await sendWhatsAppMessage(targetEmpresaId, from, aiResponse);
    return { processed: result.success, error: result.error };

  } catch (err: any) {
    console.error("[WhatsApp Webhook] Falha ao processar mensagem recebida:", err);
    return { processed: false, error: err.message || "Erro desconhecido processando webhook" };
  }
}
