import { useEffect, useState } from 'react';
import type { Lead } from '../types';
import { AI_MEMORY_LIMIT, EMPTY_TRAINING, TRAINING_FIELDS, type AiTraining, type AiSimulation } from '../lib/aiTraining';
import { getAiTraining, saveAiTraining, simulateAiTraining } from '../lib/radarApi';

export default function AiTrainingPanel({ leads, onSaveAiMemory }: {
  leads: Lead[];
  onSaveAiMemory: (id: string, memory: string, previousMemory: string) => Promise<void>;
}) {
  const [training, setTraining] = useState(EMPTY_TRAINING);
  const [saved, setSaved] = useState<AiTraining | null>(null);
  const [busy, setBusy] = useState<'load' | 'save' | 'test' | 'memory' | null>('load');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [message, setMessage] = useState('');
  const [memory, setMemory] = useState('');
  const [leadId, setLeadId] = useState('');
  const [previousMemory, setPreviousMemory] = useState('');
  const selectedLead = leads.find(lead => lead.id === leadId);
  const [turns, setTurns] = useState<Array<AiSimulation & { message: string }>>([]);
  const dirty = saved !== null && Object.keys(training).some(key => {
    const field = key as keyof AiTraining;
    return training[field] !== saved[field];
  });

  useEffect(() => {
    const controller = new AbortController();
    getAiTraining(controller.signal)
      .then(({ training }) => {
        if (controller.signal.aborted) return;
        setTraining(training);
        setSaved(training);
      })
      .catch(err => { if (!controller.signal.aborted) setError((err as Error).message); })
      .finally(() => { if (!controller.signal.aborted) setBusy(null); });
    return () => controller.abort();
  }, [loadAttempt]);

  async function save() {
    setBusy('save');
    setError('');
    setNotice('');
    try {
      const result = await saveAiTraining(training);
      setTraining(result.training);
      setSaved(result.training);
      setNotice('Treinamento salvo.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function simulate() {
    const input = message.trim();
    if (!input || busy || dirty || !saved) return;
    setBusy('test');
    setError('');
    setNotice('');
    try {
      const result = await simulateAiTraining(input, memory);
      setTurns(previous => [...previous, { ...result, message: input }]);
      setMemory(result.memory);
      setMessage('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function saveLeadMemory() {
    if (!selectedLead || busy) return;
    const next = memory.trim();
    setBusy('memory');
    setNotice('');
    setError('');
    try {
      await onSaveAiMemory(selectedLead.id, next, previousMemory);
      setPreviousMemory(next);
      setNotice(next ? 'Memória salva no CRM.' : 'Memória apagada no CRM.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-5 text-left">
      <header>
        <h2 className="text-xl font-bold text-white">Treinar IA</h2>
        <p className="mt-1 text-sm text-zinc-400">Configure o atendimento da sua empresa e simule uma conversa sem enviar mensagens no WhatsApp.</p>
      </header>
      {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
      {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
      {!saved && (busy === 'load'
        ? <p role="status" className="text-sm text-zinc-400">Carregando treinamento…</p>
        : <button type="button" className="rounded bg-zinc-800 px-3 py-2 text-white" onClick={() => {
            setError('');
            setBusy('load');
            setLoadAttempt(attempt => attempt + 1);
          }}>Tentar novamente</button>)}
      {saved && <div className="grid gap-5 lg:grid-cols-2">
        <form className="space-y-4 rounded-xl border border-zinc-800 p-4" onSubmit={event => { event.preventDefault(); void save(); }}>
          {(Object.entries(TRAINING_FIELDS) as [keyof AiTraining, typeof TRAINING_FIELDS[keyof AiTraining]][]).map(([key, field]) => (
            <label key={key} className="block space-y-1 text-sm text-white">
              <span>{field.label}</span>
              <span className="block text-xs text-zinc-400">{field.hint}</span>
              <textarea rows={4} value={training[key]} maxLength={field.limit} disabled={!!busy}
                onChange={event => setTraining(previous => ({ ...previous, [key]: event.target.value }))}
                className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-sm text-white" />
            </label>
          ))}
          <button disabled={!!busy || !dirty} className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-black disabled:opacity-40">
            {busy === 'save' ? 'Salvando…' : 'Salvar treinamento'}
          </button>
        </form>
        <form className="min-w-0 space-y-3 rounded-xl border border-zinc-800 p-4" onSubmit={event => { event.preventDefault(); void simulate(); }}>
          <h3 className="text-sm font-bold text-white">Simulador de atendimento</h3>
          <label className="block space-y-1 text-sm text-white">
            <span>Lead do CRM (opcional)</span>
            <select value={selectedLead?.id ?? ''} disabled={!!busy}
              onChange={event => {
                const id = event.target.value;
                const summary = leads.find(lead => lead.id === id)?.aiMemory ?? '';
                setLeadId(id);
                setMemory(summary);
                setPreviousMemory(summary);
                setTurns([]);
                setMessage('');
                setNotice('');
                setError('');
              }}
              className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-white">
              <option value="">Simulação sem vínculo</option>
              {leads.map(lead => <option key={lead.id} value={lead.id}>{lead.companyName}</option>)}
            </select>
          </label>
          {turns.length > 0 && <ol className="max-h-72 space-y-3 overflow-auto text-sm text-zinc-300" aria-live="polite">
            {turns.map((turn, index) => <li key={index} className="whitespace-pre-wrap break-words">
              <p><strong>Lead</strong> · {turn.message}</p>
              <p><strong>IA</strong> · {turn.reply}</p>
            </li>)}
          </ol>}
          <label className="block space-y-1 text-sm text-white">
            <span>Mensagem do lead</span>
            <textarea rows={2} value={message} maxLength={2000} disabled={!!busy}
              onChange={event => setMessage(event.target.value)}
              placeholder="Ex.: Quanto custa um site para minha marmoraria?"
              className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-sm text-white" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button disabled={!!busy || dirty || !message.trim() || !Object.values(saved).some(Boolean)}
              className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-black disabled:opacity-40">
              {busy === 'test' ? 'Gerando resposta…' : 'Testar mensagem'}
            </button>
            <button type="button" disabled={!!busy || !turns.length} onClick={() => { setTurns([]); setMemory(previousMemory); setMessage(''); setError(''); }}
              className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white disabled:opacity-40">Limpar teste</button>
          </div>
          {dirty && <p className="text-xs text-zinc-400">Salve as alterações para testar as novas regras.</p>}
          <label className="block space-y-1 text-sm text-white">
            <span>Memória da simulação</span>
            <span className="block text-xs text-zinc-400">Edite este resumo para ajustar o contexto da próxima mensagem do teste.</span>
            <textarea rows={4} value={memory} maxLength={AI_MEMORY_LIMIT} disabled={!!busy}
              onChange={event => setMemory(event.target.value)}
              className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-sm text-white" />
          </label>
          {selectedLead && <button type="button" disabled={!!busy || memory.trim() === previousMemory}
            onClick={() => void saveLeadMemory()}
            className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white disabled:opacity-40">Salvar memória no CRM</button>}
        </form>
      </div>}
    </section>
  );
}
