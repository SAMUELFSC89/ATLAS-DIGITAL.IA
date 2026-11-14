import { lazy, Suspense, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import type { Lead } from '../types';
import type { CityMarker } from './OpportunityMapCanvas';
import municipalities from '../data/municipios.json';

const MapCanvas = lazy(() => import('./OpportunityMapCanvas'));
const coordinates: Record<string, number[] | undefined> = municipalities;
const regions = [
  { label: 'Norte', states: 'AC AP AM PA RO RR TO' },
  { label: 'Nordeste', states: 'AL BA CE MA PB PE PI RN SE' },
  { label: 'Centro-Oeste', states: 'DF GO MT MS' },
  { label: 'Sudeste', states: 'ES MG RJ SP' },
  { label: 'Sul', states: 'PR RS SC' },
];

function municipalityKey(lead: Lead) {
  const city = (lead.city || '').normalize('NFD').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${(lead.state || '').trim().toUpperCase()}:${city}`;
}

export default function OpportunityMap({ leads, loading, error, onOpenRadar, onOpenAudit }: {
  leads: Lead[];
  loading: boolean;
  error: string;
  onOpenRadar: () => void;
  onOpenAudit: (lead: Lead) => void;
}) {
  const [region, setRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const opportunities = useMemo(() => leads.filter(lead =>
    (!region || region.split(' ').includes((lead.state || '').trim().toUpperCase())) &&
    (!lead.website?.trim() || (typeof lead.atlasScore === 'number' && lead.atlasScore < 60)),
  ), [leads, region]);

  const cities = useMemo(() => {
    const grouped = new Map<string, CityMarker>();
    for (const lead of opportunities) {
      const id = municipalityKey(lead);
      const point = coordinates[id];
      if (!point || point.length !== 2) continue;

      const marker = grouped.get(id);
      if (marker) marker.count++;
      else grouped.set(id, { id, label: `${lead.city} / ${id.split(':')[0]}`, coordinates: [point[0], point[1]], count: 1 });
    }
    return [...grouped.values()].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [opportunities]);

  const cityFilter = cities.some(city => city.id === selectedCity) ? selectedCity : '';
  const shown = cityFilter
    ? opportunities.filter(lead => municipalityKey(lead) === cityFilter)
    : opportunities;
  const unmapped = opportunities.length - cities.reduce((sum, city) => sum + city.count, 0);

  return (
    <section className="lg:col-span-5 min-w-0 space-y-4 rounded-2xl border border-gray-900 bg-[#121214]/30 p-4 sm:p-6">
      <h3 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-white sm:text-sm">
        <MapPin className="h-4 w-4 shrink-0 text-emerald-400" />
        Mapa Local de Oportunidades
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="min-w-0 text-xs text-gray-400">
          Região
          <select value={region} onChange={event => {
            setRegion(event.target.value);
            setSelectedCity('');
          }} className="mt-1 block w-full rounded border border-gray-800 bg-gray-950 p-2 text-white">
            <option value="">Todas as regiões</option>
            {regions.map(item => <option key={item.label} value={item.states}>{item.label}</option>)}
          </select>
        </label>
        <label className="min-w-0 text-xs text-gray-400">
          Município
          <select value={cityFilter} onChange={event => setSelectedCity(event.target.value)}
            className="mt-1 block w-full rounded border border-gray-800 bg-gray-950 p-2 text-white">
            <option value="">Todos os municípios</option>
            {cities.map(city => <option key={city.id} value={city.id}>{city.label}</option>)}
          </select>
        </label>
      </div>
      <Suspense fallback={<p role="status" className="h-64 text-sm text-gray-400">Carregando mapa…</p>}>
        <MapCanvas cities={cities} onSelect={setSelectedCity} />
      </Suspense>
      {error && <p role="alert" className="text-xs text-amber-300">Falha ao atualizar os dados do CRM. {error}</p>}
      <p role="status" className="text-xs text-gray-400">
        {loading ? 'Carregando oportunidades do CRM…' : `${shown.length} ${shown.length === 1 ? 'oportunidade' : 'oportunidades'} no CRM. Os marcadores indicam o centro dos municípios.`}
        {!cityFilter && unmapped > 0 && ` Sem município localizado: ${unmapped}.`}
      </p>
      {shown.length ? (
        <ul className="max-h-52 space-y-2 overflow-y-auto">
          {shown.map(lead => (
            <li key={lead.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-800 p-2.5 text-xs">
              <div className="min-w-0">
                <p className="break-words font-bold text-white">{lead.companyName}</p>
                <p className="text-gray-400">{[lead.city, lead.state].filter(Boolean).join(' / ') || 'Localização não informada'} · {lead.website?.trim() ? `Atlas Score ${lead.atlasScore}/100` : 'Sem site cadastrado'}</p>
              </div>
              <button type="button" onClick={() => onOpenAudit(lead)} aria-label={`Auditar ${lead.companyName}`}
                className="shrink-0 rounded bg-gray-900 px-2 py-1.5 text-emerald-300 hover:bg-gray-800">Auditar</button>
            </li>
          ))}
        </ul>
      ) : !loading && !error && <p className="text-xs text-gray-400">Nenhuma oportunidade nesta seleção. Salve empresas do Radar no CRM para vê-las aqui.</p>}
      <button type="button" onClick={onOpenRadar} className="text-xs font-semibold text-emerald-300 hover:underline">Abrir Radar de Mercado</button>
    </section>
  );
}
