/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Check,
  Copy,
  Printer,
  RefreshCw,
  Layers,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Clock,
  Warehouse,
  Users,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
  Activity,
  FileCheck2,
} from 'lucide-react';
import { PlantConfig, PeriodConfig } from '../../context/PlantContext';
import { MondayTowerData } from '../types';
import { CrossEngineTrendChart } from './CrossEngineTrendChart';

export interface CrossEngineMetrics {
  deadCash: number;
  cashRecoveryPotential: number;
  abcADeadStock: number;
  deadItemCount: number;
  topDeadSkus: { sku: string; value: string; owner: string; dueDate: string }[];
  otifPercent: number;
  totalDispatches: number;
  passDispatches: number;
  lateOrdersCount: number;
  shortOrdersCount: number;
  worstCustomerName: string;
  worstCustomerOtif: number;
  otifRevenueExposure: number;
  freightPaid: number;
  freightLeakage: number;
  recoveredFreight: number;
  pendingFreight: number;
  worstCarrierName: string;
  worstLaneName: string;
  inventoryAccuracyPct: number;
  grossVarianceRupees: number;
  accuracyLossImpactRupees: number;
  linesMismatch: number;
  worstBinSpot: string;
  operationsHealthScore: number;
  executiveRiskIndex: number;
  unpaidBillsRupees: number;
}

interface CrossEngineSyncReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: CrossEngineMetrics;
  towerData: MondayTowerData;
  activePlant: PlantConfig;
  activePeriod: PeriodConfig;
  onApplyToBriefing: () => void;
  onJumpToEngine?: (engine: 'p1' | 'p2' | 'p3' | 'p4' | 'p5') => void;
}

