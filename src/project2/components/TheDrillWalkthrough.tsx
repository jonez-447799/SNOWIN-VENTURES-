import React from 'react';
import { Target, CheckCircle2, ArrowRight, Play, RotateCcw, Sparkles, Check, HelpCircle } from 'lucide-react';
import { DispatchRow, OTIFMetrics, RulesConfig } from '../types/otif';
import { calculateRowStatus, calculateOTIFMetrics } from '../utils/otifCalculator';

interface TheDrillWalkthroughProps {
  dispatches: DispatchRow[];
  rules: RulesConfig;
  onUpdateDispatch: (id: string, updates: Partial<DispatchRow>) => void;
  onNavigateToSheet: () => void;
  onNavigateToReport: () => void;
}

export const TheDrillWalkthrough: React.FC<TheDrillWalkthroughProps> = ({
  dispatches,
  rules,
  onUpdateDispatch,
  onNavigateToSheet,
  onNavigateToReport,
}) => {
  // Find drill item 1: Royal Enfield flange 80NB (disp-06)
  const item1 = dispatches.find(d => d.part.toLowerCase().includes('flange 80nb')) || dispatches[5];
  const item1Status = item1 ? calculateRowStatus(item1, rules) : null;
  const isStep1Flipped = item1 && item1.shippedQty === 40;
  const isStep1Original = item1 && item1.shippedQty === 28;

  // Find drill item 2: Ashok Leyland base frame (disp-11)
  const item2 = dispatches.find(d => d.part.toLowerCase().includes('base frame')) || dispatches[10];
  const item2Status = item2 ? calculateRowStatus(item2, rules) : null;
  const isStep2Flipped = item2 && item2.actualOut.includes('19T17:00');
  const isStep2Original = item2 && item2.actualOut.includes('20T10:30');

  const currentMetrics = calculateOTIFMetrics(dispatches, rules);

  const handleStep1Flip = () => {
    if (!item1) return;
    onUpdateDispatch(item1.id, { shippedQty: 40 });
  };

  const handleStep1Revert = () => {
    if (!item1) return;
    onUpdateDispatch(item1.id, { shippedQty: 28 });
  };

  const handleStep2Flip = () => {
    if (!item2) return;
    onUpdateDispatch(item2.id, { actualOut: '2026-09-19T17:00' });
  };

  const handleStep2Revert = () => {
    if (!item2) return;
    onUpdateDispatch(item2.id, { actualOut: '2026-09-20T10:30' });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Intro hero banner */}
      <div className="industrial-card rounded-xl p-6 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900 text-amber-300 border border-slate-750">
                Interactive Simulation
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">Real-Time Dual OTIF Engine Simulator</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Experience the dual-logic OTIF mathematical engine in real time. 
              Observe how on-the-fly corrections in quantity fulfillment (In-Full) or gate-out dispatch timing (On-Time) instantly cascade into factory SLA metrics, penalty debits, and customer scorecards.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-slate-400">
              <span>Current Score: <strong className="text-amber-400 font-bold">{currentMetrics.passes} of {currentMetrics.totalDispatches} passes ({currentMetrics.otifPercent}%)</strong></span>
              <span>·</span>
              <span>Target 1: Royal Enfield Flange 80NB</span>
              <span>·</span>
              <span>Target 2: Ashok Leyland Base Frame</span>
            </div>
          </div>
        </div>
      </div>

      {/* Drill Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* STEP 1: QUANTITY FLIP */}
        <div className={`industrial-card rounded-xl p-5 space-y-4 transition ${
          isStep1Flipped ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-slate-900 text-amber-300 border border-slate-750 flex items-center justify-center text-xs font-bold font-mono">
                1
              </span>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Flip 1: In-Full Test (Royal Enfield)</h3>
            </div>
            {isStep1Flipped ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" /> Flipped (Passed)
              </span>
            ) : (
              <span className="text-xs font-mono text-slate-400">Benchmark State</span>
            )}
          </div>

          <div className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <p>
              Find <strong className="text-white">Royal Enfield supplier</strong>, part <strong className="text-amber-300">flange 80NB</strong>.
            </p>
            <p className="text-slate-400 font-mono">
              Ordered: 40 | Shipped: <span className="text-white font-bold">{item1?.shippedQty}</span> | On-Time: <span className="text-emerald-400 font-bold">Yes</span> | In-Full: <span className={item1Status?.inFull ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{item1Status?.inFull ? 'Yes' : 'No'}</span>
            </p>
            <p className="text-slate-400">
              The truck left early (14:30 vs 16:00 promised), but with 28 of 40 shipped. In full failed, so OTIF failed.
            </p>
          </div>

          {/* Impact preview */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs space-y-2">
            <div className="text-slate-400 font-medium">Expected Engine Reaction:</div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block">Row OTIF:</span>
                <span className={`font-bold ${item1Status?.otif ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item1Status?.otif ? 'PASS ✓' : 'FAIL ✗ (Short)'}
                </span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block">Owner Report Passes:</span>
                <span className="text-amber-300 font-bold">
                  {currentMetrics.passes} of {currentMetrics.totalDispatches} ({currentMetrics.otifPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Interactive controls */}
          <div className="flex items-center gap-2 pt-1">
            {!isStep1Flipped ? (
              <button
                onClick={handleStep1Flip}
                className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Change Shipped Qty to 40</span>
              </button>
            ) : (
              <button
                onClick={handleStep1Revert}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Put Shipped Back to 28</span>
              </button>
            )}
          </div>
        </div>

        {/* STEP 2: TIME FLIP */}
        <div className={`industrial-card rounded-xl p-5 space-y-4 transition ${
          isStep2Flipped ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-slate-900 text-amber-300 border border-slate-750 flex items-center justify-center text-xs font-bold font-mono">
                2
              </span>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Flip 2: On-Time Test (Ashok Leyland)</h3>
            </div>
            {isStep2Flipped ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" /> Flipped (Passed)
              </span>
            ) : (
              <span className="text-xs font-mono text-slate-400">Benchmark State</span>
            )}
          </div>

          <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1">
            <p>
              Find <strong className="text-white">Ashok Leyland line</strong>, part <strong className="text-amber-300 font-mono">base frame</strong>.
            </p>
            <p className="text-slate-400 font-mono">
              Promised: 19 Sep 18:00 | Actual Out: <span className="text-white font-bold">{item2?.actualOut.replace('T', ' ')}</span> | Reason: <span className="text-rose-400 font-bold">{item2?.delayReason}</span>
            </p>
            <p className="text-slate-400">
              Quantity was already 12 of 12 (100% full), but the truck left late next morning due to no vehicle.
            </p>
          </div>

          {/* Impact preview */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs space-y-2">
            <div className="text-slate-400 font-medium">Expected Engine Reaction:</div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block">Row On-Time:</span>
                <span className={`font-bold ${item2Status?.onTime ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item2Status?.onTime ? 'YES ✓' : 'NO ✗ (Late)'}
                </span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block">Row OTIF:</span>
                <span className={`font-bold ${item2Status?.otif ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item2Status?.otif ? 'PASS ✓' : 'FAIL ✗'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive controls */}
          <div className="flex items-center gap-2 pt-1">
            {!isStep2Flipped ? (
              <button
                onClick={handleStep2Flip}
                className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Change Actual Out to 19 Sep 17:00</span>
              </button>
            ) : (
              <button
                onClick={handleStep2Revert}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Put Actual Out Back to 20 Sep 10:30</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Drill Takeaway Callout */}
      <div className="industrial-card rounded-xl p-5 space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          <span>Why This Drill Matters When You Pitch the Owner</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="space-y-1 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-white block">1. Early and complete is the only pass:</span>
            <p className="text-slate-400 leading-relaxed">
              If an operator rushes a truck out on time with only 28 of 40 pieces, the owner still gets shouted at. 
              The engine catches this instantly.
            </p>
          </div>
          <div className="space-y-1 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-white block">2. Invoices lie, security gate registers do not:</span>
            <p className="text-slate-400 leading-relaxed">
              Dispatch desks often print invoices at 17:30 to show "dispatch ready," but the vehicle leaves the next morning at 10:30. 
              The security gate out-stamp is the only true clock.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onNavigateToSheet}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Dispatches Spreadsheet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onNavigateToReport}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow"
          >
            <span>Check Owner Report Score</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
