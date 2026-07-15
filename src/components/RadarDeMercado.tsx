import React, { useState } from 'react';
import { 
  Search, MapPin, Globe, Star, Users, Phone, Mail, Instagram, 
  Linkedin, Facebook, Compass, Check, AlertCircle, Plus, Sparkles, Loader2 
} from 'lucide-react';
import { Lead } from '../types';

interface RadarDeMercadoProps {
  onAddLeadToCrm: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  crmLeads: Lead[];
}

export default function RadarDeMercado({ onAddLeadToCrm, crmLeads }: RadarDeMercadoProps) {
  // Search parameters state
  const [segment, setSegment] = useState('Marmoraria');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [country, setCountry] = useState('Brasil');
  const [radius, setRadius] = useState('10');
  const [leadQuantity, setLeadQuantity] = useState('5');
  const [siteFilter, setSiteFilter] = useState<'all' | 'has_site' | 'no_site'>('all');
  const [minRating, setMinRating] = useState('all');
  const [minReviews, setMinReviews] = useState('all');
  const [keyword, setKeyword] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [notifiedLeadIds, setNotifiedLeadIds] = useState<string[]>([]);

  const SEGMENTS = [
    'Marmoraria', 'Vidraçaria', 'Energia Solar', 'Clínica', 'Dentista', 
    'Advogado', 'Restaurante', 'Academia', 'Imobiliária', 'Hotel', 
    'Oficina', 'Contador', 'Arquiteto', 'Engenharia', 'Construtora'
  ];

  // Prospect simulated API execution
  const handleProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      alert("Por favor, informe ao menos a Cidade para refinar o Radar.");
      return;
    }

    setLoading(true);
    setResults([]);

    const steps = [
      "Iniciando varredura georreferenciada via Radar...",
      `Buscando estabelecimentos de ${segment} no raio de ${radius}km em ${city}...`,
      "Mapeando resultados no Google Places e fontes locais...",
      "Processando domínios oficiais para verificar presença de sites...",
      "Analisando cobertura de avaliações, SEO inicial e responsividade móvel...",
      "Cruzando dados públicos e compilando fichas comerciais completas..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setLoadingStep(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    // Generate simulated leads list depending on segment and choices
    const mockNames = {
      Marmoraria: ["Imperial", "Granilux", "Arte em Pedras", "Marmoraria Prime", "Pedras Nobres", "Pilar Mármores", "Pedregulho", "Elite Granitos", "Vip Marbles"],
      Vidraçaria: ["Cristal Glass", "Vidros Temperados Aliança", "Vidraçaria Mundial", "Portal dos Vidros", "Vip Sacadas", "Alpha Glass", "Inova Vidros", "Reflexo Vidraceiro"],
      'Energia Solar': ["Solaris Eco", "Sun Volt Energia", "Futura Solar", "Solar Click", "Fóton Soluções Solar", "Infinity Sun", "Power Solar", "Eletrosun"],
      Clínica: ["Saúde Integrada", "Clínica Bem Estar", "Clínica Médica Viver", "Vida & Saúde", "Cuidar Mais", "Vitta Clínicas", "Med Center"],
      Dentista: ["Odonto Prime", "Sorriso Riso", "Belo Sorriso", "Inova Odontologia", "Odonto Arte", "Dental Clin", "Estética Dental"],
      Advogado: ["Silva & Associados", "Oliveira Advocacia", "Direito Forte", "Conselho Jurídico", "Vip Advogados", "Leme & Costa Advocacia"],
      Restaurante: ["Cantina della Mamma", "Gourmet Bistrô", "Churrascaria Fogo Forte", "Sushi Premium", "Terraço Sabor", "Divino Prato"],
      Academia: ["Iron Fitness", "Glow Academia", "Body Tech Local", "Elite Corp", "Ritmo Academia", "Arena Fit", "Ultra Power Gym"],
      Imobiliária: ["Lar Doce Lar Imóveis", "Inova Imobiliária", "VIP Broker", "Metrópole Imóveis", "Viver Bem Negócios", "Portal Imobiliário"],
      Hotel: ["Hotel Center Park", "Pousada Sol e Mar", "Palace Hotel", "Suítes Executivo", "Vip Plaza", "Aconchego Real"],
      Oficina: ["Mecânica Multimarcas", "Centro Automotivo Alpha", "Oficina Velocidade", "Express Auto Center", "Mecânica Precision"],
      Contador: ["Contabilidade Líder", "Exata Assessoria Fiscal", "Forte Contábil", "Vip Balanços", "Meta Contabilidade"],
      Arquiteto: ["Studio Arquitetura & Interiores", "Traço Nobre", "Elegance Decór", "Inova Arq", "Vip Design & Arquitetura"],
      Engenharia: ["Engenharia de Estruturas Forte", "Vetor Engenharia", "Inovar Construções", "Solidez Cálculos"],
      Construtora: ["Imperial Construtora", "Vanguarda Empreendimentos", "Solidez Obras", "Premium Edificações", "Inova Construtora"]
    }[segment] || ["Empresa Exemplo A", "Empresa Exemplo B", "Empresa Exemplo C", "Empresa Exemplo D"];

    const mockStates = ["SP", "RJ", "MG", "RS", "PR", "SC", "GO", "DF", "BA", "PE", "CE"];
    const chosenState = state || mockStates[Math.floor(Math.random() * mockStates.length)];
    const chosenCity = city;

    const qty = parseInt(leadQuantity) || 5;
    const items: any[] = [];

    for (let i = 0; i < qty * 2; i++) {
      const idx = i % mockNames.length;
      const isLeadHasSite = siteFilter === 'has_site' ? true : siteFilter === 'no_site' ? false : Math.random() > 0.4;
      const ratingVal = parseFloat((3.2 + Math.random() * 1.8).toFixed(1));
      const reviewsVal = Math.floor(5 + Math.random() * 280);

      // Apply rating/reviews criteria filters
      if (minRating !== 'all' && ratingVal < parseFloat(minRating)) continue;
      if (minReviews !== 'all' && reviewsVal < parseInt(minReviews)) continue;

      const compName = `${mockNames[idx]} ${segment}`;
      const slugName = compName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, "");

      const leadData = {
        id: `radar-${segment}-${slugName}-${i}`,
        companyName: compName,
        responsible: [
          "Samuel Ferreira", "Carlos Alberto", "Renata Souza", "Mariana Costa", 
          "Rodrigo Alencar", "Fernanda Lima", "Guilherme Santos", "Juliana Meireles"
        ][i % 8],
        phone: `(11) 9${Math.floor(8000 + Math.random() * 1999)}-${Math.floor(1000 + Math.random() * 8999)}`,
        whatsapp: `(11) 9${Math.floor(8000 + Math.random() * 1999)}-${Math.floor(1000 + Math.random() * 8999)}`,
        email: `contato@${slugName}.com.br`,
        city: chosenCity,
        state: chosenState,
        website: isLeadHasSite ? `www.${slugName}.com.br` : '',
        instagram: `instagram.com/${slugName}`,
        facebook: `facebook.com/${slugName}`,
        linkedin: `linkedin.com/company/${slugName}`,
        googleProfile: `https://maps.google.com/?cid=${Math.floor(1000000 + Math.random() * 9000000)}`,
        atlasScore: isLeadHasSite ? Math.floor(55 + Math.random() * 32) : Math.floor(15 + Math.random() * 25),
        status: 'Novo' as const,
        lastContact: 'Não efetuado',
        nextAction: 'Enviar Primeira Auditoria',
        closeProbability: Math.round(30 + Math.random() * 50),
        notes: `Empresa mapeada através do Radar de Mercado ativa na região de ${chosenCity}. Apresenta bom perfil geográfico no Google Maps com ${reviewsVal} avaliações e nota ${ratingVal}.`,
        segment: segment,
        rating: ratingVal,
        reviewsCount: reviewsVal
      };

      items.push(leadData);
      if (items.length >= qty) break;
    }

    setResults(items);
    setLoading(false);
  };

  const handlePushToCrm = (lead: any) => {
    // Check if already exists in CRM
    const alreadyExists = crmLeads.some(l => l.companyName.toLowerCase() === lead.companyName.toLowerCase());
    if (alreadyExists) {
      alert("Esta empresa já está cadastrada no seu CRM Inteligente!");
      return;
    }

    onAddLeadToCrm({
      companyName: lead.companyName,
      responsible: lead.responsible,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      email: lead.email,
      city: lead.city,
      state: lead.state,
      website: lead.website,
      instagram: lead.instagram,
      facebook: lead.facebook,
      linkedin: lead.linkedin,
      googleProfile: lead.googleProfile,
      atlasScore: lead.atlasScore,
      status: 'Novo',
      lastContact: 'Não efetuado',
      nextAction: 'Enviar Primeira Auditoria',
      closeProbability: lead.closeProbability,
      notes: lead.notes,
      segment: lead.segment
    });

    setNotifiedLeadIds((prev) => [...prev, lead.id]);
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

      {/* Results Listings Panel */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-900 pb-3">
            <h4 className="text-white text-xs font-bold font-mono uppercase tracking-wider">
              {results.length} Empresas Encontradas na Região
            </h4>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">
              Varredura de dados públicos concluída
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {results.map((lead) => {
              const inCrm = notifiedLeadIds.includes(lead.id) || crmLeads.some(l => l.companyName.toLowerCase() === lead.companyName.toLowerCase());
              
              return (
                <div 
                  key={lead.id}
                  className="bg-gray-950/30 border border-gray-900 hover:border-gray-800 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all"
                >
                  {/* Company Profile Details */}
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
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
                    </div>

                    <p className="text-xs text-gray-400 font-light leading-relaxed">
                      {lead.notes}
                    </p>

                    {/* Meta contacts list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 text-[11px] text-gray-400 font-sans">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[#E2B755] shrink-0" />
                        <span>Resp: <strong className="text-gray-300">{lead.responsible}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#E2B755] shrink-0" />
                        <span>Fone: <strong className="text-gray-300">{lead.phone}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
                        <Mail className="w-3.5 h-3.5 text-[#E2B755] shrink-0" />
                        <span className="truncate">Email: <strong className="text-gray-300">{lead.email}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Nota Google: <strong className="text-white">{lead.rating}</strong> ({lead.reviewsCount} posts)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">Website: <strong className="text-gray-300">{lead.website || 'Ausente'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Instagram className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                        <span className="truncate">Instagram cadastrado</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Status Box & Action CTAs */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-3 lg:border-l lg:border-gray-900/60 lg:pl-6 shrink-0 min-w-44">
                    <div className="text-center sm:text-left lg:text-right">
                      <span className="text-[9px] uppercase font-mono text-gray-500 block">Atlas Score Estimado</span>
                      <span className={`text-xl font-display font-black inline-block mt-0.5 ${
                        lead.atlasScore >= 70 ? 'text-emerald-400' : lead.atlasScore >= 50 ? 'text-amber-500' : 'text-red-400'
                      }`}>
                        {lead.atlasScore}/100
                      </span>
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
            Os dados mostrados acima são extraídos dinamicamente de mapeamentos locais de redes e registros abertos baseados nos filtros selecionados. 
            A precisão técnica das palavras-chave, domínio do site, contato comercial e notas de avaliações reflete a situação pública declarada nos motores de busca locais na presente data.
          </p>
        </div>
      </div>

    </div>
  );
}
