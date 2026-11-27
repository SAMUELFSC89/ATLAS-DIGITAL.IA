import sanitizeHtml from 'sanitize-html';
import { load } from 'cheerio';
import { createHash } from 'node:crypto';
import type { ExpressAsset } from '../../src/lib/expressOrder.js';
import { BUILDER_SCENE_EFFECTS, BUILDER_SCENE_TRANSITIONS, CAMERA_COLUMNS, CAMERA_ROWS, builderSectionName, type BuilderCreativePlan, type BuilderSection } from '../../src/lib/siteBuilder.js';
import { parseSiteLanguage, siteLanguage, DEFAULT_SITE_LANGUAGE, type SiteLanguage } from '../../src/lib/siteLanguages.js';

// The model supplies markup and CSS. Only this fixed script is executable.
const RUNTIME = `(()=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)');let queued=false;const tick=()=>{queued=false;if(reduced.matches)return;document.querySelectorAll('[data-atlas-parallax]').forEach(el=>{const y=el.getBoundingClientRect().top;el.style.translate='0 '+Math.max(-24,Math.min(24,y*.035))+'px';});};addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(tick);}},{passive:true});if(!reduced.matches&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.remove('atlas-reveal-pending');entry.target.classList.add('atlas-reveal-visible');observer.unobserve(entry.target);}}},{threshold:.08,rootMargin:'0px 0px -5% 0px'});document.querySelectorAll('[data-atlas-reveal]').forEach(el=>{if(el.getBoundingClientRect().top>innerHeight*.82)el.classList.add('atlas-reveal-pending');observer.observe(el);});}document.addEventListener('click',event=>{const section=event.target.closest('section[id]');if(section&&parent!==window)parent.postMessage({atlasBuilder:'section',id:section.id},'*');});addEventListener('message',event=>{if(event.source!==parent||event.data?.atlasBuilder!=='scroll'||typeof event.data.id!=='string')return;const el=document.getElementById(event.data.id);if(el?.tagName==='SECTION')el.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});});})();`;
const CAMERA_RUNTIME = `
(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const compact=matchMedia('(max-width: 767px)');
  document.querySelectorAll('[data-atlas-shot-media][data-atlas-sequence]').forEach(media=>{
    const section=media.closest('section[data-atlas-cinematic]');
    const stage=media.closest('[data-atlas-shot]');
    const canvas=media.querySelector('canvas');
    const ctx=canvas?.getContext('2d',{alpha:false});
    if(!section||!stage||!ctx)return;
    const sprite=new Image();
    const columns=${CAMERA_COLUMNS},rows=${CAMERA_ROWS};
    let pending=false,last=-1,ready=false;
    const draw=()=>{
      pending=false;
      if(reduced.matches){
        media.removeAttribute('data-atlas-sequence-active');
        return;
      }
      if(!ready){
        if(!sprite.getAttribute('src'))sprite.src=media.getAttribute('data-atlas-sequence');
        return;
      }
      media.setAttribute('data-atlas-sequence-active','true');
      const distance=Math.max(1,section.offsetHeight-stage.offsetHeight);
      const progress=Math.max(0,Math.min(1,-section.getBoundingClientRect().top/distance));
      const steps=compact.matches?11:columns*rows-1;
      const frame=Math.round(Math.round(progress*steps)*(columns*rows-1)/steps);
      if(frame===last)return;
      last=frame;
      const {width,height}=canvas;
      ctx.drawImage(sprite,(frame%columns)*width,Math.floor(frame/columns)*height,width,height,0,0,width,height);
      canvas.dataset.atlasFrame=String(frame);
    };
    const queue=()=>{
      if(!pending){pending=true;requestAnimationFrame(draw);}
    };
    sprite.onload=()=>{
      canvas.width=sprite.naturalWidth/columns;
      canvas.height=sprite.naturalHeight/rows;
      ready=true;
      queue();
    };
    addEventListener('scroll',queue,{passive:true});
    addEventListener('resize',queue,{passive:true});
    reduced.addEventListener('change',queue);
    queue();
  });
})();
`;
const BUILDER_SCRIPT = RUNTIME+CAMERA_RUNTIME;
const SCRIPT_HASH = createHash('sha256').update(BUILDER_SCRIPT).digest('base64');
const PREVIOUS_SCRIPT_HASH = createHash('sha256').update(RUNTIME).digest('base64');
// Sites publicados antes da atualização conservam o runtime anterior no HTML salvo.
const LEGACY_SCRIPT_HASH = 'D/lkRi3jPMq/ku91QldatjK3JKehjcC6FO+K8sZQSQo=';
const SCENE_STYLES = `
@keyframes atlas-scene-mask { from { clip-path: inset(0 12% 0 12% round 12px); } to { clip-path: inset(0); } }
@keyframes atlas-scene-zoom { from { scale: .94; } to { scale: 1; } }
@keyframes atlas-scene-overlap { from { translate: 0 24px; } to { translate: 0 0; } }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) and (min-width: 768px) {
    [data-atlas-scene-effect="mask"] { animation-name: atlas-scene-mask; }
    [data-atlas-scene-effect="scroll-zoom"] { animation-name: atlas-scene-zoom; }
    [data-atlas-scene-effect="overlap"] { animation-name: atlas-scene-overlap; }
    [data-atlas-scene-effect] {
      animation-duration: 1s;
      animation-timing-function: linear;
      animation-fill-mode: both;
      animation-timeline: view();
      animation-range: entry 0% entry 100%;
    }
  }
}
`;
const CINEMATIC_STYLES = `
html:has([data-atlas-cinematic]), body:has([data-atlas-cinematic]), main:has(> [data-atlas-cinematic]) { overflow-x: clip !important; }
section[data-atlas-cinematic] { display:block !important; padding:0 !important; min-height:0 !important; }
[data-atlas-shot] { position:relative; isolation:isolate; display:grid; align-items:center; min-height:78svh; background:#151419; }
[data-atlas-shot-media] { position:absolute; inset:0; z-index:0; margin:0 !important; overflow:hidden; pointer-events:none; }
[data-atlas-shot-media] img { position:absolute !important; inset:0; width:100% !important; height:100% !important; max-width:none !important; object-fit:cover !important; border-radius:0 !important; }
[data-atlas-shot-media] img + img { opacity:0; }
[data-atlas-shot-media] canvas { display:none; position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:66% center; }
[data-atlas-shot-media][data-atlas-sequence-active] canvas { display:block; }
[data-atlas-shot]::before { content:""; position:absolute; inset:0; z-index:1; pointer-events:none; background:linear-gradient(90deg,rgba(12,11,15,.84),rgba(12,11,15,.48) 46%,rgba(12,11,15,.04) 100%); }
[data-atlas-shot-copy] { position:relative; z-index:2; box-sizing:border-box; width:100%; padding:clamp(2rem,7vw,7rem); color:#fff !important; }
[data-atlas-shot-copy] [data-atlas-shot-decoration] { display:none !important; }
[data-atlas-shot-copy] :is(h1,h2,p) { color:inherit; }
@keyframes atlas-camera-pullback { from { transform:scale(1.42) translateX(5%); } to { transform:scale(1.015); } }
@keyframes atlas-camera-cut { 0%,25% { opacity:0; transform:scale(1.14); } 75%,100% { opacity:1; transform:scale(1.015); } }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion:no-preference) and (min-width:768px) {
    section[data-atlas-cinematic] { min-height:178svh !important; overflow:visible !important; view-timeline-name:--atlas-opening; }
    [data-atlas-shot] { position:sticky; top:0; height:100svh; }
    [data-atlas-shot-media] img { animation:atlas-camera-pullback 1s linear both; animation-timeline:--atlas-opening; animation-range:contain 0% contain 100%; }
    [data-atlas-shot-media] img + img { animation-name:atlas-camera-cut; }
  }
}
@media(max-width:767px) {
  [data-atlas-shot] { min-height:77svh; align-items:end; }
  [data-atlas-shot]::before { background:linear-gradient(0deg,rgba(12,11,15,.94),rgba(12,11,15,.6) 54%,rgba(12,11,15,.09)); }
}
@media (prefers-reduced-motion:no-preference) {
  section[data-atlas-cinematic]:has([data-atlas-sequence-active]) { min-height:195svh !important; overflow:visible !important; }
  section[data-atlas-cinematic]:has([data-atlas-sequence-active]) [data-atlas-shot] { position:sticky; top:0; height:100svh; }
  @media(max-width:767px) {
    section[data-atlas-cinematic]:has([data-atlas-sequence-active]) { min-height:148svh !important; }
    section[data-atlas-cinematic]:has([data-atlas-sequence-active]) [data-atlas-shot] { height:88svh; }
  }
}
`;

