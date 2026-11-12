/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import type { StockItem, RulesConfig, OwnerReportSummary } from '../project1/types.ts';
import { evaluateStockEngine, generateOwnerReport } from '../project1/utils/calculations.ts';
import { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES } from '../project1/data/initialData.ts';
import type { DispatchRow, RulesConfig as P2RulesConfig, DelayReason } from '../project2/types/otif.ts';
import { calculateOTIFMetrics, calculateRowStatus } from '../project2/utils/otifCalculator.ts';
import { INITIAL_DISPATCHES, INITIAL_RULES as P2_DEFAULT_RULES } from '../project2/data/initialData.ts';
import type { Trip, CalculatedTrip, RulesConfig as P3RulesConfig } from '../project3/types/freight.ts';
import { calculateAuditMetrics } from '../project3/utils/auditCalculations.ts';
import { INITIAL_TRIPS, DEFAULT_RULES as P3_DEFAULT_RULES } from '../project3/data/defaultData.ts';
import type { AuditItem, AuditRules as P4RulesConfig } from '../project4/types/audit.ts';
import { computeSummary, calculateItemFields } from '../project4/utils/auditCalculations.ts';
import { INITIAL_SAMPLE_SKUS, DEFAULT_RULES as P4_DEFAULT_RULES } from '../project4/data/sampleData.ts';
import { syncRecordToCloud } from './cloudPersistenceStore.ts';

export type StockRuleConfig = RulesConfig;
export type SKUItem = StockItem;
export type P2DispatchItem = DispatchRow;
export type P3FreightTripItem = Trip;
export type P4WarehouseBinItem = AuditItem;

export const DEFAULT_WORKSPACES_FILE_PATH = path.resolve(
  process.cwd(),
  'data',
  'pilot_workspaces.json'
);

export interface PilotWorkspaceSummaryMetrics {
  totalStockValue: number;
  deadStockValue: number;
  slowMovingValue: number;
  annualCarryingCostDrain: number;
  monthlyBurn: number;
  targetCashRelease: number;
  totalSkus: number;
  deadSkusCount: number;
}

export interface P2ModuleSummaryMetrics {
  totalDispatches: number;
  passes: number;
  otifPercent: number;
  onTimeCount: number;
  onTimePercent: number;
  inFullCount: number;
  inFullPercent: number;
  fails: number;
  failsLateOnly: number;
  failsShortOnly: number;
  failsLateAndShort: number;
  weakestCustomerName: string | null;
  topFailureReason: string | null;
}

export interface P3ModuleSummaryMetrics {
  totalTrips: number;
  cleanTrips: number;
  splitTrips: number;
  freightPaid: number;
  rateLeak: number;
  detention: number;
  totalLeak: number;
  totalWaitHours: number;
  flaggedTripsCount: number;
}

export interface P4ModuleSummaryMetrics {
  skusCounted: number;
  linesMatched: number;
  linesMismatch: number;
  binAccuracyPercent: number;
  shelfShortRupees: number;
  foundStockRupees: number;
  absVarianceRupees: number;
  netGapRupees: number;
  fastMoversHidden: number;
  slowAtCounter: number;
  totalSystemValue: number;
  totalPhysicalValue: number;
}

export interface PilotMultiModuleSummary {
  p1: PilotWorkspaceSummaryMetrics;
  p2?: P2ModuleSummaryMetrics;
  p3?: P3ModuleSummaryMetrics;
  p4?: P4ModuleSummaryMetrics;
}

export interface SnapshotPillarQualityMetric {
  totalSubmitted: number;
  validAccepted: number;
  quarantinedRejected: number;
  reserveSparesCount?: number;
  reserveSparesValueINR?: number;
}

export interface SnapshotDataQualityOverview {
  importRunId?: string;
  datasetSha256?: string;
  totalSubmitted: number;
  validAccepted: number;
  quarantinedRejected: number;
  completenessPct?: number;
  duplicateKeysCount?: number;
  reserveSparesFlaggedCount?: number;
  reserveSparesExcludedValue?: number;
  p1Quality?: SnapshotPillarQualityMetric;
  p2Quality?: SnapshotPillarQualityMetric;
  p3Quality?: SnapshotPillarQualityMetric;
  p4Quality?: SnapshotPillarQualityMetric;
  columnMappingUsed?: Record<string, Record<string, string>>;
}

export interface SnapshotAssumptionsAndExclusions {
  excludeReserveSpares: boolean;
  reserveSparesExcludedCount: number;
  reserveSparesExcludedValue: number;
  reserveSparesItemCodes?: string[];
  netLiquidatableDeadStockValue?: number;
  dateReferenceUsed: string;
  carryingCostPercentUsed: number;
  quarantineExclusionsCount: number;
  anonymizationApplied: boolean;
  notes: string[];
  asOfDateUsed?: string;
  deadThresholdDaysUsed?: number;
  slowThresholdDaysUsed?: number;
  holdingCostPercentUsed?: number;
  quarantinedRowsExcludedCount?: number;
  limitationNotes?: string[];
}

export interface CreatePilotWorkspaceInput {
  companyName: string;
  plantLocation: string;
  leadId?: string;
  preparedBy?: string;
  rules?: Partial<StockRuleConfig>;
  skus: SKUItem[];
  p2Dispatches?: P2DispatchItem[];
  p2Rules?: Partial<P2RulesConfig>;
  p3FreightTrips?: P3FreightTripItem[];
  p3Rules?: Partial<P3RulesConfig>;
  p4WarehouseBins?: P4WarehouseBinItem[];
  p4Rules?: Partial<P4RulesConfig>;
  executiveNotes?: string;
  importRunId?: string;
  datasetSha256?: string;
  excludeReserveSpares?: boolean;
  anonymizationApplied?: boolean;
  dataQualityOverview?: SnapshotDataQualityOverview;
  assumptionsAndExclusions?: SnapshotAssumptionsAndExclusions;
  commercialAccessMode?: CommercialAccessMode;
  invoiceId?: string;
  invoiceAmountInr?: number;
  paymentTier?: 'TIER2_FULL_AUDIT' | 'TIER3_MONTHLY_RETAINER';
}

export type WorkspaceRetentionStatus =
  | 'ACTIVE_RETENTION_WINDOW'
  | 'EXTENDED_BY_CLIENT'
  | 'PURGED';

export type CommercialAccessMode =
  | 'FULL_UNLOCKED'
  | 'TEASER_LOCKED'
  | 'UTR_PENDING_VERIFICATION';

export interface PilotWorkspaceSnapshot {
  workspaceId: string;
  shareToken: string;
  createdAt: string;
  updatedAt: string;
  companyName: string;
  plantLocation: string;
  leadId?: string;
  preparedBy: string;
  executiveNotes: string;
  rules: StockRuleConfig;
  summaryMetrics: PilotWorkspaceSummaryMetrics;
  multiModuleSummary: PilotMultiModuleSummary;
  ownerReport: OwnerReportSummary;
  evaluatedSkus: SKUItem[];
  evaluatedP2Dispatches?: P2DispatchItem[];
  evaluatedP3Trips?: CalculatedTrip[];
  evaluatedP4Bins?: P4WarehouseBinItem[];
  skus?: SKUItem[];
  p2Dispatches?: P2DispatchItem[];
  p3FreightTrips?: CalculatedTrip[];
  p4WarehouseBins?: P4WarehouseBinItem[];
  importRunId?: string;
  datasetSha256?: string;
  dataQualityOverview?: SnapshotDataQualityOverview;
  assumptionsAndExclusions?: SnapshotAssumptionsAndExclusions;
  // Phase 8: 14-Day Data Retention & Cryptographic Purge Tombstone Fields
  retentionPolicyDays: number;
  retentionExpiresAt: string;
  retentionStatus: WorkspaceRetentionStatus;
  purgedAt?: string;
  deletionCertificateId?: string;
  prePurgeSnapshotIntegrityHash?: string;
  // Phase 15: Teaser vs. Paid Paywall & Direct Bank/UPI Collection Fields
  commercialAccessMode?: CommercialAccessMode;
  invoiceId?: string;
  invoiceAmountInr?: number;
  submittedUtrNumber?: string;
  paidByEmail?: string;
  paymentTier?: 'TIER2_FULL_AUDIT' | 'TIER3_MONTHLY_RETAINER';
  paymentVerifiedAt?: string;
}

