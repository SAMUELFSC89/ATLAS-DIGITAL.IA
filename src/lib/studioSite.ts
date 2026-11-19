/**
 * Structured site document produced by the AI site creator and rendered by the animated scene library.
 * The same validator runs on the server (Claude output) and in the editor, so both always agree on what is valid.
 */

export const SCENE_TYPES = {
  'hero-particulas': { label: 'Abertura com partículas 3D', hint: 'Título revelado por palavra sobre um campo de partículas 3D que reage ao mouse e à rolagem. Bom protagonista quando não há foto forte.' },
  'hero-midia': { label: 'Abertura com foto em tela cheia', hint: 'Foto real em tela cheia que entra com zoom e desfoque, título revelado por linha, parallax ao rolar. Exige uma foto.' },
  manifesto: { label: 'Manifesto revelado na rolagem', hint: 'Frase grande cujas palavras acendem uma a uma conforme a rolagem. Transmite a promessa ou a sensação da marca.' },
  'cena-presa': { label: 'Cena presa com revelação', hint: 'A seção fica parada enquanto uma foto se abre num círculo e os passos do texto trocam. Para processo, etapas ou destaque de produto.' },
  'cartas-empilhadas': { label: 'Cartas empilhadas', hint: 'Cada serviço é uma carta que sobe por cima da anterior. Para listas de serviços ou diferenciais (2 a 5 itens).' },
  'galeria-horizontal': { label: 'Galeria horizontal', hint: 'A rolagem vertical move uma faixa de fotos para o lado. Para portfólio, produtos ou ambientes (3 a 8 itens com foto).' },
  'parallax-camadas': { label: 'Parallax em camadas', hint: 'Duas ou três fotos em profundidades diferentes com o texto no meio. Para a seção "sobre" ou história.' },
  contadores: { label: 'Números que sobem', hint: 'Números reais que contam até o valor final. Use SOMENTE com números fornecidos pelo cliente.' },
  'antes-depois': { label: 'Antes e depois', hint: 'Duas fotos reais em que a rolagem desliza a máscara do antes para o depois. Exige duas fotos do mesmo enquadramento.' },
  'cta-final': { label: 'Chamada final', hint: 'Título grande, botão magnético de WhatsApp e troca de cor de fundo. Encerra o site.' },
} as const;
export type SceneType = keyof typeof SCENE_TYPES;
export const SCENE_TYPE_IDS = Object.keys(SCENE_TYPES) as SceneType[];

/** Curated Google Fonts with weights that are known to exist, so a font request never fails. */
export const DISPLAY_FONTS: Record<string, { spec: string; weight: number; feel: string }> = {
  Fraunces: { spec: 'wght@400;700', weight: 700, feel: 'serifada calorosa e expressiva' },
  'Playfair Display': { spec: 'wght@400;700', weight: 700, feel: 'serifada clássica de alto contraste' },
  'Cormorant Garamond': { spec: 'wght@400;700', weight: 600, feel: 'serifada elegante e delicada' },
  'Bodoni Moda': { spec: 'wght@400;700', weight: 700, feel: 'moda e luxo editorial' },
  'DM Serif Display': { spec: '', weight: 400, feel: 'serifada sofisticada e firme' },
  'Instrument Serif': { spec: '', weight: 400, feel: 'serifada editorial contemporânea' },
  'Libre Caslon Display': { spec: '', weight: 400, feel: 'tradição e prestígio' },
  Italiana: { spec: '', weight: 400, feel: 'fina, luxuosa e leve' },
  Marcellus: { spec: '', weight: 400, feel: 'clássica romana, institucional' },
  'Abril Fatface': { spec: '', weight: 400, feel: 'impacto editorial pesado' },
  Syne: { spec: 'wght@400;700', weight: 700, feel: 'criativa e ousada' },
  Unbounded: { spec: 'wght@400;700', weight: 700, feel: 'tecnológica e arredondada' },
  'Bricolage Grotesque': { spec: 'wght@400;700', weight: 700, feel: 'grotesca moderna com personalidade' },
  'Space Grotesk': { spec: 'wght@400;700', weight: 700, feel: 'técnica e geométrica' },
  Sora: { spec: 'wght@400;700', weight: 700, feel: 'limpa e tecnológica' },
  Outfit: { spec: 'wght@400;700', weight: 700, feel: 'geométrica amigável' },
  Oswald: { spec: 'wght@400;700', weight: 700, feel: 'condensada forte' },
  Anton: { spec: '', weight: 400, feel: 'condensada pesada, esporte e força' },
  'Bebas Neue': { spec: '', weight: 400, feel: 'condensada de impacto' },
  'Big Shoulders Display': { spec: 'wght@400;700', weight: 700, feel: 'industrial e robusta' },
  'Archivo Black': { spec: '', weight: 400, feel: 'grotesca pesada e direta' },
  'Krona One': { spec: '', weight: 400, feel: 'larga e futurista' },
  'Tenor Sans': { spec: '', weight: 400, feel: 'refinada e serena' },
};
export const BODY_FONTS: Record<string, { spec: string }> = {
  'Inter Tight': { spec: 'wght@400;700' }, Manrope: { spec: 'wght@400;700' }, 'DM Sans': { spec: 'wght@400;700' },
  'Work Sans': { spec: 'wght@400;700' }, 'Source Serif 4': { spec: 'wght@400;700' }, Lora: { spec: 'wght@400;700' },
  'IBM Plex Sans': { spec: 'wght@400;700' }, Karla: { spec: 'wght@400;700' }, 'Nunito Sans': { spec: 'wght@400;700' },
  Figtree: { spec: 'wght@400;700' }, 'Public Sans': { spec: 'wght@400;700' }, 'Libre Franklin': { spec: 'wght@400;700' },
};

