import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Laptop, CheckCircle, Flame, Star, Zap, Phone, Shield, ArrowRight, Layers, Eye } from 'lucide-react';

type ProjectType = 'marmoraria' | 'solar' | 'vidracaria';

interface MockupShowcaseProps {
  onSelectSegment?: (segment: string) => void;
  openContactModal?: (prefilledSubject?: string) => void;
}

export default function MockupShowcase({ onSelectSegment, openContactModal }: MockupShowcaseProps) {
  const [activeTab, setActiveTab] = useState<ProjectType>('marmoraria');
  const [solarBillValue, setSolarBillValue] = useState<number>(650);

  // Sync segment selection with main page state if callback provided
  useEffect(() => {
    if (onSelectSegment) {
      if (activeTab === 'marmoraria') onSelectSegment('Marmorarias');
      if (activeTab === 'solar') onSelectSegment('Energia Solar');
      if (activeTab === 'vidracaria') onSelectSegment('Vidraçarias');
    }
  }, [activeTab, onSelectSegment]);

  return (
    <div className="w-full">
      {/* Tab Selectors */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 md:mb-12">
        <button
          onClick={() => setActiveTab('marmoraria')}
          className={`px-5 py-3 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 flex items-center gap-2 border ${
            activeTab === 'marmoraria'
              ? 'bg-[#F5B301] text-[#0B0F19] border-[#F5B301] shadow-lg shadow-[#f5b3012a]'
              : 'bg-[#111827] text-[#9CA3AF] border-gray-800 hover:border-gray-700 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          Marmoraria de Luxo
        </button>
        <button
          onClick={() => setActiveTab('solar')}
          className={`px-5 py-3 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 flex items-center gap-2 border ${
            activeTab === 'solar'
              ? 'bg-[#F5B301] text-[#0B0F19] border-[#F5B301] shadow-lg shadow-[#f5b3012a]'
              : 'bg-[#111827] text-[#9CA3AF] border-gray-800 hover:border-gray-700 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          Energia Solar Fotovoltaica
        </button>
        <button
          onClick={() => setActiveTab('vidracaria')}
          className={`px-5 py-3 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 flex items-center gap-2 border ${
            activeTab === 'vidracaria'
              ? 'bg-[#F5B301] text-[#0B0F19] border-[#F5B301] shadow-lg shadow-[#f5b3012a]'
              : 'bg-[#111827] text-[#9CA3AF] border-gray-800 hover:border-gray-700 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          Vidraçaria & Fachadas
        </button>
      </div>

      {/* Main Mockup Container - Double Device Setup */}
      <div className="relative mx-auto max-w-4xl px-4 select-none lg:h-[480px] flex flex-col lg:flex-row items-center justify-center gap-10">
        
        {/* LAPTOP MOCKUP */}
        <div className="relative w-full max-w-[620px] aspect-[16/10] bg-[#111827] border-[10px] border-[#1e293b] rounded-t-2xl shadow-2xl overflow-hidden group">
          {/* Laptop Screen Top Camera Bar */}
          <div className="absolute top-0 inset-x-0 h-4 bg-[#1e293b] flex items-center justify-center z-20">
            <div className="w-1.5 h-1.5 rounded-full bg-[#030712]"></div>
          </div>

          {/* Laptop Screen Content Window */}
          <div className="absolute inset-0 pt-4 bg-[#0B0F19] overflow-y-auto no-scrollbar text-left font-sans select-none text-[10px] leading-relaxed">
            <AnimatePresence mode="wait">
              {activeTab === 'marmoraria' && (
                <motion.div
                  key="marmoraria-laptop"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 text-white"
                >
                  {/* Internal Site Header */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-800 mb-3">
                    <span className="font-serif font-semibold text-[11px] tracking-widest text-[#F5B301] flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5 text-[#F5B301]" />
                      IMPERIAL MARBLES
                    </span>
                    <div className="flex gap-2 text-gray-400 font-medium scale-90">
                      <span>Início</span>
                      <span className="text-[#F5B301]">Catálogo</span>
                      <span>Obras</span>
                      <span>Contato</span>
                    </div>
                  </div>

                  {/* Internal Site Hero */}
                  <div className="grid grid-cols-12 gap-3 mb-4 py-2 bg-gradient-to-r from-gray-900 to-[#111827] p-2.5 rounded-lg border border-gray-800">
                    <div className="col-span-7 flex flex-col justify-center">
                      <span className="text-[7px] text-[#F5B301] font-bold uppercase tracking-widest mb-1">Pedras Naturais & Exóticas</span>
                      <h4 className="text-sm font-bold font-serif leading-tight mb-1 text-white">
                        Sofisticação em Mármores, Granitos e Quartzitos
                      </h4>
                      <p className="text-gray-400 text-[8px] mb-2 leading-tight">
                        Transformamos sua obra residencial ou comercial em uma obra de arte com as pedras mais nobres do mundo.
                      </p>
                      <button 
                        onClick={() => openContactModal?.('Orçamento de Marmoraria')}
                        className="bg-[#F5B301] text-[#0B0F19] font-bold py-1 px-3.5 rounded self-start text-[8px] hover:scale-105 active:scale-95 transition-all"
                      >
                        Solicitar Orçamento
                      </button>
                    </div>
                    <div className="col-span-5 relative rounded-md overflow-hidden aspect-[4/3] bg-gray-800">
                      <img 
                        src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=300" 
                        alt="Marble rendering" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Internal Portfolio Grid */}
                  <h5 className="text-[9px] font-bold text-gray-300 mb-2 uppercase tracking-wider">Superfícies de Alto Padrão</h5>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: 'Quartzito Michelangelo', src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=150', tag: 'Luxo' },
                      { name: 'Mármore Calacatta Gold', src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=150', tag: 'Exclusivo' },
                      { name: 'Granito Preto Absoluto', src: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=150', tag: 'Clássico' }
                    ].map((stone, i) => (
                      <div key={i} className="bg-[#111827] border border-gray-800 rounded p-1 hover:border-[#F5B301] transition-colors">
                        <img src={stone.src} alt={stone.name} className="w-full aspect-[4/3] object-cover rounded-sm mb-1" referrerPolicy="no-referrer" />
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-white text-[7px] truncate max-w-[70px]">{stone.name}</span>
                          <span className="text-[5px] px-1 bg-[#f5b3011e] text-[#F5B301] rounded font-bold uppercase">{stone.tag}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Trust indicator bar */}
                  <div className="mt-3 flex items-center justify-between p-1.5 rounded bg-gray-900 text-gray-400 text-[6px]">
                    <span className="flex items-center gap-1 text-white">
                      <CheckCircle className="w-2 h-2 text-[#F5B301]" />
                      Corte Computadorizado CNC
                    </span>
                    <span className="flex items-center gap-1 text-white">
                      <CheckCircle className="w-2 h-2 text-[#F5B301]" />
                      Instalação Própria com Garantia
                    </span>
                    <span className="flex items-center gap-1 text-white">
                      <CheckCircle className="w-2 h-2 text-[#F5B301]" />
                      Atendimento a Arquitetos
                    </span>
                  </div>
                </motion.div>
              )}

              {activeTab === 'solar' && (
                <motion.div
                  key="solar-laptop"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 text-white"
                >
                  {/* Internal Site Header */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-800 mb-3">
                    <span className="font-semibold text-[11px] tracking-wide text-[#22c55e] flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-[#F5B301] fill-[#F5B301]" />
                      SOLARIS TECH
                    </span>
                    <div className="flex gap-2 text-gray-400 font-medium scale-90">
                      <span>Simulador</span>
                      <span className="text-[#22c55e]">Vantagens</span>
                      <span>Tecnologia</span>
                    </div>
                  </div>

                  {/* Internal Solar Hero with live simulator! */}
                  <div className="grid grid-cols-12 gap-3 mb-4 p-2.5 rounded-lg border border-green-950 bg-gradient-to-br from-[#0c2a1a] to-[#0B0F19]">
                    <div className="col-span-6 flex flex-col justify-center">
                      <span className="text-[7px] text-[#22c55e] font-bold uppercase tracking-widest mb-1">Economize até 95%</span>
                      <h4 className="text-sm font-bold leading-tight mb-1 text-white">
                        Sua Conta de Luz Reduzida ao Mínimo Garantido
                      </h4>
                      <p className="text-gray-300 text-[8px] mb-2 leading-tight">
                        Invista em energia fotovoltaica de alta tecnologia. Proteja sua empresa contra o aumento constante das tarifas de energia.
                      </p>
                      <button 
                        onClick={() => openContactModal?.('Orçamento de Energia Solar')}
                        className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold py-1 px-3.5 rounded self-start text-[8px] hover:scale-105 active:scale-95 transition-all"
                      >
                        Fazer Simulação Completa
                      </button>
                    </div>
                    
                    {/* Live simulation widget inside the mockup screen */}
                    <div className="col-span-6 bg-[#111827] border border-green-900 rounded p-2 text-[8px] flex flex-col justify-between">
                      <div className="mb-1 font-bold text-center text-green-400 text-[9px] border-b border-gray-800 pb-1">
                        Simulador de Conta Real
                      </div>
                      <div className="flex justify-between text-gray-400 text-[7px] mb-1">
                        <span>Sua conta mensal:</span>
                        <span className="text-white font-bold">R$ {solarBillValue}</span>
                      </div>
                      
                      {/* Range slider */}
                      <input 
                        type="range" 
                        min="200" 
                        max="3000" 
                        step="50"
                        value={solarBillValue} 
                        onChange={(e) => setSolarBillValue(Number(e.target.value))}
                        className="w-full accent-[#22c55e] h-1 bg-gray-800 rounded-lg cursor-pointer mb-2"
                      />

                      <div className="bg-green-950/40 p-1 rounded border border-green-900/50 flex flex-col items-center">
                        <span className="text-gray-400 text-[6px]">Economia anual estimada:</span>
                        <span className="text-green-400 font-black text-xs">R$ {Math.round(solarBillValue * 0.95 * 12).toLocaleString('pt-BR')}</span>
                        <span className="text-[5px] text-gray-500">Payback estimado: {(solarBillValue > 1000 ? 2.8 : 3.5)} anos</span>
                      </div>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-4 gap-2 text-center text-[7px]">
                    {[
                      { t: 'Painéis Tier-1', d: 'Garantia de 25 anos' },
                      { t: 'Instalação Ágil', d: 'Engenheiros próprios' },
                      { t: 'Financiamento', d: 'Até 100% parcelado' },
                      { t: 'App de Monitoramento', d: 'Acompanhe pelo celular' }
                    ].map((badge, idx) => (
                      <div key={idx} className="bg-gray-900 p-1 rounded border border-gray-800">
                        <div className="font-bold text-white leading-tight">{badge.t}</div>
                        <div className="text-gray-500 text-[5.5px]">{badge.d}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'vidracaria' && (
                <motion.div
                  key="vidracaria-laptop"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 text-white"
                >
                  {/* Internal Site Header */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-800 mb-3">
                    <span className="font-semibold text-[11px] tracking-wider text-[#38bdf8] flex items-center gap-1">
                      <Shield className="w-3 h-3 text-[#38bdf8]" />
                      CRISTAL GLASS
                    </span>
                    <div className="flex gap-2 text-gray-400 font-medium scale-90">
                      <span>Projetos</span>
                      <span className="text-[#38bdf8]">Fachadas</span>
                      <span>Orçamento</span>
                    </div>
                  </div>

                  {/* Internal Vidracaria Hero */}
                  <div className="grid grid-cols-12 gap-3 mb-4 p-2.5 rounded-lg border border-sky-950 bg-gradient-to-r from-sky-950/30 to-[#0B0F19]">
                    <div className="col-span-7 flex flex-col justify-center">
                      <span className="text-[7px] text-[#38bdf8] font-bold uppercase tracking-widest mb-1">Tecnologia em Esquadrias & Vidros</span>
                      <h4 className="text-sm font-bold leading-tight mb-1 text-white">
                        Sua Casa Integrada com a Natureza e Segurança
                      </h4>
                      <p className="text-gray-300 text-[8px] mb-2 leading-tight">
                        Especialistas em fechamento de sacadas retráteis, cortinas de vidro, guarda-corpos e divisórias sob medida de luxo.
                      </p>
                      <button 
                        onClick={() => openContactModal?.('Orçamento de Vidraçaria')}
                        className="bg-[#38bdf8] text-gray-950 font-bold py-1 px-3.5 rounded self-start text-[8px] hover:scale-105 active:scale-95 transition-all"
                      >
                        Falar com Engenheiro
                      </button>
                    </div>
                    <div className="col-span-5 relative rounded overflow-hidden aspect-[4/3] bg-gray-800">
                      <img 
                        src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=300" 
                        alt="Glass facades" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Services / Catalog items */}
                  <h5 className="text-[9px] font-bold text-gray-400 mb-2">Linhas de Vidros Premium</h5>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { title: 'Fechamento de Sacada', spec: 'Proteção Acústica e Térmica' },
                      { title: 'Guarda-Corpos de Inox', spec: 'Segurança Total Normatizada' },
                      { title: 'Espelhos com Led', spec: 'Corte Lapidado Personalizado' }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-sky-950/20 border border-sky-900/30 rounded p-1.5 flex flex-col justify-between">
                        <div className="font-bold text-[#38bdf8] text-[7.5px] leading-tight mb-0.5">{item.title}</div>
                        <p className="text-gray-400 text-[6px] leading-tight">{item.spec}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Metal Bottom bar with reflection */}
          <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-r from-gray-700 via-gray-950 to-gray-700 flex items-center justify-between px-4 z-20">
            <span className="text-[6px] text-gray-400 font-mono scale-90">ATLAS DIGITAL CLIENT DEMO</span>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5B301]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            </div>
          </div>
        </div>

        {/* LAPTOP KEYBOARD BASE - Adds amazing depth realism */}
        <div className="hidden md:block absolute bottom-[-14px] left-[5%] right-[25%] lg:left-[5%] lg:right-[35%] h-[14px] bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#020617] border-t border-slate-500 rounded-b-xl shadow-xl z-10 max-w-[560px]">
          {/* Centered screen opening indentation */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-2 bg-[#020617] rounded-b-md"></div>
        </div>

        {/* SMARTPHONE MOCKUP - Overlapping in front of laptop */}
        <div className="relative lg:absolute lg:right-[5%] lg:bottom-[-20px] w-full max-w-[200px] aspect-[9/19] bg-[#090d16] border-[8px] border-[#1e293b] rounded-[32px] shadow-2xl overflow-hidden z-20 flex flex-col justify-between">
          
          {/* Dynamic Island / Speaker notch */}
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-16 h-3.5 bg-black rounded-full z-30 flex items-center justify-around px-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-950"></div>
            <div className="w-5 h-0.5 rounded bg-zinc-900"></div>
          </div>

          {/* Screen content */}
          <div className="absolute inset-0 pt-6 px-2 bg-[#0B0F19] overflow-y-auto no-scrollbar text-left text-white select-none text-[8px] leading-normal flex flex-col justify-between pb-3">
            <AnimatePresence mode="wait">
              {activeTab === 'marmoraria' && (
                <motion.div
                  key="marmoraria-phone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-center pb-1 border-b border-gray-800 mb-2 text-[7px]">
                      <span className="font-bold text-[#F5B301]">IMPERIAL MARBLES</span>
                      <Phone className="w-2 h-2 text-green-500" />
                    </div>
                    {/* Main banner block */}
                    <div className="bg-gray-900 border border-gray-800 rounded p-1.5 mb-2 text-center">
                      <h6 className="font-bold text-[9px] text-[#F5B301] leading-tight mb-0.5">Bancadas de Quartzito</h6>
                      <p className="text-gray-400 text-[6.5px] leading-tight">O mármore que sua cozinha merece.</p>
                      <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=150" alt="kitchen" className="w-full aspect-[16/9] object-cover rounded mt-1" referrerPolicy="no-referrer" />
                    </div>
                    {/* Floating conversion cards */}
                    <div className="space-y-1">
                      <div className="bg-slate-900/80 p-1 rounded border border-gray-800 flex items-center gap-1">
                        <CheckCircle className="w-2 h-2 text-green-500 shrink-0" />
                        <span className="text-[6.5px]">Acabamento Italiano Premium</span>
                      </div>
                      <div className="bg-slate-900/80 p-1 rounded border border-gray-800 flex items-center gap-1">
                        <CheckCircle className="w-2 h-2 text-green-500 shrink-0" />
                        <span className="text-[6.5px]">Entrega Garantida em Contrato</span>
                      </div>
                    </div>
                  </div>

                  {/* Immediate CTA on Mobile */}
                  <a 
                    href="https://wa.me/5511999999999?text=Ol%C3%A1!%20Gostaria%20de%20um%20or%C3%A7amento%20de%20Marmoraria."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 bg-green-600 text-white font-bold py-1.5 px-2 rounded-full flex items-center justify-center gap-1 text-[8px] hover:bg-green-500 transition-colors"
                  >
                    <MessageSquareShare className="w-2.5 h-2.5" />
                    Chamar no WhatsApp
                  </a>
                </motion.div>
              )}

              {activeTab === 'solar' && (
                <motion.div
                  key="solar-phone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-center pb-1 border-b border-gray-800 mb-2 text-[7px]">
                      <span className="font-bold text-[#22c55e]">SOLARIS TECH</span>
                      <Zap className="w-2.5 h-2.5 text-[#F5B301] fill-[#F5B301]" />
                    </div>
                    {/* Live indicator block */}
                    <div className="bg-gradient-to-br from-[#0c2a1a] to-gray-950 border border-green-900 rounded p-1.5 mb-2 text-center">
                      <span className="inline-block bg-green-500/10 text-green-400 text-[5px] font-bold px-1 py-0.5 rounded mb-1">PROJETO INTELIGENTE</span>
                      <h6 className="font-bold text-[8.5px] leading-tight mb-0.5">Simule Sua Economia</h6>
                      <p className="text-gray-300 text-[6.5px] leading-tight">Valor da conta de luz mensal:</p>
                      <div className="text-green-400 text-[14px] font-black my-0.5">R$ {solarBillValue}</div>
                      <div className="text-[6px] text-gray-400">Gera economia anual de: <span className="text-white font-bold">R$ {Math.round(solarBillValue * 0.95 * 12).toLocaleString('pt-BR')}</span></div>
                    </div>
                    {/* Benefits bullet */}
                    <div className="space-y-1">
                      <div className="bg-green-950/20 p-1 rounded border border-green-900/30 flex items-center gap-1">
                        <Flame className="w-2 h-2 text-orange-500 shrink-0" />
                        <span className="text-[6px] text-gray-300">Rápido retorno (payback)</span>
                      </div>
                      <div className="bg-green-950/20 p-1 rounded border border-green-900/30 flex items-center gap-1">
                        <Star className="w-2 h-2 text-[#F5B301] fill-[#F5B301] shrink-0" />
                        <span className="text-[6px] text-gray-300">Equipamentos premium Tier-1</span>
                      </div>
                    </div>
                  </div>

                  <a 
                    href="https://wa.me/5511999999999?text=Ol%C3%A1!%20Gostaria%20de%20fazer%20uma%20simula%C3%A7%C3%A3o%20de%20energia%20solar."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 bg-green-600 text-white font-bold py-1.5 px-2 rounded-full flex items-center justify-center gap-1 text-[8px] hover:bg-green-500 transition-colors"
                  >
                    <MessageSquareShare className="w-2.5 h-2.5" />
                    Simular no WhatsApp
                  </a>
                </motion.div>
              )}

              {activeTab === 'vidracaria' && (
                <motion.div
                  key="vidracaria-phone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-center pb-1 border-b border-gray-800 mb-2 text-[7px]">
                      <span className="font-bold text-sky-400">CRISTAL GLASS</span>
                      <Shield className="w-2 h-2 text-sky-400" />
                    </div>
                    {/* Photo preview block */}
                    <div className="bg-gray-900 border border-sky-950/40 rounded p-1.5 mb-2 text-center">
                      <h6 className="font-bold text-[8.5px] text-sky-400 leading-tight mb-0.5">Fechamento de Sacadas</h6>
                      <p className="text-gray-400 text-[6.5px] leading-tight">Sofisticação e segurança total.</p>
                      <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=150" alt="glass" className="w-full aspect-[16/9] object-cover rounded mt-1" referrerPolicy="no-referrer" />
                    </div>
                    {/* Quality standards */}
                    <div className="bg-sky-950/20 p-1 border border-sky-900/40 rounded flex items-center justify-around text-center text-[5.5px]">
                      <div>
                        <div className="font-bold text-white">Vidro Temperado</div>
                        <div className="text-gray-400">Mais resistente</div>
                      </div>
                      <div className="w-px h-4 bg-sky-900/40"></div>
                      <div>
                        <div className="font-bold text-white">Inox 304</div>
                        <div className="text-gray-400">Não enferruja</div>
                      </div>
                    </div>
                  </div>

                  <a 
                    href="https://wa.me/5511999999999?text=Ol%C3%A1!%20Gostaria%20de%20um%20or%C3%A7amento%20de%20Vidra%C3%A7aria."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 bg-green-600 text-white font-bold py-1.5 px-2 rounded-full flex items-center justify-center gap-1 text-[8px] hover:bg-green-500 transition-colors"
                  >
                    <MessageSquareShare className="w-2.5 h-2.5" />
                    Chamar no WhatsApp
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Smartphone Bottom Bar */}
          <div className="h-4 bg-zinc-950 flex items-center justify-center pb-1">
            <div className="w-16 h-1 rounded bg-zinc-800"></div>
          </div>
        </div>

      </div>

      {/* Interactive Feature Tags underneath mockup */}
      <div className="flex flex-wrap justify-center gap-3 md:gap-6 mt-16 text-gray-400 text-xs md:text-sm">
        <span className="flex items-center gap-1.5 bg-slate-900/60 px-4 py-2 rounded-full border border-gray-800 text-white">
          <span className="w-2 h-2 rounded-full bg-[#F5B301] animate-pulse"></span>
          ✓ Site Ultra Rápido (PageSpeed 95+)
        </span>
        <span className="flex items-center gap-1.5 bg-slate-900/60 px-4 py-2 rounded-full border border-gray-800 text-white">
          <span className="w-2 h-2 rounded-full bg-[#F5B301] animate-pulse"></span>
          ✓ Otimizado para o Google (SEO Local)
        </span>
        <span className="flex items-center gap-1.5 bg-slate-900/60 px-4 py-2 rounded-full border border-gray-800 text-white">
          <span className="w-2 h-2 rounded-full bg-[#F5B301] animate-pulse"></span>
          ✓ WhatsApp Inteligente Integrado
        </span>
        <span className="flex items-center gap-1.5 bg-slate-900/60 px-4 py-2 rounded-full border border-gray-800 text-white">
          <span className="w-2 h-2 rounded-full bg-[#F5B301] animate-pulse"></span>
          ✓ 100% Responsivo (Mobile First)
        </span>
      </div>
    </div>
  );
}

// Minimal placeholder so code builds if message-square-share is missing
function MessageSquareShare({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      fill="none" 
      height="24" 
      stroke="currentColor" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2" 
      viewBox="0 0 24 24" 
      width="24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <path d="M10 11 8 9l2-2"/>
      <path d="M8 9h6a3 3 0 0 1 3 3v1"/>
    </svg>
  );
}
