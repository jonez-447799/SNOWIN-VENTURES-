/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { evaluateStockEngine } from '../project1/utils/calculations';
import { StockItem } from '../project1/types';
import { calculateRowStatus } from '../project2/utils/otifCalculator';
import { DispatchRow } from '../project2/types/otif';
import { calculateAuditMetrics } from '../project3/utils/auditCalculations';
import { CalculatedTrip } from '../project3/types/freight';
import { calculateItemFields } from '../project4/utils/auditCalculations';
import { PlantConfig, PeriodConfig } from '../context/PlantContext';
import {
  PlantCapaItem,
  PlantBaselineDataset,
  readPlantDatasetFromBrowser,
  isValidPlantId,
} from '../data/multiPlantBaselines';

export type PlatformNavId =
  | 'overview'
  | 'inventory'
  | 'delivery'
  | 'profit_risk'
  | 'warehouse'
  | 'executive_reports'
  | 'data_imports'
  | 'actions'
  | 'administration';

export type RoleViewMode = 'executive' | 'dispatch_desk' | 'gate_kiosk';

export type OperationalStatus =
  | 'Critical'
  | 'Requires attention'
  | 'Monitoring'
  | 'Verified'
  | 'Incomplete';

export type ValueClassification =
  | 'Actual'
  | 'Calculated'
  | 'Estimate'
  | 'Scenario'
  | 'Assumption'
  | 'Unavailable';

export interface NavItemConfig {
  id: PlatformNavId;
  label: string;
  secondaryCode?: string;
  description: string;
  group: 'primary' | 'operations' | 'bottom';
}

export const DEMO_ENVIRONMENT_CONFIG = {
  badgeLabel: 'DEMONSTRATION ENVIRONMENT',
  organizationName: 'Illustrative Manufacturing Company',
  noticeText:
    'Each plant (Ambattur, Sriperumbudur, Hosur) is loaded with row-traceable ERP stock records for instant audit testing.',
  policyPendingNotice: 'Policy details governed under Operationalyst B2B Data Policy',
  lastRefreshDisplay: 'Multi-Plant Executive Workspace • Row-Traceable P1–P4 Data',
};

export const PLATFORM_NAVIGATION: NavItemConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Executive command view: what requires attention today, why it matters, and where to investigate.',
    group: 'primary',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    secondaryCode: 'P1 • Cash Recovery',
    description: 'Working capital exposure, non-moving SKU aging, and liquidation review.',
    group: 'primary',
  },
  {
    id: 'delivery',
    label: 'Delivery',
    secondaryCode: 'P2 • Customer Promise',
    description: 'On-time in-full (OTIF) delivery performance, Dual-Gate Rule breakdown, and dispatch risk.',
    group: 'primary',
  },
  {
    id: 'profit_risk',
    label: 'Profit & Risk',
    secondaryCode: 'P3 • Profit Protection',
    description: 'Freight rate variance, detention leakage, carrier audit, and financial scenario tools.',
    group: 'primary',
  },
  {
    id: 'warehouse',
    label: 'Warehouse',
    secondaryCode: 'P4 • Warehouse Trust',
    description: 'Physical vs system bin accuracy, cycle-count exceptions, and reconciliation status.',
    group: 'primary',
  },
  {
    id: 'executive_reports',
    label: 'Executive Reports',
    secondaryCode: 'P5 • CEO Briefing',
    description: 'Board-ready operational reviews, weekly management briefings, and multi-sheet workbooks.',
    group: 'operations',
  },
  {
    id: 'data_imports',
    label: 'Data & Imports',
    description: 'Tally Prime / ERP CSV ingestion, field mapping, validation checks, and import error logs.',
    group: 'operations',
  },
  {
    id: 'actions',
    label: 'Actions',
    description: 'Cross-functional investigation queue, 8D corrective actions, owners, and due dates.',
    group: 'operations',
  },
  {
    id: 'administration',
    label: 'Administration',
    description: 'Workspace controls, presentation lock, multi-device sync, and audit governance.',
    group: 'bottom',
  },
];

export interface MetricMethodology {
  id: string;
  name: string;
  domain: PlatformNavId;
  plainExplanation: string;
  formula: string;
  numeratorLabel: string;
  denominatorLabel: string;
  numeratorValue: string;
  denominatorValue: string;
  keyDefinitions: { term: string; definition: string }[];
  includedRecords: string;
  excludedRecords: string;
  dateRangeUsed: string;
  thresholdRule: string;
  dataSource: string;
  lastRefresh: string;
  knownLimitations: string[];
  recommendedInvestigationLabel: string;
  recommendedDomain: PlatformNavId;
}

export interface PriorityAttentionItem {
  id: string;
  rank: number;
  domain: PlatformNavId;
  domainLabel: string;
  secondaryCode: string;
  status: OperationalStatus;
  title: string;
  currentValue: string;
  targetValue: string;
  changeLabel: string;
  whyItMatters: string;
  primaryActionLabel: string;
  supportingRecordsCount: number;
  metricId: string;
}

