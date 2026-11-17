import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus, LoaderCircle, Upload, X } from 'lucide-react';
import type { ExpressAsset } from '../lib/expressOrder';

export interface UploadSession { projectId: string; writeKey: string }
async function prepareImage(file: File, kind: 'photo' | 'logo') {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) throw new Error('Escolha uma imagem JPG, PNG ou WebP de até 15 MB.');
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Não foi possível abrir esta imagem. Tente JPG, PNG ou WebP.')); image.src = source; });
    let longest = kind === 'logo' ? 1400 : 2200;
    for (let attempt = 0; attempt < 6; attempt++) {
      const ratio = Math.min(1, longest / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const context = canvas.getContext('2d'); if (!context) throw new Error('Não foi possível preparar a imagem.');
      if (kind === 'photo') { context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const mime = kind === 'logo' ? 'image/png' : 'image/jpeg';
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, 0.85 - attempt * 0.04));
      if (blob && blob.size <= 750 * 1024) {
        const encoded = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.')); reader.readAsDataURL(blob); });
        return { data: encoded.split(',')[1], thumbnail: encoded };
      }
      longest = Math.round(longest * 0.78);
    }
    throw new Error('A imagem ficou muito pesada. Escolha outro arquivo.');
  } finally { URL.revokeObjectURL(source); }
}

export default function ExpressAssetUpload({ assets, session, onChange, onBusy, disabled }: {
  assets: ExpressAsset[]; session: UploadSession; onChange: (value: ExpressAsset[]) => void; onBusy: (busy: boolean) => void; disabled?: boolean;
}) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const lock = useRef(false);
  const latest = useRef(assets); latest.current = assets;
  useEffect(() => () => { onBusy(false); }, []);

  async function choose(event: ChangeEvent<HTMLInputElement>, kind: 'photo' | 'logo') {
    const selected = Array.from(event.target.files || []) as File[]; event.target.value = '';
    if (lock.current || !selected.length) return;
    const existing = latest.current.filter(asset => asset.kind === kind);
    if (kind === 'photo' && existing.length + selected.length > 6) { setError('Você pode enviar até seis fotos.'); return; }
    lock.current = true; onBusy(true); setBusy(kind); setError('');
    try {
      for (const file of selected.slice(0, kind === 'logo' ? 1 : 6)) {
        const prepared = await prepareImage(file, kind);
        const assetId = crypto.randomUUID();
        const response = await fetch('/api/site-express?view=upload', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...session, assetId, kind, name: file.name, data: prepared.data }) });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.asset) throw new Error(result?.error || 'Não foi possível enviar o arquivo. Tente novamente.');
        const next = [...latest.current.filter(asset => kind !== 'logo' || asset.kind !== 'logo'), result.asset as ExpressAsset];
        latest.current = next; onChange(next);
        setThumbnails(previous => ({ ...previous, [assetId]: prepared.thumbnail }));
      }
    } catch (error) { setError((error as Error).message); }
    finally { lock.current = false; setBusy(''); onBusy(false); }
  }

  return <fieldset disabled={Boolean(busy) || disabled} className="space-y-4 border-t border-white/10 pt-5">
    <legend className="mb-1 text-base font-bold">Imagens da sua empresa</legend>
    <p className="text-sm leading-relaxed text-zinc-400">Envie sua logo e fotos dos produtos, serviços ou ambientes que deseja mostrar.</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="relative flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/25 bg-black/15 p-4 text-center hover:border-[#E2B755] focus-within:ring-2 focus-within:ring-[#E2B755]">
        {busy === 'logo' ? <LoaderCircle size={22} className="animate-spin text-[#E2B755]" /> : <Upload size={22} className="text-[#E2B755]" />}
        <span className="text-sm font-semibold">{busy === 'logo' ? 'Enviando logo…' : 'Enviar logo'}</span><span className="text-xs text-zinc-500">Uma imagem · opcional</span>
        <input type="file" aria-label="Enviar logo" accept="image/jpeg,image/png,image/webp" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={event => void choose(event, 'logo')} />
      </label>
      <label className="relative flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/25 bg-black/15 p-4 text-center hover:border-[#E2B755] focus-within:ring-2 focus-within:ring-[#E2B755]">
        {busy === 'photo' ? <LoaderCircle size={22} className="animate-spin text-[#E2B755]" /> : <ImagePlus size={22} className="text-[#E2B755]" />}
        <span className="text-sm font-semibold">{busy === 'photo' ? 'Enviando fotos…' : 'Enviar fotos'}</span><span className="text-xs text-zinc-500">Até seis imagens · opcional</span>
        <input type="file" multiple aria-label="Enviar fotos" accept="image/jpeg,image/png,image/webp" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={event => void choose(event, 'photo')} />
      </label>
    </div>
    {assets.length > 0 && <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">{assets.map(asset => <li key={asset.id} className="relative overflow-hidden rounded-xl border border-white/15 bg-black/15">
      <img src={thumbnails[asset.id] || asset.url} alt={`${asset.kind === 'logo' ? 'Logo' : 'Foto'} enviada: ${asset.name}`} className={`h-28 w-full ${asset.kind === 'logo' ? 'bg-white p-3 object-contain' : 'object-cover'}`} />
      <button type="button" onClick={() => onChange(latest.current.filter(item => item.id !== asset.id))} aria-label={`Remover ${asset.name}`} className="absolute right-1 top-1 flex min-h-10 min-w-10 items-center justify-center rounded-full bg-black/75 text-white"><X size={16} /></button>
      <div className="p-2"><p className="truncate text-xs font-medium">{asset.kind === 'logo' ? 'Logo' : 'Foto'} · {asset.name}</p><p className="mt-1 text-[11px] text-emerald-300">Arquivo enviado</p></div>
    </li>)}</ul>}
    <p className="text-xs leading-relaxed text-zinc-500">JPG, PNG ou WebP, até 15 MB por arquivo. As imagens são preparadas para o envio e ficam guardadas com seu projeto.</p>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </fieldset>;
}
