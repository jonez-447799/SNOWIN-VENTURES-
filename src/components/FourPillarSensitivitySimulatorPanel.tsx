/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Interactive 4-Pillar Policy & Threshold Sensitivity Simulator Panel (Phase 7).
 * Embedded in both PilotFindingsWalkthroughView (?view=pilot-findings) and UnifiedControlTower (/platform).
 */

import React, { useState, useMemo } from 'react';
import {
  Sliders,
  ShieldCheck,
  Lock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Package,
  Truck,
  Scale,
  ScanBarcode,
} from 'lucide-react';
import {
  runFourPillarSensitivity,
  SENSITIVITY_PRESETS,
  DEFAULT_SENSITIVITY_CONFIG,
  type SensitivityPresetId,
  type SensitivityScenarioConfig,
} from '../utils/sensitivitySimulator';
import type { StockItem, RulesConfig as P1RulesConfig } from '../project1/types';
import type { DispatchRow, RulesConfig as P2RulesConfig } from '../project2/types/otif';
import type { Trip, RulesConfig as P3RulesConfig } from '../project3/types/freight';
import type { AuditItem, AuditRules as P4RulesConfig } from '../project4/types/audit';
import type { PilotWorkspaceSnapshot } from '../utils/pilotWorkspaceStore';

interface FourPillarSensitivitySimulatorPanelProps {
  skus?: StockItem[];
  p1Rules?: Partial<P1RulesConfig>;
  p2Dispatches?: DispatchRow[];
  p2Rules?: Partial<P2RulesConfig>;
  p3FreightTrips?: Trip[];
  p3Rules?: Partial<P3RulesConfig>;
  p4WarehouseBins?: AuditItem[];
  p4Rules?: Partial<P4RulesConfig>;
  workspaceId?: string;
  adminKey?: string;
  initialExcludeReserveSpares?: boolean;
  onSnapshotUpdated?: (updatedSnapshot: PilotWorkspaceSnapshot) => void;
  compactMode?: boolean;
}

