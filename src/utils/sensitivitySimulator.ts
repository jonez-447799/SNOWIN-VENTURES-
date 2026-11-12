/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure, deterministic 4-Pillar Row-Traceable Sensitivity Simulator (Phase 7).
 * Compares Baseline Rules against Simulated Scenario Rules across P1–P4
 * using the canonical engines (evaluateStockEngine, calculateOTIFMetrics,
 * calculateAuditMetrics, computeSummary) and enforces Item 07 Reserve Spares protection.
 */

import type { StockItem, RulesConfig as P1RulesConfig } from '../project1/types.ts';
import { evaluateStockEngine } from '../project1/utils/calculations.ts';
import {
  AMBATTUR_FABRICATION_SAMPLE,
  DEFAULT_RULES as P1_DEFAULT_RULES,
} from '../project1/data/initialData.ts';

import type { DispatchRow, RulesConfig as P2RulesConfig } from '../project2/types/otif.ts';
import { calculateOTIFMetrics, calculateRowStatus } from '../project2/utils/otifCalculator.ts';
import {
  INITIAL_DISPATCHES as P2_DEFAULT_DISPATCHES,
  INITIAL_RULES as P2_DEFAULT_RULES,
} from '../project2/data/initialData.ts';

import type { Trip, RulesConfig as P3RulesConfig } from '../project3/types/freight.ts';
import { calculateAuditMetrics } from '../project3/utils/auditCalculations.ts';
import {
  INITIAL_TRIPS as P3_DEFAULT_TRIPS,
  DEFAULT_RULES as P3_DEFAULT_RULES,
} from '../project3/data/defaultData.ts';

import type { AuditItem, AuditRules as P4RulesConfig } from '../project4/types/audit.ts';
import { computeSummary, calculateItemFields } from '../project4/utils/auditCalculations.ts';
import {
  INITIAL_SAMPLE_SKUS as P4_DEFAULT_BINS,
  DEFAULT_RULES as P4_DEFAULT_RULES,
} from '../project4/data/sampleData.ts';

import { DEFAULT_RESERVE_SPARE_KEYWORDS } from './importValidation.ts';

export type SensitivityPresetId =
  | 'STRICT_CFO_AUDIT'
  | 'STANDARD_BASELINE'
  | 'LENIENT_PLANT_FLOOR';

export interface SensitivityScenarioConfig {
  // P1 Inventory Parameters
  fastDays: number; // default 30
  normalDays: number; // default 90 (slowThresholdDays)
  slowDays: number; // default 180 (deadThresholdDays — items >slowDays are Dead Stock)
  annualCarryingCostPercent: number; // default 24
  targetRecoveryPercent: number; // default 35
  excludeReserveSpares: boolean; // default true — Item 07 protection
  asOfDate?: string; // optional override, defaults to baseline asOfDate ('2026-09-20')

  // P2 OTIF Dispatch Parameters
  gracePeriodDays: number; // default 0
  allowPartialShipments: boolean; // default false
  shortageTolerancePct: number; // default 0 (0..100)

  // P3 Freight Audit Parameters
  maxOverchargePercent: number; // default 15
  detentionThreshold: number; // default 10000 (INR threshold or detention sensitivity)
  maxAdvanceRatio: number; // default 0.5

  // P4 Warehouse Bins Parameters
  highRiskValueThreshold: number; // default 5000
  highRiskPercentThreshold: number; // default 5
}

export const DEFAULT_SENSITIVITY_CONFIG: SensitivityScenarioConfig = {
  fastDays: 30,
  normalDays: 90,
  slowDays: 180,
  annualCarryingCostPercent: 22,
  targetRecoveryPercent: 35,
  excludeReserveSpares: true,
  gracePeriodDays: 0,
  allowPartialShipments: false,
  shortageTolerancePct: 0,
  maxOverchargePercent: 15,
  detentionThreshold: 10000,
  maxAdvanceRatio: 0.5,
  highRiskValueThreshold: 5000,
  highRiskPercentThreshold: 5,
};

export const SENSITIVITY_PRESETS: Record<
  SensitivityPresetId,
  {
    id: SensitivityPresetId;
    label: string;
    subtitle: string;
    config: SensitivityScenarioConfig;
  }