export const EASES = { suave: 'power3.out', firme: 'expo.out', elastico: 'back.out(1.6)' } as const;
export type EaseId = keyof typeof EASES;
export const PARTICLE_SHAPES = ['nuvem', 'onda', 'espiral'] as const;

export interface StudioTokens {
  colors: { bg: string; bgAlt: string; text: string; muted: string; accent: string; accentText: string };
  fonts: { display: string; body: string };
  radius: number;
  ease: EaseId;
  intensity: 'calma' | 'media' | 'intensa';
  grain: boolean;
}

/** A visual the scene needs. When the client has no file for it, `need` says what to get or generate (never a drawn substitute). */
export interface StudioMedia { assetId?: string; need?: { file: string; description: string; prompt: string } }
export interface StudioItem { title: string; text?: string; value?: string; media?: StudioMedia }
export interface StudioScene {
  id: string;
  type: SceneType;
  tone: 'base' | 'alt' | 'destaque';
  eyebrow?: string;
  title: string;
  text?: string;
  items?: StudioItem[];
  media?: StudioMedia[];
  cta?: string;
  shape?: typeof PARTICLE_SHAPES[number];
}
export interface StudioSite {
  version: 1;
  meta: { businessName: string; title: string; description: string; whatsapp: string; whatsappMessage: string; logoAssetId?: string };
  tokens: StudioTokens;
  scenes: StudioScene[];
}

export interface StudioAsset { id: string; kind: 'photo' | 'logo'; name: string; mimeType: string; width: number; height: number; url: string }

export class StudioValidationError extends Error {}

const HEX = /^#[0-9a-f]{6}$/i;
const clean = (value: unknown, max: number) => typeof value === 'string'
  ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/[<>]/g, '').trim().slice(0, max) : '';

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
/** Keeps the chosen color when it is readable on the background; otherwise falls back to near-black or near-white. */
export function readable(color: string, background: string, minimum: number) {
  if (contrast(color, background) >= minimum) return color;
  return contrast('#111111', background) >= contrast('#f7f5f0', background) ? '#111111' : '#f7f5f0';
}

function media(value: any, assetIds: Set<string>): StudioMedia | undefined {
  if (!value || typeof value !== 'object') return undefined;
  if (typeof value.assetId === 'string' && assetIds.has(value.assetId)) return { assetId: value.assetId };
  const file = clean(value.need?.file, 80).toLowerCase().replace(/[^a-z0-9.\-]/g, '-');
  const description = clean(value.need?.description, 200), prompt = clean(value.need?.prompt, 600);
  return file && description ? { need: { file, description, prompt } } : undefined;
}

