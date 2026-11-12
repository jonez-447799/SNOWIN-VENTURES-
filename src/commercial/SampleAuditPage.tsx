/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 10: Dedicated /audit Sample Report Page (SampleAuditPage.tsx).
 * Displays the full executive sample report with Mode A (12,400-SKU Plant Case)
 * vs Mode B (20-SKU Canonical Sandbox), Top Flagged SKUs Requiring Floor Investigation
 * (PRG-4402-SS, BRG-6205-ZZ, HSG-910-ALU) with 22% annual carrying-cost burn,
 * 1-click 5-column CSV template download, and embedded 4-Field Express Audit Modal.
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Clock,
  TrendingDown,
  Lock,
} from 'lucide-react';
import {
  downloadAuditTemplate,
  downloadPilotDataKitXlsx,
} from '../utils/pilotDataKitExporter';
import { trackServerFunnelEvent } from '../utils/analytics';
import { FactoryAuditModal } from './FactoryAuditModal';
import { getLiveSandboxReconciledModeMetrics } from '../utils/liveSandboxMetrics';

interface SampleAuditPageProps {
  onBackToHome: () => void;
  onOpenPlatform?: () => void;
  onOpenLeadInbox?: () => void;
}

interface FlaggedSkuRow {
  partId: string;
  description: string;
  category: string;
  closingQty: string;
  unitCostInr: string;
  bookValueInr: string;
  daysInactive: number;
  annualCarryingBurn22Pct: string;
  mondayFloorCheck: string;
  severity: 'DEAD_STOCK' | 'CRITICAL_SPARE' | 'SLOW_MOVING';
}

const MODE_A_FLAGGED_SKUS: FlaggedSkuRow[] = [
  {
    partId: 'PRG-4402-SS',
    description: 'CNC Machined Flange Housing (304 Stainless)',
    category: 'Finished Goods',
    closingQty: '420 Nos',
    unitCostInr: '₹1,850',
    bookValueInr: '₹7,77,000',
    daysInactive: 312,
    annualCarryingBurn22Pct: '₹1,70,940 / yr',
    mondayFloorCheck: 'Freeze reorder · Verify OEM schedule revision or convert to alternate customer order',
    severity: 'DEAD_STOCK',
  },
  {
    partId: 'HSG-910-ALU',
    description: 'Die-Cast Gearbox Cover Housing (LM24)',
    category: 'Raw Material / Castings',
    closingQty: '190 Nos',
    unitCostInr: '₹2,200',
    bookValueInr: '₹4,18,000',
    daysInactive: 196,
    annualCarryingBurn22Pct: '₹91,960 / yr',
    mondayFloorCheck: 'Initiate vendor contra / credit note negotiation against active die-casting POs',
    severity: 'DEAD_STOCK',
  },
  {
    partId: 'BRG-6205-ZZ',
    description: 'Sealed Spindle Bearing Assembly (High-Speed CNC)',
    category: 'Maintenance Spares',
    closingQty: '85 Nos',
    unitCostInr: '₹640',
    bookValueInr: '₹54,400',
    daysInactive: 214,
    annualCarryingBurn22Pct: '₹11,968 / yr',
    mondayFloorCheck: 'Retain 15 pcs under Item 07 Critical Machine Reserve · Liquidate 70 surplus units',
    severity: 'CRITICAL_SPARE',
  },
  {
    partId: 'SHF-304-EN24',
    description: 'Induction Hardened Drive Shaft 45mm Dia',
    category: 'WIP / Semi-Finished',
    closingQty: '140 Nos',
    unitCostInr: '₹2,450',
    bookValueInr: '₹3,43,000',
    daysInactive: 248,
    annualCarryingBurn22Pct: '₹75,460 / yr',
    mondayFloorCheck: 'Inspect rack B-04 for surface oxidation · Re-machine for standard 42mm assembly',
    severity: 'DEAD_STOCK',
  },
  {
    partId: 'VLV-150-CI',
    description: 'Industrial Gate Valve Body 150mm Cast Iron',
    category: 'Finished Goods',
    closingQty: '65 Nos',
    unitCostInr: '₹3,840',
    bookValueInr: '₹2,49,600',
    daysInactive: 142,
    annualCarryingBurn22Pct: '₹54,912 / yr',
    mondayFloorCheck: 'Velocity deceleration alert (90–180d) · Reduce safety-stock reorder point by 40%',
    severity: 'SLOW_MOVING',
  },
];

