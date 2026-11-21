import { useEffect, useRef } from 'react'

/*
  Notas de dinheiro caindo ao fundo da página (atrás de todo o conteúdo).

  FOTOS REAIS: coloque em assets/notas/ arquivos com estes nomes (png com fundo transparente, de preferência):
    brl-100-frente.png  e  brl-100-verso.png
    usd-100-frente.png  e  usd-100-verso.png
  Qualquer par "<nome>-frente" + "<nome>-verso" (png, webp ou jpg) entra sozinho.
  Enquanto não houver fotos, o componente desenha notas provisórias.
*/
const arquivos = import.meta.glob('../assets/notas/*.{png,webp,jpg,jpeg}', { eager: true, import: 'default' })

function paresDeFotos() {
  const pares = {}
  for (const [caminho, url] of Object.entries(arquivos)) {
    const m = caminho.match(/([^/]+)-(frente|verso)\.\w+$/i)
    if (!m) continue
    ;(pares[m[1]] ||= {})[m[2].toLowerCase()] = url
  }
  return Object.values(pares).filter((p) => p.frente)
}

// ---------- notas provisórias desenhadas por código ----------
const PROVISORIAS = [
  { moeda: 'R$', valor: '100', cor: '#5f8fc4', escura: '#20406b' },
  { moeda: 'R$', valor: '50', cor: '#c9965a', escura: '#6b4219' },
  { moeda: 'R$', valor: '200', cor: '#a99178', escura: '#4f3d2c' },
  { moeda: 'US$', valor: '100', cor: '#a9bba0', escura: '#3d5236' },
  { moeda: 'US$', valor: '50', cor: '#b7c2b0', escura: '#4a5a44' },
]

function desenharNota(n, verso) {
  const w = 1024
  const h = 450
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, n.cor)
  g.addColorStop(0.5, '#efe9dc')
  g.addColorStop(1, n.cor)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  // linhas finas tipo guilhoche
  ctx.strokeStyle = n.escura + '40'
  ctx.lineWidth = 1.2
  for (let k = 0; k < 26; k++) {
    ctx.beginPath()
    for (let x = 0; x <= w; x += 8) {
      const y = h / 2 + Math.sin(x / (40 + k * 3) + k) * (h * 0.42) * Math.sin(k * 0.7 + x / 300)
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
    }
    ctx.stroke()
  }
  // moldura
  ctx.strokeStyle = n.escura
  ctx.lineWidth = 10
  ctx.strokeRect(18, 18, w - 36, h - 36)
  ctx.lineWidth = 2
  ctx.strokeRect(36, 36, w - 72, h - 72)
  // medalhão
  const mx = verso ? w * 0.68 : w * 0.3
  const r = h * 0.3
  const rg = ctx.createRadialGradient(mx, h / 2, 10, mx, h / 2, r)
  rg.addColorStop(0, '#f6f1e6')
  rg.addColorStop(1, n.cor)
  ctx.fillStyle = rg
  ctx.beginPath()
  ctx.ellipse(mx, h / 2, r * 0.85, r, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = n.escura
  ctx.lineWidth = 4
  ctx.stroke()
  // valores
  ctx.fillStyle = n.escura
  ctx.font = 'bold 150px Georgia, serif'
  ctx.textBaseline = 'middle'
  ctx.textAlign = verso ? 'left' : 'right'
  ctx.fillText(n.valor, verso ? 70 : w - 70, h / 2 + 10)
  ctx.font = 'bold 46px Georgia, serif'
  ctx.textAlign = 'left'
  ctx.fillText(n.moeda + ' ' + n.valor, 60, 80)
  ctx.textAlign = 'right'
  ctx.fillText(n.valor, w - 60, h - 70)
  ctx.font = '600 26px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('MODELO PROVISÓRIO', mx, h - 62)
  return c
}

// ---------- shaders: papel curvado, frente/verso e luz ----------
const VERT = `
uniform float uCurva;
uniform float uTempo;
uniform float uFase;
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vec3 p = position;
  float onda = sin(uTempo * 2.3 + uFase) * 0.5 + 0.5;
  float curva = uCurva * (0.35 + 0.65 * onda);
  // dobra suave ao longo do comprimento + leve torção
  float dx = (uv.x - 0.5);
  p.z += curva * (1.0 - 4.0 * dx * dx) + sin(uv.y * 3.14159 + uTempo * 1.7 + uFase) * curva * 0.15;
  float inclinacao = curva * 8.0 * dx;
  vec3 n = normalize(vec3(inclinacao, 0.0, 1.0));
  vNormal = normalize(normalMatrix * n);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`

