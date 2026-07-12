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
  Instagram,
  Facebook,
  Linkedin,
  ExternalLink,
  Play,
  Check,
  Building2
} from 'lucide-react';

import { PROBLEMS, SOLUTIONS, PORTFOLIO, STEPS, DIFFERENTIALS, TESTIMONIALS, TARGET_SEGMENTS } from './data';
import MockupShowcase from './components/MockupShowcase';
import BudgetSimulator from './components/BudgetSimulator';
import InteractiveContactModal from './components/InteractiveContactModal';
import SegmentDemoShowcase from './components/SegmentDemoShowcase';
import AtlasLogo from './components/AtlasLogo';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedPrefillSubject, setSelectedPrefillSubject] = useState<string>('');
  const [activeShowcaseSegment, setActiveShowcaseSegment] = useState<string>('Marmorarias');
  const [scrolled, setScrolled] = useState(false);

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
  function renderIcon(name: string, className = "w-6 h-6 text-[#F5B301]") {
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

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#E5E7EB] font-sans antialiased overflow-x-hidden selection:bg-[#F5B301]/30 selection:text-white">
      
      {/* HEADER / NAVIGATION */}
      <header 
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled 
            ? 'bg-[#0B0F19]/90 backdrop-blur-md border-b border-gray-900/80 py-3 shadow-lg' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo */}
          <div onClick={() => scrollToSection('home')} className="cursor-pointer">
            <AtlasLogo />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold tracking-wider uppercase text-gray-300">
            <button onClick={() => scrollToSection('home')} className="hover:text-[#F5B301] transition-colors">Início</button>
            <button onClick={() => scrollToSection('problemas')} className="hover:text-[#F5B301] transition-colors">Problemas</button>
            <button onClick={() => scrollToSection('solucoes')} className="hover:text-[#F5B301] transition-colors">Soluções</button>
            <button onClick={() => scrollToSection('portfolio')} className="hover:text-[#F5B301] transition-colors">Portfólio</button>
            <button onClick={() => scrollToSection('processo')} className="hover:text-[#F5B301] transition-colors">Como Funciona</button>
            <button onClick={() => scrollToSection('diferenciais')} className="hover:text-[#F5B301] transition-colors">Sobre</button>
            <button onClick={() => scrollToSection('simulador')} className="text-[#F5B301] hover:text-white font-bold flex items-center gap-1 transition-colors">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Simulador
            </button>
          </nav>

          {/* Desktop Call to Action */}
          <div className="hidden lg:block">
            <button
              onClick={() => openContactWithPrefill('')}
              className="bg-[#F5B301] hover:bg-[#b48400] text-[#0B0F19] font-bold text-xs uppercase tracking-wide py-2.5 px-5 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#f5b3011e]"
              id="header-cta-btn"
            >
              Solicitar Análise Gratuita
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
            className="fixed inset-x-0 top-[60px] z-30 bg-[#0B0F19] border-b border-gray-800 p-6 flex flex-col gap-4 text-sm font-semibold tracking-widest uppercase text-gray-300 lg:hidden shadow-2xl"
          >
            <button onClick={() => scrollToSection('home')} className="text-left py-2 hover:text-[#F5B301]">Início</button>
            <button onClick={() => scrollToSection('problemas')} className="text-left py-2 hover:text-[#F5B301]">Problemas</button>
            <button onClick={() => scrollToSection('solucoes')} className="text-left py-2 hover:text-[#F5B301]">Soluções</button>
            <button onClick={() => scrollToSection('portfolio')} className="text-left py-2 hover:text-[#F5B301]">Portfólio</button>
            <button onClick={() => scrollToSection('processo')} className="text-left py-2 hover:text-[#F5B301]">Como Funciona</button>
            <button onClick={() => scrollToSection('diferenciais')} className="text-left py-2 hover:text-[#F5B301]">Diferenciais</button>
            <button onClick={() => scrollToSection('simulador')} className="text-left py-2 text-[#F5B301] font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Simulador de Escopo
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsContactModalOpen(true);
              }}
              className="w-full bg-[#F5B301] text-[#0B0F19] font-bold py-3 px-5 rounded-lg text-center mt-2 hover:bg-yellow-500"
            >
              Solicitar Análise Gratuita
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section id="home" className="relative min-h-screen pt-32 pb-20 flex items-center justify-center overflow-hidden">
        
        {/* Background Image of building with premium overlay styling */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F19]/90 via-[#0B0F19]/80 to-[#0B0F19] z-10" />
          <img 
            src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=2000" 
            alt="Modern building construction" 
            className="w-full h-full object-cover filter blur-[3px] scale-105 opacity-30"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Decorative Grid Lines / Tech aesthetic */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-6 space-y-6 md:space-y-8 text-center lg:text-left">
            
            {/* Dynamic Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/80 border border-gray-800 text-xs text-white font-medium">
              <span className="w-2 h-2 rounded-full bg-[#F5B301] animate-pulse"></span>
              <span className="text-[#9CA3AF]">Agência Digital Premium</span>
            </div>

            <div className="space-y-4">
              {/* Massive Bold Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-display font-extrabold tracking-tight text-white leading-[1.1]">
                Sites que ajudam empresas da{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5B301] via-yellow-400 to-[#b48400]">
                  construção e acabamento
                </span>{' '}
                a gerar mais orçamentos.
              </h1>

              {/* Persuasive Subheading */}
              <p className="text-sm md:text-base text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Desenvolvemos sites profissionais, rápidos e otimizados para empresas que desejam atrair mais clientes, fortalecer sua presença digital e dominar o mercado de alto padrão.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => openContactWithPrefill('')}
                className="w-full sm:w-auto bg-[#F5B301] hover:bg-[#b48400] text-[#0B0F19] font-extrabold text-sm uppercase tracking-wider py-4 px-8 rounded-xl shadow-lg shadow-[#f5b3011e] hover:scale-105 active:scale-95 transition-all duration-300"
                id="hero-primary-cta"
              >
                Solicitar Análise Gratuita
              </button>
              
              <button
                onClick={() => scrollToSection('portfolio')}
                className="w-full sm:w-auto bg-[#111827]/80 hover:bg-[#111827] text-white border border-gray-800 hover:border-gray-700 font-extrabold text-sm uppercase tracking-wider py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105"
                id="hero-secondary-cta"
              >
                <Play className="w-4 h-4 text-[#F5B301] fill-[#F5B301]" />
                Ver Portfólio
              </button>
            </div>

            {/* Targeted Segments Small Slider */}
            <div className="pt-4 border-t border-gray-900/60 max-w-lg mx-auto lg:mx-0">
              <span className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-2">Exclusivo para o seu nicho</span>
              <div className="flex flex-wrap justify-center lg:justify-start gap-1.5">
                {TARGET_SEGMENTS.map((seg, idx) => (
                  <span 
                    key={idx} 
                    className="text-[10px] font-bold bg-[#111827] text-gray-300 py-1 px-2.5 rounded border border-gray-800 hover:border-[#F5B301]/30 hover:text-white transition-colors cursor-default"
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
      <section id="problemas" className="py-20 bg-[#111827]/30 border-y border-gray-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] text-[#F5B301] uppercase tracking-widest font-mono font-bold">O Diagnóstico Real</span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight">
              Seu site está gerando clientes <span className="text-[#F5B301]">ou apenas existe?</span>
            </h2>
            <div className="w-16 h-1 bg-[#F5B301] mx-auto rounded-full mt-2" />
            <p className="text-xs md:text-sm text-gray-400">
              Ter um site defasado hoje em dia é pior do que não ter um site. Ele afasta seus melhores leads e desvaloriza seu trabalho.
            </p>
          </div>

          {/* 6 Problems Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROBLEMS.map((prob) => (
              <div 
                key={prob.id}
                className="p-6 bg-[#111827] border border-gray-800 rounded-2xl transition-all duration-300 hover:border-red-950/40 hover:bg-red-950/[0.02] flex gap-4"
              >
                <div className="p-3 bg-gray-950 rounded-xl shrink-0 flex items-center justify-center border border-gray-800 text-red-500">
                  {renderIcon(prob.iconName, "w-5 h-5 text-[#F5B301]")}
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-white text-sm">{prob.title}</h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{prob.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SEÇÃO SOLUÇÃO */}
      <section id="solucoes" className="py-20 relative">
        {/* Decorative background light */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#F5B301]/[0.015] rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] text-[#F5B301] uppercase tracking-widest font-mono font-bold">Nosso DNA</span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight">
              A Solução que <span className="text-[#F5B301]">Sua Empresa Precisa</span>
            </h2>
            <div className="w-16 h-1 bg-[#F5B301] mx-auto rounded-full mt-2" />
            <p className="text-xs md:text-sm text-gray-400">
              Não fazemos sites comuns. Criamos portais corporativos de alto padrão, desenhados para captar fotos em alta resolução, automatizar cálculos e converter visitantes em chamadas no WhatsApp.
            </p>
          </div>

          {/* Solutions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {SOLUTIONS.map((sol) => (
              <div 
                key={sol.id}
                className="p-5 bg-[#111827]/60 border border-gray-800/80 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:border-[#F5B301]/40 hover:bg-[#111827] shadow-sm hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="p-2.5 bg-gray-950 rounded-lg w-10 h-10 flex items-center justify-center border border-gray-800/60">
                    {renderIcon(sol.iconName, "w-4 h-4 text-[#F5B301]")}
                  </div>
                  <h3 className="font-bold text-xs text-white uppercase tracking-wide">{sol.title}</h3>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{sol.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* PORTFÓLIO */}
      <section id="portfolio" className="py-20 bg-[#111827]/40 border-y border-gray-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] text-[#F5B301] uppercase tracking-widest font-mono font-bold font-bold">Demonstração Prática</span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight">
              Sites Feitos Para <span className="text-[#F5B301]">O Seu Segmento</span>
            </h2>
            <div className="w-16 h-1 bg-[#F5B301] mx-auto rounded-full mt-2" />
            <p className="text-xs md:text-sm text-gray-400">
              Cada nicho exige uma abordagem diferente. Clique para ver os diferenciais e a anatomia da página perfeita de conversão.
            </p>
          </div>

          {/* 3 Large Portfolio Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {PORTFOLIO.map((item) => (
              <div 
                key={item.id}
                className="group flex flex-col justify-between bg-[#111827] border border-gray-800 rounded-3xl overflow-hidden transition-all duration-300 hover:border-[#F5B301]/40 hover:shadow-2xl hover:shadow-[#f5b3010c] h-full"
              >
                {/* Image Container with Hover Zoom */}
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-950">
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10 opacity-60" />
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-4 left-4 z-20 bg-gray-900/90 border border-gray-800 text-[#F5B301] text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full">
                    {item.segment}
                  </span>
                </div>

                {/* Info Container */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-gray-500">{item.subtitle}</span>
                      <h3 className="text-base font-bold text-white group-hover:text-[#F5B301] transition-colors leading-tight">
                        {item.title}
                      </h3>
                    </div>
                    
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Features badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.features.map((feat, idx) => (
                        <span key={idx} className="text-[9px] font-medium bg-[#0B0F19] text-gray-300 py-1 px-2.5 rounded border border-gray-800 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-[#F5B301]"></span>
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA button */}
                  <div className="pt-4 border-t border-gray-900/80">
                    <button
                      onClick={() => openContactWithPrefill(item.segment)}
                      className="w-full bg-[#0B0F19] hover:bg-[#F5B301] text-gray-400 hover:text-[#0B0F19] border border-gray-800 hover:border-[#F5B301] font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300"
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
      <section id="simulador" className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <span className="text-[10px] text-[#F5B301] uppercase tracking-widest font-mono font-bold">Interativo & Exclusivo</span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight">
              Construa seu Escopo <span className="text-[#F5B301]">em 1 Minuto</span>
            </h2>
            <p className="text-xs text-gray-400">
              Personalize os recursos, informe seu segmento e envie sua configuração para receber uma análise preliminar gratuita sem compromisso.
            </p>
          </div>

          <BudgetSimulator />

        </div>
      </section>

      {/* COMO FUNCIONA (TIMELINE) */}
      <section id="processo" className="py-20 bg-[#111827]/30 border-y border-gray-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] text-[#F5B301] uppercase tracking-widest font-mono font-bold font-bold">Transparência</span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight">
              Metodologia <span className="text-[#F5B301]">Passo a Passo</span>
            </h2>
            <div className="w-16 h-1 bg-[#F5B301] mx-auto rounded-full mt-2" />
            <p className="text-xs md:text-sm text-gray-400">
              Garantimos velocidade e tranquilidade. Do primeiro diagnóstico gratuito à entrega final com suporte técnico constante.
            </p>
          </div>

          {/* Timeline Grid layout */}
          <div className="relative">
            {/* Dashed Line behind steps for tablet/desktop */}
            <div className="hidden lg:block absolute top-[60px] inset-x-8 h-0.5 border-t-2 border-dashed border-gray-800 z-0" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 relative z-10">
              {STEPS.map((step, idx) => (
                <div 
                  key={idx}
                  className="bg-[#111827] border border-gray-800 p-5 rounded-2xl flex flex-col justify-between relative hover:border-[#F5B301]/30 transition-all duration-300"
                >
                  <div className="space-y-3">
                    {/* Circle counter */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black font-mono text-[#F5B301] bg-[#f5b30113] w-7 h-7 rounded-full flex items-center justify-center">
                        {step.number}
                      </span>
                      <div className="text-gray-600">
                        {renderIcon(step.iconName, "w-4 h-4 text-gray-600")}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-xs text-white tracking-wide uppercase">{step.title}</h3>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to action card right below timeline */}
          <div className="mt-12 bg-gradient-to-r from-[#F5B301]/10 to-transparent border border-[#F5B301]/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#F5B301] text-gray-900 rounded-xl shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Pronto para dar o próximo passo na sua presença digital?</h4>
                <p className="text-[11px] text-gray-400 max-w-xl">
                  Criamos um diagnóstico gratuito exclusivo avaliando sua concorrência local, as palavras-chave mais buscadas e os recursos recomendados.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => openContactWithPrefill('')}
              className="bg-[#F5B301] hover:bg-[#b48400] text-[#0B0F19] text-xs font-bold py-3.5 px-6 rounded-xl shrink-0 transition-all hover:scale-105"
            >
              Solicitar Diagnóstico Gratuito
            </button>
          </div>

        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section id="diferenciais" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] text-[#F5B301] uppercase tracking-widest font-mono font-bold font-bold">Por Que a Atlas?</span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight">
              Os Diferenciais da <span className="text-[#F5B301]">Nossa Engenharia</span>
            </h2>
            <div className="w-16 h-1 bg-[#F5B301] mx-auto rounded-full mt-2" />
            <p className="text-xs md:text-sm text-gray-400">
              Não entregamos apenas layouts bonitos. Nossa prioridade absoluta é velocidade extrema, SEO de alto impacto local e código sob medida de alta segurança.
            </p>
          </div>

          {/* 8 Differentials Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DIFFERENTIALS.map((diff) => (
              <div 
                key={diff.id}
                className="p-5 bg-[#111827] border border-gray-800 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:border-[#F5B301]/30 hover:shadow-lg hover:shadow-[#f5b30104]"
              >
                <div className="space-y-3">
                  <div className="p-2 bg-gray-950 rounded-lg w-9 h-9 flex items-center justify-center border border-gray-800 text-[#F5B301]">
                    {renderIcon(diff.iconName, "w-4 h-4 text-[#F5B301]")}
                  </div>
                  <h3 className="font-bold text-xs text-white uppercase tracking-wide">{diff.title}</h3>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{diff.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="py-20 bg-[#111827]/40 border-y border-gray-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] text-[#F5B301] uppercase tracking-widest font-mono font-bold font-bold">Prova Social</span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight">
              Quem Confia na <span className="text-[#F5B301]">Atlas Digital</span>
            </h2>
            <div className="w-16 h-1 bg-[#F5B301] mx-auto rounded-full mt-2" />
            <p className="text-xs md:text-sm text-gray-400">
              Veja depoimentos de empresários da marmoraria, energia solar e vidraçarias que viram seus pedidos de orçamento decolarem.
            </p>
          </div>

          {/* 3 Testimonials Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {TESTIMONIALS.map((test) => (
              <div 
                key={test.id}
                className="bg-[#111827] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between gap-6"
              >
                <div className="space-y-4">
                  {/* Rating Stars */}
                  <div className="flex gap-1">
                    {[...Array(test.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-[#F5B301] fill-[#F5B301]" />
                    ))}
                  </div>

                  {/* Text */}
                  <p className="text-xs text-gray-300 leading-relaxed italic">
                    "{test.text}"
                  </p>
                </div>

                {/* Profile Card */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-900">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-900 shrink-0 border border-gray-800">
                    <img 
                      src={test.avatar} 
                      alt={test.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white leading-none">{test.name}</h4>
                    <span className="text-[10px] text-gray-500 font-medium">{test.company}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 relative overflow-hidden text-center bg-gradient-to-b from-[#0B0F19] to-[#111827] border-b border-gray-900">
        
        {/* Glow dots decoration */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#F5B301]/[0.03] rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-950/15 border border-[#F5B301]/20 text-[#F5B301] text-[10px] font-mono font-bold uppercase rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            Parceria de Sucesso Comercial
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white leading-tight">
              SUA EMPRESA MERECE <br className="hidden sm:inline" />
              <span className="text-[#F5B301]">UM SITE QUE VENDE.</span>
            </h2>
            
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
              Chega de perder clientes qualificados por ter uma presença digital fraca. Solicite agora uma análise gratuita e descubra como podemos aumentar seus pedidos de orçamento.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto pt-4">
            <button
              onClick={() => openContactWithPrefill('')}
              className="w-full bg-[#F5B301] hover:bg-[#b48400] text-[#0B0F19] font-black text-sm uppercase tracking-wider py-4 px-8 rounded-xl shadow-lg shadow-[#f5b3011e] hover:scale-105 transition-all duration-300"
              id="cta-final-btn"
            >
              Solicitar Análise Gratuita
            </button>
            
            <a
              href="https://wa.me/5551994578544?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20uma%20an%C3%A1lise%20gratuita%20do%20meu%20site%20e%20saber%20dos%20or%C3%A7amentos."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-slate-900 hover:bg-slate-800 border border-gray-800 text-white font-bold text-xs uppercase tracking-widest py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-green-500 fill-green-500" />
              WhatsApp Direto
            </a>
          </div>

          {/* Quick Stats list under CTA */}
          <div className="pt-10 flex flex-wrap justify-center gap-6 md:gap-12 text-center text-gray-500 text-[11px] uppercase tracking-wider font-mono">
            <div>
              <div className="text-[#F5B301] text-base font-black">100%</div>
              <div>Exclusivo</div>
            </div>
            <div className="w-px h-6 bg-gray-800 self-center hidden sm:block"></div>
            <div>
              <div className="text-[#F5B301] text-base font-black">&lt; 1.5s</div>
              <div>Carregamento</div>
            </div>
            <div className="w-px h-6 bg-gray-800 self-center hidden sm:block"></div>
            <div>
              <div className="text-[#F5B301] text-base font-black">95+</div>
              <div>Lighthouse SEO</div>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#090d16] border-t border-gray-900 py-12 md:py-16 text-gray-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          
          {/* Col 1: Brand details */}
          <div className="space-y-4">
            <AtlasLogo />
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Especialistas em engenharia de conversão e sites de alto padrão para marmorarias, vidraçarias, energia solar e construtoras.
            </p>
            <div className="flex gap-3 pt-1">
              <a href="#" className="p-2 bg-gray-900/60 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors" aria-label="instagram">
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="p-2 bg-gray-900/60 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors" aria-label="facebook">
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="p-2 bg-gray-900/60 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors" aria-label="linkedin">
                <Linkedin className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Map */}
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Navegação</h4>
            <ul className="space-y-2 text-[11px] font-medium">
              <li><button onClick={() => scrollToSection('home')} className="hover:text-[#F5B301] transition-colors text-left">Início</button></li>
              <li><button onClick={() => scrollToSection('problemas')} className="hover:text-[#F5B301] transition-colors text-left">Problemas</button></li>
              <li><button onClick={() => scrollToSection('solucoes')} className="hover:text-[#F5B301] transition-colors text-left">Nossas Soluções</button></li>
              <li><button onClick={() => scrollToSection('portfolio')} className="hover:text-[#F5B301] transition-colors text-left">Portfólio / Casos</button></li>
              <li><button onClick={() => scrollToSection('processo')} className="hover:text-[#F5B301] transition-colors text-left">Como Trabalhamos</button></li>
            </ul>
          </div>

          {/* Col 3: Target Segments */}
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Setores Atendidos</h4>
            <ul className="space-y-1.5 text-[11px]">
              {TARGET_SEGMENTS.map((seg, idx) => (
                <li key={idx} className="flex items-center gap-1.5 text-gray-500">
                  <span className="w-1 h-1 rounded-full bg-[#F5B301]"></span>
                  <span>{seg}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact details */}
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Fale Conosco</h4>
            <ul className="space-y-2.5 text-[11px]">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F5B301] shrink-0" />
                <a href="https://wa.me/5551994578544" target="_blank" rel="noopener noreferrer" className="hover:text-[#F5B301] transition-colors">
                  +55 (51) 99457-8544
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F5B301] shrink-0" />
                <a href="mailto:contato@atlasdigital.com.br" className="hover:text-[#F5B301] transition-colors">
                  contato@atlasdigital.com.br
                </a>
              </li>
              <li className="flex items-start gap-2 text-gray-500 leading-tight">
                <MapPin className="w-4 h-4 text-[#F5B301] shrink-0" />
                <span>Atendimento presencial e remoto em todo o território nacional.</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-gray-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-gray-600">
          <div>
            &copy; {new Date().getFullYear()} Atlas Digital. Todos os direitos reservados. CNPJ: 00.000.000/0001-00.
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#F5B301]">Política de Privacidade</a>
            <span>&bull;</span>
            <a href="#" className="hover:text-[#F5B301]">Termos de Uso</a>
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

    </div>
  );
}
