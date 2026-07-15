import { IncomingMessage, ServerResponse } from "http";
import { encrypt, decrypt, readDb, writeDb } from "./db-helper.ts";

// Router/Controller
export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Company-Id"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Identify tenant from request header
  const companyId = req.headers["x-company-id"] || req.query.companyId;

  if (!companyId) {
    return res.status(401).json({ error: "Empresa não autenticada. Cabeçalho 'X-Company-Id' ausente." });
  }

  const action = req.query.action || "status";
  const db = readDb();
  const companyRecord = db[companyId] || {
    empresaId: companyId,
    status: "disconnected"
  };

  try {
    if (req.method === "GET") {
      if (action === "status") {
        // Return status without sensitive access token
        const cleanRecord = { ...companyRecord };
        delete cleanRecord.accessToken;
        return res.status(200).json(cleanRecord);
      }

      if (action === "config") {
        const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
        const host = req.headers.host;
        const redirectUri = `${protocol}://${host}/api/meta-callback`;
        return res.status(200).json({
          appId: process.env.META_APP_ID || "123456789",
          redirectUri
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
      if (action === "connect") {
        const { code, facebookBusinessId, whatsappBusinessAccountId, phoneNumberId, accessToken, displayPhoneNumber, verifiedName } = req.body;

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
          writeDb(db);

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
          writeDb(db);

          const responsePayload = { ...updatedRecord };
          delete responsePayload.accessToken;
          return res.status(200).json({ success: true, record: responsePayload });
        }
      }

      if (action === "disconnect") {
        db[companyId] = {
          empresaId: companyId,
          status: "disconnected",
          updatedAt: new Date().toISOString()
        };
        writeDb(db);
        return res.status(200).json({ success: true, message: "WhatsApp Business desconectado com sucesso." });
      }

      if (action === "refresh") {
        if (companyRecord.status !== "connected") {
          return res.status(400).json({ error: "Empresa não possui WhatsApp conectado para sincronizar." });
        }

        const decryptedToken = decrypt(companyRecord.accessToken);
        const phoneNumberId = companyRecord.phoneNumberId;

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
        writeDb(db);

        const responsePayload = { ...companyRecord };
        delete responsePayload.accessToken;
        return res.status(200).json({ success: true, record: responsePayload });
      }
    }

    return res.status(405).json({ error: "Método não suportado." });
  } catch (err: any) {
    console.error("Meta API error:", err);
    return res.status(500).json({ error: "Erro processando a integração Meta.", details: err.message });
  }
}
