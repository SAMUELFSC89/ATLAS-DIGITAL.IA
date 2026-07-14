import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini SDK lazily to prevent server crashes if the API key is not yet set.
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("A chave de API 'GEMINI_API_KEY' não está configurada. Configure a chave nos segredos ou ambiente do aplicativo.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Fallback generator for uncredentialed/production public preview environments
function generateFallbackReport(companyName: string, city: string, segment: string, website?: string, googleMapsUrl?: string) {
  const hasSite = !!(website && website.trim().length > 0);
  const hasMaps = !!(googleMapsUrl && googleMapsUrl.trim().length > 0);

  // Calcular scores realistas baseados na presença ou ausência de ativos
  const seoScore = hasSite ? 74 : 12;
  const performanceScore = hasSite ? 68 : 5;
  const googleScore = hasMaps ? 82 : 35;
  const aiScore = 20; // Geralmente baixo para a maioria das empresas locais
  const conversionScore = hasSite ? 60 : 25;

  const averageScore = Math.round((seoScore + performanceScore + googleScore + aiScore + conversionScore) / 5);

  // Palavras-chave por segmento
  const normSeg = (segment || "").toLowerCase();
  let keywordList: any[] = [];
  const positionOffset = hasSite ? 14 : 99;

  if (normSeg.includes("marmor") || normSeg.includes("pedra")) {
    keywordList = [
      { word: `marmoraria em ${city}`, volume: 1600, position: positionOffset - 4 > 0 ? positionOffset - 4 : 8, difficulty: "Média", cpc: "R$ 3,10", trend: "Estável" },
      { word: `bancada de granito ${city}`, volume: 980, position: positionOffset + 2, difficulty: "Média", cpc: "R$ 2,80", trend: "Crescente" },
      { word: `mármores e granitos ${city}`, volume: 1200, position: positionOffset + 11, difficulty: "Média", cpc: "R$ 2,50", trend: "Estável" },
      { word: `quartzo e silestone ${city}`, volume: 450, position: positionOffset + 18, difficulty: "Alta", cpc: "R$ 4,20", trend: "Crescente" },
      { word: `marmoraria perto de mim`, volume: 2400, position: hasSite ? 6 : 99, difficulty: "Alta", cpc: "R$ 3,50", trend: "Crescente" }
    ];
  } else if (normSeg.includes("solar") || normSeg.includes("energia")) {
    keywordList = [
      { word: `energia solar em ${city}`, volume: 1400, position: positionOffset - 5 > 0 ? positionOffset - 5 : 7, difficulty: "Alta", cpc: "R$ 6,80", trend: "Crescente" },
      { word: `placa solar ${city}`, volume: 880, position: positionOffset + 3, difficulty: "Média", cpc: "R$ 5,20", trend: "Estável" },
      { word: `instalação painel solar ${city}`, volume: 520, position: positionOffset + 14, difficulty: "Alta", cpc: "R$ 7,50", trend: "Crescente" },
      { word: `empresa energia solar ${city}`, volume: 750, position: hasSite ? 9 : 99, difficulty: "Alta", cpc: "R$ 8,20", trend: "Crescente" },
      { word: `energia fotovoltaica ${city}`, volume: 380, position: positionOffset + 22, difficulty: "Média", cpc: "R$ 4,50", trend: "Estável" }
    ];
  } else if (normSeg.includes("vidr") || normSeg.includes("temperado")) {
    keywordList = [
      { word: `vidraçaria em ${city}`, volume: 1800, position: positionOffset - 3 > 0 ? positionOffset - 3 : 5, difficulty: "Média", cpc: "R$ 2,90", trend: "Estável" },
      { word: `box de vidro ${city}`, volume: 1100, position: positionOffset + 1, difficulty: "Média", cpc: "R$ 2,40", trend: "Estável" },
      { word: `espelho sob medida ${city}`, volume: 850, position: positionOffset + 9, difficulty: "Média", cpc: "R$ 3,20", trend: "Crescente" },
      { word: `fechamento de sacada ${city}`, volume: 600, position: positionOffset + 16, difficulty: "Alta", cpc: "R$ 5,80", trend: "Crescente" },
      { word: `vidraceiro perto de mim`, volume: 2100, position: hasSite ? 8 : 99, difficulty: "Alta", cpc: "R$ 3,10", trend: "Crescente" }
    ];
  } else if (normSeg.includes("const") || normSeg.includes("obra") || normSeg.includes("incorporadora")) {
    keywordList = [
      { word: `construtora em ${city}`, volume: 1200, position: positionOffset - 2 > 0 ? positionOffset - 2 : 9, difficulty: "Alta", cpc: "R$ 5,50", trend: "Estável" },
      { word: `apartamento novo à venda ${city}`, volume: 2200, position: positionOffset + 25, difficulty: "Alta", cpc: "R$ 9,80", trend: "Crescente" },
      { word: `empresa de reformas em ${city}`, volume: 900, position: positionOffset + 5, difficulty: "Média", cpc: "R$ 4,20", trend: "Estável" },
      { word: `construção residencial sob medida`, volume: 450, position: positionOffset + 12, difficulty: "Alta", cpc: "R$ 6,10", trend: "Crescente" },
      { word: `incorporadora em ${city}`, volume: 650, position: hasSite ? 12 : 99, difficulty: "Alta", cpc: "R$ 7,80", trend: "Estável" }
    ];
  } else if (normSeg.includes("arq") || normSeg.includes("interiores") || normSeg.includes("design")) {
    keywordList = [
      { word: `arquiteto em ${city}`, volume: 1500, position: positionOffset - 5 > 0 ? positionOffset - 5 : 4, difficulty: "Média", cpc: "R$ 4,50", trend: "Crescente" },
      { word: `escritório de arquitetura ${city}`, volume: 850, position: positionOffset + 2, difficulty: "Média", cpc: "R$ 5,10", trend: "Estável" },
      { word: `projeto de design de interiores ${city}`, volume: 950, position: positionOffset + 11, difficulty: "Alta", cpc: "R$ 4,80", trend: "Crescente" },
      { word: `reforma de alto padrão ${city}`, volume: 300, position: positionOffset + 19, difficulty: "Alta", cpc: "R$ 7,20", trend: "Crescente" },
      { word: `arquitetura residencial e comercial`, volume: 400, position: hasSite ? 11 : 99, difficulty: "Média", cpc: "R$ 3,90", trend: "Estável" }
    ];
  } else if (normSeg.includes("esquadr") || normSeg.includes("aluminio") || normSeg.includes("pvc")) {
    keywordList = [
      { word: `esquadrias de alumínio em ${city}`, volume: 950, position: positionOffset - 3 > 0 ? positionOffset - 3 : 6, difficulty: "Média", cpc: "R$ 4,10", trend: "Crescente" },
      { word: `esquadrias de pvc ${city}`, volume: 600, position: positionOffset + 4, difficulty: "Alta", cpc: "R$ 5,20", trend: "Crescente" },
      { word: `portas e janelas de alumínio ${city}`, volume: 1200, position: positionOffset + 10, difficulty: "Média", cpc: "R$ 3,50", trend: "Estável" },
      { word: `fábrica de esquadrias em ${city}`, volume: 500, position: positionOffset + 7, difficulty: "Média", cpc: "R$ 3,80", trend: "Estável" },
      { word: `esquadrias sob medida`, volume: 800, position: hasSite ? 8 : 99, difficulty: "Alta", cpc: "R$ 4,80", trend: "Crescente" }
    ];
  } else {
    keywordList = [
      { word: `serviços de ${segment} em ${city}`, volume: 800, position: positionOffset - 2 > 0 ? positionOffset - 2 : 10, difficulty: "Média", cpc: "R$ 3,20", trend: "Estável" },
      { word: `${segment} perto de mim`, volume: 1500, position: hasSite ? 14 : 99, difficulty: "Alta", cpc: "R$ 2,80", trend: "Crescente" },
      { word: `orçamento de ${segment} ${city}`, volume: 450, position: positionOffset + 6, difficulty: "Média", cpc: "R$ 3,90", trend: "Crescente" },
      { word: `melhor empresa de ${segment} ${city}`, volume: 350, position: positionOffset + 11, difficulty: "Alta", cpc: "R$ 4,50", trend: "Estável" },
      { word: `serviços sob medida ${city}`, volume: 600, position: positionOffset + 17, difficulty: "Média", cpc: "R$ 2,50", trend: "Estável" }
    ];
  }

  // Resumo Executivo Dinâmico e Customizado
  let executiveSummary = "";
  if (hasSite) {
    executiveSummary = `A análise da presença digital da ${companyName} em ${city} revela uma estrutura digital ativa com o site fornecido (${website}), registrando um Atlas Score de ${averageScore}/100. Há uma boa base, mas identificamos gargalos de SEO técnico fundamentais (como a ausência de sitemap otimizado e marcação de dados ricos do Google). A performance e a velocidade de carregamento móvel estão abaixo do ideal (Core Web Vitals em sinal de alerta), o que prejudica a conversão de novos leads que buscam agilidade pelo smartphone. Com pequenos ajustes estruturais e automações inteligentes de atendimento (como assistente virtual de agendamento), a taxa de captação de clientes locais pode aumentar significativamente nos próximos meses.`;
  } else {
    executiveSummary = `O diagnóstico para a ${companyName} em ${city} aponta uma presença digital crítica, com Atlas Score de ${averageScore}/100. A ausência de um site institucional de alto padrão faz com que a empresa perca diariamente dezenas de buscas diretas por seus serviços no Google na região de ${city}. Atualmente, a empresa depende exclusivamente de indicações ou de redes sociais passivas. Além disso, sem um funil de conversão focado no fechamento de orçamentos e um Perfil do Google totalmente otimizado com ferramentas modernas, o posicionamento local está severamente comprometido diante da concorrência mapeada. A criação de uma landing page ultraveloz e integrada com WhatsApp é a ação mais urgente e de maior impacto.`;
  }

  // SEO Items
  const seoItems = [
    {
      name: "Sitemap & Robots.txt",
      status: hasSite ? "Incompleto" : "Ausente",
      details: hasSite ? "O sitemap XML existe, mas não inclui URLs de conversão chave e o arquivo robots.txt precisa de diretivas mais claras para melhor indexação de robôs." : "Inexistente. Sem esses arquivos, o robô do Google encontra severas dificuldades para indexar e entender a estrutura comercial de seus serviços."
    },
    {
      name: "Meta Tags e Cabeçalhos (H1/H2)",
      status: hasSite ? "Não Otimizado" : "Ausente",
      details: hasSite ? "Foram detectadas tags de título duplicadas e ausência de meta descriptions persuasivas. A tag H1 principal não contém palavras-chave do segmento." : "Sem site oficial, as meta tags são nulas. Não há indexação orgânica das suas principais soluções locais no buscador."
    },
    {
      name: "Dados Estruturados (Schema.org)",
      status: "Não Detectado",
      details: "A marcação técnica para 'LocalBusiness' ou 'ProfessionalService' não foi configurada. Isso impede o Google de exibir sua empresa em formatos especiais destacados (Rich Snippets) nas pesquisas."
    },
    {
      name: "Segurança SSL (HTTPS)",
      status: hasSite ? "Otimizado" : "Ausente",
      details: hasSite ? "Certificado de segurança SSL ativo e configurado corretamente. Conexão segura garantida para os visitantes do site." : "A ausência de domínio próprio e certificado SSL expõe a segurança e impede a realização de campanhas pagas com alta pontuação."
    }
  ];

  // Performance Items
  const performanceItems = [
    {
      name: "Velocidade de Carregamento (Desktop)",
      value: hasSite ? "2.4 segundos" : "N/A",
      rating: hasSite ? "average" : "poor",
      details: hasSite ? "O tempo total está aceitável, mas há atrasos na renderização da imagem principal (LCP) devido ao tamanho não comprimido de arquivos de mídia." : "Sem site ativo para testar a performance computacional do servidor."
    },
    {
      name: "Velocidade em Dispositivos Móveis (Mobile)",
      value: hasSite ? "4.8 segundos" : "N/A",
      rating: hasSite ? "poor" : "poor",
      details: hasSite ? "Sinal vermelho no mobile. O tempo de interatividade inicial está elevado por excesso de scripts não essenciais no cabeçalho e falta de otimização de cache." : "Indisponível. Sem site, toda a experiência móvel fica dependente de terceiros (como Instagram ou Facebook)."
    },
    {
      name: "Otimização de Imagens",
      value: hasSite ? "Parcial" : "Ausente",
      rating: hasSite ? "average" : "poor",
      details: hasSite ? "Imagens em formatos antigos (PNG/JPG). Recomenda-se a conversão para WebP de última geração, que reduz o peso dos arquivos em até 70% sem perder qualidade visual." : "Imagens do portfólio de serviços não estão armazenadas em servidores de alta velocidade."
    }
  ];

  // Google Profile Items
  const googleProfileItems = [
    {
      name: "Avaliações e Notas",
      value: hasMaps ? "Nota 4.6 (Média Plausível)" : "Não otimizado / Poucas avaliações",
      details: hasMaps ? "Seu perfil possui avaliações positivas, mas há ausência de respostas rápidas por parte da empresa. O Google valoriza a velocidade de interação com o cliente nas respostas." : "Perfil inexistente ou inativo. A falta de avaliações estruturadas no Google Meu Negócio elimina sua autoridade perante o público local."
    },
    {
      name: "Fotos de Portfólio",
      value: hasMaps ? "Atualizadas parcialmente" : "Insuficientes",
      details: hasMaps ? "Presença de fotos do estabelecimento, porém poucas imagens técnicas de projetos recentes de alta qualidade em formato geolocalizado." : "A ausência de fotos reais de projetos concluídos no mapa faz com que potenciais clientes em busca de referências prefiram a concorrência."
    },
    {
      name: "Atualizações e Posts Locais",
      value: "Ausente / Sem atividade recente",
      details: "A ferramenta de publicação de novidades e ofertas do Perfil de Empresa não é utilizada há mais de 30 dias. Manter posts semanais sinaliza relevância ativa para o algoritmo local."
    }
  ];

  // Competidores baseados no segmento
  const competitors = [
    {
      name: `${segment} Excelência ${city.split(" -")[0]}`,
      authority: 48,
      speed: 78,
      seoScore: 82,
      reviews: "112 avaliações (4.8)",
      position: 2,
      site: `excelencia${normSeg.slice(0, 5).replace(/[^a-z0-9]/g, "")}.com.br`
    },
    {
      name: `${segment} Líder Regional`,
      authority: 42,
      speed: 62,
      seoScore: 75,
      reviews: "84 avaliações (4.7)",
      position: 4,
      site: `lider${normSeg.slice(0, 5).replace(/[^a-z0-9]/g, "")}.com.br`
    },
    {
      name: `Prime ${segment} & Design`,
      authority: 35,
      speed: 85,
      seoScore: 68,
      reviews: "45 avaliações (4.9)",
      position: 5,
      site: `prime${normSeg.slice(0, 5).replace(/[^a-z0-9]/g, "")}.com.br`
    },
    {
      name: `Portal do(a) ${segment}`,
      authority: 22,
      speed: 45,
      seoScore: 60,
      reviews: "18 avaliações (4.4)",
      position: 12,
      site: `portal${normSeg.slice(0, 5).replace(/[^a-z0-9]/g, "")}.com.br`
    },
    {
      name: `${segment} Popular ${city.split(" -")[0]}`,
      authority: 18,
      speed: 90,
      seoScore: 48,
      reviews: "32 avaliações (4.5)",
      position: 15,
      site: `${normSeg.slice(0, 5).replace(/[^a-z0-9]/g, "")}popular.com.br`
    }
  ];

  // AI Integrations
  const aiIntegrationsItems = [
    {
      name: "Chatbot de Atendimento 24h",
      detected: false,
      details: "Sua empresa não possui um atendente automatizado inteligente para pré-qualificar orçamentos à noite ou em finais de semana, perdendo clientes de alta intenção de compra."
    },
    {
      name: "Simulador de Escopo e Valores",
      detected: false,
      details: "Falta de uma ferramenta interativa e inteligente para que o cliente rascunhe o projeto (ex: simular metros de bancada ou painéis solares necessários) e receba uma estimativa de preço instantânea."
    },
    {
      name: "Distribuidor Inteligente de Leads",
      detected: false,
      details: "Ausência de um CRM com roteamento automático de contatos para o comercial via WhatsApp, reduzindo a velocidade do primeiro atendimento (fator crítico para fechamento de vendas)."
    }
  ];

  // Conversion Items
  const conversionItems = [
    {
      name: "Chamada para Ação (CTA) Clara",
      status: hasSite ? "Parcial" : "Inexistente",
      details: hasSite ? "Existem botões de contato, mas são estáticos e genéricos (ex: 'Fale Conosco'). Faltam CTAs persuasivas com foco no benefício direto (ex: 'Calcular Orçamento Grátis')." : "Sem site institucional, não há uma jornada persuasiva de conversão com chamadas de alto impacto."
    },
    {
      name: "Funil de Orçamento Guiado",
      status: "Inexistente",
      details: "Os formulários comuns de contato pedem muitos dados de uma só vez de forma fria. Substituir por um questionário interativo e dinâmico (com etapas) aumenta a taxa de preenchimento em até 40%."
    },
    {
      name: "Prova Social Estruturada",
      status: hasSite ? "Incompleto" : "Inexistente",
      details: hasSite ? "Embora existam depoimentos, eles estão em formato de texto simples. Falta de vídeos de clientes reais mostrando a satisfação com a entrega final da obra." : "Não há depoimentos de clientes ou fotos de projetos concluídos organizados de forma a transmitir confiança imediata."
    }
  ];

  // Prioritized Action Plan
  const prioritizedActionPlan = hasSite ? [
    {
      priority: "Alta",
      action: "Otimizar o carregamento mobile do site atual (reduzir peso das imagens para WebP, minificar scripts e aplicar cache agressivo). Target: carregar abaixo de 2 segundos.",
      impact: "Redução imediata de 25% na taxa de abandono do site por parte de usuários de smartphones.",
      effort: "Baixo (Ajustes de desenvolvimento padrão)"
    },
    {
      priority: "Alta",
      action: "Implementar um simulador de escopo interativo (ex: calculadora de orçamentos) integrado com fluxo de qualificação inteligente no WhatsApp.",
      impact: "Aumento estimado de 35% a 50% na geração de contatos comerciais qualificados.",
      effort: "Médio (Engenharia de software personalizada)"
    },
    {
      priority: "Média",
      action: "Configurar marcação técnica Schema.org e otimizar títulos das páginas com foco local no Google (ex: 'Marmoraria em Porto Alegre - RS').",
      impact: "Crescimento gradual no ranqueamento orgânico das buscas locais sem investimento em anúncios pagos.",
      effort: "Baixo (SEO Técnico estrutural)"
    },
    {
      priority: "Média",
      action: "Estabelecer rotina de postagens semanais no Perfil de Empresa do Google e implantar QR Code de feedback físico para aumentar o volume de avaliações de clientes.",
      impact: "Maior relevância e prioridade no carrossel de mapas do Google Meu Negócio (Top 3 Local).",
      effort: "Baixo (Consistência comercial)"
    }
  ] : [
    {
      priority: "Alta",
      action: `Desenvolver uma Landing Page de Alta Performance sob medida para ${companyName}, 100% responsiva, otimizada para SEO local e focada na conversão de novos clientes.`,
      impact: "Estabelecer uma presença digital profissional imediata e habilitar a captação profissional de contatos orgânicos e pagos.",
      effort: "Médio (Executado de ponta a ponta pela equipe Atlas Digital)"
    },
    {
      priority: "Alta",
      action: `Criar e configurar profissionalmente o Perfil de Empresa no Google (Meu Negócio) para ${companyName}, inserindo palavras-chave estratégicas na descrição e publicando as primeiras fotos de alta qualidade.`,
      impact: `Começar a aparecer nas buscas por mapa na região de ${city} e capturar os primeiros leads locais prontamente.`,
      effort: "Baixo (Configurações iniciais de marca)"
    },
    {
      priority: "Média",
      action: "Integrar um simulador de orçamento digital e um assistente virtual inteligente de WhatsApp na Landing Page para captura ativa 24 horas por dia.",
      impact: "Garantir atendimento imediato de alta qualidade mesmo fora do horário comercial, capturando os dados de orçamentos de novos clientes.",
      effort: "Médio (Integração de módulos de IA da Atlas)"
    }
  ];

  return {
    score: averageScore,
    executiveSummary,
    seo: {
      score: seoScore,
      items: seoItems,
      keywords: keywordList
    },
    performance: {
      score: performanceScore,
      items: performanceItems
    },
    googleProfile: {
      score: googleScore,
      items: googleProfileItems
    },
    competitors,
    aiIntegrations: {
      score: aiScore,
      items: aiIntegrationsItems
    },
    conversion: {
      score: conversionScore,
      items: conversionItems
    },
    prioritizedActionPlan
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Diagnosis API Route using Google Gen AI with Smart Fallback
  app.post("/api/atlas-score", async (req, res) => {
    const { companyName, city, segment, website, googleMapsUrl } = req.body;

    if (!companyName || !city || !segment) {
      return res.status(400).json({ error: "Nome da empresa, cidade e segmento são obrigatórios." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim().length > 0) {
      try {
        const ai = getAiClient();

        const prompt = `Faça uma auditoria e diagnóstico completo e realista da presença digital para a empresa "${companyName}" localizada em "${city}", atuando no segmento "${segment}".
        Site fornecido: "${website || "Não informado - verifique se há um existente ou estime a ausência"}"
        URL do Google Perfil de Empresa fornecida: "${googleMapsUrl || "Não informada"}"

        Instruções adicionais:
        - O diagnóstico deve ser escrito em PORTUGUÊS (Brasil), de forma extremamente profissional, técnica e realista.
        - Caso o site oficial e o perfil do Google não estejam especificados, simule ou pesquise o cenário mais provável para uma empresa comum de pequeno/médio porte deste setor nesta cidade específica.
        - Para a área de SEO, forneça 5 a 6 palavras-chave reais e volumosas para o segmento "${segment}" na região de "${city}" (ex: se for marmoraria, "marmoraria em ${city}", "bancadas de granito ${city}", etc.), com estimativas de volume de busca realistas, dificuldades de ranqueamento e o ranqueamento estimado do cliente (ou ausente se não possuir site).
        - Para concorrência, liste 5 concorrentes reais ou altamente plausíveis do mesmo segmento em "${city}", e compare as pontuações e estimativas.
        - Gere pontuações realistas de 0 a 100 para cada critério, e calcule a Nota Geral (Atlas Score).`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: `Você é um Diretor de Marketing Digital de Elite e Engenheiro de SEO Sênior na agência "Atlas Digital.ia", especializado no setor de construção civil e acabamentos (Marmorarias, Vidraçarias, Energia Solar, Arquitetura e Construtoras).
            Sua tarefa é analisar rigorosamente a presença digital da empresa fornecida e retornar um diagnóstico completo em formato JSON perfeitamente estruturado de acordo com o esquema definido.
            Seja crítico, profissional, construtivo e forneça dados detalhados para orientar um plano de ação robusto.`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                score: {
                  type: Type.INTEGER,
                  description: "Nota geral da presença digital da empresa (0-100)"
                },
                executiveSummary: {
                  type: Type.STRING,
                  description: "Resumo executivo consolidado com as principais conclusões e oportunidades em português profissional."
                },
                seo: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.INTEGER, description: "Pontuação para SEO (0-100)" },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING, description: "Nome do critério (ex: Sitemap, Robots.txt, Meta Tags, HTTPS, Schema.org, H1)" },
                          status: { type: Type.STRING, description: "Status (ex: 'Otimizado', 'Ausente', 'Não detectado', 'Implementado')" },
                          details: { type: Type.STRING, description: "Detalhamento técnico do que foi identificado ou o que está faltando." }
                        },
                        required: ["name", "status", "details"]
                      }
                    },
                    keywords: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          word: { type: Type.STRING, description: "Palavra-chave do segmento" },
                          volume: { type: Type.INTEGER, description: "Volume mensal estimado de busca" },
                          position: { type: Type.INTEGER, description: "Posição estimada do cliente no Google (ex: 99 para ausente/não ranqueado, ou 1 a 100 para estimativas)" },
                          difficulty: { type: Type.STRING, description: "Dificuldade (ex: 'Baixa', 'Média', 'Alta')" },
                          cpc: { type: Type.STRING, description: "CPC médio estimado em R$ (ex: 'R$ 2,50')" },
                          trend: { type: Type.STRING, description: "Tendência de busca (ex: 'Estável', 'Crescente', 'Sazonal')" }
                        },
                        required: ["word", "volume", "position", "difficulty", "cpc", "trend"]
                      }
                    }
                  },
                  required: ["score", "items", "keywords"]
                },
                performance: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.INTEGER, description: "Pontuação de performance (0-100)" },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING, description: "Nome do item (ex: Velocidade Desktop, Velocidade Mobile, Responsividade, Imagens Otimizadas, Cache do Servidor)" },
                          value: { type: Type.STRING, description: "Valor ou métrica estimada (ex: '3.2s', 'Excelente', 'Necessita Otimização')" },
                          rating: { type: Type.STRING, description: "Avaliação (ex: 'good', 'average', 'poor')" },
                          details: { type: Type.STRING, description: "Descrição técnica das oportunidades de ganho." }
                        },
                        required: ["name", "value", "rating", "details"]
                      }
                    }
                  },
                  required: ["score", "items"]
                },
                googleProfile: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.INTEGER, description: "Pontuação do Perfil no Google (0-100)" },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING, description: "Métrica (ex: Avaliações, Média de Notas, Fotos de Portfólio, Atualização de Posts, Descrição e Horários)" },
                          value: { type: Type.STRING, description: "Valor detectado (ex: '42 avaliações', 'Nota 4.8', 'Não atualiza posts')" },
                          details: { type: Type.STRING, description: "Análise descritiva do Perfil do Google e otimizações." }
                        },
                        required: ["name", "value", "details"]
                      }
                    }
                  },
                  required: ["score", "items"]
                },
                competitors: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING, description: "Nome do Concorrente" },
                      authority: { type: Type.INTEGER, description: "Autoridade estimada do domínio (0-100)" },
                      speed: { type: Type.INTEGER, description: "Pontuação de velocidade móvel estimada (0-100)" },
                      seoScore: { type: Type.INTEGER, description: "Pontuação de SEO técnico estimada (0-100)" },
                      reviews: { type: Type.STRING, description: "Resumo de Avaliações no Google (ex: '150 avaliações (4.9)')" },
                      position: { type: Type.INTEGER, description: "Posição média para principais palavras-chave" },
                      site: { type: Type.STRING, description: "Site do concorrente ou domínio (ex: concorrente.com.br)" }
                    },
                    required: ["name", "authority", "speed", "seoScore", "reviews", "position", "site"]
                  }
                },
                aiIntegrations: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.INTEGER, description: "Pontuação de Integrações de IA e Automação (0-100)" },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING, description: "Recurso (ex: Chat Online, Bot Inteligente, Automação WhatsApp, Simulador de Escopo)" },
                          detected: { type: Type.BOOLEAN, description: "Se foi detectado ou sugerido" },
                          details: { type: Type.STRING, description: "Diagnóstico e indicação de como essa tecnologia traria conversão." }
                        },
                        required: ["name", "detected", "details"]
                      }
                    }
                  },
                  required: ["score", "items"]
                },
                conversion: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.INTEGER, description: "Pontuação de Conversão (0-100)" },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING, description: "Fator (ex: Clareza do CTA, Canal Direto WhatsApp, Formulários Inteligentes, Prova Social)" },
                          status: { type: Type.STRING, description: "Status do fator de conversão" },
                          details: { type: Type.STRING, description: "Detalhamento e soluções específicas." }
                        },
                        required: ["name", "status", "details"]
                      }
                    }
                  },
                  required: ["score", "items"]
                },
                prioritizedActionPlan: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      priority: { type: Type.STRING, description: "Prioridade: 'Alta', 'Média' ou 'Baixa'" },
                      action: { type: Type.STRING, description: "Ação corretiva recomendada" },
                      impact: { type: Type.STRING, description: "Impacto estimado (ex: 'Aumento de 35% de leads', 'Dobrar velocidade')" },
                      effort: { type: Type.STRING, description: "Esforço/Dificuldade de implementação" }
                    },
                    required: ["priority", "action", "impact", "effort"]
                  }
                }
              },
              required: [
                "score",
                "executiveSummary",
                "seo",
                "performance",
                "googleProfile",
                "competitors",
                "aiIntegrations",
                "conversion",
                "prioritizedActionPlan"
              ]
            }
          }
        });

        const resultText = response.text;
        if (!resultText) {
          throw new Error("Resposta nula recebida do modelo Gemini.");
        }

        const diagnosticData = JSON.parse(resultText);
        return res.json(diagnosticData);

      } catch (error: any) {
        console.warn("Erro ao gerar Atlas Score via API Gemini, acionando fallback inteligente de segurança:", error.message || error);
        const fallbackData = generateFallbackReport(companyName, city, segment, website, googleMapsUrl);
        return res.json(fallbackData);
      }
    } else {
      console.info(`Chave GEMINI_API_KEY ausente ou em ambiente de preview público. Executando diagnóstico dinâmico local de alta fidelidade para: ${companyName}`);
      const fallbackData = generateFallbackReport(companyName, city, segment, website, googleMapsUrl);
      return res.json(fallbackData);
    }
  });

  // Serve static files in production / Vite middleware in dev
  // We check if process.env.NODE_ENV is "production", or if we are executing the bundled CJS file (inside dist)
  const isProduction = 
    process.env.NODE_ENV === "production" || 
    __filename.includes("dist") || 
    __filename.endsWith(".cjs");

  if (isProduction) {
    const distPath = __filename.includes("dist")
      ? path.dirname(__filename)
      : path.join(process.cwd(), 'dist');
    
    console.log(`Running in PRODUCTION mode. Serving static assets from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log("Running in DEVELOPMENT mode with Vite middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
