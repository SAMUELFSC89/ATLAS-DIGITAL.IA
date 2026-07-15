import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ZapOff,
  SearchCode,
  Coins,
  ShieldAlert,
  Smartphone,
  Paintbrush,
  Award,
  TrendingUp,
  Gauge,
  Server,
  MessageSquareShare,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  MapPin,
  MousePointerClick,
  Search,
  FileText,
  Palette,
  Code,
  CheckCircle2,
  Rocket,
  Clock,
  Zap,
  Compass,
  Activity,
  Sparkles,
  Layout,
  FolderEdit,
  Target,
  Star,
  MessageCircle,
  ArrowRight,
  Menu,
  X,
  Phone,
  Mail,
  ExternalLink,
  Play,
  Check,
  Building2,
  LogOut,
  Bot,
  Settings,
  Layers
} from 'lucide-react';

import { PROBLEMS, SOLUTIONS, PORTFOLIO, STEPS, DIFFERENTIALS, TESTIMONIALS, TARGET_SEGMENTS } from './data';
import MockupShowcase from './components/MockupShowcase';
import BudgetSimulator from './components/BudgetSimulator';
import InteractiveContactModal from './components/InteractiveContactModal';
import SegmentDemoShowcase from './components/SegmentDemoShowcase';
import AtlasLogo from './components/AtlasLogo';
import FAQSection from './components/FAQSection';
import LegalModals, { LegalDocType } from './components/LegalModals';
import AtlasScoreModule from './components/AtlasScoreModule';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import RadarDeMercado from './components/RadarDeMercado';
import CrmInteligente from './components/CrmInteligente';
import AtlasCopilot from './components/AtlasCopilot';
import Automacoes from './components/Automacoes';
import SaaSBlog from './components/SaaSBlog';
import SaaSDocs from './components/SaaSDocs';
import PrecosPlanos from './components/PrecosPlanos';
import SegmentPages from './components/SegmentPages';
import AuthPage from './components/AuthPage';
import DemonstracaoGratuita from './components/DemonstracaoGratuita';
import { Lead, LeadStatus, IntegrationConfig } from './types';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedPrefillSubject, setSelectedPrefillSubject] = useState<string>('');
  const [activeShowcaseSegment, setActiveShowcaseSegment] = useState<string>('Marmorarias');
  const [scrolled, setScrolled] = useState(false);
  const [activeLegalDoc, setActiveLegalDoc] = useState<LegalDocType>(null);

  // Portal / SaaS States
  const [isPortalActive, setIsPortalActive] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activePortalTab, setActivePortalTab] = useState<string>('dashboard');
  const [selectedLeadForCopilot, setSelectedLeadForCopilot] = useState<Lead | null>(null);

  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([
    { id: 'gmail', name: 'Google Gmail API', status: 'connected', category: 'Google', icon: 'Mail', description: 'Permite gerenciar a caixa de entrada comercial de seus clientes com rascunhos de e-mails inteligentes sugeridos pela IA.', requiresOAuth: true },
    { id: 'google-maps', name: 'Google Places API', status: 'connected', category: 'Google', icon: 'MapPin', description: 'Varre e extrai endereços, avaliações e dados de contato das empresas locais nas buscas geolocalizadas.', requiresOAuth: false },
    { id: 'whatsapp-biz', name: 'WhatsApp Business Platform', status: 'disconnected', category: 'Messaging', icon: 'MessageCircle', description: 'Conecta o número oficial do seu cliente para enviar notificações, modelos de proposta e conversar com IA recomendatória.', requiresOAuth: true },
    { id: 'pagespeed', name: 'Google PageSpeed Insights', status: 'connected', category: 'SEO/AI', icon: 'Activity', description: 'Calcula os tempos exatos de Core Web Vitals (LCP, CLS, FID) em celulares simulados na região do cliente.', requiresOAuth: false },
    { id: 'semrush', name: 'SEMrush Analytics API', status: 'disconnected', category: 'SEO/AI', icon: 'Search', description: 'Extrai estatísticas de volumes de palavras-chave locais e monitora concorrência orgânica.', requiresOAuth: false },
    { id: 'stripe', name: 'Stripe Payment Gateway', status: 'disconnected', category: 'Payment', icon: 'CreditCard', description: 'Gerencia o faturamento e renovação de mensalidades e planos SaaS de seus clientes.', requiresOAuth: false }
  ]);

  const [crmLeads, setCrmLeads] = useState<Lead[]>([
    {
      id: 'l-1',
      companyName: 'Marmoraria Imperial Ltda',
      responsible: 'Carlos Alberto',
      phone: '(11) 98765-4321',
      whatsapp: '(11) 98765-4321',
      email: 'carlos@marmorariaimperial.com.br',
      city: 'São Paulo',
      state: 'SP',
      website: '',
      instagram: 'instagram.com/marmorariaimperial',
      facebook: '',
      linkedin: '',
      googleProfile: 'https://maps.google.com/?cid=123',
      atlasScore: 32,
      status: 'Novo',
      lastContact: 'Não efetuado',
      nextAction: 'Enviar Primeira Auditoria',
      closeProbability: 65,
      notes: 'Empresa sem site mapeada pelo radar de São Paulo. Tem grande presença local de mercado no Google Maps com 180 avaliações 5 estrelas.',
      segment: 'Marmoraria',
      createdAt: new Date().toISOString()
    },
    {
      id: 'l-2',
      companyName: 'Solaris Eco Energia',
      responsible: 'Renata Souza',
      phone: '(11) 97777-8888',
      whatsapp: '(11) 97777-8888',
      email: 'renata@solariseconet.com.br',
      city: 'Campinas',
      state: 'SP',
      website: 'www.solariseconet.com.br',
      instagram: 'instagram.com/solariseconet',
      facebook: '',
      linkedin: '',
      googleProfile: 'https://maps.google.com/?cid=456',
      atlasScore: 48,
      status: 'Contato',
      lastContact: 'Ontem, 14:00',
      nextAction: 'Reunião Técnica de Payback',
      closeProbability: 40,
      notes: 'Site atual é extremamente lento no celular (LCP de 5.2s). Demonstraram grande interesse na reestruturação e no sitemap acelerado.',
      segment: 'Energia Solar',
      createdAt: new Date().toISOString()
    },
    {
      id: 'l-3',
      companyName: 'Vidraçaria Cristal Glass',
      responsible: 'Samuel Ferreira',
      phone: '(21) 96543-2109',
      whatsapp: '(21) 96543-2109',
      email: 'samuel@vidros-cristal.com.br',
      city: 'Rio de Janeiro',
      state: 'RJ',
      website: '',
      instagram: 'instagram.com/vidroscristal',
      facebook: '',
      linkedin: '',
      googleProfile: 'https://maps.google.com/?cid=789',
      atlasScore: 28,
      status: 'Resposta',
      lastContact: 'Hoje, 10:15',
      nextAction: 'Desenvolver Esboço de Proposta',
      closeProbability: 80,
      notes: 'Sem site ativo. Samuel busca uma Landing Page para promover fechamentos de coberturas de vidro e esquadrias de alumínio em condomínios.',
      segment: 'Vidraçaria',
      createdAt: new Date().toISOString()
    }
  ]);

  const handleAddLeadToCrm = (newLead: Omit<Lead, 'id' | 'createdAt'>) => {
    const leadWithId: Lead = {
      ...newLead,
      id: `lead-added-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setCrmLeads((prev) => [leadWithId, ...prev]);
  };

  const handleUpdateLeadStatus = (leadId: string, newStatus: LeadStatus) => {
    setCrmLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  const handleUpdateLead = (updatedLead: Lead) => {
    setCrmLeads((prev) => prev.map((l) => l.id === updatedLead.id ? updatedLead : l));
  };

  const handleDeleteLead = (leadId: string) => {
    setCrmLeads((prev) => prev.filter((l) => l.id !== leadId));
  };

  const handleUpdateIntegration = (id: string, state: 'connected' | 'disconnected') => {
    setIntegrations((prev) => prev.map((item) => item.id === id ? { ...item, status: state } : item));
  };

  const handleSelectLeadForCopilot = (lead: Lead) => {
    setSelectedLeadForCopilot(lead);
    setActivePortalTab('copilot');
  };

  const handleTriggerAuditForLead = (lead: Lead) => {
    alert(`Iniciando Auditoria Atlas Score Completa para "${lead.companyName}"...\nO relatório executivo detalhado em PDF será gerado com o mecanismo técnico proprietário.`);
  };


  // Track header background on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openContactWithPrefill = (subject: string) => {
    setSelectedPrefillSubject(subject);
    setIsContactModalOpen(true);
  };

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Icon mapping helper
  function renderIcon(name: string, className = "w-6 h-6 text-[#E2B755]") {
    switch (name) {
      case 'ZapOff': return <ZapOff className={className} />;
      case 'SearchCode': return <SearchCode className={className} />;
      case 'Coins': return <Coins className={className} />;
      case 'ShieldAlert': return <ShieldAlert className={className} />;
      case 'Smartphone': return <Smartphone className={className} />;
      case 'Paintbrush': return <Paintbrush className={className} />;
      case 'Award': return <Award className={className} />;
      case 'TrendingUp': return <TrendingUp className={className} />;
      case 'Gauge': return <Gauge className={className} />;
      case 'Server': return <Server className={className} />;
      case 'MessageSquareShare': return <MessageSquareShare className={className} />;
      case 'ClipboardList': return <ClipboardList className={className} />;
      case 'BarChart3': return <BarChart3 className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'MapPin': return <MapPin className={className} />;
      case 'MousePointerClick': return <MousePointerClick className={className} />;
      case 'SearchIcon': return <Search className={className} />;
      case 'FileText': return <FileText className={className} />;
      case 'Palette': return <Palette className={className} />;
      case 'Code': return <Code className={className} />;
      case 'CheckCircle2': return <CheckCircle2 className={className} />;
      case 'Rocket': return <Rocket className={className} />;
      case 'Clock': return <Clock className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Compass': return <Compass className={className} />;
      case 'Activity': return <Activity className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Layout': return <Layout className={className} />;
      case 'FolderEdit': return <FolderEdit className={className} />;
      case 'Target': return <Target className={className} />;
      case 'Star': return <Star className={className} />;
      default: return <Sparkles className={className} />;
    }
  }

  if (isPortalActive) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#F3F4F6] font-sans antialiased flex selection:bg-[#E2B755]/20 selection:text-white">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-64 bg-[#09090b] border-r border-zinc-900 flex flex-col justify-between shrink-0 hidden md:flex">
          
          <div className="p-6 space-y-6">
            {/* Header / Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-black border border-zinc-800 flex items-center justify-center text-emerald-400">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-white text-xs font-black font-display block tracking-tight">ATLAS INTELLIGENCE</span>
                <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">SAAS PLATFORM</span>
              </div>
            </div>

            {/* Sidebar Tab Selectors */}
            <nav className="space-y-1 text-left">
              {[
                { id: 'dashboard', label: 'Painel Executivo', icon: Layout },
                { id: 'radar', label: 'Radar de Mercado', icon: Compass },
                { id: 'crm', label: 'CRM Inteligente', icon: ClipboardList },
                { id: 'copilot', label: 'Atlas Copilot IA', icon: Bot },
                { id: 'automacoes', label: 'APIs & Conexões', icon: Settings },
                { id: 'segments', label: 'Foco por Nicho', icon: Layers },
                { id: 'blog', label: 'Editorial & Blog', icon: FileText },
                { id: 'docs', label: 'Blueprint Técnico', icon: Server },
                { id: 'planos', label: 'Planos & Licenças', icon: Coins }
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activePortalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActivePortalTab(tab.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 ${
                      isSelected 
                        ? 'bg-zinc-900 text-[#E2B755] font-semibold border-l-2 border-[#E2B755]' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-950'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#E2B755]' : 'text-zinc-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User profile / Logout bar */}
          <div className="p-4 border-t border-zinc-900 bg-black/40 space-y-3 text-left">
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-7.5 h-7.5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-white uppercase font-mono">
                {currentUser ? currentUser.substring(0, 2) : "C"}
              </div>
              <div className="overflow-hidden">
                <span className="text-white text-[10px] font-bold block truncate">{currentUser || "Consultor Sênior"}</span>
                <span className="text-zinc-500 text-[8px] font-mono block truncate">Acesso Administrativo</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsPortalActive(false);
                setCurrentUser(null);
              }}
              className="w-full py-2 bg-zinc-950 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-zinc-900 hover:border-red-900/40 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair do Portal
            </button>
          </div>

        </aside>

        {/* Mobile top workspace bar */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#060608]">
          
          <header className="h-16 border-b border-zinc-900 bg-[#09090b]/80 backdrop-blur px-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setIsPortalActive(false);
                  setCurrentUser(null);
                }} 
                className="text-zinc-400 hover:text-white text-xs font-mono font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-900"
              >
                &larr; Voltar para o Site
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden sm:inline">Status do Cluster: <strong className="text-emerald-400 font-bold">ONLINE</strong></span>
              <div className="h-4 w-px bg-zinc-900 hidden sm:inline" />
              <div className="text-right">
                <span className="text-white text-[11px] font-semibold block">{currentUser || "Acesso de Teste"}</span>
                <span className="text-[#E2B755] text-[9px] font-mono block uppercase tracking-wider">Atlas Intelligence SaaS</span>
              </div>
            </div>
          </header>

          {/* Main workspace scrollable container */}
          <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
            
            {!currentUser ? (
              <AuthPage onLoginSuccess={(email) => setCurrentUser(email)} />
            ) : (
              <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                {activePortalTab === 'dashboard' && (
                  <ExecutiveDashboard 
                    leads={crmLeads} 
                    onNavigateToTab={(tab) => setActivePortalTab(tab)} 
                  />
                )}

                {activePortalTab === 'radar' && (
                  <RadarDeMercado 
                    onAddLeadToCrm={handleAddLeadToCrm} 
                    crmLeads={crmLeads}
                  />
                )}

                {activePortalTab === 'crm' && (
                  <CrmInteligente 
                    leads={crmLeads} 
                    onUpdateLeadStatus={handleUpdateLeadStatus} 
                    onUpdateLead={handleUpdateLead} 
                    onDeleteLead={handleDeleteLead} 
                    onAddLead={handleAddLeadToCrm}
                    onSelectLeadForCopilot={handleSelectLeadForCopilot}
                    onTriggerAuditForLead={handleTriggerAuditForLead}
                  />
                )}

                {activePortalTab === 'copilot' && (
                  <AtlasCopilot 
                    leads={crmLeads}
                    selectedLead={selectedLeadForCopilot}
                    onSelectLead={(lead) => setSelectedLeadForCopilot(lead)}
                  />
                )}

                {activePortalTab === 'automacoes' && (
                  <Automacoes 
                    integrations={integrations} 
                    onIntegrate={handleUpdateIntegration} 
                    currentUser={currentUser}
                  />
                )}

                {activePortalTab === 'segments' && (
                  <SegmentPages />
                )}

                {activePortalTab === 'blog' && (
                  <SaaSBlog />
                )}

                {activePortalTab === 'docs' && (
                  <SaaSDocs />
                )}

                {activePortalTab === 'planos' && (
                  <PrecosPlanos />
                )}
              </div>
            )}

          </main>
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0E] text-[#F3F4F6] font-sans antialiased overflow-x-hidden selection:bg-[#E2B755]/20 selection:text-white">
      
      {/* HEADER / NAVIGATION */}
      <header 
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled 
            ? 'bg-[#0B0B0E]/95 backdrop-blur-md border-b border-zinc-900/60 py-3.5 shadow-xl' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo */}
          <div onClick={() => scrollToSection('home')} className="cursor-pointer">
            <AtlasLogo />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-[11px] font-medium tracking-widest uppercase text-zinc-400">
            <button onClick={() => scrollToSection('home')} className="hover:text-white transition-colors">Início</button>
            <button onClick={() => scrollToSection('solucoes')} className="hover:text-white transition-colors">Soluções</button>
            <button onClick={() => scrollToSection('portfolio')} className="hover:text-white transition-colors">Portfólio</button>
            <button onClick={() => scrollToSection('diagnostico')} className="text-zinc-200 hover:text-white transition-all font-semibold flex items-center gap-1.5 border border-zinc-800 rounded-full px-3 py-1 bg-zinc-900/30 hover:bg-zinc-900/80">
              <Award className="w-3.5 h-3.5" />
              Atlas Score
            </button>
            <button onClick={() => scrollToSection('processo')} className="hover:text-white transition-colors">Como Funciona</button>
            <button onClick={() => scrollToSection('diferenciais')} className="hover:text-white transition-colors">Sobre</button>
            <button onClick={() => scrollToSection('simulador')} className="hover:text-white transition-colors">Simulador</button>
          </nav>

          {/* Desktop Call to Action */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => {
                setIsPortalActive(true);
                setActivePortalTab('dashboard');
              }}
              className="text-[#E2B755] hover:text-white font-bold text-xs uppercase tracking-wider py-2.5 px-5 rounded-full border border-[#E2B755]/20 hover:border-[#E2B755] bg-yellow-500/[0.02] hover:bg-yellow-500/10 transition-all duration-300"
            >
              Acessar Portal SaaS
            </button>
            <button
              onClick={() => openContactWithPrefill('Diagnóstico Gratuito de Presença Digital')}
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs py-2.5 px-6 rounded-full transition-all duration-300 hover:scale-[1.02]"
              id="header-cta-btn"
            >
              Iniciar Diagnóstico
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE MENU DROPDOWN */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-[60px] z-30 bg-[#0B0B0E] border-b border-zinc-900 p-6 flex flex-col gap-4 text-xs font-semibold tracking-widest uppercase text-gray-300 lg:hidden shadow-2xl"
          >
            <button onClick={() => scrollToSection('home')} className="text-left py-2 hover:text-[#E2B755]">Início</button>
            <button onClick={() => scrollToSection('solucoes')} className="text-left py-2 hover:text-[#E2B755]">Soluções</button>
            <button onClick={() => scrollToSection('portfolio')} className="text-left py-2 hover:text-[#E2B755]">Portfólio</button>
            <button onClick={() => { setIsMenuOpen(false); scrollToSection('diagnostico'); }} className="text-left py-2 text-[#E2B755] font-bold flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Diagnóstico Atlas Score
            </button>
            <button 
              onClick={() => { 
                setIsMenuOpen(false); 
                setIsPortalActive(true); 
                setActivePortalTab('dashboard');
              }} 
              className="text-left py-2 text-[#E2B755] font-bold flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4 text-[#E2B755]" />
              Acessar Portal SaaS
            </button>
            <button onClick={() => scrollToSection('processo')} className="text-left py-2 hover:text-[#E2B755]">Como Funciona</button>
            <button onClick={() => scrollToSection('diferenciais')} className="text-left py-2 hover:text-[#E2B755]">Diferenciais</button>
            <button onClick={() => scrollToSection('simulador')} className="text-left py-2 hover:text-[#E2B755]">Simulador</button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsContactModalOpen(true);
              }}
              className="w-full bg-[#E2B755] text-[#0B0B0E] font-bold py-3.5 px-5 rounded-lg text-center mt-2 hover:bg-yellow-500"
            >
              Analisar minha presença digital
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section id="home" className="relative min-h-screen pt-36 pb-24 flex items-center justify-center overflow-hidden bg-[#0B0B0E]">
        
        {/* Background Image of building with premium overlay styling */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0E]/95 via-[#0B0B0E]/85 to-[#0B0B0E] z-10" />
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000" 
            alt="Arquitetura de Negócios Luxo" 
            className="w-full h-full object-cover opacity-15"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Decorative Grid Lines / Elegant spacing */}
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-6 space-y-10 text-center lg:text-left">
            
            {/* Dynamic Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-950/80 border border-zinc-900 text-[10px] uppercase font-semibold tracking-[0.15em] text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E2B755]"></span>
              <span>Atlas Digital &bull; Experiência Premium</span>
            </div>

            <div className="space-y-6">
              {/* Massive Premium Bold Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6.5xl font-display font-black tracking-tight text-white leading-[1.1]">
                Transformamos empresas em marcas digitais de alta performance.
              </h1>

              {/* Persuasive Subheading */}
              <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans font-light">
                Sites premium, SEO e inteligência artificial para gerar mais oportunidades comerciais.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-2">
              <button
                onClick={() => {
                  const el = document.getElementById('diagnostico');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-[#000000] font-semibold text-xs uppercase tracking-wider py-4 px-8 rounded-full shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95"
                id="hero-primary-cta"
              >
                Solicitar diagnóstico digital
              </button>
              
              <button
                onClick={() => openContactWithPrefill('Solicitação de Diagnóstico Gratuito - Home')}
                className="w-full sm:w-auto bg-zinc-950/90 hover:bg-zinc-900 text-white border border-zinc-800 hover:border-zinc-700 font-semibold text-xs uppercase tracking-wider py-4 px-8 rounded-full flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02]"
                id="hero-secondary-cta"
              >
                Falar com consultor
              </button>
            </div>

            {/* Targeted Segments Small Slider */}
            <div className="pt-6 border-t border-zinc-900/60 max-w-lg mx-auto lg:mx-0">
              <span className="block text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-3">Atendimento especializado em alto padrão</span>
              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {TARGET_SEGMENTS.map((seg, idx) => (
                  <span 
                    key={idx} 
                    className="text-[10px] font-bold bg-[#121214] text-zinc-400 py-1.5 px-3 rounded-lg border border-zinc-800 hover:border-[#E2B755]/30 hover:text-white transition-colors cursor-default"
                  >
                    {seg}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Right Hero Column - Showcase Notebook & Mobile renderers */}
          <div className="lg:col-span-6 w-full relative">
            <MockupShowcase 
              onSelectSegment={setActiveShowcaseSegment}
              openContactModal={openContactWithPrefill}
            />
          </div>

        </div>
      </section>

      {/* SEÇÃO PROBLEMA */}
      <section id="problemas" className="py-20 bg-[#121214]/40 border-y border-zinc-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-mono font-bold">O Diagnóstico Real</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white tracking-tight leading-tight">
              Seu site está gerando clientes ou apenas existe?
            </h2>
            <p className="text-sm md:text-base text-zinc-400 font-light leading-relaxed max-w-2xl mx-auto">
              Ter um site defasado afasta seus melhores leads e desvaloriza a percepção sobre a sua entrega.
            </p>
          </div>

          {/* 6 Problems Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PROBLEMS.map((prob) => (
              <div 
                key={prob.id}
                className="p-8 bg-zinc-950/40 border border-zinc-900 rounded-3xl transition-all duration-300 hover:border-zinc-800 flex flex-col gap-5 text-left"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center border border-zinc-900 bg-zinc-950 text-zinc-300">
                  {renderIcon(prob.iconName, "w-4 h-4 text-zinc-300")}
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-white text-base tracking-tight">{prob.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">{prob.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SEÇÃO SOLUÇÃO */}
      <section id="solucoes" className="py-32 relative bg-black">
        {/* Decorative subtle background gradient */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-zinc-900/[0.05] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-mono font-bold">Nosso DNA</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white tracking-tight leading-tight">
              A Solução que Sua Empresa Precisa
            </h2>
            <p className="text-sm md:text-base text-zinc-400 font-light leading-relaxed max-w-2xl mx-auto">
              Não fazemos sites comuns. Desenvolvemos plataformas corporativas e catálogos interativos de altíssimo padrão, desenhados cirurgicamente para gerar oportunidades e novos negócios.
            </p>
          </div>

          {/* Solutions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {SOLUTIONS.map((sol) => (
              <div 
                key={sol.id}
                className="p-6 bg-zinc-950/40 border border-zinc-900 rounded-3xl flex flex-col justify-between transition-all duration-300 hover:border-zinc-800"
              >
                <div className="space-y-4 text-left">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center border border-zinc-900 bg-zinc-950 text-zinc-300">
                    {renderIcon(sol.iconName, "w-4 h-4 text-zinc-300")}
                  </div>
                  <h3 className="font-semibold text-sm text-white tracking-tight">{sol.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">{sol.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* PORTFÓLIO */}
      <section id="portfolio" className="py-32 bg-black border-y border-zinc-900/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-mono font-bold">Portfólio Selecionado</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white tracking-tight leading-tight">
              Experiências Digitais Sob Medida
            </h2>
            <p className="text-sm md:text-base text-zinc-400 font-light leading-relaxed max-w-2xl mx-auto">
              Cada segmento exige uma engenharia exclusiva. Conheça a anatomia de alguns de nossos projetos desenvolvidos para máxima performance.
            </p>
          </div>

          {/* 3 Large Portfolio Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {PORTFOLIO.map((item) => (
              <div 
                key={item.id}
                className="group flex flex-col justify-between bg-zinc-950/50 border border-zinc-900 rounded-[32px] overflow-hidden transition-all duration-300 hover:border-zinc-800 h-full"
              >
                {/* Image Container with Hover Zoom */}
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950">
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10 opacity-60" />
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-4 left-4 z-20 bg-black/80 backdrop-blur-md border border-zinc-800 text-white text-[10px] font-medium tracking-wider uppercase py-1 px-3 rounded-full">
                    {item.segment}
                  </span>
                </div>

                {/* Info Container */}
                <div className="p-8 space-y-6 flex-1 flex flex-col justify-between text-left">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-medium tracking-wider text-zinc-500">{item.subtitle}</span>
                      <h3 className="text-lg font-semibold text-white group-hover:text-zinc-200 transition-colors leading-tight mt-1">
                        {item.title}
                      </h3>
                    </div>
                    
                    <p className="text-xs text-zinc-400 leading-relaxed font-light">
                      {item.description}
                    </p>

                    {/* Features badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.features.map((feat, idx) => (
                        <span key={idx} className="text-[9px] font-medium bg-black text-zinc-400 py-1.5 px-3 rounded-full border border-zinc-900 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA button */}
                  <div className="pt-6 border-t border-zinc-900">
                    <button
                      onClick={() => openContactWithPrefill(item.segment)}
                      className="w-full bg-black hover:bg-white text-zinc-400 hover:text-black border border-zinc-900 hover:border-white font-medium text-xs uppercase tracking-wider py-3 px-5 rounded-full flex items-center justify-center gap-1.5 transition-all duration-300"
                    >
                      Solicitar Projeto Similar
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SEÇÃO PREMIUM: VISUALIZAR MODELO INTERATIVO (DEMONSTRAÇÃO AO VIVO) */}
      <SegmentDemoShowcase openContactWithPrefill={openContactWithPrefill} />

      {/* INTERACTIVE SCOPE BUILDER / CALCULATOR HIGHLIGHT */}
      <section id="simulador" className="py-32 relative bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-mono font-bold">Personalização</span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight leading-tight">
              Personalize seu projeto
            </h2>
            <p className="text-sm text-zinc-400 font-light leading-relaxed">
              Defina os recursos de que sua marca necessita e envie a configuração para receber uma proposta sob medida sem qualquer compromisso.
            </p>
          </div>

          <BudgetSimulator />

        </div>
      </section>

      {/* ATLAS DIGITAL SCORE PREMIUM DIAGNOSTIC MODULE */}
      <div id="diagnostico" className="scroll-mt-24 space-y-16 py-32 bg-zinc-950/20 border-y border-zinc-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DemonstracaoGratuita 
            onUnlockPremium={() => {
              setIsPortalActive(true);
              setActivePortalTab('dashboard');
              scrollToSection('home');
            }} 
          />
        </div>
        
        <AtlasScoreModule />
      </div>

      {/* COMO FUNCIONA (TIMELINE) */}
      <section id="processo" className="py-32 bg-black border-y border-zinc-900/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-mono font-bold">Metodologia</span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight leading-tight">
              Do conceito ao resultado
            </h2>
            <p className="text-sm md:text-base text-zinc-400 font-light leading-relaxed max-w-2xl mx-auto">
              Garantimos velocidade e excelência técnica, desde a concepção do diagnóstico até a entrega do projeto com suporte contínuo.
            </p>
          </div>

          {/* Timeline Grid layout */}
          <div className="relative">
            {/* Dashed Line behind steps for tablet/desktop */}
            <div className="hidden lg:block absolute top-[60px] inset-x-8 h-0.5 border-t border-dashed border-zinc-900 z-0" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 relative z-10">
              {STEPS.map((step, idx) => (
                <div 
                  key={idx}
                  className="bg-zinc-950/40 border border-zinc-900 p-6 rounded-3xl flex flex-col justify-between relative hover:border-zinc-800 transition-all duration-300 text-left"
                >
                  <div className="space-y-4">
                    {/* Circle counter */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold font-mono text-white bg-zinc-900 w-8 h-8 rounded-full flex items-center justify-center">
                        {step.number}
                      </span>
                      <div className="text-zinc-500">
                        {renderIcon(step.iconName, "w-4 h-4 text-zinc-500")}
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-sm text-white tracking-tight">{step.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-light">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to action card right below timeline */}
          <div className="mt-16 bg-zinc-950/40 border border-zinc-900 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-800 text-white">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-white">Pronto para dar o próximo passo na sua presença digital?</h4>
                <p className="text-xs text-zinc-400 max-w-xl font-light">
                  Criamos um diagnóstico gratuito exclusivo avaliando sua concorrência local, as palavras-chave mais buscadas e os recursos recomendados.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => openContactWithPrefill('Diagnóstico Gratuito - Timeline')}
              className="w-full md:w-auto bg-white hover:bg-zinc-200 text-black text-xs font-semibold py-3.5 px-6 rounded-full shrink-0 transition-all hover:scale-[1.02]"
            >
              Solicitar Diagnóstico Gratuito
            </button>
          </div>

        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section id="diferenciais" className="py-32 relative bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-mono font-bold">Excelência</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white tracking-tight leading-tight">
              Os diferenciais de nossa engenharia
            </h2>
            <p className="text-sm md:text-base text-zinc-400 font-light leading-relaxed max-w-2xl mx-auto">
              Não entregamos apenas layouts limpos. Nossa prioridade absoluta é velocidade extrema, SEO de alto impacto local e código sob medida de alta segurança.
            </p>
          </div>

          {/* 8 Differentials Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DIFFERENTIALS.map((diff) => (
              <div 
                key={diff.id}
                className="p-6 bg-zinc-950/40 border border-zinc-900 rounded-[32px] flex flex-col justify-between transition-all duration-300 hover:border-zinc-800 text-left"
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center border border-zinc-900 bg-zinc-950 text-zinc-300">
                    {renderIcon(diff.iconName, "w-4 h-4 text-zinc-300")}
                  </div>
                  <h3 className="font-semibold text-sm text-white tracking-tight">{diff.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">{diff.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="py-32 bg-black border-y border-zinc-900/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-mono font-bold">Resultados</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white tracking-tight leading-tight">
              Quem confia na Atlas
            </h2>
            <p className="text-sm md:text-base text-zinc-400 font-light leading-relaxed max-w-2xl mx-auto">
              Veja depoimentos de empresários da marmoraria, energia solar e vidraçarias que viram seus pedidos de orçamento decolarem.
            </p>
          </div>

          {/* 3 Testimonials Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {TESTIMONIALS.map((test) => (
              <div 
                key={test.id}
                className="bg-zinc-950/40 border border-zinc-900 rounded-[32px] p-8 flex flex-col justify-between gap-6 text-left"
              >
                <div className="space-y-4">
                  {/* Rating Stars */}
                  <div className="flex gap-1">
                    {[...Array(test.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-[#E2B755] fill-[#E2B755]" />
                    ))}
                  </div>

                  {/* Text */}
                  <p className="text-xs text-zinc-300 leading-relaxed font-light italic">
                    "{test.text}"
                  </p>
                </div>

                {/* Profile Card */}
                <div className="flex items-center gap-3 pt-4 border-t border-zinc-900">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-950 shrink-0 border border-zinc-900">
                    <img 
                      src={test.avatar} 
                      alt={test.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-white leading-none">{test.name}</h4>
                    <span className="text-[10px] text-zinc-500 font-medium">{test.company}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* PERGUNTAS FREQUENTES */}
      <FAQSection />

      {/* CTA FINAL */}
      <section className="py-32 relative overflow-hidden text-center bg-black border-t border-zinc-900/40">
        
        {/* Subtle glow decoration */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-zinc-900/[0.03] rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-950 border border-zinc-900 text-zinc-400 text-[10px] font-mono font-bold uppercase rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            Parceria de Sucesso Comercial
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white leading-tight">
              Sua empresa merece <br className="hidden sm:inline" />
              um site de alta performance.
            </h2>
            
            <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed font-light">
              Chega de perder clientes qualificados por ter uma presença digital fraca. Solicite agora uma análise gratuita e descubra como podemos aumentar seus pedidos de orçamento.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto pt-4">
            <button
              onClick={() => openContactWithPrefill('Diagnóstico Gratuito - CTA Final')}
              className="w-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs uppercase tracking-wider py-4 px-8 rounded-full transition-all duration-300 hover:scale-[1.02]"
              id="cta-final-btn"
            >
              Solicitar Diagnóstico Gratuito
            </button>
            
            <a
              href="https://wa.me/5551994578544?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20uma%20an%C3%A1lise%20gratuita%20do%20meu%20site%20e%20saber%20dos%20or%C3%A7amentos."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-white font-semibold text-xs uppercase tracking-wider py-4 px-6 rounded-full flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-green-500 fill-green-500" />
              WhatsApp Direto
            </a>
          </div>

          {/* Quick Stats list under CTA */}
          <div className="pt-10 flex flex-wrap justify-center gap-6 md:gap-12 text-center text-zinc-500 text-[11px] uppercase tracking-wider font-mono">
            <div>
              <div className="text-white text-base font-semibold">100%</div>
              <div className="mt-1">Exclusivo</div>
            </div>
            <div className="w-px h-6 bg-zinc-900 self-center hidden sm:block"></div>
            <div>
              <div className="text-white text-base font-semibold">&lt; 1.5s</div>
              <div className="mt-1">Carregamento</div>
            </div>
            <div className="w-px h-6 bg-zinc-900 self-center hidden sm:block"></div>
            <div>
              <div className="text-white text-base font-semibold">95+</div>
              <div className="mt-1">Lighthouse SEO</div>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black border-t border-zinc-900/60 py-16 md:py-20 text-zinc-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-12">
          
          {/* Col 1: Brand details */}
          <div className="space-y-4">
            <AtlasLogo />
            <p className="text-[11px] text-zinc-500 leading-relaxed font-light">
              Especialistas em engenharia de conversão e sites de alto padrão para marmorarias, vidraçarias, energia solar e construtoras.
            </p>
          </div>

          {/* Col 2: Institucional */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold uppercase tracking-widest text-[10px]">Institucional</h4>
            <ul className="space-y-2 text-[11px] font-light">
              <li><button onClick={() => setActiveLegalDoc('sobre')} className="hover:text-white transition-colors text-left">Sobre Nós</button></li>
              <li><button onClick={() => setIsContactModalOpen(true)} className="hover:text-white transition-colors text-left">Contato</button></li>
              <li><button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors text-left">Perguntas Frequentes</button></li>
            </ul>
          </div>

          {/* Col 3: Navigation Map */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold uppercase tracking-widest text-[10px]">Navegação</h4>
            <ul className="space-y-2 text-[11px] font-light">
              <li><button onClick={() => scrollToSection('home')} className="hover:text-white transition-colors text-left">Início</button></li>
              <li><button onClick={() => scrollToSection('solucoes')} className="hover:text-white transition-colors text-left">Nossas Soluções</button></li>
              <li><button onClick={() => scrollToSection('portfolio')} className="hover:text-white transition-colors text-left">Portfólio / Casos</button></li>
              <li><button onClick={() => scrollToSection('diagnostico')} className="hover:text-white transition-colors text-left">Atlas Score IA</button></li>
              <li><button onClick={() => scrollToSection('processo')} className="hover:text-white transition-colors text-left">Como Trabalhamos</button></li>
            </ul>
          </div>

          {/* Col 4: Legal */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold uppercase tracking-widest text-[10px]">Legal</h4>
            <ul className="space-y-2 text-[11px] font-light">
              <li><button onClick={() => setActiveLegalDoc('privacidade')} className="hover:text-white transition-colors text-left">Política de Privacidade</button></li>
              <li><button onClick={() => setActiveLegalDoc('termos')} className="hover:text-white transition-colors text-left">Termos de Uso</button></li>
              <li><button onClick={() => setActiveLegalDoc('cookies')} className="hover:text-white transition-colors text-left">Política de Cookies</button></li>
              <li><button onClick={() => setActiveLegalDoc('reembolso')} className="hover:text-white transition-colors text-left">Política de Reembolso</button></li>
            </ul>
          </div>

          {/* Col 5: Target Segments */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold uppercase tracking-widest text-[10px]">Setores</h4>
            <ul className="space-y-1.5 text-[11px] font-light">
              {TARGET_SEGMENTS.map((seg, idx) => (
                <li key={idx} className="flex items-center gap-1.5 text-zinc-500">
                  <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                  <span>{seg}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 6: Contact details */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold uppercase tracking-widest text-[10px]">Fale Conosco</h4>
            <ul className="space-y-2.5 text-[11px] font-light">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                <a href="https://wa.me/5551994578544" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  +55 (51) 99457-8544
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                <a href="mailto:contato@atlasdigital.ia.br" className="hover:text-white transition-colors">
                  contato@atlasdigital.ia.br
                </a>
              </li>
              <li className="flex items-start gap-2 text-zinc-500 leading-tight">
                <MapPin className="w-4 h-4 text-zinc-500 shrink-0 animate-pulse" />
                <span>Atendimento presencial e remoto em todo o território nacional.</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-zinc-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-zinc-600 font-light">
          <div>
            &copy; {new Date().getFullYear()} Atlas Digital. Todos os direitos reservados. CNPJ: 66.204.635/0001-19.
          </div>
          <div className="flex gap-4">
            <button onClick={() => setActiveLegalDoc('privacidade')} className="hover:text-white cursor-pointer">Política de Privacidade</button>
            <span>&bull;</span>
            <button onClick={() => setActiveLegalDoc('termos')} className="hover:text-white cursor-pointer">Termos de Uso</button>
            <span>&bull;</span>
            <button onClick={() => setActiveLegalDoc('reembolso')} className="hover:text-white cursor-pointer">Política de Reembolso</button>
          </div>
        </div>
      </footer>

      {/* FIXED FLOATING WHATSAPP BUTTON */}
      <a
        href="https://wa.me/5551994578544?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20uma%20proposta%20comercial%20da%20Atlas%20Digital."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-green-600 hover:bg-green-500 text-white p-3.5 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center group"
        aria-label="Fale Conosco no WhatsApp"
        id="floating-whatsapp-btn"
      >
        <MessageCircle className="w-6 h-6 fill-white" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-300 ease-out font-bold text-[10px] uppercase tracking-widest pl-0 group-hover:pl-2">
          WhatsApp
        </span>
      </a>

      {/* INTERACTIVE MODAL */}
      <InteractiveContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)}
        prefilledSubject={selectedPrefillSubject}
      />

      {/* LEGAL MODALS */}
      <LegalModals 
        activeDoc={activeLegalDoc} 
        onClose={() => setActiveLegalDoc(null)} 
      />

    </div>
  );
}
