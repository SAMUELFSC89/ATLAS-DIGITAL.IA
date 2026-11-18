import type { SceneType, StudioAsset, StudioSite, StudioTokens } from './studioSite';

/** Steps of the creator, following the Carta Secreta method: data → briefing (approval 1) → scene menu → direction (approval 2) → site. */
export const STUDIO_STAGES = ['dados', 'briefing', 'cardapio', 'direcao', 'site'] as const;
export type StudioStage = typeof STUDIO_STAGES[number];
export type StudioStep = Exclude<StudioStage, 'dados'>;

export interface StudioClient {
  name: string; segment: string; city: string; services: string; whatsapp: string;
  audience: string; differential: string; proofs: string; references: string; notes: string;
}
export const CLIENT_FIELDS: { key: keyof StudioClient; label: string; hint: string; required?: boolean; long?: boolean; max: number }[] = [
  { key: 'name', label: 'Nome da empresa', hint: 'Como o cliente quer aparecer.', required: true, max: 100 },
  { key: 'segment', label: 'Ramo', hint: 'Ex.: marmoraria de alto padrão, clínica odontológica.', required: true, max: 100 },
  { key: 'city', label: 'Cidade e região', hint: 'Onde atende.', required: true, max: 100 },
  { key: 'whatsapp', label: 'WhatsApp com DDD', hint: 'Para onde vão os botões do site.', required: true, max: 20 },
  { key: 'services', label: 'Produtos e serviços', hint: 'O que vende, o carro-chefe e a faixa de preço, se souber.', required: true, long: true, max: 1500 },
  { key: 'audience', label: 'Público', hint: 'Quem compra, de onde vem (Instagram, Google), o que admira.', long: true, max: 1200 },
  { key: 'differential', label: 'Diferencial', hint: 'O que faz melhor que os concorrentes ou o que os clientes elogiam.', long: true, max: 1200 },
  { key: 'proofs', label: 'Provas reais', hint: 'Números, depoimentos com nome, prêmios, garantias. Só o que for verdadeiro.', long: true, max: 2000 },
  { key: 'references', label: 'Referências e identidade', hint: 'Sites, marcas e perfis que o cliente gosta; cores e fontes da marca.', long: true, max: 1200 },
  { key: 'notes', label: 'Observações', hint: 'Qualquer pedido especial do cliente.', long: true, max: 1500 },
];

export interface StudioBriefing {
  negocio: string; oferta: string; acao: string; publico: string; consciencia: string; estetica: string; dispositivo: string;
  dor: string; desejo: string; objecoes: { objecao: string; resposta: string }[]; diferencial: string; provas: string; fugirDe: string;
  sensacao: string[];
}
export const BRIEFING_FIELDS: { key: Exclude<keyof StudioBriefing, 'objecoes' | 'sensacao'>; label: string }[] = [
  { key: 'negocio', label: 'Negócio' }, { key: 'oferta', label: 'Oferta principal' }, { key: 'acao', label: 'Ação desejada' },
  { key: 'publico', label: 'Público' }, { key: 'consciencia', label: 'Nível de consciência' }, { key: 'estetica', label: 'Estética que o público admira' },
  { key: 'dispositivo', label: 'Dispositivo principal' }, { key: 'dor', label: 'Dor principal' }, { key: 'desejo', label: 'Desejo principal' },
  { key: 'diferencial', label: 'Diferencial' }, { key: 'provas', label: 'Provas disponíveis' }, { key: 'fugirDe', label: 'Fugir de' },
];

export interface StudioIdea { id: string; title: string; description: string; feeling: string; sceneType: SceneType; assets: string }
export interface StudioSceneScript { title: string; type: SceneType; tone: 'base' | 'alt' | 'destaque'; entrada: string; durante: string; saida: string; objetivo: string; assets: string }
export interface StudioAssetNeed { file: string; description: string; source: string; prompt: string }
export interface StudioDirection {
  tokens: StudioTokens;
  rationale: { palette: string; typography: string; motion: string };
  roteiro: StudioSceneScript[];
  assetsList: StudioAssetNeed[];
}

export interface StudioProject {
  id: string;
  ownerEmail: string;
  stage: StudioStage;
  client: StudioClient;
  assets: StudioAsset[];
  briefing?: StudioBriefing;
  briefingApproved?: boolean;
  ideas?: StudioIdea[];
  recommendedId?: string;
  protagonistId?: string;
  supportIds?: string[];
  direction?: StudioDirection;
  directionApproved?: boolean;
  site?: StudioSite;
  busy?: { step: StudioStep; until: number };
  lastError?: { step: StudioStep; message: string; at: number };
  createdAt: number;
  updatedAt: number;
}
export interface StudioProjectSummary { id: string; name: string; segment: string; stage: StudioStage; ownerEmail: string; updatedAt: number }
