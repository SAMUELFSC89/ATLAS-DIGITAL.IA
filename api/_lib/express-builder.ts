import { randomUUID, createHash } from 'node:crypto';
import type { Request, Response } from 'express';
import type { DocumentReference } from 'firebase-admin/firestore';
import { getAuthenticatedEmail } from '../radar.js';
import { db, previews, settings, orders, orderId, publicOrigin, saoPauloDay, rateLimit } from './express-store.js';
import { readExpressAsset, resolveExpressAssets, rasterInfo, ASSET_MAX_BYTES, ExpressAssetError } from './express-assets.js';
import { extractSiteHtml } from './express-claude.js';
import { openaiAccessMessage, openaiConfigured, openaiText } from './express-openai.js';
import { prepareBuilderHtml, modifyBuilderHtml, builderCsp, builderImageUrl, hasLegacyBuilderOpening } from './express-builder-html.js';
import { researchBuilder, planBuilder, builderPrompt, generateBuilderPhoto, generateDesignMockup } from './express-builder-ai.js';
import { auditBuilderSite, feedbackForPrompt } from './atlas-builder-skill.js';
import { renderCameraSequence } from './builder-camera-sequence.js';
import { PortfolioError, getOwnerPortfolio, saveCreatorProfile, togglePortfolioSite, savePortfolioCaption, getPublicCreator, getPublicCreatorDirectory } from './builder-portfolio.js';
import { normalizeSiteWhatsApp } from '../../src/lib/siteLanguages.js';
import { DEFAULT_VISUAL_PROMPT } from '../../src/lib/expressVisualPrompt.js';
import { BUILDER_DIRECTIONS, type BuilderProject, type BuilderReference, type BuilderDesignOption, type BuilderDirection } from '../../src/lib/siteBuilder.js';
import { parseSiteLanguage, DEFAULT_SITE_LANGUAGE } from '../../src/lib/siteLanguages.js';
import { importBusinessFromUrl, BusinessImportError, parseBusinessLink } from './builder-business-import.js';
import type { ExpressBusiness, ExpressAsset } from '../../src/lib/expressOrder.js';

