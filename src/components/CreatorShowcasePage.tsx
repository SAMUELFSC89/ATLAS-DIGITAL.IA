import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BriefcaseBusiness, ExternalLink, Globe2, MapPin, MessageCircle, Search, Sparkles } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { CreatorProfile, PortfolioSiteSummary, PublicCreatorResponse } from '../lib/siteBuilder';
import AtlasLogo from './AtlasLogo';
import './CreatorPortfolio.css';

type DirectoryResponse={creators:CreatorProfile[]};
const handle=decodeURIComponent(window.location.pathname.replace(/\/$/,'').split('/')[2]||'');
export default function CreatorShowcasePage(){
 const [profile,setProfile]=useState<PublicCreatorResponse|null>(null);
 const [directory,setDirectory]=useState<CreatorProfile[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [filter,setFilter]=useState('');
 useEffect(()=>{
  const controller=new AbortController();
  const url='/api/site-express?view=builder&action='+(handle?'creator-public&handle='+encodeURIComponent(handle):'creator-directory');
  fetch(url,{signal:controller.signal}).then(async response=>{
   const data=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(data?.error||'Não foi possível encontrar este perfil.');
   if(handle){setProfile(data as PublicCreatorResponse);document.title=(data.creator.name||'Criador')+' · Portfólio Atlas Digital';}
   else{setDirectory((data as DirectoryResponse).creators);document.title='Criadores de Sites · Atlas Digital';}
  }).catch(e=>{if(!controller.signal.aborted)setError((e as Error).message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[]);
 const shown=directory.filter(p=>[p.name,p.headline,p.city,p.specialties].join(' ').toLowerCase().includes(filter.toLowerCase()));
 return <main className="creator-portal">
  <nav className="creator-topbar"><a className="creator-brand" href="/"><AtlasLogo/></a><div><a href="/criadores"><Globe2 size={16}/> Criadores</a><a href="/meu-portfolio"><BriefcaseBusiness size={16}/> Meu portfólio</a></div></nav>
  <div className="creator-shell">
   {loading?<div className="creator-loading"><Sparkles/> Carregando perfis…</div>:
   error?<div className="creator-empty"><Globe2 size={27}/><h1>Não encontramos esse perfil.</h1><p>{error}</p><a className="creator-primary" href="/criadores"><ArrowLeft size={17}/> Explorar criadores</a></div>:
   profile?<><header className="creator-public-hero">
    <span className="creator-eyebrow"><Sparkles size={15}/> CRIADOR NA ATLAS</span>
    <h1>{profile.creator.name}</h1>
    <p>{profile.creator.headline||'Criação de sites com identidade e propósito.'}</p>
    <div className="creator-summary">{profile.creator.city&&<span><MapPin size={16}/>{profile.creator.city}</span>}{profile.creator.specialties&&<span><BriefcaseBusiness size={16}/>{profile.creator.specialties}</span>}<span><strong>{profile.sites.length}</strong> projetos compartilhados</span></div>
    <div className="creator-public-cta">{profile.creator.contactUrl&&<a className="creator-primary" href={profile.creator.contactUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={17}/> Contratar este profissional <ArrowUpRight size={17}/></a>}<a className="creator-secondary" href="/criadores"><ArrowLeft size={16}/> Outros criadores</a></div>
   </header>
   {profile.creator.bio&&<section className="creator-public-bio"><h2>Sobre este profissional</h2><p>{profile.creator.bio}</p></section>}
   <section className="creator-projects" aria-label="Sites do portfólio"><div className="creator-heading"><div><span className="creator-eyebrow">PROJETOS SELECIONADOS</span><h2>Sites publicados</h2></div></div>
    {profile.sites.length?<div className="creator-public-grid">{profile.sites.map((site:PortfolioSiteSummary)=><article className="creator-public-card" key={site.id}>
      <div className="creator-public-card-art" style={{'--preview-accent':site.accent||'#b6a172'} as CSSProperties}><span>{site.segment||'Projeto digital'}</span><strong>{site.name}</strong></div>
      <div className="creator-public-card-content"><h3>{site.name}</h3><p>{site.description||'Conheça este projeto publicado na Atlas.'}</p><a href={site.url} target="_blank" rel="noopener noreferrer">Visitar site <ExternalLink size={15}/></a></div>
     </article>)}</div>:<div className="creator-empty"><Globe2 size={25}/><h3>Nenhum trabalho compartilhado ainda.</h3><p>Este criador ainda não adicionou sites públicos ao portfólio.</p></div>}
   </section>
   </>:
   <><header className="creator-public-hero"><span className="creator-eyebrow"><Sparkles size={15}/> COMUNIDADE ATLAS</span><h1>Profissionais que transformam ideias em sites.</h1><p>Conheça os criadores da comunidade, explore seus perfis profissionais e encontre alguém para seu próximo projeto.</p><div className="creator-public-cta"><a className="creator-primary" href="/meu-portfolio"><BriefcaseBusiness size={17}/> Criar meu portfólio <ArrowRight size={16}/></a></div></header>
   <section className="creator-projects" aria-label="Diretório de criadores"><div className="creator-heading"><div><span className="creator-eyebrow">PROFISSIONAIS</span><h2>Explore a comunidade</h2></div></div><label htmlFor="creator-search" className="creator-eyebrow"><Search size={15}/> Buscar por nome, especialidade ou cidade</label><input className="creator-search" id="creator-search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Ex.: sites para arquitetos"/>
    {shown.length?<div className="creator-directory-grid">{shown.map(p=><article className="creator-dir-card" key={p.handle}><div className="creator-avatar">{p.name.charAt(0).toUpperCase()}</div><h2>{p.name}</h2><p>{p.headline||p.specialties||'Criador de sites'}</p>{p.city&&<p><MapPin size={12}/> {p.city}</p>}<a href={'/criadores/'+p.handle}>Ver portfólio <ArrowUpRight size={15}/></a></article>)}</div>:<div className="creator-empty"><Search size={24}/><h3>Nenhum profissional encontrado.</h3><p>{filter?'Experimente outra busca.':'Os perfis aparecerão aqui quando seus criadores optarem pela publicação.'}</p></div>}
   </section></>}
   <footer className="creator-footer">Atlas Digital · Perfis e projetos compartilhados voluntariamente pelos criadores. <a href="/">Voltar para a Atlas</a></footer>
  </div>
 </main>;
}
