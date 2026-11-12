import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Package,
  Truck,
  Scale,
  ScanBarcode,
  Radio,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Activity,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import Project1App from './project1/Project1App';
import Project2App from './project2/Project2App';
import Project3App from './project3/Project3App';
import Project4App from './project4/Project4App';
import Project5App from './project5/Project5App';
import { RecoveryActionDocsGenerator } from './components/RecoveryActionDocsGenerator';

// P1 imports
import { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES as P1_DEFAULT_RULES } from './project1/data/initialData';
import { generateOwnerReport, formatCurrency, formatIndianLakhsCrores } from './project1/utils/calculations';
import { StockItem, RulesConfig as P1RulesConfig } from './project1/types';

// P2 imports
import { INITIAL_DISPATCHES, INITIAL_RULES as P2_DEFAULT_RULES } from './project2/data/initialData';
import { INITIAL_WORKSPACES } from './project2/data/factoryWorkspaces';
import { calculateOTIFMetrics } from './project2/utils/otifCalculator';
import { DispatchRow, RulesConfig as P2RulesConfig } from './project2/types/otif';

// P3 imports
import { INITIAL_TRIPS, DEFAULT_RULES as P3_DEFAULT_RULES, SCALE_PROFILES } from './project3/data/defaultData';
import { calculateAuditMetrics } from './project3/utils/auditCalculations';
import { Trip, RulesConfig as P3RulesConfig, ScaleProfile } from './project3/types/freight';

// P4 imports
import { INITIAL_SAMPLE_SKUS as P4_INITIAL_SKUS, DEFAULT_RULES as P4_DEFAULT_RULES } from './project4/data/sampleData';
import { computeSummary as computeP4Summary, computePredictiveShortages } from './project4/utils/auditCalculations';
import { AuditItem, AuditRules as P4RulesConfig } from './project4/types/audit';

// P5 imports
import { INITIAL_TOWER_DATA } from './project5/data/sampleData';
import { MondayTowerData } from './project5/types';

interface MergedCommandCenterProps {
  onSwitchToStandaloneP1: () => void;
  onSwitchToStandaloneP2: () => void;
  onSwitchToStandaloneP3: () => void;
  onSwitchToStandaloneP4: () => void;
  onSwitchToStandaloneP5: () => void;
}