const FRAG = `
uniform sampler2D uFrente;
uniform sampler2D uVerso;
uniform float uBrilho;
uniform vec3 uFundo;
uniform float uNevoa;
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  vec4 cor = gl_FrontFacing ? texture2D(uFrente, vUv) : texture2D(uVerso, vec2(1.0 - vUv.x, vUv.y));
  if (cor.a < 0.05) discard;
  vec3 n = gl_FrontFacing ? vNormal : -vNormal;
  vec3 luz = normalize(vec3(-0.35, 0.6, 0.75));
  float difusa = max(dot(n, luz), 0.0);
  float reflexo = pow(max(dot(reflect(-luz, n), vec3(0.0, 0.0, 1.0)), 0.0), 18.0) * 0.18;
  vec3 c = cor.rgb * (0.38 + 0.72 * difusa) * uBrilho + reflexo;
  c = mix(c, uFundo, uNevoa);
  gl_FragColor = vec4(c, cor.a);
}`

const lim = (v, a, b) => Math.min(b, Math.max(a, v))
const aleat = (a, b) => a + Math.random() * (b - a)

export default function NotasCaindo({ fundo = '#0e0e0c' }) {
  const host = useRef(null)

  useEffect(() => {
    const el = host.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (navigator.connection?.saveData) return // quem ativou economia de dados não baixa as notas

    // Só começa no primeiro movimento da pessoa (rolar, mexer o mouse, tocar ou teclar),
    // depois que a página terminou de carregar. Assim a abertura do site fica leve.
    let limpar = () => {}
    let cancelado = false
    let iniciado = false
    const eventos = ['scroll', 'wheel', 'pointermove', 'touchstart', 'keydown']
    const tirarOuvintes = () => eventos.forEach((ev) => window.removeEventListener(ev, aoInteragir))
    const comecar = () => {
      if (cancelado || iniciado) return
      iniciado = true
      // o motor 3D (three.js) também só é baixado nessa hora
      import('three').then((THREE) => { if (!cancelado) limpar = iniciar(el, fundo, THREE) })
    }
    function aoInteragir() {
      tirarOuvintes()
      if (document.readyState === 'complete') comecar()
      else window.addEventListener('load', comecar, { once: true })
    }
    eventos.forEach((ev) => window.addEventListener(ev, aoInteragir, { passive: true }))
    return () => {
      cancelado = true
      tirarOuvintes()
      window.removeEventListener('load', comecar)
      limpar()
    }
  }, [fundo])

  return <div ref={host} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />
}

