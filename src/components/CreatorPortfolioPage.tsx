import { useEffect, useState, type FormEvent } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ArrowLeft, ArrowUpRight, CheckCircle2, Eye, EyeOff, Globe2, LoaderCircle, Save, ShieldCheck, Sparkles, UserRound, ExternalLink } from 'lucide-react';
import { auth } from '../lib/firebase';
import { builderRequest } from '../lib/builderApi';
import type { CreatorProfile, OwnerPortfolioResponse } from '../lib/siteBuilder';
import AtlasLogo from './AtlasLogo';
import AuthPage from './AuthPage';
import './CreatorPortfolio.css';

const blank = {handle:'',name:'',headline:'',bio:'',city:'',specialties:'',whatsapp:'',contactPublic:false,publicEnabled:false};
type Draft=typeof blank;
const fromProfile=(p:CreatorProfile|null):Draft=>p?{
 handle:p.handle,name:p.name,headline:p.headline||'',bio:p.bio||'',city:p.city||'',specialties:p.specialties||'',
 whatsapp:p.whatsapp||'',contactPublic:p.contactPublic===true,publicEnabled:p.publicEnabled===true
}:blank;
export default function CreatorPortfolioPage(){
 const [user,setUser]=useState<User|null|undefined>();
 const [data,setData]=useState<OwnerPortfolioResponse|null>(null);
 const [draft,setDraft]=useState<Draft>(blank);
 const [busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>onAuthStateChanged(auth,u=>setUser(u&&!u.isAnonymous?u:null)),[]);
 useEffect(()=>{
   if(!user)return;
   let active=true;setBusy('loading');
   builderRequest<OwnerPortfolioResponse>('owner-portfolio').then(result=>{if(active){setData(result);setDraft(fromProfile(result.profile));}})
     .catch(e=>{if(active)setError((e as Error).message);})
     .finally(()=>{if(active)setBusy('');});
   return ()=>{active=false;};
 },[user?.uid]);
 async function save(e:FormEvent){
   e.preventDefault();if(busy)return;setBusy('save');setError('');setNotice('');
   try{
     const result=await builderRequest<OwnerPortfolioResponse>('creator-profile',draft);
     setData(result);setDraft(fromProfile(result.profile));
     setNotice('Perfil salvo. Você controla quais informações ficam públicas.');
   }catch(e){setError((e as Error).message);}finally{setBusy('');}
 }
 async function toggle(id:string,visible:boolean){
   if(busy)return;setBusy(id);setError('');setNotice('');
   try{
     await builderRequest('portfolio-toggle',{id,visible});
     setData(prev=>prev?{...prev,projects:prev.projects.map(p=>p.id===id?{...p,portfolioVisible:visible}:p)}:prev);
     setNotice(visible?'Projeto adicionado ao seu portfólio.':'Projeto retirado do seu portfólio.');
   }catch(e){setError((e as Error).message);}finally{setBusy('');}
 }
 const profile=data?.profile;
 const visibleSites=data?.projects.filter(p=>p.portfolioVisible&&p.publishedUrl).length||0;
 if(user===undefined || busy==='loading')return <main className="creator-portal creator-loading"><LoaderCircle className="creator-spin"/> Carregando portfólio…</main>;
 if(!user)return <main className="creator-portal"><nav className="creator-topbar"><a href="/"><AtlasLogo/></a><a href="/criar-site">Voltar ao editor</a></nav><div className="creator-auth"><h1>Seu portfólio profissional começa aqui.</h1><p>Entre na Atlas para escolher quais sites deseja apresentar ao público.</p><AuthPage context="site"/></div></main>;
 return <main className="creator-portal">
   <nav className="creator-topbar"><a href="/" className="creator-brand"><AtlasLogo/></a><div><a href="/criar-site"><ArrowLeft size={16}/> Criar sites</a><a href="/criadores"><Globe2 size={16}/> Explorar criadores</a></div></nav>
   <div className="creator-shell">
    <header className="creator-hero"><div className="creator-eyebrow"><Sparkles size={15}/> ATLAS · PERFIL PROFISSIONAL</div><h1>Seus sites contam sua história.</h1><p>Reúna seus trabalhos em um portfólio público, compartilhe seu perfil e permita que novos clientes conheçam o que você cria.</p><div className="creator-summary"><span><strong>{data?.projects.length||0}</strong> sites na sua conta</span><span><strong>{visibleSites}</strong> no portfólio</span></div></header>
    {(error||notice)&&<div role={error?'alert':'status'} className={'creator-alert '+(error?'error':'')}>{error||notice}</div>}
    <div className="creator-layout">
      <section className="creator-surface">
       <div className="creator-heading"><div><span className="creator-eyebrow">01 · SEU PERFIL</span><h2>Apresentação profissional</h2></div><UserRound size={22}/></div>
       <form onSubmit={save} className="creator-form">
        <div className="creator-fieldrow">
          <label>Nome público ou marca profissional<input required minLength={3} maxLength={80} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Ex.: Studio Ana Costa"/></label>
          <label>Endereço do perfil<input required minLength={3} maxLength={32} pattern="[a-z][a-z0-9-]{2,31}" disabled={Boolean(profile)} value={draft.handle} onChange={e=>setDraft({...draft,handle:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')})} placeholder="ex.: ana-costa"/></label>
        </div>
        {profile&&<small className="creator-hint">Seu endereço público é fixo para preservar os links compartilhados.</small>}
        <label>Profissão ou título<input maxLength={110} value={draft.headline} onChange={e=>setDraft({...draft,headline:e.target.value})} placeholder="Web designer · Sites que convertem"/></label>
        <label>Sobre seu trabalho<textarea rows={4} maxLength={500} value={draft.bio} onChange={e=>setDraft({...draft,bio:e.target.value})} placeholder="Explique sua especialidade, seu estilo e o que oferece aos clientes."/></label>
        <div className="creator-fieldrow"><label>Cidade<input maxLength={80} value={draft.city} onChange={e=>setDraft({...draft,city:e.target.value})} placeholder="Porto Alegre, RS"/></label><label>Especialidades<input maxLength={160} value={draft.specialties} onChange={e=>setDraft({...draft,specialties:e.target.value})} placeholder="Landing pages, sites institucionais"/></label></div>
        <div className="creator-privacy"><label className="creator-check"><input type="checkbox" checked={draft.publicEnabled} onChange={e=>setDraft({...draft,publicEnabled:e.target.checked})}/><span><strong>Deixar meu perfil visível ao público</strong><small>Quando desligado, seu perfil e seus trabalhos não aparecem para visitantes.</small></span></label></div>
        <label>WhatsApp profissional (opcional)<input type="tel" maxLength={32} value={draft.whatsapp} onChange={e=>setDraft({...draft,whatsapp:e.target.value})} placeholder="(51) 99999-9999"/></label>
        <label className="creator-check"><input type="checkbox" checked={draft.contactPublic} onChange={e=>setDraft({...draft,contactPublic:e.target.checked})}/><span><strong>Permitir que visitantes me contratem pelo WhatsApp</strong><small>Seu número só será disponibilizado no perfil público quando essa opção estiver marcada.</small></span></label>
        <button className="creator-primary" type="submit" disabled={Boolean(busy)}>{busy==='save'?<LoaderCircle className="creator-spin" size={17}/>:<Save size={17}/>} Salvar meu perfil</button>
       </form>
       {profile&&<div className="creator-share"><span><strong>Seu link público</strong><small>{profile.publicEnabled?'Perfil visível para visitantes':'Perfil privado até você ativar a visibilidade'}</small></span><a href={profile.url} target="_blank" rel="noreferrer">{profile.url}<ArrowUpRight size={16}/></a></div>}
      </section>
      <aside className="creator-guidance"><ShieldCheck size={25}/><h3>Você controla o que compartilha.</h3><p>Cada site tem sua própria visibilidade. Publicar um site não o coloca automaticamente no seu portfólio.</p><p>Você também pode retirar um trabalho do portfólio a qualquer momento, sem alterar o site já publicado.</p><a href="/criadores">Conhecer outros profissionais <ArrowUpRight size={15}/></a></aside>
    </div>
    <section className="creator-projects">
     <div className="creator-heading"><div><span className="creator-eyebrow">02 · SEUS TRABALHOS</span><h2>Escolha o que mostrar</h2></div><a href="/criar-site"><Sparkles size={15}/> Criar outro site</a></div>
     {data?.projects.length?<div className="creator-project-grid">{data.projects.map(site=><article className="creator-project" key={site.id}>
       <div className="creator-project-art"><Globe2 size={28}/><span>{site.segment||'Site institucional'}</span></div>
       <div className="creator-project-info"><h3>{site.name}</h3><p>{site.publishedUrl?'Site publicado e acessível':'Este projeto ainda não foi publicado.'}</p><div className="creator-project-links"><a href={'/criar-site?projeto='+site.id}>Editar</a>{site.publishedUrl&&<a href={site.publishedUrl} target="_blank" rel="noreferrer">Ver site <ExternalLink size={13}/></a>}</div>
         <label className="creator-project-toggle"><input type="checkbox" checked={Boolean(site.portfolioVisible)} disabled={Boolean(busy)||!site.publishedUrl||!profile} onChange={e=>void toggle(site.id,e.target.checked)}/><span>{site.portfolioVisible?<Eye size={15}/>:<EyeOff size={15}/>} {site.portfolioVisible?'Visível no portfólio':'Não exibir no portfólio'}</span></label>
       </div>
      </article>)}</div>:<div className="creator-empty"><CheckCircle2 size={24}/><h3>Seu portfólio começa com o primeiro site.</h3><p>Crie, publique e selecione os trabalhos que quer apresentar.</p><a className="creator-primary" href="/criar-site">Criar meu primeiro site</a></div>}
    </section>
   </div>
 </main>;
}