const projects=()=>db().collection('expressBuilderProjects');
const published=()=>db().collection('expressBuilderPublished');
const proposals=()=>db().collection('expressBuilderProposals');
const PROPOSAL_DURATION=7*24*60*60*1000;
const proposalLink=(token:string)=>publicOrigin()+'/proposta/'+token;
const learnings=()=>db().collection('expressBuilderLearning');
const ownerLearningId=(email:string)=>createHash('sha256').update(email).digest('hex');
const clean=(v:unknown,n:number)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n):'';
class BuilderError extends Error {constructor(public status:number,message:string){super(message);}}
const fail=(status:number,text:string):never=>{throw new BuilderError(status,text);};
const editable=(p:any)=>{if(p.job)fail(409,'Aguarde a operação em andamento antes de alterar o projeto.');};
function businessInput(input:any):ExpressBusiness{
  const safeWebsite=(value:unknown)=>{try{const parsed=parseBusinessLink(value);return parsed.kind==='website'?parsed.url.href:'';}catch{return '';}};
  const safeSource=(value:unknown)=>{try{return parseBusinessLink(value).url.href;}catch{return '';}};
  return {name:clean(input?.name,100),segment:clean(input?.segment,80),city:clean(input?.city,100),services:clean(input?.services,1000),whatsapp:normalizeSiteWhatsApp(clean(input?.whatsapp,30)),phone:clean(input?.phone,30).replace(/[^\d+().\s-]/g,''),website:safeWebsite(input?.website),sourceUrl:safeSource(input?.sourceUrl),photo:'',assets:[]};
}
function complete(b:ExpressBusiness){if(!b.name||!b.segment||!b.city||!b.services)fail(400,'Não foi possível identificar todos os dados básicos. Confira nome, ramo, localidade e descrição dos serviços.');if(!b.whatsapp&&(!b.phone||b.phone.replace(/\D/g,'').length<8))fail(400,'Informe um WhatsApp ou telefone comercial válido para o site ter um contato funcional.');}
async function owned(id:any,email:string){if(!orderId(id))fail(400,'Projeto inválido.');const p=(await projects().doc(id).get()).data();if(!p||p.ownerEmail!==email)fail(404,'Projeto não encontrado nesta conta.');return p;}
const publicMediaUrl=(id:string,file:string)=>`${publicOrigin()}/api/site-express?view=builder&action=media&id=${id}&file=${file}`;
const sequenceUrl=(id:string,file:string)=>`${publicOrigin()}/api/site-express?view=builder&action=sequence&id=${id}&file=${file}`;
async function state(id:string,p:any):Promise<BuilderProject>{const messages=await projects().doc(id).collection('messages').orderBy('createdAt','desc').limit(30).get();const legacy=p.html&&hasLegacyBuilderOpening(p.html)?prepareBuilderHtml(p.html,publicOrigin(),parseSiteLanguage(p.locale)||undefined):null;return {id,business:p.business,proposalMode:p.proposalMode===true,proposal:p.proposal?.expiresAt>Date.now()?{url:proposalLink(p.proposal.token),version:p.proposal.version,expiresAt:p.proposal.expiresAt}:undefined,locale:parseSiteLanguage(p.locale)||DEFAULT_SITE_LANGUAGE,references:p.references||[],directions:p.directions||BUILDER_DIRECTIONS,directionId:p.directionId||'editorial',sources:p.sources||[],researchNotice:p.researchNotice||'',creativePlan:p.creativePlan||null,designOptions:p.designOptions||[],selectedDesign:p.selectedDesign||undefined,awaitingDesign:Boolean(p.pendingDesign),html:legacy?.html||p.html||'',sections:legacy?.sections||p.sections||[],version:p.version||0,status:p.status||'draft',job:p.job?{id:p.job.id,type:p.job.type,phase:p.job.phase,leaseUntil:p.job.leaseUntil||0}:null,message:p.message||'',imageNotice:p.imageNotice||'',publishedUrl:p.publishedSlug?`${publicOrigin()}/s/${p.publishedSlug}`:undefined,publishedVersion:p.publishedVersion||0,portfolioVisible:p.portfolioVisible===true,updatedAt:p.updatedAt,media:p.media||[],quality:p.quality,feedback:p.feedback,messages:messages.docs.reverse().map(doc=>({id:doc.id,...doc.data()} as any))};}
async function addMessage(id:string,role:'user'|'assistant',text:string,referenceIds:string[]=[],key:string=randomUUID()){await projects().doc(id).collection('messages').doc(key).set({role,text:text.slice(0,3000),referenceIds,createdAt:Date.now()});}
async function saveVersion(id:string,p:any,document:{html:string;sections:any[]},extra:any={}){return db().runTransaction(async tx=>{const ref=projects().doc(id);const current=(await tx.get(ref)).data();if(!current||current.version!==p.version||current.job)fail(409,'O site foi atualizado. Recarregue antes de salvar.');const version=(current.version||0)+1;tx.create(ref.collection('versions').doc(String(version)),{...document,locale:parseSiteLanguage(extra.locale)||parseSiteLanguage(current.locale)||DEFAULT_SITE_LANGUAGE,version,createdAt:Date.now()});tx.update(ref,{...document,...extra,quality:auditBuilderSite(document.html),feedback:null,version,status:'ready',message:'',updatedAt:Date.now()});return {...current,...document,...extra,quality:auditBuilderSite(document.html),feedback:null,version,status:'ready',message:'',updatedAt:Date.now()};});}
async function startJob(id:string,email:string,type:string,body:any){
  if(!['generate','edit','research','image'].includes(type)||!orderId(body.requestId))fail(400,'Operação inválida.');
  if(!openaiConfigured())fail(503,'O assistente está indisponível no momento.');
  const fromRadar=body.proposal===true&&type==='generate';
  const instruction=clean(body.text,type==='image'?1500:3000)||(fromRadar?'Crie uma proposta de site para apresentar à empresa. Use o ramo e o contato fornecidos. Use somente fatos confirmados e textos comerciais neutros. Evite inventar serviços específicos, preços, horários, avaliações, promoções, equipe, garantias ou vínculos com a Atlas.':'');if(['edit','image'].includes(type)&&!instruction)fail(400,'Descreva o que deseja criar ou alterar.');
  const targetLocale=body.targetLocale===undefined?undefined:parseSiteLanguage(body.targetLocale);
  if(body.targetLocale!==undefined&&(!targetLocale||type!=='edit'))fail(400,'Selecione um idioma válido para a tradução.');
  const limits:Record<string,number>={edit:20,research:6,image:8};
  return db().runTransaction(async tx=>{
    const ref=projects().doc(id);
    const limit=limits[type];
    const budget=limit?db().collection('expressBuilderLimits').doc(`${saoPauloDay(Date.now())}-${type}`):null;
    const own=budget?.collection('users').doc(createHash('sha256').update(email).digest('hex'));
    const [snap,all,used]=await tx.getAll(ref,...(budget&&own?[budget,own]:[]));
    const p=snap.data();
    if(!p||p.ownerEmail!==email)fail(404,'Projeto não encontrado.');
    if(p.lastRequestId===body.requestId)return p;
    if(p.job)fail(409,'Já há uma operação em andamento.');
    if(p.pendingDesign)fail(409,'Escolha uma das propostas ou descarte as opções primeiro.');
    complete(p.business);
    if(type==='edit'&&!p.html)fail(409,'Gere o site antes de solicitar ajustes.');
    const ownCount=used?.data()?.count||0;
    const totalCount=all?.data()?.count||0;
    if(limit&&(ownCount>=limit||totalCount>=100))fail(429,'O limite desta operação foi atingido hoje. Seus projetos continuam salvos.');
    const reuseDesign=type==='generate'&&body.reuseSelectedDesign===true;
    if(reuseDesign&&!p.designOptions?.some((option:BuilderDesignOption)=>option.id===p.selectedDesign)){
      fail(409,'Escolha uma proposta antes de refazer o site.');
    }
    const newDesign=type==='generate'&&!reuseDesign;
    const proposal=p.proposalMode===true&&newDesign&&body.proposal===true;
    const job={id:body.requestId,type,...(proposal?{proposal:true}:{}),...(targetLocale?{targetLocale}:{}),phase:reuseDesign?'selected-planning':newDesign?'planning':type==='research'?'references':type==='image'?'image':'building',instruction:reuseDesign?(p.selectedInstruction||instruction):instruction,referenceIds:(p.references||[]).map((r:any)=>r.id),leaseUntil:0,aspect:body.aspect==='3:4'?'3:4':'16:9',createdAt:Date.now()};
    if(budget&&own){tx.set(budget,{count:totalCount+1});tx.set(own,{count:ownCount+1});}
    const reset=newDesign?{designOptions:[],selectedDesign:null,selectedInstruction:''}:{};
    if(newDesign)for(const option of p.designOptions||[])tx.delete(ref.collection('designs').doc(option.id));
    const update={...reset,job,lastRequestId:body.requestId,status:'working',message:'',updatedAt:Date.now()};
    tx.update(ref,update);
    return {...p,...update};
  });
}
async function storeGenerated(id:string,photo:Awaited<ReturnType<typeof generateBuilderPhoto>>){const file=randomUUID();const asset:ExpressAsset={id:file,projectId:id,kind:'photo',name:'Imagem ilustrativa criada por IA',mimeType:photo.mimeType,width:photo.width,height:photo.height,size:photo.buffer.length,url:publicMediaUrl(id,file)};await projects().doc(id).collection('media').doc(file).create({...asset,data:photo.buffer,createdAt:Date.now()});return asset;}
async function loadVisualReferences(ref:DocumentReference, ids:string[]){
  const files=await Promise.all(ids.slice(0,4).map(id=>ref.collection('references').doc(id).get()));
  return files.flatMap(file=>{
    const data=file.data();
    return data?.data?[{name:data.name,mimeType:data.mimeType,data:Buffer.from(data.data).toString('base64')}]:[];
  });
}

