import React from 'react';
import { RulesConfig, UserRole } from '../types';
import { Sliders, RotateCcw, AlertCircle, Info, Sparkles, Building2, Factory, Warehouse } from 'lucide-react';

interface RulesSheetProps {
  rules: RulesConfig;
  onUpdateRules: (newRules: RulesConfig) => void;
  onResetRules: () => void;
  userRole: UserRole;
}

export const RulesSheet: React.FC<RulesSheetProps> = ({
  rules,
  onUpdateRules,
  onResetRules,
  userRole,
}) => {
  const handleChange = (field: keyof RulesConfig, val: any) => {
    onUpdateRules({
      ...rules,
      [field]: field === 'asOfDate' ? val : Number(val) || 0,
    });
  };

  const applyPreset = (preset: Partial<RulesConfig>) => {
    onUpdateRules({
      ...rules,
      ...preset,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Concept */}
      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Rules Sheet: The Six Yellow Driving Cells</span>
          </h2>
          <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1 leading-relaxed">
            These six yellow cells drive every formula in the entire application. Change any cell here, and the Owner Report, Stock Engine, and Annual Burn numbers recalculate instantly.
          </p>
        </div>

        <button
          onClick={onResetRules}
          className="px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors flex items-center gap-1.5 self-start md:self-auto shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Defaults</span>
        </button>
      </div>

      {/* 2. Industry Presets */}
      <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Quick Industry Presets
        </span>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() =>
              applyPreset({
                deadThresholdDays: 180,
                slowThresholdDays: 90,
                holdingCostPercent: 18,
                classACutoff: 80,
                classBCutoff: 95,
              })
            }
            className="p-3 text-left rounded border border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500 transition-colors"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
              <Factory className="w-3.5 h-3.5 text-amber-600" />
              <span>Ambattur Fabrication Unit</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              180d Dead · 90d Slow · 18% p.a.
            </div>
          </button>

          <button
            onClick={() =>
              applyPreset({
                deadThresholdDays: 60,
                slowThresholdDays: 30,
                holdingCostPercent: 24,
                classACutoff: 75,
                classBCutoff: 90,
              })
            }
            className="p-3 text-left rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 hover:border-neutral-400 transition-colors"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Food / Perishables</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              60d Dead · 30d Slow · 24% p.a.
            </div>
          </button>

          <button
            onClick={() =>
              applyPreset({
                deadThresholdDays: 365,
                slowThresholdDays: 180,
                holdingCostPercent: 14,
                classACutoff: 85,
                classBCutoff: 95,
              })
            }
            className="p-3 text-left rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 hover:border-neutral-400 transition-colors"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
              <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
              <span>Steel Yard / Heavy Stock</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              365d Dead · 180d Slow · 14% p.a.
            </div>
          </button>

          <button
            onClick={() =>
              applyPreset({
                deadThresholdDays: 120,
                slowThresholdDays: 60,
                holdingCostPercent: 22,
                classACutoff: 80,
                classBCutoff: 95,
              })
            }
            className="p-3 text-left rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 hover:border-neutral-400 transition-colors"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Electronics / High Tech</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              120d Dead · 60d Slow · 22% p.a.
            </div>
          </button>
        </div>
      </div>

      {/* 3. The 6 Yellow Cells Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cell 1: As-of Date */}
        <div className="p-5 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                Cell 1: As-of Date
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-semibold">
                Yellow Cell
              </span>
            </div>
            <div className="mt-3">
              <input
                type="date"
                value={rules.asOfDate}
                onChange={(e) => handleChange('asOfDate', e.target.value)}
                className="w-full text-sm font-mono font-bold p-2.5 rounded bg-white dark:bg-neutral-900 border border-amber-300 dark:border-amber-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              This is <strong>“today”</strong> for the audit. On a real job, put the day you received the file from the owner. Days idle is this date minus the last movement date.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-900/60 text-[11px] text-neutral-500 font-mono">
            Default: 2026-10-01 (1 Oct 2026)
          </div>
        </div>

        {/* Cell 2: Dead if idle at least */}
        <div className="p-5 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                Cell 2: Dead Threshold (Days)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-semibold">
                Yellow Cell
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min="30"
                max="730"
                value={rules.deadThresholdDays}
                onChange={(e) => handleChange('deadThresholdDays', e.target.value)}
                className="w-full text-base font-mono font-bold p-2.5 rounded bg-white dark:bg-neutral-900 border border-amber-300 dark:border-amber-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-neutral-500">Days</span>
            </div>
            <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              <strong>Six months (180 days)</strong> is the normal first cut for a fabrication unit. It is not a law. Start at 180 unless the owner tells you his trade dies faster.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-900/60 text-[11px] text-neutral-500 font-mono">
            Default: 180 days (~6 months)
          </div>
        </div>

        {/* Cell 3: Slow if idle at least */}
        <div className="p-5 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                Cell 3: Slow Threshold (Days)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-semibold">
                Yellow Cell
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min="15"
                max="365"
                value={rules.slowThresholdDays}
                onChange={(e) => handleChange('slowThresholdDays', e.target.value)}
                className="w-full text-base font-mono font-bold p-2.5 rounded bg-white dark:bg-neutral-900 border border-amber-300 dark:border-amber-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-neutral-500">Days</span>
            </div>
            <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Quiet, but not dead. 90 to 179 days. Action for these items: <strong>Freeze purchase</strong>. Do not reorder them, but do not scrap them yet.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-900/60 text-[11px] text-neutral-500 font-mono">
            Default: 90 days (~3 months)
          </div>
        </div>

        {/* Cell 4: Class A Cutoff */}
        <div className="p-5 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                Cell 4: Class A Cutoff (%)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-semibold">
                Yellow Cell
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min="50"
                max="90"
                value={rules.classACutoff}
                onChange={(e) => handleChange('classACutoff', e.target.value)}
                className="w-full text-base font-mono font-bold p-2.5 rounded bg-white dark:bg-neutral-900 border border-amber-300 dark:border-amber-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-neutral-500">%</span>
            </div>
            <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Sort items from largest closing value down. Walk down until you cover 80% of total stock. Those are <strong>Class A</strong>. A dead A-item is an emergency because it is a lot of money.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-900/60 text-[11px] text-neutral-500 font-mono">
            Default: 80% (Pareto top tier)
          </div>
        </div>

        {/* Cell 5: Class B Cutoff */}
        <div className="p-5 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                Cell 5: Class B Cutoff (%)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-semibold">
                Yellow Cell
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min="80"
                max="99"
                value={rules.classBCutoff}
                onChange={(e) => handleChange('classBCutoff', e.target.value)}
                className="w-full text-base font-mono font-bold p-2.5 rounded bg-white dark:bg-neutral-900 border border-amber-300 dark:border-amber-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-neutral-500">%</span>
            </div>
            <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              The next slice, up to 95%, is <strong>Class B</strong>. Whatever is left is <strong>Class C</strong>. A dead C-item is a cleanup because it is cheap.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-900/60 text-[11px] text-neutral-500 font-mono">
            Default: 95% (Class C is remaining 5%)
          </div>
        </div>

        {/* Cell 6: Holding Cost Per Year */}
        <div className="p-5 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                Cell 6: Holding Cost Rate (%)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-semibold">
                Yellow Cell
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="50"
                value={rules.holdingCostPercent}
                onChange={(e) => handleChange('holdingCostPercent', e.target.value)}
                className="w-full text-base font-mono font-bold p-2.5 rounded bg-white dark:bg-neutral-900 border border-amber-300 dark:border-amber-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-neutral-500">% p.a.</span>
            </div>
            <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Indian SME working-capital interest sits around <strong>11–14%</strong>, plus shed rent, rust, theft, obsolescence. 18% is the factory standard. If he says <em>"my OD is 12%,"</em> change this to 12%. Do not invent a lower number to make the story softer.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-900/60 text-[11px] text-neutral-500 font-mono">
            Default: 18% per year
          </div>
        </div>
      </div>
    </div>
  );
};
