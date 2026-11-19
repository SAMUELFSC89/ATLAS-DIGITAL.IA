import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { ArrowLeft, Check, Copy, ExternalLink, ImagePlus, LoaderCircle, Monitor, RefreshCw, Smartphone, Sparkles, Star, Upload, X } from 'lucide-react';
import { prepareImage } from '../ExpressAssetUpload';
import { BRIEFING_FIELDS, CLIENT_FIELDS, STUDIO_STAGES, type StudioBriefing, type StudioClient, type StudioProject, type StudioStage, type StudioStep } from '../../lib/studioProject';
import { DISPLAY_FONTS, SCENE_TYPES, fontHref } from '../../lib/studioSite';
import { loadProject, postProject, studioApi } from './studioApi';

export const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:border-[#E2B755] disabled:opacity-50';
export const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#E2B755] px-4 py-2 text-sm font-bold text-black hover:bg-[#f0c96a] disabled:opacity-50';
export const input = 'w-full min-w-0 rounded-lg border border-white/20 bg-black/35 px-3 py-2 text-sm text-white';

const STAGE_LABEL: Record<StudioStage, string> = { dados: 'Dados', briefing: 'Briefing', cardapio: 'Cenas', direcao: 'Direção', site: 'Site' };
const STEP_WAIT: Record<StudioStep, string> = {
  briefing: 'O Claude está estudando o público e montando o briefing. Leva cerca de 30 segundos.',
  cardapio: 'O Claude está destrinchando o produto em ideias de cena. Leva cerca de 1 minuto.',
  direcao: 'O Claude está criando o design system e o roteiro de cenas. Leva de 1 a 2 minutos.',
  site: 'O Claude está construindo o site cena por cena. Leva de 2 a 4 minutos.',
};
const emptyClient = (): StudioClient => ({ name: '', segment: '', city: '', services: '', whatsapp: '', audience: '', differential: '', proofs: '', references: '', notes: '' });

function reached(project: StudioProject | undefined, stage: StudioStage) {
  if (stage === 'dados') return true;
  if (!project) return false;
  return { briefing: !!project.briefing, cardapio: !!project.ideas, direcao: !!project.direction, site: !!project.site }[stage];
}

function Field({ label, hint, children }: { key?: string; label: string; hint?: string; children: ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-sm font-semibold text-white">{label}</span>{hint && <span className="block text-xs text-zinc-400">{hint}</span>}{children}</label>;
}

function Regenerate({ step, busy, onRun, label }: { step: StudioStep; busy: boolean; onRun: (step: StudioStep, feedback: string) => void; label: string }) {
  const [feedback, setFeedback] = useState('');
  return <details className="rounded-xl border border-white/10 p-4">
    <summary className="cursor-pointer text-sm font-semibold text-zinc-200">{label}</summary>
    <div className="mt-3 space-y-3">
      <textarea className={input} rows={3} maxLength={1500} value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="O que mudar? Ex.: mais sofisticado, menos texto, usar a foto da fachada na abertura." aria-label="Pedido de ajuste para o Claude" />
      <button type="button" className={button} disabled={busy} onClick={() => onRun(step, feedback)}><RefreshCw size={16} /> Gerar de novo</button>
      <p className="text-xs text-zinc-400">Gerar de novo desfaz as aprovações desta etapa e das seguintes.</p>
    </div>
  </details>;
}

function Uploads({ project, onChange, disabled }: { project: StudioProject; onChange: (project: StudioProject) => void; disabled: boolean }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  async function choose(event: ChangeEvent<HTMLInputElement>, kind: 'photo' | 'logo') {
    const selected = Array.from(event.target.files || []) as File[];
    event.target.value = '';
    if (!selected.length) return;
    setBusy(kind); setError('');
    try {
      for (const file of selected.slice(0, kind === 'logo' ? 1 : 16)) {
        const prepared = await prepareImage(file, kind);
        await studioApi(null, { action: 'upload', id: project.id, assetId: crypto.randomUUID(), kind, name: file.name, data: prepared.data });
      }
      onChange(await loadProject(project.id));
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(''); }
  }
  async function remove(assetId: string) {
    setBusy('remove'); setError('');
    try { onChange(await postProject({ action: 'removeAsset', id: project.id, assetId })); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(''); }
  }
  const drop = (kind: 'photo' | 'logo', label: string, icon: ReactNode) => <label className="relative flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/25 bg-black/15 p-4 text-center hover:border-[#E2B755] focus-within:ring-2 focus-within:ring-[#E2B755]">
    {busy === kind ? <LoaderCircle size={20} className="animate-spin text-[#E2B755]" /> : icon}
    <span className="text-sm font-semibold">{busy === kind ? 'Enviando…' : label}</span>
    <input type="file" multiple={kind === 'photo'} disabled={disabled || Boolean(busy)} aria-label={label} accept="image/jpeg,image/png,image/webp" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={event => void choose(event, kind)} />
  </label>;
  return <fieldset className="space-y-3 rounded-xl border border-white/10 p-4">
    <legend className="px-1 text-sm font-bold">Fotos e logo do cliente</legend>
    <p className="text-sm text-zinc-300">Fotos reais deixam o site único. O Claude vê cada imagem e decide em que cena ela entra. Até 16 fotos e uma logo.</p>
    <div className="grid gap-3 sm:grid-cols-2">{drop('logo', 'Enviar logo', <Upload size={20} className="text-[#E2B755]" />)}{drop('photo', 'Enviar fotos', <ImagePlus size={20} className="text-[#E2B755]" />)}</div>
    {project.assets.length > 0 && <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">{project.assets.map(asset => <li key={asset.id} className="relative overflow-hidden rounded-lg border border-white/15">
      <img src={asset.url} alt={asset.name} className={`h-20 w-full ${asset.kind === 'logo' ? 'bg-white object-contain p-2' : 'object-cover'}`} />
      <button type="button" disabled={Boolean(busy)} onClick={() => void remove(asset.id)} aria-label={`Remover ${asset.name}`} className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/75"><X size={14} /></button>
      <p className="truncate px-1.5 py-1 text-[11px] text-zinc-300">{asset.kind === 'logo' ? 'Logo' : asset.name}</p>
    </li>)}</ul>}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </fieldset>;
}

