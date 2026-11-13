import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import metaHandler from "./api/meta.ts";
import metaCallbackHandler from "./api/meta-callback.ts";
import webhookHandler from "./api/webhook.ts";
import crmHandler from "./api/crm.ts";
import radarHandler from "./api/radar.ts";
import atlasScoreHandler from "./api/atlas-score.ts";
import whatsappSendHandler from "./api/whatsapp-send.ts";

dotenv.config();

// Check Meta developers environment variables
const REQUIRED_META_VARS = [
  "META_APP_ID",
  "META_CLIENT_SECRET",
  "META_APP_SECRET",
  "META_VERIFY_TOKEN",
  "META_REDIRECT_URI",
  "META_CONFIG_ID",
  "META_BUSINESS_ID",
  "META_SYSTEM_USER_TOKEN"
];

console.log("=== CHECKING META DEVELOPERS ENVIRONMENT VARIABLES ===");
REQUIRED_META_VARS.forEach(v => {
  const value = process.env[v];
  if (value && value.trim() !== "") {
    let masked = value;
    if (value.length > 6) {
      masked = value.substring(0, 3) + "..." + value.substring(value.length - 3);
    }
    console.log(`[ENV CHECK] ${v}: Present (${masked})`);
  } else {
    console.warn(`[ENV CHECK] ${v}: MISSING!`);
  }
});
console.log("=====================================================");

const currentFile = typeof __filename === "string" ? __filename : fileURLToPath(import.meta.url);

async function startServer() {
  const app = express();
  app.set("trust proxy", true);
  const PORT = 3000;

  app.all("/api/webhook", (req, res) => webhookHandler(req, res));
  app.use(express.json());

  // Meta Integration Routes
  app.get("/api/meta", async (req, res) => {
    try {
      await metaHandler(req, res);
    } catch (err: any) {
      console.error("[GET /api/meta] Unhandled Exception:", err);
      return res.status(500).json({ error: "Erro interno no servidor Meta API.", details: err.message || String(err) });
    }
  });
  app.post("/api/meta", async (req, res) => {
    try {
      await metaHandler(req, res);
    } catch (err: any) {
      console.error("[POST /api/meta] Unhandled Exception:", err);
      return res.status(500).json({ error: "Erro interno no servidor Meta API.", details: err.message || String(err) });
    }
  });
  app.get("/api/meta-callback", async (req, res) => {
    try {
      await metaCallbackHandler(req, res);
    } catch (err: any) {
      console.error("[GET /api/meta-callback] Unhandled Exception:", err);
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Erro Interno</title></head>
        <body style="font-family: sans-serif; background: #0b0c0e; color: white; text-align: center; padding: 50px;">
          <h2>Erro de Processamento da Meta</h2>
          <p>${err.message || String(err)}</p>
        </body>
        </html>
      `);
    }
  });

  // Radar de Mercado (Google Places) e envio de modelos do WhatsApp
  app.all("/api/radar", (req, res) => radarHandler(req, res));
  app.all("/api/whatsapp-send", (req, res) => whatsappSendHandler(req, res));

  app.all("/api/atlas-score", (req, res) => atlasScoreHandler(req, res));
  app.all("/api/crm", (req, res) => crmHandler(req, res));

  const isProduction = 
    process.env.NODE_ENV === "production" || 
    currentFile.includes("dist") ||
    currentFile.endsWith(".cjs");

  if (isProduction) {
    const distPath = currentFile.includes("dist")
      ? path.dirname(currentFile)
      : path.join(process.cwd(), 'dist');
    
    console.log(`Running in PRODUCTION mode. Serving static assets from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log("Running in DEVELOPMENT mode with Vite middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
