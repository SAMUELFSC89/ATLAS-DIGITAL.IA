import React, { useState } from 'react';
import { 
  Settings, Zap, Check, Shield, AlertCircle, Play, 
  HelpCircle, MessageCircle, Mail, Calendar, FolderOpen, CreditCard, 
  Search, ExternalLink, RefreshCw, Send, ArrowRight, Bot, Compass, Plus, Loader2 
} from 'lucide-react';
import { IntegrationConfig, EmailMessage, WhatsAppChat } from '../types';

interface AutomacoesProps {
  onIntegrate: (id: string, state: 'connected' | 'disconnected') => void;
  integrations: IntegrationConfig[];
}

export default function Automacoes({ integrations, onIntegrate }: AutomacoesProps) {
  const [selectedSubTab, setSelectedSubTab] = useState<'grid' | 'gmail' | 'whatsapp'>('grid');
  
  // Gmail state simulations
  const [emails, setEmails] = useState<EmailMessage[]>([
    { id: 'm1', from: 'Marmoraria Imperial', fromEmail: 'carlos@marmorariaimperial.com.br', subject: 'Dúvida sobre orçamento de sitemap e carregamento', date: 'Hoje, 14:32', body: 'Olá, equipe Atlas! Recebemos a auditoria e ficamos preocupados com o tempo de carregamento de 4.8s indicado para mobile. Esse ajuste de imagens WebP e minificação de scripts realmente resolve o problema? Quanto custa para vocês implementarem isso tudo?', read: false, replied: false },
    { id: 'm2', from: 'Solaris Eco Energia', fromEmail: 'renata@solariseconet.com.br', subject: 'Agendamento de reunião técnica sobre funil de vendas', date: 'Hoje, 09:15', body: 'Bom dia. Gostaríamos de prosseguir com o agendamento da chamada técnica sugerida pela IA para alinharmos os detalhes do simulador de economia de luz solar. Amanhã às 15h é viável para vocês?', read: true, replied: false },
    { id: 'm3', from: 'Dr. Samuel Odontologia', fromEmail: 'samuel@drsamuelodonto.com.br', subject: 'Interesse em reformulação completa de portal de agendamentos', date: 'Ontem, 16:40', body: 'Olá. Tenho um site antigo que foi feito em WordPress há 5 anos. Gostaria de saber se vocês refazem toda a estrutura do zero e se incluem o painel de triagem automática que vi na demonstração.', read: true, replied: true }
  ]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [composedBody, setComposedBody] = useState<string>('');
  const [gmailLoading, setGmailLoading] = useState<boolean>(false);
  const [activeGmailDraftSuggestion, setActiveGmailDraftSuggestion] = useState<string>('');

  // WhatsApp state simulations
  const [waChats, setWaChats] = useState<WhatsAppChat[]>([
    {
      id: 'c1',
      contactName: 'Carlos (Marmoraria Imperial)',
      phone: '+55 11 98765-4321',
      lastMessage: 'Vou falar com meu sócio sobre o plano professional',
      lastMessageTime: '15:20',
      messages: [
        { id: 'w1_1', sender: 'client', text: 'Boa tarde! Vocês mandaram o PDF do Atlas Score para o meu WhatsApp?', timestamp: '15:05' },
        { id: 'w1_2', sender: 'user', text: 'Boa tarde, Carlos! Sim, o diagnóstico completo da Marmoraria Imperial está anexado.', timestamp: '15:08' },
        { id: 'w1_3', sender: 'client', text: 'Excelente. Vi que ficamos com score 32/100, bem abaixo da média. Vou falar com meu sócio sobre o plano professional para corrigirmos isso.', timestamp: '15:20' }
      ]
    },
    {
      id: 'c2',
      contactName: 'Renata (Solaris Energia)',
      phone: '+55 11 97777-8888',
      lastMessage: 'Confirmado a reunião técnica amanhã às 15h.',
      lastMessageTime: '11:45',
      messages: [
        { id: 'w2_1', sender: 'user', text: 'Olá, Renata! Conseguimos agendar a nossa conferência técnica?', timestamp: '11:30' },
        { id: 'w2_2', sender: 'client', text: 'Confirmado a reunião técnica amanhã às 15h.', timestamp: '11:45' }
      ]
    }
  ]);
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null);
  const [waMessageInput, setWaMessageInput] = useState<string>('');
  const [activeWaSuggestion, setActiveWaSuggestion] = useState<string>('');

  // Step-by-Step Meta WhatsApp Integration Guide State
  const [metaStep, setMetaStep] = useState<number>(1);
  const [metaApproved, setMetaApproved] = useState<boolean>(false);
  const [metaFormAppId, setMetaFormAppId] = useState<string>('');
  const [metaFormPhoneNumberId, setMetaFormPhoneNumberId] = useState<string>('');
  const [metaFormAccessToken, setMetaFormAccessToken] = useState<string>('');

  // Gmail AI Auto Response trigger
  const handleGmailAiDraft = () => {
    if (!selectedEmail) return;
    setGmailLoading(true);
    setTimeout(() => {
      let draft = "";
      if (selectedEmail.id === 'm1') {
        draft = `Prezado Carlos, obrigado pelo contato.

Com certeza! A otimização de imagens para o formato WebP de última geração aliada à minificação de scripts pesados e organização do carregamento assíncrono reduz o tempo mobile de 4.8s para cerca de 1.8s. Na prática, isso elimina as taxas de abandono do site por lentidão.

Para implementarmos este escopo e refatorarmos seu código, o investimento fica estruturado em nosso plano Starter de R$ 97,00/mês ou no Professional com CRM integrado.

Podemos marcar uma ligação rápida de 5 minutos hoje às 17h para fechar os detalhes?

Atenciosamente,
Equipe Atlas Intelligence`;
      } else {
        draft = `Prezada Renata, ótimo dia!

Confirmado! Agendamos em nosso painel do Google Calendar a nossa reunião técnica comercial para amanhã, às 15h00. 

Apresentaremos as estimativas detalhadas de payback e o escopo técnico do simulador para o segmento de Energia Solar.

Até amanhã!
Equipe Atlas Intelligence`;
      }
      setComposedBody(draft);
      setGmailLoading(false);
    }, 1000);
  };

  // WhatsApp AI reply suggestion
  const handleWaAiSuggestion = () => {
    if (!selectedChat) return;
    let draft = "";
    if (selectedChat.id === 'c1') {
      draft = `Perfeito, Carlos! Recomendo darmos esse passo, pois além de corrigirmos os gargalos do site, ativaremos o simulador de pedras para sua marmoraria. Quer que eu faça uma simulação de proposta sem compromisso para apresentar ao seu sócio?`;
    } else {
      draft = `Excelente, Renata! Reunião confirmada. Já enviei o convite do Google Meet para o seu e-mail. Estaremos prontos para te apresentar os insights!`;
    }
    setActiveWaSuggestion(draft);
  };

  const handleSendGmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composedBody.trim() || !selectedEmail) return;
    
    // Simulate sending email
    setEmails(emails.map(m => m.id === selectedEmail.id ? { ...m, replied: true } : m));
    alert(`E-mail enviado com sucesso para ${selectedEmail.fromEmail}!`);
    setComposedBody('');
    setSelectedEmail(null);
  };

  const handleSendWaMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const msgText = waMessageInput.trim() || activeWaSuggestion;
    if (!msgText || !selectedChat) return;

    const newMsg = {
      id: `w_msg_${Date.now()}`,
      sender: 'user' as const,
      text: msgText,
      timestamp: 'Agora'
    };

    setWaChats(waChats.map(c => c.id === selectedChat.id ? {
      ...c,
      lastMessage: msgText,
      lastMessageTime: 'Agora',
      messages: [...c.messages, newMsg]
    } : c));

    setWaMessageInput('');
    setActiveWaSuggestion('');
    
    // Auto simulated response after 2 seconds
    setTimeout(() => {
      const clientResponse = {
        id: `w_msg_res_${Date.now()}`,
        sender: 'client' as const,
        text: 'Perfeito! Obrigado pelo retorno rápido. Vou analisar aqui.',
        timestamp: 'Agora'
      };
      setWaChats(prev => prev.map(c => c.id === selectedChat.id ? {
        ...c,
        lastMessage: clientResponse.text,
        lastMessageTime: 'Agora',
        messages: [...c.messages, clientResponse]
      } : c));
    }, 2000);
  };

  const handleApproveMetaPair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaFormAppId || !metaFormPhoneNumberId || !metaFormAccessToken) {
      alert("Por favor, preencha todas as credenciais oficiais da Meta!");
      return;
    }
    setMetaApproved(true);
    onIntegrate('whatsapp-biz', 'connected');
    alert("Parabéns! WhatsApp Business conectado via API oficial Meta Cloud!");
  };

  return (
    <div className="space-y-8 text-left">
      
      {/* Tab Navigation header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-900 pb-6">
        <div>
          <span className="text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider block mb-1">
            Painel de Controle
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            Automações & Conexões APIs
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Conecte suas próprias ferramentas comerciais e APIs externas de SEO, e-mails ou gateways de pagamento.
          </p>
        </div>

        {/* Integration tab triggers */}
        <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-900">
          <button
            onClick={() => setSelectedSubTab('grid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${selectedSubTab === 'grid' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Todas Integrações
          </button>
          <button
            onClick={() => setSelectedSubTab('gmail')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${selectedSubTab === 'gmail' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Painel Gmail
          </button>
          <button
            onClick={() => setSelectedSubTab('whatsapp')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${selectedSubTab === 'whatsapp' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            WhatsApp Meta
          </button>
        </div>
      </div>

      {/* SUBTAB 1: INTEGRATION CONFIGURATION GRID */}
      {selectedSubTab === 'grid' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((item) => {
              const isConnected = item.status === 'connected';
              return (
                <div 
                  key={item.id}
                  className="bg-gray-950/40 border border-gray-900 hover:border-gray-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-mono font-bold text-gray-500 tracking-wider">
                        {item.category}
                      </span>
                      
                      {isConnected ? (
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-900/20 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Ativo
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                          Inativo
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-emerald-400 font-bold font-mono">
                        {item.name.slice(0, 2).toUpperCase()}
                      </div>
                      <h4 className="text-white text-sm font-bold tracking-tight">{item.name}</h4>
                    </div>

                    <p className="text-[11px] text-gray-400 leading-normal font-sans">
                      {item.description}
                    </p>
                  </div>

                  {/* Actions connection toggles */}
                  <div className="pt-3 border-t border-gray-900 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-gray-500 font-mono">
                      {item.requiresOAuth ? "Requer OAuth 2.0" : "Requer Chave API"}
                    </span>

                    {item.id === 'gmail' && !isConnected ? (
                      <button
                        onClick={() => setSelectedSubTab('gmail')}
                        className="px-3.5 py-1.5 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all text-[11px]"
                      >
                        Configurar
                      </button>
                    ) : item.id === 'whatsapp-biz' && !isConnected ? (
                      <button
                        onClick={() => setSelectedSubTab('whatsapp')}
                        className="px-3.5 py-1.5 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all text-[11px]"
                      >
                        Configurar
                      </button>
                    ) : (
                      <button
                        onClick={() => onIntegrate(item.id, isConnected ? 'disconnected' : 'connected')}
                        className={`px-3.5 py-1.5 font-semibold rounded-lg transition-all text-[11px] ${
                          isConnected 
                            ? 'bg-gray-900 border border-gray-800 text-red-400 hover:bg-red-500/10'
                            : 'bg-white text-black hover:bg-gray-200'
                        }`}
                      >
                        {isConnected ? 'Desconectar' : 'Conectar'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: GMAIL PORTAL SIMULATOR */}
      {selectedSubTab === 'gmail' && (
        <div className="bg-[#121214]/30 border border-gray-900 rounded-2xl p-6 space-y-6">
          <div className="border-b border-gray-900/60 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400" />
              <h3 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider font-mono">
                Central de E-mails Gmail Integrada
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-900/20">
              Conectado ao Gmail Oficial do Usuário
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[400px]">
            {/* List left side column */}
            <div className="lg:col-span-5 bg-gray-950/40 border border-gray-900 rounded-xl overflow-hidden flex flex-col divide-y divide-gray-900">
              {emails.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedEmail(m)}
                  className={`p-4 text-left hover:bg-gray-900/40 transition-colors block w-full relative ${
                    selectedEmail?.id === m.id ? 'bg-gray-900/60' : ''
                  }`}
                >
                  {!m.read && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white font-bold">{m.from}</span>
                      <span className="text-gray-500 font-mono text-[10px]">{m.date}</span>
                    </div>
                    <span className="text-[11px] text-gray-300 font-medium block truncate">{m.subject}</span>
                    <p className="text-[10px] text-gray-500 line-clamp-1 leading-relaxed font-sans">{m.body}</p>
                  </div>
                  
                  {m.replied && (
                    <span className="inline-block text-[9px] uppercase font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded mt-1 border border-emerald-900/20">
                      Respondido via IA
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Email Workspace Workspace */}
            <div className="lg:col-span-7 bg-gray-950/40 border border-gray-900 rounded-xl p-5 flex flex-col justify-between space-y-4">
              {selectedEmail ? (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="border-b border-gray-900/60 pb-3">
                      <h4 className="text-white text-xs font-bold font-mono">De: <span className="text-gray-300 font-sans">{selectedEmail.from} ({selectedEmail.fromEmail})</span></h4>
                      <h4 className="text-white text-xs font-bold font-mono mt-1">Assunto: <span className="text-[#E2B755] font-sans">{selectedEmail.subject}</span></h4>
                    </div>
                    
                    <p className="text-xs text-gray-300 leading-relaxed font-sans p-4 bg-gray-950 rounded-xl border border-gray-900 font-light whitespace-pre-line">
                      {selectedEmail.body}
                    </p>
                  </div>

                  {/* AI Suggested Response Composer block */}
                  <form onSubmit={handleSendGmail} className="space-y-3">
                    <div className="flex items-center justify-between border-t border-gray-900/60 pt-3">
                      <span className="text-[10px] uppercase font-mono font-bold text-gray-500">Escrever Resposta</span>
                      
                      <button
                        type="button"
                        onClick={handleGmailAiDraft}
                        disabled={gmailLoading}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-900/20 text-emerald-400 hover:text-white rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        Gerar Resposta com Copilot IA
                      </button>
                    </div>

                    <textarea
                      value={composedBody}
                      onChange={(e) => setComposedBody(e.target.value)}
                      rows={5}
                      placeholder="Utilize o botão acima para rascunhar com IA ou digite manualmente..."
                      className="w-full bg-gray-950 text-white border border-gray-900 rounded-xl p-4 text-xs focus:outline-none focus:border-[#E2B755] resize-none"
                    />

                    <div className="flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={!composedBody.trim()}
                        className="px-5 py-2.5 bg-white hover:bg-gray-200 text-black font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-3 h-3 text-black fill-black" />
                        Disparar E-mail Gmail
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-12 h-full space-y-2">
                  <Mail className="w-8 h-8 text-gray-700" />
                  <span className="text-gray-500 text-xs font-mono">Nenhum e-mail aberto</span>
                  <p className="text-[10px] text-gray-600 max-w-xs font-sans">
                    Selecione um e-mail na lista à esquerda para analisar suas dúvidas técnicas e responder usando inteligência artificial.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: WHATSAPP BUSINESS DEVELOPER WIZARD */}
      {selectedSubTab === 'whatsapp' && (
        <div className="bg-[#121214]/30 border border-gray-900 rounded-2xl p-6 space-y-6">
          <div className="border-b border-gray-900/60 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <h3 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider font-mono">
                Conectar WhatsApp Business Oficial (Meta Platform)
              </h3>
            </div>
            
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border ${
              metaApproved 
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-900/20' 
                : 'text-amber-500 bg-amber-500/10 border-amber-900/20'
            }`}>
              {metaApproved ? 'Sistema Conectado' : 'Aguardando Credenciamento Meta'}
            </span>
          </div>

          {!metaApproved ? (
            /* STEP BY STEP PAUSE GUIDE FOR WHATSAPP BUSINESS PLATFORM */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left timeline instructions */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="text-red-400 font-mono text-[9px] font-bold uppercase tracking-widest block mb-1">
                    [ETAPA REQUER CONFIGURAÇÃO EXTERNA META]
                  </span>
                  <h4 className="text-white text-base font-bold font-display tracking-tight">
                    Roteiro Passo a Passo de Ativação do WhatsApp Cloud API
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Como cada cliente utiliza o seu próprio número de WhatsApp Business (sem depender da Atlas), é obrigatório realizar as configurações na sua conta de desenvolvedor da Meta:
                  </p>
                </div>

                {/* Steps Accordion timeline */}
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className={`p-4 rounded-xl border transition-all ${metaStep === 1 ? 'bg-gray-950/60 border-white' : 'bg-gray-950/20 border-gray-900'}`}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setMetaStep(1)}>
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gray-900 border border-gray-800 text-white text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                          01
                        </span>
                        <span className="text-white text-xs font-bold">Criar Conta de Desenvolvedor Meta</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">Início</span>
                    </div>
                    {metaStep === 1 && (
                      <div className="mt-3 text-xs text-gray-400 space-y-2 leading-relaxed font-sans font-light pl-9 border-t border-gray-900/60 pt-3">
                        <p>1. Acesse o portal oficial de desenvolvedores em <strong className="text-white">developers.facebook.com</strong> e faça login com a conta de administrador da sua empresa.</p>
                        <p>2. Complete o cadastro básico de desenvolvedor informando o segmento e o telefone.</p>
                        <p>3. Clique em <strong className="text-white">Meus Aplicativos</strong> &rarr; <strong className="text-white">Criar Aplicativo</strong>.</p>
                      </div>
                    )}
                  </div>

                  {/* Step 2 */}
                  <div className={`p-4 rounded-xl border transition-all ${metaStep === 2 ? 'bg-gray-950/60 border-white' : 'bg-gray-950/20 border-gray-900'}`}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setMetaStep(2)}>
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gray-900 border border-gray-800 text-white text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                          02
                        </span>
                        <span className="text-white text-xs font-bold">Adicionar o Produto WhatsApp API</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">Associação</span>
                    </div>
                    {metaStep === 2 && (
                      <div className="mt-3 text-xs text-gray-400 space-y-2 leading-relaxed font-sans font-light pl-9 border-t border-gray-900/60 pt-3">
                        <p>1. Escolha o tipo de aplicativo como <strong className="text-white">Negócios (Business)</strong> ou <strong className="text-white">Outro</strong>.</p>
                        <p>2. No painel de configuração de produtos, localize <strong className="text-white">WhatsApp</strong> e clique em <strong className="text-white">Configurar</strong>.</p>
                        <p>3. Vincule o aplicativo ao seu Gerenciador de Negócios (Meta Business Suite) do cliente.</p>
                      </div>
                    )}
                  </div>

                  {/* Step 3 */}
                  <div className={`p-4 rounded-xl border transition-all ${metaStep === 3 ? 'bg-gray-950/60 border-white' : 'bg-gray-950/20 border-gray-900'}`}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setMetaStep(3)}>
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gray-900 border border-gray-800 text-white text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                          03
                        </span>
                        <span className="text-white text-xs font-bold">Obter Token de Acesso Permanente</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">Credenciamento</span>
                    </div>
                    {metaStep === 3 && (
                      <div className="mt-3 text-xs text-gray-400 space-y-2 leading-relaxed font-sans font-light pl-9 border-t border-gray-900/60 pt-3">
                        <p>1. No menu do WhatsApp &rarr; <strong className="text-white">Configuração da API</strong>, você verá um Token Temporário de 24h.</p>
                        <p>2. Para obter o <strong className="text-[#E2B755]">Token Permanente</strong>, acesse o menu Usuários do Sistema no Business Manager, crie um usuário do sistema e gere o Token com a permissão <strong className="text-white">whatsapp_business_messaging</strong>.</p>
                        <p>3. Copie o <strong className="text-white">Identificador do Número de Telefone (Phone Number ID)</strong> e o <strong className="text-white">ID do Aplicativo (App ID)</strong>.</p>
                      </div>
                    )}
                  </div>

                  {/* Step 4 */}
                  <div className={`p-4 rounded-xl border transition-all ${metaStep === 4 ? 'bg-gray-950/60 border-white' : 'bg-gray-950/20 border-gray-900'}`}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setMetaStep(4)}>
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gray-900 border border-gray-800 text-white text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                          04
                        </span>
                        <span className="text-white text-xs font-bold">Configurar Webhook de Mensagens Recebidas</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">Sincronia</span>
                    </div>
                    {metaStep === 4 && (
                      <div className="mt-3 text-xs text-gray-400 space-y-2 leading-relaxed font-sans font-light pl-9 border-t border-gray-900/60 pt-3">
                        <p>1. Vá em WhatsApp &rarr; <strong className="text-white">Configuração</strong> &rarr; <strong className="text-white">Webhooks</strong>.</p>
                        <p>2. Insira a URL de Retorno disponibilizada nos segredos da sua hospedagem e o Token de Verificação.</p>
                        <p>3. Subscreva-se no campo <strong className="text-white">messages</strong>. Isso permite que a Atlas Intelligence receba as respostas dos leads instantaneamente no CRM!</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex gap-3 text-xs text-amber-500">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="font-bold">PARE AQUI CASO NÃO TENHA AS CREDENCIAIS</h5>
                    <p className="leading-relaxed font-light text-gray-400 text-[11px]">
                      A integração oficial exige que você execute os passos descritos acima. Caso necessite de apoio visual, nossa equipe pode guiar o seu cliente por chamada. Quando tiver as credenciais prontas, preencha-as no formulário ao lado para liberar o painel!
                    </p>
                  </div>
                </div>
              </div>

              {/* Right credentials pairing form */}
              <div className="lg:col-span-5 bg-gray-950/40 border border-gray-900 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
                <form onSubmit={handleApproveMetaPair} className="space-y-4">
                  <h5 className="text-white text-xs font-bold font-mono uppercase tracking-wider border-b border-gray-900 pb-2">
                    Painel de Autenticação Meta API
                  </h5>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono font-bold text-gray-500">App ID da Meta *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 849204210421"
                      value={metaFormAppId}
                      onChange={(e) => setMetaFormAppId(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Phone Number ID da Conta *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 104820478204"
                      value={metaFormPhoneNumberId}
                      onChange={(e) => setMetaFormPhoneNumberId(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Token Permanente de Acesso *</label>
                    <input
                      type="password"
                      required
                      placeholder="EAAW..."
                      value={metaFormAccessToken}
                      onChange={(e) => setMetaFormAccessToken(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755] font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#E2B755] hover:bg-yellow-500 text-black font-semibold text-xs uppercase tracking-wider rounded-xl transition-all mt-4 flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 text-black fill-black" />
                    Validar e Conectar Canal
                  </button>
                </form>

                <div className="pt-4 border-t border-gray-900/60 mt-4 text-[9px] text-gray-500 text-center font-mono">
                  Sincronização SSL garantida via Webhooks
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE WHATSAPP DASHBOARD MODULE FOR APPROVED USERS */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[400px]">
              {/* Left active chats */}
              <div className="lg:col-span-4 bg-gray-950/40 border border-gray-900 rounded-xl overflow-hidden flex flex-col divide-y divide-gray-900">
                <div className="p-3 bg-gray-950/60 text-[10px] text-gray-500 font-mono uppercase font-bold tracking-wider">
                  Conversas Ativas (CRM)
                </div>
                {waChats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChat(c)}
                    className={`p-4 text-left hover:bg-gray-900/40 transition-colors block w-full ${
                      selectedChat?.id === c.id ? 'bg-gray-900/60' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white font-bold">{c.contactName}</span>
                        <span className="text-gray-500 font-mono text-[9px]">{c.lastMessageTime}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 block truncate">{c.lastMessage}</span>
                      <span className="text-[9px] text-gray-500 font-mono">{c.phone}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Chat panel */}
              <div className="lg:col-span-8 bg-gray-950/40 border border-gray-900 rounded-xl p-5 flex flex-col justify-between">
                {selectedChat ? (
                  <div className="flex flex-col justify-between h-full space-y-4">
                    {/* Header of conversation */}
                    <div className="border-b border-gray-900 pb-2">
                      <h4 className="text-white text-xs font-bold">{selectedChat.contactName}</h4>
                      <span className="text-[10px] text-gray-500 font-mono">{selectedChat.phone}</span>
                    </div>

                    {/* Messages list container */}
                    <div className="flex-1 bg-gray-950/60 border border-gray-900 rounded-xl p-4 space-y-3 overflow-y-auto max-h-56 min-h-48 text-xs font-sans">
                      {selectedChat.messages.map((m) => (
                        <div 
                          key={m.id}
                          className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`p-3 rounded-2xl max-w-sm ${
                            m.sender === 'user' 
                              ? 'bg-[#E2B755] text-black rounded-tr-none font-medium' 
                              : 'bg-gray-900 text-gray-200 rounded-tl-none border border-gray-800'
                          }`}>
                            <p>{m.text}</p>
                            <span className="block text-[8px] text-right mt-1 opacity-60 font-mono">
                              {m.timestamp}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick input draft with Copilot */}
                    <form onSubmit={handleSendWaMessage} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono text-gray-500 font-bold">Escrever Mensagem</span>
                        
                        <button
                          type="button"
                          onClick={handleWaAiSuggestion}
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-900/20 text-emerald-400 hover:text-white rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                        >
                          <Bot className="w-3 h-3" />
                          Gerar Sugestão Copilot
                        </button>
                      </div>

                      {/* Display suggested reply from Copilot first with approve check */}
                      {activeWaSuggestion && (
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-xs space-y-2">
                          <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono font-bold">
                            <Bot className="w-3.5 h-3.5" />
                            RASCUNHO SUGERIDO (REVISE ANTES DE ENVIAR)
                          </div>
                          <p className="text-gray-300 font-light leading-relaxed">{activeWaSuggestion}</p>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setActiveWaSuggestion('')}
                              className="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-gray-400 rounded text-[9px]"
                            >
                              Dispensar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setWaMessageInput(activeWaSuggestion);
                                setActiveWaSuggestion('');
                              }}
                              className="px-2.5 py-1 bg-white text-black font-semibold rounded text-[9px]"
                            >
                              Aprovar para Envio
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={waMessageInput}
                          onChange={(e) => setWaMessageInput(e.target.value)}
                          placeholder="Digite sua resposta..."
                          className="flex-1 bg-gray-950 text-white border border-gray-900 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#E2B755]"
                        />
                        <button
                          type="submit"
                          disabled={!waMessageInput.trim()}
                          className="px-4 py-2 bg-white text-black font-bold text-xs rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
                        >
                          Enviar
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-12 h-full space-y-2">
                    <MessageCircle className="w-8 h-8 text-gray-700" />
                    <span className="text-gray-500 text-xs font-mono">Nenhum chat selecionado</span>
                    <p className="text-[10px] text-gray-600 max-w-xs font-sans">
                      Selecione um contato na lista à esquerda para conversar com seu cliente de forma síncrona.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
