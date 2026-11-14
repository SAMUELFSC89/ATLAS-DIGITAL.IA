import { useEffect, useMemo, useState } from 'react';
import type { RadarLead } from '../types';
import { fillMessage, getProspectingQueueSettings } from '../lib/radarApi';
import { planProspectingSlots, uniqueProspectingCandidates, type ProspectingQueueSettings } from '../lib/prospectingQueue';

const brTime = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  dateStyle: 'short',
  timeStyle: 'short',
});

export default function ProspectingQueuePreview({ leads, message }: { leads: RadarLead[]; message: string }) {
  const [settings, setSettings] = useState<ProspectingQueueSettings | null>(null);
  const [error, setError] = useState('');
  const [template, setTemplate] = useState(message);
  const [plan, setPlan] = useState<{ source: RadarLead[]; template: string; rows: { lead: RadarLead; at: Date }[] } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const unique = useMemo(() => uniqueProspectingCandidates(leads), [leads]);
  const visiblePlan = plan?.source === leads && plan.template === template ? plan : null;

  useEffect(() => {
    const controller = new AbortController();
    getProspectingQueueSettings(AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]))
      .then(data => { if (!controller.signal.aborted) setSettings(data); })
      .catch(err => { if (!controller.signal.aborted) setError((err as Error).message); });
    return () => controller.abort();
  }, [attempt]);

  async function generate() {
    setError('');
    setPlan(null);
    setGenerating(true);
    const requestedTemplate = template;
    try {
      const current = await getProspectingQueueSettings(AbortSignal.timeout(15000));
      setSettings(current);
      const slots = planProspectingSlots(unique.length, current);
      if (slots.length !== unique.length) throw new Error('Confira o limite diário e a janela de envio.');
      setPlan({ source: leads, template: requestedTemplate, rows: unique.map((lead, i) => ({ lead, at: slots[i] })) });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-gray-800 p-4 text-left">
      <h5 className="text-sm font-semibold text-white">Fila simulada</h5>
      <p className="text-xs text-gray-400">Use a seleção atual do Radar para estimar a ordem e os horários da campanha. A fila é uma prévia e não envia mensagens.</p>
      {error && <p role="alert" className="text-xs text-amber-300">{error}</p>}
      {!settings && (error
        ? <button type="button" onClick={() => { setError(''); setAttempt(n => n + 1); }} className="text-xs text-emerald-300">Tentar novamente</button>
        : <p role="status" className="text-xs text-gray-400">Carregando limite e janela de envio…</p>)}
      <label className="block space-y-1 text-xs text-gray-300">
        <span>Abordagem desta campanha</span>
        <textarea rows={4} value={template} maxLength={4000} onChange={event => setTemplate(event.target.value)}
          className="block w-full rounded border border-gray-800 bg-gray-950 p-2 text-white" />
        <span className="block text-gray-400">Variáveis: {'{empresa}'}, {'{cidade}'}, {'{segmento}'}, {'{diagnostico}'}, {'{posicao}'}, {'{nota}'}.</span>
      </label>
      {settings && (
        <p className="text-xs text-gray-400" role="status">
          {settings.dailyLimit} por dia · {Math.max(0, settings.dailyLimit - settings.dailyUsed)} disponíveis hoje · {settings.schedule.enabled
            ? `${settings.schedule.start}–${settings.schedule.end} nos dias configurados`
            : 'janela de envio desativada'} · horário de Brasília
        </p>
      )}
      <button type="button" onClick={() => void generate()} disabled={generating || !settings || !unique.length || !template.trim()}
        className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-black disabled:opacity-40">
        {generating ? 'Gerando prévia…' : 'Gerar prévia da fila'}
      </button>
      {visiblePlan && <>
        <p className="text-xs text-gray-400" role="status">{visiblePlan.rows.length} abordagens previstas, com um minuto entre horários. Os contatos reais precisam de autorização.</p>
        <ol className="max-h-96 space-y-2 overflow-auto">
          {visiblePlan.rows.map(({ lead, at }) => (
            <li key={lead.id} className="rounded-lg border border-gray-800 p-3 text-xs text-gray-300">
              <div className="flex flex-wrap justify-between gap-2">
                <strong className="text-white">{lead.companyName}</strong>
                <time dateTime={at.toISOString()}>{brTime.format(at)}</time>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words">{fillMessage(visiblePlan.template, lead)}</p>
            </li>
          ))}
        </ol>
      </>}
    </section>
  );
}
