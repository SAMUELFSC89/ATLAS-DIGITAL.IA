/**
 * Catálogo ISO 3166-1 alpha-2 usado na seleção de países do Radar.
 * Os nomes são localizados com Intl, sem dependência de serviços externos.
 */
const COUNTRY_CODES = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");
const LOOKUP=new Set(COUNTRY_CODES);
const PT_NAMES=new Intl.DisplayNames(['pt-BR'],{type:'region'});
const COMMON=['BR','US','CA','GB','PT','ES','FR','DE','IT','MX','AR','CL','CO','PE','UY','AU','JP','IN','AE','ZA'];
export type RadarCountry = {code:string;name:string;favorite:boolean};
export function isRadarCountryCode(code:string):boolean{return LOOKUP.has(code.toUpperCase());}
export function radarCountryName(code:string):string{return PT_NAMES.of(code.toUpperCase())||code.toUpperCase();}
export const RADAR_COUNTRIES:RadarCountry[]=COUNTRY_CODES.map(code=>({code,name:radarCountryName(code),favorite:COMMON.includes(code)}))
  .sort((a,b)=>Number(b.favorite)-Number(a.favorite) || (a.favorite ? COMMON.indexOf(a.code)-COMMON.indexOf(b.code):a.name.localeCompare(b.name,'pt-BR')));
const ENGLISH_CATEGORIES:Record<string,string>={
 'marmoraria':'stone fabrication countertops','vidraçaria':'glass and glazing services',
 'móveis planejados':'custom furniture cabinetry','energia solar':'solar energy installer',
 'clínica':'medical clinic','dentista':'dentist','advogado':'law firm','restaurante':'restaurant',
 'academia':'gym fitness center','estúdio de pilates':'pilates studio','imobiliária':'real estate agency',
 'hotel':'hotel','oficina':'car repair shop','estética automotiva':'auto detailing',
 'contador':'accounting firm','arquiteto':'architecture studio','engenharia':'engineering company',
 'construtora':'construction company','clínica veterinária':'veterinary clinic','pet shop':'pet store',
 'farmácia':'pharmacy','clínica de estética':'beauty clinic','barbearia':'barbershop',
};
export function radarCategoryQuery(category:string,countryCode:string):string {
  return countryCode==='BR'?category:(ENGLISH_CATEGORIES[category.trim().toLocaleLowerCase('pt-BR')]||category);
}
export function radarSearchLocation(city:string,region:string,countryCode:string):string {
  return [city.trim(),region.trim(),radarCountryName(countryCode)].filter(Boolean).join(', ');
}
