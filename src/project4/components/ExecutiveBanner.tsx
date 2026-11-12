import React, { useState } from 'react';
import { 
  AlertOctagon, 
  PackagePlus, 
  ArrowDownRight, 
  EyeOff, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Check, 
  Layers,
  Store,
  ShieldAlert
} from 'lucide-react';
import { AuditSummary } from '../types/audit';
import { formatINR } from '../utils/auditCalculations';

interface ExecutiveBannerProps {
  summary: AuditSummary;
  onFilterDiscrepancies: () => void;
  onFilterHiddenFastMovers: () => void;
  onFilterFoundStock: () => void;
  onFilterAll: () => void;
  activeFilter: string;
}

export const ExecutiveBanner: React.FC<ExecutiveBannerProps> = ({
  summary,
  onFilterDiscrepancies,
  onFilterHiddenFastMovers,
  onFilterFoundStock,
  onFilterAll,
  activeFilter,
}) => {
  const [copied, setCopied] = useState(false);

  // Exact sentence required by prompt
  const executiveSentence = `Counted ${summary.skusCounted} SKUs, shelf short by ${formatINR(
    summary.shelfShortRupees
  )}, long by ${formatINR(summary.foundStockRupees)}, ${summary.fastMoversHidden} fast movers hidden.`;

  const copySentence = () => {
    navigator.clipboard.writeText(
      `*AeroVolt EV Spares - Pre-Shutter Bin Audit Report*\n` +
      `Date: 1 Oct 2026\n\n` +
      `• ${executiveSentence}\n` +
      `• Discrepancy lines: ${summary.linesMismatch} of ${summary.skusCounted} (${summary.linesMatched} matched)\n` +
      `• Immediate action: Move 4 fast sellers to front counter; investigate ₹24,240 shrinkage.`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Primary Thematic Sentence Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-2 border-amber-500/40 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                Executive Owner Sentence
              </span>
              <span className="text-xs text-slate-400">
                What you are actually selling: Rupee gap &amp; hidden fast movers
              </span>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-extrabold text-white tracking-tight leading-snug">
              &ldquo;{executiveSentence}&rdquo;
            </p>
            <p className="text-xs sm:text-sm text-slate-300">
              The billing screen says we have it, but the boy cannot find it while the customer stands at the counter.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copySentence}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 hover:border-slate-600 transition-all active:scale-95 shadow-sm"
              title="Copy WhatsApp report summary for owner"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy for Owner WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 6 Key Scorecard Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Missing Rupees */}
        <button
          onClick={onFilterDiscrepancies}
          className={`text-left p-3.5 rounded-xl border transition-all ${
            activeFilter === 'discrepancy'
              ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-rose-800/60 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-400 font-semibold mb-1">
            <span>Missing Rupees</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono tracking-tight">
            {formatINR(summary.shelfShortRupees)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Shelf short by {formatINR(summary.shelfShortRupees)}
          </div>
        </button>

        {/* Metric 2: Found Stock */}
        <button
          onClick={onFilterFoundStock}
          className={`text-left p-3.5 rounded-xl border transition-all ${
            activeFilter === 'found_stock'
              ? 'bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-cyan-800/60 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold mb-1">
            <span>Found Stock</span>
            <PackagePlus className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-300 font-mono tracking-tight">
            +{formatINR(summary.foundStockRupees)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Unentered inward stock
          </div>
        </button>

        {/* Metric 3: Lines Mismatch */}
        <button
          onClick={onFilterDiscrepancies}
          className={`text-left p-3.5 rounded-xl border transition-all ${
            activeFilter === 'discrepancy'
              ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-amber-800/60 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-1">
            <span>Lines Mismatch</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono tracking-tight">
            {summary.linesMismatch}{' '}
            <span className="text-xs text-slate-400 font-normal">/ {summary.skusCounted}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            {summary.linesMatched} lines match screen
          </div>
        </button>

        {/* Metric 4: Fast Movers Hidden */}
        <button
          onClick={onFilterHiddenFastMovers}
          className={`text-left p-3.5 rounded-xl border transition-all ${
            activeFilter === 'hidden_fast'
              ? 'bg-violet-950/40 border-violet-500 ring-2 ring-violet-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-violet-800/60 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-violet-400 font-semibold mb-1">
            <span>Fast Movers Hidden</span>
            <EyeOff className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-violet-300 font-mono tracking-tight">
            {summary.fastMoversHidden}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            In back rack or mezzanine
          </div>
        </button>

        {/* Metric 5: Slow at Counter */}
        <button
          onClick={onFilterAll}
          className="text-left p-3.5 rounded-xl border bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
            <span>Slow at Counter</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono tracking-tight">
            {summary.slowAtCounter}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Selling face is clear
          </div>
        </button>

        {/* Metric 6: SKUs Counted */}
        <button
          onClick={onFilterAll}
          className={`text-left p-3.5 rounded-xl border transition-all ${
            activeFilter === 'all'
              ? 'bg-slate-800 border-slate-600'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
            <span>SKUs Counted</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
            {summary.skusCounted}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Pre-shutter cycle count
          </div>
        </button>
      </div>
    </div>
  );
};
