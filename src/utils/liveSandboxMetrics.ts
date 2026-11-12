/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { StockItem, RulesConfig, OwnerReportSummary } from '../project1/types.ts';
import { evaluateStockEngine, generateOwnerReport } from '../project1/utils/calculations.ts';
import { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES } from '../project1/data/initialData.ts';
import type { DispatchRow, RulesConfig as P2RulesConfig } from '../project2/types/otif.ts';
import { calculateOTIFMetrics, calculateRowStatus } from '../project2/utils/otifCalculator.ts';
import { INITIAL_DISPATCHES, INITIAL_RULES as P2_DEFAULT_RULES } from '../project2/data/initialData.ts';
import type { CalculatedTrip, RulesConfig as P3RulesConfig } from '../project3/types/freight.ts';
import { calculateAuditMetrics } from '../project3/utils/auditCalculations.ts';
import { INITIAL_TRIPS, DEFAULT_RULES as P3_DEFAULT_RULES } from '../project3/data/defaultData.ts';
import type { AuditItem, AuditRules as P4RulesConfig } from '../project4/types/audit.ts';
import { computeSummary, calculateItemFields } from '../project4/utils/auditCalculations.ts';
import { INITIAL_SAMPLE_SKUS, DEFAULT_RULES as P4_DEFAULT_RULES } from '../project4/data/sampleData.ts';
import type {
  PilotWorkspaceSnapshot,
  PilotWorkspaceSummaryMetrics,
  PilotMultiModuleSummary,
  P2ModuleSummaryMetrics,
  P3ModuleSummaryMetrics,
  P4ModuleSummaryMetrics,
} from './pilotWorkspaceStore.ts';

export const DEMO_SANDBOX_WORKSPACE_ID = 'AUDIT-DEMO-SANDBOX';
export const DEMO_SANDBOX_SHARE_TOKEN = 'live-4pillar-sandbox-walkthrough-token';

export interface ReconciledSampleAuditModeMetrics {
  modeId: 'A_LIVE_SANDBOX' | 'B_ILLUSTRATIVE_12400';
  modeLabel: string;
  modeBadge: string;
  companyName: string;
  plantLocation: string;
  inventoryAnalysedFormatted: string;
  inventoryAnalysedSubtext: string;
  skusEvaluatedFormatted: string;
  skusEvaluatedSubtext: string;
  nonMovingFormatted: string;
  nonMovingSubtext: string;
  slowMovingFormatted: string;
  slowMovingSubtext: string;
  priorityItemsFormatted: string;
  priorityItemsSubtext: string;
  highestValueCategory: string;
  highestValueCategorySubtext: string;
  connectedP2Pill: string;
  connectedP3Pill: string;
  connectedP4Pill: string;
}

export const ILLUSTRATIVE_12400_CASE_METRICS: ReconciledSampleAuditModeMetrics = {
  modeId: 'B_ILLUSTRATIVE_12400',
  modeLabel: 'Mode A: 12,400-SKU Plant Case (Mid-Sized Auto-Component Plant)',
  modeBadge: 'MODE A • 12,400-SKU PLANT CASE • MATCHES HERO BENCHMARK CARD',
  companyName: 'Mid-Sized Tier-1 Auto-Component Plant (Illustrative Case)',
  plantLocation: 'Chakan / Ambattur Industrial Corridor',
  inventoryAnalysedFormatted: '₹4,82,50,000',
  inventoryAnalysedSubtext: 'Total Book Value Across Stores',
  skusEvaluatedFormatted: '12,400 Line Items',
  skusEvaluatedSubtext: '99.8% Match Health (0 Syntax Errors)',
  nonMovingFormatted: '₹18,42,000',
  nonMovingSubtext: '>180 Days Inactive (24 SKUs)',
  slowMovingFormatted: '₹32,60,000',
  slowMovingSubtext: '90–180 Days Velocity Deceleration (41 SKUs)',
  priorityItemsFormatted: '18 Priority SKUs',
  priorityItemsSubtext: '76% of Stagnant Capital Concentration',
  highestValueCategory: 'Precision Machined Castings & Sub-Assemblies',
  highestValueCategorySubtext: '45% of non-moving cash exposure',
  connectedP2Pill: 'P2 OTIF: 50.0% (9/18 Pass)',
  connectedP3Pill: 'P3 Freight Leak: ₹13,944 (12 Trips)',
  connectedP4Pill: 'P4 Bin Accuracy: 60.0% (₹24,240 Ghost Stock)',
};

/**
 * Deterministically builds the canonical 4-Pillar (P1–P4) Live Sandbox Snapshot
 * directly from the verified calculation engines (`evaluateStockEngine`, `calculateOTIFMetrics`,
 * `calculateAuditMetrics`, `computeSummary`).
 */
