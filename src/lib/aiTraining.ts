export const TRAINING_FIELDS = {
  knowledge: { label: 'Conhecimento da empresa', limit: 8000, hint: 'Serviços, preços, prazos e perguntas frequentes.' },
  rules: { label: 'Regras de atendimento', limit: 5000, hint: 'O que perguntar, o que pode informar e quando chamar um atendente.' },
  examples: { label: 'Exemplos de respostas', limit: 5000, hint: 'Cole perguntas de exemplo e como você quer que a IA responda.' },
} as const;

export type AiTraining = Record<keyof typeof TRAINING_FIELDS, string>;

export const EMPTY_TRAINING: AiTraining = { knowledge: '', rules: '', examples: '' };

export interface AiSimulation {
  reply: string;
  memory: string;
}

export const AI_MEMORY_LIMIT = 2000;
