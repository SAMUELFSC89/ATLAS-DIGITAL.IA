import { contrast, readable, type StudioTokens } from '../../lib/studioSite';

/** CSS variables for a site: palette per tone (base / alt / destaque), fonts, radius. */
export function studioVars(tokens: StudioTokens): Record<string, string> {
  const { colors } = tokens;
  const altText = readable(colors.text, colors.bgAlt, 4.5);
  const altMuted = readable(colors.muted, colors.bgAlt, 4.5);
  const accentMuted = readable(colors.accentText, colors.accent, 4.5);
  return {
    '--ss-bg': colors.bg, '--ss-bg-alt': colors.bgAlt, '--ss-text': colors.text, '--ss-muted': colors.muted,
    '--ss-accent': colors.accent, '--ss-accent-text': colors.accentText,
    '--ss-alt-text': altText, '--ss-alt-muted': altMuted, '--ss-accent-muted': accentMuted,
    // Accent used for small details on the base background: only when readable there.
    '--ss-accent-on-bg': contrast(colors.accent, colors.bg) >= 3 ? colors.accent : colors.text,
    '--ss-accent-on-alt': contrast(colors.accent, colors.bgAlt) >= 3 ? colors.accent : altText,
    '--ss-font-display': `"${tokens.fonts.display}", Georgia, serif`,
    '--ss-font-body': `"${tokens.fonts.body}", system-ui, sans-serif`,
    '--ss-radius': tokens.radius + 'px',
  };
}

