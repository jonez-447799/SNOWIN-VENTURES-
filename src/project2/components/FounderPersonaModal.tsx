import React, { useState } from 'react';
import { 
  Briefcase, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  ShieldCheck, 
  IndianRupee, 
  Award, 
  FileText, 
  Sparkles, 
  MessageSquare, 
  X, 
  Phone, 
  Mail, 
  Building2, 
  Check, 
  ArrowRight,
  HelpCircle,
  Clock,
  Layers
} from 'lucide-react';
import { RulesConfig } from '../types/otif';

interface FounderPersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: RulesConfig;
  onUpdateRules: (newRules: RulesConfig) => void;
  onOpenProposal?: () => void;
  onOpenROICalculator?: () => void;
}

export const FounderPersonaModal: React.FC<FounderPersonaModalProps> = ({
  isOpen,
  onClose,
  rules,
  onUpdateRules,
  onOpenProposal,
  onOpenROICalculator,
}) => {
  const profile = rules.factoryProfile;
  const currency = profile?.currencySymbol || '₹';

  // Current pricing with sensible defaults
  const currentStarter = profile?.monthlyPriceStarter ?? 2999;
  const currentPro = profile?.monthlyPricePro ?? 4999;
  const currentEnterprise = profile?.monthlyPriceEnterprise ?? 9999;

  // Local state for pricing editor
  const [starterPrice, setStarterPrice] = useState<number>(currentStarter);
  const [proPrice, setProPrice] = useState<number>(currentPro);
  const [enterprisePrice, setEnterprisePrice] = useState<number>(currentEnterprise);

  // Local state for Founder Persona
  const [founderTitle, setFounderTitle] = useState<string>(
    profile?.founderTitle || 'Plant Dispatch Compliance Auditor'
  );
  const [founderName, setFounderName] = useState<string>(
    profile?.founderName || 'Operations Audit Partner'
  );
  const [founderFirmName, setFounderFirmName] = useState<string>(
    profile?.founderFirmName || 'Industrial OTIF Systems & Audit'
  );
  const [founderPhone, setFounderPhone] = useState<string>(
    profile?.managerPhone || '+91 98401 23456'
  );

  const [activeTab, setActiveTab] = useState<'persona' | 'pricing' | 'scripts' | 'objections' | 'card'>('persona');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSavePricingAndPersona = () => {
    if (!profile) return;
    const updatedProfile = {
      ...profile,
      monthlyPriceStarter: starterPrice,
      monthlyPricePro: proPrice,
      monthlyPriceEnterprise: enterprisePrice,
      founderTitle,
      founderName,
      founderFirmName,
      managerPhone: founderPhone,
    };

    onUpdateRules({
      ...rules,
      factoryProfile: updatedProfile,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const applyPricingPreset = (starter: number, pro: number, enterprise: number) => {
    setStarterPrice(starter);
    setProPrice(pro);
    setEnterprisePrice(enterprise);
    if (profile) {
      onUpdateRules({
        ...rules,
        factoryProfile: {
          ...profile,
          monthlyPriceStarter: starter,
          monthlyPricePro: pro,
          monthlyPriceEnterprise: enterprise,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Founder Sales Persona &amp; Factory Pitch Kit</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Authority Playbook
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                How to walk into manufacturing plants with instant authority (without being dismissed as a student or IT guy).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-2 border-b border-slate-800 bg-slate-950 flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setActiveTab('persona')}
            className={`px-3.5 py-2 font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'persona'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>1. What to Call Yourself</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3.5 py-2 font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pricing'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            <span>2. Change Monthly Price</span>
          </button>

          <button
            onClick={() => setActiveTab('scripts')}
            className={`px-3.5 py-2 font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'scripts'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>3. Word-for-Word Pitch Scripts</span>
          </button>

          <button
            onClick={() => setActiveTab('objections')}
            className={`px-3.5 py-2 font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'objections'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4. Objection Killers</span>
          </button>

          <button
            onClick={() => setActiveTab('card')}
            className={`px-3.5 py-2 font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'card'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>5. Printable Auditor Card</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-900/40 text-xs">
          
          {saveSuccess && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Settings and monthly pricing saved successfully across all proposals &amp; calculators!</span>
            </div>
          )}

          {/* TAB 1: WHAT TO CALL YOURSELF */}
          {activeTab === 'persona' && (
            <div className="space-y-5">
              {/* Alert Callout */}
              <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 text-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>The Harsh Truth: Why You Must Never Introduce Yourself as a Student or IT Guy</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-slate-300">
                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-rose-900/40">
                    <strong className="text-rose-300 block mb-1">❌ If you say "I am a student":</strong>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Factory owners will think you are doing a college assignment or looking for an internship. They will never trust you with their ₹5–20 Crore supply chain or write a monthly cheque to a student.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-rose-900/40">
                    <strong className="text-rose-300 block mb-1">❌ If you say "I am an IT / software developer":</strong>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Factory owners hate IT jargon. They assume software developers don't understand dusty factory gates, truck drivers, or delivery challans, and will try to sell an overpriced, bloated ERP system.
                    </p>
                  </div>
                </div>
              </div>

              {/* The 3 Authority Titles */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Choose Your Professional Identity (Select One for Your Business):</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Title 1 */}
                  <div 
                    onClick={() => { setFounderTitle('Plant Dispatch Compliance Auditor'); }}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      founderTitle === 'Plant Dispatch Compliance Auditor'
                        ? 'border-amber-500 bg-amber-950/20 ring-1 ring-amber-500/40'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 uppercase">
                          Highest Respect
                        </span>
                        {founderTitle === 'Plant Dispatch Compliance Auditor' && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      <div className="text-sm font-bold text-white">Plant Dispatch Compliance Auditor</div>
                      <p className="text-slate-400 text-[11px] mt-2 leading-relaxed">
                        Manufacturing owners respect <strong>Auditors</strong> because auditors find where money is leaking and don't sell bloated products.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-amber-300">
                      Best for: First meetings with Plant MD &amp; Factory Owners
                    </div>
                  </div>

                  {/* Title 2 */}
                  <div 
                    onClick={() => { setFounderTitle('OEM Delivery Rating Specialist'); }}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      founderTitle === 'OEM Delivery Rating Specialist'
                        ? 'border-blue-500 bg-blue-950/20 ring-1 ring-blue-500/40'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 uppercase">
                          Auto Industry
                        </span>
                        {founderTitle === 'OEM Delivery Rating Specialist' && (
                          <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div className="text-sm font-bold text-white">OEM Delivery Rating Specialist</div>
                      <p className="text-slate-400 text-[11px] mt-2 leading-relaxed">
                        Suppliers to Hyundai, Tata, Maruti, and Ashok Leyland live and die by their vendor scorecards. This title positions you as an expert in preserving OEM contracts.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-blue-300">
                      Best for: Auto Tier-1 &amp; Tier-2 component manufacturers
                    </div>
                  </div>

                  {/* Title 3 */}
                  <div 
                    onClick={() => { setFounderTitle('Industrial Operations Partner'); }}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      founderTitle === 'Industrial Operations Partner'
                        ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 uppercase">
                          Peer Executive
                        </span>
                        {founderTitle === 'Industrial Operations Partner' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div className="text-sm font-bold text-white">Industrial Operations Partner</div>
                      <p className="text-slate-400 text-[11px] mt-2 leading-relaxed">
                        Sounds like an established business associate who partners with factories to streamline vehicle detention and gate turnaround time.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-emerald-300">
                      Best for: Heavy Engineering, Pumps, Packaging &amp; Plastics
                    </div>
                  </div>
                </div>
              </div>

              {/* Persona Customizer Inputs */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                  Your Custom Business Identity Details (Printed on Proposals &amp; Visiting Cards)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Your Selected Title:</label>
                    <input 
                      type="text"
                      value={founderTitle}
                      onChange={e => setFounderTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                      placeholder="e.g. Plant Dispatch Compliance Auditor"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Your Professional Firm / Agency Name:</label>
                    <input 
                      type="text"
                      value={founderFirmName}
                      onChange={e => setFounderFirmName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                      placeholder="e.g. Industrial OTIF Systems & Audit"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Your Name / Executive Representation:</label>
                    <input 
                      type="text"
                      value={founderName}
                      onChange={e => setFounderName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                      placeholder="e.g. Operations Audit Partner"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Your Direct Contact Phone:</label>
                    <input 
                      type="text"
                      value={founderPhone}
                      onChange={e => setFounderPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                      placeholder="+91 98401 23456"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSavePricingAndPersona}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save My Persona &amp; Details</span>
                  </button>
                </div>
              </div>

              {/* Physical Rules for Looking Senior & Respected */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                  3 Physical Rules for Looking Respected on the Factory Floor:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300 text-[11px]">
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                    <strong className="text-amber-300 block mb-1">1. The Dress Code:</strong>
                    Tucked-in solid collared shirt, clean formal trousers, and dark leather shoes or industrial safety boots. Never wear casual sneakers, t-shirts, or hoodies.
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                    <strong className="text-amber-300 block mb-1">2. Carry Stamped Paper:</strong>
                    Always hold a hard black clipboard with 2 printed copies of the <strong>Owner Audit Report</strong> and <strong>SLA Defense Certificate</strong>. Printed paper looks official; looking at only a phone looks casual.
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                    <strong className="text-amber-300 block mb-1">3. Factory Vocabulary:</strong>
                    Say <em>"Security gate pass, vehicle out-time, debit note, short load, liquidated damages"</em>. Never say <em>"web app, coding, cloud server"</em>.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHANGE MONTHLY PRICE */}
          {activeTab === 'pricing' && (
            <div className="space-y-5">
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <IndianRupee className="w-4 h-4" />
                  <span>Custom Monthly Pricing Controls (What You Charge Factories)</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  You can set whatever price you want to charge your clients! Changes here instantly update the 
                  <strong className="text-white"> Sales Proposal Quote</strong>, the <strong className="text-white">ROI Calculator</strong>, and your <strong className="text-white">Client Pipeline</strong>.
                </p>
              </div>

              {/* Quick Pricing Presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Quick Pricing Presets (1-Click Apply):</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => applyPricingPreset(1999, 3999, 7999)}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-blue-400 uppercase">Affordable / Low Barrier</span>
                    <div className="text-base font-black text-white mt-1">₹3,999 <span className="text-xs font-normal text-slate-400">/mo (Pro)</span></div>
                    <div className="text-[10px] text-slate-400 mt-1">Starter ₹1,999 • Pro ₹3,999 • Enterprise ₹7,999</div>
                    <p className="text-[10px] text-slate-500 mt-1">Easiest first sale for small machine shops.</p>
                  </button>

                  <button
                    onClick={() => applyPricingPreset(2999, 4999, 9999)}
                    className="p-3 bg-amber-950/20 border border-amber-500/50 hover:border-amber-400 rounded-xl text-left transition cursor-pointer ring-1 ring-amber-500/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">Recommended Sweet Spot</span>
                      <span className="text-[9px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">POPULAR</span>
                    </div>
                    <div className="text-base font-black text-amber-300 mt-1">₹4,999 <span className="text-xs font-normal text-slate-400">/mo (Pro)</span></div>
                    <div className="text-[10px] text-slate-400 mt-1">Starter ₹2,999 • Pro ₹4,999 • Enterprise ₹9,999</div>
                    <p className="text-[10px] text-slate-400 mt-1">Approved on the spot by plant heads without board meetings.</p>
                  </button>

                  <button
                    onClick={() => applyPricingPreset(4999, 9999, 19999)}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">High-Margin Enterprise</span>
                    <div className="text-base font-black text-white mt-1">₹9,999 <span className="text-xs font-normal text-slate-400">/mo (Pro)</span></div>
                    <div className="text-[10px] text-slate-400 mt-1">Starter ₹4,999 • Pro ₹9,999 • Enterprise ₹19,999</div>
                    <p className="text-[10px] text-slate-500 mt-1">For multi-plant groups with &gt;100 dispatches/month.</p>
                  </button>
                </div>
              </div>

              {/* Exact Custom Price Inputs */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                  Customize Exact Monthly Prices (Enter Any Amount):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Starter Tier Input */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-blue-400 uppercase">Starter Tier (Single Plant)</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-sm font-bold font-mono">₹</span>
                      <input 
                        type="number"
                        step="500"
                        value={starterPrice}
                        onChange={e => setStarterPrice(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono font-bold text-sm focus:outline-none focus:border-blue-400"
                      />
                      <span className="text-slate-400 text-xs">/mo</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Annual upfront: ₹{(starterPrice * 12 * 0.8).toLocaleString('en-IN')}/yr (20% discount)
                    </p>
                  </div>

                  {/* Pro Industrial Tier Input */}
                  <div className="p-3 bg-amber-950/20 rounded-xl border border-amber-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase">Pro Industrial (Standard)</span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded">Core Offer</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-sm font-bold font-mono">₹</span>
                      <input 
                        type="number"
                        step="500"
                        value={proPrice}
                        onChange={e => setProPrice(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-amber-300 font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-slate-400 text-xs">/mo</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Annual upfront: ₹{(proPrice * 12 * 0.8).toLocaleString('en-IN')}/yr (20% discount)
                    </p>
                  </div>

                  {/* Enterprise Tier Input */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase">Enterprise ERP Multi-Plant</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-sm font-bold font-mono">₹</span>
                      <input 
                        type="number"
                        step="1000"
                        value={enterprisePrice}
                        onChange={e => setEnterprisePrice(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-400"
                      />
                      <span className="text-slate-400 text-xs">/mo</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Annual upfront: ₹{(enterprisePrice * 12 * 0.8).toLocaleString('en-IN')}/yr (20% discount)
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    💡 Tip: ₹4,999/month is less than ₹170/day. If it stops just one ₹35,000 penalty, the factory makes 7x their money back.
                  </span>
                  <button
                    onClick={handleSavePricingAndPersona}
                    className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save &amp; Update All Pricing Across Software</span>
                  </button>
                </div>
              </div>

              {/* Action buttons to view updated proposal or ROI */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {onOpenProposal && (
                  <button
                    onClick={onOpenProposal}
                    className="px-3.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>Preview Updated Proposal with New Price</span>
                  </button>
                )}
                {onOpenROICalculator && (
                  <button
                    onClick={onOpenROICalculator}
                    className="px-3.5 py-1.5 bg-teal-600/30 hover:bg-teal-600/50 text-teal-200 border border-teal-500/40 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>View ROI Math with New Price</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PITCH SCRIPTS */}
          {activeTab === 'scripts' && (
            <div className="space-y-4">
              <span className="text-xs text-slate-400 block">
                The exact step-by-step words to say from the factory security gate to the Plant Owner's cabin:
              </span>

              {/* Step 1: Security Guard */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 font-mono uppercase">
                    Step 1: Security Gate Cabin (Getting Inside)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Duration: 30 Seconds</span>
                </div>
                <p className="text-slate-300 text-xs">
                  <strong>What the guard asks:</strong> <em>"Who are you meeting? For what work?"</em>
                </p>
                <div className="p-3 bg-slate-900 rounded-lg border-l-4 border-amber-500 text-amber-200 font-medium text-xs leading-relaxed">
                  "Good morning bhaiya / sir. I have an appointment to submit the OEM Dispatch Audit and Gate Pass Verification for the Plant Head / Managing Director. Please make a visitor slip for [Your Name] from Industrial OTIF Audit."
                </div>
                <p className="text-[11px] text-slate-400">
                  ⚡ <em>Why this works:</em> When you say "OEM Dispatch Audit" and hold a clipboard with printed papers, the guard assumes you are an official auditor and promptly makes your visitor entry.
                </p>
              </div>

              {/* Step 2: In Front of the Plant Head / MD */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 font-mono uppercase">
                    Step 2: Meeting the Owner / Plant Head (The 15-Second Opening)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Duration: 15 Seconds</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border-l-4 border-blue-500 text-blue-200 font-medium text-xs leading-relaxed">
                  "Sir, good morning. We help Tier-1 and Tier-2 auto suppliers stop customer late-delivery penalties and liquidated damage debits. When your trucks leave your gate on time but get blamed by customer inwards docks, do you have stamped digital proof? We protect your monthly billing from ₹50,000 to ₹1,50,000 in penalty deductions. May I show you a 3-minute sample audit report on my screen?"
                </div>
                <p className="text-[11px] text-slate-400">
                  ⚡ <em>Why this works:</em> You did not say "software" or "app". You talked about their biggest headache: customer penalty deductions. Every factory owner hates losing money to OEM debit notes.
                </p>
              </div>

              {/* Step 3: The 3-Minute Demo */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 font-mono uppercase">
                    Step 3: The 3-Minute Laptop Demo &amp; Closing Offer
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Duration: 3 Minutes</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div><strong>1. Click 'Gate Cabin Tablet':</strong> <em>"Sir, look how simple this is. Your gate guard just taps 'Quick Dispatch'. It takes 5 seconds."</em></div>
                  <div><strong>2. Click 'Owner Report':</strong> <em>"This gives you one clean page showing exactly how many loads were delayed by Material Shortage vs Transport."</em></div>
                  <div><strong>3. Show the SLA Certificate:</strong> <em>"Whenever a customer issues a penalty debit note, you print this stamped certificate and reject their deduction."</em></div>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border-l-4 border-emerald-500 text-emerald-200 font-medium text-xs leading-relaxed mt-2">
                  "Sir, you don't have to change your Tally or SAP. Let us run this at your gate for 5 days at zero cost. If it catches even one unjustified penalty deduction, you continue for ₹{proPrice.toLocaleString('en-IN')}/month. If not, you pay nothing. Shall we start from Monday morning?"
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OBJECTION KILLERS */}
          {activeTab === 'objections' && (
            <div className="space-y-3">
              <span className="text-xs text-slate-400 block">
                How to confidently handle the 4 most common questions factory owners ask:
              </span>

              <div className="space-y-3">
                {/* Objection 1 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    <span>"You look quite young. Who do you work with / what is your experience?"</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg text-slate-200 text-xs border border-slate-800 leading-relaxed">
                    <strong className="text-amber-300">Your Response:</strong><br />
                    <em>"Sir, vehicle exit timestamps and purchase order delivery dates are pure mathematics. A truck either crossed your gate by 4:00 PM or it crossed at 5:30 PM. Our audit system gives your security guard an unalterable timestamp that OEM quality and commercial teams cannot dispute. Let's audit 10 dispatches together this week and see the facts."</em>
                  </div>
                </div>

                {/* Objection 2 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    <span>"We already have SAP / Tally / an ERP system in our billing office."</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg text-slate-200 text-xs border border-slate-800 leading-relaxed">
                    <strong className="text-amber-300">Your Response:</strong><br />
                    <em>"Sir, Tally and SAP only know when the bill was printed in the AC office. They have zero idea when the driver actually turned the ignition and drove past the physical gate. Customer penalties are calculated on gate-out time. We give you that gate proof without changing or replacing your accounts ERP."</em>
                  </div>
                </div>

                {/* Objection 3 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    <span>"My security guards are not educated and cannot operate software."</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg text-slate-200 text-xs border border-slate-800 leading-relaxed">
                    <strong className="text-amber-300">Your Response:</strong><br />
                    <em>"Sir, our gate kiosk has only 2 big buttons: 'Quick Dispatch' and 'Log Out'. If your security guard can watch a YouTube video or make a WhatsApp call on his mobile phone, he can operate this in under 2 minutes. We also provide full in-person guard training on Day 1."</em>
                  </div>
                </div>

                {/* Objection 4 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    <span>"Send me a brochure on WhatsApp, I will check later."</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg text-slate-200 text-xs border border-slate-800 leading-relaxed">
                    <strong className="text-amber-300">Your Response:</strong><br />
                    <em>"Sir, brochures don't stop customer penalty debits. Let me print out this 1-page sample audit right now and leave it on your desk. When is your next big dispatch to [Customer Name]? Let's log just that one truck together."</em>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRINTABLE BUSINESS / AUDITOR CARD */}
          {activeTab === 'card' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Official Auditor Business Identity Card ready to present to factory owners:
                </span>
                <button
                  onClick={handlePrintCard}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Business Card / Slip</span>
                </button>
              </div>

              {/* Printable Card Preview */}
              <div className="bg-slate-950 p-6 rounded-2xl border-2 border-slate-700 max-w-lg mx-auto shadow-2xl space-y-4 font-mono text-slate-200">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] tracking-widest text-amber-400 uppercase font-bold block">
                      INDUSTRIAL DISPATCH &amp; SLA AUDIT
                    </span>
                    <h4 className="text-base font-black text-white mt-0.5">{founderFirmName}</h4>
                    <span className="text-[11px] text-slate-400 block">Manufacturing Corridor Compliance Wing</span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
                    OTIF
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">{founderName}</div>
                  <div className="text-xs text-amber-300 font-semibold">{founderTitle}</div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Specializing in OEM Liquidated Damages Defense &amp; Gate-Out Verification
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-slate-800 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>{founderPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                    <span>IATF 16949 / OTIF Audit</span>
                  </div>
                </div>

                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-[10px] text-slate-400 text-center">
                  Serving Sriperumbudur, Oragadam, Chakan, Peenya, Manesar &amp; Hosur Industrial Clusters
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-slate-400">
            <span>Current Pricing:</span>
            <span className="text-blue-400 font-bold">Starter ₹{starterPrice.toLocaleString('en-IN')}/mo</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">Pro ₹{proPrice.toLocaleString('en-IN')}/mo</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">Enterprise ₹{enterprisePrice.toLocaleString('en-IN')}/mo</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                handleSavePricingAndPersona();
                onClose();
              }}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Check className="w-4 h-4" />
              <span>Save &amp; Apply Changes</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
