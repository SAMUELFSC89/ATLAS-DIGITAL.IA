import { encrypt, decrypt, readDb, writeDb } from "./db-helper.ts";
import { applyCors, createOAuthState, getAuthenticatedEmail, getBaseUrl, oauthNonceCookie } from "./_lib/auth.ts";
import { handleIncomingWebhookMessage } from "./whatsapp-service.ts";

// Router/Controller
export default async function handler(req: any, res: any) {
  applyCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // A empresa é sempre a do login verificado do Firebase, nunca um valor
    // enviado pelo navegador (cabeçalho X-Company-Id ou ?companyId= são ignorados).
    const companyId = await getAuthenticatedEmail(req);

    if (!companyId) {
      return res.status(401).json({ code: "unauthenticated", error: "Sessão expirada. Saia e entre novamente." });
    }

    console.log(`[Meta API] [${req.method}] Action: ${req.query?.action || "status"}, Company: ${companyId}`);

    const action = req.query?.action || "status";
    const db = await readDb();
    const companyRecord = db[companyId] || {
      empresaId: companyId,
      status: "disconnected"
    };

    if (req.method === "GET") {
      if (action === "status") {
        // Return status without sensitive access token
        const cleanRecord = { ...companyRecord };
        delete cleanRecord.accessToken;
        // Token gravado com uma chave de criptografia antiga: tratar como desconectado.
        if (cleanRecord.status === "connected" && !decrypt(companyRecord.accessToken)) {
          cleanRecord.status = "disconnected";
          cleanRecord.needsReconnect = true;
        }
        return res.status(200).json(cleanRecord);
      }

      if (action === "config") {
        const redirectUri = `${getBaseUrl(req)}/api/meta-callback`;
        // `state` assinado amarra o retorno da Meta a esta empresa e a este navegador.
        const oauth = createOAuthState(companyId);
        if (oauth) {
          res.setHeader("Set-Cookie", oauthNonceCookie(oauth.nonce, redirectUri.startsWith("https://")));
        }
        return res.status(200).json({
          appId: process.env.META_APP_ID || "123456789",
          redirectUri,
          state: oauth?.state || null
        });
      }

      if (action === "profile") {
        if (companyRecord.status !== "connected") {
          return res.status(400).json({ error: "WhatsApp não está conectado para esta empresa." });
        }
        
        // Return profile metrics
        return res.status(200).json({
          verifiedName: companyRecord.verifiedName,
          displayPhoneNumber: companyRecord.displayPhoneNumber,
          phoneNumberId: companyRecord.phoneNumberId,
          qualityRating: companyRecord.qualityRating,
          messagingLimit: companyRecord.messagingLimit,
          status: companyRecord.status,
          messagesToday: companyRecord.messagesToday || 0,
          openConversations: companyRecord.openConversations || 0,
          connectedAt: companyRecord.connectedAt
        });
      }
    }

    if (req.method === "POST") {
      if (action === "update_config") {
        const { facebookBusinessId, whatsappBusinessAccountId, phoneNumberId, displayPhoneNumber, verifiedName, accessToken } = req.body || {};

        let record = db[companyId] || {
          empresaId: companyId,
          status: "connected",
          connectedAt: new Date().toISOString(),
          messagesToday: 0,
          openConversations: 0,
          qualityRating: "GREEN",
          messagingLimit: "TIER_250"
        };

        record.facebookBusinessId = facebookBusinessId || record.facebookBusinessId || "";
        record.whatsappBusinessAccountId = whatsappBusinessAccountId || record.whatsappBusinessAccountId || "";
        record.phoneNumberId = phoneNumberId || record.phoneNumberId || "";
        record.displayPhoneNumber = displayPhoneNumber || record.displayPhoneNumber || "";
        record.verifiedName = verifiedName || record.verifiedName || companyId;
        record.status = "connected";
        record.updatedAt = new Date().toISOString();

        if (accessToken) {
          record.accessToken = encrypt(accessToken);
        }

        db[companyId] = record;
        await writeDb(db);

        const responsePayload = { ...record };
        delete responsePayload.accessToken;
        return res.status(200).json({ success: true, record: responsePayload });
      }

      if (action === "connect") {
        const { code, facebookBusinessId, whatsappBusinessAccountId, phoneNumberId, accessToken, displayPhoneNumber, verifiedName } = req.body || {};

        // If it is simulated signup or code is mock
        if (code === "simulated_code" || !accessToken) {
          // Process simulated Embedded Signup response
          const simulatedPhoneId = phoneNumberId || `1065${Math.floor(1000000 + Math.random() * 9000000)}`;
          const simulatedWabaId = whatsappBusinessAccountId || `2048${Math.floor(1000000 + Math.random() * 9000000)}`;
          const simulatedBizId = facebookBusinessId || `3019${Math.floor(1000000 + Math.random() * 9000000)}`;
          const cleanPhone = displayPhoneNumber || `+55 11 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
          const cleanName = verifiedName || `${companyId.split("@")[0].toUpperCase()} Local CRM`;

          const encryptedToken = encrypt("EAAG" + Math.random().toString(36).substring(2, 15) + "EAAG");

          const updatedRecord = {
            empresaId: companyId,
            facebookBusinessId: simulatedBizId,
            whatsappBusinessAccountId: simulatedWabaId,
            phoneNumberId: simulatedPhoneId,
            accessToken: encryptedToken,
            status: "connected",
            connectedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            displayPhoneNumber: cleanPhone,
            verifiedName: cleanName,
            qualityRating: "GREEN",
            messagingLimit: "TIER_10K",
            messagesToday: 0,
            openConversations: 0
          };

          db[companyId] = updatedRecord;
          await writeDb(db);

          const responsePayload = { ...updatedRecord };
          delete responsePayload.accessToken;
          return res.status(200).json({ success: true, record: responsePayload });
        } else {
          // Process real credentials from Meta Embedded Signup
          const encryptedToken = encrypt(accessToken);

          const updatedRecord = {
            empresaId: companyId,
            facebookBusinessId: facebookBusinessId || "",
            whatsappBusinessAccountId: whatsappBusinessAccountId || "",
            phoneNumberId: phoneNumberId || "",
            accessToken: encryptedToken,
            status: "connected",
            connectedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            displayPhoneNumber: displayPhoneNumber || "",
            verifiedName: verifiedName || companyId,
            qualityRating: "GREEN",
            messagingLimit: "TIER_250",
            messagesToday: 0,
            openConversations: 0
          };

          db[companyId] = updatedRecord;
          await writeDb(db);

          const responsePayload = { ...updatedRecord };
          delete responsePayload.accessToken;
          return res.status(200).json({ success: true, record: responsePayload });
        }
      }

      if (action === "disconnect") {
        db[companyId] = {
          empresaId: companyId,
          status: "disconnected",
          accessToken: "", // a gravação faz merge; sem isto o token continuaria salvo após desconectar
          updatedAt: new Date().toISOString()
        };
        await writeDb(db);
        return res.status(200).json({ success: true, message: "WhatsApp Business desconectado com sucesso." });
      }

      if (action === "refresh") {
        if (companyRecord.status !== "connected") {
          return res.status(400).json({ error: "Empresa não possui WhatsApp conectado para sincronizar." });
        }

        const decryptedToken = decrypt(companyRecord.accessToken);
        const phoneNumberId = companyRecord.phoneNumberId;

        if (!decryptedToken) {
          return res.status(409).json({ code: "needs_reconnect", error: "O token salvo não é mais válido. Reconecte o WhatsApp em Automações." });
        }

        if (decryptedToken && phoneNumberId && !decryptedToken.startsWith("EAAG")) {
          try {
            const url = `https://graph.facebook.com/v18.0/${phoneNumberId}?fields=quality_rating,messaging_limit_tier,verified_name,display_phone_number`;
            const resMeta = await fetch(url, {
              headers: { "Authorization": `Bearer ${decryptedToken}` }
            });
            
            if (resMeta.ok) {
              const dataMeta = await resMeta.json();
              companyRecord.qualityRating = dataMeta.quality_rating || companyRecord.qualityRating;
              companyRecord.messagingLimit = dataMeta.messaging_limit_tier || companyRecord.messagingLimit;
              companyRecord.verifiedName = dataMeta.verified_name || companyRecord.verifiedName;
              companyRecord.displayPhoneNumber = dataMeta.display_phone_number || companyRecord.displayPhoneNumber;
            }
          } catch (err) {
            console.error("Error refreshing WhatsApp info from Meta Graph API:", err);
          }
        } else {
          // Simulation metric increments for local sandbox/dev modes
          companyRecord.messagesToday = (companyRecord.messagesToday || 0) + Math.floor(1 + Math.random() * 3);
          companyRecord.openConversations = Math.floor(1 + Math.random() * 5);
          companyRecord.qualityRating = "GREEN";
          companyRecord.messagingLimit = "TIER_250";
        }

        companyRecord.updatedAt = new Date().toISOString();
        db[companyId] = companyRecord;
        await writeDb(db);

        const responsePayload = { ...companyRecord };
        delete responsePayload.accessToken;
        return res.status(200).json({ success: true, record: responsePayload });
      }
    }

    if (req.method === "POST" && action === "simulate_webhook") {
      // Simulador do painel: processa uma mensagem de teste como se viesse da Meta,
      // mas sempre para o número da própria empresa logada. O /api/webhook real só
      // aceita chamadas assinadas pela Meta.
      if (companyRecord.status !== "connected" || !companyRecord.phoneNumberId) {
        return res.status(400).json({ error: "Conecte o WhatsApp antes de usar o simulador." });
      }
      const value = req.body?.entry?.[0]?.changes?.[0]?.value;
      if (!value || !Array.isArray(value.messages)) {
        return res.status(400).json({ error: "Evento de teste inválido." });
      }
      value.metadata = { ...(value.metadata || {}), phone_number_id: companyRecord.phoneNumberId };
      const result = await handleIncomingWebhookMessage(req.body);
      return res.status(200).json({ status: "success", ...result });
    }

    return res.status(405).json({ error: "Método não suportado." });
  } catch (err: any) {
    console.error("Meta API error:", err);
    return res.status(500).json({ error: "Erro processando a integração Meta." });
  }
}
