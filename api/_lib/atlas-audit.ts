/**
 * Auditoria do Atlas Score: transforma dados observados da empresa em pontos.
 *
 * Regra central: só pontua o que foi medido. Cada item guarda o dado que o
 * justifica, e itens que não puderam ser medidos saem do cálculo em vez de
 * virar estimativa.
 */
import type { AtlasAudit, AtlasCheck, AtlasCheckStatus, AtlasPillar } from "../../src/types.js";

const SITE_TIMEOUT_MS = 8000;
const SITE_MAX_BYTES = 800_000;
const RECENT_REVIEW_DAYS = 90;

export interface ProfileFacts {
  rating: number | null;
  reviewsCount: number;
  phone: string;
  hasSiteLink: boolean;
  hasOpeningHours: boolean;
  photosCount: number;
  category: string;
  /** Datas (ISO) das avaliações que o Google devolveu junto com o perfil. */
  reviewDates: string[];
}

export interface RankingFacts {
  position: number | null;
  resultsChecked: number;
  windowSize: number;
  positionScore: number | null;
  competitors: { rating: number | null; reviewsCount: number }[];
}

export interface SiteFacts {
  url: string;
  reachable: boolean;
  /** O site respondeu, mas recusou a leitura automática; não dá para afirmar nada sobre o conteúdo. */
  blocked: boolean;
  status: number | null;
  https: boolean;
  responseMs: number | null;
  failure: string;
  html: HtmlFacts | null;
}

export interface HtmlFacts {
  title: string;
  metaDescription: string;
  hasViewport: boolean;
  hasH1: boolean;
  hasWhatsAppLink: boolean;
  hasPhoneLink: boolean;
  hasStructuredData: boolean;
  hasAnalytics: boolean;
  mentionsCity: boolean;
  hasSocialLink: boolean;
  /** Página montada por JavaScript: o conteúdo não é legível sem navegador. */
  renderedByScript: boolean;
}

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ").trim();
}

