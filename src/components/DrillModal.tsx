import React from 'react';
import { StockItem, RulesConfig, CurrencyCode } from '../types';
import { formatCurrency, generateOwnerReport } from '../utils/calculations';
import { X, PlayCircle, CheckCircle2, RotateCcw, ArrowRight, HelpCircle } from 'lucide-react';

interface DrillModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: StockItem[];
  rules: RulesConfig;
  currency: CurrencyCode;
  onUpdateItemMovement: (itemId: string, newDate: string, logMsg: string) => void;
}

export const DrillModal: React.FC<DrillModalProps> = ({
  isOpen,
  onClose,
  items,
  rules,
  currency,
  onUpdateItemMovement,
}) => {
  if (!isOpen) return null;

  const ssFlange = items.find((i) => i.id === 'sku-02' || i.itemName.includes('SS flange'));
  const summary = generateOwnerReport(items, rules);

  const handleSep = () => {
    if (!ssFlange) return;
    onUpdateItemMovement(
      ssFlange.id,
      '2026-09-01',
      'The Drill: Changed SS flange 150NB date to 01-Sep-2026 (moved ~30 days before as-of date).'
    );
  };

  const handleJan = () => {
    if (!ssFlange) return;
    onUpdateItemMovement(
      ssFlange.id,
      '2026-01-01',
      'The Drill: Changed SS flange 150NB date to 01-Jan-2026 (idle 273 days).'
    );
  };

  const handleReset = () => {
    if (!ssFlange) return;
    onUpdateItemMovement(
      ssFlange.id,
      '2026-02-11',
      'The Drill: Restored SS flange 150NB date back to original baseline (11-Feb-2026).'
    );
  };

  const isSepActive = ssFlange?.lastMovement === '2026-09-01';
  const isJanActive = ssFlange?.lastMovement === '2026-01-01';
  const isBaseline = ssFlange?.lastMovement === '2026-02-11';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <PlayCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
              The Drill: Interactive Verification
            </h2>
            <p className="text-xs text-neutral-500">
              Follow along step-by-step to master how the engine mechanics calculate dead cash.
            </p>
          </div>
        </div>

        {/* Target Item Status Card */}
        <div className="mt-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Target Item Under Observation
          </div>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                {ssFlange?.itemName || 'SS flange 150NB'}
              </div>
              <div className="text-xs font-mono text-neutral-400">
                Code: {ssFlange?.itemCode} · Qty: {ssFlange?.qtyOnHand} @ {formatCurrency(ssFlange?.costRate || 1850, currency)}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-mono font-bold text-neutral-900 dark:text-neutral-100">
                Value: {formatCurrency(ssFlange?.closingValue || 46250, currency)}
              </div>
              <div className="text-xs font-mono text-neutral-500">
                Movement: <strong className="text-amber-700 dark:text-amber-400">{ssFlange?.lastMovement}</strong> ({ssFlange?.daysIdle}d idle)
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700/60 text-xs">
            <span>Status: <strong className={ssFlange?.status === 'Dead' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>{ssFlange?.status}</strong></span>
            <span>Total Dead Cash on Books: <strong className="font-mono text-rose-600 dark:text-rose-400 font-bold">{formatCurrency(summary.deadCash, currency)}</strong></span>
          </div>
        </div>

        {/* Drill Step Actions */}
        <div className="mt-5 space-y-3">
          {/* Step 1 */}
          <div className={`p-3.5 rounded-lg border transition-all ${
            isSepActive
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-neutral-200 dark:border-neutral-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-mono font-bold flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Change date to 01-Sep-2026
                </span>
              </div>
              <button
                onClick={handleSep}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  isSepActive
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200'
                }`}
              >
                {isSepActive ? 'Applied ✓' : 'Execute Step 1'}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              September is ~30 days before 1 Oct 2026. Status flips from <strong>Dead</strong> to <strong>Moving</strong>. Dead cash falls by <strong>₹46,250</strong> to <strong>₹1,76,860</strong>. Owner report drops this flange off the dead hitlist.
            </p>
          </div>

          {/* Step 2 */}
          <div className={`p-3.5 rounded-lg border transition-all ${
            isJanActive
              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
              : 'border-neutral-200 dark:border-neutral-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-xs font-mono font-bold flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Change date to 01-Jan-2026
                </span>
              </div>
              <button
                onClick={handleJan}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  isJanActive
                    ? 'bg-rose-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200'
                }`}
              >
                {isJanActive ? 'Applied ✓' : 'Execute Step 2'}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              January is 273 days before 1 Oct (more than 180 days). The flange stays <strong>Dead</strong>. The idle-days number gets longer, but total dead rupees do not change because it was already counted inside the dead pile.
            </p>
          </div>

          {/* Step 3: Reset */}
          <div className={`p-3.5 rounded-lg border transition-all ${
            isBaseline
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-neutral-200 dark:border-neutral-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-xs font-mono font-bold flex items-center justify-center">
                  3
                </span>
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Put the date back to 11-Feb-2026
                </span>
              </div>
              <button
                onClick={handleReset}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  isBaseline
                    ? 'bg-amber-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200'
                }`}
              >
                {isBaseline ? 'Baseline Restored ✓' : 'Restore Baseline'}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              Restores original sample state (Dead cash = ₹2,23,110, Flange idle 232 days) before closing the drill.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className="text-xs text-neutral-400">
            If numbers move exactly as described, you understand the engine mechanic.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded hover:opacity-90 transition-opacity"
          >
            Done with Drill
          </button>
        </div>
      </div>
    </div>
  );
};