> = {
  STRICT_CFO_AUDIT: {
    id: 'STRICT_CFO_AUDIT',
    label: 'Strict CFO Working-Capital Audit',
    subtitle: 'Dead >120d · Slow >60d · 24% Carrying Cost · 0d OTIF Grace · >5% Freight Overcharge Flag · ≥₹1,500 Bin Risk',
    config: {
      fastDays: 20,
      normalDays: 60,
      slowDays: 120,
      annualCarryingCostPercent: 24,
      targetRecoveryPercent: 45,
      excludeReserveSpares: true,
      gracePeriodDays: 0,
      allowPartialShipments: false,
      shortageTolerancePct: 0,
      maxOverchargePercent: 5,
      detentionThreshold: 1000,
      maxAdvanceRatio: 0.4,
      highRiskValueThreshold: 1500,
      highRiskPercentThreshold: 2,
    },
  },
  STANDARD_BASELINE: {
    id: 'STANDARD_BASELINE',
    label: 'Standard Industrial Baseline',
    subtitle: 'Dead >180d · Slow >90d · 22% Carrying Cost · 0d OTIF Grace · >15% Freight Overcharge Flag · ≥₹5,000 Bin Risk',
    config: {
      ...DEFAULT_SENSITIVITY_CONFIG,
    },
  },
  LENIENT_PLANT_FLOOR: {
    id: 'LENIENT_PLANT_FLOOR',
    label: 'Lenient Shop-Floor Operating Buffer',
    subtitle: 'Dead >270d · Slow >120d · 18% Carrying Cost · 2d OTIF Grace (10% Short Tol.) · >25% Freight Flag · ≥₹12,000 Bin Risk',
    config: {
      fastDays: 45,
      normalDays: 120,
      slowDays: 270,
      annualCarryingCostPercent: 18,
      targetRecoveryPercent: 25,
      excludeReserveSpares: true,
      gracePeriodDays: 2,
      allowPartialShipments: true,
      shortageTolerancePct: 10,
      maxOverchargePercent: 25,
      detentionThreshold: 25000,
      maxAdvanceRatio: 0.7,
      highRiskValueThreshold: 12000,
      highRiskPercentThreshold: 10,
    },
  },
};

export interface ReclassifiedSkuRow {
  partId: string;
  description: string;
  fromBucket: string;
  toBucket: string;
  totalValueInr: number;
  daysInactive: number;
  isReserveSpare: boolean;
}

export interface ReclassifiedDispatchRow {
  dispatchId: string;
  customerName: string;
  fromStatus: string;
  toStatus: string;
  rawDelayDays: number;
  shortagePct: number;
}

export interface ReclassifiedFreightTripRow {
  lrNumber: string;
  transporter: string;
  fromFlags: string[];
  toFlags: string[];
  overchargeInr: number;
  detentionInr: number;
}

export interface ReclassifiedBinRow {
  binId: string;
  partId: string;
  fromRisk: string;
  toRisk: string;
  varianceValueInr: number;
  variancePct: number;
}

export interface FourPillarSensitivityInput {
  skus?: StockItem[];
  p1Rules?: Partial<P1RulesConfig>;
  p2Dispatches?: DispatchRow[];
  p2Rules?: Partial<P2RulesConfig>;
  p3FreightTrips?: Trip[];
  p3Rules?: Partial<P3RulesConfig>;
  p4WarehouseBins?: AuditItem[];
  p4Rules?: Partial<P4RulesConfig>;
  baselineConfig?: Partial<SensitivityScenarioConfig>;
  scenarioConfig?: Partial<SensitivityScenarioConfig>;
  preset?: SensitivityPresetId;
}

export interface FourPillarSensitivityResult {
  baselineConfig: SensitivityScenarioConfig;
  scenarioConfig: SensitivityScenarioConfig;

  // Top-level P1 Delta & Item 07 Split
  baselineDeadStockInr: number;
  scenarioDeadStockInr: number;
  deadStockDeltaInr: number;
  liquidatableDeadStockInr: number;
  reserveSparesProtectedInr: number;
  reserveSparesProtectedCount: number;
  baselineSlowMovingInr: number;
  scenarioSlowMovingInr: number;
  baselineAnnualCarryingDrainInr: number;
  scenarioAnnualCarryingDrainInr: number;
  annualCarryingDrainDeltaInr: number;
  baselineTargetCashReleaseInr: number;
  scenarioTargetCashReleaseInr: number;
  targetCashReleaseDeltaInr: number;
  reclassifiedSkus: ReclassifiedSkuRow[];

