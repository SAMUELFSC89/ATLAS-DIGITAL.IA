import { normalizeBrazilianWhatsApp } from './contact.js';
/**
 * Idioma da página publicada, independente da localização da empresa ou do painel Atlas.
 * Uma página publicada contém um idioma por versão. Multilinguismo paralelo será um recurso futuro.
 */
export const SITE_LANGUAGES = [
  {code:'pt-BR',name:'Português (Brasil)',native:'Português (Brasil)',direction:'ltr'},
  {code:'pt-PT',name:'Português (Portugal)',native:'Português (Portugal)',direction:'ltr'},
  {code:'en-US',name:'Inglês (Estados Unidos)',native:'English (US)',direction:'ltr'},
  {code:'en-GB',name:'Inglês (Reino Unido)',native:'English (UK)',direction:'ltr'},
  {code:'es',name:'Espanhol',native:'Español',direction:'ltr'},
  {code:'fr',name:'Francês',native:'Français',direction:'ltr'},
  {code:'de',name:'Alemão',native:'Deutsch',direction:'ltr'},
  {code:'it',name:'Italiano',native:'Italiano',direction:'ltr'},
  {code:'nl',name:'Holandês',native:'Nederlands',direction:'ltr'},
  {code:'ja',name:'Japonês',native:'日本語',direction:'ltr'},
  {code:'ko',name:'Coreano',native:'한국어',direction:'ltr'},
  {code:'zh-CN',name:'Chinês (simplificado)',native:'简体中文',direction:'ltr'},
  {code:'ar',name:'Árabe',native:'العربية',direction:'rtl'},
  {code:'hi',name:'Hindi',native:'हिन्दी',direction:'ltr'},
] as const;
export type SiteLanguage = typeof SITE_LANGUAGES[number]['code'];
export const DEFAULT_SITE_LANGUAGE:SiteLanguage='pt-BR';
export function parseSiteLanguage(value:unknown): SiteLanguage|null {
  return typeof value==='string' && SITE_LANGUAGES.some(language=>language.code===value)?value as SiteLanguage:null;
}
export function siteLanguage(code:unknown){
  return SITE_LANGUAGES.find(language=>language.code===code)||SITE_LANGUAGES[0];
}
export function languagePrompt(locale:SiteLanguage){
  const selected=siteLanguage(locale);
  return [
    'IDIOMA OBRIGATÓRIO DO SITE FINAL: '+selected.native+' (BCP 47: '+selected.code+').',
    'Todos os textos visíveis para visitantes devem estar integralmente neste idioma: títulos, parágrafos, navegação, botões, rodapé, textos de ajuda, chamadas, alt das imagens, title e meta description.',
    'Não traduza nomes próprios, marcas, domínio, URLs, endereços reais ou números de WhatsApp. Evite misturar idiomas e adapte o tom culturalmente ao mercado-alvo.',
    'Defina <html lang="'+selected.code+'" dir="'+selected.direction+'">. Para árabe, componha a página com leitura RTL.',
    'Ao traduzir uma versão existente, conserve a estrutura, links, imagens, classes, ids e o design. Traduza TODO o texto necessário, não somente o hero.',
    'Não invente fatos comerciais durante a tradução. O idioma do site independe do idioma utilizado no chat ou no painel Atlas.',
  ].join('\n');
}

/** Permite contato internacional E.164; número local sem DDI continua brasileiro por compatibilidade. */
export function normalizeSiteWhatsApp(raw:unknown):string {
  if(typeof raw!=='string')return '';
  const value=raw.trim();
  if(value.startsWith('+')){
    if(!/^\+[\d\s().-]+$/.test(value))return '';
    const digits=value.replace(/\D/g,'');
    return /^[1-9]\d{7,14}$/.test(digits)?digits:'';
  }
  return normalizeBrazilianWhatsApp(value);
}
