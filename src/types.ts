export interface PortfolioItem {
  id: string;
  segment: 'Marmoraria' | 'Energia Solar' | 'Vidraçaria' | 'Esquadrias' | 'Coberturas' | 'Serralheria' | 'Móveis Planejados';
  title: string;
  subtitle: string;
  image: string;
  description: string;
  features: string[];
  livePreviewUrl?: string;
  whatsappMessage: string;
}

export interface ProblemItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface SolutionItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface StepItem {
  number: string;
  title: string;
  description: string;
  iconName: string;
}

export interface DifferentialItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  company: string;
  avatar: string;
  rating: number;
  text: string;
}

export interface LocalSearchPosition {
  query: string;
  position: number | null;
  resultsChecked: number | null;
  score: number | null;
  checkedAt: string;
}

export interface AtlasScoreReport {
  companyName: string;
  city: string;
  profileUrl: string;
  website: string;
  phone: string;
  rating: number | null;
  reviewsCount: number;
  localSearch: LocalSearchPosition;
}

export type LeadStatus = 'Novo' | 'Contato' | 'Resposta' | 'Reunião' | 'Proposta' | 'Negociação' | 'Fechado' | 'Pós-venda';

export interface Lead {
  id: string;
  companyName: string;
  responsible: string;
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  state: string;
  website: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  googleProfile: string;
  atlasScore: number | null;
  localPosition?: number;
  positionQuery?: string;
  status: LeadStatus;
  lastContact: string;
  nextAction: string;
  closeProbability: number; // percentage (0-100)
  notes: string;
  segment: string;
  createdAt: string;
}

export interface BlogArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'SEO' | 'Google' | 'Marketing' | 'IA' | 'Vendas' | 'CRM' | 'Automação' | 'WhatsApp' | 'Captação de Clientes';
  readTime: string;
  date: string;
  image: string;
  slug: string;
  tags: string[];
}

export interface IntegrationConfig {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'configuring';
  category: 'Google' | 'Messaging' | 'Database' | 'Payment' | 'SEO/AI';
  icon: string;
  description: string;
  requiresOAuth: boolean;
}

export interface EmailMessage {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  date: string;
  body: string;
  read: boolean;
  replied: boolean;
}

export interface WhatsAppChat {
  id: string;
  contactName: string;
  phone: string;
  lastMessage: string;
  lastMessageTime: string;
  messages: {
    id: string;
    sender: 'user' | 'client' | 'copilot-suggestion';
    text: string;
    timestamp: string;
    approved?: boolean;
  }[];
}



export type WhatsAppConfidence = 'confirmado' | 'provavel' | 'incerto' | '';

/** Empresa real encontrada pelo Radar de Mercado (Google Places + leitura do site). */
export interface RadarLead {
  id: string;
  companyName: string;
  segment: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  /** Somente dígitos, com DDI 55. */
  whatsapp: string;
  whatsappConfidence: WhatsAppConfidence;
  whatsappLink: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  googleProfile: string;
  rating: number | null;
  reviewsCount: number;
  distanceKm: number | null;
  atlasScore: number;
  localPosition: number;
  positionQuery: string;
  positionCheckedAt: string;
  closeProbability: number;
  notes: string;
}
