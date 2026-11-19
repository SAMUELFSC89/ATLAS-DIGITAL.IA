import { createHash } from 'node:crypto';
import { db, publicOrigin } from './express-store.js';
import { normalizeBrazilianWhatsApp } from '../../src/lib/contact.js';

const creators = () => db().collection('expressBuilderCreators');
const handles = () => db().collection('expressBuilderCreatorHandles');
const directory = () => db().collection('expressBuilderCreatorDirectory');
const portfolio = () => db().collection('expressBuilderPortfolioItems');
const projects = () => db().collection('expressBuilderProjects');
const published = () => db().collection('expressBuilderPublished');
export const creatorKey = (email: string) => createHash('sha256').update(email.toLowerCase()).digest('hex');
/** Contador por conta: nenhuma coleção global compartilhada bloqueia vários criadores. */
async function mutationQuota(email: string, action: string, cap: number) {
  const hour = Math.floor(Date.now()/3600000), ownerId=creatorKey(email);
  const ref=db().collection('expressLimits').doc('creator-'+action+'-'+ownerId+'-'+hour);
  return db().runTransaction(async tx=>{
    const snap=await tx.get(ref),count=snap.data()?.count||0;
    if(count>=cap)return false;
    tx.set(ref,{count:count+1,expiresAt:new Date((hour+2)*3600000)});
    return true;
  });
}
const text = (value: unknown, max: number) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';
const handlePattern = /^[a-z][a-z0-9-]{2,31}$/;
const reserved = new Set(['atlas','atlasdigital','atlas-digital','suporte','admin','api','criadores','contato','atendimento','oficial','verificado','portfolios','perfil','entrar','login','root','app','site','sites']);
export const validCreatorHandle = (handle: string) => handlePattern.test(handle) && !reserved.has(handle) && !handle.startsWith('atlas-');

export class PortfolioError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const fail = (status: number, message: string): never => { throw new PortfolioError(status, message); };
const publicUrl = (slug: string) => publicOrigin() + '/s/' + slug;
const creatorUrl = (handle: string) => publicOrigin() + '/criadores/' + handle;
const publicCreator = (p: any) => ({
  handle: p.handle,
  name: p.name,
  headline: p.headline || '',
  bio: p.bio || '',
  city: p.city || '',
  specialties: p.specialties || '',
  contactUrl: p.contactPublic && p.whatsapp
    ? 'https://wa.me/' + p.whatsapp + '?text=' + encodeURIComponent('Olá! Vi seu portfólio na Atlas Digital e gostaria de conversar sobre um projeto.')
    : null,
  url: creatorUrl(p.handle),
});
const siteCard = (p: any) => ({
  id: p.publishedSlug,
  name: p.name,
  segment: p.segment,
  city: p.city,
  description: p.caption || '',
  accent: /^#[0-9a-f]{6}$/i.test(p.accent) ? p.accent : '#b6a172',
  url: publicUrl(p.publishedSlug),
});

export async function getOwnerPortfolio(email: string) {
  const ownerId = creatorKey(email);
  const [profileSnap, list] = await Promise.all([
    creators().doc(ownerId).get(),
    projects().where('ownerEmail','==',email.toLowerCase()).limit(250).get(),
  ]);
  return {
    profile: profileSnap.exists ? {
      handle: profileSnap.data().handle,
      name: profileSnap.data().name || '',
      headline: profileSnap.data().headline || '',
      bio: profileSnap.data().bio || '',
      city: profileSnap.data().city || '',
      specialties: profileSnap.data().specialties || '',
      whatsapp: profileSnap.data().whatsapp || '',
      contactPublic: profileSnap.data().contactPublic === true,
      publicEnabled: profileSnap.data().publicEnabled === true,
      url: creatorUrl(profileSnap.data().handle),
    } : null,
    projects: list.docs.map(d => ({
      id: d.id,
      name: d.data().business?.name || 'Site sem nome',
      segment: d.data().business?.segment || '',
      publishedUrl: d.data().publishedSlug ? publicUrl(d.data().publishedSlug) : null,
      portfolioVisible: d.data().portfolioVisible === true,
      caption: d.data().portfolioCaption || '',
      updatedAt: d.data().updatedAt || 0,
    })).sort((a,b) => b.updatedAt - a.updatedAt),
  };
}

