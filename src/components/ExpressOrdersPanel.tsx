import { useEffect, useState, type FormEvent } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { auth } from '../lib/firebase';
import { expressDate, expressMoney, type ExpressStatus } from '../lib/expressOrder';
import { DEFAULT_VISUAL_PROMPT } from '../lib/expressVisualPrompt';
import ExpressSiteFinalizer, { type FinalizerOrder } from './ExpressSiteFinalizer';

type PanelOrder = FinalizerOrder & { mode?: 'test' | 'live'; deliveryUrl?: string };
type List = { orders: PanelOrder[]; capacity: number; claudeReady?: boolean; domainAutomatic?: boolean; visualPrompt?: string; visualEnabled?: boolean; visualLastIssue?: { status: number; phase: string; at: number } };

const labels: Record<ExpressStatus, string> = {
  pending: 'Aguardando pagamento', paid: 'Pago', production: 'Em produção',
  delivered: 'Entregue', expired: 'Expirado', refunded: 'Reembolsado',
};
const button = 'rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:border-[#E2B755] disabled:opacity-50';
const input = 'min-w-0 rounded-lg border border-white/20 bg-black/35 px-3 py-2 text-sm text-white';
const isOpen = (order: PanelOrder) => order.status === 'paid' || order.status === 'production';

