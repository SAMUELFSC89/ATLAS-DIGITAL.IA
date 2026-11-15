import { withinProspectingSchedule } from './prospectingSchedule.js';
import type { ProspectingQueueSettings } from './prospectingQueue.js';
import type { PreparedRadarBatch } from './radarRecurring.js';

export const EXECUTION_LABELS = {
  ready: 'Apto nesta simulação',
  cancelled: 'Cancelado',
  unapproved: 'Sem aprovação vigente',
  future: 'Aguardando horário previsto',
  outside_window: 'Fora da janela de envio',
  duplicate: 'Número já reservado hoje',
  daily_limit: 'Limite diário atingido',
} as const;

export type ExecutionStatus = keyof typeof EXECUTION_LABELS;
export interface ProspectingExecutionReport {
  checkedAt: string;
  rows: Array<{ key: string; status: ExecutionStatus }>;
}

export function evaluateProspectingExecution(
  rows: PreparedRadarBatch['rows'],
  approvedPhones: ReadonlyMap<string, string>,
  reservedPhones: ReadonlySet<string>,
  settings: ProspectingQueueSettings,
  now: Date,
): ProspectingExecutionReport {
  const reserved = new Set(reservedPhones);
  let remaining = Math.max(0, settings.dailyLimit - settings.dailyUsed);
  const withinWindow = withinProspectingSchedule(settings.schedule, now);
  const report = [...rows].sort((a, b) => a.at.localeCompare(b.at)).map(({ key, at, status }) => {
    const phone = approvedPhones.get(key);
    let outcome: ExecutionStatus;
    if (status === 'cancelled') outcome = 'cancelled';
    else if (!phone) outcome = 'unapproved';
    else if (Date.parse(at) > now.getTime()) outcome = 'future';
    else if (!withinWindow) outcome = 'outside_window';
    else if (reserved.has(phone)) outcome = 'duplicate';
    else if (remaining === 0) outcome = 'daily_limit';
    else {
      outcome = 'ready';
      remaining--;
      reserved.add(phone);
    }
    return { key, status: outcome };
  });
  return { checkedAt: now.toISOString(), rows: report };
}
