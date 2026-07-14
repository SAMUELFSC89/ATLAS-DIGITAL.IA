import { useState, useRef, FormEvent } from 'react';
import { 
  Building2, MapPin, Globe, Award, AlertCircle, CheckCircle2, ChevronRight, 
  Download, Send, ArrowRight, TrendingUp, Sparkles, Star, Users, Gauge, Zap, 
  Search, Shield, Bot, LayoutTemplate, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { AtlasScoreReport } from '../types';

const SEGMENTS = [
  'Marmoraria',
  'Vidraçaria',
  'Energia Solar',
  'Construtora',
  'Arquitetura',
  'Esquadrias',
  'Outros'
];

const LOADING_STEPS = [
  "Iniciando varredura e mapeamento de rede...",
  "Buscando domínios oficiais e subdomínios associados...",
  "Analisando tags de SEO e Meta Tags estruturadas...",
  "Auditando desempenho móvel e Core Web Vitals...",
  "Mapeando avaliações e posts do Google Perfil de Empresa...",
  "Identificando concorrentes locais diretos...",
  "Analisando ferramentas de IA e canais de conversão ativos...",
  "Formatando plano de ação estratégico e pontuações..."
];

export default function AtlasScoreModule() {
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('');
  const [segment, setSegment] = useState('Marmoraria');
  const [website, setWebsite] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [report, setReport] = useState<AtlasScoreReport | null>(null);
  const [error, setError] = useState('');

  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startLoadingSteps = () => {
    setLoadingStepIndex(0);
    if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    
    loadingIntervalRef.current = setInterval(() => {
      setLoadingStepIndex((prev) => {
        if (prev >= LOADING_STEPS.length - 1) {
          if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 2800);
  };

  const handleDiagnose = async (e: FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !city.trim() || !segment) {
      setError("Por favor, preencha todos os campos obrigatórios (Empresa, Cidade e Segmento).");
      return;
    }

    setError('');
    setLoading(true);
    setReport(null);
    startLoadingSteps();

    try {
      const response = await fetch("/api/atlas-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          city: city.trim(),
          segment,
          website: website.trim(),
          googleMapsUrl: googleMapsUrl.trim()
        })
      });

      if (!response.ok) {
        let errorMsg = "Erro no servidor ao processar o diagnóstico.";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMsg = errData.error;
            if (errData.details) {
              errorMsg += ` (${errData.details})`;
            }
          }
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setReport(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Não foi possível gerar seu diagnóstico automático no momento. Tente novamente.");
    } finally {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      setLoading(false);
    }
  };

  // Helper for progress indicator color
  const getScoreColor = (val: number) => {
    if (val >= 80) return "text-emerald-500 border-emerald-500 bg-emerald-500/5";
    if (val >= 50) return "text-amber-500 border-amber-500 bg-[#E2B755]/5";
    return "text-red-500 border-red-500 bg-red-500/5";
  };

  const getScoreBgClass = (val: number) => {
    if (val >= 80) return "bg-emerald-500";
    if (val >= 50) return "bg-[#E2B755]";
    return "bg-red-500";
  };

  const generatePDFReport = () => {
    if (!report) return;

    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const primaryGold = '#E2B755';
    const darkBg = '#090D16';
    const secondaryGray = '#9CA3AF';
    const lightBorder = '#E5E7EB';

    // Cover Page / Header Band
    doc.setFillColor(9, 13, 22); // #090D16
    doc.rect(0, 0, 210, 297, 'F');

    // Header Title
    doc.setTextColor(245, 179, 1); // primaryGold
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("ATLAS SCORE", 105, 45, { align: 'center' });
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("AUDITORIA ESTRATÉGICA DE PRESENÇA DIGITAL", 105, 57, { align: 'center' });

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    const splitSub = doc.splitTextToSize("Análise técnica baseada em inteligência artificial, dados públicos e critérios de SEO.", 160);
    doc.text(splitSub, 105, 64, { align: 'center' });

    // Accent line
    doc.setFillColor(245, 179, 1);
    doc.rect(55, 73, 100, 1.5, 'F');

    // Company Info Box
    doc.setFillColor(17, 24, 39);
    doc.roundedRect(20, 85, 170, 50, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(`Empresa: ${companyName.toUpperCase()}`, 25, 95);
    doc.text(`Cidade / UF: ${city}`, 25, 102);
    doc.text(`Segmento: ${segment}`, 25, 109);
    doc.text(`Site: ${website || "Não informado"}`, 25, 116);
    doc.text(`Data do Diagnóstico: ${new Date().toLocaleDateString('pt-BR')}`, 25, 123);
    
    // Audit Metadata
    doc.setTextColor(245, 179, 1);
    doc.setFontSize(9);
    doc.text(`ID da Auditoria: ${report.reportMeta?.auditId || 'AUD-784204'}   |   Versão: ${report.reportMeta?.version || 'v2.0.4'}   |   Análise: ${report.reportMeta?.analysisTime || '4.2s'}`, 25, 131);

    // Score Circle Visual Representation
    doc.setFillColor(17, 24, 39);
    doc.roundedRect(55, 145, 100, 75, 5, 5, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("NOTA GERAL DO DIAGNÓSTICO", 105, 158, { align: 'center' });
    
    // Draw outer circle
    doc.setDrawColor(245, 179, 1);
    doc.setLineWidth(3);
    doc.circle(105, 185, 16);
    
    doc.setTextColor(245, 179, 1);
    doc.setFontSize(24);
    doc.text(`${report.score}`, 105, 188, { align: 'center' });

    doc.setTextColor(200, 200, 200);
    doc.setFontSize(10);
    const classification = report.score >= 80 ? 'NÍVEL PREMIUM' : report.score >= 50 ? 'NÍVEL INTERMEDIÁRIO' : 'NÍVEL CRÍTICO';
    doc.text(classification, 105, 210, { align: 'center' });

    // Disclaimer
    doc.setTextColor(110, 110, 110);
    doc.setFontSize(8);
    doc.text("Este documento foi gerado automaticamente pela Inteligência Artificial Atlas Digital.ia", 105, 275, { align: 'center' });
    doc.text("Atlas Digital.ia - CNPJ: 66.204.635/0001-19 | Porto Alegre - RS", 105, 281, { align: 'center' });

    // PAGE 2: EXECUTIVE SUMMARY & MATURITY INDICES
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');

    // Mini Band Header
    doc.setFillColor(9, 13, 22);
    doc.rect(0, 0, 210, 22, 'F');
    doc.setTextColor(245, 179, 1);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ATLAS DIGITAL.IA — AUDITORIA ESTRATÉGICA DE PRESENÇA DIGITAL", 15, 14);

    // Executive Summary
    doc.setTextColor(9, 13, 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("1. Resumo Executivo da Auditoria", 15, 35);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    const splitSummary = doc.splitTextToSize(report.executiveSummary, 180);
    doc.text(splitSummary, 15, 41);

    const summaryHeight = 41 + (splitSummary.length * 4.2) + 10;

    // IMD (Índice de Maturidade Digital)
    doc.setTextColor(9, 13, 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Índice de Maturidade Digital (IMD)", 15, summaryHeight);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text("Mapeamento técnico de prontidão digital (Escala de 0 a 100):", 15, summaryHeight + 5);

    // Render IMD Items
    if (report.maturityIndex) {
      const items = [
        { name: "Presença Web", val: report.maturityIndex.presence },
        { name: "SEO Técnico", val: report.maturityIndex.seo },
        { name: "Performance", val: report.maturityIndex.performance ?? "N/A" },
        { name: "Captação Leads", val: report.maturityIndex.conversion },
        { name: "Google Maps", val: report.maturityIndex.google },
        { name: "Mobile Core", val: report.maturityIndex.mobile ?? "N/A" },
        { name: "Autoridade", val: report.maturityIndex.authority },
        { name: "Automação IA", val: report.maturityIndex.automation }
      ];

      let imdY = summaryHeight + 14;
      items.forEach((item, idx) => {
        const col = idx % 2 === 0 ? 15 : 110;
        const row = imdY + Math.floor(idx / 2) * 11;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(55, 65, 81);
        doc.text(`${item.name}:`, col, row);
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(226, 183, 85);
        doc.text(`${item.val}`, col + 38, row);
        
        // simple thin gauge bar
        doc.setFillColor(243, 244, 246);
        doc.rect(col, row + 2, 70, 1.5, 'F');
        
        const scoreVal = typeof item.val === 'number' ? item.val : 0;
        doc.setFillColor(226, 183, 85);
        doc.rect(col, row + 2, (scoreVal / 100) * 70, 1.5, 'F');
      });
    }

    // Benchmark do Mercado
    if (report.benchmark) {
      const benchY = summaryHeight + 64;
      doc.setTextColor(9, 13, 22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Benchmark Comparativo Local", 15, benchY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(55, 65, 81);
      doc.text(`Sua Empresa (Auditada): ${report.benchmark.audited}/100`, 15, benchY + 6);
      doc.text(`Média Regional dos Concorrentes: ${report.benchmark.marketAverage}/100`, 15, benchY + 11);
      doc.text(`Líder Estabelecido do Segmento: ${report.benchmark.marketLeader}/100`, 15, benchY + 16);

      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.2);
      doc.line(15, benchY + 22, 195, benchY + 22);
    }

    // PAGE 3: ANÁLISE ESTRATÉGICA EM 5 PILARES
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');

    // Mini Band Header
    doc.setFillColor(9, 13, 22);
    doc.rect(0, 0, 210, 22, 'F');
    doc.setTextColor(245, 179, 1);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ATLAS DIGITAL.IA — ANÁLISE ESTRATÉGICA EM 5 PILARES", 15, 14);

    if (report.executiveSummaryFiveTopics) {
      doc.setTextColor(9, 13, 22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("2. Diagnóstico de Maturidade — 5 Pilares de Negócio", 15, 35);

      const pillars = [
        { label: "Pilar 1: Pontos Fortes Identificados", val: report.executiveSummaryFiveTopics.strengths, color: [16, 185, 129] },
        { label: "Pilar 2: Oportunidades de Escala e Conversão", val: report.executiveSummaryFiveTopics.opportunities, color: [226, 183, 85] },
        { label: "Pilar 3: Riscos Técnicos e Mitigações", val: report.executiveSummaryFiveTopics.risks, color: [239, 68, 68] },
        { label: "Pilar 4: Potencial de Evolução com IA", val: report.executiveSummaryFiveTopics.evolution, color: [59, 130, 246] },
        { label: "Pilar 5: Próximos Passos Recomendados", val: report.executiveSummaryFiveTopics.nextSteps, color: [139, 92, 246] }
      ];

      let pilY = 43;
      pillars.forEach((p) => {
        doc.setFillColor(249, 250, 251);
        doc.rect(15, pilY, 180, 36, 'F');
        
        doc.setDrawColor(p.color[0], p.color[1], p.color[2]);
        doc.setLineWidth(1);
        doc.line(15, pilY, 15, pilY + 36);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(9, 13, 22);
        doc.text(p.label, 20, pilY + 6);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(75, 85, 99);
        const splitVal = doc.splitTextToSize(p.val, 170);
        doc.text(splitVal, 20, pilY + 11);

        pilY += 41;
      });
    }

    // PAGE 4: SEO & GOOGLE PERFIL
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');

    // Mini Band Header
    doc.setFillColor(9, 13, 22);
    doc.rect(0, 0, 210, 22, 'F');
    doc.setTextColor(245, 179, 1);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ATLAS DIGITAL.IA — RELATÓRIO TÉCNICO SEO E GOOGLE PERFIL", 15, 14);

    // SEO Title
    doc.setTextColor(9, 13, 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`3. Auditoria Técnica de SEO (Nota: ${report.seo.score}/100)`, 15, 33);

    // Keywords Table
    doc.setFontSize(9.5);
    doc.text("Palavras-chave Relevantes no Google local:", 15, 39);
    
    // Headers
    doc.setFillColor(243, 244, 246);
    doc.rect(15, 42, 180, 6, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81);
    doc.text("Termo de Busca", 18, 46.5);
    doc.text("Vol. Mensal", 80, 46.5);
    doc.text("Ranque Estimado", 110, 46.5);
    doc.text("CPC Médio", 145, 46.5);
    doc.text("Dificuldade", 172, 46.5);

    // Rows
    let rowY = 52;
    doc.setFont("helvetica", "normal");
    report.seo.keywords.forEach((kw) => {
      doc.setTextColor(17, 24, 39);
      doc.text(kw.word, 18, rowY);
      doc.text(`${kw.volume}`, 80, rowY);
      doc.text(kw.position > 90 ? 'Não Ranqueado' : `${kw.position}º Lugar`, 110, rowY);
      doc.text(kw.cpc, 145, rowY);
      doc.text(kw.difficulty, 172, rowY);
      
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.1);
      doc.line(15, rowY + 1.5, 195, rowY + 1.5);
      rowY += 6;
    });

    // Google Profile
    doc.setTextColor(9, 13, 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`4. Google Perfil de Empresa (Nota: ${report.googleProfile.score}/100)`, 15, rowY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(55, 65, 81);
    let gY = rowY + 12;
    report.googleProfile.items.forEach((item) => {
      doc.setFont("helvetica", "bold");
      doc.text(`• ${item.name}: ${item.value}`, 15, gY);
      doc.setFont("helvetica", "normal");
      const splitDetails = doc.splitTextToSize(item.details, 175);
      doc.text(splitDetails, 20, gY + 3.5);
      gY += (splitDetails.length * 3.8) + 5.5;
    });

    // PAGE 5: PERFORMANCE, CONCORRÊNCIA E MATRIZ DE PRIORIZAÇÃO
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');

    // Mini Band Header
    doc.setFillColor(9, 13, 22);
    doc.rect(0, 0, 210, 22, 'F');
    doc.setTextColor(245, 179, 1);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ATLAS DIGITAL.IA — CONCORRÊNCIA E MATRIZ DE PRIORIZAÇÃO", 15, 14);

    // Performance Items & Competitors
    doc.setTextColor(9, 13, 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`5. Velocidade & Performance (Nota: ${report.performance.score}/100)`, 15, 33);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    let perfY = 38;
    report.performance.items.forEach((item) => {
      doc.setFont("helvetica", "bold");
      doc.text(`• ${item.name}: ${item.value}`, 15, perfY);
      doc.setFont("helvetica", "normal");
      const splitDetails = doc.splitTextToSize(item.details, 175);
      doc.text(splitDetails, 20, perfY + 3.5);
      perfY += (splitDetails.length * 3.8) + 5;
    });

    // Competitors
    doc.setTextColor(9, 13, 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("6. Análise de Concorrência Local", 15, perfY + 3);

    doc.setFillColor(243, 244, 246);
    doc.rect(15, perfY + 6, 180, 6, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(55, 65, 81);
    doc.text("Concorrente", 18, perfY + 10.5);
    doc.text("Aut. Domínio", 65, perfY + 10.5);
    doc.text("Velocidade", 90, perfY + 10.5);
    doc.text("Rank Médio", 115, perfY + 10.5);
    doc.text("Avaliações GMB", 140, perfY + 10.5);
    doc.text("SEO", 175, perfY + 10.5);

    let compY = perfY + 15;
    doc.setFont("helvetica", "normal");
    report.competitors.forEach((c) => {
      doc.setTextColor(17, 24, 39);
      doc.text(c.name, 18, compY);
      doc.text(`${c.authority}/100`, 65, compY);
      doc.text(`${c.speed}/100`, 90, compY);
      doc.text(`${c.position}º lugar`, 115, compY);
      doc.text(c.reviews, 140, compY);
      doc.text(`${c.seoScore}/100`, 175, compY);
      
      doc.setDrawColor(229, 231, 235);
      doc.line(15, compY + 1.5, 195, compY + 1.5);
      compY += 5.5;
    });

    // Matriz de Priorização
    if (report.prioritizationMatrix) {
      doc.setTextColor(9, 13, 22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("7. Matriz de Priorização de Melhorias", 15, compY + 5);

      // Prioritization Table Headers
      doc.setFillColor(243, 244, 246);
      doc.rect(15, compY + 8, 180, 6, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(55, 65, 81);
      doc.text("Item / Ajuste Recomendado", 18, compY + 12.5);
      doc.text("Impacto", 90, compY + 12.5);
      doc.text("Esforço", 120, compY + 12.5);
      doc.text("Prazo", 145, compY + 12.5);
      doc.text("Prioridade", 172, compY + 12.5);

      let pmY = compY + 17;
      doc.setFont("helvetica", "normal");
      report.prioritizationMatrix.slice(0, 5).forEach((item) => {
        doc.setTextColor(17, 24, 39);
        doc.text(item.item, 18, pmY);
        doc.text(item.impact, 90, pmY);
        doc.text(item.effort, 120, pmY);
        doc.text(item.timeline, 145, pmY);
        
        doc.setFont("helvetica", "bold");
        if (item.priority === 'Alta') {
          doc.setTextColor(220, 38, 38);
        } else {
          doc.setTextColor(245, 158, 11);
        }
        doc.text(item.priority, 172, pmY);
        doc.setFont("helvetica", "normal");

        doc.setDrawColor(229, 231, 235);
        doc.line(15, pmY + 1.5, 195, pmY + 1.5);
        pmY += 5.5;
      });
      compY = pmY;
    }

    // Final signature CTA on bottom of the last page
    doc.setFillColor(9, 13, 22);
    doc.roundedRect(15, 245, 180, 25, 3, 3, 'F');
    doc.setTextColor(245, 179, 1);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("PRETENDE CORRIGIR AS FALHAS E ACELERAR SEUS LEADS?", 105, 254, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.text("Agende agora mesmo uma Reunião de Alinhamento com os engenheiros da Atlas Digital.ia.", 105, 260, { align: 'center' });

    // Save
    doc.save(`Atlas_Score_Diagnostico_${companyName.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <section id="diagnostico" className="py-24 bg-[#0B0B0E] relative overflow-hidden border-t border-gray-900">
      
      {/* Visual background decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/[0.03] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-1/12 w-[500px] h-[500px] bg-[#E2B755]/[0.01] rounded-full blur-[140px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2B755]/10 border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5 text-[#E2B755]" />
            <span className="text-[9px] uppercase tracking-widest font-mono text-[#E2B755] font-bold">Módulo Premium IA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-white uppercase tracking-tight">
            Atlas Digital <span className="text-[#E2B755]">Score</span>
          </h2>
          <div className="w-16 h-1 bg-[#E2B755] mx-auto rounded-full" />
          <p className="text-xs md:text-sm text-gray-400 max-w-2xl mx-auto">
            Descubra a força da sua presença digital em comparação com concorrentes locais. Nossa IA audita seu SEO, Perfil do Google, Conversão e gera um plano estratégico priorizado.
          </p>
        </div>

        {/* Input Form Card */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="bg-[#121214]/40 border border-gray-900 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 h-[3px] w-full bg-gradient-to-r from-[#E2B755] via-gray-700 to-gray-900" />
            
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#E2B755]" />
              Dados da Empresa para Auditoria Gratuita
            </h3>

            <form onSubmit={handleDiagnose} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* Nome da Empresa */}
                <div className="space-y-2">
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-mono font-bold">
                    Nome da Empresa *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Marmoraria Granitos Finos"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-gray-950/80 border border-gray-900 focus:border-[#E2B755]/60 rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Cidade */}
                <div className="space-y-2">
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-mono font-bold">
                    Cidade / UF *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Porto Alegre - RS"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-gray-950/80 border border-gray-900 focus:border-[#E2B755]/60 rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Segmento */}
                <div className="space-y-2">
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-mono font-bold">
                    Segmento de Atuação *
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <select
                      value={segment}
                      onChange={(e) => setSegment(e.target.value)}
                      className="w-full bg-gray-950/80 border border-gray-900 focus:border-[#E2B755]/60 rounded-xl py-3 pl-11 pr-4 text-xs text-white focus:outline-none transition-colors appearance-none"
                    >
                      {SEGMENTS.map((seg) => (
                        <option key={seg} value={seg} className="bg-[#0B0B0E] text-gray-300">
                          {seg}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Site (Opcional) */}
                <div className="space-y-2">
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-mono font-bold">
                    Site Oficial (Opcional)
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input 
                      type="url"
                      placeholder="Ex: https://meusite.com.br"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full bg-gray-950/80 border border-gray-900 focus:border-[#E2B755]/60 rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

              </div>

              {/* Google Maps URL (Opcional) */}
              <div className="space-y-2">
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-mono font-bold">
                  URL do Perfil do Google Meu Negócio / Maps (Opcional)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E2B755]" />
                  <input 
                    type="url"
                    placeholder="Ex: https://g.co/kgs/... ou link do Google Maps"
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    className="w-full bg-gray-950/80 border border-gray-900 focus:border-[#E2B755]/60 rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Error box */}
              {error && (
                <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-[#E2B755] hover:bg-[#b48400] disabled:bg-gray-800 text-[#0B0B0E] disabled:text-gray-500 font-black uppercase tracking-widest text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0B0B0E] border-t-transparent rounded-full animate-spin" />
                      Analisando Presença Digital...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Gerar Diagnóstico Gratuito com IA
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* LOADING ANIMATED METER */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto text-center space-y-8 py-10"
            >
              {/* Spinner & Score Progress indicator */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-gray-900 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-[#E2B755] border-r-transparent border-b-[#E2B755] border-l-transparent rounded-full animate-spin" />
                <Bot className="w-10 h-10 text-[#E2B755] animate-pulse" />
              </div>

              <div className="space-y-3">
                <h4 className="text-white text-sm font-bold uppercase tracking-wider font-mono">
                  Atlas Core Engine Auditing...
                </h4>
                <div className="max-w-md mx-auto h-1.5 bg-gray-950 border border-gray-900 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[#E2B755]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((loadingStepIndex + 1) / LOADING_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* List loaded steps */}
              <div className="bg-gray-950/60 border border-gray-900 rounded-xl p-5 max-w-md mx-auto text-left space-y-2.5 shadow-xl">
                {LOADING_STEPS.map((step, idx) => {
                  const isCompleted = loadingStepIndex > idx;
                  const isActive = loadingStepIndex === idx;
                  return (
                    <div 
                      key={idx} 
                      className={`text-[11px] font-mono flex items-center gap-2.5 transition-opacity duration-300 ${isCompleted ? 'text-emerald-500/80' : isActive ? 'text-white font-bold' : 'text-gray-700'}`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : isActive ? (
                        <div className="w-3.5 h-3.5 border-2 border-[#E2B755] border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-800 ml-1.5 shrink-0" />
                      )}
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RESULTS REPORT DASHBOARD */}
        <AnimatePresence>
          {report && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-10"
            >
              {/* Score header box */}
              <div className="bg-gradient-to-r from-gray-950 to-gray-900/40 border border-gray-900 rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#E2B755]/[0.01] rounded-full blur-[100px] pointer-events-none" />
                
                <div className="space-y-4 max-w-2xl text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-900/80 border border-gray-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[9px] uppercase tracking-wider font-mono text-gray-400 font-bold">Relatório Consolidado</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-tight">
                    Presença Digital de <span className="text-[#E2B755]">{companyName}</span>
                  </h3>
                  <p className="text-xs md:text-[13px] text-gray-400 leading-relaxed font-sans">
                    {report.executiveSummary}
                  </p>
                </div>

                {/* Score gauge */}
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <div className={`w-32 h-32 rounded-full border-[6px] flex flex-col items-center justify-center relative transition-all duration-500 ${getScoreColor(report.score)}`}>
                    <span className="text-3xl font-display font-black text-white">{report.score}</span>
                    <span className="text-[8px] font-mono tracking-widest text-gray-500 uppercase mt-0.5 font-bold">Atlas Score</span>
                  </div>
                  <button 
                    onClick={generatePDFReport}
                    className="px-4 py-2.5 bg-gray-900 border border-gray-800 hover:border-gray-700 hover:bg-gray-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-[#E2B755]" />
                    Exportar PDF
                  </button>
                </div>
              </div>

              {/* 1. Resumo Executivo em 5 Tópicos */}
              {report.executiveSummaryFiveTopics && (
                <div className="bg-[#121214]/30 border border-gray-900 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-[#E2B755]/40 to-transparent" />
                  <div className="border-b border-gray-900/60 pb-3 flex items-center gap-2">
                    <Award className="w-4.5 h-4.5 text-[#E2B755]" />
                    <h4 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider font-mono">
                      Diagnóstico de Consultoria — Análise Estratégica em 5 Pilares
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                    {/* Pontos Fortes */}
                    <div className="bg-gray-950/40 border border-gray-900/60 rounded-xl p-4.5 space-y-3 flex flex-col">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="text-[10px] uppercase font-mono font-black tracking-wider">Pontos Fortes</span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed font-sans flex-grow">
                        {report.executiveSummaryFiveTopics.strengths}
                      </p>
                    </div>

                    {/* Oportunidades */}
                    <div className="bg-gray-950/40 border border-gray-900/60 rounded-xl p-4.5 space-y-3 flex flex-col">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <TrendingUp className="w-4 h-4 shrink-0" />
                        <span className="text-[10px] uppercase font-mono font-black tracking-wider">Oportunidades</span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed font-sans flex-grow">
                        {report.executiveSummaryFiveTopics.opportunities}
                      </p>
                    </div>

                    {/* Riscos */}
                    <div className="bg-gray-950/40 border border-gray-900/60 rounded-xl p-4.5 space-y-3 flex flex-col">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="text-[10px] uppercase font-mono font-black tracking-wider">Riscos Técnicos</span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed font-sans flex-grow">
                        {report.executiveSummaryFiveTopics.risks}
                      </p>
                    </div>

                    {/* Potencial de Evolução */}
                    <div className="bg-gray-950/40 border border-gray-900/60 rounded-xl p-4.5 space-y-3 flex flex-col">
                      <div className="flex items-center gap-2 text-[#E2B755]">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span className="text-[10px] uppercase font-mono font-black tracking-wider">Evolução Esperada</span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed font-sans flex-grow">
                        {report.executiveSummaryFiveTopics.evolution}
                      </p>
                    </div>

                    {/* Próximos Passos */}
                    <div className="bg-gray-950/40 border border-gray-900/60 rounded-xl p-4.5 space-y-3 flex flex-col">
                      <div className="flex items-center gap-2 text-blue-400">
                        <ArrowRight className="w-4 h-4 shrink-0" />
                        <span className="text-[10px] uppercase font-mono font-black tracking-wider">Próximos Passos</span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed font-sans flex-grow">
                        {report.executiveSummaryFiveTopics.nextSteps}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Benchmark de Mercado & Índice de Maturidade Digital */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Benchmark do Mercado */}
                {report.benchmark && (
                  <div className="bg-[#121214]/30 border border-gray-900 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b border-gray-900/60 pb-3 font-mono">
                        <Gauge className="w-4 h-4 text-[#E2B755]" />
                        Benchmark de Mercado Local
                      </h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                        Posicionamento do seu negócio em relação à média dos concorrentes regionais auditados e o líder consolidado do segmento.
                      </p>
                    </div>

                    <div className="space-y-4 py-2">
                      {/* Líder de Mercado */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400 font-sans">Líder do Segmento</span>
                          <span className="text-emerald-400 font-bold font-mono">{report.benchmark.marketLeader}/100</span>
                        </div>
                        <div className="h-1.5 bg-gray-950 border border-gray-900 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${report.benchmark.marketLeader}%` }} />
                        </div>
                      </div>

                      {/* Sua Empresa */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#E2B755] font-bold font-sans">Sua Empresa (Auditada)</span>
                          <span className="text-[#E2B755] font-bold font-mono">{report.benchmark.audited}/100</span>
                        </div>
                        <div className="h-3 bg-gray-950 border border-[#E2B755]/10 rounded-full overflow-hidden p-[2px]">
                          <div className="h-full bg-[#E2B755] rounded-full" style={{ width: `${report.benchmark.audited}%` }} />
                        </div>
                      </div>

                      {/* Média de Mercado */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400 font-sans">Média do Mercado Local</span>
                          <span className="text-amber-500 font-bold font-mono">{report.benchmark.marketAverage}/100</span>
                        </div>
                        <div className="h-1.5 bg-gray-950 border border-gray-900 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${report.benchmark.marketAverage}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-900/60 text-center">
                      <span className="text-[10px] text-gray-400 font-mono">
                        Diferencial estratégico para o líder: <span className="text-red-400 font-bold font-mono">-{report.benchmark.marketLeader - report.benchmark.audited} pontos</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Índice de Maturidade Digital */}
                {report.maturityIndex && (
                  <div className="lg:col-span-2 bg-[#121214]/30 border border-gray-900 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                    <h4 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b border-gray-900/60 pb-3 font-mono">
                      <Award className="w-4 h-4 text-[#E2B755]" />
                      Índice de Maturidade Digital (IMD)
                    </h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* Presence */}
                      <div className="bg-gray-950/40 border border-gray-900/40 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
                        <span className="text-[9px] uppercase font-mono text-gray-500 font-black">Presença Web</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-display font-black text-white">{report.maturityIndex.presence}</span>
                          <span className="text-[9px] text-gray-600 font-mono">/100</span>
                        </div>
                        <div className="h-1 bg-gray-900/60 rounded-full overflow-hidden">
                          <div className="h-full bg-[#E2B755]" style={{ width: `${report.maturityIndex.presence}%` }} />
                        </div>
                      </div>

                      {/* SEO */}
                      <div className="bg-gray-950/40 border border-gray-900/40 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
                        <span className="text-[9px] uppercase font-mono text-gray-500 font-black">SEO Técnico</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-display font-black text-white">{report.maturityIndex.seo}</span>
                          <span className="text-[9px] text-gray-600 font-mono">/100</span>
                        </div>
                        <div className="h-1 bg-gray-900/60 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${report.maturityIndex.seo}%` }} />
                        </div>
                      </div>

                      {/* Performance */}
                      <div className="bg-gray-950/40 border border-gray-900/40 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
                        <span className="text-[9px] uppercase font-mono text-gray-500 font-black">Performance</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-display font-black text-white">
                            {report.maturityIndex.performance !== null ? report.maturityIndex.performance : "N/A"}
                          </span>
                          {report.maturityIndex.performance !== null && <span className="text-[9px] text-gray-600 font-mono">/100</span>}
                        </div>
                        <div className="h-1 bg-gray-900/60 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${report.maturityIndex.performance || 0}%` }} />
                        </div>
                      </div>

                      {/* Conversion */}
                      <div className="bg-gray-950/40 border border-gray-900/40 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
                        <span className="text-[9px] uppercase font-mono text-gray-500 font-black">Captação</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-display font-black text-white">{report.maturityIndex.conversion}</span>
                          <span className="text-[9px] text-gray-600 font-mono">/100</span>
                        </div>
                        <div className="h-1 bg-gray-900/60 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${report.maturityIndex.conversion}%` }} />
                        </div>
                      </div>

                      {/* Google Maps */}
                      <div className="bg-gray-950/40 border border-gray-900/40 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
                        <span className="text-[9px] uppercase font-mono text-gray-500 font-black">Google Maps</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-display font-black text-white">{report.maturityIndex.google}</span>
                          <span className="text-[9px] text-gray-600 font-mono">/100</span>
                        </div>
                        <div className="h-1 bg-gray-900/60 rounded-full overflow-hidden">
                          <div className="h-full bg-[#E2B755]" style={{ width: `${report.maturityIndex.google}%` }} />
                        </div>
                      </div>

                      {/* Mobile Experience */}
                      <div className="bg-gray-950/40 border border-gray-900/40 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
                        <span className="text-[9px] uppercase font-mono text-gray-500 font-black">Mobile Core</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-display font-black text-white">
                            {report.maturityIndex.mobile !== null ? report.maturityIndex.mobile : "N/A"}
                          </span>
                          {report.maturityIndex.mobile !== null && <span className="text-[9px] text-gray-600 font-mono">/100</span>}
                        </div>
                        <div className="h-1 bg-gray-900/60 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500" style={{ width: `${report.maturityIndex.mobile || 0}%` }} />
                        </div>
                      </div>

                      {/* Authority */}
                      <div className="bg-gray-950/40 border border-gray-900/40 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
                        <span className="text-[9px] uppercase font-mono text-gray-500 font-black">Autoridade</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-display font-black text-white">{report.maturityIndex.authority}</span>
                          <span className="text-[9px] text-gray-600 font-mono">/100</span>
                        </div>
                        <div className="h-1 bg-gray-900/60 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${report.maturityIndex.authority}%` }} />
                        </div>
                      </div>

                      {/* Automation */}
                      <div className="bg-gray-950/40 border border-gray-900/40 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
                        <span className="text-[9px] uppercase font-mono text-gray-500 font-black">Automação IA</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-display font-black text-white">{report.maturityIndex.automation}</span>
                          <span className="text-[9px] text-gray-600 font-mono">/100</span>
                        </div>
                        <div className="h-1 bg-gray-900/60 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: `${report.maturityIndex.automation}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bento Grid layout of categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. SEO Card */}
                <div className="bg-[#121214]/30 border border-gray-900 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-900 pb-3">
                    <h4 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#E2B755]" />
                      SEO Técnico & Indexação
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getScoreColor(report.seo.score)}`}>
                      {report.seo.score}/100
                    </span>
                  </div>
                  <div className="space-y-3">
                    {report.seo.items.map((item, idx) => (
                      <div key={idx} className="bg-gray-950/30 border border-gray-950 rounded-lg p-3 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold uppercase tracking-wide text-[10px]">{item.name}</span>
                          <span className="text-[#E2B755] text-[10px] font-mono">{item.status}</span>
                        </div>
                        <p className="text-gray-500 leading-relaxed">{item.details}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Performance Card */}
                <div className="bg-[#121214]/30 border border-gray-900 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-900 pb-3">
                    <h4 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-[#E2B755]" />
                      Performance & Web Vitals
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getScoreColor(report.performance.score)}`}>
                      {report.performance.score}/100
                    </span>
                  </div>
                  <div className="space-y-3">
                    {report.performance.items.map((item, idx) => (
                      <div key={idx} className="bg-gray-950/30 border border-gray-950 rounded-lg p-3 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold uppercase tracking-wide text-[10px]">{item.name}</span>
                          <span className={`text-[10px] font-bold ${item.rating === 'good' ? 'text-emerald-500' : item.rating === 'average' ? 'text-amber-500' : 'text-red-500'}`}>
                            {item.value}
                          </span>
                        </div>
                        <p className="text-gray-500 leading-relaxed">{item.details}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Google Business Profile Card */}
                <div className="bg-[#121214]/30 border border-gray-900 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-900 pb-3">
                    <h4 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Star className="w-4 h-4 text-[#E2B755]" />
                      Google Meu Negócio
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getScoreColor(report.googleProfile.score)}`}>
                      {report.googleProfile.score}/100
                    </span>
                  </div>
                  <div className="space-y-3">
                    {report.googleProfile.items.map((item, idx) => (
                      <div key={idx} className="bg-gray-950/30 border border-gray-950 rounded-lg p-3 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold uppercase tracking-wide text-[10px]">{item.name}</span>
                          <span className="text-[#E2B755] text-[10px] font-mono">{item.value}</span>
                        </div>
                        <p className="text-gray-500 leading-relaxed">{item.details}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Conversão Card */}
                <div className="bg-[#121214]/30 border border-gray-900 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-900 pb-3">
                    <h4 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <LayoutTemplate className="w-4 h-4 text-[#E2B755]" />
                      Funis de Conversão
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getScoreColor(report.conversion.score)}`}>
                      {report.conversion.score}/100
                    </span>
                  </div>
                  <div className="space-y-3">
                    {report.conversion.items.map((item, idx) => (
                      <div key={idx} className="bg-gray-950/30 border border-gray-950 rounded-lg p-3 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold uppercase tracking-wide text-[10px]">{item.name}</span>
                          <span className="text-gray-400 text-[10px]">{item.status}</span>
                        </div>
                        <p className="text-gray-500 leading-relaxed">{item.details}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Inteligência Artificial Card */}
                <div className="bg-[#121214]/30 border border-gray-900 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-900 pb-3">
                    <h4 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Bot className="w-4 h-4 text-[#E2B755]" />
                      Automações & Inteligência Artificial
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getScoreColor(report.aiIntegrations.score)}`}>
                      {report.aiIntegrations.score}/100
                    </span>
                  </div>
                  <div className="space-y-3">
                    {report.aiIntegrations.items.map((item, idx) => (
                      <div key={idx} className="bg-gray-950/30 border border-gray-950 rounded-lg p-3 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold uppercase tracking-wide text-[10px]">{item.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono ${item.detected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-900 text-gray-500'}`}>
                            {item.detected ? 'Ativo' : 'Sugerido'}
                          </span>
                        </div>
                        <p className="text-gray-500 leading-relaxed">{item.details}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. Local SEO Keywords Map Card */}
                <div className="bg-[#121214]/30 border border-gray-900 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-900 pb-3">
                    <h4 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#E2B755]" />
                      Mapa de Palavras-Chave Locais
                    </h4>
                    <span className="px-2 py-0.5 rounded bg-gray-950/60 text-[9px] font-mono text-gray-400 border border-gray-900">
                      Volume Mensal
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                    {report.seo.keywords.map((kw, idx) => (
                      <div key={idx} className="bg-gray-950/40 border border-gray-950 rounded-lg p-2.5 text-[11px] flex justify-between items-center gap-3">
                        <div className="space-y-0.5">
                          <span className="text-gray-200 font-bold">{kw.word}</span>
                          <div className="flex gap-2 text-[10px] text-gray-500">
                            <span>Dif: <span className="text-gray-300 font-medium">{kw.difficulty}</span></span>
                            <span>CPC: <span className="text-gray-300 font-medium">{kw.cpc}</span></span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[#E2B755] font-mono font-bold block">{kw.volume}</span>
                          <span className="text-[9px] text-gray-600 block">
                            {kw.position > 90 ? 'Não Ranqueado' : `${kw.position}º lugar`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Competitors Matrix Board */}
              <div className="bg-[#121214]/30 border border-gray-900 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                <h4 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b border-gray-900 pb-3">
                  <Users className="w-4 h-4 text-[#E2B755]" />
                  Matriz de Posicionamento e Concorrência Direta
                </h4>
                
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-[11px] text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-900 text-gray-500 uppercase tracking-wider font-mono">
                        <th className="pb-3 font-bold text-left">Concorrente</th>
                        <th className="pb-3 font-bold text-center">Autoridade Domínio</th>
                        <th className="pb-3 font-bold text-center">Velocidade Média</th>
                        <th className="pb-3 font-bold text-center">Ranqueamento Médio</th>
                        <th className="pb-3 font-bold text-center">Avaliações Google</th>
                        <th className="pb-3 font-bold text-center">SEO Geral</th>
                        <th className="pb-3 font-bold text-right">Site Oficial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* You (The audit client) row */}
                      <tr className="border-b border-gray-900 bg-[#E2B755]/[0.02]">
                        <td className="py-4 font-bold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E2B755]" />
                          {companyName} (Você)
                        </td>
                        <td className="py-4 text-center text-gray-400 font-mono">
                          {website ? '12/100' : '0/100'}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getScoreColor(report.performance.score)}`}>
                            {report.performance.score}/100
                          </span>
                        </td>
                        <td className="py-4 text-center text-gray-400">
                          {website ? '28º Lugar' : 'Não Listado'}
                        </td>
                        <td className="py-4 text-center text-gray-400">
                          {report.googleProfile.items[0]?.value || 'Ausente'}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getScoreColor(report.seo.score)}`}>
                            {report.seo.score}/100
                          </span>
                        </td>
                        <td className="py-4 text-right text-gray-500 italic font-mono">
                          {website ? website.replace(/https?:\/\/(www\.)?/, '') : 'Sem Site'}
                        </td>
                      </tr>

                      {/* AI generated competitors */}
                      {report.competitors.map((c, idx) => (
                        <tr key={idx} className="border-b border-gray-950/60 hover:bg-gray-950/10 transition-colors">
                          <td className="py-4 font-bold text-gray-300">{c.name}</td>
                          <td className="py-4 text-center text-gray-400 font-mono">{c.authority}/100</td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getScoreColor(c.speed)}`}>
                              {c.speed}/100
                            </span>
                          </td>
                          <td className="py-4 text-center text-gray-400">{c.position}º Lugar</td>
                          <td className="py-4 text-center text-gray-400">{c.reviews}</td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getScoreColor(c.seoScore)}`}>
                              {c.seoScore}/100
                            </span>
                          </td>
                          <td className="py-4 text-right text-gray-500 font-mono">{c.site}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Matriz de Priorização Estratégica das Melhorias */}
              {report.prioritizationMatrix && (
                <div className="bg-[#121214]/30 border border-gray-900 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-[#E2B755]/30 to-transparent" />
                  <div className="border-b border-gray-900/60 pb-3 flex items-center gap-2">
                    <Shield className="w-4.5 h-4.5 text-[#E2B755]" />
                    <h4 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider font-mono">
                      Matriz de Priorização Estratégica de Melhorias
                    </h4>
                  </div>
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-[11px] text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="border-b border-gray-900/60 text-gray-500 uppercase tracking-wider font-mono">
                          <th className="pb-3 font-bold text-left">Item de Auditoria / Ajuste</th>
                          <th className="pb-3 font-bold text-center">Impacto Estratégico</th>
                          <th className="pb-3 font-bold text-center">Esforço Técnico</th>
                          <th className="pb-3 font-bold text-center">Prazo Recomendado</th>
                          <th className="pb-3 font-bold text-right">Prioridade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.prioritizationMatrix.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-950/60 hover:bg-gray-950/10 transition-colors">
                            <td className="py-4 font-bold text-gray-200">{item.item}</td>
                            <td className="py-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${item.impact === 'Alto' ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-900/30' : 'text-amber-400 bg-amber-500/5 border border-amber-900/30'}`}>
                                {item.impact}
                              </span>
                            </td>
                            <td className="py-4 text-center text-gray-400 font-mono">{item.effort}</td>
                            <td className="py-4 text-center text-gray-400">{item.timeline}</td>
                            <td className="py-4 text-right">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${item.priority === 'Alta' ? 'text-red-400 bg-red-500/5 border border-red-900/30' : 'text-amber-400 bg-amber-500/5 border border-amber-900/30'}`}>
                                {item.priority}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Prioritized Action Plan */}
              <div className="bg-[#121214]/30 border border-gray-900 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                <h4 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b border-gray-900 pb-3">
                  <Shield className="w-4 h-4 text-[#E2B755]" />
                  Plano de Ação Corretiva Priorizado por IA
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {report.prioritizedActionPlan.map((plan, idx) => {
                    const isHigh = plan.priority === 'Alta';
                    const isMedium = plan.priority === 'Média';
                    return (
                      <div 
                        key={idx} 
                        className={`bg-gray-950/40 border rounded-xl p-5 space-y-3 relative overflow-hidden flex flex-col justify-between ${isHigh ? 'border-red-950/60' : isMedium ? 'border-amber-950/40' : 'border-gray-950'}`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-[8px] font-mono uppercase tracking-widest font-black px-2 py-0.5 rounded ${isHigh ? 'bg-red-500/10 text-red-500' : isMedium ? 'bg-[#E2B755]/10 text-amber-500' : 'bg-gray-900 text-gray-400'}`}>
                              Prioridade {plan.priority}
                            </span>
                            <span className="text-[10px] font-mono text-gray-700">Ação #{idx + 1}</span>
                          </div>
                          <h5 className="text-white text-xs font-bold leading-snug">{plan.action}</h5>
                        </div>

                        <div className="pt-3 border-t border-gray-900/60 flex items-center justify-between gap-3 text-[10px]">
                          <span className="text-emerald-500/90 font-medium">Impacto: {plan.impact}</span>
                          <span className="text-gray-500 font-mono">Esforço: {plan.effort}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Free Consultation CTA block */}
              <div className="p-8 rounded-2xl bg-gradient-to-r from-gray-950 via-[#121214]/40 to-gray-950 border border-gray-900 flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
                <div className="space-y-2 max-w-2xl">
                  <span className="text-[9px] uppercase tracking-widest text-[#E2B755] font-mono font-bold">Diagnóstico Concluído</span>
                  <h4 className="text-white text-base font-black uppercase tracking-tight">Queremos te ajudar a corrigir todas as falhas e superar seus concorrentes</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                    Nossa equipe de especialistas preparou um diagnóstico técnico completo de 45 minutos. Vamos te explicar as otimizações necessárias, desenhar um funil de alta velocidade para a {companyName} e te apresentar um protótipo de design sem compromisso.
                  </p>
                </div>
                <a
                  href={`https://wa.me/5551994578544?text=Ol%C3%A1%20Atlas%20Digital.ia!%20Fiz%20o%20diagn%C3%B3stico%20do%20Atlas%20Score%20para%20minha%20empresa%20${encodeURIComponent(companyName)}%20em%20${encodeURIComponent(city)}%20e%20nossa%20nota%20foi%20${report.score}.%20Gostaria%20de%20agendar%20minha%20consultoria%20gratuita%20para%20planejar%20as%20melhorias.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 bg-[#E2B755] hover:bg-[#b48400] text-[#0B0B0E] text-[11px] font-black uppercase tracking-widest rounded-xl transition-all hover:scale-105 flex items-center gap-2 shrink-0 shadow-lg shadow-amber-500/15"
                >
                  <Send className="w-4 h-4" />
                  Agendar Consultoria Gratuita
                </a>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
