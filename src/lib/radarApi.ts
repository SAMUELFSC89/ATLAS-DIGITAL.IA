import { auth } from './firebase';
import { RadarLead } from '../types';

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

/** Cabeçalhos das chamadas ao backend, com o token de login do Firebase. */
export async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const user = auth.currentUser;
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
  return headers;
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: await authHeaders() });
  const data = await response.json().catch(() => ({}));
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

export interface WhatsAppTemplate {
  name: string;
  language: string;
  category: string;
  body: string;
  variableCount: number;
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
}

export function sendWhatsAppTemplate(to: string, template: WhatsAppTemplate, bodyParams: string[]): Promise<WhatsAppSendResult> {
  return request('/api/whatsapp-send', {
    method: 'POST',
    body: JSON.stringify({ to, templateName: template.name, languageCode: template.language, bodyParams }),
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