  // Top-level P2 Delta
  baselineOtifPct: number;
  scenarioOtifPct: number;
  otifPctDelta: number;
  baselinePasses: number;
  scenarioPasses: number;
  reclassifiedDispatches: ReclassifiedDispatchRow[];

  // Top-level P3 Delta
  baselineLeakInr: number;
  scenarioLeakInr: number;
  leakDeltaInr: number;
  baselineFlaggedTripsCount: number;
  scenarioFlaggedTripsCount: number;
  reclassifiedFreightTrips: ReclassifiedFreightTripRow[];

  // Top-level P4 Delta
  baselineBinAccuracyPct: number;
  scenarioBinAccuracyPct: number;
  baselineHighRiskBinsCount: number;
  scenarioHighRiskBinsCount: number;
  highRiskBinsDelta: number;
  reclassifiedBins: ReclassifiedBinRow[];

  // Structured Pillar Summaries for UI & API consumers
  p1: {
    totalBookValueInr: number;
    baselineDeadStockInr: number;
    scenarioDeadStockInr: number;
    deadStockDeltaInr: number;
    liquidatableDeadStockInr: number;
    reserveSparesProtectedInr: number;
    reserveSparesProtectedCount: number;
    baselineSlowMovingInr: number;
    scenarioSlowMovingInr: number;
    annualCarryingDrainDeltaInr: number;
    targetCashReleaseDeltaInr: number;
    reclassifiedSkus: ReclassifiedSkuRow[];
  };
  p2: {
    totalDispatches: number;
    baselineOtifPct: number;
    scenarioOtifPct: number;
    otifPctDelta: number;
    baselinePasses: number;
    scenarioPasses: number;
    reclassifiedDispatches: ReclassifiedDispatchRow[];
  };
  p3: {
    totalTrips: number;
    baselineLeakInr: number;
    scenarioLeakInr: number;
    leakDeltaInr: number;
    baselineFlaggedTripsCount: number;
    scenarioFlaggedTripsCount: number;
    reclassifiedFreightTrips: ReclassifiedFreightTripRow[];
  };
  p4: {
    totalBins: number;
    baselineBinAccuracyPct: number;
    scenarioBinAccuracyPct: number;
    baselineHighRiskBinsCount: number;
    scenarioHighRiskBinsCount: number;
    highRiskBinsDelta: number;
    reclassifiedBins: ReclassifiedBinRow[];
  };
}

function detectSkuReserveSpare(sku: StockItem): boolean {
  if (sku.isReserveSpare === true) return true;
  const hay = `${sku.itemName || ''} ${sku.category || ''} ${sku.actionStatus || ''}`.toUpperCase();
  if (hay.includes('[RESERVE SPARE]') || hay.includes('CRITICAL_RESERVE_SPARE')) {
    return true;
  }
  return DEFAULT_RESERVE_SPARE_KEYWORDS.some((kw) => hay.includes(kw.toUpperCase()));
}

function classifyP1Bucket(
  sku: StockItem,
  daysIdle: number,
  config: SensitivityScenarioConfig,
  isReserveSpare: boolean
): string {
  if (daysIdle > config.slowDays) {
    if (config.excludeReserveSpares && isReserveSpare) {
      return 'Protected Reserve Spare (Item 07)';
    }
    return 'Dead';
  }
  if (daysIdle > config.normalDays) {
    return 'Slow';
  }
  if (daysIdle <= config.fastDays) {
    return 'Fast-Moving';
  }
  return 'Moving';
}

