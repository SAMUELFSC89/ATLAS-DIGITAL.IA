import { useEffect, useId, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Layers, Shield, Zap } from 'lucide-react';

type ProjectType = 'marmoraria' | 'solar' | 'vidracaria';

const photo = (id: string, width: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

const projects = {
  marmoraria: {
    name: 'Imperial Marbles',
    category: 'Mármores & quartzitos',
    title: ['Pedra natural,', 'forma única.'],
    summary: 'Bancadas, cubas e revestimentos feitos sob medida.',
    action: 'Pedir orçamento',
    subject: 'Orçamento de Marmoraria',
    section: 'Projetos em pedra',
    image: '1600566753190-17f0baa2a6c3',
    imageAlt: 'Cozinha contemporânea com ilha de pedra clara',
    background: '#f4efe5',
    foreground: '#30271e',
    accent: '#80603e',
    button: '#e6d4b5',
    entries: [
      { label: 'Bancadas sob medida', image: '1600607687939-ce8a6c25118c', position: 'center' },
      { label: 'Revestimentos em pedra', image: '1600566753086-00f18fb6b3ea', position: 'center' },
    ],
  },
  solar: {
    name: 'Helios Engenharia',
    category: 'Energia solar fotovoltaica',
    title: ['Energia que', 'trabalha por você.'],
    summary: 'Projetos fotovoltaicos para empresas e indústrias.',
    action: 'Simular economia',
    subject: 'Orçamento de Energia Solar',
    section: 'Simule sua economia',
    image: '1509391366360-2e959784a276',
    imageAlt: 'Fileiras de painéis fotovoltaicos em um campo',
    background: '#e6f0eb',
    foreground: '#102d27',
    accent: '#1e654f',
    button: '#c8ef83',
    entries: [],
  },
  vidracaria: {
    name: 'Cristal Glass',
    category: 'Vidro & alumínio',
    title: ['Mais luz.', 'Mais espaço.'],
    summary: 'Fachadas, esquadrias e sacadas em vidro sob medida.',
    action: 'Pedir orçamento',
    subject: 'Orçamento de Vidraçaria',
    section: 'Soluções em vidro',
    image: '1600585154340-be6161a56a0c',
    imageAlt: 'Fachada residencial contemporânea com grandes superfícies de vidro',
    background: '#eaf1f7',
    foreground: '#152735',
    accent: '#2c5673',
    button: '#cde6ff',
    entries: [
      { label: 'Esquadrias e fachadas', image: '1600585154526-990dced4db0d', position: 'center' },
      { label: 'Envidraçamento de ambientes', image: '1600585154340-be6161a56a0c', position: 'right center' },
    ],
  },
} satisfies Record<ProjectType, {
  name: string;
  category: string;
  title: [string, string];
  summary: string;
  action: string;
  subject: string;
  section: string;
  image: string;
  imageAlt: string;
  background: string;
  foreground: string;
  accent: string;
  button: string;
  entries: Array<{ label: string; image: string; position: string }>;
}>;

interface DemoSiteProps {
  // React usa a chave apenas para remontar a demonstração ao trocar de projeto.
  key?: ProjectType;
  project: ProjectType;
  phone?: boolean;
  solarBillValue: number;
  onSolarBillChange: (value: number) => void;
  openContactModal?: (subject?: string) => void;
}

const formatMoney = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

function DemoSite({ project, phone = false, solarBillValue, onSolarBillChange, openContactModal }: DemoSiteProps) {
  const site = projects[project];
  const solar = project === 'solar';
  const glass = project === 'vidracaria';
  const splitHero = glass && !phone;
  const currencyId = useId();
  const detailsRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const BrandIcon = solar ? Zap : glass ? Shield : Layers;

  function showDetails() {
    const screen = screenRef.current;
    const details = detailsRef.current;
    if (!screen || !details) return;
    const offset = details.getBoundingClientRect().top - screen.getBoundingClientRect().top;
    screen.scrollTop += offset;
    details.focus({ preventScroll: true });
  }

  return (
    <div
      ref={screenRef}
      className={`absolute inset-x-0 top-0 overflow-y-auto no-scrollbar text-left overscroll-contain ${phone ? 'bottom-3.5 pt-8' : 'bottom-4.5 pt-4'}`}
      style={{ backgroundColor: site.background, color: site.foreground }}
      role="region"
      aria-label={`Demonstração de ${site.name} no ${phone ? 'celular' : 'computador'}`}
      tabIndex={0}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.16 }}
      >
        <div className={`flex items-center justify-between gap-2 ${phone ? 'px-2.5 py-2' : 'px-4 py-2.5'}`}>
          <span className={`flex items-center gap-1.5 font-bold leading-tight ${phone ? 'text-[8px]' : 'text-[10px]'} ${project === 'marmoraria' ? 'font-serif' : 'font-display'}`}>
            <BrandIcon className="size-3 shrink-0" style={{ color: site.accent }} aria-hidden="true" />
            {site.name}
          </span>
          {!phone && (
            <div className="flex shrink-0 items-center gap-2 text-[8px] font-semibold">
              <button type="button" onClick={showDetails} className="hover:underline">
                {solar ? 'Simulador' : 'Projetos'}
              </button>
              <button
                type="button"
                onClick={() => openContactModal?.(site.subject)}
                className="rounded-full border px-2 py-1"
                style={{ borderColor: site.accent }}
              >
                Contato <span aria-hidden="true">↗</span>
              </button>
            </div>
          )}
        </div>

        <div className={`relative isolate flex overflow-hidden ${phone ? 'min-h-[148px] items-end px-2.5 pb-3 pt-9' : 'min-h-[155px] items-center px-4 py-4'} ${splitHero ? 'text-[#152735]' : 'text-white'}`} style={splitHero ? { backgroundColor: '#d6e6ef' } : undefined}>
          <img
            src={photo(site.image, phone ? 320 : 720)}
            alt={site.imageAlt}
            className={`absolute inset-y-0 right-0 -z-20 h-full object-cover ${splitHero ? 'w-1/2' : 'w-full'}`}
            style={{ objectPosition: solar ? 'center 58%' : glass ? 'center 52%' : 'center 53%' }}
            referrerPolicy="no-referrer"
            decoding="async"
          />
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: splitHero
                ? 'linear-gradient(90deg, #d6e6ef 48%, transparent 56%)'
                : phone
                  ? 'linear-gradient(0deg, rgb(9 14 17 / 94%), rgb(9 14 17 / 14%) 98%)'
                  : solar
                    ? 'linear-gradient(95deg, rgb(8 32 26 / 97%), rgb(8 32 26 / 72%) 46%, transparent 92%)'
                    : 'linear-gradient(92deg, rgb(19 18 16 / 96%), rgb(19 18 16 / 57%) 52%, transparent 91%)',
            }}
          />
          <div className={phone ? 'w-full' : splitHero ? 'max-w-[48%]' : 'max-w-[78%]'}>
            <p className={`mb-1 font-bold uppercase tracking-[0.12em] ${phone ? 'text-[6.5px]' : 'text-[8px]'}`} style={{ color: splitHero ? site.accent : site.button }}>
              {site.category}
            </p>
            <h3 className={`leading-[1.02] ${phone ? 'text-[17px]' : splitHero ? 'text-[24px]' : 'text-[29px]'} ${project === 'marmoraria' ? 'font-serif font-normal' : 'font-display font-bold tracking-tight'}`}>
              {site.title[0]}<br />{site.title[1]}
            </h3>
            {!phone && <p className={`mt-1.5 text-[9px] leading-tight ${splitHero ? 'text-[#29485c]' : 'text-white/85'}`}>{site.summary}</p>}
            <button
              type="button"
              onClick={solar ? showDetails : () => openContactModal?.(site.subject)}
              className={`mt-2 inline-flex items-center gap-1 font-bold hover:brightness-110 ${phone ? 'px-1.5 py-1.5 text-[7px]' : 'px-2.5 py-1.5 text-[8px]'} ${solar ? 'rounded-full' : 'rounded-sm'}`}
              style={{ color: site.foreground, backgroundColor: site.button }}
            >
              {site.action} <ArrowRight className="size-2.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div ref={detailsRef} tabIndex={-1} className={phone ? 'px-2.5 py-2.5' : 'px-4 py-3'}>
          <h4 className={`mb-1.5 leading-tight ${phone ? 'text-[11px]' : 'text-[15px]'} ${project === 'marmoraria' ? 'font-serif' : 'font-display font-bold'}`}>
            {site.section}
          </h4>
          {solar ? (
            <div className={`grid gap-2 rounded-md bg-white/75 p-2 ${phone ? '' : 'grid-cols-[1fr_auto] items-center'}`}>
              <div>
                <label htmlFor={currencyId} className="block text-[8px] font-semibold">
                  Fatura mensal · {formatMoney.format(solarBillValue)}
                </label>
                <input
                  id={currencyId}
                  type="range"
                  min={200}
                  max={3000}
                  step={50}
                  value={solarBillValue}
                  onChange={(event) => onSolarBillChange(Number(event.target.value))}
                  className="mt-1 block h-3 w-full cursor-pointer"
                  style={{ accentColor: site.accent }}
                />
              </div>
              <div>
                <p className="text-[7px]">Economia anual ilustrativa</p>
                <p className="text-[12px] font-bold leading-tight" style={{ color: site.accent }}>
                  {formatMoney.format(solarBillValue * 0.95 * 12)}
                </p>
                <p className="mt-0.5 text-[7px]">Cenário hipotético de 95%</p>
                <button type="button" onClick={() => openContactModal?.(site.subject)} className="mt-1 text-[8px] font-bold underline underline-offset-2">
                  Pedir proposta
                </button>
              </div>
            </div>
          ) : (
            <div className={`grid gap-2 ${phone ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {site.entries.map((entry) => (
                <figure key={entry.label} className="relative isolate flex overflow-hidden bg-zinc-900 text-white">
                  <img
                    src={photo(entry.image, phone ? 220 : 360)}
                    alt=""
                    className={`w-full object-cover ${phone ? 'h-13' : 'h-15'}`}
                    style={{ objectPosition: entry.position }}
                    referrerPolicy="no-referrer"
                    decoding="async"
                    loading="lazy"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1.5 pb-1 pt-3 text-[8px] font-semibold">
                    {entry.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

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
          type="button"
          aria-pressed={activeTab === 'marmoraria'}
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
          type="button"
          aria-pressed={activeTab === 'solar'}
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
          type="button"
          aria-pressed={activeTab === 'vidracaria'}
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

              <DemoSite
                key={activeTab}
                project={activeTab}
                solarBillValue={solarBillValue}
                onSolarBillChange={setSolarBillValue}
                openContactModal={openContactModal}
              />

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

            <DemoSite
              key={activeTab}
              project={activeTab}
              phone
              solarBillValue={solarBillValue}
              onSolarBillChange={setSolarBillValue}
              openContactModal={openContactModal}
            />

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
