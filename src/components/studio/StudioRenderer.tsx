import { Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { DISPLAY_FONTS, EASES, fontHref, type StudioAsset, type StudioMedia, type StudioScene, type StudioSite } from '../../lib/studioSite';
// Three.js is loaded only by sites that open with the particle scene.
const ParticleField = lazy(() => import('./ParticleField'));
import { STUDIO_CSS, studioVars } from './studioCss';

gsap.registerPlugin(ScrollTrigger);

const DISTANCE = { calma: 28, media: 60, intensa: 110 } as const;

function whatsappLink(site: StudioSite) {
  const digits = site.meta.whatsapp.length <= 11 ? '55' + site.meta.whatsapp : site.meta.whatsapp;
  return digits.length >= 12 ? `https://wa.me/${digits}?text=${encodeURIComponent(site.meta.whatsappMessage)}` : undefined;
}

/** Splits a heading into words wrapped in masks, so each word can rise from inside its line. */
function Words({ text, className = '' }: { text: string; className?: string }) {
  return <>{text.split(/\s+/).map((word, index) => <span key={index}><span className={`ss-w ${className}`}><span>{word}</span></span>{' '}</span>)}</>;
}

function Media({ media, assets, className = '', alt, eager }: { media?: StudioMedia; assets: Map<string, StudioAsset>; className?: string; alt: string; eager?: boolean }) {
  const asset = media?.assetId ? assets.get(media.assetId) : undefined;
  return <div className={`ss-media ${className}`}>
    {asset ? <img src={asset.url} alt={alt} width={asset.width} height={asset.height} loading={eager ? 'eager' : 'lazy'} decoding="async" />
      : <div className="ss-need" role="img" aria-label={`Imagem pendente: ${media?.need?.description || alt}`}>
        <strong>[{media?.need?.file || 'imagem-pendente'}]</strong><span>{media?.need?.description || 'Envie uma foto para esta cena.'}</span>
      </div>}
  </div>;
}

function Scene({ scene, index, site, assets, link }: { key?: string; scene: StudioScene; index: number; site: StudioSite; assets: Map<string, StudioAsset>; link?: string }) {
  const Heading = index === 0 ? 'h1' : 'h2';
  const intro = <>
    {scene.eyebrow && <span className="ss-eyebrow" data-anim="rise">{scene.eyebrow}</span>}
    <Heading className="ss-title" data-anim="words"><Words text={scene.title} /></Heading>
    {scene.text && <p className="ss-text" data-anim="rise">{scene.text}</p>}
  </>;
  const cta = link && scene.cta ? <a className="ss-btn" data-anim="rise" data-magnetic href={link} target="_blank" rel="noreferrer">{scene.cta}</a> : null;
  const common = { id: scene.id, 'data-scene': scene.type, 'data-tone': scene.tone, className: `ss-scene ss-tone-${scene.tone}` };
  const items = scene.items || [];
  const firstMedia = scene.media?.[0];

  switch (scene.type) {
    case 'hero-particulas':
      return <section {...common} className={`${common.className} ss-hero`}>
        <Suspense fallback={null}><ParticleField color={site.tokens.colors.accent} shape={scene.shape} motion={!matchMedia('(prefers-reduced-motion: reduce)').matches} /></Suspense>
        <div className="ss-hero-inner">{intro}<div className="ss-hero-actions">{cta}</div></div>
      </section>;
    case 'hero-midia':
      return <section {...common} className={`${common.className} ss-hero ss-hero-midia`}>
        <div className="ss-hero-bg" data-anim="hero-media"><Media media={firstMedia} assets={assets} alt={scene.title} eager /></div>
        <div className="ss-hero-inner">{intro}<div className="ss-hero-actions">{cta}</div></div>
      </section>;
    case 'manifesto': {
      return <section {...common} className={`${common.className} ss-manifesto`}>
        {scene.eyebrow && <span className="ss-eyebrow" data-anim="rise">{scene.eyebrow}</span>}
        <Heading className="ss-title" data-anim="scrub-words">{scene.title.split(/\s+/).map((word, i) => <span key={i} className="ss-mw">{word} </span>)}</Heading>
        {scene.text && <p className="ss-text" data-anim="rise">{scene.text}</p>}
      </section>;
    }
    case 'cena-presa':
      return <section {...common} className={`${common.className} ss-presa`} data-pin>
        <div className="ss-presa-media" data-anim="circle"><Media media={firstMedia} assets={assets} alt={scene.title} className="ss-presa-img" /></div>
        <div>{intro}<div className="ss-presa-steps">{items.map((item, i) => <div key={i} className="ss-step" data-step>
          <h3>{item.title}</h3>{item.text && <p>{item.text}</p>}</div>)}</div>{cta}</div>
      </section>;
    case 'cartas-empilhadas':
      return <section {...common}>
        {intro}
        <div className="ss-cards">{items.map((item, i) => <article key={i} className="ss-card" data-card style={{ '--i': i } as CSSProperties}>
          <span className="ss-num">{String(i + 1).padStart(2, '0')}</span>
          <div><h3>{item.title}</h3>{item.text && <p>{item.text}</p>}</div>
          {item.media && <Media media={item.media} assets={assets} alt={item.title} />}
        </article>)}</div>
        {cta}
      </section>;
    case 'galeria-horizontal':
      return <section {...common} className={`${common.className} ss-gallery`} data-gallery>
        <div className="ss-gallery-head">{intro}</div>
        <div className="ss-track" data-track>{items.map((item, i) => <figure key={i} className="ss-slide" style={{ margin: 0 }}>
          <Media media={item.media} assets={assets} alt={item.title} />
          <figcaption><h3>{item.title}</h3>{item.text && <p>{item.text}</p>}</figcaption>
        </figure>)}</div>
      </section>;
    case 'parallax-camadas':
      return <section {...common} className={`${common.className} ss-layers`}>
        {(scene.media || []).slice(0, 3).map((m, i) => <div key={i} className="ss-layer" data-depth={[0.35, -0.25, 0.55][i]}>
          <Media media={m} assets={assets} alt={`${scene.title} — imagem ${i + 1}`} /></div>)}
        <div className="ss-layers-copy">{intro}{cta}</div>
      </section>;
    case 'contadores':
      return <section {...common}>
        {intro}
        <div className="ss-counters">{items.map((item, i) => <div key={i} className="ss-counter" data-anim="rise">
          <strong data-count={item.value || ''}>{item.value}</strong><span>{item.title}</span></div>)}</div>
      </section>;
    case 'antes-depois':
      return <section {...common} data-ba>
        {intro}
        <div className="ss-ba">
          <Media media={scene.media?.[0]} assets={assets} alt={`Antes — ${scene.title}`} />
          <Media media={scene.media?.[1]} assets={assets} alt={`Depois — ${scene.title}`} className="ss-ba-after" />
          <span className="ss-ba-line" aria-hidden="true" />
          <span className="ss-ba-label" style={{ left: 16 }}>Antes</span><span className="ss-ba-label" style={{ right: 16 }}>Depois</span>
        </div>
      </section>;
    case 'cta-final':
      return <section {...common} className={`${common.className} ss-cta`}>{intro}{cta}</section>;
  }
}

const TONE_BG = { base: '--ss-bg', alt: '--ss-bg-alt', destaque: '--ss-accent' } as const;
const TONE_TEXT = { base: '--ss-text', alt: '--ss-alt-text', destaque: '--ss-accent-text' } as const;

export default function StudioRenderer({ site, assets, smoothScroll = true, header = true }: { site: StudioSite; assets: StudioAsset[]; smoothScroll?: boolean; header?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const assetMap = useMemo(() => new Map(assets.map(asset => [asset.id, asset])), [assets]);
  const link = whatsappLink(site);
  const vars = { ...studioVars(site.tokens), '--ss-display-weight': String(DISPLAY_FONTS[site.tokens.fonts.display]?.weight || 700) } as CSSProperties;
  const logo = site.meta.logoAssetId ? assetMap.get(site.meta.logoAssetId) : undefined;

  useEffect(() => {
    const href = fontHref(site.tokens);
    if (document.querySelector(`link[data-studio-fonts="${CSS.escape(href)}"]`)) return;
    const element = Object.assign(document.createElement('link'), { rel: 'stylesheet', href });
    element.dataset.studioFonts = href;
    document.head.appendChild(element);
  }, [site.tokens.fonts.display, site.tokens.fonts.body]);

  useLayoutEffect(() => {
    const element = root.current as HTMLDivElement | null;
    if (!element) return;
    element.classList.add('ss-js');
    const ease = EASES[site.tokens.ease];
    const distance = DISTANCE[site.tokens.intensity];
    const mm = gsap.matchMedia();
    let lenis: Lenis | undefined;
    const tick = (time: number) => lenis?.raf(time * 1000);

    mm.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 900px)' }, context => {
      const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean };
      // Background color follows the scene on screen, so tone changes feel like one continuous film.
      // Created after the pinned scenes so their positions already include the pin spacing.
      const followTones = () => element.querySelectorAll<HTMLElement>('[data-scene]').forEach(scene => {
        const tone = scene.dataset.tone as keyof typeof TONE_BG;
        const styles = getComputedStyle(element);
        const color = styles.getPropertyValue(TONE_BG[tone]).trim();
        const ink = styles.getPropertyValue(TONE_TEXT[tone]).trim();
        ScrollTrigger.create({ trigger: scene, start: 'top 55%', end: 'bottom 55%', onToggle: self => {
          if (!self.isActive) return;
          element.style.setProperty('--ss-current-bg', color);
          element.style.setProperty('--ss-current-text', ink);
        } });
      });
      if (!motion) { followTones(); return; }
      if (smoothScroll) {
        lenis = new Lenis({ lerp: 0.1 });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      }
      const reveal = { opacity: 0, y: distance, duration: 1, ease };
      element.querySelectorAll<HTMLElement>('[data-anim="words"]').forEach(title => {
        gsap.from(title.querySelectorAll('.ss-w > span'), { yPercent: 115, duration: 1.1, ease, stagger: 0.06,
          scrollTrigger: { trigger: title, start: 'top 88%' } });
      });
      element.querySelectorAll<HTMLElement>('[data-anim="rise"]').forEach(item => {
        gsap.from(item, { ...reveal, delay: 0.15, scrollTrigger: { trigger: item, start: 'top 90%' } });
      });
      element.querySelectorAll<HTMLElement>('[data-anim="scrub-words"]').forEach(title => {
        gsap.fromTo(title.querySelectorAll('.ss-mw'), { opacity: 0.14 }, { opacity: 1, stagger: 0.1, ease: 'none',
          scrollTrigger: { trigger: title, start: 'top 80%', end: 'bottom 45%', scrub: true } });
      });
      element.querySelectorAll<HTMLElement>('[data-anim="hero-media"]').forEach(media => {
        gsap.from(media, { scale: 1.25, filter: 'blur(14px)', duration: 1.8, ease });
        gsap.to(media, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: media.parentElement, start: 'top top', end: 'bottom top', scrub: true } });
      });
      element.querySelectorAll<HTMLElement>('[data-scene="cena-presa"]').forEach(scene => {
        const media = scene.querySelector('[data-anim="circle"] .ss-media');
        const steps = scene.querySelectorAll<HTMLElement>('[data-step]');
        if (desktop) {
          const timeline = gsap.timeline({ scrollTrigger: { trigger: scene, start: 'top top', end: `+=${Math.max(2, steps.length) * 70}%`, pin: true, scrub: 0.6 } });
          timeline.fromTo(media, { clipPath: 'circle(9% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', ease: 'none', duration: steps.length || 1 }, 0);
          steps.forEach((step, i) => timeline.fromTo(step, { opacity: 0.25 }, { opacity: 1, duration: 0.5 }, i).to(step, { opacity: 0.25, duration: 0.5 }, i + 0.9));
        } else {
          gsap.fromTo(media, { clipPath: 'circle(12% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', ease: 'none', scrollTrigger: { trigger: media, start: 'top 85%', end: 'bottom 40%', scrub: true } });
        }
      });
      element.querySelectorAll<HTMLElement>('[data-card]').forEach((card, i, all) => {
        const next = all[i + 1];
        if (next && next.parentElement === card.parentElement) {
          gsap.to(card, { scale: 0.92, opacity: 0.55, ease: 'none', scrollTrigger: { trigger: next, start: 'top 90%', end: 'top 20%', scrub: true } });
        }
        gsap.from(card, { y: distance * 1.5, opacity: 0, duration: 1, ease, scrollTrigger: { trigger: card, start: 'top 92%' } });
      });
      if (desktop) element.querySelectorAll<HTMLElement>('[data-gallery]').forEach(gallery => {
        const track = gallery.querySelector<HTMLElement>('[data-track]');
        if (!track) return;
        const shift = () => Math.max(0, track.scrollWidth - window.innerWidth);
        gsap.to(track, { x: () => -shift(), ease: 'none', scrollTrigger: { trigger: gallery, start: 'top top', end: () => '+=' + shift(), pin: true, scrub: 0.6, invalidateOnRefresh: true } });
      });
      element.querySelectorAll<HTMLElement>('.ss-layer').forEach(layer => {
        const depth = Number(layer.dataset.depth || 0.3);
        gsap.fromTo(layer, { yPercent: 40 * depth }, { yPercent: -60 * depth, ease: 'none', scrollTrigger: { trigger: layer.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      element.querySelectorAll<HTMLElement>('[data-count]').forEach(counter => {
        const match = /^(\D*)([\d.,]+)(.*)$/.exec(counter.dataset.count || '');
        if (!match) return;
        const target = Number(match[2].replace(/\./g, '').replace(',', '.'));
        if (!Number.isFinite(target)) return;
        const decimals = match[2].includes(',') ? match[2].split(',')[1].length : 0;
        const state = { value: 0 };
        gsap.to(state, { value: target, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: counter, start: 'top 85%' },
          onUpdate: () => { counter.textContent = match[1] + state.value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + match[3]; } });
      });
      element.querySelectorAll<HTMLElement>('[data-ba]').forEach(section => {
        const after = section.querySelector('.ss-ba-after'), line = section.querySelector('.ss-ba-line'), frame = section.querySelector('.ss-ba');
        const timeline = gsap.timeline({ scrollTrigger: { trigger: frame, start: desktop ? 'center center' : 'top 70%', end: desktop ? '+=120%' : 'bottom 30%', pin: desktop ? section : false, scrub: 0.5 } });
        timeline.fromTo(after, { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', ease: 'none' }, 0)
          .fromTo(line, { left: '100%' }, { left: '0%', ease: 'none' }, 0);
      });
      followTones();
      const cleanups: (() => void)[] = [];
      if (desktop) element.querySelectorAll<HTMLElement>('[data-magnetic]').forEach(button => {
        const move = (event: PointerEvent) => {
          const box = button.getBoundingClientRect();
          gsap.to(button, { x: (event.clientX - box.left - box.width / 2) * 0.3, y: (event.clientY - box.top - box.height / 2) * 0.4, duration: 0.4, ease: 'power3.out' });
        };
        const leave = () => gsap.to(button, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
        button.addEventListener('pointermove', move); button.addEventListener('pointerleave', leave);
        cleanups.push(() => { button.removeEventListener('pointermove', move); button.removeEventListener('pointerleave', leave); });
      });
      return () => cleanups.forEach(clean => clean());
    }, element);

    // Images and fonts change heights after load; recompute pinned distances once they settle.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    return () => {
      window.removeEventListener('load', refresh);
      gsap.ticker.remove(tick);
      lenis?.destroy();
      mm.revert();
      element.classList.remove('ss-js');
      element.style.removeProperty('--ss-current-bg');
      element.style.removeProperty('--ss-current-text');
    };
  }, [site, smoothScroll]);

  const body: ReactNode = <>
    {header && <header className="ss-header">
      <a className="ss-brand" href={`#${site.scenes[0]?.id || ''}`}>{logo ? <img src={logo.url} alt={site.meta.businessName} /> : site.meta.businessName}</a>
      {link && <a className="ss-btn ss-btn--small" href={link} target="_blank" rel="noreferrer">Falar no WhatsApp</a>}
    </header>}
    <main>{site.scenes.map((scene, index) => <Scene key={scene.id} scene={scene} index={index} site={site} assets={assetMap} link={link} />)}</main>
    <footer className="ss-footer">© {new Date().getFullYear()} {site.meta.businessName}</footer>
    {link && <a className="ss-btn ss-float" href={link} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8 0-1.4.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.1.1.7-.1 1.4Z"/></svg>
    </a>}
  </>;

  return <div ref={root} className={`ss-root${site.tokens.grain ? ' ss-grain' : ''}`} style={vars}>
    <style>{STUDIO_CSS}</style>
    {body}
  </div>;
}