export default function StudioProjectView({ id, onBack, onSaved }: { key?: string; id?: string; onBack: () => void; onSaved: (id: string) => void }) {
  const [project, setProject] = useState<StudioProject>();
  const [client, setClient] = useState<StudioClient>(emptyClient);
  const [briefing, setBriefing] = useState<StudioBriefing>();
  const [protagonist, setProtagonist] = useState('');
  const [support, setSupport] = useState<string[]>([]);
  const [view, setView] = useState<StudioStage>('dados');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [running, setRunning] = useState<StudioStep | ''>('');
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const frame = useRef<HTMLIFrameElement>(null);

  function apply(next: StudioProject, goTo?: StudioStage) {
    setProject(next);
    setClient(next.client);
    setBriefing(next.briefing);
    setProtagonist(next.protagonistId || next.recommendedId || '');
    setSupport(next.supportIds || []);
    if (goTo) setView(goTo);
  }

  useEffect(() => {
    if (!id) return;
    setBusy(true);
    loadProject(id).then(next => apply(next, next.busy && next.busy.until > Date.now() ? next.busy.step : next.stage))
      .catch(error => setError(error.message)).finally(() => setBusy(false));
  }, [id]);

  // A generation started elsewhere (or interrupted by a timeout) keeps running on the server: poll until it ends.
  const generatingElsewhere = !running && project?.busy && project.busy.until > Date.now();
  useEffect(() => {
    if (!generatingElsewhere || !project) return;
    const timer = window.setInterval(() => void loadProject(project.id).then(next => { if (!next.busy || next.busy.until <= Date.now()) apply(next, next.stage); }), 6000);
    return () => window.clearInterval(timer);
  }, [generatingElsewhere, project?.id]);

  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    setElapsed(0);
    const timer = window.setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!project?.direction) return;
    const href = fontHref(project.direction.tokens);
    if (document.querySelector(`link[href="${CSS.escape(href)}"]`)) return;
    document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'stylesheet', href }));
  }, [project?.direction?.tokens.fonts.display, project?.direction?.tokens.fonts.body]);

  async function act(task: () => Promise<StudioProject>, goTo?: StudioStage) {
    setBusy(true); setError('');
    try { const next = await task(); apply(next, goTo); return next; }
    catch (error) { setError((error as Error).message); return undefined; }
    finally { setBusy(false); }
  }

  async function generate(step: StudioStep, feedback = '') {
    if (!project) return;
    setRunning(step); setView(step); setError('');
    try { apply(await postProject({ action: 'generate', id: project.id, step, feedback }), step); }
    catch (error) {
      setError((error as Error).message);
      const next = await loadProject(project.id).catch(() => undefined);
      if (next) apply(next);
    } finally { setRunning(''); }
  }

  async function saveClient() {
    const next = await act(() => postProject(project ? { action: 'client', id: project.id, client } : { action: 'create', client }));
    if (next && !project) onSaved(next.id);
    return next;
  }

  const working = busy || Boolean(running) || Boolean(generatingElsewhere);
  const currentStep = running || (generatingElsewhere ? project!.busy!.step : '');
  const copy = (value: string, key: string) => { void navigator.clipboard?.writeText(value); setCopied(key); window.setTimeout(() => setCopied(''), 1500); };
  const needs = project?.site ? project.site.scenes.flatMap(scene => [...(scene.media || []), ...(scene.items || []).map(item => item.media)]).filter(m => m?.need).map(m => m!.need!) : [];

  return <div className="space-y-6">
    <button type="button" className={button} onClick={onBack}><ArrowLeft size={16} /> Todos os projetos</button>
    <header>
      <h2 className="text-2xl font-black text-white">{project?.client.name || 'Novo site'}</h2>
      {project && <p className="text-sm text-zinc-400">{project.client.segment} · {project.client.city}</p>}
    </header>

    <nav aria-label="Etapas do projeto"><ol className="flex flex-wrap gap-2">{STUDIO_STAGES.map((stage, index) => {
      const available = reached(project, stage);
      return <li key={stage}><button type="button" disabled={!available || working} aria-current={view === stage ? 'step' : undefined} onClick={() => setView(stage)}
        className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${view === stage ? 'border-[#E2B755] bg-[#E2B755]/15 text-[#E2B755]' : 'border-white/15 text-zinc-300'} disabled:opacity-40`}>
        {index + 1}. {STAGE_LABEL[stage]}{(stage === 'briefing' && project?.briefingApproved) || (stage === 'direcao' && project?.directionApproved) ? ' ✓' : ''}
      </button></li>;
    })}</ol></nav>

    {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p>}
    {project?.lastError && !error && !working && <p role="status" className="rounded-lg border border-amber-300/20 bg-amber-900/15 p-3 text-sm text-amber-200">Última tentativa ({STAGE_LABEL[project.lastError.step]}): {project.lastError.message}</p>}
    {currentStep && <div role="status" className="flex items-start gap-3 rounded-xl border border-[#E2B755]/30 bg-[#E2B755]/10 p-4 text-sm text-zinc-100">
      <LoaderCircle size={20} className="mt-0.5 shrink-0 animate-spin text-[#E2B755]" /><p>{STEP_WAIT[currentStep]}{running ? ` (${elapsed}s)` : ''} Pode continuar nesta tela.</p>
    </div>}

    {view === 'dados' && <section className="space-y-5" aria-labelledby="studio-dados">
      <h3 id="studio-dados" className="text-lg font-bold">Dados do cliente</h3>
      <p className="text-sm text-zinc-300">Quanto mais real e específico, melhor o briefing. Campos opcionais em branco viram hipóteses que você confere na próxima etapa.</p>
      <div className="grid gap-4 md:grid-cols-2">{CLIENT_FIELDS.map(field => <div key={field.key} className={field.long ? 'md:col-span-2' : ''}>
        <Field label={field.label + (field.required ? ' *' : '')} hint={field.hint}>
          {field.long ? <textarea className={input} rows={3} maxLength={field.max} value={client[field.key]} onChange={event => setClient({ ...client, [field.key]: event.target.value })} />
            : <input className={input} maxLength={field.max} value={client[field.key]} onChange={event => setClient({ ...client, [field.key]: event.target.value })} />}
        </Field></div>)}</div>
      {project && <Uploads project={project} onChange={next => apply(next)} disabled={working} />}
      <div className="flex flex-wrap gap-3">
        <button type="button" className={button} disabled={working} onClick={() => void saveClient()}>{project ? 'Salvar dados' : 'Criar projeto'}</button>
        {project && <button type="button" className={primary} disabled={working} onClick={() => void saveClient().then(next => next && generate('briefing'))}><Sparkles size={16} /> {project.briefing ? 'Salvar e gerar novo briefing' : 'Gerar briefing com o Claude'}</button>}
      </div>
      {!project && <p className="text-xs text-zinc-400">Depois de criar o projeto você envia as fotos e a logo.</p>}
    </section>}

    {view === 'briefing' && briefing && <section className="space-y-5" aria-labelledby="studio-briefing">
      <div><h3 id="studio-briefing" className="text-lg font-bold">Briefing · Aprovação 1</h3>
        <p className="text-sm text-zinc-300">Confira e corrija. Itens marcados como "(hipótese)" foram deduzidos pelo Claude. Ajustar aqui é barato; depois fica caro.</p></div>
      <div className="grid gap-4 md:grid-cols-2">{BRIEFING_FIELDS.map(field => <Field key={field.key} label={field.label}>
        <textarea className={input} rows={2} maxLength={700} value={briefing[field.key]} onChange={event => setBriefing({ ...briefing, [field.key]: event.target.value })} />
      </Field>)}</div>
      <fieldset className="space-y-3"><legend className="text-sm font-semibold">Objeções e como o site responde</legend>
        {briefing.objecoes.map((item, index) => <div key={index} className="grid gap-2 md:grid-cols-2">
          <input className={input} aria-label={`Objeção ${index + 1}`} value={item.objecao} onChange={event => setBriefing({ ...briefing, objecoes: briefing.objecoes.map((o, i) => i === index ? { ...o, objecao: event.target.value } : o) })} />
          <input className={input} aria-label={`Resposta à objeção ${index + 1}`} value={item.resposta} onChange={event => setBriefing({ ...briefing, objecoes: briefing.objecoes.map((o, i) => i === index ? { ...o, resposta: event.target.value } : o) })} />
        </div>)}
      </fieldset>
      <fieldset><legend className="text-sm font-semibold">Três palavras de sensação</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">{[0, 1, 2].map(i => <input key={i} className={input} aria-label={`Sensação ${i + 1}`} maxLength={30} value={briefing.sensacao[i] || ''}
          onChange={event => { const next = [...briefing.sensacao]; next[i] = event.target.value; setBriefing({ ...briefing, sensacao: next }); }} />)}</div>
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <button type="button" className={button} disabled={working} onClick={() => void act(() => postProject({ action: 'briefing', id: project!.id, briefing }))}>Salvar alterações</button>
        <button type="button" className={primary} disabled={working} onClick={() => void act(() => postProject({ action: 'briefing', id: project!.id, briefing, approve: true })).then(next => next && generate('cardapio'))}>
          <Check size={16} /> Aprovar briefing e montar cardápio de cenas</button>
      </div>
      <Regenerate step="briefing" busy={working} onRun={generate} label="Pedir ao Claude um novo briefing" />
    </section>}

    {view === 'cardapio' && project?.ideas && <section className="space-y-5" aria-labelledby="studio-cardapio">
      <div><h3 id="studio-cardapio" className="text-lg font-bold">Cardápio de cenas</h3>
        <p className="text-sm text-zinc-300">Escolha <strong>uma protagonista</strong> (a cena que todo mundo vai lembrar) e as de apoio. Um protagonista forte vale mais que dez efeitos medianos.</p></div>
      <ul className="grid gap-3 md:grid-cols-2">{project.ideas.map(idea => {
        const isMain = protagonist === idea.id;
        return <li key={idea.id} className={`space-y-2 rounded-xl border p-4 ${isMain ? 'border-[#E2B755] bg-[#E2B755]/10' : 'border-white/10 bg-zinc-900/60'}`}>
          <div className="flex items-start justify-between gap-2"><h4 className="font-bold text-white">{idea.title}</h4>
            {project.recommendedId === idea.id && <span className="shrink-0 rounded-full bg-[#E2B755]/20 px-2 py-0.5 text-xs font-semibold text-[#E2B755]">Recomendada</span>}</div>
          <p className="text-sm text-zinc-200">{idea.description}</p>
          <p className="text-xs text-zinc-400">Sensação: {idea.feeling} · Cena: {SCENE_TYPES[idea.sceneType].label}</p>
          {idea.assets && <p className="text-xs text-zinc-400">Precisa de: {idea.assets}</p>}
          <div className="flex flex-wrap gap-4 pt-1 text-sm">
            <label className="flex items-center gap-2"><input type="radio" name="protagonista" checked={isMain} onChange={() => { setProtagonist(idea.id); setSupport(support.filter(s => s !== idea.id)); }} /> <Star size={14} /> Protagonista</label>
            <label className="flex items-center gap-2"><input type="checkbox" disabled={isMain} checked={support.includes(idea.id)} onChange={event => setSupport(event.target.checked ? [...support, idea.id] : support.filter(s => s !== idea.id))} /> Apoio</label>
          </div>
        </li>;
      })}</ul>
      <button type="button" className={primary} disabled={working || !protagonist} onClick={() => void act(() => postProject({ action: 'choose', id: project.id, protagonistId: protagonist, supportIds: support })).then(next => next && generate('direcao'))}>
        <Sparkles size={16} /> Criar direção criativa com estas cenas</button>
      <Regenerate step="cardapio" busy={working} onRun={generate} label="Pedir outras ideias de cena" />
    </section>}

    {view === 'direcao' && project?.direction && <section className="space-y-6" aria-labelledby="studio-direcao">
      <div><h3 id="studio-direcao" className="text-lg font-bold">Direção criativa · Aprovação 2</h3>
        <p className="text-sm text-zinc-300">Depois desta aprovação, mudar a estrutura custa caro; textos e detalhes continuam fáceis de ajustar.</p></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-white/10 p-4"><h4 className="font-bold">Paleta</h4>
          <ul className="grid grid-cols-3 gap-2">{Object.entries(project.direction.tokens.colors).map(([name, color]) => <li key={name} className="text-xs">
            <span className="block h-12 rounded-md border border-white/15" style={{ background: color }} /><span className="mt-1 block text-zinc-300">{({ bg: 'Fundo', bgAlt: 'Fundo alternativo', text: 'Texto', muted: 'Texto secundário', accent: 'Destaque', accentText: 'Texto no destaque' } as Record<string, string>)[name]}</span><span className="font-mono text-zinc-400">{color}</span>
          </li>)}</ul>
          <p className="text-sm text-zinc-300">{project.direction.rationale.palette}</p></div>
        <div className="space-y-3 rounded-xl border border-white/10 p-4" style={{ background: project.direction.tokens.colors.bg, color: project.direction.tokens.colors.text }}>
          <h4 className="font-bold" style={{ color: project.direction.tokens.colors.muted }}>Tipografia</h4>
          <p style={{ fontFamily: `"${project.direction.tokens.fonts.display}"`, fontWeight: DISPLAY_FONTS[project.direction.tokens.fonts.display]?.weight, fontSize: 40, lineHeight: 1.05 }}>{project.client.name}</p>
          <p style={{ fontFamily: `"${project.direction.tokens.fonts.body}"` }}>{project.direction.tokens.fonts.display} nos títulos e {project.direction.tokens.fonts.body} no texto.</p>
          <span className="inline-block px-4 py-2 font-bold" style={{ background: project.direction.tokens.colors.accent, color: project.direction.tokens.colors.accentText, borderRadius: project.direction.tokens.radius }}>Chamar no WhatsApp</span>
          <p className="text-sm" style={{ color: project.direction.tokens.colors.muted }}>{project.direction.rationale.typography}</p>
          <p className="text-sm" style={{ color: project.direction.tokens.colors.muted }}>Movimento: {project.direction.rationale.motion}</p>
        </div>
      </div>
      <div className="space-y-3"><h4 className="font-bold">Roteiro de cenas</h4>
        <ol className="space-y-3">{project.direction.roteiro.map((scene, index) => <li key={index} className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 text-sm">
          <p className="font-bold text-white">{scene.title} <span className="font-normal text-zinc-400">· {SCENE_TYPES[scene.type].label}</span></p>
          <dl className="mt-2 grid gap-1 text-zinc-300 md:grid-cols-2">
            <div><dt className="inline font-semibold text-zinc-100">Entrada: </dt><dd className="inline">{scene.entrada}</dd></div>
            <div><dt className="inline font-semibold text-zinc-100">Durante: </dt><dd className="inline">{scene.durante}</dd></div>
            <div><dt className="inline font-semibold text-zinc-100">Saída: </dt><dd className="inline">{scene.saida}</dd></div>
            <div><dt className="inline font-semibold text-zinc-100">Objetivo: </dt><dd className="inline">{scene.objetivo}</dd></div>
            {scene.assets && <div className="md:col-span-2"><dt className="inline font-semibold text-zinc-100">Assets: </dt><dd className="inline">{scene.assets}</dd></div>}
          </dl></li>)}</ol></div>
      {project.direction.assetsList.length > 0 && <div className="space-y-3"><h4 className="font-bold">Lista de assets</h4>
        <ul className="space-y-2">{project.direction.assetsList.map(item => <li key={item.file} className="rounded-lg border border-white/10 p-3 text-sm">
          <p><span className="font-mono text-[#E2B755]">{item.file}</span> · {item.description} <span className="text-zinc-400">({item.source})</span></p>
          {item.prompt && <div className="mt-2 flex items-start gap-2"><p className="flex-1 text-xs text-zinc-300">{item.prompt}</p>
            <button type="button" className={button} onClick={() => copy(item.prompt, item.file)} aria-label={`Copiar prompt de ${item.file}`}>{copied === item.file ? <Check size={14} /> : <Copy size={14} />}</button></div>}
        </li>)}</ul></div>}
      <button type="button" className={primary} disabled={working} onClick={() => void act(() => postProject({ action: 'approveDirection', id: project.id })).then(next => next && generate('site'))}>
        <Check size={16} /> Aprovar direção e construir o site</button>
      <Regenerate step="direcao" busy={working} onRun={generate} label="Pedir outra direção criativa" />
    </section>}

    {view === 'site' && project?.site && <section className="space-y-4" aria-labelledby="studio-site">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="studio-site" className="text-lg font-bold">Site</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${button} ${device === 'desktop' ? 'border-[#E2B755] text-[#E2B755]' : ''}`} aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')}><Monitor size={16} /> Computador</button>
          <button type="button" className={`${button} ${device === 'mobile' ? 'border-[#E2B755] text-[#E2B755]' : ''}`} aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')}><Smartphone size={16} /> Celular</button>
          <button type="button" className={button} onClick={() => frame.current?.contentWindow?.location.reload()}><RefreshCw size={16} /> Recarregar</button>
          <a className={button} href={`/studio/${project.id}`} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Abrir em nova aba</a>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/15 bg-black">
        <iframe ref={frame} key={project.updatedAt} title={`Prévia do site ${project.client.name}`} src={`/studio/${project.id}`} className="mx-auto block h-[78vh] border-0 bg-black" style={{ width: device === 'mobile' ? 390 : '100%' }} />
      </div>
      {needs.length > 0 && <div className="space-y-2 rounded-xl border border-amber-300/20 bg-amber-900/10 p-4">
        <h4 className="font-bold text-amber-100">Imagens pendentes ({needs.length})</h4>
        <p className="text-sm text-amber-100/80">Estes espaços aparecem com o nome do arquivo. Envie fotos reais na etapa Dados e gere o site de novo; a geração de imagens com o Gemini chega na Fase 3.</p>
        <ul className="space-y-1 text-sm">{needs.map((need, index) => <li key={index}><span className="font-mono text-amber-200">{need.file}</span> · {need.description}</li>)}</ul>
      </div>}
      <p className="text-sm text-zinc-400">A edição manual (clicar para editar, arrastar cenas, trocar mídia) chega na Fase 2.</p>
      <Regenerate step="site" busy={working} onRun={generate} label="Pedir ao Claude ajustes no site" />
    </section>}

    {view !== 'dados' && !reached(project, view) && !currentStep && <p className="text-sm text-zinc-400">Esta etapa ainda não foi gerada.</p>}
  </div>;
}
