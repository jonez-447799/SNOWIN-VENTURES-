import React, { useState, useMemo } from 'react';
import { Sliders, Sparkles, TrendingUp, CheckCircle2, X, Target, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { OTIFMetrics, RulesConfig, DispatchRow } from '../types/otif';
import { calculateRowStatus } from '../utils/otifCalculator';

interface WhatIfSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: OTIFMetrics;
  rules: RulesConfig;
  dispatches: DispatchRow[];
}

export const WhatIfSimulatorModal: React.FC<WhatIfSimulatorModalProps> = ({
  isOpen,
  onClose,
  metrics,
  rules,
  dispatches,
}) => {
  // Kaizen Operational Levers toggles
  const [fixMaterials, setFixMaterials] = useState(false);
  const [fixQC, setFixQC] = useState(false);
  const [fixTransport, setFixTransport] = useState(false);
  const [fixPaperwork, setFixPaperwork] = useState(false);
  const [add2hGrace, setAdd2hGrace] = useState(false);

  const {
    total,
    materialFailsCount,
    qcFailsCount,
    transportFailsCount,
    paperworkFailsCount,
    graceRecoverableCount,
    simulatedPasses,
    simulatedOTIF,
  } = useMemo(() => {
    const totalCount = dispatches.length || 1;
    const baseCalculated = dispatches.map(d => calculateRowStatus(d, rules));
    const graceRules: RulesConfig = { ...rules, graceHours: (rules.graceHours || 0) + 2 };

    let matFails = 0;
    let qcFails = 0;
    let transFails = 0;
    let paperFails = 0;
    let graceRecov = 0;
    let simPasses = 0;

    for (const r of baseCalculated) {
      if (!r.otif) {
        if (r.delayReason === 'Material short') matFails++;
        if (r.delayReason === 'QC hold') qcFails++;
        if (r.delayReason === 'No vehicle') transFails++;
        if (r.delayReason === 'Paperwork') paperFails++;

        const with2h = calculateRowStatus(r, graceRules);
        if (with2h.otif) graceRecov++;
      }

      // Evaluate whether this row passes under active simulation toggles
      let rowPasses = Boolean(r.otif);
      if (!rowPasses) {
        if (fixMaterials && r.delayReason === 'Material short') rowPasses = true;
        else if (fixQC && r.delayReason === 'QC hold') rowPasses = true;
        else if (fixTransport && r.delayReason === 'No vehicle') rowPasses = true;
        else if (fixPaperwork && r.delayReason === 'Paperwork') rowPasses = true;
        else if (add2hGrace && calculateRowStatus(r, graceRules).otif) rowPasses = true;
      }
      if (rowPasses) simPasses++;
    }

    return {
      total: dispatches.length,
      materialFailsCount: matFails,
      qcFailsCount: qcFails,
      transportFailsCount: transFails,
      paperworkFailsCount: paperFails,
      graceRecoverableCount: graceRecov,
      simulatedPasses: simPasses,
      simulatedOTIF: totalCount > 0 ? Math.round((simPasses / totalCount) * 100) : 0,
    };
  }, [dispatches, rules, fixMaterials, fixQC, fixTransport, fixPaperwork, add2hGrace]);

  if (!isOpen) return null;

  const otifGain = simulatedOTIF - metrics.otifPercent;
  const pctImpact = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

  // Vendor tier rating status
  const getVendorTier = (score: number) => {
    if (score >= 90) return { label: 'Green / Preferred Supplier (World Class)', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40' };
    if (score >= 85) return { label: 'Green / OEM SLA Compliant', color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30' };
    if (score >= 70) return { label: 'Amber / Monitored Status (Passing)', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40' };
    return { label: 'Red / Critical De-Sourcing Risk', color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/40' };
  };

  const currentTier = getVendorTier(metrics.otifPercent);
  const projectedTier = getVendorTier(simulatedOTIF);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>"What-If" Operational Kaizen Forecaster</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Scenario Simulator
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Simulate next fortnight's score by testing operational improvements before executing them.
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
          {/* Comparison Scoreboard */}
          <div className="grid grid-cols-2 gap-4">
            {/* Current Baseline */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-mono block uppercase">Current Baseline OTIF:</span>
              <div className="text-3xl font-black font-mono text-slate-300">{metrics.otifPercent}%</div>
              <span className="text-xs text-slate-400 block font-mono">({metrics.passes} of {total} loads)</span>
              <div className={`mt-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${currentTier.bg} ${currentTier.color}`}>
                {currentTier.label}
              </div>
            </div>

            {/* Projected Simulation */}
            <div className="bg-gradient-to-br from-emerald-950/40 to-slate-950 p-4 rounded-xl border border-emerald-500/40 space-y-1 relative overflow-hidden">
              <span className="text-[11px] text-emerald-400 font-mono block uppercase font-bold">
                Projected Simulated OTIF:
              </span>
              <div className="text-3xl font-black font-mono text-emerald-400 flex items-baseline gap-2">
                <span>{simulatedOTIF}%</span>
                {otifGain > 0 && (
                  <span className="text-xs text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    +{otifGain}% Gain
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-300 block font-mono">({simulatedPasses} of {total} loads)</span>
              <div className={`mt-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${projectedTier.bg} ${projectedTier.color}`}>
                {projectedTier.label}
              </div>
            </div>
          </div>

          {/* Interactive Kaizen Levers */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Toggle Operational Interventions:
            </span>

            <div className="space-y-2">
              {/* Lever 1 */}
              <label className="flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800/60 rounded-xl border border-slate-800 cursor-pointer transition">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">1. Eliminate Raw Material Shortages</span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                      +{pctImpact(materialFailsCount)}% Impact ({materialFailsCount} {materialFailsCount === 1 ? 'load' : 'loads'})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Enforce 5-day safety stock buffer on EN8D bars &amp; sheet coils.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={fixMaterials}
                  onChange={e => setFixMaterials(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              {/* Lever 2 */}
              <label className="flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800/60 rounded-xl border border-slate-800 cursor-pointer transition">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">2. In-Line Quality Sign-Off (Zero Gate QC Holds)</span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                      +{pctImpact(qcFailsCount)}% Impact ({qcFailsCount} {qcFailsCount === 1 ? 'load' : 'loads'})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Move salt-spray plating tests to line exit 4 hours before vehicle arrives.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={fixQC}
                  onChange={e => setFixQC(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              {/* Lever 3 */}
              <label className="flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800/60 rounded-xl border border-slate-800 cursor-pointer transition">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">3. Transporter Demurrage SLA Enforcement</span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                      +{pctImpact(transportFailsCount)}% Impact ({transportFailsCount} {transportFailsCount === 1 ? 'load' : 'loads'})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Pre-book dedicated trailers 3 hours in advance with late arrival penalty.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={fixTransport}
                  onChange={e => setFixTransport(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              {/* Lever 4 */}
              <label className="flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800/60 rounded-xl border border-slate-800 cursor-pointer transition">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">4. E-Way Bill &amp; ERP Automation</span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                      +{pctImpact(paperworkFailsCount)}% Impact ({paperworkFailsCount} {paperworkFailsCount === 1 ? 'load' : 'loads'})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Generate gate pass and e-way bill during afternoon shift to avoid portal downtime.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={fixPaperwork}
                  onChange={e => setFixPaperwork(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              {/* Lever 5: +2h Written Grace Window */}
              <label className="flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800/60 rounded-xl border border-slate-800 cursor-pointer transition">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">5. Negotiate +2h Same-Day Written OEM Grace</span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                      +{pctImpact(graceRecoverableCount)}% Impact ({graceRecoverableCount} {graceRecoverableCount === 1 ? 'load' : 'loads'})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Simulate formal contract addendum permitting a 2-hour gate-out buffer on same-day loads.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={add2hGrace}
                  onChange={e => setAdd2hGrace(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {otifGain > 0 ? `Targeted Kaizen unlocks +${otifGain}% delivery performance` : 'Select levers above'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition cursor-pointer shadow-md"
          >
            Done Simulating
          </button>
        </div>
      </div>
    </div>
  );
};
