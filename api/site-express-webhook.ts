import type { Request, Response } from 'express';

export default async function handler(req:Request,res:Response){
  try{
    const {default:webhook}=await import('./_lib/site-express-webhook.js');
    return await webhook(req,res);
  }catch(error){
    console.error('[Site Express Webhook Bootstrap]',{
      name:error instanceof Error?error.name:'unknown',
      code:typeof (error as any)?.code==='string'?String((error as any).code).slice(0,32):'',
    });
    if(res.headersSent)return;
    return res.status(503).end();
  }
}
