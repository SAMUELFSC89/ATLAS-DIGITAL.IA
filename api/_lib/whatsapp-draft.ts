import { crmAccount, crmPhone, leadContactQuery } from './crm-store.js';
import { generateAiReply, readTraining } from './ai-reply.js';
import { AI_MEMORY_LIMIT } from '../../src/lib/aiTraining.js';

export async function handleWhatsAppAi(
  email: string,
  phone: string,
  message: string,
  eventId: string,
  sendReply: (text: string) => Promise<{ success: boolean; messageId?: string }>,
): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  const normalized = crmPhone('+' + phone);
  if (!apiKey || !normalized) return;
  const account = crmAccount(email);
  const settingsRef = account.collection('settings').doc('aiTraining');
  const [settingsDoc, matches] = await Promise.all([
    settingsRef.get(),
    leadContactQuery(account, [normalized]).get(),
  ]);
  const settings = readTraining(settingsDoc.data());
  if (!settings || !Object.values(settings).some(Boolean) || matches.size !== 1) return;
  const lead = matches.docs[0];
  if (lead.get('aiPaused') === true || lead.get('lastInboundMessageId') !== eventId) return;
  const memory: string = lead.get('aiMemory') ?? '';
  const reply = await generateAiReply(apiKey, settings, message.slice(0, 2000), memory.slice(0, AI_MEMORY_LIMIT));
  if (!reply) return;
  const autoSend = settingsDoc.get('autoSend') === true;
  if (autoSend) {
    const sent = await sendReply(reply.reply);
    if (!sent.success || !sent.messageId || sent.messageId.startsWith('wmid.Simulated_')) return;
  }
  await account.firestore.runTransaction(async tx => {
    const current = await tx.get(lead.ref);
    if (!current.exists || current.get('aiPaused') === true || current.get('lastInboundMessageId') !== eventId ||
        (current.get('aiMemory') ?? '') !== memory) return;
    tx.update(lead.ref, autoSend
      ? { aiMemory: reply.memory, aiDraft: null }
      : { aiDraft: { ...reply, updatedAt: new Date().toISOString() } });
  });
}