function composeCinematicOpening($:ReturnType<typeof load>,origin:string,assets:ExpressAsset[]){
  const hero=$('section#inicio').first();
  if(!hero.length||hero.children('[data-atlas-shot]').length)return;
  const shots=assets.filter(asset=>asset.kind==='photo'&&builderImageUrl(asset.url,origin)).slice(0,2);
  if(!shots.length)return;
  const urls=shots.map(asset=>builderImageUrl(asset.url,origin));
  hero.find('img').filter((_index,el)=>urls.includes($(el).attr('src')||'')).remove();
  const content=hero.contents().remove();
  const frame=$('<div data-atlas-shot="true"></div>');
  const media=$('<figure data-atlas-shot-media="true" aria-hidden="true"></figure>');
  urls.forEach((url,index)=>media.append($('<img alt="" decoding="async">').attr({src:url,loading:index===0?'eager':'lazy'})));
  frame.append(media,$('<div data-atlas-shot-copy="true"></div>').append(content));
  hero.attr('data-atlas-cinematic','true').append(frame);
}

function prepareCameraSequence($:ReturnType<typeof load>,origin:string,sequenceUrl?:string){
  const shot=$('section#inicio > [data-atlas-shot]').first();
  const media=shot.children('[data-atlas-shot-media]').first();
  const url=builderSequenceUrl(sequenceUrl||media.attr('data-atlas-sequence')||'',origin);
  $('[data-atlas-sequence]').removeAttr('data-atlas-sequence');
  $('[data-atlas-sequence-active]').removeAttr('data-atlas-sequence-active');
  if(url&&media.length){
    // The trusted canvas is the sole background of a scroll-controlled opening.
    shot.children('[data-atlas-shot-copy]').find('[data-atlas-shot-media]').remove();
    media.attr('data-atlas-sequence',url).append('<canvas aria-hidden="true"></canvas>');
  }
}
const STORY_STYLES = `
@keyframes atlas-story-wipe{from{clip-path:inset(0 31% 0 0)}to{clip-path:inset(0)}}
@keyframes atlas-story-match{from{scale:1.19;object-position:68% center}to{scale:1;object-position:50% center}}
@keyframes atlas-story-overlap{from{translate:0 11vh;scale:.96}to{translate:0 0;scale:1}}
@keyframes atlas-story-line{from{scale:.12 1}to{scale:1 1}}
@supports (animation-timeline:view()) {
  @media (prefers-reduced-motion:no-preference) {
    section[data-atlas-story-transition="wipe"] [data-atlas-story-visual]{animation-name:atlas-story-wipe}
    section[data-atlas-story-transition="match"] [data-atlas-story-visual]{animation-name:atlas-story-match}
    section[data-atlas-story-transition="overlap"] [data-atlas-story-visual]{animation-name:atlas-story-overlap}
    section[data-atlas-story-transition] [data-atlas-story-visual]{
      animation-duration:1s;animation-timing-function:linear;animation-fill-mode:both;
      animation-timeline:view();animation-range:entry 0% entry 90%;
    }
    section[data-atlas-story-transition]:not([data-atlas-story-transition="cut"]):not(:has([data-atlas-story-visual]))::before{
      content:"";display:block;width:100%;height:1px;background:var(--atlas-accent,currentColor);
      opacity:.55;transform-origin:left;
      animation:atlas-story-line 1s linear both;animation-timeline:view();animation-range:entry 0% entry 75%;
    }
    @media(max-width:767px){
      section[data-atlas-story-transition="overlap"] [data-atlas-story-visual]{animation-name:atlas-story-wipe}
    }
  }
}
`;

