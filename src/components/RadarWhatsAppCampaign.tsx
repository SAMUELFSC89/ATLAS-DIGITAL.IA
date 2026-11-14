import ProspectingQueuePreview from './ProspectingQueuePreview';
import { DEFAULT_PROSPECTING_SCHEDULE, parseProspectingSchedule, withinProspectingSchedule } from "../lib/prospectingSchedule";
import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Download, ExternalLink, Loader2, MessageCircle, Send, Square, X } from 'lucide-react';
import { RadarLead } from '../types';
import { createPositioningPdf, positioningFromLead } from '../lib/positioningPdf';
import {
  ApiError,
  WhatsAppConnection,
  WhatsAppTemplate,
  fillMessage,
  formatWhatsApp,
  getWhatsAppConnection,
  sendWhatsAppTemplate,
  saveWhatsAppDailyLimit,
  saveWhatsAppSchedule,
} from '../lib/radarApi';

interface RadarWhatsAppCampaignProps {
  leads: RadarLead[];
  /** Abordagem compartilhada com o botão de envio de cada empresa. */
  message: string;
  onMessageChange: (message: string) => void;
  onClose: () => void;
}

type VariableSource = 'empresa' | 'cidade' | 'segmento' | 'fixo';
type SendStatus = { state: 'enviando' | 'enviado' | 'simulado' | 'erro'; detail?: string };

const SEND_INTERVAL_MS = 4000;
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const CONFIDENCE_TEXT: Record<string, string> = {
  confirmado: 'confirmado no site',
  provavel: 'provável (celular)',
  incerto: 'não confirmado (fixo)',
};