export interface ExecutiveKPICardData {
  id: string;
  metricId: string;
  domain: PlatformNavId;
  name: string;
  status: OperationalStatus;
  valueDisplay: string;
  contextSubtext: string;
  targetDisplay: string;
  changeDisplay: string;
  changeDirection: 'up_bad' | 'down_bad' | 'up_good' | 'down_good' | 'neutral';
  periodLabel: string;
  interpretation: string;
  actionLabel: string;
}

export interface InvestigationQueueRow {
  id: string;
  priority: 'Critical' | 'Requires attention' | 'Monitoring' | 'Resolved';
  domain: PlatformNavId;
  domainLabel: string;
  signal: string;
  whyItMatters: string;
  evidenceCount: number;
  evidenceLabel: string;
  owner: string;
  dueDate: string;
  status: 'Open' | 'In progress' | 'Awaiting verification' | 'Resolved';
  recommendedInvestigation: string;
  metricId: string;
}

export interface DualGateBreakdown {
  totalDispatches: number;
  passedBoth: number;
  lateOnly: number;
  shortOnly: number;
  lateAndShort: number;
  failedTotal: number;
  otifPercent: number;
  targetPercent: number;
  revenueAtRiskFormatted: string;
  rows: DispatchRow[];
}

export interface NormalizedBinRecord {
  id: string;
  binLocation: string;
  skuCode: string;
  description: string;
  systemQty: number;
  physicalQty: number;
  qtyVariance: number;
  unitCost: number;
  absDiscrepancyValue: number;
}

export interface LivePlatformDataSnapshot {
  plant: PlantConfig;
  period: PeriodConfig;
  datasetLoaded: boolean;
  // Raw & computed P1
  p1Items: StockItem[];
  p1DeadValue: number;
  p1SlowValue: number;
  p1TotalValue: number;
  p1DeadPercent: number;
  p1DeadSkuCount: number;
  p1SlowSkuCount: number;
  p1TotalSkuCount: number;
  // Raw & computed P2
  p2Dispatches: DispatchRow[];
  p2DualGate: DualGateBreakdown;
  // Raw & computed P3
  p3CalculatedTrips: CalculatedTrip[];
  p3LeakageValue: number;
  p3TotalBilled: number;
  p3TotalContract: number;
  p3FlaggedTripCount: number;
  p3TotalTripCount: number;
  // Raw & computed P4
  p4Items: NormalizedBinRecord[];
  p4AccuracyPercent: number;
  p4MatchedCount: number;
  p4MismatchCount: number;
  p4TotalBins: number;
  p4VarianceAbsValue: number;
  // Plant-isolated CAPA items
  capaItems: PlantCapaItem[];
  // Synthesized Executive artifacts
  priorities: PriorityAttentionItem[];
  kpiStrip: ExecutiveKPICardData[];
  investigationQueue: InvestigationQueueRow[];
  methodologies: Record<string, MetricMethodology>;
  executiveBrief: {
    currentState: string;
    importantChange: string;
    likelyDriver: string;
    priorityInvestigation: string;
    dataLimitation: string;
  };
}

export function formatINRCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
}