function evaluateP3TripScenarioFlags(
  trip: Trip,
  bestRateForLane: number,
  config: SensitivityScenarioConfig,
  baseDetentionRatePerHour: number
): {
  flags: string[];
  overchargeInr: number;
  detentionInr: number;
  effectiveLeakInr: number;
} {
  const tonnes = trip.weightKg > 0 ? trip.weightKg / 1000 : 0;
  const isClean = trip.split === 'No' && trip.weightKg >= 8000;
  const expectedBill = isClean && tonnes > 0 && bestRateForLane > 0 ? bestRateForLane * tonnes : trip.bill;
  const rawOverchargeInr = isClean && tonnes > 0 ? Math.max(0, Math.round(trip.bill - expectedBill)) : 0;
  const overchargePct = expectedBill > 0 ? (rawOverchargeInr / expectedBill) * 100 : 0;

  // Scale detention rate based on detentionThreshold sensitivity relative to standard 10000 baseline
  // When detentionThreshold is stricter (e.g. 1000), all waitHours detention is flagged; when lenient (e.g. 25000), only high detention or reduced rate applies
  const rawDetentionInr = Math.round(trip.waitHours * baseDetentionRatePerHour);
  const flags: string[] = [];

  if (rawOverchargeInr > 0 && overchargePct >= config.maxOverchargePercent) {
    flags.push('OVERCHARGE_RATE_LEAK');
  }

  // Flag detention if rawDetentionInr > 0 and either trip bill + detention exceeds threshold or waitHours > 0 with threshold check
  const detentionTriggerFloor = Math.min(2500, Math.round(config.detentionThreshold * 0.15));
  if (rawDetentionInr > 0 && rawDetentionInr >= detentionTriggerFloor) {
    flags.push('GATE_DETENTION_LEAK');
  }

  // Advance ratio flag check (simulated deterministic advance estimate from sourceDoc/trip or split status)
  const impliedAdvanceRatio = trip.split === 'Yes' ? 0.62 : trip.emptyReturn === 'Yes' ? 0.55 : 0.35;
  if (impliedAdvanceRatio > config.maxAdvanceRatio) {
    flags.push('EXCESS_ADVANCE_RATIO');
  }

  const countedOvercharge = flags.includes('OVERCHARGE_RATE_LEAK') ? rawOverchargeInr : 0;
  const countedDetention = flags.includes('GATE_DETENTION_LEAK') ? rawDetentionInr : 0;

  return {
    flags: flags.length > 0 ? flags : ['CLEAN'],
    overchargeInr: countedOvercharge,
    detentionInr: countedDetention,
    effectiveLeakInr: countedOvercharge + countedDetention,
  };
}

function classifyP4BinRisk(
  item: AuditItem,
  config: SensitivityScenarioConfig
): {
  riskTier: 'HIGH_RISK' | 'MODERATE_VARIANCE' | 'MATCHED';
  varianceValueInr: number;
  variancePct: number;
} {
  const gapQty = item.physicalQty - item.systemQty;
  const varianceValueInr = Math.round(Math.abs(gapQty) * item.cost);
  const variancePct =
    item.systemQty > 0
      ? Math.round((Math.abs(gapQty) / item.systemQty) * 1000) / 10
      : gapQty !== 0
      ? 100
      : 0;

  if (gapQty === 0) {
    return { riskTier: 'MATCHED', varianceValueInr: 0, variancePct: 0 };
  }

  if (
    varianceValueInr >= config.highRiskValueThreshold ||
    variancePct >= config.highRiskPercentThreshold
  ) {
    return { riskTier: 'HIGH_RISK', varianceValueInr, variancePct };
  }

  return { riskTier: 'MODERATE_VARIANCE', varianceValueInr, variancePct };
}

/**
 * Runs a deterministic 4-pillar sensitivity comparison between Baseline Rules and Scenario Rules.
 * Accepts either a full FourPillarSensitivityInput object or a partial SensitivityScenarioConfig.
 */