export default function RadarWhatsAppCampaign({ leads, message, onMessageChange, onClose }: RadarWhatsAppCampaignProps) {
  const [mode, setMode] = useState<'assistido' | 'api' | 'preview'>('assistido');
  const [openedIds, setOpenedIds] = useState<string[]>([]);

  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [connectionError, setConnectionError] = useState('');
  const [loadingConnection, setLoadingConnection] = useState(false);
  const [templateKey, setTemplateKey] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [variableSources, setVariableSources] = useState<VariableSource[]>([]);
  const [fixedTexts, setFixedTexts] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, SendStatus>>({});
  const [running, setRunning] = useState(false);
  const [dailyLimitInput, setDailyLimitInput] = useState('');
  const [savingLimit, setSavingLimit] = useState(false);
  const [limitError, setLimitError] = useState('');
  const [schedule, setSchedule] = useState(DEFAULT_PROSPECTING_SCHEDULE);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const savedSchedule = connection?.schedule ?? DEFAULT_PROSPECTING_SCHEDULE;
  const scheduleDirty = JSON.stringify(parseProspectingSchedule(schedule)) !== JSON.stringify(savedSchedule);
  const [authorizedIds, setAuthorizedIds] = useState<string[]>([]);
  const remaining = Math.max(0, (connection?.dailyLimit ?? 0) - (connection?.dailyUsed ?? 0));
  const pendingAuthorized = leads.filter(lead => authorizedIds.includes(lead.id) && !statuses[lead.id]);
  const stopRequested = useRef(false);

  const supportedTemplates = (connection?.templates || []).filter(
    canSendTemplate,
  );
  const template = supportedTemplates.find((item) => getTemplateKey(item) === templateKey);
  const includePdf = template?.headerFormat === 'DOCUMENT' || Boolean(connection?.simulated);

  useEffect(() => {
    if (mode !== 'api' || connection || connectionError || loadingConnection) return;
    setLoadingConnection(true);
    setConnectionError('');
    getWhatsAppConnection()
      .then((info) => {
        setConnection(info);
        setDailyLimitInput(String(info.dailyLimit));
        setSchedule(info.schedule ?? DEFAULT_PROSPECTING_SCHEDULE);
        const first = info.templates.find((item) => item.headerFormat === 'DOCUMENT')
          || info.templates.find(canSendTemplate);
        if (first) setTemplateKey(getTemplateKey(first));
      })
      .catch((err: ApiError) => setConnectionError(err.message))
      .finally(() => setLoadingConnection(false));
  }, [mode, connection, connectionError, loadingConnection]);

  useEffect(() => {
    const count = template?.variableCount || 0;
    const defaults: VariableSource[] = ['empresa', 'cidade', 'segmento'];
    setVariableSources(Array.from({ length: count }, (_, i) => defaults[i] || 'fixo'));
    setFixedTexts(Array.from({ length: count }, () => ''));
  }, [templateKey, template?.variableCount]);

  useEffect(() => () => { stopRequested.current = true; }, []);

  const openChat = (lead: RadarLead) => {
    const url = `https://wa.me/${lead.whatsapp}?text=${encodeURIComponent(fillMessage(message, lead))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpenedIds((prev) => (prev.includes(lead.id) ? prev : [...prev, lead.id]));
  };

  const downloadPdf = async (lead: RadarLead) => {
    setPdfError('');
    try {
      const { doc, filename } = await createPositioningPdf(positioningFromLead(lead));
      doc.save(filename);
    } catch {
      setPdfError(`Não foi possível gerar o PDF de ${lead.companyName}.`);
    }
  };

  const nextUnopened = leads.find((lead) => !openedIds.includes(lead.id));

  const resolveParams = (lead: RadarLead): string[] =>
    variableSources.map((source, i) => {
      if (source === 'empresa') return lead.companyName;
      if (source === 'cidade') return lead.city;
      if (source === 'segmento') return lead.segment.toLowerCase();
      return fixedTexts[i] || '';
    });

  const saveDailyLimit = async () => {
    setSavingLimit(true);
    setLimitError('');
    try {
      const settings = await saveWhatsAppDailyLimit(Number(dailyLimitInput));
      setConnection(previous => previous && { ...previous, ...settings });
      setDailyLimitInput(String(settings.dailyLimit));
    } catch (err) {
      setLimitError((err as Error).message);
    } finally {
      setSavingLimit(false);
    }
  };

  const saveSchedule = async () => {
    const valid = parseProspectingSchedule(schedule);
    if (!valid) return;
    setSavingSchedule(true);
    setScheduleError('');
    try {
      const result = await saveWhatsAppSchedule(valid);
      setConnection(previous => previous && { ...previous, ...result });
      setSchedule(result.schedule);
    } catch (err) {
      setScheduleError((err as Error).message);
    } finally {
      setSavingSchedule(false);
    }
  };

  const startApiSend = async () => {
    // Na conexão de demonstração não há modelos; o servidor apenas simula o envio.
    const chosen: WhatsAppTemplate | undefined =
      template || (connection?.simulated ? { name: 'demonstracao', language: 'pt_BR', category: '', body: '', variableCount: 0 } : undefined);
    if (!chosen || running || savingLimit || !remaining || dailyLimitInput !== String(connection?.dailyLimit)) return;
    if (savingSchedule || scheduleDirty) return;
    setScheduleError('');
    if (!withinProspectingSchedule(savedSchedule)) {
      setScheduleError('Fora da janela configurada para envio. Confira os dias e horários.');
      return;
    }
    stopRequested.current = false;
    setRunning(true);
    const pending = pendingAuthorized.slice(0, remaining);

    for (let i = 0; i < pending.length; i++) {
      if (stopRequested.current) break;
      const lead = pending[i];
      setStatuses((prev) => ({ ...prev, [lead.id]: { state: 'enviando' } }));
      try {
        const positioning = includePdf ? positioningFromLead(lead) : undefined;
        const result = await sendWhatsAppTemplate(lead.whatsapp, chosen, resolveParams(lead), positioning, lead.companyName, authorizedIds.includes(lead.id));
        setStatuses((prev) => ({
          ...prev,
          [lead.id]: result.success
            ? { state: result.simulated ? 'simulado' : 'enviado', detail: result.crmWarning }
            : { state: 'erro', detail: result.error },
        }));
      } catch (err) {
        setStatuses((prev) => ({ ...prev, [lead.id]: { state: 'erro', detail: (err as Error).message } }));
        if (err instanceof ApiError && ['outside_schedule', 'daily_limit'].includes(err.code)) {
          setStatuses(prev => {
            const next = { ...prev };
            delete next[lead.id];
            return next;
          });
          if (err.code === 'outside_schedule') setScheduleError(err.message);
          break;
        }
      }
      if (i < pending.length - 1 && !stopRequested.current) {
        await new Promise((resolve) => setTimeout(resolve, SEND_INTERVAL_MS));
      }
    }
    try {
      const info = await getWhatsAppConnection();
      setConnection(info);
    } catch (err) {
      setLimitError((err as Error).message);
    } finally {
      setRunning(false);
    }
  };

  const sentCount = (Object.values(statuses) as SendStatus[]).filter((s) => s.state === 'enviado' || s.state === 'simulado').length;
  const missingFixedText = variableSources.some((source, i) => source === 'fixo' && !fixedTexts[i]?.trim());

  return (
    <div className="bg-[#121214]/60 border border-emerald-900/40 rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-white text-sm font-bold flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            Envio por WhatsApp para {leads.length} {leads.length === 1 ? 'empresa' : 'empresas'}
          </h4>
          <p className="text-[11px] text-gray-400 mt-1">
            Entram aqui as empresas selecionadas que têm um número de WhatsApp utilizável.
          </p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white" aria-label="Fechar envio por WhatsApp">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="inline-flex flex-wrap bg-gray-950 border border-gray-800 rounded-xl p-1 text-xs font-semibold">
        <button
          onClick={() => setMode('assistido')}
          disabled={running}
          className={`px-3 py-1.5 rounded-lg transition-all ${mode === 'assistido' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
        >
          Envio assistido (seu WhatsApp)
        </button>
        <button
          onClick={() => setMode('api')}
          disabled={running}
          className={`px-3 py-1.5 rounded-lg transition-all ${mode === 'api' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
        >
          Envio automático (API oficial)
        </button>
        <button type="button" onClick={() => setMode('preview')} disabled={running}
          className={`px-3 py-1.5 rounded-lg ${mode === 'preview' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
          Fila simulada
        </button>
      </div>

      {mode === 'preview' && <ProspectingQueuePreview leads={leads} message={message} />}

      {mode === 'assistido' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-mono font-bold text-gray-400">
              Abordagem (variáveis: {'{empresa}'}, {'{cidade}'}, {'{segmento}'}, {'{diagnostico}'}, {'{posicao}'}, {'{nota}'})
            </label>
            <textarea
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              rows={6}
              className="w-full bg-gray-950 text-white border border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#E2B755]"
            />
            {leads[0] && (
              <p className="text-[11px] text-gray-500">
                Prévia: <span className="text-gray-300">{fillMessage(message, leads[0])}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => nextUnopened && openChat(nextUnopened)}
              disabled={!nextUnopened || !message.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-40 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {nextUnopened ? `Abrir próxima conversa (${openedIds.length + 1} de ${leads.length})` : 'Todas as conversas foram abertas'}
            </button>
            <span className="text-[11px] text-gray-500">
              O WhatsApp abre com a mensagem pronta. Baixe o PDF da empresa abaixo para anexá-lo na conversa.
            </span>
          </div>
        </div>
      )}

      {mode === 'api' && (
        <div className="space-y-4">
          {loadingConnection && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Conferindo a conexão do WhatsApp...
            </div>
          )}
          {connectionError && (
            <Notice tone="error">{connectionError}{' '}
              <button type="button" className="underline" onClick={() => setConnectionError('')}>Tentar novamente</button>
            </Notice>
          )}

          {connection && !connection.connected && (
            <Notice tone="warn">
              Nenhum número está conectado nesta conta. Conecte o WhatsApp da Atlas em Automações, na aba WhatsApp Meta, e volte aqui.
            </Notice>
          )}

          {connection?.connected && connection.simulated && (
            <Notice tone="warn">
              A conexão atual é de demonstração: os envios abaixo serão apenas simulados e nenhuma mensagem sai de verdade.
              Para enviar, conecte o número real pelo login da Meta em Automações.
            </Notice>
          )}

          {connection && (
            <div className="space-y-2">
              <label htmlFor="campaign-daily-limit" className="block text-xs text-gray-300">Máximo de leads por dia</label>
              <div className="flex flex-wrap gap-2">
                <input id="campaign-daily-limit" type="number" min="1" step="1" value={dailyLimitInput}
                  onChange={event => setDailyLimitInput(event.target.value)} disabled={running || savingLimit}
                  className="w-28 rounded-lg border border-gray-800 bg-gray-950 p-2 text-sm text-white" />
                <button type="button" onClick={() => void saveDailyLimit()}
                  disabled={running || savingLimit || !Number.isSafeInteger(Number(dailyLimitInput)) || Number(dailyLimitInput) < 1 || Number(dailyLimitInput) === connection.dailyLimit}
                  className="rounded-lg bg-gray-800 px-3 py-2 text-xs text-white disabled:opacity-40">Salvar limite</button>
              </div>
              <p role="status" className="text-xs text-gray-400">{remaining} de {connection.dailyLimit} disponíveis hoje. O dia vira à meia-noite no horário de Brasília.</p>
              {limitError && <Notice tone="error">{limitError}</Notice>}
            </div>
          )}

          {connection && (
            <fieldset disabled={running || savingSchedule} className="space-y-2 rounded-lg border border-gray-800 p-3 text-xs text-gray-300">
              <legend className="px-1 font-semibold">Janela de envio</legend>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={schedule.enabled}
                  onChange={event => setSchedule({ ...schedule, enabled: event.target.checked })} />
                Restringir os envios a dias e horários
              </label>
              {schedule.enabled && (
                <>
                  <div className="flex flex-wrap gap-3" aria-label="Dias permitidos">
                    {WEEKDAYS.map((name, day) => (
                      <label key={name} className="flex items-center gap-1">
                        <input type="checkbox" checked={schedule.days.includes(day)} onChange={event =>
                          setSchedule({ ...schedule, days: event.target.checked
                            ? [...schedule.days, day]
                            : schedule.days.filter(value => value !== day) })} />
                        {name}
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['start', 'end'] as const).map(key => (
                      <label key={key} className="flex items-center gap-1.5">
                        {key === 'start' ? 'Das' : 'Até'}
                        <input type="time" value={schedule[key]}
                          className="rounded border border-gray-800 bg-gray-950 p-1 text-white"
                          onChange={event => setSchedule({ ...schedule, [key]: event.target.value })} />
                      </label>
                    ))}
                  </div>
                </>
              )}
              <p className="text-gray-400">Horário de Brasília. A janela limita quando você pode iniciar os envios pela API.</p>
              {schedule.enabled && !parseProspectingSchedule(schedule) &&
                <p className="text-amber-300">Escolha pelo menos um dia e um horário final posterior ao inicial.</p>}
              <button type="button" disabled={!scheduleDirty || !parseProspectingSchedule(schedule)}
                className="rounded bg-gray-800 px-3 py-2 disabled:opacity-40"
                onClick={() => void saveSchedule()}>Salvar janela</button>
              {scheduleError && <Notice tone="error">{scheduleError}</Notice>}
            </fieldset>
          )}

          {connection?.connected && (
            <>
              <p className="text-[11px] text-gray-400">
                Número conectado: <strong className="text-gray-200">{connection.verifiedName || 'WhatsApp Business'}</strong>{' '}
                {connection.displayPhoneNumber}
              </p>

              {connection.templatesError && <Notice tone="error">{connection.templatesError}</Notice>}

              {!connection.simulated && !connection.templatesError && connection.templates.length === 0 && (
                <Notice tone="warn">
                  Não há modelo de mensagem aprovado. A Meta só permite iniciar conversa com um modelo aprovado:
                  crie um no Gerenciador do WhatsApp, espere a aprovação e recarregue esta tela.
                </Notice>
              )}

              {!connection.simulated && connection.templates.length > 0 && !supportedTemplates.length && (
                <Notice tone="warn">Escolha no Gerenciador do WhatsApp um modelo aprovado com cabeçalho do tipo Documento para enviar o PDF.</Notice>
              )}

              {supportedTemplates.length > 0 && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-mono font-bold text-gray-400">Modelo aprovado</label>
                    <select
                      value={templateKey}
                      onChange={(e) => setTemplateKey(e.target.value)}
                      disabled={running}
                      className="w-full sm:w-96 bg-gray-950 text-white border border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#E2B755]"
                    >
                      {supportedTemplates.map((tpl) => (
                        <option key={getTemplateKey(tpl)} value={getTemplateKey(tpl)}>
                          {tpl.name} ({tpl.language}){tpl.headerFormat === 'DOCUMENT' ? ' · Com PDF' : ''}
                        </option>
                      ))}
                    </select>
                    {template?.body && <p className="text-[11px] text-gray-500 whitespace-pre-line">{template.body}</p>}
                    {template && <p className="text-[11px] text-gray-400">
                      {includePdf ? 'Cada empresa recebe seu próprio PDF de posicionamento.' : 'Envio somente de texto. Para anexar o PDF, selecione um modelo aprovado com cabeçalho Documento.'}
                    </p>}
                  </div>

                  {variableSources.map((source, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
                      <span className="font-mono text-gray-500">{`{{${i + 1}}}`}</span>
                      <select
                        value={source}
                        disabled={running}
                        onChange={(e) =>
                          setVariableSources((prev) => prev.map((v, idx) => (idx === i ? (e.target.value as VariableSource) : v)))
                        }
                        className="bg-gray-950 text-white border border-gray-800 rounded-lg px-3 py-2 text-xs"
                      >
                        <option value="empresa">Nome da empresa</option>
                        <option value="cidade">Cidade</option>
                        <option value="segmento">Segmento</option>
                        <option value="fixo">Texto fixo</option>
                      </select>
                      {source === 'fixo' && (
                        <input
                          value={fixedTexts[i] || ''}
                          disabled={running}
                          onChange={(e) => setFixedTexts((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
                          placeholder="Texto que entra nesta posição"
                          className="flex-1 min-w-48 bg-gray-950 text-white border border-gray-800 rounded-lg px-3 py-2 text-xs"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {(supportedTemplates.length > 0 || connection.simulated) && (
                <div className="flex flex-wrap items-center gap-3">
                  {!running ? (
                    <button
                      onClick={startApiSend}
                      disabled={(!template && !connection.simulated) || missingFixedText || !pendingAuthorized.length || !remaining || savingLimit || savingSchedule || scheduleDirty || Number(dailyLimitInput) !== connection.dailyLimit}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-40 flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {`Enviar para ${Math.min(pendingAuthorized.length, remaining)}`}
                    </button>
                  ) : (
                    <button
                      onClick={() => { stopRequested.current = true; }}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-red-500/90 hover:bg-red-500 text-white flex items-center gap-2"
                    >
                      <Square className="w-3.5 h-3.5" /> Parar
                    </button>
                  )}
                  <span className="text-[11px] text-gray-500">
                    {sentCount} de {leads.length} enviados. Um envio a cada {SEND_INTERVAL_MS / 1000} segundos.
                  </span>
                </div>
              )}
            </>
          )}

          <Notice tone="info">
            A Meta exige que o destinatário tenha aceitado receber mensagens da empresa. Envio para quem nunca falou
            com você costuma gerar denúncias, e denúncias derrubam a qualidade do número e podem bloqueá-lo.
          </Notice>
        </div>
      )}

      {pdfError && <Notice tone="error">{pdfError}</Notice>}
      {mode !== 'preview' && <div className="border-t border-gray-900 pt-3 space-y-1.5 max-h-72 overflow-y-auto">
        {leads.map((lead) => {
          const status = statuses[lead.id];
          const opened = openedIds.includes(lead.id);
          return (
            <div key={lead.id} className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400 py-1">
              <div className="min-w-0">
                <strong className="text-gray-200">{lead.companyName}</strong>{' '}
                <span className="font-mono">{formatWhatsApp(lead.whatsapp)}</span>{' '}
                <span className="text-gray-600">({CONFIDENCE_TEXT[lead.whatsappConfidence] || 'sem verificação'})</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void downloadPdf(lead)}
                  aria-label={`Baixar PDF de ${lead.companyName}`}
                  className="px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 bg-gray-900 text-gray-200 hover:text-white border border-gray-800"
                >
                  <Download className="w-3 h-3" /> PDF
                </button>
                {mode === 'assistido' ? (
                  <button
                    onClick={() => openChat(lead)}
                    disabled={!message.trim()}
                    className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 ${
                      opened ? 'bg-gray-900 text-emerald-400 border border-gray-800' : 'bg-white text-black hover:bg-gray-200'
                    }`}
                  >
                    {opened ? <Check className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                    {opened ? 'Aberta' : 'Abrir conversa'}
                  </button>
                ) : (
                  !status ? (
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" disabled={running} checked={authorizedIds.includes(lead.id)}
                        onChange={event => {
                          const checked = event.target.checked;
                          setAuthorizedIds(previous => checked ? [...previous, lead.id] : previous.filter(id => id !== lead.id));
                        }} />
                      <span>Aceitou receber mensagens</span>
                    </label>
                  ) : <span
                    className={
                      status?.state === 'erro'
                        ? 'text-red-400'
                        : status?.state === 'enviado'
                          ? 'text-emerald-400'
                          : status?.state === 'simulado'
                            ? 'text-amber-400'
                            : 'text-gray-600'
                    }
                  >
                    {status?.state === 'enviando' && 'Enviando...'}
                    {status?.state === 'enviado' && (status.detail || 'Enviado')}
                    {status?.state === 'simulado' && 'Simulado (não enviado)'}
                    {status?.state === 'erro' && `Falhou: ${status.detail || 'erro desconhecido'}`}
                    {!status && 'Aguardando'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  );
}

function canSendTemplate(template: WhatsAppTemplate): boolean {
  return !template.headerFormat || template.headerFormat === 'TEXT' || template.headerFormat === 'DOCUMENT';
}

function getTemplateKey(template: WhatsAppTemplate): string {
  return `${template.name}:${template.language}`;
}

function Notice({ tone, children }: { tone: 'info' | 'warn' | 'error'; children: React.ReactNode }) {
  const styles = {
    info: 'border-gray-800 text-gray-400',
    warn: 'border-amber-900/50 text-amber-300',
    error: 'border-red-900/50 text-red-300',
  }[tone];
  return (
    <div className={`flex items-start gap-2 border rounded-xl p-3 text-[11px] leading-relaxed bg-gray-950/60 ${styles}`}>
      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}
