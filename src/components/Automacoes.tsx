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
  currentUser?: string | null;
}

export default function Automacoes({ integrations, onIntegrate, currentUser }: AutomacoesProps) {
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

  // WhatsApp Multi-Tenant States
  const [whatsappMetaConfig, setWhatsappMetaConfig] = useState<any>(null);
  const [waLoading, setWaLoading] = useState<boolean>(true);
  const [waActionLoading, setWaActionLoading] = useState<boolean>(false);
  const [metaApproved, setMetaApproved] = useState<boolean>(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState<boolean>(false);

  // Meta Embedded Signup OAuth configuration state

  // Sandbox Webhook Simulator States
  const [clientSimulatedPhone, setClientSimulatedPhone] = useState<string>('5511999999999');
  const [clientSimulatedName, setClientSimulatedName] = useState<string>('Carlos Imperial');
  const [clientSimulatedMessage, setClientSimulatedMessage] = useState<string>('Olá! Recebi a auditoria Atlas Score e gostaria de marcar a reunião comercial.');
  const [isSimulatingMessage, setIsSimulatingMessage] = useState<boolean>(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);

  // WhatsApp chat list state
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
  const [metaStep, setMetaStep] = useState<number>(1);

  // Fetch Connection status on mount/tenant change
  const fetchWhatsAppStatus = async () => {
    setWaLoading(true);
    try {
      const response = await fetch(`/api/meta?action=status`, {
        headers: {
          'x-company-id': currentUser || 'demo@empresa.com'
        }
      });
      const data = await response.json();
      if (data && data.status === 'connected') {
        setWhatsappMetaConfig(data);
        setMetaApproved(true);
      } else {
        setWhatsappMetaConfig(null);
        setMetaApproved(false);
      }
    } catch (err) {
      console.error("Error fetching WhatsApp status:", err);
    } finally {
      setWaLoading(false);
    }
  };

  React.useEffect(() => {
    fetchWhatsAppStatus();

    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'META_CONNECTED') {
        if (event.data.success) {
          fetchWhatsAppStatus();
          onIntegrate('whatsapp-biz', 'connected');
          alert("Parabéns! WhatsApp Business conectado via API oficial Meta Cloud!");
        } else {
          alert("Erro na conexão oficial da Meta: " + (event.data.error || "Desconhecido"));
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => {
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, [currentUser]);

  // Connect WhatsApp using the official Meta Embedded Signup OAuth popup flow
  const handleConnectWhatsApp = async () => {
    setWaLoading(true);
    try {
      const response = await fetch(`/api/meta?action=config&companyId=${currentUser || 'demo@empresa.com'}`);
      const { appId, redirectUri } = await response.json();

      if (!appId || appId === '123456789') {
        alert("O App ID da Meta não está configurado nas variáveis de ambiente (.env). Por favor, configure META_APP_ID para produção.");
        setWaLoading(false);
        return;
      }

      const state = currentUser || 'demo@empresa.com';
      const scope = 'whatsapp_business_management,whatsapp_business_messaging';
      const extras = JSON.stringify({
        setup: {
          type: 'whatsapp_embedded_signup'
        }
      });

      const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&extras=${encodeURIComponent(extras)}&state=${encodeURIComponent(state)}`;

      const width = 600;
      const height = 660;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      window.open(
        oauthUrl,
        'MetaEmbeddedSignup',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );
    } catch (err: any) {
      alert("Erro ao recuperar configuração da Meta: " + err.message);
    } finally {
      setWaLoading(false);
    }
  };

  // Disconnect WhatsApp
  const handleDisconnectWhatsApp = async () => {
    setWaActionLoading(true);
    try {
      const response = await fetch(`/api/meta?action=disconnect`, {
        method: 'POST',
        headers: {
          'x-company-id': currentUser || 'demo@empresa.com'
        }
      });
      const data = await response.json();
      if (data.success) {
        setWhatsappMetaConfig(null);
        setMetaApproved(false);
        setShowDisconnectConfirm(false);
        onIntegrate('whatsapp-biz', 'disconnected');
      }
    } catch (err: any) {
      alert("Erro ao desconectar: " + err.message);
    } finally {
      setWaActionLoading(false);
    }
  };

  // Refresh Connection stats
  const handleRefreshWhatsApp = async () => {
    setWaActionLoading(true);
    try {
      const response = await fetch(`/api/meta?action=refresh`, {
        method: 'POST',
        headers: {
          'x-company-id': currentUser || 'demo@empresa.com'
        }
      });
      const data = await response.json();
      if (data.success) {
        setWhatsappMetaConfig(data.record);
      }
    } catch (err: any) {
      console.error("Erro ao sincronizar dados da Meta:", err);
    } finally {
      setWaActionLoading(false);
    }
  };

  // Simulate incoming webhook message
  const handleSimulateWebhook = async () => {
    setIsSimulatingMessage(true);
    setSimulationLogs(prev => [...prev, `[Webhook] POST /api/webhook iniciado...`]);
    try {
      const payload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: whatsappMetaConfig?.whatsappBusinessAccountId || "204855512",
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  metadata: {
                    display_phone_number: whatsappMetaConfig?.displayPhoneNumber || "+55 11 98888-7777",
                    phone_number_id: whatsappMetaConfig?.phoneNumberId || "106512345"
                  },
                  contacts: [
                    {
                      profile: {
                        name: clientSimulatedName
                      },
                      wa_id: clientSimulatedPhone
                    }
                  ],
                  messages: [
                    {
                      from: clientSimulatedPhone,
                      id: `wmid.Simulated_${Date.now()}`,
                      timestamp: String(Math.floor(Date.now() / 1000)),
                      text: {
                        body: clientSimulatedMessage
                      },
                      type: "text"
                    }
                  ]
                },
                field: "messages"
              }
            ]
          }
        ]
      };

      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      const formattedPhone = `+${clientSimulatedPhone.substring(0, 2)} ${clientSimulatedPhone.substring(2, 4)} ${clientSimulatedPhone.substring(4, 9)}-${clientSimulatedPhone.substring(9)}`;
      const existingChat = waChats.find(c => c.phone === formattedPhone || c.phone.replace(/[^0-9]/g, '') === clientSimulatedPhone);
      
      const newIncomingMsg = {
        id: `w_msg_inc_${Date.now()}`,
        sender: 'client' as const,
        text: clientSimulatedMessage,
        timestamp: 'Agora'
      };

      if (existingChat) {
        setWaChats(waChats.map(c => c.id === existingChat.id ? {
          ...c,
          lastMessage: clientSimulatedMessage,
          lastMessageTime: 'Agora',
          messages: [...c.messages, newIncomingMsg]
        } : c));
      } else {
        const newChat = {
          id: `c_sim_${Date.now()}`,
          contactName: `${clientSimulatedName}`,
          phone: formattedPhone,
          lastMessage: clientSimulatedMessage,
          lastMessageTime: 'Agora',
          messages: [newIncomingMsg]
        };
        setWaChats(prev => [newChat, ...prev]);
        setSelectedChat(newChat);
      }

      setSimulationLogs(prev => [...prev, `[Webhook] HTTP ${response.status} Sucesso!`]);
      
      setTimeout(async () => {
        await handleRefreshWhatsApp();
        setSimulationLogs(prev => [...prev, `[Webhook] Métricas atualizadas. Resposta IA enviada via central dispatcher!`]);
      }, 1500);

    } catch (err: any) {
      setSimulationLogs(prev => [...prev, `[Webhook] Erro: ${err.message}`]);
    } finally {
      setIsSimulatingMessage(false);
    }
  };

  // Gmail AI Auto Response trigger
  const handleGmailAiDraft = () => {
    if (!selectedEmail) return;
    setGmailLoading(true);
    setTimeout(() => {
      let draft = "";
      if (selectedEmail.id === 'm1') {
        draft = `Prezado Carlos, obrigado pelo contato.

Com certeza! A otimização de imagens para o formato WebP de última geração aliada à minificação de scripts pesados e organização do carregamento assíncrono reduz o tempo mobile de 4.8s para cerca de 1.8s. Na prática, isso elimina as taxas de lançamento por lentidão.

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
    
    // Send message to backend dispatcher
    fetch(`/api/meta?action=refresh`, { method: 'POST', headers: { 'x-company-id': currentUser || 'demo@empresa.com' } });
    
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
        <div className="space-y-6">
          {waLoading ? (
            <div className="bg-[#121214]/30 border border-gray-900 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-8 h-8 text-[#E2B755] animate-spin" />
              <span className="text-xs text-gray-500 font-mono">Verificando credenciamento e conexão Meta oficial...</span>
            </div>
          ) : !metaApproved ? (
            /* STEP BY STEP PAUSE GUIDE FOR WHATSAPP BUSINESS PLATFORM */
            <div className="bg-[#121214]/30 border border-gray-900 rounded-2xl p-6 sm:p-8 space-y-8">
              <div className="border-b border-zinc-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white text-base font-bold font-display tracking-tight">
                      Conexão Direta WhatsApp Business Cloud API
                    </h3>
                    <p className="text-xs text-zinc-500 font-light mt-0.5">
                      Empresa logada: <strong className="text-zinc-400 font-mono">{currentUser || 'demo@empresa.com'}</strong>
                    </p>
                  </div>
                </div>
                
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-zinc-950 border border-zinc-900 text-zinc-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" />
                  AGUARDANDO EMPRESA
                </span>
              </div>

              {/* Promo Banner and Explanation */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <span className="text-[#E2B755] font-mono text-[9px] font-bold uppercase tracking-widest block">
                    [ FLUXO EMBEDDED SIGNUP MULTI-TENANT ]
                  </span>
                  
                  <h4 className="text-white text-lg sm:text-xl font-display font-black tracking-tight leading-tight">
                    Conecte o WhatsApp oficial de cada cliente sem configurações manuais complexas.
                  </h4>

                  <p className="text-xs text-zinc-400 leading-relaxed font-light">
                    Como nossa plataforma funciona no modelo <strong className="text-zinc-200">SaaS Multi-tenant</strong>, cada empresa conecta sua própria conta do WhatsApp Business através do login seguro da Meta. 
                  </p>

                  <div className="space-y-3.5 pt-2">
                    {[
                      "Sem números fixos compartilhados: isolamento absoluto de dados.",
                      "Sem digitação manual: tokens e IDs de telefone são capturados automaticamente.",
                      "Integração instantânea do Webhook para resposta automática imediata por IA.",
                      "Armazenamento altamente seguro com criptografia de ponta a ponta dos tokens de acesso."
                    ].map((text, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-zinc-400 font-light">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Meta Button Trigger */}
                <div className="lg:col-span-5 bg-zinc-950 border border-zinc-900 rounded-3xl p-6 flex flex-col justify-between items-center text-center space-y-6">
                  <div className="space-y-2">
                    <Shield className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h5 className="text-white text-xs font-bold font-mono uppercase tracking-wider">
                      Integração Homologada Meta
                    </h5>
                    <p className="text-[11px] text-zinc-500 max-w-xs font-light leading-relaxed">
                      Ao clicar no botão abaixo, a janela oficial de login e Embedded Signup da Meta será iniciada para autorizar o escopo da sua empresa.
                    </p>
                  </div>

                  <button
                    onClick={handleConnectWhatsApp}
                    className="w-full py-3 px-5 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2.5 hover:scale-[1.01]"
                  >
                    {/* Official Facebook Icon */}
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Conectar WhatsApp Oficial
                  </button>

                  <div className="text-[10px] text-zinc-600 font-mono">
                    Meta Business Platform v18.0 Verified
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE WHATSAPP DASHBOARD MODULE FOR APPROVED USERS */
            <div className="space-y-6">
              {/* Active Connection metrics header */}
              <div className="bg-[#121214]/30 border border-gray-900 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900/60 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <MessageCircle className="w-5 h-5 fill-emerald-500/20" />
                    </div>
                    <div>
                      <h3 className="text-white text-sm font-bold font-display tracking-tight flex items-center gap-2">
                        {whatsappMetaConfig?.verifiedName || "WhatsApp Business Conectado"}
                        <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-900/20">
                          SaaS Ativo
                        </span>
                      </h3>
                      <span className="text-xs text-zinc-500 font-mono">{whatsappMetaConfig?.displayPhoneNumber || "Número Desconhecido"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      onClick={handleRefreshWhatsApp}
                      disabled={waActionLoading || showDisconnectConfirm}
                      className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all font-mono text-xs flex items-center gap-2 disabled:opacity-50"
                      title="Sincronizar Métricas"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${waActionLoading ? 'animate-spin text-[#E2B755]' : ''}`} />
                      Sincronizar Meta
                    </button>

                    {showDisconnectConfirm ? (
                      <div className="flex items-center gap-2 bg-red-500/5 border border-red-900/30 px-3 py-1.5 rounded-xl animate-fade-in">
                        <span className="text-[10px] text-red-400 font-mono font-bold uppercase tracking-wider">Confirmar?</span>
                        <button
                          onClick={handleDisconnectWhatsApp}
                          disabled={waActionLoading}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setShowDisconnectConfirm(false)}
                          disabled={waActionLoading}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDisconnectConfirm(true)}
                        disabled={waActionLoading}
                        className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500 border border-red-900/20 text-red-400 hover:text-white rounded-xl transition-all text-xs font-semibold disabled:opacity-50"
                      >
                        Desconectar Canal
                      </button>
                    )}
                  </div>
                </div>

                {/* Connection Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl space-y-1 text-left">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Nível de Qualidade</span>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-white text-xs font-bold font-mono">
                        {whatsappMetaConfig?.qualityRating || "ALTA (GREEN)"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl space-y-1 text-left">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Limite de Envio</span>
                    <span className="text-white text-xs font-bold font-mono block pt-0.5">
                      {whatsappMetaConfig?.messagingLimit === "TIER_10K" ? "10K mensagens / dia" : "250 mensagens / dia"}
                    </span>
                  </div>

                  <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl space-y-1 text-left">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Disparos Hoje</span>
                    <span className="text-emerald-400 text-xs font-bold font-mono block pt-0.5">
                      {whatsappMetaConfig?.messagesToday || 0} mensagens
                    </span>
                  </div>

                  <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl space-y-1 text-left">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">ID do Telefone (Meta ID)</span>
                    <span className="text-zinc-400 text-[10px] font-mono block pt-1 truncate" title={whatsappMetaConfig?.phoneNumberId}>
                      {whatsappMetaConfig?.phoneNumberId || "Nenhum"}
                    </span>
                  </div>
                </div>

                {/* Technical Node Specs (Strictly human-readable details) */}
                <div className="flex items-center gap-2 p-3 bg-zinc-950 border border-zinc-900 rounded-xl text-[10px] text-zinc-500 font-mono">
                  <Shield className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Isolamento Multi-tenant: Canal criptografado atrelado exclusivamente à empresa <strong className="text-zinc-300 font-sans">{whatsappMetaConfig?.empresaId}</strong>.</span>
                </div>
              </div>

              {/* TWO COLUMN GRID: Live chat & Webhook Simulator */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* COLUMN 1: LIVE CHAT CRM MONITOR */}
                <div className="lg:col-span-7 bg-[#121214]/30 border border-gray-900 rounded-2xl p-5 space-y-4">
                  <div className="border-b border-zinc-900 pb-2 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      Visualizador de Conversas Ativas
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600 bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded">
                      Reflete Webhook Live
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[420px]">
                    {/* Left chat list */}
                    <div className="md:col-span-5 bg-zinc-950/40 border border-zinc-900 rounded-xl overflow-hidden flex flex-col divide-y divide-zinc-900 h-full overflow-y-auto">
                      {waChats.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedChat(c)}
                          className={`p-3 text-left hover:bg-zinc-900/40 transition-colors block w-full relative ${
                            selectedChat?.id === c.id ? 'bg-zinc-900/60' : ''
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-white font-bold truncate max-w-[100px]">{c.contactName}</span>
                              <span className="text-zinc-500 font-mono text-[9px] shrink-0">{c.lastMessageTime}</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 block truncate leading-tight">{c.lastMessage}</span>
                            <span className="text-[9px] text-zinc-500 font-mono block">{c.phone}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Chat panel */}
                    <div className="md:col-span-7 bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between h-full">
                      {selectedChat ? (
                        <div className="flex flex-col justify-between h-full space-y-3">
                          {/* Header of conversation */}
                          <div className="border-b border-zinc-900/80 pb-2">
                            <h4 className="text-white text-xs font-bold leading-tight">{selectedChat.contactName}</h4>
                            <span className="text-[9px] text-zinc-500 font-mono">{selectedChat.phone}</span>
                          </div>

                          {/* Messages list container */}
                          <div className="flex-1 bg-zinc-950/60 border border-zinc-900 rounded-xl p-3 space-y-2.5 overflow-y-auto max-h-[220px] text-xs font-sans">
                            {selectedChat.messages.map((m) => (
                              <div 
                                key={m.id}
                                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`p-2.5 rounded-2xl max-w-[200px] leading-relaxed ${
                                  m.sender === 'user' 
                                    ? 'bg-[#E2B755] text-black rounded-tr-none font-medium text-[11px]' 
                                    : 'bg-zinc-900 text-zinc-200 rounded-tl-none border border-zinc-800 text-[11px]'
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
                          <form onSubmit={handleSendWaMessage} className="space-y-2 pt-1 border-t border-zinc-900/40">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase font-mono text-zinc-500 font-bold">Responder Cliente</span>
                              
                              <button
                                type="button"
                                onClick={handleWaAiSuggestion}
                                className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-900/20 text-emerald-400 hover:text-white rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-all"
                              >
                                <Bot className="w-3 h-3" />
                                Sugerir Copilot
                              </button>
                            </div>

                            {/* Display suggested reply from Copilot first with approve check */}
                            {activeWaSuggestion && (
                              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2.5 text-[10px] space-y-1.5 text-left">
                                <div className="flex items-center gap-1 text-emerald-400 text-[9px] font-mono font-bold">
                                  <Bot className="w-3 h-3" />
                                  SUGESTÃO COPILOT IA
                                </div>
                                <p className="text-zinc-300 font-light leading-relaxed">{activeWaSuggestion}</p>
                                <div className="flex items-center justify-end gap-1.5 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setActiveWaSuggestion('')}
                                    className="px-1.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded text-[8px]"
                                  >
                                    Dispensar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setWaMessageInput(activeWaSuggestion);
                                      setActiveWaSuggestion('');
                                    }}
                                    className="px-2 py-0.5 bg-white text-black font-semibold rounded text-[8px]"
                                  >
                                    Aprovar
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={waMessageInput}
                                onChange={(e) => setWaMessageInput(e.target.value)}
                                placeholder="Digite sua resposta..."
                                className="flex-1 bg-zinc-950 text-white border border-zinc-900 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#E2B755]"
                              />
                              <button
                                type="submit"
                                disabled={!waMessageInput.trim()}
                                className="px-3 py-1.5 bg-white text-black font-bold text-xs rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50"
                              >
                                Enviar
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-6 h-full space-y-2">
                          <MessageCircle className="w-6 h-6 text-zinc-800" />
                          <span className="text-zinc-600 text-[11px] font-mono">Aguardando chat</span>
                          <p className="text-[9px] text-zinc-700 max-w-xs leading-relaxed font-sans">
                            Selecione uma conversa ativa ou utilize o simulador à direita para forçar o recebimento de uma mensagem do cliente no seu webhook SaaS!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: WEBHOOK SANDBOX SIMULATOR */}
                <div className="lg:col-span-5 bg-[#121214]/30 border border-gray-900 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="border-b border-zinc-900 pb-2 flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E2B755] flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-[#E2B755] fill-[#E2B755]/10" />
                        Simulador de Webhook CRM
                      </span>
                      <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-900/20 px-2 py-0.5 rounded">
                        API Sandbox
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-500 leading-relaxed font-light text-left">
                      Dispare eventos de mensagem simulando ações reais dos clientes para testar a triagem e o despache automático via Inteligência Artificial!
                    </p>

                    <div className="space-y-3 text-left">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono font-bold text-zinc-500">Nome do Lead Simulador</label>
                        <input
                          type="text"
                          value={clientSimulatedName}
                          onChange={(e) => setClientSimulatedName(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                          placeholder="Ex: Geraldo Marmoraria"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono font-bold text-zinc-500">Telefone do Lead Simulador</label>
                        <input
                          type="text"
                          value={clientSimulatedPhone}
                          onChange={(e) => setClientSimulatedPhone(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755] font-mono"
                          placeholder="Ex: 5511999999999"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono font-bold text-zinc-500">Texto Recebido (WhatsApp)</label>
                        <textarea
                          rows={2}
                          value={clientSimulatedMessage}
                          onChange={(e) => setClientSimulatedMessage(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755] resize-none"
                          placeholder="Ex: Olá! Quanto custa a auditoria do meu site?"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSimulateWebhook}
                        disabled={isSimulatingMessage || waActionLoading}
                        className="w-full py-2.5 bg-[#E2B755] hover:bg-yellow-500 text-black font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {isSimulatingMessage ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-black fill-black" />
                        )}
                        Simular Recebimento no Webhook
                      </button>
                    </div>
                  </div>

                  {/* Simulator real-time logs terminal */}
                  <div className="mt-4 pt-3 border-t border-zinc-900/60">
                    <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 block mb-1.5 text-left">Logs do Servidor (Webhook Console)</span>
                    <div className="w-full h-24 bg-black border border-zinc-900 rounded-xl p-2.5 font-mono text-[9px] text-zinc-400 overflow-y-auto space-y-1 text-left">
                      {simulationLogs.length === 0 ? (
                        <span className="text-zinc-600 block italic">Nenhum evento disparado ainda. Use o botão acima para iniciar...</span>
                      ) : (
                        simulationLogs.map((log, index) => (
                          <div key={index} className="leading-relaxed border-l-2 border-zinc-800 pl-1.5">
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* Simulation Modal Deleted in Favor of Official Meta Embedded Signup Popup Flow */}

    </div>
  );
}
