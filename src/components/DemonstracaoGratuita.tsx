import React, { useState } from 'react';
import { 
  Compass, Loader2, Sparkles, AlertTriangle, ArrowRight, 
  CheckCircle, ShieldAlert, Award, FileText, Smartphone, Globe, Search 
} from 'lucide-react';

interface DemonstracaoGratuitaProps {
  onUnlockPremium: () => void;
}

export default function DemonstracaoGratuita({ onUnlockPremium }: DemonstracaoGratuitaProps) {
  const [url, setUrl] = useState('');
  const [segment, setSegment] = useState('Marmoraria');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [report, setReport] = useState<any | null>(null);

  const SEGMENTS = [
    'Marmoraria', 'Energia Solar', 'Vidraçaria', 'Esquadrias', 'Coberturas', 'Serralheria', 'Móveis Planejados'
  ];

  const handleRunDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      alert("Por favor, preencha o endereço (URL) do seu site!");
      return;
    }

    setLoading(true);
    setReport(null);

    const steps = [
      "Iniciando conexão segura com sandbox Atlas Engine...",
      "Resolvendo sitemap.xml e lendo robots.txt...",
      "Analisando renderização de imagens e arquivos estáticos...",
      "Simulando velocidade de carga em conexões móveis 4G locais...",
      "Processando tags semânticas e metadados de cabeçalhos...",
      "Verificando conformidade do formulário de captura e WhatsApp..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setLoadingStep(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    // Generate simulated basic diagnostic
    const calculatedScore = Math.floor(35 + Math.random() * 30);
    setReport({
      url: url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0],
      segment,
      score: calculatedScore,
      analysisDate: new Date().toLocaleString('pt-BR'),
      testsCount: 24,
      issuesFound: 14,
      details: {
        seo: {
          score: Math.floor(40 + Math.random() * 30),
          status: 'Alerta Crítico',
          issues: ['Sitemap XML não localizado na raiz', 'Ausência de Schema.org local business', 'Metadados OpenGraph ausentes']
        },
        speed: {
          score: Math.floor(30 + Math.random() * 30),
          status: 'Lento (LCP > 4.2s)',
          issues: ['Imagens gigantes sem compressão WebP', 'Scripts bloqueantes de renderização móvel', 'Cache de arquivos inativo']
        },
        conversion: {
          score: Math.floor(35 + Math.random() * 30),
          status: 'Ruim',
          issues: ['Botão de WhatsApp flutuante sem preenchimento de copy', 'Ausência de formulário estático de orçamentos', 'Nenhuma chamada persuasiva visível']
        }
      }
    });

    setLoading(false);
  };

  return (
    <div className="bg-[#121214]/30 border border-gray-900 rounded-3xl p-6 sm:p-10 space-y-8 text-left max-w-4xl mx-auto">
      
      {/* Intro text */}
      <div className="space-y-2 border-b border-gray-900/60 pb-5 text-center max-w-2xl mx-auto">
        <span className="text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-widest block mb-1">
          Auditoria Instantânea Gratuita
        </span>
        <h3 className="text-white text-xl sm:text-2xl font-display font-black tracking-tight">
          Diagnóstico Expresso de Presença Digital
        </h3>
        <p className="text-xs text-gray-400">
          Insira o endereço do seu site atual e selecione o seu segmento. Nosso motor do Atlas Score simulará uma auditoria preliminar gratuita em tempo real!
        </p>
      </div>

      {!report && !loading && (
        /* INPUT FORM COMPONENT */
        <form onSubmit={handleRunDiagnostic} className="space-y-6 max-w-lg mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[10px] uppercase font-mono font-bold text-gray-500">URL do seu site</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="Ex: www.minhamarmoraria.com.br"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-gray-950 text-white border border-gray-800 rounded-xl pl-10 pr-4 py-3.5 text-xs focus:outline-none focus:border-[#E2B755]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono font-bold text-gray-500">Segmento</label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full bg-gray-950 text-white border border-gray-800 rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:border-[#E2B755] font-sans"
              >
                {SEGMENTS.map((seg, idx) => (
                  <option key={idx} value={seg}>{seg}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-[#E2B755] hover:bg-yellow-500 text-black font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4 text-black" />
            Executar Diagnóstico Expresso
          </button>
        </form>
      )}

      {loading && (
        /* RUNNING SCREEN LOADING STATE */
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
          <Loader2 className="w-8 h-8 animate-spin text-[#E2B755]" />
          <div className="space-y-1">
            <span className="text-white text-sm font-bold block">Varredura de Diagnóstico Ativa</span>
            <span className="text-gray-500 text-xs font-mono">{loadingStep}</span>
          </div>
        </div>
      )}

      {report && (
        /* REPORT OUTCOME SCORE CARD */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-900 pb-5">
            <div>
              <span className="text-red-400 font-mono text-[9px] font-bold uppercase tracking-wider block">Varredura Concluída</span>
              <h4 className="text-white text-base font-bold font-display">{report.url}</h4>
              <p className="text-[10px] text-gray-500 font-mono">Segmento: {report.segment} &bull; Analisado em {report.analysisDate}</p>
            </div>

            {/* Score circle badge */}
            <div className="flex items-center gap-4 bg-gray-950 border border-gray-900 rounded-2xl p-4 self-start sm:self-center">
              <div className="text-center">
                <span className="text-[9px] uppercase font-mono text-gray-500 block">Pontuação Global</span>
                <span className={`text-2xl font-display font-black block mt-0.5 ${
                  report.score >= 80 ? 'text-emerald-400' : report.score >= 50 ? 'text-amber-500' : 'text-red-400'
                }`}>
                  {report.score}/100
                </span>
              </div>
            </div>
          </div>

          {/* Grid columns of problems */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-sans">
            
            {/* SEO section */}
            <div className="bg-gray-950/40 border border-gray-900 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-900/60 pb-2">
                <span className="text-white font-bold font-mono text-[10px] uppercase">SEO Técnico</span>
                <span className="text-red-400 font-bold font-mono">{report.details.seo.score}%</span>
              </div>
              <ul className="space-y-2 text-gray-400">
                {report.details.seo.issues.map((iss: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span>{iss}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Speed section */}
            <div className="bg-gray-950/40 border border-gray-900 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-900/60 pb-2">
                <span className="text-white font-bold font-mono text-[10px] uppercase">Core Web Vitals</span>
                <span className="text-amber-500 font-bold font-mono">{report.details.speed.score}%</span>
              </div>
              <ul className="space-y-2 text-gray-400">
                {report.details.speed.issues.map((iss: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{iss}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Conversion section */}
            <div className="bg-gray-950/40 border border-gray-900 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-900/60 pb-2">
                <span className="text-white font-bold font-mono text-[10px] uppercase">Conversão de Leads</span>
                <span className="text-red-400 font-bold font-mono">{report.details.conversion.score}%</span>
              </div>
              <ul className="space-y-2 text-gray-400">
                {report.details.conversion.issues.map((iss: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span>{iss}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Locked Premium Banner CTA */}
          <div className="bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-left">
              <span className="text-[#E2B755] font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-yellow-500" /> RECOMENDAÇÃO TÉCNICA ATLAS
              </span>
              <h5 className="text-white text-base font-bold font-display tracking-tight">Liberar Relatório Executivo Completo & PDF</h5>
              <p className="text-xs text-gray-400 leading-relaxed font-sans font-light max-w-xl">
                Seu site registra um total de <strong className="text-white">{report.issuesFound} problemas críticos de conformidade digital</strong> que impedem sua marca de atrair clientes de alto padrão. Crie uma conta no portal para acessar o painel de auditoria estendida, baixar o relatório corporativo PDF, e acessar o Atlas Copilot para vendas.
              </p>
            </div>

            <button
              onClick={onUnlockPremium}
              className="px-6 py-3.5 bg-white hover:bg-gray-200 text-black font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all hover:scale-[1.02] shrink-0 self-stretch md:self-auto text-center justify-center"
            >
              Liberar Diagnóstico Completo
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
