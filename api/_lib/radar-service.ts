/**
 * Radar de Mercado: busca empresas reais no Google Places e completa os
 * contatos (WhatsApp, Instagram, Facebook, e-mail) lendo o site de cada uma.
 */

const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACES_PAGE_SIZE = 20;
const PLACES_MAX_PAGES = 3; // limite do Google: 60 resultados por busca
const MAX_RADIUS_BIAS_METERS = 50000; // limite do Google para locationBias
const SITE_FETCH_TIMEOUT_MS = 4500;
const SITE_MAX_BYTES = 600_000;
const ENRICH_CONCURRENCY = 10;
const ENRICH_BUDGET_MS = 25_000;

export type WhatsAppConfidence = "confirmado" | "provavel" | "incerto" | "";

export interface RadarLead {
  id: string;
  companyName: string;
  segment: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  /** Somente dígitos, com DDI 55. Vazio quando não há número utilizável. */
  whatsapp: string;
  whatsappConfidence: WhatsAppConfidence;
  whatsappLink: string;
  email: string;
  /** Site próprio. Vazio quando a empresa só tem rede social ou nada. */
  website: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  googleProfile: string;
  rating: number | null;
  reviewsCount: number;
  distanceKm: number | null;
  atlasScore: number;
  closeProbability: number;
  notes: string;
}

export interface RadarSearchParams {
  segment: string;
  city: string;
  state?: string;
  radiusKm?: number;
  quantity?: number;
  siteFilter?: "all" | "has_site" | "no_site";
  minRating?: number | null;
  minReviews?: number | null;
  keyword?: string;
}

export interface RadarSearchResult {
  leads: RadarLead[];
  scanned: number;
  enrichedSites: number;
}

export class RadarError extends Error {
  constructor(public code: "missing_key" | "google_error" | "bad_request", message: string, public status = 400) {
    super(message);
  }
}

function getPlacesKey(): string {
  const key = (process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "").trim();
  if (!key) {
    throw new RadarError(
      "missing_key",
      "A chave do Google Places não está configurada. Defina GOOGLE_PLACES_API_KEY nas variáveis de ambiente do servidor.",
      503
    );
  }
  return key;
}

async function placesTextSearch(body: Record<string, unknown>, fieldMask: string): Promise<any> {
  const response = await fetch(PLACES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getPlacesKey(),
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.error?.message || `HTTP ${response.status}`;
    throw new RadarError("google_error", `O Google Places recusou a busca: ${detail}`, 502);
  }
  return data;
}

function haversineKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Normaliza um telefone brasileiro para dígitos com DDI 55. */
export function normalizeBrazilPhone(raw: string): { digits: string; isMobile: boolean } | null {
  let digits = (raw || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0800") || digits.startsWith("0300")) return null;
  digits = digits.replace(/^0+/, "");
  if (digits.startsWith("55") && digits.length >= 12) digits = digits.slice(2);
  if (digits.length !== 10 && digits.length !== 11) return null;
  const isMobile = digits.length === 11 && digits[2] === "9";
  return { digits: `55${digits}`, isMobile };
}

const SOCIAL_HOSTS: Array<{ test: RegExp; kind: "instagram" | "facebook" | "whatsapp" | "linkedin" | "other" }> = [
  { test: /(^|\.)instagram\.com$/i, kind: "instagram" },
  { test: /(^|\.)(facebook|fb)\.com(\.br)?$/i, kind: "facebook" },
  { test: /(^|\.)(wa\.me|whatsapp\.com|wa\.link)$/i, kind: "whatsapp" },
  { test: /(^|\.)linkedin\.com$/i, kind: "linkedin" },
  { test: /(^|\.)(linktr\.ee|linktree\.com|bio\.link|beacons\.ai|taplink\.cc)$/i, kind: "other" },
];

function classifyUrl(rawUrl: string): { kind: "site" | "instagram" | "facebook" | "whatsapp" | "linkedin" | "other"; url: URL } | null {
  try {
    const url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!isPublicHostname(url.hostname)) return null;
    const match = SOCIAL_HOSTS.find((entry) => entry.test.test(url.hostname));
    return { kind: match ? match.kind : "site", url };
  } catch {
    return null;
  }
}

/** Impede que a leitura de sites alcance endereços internos da rede. */
function isPublicHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false; // IPv4 literal
  if (host.includes(":") || host.startsWith("[")) return false; // IPv6 literal
  return host.includes(".");
}

const INSTAGRAM_RESERVED = new Set(["p", "reel", "reels", "explore", "accounts", "share", "stories", "tv", "direct", "about", "developer", "legal"]);
const FACEBOOK_RESERVED = new Set(["sharer", "sharer.php", "share.php", "tr", "plugins", "dialog", "profile.php", "login", "policies", "help", "privacy", "share", "l.php", "hashtag", "events", "groups", "watch"]);

function firstInstagram(html: string): string {
  const regex = /https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9_.]{2,30})/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const handle = match[1].replace(/\.+$/, "");
    if (!INSTAGRAM_RESERVED.has(handle.toLowerCase())) return `https://www.instagram.com/${handle}`;
  }
  return "";
}