export interface PilotWorkspaceValidationResult {
  ok: boolean;
  data?: {
    companyName: string;
    plantLocation: string;
    leadId?: string;
    preparedBy: string;
    executiveNotes: string;
    rules: StockRuleConfig;
    skus: SKUItem[];
    p2Dispatches?: P2DispatchItem[];
    p2Rules?: P2RulesConfig;
    p3FreightTrips?: P3FreightTripItem[];
    p3Rules?: P3RulesConfig;
    p4WarehouseBins?: P4WarehouseBinItem[];
    p4Rules?: P4RulesConfig;
    importRunId?: string;
    datasetSha256?: string;
    excludeReserveSpares?: boolean;
    anonymizationApplied?: boolean;
    dataQualityOverview?: SnapshotDataQualityOverview;
    assumptionsAndExclusions?: SnapshotAssumptionsAndExclusions;
    commercialAccessMode?: CommercialAccessMode;
    invoiceId?: string;
    invoiceAmountInr?: number;
    paymentTier?: 'TIER2_FULL_AUDIT' | 'TIER3_MONTHLY_RETAINER';
  };
  error?: string;
  fieldErrors?: Record<string, string>;
}

const writeLocks = new Map<string, Promise<unknown>>();

function withSerializedLock<T>(filePath: string, task: () => Promise<T>): Promise<T> {
  const prev = writeLocks.get(filePath) ?? Promise.resolve();
  const next = prev.then(task, task);
  writeLocks.set(
    filePath,
    next.catch(() => {})
  );
  return next;
}

function sanitizeText(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

/**
 * Generates a unique workspaceId in format AUDIT-YYYYMMDD-XXXX
 */
export function generateWorkspaceId(now: Date = new Date()): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `AUDIT-${yyyy}${mm}${dd}-${suffix}`;
}

/**
 * Generates a cryptographic read-only shareToken (24 hex chars)
 */
export function generateShareToken(): string {
  return crypto.randomBytes(12).toString('hex');
}

/**
 * Validates incoming payload for POST /api/admin/pilot-workspaces
 * Supports P1 skus plus optional P2 dispatches, P3 freight trips, and P4 warehouse bins.
 */
