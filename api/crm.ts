import { getFirestoreAdmin } from './db-helper.js';
import { crmAccount, crmHash, leadContactKeys, leadContactQuery } from './crm-store.js';
import { getAuthenticatedEmail } from './radar.js';
import { CRM_NEXT_ACTION, CRM_STAGES } from '../src/lib/crmPipeline.js';
import type { Lead, LeadStatus } from '../src/types.js';

const editableText = ['companyName', 'responsible', 'phone', 'whatsapp', 'email', 'city', 'state', 'website',
  'instagram', 'facebook', 'linkedin', 'googleProfile', 'nextAction', 'notes', 'segment'] as const;
const formFields = ['companyName', 'responsible', 'phone', 'whatsapp', 'email', 'city', 'state', 'website',
  'nextAction', 'notes'] as const;
const isStage = (value: unknown): value is LeadStatus => CRM_STAGES.includes(value as LeadStatus);
const cleanText = (value: unknown) => typeof value === 'string' ? value.trim().slice(0, 2000) : '';
const probability = (value: unknown) => typeof value === 'number' && Number.isFinite(value)
  ? Math.max(0, Math.min(100, Math.round(value))) : 0;

function publicLead(id: string, data: Record<string, unknown>): Lead {
  const { contactKeys, lastCrmInteractionAt, ...lead } = data;
  return { ...lead, id, atlasScore: lead.positionQuery ? lead.atlasScore ?? null : null } as Lead;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Método não suportado.' });
  const email = await getAuthenticatedEmail(req);
  if (!email) return res.status(401).json({ error: 'Entre na Atlas para acessar o CRM.' });
  try {
    const account = crmAccount(email);
    const leads = account.collection('leads');
    if (req.method === 'GET') {
      const snapshot = await leads.orderBy('createdAt', 'desc').get();
      return res.status(200).json({ leads: snapshot.docs.map(doc => publicLead(doc.id, doc.data())) });
    }

    const { action, id, lead = {}, status, localSearch } = req.body || {};
    const now = new Date().toISOString();
    if (action === 'create') {
      const text = Object.fromEntries(editableText.map(key => [key, cleanText(lead?.[key])])) as Pick<Lead, typeof editableText[number]>;
      if (!text.companyName) return res.status(400).json({ error: 'Informe o nome da empresa.' });
      const contactKeys = leadContactKeys(text);
      const phoneRef = contactKeys[0] ? leads.doc(crmHash(contactKeys[0])) : undefined;
      const data = {
        ...text, contactKeys, status: 'Novo', lastContact: 'Não efetuado',
        closeProbability: probability(lead.closeProbability), createdAt: now,
        ...positionPatch({ position: lead.localPosition, score: lead.atlasScore, query: lead.positionQuery, checkedAt: lead.positionCheckedAt }),
      };
      const saved = await getFirestoreAdmin().runTransaction(async tx => {
        const matches = contactKeys.length ? await tx.get(leadContactQuery(account, contactKeys)) : undefined;
        if (matches?.size > 1) return null;
        const existing = matches?.docs[0];
        if (existing) {
          const stored = existing.data();
          const details = Object.fromEntries(editableText
            .filter(key => key !== 'nextAction' && text[key] && !stored[key])
            .map(key => [key, text[key]]));
          if (text.companyName && stored.companyName === '+' + stored.contactKeys?.[0]) details.companyName = text.companyName;
          const position = !stored.positionQuery && data.positionQuery
            ? { positionQuery: data.positionQuery, positionCheckedAt: data.positionCheckedAt, localPosition: data.localPosition, atlasScore: data.atlasScore }
            : {};
          const patch = { ...details, ...position };
          if (Object.keys(patch).length) tx.update(existing.ref, {
            ...patch,
            contactKeys: leadContactKeys({
              whatsapp: details.whatsapp ?? stored.whatsapp,
              phone: details.phone ?? stored.phone,
            }),
          });
          return publicLead(existing.id, { ...stored, ...patch });
        }
        const ref = phoneRef && !(await tx.get(phoneRef)).exists ? phoneRef : leads.doc();
        tx.create(ref, data);
        return publicLead(ref.id, data);
      });
      return saved ? res.status(200).json({ lead: saved })
        : res.status(409).json({ error: 'Os telefones informados correspondem a leads diferentes. Confira os contatos.' });
    }

    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) {
      return res.status(400).json({ error: 'Lead inválido.' });
    }
    const ref = leads.doc(id);
    if (action === 'delete') {
      await ref.delete();
      return res.status(200).json({});
    }
    let patch: Record<string, unknown>;
    if (action === 'stage' && isStage(status)) {
      patch = { status, statusSource: 'manual', statusUpdatedAt: now, lastCrmInteractionAt: now, nextAction: CRM_NEXT_ACTION[status] };
    } else if (action === 'edit') {
      const text = Object.fromEntries(formFields.map(key => [key, cleanText(lead?.[key])])) as Pick<Lead, typeof formFields[number]>;
      if (!text.companyName) return res.status(400).json({ error: 'Informe o nome da empresa.' });
      patch = { ...text, contactKeys: leadContactKeys(text), closeProbability: probability(lead.closeProbability) };
    } else if (action === 'position' && cleanText(localSearch?.query)) {
      patch = positionPatch(localSearch);
    } else {
      return res.status(400).json({ error: 'Ação inválida no CRM.' });
    }
    const saved = await getFirestoreAdmin().runTransaction(async tx => {
      const existing = (await tx.get(ref)).data();
      if (!existing) return null;
      if (action === 'edit' && Array.isArray(patch.contactKeys) && patch.contactKeys.length) {
        const matches = await tx.get(leadContactQuery(account, patch.contactKeys));
        if (matches.docs.some(doc => doc.id !== id)) return false;
      }
      tx.update(ref, patch);
      return publicLead(id, { ...existing, ...patch });
    });
    if (saved === false) return res.status(409).json({ error: 'Já existe outro lead com este telefone no CRM.' });
    return saved ? res.status(200).json({ lead: saved }) : res.status(404).json({ error: 'Lead não encontrado.' });
  } catch (err) {
    console.error('[CRM] Erro de armazenamento:', err instanceof Error ? err.name : 'unknown');
    return res.status(503).json({ error: 'Não foi possível acessar o CRM. Tente novamente.' });
  }
}

function positionPatch(input: { position?: unknown; score?: unknown; query?: unknown; checkedAt?: unknown }) {
  const positionQuery = cleanText(input.query);
  const localPosition = Number.isInteger(input.position) && Number(input.position) > 0 ? Number(input.position) : null;
  return {
    positionQuery, localPosition, positionCheckedAt: cleanText(input.checkedAt),
    atlasScore: positionQuery && (localPosition !== null || input.score === 0) && typeof input.score === 'number'
      ? probability(input.score) : null,
  };
}