export async function saveCreatorProfile(email: string, input: any) {
  if (!(await mutationQuota(email,'profile',20))) fail(429,'Muitas alterações de perfil. Tente novamente mais tarde.');
  const ownerId = creatorKey(email);
  const handle = text(input?.handle, 32).toLowerCase();
  const name = text(input?.name, 80);
  const headline = text(input?.headline, 110);
  const bio = text(input?.bio, 500);
  const city = text(input?.city, 80);
  const specialties = text(input?.specialties, 160);
  const whatsappText = text(input?.whatsapp, 32);
  const whatsapp = whatsappText ? normalizeBrazilianWhatsApp(whatsappText) : '';
  const contactPublic = input?.contactPublic === true;
  const publicEnabled = input?.publicEnabled === true;
  if (!validCreatorHandle(handle)) fail(400,'Escolha um endereço com 3 a 32 caracteres, começando por letra e usando somente letras, números ou hífen.');
  if (!name || name.length < 3) fail(400,'Informe seu nome ou nome profissional (mínimo três caracteres).');
  if (whatsappText && !whatsapp) fail(400,'Informe um WhatsApp brasileiro válido com DDD.');
  if (contactPublic && !whatsapp) fail(400,'Informe um WhatsApp antes de disponibilizar contato ao público.');
  const profile = {handle,name,headline,bio,city,specialties,whatsapp,contactPublic,publicEnabled,updatedAt:Date.now()};
  await db().runTransaction(async tx => {
    const ownerRef = creators().doc(ownerId), handleRef = handles().doc(handle);
    const [old, slug] = await tx.getAll(ownerRef,handleRef);
    if (old.exists && old.data().handle !== handle) fail(409,'O endereço do perfil não pode ser alterado depois de criado.');
    if (slug.exists && slug.data().ownerId !== ownerId) fail(409,'Esse endereço já está em uso. Escolha outro.');
    if (!slug.exists) tx.create(handleRef,{ownerId,createdAt:Date.now()});
    tx.set(ownerRef,{...profile,ownerId,createdAt:old.data()?.createdAt || Date.now()});
    if (publicEnabled) tx.set(directory().doc(handle),{...publicCreator(profile),updatedAt:Date.now()});
    else tx.delete(directory().doc(handle));
  });
  return getOwnerPortfolio(email);
}

export async function togglePortfolioSite(email: string, projectId: string, visible: boolean) {
  const ownerId = creatorKey(email);
  const projRef = projects().doc(projectId), cardRef = portfolio().doc(ownerId + '_' + projectId);
  await db().runTransaction(async tx => {
    const doc = await tx.get(projRef);
    const p = doc.data();
    if (!p || p.ownerEmail !== email.toLowerCase()) fail(404,'Projeto não encontrado nesta conta.');
    const profile = await tx.get(creators().doc(ownerId));
    if (!profile.exists) fail(409,'Configure seu perfil profissional antes de adicionar sites ao portfólio.');
    if (p.job) fail(409,'Conclua a edição do projeto antes de alterar a visibilidade.');
    if (visible && !p.publishedSlug) fail(409,'Publique o site antes de exibi-lo no portfólio.');
    if (visible) {
      const live = await tx.get(published().doc(p.publishedSlug));
      if (!live.exists) fail(409,'Este site ainda não está disponível no endereço público.');
    }
    const direction = (p.directions || []).find((d: any) => d.id === p.directionId);
    tx.set(cardRef,{
      ownerId,projectId,name:text(p.business?.name,100),segment:text(p.business?.segment,80),
      city:text(p.business?.city,100),caption:text(p.portfolioCaption,230),
      accent:direction?.accent || '#b6a172',publishedSlug:p.publishedSlug || '',
      visible,updatedAt:Date.now(),
    });
    tx.update(projRef,{portfolioVisible:visible,updatedAt:Date.now()});
  });
  return {visible};
}

export async function savePortfolioCaption(email: string, projectId: string, caption: string) {
  if (!(await mutationQuota(email,'caption',100))) fail(429,'Muitas alterações. Tente novamente mais tarde.');
  const ownerId=creatorKey(email);
  const ref=projects().doc(projectId), cardRef=portfolio().doc(ownerId+'_'+projectId);
  const cleaned=text(caption,230);
  await db().runTransaction(async tx=>{
    const snap=await tx.get(ref),p=snap.data();
    if(!p||p.ownerEmail!==email.toLowerCase())fail(404,'Projeto não encontrado nesta conta.');
    if(p.job)fail(409,'Aguarde a operação em andamento.');
    const card=await tx.get(cardRef);
    tx.update(ref,{portfolioCaption:cleaned,updatedAt:Date.now()});
    if(card.exists)tx.update(cardRef,{caption:cleaned,updatedAt:Date.now()});
  });
  return {caption:cleaned};
}

export async function getPublicCreator(handle: string) {
  if (!validCreatorHandle(handle)) fail(404,'Perfil não encontrado.');
  const alias = await handles().doc(handle).get();
  if (!alias.exists) fail(404,'Perfil não encontrado.');
  const ownerId = alias.data().ownerId;
  const profileDoc = await creators().doc(ownerId).get();
  const profile = profileDoc.data();
  if (!profile || profile.publicEnabled !== true || profile.handle !== handle) fail(404,'Perfil não encontrado.');
  const items = await portfolio().where('ownerId','==',ownerId).limit(250).get();
  const entries = items.docs.map(d => d.data()).filter(item => item.visible === true && /^[a-z0-9-]{5,70}$/.test(item.publishedSlug || '')).sort((a,b) => b.updatedAt - a.updatedAt).slice(0,100);
  return {creator:publicCreator(profile),sites:entries.map(siteCard)};
}

export async function getPublicCreatorDirectory(cursor = '') {
  if(cursor && !validCreatorHandle(cursor)) fail(400,'Cursor de paginação inválido.');
  let query = directory().orderBy('handle').limit(30);
  if(cursor) query=query.startAfter(cursor);
  const snap = await query.get();
  const creatorsList = snap.docs.map(doc => doc.data()).filter(p => validCreatorHandle(p.handle) && p.name);
  return {creators:creatorsList, nextCursor:snap.docs.length===30?snap.docs[snap.docs.length-1].data().handle:null};
}
