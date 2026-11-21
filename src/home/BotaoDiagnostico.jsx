import { useEffect, useState } from 'react'

/* Botão branco "Iniciar Diagnóstico" que acompanha a rolagem na página /solucoes (canto inferior esquerdo). */
export default function BotaoDiagnostico({ onClick = () => {} }) {
  const [visivel, setVisivel] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisivel(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <button
      type="button"
      onClick={onClick}
      aria-hidden={!visivel}
      tabIndex={visivel ? 0 : -1}
      className={`fixed bottom-6 left-4 z-40 rounded-full bg-white px-5 py-3.5 text-sm font-semibold text-black shadow-2xl shadow-black/50 transition-all duration-500 hover:scale-[1.03] hover:bg-zinc-200 sm:left-6 sm:px-6 ${
        visivel ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
      }`}
    >
      Iniciar Diagnóstico
    </button>
  )
}
