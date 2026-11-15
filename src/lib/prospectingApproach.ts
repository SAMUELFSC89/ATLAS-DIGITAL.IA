import type { RadarLead } from '../types.js';

/** Frase com o principal problema medido da empresa, usada em {diagnostico}. */
export function approachDiagnosis(lead: RadarLead): string {
  const search = `a busca por ${lead.segment.toLowerCase()} em ${lead.city}`;
  if (!lead.website) {
    return `vocês não têm site próprio, então quem faz ${search} conhece o concorrente antes de vocês`;
  }
  if (lead.localPosition > 3) {
    return `vocês aparecem em ${lead.localPosition}º lugar n${search}, atrás de concorrentes que recebem os primeiros pedidos de orçamento`;
  }
  if (lead.localPosition > 0) {
    return `vocês já aparecem em ${lead.localPosition}º lugar n${search}, e dá para transformar mais dessas buscas em orçamentos`;
  }
  return `dá para transformar em orçamentos mais das pessoas que fazem ${search}`;
}

/** Troca as variáveis da mensagem pelos dados da empresa. */
export function fillMessage(message: string, lead: RadarLead): string {
  const rating = lead.rating === null ? 'sem nota' : lead.rating.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return message
    .replace(/\{empresa\}/gi, () => lead.companyName)
    .replace(/\{cidade\}/gi, () => lead.city)
    .replace(/\{segmento\}/gi, () => lead.segment.toLowerCase())
    .replace(/\{diagnostico\}/gi, approachDiagnosis(lead))
    .replace(/\{posicao\}/gi, lead.localPosition > 0 ? `${lead.localPosition}º` : 'fora dos primeiros resultados')
    .replace(/\{nota\}/gi, rating)
    .replace(/\{avaliacoes\}/gi, String(lead.reviewsCount));
}

