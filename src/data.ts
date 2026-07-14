import { PortfolioItem, ProblemItem, SolutionItem, StepItem, DifferentialItem, TestimonialItem } from './types';

export const TARGET_SEGMENTS = [
  'Marmorarias',
  'Vidraçarias',
  'Energia Solar',
  'Esquadrias',
  'Coberturas',
  'Serralherias',
  'Móveis Planejados'
] as const;

export const PROBLEMS: ProblemItem[] = [
  {
    id: 'p1',
    title: 'Site Lento',
    description: 'Páginas que demoram para carregar frustram o cliente e fazem você perder posições valiosas no Google.',
    iconName: 'ZapOff'
  },
  {
    id: 'p2',
    title: 'Não aparece no Google',
    description: 'Sua empresa está invisível na internet. Quem procura por seus serviços na sua região acaba comprando do concorrente.',
    iconName: 'SearchCode'
  },
  {
    id: 'p3',
    title: 'Não gera orçamentos',
    description: 'O site recebe visitas, mas ninguém entra em contato por falta de botões estratégicos de conversão e apelo comercial.',
    iconName: 'Coins'
  },
  {
    id: 'p4',
    title: 'Não transmite confiança',
    description: 'Um site amador ou antigo passa a impressão de que a qualidade da sua obra ou acabamento também é inferior.',
    iconName: 'ShieldAlert'
  },
  {
    id: 'p5',
    title: 'Não funciona no celular',
    description: 'Imagens quebradas e textos desalinhados no smartphone afastam mais de 70% dos seus potenciais clientes locais.',
    iconName: 'Smartphone'
  },
  {
    id: 'p6',
    title: 'Design ultrapassado',
    description: 'Layout genérico de template antigo que afasta o público de alto padrão (arquitetos, decoradores e construtoras).',
    iconName: 'Paintbrush'
  }
];

export const SOLUTIONS: SolutionItem[] = [
  {
    id: 's1',
    title: 'Desenvolvimento de Sites',
    description: 'Desenvolvemos plataformas corporativas e catálogos interativos de alto padrão com design exclusivo e sob medida. Focado em valorizar seus produtos, obras e projetos de luxo.',
    iconName: 'Layout'
  },
  {
    id: 's2',
    title: 'SEO & Posicionamento',
    description: 'Estratégia avançada de busca orgânica para ranqueamento regional no Google. Coloque sua empresa nas primeiras posições de busca local onde os melhores clientes estão.',
    iconName: 'TrendingUp'
  },
  {
    id: 's3',
    title: 'Automação com IA',
    description: 'Implementamos sistemas inteligentes de triagem automática e assistentes virtuais de atendimento que qualificam os contatos e reduzem o tempo de resposta comercial a zero.',
    iconName: 'Sparkles'
  },
  {
    id: 's4',
    title: 'Captação de Leads',
    description: 'Engenharia completa de conversão (CRO) e funis de vendas de alto desempenho estruturados especificamente para gerar pedidos de orçamento qualificados de alto ticket.',
    iconName: 'Target'
  },
  {
    id: 's5',
    title: 'Diagnóstico Digital',
    description: 'Análise profunda e consultoria de mercado. Mapeamos seus concorrentes locais, palavras-chave lucrativas e definimos a melhor estratégia antes de programar.',
    iconName: 'SearchIcon'
  }
];

export const PORTFOLIO: PortfolioItem[] = [
  {
    id: 'port1',
    segment: 'Marmoraria',
    title: 'Imperial Mármores & Granitos',
    subtitle: 'Marmoraria de Luxo',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
    description: 'Website premium com catálogo interativo de pedras exóticas, galeria de obras de alto padrão zoomable e integração direta para captação de arquitetos e construtoras.',
    features: ['Galeria 4K de Pedras', 'Área Restrita para Arquitetos', 'Simulador de Ambientes', 'WhatsApp de Conversão Rápida'],
    whatsappMessage: 'Olá! Gostaria de ver o portfólio completo de marmorarias e solicitar uma proposta para a minha empresa.'
  },
  {
    id: 'port2',
    segment: 'Energia Solar',
    title: 'Solaris Integração Energética',
    subtitle: 'Projetos Fotovoltaicos',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=1200',
    description: 'Plataforma corporativa com simulador inteligente integrado de conta de luz. Captura leads altamente qualificados entregando uma estimativa real de economia e payback.',
    features: ['Calculadora de Economia', 'Mapa de Projetos Executados', 'Formulário com Upload de Conta', 'SEO Google 1ª página'],
    whatsappMessage: 'Olá! Quero conhecer mais sobre os sites para empresas de Energia Solar e o simulador de conta de luz.'
  },
  {
    id: 'port3',
    segment: 'Vidraçaria',
    title: 'Cristal Glass Vidros & Fachadas',
    subtitle: 'Vidraçaria e Divisórias',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200',
    description: 'Site refinado focado em fechamento de sacadas, guarda-corpos e divisórias de alto padrão. Enfoque visual marcante com imagens reais e facilidade de agendamento de visitas técnicas.',
    features: ['Portfólio de Obras Concluídas', 'Agendador de Visita Técnica', 'Garantias em Destaque', 'Orçamento Inteligente'],
    whatsappMessage: 'Olá! Gostaria de falar sobre um site moderno para minha vidraçaria e ver os modelos disponíveis.'
  }
];

