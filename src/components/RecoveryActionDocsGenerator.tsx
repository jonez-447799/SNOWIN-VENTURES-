import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Copy,
  Check,
  Printer,
  Send,
  Package,
  Truck,
  Scale,
  ScanBarcode,
  Radio,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  Download
} from 'lucide-react';

// Live Engine Imports
import { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES as P1_DEFAULT_RULES } from '../project1/data/initialData';
import { generateOwnerReport, evaluateStockEngine, formatCurrency } from '../project1/utils/calculations';
import { INITIAL_DISPATCHES, INITIAL_RULES as P2_DEFAULT_RULES } from '../project2/data/initialData';
import { INITIAL_WORKSPACES } from '../project2/data/factoryWorkspaces';
import { calculateOTIFMetrics, calculateRowStatus } from '../project2/utils/otifCalculator';
import { INITIAL_TRIPS, DEFAULT_RULES as P3_DEFAULT_RULES } from '../project3/data/defaultData';
import { calculateAuditMetrics } from '../project3/utils/auditCalculations';
import { INITIAL_SAMPLE_SKUS as P4_INITIAL_SKUS, DEFAULT_RULES as P4_DEFAULT_RULES } from '../project4/data/sampleData';
import { computeSummary as computeP4Summary, computePredictiveShortages, calculateItemFields } from '../project4/utils/auditCalculations';
import { INITIAL_TOWER_DATA, SAMPLE_UNPAID_BILLS } from '../project5/data/sampleData';

type DocCategory = 'p3_debit_note' | 'p1_liquidation_rfq' | 'p4_reorder_memo' | 'p2_gate_directive' | 'p5_debtor_notice';

