import { applyCors, getAuthenticatedEmail } from "./_lib/auth.ts";
import { RadarError, searchRadar } from "./_lib/radar-service.ts";

export const config = { maxDuration: 60 };

function toNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "" || value === "all") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default async function handler(req: any, res: any) {
  applyCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não suportado." });

  // Cada busca consome a cota paga do Google Places, então exige login.
  const email = await getAuthenticatedEmail(req);
  if (!email) {
    return res.status(401).json({ code: "unauthenticated", error: "Sessão expirada. Saia e entre novamente para usar o Radar." });
  }

  const body = req.body || {};
  try {
    const result = await searchRadar({
      segment: String(body.segment || ""),
      city: String(body.city || ""),
      state: String(body.state || ""),
      radiusKm: toNumber(body.radius) ?? 10,
      quantity: toNumber(body.quantity) ?? 5,
      siteFilter: body.siteFilter === "has_site" || body.siteFilter === "no_site" ? body.siteFilter : "all",
      minRating: toNumber(body.minRating),
      minReviews: toNumber(body.minReviews),
      keyword: String(body.keyword || ""),
    });
    console.log(`[Radar] ${email}: ${result.leads.length} empresas (${result.scanned} analisadas, ${result.enrichedSites} sites lidos).`);
    return res.status(200).json(result);
  } catch (err: any) {
    if (err instanceof RadarError) {
      return res.status(err.status).json({ code: err.code, error: err.message });
    }
    console.error("[Radar] Falha inesperada:", err);
    return res.status(500).json({ code: "internal", error: "Falha inesperada ao consultar o Radar." });
  }
}
