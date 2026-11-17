import { createHash } from 'node:crypto';
import { db, orderId, previews, saoPauloDay } from './express-store.js';
import type { ExpressAsset } from '../../src/lib/expressOrder.js';

export class ExpressAssetError extends Error {}

export const ASSET_MAX_BYTES = 750 * 1024;
const projects = () => db().collection('expressAssetProjects');
const files = (projectId: string) => projects().doc(projectId).collection('files');
const digest = (value: string) => createHash('sha256').update(value).digest('hex');

export function rasterInfo(data: Buffer) {
  let width = 0, height = 0, mimeType: ExpressAsset['mimeType'] | '' = '';
  if (data.length >= 24 && data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    mimeType = 'image/png'; width = data.readUInt32BE(16); height = data.readUInt32BE(20);
  } else if (data.length >= 12 && data[0] === 255 && data[1] === 216) {
    mimeType = 'image/jpeg';
    for (let i = 2; i + 8 < data.length;) {
      if (data[i] !== 255) break;
      const marker = data[i + 1];
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)) {
        height = data.readUInt16BE(i + 5); width = data.readUInt16BE(i + 7); break;
      }
      const length = data.readUInt16BE(i + 2);
      if (length < 2) break;
      i += length + 2;
    }
  } else if (data.length >= 30 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') {
    mimeType = 'image/webp';
    const type = data.toString('ascii', 12, 16);
    if (type === 'VP8X') { width = 1 + data.readUIntLE(24, 3); height = 1 + data.readUIntLE(27, 3); }
    if (type === 'VP8 ') { width = data.readUInt16LE(26) & 0x3fff; height = data.readUInt16LE(28) & 0x3fff; }
    if (type === 'VP8L' && data[20] === 0x2f) {
      const bits = data.readUInt32LE(21); width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1;
    }
  }
  if (!mimeType || !width || !height || width > 6000 || height > 6000 || width * height > 24000000) throw new ExpressAssetError('Formato de imagem inválido. Use JPG, PNG ou WebP.');
  return { mimeType, width, height };
}

export function decodeUpload(body: any) {
  if (!orderId(body?.projectId) || !orderId(body?.writeKey) || !orderId(body?.assetId) ||
    !['photo', 'logo'].includes(body?.kind) || typeof body?.data !== 'string' ||
    body.data.length > Math.ceil(ASSET_MAX_BYTES / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.data)) {
    throw new ExpressAssetError('Arquivo inválido. Tente selecionar a imagem novamente.');
  }
  const data = Buffer.from(body.data, 'base64');
  if (data.length < 40 || data.length > ASSET_MAX_BYTES) throw new ExpressAssetError('A imagem precisa ter até 750 KB após a preparação.');
  const info = rasterInfo(data);
  const name = typeof body.name === 'string' ? body.name.replace(/[\u0000-\u001f\u007f/\\]/g, '').slice(0, 120) : 'imagem';
  const asset: ExpressAsset = { id: body.assetId, projectId: body.projectId, kind: body.kind, name: name || 'imagem', ...info, size: data.length };
  return { asset, data, writeKeyHash: digest(body.writeKey) };
}

export async function saveExpressAsset(body: unknown, ip: string) {
  const { asset, data, writeKeyHash } = decodeUpload(body);
  const project = projects().doc(asset.projectId), file = files(asset.projectId).doc(asset.id);
  const day = saoPauloDay(Date.now());
  const global = db().collection('expressAssetLimits').doc(day);
  const client = global.collection('clients').doc(digest(ip));
  await db().runTransaction(async tx => {
    const [p, existing, all, own] = await tx.getAll(project, file, global, client);
    const current = p.data();
    if (current && current.writeKeyHash !== writeKeyHash) throw new ExpressAssetError('Não foi possível acessar este envio. Selecione as imagens novamente.');
    if (existing.exists) {
      if (existing.data()?.hash !== digest(data.toString('base64'))) throw new ExpressAssetError('O arquivo foi alterado. Selecione a imagem novamente.');
      return;
    }
    if ((current?.count || 0) >= 14 || (all.data()?.count || 0) >= 140 || (own.data()?.count || 0) >= 28) {
      throw new ExpressAssetError('O limite de arquivos deste envio foi atingido. Fale com a Atlas para continuar.');
    }
    tx.set(project, { writeKeyHash, count: (current?.count || 0) + 1, createdAt: current?.createdAt || Date.now() });
    tx.create(file, { ...asset, data, hash: digest(data.toString('base64')), createdAt: Date.now() });
    tx.set(global, { count: (all.data()?.count || 0) + 1 });
    tx.set(client, { count: (own.data()?.count || 0) + 1 });
  });
  return asset;
}

export async function resolveExpressAssets(body: any, previewId: string): Promise<ExpressAsset[]> {
  const selected = body?.assetIds;
  if (selected === undefined || (Array.isArray(selected) && selected.length === 0)) return [];
  if (!Array.isArray(selected) || selected.length > 7 || !selected.every(orderId) || new Set(selected).size !== selected.length) throw new ExpressAssetError('Selecione até seis fotos e uma logo.');
  const source = orderId(body.sourcePreviewId) ? (await previews().doc(body.sourcePreviewId).get()).data() : null;
  const original = (source?.business?.assets || []) as ExpressAsset[];
  const hasProject = orderId(body.projectId) && orderId(body.writeKey);
  const project = hasProject ? (await projects().doc(body.projectId).get()).data() : null;
  if (project && project.writeKeyHash !== digest(body.writeKey)) throw new ExpressAssetError('Não foi possível confirmar os arquivos enviados.');
  const output: ExpressAsset[] = [];
  for (const id of selected) {
    let asset = original.find(item => item.id === id);
    if (!asset && project) {
      const saved = (await files(body.projectId).doc(id).get()).data();
      if (saved) {
        const { data: _data, hash: _hash, createdAt: _createdAt, ...metadata } = saved;
        asset = metadata as ExpressAsset;
      }
    }
    if (!asset) throw new ExpressAssetError('Uma imagem ainda não foi enviada. Aguarde o envio ou selecione novamente.');
    output.push({ ...asset, url: `/api/site-express?view=asset&id=${previewId}&asset=${asset.id}` });
  }
  if (output.filter(asset => asset.kind === 'logo').length > 1 || output.filter(asset => asset.kind === 'photo').length > 6) throw new ExpressAssetError('Selecione até seis fotos e uma logo.');
  return output;
}

export async function readExpressAsset(previewId: string, assetId: string) {
  const preview = (await previews().doc(previewId).get()).data();
  const asset = (preview?.business?.assets || []).find((item: ExpressAsset) => item.id === assetId) as ExpressAsset | undefined;
  if (!asset || !orderId(asset.projectId)) return null;
  const saved = (await files(asset.projectId).doc(assetId).get()).data();
  return saved?.data ? { asset, buffer: Buffer.from(saved.data) } : null;
}

export async function visualAssetInputs(assets: ExpressAsset[] = []) {
  const selected = [...assets.filter(item => item.kind === 'logo'), ...assets.filter(item => item.kind === 'photo').slice(0, 6)];
  const result = [];
  for (const asset of selected) {
    const saved = (await files(asset.projectId).doc(asset.id).get()).data();
    if (saved?.data) result.push({ kind: asset.kind, name: asset.name, mimeType: asset.mimeType, data: Buffer.from(saved.data).toString('base64') });
  }
  return result;
}
