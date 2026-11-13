import { auth } from './firebase';
import type { AtlasScoreReport, Lead, LeadStatus, LocalSearchPosition, RadarLead } from '../types';
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
  | { action: 'delete'; id: string };

export function getCrmLeads(signal?: AbortSignal): Promise<{ leads: Lead[] }> {
  const timeout = AbortSignal.timeout(15000);
  return request('/api/crm', { method: 'GET', signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
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

export interface WhatsAppSendResult {
  success: boolean;
  simulated?: boolean;
  messageId?: string;
  error?: string;
  crmWarning?: string;
}

export function sendWhatsAppTemplate(
  to: string, template: WhatsAppTemplate, bodyParams: string[], positioning?: PositioningSnapshot, companyName?: string,
): Promise<WhatsAppSendResult> {
  return request('/api/whatsapp-send', {
    method: 'POST',
    body: JSON.stringify({ to, templateName: template.name, languageCode: template.language, bodyParams, positioning, companyName }),
  });
}

/** Troca {empresa}, {cidade} e {segmento} pelos dados da empresa. */
export function fillMessage(message: string, lead: RadarLead): string {
  return message
    .replace(/\{empresa\}/gi, lead.companyName)
    .replace(/\{cidade\}/gi, lead.city)
    .replace(/\{segmento\}/gi, lead.segment.toLowerCase());
}

export function formatWhatsApp(digits: string): string {
  const local = digits.startsWith('55') ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return digits;
}
