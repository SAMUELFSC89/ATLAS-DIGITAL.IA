import { useEffect, useRef, useState } from 'react'
import HeroCarrosselDeImagens from './componentes/hero-carrossel-de-imagens'
import NotasCaindo from './componentes/NotasCaindo'
import logoAtlas from './assets/logo-atlas-site.png'

/*
  Página inicial da Atlas Digital (rota "/").
  A página anterior continua no ar em /solucoes.
  Props vindas do App: abrir a janela de contato, entrar na área do cliente e abrir os documentos legais.
*/
const WHATSAPP = '5551994578544'
const EMAIL = 'contato@atlasdigital.ia.br'

const imagensCarrossel = Object.entries(
  import.meta.glob('./assets/projetos/[0-9]*.{webp,jpg,jpeg,png}', { eager: true, import: 'default' }),
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, src]) => src)

import imgArquitetura from './assets/projetos/01-arquitetura.webp'
import imgOdonto from './assets/projetos/02-odontologia.webp'
import imgFitness from './assets/projetos/03-fitness.webp'
import imgGastronomia from './assets/projetos/04-gastronomia.webp'
import imgImobiliaria from './assets/projetos/05-imobiliaria.webp'

const Icone = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    {d.map((p, i) => <path key={i} d={p} />)}
  </svg>
)

const servicos = [
  { titulo: 'Sites institucionais', itens: ['Design exclusivo', 'Otimizado para Google', 'Domínio e hospedagem'], texto: 'Presença digital com cara de marca grande, rápida e pronta para o Google.', icone: ['M3 5h18v14H3z', 'M3 9h18', 'M7 7h.01'] },
  { titulo: 'Landing pages', itens: ['Foco em conversão', 'WhatsApp integrado', 'Formulários'], texto: 'Páginas pensadas para uma única ação: gerar contato, venda ou agendamento.', icone: ['M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z'] },
  { titulo: 'Lojas virtuais', itens: ['Pix e cartão', 'Gestão de pedidos', 'Frete calculado'], texto: 'Catálogo, carrinho e pagamento integrados, com gestão simples.', icone: ['M5 7h14l-1.5 12h-11z', 'M9 7a3 3 0 0 1 6 0'] },
  { titulo: 'Tráfego e SEO', itens: ['Google Ads', 'Meta Ads', 'Relatórios mensais'], texto: 'Google Ads, Meta Ads e otimização para trazer as pessoas certas até o seu site.', icone: ['M4 19V9', 'M10 19V5', 'M16 19v-7', 'M22 19H2'] },
]

const projetos = [
  { nome: 'Escritório de arquitetura', tag: 'Site institucional', img: imgArquitetura },
  { nome: 'Academia', tag: 'Landing page', img: imgFitness },
  { nome: 'Clínica odontológica', tag: 'Agendamento online', img: imgOdonto },
  { nome: 'Restaurante', tag: 'Cardápio digital', img: imgGastronomia },
]

const etapas = [
  ['Conversa', 'Entendemos o negócio, o público e o objetivo do site.'],
  ['Design', 'Você aprova o visual antes de qualquer linha de código.'],
  ['Desenvolvimento', 'Site rápido, responsivo e otimizado para conversão.'],
  ['Lançamento', 'Publicação, domínio, Google e acompanhamento.'],
]

const Selo = ({ children }) => (
  <span className="inline-block rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
    {children}
  </span>
)

const Titulo = ({ children, className = '' }) => (
  <h2 className={`mt-5 text-balance text-4xl font-bold tracking-tighter text-foreground md:text-6xl ${className}`}>{children}</h2>
)

