import { classifyUrl, findCityCenter, getAuthenticatedEmail, localRankingQuery, LOCAL_SCORE_WINDOW, placesTextSearch, RadarError, scoreForLocalPosition } from "./radar.js";
import type { AtlasScoreReport } from "../src/types.js";
import { buildAudit, fetchSiteFacts, type SiteFacts } from "./_lib/atlas-audit.js";

interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  addressComponents?: { longText: string; shortText: string; types: string[] }[];
  googleMapsUri?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  businessStatus?: string;
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: { periods?: unknown[]; weekdayDescriptions?: string[] };
  photos?: unknown[];
  primaryTypeDisplayName?: { text?: string };
  reviews?: { publishTime?: string }[];
}

const PROFILE_FIELDS = [
  "places.id", "places.displayName", "places.addressComponents", "places.googleMapsUri",
  "places.websiteUri", "places.nationalPhoneNumber", "places.businessStatus",
  "places.rating", "places.userRatingCount",
  // Usados pela auditoria: horário, fotos, categoria e datas das avaliações.
  "places.regularOpeningHours", "places.photos", "places.primaryTypeDisplayName", "places.reviews.publishTime",
].join(",");

// A nota e o volume de avaliações dos concorrentes entram na comparação da auditoria.
const RANKING_FIELDS = "places.id,places.rating,places.userRatingCount";

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, " ").trim();
}

function parseCity(input: string) {
  const parts = normalize(input).split(" ");
  const last = parts.at(-1);
  const hasState = parts.length > 1 && Boolean(last && /^(ac|al|ap|am|ba|ce|df|es|go|ma|mt|ms|mg|pa|pb|pr|pe|pi|rj|rn|rs|ro|rr|sc|sp|se|to)$/.test(last));
  return { name: hasState ? parts.slice(0, -1).join(" ") : parts.join(" "), state: hasState ? last : undefined };
}

function inCity(place: GooglePlace, city: ReturnType<typeof parseCity>): boolean {
  const components = place.addressComponents || [];
  const municipalities = components.filter((part) =>
    part.types.includes("locality") || part.types.includes("administrative_area_level_2"),
  );
  const state = components.find((part) => part.types.includes("administrative_area_level_1"));
  return Boolean(municipalities.some((part) => normalize(part.longText) === city.name) &&
    (!city.state || (state && normalize(state.shortText) === city.state)));
}

function mapsIdentity(value: string): string {
  try {
    const url = new URL(value);
    if (!/(^|\.)google\.com(\.br)?$/i.test(url.hostname)) return "";
    const placeId = url.searchParams.get("query_place_id") || url.searchParams.get("place_id");
    if (placeId) return `place:${placeId}`;
    const cid = url.searchParams.get("cid");
    if (cid && /^\d+$/.test(cid)) return `cid:${BigInt(cid)}`;
    const match = url.pathname.match(/!1s0x[\da-f]+:(0x[\da-f]+)/i);
    if (match) return `cid:${BigInt(match[1])}`;
  } catch {
    return "";
  }
  return "";
}

function domainOf(value: string): string {
  const link = classifyUrl(value);
  return link?.kind === "site" ? link.url.hostname.toLowerCase().replace(/^www\./, "") : "";
}

function matchProfile(places: GooglePlace[], name: string, cityInput: string, website: string, mapsUrl: string): GooglePlace {
  const city = parseCity(cityInput);
  const matches = new Map<string, GooglePlace>();
  for (const place of places) {
    if (place.id && (!place.businessStatus || place.businessStatus === "OPERATIONAL") &&
      normalize(place.displayName?.text || "") === normalize(name) && inCity(place, city)) {
      matches.set(place.id, place);
    }
  }

  let candidates = [...matches.values()];
  if (mapsUrl) {
    const identity = mapsIdentity(mapsUrl);
    candidates = candidates.filter((place) => place.googleMapsUri === mapsUrl ||
      (identity && (identity === `place:${place.id}` || identity === mapsIdentity(place.googleMapsUri || ""))));
  } else if (website) {
    const domain = domainOf(website);
    candidates = candidates.filter((place) => domain && domain === domainOf(place.websiteUri || ""));
  }
  if (candidates.length !== 1) {
    const hint = mapsUrl && !mapsIdentity(mapsUrl) ? " Para links encurtados, abra o perfil no navegador e copie o endereço completo." : "";
    throw new RadarError("bad_request", candidates.length > 1
      ? "Há mais de um perfil com esse nome na cidade. Informe o site ou o link completo do perfil no Google Maps."
      : "Não foi possível confirmar o perfil. Confira o nome exato, a cidade e o link completo do Google Maps." + hint, 422);
  }
  return candidates[0];
}

function readText(input: unknown, limit: number): string {
  return typeof input === "string" ? input.replace(/\s+/g, " ").trim().slice(0, limit) : "";
}

