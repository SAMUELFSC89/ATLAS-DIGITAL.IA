import { useEffect, useState, type FormEvent } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { auth } from '../lib/firebase';
import { expressDate, expressMoney, type ExpressOrder, type ExpressStatus } from '../lib/expressOrder';

type PanelOrder = ExpressOrder & { mode?: 'test' | 'live'; deliveryUrl?: string };
type List = { orders: PanelOrder[]; capacity: number };

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
  const [filter, setFilter] = useState<'active' | 'all' | ExpressStatus>('active');
  const [busy, setBusy] = useState('load');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const data = await request<List>();
    setOrders(data.orders);
    setCapacity(String(data.capacity));
  }

  useEffect(() => {
    let active = true;
    request<List>().then(data => {
      if (active) { setOrders(data.orders); setCapacity(String(data.capacity)); }
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
            {isOpen(order) && <form className="flex flex-wrap gap-2" onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void run({ action: 'deliver', id: order.id, finalUrl: data.get('finalUrl') }, 'Entrega enviada por e-mail.');
            }}>
              <input name="finalUrl" aria-label="Link HTTPS do site final" required type="url" placeholder="https://…"
                defaultValue={order.deliveryUrl} maxLength={800} className={input + ' flex-1 basis-48'} />
              <button className={button} disabled={Boolean(busy)}>Enviar entrega</button>
            </form>}
          </article>
        ))}
      </div>
    </section>
  );
}
