import type { ProspectingExecutionReport } from './prospectingExecution';
import type { PreparedRadarBatch, RadarReviewDecision, RecurringRadarFilters, RecurringRadarStatus } from './radarRecurring';
import type { ProspectingDraft, ProspectingPreviewData } from './prospectingQueue';
import type { AiSimulation, AiTraining } from './aiTraining';
import type { ProspectingSchedule } from "./prospectingSchedule";
import { auth } from './firebase';
import type { AtlasScoreReport, Lead, LeadStatus, LocalSearchPosition, RadarLead } from '../types';
import type { SiteContact } from './contact';
import type { PositioningSnapshot } from './positioningPdf';

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const user = auth.currentUser;
  if (!user?.email || user.isAnonymous) {
    throw new ApiError('unauthenticated', 'Entre na sua conta para continuar.', 401);
  }
  headers.Authorization = `Bearer ${await user.getIdToken()}`;
  return headers;
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: await authHeaders() });
  const raw = await response.text();
  let data: any = {};
  try {
    data = JSON.parse(raw);
  } catch {
    // Resposta que não é JSON: o servidor caiu antes de responder. Mostra o trecho para diagnóstico.
    const snippet = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
    throw new ApiError('server_crash', `Erro ${response.status} no servidor${snippet ? `: ${snippet}` : '.'}`, response.status);
  }
  if (!response.ok && data?.success === undefined) {
    throw new ApiError(data?.code || 'error', data?.error || `Erro ${response.status} ao falar com o servidor.`, response.status);
  }
  return data as T;
}

export interface RadarSearchPayload {
  segment: string;
  city: string;
  state: string;
  countryCode: string;
  radius: string;
  quantity: string;
  siteFilter: string;
  minRating: string;
  minReviews: string;
  keyword: string;
}

export interface RadarSearchResponse {
  leads: RadarLead[];
  scanned: number;
  enrichedSites: number;
}

export function searchRadar(payload: RadarSearchPayload): Promise<RadarSearchResponse> {
  return request('/api/radar', { method: 'POST', body: JSON.stringify(payload) });
}

export function getAtlasScore(payload: {
  companyName: string;
  city: string;
  segment: string;
  website?: string;
  googleMapsUrl?: string;
  radiusKm?: number;
}): Promise<AtlasScoreReport> {
  return request('/api/atlas-score', { method: 'POST', body: JSON.stringify(payload) });
}

type CrmMutation =
  | { action: 'create'; lead: Omit<Lead, 'id' | 'createdAt'> }
  | { action: 'edit'; id: string; lead: Lead }
  | { action: 'stage'; id: string; status: LeadStatus }
  | { action: 'position'; id: string; localSearch: LocalSearchPosition }
  | { action: 'ai-handoff'; id: string; paused: boolean }
  | { action: 'ai-memory'; id: string; memory: string; previousMemory: string }
  | { action: 'delete'; id: string };

