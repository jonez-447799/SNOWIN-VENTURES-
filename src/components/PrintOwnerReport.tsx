import React from 'react';
import { StockItem, RulesConfig, CurrencyCode } from '../types';
import { generateOwnerReport, formatCurrency } from '../utils/calculations';

interface PrintOwnerReportProps {
  items: StockItem[];
  rules: RulesConfig;
  currency: CurrencyCode;
}

export const PrintOwnerReport: React.FC<PrintOwnerReportProps> = ({
  items,
  rules,
  currency,
}) => {
  const summary = generateOwnerReport(items, rules);

  return (
    <div className="hidden print:block p-8 bg-white text-black max-w-4xl mx-auto font-sans text-xs">
      {/* 1. Header */}
      <div className="border-b-2 border-black pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight">
            Factory Cash Audit : Dead Inventory 1-Page Report
          </h1>
          <div className="text-xs text-neutral-600 mt-1">
            Plant: <strong>Ambattur Fabrication Unit</strong> · Location: Chennai, Tamil Nadu
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm font-bold">
            As of: {summary.asOfDate}
          </div>
          <div className="text-[11px] text-neutral-500">
            Cutoff: {rules.deadThresholdDays} Days Idle
          </div>
        </div>
      </div>

      {/* 2. The 4 Key Numbers */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="border border-neutral-300 p-3 rounded">
          <div className="text-[10px] uppercase font-bold text-neutral-500">Stock on Books</div>
          <div className="text-lg font-mono font-bold mt-1">
            {formatCurrency(summary.totalStockValue, currency)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Total capital trapped</div>
        </div>

        <div className="border-2 border-black p-3 rounded bg-neutral-50">
          <div className="text-[10px] uppercase font-black text-black">Dead Cash ({rules.deadThresholdDays}d+)</div>
          <div className="text-xl font-mono font-black mt-1">
            {formatCurrency(summary.deadCash, currency)}
          </div>
          <div className="text-[10px] font-bold text-black mt-0.5">
            {summary.deadCashPercent}% of total inventory
          </div>
        </div>

        <div className="border border-neutral-300 p-3 rounded">
          <div className="text-[10px] uppercase font-bold text-neutral-500">Slow Cash ({rules.slowThresholdDays}-{rules.deadThresholdDays - 1}d)</div>
          <div className="text-lg font-mono font-bold mt-1">
            {formatCurrency(summary.slowCash, currency)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">{summary.slowCashPercent}% · Freeze reorders</div>
        </div>

        <div className="border border-neutral-300 p-3 rounded">
          <div className="text-[10px] uppercase font-bold text-neutral-500">Burn on Dead / Year</div>
          <div className="text-lg font-mono font-bold mt-1">
            ~{formatCurrency(summary.annualHoldingBurn, currency)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">@ {rules.holdingCostPercent}% p.a. holding cost</div>
        </div>
      </div>

      {/* 3. The Owner Sentence */}
      <div className="mt-5 p-4 border-l-4 border-black bg-neutral-100">
        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">Executive Summary</div>
        <p className="text-sm font-semibold mt-1 leading-snug">
          "Of {formatCurrency(summary.totalStockValue, currency)} sitting in stock, {formatCurrency(summary.deadCash, currency)} has not moved in {rules.deadThresholdDays} days. That dead pile costs about {formatCurrency(summary.annualHoldingBurn, currency)} a year just to keep."
        </p>
      </div>

      {/* 4. Five Biggest Dead Items */}
      <div className="mt-6">
        <h2 className="text-xs font-black uppercase tracking-wider border-b border-black pb-1">
          Top Five Dead Lines (Action This Week)
        </h2>
        <table className="w-full text-left mt-2 border-collapse">
          <thead>
            <tr className="border-b border-neutral-300 text-[10px] uppercase font-bold text-neutral-600">
              <th className="py-1"># Item Name</th>
              <th className="py-1">Category</th>
              <th className="py-1 text-right">Days Idle</th>
              <th className="py-1 text-right">Closing Value</th>
              <th className="py-1 text-center">Class</th>
              <th className="py-1">Recommended Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 font-mono text-[11px]">
            {summary.topDeadItems.map((item, idx) => (
              <tr key={item.id}>
                <td className="py-2 font-sans font-bold">{idx + 1}. {item.itemName}</td>
                <td className="py-2 font-sans">{item.category}</td>
                <td className="py-2 text-right">{item.daysIdle}d</td>
                <td className="py-2 text-right font-bold">{formatCurrency(item.closingValue || 0, currency)}</td>
                <td className="py-2 text-center font-bold">{item.abcClass}</td>
                <td className="py-2 font-sans font-semibold">{item.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. Ageing Split Breakdown */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider border-b border-black pb-1">
            Ageing Distribution Split
          </h2>
          <table className="w-full text-left mt-2 text-[11px]">
            <tbody>
              <tr className="border-b border-neutral-200">
                <td className="py-1.5 font-medium">0–30 Days (Healthy)</td>
                <td className="py-1.5 text-right font-mono font-bold">{formatCurrency(summary.ageingBreakdown.range0_30, currency)}</td>
                <td className="py-1.5 text-right font-mono text-neutral-500">{summary.ageingBreakdown.range0_30_pct}%</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="py-1.5 font-medium">31–89 Days (Active)</td>
                <td className="py-1.5 text-right font-mono font-bold">{formatCurrency(summary.ageingBreakdown.range31_89, currency)}</td>
                <td className="py-1.5 text-right font-mono text-neutral-500">{summary.ageingBreakdown.range31_89_pct}%</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="py-1.5 font-medium">90–179 Days (Slow Pile)</td>
                <td className="py-1.5 text-right font-mono font-bold">{formatCurrency(summary.ageingBreakdown.range90_179, currency)}</td>
                <td className="py-1.5 text-right font-mono text-neutral-500">{summary.ageingBreakdown.range90_179_pct}%</td>
              </tr>
              <tr className="border-b border-black font-bold">
                <td className="py-1.5">180+ Days (Dead Pile)</td>
                <td className="py-1.5 text-right font-mono font-bold">{formatCurrency(summary.ageingBreakdown.range180_plus, currency)}</td>
                <td className="py-1.5 text-right font-mono text-neutral-900">{summary.ageingBreakdown.range180_plus_pct}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-xs font-black uppercase tracking-wider border-b border-black pb-1">
            Dead Cash by Category
          </h2>
          <table className="w-full text-left mt-2 text-[11px]">
            <tbody>
              {Object.entries(summary.categoryDeadBreakdown).map(([cat, stats]) => (
                <tr key={cat} className="border-b border-neutral-200">
                  <td className="py-1.5 font-medium">{cat}</td>
                  <td className="py-1.5 text-right font-mono font-bold">{formatCurrency(stats.value, currency)}</td>
                  <td className="py-1.5 text-right font-mono text-neutral-500">{stats.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Signoff Footer */}
      <div className="mt-8 pt-4 border-t border-black flex items-center justify-between text-[11px]">
        <div>
          Review Signoff: ____________________________ (Factory Owner)
        </div>
        <div>
          Date: ________________________
        </div>
        <div className="font-mono text-neutral-400">
          Project 1 Engine · Ambattur Unit
        </div>
      </div>
    </div>
  );
};