export function runFourPillarSensitivity(
  inputOrScenario: FourPillarSensitivityInput | Partial<SensitivityScenarioConfig> = {},
  optionalScenarioOverride?: Partial<SensitivityScenarioConfig>
): FourPillarSensitivityResult {
  const isFullInput =
    'skus' in inputOrScenario ||
    'p2Dispatches' in inputOrScenario ||
    'p3FreightTrips' in inputOrScenario ||
    'p4WarehouseBins' in inputOrScenario ||
    'baselineConfig' in inputOrScenario ||
    'scenarioConfig' in inputOrScenario ||
    'preset' in inputOrScenario;

  const fullInput: FourPillarSensitivityInput = isFullInput
    ? (inputOrScenario as FourPillarSensitivityInput)
    : {
        scenarioConfig: inputOrScenario as Partial<SensitivityScenarioConfig>,
      };

  const presetConfig = fullInput.preset
    ? SENSITIVITY_PRESETS[fullInput.preset]?.config
    : undefined;

  const skus =
    Array.isArray(fullInput.skus) && fullInput.skus.length > 0
      ? fullInput.skus
      : AMBATTUR_FABRICATION_SAMPLE;
  const p2Dispatches =
    Array.isArray(fullInput.p2Dispatches) && fullInput.p2Dispatches.length > 0
      ? fullInput.p2Dispatches
      : P2_DEFAULT_DISPATCHES;
  const p3Trips =
    Array.isArray(fullInput.p3FreightTrips) && fullInput.p3FreightTrips.length > 0
      ? fullInput.p3FreightTrips
      : P3_DEFAULT_TRIPS;
  const p4Bins =
    Array.isArray(fullInput.p4WarehouseBins) && fullInput.p4WarehouseBins.length > 0
      ? fullInput.p4WarehouseBins
      : P4_DEFAULT_BINS;

  const baseP1Rules: P1RulesConfig = {
    ...P1_DEFAULT_RULES,
    ...(fullInput.p1Rules || {}),
  };

  const baselineConfig: SensitivityScenarioConfig = {
    ...DEFAULT_SENSITIVITY_CONFIG,
    normalDays: baseP1Rules.slowThresholdDays ?? DEFAULT_SENSITIVITY_CONFIG.normalDays,
    slowDays: baseP1Rules.deadThresholdDays ?? DEFAULT_SENSITIVITY_CONFIG.slowDays,
    annualCarryingCostPercent:
      fullInput.p1Rules?.holdingCostPercent && fullInput.p1Rules.holdingCostPercent !== 18
        ? fullInput.p1Rules.holdingCostPercent
        : DEFAULT_SENSITIVITY_CONFIG.annualCarryingCostPercent,
    asOfDate: baseP1Rules.asOfDate || P1_DEFAULT_RULES.asOfDate,
    ...(fullInput.baselineConfig || {}),
  };

  const scenarioConfig: SensitivityScenarioConfig = {
    ...baselineConfig,
    ...(presetConfig || {}),
    ...(fullInput.scenarioConfig || {}),
    ...(optionalScenarioOverride || {}),
  };

  // ============================================================================
  // PILLAR 1: INVENTORY DEAD STOCK & ITEM 07 RESERVE SPARES PROTECTION
  // ============================================================================
  const baselineP1EngineRules: P1RulesConfig = {
    ...baseP1Rules,
    asOfDate: baselineConfig.asOfDate || baseP1Rules.asOfDate,
    deadThresholdDays: baselineConfig.slowDays,
    slowThresholdDays: baselineConfig.normalDays,
    holdingCostPercent: baselineConfig.annualCarryingCostPercent,
  };

  const scenarioP1EngineRules: P1RulesConfig = {
    ...baseP1Rules,
    asOfDate: scenarioConfig.asOfDate || baseP1Rules.asOfDate,
    deadThresholdDays: scenarioConfig.slowDays,
    slowThresholdDays: scenarioConfig.normalDays,
    holdingCostPercent: scenarioConfig.annualCarryingCostPercent,
  };

  const baseEvalSkus = evaluateStockEngine(skus, baselineP1EngineRules);
  const scenEvalSkus = evaluateStockEngine(skus, scenarioP1EngineRules);

  let totalBookValueInr = 0;
  let baselineDeadStockInr = 0;
  let baselineSlowMovingInr = 0;
  let scenarioGrossDeadStockInr = 0;
  let scenarioSlowMovingInr = 0;
  let reserveSparesProtectedInr = 0;
  let reserveSparesProtectedCount = 0;

  const reclassifiedSkus: ReclassifiedSkuRow[] = [];

  for (let i = 0; i < skus.length; i++) {
    const rawSku = skus[i];
    const baseSku = baseEvalSkus[i];
    const scenSku = scenEvalSkus[i];

    const valInr = Math.round(
      scenSku.closingValue ?? rawSku.qtyOnHand * rawSku.costRate
    );
    totalBookValueInr += valInr;

    const baseDays = baseSku.daysIdle ?? 0;
    const scenDays = scenSku.daysIdle ?? 0;
    const isReserve = detectSkuReserveSpare(rawSku);

    if (baseSku.status === 'Dead') {
      baselineDeadStockInr += valInr;
    } else if (baseSku.status === 'Slow') {
      baselineSlowMovingInr += valInr;
    }

    if (scenSku.status === 'Dead') {
      scenarioGrossDeadStockInr += valInr;
      if (scenarioConfig.excludeReserveSpares && isReserve) {
        reserveSparesProtectedInr += valInr;
        reserveSparesProtectedCount++;
      }
    } else if (scenSku.status === 'Slow') {
      scenarioSlowMovingInr += valInr;
    }

    const fromBucket = classifyP1Bucket(rawSku, baseDays, baselineConfig, isReserve);
    const toBucket = classifyP1Bucket(rawSku, scenDays, scenarioConfig, isReserve);

    // Record reclassification if status/bucket changed OR if it is a protected reserve spare in Dead threshold
    if (
      fromBucket !== toBucket ||
      baseSku.status !== scenSku.status ||
      (scenSku.status === 'Dead' && scenarioConfig.excludeReserveSpares && isReserve)
    ) {
      reclassifiedSkus.push({
        partId: rawSku.itemCode,
        description: rawSku.itemName,
        fromBucket: baseSku.status || fromBucket,
        toBucket,
        totalValueInr: valInr,
        daysInactive: scenDays,
        isReserveSpare: isReserve,
      });
    }
  }

  const liquidatableDeadStockInr = Math.max(
    0,
    scenarioGrossDeadStockInr - (scenarioConfig.excludeReserveSpares ? reserveSparesProtectedInr : 0)
  );
  const scenarioDeadStockInr = scenarioGrossDeadStockInr;
  const deadStockDeltaInr = scenarioDeadStockInr - baselineDeadStockInr;

  const baselineAnnualCarryingDrainInr = Math.round(
    (baselineDeadStockInr * baselineConfig.annualCarryingCostPercent) / 100
  );
  const scenarioAnnualCarryingDrainInr = Math.round(
    (liquidatableDeadStockInr * scenarioConfig.annualCarryingCostPercent) / 100
  );
  const annualCarryingDrainDeltaInr =
    scenarioAnnualCarryingDrainInr - baselineAnnualCarryingDrainInr;

  const baselineTargetCashReleaseInr = Math.round(
    (baselineDeadStockInr * baselineConfig.targetRecoveryPercent) / 100 +
      baselineSlowMovingInr * 0.3
  );
  const scenarioTargetCashReleaseInr = Math.round(
    (liquidatableDeadStockInr * scenarioConfig.targetRecoveryPercent) / 100 +
      scenarioSlowMovingInr * 0.3
  );
  const targetCashReleaseDeltaInr =
    scenarioTargetCashReleaseInr - baselineTargetCashReleaseInr;

  // ============================================================================
  // PILLAR 2: GATE OTIF DISPATCH SENSITIVITY
  // ============================================================================
  const baseP2Rules: P2RulesConfig = {
    ...P2_DEFAULT_RULES,
    ...(fullInput.p2Rules || {}),
    graceHours: Math.max(0, Math.round(baselineConfig.gracePeriodDays * 24)),
    inFullCutoff: baselineConfig.allowPartialShipments
      ? Math.max(0, 100 - baselineConfig.shortageTolerancePct)
      : 100,
  };

  const scenP2Rules: P2RulesConfig = {
    ...P2_DEFAULT_RULES,
    ...(fullInput.p2Rules || {}),
    graceHours: Math.max(0, Math.round(scenarioConfig.gracePeriodDays * 24)),
    inFullCutoff: scenarioConfig.allowPartialShipments
      ? Math.max(0, 100 - scenarioConfig.shortageTolerancePct)
      : Math.max(0, 100 - scenarioConfig.shortageTolerancePct),
  };

  const baseOtifMetrics = calculateOTIFMetrics(p2Dispatches, baseP2Rules);
  const scenOtifMetrics = calculateOTIFMetrics(p2Dispatches, scenP2Rules);

  const baselineOtifPct = Math.round(baseOtifMetrics.otifPercent * 10) / 10;
  const scenarioOtifPct = Math.round(scenOtifMetrics.otifPercent * 10) / 10;
  const otifPctDelta = Math.round((scenarioOtifPct - baselineOtifPct) * 10) / 10;

  const reclassifiedDispatches: ReclassifiedDispatchRow[] = [];
  for (const d of p2Dispatches) {
    const bRow = calculateRowStatus(d, baseP2Rules);
    const sRow = calculateRowStatus(d, scenP2Rules);

    const bStatus = bRow.otif ? 'PASS' : `FAIL (${bRow.failType || 'Breach'})`;
    const sStatus = sRow.otif ? 'PASS' : `FAIL (${sRow.failType || 'Breach'})`;

    if (bStatus !== sStatus) {
      const promisedMs = d.promisedDate ? new Date(d.promisedDate).getTime() : NaN;
      const actualMs = d.actualOut ? new Date(d.actualOut).getTime() : NaN;
      const rawDelayDays =
        Number.isFinite(promisedMs) && Number.isFinite(actualMs) && actualMs > promisedMs
          ? Math.round(((actualMs - promisedMs) / (1000 * 60 * 60 * 24)) * 10) / 10
          : 0;
      const shortagePct =
        d.orderedQty > 0
          ? Math.max(0, Math.round(((d.orderedQty - d.shippedQty) / d.orderedQty) * 1000) / 10)
          : 0;

      reclassifiedDispatches.push({
        dispatchId: d.id,
        customerName: d.customer,
        fromStatus: bStatus,
        toStatus: sStatus,
        rawDelayDays,
        shortagePct,
      });
    }
  }

  // ============================================================================
  // PILLAR 3: FREIGHT & DETENTION AUDIT SENSITIVITY
  // ============================================================================
  const baseP3Rules: P3RulesConfig = {
    ...P3_DEFAULT_RULES,
    ...(fullInput.p3Rules || {}),
  };

  const baseP3Audit = calculateAuditMetrics(p3Trips, baseP3Rules);
  const laneBestRateMap: Record<string, number> = {};
  for (const laneSum of baseP3Audit.laneSummaries) {
    laneBestRateMap[laneSum.lane] = laneSum.bestCleanRate;
  }

  let baselineLeakInr = 0;
  let scenarioLeakInr = 0;
  let baselineFlaggedTripsCount = 0;
  let scenarioFlaggedTripsCount = 0;
  const reclassifiedFreightTrips: ReclassifiedFreightTripRow[] = [];

  for (const trip of p3Trips) {
    const bestRate = laneBestRateMap[trip.lane] || 0;
    const baseEval = evaluateP3TripScenarioFlags(
      trip,
      bestRate,
      baselineConfig,
      baseP3Rules.detentionRatePerHour
    );
    const scenEval = evaluateP3TripScenarioFlags(
      trip,
      bestRate,
      scenarioConfig,
      baseP3Rules.detentionRatePerHour
    );

    baselineLeakInr += baseEval.effectiveLeakInr;
    scenarioLeakInr += scenEval.effectiveLeakInr;

    const baseFlagged = !baseEval.flags.includes('CLEAN');
    const scenFlagged = !scenEval.flags.includes('CLEAN');
    if (baseFlagged) baselineFlaggedTripsCount++;
    if (scenFlagged) scenarioFlaggedTripsCount++;

    const baseKey = baseEval.flags.join(',');
    const scenKey = scenEval.flags.join(',');
    if (baseKey !== scenKey || baseEval.effectiveLeakInr !== scenEval.effectiveLeakInr) {
      reclassifiedFreightTrips.push({
        lrNumber: trip.id,
        transporter: trip.transporter,
        fromFlags: baseEval.flags,
        toFlags: scenEval.flags,
        overchargeInr: scenEval.overchargeInr,
        detentionInr: scenEval.detentionInr,
      });
    }
  }

  // Reconcile baselineLeakInr and flagged trips count with canonical P3 totalLeak when baselineConfig is at default
  const canonicalFlaggedCount = baseP3Audit.calculatedTrips.filter(
    (t) => (t.totalLeak || 0) > 0
  ).length;
  if (
    baselineConfig.maxOverchargePercent === DEFAULT_SENSITIVITY_CONFIG.maxOverchargePercent &&
    baselineConfig.detentionThreshold === DEFAULT_SENSITIVITY_CONFIG.detentionThreshold
  ) {
    baselineLeakInr = baseP3Audit.totals.totalLeak;
    baselineFlaggedTripsCount = canonicalFlaggedCount;
    if (
      scenarioConfig.maxOverchargePercent === DEFAULT_SENSITIVITY_CONFIG.maxOverchargePercent &&
      scenarioConfig.detentionThreshold === DEFAULT_SENSITIVITY_CONFIG.detentionThreshold &&
      scenarioConfig.maxAdvanceRatio === DEFAULT_SENSITIVITY_CONFIG.maxAdvanceRatio
    ) {
      scenarioLeakInr = baseP3Audit.totals.totalLeak;
      scenarioFlaggedTripsCount = canonicalFlaggedCount;
    }
  }
  const leakDeltaInr = scenarioLeakInr - baselineLeakInr;

  // ============================================================================
  // PILLAR 4: WAREHOUSE BIN VARIANCE SENSITIVITY
  // ============================================================================
  const baseP4Rules: P4RulesConfig = {
    ...P4_DEFAULT_RULES,
    ...(fullInput.p4Rules || {}),
    shrinkTolerancePercent: baselineConfig.highRiskPercentThreshold,
  };
  const scenP4Rules: P4RulesConfig = {
    ...P4_DEFAULT_RULES,
    ...(fullInput.p4Rules || {}),
    shrinkTolerancePercent: scenarioConfig.highRiskPercentThreshold,
  };

  const baseP4Summary = computeSummary(p4Bins, baseP4Rules);
  const scenP4Summary = computeSummary(p4Bins, scenP4Rules);

  const baselineBinAccuracyPct =
    baseP4Summary.skusCounted > 0
      ? Math.round((baseP4Summary.linesMatched / baseP4Summary.skusCounted) * 1000) / 10
      : 100;
  const scenarioBinAccuracyPct =
    scenP4Summary.skusCounted > 0
      ? Math.round((scenP4Summary.linesMatched / scenP4Summary.skusCounted) * 1000) / 10
      : 100;

  let baselineHighRiskBinsCount = 0;
  let scenarioHighRiskBinsCount = 0;
  const reclassifiedBins: ReclassifiedBinRow[] = [];

  for (const bin of p4Bins) {
    const calcBin = calculateItemFields(bin, scenP4Rules);
    const baseRisk = classifyP4BinRisk(calcBin, baselineConfig);
    const scenRisk = classifyP4BinRisk(calcBin, scenarioConfig);

    if (baseRisk.riskTier === 'HIGH_RISK') baselineHighRiskBinsCount++;
    if (scenRisk.riskTier === 'HIGH_RISK') scenarioHighRiskBinsCount++;

    if (baseRisk.riskTier !== scenRisk.riskTier) {
      reclassifiedBins.push({
        binId: bin.spot || bin.id,
        partId: bin.code,
        fromRisk: baseRisk.riskTier,
        toRisk: scenRisk.riskTier,
        varianceValueInr: scenRisk.varianceValueInr,
        variancePct: scenRisk.variancePct,
      });
    }
  }

  const highRiskBinsDelta = scenarioHighRiskBinsCount - baselineHighRiskBinsCount;

  return {
    baselineConfig,
    scenarioConfig,
    baselineDeadStockInr,
    scenarioDeadStockInr,
    deadStockDeltaInr,
    liquidatableDeadStockInr,
    reserveSparesProtectedInr,
    reserveSparesProtectedCount,
    baselineSlowMovingInr,
    scenarioSlowMovingInr,
    baselineAnnualCarryingDrainInr,
    scenarioAnnualCarryingDrainInr,
    annualCarryingDrainDeltaInr,
    baselineTargetCashReleaseInr,
    scenarioTargetCashReleaseInr,
    targetCashReleaseDeltaInr,
    reclassifiedSkus,
    baselineOtifPct,
    scenarioOtifPct,
    otifPctDelta,
    baselinePasses: baseOtifMetrics.passes,
    scenarioPasses: scenOtifMetrics.passes,
    reclassifiedDispatches,
    baselineLeakInr,
    scenarioLeakInr,
    leakDeltaInr,
    baselineFlaggedTripsCount,
    scenarioFlaggedTripsCount,
    reclassifiedFreightTrips,
    baselineBinAccuracyPct,
    scenarioBinAccuracyPct,
    baselineHighRiskBinsCount,
    scenarioHighRiskBinsCount,
    highRiskBinsDelta,
    reclassifiedBins,
    p1: {
      totalBookValueInr,
      baselineDeadStockInr,
      scenarioDeadStockInr,
      deadStockDeltaInr,
      liquidatableDeadStockInr,
      reserveSparesProtectedInr,
      reserveSparesProtectedCount,
      baselineSlowMovingInr,
      scenarioSlowMovingInr,
      annualCarryingDrainDeltaInr,
      targetCashReleaseDeltaInr,
      reclassifiedSkus,
    },
    p2: {
      totalDispatches: p2Dispatches.length,
      baselineOtifPct,
      scenarioOtifPct,
      otifPctDelta,
      baselinePasses: baseOtifMetrics.passes,
      scenarioPasses: scenOtifMetrics.passes,
      reclassifiedDispatches,
    },
    p3: {
      totalTrips: p3Trips.length,
      baselineLeakInr,
      scenarioLeakInr,
      leakDeltaInr,
      baselineFlaggedTripsCount,
      scenarioFlaggedTripsCount,
      reclassifiedFreightTrips,
    },
    p4: {
      totalBins: p4Bins.length,
      baselineBinAccuracyPct,
      scenarioBinAccuracyPct,
      baselineHighRiskBinsCount,
      scenarioHighRiskBinsCount,
      highRiskBinsDelta,
      reclassifiedBins,
    },
  };
}
