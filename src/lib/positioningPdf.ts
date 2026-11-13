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

function getHighlights(snapshot: PositioningSnapshot) {
  const strengths: string[] = [];
  const gaps: string[] = [];
  const actions: string[] = [];

  if (snapshot.hasGoogleProfile) {
    const { rating, reviewsCount } = snapshot;
    if (rating !== null && reviewsCount > 0) {
      const reviews = reviewsCount === 1 ? '1 avaliação' : `${reviewsCount.toLocaleString('pt-BR')} avaliações`;
      const reviewText = `Nota de ${rating.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/5 no Google (${reviews}).`;
      if (rating >= 4) strengths.push(reviewText);
      else {
        gaps.push(reviewText);
        actions.push('Responder às avaliações e acompanhar os temas que mais aparecem.');
      }
    } else {
      strengths.push('Perfil encontrado no Google Maps.');
      gaps.push('A consulta não retornou avaliações para o perfil.');
      actions.push('Convidar clientes a deixarem avaliações sobre a experiência.');
    }
  } else {
    gaps.push('O perfil no Google Maps não foi identificado na consulta.');
    actions.push('Conferir se o perfil está publicado e com os dados atualizados.');
  }

  if (snapshot.hasWebsite) {
    if (snapshot.hasHttpsWebsite) strengths.push('Site próprio vinculado ao perfil, com endereço HTTPS.');
    else {
      strengths.push('Site próprio vinculado ao perfil.');
      gaps.push('O link do site cadastrado usa HTTP.');
      actions.push('Conferir o HTTPS e atualizar o link cadastrado no Google.');
    }
  } else {
    gaps.push('A consulta não encontrou um site próprio vinculado ao perfil.');
    actions.push('Vincular o site ao perfil ou criar uma página com serviços e contato.');
  }

  if (snapshot.hasConfirmedWhatsApp) strengths.push('Link de WhatsApp localizado.');
  else if (snapshot.hasPublicPhone) strengths.push('Telefone disponível no perfil.');
  if (snapshot.hasConfirmedWhatsApp === false) {
    gaps.push('A consulta não confirmou um link direto de WhatsApp.');
    actions.push('Disponibilizar um link direto de WhatsApp para facilitar o contato.');
  }

  if (snapshot.hasSocialProfile) strengths.push('Rede social da empresa identificada.');

  return [
    { label: 'O que já funciona', color: '#176249', points: strengths.length ? strengths : ['A consulta trouxe poucos dados para destacar pontos fortes.'] },
    { label: 'O que merece atenção', color: '#8B4A1C', points: gaps.length ? gaps : ['Nenhuma falha aparente nos itens consultados.'] },
    { label: 'Por onde começar', color: '#42396C', points: actions.length ? actions : ['Revisar periodicamente os horários, os serviços e os links de contato no Google.'] },
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
  doc.setFontSize(12);
  const companyLines = doc.splitTextToSize(company, contentWidth) as string[];
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
  doc.text('atlasdigital.ia.br', margin, height - 7);
  return { filename, doc };
}
