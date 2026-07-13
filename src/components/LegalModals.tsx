import { X, ShieldCheck, Scale, Cookie, Ban, Users, Printer, FileText, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

export type LegalDocType = 'sobre' | 'privacidade' | 'termos' | 'cookies' | 'reembolso' | null;

interface LegalModalsProps {
  activeDoc: LegalDocType;
  onClose: () => void;
}

export default function LegalModals({ activeDoc, onClose }: LegalModalsProps) {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeDoc) return null;

  // Render correct document content
  const getDocContent = () => {
    switch (activeDoc) {
      case 'sobre':
        return {
          title: 'Sobre Nós',
          subtitle: 'Conheça a Atlas Digital (Atlas Web Studio)',
          icon: <Users className="w-5 h-5 text-[#F5B301]" />,
          text: `A Atlas Digital (também referida como Atlas Web Studio) é uma agência de tecnologia e engenharia de conversão digital de alto padrão. Somos especialistas em planejar, desenhar e programar sites, landing pages e ferramentas interativas voltadas especificamente para empresas da cadeia de construção civil e acabamentos, incluindo Marmorarias, Vidraçarias, Integradores de Energia Solar, Construtoras e Arquitetura.

Nossa Missão:
Nossa missão é impulsionar os resultados de vendas dos nossos clientes através de soluções digitais premium que combinam design sofisticado, excelente experiência de usuário e programação impecável (focada em velocidade, SEO e indexação rápida no Google).

Nossos Diferenciais:
• Foco Absoluto em Conversão: Não criamos apenas páginas bonitas, criamos funis de vendas interativos estruturados para capturar a atenção de potenciais clientes e direcioná-los para pedidos de orçamento via WhatsApp e formulários.
• Velocidade Extrema: Nossos projetos são otimizados para carregar em menos de 1.5 segundos, reduzindo drasticamente a taxa de rejeição e aumentando o retorno sobre seus anúncios de tráfego pago (Google Ads, Meta Ads).
• Tecnologia Própria de Estimativa: Criamos simuladores de escopo exclusivos que ajudam a engajar o visitante antes mesmo de ele falar com seu vendedor.

Transparência, ética, velocidade e obsessão pela qualidade são as marcas registradas de cada projeto que desenvolvemos. Atendemos empresas em todo o território nacional através de processos 100% remotos e otimizados.`,
          sections: [
            {
              title: 'Nossa Engenharia de Performance',
              content: 'Utilizamos tecnologias modernas e metodologias de desenvolvimento consolidadas no mercado global. Nossos códigos são limpos, sem excessos de plugins ou scripts pesados, o que garante nota máxima nos principais validadores de velocidade (como o Google Lighthouse) e excelente adaptabilidade para todos os tipos de celulares, tablets e computadores.'
            },
            {
              title: 'Foco no Segmento de Construção',
              content: 'Acreditamos que para criar um site que vende para marmorarias ou empresas de energia solar, é necessário entender as dores, processos comerciais, prazos de entrega e o perfil do público-alvo desses setores. Essa expertise acumulada nos permite estruturar argumentos de vendas, seções de portfólio e simuladores de orçamento extremamente assertivos.'
            }
          ]
        };

      case 'privacidade':
        return {
          title: 'Política de Privacidade',
          subtitle: 'Conformidade integral com a LGPD (Lei nº 13.709/2018)',
          icon: <ShieldCheck className="w-5 h-5 text-[#F5B301]" />,
          text: `A Atlas Digital, em cumprimento com a Lei Geral de Proteção de Dados Pessoais (LGPD), assume o compromisso inabalável de proteger a privacidade, a segurança e a integridade de todas as informações pessoais coletadas de nossos usuários. Esta Política de Privacidade descreve de forma clara e transparente como tratamos, armazenamos e compartilhamos os seus dados pessoais obtidos durante sua visita ao nosso site ou através das nossas ferramentas interativas.`,
          sections: [
            {
              title: '1. Quais Dados Pessoais Coletamos?',
              content: 'Coletamos informações fornecidas voluntariamente por você ao interagir com nosso site, preencher formulários de simulação, solicitar análises gratuitas ou entrar em contato direto. Isso inclui: Nome completo, Endereço de e-mail, Telefone/WhatsApp de contato, Razão Social ou Nome Fantasia da empresa, Segmento de atuação de sua empresa, Detalhes informados no simulador de escopo e Dados de navegação anônimos (endereço IP, cookies de sessão, navegador).'
            },
            {
              title: '2. Como e para que Utilizamos seus Dados?',
              content: 'Todos os dados pessoais tratados pela Atlas Digital são utilizados estritamente sob bases legais legítimas e para finalidades específicas: (a) Elaborar propostas comerciais detalhadas com base nas simulações efetuadas; (b) Entrar em contato via WhatsApp ou e-mail para esclarecer dúvidas e apresentar diagnósticos de sites; (c) Personalizar as demonstrações de sistemas de acordo com seu segmento; (d) Cumprir obrigações legais, regulatórias ou ordens judiciais pertinentes.'
            },
            {
              title: '3. Compartilhamento e Transferência de Dados',
              content: 'Nós não comercializamos, alugamos ou repassamos seus dados pessoais a terceiros sob nenhuma hipótese. O compartilhamento ocorre única e exclusivamente com provedores de infraestrutura técnica de confiança (como servidores de hospedagem segura de banco de dados e sistemas de disparo de e-mails transacionais), que seguem rígidos padrões de confidencialidade técnica compatíveis com a nossa política.'
            },
            {
              title: '4. Direitos do Titular dos Dados',
              content: 'Em total conformidade com o artigo 18 da LGPD, o usuário (titular dos dados) poderá, a qualquer momento e mediante solicitação por escrito via contato@atlasdigital.ia.br, exercer seus direitos de: confirmar a existência de tratamento de dados; solicitar acesso aos dados mantidos; requerer a correção de dados incompletos ou desatualizados; solicitar a exclusão definitiva de seus dados de nossa base de marketing/comercial.'
            },
            {
              title: '5. Segurança da Informação',
              content: 'Adotamos medidas técnicas e administrativas altamente robustas de segurança cibernética, como o uso de conexões seguras sob protocolo criptografado HTTPS/SSL, proteção de firewalls de rede e controle rigoroso de acesso interno às informações tratadas, visando impedir acessos não autorizados, perdas ou vazamentos acidentais.'
            }
          ]
        };

      case 'termos':
        return {
          title: 'Termos de Uso',
          subtitle: 'Condições gerais de navegação e uso das ferramentas',
          icon: <Scale className="w-5 h-5 text-[#F5B301]" />,
          text: `Estes Termos de Uso regem o acesso e a utilização dos serviços, simuladores de escopo e conteúdos disponibilizados pela Atlas Digital por meio deste site. Ao navegar por nossa plataforma ou utilizar nosso simulador interativo, o visitante declara expressamente estar ciente e concordar integralmente com as condições estabelecidas neste documento legal.`,
          sections: [
            {
              title: '1. Propriedade Intelectual e Autoral',
              content: 'Todos os direitos relativos a este site, incluindo design das interfaces, simulador interativo de orçamentos, códigos-fonte de demonstração, layouts de mockups, textos, imagens explicativas e marcas associadas, pertencem exclusivamente à Atlas Digital. É estritamente proibida a reprodução, cópia, imitação, engenharia reversa ou distribuição não autorizada deste material para fins comerciais.'
            },
            {
              title: '2. Uso do Simulador de Escopo Interativo',
              content: 'O simulador interativo é uma ferramenta exclusiva criada para fornecer estimativas preliminares e didáticas de escopos de projetos para potenciais clientes. Os resultados gerados constituem estimativas de referência e não representam uma proposta comercial final juridicamente vinculativa. Todas as simulações devem ser validadas e formalizadas por escrito em orçamento oficial por nossa equipe técnica e comercial.'
            },
            {
              title: '3. Limitações de Responsabilidade',
              content: 'Envidamos todos os esforços para manter este site acessível e seguro. No entanto, não nos responsabilizamos por instabilidades temporárias de conexão geradas por operadoras de internet, ataques cibernéticos externos de força maior que ultrapassem os padrões convencionais de mercado, ou pela utilização indevida das informações obtidas em nossas simulações por terceiros sem a respectiva assessoria comercial oficial.'
            },
            {
              title: '4. Cadastro e Integridade de Informações',
              content: 'O usuário compromete-se a fornecer informações verídicas e atualizadas ao utilizar nossos formulários ou simulações. A Atlas Digital reserva-se o direito de recusar o atendimento ou desconsiderar simulações com dados manifestamente falsos, abusivos ou ofensivos.'
            }
          ]
        };

      case 'cookies':
        return {
          title: 'Política de Cookies',
          subtitle: 'Transparência sobre rastreamento e funcionamento técnico',
          icon: <Cookie className="w-5 h-5 text-[#F5B301]" />,
          text: `Utilizamos cookies para otimizar o funcionamento técnico de nossas ferramentas, garantir a integridade das simulações de escopo e compreender o comportamento de navegação para aprimorar continuamente a experiência do usuário. Explicamos abaixo como essas tecnologias funcionam e como você pode gerenciá-las de acordo com sua conveniência.`,
          sections: [
            {
              title: '1. O que são Cookies?',
              content: 'Cookies são pequenos arquivos de texto enviados e armazenados no seu navegador pelo site que você visita. Eles ajudam a registrar de forma segura pequenos blocos de informações sobre sua visita, permitindo que a plataforma se lembre das escolhas que você fez no simulador de escopo ou das seções visitadas.'
            },
            {
              title: '2. Categorias de Cookies Utilizados',
              content: 'Utilizamos três categorias principais de cookies: (a) Cookies Essenciais: estritamente necessários para permitir o funcionamento técnico de componentes como modais, envio seguro de formulários e integridade de simulações; (b) Cookies de Preferência: que lembram o segmento selecionado na demonstração interativa; (c) Cookies de Análise: que geram relatórios estatísticos anônimos de tráfego (como páginas mais acessadas) sem identificar individualmente o usuário.'
            },
            {
              title: '3. Como Gerenciar ou Desativar Cookies?',
              content: 'O consentimento para o uso de cookies pode ser revogado ou configurado a qualquer momento. A maioria dos navegadores de internet modernos permite que você apague os cookies já existentes, bloqueie a instalação de novos cookies ou configure avisos prévios. Lembre-se que desativar os cookies essenciais poderá afetar negativamente o funcionamento de recursos do site, incluindo o Simulador de Escopo.'
            }
          ]
        };

      case 'reembolso':
        return {
          title: 'Cancelamento e Reembolso',
          subtitle: 'Diretrizes comerciais e regras para início de serviços',
          icon: <Ban className="w-5 h-5 text-[#F5B301]" />,
          text: `Esta Política de Cancelamento e Reembolso visa estabelecer regras comerciais justas, transparentes e previamente acordadas sobre a contratação de nossos serviços de engenharia e desenvolvimento de software. Em virtude da natureza altamente personalizada, exclusiva e técnica dos serviços prestados pela Atlas Digital, aplicam-se as seguintes condições comerciais:`,
          sections: [
            {
              title: '1. Início de Desenvolvimento e Execução de Serviço',
              content: 'O início efetivo do desenvolvimento do projeto (consubstanciado pela realização de reuniões de briefing de design, criação do layout inicial, estruturação do código ou registro de domínio) caracteriza formalmente o início da prestação do serviço contratado. Por tratar-se de serviço sob medida (custom-built), recursos dedicados de engenharia, arquitetura de software e web design são alocados integralmente ao projeto desde o primeiro dia útil.'
            },
            {
              title: '2. Cancelamentos Antes do Início do Desenvolvimento',
              content: 'Cancelamentos solicitados antes do envio de dados de briefing, reuniões de alinhamento técnico ou qualquer início de atividade técnica por parte da nossa equipe comercial/técnica poderão ser analisados individualmente. Havendo viabilidade e ausência de custos preparatórios despendidos pela agência (como compra de servidores ou licenças exclusivas), o reembolso integral ou parcial dos valores poderá ser autorizado pela diretoria mediante termo de rescisão amigável.'
            },
            {
              title: '3. Serviços Personalizados e Não Passíveis de Reembolso',
              content: 'Serviços personalizados de desenvolvimento de sites, landing pages e ferramentas interativas customizadas não são passíveis de devolução de valores ou reembolso após o início comprovado da execução do serviço. A irrevogabilidade justifica-se pelo fato de que o investimento financeiro é integralmente convertido em horas técnicas de trabalho especializado de design e programação, serviços estes que não podem ser restituídos ou reaproveitados em outros projetos.'
            },
            {
              title: '4. Alterações de Escopo e Aditivos Contratuais',
              content: 'O orçamento acordado no início baseia-se estritamente nas especificações e recursos definidos no simulador ou escopo inicial. Qualquer alteração, inclusão de novas páginas, desenvolvimento de recursos adicionais não previstos ou modificação profunda de layout solicitada pelo cliente no decorrer do projeto constituirá alteração de escopo, ensejando a emissão de um novo orçamento comercial complementar e a readequação dos prazos de entrega.'
            },
            {
              title: '5. Independência dos Serviços de Suporte e Manutenção',
              content: 'A contratação de serviços de manutenção técnica, suporte mensal prioritário, atualizações de conteúdo periódicas e monitoramento de segurança é opcional, contratada em instrumento contratual separado do desenvolvimento inicial do site. A rescisão de contratos de manutenção técnica segue as diretrizes próprias descritas nas respectivas cláusulas desse contrato, não interferindo na propriedade intelectual ou no funcionamento estático do site já entregue e pago.'
            }
          ]
        };

      default:
        return { title: '', subtitle: '', icon: null, text: '', sections: [] };
    }
  };

  const doc = getDocContent();

  const getFullTextForClipboard = () => {
    let fullText = `${doc.title}\n${doc.subtitle}\n\n${doc.text}\n\n`;
    doc.sections.forEach(sec => {
      fullText += `${sec.title}\n${sec.content}\n\n`;
    });
    return fullText;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto" id="legal-modal-container">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal content viewport wrapper */}
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="w-full max-w-3xl bg-[#090d16] border border-gray-900 rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh]"
          >
            {/* Gradient accent top-border */}
            <div className="h-1 w-full bg-gradient-to-r from-[#F5B301] via-slate-500 to-gray-700" />

            {/* Modal Header */}
            <div className="p-6 border-b border-gray-900 flex items-center justify-between gap-4 shrink-0 bg-[#0c121e]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gray-950/80 border border-gray-800 rounded-xl">
                  {doc.icon}
                </div>
                <div>
                  <h3 className="text-white font-display font-black text-sm sm:text-base uppercase tracking-tight flex items-center gap-2">
                    {doc.title}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-mono mt-0.5">{doc.subtitle}</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-white bg-gray-950 border border-gray-900 hover:border-gray-800 rounded-lg transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-gray-300 text-xs sm:text-[13px] leading-relaxed custom-scrollbar font-sans">
              <p className="whitespace-pre-line text-gray-400 font-medium">
                {doc.text}
              </p>

              <div className="space-y-6 pt-2">
                {doc.sections.map((sec, i) => (
                  <div key={i} className="space-y-2 p-5 rounded-xl bg-gray-950/40 border border-gray-950">
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F5B301]" />
                      {sec.title}
                    </h4>
                    <p className="text-gray-400 font-sans leading-relaxed text-xs">
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Legal Note footer */}
              <div className="pt-6 border-t border-gray-900 text-[10px] text-gray-600 space-y-1">
                <p>Atlas Digital - CNPJ: 66.204.635/0001-19 | Porto Alegre - RS, Brasil</p>
                <p>Documento atualizado em conformidade com a LGPD (Lei Geral de Proteção de Dados) em {new Date().toLocaleDateString('pt-BR')}.</p>
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-4 bg-[#0B0F19] border-t border-gray-900 flex items-center justify-between gap-3 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(getFullTextForClipboard())}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-gray-950 border border-gray-900 hover:border-gray-800 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      Copiar Texto
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrint}
                  className="hidden sm:flex px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-gray-950 border border-gray-900 hover:border-gray-800 rounded-lg transition-colors items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir
                </button>
              </div>

              <button
                onClick={onClose}
                className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-[#0B0F19] bg-[#F5B301] hover:bg-[#b48400] rounded-lg transition-colors flex items-center gap-1.5"
              >
                Entendido
              </button>
            </div>

          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