/** Lê do HTML os sinais que dá para afirmar sem abrir um navegador. */
export function analyzeHtml(html: string, cityName: string): HtmlFacts {
  const title = decodeEntities(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || "");
  const descriptionTag = /<meta\b[^>]*\bname\s*=\s*["']description["'][^>]*>/i.exec(html)?.[0] || "";
  const metaDescription = decodeEntities(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(descriptionTag)?.slice(1).find(Boolean) || "");

  const visibleText = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const text = normalizeText(decodeEntities(visibleText));
  const renderedByScript = text.length < 250 && /<script\b[^>]*\bsrc\s*=/i.test(html);
  const city = normalizeText(cityName);

  return {
    title,
    metaDescription,
    hasViewport: /<meta\b[^>]*\bname\s*=\s*["']viewport["']/i.test(html),
    hasH1: /<h1[\s>]/i.test(html),
    hasWhatsAppLink: /(?:wa\.me\/|wa\.link\/|whatsapp\.com\/send|whatsapp:\/\/send)/i.test(html),
    hasPhoneLink: /href\s*=\s*["']tel:/i.test(html),
    hasStructuredData: /<script\b[^>]*application\/ld\+json[^>]*>[\s\S]*?"@type"/i.test(html),
    hasAnalytics: /googletagmanager\.com|google-analytics\.com|gtag\s*\(|connect\.facebook\.net|fbq\s*\(/i.test(html),
    mentionsCity: Boolean(city) && ` ${text} `.includes(` ${city} `),
    hasSocialLink: /https?:\/\/(?:www\.)?(?:instagram|facebook)\.com\/[A-Za-z0-9_.\-]{2,}/i.test(html),
    renderedByScript,
  };
}

// Respostas com que sites protegidos recusam robôs. O site está no ar para o cliente.
const BLOCKED_STATUSES = new Set([401, 403, 429, 503]);

async function requestSite(url: URL, cityName: string): Promise<SiteFacts> {
  const facts: SiteFacts = {
    url: url.toString(), reachable: false, blocked: false, status: null, https: url.protocol === "https:",
    responseMs: null, failure: "", html: null,
  };
  const started = Date.now();
  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(SITE_TIMEOUT_MS),
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36 AtlasScore/1.0",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "pt-BR,pt;q=0.9",
    },
  });
  facts.responseMs = Date.now() - started;
  facts.status = response.status;
  facts.https = (response.url || facts.url).startsWith("https:");
  facts.url = response.url || facts.url;
  if (BLOCKED_STATUSES.has(response.status)) {
    facts.blocked = true;
    facts.failure = `o site recusou a leitura automática (resposta ${response.status})`;
    return facts;
  }
  if (!response.ok) {
    facts.failure = `o servidor respondeu com erro ${response.status}`;
    return facts;
  }
  facts.reachable = true;
  const buffer = await response.arrayBuffer();
  const html = new TextDecoder("utf-8").decode(buffer.slice(0, SITE_MAX_BYTES));
  if (/<html[\s>]|<head[\s>]|<body[\s>]/i.test(html)) facts.html = analyzeHtml(html, cityName);
  else facts.failure = "a resposta não é uma página HTML";
  return facts;
}

/** Abre a página inicial do site e registra o que respondeu, em quanto tempo e com qual conteúdo. */
export async function fetchSiteFacts(url: URL, cityName: string): Promise<SiteFacts> {
  let lastError: unknown;
  // Uma falha de conexão isolada pode ser passageira; só vale como "fora do ar" se repetir.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await requestSite(url, cityName);
    } catch (err) {
      lastError = err;
      const name = (err as Error)?.name || "";
      if (name === "TimeoutError" || name === "AbortError") break;
    }
  }
  const name = (lastError as Error)?.name || "";
  return {
    url: url.toString(), reachable: false, blocked: false, status: null, https: url.protocol === "https:",
    responseMs: null, html: null,
    failure: name === "TimeoutError" || name === "AbortError"
      ? `não respondeu em ${SITE_TIMEOUT_MS / 1000} segundos`
      : "a conexão falhou em duas tentativas (domínio fora do ar ou certificado inválido)",
  };
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function decimal(value: number, digits = 1): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function check(
  id: string, label: string, maxPoints: number, fraction: number | null, evidence: string, action: string,
): AtlasCheck {
  if (fraction === null) {
    return { id, label, status: "unmeasured", points: 0, maxPoints, evidence, action: "" };
  }
  const clamped = Math.min(1, Math.max(0, fraction));
  const status: AtlasCheckStatus = clamped >= 1 ? "ok" : clamped > 0 ? "partial" : "fail";
  return {
    id, label, status, maxPoints, evidence,
    points: Math.round(clamped * maxPoints * 10) / 10,
    action: status === "ok" ? "" : action,
  };
}

function pillar(id: AtlasPillar["id"], label: string, checks: AtlasCheck[]): AtlasPillar {
  const measured = checks.filter((item) => item.status !== "unmeasured");
  const round = (value: number) => Math.round(value * 10) / 10;
  return {
    id, label, checks,
    points: round(measured.reduce((sum, item) => sum + item.points, 0)),
    measuredMaxPoints: round(measured.reduce((sum, item) => sum + item.maxPoints, 0)),
    maxPoints: round(checks.reduce((sum, item) => sum + item.maxPoints, 0)),
  };
}

function visibilityPillar(profile: ProfileFacts, ranking: RankingFacts, query: string): AtlasPillar {
  const rivals = ranking.competitors;
  const medianReviews = median(rivals.map((rival) => rival.reviewsCount));
  const medianRating = median(rivals.map((rival) => rival.rating).filter((value): value is number => value !== null));
  const enoughRivals = rivals.length >= 3;

  const positionEvidence = ranking.position !== null
    ? `${ranking.position}º lugar na busca "${query}" (${ranking.resultsChecked} resultados conferidos).`
    : ranking.positionScore === 0
      ? `Não aparece entre os ${ranking.windowSize} primeiros resultados da busca "${query}".`
      : `A busca "${query}" devolveu só ${ranking.resultsChecked} resultados e a empresa não está entre eles.`;

  return pillar("visibility", "Visibilidade na busca local", [
    check("position", "Posição na busca do Google Maps", 20,
      ranking.positionScore === null ? null : ranking.positionScore / 100, positionEvidence,
      "Subir na busca local: completar o perfil, conseguir avaliações novas e usar o termo de busca no nome dos serviços e no site."),
    check("reviews-vs-rivals", "Volume de avaliações frente aos concorrentes", 5,
      !enoughRivals || medianReviews === null ? null
        : medianReviews === 0 ? 1 : profile.reviewsCount >= medianReviews ? 1 : profile.reviewsCount >= medianReviews / 2 ? 0.6 : 0,
      enoughRivals && medianReviews !== null
        ? `${profile.reviewsCount} avaliações; a mediana dos ${rivals.length} concorrentes na mesma busca é ${Math.round(medianReviews)}.`
        : "Menos de 3 concorrentes na busca; não há base para comparar.",
      medianReviews !== null ? `Chegar a pelo menos ${Math.round(medianReviews)} avaliações para igualar a mediana dos concorrentes.` : ""),
    check("rating-vs-rivals", "Nota frente aos concorrentes", 5,
      !enoughRivals || medianRating === null || profile.rating === null ? null
        : profile.rating >= medianRating ? 1 : profile.rating >= medianRating - 0.2 ? 0.6 : 0,
      enoughRivals && medianRating !== null && profile.rating !== null
        ? `Nota ${decimal(profile.rating)}; a mediana dos concorrentes na mesma busca é ${decimal(medianRating)}.`
        : profile.rating === null ? "A empresa ainda não tem nota no Google." : "Menos de 3 concorrentes com nota; não há base para comparar.",
      medianRating !== null ? `Responder avaliações negativas e pedir avaliação a clientes satisfeitos para alcançar a nota ${decimal(medianRating)}.` : ""),
  ]);
}

function reputationPillar(profile: ProfileFacts, now: number): AtlasPillar {
  const rating = profile.rating;
  const reviews = profile.reviewsCount;
  const ratingFraction = rating === null ? 0 : rating >= 4.7 ? 1 : rating >= 4.4 ? 0.8 : rating >= 4.0 ? 0.5 : rating >= 3.5 ? 0.2 : 0;
  const volumeFraction = reviews >= 200 ? 1 : reviews >= 100 ? 0.8 : reviews >= 50 ? 0.6 : reviews >= 20 ? 0.4 : reviews >= 5 ? 0.2 : 0;

  const latest = profile.reviewDates.map((date) => Date.parse(date)).filter(Number.isFinite).sort((a, b) => b - a)[0];
  const daysSinceLatest = latest ? Math.floor((now - latest) / 86_400_000) : null;
  // O Google devolve as avaliações mais relevantes, não as mais novas. Só dá para
  // afirmar que há avaliação recente; a ausência nessa amostra não prova o contrário.
  const hasRecent = daysSinceLatest !== null && daysSinceLatest <= RECENT_REVIEW_DAYS;

  return pillar("reputation", "Reputação no Google", [
    check("rating", "Nota média", 10, ratingFraction,
      rating === null ? "Sem nota: a empresa ainda não recebeu avaliações." : `Nota ${decimal(rating)} de 5.`,
      "Pedir avaliação a clientes satisfeitos logo após a entrega e responder todas as avaliações, principalmente as negativas."),
    check("volume", "Quantidade de avaliações", 10, volumeFraction,
      `${reviews} ${reviews === 1 ? "avaliação" : "avaliações"} no perfil.`,
      "Criar uma rotina de pedido de avaliação: link direto do Google enviado por WhatsApp ao fim de cada serviço."),
    check("recency", "Avaliação recente", 5, hasRecent ? 1 : null,
      hasRecent ? `Há avaliação de ${daysSinceLatest} ${daysSinceLatest === 1 ? "dia" : "dias"} atrás.`
        : "O Google não devolveu avaliação dos últimos 90 dias na amostra; não dá para afirmar que não existe.", ""),
  ]);
}

function profilePillar(profile: ProfileFacts): AtlasPillar {
  const photos = profile.photosCount;
  return pillar("profile", "Perfil da empresa no Google", [
    check("operational", "Perfil ativo", 2, 1, "O Google mostra a empresa como aberta e em funcionamento.", ""),
    check("phone", "Telefone no perfil", 3, profile.phone ? 1 : 0,
      profile.phone ? `Telefone público: ${profile.phone}.` : "O perfil não tem telefone.",
      "Cadastrar o telefone (de preferência com WhatsApp) no Perfil da Empresa no Google."),
    check("site-link", "Site vinculado ao perfil", 3, profile.hasSiteLink ? 1 : 0,
      profile.hasSiteLink ? "O perfil aponta para um site próprio." : "O perfil não aponta para um site próprio.",
      "Vincular um site próprio ao perfil; rede social no lugar do site não conta."),
    check("hours", "Horário de funcionamento", 3, profile.hasOpeningHours ? 1 : 0,
      profile.hasOpeningHours ? "Horário de funcionamento preenchido." : "O perfil não informa horário de funcionamento.",
      "Preencher o horário de funcionamento no perfil."),
    check("photos", "Fotos no perfil", 3, photos >= 5 ? 1 : photos >= 1 ? 0.5 : 0,
      photos >= 10 ? "10 fotos ou mais no perfil." : `${photos} ${photos === 1 ? "foto" : "fotos"} no perfil.`,
      "Publicar pelo menos 5 fotos reais de obras, fachada e equipe."),
    check("category", "Categoria definida", 1, profile.category ? 1 : 0,
      profile.category ? `Categoria principal: ${profile.category}.` : "O perfil não tem categoria principal.",
      "Escolher a categoria principal que descreve o serviço."),
  ]);
}

function sitePillar(site: SiteFacts | null): AtlasPillar {
  if (!site) {
    return pillar("site", "Site próprio", [
      check("has-site", "Ter site próprio", 30, 0, "Nenhum site próprio foi encontrado no perfil do Google nem informado na consulta.",
        "Criar um site próprio com serviços, fotos, avaliações e botão de WhatsApp. É o item de maior peso que falta."),
    ]);
  }

  if (site.blocked) {
    return pillar("site", "Site próprio", [
      check("site-read", "Leitura do site", 30, null,
        `O site ${site.url} está no ar, mas ${site.failure}. Os itens do site ficaram fora do cálculo.`, ""),
    ]);
  }
  if (!site.reachable) {
    // Site que não abre não entrega nada ao cliente: perde o pilar inteiro, como quem não tem site.
    return pillar("site", "Site próprio", [
      check("responds", "Site no ar", 30, 0, `O site ${site.url} não abriu: ${site.failure}.`,
        "Colocar o site de volta no ar: hoje o cliente que clica no perfil do Google encontra uma página de erro."),
    ]);
  }

  const html = site.html;
  const responded = site.reachable;
  // Sem resposta do site, o conteúdo não foi lido: esses itens ficam fora do cálculo.
  const content = <T,>(read: (facts: HtmlFacts) => T): T | null => (html ? read(html) : null);
  // Em página montada por JavaScript, o conteúdo visível não está no HTML recebido.
  const visible = (read: (facts: HtmlFacts) => boolean): number | null =>
    !html ? null : html.renderedByScript && !read(html) ? null : read(html) ? 1 : 0;
  const unread = responded ? "O conteúdo da página não pôde ser lido." : `O site não abriu: ${site.failure}.`;
  const scripted = "A página é montada por JavaScript; esse item não é legível sem abrir um navegador.";
  const evidence = (found: string, missing: string, flag: boolean | null, dependsOnVisible = false) =>
    flag === null ? unread : flag ? found : dependsOnVisible && html?.renderedByScript ? scripted : missing;

  const ms = site.responseMs;
  const titleLength = html?.title.length ?? 0;
  const descriptionLength = html?.metaDescription.length ?? 0;

  return pillar("site", "Site próprio", [
    check("responds", "Site no ar", 4, responded ? 1 : 0,
      responded ? `O endereço ${site.url} abriu normalmente.` : `O site não abriu: ${site.failure}.`,
      "Colocar o site de volta no ar: um site fora do ar perde o cliente que veio do Google."),
    check("https", "Conexão segura (HTTPS)", 3, responded ? (site.https ? 1 : 0) : null,
      responded ? (site.https ? "O site abre com cadeado (HTTPS)." : "O site abre sem HTTPS; o navegador mostra \"não seguro\".") : unread,
      "Ativar o certificado HTTPS na hospedagem."),
    check("speed", "Tempo de resposta do servidor", 3, !responded || ms === null ? null : ms <= 1500 ? 1 : ms <= 3000 ? 0.5 : 0,
      responded && ms !== null ? `O servidor respondeu em ${decimal(ms / 1000)} segundos.` : unread,
      "Melhorar a hospedagem ou ativar cache: o servidor deve responder em até 1,5 segundo."),
    check("mobile", "Preparado para celular", 3, content((facts) => (facts.hasViewport ? 1 : 0)),
      evidence("A página declara ajuste de tela para celular.", "A página não declara ajuste de tela para celular (viewport).", content((facts) => facts.hasViewport)),
      "Refazer a página em layout responsivo; a maior parte das buscas locais vem do celular."),
    check("title", "Título da página", 2, content(() => (titleLength >= 15 && titleLength <= 70 ? 1 : titleLength > 0 ? 0.5 : 0)),
      !html ? unread : titleLength === 0 ? "A página não tem título." : `Título com ${titleLength} caracteres: "${html.title.slice(0, 90)}".`,
      "Escrever um título de 15 a 70 caracteres com o serviço e a cidade."),
    check("description", "Descrição para o Google", 2, content(() => (descriptionLength >= 50 && descriptionLength <= 170 ? 1 : descriptionLength > 0 ? 0.5 : 0)),
      !html ? unread : descriptionLength === 0 ? "A página não tem descrição (meta description)." : `Descrição com ${descriptionLength} caracteres.`,
      "Escrever uma descrição de 50 a 170 caracteres dizendo o que a empresa faz e onde atende."),
    check("h1", "Título principal no conteúdo", 1, visible((facts) => facts.hasH1),
      evidence("A página tem um título principal (H1).", "A página não tem título principal (H1).", content((facts) => facts.hasH1), true),
      "Colocar um título principal com o serviço oferecido."),
    check("contact", "Botão de WhatsApp ou telefone clicável", 4, visible((facts) => facts.hasWhatsAppLink || facts.hasPhoneLink),
      evidence(html?.hasWhatsAppLink ? "A página tem link direto para o WhatsApp." : "A página tem telefone clicável.",
        "A página não tem link de WhatsApp nem telefone clicável.", content((facts) => facts.hasWhatsAppLink || facts.hasPhoneLink), true),
      "Colocar um botão de WhatsApp visível logo no topo da página."),
    check("city", "Cidade citada na página", 2, visible((facts) => facts.mentionsCity),
      evidence("O texto da página cita a cidade.", "O texto da página não cita a cidade.", content((facts) => facts.mentionsCity), true),
      "Citar a cidade e a região atendida no texto da página."),
    check("structured-data", "Dados estruturados", 2, content((facts) => (facts.hasStructuredData ? 1 : 0)),
      evidence("A página informa dados estruturados ao Google.", "A página não informa dados estruturados (schema.org).", content((facts) => facts.hasStructuredData)),
      "Adicionar dados estruturados de negócio local (nome, endereço, telefone, horário)."),
    check("analytics", "Medição de visitas", 2, content((facts) => (facts.hasAnalytics ? 1 : 0)),
      evidence("A página tem ferramenta de medição instalada (Google ou Meta).", "A página não tem ferramenta de medição de visitas instalada.", content((facts) => facts.hasAnalytics)),
      "Instalar o Google Analytics para saber quantas visitas viram contato."),
    check("social", "Link para rede social", 2, visible((facts) => facts.hasSocialLink),
      evidence("A página tem link para Instagram ou Facebook.", "A página não tem link para Instagram ou Facebook.", content((facts) => facts.hasSocialLink), true),
      "Ligar o site ao Instagram ou Facebook da empresa."),
  ]);
}

export function buildAudit(input: {
  profile: ProfileFacts;
  ranking: RankingFacts;
  site: SiteFacts | null;
  query: string;
  now?: number;
}): AtlasAudit {
  const pillars = [
    visibilityPillar(input.profile, input.ranking, input.query),
    reputationPillar(input.profile, input.now ?? Date.now()),
    profilePillar(input.profile),
    sitePillar(input.site),
  ];
  const points = pillars.reduce((sum, item) => sum + item.points, 0);
  const measured = pillars.reduce((sum, item) => sum + item.measuredMaxPoints, 0);
  const total = pillars.reduce((sum, item) => sum + item.maxPoints, 0);
  const rivals = input.ranking.competitors;

  return {
    overallScore: measured > 0 ? Math.round((points / measured) * 100) : null,
    coverage: Math.round((measured / total) * 100),
    pillars,
    recommendations: pillars
      .flatMap((item) => item.checks)
      .filter((item) => (item.status === "fail" || item.status === "partial") && item.action)
      .sort((a, b) => (b.maxPoints - b.points) - (a.maxPoints - a.points))
      .slice(0, 6),
    competitors: {
      compared: rivals.length,
      medianRating: median(rivals.map((rival) => rival.rating).filter((value): value is number => value !== null)),
      medianReviews: median(rivals.map((rival) => rival.reviewsCount)),
    },
  };
}