export function getCrmLeads(signal?: AbortSignal): Promise<{ leads: Lead[]; canAccessSiteContacts: boolean }> {
  const timeout = AbortSignal.timeout(15000);
  return request('/api/crm', { method: 'GET', signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
}

export function getSiteContacts(signal: AbortSignal): Promise<{ contacts: SiteContact[] }> {
  return request('/api/crm?view=site-contacts', { method: 'GET', signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) });
}

export function updateCrm(mutation: CrmMutation): Promise<{ lead?: Lead }> {
  return request('/api/crm', { method: 'POST', body: JSON.stringify(mutation) });
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  category: string;
  body: string;
  variableCount: number;
  headerFormat?: string;
}

export interface WhatsAppConnection {
  schedule: ProspectingSchedule;
  dailyLimit: number;
  dailyUsed: number;
  connected: boolean;
  simulated: boolean;
  displayPhoneNumber: string;
  verifiedName: string;
  templates: WhatsAppTemplate[];
  templatesError?: string;
}

export function getWhatsAppConnection(): Promise<WhatsAppConnection> {
  return request('/api/whatsapp-send', { method: 'GET' });
}

export function saveWhatsAppDailyLimit(dailyLimit: number): Promise<Pick<WhatsAppConnection, 'dailyLimit' | 'dailyUsed'>> {
  return request('/api/whatsapp-send', {
    method: 'POST',
    body: JSON.stringify({ action: 'saveDailyLimit', dailyLimit }),
  });
}

export function saveWhatsAppSchedule(schedule: ProspectingSchedule): Promise<{ schedule: ProspectingSchedule }> {
  return request('/api/whatsapp-send', {
    method: 'POST',
    body: JSON.stringify({ action: 'saveSchedule', schedule }),
  });
}

export interface WhatsAppSendResult {
  success: boolean;
  simulated?: boolean;
  messageId?: string;
  error?: string;
  crmWarning?: string;
}

export function sendWhatsAppTemplate(
  to: string, template: WhatsAppTemplate, bodyParams: string[], positioning: PositioningSnapshot | undefined, companyName: string, contactAuthorized: boolean,
): Promise<WhatsAppSendResult> {
  return request('/api/whatsapp-send', {
    method: 'POST',
    body: JSON.stringify({ to, templateName: template.name, languageCode: template.language, bodyParams, positioning, companyName, contactAuthorized }),
  });
}

/** Troca {empresa}, {cidade} e {segmento} pelos dados da empresa. */
/** Abordagem padrão: o problema observado, a solução da Atlas e um pedido curto. */
export const DEFAULT_APPROACH =
  'Olá! Sou da Atlas Digital. Analisei a {empresa} no Google: {diagnostico}. ' +
  'A Atlas aumenta as vendas de empresas como a sua pela internet: site que gera orçamento, perfil do Google otimizado e atendimento pelo WhatsApp. ' +
  'Preparei o diagnóstico da {empresa} em PDF, com a nota e o que corrigir. Posso te mostrar em 5 minutos?';

export { approachDiagnosis, fillMessage } from './prospectingApproach';

export function formatWhatsApp(digits: string): string {
  // A formatação brasileira só é válida quando o número começa pelo DDI 55.
  if (!digits.startsWith('55')) return digits ? '+' + digits : '';
  const local = digits.slice(2);
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return '+' + digits;
}

export function getAiTraining(signal?: AbortSignal): Promise<{ training: AiTraining; autoSend: boolean }> {
  return request('/api/ai-training', { method: 'GET', signal });
}

export function saveAiTraining(training: AiTraining): Promise<{ training: AiTraining }> {
  return request('/api/ai-training', { method: 'POST', body: JSON.stringify({ action: 'save', training }) });
}

export function simulateAiTraining(message: string, memory: string): Promise<AiSimulation> {
  return request('/api/ai-training', { method: 'POST', body: JSON.stringify({ action: 'simulate', message, memory }) });
}

export function getProspectingQueueSettings(signal: AbortSignal): Promise<ProspectingPreviewData> {
  return request('/api/whatsapp-send?view=prospecting-settings', { method: 'GET', signal });
}

export function saveProspectingDraft(
  draft: Omit<ProspectingDraft, 'savedAt'>, previous: string | null,
): Promise<{ draft: ProspectingDraft }> {
  return request('/api/whatsapp-send', {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({ action: 'saveDraft', draft, previous }),
  });
}

export function getRecurringRadar(signal?: AbortSignal): Promise<RecurringRadarStatus> {
  return request('/api/radar?view=recurring', { method: 'GET', signal });
}

export function saveRecurringRadar(filters: RecurringRadarFilters, enabled: boolean): Promise<{ saved: boolean }> {
  return request('/api/radar?view=recurring', { method: 'POST', body: JSON.stringify({ action: 'save', filters, enabled }) });
}

export function runRecurringRadar(): Promise<{ added: number; superseded?: boolean }> {
  return request('/api/radar?view=recurring', { method: 'POST', body: JSON.stringify({ action: 'run' }) });
}

export function setAiAutoSend(enabled: boolean): Promise<{ autoSend: boolean }> {
  return request('/api/ai-training', { method: 'POST', body: JSON.stringify({ action: 'setAutoSend', enabled }) });
}

export function reviewRadarContact(key: string, decision: RadarReviewDecision): Promise<{ saved: boolean }> {
  return request('/api/radar?view=recurring', { method: 'POST', body: JSON.stringify({ action: 'review', key, decision }) });
}

export function prepareRadarBatch(keys: string[], template: string, previous: string | null): Promise<{ batch: PreparedRadarBatch }> {
  return request('/api/radar?view=recurring', { method: 'POST', body: JSON.stringify({ action: 'prepareBatch', keys, template, previous }) });
}

export function simulateRadarBatchExecution(preparedAt: string): Promise<{ report: ProspectingExecutionReport }> {
  return request('/api/radar?view=recurring', { method: 'POST', body: JSON.stringify({ action: 'simulateExecution', preparedAt }) });
}

export function runRadarBatchRehearsal(preparedAt: string): Promise<{ report: ProspectingExecutionReport; processed: number }> {
  return request('/api/radar?view=recurring', { method: 'POST', body: JSON.stringify({ action: 'runRehearsal', preparedAt }) });
}
