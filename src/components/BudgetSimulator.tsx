import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Layers, 
  Zap, 
  Shield, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  MessageSquare, 
  Sparkles, 
  Gauge, 
  MousePointerClick, 
  Check,
  FolderHeart,
  Home,
  Compass,
  FileSpreadsheet
} from 'lucide-react';

type SegmentType = 'Marmoraria' | 'Vidraçaria' | 'Energia Solar' | 'Esquadrias' | 'Coberturas' | 'Serralheria' | 'Móveis Planejados';

interface FeatureOption {
  id: string;
  label: string;
  description: string;
  recommendedFor: SegmentType[];
}

const SEGMENTS: { name: SegmentType; icon: any; placeholder: string }[] = [
  { name: 'Marmoraria', icon: Layers, placeholder: 'Exibição de granitos, quartzitos e mármores de alto padrão.' },
  { name: 'Vidraçaria', icon: Shield, placeholder: 'Sacadas, cortinas de vidro, box e espelhos sob medida.' },
  { name: 'Energia Solar', icon: Zap, placeholder: 'Simulação de economia mensal de luz e portfólio técnico.' },
  { name: 'Esquadrias', icon: Home, placeholder: 'Esquadrias de alumínio sob medida e fachadas pele de vidro.' },
  { name: 'Coberturas', icon: Compass, placeholder: 'Coberturas retráteis de vidro, policarbonato e policloreto.' },
  { name: 'Serralheria', icon: Building2, placeholder: 'Portões basculantes, mezaninos, estruturas metálicas.' },
  { name: 'Móveis Planejados', icon: FolderHeart, placeholder: 'Cozinhas, closets e banheiros planejados premium.' }
];

const FEATURES: FeatureOption[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp Inteligente Integrado',
    description: 'Botões flutuantes e direcionamento direto segmentado por tipo de serviço.',
    recommendedFor: ['Marmoraria', 'Vidraçaria', 'Energia Solar', 'Esquadrias', 'Coberturas', 'Serralheria', 'Móveis Planejados']
  },
  {
    id: 'gallery',
    label: 'Galeria Interativa de Obras',
    description: 'Filtros rápidos por categoria para exibir acabamentos em altíssima definição.',
    recommendedFor: ['Marmoraria', 'Vidraçaria', 'Esquadrias', 'Móveis Planejados']
  },
  {
    id: 'calculator',
    label: 'Calculadora / Simulador de Economia',
    description: 'Calcula estimativa de economia de energia solar ou custos por m² de materiais.',
    recommendedFor: ['Energia Solar', 'Marmoraria']
  },
  {
    id: 'form',
    label: 'Formulário Inteligente de Briefing',
    description: 'Captura dados do projeto, largura/altura e permite upload de esboços/planta.',
    recommendedFor: ['Marmoraria', 'Vidraçaria', 'Esquadrias', 'Móveis Planejados']
  },
  {
    id: 'seo',
    label: 'SEO Avançado Local para Google',
    description: 'Apareça quando procurarem "marmoraria perto de mim" ou "instalação solar na minha cidade".',
    recommendedFor: ['Marmoraria', 'Vidraçaria', 'Energia Solar', 'Esquadrias', 'Coberturas', 'Serralheria', 'Móveis Planejados']
  },
  {
    id: 'maps',
    label: 'Google Maps com Raio de Atendimento',
    description: 'Mapa interativo mostrando regiões atendidas para focar em bairros nobres.',
    recommendedFor: ['Vidraçaria', 'Serralheria', 'Móveis Planejados']
  }
];

const TIMELINES = [
  { id: 'fast', label: 'Urgente', desc: 'Menos de 15 dias (Prioritário)' },
  { id: 'normal', label: 'Normal', desc: 'De 15 a 30 dias (Recomendado)' },
  { id: 'flexible', label: 'Flexível', desc: 'Mais de 30 dias' }
];

