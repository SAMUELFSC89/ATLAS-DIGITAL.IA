import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ArrowRight, MessageCircle, AlertCircle, Building2, CheckCircle2, Star } from 'lucide-react';

interface InteractiveContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledSubject?: string;
}

export default function InteractiveContactModal({ isOpen, onClose, prefilledSubject }: InteractiveContactModalProps) {
  const [step, setStep] = useState<number>(1);
  const [segment, setSegment] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError('');
      setSuccess(false);
      if (prefilledSubject) {
        setSegment(prefilledSubject);
      } else {
        setSegment('');
      }
    }
  }, [isOpen, prefilledSubject]);

  const handleNextStep = () => {
    if (step === 1 && !segment) {
      setError('Por favor, selecione seu segmento principal.');
      return;
    }
    if (step === 2 && !companyName.trim()) {
      setError('Por favor, preencha o nome da sua empresa.');
      return;
    }
    setError('');
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setError('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Por favor, preencha seu WhatsApp de contato.');
      return;
    }

    setSubmitting(true);
    setError('');

    // Simulate submission and save to localStorage
    setTimeout(() => {
      const newLead = {
        id: 'lead_' + Date.now(),
        segment,
        companyName,
        phone,
        website: website || 'Não possui',
        date: new Date().toISOString()
      };

      try {
        const existingLeads = JSON.parse(localStorage.getItem('atlas_digital_leads') || '[]');
        existingLeads.push(newLead);
        localStorage.setItem('atlas_digital_leads', JSON.stringify(existingLeads));
      } catch (err) {
        console.error('Failed to save lead', err);
      }

      setSubmitting(false);
      setSuccess(true);
    }, 1200);
  };

  // WhatsApp redirection url
  const getWhatsAppURL = () => {
    const formattedText = `Olá Atlas Digital! Acabei de solicitar minha Análise Gratuita de Site.%0A%0A` +
      `*Empresa:* ${companyName}%0A` +
      `*Segmento:* ${segment}%0A` +
      `*WhatsApp:* ${phone}%0A` +
      `*Site atual:* ${website || 'Não possui'}%0A%0A` +
      `Gostaria de agendar o diagnóstico gratuito para iniciarmos o projeto!`;
    
    return `https://wa.me/5551994578544?text=${formattedText}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#090d16]/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-lg bg-[#111827] border border-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden z-10"
          >
            {/* Background Accent Gradients */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#F5B301] opacity-[0.03] rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600 opacity-[0.03] rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-[9px] text-[#F5B301] uppercase tracking-widest font-mono font-bold">Diagnóstico Exclusivo</span>
                <h3 className="text-lg font-bold text-white font-display">Solicitar Análise Gratuita</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-colors"
                id="close-modal-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success State */}
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-4"
              >
                <div className="w-16 h-16 bg-green-950 text-green-400 rounded-full flex items-center justify-center mx-auto border border-green-800 shadow-lg">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white font-display">Análise Solicitada!</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Excelente escolha. Para acelerar o agendamento da sua conversa e receber seu protótipo inicial com prioridade, clique no botão do WhatsApp abaixo.
                  </p>
                </div>

                <div className="bg-[#0B0F19] border border-gray-800 rounded-xl p-3 text-left max-w-sm mx-auto">
                  <div className="flex items-center gap-1.5 text-[#F5B301] font-bold text-[10px] uppercase font-mono mb-1">
                    <Star className="w-3 h-3 text-[#F5B301] fill-[#F5B301]" />
                    Próximo Passo
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    Nossa equipe de especialistas da <strong>Atlas Digital</strong> irá analisar as palavras-chave do seu setor e criar um wireframe prévio. Clique para falar com o arquiteto de software.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2 max-w-sm mx-auto">
                  <a
                    href={getWhatsAppURL()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-lg shadow-green-950/30"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    Iniciar Conversa no WhatsApp
                  </a>
                  <button
                    onClick={onClose}
                    className="text-[11px] text-gray-500 hover:text-gray-400 transition-colors py-1"
                  >
                    Fechar Janela
                  </button>
                </div>
              </motion.div>
            ) : (
              // Form Steps
              <div>
                {/* Progress Indicators */}
                <div className="w-full h-1 bg-gray-950 rounded-full mb-6 overflow-hidden flex">
                  <div 
                    className="bg-[#F5B301] transition-all duration-300 h-full"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>

                {/* Step contents */}
                <div className="min-h-[160px]">
                  {error && (
                    <div className="mb-4 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    
                    {/* STEP 1: Segment */}
                    {step === 1 && (
                      <motion.div
                        key="modal-step-1"
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        className="space-y-3"
                      >
                        <label className="block text-xs font-semibold text-gray-300">
                          Qual o segmento principal da sua empresa?
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            'Marmoraria',
                            'Vidraçaria',
                            'Energia Solar',
                            'Esquadrias',
                            'Coberturas',
                            'Serralheria',
                            'Móveis Planejados'
                          ].map((seg) => (
                            <button
                              key={seg}
                              type="button"
                              onClick={() => {
                                setSegment(seg);
                                setError('');
                              }}
                              className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                                segment === seg
                                  ? 'border-[#F5B301] bg-[#f5b3010b] text-white'
                                  : 'border-gray-800 bg-[#0B0F19]/60 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                              }`}
                            >
                              {seg}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 2: Company details */}
                    {step === 2 && (
                      <motion.div
                        key="modal-step-2"
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        className="space-y-4"
                      >
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-gray-300">
                            Nome da sua empresa:
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Imperial Mármores e Granitos"
                            value={companyName}
                            onChange={(e) => {
                              setCompanyName(e.target.value);
                              setError('');
                            }}
                            className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-[#F5B301] transition-colors"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-gray-300">
                            Site atual (Se possuir - opcional):
                          </label>
                          <input
                            type="url"
                            placeholder="Ex: www.minhamarmoraria.com.br"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-[#F5B301] transition-colors"
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3: Phone & Submit */}
                    {step === 3 && (
                      <motion.div
                        key="modal-step-3"
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        className="space-y-4"
                      >
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-gray-300 flex items-center gap-1">
                            Seu WhatsApp de contato (com DDD):
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="Ex: (11) 99999-9999"
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              setError('');
                            }}
                            className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-[#F5B301] transition-colors"
                          />
                        </div>

                        <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800 text-[10px] text-gray-400 leading-relaxed flex items-start gap-2">
                          <Building2 className="w-4 h-4 text-[#F5B301] shrink-0" />
                          <span>
                            Sua privacidade está garantida. Seus dados serão usados exclusivamente por consultores da <strong>Atlas Digital</strong> para formular o seu diagnóstico técnico.
                          </span>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

                {/* Footer buttons */}
                <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-800">
                  <div>
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="text-xs text-gray-400 hover:text-white transition-colors py-2"
                      >
                        Voltar
                      </button>
                    )}
                  </div>
                  <div>
                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white text-xs font-semibold py-2.5 px-5 rounded-xl flex items-center gap-1 hover:scale-105 transition-all"
                      >
                        Avançar
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-[#F5B301] text-[#0B0F19] text-xs font-black py-2.5 px-6 rounded-xl flex items-center gap-1 hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg shadow-[#f5b3011e]"
                      >
                        {submitting ? 'Processando...' : 'Finalizar Solicitação'}
                        {!submitting && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
