import React from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Package, 
  Layers, 
  ShieldAlert, 
  ArrowUpRight,
  Sparkles,
  MapPin
} from 'lucide-react';
import { AuditItem, AuditRules, AuditSummary } from '../types/audit';
import { computePredictiveShortages, formatINR } from '../utils/auditCalculations';

interface PredictiveAnalyticsProps {
  items: AuditItem[];
  rules: AuditRules;
  summary: AuditSummary;
}

export const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({
  items,
  rules,
  summary,
}) => {
  const shortages = computePredictiveShortages(items, rules);

  // Group shrinkage by spot dynamically
  const shrinkageBySpot: Record<string, number> = {};
  items.forEach((item) => {
    if ((item.gapRupees ?? 0) < 0) {
      const spot = item.spot || 'Unassigned';
      shrinkageBySpot[spot] = (shrinkageBySpot[spot] || 0) + Math.abs(item.gapRupees ?? 0);
    }
  });

  const sortedSpots = Object.entries(shrinkageBySpot).sort((a, b) => b[1] - a[1]);
  const topSpotName = sortedSpots[0]?.[0] || 'Back rack';
  const topSpotValue = sortedSpots[0]?.[1] || 0;

  // Slotting efficiency: Fast movers at counter vs total fast movers
  const totalFastMovers = items.filter((it) => it.issuesPerMonth >= rules.fastMoverCutoff);
  const fastMoversAtCounter = totalFastMovers.filter((it) => it.spot.trim().toLowerCase() === 'counter');
  const slottingScore = totalFastMovers.length > 0 
    ? Math.round((fastMoversAtCounter.length / totalFastMovers.length) * 100)
    : 100;

  // Indian MSME Reality Metrics: Ghost Stock (Book > Physical) & Emergency Spot-Buy / Lost Counter Margin
  const ghostStockItems = items.filter((it) => it.physicalQty < it.systemQty);
  const criticalFastShortages = shortages.filter((s) => s.severity === 'critical');
  // In Indian EV/Spares depots, running out of a fast-moving A-item forces either a lost counter job (35% margin loss) or a 22% emergency local trader purchase premium
  const annualGhostShrinkageBleed = summary.shelfShortRupees * 4; // Quarterly cycle count extrapolated if unchecked
  const annualEmergencyPurchaseAndLostJobBleed = criticalFastShortages.reduce((acc, s) => {
    const matched = items.find((i) => i.code === s.code);
    const unitCost = matched?.cost || 500;
    return acc + Math.round(s.monthlyVelocity * unitCost * 0.25 * 12);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Slotting Efficiency */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Selling Face Slotting Efficiency
            </span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-white font-mono">{slottingScore}%</div>
            <div className="text-xs text-slate-300 mt-0.5">
              {fastMoversAtCounter.length} of {totalFastMovers.length} top velocity SKUs visible at counter
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                slottingScore >= 80
                  ? 'bg-emerald-500'
                  : slottingScore >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${slottingScore}%` }}
            />
          </div>
        </div>

        {/* Shrinkage Leakage by Zone */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Highest Shrinkage Zone (Blind Spot)
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-rose-400 font-mono">
              {topSpotName}: {formatINR(topSpotValue)}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              {ghostStockItems.length} SKUs have Tally Ghost Stock (Book &gt; Physical Hand Count)
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            {sortedSpots.slice(1, 3).map(([spot, val], idx) => (
              <React.Fragment key={spot}>
                {idx > 0 && <span>•</span>}
                <span>{spot}: {formatINR(val)}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Immediate Run-Out Risk */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Critical Stock Run-out Alert
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-amber-400 font-mono">
              {criticalFastShortages.length} SKUs &lt;15 Days
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              High-velocity parts about to cause service bay / counter turn-aways
            </div>
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            Est. Spot-Buy / Turn-Away Risk: {formatINR(annualEmergencyPurchaseAndLostJobBleed)}/yr
          </div>
        </div>
      </div>

      {/* Indian MSME Promoter Reality Panel: Ghost Stock & Emergency Spot-Buy Cost (Not Fake Walking Payroll) */}
      <div className="bg-gradient-to-r from-rose-950/30 via-slate-900 to-amber-950/20 border border-rose-500/30 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-mono uppercase font-bold">
              Indian MSME Promoter Commercial Case (Why Owners Pay For Bin Audits)
            </div>
            <h3 className="text-sm font-bold text-white">
              Stop Pitching &ldquo;Walking Distance Wage Savings&rdquo; — Pitch Ghost-Stock Pilferage &amp; Bay Stoppage Prevention
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Indian store helpers are paid a fixed monthly salary, so walking fewer steps does not reduce payroll. Promoters pay for <strong>BinAudit</strong> because Tally currently lies about <strong>{ghostStockItems.length} SKUs</strong> (showing stock on computer when the shelf is short by <strong>{formatINR(summary.shelfShortRupees)}</strong>), causing unrecorded pilferage/scrap and forcing 25% emergency local-market purchases when fast movers hit zero.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-slate-950/90 border border-rose-500/30 rounded-lg p-3 text-right">
              <div className="text-[10px] font-mono uppercase text-slate-400">Annualized Unchecked Shrinkage</div>
              <div className="text-lg font-black font-mono text-rose-400">{formatINR(annualGhostShrinkageBleed)}/yr</div>
              <div className="text-[10px] text-slate-500">Unbilled issues / theft / damage</div>
            </div>
            <div className="bg-slate-950/90 border border-amber-500/30 rounded-lg p-3 text-right">
              <div className="text-[10px] font-mono uppercase text-slate-400">Spot-Buy &amp; Lost Bay Margin</div>
              <div className="text-lg font-black font-mono text-amber-400">{formatINR(annualEmergencyPurchaseAndLostJobBleed)}/yr</div>
              <div className="text-[10px] text-slate-500">From {criticalFastShortages.length} critical stockout SKUs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Predictive Stock Shortage Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Predictive Stock Shortage &amp; Days of Inventory</span>
            </h3>
            <p className="text-xs text-slate-400">
              Anticipate stock-outs based on physical hand counts and verified 30-day velocity.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3 font-semibold">SKU Code</th>
                <th className="py-2.5 px-3 font-semibold">Part Name</th>
                <th className="py-2.5 px-3 font-semibold text-right">Physical Count</th>
                <th className="py-2.5 px-3 font-semibold text-right">Monthly Velocity</th>
                <th className="py-2.5 px-3 font-semibold text-right">Days Left</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Suggested Reorder (45-Day Cover)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {shortages.slice(0, 8).map((shortage) => (
                <tr key={shortage.code} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                    {shortage.code}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-white">
                    {shortage.part}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                    {shortage.physicalQty} pcs
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {shortage.monthlyVelocity} / mo
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    <span
                      className={
                        shortage.daysRemaining <= 15
                          ? 'text-rose-400'
                          : shortage.daysRemaining <= 30
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }
                    >
                      {shortage.daysRemaining} days
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        shortage.severity === 'critical'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : shortage.severity === 'warning'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {shortage.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-300">
                    +{shortage.recommendedReorderQty} units
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
