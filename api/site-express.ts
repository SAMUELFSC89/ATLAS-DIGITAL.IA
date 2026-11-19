import type { Request, Response } from 'express';

/**
 * Separate the site builder from the older checkout, browser rendering and
 * payment dependencies. Vercel must be able to boot public creator profiles
 * even if an unrelated optional integration is unavailable.
 */
export const config = { maxDuration: 300 };

export default async function handler(req:Request,res:Response) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  const view=String(req.query?.view||'');
  if(req.method==='GET' && view==='health')return res.status(200).json({ok:true,service:'atlas-site-express',version:2});
  try {
    if(view==='builder'){
      const {default:builder}=await import('./_lib/express-builder.js');
      return await builder(req,res);
    }
    const {default:siteExpress}=await import('./_lib/site-express.js');
    return await siteExpress(req,res);
  } catch(error){
    console.error('[Site Express Bootstrap]',{
      view:view==='builder'?'builder':'standard',
      name:error instanceof Error?error.name:'unknown',
      code:typeof (error as any)?.code==='string'?String((error as any).code).slice(0,32):'',
      message:error instanceof Error?error.message.slice(0,240):'unknown',
    });
    if(res.headersSent)return;
    return res.status(503).json({code:'service_unavailable',error:'O serviço de criação de sites está temporariamente indisponível. Tente novamente.'});
  }
}
