import type { LeadStatus } from '../types.js';

export const CRM_STAGES: LeadStatus[] = ['Novo', 'Contato', 'Resposta', 'Reunião', 'Proposta', 'Negociação', 'Fechado', 'Pós-venda'];

export const CRM_NEXT_ACTION: Record<LeadStatus, string> = {
  Novo: 'Fazer o primeiro contato',
  Contato: 'Acompanhar a resposta',
  Resposta: 'Responder e qualificar o lead',
  Reunião: 'Confirmar ou preparar a reunião',
  Proposta: 'Acompanhar a proposta',
  Negociação: 'Alinhar as condições comerciais',
  Fechado: 'Iniciar o atendimento pós-venda',
  'Pós-venda': 'Acompanhar o cliente',
};

export type CrmInteraction = { direction: 'inbound' | 'outbound'; text?: string };

export function nextCrmStage(current: LeadStatus, { direction, text = '' }: CrmInteraction): LeadStatus {
  const message = text.slice(0, 4000).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const inbound = direction === 'inbound';
  let stage: LeadStatus = inbound ? 'Resposta' : 'Contato';

  if (current === 'Fechado' || current === 'Pós-venda') {
    return inbound && /\b(suporte|segunda via|nota fiscal|manutencao|pos[- ]venda)\b/.test(message)
      ? 'Pós-venda' : current;
  }

  if (!/\b(nao|nunca|jamais|talvez|se eu|se puder|se conseguirmos)\b/.test(message)) {
    if (!message.includes('?') && /\b(?:(?:reuniao|call|visita|demonstracao) (?:ja )?(?:confirmad[ao]|marcad[ao]|agendad[ao])|confirmo (?:a |o )?(?:reuniao|call|visita|demonstracao))\b/.test(message)) {
      stage = 'Reunião';
    }
    if (!inbound && /\b(?:(?:segue |enviei |encaminhei )(?:a |o )?(?:proposta|orcamento)|(?:proposta|orcamento) enviad[ao])\b/.test(message)) {
      stage = 'Proposta';
    }
    if (inbound && /\b(?:desconto|contraproposta|parcelamento|parcelar|negociar|melhorar o (?:preco|valor))\b/.test(message)) {
      stage = 'Negociação';
    }
    if (inbound && (current === 'Proposta' || current === 'Negociação') && !message.includes('?') &&
      /(?:^|[.!;]\s*|(?:sim|ok|perfeito|combinado)[,!. ]+)(?:aceito (?:a |o )?(?:proposta|orcamento)|(?:proposta|orcamento) aprovad[ao]|podemos fechar|vamos fechar)\b/.test(message.trim())) {
      stage = 'Fechado';
    }
  }
  return CRM_STAGES.indexOf(stage) > CRM_STAGES.indexOf(current) ? stage : current;
}