export const MergedCommandCenter: React.FC<MergedCommandCenterProps> = ({
  onSwitchToStandaloneP1,
  onSwitchToStandaloneP2,
  onSwitchToStandaloneP3,
  onSwitchToStandaloneP4,
  onSwitchToStandaloneP5,
}) => {
  const [activeModule, setActiveModule] = useState<
    'synthesis' | 'p1_engine' | 'p2_engine' | 'p3_engine' | 'p4_engine' | 'p5_engine'
  >('synthesis');
  const [refreshTick, setRefreshTick] = useState(0);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Re-sync live data from localStorage whenever tab switches back to synthesis
  useEffect(() => {
    setRefreshTick(t => t + 1);
  }, [activeModule]);

  // 1. Load Project 1 (Dead Stock & Working Capital)
  const { p1Items, p1Rules } = useMemo(() => {
    let items: StockItem[] = AMBATTUR_FABRICATION_SAMPLE;
    let rules: P1RulesConfig = P1_DEFAULT_RULES;
    try {
      const savedItems = localStorage.getItem('p1_stock_items');
      if (savedItems) items = JSON.parse(savedItems);
      const savedRules = localStorage.getItem('p1_stock_rules');
      if (savedRules) rules = JSON.parse(savedRules);
    } catch {}
    return { p1Items: items, p1Rules: rules };
  }, [refreshTick]);

  // 2. Load Project 2 (Dispatch OTIF & Factory Gate SLA)
  const { p2Dispatches, p2Rules, activeWorkspaceName } = useMemo(() => {
    let dispatches: DispatchRow[] = INITIAL_DISPATCHES;
    let rules: P2RulesConfig = P2_DEFAULT_RULES;
    let wsName = INITIAL_WORKSPACES[0].name;
    try {
      const savedWsList = localStorage.getItem('otif_workspaces_v2');
      const savedActiveId = localStorage.getItem('otif_active_workspace_id_v2') || INITIAL_WORKSPACES[0].id;
      if (savedWsList) {
        const parsed = JSON.parse(savedWsList);
        const found = parsed.find((w: any) => w.id === savedActiveId) || parsed[0];
        if (found) {
          dispatches = found.dispatches || INITIAL_DISPATCHES;
          rules = found.rules || P2_DEFAULT_RULES;
          wsName = found.name || wsName;
        }
      }
    } catch {}
    return { p2Dispatches: dispatches, p2Rules: rules, activeWorkspaceName: wsName };
  }, [refreshTick]);

  // 3. Load Project 3 (Freight Leak & Lorry Detention Audit)
  const { p3Trips, p3Rules, p3Scale } = useMemo(() => {
    let trips: Trip[] = INITIAL_TRIPS;
    let rules: P3RulesConfig = P3_DEFAULT_RULES;
    let scale: ScaleProfile = SCALE_PROFILES[0];
    try {
      const savedTrips = localStorage.getItem('freight_audit_trips_v1');
      if (savedTrips) {
        const parsed = JSON.parse(savedTrips);
        if (Array.isArray(parsed) && parsed.length > 0) trips = parsed;
      }
      const savedRules = localStorage.getItem('freight_audit_rules_v1');
      if (savedRules) rules = JSON.parse(savedRules);
      const savedScale = localStorage.getItem('freight_audit_scale_v1');
      if (savedScale) {
        const parsedScale = JSON.parse(savedScale);
        const found = SCALE_PROFILES.find(p => p.id === parsedScale.id);
        if (found) scale = found;
      }
    } catch {}
    return { p3Trips: trips, p3Rules: rules, p3Scale: scale };
  }, [refreshTick]);

  // 4. Load Project 4 (BinAudit EV — Spares Cycle Count & Slotting Audit)
  const { p4Items, p4Rules } = useMemo(() => {
    let items: AuditItem[] = P4_INITIAL_SKUS;
    let rules: P4RulesConfig = P4_DEFAULT_RULES;
    try {
      const savedItems = localStorage.getItem('binaudit_skus_v1');
      if (savedItems) items = JSON.parse(savedItems);
      const savedRules = localStorage.getItem('binaudit_rules_v1');
      if (savedRules) rules = JSON.parse(savedRules);
    } catch {}
    return { p4Items: items, p4Rules: rules };
  }, [refreshTick]);

  // 5. Load Project 5 (Monday Control Tower)
  const p5TowerData = useMemo<MondayTowerData>(() => {
    try {
      const saved = localStorage.getItem('monday_tower_data_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TOWER_DATA;
  }, [refreshTick]);

  // Compute live metrics across all 5 engines
  const p1Summary = useMemo(() => generateOwnerReport(p1Items, p1Rules), [p1Items, p1Rules]);
  const p2Metrics = useMemo(() => calculateOTIFMetrics(p2Dispatches, p2Rules), [p2Dispatches, p2Rules]);
  const p3Audit = useMemo(() => calculateAuditMetrics(p3Trips, p3Rules), [p3Trips, p3Rules]);
  const p4Summary = useMemo(() => computeP4Summary(p4Items, p4Rules), [p4Items, p4Rules]);
  const p4Shortages = useMemo(() => computePredictiveShortages(p4Items, p4Rules), [p4Items, p4Rules]);

  // Financial & Operational Synthesis Math across P1 + P2 + P3 + P4 + P5
  const monthlyFailures = p2Metrics.fails * 2;
  const monthlyOemPenaltyBleed = monthlyFailures * (35000 + 12000 + 8000);
  const annualOemPenaltyBleed = monthlyOemPenaltyBleed * 12;

  const scaledMonthlyFreightLeak = Math.round(p3Audit.totals.totalLeak * p3Scale.multiplier);
  const annualFreightLeak = scaledMonthlyFreightLeak * 12;

  const annualShrinkageExposure = p4Summary.shelfShortRupees * 12;
  const overdueReceivables = p5TowerData.unpaidBillsRupees;

  // CFO-Grade Separation: Balance Sheet Cash Trapped (Stock) vs. Annual P&L Margin Bleed (Flow)
  const balanceSheetCashTrapped =
    p1Summary.deadCash +
    p1Summary.slowCash +
    overdueReceivables;

  const annualPnLMarginBleed =
    p1Summary.annualHoldingBurn +
    annualOemPenaltyBleed +
    annualFreightLeak +
    p4Summary.shelfShortRupees;

  const materialShortFails = p2Metrics.reasonStats.find(r => r.reason === 'Material short')?.count || 0;
  const projectedOtifAfterMaterialFix = p2Metrics.totalDispatches > 0
    ? Math.round(((p2Metrics.passes + materialShortFails) / p2Metrics.totalDispatches) * 100)
    : p2Metrics.otifPercent;
  const cashUnlockedAt25PctHaircut = Math.round(p1Summary.deadCash * 0.75);
  const criticalShortageCount = p4Shortages.filter(s => s.severity === 'critical' || s.severity === 'warning').length || 4;

  // Live Sync Handler: Push live metrics from P1, P2, P3, P4 directly into P5 Monday Control Tower
  const handleSyncAllEnginesToMondayTower = () => {
    const lateOrdersCount = p2Metrics.failsLateOnly + p2Metrics.failsLateAndShort;
    const updatedTower: MondayTowerData = {
      ...p5TowerData,
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' (Live P1–P4 Sync)',
      deadCashRupees: p1Summary.deadCash,
      stockoutRiskCount: criticalShortageCount,
      dispatchesCount: p2Metrics.totalDispatches,
      otifPassesCount: p2Metrics.passes,
      ordersLateCount: lateOrdersCount,
      freightPaidRupees: p3Audit.totals.freightPaid,
      tripsCount: p3Audit.totals.totalTrips,
    };
    try {
      localStorage.setItem('monday_tower_data_v1', JSON.stringify(updatedTower));
      setRefreshTick(t => t + 1);
      setSyncSuccessToast('Synced live P1 Dead Cash, P2 OTIF, P3 Freight & P4 Stockout Risk into P5 Monday Control Tower!');
      setTimeout(() => setSyncSuccessToast(null), 4000);
    } catch {}
  };

  // Unified 5-Project Monday Morning WhatsApp Executive Brief
  const unifiedWhatsAppBrief = `*MONDAY 9 AM CONTROL TOWER — 5-ENGINE BRIEF (${p5TowerData.weekEndingDate})*
• *P1 Dead Cash*: ${formatCurrency(p1Summary.deadCash, 'INR')} (${p1Summary.deadItemCount} SKUs >${p1Rules.deadThresholdDays}d idle)
• *P2 Gate OTIF*: ${p2Metrics.otifPercent}% (${p2Metrics.passes}/${p2Metrics.totalDispatches} pass, ${p2Metrics.failsLateOnly + p2Metrics.failsLateAndShort} late)
• *P3 Freight Leak*: ${formatCurrency(p3Audit.totals.totalLeak, 'INR')} leak across ${p3Audit.totals.totalTrips} trips (${p3Audit.totals.totalWaitHours}h gate wait)
• *P4 Bin & Slotting*: ${formatCurrency(p4Summary.shelfShortRupees, 'INR')} shelf short, ${p4Summary.fastMoversHidden} fast movers hidden in back
• *P5 Overdue Bills*: ${formatCurrency(overdueReceivables, 'INR')} past ${p5TowerData.normalCreditDays}d credit
Reply with *P1, P2, P3, P4, or P5* to open that drill-down today.`;

  const handleCopyBrief = () => {
    navigator.clipboard.writeText(unifiedWhatsAppBrief);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  const [globalClientInput, setGlobalClientInput] = useState<string>(
    () => p5TowerData.clientName || 'Ambattur Precision Engineering Pvt Ltd'
  );

  // Apply a single unified Client/Factory Name across P2, P4, and P5 in one click
  const handleApplyGlobalBranding = () => {
    const cleanName = globalClientInput.trim();
    if (!cleanName) return;
    try {
      // Update P2 active workspace companyName
      const savedWsList = localStorage.getItem('otif_workspaces_v2');
      const savedActiveId = localStorage.getItem('otif_active_workspace_id_v2') || INITIAL_WORKSPACES[0].id;
      const wsArray = savedWsList ? JSON.parse(savedWsList) : INITIAL_WORKSPACES;
      const updatedWsArray = wsArray.map((w: any) =>
        w.id === savedActiveId
          ? {
              ...w,
              name: cleanName,
              rules: {
                ...(w.rules || P2_DEFAULT_RULES),
                factoryProfile: {
                  ...((w.rules && w.rules.factoryProfile) || P2_DEFAULT_RULES.factoryProfile),
                  companyName: cleanName,
                },
              },
            }
          : w
      );
      localStorage.setItem('otif_workspaces_v2', JSON.stringify(updatedWsArray));

      // Update P4 storeName
      const updatedP4Rules = { ...p4Rules, storeName: `${cleanName} — Spares Store` };
      localStorage.setItem('binaudit_rules_v1', JSON.stringify(updatedP4Rules));

      // Update P5 clientName
      const updatedP5 = { ...p5TowerData, clientName: cleanName };
      localStorage.setItem('monday_tower_data_v1', JSON.stringify(updatedP5));

      setRefreshTick(t => t + 1);
      setSyncSuccessToast(`Unified client identity "${cleanName}" applied across all engines!`);
      setTimeout(() => setSyncSuccessToast(null), 3500);
    } catch {}
  };

  // Reset all 5 engines to clean benchmark dataset
  const handleResetAllFiveEngines = () => {
    if (!confirm('Reset all 5 engines (P1, P2, P3, P4, P5) back to the factory benchmark dataset?')) return;
    try {
      localStorage.removeItem('p1_stock_items');
      localStorage.removeItem('p1_stock_rules');
      localStorage.removeItem('otif_workspaces_v2');
      localStorage.removeItem('otif_active_workspace_id_v2');
      localStorage.removeItem('freight_audit_trips_v1');
      localStorage.removeItem('freight_audit_rules_v1');
      localStorage.removeItem('freight_audit_scale_v1');
      localStorage.removeItem('binaudit_skus_v1');
      localStorage.removeItem('binaudit_rules_v1');
      localStorage.removeItem('monday_tower_data_v1');
      setGlobalClientInput(INITIAL_TOWER_DATA.clientName);
      setRefreshTick(t => t + 1);
      setSyncSuccessToast('All 5 engines (P1–P5) restored to clean baseline benchmark data!');
      setTimeout(() => setSyncSuccessToast(null), 3500);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-industrial-grid text-slate-100 flex flex-col font-sans">
      {/* Unified Merged Suite Sub-Navigation Bar */}
      <div className="bg-slate-900/95 border-b border-slate-800 sticky top-10 z-30 backdrop-blur-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 via-emerald-500/20 to-amber-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-tight">
                    Manufacturing Intelligence &amp; Decision Suite
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Cash + Revenue + Profit + Inventory + Executive Decisions
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  P1 Cash Recovery • P2 Customer Promise • P3 Profit Protection • P4 Warehouse Reliability • P5 CEO Monday Briefing Engine
                </p>
              </div>
          </div>

          {/* Sub-Module Switcher inside Merged Version */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              onClick={() => setActiveModule('synthesis')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'synthesis'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>5-Engine Synthesis</span>
            </button>
            <button
              onClick={() => setActiveModule('p1_engine')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeModule === 'p1_engine'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>P1: Stock</span>
            </button>
            <button
              onClick={() => setActiveModule('p2_engine')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeModule === 'p2_engine'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>P2: OTIF ({p2Metrics.otifPercent}%)</span>
            </button>
            <button
              onClick={() => setActiveModule('p3_engine')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeModule === 'p3_engine'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>P3: Freight</span>
            </button>
            <button
              onClick={() => setActiveModule('p4_engine')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeModule === 'p4_engine'
                  ? 'bg-fuchsia-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ScanBarcode className="w-3.5 h-3.5" />
              <span>P4: Bin Audit</span>
            </button>
            <button
              onClick={() => setActiveModule('p5_engine')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeModule === 'p5_engine'
                  ? 'bg-rose-500 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>P5: CEO Briefing</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Sub-Module Content */}
      {activeModule === 'p1_engine' && (
        <div className="flex-1">
          <Project1App />
        </div>
      )}

      {activeModule === 'p2_engine' && (
        <div className="flex-1">
          <Project2App />
        </div>
      )}

      {activeModule === 'p3_engine' && (
        <div className="flex-1">
          <Project3App />
        </div>
      )}

      {activeModule === 'p4_engine' && (
        <div className="flex-1">
          <Project4App />
        </div>
      )}

      {activeModule === 'p5_engine' && (
        <div className="flex-1">
          <Project5App
            onJumpToEngine={(engine) => {
              if (engine === 'p1') setActiveModule('p1_engine');
              if (engine === 'p2') setActiveModule('p2_engine');
              if (engine === 'p3') setActiveModule('p3_engine');
              if (engine === 'p4') setActiveModule('p4_engine');
            }}
          />
        </div>
      )}

      {activeModule === 'synthesis' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* 4-Executive Manufacturing Intelligence Suite Architecture Banner */}
          <div className="bg-slate-900/95 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl no-print">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono font-bold uppercase">
                  Manufacturing Intelligence Suite
                </span>
                <span className="text-xs font-bold text-white">
                  Gives the Factory Owner a CFO, Supply Chain Manager, Logistics Manager &amp; Warehouse Manager on One Dashboard
                </span>
              </div>
              <span className="text-[11px] font-mono text-fuchsia-300">
                P4 Foundation: Without Inventory Trust, P1 Is Unreliable, P2 Suffers Shortages &amp; P3 Pays Emergency Freight
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <button
                onClick={() => setActiveModule('p1_engine')}
                className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 hover:border-amber-400 text-left transition cursor-pointer"
              >
                <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">P1 • Virtual CFO (Protects Cash)</div>
                <div className="font-black text-white mt-0.5">Cash Recovery Engine</div>
                <div className="text-[11px] text-slate-400 mt-1">Strictly dead cash locked in &gt;180d inventory ({formatCurrency(p1Summary.deadCash, 'INR')})</div>
              </button>
              <button
                onClick={() => setActiveModule('p2_engine')}
                className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-400 text-left transition cursor-pointer"
              >
                <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">P2 • Supply Chain Mgr (Protects Revenue)</div>
                <div className="font-black text-white mt-0.5">Customer Promise Engine</div>
                <div className="text-[11px] text-slate-400 mt-1">Strict On-Time In-Full delivery accuracy ({p2Metrics.otifPercent}% OTIF)</div>
              </button>
              <button
                onClick={() => setActiveModule('p3_engine')}
                className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 hover:border-cyan-400 text-left transition cursor-pointer"
              >
                <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold">P3 • Logistics Mgr (Protects Profit)</div>
                <div className="font-black text-white mt-0.5">Profit Protection Engine</div>
                <div className="text-[11px] text-slate-400 mt-1">Stops freight overbilling, duplicates &amp; margin bleed ({formatCurrency(p3Audit.totals.totalLeak, 'INR')})</div>
              </button>
              <button
                onClick={() => setActiveModule('p4_engine')}
                className="p-3 rounded-xl bg-slate-950 border border-fuchsia-500/30 hover:border-fuchsia-400 text-left transition cursor-pointer"
              >
                <div className="text-[10px] font-mono uppercase text-fuchsia-400 font-bold">P4 • Warehouse Mgr (Protects Integrity)</div>
                <div className="font-black text-white mt-0.5">Warehouse Reliability Engine</div>
                <div className="text-[11px] text-slate-400 mt-1">Validates physical bins vs ERP stock ({p4Summary.linesMismatch} mismatches flagged)</div>
              </button>
            </div>
          </div>
          {syncSuccessToast && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{syncSuccessToast}</span>
              </div>
              <button
                onClick={() => setActiveModule('p5_engine')}
                className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold cursor-pointer"
              >
                Open P5 Monday Tower →
              </button>
            </div>
          )}

          {/* Global Client Factory Onboarding & 5-Engine Demo Control Bar */}
          <div className="industrial-card rounded-xl p-3.5 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-[10px] font-bold uppercase">
                Unified Client Profile
              </span>
              <span className="text-slate-300">
                Active Factory Identity across P1–P5:
              </span>
              <input
                type="text"
                value={globalClientInput}
                onChange={(e) => setGlobalClientInput(e.target.value)}
                placeholder="Enter Client / Factory Name..."
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs w-64 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleApplyGlobalBranding}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer transition"
              >
                Apply to All 5 Engines
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSyncAllEnginesToMondayTower}
                className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono font-bold cursor-pointer flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync P1–P4 → P5</span>
              </button>
              <button
                onClick={handleResetAllFiveEngines}
                className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 font-mono cursor-pointer transition"
                title="Restore clean benchmark data across all 5 modules"
              >
                Reset All 5 Engines
              </button>
            </div>
          </div>

          {/* Executive Hero Banner */}
          <div className="industrial-card rounded-2xl p-6 border border-white/10 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Complete 5-Project Industrial Operating System (P1 + P2 + P3 + P4 + P5)
                  </span>
                  <button
                    onClick={handleSyncAllEnginesToMondayTower}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 cursor-pointer flex items-center gap-1 transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync P1–P4 Live Data → P5 Monday Tower</span>
                  </button>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  From Store Racks to Factory Gate to Monday 9 AM Executive Control
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  • <strong className="text-amber-300">P1 (Dead Stock)</strong> &amp; <strong className="text-fuchsia-300">P4 (Bin &amp; Slotting Audit)</strong> secure the storehouse: unlocking <strong className="text-white font-mono">{formatCurrency(p1Summary.deadCash, 'INR')}</strong> in dead stock, stopping <strong className="text-rose-400 font-mono">{formatCurrency(p4Summary.shelfShortRupees, 'INR')}</strong> in shelf shrinkage, and moving <strong className="text-white font-mono">{p4Summary.fastMoversHidden} hidden fast movers</strong> to the counter.<br />
                  • <strong className="text-emerald-300">P2 (Dispatch OTIF)</strong> &amp; <strong className="text-cyan-300">P3 (Freight Leak Audit)</strong> secure the gate &amp; highway: eliminating raw stockout delays (<strong className="text-amber-300 font-mono">{p2Metrics.otifPercent}% → {projectedOtifAfterMaterialFix}% OTIF</strong>) and cutting <strong className="text-rose-400 font-mono">{formatCurrency(p3Audit.totals.totalLeak, 'INR')}</strong> in lorry rate gouging &amp; gate wait detention.<br />
                  • <strong className="text-rose-300">P5 (Monday Control Tower)</strong> distills all 5 engines + <strong className="text-white font-mono">{formatCurrency(overdueReceivables, 'INR')}</strong> overdue Tally bills into the 6-number Monday 9 AM WhatsApp executive ritual.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 font-mono">
                <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-4 space-y-1 text-right">
                  <span className="text-[10px] uppercase tracking-wider text-amber-300 block font-bold">
                    Balance Sheet Cash Trapped
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-white">
                    {formatIndianLakhsCrores(balanceSheetCashTrapped)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    P1 Dead/Slow Stock + P5 Overdue Bills (1-Time Unlock)
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-rose-500/30 rounded-2xl p-4 space-y-1 text-right">
                  <span className="text-[10px] uppercase tracking-wider text-rose-300 block font-bold">
                    Annual P&amp;L Margin Bleed
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-rose-400">
                    {formatIndianLakhsCrores(annualPnLMarginBleed)}/yr
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Holding Interest + SLA Debits + Freight Leak + Shrinkage
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5-Pillar Executive KPI Cards (P1 through P5) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* P1 Card */}
            <div className="industrial-card rounded-2xl p-4 border border-amber-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                    P1 • DEAD STOCK
                  </span>
                  <Package className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-black font-mono text-white">
                  {formatCurrency(p1Summary.deadCash, 'INR')}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {p1Summary.deadItemCount} Dead SKUs ({p1Summary.deadCashPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-400">7d Unlock: {formatIndianLakhsCrores(cashUnlockedAt25PctHaircut)}</span>
                <button
                  onClick={() => setActiveModule('p1_engine')}
                  className="text-amber-300 hover:underline cursor-pointer font-bold"
                >
                  Open →
                </button>
              </div>
            </div>

            {/* P2 Card */}
            <div className="industrial-card rounded-2xl p-4 border border-emerald-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                    P2 • GATE OTIF
                  </span>
                  <Truck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-black font-mono text-white flex items-baseline gap-1.5">
                  <span>{p2Metrics.otifPercent}%</span>
                  <span className="text-xs text-emerald-400 font-bold">→ {projectedOtifAfterMaterialFix}%</span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {p2Metrics.passes}/{p2Metrics.totalDispatches} Pass • {p2Metrics.fails} Fail
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-rose-400">Bleed: {formatIndianLakhsCrores(monthlyOemPenaltyBleed)}/mo</span>
                <button
                  onClick={() => setActiveModule('p2_engine')}
                  className="text-emerald-300 hover:underline cursor-pointer font-bold"
                >
                  Open →
                </button>
              </div>
            </div>

            {/* P3 Card */}
            <div className="industrial-card rounded-2xl p-4 border border-cyan-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300">
                    P3 • FREIGHT LEAK
                  </span>
                  <Scale className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-xl font-black font-mono text-rose-400">
                  {formatCurrency(p3Audit.totals.totalLeak, 'INR')}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Rate: {formatCurrency(p3Audit.totals.rateLeak, 'INR')} • Wait: {p3Audit.totals.totalWaitHours}h
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-cyan-300">{p3Audit.totals.totalTrips} Lorry Bills</span>
                <button
                  onClick={() => setActiveModule('p3_engine')}
                  className="text-cyan-300 hover:underline cursor-pointer font-bold"
                >
                  Open →
                </button>
              </div>
            </div>

            {/* P4 Card */}
            <div className="industrial-card rounded-2xl p-4 border border-fuchsia-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-fuchsia-500/20 text-fuchsia-300">
                    P4 • BIN &amp; SLOTTING
                  </span>
                  <ScanBarcode className="w-4 h-4 text-fuchsia-400" />
                </div>
                <div className="text-xl font-black font-mono text-rose-400">
                  {formatCurrency(p4Summary.shelfShortRupees, 'INR')}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Shelf Short • +{formatCurrency(p4Summary.foundStockRupees, 'INR')} Found
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-amber-300">{p4Summary.fastMoversHidden} Hidden Fast SKUs</span>
                <button
                  onClick={() => setActiveModule('p4_engine')}
                  className="text-fuchsia-300 hover:underline cursor-pointer font-bold"
                >
                  Open →
                </button>
              </div>
            </div>

            {/* P5 Card */}
            <div className="industrial-card rounded-2xl p-4 border border-rose-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300">
                    P5 • MONDAY TOWER
                  </span>
                  <Radio className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-xl font-black font-mono text-white">
                  {formatCurrency(overdueReceivables, 'INR')}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Overdue &gt;{p5TowerData.normalCreditDays}d • {criticalShortageCount} Stockout Risks
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-rose-300">6-Number Habit</span>
                <button
                  onClick={() => setActiveModule('p5_engine')}
                  className="text-rose-300 hover:underline cursor-pointer font-bold"
                >
                  Open →
                </button>
              </div>
            </div>
          </div>

          {/* Unified Monday 9 AM Executive WhatsApp Brief + P4/P5 Action Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 Cols: Live 5-Engine WhatsApp Executive Note */}
            <div className="lg:col-span-5 industrial-card rounded-2xl p-5 border border-emerald-500/30 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h2 className="text-sm font-bold text-white">
                        Unified P1–P5 Monday 9 AM WhatsApp Brief
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Auto-synthesized from all 5 live engines
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyBrief}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    {copiedWhatsApp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWhatsApp ? 'Copied!' : 'Copy Brief'}</span>
                  </button>
                </div>

                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {unifiedWhatsAppBrief}
                </pre>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
                <button
                  onClick={handleSyncAllEnginesToMondayTower}
                  className="text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Push Live P1–P4 Numbers to P5</span>
                </button>
                <button
                  onClick={onSwitchToStandaloneP5}
                  className="text-rose-300 hover:underline cursor-pointer"
                >
                  Launch Standalone P5 ↗
                </button>
              </div>
            </div>

            {/* Right 7 Cols: 5-Project Quick Launch & Cross-Engine Diagnostics */}
            <div className="lg:col-span-7 industrial-card rounded-2xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    5-Engine Turnaround Execution Roadmap (Click Any Engine to Drill Down)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Switch into any engine inside the Merged Suite or launch its standalone workspace
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Row P1 */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">P1</span>
                      <span className="font-bold text-white">Dead Stock &amp; Idle Cash Engine</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Top Dead SKU: <strong className="text-slate-200">{p1Summary.topDeadItems[0]?.itemName}</strong> ({formatCurrency(p1Summary.topDeadItems[0]?.closingValue || 0, 'INR')}) • Annual Holding Burn: {formatCurrency(p1Summary.annualHoldingBurn, 'INR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveModule('p1_engine')}
                      className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold cursor-pointer"
                    >
                      Open in Suite
                    </button>
                    <button
                      onClick={onSwitchToStandaloneP1}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px] cursor-pointer"
                    >
                      Standalone P1 ↗
                    </button>
                  </div>
                </div>

                {/* Row P2 */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">P2</span>
                      <span className="font-bold text-white">Dispatch OTIF &amp; Factory Gate SLA Engine</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Weakest Account: <strong className="text-slate-200">{p2Metrics.weakestCustomer?.customer} ({p2Metrics.weakestCustomer?.otifPercent}%)</strong> • Top Cause: <strong className="text-rose-400">{p2Metrics.topFailureReason?.reason}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveModule('p2_engine')}
                      className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold cursor-pointer"
                    >
                      Open in Suite
                    </button>
                    <button
                      onClick={onSwitchToStandaloneP2}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px] cursor-pointer"
                    >
                      Standalone P2 ↗
                    </button>
                  </div>
                </div>

                {/* Row P3 */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">P3</span>
                      <span className="font-bold text-white">Freight Leak &amp; Transporter Detention Audit</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Worst Lane: <strong className="text-slate-200">{p3Audit.laneSummaries[0]?.lane}</strong> • Primary Leak Carrier: <strong className="text-rose-400">{p3Audit.transporterSummaries[0]?.transporter} ({formatCurrency(p3Audit.transporterSummaries[0]?.totalWaste || 0, 'INR')})</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveModule('p3_engine')}
                      className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-semibold cursor-pointer"
                    >
                      Open in Suite
                    </button>
                    <button
                      onClick={onSwitchToStandaloneP3}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px] cursor-pointer"
                    >
                      Standalone P3 ↗
                    </button>
                  </div>
                </div>

                {/* Row P4 */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-mono text-[10px] font-bold">P4</span>
                      <span className="font-bold text-white">BinAudit EV — Spares Cycle Count &amp; Slotting Audit</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {p4Summary.skusCounted} SKUs Counted • <strong className="text-rose-400">{formatCurrency(p4Summary.shelfShortRupees, 'INR')} Short</strong> • <strong className="text-emerald-400">{formatCurrency(p4Summary.foundStockRupees, 'INR')} Found</strong> • {p4Summary.fastMoversHidden} Hidden Fast Movers
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveModule('p4_engine')}
                      className="px-2.5 py-1 rounded bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/30 font-semibold cursor-pointer"
                    >
                      Open in Suite
                    </button>
                    <button
                      onClick={onSwitchToStandaloneP4}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px] cursor-pointer"
                    >
                      Standalone P4 ↗
                    </button>
                  </div>
                </div>

                {/* Row P5 */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">P5</span>
                      <span className="font-bold text-white">Monday Control Tower — 6-Number Executive Habit</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Client: <strong className="text-slate-200">{p5TowerData.clientName}</strong> • Week Ending: {p5TowerData.weekEndingDate} • Multilingual (EN / தமிழ் / हिंदी / DE / ES)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveModule('p5_engine')}
                      className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold cursor-pointer"
                    >
                      Open in Suite
                    </button>
                    <button
                      onClick={onSwitchToStandaloneP5}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px] cursor-pointer"
                    >
                      Standalone P5 ↗
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Client Discovery, Data Extraction & Monetization Question Playbook (P1 to P5 + Combined) */}
          <div className="industrial-card rounded-2xl p-6 border border-amber-500/30 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold uppercase">
                  Field Conversion Playbook
                </span>
                <h2 className="text-base sm:text-lg font-black text-white mt-1">
                  The Exact Questions to Ask to Convert P1–P5 Into Paid Factory Engagements
                </h2>
                <p className="text-xs text-slate-400">
                  Do not pitch "software features." Ask these exact diagnostic questions to extract raw factory data, prove the rupee leak in 48 hours, and close the retainer.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* P1 Playbook */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-300">P1 • DEAD STOCK AUDIT</span>
                  <span className="text-[10px] font-mono text-slate-400">Entry Wedge: ₹15k–₹25k</span>
                </div>
                <div className="space-y-1.5 text-slate-300">
                  <p><strong className="text-white">Ask Owner:</strong> &ldquo;If we walk to the back rack of your raw-material godown right now, how many lakhs of non-moving steel or cancelled OEM parts are sitting there for over 6 months—and are you paying 11% OD bank interest to hold them?&rdquo;</p>
                  <p><strong className="text-white">Ask Tally Clerk:</strong> &ldquo;Export the Tally Stock Summary with <em>Closing Qty, Value, and Last Voucher Date</em>—or give me the last 6 months Material Issue Register.&rdquo;</p>
                  <p className="text-emerald-400 font-mono text-[11px] pt-1 border-t border-slate-800">
                    <strong>Money Hook:</strong> Charge a fixed diagnostic fee OR 10% recovery commission on dead scrap liquidated in 14 days.
                  </p>
                </div>
              </div>

              {/* P2 Playbook */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-300">P2 • DISPATCH OTIF &amp; SLA</span>
                  <span className="text-[10px] font-mono text-slate-400">Retainer: ₹15k/mo</span>
                </div>
                <div className="space-y-1.5 text-slate-300">
                  <p><strong className="text-white">Ask Owner:</strong> &ldquo;Last month, how many times did your biggest OEM customer call you complaining a truck was late or short—and do you know whether Material Short, QC Hold, or Transporter Delay caused most of them?&rdquo;</p>
                  <p><strong className="text-white">Ask Security Guard:</strong> &ldquo;Show me the physical Gate Out-Register book from the last 14 days and compare the truck out-time against the PO promised slot.&rdquo;</p>
                  <p className="text-emerald-400 font-mono text-[11px] pt-1 border-t border-slate-800">
                    <strong>Money Hook:</strong> Protect Tier-1 vendor rating &amp; eliminate OEM debit notes using the 1-page IATF 8D CAPA proof report.
                  </p>
                </div>
              </div>

              {/* P3 Playbook */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-300">P3 • FREIGHT LEAK AUDIT</span>
                  <span className="text-[10px] font-mono text-slate-400">25% Gain-Share</span>
                </div>
                <div className="space-y-1.5 text-slate-300">
                  <p><strong className="text-white">Ask Owner:</strong> &ldquo;When two different transport brokers run the exact same Ambattur–Oragadam lane in the same week, why does one bill you ₹4,200 and the other ₹6,300—and how many hours did that lorry sit waiting at your gate?&rdquo;</p>
                  <p><strong className="text-white">Ask Accounts Clerk:</strong> &ldquo;Give me 1 month of yellow Lorry Receipts (LR bills) and the security gate vehicle in/out log.&rdquo;</p>
                  <p className="text-emerald-400 font-mono text-[11px] pt-1 border-t border-slate-800">
                    <strong>Money Hook:</strong> Zero upfront risk—charge 25% of verified freight &amp; detention savings recovered over 6 months.
                  </p>
                </div>
              </div>

              {/* P4 Playbook */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-fuchsia-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-fuchsia-300">P4 • BIN &amp; SLOTTING AUDIT</span>
                  <span className="text-[10px] font-mono text-slate-400">Audit: ₹12k / Sunday</span>
                </div>
                <div className="space-y-1.5 text-slate-300">
                  <p><strong className="text-white">Ask Owner:</strong> &ldquo;How many times this week did your counter boy tell a customer a fast-moving spare part was out of stock, when it was actually sitting uncounted on the mezzanine—or missing from pilferage?&rdquo;</p>
                  <p><strong className="text-white">Ask Storekeeper:</strong> &ldquo;Give me your top 25 highest-value/fastest-selling SKUs before the shutter opens at 8:30 AM for a 45-minute blind physical hand count.&rdquo;</p>
                  <p className="text-emerald-400 font-mono text-[11px] pt-1 border-t border-slate-800">
                    <strong>Money Hook:</strong> Immediate pilferage detection + moving hidden fast movers to the front counter.
                  </p>
                </div>
              </div>

              {/* P5 Playbook */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-rose-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-rose-300">P5 • MONDAY 9 AM TOWER</span>
                  <span className="text-[10px] font-mono text-slate-400">Habit: ₹15k–₹25k/mo</span>
                </div>
                <div className="space-y-1.5 text-slate-300">
                  <p><strong className="text-white">Ask Owner:</strong> &ldquo;Every Monday at 9:00 AM, before you walk into your factory, do you know on one WhatsApp screen: (1) Dead Cash, (2) Stockout Risk SKUs, (3) Late Loads, (4) Cost/Trip, (5) OTIF %, and (6) Overdue Bills &gt;30d?&rdquo;</p>
                  <p><strong className="text-white">Ask Accounts Head:</strong> &ldquo;Every Saturday at 4 PM, send me the 8 yellow numbers from Tally Outstandings and the Gate Register.&rdquo;</p>
                  <p className="text-emerald-400 font-mono text-[11px] pt-1 border-t border-slate-800">
                    <strong>Money Hook:</strong> You are not selling software; you are selling the Owner&apos;s Monday 9 AM peace of mind.
                  </p>
                </div>
              </div>

              {/* Combined P1-P5 Playbook */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-indigo-300">P1–P5 • FULL SUITE UPSELL</span>
                  <span className="text-[10px] font-mono text-emerald-300">LTV: ₹2.5L–₹4.5L/yr</span>
                </div>
                <div className="space-y-1.5 text-slate-300">
                  <p><strong className="text-white">The Sequencing Rule:</strong> Never pitch all 5 modules on Day 1. Land with <strong>ONE bleeding wound</strong> (usually P3 Freight Leak or P1 Dead Stock) as a 48-hour proof audit using their own CSV/bills.</p>
                  <p><strong className="text-white">The Upsell Bridge:</strong> Once P1/P3 unlocks ₹2L+ in cash, enroll the owner into <strong>P5 (Monday 9 AM WhatsApp Control Tower)</strong> so the leak never comes back.</p>
                  <p className="text-indigo-300 font-mono text-[11px] pt-1 border-t border-indigo-500/30">
                    <strong>Result:</strong> 1-time audit converts into a sticky 12-month operational retainer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 1-Click Live Cash-Recovery Execution Documents (Debit Notes, Liquidation RFQs, Reorder Indents) */}
          <RecoveryActionDocsGenerator />
        </main>
      )}
    </div>
  );
};
