import { encrypt, readDb, writeDb } from "./db-helper.ts";

export default async function callbackHandler(req: any, res: any) {
  const code = req.query.code as string;
  const companyId = (req.query.state as string) || "demo@empresa.com";
  const errorMsg = req.query.error_description || req.query.error || "Erro desconhecido";

  const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
  const host = req.headers.host;
  const redirectUri = `${protocol}://${host}/api/meta-callback`;

  const renderHTML = (success: boolean, error?: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Conexão WhatsApp Business - Meta</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #0b0c0e;
            color: #ffffff;
            text-align: center;
            padding: 80px 20px;
            margin: 0;
          }
          .card {
            background: #121316;
            border: 1px solid #1f2023;
            border-radius: 24px;
            max-width: 480px;
            margin: 0 auto;
            padding: 40px 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          }
          h2 {
            font-size: 22px;
            margin-bottom: 12px;
            font-weight: 700;
          }
          p {
            font-size: 14px;
            color: #9ca3af;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .spinner {
            border: 3px solid rgba(255,255,255,0.05);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border-left-color: #10b981;
            animation: spin 1s linear infinite;
            margin: 0 auto 24px;
          }
          .error-icon {
            font-size: 40px;
            color: #ef4444;
            margin-bottom: 24px;
          }
          .success-icon {
            font-size: 40px;
            color: #10b981;
            margin-bottom: 24px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="card">
          ${
            success
              ? `
            <div class="success-icon">✓</div>
            <h2>WhatsApp Conectado!</h2>
            <p>Sua conta oficial da Meta foi vinculada com sucesso à Atlas Digital. Esta janela será fechada automaticamente em instantes.</p>
          `
              : `
            <div class="error-icon">✕</div>
            <h2>Falha na Integração</h2>
            <p>Ocorreu um erro ao processar a autorização oficial com a Meta: <strong style="color: #f3f4f6;">${error}</strong></p>
          `
          }
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'META_CONNECTED',
              success: ${success},
              error: ${error ? JSON.stringify(error) : "null"}
            }, '*');
          }
          setTimeout(function() {
            window.close();
          }, 2500);
        </script>
      </body>
      </html>
    `;
  };

  if (!code) {
    return res.status(200).send(renderHTML(false, `Meta cancelou a autorização ou ocorreu um erro: ${errorMsg}`));
  }

  const appId = process.env.META_APP_ID || "123456789";
  const clientSecret = process.env.META_CLIENT_SECRET || "";

  if (!clientSecret) {
    return res.status(200).send(renderHTML(false, "O 'META_CLIENT_SECRET' não está configurado no servidor. Configure-o nas variáveis de ambiente (.env)."));
  }

  try {
    // 1. Exchange auth code for User Access Token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${clientSecret}&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    const tokenRes = await fetch(tokenUrl);
    
    if (!tokenRes.ok) {
      const errData = await tokenRes.json();
      return res.status(200).send(renderHTML(false, `Erro ao trocar código por Token: ${errData.error?.message || tokenRes.statusText}`));
    }
    
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(200).send(renderHTML(false, "Token de acesso não retornado pela Meta."));
    }

    // 2. Fetch the WhatsApp Business Accounts of this user
    const wabaUrl = "https://graph.facebook.com/v18.0/me/whatsapp_business_accounts?fields=id,name,owner_business_info";
    const wabaRes = await fetch(wabaUrl, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });

    if (!wabaRes.ok) {
      const errData = await wabaRes.json();
      return res.status(200).send(renderHTML(false, `Erro ao listar contas do WhatsApp (WABA): ${errData.error?.message || wabaRes.statusText}`));
    }

    const wabaData = await wabaRes.json();
    const wabaList = wabaData.data || [];

    if (wabaList.length === 0) {
      return res.status(200).send(renderHTML(false, "Nenhuma conta do WhatsApp Business Account (WABA) foi encontrada ou autorizada para esta conta do Facebook."));
    }

    // Select first WABA
    const waba = wabaList[0];
    const wabaId = waba.id;

    // 3. Fetch phone numbers under that WABA
    const phoneUrl = `https://graph.facebook.com/v18.0/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating,messaging_limit_tier`;
    const phoneRes = await fetch(phoneUrl, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });

    if (!phoneRes.ok) {
      const errData = await phoneRes.json();
      return res.status(200).send(renderHTML(false, `Erro ao buscar números do WhatsApp sob WABA: ${errData.error?.message || phoneRes.statusText}`));
    }

    const phoneData = await phoneRes.json();
    const phoneList = phoneData.data || [];

    if (phoneList.length === 0) {
      return res.status(200).send(renderHTML(false, `Sua conta do WhatsApp Business (ID: ${wabaId}) não possui nenhum número cadastrado ou ativo.`));
    }

    // Select first phone number
    const phone = phoneList[0];
    const phoneNumberId = phone.id;
    const displayPhoneNumber = phone.display_phone_number || "";
    const verifiedName = phone.verified_name || "";
    const qualityRating = phone.quality_rating || "GREEN";
    const messagingLimit = phone.messaging_limit_tier || "TIER_250";

    // 4. Retrieve Facebook Business ID (by debugging the token or using owner_business_info)
    let facebookBusinessId = "";
    if (waba.owner_business_info) {
      facebookBusinessId = waba.owner_business_info.id || "";
    } else {
      try {
        const debugUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${clientSecret}`;
        const debugRes = await fetch(debugUrl);
        if (debugRes.ok) {
          const debugData = await debugRes.json();
          facebookBusinessId = debugData.data?.business_id || "";
        }
      } catch (e) {
        console.error("Error fetching debug_token for business_id:", e);
      }
    }

    // 5. Encrypt access token and save database record securely
    const encryptedToken = encrypt(accessToken);
    const db = readDb();
    
    db[companyId] = {
      empresaId: companyId,
      facebookBusinessId,
      whatsappBusinessAccountId: wabaId,
      phoneNumberId,
      accessToken: encryptedToken,
      status: "connected",
      connectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      displayPhoneNumber,
      verifiedName,
      qualityRating,
      messagingLimit,
      messagesToday: 0,
      openConversations: 0
    };

    writeDb(db);

    return res.status(200).send(renderHTML(true));
  } catch (error: any) {
    console.error("Meta callback processing failure:", error);
    return res.status(200).send(renderHTML(false, `Exceção capturada no processamento: ${error.message || error}`));
  }
}