export const STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Diagnóstico Gratuito',
    description: 'Entendemos seu modelo de negócios, concorrentes regionais e analisamos os gargalos de vendas do seu site atual.',
    iconName: 'SearchIcon'
  },
  {
    number: '02',
    title: 'Planejamento e Copy',
    description: 'Estruturamos as páginas, chamadas persuasivas (copywriting) e planejamos a jornada do seu cliente ideal.',
    iconName: 'FileText'
  },
  {
    number: '03',
    title: 'Design de Alto Padrão',
    description: 'Criamos um layout totalmente exclusivo no Figma, focado na sua marca e na sofisticação dos seus produtos.',
    iconName: 'Palette'
  },
  {
    number: '04',
    title: 'Desenvolvimento Ágil',
    description: 'Codificamos o site usando tecnologias modernas e limpas. Tudo otimizado para celulares e com velocidade máxima.',
    iconName: 'Code'
  },
  {
    number: '05',
    title: 'Aprovação e Testes',
    description: 'Apresentamos o projeto final para validação. Realizamos testes minuciosos de velocidade, segurança e formulários.',
    iconName: 'CheckCircle2'
  },
  {
    number: '06',
    title: 'Publicação e Suporte',
    description: 'Seu site entra no ar! Configuramos o Google Analytics, Google Maps e damos suporte completo para manter a performance.',
    iconName: 'Rocket'
  }
];

export const DIFFERENTIALS: DifferentialItem[] = [
  {
    id: 'd1',
    title: 'Atendimento Rápido',
    description: 'Chega de esperar dias por uma alteração simples. Nosso suporte responde em minutos para sua empresa não perder ritmo.',
    iconName: 'Clock'
  },
  {
    id: 'd2',
    title: 'Entrega Ágil',
    description: 'Processo focado e estruturado para colocar seu site no ar em tempo recorde, pronto para atrair orçamentos.',
    iconName: 'Zap'
  },
  {
    id: 'd3',
    title: 'SEO Local Embutido',
    description: 'Configuramos seu site com as palavras-chave certas do seu nicho e região, impulsionando suas buscas no Google Maps.',
    iconName: 'Compass'
  },
  {
    id: 'd4',
    title: 'Desempenho Nota 95+',
    description: 'Seu site carregar em menos de 1,5 segundos melhora drasticamente o SEO e reduz em até 70% o abandono de visitantes.',
    iconName: 'Activity'
  },
  {
    id: 'd5',
    title: 'Design Totalmente Único',
    description: 'Nenhum site é igual ao outro. Desenvolvemos designs sob medida para que sua empresa transmita exclusividade e alta qualidade.',
    iconName: 'Sparkles'
  },
  {
    id: 'd6',
    title: 'Responsivo Premium',
    description: 'Ajuste cirúrgico em cada detalhe na tela do celular. Menus fluidos e imagens perfeitamente enquadradas.',
    iconName: 'Layout'
  },
  {
    id: 'd7',
    title: 'Fácil Gerenciamento',
    description: 'Você mesmo pode adicionar novas fotos de mármores, vidros ou instalações solares com total facilidade, sem custos adicionais.',
    iconName: 'FolderEdit'
  },
  {
    id: 'd8',
    title: 'Engenharia de Conversão',
    description: 'Fórmula de conversão refinada com botões, chamadas e depoimentos posicionados onde geram mais contatos no WhatsApp.',
    iconName: 'Target'
  }
];

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't1',
    name: 'Juliana Castilho',
    company: 'Diretora da Imperial Mármores',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    rating: 5,
    text: 'O site desenvolvido pela Atlas Digital mudou completamente o nível dos nossos leads. Hoje, mais de 45% das nossas solicitações de orçamento para mármores exóticos vêm do Google, e a conversão pelo formulário integrado superou todas as expectativas. Recomendo muito!'
  },
  {
    id: 't2',
    name: 'Roberto Menezes',
    company: 'Sócio da Helios Solar',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150',
    rating: 5,
    text: 'Excelente trabalho. O simulador inteligente de conta de luz que eles desenvolveram atrai o cliente ideal. O cliente já chega no nosso comercial sabendo quanto vai economizar. Isso economiza muito tempo dos nossos vendedores e impulsionou nossas vendas de energia solar.'
  },
  {
    id: 't3',
    name: 'Carlos Eduardo',
    company: 'Fundador da Cristal Glass',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    rating: 5,
    text: 'Sempre tivemos dor de cabeça com sites antigos que travavam no celular e não carregavam as fotos pesadas de fachadas de vidro. A Atlas Digital resolveu tudo. O site voa, o catálogo deles é lindíssimo e o suporte é sensacional!'
  }
];
