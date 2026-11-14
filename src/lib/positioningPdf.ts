import type { LocalSearchPosition, RadarLead } from '../types';

export interface PositioningSnapshot {
  companyName: string;
  city: string;
  state: string;
  hasGoogleProfile: boolean;
  hasWebsite: boolean;
  hasHttpsWebsite: boolean;
  hasSocialProfile?: boolean;
  hasPublicPhone: boolean;
  hasConfirmedWhatsApp?: boolean;
  rating: number | null;
  reviewsCount: number;
  localSearch?: LocalSearchPosition;
}

export function positioningFromLead(lead: RadarLead): PositioningSnapshot {
  return {
    companyName: lead.companyName,
    city: lead.city,
    state: lead.state,
    hasGoogleProfile: Boolean(lead.googleProfile),
    hasWebsite: Boolean(lead.website),
    hasHttpsWebsite: /^https:\/\//i.test(lead.website),
    hasSocialProfile: Boolean(lead.instagram || lead.facebook || lead.linkedin),
    hasPublicPhone: Boolean(lead.phone),
    hasConfirmedWhatsApp: lead.whatsappConfidence === 'confirmado',
    rating: lead.rating,
    reviewsCount: lead.reviewsCount,
    localSearch: lead.localPosition > 0 && lead.positionQuery && lead.positionCheckedAt ? {
      query: lead.positionQuery,
      position: lead.localPosition,
      resultsChecked: null,
      score: lead.atlasScore,
      checkedAt: lead.positionCheckedAt,
    } : undefined,
  };
}

/** O que a Atlas oferece para cada problema encontrado, do mais importante para o menos. */
function getSolutions(snapshot: PositioningSnapshot): string[] {
  const solutions: string[] = [];
  const position = snapshot.localSearch ? snapshot.localSearch.position : undefined;

  if (!snapshot.hasWebsite) solutions.push('Site profissional da empresa, com serviços, fotos e botão de WhatsApp para pedir orçamento.');
  else if (!snapshot.hasHttpsWebsite) solutions.push('Ajuste do site: conexão segura (HTTPS), velocidade e botão de contato visível.');
  if (position === null || (typeof position === 'number' && position > 3)) {
    solutions.push('Otimização do perfil no Google para subir na busca local e aparecer antes dos concorrentes.');
  }
  if (snapshot.rating === null || snapshot.rating < 4.5 || snapshot.reviewsCount < 50) {
    solutions.push('Rotina de avaliações: pedido enviado ao cliente por WhatsApp ao fim de cada serviço.');
  }
  if (snapshot.hasConfirmedWhatsApp === false) {
    solutions.push('Atendimento pelo WhatsApp com resposta imediata a quem pede orçamento.');
  }
  solutions.push('Acompanhamento mensal da posição no Google e dos concorrentes, com relatório.');
  return solutions.slice(0, 3);
}

function getHighlights(snapshot: PositioningSnapshot) {
  const strengths: string[] = [];
  const gaps: string[] = [];

  // A posição na busca é o primeiro motivo da nota.
  const local = snapshot.localSearch;
  if (local) {
    if (local.position === 1) strengths.push('1º lugar na busca local consultada.');
    else if (local.position !== null && local.position <= 3) {
      strengths.push(`${local.position}º lugar na busca local consultada.`);
    } else if (local.position !== null) {
      const ahead = local.position - 1;
      gaps.push(`Está em ${local.position}º lugar na busca local, com ${ahead} concorrentes à frente.`);
    } else {
      gaps.push('Não aparece entre os primeiros resultados da busca local consultada.');
    }
  }

  if (snapshot.hasGoogleProfile) {
    const { rating, reviewsCount } = snapshot;
    if (rating !== null && reviewsCount > 0) {
      const reviews = reviewsCount === 1 ? '1 avaliação' : `${reviewsCount.toLocaleString('pt-BR')} avaliações`;
      const reviewText = `Nota de ${rating.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/5 no Google (${reviews}).`;
      if (rating >= 4) strengths.push(reviewText);
      else {
        gaps.push(reviewText);
      }
    } else {
      strengths.push('Perfil encontrado no Google Maps.');
      gaps.push('A consulta não retornou avaliações para o perfil.');
    }
  } else {
    gaps.push('O perfil no Google Maps não foi identificado na consulta.');
  }

  if (snapshot.hasWebsite) {
    if (snapshot.hasHttpsWebsite) strengths.push('Site próprio vinculado ao perfil, com endereço HTTPS.');
    else {
      strengths.push('Site próprio vinculado ao perfil.');
      gaps.push('O link do site cadastrado usa HTTP.');
    }
  } else {
    gaps.push('A consulta não encontrou um site próprio vinculado ao perfil.');
  }

  if (snapshot.hasConfirmedWhatsApp) strengths.push('Link de WhatsApp localizado.');
  else if (snapshot.hasPublicPhone) strengths.push('Telefone disponível no perfil.');
  if (snapshot.hasConfirmedWhatsApp === false) {
    gaps.push('A consulta não confirmou um link direto de WhatsApp.');
  }

  if (snapshot.hasSocialProfile) strengths.push('Rede social da empresa identificada.');

  return [
    { label: 'O que já funciona', color: '#176249', points: strengths.length ? strengths.slice(0, 2) : ['A consulta trouxe poucos dados para destacar pontos fortes.'] },
    { label: 'Por que a nota é essa', color: '#8B4A1C', points: gaps.length ? gaps : ['Nenhuma falha aparente nos itens consultados.'] },
    { label: 'Como a Atlas resolve', color: '#42396C', points: getSolutions(snapshot) },
  ];
}