export function validatePilotWorkspacePayload(raw: unknown): PilotWorkspaceValidationResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      ok: false,
      error: 'Invalid workspace payload',
      fieldErrors: { form: 'Request body must be a JSON object.' },
    };
  }

  const body = raw as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};

  const companyName = sanitizeText(body.companyName);
  if (!companyName || companyName.length < 2 || companyName.length > 160) {
    fieldErrors.companyName = 'Company name is required (2–160 characters).';
  }

  const plantLocation = sanitizeText(body.plantLocation);
  if (!plantLocation || plantLocation.length < 2 || plantLocation.length > 160) {
    fieldErrors.plantLocation = 'Plant location is required (2–160 characters).';
  }

  const leadId = sanitizeText(body.leadId);
  const preparedBy = sanitizeText(body.preparedBy) || 'C. Jones Snowin';
  const executiveNotes = sanitizeText(body.executiveNotes).slice(0, 3000);

  if (!Array.isArray(body.skus) || body.skus.length === 0) {
    fieldErrors.skus = 'At least 1 valid SKU item is required to create a Pilot Audit Workspace.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors,
    };
  }

  const rawRules = (body.rules && typeof body.rules === 'object' ? body.rules : {}) as Partial<StockRuleConfig>;
  const rules: StockRuleConfig = {
    asOfDate: sanitizeText(rawRules.asOfDate) || DEFAULT_RULES.asOfDate,
    deadThresholdDays:
      typeof rawRules.deadThresholdDays === 'number' && rawRules.deadThresholdDays > 0
        ? rawRules.deadThresholdDays
        : DEFAULT_RULES.deadThresholdDays,
    slowThresholdDays:
      typeof rawRules.slowThresholdDays === 'number' && rawRules.slowThresholdDays > 0
        ? rawRules.slowThresholdDays
        : DEFAULT_RULES.slowThresholdDays,
    classACutoff:
      typeof rawRules.classACutoff === 'number' && rawRules.classACutoff > 0
        ? rawRules.classACutoff
        : DEFAULT_RULES.classACutoff,
    classBCutoff:
      typeof rawRules.classBCutoff === 'number' && rawRules.classBCutoff > 0
        ? rawRules.classBCutoff
        : DEFAULT_RULES.classBCutoff,
    holdingCostPercent:
      typeof rawRules.holdingCostPercent === 'number' && rawRules.holdingCostPercent >= 0
        ? rawRules.holdingCostPercent
        : DEFAULT_RULES.holdingCostPercent,
  };

  const validCategories = ['Raw Material', 'Finished Goods', 'Spares', 'Consumable'] as const;
  const rawSkus = body.skus as Array<Record<string, unknown>>;
  const normalizedSkus: SKUItem[] = [];

  for (let i = 0; i < rawSkus.length; i++) {
    const item = rawSkus[i];
    if (!item || typeof item !== 'object') continue;
    const itemCode = sanitizeText(item.itemCode) || `SKU-${i + 1}`;
    const itemName = sanitizeText(item.itemName) || `Inventory Part ${i + 1}`;
    const rawCat = sanitizeText(item.category);
    const category = (validCategories as readonly string[]).includes(rawCat)
      ? (rawCat as SKUItem['category'])
      : 'Raw Material';
    const qtyOnHand = Number(item.qtyOnHand);
    const costRate = Number(item.costRate);
    const lastMovement = sanitizeText(item.lastMovement) || rules.asOfDate;

    if (isNaN(qtyOnHand) || qtyOnHand < 0 || isNaN(costRate) || costRate < 0) {
      return {
        ok: false,
        error: 'Validation failed',
        fieldErrors: {
          skus: `SKU row ${i + 1} (${itemCode}) has invalid or negative qtyOnHand / costRate.`,
        },
      };
    }

    normalizedSkus.push({
      id: sanitizeText(item.id) || `sku-${i + 1}`,
      itemCode,
      itemName,
      category,
      qtyOnHand,
      costRate,
      lastMovement,
      ...(typeof item.isReserveSpare === 'boolean' ? { isReserveSpare: item.isReserveSpare } : {}),
    });
  }

  if (normalizedSkus.length === 0) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: { skus: 'No valid SKU rows provided.' },
    };
  }

  // Optional P2 Dispatches
  let normalizedP2Dispatches: P2DispatchItem[] | undefined;
  let normalizedP2Rules: P2RulesConfig | undefined;
  if (Array.isArray(body.p2Dispatches) && body.p2Dispatches.length > 0) {
    const rawP2Rules = (
      body.p2Rules && typeof body.p2Rules === 'object' ? body.p2Rules : {}
    ) as Partial<P2RulesConfig>;
    normalizedP2Rules = {
      ...P2_DEFAULT_RULES,
      graceHours:
        typeof rawP2Rules.graceHours === 'number' && rawP2Rules.graceHours >= 0
          ? rawP2Rules.graceHours
          : P2_DEFAULT_RULES.graceHours,
      inFullCutoff:
        typeof rawP2Rules.inFullCutoff === 'number' && rawP2Rules.inFullCutoff > 0
          ? rawP2Rules.inFullCutoff
          : P2_DEFAULT_RULES.inFullCutoff,
      weekStart: sanitizeText(rawP2Rules.weekStart) || P2_DEFAULT_RULES.weekStart,
      weekEnd: sanitizeText(rawP2Rules.weekEnd) || P2_DEFAULT_RULES.weekEnd,
    };

    normalizedP2Dispatches = (body.p2Dispatches as Array<Record<string, unknown>>)
      .filter((row) => row && typeof row === 'object')
      .map((row, idx) => ({
        id: sanitizeText(row.id) || `disp-${idx + 1}`,
        customer: sanitizeText(row.customer) || 'Customer',
        po: sanitizeText(row.po) || `PO-${idx + 1}`,
        part: sanitizeText(row.part) || `Part-${idx + 1}`,
        orderedQty: Math.max(0, Number(row.orderedQty) || 0),
        shippedQty: Math.max(0, Number(row.shippedQty) || 0),
        promisedDate: sanitizeText(row.promisedDate),
        actualOut: sanitizeText(row.actualOut),
        vehicle: sanitizeText(row.vehicle) || 'N/A',
        delayReason: (sanitizeText(row.delayReason) || '') as DelayReason,
        notes: sanitizeText(row.notes),
      }));
  }

  // Optional P3 Freight Trips
  let normalizedP3Trips: P3FreightTripItem[] | undefined;
  let normalizedP3Rules: P3RulesConfig | undefined;
  if (Array.isArray(body.p3FreightTrips) && body.p3FreightTrips.length > 0) {
    const rawP3Rules = (
      body.p3Rules && typeof body.p3Rules === 'object' ? body.p3Rules : {}
    ) as Partial<P3RulesConfig>;
    normalizedP3Rules = {
      ...P3_DEFAULT_RULES,
      detentionRatePerHour:
        typeof rawP3Rules.detentionRatePerHour === 'number' && rawP3Rules.detentionRatePerHour >= 0
          ? rawP3Rules.detentionRatePerHour
          : P3_DEFAULT_RULES.detentionRatePerHour,
      minWeightThresholdKg:
        typeof rawP3Rules.minWeightThresholdKg === 'number' && rawP3Rules.minWeightThresholdKg >= 0
          ? rawP3Rules.minWeightThresholdKg
          : P3_DEFAULT_RULES.minWeightThresholdKg,
      startDate: sanitizeText(rawP3Rules.startDate) || P3_DEFAULT_RULES.startDate,
      endDate: sanitizeText(rawP3Rules.endDate) || P3_DEFAULT_RULES.endDate,
      unitLocation: sanitizeText(rawP3Rules.unitLocation) || P3_DEFAULT_RULES.unitLocation,
    };

    normalizedP3Trips = (body.p3FreightTrips as Array<Record<string, unknown>>)
      .filter((t) => t && typeof t === 'object')
      .map((t, idx) => ({
        id: sanitizeText(t.id) || `TRIP-${idx + 1}`,
        date: sanitizeText(t.date) || normalizedP3Rules!.startDate,
        lane: sanitizeText(t.lane) || 'Primary Lane',
        km: Math.max(0, Number(t.km) || 0),
        transporter: sanitizeText(t.transporter) || 'Transporter',
        weightKg: Math.max(0, Number(t.weightKg) || 0),
        bill: Math.max(0, Number(t.bill) || 0),
        waitHours: Math.max(0, Number(t.waitHours) || 0),
        split: sanitizeText(t.split) === 'Yes' ? 'Yes' : 'No',
        emptyReturn: sanitizeText(t.emptyReturn) === 'No' ? 'No' : 'Yes',
        notes: sanitizeText(t.notes),
        sourceDoc: sanitizeText(t.sourceDoc),
      }));
  }

  // Optional P4 Warehouse Bins
  let normalizedP4Bins: P4WarehouseBinItem[] | undefined;
  let normalizedP4Rules: P4RulesConfig | undefined;
  if (Array.isArray(body.p4WarehouseBins) && body.p4WarehouseBins.length > 0) {
    const rawP4Rules = (
      body.p4Rules && typeof body.p4Rules === 'object' ? body.p4Rules : {}
    ) as Partial<P4RulesConfig>;
    normalizedP4Rules = {
      ...P4_DEFAULT_RULES,
      countDate: sanitizeText(rawP4Rules.countDate) || P4_DEFAULT_RULES.countDate,
      fastMoverCutoff:
        typeof rawP4Rules.fastMoverCutoff === 'number' && rawP4Rules.fastMoverCutoff >= 0
          ? rawP4Rules.fastMoverCutoff
          : P4_DEFAULT_RULES.fastMoverCutoff,
      shrinkTolerancePercent:
        typeof rawP4Rules.shrinkTolerancePercent === 'number' &&
        rawP4Rules.shrinkTolerancePercent >= 0
          ? rawP4Rules.shrinkTolerancePercent
          : P4_DEFAULT_RULES.shrinkTolerancePercent,
    };

    normalizedP4Bins = (body.p4WarehouseBins as Array<Record<string, unknown>>)
      .filter((b) => b && typeof b === 'object')
      .map((b, idx) => ({
        id: sanitizeText(b.id) || `bin-${idx + 1}`,
        code: sanitizeText(b.code) || `BIN-SKU-${idx + 1}`,
        part: sanitizeText(b.part) || `Warehouse Item ${idx + 1}`,
        spot: sanitizeText(b.spot) || 'Back rack',
        systemQty: Math.max(0, Number(b.systemQty) || 0),
        physicalQty: Math.max(0, Number(b.physicalQty) || 0),
        cost: Math.max(0, Number(b.cost) || 0),
        issuesPerMonth: Math.max(0, Number(b.issuesPerMonth) || 0),
        statusNote: sanitizeText(b.statusNote),
      }));
  }

  const importRunId = sanitizeText(body.importRunId);
  const datasetSha256 = sanitizeText(body.datasetSha256);
  const excludeReserveSpares = typeof body.excludeReserveSpares === 'boolean' ? body.excludeReserveSpares : undefined;
  const anonymizationApplied = typeof body.anonymizationApplied === 'boolean' ? body.anonymizationApplied : undefined;
  const dataQualityOverview =
    body.dataQualityOverview && typeof body.dataQualityOverview === 'object'
      ? (body.dataQualityOverview as SnapshotDataQualityOverview)
      : undefined;
  const assumptionsAndExclusions =
    body.assumptionsAndExclusions && typeof body.assumptionsAndExclusions === 'object'
      ? (body.assumptionsAndExclusions as SnapshotAssumptionsAndExclusions)
      : undefined;
  const commercialAccessMode: CommercialAccessMode | undefined =
    body.commercialAccessMode === 'TEASER_LOCKED' ||
    body.commercialAccessMode === 'UTR_PENDING_VERIFICATION' ||
    body.commercialAccessMode === 'FULL_UNLOCKED'
      ? body.commercialAccessMode
      : undefined;
  const invoiceId = sanitizeText(body.invoiceId);
  const invoiceAmountInr =
    typeof body.invoiceAmountInr === 'number' && body.invoiceAmountInr > 0
      ? Math.round(body.invoiceAmountInr)
      : undefined;
  const paymentTier =
    body.paymentTier === 'TIER3_MONTHLY_RETAINER' || body.paymentTier === 'TIER2_FULL_AUDIT'
      ? body.paymentTier
      : undefined;

  return {
    ok: true,
    data: {
      companyName,
      plantLocation,
      ...(leadId ? { leadId } : {}),
      preparedBy,
      executiveNotes,
      rules,
      skus: normalizedSkus,
      ...(normalizedP2Dispatches && normalizedP2Dispatches.length > 0
        ? { p2Dispatches: normalizedP2Dispatches, p2Rules: normalizedP2Rules }
        : {}),
      ...(normalizedP3Trips && normalizedP3Trips.length > 0
        ? { p3FreightTrips: normalizedP3Trips, p3Rules: normalizedP3Rules }
        : {}),
      ...(normalizedP4Bins && normalizedP4Bins.length > 0
        ? { p4WarehouseBins: normalizedP4Bins, p4Rules: normalizedP4Rules }
        : {}),
      ...(importRunId ? { importRunId } : {}),
      ...(datasetSha256 ? { datasetSha256 } : {}),
      ...(typeof excludeReserveSpares === 'boolean' ? { excludeReserveSpares } : {}),
      ...(typeof anonymizationApplied === 'boolean' ? { anonymizationApplied } : {}),
      ...(dataQualityOverview ? { dataQualityOverview } : {}),
      ...(assumptionsAndExclusions ? { assumptionsAndExclusions } : {}),
      ...(commercialAccessMode ? { commercialAccessMode } : {}),
      ...(invoiceId ? { invoiceId } : {}),
      ...(invoiceAmountInr ? { invoiceAmountInr } : {}),
      ...(paymentTier ? { paymentTier } : {}),
    },
  };
}