function iniciar(el, fundo, THREE) {
  {
    const celular = window.innerWidth < 768
    const QTD = celular ? 12 : 24

    const renderer = new THREE.WebGLRenderer({ antialias: !celular, alpha: true, powerPreference: 'low-power' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, celular ? 1.25 : 1.5))
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%'
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 10, 6000)

    // texturas: fotos reais (se houver) ou provisórias
    const carregador = new THREE.TextureLoader()
    const prep = (t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 4
      return t
    }
    const fotos = paresDeFotos()
    const tipos = fotos.length
      ? fotos.map((p) => {
          const tipo = { proporcao: 2.25 }
          const frente = prep(carregador.load(p.frente, (tx) => (tipo.proporcao = tx.image.width / tx.image.height)))
          const verso = p.verso ? prep(carregador.load(p.verso)) : frente
          return Object.assign(tipo, { frente, verso })
        })
      : PROVISORIAS.map((n) => ({
          frente: prep(new THREE.CanvasTexture(desenharNota(n, false))),
          verso: prep(new THREE.CanvasTexture(desenharNota(n, true))),
          proporcao: 1024 / 450,
        }))

    const geo = new THREE.PlaneGeometry(1, 1, 16, 4)
    const corFundo = new THREE.Color(fundo)
    let vw = 1
    let vh = 1

    const notas = Array.from({ length: QTD }, (_, i) => {
      const tipo = tipos[i % tipos.length]
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.DoubleSide,
        transparent: true,
        uniforms: {
          uFrente: { value: tipo.frente },
          uVerso: { value: tipo.verso },
          uCurva: { value: 0 },
          uTempo: { value: 0 },
          uFase: { value: Math.random() * 10 },
          uBrilho: { value: 1 },
          uFundo: { value: corFundo },
          uNevoa: { value: 0 },
        },
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.frustumCulled = false
      scene.add(mesh)
      return { mesh, mat, tipo }
    })

    // cada nota ganha um "jeito" de cair
    const sortear = (n, noTopo) => {
      n.z = aleat(-900, 150) // profundidade: longe = menor, mais lenta, mais apagada
      const perto = (n.z + 900) / 1050
      n.largura = aleat(150, 210)
      n.x = aleat(-0.55, 0.55)
      n.y = noTopo ? aleat(1.15, 1.5) : aleat(-0.1, 1.3)
      n.queda = aleat(55, 95) * (0.55 + 0.45 * perto)
      n.amplitude = aleat(40, 120)
      n.freq = aleat(0.6, 1.2)
      n.fase = Math.random() * Math.PI * 2
      n.giroY = aleat(0.8, 2.6) * (Math.random() < 0.5 ? -1 : 1)
      n.giroX = aleat(0.3, 1.1)
      n.anguloY = Math.random() * Math.PI * 2
      n.anguloX = Math.random() * Math.PI
      n.curva = aleat(10, 26)
      n.mat.uniforms.uBrilho.value = 0.75 + 0.3 * perto
      n.mat.uniforms.uNevoa.value = 0.45 * (1 - perto)
    }
    // entram por cima da tela, em ondas, em vez de surgirem no meio dela
    notas.forEach((n) => { sortear(n, true); n.y += Math.random() * 0.8 })
    notas.sort((a, b) => a.z - b.z).forEach((n, i) => (n.mesh.renderOrder = i))

    const redimensionar = () => {
      vw = window.innerWidth
      vh = window.innerHeight
      renderer.setSize(vw, vh, false)
      camera.aspect = vw / vh
      camera.position.z = vh / 2 / Math.tan((camera.fov * Math.PI) / 360) // z = 0 equivale a pixels de tela
      camera.updateProjectionMatrix()
    }
    redimensionar()
    window.addEventListener('resize', redimensionar)

    // rolagem: dá "vento" às notas (caem mais rápido e balançam mais)
    let ultimoScroll = window.scrollY
    let vento = 0
    const onScroll = () => {
      const dy = window.scrollY - ultimoScroll
      ultimoScroll = window.scrollY
      vento = lim(vento + dy * 0.9, -900, 1600)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    let anterior = performance.now()
    const inicio = anterior
    renderer.setAnimationLoop(() => {
      const agora = performance.now()
      const dt = Math.min(0.05, (agora - anterior) / 1000)
      anterior = agora
      if (document.hidden) return
      const t = (agora - inicio) / 1000
      vento *= Math.pow(0.04, dt) // o vento passa em ~1 s

      const escalaZ = (z) => camera.position.z / (camera.position.z - z) // quanto a profundidade encolhe
      for (const n of notas) {
        const k = escalaZ(n.z)
        const ritmo = n.freq * (1 + Math.abs(vento) / 900)
        n.fase += dt * ritmo
        const balanco = Math.sin(n.fase)
        // queda de folha: freia nas pontas do balanço e acelera no meio (velocidade em px de tela por segundo)
        const velocidade = n.queda * (0.55 + 0.45 * Math.abs(Math.cos(n.fase))) + Math.max(0, vento) * 0.35
        n.y -= (velocidade * dt) / vh
        n.anguloY += n.giroY * dt * (1 + Math.abs(vento) / 600)
        n.anguloX += n.giroX * dt

        const metadeW = vw / 2 / k
        const metadeH = vh / 2 / k
        const altura = n.largura / n.tipo.proporcao
        n.mesh.position.set(n.x * 2 * metadeW + balanco * n.amplitude, (n.y - 0.5) * 2 * metadeH, n.z)
        n.mesh.scale.set(n.largura, altura, 1)
        n.mesh.rotation.set(Math.sin(n.anguloX) * 0.9, n.anguloY, balanco * 0.55 + Math.sin(t * 0.3 + n.fase) * 0.1)
        n.mat.uniforms.uTempo.value = t
        n.mat.uniforms.uCurva.value = n.curva * (1 + Math.abs(vento) / 1200)

        // saiu por baixo: volta por cima da tela com um novo jeito de cair
        if (n.y < -0.25) sortear(n, true)
      }
      renderer.render(scene, camera)
    })

    return () => {
      renderer.setAnimationLoop(null)
      window.removeEventListener('resize', redimensionar)
      window.removeEventListener('scroll', onScroll)
      geo.dispose()
      notas.forEach((n) => n.mat.dispose())
      tipos.forEach((t) => {
        t.frente.dispose()
        t.verso.dispose()
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }
}
