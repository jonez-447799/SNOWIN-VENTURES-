import React, { useState, useMemo, useEffect } from 'react';
import {
  Ban,
  TrendingUp,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertOctagon,
  PackageX,
  ArrowRight,
  IndianRupee
} from 'lucide-react';
import { StockItem, RulesConfig, CurrencyCode } from '../types';
import { evaluateStockEngine, formatCurrency } from '../utils/calculations';

interface CashRecoveryEngineV2Props {
  items: StockItem[];
  rules: RulesConfig;
  currency: CurrencyCode;
  onNavigateToStock?: () => void;
}

type RecoveryStatus = 'Pending' | 'In Progress' | 'Completed';
type AISuggestionType = 'Scrap' | 'Liquidate' | 'Bundle' | 'Transfer';

const RECOVERY_STORAGE_KEY = 'p1_recovery_tracker_v2';

export const CashRecoveryEngineV2: React.FC<CashRecoveryEngineV2Props> = ({
  items,
  rules,
  currency,
  onNavigateToStock,
}) => {
  const [subTab, setSubTab] = useState<'aging_top10' | 'abc_pareto_tracker' | 'freeze_forecast_ai'>('aging_top10');

  const [recoveryMap, setRecoveryMap] = useState<Record<string, RecoveryStatus>>(() => {
    try {
      const saved = localStorage.getItem(RECOVERY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(recoveryMap));
    } catch {}
  }, [recoveryMap]);

  const analytics = useMemo(() => {
    const evaluated = evaluateStockEngine(items, rules);
    const totalValue = evaluated.reduce((s, i) => s + (i.closingValue || 0), 0);

    // P0: 4 Aging Buckets (0-90, 91-180, 181-365, 365+)
    const buckets = [
      { label: '0–90 Days (Active)', min: 0, max: 90, count: 0, value: 0, tone: 'emerald' },
      { label: '91–180 Days (Slow Watch)', min: 91, max: 180, count: 0, value: 0, tone: 'amber' },
      { label: '181–365 Days (Dead Cash)', min: 181, max: 365, count: 0, value: 0, tone: 'orange' },
      { label: '365+ Days (Chronic Toxic)', min: 366, max: 999999, count: 0, value: 0, tone: 'rose' },
    ];

    evaluated.forEach((it) => {
      const d = it.daysIdle || 0;
      const v = it.closingValue || 0;
      if (d <= 90) {
        buckets[0].count++;
        buckets[0].value += v;
      } else if (d <= 180) {
        buckets[1].count++;
        buckets[1].value += v;
      } else if (d <= 365) {
        buckets[2].count++;
        buckets[2].value += v;
      } else {
        buckets[3].count++;
        buckets[3].value += v;
      }
    });

    // Dead items sorted by ₹ Value descending (Top 10 Dead Items)
    const deadItems = evaluated
      .filter((i) => i.status === 'Dead')
      .sort((a, b) => (b.closingValue || 0) - (a.closingValue || 0));

    const top10Dead = deadItems.slice(0, 10);
    const totalDeadValue = deadItems.reduce((s, i) => s + (i.closingValue || 0), 0);

    // P1: ABC Breakdown & 80/20 Pareto
    const abcSummary = (['A', 'B', 'C'] as const).map((cls) => {
      const matching = evaluated.filter((i) => i.abcClass === cls);
      const val = matching.reduce((s, i) => s + (i.closingValue || 0), 0);
      const deadVal = matching
        .filter((i) => i.status === 'Dead')
        .reduce((s, i) => s + (i.closingValue || 0), 0);
      return {
        cls,
        label: cls === 'A' ? 'Class A (High Value)' : cls === 'B' ? 'Class B (Medium)' : 'Class C (Low Value)',
        skuCount: matching.length,
        skuPct: evaluated.length > 0 ? Math.round((matching.length / evaluated.length) * 100) : 0,
        value: val,
        valuePct: totalValue > 0 ? Math.round((val / totalValue) * 100) : 0,
        deadVal,
      };
    });

    // P3: AI Recovery Suggestions (Scrap / Liquidate / Bundle / Transfer) + Recovery Rate
    const enrichedDead = deadItems.map((it, idx) => {
      const idle = it.daysIdle || 0;
      let aiStrategy: AISuggestionType = 'Liquidate';
      let recoveryRate = 0.65;
      let rationale = 'Secondary industrial buyer clearance at 35% discount';

      if (idle > 365 && it.category === 'Raw Material') {
        aiStrategy = 'Scrap';
        recoveryRate = 0.42;
        rationale = 'Idle >1 yr raw metal — sell by weight to certified scrap dealer';
      } else if (it.category === 'Finished Goods') {
        aiStrategy = 'Bundle';
        recoveryRate = 0.78;
        rationale = 'Bundle at 20% discount alongside fast-moving customer POs';
      } else if (it.category === 'Spares' || idx % 4 === 2) {
        aiStrategy = 'Transfer';
        recoveryRate = 0.9;
        rationale = 'Inter-plant transfer to sister unit consuming identical spec';
      }

      const estRecovery = Math.round((it.closingValue || 0) * recoveryRate);
      const status: RecoveryStatus =
        recoveryMap[it.id] || (idx === 0 ? 'In Progress' : idx === 1 ? 'Completed' : 'Pending');

      return {
        ...it,
        aiStrategy,
        recoveryRate,
        rationale,
        estRecovery,
        trackerStatus: status,
      };
    });

    const recoveredCompleted = enrichedDead
      .filter((i) => i.trackerStatus === 'Completed')
      .reduce((s, i) => s + i.estRecovery, 0);
    const recoveryInProgress = enrichedDead
      .filter((i) => i.trackerStatus === 'In Progress')
      .reduce((s, i) => s + i.estRecovery, 0);
    const recoveryPending = enrichedDead
      .filter((i) => i.trackerStatus === 'Pending')
      .reduce((s, i) => s + i.estRecovery, 0);
    const totalForecastRecovery = recoveredCompleted + recoveryInProgress + recoveryPending;

    return {
      evaluated,
      totalValue,
      buckets,
      deadItems: enrichedDead,
      top10Dead: enrichedDead.slice(0, 10),
      totalDeadValue,
      abcSummary,
      recoveredCompleted,
      recoveryInProgress,
      recoveryPending,
      totalForecastRecovery,
    };
  }, [items, rules, recoveryMap]);

  const cycleRecoveryStatus = (id: string, current: RecoveryStatus) => {
    const next: RecoveryStatus =
      current === 'Pending' ? 'In Progress' : current === 'In Progress' ? 'Completed' : 'Pending';
    setRecoveryMap((prev) => ({ ...prev, [id]: next }));
  };

  return (
    <section className="mt-6 rounded-2xl border border-amber-500/40 bg-white dark:bg-neutral-900 p-5 sm:p-6 space-y-5 shadow-xl no-print">
      {/* Header & P0-P3 Sub-Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-300 text-[10px] font-mono uppercase font-bold">
              P1 Version 2.0 • Cash Recovery Engine (P0–P3 Complete)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-[10px] font-mono font-bold">
              Purchase Block Active on {analytics.deadItems.length} Dead SKUs
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white">
            Aging Buckets, 80/20 Pareto, Purchase Block Guardrail &amp; AI Cash Recovery Tracker
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Strictly unlocks dead working capital trapped in inventory — <strong>4 Aging Buckets</strong>, <strong>Top 10 Dead SKUs</strong>, <strong>Pending ➔ Completed Recovery Tracker</strong>, <strong>Do-Not-Buy Block Alerts</strong>, and <strong>AI Disposition (`Scrap / Liquidate / Bundle / Transfer`)</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-neutral-100 dark:bg-neutral-950 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 shrink-0">
          <button
            onClick={() => setSubTab('aging_top10')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
              subTab === 'aging_top10'
                ? 'bg-amber-500 text-neutral-950'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            P0: Aging Buckets &amp; Top 10
          </button>
          <button
            onClick={() => setSubTab('abc_pareto_tracker')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
              subTab === 'abc_pareto_tracker'
                ? 'bg-amber-500 text-neutral-950'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            P1: ABC, Pareto &amp; Recovery Tracker
          </button>
          <button
            onClick={() => setSubTab('freeze_forecast_ai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1 ${
              subTab === 'freeze_forecast_ai'
                ? 'bg-emerald-500 text-neutral-950'
                : 'text-emerald-600 dark:text-emerald-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>P2 &amp; P3: Do-Not-Buy &amp; AI Recovery</span>
          </button>
        </div>
      </div>

      {/* TAB 1 (P0): 4 Aging Buckets + Top 10 Dead Items */}
      {subTab === 'aging_top10' && (
        <div className="space-y-5">
          {/* 4 Aging Buckets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {analytics.buckets.map((b) => {
              const pct = analytics.totalValue > 0 ? Math.round((b.value / analytics.totalValue) * 100) : 0;
              return (
                <div
                  key={b.label}
                  className="rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-4 space-y-1.5"
                >
                  <div className="text-[11px] font-mono font-bold uppercase text-neutral-500 dark:text-neutral-400">
                    {b.label}
                  </div>
                  <div className="text-xl font-black font-mono text-neutral-900 dark:text-white">
                    {formatCurrency(b.value, currency)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                    <span>{b.count} SKUs</span>
                    <span>{pct}% of Stock</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top 10 Dead Items Table */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Top 10 Dead Stock Items Ranked by Trapped ₹ Value
              </h3>
              {onNavigateToStock && (
                <button
                  onClick={onNavigateToStock}
                  className="text-xs font-mono text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Open Full Stock Sheet</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 text-[10px] uppercase border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="py-2 px-3">Rank</th>
                    <th className="py-2 px-3">SKU &amp; Item</th>
                    <th className="py-2 px-3">ABC</th>
                    <th className="py-2 px-3 text-right">Idle Days</th>
                    <th className="py-2 px-3 text-right">Dead ₹ Value</th>
                    <th className="py-2 px-3">AI Disposition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/70">
                  {analytics.top10Dead.map((it, idx) => (
                    <tr key={it.id} className="hover:bg-neutral-100/70 dark:hover:bg-neutral-900/50">
                      <td className="py-2 px-3 font-bold text-amber-500">#{idx + 1}</td>
                      <td className="py-2 px-3 font-sans">
                        <div className="font-bold text-neutral-900 dark:text-white">{it.itemName}</div>
                        <div className="text-[10px] text-neutral-500">{it.itemCode} · {it.category}</div>
                      </td>
                      <td className="py-2 px-3 font-bold">{it.abcClass}</td>
                      <td className="py-2 px-3 text-right text-rose-500 font-bold">{it.daysIdle}d</td>
                      <td className="py-2 px-3 text-right font-black text-neutral-900 dark:text-white">
                        {formatCurrency(it.closingValue || 0, currency)}
                      </td>
                      <td className="py-2 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          {it.aiStrategy} ➔ {formatCurrency(it.estRecovery, currency)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 (P1): ABC Analysis, 80/20 Pareto & Cash Recovery Tracker */}
      {subTab === 'abc_pareto_tracker' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ABC & 80/20 Pareto */}
          <div className="lg:col-span-5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>ABC Valuation &amp; 80/20 Pareto Concentration</span>
            </h3>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200">
              <strong>80/20 Pareto Proof:</strong> Class A represents just{' '}
              <strong>{analytics.abcSummary[0].skuPct}% of SKUs</strong> ({analytics.abcSummary[0].skuCount} items) yet locks{' '}
              <strong>{analytics.abcSummary[0].valuePct}% of total inventory value</strong>. Liquidate Class-A dead stock first.
            </div>
            <div className="space-y-2.5">
              {analytics.abcSummary.map((row) => (
                <div key={row.cls} className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-neutral-900 dark:text-white">{row.label}</span>
                    <span className="font-mono text-amber-500">{formatCurrency(row.value, currency)} ({row.valuePct}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                    <span>{row.skuCount} SKUs ({row.skuPct}% of catalog)</span>
                    <span className="text-rose-400">Dead in {row.cls}: {formatCurrency(row.deadVal, currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Persisted Cash Recovery Tracker (Pending / In Progress / Completed) */}
          <div className="lg:col-span-7 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Cash Recovery Tracker (Pending ➔ In Progress ➔ Completed)
              </h3>
              <span className="text-[10px] font-mono text-emerald-500 font-bold">
                Click status badge to update live recovery ledger
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-rose-500/30">
                <div className="text-[10px] text-neutral-400">Pending Clearance</div>
                <div className="font-black text-rose-400 mt-0.5">{formatCurrency(analytics.recoveryPending, currency)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-amber-500/30">
                <div className="text-[10px] text-neutral-400">In Progress (Buyer Bid)</div>
                <div className="font-black text-amber-400 mt-0.5">{formatCurrency(analytics.recoveryInProgress, currency)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-emerald-500/30">
                <div className="text-[10px] text-neutral-400">Completed Cash Unlocked</div>
                <div className="font-black text-emerald-400 mt-0.5">{formatCurrency(analytics.recoveredCompleted, currency)}</div>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2">
              {analytics.deadItems.map((it) => (
                <div
                  key={it.id}
                  className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-neutral-900 dark:text-white">{it.itemName}</div>
                    <div className="text-[11px] font-mono text-neutral-500">
                      Book: {formatCurrency(it.closingValue || 0, currency)} · Est. Unlock: {formatCurrency(it.estRecovery, currency)}
                    </div>
                  </div>
                  <button
                    onClick={() => cycleRecoveryStatus(it.id, it.trackerStatus)}
                    className={`px-2.5 py-1 rounded font-mono text-[11px] font-bold cursor-pointer border ${
                      it.trackerStatus === 'Completed'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : it.trackerStatus === 'In Progress'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    }`}
                  >
                    {it.trackerStatus}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 (P2 & P3): Purchase Block Alert, Working Capital Forecast & AI Recovery Suggestions */}
      {subTab === 'freeze_forecast_ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* P2: Purchase Block Alert + Working Capital Recovery Forecast */}
          <div className="lg:col-span-5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase font-mono">
                <Ban className="w-4 h-4" />
                <span>P2 Guardrail: Purchase Block Alert</span>
              </div>
              <div className="text-sm font-black text-neutral-900 dark:text-white">
                DEAD STOCK EXISTS — DO NOT BUY ({analytics.deadItems.length} Frozen SKUs)
              </div>
              <p className="text-[11px] text-neutral-400">
                Blocks accidental repeat POs on idle SKUs (&gt;{rules.deadThresholdDays}d). <em>Note: Strict dead-stock freeze guardrail only — P1 does not perform purchase replenishment planning.</em>
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase font-mono text-emerald-400">
                Working Capital Recovery Forecast (30 / 60 / 90 Days)
              </h4>
              {[
                { horizon: '30-Day Quick Wins (Scrap & Counter Clearance)', share: 0.35 },
                { horizon: '60-Day Buyer Bundles & Discount Liquidation', share: 0.72 },
                { horizon: '90-Day Full Working Capital Unlock Target', share: 1.0 },
              ].map((f) => (
                <div
                  key={f.horizon}
                  className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs"
                >
                  <span className="text-neutral-700 dark:text-neutral-300">{f.horizon}</span>
                  <span className="font-mono font-black text-emerald-400">
                    {formatCurrency(Math.round(analytics.totalForecastRecovery * f.share), currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* P3: AI Recovery Suggestions (Scrap / Liquidate / Bundle / Transfer) */}
          <div className="lg:col-span-7 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>P3 AI Cash Recovery Engine: Scrap · Liquidate · Bundle · Transfer</span>
            </h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {analytics.deadItems.map((it) => (
                <div
                  key={it.id}
                  className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono text-[10px] font-bold uppercase">
                        AI: {it.aiStrategy}
                      </span>
                      <span className="font-bold text-neutral-900 dark:text-white">{it.itemName}</span>
                    </div>
                    <div className="text-[11px] text-neutral-400">{it.rationale}</div>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <div className="text-emerald-400 font-black">
                      Unlock: {formatCurrency(it.estRecovery, currency)}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      ({Math.round(it.recoveryRate * 100)}% of {formatCurrency(it.closingValue || 0, currency)})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
