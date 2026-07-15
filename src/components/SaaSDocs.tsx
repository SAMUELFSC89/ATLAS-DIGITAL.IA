import { useState } from 'react';
import { 
  Terminal, ShieldCheck, Activity, Award, Server, 
  Settings, Layers, ChevronRight, HelpCircle, Code2, Cpu 
} from 'lucide-react';

export default function SaaSDocs() {
  const [selectedTopic, setSelectedTopic] = useState<'score' | 'crawler' | 'webvitals' | 'gdpr'>('score');

  const DOCS_TOPICS = [
    { id: 'score', label: 'Metodologia do Atlas Score', icon: Award },
    { id: 'crawler', label: 'Comportamento do Crawler Atlas', icon: Server },
    { id: 'webvitals', label: 'Engenharia Core Web Vitals', icon: Activity },
    { id: 'gdpr', label: 'Conformidade de Privacidade (LGPD)', icon: ShieldCheck }
  ];

  return (
    <div className="space-y-8 text-left">
      
      {/* Documentation Header */}
      <div className="border-b border-gray-900 pb-6">
        <span className="text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider block mb-1">
          Documentação Técnica do Sistema
        </span>
        <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
          Atlas Intelligence Blueprint
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Especificações matemáticas, arquitetura de coletores e regras de integridade dos motores do Atlas Score.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Topics selector */}
        <div className="lg:col-span-4 space-y-2">
          {DOCS_TOPICS.map((topic) => {
            const Icon = topic.icon;
            const isSelected = selectedTopic === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic.id as any)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                  isSelected 
                    ? 'bg-white text-black border-white shadow-lg' 
                    : 'bg-gray-950/40 text-gray-400 border-gray-900/60 hover:border-gray-800'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-black' : 'text-emerald-400'}`} />
                <span className={`text-xs font-bold ${isSelected ? 'text-black' : 'text-white'}`}>
                  {topic.label}
                </span>
              </button>
            );
          })}

          <div className="bg-[#121214]/30 border border-gray-900 rounded-2xl p-4 space-y-2 text-xs mt-6">
            <span className="text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" /> Atlas Engine v3.4.1
            </span>
            <p className="text-gray-500 font-sans leading-normal font-light">
              Os algoritmos de varredura operam em paralelo usando clusters serverless da AWS para assegurar velocidade de resposta abaixo de 5 segundos por domínio auditado.
            </p>
          </div>
        </div>

        {/* Right Topic Reader */}
        <div className="lg:col-span-8 bg-gray-950/40 border border-gray-900 rounded-2xl p-6 sm:p-8 space-y-6">
          
          {selectedTopic === 'score' && (
            <div className="space-y-4">
              <h3 className="text-white text-lg font-bold font-display tracking-tight border-b border-gray-900 pb-2">
                Fórmula de Ponderação do Atlas Score
              </h3>
              
              <p className="text-xs text-gray-300 leading-relaxed font-sans font-light">
                O Atlas Score representa um índice matemático ponderado que reflete a maturidade digital de canais comerciais locais. A pontuação varia de <strong className="text-white">0 a 100</strong>, estruturada sobre cinco vertentes de conformidade técnica:
              </p>

              {/* Formula Table Box */}
              <div className="bg-black/40 border border-gray-900 rounded-xl p-4 font-mono text-[11px] text-gray-400 space-y-2">
                <div className="text-emerald-400 font-bold border-b border-gray-900 pb-1.5 flex justify-between uppercase text-[10px]">
                  <span>Componente Técnico</span>
                  <span>Peso Científico</span>
                </div>
                <div className="flex justify-between">
                  <span>1. SEO Técnico & Semântica Google</span>
                  <span className="text-white font-bold">25% (Peso: 0.25)</span>
                </div>
                <div className="flex justify-between">
                  <span>2. Core Web Vitals (Velocidade & Resposta)</span>
                  <span className="text-white font-bold">25% (Peso: 0.25)</span>
                </div>
                <div className="flex justify-between">
                  <span>3. Conversão & Chamadas Comerciais (WhatsApp)</span>
                  <span className="text-white font-bold">20% (Peso: 0.20)</span>
                </div>
                <div className="flex justify-between">
                  <span>4. Presença Local (Google Perfil de Empresa)</span>
                  <span className="text-white font-bold">20% (Peso: 0.20)</span>
                </div>
                <div className="flex justify-between">
                  <span>5. Inteligência Conversacional & Automações</span>
                  <span className="text-white font-bold">10% (Peso: 0.10)</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <h4 className="text-white text-xs font-bold uppercase font-mono tracking-wide">Graduação de Maturidade:</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 font-mono font-bold rounded border border-red-900/20 text-[9px]">0 - 49%</span>
                    <p className="text-gray-400 leading-relaxed font-light"><strong className="text-white">Fase Crítica:</strong> Presença digital deficiente ou nula. Sem otimizações de indexação, velocidade lenta que afasta prospects, necessitando de reestruturação imediata.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 font-mono font-bold rounded border border-amber-900/20 text-[9px]">50 - 79%</span>
                    <p className="text-gray-400 leading-relaxed font-light"><strong className="text-white">Fase de Alerta:</strong> Possui sitemap basilar, mas peca em responsividade celular e peca no funil de atendimento. Razoavelmente visível, mas desperdiça cliques diários.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 font-mono font-bold rounded border border-emerald-900/20 text-[9px]">80 - 100%</span>
                    <p className="text-gray-400 leading-relaxed font-light"><strong className="text-white">Fase Corporativa:</strong> Alta eficiência técnica. Código limpo, carregamento abaixo de 2 segundos, funil comercial integrado, excelente autoridade de pesquisa local.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTopic === 'crawler' && (
            <div className="space-y-4">
              <h3 className="text-white text-lg font-bold font-display tracking-tight border-b border-gray-900 pb-2">
                Políticas de Acesso do Coletor AtlasBot
              </h3>
              
              <p className="text-xs text-gray-300 leading-relaxed font-sans font-light">
                O <strong className="text-white">AtlasBot</strong> é o robô indexador encarregado de decodificar o HTML dos domínios alvos no momento da auditoria técnica. Ele segue rígidos padrões internacionais de cortesia de raspagem para não sobrecarregar os servidores dos clientes:
              </p>

              <div className="bg-gray-950 rounded-xl border border-gray-900 p-4 space-y-3 font-mono text-[11px] text-gray-400">
                <div className="flex items-center gap-2 text-[#E2B755] font-bold text-[10px]">
                  <Terminal className="w-4 h-4" />
                  USER-AGENT DECLARADO:
                </div>
                <div className="bg-black/40 rounded p-2.5 text-gray-300 leading-relaxed select-all">
                  Mozilla/5.0 (compatible; AtlasBot/3.4; +https://atlasintelligence.com/bot)
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  O crawler respeita integralmente as diretivas contidas no arquivo <strong className="text-white">robots.txt</strong> de cada domínio. Se a instrução "Disallow: /" estiver parametrizada para o AtlasBot, o diagnóstico será cancelado para assegurar as políticas de segurança do webmaster.
                </p>
              </div>

              <div className="space-y-1 text-xs">
                <h4 className="text-white font-bold font-mono text-[11px] uppercase tracking-wide">Frequência de Requisições:</h4>
                <p className="text-gray-400 font-light leading-relaxed">
                  Para auditorias em tempo real, limitamos a varredura a no máximo <strong>3 requisições simultâneas por IP</strong>, com timeout automático de 10 segundos por recurso CSS ou JS.
                </p>
              </div>
            </div>
          )}

          {selectedTopic === 'webvitals' && (
            <div className="space-y-4">
              <h3 className="text-white text-lg font-bold font-display tracking-tight border-b border-gray-900 pb-2">
                Algoritmos Core Web Vitals (Velocidade & Desempenho)
              </h3>
              
              <p className="text-xs text-gray-300 leading-relaxed font-sans font-light">
                O sub-mecanismo de velocidade do Atlas Intelligence mede em tempo real a experiência de renderização visual conforme as definições de Web Vitals do Google Chrome:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="bg-gray-950 border border-gray-900 rounded-xl p-4 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 block uppercase">LCP (Largest Contentful)</span>
                  <p className="text-[10px] text-gray-400 font-light font-sans leading-normal">Tempo para renderizar o maior bloco de texto ou imagem na tela do celular. <strong className="text-white">Ideal: &lt; 2.5s</strong>.</p>
                </div>

                <div className="bg-gray-950 border border-gray-900 rounded-xl p-4 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-amber-500 block uppercase">FID (First Input Delay)</span>
                  <p className="text-[10px] text-gray-400 font-light font-sans leading-normal">Mede o atraso de resposta ao primeiro clique efetuado pelo visitante. <strong className="text-white">Ideal: &lt; 100ms</strong>.</p>
                </div>

                <div className="bg-gray-950 border border-gray-900 rounded-xl p-4 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 block uppercase">CLS (Cumulative Shift)</span>
                  <p className="text-[10px] text-gray-400 font-light font-sans leading-normal">Mede a estabilidade visual dos blocos de textos e botões durante a carga. <strong className="text-white">Ideal: &lt; 0.1</strong>.</p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-900/60 text-[10px] text-gray-500 font-mono flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                Nota: O cálculo é efetuado através de sandboxes emulados Chromium simulando conexão de rede móvel regular 4G.
              </div>
            </div>
          )}

          {selectedTopic === 'gdpr' && (
            <div className="space-y-4">
              <h3 className="text-white text-lg font-bold font-display tracking-tight border-b border-gray-900 pb-2">
                Conformidade com a LGPD e Segurança Cibernética
              </h3>
              
              <p className="text-xs text-gray-300 leading-relaxed font-sans font-light">
                A Atlas Intelligence preza integralmente pelas leis de privacidade brasileiras (LGPD) e regulamentações internacionais de segurança de dados ao efetuar auditorias corporativas:
              </p>

              <div className="space-y-3 font-sans text-xs text-gray-400 leading-relaxed font-light">
                <div className="flex gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p><strong className="text-white">Não Coleta de Dados Pessoais:</strong> O coletor analisa exclusivamente o código-fonte público de websites, sitemaps e metadados agregados declarados voluntariamente pelas marcas nas listagens do Google Maps. Dados sigilosos de clientes finais nunca são lidos ou salvos.</p>
                </div>

                <div className="flex gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p><strong className="text-white">Criptografia Ponta a Ponta:</strong> As chaves API de CRM, credenciamento do WhatsApp Business Platform (tokens) e e-mails conectadas via OAuth são armazenadas em containers criptografados isolados por chaves exclusivas do usuário.</p>
                </div>

                <div className="flex gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p><strong className="text-white">Direito de Exclusão (Opt-out):</strong> Proprietários de domínios auditados podem solicitar a remoção permanente ou o bloqueio de seu sitemap em nossos motores preenchendo o termo oficial de conformidade.</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