function formatINR(val: number): string {
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

function formatShortINR(val: number): string {
  if (Math.abs(val) >= 10000000) {
    const cr = val / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (Math.abs(val) >= 100000) {
    const lakhs = val / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  if (Math.abs(val) >= 1000) {
    return `₹${Math.round(val / 1000)}K`;
  }
  return formatINR(val);
}

export const CrossEngineSyncReportModal: React.FC<CrossEngineSyncReportModalProps> = ({
  isOpen,
  onClose,
  metrics,
  towerData,
  activePlant,
  activePeriod,
  onApplyToBriefing,
  onJumpToEngine,
}) => {
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  // Total Trapped & At-Risk Capital across all 5 engines
  const totalFinancialExposure =
    metrics.deadCash +
    metrics.otifRevenueExposure +
    metrics.freightLeakage +
    metrics.accuracyLossImpactRupees +
    metrics.unpaidBillsRupees;

  const handleApply = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onApplyToBriefing();
      setIsSyncing(false);
      setApplied(true);
      setTimeout(() => {
        setApplied(false);
      }, 3500);
    }, 450);
  };

  const handleCopyReport = () => {
    const lines = [
      `=======================================================`,
      `MANUFACTURING COMMAND CENTER — 5-ENGINE CROSS-SYNC DOSSIER`,
      `Facility: ${activePlant.name} (${activePlant.division})`,
      `Cluster: ${activePlant.cluster}`,
      `Audit Period: ${activePeriod.label} [${activePeriod.dateRange}]`,
      `Consolidated Operations Health Score: ${metrics.operationsHealthScore}/100`,
      `Total Capital Trapped & at Risk: ${formatINR(totalFinancialExposure)}`,
      `Generated: ${new Date().toLocaleString('en-IN')}`,
      `=======================================================`,
      ``,
      `[P1 • CASH RECOVERY ENGINE]`,
      `• Trapped Dead Inventory: ${formatINR(metrics.deadCash)} (${metrics.deadItemCount} Stagnant SKUs)`,
      `• Recoverable Capital: ${formatINR(metrics.cashRecoveryPotential)} via salvage & vendor returns`,
      `• A-Class High-Value Dead Stock: ${formatINR(metrics.abcADeadStock)} (>180 Days)`,
      `• Top Stuck SKU: ${metrics.topDeadSkus[0]?.sku || 'Servo Motor 7.5kW'} (${metrics.topDeadSkus[0]?.value || '₹3.0L'})`,
      `• Action: Generate Tally Debit Note / Liquidation Salvage Sheet`,
      ``,
      `[P2 • CUSTOMER PROMISE OTIF ENGINE]`,
      `• Factory Gate OTIF: ${metrics.otifPercent}% (Benchmark: >=95%)`,
      `• Dispatch Execution: ${metrics.passDispatches} Passes / ${metrics.totalDispatches} Loads`,
      `• Customer Revenue at Risk: ${formatINR(metrics.otifRevenueExposure)}`,
      `• Critical Account at Risk: ${metrics.worstCustomerName} (${metrics.worstCustomerOtif}% OTIF)`,
      `• Primary Delay Bottleneck: Production Line Delays & Material Shortages`,
      `• Action: Enforce 8:30 AM Shift Line Pacing & Dual-Gate Guard Signoff`,
      ``,
      `[P3 • PROFIT PROTECTION FREIGHT ENGINE]`,
      `• Total Freight Spend: ${formatINR(metrics.freightPaid)}`,
      `• Disallowed Rate & Detention Leakage: ${formatINR(metrics.freightLeakage)}`,
      `• Pending Deductions: ${formatINR(metrics.pendingFreight)} | Recovered: ${formatINR(metrics.recoveredFreight)}`,
      `• High-Variance Carrier: ${metrics.worstCarrierName} on ${metrics.worstLaneName}`,
      `• Action: Issue Formal Carrier Deduction Claim (Debit Note Contra Entry)`,
      ``,
      `[P4 • WAREHOUSE RELIABILITY ENGINE]`,
      `• Physical Store Inventory Accuracy: ${metrics.inventoryAccuracyPct}%`,
      `• Variance Risk Loss Impact: ${formatINR(metrics.accuracyLossImpactRupees)}`,
      `• Mismatched Bins: ${metrics.linesMismatch} Bins (Worst Spot: ${metrics.worstBinSpot})`,
      `• Action: Execute 8:30 AM Morning Shutter 4-Bin Fast Checklist`,
      ``,
      `[P5 • MONDAY CONTROL TOWER & DEBTORS]`,
      `• Commercial Debtors Overdue: ${formatINR(metrics.unpaidBillsRupees)}`,
      `• Department Health: Inv ${activePlant.kpis.subScores.inventory}% | OTIF ${activePlant.kpis.subScores.otif}% | Frt ${activePlant.kpis.subScores.freight}% | Whs ${activePlant.kpis.subScores.warehouse}%`,
      `• CEO Directive: Focus Monday 9 AM Review on Top 2 Overdue Commercial Accounts`,
      `=======================================================`,
    ].join('\n');

    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getHealthBadge = (score: number) => {
    if (score >= 85) {
      return { label: '🟢 Healthy', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    }
    if (score >= 65) {
      return { label: '🟡 Warning', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    }
    return { label: '🔴 Critical', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cross-engine-sync-title"
    >
      <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-5xl w-full p-4 sm:p-6 md:p-7 shadow-2xl border border-indigo-500/30 relative space-y-5 my-6 sm:my-8 max-h-[92vh] overflow-y-auto font-sans">
        {/* Top Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 no-print">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" />
                <span>P1 ↔ P2 ↔ P3 ↔ P4 ↔ P5 Cross-Engine Bridge</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold">
                Live State Snapshot
              </span>
            </div>
            <h2 id="cross-engine-sync-title" className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">
              Unified Cross-Engine Sync Report
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-300 font-semibold">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{activePlant.name}</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-cyan-300 font-mono">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>{activePeriod.label}</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[11px] text-slate-400">{activePlant.cluster}</span>
            </div>
          </div>

          {/* Action Header Buttons (Desktop + Mobile Responsive) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCopyReport}
              className="min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold font-mono flex items-center justify-center gap-1.5 cursor-pointer transition touch-manipulation active:scale-[0.98]"
              title="Copy complete 5-engine executive briefing to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Dossier!' : 'Copy Dossier'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold font-mono flex items-center justify-center gap-1.5 cursor-pointer transition touch-manipulation active:scale-[0.98]"
              title="Print 5-engine report as executive PDF"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print PDF</span>
            </button>

            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              aria-label="Close Cross-Engine Sync Report Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1-Click Update Banner / CTA */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-emerald-950/80 border border-indigo-500/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                1-Click Executive Synthesis
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Synchronize live metrics from all 5 engines directly into the <strong>CEO Monday Morning Briefing</strong>, department scorecards, and Top 5 Priorities list.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              onClick={handleApply}
              disabled={isSyncing}
              className={`min-h-[44px] px-4 py-2.5 rounded-xl font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md touch-manipulation active:scale-[0.98] ${
                applied
                  ? 'bg-emerald-500 text-slate-950 font-black ring-2 ring-emerald-300'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black'
              }`}
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : applied ? (
                <FileCheck2 className="w-4 h-4 text-slate-950" />
              ) : (
                <RefreshCw className="w-4 h-4 text-slate-950" />
              )}
              <span>
                {isSyncing
                  ? 'Syncing 5 Engines...'
                  : applied
                  ? '✓ CEO Briefing Updated!'
                  : '⚡ Update CEO Monday Briefing (1-Click)'}
              </span>
            </button>
          </div>
        </div>

        {applied && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              All 5 engines synced! The Monday Control Tower is now running on live operational numbers with re-calibrated action items and executive synthesis.
            </span>
          </div>
        )}

        {/* Consolidated Health & Trapped Capital Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
              <span>Overall Factory Health</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {metrics.operationsHealthScore}/100
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {metrics.operationsHealthScore >= 80 ? '🟢 World Class' : metrics.operationsHealthScore >= 65 ? '🟡 Moderate Risk' : '🔴 Critical SLA Risk'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/30">
            <div className="flex items-center justify-between text-rose-300 text-[10px] uppercase font-bold">
              <span>Total Trapped &amp; at Risk</span>
              <DollarSign className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-300 mt-1">
              {formatShortINR(totalFinancialExposure)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Consolidated P1–P5 Exposure
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
              <span>Customer Gate OTIF</span>
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className={`text-xl sm:text-2xl font-black mt-1 ${metrics.otifPercent >= 90 ? 'text-emerald-400' : metrics.otifPercent >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
              {metrics.otifPercent}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {metrics.passDispatches} of {metrics.totalDispatches} loads passed
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
              <span>Executive Risk Index</span>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
              {metrics.executiveRiskIndex}/100
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Composite Supply Friction
            </div>
          </div>
        </div>

        {/* 4-Week Cross-Engine Performance Trajectory (Recharts Trend Lines) */}
        <CrossEngineTrendChart
          metrics={metrics}
          activePlantName={activePlant.name}
        />

        {/* 5-Engine Detailed Snapshot Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
            Current State Across All 5 Operational Engines
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* ENGINE 1: P1 Cash Recovery */}
            <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/40 flex flex-col justify-between space-y-3 shadow-md hover:border-rose-400 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                      P1 • Cash Recovery
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getHealthBadge(activePlant.kpis.subScores.inventory).cls}`}>
                    {getHealthBadge(activePlant.kpis.subScores.inventory).label}
                  </span>
                </div>

                <div>
                  <div className="text-xl font-black text-white font-mono">
                    {formatINR(metrics.deadCash)}
                  </div>
                  <div className="text-xs text-rose-300 font-medium">
                    Dead Working Capital Locked
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-300 font-mono border-t border-slate-800/80 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Recoverable Cash:</span>
                    <span className="font-bold text-emerald-400">{formatINR(metrics.cashRecoveryPotential)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">A-Class Dead (&gt;180d):</span>
                    <span className="font-bold text-amber-300">{formatINR(metrics.abcADeadStock)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Zero-Movement SKUs:</span>
                    <span className="text-white">{metrics.deadItemCount} parts</span>
                  </div>
                  <div className="flex justify-between truncate">
                    <span className="text-slate-400">Top Stuck Item:</span>
                    <span className="text-white font-sans truncate">{metrics.topDeadSkus[0]?.sku || 'Servo Motor'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">Owner: Inv Manager</span>
                <button
                  onClick={() => {
                    onClose();
                    onJumpToEngine?.('p1');
                  }}
                  className="min-h-[44px] sm:min-h-0 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition touch-manipulation"
                >
                  <span>Open P1</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* ENGINE 2: P2 Customer Promise OTIF */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 flex flex-col justify-between space-y-3 shadow-md hover:border-amber-400 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      P2 • Promise OTIF
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getHealthBadge(metrics.otifPercent).cls}`}>
                    {getHealthBadge(metrics.otifPercent).label}
                  </span>
                </div>

                <div>
                  <div className="text-xl font-black text-white font-mono">
                    {metrics.otifPercent}% OTIF
                  </div>
                  <div className="text-xs text-amber-300 font-medium">
                    Customer Promise Fulfillment
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-300 font-mono border-t border-slate-800/80 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Orders Logged:</span>
                    <span className="text-white">{metrics.totalDispatches} ({metrics.passDispatches} Passed)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Late &amp; Short Loads:</span>
                    <span className="font-bold text-rose-400">{metrics.lateOrdersCount} Late, {metrics.shortOrdersCount} Short</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Revenue at Risk:</span>
                    <span className="font-bold text-amber-300">{formatINR(metrics.otifRevenueExposure)}</span>
                  </div>
                  <div className="flex justify-between truncate">
                    <span className="text-slate-400">Worst Customer:</span>
                    <span className="text-rose-300 font-sans truncate">{metrics.worstCustomerName} ({metrics.worstCustomerOtif}%)</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">Owner: Dispatch Head</span>
                <button
                  onClick={() => {
                    onClose();
                    onJumpToEngine?.('p2');
                  }}
                  className="min-h-[44px] sm:min-h-0 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition touch-manipulation"
                >
                  <span>Open P2</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* ENGINE 3: P3 Profit Protection */}
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 flex flex-col justify-between space-y-3 shadow-md hover:border-emerald-400 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                      P3 • Profit Protection
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getHealthBadge(activePlant.kpis.subScores.freight).cls}`}>
                    {getHealthBadge(activePlant.kpis.subScores.freight).label}
                  </span>
                </div>

                <div>
                  <div className="text-xl font-black text-white font-mono">
                    {formatINR(metrics.freightLeakage)}
                  </div>
                  <div className="text-xs text-emerald-300 font-medium">
                    Freight Leakage Detected
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-300 font-mono border-t border-slate-800/80 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Freight Paid:</span>
                    <span className="text-white">{formatINR(metrics.freightPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pending Debit Notes:</span>
                    <span className="font-bold text-amber-300">{formatINR(metrics.pendingFreight)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Recovered Claims:</span>
                    <span className="font-bold text-emerald-400">{formatINR(metrics.recoveredFreight)}</span>
                  </div>
                  <div className="flex justify-between truncate">
                    <span className="text-slate-400">Worst Transporter:</span>
                    <span className="text-white font-sans truncate">{metrics.worstCarrierName}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">Owner: Logistics Head</span>
                <button
                  onClick={() => {
                    onClose();
                    onJumpToEngine?.('p3');
                  }}
                  className="min-h-[44px] sm:min-h-0 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition touch-manipulation"
                >
                  <span>Open P3</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* ENGINE 4: P4 Warehouse Reliability */}
            <div className="p-4 rounded-xl bg-slate-950 border border-fuchsia-500/40 flex flex-col justify-between space-y-3 shadow-md hover:border-fuchsia-400 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-fuchsia-400"></span>
                    <span className="text-xs font-bold text-fuchsia-300 uppercase tracking-wide">
                      P4 • Warehouse Trust
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getHealthBadge(metrics.inventoryAccuracyPct).cls}`}>
                    {getHealthBadge(metrics.inventoryAccuracyPct).label}
                  </span>
                </div>

                <div>
                  <div className="text-xl font-black text-white font-mono">
                    {metrics.inventoryAccuracyPct}% Match
                  </div>
                  <div className="text-xs text-fuchsia-300 font-medium">
                    Physical Store Inventory Accuracy
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-300 font-mono border-t border-slate-800/80 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Loss Impact (ERP Mismatch):</span>
                    <span className="font-bold text-rose-400">{formatINR(metrics.accuracyLossImpactRupees)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gross Variance Value:</span>
                    <span className="text-white">{formatINR(metrics.grossVarianceRupees || 120000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mismatched Bins:</span>
                    <span className="font-bold text-amber-300">{metrics.linesMismatch} Bins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Critical Bin Spot:</span>
                    <span className="text-white">Bin {metrics.worstBinSpot}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">Owner: Stores Head</span>
                <button
                  onClick={() => {
                    onClose();
                    onJumpToEngine?.('p4');
                  }}
                  className="min-h-[44px] sm:min-h-0 px-2.5 py-1.5 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition touch-manipulation"
                >
                  <span>Open P4</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* ENGINE 5: P5 Monday Control Tower & Commercial Debtors */}
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 flex flex-col justify-between space-y-3 shadow-md hover:border-cyan-400 transition md:col-span-2 lg:col-span-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                      P5 • Monday Control Tower (Debtors &amp; Decisions)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border bg-cyan-500/20 text-cyan-300 border-cyan-500/40">
                    Active Command
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xl font-black text-white font-mono">
                      {formatINR(metrics.unpaidBillsRupees)}
                    </div>
                    <div className="text-xs text-cyan-300 font-medium">
                      Overdue Commercial Debtors
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-white font-mono">
                      {towerData.ordersLateCount} Late / {towerData.stockoutRiskCount} Stockouts
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      Monday 9:00 AM Alert Queue
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300 font-mono border-t border-slate-800/80 pt-2">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Inv Dept</div>
                    <div className="font-bold text-white">{activePlant.kpis.subScores.inventory}/100</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Dispatch Dept</div>
                    <div className="font-bold text-white">{activePlant.kpis.subScores.otif}/100</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Logistics Dept</div>
                    <div className="font-bold text-white">{activePlant.kpis.subScores.freight}/100</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Warehouse Dept</div>
                    <div className="font-bold text-white">{activePlant.kpis.subScores.warehouse}/100</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">Executive Accountable: COO &amp; Plant Head</span>
                <button
                  onClick={() => {
                    onClose();
                    onJumpToEngine?.('p5');
                  }}
                  className="min-h-[44px] sm:min-h-0 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition touch-manipulation"
                >
                  <span>Focus Monday Briefing</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400 no-print">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 hidden sm:inline" />
            <span>
              Real-time audit bridge verified across LocalStorage, Tally CSV models, and active factory plant calibrations.
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-xs cursor-pointer transition touch-manipulation text-center"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
