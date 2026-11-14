import { useState, type FormEvent } from 'react';
import { AlertCircle, Download, Loader2 } from 'lucide-react';
import type { AtlasScoreReport, Lead, LocalSearchPosition } from '../types';
import { getAtlasScore } from '../lib/radarApi';
import { createPositioningPdf } from '../lib/positioningPdf';
import AtlasAuditPanel from './AtlasAuditPanel';

interface AtlasScoreModuleProps {
  lead?: Lead;
  onSavePosition: (id: string, result: LocalSearchPosition) => Promise<void>;
}

export default function AtlasScoreModule({ lead, onSavePosition }: AtlasScoreModuleProps) {
  const [companyName, setCompanyName] = useState(lead?.companyName || '');
  const [city, setCity] = useState([lead?.city, lead?.state].filter(Boolean).join(', '));
  const [term, setTerm] = useState(lead?.segment || '');
  const [website, setWebsite] = useState(lead?.website || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(lead?.googleProfile || '');
  const [radius, setRadius] = useState('10');
  const [report, setReport] = useState<AtlasScoreReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedToCrm, setSavedToCrm] = useState(false);
  const [savingPosition, setSavingPosition] = useState(false);

  async function measure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setReport(null);
    setSavedToCrm(false);
    try {
      setReport(await getAtlasScore({ companyName, city, segment: term, website, googleMapsUrl, radiusKm: Number(radius) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível consultar a posição agora.');
    } finally {
      setLoading(false);
    }
  }

  async function savePosition() {
    if (!lead || !report) return;
    setError('');
    setSavingPosition(true);
    try {
      await onSavePosition(lead.id, report.localSearch);
      setSavedToCrm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a medição no CRM.');
    } finally {
      setSavingPosition(false);
    }
  }

  async function downloadReport() {
    if (!report) return;
    setError('');
    try {
      const { doc, filename } = await createPositioningPdf({
        companyName: report.companyName,
        city: report.city,
        state: '',
        hasGoogleProfile: Boolean(report.profileUrl),
        hasWebsite: Boolean(report.website),
        hasHttpsWebsite: /^https:\/\//i.test(report.website),
        hasPublicPhone: Boolean(report.phone),
        rating: report.rating,
        reviewsCount: report.reviewsCount,
        localSearch: report.localSearch,
      });
      doc.save(filename);
    } catch {
      setError('Não foi possível exportar o PDF.');
    }
  }

  const local = report?.localSearch;
  const fields = [
    { id: 'company', label: 'Nome no Google Maps', value: companyName, update: setCompanyName, placeholder: 'Ex. Marmoraria Granitos Finos', required: true },
    { id: 'city', label: 'Cidade e UF', value: city, update: setCity, placeholder: 'Ex. Porto Alegre, RS', required: true },
    { id: 'term', label: 'Termo de busca', value: term, update: setTerm, placeholder: 'Ex. marmoraria ou bancada de granito', required: true },
    { id: 'website', label: 'Site (opcional)', value: website, update: setWebsite, placeholder: 'Ex. empresa.com.br' },
    { id: 'maps', label: 'Link completo do Google Maps (opcional)', value: googleMapsUrl, update: setGoogleMapsUrl, placeholder: 'https://www.google.com/maps/place/…' },
  ];

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        <h2 className="font-display text-3xl font-black text-white">Atlas Score</h2>
        <p className="text-sm text-zinc-400">Mede a presença digital da empresa com dados conferidos na hora: posição na busca local, reputação, perfil no Google e site. Cada ponto mostra o dado que o justifica.</p>
      </header>
      <form onSubmit={measure} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <label key={field.id} className={`grid gap-1.5 text-sm text-zinc-200 ${field.id === 'maps' ? 'sm:col-span-2' : ''}`}>
              {field.label}
              <input required={field.required} value={field.value} onChange={(event) => field.update(event.target.value)}
                placeholder={field.placeholder} className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2.5 text-sm focus:border-[#E2B755] focus:outline-none" />
            </label>
          ))}
          <label className="grid gap-1.5 text-sm text-zinc-200">
            Raio de referência (km)
            <input type="number" min="1" max="100" required value={radius} onChange={(event) => setRadius(event.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2.5 text-sm focus:border-[#E2B755] focus:outline-none" />
          </label>
        </div>
        <button disabled={loading || savingPosition} className="inline-flex items-center gap-2 rounded-lg bg-[#E2B755] px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50">
          {loading && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
          {loading ? 'Medindo no Google e no site…' : 'Medir Atlas Score'}
        </button>
      </form>
      {error && <p role="alert" className="flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
      {report && local && (
        <article className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white">{report.companyName}</h3>
              <p className="text-sm text-zinc-400">{report.city}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {lead && <button type="button" onClick={() => void savePosition()} disabled={savedToCrm || savingPosition}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50">
                {savedToCrm ? 'Posição salva no CRM' : savingPosition ? 'Salvando posição…' : 'Salvar posição no CRM'}
              </button>}
              <button type="button" onClick={() => void downloadReport()} className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-white hover:bg-zinc-800">
                <Download className="h-4 w-4" /> Baixar PDF
              </button>
            </div>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-black p-4">
              <dt className="text-sm text-zinc-400">Posição na consulta</dt>
              <dd className="mt-1 text-lg font-bold text-white">{local.position === null ? 'Fora dos resultados retornados' : `${local.position}º lugar`}</dd>
            </div>
            <div className="rounded-xl bg-black p-4">
              <dt className="text-sm text-zinc-400">Índice de posição local</dt>
              <dd className="mt-1 text-lg font-bold text-[#E2B755]">{local.score === null ? 'Dados insuficientes' : `${local.score}/100`}</dd>
            </div>
          </dl>
          <p className="text-sm text-zinc-300">Busca por <strong>{local.query}</strong> em {new Date(local.checkedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · {local.resultsChecked} resultados consultados.</p>
          <p className="text-xs text-zinc-400">Fonte Google Maps, via Google Places. A posição vale para esta consulta local. O índice de posição vai de 100 no 1º lugar a 5 no 20º. Fora dos 20 primeiros, o índice é 0 quando a consulta retorna os 20 resultados.</p>
          <dl className="space-y-2 border-t border-zinc-800 pt-3 text-sm text-zinc-300">
            <div><dt className="inline font-semibold">Avaliações no Google</dt>{' '}<dd className="inline">{report.rating === null ? 'Sem nota retornada' : `${report.rating.toLocaleString('pt-BR')}/5 · ${report.reviewsCount} avaliações`}</dd></div>
            <div><dt className="inline font-semibold">Site no perfil</dt>{' '}<dd className="inline">{report.website ? <a className="break-all underline" href={report.website} target="_blank" rel="noopener noreferrer">{report.website}</a> : 'Sem site próprio vinculado na consulta'}</dd></div>
            {report.profileUrl && <div><a className="underline" href={report.profileUrl} target="_blank" rel="noopener noreferrer">Abrir perfil no Google Maps</a></div>}
          </dl>
          {report.audit && <AtlasAuditPanel audit={report.audit} />}
        </article>
      )}
    </section>
  );
}
