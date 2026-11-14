import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Globe, LoaderCircle, MessageCircle, Search } from 'lucide-react';
import AtlasLogo from './AtlasLogo';
import LegalModals from './LegalModals';
import { CONTACT_CAMPAIGN_KEYS, CONTACT_WHATSAPP_URL, normalizeBrazilianWhatsApp } from '../lib/contact';

const inputClass = 'w-full rounded-xl border border-[#344052] bg-[#0d1520] px-4 py-3 text-base text-white placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e2b755]';

export default function ContactPage() {
  const pendingRequest = useRef<{ id: string; contact: string }>(null);
  const submitInProgress = useRef(false);
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const whatsappLink = useRef<HTMLAnchorElement>(null);
  const privacyButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!saved) return;
    whatsappLink.current?.focus();
    const navigation = window.setTimeout(() => window.location.assign(CONTACT_WHATSAPP_URL), 650);
    return () => window.clearTimeout(navigation);
  }, [saved]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitInProgress.current || saved) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name')).trim();
    const email = String(data.get('email')).trim();
    const whatsapp = String(data.get('whatsapp')).trim();
    if (name.length < 2 || !normalizeBrazilianWhatsApp(whatsapp)) {
      setError('Confira seu nome e informe um WhatsApp válido com DDD.');
      return;
    }

    submitInProgress.current = true;
    setSending(true);
    setError('');
    try {
      const contact = JSON.stringify([name, email, normalizeBrazilianWhatsApp(whatsapp)]);
      if (pendingRequest.current?.contact !== contact) {
        pendingRequest.current = { id: crypto.randomUUID(), contact };
      }
      const search = new URLSearchParams(window.location.search);
      const campaign = Object.fromEntries(CONTACT_CAMPAIGN_KEYS.flatMap(key => {
        const value = search.get(key);
        return value ? [[key, value.slice(0, 200)]] : [];
      }));
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pendingRequest.current.id, name, email, whatsapp, website: data.get('website'), campaign }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (response.status === 409) pendingRequest.current = null;
      if (!response.ok || result?.ok !== true) {
        setError(result?.error || 'Não foi possível salvar seu contato. Tente novamente.');
        return;
      }
      const tracking = window as Window & { dataLayer?: Array<{ event: string }> };
      (tracking.dataLayer ??= []).push({ event: 'generate_lead' });
      setSaved(true);
    } catch {
      setError('Não foi possível confirmar o envio. Confira sua conexão e tente novamente.');
    } finally {
      submitInProgress.current = false;
      setSending(false);
    }
  }

  function closePrivacy() {
    setShowPrivacy(false);
    privacyButton.current?.focus();
  }

  return (
    <div className="min-h-screen bg-[#090d14] text-white font-sans flex flex-col">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="/" aria-label="Atlas Digital, início"><AtlasLogo showSubtitle={false} /></a>
          <a href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white">
            <ArrowLeft aria-hidden="true" className="size-4" /> Voltar ao site
          </a>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-9 px-5 py-9 sm:px-8 sm:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-20">
        <section className="max-w-xl">
          <p className="mb-3 text-sm font-semibold text-[#e2b755]">Fale com a Atlas Digital</p>
          <h1 className="font-display text-[clamp(2rem,6vw,4.15rem)] leading-[1.08] font-extrabold tracking-tight">
            Um site que ajuda sua empresa a <span className="text-[#e2b755]">receber mais orçamentos.</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
            Quer criar seu primeiro site ou melhorar o que já tem? Conte o que sua empresa precisa e converse com a Atlas pelo WhatsApp.
          </p>
          <ul className="mt-7 hidden flex-wrap gap-x-5 gap-y-3 border-t border-white/10 pt-5 text-sm text-slate-300 sm:flex">
            <li className="inline-flex items-center gap-2"><Globe aria-hidden="true" className="size-4 text-[#e2b755]" /> Criação de sites</li>
            <li className="inline-flex items-center gap-2"><Search aria-hidden="true" className="size-4 text-[#e2b755]" /> Presença no Google</li>
            <li className="inline-flex items-center gap-2"><MessageCircle aria-hidden="true" className="size-4 text-[#e2b755]" /> Atendimento pelo WhatsApp</li>
          </ul>
        </section>

        <section aria-labelledby="contact-title" className="rounded-3xl border border-white/12 bg-[#131d2a] p-5 shadow-2xl shadow-black/25 sm:p-8">
          {saved ? (
            <div className="py-2 sm:py-5">
              <CheckCircle2 aria-hidden="true" className="mb-4 size-9 text-[#e2b755]" />
              <h2 id="contact-title" className="font-display text-2xl font-bold">Contato recebido</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300" role="status">Abrindo o WhatsApp da Atlas com uma mensagem pronta para você enviar.</p>
              <a ref={whatsappLink} href={CONTACT_WHATSAPP_URL} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#e2b755] px-4 font-bold text-[#111827] hover:bg-[#f2cd78]">
                Abrir WhatsApp <ArrowRight aria-hidden="true" className="size-4" />
              </a>
            </div>
          ) : (
            <>
              <h2 id="contact-title" className="font-display text-2xl font-bold">Solicite um orçamento</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">Preencha seus dados para continuar no WhatsApp.</p>
              <form className="mt-6 space-y-4" onSubmit={submit}>
                <div>
                  <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium">Nome</label>
                  <input id="contact-name" name="name" autoComplete="name" placeholder="Seu nome" className={inputClass} required minLength={2} maxLength={100} readOnly={sending} />
                </div>
                <div>
                  <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium">E-mail</label>
                  <input id="contact-email" name="email" type="email" autoComplete="email" placeholder="nome@empresa.com.br" className={inputClass} required maxLength={254} readOnly={sending} />
                </div>
                <div>
                  <label htmlFor="contact-whatsapp" className="mb-1.5 block text-sm font-medium">WhatsApp com DDD</label>
                  <input id="contact-whatsapp" name="whatsapp" type="tel" autoComplete="tel" placeholder="(51) 99999-9999" className={inputClass} required maxLength={24} readOnly={sending} />
                </div>
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="contact-website">Site</label>
                  <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
                </div>
                {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
                <button type="submit" disabled={sending} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e2b755] px-4 py-3 font-bold text-[#111827] hover:bg-[#f2cd78] disabled:opacity-70">
                  {sending ? <LoaderCircle aria-hidden="true" className="size-5 motion-safe:animate-spin" /> : <MessageCircle aria-hidden="true" className="size-5" />}
                  {sending ? 'Salvando contato…' : 'Enviar e abrir WhatsApp'}
                </button>
                <p className="text-xs leading-relaxed text-slate-300">
                  A Atlas usa seus dados para responder ao seu pedido. Leia a{' '}
                  <button type="button" ref={privacyButton} onClick={() => setShowPrivacy(true)} className="text-[#ebc875] underline underline-offset-2">Política de Privacidade</button>.
                </p>
              </form>
            </>
          )}
        </section>
      </main>
      <footer className="border-t border-white/10 px-5 py-4 text-center text-xs text-slate-400">Atlas Digital · Porto Alegre, RS</footer>
      <LegalModals activeDoc={showPrivacy ? 'privacidade' : null} onClose={closePrivacy} />
    </div>
  );
}