const MODE_B_FLAGGED_SKUS: FlaggedSkuRow[] = [
  {
    partId: 'PRG-4402-SS',
    description: 'CNC Machined Flange Housing (Canonical Floor Benchmark)',
    category: 'Finished Goods',
    closingQty: '420 Nos',
    unitCostInr: '₹1,850',
    bookValueInr: '₹7,77,000 (Case Ref)',
    daysInactive: 312,
    annualCarryingBurn22Pct: '₹1,70,940 / yr',
    mondayFloorCheck: 'Freeze reorder · Cross-check against 20-SKU sandbox Finished Goods exposure (₹1,35,250)',
    severity: 'DEAD_STOCK',
  },
  {
    partId: 'BRG-6205-ZZ',
    description: 'Sealed Spindle Bearing Assembly (Item 07 Reserve Benchmark)',
    category: 'Spares',
    closingQty: '85 Nos',
    unitCostInr: '₹640',
    bookValueInr: '₹54,400',
    daysInactive: 214,
    annualCarryingBurn22Pct: '₹11,968 / yr',
    mondayFloorCheck: 'Protected under Item 07 Machine Reserve Spares exclusion rule',
    severity: 'CRITICAL_SPARE',
  },
  {
    partId: 'HSG-910-ALU',
    description: 'Die-Cast Gearbox Cover Housing',
    category: 'Raw Material',
    closingQty: '190 Nos',
    unitCostInr: '₹2,200',
    bookValueInr: '₹4,18,000 (Case Ref)',
    daysInactive: 196,
    annualCarryingBurn22Pct: '₹91,960 / yr',
    mondayFloorCheck: 'Vendor contra recovery candidate in Monday materials review',
    severity: 'DEAD_STOCK',
  },
];

