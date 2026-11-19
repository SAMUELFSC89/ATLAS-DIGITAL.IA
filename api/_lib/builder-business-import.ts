import {lookup} from 'node:dns';
import {request as httpsRequest} from 'node:https';
import {isIP} from 'node:net';
import {load} from 'cheerio';
import {normalizeSiteWhatsApp} from '../../src/lib/siteLanguages.js';
import type {ExpressBusiness} from '../../src/lib/expressOrder.js';

export class BusinessImportError extends Error{
  constructor(public status:number,message:string){super(message);}
}
export type BusinessImportResult={
  source:'website'|'google';sourceUrl:string;
  business:Pick<ExpressBusiness,'name'|'segment'|'city'|'services'|'whatsapp'|'phone'|'website'>;
  missing:string[];note:string;
};
const clip=(v:unknown,n:number)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n):'';
const isGoogleMapsHost=(host:string)=>host==='maps.app.goo.gl'||host==='goo.gl'||host==='g.page'||host==='maps.google.com'||host==='google.com'||host.endsWith('.google.com')||host==='google.com.br'||host.endsWith('.google.com.br');
function reject(code:number,message:string):never{throw new BusinessImportError(code,message);}
function publicHostname(host:string){
  const h=host.toLowerCase().replace(/\.$/,'');
  return /^[a-z0-9.-]{4,250}$/.test(h)&&h.includes('.')&&!isIP(h)&&
    !h.endsWith('.localhost')&&!h.endsWith('.internal')&&!h.endsWith('.local')&&
    !h.endsWith('.test')&&!h.endsWith('.invalid')&&!h.endsWith('.example')&&
    h!=='localhost'&&h!=='metadata.google.internal';
}
export function parseBusinessLink(raw:unknown):{url:URL;kind:'website'|'google'}{
  if(typeof raw!=='string'||raw.length>1600||!raw.trim())reject(400,'Cole um link HTTPS válido do site ou do perfil da empresa no Google.');
  let url:URL;
  try{url=new URL(raw.trim());}catch{reject(400,'Cole um endereço completo, começando com https://.');}
  if(url.protocol!=='https:'||url.username||url.password||url.port||!publicHostname(url.hostname)||url.href.length>1800)reject(400,'Use um endereço HTTPS público, sem porta personalizada ou credenciais.');
  url.hash='';
  return {url,kind:isGoogleMapsHost(url.hostname)&&(/(^|\/)(maps|place)(\/|$)/.test(url.pathname)||url.hostname==='maps.app.goo.gl'||url.hostname==='goo.gl'||url.hostname==='g.page'||url.searchParams.has('q')||url.searchParams.has('query')||url.searchParams.has('cid'))?'google':'website'};
}
function publicIpv4(ip:string){
  const parts=ip.split('.').map(Number);
  if(parts.length!==4||parts.some(p=>!Number.isInteger(p)||p<0||p>255))return false;
  const [a,b,c]=parts;
  return !(a===0||a===10||a===127||a>=224||(a===100&&b>=64&&b<=127)||
    (a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&(b===168||b===0||b===88&&c===99))||
    (a===198&&(b===18||b===19||b===51&&c===100))||(a===203&&b===0&&c===113));
}
function pinnedLookup(host:string,_options:any,callback:(error:Error|null,address?:string,family?:number)=>void){
  lookup(host,{all:true,family:4},(error,ips)=>{
    if(error||!ips?.length)return callback(new Error('Não foi possível localizar o domínio informado.'));
    if(ips.some(item=>!publicIpv4(item.address)))return callback(new Error('O endereço informado não é um site público.'));
    callback(null,ips[0].address,4);
  });
}
async function safeHttp(url:URL,maxBytes:number,allowRedirectTo:(url:URL)=>boolean,depth=0):Promise<{url:URL;html:string;redirectOnly:boolean}>{
  if(depth>4)reject(422,'O link redirecionou muitas vezes.');
  if(!publicHostname(url.hostname)||url.protocol!=='https:'||url.port||url.username||url.password)reject(400,'Link inválido ou não público.');
  return new Promise((resolve,rejectPromise)=>{
    const req=httpsRequest(url,{method:'GET',lookup:pinnedLookup,timeout:8500,headers:{'user-agent':'AtlasDigitalBusinessImporter/1.0 (+https://atlasdigital.ia.br)','accept':'text/html,application/xhtml+xml','accept-encoding':'identity'}},res=>{
      const status=res.statusCode||0;
      if(status>=300&&status<400){
        res.resume();
        let next:URL;
        try{next=new URL(res.headers.location||'',url);}catch{return rejectPromise(new BusinessImportError(422,'Redirecionamento inválido.'));}
        if(!allowRedirectTo(next))return rejectPromise(new BusinessImportError(400,'O link redireciona para um endereço não autorizado.'));
        safeHttp(next,maxBytes,allowRedirectTo,depth+1).then(resolve,rejectPromise);return;
      }
      if(status!==200){res.resume();return rejectPromise(new BusinessImportError(422,'O site não permitiu consultar as informações públicas (HTTP '+status+').'));}
      const type=String(res.headers['content-type']||'');
      if(!/text\/html|application\/xhtml\+xml/i.test(type)){res.resume();return rejectPromise(new BusinessImportError(422,'O link não aponta para uma página HTML pública.'));}
      let bytes=0;const parts:Buffer[]=[];
      res.on('data',(chunk:Buffer)=>{bytes+=chunk.length;if(bytes>maxBytes){req.destroy(new BusinessImportError(413,'A página é muito grande para leitura automática.'));return;}parts.push(chunk);});
      res.on('end',()=>resolve({url,html:Buffer.concat(parts).toString('utf8'),redirectOnly:false}));
      res.on('error',rejectPromise);
    });
    req.on('timeout',()=>req.destroy(new BusinessImportError(504,'O site demorou demais para responder.')));
    req.on('error',rejectPromise);req.end();
  });
}
function unaccent(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function titleName(raw:string){return clip(raw.split(/\s(?:\||—|–)\s/)[0]||raw,100);}
function whatsappFromText(value:string){
  const match=value.match(/(?:https?:\/\/)?(?:api\.whatsapp\.com\/send\?phone=|wa\.me\/|whatsapp\.com\/send\?phone=)(\+?\d{8,16})/i);
  return match?normalizeSiteWhatsApp('+'+match[1].replace(/\D/g,'')):'';
}
function telephone(value:unknown){return clip(value,30).replace(/[^\d+() .-]/g,'');}
function addressText(a:any):string{
  if(typeof a==='string')return clip(a,100);
  if(!a||typeof a!=='object')return '';
  return clip([a.addressLocality,a.addressRegion,a.addressCountry].filter(x=>typeof x==='string'&&x).join(', '),100);
}
function structuredNodes(input:any):any[]{
  const nodes:any[]=[];const scan=(x:any,depth=0)=>{
    if(depth>4||nodes.length>55||!x||typeof x!=='object')return;
    if(Array.isArray(x)){x.slice(0,30).forEach(y=>scan(y,depth+1));return;}
    nodes.push(x);
    if(x['@graph'])scan(x['@graph'],depth+1);
    if(x.mainEntity)scan(x.mainEntity,depth+1);
  };scan(input);return nodes;
}
function nodesFromPage(html:string):any[]{
  const $=load(html);const nodes:any[]=[];
  $('script[type="application/ld+json"]').slice(0,16).each((_,e)=>{
    try{nodes.push(...structuredNodes(JSON.parse($(e).html()||'')));}catch{}
  });return nodes;
}
export function extractWebsiteBusiness(html:string,sourceUrl:string):BusinessImportResult{
  const $=load(html);const nodes=nodesFromPage(html);
  const typeText=(node:any)=>Array.isArray(node['@type'])?node['@type'].join(' '):String(node['@type']||'');
  const organization=nodes.find(n=>/LocalBusiness|Organization|Corporation|Store|Restaurant|MedicalBusiness|ProfessionalService|AutoRepair|BeautySalon|Dentist|LegalService|SportsActivityLocation/i.test(typeText(n)))||{};
  const siteNode=nodes.find(n=>/WebSite/i.test(typeText(n)))||{};
  const first=(...args:unknown[])=>args.map(v=>clip(v,1000)).find(Boolean)||'';
  const name=titleName(first(organization.name,$('meta[property="og:site_name"]').attr('content'),siteNode.name,$('title').first().text(),$('h1').first().text()));
  const segment=first(organization.additionalType,organization.category,organization['@type']?.toString().replace(/LocalBusiness|Organization/g,''),$('meta[name="keywords"]').attr('content')?.split(',')[0],$('h1').first().text()).slice(0,80);
  const city=addressText(organization.address)||addressText(nodes.find(n=>n.address)?.address)||'';
  const originalDescription=first(organization.description,$('meta[name="description"]').attr('content'),$('meta[property="og:description"]').attr('content'));
  const sections=$('main h2,main h3,section h2,section h3').map((_,e)=>clip($(e).text(),85)).get().filter(x=>x.length>4&&!/início|sobre|contato|blog|depoimentos|home|about|contact/i.test(x)).slice(0,6);
  const services=clip([originalDescription,sections.length?'Serviços e informações apresentados: '+sections.join('; '):''].filter(Boolean).join('. '),1000);
  const anchors=$('a[href]').map((_,e)=>$(e).attr('href')||'').get().slice(0,180);
  const whatsapp=anchors.map(whatsappFromText).find(Boolean)||whatsappFromText(html.slice(0,240000))||'';
  const phone=telephone(first(organization.telephone,$('a[href^="tel:"]').first().attr('href')?.slice(4)));
  return buildResult('website',sourceUrl,{name,segment,city,services,whatsapp,phone,website:sourceUrl});
}
function googleTextFromUrl(url:URL):{query:string;placeId:string;location?:{latitude:number;longitude:number}}{
  const decoded=decodeURIComponent(url.pathname.replace(/\+/g,' '));
  const p=decoded.match(/\/maps\/place\/([^/]+)/i);
  const q=url.searchParams.get('query')||url.searchParams.get('q')||'';
  const raw=clip(q||p?.[1]||'',180).replace(/_/g,' ').replace(/%20/g,' ');
  const found=decoded.match(/!1s(ChIJ[A-Za-z0-9_-]{8,})/)||q.match(/place_id:(ChIJ[A-Za-z0-9_-]{8,})/i);
  const coordinates=decoded.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
  return {query:raw.replace(/^place_id:/i,'').trim(),placeId:found?.[1]||url.searchParams.get('query_place_id')||'',...(coordinates?{location:{latitude:Number(coordinates[1]),longitude:Number(coordinates[2])}}:{})};
}
async function expandGoogle(url:URL){
  const allowed=(next:URL)=>next.protocol==='https:'&&!next.port&&!next.username&&!next.password&&isGoogleMapsHost(next.hostname);
  // Google shortened profile links redirect to their canonical Maps URL.
  const response=await safeHttp(url,900_000,allowed);
  return response.url;
}
function buildResult(source:'website'|'google',sourceUrl:string,b:BusinessImportResult['business']):BusinessImportResult{
  const business={name:clip(b.name,100),segment:clip(b.segment,80),city:clip(b.city,100),services:clip(b.services,1000),
    whatsapp:normalizeSiteWhatsApp(b.whatsapp),phone:telephone(b.phone),website:clip(b.website,700)};
  const missing=(['name','segment','city','services'] as const).filter(k=>!business[k]);
  if(!business.whatsapp&&!business.phone)missing.push('whatsapp' as never);
  return {source,sourceUrl,business,missing,note:source==='website'
    ?'Informações extraídas da página pública. Confira os dados antes de criar seu site.'
    :'Informações públicas do Google Maps. O telefone listado não é necessariamente WhatsApp; confirme o contato.'};
}
async function importGoogle(url:URL):Promise<BusinessImportResult>{
  const apiKey=(process.env.GOOGLE_PLACES_API_KEY||process.env.GOOGLE_MAPS_API_KEY||'').trim();
  if(!apiKey)reject(503,'A conexão com o Google Places não está configurada.');
  const sourceUrl=url.href;
  if(url.hostname==='maps.app.goo.gl'||url.hostname==='goo.gl'||url.hostname==='g.page')url=await expandGoogle(url);
  const details=googleTextFromUrl(url);
  if(!details.query&&!details.placeId)reject(422,'Não consegui identificar a empresa neste link. Copie o endereço do perfil com o nome da empresa no Google Maps.');
  const mask=['places.id','places.displayName','places.formattedAddress','places.addressComponents','places.primaryTypeDisplayName','places.nationalPhoneNumber','places.internationalPhoneNumber','places.websiteUri','places.editorialSummary','places.googleMapsUri','places.businessStatus'].join(',');
  const endpoint='https://places.googleapis.com/v1/places:searchText';
  const body:any={textQuery:details.query||details.placeId,languageCode:'pt-BR',pageSize:3};
  if(details.location)body.locationBias={circle:{center:details.location,radius:5000}};
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':apiKey,'X-Goog-FieldMask':mask},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
  if(!response.ok)reject(502,'O Google Places não conseguiu consultar este perfil. Confira a conexão e tente novamente.');
  const data:any=await response.json();const places=Array.isArray(data.places)?data.places:[];
  const query=unaccent(details.query);
  const place=places.find((p:any)=>unaccent(p.displayName?.text||'')===query)||
    places.find((p:any)=>query&&((unaccent(p.displayName?.text||'').includes(query)||query.includes(unaccent(p.displayName?.text||'')||'UNKNOWN'))))||
    (details.placeId?places.find((p:any)=>p.id===details.placeId):undefined);
  if(!place)reject(422,'Não foi possível confirmar a empresa a partir deste link. Use o link do perfil com o nome da empresa ou informe o site oficial.');
  const ac=place.addressComponents||[];
  const region=(type:string)=>ac.find((v:any)=>v.types?.includes(type))?.longText||'';
  const city=clip([region('locality')||region('administrative_area_level_2')||region('postal_town'),region('administrative_area_level_1'),region('country')].filter(Boolean).join(', '),100)||place.formattedAddress||'';
  const summary=clip(place.editorialSummary?.text,700);
  const segment=clip(place.primaryTypeDisplayName?.text,80);
  const services=clip(summary||segment,1000);
  const phone=telephone(place.internationalPhoneNumber||place.nationalPhoneNumber);
  const website=typeof place.websiteUri==='string'&&place.websiteUri.startsWith('https://')?place.websiteUri.slice(0,700):'';
  return buildResult('google',sourceUrl,{name:place.displayName?.text||'',segment,city,services,whatsapp:'',phone,website});
}
export async function importBusinessFromUrl(raw:string):Promise<BusinessImportResult>{
  const {url,kind}=parseBusinessLink(raw);
  if(kind==='google')return importGoogle(url);
  const site=await safeHttp(url,900_000,next=>{try{return parseBusinessLink(next.href).kind==='website';}catch{return false;}});
  return extractWebsiteBusiness(site.html,site.url.href);
}
