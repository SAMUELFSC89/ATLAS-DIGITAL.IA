import { randomUUID, timingSafeEqual } from 'node:crypto';
import { getFirestoreAdmin } from './db-helper.js';
import { crmHash, crmPhone } from './crm-store.js';
import { getAuthenticatedEmail, searchRadar } from './radar.js';
import { nextRadarRun, parseRecurringRadarFilters } from '../src/lib/radarRecurring.js';
import type { RadarLead } from '../src/types.js';

const PAUSED = Number.MAX_SAFE_INTEGER;
const LEASE_MS = 120_000;
const CRON_BATCH = 8;
const date = () => Date.now();

function cronAuthorization(req: any): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from('Bearer ' + secret);
  const received = Buffer.from(String(req.headers?.authorization || ''));
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Método inválido.' });

  try {
    if (req.method === 'GET' && req.query?.run === 'scheduled') {
      if (!cronAuthorization(req)) return res.status(401).json({ error: 'Execução não autorizada.' });
      const jobs = getFirestoreAdmin().collection('radarRecurring');
      const due = await jobs.where('nextRunAt', '<=', date()).orderBy('nextRunAt').limit(CRON_BATCH).get();
      const runs = await Promise.allSettled(due.docs.map(job => runSearch(job.id, true)));
      return res.status(200).json({ checked: runs.length, failed: runs.filter(run => run.status === 'rejected').length });
    }

    const email = await getAuthenticatedEmail(req);
    if (!email) return res.status(401).json({ error: 'Entre na Atlas para usar a busca recorrente.' });
    const db = getFirestoreAdmin();
    const id = crmHash(email.trim().toLowerCase());
    const ref = db.collection('radarRecurring').doc(id);
    const queue = db.collection('crmAccounts').doc(id).collection('radarReview');
    if (req.method === 'GET') {
      const [settings, leads] = await Promise.all([ref.get(), queue.orderBy('addedAt', 'desc').limit(60).get()]);
      return res.status(200).json({
        filters: settings.get('filters') ?? null,
        enabled: settings.get('enabled') === true,
        cronConfigured: Boolean(process.env.CRON_SECRET),
        lastRunAt: settings.get('lastRunAt') ?? null,
        lastAdded: settings.get('lastAdded') ?? null,
        queue: leads.docs.map(doc => doc.get('lead')),
      });
    }

    if (req.body?.action === 'save') {
      const filters = parseRecurringRadarFilters(req.body.filters);
      const enabled = req.body.enabled;
      if (!filters || typeof enabled !== 'boolean') return res.status(400).json({ error: 'Confira os filtros da busca recorrente.' });
      await ref.set({ filters, enabled, nextRunAt: enabled ? nextRadarRun(date()) : PAUSED, revision: randomUUID() }, { merge: true });
      return res.status(200).json({ saved: true });
    }
    if (req.body?.action === 'run') {
      const result = await runSearch(id, false);
      if (!result) return res.status(409).json({ error: 'Salve os filtros ou aguarde a busca que já está em andamento.' });
      return res.status(200).json(result);
    }
    return res.status(400).json({ error: 'Ação inválida.' });
  } catch (err) {
    console.error('[Radar recorrente]', err instanceof Error ? err.name : 'unknown');
    return res.status(503).json({ error: 'Não foi possível concluir a operação. Confira o acesso ao Radar e tente novamente.' });
  }
}

async function runSearch(accountId: string, scheduled: boolean) {
  const db = getFirestoreAdmin();
  const ref = db.collection('radarRecurring').doc(accountId);
  const queue = db.collection('crmAccounts').doc(accountId).collection('radarReview');
  const lease = randomUUID();
  const start = date();
  const job = await db.runTransaction(async tx => {
    const doc = await tx.get(ref);
    const filters = parseRecurringRadarFilters(doc.get('filters'));
    if (!filters || (doc.get('leaseUntil') ?? 0) > start ||
        (scheduled && (doc.get('enabled') !== true || doc.get('nextRunAt') > start))) return null;
    tx.update(ref, { lease, leaseUntil: start + LEASE_MS });
    return { filters, revision: doc.get('revision') };
  });
  if (!job) return null;

  try {
    const { leads } = await searchRadar(job.filters);
    const candidates = new Map<string, RadarLead>();
    for (const lead of leads) {
      const phone = crmPhone(lead.whatsapp || lead.phone);
      const key = crmHash(phone ? 'phone:' + phone : 'place:' + lead.id);
      if (!candidates.has(key)) candidates.set(key, lead);
    }
    const finished = date();
    return await db.runTransaction(async tx => {
      const current = await tx.get(ref);
      if (current.get('lease') !== lease || current.get('revision') !== job.revision) return { added: 0, superseded: true };
      const refs = [...candidates.keys()].map(key => queue.doc(key));
      const docs = refs.length ? await tx.getAll(...refs) : [];
      let added = 0;
      for (const doc of docs) {
        const lead = candidates.get(doc.id);
        if (!doc.exists && lead) {
          tx.create(doc.ref, { lead, addedAt: finished });
          added++;
        }
      }
      tx.update(ref, {
        lastRunAt: finished, lastAdded: added, leaseUntil: 0,
        ...(scheduled ? { nextRunAt: nextRadarRun(finished) } : {}),
      });
      return { added };
    });
  } finally {
    await db.runTransaction(async tx => {
      const current = await tx.get(ref);
      if (current.get('lease') === lease && current.get('leaseUntil')) {
        tx.update(ref, {
          leaseUntil: 0,
          ...(scheduled && current.get('revision') === job.revision ? { nextRunAt: nextRadarRun(date()) } : {}),
        });
      }
    });
  }
}
