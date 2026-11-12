import React, { useState } from 'react';
import { 
  X, 
  ArrowLeft, 
  AlertTriangle, 
  PackageX, 
  Layers, 
  Clock, 
  Truck, 
  CheckCircle2, 
  IndianRupee, 
  FileSpreadsheet,
  Download,
  Share2,
  Calendar,
  Send,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { 
  MondayTowerData, 
  SKUItem, 
  LateOrder, 
  FreightTrip, 
  UnpaidBill, 
  DeadStockItem,
  Language 
} from '../types';
import { 
  SAMPLE_UNPAID_BILLS
} from '../data/sampleData';
import { formatINR, formatPercent } from '../utils/formatters';

// Live P1–P4 Cross-Engine Data Imports
import { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES as P1_DEFAULT_RULES } from '../../project1/data/initialData';
import { generateOwnerReport, evaluateStockEngine } from '../../project1/utils/calculations';
import { INITIAL_DISPATCHES, INITIAL_RULES as P2_DEFAULT_RULES } from '../../project2/data/initialData';
import { INITIAL_WORKSPACES } from '../../project2/data/factoryWorkspaces';
import { calculateOTIFMetrics, calculateRowStatus } from '../../project2/utils/otifCalculator';
import { INITIAL_TRIPS, DEFAULT_RULES as P3_DEFAULT_RULES } from '../../project3/data/defaultData';
import { calculateAuditMetrics } from '../../project3/utils/auditCalculations';
import { INITIAL_SAMPLE_SKUS as P4_INITIAL_SKUS, DEFAULT_RULES as P4_DEFAULT_RULES } from '../../project4/data/sampleData';
import { computePredictiveShortages } from '../../project4/utils/auditCalculations';

interface ProjectDrillDownModalProps {
  projectId: number | null;
  onClose: () => void;
  towerData: MondayTowerData;
  isDarkMode: boolean;
  language: Language;
  onJumpToEngine?: (engine: 'p1' | 'p2' | 'p3' | 'p4') => void;
}

export const ProjectDrillDownModal: React.FC<ProjectDrillDownModalProps> = ({
  projectId,
  onClose,
  towerData,
  isDarkMode,
  language,
  onJumpToEngine,
}) => {
  if (!projectId) return null;

  const engineMapping: Record<number, { engine: 'p1' | 'p2' | 'p3' | 'p4'; label: string } | undefined> = {
    1: { engine: 'p1', label: 'Open Live P1 (Dead Stock Engine) →' },
    2: { engine: 'p4', label: 'Open Live P4 (Bin & Slotting Audit) →' },
    3: { engine: 'p2', label: 'Open Live P2 (Dispatch OTIF Engine) →' },
    4: { engine: 'p3', label: 'Open Live P3 (Freight Leak Audit) →' },
    5: { engine: 'p2', label: 'Open Live P2 (Dispatch OTIF Engine) →' },
  };
  const targetEngine = engineMapping[projectId];

  // Pull live underlying records from P1, P2, P3, P4 localStorage (or baseline defaults)
  const { p1LiveSummary, liveDeadItems } = (() => {
    try {
      const items = JSON.parse(localStorage.getItem('p1_stock_items') || 'null') || AMBATTUR_FABRICATION_SAMPLE;
      const rules = JSON.parse(localStorage.getItem('p1_stock_rules') || 'null') || P1_DEFAULT_RULES;
      const calculated = evaluateStockEngine(items, rules);
      return {
        p1LiveSummary: generateOwnerReport(items, rules),
        liveDeadItems: calculated.filter(i => i.status === 'Dead'),
      };
    } catch {
      const calculated = evaluateStockEngine(AMBATTUR_FABRICATION_SAMPLE, P1_DEFAULT_RULES);
      return {
        p1LiveSummary: generateOwnerReport(AMBATTUR_FABRICATION_SAMPLE, P1_DEFAULT_RULES),
        liveDeadItems: calculated.filter(i => i.status === 'Dead'),
      };
    }
  })();

  const { p2LiveMetrics, liveLateDispatches } = (() => {
    try {
      let dispatches = INITIAL_DISPATCHES;
      let rules = P2_DEFAULT_RULES;
      const savedWsList = localStorage.getItem('otif_workspaces_v2');
      const savedActiveId = localStorage.getItem('otif_active_workspace_id_v2') || INITIAL_WORKSPACES[0].id;
      if (savedWsList) {
        const parsed = JSON.parse(savedWsList);
        const found = parsed.find((w: any) => w.id === savedActiveId) || parsed[0];
        if (found) {
          dispatches = found.dispatches || INITIAL_DISPATCHES;
          rules = found.rules || P2_DEFAULT_RULES;
        }
      }
      const rows = dispatches.map((d: any) => calculateRowStatus(d, rules));
      return {
        p2LiveMetrics: calculateOTIFMetrics(dispatches, rules),
        liveLateDispatches: rows.filter((r: any) => !r.onTime),
      };
    } catch {
      const rows = INITIAL_DISPATCHES.map(d => calculateRowStatus(d, P2_DEFAULT_RULES));
      return {
        p2LiveMetrics: calculateOTIFMetrics(INITIAL_DISPATCHES, P2_DEFAULT_RULES),
        liveLateDispatches: rows.filter(r => !r.onTime),
      };
    }
  })();

  const p3LiveAudit = (() => {
    try {
      const trips = JSON.parse(localStorage.getItem('freight_audit_trips_v1') || 'null') || INITIAL_TRIPS;
      const rules = JSON.parse(localStorage.getItem('freight_audit_rules_v1') || 'null') || P3_DEFAULT_RULES;
      return calculateAuditMetrics(trips, rules);
    } catch {
      return calculateAuditMetrics(INITIAL_TRIPS, P3_DEFAULT_RULES);
    }
  })();

  const p4LiveShortages = (() => {
    try {
      const items = JSON.parse(localStorage.getItem('binaudit_skus_v1') || 'null') || P4_INITIAL_SKUS;
      const rules = JSON.parse(localStorage.getItem('binaudit_rules_v1') || 'null') || P4_DEFAULT_RULES;
      return computePredictiveShortages(items, rules).filter(
        s => s.severity === 'critical' || s.severity === 'warning'
      );
    } catch {
      return computePredictiveShortages(P4_INITIAL_SKUS, P4_DEFAULT_RULES).filter(
        s => s.severity === 'critical' || s.severity === 'warning'
      );
    }
  })();

  const liveUnpaidBills: UnpaidBill[] = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('p5_unpaid_bills_v1') || 'null');
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch {}
    return SAMPLE_UNPAID_BILLS;
  })();

  const liveUnpaidTotalRupees =
    localStorage.getItem('p5_unpaid_bills_v1')
      ? liveUnpaidBills.reduce((sum, b) => sum + (b.amountRupees || 0), 0)
      : towerData.unpaidBillsRupees;

  const freightPerTrip = towerData.tripsCount > 0 
    ? towerData.freightPaidRupees / towerData.tripsCount 
    : 0;
  
  const otifPercent = towerData.dispatchesCount > 0 
    ? (towerData.otifPassesCount / towerData.dispatchesCount) * 100 
    : 0;

  const projectMeta = [
    {
      id: 1,
      title: 'Dead Cash Inventory (Project 1 — Live Ledger)',
      headline: `₹${p1LiveSummary.deadCash.toLocaleString('en-IN')}`,
      sub: `${liveDeadItems.length} SKUs idle >180 days in Project 1. Live-linked to your P1 Stock Sheet.`,
      icon: PackageX,
      color: 'text-rose-400',
    },
    {
      id: 2,
      title: 'Stockout Risk (Project 4 — Live Bin Velocity)',
      headline: `${p4LiveShortages.length} SKUs`,
      sub: 'Fast-moving A-items with critical/warning days of cover remaining on the shelf in Project 4.',
      icon: Layers,
      color: 'text-amber-400',
    },
    {
      id: 3,
      title: 'Orders Late (Project 2 — Live Gate Clock Fail)',
      headline: `${liveLateDispatches.length} of ${p2LiveMetrics.totalDispatches} Dispatches`,
      sub: 'Loads that missed the promised gate departure time in Project 2.',
      icon: Clock,
      color: 'text-orange-400',
    },
    {
      id: 4,
      title: 'Freight per Trip (Project 3 — Live Lorry Ledger)',
      headline: `₹${Math.round(p3LiveAudit.totals.totalTrips > 0 ? p3LiveAudit.totals.freightPaid / p3LiveAudit.totals.totalTrips : freightPerTrip).toLocaleString('en-IN')}`,
      sub: `Live P3 Freight Paid (${formatINR(p3LiveAudit.totals.freightPaid)}) across ${p3LiveAudit.totals.totalTrips} trips (Leak: ${formatINR(p3LiveAudit.totals.totalLeak)}).`,
      icon: Truck,
      color: 'text-yellow-400',
    },
    {
      id: 5,
      title: 'OTIF (Project 2 — Live Strict Pass/Fail)',
      headline: `${p2LiveMetrics.otifPercent}% (${p2LiveMetrics.passes} / ${p2LiveMetrics.totalDispatches})`,
      sub: 'Passes divided by dispatches in Project 2. Strict rule: late full load and on-time short load both fail.',
      icon: CheckCircle2,
      color: 'text-purple-400',
    },
    {
      id: 6,
      title: 'Unpaid Bills (Tally Outstandings)',
      headline: `₹${liveUnpaidTotalRupees.toLocaleString('en-IN')}`,
      sub: `Customers holding cash older than normal credit (${towerData.normalCreditDays} days). Excludes current week invoices.`,
      icon: IndianRupee,
      color: 'text-red-400',
    },
  ];

  const currentMeta = projectMeta.find(m => m.id === projectId) || projectMeta[0];
  const Icon = currentMeta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
        isDarkMode 
          ? 'bg-neutral-900 border-neutral-800 text-neutral-100' 
          : 'bg-white border-neutral-200 text-neutral-900'
      }`}>
        {/* Modal Top Bar */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-4 ${
          isDarkMode ? 'bg-neutral-950/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-neutral-800 border border-neutral-700 ${currentMeta.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {towerData.clientName}
                </span>
                <span className="text-xs text-neutral-500">
                  Week Ending: {towerData.weekEndingDate}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                {currentMeta.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 transition-colors"
            title="Close drill-down"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Subhead Banner */}
        <div className={`px-5 py-3 border-b text-xs flex flex-wrap items-center justify-between gap-2 ${
          isDarkMode ? 'bg-neutral-950/40 border-neutral-800' : 'bg-neutral-100/50 border-neutral-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-amber-400">
              {currentMeta.headline}
            </span>
            <span className="text-neutral-400 hidden sm:inline">—</span>
            <span className="text-neutral-400">{currentMeta.sub}</span>
          </div>

          <div className="flex items-center gap-2">
            {targetEngine && onJumpToEngine && (
              <button
                onClick={() => {
                  onClose();
                  onJumpToEngine(targetEngine.engine);
                }}
                className="px-3 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 font-bold transition-colors cursor-pointer shadow-sm"
              >
                <ExternalLink className="w-3 h-3" />
                <span>{targetEngine.label}</span>
              </button>
            )}
            <button
              onClick={() => {
                const csvData = `Project Drill-Down Export: ${currentMeta.title}\nClient: ${towerData.clientName}\nWeek: ${towerData.weekEndingDate}\nValue: ${currentMeta.headline}`;
                const blob = new Blob([csvData], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `project-${projectId}-breakdown.csv`;
                a.click();
              }}
              className="px-2.5 py-1 text-xs rounded border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* PROJECT 1: Dead Cash (Live from P1) */}
          {projectId === 1 && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-300' : 'bg-amber-50/50 border-amber-200 text-neutral-800'
              }`}>
                <p className="font-semibold text-amber-400">Project 1 Live Ledger (180+ Days Idle):</p>
                <p>
                  Showing live Dead Stock SKUs directly from <strong>Project 1</strong>. Any edits, liquidations, or imports in P1 immediately update this table.
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-neutral-800">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b font-mono ${isDarkMode ? 'bg-neutral-950 text-neutral-400 border-neutral-800' : 'bg-neutral-100 text-neutral-700 border-neutral-300'}`}>
                    <tr>
                      <th className="py-2.5 px-3">Part Code &amp; Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Idle Days</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Dead Rupees</th>
                      <th className="py-2.5 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono">
                    {liveDeadItems.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-semibold text-neutral-200">{item.itemCode} — {item.itemName}</div>
                          <div className="text-[11px] text-neutral-500 font-mono">Last Moved: {item.lastMovement}</div>
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400">{item.category}</td>
                        <td className="py-2.5 px-3 text-right text-rose-400 font-bold">{item.daysIdle}d</td>
                        <td className="py-2.5 px-3 text-right">{item.qtyOnHand} pcs</td>
                        <td className="py-2.5 px-3 text-right font-bold text-neutral-200">{formatINR(item.closingValue || 0)}</td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-amber-300">
                            {item.action}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t-2 border-neutral-700 bg-neutral-950/50">
                      <td colSpan={4} className="py-3 px-3 text-right font-sans">Total Live P1 Dead Cash:</td>
                      <td className="py-3 px-3 text-right text-rose-400 text-sm">{formatINR(p1LiveSummary.deadCash)}</td>
                      <td className="py-3 px-3 text-[11px] text-neutral-400 font-sans">{liveDeadItems.length} idle SKUs</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PROJECT 2 / 4: Stockout Risk (Live from P4) */}
          {projectId === 2 && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-300' : 'bg-amber-50/50 border-amber-200 text-neutral-800'
              }`}>
                <p className="font-semibold text-amber-400">Stockout Risk (Live from Project 4 Bin Audit):</p>
                <p>
                  Showing live SKUs from <strong>Project 4</strong> with critical or warning days of cover left on the shelf based on actual hand physical count vs. monthly issue velocity.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {p4LiveShortages.map((sku) => (
                  <div 
                    key={sku.code} 
                    className={`p-4 rounded-xl border ${
                      sku.severity === 'critical'
                        ? 'border-red-800/80 bg-red-950/20'
                        : 'border-amber-800/80 bg-amber-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs text-neutral-200">{sku.code}</span>
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        sku.severity === 'critical' 
                          ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {sku.daysRemaining} days cover left
                      </span>
                    </div>

                    <h4 className="font-semibold text-xs text-neutral-100 mb-2">
                      {sku.part}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-neutral-400 mb-3 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
                      <div>Hand Stock: <strong className="text-white">{sku.physicalQty} pcs</strong></div>
                      <div>Burn rate: <strong className="text-white">{(sku.monthlyVelocity / 30).toFixed(1)} pcs/day</strong></div>
                      <div>Monthly Issues: <strong className="text-amber-400">{sku.monthlyVelocity}/mo</strong></div>
                      <div>Reorder Qty: <strong className="text-emerald-400">{sku.recommendedReorderQty} pcs</strong></div>
                    </div>

                    <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                      <span>Severity: <strong className="uppercase">{sku.severity}</strong></span>
                      {onJumpToEngine && (
                        <button 
                          onClick={() => {
                            onClose();
                            onJumpToEngine('p4');
                          }}
                          className="text-amber-400 hover:text-amber-300 font-semibold underline text-xs cursor-pointer"
                        >
                          Open in P4 ➔
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROJECT 3: Orders Late (Live from P2) */}
          {projectId === 3 && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-300' : 'bg-orange-50/50 border-orange-200 text-neutral-800'
              }`}>
                <p className="font-semibold text-orange-400">Orders Late (Live from Project 2 Dispatch Register):</p>
                <p>
                  Showing all <strong>{liveLateDispatches.length} late dispatches</strong> out of {p2LiveMetrics.totalDispatches} total loads in Project 2.
                </p>
              </div>

              <div className="space-y-2.5">
                {liveLateDispatches.map((ord: any) => (
                  <div 
                    key={ord.id}
                    className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/60 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">{ord.po}</span>
                        <span className="text-neutral-400">·</span>
                        <span className="font-medium text-neutral-200">{ord.customer}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        Part: {ord.part} ({ord.shippedQty}/{ord.orderedQty} pcs) · Vehicle: {ord.vehicle}
                      </div>
                      <div className="text-rose-400 text-[11px]">
                        <strong>Delay Reason:</strong> {ord.delayReason || 'Unassigned'}
                      </div>
                    </div>

                    <div className="text-right font-mono text-[11px] shrink-0">
                      <div className="text-neutral-400">Promised: {ord.promisedDate.replace('T', ' ')}</div>
                      <div className="text-neutral-400">Actual Out: {ord.actualOut ? ord.actualOut.replace('T', ' ') : 'Pending'}</div>
                      <div className="text-rose-400 font-bold">Late by: +{ord.lateHours} hrs</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROJECT 4: Freight per Trip (Live from P3) */}
          {projectId === 4 && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-300' : 'bg-yellow-50/50 border-yellow-200 text-neutral-800'
              }`}>
                <p className="font-semibold text-yellow-400">Freight per Trip (Live from Project 3 Lorry Audit):</p>
                <p>
                  Showing all <strong>{p3LiveAudit.totals.totalTrips} verified lorry bills</strong> from Project 3. Total Freight Paid: {formatINR(p3LiveAudit.totals.freightPaid)} (Total Rate + Detention Leak: {formatINR(p3LiveAudit.totals.totalLeak)}).
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-neutral-800">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b font-mono ${isDarkMode ? 'bg-neutral-950 text-neutral-400 border-neutral-800' : 'bg-neutral-100 text-neutral-700 border-neutral-300'}`}>
                    <tr>
                      <th className="py-2.5 px-3">Date &amp; ID</th>
                      <th className="py-2.5 px-3">Lane Corridor</th>
                      <th className="py-2.5 px-3">Transporter</th>
                      <th className="py-2.5 px-3 text-right">Tonnes</th>
                      <th className="py-2.5 px-3 text-right">Total Leak</th>
                      <th className="py-2.5 px-3 text-right">Lorry Bill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono">
                    {p3LiveAudit.calculatedTrips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-2 px-3">
                          <div className="font-bold text-neutral-200">{trip.id}</div>
                          <div className="text-[10px] text-neutral-500">{trip.date}</div>
                        </td>
                        <td className="py-2 px-3 text-neutral-300 font-sans">{trip.lane}</td>
                        <td className="py-2 px-3 text-neutral-400 font-sans">
                          {trip.transporter} <span className="text-neutral-500">({trip.waitHours}h wait)</span>
                        </td>
                        <td className="py-2 px-3 text-right text-neutral-300">{trip.tonnes.toFixed(2)} T</td>
                        <td className="py-2 px-3 text-right text-rose-400">{formatINR(trip.totalLeak)}</td>
                        <td className="py-2 px-3 text-right font-bold text-amber-400">{formatINR(trip.bill)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t-2 border-neutral-700 bg-neutral-950/50">
                      <td colSpan={3} className="py-3 px-3 text-right font-sans">{p3LiveAudit.totals.totalTrips} Trips Total ({formatINR(p3LiveAudit.totals.freightPaid)}):</td>
                      <td colSpan={2} className="py-3 px-3 text-right font-sans">Avg Cost per Trip:</td>
                      <td className="py-3 px-3 text-right text-amber-400 text-sm">
                        {formatINR(Math.round(p3LiveAudit.totals.totalTrips > 0 ? p3LiveAudit.totals.freightPaid / p3LiveAudit.totals.totalTrips : 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PROJECT 5: OTIF (Live from P2) */}
          {projectId === 5 && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-300' : 'bg-purple-50/50 border-purple-200 text-neutral-800'
              }`}>
                <p className="font-semibold text-purple-400">Strict OTIF (Live from Project 2):</p>
                <p>
                  Live OTIF is <strong>{p2LiveMetrics.otifPercent}%</strong> ({p2LiveMetrics.passes} passes out of {p2LiveMetrics.totalDispatches} dispatches). 
                  A late full load and an on-time short load both fail.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-4 rounded-xl border border-emerald-800/60 bg-emerald-950/20">
                  <div className="text-2xl font-bold font-mono text-emerald-400">{p2LiveMetrics.passes} Passes</div>
                  <div className="text-xs text-neutral-400 mt-1">On-Time &amp; In-Full ({p2LiveMetrics.otifPercent}%)</div>
                </div>
                <div className="p-4 rounded-xl border border-orange-800/60 bg-orange-950/20">
                  <div className="text-2xl font-bold font-mono text-orange-400">
                    {p2LiveMetrics.failsLateOnly + p2LiveMetrics.failsLateAndShort} Time Fails
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">Left past promised clock</div>
                </div>
                <div className="p-4 rounded-xl border border-rose-800/60 bg-rose-950/20">
                  <div className="text-2xl font-bold font-mono text-rose-400">
                    {p2LiveMetrics.failsShortOnly + p2LiveMetrics.failsLateAndShort} Quantity Fails
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">Short shipped vs PO qty</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 text-xs space-y-2">
                <h4 className="font-semibold text-neutral-200">Live Failure Breakdown by Root Cause (Project 2):</h4>
                <ul className="list-disc list-inside space-y-1 text-neutral-400 font-mono">
                  {p2LiveMetrics.reasonStats.filter(r => r.count > 0).map(r => (
                    <li key={r.reason}>
                      <strong className="text-neutral-200">{r.reason}</strong>: {r.count} failed loads ({r.percentageOfFails}% of failures)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* PROJECT 6: Unpaid Bills */}
          {projectId === 6 && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-300' : 'bg-red-50/50 border-red-200 text-neutral-800'
              }`}>
                <p className="font-semibold text-red-400">Unpaid Bills (Tally Outstandings):</p>
                <p>
                  Customers who have the goods and have not paid. Cash blocked outside the factory. 
                  Only bills older than his normal credit days ({towerData.normalCreditDays} days). 
                  Do not include this week's invoices. If his credit is 30 days, a bill from last Thursday is not in this number. 
                  This one comes from Tally outstandings, not from Projects 1 to 4.
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-neutral-800">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b font-mono ${isDarkMode ? 'bg-neutral-950 text-neutral-400 border-neutral-800' : 'bg-neutral-100 text-neutral-700 border-neutral-300'}`}>
                    <tr>
                      <th className="py-2.5 px-3">Invoice & Customer</th>
                      <th className="py-2.5 px-3">Invoice Date</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-right">Days Overdue</th>
                      <th className="py-2.5 px-3 text-right">Blocked Cash</th>
                      <th className="py-2.5 px-3">Collection Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono">
                    {liveUnpaidBills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-bold text-neutral-200">{bill.customerName}</div>
                          <div className="text-[11px] text-neutral-500 font-mono">{bill.invoiceNo} · {bill.tallyLedger}</div>
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400">{bill.invoiceDate}</td>
                        <td className="py-2.5 px-3 text-neutral-400">{bill.dueDate}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-400">+{bill.daysOverdue}d</td>
                        <td className="py-2.5 px-3 text-right font-bold text-white">{formatINR(bill.amountRupees)}</td>
                        <td className="py-2.5 px-3 font-sans">
                          <button
                            onClick={() => {
                              const msg = encodeURIComponent(
                                `Dear ${bill.customerName}, gentle reminder regarding Invoice ${bill.invoiceNo} for ${formatINR(bill.amountRupees)} (overdue by ${bill.daysOverdue} days past normal credit). Kindly share UTR / NEFT confirmation today.`
                              );
                              window.open(`https://wa.me/?text=${msg}`, '_blank');
                            }}
                            className="px-2 py-1 text-[11px] font-medium rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>WhatsApp Remind</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t-2 border-neutral-700 bg-neutral-950/50">
                      <td colSpan={4} className="py-3 px-3 text-right font-sans">Total Overdue ({`>${towerData.normalCreditDays}d`}):</td>
                      <td className="py-3 px-3 text-right text-rose-400 text-sm font-mono">{formatINR(liveUnpaidTotalRupees)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 text-xs ${
          isDarkMode ? 'bg-neutral-950/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <div className="text-neutral-500 flex items-center gap-2">
            <span>Client: {towerData.clientName}</span>
            <span>·</span>
            <span>Week ending {towerData.weekEndingDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
