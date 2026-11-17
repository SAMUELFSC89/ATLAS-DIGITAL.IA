import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock, ExternalLink, Globe2, LoaderCircle, Sparkles } from 'lucide-react';
import AtlasLogo from './AtlasLogo';
import ExpressVisualGallery from './ExpressVisualGallery';
import ExpressAssetUpload from './ExpressAssetUpload';
import { auth } from '../lib/firebase';
import { EXPRESS_HOURS, EXPRESS_PRICE, EXPRESS_WHATSAPP, expressDate, expressMoney, type ExpressAsset, type ExpressBusiness, type ExpressPreview, type ExpressStatus } from '../lib/expressOrder';

const blank: ExpressBusiness = { name: '', segment: '', city: '', services: '', whatsapp: '', photo: '' };
const inputStyle = 'w-full rounded-xl border border-white/15 bg-black/25 px-3.5 py-3 text-sm text-white outline-none focus:border-[#E2B755]';
const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#E2B755] px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-[#f2cb72] disabled:opacity-50';
const secondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:border-[#E2B755] disabled:opacity-50';

async function api<T>(query: string, body?: object): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (query === 'view=config' || query === 'view=generate') {
    await auth.authStateReady();
    if (auth.currentUser) headers.Authorization = 'Bearer ' + await auth.currentUser.getIdToken();
  }
  const response = await fetch('/api/site-express?' + query, body ? {
    method: 'POST', headers, body: JSON.stringify(body),
  } : { headers });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error || 'Não foi possível concluir agora.');
  return data;
}

