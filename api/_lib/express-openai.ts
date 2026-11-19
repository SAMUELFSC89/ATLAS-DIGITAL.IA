type BuilderInput = string | ({type:'text';text:string} | {type:'image';source:{media_type:string;data:string}})[];
type OpenAIItem = {
  type:string;
  action?:{type?:string;url?:string;sources?:{url?:string;title?:string}[]};
  content?:{type:string;text?:string;annotations?:{type:string;url?:string;title?:string}[]}[];
  result?:string;
};
type OpenAIResult = {status?:string;output?:OpenAIItem[]};

class OpenAIRequestError extends Error {
  constructor(readonly status:number,readonly code:string,readonly reason:string){super('A OpenAI recusou a solicitação.');}
}

export const openaiConfigured=()=>Boolean(process.env.OPENAI_API_KEY?.trim());

export async function openaiResponse(instructions:string,input:BuilderInput,timeoutMs:number,options:Record<string,unknown>={}):Promise<OpenAIResult>{
  const key=process.env.OPENAI_API_KEY?.trim();
  if(!key)throw Object.assign(new Error('A chave da OpenAI não está configurada.'),{status:503});
  const content=typeof input==='string'?[{type:'input_text',text:input}]:input.map(part=>part.type==='text'
    ? {type:'input_text',text:part.text}
    : {type:'input_image',image_url:`data:${part.source.media_type};base64,${part.source.data}`,detail:'auto'});
  const request=async(model:string)=>{
    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
      signal,
      body:JSON.stringify({model,store:false,reasoning:{effort:'low'},instructions,input:[{role:'user',content}],...options}),
    });
    if(response.ok)return response;
    const payload=await response.json().catch(()=>null);
    const error=payload?.error;
    const code=typeof error?.code==='string'&&/^[a-z0-9_]{1,64}$/i.test(error.code)?error.code:'';
    const message=typeof error?.message==='string'?error.message:'';
    const reason=/organization.{0,100}verif|verif.{0,100}organization/i.test(message)?'verification'
      :/missing scopes|insufficient permissions|permission to perform/i.test(message)?'permissions'
      :code==='model_not_found'||(error?.param==='model'&&response.status===400)?'model':'';
    throw new OpenAIRequestError(response.status,code,reason);
  };
  const signal=AbortSignal.timeout(timeoutMs);
  const configuredModel=process.env.ATLAS_OPENAI_MODEL?.trim();
  let response:Response;
  try{response=await request(configuredModel||'gpt-6.2-sol');}
  catch(error){
    if(configuredModel||!(error instanceof OpenAIRequestError)||error.reason!=='model')throw error;
    response=await request('gpt-5.4-mini');
  }

  const result:OpenAIResult=await response.json();
  if(result.status!=='completed'&&!result.output?.some(item=>item.type==='image_generation_call'&&item.result))throw new Error('A resposta da OpenAI ficou incompleta.');
  return result;
}

export function openaiAccessMessage(error:unknown){
  if(!(error instanceof OpenAIRequestError))return '';
  if(error.reason==='verification')return 'A OpenAI exige verificação da organização para gerar as propostas em imagem.';
  if(error.reason==='permissions'||(error.status===403&&error.reason!=='model'))return 'A OpenAI recusou a permissão da chave. Confira o acesso a solicitações de modelo no projeto Atlas Digital.';
  if(error.status===401)return 'A OpenAI não aceitou a chave configurada na Vercel. Confira a variável OPENAI_API_KEY.';
  if(error.reason==='model')return 'O projeto Atlas Digital ainda não tem acesso ao modelo solicitado da OpenAI.';
  if(error.code==='insufficient_quota'||error.code==='billing_hard_limit_reached')return 'O projeto atingiu o limite de cobrança da API da OpenAI.';
  if(error.status===429)return 'A OpenAI está limitando as solicitações neste momento. Tente novamente em instantes.';
  return '';
}

export function openaiOutputText(result:OpenAIResult){
  return (result.output||[]).flatMap(item=>item.type==='message'?item.content||[]:[])
    .filter(part=>part.type==='output_text').map(part=>part.text||'').join('\n').trim();
}

export async function openaiText(instructions:string,input:BuilderInput,timeoutMs:number,maxTokens=32000){
  const text=openaiOutputText(await openaiResponse(instructions,input,timeoutMs,{max_output_tokens:maxTokens}));
  if(!text)throw new Error('A OpenAI não retornou texto.');
  return text;
}

export async function openaiImage(instructions:string,input:BuilderInput,size:'1536x1024'|'1024x1536'){
  const result=await openaiResponse(instructions,input,120000,{
    tools:[{type:'image_generation',model:process.env.ATLAS_OPENAI_IMAGE_MODEL?.trim()||'gpt-image-2',size,quality:'medium',output_format:'webp'}],
    tool_choice:{type:'image_generation'},max_tool_calls:1,max_output_tokens:2400,
  });
  const data=result.output?.find(item=>item.type==='image_generation_call'&&item.result)?.result;
  if(!data||data.length>20*1024*1024)throw new Error('A OpenAI não retornou uma imagem utilizável.');
  return data;
}
