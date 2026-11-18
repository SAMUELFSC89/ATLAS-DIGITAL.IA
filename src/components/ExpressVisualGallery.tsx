import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ExternalLink, LoaderCircle, Maximize2, Sparkles, X } from 'lucide-react';
import type { ExpressPreview, ExpressVisual } from '../lib/expressOrder';

export default function ExpressVisualGallery({ preview }: { key?: string; preview: ExpressPreview & { visual: ExpressVisual } }) {
  const [visual, setVisual] = useState(preview.visual);
  const [active, setActive] = useState(0);
  const [problem, setProblem] = useState('');
  const [imageError, setImageError] = useState('');
  const [zoom, setZoom] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<number | null>(null);
  const page = visual.pages[active];
  const working = visual.status === 'researching' || visual.status === 'generating';
  const expired = visual.expiresAt <= Date.now();

  useEffect(() => {
    if (!working || expired) return;
    const controller = new AbortController();
    let timer: number, stopped = false, attempts = 0, failures = 0;
    async function poll() {
      try {
        const response = await fetch('/api/site-express?view=visual', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: preview.id }), signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok || !result.visual) throw new Error('Não foi possível consultar o progresso agora.');
        if (stopped) return;
        const next = result.visual as ExpressVisual;
        setVisual(next); setProblem(''); failures = 0;
        if (next.status === 'ready' || next.status === 'error') return;
      } catch (error) {
        if (stopped) return;
        if (++failures >= 3) { setProblem('A conexão foi interrompida. Reabra este link para retomar a prévia salva.'); return; }
      }
      if (++attempts >= 120) { setProblem('Sua prévia continua sendo preparada. Reabra este link em alguns instantes para acompanhar.'); return; }
      if (!stopped) timer = window.setTimeout(poll, 6000);
    }
    void poll();
    return () => { stopped = true; controller.abort(); window.clearTimeout(timer); };
    // A saved preview has one job. Changing slides never starts a new generation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview.id]);

  useEffect(() => { setImageError(''); }, [active]);
  useEffect(() => {
    if (zoom && !dialog.current?.open) dialog.current?.showModal();
    if (!zoom && dialog.current?.open) dialog.current.close();
  }, [zoom]);
  const move = (direction: number) => setActive(value => (value + direction + visual.pages.length) % visual.pages.length);

  return <section className="min-w-0 overflow-hidden rounded-2xl border border-white/15 bg-[#111317]" aria-label="Carrossel das páginas do seu site" aria-roledescription="carrossel">
    <div className="border-b border-white/10 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#E2B755]"><Sparkles size={14} /> Seu novo site</p>
          <h2 className="mt-2 break-words text-lg font-bold">{preview.business.name}</h2></div>
        <span className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-300">{visual.device === 'mobile' ? 'Visualização mobile' : 'Visualização desktop'}</span>
      </div>
      <div role="status" aria-live="polite" className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-zinc-300">
        {working && !problem && !expired ? <LoaderCircle size={17} className="mt-0.5 shrink-0 animate-spin text-[#E2B755]" /> : visual.status === 'ready' ? <Check size={17} className="mt-0.5 shrink-0 text-[#E2B755]" /> : null}
        <span>{expired ? 'O prazo de disponibilidade destas imagens terminou.' : problem || visual.message ||
          (visual.status === 'researching' ? 'Criando o seu site. Isso leva de 2 a 4 minutos…' :
            visual.status === 'ready' ? 'Suas quatro telas estão prontas. Deslize para conhecer a proposta.' :
              'Site criado. Preparando as telas da prévia…')}</span>
      </div>
      {working && <p className="mt-2 text-xs leading-relaxed text-zinc-500">Pode deixar esta página aberta ou voltar a este link depois para acompanhar.</p>}
    </div>

    <div role="tablist" aria-label="Páginas da prévia" className="grid grid-cols-4 gap-1 border-b border-white/10 bg-black/20 p-2">
      {visual.pages.map((item, index) => <button key={item.id} role="tab" id={`preview-tab-${item.id}`} aria-selected={active === index}
        aria-controls="preview-image-panel" tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)}
        onKeyDown={event => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault(); const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + visual.pages.length) % visual.pages.length;
            setActive(next); document.getElementById(`preview-tab-${visual.pages[next].id}`)?.focus();
          }
        }} className={`min-h-12 rounded-lg px-1.5 text-xs font-semibold transition sm:text-sm ${active === index ? 'bg-[#E2B755] text-zinc-950' : 'text-zinc-300 hover:bg-white/5'}`}>
        {item.title}<span className="mt-1 block text-[10px] font-normal opacity-70">{item.status === 'ready' ? 'Pronta' : item.status === 'generating' ? 'Criando…' : 'Em preparação'}</span>
      </button>)}
    </div>

    <div id="preview-image-panel" role="tabpanel" aria-labelledby={`preview-tab-${page.id}`} tabIndex={0}
      onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); } }}
      onTouchStart={event => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={event => { if (touchStart.current !== null) { const delta = (event.changedTouches[0]?.clientX || 0) - touchStart.current; if (Math.abs(delta) > 60) move(delta < 0 ? 1 : -1); } touchStart.current = null; }}
      className="flex min-h-96 items-center justify-center bg-[#e7e6e1] p-2 sm:p-4">
      {page.imageUrl && !expired && !imageError ? <button className="block w-full cursor-zoom-in" aria-label={`Ampliar imagem da página ${page.title}`} onClick={() => setZoom(true)}>
        <img src={page.imageUrl} alt={`Prévia da seção ${page.title} do site de ${preview.business.name}`} width={page.width} height={page.height}
          onError={() => setImageError('Não foi possível abrir esta imagem agora. Atualize a página ou fale com a Atlas.')}
          className="mx-auto max-h-[76vh] w-full object-contain shadow-xl" />
      </button> : <div className="max-w-sm px-5 py-16 text-center text-[#282b31]">
        {working && !expired && !problem ? <LoaderCircle className="mx-auto mb-4 animate-spin" size={28} /> : <Sparkles className="mx-auto mb-4" size={28} />}
        <h3 className="text-xl font-bold">{page.title}</h3>
        <p className="mt-3 text-sm leading-relaxed">{imageError || (expired ? 'As imagens desta prévia já expiraram. Fale com a Atlas para continuar seu projeto.' : visual.status === 'error' ? visual.message :
          visual.status === 'researching' ? 'Estamos criando um site que combine com a sua empresa.' : 'Esta tela aparecerá aqui assim que estiver pronta.')}</p>
      </div>}
    </div>

    <div className="flex items-center justify-between gap-2 border-t border-white/10 p-3 sm:px-5">
      <button type="button" aria-label="Página anterior" onClick={() => move(-1)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/15 hover:bg-white/5"><ArrowLeft size={18} /></button>
      <div className="text-center"><p className="text-sm font-semibold">{page.title}</p><p className="mt-0.5 text-xs text-zinc-500">{active + 1} / {visual.pages.length}</p></div>
      {page.imageUrl && !expired && <button type="button" onClick={() => setZoom(true)} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#E2B755]"><Maximize2 size={15} /><span className="hidden sm:inline">Ampliar</span></button>}
      <button type="button" aria-label="Próxima página" onClick={() => move(1)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/15 hover:bg-white/5"><ArrowRight size={18} /></button>
    </div>
    <div className="border-t border-white/10 px-4 py-4 text-xs leading-relaxed text-zinc-400 sm:px-5">
      <p>Prévia do seu site com marca d'água. Depois da compra, a Atlas aplica seus ajustes e entrega o site publicado, sem marca d'água. Prévia disponível por até 7 dias.</p>
      <p className="mt-2">No Site Express de uma página, os conteúdos são reunidos em uma única página. Páginas separadas e recursos especiais têm orçamento personalizado.</p>
    </div>


    <dialog ref={dialog} onClose={() => setZoom(false)} className="fixed inset-0 m-auto max-h-[94vh] w-[96vw] max-w-5xl overflow-auto rounded-2xl border border-white/20 bg-[#111317] p-3 text-white backdrop:bg-black/85 sm:p-5" aria-label={`Imagem ampliada da página ${page.title}`}>
      <div className="sticky top-0 mb-3 flex items-center justify-between gap-3 rounded-lg bg-[#111317] p-2">
        <p className="text-sm font-semibold">{page.title} · {preview.business.name}</p>
        <button autoFocus onClick={() => setZoom(false)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/20" aria-label="Fechar imagem ampliada"><X size={20} /></button>
      </div>
      {page.imageUrl && <><img src={page.imageUrl} alt={`Página ${page.title} em alta resolução`} width={page.width} height={page.height} className="mx-auto h-auto w-full" />
        <a href={page.imageUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#E2B755]">Abrir imagem em alta resolução<ExternalLink size={15} /></a></>}
    </dialog>
  </section>;
}

