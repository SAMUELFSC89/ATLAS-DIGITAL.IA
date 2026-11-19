import { readTraining } from './ai-reply.js';
import { evaluateProspectingExecution } from '../../src/lib/prospectingExecution.js';
import { planProspectingSlots } from '../../src/lib/prospectingQueue.js';
import { fillMessage } from '../../src/lib/prospectingApproach.js';
import { DEFAULT_PROSPECTING_SCHEDULE, parseProspectingSchedule } from '../../src/lib/prospectingSchedule.js';
import type { PreparedRadarBatch } from '../../src/lib/radarRecurring.js';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { decrypt, getFirestoreAdmin } from './db-helper.js';
import { crmHash, crmPhone } from './crm-store.js';
import type { RadarSearchParams, RadarSearchResult } from '../radar.js';
import { nextRadarRun, parseRecurringRadarFilters, parseRadarReviewDecision } from '../../src/lib/radarRecurring.js';
import type { RadarLead } from '../../src/types.js';

const PAUSED = Number.MAX_SAFE_INTEGER;
const LEASE_MS = 120_000;
const CRON_BATCH = 8;
const date = () => Date.now();
const campaignDay = new Intl.DateTimeFormat('sv-SE', {
  year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Sao_Paulo',
});

function cronAuthorization(req: any): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from('Bearer ' + secret);
  const received = Buffer.from(String(req.headers?.authorization || ''));
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function handleRecurringRadar(
  req: any, res: any,
  getAuthenticatedEmail: (req: any) => Promise<string | null>,
  searchRadar: (params: RadarSearchParams) => Promise<RadarSearchResult>,
) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Método inválido.' });

  try {
    if (req.method === 'GET' && req.query?.run === 'scheduled') {
      if (!cronAuthorization(req)) return res.status(401).json({ error: 'Execução não autorizada.' });
      const jobs = getFirestoreAdmin().collection('radarRecurring');
      const due = await jobs.where('nextRunAt', '<=', date()).orderBy('nextRunAt').limit(CRON_BATCH).get();
      const runs = await Promise.allSettled(due.docs.map(job => runSearch(job.id, true, searchRadar)));
      return res.status(200).json({ checked: runs.length, failed: runs.filter(run => run.status === 'rejected').length });
    }

    const email = await getAuthenticatedEmail(req);
    if (!email) return res.status(401).json({ error: 'Entre na Atlas para usar a busca recorrente.' });
    const db = getFirestoreAdmin();
    const id = crmHash(email.trim().toLowerCase());
    const ref = db.collection('radarRecurring').doc(id);
    const account = db.collection('crmAccounts').doc(id);
    const queue = account.collection('radarReview');
    const batchRef = account.collection('settings').doc('preparedRadarBatch');
    if (req.method === 'GET') {
      const [settings, leads, batch, training, connection] = await Promise.all([
        ref.get(), queue.orderBy('addedAt', 'desc').limit(60).get(), batchRef.get(),
        account.collection('settings').doc('aiTraining').get(),
        db.collection('companies').doc(email).get(),
      ]);
      const instructions = readTraining(training.data());
      const token = connection.get('accessToken');
      const connected = connection.get('status') === 'connected' &&
        /^\d+$/.test(connection.get('phoneNumberId') ?? '') && connection.get('hasGraphErrors') !== true &&
        typeof token === 'string' && Boolean(token) && !/^EAAG.*EAAG$/.test(decrypt(token));
      return res.status(200).json({
        filters: settings.get('filters') ?? null,
        enabled: settings.get('enabled') === true,
        cronConfigured: Boolean(process.env.CRON_SECRET),
        lastRunAt: settings.get('lastRunAt') ?? null,
        lastAdded: settings.get('lastAdded') ?? null,
        batch: batch.data() ?? null,
        readiness: {
          trainingSaved: Boolean(instructions && Object.values(instructions).some(Boolean)),
          aiConfigured: Boolean(process.env.GEMINI_API_KEY),
          autoReply: training.get('autoSend') === true,
          whatsappConfigured: connected,
          webhookSubscribed: connected && connection.get('webhookSubscribed') === true,
        },
        queue: leads.docs.map(doc => ({
          key: doc.id,
          lead: doc.get('lead'),
          status: doc.get('status') ?? 'pending',
          reviewedAt: doc.get('reviewedAt') ?? null,
          consentSource: doc.get('consentSource') ?? null,
        })),
      });
    }

    if (req.body?.action === 'save') {
      const filters = parseRecurringRadarFilters(req.body.filters);
      const enabled = req.body.enabled;
      if (!filters || typeof enabled !== 'boolean') return res.status(400).json({ error: 'Confira os filtros da busca recorrente.' });
      await ref.set({ filters, enabled, nextRunAt: enabled ? nextRadarRun(date()) : PAUSED, revision: randomUUID() }, { merge: true });
      return res.status(200).json({ saved: true });
    }
    if (req.body?.action === 'prepareBatch') {
      const { keys, template, previous } = req.body;
      if (!Array.isArray(keys) || !keys.length || keys.length > 60 ||
          keys.some(key => typeof key !== 'string' || !/^[a-f0-9]{64}$/.test(key)) ||
          typeof template !== 'string' || !template.trim() || template.length > 4000 ||
          (previous !== null && (typeof previous !== 'string' || previous.length !== 24))) {
        return res.status(400).json({ error: 'Confira os contatos e a abordagem.' });
      }
      const now = new Date();
      const day = campaignDay.format(now).replace(/\D/g, '');
      const selected = [...new Set<string>(keys)];
      const prepared = await db.runTransaction(async tx => {
        const [current, settings, used, ...items] = await tx.getAll(
          batchRef,
          account.collection('settings').doc('prospecting'),
          account.collection('prospectingDays').doc(day),
          ...selected.map(key => queue.doc(key)),
        );
        if ((current.get('preparedAt') ?? null) !== previous) return 'conflict';
        const approved = new Map<string, { key: string; lead: RadarLead }>();
        for (const item of items) {
          const lead = item.get('lead') as RadarLead | undefined;
          if (!lead || !/^\d{12,15}$/.test(lead.whatsapp) ||
              !parseRadarReviewDecision({ status: item.get('status'), consentSource: item.get('consentSource') }) ||
              item.get('status') !== 'approved') return 'not-approved';
          if (!approved.has(lead.whatsapp)) approved.set(lead.whatsapp, { key: item.id, lead });
        }
        const schedule = parseProspectingSchedule(settings.get('schedule')) ?? DEFAULT_PROSPECTING_SCHEDULE;
        const slots = planProspectingSlots(approved.size, {
          schedule, dailyLimit: settings.get('dailyLimit') ?? 30, dailyUsed: used.get('count') ?? 0,
        }, now);
        if (slots.length !== approved.size) return 'invalid-slots';
        const rows: PreparedRadarBatch['rows'] = [...approved.values()].map(({ key, lead }, index) => ({
          key, company: lead.companyName, message: fillMessage(template.trim(), lead),
          at: slots[index].toISOString(), status: 'scheduled',
        }));
        if (Buffer.byteLength(JSON.stringify(rows)) > 700_000) return 'too-large';
        const saved = { preparedAt: new Date(Math.max(now.getTime(), previous ? Date.parse(previous) + 1 : 0)).toISOString(), rows };
        tx.set(batchRef, saved);
        return saved;
      });
      if (prepared === 'conflict') return res.status(409).json({ error: 'O lote mudou em outra sessão. Reabra a fila e tente novamente.' });
      if (prepared === 'not-approved') return res.status(409).json({ error: 'Um contato perdeu a aprovação. Atualize a fila e tente novamente.' });
      if (prepared === 'invalid-slots') return res.status(400).json({ error: 'Confira o limite diário e a janela de envio.' });
      if (prepared === 'too-large') return res.status(400).json({ error: 'Reduza o tamanho da abordagem ou a quantidade de contatos.' });
      return res.status(200).json({ batch: prepared });
    }

    if (req.body?.action === 'simulateExecution' || req.body?.action === 'runRehearsal') {
      const rehearsal = req.body.action === 'runRehearsal';
      const { preparedAt } = req.body;
      if (typeof preparedAt !== 'string' || preparedAt.length !== 24) {
        return res.status(400).json({ error: 'Prepare um lote antes de testar a execução.' });
      }
      const report = await db.runTransaction(async tx => {
        const now = new Date();
        const day = campaignDay.format(now).replace(/\D/g, '');
        const daily = account.collection('prospectingDays').doc(day);
        const testDaily = account.collection('prospectingTestDays').doc(day);
        const [current, settings, used, testUsed] = await tx.getAll(
          batchRef, account.collection('settings').doc('prospecting'), daily, testDaily,
        );
        const batch = current.data() as PreparedRadarBatch | undefined;
        if (!batch || batch.preparedAt !== preparedAt) return null;
        const previous = batch.rehearsal?.processed ?? {};
        const rows = rehearsal ? batch.rows.filter(row => !Object.hasOwn(previous, row.key)) : batch.rows;
        const candidates = rows.filter(row => row.status === 'scheduled').map(row => queue.doc(row.key));
        const approvalDocs = candidates.length ? await tx.getAll(...candidates) : [];
        const approved = new Map<string, string>();
        for (const item of approvalDocs) {
          const decision = parseRadarReviewDecision({ status: item.get('status'), consentSource: item.get('consentSource') });
          const phone = item.get('lead.whatsapp');
          if (decision?.status === 'approved' && typeof phone === 'string' && /^\d{12,15}$/.test(phone)) {
            approved.set(item.id, phone);
          }
        }
        const phones = [...new Set(approved.values())];
        const reservations = phones.length
          ? await tx.getAll(...phones.map(phone => daily.collection('recipients').doc(crmHash(phone))))
          : [];
        const reservedIds = new Set(reservations.filter(item => item.exists).map(item => item.id));
        const testRecipients: string[] = rehearsal ? testUsed.get('recipients') ?? [] : [];
        const testIds = new Set(testRecipients);
        const reserved = new Set(phones.filter(phone => reservedIds.has(crmHash(phone)) || testIds.has(crmHash(phone))));
        const simulation = evaluateProspectingExecution(rows, approved, reserved, {
          schedule: parseProspectingSchedule(settings.get('schedule')) ?? DEFAULT_PROSPECTING_SCHEDULE,
          dailyLimit: settings.get('dailyLimit') ?? 30,
          dailyUsed: (used.get('count') ?? 0) + testRecipients.length,
        }, now);
        if (!rehearsal) {
          tx.update(batchRef, { simulation });
          return { report: simulation };
        }
        const processed = { ...previous };
        let added = 0;
        for (const result of simulation.rows) {
          if (result.status !== 'ready') continue;
          processed[result.key] = simulation.checkedAt;
          const phone = approved.get(result.key);
          if (phone) testIds.add(crmHash(phone));
          added++;
        }
        if (added) tx.set(testDaily, { recipients: [...testIds] });
        tx.update(batchRef, { simulation, rehearsal: { lastRunAt: simulation.checkedAt, processed } });
        return { report: simulation, processed: added };
      });
      if (!report) return res.status(409).json({ error: 'O lote mudou. Atualize a fila antes de testar.' });
      return res.status(200).json(report);
    }

    if (req.body?.action === 'review') {
      const { key, decision: input } = req.body;
      const decision = parseRadarReviewDecision(input);
      if (typeof key !== 'string' || !/^[a-f0-9]{64}$/.test(key) || !decision) {
        return res.status(400).json({ error: 'Confira a decisão e a origem do aceite.' });
      }
      const contact = queue.doc(key);
      const result = await db.runTransaction(async tx => {
        const item = await tx.get(contact);
        if (!item.exists) return 'missing';
        const number = item.get('lead.whatsapp');
        if (decision.status === 'approved' && (typeof number !== 'string' || !/^\d{12,15}$/.test(number))) return 'no-number';
        if (decision.status !== 'approved') {
          const prepared = (await tx.get(batchRef)).data() as PreparedRadarBatch | undefined;
          if (prepared?.rows.some(row => row.key === key && row.status === 'scheduled')) {
            tx.update(batchRef, {
              preparedAt: new Date(Math.max(date(), Date.parse(prepared.preparedAt) + 1)).toISOString(),
              simulation: null,
              rows: prepared.rows.map(row => row.key === key ? { ...row, status: 'cancelled' } : row),
            });
          }
        }
        tx.update(contact, {
          status: decision.status,
          consentSource: decision.status === 'approved' ? decision.consentSource : null,
          reviewedAt: date(),
        });
        return 'ok';
      });
      if (result === 'missing') return res.status(404).json({ error: 'Contato não encontrado na sua fila.' });
      if (result === 'no-number') return res.status(400).json({ error: 'Este contato não tem um número de WhatsApp para aprovação.' });
      return res.status(200).json({ saved: true });
    }
    if (req.body?.action === 'run') {
      const result = await runSearch(id, false, searchRadar);
      if (!result) return res.status(409).json({ error: 'Salve os filtros ou aguarde a busca que já está em andamento.' });
      return res.status(200).json(result);
    }
    return res.status(400).json({ error: 'Ação inválida.' });
  } catch (err) {
    console.error('[Radar recorrente]', err instanceof Error ? err.name : 'unknown');
    return res.status(503).json({ error: 'Não foi possível concluir a operação. Confira o acesso ao Radar e tente novamente.' });
  }
}

async function runSearch(accountId: string, scheduled: boolean, searchRadar: (params: RadarSearchParams) => Promise<RadarSearchResult>) {
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