export async function createPositioningPdf(snapshot: PositioningSnapshot) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ format: 'a5', unit: 'mm', compress: true });
  const company = snapshot.companyName.replace(/\s+/g, ' ').trim();
  const slug = company.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 55);
  const filename = `Posicionamento-Atlas${slug ? `-${slug}` : ''}.pdf`;
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = width - margin * 2;

  doc.setProperties({ title: 'Resumo de posicionamento digital', author: 'Atlas Digital.IA' });
  doc.setFillColor('#121418');
  doc.rect(0, 0, width, 59, 'F');
  doc.setFillColor('#DAB45C');
  doc.rect(0, 0, width, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor('#E8C577');
  doc.text('ATLAS DIGITAL.IA', margin, 12);
  doc.setFontSize(19);
  doc.setTextColor('#FFFFFF');
  doc.text('Seu posicionamento digital', margin, 25);
  // Nota em destaque no cabeçalho, quando a posição foi medida.
  const headerScore = snapshot.localSearch?.score ?? null;
  if (headerScore !== null) {
    doc.setFontSize(7);
    doc.setTextColor('#E8C577');
    doc.text('ATLAS SCORE LOCAL', width - margin, 33, { align: 'right' });
    doc.setFontSize(26);
    doc.setTextColor(headerScore >= 70 ? '#6EE7A8' : headerScore >= 50 ? '#F5C451' : '#F58A8A');
    doc.text(String(headerScore), width - margin - 11, 45, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor('#D4D7DF');
    doc.text('/100', width - margin, 45, { align: 'right' });
    doc.setTextColor('#FFFFFF');
  }
  doc.setFontSize(12);
  const companyLines = doc.splitTextToSize(company, headerScore !== null ? contentWidth - 40 : contentWidth) as string[];
  const name = companyLines.slice(0, 2);
  if (companyLines.length > 2) name[1] = name[1].trimEnd() + '…';
  doc.text(name, margin, 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#D4D7DF');
  const location = [snapshot.city, snapshot.state].filter(Boolean).join(' / ');
  doc.text(doc.splitTextToSize(location, contentWidth).slice(0, 1), margin, 49);

  let top = 65;
  if (snapshot.localSearch) {
    const local = snapshot.localSearch;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor('#232733');
    const position = local.position === null ? 'Fora dos resultados retornados' : `${local.position}º lugar`;
    const score = local.score === null ? 'Dados insuficientes' : `${local.score}/100`;
    doc.text(`${position} | Atlas Score local: ${score}`, margin, 68);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const search = doc.splitTextToSize(local.query, contentWidth) as string[];
    doc.text(search.slice(0, 2), margin, 74);
    const date = new Date(local.checkedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const coverage = local.resultsChecked === null ? "" : ` | ${local.resultsChecked} resultados consultados`;
    doc.text(`Google Maps (Places API)${coverage} | ${date}`, margin, 83);
    top = 88;
  }
  for (const { label, color, points } of getHighlights(snapshot)) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = points.slice(0, 3).map((point) => doc.splitTextToSize(point, contentWidth - 15) as string[]);
    const cardHeight = 13 + lines.reduce((total, item) => total + item.length * 4 + 1, 0);
    doc.setFillColor('#F4F4F6');
    doc.roundedRect(margin, top, contentWidth, cardHeight, 2, 2, 'F');
    doc.setTextColor(color);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(label, margin + 5, top + 7);
    doc.setTextColor('#232733');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let row = top + 12;
    for (const line of lines) {
      doc.setFillColor(color);
      doc.circle(margin + 5.7, row - 1, 0.6, 'F');
      doc.text(line, margin + 9, row, { lineHeightFactor: 1.13 });
      row += line.length * 4 + 1;
    }
    top += cardHeight + 3;
  }

  doc.setDrawColor('#D6D7DC');
  doc.line(margin, height - 18, width - margin, height - 18);
  doc.setFontSize(8);
  doc.setTextColor('#4B505C');
  doc.text('Dados do Google Maps e dos links associados ao perfil.', margin, height - 12);
  doc.setFont('helvetica', 'bold');
  doc.text('Atlas Digital: mais vendas pela internet. atlasdigital.ia.br', margin, height - 7);
  return { filename, doc };
}