function useReveal() {
  useEffect(() => {
    const els = [...document.querySelectorAll('.nh-reveal')]
    const mostrar = (el, atraso = 0) => {
      el.style.transitionDelay = `${atraso}ms`
      el.classList.add('nh-visible')
    }

    // Grupos (data-grupo): os cartões aparecem um por vez, sempre na ordem da página.
    const grupos = {}
    els.forEach((el) => {
      const g = el.dataset.grupo
      if (g) (grupos[g] ||= { itens: [], vistos: new Set(), proximo: 0, ocupado: false }).itens.push(el)
    })
    const avancar = (g) => {
      const grupo = grupos[g]
      if (grupo.ocupado) return
      const el = grupo.itens[grupo.proximo]
      if (!el || !grupo.vistos.has(el)) return
      mostrar(el)
      grupo.proximo++
      grupo.ocupado = true
      setTimeout(() => {
        grupo.ocupado = false
        avancar(g)
      }, 450)
    }

    // Demais blocos: efeito cascata entre os que entram na tela juntos.
    const io = new IntersectionObserver(
      (entries) => {
        entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
          .forEach((e, i) => {
            io.unobserve(e.target)
            const g = e.target.dataset.grupo
            if (g) {
              grupos[g].vistos.add(e.target)
              avancar(g)
            } else mostrar(e.target, i * 140)
          })
      },
      { threshold: 0.15 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function Nav({ onPedirOrcamento, onEntrar }) {
  const [aberto, setAberto] = useState(false)
  const [rolou, setRolou] = useState(false)
  useEffect(() => {
    const onScroll = () => setRolou(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const links = [
    ['Serviços', '#serviços'],
    ['Projetos', '#projetos'],
    ['Processo', '#processo'],
    ['Soluções', '/solucoes'],
    ['Criadores', '/criadores'],
    ['Contato', '#contato'],
  ]
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all ${rolou ? 'bg-ink/80 backdrop-blur-md border-b border-white/10' : ''}`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <a href="/" aria-label="Atlas Digital">
          <img src={logoAtlas} alt="Atlas Digital" className="h-12 w-auto md:h-14" />
        </a>
        <ul className="hidden gap-8 text-sm text-paper/70 lg:flex">
          {links.map(([l, href]) => (
            <li key={l}>
              <a href={href} className="transition hover:text-paper">{l}</a>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-5 lg:flex">
          <button type="button" onClick={onEntrar} className="text-sm text-paper/70 transition hover:text-paper">Entrar</button>
          <button type="button" onClick={() => onPedirOrcamento('Orçamento - Página inicial (menu)')} className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink transition hover:scale-105">
            Pedir orçamento
          </button>
        </div>
        <button onClick={() => setAberto(!aberto)} className="lg:hidden" aria-label="Menu">
          <div className="space-y-1.5">
            <span className={`block h-0.5 w-6 bg-paper transition ${aberto ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-6 bg-paper transition ${aberto ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-6 bg-paper transition ${aberto ? '-translate-y-2 -rotate-45' : ''}`} />
          </div>
        </button>
      </nav>
      {aberto && (
        <ul className="space-y-4 border-t border-white/10 bg-ink px-6 py-6 lg:hidden">
          {links.map(([l, href]) => (
            <li key={l}>
              <a onClick={() => setAberto(false)} href={href} className="text-3xl font-bold tracking-tighter">{l}</a>
            </li>
          ))}
          <li className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setAberto(false); onPedirOrcamento('Orçamento - Página inicial (menu)') }} className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-ink">Pedir orçamento</button>
            <button type="button" onClick={() => { setAberto(false); onEntrar() }} className="rounded-full border border-white/20 px-5 py-3 text-sm">Entrar</button>
          </li>
        </ul>
      )}
    </header>
  )
}

function Marquee() {
  const itens = ['Design sob medida', 'Carregamento rápido', 'SEO', 'Responsivo', 'WhatsApp integrado', 'Google Ads']
  const lista = [...itens, ...itens]
  return (
    <div className="overflow-hidden border-y border-white/10 bg-accent py-5 text-ink">
      <div className="animate-marquee flex w-max gap-12 whitespace-nowrap font-['Instrument_Serif',Georgia,serif] text-3xl">
        {lista.map((t, i) => (
          <span key={i} className="flex items-center gap-12">{t} <span>✦</span></span>
        ))}
      </div>
    </div>
  )
}

function CartaoServico({ s, i }) {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`)
  }
  return (
    <article
      onMouseMove={onMove}
      className="nh-reveal group relative rounded-[28px] bg-gradient-to-b from-white/20 via-white/[0.06] to-white/[0.02] p-px transition-colors duration-500 hover:from-accent/60 hover:via-accent/10"
    >
      <div className="relative h-full overflow-hidden rounded-[27px] bg-[#121210] p-8 md:p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: 'radial-gradient(420px circle at var(--x) var(--y), rgb(212 255 58 / 0.10), transparent 60%)' }}
        />
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/[0.04] blur-2xl" />
        <div className="relative flex items-start justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.02] text-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.1)] transition duration-500 group-hover:bg-accent group-hover:text-ink">
            <Icone d={s.icone} />
          </div>
          <span className="text-sm font-medium text-paper/30 transition group-hover:text-accent">0{i + 1}</span>
        </div>
        <h3 className="relative mt-10 text-3xl font-bold tracking-tight">{s.titulo}</h3>
        <p className="relative mt-3 max-w-md text-lg leading-relaxed text-muted-foreground">{s.texto}</p>
        <ul className="relative mt-8 flex flex-wrap gap-2">
          {s.itens.map((t) => (
            <li key={t} className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm text-paper/70">{t}</li>
          ))}
        </ul>
      </div>
    </article>
  )
}

function Servicos() {
  return (
    <section id="serviços" className="relative mx-auto max-w-7xl px-6 pb-12 pt-20 md:pb-16 md:pt-24">
      <div className="nh-reveal text-center">
        <Selo>O que fazemos</Selo>
        <Titulo className="mx-auto max-w-4xl">Tudo que o seu negócio precisa <span className="text-paper/40">para vender online</span></Titulo>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {servicos.map((s, i) => <CartaoServico key={s.titulo} s={s} i={i} />)}
      </div>
    </section>
  )
}

function Projetos() {
  return (
    <section id="projetos" className="relative overflow-hidden px-6 py-12 md:py-16">
      <div className="relative mx-auto max-w-7xl">
        <div className="nh-reveal flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Selo>Portfólio</Selo>
            <Titulo>Projetos recentes</Titulo>
          </div>
          <p className="max-w-sm text-muted-foreground">Alguns modelos que podemos adaptar para o seu negócio, com a sua marca e o seu conteúdo.</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {projetos.map((p, i) => (
            <a key={p.nome} href="#contato" data-grupo="projetos" className={`nh-reveal group block ${i % 2 ? 'md:mt-24' : ''}`}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/40">
                <img src={p.img} alt={`Site para ${p.nome.toLowerCase()}`} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 md:p-8">
                  <div>
                    <span className="text-sm text-white/60">{p.tag}</span>
                    <h3 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{p.nome}</h3>
                  </div>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-ink transition duration-300 group-hover:rotate-[-45deg] group-hover:bg-accent">→</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function Contador({ valor, prefixo = '', sufixo = '' }) {
  const [n, setN] = useState(valor < 10 ? valor : 0)
  const ref = useRef(null)
  useEffect(() => {
    if (valor < 10) return
    const el = ref.current
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const inicio = performance.now()
      const passo = (agora) => {
        const t = Math.min(1, (agora - inicio) / 1600)
        setN(Math.round(valor * (1 - (1 - t) ** 3)))
        if (t < 1) requestAnimationFrame(passo)
      }
      requestAnimationFrame(passo)
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [valor])
  return <span ref={ref}>{prefixo}{n}{sufixo}</span>
}

function Numeros() {
  const dados = [
    { valor: 120, prefixo: '+', label: 'sites entregues' },
    { valor: 3, sufixo: 'x', label: 'mais contatos, em média' },
    { valor: 1, prefixo: '< ', sufixo: 's', label: 'tempo de carregamento' },
    { valor: 98, label: 'nota no PageSpeed' },
  ]
  return (
    <section className="mx-auto max-w-7xl px-6 py-8 md:py-10">
      <div className="nh-reveal relative overflow-hidden rounded-3xl border border-border bg-[#151513] bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-2">
        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-2/3 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative grid grid-cols-2 md:grid-cols-4">
          {dados.map((d, i) => (
            <div key={d.label} className={`p-8 text-center md:p-10 ${i % 2 ? 'border-l border-white/10' : ''} ${i > 1 ? 'border-t border-white/10 md:border-t-0' : ''} ${i === 2 ? 'md:border-l' : ''}`}>
              <div className="text-5xl font-bold tracking-tighter text-foreground md:text-6xl"><Contador {...d} /></div>
              <div className="mt-2 text-sm text-muted-foreground md:text-base">{d.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Processo() {
  return (
    <section id="processo" className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <div className="nh-reveal text-center">
        <Selo>Como funciona</Selo>
        <Titulo>Do primeiro contato <span className="text-paper/40">ao site no ar</span></Titulo>
      </div>
      <div className="relative mt-14 grid gap-6 md:grid-cols-4">
        <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-gradient-to-r from-accent/0 via-accent/60 to-accent/0 md:block" />
        {etapas.map(([t, d], i) => (
          <div key={t} data-grupo="processo" className="nh-reveal relative text-center">
            <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-accent/50 bg-ink text-lg font-bold text-accent shadow-[0_0_30px_-5px] shadow-accent/40">
              {i + 1}
            </div>
            <div className="mt-6 rounded-3xl border border-border bg-card p-7 transition hover:-translate-y-1 hover:border-accent/40">
              <h3 className="text-2xl font-bold tracking-tight">{t}</h3>
              <p className="mt-2 text-muted-foreground">{d}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="nh-reveal mt-12 text-center">
        <a href="#contato" className="inline-block rounded-full bg-accent px-8 py-3 font-semibold text-ink transition hover:scale-105">Quero começar</a>
      </div>
    </section>
  )
}

function Contato() {
  const [enviado, setEnviado] = useState(false)
  const enviar = (e) => {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const texto = [
      'Olá! Vim pelo site da Atlas Digital.',
      `Nome: ${d.get('nome')}`,
      `E-mail: ${d.get('email')}`,
      `WhatsApp: ${d.get('whatsapp')}`,
      d.get('projeto') ? `Sobre o projeto: ${d.get('projeto')}` : '',
    ].filter(Boolean).join('\n')
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer')
    setEnviado(true)
  }
  return (
    <section id="contato" className="px-6 pb-20 pt-12 md:pb-24 md:pt-16">
      <div className="mx-auto grid max-w-7xl gap-16 rounded-3xl border border-white/10 bg-[#141412] p-8 md:grid-cols-2 md:p-16">
        <div className="nh-reveal">
          <h2 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl">
            Vamos criar o seu <span className="text-accent">próximo site?</span>
          </h2>
          <p className="mt-6 max-w-sm text-paper/60">Conte um pouco sobre o seu negócio. Sua mensagem chega direto no nosso WhatsApp.</p>
          <div className="mt-8 space-y-2 text-sm text-paper/60">
            <p>WhatsApp: <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="text-paper hover:text-accent">(51) 99457-8544</a></p>
            <p>E-mail: <a href={`mailto:${EMAIL}`} className="text-paper hover:text-accent">{EMAIL}</a></p>
          </div>
        </div>
        {enviado ? (
          <div className="nh-reveal nh-visible flex items-center justify-center text-center">
            <p className="text-4xl font-bold tracking-tighter">Obrigado! <br /><span className="text-accent">Continue a conversa no WhatsApp.</span></p>
          </div>
        ) : (
          <form className="nh-reveal space-y-5" onSubmit={enviar}>
            {[['Nome', 'text', 'nome'], ['E-mail', 'email', 'email'], ['WhatsApp', 'tel', 'whatsapp']].map(([label, type, name]) => (
              <label key={name} className="block">
                <span className="text-sm text-paper/60">{label}</span>
                <input required name={name} type={type} className="mt-1 w-full border-b border-white/20 bg-transparent py-3 outline-none transition focus:border-accent" />
              </label>
            ))}
            <label className="block">
              <span className="text-sm text-paper/60">Sobre o projeto</span>
              <textarea name="projeto" rows={3} className="mt-1 w-full resize-none border-b border-white/20 bg-transparent py-3 outline-none transition focus:border-accent" />
            </label>
            <button className="w-full rounded-full bg-accent py-4 font-medium text-ink transition hover:scale-[1.02]">Enviar pelo WhatsApp</button>
          </form>
        )}
      </div>
    </section>
  )
}

function Rodape({ onDocLegal }) {
  const link = 'transition hover:text-paper'
  return (
    <footer className="relative z-10 border-t border-white/10 px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 text-sm text-paper/50 md:flex-row md:items-center">
        <span>© {new Date().getFullYear()} Atlas Digital. Todos os direitos reservados.</span>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <a href="/solucoes" className={link}>Soluções</a>
          <a href="/contato" className={link}>Contato</a>
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className={link}>WhatsApp</a>
          <a href={`mailto:${EMAIL}`} className={link}>E-mail</a>
          <button type="button" onClick={() => onDocLegal('privacidade')} className={link}>Privacidade</button>
          <button type="button" onClick={() => onDocLegal('termos')} className={link}>Termos de uso</button>
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-7xl text-xs text-paper/30">Fotos das cédulas de R$ 50 e R$ 100: Cerdded41, Wikimedia Commons, CC BY-SA 4.0.</p>
    </footer>
  )
}

export default function NovaHome({ onPedirOrcamento = () => {}, onEntrar = () => {}, onDocLegal = () => {} }) {
  useReveal()
  // o botão "Começar projeto" do hero abre a mesma janela de contato do site
  const cliqueNoHero = (e) => {
    if (e.target.closest('button')) onPedirOrcamento('Começar projeto - Página inicial')
  }
  return (
    <div className="nova-home min-h-screen bg-ink font-sans text-paper antialiased">
      <NotasCaindo />
      <Nav onPedirOrcamento={onPedirOrcamento} onEntrar={onEntrar} />
      <main className="relative z-10">
        <div onClick={cliqueNoHero}>
          <HeroCarrosselDeImagens
            tagline="Agenda aberta para dezembro"
            title="Sites que vendem enquanto você dorme"
            description="Criamos sites e landing pages sob medida para negócios locais que querem parecer grandes e vender mais."
            ctaText="Começar projeto"
            className="bg-transparent! pt-20 pb-[33vh] md:pb-[40vh]"
            images={imagensCarrossel}
          />
        </div>
        <Marquee />
        <Servicos />
        <Projetos />
        <Numeros />
        <Processo />
        <Contato />
      </main>
      <Rodape onDocLegal={onDocLegal} />
    </div>
  )
}