function advancePhase(ref:DocumentReference,token:string,phase:string,patch:Record<string,unknown>,sequence?:Buffer){
  return db().runTransaction(async tx=>{
    const current=(await tx.get(ref)).data();
    if(current?.job?.leaseToken!==token)return current;
    const updatedAt=Date.now();
    const sequenceId=sequence?current.job.id:null;
    if(sequenceId)tx.create(ref.collection('sequences').doc(sequenceId),{data:sequence});
    tx.update(ref,{...patch,'job.phase':phase,'job.leaseUntil':0,...(sequenceId?{'job.sequenceId':sequenceId}:{}),updatedAt});
    return {...current,...patch,job:{...current.job,phase,leaseUntil:0,...(sequenceId?{sequenceId}:{})},updatedAt};
  });
}

function afterDesign(project:any){
  const photos:ExpressAsset[]=project.business.assets||[];
  return photos.some(asset=>asset.kind==='photo')?'sequence':'images';
}

async function chooseDesign(ref:DocumentReference,email:string,optionId:string|null,notes:string){
  return db().runTransaction(async tx=>{
    const current=(await tx.get(ref)).data();
    if(!current||current.ownerEmail!==email)fail(404,'Projeto não encontrado.');
    if(optionId===current.selectedDesign&&!current.pendingDesign)return current;
    if(current.job||!current.pendingDesign)fail(409,'As propostas já mudaram. Atualize o editor.');
    const option=current.designOptions?.find((entry:BuilderDesignOption)=>entry.id===optionId);
    if(optionId&&!option)fail(400,'Selecione uma das três propostas.');
    const previous=current.pendingDesign.instruction||'';
    const instruction=notes?`Ajustes aprovados: ${notes}\n\nBriefing: ${previous}`.slice(0,3800):previous;
    const update=option
      ? {pendingDesign:null,selectedDesign:option.id,selectedInstruction:instruction,directionId:option.direction.id,
         job:{...current.pendingDesign,instruction,phase:'selected-planning',leaseUntil:0},status:'working',message:'',updatedAt:Date.now()}
      : {pendingDesign:null,job:null,status:current.html?'ready':'draft',message:'',updatedAt:Date.now()};
    tx.update(ref,update);
    return {...current,...update};
  });
}

