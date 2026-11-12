import React, { useState } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, ShieldCheck, Check, X, Calculator, ArrowRight, Sparkles } from 'lucide-react';
import { OTIFMetrics, RulesConfig } from '../types/otif';

interface ROICalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: OTIFMetrics;
  rules: RulesConfig;
}

export const ROICalculatorModal: React.FC<ROICalculatorModalProps> = ({
  isOpen,
  onClose,
  metrics,
  rules,
}) => {
  const currency = rules.factoryProfile?.currencySymbol || '₹';
  const company = rules.factoryProfile?.companyName || 'Apex Precision Automotive';

  // Customizable financial penalty parameters (with realistic auto industry defaults)
  const defaultSubCost = rules.factoryProfile?.monthlyPricePro ?? 4999;
  const [softwareSubscriptionCost, setSoftwareSubscriptionCost] = useState<number>(defaultSubCost);
  const [oemPenaltyPerFail, setOemPenaltyPerFail] = useState<number>(35000); // ₹35,000 / fail ($450)
  const [expeditedFreightCost, setExpeditedFreightCost] = useState<number>(12000); // ₹12,000 / late load
  const [delayedBillingInterest, setDelayedBillingInterest] = useState<number>(8000); // ₹8,000 working capital cost

  if (!isOpen) return null;

  const totalFailures = metrics.fails; // 9 in benchmark
  const monthlyFailures = totalFailures * 2; // ~18 failures / month at current run rate

  // Financial calculations
  const debitNotesExposure = monthlyFailures * oemPenaltyPerFail;
  const expeditedFreightLoss = monthlyFailures * expeditedFreightCost;
  const workingCapitalLoss = monthlyFailures * delayedBillingInterest;
  const totalMonthlyLoss = debitNotesExposure + expeditedFreightLoss + workingCapitalLoss;

  // Potential savings if OTIF improved to 85% OEM SLA (reducing fails by 70%)
  const projectedSavings = Math.round(totalMonthlyLoss * 0.70);
  const netMonthlyGain = projectedSavings - softwareSubscriptionCost;
  const roiMultiplier = Math.round((projectedSavings / softwareSubscriptionCost) * 10) / 10;
  const paybackDays = Math.max(1, Math.round((softwareSubscriptionCost / (projectedSavings / 30)) * 10) / 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>CFO &amp; Owner Financial ROI Calculator</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {roiMultiplier}x Net ROI
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Quantifies OEM liquidated damages, debit notes, and the payback period of this software for {company}.
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Top Big Impact Card */}
          <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-950 border border-rose-500/30 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block mb-1">
                  Current Monthly Financial Bleed (At {metrics.otifPercent}% OTIF)
                </span>
                <div className="text-3xl font-black font-mono text-white">
                  {currency}{totalMonthlyLoss.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Based on <strong className="text-rose-400 font-mono">{monthlyFailures} failed loads/month</strong> across OEM customers (Hyundai, Ashok Leyland, Lear).
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl text-right font-mono shrink-0">
                <span className="text-[11px] text-slate-400 block">Software Payback Speed:</span>
                <span className="text-xl font-black text-emerald-400 block mt-0.5">{paybackDays} Days</span>
                <span className="text-[10px] text-slate-500">Pays for itself in the first week</span>
              </div>
            </div>
          </div>

          {/* Interactive Cost Parameter Adjusters */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Adjust Factory Contract Assumptions:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">OEM Penalty per Fail:</label>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono">
                  <span className="text-slate-400">{currency}</span>
                  <input
                    type="number"
                    value={oemPenaltyPerFail}
                    onChange={e => setOemPenaltyPerFail(Number(e.target.value) || 0)}
                    className="w-full bg-transparent text-white font-bold focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">OEM avg: ₹25k - ₹50k</span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Expedited Freight per Late Load:</label>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono">
                  <span className="text-slate-400">{currency}</span>
                  <input
                    type="number"
                    value={expeditedFreightCost}
                    onChange={e => setExpeditedFreightCost(Number(e.target.value) || 0)}
                    className="w-full bg-transparent text-white font-bold focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Hot-shot dedicated trailer</span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Delayed Billing WIP Cost:</label>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono">
                  <span className="text-slate-400">{currency}</span>
                  <input
                    type="number"
                    value={delayedBillingInterest}
                    onChange={e => setDelayedBillingInterest(Number(e.target.value) || 0)}
                    className="w-full bg-transparent text-white font-bold focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">12% p.a. carry cost</span>
              </div>

              <div>
                <label className="text-emerald-400 font-semibold block mb-1">Software Price / Month:</label>
                <div className="flex items-center gap-1 bg-slate-900 border border-emerald-500/50 rounded-lg px-2.5 py-1.5 font-mono">
                  <span className="text-emerald-400 font-bold">{currency}</span>
                  <input
                    type="number"
                    step="500"
                    value={softwareSubscriptionCost}
                    onChange={e => setSoftwareSubscriptionCost(Number(e.target.value) || 0)}
                    className="w-full bg-transparent text-emerald-300 font-bold focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-emerald-400/80 mt-0.5 block">Your monthly fee</span>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden text-xs font-mono">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Financial Loss Category</th>
                  <th className="py-2.5 px-4">Fortnight Impact</th>
                  <th className="py-2.5 px-4">Projected Monthly Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                <tr>
                  <td className="py-2.5 px-4 text-slate-300">
                    OEM Liquidated Damages &amp; Line Stoppage Debits ({metrics.fails} loads)
                  </td>
                  <td className="py-2.5 px-4 text-rose-400 font-bold">{currency}{(totalFailures * oemPenaltyPerFail).toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 text-rose-400 font-bold">{currency}{debitNotesExposure.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-slate-300">
                    Expedited Special Freight &amp; Night Shift Overtime
                  </td>
                  <td className="py-2.5 px-4 text-amber-400 font-bold">{currency}{(totalFailures * expeditedFreightCost).toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 text-amber-400 font-bold">{currency}{expeditedFreightLoss.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-slate-300">
                    Stalled Work-in-Progress (WIP) Cash Carry Cost
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">{currency}{(totalFailures * delayedBillingInterest).toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 text-slate-300">{currency}{workingCapitalLoss.toLocaleString('en-IN')}</td>
                </tr>
                <tr className="bg-slate-950 font-bold">
                  <td className="py-3 px-4 text-white">Total Cost of Poor Delivery Quality (COPQ)</td>
                  <td className="py-3 px-4 text-rose-400">{currency}{(totalMonthlyLoss / 2).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-rose-400">{currency}{totalMonthlyLoss.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Software Investment vs Return Proposition */}
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                The Business Case for Purchasing This Software:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                By lifting gate OTIF from <strong className="text-white">50% to 85%</strong> (eliminating 70% of gate failures), you save <strong className="text-emerald-400 font-mono font-bold">{currency}{projectedSavings.toLocaleString('en-IN')} every month</strong> against an investment of only <strong className="text-white font-mono">{currency}{softwareSubscriptionCost.toLocaleString('en-IN')}/mo</strong>.
              </p>
            </div>

            <div className="bg-slate-900 border border-emerald-500/50 px-4 py-2.5 rounded-xl text-center shrink-0">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Net Annual Profit Gain:</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {currency}{(netMonthlyGain * 12).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Contract ROI Formula: (Savings - Cost) / Cost = {roiMultiplier}x
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
