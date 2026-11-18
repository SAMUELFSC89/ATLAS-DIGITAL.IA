import { useEffect, useState } from 'react';
import { ExternalLink, Plus, Trash2, UserPlus, X } from 'lucide-react';
import type { StudioProjectSummary } from '../../lib/studioProject';
import StudioProjectView, { button, input, primary } from './StudioProjectView';
import { studioApi } from './studioApi';

const STAGE = { dados: 'Dados', briefing: 'Briefing', cardapio: 'Cenas', direcao: 'Direção', site: 'Site pronto' } as const;

function AccessManager() {
  const [emails, setEmails] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { studioApi<{ emails: string[] }>('access').then(data => setEmails(data.emails)).catch(e => setError(e.message)); }, []);
  async function change(target: string, allow: boolean) {
    setBusy(true); setError('');
    try { setEmails((await studioApi<{ emails: string[] }>(null, { action: 'access', email: target, allow })).emails); if (allow) setEmail(''); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <details className="rounded-xl border border-[#E2B755]/25 bg-zinc-900/70 p-4 sm:p-5">
    <summary className="cursor-pointer font-semibold text-[#E2B755]">Acessos ao criador de sites ({emails.length})</summary>
    <p className="mt-3 text-sm text-zinc-300">Só os e-mails desta lista (e você) usam o criador. A pessoa precisa ter conta no portal com o e-mail confirmado.</p>
    <form className="mt-3 flex flex-wrap gap-2" onSubmit={event => { event.preventDefault(); void change(email.trim(), true); }}>
      <input className={`${input} max-w-sm`} type="email" required placeholder="email@exemplo.com" aria-label="E-mail para liberar" value={email} onChange={event => setEmail(event.target.value)} />
      <button className={button} disabled={busy}><UserPlus size={16} /> Liberar acesso</button>
    </form>
    {emails.length > 0 && <ul className="mt-3 space-y-1">{emails.map(item => <li key={item} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm">
      <span className="truncate">{item}</span>
      <button type="button" className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10" disabled={busy} onClick={() => void change(item, false)} aria-label={`Remover acesso de ${item}`}><X size={16} /></button>
    </li>)}</ul>}
    {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
  </details>;
}

/** Portal area of the AI site creator. Only accounts released by the Atlas owner reach it (checked again on the server). */
export default function SiteStudioPanel({ owner }: { owner: boolean }) {
  const [projects, setProjects] = useState<StudioProjectSummary[]>([]);
  const [open, setOpen] = useState<string | 'novo' | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    setBusy(true);
    try { setProjects((await studioApi<{ projects: StudioProjectSummary[] }>('projects')).projects); setError(''); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  useEffect(() => { if (open === null) void refresh(); }, [open]);

  async function remove(project: StudioProjectSummary) {
    if (!window.confirm(`Excluir o projeto "${project.name}"? Os dados, as fotos e o site gerado serão apagados.`)) return;
    try { await studioApi(null, { action: 'delete', id: project.id }); await refresh(); }
    catch (e) { setError((e as Error).message); }
  }

  if (open) return <StudioProjectView key={open} id={open === 'novo' ? undefined : open} onBack={() => setOpen(null)} onSaved={id => setOpen(id)} />;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="text-2xl font-black text-white">Criador de sites</h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-300">O Claude conduz o método das 4 cartas: briefing do público, cardápio de cenas, direção criativa e construção com a biblioteca de cenas animadas e 3D da Atlas.</p></div>
      <div className="flex flex-wrap gap-2">
        <a className={button} href="/studio/exemplo" target="_blank" rel="noreferrer"><ExternalLink size={16} /> Ver exemplo das cenas</a>
        <button type="button" className={primary} onClick={() => setOpen('novo')}><Plus size={16} /> Novo site</button>
      </div>
    </header>
    {owner && <AccessManager />}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    {busy && <p role="status" className="text-sm text-zinc-300">Carregando projetos…</p>}
    {!busy && projects.length === 0 && !error && <p className="rounded-xl border border-white/10 p-6 text-sm text-zinc-300">Nenhum projeto ainda. Clique em "Novo site" para começar.</p>}
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{projects.map(project => <li key={project.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-zinc-900/60 p-4">
      <div><p className="font-bold text-white">{project.name}</p><p className="text-sm text-zinc-400">{project.segment}</p></div>
      <p className="text-xs text-zinc-400">Etapa: <span className="font-semibold text-[#E2B755]">{STAGE[project.stage]}</span> · {new Date(project.updatedAt).toLocaleString('pt-BR')}{owner ? ` · ${project.ownerEmail}` : ''}</p>
      <div className="mt-auto flex gap-2">
        <button type="button" className={`${button} flex-1`} onClick={() => setOpen(project.id)}>Abrir</button>
        <button type="button" className={button} onClick={() => void remove(project)} aria-label={`Excluir ${project.name}`}><Trash2 size={16} /></button>
      </div>
    </li>)}</ul>
  </div>;
}
