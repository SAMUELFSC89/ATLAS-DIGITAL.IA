import { useState } from 'react';
import { 
  BookOpen, Search, ArrowRight, Tag, Clock, Calendar, 
  ChevronRight, Sparkles, AlertCircle, Share2, Heart 
} from 'lucide-react';
import { BlogArticle } from '../types';

export default function SaaSBlog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);

  const ARTICLES: BlogArticle[] = [
    {
      id: 'art-1',
      title: 'Como a Velocidade de Carregamento Mobile Afeta as Vendas em Marmorarias e Vidraçarias',
      excerpt: 'Mapeamos o comportamento do consumidor de alto padrão e constatamos: lentidões superiores a 3 segundos reduzem em 58% o preenchimento de formulários de orçamentos.',
      content: `### O Custo da Lentidão Comercial na Web

No mercado de arquitetura de alto padrão, marmorarias de luxo e esquadrias sob medida, o tempo é o recurso mais valioso do cliente. Quando um potencial lead clica em um anúncio no Instagram ou no Google e é direcionado para uma página institucional lenta, o primeiro contato com a marca já se inicia com frustração.

Estudos de usabilidade realizados pelo time técnico da **Atlas Intelligence** indicam que a taxa de conversão cai drasticamente a cada segundo de atraso:

*   **Até 1.8 segundos:** Taxa de rejeição de apenas 12%. Experiência fluida e de alta credibilidade.
*   **Entre 3 e 4 segundos:** Abandono de até 42%. Perda de tráfego de alta intenção.
*   **Superior a 5 segundos:** Abandono crítico de até 70%. O visitante simplesmente retorna à pesquisa do Google e clica no concorrente.

#### Como Resolver os Gargalos de Velocidade de Forma Prática

Para otimizar os canais de forma corporativa e garantir que seu site carregue de forma quase instantânea:

1.  **Formatos Modernos de Imagem (WebP e AVIF):** Substitua todas as imagens JPG ou PNG pesadas de chapas de granito ou portfólio por formatos otimizados em nuvem, reduzindo o tamanho de arquivo em até 80% sem perder resolução visual.
2.  **Otimização Assíncrona de Scripts:** Force scripts de terceiros (como Pixel do Facebook ou tags do Google) a carregarem somente após os elementos visuais principais da página.
3.  **Minificação de CSS e JS:** Elimine espaços em branco desnecessários e comentários no código de produção.

Ao elevar a velocidade mobile para níveis de excelência, você não está apenas agradando ao robô do Google, mas criando um tapete vermelho digital para que seu cliente agende orçamentos sem ruído ou lentidão.`,
      category: 'SEO',
      readTime: '5 min',
      date: '14 de Julho de 2026',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      slug: 'velocidade-carregamento-marmorarias',
      tags: ['Velocidade', 'Core Web Vitals', 'Conversão']
    },
    {
      id: 'art-2',
      title: 'Por Que a Presença Local no Google Maps Está Redefinindo a Atração de Clientes de Alto Padrão',
      excerpt: 'Uma análise profunda sobre como as fichas otimizadas do Google Perfil de Empresa capturam leads qualificados na sua cidade sem investimento em tráfego pago.',
      content: `### O Novo Boca a Boca é Geolocalizado

Antes de contratar uma marmoraria para fornecer bancadas de quartzito ou uma empresa de energia solar para instalar módulos fotovoltaicos, o consumidor realiza uma busca geolocalizada: *"Marmoraria perto de mim"* ou *"Energia solar em [Cidade]"*.

Nesse momento crucial de compra, o algoritmo do Google prioriza o **Local Pack** — as três primeiras empresas exibidas no mapa de resultados. Se a sua empresa não aparece ali, ou aparece sem avaliações e sem fotos atualizadas, você está doando leads valiosos para a concorrência diariamente.

#### Os Três Pilares da Otimização no Google Perfil de Empresa

1.  **Relevância (Preenchimento Completo):** Certifique-se de preencher 100% dos campos de serviços, horários, endereço, site e descrição executiva.
2.  **Proximidade Física:** Embora você não possa mover o seu endereço comercial, pode expandir sua área de cobertura de atendimento nas configurações do mapa.
3.  **Destaque (Avaliações Ativas):** Responda a todas as avaliações de forma humanizada. Um fluxo recorrente de avaliações 5 estrelas é o sinal mais forte de confiança para o motor de busca do Google.

Ao unificar essas práticas com um site rápido, você constrói uma barreira intransponível que atrai novos orçamentos corporativos de forma orgânica e permanente.`,
      category: 'Google',
      readTime: '4 min',
      date: '12 de Julho de 2026',
      image: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=800&q=80',
      slug: 'otimizacao-google-maps-local',
      tags: ['Google Maps', 'SEO Local', 'Google Perfil']
    },
    {
      id: 'art-3',
      title: 'Como Utilizar o WhatsApp Business Cloud API para Triplicar Seus Agendamentos Comerciais',
      excerpt: 'Guia completo de engenharia conversacional: aprenda a estruturar filas de aprovação, templates homologados e uso sutil de sugestões por inteligência artificial.',
      content: `### A Revolução da Conversação Instantânea

O WhatsApp Business deixou de ser um canal de atendimento de apoio para se tornar a ferramenta definitiva de fechamento comercial de alto ticket no Brasil. Empresas que utilizam a API Cloud oficial da Meta reduzem o tempo de fechamento de propostas em até 40%.

No entanto, o disparo excessivo ou o uso de robôs com linguagem fria e robotizada gera bloqueios e afasta o consumidor. A chave do sucesso comercial reside na **Engenharia Conversacional Consultiva**.

#### O Fluxo de Atendimento de Alta Conversão da Atlas

1.  **Aprovação Humana Prvia (Fila de Triagem):** Nunca deixe robôs responderem de forma 100% autônoma sobre questões complexas ou preços. O papel da Inteligência Artificial é ler as mensagens e fornecer rascunhos consultivos sugeridos para que o vendedor humano apenas valide e clique em enviar.
2.  **Uso de Templates Homologados pela Meta:** Crie fluxos padronizados para avisos de reuniões, termos de propostas e envios de auditorias digitais (como o PDF do Atlas Score). Isso evita denúncias e banimentos de chips comerciais.
3.  **Follow-up Técnico Persuasivo:** Configure mensagens de lembrete com tom de mentoria técnica para resgatar leads frios que não retornaram o contato.

Integrar a automação conversacional oficial ao CRM da sua empresa cria um processo transparente, unificado e escalável que converte simples contatos em contratos recorrentes assinados de forma rápida.`,
      category: 'WhatsApp',
      readTime: '6 min',
      date: '10 de Julho de 2026',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
      slug: 'whatsapp-business-cloud-api-vendas',
      tags: ['WhatsApp', 'Meta Cloud API', 'Automação']
    }
  ];

  const categoriesList = [
    { id: 'all', label: 'Todos os Artigos' },
    { id: 'SEO', label: 'SEO Técnico' },
    { id: 'Google', label: 'Google Perfil' },
    { id: 'WhatsApp', label: 'Vendas WhatsApp' }
  ];

  // Filtering logic
  const filteredArticles = ARTICLES.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 text-left">
      
      {/* Editorial Header */}
      <div className="border-b border-gray-900 pb-6">
        <span className="text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider block mb-1">
          Publicações Científicas e Técnicas
        </span>
        <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
          Atlas Intelligence Editorial
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Artigos, estudos de caso e análises estratégicas elaborados por nossos consultores seniores de engenharia web e SEO.
        </p>
      </div>

      {!selectedArticle ? (
        /* ARTICLES ARCHIVE INDEX */
        <div className="space-y-8">
          
          {/* Controls: Category toggle & Search input */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-950/20 border border-gray-900/60 p-4 rounded-2xl">
            {/* Category Select Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {categoriesList.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    selectedCategory === cat.id 
                      ? 'bg-white text-black' 
                      : 'bg-gray-950/40 text-gray-400 border border-gray-900 hover:border-gray-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input field */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Pesquisar artigos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-950 text-white border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#E2B755]"
              />
            </div>
          </div>

          {/* Articles Listing Grid */}
          {filteredArticles.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-900/60 rounded-2xl bg-gray-950/20">
              <AlertCircle className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-mono">Nenhum artigo encontrado com as palavras pesquisadas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((art) => (
                <div 
                  key={art.id}
                  className="bg-gray-950/40 border border-gray-900 hover:border-gray-800 rounded-2xl overflow-hidden flex flex-col justify-between group transition-all"
                >
                  {/* Article Banner image */}
                  <div className="relative h-44 overflow-hidden bg-gray-900">
                    <img 
                      src={art.image} 
                      alt={art.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-emerald-400 border border-gray-900 text-[9px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded">
                      {art.category}
                    </span>
                  </div>

                  {/* Article body summary */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-left">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {art.readTime}</span>
                        <span>&bull;</span>
                        <span>{art.date}</span>
                      </div>
                      
                      <h3 className="text-white text-sm sm:text-base font-bold tracking-tight leading-snug group-hover:text-[#E2B755] transition-colors line-clamp-2">
                        {art.title}
                      </h3>
                      
                      <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3 font-sans font-light">
                        {art.excerpt}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-900/60 flex items-center justify-between text-xs">
                      {/* Tags list */}
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-gray-600" />
                        <span className="text-[9px] font-mono text-gray-500">{art.tags[0]}</span>
                      </div>

                      <button
                        onClick={() => setSelectedArticle(art)}
                        className="text-white hover:text-[#E2B755] font-semibold text-xs flex items-center gap-1 group/btn"
                      >
                        Ler Artigo Completo
                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      ) : (
        /* SINGLE ARTICLE FULL READER VIEW */
        <div className="max-w-3xl mx-auto bg-gray-950/20 border border-gray-900 rounded-3xl p-6 sm:p-10 space-y-6">
          <button
            onClick={() => setSelectedArticle(null)}
            className="px-4 py-2 bg-gray-950 hover:bg-gray-900 border border-gray-800 text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all self-start"
          >
            &larr; Voltar para o Editorial
          </button>

          {/* Heading meta details */}
          <div className="space-y-4 text-left border-b border-gray-900 pb-5">
            <span className="text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-widest block bg-emerald-500/10 border border-emerald-900/20 rounded-full px-3 py-0.5 inline-block">
              {selectedArticle.category}
            </span>

            <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight leading-tight">
              {selectedArticle.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Leitura de {selectedArticle.readTime}</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Publicado em {selectedArticle.date}</span>
            </div>
          </div>

          {/* Article Large Banner */}
          <div className="h-64 sm:h-80 rounded-2xl overflow-hidden bg-gray-900">
            <img 
              src={selectedArticle.image} 
              alt={selectedArticle.title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Article Technical Body */}
          <div className="text-gray-300 text-sm font-sans font-light leading-relaxed space-y-4 prose prose-invert max-w-none text-left">
            {/* Split contents for styled headlines and bullets */}
            {selectedArticle.content.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-white text-lg sm:text-xl font-bold font-display tracking-tight pt-4">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('#### ')) {
                return (
                  <h4 key={idx} className="text-white text-base font-bold font-mono uppercase tracking-wide pt-3 text-emerald-400">
                    {paragraph.replace('#### ', '')}
                  </h4>
                );
              }
              if (paragraph.startsWith('*   ')) {
                return (
                  <ul key={idx} className="list-disc list-inside pl-4 space-y-1.5 text-xs sm:text-sm text-gray-400 font-sans">
                    {paragraph.split('\n').map((li, lIdx) => (
                      <li key={lIdx}>{li.replace('*   ', '')}</li>
                    ))}
                  </ul>
                );
              }
              if (paragraph.match(/^\d+\./)) {
                return (
                  <ol key={idx} className="list-decimal list-inside pl-4 space-y-2 text-xs sm:text-sm text-gray-400 font-sans">
                    {paragraph.split('\n').map((li, lIdx) => (
                      <li key={lIdx} className="leading-relaxed">{li.replace(/^\d+\.\s*/, '')}</li>
                    ))}
                  </ol>
                );
              }
              return (
                <p key={idx} className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Article Footer tools */}
          <div className="pt-6 border-t border-gray-900 flex items-center justify-between text-xs text-gray-500">
            <div className="flex gap-2">
              {selectedArticle.tags.map((t, idx) => (
                <span key={idx} className="text-[10px] font-mono bg-gray-900 text-gray-400 border border-gray-800 px-2 py-0.5 rounded">
                  #{t}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => alert("Artigo curtido! Obrigado pelo apoio técnico.")}
                className="flex items-center gap-1 hover:text-red-400 transition-colors"
              >
                <Heart className="w-4 h-4" /> Gostei
              </button>
              <button 
                onClick={() => alert("Link de compartilhamento copiado para a área de transferência!")}
                className="flex items-center gap-1 hover:text-[#E2B755] transition-colors"
              >
                <Share2 className="w-4 h-4" /> Compartilhar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
