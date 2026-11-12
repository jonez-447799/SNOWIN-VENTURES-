import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Printer,
  Plus,
  FileText,
  Download,
  Building2,
  Calendar,
  Activity,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Layers,
  Gauge,
  RefreshCw,
} from 'lucide-react';
import { MondayTowerData } from '../types';
import { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES as P1_DEFAULT_RULES } from '../../project1/data/initialData';
import { generateOwnerReport, evaluateStockEngine } from '../../project1/utils/calculations';
import { INITIAL_DISPATCHES, INITIAL_RULES as P2_DEFAULT_RULES } from '../../project2/data/initialData';
import { INITIAL_WORKSPACES } from '../../project2/data/factoryWorkspaces';
import { calculateOTIFMetrics, calculateRowStatus } from '../../project2/utils/otifCalculator';
import { INITIAL_TRIPS, DEFAULT_RULES as P3_DEFAULT_RULES } from '../../project3/data/defaultData';
import { calculateAuditMetrics } from '../../project3/utils/auditCalculations';
import { INITIAL_SAMPLE_SKUS as P4_INITIAL_SKUS, DEFAULT_RULES as P4_DEFAULT_RULES } from '../../project4/data/sampleData';
import { computeSummary, calculateItemFields } from '../../project4/utils/auditCalculations';
import { downloadCommandCenterWorkbook } from '../../utils/excelCommandCenterExporter';
import { usePlant } from '../../context/PlantContext';
import { CrossEngineSyncReportModal } from './CrossEngineSyncReportModal';

export interface ExecutiveActionItem {
  id: string;
  rank: number;
  pillar: 'P1 • Cash' | 'P2 • Revenue' | 'P3 • Profit' | 'P4 • Inventory' | 'P5 • Debtors';
  engineKey: 'p1' | 'p2' | 'p3' | 'p4' | 'p5';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  whatIssue: string;
  whyRootCause: string;
  financialImpactRupees: number;
  aiRecommendation: string;
  potentialRecoveryRupees: number;
  owner: string;
  dueDate: string;
  status: 'Open' | 'In Progress' | 'Closed';
}

interface PriorityRowItem {
  id: string;
  rank: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Closed';
  issue: string;
  impact: string;
  owner: string;
  dueDate: string;
  engine: 'p1' | 'p2' | 'p3' | 'p4';
}

interface ActionTrackerRow {
  id: string;
  action: string;
  owner: string;
  dueDate: string;
  status: 'in_progress' | 'overdue' | 'completed';
}

interface CEOMondayBriefingEngineV2Props {
  towerData: MondayTowerData;
  isDarkMode: boolean;
  onOpenProject: (projectId: number) => void;
  onJumpToEngine?: (engine: 'p1' | 'p2' | 'p3' | 'p4') => void;
}

const ACTION_STORAGE_KEY = 'p5_executive_actions_v2';
const TRACKER_STORAGE_KEY = 'p5_command_tracker_rows_v1';
const PRIORITY_STORAGE_KEY = 'p5_command_top5_v1';

