import { crmAccount, crmPhone, leadContactQuery } from '../crm-store.js';
import { generateAiReply, readTraining } from './ai-reply.js';
import { AI_MEMORY_LIMIT } from '../../src/lib/aiTraining.js';

export async function prepareWhatsAppDraft(email: string, phone: string, message: string, eventId: string): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;
  const normalized = crmPhone('+' + phone);
  if (!normalized) return;
  const account = crmAccount(email);
  const [settingsDoc, matches] = await Promise.all([
    account.collection('settings').doc('aiTraining').get(),
    leadContactQuery(account, [normalized]).get(),
  ]);
  const settings = readTraining(settingsDoc.data());
  if (!settings || !Object.values(settings).some(Boolean) || matches.size !== 1) return;
  const lead = matches.docs[0];
  const memory: string = lead.get('aiMemory') ?? '';
  const reply = await generateAiReply(apiKey, settings, message.slice(0, 2000), memory.slice(0, AI_MEMORY_LIMIT));
  if (!reply) return;
  await account.firestore.runTransaction(async tx => {
    const current = await tx.get(lead.ref);
    if (!current.exists || current.get('lastInboundMessageId') !== eventId ||
        (current.get('aiMemory') ?? '') !== memory) return;
    tx.update(lead.ref, { aiDraft: { ...reply, updatedAt: new Date().toISOString() } });
  });
}