export function buildLiveSandboxPilotWorkspaceSnapshot(options?: {
  rules?: RulesConfig;
  p2Rules?: P2RulesConfig;
  p3Rules?: P3RulesConfig;
  p4Rules?: P4RulesConfig;
}): PilotWorkspaceSnapshot {
  const p1Rules = options?.rules || DEFAULT_RULES;
  const p2Rules = options?.p2Rules || P2_DEFAULT_RULES;
  const p3Rules = options?.p3Rules || P3_DEFAULT_RULES;
  const p4Rules = options?.p4Rules || P4_DEFAULT_RULES;

  const evaluatedSkus: StockItem[] = evaluateStockEngine(AMBATTUR_FABRICATION_SAMPLE, p1Rules);
  const ownerReport: OwnerReportSummary = generateOwnerReport(AMBATTUR_FABRICATION_SAMPLE, p1Rules);

  const totalStockValue = ownerReport.totalStockValue;
  const deadStockValue = ownerReport.deadCash;
  const slowMovingValue = ownerReport.slowCash;
  const annualCarryingCostDrain = ownerReport.annualHoldingBurn;
  const monthlyBurn = Math.round(annualCarryingCostDrain / 12);
  const targetCashRelease = Math.round(deadStockValue * 0.7 + slowMovingValue * 0.3);

  const summaryMetrics: PilotWorkspaceSummaryMetrics = {
    totalStockValue,
    deadStockValue,
    slowMovingValue,
    annualCarryingCostDrain,
    monthlyBurn,
    targetCashRelease,
    totalSkus: ownerReport.totalItemCount,
    deadSkusCount: ownerReport.deadItemCount,
  };

  // P2 OTIF
  const otifMetrics = calculateOTIFMetrics(INITIAL_DISPATCHES, p2Rules);
  const evaluatedP2Dispatches: DispatchRow[] = INITIAL_DISPATCHES.map((r) =>
    calculateRowStatus(r, p2Rules)
  );
  const p2Summary: P2ModuleSummaryMetrics = {
    totalDispatches: otifMetrics.totalDispatches,
    passes: otifMetrics.passes,
    otifPercent: otifMetrics.otifPercent,
    onTimeCount: otifMetrics.onTimeCount,
    onTimePercent: otifMetrics.onTimePercent,
    inFullCount: otifMetrics.inFullCount,
    inFullPercent: otifMetrics.inFullPercent,
    fails: otifMetrics.fails,
    failsLateOnly: otifMetrics.failsLateOnly,
    failsShortOnly: otifMetrics.failsShortOnly,
    failsLateAndShort: otifMetrics.failsLateAndShort,
    weakestCustomerName: otifMetrics.weakestCustomer?.customer || null,
    topFailureReason: otifMetrics.topFailureReason?.reason || null,
  };

  // P3 Freight Audit
  const p3Audit = calculateAuditMetrics(INITIAL_TRIPS, p3Rules);
  const evaluatedP3Trips: CalculatedTrip[] = p3Audit.calculatedTrips;
  const flaggedTripsCount = evaluatedP3Trips.filter((t) => (t.totalLeak || 0) > 0).length;
  const p3Summary: P3ModuleSummaryMetrics = {
    totalTrips: p3Audit.totals.totalTrips,
    cleanTrips: p3Audit.totals.cleanTrips,
    splitTrips: p3Audit.totals.splitTrips,
    freightPaid: p3Audit.totals.freightPaid,
    rateLeak: p3Audit.totals.rateLeak,
    detention: p3Audit.totals.detention,
    totalLeak: p3Audit.totals.totalLeak,
    totalWaitHours: p3Audit.totals.totalWaitHours,
    flaggedTripsCount,
  };

  // P4 Warehouse Bin Variance
  const p4RawSummary = computeSummary(INITIAL_SAMPLE_SKUS, p4Rules);
  const evaluatedP4Bins: AuditItem[] = INITIAL_SAMPLE_SKUS.map((b) =>
    calculateItemFields(b, p4Rules)
  );
  const binAccuracyPercent =
    p4RawSummary.skusCounted > 0
      ? Math.round((p4RawSummary.linesMatched / p4RawSummary.skusCounted) * 100)
      : 100;
  const p4Summary: P4ModuleSummaryMetrics = {
    skusCounted: p4RawSummary.skusCounted,
    linesMatched: p4RawSummary.linesMatched,
    linesMismatch: p4RawSummary.linesMismatch,
    binAccuracyPercent,
    shelfShortRupees: p4RawSummary.shelfShortRupees,
    foundStockRupees: p4RawSummary.foundStockRupees,
    absVarianceRupees: p4RawSummary.shelfShortRupees + p4RawSummary.foundStockRupees,
    netGapRupees: p4RawSummary.netGapRupees,
    fastMoversHidden: p4RawSummary.fastMoversHidden,
    slowAtCounter: p4RawSummary.slowAtCounter,
    totalSystemValue: p4RawSummary.totalSystemValue,
    totalPhysicalValue: p4RawSummary.totalPhysicalValue,
  };

  const multiModuleSummary: PilotMultiModuleSummary = {
    p1: summaryMetrics,
    p2: p2Summary,
    p3: p3Summary,
    p4: p4Summary,
  };

  return {
    workspaceId: DEMO_SANDBOX_WORKSPACE_ID,
    shareToken: DEMO_SANDBOX_SHARE_TOKEN,
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T09:00:00.000Z',
    companyName: 'Ambattur Fabrication Sample Plant (Live 20-SKU Sandbox)',
    plantLocation: 'Ambattur Industrial Estate, Chennai',
    leadId: 'SANDBOX-BASELINE-P1P4',
    preparedBy: 'C. Jones Snowin',
    executiveNotes:
      'Live deterministic 4-pillar sandbox audit across P1 (20 SKUs, ₹2,23,110 Dead Stock), P2 (18 Dispatches, 50.0% Gate OTIF), P3 (12 Carrier Trips, ₹13,944 Freight Leakage), and P4 (15 Warehouse Bins, 60.0% Match Accuracy, ₹24,240 Ghost Stock).',
    rules: p1Rules,
    summaryMetrics,
    multiModuleSummary,
    ownerReport,
    evaluatedSkus,
    evaluatedP2Dispatches,
    evaluatedP3Trips,
    evaluatedP4Bins,
    retentionPolicyDays: 14,
    retentionExpiresAt: '2026-10-15T09:00:00.000Z',
    retentionStatus: 'ACTIVE_RETENTION_WINDOW',
  };
}

