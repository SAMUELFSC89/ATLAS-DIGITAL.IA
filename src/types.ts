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

export interface AtlasScoreKeyword {
  word: string;
  volume: number;
  position: number;
  difficulty: string;
  cpc: string;
  trend: string;
}

export interface AtlasScoreSEOItem {
  name: string;
  status: string;
  details: string;
}

export interface AtlasScorePerformanceItem {
  name: string;
  value: string;
  rating: string;
  details: string;
}

export interface AtlasScoreGoogleItem {
  name: string;
  value: string;
  details: string;
}

export interface AtlasScoreCompetitor {
  name: string;
  authority: number;
  speed: number;
  seoScore: number;
  reviews: string;
  position: number;
  site: string;
}

export interface AtlasScoreAIItem {
  name: string;
  detected: boolean;
  details: string;
}

export interface AtlasScoreConversionItem {
  name: string;
  status: string;
  details: string;
}

export interface AtlasScoreActionItem {
  priority: string;
  action: string;
  impact: string;
  effort: string;
}

export interface AtlasScoreReliabilityIndicator {
  confidence: number;
  status: 'Confirmado' | 'Estimado' | 'Não Validado';
  explanation: string;
}

export interface AtlasScoreReliability {
  score: number;
  processingTime: string;
  analysisDate: string;
  version: string;
  checksCount: number;
  indicatorsCount: number;
  opportunitiesCount: number;
  inconsistenciesCount: number;
  keywordsCount: number;
  competitorsCount: number;
  status: string;
  unavailabilityReasons: string[];
  confidenceMatrix: {
    seo: AtlasScoreReliabilityIndicator;
    performance: AtlasScoreReliabilityIndicator;
    googleProfile: AtlasScoreReliabilityIndicator;
    keywords: AtlasScoreReliabilityIndicator;
    competitors: AtlasScoreReliabilityIndicator;
    ai: AtlasScoreReliabilityIndicator;
    automation: AtlasScoreReliabilityIndicator;
  };
}

export interface AtlasScoreReport {
  score: number;
  executiveSummary: string;
  reliability?: AtlasScoreReliability;
  reportMeta?: {
    version: string;
    date: string;
    auditId: string;
    analysisTime: string;
  };
  executiveSummaryFiveTopics?: {
    strengths: string;
    opportunities: string;
    risks: string;
    evolution: string;
    nextSteps: string;
  };
  benchmark?: {
    audited: number;
    marketAverage: number;
    marketLeader: number;
  };
  maturityIndex?: {
    presence: number;
    seo: number;
    performance: number | null;
    conversion: number;
    google: number;
    mobile: number | null;
    authority: number;
    automation: number;
  };
  prioritizationMatrix?: {
    item: string;
    impact: string;
    effort: string;
    timeline: string;
    priority: string;
    expectedBenefit?: string;
  }[];
  seo: {
    score: number;
    items: AtlasScoreSEOItem[];
    keywords: AtlasScoreKeyword[];
  };
  performance: {
    score: number | null;
    items: AtlasScorePerformanceItem[];
  };
  googleProfile: {
    score: number;
    items: AtlasScoreGoogleItem[];
  };
  competitors: AtlasScoreCompetitor[];
  aiIntegrations: {
    score: number;
    items: AtlasScoreAIItem[];
  };
  conversion: {
    score: number;
    items: AtlasScoreConversionItem[];
  };
  prioritizedActionPlan: AtlasScoreActionItem[];
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