async function request<T>(body?: object): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error('Entre na conta da Atlas.');
  const response = await fetch('/api/site-express?view=admin', {
    method: body ? 'POST' : 'GET', headers: {
      'Content-Type': 'application/json', Authorization: 'Bearer ' + await user.getIdToken(),
    }, ...(body && { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error || 'Não foi possível acessar os pedidos.');
  return data;
}

export default function ExpressOrdersPanel() {
  const [orders, setOrders] = useState<PanelOrder[]>([]);
  const [capacity, setCapacity] = useState('');
  const [visualPrompt, setVisualPrompt] = useState(DEFAULT_VISUAL_PROMPT);
  const [savedPrompt, setSavedPrompt] = useState(DEFAULT_VISUAL_PROMPT);
  const [visualEnabled, setVisualEnabled] = useState(false);
  const [visualLastIssue, setVisualLastIssue] = useState<List['visualLastIssue']>();
  const [claudeReady, setClaudeReady] = useState(false);
  const [domainAutomatic, setDomainAutomatic] = useState(false);
  const [resumeLink, setResumeLink] = useState('');
  const [filter, setFilter] = useState<'active' | 'all' | ExpressStatus>('active');
  const [busy, setBusy] = useState('load');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const data = await request<List>();
    setOrders(data.orders);
    setCapacity(String(data.capacity));
    setVisualPrompt(data.visualPrompt || DEFAULT_VISUAL_PROMPT);
    setSavedPrompt(data.visualPrompt || DEFAULT_VISUAL_PROMPT);
    setVisualEnabled(data.visualEnabled === true);
    setVisualLastIssue(data.visualLastIssue);
    setClaudeReady(data.claudeReady === true); setDomainAutomatic(data.domainAutomatic === true);
  }

  useEffect(() => {
    let active = true;
    request<List>().then(data => {
      if (active) { setOrders(data.orders); setCapacity(String(data.capacity));
        setVisualPrompt(data.visualPrompt || DEFAULT_VISUAL_PROMPT); setSavedPrompt(data.visualPrompt || DEFAULT_VISUAL_PROMPT); setVisualEnabled(data.visualEnabled === true); setVisualLastIssue(data.visualLastIssue);
        setClaudeReady(data.claudeReady === true); setDomainAutomatic(data.domainAutomatic === true); }
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(''); });
    return () => { active = false; };
  }, []);

  async function run(action?: object, success = 'Atualizado.') {
    setBusy('update'); setError(''); setMessage('');
    try {
      if (action) await request(action);
      await load();
      setMessage(success);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(''); }
  }

  const visible = orders.filter(order => filter === 'all' || (filter === 'active' ? isOpen(order) : order.status === filter))
    .sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity) || b.createdAt - a.createdAt);

  return (
    <section aria-labelledby="express-panel-heading" className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="express-panel-heading" className="font-display text-3xl font-bold">Pedidos de Site</h2>
          <p className="mt-1 text-sm text-zinc-400">Acompanhe pagamentos, prazos e e-mails de entrega do Site Express.</p>
        </div>
        <button className={button + ' inline-flex items-center gap-2'} onClick={() => void run()} disabled={Boolean(busy)}><RefreshCw size={15} /> Atualizar</button>
      </div>
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
        <form className="flex flex-wrap items-end gap-2" onSubmit={event => {
          event.preventDefault();
          void run({ action: 'capacity', capacity: Number(capacity) }, 'Capacidade atualizada.');
        }}>
          <label className="text-sm text-zinc-300">Vagas por dia
            <input className={input + ' mt-1 block w-24'} type="number" required min={1} max={30} value={capacity} onChange={e => setCapacity(e.target.value)} />
          </label>
          <button className={button} disabled={Boolean(busy) || !capacity}>Salvar capacidade</button>
        </form>
        <label className="text-sm text-zinc-300">Exibir
          <select className={input + ' mt-1 block'} value={filter} onChange={e => setFilter(e.target.value as typeof filter)}>
            <option value="active">Fila de produção</option><option value="all">Todos os pedidos</option>
            {Object.entries(labels).map(([value, text]) => <option value={value} key={value}>{text}</option>)}
          </select>
        </label>
      </div>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
      {busy === 'load' && <p role="status" className="text-sm text-zinc-300">Carregando pedidos…</p>}
      <details className="rounded-xl border border-[#E2B755]/25 bg-zinc-900/70 p-4 sm:p-5">
        <summary className="cursor-pointer font-semibold text-[#E2B755]">Prompt do Claude · Direção criativa dos sites</summary>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-300">Defina como o Claude deve criar os sites: estilo, tipografia, cores, organização das seções e o que evitar. As instruções valem para as novas prévias e para a versão final.</p>
        {visualLastIssue && <p className="mt-3 rounded-lg border border-amber-300/20 bg-amber-900/15 p-3 text-sm text-amber-200">{visualLastIssue.status === 429 ? 'O Claude recusou a última geração por limite de uso (429). Confira os limites e o saldo da conta antes de retomar.' : visualLastIssue.status === 401 || visualLastIssue.status === 403 ? 'A chave da API do Claude foi recusada. Confira ANTHROPIC_API_KEY na Vercel.' : `A última geração foi interrompida (${visualLastIssue.status || 'sem código'}, etapa ${visualLastIssue.phase === 'shots' ? 'imagens' : 'site'}).`} <a className="underline" href="https://platform.claude.com/dashboard" target="_blank" rel="noreferrer">Abrir painel do Claude</a></p>}
        {!claudeReady && <p className="mt-3 rounded-lg border border-amber-300/20 bg-amber-900/15 p-3 text-sm text-amber-200">Cadastre ANTHROPIC_API_KEY na Vercel (crie a chave em console.anthropic.com) para gerar prévias com o Claude.</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 p-3">
          <p className="min-w-0 flex-1 text-sm text-zinc-300">{visualEnabled ? 'Prévias do Claude disponíveis para os visitantes.' : 'Prévias do Claude em validação. A conta da Atlas pode testar antes de liberar para os visitantes.'}</p>
          <a className={button} href="/site-express" target="_blank" rel="noreferrer">Testar uma prévia</a>
          <button type="button" className={button} disabled={Boolean(busy)} onClick={() => void run({ action: 'visualEnabled', visualEnabled: !visualEnabled }, visualEnabled ? 'Prévia do Claude reservada à conta da Atlas.' : 'Prévia do Claude liberada para os visitantes.')}>{visualEnabled ? 'Reservar para testes' : 'Liberar para visitantes'}</button>
        </div>
        <form className="mt-4 space-y-3" onSubmit={event => {
          event.preventDefault();
          void run({ action: 'visualPrompt', visualPrompt }, 'Instruções salvas. As próximas prévias usarão este prompt.');
        }}>
          <label className="block text-sm font-medium" htmlFor="express-visual-prompt">Suas instruções para o Claude</label>
          <textarea id="express-visual-prompt" className={input + ' block min-h-80 w-full leading-relaxed'} value={visualPrompt}
            onChange={event => setVisualPrompt(event.target.value)} required maxLength={8000} rows={14} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-zinc-400">{visualPrompt.length.toLocaleString('pt-BR')} / 8.000 caracteres · {visualPrompt !== savedPrompt ? 'Alterações não salvas' : 'Instruções atuais'}</p>
            <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={Boolean(busy)} onClick={() => setVisualPrompt(DEFAULT_VISUAL_PROMPT)}>Usar sugestão da Atlas</button>
              <button className={button + ' border-[#E2B755]/60 text-[#E2B755]'} disabled={Boolean(busy) || !visualPrompt.trim() || visualPrompt === savedPrompt}>Salvar instruções</button></div>
          </div>
          <p className="text-xs leading-relaxed text-zinc-500">Cada prévia guarda as instruções usadas na geração. O prompt se aplica ao visual; preço e condições do pacote continuam definidos pela Atlas.</p>
        </form>
        <form className="mt-4 flex flex-wrap items-end gap-2 border-t border-white/10 pt-4" onSubmit={event => {
          event.preventDefault(); let id = resumeLink.trim(); try { id = new URL(id).searchParams.get('previa') || id; } catch {}
          void run({ action: 'visualResume', id }, 'Geração retomada. Abra novamente o link da prévia para acompanhar.');
        }}>
          <label className="min-w-0 flex-1 text-sm text-zinc-300">Retomar uma prévia interrompida<input className={input + ' mt-1 block w-full'} value={resumeLink} onChange={event => setResumeLink(event.target.value)} placeholder="Cole o link da prévia" required /></label>
          <button className={button} disabled={Boolean(busy) || !resumeLink.trim()}>Retomar prévia</button>
        </form>
      </details>
      {!busy && !error && !visible.length && <p className="text-sm text-zinc-400">Nenhum pedido neste filtro.</p>}
      <div className="grid gap-4">
        {visible.map(order => (
          <article key={order.id} className="space-y-3 rounded-xl border border-white/10 bg-zinc-900/65 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="break-words text-lg font-semibold">{order.business.name}</h3>
                <p className="text-sm text-zinc-400">{order.business.segment} · {order.business.city} · {expressMoney(order.amount)}</p>
              </div>
              <p className="rounded-full bg-[#E2B755]/15 px-3 py-1 text-sm font-semibold text-[#E2B755]">{labels[order.status]}{order.mode === 'test' ? ' · Teste' : ''}</p>
            </div>
            <p className="break-words text-sm text-zinc-300">{order.email} · +{order.business.whatsapp}</p>
            <p className="break-words text-sm text-zinc-300">{order.business.services}</p>
            {Boolean(order.business.assets?.length) && <details className="rounded-lg border border-white/10 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-[#E2B755]">Fotos e logo do projeto ({order.business.assets!.length})</summary>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{order.business.assets!.map(asset => <a key={asset.id} href={asset.url + '&download=1'} className="overflow-hidden rounded-lg border border-white/15" target="_blank" rel="noreferrer">
                <img src={asset.url} alt={asset.kind === 'logo' ? 'Logo enviada pelo cliente' : asset.name} className={`h-28 w-full ${asset.kind === 'logo' ? 'bg-white p-2 object-contain' : 'object-cover'}`} />
                <span className="block truncate p-2 text-xs">{asset.kind === 'logo' ? 'Logo' : 'Foto'} · Baixar arquivo</span>
              </a>)}</div>
            </details>}
            {order.dueAt && <p className={isOpen(order) && order.dueAt <= Date.now() ? 'text-sm text-red-300' : 'text-sm text-zinc-300'}>
              Prazo {expressDate(order.dueAt)}{isOpen(order) && order.dueAt <= Date.now() ? ' · Vencido' : ''}
            </p>}
            {order.deliveredAt && <p className="text-sm text-zinc-300">Enviado em {expressDate(order.deliveredAt)}</p>}
            <div className="flex flex-wrap items-center gap-2">
              <a className={button + ' inline-flex items-center gap-2'} href={`/site-express?previa=${order.previewId}`} target="_blank" rel="noreferrer">Abrir prévia <ExternalLink size={13} /></a>
              {order.status === 'paid' && <button className={button} disabled={Boolean(busy)} onClick={() => void run({ action: 'production', id: order.id }, 'Pedido em produção.')}>Iniciar produção</button>}
              {(isOpen(order) || order.status === 'delivered') && !order.receiptSentAt &&
                <button className={button} disabled={Boolean(busy)} onClick={() => void run({ action: 'receipt', id: order.id }, 'Confirmação enviada.')}>Enviar confirmação</button>}
              {order.status === 'delivered' && order.finalUrl && <>
                <a className={button + ' inline-flex items-center gap-2'} href={order.finalUrl} target="_blank" rel="noreferrer">Abrir site final <ExternalLink size={13} /></a>
                <button className={button} disabled={Boolean(busy)} onClick={() => void run({ action: 'resend', id: order.id }, 'E-mail reenviado.')}>Reenviar entrega</button>
              </>}
            </div>
            {(isOpen(order) || order.status === 'delivered') && <ExpressSiteFinalizer key={order.id + (order.siteVersion || 0)} order={order} run={run} busy={Boolean(busy)} claudeReady={claudeReady} domainAutomatic={domainAutomatic} />}
            {isOpen(order) && <form className="flex flex-wrap gap-2" onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void run({ action: 'deliver', id: order.id, finalUrl: data.get('finalUrl') }, 'Entrega enviada por e-mail.');
            }}>
              <input name="finalUrl" aria-label="Link HTTPS do site final" required type="url" placeholder="https://…"
                key={order.siteUrl || order.deliveryUrl} defaultValue={order.deliveryUrl || (order.siteDomain ? `https://${order.siteDomain}` : order.siteUrl)} maxLength={800} className={input + ' flex-1 basis-48'} />
              <button className={button} disabled={Boolean(busy)}>Enviar entrega</button>
            </form>}
          </article>
        ))}
      </div>
    </section>
  );
}
