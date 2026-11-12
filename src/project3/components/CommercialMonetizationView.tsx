import React, { useState } from 'react';
import { 
  Briefcase, 
  DollarSign, 
  FileCheck, 
  Printer, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  TrendingUp, 
  Scale, 
  Layers, 
  AlertTriangle,
  FileSpreadsheet,
  Zap,
  HelpCircle
} from 'lucide-react';
import { AuditTotals, ScaleProfile, CommercialModelId, RulesConfig, CalculatedTrip } from '../types/freight';
import { SCALE_PROFILES } from '../data/defaultData';
import { formatINR } from '../utils/auditCalculations';
import { RateDriftSimulator } from './RateDriftSimulator';

interface CommercialMonetizationViewProps {
  totals: AuditTotals;
  currentScale: ScaleProfile;
  onChangeScale: (profile: ScaleProfile) => void;
  rules: RulesConfig;
  trips: CalculatedTrip[];
  onNavigateToObjections?: () => void;
  onNavigateToReconciler?: () => void;
}

export const CommercialMonetizationView: React.FC<CommercialMonetizationViewProps> = ({
  totals,
  currentScale,
  onChangeScale,
  rules,
  trips,
  onNavigateToObjections,
  onNavigateToReconciler
}) => {
  // Commercial terms state
  const [selectedModel, setSelectedModel] = useState<CommercialModelId>('contingency');
  const [contingencyPct, setContingencyPct] = useState<number>(30);
  const [fixedDiagnosticFee, setFixedDiagnosticFee] = useState<number>(15000);
  const [monthlyRetainerFee, setMonthlyRetainerFee] = useState<number>(7500);
  
  const [clientName, setClientName] = useState<string>('Apex Precision Machining Works');
  const [plantLocation, setPlantLocation] = useState<string>('Ambattur Industrial Estate, Chennai');
  const [decisionMaker, setDecisionMaker] = useState<string>('Mr. R. Sundaram (Managing Director)');
  const [isContractMode, setIsContractMode] = useState<boolean>(false);

  // Scaled calculations based on current factory spend tier
  const scaledMonthlySpend = totals.freightPaid * currentScale.multiplier;
  const scaledAnnualSpend = scaledMonthlySpend * 12;

  const scaledMonthlyLeak = totals.totalLeak * currentScale.multiplier;
  const scaledAnnualLeak = scaledMonthlyLeak * 12;

  // Commercial revenue math per model
  let auditorAnnualRevenue = 0;
  let auditorMonthlyRevenue = 0;
  let clientNetAnnualSavings = 0;

  if (selectedModel === 'contingency') {
    auditorMonthlyRevenue = Math.round(scaledMonthlyLeak * (contingencyPct / 100));
    auditorAnnualRevenue = auditorMonthlyRevenue * 12;
    clientNetAnnualSavings = (scaledMonthlyLeak - auditorMonthlyRevenue) * 12;
  } else if (selectedModel === 'fixed_diagnostic') {
    auditorMonthlyRevenue = Math.round(fixedDiagnosticFee / 3);
    auditorAnnualRevenue = fixedDiagnosticFee; // one-time fee
    clientNetAnnualSavings = scaledAnnualLeak - fixedDiagnosticFee;
  } else {
    // monthly retainer
    auditorMonthlyRevenue = monthlyRetainerFee;
    auditorAnnualRevenue = monthlyRetainerFee * 12;
    clientNetAnnualSavings = scaledAnnualLeak - auditorAnnualRevenue;
  }

  const handlePrintContract = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Brutal Honesty Assessment Banner */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black text-amber-300 bg-amber-950 border border-amber-800 px-3 py-1 rounded">
                The Hard Truths: Business Reality Check
              </span>
              <span className="text-xs font-mono text-slate-400">
                Prioritizing Accuracy Over Flattery
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              How You ACTUALLY Make Money (The Service-Led Pivot)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              If you try to sell a software subscription to an Indian MSME factory owner, you will go broke. He won’t log in, his clerks write in greasy paper registers, and he hates monthly tech bills. 
              <strong> You sell the recovered money.</strong> You take his last 30 days of lorry bills, process it using this platform in 15 minutes, hand him the ₹13,944 leak dossier, and take 30% of the recovered cash.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <button
              onClick={() => setIsContractMode(!isContractMode)}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <FileCheck className="w-4 h-4 text-slate-950" />
              <span>{isContractMode ? 'Hide Client Agreement' : 'Generate Bankable Proposal'}</span>
            </button>
            {onNavigateToObjections && (
              <button
                onClick={onNavigateToObjections}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-700"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Transporter Negotiation Room</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Uncomfortable Truths Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <strong className="text-amber-400 font-bold block">1. Self-Serve SaaS Fails</strong>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              MSME promoters do not use software dashboards. You must act as the auditor who runs the diagnostic.
            </p>
          </div>
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <strong className="text-amber-400 font-bold block">2. Paper Bills Are Reality</strong>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Carbon LRs and gate notebooks are physical. The product must make manual paper batch ingestion effortless.
            </p>
          </div>
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <strong className="text-amber-400 font-bold block">3. Transporters Will Fight</strong>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Siva will blame diesel and waiting. You must arm the owner with Murugan's clean receipt on the exact same lane.
            </p>
          </div>
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <strong className="text-amber-400 font-bold block">4. Rate Creep Kills Savings</strong>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              One-off audits decay in 60 days. You convert the audit into an ongoing ₹7,500/mo retainer to police drift.
            </p>
          </div>
        </div>
      </div>

      {/* Client Spend Scale Simulator */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block">
              Step 1: Select Factory Tier & Scale
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Client Spend & Leak Scale Multiplier
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded">
            Active: {currentScale.name} ({currentScale.monthlySpendLabel})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SCALE_PROFILES.map((profile) => {
            const isSelected = profile.id === currentScale.id;
            return (
              <div
                key={profile.id}
                onClick={() => onChangeScale(profile)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold block">{profile.name}</strong>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {profile.monthlySpendLabel}
                  </span>
                </div>
                <span className={`text-[11px] block mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {profile.cluster} · ~{profile.typicalTripsPerMonth} trips/mo
                </span>
                <p className={`text-[11px] mt-2 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                  {profile.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monetization Model Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Selection Column */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-5 lg:col-span-1">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
            Step 2: Choose Commercial Contract Model
          </span>

          <div className="space-y-2.5">
            <button
              onClick={() => setSelectedModel('contingency')}
              className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                selectedModel === 'contingency'
                  ? 'border-amber-500 bg-amber-50/70 text-slate-950 font-medium ring-1 ring-amber-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold">Model A: Performance Gain-Share</strong>
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                  Zero Barrier
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Take a % cut of verified recovered leak. Zero risk to factory owner.
              </p>
            </button>

            <button
              onClick={() => setSelectedModel('fixed_diagnostic')}
              className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                selectedModel === 'fixed_diagnostic'
                  ? 'border-indigo-500 bg-indigo-50/70 text-slate-950 font-medium ring-1 ring-indigo-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold">Model B: Fixed Diagnostic Audit</strong>
                <span className="text-[10px] font-mono font-bold text-indigo-800 bg-indigo-100 px-1.5 py-0.5 rounded">
                  Flat Fee
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                One-time forensic audit for 90 days of bills. Fixed deliverable.
              </p>
            </button>

            <button
              onClick={() => setSelectedModel('monthly_retainer')}
              className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                selectedModel === 'monthly_retainer'
                  ? 'border-emerald-500 bg-emerald-50/70 text-slate-950 font-medium ring-1 ring-emerald-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold">Model C: Monthly Leak Guard Retainer</strong>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Recurring
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Monthly retainer to audit gate register and stop carrier rate drift.
              </p>
            </button>
          </div>

          {/* Model Specific Controls */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            {selectedModel === 'contingency' && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">Contingency Cut</span>
                  <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">{contingencyPct}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="40"
                  step="5"
                  value={contingencyPct}
                  onChange={(e) => setContingencyPct(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>20% Low</span>
                  <span>30% Standard</span>
                  <span>40% Premium</span>
                </div>
              </div>
            )}

            {selectedModel === 'fixed_diagnostic' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Fixed Audit Fee (INR)</label>
                <input
                  type="number"
                  value={fixedDiagnosticFee}
                  onChange={(e) => setFixedDiagnosticFee(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  step="2500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Typical MSME rate: ₹15,000–₹25,000 per plant.</span>
              </div>
            )}

            {selectedModel === 'monthly_retainer' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Monthly Retainer (INR)</label>
                <input
                  type="number"
                  value={monthlyRetainerFee}
                  onChange={(e) => setMonthlyRetainerFee(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  step="1000"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Typical: ₹7,500/mo includes monthly gate book audit.</span>
              </div>
            )}
          </div>

          {/* Client Details */}
          <div className="space-y-2.5 pt-3 border-t border-slate-200 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Client Entity</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Plant Location</label>
              <input
                type="text"
                value={plantLocation}
                onChange={(e) => setPlantLocation(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Financial Economics Dashboard */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Your Consulting Revenue */}
          <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
                <span>Your Consulting Earnings</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {selectedModel === 'contingency' ? `${contingencyPct}% Cut` : selectedModel === 'fixed_diagnostic' ? 'One-Time' : 'Monthly'}
                </span>
              </div>
              <div className="text-3xl font-black font-mono text-amber-400 mt-3">
                {formatINR(auditorAnnualRevenue)}
                <span className="text-xs font-sans text-slate-400 font-normal"> / year</span>
              </div>
              <span className="text-xs font-mono text-slate-300 block mt-1">
                {formatINR(auditorMonthlyRevenue)} / month average
              </span>
              <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                Generated strictly by delivering this software's audit results to the promoter. 
                With 5 MSME clients in Ambattur on this retainer, that is <strong>{formatINR(auditorAnnualRevenue * 5)}/year</strong> in consulting income.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Delivery Time: 20 mins/mo</span>
              <span className="text-emerald-400 font-bold">High Gross Margin</span>
            </div>
          </div>

          {/* Client Retained Savings */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between text-xs text-emerald-900 font-bold">
                <span>Client Net Retained Cash</span>
                <span className="font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                  Net Profit
                </span>
              </div>
              <div className="text-3xl font-black font-mono text-emerald-950 mt-3">
                {formatINR(clientNetAnnualSavings)}
                <span className="text-xs font-sans text-emerald-800 font-normal"> / year</span>
              </div>
              <span className="text-xs font-mono text-emerald-900 block mt-1">
                {formatINR(Math.round(clientNetAnnualSavings / 12))} / month added to owner cashflow
              </span>
              <p className="text-xs text-emerald-900/90 mt-4 leading-relaxed">
                Clean bottom-line profit retained by the factory promoter after paying your fee. 
                The owner cannot argue with this math because it is derived from his own cheapest bills.
              </p>
            </div>

            <div className="pt-4 border-t border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between font-mono">
              <span>Gross Leak Found:</span>
              <span className="font-bold">{formatINR(scaledAnnualLeak)} / yr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Rate Drift Simulator (Hurdle #3) */}
      <RateDriftSimulator totals={totals} currentScale={currentScale} />

      {/* Formal Printable Engagement Contract */}
      {isContractMode && (
        <div className="bg-white border-2 border-slate-900 rounded-2xl p-8 sm:p-10 space-y-6 text-slate-900 shadow-md">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <span className="text-[11px] font-mono tracking-widest uppercase text-slate-500 block">
                B2B Engagement Memorandum
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Freight Leak Audit & Cost Recovery Proposal
              </h2>
            </div>
            <button
              onClick={handlePrintContract}
              className="no-print px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print Agreement</span>
            </button>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-slate-700">
            <p>
              This Engagement Proposal is submitted to <strong>{clientName}</strong>, located at <strong>{plantLocation}</strong>, Attention: <strong>{decisionMaker}</strong>.
            </p>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
              <strong className="text-slate-900 block">1. Executive Summary & Diagnostic Baseline</strong>
              <p>
                Based on our preliminary forensic analysis of <strong>{totals.totalTrips} lorry bills</strong> and gate register logs, your manufacturing facility paid <strong>{formatINR(totals.freightPaid)}</strong> in freight. 
                Against your facility's own lowest clean trips on identical lanes, a verified leak of <strong>{formatINR(totals.rateLeak)}</strong> was paid in inflated rates, with an additional <strong>{formatINR(totals.detention)}</strong> lost to gate detention ({totals.totalWaitHours} hours).
              </p>
              <p className="font-bold text-slate-900">
                Total addressable cash leak identified: {formatINR(totals.totalLeak)} in 30 days ({formatINR(totals.totalLeak * 12)} annualized).
              </p>
            </div>

            <div className="space-y-2">
              <strong className="text-slate-900 block">2. Commercial Terms ({selectedModel.toUpperCase().replace('_', ' ')})</strong>
              {selectedModel === 'contingency' ? (
                <p>
                  Auditor shall perform continuous freight leak audits and carrier contract re-benchmarking on a <strong>{contingencyPct}% Contingency Fee basis</strong>. Client pays no upfront cost; Auditor's fee is payable strictly as {contingencyPct}% of verified carrier rate reductions and detention clawbacks.
                </p>
              ) : selectedModel === 'fixed_diagnostic' ? (
                <p>
                  Auditor shall perform a comprehensive 90-day forensic freight leak audit, carrier scorecard evaluation, and lane rate card re-negotiation for a one-time fixed professional fee of <strong>{formatINR(fixedDiagnosticFee)}</strong>.
                </p>
              ) : (
                <p>
                  Auditor shall serve as ongoing Freight Leak Guard, providing monthly gate register reconciliation, carrier rate compliance monitoring, and detention enforcement for a monthly retainer of <strong>{formatINR(monthlyRetainerFee)}</strong>.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-4">Accepted & Authorized For Client:</span>
                <div className="h-10 border-b border-slate-300"></div>
                <span className="block mt-2 font-bold text-slate-900">{decisionMaker}</span>
                <span className="text-[11px] text-slate-500">{clientName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-4">Submitted By Auditor:</span>
                <div className="h-10 border-b border-slate-300"></div>
                <span className="block mt-2 font-bold text-slate-900">Industrial Logistics Cost Advisory</span>
                <span className="text-[11px] text-slate-500">Commercial Audit Practice</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
