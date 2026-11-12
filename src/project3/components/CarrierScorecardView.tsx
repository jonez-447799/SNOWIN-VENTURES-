import React, { useState } from 'react';
import { 
  Truck, 
  Clock, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Sliders, 
  DollarSign, 
  ShieldCheck, 
  FileSpreadsheet,
  ArrowRight,
  FileText,
  MessageSquare
} from 'lucide-react';
import { TransporterSummary, CalculatedTrip, RulesConfig } from '../types/freight';
import { formatINR } from '../utils/auditCalculations';
import { CapacityRiskMatrix } from './CapacityRiskMatrix';
import { CarrierDebitNoteModal } from './CarrierDebitNoteModal';

interface CarrierScorecardViewProps {
  transporters: TransporterSummary[];
  trips: CalculatedTrip[];
  rules: RulesConfig;
  onNavigateToTrips: (filter?: { transporter?: string }) => void;
}

export const CarrierScorecardView: React.FC<CarrierScorecardViewProps> = ({
  transporters,
  trips,
  rules,
  onNavigateToTrips
}) => {
  const [selectedDebitCarrier, setSelectedDebitCarrier] = useState<TransporterSummary | null>(null);
  // What-If Simulator State:
  // % of Siva's trips transferred to Murugan (0 to 100%)
  const [sivaTransferPercent, setSivaTransferPercent] = useState<number>(100);
  // Cap gate detention at X hours
  const [capDetentionHours, setCapDetentionHours] = useState<number>(1.0);
  const [enableDetentionCap, setEnableDetentionCap] = useState<boolean>(true);

  const siva = transporters.find(t => t.transporter.toLowerCase().includes('siva'));
  const murugan = transporters.find(t => t.transporter.toLowerCase().includes('murugan'));
  const ravi = transporters.find(t => t.transporter.toLowerCase().includes('ravi'));

  // Calculate What-If Savings:
  // 1. Rate savings from transferring Siva's volume to Murugan:
  const sivaRateLeak = siva?.totalRateLeak || 7077;
  const simulatedRateSavings = Math.round(sivaRateLeak * (sivaTransferPercent / 100));

  // 2. Detention savings if wait hours are capped:
  let simulatedDetentionSavings = 0;
  if (enableDetentionCap) {
    trips.forEach(t => {
      if (t.waitHours > capDetentionHours) {
        const excessHours = t.waitHours - capDetentionHours;
        simulatedDetentionSavings += excessHours * rules.detentionRatePerHour;
      }
    });
  }

  const totalSimulatedMonthlySavings = simulatedRateSavings + Math.round(simulatedDetentionSavings);
  const totalSimulatedAnnualSavings = totalSimulatedMonthlySavings * 12;

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="max-w-3xl space-y-2">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
            Vendor Performance & Negotiation
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Transporter Performance & Cost Scorecard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Murugan was the cheap day on every lane. Siva Transport carried 78% of your rate leak and 63% of your gate waiting. Compare their real performance and simulate the financial impact of shifting volume.
          </p>
        </div>
      </div>

      {/* Side-by-Side Carrier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Murugan Card */}
        <div className="bg-white border-2 border-emerald-300 rounded-xl p-6 relative flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Benchmark Carrier
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">Murugan</h2>
                <p className="text-xs text-slate-500">5 trips · Total billed {formatINR(murugan?.totalBilled || 22700)}</p>
              </div>
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>

            <div className="mt-5 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Rate Leak</span>
                <strong className="font-mono text-emerald-700">{formatINR(murugan?.totalRateLeak || 835)} (Minimal)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Gate Detention</span>
                <strong className="font-mono text-slate-800">{formatINR(murugan?.totalDetention || 700)} (3.5 hrs total)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Avg Gate Wait</span>
                <strong className="font-mono text-slate-900">{murugan?.avgWaitHours || 0.7} hrs / trip</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Lane Status</span>
                <strong className="text-emerald-700 font-semibold">Cheapest clean rate on ALL 3 lanes</strong>
              </div>
            </div>

            <div className="mt-4 p-3 bg-emerald-50 text-[11px] text-emerald-900 rounded-lg leading-relaxed">
              <strong>Owner Strategy:</strong> Do not fight Murugan. He is your benchmark. Offer him first refusal on all scheduled dispatches to lock in clean rates.
            </div>
          </div>

          <button
            onClick={() => onNavigateToTrips({ transporter: 'Murugan' })}
            className="mt-5 w-full py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <span>View Murugan Trips</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Siva Transport Card */}
        <div className="bg-white border-2 border-rose-300 rounded-xl p-6 relative flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                  High Leak Priority
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">Siva Transport</h2>
                <p className="text-xs text-slate-500">4 trips · Total billed {formatINR(siva?.totalBilled || 23500)}</p>
              </div>
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>

            <div className="mt-5 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Rate Leak Carried</span>
                <strong className="font-mono text-rose-700 font-bold">{formatINR(siva?.totalRateLeak || 7077)} (78%)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Gate Detention Incurred</span>
                <strong className="font-mono text-rose-700 font-bold">{formatINR(siva?.totalDetention || 3100)} (15.5 hrs)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Avg Gate Wait</span>
                <strong className="font-mono text-rose-700 font-bold">{siva?.avgWaitHours || 3.9} hrs / trip</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Combined Waste</span>
                <strong className="font-mono text-rose-900 font-bold">{formatINR(siva?.totalWaste || 10177)}</strong>
              </div>
            </div>

            <div className="mt-4 p-3 bg-rose-50 text-[11px] text-rose-900 rounded-lg leading-relaxed space-y-2">
              <p><strong>Owner Strategy:</strong> This is the meeting. Present his bills against Murugan's. Demand immediate rate-matching and accountability for 15.5 idle gate hours.</p>
              <div className="pt-2 border-t border-rose-200/70 flex items-start gap-1.5 text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span><strong>Cross-Module Impact (P2 ↔ P3):</strong> Linked to 2 "No vehicle" delivery fails in P2 Customer OTIF (PO-ALL-9012 & WA-2026-09-17). Carrier delays caused customer line-shortages.</span>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <button
              onClick={() => setSelectedDebitCarrier(siva || transporters.find(t => t.transporter.toLowerCase().includes('siva')) || transporters[0])}
              className="w-full py-2.5 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Debit Note ({formatINR(siva?.totalWaste || 10177)})</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const text = `*NOTICE OF DISALLOWANCE & DEBIT NOTE*\nTo: Siva Transport\nRef: Fortnight Freight Reconciliation\nTotal Billed: ${formatINR(siva?.totalBilled || 23500)}\nRate Overcharge (vs Benchmark): ${formatINR(siva?.totalRateLeak || 7077)}\nUnverified Gate Detention: ${formatINR(siva?.totalDetention || 3100)}\n*Total Deducted from Payment: ${formatINR(siva?.totalWaste || 10177)}*\nNet Approved for Disbursement: ${formatINR((siva?.totalBilled || 23500) - (siva?.totalWaste || 10177))}\nPlease collect reconciliation statement from factory gate accounts.`;
                  navigator.clipboard.writeText(text);
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="flex-1 py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Claim</span>
              </button>

              <button
                onClick={() => onNavigateToTrips({ transporter: 'Siva Transport' })}
                className="flex-1 py-1.5 text-[11px] font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <span>Audit Trips</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Ravi (Broker) Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 relative flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  Broker / Ad-Hoc
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">Ravi (Broker)</h2>
                <p className="text-xs text-slate-500">3 trips · Total billed {formatINR(ravi?.totalBilled || 12400)}</p>
              </div>
              <Truck className="w-6 h-6 text-slate-400" />
            </div>

            <div className="mt-5 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Rate Leak</span>
                <strong className="font-mono text-amber-700">{formatINR(ravi?.totalRateLeak || 1131)}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Gate Detention</span>
                <strong className="font-mono text-slate-800">{formatINR(ravi?.totalDetention || 1100)} (5.5 hrs)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Split Loads</span>
                <strong className="font-mono text-slate-800">1 split load (excluded from leak)</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Small Trip Above 500kg</span>
                <span className="text-slate-700">1,000 kg trip carried leak math</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 text-[11px] text-slate-700 rounded-lg leading-relaxed">
              <strong>Owner Strategy:</strong> One of his trips is a split drop; one matched the benchmark. Use Ravi as backup only when regular lorries are unavailable.
            </div>
          </div>

          <button
            onClick={() => onNavigateToTrips({ transporter: 'Ravi' })}
            className="mt-5 w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <span>View Ravi Trips</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* What-If Reallocation Simulator */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <Sliders className="w-4 h-4" />
              <span>Predictive Decision Simulator</span>
            </div>
            <h3 className="text-xl font-bold mt-1 text-white">
              Simulate Volume Reallocation & Gate Discipline
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Model what happens to your cash flow if you shift Siva's dispatches to Murugan, or enforce a strict 1-hour gate in-and-out protocol.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Projected Monthly Recovery</span>
            <span className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400">
              {formatINR(totalSimulatedMonthlySavings)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Annualized: {formatINR(totalSimulatedAnnualSavings)} / yr
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {/* Lever 1: Transfer Siva's volume to Murugan */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200">
                Transfer Siva Transport Volume to Murugan
              </label>
              <span className="font-mono text-amber-400 font-bold text-sm">
                {sivaTransferPercent}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="25"
              value={sivaTransferPercent}
              onChange={(e) => setSivaTransferPercent(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />

            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>0% (Status Quo)</span>
              <span>50% Split</span>
              <span>100% Full Consolidation</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              If Siva matches Murugan's clean rate or you reallocate his 4 trips to Murugan, you recover <strong>{formatINR(simulatedRateSavings)}</strong> in pure rate leak each month.
            </p>
          </div>

          {/* Lever 2: Gate detention cap */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200">
                Cap Gate Wait at {capDetentionHours} Hours per Trip
              </label>
              <button
                onClick={() => setEnableDetentionCap(!enableDetentionCap)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  enableDetentionCap ? 'bg-emerald-500 text-slate-900 font-bold' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {enableDetentionCap ? 'Active' : 'Disabled'}
              </button>
            </div>

            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              disabled={!enableDetentionCap}
              value={capDetentionHours}
              onChange={(e) => setCapDetentionHours(Number(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                enableDetentionCap ? 'bg-slate-700 accent-emerald-400' : 'bg-slate-800 opacity-50'
              }`}
            />

            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>0.5h (Rapid Turnaround)</span>
              <span>1.0h Standard</span>
              <span>2.0h Buffer</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Enforcing pre-scheduled loading bays to prevent vehicles sitting 3.5h–5h at gates saves an estimated <strong>{formatINR(simulatedDetentionSavings)}</strong> in detention.
            </p>
          </div>
        </div>
      </div>

      {/* Capacity & Dual-Sourcing Risk Matrix (Solving Hardest Truth #4) */}
      <CapacityRiskMatrix onNavigateToTrips={onNavigateToTrips} />

      {/* Carrier Debit Note Generator Modal */}
      {selectedDebitCarrier && (
        <CarrierDebitNoteModal
          isOpen={Boolean(selectedDebitCarrier)}
          onClose={() => setSelectedDebitCarrier(null)}
          transporter={selectedDebitCarrier}
          trips={trips}
          rules={rules}
        />
      )}
    </div>
  );
};
