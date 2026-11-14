import { useEffect } from 'react';
import { CheckCircle2, FileText, MapPin, MessageCircle, MonitorSmartphone, Search } from 'lucide-react';
import { AtlasLogoIcon } from './AtlasLogo';

/** Endereço da página de destino dos anúncios. */
export const ADS_LANDING_PATH = '/mais-clientes';

const WHATSAPP_NUMBER = '5551994578544';
const WHATSAPP_MESSAGE = 'Olá! Vi o anúncio da Atlas Digital e quero o diagnóstico gratuito da minha empresa.';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const DELIVERABLES = [
  {
    icon: Search,
    title: 'Diagnóstico da sua posição no Google',
    text: 'Mostramos em que lugar a sua empresa aparece quando alguém procura o seu serviço na sua cidade, e quem está na frente.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Site que gera pedido de orçamento',
    text: 'Página rápida no celular, com seus serviços, fotos dos trabalhos e botão de WhatsApp sempre à mão.',
  },
  {
    icon: MapPin,
    title: 'Perfil do Google ajustado',
    text: 'Categoria, horário, fotos e rotina de avaliações organizados para a empresa subir na busca local.',
  },
];

const STEPS = [
  { title: 'Você chama no WhatsApp', text: 'Diga o nome da empresa e a cidade. Leva um minuto.' },
  { title: 'Recebe o diagnóstico em PDF', text: 'Com a nota da empresa, o motivo da nota e o que corrigir primeiro.' },
  { title: 'Decide se quer seguir', text: 'Se fizer sentido, apresentamos a proposta. Se não, o diagnóstico fica com você.' },
];

const SEGMENTS = ['Marmorarias', 'Vidraçarias', 'Móveis planejados', 'Energia solar', 'Clínicas', 'Oficinas', 'Serralherias', 'Serviços locais'];

const QUESTIONS = [
  { question: 'O diagnóstico é pago?', answer: 'Não. O diagnóstico é gratuito e não obriga a contratar nada.' },
  { question: 'Preciso já ter um site?', answer: 'Não. O diagnóstico funciona com ou sem site: ele parte do perfil da empresa no Google.' },
  { question: 'Vocês atendem a minha cidade?', answer: 'Sim. Atendemos empresas de todo o Brasil por WhatsApp e videochamada, e presencialmente na Grande Porto Alegre.' },
];

function WhatsAppButton({ label, className = '' }: { label: string; className?: string }) {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-4 text-sm font-bold text-black transition-colors hover:bg-emerald-400 ${className}`}
    >
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
      {label}
    </a>
  );
}

export default function AdsLandingPage() {
  useEffect(() => {
    document.title = 'Mais clientes pelo WhatsApp | Atlas Digital';
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.appendChild(description);
    }
    description.content = 'Diagnóstico gratuito da posição da sua empresa no Google. A Atlas Digital cria o site e ajusta o perfil para gerar pedidos de orçamento no WhatsApp.';
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B0E] pb-24 font-sans text-white sm:pb-0">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <a href="/" className="flex items-center gap-2.5" aria-label="Atlas Digital, página inicial">
          <AtlasLogoIcon className="h-9 w-9" />
          <span className="font-display text-base font-extrabold tracking-tight">Atlas Digital</span>
        </a>
        <WhatsAppButton label="Falar no WhatsApp" className="hidden px-4 py-2.5 text-xs sm:inline-flex" />
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-2 lg:pt-14">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E2B755]" /> Atendimento em todo o Brasil
            </p>
            <h1 className="font-display text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl">
              Mais pedidos de orçamento para a sua empresa, direto no WhatsApp.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
              A Atlas Digital mostra em que posição a sua empresa aparece no Google, cria o site e ajusta o perfil
              para quem procura o seu serviço encontrar você primeiro.
            </p>
            <div className="space-y-3">
              <WhatsAppButton label="Quero meu diagnóstico gratuito" className="w-full sm:w-auto" />
              <p className="text-xs text-zinc-500">Sem compromisso. Respondemos em horário comercial.</p>
            </div>
          </div>

          <aside aria-label="Exemplo de diagnóstico" className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" /> Exemplo de diagnóstico
            </p>
            <div className="mt-4 flex items-end justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <p className="text-sm text-zinc-400">Empresa de exemplo</p>
                <p className="font-display text-xl font-bold">8º lugar na busca local</p>
              </div>
              <p className="font-display text-4xl font-black text-amber-400">65<span className="text-base font-semibold text-zinc-500">/100</span></p>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Por que a nota é essa</p>
            <ul className="mt-2 space-y-2 text-sm text-zinc-300">
              <li>Há 7 concorrentes à frente na busca.</li>
              <li>O perfil não aponta para um site próprio.</li>
              <li>Poucas avaliações perto dos concorrentes.</li>
            </ul>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">O que a Atlas faz</p>
            <ul className="mt-2 space-y-2 text-sm text-zinc-300">
              {['Site com botão de WhatsApp', 'Perfil do Google otimizado', 'Rotina de avaliações'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" /> {item}
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="border-t border-zinc-900 bg-zinc-950/40">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="font-display text-2xl font-black tracking-tight sm:text-3xl">O que você recebe</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {DELIVERABLES.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-2xl border border-zinc-800 bg-[#0B0B0E] p-6">
                  <Icon className="h-6 w-6 text-[#E2B755]" aria-hidden="true" />
                  <h3 className="mt-4 text-base font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-2xl font-black tracking-tight sm:text-3xl">Como funciona</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-zinc-800 p-6">
                <span className="font-mono text-sm font-bold text-[#E2B755]">{index + 1}</span>
                <h3 className="mt-2 text-base font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <h3 className="text-sm font-semibold text-zinc-300">Empresas que atendemos</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {SEGMENTS.map((segment) => (
                <li key={segment} className="rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300">{segment}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-zinc-900 bg-zinc-950/40">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
            <h2 className="font-display text-2xl font-black tracking-tight sm:text-3xl">Perguntas comuns</h2>
            <dl className="mt-6 divide-y divide-zinc-900">
              {QUESTIONS.map(({ question, answer }) => (
                <div key={question} className="py-4">
                  <dt className="text-sm font-bold">{question}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-zinc-400">{answer}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 rounded-2xl border border-emerald-900/40 bg-emerald-500/5 p-6 text-center">
              <p className="font-display text-xl font-bold">Veja como a sua empresa aparece hoje.</p>
              <WhatsAppButton label="Pedir diagnóstico pelo WhatsApp" className="mt-4 w-full sm:w-auto" />
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-xs text-zinc-500 sm:px-6">
        <span>Atlas Digital · Porto Alegre, RS</span>
        <a href="/" className="underline hover:text-white">Conhecer o site completo</a>
      </footer>

      {/* No celular, o botão de WhatsApp fica sempre visível. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-zinc-900 bg-[#0B0B0E]/95 p-3 backdrop-blur sm:hidden">
        <WhatsAppButton label="Quero meu diagnóstico gratuito" className="w-full py-3.5" />
      </div>
    </div>
  );
}
