import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RADAR_COUNTRIES, isRadarCountryCode, radarCategoryQuery, radarSearchLocation } from '../src/lib/radarGeography.ts';
import { searchRadar, localRankingQuery, firstWhatsApp, RadarError } from '../api/radar.ts';
import { parseRecurringRadarFilters } from '../src/lib/radarRecurring.ts';

test('country catalog covers all ISO territories and keeps Portuguese search for Brazil',()=>{
 assert.equal(RADAR_COUNTRIES.length,249);
 assert.equal(new Set(RADAR_COUNTRIES.map(c=>c.code)).size,249);
 assert.equal(isRadarCountryCode('BR'),true);
 assert.equal(isRadarCountryCode('CA'),true);
 assert.equal(isRadarCountryCode('GB'),true);
 assert.equal(isRadarCountryCode('ZZ'),false);
 assert.equal(radarCategoryQuery('Dentista','CA'),'dentist');
 assert.equal(radarCategoryQuery('Dentista','BR'),'Dentista');
 assert.match(radarSearchLocation('Toronto','Ontario','CA'),/Toronto, Ontario, Canadá/);
});
test('locale-aware radius and international WhatsApp link parsing',()=>{
 const body=localRankingQuery('dentist in Toronto',{latitude:43.65,longitude:-79.38},70,'CA');
 assert.equal(body.regionCode,'CA');
 assert.equal(body.languageCode,'en');
 assert.equal(body.locationBias.circle.radius,50000);
 assert.equal(firstWhatsApp('Fale via https://wa.me/14165550123'), '14165550123');
 assert.equal(firstWhatsApp('Fale via https://wa.me/5511999999999'), '5511999999999');
 assert.equal(firstWhatsApp('invalido https://wa.me/1234'), '');
});
test('global Google Places search targets selected country and never assumes foreign WhatsApp',async()=>{
 const oldFetch=globalThis.fetch,oldKey=process.env.GOOGLE_PLACES_API_KEY;
 process.env.GOOGLE_PLACES_API_KEY='fake-places-key';
 const seen:any[]=[];
 globalThis.fetch=async (_url,init)=> {
  const body=JSON.parse(String(init?.body));seen.push(body);
  if(seen.length===1)return new Response(JSON.stringify({places:[{location:{latitude:43.65,longitude:-79.38},addressComponents:[{types:['country'],shortText:'CA'}]}]}),{status:200,headers:{'content-type':'application/json'}});
  return new Response(JSON.stringify({places:[
   {id:'near',displayName:{text:'Toronto Dental'},formattedAddress:'Toronto ON Canada',
    location:{latitude:43.651,longitude:-79.381},
    internationalPhoneNumber:'+1 416-555-0123',rating:4.5,userRatingCount:50,businessStatus:'OPERATIONAL'},
   {id:'far',displayName:{text:'Remote Dental'},location:{latitude:45.4,longitude:-75.7},
    internationalPhoneNumber:'+1 613-555-1111',businessStatus:'OPERATIONAL'}
  ]}),{status:200,headers:{'content-type':'application/json'}});
 };
 try{
  const result=await searchRadar({segment:'Dentista',city:'Toronto',state:'Ontario',countryCode:'CA',radiusKm:25,quantity:5});
  assert.equal(result.leads.length,1);
  assert.equal(result.leads[0].countryCode,'CA');
  assert.equal(result.leads[0].state,'Ontario');
  assert.equal(result.leads[0].phone,'+1 416-555-0123');
  assert.equal(result.leads[0].whatsapp,'');
  assert.equal(result.leads[0].whatsappLink,'');
  assert.equal(seen[0].regionCode,'CA');
  assert.equal(seen[1].regionCode,'CA');
  assert.equal(seen[1].languageCode,'en');
  assert.match(seen[1].textQuery,/dentist/);
  assert.match(seen[1].textQuery,/Toronto, Ontario, Canadá/);
  assert.equal(seen[1].locationBias.circle.radius,25000);
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.GOOGLE_PLACES_API_KEY;else process.env.GOOGLE_PLACES_API_KEY=oldKey;}
});
test('unknown country rejected before Google API calls',async()=>{
 await assert.rejects(searchRadar({segment:'Restaurante',city:'X',countryCode:'ZZ'}),e=>e instanceof RadarError && e.code==='bad_request');
});
test('recurring searches preserve foreign regions and old Brazilian saved settings',()=>{
 const base={segment:'Hotel',city:'Lisboa',state:'Lisboa',countryCode:'PT',radiusKm:30,quantity:10,siteFilter:'all',minRating:null,minReviews:null,keyword:''};
 assert.equal(parseRecurringRadarFilters(base)?.countryCode,'PT');
 assert.equal(parseRecurringRadarFilters({...base,countryCode:undefined,state:'SP'})?.countryCode,'BR');
 assert.equal(parseRecurringRadarFilters({...base,state:'Île-de-France',countryCode:'FR'})?.state,'Île-de-France');
 assert.equal(parseRecurringRadarFilters({...base,countryCode:'USA'}),null);
});
