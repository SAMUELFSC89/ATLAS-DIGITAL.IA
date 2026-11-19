import { auth } from './firebase';
import type { BuilderProject } from './siteBuilder';
export class BuilderApiError extends Error { constructor(message:string,public status:number,public details:any={}){super(message);} }
export async function builderHeaders(){await auth.authStateReady();const user=auth.currentUser;if(!user)throw new BuilderApiError('Entre na sua conta para acessar seus sites.',401);return {'Content-Type':'application/json',Authorization:'Bearer '+await user.getIdToken()};}
export async function builderRequest<T={project:BuilderProject}>(action:string,body?:object,options:{id?:string;signal?:AbortSignal;file?:string}={}){
  const query=new URLSearchParams({view:'builder',action});if(options.id)query.set('id',options.id);if(options.file)query.set('file',options.file);
  const response=await fetch('/api/site-express?'+query,{method:body?'POST':'GET',headers:await builderHeaders(),...(body?{body:JSON.stringify(body)}:{}),signal:options.signal});
  const result=await response.json().catch(()=>null);if(!response.ok||!result)throw new BuilderApiError(result?.error||'Não foi possível concluir esta ação.',response.status,result||{});return result as T;
}
export async function referenceThumbnail(projectId:string,fileId:string,signal:AbortSignal){const query=new URLSearchParams({view:'builder',action:'reference',id:projectId,file:fileId});const response=await fetch('/api/site-express?'+query,{headers:await builderHeaders(),signal});if(!response.ok)throw new Error('Referência indisponível.');return URL.createObjectURL(await response.blob());}