/**
 * Pure deterministic computation of P1–P4 metrics using canonical engines:
 * - P1: evaluateStockEngine & generateOwnerReport
 * - P2: calculateOTIFMetrics & calculateRowStatus
 * - P3: calculateAuditMetrics
 * - P4: computeSummary & calculateItemFields
 */
export function computePilotWorkspaceAnalytics(
  skus: SKUItem[],
  rules: StockRuleConfig = DEFAULT_RULES,
  optionalModules?: {
    p2Dispatches?: P2DispatchItem[];
    p2Rules?: P2RulesConfig;
    p3FreightTrips?: P3FreightTripItem[];
    p3Rules?: P3RulesConfig;
    p4WarehouseBins?: P4WarehouseBinItem[];
    p4Rules?: P4RulesConfig;
    excludeReserveSpares?: boolean;
  }
): {
  summaryMetrics: PilotWorkspaceSummaryMetrics;
  multiModuleSummary: PilotMultiModuleSummary;
  ownerReport: OwnerReportSummary;
  evaluatedSkus: SKUItem[];
  evaluatedP2Dispatches?: P2DispatchItem[];
  evaluatedP3Trips?: CalculatedTrip[];
  evaluatedP4Bins?: P4WarehouseBinItem[];
} {
  const rawEvaluatedSkus = evaluateStockEngine(skus, rules);
  const excludeReserve = Boolean(optionalModules?.excludeReserveSpares);

  const evaluatedSkus = rawEvaluatedSkus.map((sku) => {
    const isReserve =
      Boolean((sku as SKUItem & { isReserveSpare?: boolean }).isReserveSpare) ||
      sku.itemName.includes('[RESERVE SPARE]');
    if (excludeReserve && isReserve) {
      return {
        ...sku,
        actionStatus: 'Retain as Critical Machine / Insurance Spare (Item 07 Excluded from Liquidation)',
      };
    }
    return sku;
  });

  const ownerReport = generateOwnerReport(skus, rules);

  const totalStockValue = ownerReport.totalStockValue;
  const deadStockValue = ownerReport.deadCash;
  const slowMovingValue = ownerReport.slowCash;
  const annualCarryingCostDrain = ownerReport.annualHoldingBurn;
  const monthlyBurn = Math.round(annualCarryingCostDrain / 12);
  // Target cash release: 70% recovery on dead stock + 30% velocity release on slow-moving stock
  const targetCashRelease = Math.round(deadStockValue * 0.7 + slowMovingValue * 0.3);
  const totalSkus = ownerReport.totalItemCount;
  const deadSkusCount = ownerReport.deadItemCount;

  const summaryMetrics: PilotWorkspaceSummaryMetrics = {
    totalStockValue,
    deadStockValue,
    slowMovingValue,
    annualCarryingCostDrain,
    monthlyBurn,
    targetCashRelease,
    totalSkus,
    deadSkusCount,
  };

  let p2Summary: P2ModuleSummaryMetrics | undefined;
  let evaluatedP2Dispatches: P2DispatchItem[] | undefined;
  if (optionalModules?.p2Dispatches && optionalModules.p2Dispatches.length > 0) {
    const p2RulesToUse = optionalModules.p2Rules || P2_DEFAULT_RULES;
    const otifMetrics = calculateOTIFMetrics(optionalModules.p2Dispatches, p2RulesToUse);
    evaluatedP2Dispatches = optionalModules.p2Dispatches.map((r) =>
      calculateRowStatus(r, p2RulesToUse)
    );
    p2Summary = {
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
  }

  let p3Summary: P3ModuleSummaryMetrics | undefined;
  let evaluatedP3Trips: CalculatedTrip[] | undefined;
  if (optionalModules?.p3FreightTrips && optionalModules.p3FreightTrips.length > 0) {
    const p3RulesToUse = optionalModules.p3Rules || P3_DEFAULT_RULES;
    const p3Audit = calculateAuditMetrics(optionalModules.p3FreightTrips, p3RulesToUse);
    evaluatedP3Trips = p3Audit.calculatedTrips;
    const flaggedTripsCount = evaluatedP3Trips.filter((t) => (t.totalLeak || 0) > 0).length;
    p3Summary = {
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
  }

  let p4Summary: P4ModuleSummaryMetrics | undefined;
  let evaluatedP4Bins: P4WarehouseBinItem[] | undefined;
  if (optionalModules?.p4WarehouseBins && optionalModules.p4WarehouseBins.length > 0) {
    const p4RulesToUse = optionalModules.p4Rules || P4_DEFAULT_RULES;
    const p4RawSummary = computeSummary(optionalModules.p4WarehouseBins, p4RulesToUse);
    evaluatedP4Bins = optionalModules.p4WarehouseBins.map((b) =>
      calculateItemFields(b, p4RulesToUse)
    );
    const binAccuracyPercent =
      p4RawSummary.skusCounted > 0
        ? Math.round((p4RawSummary.linesMatched / p4RawSummary.skusCounted) * 100)
        : 100;
    p4Summary = {
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
  }

  const multiModuleSummary: PilotMultiModuleSummary = {
    p1: summaryMetrics,
    ...(p2Summary ? { p2: p2Summary } : {}),
    ...(p3Summary ? { p3: p3Summary } : {}),
    ...(p4Summary ? { p4: p4Summary } : {}),
  };

  return {
    summaryMetrics,
    multiModuleSummary,
    ownerReport,
    evaluatedSkus,
    ...(evaluatedP2Dispatches ? { evaluatedP2Dispatches } : {}),
    ...(evaluatedP3Trips ? { evaluatedP3Trips } : {}),
    ...(evaluatedP4Bins ? { evaluatedP4Bins } : {}),
  };
}

const DEFAULT_RETENTION_POLICY_DAYS = 14;

export function normalizeWorkspaceRetentionSnapshot(
  raw: PilotWorkspaceSnapshot
): PilotWorkspaceSnapshot {
  const retentionPolicyDays =
    typeof raw.retentionPolicyDays === 'number' && raw.retentionPolicyDays > 0
      ? raw.retentionPolicyDays
      : DEFAULT_RETENTION_POLICY_DAYS;

  const createdMs = Date.parse(raw.createdAt);
  const baseMs = Number.isFinite(createdMs) ? createdMs : Date.now();
  const defaultExpiresAt = new Date(
    baseMs + retentionPolicyDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const retentionExpiresAt =
    typeof raw.retentionExpiresAt === 'string' && raw.retentionExpiresAt.trim()
      ? raw.retentionExpiresAt.trim()
      : defaultExpiresAt;

  const retentionStatus: WorkspaceRetentionStatus =
    raw.retentionStatus === 'PURGED' ||
    raw.retentionStatus === 'EXTENDED_BY_CLIENT' ||
    raw.retentionStatus === 'ACTIVE_RETENTION_WINDOW'
      ? raw.retentionStatus
      : 'ACTIVE_RETENTION_WINDOW';

  const isPurged = retentionStatus === 'PURGED';
  const evaluatedSkus = isPurged ? [] : Array.isArray(raw.evaluatedSkus) ? raw.evaluatedSkus : [];
  const evaluatedP2Dispatches = isPurged
    ? []
    : Array.isArray(raw.evaluatedP2Dispatches)
    ? raw.evaluatedP2Dispatches
    : raw.evaluatedP2Dispatches;
  const evaluatedP3Trips = isPurged
    ? []
    : Array.isArray(raw.evaluatedP3Trips)
    ? raw.evaluatedP3Trips
    : raw.evaluatedP3Trips;
  const evaluatedP4Bins = isPurged
    ? []
    : Array.isArray(raw.evaluatedP4Bins)
    ? raw.evaluatedP4Bins
    : raw.evaluatedP4Bins;

  const prePurgeSnapshotIntegrityHash =
    typeof raw.prePurgeSnapshotIntegrityHash === 'string' &&
    raw.prePurgeSnapshotIntegrityHash.trim().length === 64
      ? raw.prePurgeSnapshotIntegrityHash.trim()
      : typeof raw.datasetSha256 === 'string' && raw.datasetSha256.trim().length === 64
      ? raw.datasetSha256.trim()
      : crypto
          .createHash('sha256')
          .update(
            JSON.stringify({
              skus: evaluatedSkus,
              p2Dispatches: evaluatedP2Dispatches || [],
              p3FreightTrips: evaluatedP3Trips || [],
              p4WarehouseBins: evaluatedP4Bins || [],
            }),
            'utf8'
          )
          .digest('hex');

  const commercialAccessMode: CommercialAccessMode =
    raw.commercialAccessMode === 'TEASER_LOCKED' ||
    raw.commercialAccessMode === 'UTR_PENDING_VERIFICATION' ||
    raw.commercialAccessMode === 'FULL_UNLOCKED'
      ? raw.commercialAccessMode
      : 'FULL_UNLOCKED';

  const datePart =
    typeof raw.createdAt === 'string' && raw.createdAt.length >= 10
      ? raw.createdAt.slice(0, 10).replace(/-/g, '')
      : '20261109';
  const idSuffix =
    typeof raw.workspaceId === 'string' && raw.workspaceId.trim()
      ? raw.workspaceId.replace(/[^A-Z0-9]/gi, '').slice(-4).toUpperCase().padStart(4, '0')
      : '0001';
  const invoiceId =
    typeof raw.invoiceId === 'string' && raw.invoiceId.trim()
      ? raw.invoiceId.trim()
      : `INV-${datePart}-${idSuffix}`;

  const paymentTier: 'TIER2_FULL_AUDIT' | 'TIER3_MONTHLY_RETAINER' =
    raw.paymentTier === 'TIER3_MONTHLY_RETAINER' ? 'TIER3_MONTHLY_RETAINER' : 'TIER2_FULL_AUDIT';

  const invoiceAmountInr =
    typeof raw.invoiceAmountInr === 'number' && raw.invoiceAmountInr > 0
      ? Math.round(raw.invoiceAmountInr)
      : paymentTier === 'TIER3_MONTHLY_RETAINER'
      ? 24999
      : 14999;

  return {
    ...raw,
    evaluatedSkus,
    ...(evaluatedP2Dispatches !== undefined ? { evaluatedP2Dispatches } : {}),
    ...(evaluatedP3Trips !== undefined ? { evaluatedP3Trips } : {}),
    ...(evaluatedP4Bins !== undefined ? { evaluatedP4Bins } : {}),
    skus: isPurged ? [] : raw.skus ?? evaluatedSkus,
    p2Dispatches: isPurged ? [] : raw.p2Dispatches ?? evaluatedP2Dispatches ?? [],
    p3FreightTrips: isPurged ? [] : raw.p3FreightTrips ?? evaluatedP3Trips ?? [],
    p4WarehouseBins: isPurged ? [] : raw.p4WarehouseBins ?? evaluatedP4Bins ?? [],
    retentionPolicyDays,
    retentionExpiresAt,
    retentionStatus,
    prePurgeSnapshotIntegrityHash,
    commercialAccessMode,
    invoiceId,
    invoiceAmountInr,
    paymentTier,
  };
}

async function ensureWorkspaceFile(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '[]\n', 'utf8');
  }
}

async function readAllWorkspacesUnsafe(filePath: string): Promise<PilotWorkspaceSnapshot[]> {
  await ensureWorkspaceFile(filePath);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as PilotWorkspaceSnapshot[]).map((w) =>
      normalizeWorkspaceRetentionSnapshot(w)
    );
  } catch {
    return [];
  }
}

