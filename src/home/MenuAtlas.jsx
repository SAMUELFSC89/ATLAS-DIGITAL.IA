import { useEffect, useState } from 'react'
import logoAtlas from './assets/logo-atlas-site.webp'

/*
  Menu da Atlas: usado na página inicial (/) e na página /solucoes.
  base = '' na página inicial; base = '/' nas outras páginas (os links de seção voltam para a inicial).
*/
export default function MenuAtlas({ onPedirOrcamento = (_assunto) => {}, onEntrar = () => {}, onSobre = () => {}, base = '' }) {
  const [aberto, setAberto] = useState(false)
  const [rolou, setRolou] = useState(false)
  useEffect(() => {
    const onScroll = () => setRolou(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  // [texto, link] ou [texto, null, ação]
  const links = [
    ['Serviços', `${base}#serviços`],
    ['Projetos', `${base}#projetos`],
    ['Como funciona', `${base}#processo`],
    ['Soluções', '/solucoes'],
    ['Sobre nós', null, onSobre],
    ['Contato', `${base}#contato`],
  ]
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all ${rolou ? 'bg-ink/80 backdrop-blur-md border-b border-white/10' : ''}`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <a href="/" aria-label="Atlas Digital">
          <img src={logoAtlas} alt="Atlas Digital" className="h-12 w-auto md:h-14" />
        </a>
        <ul className="hidden gap-8 text-sm text-paper/70 lg:flex">
          {links.map(([l, href, acao]) => (
            <li key={l}>
              {href ? (
                <a href={href} className="transition hover:text-paper">{l}</a>
              ) : (
                <button type="button" onClick={acao} className="transition hover:text-paper">{l}</button>
              )}
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
          {links.map(([l, href, acao]) => (
            <li key={l}>
              {href ? (
                <a onClick={() => setAberto(false)} href={href} className="text-3xl font-bold tracking-tighter">{l}</a>
              ) : (
                <button type="button" onClick={() => { setAberto(false); acao() }} className="text-3xl font-bold tracking-tighter">{l}</button>
              )}
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

