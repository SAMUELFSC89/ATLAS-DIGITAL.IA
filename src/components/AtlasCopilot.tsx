import { useState, useEffect } from 'react';
import { 
  Bot, Sparkles, Send, Copy, Edit3, ShieldAlert, Check, 
  MessageSquare, FileText, AlertCircle, RefreshCw, Mail, HelpCircle 
} from 'lucide-react';
import { Lead } from '../types';

interface AtlasCopilotProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
}

export default function AtlasCopilot({ leads, selectedLead, onSelectLead }: AtlasCopilotProps) {
  const [activeAction, setActiveAction] = useState<string>('whatsapp');
  const [objectionText, setObjectionText] = useState<string>('Está muito caro, o concorrente cobra a metade do preço.');
  const [generating, setGenerating] = useState<boolean>(false);
  const [copilotOutput, setCopilotOutput] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const COPILOT_ACTIONS = [
    { id: 'whatsapp', label: 'Mensagem WhatsApp', desc: 'Mensagens rápidas e informais focadas em engajamento local', icon: MessageSquare },
    { id: 'email', label: 'E-mail de Apresentação', desc: 'E-mail executivo apresentando o diagnóstico do Atlas Score', icon: Mail },
    { id: 'proposta', label: 'Proposta Comercial', desc: 'Estruturação de valores, cronograma e diferenciais premium', icon: FileText },
    { id: 'objecao', label: 'Contornar Objeções', desc: 'Quebra de objeções clássicas de preços, prazos ou confiança', icon: HelpCircle },
    { id: 'contrato', label: 'Esboçar Contrato', desc: 'Estrutura legal e termos para fechamento rápido de serviços', icon: Bot },
  ];

  // Trigger simulated generation with high fidelity
  const handleGenerate = async () => {
    if (!selectedLead) {
      alert("Por favor, selecione uma empresa (lead) para orientar o Copilot!");
      return;
    }

    setGenerating(true);
    setCopilotOutput('');
    setIsCopied(false);

    // Prompt responses simulation
    let resultText = '';
    const name = selectedLead.companyName;
    const resp = selectedLead.responsible;
    const city = selectedLead.city;
    const score = selectedLead.atlasScore || 42;
    const segment = selectedLead.segment;

    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (activeAction === 'whatsapp') {
      resultText = `Olá, *${resp}*! Tudo bem?

Aqui é a equipe da *Atlas Intelligence*. Estávamos fazendo um mapeamento técnico da presença digital de empresas do segmento de *${segment}* em *${city}*, e analisamos a ficha da *${name}*.

Geramos um relatório executivo automático (Atlas Score) e notamos que há algumas oportunidades críticas de melhoria na velocidade de resposta e otimização móvel do seu canal digital que podem estar impactando o seu volume diário de orçamentos.

Você tem 5 minutos amanhã às 14h para darmos uma olhada rápida nesse diagnóstico técnico sem qualquer compromisso?

Um abraço!`;
    } else if (activeAction === 'email') {
      resultText = `Assunto: Diagnóstico Técnico de Presença Digital - ${name} (${city})

Prezado(a) ${resp}, espero que este e-mail o(a) encontre bem.

Meu nome é consultor de inteligência de dados na Atlas Intelligence. Recentemente, realizamos uma auditoria técnica de conformidade nos canais digitais de marcas atuantes no nicho de ${segment} na região de ${city}.

A ${name} foi incluída neste lote analítico, registrando uma pontuação global de ${score}/100 em nosso índice proprietário Atlas Score. Identificamos indicadores importantes relacionados a:

1. Otimização Móvel (Tempo de carregamento em redes celulares locais).
2. Semântica de Indexação SEO (Marcações Schema.org e cabeçalhos técnicos).
3. Cobertura de autoridade competitiva frente aos principais concorrentes da região.

Anexamos a este e-mail uma versão simplificada do diagnóstico digital corporativo. Gostaríamos de agendar uma breve chamada de 10 minutos para compartilhar as recomendações da nossa IA de prospecção comercial para otimizar estes canais e ampliar a sua atração local.

Qual o melhor horário de contato para você nesta semana?

Atenciosamente,

Equipe Atlas Intelligence`;
    } else if (activeAction === 'proposta') {
      resultText = `PROPOSTA COMERCIAL: IMPLANTAÇÃO DE INFRAESTRUTURA DIGITAL PREMIUM
Cliente: ${name}
Responsável: ${resp}
Data: ${new Date().toLocaleDateString('pt-BR')}

1. ESCOPO DO PROJETO
Desenvolvimento e publicação de Plataforma Web Corporativa de Alta Performance adaptada especificamente ao segmento de ${segment}, incluindo:
- Landing Page premium com design exclusivo (não-template) focado no público de alto padrão.
- Engenharia Completa de SEO Técnico com foco geolocalizado para ${city}.
- Integração de Simulador Inteligente de Orçamentos de Autoatendimento 24h.
- Otimização mobile extrema de velocidade (Performance > 90 no Google PageSpeed).

2. CRONOGRAMA & ENTREGA
- Etapa 01: Planejamento estratégico de copy e design no Figma (10 dias).
- Etapa 02: Codificação ágil do site, SEO e integrações (15 dias).
- Etapa 03: Auditoria, testes de estresse de velocidade e aprovação (5 dias).
Prazo Total: 30 dias úteis.

3. VALORES E INVESTIMENTO
- Licença única de implantação: R$ 4.800,00 (parcelados em até 4x).
- Suporte, hospedagem em nuvem de alta performance e atualizações mensais de SEO: R$ 197,00/mês.

Esta proposta possui validade de 10 dias úteis.`;
    } else if (activeAction === 'objecao') {
      resultText = `ANÁLISE DE OBJEÇÃO COMERCIAL - ATLAS COPILOT

[Objeção do Cliente]: "${objectionText}"

[Análise da IA]: O cliente está focando no valor imediato de desembolso financeiro sem perceber a diferença de entrega técnica e autoridade. O concorrente provavelmente entrega um modelo pré-fabricado lento que não ranqueia no Google e frustra o visitante de alto padrão.

[Sugestão de Resposta Persuasiva para WhatsApp / Áudio]:

"${resp}, eu entendo perfeitamente a sua ponderação sobre o valor. Realmente existem profissionais e criadores de páginas simples no mercado que cobram menos. 

A grande diferença é que eles entregam um site estático comum feito sobre templates prontos e pesados. Esse tipo de página costuma demorar mais de 6 segundos para abrir nos celulares dos clientes em ${city}, além de não possuir o SEO técnico configurado. Na prática, um site lento afasta até 70% das pessoas interessadas antes mesmo de carregarem o seu portfólio.

Nossa entrega na Atlas Intelligence é focada em Engenharia Comercial. Desenvolvemos uma plataforma premium sob medida que carrega em menos de 2 segundos, ranqueia nos primeiros lugares do Google da sua região e inclui um assistente virtual de triagem inteligente. 

Não é apenas uma despesa institucional; é uma máquina automática de captação que trabalha 24h para você fechar orçamentos de alto ticket. O que custa mais caro: investir em uma estrutura técnica que traz retorno ou ter uma página barata invisível no Google? 

Vamos fazer um teste de velocidade com o site do seu principal concorrente amanhã?"`;
    } else if (activeAction === 'contrato') {
      resultText = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TECNOLOGIA E SEO

CONTRATANTE: ${name}, localizada em ${city}.
CONTRATADO: Atlas Intelligence Soluções Digitais Ltda.

CLÁUSULA PRIMEIRA - OBJETO
O presente instrumento tem como objeto a prestação de serviços de engenharia web, desenvolvimento de portal institucional corporativo personalizado, otimização técnica de motores de busca (SEO) e automação comercial de leads para o segmento de ${segment}.

CLÁUSULA SEGUNDA - OBRIGAÇÕES DO CONTRATADO
1. Codificar e publicar o site conforme especificações aprovadas na proposta técnica.
2. Garantir desempenho mínimo de velocidade mobile superior a 80 pontos nos testes oficiais.
3. Entregar os acessos administrativos de forma irrevogável ao término dos pagamentos.

CLÁUSULA TERCEIRA - PREÇO E FORMA DE PAGAMENTO
Pela prestação dos serviços descritos, a CONTRATANTE pagará à CONTRATADA o valor total de R$ 4.800,00 (quatro mil e oitocentos reais), divididos em parcelas mensais pré-acordadas, vencendo-se a primeira parcela na assinatura digital deste instrumento.

Para a devida conformidade das partes, segue o termo assinado eletronicamente.`;
    }

    // Streaming typing simulation
    let currentText = '';
    const words = resultText.split(' ');
    for (let i = 0; i < words.length; i++) {
      currentText += words[i] + ' ';
      setCopilotOutput(currentText);
      if (i % 6 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
    }

    setGenerating(false);
  };

  useEffect(() => {
    if (selectedLead) {
      handleGenerate();
    }
  }, [selectedLead, activeAction]);

  const handleCopy = () => {
    navigator.clipboard.writeText(copilotOutput);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-8 text-left">
      
      {/* Module Header */}
      <div className="flex items-center gap-3 border-b border-gray-900 pb-6">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <span className="text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider block mb-0.5">
            Assistente Comercial IA
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            Atlas Copilot Coprocessor
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Nossa inteligência comercial integrada analisa os pontos de atrito dos leads do seu CRM para sugerir respostas personalizadas, e-mails de conversão e propostas de elite.
          </p>
        </div>
      </div>

      {/* Grid: Selected Lead Selector & Action Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Select Lead & Select Action */}
        <div className="lg:col-span-4 space-y-5">
          {/* Lead select box */}
          <div className="bg-[#121214]/30 border border-gray-900 rounded-2xl p-5 space-y-4">
            <h4 className="text-white text-xs font-bold font-mono uppercase tracking-wider border-b border-gray-900/60 pb-2">
              Selecione o Lead Alvo
            </h4>
            
            <div className="space-y-2">
              {leads.length === 0 ? (
                <p className="text-xs text-gray-500 font-mono">Nenhum lead cadastrado no CRM ainda.</p>
              ) : (
                <select
                  value={selectedLead ? selectedLead.id : ''}
                  onChange={(e) => {
                    const l = leads.find(lead => lead.id === e.target.value);
                    if (l) onSelectLead(l);
                  }}
                  className="w-full bg-gray-950 text-white border border-gray-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#E2B755]"
                >
                  <option value="" disabled>-- Selecione uma empresa --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>{l.companyName} ({l.segment})</option>
                  ))}
                </select>
              )}
            </div>

            {selectedLead && (
              <div className="bg-gray-950/40 border border-gray-900 rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-white truncate">{selectedLead.companyName}</span>
                  <span className="text-emerald-400 font-mono">{selectedLead.atlasScore || 42}%</span>
                </div>
                <p className="text-[10px] text-gray-500 font-mono">Contato: {selectedLead.responsible}</p>
                <p className="text-[10px] text-gray-400 line-clamp-2">{selectedLead.notes}</p>
                <div className="pt-2 border-t border-gray-900 flex justify-between text-[10px] font-mono text-gray-400">
                  <span>Fechar: <strong>{selectedLead.closeProbability}%</strong></span>
                  <span>Status: <strong>{selectedLead.status}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Action selection column */}
          <div className="bg-[#121214]/30 border border-gray-900 rounded-2xl p-5 space-y-3">
            <h4 className="text-white text-xs font-bold font-mono uppercase tracking-wider border-b border-gray-900/60 pb-2">
              Ações Comerciais da IA
            </h4>

            <div className="space-y-1.5">
              {COPILOT_ACTIONS.map((action) => {
                const Icon = action.icon;
                const isSelected = activeAction === action.id;
                return (
                  <button
                    key={action.id}
                    onClick={() => setActiveAction(action.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected 
                        ? 'bg-white text-black border-white shadow-lg' 
                        : 'bg-gray-950/40 text-gray-400 border-gray-900/60 hover:border-gray-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-black' : 'text-emerald-400'}`} />
                    <div className="space-y-0.5">
                      <span className={`text-xs font-bold block ${isSelected ? 'text-black' : 'text-white'}`}>
                        {action.label}
                      </span>
                      <span className="text-[9px] text-gray-500 line-clamp-1 leading-normal font-sans">
                        {action.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Generation workspace */}
        <div className="lg:col-span-8 bg-[#121214]/30 border border-gray-900 rounded-2xl p-6 flex flex-col justify-between space-y-6 min-h-[500px]">
          
          <div className="space-y-4 flex-1 flex flex-col">
            {/* Header of generation */}
            <div className="flex items-center justify-between border-b border-gray-900 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E2B755]" />
                <span className="text-white text-xs font-bold font-mono uppercase tracking-wider">
                  Área de Rascunho do Copilot
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedLead && (
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="p-1.5 rounded-lg bg-gray-950 hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-all flex items-center gap-1 text-[10px] font-mono"
                    title="Regerar sugestão"
                  >
                    <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
                    Regerar
                  </button>
                )}

                {copilotOutput && (
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-900/20 text-emerald-400 hover:text-white transition-all flex items-center gap-1 text-[10px] font-mono font-bold"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copiar Rascunho
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Custom inputs for objection helper */}
            {activeAction === 'objecao' && (
              <div className="space-y-2 bg-gray-950/40 border border-gray-900 rounded-xl p-4">
                <label className="block text-[10px] uppercase font-mono font-bold text-gray-500">Escreva a Objeção do Cliente:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={objectionText}
                    onChange={(e) => setObjectionText(e.target.value)}
                    placeholder="Ex: Está caro, vou ver com meu sócio, etc."
                    className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-4 py-2 bg-white hover:bg-gray-200 text-black font-semibold text-xs rounded-lg transition-all"
                  >
                    Analisar Objeção
                  </button>
                </div>
              </div>
            )}

            {/* Simulated Stream container */}
            <div className="flex-1 min-h-[300px] bg-gray-950/40 border border-gray-900 rounded-xl p-5 font-mono text-xs text-gray-300 leading-relaxed overflow-y-auto whitespace-pre-wrap select-text relative">
              {generating && !copilotOutput && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-gray-950/60 backdrop-blur-[1px] rounded-xl">
                  <Bot className="w-8 h-8 animate-bounce text-emerald-400" />
                  <span className="text-gray-400 text-xs font-mono">Processando contexto comercial...</span>
                </div>
              )}

              {!selectedLead ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 text-center p-6">
                  <Bot className="w-8 h-8 text-gray-700" />
                  <span className="text-gray-500 text-xs font-mono">Aguardando seleção de lead...</span>
                  <p className="text-[10px] text-gray-600 max-w-xs font-sans">
                    Selecione uma empresa na barra lateral para carregar a IA comercial e gerar sugestões contextualizadas de fechamento.
                  </p>
                </div>
              ) : (
                copilotOutput || <span className="text-gray-600">Escrevendo rascunho com IA comercial...</span>
              )}
            </div>

          </div>

          {/* Guide constraints footer */}
          <div className="bg-gray-950/60 border border-gray-900/40 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-white text-[11px] font-bold font-mono uppercase tracking-wide">Filtro de Aprovação Ativo</h5>
              <p className="text-[10px] text-gray-500 leading-relaxed font-sans font-light">
                O Atlas Copilot opera de forma estritamente recomendatória. <strong>Nenhuma mensagem será disparada de forma automatizada</strong>. 
                Sempre revise, edite e valide o rascunho sugerido no painel acima antes de copiar e disparar via canais comerciais integrados.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
