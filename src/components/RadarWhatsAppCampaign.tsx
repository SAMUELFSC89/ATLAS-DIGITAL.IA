import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, ExternalLink, Loader2, MessageCircle, Send, Square, X } from 'lucide-react';
import { RadarLead } from '../types';
import {
  ApiError,
  WhatsAppConnection,
  WhatsAppTemplate,
  fillMessage,
  formatWhatsApp,
  getWhatsAppConnection,
  sendWhatsAppTemplate,
} from '../lib/radarApi';

interface RadarWhatsAppCampaignProps {
  leads: RadarLead[];
  onClose: () => void;
}

type VariableSource = 'empresa' | 'cidade' | 'segmento' | 'fixo';
type SendStatus = { state: 'enviando' | 'enviado' | 'simulado' | 'erro'; detail?: string };

const DEFAULT_MESSAGE =
  'Olá! Falo com o responsável pela {empresa}? Sou da Atlas Digital. Vi o perfil de vocês no Google e tenho uma sugestão rápida para trazer mais pedidos de orçamento aí em {cidade}. Posso te mostrar?';

const SEND_INTERVAL_MS = 4000;

const CONFIDENCE_TEXT: Record<string, string> = {
  confirmado: 'confirmado no site',
  provavel: 'provável (celular)',
  incerto: 'não confirmado (fixo)',
};

export default function RadarWhatsAppCampaign({ leads, onClose }: RadarWhatsAppCampaignProps) {
  const [mode, setMode] = useState<'assistido' | 'api'>('assistido');
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [openedIds, setOpenedIds] = useState<string[]>([]);

  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [connectionError, setConnectionError] = useState('');
  const [loadingConnection, setLoadingConnection] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [variableSources, setVariableSources] = useState<VariableSource[]>([]);
  const [fixedTexts, setFixedTexts] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, SendStatus>>({});
  const [running, setRunning] = useState(false);
  const stopRequested = useRef(false);

  const template: WhatsAppTemplate | undefined = connection?.templates.find((tpl) => tpl.name === templateName);

  useEffect(() => {
    if (mode !== 'api' || connection || loadingConnection) return;
    setLoadingConnection(true);
    setConnectionError('');
    getWhatsAppConnection()
      .then((info) => {
        setConnection(info);
        if (info.templates[0]) setTemplateName(info.templates[0].name);
      })
      .catch((err: ApiError) => setConnectionError(err.message))
      .finally(() => setLoadingConnection(false));
  }, [mode, connection, loadingConnection]);

  useEffect(() => {
    const count = template?.variableCount || 0;
    const defaults: VariableSource[] = ['empresa', 'cidade', 'segmento'];
    setVariableSources(Array.from({ length: count }, (_, i) => defaults[i] || 'fixo'));
    setFixedTexts(Array.from({ length: count }, () => ''));
  }, [templateName, template?.variableCount]);

  useEffect(() => () => { stopRequested.current = true; }, []);

  const openChat = (lead: RadarLead) => {
    const url = `https://wa.me/${lead.whatsapp}?text=${encodeURIComponent(fillMessage(message, lead))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpenedIds((prev) => (prev.includes(lead.id) ? prev : [...prev, lead.id]));
  };

  const nextUnopened = leads.find((lead) => !openedIds.includes(lead.id));

  const resolveParams = (lead: RadarLead): string[] =>
    variableSources.map((source, i) => {
      if (source === 'empresa') return lead.companyName;
      if (source === 'cidade') return lead.city;
      if (source === 'segmento') return lead.segment.toLowerCase();
      return fixedTexts[i] || '';
    });

  const startApiSend = async () => {
    // Na conexão de demonstração não há modelos; o servidor apenas simula o envio.
    const chosen: WhatsAppTemplate | undefined =
      template || (connection?.simulated ? { name: 'demonstracao', language: 'pt_BR', category: '', body: '', variableCount: 0 } : undefined);
    if (!chosen) return;
    stopRequested.current = false;
    setRunning(true);
    const pending = leads.filter((lead) => {
      const state = statuses[lead.id]?.state;
      return state !== 'enviado' && state !== 'simulado';
    });

    for (let i = 0; i < pending.length; i++) {
      if (stopRequested.current) break;
      const lead = pending[i];
      setStatuses((prev) => ({ ...prev, [lead.id]: { state: 'enviando' } }));
      try {
        const result = await sendWhatsAppTemplate(lead.whatsapp, chosen, resolveParams(lead));
        setStatuses((prev) => ({
          ...prev,
          [lead.id]: result.success
            ? { state: result.simulated ? 'simulado' : 'enviado' }
            : { state: 'erro', detail: result.error },
        }));
      } catch (err) {
        setStatuses((prev) => ({ ...prev, [lead.id]: { state: 'erro', detail: (err as Error).message } }));
      }
      if (i < pending.length - 1 && !stopRequested.current) {
        await new Promise((resolve) => setTimeout(resolve, SEND_INTERVAL_MS));
      }
    }
    setRunning(false);
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

      <div className="inline-flex bg-gray-950 border border-gray-800 rounded-xl p-1 text-xs font-semibold">
        <button
          onClick={() => setMode('assistido')}
          className={`px-3 py-1.5 rounded-lg transition-all ${mode === 'assistido' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
        >
          Envio assistido (seu WhatsApp)
        </button>
        <button
          onClick={() => setMode('api')}
          className={`px-3 py-1.5 rounded-lg transition-all ${mode === 'api' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
        >
          Envio automático (API oficial)
        </button>
      </div>

      {mode === 'assistido' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-mono font-bold text-gray-400">
              Mensagem (use {'{empresa}'}, {'{cidade}'} e {'{segmento}'})
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
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
              A conversa abre com a mensagem pronta no WhatsApp em que você estiver logado; você só confirma o envio.
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
          {connectionError && <Notice tone="error">{connectionError}</Notice>}

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

              {connection.templates.length > 0 && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-mono font-bold text-gray-400">Modelo aprovado</label>
                    <select
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      disabled={running}
                      className="w-full sm:w-96 bg-gray-950 text-white border border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#E2B755]"
                    >
                      {connection.templates.map((tpl) => (
                        <option key={`${tpl.name}-${tpl.language}`} value={tpl.name}>
                          {tpl.name} ({tpl.language})
                        </option>
                      ))}
                    </select>
                    {template?.body && <p className="text-[11px] text-gray-500 whitespace-pre-line">{template.body}</p>}
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

              {(connection.templates.length > 0 || connection.simulated) && (
                <div className="flex flex-wrap items-center gap-3">
                  {!running ? (
                    <button
                      onClick={startApiSend}
                      disabled={(!template && !connection.simulated) || missingFixedText || sentCount === leads.length}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-40 flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {sentCount > 0 ? 'Continuar envio' : `Enviar para ${leads.length}`}
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

      <div className="border-t border-gray-900 pt-3 space-y-1.5 max-h-72 overflow-y-auto">
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
                <span
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
                  {status?.state === 'enviado' && 'Enviado'}
                  {status?.state === 'simulado' && 'Simulado (não enviado)'}
                  {status?.state === 'erro' && `Falhou: ${status.detail || 'erro desconhecido'}`}
                  {!status && 'Aguardando'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
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
