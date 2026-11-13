import { createHash } from 'node:crypto';
import { getFirestoreAdmin } from './db-helper.js';
import type { Lead } from '../src/types.js';
import { CRM_NEXT_ACTION, nextCrmStage, type CrmInteraction } from '../src/lib/crmPipeline.js';

export const crmHash = (value: string) => createHash('sha256').update(value).digest('hex');

export function crmAccount(email: string) {
  return getFirestoreAdmin().collection('crmAccounts').doc(crmHash(email.trim().toLowerCase()));
}

export function crmPhone(value: unknown): string {
  if (typeof value !== 'string') return '';
  const digits = value.replace(/\D/g, '');
  if (/^0/.test(digits)) return '';
  const local = !value.trim().startsWith('+') && (digits.length === 10 || digits.length === 11);
  return local ? '55' + digits : /^\d{8,15}$/.test(digits) ? digits : '';
}

export function leadContactKeys(lead: Pick<Lead, 'whatsapp' | 'phone'>): string[] {
  return [...new Set([crmPhone(lead.whatsapp), crmPhone(lead.phone)].filter(Boolean))];
}

export function leadContactQuery(account: ReturnType<typeof crmAccount>, keys: string[]) {
  return account.collection('leads').where('contactKeys', 'array-contains-any', keys).limit(2);
}

export async function recordCrmInteraction(email: string, event: CrmInteraction & {
  id: string; phone: string; name?: string; timestamp?: string; company?: string;
}): Promise<boolean> {
  const phone = crmPhone('+' + event.phone);
  if (!phone || !event.id) return false;
  const account = crmAccount(email);
  const eventRef = account.collection('events').doc(crmHash(event.id));
  const timestamp = Number(event.timestamp) * 1000;
  const at = new Date(timestamp > 0 && timestamp <= Date.now() + 60000 ? timestamp : Date.now()).toISOString();

  return getFirestoreAdmin().runTransaction(async (tx) => {
    if ((await tx.get(eventRef)).exists) return false;
    const matches = await tx.get(leadContactQuery(account, [phone]));
    // A shared phone is ambiguous. Keep the interaction from moving an unrelated lead.
    if (matches.size > 1) return false;
    const match = matches.docs[0];
    const leads = account.collection('leads');
    const phoneRef = leads.doc(crmHash(phone));
    const ref = match?.ref ?? ((await tx.get(phoneRef)).exists ? leads.doc() : phoneRef);
    const existing = match?.data() as (Lead & { lastCrmInteractionAt?: string }) | undefined;
    tx.create(eventRef, { at });
    if (existing?.lastCrmInteractionAt && at < existing.lastCrmInteractionAt) return false;
    const status = nextCrmStage(existing?.status ?? 'Novo', event);
    const stagePatch = !existing || status !== existing.status ? {
      status, statusSource: 'whatsapp', statusUpdatedAt: at, nextAction: CRM_NEXT_ACTION[status],
    } : {};
    const activity = { lastContact: at, lastCrmInteractionAt: at, ...stagePatch };
    if (existing) {
      tx.update(ref, activity);
    } else {
      const name = event.name?.trim().slice(0, 160) || '';
      tx.create(ref, {
        id: ref.id, companyName: event.company?.trim().slice(0, 160) || name || '+' + phone,
        responsible: name, phone: '+' + phone, whatsapp: '+' + phone, contactKeys: [phone],
        email: '', city: '', state: '', website: '', instagram: '', facebook: '', linkedin: '', googleProfile: '',
        atlasScore: null, closeProbability: 0, notes: '', segment: '', createdAt: at, ...activity,
      });
    }
    return true;
  });
}
