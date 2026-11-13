import { RadarLead } from '../types';
import { formatWhatsApp } from './radarApi';

const CONFIDENCE_LABEL: Record<string, string> = {
  confirmado: 'Confirmado no site',
  provavel: 'Provável (celular)',
  incerto: 'Não confirmado (fixo)',
  '': '',
};

interface Column {
  header: string;
  width: number;
  value: (lead: RadarLead) => string | number;
  link?: (lead: RadarLead) => string;
}

const COLUMNS: Column[] = [
  { header: 'Empresa', width: 38, value: (l) => l.companyName },
  { header: 'Segmento', width: 18, value: (l) => l.segment },
  { header: 'Telefone', width: 18, value: (l) => l.phone },
  { header: 'WhatsApp', width: 18, value: (l) => (l.whatsapp ? formatWhatsApp(l.whatsapp) : '') },
  { header: 'Link do WhatsApp', width: 30, value: (l) => l.whatsappLink, link: (l) => l.whatsappLink },
  { header: 'WhatsApp verificado', width: 22, value: (l) => CONFIDENCE_LABEL[l.whatsappConfidence] },
  { header: 'E-mail', width: 30, value: (l) => l.email },
  { header: 'Site', width: 36, value: (l) => l.website, link: (l) => l.website },
  { header: 'Instagram', width: 36, value: (l) => l.instagram, link: (l) => l.instagram },
  { header: 'Facebook', width: 36, value: (l) => l.facebook, link: (l) => l.facebook },
  { header: 'Google Maps', width: 36, value: (l) => l.googleProfile, link: (l) => l.googleProfile },
  { header: 'Nota Google', width: 12, value: (l) => (l.rating === null ? '' : l.rating) },
  { header: 'Avaliações', width: 12, value: (l) => l.reviewsCount },
  { header: 'Endereço', width: 48, value: (l) => l.address },
  { header: 'Cidade', width: 18, value: (l) => l.city },
  { header: 'UF', width: 6, value: (l) => l.state },
  { header: 'Atlas Score estimado', width: 14, value: (l) => l.atlasScore },
];

function xmlEscape(value: string): string {
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function columnLetter(index: number): string {
  let letters = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  }
  return letters;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function fileBaseName(leads: RadarLead[]): string {
  const first = leads[0];
  const slug = `${first?.segment || 'radar'}-${first?.city || ''}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `radar-${slug}-${new Date().toISOString().slice(0, 10)}`;
}

/** Monta os arquivos XML de uma planilha .xlsx com uma aba e links clicáveis. */
export function buildXlsxFiles(leads: RadarLead[]): Record<string, string> {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const links: Array<{ ref: string; url: string }> = [];

  const headerRow = `<row r="1">${COLUMNS.map(
    (col, i) => `<c r="${columnLetter(i)}1" t="inlineStr" s="1"><is><t>${xmlEscape(col.header)}</t></is></c>`
  ).join('')}</row>`;

  const dataRows = leads.map((lead, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const cells = COLUMNS.map((col, colIndex) => {
      const ref = `${columnLetter(colIndex)}${rowNumber}`;
      const value = col.value(lead);
      if (value === '' || value === null || value === undefined) return '';
      if (typeof value === 'number') return `<c r="${ref}"><v>${value}</v></c>`;
      const url = col.link?.(lead);
      if (url) links.push({ ref, url });
      return `<c r="${ref}" t="inlineStr"${url ? ' s="2"' : ''}><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
    }).join('');
    return `<row r="${rowNumber}">${cells}</row>`;
  });

  const lastRef = `${columnLetter(COLUMNS.length - 1)}${leads.length + 1}`;
  const sheet =
    `${xmlHeader}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<cols>${COLUMNS.map((col, i) => `<col min="${i + 1}" max="${i + 1}" width="${col.width}" customWidth="1"/>`).join('')}</cols>` +
    `<sheetData>${headerRow}${dataRows.join('')}</sheetData>` +
    `<autoFilter ref="A1:${lastRef}"/>` +
    (links.length
      ? `<hyperlinks>${links.map((link, i) => `<hyperlink ref="${link.ref}" r:id="rId${i + 1}"/>`).join('')}</hyperlinks>`
      : '') +
    `</worksheet>`;

  const sheetRels =
    `${xmlHeader}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    links
      .map(
        (link, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${xmlEscape(link.url)}" TargetMode="External"/>`
      )
      .join('') +
    `</Relationships>`;

  const files: Record<string, string> = {
    '[Content_Types].xml':
      `${xmlHeader}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
      `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
      `</Types>`,
    '_rels/.rels':
      `${xmlHeader}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
      `</Relationships>`,
    'xl/workbook.xml':
      `${xmlHeader}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<sheets><sheet name="Radar de Mercado" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels':
      `${xmlHeader}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
      `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      `</Relationships>`,
    'xl/styles.xml':
      `${xmlHeader}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
      `<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font>` +
      `<font><u/><sz val="11"/><color rgb="FF0563C1"/><name val="Calibri"/></font></fonts>` +
      `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
      `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
      `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
      `<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
      `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
      `<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>` +
      `</styleSheet>`,
    'xl/worksheets/sheet1.xml': sheet,
  };
  if (links.length) files['xl/worksheets/_rels/sheet1.xml.rels'] = sheetRels;
  return files;
}