export const SampleAuditPage: React.FC<SampleAuditPageProps> = ({
  onBackToHome,
  onOpenPlatform,
}) => {
  const [datasetMode, setDatasetMode] = useState<'MODE_A_12400' | 'MODE_B_20'>('MODE_A_12400');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [modalSource, setModalSource] = useState('sample_audit_page');
  const liveSandboxMetrics = getLiveSandboxReconciledModeMetrics();

  useEffect(() => {
    trackServerFunnelEvent('SAMPLE_REPORT_CLICKED', {
      sourceSection: 'dedicated_sample_audit_route',
    });
  }, []);

  const openModalFrom = (source: string) => {
    setModalSource(source);
    trackServerFunnelEvent('AUDIT_MODAL_OPENED', { sourceSection: source });
    setShowAuditModal(true);
  };

  const activeSkus = datasetMode === 'MODE_A_12400' ? MODE_A_FLAGGED_SKUS : MODE_B_FLAGGED_SKUS;

  return (
    <div
      data-testid="dedicated-sample-audit-page"
      className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20"
    >
      {/* Sticky Top Action Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Homepage</span>
            </button>
            <div className="hidden sm:block">
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                OPERATIONALYST · ILLUSTRATIVE 48-HOUR FACTORY AUDIT REPORT (`/audit`)
              </div>
              <div className="text-[11px] text-slate-400">
                Prepared &amp; Reviewed by Founder C. Jones Snowin · Zero ERP Integration Required
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              data-testid="sample-audit-download-template-btn"
              onClick={() => downloadAuditTemplate('sample_audit_topbar')}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download 5-Column Template (.CSV)</span>
            </button>
            <button
              type="button"
              data-testid="sample-audit-request-pilot-btn"
              onClick={() => openModalFrom('sample_audit_sticky_cta')}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 transition"
            >
              <span>Run This on Your Stock (Free 48h Pilot) →</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-10">
        {/* Executive Report Banner & Dataset Switcher */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold uppercase">
                <Layers className="w-3.5 h-3.5" />
                <span>SAMPLE DELIVERABLE · 48-HOUR EXECUTIVE INVENTORY DIAGNOSTIC</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Factory Working-Capital &amp; Non-Moving SKU Audit Report
              </h1>
              <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                Generated from a standard 5-column export (<code className="font-mono text-emerald-300">Part_ID, Part_Description, Closing_Stock_Qty, Unit_Cost_INR, Last_Movement_Date</code>). Inspect both the 12,400-SKU Auto-Component Plant Case and the live 20-SKU Platform Sandbox below.
              </p>
            </div>

            {/* Mode A vs Mode B Toggle */}
            <div
              role="tablist"
              aria-label="Sample Audit Dataset Mode"
              className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 self-start shrink-0"
            >
              <button
                type="button"
                role="tab"
                data-testid="sample-audit-mode-a-tab"
                aria-selected={datasetMode === 'MODE_A_12400'}
                onClick={() => setDatasetMode('MODE_A_12400')}
                className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  datasetMode === 'MODE_A_12400'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mode A: 12,400-SKU Plant Case
              </button>
              <button
                type="button"
                role="tab"
                data-testid="sample-audit-mode-b-tab"
                aria-selected={datasetMode === 'MODE_B_20'}
                onClick={() => setDatasetMode('MODE_B_20')}
                className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  datasetMode === 'MODE_B_20'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mode B: 20-SKU Sandbox
              </button>
            </div>
          </div>

          {/* 4-Card Executive Summary Metrics */}
          {datasetMode === 'MODE_A_12400' ? (
            <div
              data-testid="sample-audit-kpi-grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-xs font-mono text-slate-400 uppercase">
                  Total Inventory Book Value
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                  ₹4,82,50,000
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  12,400 Line Items (Evaluated)
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-rose-950/25 border border-rose-500/30 space-y-1">
                <div className="text-xs font-mono text-rose-300 uppercase font-bold">
                  Non-Moving Dead Stock (&gt;180d)
                </div>
                <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">
                  ₹18,42,000
                </div>
                <div className="text-xs text-rose-200/80 font-mono">
                  &gt;180 Days Inactive (24 SKUs) · ₹4,05,240/yr Burn (22%)
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-amber-950/25 border border-amber-500/30 space-y-1">
                <div className="text-xs font-mono text-amber-300 uppercase font-bold">
                  Slow-Moving Stock (90–180d)
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                  ₹32,60,000
                </div>
                <div className="text-xs text-amber-200/80 font-mono">
                  90–180d Velocity Deceleration (41 SKUs)
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-1">
                <div className="text-xs font-mono text-emerald-300 uppercase font-bold">
                  Monday Priority Floor Targets
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  18 Priority SKUs
                </div>
                <div className="text-xs text-emerald-200/80 font-mono">
                  76% of Stagnant Capital Concentrated Here
                </div>
              </div>
            </div>
          ) : (
            <div
              data-testid="sample-audit-kpi-grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-xs font-mono text-slate-400 uppercase">
                  Total Inventory Book Value
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                  ₹6,45,650
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {liveSandboxMetrics.skusEvaluatedFormatted} (100% Coverage)
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-rose-950/25 border border-rose-500/30 space-y-1">
                <div className="text-xs font-mono text-rose-300 uppercase font-bold">
                  Non-Moving Dead Stock (&gt;180d)
                </div>
                <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">
                  ₹2,23,110
                </div>
                <div className="text-xs text-rose-200/80 font-mono">
                  &gt;180d Inactive (8 SKUs · 34.6%)
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-amber-950/25 border border-amber-500/30 space-y-1">
                <div className="text-xs font-mono text-amber-300 uppercase font-bold">
                  Slow-Moving Stock (90–179d)
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                  ₹63,600
                </div>
                <div className="text-xs text-amber-200/80 font-mono">
                  90–179d (2 SKUs · 9.9%)
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-1">
                <div className="text-xs font-mono text-emerald-300 uppercase font-bold">
                  Monday Priority Floor Targets
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  10 Priority SKUs
                </div>
                <div className="text-xs text-emerald-200/80 font-mono">
                  8 Dead + 2 Slow Items · Highest: {liveSandboxMetrics.highestValueCategory}
                </div>
              </div>
            </div>
          )}

          {/* Connected Multi-Pillar Summary Pills (P2 OTIF, P3 Freight, P4 Bin Accuracy) */}
          <div
            data-testid="sample-audit-connected-pillars"
            className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]"
          >
            <span className="text-slate-400 font-bold uppercase">
              Connected 4-Pillar Audit Signals:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 font-bold">
                {liveSandboxMetrics.connectedP2Pill}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                {liveSandboxMetrics.connectedP3Pill}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
                {liveSandboxMetrics.connectedP4Pill}
              </span>
            </div>
          </div>
        </section>

        {/* Top Flagged SKUs Requiring Floor Investigation Table */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>PARETO 80/20 ACTION LIST · 22% ANNUAL CARRYING-COST BURN</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Top Flagged SKUs Requiring Monday Floor Investigation
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Ranked by locked rupee exposure and carrying-cost burn. Critical machine reserve spares (<code className="font-mono text-emerald-300">BRG-6205-ZZ</code>) are automatically isolated under Item 07 so essential maintenance stock is never mistakenly scrapped.
              </p>
            </div>

            <button
              type="button"
              onClick={() => downloadPilotDataKitXlsx()}
              className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer self-start shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export 5-Sheet Audit Kit (.XLSX)</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table
              data-testid="sample-audit-flagged-skus-table"
              className="w-full text-left border-collapse text-xs"
            >
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                  <th className="py-3.5 px-4">Part_ID</th>
                  <th className="py-3.5 px-4">Part Description &amp; Category</th>
                  <th className="py-3.5 px-4">Closing Qty</th>
                  <th className="py-3.5 px-4">Locked Book Value</th>
                  <th className="py-3.5 px-4">Days Inactive</th>
                  <th className="py-3.5 px-4">22% Annual Burn</th>
                  <th className="py-3.5 px-4">Recommended Monday Floor Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {activeSkus.map((sku) => (
                  <tr key={sku.partId} className="hover:bg-slate-950/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                      {sku.partId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">{sku.description}</div>
                      <div className="text-[11px] font-mono text-slate-400">{sku.category}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-200 whitespace-nowrap">
                      {sku.closingQty}
                      <div className="text-[10px] text-slate-500">@ {sku.unitCostInr}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-300 whitespace-nowrap">
                      {sku.bookValueInr}
                    </td>
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          sku.severity === 'DEAD_STOCK'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : sku.severity === 'CRITICAL_SPARE'
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {sku.daysInactive} Days
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-300 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{sku.annualCarryingBurn22Pct}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 leading-relaxed max-w-md">
                      {sku.mondayFloorCheck}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bottom Conversion & Privacy Guarantee CTA Card */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 shadow-2xl space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase">
                <Clock className="w-3.5 h-3.5" />
                <span>48-HOUR TURNAROUND · DIRECT FOUNDER REVIEW</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-white">
                Ready to See Which SKUs Are Quietly Burning Working Capital in Your Plant?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Start with a 5-column export from Tally Prime, SAP, Busy, or Excel. Clicking below opens the 4-Field Express Request and immediately downloads <code className="font-mono text-emerald-300">Operationalyst_5_Column_Audit_Template.csv</code>.
              </p>
              <div className="pt-1 flex items-center gap-2 text-[11px] text-emerald-200 font-mono">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  Plain-English Privacy Guarantee: Strip vendor &amp; customer names. Purged within 14 days with a cryptographic Deletion Certificate (DELCERT-...).
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => openModalFrom('sample_audit_bottom_cta')}
                className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition"
              >
                <span>Run This on Your Stock (Free 48h Pilot)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => downloadAuditTemplate('sample_audit_bottom_csv')}
                className="px-4 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs inline-flex items-center gap-2 cursor-pointer transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download 5-Column CSV</span>
              </button>
              {onOpenPlatform && (
                <button
                  type="button"
                  onClick={onOpenPlatform}
                  className="px-4 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-mono text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Open Interactive 4-Pillar Sandbox</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Embedded 4-Field Express Pilot Audit Modal */}
      <FactoryAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        sourceView={modalSource}
      />
    </div>
  );
};
