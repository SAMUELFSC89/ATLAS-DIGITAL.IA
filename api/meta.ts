import { decrypt, encrypt, getFirestoreAdmin } from "./db-helper.js";
import { getAuthenticatedEmail } from "./radar.js";

const GRAPH = "https://graph.facebook.com/v24.0";
const isId = (value: unknown): value is string => typeof value === "string" && /^\d{5,32}$/.test(value);
const isRealRecord = (record: any) => record.status === "connected" &&
  isId(record.whatsappBusinessAccountId) && isId(record.phoneNumberId) &&
  Boolean(record.accessToken) && !record.hasGraphErrors &&
  !/^EAAG.*EAAG$/.test(decrypt(record.accessToken));

async function graph(path: string, token?: string) {
  const response = await fetch(`${GRAPH}/${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("A Meta recusou a autorização ou o acesso aos dados do WhatsApp.");
  return response.json();
}

async function subscribeWhatsAppEvents(wabaId: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(`${GRAPH}/${wabaId}/subscribed_apps`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    return response.ok && (await response.json()).success === true;
  } catch {
    return false;
  }
}

function publicRecord(record: any) {
  const { accessToken, ...safe } = record;
  return { ...safe, status: isRealRecord(record) ? "connected" : "disconnected" };
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Método não suportado." });
  const email = await getAuthenticatedEmail(req);
  if (!email) return res.status(401).json({ error: "Entre na Atlas para configurar o WhatsApp." });

  const action = req.query?.action || "status";
  const appId = process.env.META_APP_ID?.trim();
  const configId = process.env.META_CONFIG_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim() || process.env.META_CLIENT_SECRET?.trim();
  const solutionId = process.env.META_SOLUTION_ID?.trim();

  if (req.method === "GET" && action === "config") {
    const missing = [
      !isId(appId) && "META_APP_ID",
      !isId(configId) && "META_CONFIG_ID",
      !appSecret && "META_APP_SECRET",
    ].filter(Boolean);
    return res.status(200).json({ appId, configId, solutionId: isId(solutionId) ? solutionId : undefined, missing });
  }

  try {
    const ref = getFirestoreAdmin().collection("companies").doc(email);
    if (req.method === "GET" && (action === "status" || action === "profile")) {
      const existing = (await ref.get()).data() || {};
      return res.status(200).json(publicRecord(existing));
    }

    if (req.method === "POST" && action === "disconnect") {
      await ref.set({ empresaId: email, status: "disconnected", accessToken: null, updatedAt: new Date().toISOString() }, { merge: true });
      return res.status(200).json({ success: true });
    }

    if (req.method === "POST" && ["connect", "update_config", "refresh"].includes(action)) {
      const existing = (await ref.get()).data() || {};
      if (action === "refresh" && !isRealRecord(existing)) {
        return res.status(400).json({ error: "Conecte um número na Meta antes de sincronizar." });
      }
      const input = req.body || {};
      const coexistence = action === "connect" && input.coexistence === true;
      const whatsappBusinessAccountId = action === "refresh" ? existing.whatsappBusinessAccountId : input.whatsappBusinessAccountId;
      const requestedPhoneId = action === "refresh" ? existing.phoneNumberId : input.phoneNumberId;
      if (!isId(whatsappBusinessAccountId) || (!isId(requestedPhoneId) && (!coexistence || requestedPhoneId !== undefined))) {
        return res.status(400).json({ error: "Informe os IDs da conta do WhatsApp Business e do telefone exibidos pela Meta." });
      }

      let token: string = action === "refresh" ? "" : typeof input.accessToken === "string" ? input.accessToken.trim() : "";
      if (action === "connect") {
        if (!appId || !appSecret || !configId) {
          return res.status(503).json({ error: "A configuração do cadastro integrado da Meta está incompleta na Atlas." });
        }
        if (typeof input.code !== "string" || !input.code.trim() || input.code.length > 4000) {
          return res.status(400).json({ error: "A Meta não retornou um código de autorização válido. Inicie a conexão novamente." });
        }
        const params = new URLSearchParams({ client_id: appId, client_secret: appSecret, code: input.code });
        const result = await graph(`oauth/access_token?${params}`);
        token = typeof result.access_token === "string" ? result.access_token : "";
      } else if (!token && isRealRecord(existing)) {
        token = decrypt(existing.accessToken);
      }
      if (!token || token.length > 5000 || (token.startsWith("EAAG") && token.endsWith("EAAG"))) {
        return res.status(400).json({ error: "Use um token válido da Meta para o número informado." });
      }

      // Read the phone through its WABA so the submitted IDs must match the same authorized account.
      const fields = "id,display_phone_number,verified_name,quality_rating" + (coexistence ? ",is_on_biz_app,platform_type" : "");
      let after = "";
      let phone: any;
      const coexistencePhones = [];
      for (let page = 0; page < 10 && !phone; page++) {
        const params = new URLSearchParams({ fields, limit: "100" });
        if (after) params.set("after", after);
        const list = await graph(`${whatsappBusinessAccountId}/phone_numbers?${params}`, token);
        const phones = Array.isArray(list.data) ? list.data : [];
        if (requestedPhoneId) {
          phone = phones.find((item: any) => item.id === requestedPhoneId);
        } else {
          coexistencePhones.push(...phones.filter((item: any) =>
            isId(item.id) && item.is_on_biz_app === true && item.platform_type === "CLOUD_API"
          ));
        }
        after = list.paging?.next ? list.paging?.cursors?.after : "";
        if (!after) break;
      }
      if (!requestedPhoneId && !after && coexistencePhones.length === 1) phone = coexistencePhones[0];
      if (coexistence && (phone?.is_on_biz_app !== true || phone.platform_type !== "CLOUD_API")) {
        return res.status(422).json({ error: "A Meta não confirmou um único número ativo no WhatsApp Business e na Cloud API. Confira a conta escolhida na autorização." });
      }
      if (!phone || !phone.display_phone_number) {
        return res.status(422).json({ error: "A Meta não retornou esse telefone na conta informada. Confira o número e a conta selecionados." });
      }
      const phoneNumberId = phone.id;

      if (action === "refresh") {
        const webhookSubscribed = await subscribeWhatsAppEvents(whatsappBusinessAccountId, token);
        const record = { ...existing, displayPhoneNumber: phone.display_phone_number,
          verifiedName: phone.verified_name || "", qualityRating: phone.quality_rating || "", webhookSubscribed };
        await ref.update({ displayPhoneNumber: record.displayPhoneNumber,
          verifiedName: record.verifiedName, qualityRating: record.qualityRating, webhookSubscribed });
        return res.status(200).json({ success: true, record: publicRecord(record) });
      }

      const encryptedToken = encrypt(token);
      if (encryptedToken === token) return res.status(503).json({ error: "A Atlas não conseguiu proteger a credencial da Meta." });
      const now = new Date().toISOString();
      const record = {
        empresaId: email,
        whatsappBusinessAccountId,
        phoneNumberId,
        displayPhoneNumber: phone.display_phone_number,
        verifiedName: phone.verified_name || "",
        qualityRating: phone.quality_rating || "",
        accessToken: encryptedToken,
        status: "connected",
        connectedAt: existing.phoneNumberId === phoneNumberId && existing.connectedAt ? existing.connectedAt : now,
        updatedAt: now,
        hasGraphErrors: false,
        ...(coexistence ? { coexistence: true } : existing.phoneNumberId !== phoneNumberId ? { coexistence: false } : {}),
        ...(existing.phoneNumberId !== phoneNumberId || existing.status !== "connected" ? { autoReplyEnabled: false } : {}),
        fallbackWarning: "",
      };
      await ref.set(record, { merge: true });
      const webhookSubscribed = await subscribeWhatsAppEvents(whatsappBusinessAccountId, token);
      await ref.update({ webhookSubscribed });
      return res.status(200).json({ success: true, record: publicRecord({ ...existing, ...record, webhookSubscribed }) });
    }

    return res.status(405).json({ error: "Ação não suportada." });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("A Meta recusou")) {
      return res.status(502).json({ error: error.message });
    }
    console.error("[Meta] Falha na integração", error instanceof Error ? error.name : "unknown");
    return res.status(503).json({ error: "A Atlas não conseguiu concluir a conexão agora. Tente novamente." });
  }
}