async function writeAllWorkspacesUnsafe(
  filePath: string,
  records: PilotWorkspaceSnapshot[]
): Promise<void> {
  await ensureWorkspaceFile(filePath);
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
  await fs.writeFile(tempPath, JSON.stringify(records, null, 2) + '\n', 'utf8');
  await fs.rename(tempPath, filePath);
}

/**
 * Serialized read-modify-write helper for pilot_workspaces.json used by dataPurgeEngine.ts.
 */
export async function withWorkspaceStoreLock<T>(
  filePath: string = DEFAULT_WORKSPACES_FILE_PATH,
  fn: (
    records: PilotWorkspaceSnapshot[],
    save: (nextRecords: PilotWorkspaceSnapshot[]) => Promise<void>
  ) => Promise<T>
): Promise<T> {
  return withSerializedLock(filePath, async () => {
    const records = await readAllWorkspacesUnsafe(filePath);
    const save = async (nextRecords: PilotWorkspaceSnapshot[]) => {
      await writeAllWorkspacesUnsafe(
        filePath,
        nextRecords.map((w) => normalizeWorkspaceRetentionSnapshot(w))
      );
    };
    return fn(records, save);
  });
}

/**
 * Creates and persists a new server-backed Pilot Audit Workspace Snapshot (P1 + optional P2, P3, P4).
 */
