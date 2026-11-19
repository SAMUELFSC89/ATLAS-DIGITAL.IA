import sanitizeHtml from 'sanitize-html';
import { load } from 'cheerio';
import { createHash } from 'node:crypto';
import type { BuilderSection } from '../../src/lib/siteBuilder.js';
import { builderSectionName } from '../../src/lib/siteBuilder.js';
import { parseSiteLanguage, siteLanguage, DEFAULT_SITE_LANGUAGE, type SiteLanguage } from '../../src/lib/siteLanguages.js';

// The model supplies markup and CSS. Only this fixed script is executable.
const RUNTIME = `(()=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)');let queued=false;const tick=()=>{queued=false;if(reduced.matches)return;document.querySelectorAll('[data-atlas-parallax]').forEach(el=>{const y=el.getBoundingClientRect().top;el.style.translate='0 '+Math.max(-24,Math.min(24,y*.035))+'px';});};addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(tick);}},{passive:true});if(!reduced.matches&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.remove('atlas-reveal-pending');entry.target.classList.add('atlas-reveal-visible');observer.unobserve(entry.target);}}},{threshold:.08,rootMargin:'0px 0px -5% 0px'});document.querySelectorAll('[data-atlas-reveal]').forEach(el=>{if(el.getBoundingClientRect().top>innerHeight*.82)el.classList.add('atlas-reveal-pending');observer.observe(el);});}document.addEventListener('click',event=>{const section=event.target.closest('section[id]');if(section&&parent!==window)parent.postMessage({atlasBuilder:'section',id:section.id},'*');});addEventListener('message',event=>{if(event.source!==parent||event.data?.atlasBuilder!=='scroll'||typeof event.data.id!=='string')return;const el=document.getElementById(event.data.id);if(el?.tagName==='SECTION')el.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});});})();`;
const SCRIPT_HASH = createHash('sha256').update(RUNTIME).digest('base64');
// Sites publicados antes da atualização conservam o runtime anterior no HTML salvo.
const LEGACY_SCRIPT_HASH = 'D/lkRi3jPMq/ku91QldatjK3JKehjcC6FO+K8sZQSQo=';
export function builderCsp(origin: string) {
  return `default-src 'none'; script-src 'sha256-${SCRIPT_HASH}' 'sha256-${LEGACY_SCRIPT_HASH}'; style-src 'unsafe-inline' https://fonts.googleapis.com; img-src ${origin} data:; font-src https://fonts.gstatic.com; connect-src 'none'; base-uri 'none'; object-src 'none'; form-action 'none'`;
}
export function builderImageUrl(value: string, origin: string) {
  try { const url=new URL(value,origin); return url.origin===origin && url.pathname==='/api/site-express' && (url.searchParams.get('view')==='asset'||(url.searchParams.get('view')==='builder'&&url.searchParams.get('action')==='media')) ? url.href : ''; } catch { return ''; }
}
export function prepareBuilderHtml(raw: string, origin: string, preferredLocale?: SiteLanguage): {html: string; sections: BuilderSection[]} {
  if(typeof raw!=='string'||raw.length>600000)throw new Error('Invalid site document');
  const input=load(raw);
  const locale=preferredLocale||parseSiteLanguage(input('html').attr('lang'))||DEFAULT_SITE_LANGUAGE;
  input('script, iframe, object, embed, base, form, input, textarea, #atlas-runtime-style, meta[name=atlas-builder-policy], meta[http-equiv]').remove();
  const safe=sanitizeHtml(input.html(),{
    allowedTags:['html','head','body','title','meta','link','style','header','nav','main','section','article','aside','footer','div','span','p','h1','h2','h3','h4','h5','h6','a','img','picture','figure','figcaption','ul','ol','li','strong','em','b','i','small','br','hr','details','summary','button'],
    allowedAttributes:{'*':['id','class','style','role','hidden','aria-*','data-atlas-*'],html:['lang','dir'],a:['href','target','rel','title'],img:['src','alt','width','height','loading','decoding'],meta:['name','content','charset'],link:['href','rel'],button:['type','aria-label']},
    allowedSchemes:['https'],allowProtocolRelative:false,allowVulnerableTags:true,allowedEmptyAttributes:['hidden'],
    transformTags:{
      img:(_tag,attrs)=>({tagName:'img',attribs:{...attrs,src:builderImageUrl(attrs.src||'',origin),loading:attrs.loading==='eager'?'eager':'lazy',decoding:'async'}}),
      a:(_tag,attrs)=>{let href=attrs.href||'';if(!/^#[a-z0-9_-]*$/i.test(href)){try{const u=new URL(href);if(u.protocol!=='https:'||u.hostname!=='wa.me'||u.username||u.password||u.port)href='#contato';}catch{href='#contato';}}return {tagName:'a',attribs:{...attrs,href,...(href.startsWith('https:')?{target:'_blank',rel:'noopener noreferrer'}:{target:'_self'})}};},
      link:(_tag,attrs)=>{try{const u=new URL(attrs.href);if(u.protocol==='https:'&&u.hostname==='fonts.googleapis.com'&&attrs.rel==='stylesheet')return {tagName:'link',attribs:attrs};}catch{}return {tagName:'span',attribs:{}};},
    },
  });
  const $=load(safe);$('meta[http-equiv],meta[name="atlas-builder-policy"]').remove();
  $('html').attr('lang',locale).attr('dir',siteLanguage(locale).direction);
  $('head').append(`<meta name="atlas-builder-policy" content="1"><meta http-equiv="Content-Security-Policy" content="${builderCsp(origin)}"><meta name="referrer" content="no-referrer">`);
  if(!$('meta[name="viewport"]').length)$('head').append('<meta name="viewport" content="width=device-width,initial-scale=1">');
  const sections:BuilderSection[]=[];const used=new Set<string>();
  $('section').each((index,section)=>{let id=$(section).attr('id')||`secao-${index+1}`;id=id.replace(/[^a-z0-9_-]/gi,'').slice(0,80)||`secao-${index+1}`;if(used.has(id))id+='-'+index;used.add(id);$(section).attr('id',id);
    const texts:BuilderSection['texts']=[];const images:BuilderSection['images']=[];
    $(section).find('h1,h2,h3,p').each((n,el)=>{if($(el).parents('section').first()[0]!==section)return;const value=$(el).text().trim();if(!value||value.length>3000)return;const key=`${id}-text-${n}`;$(el).attr('data-atlas-text',key);texts.push({id:key,tag:el.tagName,text:value});});
    $(section).find('img').each((n,el)=>{const key=`${id}-image-${n}`;$(el).attr('data-atlas-image',key);images.push({id:key,src:$(el).attr('src')||'',alt:$(el).attr('alt')||''});});
    sections.push({id,label:builderSectionName(id),visible:$(section).attr('hidden')===undefined,texts,images});
  });
  $('head').append('<style id="atlas-runtime-style">section[hidden]{display:none!important}html{scroll-behavior:smooth}img{max-width:100%}@media(prefers-reduced-motion:no-preference){.atlas-reveal-pending{opacity:0!important;transform:translate3d(0,22px,0)!important}.atlas-reveal-pending[data-atlas-reveal=left]{transform:translate3d(-30px,0,0)!important}.atlas-reveal-pending[data-atlas-reveal=right]{transform:translate3d(30px,0,0)!important}.atlas-reveal-pending[data-atlas-reveal=zoom]{transform:scale(.96)!important}.atlas-reveal-pending,.atlas-reveal-visible{transition:opacity .7s ease,transform .7s cubic-bezier(.22,1,.36,1)!important}.atlas-reveal-visible{opacity:1!important;transform:none!important}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation:none!important;transition:none!important;translate:none!important}}@media print{*{translate:none!important}}</style>');
  $('body').append('<script>'+RUNTIME+'</script>');
  return {html:'<!DOCTYPE html>\n'+$.html(),sections};
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
