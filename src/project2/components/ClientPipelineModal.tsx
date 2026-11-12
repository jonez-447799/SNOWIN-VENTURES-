import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Calendar, 
  Phone, 
  Mail, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  X, 
  Search, 
  Filter, 
  DollarSign, 
  UserCheck, 
  Sparkles,
  ArrowRight,
  Send,
  MessageSquare,
  FileCheck
} from 'lucide-react';
import { RulesConfig } from '../types/otif';

export type LeadStage = 'Identified' | 'Meeting Booked' | 'Demo / Trial Given' | 'Proposal Sent' | 'Closed Won' | 'Closed Lost';

export interface FactoryLead {
  id: string;
  factoryName: string;
  contactPerson: string;
  designation: string;
  phone: string;
  email: string;
  cluster: string; // e.g. Oragadam, Sriperumbudur, Chakan, Peenya, Manesar
  tier: 'Starter' | 'Pro Industrial' | 'Enterprise';
  dealValueINR: number;
  stage: LeadStage;
  nextFollowUpDate: string; // YYYY-MM-DD
  followUpNote: string;
  notes: string;
  lastContactedDate: string;
}

interface ClientPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: RulesConfig;
  onOpenProposalForLead?: (lead: FactoryLead) => void;
}

const STORAGE_KEY_PIPELINE = 'otif_sales_pipeline_leads_v1';

const INITIAL_LEADS: FactoryLead[] = [
  {
    id: 'lead-1',
    factoryName: 'Sundaram Fasteners & Stamping Unit',
    contactPerson: 'K. Rajasekaran',
    designation: 'Managing Director / Plant Owner',
    phone: '+91 98402 11234',
    email: 'rajasekaran@sundaramstampings.com',
    cluster: 'Oragadam Industrial Corridor',
    tier: 'Pro Industrial',
    dealValueINR: 9999,
    stage: 'Proposal Sent',
    nextFollowUpDate: '2026-10-12',
    followUpNote: 'Sent contract proposal; reviewing SLA terms with plant GM. Call at 11 AM.',
    notes: 'OEM tier-2 supplier to Hyundai & Royal Enfield. Suffering 3-5 penalty debit notes every month.',
    lastContactedDate: '2026-10-08',
  },
  {
    id: 'lead-2',
    factoryName: 'TVS Machined Castings Pvt Ltd',
    contactPerson: 'S. Ramanathan',
    designation: 'VP of Manufacturing Operations',
    phone: '+91 97909 88721',
    email: 'ramanathan@tvscastings.in',
    cluster: 'Sriperumbudur SIPCOT Sector II',
    tier: 'Enterprise',
    dealValueINR: 24999,
    stage: 'Demo / Trial Given',
    nextFollowUpDate: '2026-10-14',
    followUpNote: 'Loved the Gate Guard Tablet interface and 8D CAPA report. Schedule multi-plant pilot call.',
    notes: 'Operating 2 plants in Sriperumbudur and 1 in Hosur. Needs custom ERP gate-pass webhook.',
    lastContactedDate: '2026-10-09',
  },
  {
    id: 'lead-3',
    factoryName: 'Apex Precision Gears & Shafts',
    contactPerson: 'Dinesh Kumar',
    designation: 'Managing Partner',
    phone: '+91 94441 55678',
    email: 'dinesh@apexprecisiongears.com',
    cluster: 'Ambattur Industrial Estate',
    tier: 'Starter',
    dealValueINR: 3999,
    stage: 'Meeting Booked',
    nextFollowUpDate: '2026-10-15',
    followUpNote: 'In-person meeting at Ambattur plant office. Bring printed 1-page sample audit report.',
    notes: 'Small jobbing workshop supplying Ashok Leyland. Guard still records in blue paper register.',
    lastContactedDate: '2026-10-07',
  },
  {
    id: 'lead-4',
    factoryName: 'Kalyani Chassis Components',
    contactPerson: 'Prashant Kadam',
    designation: 'Chief Operating Officer',
    phone: '+91 98220 33411',
    email: 'pkadam@kalyanichassis.com',
    cluster: 'Chakan MIDC Phase 2, Pune',
    tier: 'Enterprise',
    dealValueINR: 24999,
    stage: 'Identified',
    nextFollowUpDate: '2026-10-16',
    followUpNote: 'Cold outreach via LinkedIn and referral from plant vendor. Send WhatsApp teaser summary.',
    notes: 'Facing Tata Motors supplier scorecard rating drop from Grade A to Grade C.',
    lastContactedDate: '2026-10-06',
  },
  {
    id: 'lead-5',
    factoryName: 'Oragadam Extrusions & Tubes Ltd',
    contactPerson: 'M. Balakrishnan',
    designation: 'Finance Director / Owner',
    phone: '+91 98410 77654',
    email: 'bala@oragadam-extrusions.co.in',
    cluster: 'Oragadam Industrial Corridor',
    tier: 'Pro Industrial',
    dealValueINR: 9999,
    stage: 'Closed Won',
    nextFollowUpDate: '2026-10-25',
    followUpNote: 'Contract signed! Conduct guard tablet onboarding session next Monday morning.',
    notes: 'Won on 3-day rapid rollout promise. Replaced manual register on day one.',
    lastContactedDate: '2026-10-10',
  }
];

