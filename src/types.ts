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