export async function createPilotWorkspaceSnapshot(
  input: CreatePilotWorkspaceInput,
  filePath: string = DEFAULT_WORKSPACES_FILE_PATH
): Promise<PilotWorkspaceSnapshot> {
  const validation = validatePilotWorkspacePayload(input);
  if (!validation.ok || !validation.data) {
    throw new Error(validation.error || 'Invalid Pilot Workspace input');
  }

  const valid = validation.data;
  const {
    summaryMetrics,
    multiModuleSummary,
    ownerReport,
    evaluatedSkus,
    evaluatedP2Dispatches,
    evaluatedP3Trips,
    evaluatedP4Bins,
  } = computePilotWorkspaceAnalytics(valid.skus, valid.rules, {
    p2Dispatches: valid.p2Dispatches,
    p2Rules: valid.p2Rules,
    p3FreightTrips: valid.p3FreightTrips,
    p3Rules: valid.p3Rules,
    p4WarehouseBins: valid.p4WarehouseBins,
    p4Rules: valid.p4Rules,
    excludeReserveSpares: valid.excludeReserveSpares,
  });

  return withSerializedLock(filePath, async () => {
    const existing = await readAllWorkspacesUnsafe(filePath);
    const now = new Date();
    const isoNow = now.toISOString();
    const retentionPolicyDays = DEFAULT_RETENTION_POLICY_DAYS;
    const retentionExpiresAt = new Date(
      now.getTime() + retentionPolicyDays * 24 * 60 * 60 * 1000
    ).toISOString();

    let workspaceId = generateWorkspaceId(now);
    while (existing.some((w) => w.workspaceId === workspaceId)) {
      workspaceId = generateWorkspaceId(now);
    }

    const shareToken = generateShareToken();

    const snapshot: PilotWorkspaceSnapshot = normalizeWorkspaceRetentionSnapshot({
      workspaceId,
      shareToken,
      createdAt: isoNow,
      updatedAt: isoNow,
      companyName: valid.companyName,
      plantLocation: valid.plantLocation,
      ...(valid.leadId ? { leadId: valid.leadId } : {}),
      preparedBy: valid.preparedBy || 'C. Jones Snowin',
      executiveNotes: valid.executiveNotes,
      rules: valid.rules,
      summaryMetrics,
      multiModuleSummary,
      ownerReport,
      evaluatedSkus,
      ...(evaluatedP2Dispatches ? { evaluatedP2Dispatches } : {}),
      ...(evaluatedP3Trips ? { evaluatedP3Trips } : {}),
      ...(evaluatedP4Bins ? { evaluatedP4Bins } : {}),
      skus: evaluatedSkus,
      p2Dispatches: evaluatedP2Dispatches || [],
      p3FreightTrips: evaluatedP3Trips || [],
      p4WarehouseBins: evaluatedP4Bins || [],
      ...(valid.importRunId ? { importRunId: valid.importRunId } : {}),
      ...(valid.datasetSha256 ? { datasetSha256: valid.datasetSha256 } : {}),
      ...(valid.dataQualityOverview ? { dataQualityOverview: valid.dataQualityOverview } : {}),
      ...(valid.assumptionsAndExclusions
        ? { assumptionsAndExclusions: valid.assumptionsAndExclusions }
        : {}),
      retentionPolicyDays,
      retentionExpiresAt,
      retentionStatus: 'ACTIVE_RETENTION_WINDOW',
      ...(valid.commercialAccessMode ? { commercialAccessMode: valid.commercialAccessMode } : {}),
      ...(valid.invoiceId ? { invoiceId: valid.invoiceId } : {}),
      ...(valid.invoiceAmountInr ? { invoiceAmountInr: valid.invoiceAmountInr } : {}),
      ...(valid.paymentTier ? { paymentTier: valid.paymentTier } : {}),
    });

    existing.push(snapshot);
    await writeAllWorkspacesUnsafe(filePath, existing);
    void syncRecordToCloud('pilot_workspaces', snapshot.workspaceId, snapshot).catch(() => {});
    return snapshot;
  });
}

/**
 * Lists all saved server-side pilot audit snapshots sorted newest first.
 */
export async function listPilotWorkspaceSnapshots(
  filePath: string = DEFAULT_WORKSPACES_FILE_PATH
): Promise<PilotWorkspaceSnapshot[]> {
  return withSerializedLock(filePath, async () => {
    const records = await readAllWorkspacesUnsafe(filePath);
    return [...records].sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (diff !== 0) return diff;
      return b.workspaceId.localeCompare(a.workspaceId);
    });
  });
}

export const PUBLIC_DEMO_WORKSPACE_ID = 'AUDIT-DEMO-P1P4';
export const PUBLIC_DEMO_SHARE_TOKEN = 'operationalyst-public-demo-token';

/**
 * Builds the deterministic 4-pillar public demonstration snapshot (AUDIT-DEMO-P1P4)
 * from the canonical P1–P4 baseline datasets.
 */
export function buildPublicDemoMultiPillarSnapshot(): PilotWorkspaceSnapshot {
  const computed = computePilotWorkspaceAnalytics(AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES, {
    p2Dispatches: INITIAL_DISPATCHES,
    p2Rules: P2_DEFAULT_RULES,
    p3FreightTrips: INITIAL_TRIPS,
    p3Rules: P3_DEFAULT_RULES,
    p4WarehouseBins: INITIAL_SAMPLE_SKUS,
    p4Rules: P4_DEFAULT_RULES,
  });

  const demoExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  return normalizeWorkspaceRetentionSnapshot({
    workspaceId: PUBLIC_DEMO_WORKSPACE_ID,
    shareToken: PUBLIC_DEMO_SHARE_TOKEN,
    createdAt: '2026-10-12T09:00:00.000Z',
    updatedAt: '2026-10-12T09:00:00.000Z',
    companyName: 'Ambattur Fabrication Sample Plant (20-SKU Sandbox)',
    plantLocation: 'Ambattur Industrial Estate, Chennai',
    leadId: 'PILOT-DEMO-SANDBOX',
    preparedBy: 'C. Jones Snowin',
    executiveNotes:
      'Verified 4-pillar diagnostic walkthrough across P1 Dead Stock (₹2,23,110 across 8 SKUs), P2 Gate OTIF (50.0% pass rate across 18 dispatches), P3 Freight & Detention Audit (₹13,944 leakage across 12 trips), and P4 Warehouse Bin Variance (60.0% match accuracy with ₹24,240 ghost stock shortage).',
    rules: DEFAULT_RULES,
    summaryMetrics: computed.summaryMetrics,
    multiModuleSummary: computed.multiModuleSummary,
    ownerReport: computed.ownerReport,
    evaluatedSkus: computed.evaluatedSkus,
    evaluatedP2Dispatches: computed.evaluatedP2Dispatches,
    evaluatedP3Trips: computed.evaluatedP3Trips,
    evaluatedP4Bins: computed.evaluatedP4Bins,
    skus: computed.evaluatedSkus,
    p2Dispatches: computed.evaluatedP2Dispatches,
    p3FreightTrips: computed.evaluatedP3Trips,
    p4WarehouseBins: computed.evaluatedP4Bins,
    importRunId: 'IMPRUN-20261012-DEMO',
    datasetSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    dataQualityOverview: {
      totalSubmitted: 65,
      validAccepted: 65,
      quarantinedRejected: 0,
      p1Quality: { totalSubmitted: 20, validAccepted: 20, quarantinedRejected: 0, reserveSparesCount: 2, reserveSparesValueINR: 82500 },
      p2Quality: { totalSubmitted: 18, validAccepted: 18, quarantinedRejected: 0 },
      p3Quality: { totalSubmitted: 12, validAccepted: 12, quarantinedRejected: 0 },
      p4Quality: { totalSubmitted: 15, validAccepted: 15, quarantinedRejected: 0 },
      columnMappingUsed: {
        P1: { Part_ID: 'itemCode', Part_Description: 'itemName', Closing_Stock_Qty: 'qtyOnHand', Unit_Cost_INR: 'costRate', Last_Movement_Date: 'lastMovement' },
      },
    },
    assumptionsAndExclusions: {
      excludeReserveSpares: true,
      reserveSparesExcludedCount: 2,
      reserveSparesExcludedValue: 82500,
      dateReferenceUsed: DEFAULT_RULES.asOfDate,
      carryingCostPercentUsed: DEFAULT_RULES.holdingCostPercent,
      quarantineExclusionsCount: 0,
      anonymizationApplied: false,
      notes: [
        'As-of evaluation baseline date fixed at 2026-09-20 (Dead threshold > 180d, Slow threshold 91–180d).',
        'Annual inventory carrying cost rate modeled at 22% p.a. (14% working capital cost + 8% storage, insurance & obsolescence).',
        '2 critical machine / insurance spares (₹82,500 book value) tagged to retain as insurance spares rather than scrap.',
      ],
    },
    retentionPolicyDays: 14,
    retentionExpiresAt: demoExpiresAt,
    retentionStatus: 'ACTIVE_RETENTION_WINDOW',
  });
}

