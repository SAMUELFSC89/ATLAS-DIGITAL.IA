import { useState } from 'react';
import { Check, Info, Sparkles, HelpCircle, Zap, Shield, HelpCircle as HelpIcon } from 'lucide-react';

export default function PrecosPlanos() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const PLANS = [
    {
      id: 'free',
      name: 'Demonstração',
      priceMonthly: 0,
      priceYearly: 0,
      desc: 'Para testar o potencial técnico de diagnósticos de marcas locais.',
      features: [
        '3 auditorias digitais / mês',
        'Relatório simplificado na web',
        'Pipeline básico CRM (10 leads)',
        'Suporte básico via fórum'
      ],
      cta: 'Acessar Plano Gratuito',
      isPopular: false,
      color: 'border-gray-950/60 bg-gray-950/20'
    },
    {
      id: 'starter',
      name: 'Starter Pro',
      priceMonthly: 97,
      priceYearly: 77,
      desc: 'Ideal para freelancers ou consultores individuais iniciando em vendas.',
      features: [
        '15 auditorias digitais / mês',
        'Download ilimitado de PDFs',
        'Pipeline completo CRM (50 leads)',
        '1 Integração ativa (Gmail)',
        'Atlas Copilot Comercial (Básico)',
        'Suporte prioritário por e-mail'
      ],
      cta: 'Assinar Starter Pro',
      isPopular: false,
      color: 'border-gray-900/80 bg-gray-950/40'
    },
    {
      id: 'professional',
      name: 'Professional',
      priceMonthly: 197,
      priceYearly: 157,
      desc: 'O motor de crescimento perfeito para pequenas equipes de vendas.',
      features: [
        '50 auditorias digitais / mês',
        'Download ilimitado de PDFs',
        'Pipeline CRM (Leads ilimitados)',
        'Radar de Mercado (100 buscas/mês)',
        'Todas Integrações (Gmail + Calendar)',
        'Atlas Copilot (Análise de Objeções)',
        'Suporte por chat 24h'
      ],
      cta: 'Assinar Professional',
      isPopular: true,
      color: 'border-emerald-500/30 bg-emerald-500/[0.02] relative'
    },
    {
      id: 'agency',
      name: 'Agência Elite',
      priceMonthly: 397,
      priceYearly: 317,
      desc: 'Para agências estruturadas focadas em escala extrema de fechamentos.',
      features: [
        'Auditorias digitais ILIMITADAS',
        'Personalização de marca (White Label PDF)',
        'Pipeline CRM completo + Equipes',
        'Radar de Mercado (Buscas ilimitadas)',
        'WhatsApp Business Platform API oficial',
        'Fila de aprovação de chat com IA',
        'Atlas Copilot Avançado (Esboço de Contratos)',
        'Gerente de conta dedicado'
      ],
      cta: 'Contratar Agência Elite',
      isPopular: false,
      color: 'border-gray-900/80 bg-gray-950/40'
    }
  ];

  const handleSelectPlan = (planName: string) => {
    alert(`Obrigado pelo interesse no plano "${planName}"! Esta é uma demonstração do ambiente Sandbox. Em produção, este CTA abrirá o checkout criptografado do Stripe.`);
  };

  return (
    <div className="space-y-8 text-left">
      
      {/* Module Title */}
      <div className="border-b border-gray-900 pb-6 text-center max-w-2xl mx-auto space-y-2">
        <span className="text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-widest block mb-1">
          Planos e Licenças de Uso
        </span>
        <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
          Estrutura de Investimento Escalável
        </h2>
        <p className="text-xs text-gray-400">
          Escolha o nível de prospecção ideal para a sua estrutura comercial. Cancele ou altere sua assinatura a qualquer momento com garantia técnica de reembolso.
        </p>

        {/* Monthly/Yearly toggle selector */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <span className={`text-xs font-mono font-medium ${billingPeriod === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Mensal</span>
          
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            className="w-12 h-6 bg-gray-950 rounded-full border border-gray-800 p-0.5 transition-all relative flex items-center"
          >
            <div className={`w-4.5 h-4.5 bg-white rounded-full transition-all absolute ${billingPeriod === 'yearly' ? 'right-1' : 'left-1'}`} />
          </button>

          <span className={`text-xs font-mono font-medium flex items-center gap-1.5 ${billingPeriod === 'yearly' ? 'text-emerald-400' : 'text-gray-500'}`}>
            Anual <strong className="bg-emerald-500/10 border border-emerald-900/20 text-emerald-400 text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded font-bold">Salvar 20%</strong>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        {PLANS.map((plan) => {
          const price = billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceYearly;
          return (
            <div 
              key={plan.id}
              className={`border rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:scale-[1.01] transition-all duration-300 ${plan.color}`}
            >
              {plan.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-400 text-black text-[9px] font-mono font-bold uppercase tracking-widest px-3.5 py-1 rounded-full border border-emerald-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-black text-black" /> Recomendado
                </span>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-white text-base font-bold tracking-tight">{plan.name}</h4>
                  <p className="text-[10px] text-gray-500 leading-normal font-sans font-light min-h-[36px]">{plan.desc}</p>
                </div>

                {/* Price Label */}
                <div className="flex items-baseline gap-1.5 border-b border-gray-900 pb-4">
                  <span className="text-gray-500 font-mono text-xs">R$</span>
                  <span className="text-white text-3xl font-display font-black tracking-tight">{price}</span>
                  <span className="text-gray-500 font-mono text-[10px]">{billingPeriod === 'monthly' ? '/mês' : '/mês no plano anual'}</span>
                </div>

                {/* Features Checkbox list */}
                <ul className="space-y-2.5 pt-2 text-xs text-gray-300 font-sans font-light text-left">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSelectPlan(plan.name)}
                className={`w-full py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  plan.isPopular 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg font-bold' 
                    : 'bg-white hover:bg-gray-200 text-black'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature Comparisson details footer */}
      <div className="bg-gray-950/40 border border-gray-900 rounded-2xl p-6 space-y-4">
        <h5 className="text-white text-xs font-bold font-mono uppercase tracking-wider border-b border-gray-900/60 pb-2">
          Garantia de Satisfação Comercial
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-gray-400 font-sans font-light leading-relaxed">
          <div className="space-y-1.5">
            <h6 className="text-white font-bold font-mono text-[10px] uppercase tracking-wide flex items-center gap-1.5 text-emerald-400">
              <Zap className="w-3.5 h-3.5" /> Cancelamento Sem Taxas
            </h6>
            <p>Seus contratos são mensais ou anuais simples. Você pode cancelar sua assinatura com apenas um clique diretamente no painel de faturamento, sem telefonemas ou burocracias.</p>
          </div>

          <div className="space-y-1.5">
            <h6 className="text-white font-bold font-mono text-[10px] uppercase tracking-wide flex items-center gap-1.5 text-emerald-400">
              <Shield className="w-3.5 h-3.5" /> Segurança Stripe SSL
            </h6>
            <p>Todo o faturamento e processamento de pagamentos é efetuado de forma descentralizada através da infraestrutura de ponta da Stripe, assegurando conformidade PCI-DSS de nível bancário.</p>
          </div>

          <div className="space-y-1.5">
            <h6 className="text-white font-bold font-mono text-[10px] uppercase tracking-wide flex items-center gap-1.5 text-emerald-400">
              <HelpIcon className="w-3.5 h-3.5" /> Suporte Técnico Exclusivo
            </h6>
            <p>Clientes de agência contam com reuniões mensais com nossos arquitetos de software e especialistas de tráfego para validar propostas personalizadas e debugar velocidade de páginas.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