function applyStoryboard($:ReturnType<typeof load>,plan:BuilderCreativePlan){
  const byId=new Map(plan.scenes.map(scene=>[scene.section,scene]));
  let outgoing:NonNullable<BuilderCreativePlan['scenes'][number]['transitionEffect']>='cut';
  $('section[id]').each((_index,node)=>{
    const section=$(node);
    const scene=byId.get(section.attr('id')||'');
    if(!scene)return;
    section.attr('data-atlas-story-transition',outgoing);
    outgoing=BUILDER_SCENE_TRANSITIONS.find(effect=>effect===scene.transitionEffect)||'cut';
    // The opening already owns its two-frame timeline. Only decorate visual surfaces below it.
    if(section.is('[data-atlas-cinematic]'))return;
    const visual=section.find('[data-atlas-scene-visual], figure, img').filter((_n,item)=>{
      const el=$(item);
      return !el.is('a,button,nav,h1,h2,h3,p')&&!el.closest('a,button,nav').length&&
        !el.find('a,button,nav,h1,h2,h3,p').length&&!el.text().trim();
    }).first();
    if(!visual.length)return;
    visual.attr('data-atlas-story-visual','true').removeAttr('data-atlas-parallax').removeAttr('data-atlas-reveal');
    if(section.attr('data-atlas-story-transition')==='cut'&&BUILDER_SCENE_EFFECTS.includes(scene.effect)&&scene.effect!=='static'){
      visual.attr('data-atlas-scene-effect',scene.effect);
    }else{
      visual.removeAttr('data-atlas-scene-effect');
    }
  });
}

