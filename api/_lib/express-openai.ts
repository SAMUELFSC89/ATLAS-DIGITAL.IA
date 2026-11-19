type BuilderInput = string | ({type:'text';text:string} | {type:'image';source:{media_type:string;data:string}})[];
type OpenAIItem = {
  type:string;
  action?:{type?:string;url?:string;sources?:{url?:string;title?:string}[]};
  content?:{type:string;text?:string;annotations?:{type:string;url?:string;title?:string}[]}[];
  result?:string;
};
type OpenAIResult = {status?:string;output?:OpenAIItem[]};

export const openaiConfigured=()=>Boolean(process.env.OPENAI_API_KEY?.trim());

export async function openaiResponse(instructions:string,input:BuilderInput,timeoutMs:number,options:Record<string,unknown>={}):Promise<OpenAIResult>{
  const key=process.env.OPENAI_API_KEY?.trim();
  if(!key)throw Object.assign(new Error('A chave da OpenAI não está configurada.'),{status:503});
  const content=typeof input==='string'?[{type:'input_text',text:input}]:input.map(part=>part.type==='text'
    ? {type:'input_text',text:part.text}
    : {type:'input_image',image_url:`data:${part.source.media_type};base64,${part.source.data}`,detail:'auto'});
  const response=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
    signal:AbortSignal.timeout(timeoutMs),
    body:JSON.stringify({
      model:process.env.ATLAS_OPENAI_MODEL?.trim()||'gpt-6.2-sol',store:false,reasoning:{effort:'low'},
      instructions,input:[{role:'user',content}],...options,
    }),
  });
  if(!response.ok){
    const payload=await response.json().catch(()=>null);
    const code=typeof payload?.error?.code==='string'&&/^[a-z0-9_]{1,64}$/i.test(payload.error.code)?payload.error.code:'';
    throw Object.assign(new Error('A OpenAI recusou a solicitação.'),{status:response.status,code});
  }
  const result:OpenAIResult=await response.json();
  if(result.status!=='completed')throw new Error('A resposta da OpenAI ficou incompleta.');
  return result;
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