export function sanitizeTokens(input: any): StudioTokens {
  const c = input?.colors || {};
  const bg = HEX.test(c.bg) ? c.bg : '#0d0d0d';
  const bgAlt = HEX.test(c.bgAlt) ? c.bgAlt : '#1b1b1b';
  const accent = HEX.test(c.accent) ? c.accent : '#e2b755';
  const text = readable(HEX.test(c.text) ? c.text : '#f5f1ea', bg, 7);
  const tokens: StudioTokens = {
    colors: {
      bg, bgAlt, accent, text,
      muted: readable(HEX.test(c.muted) ? c.muted : text, bg, 4.5),
      accentText: readable(HEX.test(c.accentText) ? c.accentText : '#111111', accent, 4.5),
    },
    fonts: {
      display: Object.hasOwn(DISPLAY_FONTS, input?.fonts?.display) ? input.fonts.display : 'Fraunces',
      body: Object.hasOwn(BODY_FONTS, input?.fonts?.body) ? input.fonts.body : 'Manrope',
    },
    radius: Math.max(0, Math.min(32, Math.round(Number(input?.radius) || 0))),
    ease: Object.hasOwn(EASES, input?.ease) ? input.ease : 'suave',
    intensity: ['calma', 'media', 'intensa'].includes(input?.intensity) ? input.intensity : 'media',
    grain: input?.grain === true,
  };
  return tokens;
}

export function sanitizeStudioSite(input: any, assetIds: Set<string>): StudioSite {
  if (!input || typeof input !== 'object') throw new StudioValidationError('Documento do site ausente.');
  const tokens = sanitizeTokens(input.tokens);
  const whatsapp = clean(input.meta?.whatsapp, 20).replace(/\D/g, '');
  const meta: StudioSite['meta'] = {
    businessName: clean(input.meta?.businessName, 100) || 'Empresa',
    title: clean(input.meta?.title, 70) || clean(input.meta?.businessName, 70) || 'Site',
    description: clean(input.meta?.description, 170),
    whatsapp: whatsapp.length >= 10 && whatsapp.length <= 13 ? whatsapp : '',
    whatsappMessage: clean(input.meta?.whatsappMessage, 200) || 'Olá! Vim pelo site e gostaria de um orçamento.',
    ...(typeof input.meta?.logoAssetId === 'string' && assetIds.has(input.meta.logoAssetId) ? { logoAssetId: input.meta.logoAssetId } : {}),
  };
  const raw = Array.isArray(input.scenes) ? input.scenes.slice(0, 12) : [];
  const ids = new Set<string>();
  const scenes: StudioScene[] = [];
  for (const [index, scene] of raw.entries()) {
    if (!scene || !Object.hasOwn(SCENE_TYPES, scene.type)) continue;
    let id = clean(scene.id, 40).toLowerCase().replace(/[^a-z0-9-]/g, '-') || `cena-${index + 1}`;
    while (ids.has(id)) id += '-2';
    ids.add(id);
    const items = Array.isArray(scene.items) ? scene.items.slice(0, 8).map((item: any) => ({
      title: clean(item?.title, 120), text: clean(item?.text, 400) || undefined, value: clean(item?.value, 24) || undefined,
      media: media(item?.media, assetIds),
    })).filter((item: StudioItem) => item.title) : undefined;
    const sceneMedia = Array.isArray(scene.media) ? scene.media.slice(0, 4).map((m: any) => media(m, assetIds)).filter(Boolean) as StudioMedia[] : undefined;
    const title = clean(scene.title, 200);
    if (!title) continue;
    scenes.push({
      id, type: scene.type, tone: ['base', 'alt', 'destaque'].includes(scene.tone) ? scene.tone : 'base',
      eyebrow: clean(scene.eyebrow, 60) || undefined, title, text: clean(scene.text, 700) || undefined,
      items: items?.length ? items : undefined, media: sceneMedia?.length ? sceneMedia : undefined,
      cta: clean(scene.cta, 40) || undefined,
      shape: PARTICLE_SHAPES.includes(scene.shape) ? scene.shape : undefined,
    });
  }
  if (scenes.length < 3) throw new StudioValidationError('O site precisa de pelo menos três cenas válidas.');
  return { version: 1, meta, tokens, scenes };
}

export function fontHref(tokens: StudioTokens) {
  const family = (name: string, spec: string) => 'family=' + encodeURIComponent(name).replace(/%20/g, '+') + (spec ? ':' + spec : '');
  return `https://fonts.googleapis.com/css2?${family(tokens.fonts.display, DISPLAY_FONTS[tokens.fonts.display].spec)}&${family(tokens.fonts.body, BODY_FONTS[tokens.fonts.body].spec)}&display=swap`;
}
