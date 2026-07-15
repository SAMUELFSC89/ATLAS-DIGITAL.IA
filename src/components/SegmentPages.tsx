import { useState } from 'react';
import { 
  Compass, ShieldCheck, ArrowRight, LayoutGrid, Sparkles, 
  Settings, Users, Layers, Award, BarChart3, Star, Zap 
} from 'lucide-react';

export default function SegmentPages() {
  const [activeSegment, setActiveSegment] = useState<'marmoraria' | 'solar' | 'vidracaria'>('marmoraria');

  const NICHE_DATA = {
    marmoraria: {
      title: "Arquitetura Digital para Marmorarias de Luxo",
      subtitle: "Capture arquitetos e clientes de alto padrão com sitemaps estruturados para portfólios visuais pesados.",
      quote: "Marmoristas perdem até 65% de leads ricos devido a páginas lentas que demoram para abrir fotos de mármore exótico.",
      points: [
        { title: "Compressão de Imagens de Alta Resolução", desc: "Formatos WebP otimizados para carregar fotos de chapas e acabamentos finos sem prejudicar a velocidade do PageSpeed." },
        { title: "Sitemap Estruturado de Portfólios", desc: "Arranjo lógico de links focado no público de alto ticket e construtoras." },
        { title: "WhatsApp Direct-to-Budget", desc: "Gatilhos persuasivos focados em encaminhar o visitante direto para a triagem de orçamentos." }
      ],
      tagline: "Engenharia visual para pedras ornamentais"
    },
    solar: {
      title: "Funil Técnico para Empresas de Energia Solar",
      subtitle: "Acelere a captura de leads comerciais e industriais interessados em payback rápido e transição limpa.",
      quote: "Empresas fotovoltaicas de alta performance precisam de calculadoras dinâmicas de economia de luz integradas ao site.",
      points: [
        { title: "Simulador de Payback Integrado", desc: "Sistemas simples onde o cliente digita a conta de luz e recebe estimativas precisas de retorno de investimento." },
        { title: "Páginas Estáticas de Altíssimo Desempenho", desc: "Carregamento abaixo de 1.5s para tráfego pago vindo de anúncios locais no Google Search." },
        { title: "SEO Local de Atração Comercial", desc: "Otimização absoluta para capturar pesquisas por indústrias e galpões comerciais." }
      ],
      tagline: "Prospecção técnica para energia fotovoltaica"
    },
    vidracaria: {
      title: "Soluções de Conversão para Vidraçarias e Esquadrias",
      subtitle: "Destaque suas fachadas de vidro, divisórias e coberturas em resultados geolocalizados de alta visibilidade.",
      quote: "O cliente de vidros temperados exige agilidade máxima de resposta para fechar a medição técnica em obra.",
      points: [
        { title: "Google Perfil Maps Imbatível", desc: "Fichas locais configuradas de forma perfeita para reinar nas pesquisas por vidraceiros próximos." },
        { title: "Formulários Rápidos de Medição", desc: "Coleta otimizada de dimensões básicas de vãos e modelos de vidros direto via mobile." },
        { title: "Segurança de Indexação Técnica", desc: "Marcação Schema JSON-LD de Local Business integrada ao código para o Google indexar a marca." }
      ],
      tagline: "Canais rápidos para fachadas e divisórias"
    }
  };

  const current = NICHE_DATA[activeSegment];

  return (
    <div className="space-y-8 text-left">
      
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-900 pb-6">
        <div>
          <span className="text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider block mb-1">
            Segmentos do Mercado
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            Arquitetura de Conversão por Nicho
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Explore como o Atlas Intelligence adapta sua metodologia e algoritmos do Atlas Score para os principais segmentos técnicos de mercado.
          </p>
        </div>

        {/* Toggles */}
        <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-900">
          <button
            onClick={() => setActiveSegment('marmoraria')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeSegment === 'marmoraria' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Marmorarias
          </button>
          <button
            onClick={() => setActiveSegment('solar')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeSegment === 'solar' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Energia Solar
          </button>
          <button
            onClick={() => setActiveSegment('vidracaria')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeSegment === 'vidracaria' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Vidraçarias
          </button>
        </div>
      </div>

      {/* Main Segment Blueprint Profile Display */}
      <div className="bg-gradient-to-r from-[#121214]/60 to-[#0B0B0E] border border-gray-900 rounded-3xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 relative overflow-hidden">
        
        {/* Abstract background subtle pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full animate-pulse" />

        {/* Left Side segment marketing */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="text-[#E2B755] font-mono text-[10px] font-bold uppercase tracking-widest block">
              {current.tagline}
            </span>
            <h3 className="text-white text-xl sm:text-2xl font-display font-black tracking-tight leading-tight">
              {current.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 font-light leading-relaxed font-sans">
              {current.subtitle}
            </p>
          </div>

          <div className="border-l-2 border-emerald-500/40 pl-4 py-1 italic text-xs text-gray-300 leading-relaxed max-w-xl bg-emerald-500/[0.01]">
            "{current.quote}"
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="text-white text-xs font-bold font-mono uppercase tracking-wide">Padrões Técnicos Recomendados:</h4>
            
            <div className="grid grid-cols-1 gap-4">
              {current.points.map((pt, idx) => (
                <div key={idx} className="bg-gray-950/40 border border-gray-900 rounded-xl p-4 flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-white text-xs font-bold leading-none">{pt.title}</h5>
                    <p className="text-[11px] text-gray-500 leading-normal font-sans font-light">{pt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side visual summary box */}
        <div className="lg:col-span-5 bg-gray-950/40 border border-gray-900 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4 text-left">
            <span className="text-white text-xs font-bold font-mono uppercase tracking-wider border-b border-gray-900 pb-2 block">
              Métricas e Impacto do Segmento
            </span>
            
            <div className="space-y-4 pt-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-light font-sans">Aumento de leads qualificados:</span>
                <span className="text-emerald-400 font-mono font-bold">+45% a +78%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-light font-sans">Redução no custo de aquisição (CAC):</span>
                <span className="text-emerald-400 font-mono font-bold">-30% a -40%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-light font-sans">Velocidade média recomendada:</span>
                <span className="text-white font-mono font-bold">&lt; 1.8 segundos</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-light font-sans">Maturidade digital ideal (Atlas Score):</span>
                <span className="text-emerald-400 font-mono font-bold">&gt; 85/100</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-950 border border-gray-900 rounded-xl p-4 flex items-start gap-3">
            <Zap className="w-4 h-4 text-[#E2B755] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h5 className="text-white text-[10px] font-bold font-mono uppercase tracking-wide">Foco Geolocalizado</h5>
              <p className="text-[10px] text-gray-500 leading-relaxed font-sans font-light">
                O motor do Atlas Score pondera os algoritmos de buscas comparando o site do cliente com as marcas concorrentes que atuam num raio geográfico de até 25km na mesma cidade.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