export function formatINRFull(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}₹${Math.round(Math.abs(amount)).toLocaleString('en-IN')}`;
}

/**
 * Computes the complete live snapshot from plant-namespaced localStorage or the deterministic
 * multi-plant baseline (ambattur, sriperumbudur, hosur), ensuring 100% plant isolation across
 * Overview, Domain views, Methodology Drawer, and Reports.
 */
export function buildLivePlatformSnapshot(
  plant: PlantConfig,
  period: PeriodConfig,
  customDataset?: PlantBaselineDataset
): LivePlatformDataSnapshot {
  const datasetLoaded = isValidPlantId(plant.id);
  const plantDataset = customDataset || readPlantDatasetFromBrowser(plant.id);

  // 1. P1 Inventory Data (Plant-isolated)
  const p1Raw: StockItem[] = plantDataset.p1Items;
  const p1Rules = plantDataset.p1Rules;
  const p1Eval = evaluateStockEngine(p1Raw, p1Rules);
  const p1DeadItems = p1Eval.filter((i) => (i.daysIdle || 0) > 180);
  const p1SlowItems = p1Eval.filter((i) => {
    const d = i.daysIdle || 0;
    return d >= 90 && d <= 180;
  });

  const p1DeadValue = Math.round(
    p1DeadItems.reduce((s, i) => s + (i.closingValue || i.qtyOnHand * i.costRate), 0)
  );
  const p1SlowValue = Math.round(
    p1SlowItems.reduce((s, i) => s + (i.closingValue || i.qtyOnHand * i.costRate), 0)
  );
  const p1TotalValue = Math.round(
    p1Eval.reduce((s, i) => s + (i.closingValue || i.qtyOnHand * i.costRate), 0)
  );
  const p1DeadPercent = p1TotalValue > 0 ? Math.round((p1DeadValue / p1TotalValue) * 100) : 0;

  // 2. P2 Delivery / OTIF Data (Plant-isolated)
  const p2Dispatches: DispatchRow[] = plantDataset.p2Dispatches;
  const p2Rules = plantDataset.p2Rules;

  const p2CalculatedRows = p2Dispatches.map((d) => calculateRowStatus(d, p2Rules));

  let passedBoth = 0;
  let lateOnly = 0;
  let shortOnly = 0;
  let lateAndShort = 0;

  p2CalculatedRows.forEach((r) => {
    const isOnTime = Boolean(r.onTime);
    const isInFull = Boolean(r.inFull);
    if (r.otif) {
      passedBoth++;
    } else {
      if (!isOnTime && !isInFull) {
        lateAndShort++;
      } else if (!isOnTime && isInFull) {
        lateOnly++;
      } else if (isOnTime && !isInFull) {
        shortOnly++;
      }
    }
  });
  const totalDispatches = p2CalculatedRows.length;
  const failedTotal = totalDispatches - passedBoth;
  const otifPercent = totalDispatches > 0 ? Math.round((passedBoth / totalDispatches) * 100) : 0;

  const p2DualGate: DualGateBreakdown = {
    totalDispatches,
    passedBoth,
    lateOnly,
    shortOnly,
    lateAndShort,
    failedTotal,
    otifPercent,
    targetPercent: 95,
    revenueAtRiskFormatted:
      'Revenue exposure unavailable because order-value information was not provided.',
    rows: p2CalculatedRows,
  };

  // 3. P3 Profit & Risk (Freight Audit — Plant-isolated)
  const p3TripsRaw = plantDataset.p3Trips;
  const p3Rules = plantDataset.p3Rules;
  const p3Audit = calculateAuditMetrics(p3TripsRaw, p3Rules);
  const p3CalculatedTrips = p3Audit.calculatedTrips;
  const p3LeakageValue = Math.round(
    p3CalculatedTrips.reduce((s, t) => s + (t.totalLeak || 0), 0)
  );
  const p3TotalBilled = Math.round(
    p3CalculatedTrips.reduce((s, t) => s + (t.bill || 0), 0)
  );
  const p3TotalContract = Math.max(0, p3TotalBilled - p3LeakageValue);
  const p3FlaggedTripCount = p3CalculatedTrips.filter((t) => (t.totalLeak || 0) > 0).length;
  const p3TotalTripCount = p3CalculatedTrips.length;

  // 4. P4 Warehouse Trust (Bin Audit — Plant-isolated)
  const p4Raw = plantDataset.p4Bins;
  const p4Rules = plantDataset.p4Rules;
  const p4Items: NormalizedBinRecord[] = p4Raw.map((item) => {
    const calc = calculateItemFields(item, p4Rules);
    const variance = calc.gapQty || 0;
    const unitCost = Math.round(item.cost);
    return {
      id: item.id,
      binLocation: item.spot,
      skuCode: item.code,
      description: item.part,
      systemQty: item.systemQty,
      physicalQty: item.physicalQty,
      qtyVariance: variance,
      unitCost,
      absDiscrepancyValue: Math.abs(variance) * unitCost,
    };
  });
  const p4TotalBins = p4Items.length;
  const p4MatchedCount = p4Items.filter((i) => i.qtyVariance === 0).length;
  const p4MismatchCount = p4TotalBins - p4MatchedCount;
  const p4AccuracyPercent = p4TotalBins > 0 ? Math.round((p4MatchedCount / p4TotalBins) * 100) : 100;
  const p4VarianceAbsValue = p4Items.reduce((s, i) => s + i.absDiscrepancyValue, 0);

  // Build Methodologies Map for Right-Side Drawer
  const methodologies: Record<string, MetricMethodology> = {
    delivery_otif: {
      id: 'delivery_otif',
      name: 'Gate OTIF (On-Time In-Full)',
      domain: 'delivery',
      plainExplanation:
        'Measures the percentage of customer dispatch lines that left the factory gate both on or before the promised timestamp AND with 100% of the ordered quantity.',
      formula: 'Gate OTIF % = (Dispatches Passing Both Time & Quantity Gates ÷ Total Audited Dispatches) × 100',
      numeratorLabel: 'Dispatches passing both On-Time and In-Full gates',
      denominatorLabel: 'Total audited customer dispatch lines in period',
      numeratorValue: `${passedBoth} dispatch lines`,
      denominatorValue: `${totalDispatches} dispatch lines`,
      keyDefinitions: [
        {
          term: 'Dual-Gate Rule',
          definition:
            'A dispatch passes ONLY if Actual Gate-Out <= Promised Date/Time (within grace window) AND Dispatched Qty >= Ordered Qty.',
        },
        {
          term: 'Late Only',
          definition: 'Full quantity shipped, but vehicle exited the gate after promised cut-off.',
        },
        {
          term: 'Short Only',
          definition: 'Vehicle exited on time, but shipped quantity was below customer PO quantity.',
        },
      ],
      includedRecords: `All ${totalDispatches} scheduled OEM and Tier-1 customer dispatches recorded in ${period.label}.`,
      excludedRecords: 'Internal inter-unit stock transfers and cancelled customer POs prior to gate scheduling.',
      dateRangeUsed: period.dateRange,
      thresholdRule: 'Target >= 95% (Verified) | 60%–94% (Requires attention) | < 60% (Critical)',
      dataSource: 'Gate Register + ERP Dispatch Advice (Tally / SAP CSV)',
      lastRefresh: DEMO_ENVIRONMENT_CONFIG.lastRefreshDisplay,
      knownLimitations: [
        'Reflects factory gate-out timestamp, not final customer dock unloading time.',
        'Recorded delay reasons reflect dispatch desk logs and require supervisor verification.',
        'Order-value revenue exposure is unavailable unless unit prices or order values are explicitly provided.',
      ],
      recommendedInvestigationLabel: `Inspect ${failedTotal} failed dispatches in Delivery`,
      recommendedDomain: 'delivery',
    },
    inventory_exposure: {
      id: 'inventory_exposure',
      name: 'Inventory Requiring Review (>180 Days Non-Moving)',
      domain: 'inventory',
      plainExplanation:
        'Identifies raw materials, WIP, and finished goods SKUs that have recorded zero outward issue or dispatch movement for more than 180 consecutive days.',
      formula: 'Non-Moving Exposure = Σ (Closing Stock Qty × Valuation Rate) for SKUs with Days Since Last Issue > 180',
      numeratorLabel: 'Valuation of SKUs with >180 days since last movement',
      denominatorLabel: 'Total valued inventory across audited stores',
      numeratorValue: `${formatINRCompact(p1DeadValue)} (${p1DeadItems.length} SKUs)`,
      denominatorValue: `${formatINRCompact(p1TotalValue)} (${p1Eval.length} SKUs)`,
      keyDefinitions: [
        {
          term: 'Potentially Non-Moving (>180d)',
          definition: 'Items with no recorded outward consumption or sale in the last 180 days under current rules.',
        },
        {
          term: 'Slow-Moving (90–180d)',
          definition: 'Items with low turnover velocity (90 to 180 days idle) requiring reorder pause review.',
        },
        {
          term: 'Estimated Carrying Cost (22% p.a.)',
          definition: 'Modeled at a unified 22% annual cost of capital, storage, insurance, and obsolescence risk (Non-Moving Stock × 22%).',
        },
      ],
      includedRecords: `${p1Eval.length} active stock ledger items imported from Tally Stock Summary.`,
      excludedRecords: 'Zero-balance ledger items, consumable shop-floor supplies, and customer-owned free-issue material.',
      dateRangeUsed: period.dateRange,
      thresholdRule: 'Target < 5% of total stock value | 5%–15% (Requires attention) | > 15% (Critical)',
      dataSource: 'Tally Prime Stock Summary & Item Movement Register',
      lastRefresh: DEMO_ENVIRONMENT_CONFIG.lastRefreshDisplay,
      knownLimitations: [
        'Critical insurance spares or tooling may intentionally have zero movement for >180 days.',
        'Liquidation recovery figures are scenario estimates until buyer quotes are confirmed.',
      ],
      recommendedInvestigationLabel: 'Review top non-moving SKUs in Inventory',
      recommendedDomain: 'inventory',
    },
    profit_freight_variance: {
      id: 'profit_freight_variance',
      name: 'Freight & Margin Variance Exposure',
      domain: 'profit_risk',
      plainExplanation:
        'Measures the rupee gap between carrier-billed freight invoices (including unapproved detention, spot vehicle premiums, and weight discrepancies) and contracted rate-card baselines.',
      formula: 'Freight Variance = Σ (Transporter Billed Amount − Contracted Rate Card Base − Approved Extras)',
      numeratorLabel: 'Unapproved freight & detention variance across flagged trips',
      denominatorLabel: 'Total billed freight spend in period',
      numeratorValue: `${formatINRCompact(p3LeakageValue)} (${p3FlaggedTripCount} flagged trips)`,
      denominatorValue: `${formatINRCompact(p3TotalBilled)} (${p3TotalTripCount} total trips)`,
      keyDefinitions: [
        {
          term: 'Rate Card Overcharge',
          definition: 'Billed base freight exceeds the signed lane rate contract for the vehicle tonnage.',
        },
        {
          term: 'Detention Leakage',
          definition: 'Demurrage or holding charges billed without verified gate-in/gate-out waiting logs.',
        },
        {
          term: 'Spot Vehicle Premium',
          definition: 'Ad-hoc market vehicle hiring cost above contracted carrier rates, often triggered by late dispatch.',
        },
      ],
      includedRecords: `${p3TotalTripCount} outbound and inbound freight invoices audited in ${period.label}.`,
      excludedRecords: 'Customer-arranged ex-works pickups with zero factory freight liability.',
      dateRangeUsed: period.dateRange,
      thresholdRule: 'Target < ₹25,000 variance | ₹25,000–₹50,000 (Requires attention) | > ₹50,000 (Critical)',
      dataSource: 'Transporter Invoices + Approved Lane Rate Card Master',
      lastRefresh: DEMO_ENVIRONMENT_CONFIG.lastRefreshDisplay,
      knownLimitations: [
        'Emergency air/express expedite authorizations logged verbally may appear as rate variances until PO amendment.',
      ],
      recommendedInvestigationLabel: 'Audit flagged carrier bills in Profit & Risk',
      recommendedDomain: 'profit_risk',
    },
    warehouse_bin_accuracy: {
      id: 'warehouse_bin_accuracy',
      name: 'Warehouse Bin Reconciliation Accuracy',
      domain: 'warehouse',
      plainExplanation:
        'Compares physical cycle-count quantities in storage bins against system ERP book balances to detect phantom stock or unposted shop-floor issues.',
      formula: 'Bin Match % = (Bins with Zero Qty Variance ÷ Total Audited Bins) × 100',
      numeratorLabel: 'Storage bins where Physical Qty equals System ERP Qty',
      denominatorLabel: 'Total storage bins cycle-counted in period',
      numeratorValue: `${p4MatchedCount} matched bins`,
      denominatorValue: `${p4TotalBins} audited bins`,
      keyDefinitions: [
        {
          term: 'Phantom Inventory (Shortage)',
          definition: 'System shows stock available, but physical bin count is lower — high risk of sudden dispatch failure.',
        },
        {
          term: 'Unrecorded Surplus',
          definition: 'Physical bin has more units than ERP book stock, usually due to unposted GRNs or return notes.',
        },
      ],
      includedRecords: `${p4TotalBins} A-class and B-class storage bins verified during ${period.label}.`,
      excludedRecords: 'Quarantine/rejection cages and open shop-floor WIP staging areas.',
      dateRangeUsed: period.dateRange,
      thresholdRule: 'Target >= 98% (Verified) | 90%–97% (Requires attention) | < 90% (Critical)',
      dataSource: 'Physical Cycle Count Sheets + ERP Bin Balance Report',
      lastRefresh: DEMO_ENVIRONMENT_CONFIG.lastRefreshDisplay,
      knownLimitations: [
        'Point-in-time variances can occur if material was issued to production while voucher posting was pending.',
      ],
      recommendedInvestigationLabel: 'Verify mismatched storage bins in Warehouse',
      recommendedDomain: 'warehouse',
    },
    open_actions_governance: {
      id: 'open_actions_governance',
      name: 'Priority Investigations & Open Actions',
      domain: 'actions',
      plainExplanation:
        'Tracks cross-departmental operational exceptions assigned to Inventory, Dispatch, Logistics, and Stores owners with target resolution dates.',
      formula: 'Active Exception Queue = Critical Exceptions + Requires Attention Items Pending Verification',
      numeratorLabel: 'Open & in-progress priority investigations',
      denominatorLabel: 'Total tracked operational exceptions across domains',
      numeratorValue: '7 active investigations',
      denominatorValue: '9 total tracked items',
      keyDefinitions: [
        {
          term: 'Critical Priority',
          definition: 'Immediate customer delivery failure or high working-capital exposure requiring 72-hour review.',
        },
        {
          term: 'Awaiting Verification',
          definition: 'Corrective action reported by department owner, pending next cycle data confirmation.',
        },
      ],
      includedRecords: 'All exception records generated from Inventory, Delivery, Profit & Risk, and Warehouse audits.',
      excludedRecords: 'Archived historical actions closed in prior quarters.',
      dateRangeUsed: period.dateRange,
      thresholdRule: 'Zero overdue Critical items target',
      dataSource: 'Operationalyst Action & CAPA Ledger',
      lastRefresh: DEMO_ENVIRONMENT_CONFIG.lastRefreshDisplay,
      knownLimitations: [
        'Action status updates rely on owner sign-off and subsequent ERP data refresh.',
      ],
      recommendedInvestigationLabel: 'Open Action Queue',
      recommendedDomain: 'actions',
    },
  };

  // Build top 3 Priority Attention Cards (Maximum 3 in opening viewport)
  const priorities: PriorityAttentionItem[] = [
    {
      id: 'prio-delivery-otif',
      rank: 1,
      domain: 'delivery',
      domainLabel: 'Delivery',
      secondaryCode: 'P2 • Customer Promise',
      status: otifPercent < 60 ? 'Critical' : 'Requires attention',
      title: `Gate OTIF is at ${otifPercent}% (${passedBoth} of ${totalDispatches} dispatches passed)`,
      currentValue: `${otifPercent}% (${passedBoth}/${totalDispatches} passed)`,
      targetValue: '60% min threshold (95% SLA target)',
      changeLabel: 'Single-period snapshot',
      whyItMatters: `${failedTotal} customer dispatch lines failed the Dual-Gate Rule (${lateOnly} late only, ${shortOnly} short only, ${lateAndShort} both late & short), creating OEM line-stoppage and expedite risk.`,
      primaryActionLabel: `Inspect ${failedTotal} failed dispatches`,
      supportingRecordsCount: failedTotal,
      metricId: 'delivery_otif',
    },
    {
      id: 'prio-inventory-exposure',
      rank: 2,
      domain: 'inventory',
      domainLabel: 'Inventory',
      secondaryCode: 'P1 • Cash Recovery',
      status: p1DeadPercent > 20 ? 'Critical' : 'Requires attention',
      title: `${formatINRCompact(p1DeadValue)} in inventory has not moved in >180 days`,
      currentValue: `${formatINRCompact(p1DeadValue)} (${p1DeadItems.length} SKUs)`,
      targetValue: `< 5% of total stock (${formatINRCompact(p1TotalValue * 0.05)})`,
      changeLabel: `${p1DeadPercent}% of valued stock`,
      whyItMatters: `${p1DeadPercent}% of total valued inventory (${formatINRCompact(p1DeadValue)} of ${formatINRCompact(p1TotalValue)}) is sitting in items with zero recorded movement over 180 days, plus ${formatINRCompact(p1SlowValue)} in 90–180 day slow-moving stock.`,
      primaryActionLabel: `Review ${p1DeadItems.length} non-moving SKUs`,
      supportingRecordsCount: p1DeadItems.length + p1SlowItems.length,
      metricId: 'inventory_exposure',
    },
    {
      id: 'prio-profit-freight',
      rank: 3,
      domain: 'profit_risk',
      domainLabel: 'Profit & Risk',
      secondaryCode: 'P3 • Profit Protection',
      status: p3LeakageValue > 50000 ? 'Requires attention' : 'Monitoring',
      title: `${formatINRCompact(p3LeakageValue)} in billed freight & detention variance`,
      currentValue: `${formatINRCompact(p3LeakageValue)} (${p3FlaggedTripCount} trips)`,
      targetValue: '< ₹25,000 variance ceiling',
      changeLabel: `${p3FlaggedTripCount} of ${p3TotalTripCount} invoices flagged`,
      whyItMatters: `Carrier invoices exceed contracted lane rate cards and approved detention limits across ${p3FlaggedTripCount} audited trips, associated with unverified gate holding and spot vehicle premiums.`,
      primaryActionLabel: `Audit ${p3FlaggedTripCount} flagged carrier trips`,
      supportingRecordsCount: p3FlaggedTripCount,
      metricId: 'profit_freight_variance',
    },
  ];

  // Build 5-card Executive KPI Strip (Max 5 in a single row)
  const kpiStrip: ExecutiveKPICardData[] = [
    {
      id: 'kpi-inventory',
      metricId: 'inventory_exposure',
      domain: 'inventory',
      name: 'Non-Moving Inventory (>180d)',
      status: p1DeadPercent > 20 ? 'Critical' : 'Requires attention',
      valueDisplay: formatINRCompact(p1DeadValue),
      contextSubtext: `${p1DeadItems.length} of ${p1Eval.length} SKUs • ${p1DeadPercent}% of ${formatINRCompact(p1TotalValue)} total stock`,
      targetDisplay: '< 5% of stock',
      changeDisplay: 'Current snapshot',
      changeDirection: 'neutral',
      periodLabel: period.label,
      interpretation: 'Concentrated in A-class fabrication steel and legacy customer-specific tooling.',
      actionLabel: 'Inspect Inventory Aging',
    },
    {
      id: 'kpi-delivery',
      metricId: 'delivery_otif',
      domain: 'delivery',
      name: 'Customer Promise (Gate OTIF)',
      status: otifPercent < 60 ? 'Critical' : otifPercent < 95 ? 'Requires attention' : 'Verified',
      valueDisplay: `${otifPercent}% Gate OTIF`,
      contextSubtext: `${passedBoth} of ${totalDispatches} dispatch lines passed both gates`,
      targetDisplay: '95% SLA (60% min)',
      changeDisplay: 'Current snapshot',
      changeDirection: 'neutral',
      periodLabel: period.label,
      interpretation: `${lateOnly} failed on time only, ${shortOnly} failed on quantity only, and ${lateAndShort} failed both gates.`,
      actionLabel: 'View Dual-Gate Breakdown',
    },
    {
      id: 'kpi-profit',
      metricId: 'profit_freight_variance',
      domain: 'profit_risk',
      name: 'Freight & Margin Variance',
      status: p3LeakageValue > 50000 ? 'Requires attention' : 'Monitoring',
      valueDisplay: formatINRCompact(p3LeakageValue),
      contextSubtext: `${p3FlaggedTripCount} of ${p3TotalTripCount} audited trips above rate card`,
      targetDisplay: '< ₹25,000 / period',
      changeDisplay: 'Current snapshot',
      changeDirection: 'neutral',
      periodLabel: period.label,
      interpretation: 'Driven by spot vehicle hiring and unverified detention claims on Pune/Chennai lanes.',
      actionLabel: 'Review Carrier Variances',
    },
    {
      id: 'kpi-warehouse',
      metricId: 'warehouse_bin_accuracy',
      domain: 'warehouse',
      name: 'Warehouse Bin Reconciliation',
      status: p4AccuracyPercent < 90 ? 'Requires attention' : 'Monitoring',
      valueDisplay: `${p4AccuracyPercent}% Bin Match`,
      contextSubtext: `${p4MatchedCount} of ${p4TotalBins} bins matched • ${p4MismatchCount} require verification`,
      targetDisplay: '>= 98% match',
      changeDisplay: `${formatINRCompact(p4VarianceAbsValue)} abs variance`,
      changeDirection: 'neutral',
      periodLabel: period.label,
      interpretation: `${p4MismatchCount} storage bins show book-to-physical discrepancies requiring recount.`,
      actionLabel: 'Inspect Bin Exceptions',
    },
    {
      id: 'kpi-actions',
      metricId: 'open_actions_governance',
      domain: 'actions',
      name: 'Active Investigations',
      status: 'Requires attention',
      valueDisplay: '7 Open',
      contextSubtext: '3 Critical • 4 Requires attention • 2 Resolved',
      targetDisplay: '0 overdue Critical',
      changeDisplay: '3 due within 72 hrs',
      changeDirection: 'neutral',
      periodLabel: period.label,
      interpretation: 'Assigned across Inventory, Dispatch, Logistics, and Stores department heads.',
      actionLabel: 'Open Investigation Queue',
    },
  ];

  // Build Investigation Queue (Exception-First Design)
  const topDeadSku = p1DeadItems[0];
  const investigationQueue: InvestigationQueueRow[] = [
    {
      id: 'INV-2026-01',
      priority: 'Critical',
      domain: 'delivery',
      domainLabel: 'Delivery (P2)',
      signal: `${failedTotal} of ${totalDispatches} customer dispatches failed Dual-Gate OTIF (${otifPercent}% pass rate)`,
      whyItMatters: `Failed dispatches risk OEM/Tier-1 delivery SLA penalties, customer scorecards, and emergency spot-freight costs.`,
      evidenceCount: failedTotal,
      evidenceLabel: `${failedTotal} dispatch records`,
      owner: 'Dispatch Head (R. Karthik)',
      dueDate: 'Within 72 hrs',
      status: 'Open',
      recommendedInvestigation: 'Filter Delivery table by Late Only vs Short Only and verify gate-out vs picking hold timestamps.',
      metricId: 'delivery_otif',
    },
    {
      id: 'INV-2026-02',
      priority: 'Critical',
      domain: 'inventory',
      domainLabel: 'Inventory (P1)',
      signal: `${p1DeadItems.length} SKUs (${formatINRCompact(p1DeadValue)}) recorded zero movement for >180 days`,
      whyItMatters: `Locks ${p1DeadPercent}% of total inventory capital in non-moving stock (top item: ${topDeadSku ? topDeadSku.itemCode : 'RM-CR-204'}).`,
      evidenceCount: p1DeadItems.length,
      evidenceLabel: `${p1DeadItems.length} stock ledger rows`,
      owner: 'Inventory Manager (S. Venkat)',
      dueDate: 'Within 5 days',
      status: 'In progress',
      recommendedInvestigation: 'Separate active insurance spares from obsolete production batches and freeze repeat POs.',
      metricId: 'inventory_exposure',
    },
    {
      id: 'INV-2026-03',
      priority: 'Critical',
      domain: 'warehouse',
      domainLabel: 'Warehouse (P4)',
      signal: `${p4MismatchCount} storage bins failed book-to-physical reconciliation (${formatINRCompact(p4VarianceAbsValue)} variance)`,
      whyItMatters: 'Phantom system stock in fast-moving bins is associated with surprise short-shipments at dispatch.',
      evidenceCount: p4MismatchCount,
      evidenceLabel: `${p4MismatchCount} bin audit sheets`,
      owner: 'Stores Head (M. Prabhu)',
      dueDate: 'Within 72 hrs',
      status: 'Open',
      recommendedInvestigation: 'Check unposted shop-floor material issue slips and run blind recount on mismatched A-class bins.',
      metricId: 'warehouse_bin_accuracy',
    },
    {
      id: 'INV-2026-04',
      priority: 'Requires attention',
      domain: 'profit_risk',
      domainLabel: 'Profit & Risk (P3)',
      signal: `${p3FlaggedTripCount} carrier invoices exceed contracted lane rate cards by ${formatINRCompact(p3LeakageValue)}`,
      whyItMatters: 'Unverified detention charges and ad-hoc market vehicle rates erode net dispatch margin.',
      evidenceCount: p3FlaggedTripCount,
      evidenceLabel: `${p3FlaggedTripCount} trip bills`,
      owner: 'Logistics Head (A. Kumar)',
      dueDate: 'Within 5 days',
      status: 'Open',
      recommendedInvestigation: 'Cross-check carrier detention claims against gate-in/gate-out timestamps before bill approval.',
      metricId: 'profit_freight_variance',
    },
    {
      id: 'INV-2026-05',
      priority: 'Requires attention',
      domain: 'inventory',
      domainLabel: 'Inventory (P1)',
      signal: `${p1SlowItems.length} slow-moving SKUs (${formatINRCompact(p1SlowValue)}) aging between 90 and 180 days`,
      whyItMatters: 'At risk of crossing the 180-day non-moving threshold next month if minimum order quantities remain unchanged.',
      evidenceCount: p1SlowItems.length,
      evidenceLabel: `${p1SlowItems.length} slow-moving SKUs`,
      owner: 'Procurement Lead (D. Nair)',
      dueDate: 'Within 7 days',
      status: 'In progress',
      recommendedInvestigation: 'Review open supplier schedules and defer incoming deliveries for SKUs with >120 days cover.',
      metricId: 'inventory_exposure',
    },
    {
      id: 'INV-2026-06',
      priority: 'Monitoring',
      domain: 'delivery',
      domainLabel: 'Delivery (P2)',
      signal: `${shortOnly + lateAndShort} dispatches shipped with quantity short of customer PO`,
      whyItMatters: 'Indicates upstream stock-out or bin mismatch discovered only during vehicle loading.',
      evidenceCount: shortOnly + lateAndShort,
      evidenceLabel: `${shortOnly + lateAndShort} short-shipped POs`,
      owner: 'Production Planning (K. Rajan)',
      dueDate: 'Weekly review',
      status: 'Awaiting verification',
      recommendedInvestigation: 'Verify whether short-shipped parts overlap with the mismatched bins in Warehouse (P4).',
      metricId: 'delivery_otif',
    },
    {
      id: 'INV-2026-07',
      priority: 'Resolved',
      domain: 'profit_risk',
      domainLabel: 'Profit & Risk (P3)',
      signal: 'Duplicate weight-bridge surcharge on Hosur inter-unit lane reconciled',
      whyItMatters: 'Debit note raised and adjusted against monthly transporter settlement.',
      evidenceCount: 2,
      evidenceLabel: '2 settled vouchers',
      owner: 'Finance Audit (V. Iyer)',
      dueDate: 'Completed',
      status: 'Resolved',
      recommendedInvestigation: 'Maintain automated rate-card check during CSV import.',
      metricId: 'profit_freight_variance',
    },
  ];

  // Rule-Based Executive Brief (Generated from actual data, cautious language, no fabricated trend drift)
  const executiveBrief = {
    currentState: `Across ${plant.name} (${period.label}), 3 operational areas require management review: Gate OTIF is at ${otifPercent}% (${passedBoth} of ${totalDispatches} dispatches passed), ${formatINRCompact(p1DeadValue)} (${p1DeadItems.length} SKUs) has recorded zero movement for >180 days, and ${formatINRCompact(p3LeakageValue)} in carrier billing variance is flagged across ${p3FlaggedTripCount} trips.`,
    importantChange: `Current fortnight audit flags ${p1DeadItems.length} SKUs exceeding the 180-day inactivity rule (${formatINRCompact(Math.round(p1DeadValue * 0.22))}/yr carrying burn at 22%) and ${failedTotal} failed customer dispatch lines.`,
    likelyDriver: `Recorded dispatch logs show ${lateOnly} failures were late-only (associated with vehicle placement delays and gate congestion), while ${shortOnly + lateAndShort} involved quantity shortages that correlate with the ${p4MismatchCount} unverified bin discrepancies in Stores.`,
    priorityInvestigation: `First, review the ${failedTotal} failed dispatch lines in Delivery (P2) alongside the ${p4MismatchCount} mismatched bins in Warehouse (P4) to stop repeat short-shipments; second, audit the top ${Math.min(5, p1DeadItems.length)} non-moving SKUs in Inventory (P1) before approving next month's purchase indents.`,
    dataLimitation: `Figures and records shown here are illustrative unless a user imports data locally. Operational information is currently stored only in this browser (${period.dateRange}); items flagged as non-moving require engineering review to exclude mandatory machine spares.`,
  };

  return {
    plant,
    period,
    datasetLoaded,
    p1Items: p1Eval,
    p1DeadValue,
    p1SlowValue,
    p1TotalValue,
    p1DeadPercent,
    p1DeadSkuCount: p1DeadItems.length,
    p1SlowSkuCount: p1SlowItems.length,
    p1TotalSkuCount: p1Eval.length,
    p2Dispatches,
    p2DualGate,
    p3CalculatedTrips,
    p3LeakageValue,
    p3TotalBilled,
    p3TotalContract,
    p3FlaggedTripCount,
    p3TotalTripCount,
    p4Items,
    p4AccuracyPercent,
    p4MatchedCount,
    p4MismatchCount,
    p4TotalBins,
    p4VarianceAbsValue,
    capaItems: plantDataset.capaItems,
    priorities,
    kpiStrip,
    investigationQueue,
    methodologies,
    executiveBrief,
  };
}