export const ClientPipelineModal: React.FC<ClientPipelineModalProps> = ({
  isOpen,
  onClose,
  rules,
}) => {
  const [leads, setLeads] = useState<FactoryLead[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PIPELINE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_LEADS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<FactoryLead | null>(null);

  // Form states for new lead
  const [newFactory, setNewFactory] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCluster, setNewCluster] = useState('Oragadam Industrial Corridor');
  const [newTier, setNewTier] = useState<'Starter' | 'Pro Industrial' | 'Enterprise'>('Pro Industrial');
  const [newDealValue, setNewDealValue] = useState<number>(9999);
  const [newStage, setNewStage] = useState<LeadStage>('Identified');
  const [newFollowUpDate, setNewFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [newFollowUpNote, setNewFollowUpNote] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PIPELINE, JSON.stringify(leads));
    } catch {
      // ignore
    }
  }, [leads]);

  if (!isOpen) return null;

  // Filtered leads
  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.factoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.cluster.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.followUpNote.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === 'All' || l.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  // Calculate Pipeline Metrics
  const totalPipelineValue = leads
    .filter(l => l.stage !== 'Closed Lost')
    .reduce((sum, l) => sum + l.dealValueINR, 0);

  const closedWonValue = leads
    .filter(l => l.stage === 'Closed Won')
    .reduce((sum, l) => sum + l.dealValueINR, 0);

  const proposalSentCount = leads.filter(l => l.stage === 'Proposal Sent').length;
  const meetingsBookedCount = leads.filter(l => l.stage === 'Meeting Booked' || l.stage === 'Demo / Trial Given').length;

  const handleStageChange = (id: string, newStage: LeadStage) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: newStage, lastContactedDate: new Date().toISOString().split('T')[0] } : l));
  };

  const handleUpdateFollowUp = (id: string, nextDate: string, note: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, nextFollowUpDate: nextDate, followUpNote: note } : l));
  };

  const handleDeleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    if (selectedLead?.id === id) setSelectedLead(null);
  };

  const handleAddNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactory.trim()) return;

    const lead: FactoryLead = {
      id: `lead-${Date.now()}`,
      factoryName: newFactory.trim(),
      contactPerson: newContact.trim() || 'Factory Owner',
      designation: newDesignation.trim() || 'Managing Director',
      phone: newPhone.trim() || '+91 98000 00000',
      email: newEmail.trim() || 'owner@factory.com',
      cluster: newCluster,
      tier: newTier,
      dealValueINR: Number(newDealValue) || 9999,
      stage: newStage,
      nextFollowUpDate: newFollowUpDate,
      followUpNote: newFollowUpNote.trim() || 'Send introductory OTIF benchmark audit proposal',
      notes: newNotes.trim() || 'Potential tier-2 supplier customer.',
      lastContactedDate: new Date().toISOString().split('T')[0],
    };

    setLeads(prev => [lead, ...prev]);
    setIsAddLeadOpen(false);
    // Reset form
    setNewFactory('');
    setNewContact('');
    setNewDesignation('');
    setNewPhone('');
    setNewEmail('');
    setNewFollowUpNote('');
    setNewNotes('');
  };

  const getStageBadgeColor = (stage: LeadStage) => {
    switch (stage) {
      case 'Closed Won':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Proposal Sent':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Demo / Trial Given':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'Meeting Booked':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Identified':
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
      case 'Closed Lost':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Factory Sales Lead Pipeline</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Commercial CRM
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Track target manufacturing plants in Sriperumbudur, Oragadam, and Chakan to pitch, quote, and close subscriptions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddLeadOpen(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Factory Lead</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/60 border-b border-slate-800 text-xs font-mono">
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Active Pipeline ARR</span>
            <div className="text-base font-black text-amber-400">
              ₹{(totalPipelineValue * 12).toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-normal">/yr</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">₹{totalPipelineValue.toLocaleString('en-IN')}/mo recurring</div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Closed Won MRR</span>
            <div className="text-base font-black text-emerald-400">
              ₹{closedWonValue.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-normal">/mo</span>
            </div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5">Live Onboarded Plants</div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Proposals In Review</span>
            <div className="text-base font-black text-blue-400">
              {proposalSentCount} Plants
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Awaiting GM/CFO Signoff</div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Active Demos / Meetings</span>
            <div className="text-base font-black text-indigo-400">
              {meetingsBookedCount} Plants
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Evaluating Tablet / Audit</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search plant name, contact, cluster..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {(['All', 'Identified', 'Meeting Booked', 'Demo / Trial Given', 'Proposal Sent', 'Closed Won', 'Closed Lost'] as const).map(stage => (
              <button
                key={stage}
                onClick={() => setStageFilter(stage)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
                  stageFilter === stage
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content List & Details */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
              <p>No sales leads found matching your search.</p>
              <button
                onClick={() => setIsAddLeadOpen(true)}
                className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg inline-flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" /> Add your first factory lead
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredLeads.map(lead => {
                const isOverdue = new Date(lead.nextFollowUpDate) < new Date(new Date().toISOString().split('T')[0]);
                const isToday = lead.nextFollowUpDate === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={lead.id}
                    className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white tracking-tight">
                            {lead.factoryName}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getStageBadgeColor(lead.stage)}`}>
                            {lead.stage}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {lead.tier} • ₹{lead.dealValueINR.toLocaleString('en-IN')}/mo
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1 text-slate-300 font-medium">
                            <UserCheck className="w-3 h-3 text-slate-400" />
                            {lead.contactPerson} ({lead.designation})
                          </span>
                          <span>•</span>
                          <span>{lead.cluster}</span>
                          <span>•</span>
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-amber-400 hover:underline">
                            <Phone className="w-3 h-3" /> {lead.phone}
                          </a>
                          <span>•</span>
                          <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-blue-400 hover:underline">
                            <Mail className="w-3 h-3" /> {lead.email}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Select */}
                        <select
                          value={lead.stage}
                          onChange={e => handleStageChange(lead.id, e.target.value as LeadStage)}
                          className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="Identified">Identified</option>
                          <option value="Meeting Booked">Meeting Booked</option>
                          <option value="Demo / Trial Given">Demo / Trial Given</option>
                          <option value="Proposal Sent">Proposal Sent</option>
                          <option value="Closed Won">Closed Won</option>
                          <option value="Closed Lost">Closed Lost</option>
                        </select>

                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Follow-up Reminder & Action Note */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                      <div className="md:col-span-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Action &amp; Follow-up Reminder:</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed font-sans text-xs">
                          {lead.followUpNote}
                        </p>
                        <p className="text-slate-500 text-[11px] pt-1">
                          Context: {lead.notes}
                        </p>
                      </div>

                      <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-3 space-y-2">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Next Follow-Up Date:</span>
                          <div className={`font-mono font-bold flex items-center gap-1.5 text-xs ${
                            isOverdue 
                              ? 'text-rose-400' 
                              : isToday 
                              ? 'text-amber-300 animate-pulse' 
                              : 'text-slate-200'
                          }`}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{lead.nextFollowUpDate}</span>
                            {isOverdue && (
                              <span className="px-1 py-0.2 rounded text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Overdue
                              </span>
                            )}
                            {isToday && (
                              <span className="px-1 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Due Today
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Hello Mr. ${lead.contactPerson}, following up from our conversation regarding the Gate Dispatch OTIF software for ${lead.factoryName}. Would you have 10 minutes tomorrow to review the SLA report?`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-[11px] font-semibold transition"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-400" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Lead management persists locally in your browser storage. Export or quote instantly.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            Close Pipeline
          </button>
        </div>
      </div>

      {/* Add Lead Sub-Modal */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add New Factory Sales Lead</span>
              </h3>
              <button
                onClick={() => setIsAddLeadOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Factory / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brakes India Fasteners Unit"
                  value={newFactory}
                  onChange={e => setNewFactory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    placeholder="e.g. K. Sundar"
                    value={newContact}
                    onChange={e => setNewContact(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Designation / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Plant Head / Owner"
                    value={newDesignation}
                    onChange={e => setNewDesignation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+91 98..."
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="head@factory.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Industrial Cluster</label>
                  <select
                    value={newCluster}
                    onChange={e => setNewCluster(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Oragadam Industrial Corridor">Oragadam Corridor</option>
                    <option value="Sriperumbudur SIPCOT Sector">Sriperumbudur SIPCOT</option>
                    <option value="Chakan MIDC Industrial Corridor, Pune">Chakan MIDC, Pune</option>
                    <option value="Peenya Industrial Area, Bangalore">Peenya, Bangalore</option>
                    <option value="Manesar Auto Cluster, Haryana">Manesar, Haryana</option>
                    <option value="Ambattur Industrial Estate">Ambattur Estate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Proposed Plan Tier</label>
                  {(() => {
                    const starterPrice = rules.factoryProfile?.monthlyPriceStarter ?? 2999;
                    const proPrice = rules.factoryProfile?.monthlyPricePro ?? 4999;
                    const enterprisePrice = rules.factoryProfile?.monthlyPriceEnterprise ?? 9999;
                    return (
                      <select
                        value={newTier}
                        onChange={e => {
                          const t = e.target.value as 'Starter' | 'Pro Industrial' | 'Enterprise';
                          setNewTier(t);
                          if (t === 'Starter') setNewDealValue(starterPrice);
                          if (t === 'Pro Industrial') setNewDealValue(proPrice);
                          if (t === 'Enterprise') setNewDealValue(enterprisePrice);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                      >
                        <option value="Starter">Starter (₹{starterPrice.toLocaleString('en-IN')}/mo)</option>
                        <option value="Pro Industrial">Pro Industrial (₹{proPrice.toLocaleString('en-IN')}/mo)</option>
                        <option value="Enterprise">Enterprise (₹{enterprisePrice.toLocaleString('en-IN')}/mo)</option>
                      </select>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sales Stage</label>
                  <select
                    value={newStage}
                    onChange={e => setNewStage(e.target.value as LeadStage)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Identified">Identified</option>
                    <option value="Meeting Booked">Meeting Booked</option>
                    <option value="Demo / Trial Given">Demo / Trial Given</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Closed Won">Closed Won</option>
                    <option value="Closed Lost">Closed Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Next Follow-Up Date</label>
                  <input
                    type="date"
                    required
                    value={newFollowUpDate}
                    onChange={e => setNewFollowUpDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Next Follow-up Action / Reminder Note</label>
                <input
                  type="text"
                  placeholder="e.g. Call plant director after shift meeting to demo tablet view"
                  value={newFollowUpNote}
                  onChange={e => setNewFollowUpNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">OEM / Plant Background Context</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Supplies Ashok Leyland engine brackets; gets shouted at for late trucks on Friday evenings."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddLeadOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Lead</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
