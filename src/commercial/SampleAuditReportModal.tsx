/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  ArrowRight,
  Info,
  Printer,
  ExternalLink,
  Package,
  Truck,
  IndianRupee,
  Warehouse,
} from 'lucide-react';
import { getReconciledSampleAuditModes } from './homepageConfig';

interface SampleAuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestAudit: () => void;
  onOpenLiveWalkthrough?: () => void;
}

export const SampleAuditReportModal: React.FC<SampleAuditReportModalProps> = ({
  isOpen,
  onClose,
  onRequestAudit,
  onOpenLiveWalkthrough,
}) => {
  const [activeTab, setActiveTab] = useState<
    'summary' | 'sku_list' | 'methodology' | 'briefing_2page' | 'limitations'
  >('summary');

  if (!isOpen) return null;

  const modes = getReconciledSampleAuditModes();
  const sandboxMode = modes.sandbox_20;
  const illustrativeMode = modes.illustrative_12400;

  const handlePrintBriefing = () => {
    setActiveTab('briefing_2page');
    setTimeout(() => {
      window.print();
    }, 80);
  };

  const handleLaunchWalkthrough = () => {
    if (onOpenLiveWalkthrough) {
      onOpenLiveWalkthrough();
      return;
    }
    window.location.href =
      '/?view=pilot-findings&id=AUDIT-DEMO-P1P4&token=operationalyst-public-demo-token';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sample-report-title"
    >
      <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-5xl w-full p-4 sm:p-6 md:p-8 shadow-2xl border border-slate-750 relative space-y-6 my-6 max-h-[92vh] overflow-y-auto font-sans">
        {/* Top Watermark & Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono no-print">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold uppercase tracking-wider">
              ILLUSTRATIVE EXAMPLE • RECONCILED DEMONSTRATION DATA
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="sample-modal-print-briefing-btn"
              onClick={handlePrintBriefing}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Print / Save 2-Page Executive PDF Briefing</span>
            </button>
            <button
              type="button"
              data-testid="sample-modal-open-audit-page-btn"
              onClick={() => {
                window.location.href = '/?view=sample-audit';
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Open Full-Page Sample Report (/audit)</span>
            </button>
            <button
              type="button"
              data-testid="sample-modal-open-walkthrough-btn"
              onClick={handleLaunchWalkthrough}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Open Live 4-Pillar Interactive Walkthrough (P1–P4)</span>
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Forensic Deliverable Preview (P1–P4)
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs font-mono text-slate-400">File: Stock_Register_Q3_Dump.xlsx</span>
            </div>
            <h2 id="sample-report-title" className="text-xl sm:text-2xl font-black text-white">
              Factory Inventory Risk &amp; Working Capital Audit
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Prepared by: C. Jones Snowin (Operationalyst / Snowin Ventures, Chennai) · Mode A: 12,400-SKU Plant Case (₹4,82,50,000) &amp; Mode B: 20-SKU Sandbox (₹6,45,650)
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer no-print"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          role="tablist"
          aria-label="Sample Audit Report Sections"
          className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none no-print"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'summary'}
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Executive Summary
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sku_list'}
            onClick={() => setActiveTab('sku_list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              activeTab === 'sku_list'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. High-Priority SKUs
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'methodology'}
            onClick={() => setActiveTab('methodology')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              activeTab === 'methodology'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Investigation Sequence
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'briefing_2page'}
            data-testid="sample-modal-tab-2page"
            onClick={() => setActiveTab('briefing_2page')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              activeTab === 'briefing_2page'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            4. 2-Page Executive PDF Briefing
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'limitations'}
            onClick={() => setActiveTab('limitations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              activeTab === 'limitations'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            5. Scope &amp; Limitations
          </button>
        </div>

        {/* Tab 1: Executive Summary (Reconciled with Mode A 12,400-SKU & Mode B 20-SKU Sandbox) */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
              Mode A: 12,400-SKU Plant Case (Mid-Sized Auto-Component Plant Benchmark)
            </div>
            {/* Top 4 Reconciled Metric Cards (Mid-Sized Auto-Component Plant Case) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Total Book Value</div>
                <div className="text-xl sm:text-2xl font-black text-white mt-1">
                  {illustrativeMode.totalBookValueFormatted}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {illustrativeMode.skusEvaluatedText}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/30">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Non-Moving Stock (&gt;180d)</div>
                <div className="text-xl sm:text-2xl font-black text-rose-300 mt-1">
                  {illustrativeMode.deadStockValueFormatted}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {illustrativeMode.deadStockSubtext}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Slow-Moving (90–180d)</div>
                <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
                  {illustrativeMode.slowMovingValueFormatted}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {illustrativeMode.slowMovingSubtext}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 bg-emerald-950/10">
                <div className="text-[10px] text-emerald-300 uppercase font-bold">Pareto Priority Focus</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                  {illustrativeMode.prioritySkusHeadline}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {illustrativeMode.prioritySkusSubtext}
                </div>
              </div>
            </div>

            {/* Connected Multi-Pillar Summary (P1-P4 Live Sandbox Verification) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
                  Mode B: 20-SKU Sandbox (Live P1–P4 Engine Verification)
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  As-Of Date: 2026-03-31 · Deterministic Engine Output
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    <span>P1 • DEAD STOCK &amp; CASH</span>
                  </div>
                  <div className="font-bold text-white">
                    {sandboxMode.deadStockValueFormatted} Dead / {sandboxMode.slowMovingValueFormatted} Slow
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {sandboxMode.totalBookValueFormatted} across 20 SKUs
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-sky-400 font-bold flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    <span>P2 • GATE OTIF DISPATCH</span>
                  </div>
                  <div className="font-bold text-white">{sandboxMode.p2OtifPill}</div>
                  <div className="text-[11px] text-slate-400">Dual-Gate On-Time &amp; In-Full</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>P3 • FREIGHT AUDIT</span>
                  </div>
                  <div className="font-bold text-white">{sandboxMode.p3FreightPill}</div>
                  <div className="text-[11px] text-slate-400">Rate Overcharge + Detention</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-purple-400 font-bold flex items-center gap-1">
                    <Warehouse className="w-3.5 h-3.5" />
                    <span>P4 • BIN ACCURACY</span>
                  </div>
                  <div className="font-bold text-white">{sandboxMode.p4BinPill}</div>
                  <div className="text-[11px] text-slate-400">10 Warehouse Bins Audited</div>
                </div>
              </div>
            </div>

            {/* Category Level Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Category-Level Stagnancy Breakdown (₹18,42,000 Non-Moving Exposure)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Precision Machined Castings</div>
                  <div className="text-base font-bold text-rose-300">₹8,42,000</div>
                  <div className="text-[10px] text-slate-400">45.7% of non-moving capital</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Specialty Fasteners &amp; Kits</div>
                  <div className="text-base font-bold text-amber-300">₹4,15,000</div>
                  <div className="text-[10px] text-slate-400">MOQ bulk order excess</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Raw Steel Bars (EN8 / EN24)</div>
                  <div className="text-base font-bold text-amber-300">₹3,85,000</div>
                  <div className="text-[10px] text-slate-400">Customer drawing revision obsolete</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Packaging &amp; Maintenance Spares</div>
                  <div className="text-base font-bold text-slate-300">₹2,00,000</div>
                  <div className="text-[10px] text-slate-400">Slow rotation in Bay 4</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: High-Priority SKU List */}
        {activeTab === 'sku_list' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Top 5 Priority Stagnant SKUs (Pareto Ranked by Rupee Exposure)</span>
              <span className="text-amber-400">Sorted by Total Value Locked</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">SKU / Part No</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Qty on Hand</th>
                    <th className="py-2.5 px-3">Unit Cost</th>
                    <th className="py-2.5 px-3 text-right">Total Value</th>
                    <th className="py-2.5 px-3 text-center">Days Idle</th>
                    <th className="py-2.5 px-3">Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/60 text-slate-200">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-rose-300">#CSG-8812</td>
                    <td className="py-2.5 px-3 text-slate-300">Heavy Pinion Gear Housing (Cast Iron)</td>
                    <td className="py-2.5 px-3">48 Units</td>
                    <td className="py-2.5 px-3">₹8,500</td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-400">₹4,08,000</td>
                    <td className="py-2.5 px-3 text-center text-rose-400 font-bold">214d</td>
                    <td className="py-2.5 px-3 text-emerald-300">Vendor Contra Debit Note</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-rose-300">#BRG-4092</td>
                    <td className="py-2.5 px-3 text-slate-300">Taper Roller Bearing Assembly</td>
                    <td className="py-2.5 px-3">120 Sets</td>
                    <td className="py-2.5 px-3">₹2,400</td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-400">₹2,88,000</td>
                    <td className="py-2.5 px-3 text-center text-rose-400 font-bold">198d</td>
                    <td className="py-2.5 px-3 text-emerald-300">Tier-1 Consignment Offset</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-rose-300">#SFT-1044</td>
                    <td className="py-2.5 px-3 text-slate-300">Splined Input Shaft (Forged 40Cr4)</td>
                    <td className="py-2.5 px-3">65 Pcs</td>
                    <td className="py-2.5 px-3">₹3,800</td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-400">₹2,47,000</td>
                    <td className="py-2.5 px-3 text-center text-rose-400 font-bold">186d</td>
                    <td className="py-2.5 px-3 text-amber-300">Machine Rework to Alt Variant</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-amber-300">#FST-9901</td>
                    <td className="py-2.5 px-3 text-slate-300">Grade 10.9 Flange Bolts M16x120</td>
                    <td className="py-2.5 px-3">2,200 Pcs</td>
                    <td className="py-2.5 px-3">₹85</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-300">₹1,87,000</td>
                    <td className="py-2.5 px-3 text-center text-amber-300 font-bold">240d</td>
                    <td className="py-2.5 px-3 text-slate-300">Central Store Consolidation</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-amber-300">#RMB-3300</td>
                    <td className="py-2.5 px-3 text-slate-300">Round Bar Stock EN24 Dia 60mm</td>
                    <td className="py-2.5 px-3">1.2 Tonnes</td>
                    <td className="py-2.5 px-3">₹1,25,000/T</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-300">₹1,50,000</td>
                    <td className="py-2.5 px-3 text-center text-amber-300 font-bold">182d</td>
                    <td className="py-2.5 px-3 text-slate-300">Raw Material Pool Allocation</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Investigation Sequence */}
        {activeTab === 'methodology' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Recommended 4-Week Investigation Sequence
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] text-amber-400 font-bold">WEEK 01 · PHYSICAL VERIFICATION</span>
                <p className="text-slate-300 leading-relaxed font-sans">
                  Audit top 18 priority SKUs on warehouse racks to verify physical existence and condition before initiating accounting adjustments.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] text-emerald-400 font-bold">WEEK 02 · VENDOR CONTRA NOTES</span>
                <p className="text-slate-300 leading-relaxed font-sans">
                  Issue formal debit notes for defective or obsolete vendor-supplied forgings and bearings where warranty or contract returns apply.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] text-cyan-400 font-bold">WEEK 03 · PRODUCTION REWORK</span>
                <p className="text-slate-300 leading-relaxed font-sans">
                  Evaluate semi-finished shafts and bars for secondary CNC machining into fast-moving active assembly part numbers.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] text-rose-400 font-bold">WEEK 04 · SCRAP LIQUIDATION</span>
                <p className="text-slate-300 leading-relaxed font-sans">
                  Execute competitive scrap bid for items obsolete for &gt;360 days to free physical floor space and release immediate cash.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: 2-Page Executive Print / PDF Briefing */}
        {activeTab === 'briefing_2page' && (
          <div className="space-y-6" data-testid="executive-2page-briefing-layout">
            {/* Page 1 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5 print-page print-page-break">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                    PAGE 1 OF 2 — EXECUTIVE WORKING CAPITAL &amp; OPERATIONAL LEAKAGE SUMMARY
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                    Operationalyst 4-Pillar Manufacturing Audit Briefing
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Prepared by C. Jones Snowin (Operationalyst / Snowin Ventures, Chennai) · As-Of Date: 2026-03-31
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-300">
                  Ref: AUDIT-DEMO-P1P4
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-mono">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="text-emerald-400 font-bold uppercase">
                    P1 • Dead Stock &amp; Cash Release (20 SKUs)
                  </div>
                  <div className="text-slate-200">
                    Total Stock Value: <strong>{sandboxMode.totalBookValueFormatted}</strong>
                  </div>
                  <div className="text-rose-300">
                    Dead Stock (&gt;180d): <strong>{sandboxMode.deadStockValueFormatted}</strong> ({sandboxMode.deadStockSubtext})
                  </div>
                  <div className="text-amber-300">
                    Slow-Moving (90–179d): <strong>{sandboxMode.slowMovingValueFormatted}</strong> ({sandboxMode.slowMovingSubtext})
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="text-sky-400 font-bold uppercase">
                    P2 • Dual-Gate OTIF Dispatch Audit (18 Dispatches)
                  </div>
                  <div className="text-slate-200">
                    Strict Dual-Gate Pass Rate: <strong>50.0% (9 / 18 Passed)</strong>
                  </div>
                  <div className="text-rose-300">
                    Failures: <strong>3 Late Only · 2 Short Only · 4 Late &amp; Short</strong>
                  </div>
                  <div className="text-slate-400">
                    Primary Root Cause: Raw Material Stockout &amp; Bay Congestion
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="text-amber-400 font-bold uppercase">
                    P3 • Freight Rate &amp; Detention Audit (12 Trips)
                  </div>
                  <div className="text-slate-200">
                    Total Billed Carrier Spend: <strong>₹1,82,200</strong>
                  </div>
                  <div className="text-rose-300">
                    Verified Leakage: <strong>₹13,944 (₹6,444 Rate Overcharge + ₹7,500 Detention)</strong>
                  </div>
                  <div className="text-slate-400">
                    Flagged Trips: 9 of 12 trips exceeded lane benchmark
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="text-purple-400 font-bold uppercase">
                    P4 • Warehouse Blind Bin Variance (10 Bins)
                  </div>
                  <div className="text-slate-200">
                    Bin Match Accuracy: <strong>60.0% (6 Matched / 4 Mismatched)</strong>
                  </div>
                  <div className="text-rose-300">
                    Ghost Stock Shortage: <strong>₹24,240</strong> · Unrecorded Surplus: <strong>₹2,100</strong>
                  </div>
                  <div className="text-slate-400">
                    Slotting Exceptions: 2 fast movers hidden in back racks
                  </div>
                </div>
              </div>
            </div>

            {/* Page 2 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5 print-page">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                    PAGE 2 OF 2 — TOP PRIORITY ACTION SCHEDULE &amp; AUDIT GOVERNANCE
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                    Immediate Shop-Floor Verification &amp; Analytical Boundaries
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Operationalyst · C. Jones Snowin
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="font-bold text-slate-200 uppercase">
                  1. Priority Dead-Stock &amp; Bin Exceptions to Verify First:
                </div>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside font-sans">
                  <li>
                    <strong>P1 Dead Stock Top Exposure:</strong> Verify physical rack status and supplier contra-return eligibility on top Class-A non-moving Raw Material &amp; Spare Part lines (&gt;180 days idle).
                  </li>
                  <li>
                    <strong>P3 Carrier Debit Notes:</strong> Audit flagged transporter invoices exceeding lowest clean lane rate per tonne and enforce gate-in/gate-out timestamp logging to curb ₹7,500 detention drain.
                  </li>
                  <li>
                    <strong>P4 Ghost Stock Reconciliation:</strong> Recount mismatched bins (₹24,240 shortage exposure) before releasing replenishment POs.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-2 text-xs">
                <div className="font-mono font-bold text-amber-300 uppercase">
                  2. Documented Assumptions &amp; Analytical Boundaries:
                </div>
                <ul className="space-y-1 text-slate-300 font-sans list-disc list-inside">
                  <li>
                    <strong>Deterministic Formulas:</strong> Ageing is computed strictly from last movement date to audit as-of date; carrying drain uses 22% p.a. configurable cost of capital.
                  </li>
                  <li>
                    <strong>Managerial Discretion:</strong> Critical insurance spares and statutory safety stock must be reviewed by plant engineering before liquidation or scrap disposal.
                  </li>
                  <li>
                    <strong>Data Governance:</strong> Read-only analysis with zero automated ERP write-back. Prepared by C. Jones Snowin (Snowin Ventures, Chennai · joneszz2004@gmail.com).
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Scope & Limitations */}
        {activeTab === 'limitations' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3 text-xs text-slate-300 font-sans">
              <div className="flex items-center gap-2 text-amber-400 font-mono font-bold uppercase text-xs">
                <ShieldAlert className="w-4 h-4" />
                <span>Explicit Scope &amp; Legal Limitations (What the Audit Does NOT Do)</span>
              </div>
              <p className="leading-relaxed">
                To maintain complete commercial integrity, Operationalyst publishes explicit limitations:
              </p>
              <ul className="space-y-2 font-mono text-[11px] text-slate-300 list-disc list-inside">
                <li>
                  <strong className="text-white">Does NOT Guarantee Immediate Rupee Recovery:</strong> Recovery velocity depends on vendor contract terms, scrap market rates, and internal shop-floor agility.
                </li>
                <li>
                  <strong className="text-white">Does NOT Replace Managerial Judgment:</strong> Certain slow-moving parts are legitimate safety stock for critical machinery breakdowns. Final disposition decisions remain with the plant manager.
                </li>
                <li>
                  <strong className="text-white">Depends on Data Accuracy:</strong> Findings reflect the precision of your uploaded stock register. If stock dumps have outdated last-movement dates, findings will note these data gaps.
                </li>
                <li>
                  <strong className="text-white">Zero Third-Party Data Transfer:</strong> All file processing is performed in your isolated session. No data is stored, indexed, or shared externally.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800 no-print">
          <div className="text-xs font-mono text-slate-400 text-center sm:text-left">
            <span>Want a report like this generated for your factory&apos;s inventory?</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer transition"
            >
              Close Preview
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestAudit();
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md touch-manipulation active:scale-95"
            >
              <span>Request Free Pilot Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