export function builderCsp(origin: string) {
  return `default-src 'none'; script-src 'sha256-${SCRIPT_HASH}' 'sha256-${PREVIOUS_SCRIPT_HASH}' 'sha256-${LEGACY_SCRIPT_HASH}'; style-src 'unsafe-inline' https://fonts.googleapis.com; img-src ${origin} data:; font-src https://fonts.gstatic.com; connect-src 'none'; base-uri 'none'; object-src 'none'; form-action 'none'`;
}
export function builderImageUrl(value: string, origin: string) {
  try { const url=new URL(value,origin); return url.origin===origin && url.pathname==='/api/site-express' && (url.searchParams.get('view')==='asset'||(url.searchParams.get('view')==='builder'&&url.searchParams.get('action')==='media')) ? url.href : ''; } catch { return ''; }
}
function builderSequenceUrl(value:string,origin:string){
  try{
    const url=new URL(value,origin);
    const id=/^[0-9a-f-]{36}$/i;
    if(url.origin===origin&&url.pathname==='/api/site-express'&&url.searchParams.get('view')==='builder'&&
      url.searchParams.get('action')==='sequence'&&id.test(url.searchParams.get('id')||'')&&id.test(url.searchParams.get('file')||''))return url.href;
  }catch{}
  return '';
}

