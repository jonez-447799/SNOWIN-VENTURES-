import React, { useState } from 'react';
import { TrendingUp, AlertOctagon, ShieldCheck, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { AuditTotals, ScaleProfile } from '../types/freight';
import { formatINR } from '../utils/auditCalculations';

interface RateDriftSimulatorProps {
  totals: AuditTotals;
  currentScale: ScaleProfile;
}

export const RateDriftSimulator: React.FC<RateDriftSimulatorProps> = ({
  totals,
  currentScale
}) => {
  const [retainerFeeINR, setRetainerFeeINR] = useState<number>(7500);

  const baseMonthlyLeak = totals.totalLeak * currentScale.multiplier;
  const baseMonthlyFreight = totals.freightPaid * currentScale.multiplier;

  // 6-Month Drift Trajectory without ongoing audit
  // Month 1: Full audit, leak reduced to 0
  // Month 2: Transporter tests vigilance (+20% leak creeps back)
  // Month 3: Clerk stops checking gate book (+50% leak creeps back)
  // Month 4: +70% leak creeps back
  // Month 5: +85% leak creeps back
  // Month 6: +95% leak creeps back
  const driftPercentages = [0, 0.20, 0.50, 0.70, 0.85, 0.95];

  const cumulativeLeakWithoutAudit = driftPercentages.reduce((acc, pct) => {
    return acc + Math.round(baseMonthlyLeak * pct);
  }, 0);

  // With retainer: Leak kept locked at ~5% noise level
  const cumulativeLeakWithAudit = driftPercentages.length * Math.round(baseMonthlyLeak * 0.05);
  const retainerCost6Months = retainerFeeINR * 6;

  const netRetainerROI = cumulativeLeakWithoutAudit - (cumulativeLeakWithAudit + retainerCost6Months);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded">
            Retention Defense Model
          </span>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Hurdle #3: Proving Recurring Monthly Value
          </span>
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
          The Rate Drift Reality (Why One-Time Audits Fail)
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1">
          If a factory owner audits once and stops, transporters gradually test the owner’s attention. 
          Within 90 days, freight rates creep back up by 15–20% per tonne. This simulation proves to the owner why an ongoing retainer protects net profits.
        </p>
      </div>

      {/* 6-Month Timeline Visualizer */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
          6-Month Rate Creep Projection Without Ongoing Audit
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { month: 'Month 1', label: 'Post-Audit', leakPct: 0, tag: 'Clean Rates' },
            { month: 'Month 2', label: 'Vigilance Slips', leakPct: 20, tag: 'First Creep' },
            { month: 'Month 3', label: 'Book Ignored', leakPct: 50, tag: 'Half Reverted' },
            { month: 'Month 4', label: 'Spot Rates Slip', leakPct: 70, tag: 'Heavy Leak' },
            { month: 'Month 5', label: 'Detention Unchecked', leakPct: 85, tag: 'Old Habits' },
            { month: 'Month 6', label: 'Full Relapse', leakPct: 95, tag: 'Complete Loss' }
          ].map((item, idx) => {
            const monthlyCreep = Math.round(baseMonthlyLeak * (item.leakPct / 100));
            return (
              <div
                key={item.month}
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  item.leakPct === 0
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : item.leakPct <= 50
                    ? 'border-amber-200 bg-amber-50/40'
                    : 'border-rose-200 bg-rose-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{item.month}</span>
                    <span className="font-bold">{item.tag}</span>
                  </div>
                  <strong className="text-xs font-bold text-slate-900 block mt-1">{item.label}</strong>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-500 block">Money Re-Leaking</span>
                  <strong className={`font-mono text-sm block ${
                    item.leakPct === 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {item.leakPct === 0 ? '₹0' : `+${formatINR(monthlyCreep)}`}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Comparison Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <span className="text-[11px] font-mono text-slate-500 block">Cumulative 6-Mo Unmonitored Waste</span>
          <div className="text-xl font-black font-mono text-rose-600 mt-1">
            {formatINR(cumulativeLeakWithoutAudit)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Money quietly surrendered back to transporters if no monthly check exists.
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <span className="text-[11px] font-mono text-slate-500 block">6-Month Retainer Investment</span>
          <div className="text-xl font-black font-mono text-slate-900 mt-1">
            {formatINR(retainerCost6Months)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            ₹{retainerFeeINR.toLocaleString('en-IN')}/month fee to lock rates and audit gate books.
          </span>
        </div>

        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4">
          <span className="text-[11px] font-mono text-emerald-800 font-bold block">Net Owner Value Created</span>
          <div className="text-xl font-black font-mono text-emerald-900 mt-1">
            {formatINR(Math.max(0, netRetainerROI))}
          </div>
          <span className="text-xs text-emerald-950/80 mt-1 block">
            Guaranteed net savings after paying the monthly audit retainer.
          </span>
        </div>
      </div>
    </div>
  );
};
