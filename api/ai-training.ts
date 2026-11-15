import { generateAiReply, readTraining } from './_lib/ai-reply.js';
import { crmAccount } from './crm-store.js';
import { getAuthenticatedEmail } from './radar.js';
import { EMPTY_TRAINING, AI_MEMORY_LIMIT } from '../src/lib/aiTraining.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Método não suportado.' });
  const email = await getAuthenticatedEmail(req);
  if (!email) return res.status(401).json({ error: 'Entre na Atlas para configurar a IA.' });
  try {
    const ref = crmAccount(email).collection('settings').doc('aiTraining');
    if (req.method === 'GET') {
      return res.status(200).json({ training: readTraining((await ref.get()).data()) ?? EMPTY_TRAINING });
    }
    const { action, training, message, memory } = req.body || {};
    if (action === 'save') {
      const saved = readTraining(training);
      if (!saved) return res.status(400).json({ error: 'Confira os limites dos campos de treinamento.' });
      await ref.set(saved);
      return res.status(200).json({ training: saved });
    }
    if (action !== 'simulate') return res.status(400).json({ error: 'Ação inválida.' });
    if (typeof message !== 'string' || !message.trim() || message.length > 2000 ||
        typeof memory !== 'string' || memory.length > AI_MEMORY_LIMIT) {
      return res.status(400).json({ error: 'Informe uma mensagem de até 2.000 caracteres.' });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'Configure GEMINI_API_KEY na Vercel para usar o simulador.' });
    const settings = readTraining((await ref.get()).data()) ?? EMPTY_TRAINING;
    if (!Object.values(settings).some(Boolean)) {
      return res.status(400).json({ error: 'Salve as instruções de atendimento antes de iniciar o teste.' });
    }
    const output = await generateAiReply(apiKey, settings, message, memory);
    if (!output) return res.status(502).json({ error: 'O Gemini não devolveu uma resposta utilizável. Tente novamente.' });
    return res.status(200).json(output);
  } catch (err) {
    console.error('[Treinar IA] Falha:', err instanceof Error ? err.name : 'unknown');
    return res.status(500).json({ error: 'Não foi possível concluir a operação. Confira a configuração e tente novamente.' });
  }
}