export const STUDIO_CSS = `
.ss-root{--ss-gutter:clamp(20px,5vw,72px);background:var(--ss-current-bg,var(--ss-bg));color:var(--ss-text);font-family:var(--ss-font-body);font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:clip;transition:background-color .7s ease,color .7s ease}
.ss-root *{box-sizing:border-box}
.ss-root img{display:block;max-width:100%}
.ss-root h1,.ss-root h2,.ss-root h3{font-family:var(--ss-font-display);font-weight:var(--ss-display-weight,700);line-height:1.02;letter-spacing:-.02em;margin:0;text-wrap:balance}
.ss-root p{margin:0}
.ss-root a{color:inherit}
.ss-root :focus-visible{outline:3px solid var(--ss-accent);outline-offset:3px}
.ss-grain::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:60;opacity:.07;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.ss-header{position:fixed;inset:0 0 auto;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px var(--ss-gutter);background:color-mix(in srgb,var(--ss-current-bg,var(--ss-bg)) 80%,transparent);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);color:var(--ss-current-text,var(--ss-text));transition:background-color .7s ease,color .7s ease}
@media (max-width:899px){.ss-header .ss-btn{display:none}}
.ss-brand{position:relative;display:flex;align-items:center;gap:10px;font-family:var(--ss-font-display);font-size:20px;text-decoration:none}
.ss-brand img{height:40px;width:auto;max-width:160px;object-fit:contain}
.ss-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:12px 26px;border-radius:max(var(--ss-radius),4px);background:var(--ss-accent);color:var(--ss-accent-text);font-weight:700;font-size:16px;text-decoration:none;border:0;cursor:pointer;will-change:transform}
.ss-btn--small{min-height:44px;padding:10px 18px;font-size:14px}
.ss-scene{color:var(--ss-text);position:relative;padding:clamp(88px,14vh,160px) var(--ss-gutter)}
.ss-tone-alt{--ss-text:var(--ss-alt-text);--ss-muted:var(--ss-alt-muted)}
.ss-tone-destaque{--ss-text:var(--ss-accent-text);--ss-muted:var(--ss-accent-muted)}
.ss-eyebrow{display:inline-block;margin-bottom:18px;font-size:13px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--ss-muted)}
.ss-title{font-size:clamp(40px,6.4vw,96px)}
.ss-text{max-width:60ch;margin-top:22px;font-size:clamp(17px,1.4vw,20px);color:var(--ss-muted)}
.ss-w{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em}
.ss-w>span{display:inline-block}
.ss-media{position:relative;overflow:hidden;border-radius:var(--ss-radius);background:color-mix(in srgb,var(--ss-text) 8%,transparent)}
.ss-media img{width:100%;height:100%;object-fit:cover}
.ss-need{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;width:100%;height:100%;min-height:200px;padding:18px;border:2px dashed color-mix(in srgb,var(--ss-text) 35%,transparent);text-align:center;font-family:ui-monospace,monospace;font-size:13px;color:var(--ss-muted)}
.ss-need strong{color:var(--ss-text);font-size:14px}
.ss-particles{position:absolute;inset:0}
.ss-particles canvas{width:100%!important;height:100%!important;display:block}
.ss-presa-media .ss-media,.ss-layer .ss-media{height:100%}
/* hero-particulas */
.ss-hero{min-height:100svh;display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:clamp(56px,12vh,120px)}
.ss-hero .ss-title{font-size:clamp(46px,9vw,150px);max-width:14ch}
.ss-hero-inner{position:relative;z-index:2}
.ss-hero-actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:34px}
/* hero-midia */
.ss-hero-midia .ss-hero-bg{position:absolute;inset:0;overflow:hidden}
.ss-hero-midia .ss-hero-bg img,.ss-hero-midia .ss-hero-bg .ss-need{width:100%;height:100%;object-fit:cover}
.ss-hero-midia .ss-hero-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,color-mix(in srgb,var(--ss-bg) 92%,transparent) 8%,color-mix(in srgb,var(--ss-bg) 35%,transparent) 55%,transparent)}
/* manifesto */
.ss-manifesto .ss-title{font-size:clamp(34px,5.2vw,80px);max-width:22ch;line-height:1.1}
.ss-manifesto .ss-mw{transition:none}
/* cena-presa */
.ss-presa{display:grid;grid-template-columns:1fr;gap:40px;align-items:center}
.ss-presa-media{aspect-ratio:4/5;max-height:78vh}
.ss-presa-steps{position:relative}
.ss-step{padding:22px 0;border-top:1px solid color-mix(in srgb,var(--ss-text) 18%,transparent)}
.ss-step h3{font-size:clamp(24px,2.6vw,36px)}
.ss-step p{margin-top:10px;color:var(--ss-muted)}
@media (min-width:900px){.ss-presa{grid-template-columns:1fr 1fr;min-height:100vh}.ss-presa-media{height:78vh;aspect-ratio:auto}}
/* cartas-empilhadas */
.ss-cards{display:grid;gap:24px;margin-top:56px}
.ss-card{position:sticky;top:calc(14vh + var(--i) * 18px);display:grid;gap:28px;align-items:center;min-height:52vh;padding:clamp(28px,4vw,56px);border-radius:var(--ss-radius);background:var(--ss-card-bg,var(--ss-bg-alt));color:var(--ss-alt-text);border:1px solid color-mix(in srgb,var(--ss-alt-text) 12%,transparent);transform-origin:50% 0}
.ss-card .ss-num{font-family:var(--ss-font-display);font-size:clamp(48px,6vw,88px);line-height:1;color:var(--ss-accent-on-alt,var(--ss-alt-text));opacity:.9}
.ss-card h3{font-size:clamp(28px,3.4vw,52px)}
.ss-card p{margin-top:14px;color:var(--ss-alt-muted);max-width:52ch}
.ss-card .ss-media{aspect-ratio:4/3}
@media (min-width:900px){.ss-card{grid-template-columns:auto 1fr 1fr}}
/* galeria-horizontal */
.ss-gallery{padding-left:0;padding-right:0}
.ss-gallery-head{padding:0 var(--ss-gutter)}
.ss-track{display:flex;gap:clamp(16px,2vw,32px);padding:48px var(--ss-gutter) 8px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-inline:var(--ss-gutter);scrollbar-width:none}
.ss-track::-webkit-scrollbar{display:none}
.ss-slide{flex:0 0 min(78vw,520px);scroll-snap-align:start}
.ss-slide .ss-media{aspect-ratio:4/5}
.ss-slide h3{margin-top:16px;font-size:clamp(22px,2vw,30px)}
.ss-slide p{margin-top:8px;color:var(--ss-muted);font-size:16px}
@media (min-width:900px){.ss-js .ss-track{overflow:visible}.ss-slide{flex-basis:min(44vh,480px)}.ss-gallery{min-height:100vh}}
/* parallax-camadas */
.ss-layers{position:relative;min-height:120vh;display:grid;place-items:center;text-align:center}
.ss-layer{position:absolute;overflow:hidden;border-radius:var(--ss-radius)}
.ss-layer:nth-of-type(1){left:4%;top:8%;width:min(34vw,380px);aspect-ratio:3/4}
.ss-layer:nth-of-type(2){right:5%;top:30%;width:min(30vw,340px);aspect-ratio:4/5}
.ss-layer:nth-of-type(3){left:30%;bottom:4%;width:min(24vw,280px);aspect-ratio:1}
.ss-layers-copy{position:relative;z-index:2;max-width:760px;padding:32px;background:color-mix(in srgb,var(--ss-bg) 72%,transparent);backdrop-filter:blur(6px);border-radius:var(--ss-radius)}
.ss-tone-alt .ss-layers-copy{background:color-mix(in srgb,var(--ss-bg-alt) 72%,transparent)}
.ss-tone-destaque .ss-layers-copy{background:color-mix(in srgb,var(--ss-accent) 72%,transparent)}
.ss-layers-copy .ss-text{margin-left:auto;margin-right:auto}
@media (max-width:767px){.ss-layers{min-height:auto;display:block;text-align:left}.ss-layer{position:relative;inset:auto!important;width:100%!important;margin-bottom:16px;aspect-ratio:4/3!important}.ss-layers-copy{padding:0;background:none!important;backdrop-filter:none}}
/* contadores */
.ss-counters{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;margin-top:56px}
.ss-counter strong{display:block;font-family:var(--ss-font-display);font-size:clamp(56px,7vw,110px);line-height:1;font-weight:var(--ss-display-weight,700)}
.ss-counter span{display:block;margin-top:10px;color:var(--ss-muted)}
/* antes-depois */
.ss-ba{position:relative;margin-top:48px;aspect-ratio:16/10;max-height:80vh;overflow:hidden;border-radius:var(--ss-radius)}
.ss-ba>.ss-media{position:absolute;inset:0;border-radius:0}
.ss-ba-after{clip-path:inset(0 0 0 50%)}
.ss-ba-line{position:absolute;top:0;bottom:0;left:50%;width:3px;background:var(--ss-accent);transform:translateX(-50%)}
.ss-ba-label{position:absolute;top:16px;padding:6px 12px;border-radius:99px;background:color-mix(in srgb,var(--ss-bg) 80%,transparent);color:var(--ss-text);font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
/* cta-final */
.ss-cta{min-height:90vh;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
.ss-cta .ss-title{font-size:clamp(44px,8vw,128px);max-width:16ch}
.ss-cta .ss-btn{margin-top:40px;min-height:64px;padding:18px 36px;font-size:18px}
.ss-tone-destaque .ss-btn{background:var(--ss-accent-text);color:var(--ss-accent)}
.ss-footer{position:relative;background:var(--ss-bg);padding:32px var(--ss-gutter);font-size:14px;color:var(--ss-muted);border-top:1px solid color-mix(in srgb,var(--ss-text) 12%,transparent)}
.ss-float{position:fixed;right:18px;bottom:18px;z-index:55;width:58px;height:58px;padding:0;border-radius:50%;box-shadow:0 10px 30px rgb(0 0 0 / 30%)}
@media (min-width:900px){.ss-float{display:none}}
@media (prefers-reduced-motion:reduce){.ss-root{transition:none}}
`;