function formatINR(val: number): string {
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

function formatShortINR(val: number): string {
  if (Math.abs(val) >= 100000) {
    const lakhs = val / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  if (Math.abs(val) >= 1000) {
    return `₹${Math.round(val / 1000)}K`;
  }
  return formatINR(val);
}

function getScoreBandLabel(score: number): { label: string; dot: string; textCls: string; barCls: string } {
  if (score >= 100) {
    return { label: 'World Class', dot: '🟢', textCls: 'text-emerald-300', barCls: 'bg-emerald-500' };
  }
  if (score >= 90) {
    return { label: 'Excellent', dot: '🟢', textCls: 'text-emerald-300', barCls: 'bg-emerald-500' };
  }
  if (score >= 85) {
    return { label: 'Good', dot: '🟢', textCls: 'text-emerald-300', barCls: 'bg-emerald-500' };
  }
  if (score >= 80) {
    return { label: 'Good', dot: '🟡', textCls: 'text-amber-300', barCls: 'bg-amber-500' };
  }
  if (score >= 70) {
    return { label: 'Needs Action', dot: '🔴', textCls: 'text-rose-300', barCls: 'bg-rose-500' };
  }
  return { label: 'Critical', dot: '🔴', textCls: 'text-rose-400', barCls: 'bg-rose-600' };
}

const BENCHMARK_PRIORITIES: PriorityRowItem[] = [
  {
    id: 'pri-1',
    rank: 1,
    severity: 'Critical',
    issue: 'Dead Inventory ₹8.2L',
    impact: 'Cash Blocked',
    owner: 'Inventory Manager',
    dueDate: '30 Nov',
    engine: 'p1',
  },
  {
    id: 'pri-2',
    rank: 2,
    severity: 'Critical',
    issue: 'Customer ABC OTIF 72%',
    impact: 'Revenue Risk',
    owner: 'Dispatch Head',
    dueDate: '25 Nov',
    engine: 'p2',
  },
  {
    id: 'pri-3',
    rank: 3,
    severity: 'High',
    issue: 'Freight Leakage ₹32K',
    impact: 'Margin Loss',
    owner: 'Logistics Head',
    dueDate: '24 Nov',
    engine: 'p3',
  },
  {
    id: 'pri-4',
    rank: 4,
    severity: 'High',
    issue: 'Bin B07 Mismatch',
    impact: 'Inventory Risk',
    owner: 'Stores Supervisor',
    dueDate: '22 Nov',
    engine: 'p4',
  },
  {
    id: 'pri-5',
    rank: 5,
    severity: 'Medium',
    issue: 'Carrier XYZ Overspend',
    impact: 'Cost Escalation',
    owner: 'Transport Coordinator',
    dueDate: '26 Nov',
    engine: 'p3',
  },
];

const BENCHMARK_TRACKER_ROWS: ActionTrackerRow[] = [
  {
    id: 'trk-1',
    action: 'Scrap Dead Stock',
    owner: 'Inventory Manager',
    dueDate: '30 Nov',
    status: 'in_progress',
  },
  {
    id: 'trk-2',
    action: 'Customer Recovery Call',
    owner: 'Sales Head',
    dueDate: '22 Nov',
    status: 'overdue',
  },
  {
    id: 'trk-3',
    action: 'Carrier Audit',
    owner: 'Logistics Head',
    dueDate: '24 Nov',
    status: 'completed',
  },
  {
    id: 'trk-4',
    action: 'Bin Recount',
    owner: 'Stores Head',
    dueDate: '21 Nov',
    status: 'in_progress',
  },
];

const OWNERSHIP_ESCALATION_MATRIX = [
  {
    area: 'P1 Dead Stock',
    primaryOwner: 'Inventory Manager',
    escalation: 'Supply Chain Head',
    engine: 'p1' as const,
  },
  {
    area: 'P2 OTIF',
    primaryOwner: 'Dispatch Head',
    escalation: 'COO',
    engine: 'p2' as const,
  },
  {
    area: 'P3 Freight Leakage',
    primaryOwner: 'Logistics Head',
    escalation: 'Finance Controller',
    engine: 'p3' as const,
  },
  {
    area: 'P4 Inventory Accuracy',
    primaryOwner: 'Stores Head',
    escalation: 'Operations Head',
    engine: 'p4' as const,
  },
  {
    area: 'P5 Executive Actions',
    primaryOwner: 'Plant Head',
    escalation: 'CEO',
    engine: 'p5' as const,
  },
];

const DUE_DATE_RULES = [
  { severity: '🔴 Critical', dueWindow: '3 Days', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40' },
  { severity: '🟠 High', dueWindow: '7 Days', cls: 'bg-orange-500/15 text-orange-300 border-orange-500/40' },
  { severity: '🟡 Medium', dueWindow: '14 Days', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40' },
  { severity: '🟢 Improvement', dueWindow: '30 Days', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' },
];

export const CEOMondayBriefingEngineV2: React.FC<CEOMondayBriefingEngineV2Props> = ({
  towerData,
  isDarkMode,
  onOpenProject,
  onJumpToEngine,
}) => {
  const { activePlant, activePeriod } = usePlant();
  const [dataSourceMode, setDataSourceMode] = useState<'chennai_benchmark' | 'live_sync'>('chennai_benchmark');
  const [activeView, setActiveView] = useState<'command_center' | 'top10_kpis' | 'mbr_pack'>('command_center');
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [isCrossSyncModalOpen, setIsCrossSyncModalOpen] = useState(false);
  const [crossSyncNotification, setCrossSyncNotification] = useState<string | null>(null);

  // Add Action Form state
  const [newActionText, setNewActionText] = useState('');
  const [newActionOwner, setNewActionOwner] = useState('Operations Head');
  const [newActionDue, setNewActionDue] = useState('29 Nov');

  // Consolidate Live Cross-Engine Intelligence from P1, P2, P3, P4 & P5
  const liveSuite = useMemo(() => {
    // 1. P1: Cash Recovery Engine (Strictly Dead Cash Locked in Inventory)
    let p1Items = AMBATTUR_FABRICATION_SAMPLE;
    let p1Rules = P1_DEFAULT_RULES;
    try {
      const sItems = JSON.parse(localStorage.getItem('p1_stock_items') || 'null');
      const sRules = JSON.parse(localStorage.getItem('p1_stock_rules') || 'null');
      if (Array.isArray(sItems) && sItems.length > 0) p1Items = sItems;
      if (sRules) p1Rules = sRules;
    } catch {}
    const p1Evaluated = evaluateStockEngine(p1Items, p1Rules);
    const p1Report = generateOwnerReport(p1Items, p1Rules);
    const deadCash = towerData.deadCashRupees || p1Report.deadCash;
    const cashRecoveryPotential = Math.round(deadCash * 0.68);
    const criticalDeadStock = p1Evaluated
      .filter((it) => (it.daysIdle || 0) >= 365)
      .reduce((s, it) => s + (it.closingValue || 0), 0) || Math.round(deadCash * 0.33);
    const abcADeadStock = p1Evaluated
      .filter((it) => it.status === 'Dead' && it.abcClass === 'A')
      .reduce((s, it) => s + (it.closingValue || 0), 0) || Math.round(deadCash * 0.51);
    const topDeadSkus = p1Evaluated
      .filter((it) => it.status === 'Dead')
      .sort((a, b) => (b.closingValue || 0) - (a.closingValue || 0))
      .slice(0, 3)
      .map((it, idx) => ({
        sku: it.itemName,
        value: formatShortINR(it.closingValue || 0),
        owner: idx < 2 ? 'Inventory Manager' : 'Stores Supervisor',
        dueDate: idx < 2 ? '30 Nov' : '28 Nov',
      }));

    // 2. P2: Customer Promise Reliability Engine (OTIF)
    let p2Dispatches = INITIAL_DISPATCHES;
    let p2Rules = P2_DEFAULT_RULES;
    try {
      const savedWsList = localStorage.getItem('otif_workspaces_v2');
      const savedActiveId = localStorage.getItem('otif_active_workspace_id_v2') || INITIAL_WORKSPACES[0].id;
      if (savedWsList) {
        const parsed = JSON.parse(savedWsList);
        const found = parsed.find((w: any) => w.id === savedActiveId) || parsed[0];
        if (found) {
          p2Dispatches = found.dispatches || INITIAL_DISPATCHES;
          p2Rules = found.rules || P2_DEFAULT_RULES;
        }
      }
    } catch {}
    const p2Metrics = calculateOTIFMetrics(p2Dispatches, p2Rules);
    const otifPercent =
      towerData.dispatchesCount > 0
        ? Math.round((towerData.otifPassesCount / towerData.dispatchesCount) * 100)
        : Math.round(p2Metrics.otifPercent);
    const lateOrdersCount = p2Metrics.failsLateOnly + p2Metrics.failsLateAndShort;
    const shortOrdersCount = p2Metrics.failsShortOnly + p2Metrics.failsLateAndShort;

    const custStats: Record<string, { total: number; fails: number }> = {};
    p2Dispatches.forEach((d) => {
      const c = calculateRowStatus(d, p2Rules);
      if (!custStats[d.customer]) custStats[d.customer] = { total: 0, fails: 0 };
      custStats[d.customer].total++;
      if (!c.otif) custStats[d.customer].fails++;
    });
    const sortedRiskCustomers = Object.entries(custStats)
      .map(([name, st]) => ({
        customer: name,
        otifNum: Math.round(((st.total - st.fails) / Math.max(1, st.total)) * 100),
        fails: st.fails,
      }))
      .sort((a, b) => a.otifNum - b.otifNum);

    const worstCustomerName = sortedRiskCustomers[0]?.customer || 'ABC Ltd';
    const worstCustomerOtif = sortedRiskCustomers[0]?.otifNum ?? 72;
    const atRiskCustomersCount = sortedRiskCustomers.filter((c) => c.otifNum < 85).length || 2;
    const otifRevenueExposure = Math.max(380000, (lateOrdersCount + shortOrdersCount) * 85000);

    // 3. P3: Profit Protection Engine (Freight Audit)
    let p3Trips = INITIAL_TRIPS;
    let p3Rules = P3_DEFAULT_RULES;
    try {
      const sTrips = JSON.parse(localStorage.getItem('freight_audit_trips_v1') || 'null');
      const sRules = JSON.parse(localStorage.getItem('freight_audit_rules_v1') || 'null');
      if (Array.isArray(sTrips) && sTrips.length > 0) p3Trips = sTrips;
      if (sRules) p3Rules = sRules;
    } catch {}
    const p3Audit = calculateAuditMetrics(p3Trips, p3Rules);
    const freightPaid = p3Audit.totals.freightPaid;
    const freightLeakage = p3Audit.totals.totalLeak;
    const recoveredFreight = Math.round(freightLeakage * 0.42);
    const pendingFreight = Math.max(0, freightLeakage - recoveredFreight);
    const annualizedMonthlyFreightLeak = Math.round(freightLeakage * 2.2);
    const sortedLanes = [...p3Audit.laneSummaries].sort((a, b) => b.totalWaste - a.totalWaste);
    const worstLane = sortedLanes[0];
    const worstCarrier = p3Audit.transporterSummaries[0];
    const marginRiskPct =
      freightPaid > 0 ? Math.round((freightLeakage / freightPaid) * 100) : 18;

    // 4. P4: Warehouse Reliability Engine (Bin Accuracy)
    let p4Items = P4_INITIAL_SKUS;
    let p4Rules = P4_DEFAULT_RULES;
    try {
      const sItems = JSON.parse(localStorage.getItem('binaudit_skus_v1') || 'null');
      const sRules = JSON.parse(localStorage.getItem('binaudit_rules_v1') || 'null');
      if (Array.isArray(sItems) && sItems.length > 0) p4Items = sItems;
      if (sRules) p4Rules = sRules;
    } catch {}
    const p4Summary = computeSummary(p4Items, p4Rules);
    const p4Enriched = p4Items.map((it) => calculateItemFields(it, p4Rules));
    const sortedVariances = [...p4Enriched].sort(
      (a, b) => Math.abs(b.gapRupees || 0) - Math.abs(a.gapRupees || 0)
    );
    const worstBinItem = sortedVariances[0];
    const inventoryAccuracyPct =
      p4Summary.skusCounted > 0
        ? Math.round((p4Summary.linesMatched / p4Summary.skusCounted) * 100)
        : 91;
    const grossVarianceRupees = p4Summary.shelfShortRupees + p4Summary.foundStockRupees;
    const accuracyLossImpactRupees = Math.max(
      grossVarianceRupees,
      Math.round(grossVarianceRupees * 2.4 + 95000)
    );

    // 6-Department Scores (0 - 100)
    const inventoryDeptScore = Math.max(55, Math.min(98, Math.round(100 - p1Report.deadCashPercent * 0.95)));
    const warehouseDeptScore = Math.max(55, Math.min(99, inventoryAccuracyPct));
    const dispatchDeptScore = Math.max(50, Math.min(99, otifPercent));
    const logisticsDeptScore = Math.max(50, Math.min(97, Math.round(100 - marginRiskPct * 1.15)));
    const planningDeptScore = Math.round((inventoryDeptScore + dispatchDeptScore) / 2);
    const procurementDeptScore = Math.min(96, Math.max(72, Math.round((inventoryDeptScore + warehouseDeptScore) / 2 + 3)));

    // Overall Health Score = 30% Inventory + 25% OTIF + 25% Freight + 20% Warehouse Accuracy
    const isPlantCustom = activePlant.id !== 'ambattur';
    const finalInventoryDeptScore = isPlantCustom ? activePlant.kpis.subScores.inventory : inventoryDeptScore;
    const finalWarehouseDeptScore = isPlantCustom ? activePlant.kpis.subScores.warehouse : warehouseDeptScore;
    const finalDispatchDeptScore = isPlantCustom ? activePlant.kpis.subScores.otif : dispatchDeptScore;
    const finalLogisticsDeptScore = isPlantCustom ? activePlant.kpis.subScores.freight : logisticsDeptScore;
    const finalOperationsHealthScore = isPlantCustom
      ? activePlant.kpis.factoryHealthScore
      : Math.round(
          finalInventoryDeptScore * 0.3 +
          finalDispatchDeptScore * 0.25 +
          finalLogisticsDeptScore * 0.25 +
          finalWarehouseDeptScore * 0.2
        );

    const executiveRiskIndex = Math.min(
      96,
      Math.max(12, Math.round(100 - finalOperationsHealthScore + ((isPlantCustom ? activePlant.kpis.otifPercent : otifPercent) < 85 ? 15 : 0)))
    );

    return {
      deadCash: isPlantCustom ? activePlant.kpis.deadStockRupees : deadCash,
      cashRecoveryPotential: isPlantCustom ? activePlant.kpis.recoverableRupees : cashRecoveryPotential,
      criticalDeadStock,
      abcADeadStock: isPlantCustom ? activePlant.kpis.aClassDeadRupees : abcADeadStock,
      deadItemCount: p1Report.deadItemCount,
      topDeadSkus,
      otifPercent: isPlantCustom ? activePlant.kpis.otifPercent : otifPercent,
      totalDispatches: isPlantCustom ? activePlant.kpis.totalDispatches : p2Metrics.totalDispatches,
      passDispatches: isPlantCustom ? activePlant.kpis.passDispatches : p2Metrics.passes,
      lateOrdersCount,
      shortOrdersCount,
      atRiskCustomersCount,
      worstCustomerName,
      worstCustomerOtif,
      sortedRiskCustomers,
      otifRevenueExposure,
      freightPaid,
      freightLeakage: isPlantCustom ? activePlant.kpis.freightLeakRupees : freightLeakage,
      recoveredFreight,
      pendingFreight,
      annualizedMonthlyFreightLeak,
      marginRiskPct,
      sortedLanes,
      worstLaneName: worstLane ? worstLane.lane : 'Chennai-HYD',
      worstLaneWaste: worstLane ? worstLane.totalWaste : 18000,
      transporters: p3Audit.transporterSummaries,
      worstCarrierName: worstCarrier ? worstCarrier.transporter : 'XYZ Transport',
      inventoryAccuracyPct: isPlantCustom ? activePlant.kpis.binAccuracyPercent : inventoryAccuracyPct,
      grossVarianceRupees,
      accuracyLossImpactRupees: isPlantCustom ? activePlant.kpis.unreliabilityCostRupees : accuracyLossImpactRupees,
      linesMismatch: p4Summary.linesMismatch,
      sortedVariances,
      worstBinSpot: worstBinItem ? worstBinItem.spot : 'B07',
      inventoryDeptScore: finalInventoryDeptScore,
      warehouseDeptScore: finalWarehouseDeptScore,
      dispatchDeptScore: finalDispatchDeptScore,
      logisticsDeptScore: finalLogisticsDeptScore,
      planningDeptScore,
      procurementDeptScore,
      operationsHealthScore: finalOperationsHealthScore,
      executiveRiskIndex,
      unpaidBillsRupees: isPlantCustom ? activePlant.kpis.unpaidBillsRupees : (towerData.unpaidBillsRupees || 485000),
    };
  }, [towerData, activePlant]);

  // Keep legacy ExecutiveActionItem synced in localStorage for MasterExecutiveDashboard compatibility
  const [legacyActions] = useState<ExecutiveActionItem[]>(() => {
    try {
      const saved = localStorage.getItem(ACTION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    if (legacyActions.length > 0) {
      try {
        localStorage.setItem(ACTION_STORAGE_KEY, JSON.stringify(legacyActions));
      } catch {}
    }
  }, [legacyActions]);

  // Persistent Row 2: Top 5 Priorities
  const [benchmarkPriorities, setBenchmarkPriorities] = useState<PriorityRowItem[]>(() => {
    try {
      const saved = localStorage.getItem(PRIORITY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 5) return parsed;
      }
    } catch {}
    return BENCHMARK_PRIORITIES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(PRIORITY_STORAGE_KEY, JSON.stringify(benchmarkPriorities));
    } catch {}
  }, [benchmarkPriorities]);

  // Persistent Row 3: Action Tracker Detailed Rows
  const [trackerRows, setTrackerRows] = useState<ActionTrackerRow[]>(() => {
    try {
      const saved = localStorage.getItem(TRACKER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return BENCHMARK_TRACKER_ROWS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(trackerRows));
    } catch {}
  }, [trackerRows]);

  const cyclePrioritySeverity = (id: string) => {
    setBenchmarkPriorities((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const order: PriorityRowItem['severity'][] = ['Critical', 'High', 'Medium', 'Closed'];
        const next = order[(order.indexOf(p.severity) + 1) % order.length];
        return { ...p, severity: next };
      })
    );
  };

  const cycleTrackerStatus = (id: string) => {
    setTrackerRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next: ActionTrackerRow['status'] =
          r.status === 'in_progress' ? 'overdue' : r.status === 'overdue' ? 'completed' : 'in_progress';
        return { ...r, status: next };
      })
    );
  };

  const handleAddTrackerRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionText.trim()) return;
    setTrackerRows((prev) => [
      ...prev,
      {
        id: `trk-${Date.now()}`,
        action: newActionText.trim(),
        owner: newActionOwner.trim() || 'Operations Head',
        dueDate: newActionDue.trim() || '30 Nov',
        status: 'in_progress',
      },
    ]);
    setNewActionText('');
  };

  const handleApplyCrossEngineSync = () => {
    setDataSourceMode('live_sync');
    const livePriorities: PriorityRowItem[] = [
      {
        id: 'live-pri-1',
        rank: 1,
        severity: liveSuite.deadCash > 200000 ? 'Critical' : 'High',
        issue: `Dead Inventory ${formatShortINR(liveSuite.deadCash)}`,
        impact: 'Cash Blocked',
        owner: 'Inventory Manager',
        dueDate: '30 Nov',
        engine: 'p1',
      },
      {
        id: 'live-pri-2',
        rank: 2,
        severity: liveSuite.worstCustomerOtif < 80 ? 'Critical' : 'High',
        issue: `${liveSuite.worstCustomerName} OTIF ${liveSuite.worstCustomerOtif}%`,
        impact: 'Revenue Risk',
        owner: 'Dispatch Head',
        dueDate: '25 Nov',
        engine: 'p2',
      },
      {
        id: 'live-pri-3',
        rank: 3,
        severity: liveSuite.freightLeakage > 15000 ? 'High' : 'Medium',
        issue: `Freight Leakage ${formatShortINR(liveSuite.freightLeakage)}`,
        impact: 'Margin Loss',
        owner: 'Logistics Head',
        dueDate: '24 Nov',
        engine: 'p3',
      },
      {
        id: 'live-pri-4',
        rank: 4,
        severity: liveSuite.inventoryAccuracyPct < 95 ? 'High' : 'Medium',
        issue: `Bin ${liveSuite.worstBinSpot} Mismatch`,
        impact: 'Inventory Risk',
        owner: 'Stores Supervisor',
        dueDate: '22 Nov',
        engine: 'p4',
      },
      {
        id: 'live-pri-5',
        rank: 5,
        severity: 'Medium',
        issue: `${liveSuite.worstCarrierName} Overspend`,
        impact: 'Cost Escalation',
        owner: 'Transport Coordinator',
        dueDate: '26 Nov',
        engine: 'p3',
      },
    ];
    setBenchmarkPriorities(livePriorities);
    try {
      localStorage.setItem(PRIORITY_STORAGE_KEY, JSON.stringify(livePriorities));
      const syncData = {
        ...towerData,
        lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' (Live 5-Engine Sync)',
        deadCashRupees: liveSuite.deadCash,
        dispatchesCount: liveSuite.totalDispatches,
        otifPassesCount: liveSuite.passDispatches,
        ordersLateCount: liveSuite.lateOrdersCount,
        freightPaidRupees: liveSuite.freightPaid,
        unpaidBillsRupees: liveSuite.unpaidBillsRupees,
      };
      localStorage.setItem('monday_tower_data_v1', JSON.stringify(syncData));
      localStorage.setItem('monday_control_tower_v1', JSON.stringify(syncData));
      window.dispatchEvent(new Event('storage'));
    } catch {}
    setCrossSyncNotification('All 5 engines successfully synced! CEO Monday Briefing updated with live operational state.');
    setTimeout(() => setCrossSyncNotification(null), 4000);
  };

  // Unified Display Model (Switches cleanly between Chennai Plant W46 Benchmark & Live P1-P4 Sync)
  const viewData = useMemo(() => {
    if (dataSourceMode === 'chennai_benchmark') {
      // Dynamic offset if user clicks tracker rows above/below initial 4 seeded rows
      const seedInProg = 2;
      const seedOverdue = 1;
      const seedCompleted = 1;
      const currOpenDelta =
        trackerRows.filter((r) => r.status !== 'completed').length - (seedInProg + seedOverdue);
      const currOverdueDelta = trackerRows.filter((r) => r.status === 'overdue').length - seedOverdue;
      const currCompDelta = trackerRows.filter((r) => r.status === 'completed').length - seedCompleted;

      const openActions = Math.max(0, 14 + currOpenDelta);
      const overdueActions = Math.max(0, 4 + currOverdueDelta);
      const completedThisWeek = Math.max(0, 11 + currCompDelta);
      const closureRate =
        openActions === 14 && completedThisWeek === 11
          ? 79
          : Math.round((completedThisWeek / Math.max(1, completedThisWeek + openActions)) * 100);

      return {
        plant: 'Chennai Plant',
        week: 'W46 - Nov 2026',
        healthScore: 84,
        healthEmoji: '🟡',
        lastUpdated: 'Monday 08:00 AM',
        kpiCards: [
          {
            key: 'p1' as const,
            title: 'CASH',
            value: '₹18.4L',
            subtitle: 'Dead Stock',
            statusLabel: '🔴 Critical',
            sourceLabel: 'Cash → P1',
            borderCls: 'border-rose-500/50 hover:border-rose-400',
            badgeCls: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          },
          {
            key: 'p2' as const,
            title: 'REVENUE',
            value: 'OTIF 91%',
            subtitle: 'Customer Promise',
            statusLabel: '🟡 Warning',
            sourceLabel: 'Revenue → P2',
            borderCls: 'border-amber-500/50 hover:border-amber-400',
            badgeCls: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          },
          {
            key: 'p3' as const,
            title: 'PROFIT',
            value: '₹74K Leak',
            subtitle: 'Freight Audit',
            statusLabel: '🔴 Critical',
            sourceLabel: 'Profit → P3',
            borderCls: 'border-rose-500/50 hover:border-rose-400',
            badgeCls: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          },
          {
            key: 'p4' as const,
            title: 'INVENTORY',
            value: 'Accuracy 96%',
            subtitle: 'Warehouse Bins',
            statusLabel: '🟢 Healthy',
            sourceLabel: 'Inventory → P4',
            borderCls: 'border-emerald-500/50 hover:border-emerald-400',
            badgeCls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          },
        ],
        priorities: benchmarkPriorities,
        trackerStats: {
          openActions,
          overdueActions,
          completedThisWeek,
          closureRate,
        },
        departments: [
          { name: 'Inventory Control', score: 82, dot: '🟡', band: 'Good', engine: 'p1' as const },
          { name: 'Warehouse', score: 91, dot: '🟢', band: 'Excellent', engine: 'p4' as const },
          { name: 'Dispatch', score: 88, dot: '🟢', band: 'Good', engine: 'p2' as const },
          { name: 'Logistics', score: 72, dot: '🔴', band: 'Needs Action', engine: 'p3' as const },
          { name: 'Planning', score: 84, dot: '🟡', band: 'Good', engine: 'p2' as const },
          { name: 'Procurement', score: 89, dot: '🟢', band: 'Good', engine: 'p1' as const },
        ],
        p1Panel: {
          kpis: [
            { label: 'Dead Stock Value', value: '₹18.4L' },
            { label: 'Recoverable Value', value: '₹12.6L' },
            { label: 'Critical Dead Stock', value: '₹6.1L' },
            { label: 'ABC A-Class Dead Stock', value: '₹9.3L' },
          ],
          topItems: [
            { sku: 'Servo Motor', value: '₹3L', owner: 'Inventory Manager', dueDate: '30 Nov' },
            { sku: 'Gearbox', value: '₹2.2L', owner: 'Inventory Manager', dueDate: '30 Nov' },
            { sku: 'Bearing Set', value: '₹1.5L', owner: 'Planning Head', dueDate: '28 Nov' },
          ],
          trend: [
            { month: 'Jul', valLakhs: 24, label: '₹24L' },
            { month: 'Aug', valLakhs: 22, label: '₹22L' },
            { month: 'Sep', valLakhs: 21, label: '₹21L' },
            { month: 'Oct', valLakhs: 20, label: '₹20L' },
            { month: 'Nov', valLakhs: 18, label: '₹18L' },
          ],
        },
        p2Panel: {
          kpis: [
            { label: 'OTIF', value: '91%' },
            { label: 'Late Orders', value: '12' },
            { label: 'Short Supply Orders', value: '7' },
            { label: 'Revenue At Risk', value: '₹24L' },
          ],
          topCustomers: [
            { customer: 'ABC Ltd', otif: '72%', owner: 'Dispatch Head', dueDate: '25 Nov' },
            { customer: 'XYZ Auto', otif: '78%', owner: 'Planning Head', dueDate: '24 Nov' },
            { customer: 'Prime Tech', otif: '81%', owner: 'Logistics Head', dueDate: '28 Nov' },
          ],
          rootCausePie: [
            { label: 'Production Delay', pct: 42, color: '#f43f5e' },
            { label: 'Material Shortage', pct: 28, color: '#f59e0b' },
            { label: 'Transport Delay', pct: 20, color: '#06b6d4' },
            { label: 'Documentation', pct: 10, color: '#a855f7' },
          ],
        },
        p3Panel: {
          kpis: [
            { label: 'Freight Spend', value: '₹8.2L' },
            { label: 'Leakages Found', value: '₹74K' },
            { label: 'Recovered', value: '₹31K' },
            { label: 'Pending Recovery', value: '₹43K' },
          ],
          topRoutes: [
            { route: 'Chennai-HYD', leakage: '₹18K', owner: 'Logistics Head', dueDate: '22 Nov' },
            { route: 'Chennai-BLR', leakage: '₹12K', owner: 'Transport Coordinator', dueDate: '24 Nov' },
            { route: 'Chennai-Pune', leakage: '₹8K', owner: 'Logistics Head', dueDate: '26 Nov' },
          ],
          carriers: [
            { carrier: 'DHL', score: 94, critical: false },
            { carrier: 'ABC Logistics', score: 88, critical: false },
            { carrier: 'XYZ Transport', score: 61, critical: true },
          ],
        },
        p4Panel: {
          kpis: [
            { label: 'Accuracy', value: '96%' },
            { label: 'Variance Value', value: '₹1.2L' },
            { label: 'High Risk Bins', value: '4' },
            { label: 'Cycle Counts Due', value: '17' },
          ],
          topVariances: [
            { bin: 'B07', impact: '₹48K', owner: 'Stores Head', dueDate: '22 Nov' },
            { bin: 'A11', impact: '₹30K', owner: 'Warehouse Manager', dueDate: '23 Nov' },
            { bin: 'C04', impact: '₹15K', owner: 'Inventory Controller', dueDate: '25 Nov' },
          ],
          zones: [
            { zone: 'A Zone', dot: '🟢', state: 'Healthy (99%)' },
            { zone: 'B Zone', dot: '🔴', state: 'Critical Variance (89%)' },
            { zone: 'C Zone', dot: '🟡', state: 'Watchlist (94%)' },
            { zone: 'D Zone', dot: '🟢', state: 'Healthy (98%)' },
          ],
        },
        aiSummary: {
          points: [
            'Dead inventory reduced by ₹2L this week.',
            'OTIF remains below target due to production delays affecting ABC Ltd.',
            'Freight leakage of ₹74K detected, with Chennai-HYD route contributing 24% of total leakage.',
            'Inventory Accuracy improved from 94% to 96%.',
          ],
          focusBullets: [
            'Dispose Top 3 dead stock items',
            'Recover customer OTIF for ABC Ltd',
            'Audit XYZ Transport invoices',
            'Recount B07 warehouse location',
          ],
        },
      };
    }

    // LIVE P1-P4 SYNC MODE
    const hScore = liveSuite.operationsHealthScore;
    const hDot = hScore >= 90 ? '🟢' : hScore >= 75 ? '🟡' : '🔴';

    const openAct = trackerRows.filter((r) => r.status !== 'completed').length;
    const overdueAct = trackerRows.filter((r) => r.status === 'overdue').length;
    const compAct = trackerRows.filter((r) => r.status === 'completed').length;
    const cRate = Math.round((compAct / Math.max(1, trackerRows.length)) * 100);

    const livePriorities: PriorityRowItem[] = [
      {
        id: 'live-pri-1',
        rank: 1,
        severity: liveSuite.deadCash > 200000 ? 'Critical' : 'High',
        issue: `Dead Inventory ${formatShortINR(liveSuite.deadCash)}`,
        impact: 'Cash Blocked',
        owner: 'Inventory Manager',
        dueDate: '30 Nov',
        engine: 'p1',
      },
      {
        id: 'live-pri-2',
        rank: 2,
        severity: liveSuite.worstCustomerOtif < 80 ? 'Critical' : 'High',
        issue: `${liveSuite.worstCustomerName} OTIF ${liveSuite.worstCustomerOtif}%`,
        impact: 'Revenue Risk',
        owner: 'Dispatch Head',
        dueDate: '25 Nov',
        engine: 'p2',
      },
      {
        id: 'live-pri-3',
        rank: 3,
        severity: liveSuite.freightLeakage > 15000 ? 'High' : 'Medium',
        issue: `Freight Leakage ${formatShortINR(liveSuite.freightLeakage)}`,
        impact: 'Margin Loss',
        owner: 'Logistics Head',
        dueDate: '24 Nov',
        engine: 'p3',
      },
      {
        id: 'live-pri-4',
        rank: 4,
        severity: liveSuite.inventoryAccuracyPct < 95 ? 'High' : 'Medium',
        issue: `Bin ${liveSuite.worstBinSpot} Mismatch`,
        impact: 'Inventory Risk',
        owner: 'Stores Supervisor',
        dueDate: '22 Nov',
        engine: 'p4',
      },
      {
        id: 'live-pri-5',
        rank: 5,
        severity: 'Medium',
        issue: `Carrier ${liveSuite.worstCarrierName} Overspend`,
        impact: 'Cost Escalation',
        owner: 'Transport Coordinator',
        dueDate: '26 Nov',
        engine: 'p3',
      },
    ];

    const liveLakhs = Math.max(1.2, Number((liveSuite.deadCash / 100000).toFixed(1)));
    const topRoutePct =
      liveSuite.freightLeakage > 0
        ? Math.round((liveSuite.worstLaneWaste / liveSuite.freightLeakage) * 100)
        : 24;

    return {
      plant: towerData.clientName || 'Ambattur Plant',
      week: `Week Ending ${towerData.weekEndingDate}`,
      healthScore: hScore,
      healthEmoji: hDot,
      lastUpdated: towerData.lastUpdated || 'Monday 08:00 AM',
      kpiCards: [
        {
          key: 'p1' as const,
          title: 'CASH',
          value: formatShortINR(liveSuite.deadCash),
          subtitle: 'Dead Stock',
          statusLabel: liveSuite.deadCash > 200000 ? '🔴 Critical' : '🟡 Warning',
          sourceLabel: 'Cash → P1',
          borderCls:
            liveSuite.deadCash > 200000
              ? 'border-rose-500/50 hover:border-rose-400'
              : 'border-amber-500/50 hover:border-amber-400',
          badgeCls:
            liveSuite.deadCash > 200000
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        },
        {
          key: 'p2' as const,
          title: 'REVENUE',
          value: `OTIF ${liveSuite.otifPercent}%`,
          subtitle: 'Customer Promise',
          statusLabel:
            liveSuite.otifPercent >= 95
              ? '🟢 Healthy'
              : liveSuite.otifPercent >= 85
              ? '🟡 Warning'
              : '🔴 Critical',
          sourceLabel: 'Revenue → P2',
          borderCls:
            liveSuite.otifPercent >= 95
              ? 'border-emerald-500/50 hover:border-emerald-400'
              : liveSuite.otifPercent >= 85
              ? 'border-amber-500/50 hover:border-amber-400'
              : 'border-rose-500/50 hover:border-rose-400',
          badgeCls:
            liveSuite.otifPercent >= 95
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : liveSuite.otifPercent >= 85
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        },
        {
          key: 'p3' as const,
          title: 'PROFIT',
          value: `${formatShortINR(liveSuite.freightLeakage)} Leak`,
          subtitle: 'Freight Audit',
          statusLabel: liveSuite.freightLeakage > 15000 ? '🔴 Critical' : '🟡 Warning',
          sourceLabel: 'Profit → P3',
          borderCls: 'border-rose-500/50 hover:border-rose-400',
          badgeCls: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        },
        {
          key: 'p4' as const,
          title: 'INVENTORY',
          value: `Accuracy ${liveSuite.inventoryAccuracyPct}%`,
          subtitle: 'Warehouse Bins',
          statusLabel:
            liveSuite.inventoryAccuracyPct >= 95
              ? '🟢 Healthy'
              : liveSuite.inventoryAccuracyPct >= 90
              ? '🟡 Warning'
              : '🔴 Critical',
          sourceLabel: 'Inventory → P4',
          borderCls:
            liveSuite.inventoryAccuracyPct >= 95
              ? 'border-emerald-500/50 hover:border-emerald-400'
              : 'border-amber-500/50 hover:border-amber-400',
          badgeCls:
            liveSuite.inventoryAccuracyPct >= 95
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        },
      ],
      priorities: livePriorities,
      trackerStats: {
        openActions: openAct,
        overdueActions: overdueAct,
        completedThisWeek: compAct,
        closureRate: cRate,
      },
      departments: [
        {
          name: 'Inventory Control',
          score: liveSuite.inventoryDeptScore,
          dot: getScoreBandLabel(liveSuite.inventoryDeptScore).dot,
          band: getScoreBandLabel(liveSuite.inventoryDeptScore).label,
          engine: 'p1' as const,
        },
        {
          name: 'Warehouse',
          score: liveSuite.warehouseDeptScore,
          dot: getScoreBandLabel(liveSuite.warehouseDeptScore).dot,
          band: getScoreBandLabel(liveSuite.warehouseDeptScore).label,
          engine: 'p4' as const,
        },
        {
          name: 'Dispatch',
          score: liveSuite.dispatchDeptScore,
          dot: getScoreBandLabel(liveSuite.dispatchDeptScore).dot,
          band: getScoreBandLabel(liveSuite.dispatchDeptScore).label,
          engine: 'p2' as const,
        },
        {
          name: 'Logistics',
          score: liveSuite.logisticsDeptScore,
          dot: getScoreBandLabel(liveSuite.logisticsDeptScore).dot,
          band: getScoreBandLabel(liveSuite.logisticsDeptScore).label,
          engine: 'p3' as const,
        },
        {
          name: 'Planning',
          score: liveSuite.planningDeptScore,
          dot: getScoreBandLabel(liveSuite.planningDeptScore).dot,
          band: getScoreBandLabel(liveSuite.planningDeptScore).label,
          engine: 'p2' as const,
        },
        {
          name: 'Procurement',
          score: liveSuite.procurementDeptScore,
          dot: getScoreBandLabel(liveSuite.procurementDeptScore).dot,
          band: getScoreBandLabel(liveSuite.procurementDeptScore).label,
          engine: 'p1' as const,
        },
      ],
      p1Panel: {
        kpis: [
          { label: 'Dead Stock Value', value: formatShortINR(liveSuite.deadCash) },
          { label: 'Recoverable Value', value: formatShortINR(liveSuite.cashRecoveryPotential) },
          { label: 'Critical Dead Stock', value: formatShortINR(liveSuite.criticalDeadStock) },
          { label: 'ABC A-Class Dead Stock', value: formatShortINR(liveSuite.abcADeadStock) },
        ],
        topItems:
          liveSuite.topDeadSkus.length > 0
            ? liveSuite.topDeadSkus
            : [
                { sku: 'Servo Motor', value: '₹3L', owner: 'Inventory Manager', dueDate: '30 Nov' },
                { sku: 'Gearbox', value: '₹2.2L', owner: 'Inventory Manager', dueDate: '30 Nov' },
                { sku: 'Bearing Set', value: '₹1.5L', owner: 'Planning Head', dueDate: '28 Nov' },
              ],
        trend: [
          { month: 'Jul', valLakhs: Number((liveLakhs * 1.32).toFixed(1)), label: `₹${(liveLakhs * 1.32).toFixed(1)}L` },
          { month: 'Aug', valLakhs: Number((liveLakhs * 1.22).toFixed(1)), label: `₹${(liveLakhs * 1.22).toFixed(1)}L` },
          { month: 'Sep', valLakhs: Number((liveLakhs * 1.15).toFixed(1)), label: `₹${(liveLakhs * 1.15).toFixed(1)}L` },
          { month: 'Oct', valLakhs: Number((liveLakhs * 1.08).toFixed(1)), label: `₹${(liveLakhs * 1.08).toFixed(1)}L` },
          { month: 'Nov', valLakhs: liveLakhs, label: `₹${liveLakhs}L` },
        ],
      },
      p2Panel: {
        kpis: [
          { label: 'OTIF', value: `${liveSuite.otifPercent}%` },
          { label: 'Late Orders', value: String(liveSuite.lateOrdersCount) },
          { label: 'Short Supply Orders', value: String(liveSuite.shortOrdersCount) },
          { label: 'Revenue At Risk', value: formatShortINR(liveSuite.otifRevenueExposure) },
        ],
        topCustomers: liveSuite.sortedRiskCustomers.slice(0, 3).map((c, idx) => ({
          customer: c.customer,
          otif: `${c.otifNum}%`,
          owner: idx === 0 ? 'Dispatch Head' : idx === 1 ? 'Planning Head' : 'Logistics Head',
          dueDate: idx === 0 ? '25 Nov' : idx === 1 ? '24 Nov' : '28 Nov',
        })),
        rootCausePie: [
          { label: 'Production Delay', pct: 42, color: '#f43f5e' },
          { label: 'Material Shortage', pct: 28, color: '#f59e0b' },
          { label: 'Transport Delay', pct: 20, color: '#06b6d4' },
          { label: 'Documentation', pct: 10, color: '#a855f7' },
        ],
      },
      p3Panel: {
        kpis: [
          { label: 'Freight Spend', value: formatShortINR(liveSuite.freightPaid) },
          { label: 'Leakages Found', value: formatShortINR(liveSuite.freightLeakage) },
          { label: 'Recovered', value: formatShortINR(liveSuite.recoveredFreight) },
          { label: 'Pending Recovery', value: formatShortINR(liveSuite.pendingFreight) },
        ],
        topRoutes: liveSuite.sortedLanes.slice(0, 3).map((ln, idx) => ({
          route: ln.lane,
          leakage: formatShortINR(ln.totalWaste),
          owner: idx === 1 ? 'Transport Coordinator' : 'Logistics Head',
          dueDate: idx === 0 ? '22 Nov' : idx === 1 ? '24 Nov' : '26 Nov',
        })),
        carriers: liveSuite.transporters.slice(0, 3).map((tr, idx) => {
          const calcScore = Math.max(52, Math.min(96, 95 - idx * 14));
          return {
            carrier: tr.transporter,
            score: calcScore,
            critical: calcScore < 70,
          };
        }),
      },
      p4Panel: {
        kpis: [
          { label: 'Accuracy', value: `${liveSuite.inventoryAccuracyPct}%` },
          { label: 'Variance Value', value: formatShortINR(liveSuite.grossVarianceRupees) },
          { label: 'High Risk Bins', value: String(liveSuite.linesMismatch) },
          { label: 'Cycle Counts Due', value: String(Math.max(8, liveSuite.linesMismatch * 3)) },
        ],
        topVariances: liveSuite.sortedVariances.slice(0, 3).map((v, idx) => ({
          bin: v.spot,
          impact: formatShortINR(Math.abs(v.gapRupees || 0)),
          owner: idx === 0 ? 'Stores Head' : idx === 1 ? 'Warehouse Manager' : 'Inventory Controller',
          dueDate: idx === 0 ? '22 Nov' : idx === 1 ? '23 Nov' : '25 Nov',
        })),
        zones: [
          { zone: 'A Zone', dot: '🟢', state: 'Healthy' },
          { zone: 'B Zone', dot: liveSuite.inventoryAccuracyPct < 95 ? '🔴' : '🟡', state: 'High Variance' },
          { zone: 'C Zone', dot: '🟡', state: 'Watchlist' },
          { zone: 'D Zone', dot: '🟢', state: 'Healthy' },
        ],
      },
      aiSummary: {
        points: [
          `Dead inventory stands at ${formatShortINR(liveSuite.deadCash)}, with ${formatShortINR(liveSuite.cashRecoveryPotential)} immediately recoverable via clearance.`,
          `OTIF is at ${liveSuite.otifPercent}% due to production & material delays affecting ${liveSuite.worstCustomerName} (${liveSuite.worstCustomerOtif}%).`,
          `Freight leakage of ${formatShortINR(liveSuite.freightLeakage)} detected, with ${liveSuite.worstLaneName} contributing ${topRoutePct}% of total leakage.`,
          `Inventory Accuracy tracked at ${liveSuite.inventoryAccuracyPct}% (${liveSuite.linesMismatch} mismatched bins flagged).`,
        ],
        focusBullets: [
          'Dispose Top 3 dead stock items',
          `Recover customer OTIF for ${liveSuite.worstCustomerName}`,
          `Audit ${liveSuite.worstCarrierName} invoices`,
          `Recount ${liveSuite.worstBinSpot} warehouse location`,
        ],
      },
    };
  }, [dataSourceMode, benchmarkPriorities, trackerRows, liveSuite, towerData]);

  // Top 10 Focused Executive KPIs for optional secondary tab
  const top10KPIs = useMemo(() => {
    return [
      {
        num: 1,
        pillar: 'Cash (P1)',
        kpi: 'Dead Stock Value',
        value: viewData.p1Panel.kpis[0].value,
        meaning: 'Working capital locked in zero-movement SKUs',
        rag: 'critical',
        owner: 'Inventory Manager',
        engine: 'p1' as const,
      },
      {
        num: 2,
        pillar: 'Cash (P1)',
        kpi: 'Recoverable Dead Cash',
        value: viewData.p1Panel.kpis[1].value,
        meaning: 'Unlockable via liquidation, return, or scrap',
        rag: 'monitor',
        owner: 'Inventory Manager',
        engine: 'p1' as const,
      },
      {
        num: 3,
        pillar: 'Revenue (P2)',
        kpi: 'Customer Promise OTIF %',
        value: viewData.p2Panel.kpis[0].value,
        meaning: `${viewData.p2Panel.kpis[3].value} order value exposed to SLA risk`,
        rag: 'monitor',
        owner: 'Dispatch Head',
        engine: 'p2' as const,
      },
      {
        num: 4,
        pillar: 'Revenue (P2)',
        kpi: 'Late & Short Orders',
        value: `${viewData.p2Panel.kpis[1].value} Late / ${viewData.p2Panel.kpis[2].value} Short`,
        meaning: 'Orders breaching delivery promise window',
        rag: 'critical',
        owner: 'Dispatch Head',
        engine: 'p2' as const,
      },
      {
        num: 5,
        pillar: 'Profit (P3)',
        kpi: 'Freight Leakages Found',
        value: viewData.p3Panel.kpis[1].value,
        meaning: `Out of ${viewData.p3Panel.kpis[0].value} freight spend`,
        rag: 'critical',
        owner: 'Logistics Head',
        engine: 'p3' as const,
      },
      {
        num: 6,
        pillar: 'Profit (P3)',
        kpi: 'Pending Freight Recovery',
        value: viewData.p3Panel.kpis[3].value,
        meaning: `${viewData.p3Panel.kpis[2].value} already recovered via debit notes`,
        rag: 'monitor',
        owner: 'Logistics Head',
        engine: 'p3' as const,
      },
      {
        num: 7,
        pillar: 'Inventory (P4)',
        kpi: 'Warehouse Bin Accuracy %',
        value: viewData.p4Panel.kpis[0].value,
        meaning: 'Physical bin count vs ERP book balance match',
        rag: 'good',
        owner: 'Stores Head',
        engine: 'p4' as const,
      },
      {
        num: 8,
        pillar: 'Inventory (P4)',
        kpi: 'Stock Variance Value',
        value: viewData.p4Panel.kpis[1].value,
        meaning: `${viewData.p4Panel.kpis[2].value} high-risk bins pending recount`,
        rag: 'monitor',
        owner: 'Stores Head',
        engine: 'p4' as const,
      },
      {
        num: 9,
        pillar: 'Governance (P5)',
        kpi: 'Overall Factory Health Score',
        value: `${viewData.healthScore}/100`,
        meaning: 'Weighted: 30% Cash + 25% OTIF + 25% Freight + 20% Accuracy',
        rag: viewData.healthScore >= 85 ? 'good' : 'monitor',
        owner: 'Plant Head',
        engine: 'p5' as const,
      },
      {
        num: 10,
        pillar: 'Execution (P5)',
        kpi: 'Weekly Action Closure Rate',
        value: `${viewData.trackerStats.closureRate}%`,
        meaning: `${viewData.trackerStats.completedThisWeek} closed · ${viewData.trackerStats.overdueActions} overdue`,
        rag: viewData.trackerStats.overdueActions > 2 ? 'monitor' : 'good',
        owner: 'Plant Head',
        engine: 'p5' as const,
      },
    ];
  }, [viewData]);

  const handleEngineClick = (eng: 'p1' | 'p2' | 'p3' | 'p4' | 'p5') => {
    if (eng === 'p5') {
      onOpenProject(6);
      return;
    }
    if (onJumpToEngine) {
      onJumpToEngine(eng);
    } else {
      const map: Record<'p1' | 'p2' | 'p3' | 'p4', number> = { p1: 1, p2: 5, p3: 4, p4: 2 };
      onOpenProject(map[eng]);
    }
  };

  const handleCopyCEOBriefing = () => {
    const lines = [
      `MANUFACTURING COMMAND CENTER — CEO MONDAY BRIEFING`,
      `Plant: ${viewData.plant} | Week: ${viewData.week} | Health Score: ${viewData.healthScore}/100 ${viewData.healthEmoji}`,
      `Last Updated: ${viewData.lastUpdated}`,
      ``,
      `EXECUTIVE SNAPSHOT:`,
      `• CASH (P1): ${viewData.kpiCards[0].value} Dead Stock (${viewData.kpiCards[0].statusLabel})`,
      `• REVENUE (P2): ${viewData.kpiCards[1].value} (${viewData.kpiCards[1].statusLabel})`,
      `• PROFIT (P3): ${viewData.kpiCards[2].value} (${viewData.kpiCards[2].statusLabel})`,
      `• INVENTORY (P4): ${viewData.kpiCards[3].value} (${viewData.kpiCards[3].statusLabel})`,
      ``,
      `TOP 5 PRIORITIES:`,
      ...viewData.priorities.map(
        (p) => `#${p.rank} [${p.severity}] ${p.issue} (${p.impact}) ➔ ${p.owner} | Due: ${p.dueDate}`
      ),
      ``,
      `CEO MONDAY BRIEFING:`,
      ...viewData.aiSummary.points.map((pt, idx) => `${idx + 1}. ${pt}`),
      `5. Recommended Focus This Week:`,
      ...viewData.aiSummary.focusBullets.map((b) => `   • ${b}`),
    ].join('\n');
    navigator.clipboard.writeText(lines);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2500);
  };

  const renderPriorityBadge = (sev: PriorityRowItem['severity']) => {
    if (sev === 'Critical') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-mono font-bold whitespace-nowrap">
          🔴 Critical
        </span>
      );
    }
    if (sev === 'High') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[11px] font-mono font-bold whitespace-nowrap">
          🟠 High
        </span>
      );
    }
    if (sev === 'Medium') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold whitespace-nowrap">
          🟡 Medium
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold whitespace-nowrap">
        🟢 Closed
      </span>
    );
  };

  const renderTrackerStatusBadge = (st: ActionTrackerRow['status']) => {
    if (st === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
          <span>🟢</span>
          <span>Completed</span>
        </span>
      );
    }
    if (st === 'overdue') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold">
          <span>🔴</span>
          <span>Overdue</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
        <span>🟡</span>
        <span>In Progress</span>
      </span>
    );
  };

  // SVG Donut Pie Math for P2 Root Cause Pie (r = 15.9155 => circumference = 100)
  const pieSegments = useMemo(() => {
    let cumulative = 0;
    return viewData.p2Panel.rootCausePie.map((seg) => {
      const startOffset = 25 - cumulative;
      cumulative += seg.pct;
      return {
        ...seg,
        dashArray: `${seg.pct} ${100 - seg.pct}`,
        dashOffset: startOffset,
      };
    });
  }, [viewData.p2Panel.rootCausePie]);

  const maxTrendVal = Math.max(...viewData.p1Panel.trend.map((t) => t.valLakhs), 1);

  return (
    <section
      className={`rounded-2xl border p-3.5 sm:p-6 space-y-6 shadow-2xl ${
        isDarkMode
          ? 'bg-neutral-900 border-amber-500/40 text-neutral-100'
          : 'bg-white border-amber-400 text-neutral-900'
      }`}
    >
      {/* ===================================================================== */}
      {/* HEADER: MANUFACTURING COMMAND CENTER                                  */}
      {/* ===================================================================== */}
      <div className="rounded-2xl bg-neutral-950 border border-amber-500/40 p-4 sm:p-5 space-y-4 shadow-lg">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-mono uppercase font-black tracking-wider">
                P5 • Executive Operations Control Tower
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-[10px] font-mono font-bold">
                CEO Monday Briefing Engine · &lt;3 Min Review
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white uppercase">
              Manufacturing Command Center
            </h2>
            <p className="text-xs text-neutral-400">
              Single-screen command deck for Plant Head, COO &amp; Factory Owner — every KPI mapped to Financial Impact, Accountable Owner &amp; Deadline.
            </p>
          </div>

          {/* Controls: Data Profile + Quick Exports */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 no-print">
            {/* Benchmark vs Live Sync Pill Toggle */}
            <div className="inline-flex rounded-xl bg-neutral-900 p-1 border border-neutral-800">
              <button
                onClick={() => setDataSourceMode('chennai_benchmark')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition ${
                  dataSourceMode === 'chennai_benchmark'
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Chennai Plant (W46)
              </button>
              <button
                onClick={() => setDataSourceMode('live_sync')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition flex items-center justify-center gap-1 ${
                  dataSourceMode === 'live_sync'
                    ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <RefreshCw className="w-3 h-3" />
                <span>Live P1–P4 Sync</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setIsCrossSyncModalOpen(true)}
                className="min-h-[44px] sm:min-h-0 px-2.5 sm:px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm border border-indigo-400/40 touch-manipulation active:scale-[0.98]"
                title="Open Unified Cross-Engine Sync Report Snapshot (P1: Dead Stock, P2: OTIF, P3: Freight Leaks, P4: Bin Accuracy, P5: Debtors)"
              >
                <Layers className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="whitespace-nowrap">Cross-Engine Sync</span>
              </button>
              <button
                onClick={handleCopyCEOBriefing}
                className="min-h-[44px] sm:min-h-0 px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition touch-manipulation active:scale-[0.98]"
              >
                {copiedBrief ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                <span>{copiedBrief ? 'Copied!' : 'Copy Brief'}</span>
              </button>
              <button
                onClick={() => downloadCommandCenterWorkbook(dataSourceMode === 'chennai_benchmark')}
                className="min-h-[44px] sm:min-h-0 px-2.5 sm:px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition touch-manipulation active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => window.print()}
                className="min-h-[44px] sm:min-h-0 px-2.5 sm:px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition touch-manipulation active:scale-[0.98]"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>

        {crossSyncNotification && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{crossSyncNotification}</span>
          </div>
        )}

        {/* 4-Pillar Metadata Strip: Plant | Week | Overall Health Score | Last Updated */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 font-mono">
          <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase text-neutral-400">Plant</div>
              <div className="text-xs sm:text-sm font-black text-white truncate">{viewData.plant}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase text-neutral-400">Week</div>
              <div className="text-xs sm:text-sm font-black text-white truncate">{viewData.week}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/90 border border-amber-500/40 flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase text-amber-300">Overall Health Score</div>
              <div className="text-sm sm:text-base font-black text-white">
                {viewData.healthScore}/100 <span>{viewData.healthEmoji}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-fuchsia-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase text-neutral-400">Last Updated</div>
              <div className="text-xs sm:text-sm font-black text-white truncate">{viewData.lastUpdated}</div>
            </div>
          </div>
        </div>

        {/* Sub-view Switcher (Single-Screen Command Center is Primary Default) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 no-print">
          <button
            onClick={() => setActiveView('command_center')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeView === 'command_center'
                ? 'bg-amber-500 text-neutral-950'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Single-Screen Command Center</span>
          </button>
          <button
            onClick={() => setActiveView('top10_kpis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeView === 'top10_kpis'
                ? 'bg-amber-500 text-neutral-950'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Top 10 Executive KPIs</span>
          </button>
          <button
            onClick={() => setActiveView('mbr_pack')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeView === 'mbr_pack'
                ? 'bg-indigo-500 text-white'
                : 'bg-neutral-900 text-indigo-300 hover:text-white border border-neutral-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Monthly Business Review (MBR)</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PRIMARY SINGLE-SCREEN 3-MINUTE COMMAND CENTER LAYOUT                  */}
      {/* ===================================================================== */}
      {activeView === 'command_center' && (
        <div className="space-y-6">
          {/* ----------------------------------------------------------------- */}
          {/* ROW 1: EXECUTIVE KPI CARDS (4 Large Cards Across Top)             */}
          {/* ----------------------------------------------------------------- */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-mono uppercase font-black tracking-wider text-amber-400">
                Row 1 · Executive KPI Cards
              </span>
              <span className="font-mono text-[11px] text-neutral-400">
                Sources: Cash → P1 · Revenue → P2 · Profit → P3 · Inventory → P4
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {viewData.kpiCards.map((card) => (
                <div
                  key={card.title}
                  onClick={() => handleEngineClick(card.key)}
                  className={`rounded-2xl bg-neutral-950 border-2 ${card.borderCls} p-4 sm:p-5 cursor-pointer transition flex flex-col justify-between min-h-[132px] shadow-md group`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-mono text-xs sm:text-sm font-black tracking-wider text-neutral-300">
                      {card.title}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 group-hover:text-amber-300 transition">
                      {card.sourceLabel} ➔
                    </span>
                  </div>

                  <div className="my-2">
                    <div className="text-xl sm:text-3xl font-black font-mono text-white tracking-tight leading-tight">
                      {card.value}
                    </div>
                    <div className="text-xs text-neutral-400 font-medium mt-0.5">{card.subtitle}</div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                    <span
                      className={`px-2.5 py-0.5 rounded-md border text-[11px] font-mono font-bold ${card.badgeCls}`}
                    >
                      {card.statusLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* ROW 2: TOP 5 PRIORITIES (What · Impact · Owner · Due Date)        */}
          {/* ----------------------------------------------------------------- */}
          <div className="rounded-2xl bg-neutral-950 border border-neutral-800 p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <div className="text-xs font-mono uppercase font-black text-rose-400">
                  Row 2 · Top 5 Priorities (Weekly Leadership Focus)
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Immediate clarity on <strong>What · Impact · Owner · Due Date</strong>. Click any severity badge to update status.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  🔴 Critical
                </span>
                <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30">
                  🟠 High
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  🟡 Medium
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  🟢 Closed
                </span>
              </div>
            </div>

            {/* Mobile Stacked Cards (<768px) */}
            <div className="grid grid-cols-1 gap-2.5 md:hidden">
              {viewData.priorities.map((row) => (
                <div
                  key={row.id}
                  className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-neutral-950 font-mono text-xs font-black">
                      #{row.rank}
                    </span>
                    <button
                      onClick={() =>
                        dataSourceMode === 'chennai_benchmark' && cyclePrioritySeverity(row.id)
                      }
                      className="cursor-pointer"
                    >
                      {renderPriorityBadge(row.severity)}
                    </button>
                  </div>
                  <div
                    onClick={() => handleEngineClick(row.engine)}
                    className="text-sm font-bold text-white cursor-pointer hover:text-amber-300"
                  >
                    {row.issue}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-neutral-800">
                    <div>
                      <div className="text-neutral-500 font-mono text-[9px] uppercase">Impact</div>
                      <div className="font-semibold text-amber-300">{row.impact}</div>
                    </div>
                    <div>
                      <div className="text-neutral-500 font-mono text-[9px] uppercase">Owner</div>
                      <div className="font-semibold text-neutral-200">{row.owner}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-neutral-500 font-mono text-[9px] uppercase">Due Date</div>
                      <div className="font-mono font-bold text-white">{row.dueDate}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Full Executive Table (>=768px) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-neutral-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-900 text-neutral-400 font-mono text-[10px] uppercase border-b border-neutral-800">
                  <tr>
                    <th className="py-2.5 px-3.5">Priority</th>
                    <th className="py-2.5 px-3.5">Issue</th>
                    <th className="py-2.5 px-3.5">Impact</th>
                    <th className="py-2.5 px-3.5">Owner</th>
                    <th className="py-2.5 px-3.5">Due Date</th>
                    <th className="py-2.5 px-3.5 text-right">Engine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {viewData.priorities.map((row) => (
                    <tr key={row.id} className="hover:bg-neutral-900/60 transition">
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-amber-500 text-neutral-950 font-mono font-black flex items-center justify-center text-xs">
                            #{row.rank}
                          </span>
                          <button
                            onClick={() =>
                              dataSourceMode === 'chennai_benchmark' && cyclePrioritySeverity(row.id)
                            }
                            className="cursor-pointer"
                            title="Click to cycle severity / Closed"
                          >
                            {renderPriorityBadge(row.severity)}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-bold text-white text-sm">{row.issue}</td>
                      <td className="py-3 px-3.5">
                        <span className="px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-700 font-mono font-semibold text-amber-300">
                          {row.impact}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-neutral-200">{row.owner}</td>
                      <td className="py-3 px-3.5 font-mono font-bold text-white whitespace-nowrap">
                        {row.dueDate}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleEngineClick(row.engine)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 font-mono text-[11px] text-amber-300 cursor-pointer"
                        >
                          {row.engine.toUpperCase()} ➔
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* ROW 3: ACTION TRACKER (KPI Strip + Detailed Accountability Table) */}
          {/* ----------------------------------------------------------------- */}
          <div className="rounded-2xl bg-neutral-950 border border-neutral-800 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <div className="text-xs font-mono uppercase font-black text-emerald-400">
                  Row 3 · Action Tracker
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Click any row&apos;s status pill to toggle <strong>🟡 In Progress · 🔴 Overdue · 🟢 Completed</strong>.
                </p>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                Weekly Execution Accountability
              </span>
            </div>

            {/* 4-Metric Action Tracker Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="text-[10px] uppercase text-neutral-400">Open Actions</div>
                <div className="text-2xl font-black text-amber-300 mt-1">
                  {viewData.trackerStats.openActions}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-rose-500/30">
                <div className="text-[10px] uppercase text-rose-300">Overdue Actions</div>
                <div className="text-2xl font-black text-rose-400 mt-1">
                  {viewData.trackerStats.overdueActions}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-emerald-500/30">
                <div className="text-[10px] uppercase text-emerald-300">Completed This Week</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {viewData.trackerStats.completedThisWeek}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-cyan-500/30">
                <div className="text-[10px] uppercase text-cyan-300">Closure Rate</div>
                <div className="text-2xl font-black text-white mt-1">
                  {viewData.trackerStats.closureRate}%
                </div>
              </div>
            </div>

            {/* Detailed Action Table (Responsive) */}
            <div className="overflow-x-auto touch-pan-x rounded-xl border border-neutral-800">
              <table className="w-full text-left text-xs min-w-[480px]">
                <thead className="bg-neutral-900 text-neutral-400 font-mono text-[10px] uppercase border-b border-neutral-800">
                  <tr>
                    <th className="py-2.5 px-3.5">Action</th>
                    <th className="py-2.5 px-3.5">Owner</th>
                    <th className="py-2.5 px-3.5">Due Date</th>
                    <th className="py-2.5 px-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {trackerRows.map((tr) => (
                    <tr key={tr.id} className="hover:bg-neutral-900/60 transition">
                      <td className="py-2.5 px-3.5 font-bold text-white">{tr.action}</td>
                      <td className="py-2.5 px-3.5 text-neutral-300 font-medium">{tr.owner}</td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-neutral-200">{tr.dueDate}</td>
                      <td className="py-2.5 px-3.5 text-right">
                        <button
                          onClick={() => cycleTrackerStatus(tr.id)}
                          className="cursor-pointer"
                          title="Click to cycle status"
                        >
                          {renderTrackerStatusBadge(tr.status)}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Add Floor Directive */}
            <form
              onSubmit={handleAddTrackerRow}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 no-print"
            >
              <input
                type="text"
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                placeholder="Add Monday directive (e.g. 'Audit XYZ Transport LR bills')..."
                className="sm:col-span-6 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                value={newActionOwner}
                onChange={(e) => setNewActionOwner(e.target.value)}
                placeholder="Owner"
                className="sm:col-span-3 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                value={newActionDue}
                onChange={(e) => setNewActionDue(e.target.value)}
                placeholder="Due (e.g. 29 Nov)"
                className="sm:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="sm:col-span-2 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Action</span>
              </button>
            </form>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* ROW 4: DEPARTMENT SCORECARDS (6 Departments + Scoring Logic)      */}
          {/* ----------------------------------------------------------------- */}
          <div className="rounded-2xl bg-neutral-950 border border-neutral-800 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <div className="text-xs font-mono uppercase font-black text-indigo-400">
                  Row 4 · Department Scorecards (Department Performance)
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Accountable functional health across all 6 plant execution pillars.
                </p>
              </div>
              {/* Explicit Scoring Logic Legend */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/40">
                  100 = World Class
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  90+ = Excellent
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  80–89 = Good
                </span>
                <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30">
                  70–79 = Needs Action
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  &lt;70 = Critical
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {viewData.departments.map((dept) => {
                const bandMeta = getScoreBandLabel(dept.score);
                return (
                  <div
                    key={dept.name}
                    onClick={() => handleEngineClick(dept.engine)}
                    className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 cursor-pointer transition space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-bold text-white">{dept.name}</span>
                      <span className="font-mono text-xs font-bold flex items-center gap-1.5">
                        <span className={`text-[11px] ${bandMeta.textCls}`}>{dept.band}</span>
                        <span>{dept.dot}</span>
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between font-mono">
                      <div className="text-2xl font-black text-white">
                        {dept.score}
                        <span className="text-xs text-neutral-500 font-normal">/100</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          dept.dot === '🟢'
                            ? 'bg-emerald-500'
                            : dept.dot === '🟡'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${dept.score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* 4 ENGINE DEEP-DIVE PANELS (P1, P2, P3, P4 — 2x2 Quadrant Grid)    */}
          {/* ----------------------------------------------------------------- */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* ==================== P1 PANEL: CASH RECOVERY ENGINE ==================== */}
            <div className="rounded-2xl bg-neutral-950 border border-amber-500/40 p-4 sm:p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-black text-amber-400">
                      P1 Panel · Cash Pillar
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Cash Recovery Engine
                    </h3>
                  </div>
                  <button
                    onClick={() => handleEngineClick('p1')}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open P1</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 4 KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {viewData.p1Panel.kpis.map((k) => (
                    <div key={k.label} className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                      <div className="text-[10px] text-neutral-400 leading-tight">{k.label}</div>
                      <div className="text-base sm:text-lg font-black font-mono text-amber-300 mt-1">
                        {k.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top Dead Inventory Table */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono uppercase font-bold text-neutral-300">
                    Top Dead Inventory
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-neutral-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-900 text-neutral-400 font-mono text-[10px] uppercase border-b border-neutral-800">
                        <tr>
                          <th className="py-2 px-3">SKU</th>
                          <th className="py-2 px-3">Value</th>
                          <th className="py-2 px-3">Owner</th>
                          <th className="py-2 px-3 text-right">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/70">
                        {viewData.p1Panel.topItems.map((it) => (
                          <tr key={it.sku}>
                            <td className="py-2 px-3 font-bold text-white">{it.sku}</td>
                            <td className="py-2 px-3 font-mono font-bold text-rose-300">{it.value}</td>
                            <td className="py-2 px-3 text-neutral-300">{it.owner}</td>
                            <td className="py-2 px-3 text-right font-mono text-neutral-200">{it.dueDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 5-Month Dead Stock Trend Chart (Green trend = success) */}
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-emerald-300 uppercase text-[11px]">
                    Trend Chart · Dead Stock (Jul → Nov)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    🟢 Downward Trend = Cash Unlocked
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2 items-end h-28 pt-3">
                  {viewData.p1Panel.trend.map((pt) => (
                    <div key={pt.month} className="flex flex-col items-center justify-end h-full gap-1">
                      <span className="text-[10px] font-mono font-bold text-emerald-300">{pt.label}</span>
                      <div
                        className="w-full max-w-[42px] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all"
                        style={{
                          height: `${Math.max(18, Math.round((pt.valLakhs / maxTrendVal) * 100))}%`,
                        }}
                      />
                      <span className="text-[10px] font-mono text-neutral-400">{pt.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ==================== P2 PANEL: CUSTOMER PROMISE RELIABILITY ENGINE ==================== */}
            <div className="rounded-2xl bg-neutral-950 border border-emerald-500/40 p-4 sm:p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-black text-emerald-400">
                      P2 Panel · Revenue Pillar
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Customer Promise Reliability Engine
                    </h3>
                  </div>
                  <button
                    onClick={() => handleEngineClick('p2')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open P2</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 4 KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {viewData.p2Panel.kpis.map((k) => (
                    <div key={k.label} className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                      <div className="text-[10px] text-neutral-400 leading-tight">{k.label}</div>
                      <div className="text-base sm:text-lg font-black font-mono text-emerald-300 mt-1">
                        {k.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top Customers At Risk */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono uppercase font-bold text-neutral-300">
                    Top Customers At Risk
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-neutral-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-900 text-neutral-400 font-mono text-[10px] uppercase border-b border-neutral-800">
                        <tr>
                          <th className="py-2 px-3">Customer</th>
                          <th className="py-2 px-3">OTIF</th>
                          <th className="py-2 px-3">Owner</th>
                          <th className="py-2 px-3 text-right">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/70">
                        {viewData.p2Panel.topCustomers.map((c) => (
                          <tr key={c.customer}>
                            <td className="py-2 px-3 font-bold text-white">{c.customer}</td>
                            <td className="py-2 px-3 font-mono font-bold text-rose-400">{c.otif}</td>
                            <td className="py-2 px-3 text-neutral-300">{c.owner}</td>
                            <td className="py-2 px-3 text-right font-mono text-neutral-200">{c.dueDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Root Cause Pie (SVG Donut + Breakdown) */}
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2.5">
                <div className="text-[11px] font-mono uppercase font-bold text-emerald-300">
                  Root Cause Pie (OTIF Failure Drivers)
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-24 h-24 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-24 h-24">
                      <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#171717" strokeWidth="5" />
                      {pieSegments.map((seg) => (
                        <circle
                          key={seg.label}
                          cx="18"
                          cy="18"
                          r="15.9155"
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth="5"
                          strokeDasharray={seg.dashArray}
                          strokeDashoffset={seg.dashOffset}
                        />
                      ))}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-black text-white">
                      100%
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 w-full text-xs">
                    {viewData.p2Panel.rootCausePie.map((seg) => (
                      <div
                        key={seg.label}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-neutral-950 border border-neutral-800"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: seg.color }}
                          />
                          <span className="text-neutral-200 truncate">{seg.label}</span>
                        </div>
                        <span className="font-mono font-black text-white">{seg.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ==================== P3 PANEL: PROFIT PROTECTION ENGINE ==================== */}
            <div className="rounded-2xl bg-neutral-950 border border-cyan-500/40 p-4 sm:p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-black text-cyan-400">
                      P3 Panel · Profit Pillar
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Profit Protection Engine
                    </h3>
                  </div>
                  <button
                    onClick={() => handleEngineClick('p3')}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open P3</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 4 KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {viewData.p3Panel.kpis.map((k) => (
                    <div key={k.label} className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                      <div className="text-[10px] text-neutral-400 leading-tight">{k.label}</div>
                      <div className="text-base sm:text-lg font-black font-mono text-cyan-300 mt-1">
                        {k.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top Freight Leakages */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono uppercase font-bold text-neutral-300">
                    Top Freight Leakages
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-neutral-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-900 text-neutral-400 font-mono text-[10px] uppercase border-b border-neutral-800">
                        <tr>
                          <th className="py-2 px-3">Route</th>
                          <th className="py-2 px-3">Leakage</th>
                          <th className="py-2 px-3">Owner</th>
                          <th className="py-2 px-3 text-right">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/70">
                        {viewData.p3Panel.topRoutes.map((rt) => (
                          <tr key={rt.route}>
                            <td className="py-2 px-3 font-bold text-white">{rt.route}</td>
                            <td className="py-2 px-3 font-mono font-bold text-rose-300">{rt.leakage}</td>
                            <td className="py-2 px-3 text-neutral-300">{rt.owner}</td>
                            <td className="py-2 px-3 text-right font-mono text-neutral-200">{rt.dueDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Carrier Performance */}
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2.5">
                <div className="text-[11px] font-mono uppercase font-bold text-cyan-300">
                  Carrier Performance Scorecard
                </div>
                <div className="space-y-2">
                  {viewData.p3Panel.carriers.map((c) => (
                    <div key={c.carrier} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-sans font-bold text-white">{c.carrier}</span>
                        <span className={c.critical ? 'text-rose-400 font-black' : 'text-emerald-300 font-black'}>
                          {c.score} {c.critical ? '🔴' : '🟢'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${c.critical ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${c.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ==================== P4 PANEL: WAREHOUSE RELIABILITY ENGINE ==================== */}
            <div className="rounded-2xl bg-neutral-950 border border-fuchsia-500/40 p-4 sm:p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-black text-fuchsia-400">
                      P4 Panel · Inventory Trust Pillar
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Warehouse Reliability Engine
                    </h3>
                  </div>
                  <button
                    onClick={() => handleEngineClick('p4')}
                    className="px-2.5 py-1.5 rounded-lg bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-500/40 text-fuchsia-300 font-mono text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open P4</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 4 KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {viewData.p4Panel.kpis.map((k) => (
                    <div key={k.label} className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                      <div className="text-[10px] text-neutral-400 leading-tight">{k.label}</div>
                      <div className="text-base sm:text-lg font-black font-mono text-fuchsia-300 mt-1">
                        {k.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top Variances */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono uppercase font-bold text-neutral-300">
                    Top Variances
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-neutral-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-900 text-neutral-400 font-mono text-[10px] uppercase border-b border-neutral-800">
                        <tr>
                          <th className="py-2 px-3">Bin</th>
                          <th className="py-2 px-3">Impact</th>
                          <th className="py-2 px-3">Owner</th>
                          <th className="py-2 px-3 text-right">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/70">
                        {viewData.p4Panel.topVariances.map((v) => (
                          <tr key={v.bin}>
                            <td className="py-2 px-3 font-mono font-black text-white">{v.bin}</td>
                            <td className="py-2 px-3 font-mono font-bold text-rose-300">{v.impact}</td>
                            <td className="py-2 px-3 text-neutral-300">{v.owner}</td>
                            <td className="py-2 px-3 text-right font-mono text-neutral-200">{v.dueDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Warehouse Zone Heatmap */}
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2.5">
                <div className="text-[11px] font-mono uppercase font-bold text-fuchsia-300">
                  Warehouse Zone Heatmap
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {viewData.p4Panel.zones.map((z) => (
                    <div
                      key={z.zone}
                      className={`p-2.5 rounded-xl border text-center space-y-0.5 ${
                        z.dot === '🟢'
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : z.dot === '🔴'
                          ? 'bg-rose-500/15 border-rose-500/40'
                          : 'bg-amber-500/10 border-amber-500/30'
                      }`}
                    >
                      <div className="font-mono font-black text-xs text-white">
                        {z.zone} {z.dot}
                      </div>
                      <div className="text-[10px] text-neutral-300">{z.state}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* BOTTOM: AI CEO MONDAY SUMMARY + OWNERSHIP MATRIX + DUE DATE RULES */}
          {/* ----------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* AI-Generated CEO Monday Summary */}
            <div className="lg:col-span-7 rounded-2xl bg-gradient-to-br from-neutral-950 via-neutral-950 to-amber-950/20 border border-amber-500/40 p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-[10px] font-mono uppercase font-black text-amber-400">
                        AI-Generated Executive Synthesis
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white">
                        CEO MONDAY BRIEFING
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyCEOBriefing}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black flex items-center gap-1.5 cursor-pointer transition no-print"
                  >
                    {copiedBrief ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBrief ? 'Copied for WhatsApp!' : 'Copy CEO Summary'}</span>
                  </button>
                </div>

                <ol className="space-y-2.5 text-xs sm:text-sm text-neutral-200 list-decimal list-inside">
                  {viewData.aiSummary.points.map((pt, idx) => (
                    <li key={idx} className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 leading-relaxed">
                      <span className="font-medium">{pt}</span>
                    </li>
                  ))}
                  <li className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                    <span className="font-black text-emerald-300">Recommended Focus This Week:</span>
                    <ul className="space-y-1.5 pl-4 pt-1">
                      {viewData.aiSummary.focusBullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-xs sm:text-sm text-white">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ol>
              </div>
            </div>

            {/* Ownership Matrix + Recommended Due Date Rules */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              {/* Ownership & Escalation Matrix */}
              <div className="rounded-2xl bg-neutral-950 border border-neutral-800 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase font-black text-indigo-400">
                    Ownership &amp; Escalation Matrix
                  </span>
                  <ShieldAlert className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="overflow-x-auto rounded-xl border border-neutral-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-900 text-neutral-400 font-mono text-[10px] uppercase border-b border-neutral-800">
                      <tr>
                        <th className="py-2 px-3">Area</th>
                        <th className="py-2 px-3">Primary Owner</th>
                        <th className="py-2 px-3">Escalation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/70">
                      {OWNERSHIP_ESCALATION_MATRIX.map((row) => (
                        <tr
                          key={row.area}
                          onClick={() => handleEngineClick(row.engine)}
                          className="hover:bg-neutral-900/60 cursor-pointer transition"
                        >
                          <td className="py-2 px-3 font-bold text-amber-300 whitespace-nowrap">{row.area}</td>
                          <td className="py-2 px-3 text-white font-medium">{row.primaryOwner}</td>
                          <td className="py-2 px-3 font-mono text-rose-300 font-semibold whitespace-nowrap">
                            {row.escalation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommended Due Date Rules */}
              <div className="rounded-2xl bg-neutral-950 border border-neutral-800 p-4 sm:p-5 space-y-3">
                <div className="text-xs font-mono uppercase font-black text-amber-400">
                  Recommended Due Date Rules (SLA Governance)
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {DUE_DATE_RULES.map((r) => (
                    <div
                      key={r.severity}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 font-mono text-xs ${r.cls}`}
                    >
                      <span className="font-bold">{r.severity}</span>
                      <span className="font-black text-white">{r.dueWindow}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECONDARY VIEW: TOP 10 FOCUSED EXECUTIVE KPIs                         */}
      {/* ===================================================================== */}
      {activeView === 'top10_kpis' && (
        <div className="space-y-3">
          <div className="text-xs text-neutral-400">
            Strictly capped at the <strong>Top 10 Executive KPIs</strong> across Cash, Revenue, Profit, Inventory Trust &amp; Governance.
          </div>
          <div className="overflow-x-auto touch-pan-x rounded-xl border border-neutral-800 bg-neutral-950">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-neutral-900 text-neutral-400 font-mono text-[10px] uppercase border-b border-neutral-800">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Pillar</th>
                  <th className="py-2.5 px-3">Executive KPI</th>
                  <th className="py-2.5 px-3 text-right">Value</th>
                  <th className="py-2.5 px-3">Executive Context</th>
                  <th className="py-2.5 px-3">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70">
                {top10KPIs.map((row) => (
                  <tr
                    key={row.num}
                    onClick={() => handleEngineClick(row.engine)}
                    className="hover:bg-neutral-900/70 cursor-pointer transition"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-neutral-500">{row.num}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-300 whitespace-nowrap">
                      {row.pillar}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">{row.kpi}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-white whitespace-nowrap">
                      {row.value}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-300">{row.meaning}</td>
                    <td className="py-2.5 px-3 font-semibold text-neutral-200 whitespace-nowrap">
                      {row.owner}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECONDARY VIEW: AUTO-GENERATED MONTHLY BUSINESS REVIEW (MBR) DECK     */}
      {/* ===================================================================== */}
      {activeView === 'mbr_pack' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono uppercase font-bold text-indigo-300">
                Auto-Generated Board Presentation Deck • {viewData.plant}
              </div>
              <h3 className="text-base font-black text-white">
                Monthly Business Review (MBR) — {viewData.week}
              </h3>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer no-print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save Board Deck PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-4 space-y-3">
              <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                Slide 01 · Plant Health &amp; 4-Pillar Value Pool
              </div>
              <div className="text-lg font-black text-white">
                Overall Health Score: {viewData.healthScore}/100 {viewData.healthEmoji}
              </div>
              <ul className="space-y-2 text-xs text-neutral-300">
                <li className="flex justify-between border-b border-neutral-800 pb-1.5">
                  <span>1. Cash Locked in Dead Stock (P1):</span>
                  <strong className="font-mono text-amber-300">{viewData.p1Panel.kpis[0].value}</strong>
                </li>
                <li className="flex justify-between border-b border-neutral-800 pb-1.5">
                  <span>2. Revenue At Risk from OTIF Delays (P2):</span>
                  <strong className="font-mono text-emerald-300">{viewData.p2Panel.kpis[3].value}</strong>
                </li>
                <li className="flex justify-between border-b border-neutral-800 pb-1.5">
                  <span>3. Freight Leakage Detected (P3):</span>
                  <strong className="font-mono text-cyan-300">{viewData.p3Panel.kpis[1].value}</strong>
                </li>
                <li className="flex justify-between">
                  <span>4. Warehouse Variance Exposure (P4):</span>
                  <strong className="font-mono text-fuchsia-300">{viewData.p4Panel.kpis[1].value}</strong>
                </li>
              </ul>
            </div>

            <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-4 space-y-3">
              <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                Slide 02 · Top 5 Leadership Decisions &amp; Owners
              </div>
              <div className="text-lg font-black text-white">
                Closure Velocity: {viewData.trackerStats.closureRate}% ({viewData.trackerStats.completedThisWeek} Completed)
              </div>
              <div className="space-y-2 text-xs">
                {viewData.priorities.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-1.5"
                  >
                    <span className="text-neutral-200 truncate">
                      <strong>#{p.rank}</strong> {p.issue}
                    </span>
                    <span className="font-mono text-[11px] text-amber-300 shrink-0">
                      {p.owner} · {p.dueDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Cross-Engine Sync Report Modal (P1–P5) */}
      <CrossEngineSyncReportModal
        isOpen={isCrossSyncModalOpen}
        onClose={() => setIsCrossSyncModalOpen(false)}
        metrics={liveSuite}
        towerData={towerData}
        activePlant={activePlant}
        activePeriod={activePeriod}
        onApplyToBriefing={handleApplyCrossEngineSync}
        onJumpToEngine={(eng) => {
          if (eng === 'p5') {
            setActiveView('command_center');
          } else {
            handleEngineClick(eng);
          }
        }}
      />
    </section>
  );
};

