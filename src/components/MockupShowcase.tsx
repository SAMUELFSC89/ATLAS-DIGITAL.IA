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
      {/* Tab Selectors - Elevated Executive Minimal design */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        <button
          onClick={() => setActiveTab('marmoraria')}
          className={`px-6 py-3 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 flex items-center gap-2 border ${
            activeTab === 'marmoraria'
              ? 'bg-[#E2B755] text-[#0B0B0E] border-[#E2B755] shadow-lg shadow-[#e2b75520]'
              : 'bg-[#121214] text-[#9CA3AF] border-zinc-800 hover:border-zinc-700 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Marmoraria de Luxo
        </button>
        <button
          onClick={() => setActiveTab('solar')}
          className={`px-6 py-3 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 flex items-center gap-2 border ${
            activeTab === 'solar'
              ? 'bg-[#E2B755] text-[#0B0B0E] border-[#E2B755] shadow-lg shadow-[#e2b75520]'
              : 'bg-[#121214] text-[#9CA3AF] border-zinc-800 hover:border-zinc-700 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Energia Solar
        </button>
        <button
          onClick={() => setActiveTab('vidracaria')}
          className={`px-6 py-3 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 flex items-center gap-2 border ${
            activeTab === 'vidracaria'
              ? 'bg-[#E2B755] text-[#0B0B0E] border-[#E2B755] shadow-lg shadow-[#e2b75520]'
              : 'bg-[#121214] text-[#9CA3AF] border-zinc-800 hover:border-zinc-700 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Vidraçaria & Fachadas
        </button>
      </div>

      {/* Main Mockup Container - Realistic MacBook & iPhone on a blurred modern office desk background */}
      <div className="relative mx-auto max-w-[500px] md:max-w-none px-4 select-none flex flex-col md:block items-center pb-12 md:pb-16 md:h-[450px] lg:h-[490px]">
        
        {/* Modern executive studio backdrop for natural depth */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-30 z-0 pointer-events-none hidden md:block border border-zinc-800/50">
          <img
            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200"
            alt="Corporate Desk Workspace"
            className="w-full h-full object-cover filter blur-[3px]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0E] via-[#0B0B0E]/70 to-[#0B0B0E]" />
        </div>

        {/* LAPTOP CONTAINER (Realistic MacBook Pro Space Gray) */}
        <div className="relative w-full max-w-[460px] lg:max-w-[510px] md:absolute md:left-4 md:top-6 z-10 mb-8 md:mb-0 group/laptop">
          
          {/* Ambient Ground Shadow to anchor device physically */}
          <div className="absolute bottom-[-15px] inset-x-[-4%] h-5 bg-black/90 blur-xl rounded-full pointer-events-none z-0 hidden md:block" />
          
          {/* MACBOOK SCREEN FRAME with outer aluminum backing */}
          <div className="relative w-full aspect-[16/10] bg-neutral-950 p-[2.5px] bg-gradient-to-b from-neutral-600 via-neutral-800 to-neutral-900 rounded-t-[20px] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95)] overflow-hidden">
            
            {/* Screen Bezel (Obsidian Matte Black) */}
            <div className="relative w-full h-full bg-black rounded-t-[18px] border-[10px] border-[#08080a] overflow-hidden">
              
              {/* Rubber gasket seal ring highlight */}
              <div className="absolute inset-0 border border-neutral-900/30 rounded-t-[8px] pointer-events-none z-30" />
              
              {/* Anti-reflective Glass Glare Layers */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.012] to-white/[0.045] pointer-events-none z-20" />
              <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-bl from-white/[0.015] to-transparent pointer-events-none z-20 transform -skew-x-12 origin-top-right transition-transform duration-700 group-hover/laptop:translate-x-6" />
              
              {/* MacBook Pro Notch with dual-sensor FaceTime camera assembly */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-[17px] bg-[#08080a] rounded-b-lg z-30 flex items-center justify-between px-3">
                {/* Ambient Light Sensor */}
                <div className="w-1 h-1 rounded-full bg-[#1c1d1e] border border-neutral-900" />
                {/* 1080p FaceTime HD Camera Lens with Multi-Layer coating tint */}
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-950 flex items-center justify-center relative border border-neutral-850">
                  <div className="w-1 h-1 rounded-full bg-[#0a1829]" />
                  <div className="w-0.5 h-0.5 rounded-full bg-teal-400 absolute top-[20%] left-[20%] opacity-80" />
                </div>
                {/* Green LED indicator (Inactive / Subtly dark) */}
                <div className="w-0.5 h-0.5 rounded-full bg-emerald-500/10" />
              </div>

              {/* Laptop Screen Content Area */}
              <div className="absolute inset-0 pt-4 bg-[#0B0B0E] overflow-y-auto no-scrollbar text-left font-sans select-none text-[10px] leading-relaxed">
                <AnimatePresence mode="wait">
                  {activeTab === 'marmoraria' && (
                    <motion.div
                      key="marmoraria-laptop"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-3.5 text-white"
                    >
                      {/* Internal Site Header */}
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80 mb-3.5">
                        <span className="font-serif font-semibold text-[11px] tracking-widest text-[#E2B755] flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5 text-[#E2B755]" />
                          IMPERIAL MARBLES
                        </span>
                        <div className="flex gap-2.5 text-zinc-400 font-medium scale-90">
                          <span>Início</span>
                          <span className="text-[#E2B755]">Catálogo</span>
                          <span>Obras</span>
                          <span>Contato</span>
                        </div>
                      </div>

                      {/* Internal Site Hero */}
                      <div className="grid grid-cols-12 gap-3 mb-4 py-3 bg-[#121214] p-3 rounded-lg border border-zinc-800">
                        <div className="col-span-7 flex flex-col justify-center">
                          <span className="text-[6px] text-[#E2B755] font-bold uppercase tracking-widest mb-1">Pedras Naturais & Exóticas</span>
                          <h4 className="text-xs font-bold font-serif leading-snug mb-1.5 text-white">
                            A Arte da Sofisticação em Mármores e Quartzitos
                          </h4>
                          <p className="text-zinc-400 text-[8px] mb-2.5 leading-tight">
                            Curadoria exclusiva de revestimentos de luxo para arquitetura de alto padrão. Projetos personalizados sob medida.
                          </p>
                          <button 
                            onClick={() => openContactModal?.('Orçamento de Marmoraria')}
                            className="bg-[#E2B755] text-zinc-950 font-bold py-1 px-3 rounded self-start text-[8px] hover:scale-105 active:scale-95 transition-all"
                          >
                            Solicitar Diagnóstico
                          </button>
                        </div>
                        <div className="col-span-5 relative rounded overflow-hidden aspect-[4/3] bg-zinc-900 border border-zinc-800">
                          <img 
                            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=350" 
                            alt="Marble interior design" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>

                      {/* Internal Portfolio Grid */}
                      <h5 className="text-[8px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">Coleção Exclusiva</h5>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { name: 'Quartzito Michelangelo', src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=150', tag: 'Elite' },
                          { name: 'Calacatta Oro', src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=150', tag: 'Importado' },
                          { name: 'Preto Absoluto Escovado', src: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=150', tag: 'Nacional' }
                        ].map((stone, i) => (
                          <div key={i} className="bg-[#121214] border border-zinc-800 rounded-lg p-1 hover:border-[#E2B755] transition-all">
                            <img src={stone.src} alt={stone.name} className="w-full aspect-[4/3] object-cover rounded mb-1" referrerPolicy="no-referrer" />
                            <div className="flex justify-between items-center px-0.5">
                              <span className="font-semibold text-white text-[7px] truncate max-w-[65px]">{stone.name}</span>
                              <span className="text-[4.5px] px-1 py-0.5 bg-amber-500/10 text-[#E2B755] rounded font-bold uppercase">{stone.tag}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Quality indicators bar */}
                      <div className="mt-4 flex items-center justify-between p-2 rounded bg-[#121214] text-zinc-400 text-[6px] border border-zinc-800">
                        <span className="flex items-center gap-1 text-white font-medium">
                          <CheckCircle className="w-2.5 h-2.5 text-[#E2B755]" />
                          Corte Robotizado CNC de Alta Precisão
                        </span>
                        <span className="flex items-center gap-1 text-white font-medium">
                          <CheckCircle className="w-2.5 h-2.5 text-[#E2B755]" />
                          Instalação Técnica Credenciada
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
                      className="p-3.5 text-white"
                    >
                      {/* Internal Site Header */}
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80 mb-3.5">
                        <span className="font-semibold text-[11px] tracking-wider text-[#E2B755] flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-[#E2B755] fill-[#E2B755]/10" />
                          HELIOS ENG
                        </span>
                        <div className="flex gap-2.5 text-zinc-400 font-medium scale-90">
                          <span>Tecnologia</span>
                          <span className="text-[#E2B755]">Economia</span>
                          <span>Empresarial</span>
                        </div>
                      </div>

                      {/* Internal Solar Hero with live simulator */}
                      <div className="grid grid-cols-12 gap-3 mb-4 p-3 rounded-lg border border-emerald-950 bg-gradient-to-br from-[#0c2317] to-[#0A0A0C]">
                        <div className="col-span-6 flex flex-col justify-center">
                          <span className="text-[6px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Garantia de Performance</span>
                          <h4 className="text-xs font-bold leading-snug mb-1.5 text-white">
                            Sua Empresa Livre do Aumento de Tarifas
                          </h4>
                          <p className="text-zinc-300 text-[8px] mb-2 leading-tight">
                            Engenharia fotovoltaica de alta fidelidade para indústrias e corporações de alto consumo.
                          </p>
                          <button 
                            onClick={() => openContactModal?.('Orçamento de Energia Solar')}
                            className="bg-[#E2B755] text-zinc-950 font-bold py-1 px-3 rounded self-start text-[8px] hover:scale-105 active:scale-95 transition-all"
                          >
                            Simular Payback
                          </button>
                        </div>
                        
                        {/* Live simulation widget */}
                        <div className="col-span-6 bg-[#121214] border border-zinc-800 rounded p-2 text-[8px] flex flex-col justify-between">
                          <div className="mb-1 font-bold text-center text-[#E2B755] text-[8.5px] border-b border-zinc-800 pb-1">
                            Consumo Mensal Comercial
                          </div>
                          <div className="flex justify-between text-zinc-400 text-[6.5px] mb-1">
                            <span>Valor da fatura:</span>
                            <span className="text-white font-bold">R$ {solarBillValue}</span>
                          </div>
                          
                          <input 
                            type="range" 
                            min="200" 
                            max="3000" 
                            step="50"
                            value={solarBillValue} 
                            onChange={(e) => setSolarBillValue(Number(e.target.value))}
                            className="w-full accent-[#E2B755] h-1 bg-zinc-800 rounded-lg cursor-pointer mb-2"
                          />

                          <div className="bg-emerald-950/20 p-1.5 rounded border border-emerald-900/30 flex flex-col items-center">
                            <span className="text-zinc-400 text-[6px]">Economia anual garantida:</span>
                            <span className="text-emerald-400 font-extrabold text-xs">R$ {Math.round(solarBillValue * 0.95 * 12).toLocaleString('pt-BR')}</span>
                            <span className="text-[5px] text-zinc-500">Tempo médio de retorno: 3 anos</span>
                          </div>
                        </div>
                      </div>

                      {/* Trust Badges */}
                      <div className="grid grid-cols-4 gap-2 text-center text-[7px]">
                        {[
                          { t: 'Módulos Tier-1', d: 'Garantia 25 Anos' },
                          { t: 'Engenharia Própria', d: 'Sem Terceirização' },
                          { t: 'Homologação Rápida', d: 'Concessionária' },
                          { t: 'Monitoramento IoT', d: 'Controle em tempo real' }
                        ].map((badge, idx) => (
                          <div key={idx} className="bg-[#121214] p-1.5 rounded-lg border border-zinc-800">
                            <div className="font-bold text-white leading-tight">{badge.t}</div>
                            <div className="text-zinc-500 text-[5px] mt-0.5">{badge.d}</div>
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
                      className="p-3.5 text-white"
                    >
                      {/* Internal Site Header */}
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80 mb-3.5">
                        <span className="font-semibold text-[11px] tracking-widest text-[#E2B755] flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-[#E2B755]" />
                          CRISTAL GLASS
                        </span>
                        <div className="flex gap-2.5 text-zinc-400 font-medium scale-90">
                          <span>Soluções</span>
                          <span className="text-[#E2B755]">Projetos</span>
                          <span>Orçamento</span>
                        </div>
                      </div>

                      {/* Internal Vidracaria Hero */}
                      <div className="grid grid-cols-12 gap-3 mb-4 p-3 rounded-lg border border-zinc-850 bg-gradient-to-r from-zinc-900 to-[#0A0A0C]">
                        <div className="col-span-7 flex flex-col justify-center">
                          <span className="text-[6px] text-[#E2B755] font-bold uppercase tracking-widest mb-1">Estruturas em Vidro & Alumínio</span>
                          <h4 className="text-xs font-bold leading-snug mb-1.5 text-white">
                            Sistemas de Fachadas e Sacadas Retráteis
                          </h4>
                          <p className="text-zinc-400 text-[8px] mb-2.5 leading-tight">
                            Especialistas em fechamento de sacadas minimalistas, guarda-corpos autoportantes e esquadrias de alto padrão.
                          </p>
                          <button 
                            onClick={() => openContactModal?.('Orçamento de Vidraçaria')}
                            className="bg-[#E2B755] text-zinc-950 font-bold py-1 px-3 rounded self-start text-[8px] hover:scale-105 active:scale-95 transition-all"
                          >
                            Contatar Engenheiro
                          </button>
                        </div>
                        <div className="col-span-5 relative rounded overflow-hidden aspect-[4/3] bg-zinc-900 border border-zinc-800">
                          <img 
                            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=350" 
                            alt="Modern luxury facade glass" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>

                      {/* Services Grid */}
                      <h5 className="text-[8px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">Sistemas Homologados</h5>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { title: 'Fechamento Retrátil', spec: 'Proteção Acústica Premium' },
                          { title: 'Guarda-Corpos Autoportantes', spec: 'Segurança Normatizada ABNT' },
                          { title: 'Esquadrias Linha Gold', spec: 'Vedação Estanque e Térmica' }
                        ].map((item, idx) => (
                          <div key={idx} className="bg-[#121214] border border-zinc-800 rounded-lg p-2 flex flex-col justify-between">
                            <div className="font-bold text-[#E2B755] text-[7px] leading-tight mb-1">{item.title}</div>
                            <p className="text-zinc-500 text-[5.5px] leading-snug">{item.spec}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Display Bottom Bezel Board (Subtle Aluminum Label Block) */}
              <div className="absolute bottom-0 inset-x-0 h-4.5 bg-black flex items-center justify-between px-4.5 z-20 border-t border-neutral-900">
                <span className="text-[5px] text-neutral-500 font-mono tracking-widest scale-95 uppercase font-medium">Atlas Core System</span>
                <div className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-850"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E2B755]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-800"></span>
                </div>
              </div>
            </div>
          </div>

          {/* REALISTIC MACBOOK PRO LOWER CHASSIS & BASE */}
          {/* Formed with 3D metal wedge design, anodized space gray polish, and display opening notch */}
          <div className="hidden md:block absolute bottom-[-11px] left-[-3%] right-[-3%] h-[12px] bg-gradient-to-b from-[#3a3b3e] via-[#1c1d1f] to-[#0c0d0e] border-t border-zinc-500/35 rounded-b-xl shadow-[0_20px_40px_rgba(0,0,0,0.85)] z-10">
            {/* Polished front bevel highlight */}
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-white/15"></div>
            {/* Center thumb recess (scoop for opening laptop) */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-[3.5px] bg-black/60 rounded-b-md shadow-inner"></div>
            {/* Soft display rubber spacers */}
            <div className="absolute top-0 left-[8%] w-1.5 h-[0.5px] bg-neutral-950 rounded-b"></div>
            <div className="absolute top-0 right-[8%] w-1.5 h-[0.5px] bg-neutral-950 rounded-b"></div>
          </div>
        </div>

        {/* SMARTPHONE CONTAINER (Ultra-Realistic iPhone 15 Pro Titanium Black) */}
        <div className="relative mt-4 md:mt-0 md:absolute md:right-4 md:bottom-2 lg:right-[-4px] lg:bottom-4 w-full max-w-[155px] lg:max-w-[185px] aspect-[9/19.2] rounded-[38px] p-[2.5px] bg-gradient-to-tr from-[#3a3a3f] via-[#1c1c1f] to-[#515157] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] z-20 flex flex-col justify-between shrink-0 hover:scale-[1.04] transition-all duration-500 group/phone">
          
          {/* Physical Side Buttons to add realism */}
          {/* Action Button (Left side) */}
          <div className="absolute left-[-2.5px] top-[14%] w-[2.5px] h-4.5 bg-gradient-to-r from-zinc-600 to-[#1c1c1f] rounded-l border-y border-zinc-600/30 shadow pointer-events-none" />
          {/* Volume Up Button (Left side) */}
          <div className="absolute left-[-2.5px] top-[21%] w-[2.5px] h-8 bg-gradient-to-r from-zinc-600 to-[#1c1c1f] rounded-l border-y border-zinc-600/30 shadow pointer-events-none" />
          {/* Volume Down Button (Left side) */}
          <div className="absolute left-[-2.5px] top-[28%] w-[2.5px] h-8 bg-gradient-to-r from-zinc-600 to-[#1c1c1f] rounded-l border-y border-zinc-600/30 shadow pointer-events-none" />
          {/* Power Button (Right side) */}
          <div className="absolute right-[-2.5px] top-[23%] w-[2.5px] h-14 bg-gradient-to-l from-zinc-600 to-[#1c1c1f] rounded-r border-y border-zinc-600/30 shadow pointer-events-none" />

          {/* Screen Inner Bezel (Extremely thin premium uniform borders) */}
          <div className="relative w-full h-full bg-black rounded-[36px] p-[3px] border-[3.5px] border-neutral-950 overflow-hidden flex flex-col justify-between">
            
            {/* Specular glass reflection layer */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.012] to-white/[0.045] pointer-events-none z-20" />
            <div className="absolute -inset-y-1/2 left-[-20%] w-[140%] bg-gradient-to-r from-transparent via-white/[0.008] to-transparent pointer-events-none z-20 transform rotate-12 transition-transform duration-700 group-hover/phone:translate-x-8" />
            
            {/* iPhone 15 Pro Dynamic Island Assembly with dual TrueDepth camera lenses */}
            <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 w-16 h-4.5 bg-black rounded-full z-30 flex items-center justify-between px-3">
              {/* Proximity / Light Sensor matte region */}
              <div className="w-1.5 h-1.5 rounded-full bg-[#07070a]" />
              {/* Front Camera Lens with dynamic multi-layer reflection coating */}
              <div className="w-2 h-2 rounded-full bg-neutral-950 flex items-center justify-center relative border border-neutral-900/60">
                <div className="w-1 h-1 rounded-full bg-[#0a1222]" />
                <div className="w-0.5 h-0.5 rounded-full bg-[#bf5af2]/40 absolute top-[20%] left-[20%] shadow-[inset_0_0.5px_1px_rgba(255,255,255,0.1)]" />
              </div>
            </div>

            {/* iPhone screen content */}
            <div className="absolute inset-0 pt-7 px-3 bg-[#0B0B0E] overflow-y-auto no-scrollbar text-left text-white select-none text-[8px] leading-normal flex flex-col justify-between pb-3">
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
                      <div className="flex justify-between items-center pb-1 border-b border-zinc-800 mb-2.5 text-[7px]">
                        <span className="font-bold text-[#E2B755]">IMPERIAL MARBLES</span>
                        <Phone className="w-2.5 h-2.5 text-[#E2B755]" />
                      </div>
                      {/* Main photo block */}
                      <div className="bg-[#121214] border border-zinc-800 rounded-lg p-2 mb-2 text-center">
                        <h6 className="font-bold text-[8px] text-[#E2B755] leading-tight mb-0.5">Bancadas de Quartzito</h6>
                        <p className="text-zinc-400 text-[6px] leading-tight">Revestimentos de Luxo</p>
                        <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=150" alt="kitchen marble" className="w-full aspect-[16/9] object-cover rounded mt-1.5 border border-zinc-800" referrerPolicy="no-referrer" />
                      </div>
                      {/* Benefits stack */}
                      <div className="space-y-1">
                        <div className="bg-[#121214]/80 p-1.5 rounded-md border border-zinc-800 flex items-center gap-1.5">
                          <CheckCircle className="w-2 h-2 text-[#E2B755] shrink-0" />
                          <span className="text-[6px] text-zinc-300 font-medium">Acabamento Italiano Fino</span>
                        </div>
                        <div className="bg-[#121214]/80 p-1.5 rounded-md border border-zinc-800 flex items-center gap-1.5">
                          <CheckCircle className="w-2 h-2 text-[#E2B755] shrink-0" />
                          <span className="text-[6px] text-zinc-300 font-medium">Entrega em Contrato</span>
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp contact CTA inside screen */}
                    <a 
                      href="https://wa.me/5551994578544?text=Ol%C3%A1!%20Gostaria%20de%20um%20or%C3%A7amento%20de%20Marmoraria."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 bg-[#E2B755] text-zinc-950 font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 text-[7px] hover:bg-[#c5a25d] transition-colors"
                    >
                      Falar com Consultor
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
                      <div className="flex justify-between items-center pb-1 border-b border-zinc-800 mb-2.5 text-[7px]">
                        <span className="font-bold text-[#E2B755]">HELIOS ENG</span>
                        <Zap className="w-2 h-2 text-[#E2B755]" />
                      </div>
                      {/* Simulator block */}
                      <div className="bg-gradient-to-br from-[#0c2317] to-zinc-950 border border-emerald-900/30 rounded-lg p-2 mb-2 text-center">
                        <span className="inline-block bg-emerald-500/10 text-emerald-400 text-[4.5px] font-bold px-1 py-0.5 rounded mb-1 tracking-wider uppercase">Simulador Ativo</span>
                        <h6 className="font-bold text-[8px] leading-tight mb-0.5">Simulação de Retorno</h6>
                        <p className="text-zinc-400 text-[6px] leading-none mb-1">Fatura Mensal Comercial:</p>
                        <div className="text-emerald-400 text-[12px] font-black my-1">R$ {solarBillValue}</div>
                        <div className="text-[5.5px] text-zinc-400">Economia Anual de: <span className="text-white font-bold">R$ {Math.round(solarBillValue * 0.95 * 12).toLocaleString('pt-BR')}</span></div>
                      </div>
                      {/* Benefits */}
                      <div className="space-y-1">
                        <div className="bg-[#121214] p-1 rounded border border-zinc-800 flex items-center gap-1.5">
                          <Flame className="w-2.5 h-2.5 text-[#E2B755]" />
                          <span className="text-[5.5px] text-zinc-300">Rápido Payback</span>
                        </div>
                        <div className="bg-[#121214] p-1 rounded border border-zinc-800 flex items-center gap-1.5">
                          <Star className="w-2.5 h-2.5 text-[#E2B755]" />
                          <span className="text-[5.5px] text-zinc-300">Garantia Linear de 25 Anos</span>
                        </div>
                      </div>
                    </div>

                    <a 
                      href="https://wa.me/5551994578544?text=Ol%C3%A1!%20Gostaria%20de%20uma%20simula%C3%A7%C3%A3o%20de%20energia%20solar."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 bg-[#E2B755] text-zinc-950 font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 text-[7px] hover:bg-[#c5a25d] transition-colors"
                    >
                      Simular por WhatsApp
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
                      <div className="flex justify-between items-center pb-1 border-b border-zinc-800 mb-2.5 text-[7px]">
                        <span className="font-bold text-[#E2B755]">CRISTAL GLASS</span>
                        <Shield className="w-2.5 h-2.5 text-[#E2B755]" />
                      </div>
                      {/* Showcase frame */}
                      <div className="bg-[#121214] border border-zinc-800 rounded-lg p-2 mb-2 text-center">
                        <h6 className="font-bold text-[8px] text-[#E2B755] leading-tight mb-0.5">Fechamento de Sacadas</h6>
                        <p className="text-zinc-400 text-[6px] leading-tight">Sofisticação Térmica & Acústica</p>
                        <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=150" alt="glass balcony" className="w-full aspect-[16/9] object-cover rounded mt-1.5 border border-zinc-800" referrerPolicy="no-referrer" />
                      </div>
                      {/* Specifications */}
                      <div className="bg-[#121214] p-1 border border-zinc-800 rounded flex items-center justify-around text-center text-[5px]">
                        <div>
                          <div className="font-bold text-white">Laminado</div>
                          <div className="text-zinc-500">Alta Resistência</div>
                        </div>
                        <div className="w-px h-3 bg-zinc-800"></div>
                        <div>
                          <div className="font-bold text-white font-sans">Aço Inox 304</div>
                          <div className="text-zinc-500">Zero Corrosão</div>
                        </div>
                      </div>
                    </div>

                    <a 
                      href="https://wa.me/5551994578544?text=Ol%C3%A1!%20Gostaria%20de%20um%20or%C3%A7amento%20de%20Vidra%C3%A7aria."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 bg-[#E2B755] text-zinc-950 font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 text-[7px] hover:bg-[#c5a25d] transition-colors"
                    >
                      Chamar no WhatsApp
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* iPhone Home Indicator bar / bottom lip */}
            <div className="h-3.5 bg-zinc-950 flex items-center justify-center pb-0.5 z-20">
              <div className="w-14 h-1 rounded bg-zinc-800"></div>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Feature Tags underneath mockup */}
      <div className="flex flex-wrap justify-center gap-3 md:gap-5 mt-16 text-zinc-400 text-xs select-none">
        <span className="flex items-center gap-2 bg-[#121214]/80 px-4 py-2.5 rounded-full border border-zinc-800 text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E2B755] animate-pulse"></span>
          ✓ Velocidade Superior (Score 95+ PageSpeed)
        </span>
        <span className="flex items-center gap-2 bg-[#121214]/80 px-4 py-2.5 rounded-full border border-zinc-800 text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E2B755] animate-pulse"></span>
          ✓ Google SEO Estratégico Local
        </span>
        <span className="flex items-center gap-2 bg-[#121214]/80 px-4 py-2.5 rounded-full border border-zinc-800 text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E2B755] animate-pulse"></span>
          ✓ Funil de WhatsApp Qualificado
        </span>
        <span className="flex items-center gap-2 bg-[#121214]/80 px-4 py-2.5 rounded-full border border-zinc-800 text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E2B755] animate-pulse"></span>
          ✓ Arquitetura Mobile First
        </span>
      </div>
    </div>
  );
}
