import { useState } from 'react';
import NovaHome from './NovaHome';
import InteractiveContactModal from '../components/InteractiveContactModal';
import LegalModals, { LegalDocType } from '../components/LegalModals';

/*
  Página inicial ("/") carregada sozinha, sem o código da área do cliente, CRM e Firebase.
  Assim ela abre bem mais rápido. "Entrar" leva para a área do cliente em /solucoes?entrar=1.
*/
export default function HomeShell() {
  const [contatoAberto, setContatoAberto] = useState(false);
  const [assunto, setAssunto] = useState('');
  const [docLegal, setDocLegal] = useState<LegalDocType>(null);

  return (
    <>
      <NovaHome
        onPedirOrcamento={(texto: string) => { setAssunto(texto); setContatoAberto(true); }}
        onEntrar={() => { window.location.href = '/solucoes?entrar=1'; }}
        onDocLegal={setDocLegal}
      />
      <InteractiveContactModal isOpen={contatoAberto} onClose={() => setContatoAberto(false)} prefilledSubject={assunto} />
      <LegalModals activeDoc={docLegal} onClose={() => setDocLegal(null)} />
    </>
  );
}
