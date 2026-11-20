import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ExternalLink, Layers, Maximize2, Sun, X, Zap } from 'lucide-react';

type Demo = 'marble' | 'solar' | 'glass';
const examples: { id: Demo; segment: string; category: string; name: string; description: string }[] = [
  { id: 'marble', segment: 'Marmoraria', category: 'Mármores & granitos', name: 'Imperial Mármores', description: 'Design editorial para valorizar materiais e projetos.' },
  { id: 'solar', segment: 'Energia Solar', category: 'Energia fotovoltaica', name: 'Solaris Energia', description: 'Tecnologia e clareza para apresentar energia solar.' },
  { id: 'glass', segment: 'Vidraçaria', category: 'Vidros & fachadas', name: 'Cristal Glass', description: 'Uma experiência visual à altura da arquitetura.' },
];
const photos = {
  kitchen: '1682888813789-c39fe30921e2', solar: '1509391366360-2e959784a276',
  glass: '1600585154340-be6161a56a0c', interior: '1600607687939-ce8a6c25118c',
};
function Photo({ photo, className = '' }: { photo: string; className?: string }) {
  return <img src={`https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=1000&q=85`}
    alt="" loading="lazy" decoding="async" className={className} referrerPolicy="no-referrer" />;
}
function PreviewNav({ id }: { id: Demo }) {
  return <div className="atlas-demo-nav">
    <span className="atlas-demo-brand">{id === 'marble' ? <Layers /> : id === 'solar' ? <Sun /> : <span className="atlas-glass-symbol">▤</span>}
      <span>{id === 'marble' ? 'IMPERIAL' : id === 'solar' ? 'SOLARIS' : 'CRISTAL'}<small>{id === 'marble' ? 'MÁRMORES & GRANITOS' : id === 'solar' ? 'ENERGIA SOLAR' : 'VIDROS & FACHADAS'}</small></span>
    </span>
    <span className="atlas-demo-links">{id === 'solar' ? 'Soluções' : 'Projetos'}<span>Sobre</span></span>
    <span className="atlas-demo-nav-action">{id === 'solar' ? 'Simular economia' : 'Orçamento'} ↗</span>
  </div>;
}
/** A composed, scalable website interface, rather than a photograph used as a website thumbnail. */
function WebsitePreview({ id }: { id: Demo }) {
  return <div className={`atlas-site-preview atlas-site-preview--${id}`} data-reveal-skip aria-hidden="true">
    <div className="atlas-demo-site">
      <PreviewNav id={id} />
      {id === 'marble' ? <>
        <div className="atlas-marble-hero">
          <Photo photo={photos.kitchen} className="atlas-marble-photo" />
          <div className="atlas-demo-hero-copy"><span className="atlas-demo-eyebrow">NATUREZA · DESIGN · ESSÊNCIA</span>
            <p className="atlas-demo-headline">A natureza<br />em sua<br /><em>melhor forma.</em></p>
            <p className="atlas-demo-summary">Mármores e granitos para projetos que exigem sofisticação e personalidade.</p>
            <span className="atlas-demo-action">Explorar coleção <ArrowRight /></span>
            <div className="atlas-material-dots"><i /><i /><i /></div>
          </div>
        </div>
        <div className="atlas-marble-collection"><div><span>Matérias únicas.</span><small>Conheça nossa coleção ↗</small></div>
          <div className="atlas-material-samples"><i /><i /><i /></div>
        </div>
      </> : id === 'solar' ? <>
        <div className="atlas-solar-hero"><Photo photo={photos.solar} className="atlas-solar-photo" />
          <div className="atlas-demo-hero-copy"><span className="atlas-demo-eyebrow">ENERGIA PARA NOVAS POSSIBILIDADES</span>
            <p className="atlas-demo-headline">O futuro<br />já é <em>solar.</em></p>
            <p className="atlas-demo-summary">Soluções em energia solar para residências, empresas e propriedades rurais.</p>
            <span className="atlas-demo-action">Simular economia <ArrowRight /></span>
          </div>
        </div>
        <div className="atlas-solar-tools"><div><strong>Como funciona</strong><div className="atlas-energy-path"><Sun /><span>→</span><Layers /><span>→</span><Zap /></div><div className="atlas-energy-labels"><span>Captação<br />solar</span><span>Conversão<br />de energia</span><span>Energia<br />para você</span></div></div>
          <div><strong>Calcule sua economia</strong><small>Consumo mensal (kWh)</small><div className="atlas-demo-slider"><i /><span>350 kWh</span></div><small>Uma solução para a sua necessidade.</small></div>
        </div>
      </> : <>
        <div className="atlas-glass-hero"><Photo photo={photos.glass} className="atlas-glass-photo" />
          <div className="atlas-demo-hero-copy"><span className="atlas-demo-eyebrow">ARQUITETURA EM OUTRA PERSPECTIVA</span>
            <p className="atlas-demo-headline">Transparência<br />que<br />transforma.</p>
            <p className="atlas-demo-summary">Soluções em vidros e fachadas para projetos contemporâneos.</p>
            <span className="atlas-demo-action">Conhecer projetos <ArrowRight /></span>
            <div className="atlas-glass-services"><span>▥<small>Fachadas</small></span><span>⊞<small>Esquadrias</small></span><span>◇<small>Projetos especiais</small></span></div>
          </div>
        </div>
        <div className="atlas-glass-projects"><div><strong>Arquitetura sem limites.</strong><small>Ver projetos →</small></div><div><Photo photo={photos.glass} /><Photo photo={photos.interior} /></div></div>
      </>}
    </div>
  </div>;
}
export default function PortfolioShowcase({ openContact }: { openContact: (subject: string) => void }) {
  const [selected, setSelected] = useState<Demo | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const chosen = examples.find(example => example.id === selected);
  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal();
    if (!selected && dialog.current?.open) dialog.current.close();
  }, [selected]);
  const close = () => { setSelected(null); opener.current?.focus(); };
  return <section id="portfolio" className="atlas-portfolio scroll-mt-24 border-y border-white/10 py-20 sm:py-24 lg:py-28" aria-labelledby="portfolio-title">
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
      <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12" data-reveal>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[.24em] text-[#E2B755]">Portfólio Atlas</p>
        <h2 id="portfolio-title" className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">Design que valoriza <span className="text-[#E2B755]">cada negócio.</span></h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-300">Sites com identidade própria, criados para impressionar e gerar contatos.</p>
        <p className="mt-6 flex items-center justify-center gap-4 text-xs text-zinc-400"><span className="h-px w-10 bg-[#E2B755]/50" />Modelos demonstrativos<span className="h-px w-10 bg-[#E2B755]/50" /></p>
      </div>
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3" data-reveal-group>
        {examples.map(example => <article key={example.id} data-reveal="cascade" className="atlas-portfolio-card group flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-white/20 bg-[#111419] p-2 sm:p-2.5" aria-label={example.name}>
          <button type="button" aria-label={`Ampliar demonstração de ${example.name}`} className="atlas-preview-trigger relative block w-full overflow-hidden rounded-[16px] text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E2B755]" onClick={event => { opener.current = event.currentTarget; setSelected(example.id); }}>
            <WebsitePreview id={example.id} />
            <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/85 px-3 py-2 text-xs font-medium text-white shadow-lg"><Maximize2 size={13} /> Ampliar</span>
          </button>
          <div className="flex flex-1 flex-col px-3 pb-3 pt-5 sm:px-4">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#E2B755] sm:text-xs">{example.category}</p>
            <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-white">{example.name}</h3>
            <p className="mb-6 mt-2 text-sm leading-relaxed text-zinc-300 sm:text-base">{example.description}</p>
            <button type="button" aria-label={`Quero um site assim para ${example.segment.toLowerCase()}`} onClick={() => openContact(example.segment)} className="mt-auto flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#E2B755] px-4 py-3 text-sm font-bold text-[#111111] transition-colors hover:bg-[#f2ca6c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Quero um site assim <ArrowRight size={18} /></button>
          </div>
        </article>)}
      </div>
      <p className="mt-9 text-center text-sm text-zinc-300" data-reveal>A identidade da sua empresa. O cuidado da Atlas.</p>
    </div>
    <dialog ref={dialog} onCancel={close} onClose={close} className="atlas-portfolio-dialog fixed inset-0 m-auto max-h-[94dvh] w-[96vw] max-w-4xl overflow-auto rounded-2xl border border-white/20 bg-[#111419] p-3 text-white shadow-2xl backdrop:bg-black/85 sm:p-5" aria-label={`Demonstração ampliada de ${chosen?.name || 'site'}`}>
      {chosen && <><div className="sticky top-0 z-10 mb-3 flex items-center justify-between gap-3 rounded-lg bg-[#111419] p-2"><div><p className="font-semibold">{chosen.name}</p><p className="mt-1 text-xs text-zinc-400">Modelo demonstrativo · Atlas Digital</p></div><button type="button" autoFocus onClick={close} aria-label="Fechar demonstração" className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/20"><X size={20} /></button></div>
        <div className="overflow-hidden rounded-xl"><WebsitePreview id={chosen.id} /></div><button type="button" onClick={() => { const subject = chosen.segment; close(); openContact(subject); }} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#E2B755] px-5 py-3 font-bold text-black">Quero um site assim <ExternalLink size={17} /></button></>}
    </dialog>
  </section>;
}
