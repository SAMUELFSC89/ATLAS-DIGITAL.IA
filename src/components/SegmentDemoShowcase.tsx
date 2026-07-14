import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Check, ArrowRight, Star, Zap, Shield, 
  Sparkles, MessageSquare, Phone, MapPin, 
  Award, Layers, Users, TrendingUp, Sun, 
  Sparkles as GlassIcon, Eye, Laptop, Smartphone
} from 'lucide-react';

interface SegmentDemoShowcaseProps {
  openContactWithPrefill: (subject: string) => void;
}

type SegmentKey = 'marmoraria' | 'solar' | 'vidracaria';

export default function SegmentDemoShowcase({ openContactWithPrefill }: SegmentDemoShowcaseProps) {
  const [selectedSegment, setSelectedSegment] = useState<SegmentKey | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('todos');

  // Prevent scroll of body when modal is open
  useEffect(() => {
    if (selectedSegment) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedSegment]);

  // Reset filter when segment changes
  useEffect(() => {
    setActiveFilter('todos');
  }, [selectedSegment]);

  // Demo sites data
  const demos = {
    marmoraria: {
      title: 'Imperial Marmoraria',
      phone: '(51) 99457-8544',
      address: 'Av. das Nações, 1420 - Porto Alegre, RS',
      accentColor: 'text-[#E2B755]',
      accentBg: 'bg-[#E2B755]',
      accentBorder: 'border-[#E2B755]',
      heroImg: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      tagline: 'Mármores, Granitos e Quartzitos de Altíssimo Padrão',
      heroSub: 'Transformamos pedras nobres em obras de arte para cozinhas, banheiros, escadas e ambientes gourmet sob medida.',
      services: [
        { title: 'Bancadas de Cozinha', desc: 'Instalação com cortes milimétricos, acabamento impecável em meia-esquadria e alta resistência.' },
        { title: 'Banheiros & Lavatórios', desc: 'Cubas esculpidas em mármores nobres e nichos personalizados que trazem luxo ao seu ambiente.' },
        { title: 'Escadas & Pisos', desc: 'Revestimentos elegantes que valorizam e trazem imponência arquitetônica para sua residência.' },
        { title: 'Espaços Gourmet', desc: 'Áreas de lazer com materiais altamente duráveis, fáceis de limpar e resistentes a manchas.' }
      ],
      portfolio: [
        { id: 1, category: 'cozinha', title: 'Cozinha Quartzito Taj Mahal', img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80' },
        { id: 2, category: 'banheiro', title: 'Banheiro Mármore Calacatta', img: 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=600&q=80' },
        { id: 3, category: 'gourmet', title: 'Espaço Gourmet Granito Via Láctea', img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80' },
        { id: 4, category: 'cozinha', title: 'Bancada Integrada Preto Absoluto', img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80' }
      ],
      testimonials: [
        { name: 'Ricardo Silveira', role: 'Arquiteto', text: 'O acabamento em meia-esquadria que eles fazem é de outro mundo. Perfeição pura nos meus projetos de alto padrão.' },
        { name: 'Patrícia Mendes', role: 'Proprietária em Gravataí', text: 'Minha bancada da cozinha ficou maravilhosa! Equipe super caprichosa, pontual e muito limpa na instalação.' }
      ],
      whatsappMsg: 'Olá! Vi o modelo de site para Marmoraria e gostaria de solicitar um orçamento para o meu negócio!'
    },
    solar: {
      title: 'Solaris Energia',
      phone: '(51) 99457-8544',
      address: 'Rua dos Inversores, 45 - Porto Alegre, RS',
      accentColor: 'text-amber-500',
      accentBg: 'bg-amber-500',
      accentBorder: 'border-amber-500',
      heroImg: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
      tagline: 'Economize até 95% na Conta com Energia Solar',
      heroSub: 'Soluções completas de engenharia fotovoltaica para residências, empresas e indústrias. Redução de custos imediata e sustentável.',
      services: [
        { title: 'Sistemas Residenciais', desc: 'Produza sua própria eletricidade e proteja sua família contra os aumentos frequentes das tarifas.' },
        { title: 'Sistemas Comerciais', desc: 'Aumente o lucro operacional da sua empresa reduzindo um dos maiores custos fixos mensais.' },
        { title: 'Usinas Industriais', desc: 'Projetos de alta potência com retorno sobre o investimento acelerado e benefícios ambientais reais.' },
        { title: 'Manutenção & Monitoramento', desc: 'Acompanhamento em tempo real via aplicativo com suporte preventivo para máxima eficiência.' }
      ],
      portfolio: [
        { id: 1, category: 'residencial', title: 'Instalação Residencial - 7.2 kWp', img: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=600&q=80' },
        { id: 2, category: 'comercial', title: 'Galpão Comercial - 45 kWp', img: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=600&q=80' },
        { id: 3, category: 'residencial', title: 'Sistema de Microgeração Sob Medida', img: 'https://images.unsplash.com/photo-1548613053-220088836dca?auto=format&fit=crop&w=600&q=80' },
        { id: 4, category: 'industrial', title: 'Parque Solar de Médio Porte', img: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=600&q=80' }
      ],
      testimonials: [
        { name: 'Julio Cesar', role: 'Empresário', text: 'Nossa conta de luz da metalúrgica caiu de R$ 4.200 para quase a taxa mínima. Em menos de 2 anos o investimento se pagou!' },
        { name: 'Ana Carolina', role: 'Moradora em Canoas', text: 'Excelente atendimento desde a simulação até a homologação junto à concessionária. Processo super ágil e transparente.' }
      ],
      whatsappMsg: 'Olá! Vi o modelo de site para Energia Solar e gostaria de solicitar um orçamento para o meu negócio!'
    },
    vidracaria: {
      title: 'Vitra Esquadrias & Vidros',
      phone: '(51) 99457-8544',
      address: 'Av. Cristalina, 900 - Porto Alegre, RS',
      accentColor: 'text-sky-500',
      accentBg: 'bg-sky-500',
      accentBorder: 'border-sky-500',
      heroImg: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
      tagline: 'Vidros, Esquadrias e Fachadas de Alto Padrão',
      heroSub: 'Projetos modernos com vidros temperados, laminados, cortina de vidro e esquadrias de alumínio para ambientes residenciais e comerciais.',
      services: [
        { title: 'Cortina de Vidro / Envidraçamento', desc: 'Valorize e integre sua sacada protegendo contra ventos, poeira e barulhos externos com total segurança.' },
        { title: 'Guarda-Corpos & Corrimãos', desc: 'Design minimalista de alta resistência e segurança mecânica para escadas, mezaninos e sacadas.' },
        { title: 'Box de Banheiro Premium', desc: 'Sistemas Elegance e roldanas aparentes que combinam elegância e durabilidade para seu banheiro.' },
        { title: 'Espelhos Customizados', desc: 'Espelhos bisotados, com iluminação em LED embutida e lapidados sob medida para hall, banheiros e salas.' }
      ],
      portfolio: [
        { id: 1, category: 'fachada', title: 'Fachada Glazing de Alto Padrão', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80' },
        { id: 2, category: 'sacada', title: 'Envidraçamento de Sacada Panorâmica', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80' },
        { id: 3, category: 'interno', title: 'Box Elegance com Roldanas Aparentes', img: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=600&q=80' },
        { id: 4, category: 'interno', title: 'Guarda-corpo Autoportante em Vidro', img: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=600&q=80' }
      ],
      testimonials: [
        { name: 'Felipe Martins', role: 'Engenheiro Civil', text: 'Sempre indico para minhas obras. O alinhamento dos perfis e a qualidade dos vidros temperados deles são impecáveis.' },
        { name: 'Mariana Duarte', role: 'Arquiteta de Interiores', text: 'O espelho com LED sob medida ficou maravilhoso no lavabo do meu cliente. Instalação limpa, rápida e preço muito justo.' }
      ],
      whatsappMsg: 'Olá! Vi o modelo de site para Vidracaria e gostaria de solicitar um orçamento para o meu negócio!'
    }
  };

  const handleCardClick = (segment: SegmentKey) => {
    setSelectedSegment(segment);
  };

  return (
    <section id="demonstracoes" className="py-24 bg-white text-[#121214] relative overflow-hidden">
      {/* Background soft geometric patterns */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-gray-50 to-white pointer-events-none" />
      <div className="absolute -left-32 top-1/4 w-96 h-96 bg-gray-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute -right-32 bottom-1/4 w-96 h-96 bg-[#E2B755]/5 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-mono font-bold">Protótipos Interativos</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-zinc-950 tracking-tight leading-tight">
            Veja como pode ser o site da sua empresa
          </h2>
          <p className="text-sm md:text-base text-zinc-500 font-light max-w-xl mx-auto leading-relaxed">
            Escolha um segmento e explore uma demonstração interativa de um site desenvolvido para gerar o máximo de credibilidade e novos contatos.
          </p>
        </div>

        {/* 3 SEGMENT CARDS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* CARD 1: MARMORARIAS */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group flex flex-col justify-between bg-white border border-gray-100 rounded-[32px] p-6 shadow-[0_15px_50px_-20px_rgba(0,0,0,0.06)] hover:shadow-[0_25px_60px_-15px_rgba(245,179,1,0.08)] hover:border-amber-100 transition-all duration-500 h-full relative"
          >
            <div className="space-y-6">
              {/* Notebook Mockup with Hover Autoscroll */}
              <div className="relative w-full aspect-[16/10.5] bg-gray-50 rounded-2xl overflow-hidden shadow-inner flex flex-col justify-between items-center p-3 border border-gray-100 group-hover:bg-amber-50/10 transition-colors duration-500">
                {/* 3D Notebook Screen */}
                <div className="relative w-full h-[90%] bg-gray-900 rounded-lg overflow-hidden border-[6px] border-zinc-800 shadow-md flex-shrink-0 flex flex-col justify-between">
                  {/* Top camera notched dot */}
                  <div className="absolute top-0.5 inset-x-0 h-1 flex justify-center z-20">
                    <div className="w-1 h-1 rounded-full bg-black"></div>
                  </div>
                  {/* Browser content */}
                  <div className="w-full h-full overflow-hidden relative">
                    <div className="absolute inset-x-0 top-0 h-full transition-transform duration-[6s] ease-in-out group-hover:-translate-y-[62%] select-none">
                      {/* Full Preview Image mimicking Marmoraria site */}
                      <div className="w-full bg-slate-900 flex flex-col">
                        {/* Header */}
                        <div className="bg-slate-950 p-2 flex justify-between items-center border-b border-zinc-800">
                          <span className="text-[7px] font-black tracking-widest text-[#E2B755]">IMPERIAL MARBLES</span>
                          <span className="text-[5px] text-gray-400 gap-1 flex"><span>Início</span><span>Produtos</span><span>Contato</span></span>
                        </div>
                        {/* Hero */}
                        <div className="h-28 relative flex items-center justify-center text-center p-2">
                          <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80" className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Marmoraria Hero" />
                          <div className="relative z-10 space-y-1">
                            <h4 className="text-[8px] font-black leading-tight">Mármores Sob Medida</h4>
                            <p className="text-[5px] text-gray-300 max-w-[120px] mx-auto">Cozinhas, banheiros e painéis de alto padrão.</p>
                            <span className="inline-block bg-[#E2B755] text-gray-950 text-[4px] font-black px-1.5 py-0.5 rounded-full mt-1">Orçamento Grátis</span>
                          </div>
                        </div>
                        {/* Services */}
                        <div className="bg-white p-3 text-gray-950 space-y-2">
                          <div className="text-center">
                            <h5 className="text-[7px] font-bold">Nossos Serviços</h5>
                            <div className="w-4 h-0.5 bg-[#E2B755] mx-auto"></div>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="border border-gray-100 p-1 rounded space-y-0.5">
                              <h6 className="text-[5px] font-bold">Cozinhas Luxo</h6>
                              <p className="text-[4px] text-gray-500">Cortes retos e cubas esculpidas.</p>
                            </div>
                            <div className="border border-gray-100 p-1 rounded space-y-0.5">
                              <h6 className="text-[5px] font-bold">Banheiros Nobres</h6>
                              <p className="text-[4px] text-gray-500">Elegância em Calacatta.</p>
                            </div>
                          </div>
                        </div>
                        {/* Showcase Gallery */}
                        <div className="bg-slate-900 p-3 space-y-2">
                          <h5 className="text-[7px] text-center font-bold text-white">Nosso Trabalho</h5>
                          <div className="grid grid-cols-3 gap-1">
                            <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=150&q=80" className="aspect-square object-cover rounded" alt="Port 1" />
                            <img src="https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=150&q=80" className="aspect-square object-cover rounded" alt="Port 2" />
                            <img src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=150&q=80" className="aspect-square object-cover rounded" alt="Port 3" />
                          </div>
                        </div>
                        {/* CTA and Footer */}
                        <div className="bg-slate-950 p-4 text-center space-y-1.5">
                          <h5 className="text-[8px] font-bold text-white">Solicite um Orçamento Rápido</h5>
                          <p className="text-[5px] text-gray-400">Atendimento imediato pelo WhatsApp.</p>
                          <span className="inline-block bg-green-600 text-white text-[5px] font-bold py-1 px-2.5 rounded-full">Chamar Consultor</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* 3D Notebook Base & Trackpad */}
                <div className="w-[110%] h-2.5 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-b-xl relative shadow-md flex-shrink-0">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gray-500 rounded-b"></div>
                </div>
                <div className="absolute bottom-1 text-gray-400 text-[8px] flex items-center gap-1 font-semibold group-hover:text-amber-600 transition-colors">
                  <span className="animate-bounce">↓</span> Passe o mouse para rolar
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-amber-50 text-[#b48400] rounded-lg">
                    <Layers className="w-5 h-5" />
                  </span>
                  <h3 className="text-xl font-display font-black text-gray-950 uppercase tracking-tight">🪨 Marmorarias</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  "Sites desenvolvidos para transformar visitantes em pedidos de orçamento."
                </p>
              </div>
            </div>

            {/* Card CTA Action */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <button 
                onClick={() => handleCardClick('marmoraria')}
                className="w-full bg-[#0B0B0E] hover:bg-[#E2B755] text-white hover:text-gray-950 border border-transparent font-bold text-xs uppercase tracking-widest py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-gray-950/5 hover:shadow-[#e2b75522] transition-all duration-300 group-hover:scale-[1.02]"
              >
                Ver demonstração ao vivo ⭐
                <Eye className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              </button>
            </div>
          </motion.div>

          {/* CARD 2: SOLAR */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group flex flex-col justify-between bg-white border border-gray-100 rounded-[32px] p-6 shadow-[0_15px_50px_-20px_rgba(0,0,0,0.06)] hover:shadow-[0_25px_60px_-15px_rgba(245,179,1,0.08)] hover:border-amber-100 transition-all duration-500 h-full relative"
          >
            <div className="space-y-6">
              {/* Notebook Mockup with Hover Autoscroll */}
              <div className="relative w-full aspect-[16/10.5] bg-gray-50 rounded-2xl overflow-hidden shadow-inner flex flex-col justify-between items-center p-3 border border-gray-100 group-hover:bg-amber-50/10 transition-colors duration-500">
                {/* 3D Notebook Screen */}
                <div className="relative w-full h-[90%] bg-gray-900 rounded-lg overflow-hidden border-[6px] border-zinc-800 shadow-md flex-shrink-0 flex flex-col justify-between">
                  {/* Top camera notched dot */}
                  <div className="absolute top-0.5 inset-x-0 h-1 flex justify-center z-20">
                    <div className="w-1 h-1 rounded-full bg-black"></div>
                  </div>
                  {/* Browser content */}
                  <div className="w-full h-full overflow-hidden relative">
                    <div className="absolute inset-x-0 top-0 h-full transition-transform duration-[6s] ease-in-out group-hover:-translate-y-[62%] select-none">
                      {/* Full Preview Image mimicking Solar site */}
                      <div className="w-full bg-slate-900 flex flex-col">
                        {/* Header */}
                        <div className="bg-slate-950 p-2 flex justify-between items-center border-b border-zinc-800">
                          <span className="text-[7px] font-black tracking-widest text-amber-500">SOLARIS ENERGIA</span>
                          <span className="text-[5px] text-gray-400 gap-1 flex"><span>Início</span><span>Simular</span><span>Contato</span></span>
                        </div>
                        {/* Hero */}
                        <div className="h-28 relative flex items-center justify-center text-center p-2">
                          <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=400&q=80" className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Solar Hero" />
                          <div className="relative z-10 space-y-1">
                            <h4 className="text-[8px] font-black leading-tight text-white">Economize até 95% na Luz</h4>
                            <p className="text-[5px] text-gray-300 max-w-[120px] mx-auto font-medium">Usinas residenciais e comerciais homologadas.</p>
                            <span className="inline-block bg-amber-500 text-gray-950 text-[4px] font-black px-1.5 py-0.5 rounded-full mt-1">Fazer Simulação</span>
                          </div>
                        </div>
                        {/* Services */}
                        <div className="bg-white p-3 text-gray-950 space-y-2">
                          <div className="text-center">
                            <h5 className="text-[7px] font-bold">Por que Solar?</h5>
                            <div className="w-4 h-0.5 bg-amber-500 mx-auto"></div>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="border border-gray-100 p-1 rounded space-y-0.5">
                              <h6 className="text-[5px] font-bold text-amber-600">Alta Economia</h6>
                              <p className="text-[4px] text-gray-500">Pague apenas o custo de disponibilidade.</p>
                            </div>
                            <div className="border border-gray-100 p-1 rounded space-y-0.5">
                              <h6 className="text-[5px] font-bold text-amber-600">Valorização do Imóvel</h6>
                              <p className="text-[4px] text-gray-500">Aumente o valor patrimonial em até 10%.</p>
                            </div>
                          </div>
                        </div>
                        {/* Showcase Gallery */}
                        <div className="bg-slate-900 p-3 space-y-2">
                          <h5 className="text-[7px] text-center font-bold text-white">Instalações Recentes</h5>
                          <div className="grid grid-cols-3 gap-1">
                            <img src="https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=150&q=80" className="aspect-square object-cover rounded" alt="Solar 1" />
                            <img src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=150&q=80" className="aspect-square object-cover rounded" alt="Solar 2" />
                            <img src="https://images.unsplash.com/photo-1548613053-220088836dca?auto=format&fit=crop&w=150&q=80" className="aspect-square object-cover rounded" alt="Solar 3" />
                          </div>
                        </div>
                        {/* CTA and Footer */}
                        <div className="bg-slate-950 p-4 text-center space-y-1.5">
                          <h5 className="text-[8px] font-bold text-white">Simule pelo WhatsApp</h5>
                          <p className="text-[5px] text-gray-400">Descubra quantos painéis você precisa.</p>
                          <span className="inline-block bg-green-600 text-white text-[5px] font-bold py-1 px-2.5 rounded-full">Fazer Simulação</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* 3D Notebook Base & Trackpad */}
                <div className="w-[110%] h-2.5 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-b-xl relative shadow-md flex-shrink-0">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gray-500 rounded-b"></div>
                </div>
                <div className="absolute bottom-1 text-gray-400 text-[8px] flex items-center gap-1 font-semibold group-hover:text-amber-600 transition-colors">
                  <span className="animate-bounce">↓</span> Passe o mouse para rolar
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-amber-50 text-amber-500 rounded-lg">
                    <Zap className="w-5 h-5" />
                  </span>
                  <h3 className="text-xl font-display font-black text-gray-950 uppercase tracking-tight">☀ Energia Solar</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  "Sites focados em gerar novos clientes e aumentar a credibilidade."
                </p>
              </div>
            </div>

            {/* Card CTA Action */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <button 
                onClick={() => handleCardClick('solar')}
                className="w-full bg-[#0B0B0E] hover:bg-[#E2B755] text-white hover:text-gray-950 border border-transparent font-bold text-xs uppercase tracking-widest py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-gray-950/5 hover:shadow-[#e2b75522] transition-all duration-300 group-hover:scale-[1.02]"
              >
                Ver demonstração ao vivo ⭐
                <Eye className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              </button>
            </div>
          </motion.div>

          {/* CARD 3: VIDRACARIAS */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group flex flex-col justify-between bg-white border border-gray-100 rounded-[32px] p-6 shadow-[0_15px_50px_-20px_rgba(0,0,0,0.06)] hover:shadow-[0_25px_60px_-15px_rgba(245,179,1,0.08)] hover:border-amber-100 transition-all duration-500 h-full relative"
          >
            <div className="space-y-6">
              {/* Notebook Mockup with Hover Autoscroll */}
              <div className="relative w-full aspect-[16/10.5] bg-gray-50 rounded-2xl overflow-hidden shadow-inner flex flex-col justify-between items-center p-3 border border-gray-100 group-hover:bg-amber-50/10 transition-colors duration-500">
                {/* 3D Notebook Screen */}
                <div className="relative w-full h-[90%] bg-gray-900 rounded-lg overflow-hidden border-[6px] border-zinc-800 shadow-md flex-shrink-0 flex flex-col justify-between">
                  {/* Top camera notched dot */}
                  <div className="absolute top-0.5 inset-x-0 h-1 flex justify-center z-20">
                    <div className="w-1 h-1 rounded-full bg-black"></div>
                  </div>
                  {/* Browser content */}
                  <div className="w-full h-full overflow-hidden relative">
                    <div className="absolute inset-x-0 top-0 h-full transition-transform duration-[6s] ease-in-out group-hover:-translate-y-[62%] select-none">
                      {/* Full Preview Image mimicking Vidracaria site */}
                      <div className="w-full bg-slate-900 flex flex-col">
                        {/* Header */}
                        <div className="bg-slate-950 p-2 flex justify-between items-center border-b border-zinc-800">
                          <span className="text-[7px] font-black tracking-widest text-sky-500">VITRA VIDROS</span>
                          <span className="text-[5px] text-gray-400 gap-1 flex"><span>Início</span><span>Portfólio</span><span>Contato</span></span>
                        </div>
                        {/* Hero */}
                        <div className="h-28 relative flex items-center justify-center text-center p-2">
                          <img src="https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=400&q=80" className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Vidros Hero" />
                          <div className="relative z-10 space-y-1">
                            <h4 className="text-[8px] font-black leading-tight text-white">Vidros e Sacadas de Luxo</h4>
                            <p className="text-[5px] text-gray-300 max-w-[120px] mx-auto">Vidros temperados, cortinas de vidro e coberturas.</p>
                            <span className="inline-block bg-sky-500 text-gray-950 text-[4px] font-black px-1.5 py-0.5 rounded-full mt-1">Ver Orçamentos</span>
                          </div>
                        </div>
                        {/* Services */}
                        <div className="bg-white p-3 text-gray-950 space-y-2">
                          <div className="text-center">
                            <h5 className="text-[7px] font-bold">Nossas Soluções</h5>
                            <div className="w-4 h-0.5 bg-sky-500 mx-auto"></div>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="border border-gray-100 p-1 rounded space-y-0.5">
                              <h6 className="text-[5px] font-bold text-sky-600">Fechamento Sacada</h6>
                              <p className="text-[4px] text-gray-500">Mais área útil e isolamento acústico.</p>
                            </div>
                            <div className="border border-gray-100 p-1 rounded space-y-0.5">
                              <h6 className="text-[5px] font-bold text-sky-600">Guarda-Corpos</h6>
                              <p className="text-[4px] text-gray-500">Segurança de alta resistência.</p>
                            </div>
                          </div>
                        </div>
                        {/* Showcase Gallery */}
                        <div className="bg-slate-900 p-3 space-y-2">
                          <h5 className="text-[7px] text-center font-bold text-white">Nossos Projetos</h5>
                          <div className="grid grid-cols-3 gap-1">
                            <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=150&q=80" className="aspect-square object-cover rounded" alt="Vidros 1" />
                            <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=150&q=80" className="aspect-square object-cover rounded" alt="Vidros 2" />
                            <img src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=150&q=80" className="aspect-square object-cover rounded" alt="Vidros 3" />
                          </div>
                        </div>
                        {/* CTA and Footer */}
                        <div className="bg-slate-950 p-4 text-center space-y-1.5">
                          <h5 className="text-[8px] font-bold text-white">Fale com a Vitra Vidros</h5>
                          <p className="text-[5px] text-gray-400">Atendimento imediato no WhatsApp.</p>
                          <span className="inline-block bg-green-600 text-white text-[5px] font-bold py-1 px-2.5 rounded-full">Solicitar Visita</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* 3D Notebook Base & Trackpad */}
                <div className="w-[110%] h-2.5 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-b-xl relative shadow-md flex-shrink-0">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gray-500 rounded-b"></div>
                </div>
                <div className="absolute bottom-1 text-gray-400 text-[8px] flex items-center gap-1 font-semibold group-hover:text-amber-600 transition-colors">
                  <span className="animate-bounce">↓</span> Passe o mouse para rolar
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-amber-50 text-sky-500 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </span>
                  <h3 className="text-xl font-display font-black text-gray-950 uppercase tracking-tight">🪟 Vidraçarias</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  "Apresente seus projetos com um visual moderno e profissional."
                </p>
              </div>
            </div>

            {/* Card CTA Action */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <button 
                onClick={() => handleCardClick('vidracaria')}
                className="w-full bg-[#0B0B0E] hover:bg-[#E2B755] text-white hover:text-gray-950 border border-transparent font-bold text-xs uppercase tracking-widest py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-gray-950/5 hover:shadow-[#e2b75522] transition-all duration-300 group-hover:scale-[1.02]"
              >
                Ver demonstração ao vivo ⭐
                <Eye className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              </button>
            </div>
          </motion.div>

        </div>
      </div>

      {/* FULL-SCREEN LIVE DEMONSTRATION MODAL */}
      <AnimatePresence>
        {selectedSegment && (() => {
          const demoData = demos[selectedSegment];
          const filteredPortfolio = demoData.portfolio.filter(
            item => activeFilter === 'todos' || item.category === activeFilter
          );
          const filterCategories = selectedSegment === 'marmoraria' 
            ? ['todos', 'cozinha', 'banheiro', 'gour']
            : selectedSegment === 'solar'
            ? ['todos', 'residencial', 'comercial', 'industrial']
            : ['todos', 'fachada', 'sacada', 'interno'];

          const filterLabels = {
            todos: 'Todos',
            cozinha: 'Cozinhas',
            banheiro: 'Banheiros',
            gour: 'Gourmet',
            gourmet: 'Gourmet',
            residencial: 'Residencial',
            comercial: 'Comercial',
            industrial: 'Industrial',
            fachada: 'Fachadas',
            sacada: 'Sacadas',
            interno: 'Internos'
          };

          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-0 md:p-6 select-none"
            >
              {/* Main Laptop Browser Simulation Box */}
              <motion.div 
                initial={{ scale: 0.95, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                className="w-full h-full md:h-[94vh] md:max-w-6xl md:rounded-3xl bg-[#0B0B0E] border border-slate-800 flex flex-col shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden"
              >
                
                {/* Simulated Web Browser Header */}
                <div className="bg-slate-950 border-b border-slate-900 px-4 py-3 flex items-center justify-between shrink-0">
                  {/* Left: Window controls dots */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedSegment(null)} 
                      className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-[8px] text-red-950 font-black"
                    >
                      ×
                    </button>
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-500"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-green-500"></div>
                    
                    <span className="hidden sm:inline-flex items-center gap-1.5 ml-4 bg-slate-900 text-[10px] text-gray-500 py-1 px-3 rounded-full border border-slate-800 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      Demonstração Segura e Ativa
                    </span>
                  </div>

                  {/* Middle: Address Bar URL */}
                  <div className="flex-1 max-w-md mx-6 hidden md:block">
                    <div className="bg-slate-900 border border-slate-800 text-xs text-gray-400 py-1.5 px-4 rounded-xl text-center select-all font-mono truncate shadow-inner flex items-center justify-center gap-2">
                      <span className="text-gray-600 text-[10px]">https://</span>
                      <span>{selectedSegment === 'marmoraria' ? 'imperial.marmoraria.demo.atlasdigital.ia.br' : selectedSegment === 'solar' ? 'solaris.energia.demo.atlasdigital.ia.br' : 'vitra.esquadrias.demo.atlasdigital.ia.br'}</span>
                    </div>
                  </div>

                  {/* Right: Close Actions button */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedSegment(null);
                        openContactWithPrefill(demoData.title);
                      }}
                      className="bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all duration-300"
                    >
                      <Check className="w-3 h-3" />
                      QUERO ESTE SITE
                    </button>
                    <button 
                      onClick={() => setSelectedSegment(null)}
                      className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-gray-400 hover:text-white rounded-lg transition-colors"
                      title="Fechar Visualização"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Simulated Web Viewport (Scrollable Live Website Content) */}
                <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth bg-slate-950 text-slate-100 flex flex-col font-sans">
                  
                  {/* LIVE DEMO HEADER */}
                  <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 py-3.5 px-4 md:px-8">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                      {/* Logo */}
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${demoData.accentBg} text-gray-950 font-black flex items-center justify-center text-sm shadow`}>
                          {selectedSegment === 'marmoraria' ? 'M' : selectedSegment === 'solar' ? 'S' : 'V'}
                        </div>
                        <span className="font-display font-black text-xs md:text-sm uppercase tracking-wider text-white">
                          {demoData.title}
                        </span>
                      </div>
                      {/* Contacts navigation */}
                      <div className="flex items-center gap-4 text-[11px] md:text-xs">
                        <a href={`https://wa.me/5551994578544?text=${encodeURIComponent(demoData.whatsappMsg)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-500 font-bold hover:underline">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {demoData.phone}
                        </a>
                        <span className="hidden md:inline-flex items-center gap-1 text-gray-400">
                          <MapPin className="w-3.5 h-3.5" />
                          Porto Alegre, RS
                        </span>
                      </div>
                    </div>
                  </header>

                  {/* LIVE DEMO HERO SECTION */}
                  <section className="relative min-h-[380px] md:min-h-[460px] flex items-center py-12 px-4 md:px-8 overflow-hidden bg-slate-900">
                    <div className="absolute inset-0 z-0">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10" />
                      <img 
                        src={demoData.heroImg} 
                        alt="Hero background" 
                        className="w-full h-full object-cover opacity-60"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="max-w-4xl mx-auto w-full relative z-10 text-left space-y-6">
                      <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-mono font-bold py-1 px-3.5 rounded-full ${demoData.accentBg}/15 ${demoData.accentColor} border ${demoData.accentBorder}/25`}>
                        <Sparkles className="w-3 h-3" />
                        Modelo Exclusivo Atlas Digital
                      </span>
                      <h1 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-tight max-w-xl leading-tight">
                        {demoData.tagline}
                      </h1>
                      <p className="text-xs md:text-sm text-gray-300 max-w-lg leading-relaxed font-medium">
                        {demoData.heroSub}
                      </p>
                      <div className="flex flex-wrap gap-3 pt-2">
                        <a 
                          href={`https://wa.me/5551994578544?text=${encodeURIComponent(demoData.whatsappMsg)}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`${demoData.accentBg} text-gray-950 text-xs font-black uppercase tracking-widest py-3.5 px-6 rounded-xl shadow-lg hover:brightness-115 transition-all duration-300 flex items-center gap-2`}
                        >
                          Fazer Orçamento Grátis
                          <ArrowRight className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => {
                            setSelectedSegment(null);
                            openContactWithPrefill(demoData.title);
                          }}
                          className="bg-transparent hover:bg-slate-800 text-white border border-slate-700 text-xs font-black uppercase tracking-widest py-3.5 px-6 rounded-xl transition-colors duration-300"
                        >
                          Garantir Site Similar
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* LIVE DEMO SERVICES SECTION */}
                  <section className="py-16 px-4 md:px-8 bg-slate-950 border-t border-slate-900">
                    <div className="max-w-5xl mx-auto space-y-12">
                      <div className="text-center space-y-3">
                        <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight">Nossos Serviços</h2>
                        <div className={`w-12 h-1 ${demoData.accentBg} mx-auto rounded-full`} />
                        <p className="text-xs text-gray-400">Soluções profissionais completas com garantia de satisfação e durabilidade.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {demoData.services.map((svc, i) => (
                          <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex gap-4 hover:border-slate-700 transition-colors">
                            <div className={`w-10 h-10 rounded-xl ${demoData.accentBg}/10 ${demoData.accentColor} flex items-center justify-center shrink-0`}>
                              <Check className="w-5 h-5" />
                            </div>
                            <div className="space-y-1 text-left">
                              <h3 className="font-bold text-sm text-white">{svc.title}</h3>
                              <p className="text-xs text-gray-400 leading-relaxed font-medium">{svc.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* LIVE DEMO PORTFOLIO SECTION */}
                  <section className="py-16 px-4 md:px-8 bg-slate-900/50 border-y border-slate-950">
                    <div className="max-w-5xl mx-auto space-y-12">
                      <div className="text-center space-y-3">
                        <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight">Projetos Executados</h2>
                        <div className={`w-12 h-1 ${demoData.accentBg} mx-auto rounded-full`} />
                        <p className="text-xs text-gray-400">Conheça alguns dos últimos trabalhos entregues com acabamento impecável.</p>
                      </div>

                      {/* Filter tabs */}
                      <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
                        {filterCategories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setActiveFilter(cat)}
                            className={`px-3.5 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${
                              activeFilter === cat
                                ? `${demoData.accentBg} text-slate-950 ${demoData.accentBorder}`
                                : 'bg-slate-900 text-gray-400 border-slate-800 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            {filterLabels[cat as keyof typeof filterLabels] || cat}
                          </button>
                        ))}
                      </div>

                      {/* Portfolio Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredPortfolio.map((item) => (
                          <div key={item.id} className="group bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-md flex flex-col h-full hover:border-slate-800 transition-colors duration-300">
                            <div className="relative aspect-video overflow-hidden">
                              <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                              <span className="absolute top-2 left-2 bg-slate-900/95 border border-slate-800 text-[8px] font-mono text-gray-300 px-2 py-0.5 rounded uppercase">
                                {item.category}
                              </span>
                            </div>
                            <div className="p-4 text-left">
                              <h4 className="font-bold text-xs text-white leading-snug">{item.title}</h4>
                              <p className="text-[9px] text-[#E2B755] font-bold uppercase tracking-widest mt-1">Garantia Certificada</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* LIVE DEMO TESTIMONIALS SECTION */}
                  <section className="py-16 px-4 md:px-8 bg-slate-950">
                    <div className="max-w-5xl mx-auto space-y-12">
                      <div className="text-center space-y-3">
                        <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight">Depoimentos de Clientes</h2>
                        <div className={`w-12 h-1 ${demoData.accentBg} mx-auto rounded-full`} />
                        <p className="text-xs text-gray-400">O que dizem os clientes que já realizaram projetos conosco.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {demoData.testimonials.map((t, i) => (
                          <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl relative space-y-4 text-left">
                            <div className="flex gap-1 text-[#E2B755]">
                              {[...Array(5)].map((_, idx) => (
                                <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                            <p className="text-xs md:text-sm text-gray-300 leading-relaxed font-medium italic">
                              "{t.text}"
                            </p>
                            <div className="flex items-center gap-3 pt-2">
                              <div className={`w-8 h-8 rounded-full ${demoData.accentBg}/20 ${demoData.accentColor} flex items-center justify-center font-bold text-xs`}>
                                {t.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-white">{t.name}</h4>
                                <p className="text-[10px] text-gray-500">{t.role}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* PREMIUM CTA AND CUSTOMIZATION SECTION inside Demo */}
                  <section className="py-16 px-4 md:px-8 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800 text-slate-100 text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
                    <div className="absolute -left-32 top-1/4 w-72 h-72 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -right-32 bottom-1/4 w-72 h-72 bg-[#E2B755]/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="max-w-4xl mx-auto space-y-10 relative z-10">
                      
                      <div className="space-y-4">
                        <span className="inline-flex items-center gap-1.5 text-[10px] text-green-400 uppercase tracking-widest font-mono font-bold bg-green-950/40 px-3.5 py-1 rounded-full border border-green-800/30">
                          <Check className="w-3.5 h-3.5" />
                          Pronto para Produção
                        </span>
                        <h2 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tight">
                          Gostou deste modelo?
                        </h2>
                        <div className="w-16 h-1 bg-green-500 mx-auto rounded-full" />
                        <p className="text-xs md:text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
                          Personalizamos e publicamos este site inteiro em tempo recorde sob medida para o seu negócio!
                        </p>
                      </div>

                      {/* Customization grid benefits */}
                      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 max-w-2xl mx-auto">
                        <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider text-left mb-4 flex items-center gap-2">
                          <GlassIcon className="w-4 h-4 text-[#E2B755]" />
                          O que está incluído na sua personalização:
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
                          <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
                            <span className="text-green-500 shrink-0">✓</span>
                            <span>Sua marca</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
                            <span className="text-green-500 shrink-0">✓</span>
                            <span>Suas cores</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
                            <span className="text-green-500 shrink-0">✓</span>
                            <span>Seus serviços</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
                            <span className="text-green-500 shrink-0">✓</span>
                            <span>Seus projetos</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
                            <span className="text-green-500 shrink-0">✓</span>
                            <span>Seu WhatsApp</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
                            <span className="text-green-500 shrink-0">✓</span>
                            <span>Seu domínio</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-gray-200 col-span-2 sm:col-span-1">
                            <span className="text-green-500 shrink-0">✓</span>
                            <span>SEO otimizado</span>
                          </div>
                        </div>
                      </div>

                      {/* Main Action Call */}
                      <div className="flex flex-col items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedSegment(null);
                            openContactWithPrefill(`Modelo ${demoData.title}`);
                          }}
                          className="bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase tracking-widest py-4.5 px-8 rounded-2xl flex items-center gap-2.5 shadow-xl shadow-green-950/20 hover:shadow-green-500/20 hover:scale-[1.02] active:scale-98 transition-all"
                        >
                          Quero este modelo para minha empresa
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <p className="text-[10px] text-gray-500">Garantia de carregamento ultra-rápido de alta conversão.</p>
                      </div>

                    </div>
                  </section>

                  {/* LIVE DEMO FOOTER */}
                  <footer className="bg-slate-950 border-t border-slate-900 py-10 px-4 md:px-8 text-center text-[10px] text-gray-500 mt-auto">
                    <div className="max-w-6xl mx-auto space-y-4">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-display font-black text-gray-400 uppercase tracking-widest">{demoData.title}</span>
                        <span className="text-gray-700">•</span>
                        <span>Todos os direitos reservados © 2026</span>
                      </div>
                      <p className="max-w-md mx-auto text-gray-600">
                        Este site de demonstração foi criado de forma nativa e personalizada pela Atlas Digital. Proibida cópia parcial ou total sem autorização expressa.
                      </p>
                    </div>
                  </footer>

                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </section>
  );
}
