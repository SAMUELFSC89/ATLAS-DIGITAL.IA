import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, MapPin, Globe, Star, Phone, Mail, Instagram, Facebook, Compass, Check,
  AlertCircle, Plus, Loader2, MessageCircle, FileSpreadsheet, FileText, ExternalLink, Pencil, Send
} from 'lucide-react';
import { Lead, RadarLead } from '../types';
import { ApiError, DEFAULT_APPROACH, fillMessage, formatWhatsApp, searchRadar } from '../lib/radarApi';
import { createPositioningPdf, positioningFromLead } from '../lib/positioningPdf';
import { exportLeadsToExcel, exportLeadsToPdf } from '../lib/radarExport';
import RadarWhatsAppCampaign from './RadarWhatsAppCampaign';

interface RadarDeMercadoProps {
  onAddLeadToCrm: (lead: Omit<Lead, 'id' | 'createdAt'>) => Promise<void>;
  crmLeads: Lead[];
}

const SEGMENTS = [
  'Marmoraria', 'Vidraçaria', 'Móveis Planejados', 'Energia Solar', 'Clínica', 'Dentista',
  'Advogado', 'Restaurante', 'Academia', 'Estúdio de Pilates', 'Imobiliária', 'Hotel',
  'Oficina', 'Estética Automotiva', 'Contador', 'Arquiteto', 'Engenharia', 'Construtora',
  'Clínica Veterinária', 'Pet Shop', 'Farmácia', 'Clínica de Estética', 'Barbearia'
];

const LOADING_STEPS = [
  'Localizando a cidade e aplicando o raio de cobertura...',
  'Buscando as empresas do segmento no Google Maps...',
  'Lendo o site de cada empresa para achar WhatsApp, Instagram e e-mail...',
  'Montando as fichas comerciais...'
];

const WHATSAPP_BADGE: Record<string, { label: string; className: string }> = {
  confirmado: { label: 'WhatsApp confirmado', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-900/20' },
  provavel: { label: 'WhatsApp provável', className: 'bg-amber-500/10 text-amber-400 border-amber-900/20' },
  incerto: { label: 'WhatsApp não confirmado', className: 'bg-gray-900 text-gray-400 border-gray-800' },
};

const APPROACH_STORAGE_KEY = 'atlas.radar.abordagem';
const ATTACH_PDF_STORAGE_KEY = 'atlas.radar.anexarPdf';

// O armazenamento do navegador pode estar bloqueado (aba anônima); a tela funciona sem ele.
function readStored(key: string): string {
  try {
    return window.localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Sem armazenamento, a preferência vale só até recarregar a página.
  }
}

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
}

