import { parseProspectingSchedule, type ProspectingSchedule } from './prospectingSchedule.js';

const MINUTE = 60_000;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const clock = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const asMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

export interface ProspectingQueueSettings {
  dailyLimit: number;
  dailyUsed: number;
  schedule: ProspectingSchedule;
}

export function planProspectingSlots(count: number, settings: ProspectingQueueSettings, now = new Date()): Date[] {
  if (!Number.isSafeInteger(count) || count < 1 || !Number.isSafeInteger(settings.dailyLimit) ||
      settings.dailyLimit < 1 || !Number.isFinite(now.getTime()) || !parseProspectingSchedule(settings.schedule)) return [];
  const slots: Date[] = [];
  const { schedule, dailyLimit } = settings;
  const start = schedule.enabled ? asMinutes(schedule.start) : 0;
  const end = schedule.enabled ? asMinutes(schedule.end) : 1440;
  let cursor = Math.ceil(now.getTime() / MINUTE) * MINUTE;

  function localParts(at: number) {
    const p = Object.fromEntries(clock.formatToParts(at).map(part => [part.type, part.value]));
    return { day: `${p.year}-${p.month}-${p.day}`, weekday: DAYS.indexOf(p.weekday), minute: Number(p.hour) * 60 + Number(p.minute) };
  }
  let day = localParts(now.getTime()).day;
  let used = settings.dailyUsed;

  while (slots.length < count) {
    const local = localParts(cursor);
    if (local.day !== day) {
      day = local.day;
      used = 0;
    }
    if (used >= dailyLimit || local.minute >= end || (schedule.enabled && !schedule.days.includes(local.weekday))) {
      cursor += (1440 - local.minute) * MINUTE;
      continue;
    }
    if (local.minute < start) {
      cursor += (start - local.minute) * MINUTE;
      continue;
    }
    slots.push(new Date(cursor));
    used++;
    cursor += MINUTE;
  }
  return slots;
}

export function uniqueProspectingCandidates<T extends { whatsapp: string }>(leads: T[]): T[] {
  const numbers = new Set<string>();
  return leads.filter(lead => {
    const digits = lead.whatsapp.replace(/\D/g, '');
    if (!/^\d{12,15}$/.test(digits) || numbers.has(digits)) return false;
    numbers.add(digits);
    return true;
  });
}

export interface ProspectingDraftRow {
  company: string;
  message: string;
  at: string;
}

export interface ProspectingDraft {
  template: string;
  rows: ProspectingDraftRow[];
  savedAt: string;
}

export interface ProspectingPreviewData extends ProspectingQueueSettings {
  draft: ProspectingDraft | null;
}

export function parseProspectingDraft(input: unknown): Omit<ProspectingDraft, 'savedAt'> | null {
  if (!input || typeof input !== 'object') return null;
  const { template, rows } = input as Partial<ProspectingDraft>;
  if (typeof template !== 'string' || !template.trim() || template.length > 4000 ||
      !Array.isArray(rows) || !rows.length || rows.length > 60) return null;
  const cleanRows: ProspectingDraftRow[] = [];
  for (const row of rows) {
    if (!row || typeof row.company !== 'string' || !row.company.trim() || row.company.length > 300 ||
        typeof row.message !== 'string' || !row.message.trim() || row.message.length > 6500 ||
        typeof row.at !== 'string' || row.at.length !== 24 || !Number.isFinite(Date.parse(row.at))) return null;
    cleanRows.push({ company: row.company, message: row.message, at: new Date(row.at).toISOString() });
  }
  if (new TextEncoder().encode(JSON.stringify(cleanRows)).length > 700_000) return null;
  return { template, rows: cleanRows };
}
