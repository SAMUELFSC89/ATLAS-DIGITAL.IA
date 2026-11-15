import { useEffect, useState } from 'react';
import { getRecurringRadar, runRecurringRadar, saveRecurringRadar } from '../lib/radarApi';
import { parseRecurringRadarFilters, type RecurringRadarFilters, type RecurringRadarStatus } from '../lib/radarRecurring';
import type { RadarLead } from '../types';

const brazilTime = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short',
});

export default function RecurringRadarPanel({ filters, onReview }: {
  filters: RecurringRadarFilters;
  onReview: (leads: RadarLead[]) => void;
}) {
  const [data, setData] = useState<RecurringRadarStatus | null>(null);
  const [busy, setBusy] = useState(true);
  const [reload, setReload] = useState(0);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    getRecurringRadar(controller.signal)
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(err => { if (!controller.signal.aborted) setError((err as Error).message); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [reload]);

  async function update(operation: () => Promise<string>) {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await operation();
      setData(await getRecurringRadar());
      setNotice(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const valid = parseRecurringRadarFilters(filters);
  return (
    <section className="space-y-3 rounded-xl border border-gray-800 p-4 text-xs text-gray-300">
      <h3 className="text-sm font-semibold text-white">Busca recorrente</h3>
      <p>Salve os filtros do formulário do Radar para buscar empresas todos os dias a partir das 9h, horário de Brasília. Os resultados ficam disponíveis para revisão.</p>
      {error && <p role="alert" className="text-amber-300">{error}</p>}
      {notice && <p role="status" className="text-emerald-300">{notice}</p>}
      {busy && <p role="status">Processando…</p>}
      {!busy && !data && <button type="button" onClick={() => { setError(''); setBusy(true); setReload(value => value + 1); }}
        className="text-emerald-300">Tentar novamente</button>}
      {data && <>
        <p>{data.filters
          ? `${data.enabled ? 'Ativa' : 'Pausada'} · ${data.filters.segment} em ${data.filters.city}/${data.filters.state}`
          : 'Nenhuma busca salva.'}</p>
        {!data.cronConfigured && <p className="text-amber-200">O agendamento precisa de CRON_SECRET na Vercel. Você pode testar a busca manualmente.</p>}
        {data.lastRunAt && <p>Última execução: {brazilTime.format(data.lastRunAt)} · {data.lastAdded ?? 0} novos resultados.</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy || !valid} className="rounded bg-emerald-400 px-3 py-2 font-semibold text-black disabled:opacity-40"
            onClick={() => {
              if (valid) void update(async () => { await saveRecurringRadar(valid, true); return 'Filtros salvos e busca ativada.'; });
            }}>Salvar filtros e ativar</button>
          {data.filters && <>
            <button type="button" disabled={busy} className="rounded bg-gray-800 px-3 py-2 disabled:opacity-40"
              onClick={() => void update(async () => {
                const result = await runRecurringRadar();
                return result.superseded ? 'A configuração mudou durante a busca. Execute novamente.' : `${result.added} novos resultados para revisar.`;
              })}>Buscar agora</button>
            {data.enabled && <button type="button" disabled={busy} className="rounded bg-gray-800 px-3 py-2 disabled:opacity-40"
              onClick={() => {
                const saved = data.filters;
                if (saved) void update(async () => { await saveRecurringRadar(saved, false); return 'Busca pausada.'; });
              }}>Pausar busca</button>}
          </>}
          <button type="button" disabled={busy || !data.queue.length} className="rounded bg-gray-800 px-3 py-2 disabled:opacity-40"
            onClick={() => onReview(data.queue)}>Revisar no Radar ({data.queue.length})</button>
        </div>
      </>}
    </section>
  );
}