export default function RadarDeMercado({ onAddLeadToCrm, crmLeads }: RadarDeMercadoProps) {
  // Search parameters state
  const [segment, setSegment] = useState('Marmoraria');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [country] = useState('Brasil');
  const [radius, setRadius] = useState('10');
  const [leadQuantity, setLeadQuantity] = useState('5');
  const [siteFilter, setSiteFilter] = useState<'all' | 'has_site' | 'no_site'>('all');
  const [minRating, setMinRating] = useState('all');
  const [minReviews, setMinReviews] = useState('all');
  const [keyword, setKeyword] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [results, setResults] = useState<RadarLead[]>([]);
  const [searchSummary, setSearchSummary] = useState('');
  const [searchError, setSearchError] = useState<{ code: string; message: string } | null>(null);
  const [notifiedLeadIds, setNotifiedLeadIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCampaign, setShowCampaign] = useState(false);
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  // Abordagem usada no botão de cada empresa e no envio em lote; fica salva neste navegador.
  const [approach, setApproach] = useState(() => readStored(APPROACH_STORAGE_KEY) || DEFAULT_APPROACH);
  const [attachPdf, setAttachPdf] = useState(() => readStored(ATTACH_PDF_STORAGE_KEY) !== 'nao');
  const [editingApproach, setEditingApproach] = useState(false);
  const [approachedIds, setApproachedIds] = useState<string[]>([]);
  const [approachNotice, setApproachNotice] = useState('');

  const updateApproach = (value: string) => {
    setApproach(value);
    writeStored(APPROACH_STORAGE_KEY, value);
  };

  const updateAttachPdf = (value: boolean) => {
    setAttachPdf(value);
    writeStored(ATTACH_PDF_STORAGE_KEY, value ? 'sim' : 'nao');
  };

  // Abre a conversa com a abordagem pronta e baixa o PDF da empresa para anexar.
  const sendApproach = (lead: RadarLead) => {
    // A janela precisa abrir dentro do clique; o PDF é gerado em seguida.
    const url = `https://wa.me/${lead.whatsapp}?text=${encodeURIComponent(fillMessage(approach, lead))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setApproachedIds((prev) => (prev.includes(lead.id) ? prev : [...prev, lead.id]));
    setApproachNotice('');
    if (!attachPdf) return;
    createPositioningPdf(positioningFromLead(lead))
      .then(({ doc, filename }) => {
        doc.save(filename);
        setApproachNotice(`PDF de ${lead.companyName} baixado (${filename}). Na conversa, toque no clipe, escolha Documento e anexe esse arquivo.`);
      })
      .catch(() => setApproachNotice(`A conversa com ${lead.companyName} abriu, mas não foi possível gerar o PDF.`));
  };

  // Mostra em que etapa a busca está enquanto o servidor responde.
  useEffect(() => {
    if (!loading) return;
    let index = 0;
    setLoadingStep(LOADING_STEPS[0]);
    const timer = setInterval(() => {
      index = Math.min(index + 1, LOADING_STEPS.length - 1);
      setLoadingStep(LOADING_STEPS[index]);
    }, 3500);
    return () => clearInterval(timer);
  }, [loading]);

  const handleProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      alert("Por favor, informe ao menos a Cidade para refinar o Radar.");
      return;
    }

    setLoading(true);
    setResults([]);
    setSelectedIds([]);
    setShowCampaign(false);
    setSearchError(null);
    setSearchSummary('');

    try {
      const data = await searchRadar({
        segment, city: city.trim(), state, radius, quantity: leadQuantity,
        siteFilter, minRating, minReviews, keyword
      });
      setResults(data.leads);
      setSearchSummary(`Empresas analisadas no Google: ${data.scanned}. Sites lidos: ${data.enrichedSites}.`);
      if (data.leads.length === 0) {
        setSearchError({
          code: 'empty',
          message: 'Nenhuma empresa passou pelos filtros. Aumente o raio ou afrouxe os filtros de nota, avaliações e site.'
        });
      }
    } catch (err) {
      const apiError = err as ApiError;
      setSearchError({ code: apiError.code || 'error', message: apiError.message || 'Não foi possível concluir a busca.' });
    } finally {
      setLoading(false);
    }
  };

  const isInCrm = (lead: RadarLead) =>
    notifiedLeadIds.includes(lead.id) || crmLeads.some(l => l.companyName.toLowerCase() === lead.companyName.toLowerCase());

  const handlePushToCrm = async (lead: RadarLead, silent = false) => {
    if (isInCrm(lead)) {
      if (!silent) alert("Esta empresa já está cadastrada no seu CRM Inteligente!");
      return;
    }

    try {
      await onAddLeadToCrm({
        companyName: lead.companyName,
        responsible: 'Não identificado',
        phone: lead.phone,
        whatsapp: lead.whatsapp ? formatWhatsApp(lead.whatsapp) : '',
        email: lead.email,
        city: lead.city,
        state: lead.state,
        website: lead.website,
        instagram: lead.instagram,
        facebook: lead.facebook,
        linkedin: lead.linkedin,
        googleProfile: lead.googleProfile,
        atlasScore: lead.atlasScore,
        localPosition: lead.localPosition,
        positionQuery: lead.positionQuery,
        positionCheckedAt: lead.positionCheckedAt,
        status: 'Novo',
        lastContact: 'Não efetuado',
        nextAction: 'Enviar Primeira Auditoria',
        closeProbability: lead.closeProbability,
        notes: lead.notes,
        segment: lead.segment
      });
      setNotifiedLeadIds((prev) => [...prev, lead.id]);
    } catch (error) {
      setSearchError({ code: 'crm', message: (error as Error).message });
    }
  };

  // Sem nada marcado, as ações em lote valem para a lista inteira.
  const targetLeads = useMemo(
    () => (selectedIds.length > 0 ? results.filter((lead) => selectedIds.includes(lead.id)) : results),
    [results, selectedIds]
  );
  const whatsappLeads = useMemo(() => targetLeads.filter((lead) => lead.whatsapp), [targetLeads]);
  const allSelected = results.length > 0 && selectedIds.length === results.length;

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(format);
    try {
      if (format === 'excel') await exportLeadsToExcel(targetLeads);
      else await exportLeadsToPdf(targetLeads);
    } catch (err) {
      console.error('[Radar] Falha ao exportar:', err);
      alert('Não foi possível gerar o arquivo. Tente novamente.');
    } finally {
      setExporting(null);
    }
  };

  const handlePushManyToCrm = async () => {
    for (const lead of targetLeads) await handlePushToCrm(lead, true);
  };

  return (
    <div className="space-y-8 text-left">
      
      {/* Module Title Header */}
      <div>
        <span className="text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider block mb-1">
          Novo Módulo Ativo
        </span>
        <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
          Radar de Mercado Inteligente
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Rastreie automaticamente dados de empresas locais qualificadas na sua região de atuação. Encontre oportunidades críticas sem site ou com SEO defasado prontas para vendas.
        </p>
      </div>

      {/* Control Filter Panel - Stripe style */}
      <div className="bg-[#121214]/30 border border-gray-900 rounded-2xl p-6">
        <form onSubmit={handleProspect} className="space-y-6">
          <h3 className="text-white text-xs font-bold uppercase tracking-wider font-mono border-b border-gray-900/60 pb-3">
            Parâmetros Avançados de Rastreamento
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Segment Selector */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono font-bold text-gray-400">Nicho / Segmento</label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full bg-gray-950 text-white border border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#E2B755] font-sans font-medium"
              >
                {SEGMENTS.map((seg, idx) => (
                  <option key={idx} value={seg}>{seg}</option>
                ))}
              </select>
            </div>

            {/* City Field */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono font-bold text-gray-400">Cidade Alvo *</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="Ex: São Paulo"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-gray-950 text-white border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#E2B755]"
                />
              </div>
            </div>

            {/* State Field */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono font-bold text-gray-400">Estado / UF</label>
              <input
                type="text"
                placeholder="Ex: SP"
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                className="w-full bg-gray-950 text-white border border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#E2B755] font-mono"
              />
            </div>

            {/* Radius (km) */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono font-bold text-gray-400">Raio de Cobertura (KM)</label>
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full bg-gray-950 text-white border border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#E2B755] font-sans"
              >
                <option value="5">Até 5 KM</option>
                <option value="10">Até 10 KM</option>
                <option value="25">Até 25 KM</option>
                <option value="50">Até 50 KM</option>
                <option value="100">Até 100 KM</option>
              </select>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono font-bold text-gray-400">Quantidade de Empresas</label>
              <select
                value={leadQuantity}
                onChange={(e) => setLeadQuantity(e.target.value)}
                className="w-full bg-gray-950 text-white border border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#E2B755] font-mono"
              >
                <option value="5">5 empresas</option>
                <option value="10">10 empresas</option>
                <option value="20">20 empresas</option>
                <option value="50">50 empresas (Plano Professional)</option>
              </select>
            </div>

            {/* Site Status filter */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono font-bold text-gray-400">Status do Site</label>
              <select
                value={siteFilter}
                onChange={(e: any) => setSiteFilter(e.target.value)}
                className="w-full bg-gray-950 text-white border border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#E2B755] font-sans"
              >
                <option value="all">Todas as empresas</option>
                <option value="has_site">Somente empresas com Site</option>
                <option value="no_site">Somente empresas SEM Site</option>
              </select>
            </div>

            {/* Google Min Rating */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono font-bold text-gray-400">Nota Mínima Google</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full bg-gray-950 text-white border border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#E2B755] font-sans"
              >
                <option value="all">Qualquer nota</option>
                <option value="3.5">Nota 3.5+</option>
                <option value="4.0">Nota 4.0+</option>
                <option value="4.5">Nota 4.5+</option>
              </select>
            </div>

            {/* Google Min Reviews */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono font-bold text-gray-400">Mínimo de Avaliações</label>
              <select
                value={minReviews}
                onChange={(e) => setMinReviews(e.target.value)}
                className="w-full bg-gray-950 text-white border border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#E2B755] font-sans"
              >
                <option value="all">Qualquer quantidade</option>
                <option value="10">Mais de 10 avaliações</option>
                <option value="50">Mais de 50 avaliações</option>
                <option value="100">Mais de 100 avaliações</option>
              </select>
            </div>
          </div>

          {/* Optional Keyword */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            <div className="lg:col-span-3 space-y-1.5">
              <label className="block text-[10px] uppercase font-mono font-bold text-gray-400">Palavra-chave Opcional de Nicho</label>
              <input
                type="text"
                placeholder="Ex: pedras exóticas, vidros acústicos, instalador credenciado..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full bg-gray-950 text-white border border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#E2B755]"
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono font-bold text-gray-400">País</label>
              <input
                type="text"
                value={country}
                disabled
                className="w-full bg-gray-950/60 text-gray-500 border border-gray-900 rounded-xl px-4 py-3 text-xs focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-900/60 flex items-center justify-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#E2B755] hover:bg-yellow-500 text-black font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  Buscando empresas...
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4 text-black" />
                  Rastrear Empresas no Radar
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Loading overlay/steps */}
      {loading && (
        <div className="bg-gray-950/40 border border-gray-900 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <div className="space-y-1">
            <span className="text-white text-sm font-bold block">Varredura do Radar de Mercado Ativa</span>
            <span className="text-gray-500 text-xs font-mono">{loadingStep}</span>
          </div>
        </div>
      )}

      {/* Search problems */}
      {searchError && !loading && (
        <div className={`border rounded-2xl p-5 flex items-start gap-3 ${
          searchError.code === 'empty' ? 'border-gray-800 bg-gray-950/40' : 'border-red-900/40 bg-red-500/5'
        }`}>
          <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${searchError.code === 'empty' ? 'text-amber-400' : 'text-red-400'}`} />
          <div className="space-y-1.5 text-xs text-gray-300 leading-relaxed">
            <p>{searchError.message}</p>
            {searchError.code === 'missing_key' && (
              <p className="text-gray-500">
                O Radar busca empresas reais no Google Maps. Crie uma chave da Places API (New) no Google Cloud e
                cadastre-a no servidor com o nome GOOGLE_PLACES_API_KEY.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Results Listings Panel */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-900 pb-3">
            <h4 className="text-white text-xs font-bold font-mono uppercase tracking-wider">
              {results.length} Empresas Encontradas na Região
            </h4>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">{searchSummary}</span>
          </div>

          {/* Bulk actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="flex items-center gap-2 text-[11px] text-gray-300 mr-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => setSelectedIds(allSelected ? [] : results.map((lead) => lead.id))}
                className="accent-[#E2B755] w-3.5 h-3.5"
              />
              {selectedIds.length > 0 ? `${selectedIds.length} selecionadas` : 'Selecionar todas'}
            </label>

            <button
              onClick={() => handleExport('excel')}
              disabled={exporting !== null}
              className="px-4 py-2 rounded-xl text-[11px] font-semibold bg-gray-900 border border-gray-800 text-gray-200 hover:border-gray-600 flex items-center gap-1.5 disabled:opacity-50"
            >
              {exporting === 'excel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />}
              Exportar Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
              className="px-4 py-2 rounded-xl text-[11px] font-semibold bg-gray-900 border border-gray-800 text-gray-200 hover:border-gray-600 flex items-center gap-1.5 disabled:opacity-50"
            >
              {exporting === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-red-400" />}
              Exportar PDF
            </button>
            <button
              onClick={handlePushManyToCrm}
              className="px-4 py-2 rounded-xl text-[11px] font-semibold bg-gray-900 border border-gray-800 text-gray-200 hover:border-gray-600 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#E2B755]" />
              Adicionar ao CRM
            </button>
            <button
              onClick={() => setShowCampaign(true)}
              disabled={whatsappLeads.length === 0}
              className="px-4 py-2 rounded-xl text-[11px] font-semibold bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-1.5 disabled:opacity-40"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Enviar WhatsApp ({whatsappLeads.length})
            </button>
            <span className="text-[10px] text-gray-500">
              {selectedIds.length > 0 ? 'As ações valem para as selecionadas.' : 'Sem seleção, as ações valem para a lista inteira.'}
            </span>
          </div>

          {showCampaign && whatsappLeads.length > 0 && (
            <RadarWhatsAppCampaign
              leads={whatsappLeads}
              message={approach}
              onMessageChange={updateApproach}
              onClose={() => setShowCampaign(false)}
            />
          )}

          {/* Abordagem do botão "Enviar abordagem" de cada empresa */}
          <div className="bg-gray-950/40 border border-gray-900 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-gray-400">
                O botão <strong className="text-gray-200">Enviar abordagem</strong> de cada empresa abre o WhatsApp com a mensagem pronta.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-[11px] text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attachPdf}
                    onChange={(e) => updateAttachPdf(e.target.checked)}
                    className="accent-[#E2B755] w-3.5 h-3.5"
                  />
                  Baixar o PDF de posicionamento junto
                </label>
                {!showCampaign && <button
                  type="button"
                  onClick={() => setEditingApproach((open) => !open)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-900 border border-gray-800 text-gray-200 hover:border-gray-600 flex items-center gap-1.5"
                >
                  <Pencil className="w-3 h-3" />
                  {editingApproach ? 'Fechar edição' : 'Editar abordagem'}
                </button>}
              </div>
            </div>

            {editingApproach && !showCampaign && (
              <div className="space-y-2">
                <textarea
                  value={approach}
                  onChange={(e) => updateApproach(e.target.value)}
                  rows={6}
                  aria-label="Texto da abordagem"
                  className="w-full bg-gray-950 text-white border border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#E2B755]"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-500">
                  <span>
                    Variáveis: {'{empresa}'}, {'{cidade}'}, {'{segmento}'}, {'{diagnostico}'}, {'{posicao}'}, {'{nota}'}, {'{avaliacoes}'}.
                    {' '}{'{diagnostico}'} vira o principal problema medido de cada empresa.
                  </span>
                  <button type="button" onClick={() => updateApproach(DEFAULT_APPROACH)} className="underline hover:text-white">
                    Restaurar abordagem padrão
                  </button>
                </div>
              </div>
            )}

            {!showCampaign && <p className="text-[11px] text-gray-500">
              Prévia para {results[0].companyName}: <span className="text-gray-300">{fillMessage(approach, results[0])}</span>
            </p>}
            {attachPdf && (
              <p className="text-[10px] text-gray-500">
                O WhatsApp não aceita anexo por link: o PDF é baixado no seu aparelho e você o anexa na conversa aberta.
              </p>
            )}
            {approachNotice && <p role="status" className="text-[11px] text-emerald-400">{approachNotice}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {results.map((lead) => {
              const inCrm = isInCrm(lead);
              const selected = selectedIds.includes(lead.id);
              const whatsappBadge = WHATSAPP_BADGE[lead.whatsappConfidence];

              return (
                <div
                  key={lead.id}
                  className={`bg-gray-950/30 border rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all ${
                    selected ? 'border-[#E2B755]/60' : 'border-gray-900 hover:border-gray-800'
                  }`}
                >
                  {/* Company Profile Details */}
                  <div className="space-y-4 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelected(lead.id)}
                        aria-label={`Selecionar ${lead.companyName}`}
                        className="accent-[#E2B755] w-4 h-4"
                      />
                      <h5 className="text-white text-base font-bold tracking-tight">{lead.companyName}</h5>

                      <span className="text-[9px] uppercase tracking-wider bg-gray-900 text-gray-400 border border-gray-800 rounded-full px-2.5 py-0.5 font-semibold">
                        {lead.segment}
                      </span>

                      {lead.website ? (
                        <span className="text-[9px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-900/20 rounded-full px-2.5 py-0.5 font-bold font-mono">
                          Com Site
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-900/20 rounded-full px-2.5 py-0.5 font-bold font-mono">
                          Sem Site (Crítico)
                        </span>
                      )}

                      {whatsappBadge && (
                        <span className={`text-[9px] uppercase tracking-wider border rounded-full px-2.5 py-0.5 font-bold font-mono ${whatsappBadge.className}`}>
                          {whatsappBadge.label}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 font-light leading-relaxed">
                      {lead.notes}
                    </p>

                    {/* Contacts and links */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 text-[11px] text-gray-400 font-sans">
                      <ContactItem icon={<Phone className="w-3.5 h-3.5 text-[#E2B755] shrink-0" />} label="Fone"
                        text={lead.phone} href={lead.phone ? `tel:${lead.phone.replace(/[^\d+]/g, '')}` : ''} external={false} />
                      <ContactItem icon={<MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />} label="WhatsApp"
                        text={lead.whatsapp ? formatWhatsApp(lead.whatsapp) : ''} href={lead.whatsappLink} />
                      <ContactItem icon={<Mail className="w-3.5 h-3.5 text-[#E2B755] shrink-0" />} label="Email"
                        text={lead.email} href={lead.email ? `mailto:${lead.email}` : ''} external={false} />
                      <ContactItem icon={<Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />} label="Website"
                        text={lead.website ? displayUrl(lead.website) : ''} href={lead.website} emptyText="Ausente" />
                      <ContactItem icon={<Instagram className="w-3.5 h-3.5 text-pink-500 shrink-0" />} label="Instagram"
                        text={lead.instagram ? displayUrl(lead.instagram).replace(/^instagram\.com\//i, '@') : ''} href={lead.instagram} />
                      <ContactItem icon={<Facebook className="w-3.5 h-3.5 text-blue-500 shrink-0" />} label="Facebook"
                        text={lead.facebook ? displayUrl(lead.facebook).replace(/^facebook\.com\//i, '') : ''} href={lead.facebook} />
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>
                          Nota Google:{' '}
                          {lead.rating !== null
                            ? <><strong className="text-white">{lead.rating.toFixed(1)}</strong> ({lead.reviewsCount} avaliações)</>
                            : <strong className="text-gray-500">sem avaliações</strong>}
                        </span>
                      </div>
                      <ContactItem icon={<MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />} label="Google Maps"
                        text={lead.googleProfile ? 'Abrir perfil' : ''} href={lead.googleProfile} />
                      {lead.distanceKm !== null && (
                        <div className="flex items-center gap-2">
                          <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span>A <strong className="text-gray-300">{lead.distanceKm.toLocaleString('pt-BR')} km</strong> do centro</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Operational Status Box & Action CTAs */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-3 lg:border-l lg:border-gray-900/60 lg:pl-6 shrink-0 min-w-44">
                    <div className="text-center sm:text-left lg:text-right">
                      <span className="text-[9px] uppercase font-mono text-gray-500 block">Posição na busca local</span>
                      <span className={`text-xl font-display font-black inline-block mt-0.5 ${
                        lead.atlasScore >= 70 ? 'text-emerald-400' : lead.atlasScore >= 50 ? 'text-amber-500' : 'text-red-400'
                      }`}>
                        {lead.localPosition}º lugar
                      </span>
                      <p title={lead.positionQuery} className="text-[10px] text-gray-400">Atlas Score local · {lead.atlasScore}/100</p>
                    </div>

                    <button
                      onClick={() => handlePushToCrm(lead)}
                      disabled={inCrm}
                      className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                        inCrm
                          ? 'bg-gray-900 border border-gray-800 text-emerald-400 cursor-default'
                          : 'bg-white hover:bg-gray-200 text-black hover:scale-[1.02]'
                      }`}
                    >
                      {inCrm ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Lead no CRM
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-black" />
                          Adicionar ao CRM
                        </>
                      )}
                    </button>

                    {lead.whatsapp && (
                      <button
                        type="button"
                        onClick={() => sendApproach(lead)}
                        disabled={!approach.trim()}
                        className="px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-40 flex items-center justify-center gap-1.5"
                      >
                        {approachedIds.includes(lead.id) ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                        {approachedIds.includes(lead.id) ? 'Abordagem aberta' : 'Enviar abordagem'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explanatory footer */}
      <div className="bg-gray-950/60 border border-gray-900/40 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="text-white text-[11px] font-bold font-mono uppercase tracking-wide">Nota Metodológica do Radar</h5>
          <p className="text-[10px] text-gray-500 leading-relaxed font-sans">
            As empresas, telefones, notas e avaliações vêm do Google Maps na data da busca. Instagram, Facebook, e-mail e o
            WhatsApp "confirmado" são lidos do site da própria empresa. WhatsApp "provável" significa que o telefone do Google
            é um celular; "não confirmado" é um fixo que pode ou não ter WhatsApp. A posição é a ordem em que o Google Places retornou a empresa, antes dos filtros do Radar. O Atlas Score local usa essa posição.
          </p>
        </div>
      </div>

    </div>
  );
}

interface ContactItemProps {
  icon: React.ReactNode;
  label: string;
  text: string;
  href: string;
  external?: boolean;
  emptyText?: string;
}

function ContactItem({ icon, label, text, href, external = true, emptyText = 'Não encontrado' }: ContactItemProps) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      {icon}
      <span className="truncate">
        {label}:{' '}
        {text && href ? (
          <a
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="text-gray-200 font-semibold underline decoration-gray-700 underline-offset-2 hover:text-white hover:decoration-[#E2B755]"
          >
            {text}
            {external && <ExternalLink className="w-2.5 h-2.5 inline ml-1 -mt-0.5 text-gray-500" />}
          </a>
        ) : (
          <strong className="text-gray-600 font-normal">{emptyText}</strong>
        )}
      </span>
    </div>
  );
}
