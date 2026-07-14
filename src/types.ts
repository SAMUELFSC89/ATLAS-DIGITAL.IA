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

