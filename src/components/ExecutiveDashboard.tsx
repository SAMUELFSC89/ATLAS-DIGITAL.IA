import { useState } from 'react';
import { 
  Users, Target, Award, Calendar, CheckCircle, TrendingUp, DollarSign, 
  MapPin, ArrowUpRight, BarChart3, Activity, Briefcase, Zap, ShieldAlert 
} from 'lucide-react';
import { Lead } from '../types';

interface ExecutiveDashboardProps {
  leads: Lead[];
  onNavigateToTab: (tab: string) => void;
}

export default function ExecutiveDashboard({ leads, onNavigateToTab }: ExecutiveDashboardProps) {
  const [selectedGeoRegion, setSelectedGeoRegion] = useState<'all' | 'sudeste' | 'sul' | 'nordeste' | 'centro'>('all');

  // Calculate statistics from current leads list
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => (l.atlasScore || 0) < 60 && l.website === '').length; // Leads needing solutions
  const scheduledMeetings = leads.filter(l => l.status === 'Reunião').length;
  const sentProposals = leads.filter(l => l.status === 'Proposta' || l.status === 'Negociação').length;
  const closedDeals = leads.filter(l => l.status === 'Fechado' || l.status === 'Pós-venda').length;
  
  // Calculate average Atlas Score
  const scoredLeads = leads.filter(l => l.atlasScore !== null);
  const avgScore = scoredLeads.length > 0 
    ? Math.round(scoredLeads.reduce((acc, l) => acc + (l.atlasScore || 0), 0) / scoredLeads.length)
    : 62;

  // Calculate simulated revenue
  const totalRevenue = closedDeals * 4900; // Average R$ 4.900,00 per client onboarding
  
  // Funnel calculations
  const funnelStages = [
    { label: 'Novo Lead', count: leads.filter(l => l.status === 'Novo').length, color: 'bg-blue-500' },
    { label: 'Contato Efetuado', count: leads.filter(l => l.status === 'Contato').length, color: 'bg-indigo-500' },
    { label: 'Com Resposta', count: leads.filter(l => l.status === 'Resposta').length, color: 'bg-purple-500' },
    { label: 'Reunião Agendada', count: leads.filter(l => l.status === 'Reunião').length, color: 'bg-amber-500' },
    { label: 'Proposta Enviada', count: leads.filter(l => l.status === 'Proposta').length, color: 'bg-pink-500' },
    { label: 'Negociação', count: leads.filter(l => l.status === 'Negociação').length, color: 'bg-rose-500' },
    { label: 'Fechado', count: leads.filter(l => l.status === 'Fechado').length, color: 'bg-emerald-500' }
  ];

  // Map representation points (simulated georouting)
  const mapOpportunities = [
    { name: "Marmoraria Gran Prime", city: "São Paulo", score: 32, type: "Sem Site", lat: 35, lng: 45 },
    { name: "Solaris Soluções", city: "Campinas", score: 48, type: "SEO Crítico", lat: 50, lng: 55 },
    { name: "Vidraçaria Cristal", city: "Rio de Janeiro", score: 28, type: "Sem Site", lat: 60, lng: 70 },
    { name: "Móveis Planejados Ideal", city: "Belo Horizonte", score: 55, type: "Mobile Lento", lat: 40, lng: 80 },
    { name: "Serralheria Alpha", city: "Curitiba", score: 19, type: "Sem Site", lat: 80, lng: 30 },
    { name: "Clínica Odonto Bella", city: "Porto Alegre", score: 61, type: "Performance Alerta", lat: 90, lng: 25 },
    { name: "Vidros e Fachadas Premium", city: "Vitória", score: 42, type: "Conversão Ruim", lat: 45, lng: 85 }
  ];

  const maxFunnelCount = Math.max(...funnelStages.map(s => s.count), 1);

  return (
    <div className="space-y-8 text-left">
      
      {/* Executive Welcome & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-900 pb-6">
        <div>
          <span className="text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider block mb-1">
            Painel Executivo Ativo
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            Atlas Control Center
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Visão unificada das auditorias, saúde do funil comercial e insights de captação gerados por Inteligência Artificial.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToTab('radar')}
            className="px-4 py-2.5 bg-white hover:bg-gray-200 text-black text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all hover:scale-[1.02]"
          >
            <Zap className="w-3.5 h-3.5 fill-black" />
            Radar de Prospecção
          </button>
        </div>
      </div>

      {/* Grid: 4 Premium Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Leads Tracking */}
        <div className="bg-gray-950/40 border border-gray-900 rounded-xl p-5 hover:border-gray-800 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/5 rounded-bl-full group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-gray-500 tracking-wider font-bold">Base de Leads CRM</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-display font-black text-white">{totalLeads}</span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5 font-bold">
              +12% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Empresas qualificadas no pipeline comercial</p>
        </div>

        {/* High Priority Opportunities */}
        <div className="bg-gray-950/40 border border-gray-900 rounded-xl p-5 hover:border-gray-800 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 rounded-bl-full group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-gray-500 tracking-wider font-bold">Leads Críticos</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-display font-black text-[#E2B755]">{qualifiedLeads}</span>
            <span className="text-[10px] uppercase bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-amber-400 font-bold font-mono">
              Fácil Conversão
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Empresas sem site ou com SEO crítico mapeadas</p>
        </div>

        {/* Average Atlas Score of leads */}
        <div className="bg-gray-950/40 border border-gray-900 rounded-xl p-5 hover:border-gray-800 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-gray-500 tracking-wider font-bold">Média Atlas Score</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-display font-black text-white">{avgScore}/100</span>
            <span className="text-[10px] text-gray-400 font-mono">Baixa presença digital</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Maturidade digital geral das empresas locais</p>
        </div>

        {/* Simulated commercial pipeline revenue */}
        <div className="bg-gray-950/40 border border-gray-900 rounded-xl p-5 hover:border-gray-800 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-gray-500 tracking-wider font-bold">Projeção Comercial</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-display font-black text-emerald-400">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Faturamento estimado baseado em {closedDeals} contratos</p>
        </div>

      </div>

      {/* Grid: Funnel & Opportunity Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Commercial Pipeline Funnel Chart */}
        <div className="lg:col-span-7 bg-[#121214]/30 border border-gray-900 rounded-2xl p-6 space-y-6">
          <div className="border-b border-gray-900/60 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider font-mono">
                Funil Comercial de Clientes
              </h3>
            </div>
            <span className="text-[9px] text-gray-400 font-mono">
              Atualizado em Tempo Real
            </span>
          </div>

          <div className="space-y-4">
            {funnelStages.map((stage, idx) => {
              const pct = Math.round((stage.count / maxFunnelCount) * 100) || 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-300 font-medium flex items-center gap-1.5">
                      <span className="text-gray-600">0{idx + 1}.</span>
                      {stage.label}
                    </span>
                    <span className="text-white font-bold">{stage.count} {stage.count === 1 ? 'lead' : 'leads'}</span>
                  </div>
                  
                  {/* Visual Bar */}
                  <div className="w-full h-2.5 bg-gray-950 rounded-full overflow-hidden border border-gray-900/40">
                    <div 
                      className={`h-full ${stage.color} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gray-950/40 border border-gray-900/60 rounded-xl p-4 flex items-start gap-3">
            <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-white text-[11px] font-bold font-mono uppercase tracking-wide">Insight Comercial do Copilot</h4>
              <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                Seu gargalo atual está localizado no follow-up da etapa de <strong>Proposta Enviada</strong>. 
                Utilize o <strong>Atlas Copilot</strong> para criar argumentos persuasivos e contornar objeções técnicas de preços e prazos.
              </p>
            </div>
          </div>
        </div>

        {/* Opportunity Regional Mapping */}
        <div className="lg:col-span-5 bg-[#121214]/30 border border-gray-900 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="border-b border-gray-900/60 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <h3 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider font-mono">
                Mapa Local de Oportunidades
              </h3>
            </div>
            
            <select
              value={selectedGeoRegion}
              onChange={(e: any) => setSelectedGeoRegion(e.target.value)}
              className="bg-gray-950 text-gray-300 border border-gray-800 text-[10px] rounded px-2 py-0.5 font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Foco Local (Geral)</option>
              <option value="sudeste">Sudeste</option>
              <option value="sul">Sul</option>
              <option value="nordeste">Nordeste</option>
            </select>
          </div>

          {/* Interactive Simulated Map */}
          <div className="relative h-48 bg-gray-950 rounded-xl border border-gray-900 overflow-hidden flex items-center justify-center">
            {/* Grid Line lines representing Map mesh */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#090d16_1px,transparent_1px),linear-gradient(to_bottom,#090d16_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />
            
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.02)_0%,transparent_70%)]" />
            
            {/* Georeferenced Hotspots */}
            {mapOpportunities.map((op, idx) => (
              <div 
                key={idx}
                className="absolute group/pin cursor-pointer"
                style={{ top: `${op.lat}%`, left: `${op.lng}%` }}
              >
                {/* Ping wave */}
                <span className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-60" />
                <span className="relative block w-1.5 h-1.5 bg-red-500 rounded-full border border-black" />
                
                {/* Mini opportunity tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-3 hidden group-hover/pin:block bg-black border border-gray-800 rounded px-2.5 py-1.5 text-[9px] w-36 shadow-xl z-50">
                  <span className="font-bold text-white block truncate">{op.name}</span>
                  <span className="text-gray-400 block font-mono">{op.city} &bull; Score: <span className="text-red-400 font-bold">{op.score}</span></span>
                  <span className="text-[8px] uppercase bg-red-500/10 text-red-400 px-1.5 py-0.2 rounded border border-red-900/10 inline-block mt-1 font-mono">{op.type}</span>
                </div>
              </div>
            ))}

            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[8px] font-mono text-gray-500 bg-black/80 px-2 py-0.5 rounded border border-gray-900">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
              Empresas sem site ou SEO crítico
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-gray-400 text-[10px] uppercase font-mono font-bold tracking-wider">Altos Potenciais na Região</h4>
            
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {mapOpportunities.slice(0, 3).map((op, idx) => (
                <div key={idx} className="bg-gray-950/40 border border-gray-900/60 hover:border-gray-800 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-white font-bold block">{op.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{op.city} &bull; {op.type}</span>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded border border-red-900/20">
                      Score: {op.score}
                    </span>
                    <button 
                      onClick={() => onNavigateToTab('radar')}
                      className="p-1 rounded bg-gray-900 hover:bg-white hover:text-black text-gray-400 transition-colors"
                      title="Prospecção Rápida"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Commercial Intelligence Insights and Recommendations */}
      <div className="bg-gradient-to-r from-[#121214]/60 to-[#0B0B0E] border border-gray-900 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-widest block mb-1">
            Mecanismo Inteligente de Recomendação
          </span>
          <h3 className="text-white text-base sm:text-lg font-bold font-display tracking-tight">
            Análises e Otimizações de Conversão Baseadas em Resultados
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            As métricas compiladas de prospecção do Atlas Intelligence geram padrões inteligentes para orientar seus próximos passos:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          <div className="bg-gray-950/40 border border-gray-900 rounded-xl p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-[#E2B755] font-mono text-xs font-bold uppercase">
              <Briefcase className="w-4 h-4" />
              Nicho de Melhor Conversão
            </div>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Com base nos leads auditados localmente, empresas do segmento de <strong>Marmoraria de Luxo</strong> e <strong>Energia Solar</strong> apresentam uma taxa de interesse de até <strong>78%</strong> maior nas propostas de Landing Pages Rápidas de Portfólio.
            </p>
            <span className="text-[9px] font-mono text-gray-500 block">Estatística baseada no funil do applet</span>
          </div>

          <div className="bg-gray-950/40 border border-gray-900 rounded-xl p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase">
              <Calendar className="w-4 h-4" />
              Melhores Horários de Abordagem
            </div>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              O envio de propostas comerciais de Auditoria via WhatsApp gera maior retorno quando efetuado em dias de semana, especificamente das <strong>09h30 às 11h30</strong>.
            </p>
            <span className="text-[9px] font-mono text-gray-500 block">Tendência local registrada</span>
          </div>

          <div className="bg-gray-950/40 border border-gray-900 rounded-xl p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase">
              <TrendingUp className="w-4 h-4" />
              Mensagem de Alto Impacto
            </div>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Abordagens que apresentam o <strong>PDF do Atlas Score</strong> na primeira interação e utilizam um tom consultivo técnico geram agendamento de reuniões <strong>3x mais rápido</strong>.
            </p>
            <span className="text-[9px] font-mono text-gray-500 block">Recomendação metodológica Atlas</span>
          </div>

        </div>

        <div className="pt-4 border-t border-gray-900/60 text-[10px] text-gray-500 flex items-center gap-2 font-mono">
          <Zap className="w-3.5 h-3.5 text-[#E2B755]" />
          Nota: Estas recomendações representam estatísticas internas analíticas de conformidade comercial baseadas na amostragem e não constituem garantia contratual de fechamento.
        </div>
      </div>

    </div>
  );
}
