import { crmAccount, crmPhone, leadContactQuery } from '../crm-store.js';

export async function canProcessInboundWithAi(email: string, phone: string, eventId: string): Promise<boolean> {
  const normalized = crmPhone('+' + phone);
  if (!normalized) return false;
  const matches = await leadContactQuery(crmAccount(email), [normalized]).get();
  if (matches.size !== 1) return false;
  const lead = matches.docs[0];
  return lead.get('aiPaused') !== true && lead.get('lastInboundMessageId') === eventId;
}
