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

export interface RecurringRadarStatus {
  filters: RecurringRadarFilters | null;
  enabled: boolean;
  cronConfigured: boolean;
  lastRunAt: number | null;
  lastAdded: number | null;
  queue: RadarLead[];
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