function formatINR(val: number): string {
  const rounded = Math.round(val || 0);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}₹${Math.abs(rounded).toLocaleString('en-IN')}`;
}

function formatSignedINR(val: number): string {
  const rounded = Math.round(val || 0);
  if (rounded === 0) return '₹0 (No Change)';
  const sign = rounded > 0 ? '+' : '-';
  return `${sign}₹${Math.abs(rounded).toLocaleString('en-IN')}`;
}

export const FourPillarSensitivitySimulatorPanel: React.FC<
  FourPillarSensitivitySimulatorPanelProps
> = ({
  skus,
  p1Rules,
  p2Dispatches,
  p2Rules,
  p3FreightTrips,
  p3Rules,
  p4WarehouseBins,
  p4Rules,
  workspaceId,
  adminKey = 'operationalyst-local-dev-key',
  initialExcludeReserveSpares = true,
  onSnapshotUpdated,
}) => {
  const baselineInit: SensitivityScenarioConfig = useMemo(
    () => ({
      ...DEFAULT_SENSITIVITY_CONFIG,
      normalDays: p1Rules?.slowThresholdDays ?? DEFAULT_SENSITIVITY_CONFIG.normalDays,
      slowDays: p1Rules?.deadThresholdDays ?? DEFAULT_SENSITIVITY_CONFIG.slowDays,
      annualCarryingCostPercent:
        p1Rules?.holdingCostPercent && p1Rules.holdingCostPercent !== 18
          ? p1Rules.holdingCostPercent
          : DEFAULT_SENSITIVITY_CONFIG.annualCarryingCostPercent,
      excludeReserveSpares: initialExcludeReserveSpares,
    }),
    [p1Rules, initialExcludeReserveSpares]
  );

  const [activePreset, setActivePreset] = useState<SensitivityPresetId | 'CUSTOM'>(
    'STANDARD_BASELINE'
  );
  const [scenarioConfig, setScenarioConfig] = useState<SensitivityScenarioConfig>(baselineInit);
  const [activeTraceTab, setActiveTraceTab] = useState<'P1' | 'P2' | 'P3' | 'P4'>('P1');

  // Server Scenario Lock State
  const [isLocking, setIsLocking] = useState(false);
  const [lockSuccessMsg, setLockSuccessMsg] = useState<string | null>(null);
  const [lockErrorMsg, setLockErrorMsg] = useState<string | null>(null);

  const sensitivityResult = useMemo(() => {
    return runFourPillarSensitivity({
      skus,
      p1Rules,
      p2Dispatches,
      p2Rules,
      p3FreightTrips,
      p3Rules,
      p4WarehouseBins,
      p4Rules,
      baselineConfig: baselineInit,
      scenarioConfig,
    });
  }, [
    skus,
    p1Rules,
    p2Dispatches,
    p2Rules,
    p3FreightTrips,
    p3Rules,
    p4WarehouseBins,
    p4Rules,
    baselineInit,
    scenarioConfig,
  ]);

  const handleSelectPreset = (presetId: SensitivityPresetId) => {
    setActivePreset(presetId);
    setScenarioConfig({
      ...SENSITIVITY_PRESETS[presetId].config,
      asOfDate: baselineInit.asOfDate,
    });
    setLockSuccessMsg(null);
    setLockErrorMsg(null);
  };

  const handleResetToBaseline = () => {
    setActivePreset('STANDARD_BASELINE');
    setScenarioConfig(baselineInit);
    setLockSuccessMsg(null);
    setLockErrorMsg(null);
  };

  const updateParam = <K extends keyof SensitivityScenarioConfig>(
    key: K,
    value: SensitivityScenarioConfig[K]
  ) => {
    setActivePreset('CUSTOM');
    setScenarioConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
    setLockSuccessMsg(null);
    setLockErrorMsg(null);
  };

  const handleLockScenarioToServer = async () => {
    if (!workspaceId) return;
    setIsLocking(true);
    setLockSuccessMsg(null);
    setLockErrorMsg(null);

    try {
      const savedKey =
        (typeof window !== 'undefined' &&
          sessionStorage.getItem('operationalyst_founder_admin_key')) ||
        adminKey ||
        'operationalyst-local-dev-key';

      const res = await fetch(
        `/api/admin/pilot-workspaces/${encodeURIComponent(workspaceId)}/rules`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': savedKey,
          },
          body: JSON.stringify({
            slowDays: scenarioConfig.slowDays,
            normalDays: scenarioConfig.normalDays,
            fastDays: scenarioConfig.fastDays,
            annualCarryingCostPercent: scenarioConfig.annualCarryingCostPercent,
            targetRecoveryPercent: scenarioConfig.targetRecoveryPercent,
            excludeReserveSpares: scenarioConfig.excludeReserveSpares,
            gracePeriodDays: scenarioConfig.gracePeriodDays,
            allowPartialShipments: scenarioConfig.allowPartialShipments,
            shortageTolerancePct: scenarioConfig.shortageTolerancePct,
            maxOverchargePercent: scenarioConfig.maxOverchargePercent,
            detentionThreshold: scenarioConfig.detentionThreshold,
            maxAdvanceRatio: scenarioConfig.maxAdvanceRatio,
            highRiskValueThreshold: scenarioConfig.highRiskValueThreshold,
            highRiskPercentThreshold: scenarioConfig.highRiskPercentThreshold,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setLockErrorMsg(data.error || 'Failed to lock scenario thresholds into server snapshot.');
      } else {
        setLockSuccessMsg(
          `Locked scenario rules into ${workspaceId} (Dead >${scenarioConfig.slowDays}d · Carrying ${scenarioConfig.annualCarryingCostPercent}% · Item 07 Reserve Spares=${scenarioConfig.excludeReserveSpares ? 'Protected' : 'Included'}).`
        );
        if (onSnapshotUpdated && data.snapshot) {
          onSnapshotUpdated(data.snapshot as PilotWorkspaceSnapshot);
        }
      }
    } catch {
      setLockErrorMsg('Network error while locking scenario thresholds into server snapshot.');
    } finally {
      setIsLocking(false);
    }
  };

  const totalReclassifiedCount =
    sensitivityResult.reclassifiedSkus.length +
    sensitivityResult.reclassifiedDispatches.length +
    sensitivityResult.reclassifiedFreightTrips.length +
    sensitivityResult.reclassifiedBins.length;

  return (
    <section
      data-testid="four-pillar-sensitivity-simulator"
      className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-6 text-slate-100"
    >
      {/* Header & Presets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <Sliders className="w-3.5 h-3.5" />
            <span>4-Pillar Policy & Threshold Sensitivity Simulator</span>
            <span>·</span>
            <span>Row-Traceable Engine</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            Stress-Test Audit Thresholds & Item 07 Reserve Spares Policy
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Compare Baseline Policy against CFO-strict or Shop-Floor-lenient operating rules across
            P1 Inventory, P2 Gate OTIF, P3 Freight & Detention, and P4 Warehouse Bins. Every rupee
            delta is traced to individual reclassified rows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['STRICT_CFO_AUDIT', 'STANDARD_BASELINE', 'LENIENT_PLANT_FLOOR'] as SensitivityPresetId[]).map(
            (presetId) => {
              const p = SENSITIVITY_PRESETS[presetId];
              const isSelected = activePreset === presetId;
              return (
                <button
                  key={presetId}
                  type="button"
                  data-testid={`sensitivity-preset-${presetId}`}
                  onClick={() => handleSelectPreset(presetId)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 border ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              );
            }
          )}
          <button
            type="button"
            onClick={handleResetToBaseline}
            className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-950 text-slate-400 hover:text-white border border-slate-800 flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* 4-Column Parameter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* P1 Inventory Controls */}
        <div className="bg-slate-950/90 border border-slate-800/90 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              P1 Inventory Policy
            </span>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              Dead &gt;{scenarioConfig.slowDays}d
            </span>
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>Dead Stock Cutoff (Days)</span>
              <span className="font-mono font-semibold text-white tabular-nums">
                {scenarioConfig.slowDays}d
              </span>
            </label>
            <input
              type="range"
              aria-label="Dead Stock Cutoff Days"
              min={60}
              max={365}
              step={15}
              value={scenarioConfig.slowDays}
              onChange={(e) => updateParam('slowDays', Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>Slow-Moving Cutoff (Days)</span>
              <span className="font-mono font-semibold text-white tabular-nums">
                {scenarioConfig.normalDays}d
              </span>
            </label>
            <input
              type="range"
              aria-label="Slow-Moving Cutoff Days"
              min={30}
              max={180}
              step={15}
              value={scenarioConfig.normalDays}
              onChange={(e) => updateParam('normalDays', Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Carrying Cost %</label>
              <input
                type="number"
                aria-label="Annual Carrying Cost Percent"
                min={10}
                max={45}
                value={scenarioConfig.annualCarryingCostPercent}
                onChange={(e) =>
                  updateParam('annualCarryingCostPercent', Math.max(1, Number(e.target.value) || 24))
                }
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Recovery Target %</label>
              <input
                type="number"
                aria-label="Target Recovery Percent"
                min={10}
                max={85}
                value={scenarioConfig.targetRecoveryPercent}
                onChange={(e) =>
                  updateParam('targetRecoveryPercent', Math.max(5, Number(e.target.value) || 35))
                }
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white tabular-nums"
              />
            </div>
          </div>

          <label className="flex items-start gap-2 pt-2 border-t border-slate-800/80 cursor-pointer">
            <input
              type="checkbox"
              checked={scenarioConfig.excludeReserveSpares}
              onChange={(e) => updateParam('excludeReserveSpares', e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-xs text-slate-300 leading-snug">
              Protect Critical Machine / Insurance Spares from Liquidation (Item 07)
            </span>
          </label>
        </div>

        {/* P2 Gate OTIF Controls */}
        <div className="bg-slate-950/90 border border-slate-800/90 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              P2 Gate OTIF Rules
            </span>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              Grace +{scenarioConfig.gracePeriodDays}d
            </span>
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>Customer Grace Period (Days)</span>
              <span className="font-mono font-semibold text-white tabular-nums">
                {scenarioConfig.gracePeriodDays}d
              </span>
            </label>
            <input
              type="range"
              aria-label="Customer Grace Period Days"
              min={0}
              max={5}
              step={1}
              value={scenarioConfig.gracePeriodDays}
              onChange={(e) => updateParam('gracePeriodDays', Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>Short-Shipment Tolerance (%)</span>
              <span className="font-mono font-semibold text-white tabular-nums">
                {scenarioConfig.shortageTolerancePct}%
              </span>
            </label>
            <input
              type="range"
              aria-label="Shortage Tolerance Percent"
              min={0}
              max={20}
              step={2}
              value={scenarioConfig.shortageTolerancePct}
              onChange={(e) => {
                const pct = Number(e.target.value);
                updateParam('shortageTolerancePct', pct);
                updateParam('allowPartialShipments', pct > 0);
              }}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          <label className="flex items-start gap-2 pt-2 border-t border-slate-800/80 cursor-pointer">
            <input
              type="checkbox"
              checked={scenarioConfig.allowPartialShipments}
              onChange={(e) => {
                const checked = e.target.checked;
                updateParam('allowPartialShipments', checked);
                if (!checked) updateParam('shortageTolerancePct', 0);
                else if (scenarioConfig.shortageTolerancePct === 0)
                  updateParam('shortageTolerancePct', 5);
              }}
              className="mt-0.5 rounded border-slate-700 text-sky-500 focus:ring-sky-500"
            />
            <span className="text-xs text-slate-300 leading-snug">
              Allow Partial Lot Shipments Within Tolerance Band
            </span>
          </label>
        </div>

        {/* P3 Freight & Detention Controls */}
        <div className="bg-slate-950/90 border border-slate-800/90 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              P3 Freight Audit Rules
            </span>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              Overcharge &gt;{scenarioConfig.maxOverchargePercent}%
            </span>
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>Max Rate Overcharge Flag (%)</span>
              <span className="font-mono font-semibold text-white tabular-nums">
                {scenarioConfig.maxOverchargePercent}%
              </span>
            </label>
            <input
              type="range"
              aria-label="Max Overcharge Percent"
              min={0}
              max={30}
              step={5}
              value={scenarioConfig.maxOverchargePercent}
              onChange={(e) => updateParam('maxOverchargePercent', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>Detention Alert Threshold (₹)</span>
              <span className="font-mono font-semibold text-white tabular-nums">
                ₹{scenarioConfig.detentionThreshold.toLocaleString('en-IN')}
              </span>
            </label>
            <input
              type="range"
              aria-label="Detention Threshold INR"
              min={1000}
              max={25000}
              step={1000}
              value={scenarioConfig.detentionThreshold}
              onChange={(e) => updateParam('detentionThreshold', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>Max Diesel Advance Ratio</span>
              <span className="font-mono font-semibold text-white tabular-nums">
                {Math.round(scenarioConfig.maxAdvanceRatio * 100)}%
              </span>
            </label>
            <input
              type="range"
              aria-label="Max Advance Ratio"
              min={0.3}
              max={0.8}
              step={0.05}
              value={scenarioConfig.maxAdvanceRatio}
              onChange={(e) => updateParam('maxAdvanceRatio', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* P4 Warehouse Bin Controls */}
        <div className="bg-slate-950/90 border border-slate-800/90 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
              <ScanBarcode className="w-3.5 h-3.5" />
              P4 Bin Variance Rules
            </span>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              Risk ≥₹{scenarioConfig.highRiskValueThreshold.toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>High-Risk Bin Value Cutoff (₹)</span>
              <span className="font-mono font-semibold text-white tabular-nums">
                ₹{scenarioConfig.highRiskValueThreshold.toLocaleString('en-IN')}
              </span>
            </label>
            <input
              type="range"
              aria-label="High Risk Bin Value Threshold"
              min={1000}
              max={15000}
              step={500}
              value={scenarioConfig.highRiskValueThreshold}
              onChange={(e) => updateParam('highRiskValueThreshold', Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>High-Risk Shrinkage Cutoff (%)</span>
              <span className="font-mono font-semibold text-white tabular-nums">
                {scenarioConfig.highRiskPercentThreshold}%
              </span>
            </label>
            <input
              type="range"
              aria-label="High Risk Bin Percent Threshold"
              min={1}
              max={15}
              step={1}
              value={scenarioConfig.highRiskPercentThreshold}
              onChange={(e) => updateParam('highRiskPercentThreshold', Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            Bins exceeding either the ₹ variance floor or % shrinkage tolerance are escalated for
            mandatory morning blind recount.
          </div>
        </div>
      </div>

      {/* 4-Pillar Delta Comparison Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* P1 Summary Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>P1 Dead Stock Exposure</span>
            <span className="font-mono text-[11px] text-amber-400">
              {sensitivityResult.reclassifiedSkus.length} SKUs Shifted
            </span>
          </div>
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-xs text-slate-500 line-through">
              {formatINR(sensitivityResult.baselineDeadStockInr)}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-lg font-bold text-white">
              {formatINR(sensitivityResult.scenarioDeadStockInr)}
            </span>
          </div>
          <div className="text-xs font-mono text-amber-400 tabular-nums">
            Delta: {formatSignedINR(sensitivityResult.deadStockDeltaInr)}
          </div>
          <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] font-mono tabular-nums">
            <div className="flex justify-between text-slate-300">
              <span>Liquidatable Dead Stock:</span>
              <span className="text-white font-semibold">
                {formatINR(sensitivityResult.liquidatableDeadStockInr)}
              </span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Item 07 Reserve Protected:</span>
              <span className="font-semibold">
                {formatINR(sensitivityResult.reserveSparesProtectedInr)} (
                {sensitivityResult.reserveSparesProtectedCount} spares)
              </span>
            </div>
          </div>
        </div>

        {/* P2 Summary Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>P2 Gate OTIF Pass Rate</span>
            <span className="font-mono text-[11px] text-sky-400">
              {sensitivityResult.reclassifiedDispatches.length} Dispatches Shifted
            </span>
          </div>
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-xs text-slate-500 line-through">
              {sensitivityResult.baselineOtifPct.toFixed(1)}%
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-lg font-bold text-white">
              {sensitivityResult.scenarioOtifPct.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs font-mono text-sky-400 tabular-nums">
            Delta: {sensitivityResult.otifPctDelta >= 0 ? '+' : ''}
            {sensitivityResult.otifPctDelta.toFixed(1)}% ({sensitivityResult.scenarioPasses}/
            {sensitivityResult.p2.totalDispatches} Pass)
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            Grace: +{scenarioConfig.gracePeriodDays}d · Short Tolerance:{' '}
            {scenarioConfig.shortageTolerancePct}%
          </div>
        </div>

        {/* P3 Summary Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>P3 Audited Freight Leakage</span>
            <span className="font-mono text-[11px] text-emerald-400">
              {sensitivityResult.reclassifiedFreightTrips.length} LRs Reclassified
            </span>
          </div>
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-xs text-slate-500 line-through">
              {formatINR(sensitivityResult.baselineLeakInr)}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-lg font-bold text-white">
              {formatINR(sensitivityResult.scenarioLeakInr)}
            </span>
          </div>
          <div className="text-xs font-mono text-emerald-400 tabular-nums">
            Delta: {formatSignedINR(sensitivityResult.leakDeltaInr)} (
            {sensitivityResult.scenarioFlaggedTripsCount} Flagged LRs)
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            Overcharge &gt;{scenarioConfig.maxOverchargePercent}% · Detention Floor ₹
            {scenarioConfig.detentionThreshold.toLocaleString('en-IN')}
          </div>
        </div>

        {/* P4 Summary Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>P4 High-Risk Variance Bins</span>
            <span className="font-mono text-[11px] text-purple-400">
              {sensitivityResult.reclassifiedBins.length} Bins Reclassified
            </span>
          </div>
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-xs text-slate-500 line-through">
              {sensitivityResult.baselineHighRiskBinsCount} High-Risk
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-lg font-bold text-white">
              {sensitivityResult.scenarioHighRiskBinsCount} High-Risk
            </span>
          </div>
          <div className="text-xs font-mono text-purple-400 tabular-nums">
            Delta: {sensitivityResult.highRiskBinsDelta >= 0 ? '+' : ''}
            {sensitivityResult.highRiskBinsDelta} Bins · Match Accuracy:{' '}
            {sensitivityResult.scenarioBinAccuracyPct.toFixed(1)}%
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            Cutoff: ≥₹{scenarioConfig.highRiskValueThreshold.toLocaleString('en-IN')} or ≥
            {scenarioConfig.highRiskPercentThreshold}% gap
          </div>
        </div>
      </div>

      {/* Row-Traceable Reclassified Items Ledger */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <span>Row-Level Reclassification Audit Trail</span>
            <span className="text-slate-500">·</span>
            <span className="font-mono text-amber-400 tabular-nums">
              {totalReclassifiedCount} Total Reclassified Rows
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg">
            {(
              [
                {
                  id: 'P1',
                  label: `P1 SKUs (${sensitivityResult.reclassifiedSkus.length})`,
                },
                {
                  id: 'P2',
                  label: `P2 Dispatches (${sensitivityResult.reclassifiedDispatches.length})`,
                },
                {
                  id: 'P3',
                  label: `P3 Freight LRs (${sensitivityResult.reclassifiedFreightTrips.length})`,
                },
                {
                  id: 'P4',
                  label: `P4 Bins (${sensitivityResult.reclassifiedBins.length})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTraceTab(tab.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  activeTraceTab === tab.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          {activeTraceTab === 'P1' && (
            <>
              {sensitivityResult.reclassifiedSkus.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">
                  No P1 SKUs changed ageing classification or Item 07 Reserve Spare status under the
                  current threshold settings. Adjust Dead Stock Cutoff (e.g. Strict CFO 120d or
                  Lenient 270d) to inspect row shifts.
                </p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 pr-3 font-medium">Part ID</th>
                      <th className="py-2 pr-3 font-medium">Description</th>
                      <th className="py-2 pr-3 font-medium text-right">Days Idle</th>
                      <th className="py-2 pr-3 font-medium text-right">Book Value (₹)</th>
                      <th className="py-2 pr-3 font-medium">Baseline Bucket</th>
                      <th className="py-2 font-medium">Scenario Bucket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                    {sensitivityResult.reclassifiedSkus.map((r) => (
                      <tr key={r.partId} className="hover:bg-slate-900/60">
                        <td className="py-2 pr-3 font-semibold text-white">{r.partId}</td>
                        <td className="py-2 pr-3 font-sans text-slate-300">
                          {r.description}
                          {r.isReserveSpare && (
                            <span className="ml-2 text-[11px] font-mono text-emerald-400">
                              · ITEM 07 RESERVE SPARE
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-right text-slate-300">{r.daysInactive}d</td>
                        <td className="py-2 pr-3 text-right text-white">
                          {formatINR(r.totalValueInr)}
                        </td>
                        <td className="py-2 pr-3 text-slate-400">{r.fromBucket}</td>
                        <td className="py-2 text-amber-400 font-semibold">{r.toBucket}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeTraceTab === 'P2' && (
            <>
              {sensitivityResult.reclassifiedDispatches.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">
                  No P2 dispatches changed pass/fail status under current Grace Period (
                  {scenarioConfig.gracePeriodDays}d) and Shortage Tolerance (
                  {scenarioConfig.shortageTolerancePct}%). Increase Grace Period or Shortage
                  Tolerance to see borderline OEM dispatches reclassify.
                </p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 pr-3 font-medium">Dispatch ID</th>
                      <th className="py-2 pr-3 font-medium">Customer</th>
                      <th className="py-2 pr-3 font-medium text-right">Raw Delay (Days)</th>
                      <th className="py-2 pr-3 font-medium text-right">Shortage %</th>
                      <th className="py-2 pr-3 font-medium">Baseline Status</th>
                      <th className="py-2 font-medium">Scenario Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                    {sensitivityResult.reclassifiedDispatches.map((d) => (
                      <tr key={d.dispatchId} className="hover:bg-slate-900/60">
                        <td className="py-2 pr-3 font-semibold text-white">{d.dispatchId}</td>
                        <td className="py-2 pr-3 font-sans text-slate-300">{d.customerName}</td>
                        <td className="py-2 pr-3 text-right text-slate-300">{d.rawDelayDays}d</td>
                        <td className="py-2 pr-3 text-right text-slate-300">{d.shortagePct}%</td>
                        <td className="py-2 pr-3 text-rose-400">{d.fromStatus}</td>
                        <td className="py-2 text-emerald-400 font-semibold">{d.toStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeTraceTab === 'P3' && (
            <>
              {sensitivityResult.reclassifiedFreightTrips.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">
                  No P3 freight trips changed audit flags under current Overcharge (
                  {scenarioConfig.maxOverchargePercent}%), Detention (₹
                  {scenarioConfig.detentionThreshold.toLocaleString('en-IN')}), and Advance Ratio (
                  {Math.round(scenarioConfig.maxAdvanceRatio * 100)}%) thresholds.
                </p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 pr-3 font-medium">LR Number</th>
                      <th className="py-2 pr-3 font-medium">Transporter</th>
                      <th className="py-2 pr-3 font-medium text-right">Overcharge (₹)</th>
                      <th className="py-2 pr-3 font-medium text-right">Detention (₹)</th>
                      <th className="py-2 pr-3 font-medium">Baseline Flags</th>
                      <th className="py-2 font-medium">Scenario Flags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                    {sensitivityResult.reclassifiedFreightTrips.map((t) => (
                      <tr key={t.lrNumber} className="hover:bg-slate-900/60">
                        <td className="py-2 pr-3 font-semibold text-white">{t.lrNumber}</td>
                        <td className="py-2 pr-3 font-sans text-slate-300">{t.transporter}</td>
                        <td className="py-2 pr-3 text-right text-white">
                          {formatINR(t.overchargeInr)}
                        </td>
                        <td className="py-2 pr-3 text-right text-white">
                          {formatINR(t.detentionInr)}
                        </td>
                        <td className="py-2 pr-3 text-slate-400">{t.fromFlags.join(', ')}</td>
                        <td className="py-2 text-emerald-400 font-semibold">
                          {t.toFlags.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeTraceTab === 'P4' && (
            <>
              {sensitivityResult.reclassifiedBins.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">
                  No P4 warehouse bins changed risk classification under current High-Risk Value (₹
                  {scenarioConfig.highRiskValueThreshold.toLocaleString('en-IN')}) and Shrinkage (
                  {scenarioConfig.highRiskPercentThreshold}%) cutoffs.
                </p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 pr-3 font-medium">Bin Location</th>
                      <th className="py-2 pr-3 font-medium">Part ID</th>
                      <th className="py-2 pr-3 font-medium text-right">Variance Value (₹)</th>
                      <th className="py-2 pr-3 font-medium text-right">Variance %</th>
                      <th className="py-2 pr-3 font-medium">Baseline Risk</th>
                      <th className="py-2 font-medium">Scenario Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                    {sensitivityResult.reclassifiedBins.map((b) => (
                      <tr key={`${b.binId}-${b.partId}`} className="hover:bg-slate-900/60">
                        <td className="py-2 pr-3 font-sans text-slate-300">{b.binId}</td>
                        <td className="py-2 pr-3 font-semibold text-white">{b.partId}</td>
                        <td className="py-2 pr-3 text-right text-white">
                          {formatINR(b.varianceValueInr)}
                        </td>
                        <td className="py-2 pr-3 text-right text-slate-300">{b.variancePct}%</td>
                        <td className="py-2 pr-3 text-slate-400">{b.fromRisk}</td>
                        <td className="py-2 text-purple-400 font-semibold">{b.toRisk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>

      {/* Server Scenario Lock Footer (when bound to an AUDIT-... workspaceId) */}
      {workspaceId && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Bound to Client Snapshot <strong className="font-mono text-white">{workspaceId}</strong>
              . Locking updates server snapshot rules, Item 07 exclusions, and logs{' '}
              <code className="text-slate-300">WALKTHROUGH_RULES_LOCKED</code>.
            </span>
          </div>

          <button
            type="button"
            disabled={isLocking}
            onClick={handleLockScenarioToServer}
            className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            {isLocking
              ? 'Locking Scenario Rules...'
              : 'Lock Agreed Scenario Thresholds into Client Snapshot'}
          </button>
        </div>
      )}

      {lockSuccessMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{lockSuccessMsg}</span>
        </div>
      )}

      {lockErrorMsg && (
        <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-700/60 text-rose-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{lockErrorMsg}</span>
        </div>
      )}
    </section>
  );
};
