import { useState } from 'react';
import { ChevronDown, HelpCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Quanto tempo leva para desenvolver meu site?',
    answer: 'O prazo médio para entrega é de até 72 horas após o recebimento de todas as informações necessárias (textos, imagens, logotipo e demais materiais). Projetos com funcionalidades mais complexas podem exigir um prazo maior, que será informado previamente durante o orçamento.'
  },
  {
    question: 'Preciso contratar hospedagem?',
    answer: 'Sim. Todo site precisa de uma hospedagem para permanecer disponível na internet. Caso o cliente ainda não possua uma hospedagem, nossa equipe pode auxiliar na escolha da melhor opção e realizar toda a configuração necessária.'
  },
  {
    question: 'Vocês registram o domínio?',
    answer: 'Sim. Podemos realizar todo o processo de registro e configuração do domínio da sua empresa, facilitando a implantação do projeto e garantindo que tudo fique funcionando corretamente.'
  },
  {
    question: 'Meu site aparecerá no Google?',
    answer: 'Sim. Todos os sites desenvolvidos pela Atlas Digital.ia seguem boas práticas de SEO (Search Engine Optimization), possuem estrutura otimizada para indexação e são enviados ao Google Search Console para facilitar sua indexação. Vale destacar que alcançar as primeiras posições depende de diversos fatores, como concorrência, conteúdo e estratégias contínuas de SEO.'
  },
  {
    question: 'Posso solicitar alterações após a entrega?',
    answer: 'Sim. Após a conclusão do projeto, oferecemos serviços de manutenção e atualização para clientes que desejam adicionar novas páginas, alterar informações, inserir novos serviços ou manter o site sempre atualizado.'
  },
  {
    question: 'Existe mensalidade?',
    answer: 'Não cobramos mensalidade pelo desenvolvimento do site. O investimento refere-se à criação do projeto. Custos recorrentes podem existir apenas para serviços contratados separadamente, como hospedagem, domínio e manutenção, caso o cliente deseja.'
  },
  {
    question: 'Como funciona o suporte?',
    answer: 'Nosso suporte é realizado através de e-mail. Todas as solicitações são respondidas em até 48 horas úteis. Para clientes com contrato de manutenção, os atendimentos seguem a prioridade estabelecida no plano contratado.'
  },
  {
    question: 'O site funciona no celular?',
    answer: 'Sim. Todos os nossos projetos são totalmente responsivos e adaptados para computadores, tablets e smartphones.'
  },
  {
    question: 'Posso utilizar meu e-mail profissional?',
    answer: 'Sim. Caso o cliente possua domínio próprio, podemos auxiliar na configuração de contas de e-mail profissionais.'
  },
  {
    question: 'Meu site será seguro?',
    answer: 'Sim. Todos os sites são entregues utilizando certificado SSL, conexão segura HTTPS e boas práticas de segurança para garantir maior proteção aos visitantes.'
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-[#0B0F19] border-t border-gray-900 relative overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#F5B301]/[0.015] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#9CA3AF]/[0.01] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] text-[#F5B301] uppercase tracking-widest font-mono font-bold">Tire Suas Dúvidas</span>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight">
            Perguntas <span className="text-[#F5B301]">Frequentes</span>
          </h2>
          <div className="w-16 h-1 bg-[#F5B301] mx-auto rounded-full mt-2" />
          <p className="text-xs md:text-sm text-gray-400">
            Reunimos as dúvidas mais comuns sobre nossos serviços para que você tenha total transparência antes de iniciar seu projeto.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx}
                className="bg-[#111827]/40 border border-gray-900 hover:border-gray-800/80 rounded-xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleItem(idx)}
                  className="w-full text-left p-5 md:p-6 flex justify-between items-center gap-4 group focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-[#F5B301]/80 shrink-0" />
                    <span className="text-xs md:text-sm font-bold text-gray-200 group-hover:text-white transition-colors">
                      {item.question}
                    </span>
                  </div>
                  <div className={`p-1 rounded-lg bg-gray-900 border border-gray-800 transition-transform duration-300 ${isOpen ? 'rotate-180 border-[#F5B301]/40' : ''}`}>
                    <ChevronDown className={`w-4 h-4 ${isOpen ? 'text-[#F5B301]' : 'text-gray-500'}`} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 md:px-6 md:pb-6 pt-0 text-xs md:text-[13px] text-gray-400 leading-relaxed border-t border-gray-900/60 font-sans">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Contact CTA banner under FAQ */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-gray-950 to-gray-900/60 border border-gray-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3 flex-col sm:flex-row">
            <div className="p-3 bg-[#F5B301]/10 rounded-xl text-[#F5B301] shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Ainda tem alguma dúvida específica?</h4>
              <p className="text-[11px] text-gray-500">Nossa equipe comercial está pronta para lhe atender sem compromisso.</p>
            </div>
          </div>
          <a
            href="https://wa.me/5551994578544?text=Ol%C3%A1!%20Li%20o%20FAQ%20mas%20tenho%20uma%20d%C3%BAvida%20espec%C3%ADfica."
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-[#F5B301] hover:bg-[#b48400] text-[#0B0F19] text-[10px] font-black uppercase tracking-wider rounded-xl transition-all hover:scale-105"
          >
            Falar pelo WhatsApp
          </a>
        </div>

      </div>
    </section>
  );
}
