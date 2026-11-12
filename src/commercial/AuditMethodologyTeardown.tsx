/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileCode2,
  Scale,
  TrendingDown,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  AlertOctagon,
  ArrowRight,
  Database,
  Calculator,
} from 'lucide-react';

interface AuditMethodologyTeardownProps {
  onOpenAudit: () => void;
  className?: string;
}

export const AuditMethodologyTeardown: React.FC<AuditMethodologyTeardownProps> = ({
  onOpenAudit,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'dead_stock' | 'otif_breach' | 'freight_leak'>('dead_stock');

  return (
    <div className={`rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-7 md:p-8 space-y-6 shadow-2xl ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
              Demonstrated Forensic Authority · Zero Fluff
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-mono text-slate-400">Published Audit Logic</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            How Operationalyst Mathematically Dissects Factory Data
          </h3>
          <p className="text-xs text-slate-400">
            We don&apos;t hide behind black-box AI claims. Here is the exact forensic methodology applied to every audit.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('dead_stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              activeTab === 'dead_stock'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Dead Stock Math
          </button>
          <button
            onClick={() => setActiveTab('otif_breach')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              activeTab === 'otif_breach'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. OTIF Loss Gate
          </button>
          <button
            onClick={() => setActiveTab('freight_leak')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              activeTab === 'freight_leak'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Freight Leak Audit
          </button>
        </div>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'dead_stock' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Step 1: Stagnancy Ingestion</span>
              <h4 className="text-sm font-bold text-white">Delta Days vs Movement Register</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Computes <code className="text-amber-300 font-mono text-[11px]">ΔDays = Today − Date(LastIssue)</code>.
                Any SKU exceeding 180 consecutive days without factory consumption is immediately isolated from active working capital assets.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Step 2: Pareto 80/20 Concentration</span>
              <h4 className="text-sm font-bold text-white">Rupee Exposure Ranking</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Sorts non-moving SKUs by <code className="text-amber-300 font-mono text-[11px]">UnitCost × QtyOnHand</code>.
                Typically, 12 to 18 SKUs constitute 78% of all stagnant cash, allowing management to focus on high-impact items first.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Step 3: Recovery Classification</span>
              <h4 className="text-sm font-bold text-white">Vendor Return vs Salvage</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Tags eligible stock for Tally Prime Contra Debit Notes (OEM return) at 100% credit or secondary scrap liquidation at 35–45% book value recovery.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300">
                Formula: <span className="text-rose-300">DeadStockCost</span> = Σ(SKU_Qty &gt; 180d × Purchase_Rate) + (AnnualCarryingCost% × 0.20)
              </span>
            </div>
            <button
              onClick={onOpenAudit}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer shrink-0"
            >
              Test with Your Plant Data →
            </button>
          </div>
        </div>
      )}

      {activeTab === 'otif_breach' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Step 1: Gate Open Time Stamp</span>
              <h4 className="text-sm font-bold text-white">Dispatch SLA Verification</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Cross-references Customer Purchase Order Promise Date with LR (Lorry Receipt) generation time and Gate Out pass.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Step 2: Crate Quantity Check</span>
              <h4 className="text-sm font-bold text-white">Full-Fulfillment Ratio</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Flags shipments where dispatched crate count &lt; PO quantity, instantly preventing Tier-1 penalty triggers and debit notes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Step 3: Root Cause Attribution</span>
              <h4 className="text-sm font-bold text-white">Machine vs Store vs Transporter</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Automated tagging identifies whether late shipment was caused by fabrication line delay (42%), store shortage (31%), or fleet unavailability (27%).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-300">
                Formula: <span className="text-amber-300">OTIF%</span> = (Dispatches On-Time &amp; In-Full / Total Dispatches) × 100
              </span>
            </div>
            <button
              onClick={onOpenAudit}
              className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer shrink-0"
            >
              Analyze Your Dispatches →
            </button>
          </div>
        </div>
      )}

      {activeTab === 'freight_leak' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Step 1: Lane Contract Rate Lookup</span>
              <h4 className="text-sm font-bold text-white">Agreed Benchmark Comparison</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Matches billed freight voucher against contracted destination rate card per tonne/km.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Step 2: Fake Detention Extraction</span>
              <h4 className="text-sm font-bold text-white">Halting Hours Cross-Check</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Verifies transporter detention claims against security gate in/out logs to detect fabricated waiting charges.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Step 3: 1-Click Transporter Debit Note</span>
              <h4 className="text-sm font-bold text-white">Direct Ledger Recovery</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Exports accounting debit note directly deductible from the transporter&apos;s next monthly payment cycle.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300">
                Formula: <span className="text-emerald-300">FreightLeakage</span> = BilledAmount − (AgreedPerTonneRate × ActualWeight) − LegitimateDetention
              </span>
            </div>
            <button
              onClick={onOpenAudit}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer shrink-0"
            >
              Audit Transporter Invoices →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
