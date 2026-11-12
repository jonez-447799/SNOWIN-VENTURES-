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
  Layers 
} from 'lucide-react';
import { AuditTotals, ScaleProfile } from '../types/freight';
import { SCALE_PROFILES } from '../data/defaultData';
import { formatINR } from '../utils/auditCalculations';

interface GainShareProposalViewProps {
  totals: AuditTotals;
  currentScale: ScaleProfile;
  onChangeScale: (profile: ScaleProfile) => void;
}

export const GainShareProposalView: React.FC<GainShareProposalViewProps> = ({
  totals,
  currentScale,
  onChangeScale
}) => {
  const [contingencyPct, setContingencyPct] = useState<number>(25);
  const [clientName, setClientName] = useState<string>('Apex Precision Machining Works');
  const [plantLocation, setPlantLocation] = useState<string>('Ambattur Industrial Estate, Chennai');
  const [isContractMode, setIsContractMode] = useState<boolean>(false);

  // Scaled calculations
  const scaledMonthlySpend = totals.freightPaid * currentScale.multiplier;
  const scaledAnnualSpend = scaledMonthlySpend * 12;

  const scaledMonthlyLeak = totals.totalLeak * currentScale.multiplier;
  const scaledAnnualLeak = scaledMonthlyLeak * 12;

  // Contingency fee economics
  const agencyMonthlyFee = Math.round(scaledMonthlyLeak * (contingencyPct / 100));
  const agencyAnnualRevenue = agencyMonthlyFee * 12;

  const clientMonthlyNetSavings = scaledMonthlyLeak - agencyMonthlyFee;
  const clientAnnualNetSavings = clientMonthlyNetSavings * 12;

  const handlePrintContract = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Top Banner: The Commercial Pivot */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="max-w-3xl space-y-2">
          <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded">
            The Commercial Pivot: Zero-Risk Contingency Service
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Gain-Share Freight Audit & Retainer Agreement
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Factory owners refuse to buy software subscriptions, but they eagerly sign <strong>zero-upfront contingency agreements</strong>. 
            You audit their last 60 days of bills for free. If you recover waste in carrier renegotiations, you take a <strong>{contingencyPct}% fee on verified recovered cash</strong>.
          </p>
        </div>

        {/* Client Profile Scale Switcher */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
            Simulate Client Tier & Scale
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SCALE_PROFILES.map((profile) => {
              const isSelected = profile.id === currentScale.id;
              return (
                <div
                  key={profile.id}
                  onClick={() => onChangeScale(profile)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold block">{profile.name}</strong>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-100 text-slate-600'
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
      </div>

      {/* Gain-Share Financial Model */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Parameters */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-5 lg:col-span-1">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
            Proposal Terms
          </span>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Contingency Fee Split
            </label>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">Auditor Share</span>
              <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">{contingencyPct}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="40"
              step="5"
              value={contingencyPct}
              onChange={(e) => setContingencyPct(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>15% Low</span>
              <span>25% Industry Std</span>
              <span>40% High</span>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Client Entity Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Plant Location</label>
              <input
                type="text"
                value={plantLocation}
                onChange={(e) => setPlantLocation(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <button
            onClick={() => setIsContractMode(!isContractMode)}
            className="w-full py-2.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800"
          >
            <FileCheck className="w-4 h-4 text-amber-400" />
            <span>{isContractMode ? 'Hide Legal Agreement' : 'Generate Formal Agreement'}</span>
          </button>
        </div>

        {/* Economics Dashboard */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Agency Revenue Box */}
          <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                <span>Your Consulting Business Revenue</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{contingencyPct}% Share</span>
              </div>
              <div className="text-3xl font-black font-mono text-amber-400 mt-3">
                {formatINR(agencyAnnualRevenue)}
                <span className="text-xs font-sans text-slate-400 font-normal"> / year</span>
              </div>
              <span className="text-xs font-mono text-slate-300 block mt-1">
                {formatINR(agencyMonthlyFee)} / month retainer fee
              </span>
              <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                Earned strictly on performance without client financial risk. On a Tier-1 foundry, this is a <strong>₹27+ Lakhs</strong> annual contract from a single factory.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Risk: 100% Contingent</span>
              <span className="text-emerald-400 font-bold">Zero Upfront Sales Barrier</span>
            </div>
          </div>

          {/* Client Retained Savings Box */}
          <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-emerald-900 font-bold">
                <span>Client Net Retained Cash</span>
                <span className="font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">{100 - contingencyPct}% Net</span>
              </div>
              <div className="text-3xl font-black font-mono text-emerald-950 mt-3">
                {formatINR(clientAnnualNetSavings)}
                <span className="text-xs font-sans text-emerald-800 font-normal"> / year</span>
              </div>
              <span className="text-xs font-mono text-emerald-900 block mt-1">
                {formatINR(clientMonthlyNetSavings)} / month added straight to net profit
              </span>
              <p className="text-xs text-emerald-900/90 mt-4 leading-relaxed">
                Pure bottom-line profit recovered by the client after deducting your audit fee. The owner cannot lose money on this deal.
              </p>
            </div>

            <div className="pt-4 border-t border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between font-mono">
              <span>Client Total Waste Identified:</span>
              <span className="font-bold">{formatINR(scaledAnnualLeak)} / yr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Formal Printable B2B Engagement Agreement */}
      {isContractMode && (
        <div className="bg-white border-2 border-slate-300 rounded-xl p-8 sm:p-10 space-y-6 text-slate-900 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <span className="text-[11px] font-mono tracking-widest uppercase text-slate-500 block">
                Commercial Engagement Agreement
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Performance-Based Freight Audit & Cost Recovery Contract
              </h2>
            </div>
            <button
              onClick={handlePrintContract}
              className="no-print px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Contract</span>
            </button>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-slate-700">
            <p>
              This Agreement is entered into between <strong>Logistics Cost Recovery Associates</strong> ("Auditor") and <strong>{clientName}</strong>, located at {plantLocation} ("Client").
            </p>

            <div className="space-y-2">
              <strong className="text-slate-900 block font-bold">1. Scope of Audit Engagement:</strong>
              <p>
                The Auditor shall conduct an empirical freight leak audit covering the Client’s outward lorry bills, weighbridge slips, and gate security registers. The audit scope is restricted strictly to transport freight costs (cost of moving goods) and excludes inventory valuation or product defects.
              </p>
            </div>

            <div className="space-y-2">
              <strong className="text-slate-900 block font-bold">2. Benchmark Determination Methodology:</strong>
              <p>
                In order to eliminate subjective external index disputes, benchmark rates shall be established exclusively using the Client’s <strong>own historical lowest clean rate per metric tonne</strong> on identical lane corridors during the audit cycle.
              </p>
            </div>

            <div className="space-y-2">
              <strong className="text-slate-900 block font-bold">3. Compensation & Gain-Share Contingency Structure:</strong>
              <p>
                The Client shall pay <strong>zero upfront fee</strong> for the initial 60-day baseline audit. Upon completion, the Auditor shall assist in transporter rate rationalization. The Client agrees to pay the Auditor a contingency fee of <strong>{contingencyPct}% of verified recovered cash</strong> (the differential between historical actual bills and renegotiated benchmark billings) for a period of 12 consecutive months.
              </p>
            </div>

            <div className="space-y-2">
              <strong className="text-slate-900 block font-bold">4. Confidentiality & Non-Disclosure:</strong>
              <p>
                All rate cards, supplier volumes, gate timestamps, and invoice registers provided by the Client shall remain strictly confidential.
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
            <div>
              <div className="border-b border-slate-400 pb-1 mb-2"></div>
              <strong className="block text-slate-900">For {clientName}</strong>
              <span className="text-slate-500 text-[11px]">Managing Director / Factory Owner</span>
            </div>

            <div>
              <div className="border-b border-slate-400 pb-1 mb-2"></div>
              <strong className="block text-slate-900">For Logistics Cost Recovery Associates</strong>
              <span className="text-slate-500 text-[11px]">Lead Logistics Audit Consultant</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