/**
 * Formats Mode A (Live 20-SKU Sandbox Dataset) reconciled metrics for the commercial landing page switcher.
 */
export function getLiveSandboxReconciledModeMetrics(): ReconciledSampleAuditModeMetrics {
  const snap = buildLiveSandboxPilotWorkspaceSnapshot();
  const p1 = snap.summaryMetrics;
  const p2 = snap.multiModuleSummary?.p2;
  const p3 = snap.multiModuleSummary?.p3;
  const p4 = snap.multiModuleSummary?.p4;

  // Determine top dead stock category
  const catEntries = Object.entries(snap.ownerReport.categoryDeadBreakdown) as Array<
    [string, { value: number; count: number; percent: number }]
  >;
  const topCat = [...catEntries].sort((a, b) => b[1].value - a[1].value)[0];
  const topCatName = topCat ? `${topCat[0]} (₹${topCat[1].value.toLocaleString('en-IN')})` : 'Finished Goods';
  const topCatSubtext = topCat
    ? `${topCat[1].count} Dead SKUs (${topCat[1].percent}% of non-moving cash)`
    : 'Primary stagnant category';

  return {
    modeId: 'A_LIVE_SANDBOX',
    modeLabel: 'Mode B: 20-SKU Sandbox (Live P1–P4 Engine Dataset)',
    modeBadge: 'MODE B • 100% ENGINE-COMPUTED • MATCHES P1–P4 PLATFORM & WALKTHROUGH',
    companyName: snap.companyName,
    plantLocation: snap.plantLocation,
    inventoryAnalysedFormatted: `₹${p1.totalStockValue.toLocaleString('en-IN')}`,
    inventoryAnalysedSubtext: `Exact Book Value (${p1.totalSkus} Sandbox SKUs)`,
    skusEvaluatedFormatted: `${p1.totalSkus} SKUs Evaluated`,
    skusEvaluatedSubtext: `As-Of Date: ${snap.rules.asOfDate} (100% Validated)`,
    nonMovingFormatted: `₹${p1.deadStockValue.toLocaleString('en-IN')}`,
    nonMovingSubtext: `>${snap.rules.deadThresholdDays} Days Inactive (${p1.deadSkusCount} SKUs • ${snap.ownerReport.deadCashPercent}%)`,
    slowMovingFormatted: `₹${p1.slowMovingValue.toLocaleString('en-IN')}`,
    slowMovingSubtext: `${snap.rules.slowThresholdDays}–${snap.rules.deadThresholdDays - 1} Days Watchlist (${snap.ownerReport.slowItemCount} SKUs • ${snap.ownerReport.slowCashPercent}%)`,
    priorityItemsFormatted: `${p1.deadSkusCount} High-Impact SKUs`,
    priorityItemsSubtext: `Target Cash Release: ₹${p1.targetCashRelease.toLocaleString('en-IN')}`,
    highestValueCategory: topCatName,
    highestValueCategorySubtext: topCatSubtext,
    connectedP2Pill: `P2 OTIF: ${p2?.otifPercent.toFixed(1)}% (${p2?.passes}/${p2?.totalDispatches} Pass)`,
    connectedP3Pill: `P3 Freight Leak: ₹${(p3?.totalLeak || 0).toLocaleString('en-IN')} (${p3?.totalTrips} Trips)`,
    connectedP4Pill: `P4 Bin Accuracy: ${p4?.binAccuracyPercent.toFixed(1)}% (₹${(p4?.shelfShortRupees || 0).toLocaleString('en-IN')} Ghost Stock)`,
  };
}