function firstFacebook(html: string): string {
  const regex = /https?:\/\/(?:www\.|m\.|pt-br\.)?facebook\.com\/([A-Za-z0-9_.\-]{3,80})/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    if (!FACEBOOK_RESERVED.has(match[1].toLowerCase())) return `https://www.facebook.com/${match[1]}`;
  }
  return "";
}

function firstLinkedin(html: string): string {
  const match = /https?:\/\/(?:[a-z]{2}\.|www\.)?linkedin\.com\/(?:company|in)\/[A-Za-z0-9_\-%.]+/i.exec(html);
  return match ? match[0] : "";
}

function firstWhatsApp(html: string): string {
  const regex = /(?:wa\.me\/|whatsapp\.com\/send\/?\?[^"'\s<>]*?phone=|whatsapp:\/\/send\/?\?[^"'\s<>]*?phone=)(?:\+|%2B)?(\d{10,15})/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const normalized = normalizeBrazilPhone(match[1]);
    if (normalized) return normalized.digits;
  }
  return "";
}

const EMAIL_NOISE = /(\.(png|jpe?g|gif|webp|svg|css|js)$)|sentry|wixpress|example\.|seudominio|seuemail|email\.com$|domain\.com$/i;

function firstEmail(html: string): string {
  const regex = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,10}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const email = match[0].toLowerCase();
    if (!EMAIL_NOISE.test(email) && email.length <= 80) return email;
  }
  return "";
}

async function fetchSiteHtml(url: URL): Promise<string> {
  if (!isPublicHostname(url.hostname)) return "";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SITE_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RadarDeMercado/1.0)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });
    if (!response.ok) return "";
    const contentType = response.headers.get("content-type") || "";
    if (contentType && !/text\/html|application\/xhtml/i.test(contentType)) return "";
    const buffer = await response.arrayBuffer();
    return new TextDecoder("utf-8").decode(buffer.slice(0, SITE_MAX_BYTES));
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