export default function BudgetSimulator() {
  const [step, setStep] = useState<number>(1);
  const [selectedSegment, setSelectedSegment] = useState<SegmentType>('Marmoraria');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['whatsapp', 'seo']);
  const [selectedTimeline, setSelectedTimeline] = useState<string>('normal');
  const [userName, setUserName] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');

  const toggleFeature = (id: string) => {
    if (selectedFeatures.includes(id)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== id));
    } else {
      setSelectedFeatures([...selectedFeatures, id]);
    }
  };

  const handleNext = () => {
    // If transitioning to Step 2, auto-select recommended features for segment
    if (step === 1) {
      const recommended = FEATURES.filter(f => f.recommendedFor.includes(selectedSegment)).map(f => f.id);
      // Keep whatsapp and seo as defaults but merge with recommended
      setSelectedFeatures(Array.from(new Set(['whatsapp', 'seo', ...recommended])));
    }
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  // Generate customized message for WhatsApp redirect
  const getWhatsAppLink = () => {
    const selectedFeaturesLabels = FEATURES
      .filter(f => selectedFeatures.includes(f.id))
      .map(f => `  - ${f.label}`)
      .join('%0A');

    const timelineLabel = TIMELINES.find(t => t.id === selectedTimeline)?.label || 'Normal';
    
    const message = `Olá Atlas Digital! Fiz a simulação de escopo para minha empresa no site.%0A%0A` +
      `*Empresa:* ${userName || 'Não informada'}%0A` +
      `*Segmento:* ${selectedSegment}%0A` +
      `*Prazo desejado:* ${timelineLabel}%0A` +
      `*Recursos selecionados:*%0A${selectedFeaturesLabels}%0A%0A` +
      `Gostaria de solicitar o diagnóstico gratuito de escopo e receber a proposta!`;

    return `https://wa.me/5511999999999?text=${message}`;
  };

  return (
    <div className="w-full bg-[#111827] border border-gray-800 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5B301] opacity-[0.03] rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600 opacity-[0.02] rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Info */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
        <div>
          <span className="text-[10px] text-[#F5B301] uppercase tracking-widest font-mono font-bold">Simulador Inteligente</span>
          <h3 className="text-lg font-bold text-white font-display">Planeje Seu Novo Site</h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500">Passo</span>
          <div className="text-base font-black text-white">
            <span className="text-[#F5B301]">{step}</span>/4
          </div>
        </div>
      </div>

      {/* Steps Content */}
      <div className="min-h-[280px]">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: SEGMENT */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <p className="text-sm text-gray-300">
                Selecione o <span className="text-white font-semibold">segmento principal</span> de atuação da sua empresa da construção ou acabamento:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SEGMENTS.map((seg) => {
                  const IconComp = seg.icon;
                  const isSelected = selectedSegment === seg.name;
                  return (
                    <button
                      key={seg.name}
                      onClick={() => setSelectedSegment(seg.name)}
                      className={`p-3.5 rounded-xl border text-left transition-all duration-300 flex items-start gap-3 hover:scale-[1.01] ${
                        isSelected 
                          ? 'border-[#F5B301] bg-[#f5b3010b] text-white shadow-md' 
                          : 'border-gray-800 bg-[#0B0F19]/60 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-[#F5B301] text-gray-900' : 'bg-gray-950 text-[#F5B301]'}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm leading-none mb-1 text-white flex items-center gap-1.5">
                          {seg.name}
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#F5B301]"></span>}
                        </div>
                        <p className="text-[11px] text-gray-500 leading-tight">{seg.placeholder}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 2: FEATURES */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-300">
                  Quais <span className="text-white font-semibold">recursos estratégicos</span> deseja implementar no seu site?
                </p>
                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-gray-400">
                  Focado em {selectedSegment}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {FEATURES.map((feat) => {
                  const isSelected = selectedFeatures.includes(feat.id);
                  const isRecommended = feat.recommendedFor.includes(selectedSegment);
                  return (
                    <button
                      key={feat.id}
                      onClick={() => toggleFeature(feat.id)}
                      className={`p-3 rounded-xl border text-left transition-all duration-300 flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'border-yellow-600 bg-yellow-950/10 text-white' 
                          : 'border-gray-800 bg-[#0B0F19]/40 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-[#F5B301] border-[#F5B301] text-gray-900' : 'border-gray-700 bg-gray-950'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-white leading-tight mb-0.5 flex items-center gap-1.5">
                            {feat.label}
                            {isRecommended && (
                              <span className="text-[9px] font-bold text-[#F5B301] bg-[#f5b30113] px-1 rounded uppercase tracking-wider">
                                Recomendado
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 leading-tight">{feat.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 3: TIMELINE & BASIC INFO */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <p className="text-sm text-gray-300 mb-2.5">
                  Qual o seu <span className="text-white font-semibold">prazo ideal</span> para ver seu site rodando e vendendo?
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {TIMELINES.map((time) => {
                    const isSelected = selectedTimeline === time.id;
                    return (
                      <button
                        key={time.id}
                        onClick={() => setSelectedTimeline(time.id)}
                        className={`p-3 rounded-xl border text-center transition-all duration-300 ${
                          isSelected 
                            ? 'border-[#F5B301] bg-[#f5b3010b] text-white' 
                            : 'border-gray-800 bg-[#0B0F19]/40 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        <div className="font-semibold text-xs text-white mb-0.5">{time.label}</div>
                        <div className="text-[9px] text-gray-500 leading-none">{time.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4 space-y-3">
                <p className="text-sm text-gray-300">
                  Para gerar o escopo customizado, preencha seus <span className="text-white font-semibold">dados de contato</span>:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-gray-500 font-mono font-bold mb-1">Nome da Empresa</label>
                    <input 
                      type="text"
                      placeholder="Ex: Marmoraria Real"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-gray-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-[#F5B301] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-gray-500 font-mono font-bold mb-1">Telefone (WhatsApp)</label>
                    <input 
                      type="tel"
                      placeholder="Ex: (11) 99999-9999"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-gray-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-[#F5B301] transition-colors"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: RESULT / CTA */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-[#0B0F19] border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#F5B301] font-mono text-[10px] font-bold">
                    <Sparkles className="w-3 h-3 text-[#F5B301]" />
                    ESCOPO CUSTOMIZADO GERADO COM SUCESSO!
                  </div>
                  <h4 className="text-base font-bold text-white font-display">
                    Estratégia de Alto Padrão para {selectedSegment}
                  </h4>
                  <p className="text-gray-400 text-[11px] leading-relaxed max-w-lg">
                    {selectedSegment === 'Marmoraria' && "Recomendamos foco total em fotografia de luxo, zoom de alta fidelidade e filtros rápidos de pedras para atrair arquitetos e projetos de alto valor."}
                    {selectedSegment === 'Vidraçaria' && "Seu site necessita de apelo visual refinado focado em sacadas e fechamentos, além de agendador integrado de visitas técnicas locais."}
                    {selectedSegment === 'Energia Solar' && "O ponto chave é o simulador de economia, gerando leads qualificados educados e prontos para fechamentos comerciais."}
                    {selectedSegment === 'Esquadrias' && "Sua marca exige sofisticação em portfólio visual amplo de esquadrias de alumínio e fachadas pele de vidro integradas."}
                    {selectedSegment === 'Coberturas' && "Destaque garantias estruturais e segurança contra chuvas e ventos fortes de forma limpa e institucional."}
                    {selectedSegment === 'Serralheria' && "Valorize a robustez das estruturas, acabamento anticorrosão e portões automáticos com CTA rápido direto para WhatsApp."}
                    {selectedSegment === 'Móveis Planejados' && "Mostre renderizações em 3D, divisões internas funcionais de armários e formulário refinado de captação de m²."}
                  </p>
                </div>

                <div className="bg-[#111827] border border-gray-800 p-3 rounded-lg shrink-0 flex flex-col items-center justify-center text-center">
                  <Gauge className="w-6 h-6 text-[#F5B301] mb-1" />
                  <div className="text-[10px] uppercase text-gray-500 font-mono">Performance Estimada</div>
                  <div className="text-lg font-black text-white">98 / 100</div>
                  <div className="text-[8px] text-green-400">Excelente no Google</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-green-950 text-green-400 flex items-center justify-center shrink-0">
                    <MousePointerClick className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Estimativa de Conversão</div>
                    <div className="text-[10px] text-green-400 font-bold">+45% a +120% de contatos</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#f5b30113] text-[#F5B301] flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Atendimento Garantido</div>
                    <div className="text-[10px] text-gray-400">Parceria local exclusiva Atlas</div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-950/10 border border-yellow-800/30 p-3 rounded-xl flex items-start gap-2">
                <span className="text-[#F5B301] text-xs">ℹ</span>
                <p className="text-[10px] text-gray-400 leading-tight">
                  Ao clicar no botão abaixo, geraremos um layout preliminar no Figma com base nessas configurações. O diagnóstico é 100% gratuito e sem compromisso.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-800">
        <div>
          {step > 1 && (
            <button
              onClick={handlePrev}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors py-2 px-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar
            </button>
          )}
        </div>
        <div>
          {step < 4 ? (
            <button
              onClick={handleNext}
              className="bg-[#F5B301] text-[#0B0F19] text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-1.5 hover:scale-105 transition-all"
            >
              Continuar
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-3 px-6 rounded-lg flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-green-950/25"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              Enviar Escopo pelo WhatsApp
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
