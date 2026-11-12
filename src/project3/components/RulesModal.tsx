import React from 'react';
import { X, RotateCcw, Info, Check } from 'lucide-react';
import { RulesConfig } from '../types/freight';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: RulesConfig;
  setRules: React.Dispatch<React.SetStateAction<RulesConfig>>;
  onResetData: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onClose,
  rules,
  setRules,
  onResetData
}) => {
  if (!isOpen) return null;

  const detentionPresets = [150, 200, 250, 300];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Audit Rules & Calibration</h2>
            <p className="text-xs text-slate-500 mt-0.5">Parameters governing rate leak formulas and detention valuation</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Rule 1: Hourly Detention Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-900">
                Hourly Detention Rate (₹ / hour)
              </label>
              <span className="text-xs font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                Yellow Cell: Interactive
              </span>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Ask him what an idle truck costs. If he does not know, <strong className="font-semibold text-slate-800">₹200 is a Chennai small-fleet default</strong>, not a bill. Change this if he says ₹150 or ₹300—the detention total moves in real-time.
            </p>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm font-mono">₹</span>
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={rules.detentionRatePerHour}
                  onChange={(e) => setRules(prev => ({ ...prev, detentionRatePerHour: Number(e.target.value) || 0 }))}
                  className="w-full pl-8 pr-3 py-2 text-sm font-mono font-semibold bg-amber-50/70 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex gap-1.5">
                {detentionPresets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRules(prev => ({ ...prev, detentionRatePerHour: preset }))}
                    className={`px-2.5 py-2 text-xs font-mono rounded-lg border transition-colors ${
                      rules.detentionRatePerHour === preset
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rule 2: Minimum Weight Threshold */}
          <div className="space-y-3 border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-900">
                Minimum Weight Benchmark Threshold (kg)
              </label>
              <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                Default: 500 kg
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ignore trips under 500 kg. A small parts van with one carton is not a lane rate. It must not become the “best” trip and make every real load look like a leak.
            </p>

            <div className="relative w-48">
              <input
                type="number"
                min="100"
                step="50"
                value={rules.minWeightThresholdKg}
                onChange={(e) => setRules(prev => ({ ...prev, minWeightThresholdKg: Number(e.target.value) || 0 }))}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-mono text-slate-500">kg</span>
            </div>
          </div>

          {/* Rule 2B: Rate Benchmark Basis (Per-Tonne vs Fixed Vehicle Trip) */}
          <div className="space-y-2.5 border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-900">
                Freight Rate Benchmark Basis
              </label>
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Counters Volume Objection
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Use <strong>Per-Tonne (₹/t)</strong> for heavy steel/forging loads, or switch to <strong>Fixed Lorry Trip (₹/trip)</strong> when transporters charge a flat vehicle rate for light/volumetric sheet-metal loads.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRules(prev => ({ ...prev, benchmarkMode: 'per_tonne' }))}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left transition ${
                  (rules.benchmarkMode || 'per_tonne') === 'per_tonne'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold">Per-Tonne Basis (₹/t)</div>
                <div className="text-[10px] opacity-80 font-mono">Leak = Bill − (Best ₹/t × Tonnes)</div>
              </button>
              <button
                type="button"
                onClick={() => setRules(prev => ({ ...prev, benchmarkMode: 'fixed_trip' }))}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left transition ${
                  rules.benchmarkMode === 'fixed_trip'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold">Fixed Vehicle Trip (₹/trip)</div>
                <div className="text-[10px] opacity-80 font-mono">Leak = Bill − Lowest Clean Lorry Bill</div>
              </button>
            </div>
          </div>

          {/* Rule 3: Audit Date Window */}
          <div className="space-y-3 border-t border-slate-200 pt-5">
            <label className="text-sm font-semibold text-slate-900">
              Audit Window (One Month)
            </label>
            <p className="text-xs text-slate-600 leading-relaxed">
              Window is 1 Sep 2026 to 30 Sep 2026. One month is the right first audit. A week is noise. A year is too much to copy from bills.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Start Date</span>
                <input
                  type="date"
                  value={rules.startDate}
                  onChange={(e) => setRules(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">End Date</span>
                <input
                  type="date"
                  value={rules.endDate}
                  onChange={(e) => setRules(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Reset button */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onResetData();
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Ambattur Sep 2026 Sample</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Apply & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