export function prepareBuilderHtml(raw: string, origin: string, preferredLocale?: SiteLanguage, openingAssets: ExpressAsset[] = [], storyboard?: BuilderCreativePlan|null, sequenceUrl?:string): {html: string; sections: BuilderSection[]} {
  if(typeof raw!=='string'||raw.length>600000)throw new Error('Invalid site document');
  const input=load(raw);
  const locale=preferredLocale||parseSiteLanguage(input('html').attr('lang'))||DEFAULT_SITE_LANGUAGE;
  input('script, iframe, object, embed, base, form, input, textarea, canvas, #atlas-runtime-style, meta[name=atlas-builder-policy], meta[http-equiv]').remove();
  const safe=sanitizeHtml(input.html(),{
    allowedTags:['html','head','body','title','meta','link','style','header','nav','main','section','article','aside','footer','div','span','p','h1','h2','h3','h4','h5','h6','a','img','picture','figure','figcaption','ul','ol','li','strong','em','b','i','small','br','hr','details','summary','button'],
    allowedAttributes:{'*':['id','class','style','role','hidden','aria-*','data-atlas-*'],html:['lang','dir'],a:['href','target','rel','title'],img:['src','alt','width','height','loading','decoding'],meta:['name','content','charset'],link:['href','rel'],button:['type','aria-label']},
    allowedSchemes:['https','tel','mailto'],allowProtocolRelative:false,allowVulnerableTags:true,allowedEmptyAttributes:['hidden'],
    transformTags:{
      img:(_tag,attrs)=>({tagName:'img',attribs:{...attrs,src:builderImageUrl(attrs.src||'',origin),loading:attrs.loading==='eager'?'eager':'lazy',decoding:'async'}}),
      a:(_tag,attrs)=>{let href=attrs.href||'';if(!/^#[a-z0-9_-]*$/i.test(href)){if(/^tel:\+?[0-9]{8,15}$/i.test(href)||/^mailto:[a-z0-9][a-z0-9._+-]*@[a-z0-9.-]+\.[a-z]{2,}$/i.test(href)){/* contato comercial válido */}else{try{const u=new URL(href);const play=u.hostname==='play.google.com'&&u.pathname==='/store/apps/details'&&/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/i.test(u.searchParams.get('id')||'');if(u.protocol!=='https:'||(!play&&u.hostname!=='wa.me')||u.username||u.password||u.port)href='#contato';else if(play)href='https://play.google.com/store/apps/details?id='+u.searchParams.get('id');}catch{href='#contato';}}}return {tagName:'a',attribs:{...attrs,href,...(href.startsWith('https:')?{target:'_blank',rel:'noopener noreferrer'}:{target:'_self'})}};},
      link:(_tag,attrs)=>{try{const u=new URL(attrs.href);if(u.protocol==='https:'&&u.hostname==='fonts.googleapis.com'&&attrs.rel==='stylesheet')return {tagName:'link',attribs:attrs};}catch{}return {tagName:'span',attribs:{}};},
    },
  });
  const $=load(safe);$('meta[http-equiv],meta[name="atlas-builder-policy"]').remove();
  $('html').attr('lang',locale).attr('dir',siteLanguage(locale).direction);
  $('head').append(`<meta name="atlas-builder-policy" content="1"><meta http-equiv="Content-Security-Policy" content="${builderCsp(origin)}"><meta name="referrer" content="no-referrer">`);
  if(!$('meta[name="viewport"]').length)$('head').append('<meta name="viewport" content="width=device-width,initial-scale=1">');
  composeCinematicOpening($,origin,openingAssets);
  prepareCameraSequence($,origin,sequenceUrl);
  const copy=$('[data-atlas-shot]:has([data-atlas-shot-media] img[src]) > [data-atlas-shot-copy]');
  copy.find('[data-atlas-shot-decoration]').removeAttr('data-atlas-shot-decoration');
  copy.find('figure,[data-atlas-scene-visual]').each((_index,node)=>{
    const item=$(node);
    if(!item.is('a,button')&&!item.text().trim()&&!item.find('img[src],a,button').length)item.attr('data-atlas-shot-decoration','true');
  });
  if(storyboard?.scenes.length)applyStoryboard($,storyboard);
  const sections:BuilderSection[]=[];const used=new Set<string>();
  $('section').each((index,section)=>{let id=$(section).attr('id')||`secao-${index+1}`;id=id.replace(/[^a-z0-9_-]/gi,'').slice(0,80)||`secao-${index+1}`;if(used.has(id))id+='-'+index;used.add(id);$(section).attr('id',id);
    const texts:BuilderSection['texts']=[];const images:BuilderSection['images']=[];
    $(section).find('h1,h2,h3,p').each((n,el)=>{if($(el).parents('section').first()[0]!==section)return;const value=$(el).text().trim();if(!value||value.length>3000)return;const key=`${id}-text-${n}`;$(el).attr('data-atlas-text',key);texts.push({id:key,tag:el.tagName,text:value});});
    $(section).find('img').each((n,el)=>{const key=`${id}-image-${n}`;$(el).attr('data-atlas-image',key);images.push({id:key,src:$(el).attr('src')||'',alt:$(el).attr('alt')||''});});
    sections.push({id,label:builderSectionName(id),visible:$(section).attr('hidden')===undefined,texts,images});
  });
  $('head').append('<style id="atlas-runtime-style">section[hidden]{display:none!important}html{scroll-behavior:smooth}img{max-width:100%}@media(prefers-reduced-motion:no-preference){.atlas-reveal-pending{opacity:0!important;transform:translate3d(0,22px,0)!important}.atlas-reveal-pending[data-atlas-reveal=left]{transform:translate3d(-30px,0,0)!important}.atlas-reveal-pending[data-atlas-reveal=right]{transform:translate3d(30px,0,0)!important}.atlas-reveal-pending[data-atlas-reveal=zoom]{transform:scale(.96)!important}.atlas-reveal-pending,.atlas-reveal-visible{transition:opacity .7s ease,transform .7s cubic-bezier(.22,1,.36,1)!important}.atlas-reveal-visible{opacity:1!important;transform:none!important}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation:none!important;transition:none!important;translate:none!important}}@media print{*{translate:none!important;animation:none!important}}</style>');
  $('#atlas-runtime-style').append(SCENE_STYLES+CINEMATIC_STYLES+STORY_STYLES);
  $('body').append('<script>'+BUILDER_SCRIPT+'</script>');
  return {html:'<!DOCTYPE html>\n'+$.html(),sections};
}

export function hasLegacyBuilderOpening(html:string) {
  return html.includes('data-atlas-shot-media="true"') && !html.includes('[data-atlas-shot-copy] [data-atlas-shot-decoration]');
}
export function modifyBuilderHtml(html:string, operation:any,origin:string){
  const $=load(html);
  if(operation.type==='text'){
    if(typeof operation.id!=='string'||!/^[a-z0-9_-]{1,120}$/i.test(operation.id)||typeof operation.text!=='string'||operation.text.length>3000)throw new Error('Texto inválido.');
    const element=$(`[data-atlas-text="${operation.id}"]`);if(!element.length)throw new Error('Texto não encontrado. Atualize o editor.');element.text(operation.text);
  } else if(operation.type==='color'){
    if(!/^#[0-9a-f]{6}$/i.test(operation.color||''))throw new Error('Cor inválida.');
    $('#atlas-brand').remove();$('head').append(`<style id="atlas-brand">:root{--atlas-accent:${operation.color};--accent:${operation.color};--primary:${operation.color}}</style>`);
  } else if(operation.type==='visibility'){
    if(!/^[a-z0-9_-]{1,80}$/i.test(operation.id||'')||typeof operation.visible!=='boolean')throw new Error('Seção inválida.');
    const section=$(`section[id="${operation.id}"]`);if(!section.length)throw new Error('Seção não encontrada.');if(operation.visible)section.removeAttr('hidden');else section.attr('hidden','');
  } else throw new Error('Alteração inválida.');
  return prepareBuilderHtml($.html(),origin);
}
