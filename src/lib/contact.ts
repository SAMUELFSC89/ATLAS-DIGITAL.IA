export const ATLAS_WHATSAPP = '5551994578544';
export const CONTACT_WHATSAPP_URL = `https://wa.me/${ATLAS_WHATSAPP}?text=${encodeURIComponent(
  'Olá! Enviei o formulário no site da Atlas Digital e gostaria de conversar sobre um site para minha empresa.',
)}`;

export const CONTACT_CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
export type ContactCampaign = Partial<Record<typeof CONTACT_CAMPAIGN_KEYS[number], string>>;

export interface SiteContact {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  createdAt: string;
  campaign: ContactCampaign;
}

export function normalizeBrazilianWhatsApp(value: string): string {
  if (!/^\+?[\d\s().-]+$/.test(value)) return '';
  const digits = value.replace(/\D/g, '');
  const national = digits.startsWith('55') && [12, 13].includes(digits.length) ? digits.slice(2) : digits;
  if (value.startsWith('+') && national === digits) return '';
  return /^[1-9][1-9](?:9\d{8}|[2-5]\d{7})$/.test(national) ? `55${national}` : '';
}