async function advance(id:string,email:string){
  const ref=projects().doc(id),token=randomUUID();
  const claim=await db().runTransaction(async tx=>{const snap=await tx.get(ref);const p=snap.data();if(!p||p.ownerEmail!==email)fail(404,'Projeto não encontrado.');if(!p.job||p.job.leaseUntil>Date.now())return null;tx.update(ref,{'job.leaseUntil':Date.now()+290000,'job.leaseToken':token});return p;});
  if(!claim)return (await ref.get()).data();const job=claim.job;let patch:any={},assistant='';let doc:any=null;
  try{
    if(job.phase==='planning'&&job.type==='generate'){
      let planPatch:Pick<BuilderProject,'sources'|'creativePlan'|'researchNotice'|'directions'>={directions:claim.directions||BUILDER_DIRECTIONS,sources:[],creativePlan:null,researchNotice:'A busca no Pinterest ficou indisponível. A criação continua com o briefing e as referências anexadas.'};
      const direction=(claim.directions||BUILDER_DIRECTIONS).find((d:any)=>d.id===claim.directionId)||BUILDER_DIRECTIONS[0];
      const options={direction,instruction:job.instruction,locale:parseSiteLanguage(claim.locale)||DEFAULT_SITE_LANGUAGE,references:await loadVisualReferences(ref,job.referenceIds||[])};
      try{
        const result=await researchBuilder(claim.business,options);
        planPatch={directions:result.directions,sources:result.sources,creativePlan:result.creativePlan||null,researchNotice:result.researchNotice};
      }catch(error){
        if(openaiAccessMessage(error))throw error;
        console.warn('[Atlas Builder] Planejamento indisponível.',{status:Number((error as any)?.status)||0,name:error instanceof Error?error.name:'unknown'});
      }
      if(!planPatch.creativePlan)planPatch.creativePlan=await planBuilder(claim.business,options,planPatch.sources);
      return await advancePhase(ref,token,job.proposal?afterDesign(claim):'designs',planPatch);
    }
    if(job.phase==='designs'&&job.type==='generate'){
      const prior:BuilderDesignOption[]=claim.designOptions||[];
      const directions:BuilderDirection[]=claim.directions||BUILDER_DIRECTIONS;
      // Start with the user's chosen style and keep the other two visually distinct.
      const ordered=[...directions].sort((a,b)=>Number(b.id===claim.directionId)-Number(a.id===claim.directionId));
      const direction=ordered[prior.length]||BUILDER_DIRECTIONS[prior.length];
      const config=(await settings().get()).data();
      const photo=await generateDesignMockup(claim.business,{
        direction,instruction:job.instruction,locale:parseSiteLanguage(claim.locale)||DEFAULT_SITE_LANGUAGE,
        references:await loadVisualReferences(ref,job.referenceIds||[]),
      },claim.creativePlan,typeof config?.visualPrompt==='string'?config.visualPrompt:DEFAULT_VISUAL_PROMPT,claim.sources||[]);
      const option:BuilderDesignOption={id:randomUUID(),direction,format:'scroll-storyboard'};
      return await db().runTransaction(async tx=>{
        const current=(await tx.get(ref)).data();
        if(current?.job?.leaseToken!==token)return current;
        const designOptions=[...prior,option];
        const done=designOptions.length===3;
        const update={designOptions,pendingDesign:done?job:null,job:done?null:{...job,leaseUntil:0},status:done?(current.html?'ready':'draft'):'working',updatedAt:Date.now()};
        tx.create(ref.collection('designs').doc(option.id),{data:photo.buffer,mimeType:photo.mimeType});
        tx.update(ref,update);
        return {...current,...update};
      });
    }
    if(job.phase==='selected-planning'&&job.type==='generate'){
      const option=(claim.designOptions||[]).find((entry:BuilderDesignOption)=>entry.id===claim.selectedDesign);
      if(!option)throw new Error('A proposta selecionada não está disponível.');
      const image=(await ref.collection('designs').doc(option.id).get()).data();
      if(!image?.data)throw new Error('A imagem selecionada não está disponível.');
      const chosen={name:option.direction.name,mimeType:image.mimeType,data:Buffer.from(image.data).toString('base64')};
      const options={direction:option.direction,instruction:job.instruction,locale:parseSiteLanguage(claim.locale)||DEFAULT_SITE_LANGUAGE,references:await loadVisualReferences(ref,job.referenceIds||[])};
      const creativePlan=await planBuilder(claim.business,options,claim.sources||[],chosen);
      return await advancePhase(ref,token,afterDesign(claim),{creativePlan,openingNextId:null});
    }
    if(job.phase==='next-image'&&job.type==='generate'){
      try{
        const last=(claim.openingAssetIds||[]).at(-1);
        const reference=last?(await ref.collection('media').doc(last).get()).data():null;
        const photo=await generateBuilderPhoto(claim.business,claim.creativePlan.nextImagePrompt,'16:9',
          reference?.data?{buffer:Buffer.from(reference.data),mimeType:reference.mimeType}:undefined);
        const asset=await storeGenerated(id,photo);
        return await advancePhase(ref,token,'sequence',{openingNextId:asset.id,media:[...(claim.media||[]),asset].slice(-12)});
      }catch(error){
        console.warn('[Atlas Builder] Fotografia da próxima cena indisponível.',{name:error instanceof Error?error.name:'unknown'});
        return await advancePhase(ref,token,'sequence',{});
      }
    }
    if(job.phase==='sequence'&&job.type==='generate'){
      const photo=(claim.business.assets||[]).find((asset:ExpressAsset)=>asset.kind==='photo');
      const generated=(claim.openingAssetIds||[]).at(-1);
      let sequence:Buffer|undefined;
      try{
        const original=photo?await readExpressAsset(id,photo.id):null;
        const stored=!photo&&generated?(await ref.collection('media').doc(generated).get()).data():null;
        const source=original?.buffer||(stored?.data?Buffer.from(stored.data):null);
        const first=(claim.openingAssetIds||[])[0];
        const action=Boolean(claim.creativePlan?.actionImagePrompt)&&!photo&&first&&first!==generated;
        const opening=action?(await ref.collection('media').doc(first).get()).data():null;
        const lightning=/\b(raios?|rel[aâ]mpagos?)\b/iu.test(job.instruction||'');
        if(source)sequence=opening?.data
          ? await renderCameraSequence(Buffer.from(opening.data),{action:source,lightning})
          : await renderCameraSequence(source,{lightning});
      }catch(error){
        console.warn('[Atlas Builder] Sequência de câmera indisponível.',{name:error instanceof Error?error.name:'unknown'});
      }
      return await advancePhase(ref,token,'building',{},sequence);
    }
    if(job.type==='research'){const {directions,sources,researchNotice}=await researchBuilder(claim.business);patch={directions,sources,researchNotice};assistant=patch.sources.length?'Encontrei referências públicas e preparei três direções visuais. Escolha uma delas para o seu site.':patch.researchNotice;}
    else if(job.phase==='images'||job.type==='image'){
      try{
        const automatic=job.phase==='images';
        const planned=claim.creativePlan?.heroImagePrompt||job.instruction||`Fotografia de destaque para ${claim.business.segment}.`;
        const picked=automatic&&claim.selectedDesign?(await ref.collection('designs').doc(claim.selectedDesign).get()).data():null;
        const reference=picked?.data?{buffer:Buffer.from(picked.data),mimeType:picked.mimeType,isMockup:true}:undefined;
        const direction=automatic?planned+' Enquadramento fechado, com o assunto visível no lado direito e espaço negativo para a chamada no lado esquerdo. Preserve a luz e a paleta da proposta.':'';
        const close=await generateBuilderPhoto(claim.business,direction||job.instruction,automatic?'16:9':job.aspect,reference);
        const assets=[await storeGenerated(id,close)];
        if(automatic){
          try{
            const action=claim.creativePlan?.actionImagePrompt;
            const shot=action
              ? `Crie o instante decisivo: ${action}. Preserve exatamente o personagem, figurino, ambiente e paleta da fotografia anterior. Enquadre a ação no centro-direita, deixando espaço limpo à esquerda. Fotograma sem textos.`
              : 'Crie o segundo plano da mesma cena, em ângulo aberto. Preserve ambiente, sujeito, materiais, figurino e luz da imagem anexa. O objeto permanece no lado direito, revele o contexto ao redor.';
            const wide=await generateBuilderPhoto(claim.business,shot,'16:9',close);
            assets.push(await storeGenerated(id,wide));
          }catch(error){
            console.warn('[Atlas Builder] Segundo enquadramento indisponível.',{status:Number((error as any)?.status)||0});
          }
        }
        patch={media:[...(claim.media||[]),...assets].slice(-12),imageNotice:'',...(automatic?{openingAssetIds:assets.map(asset=>asset.id)}:{})};
        assistant='A imagem foi criada e adicionada à sua biblioteca. Escolha onde deseja usá-la no site.';
      }
      catch(error){if(job.type==='image')throw error;patch={openingAssetIds:[],imageNotice:'Não foi possível criar a imagem de destaque agora. Você pode enviar fotos ou tentar novamente na biblioteca de imagens.'};}
      if(job.phase==='images')return await advancePhase(ref,token,claim.creativePlan?.nextImagePrompt?'next-image':'sequence',patch);
    }else{
      const config=(await settings().get()).data();const refs=await loadVisualReferences(ref,job.referenceIds||[]);
      const history=await ref.collection('messages').orderBy('createdAt','desc').limit(16).get();
      const learning=(await learnings().doc(ownerLearningId(email)).get()).data();
      const learningContext=feedbackForPrompt(learning?.entries,claim.business.segment);
      const resultLocale=parseSiteLanguage(job.targetLocale)||parseSiteLanguage(claim.locale)||DEFAULT_SITE_LANGUAGE;
      const allAssets:ExpressAsset[]=[...(claim.business.assets||[]),...(claim.media||[])];
      const businessPhotos:ExpressAsset[]=(claim.business.assets||[]).filter((asset:ExpressAsset)=>asset.kind==='photo');
      const generatedShots:ExpressAsset[]=(claim.openingAssetIds||[]).flatMap((assetId:string)=>allAssets.filter(asset=>asset.id===assetId));
      const sequenceId=job.type==='generate'?job.sequenceId:claim.openingSequenceId;
      const opening=job.type==='generate'||sequenceId
        ? (businessPhotos.length?businessPhotos.slice(0,1):generatedShots.length?(sequenceId&&!claim.creativePlan?.actionImagePrompt?generatedShots.slice(-1):generatedShots):allAssets.filter(asset=>asset.kind==='photo').slice(0,1))
        : [];
      const nextImage=job.type==='generate'?allAssets.find(asset=>asset.id===claim.openingNextId):undefined;
      const selected=claim.selectedDesign?(await ref.collection('designs').doc(claim.selectedDesign).get()).data():null;
      const chosenDesign=selected?.data?{name:'Proposta escolhida',mimeType:selected.mimeType,data:Buffer.from(selected.data).toString('base64')}:undefined;
      const prompt=await builderPrompt({...claim.business,assets:allAssets},(claim.directions||BUILDER_DIRECTIONS).find((d:any)=>d.id===claim.directionId)||BUILDER_DIRECTIONS[0],typeof config?.visualPrompt==='string'?config.visualPrompt:DEFAULT_VISUAL_PROMPT,publicOrigin(),refs,job.instruction||'Crie o site completo.',job.type==='edit'?claim.html:undefined,history.docs.filter(d=>d.data().role==='user').reverse().map(d=>d.data().text),learningContext,resultLocale,{plan:claim.creativePlan||null,sources:job.type==='generate'?claim.sources||[]:[],cinematic:opening.length>0,chosenDesign,nextImageUrl:nextImage?.url});
      doc=prepareBuilderHtml(extractSiteHtml(await openaiText(prompt.system,prompt.content,265000)),publicOrigin(),resultLocale,opening,job.type==='generate'?claim.creativePlan:undefined,sequenceId?sequenceUrl(id,sequenceId):undefined);
      patch={...patch,locale:resultLocale,quality:auditBuilderSite(doc.html),feedback:null,...(job.type==='generate'?{openingSequenceId:sequenceId||null}:{})};
      assistant=job.type==='edit'?'O site foi atualizado. Revise as alterações no editor.':'Seu site está criado. Você pode editar os textos, as cores e as imagens ou pedir ajustes pelo chat.';
    }
    return await db().runTransaction(async tx=>{const current=(await tx.get(ref)).data();if(current?.job?.leaseToken!==token)return current;const version=doc?(current.version||0)+1:current.version||0;
      if(doc)tx.create(ref.collection('versions').doc(String(version)),{...doc,locale:patch.locale,version,createdAt:Date.now()});
      if(doc&&job.proposal){
        const proposal={token:randomUUID(),version,expiresAt:Date.now()+PROPOSAL_DURATION};
        tx.create(proposals().doc(proposal.token),{html:doc.html,expiresAt:proposal.expiresAt});
        patch.proposal=proposal;
      }
      const update={...patch,...(doc||{}),version,job:null,status:doc||current.html?'ready':'draft',message:'',updatedAt:Date.now()};tx.update(ref,update);
      if(assistant)tx.set(ref.collection('messages').doc(job.id+'-assistant'),{role:'assistant',text:assistant,createdAt:Date.now(),referenceIds:[]});return {...current,...update};
    });
  }catch(error){console.warn('[Atlas Builder] Operação interrompida.',{type:job.type,status:Number((error as any)?.status)||0,name:error instanceof Error?error.name:'unknown',code:(error as any)?.code||''});
    return await db().runTransaction(async tx=>{const current=(await tx.get(ref)).data();if(current?.job?.leaseToken!==token)return current;const update={job:null,status:'error',message:openaiAccessMessage(error)||(job.phase==='designs'?'Não foi possível completar as três propostas. Confira o acesso à geração de imagens na OpenAI e tente novamente.':job.type==='research'?'A pesquisa no Pinterest não ficou disponível agora. Você pode usar as direções da Atlas ou enviar até quatro referências.':job.type==='image'?'Não foi possível criar a imagem agora. Confira a conexão do gerador ou tente novamente mais tarde.':'Não foi possível concluir esta criação agora. Seus arquivos e a última versão do site foram preservados.'),updatedAt:Date.now()};tx.update(ref,update);return {...current,...update};});
  }
}
export default async function builder(req:Request,res:Response){
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  try{
    const action=String(req.query.action||req.body?.action||'state');
    if(req.method==='GET'&&action==='creator-directory')return res.json(await getPublicCreatorDirectory(String(req.query.cursor||'')));
    if(req.method==='GET'&&action==='creator-public')return res.json(await getPublicCreator(String(req.query.handle||'')));
    if(req.method==='GET'&&action==='proposal'){
      res.setHeader('X-Robots-Tag','noindex, nofollow, nosnippet');
      res.setHeader('Referrer-Policy','no-referrer');
      const token=String(req.query.token||'');
      const proposed=orderId(token)?(await proposals().doc(token).get()).data():null;
      if(!proposed?.html||proposed.expiresAt<=Date.now())return res.status(404).send('Prévia indisponível ou expirada.');
      res.setHeader('Content-Type','text/html; charset=utf-8');
      res.setHeader('Content-Security-Policy',builderCsp(publicOrigin())+"; frame-ancestors 'none'");
      return res.send(proposed.html.replace('</body>','<aside style="position:fixed;bottom:8px;left:8px;z-index:2147483647;background:#171717;color:#fff;padding:6px 10px;border-radius:4px;font:12px system-ui">Proposta de site · Atlas Digital</aside></body>'));
    }
    if(req.method==='GET'&&action==='published'){
      const slug=String(req.query.slug||'');if(!/^[a-z0-9-]{5,70}$/.test(slug))return res.status(404).send('Site não encontrado.');const site=(await published().doc(slug).get()).data();if(!site?.html)return res.status(404).send('Site não encontrado.');res.setHeader('Content-Security-Policy',builderCsp(publicOrigin())+"; frame-ancestors 'none'");res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','public,max-age=60,s-maxage=60');return res.send(site.html);
    }
    if(req.method==='GET'&&action==='media'){
      if(!orderId(req.query.id)||!orderId(req.query.file))return res.status(404).end();const p=(await projects().doc(req.query.id).get()).data();if(!(p?.media||[]).some((a:any)=>a.id===req.query.file))return res.status(404).end();const file=(await projects().doc(req.query.id).collection('media').doc(String(req.query.file)).get()).data();if(!file?.data)return res.status(404).end();res.setHeader('Content-Type',file.mimeType);res.setHeader('Cache-Control','public,max-age=86400,s-maxage=86400');return res.send(Buffer.from(file.data));
    }
    if(req.method==='GET'&&action==='sequence'){
      if(!orderId(req.query.id)||!orderId(req.query.file))return res.status(404).end();
      const sequence=(await projects().doc(req.query.id).collection('sequences').doc(req.query.file).get()).data();
      if(!sequence?.data)return res.status(404).end();
      res.setHeader('Content-Type','image/webp');
      res.setHeader('Cache-Control','public,max-age=86400,s-maxage=86400,immutable');
      return res.send(Buffer.from(sequence.data));
    }
    const email=(await getAuthenticatedEmail(req))?.toLowerCase();if(!email)return res.status(401).json({error:'Entre na sua conta para criar e editar seus sites.'});
    if(req.method==='GET'&&action==='list'){const rows=await projects().where('ownerEmail','==',email).limit(250).get();return res.json({projects:rows.docs.map(d=>({id:d.id,name:d.data().business?.name||'Novo site',status:d.data().status,version:d.data().version,portfolioVisible:d.data().portfolioVisible===true,publishedUrl:d.data().publishedSlug?publicOrigin()+'/s/'+d.data().publishedSlug:null,updatedAt:d.data().updatedAt})).sort((a,b)=>b.updatedAt-a.updatedAt)});}
    if(req.method==='GET'&&action==='owner-portfolio')return res.json(await getOwnerPortfolio(email));
    if(req.method==='POST'&&action==='creator-profile')return res.json(await saveCreatorProfile(email,req.body));
    if(req.method==='POST'&&action==='portfolio-caption'){
      if(!orderId(req.body?.id)||typeof req.body?.caption!=='string'||req.body.caption.length>230)fail(400,'Informe uma descrição com até 230 caracteres.');
      await savePortfolioCaption(email,String(req.body.id),req.body.caption);return res.json(await getOwnerPortfolio(email));
    }
    if(req.method==='POST'&&action==='portfolio-toggle'){
      if(!orderId(req.body?.id)||typeof req.body?.visible!=='boolean')fail(400,'Escolha o projeto e a visibilidade.');
      await togglePortfolioSite(email,String(req.body.id),req.body.visible);
      const changed=(await projects().doc(req.body.id).get()).data();return res.json({project:await state(String(req.body.id),changed)});
    }
    if(req.method==='GET'&&action==='config')return res.json({available:openaiConfigured(),images:openaiConfigured(),directions:BUILDER_DIRECTIONS});
    if(req.method==='POST'&&action==='import-business'){
      if(!(await rateLimit(email,'builder-import',12,300)))fail(429,'Muitas buscas de dados da empresa. Tente novamente mais tarde.');
      if(typeof req.body?.url!=='string'||req.body.url.length>1600)fail(400,'Cole um endereço público válido.');
      return res.json(await importBusinessFromUrl(req.body.url));
    }
    const id=req.method==='GET'?req.query.id:req.body?.id;
    if(req.method==='POST'&&action==='create'){
      if(!orderId(id))fail(400,'Projeto inválido.');const existing=(await projects().doc(id).get()).data();if(existing){if(existing.ownerEmail!==email)fail(404,'Projeto não encontrado.');return res.json({project:await state(id,existing)});}
      if(!(await rateLimit(email,'builder-create',12,100)))fail(429,'Muitos projetos criados em pouco tempo. Aguarde e tente novamente.');const business=businessInput(req.body.business);complete(business);business.assets=await resolveExpressAssets(req.body,id);business.photo=business.assets.find(a=>a.kind==='photo')?.url||'';
      const locale=req.body?.locale===undefined?DEFAULT_SITE_LANGUAGE:parseSiteLanguage(req.body.locale);if(!locale)fail(400,'Selecione um idioma válido para o site.');
      const p={ownerEmail:email,business,locale,proposalMode:req.body.proposal===true,references:[],directions:BUILDER_DIRECTIONS,directionId:'editorial',sources:[],version:0,html:'',sections:[],media:[],status:'draft',job:null,createdAt:Date.now(),updatedAt:Date.now()};
      const batch=db().batch();batch.create(projects().doc(id),p);batch.create(previews().doc(id),{business,title:business.name,introduction:'',offers:[],createdAt:Date.now()});await batch.commit();return res.json({project:await state(id,p)});
    }
    const p=await owned(id,email);const ref=projects().doc(String(id));
    if(req.method==='GET'){
      if(action==='design'){
        if(!orderId(req.query.file)||!p.designOptions?.some((option:BuilderDesignOption)=>option.id===req.query.file))fail(404,'Proposta não encontrada.');
        const image=(await ref.collection('designs').doc(String(req.query.file)).get()).data();
        if(!image?.data)fail(404,'Proposta não encontrada.');
        res.setHeader('Content-Type',image.mimeType);
        return res.send(Buffer.from(image.data));
      }
      if(action==='reference'){
        if(!orderId(req.query.file)||!p.references?.some((r:any)=>r.id===req.query.file))fail(404,'Referência não encontrada.');const file=(await ref.collection('references').doc(String(req.query.file)).get()).data();if(!file?.data)fail(404,'Referência não encontrada.');res.setHeader('Content-Type',file.mimeType);return res.send(Buffer.from(file.data));
      }
      if(action==='versions'){const rows=await ref.collection('versions').orderBy('createdAt','desc').limit(10).get();return res.json({versions:rows.docs.map(d=>({version:d.data().version,createdAt:d.data().createdAt}))});}
      return res.json({project:await state(String(id),p)});
    }
    if(req.method!=='POST')return res.status(405).end();
    if(action==='run')return res.json({project:await state(String(id),await advance(String(id),email))});
    if(action==='start'){
      const next=await startJob(String(id),email,req.body.type,req.body);if(next.job?.id===req.body.requestId&&req.body.text)await addMessage(String(id),'user',clean(req.body.text,3000),next.job.referenceIds,req.body.requestId+'-user');return res.json({project:await state(String(id),next)});
    }
    if(action==='choose-design'||action==='dismiss-designs'){
      const optionId=action==='choose-design'?req.body.optionId:null;
      if(action==='choose-design'&&!orderId(optionId))fail(400,'Proposta inválida.');
      return res.json({project:await state(String(id),await chooseDesign(ref,email,optionId,clean(req.body.notes,800)))});
    }
    editable(p);
    if(p.pendingDesign)fail(409,'Escolha uma das propostas ou descarte as opções primeiro.');
    if(action==='language'){
      const locale=parseSiteLanguage(req.body?.locale);if(!locale)fail(400,'Selecione um idioma válido.');
      await db().runTransaction(async tx=>{const current=(await tx.get(ref)).data();editable(current);if(current.version!==p.version)fail(409,'O projeto mudou. Recarregue antes de salvar.');if(current.html)fail(409,'Para alterar o idioma de um site criado, use a opção Traduzir site.');tx.update(ref,{locale,updatedAt:Date.now()});});
    }else if(action==='feedback'){
      if(!p.html||!p.version)fail(409,'Crie um site antes de avaliar.');
      if(req.body.version!==p.version)fail(409,'O site foi alterado. Avalie a versão mais recente.');
      const rating=req.body.rating;
      if(rating!=='good'&&rating!=='improve')fail(400,'Selecione uma avaliação.');
      const note=clean(req.body.note,500);
      if(rating==='improve'&&!note)fail(400,'Conte brevemente o que deve melhorar.');
      if(!(await rateLimit(email,'builder-feedback',20,100)))fail(429,'Muitas avaliações enviadas. Tente novamente mais tarde.');
      const learningRef=learnings().doc(ownerLearningId(email)),timestamp=Date.now();
      await db().runTransaction(async tx=>{
        const [siteSnap,learningSnap]=await tx.getAll(ref,learningRef);
        const site=siteSnap.data();if(!site||site.ownerEmail!==email||site.version!==p.version||site.job)fail(409,'Este site foi atualizado. Recarregue antes de avaliar.');
        const feedback={version:p.version,rating,note,createdAt:timestamp};
        const selectedDirection=(site.directions||BUILDER_DIRECTIONS).find((d:any)=>d.id===site.directionId)||BUILDER_DIRECTIONS[0];
        const learnedNote=note||(rating==='good'?`Cliente aprovou a direção visual ${selectedDirection.name}: ${selectedDirection.typography}; ${selectedDirection.layout}`.slice(0,350):'');
        const entry={projectId:String(id),version:p.version,segment:site.business.segment,rating,note:learnedNote,createdAt:timestamp};
        const prior=Array.isArray(learningSnap.data()?.entries)?learningSnap.data().entries.filter((e:any)=>!(e.projectId===id&&e.version===p.version)):[];
        tx.set(learningRef,{entries:[...prior.slice(-11),entry],updatedAt:timestamp},{merge:true});
        tx.update(ref,{feedback,updatedAt:timestamp});
      });
    }else if(action==='upload-reference'){
      if (!(await rateLimit(email,'builder-reference',24,200))) fail(429,'O limite de envio de referências foi atingido. Tente novamente mais tarde.');
      const body=req.body;if(!orderId(body.fileId)||typeof body.data!=='string'||body.data.length>Math.ceil(ASSET_MAX_BYTES/3)*4||!/^[A-Za-z0-9+/]+={0,2}$/.test(body.data))fail(400,'Envie uma referência JPG, PNG ou WebP.');const bytes=Buffer.from(body.data,'base64');if(bytes.length<40||bytes.length>ASSET_MAX_BYTES)fail(400,'A referência ficou muito grande.');const info=rasterInfo(bytes);const metadata:BuilderReference={id:body.fileId,name:clean(body.name,120)||'Referência',...info,size:bytes.length};
      await db().runTransaction(async tx=>{const file=ref.collection('references').doc(metadata.id);const [snap,old]=await tx.getAll(ref,file);const current=snap.data();editable(current);const refs=current.references||[];if(old.exists){if(!refs.some((r:any)=>r.id===metadata.id))fail(409,'Selecione o arquivo novamente.');return;}if(refs.length>=4)fail(400,'Você pode anexar até quatro referências por projeto.');tx.create(file,{...metadata,data:bytes,createdAt:Date.now()});tx.update(ref,{references:[...refs,metadata],updatedAt:Date.now()});});
    }else if(action==='remove-reference'){
      if(!orderId(req.body.fileId))fail(400,'Referência inválida.');await db().runTransaction(async tx=>{const current=(await tx.get(ref)).data();editable(current);tx.update(ref,{references:(current.references||[]).filter((r:any)=>r.id!==req.body.fileId),updatedAt:Date.now()});});
    }else if(action==='direction'){
      if(!p.directions.some((d:any)=>d.id===req.body.directionId))fail(400,'Escolha um dos estilos disponíveis.');await db().runTransaction(async tx=>{const current=(await tx.get(ref)).data();editable(current);tx.update(ref,{directionId:req.body.directionId,updatedAt:Date.now()});});
    }else if(action==='assets'){
      const assets=await resolveExpressAssets({...req.body,sourcePreviewId:id},String(id));const business={...p.business,assets,photo:assets.find(a=>a.kind==='photo')?.url||''};await db().runTransaction(async tx=>{const current=(await tx.get(ref)).data();editable(current);if(current.updatedAt!==p.updatedAt)fail(409,'O projeto mudou. Recarregue antes de salvar as imagens.');tx.update(ref,{business,updatedAt:Date.now()});tx.update(previews().doc(String(id)),{business});});
    }else if(action==='modify'){
      if(req.body.version!==p.version||!p.html)fail(409,'Recarregue o editor para usar a versão atual.');let operation=req.body.operation;
      if(operation?.type==='texts'){
        if(!Array.isArray(operation.texts)||operation.texts.length>20)fail(400,'Selecione até vinte textos para salvar.');let document={html:p.html,sections:p.sections};for(const item of operation.texts)document=modifyBuilderHtml(document.html,{type:'text',...item},publicOrigin());await saveVersion(String(id),p,document);
      }else if(operation?.type==='image'){
        if(!/^[a-z0-9_-]{1,120}$/i.test(operation.id||''))fail(400,'Imagem inválida.');const asset=[...(p.business.assets||[]),...(p.media||[])].find((a:any)=>a.id===operation.assetId);if(!asset||!builderImageUrl(asset.url,publicOrigin()))fail(400,'Escolha uma imagem da biblioteca deste projeto.');
        const {load}=await import('cheerio');const $=load(p.html);const image=$(`[data-atlas-image="${operation.id}"]`);if(!image.length)fail(400,'Imagem não encontrada na seção.');image.attr('src',asset.url).attr('alt',asset.name);await saveVersion(String(id),p,prepareBuilderHtml($.html(),publicOrigin()));
      }else await saveVersion(String(id),p,modifyBuilderHtml(p.html,operation,publicOrigin()));
    }else if(action==='restore'){
      if(!Number.isInteger(req.body.version)||req.body.version<1)fail(400,'Versão inválida.');const old=(await ref.collection('versions').doc(String(req.body.version)).get()).data();if(!old?.html)fail(404,'Versão não encontrada.');const oldLocale=parseSiteLanguage(old.locale)||DEFAULT_SITE_LANGUAGE;await saveVersion(String(id),p,prepareBuilderHtml(old.html,publicOrigin(),oldLocale),{locale:oldLocale});
    }else if(action==='prepare-proposal'){
      if(!p.proposalMode||!p.html)fail(409,'Crie o rascunho da proposta primeiro.');
      const document=prepareBuilderHtml(p.html,publicOrigin(),parseSiteLanguage(p.locale)||DEFAULT_SITE_LANGUAGE);
      await db().runTransaction(async tx=>{
        const current=(await tx.get(ref)).data();
        editable(current);
        if(current?.version!==p.version)fail(409,'O site mudou. Atualize o editor antes de preparar o envio.');
        const proposal={token:randomUUID(),version:p.version,expiresAt:Date.now()+PROPOSAL_DURATION};
        tx.create(proposals().doc(proposal.token),{html:document.html,expiresAt:proposal.expiresAt});
        tx.update(ref,{proposal});
      });
    }else if(action==='publish'){
      if(!p.html||!p.version)fail(409,'Crie o site antes de publicar.');
      const configuredOwner=(process.env.ATLAS_CONTACT_OWNER_EMAIL||'samuelfsc89@gmail.com').trim().toLowerCase();const owner=email===configuredOwner&&(await getAuthenticatedEmail(req,true))?.toLowerCase()===email;
      if(!owner){const paid=await orders().where('previewId','==',id).get();if(!paid.docs.some(d=>d.data().mode==='live'&&['paid','production','delivered'].includes(d.data().status)))return res.status(402).json({error:'Seu site está criado. Para publicar, conclua a contratação do Site Express.',requiresPayment:true});}
      const slug=p.publishedSlug||(p.business.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'site')+'-'+String(id).slice(0,8);const document=prepareBuilderHtml(p.html,publicOrigin(),parseSiteLanguage(p.locale)||DEFAULT_SITE_LANGUAGE);
      await db().runTransaction(async tx=>{const current=(await tx.get(ref)).data();editable(current);if(current.version!==p.version)fail(409,'O site mudou. Revise a versão atual antes de publicar.');tx.set(published().doc(slug),{projectId:id,html:document.html,locale:parseSiteLanguage(p.locale)||DEFAULT_SITE_LANGUAGE,version:p.version,updatedAt:Date.now()});tx.update(ref,{publishedSlug:slug,publishedVersion:p.version,publishedAt:Date.now(),updatedAt:Date.now()});});await addMessage(String(id),'assistant','Seu site foi publicado. Novos ajustes só aparecem no endereço público quando você publicar novamente.');
    }else fail(400,'Ação inválida.');
    return res.json({project:await state(String(id),(await ref.get()).data())});
  }catch(error){if(error instanceof PortfolioError)return res.status(error.status).json({error:error.message});if(error instanceof BusinessImportError)return res.status(error.status).json({error:error.message});if(error instanceof BuilderError)return res.status(error.status).json({error:error.message});if(error instanceof ExpressAssetError)return res.status(400).json({error:error.message});console.warn('[Atlas Builder]',{action:String(req.query.action||''),name:error instanceof Error?error.name:'unknown'});return res.status(503).json({error:'Não conseguimos concluir esta ação agora. Seus dados salvos foram preservados.'});}
}
