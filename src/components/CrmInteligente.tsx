import React, { useState } from 'react';
import { 
  Plus, Edit2, Calendar, MessageSquare, Award, Bot, Trash2, 
  PlusCircle, Mail, Phone, Globe, DollarSign, X, Check, ArrowRight, TrendingUp 
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';

interface CrmInteligenteProps {
  leads: Lead[];
  onUpdateLeadStatus: (leadId: string, newStatus: LeadStatus) => void;
  onUpdateLead: (updatedLead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onAddLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  onSelectLeadForCopilot: (lead: Lead) => void;
  onTriggerAuditForLead: (lead: Lead) => void;
}

export default function CrmInteligente({
  leads,
  onUpdateLeadStatus,
  onUpdateLead,
  onDeleteLead,
  onAddLead,
  onSelectLeadForCopilot,
  onTriggerAuditForLead
}: CrmInteligenteProps) {
  
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  
  // Fields for adding a new lead manually
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newResponsible, setNewResponsible] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('SP');
  const [newWebsite, setNewWebsite] = useState('');
  const [newSegment, setNewSegment] = useState('Marmoraria');
  const [newProbability, setNewProbability] = useState('50');
  const [newNotes, setNewNotes] = useState('');

  const PIPELINE_COLUMNS: { status: LeadStatus; label: string; colorClass: string; borderClass: string }[] = [
    { status: 'Novo', label: 'Novo Lead', colorClass: 'bg-blue-500/10 text-blue-400 border-blue-900/30', borderClass: 'border-l-blue-500' },
    { status: 'Contato', label: 'Contato', colorClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-900/30', borderClass: 'border-l-indigo-500' },
    { status: 'Resposta', label: 'Resposta', colorClass: 'bg-purple-500/10 text-purple-400 border-purple-900/30', borderClass: 'border-l-purple-500' },
    { status: 'Reunião', label: 'Reunião', colorClass: 'bg-amber-500/10 text-amber-400 border-amber-900/30', borderClass: 'border-l-amber-500' },
    { status: 'Proposta', label: 'Proposta', colorClass: 'bg-pink-500/10 text-pink-400 border-pink-900/30', borderClass: 'border-l-pink-500' },
    { status: 'Negociação', label: 'Negociação', colorClass: 'bg-rose-500/10 text-rose-400 border-rose-900/30', borderClass: 'border-l-rose-500' },
    { status: 'Fechado', label: 'Fechado', colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-900/30', borderClass: 'border-l-emerald-500' },
    { status: 'Pós-venda', label: 'Pós-venda', colorClass: 'bg-teal-500/10 text-teal-400 border-teal-900/30', borderClass: 'border-l-teal-500' }
  ];

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !newCity.trim()) {
      alert("Por favor, preencha o Nome da Empresa e a Cidade!");
      return;
    }

    onAddLead({
      companyName: newCompanyName.trim(),
      responsible: newResponsible.trim() || "Não informado",
      phone: newPhone.trim() || "(11) 99999-9999",
      whatsapp: newWhatsapp.trim() || newPhone.trim() || "(11) 99999-9999",
      email: newEmail.trim() || `contato@${newCompanyName.toLowerCase().replace(/\s+/g, '')}.com.br`,
      city: newCity.trim(),
      state: newState.trim().toUpperCase(),
      website: newWebsite.trim(),
      instagram: `instagram.com/${newCompanyName.toLowerCase().replace(/\s+/g, '')}`,
      facebook: '',
      linkedin: '',
      googleProfile: '',
      atlasScore: newWebsite.trim() ? 65 : null,
      status: 'Novo',
      lastContact: 'Não efetuado',
      nextAction: 'Enviar Primeira Auditoria',
      closeProbability: parseInt(newProbability) || 50,
      notes: newNotes.trim() || "Lead cadastrado manualmente no CRM.",
      segment: newSegment
    });

    // Reset inputs
    setNewCompanyName('');
    setNewResponsible('');
    setNewPhone('');
    setNewWhatsapp('');
    setNewEmail('');
    setNewCity('');
    setNewState('SP');
    setNewWebsite('');
    setNewNotes('');
    setIsAddLeadModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLeadForEdit) {
      onUpdateLead(selectedLeadForEdit);
      setSelectedLeadForEdit(null);
    }
  };

  return (
    <div className="space-y-8 text-left relative">
      
      {/* Title Header with action triggers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-900 pb-6">
        <div>
          <span className="text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider block mb-1">
            CRM SaaS Inteligente
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            Gestão Comercial e Leads
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Acompanhe todo o seu pipeline de vendas. Arraste ou atualize o status de cada lead, use a IA para propor respostas e execute auditorias.
          </p>
        </div>
        
        <button
          onClick={() => setIsAddLeadModalOpen(true)}
          className="px-4 py-2.5 bg-white hover:bg-gray-200 text-black text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all hover:scale-[1.02] shrink-0 self-start md:self-center"
        >
          <PlusCircle className="w-3.5 h-3.5 text-black" />
          Adicionar Lead Manual
        </button>
      </div>

      {/* Visual Pipeline Lanes (Kanban view scrollable horizontally) */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x select-none scrollbar-thin scrollbar-thumb-gray-900">
        {PIPELINE_COLUMNS.map((col) => {
          const colLeads = leads.filter(l => l.status === col.status);
          return (
            <div 
              key={col.status}
              className="w-72 shrink-0 bg-gray-950/20 border border-gray-900/60 rounded-2xl flex flex-col max-h-[640px] snap-center overflow-hidden"
            >
              {/* Lane Header */}
              <div className="p-4 border-b border-gray-900/80 bg-gray-950/30 flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${col.colorClass}`}>
                  {col.label}
                </span>
                <span className="text-xs text-gray-500 font-bold font-mono">
                  {colLeads.length}
                </span>
              </div>

              {/* Lane Cards list container */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1 bg-gray-950/[0.05]">
                {colLeads.length === 0 ? (
                  <div className="py-12 text-center text-[10px] text-gray-600 font-mono border border-dashed border-gray-900/40 rounded-xl">
                    Sem leads nesta etapa
                  </div>
                ) : (
                  colLeads.map((lead) => (
                    <div 
                      key={lead.id}
                      className={`bg-gray-950/40 border border-gray-900 hover:border-gray-800 rounded-xl p-4 space-y-3 shadow-md border-l-3 transition-all duration-200 ${col.borderClass}`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="space-y-0.5">
                          <h5 className="text-white text-xs font-bold leading-tight line-clamp-1">{lead.companyName}</h5>
                          <span className="text-[9px] text-gray-500 block font-mono">{lead.segment} &bull; {lead.city}</span>
                        </div>
                        
                        {/* Atlas Score badge */}
                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-mono font-bold ${
                            lead.atlasScore === null ? 'text-gray-600' : lead.atlasScore >= 70 ? 'text-emerald-400' : lead.atlasScore >= 50 ? 'text-amber-500' : 'text-red-400'
                          }`}>
                            {lead.atlasScore === null ? 'N/A' : `${lead.atlasScore}%`}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">
                        {lead.notes}
                      </p>

                      {/* Stats footer in card */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-900/60 text-[9px]">
                        <span className="text-gray-500 font-mono">
                          Fechamento: <strong className="text-gray-300">{lead.closeProbability}%</strong>
                        </span>
                        
                        <div className="flex items-center gap-1.5 text-gray-400">
                          {/* Copilot assistant shortcut */}
                          <button
                            onClick={() => onSelectLeadForCopilot(lead)}
                            className="p-1 rounded bg-gray-900 hover:bg-[#E2B755] hover:text-black transition-colors"
                            title="Atlas Copilot"
                          >
                            <Bot className="w-3.5 h-3.5" />
                          </button>

                          {/* Trigger score audit */}
                          <button
                            onClick={() => onTriggerAuditForLead(lead)}
                            className="p-1 rounded bg-gray-900 hover:bg-emerald-500 hover:text-black transition-colors"
                            title="Auditar Atlas Score"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Edit */}
                          <button
                            onClick={() => setSelectedLeadForEdit(lead)}
                            className="p-1 rounded bg-gray-900 hover:bg-white hover:text-black transition-colors"
                            title="Editar Lead"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Quick Status Shift selector (for slick mouse/touch moves) */}
                      <div className="pt-2">
                        <select
                          value={lead.status}
                          onChange={(e: any) => onUpdateLeadStatus(lead.id, e.target.value)}
                          className="w-full bg-gray-950 text-gray-400 border border-gray-900 text-[9px] rounded-lg px-2 py-1 font-mono focus:outline-none focus:border-gray-700"
                        >
                          <option value="Novo">Mover para: Novo</option>
                          <option value="Contato">Mover para: Contato</option>
                          <option value="Resposta">Mover para: Resposta</option>
                          <option value="Reunião">Mover para: Reunião</option>
                          <option value="Proposta">Mover para: Proposta</option>
                          <option value="Negociação">Mover para: Negociação</option>
                          <option value="Fechado">Mover para: Fechado (Vendido)</option>
                          <option value="Pós-venda">Mover para: Pós-venda</option>
                        </select>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Lead Overlay Modal */}
      {selectedLeadForEdit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 max-h-[90vh] overflow-y-auto relative text-left shadow-2xl">
            <button 
              onClick={() => setSelectedLeadForEdit(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider block">Ficha do Cliente</span>
              <h3 className="text-white text-lg font-bold font-display">Editar Informações Cadastrais</h3>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Nome da Empresa</label>
                  <input
                    type="text"
                    required
                    value={selectedLeadForEdit.companyName}
                    onChange={(e) => setSelectedLeadForEdit({...selectedLeadForEdit, companyName: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Responsável</label>
                  <input
                    type="text"
                    value={selectedLeadForEdit.responsible}
                    onChange={(e) => setSelectedLeadForEdit({...selectedLeadForEdit, responsible: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Telefone</label>
                  <input
                    type="text"
                    value={selectedLeadForEdit.phone}
                    onChange={(e) => setSelectedLeadForEdit({...selectedLeadForEdit, phone: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">WhatsApp</label>
                  <input
                    type="text"
                    value={selectedLeadForEdit.whatsapp}
                    onChange={(e) => setSelectedLeadForEdit({...selectedLeadForEdit, whatsapp: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Email</label>
                  <input
                    type="email"
                    value={selectedLeadForEdit.email}
                    onChange={(e) => setSelectedLeadForEdit({...selectedLeadForEdit, email: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Cidade</label>
                  <input
                    type="text"
                    value={selectedLeadForEdit.city}
                    onChange={(e) => setSelectedLeadForEdit({...selectedLeadForEdit, city: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Estado</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={selectedLeadForEdit.state}
                    onChange={(e) => setSelectedLeadForEdit({...selectedLeadForEdit, state: e.target.value.toUpperCase()})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755] font-mono"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Website</label>
                  <input
                    type="text"
                    value={selectedLeadForEdit.website}
                    onChange={(e) => setSelectedLeadForEdit({...selectedLeadForEdit, website: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Probabilidade de Fechamento (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={selectedLeadForEdit.closeProbability}
                    onChange={(e) => setSelectedLeadForEdit({...selectedLeadForEdit, closeProbability: parseInt(e.target.value) || 0})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Próxima Ação Planejada</label>
                  <input
                    type="text"
                    value={selectedLeadForEdit.nextAction}
                    onChange={(e) => setSelectedLeadForEdit({...selectedLeadForEdit, nextAction: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Observações Clínicas / Comerciais</label>
                <textarea
                  value={selectedLeadForEdit.notes}
                  onChange={(e) => setSelectedLeadForEdit({...selectedLeadForEdit, notes: e.target.value})}
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755] resize-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-900 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if(confirm("Deseja realmente remover este lead permanentemente do CRM?")) {
                      onDeleteLead(selectedLeadForEdit.id);
                      setSelectedLeadForEdit(null);
                    }
                  }}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir Lead
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLeadForEdit(null)}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-lg text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-gray-200"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lead Modal Overlay */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 max-h-[90vh] overflow-y-auto relative text-left shadow-2xl">
            <button 
              onClick={() => setIsAddLeadModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider block">Prospecção Manual</span>
              <h3 className="text-white text-lg font-bold font-display">Cadastrar Novo Lead</h3>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Nome da Empresa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Marmoraria Pedra Real"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Segmento / Nicho</label>
                  <select
                    value={newSegment}
                    onChange={(e) => setNewSegment(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  >
                    <option value="Marmoraria">Marmoraria</option>
                    <option value="Vidraçaria">Vidraçaria</option>
                    <option value="Energia Solar">Energia Solar</option>
                    <option value="Construtora">Construtora</option>
                    <option value="Arquitetura">Arquitetura</option>
                    <option value="Dentista">Dentista</option>
                    <option value="Clínica">Clínica</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Responsável</label>
                  <input
                    type="text"
                    placeholder="Ex: João da Silva"
                    value={newResponsible}
                    onChange={(e) => setNewResponsible(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Telefone / Fone</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">WhatsApp (Se diferente)</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Email Comercial</label>
                  <input
                    type="email"
                    placeholder="contato@empresa.com.br"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Cidade *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: São Paulo"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Estado (UF)</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="SP"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value.toUpperCase())}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755] font-mono"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Website Oficial (Se houver)</label>
                  <input
                    type="text"
                    placeholder="www.empresa.com.br"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Probabilidade de Fechamento (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newProbability}
                    onChange={(e) => setNewProbability(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Observações Iniciais</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Insira detalhes adicionais sobre a empresa..."
                  rows={2}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B755] resize-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-900 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLeadModalOpen(false)}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-white text-black font-semibold text-xs rounded-lg hover:bg-gray-200"
                >
                  Criar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
