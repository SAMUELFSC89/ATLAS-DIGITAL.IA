export const EXPRESS_PRICE = 29700;
export const EXPRESS_HOURS = 48;
export const EXPRESS_WHATSAPP = 'https://wa.me/5551994578544';

export interface ExpressAsset {
  id: string;
  projectId: string;
  kind: 'photo' | 'logo';
  name: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  width: number;
  height: number;
  size: number;
  url?: string;
}

export interface ExpressBusiness {
  name: string;
  segment: string;
  city: string;
  services: string;
  whatsapp: string;
  photo: string;
  assets?: ExpressAsset[];
}

export interface ExpressPreview {
  id: string;
  business: ExpressBusiness;
  title: string;
  introduction: string;
  offers: { title: string; description: string }[];
  visual?: ExpressVisual;
}

export const PREVIEW_PAGES = [
  { id: 'home', title: 'Início' }, { id: 'services', title: 'Serviços' },
  { id: 'about', title: 'Sobre' }, { id: 'contact', title: 'Contato' },
] as const;
export type PreviewPageId = typeof PREVIEW_PAGES[number]['id'];
export interface PreviewReference { title: string; url: string; insight: string }
export interface ExpressVisual {
  status: 'researching' | 'generating' | 'ready' | 'error';
  device: 'mobile' | 'desktop';
  expiresAt: number;
  references: PreviewReference[];
  searchSuggestions?: string;
  message?: string;
  pages: { id: PreviewPageId; title: string; status: 'pending' | 'generating' | 'ready'; imageUrl?: string; width?: number; height?: number }[];
}

export type ExpressStatus = 'pending' | 'paid' | 'production' | 'delivered' | 'expired' | 'refunded';

export interface ExpressOrder {
  id: string;
  previewId: string;
  business: ExpressBusiness;
  email: string;
  status: ExpressStatus;
  amount: number;
  createdAt: number;
  dueAt?: number;
  receiptSentAt?: number;
  deliveredAt?: number;
  finalUrl?: string;
}

export function expressMoney(amount: number) {
  return (amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function expressDate(ms: number) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(ms);
}