/**
 * Retrieves a single Pilot Audit Workspace Snapshot by workspaceId and verifies access via shareToken or isAdmin.
 */
export async function getAuthorizedPilotWorkspaceSnapshot(
  workspaceId: string,
  options: { shareToken?: string; isAdmin?: boolean },
  filePath: string = DEFAULT_WORKSPACES_FILE_PATH
): Promise<
  | { status: 'OK'; snapshot: PilotWorkspaceSnapshot }
  | { status: 'NOT_FOUND' }
  | { status: 'UNAUTHORIZED' }
> {
  if (workspaceId === PUBLIC_DEMO_WORKSPACE_ID) {
    const providedToken = options.shareToken?.trim() || '';
    if (options.isAdmin || providedToken === PUBLIC_DEMO_SHARE_TOKEN) {
      return { status: 'OK', snapshot: buildPublicDemoMultiPillarSnapshot() };
    }
    return { status: 'UNAUTHORIZED' };
  }

  return withSerializedLock(filePath, async () => {
    const records = await readAllWorkspacesUnsafe(filePath);
    const found = records.find((w) => w.workspaceId === workspaceId);
    if (!found) {
      return { status: 'NOT_FOUND' };
    }

    if (options.isAdmin) {
      return { status: 'OK', snapshot: found };
    }

    const providedToken = options.shareToken?.trim() || '';
    if (!providedToken || providedToken !== found.shareToken) {
      return { status: 'UNAUTHORIZED' };
    }

    return { status: 'OK', snapshot: found };
  });
}

export interface UpdateSnapshotRulesPayload {
  slowDays?: number;
  normalDays?: number;
  fastDays?: number;
  annualCarryingCostPercent?: number;
  targetRecoveryPercent?: number;
  excludeReserveSpares?: boolean;
  gracePeriodDays?: number;
  allowPartialShipments?: boolean;
  shortageTolerancePct?: number;
  maxOverchargePercent?: number;
  detentionThreshold?: number;
  maxAdvanceRatio?: number;
  highRiskValueThreshold?: number;
  highRiskPercentThreshold?: number;
  executiveNotes?: string;
}

/**
 * Updates and locks agreed scenario threshold rules into a Pilot Audit Workspace Snapshot on the server,
 * recomputing all P1–P4 summaries and updating Item 07 assumptionsAndExclusions.
 */
export async function updatePilotWorkspaceSnapshotRules(
  workspaceId: string,
  payload: UpdateSnapshotRulesPayload,
  filePath: string = DEFAULT_WORKSPACES_FILE_PATH
): Promise<{ status: 'OK'; snapshot: PilotWorkspaceSnapshot } | { status: 'NOT_FOUND' }> {
  return withSerializedLock(filePath, async () => {
    const records = await readAllWorkspacesUnsafe(filePath);
    let idx = records.findIndex((w) => w.workspaceId === workspaceId);

    if (idx === -1 && workspaceId === PUBLIC_DEMO_WORKSPACE_ID) {
      const demoSnap = buildPublicDemoMultiPillarSnapshot();
      records.push(demoSnap);
      idx = records.length - 1;
    }

    if (idx === -1) {
      return { status: 'NOT_FOUND' };
    }

    const current = records[idx];
    const updatedP1Rules: StockRuleConfig = {
      ...current.rules,
      ...(typeof payload.slowDays === 'number' && payload.slowDays >= 30
        ? { deadThresholdDays: Math.round(payload.slowDays) }
        : {}),
      ...(typeof payload.normalDays === 'number' && payload.normalDays >= 15
        ? { slowThresholdDays: Math.round(payload.normalDays) }
        : {}),
      ...(typeof payload.annualCarryingCostPercent === 'number' &&
      payload.annualCarryingCostPercent >= 1
        ? { holdingCostPercent: Math.round(payload.annualCarryingCostPercent) }
        : {}),
    };

    const excludeReserveSpares =
      typeof payload.excludeReserveSpares === 'boolean'
        ? payload.excludeReserveSpares
        : current.assumptionsAndExclusions?.excludeReserveSpares ?? true;

    const updatedP2Rules: P2RulesConfig = {
      ...P2_DEFAULT_RULES,
      graceHours:
        typeof payload.gracePeriodDays === 'number'
          ? Math.max(0, Math.round(payload.gracePeriodDays * 24))
          : P2_DEFAULT_RULES.graceHours,
      inFullCutoff:
        typeof payload.shortageTolerancePct === 'number'
          ? Math.max(0, 100 - payload.shortageTolerancePct)
          : P2_DEFAULT_RULES.inFullCutoff,
    };

    const updatedP3Rules: P3RulesConfig = {
      ...P3_DEFAULT_RULES,
    };

    const updatedP4Rules: P4RulesConfig = {
      ...P4_DEFAULT_RULES,
      shrinkTolerancePercent:
        typeof payload.highRiskPercentThreshold === 'number'
          ? payload.highRiskPercentThreshold
          : P4_DEFAULT_RULES.shrinkTolerancePercent,
    };

    const rawSkus: SKUItem[] = current.evaluatedSkus.map((s) => ({
      id: s.id,
      itemCode: s.itemCode,
      itemName: s.itemName,
      category: s.category,
      qtyOnHand: s.qtyOnHand,
      costRate: s.costRate,
      lastMovement: s.lastMovement,
      isReserveSpare: s.isReserveSpare,
    }));

    const recomputed = computePilotWorkspaceAnalytics(rawSkus, updatedP1Rules, {
      p2Dispatches: current.evaluatedP2Dispatches || INITIAL_DISPATCHES,
      p2Rules: updatedP2Rules,
      p3FreightTrips: current.evaluatedP3Trips || INITIAL_TRIPS,
      p3Rules: updatedP3Rules,
      p4WarehouseBins: current.evaluatedP4Bins || INITIAL_SAMPLE_SKUS,
      p4Rules: updatedP4Rules,
      excludeReserveSpares,
    });

    const reserveCount =
      current.assumptionsAndExclusions?.reserveSparesExcludedCount ??
      current.dataQualityOverview?.reserveSparesFlaggedCount ??
      0;
    const reserveVal =
      current.assumptionsAndExclusions?.reserveSparesExcludedValue ??
      current.dataQualityOverview?.reserveSparesExcludedValue ??
      0;

    const updatedAssumptions: SnapshotAssumptionsAndExclusions = {
      ...(current.assumptionsAndExclusions || {
        excludeReserveSpares,
        reserveSparesExcludedCount: reserveCount,
        reserveSparesExcludedValue: reserveVal,
        dateReferenceUsed: updatedP1Rules.asOfDate,
        carryingCostPercentUsed: updatedP1Rules.holdingCostPercent,
        quarantineExclusionsCount: current.dataQualityOverview?.quarantinedRejected ?? 0,
        anonymizationApplied: false,
        notes: [],
      }),
      excludeReserveSpares,
      dateReferenceUsed: updatedP1Rules.asOfDate,
      carryingCostPercentUsed: updatedP1Rules.holdingCostPercent,
      deadThresholdDaysUsed: updatedP1Rules.deadThresholdDays,
      slowThresholdDaysUsed: updatedP1Rules.slowThresholdDays,
      holdingCostPercentUsed: updatedP1Rules.holdingCostPercent,
      notes: [
        `Agreed Scenario Rules Locked on ${new Date().toISOString().slice(0, 10)}: Dead Stock > ${updatedP1Rules.deadThresholdDays}d, Slow-Moving > ${updatedP1Rules.slowThresholdDays}d, Carrying Cost ${updatedP1Rules.holdingCostPercent}% p.a.`,
        excludeReserveSpares
          ? `Item 07 Reserve Spares Exclusion active (${reserveCount} spares, ₹${reserveVal.toLocaleString('en-IN')} protected from scrap).`
          : `Item 07 Reserve Spares Exclusion disabled — all SKUs evaluated under standard movement rules.`,
      ],
    };

    const updatedSnapshot: PilotWorkspaceSnapshot = {
      ...current,
      updatedAt: new Date().toISOString(),
      rules: updatedP1Rules,
      summaryMetrics: recomputed.summaryMetrics,
      multiModuleSummary: recomputed.multiModuleSummary,
      ownerReport: recomputed.ownerReport,
      evaluatedSkus: recomputed.evaluatedSkus,
      ...(recomputed.evaluatedP2Dispatches
        ? { evaluatedP2Dispatches: recomputed.evaluatedP2Dispatches }
        : {}),
      ...(recomputed.evaluatedP3Trips
        ? { evaluatedP3Trips: recomputed.evaluatedP3Trips }
        : {}),
      ...(recomputed.evaluatedP4Bins
        ? { evaluatedP4Bins: recomputed.evaluatedP4Bins }
        : {}),
      assumptionsAndExclusions: updatedAssumptions,
      ...(payload.executiveNotes ? { executiveNotes: payload.executiveNotes } : {}),
    };

    records[idx] = updatedSnapshot;
    await writeAllWorkspacesUnsafe(filePath, records);
    void syncRecordToCloud('pilot_workspaces', updatedSnapshot.workspaceId, updatedSnapshot).catch(() => {});
    return { status: 'OK', snapshot: updatedSnapshot };
  });
}

