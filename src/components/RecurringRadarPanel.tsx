import { useEffect, useState } from 'react';
import { getRecurringRadar, runRecurringRadar, saveRecurringRadar, reviewRadarContact, prepareRadarBatch } from '../lib/radarApi';
import { parseRecurringRadarFilters, RADAR_CONSENT_SOURCES, type RadarConsentSource, type RadarReviewDecision, type RadarReviewStatus, type RecurringRadarFilters, type RecurringRadarStatus } from '../lib/radarRecurring';
import type { RadarLead } from '../types';

const brazilTime = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short',
});

export default function RecurringRadarPanel({ filters, onReview, approach }: {
  filters: RecurringRadarFilters;
  approach: string;
  onReview: (leads: RadarLead[]) => void;
}) {
  const [data, setData] = useState<RecurringRadarStatus | null>(null);
  const [busy, setBusy] = useState(true);
  const [reload, setReload] = useState(0);
  const [showContacts, setShowContacts] = useState(false);
  const [filter, setFilter] = useState<RadarReviewStatus>('pending');
  const [consentSources, setConsentSources] = useState<Record<string, RadarConsentSource | ''>>({});
  const [template, setTemplate] = useState(approach);
  const [selected, setSelected] = useState<string[]>([]);
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
  const shown = data?.queue.filter(item => item.status === filter) ?? [];
  function review(key: string, decision: RadarReviewDecision) {
    void update(async () => {
      await reviewRadarContact(key, decision);
      return decision.status === 'approved' ? 'Aceite registrado na fila.' : 'Decisão atualizada.';
    });
  }
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
            onClick={() => setShowContacts(value => !value)} aria-expanded={showContacts}>
            {showContacts ? 'Fechar fila' : 'Abrir fila de revisão'} ({data.queue.length})
          </button>
        </div>
        {showContacts && <div className="space-y-3 border-t border-gray-800 pt-3">
          <p>Marque como aprovado somente se a empresa aceitou receber mensagens pelo WhatsApp. A aprovação fica registrada na fila.</p>
          <label className="block text-white">Status
            <select className="ml-2 rounded border border-gray-800 bg-gray-950 p-2" value={filter}
              onChange={event => setFilter(event.target.value as RadarReviewStatus)}>
              <option value="pending">Pendentes</option>
              <option value="approved">Aprovados</option>
              <option value="excluded">Excluídos</option>
            </select>
          </label>
          {filter === 'approved' && <button type="button" disabled={busy || !shown.length}
            onClick={() => onReview(shown.map(item => item.lead))}
            className="rounded bg-gray-800 px-3 py-2 disabled:opacity-40">Ver aprovados nos resultados do Radar</button>}
          {filter === 'approved' && shown.length > 0 && <div className="space-y-2 rounded border border-gray-800 p-3">
            <label className="block space-y-1">Abordagem para o lote
              <textarea className="block w-full rounded border border-gray-800 bg-gray-950 p-2 text-white"
                value={template} rows={4} maxLength={4000} disabled={busy} onChange={event => setTemplate(event.target.value)} />
            </label>
            <p>Selecione os contatos abaixo. A Atlas calcula as datas pelo limite diário e pela janela da conta.</p>
            <button type="button" disabled={busy || !template.trim() || !shown.some(item => selected.includes(item.key))}
              onClick={() => void update(async () => {
                const keys = shown.filter(item => selected.includes(item.key)).map(item => item.key);
                await prepareRadarBatch(keys, template, data.batch?.preparedAt ?? null);
                setSelected([]);
                return 'Lote preparado, aguardando execução.';
              })}
              className="rounded bg-emerald-400 px-3 py-2 font-semibold text-black disabled:opacity-40">
              {data.batch ? 'Substituir lote preparado' : 'Preparar lote agendado'}
            </button>
          </div>}
          {data.batch && <details className="space-y-2 rounded border border-gray-800 p-3">
            <summary className="cursor-pointer font-semibold text-white">Lote preparado ({data.batch.rows.length})</summary>
            <p>Horários planejados. O envio automático ainda não está disponível.</p>
            <ul className="max-h-64 space-y-2 overflow-auto">
              {data.batch.rows.map(row => <li key={row.key} className="border-b border-gray-800 pb-2">
                <strong>{row.company}</strong> · {row.status === 'cancelled' ? 'Cancelado' : brazilTime.format(new Date(row.at))}
                <p className="whitespace-pre-wrap break-words">{row.message}</p>
              </li>)}
            </ul>
          </details>}
          {!shown.length && <p>Nenhum contato com este status.</p>}
          <ul className="max-h-96 space-y-2 overflow-auto">
            {shown.map(({ key, lead, status, consentSource }) => {
              const selectedSource = consentSources[key];
              return <li key={key} className="space-y-2 rounded border border-gray-800 p-3">
                <strong className="block text-white">{lead.companyName}</strong>
                <p>{lead.city}/{lead.state} · {lead.whatsapp || 'Sem WhatsApp cadastrado'}</p>
                {status === 'approved' && <label className="block">
                  <input type="checkbox" disabled={busy} checked={selected.includes(key)} onChange={event => {
                    const checked = event.target.checked;
                    setSelected(previous => checked ? [...previous, key] : previous.filter(value => value !== key));
                  }} /> Incluir no lote
                </label>}
                {status === 'approved' && consentSource && <p>Origem do aceite: {RADAR_CONSENT_SOURCES[consentSource]}</p>}
                <div className="flex flex-wrap items-end gap-2">
                  {status === 'pending' && lead.whatsapp && <>
                    <label className="space-y-1">Origem do aceite
                      <select value={selectedSource || ''} disabled={busy}
                        onChange={event => setConsentSources(previous => ({ ...previous, [key]: event.target.value as RadarConsentSource | '' }))}
                        className="block rounded border border-gray-800 bg-gray-950 p-2">
                        <option value="">Selecione</option>
                        {Object.entries(RADAR_CONSENT_SOURCES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <button type="button" disabled={busy || !selectedSource}
                      onClick={() => { if (selectedSource) review(key, {status: 'approved', consentSource: selectedSource}); }}
                      className="rounded bg-emerald-400 px-3 py-2 font-semibold text-black disabled:opacity-40">Aprovar com aceite</button>
                  </>}
                  {status !== 'excluded' && <button type="button" disabled={busy}
                    onClick={() => review(key, { status: 'excluded' })}
                    className="rounded bg-gray-800 px-3 py-2 disabled:opacity-40">{status === 'approved' ? 'Revogar aprovação' : 'Excluir da campanha'}</button>}
                  {status === 'excluded' && <button type="button" disabled={busy}
                    onClick={() => review(key, { status: 'pending' })}
                    className="rounded bg-gray-800 px-3 py-2 disabled:opacity-40">Voltar para revisão</button>}
                </div>
              </li>;
            })}
          </ul>
        </div>}
      </>}
    </section>
  );
}
