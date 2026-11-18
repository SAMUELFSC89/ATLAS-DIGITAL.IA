import { useState } from 'react';
import { ExternalLink, Globe2, LoaderCircle, Sparkles } from 'lucide-react';
import ExpressAssetUpload from './ExpressAssetUpload';
import type { ExpressAsset, ExpressOrder } from '../lib/expressOrder';

export type FinalizerOrder = ExpressOrder & { siteNotes?: string; siteUrl?: string; siteVersion?: number; siteFinalAt?: number; siteDomain?: string };
type Run = (action: object, success: string) => Promise<unknown>;

const button = 'rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:border-[#E2B755] disabled:opacity-50';
const input = 'min-w-0 rounded-lg border border-white/20 bg-black/35 px-3 py-2 text-sm text-white';

/** Production area of a paid order: client adjustments, photos, final generation with Claude and the client domain. */
export default function ExpressSiteFinalizer({ order, run, busy, claudeReady, domainAutomatic }: {
  key?: string; order: FinalizerOrder; run: Run; busy: boolean; claudeReady: boolean; domainAutomatic: boolean;
}) {
  const [notes, setNotes] = useState(order.siteNotes || '');
  const [assets, setAssets] = useState<ExpressAsset[]>(order.business.assets || []);
  const [session] = useState(() => ({ projectId: crypto.randomUUID(), writeKey: crypto.randomUUID() }));
  const [uploading, setUploading] = useState(false);
  const [domain, setDomain] = useState(order.siteDomain || '');
  const [finalizing, setFinalizing] = useState(false);
  const assetsChanged = assets.map(a => a.id).join() !== (order.business.assets || []).map(a => a.id).join();

  async function finalize() {
    setFinalizing(true);
    try {
      if (notes !== (order.siteNotes || '')) await run({ action: 'siteNotes', id: order.id, notes }, 'Ajustes salvos.');
      await run({ action: 'finalize', id: order.id }, 'Site finalizado e publicado. Revise o link antes de enviar a entrega.');
    } finally { setFinalizing(false); }
  }

  return <details className="rounded-lg border border-[#E2B755]/30 bg-black/20 p-3" open={!order.siteUrl}>
    <summary className="cursor-pointer text-sm font-semibold text-[#E2B755]">Finalizar site {order.siteVersion ? `· versão ${order.siteVersion} publicada` : ''}</summary>
    <div className="mt-4 space-y-5">
      <form className="space-y-2" onSubmit={event => { event.preventDefault(); void run({ action: 'siteNotes', id: order.id, notes }, 'Ajustes salvos.'); }}>
        <label className="block text-sm font-medium" htmlFor={`notes-${order.id}`}>Ajustes necessários</label>
        <textarea id={`notes-${order.id}`} className={input + ' block min-h-32 w-full leading-relaxed'} value={notes} maxLength={6000}
          onChange={event => setNotes(event.target.value)} placeholder="Ex.: trocar o título do topo, incluir horário de atendimento, usar azul-marinho como cor principal, destacar o serviço de bancadas…" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-zinc-500">{notes.length.toLocaleString('pt-BR')} / 6.000 · {notes !== (order.siteNotes || '') ? 'Alterações não salvas' : 'Salvo'}</p>
          <button className={button} disabled={busy || notes === (order.siteNotes || '')}>Salvar ajustes</button>
        </div>
      </form>

      <div className="space-y-3">
        <ExpressAssetUpload assets={assets} session={session} onChange={setAssets} onBusy={setUploading} disabled={busy} />
        <button type="button" className={button} disabled={busy || uploading || !assetsChanged}
          onClick={() => void run({ action: 'siteAssets', id: order.id, assetIds: assets.map(a => a.id), ...session }, 'Fotos do projeto atualizadas.')}>Salvar fotos e logo</button>
      </div>

      <div className="space-y-2 border-t border-white/10 pt-4">
        {!claudeReady && <p className="rounded-lg border border-amber-300/20 bg-amber-900/15 p-3 text-sm text-amber-200">Cadastre ANTHROPIC_API_KEY na Vercel para finalizar com o Claude.</p>}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={button + ' inline-flex items-center gap-2 border-[#E2B755]/60 text-[#E2B755]'} disabled={busy || uploading || !claudeReady || assetsChanged} onClick={() => void finalize()}>
            {finalizing ? <LoaderCircle size={15} className="animate-spin" /> : <Sparkles size={15} />}{order.siteUrl ? 'Gerar nova versão' : 'Finalizar site com o Claude'}
          </button>
          {order.siteUrl && <a className={button + ' inline-flex items-center gap-2'} href={order.siteUrl} target="_blank" rel="noreferrer">Abrir site publicado <ExternalLink size={13} /></a>}
        </div>
        <p className="text-xs leading-relaxed text-zinc-500">{finalizing ? 'O Claude está montando a versão final com os ajustes e as fotos. Isso leva de 2 a 4 minutos; não feche esta página.'
          : assetsChanged ? 'Salve as fotos antes de finalizar.'
            : 'Usa a prévia aprovada, os ajustes e as fotos acima. Revise o site publicado e depois envie a entrega ao cliente.'}</p>
      </div>

      {order.siteUrl && <form className="space-y-2 border-t border-white/10 pt-4" onSubmit={event => { event.preventDefault(); void run({ action: 'domain', id: order.id, domain }, 'Domínio conectado ao site.'); }}>
        <label className="flex items-center gap-2 text-sm font-medium" htmlFor={`domain-${order.id}`}><Globe2 size={15} /> Domínio do cliente</label>
        <div className="flex flex-wrap gap-2">
          <input id={`domain-${order.id}`} className={input + ' flex-1 basis-48'} value={domain} onChange={event => setDomain(event.target.value)} placeholder="suaempresa.com.br" maxLength={253} />
          <button className={button} disabled={busy || !domain.trim() || domain.trim().toLowerCase() === order.siteDomain}>{order.siteDomain ? 'Trocar domínio' : 'Conectar domínio'}</button>
        </div>
        {order.siteDomain && <div className="rounded-lg border border-white/10 p-3 text-xs leading-relaxed text-zinc-300">
          <p className="font-semibold text-white">{order.siteDomain} → este site</p>
          {!domainAutomatic && <p className="mt-1 text-amber-200">Adicione {order.siteDomain} em Vercel → atlas-digital-ia → Settings → Domains (ou cadastre VERCEL_TOKEN e VERCEL_PROJECT_ID para automatizar).</p>}
          <p className="mt-2">No registro do domínio (ex.: Registro.br), configure o DNS:</p>
          <p className="mt-1 font-mono">A · @ · 76.76.21.21</p>
          <p className="font-mono">CNAME · www · cname.vercel-dns.com</p>
          <p className="mt-2 text-zinc-500">Depois que o DNS propagar, use https://{order.siteDomain} como link de entrega.</p>
        </div>}
      </form>}
    </div>
  </details>;
}
