import {useState} from 'react';
import {Globe2,Link2,LoaderCircle,Search} from 'lucide-react';
import {builderRequest} from '../lib/builderApi';
import type {ExpressBusiness} from '../lib/expressOrder';

export interface BusinessImportPreview {
  source:'website'|'google';sourceUrl:string;
  business:Pick<ExpressBusiness,'name'|'segment'|'city'|'services'|'whatsapp'|'phone'|'website'|'address'|'contactEmail'|'hours'|'businessResearch'>;
  missing:string[];note:string;
}
export default function BuilderBusinessImport({onImport,onBusy,disabled}:{onImport:(data:BusinessImportPreview)=>void;onBusy:(value:boolean)=>void;disabled:boolean}){
  const [link,setLink]=useState('');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  async function search(){
    if(!link.trim()||loading||disabled)return;
    setLoading(true);onBusy(true);setError('');
    try{
      const data=await builderRequest<BusinessImportPreview>('import-business',{url:link.trim()});
      onImport(data);
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível ler esse endereço.');}
    finally{setLoading(false);onBusy(false);}
  }
  return <section className="builder-business-import" aria-labelledby="builder-import-title">
    <span className="builder-eyebrow">OPÇÃO MAIS RÁPIDA</span>
    <h3 id="builder-import-title"><Link2 size={18}/> Importar sua empresa por link</h3>
    <p>Cole o endereço do seu site ou do Perfil da Empresa no Google Maps. Com um link do Google, a OpenAI pesquisa a empresa, confere os dados em fontes públicas e procura fotos e avaliações para orientar o site.</p>
    <label htmlFor="builder-business-url">Link do site ou perfil do Google</label>
    <div className="builder-business-url-row">
      <input id="builder-business-url" type="url" value={link} onChange={event=>{setLink(event.target.value);setError('');}} placeholder="https://www.suaempresa.com ou https://maps.app.goo.gl/..." maxLength={1600} autoComplete="url" disabled={disabled||loading}/>
      <button className="builder-button" type="button" disabled={disabled||loading||!link.trim()} onClick={()=>void search()}>{loading?<><LoaderCircle size={16} className="animate-spin"/>Pesquisando…</>:<><Search size={16}/>Buscar dados</>}</button>
    </div>
    {error&&<p role="alert" className="builder-import-error">{error} Você também pode preencher os dados manualmente.</p>}
    <p className="builder-import-info"><Globe2 size={14}/> Somente informações públicas. Nenhuma conta Google precisa ser conectada.</p>
  </section>;
}
