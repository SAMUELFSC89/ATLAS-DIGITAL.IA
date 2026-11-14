import { useEffect, useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ApiError, getSiteContacts } from '../lib/radarApi';
import type { SiteContact } from '../lib/contact';

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

export default function SiteContacts() {
  const [open, setOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const [contacts, setContacts] = useState<SiteContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  function refresh() {
    setLoading(true);
    setError('');
    setNeedsVerification(false);
    setRevision(value => value + 1);
  }

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    getSiteContacts(controller.signal).then(({ contacts }) => {
      if (!controller.signal.aborted) setContacts(contacts);
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setNeedsVerification(error instanceof ApiError && error.code === 'email_unverified');
      setError(error instanceof ApiError ? error.message : 'Não foi possível carregar os contatos do site.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [open, revision]);

  async function verifyEmail() {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await sendEmailVerification(user);
      setVerificationMessage('Enviamos o link por e-mail. Depois de confirmar, clique em Atualizar.');
    } catch {
      setVerificationMessage('Não foi possível enviar o link agora. Tente novamente em instantes.');
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 sm:p-5" aria-labelledby="site-contacts-toggle">
      <button id="site-contacts-toggle" type="button" aria-expanded={open} aria-controls="site-contacts-panel" className="font-semibold text-[#e2b755] hover:underline" onClick={() => {
        if (!open) refresh();
        setOpen(!open);
      }}>Contatos do site</button>
      <div id="site-contacts-panel" hidden={!open} className="mt-4 space-y-3 text-sm text-slate-300">
        <button type="button" onClick={refresh} disabled={loading} className="underline underline-offset-4 disabled:opacity-60">Atualizar</button>
        {loading && <p role="status">Carregando contatos…</p>}
        {error && <p role="alert">{error}</p>}
        {needsVerification && <button type="button" onClick={verifyEmail} className="text-[#e2b755] underline underline-offset-4">Enviar link de confirmação</button>}
        {verificationMessage && needsVerification && <p role="status">{verificationMessage}</p>}
        {!loading && !error && (contacts.length ? (
          <ul className="max-h-96 divide-y divide-slate-800 overflow-auto">
            {contacts.map(contact => (
              <li key={contact.id} className="space-y-1 py-3 break-words">
                <p className="font-semibold text-white">{contact.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <a className="hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a>
                  <a className="hover:underline" href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer">+{contact.whatsapp}</a>
                </div>
                <p className="text-xs text-slate-400">
                  {dateFormat.format(new Date(contact.createdAt))}
                  {contact.campaign.utm_source && ` · ${contact.campaign.utm_source}`}
                  {contact.campaign.utm_campaign && ` · ${contact.campaign.utm_campaign}`}
                </p>
              </li>
            ))}
          </ul>
        ) : <p>Nenhum contato recebido.</p>)}
      </div>
    </section>
  );
}
