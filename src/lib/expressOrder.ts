export const EXPRESS_PRICE = 9990;
export const EXPRESS_HOURS = 48;
export const EXPRESS_WHATSAPP = 'https://wa.me/5551994578544';

export interface ExpressBusiness {
  name: string;
  segment: string;
  city: string;
  services: string;
  whatsapp: string;
  photo: string;
}

export interface ExpressPreview {
  id: string;
  business: ExpressBusiness;
  title: string;
  introduction: string;
  offers: { title: string; description: string }[];
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