async function runPool<T>(items: T[], limit: number, deadline: number, worker: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length && Date.now() < deadline) {
      const item = items[cursor++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}

function estimateScores(lead: RadarLead, siteIsHttps: boolean): { atlasScore: number; closeProbability: number } {
  const rating = lead.rating ?? 0;
  const reviews = lead.reviewsCount;

  let score = 15;
  if (lead.website) score += 30;
  if (lead.website && siteIsHttps) score += 5;
  if (rating >= 4.5) score += 10;
  else if (rating >= 4) score += 6;
  if (reviews >= 100) score += 15;
  else if (reviews >= 50) score += 10;
  else if (reviews >= 10) score += 5;
  if (lead.instagram) score += 8;
  if (lead.whatsappConfidence === "confirmado") score += 7;
  if (lead.phone) score += 5;
  if (lead.facebook) score += 3;

  // Quem tem cliente (avaliações) mas presença digital fraca é a melhor oportunidade.
  let close = lead.website ? 25 : 50;
  if (reviews >= 50) close += 15;
  else if (reviews >= 10) close += 8;
  if (rating >= 4) close += 5;
  if (lead.whatsapp) close += 5;

  return { atlasScore: Math.min(score, 100), closeProbability: Math.min(close, 90) };
}

export async function searchRadar(params: RadarSearchParams): Promise<RadarSearchResult> {
  const segment = (params.segment || "").trim();
  const city = (params.city || "").trim();
  const state = (params.state || "").trim().toUpperCase();
  if (!segment || !city) {
    throw new RadarError("bad_request", "Informe o segmento e a cidade.");
  }
  const quantity = Math.min(Math.max(Math.floor(params.quantity || 5), 1), 60);
  const radiusKm = Math.min(Math.max(params.radiusKm || 10, 1), 100);
  const siteFilter = params.siteFilter || "all";
  const keyword = (params.keyword || "").trim().slice(0, 80);
  const place = [city, state, "Brasil"].filter(Boolean).join(", ");

  // 1. Centro da cidade, para aplicar o raio de cobertura.
  let center: { latitude: number; longitude: number } | null = null;
  try {
    const cityData = await placesTextSearch(
      { textQuery: place, languageCode: "pt-BR", regionCode: "BR", pageSize: 1 },
      "places.location"
    );
    center = cityData?.places?.[0]?.location || null;
  } catch (err) {
    if (err instanceof RadarError && err.code === "missing_key") throw err;
    // Sem o centro a busca continua, apenas sem o filtro de distância.
  }

  // 2. Empresas do segmento na região.
  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.nationalPhoneNumber",
    "places.internationalPhoneNumber",
    "places.websiteUri",
    "places.rating",
    "places.userRatingCount",
    "places.googleMapsUri",
    "places.businessStatus",
    "nextPageToken",
  ].join(",");

  const baseBody: Record<string, unknown> = {
    textQuery: `${segment}${keyword ? ` ${keyword}` : ""} em ${place}`,
    languageCode: "pt-BR",
    regionCode: "BR",
    pageSize: PLACES_PAGE_SIZE,
  };
  if (center) {
    baseBody.locationBias = {
      circle: { center, radius: Math.min(radiusKm * 1000, MAX_RADIUS_BIAS_METERS) },
    };
  }

  const leads: RadarLead[] = [];
  const siteUrls = new Map<string, URL>();
  const seen = new Set<string>();
  let scanned = 0;
  let pageToken: string | undefined;

  for (let page = 0; page < PLACES_MAX_PAGES && leads.length < quantity; page++) {
    const data = await placesTextSearch(pageToken ? { ...baseBody, pageToken } : baseBody, fieldMask);
    const places: any[] = data?.places || [];
    scanned += places.length;

    for (const item of places) {
      if (leads.length >= quantity) break;
      if (!item?.id || seen.has(item.id)) continue;
      seen.add(item.id);
      if (item.businessStatus && item.businessStatus !== "OPERATIONAL") continue;

      const rating: number | null = typeof item.rating === "number" ? item.rating : null;
      const reviewsCount: number = item.userRatingCount || 0;
      if (params.minRating && (rating === null || rating < params.minRating)) continue;
      if (params.minReviews && reviewsCount < params.minReviews) continue;

      const distanceKm = center && item.location ? haversineKm(center, item.location) : null;
      if (distanceKm !== null && distanceKm > radiusKm) continue;

      const classified = item.websiteUri ? classifyUrl(item.websiteUri) : null;
      const hasOwnSite = classified?.kind === "site";
      if (siteFilter === "has_site" && !hasOwnSite) continue;
      if (siteFilter === "no_site" && hasOwnSite) continue;

      const phoneRaw: string = item.nationalPhoneNumber || item.internationalPhoneNumber || "";
      const phone = normalizeBrazilPhone(phoneRaw);

      const lead: RadarLead = {
        id: `radar-${item.id}`,
        companyName: item.displayName?.text || "Empresa sem nome",
        segment,
        address: item.formattedAddress || "",
        city,
        state,
        phone: phoneRaw,
        whatsapp: phone ? phone.digits : "",
        whatsappConfidence: phone ? (phone.isMobile ? "provavel" : "incerto") : "",
        whatsappLink: "",
        email: "",
        website: hasOwnSite ? classified!.url.toString() : "",
        instagram: classified?.kind === "instagram" ? classified.url.toString() : "",
        facebook: classified?.kind === "facebook" ? classified.url.toString() : "",
        linkedin: classified?.kind === "linkedin" ? classified.url.toString() : "",
        googleProfile: item.googleMapsUri || "",
        rating,
        reviewsCount,
        distanceKm: distanceKm === null ? null : Math.round(distanceKm * 10) / 10,
        atlasScore: 0,
        closeProbability: 0,
        notes: "",
      };

      // O "site" cadastrado no Google às vezes é o próprio link do WhatsApp.
      if (classified?.kind === "whatsapp") {
        const fromLink = firstWhatsApp(classified.url.toString());
        if (fromLink) {
          lead.whatsapp = fromLink;
          lead.whatsappConfidence = "confirmado";
        }
      }

      if (hasOwnSite) siteUrls.set(lead.id, classified!.url);
      leads.push(lead);
    }

    pageToken = data?.nextPageToken;
    if (!pageToken) break;
  }

  // 3. Lê o site de cada empresa para achar WhatsApp, redes sociais e e-mail.
  let enrichedSites = 0;
  const withSite = leads.filter((lead) => siteUrls.has(lead.id));
  await runPool(withSite, ENRICH_CONCURRENCY, Date.now() + ENRICH_BUDGET_MS, async (lead) => {
    const html = await fetchSiteHtml(siteUrls.get(lead.id)!);
    if (!html) return;
    enrichedSites++;
    const whatsapp = firstWhatsApp(html);
    if (whatsapp) {
      lead.whatsapp = whatsapp;
      lead.whatsappConfidence = "confirmado";
    }
    if (!lead.instagram) lead.instagram = firstInstagram(html);
    if (!lead.facebook) lead.facebook = firstFacebook(html);
    if (!lead.linkedin) lead.linkedin = firstLinkedin(html);
    lead.email = firstEmail(html);
  });

  for (const lead of leads) {
    lead.whatsappLink = lead.whatsapp ? `https://wa.me/${lead.whatsapp}` : "";
    const siteUrl = siteUrls.get(lead.id);
    const scores = estimateScores(lead, siteUrl?.protocol === "https:");
    lead.atlasScore = scores.atlasScore;
    lead.closeProbability = scores.closeProbability;
    const ratingText = lead.rating !== null
      ? `Nota ${lead.rating.toFixed(1)} no Google com ${lead.reviewsCount} avaliações.`
      : "Ainda sem avaliações no Google.";
    lead.notes = `Encontrada no Google Maps${lead.address ? `: ${lead.address}` : ""}. ${ratingText} ${
      lead.website ? "Tem site próprio." : "Não tem site próprio cadastrado."
    }`;
  }

  return { leads, scanned, enrichedSites };
}
