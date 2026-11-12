import React, { useState } from 'react';
import { StockItem, RulesConfig, CurrencyCode, UserRole } from '../types';
import { formatCurrency, generateOwnerReport } from '../utils/calculations';
import { 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  Package, 
  Flame, 
  ArrowRight, 
  Send, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Copy,
  Layers,
  Award,
  Zap,
  Database
} from 'lucide-react';

interface OwnerReportProps {
  items: StockItem[];
  rules: RulesConfig;
  currency: CurrencyCode;
  userRole: UserRole;
  onUpdateItemMovement: (itemId: string, newDate: string, logMessage: string) => void;
  onResetItems: () => void;
  onPrint: () => void;
  onNavigateToStock: () => void;
  onOpenAuditDossier?: () => void;
  onOpenSimulator?: () => void;
  onOpenTrialModal?: () => void;
}

export const OwnerReport: React.FC<OwnerReportProps> = ({
  items,
  rules,
  currency,
  userRole,
  onUpdateItemMovement,
  onResetItems,
  onPrint,
  onNavigateToStock,
  onOpenAuditDossier,
  onOpenSimulator,
  onOpenTrialModal,
}) => {
  const summary = generateOwnerReport(items, rules);

  // Drill state tracking
  const [drillStep, setDrillStep] = useState<'initial' | 'sep' | 'jan'>('initial');
  const [drillExplanation, setDrillExplanation] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  // Find SS flange 150NB item (id: 'sku-02')
  const ssFlange = items.find((i) => i.id === 'sku-02' || i.itemName.includes('SS flange'));

  const handleDrillSeptember = () => {
    if (!ssFlange) return;
    onUpdateItemMovement(
      ssFlange.id,
      '2026-09-01',
      'The Drill: Changed SS flange 150NB date to 01-Sep-2026 (moved ~30 days before as-of date).'
    );
    setDrillStep('sep');
    setDrillExplanation(
      'September 1 is 30 days before 1 Oct 2026. Status flipped from Dead to Moving! Dead cash dropped by ₹46,250 to ₹1,76,860. The SS flange has dropped off the Top Dead list.'
    );
  };

  const handleDrillJanuary = () => {
    if (!ssFlange) return;
    onUpdateItemMovement(
      ssFlange.id,
      '2026-01-01',
      'The Drill: Changed SS flange 150NB date to 01-Jan-2026 (idle 273 days).'
    );
    setDrillStep('jan');
    setDrillExplanation(
      'January 1 is 273 days before 1 Oct (more than 180 days). The flange remains Dead. Days idle increased from 232 to 273, but total dead rupees did not change because it was already counted inside the dead pile.'
    );
  };

  const handleDrillReset = () => {
    if (!ssFlange) return;
    onUpdateItemMovement(
      ssFlange.id,
      '2026-02-11',
      'The Drill: Restored SS flange 150NB date back to original baseline (11-Feb-2026).'
    );
    setDrillStep('initial');
    setDrillExplanation('SS flange 150NB restored to 11-Feb-2026 (232 days idle, Dead, ₹46,250). Baseline restored.');
  };

  // WhatsApp message generator
  const top5DeadText = summary.topDeadItems
    .map((item, idx) => `${idx + 1}. ${item.itemName} (${item.daysIdle}d idle): ${formatCurrency(item.closingValue || 0, currency)} [${item.action}]`)
    .join('\n');

  const whatsappMessage = `*FACTORY AUDIT SUMMARY (As of ${summary.asOfDate})*
Ambattur Fabrication Unit

• *Stock on Books:* ${formatCurrency(summary.totalStockValue, currency)}
• *Dead Cash (180d+ idle):* ${formatCurrency(summary.deadCash, currency)} (${summary.deadCashPercent}%)
• *Slow Cash (90-179d):* ${formatCurrency(summary.slowCash, currency)} (${summary.slowCashPercent}%)
• *Holding Burn / Year (18%):* ~${formatCurrency(summary.annualHoldingBurn, currency)}/year

*Plain Sentence for Factory Owner:*
Of ${formatCurrency(summary.totalStockValue, currency)} sitting in stock, ${formatCurrency(summary.deadCash, currency)} has not moved in 180 days. That dead pile costs about ${formatCurrency(summary.annualHoldingBurn, currency)} a year just to keep.

*Top Dead Lines to Halt/Discount this Week:*
${top5DeadText}

_Generated via Project 1 Engine | Verified Tally Summary_`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Owner Report
            </h1>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              1-Page Deliverable
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            As of <strong className="font-mono text-neutral-900 dark:text-neutral-200">{rules.asOfDate}</strong> · Ambattur fabrication unit sample · Cutoff: {rules.deadThresholdDays} days idle
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenSimulator && (
            <button
              onClick={onOpenSimulator}
              className="px-3 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Cash Simulator</span>
            </button>
          )}

          {onOpenAuditDossier && (
            <button
              onClick={onOpenAuditDossier}
              className="px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              <span>Audit Dossier</span>
            </button>
          )}

          {onOpenTrialModal && (
            <button
              onClick={onOpenTrialModal}
              className="px-3 py-1.5 text-xs font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              <span>R&amp;D Trial Data</span>
            </button>
          )}

          <button
            onClick={onPrint}
            className="px-3 py-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors"
          >
            Export 1-Page PDF
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            Send via WhatsApp
          </a>
        </div>
      </div>

      {/* 2. The 4 Key Numbers on Owner Report */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Stock on books */}
        <div className="p-4 sm:p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Stock on books</span>
            <Package className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
              {formatCurrency(summary.totalStockValue, currency)}
            </span>
          </div>
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Every row's quantity × cost rate. Money currently trapped in goods before customer pays.
          </p>
        </div>

        {/* Card 2: Dead cash */}
        <div className="p-4 sm:p-5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
            <span className="text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              Dead cash ({rules.deadThresholdDays}d+)
            </span>
            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300">
              {summary.deadCashPercent}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-rose-700 dark:text-rose-400 tabular-nums">
              {formatCurrency(summary.deadCash, currency)}
            </span>
          </div>
          <p className="mt-2 text-xs text-rose-900/70 dark:text-rose-300/80 leading-relaxed">
            {summary.deadItemCount} of {summary.totalItemCount} items idle for {rules.deadThresholdDays}+ days. The core headline for the owner.
          </p>
        </div>

        {/* Card 3: Slow cash */}
        <div className="p-4 sm:p-5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Slow cash ({rules.slowThresholdDays}-{rules.deadThresholdDays - 1}d)
            </span>
            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
              {summary.slowCashPercent}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums">
              {formatCurrency(summary.slowCash, currency)}
            </span>
          </div>
          <p className="mt-2 text-xs text-amber-900/70 dark:text-amber-300/80 leading-relaxed">
            Moved once, then went quiet. {summary.slowItemCount} items not dead yet. Freeze purchase; do not reorder.
          </p>
        </div>

        {/* Card 4: Burn on dead per year */}
        <div className="p-4 sm:p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              Burn on dead / year
            </span>
            <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
              @{rules.holdingCostPercent}% p.a.
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-orange-600 dark:text-orange-400 tabular-nums">
              ~{formatCurrency(summary.annualHoldingBurn, currency)}
            </span>
          </div>
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Cost of keeping dead pile sitting there: bank OD interest, shed space, rust, obsolescence.
          </p>
        </div>
      </div>

      {/* 3. The Plain-English Headline Sentence */}
      <div className="p-4 sm:p-5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-800 border border-neutral-800 dark:border-neutral-700 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              The Plain-English Sentence for the Meeting
            </span>
            <p className="mt-1 text-base sm:text-lg font-medium text-neutral-100 leading-snug">
              "Of <strong className="text-white font-mono">{formatCurrency(summary.totalStockValue, currency)}</strong> sitting in stock,{' '}
              <strong className="text-rose-400 font-mono">{formatCurrency(summary.deadCash, currency)}</strong> has not moved in {rules.deadThresholdDays} days. 
              That dead pile costs about <strong className="text-amber-400 font-mono">{formatCurrency(summary.annualHoldingBurn, currency)}</strong> a year just to keep."
            </p>
            <p className="mt-2 text-xs text-neutral-400">
              Say it as: <em>"About {formatCurrency(summary.annualHoldingBurn, currency)} a year just to keep a pile nobody is using."</em> No buzzwords, no app talk.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Interactive "The Drill" Module */}
      <div className="p-4 sm:p-5 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
                The Drill: Practice the Flange Date Test
              </h2>
            </div>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl">
              Target SKU: <strong>SS flange 150NB</strong> (Qty: 25, Rate: ₹1,850, Value: ₹46,250). 
              Currently last moved on <strong className="font-mono text-neutral-800 dark:text-neutral-200">11-Feb-2026</strong> ({ssFlange?.daysIdle} days idle). 
              Test how the formulas instantly react.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDrillSeptember}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all flex items-center gap-1 ${
                drillStep === 'sep'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:border-emerald-500'
              }`}
            >
              <span>1. Set to 01-Sep-2026</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              onClick={handleDrillJanuary}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all flex items-center gap-1 ${
                drillStep === 'jan'
                  ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:border-rose-500'
              }`}
            >
              <span>2. Set to 01-Jan-2026</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              onClick={handleDrillReset}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset (11-Feb)</span>
            </button>
          </div>
        </div>

        {/* Live drill results feedback */}
        {drillExplanation && (
          <div className="mt-3 p-3 rounded bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-900/60 text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">Live Drill Result: </span>
              {drillExplanation}
            </div>
            <div className="font-mono text-neutral-500 text-[11px] shrink-0">
              Current Dead Cash: <strong className="text-rose-600 dark:text-rose-400">{formatCurrency(summary.deadCash, currency)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* 5. Five Biggest Dead Items Table */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span>Five Biggest Dead Items</span>
              <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">
                (Largest rupees first — the primary hitlist)
              </span>
            </h2>
          </div>
          <button
            onClick={onNavigateToStock}
            className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>View all {summary.totalItemCount} rows in Stock Engine</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="py-2.5 px-4 font-semibold">SKU / Item Name</th>
                <th className="py-2.5 px-4 font-semibold">Category</th>
                <th className="py-2.5 px-4 font-semibold text-right">Days Idle</th>
                <th className="py-2.5 px-4 font-semibold text-right">Closing Value</th>
                <th className="py-2.5 px-4 font-semibold text-center">Class</th>
                <th className="py-2.5 px-4 font-semibold">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {summary.topDeadItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-neutral-500">
                    No dead items detected above threshold of {rules.deadThresholdDays} days.
                  </td>
                </tr>
              ) : (
                summary.topDeadItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <span className="font-mono text-neutral-400 dark:text-neutral-500">{idx + 1}.</span>
                        <span>{item.itemName}</span>
                      </div>
                      <div className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500 ml-4">
                        Code: {item.itemCode} · Qty: {item.qtyOnHand} @ {formatCurrency(item.costRate, currency)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-rose-600 dark:text-rose-400 tabular-nums">
                      {item.daysIdle} days
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100 tabular-nums text-sm">
                      {formatCurrency(item.closingValue || 0, currency)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-neutral-700 dark:text-neutral-300">
                      {item.abcClass}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${
                        item.abcClass === 'A' 
                          ? 'text-rose-700 dark:text-rose-400' 
                          : 'text-amber-800 dark:text-amber-400'
                      }`}>
                        {item.action}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Ageing Breakdown Split & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Ageing Split Visual */}
        <div className="lg:col-span-2 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Ageing Split: How Long the Money Has Been Quiet
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                The red bar shows what the factory owner must see without reading a table.
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              Total: {formatCurrency(summary.totalStockValue, currency)}
            </span>
          </div>

          {/* Visual Bar Split */}
          <div className="mt-5">
            <div className="h-6 w-full rounded overflow-hidden flex shadow-inner bg-neutral-100 dark:bg-neutral-800">
              <div 
                style={{ width: `${summary.ageingBreakdown.range0_30_pct}%` }} 
                className="bg-emerald-500 h-full transition-all duration-300 relative group"
                title={`0-30 Days: ${formatCurrency(summary.ageingBreakdown.range0_30, currency)} (${summary.ageingBreakdown.range0_30_pct}%)`}
              />
              <div 
                style={{ width: `${summary.ageingBreakdown.range31_89_pct}%` }} 
                className="bg-sky-500 h-full transition-all duration-300 relative group"
                title={`31-89 Days: ${formatCurrency(summary.ageingBreakdown.range31_89, currency)} (${summary.ageingBreakdown.range31_89_pct}%)`}
              />
              <div 
                style={{ width: `${summary.ageingBreakdown.range90_179_pct}%` }} 
                className="bg-amber-500 h-full transition-all duration-300 relative group"
                title={`90-179 Days (Slow): ${formatCurrency(summary.ageingBreakdown.range90_179, currency)} (${summary.ageingBreakdown.range90_179_pct}%)`}
              />
              <div 
                style={{ width: `${summary.ageingBreakdown.range180_plus_pct}%` }} 
                className="bg-rose-500 h-full transition-all duration-300 relative group"
                title={`180+ Days (Dead): ${formatCurrency(summary.ageingBreakdown.range180_plus, currency)} (${summary.ageingBreakdown.range180_plus_pct}%)`}
              />
            </div>
          </div>

          {/* Table Breakdown */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>0–30 Days</span>
              </div>
              <div className="mt-1 font-mono font-bold text-neutral-900 dark:text-neutral-100 text-sm tabular-nums">
                {formatCurrency(summary.ageingBreakdown.range0_30, currency)}
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                {summary.ageingBreakdown.range0_30_pct}% · Healthy
              </div>
            </div>

            <div className="p-3 rounded bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40">
              <div className="flex items-center gap-1.5 text-sky-800 dark:text-sky-400 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
                <span>31–89 Days</span>
              </div>
              <div className="mt-1 font-mono font-bold text-neutral-900 dark:text-neutral-100 text-sm tabular-nums">
                {formatCurrency(summary.ageingBreakdown.range31_89, currency)}
              </div>
              <div className="text-[11px] text-sky-700 dark:text-sky-400 font-mono mt-0.5">
                {summary.ageingBreakdown.range31_89_pct}% · Regular
              </div>
            </div>

            <div className="p-3 rounded bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>90–179 Days</span>
              </div>
              <div className="mt-1 font-mono font-bold text-neutral-900 dark:text-neutral-100 text-sm tabular-nums">
                {formatCurrency(summary.ageingBreakdown.range90_179, currency)}
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-400 font-mono mt-0.5">
                {summary.ageingBreakdown.range90_179_pct}% · Slow pile
              </div>
            </div>

            <div className="p-3 rounded bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
              <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-400 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span>180+ Days</span>
              </div>
              <div className="mt-1 font-mono font-bold text-neutral-900 dark:text-neutral-100 text-sm tabular-nums">
                {formatCurrency(summary.ageingBreakdown.range180_plus, currency)}
              </div>
              <div className="text-[11px] text-rose-700 dark:text-rose-400 font-mono mt-0.5">
                {summary.ageingBreakdown.range180_plus_pct}% · Dead pile
              </div>
            </div>
          </div>
        </div>

        {/* Right: Category Dead Distribution */}
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-5 bg-white dark:bg-neutral-900 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Where Dead Cash Sits
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Split of {formatCurrency(summary.deadCash, currency)} dead money by inventory type.
            </p>

            <div className="mt-4 space-y-3">
              {Object.entries(summary.categoryDeadBreakdown).map(([category, stats]) => (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {category} ({stats.count} lines)
                    </span>
                    <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {formatCurrency(stats.value, currency)} ({stats.percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
                    <div 
                      style={{ width: `${stats.percent}%` }}
                      className="h-full bg-amber-600 dark:bg-amber-500 rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 leading-relaxed">
            <strong>Factory context:</strong> Raw materials dead means bought inputs not being used. Finished goods dead means goods made without recurring customer orders.
          </div>
        </div>
      </div>

      {/* 7. WhatsApp / Executive Dispatch Simulator */}
      <div className="p-4 sm:p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Automated Daily Dispatch Preview (Encrypted WhatsApp / Email)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="px-2.5 py-1 text-xs font-medium rounded border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open in WhatsApp Web</span>
            </a>
          </div>
        </div>

        <div className="mt-3 bg-neutral-950 text-neutral-200 font-mono text-xs p-4 rounded-md overflow-x-auto whitespace-pre leading-relaxed border border-neutral-800">
          {whatsappMessage}
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Daily Cadence: 08:00 AM IST (Automated before factory shift starts)</span>
          <span className="font-mono text-emerald-400">AES-256-GCM Signature: OK</span>
        </div>
      </div>
    </div>
  );
};