export interface AtlasScoreInput {
  name: string;
  city: string;
  segment: string;
  website: string;
  mapsUrl: string;
  radiusKm?: unknown;
}

/** Consulta o Google e o site da empresa e monta o relatório. Lança RadarError em falhas previstas. */
export async function measureAtlasScore(input: AtlasScoreInput): Promise<AtlasScoreReport> {
  const { name, city, segment, website, mapsUrl } = input;
  const place = `${city}, Brasil`;
  const query = `${segment} em ${place}`;
  const radiusKm = typeof input.radiusKm === "number" && Number.isFinite(input.radiusKm)
    ? Math.min(100, Math.max(1, input.radiusKm)) : 10;
  const options = { languageCode: "pt-BR", regionCode: "BR", pageSize: LOCAL_SCORE_WINDOW };
  const [profileResult, center] = await Promise.all([
    placesTextSearch({ ...options, textQuery: `${name}, ${place}` }, PROFILE_FIELDS),
    findCityCenter(place),
  ]);
  const profile = matchProfile(profileResult.places || [], name, city, website, mapsUrl);
  const profileSite = classifyUrl(profile.websiteUri || "");
  const informedSite = classifyUrl(website);
  const siteUrl = profileSite?.kind === "site" ? profileSite.url : informedSite?.kind === "site" ? informedSite.url : null;
  const cityName = parseCity(city).name;

  // A busca dos concorrentes e a leitura do site não dependem uma da outra.
  const [ranked, site] = await Promise.all([
    placesTextSearch(localRankingQuery(query, center, radiusKm), RANKING_FIELDS),
    siteUrl ? fetchSiteFacts(siteUrl, cityName) : Promise.resolve<SiteFacts | null>(null),
  ]);
  const rankedPlaces: GooglePlace[] = [];
  for (const item of (ranked.places || []) as GooglePlace[]) {
    if (item.id && !rankedPlaces.some((other) => other.id === item.id)) rankedPlaces.push(item);
  }
  const window = rankedPlaces.slice(0, LOCAL_SCORE_WINDOW);
  const ids = window.map((item) => item.id!);
  const rankIndex = ids.indexOf(profile.id!);
  const position = rankIndex < 0 ? null : rankIndex + 1;
  const positionScore = position !== null ? scoreForLocalPosition(position) : ids.length >= LOCAL_SCORE_WINDOW ? 0 : null;
  const rating = typeof profile.rating === "number" ? profile.rating : null;
  const result: AtlasScoreReport = {
    companyName: profile.displayName!.text!,
    city,
    profileUrl: profile.googleMapsUri || "",
    website: classifyUrl(profile.websiteUri || "")?.kind === "site" ? profile.websiteUri! : "",
    phone: profile.nationalPhoneNumber || "",
    rating,
    reviewsCount: profile.userRatingCount || 0,
    localSearch: {
      query,
      position,
      resultsChecked: ids.length,
      score: positionScore,
      checkedAt: new Date().toISOString(),
    },
    audit: buildAudit({
      query,
      site,
      profile: {
        rating,
        reviewsCount: profile.userRatingCount || 0,
        phone: profile.nationalPhoneNumber || "",
        hasSiteLink: profileSite?.kind === "site",
        hasOpeningHours: Boolean(profile.regularOpeningHours?.periods?.length || profile.regularOpeningHours?.weekdayDescriptions?.length),
        photosCount: profile.photos?.length || 0,
        category: profile.primaryTypeDisplayName?.text || "",
        reviewDates: (profile.reviews || []).map((review) => review.publishTime || "").filter(Boolean),
      },
      ranking: {
        position,
        resultsChecked: ids.length,
        windowSize: LOCAL_SCORE_WINDOW,
        positionScore,
        competitors: window
          .filter((item) => item.id !== profile.id)
          .map((item) => ({ rating: typeof item.rating === "number" ? item.rating : null, reviewsCount: item.userRatingCount || 0 })),
      },
    }),
  };
  return result;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST para consultar o Atlas Score." });
  if (!(await getAuthenticatedEmail(req))) {
    return res.status(401).json({ code: "unauthenticated", error: "Entre na sua conta para consultar o Atlas Score." });
  }

  const body = req.body || {};
  const name = readText(body.companyName, 160);
  const city = readText(body.city, 100);
  const segment = readText(body.segment, 100);
  const website = readText(body.website, 600);
  const mapsUrl = readText(body.googleMapsUrl, 1200);
  if (!normalize(name) || !normalize(city) || !normalize(segment)) {
    return res.status(400).json({ error: "Informe o nome da empresa, a cidade e o termo de busca." });
  }

  try {
    const result = await measureAtlasScore({ name, city, segment, website, mapsUrl, radiusKm: body.radiusKm });
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof RadarError) return res.status(err.status).json({ error: err.message });
    console.error("[Atlas Score] Falha na consulta do Google Places:", err);
    return res.status(502).json({ error: "A consulta ao Google Places falhou. Tente novamente." });
  }
}