export interface SubmitPaymentUtrPayload {
  utrNumber: string;
  paidByEmail?: string;
  tier?: 'TIER2_FULL_AUDIT' | 'TIER3_MONTHLY_RETAINER';
  shareToken?: string;
  isAdmin?: boolean;
}

/**
 * Validates and records a client-submitted 12-digit UTR / Bank Reference number on a workspace snapshot,
 * transitioning commercialAccessMode from TEASER_LOCKED to UTR_PENDING_VERIFICATION.
 */
export async function submitPilotWorkspacePaymentUtr(
  workspaceId: string,
  payload: SubmitPaymentUtrPayload,
  filePath: string = DEFAULT_WORKSPACES_FILE_PATH
): Promise<
  | { ok: true; status: 'OK'; snapshot: PilotWorkspaceSnapshot; error?: string }
  | { ok: false; status: 'NOT_FOUND' | 'UNAUTHORIZED' | 'INVALID_UTR'; error: string }
> {
  const cleanUtr = sanitizeText(payload?.utrNumber).replace(/\s+/g, '').toUpperCase();
  if (!cleanUtr || cleanUtr.length < 6 || cleanUtr.length > 32 || !/^[A-Z0-9_-]+$/.test(cleanUtr)) {
    return {
      ok: false,
      status: 'INVALID_UTR',
      error: 'Please enter a valid 12-digit UTR or Bank Reference number (6–32 alphanumeric characters).',
    };
  }

  return withSerializedLock(filePath, async () => {
    const records = await readAllWorkspacesUnsafe(filePath);
    let idx = records.findIndex((w) => w.workspaceId === workspaceId);

    if (idx === -1 && workspaceId === PUBLIC_DEMO_WORKSPACE_ID) {
      const demoSnap = buildPublicDemoMultiPillarSnapshot();
      records.push(demoSnap);
      idx = records.length - 1;
    }

    if (idx === -1) {
      return {
        ok: false,
        status: 'NOT_FOUND',
        error: `Pilot Audit Workspace '${workspaceId}' not found.`,
      };
    }

    const current = records[idx];
    if (
      payload.shareToken !== undefined &&
      !payload.isAdmin &&
      workspaceId !== PUBLIC_DEMO_WORKSPACE_ID
    ) {
      const providedToken = payload.shareToken.trim();
      if (!providedToken || providedToken !== current.shareToken) {
        return {
          ok: false,
          status: 'UNAUTHORIZED',
          error: 'Unauthorized: Valid walkthrough shareToken is required to submit UTR payment reference.',
        };
      }
    }

    const tier: 'TIER2_FULL_AUDIT' | 'TIER3_MONTHLY_RETAINER' =
      payload.tier === 'TIER3_MONTHLY_RETAINER' ? 'TIER3_MONTHLY_RETAINER' : 'TIER2_FULL_AUDIT';
    const cleanEmail = sanitizeText(payload.paidByEmail);

    const updatedSnapshot = normalizeWorkspaceRetentionSnapshot({
      ...current,
      updatedAt: new Date().toISOString(),
      commercialAccessMode: 'UTR_PENDING_VERIFICATION',
      submittedUtrNumber: cleanUtr,
      ...(cleanEmail ? { paidByEmail: cleanEmail } : {}),
      paymentTier: tier,
      invoiceAmountInr: tier === 'TIER3_MONTHLY_RETAINER' ? 24999 : 14999,
    });

    records[idx] = updatedSnapshot;
    await writeAllWorkspacesUnsafe(filePath, records);
    void syncRecordToCloud('pilot_workspaces', updatedSnapshot.workspaceId, updatedSnapshot).catch(() => {});
    return { ok: true, status: 'OK', snapshot: updatedSnapshot };
  });
}

/**
 * Founder 1-click verification of bank credit: unlocks commercialAccessMode to FULL_UNLOCKED
 * and stamps paymentVerifiedAt.
 */
export async function verifyPilotWorkspacePaymentUnlock(
  workspaceId: string,
  options?: { verifiedBy?: string; utrNumber?: string },
  filePath: string = DEFAULT_WORKSPACES_FILE_PATH
): Promise<
  | { ok: true; status: 'OK'; snapshot: PilotWorkspaceSnapshot; error?: string }
  | { ok: false; status: 'NOT_FOUND'; error: string }
> {
  return withSerializedLock(filePath, async () => {
    const records = await readAllWorkspacesUnsafe(filePath);
    let idx = records.findIndex((w) => w.workspaceId === workspaceId);

    if (idx === -1 && workspaceId === PUBLIC_DEMO_WORKSPACE_ID) {
      const demoSnap = buildPublicDemoMultiPillarSnapshot();
      records.push(demoSnap);
      idx = records.length - 1;
    }

    if (idx === -1) {
      return {
        ok: false,
        status: 'NOT_FOUND',
        error: `Pilot Audit Workspace '${workspaceId}' not found.`,
      };
    }

    const current = records[idx];
    const nowIso = new Date().toISOString();
    const overrideUtr = sanitizeText(options?.utrNumber).replace(/\s+/g, '').toUpperCase();

    const updatedSnapshot = normalizeWorkspaceRetentionSnapshot({
      ...current,
      updatedAt: nowIso,
      commercialAccessMode: 'FULL_UNLOCKED',
      paymentVerifiedAt: nowIso,
      ...(overrideUtr
        ? { submittedUtrNumber: overrideUtr }
        : current.submittedUtrNumber
        ? { submittedUtrNumber: current.submittedUtrNumber }
        : {}),
    });

    records[idx] = updatedSnapshot;
    await writeAllWorkspacesUnsafe(filePath, records);
    void syncRecordToCloud('pilot_workspaces', updatedSnapshot.workspaceId, updatedSnapshot).catch(() => {});
    return { ok: true, status: 'OK', snapshot: updatedSnapshot };
  });
}

