import { useEffect, useState } from 'react';
import { referenceThumbnail } from '../lib/builderApi';
import type { BuilderDesignOption } from '../lib/siteBuilder';

function DesignCard({projectId,option,disabled,onChoose}:{key?:string;projectId:string;option:BuilderDesignOption;disabled:boolean;onChoose:()=>void}){
  const [url,setUrl]=useState('');
  const [failed,setFailed]=useState(false);
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    let objectUrl='';
    setUrl('');
    setFailed(false);
    referenceThumbnail(projectId,option.id,controller.signal,'design').then(data=>{
      if(controller.signal.aborted){URL.revokeObjectURL(data);return;}
      objectUrl=data;
      setUrl(data);
    }).catch(()=>{if(!controller.signal.aborted)setFailed(true);});
    return ()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[projectId,option.id,attempt]);

  const storyboard=option.format==='scroll-storyboard';
  return <article className={storyboard?'builder-design-option builder-design-storyboard':'builder-design-option'}>
    {url?<a href={url} target="_blank" rel="noreferrer" aria-label={`Ampliar proposta ${option.direction.name}`}>
      <img src={url} alt={storyboard?`${option.direction.name} — abertura, transição e próxima cena`:`Proposta de página: ${option.direction.name}`}/>
    </a>:<div className="builder-design-placeholder" role="status">{failed
      ? <button type="button" className="builder-button secondary" onClick={()=>setAttempt(n=>n+1)}>Recarregar imagem</button>
      : 'Carregando proposta…'}</div>}
    <div className="builder-design-info">
      <h3>{option.direction.name}</h3>
      <p>{option.direction.description}</p>
      <button type="button" className="builder-button full" disabled={disabled||!url} onClick={onChoose}>Usar esta proposta</button>
    </div>
  </article>;
}

export default function BuilderDesignChoices({projectId,options,disabled,onSelect,onDismiss}:{projectId:string;options:BuilderDesignOption[];disabled:boolean;onSelect:(optionId:string)=>void;onDismiss:()=>void}){
  return <section className="builder-style-setup builder-design-choice" aria-label="Propostas visuais">
    <h1>Escolha seu site</h1>
    <p>{options.some(option=>option.format==='scroll-storyboard')
      ? 'Cada proposta mostra a abertura, a transição da rolagem e a próxima cena. Abra as imagens para comparar.'
      : 'Abra as imagens para comparar. A Atlas transforma a proposta escolhida em um site editável.'}</p>
    <div className="builder-design-grid">{options.map(option=>
      <DesignCard key={option.id} projectId={projectId} option={option} disabled={disabled} onChoose={()=>onSelect(option.id)}/>
    )}</div>
    <button type="button" className="builder-button secondary" disabled={disabled} onClick={onDismiss}>Voltar ao briefing</button>
  </section>;
}