export default function SiteExpressPage() {
  const [assets, setAssets] = useState<ExpressAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSession] = useState(() => ({ projectId: crypto.randomUUID(), writeKey: crypto.randomUUID() }));
  const [business, setBusiness] = useState(blank);
  const [preview, setPreview] = useState<ExpressPreview | null>(null);
  const [order, setOrder] = useState<{ status: ExpressStatus; dueAt?: number } | null>(null);
  const [projectType, setProjectType] = useState<'express' | 'custom'>('express');
  const [checkout, setCheckout] = useState(false);
  const [sandbox, setSandbox] = useState(false);
  const [email, setEmail] = useState('');
  const [acceptsScope, setAcceptsScope] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(false);
  const [brandColor, setBrandColor] = useState('');
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [visualAvailable, setVisualAvailable] = useState(false);
  const [orderId] = useState(() => new URLSearchParams(location.search).get('pedido'));

  useEffect(() => {
    let mounted = true;
    api<{ checkout: boolean; sandbox: boolean; visualAvailable?: boolean }>('view=config').then(config => {
      if (mounted) { setCheckout(config.checkout); setSandbox(config.sandbox); setVisualAvailable(config.visualAvailable === true); }
    }).catch(() => {});
    const draft = new URLSearchParams(location.search).get('previa');
    if (draft && !orderId) {
      setBusy('loading');
      api<ExpressPreview>('id=' + encodeURIComponent(draft)).then(saved => {
        if (mounted) { setPreview(saved); setBusiness(saved.business); setAssets(saved.business.assets || []); }
      }).catch(e => { if (mounted) setError(e.message); }).finally(() => { if (mounted) setBusy(''); });
    }
    return () => { mounted = false; };
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const checkoutReturn = new URLSearchParams(location.search);
    const statusParams = new URLSearchParams({ view: 'order', id: orderId });
    const paymentId = checkoutReturn.get('payment_id') || checkoutReturn.get('collection_id');
    if (paymentId && /^\d{1,25}$/.test(paymentId)) statusParams.set('paymentId', paymentId);
    let active = true;
    let timer: number;
    let attempts = 0;
    async function check() {
      try {
        const result = await api<{ status: ExpressStatus; dueAt?: number }>(statusParams.toString());
        if (!active) return;
        setOrder(result);
        setError('');
        if (result.status === 'pending' && ++attempts < 12) timer = window.setTimeout(check, 4000);
      } catch (e) { if (active) setError((e as Error).message); }
    }
    void check();
    return () => { active = false; clearTimeout(timer); };
  }, [orderId]);

  function update(key: keyof ExpressBusiness, value: string) {
    setBusiness(previous => ({ ...previous, [key]: value }));
  }

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (uploading) return;
    setBusy('generate'); setError(''); setNotice('');
    try {
      const result = await api<ExpressPreview>('view=generate', { business, brandColor, device, visual: visualAvailable,
        ...uploadSession, assetIds: assets.map(asset => asset.id), sourcePreviewId: preview?.id });
      setPreview(result);
      setBusiness(result.business);
      setAssets(result.business.assets || []);
      setEditing(false);
      history.replaceState(null, '', '/site-express?previa=' + result.id);
      window.scrollTo(0, 0);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(''); }
  }

  async function buy(event: FormEvent) {
    event.preventDefault();
    if (!preview) return;
    setBusy('checkout'); setError('');
    try {
      const storageKey = 'atlas-express-checkout/' + preview.id;
      const existing = sessionStorage.getItem(storageKey);
      const id = existing || crypto.randomUUID();
      sessionStorage.setItem(storageKey, id);
      const { url } = await api<{ url: string }>('view=checkout', { previewId: preview.id, id, email: email.trim(), acceptsScope, projectType });
      location.assign(url);
    } catch (e) {
      const message = (e as Error).message;
      if (/expirou/.test(message)) sessionStorage.removeItem('atlas-express-checkout/' + preview.id);
      setError(message);
    } finally { setBusy(''); }
  }

  const whatsappMessage = preview
    ? `Olá, Atlas! Quero falar sobre o Site Express de ${preview.business.name}. Prévia: ${location.origin}/site-express?previa=${preview.id}`
    : `Olá, Atlas! Gostaria de ajuda com o Site Express${orderId ? ', pedido ' + orderId : ''}.`;
  const contact = EXPRESS_WHATSAPP + '?text=' + encodeURIComponent(whatsappMessage);
  const quote = EXPRESS_WHATSAPP + '?text=' + encodeURIComponent(preview
    ? `Olá, Atlas! Quero um orçamento personalizado para ${preview.business.name}. Minha prévia: ${location.origin}/site-express?previa=${preview.id}`
    : 'Olá, Atlas! Quero solicitar um orçamento para um site personalizado.');

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
          <a href="/" aria-label="Atlas Digital, início"><AtlasLogo /></a>
          <a href="/" className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white"><ArrowLeft size={16} /> Voltar à Atlas</a>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        {busy === 'loading' && <p role="status" className="text-zinc-300">Carregando sua prévia…</p>}
        {orderId ? (
          <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-[#121418] p-7 md:p-10">
            <span className="mb-4 inline-flex rounded-full bg-[#E2B755]/15 p-3 text-[#E2B755]">{order?.dueAt ? <Check /> : <Clock />}</span>
            <h1 className="font-display text-3xl font-bold">{order?.status === 'delivered' ? 'Seu site foi entregue' :
              order?.status === 'expired' ? 'Checkout expirado' : order?.status === 'refunded' ? 'Pedido reembolsado' :
              order?.dueAt ? 'Pagamento confirmado' : 'Aguardando confirmação do pagamento'}</h1>
            <p className="mt-3 text-zinc-300">Pedido <span className="break-all">{orderId}</span></p>
            {order?.dueAt && ['paid', 'production'].includes(order.status) &&
              <p className="mt-2 text-zinc-300">Entrega por e-mail até {expressDate(order.dueAt)}, no horário de Brasília.</p>}
            {order?.status === 'delivered' && <p className="mt-2 text-zinc-300">Confira o link final enviado para o e-mail informado na compra.</p>}
            {!order?.dueAt && !['expired', 'refunded'].includes(order?.status || '') &&
              <p className="mt-2 text-zinc-300">Assim que o pagamento for confirmado, você receberá o prazo por e-mail. Você pode voltar a esta página para consultar.</p>}
            <a href={contact} target="_blank" rel="noreferrer" className={secondary + ' mt-6'}>Falar com a Atlas <ExternalLink size={15} /></a>
          </section>
        ) : preview && !editing ? (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-display text-2xl font-bold">Sua prévia de site</h1>
              <div className="flex flex-wrap gap-2">
                <button className={secondary} onClick={() => setEditing(true)}>Editar dados</button>
                <button className={secondary} onClick={async () => {
                  try { await navigator.clipboard.writeText(location.href); setNotice('Link copiado.'); }
                  catch { setNotice('Copie o endereço da prévia na barra do navegador.'); }
                }}>Copiar link</button>
              </div>
            </div>
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
              {preview.visual ? <ExpressVisualGallery key={preview.id} preview={preview as ExpressPreview & { visual: NonNullable<ExpressPreview['visual']> }} /> : <article className="overflow-hidden rounded-2xl bg-[#ebeee5] text-[#182b23]" aria-label="Prévia do site">
                <div className="flex items-center gap-2 px-5 py-4 text-sm font-bold">{preview.business.assets?.find(asset => asset.kind === 'logo')?.url ? <img src={preview.business.assets.find(asset => asset.kind === 'logo')!.url} alt={`Logo de ${preview.business.name}`} className="h-12 max-w-36 object-contain" /> : <Globe2 size={16} />} {preview.business.name}</div>
                <div className="relative isolate overflow-hidden bg-[#19372c] px-5 py-12 text-white sm:px-8 md:py-16">
                  {preview.business.photo && <>
                    <img className="absolute inset-0 -z-20 h-full w-full object-cover" src={preview.business.photo} alt="" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 -z-10 bg-[#101d18]/75" />
                  </>}
                  <p className="text-xs font-bold uppercase tracking-widest text-[#d4e8b6]">{preview.business.segment} · {preview.business.city}</p>
                  <h2 className="mt-3 max-w-xl break-words font-display text-3xl font-bold leading-tight sm:text-5xl">{preview.title}</h2>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-100">{preview.introduction}</p>
                  <a className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#d4e8b6] px-4 py-2.5 text-sm font-bold text-[#182b23]"
                    href={`https://wa.me/${preview.business.whatsapp}`} target="_blank" rel="noreferrer">Pedir orçamento <ArrowRight size={16} /></a>
                </div>
                {preview.offers.length > 0 && <div className="px-5 py-7 sm:px-8">
                  <h3 className="mb-4 font-display text-xl font-bold">Serviços</h3>
                  <div className="grid gap-3 sm:grid-cols-2">{preview.offers.map((offer, index) => (
                    <div key={index} className="rounded-xl border border-[#19372c]/15 bg-white/55 p-4">
                      <h4 className="font-bold">{offer.title}</h4>
                      <p className="mt-1 text-sm leading-relaxed">{offer.description}</p>
                    </div>
                  ))}</div>
                </div>}
              </article>}
              <aside className="rounded-2xl border border-white/15 bg-[#14161a] p-5">
                <fieldset className="mb-5 space-y-2 border-b border-white/10 pb-4">
                  <legend className="mb-2 text-sm font-bold">Qual tipo de projeto você precisa?</legend>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="project-type" checked={projectType === 'express'} onChange={() => { setProjectType('express'); setAcceptsScope(false); }} />
                    Site de uma página
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="project-type" checked={projectType === 'custom'} onChange={() => { setProjectType('custom'); setAcceptsScope(false); }} />
                    Projeto personalizado
                  </label>
                </fieldset>
                {projectType === 'custom' ? (
                  <>
                    <h2 className="font-display text-xl font-bold">Orçamento personalizado</h2>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300">Para sites com várias páginas, loja virtual, agendamento, integrações ou outras exigências especiais, a Atlas define o valor e o prazo de acordo com o projeto.</p>
                    <a href={quote} target="_blank" rel="noreferrer" className={primary + ' mt-4 w-full'}>Solicitar orçamento <ExternalLink size={14} /></a>
                  </>
                ) : (
                  <>
                    <h2 className="font-display text-xl font-bold">Site Express</h2>
                    <p className="mt-2 text-3xl font-bold text-[#E2B755]">{expressMoney(EXPRESS_PRICE)}</p>
                    <p className="mt-1 text-sm text-zinc-300">Criação de uma página. Pagamento único.</p>
                    <p className="mt-4 flex gap-2 text-sm text-zinc-100"><Clock size={16} className="mt-0.5 shrink-0 text-[#E2B755]" /> Receba por e-mail em até {EXPRESS_HOURS} horas após a confirmação do pagamento.</p>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300">Inclui a entrega do link final com serviços e botão de WhatsApp. Domínio próprio e plano Wix, se desejados, são contratados à parte.</p>
                    {checkout && (
                      <form onSubmit={buy} className="mt-5 space-y-3">
                        {sandbox && <p className="text-sm font-semibold text-[#E2B755]">Mercado Pago em ambiente de teste.</p>}
                        <label className="block text-sm font-medium">E-mail para entrega
                          <input className={inputStyle + ' mt-1'} value={email} onChange={e => setEmail(e.target.value)} required type="email" autoComplete="email" maxLength={254} />
                        </label>
                        <label className="flex items-start gap-2 text-sm text-zinc-300"><input type="checkbox" required checked={acceptsScope} onChange={e => setAcceptsScope(e.target.checked)} className="mt-1" /> Confirmo os dados e quero o pacote de uma página com serviços e WhatsApp.</label>
                        <button className={primary + ' w-full'} disabled={Boolean(busy)}>{busy === 'checkout' ? 'Abrindo checkout…' : `Comprar por ${expressMoney(EXPRESS_PRICE)}`}</button>
                      </form>
                    )}
                    {!checkout && <p className="mt-4 text-sm text-zinc-300">Compra online indisponível. Consulte a Atlas para contratar.</p>}
                    {checkout && <p className="mt-3 text-xs text-zinc-400">Pagamento pelo Mercado Pago.</p>}
                    <a href={contact} target="_blank" rel="noreferrer" className={secondary + ' mt-3 w-full'}>Falar pelo WhatsApp <ExternalLink size={14} /></a>
                  </>
                )}
              </aside>
            </div>
          </>
        ) : busy !== 'loading' && (
          <div className="mx-auto max-w-2xl">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#E2B755]"><Sparkles size={18} /> Atlas Site Express</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Veja como pode ficar o site da sua empresa</h1>
            <p className="mt-4 text-zinc-300">{visualAvailable ? 'Conheça uma proposta visual para sua empresa: quatro telas em imagens de alta qualidade, com uma identidade pensada para o seu ramo.' : 'Gere uma prévia gratuita com os dados do seu negócio.'}</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              Site de uma página por <strong className="text-[#E2B755]">{expressMoney(EXPRESS_PRICE)}</strong>, com entrega por e-mail em até {EXPRESS_HOURS} horas após a aprovação do pagamento.
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              Precisa de várias páginas, loja virtual ou integrações? <a href={quote} target="_blank" rel="noreferrer" className="font-semibold text-[#E2B755] underline underline-offset-4">Solicite um orçamento personalizado</a>.
            </p>
            <form onSubmit={generate} className="mt-7 space-y-5 rounded-3xl border border-white/10 bg-[#14161a] p-5 sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  ['name', 'Nome da empresa', 100], ['segment', 'Ramo de atuação', 80],
                  ['city', 'Cidade', 100], ['whatsapp', 'WhatsApp com DDD', 25],
                ] as const).map(([key, label, max]) => (
                  <label className="text-sm font-medium" key={key}>{label}
                    <input required className={inputStyle + ' mt-1'} value={business[key]} onChange={e => update(key, e.target.value)} maxLength={max} inputMode={key === 'whatsapp' ? 'tel' : 'text'} />
                  </label>
                ))}
              </div>
              <label className="block text-sm font-medium">Principais serviços
                <textarea className={inputStyle + ' mt-1'} value={business.services} onChange={e => update('services', e.target.value)} required maxLength={500} rows={3} placeholder="Ex.: Banho e tosa, hidratação e corte de unhas" />
              </label>
              <ExpressAssetUpload assets={assets} session={uploadSession} onChange={setAssets} onBusy={setUploading} disabled={Boolean(busy)} />
              {visualAvailable && <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">Cor principal da marca (opcional)
                  <input className={inputStyle + ' mt-1'} value={brandColor} onChange={e => setBrandColor(e.target.value)} pattern="#[a-fA-F0-9]{6}" maxLength={7} placeholder="#123456" />
                  <span className="mt-1 block text-xs font-normal text-zinc-500">Deixe em branco para uma sugestão adequada ao seu setor.</span>
                </label>
                <label className="block text-sm font-medium">Formato das imagens
                  <select className={inputStyle + ' mt-1 bg-[#14161a]'} value={device} onChange={e => setDevice(e.target.value as 'mobile' | 'desktop')}>
                    <option value="mobile">Mobile · foco no celular</option><option value="desktop">Desktop · tela ampla</option>
                  </select>
                </label>
              </div>}
              <p className="text-xs leading-relaxed text-zinc-400">A criação da prévia pode levar alguns minutos. Envie dados e imagens da sua empresa: qualquer pessoa com o link poderá abrir a prévia.</p>
              <button className={primary} disabled={Boolean(busy) || uploading}>{uploading ? <><LoaderCircle className="animate-spin" size={16} /> Enviando imagens…</> : busy === 'generate' ? <><LoaderCircle className="animate-spin" size={16} /> Preparando sua prévia…</> : <>Gerar prévia <ArrowRight size={17} /></>}</button>
            </form>
          </div>
        )}
        {error && <p role="alert" className="mx-auto mt-4 max-w-2xl rounded-xl border border-red-400/30 bg-red-950/60 p-3 text-sm text-red-100">{error}</p>}
        {notice && <p role="status" className="mx-auto mt-4 max-w-2xl rounded-xl border border-emerald-300/30 bg-emerald-950/60 p-3 text-sm text-emerald-100">{notice}</p>}
      </main>
    </div>
  );
}