export const RecoveryActionDocsGenerator: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<DocCategory>('p3_debit_note');
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const onRefresh = () => setRefreshTick((t) => t + 1);
    window.addEventListener('storage', onRefresh);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('factory_suite_live_sync');
      bc.onmessage = onRefresh;
    } catch {}
    return () => {
      window.removeEventListener('storage', onRefresh);
      if (bc) bc.close();
    };
  }, []);

  // Pull live data across P1–P5
  const liveData = useMemo(() => {
    // P1
    const p1Raw = JSON.parse(localStorage.getItem('p1_stock_items') || 'null') || AMBATTUR_FABRICATION_SAMPLE;
    const p1Rules = JSON.parse(localStorage.getItem('p1_stock_rules') || 'null') || P1_DEFAULT_RULES;
    const p1Evaluated = evaluateStockEngine(p1Raw, p1Rules);
    const p1Summary = generateOwnerReport(p1Raw, p1Rules);
    const p1DeadItems = p1Evaluated.filter((i) => i.status === 'Dead');
    const p1SlowItems = p1Evaluated.filter((i) => i.status === 'Slow');

    // P2
    let p2Dispatches = INITIAL_DISPATCHES;
    let p2Rules = P2_DEFAULT_RULES;
    try {
      const savedWs = JSON.parse(localStorage.getItem('otif_workspaces_v2') || 'null');
      const activeId = localStorage.getItem('otif_active_workspace_id_v2') || INITIAL_WORKSPACES[0].id;
      if (savedWs) {
        const found = savedWs.find((w: any) => w.id === activeId) || savedWs[0];
        if (found) {
          p2Dispatches = found.dispatches || INITIAL_DISPATCHES;
          p2Rules = found.rules || P2_DEFAULT_RULES;
        }
      }
    } catch {}
    const p2Summary = calculateOTIFMetrics(p2Dispatches, p2Rules);
    const p2Rows = p2Dispatches.map((d: any) => calculateRowStatus(d, p2Rules));
    const p2Fails = p2Rows.filter((r: any) => !r.otifPass);

    // P3
    const p3Raw = JSON.parse(localStorage.getItem('freight_audit_trips_v1') || 'null') || INITIAL_TRIPS;
    const p3Rules = JSON.parse(localStorage.getItem('freight_audit_rules_v1') || 'null') || P3_DEFAULT_RULES;
    const p3Audit = calculateAuditMetrics(p3Raw, p3Rules);
    const p3LeakingTrips = p3Audit.calculatedTrips.filter((t) => t.totalLeak > 0).sort((a, b) => b.totalLeak - a.totalLeak);

    // P4
    const p4Raw = JSON.parse(localStorage.getItem('binaudit_skus_v1') || 'null') || P4_INITIAL_SKUS;
    const p4Rules = JSON.parse(localStorage.getItem('binaudit_rules_v1') || 'null') || P4_DEFAULT_RULES;
    const p4Enriched = p4Raw.map((it: any) => calculateItemFields(it, p4Rules));
    const p4Summary = computeP4Summary(p4Raw, p4Rules);
    const p4Shortages = computePredictiveShortages(p4Raw, p4Rules).filter(
      (s) => s.severity === 'critical' || s.severity === 'warning'
    );
    const p4MissingBins = p4Enriched.filter((it: any) => (it.gapRupees ?? 0) < 0);

    // P5
    const p5Tower = JSON.parse(localStorage.getItem('monday_control_tower_v1') || 'null') || INITIAL_TOWER_DATA;
    const p5Bills = JSON.parse(localStorage.getItem('p5_unpaid_bills_v1') || 'null') || SAMPLE_UNPAID_BILLS;

    return {
      p1Rules,
      p1Summary,
      p1DeadItems,
      p1SlowItems,
      p2Summary,
      p2Fails,
      p3Audit,
      p3LeakingTrips,
      p4Summary,
      p4Shortages,
      p4MissingBins,
      p5Tower,
      p5Bills,
    };
  }, [refreshTick]);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Generate actual live-data-populated commercial execution documents
  const generatedDocument = useMemo(() => {
    const clientName = liveData.p5Tower.clientName || liveData.p1Rules.clientName || 'Ambattur Fabrication Pvt Ltd';

    if (activeDoc === 'p3_debit_note') {
      const topTransporter =
        (liveData.p3Audit as any).topLeakingTransporter?.transporter ||
        liveData.p3Audit.transporterSummaries?.[0]?.transporter ||
        'Primary Fleet Carrier';
      const totalClaim = liveData.p3Audit.totals.totalLeak;
      const tripLines = liveData.p3LeakingTrips
        .slice(0, 6)
        .map(
          (t, i) =>
            `${i + 1}. LR #${t.id} (${t.date}) | Lane: ${t.lane} | Transporter: ${t.transporter} | Billed: ${formatCurrency(t.bill, 'INR')} | Benchmark Variance + Detention Leak: ${formatCurrency(t.totalLeak, 'INR')} (${t.waitHours}h gate wait)`
        )
        .join('\n');

      return {
        title: 'Formal Transporter Freight Debit Note & Corridor Rate-Cap Notice (P3)',
        recipient: `To: Accounts Payable & ${topTransporter} Billing Desk`,
        recoveryAmount: formatCurrency(totalClaim, 'INR'),
        body: `OFFICIAL FREIGHT AUDIT DEBIT NOTE & CORRIDOR RATE-CAP DIRECTIVE
Company: ${clientName}
Audit Date: ${todayStr}
Subject: Deduction of Excess Corridor Rate & Unapproved Halting Charges — Total Claim: ${formatCurrency(totalClaim, 'INR')}

Dear Logistics & Accounts Payable Team,

Following our 60-day Lorry Receipt (LR) forensic audit across ${liveData.p3Audit.totals.totalTrips} trips (Total Freight Paid: ${formatCurrency(liveData.p3Audit.totals.freightPaid, 'INR')}), we have identified ${formatCurrency(totalClaim, 'INR')} in excess rate billing and unapproved detention charges:
• Rate Variance Leak above P25 Corridor Benchmark: ${formatCurrency(liveData.p3Audit.totals.rateLeak, 'INR')}
• Gate Waiting / Halting Detention Leak: ${formatCurrency(liveData.p3Audit.totals.detention ?? (liveData.p3Audit.totals as any).detentionLeak ?? 0, 'INR')}

ITEMIZED FLAGGED LORRY BILLS FOR IMMEDIATE CREDIT / DEDUCTION:
${tripLines || 'No leaking trips currently flagged.'}

MANDATORY ACTION BEFORE THIS FRIDAY'S PAYMENT RUN:
1. Accounts Payable is instructed to hold/deduct ${formatCurrency(totalClaim, 'INR')} pending revised credit notes on the above LRs.
2. Effective immediately, all future bookings on these corridors are capped at our P25 benchmark rate card. Any spot rate above benchmark requires prior written MD sign-off.

Authorized Signatory,
Managing Director — ${clientName}`,
      };
    }

    if (activeDoc === 'p1_liquidation_rfq') {
      const deadTotal = liveData.p1Summary.deadCash;
      const targetRecovery50 = Math.round(deadTotal * 0.5);
      const targetRecovery70 = Math.round(deadTotal * 0.7);
      const itemLines = liveData.p1DeadItems
        .slice(0, 8)
        .map(
          (it, idx) =>
            `${idx + 1}. [${it.itemCode}] ${it.itemName} (${it.category}) — Qty: ${it.qtyOnHand} pcs | Book Value: ${formatCurrency(it.closingValue || 0, 'INR')} | Idle: ${it.daysIdle} days | Reserve Bid (60%): ${formatCurrency(Math.round((it.closingValue || 0) * 0.6), 'INR')}`
        )
        .join('\n');

      return {
        title: 'Dead Cash Inventory Liquidation & Supplier Credit-Swap RFQ (P1 — Cash Recovery Engine)',
        recipient: 'To: Stores In-Charge, Finance Head & Approved Secondary Metal/Spares Buyers',
        recoveryAmount: `${formatCurrency(targetRecovery50, 'INR')} – ${formatCurrency(targetRecovery70, 'INR')} Cash Release`,
        body: `PROJECT 1 CASH RECOVERY ENGINE: DEAD INVENTORY LIQUIDATION & SUPPLIER RETURN RFQ
Company: ${clientName}
Date: ${todayStr}
Total Dead Cash Locked in Inventory (>180 Days Idle): ${formatCurrency(deadTotal, 'INR')} (${liveData.p1DeadItems.length} SKUs)
Slow-Moving Cash Tied Up (90–179 Days Idle): ${formatCurrency(liveData.p1Summary.slowCash, 'INR')} (${liveData.p1SlowItems.length} SKUs)
Annual Carrying Burn Being Stopped: ${formatCurrency(liveData.p1Summary.annualHoldingBurn, 'INR')}/yr

STRICT P1 SCOPE MANDATE:
P1 focuses strictly on unlocking Dead Cash trapped in idle inventory (it does NOT perform production planning, purchase planning, dispatch tracking, or OTIF analysis).

LOT LIQUIDATION / SUPPLIER CREDIT-SWAP SCHEDULE:
We invite sealed lot-clearance quotes / supplier return credit notes by Friday 5:00 PM for the following idle inventory lots:
${itemLines || 'No Dead Stock items currently in ledger.'}

TARGET CASH RECOVERY BAND:
• Conservative Floor (50% Lot Clearance): ${formatCurrency(targetRecovery50, 'INR')}
• Supplier Return / Exchange Target (70%): ${formatCurrency(targetRecovery70, 'INR')}

Authorized Signatory,
Managing Director — ${clientName}`,
      };
    }

    if (activeDoc === 'p4_reorder_memo') {
      const shortRupees = liveData.p4Summary.shelfShortRupees;
      const missingLines = liveData.p4MissingBins
        .slice(0, 6)
        .map(
          (it: any, idx: number) =>
            `${idx + 1}. [${it.code}] ${it.part} | Location: ${it.spot} | Tally Book Qty: ${it.systemQty} | Physical Hand Count: ${it.physicalQty} | Missing Variance: ${it.gapQty} units (${formatCurrency(Math.abs(it.gapRupees || 0), 'INR')})`
        )
        .join('\n');

      const reorderLines = liveData.p4Shortages
        .slice(0, 6)
        .map(
          (s, idx) =>
            `${idx + 1}. [${s.code}] ${s.part} | Hand Stock: ${s.physicalQty} pcs | Burn: ${s.monthlyVelocity}/mo | Cover Left: ${s.daysRemaining} days (${s.severity.toUpperCase()}) ➔ ORDER NOW: +${s.recommendedReorderQty} pcs`
        )
        .join('\n');

      return {
        title: 'Ghost-Stock Variance Reconciliation Memo & 45-Day Emergency Reorder Indent (P4)',
        recipient: 'To: Storekeeper, Tally Accounts Clerk & Spares Purchase Desk',
        recoveryAmount: `${formatCurrency(shortRupees, 'INR')} Shrinkage Audit`,
        body: `PRE-SHUTTER PHYSICAL BIN AUDIT: VARIANCE MEMO & EMERGENCY REORDER INDENT
Company: ${clientName}
Audit Date: ${todayStr}
Bins Audited: ${liveData.p4Summary.skusCounted} SKUs | Mismatched Lines: ${liveData.p4Summary.linesMismatch} | Net Shelf Shortage: ${formatCurrency(shortRupees, 'INR')}

1. GHOST STOCK & PHYSICAL SHRINKAGE EXPLANATION REQUIRED WITHIN 24 HRS:
The following bins have fewer physical units on the shelf than recorded in Tally ERP. Storekeeper & Accounts must reconcile whether these were unbilled counter issues, warranty swaps, or pilferage:
${missingLines || 'Zero negative bin variances.'}

2. EMERGENCY FAST-MOVER REORDER INDENT (TO PREVENT SERVICE BAY / LINE STOPPAGE):
Based on verified physical hand counts (NOT Tally book quantities), the following high-velocity SKUs have critical days of cover remaining and must be ordered today:
${reorderLines || 'All fast-moving bins have >30 days cover.'}

3. GOLDEN-ZONE RE-SLOTTING MANDATE:
Move the ${liveData.p4Summary.fastMoversHidden} high-velocity SKUs currently stored in Back Rack / Mezzanine directly to the front Counter selling face before tomorrow 8:30 AM.

Authorized Signatory,
Operations & Stores Audit — ${clientName}`,
      };
    }

    if (activeDoc === 'p2_gate_directive') {
      const topReason =
        (liveData.p2Summary as any).topKillers?.[0]?.reason ||
        (liveData.p2Summary as any).topReasons?.[0]?.reason ||
        'Final QC Hold';
      const failedCount = liveData.p2Summary.totalDispatches - liveData.p2Summary.passes;
      const failLines = liveData.p2Fails
        .slice(0, 6)
        .map(
          (f: any, idx: number) =>
            `${idx + 1}. PO: ${f.po} (${f.customer}) | Part: ${f.part} | Shipped: ${f.shippedQty}/${f.orderedQty} | Late: +${f.lateHours}h | Root Cause: ${f.delayReason || 'Unassigned'}`
        )
        .join('\n');

      return {
        title: 'Shop-Floor Gate Cutoff & Pre-Dispatch QC Sign-Off Directive (P2)',
        recipient: 'To: Plant Head, Final QC Inspector, Packing Supervisor & Security Gate',
        recoveryAmount: `Stops ${failedCount} Failed OEM Loads (${liveData.p2Summary.otifPercent}% ➔ 95% OTIF)`,
        body: `MANDATORY GATE-CLOCK SLA & ZERO-SHORT-SHIPMENT DIRECTIVE
Company: ${clientName}
Date: ${todayStr}
Current Strict OTIF Score: ${liveData.p2Summary.otifPercent}% (${liveData.p2Summary.passes} Passes / ${liveData.p2Summary.totalDispatches} Total Dispatches)
#1 Shop-Floor Bottleneck Identified: ${topReason}

RECENT FAILED DISPATCHES (LATE OR SHORT-SHIPPED):
${failLines || 'All dispatches passed strict OTIF.'}

NEW MANDATORY SHOP-FLOOR PROTOCOL EFFECTIVE IMMEDIATELY:
1. T-Minus 3 Hours Pre-Gate Rule for "${topReason}": All final QC inspections and packing counts for scheduled afternoon dispatches must be completed 3 hours BEFORE the promised customer gate slot—never while the lorry is waiting at the gate.
2. Zero Unapproved Short-Shipments: Security Gate is instructed not to generate gate-out passes for any challan where Shipped Qty < PO Ordered Qty without a signed deviation code.

Authorized Signatory,
Managing Director — ${clientName}`,
      };
    }

    // p5_debtor_notice
    const overdueTotal = liveData.p5Tower.unpaidBillsRupees;
    const billLines = liveData.p5Bills.map(
      (b: any, idx: number) =>
        `${idx + 1}. Invoice ${b.invoiceNo} | Customer: ${b.customerName} | Inv Date: ${b.invoiceDate} | Overdue: +${b.daysOverdue} days past ${liveData.p5Tower.normalCreditDays}d credit | Amount Due: ${formatCurrency(b.amountRupees, 'INR')}`
    ).join('\n');

    return {
      title: 'Overdue Receivable Dispatch-Hold & MSME Payment Demand Notice (P5)',
      recipient: 'To: Accounts Receivable, Sales Dispatch Desk & Overdue Customer Accounts',
      recoveryAmount: formatCurrency(overdueTotal, 'INR'),
      body: `MONDAY MORNING CREDIT CONTROL: DISPATCH-HOLD & OVERDUE COLLECTION DIRECTIVE
Company: ${clientName}
Week Ending: ${liveData.p5Tower.weekEndingDate}
Total Overdue Beyond ${liveData.p5Tower.normalCreditDays}-Day Credit Norm: ${formatCurrency(overdueTotal, 'INR')}

OVERDUE CUSTOMER INVOICES REQUIRING IMMEDIATE CLEARANCE:
${billLines}

MANDATORY MONDAY MORNING ACTION:
1. Dispatch-Hold Rule: Accounts & Security Gate are instructed to place an immediate dispatch hold on any new POs for accounts exceeding ${liveData.p5Tower.normalCreditDays + 15} days overdue until part-payment or UTR confirmation is received.
2. Accounts Receivable must send the individual WhatsApp payment reminders before 11:00 AM today and log promised payment dates for the Friday review.

Authorized Signatory,
Credit Control & MD Office — ${clientName}`,
    };
  }, [activeDoc, liveData, todayStr]);

  const handleCopyDoc = () => {
    navigator.clipboard.writeText(generatedDocument.body);
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 3000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([generatedDocument.body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Execution_Directive_${activeDoc}_${todayStr}.txt`;
    a.click();
  };

  return (
    <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono uppercase font-bold">
            <FileText className="w-3.5 h-3.5" />
            <span>1-Click Live Cash-Recovery Execution Documents (Why Clients Keep Paying You)</span>
          </div>
          <h2 className="text-xl font-black text-white">
            Turn Dashboard Numbers Into Signed Debit Notes, RFQs &amp; Shop-Floor Orders
          </h2>
          <p className="text-xs text-slate-400">
            Dashboards don&apos;t put money in the bank—<strong>execution documents</strong> do. Automatically generates ready-to-sign recovery letters populated with your live <strong>P1–P5</strong> part codes, LR numbers, and rupee variances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleCopyDoc}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer transition"
          >
            {copiedDoc ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedDoc ? 'Copied Directive!' : 'Copy for WhatsApp / Email'}</span>
          </button>
          <button
            onClick={handleDownloadTxt}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download .TXT</span>
          </button>
        </div>
      </div>

      {/* Document Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <button
          onClick={() => setActiveDoc('p3_debit_note')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            activeDoc === 'p3_debit_note'
              ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-cyan-300 font-bold">
            <span>P3 Recovery Doc</span>
            <Scale className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-bold mt-1">Transporter Debit Note</div>
          <div className="text-[11px] font-mono text-emerald-400 mt-1">
            Claim: {formatCurrency(liveData.p3Audit.totals.totalLeak, 'INR')}
          </div>
        </button>

        <button
          onClick={() => setActiveDoc('p1_liquidation_rfq')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            activeDoc === 'p1_liquidation_rfq'
              ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-amber-300 font-bold">
            <span>P1 Recovery Doc</span>
            <Package className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-bold mt-1">Purchase Freeze &amp; Lot RFQ</div>
          <div className="text-[11px] font-mono text-amber-400 mt-1">
            Dead: {formatCurrency(liveData.p1Summary.deadCash, 'INR')}
          </div>
        </button>

        <button
          onClick={() => setActiveDoc('p4_reorder_memo')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            activeDoc === 'p4_reorder_memo'
              ? 'bg-fuchsia-500/20 border-fuchsia-400 text-white shadow-md'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-fuchsia-300 font-bold">
            <span>P4 Recovery Doc</span>
            <ScanBarcode className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-bold mt-1">Bin Shrinkage &amp; PO Indent</div>
          <div className="text-[11px] font-mono text-rose-400 mt-1">
            Short: {formatCurrency(liveData.p4Summary.shelfShortRupees, 'INR')}
          </div>
        </button>

        <button
          onClick={() => setActiveDoc('p2_gate_directive')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            activeDoc === 'p2_gate_directive'
              ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-emerald-300 font-bold">
            <span>P2 Execution Doc</span>
            <Truck className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-bold mt-1">Gate &amp; QC Cutoff SOP</div>
          <div className="text-[11px] font-mono text-emerald-400 mt-1">
            OTIF: {liveData.p2Summary.otifPercent}%
          </div>
        </button>

        <button
          onClick={() => setActiveDoc('p5_debtor_notice')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            activeDoc === 'p5_debtor_notice'
              ? 'bg-rose-500/20 border-rose-400 text-white shadow-md'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-rose-300 font-bold">
            <span>P5 Collection Doc</span>
            <Radio className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-bold mt-1">Debtor Dispatch-Hold</div>
          <div className="text-[11px] font-mono text-rose-400 mt-1">
            Due: {formatCurrency(liveData.p5Tower.unpaidBillsRupees, 'INR')}
          </div>
        </button>
      </div>

      {/* Live Document Preview */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="text-xs font-bold text-white">{generatedDocument.title}</div>
            <div className="text-[11px] text-slate-400 font-mono">{generatedDocument.recipient}</div>
          </div>
          <span className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold">
            Impact: {generatedDocument.recoveryAmount}
          </span>
        </div>

        <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-900/70 p-4 rounded-xl border border-slate-800/90 max-h-80 overflow-y-auto">
          {generatedDocument.body}
        </pre>
      </div>
    </div>
  );
};
