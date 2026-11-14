export interface ProspectingSchedule {
  enabled: boolean;
  days: number[];
  start: string;
  end: string;
}

export const DEFAULT_PROSPECTING_SCHEDULE: ProspectingSchedule = {
  enabled: false,
  days: [1, 2, 3, 4, 5],
  start: '09:00',
  end: '17:00',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const clock = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Sao_Paulo',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function parseProspectingSchedule(input: unknown): ProspectingSchedule | null {
  if (!input || typeof input !== 'object') return null;
  const { enabled, days, start, end } = input as Partial<ProspectingSchedule>;
  if (typeof enabled !== 'boolean' || !Array.isArray(days) || days.length > 7 ||
      days.some(day => !Number.isInteger(day) || day < 0 || day > 6) ||
      (enabled && !days.length) || typeof start !== 'string' || typeof end !== 'string' ||
      !TIME.test(start) || !TIME.test(end) || start >= end) return null;
  return { enabled, days: [...new Set(days)].sort(), start, end };
}

export function withinProspectingSchedule(schedule: ProspectingSchedule, now = new Date()): boolean {
  if (!schedule.enabled) return true;
  const parts = Object.fromEntries(clock.formatToParts(now).map(part => [part.type, part.value]));
  const time = `${parts.hour}:${parts.minute}`;
  return schedule.days.includes(DAYS.indexOf(parts.weekday)) && time >= schedule.start && time < schedule.end;
}
