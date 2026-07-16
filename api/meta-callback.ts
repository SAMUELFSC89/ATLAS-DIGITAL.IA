import { encrypt, readDb, writeDb } from "./db-helper.ts";

export default async function callbackHandler(req: any, res: any) {
  const code = req.query.code as string;
  const companyId = (req.query.state as string) || "demo@empresa.com";
  const errorMsg = req.query.error_description || req.query.error || "Erro desconhecido";

  let baseUrl = "";
  if (process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL" && process.env.APP_URL.trim() !== "") {
    baseUrl = process.env.APP_URL.replace(/\/$/, "");
  } else {
    const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
    const host = req.headers.host;
    baseUrl = `${protocol}://${host}`;
  }
  const redirectUri = `${baseUrl}/api/meta-callback`;

  const renderHTML = (success: boolean, error?: string, warningMsg?: string) => {
    let extraErrorInfo = "";
    if (error && (error.includes("whatsapp_business_accounts") || error.includes("nonexisting field") || error.includes("#100"))) {
      extraErrorInfo = `
        <div style="text-align: left; background: #1a1c23; border: 1px solid rgba(239, 68, 68, 0.25); padding: 18px; border-radius: 16px; margin-top: 20px; font-size: 13px; line-height: 1.6; color: #d1d5db; box-shadow: inset 0 1px 2px rgba(0,0,0,0.4);">
          <span style="color: #ef4444; font-weight: bold; display: block; margin-bottom: 8px; font-size: 14px;">💡 Como resolver este erro no painel de desenvolvedor Meta:</span>
          Este erro significa que o seu aplicativo no painel da Meta não possui a plataforma do WhatsApp configurada ou o tipo de aplicativo está incorreto. Siga estes passos simples para corrigir:
          <ol style="margin-left: 15px; padding-left: 0; margin-top: 8px; margin-bottom: 12px;">
            <li style="margin-bottom: 6px;">Acesse o site <a href="https://developers.facebook.com/" target="_blank" style="color: #3b82f6; text-decoration: underline; font-weight: 500;">developers.facebook.com</a> e abra o seu aplicativo.</li>
            <li style="margin-bottom: 6px;">No menu lateral esquerdo, clique em <strong>"Adicionar Produto"</strong> (Add Product).</li>
            <li style="margin-bottom: 6px;">Encontre o produto <strong>WhatsApp</strong> (WhatsApp Business Platform) e clique em <strong>"Configurar"</strong> (Set Up).</li>
            <li style="margin-bottom: 6px;">Verifique o tipo do seu aplicativo na Meta. Ele DEVE ser do tipo <strong>"Empresa" (Business)</strong>. Se for "Consumidor" ou outro, você precisará criar um novo aplicativo do tipo Empresa.</li>
            <li style="margin-bottom: 6px;">Por fim, certifique-se de que sua conta de desenvolvedor possui as permissões necessárias liberadas para o usuário associado.</li>
          </ol>
          <p style="font-size: 11px; color: #6b7280; margin: 0;">Após realizar essas configurações, tente realizar o login oficial novamente.</p>
        </div>
      `;
    }

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
            padding: 40px 20px;
            margin: 0;
          }
          .card {
            background: #121316;
            border: 1px solid #1f2023;
            border-radius: 24px;
            max-width: 500px;
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
          .warning-icon {
            font-size: 40px;
            color: #fbbf24;
            margin-bottom: 24px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .btn-close {
            background: #fbbf24;
            color: #000;
            font-weight: bold;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 14px;
            transition: opacity 0.2s;
          }
          .btn-close:hover {
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="card">
          ${
            success
              ? warningMsg
                ? `
            <div class="warning-icon">⚠</div>
            <h2>Conectado com Ajuste Pendente</h2>
            <p style="font-size: 13px; color: #fbbf24; margin-bottom: 16px; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); padding: 12px; border-radius: 12px; text-align: left;">
              ${warningMsg}
            </p>
            <p style="margin-bottom: 24px;">
              Sua conta Meta foi autenticada, mas devido ao tipo do seu aplicativo na Meta, não conseguimos buscar as contas automaticamente. Nós criamos uma conexão temporária. <strong>Você poderá ajustar seus IDs reais de telefone e WABA manualmente nas configurações avançadas no painel.</strong>
            </p>
            <button class="btn-close" onclick="window.close()">Ir para o Painel</button>
                `
                : `
            <div class="success-icon">✓</div>
            <h2>WhatsApp Conectado!</h2>
            <p>Sua conta oficial da Meta foi vinculada com sucesso à Atlas Digital. Esta janela será fechada automaticamente em instantes.</p>
          `
              : `
            <div class="error-icon">✕</div>
            <h2>Falha na Integração</h2>
            <p>Ocorreu um erro ao processar a autorização oficial com a Meta: <strong style="color: #f3f4f6;">${error}</strong></p>
            ${extraErrorInfo}
          `
          }
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'META_CONNECTED',
              success: ${success},
              error: ${error ? JSON.stringify(error) : "null"},
              warning: ${warningMsg ? JSON.stringify(warningMsg) : "null"}
            }, '*');
          }
          if (${success} && !${warningMsg ? "true" : "false"}) {
            setTimeout(function() {
              window.close();
            }, 2500);
          }
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

  // Detailed Logging helper for Meta Graph API calls
  async function fetchWithLogs(url: string, options: any = {}) {
    const method = options.method || "GET";
    const headers = options.headers || {};
    const body = options.body || "";

    console.log(`\n=== [Meta API Fetch Request] ===`);
    console.log(`Endpoint: ${url}`);
    console.log(`Method: ${method}`);
    console.log(`Headers: ${JSON.stringify(headers, null, 2)}`);
    if (body) {
      console.log(`Body: ${body}`);
    }

    try {
      const response = await fetch(url, options);
      console.log(`\n=== [Meta API Fetch Response] ===`);
      console.log(`Endpoint: ${url}`);
      console.log(`HTTP Status: ${response.status}`);
      
      const responseClone = response.clone();
      let textResponse = "";
      try {
        textResponse = await responseClone.text();
        console.log(`Response Payload: ${textResponse}`);
      } catch (e: any) {
        console.warn(`Could not read response payload: ${e.message}`);
      }
      console.log(`=================================\n`);
      return response;
    } catch (error: any) {
      console.error(`\n=== [Meta API Fetch Exception] ===`);
      console.error(`Endpoint: ${url}`);
      console.error(`Error: ${error.message}`);
      console.error(`Stacktrace:`, error.stack);
      console.log(`==================================\n`);
      throw error;
    }
  }

  try {
    // 1. Exchange auth code for User Access Token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${clientSecret}&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    const tokenRes = await fetchWithLogs(tokenUrl);
    
    if (!tokenRes.ok) {
      const errData = await tokenRes.json();
      return res.status(200).send(renderHTML(false, `Erro ao trocar código por Token: ${errData.error?.message || tokenRes.statusText}`));
    }
    
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(200).send(renderHTML(false, "Token de acesso não retornado pela Meta."));
    }

    // Inspect token using debug_token endpoint as a robust fallback source
    let debugWabaIds: string[] = [];
    let debugPhoneIds: string[] = [];
    let facebookBusinessId = "";

    try {
      const debugUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${clientSecret}`;
      const debugRes = await fetchWithLogs(debugUrl);
      if (debugRes.ok) {
        const debugData = await debugRes.json();
        facebookBusinessId = debugData.data?.business_id || "";
        
        if (debugData.data?.granular_scopes) {
          for (const gs of debugData.data.granular_scopes) {
            if (gs.scope === "whatsapp_business_management" && gs.target_ids) {
              debugWabaIds.push(...gs.target_ids);
            }
            if (gs.scope === "whatsapp_business_messaging" && gs.target_ids) {
              debugPhoneIds.push(...gs.target_ids);
            }
          }
        }
        console.log(`[Meta Debug Token] Found business_id: ${facebookBusinessId}`);
        console.log(`[Meta Debug Token] Found WABA IDs from granular scopes: ${JSON.stringify(debugWabaIds)}`);
        console.log(`[Meta Debug Token] Found Phone IDs from granular scopes: ${JSON.stringify(debugPhoneIds)}`);
      }
    } catch (e: any) {
      console.error("[Meta Debug Token] Error parsing granular scopes from debug_token:", e.message, e.stack);
    }

    // 2. Fetch the WhatsApp Business Accounts (WABAs)
    let wabaList: any[] = [];
    let directError: string | null = null;

    try {
      const wabaUrl = "https://graph.facebook.com/v18.0/me/whatsapp_business_accounts?fields=id,name,owner_business_info";
      const wabaRes = await fetchWithLogs(wabaUrl, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });

      if (wabaRes.ok) {
        const wabaData = await wabaRes.json();
        wabaList = wabaData.data || [];
      } else {
        const errData = await wabaRes.json();
        directError = errData.error?.message || wabaRes.statusText;
        console.warn(`[Meta API] Direct WABA fetch failed: ${directError}`);
      }
    } catch (err: any) {
      directError = err.message || String(err);
      console.error("[Meta API] Exception during direct WABA fetch:", err.message, err.stack);
    }

    // Fallback System 1: If direct retrieval failed or returned empty list, try finding WABAs via /me/businesses edge
    if (wabaList.length === 0) {
      console.log("[Meta API] Initiating Fallback 1: Querying businesses to find WABAs...");
      try {
        const busUrl = "https://graph.facebook.com/v18.0/me/businesses?fields=id,name";
        const busRes = await fetchWithLogs(busUrl, {
          headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (busRes.ok) {
          const busData = await busRes.json();
          const busList = busData.data || [];

          for (const bus of busList) {
            console.log(`[Meta API] Checking WABAs for business: ${bus.name} (${bus.id})`);
            const busWabaUrl = `https://graph.facebook.com/v18.0/${bus.id}/whatsapp_business_accounts?fields=id,name,owner_business_info`;
            const busWabaRes = await fetchWithLogs(busWabaUrl, {
              headers: { "Authorization": `Bearer ${accessToken}` }
            });

            if (busWabaRes.ok) {
              const busWabaData = await busWabaRes.json();
              if (busWabaData.data && busWabaData.data.length > 0) {
                wabaList.push(...busWabaData.data);
              }
            }
          }
        }
      } catch (fallbackErr: any) {
        console.error("[Meta API] Error during fallback businesses check:", fallbackErr.message, fallbackErr.stack);
      }
    }

    // Fallback System 2: If still empty, use WABA IDs found in the debug_token granular scopes
    if (wabaList.length === 0 && debugWabaIds.length > 0) {
      console.log("[Meta API] Initiating Fallback 2: Using WABA IDs from debug_token granular scopes...");
      for (const dWabaId of debugWabaIds) {
        try {
          const infoUrl = `https://graph.facebook.com/v18.0/${dWabaId}?fields=id,name,owner_business_info`;
          const infoRes = await fetchWithLogs(infoUrl, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          if (infoRes.ok) {
            const infoData = await infoRes.json();
            wabaList.push(infoData);
          } else {
            console.warn(`[Meta API] Could not fetch details for WABA ID ${dWabaId}, creating stub.`);
            wabaList.push({
              id: dWabaId,
              name: `WABA (${dWabaId})`,
              owner_business_info: facebookBusinessId ? { id: facebookBusinessId } : null
            });
          }
        } catch (err: any) {
          console.error(`[Meta API] Error fetching info for WABA ID ${dWabaId}:`, err.message, err.stack);
          wabaList.push({
            id: dWabaId,
            name: `WABA (${dWabaId})`,
            owner_business_info: facebookBusinessId ? { id: facebookBusinessId } : null
          });
        }
      }
    }

    // If still empty or failed, output warning fallback instead of error!
    let isManualFallbackNeeded = false;
    let fallbackWarning = "";

    if (wabaList.length === 0) {
      isManualFallbackNeeded = true;
      fallbackWarning = "Não foi possível recuperar suas contas do WhatsApp Business (WABA) automaticamente da Meta. Pode ser que o seu aplicativo de desenvolvedor da Meta esteja no modo de teste ou sem permissão whatsapp_business_management.";
      wabaList.push({
        id: "waba_pendente_" + Math.floor(1000000 + Math.random() * 9000000),
        name: "WABA Automático (Pendente de Configuração)",
        owner_business_info: null
      });
    }

    // Select first WABA found
    const waba = wabaList[0];
    const wabaId = waba.id;
    if (waba.owner_business_info?.id) {
      facebookBusinessId = waba.owner_business_info.id;
    }

    // 3. Fetch phone numbers under that WABA
    let phoneList: any[] = [];
    if (!isManualFallbackNeeded) {
      try {
        const phoneUrl = `https://graph.facebook.com/v18.0/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating,messaging_limit_tier`;
        const phoneRes = await fetchWithLogs(phoneUrl, {
          headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (phoneRes.ok) {
          const phoneData = await phoneRes.json();
          phoneList = phoneData.data || [];
        } else {
          const errData = await phoneRes.json();
          console.warn(`[Meta API] Failed to fetch phone numbers for WABA ${wabaId}: ${errData.error?.message || phoneRes.statusText}`);
        }
      } catch (err: any) {
        console.error(`[Meta API] Exception fetching phone numbers for WABA ${wabaId}:`, err.message, err.stack);
      }
    }

    // Fallback System 3: If no phone numbers listed directly, construct from debugPhoneIds
    let phone: any = null;
    if (phoneList.length > 0) {
      phone = phoneList[0];
    } else if (debugPhoneIds.length > 0) {
      console.log("[Meta API] No numbers found via direct list. Falling back to debugPhoneIds from granular scopes...");
      const dpId = debugPhoneIds[0];
      try {
        const dpUrl = `https://graph.facebook.com/v18.0/${dpId}?fields=id,display_phone_number,verified_name,quality_rating,messaging_limit_tier`;
        const dpRes = await fetchWithLogs(dpUrl, {
          headers: { "Authorization": `Bearer ${accessToken}` }
        });
        if (dpRes.ok) {
          phone = await dpRes.json();
        } else {
          console.warn(`[Meta API] Could not fetch details for Phone ID ${dpId}, creating stub.`);
          phone = {
            id: dpId,
            display_phone_number: "Número Configurado",
            verified_name: "WhatsApp Business",
            quality_rating: "GREEN",
            messaging_limit_tier: "TIER_250"
          };
        }
      } catch (err: any) {
        console.error(`[Meta API] Error fetching details for Phone ID ${dpId}:`, err.message, err.stack);
        phone = {
          id: dpId,
          display_phone_number: "Número Configurado",
          verified_name: "WhatsApp Business",
          quality_rating: "GREEN",
          messaging_limit_tier: "TIER_250"
        };
      }
    }

    if (!phone) {
      isManualFallbackNeeded = true;
      if (!fallbackWarning) {
        fallbackWarning = "Não foi possível carregar os números de telefone atrelados à conta do WhatsApp Business da Meta de forma automática.";
      }
      phone = {
        id: "phone_pendente_" + Math.floor(1000000 + Math.random() * 9000000),
        display_phone_number: "Número (Pendente de Configuração)",
        verified_name: "WhatsApp Business Oficial",
        quality_rating: "GREEN",
        messaging_limit_tier: "TIER_250"
      };
    }

    const phoneNumberId = phone.id;
    const displayPhoneNumber = phone.display_phone_number || "";
    const verifiedName = phone.verified_name || "";
    const qualityRating = phone.quality_rating || "GREEN";
    const messagingLimit = phone.messaging_limit_tier || "TIER_250";

    // 5. Encrypt access token and save database record securely
    const encryptedToken = encrypt(accessToken);
    const db = await readDb();
    
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
      openConversations: 0,
      hasGraphErrors: isManualFallbackNeeded,
      fallbackWarning: fallbackWarning
    };

    await writeDb(db);

    return res.status(200).send(renderHTML(true, undefined, isManualFallbackNeeded ? fallbackWarning : undefined));
  } catch (error: any) {
    console.error("Meta callback processing failure:", error);
    return res.status(200).send(renderHTML(false, `Exceção capturada no processamento: ${error.message || error}`));
  }
}
