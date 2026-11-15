import type { RadarLead } from '../types.js';

export interface RecurringRadarFilters {
  segment: string;
  city: string;
  state: string;
  radiusKm: number;
  quantity: number;
  siteFilter: 'all' | 'has_site' | 'no_site';
  minRating: number | null;
  minReviews: number | null;
  keyword: string;
}

export const RADAR_CONSENT_SOURCES = {
  form: 'Formulário',
  direct: 'Confirmação direta',
  other: 'Outro canal',
} as const;
export type RadarConsentSource = keyof typeof RADAR_CONSENT_SOURCES;
export type RadarReviewStatus = 'pending' | 'approved' | 'excluded';

export interface RadarReviewItem {
  key: string;
  lead: RadarLead;
  status: RadarReviewStatus;
  reviewedAt?: number;
  consentSource?: RadarConsentSource | null;
}

export type RadarReviewDecision =
  | { status: 'approved'; consentSource: RadarConsentSource }
  | { status: 'excluded' | 'pending' };

export function parseRadarReviewDecision(input: unknown): RadarReviewDecision | null {
  if (!input || typeof input !== 'object') return null;
  const { status, consentSource } = input as { status?: unknown; consentSource?: unknown };
  if (status === 'pending' || status === 'excluded') return { status };
  if (status === 'approved' && typeof consentSource === 'string' && Object.hasOwn(RADAR_CONSENT_SOURCES, consentSource)) {
    return { status, consentSource: consentSource as RadarConsentSource };
  }
  return null;
}

export interface PreparedRadarBatch {
  preparedAt: string;
  rows: Array<{ key: string; company: string; message: string; at: string; status: 'scheduled' | 'cancelled' }>;
}

export interface RecurringRadarStatus {
  filters: RecurringRadarFilters | null;
  enabled: boolean;
  cronConfigured: boolean;
  lastRunAt: number | null;
  lastAdded: number | null;
  queue: RadarReviewItem[];
  batch: PreparedRadarBatch | null;
}

export function parseRecurringRadarFilters(value: unknown): RecurringRadarFilters | null {
  if (!value || typeof value !== 'object') return null;
  const { segment, city, state, radiusKm, quantity, siteFilter, minRating, minReviews, keyword } = value as Partial<RecurringRadarFilters>;
  if (typeof segment !== 'string' || !segment.trim() || segment.length > 100 ||
      typeof city !== 'string' || !city.trim() || city.length > 100 ||
      typeof state !== 'string' || !/^[A-Z]{2}$/.test(state) ||
      typeof keyword !== 'string' || keyword.length > 160 ||
      typeof radiusKm !== 'number' || !Number.isFinite(radiusKm) || radiusKm < 1 || radiusKm > 100 ||
      typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 60 ||
      (siteFilter !== 'all' && siteFilter !== 'has_site' && siteFilter !== 'no_site') ||
      (minRating !== null && (typeof minRating !== 'number' || !Number.isFinite(minRating) || minRating < 0 || minRating > 5)) ||
      (minReviews !== null && (typeof minReviews !== 'number' || !Number.isSafeInteger(minReviews) || minReviews < 0))) return null;
  return { segment: segment.trim(), city: city.trim(), state, radiusKm, quantity, siteFilter, minRating, minReviews, keyword: keyword.trim() };
}

export function nextRadarRun(now: number): number {
  const next = new Date(now);
  next.setUTCHours(12, 0, 0, 0);
  if (next.getTime() <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.getTime();
}
