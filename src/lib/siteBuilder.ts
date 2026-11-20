import type { ExpressAsset, ExpressBusiness } from './expressOrder';
import type { SiteLanguage } from './siteLanguages';
export interface BuilderReference { id: string; name: string; mimeType: string; width: number; height: number; size: number }
export interface BuilderSource { title: string; url: string; siteUrl?: string; insight?: string }
export const BUILDER_SCENE_EFFECTS = ['static', 'mask', 'scroll-zoom', 'overlap'] as const;
export const BUILDER_SCENE_TRANSITIONS = ['cut', 'wipe', 'match', 'overlap'] as const;
export const CAMERA_COLUMNS = 4;
export const CAMERA_ROWS = 6;
export interface BuilderCreativePlan {
  concept: string;
  scenes: { section: string; goal: string; entrance: string; motion: string; transition: string; transitionEffect?: typeof BUILDER_SCENE_TRANSITIONS[number]; effect: typeof BUILDER_SCENE_EFFECTS[number] }[];
  heroImagePrompt: string;
  actionImagePrompt?: string;
  nextImagePrompt?: string;
}
export interface BuilderStoryboard { opening: string; transition: string; nextScene: string }
export interface BuilderDirection { id: string; name: string; description: string; accent: string; background: string; foreground: string; typography: string; layout: string; storyboard?: BuilderStoryboard }
export interface BuilderSection { id: string; label: string; visible: boolean; texts: { id: string; tag: string; text: string }[]; images: { id: string; src: string; alt: string }[] }
export interface BuilderMessage { id: string; role: 'user' | 'assistant'; text: string; createdAt: number; referenceIds?: string[] }
export interface BuilderDesignOption { id: string; direction: BuilderDirection; format?: 'scroll-storyboard' }
export interface BuilderProject {
  id: string; business: ExpressBusiness; locale: SiteLanguage; references: BuilderReference[]; directions: BuilderDirection[]; directionId: string;
  designOptions?: BuilderDesignOption[]; awaitingDesign?: boolean; selectedDesign?: string;
  sources: BuilderSource[]; researchNotice?: string; creativePlan?: BuilderCreativePlan | null; html?: string; sections: BuilderSection[]; version: number;
  status: 'draft' | 'working' | 'ready' | 'error'; job?: { id: string; type: 'generate' | 'edit' | 'image' | 'research'; phase: string; leaseUntil: number } | null;
  message?: string; imageNotice?: string; publishedUrl?: string; publishedVersion?: number; updatedAt: number;
  media: ExpressAsset[]; messages: BuilderMessage[];
  portfolioVisible?: boolean;
  quality?: { score: number; skillVersion: string; checks: { id: string; ok: boolean; label: string }[] };
  feedback?: { version: number; rating: 'good' | 'improve'; note: string; createdAt: number } | null;
}
export const BUILDER_DIRECTIONS: BuilderDirection[] = [
  { id: 'editorial', name: 'Editorial acolhedor', description: 'Fotografia ampla, títulos expressivos e composição sofisticada.', accent: '#56613b', background: '#f4f0e8', foreground: '#272c24', typography: 'Serif editorial com texto sem serifa', layout: 'Composição editorial assimétrica, grandes fotografias e espaço em branco.' },
  { id: 'contemporary', name: 'Contemporâneo essencial', description: 'Contraste marcante, tipografia forte e apresentação direta.', accent: '#d9b572', background: '#151a20', foreground: '#f5f6f7', typography: 'Sans geométrica em títulos de peso alto', layout: 'Grade assimétrica, títulos grandes, fotografias recortadas e contrastes.' },
  { id: 'clean', name: 'Claro e objetivo', description: 'Organização leve, navegação simples e conteúdo em destaque.', accent: '#234b69', background: '#fafbfc', foreground: '#192837', typography: 'Sans humanista legível', layout: 'Grade arejada, hierarquia limpa e navegação simples, adaptada ao negócio.' },
];
export const builderSectionName = (id: string) => ({inicio:'Apresentação',servicos:'Serviços',projetos:'Projetos',sobre:'Sobre',contato:'Contato',rodape:'Rodapé'}[id] || id.replace(/[-_]/g,' '));

export interface CreatorProfile {
  handle: string;
  name: string;
  headline: string;
  bio: string;
  city: string;
  specialties: string;
  whatsapp?: string;
  contactPublic?: boolean;
  publicEnabled?: boolean;
  contactUrl?: string | null;
  url: string;
}
export interface PortfolioSiteSummary {
  id: string;
  name: string;
  segment: string;
  city?: string;
  description?: string;
  accent?: string;
  url?: string;
  publishedUrl?: string | null;
  portfolioVisible?: boolean;
  caption?: string;
  updatedAt?: number;
}
export interface OwnerPortfolioResponse {
  profile: CreatorProfile | null;
  projects: PortfolioSiteSummary[];
}
export interface PublicCreatorResponse {
  creator: CreatorProfile;
  sites: PortfolioSiteSummary[];
}