export async function exportLeadsToExcel(leads: RadarLead[]): Promise<void> {
  const { zipSync, strToU8 } = await import('fflate');
  const entries: Record<string, Uint8Array> = {};
  for (const [path, content] of Object.entries(buildXlsxFiles(leads))) {
    entries[path] = strToU8(content);
  }
  const zipped = zipSync(entries, { level: 6 });
  downloadBlob(
    new Blob([zipped], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${fileBaseName(leads)}.xlsx`
  );
}

/** As fontes padrão do PDF só cobrem o alfabeto latino; emojis viram espaço. */
function pdfText(value: string): string {
  return value.replace(/[^ -ÿ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function shortUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
}

export async function buildLeadsPdf(leads: RadarLead[]) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 10;

  const columns: Array<{ title: string; width: number; text: (l: RadarLead) => string; link?: (l: RadarLead) => string }> = [
    { title: 'Empresa', width: 66, text: (l) => l.companyName },
    { title: 'Telefone', width: 34, text: (l) => l.phone },
    { title: 'WhatsApp', width: 38, text: (l) => (l.whatsapp ? formatWhatsApp(l.whatsapp) : ''), link: (l) => l.whatsappLink },
    { title: 'Site', width: 58, text: (l) => shortUrl(l.website), link: (l) => l.website },
    { title: 'Instagram', width: 50, text: (l) => shortUrl(l.instagram).replace(/^instagram\.com\//i, '@'), link: (l) => l.instagram },
    { title: 'Google', width: 31, text: (l) => (l.rating === null ? 'sem nota' : `${l.rating.toFixed(1)} (${l.reviewsCount})`), link: (l) => l.googleProfile },
  ];

  const first = leads[0];
  let y = margin;
  let page = 1;

  const drawHeader = () => {
    doc.setFillColor(9, 13, 22);
    doc.rect(0, 0, pageWidth, 24, 'F');
    doc.setTextColor(226, 183, 85);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ATLAS DIGITAL - RADAR DE MERCADO', margin, 11);
    doc.setTextColor(220, 220, 220);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      pdfText(`${first?.segment || ''} em ${first?.city || ''}${first?.state ? `/${first.state}` : ''} - ${leads.length} empresas - ${new Date().toLocaleDateString('pt-BR')}`),
      margin,
      18
    );
    doc.text(`Página ${page}`, pageWidth - margin, 18, { align: 'right' });

    y = 31;
    doc.setFillColor(235, 235, 235);
    doc.rect(margin, y - 5, pageWidth - margin * 2, 7, 'F');
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    let x = margin + 1.5;
    for (const col of columns) {
      doc.text(col.title, x, y);
      x += col.width;
    }
    y += 7;
  };

  drawHeader();
  doc.setFont('helvetica', 'normal');

  for (const lead of leads) {
    doc.setFontSize(8.5);
    const cells = columns.map((col) => {
      const lines: string[] = doc.splitTextToSize(pdfText(col.text(lead)) || '-', col.width - 3);
      return lines.slice(0, 2);
    });
    const rowHeight = Math.max(...cells.map((lines) => lines.length)) * 4 + 3.5;

    if (y + rowHeight > pageHeight - margin) {
      doc.addPage();
      page++;
      drawHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
    }

    let x = margin + 1.5;
    columns.forEach((col, i) => {
      const url = col.link?.(lead);
      const hasText = cells[i][0] !== '-';
      if (url && hasText) {
        doc.setTextColor(5, 99, 193);
        cells[i].forEach((line, lineIndex) => doc.textWithLink(line, x, y + lineIndex * 4, { url }));
      } else {
        doc.setTextColor(40, 40, 40);
        doc.text(cells[i], x, y);
      }
      x += col.width;
    });

    y += rowHeight;
    doc.setDrawColor(225, 225, 225);
    doc.line(margin, y - 4.5, pageWidth - margin, y - 4.5);
  }

  return doc;
}

export async function exportLeadsToPdf(leads: RadarLead[]): Promise<void> {
  const doc = await buildLeadsPdf(leads);
  doc.save(`${fileBaseName(leads)}.pdf`);
}
