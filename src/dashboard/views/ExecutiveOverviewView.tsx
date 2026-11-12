/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Building2,
  CalendarClock,
  FileSpreadsheet,
  HelpCircle,
  AlertTriangle,
  SlidersHorizontal,
  Package,
  Truck,
  Scale,
  ScanBarcode,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  LivePlatformDataSnapshot,
  PlatformNavId,
} from '../dashboardConfig';
import {
  DemoDataNotice,
  ExecutivePriorityCard,
  KPIStatusCard,
  InvestigationQueue,
  ExecutiveBrief,
  StatusBadge,
} from '../components/SharedDashboardPrimitives';
import { PlantId, PeriodId, PlantConfig, PeriodConfig } from '../../context/PlantContext';
import { downloadCommandCenterWorkbook } from '../../utils/excelCommandCenterExporter';
import { trackEvent } from '../../utils/analytics';
import { computeCapaFinancialSummary } from '../../utils/capaLedger';
import { FourPillarSensitivitySimulatorPanel } from '../../components/FourPillarSensitivitySimulatorPanel';
import { readPlantDatasetFromBrowser } from '../../data/multiPlantBaselines';
import {
  PLATFORM_DEMO_PLANTS,
  CFO_POLICY_PRESETS,
  computeSimulatedPolicyMetrics,
} from '../../commercial/PlatformTopBar';

interface ExecutiveOverviewViewProps {
  snapshot: LivePlatformDataSnapshot;
  allPlants: PlantConfig[];
  allPeriods: PeriodConfig[];
  onSelectPlant: (id: PlantId) => void;
  onSelectPeriod: (id: PeriodId) => void;
  onNavigateDomain: (domain: PlatformNavId) => void;
  onOpenMethodology: (metricId: string) => void;
  onOpenOnboarding: () => void;
}

export const ExecutiveOverviewView: React.FC<ExecutiveOverviewViewProps> = ({
  snapshot,
  allPlants,
  allPeriods,
  onSelectPlant,
  onSelectPeriod,
  onNavigateDomain,
  onOpenMethodology,
  onOpenOnboarding,
}) => {
  const [comparePriorPeriod, setComparePriorPeriod] = useState<boolean>(true);
  const [cutoffDays, setCutoffDays] = useState<number>(180);
  const [carryingCostPct, setCarryingCostPct] = useState<number>(22);
  const [excludeReserveSpares, setExcludeReserveSpares] = useState<boolean>(false);

  const activePresetPlant =
    PLATFORM_DEMO_PLANTS[snapshot.plant.id] ?? PLATFORM_DEMO_PLANTS.ambattur;

  const simulatedPolicy = computeSimulatedPolicyMetrics({
    plantId: snapshot.plant.id,
    cutoffDays,
    carryingCostPct,
    excludeReserveSpares,
  });

  const handleInspectDomain = (domain: PlatformNavId, source = 'overview') => {
    trackEvent('executive_priority_opened', { domain, source });
    onNavigateDomain(domain);
  };

  const handleExportWorkbook = () => {
    trackEvent('report_exported', {
      reportType: 'executive_6sheet_workbook',
      plantId: snapshot.plant.id,
    });
    downloadCommandCenterWorkbook(snapshot.plant.id);
  };

  const attentionCount = snapshot.priorities.length;
  const plantDataset = readPlantDatasetFromBrowser(snapshot.plant.id);
  const capaSummary = computeCapaFinancialSummary(
    (snapshot.capaItems || plantDataset.capaItems || []) as unknown as Array<
      Record<string, unknown>
    >
  );

  return (
    <div className="space-y-6">
      {/* Persistent Demonstration Environment Notice */}
      <DemoDataNotice onOpenImports={() => onNavigateDomain('data_imports')} />

      {/* Section 0: Page Header */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Executive Overview — {activePresetPlant.name}
            </h1>
            <StatusBadge
              status={activePresetPlant.otifPercent < 60 ? 'Critical' : 'Requires attention'}
              size="md"
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            P1-First 48-hour inventory cash recovery baseline, interactive CFO policy simulator, and Phase 2 operational modules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Factory / Unit Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
            <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <label htmlFor="overview-plant-select" className="sr-only">
              Select Factory Unit
            </label>
            <select
              id="overview-plant-select"
              value={snapshot.plant.id}
              onChange={(e) => onSelectPlant(e.target.value as PlantId)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {allPlants.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reporting Period Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 max-w-full">
            <CalendarClock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <label htmlFor="overview-period-select" className="sr-only">
              Select Reporting Period
            </label>
            <select
              id="overview-period-select"
              value={snapshot.period.id}
              onChange={(e) => onSelectPeriod(e.target.value as PeriodId)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer max-w-[230px] sm:max-w-none truncate"
            >
              {allPeriods.map((per) => (
                <option key={per.id} value={per.id} className="bg-slate-900 text-white">
                  {per.label}
                </option>
              ))}
            </select>
          </div>

          {/* Compare to Previous Period Toggle */}
          <button
            onClick={() => setComparePriorPeriod((v) => !v)}
            className={`px-3 py-2 rounded-lg border font-semibold inline-flex items-center gap-1.5 cursor-pointer transition ${
              comparePriorPeriod
                ? 'bg-sky-950/70 border-sky-500/40 text-sky-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Compare Prior Period: {comparePriorPeriod ? 'ON' : 'OFF'}</span>
          </button>

          {/* Export Executive Summary */}
          <button
            onClick={handleExportWorkbook}
            className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Executive Summary (.xlsx)</span>
          </button>

          <button
            onClick={onOpenOnboarding}
            className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="Reopen Platform Guide"
            aria-label="Reopen Platform Orientation Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =====================================================================
          #1 SECTION: PRIMARY 48-HOUR PILOT SCOPE · P1 INVENTORY CASH RECOVERY
      ===================================================================== */}
      <section
        data-testid="platform-p1-primary-section"
        className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border-2 border-blue-500/40 rounded-2xl p-5 sm:p-6 space-y-5 shadow-lg"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Package className="w-3.5 h-3.5 text-blue-400" />
              <span>Primary 48-Hour Pilot Scope · P1 Inventory Cash Recovery (5-Column Export)</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Working Capital &amp; Non-Moving Stock Exposure — {activePresetPlant.name} ({activePresetPlant.skuCountFormatted})
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Generated directly from a standard 5-column Tally Prime, SAP, or Excel stock export (`Part_ID`, `Part_Description`, `Closing_Stock_Qty`, `Unit_Cost_INR`, `Last_Movement_Date`).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleInspectDomain('inventory', 'p1_primary_hero')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <span>Inspect All {activePresetPlant.skuCountFormatted} in P1 Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Core P1 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-400">1. Total Valued Stock</div>
            <div className="text-2xl font-mono font-bold text-white mt-1">
              {activePresetPlant.totalStockFormatted}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Audited across {activePresetPlant.skuCountFormatted} in {activePresetPlant.name}
            </div>
          </div>

          <div className="bg-slate-950/90 border border-l-4 border-l-rose-500 border-slate-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-rose-300">
              2. Non-Moving Stock (&gt;180 Days)
            </div>
            <div className="text-2xl font-mono font-bold text-rose-400 mt-1">
              {activePresetPlant.nonMovingFormatted}
            </div>
            <div className="text-xs text-slate-300 mt-1">
              {activePresetPlant.nonMovingSkus} SKUs with zero issue for &gt;180 days
            </div>
          </div>

          <div className="bg-slate-950/90 border border-l-4 border-l-amber-500 border-slate-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-amber-300">
              3. Slow-Moving Stock (90–180 Days)
            </div>
            <div className="text-2xl font-mono font-bold text-amber-300 mt-1">
              {activePresetPlant.slowMovingFormatted}
            </div>
            <div className="text-xs text-slate-300 mt-1">
              {activePresetPlant.slowMovingSkus} SKUs requiring reorder freeze review
            </div>
          </div>

          <div className="bg-slate-950/90 border border-l-4 border-l-sky-500 border-slate-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-sky-300">
              4. Annual Carrying Burn ({activePresetPlant.carryingCostPct}% Baseline)
            </div>
            <div className="text-2xl font-mono font-bold text-sky-300 mt-1">
              {activePresetPlant.annualCarryingBurnFormatted}/yr
            </div>
            <div className="text-xs text-slate-300 mt-1">
              {activePresetPlant.prioritySkus} Priority SKUs flagged for floor verification
            </div>
          </div>
        </div>

        {/* Interactive CFO Policy Simulator Bar (Aligned to 180d / 22% Baseline) */}
        <div
          data-testid="cfo-quick-policy-simulator"
          className="bg-slate-950/95 border border-slate-800 rounded-xl p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                <span>Interactive CFO Policy Simulator (Standard Baseline: 180 Days Cutoff &amp; 22% Carrying Cost)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Test how stricter or more lenient aging cutoffs and carrying-cost assumptions change your working-capital exposure.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {CFO_POLICY_PRESETS.map((preset) => {
                const isSelected =
                  cutoffDays === preset.cutoffDays &&
                  carryingCostPct === preset.carryingCostPct;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setCutoffDays(preset.cutoffDays);
                      setCarryingCostPct(preset.carryingCostPct);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80 text-xs">
            <label className="inline-flex items-center gap-2 text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={excludeReserveSpares}
                onChange={(e) => setExcludeReserveSpares(e.target.checked)}
                className="rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500"
              />
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-medium">
                Exclude Critical Machine Spares (15% Reserve Buffer)
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-4 font-mono">
              <div>
                <span className="text-slate-400 font-sans mr-1.5">Simulated Dead Stock (&gt;{cutoffDays}d):</span>
                <span className="font-bold text-rose-300">
                  {simulatedPolicy.simulatedDeadStockFormatted}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-sans mr-1.5">Annual Carrying Burn ({carryingCostPct}%):</span>
                <span className="font-bold text-sky-300">
                  {simulatedPolicy.annualCarryingBurnFormatted}/yr
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-sans mr-1.5">35% Target Cash Release:</span>
                <span className="font-bold text-emerald-400">
                  {simulatedPolicy.targetRecoveryFormatted}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 2: PHASE 2 OPTIONAL ADD-ON MODULES (P2, P3, P4)
      ===================================================================== */}
      <section
        data-testid="platform-phase2-addons-section"
        className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Secondary Cross-Functional Engines
            </div>
            <h2 className="text-base font-bold text-white">
              Phase 2 Optional Add-On Modules (Unlocked After Initial Stock Audit)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Included in the live multi-plant sandbox for end-to-end evaluation
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* P2 Delivery Gate OTIF */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300">
                  <Truck className="w-4 h-4 text-sky-400" />
                  <span>P2 • Delivery Gate OTIF</span>
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  Phase 2 Add-On
                </span>
              </div>
              <div className="text-xl font-mono font-bold text-white mt-1">
                {activePresetPlant.otifSummary}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Dual-Gate verification (On-Time exit AND 100% In-Full PO quantity) across {activePresetPlant.otifTotal} audited dispatches.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleInspectDomain('delivery', 'phase2_addon_p2')}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Open P2 Delivery Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* P3 Freight & Detention Audit */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <span>P3 • Freight &amp; Detention Audit</span>
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  {activePresetPlant.flaggedLRs} Flagged LRs
                </span>
              </div>
              <div className="text-xl font-mono font-bold text-white mt-1">
                {activePresetPlant.freightLeakFormatted} Freight Leak
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {activePresetPlant.freightSummary} (rate-card overcharges &amp; unverified detention bills).
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleInspectDomain('profit_risk', 'phase2_addon_p3')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Open P3 Freight Audit Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* P4 Warehouse Bin Reconciliation */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <ScanBarcode className="w-4 h-4 text-emerald-400" />
                  <span>P4 • Warehouse Bin Reconciliation</span>
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  {activePresetPlant.auditedBins} Bins Audited
                </span>
              </div>
              <div className="text-xl font-mono font-bold text-white mt-1">
                {activePresetPlant.binMatchPercent}% Bin Match ({activePresetPlant.binVarianceFormatted} Variance)
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {activePresetPlant.binSummary} comparing physical cycle counts to ERP book stock.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleInspectDomain('warehouse', 'phase2_addon_p4')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Open P4 Bin Audit Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: "What Needs Attention Today" (Maximum 3 Priority Cards) */}
      <section aria-labelledby="attention-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 id="attention-heading" className="text-base font-bold text-white">
              What Needs Attention Today — {attentionCount} Areas Require Attention
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Ranked by operational and working-capital impact • Maximum 3 executive priority cards
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {snapshot.priorities.slice(0, 3).map((item) => (
            <ExecutivePriorityCard
              key={item.id}
              item={item}
              onInspectDomain={(domain) => handleInspectDomain(domain, `priority_card_${item.id}`)}
              onOpenMethodology={(mId) => {
                trackEvent('metric_methodology_opened', { metricId: mId });
                onOpenMethodology(mId);
              }}
            />
          ))}
        </div>
      </section>

      {/* Section 4: Executive KPI Strip (Maximum 5 Cards in a Single Row) */}
      <section aria-labelledby="kpi-strip-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="kpi-strip-heading" className="text-base font-bold text-white">
            Core Operational Indicators (With Numerators &amp; Denominators)
          </h2>
          <span className="text-xs text-slate-400">
            Click &ldquo;Formula&rdquo; on any indicator to inspect exact calculation rules and data scope
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {snapshot.kpiStrip.slice(0, 5).map((kpi) => (
            <KPIStatusCard
              key={kpi.id}
              kpi={kpi}
              onInspectDomain={(domain) => handleInspectDomain(domain, `kpi_card_${kpi.id}`)}
              onOpenMethodology={(mId) => {
                trackEvent('metric_methodology_opened', { metricId: mId });
                onOpenMethodology(mId);
              }}
            />
          ))}
        </div>
      </section>

      {/* Section 5: Priority Investigation Queue (Exception-First Design) */}
      <section aria-label="Priority Investigation Queue">
        <InvestigationQueue
          rows={snapshot.investigationQueue}
          onInspectDomain={(domain) => handleInspectDomain(domain, 'investigation_queue')}
          onOpenMethodology={(mId) => {
            trackEvent('metric_methodology_opened', { metricId: mId });
            onOpenMethodology(mId);
          }}
          onOpenActionsView={() => onNavigateDomain('actions')}
        />
      </section>

      {/* Section 6: Rule-Based Executive Brief */}
      <section aria-label="Executive Brief">
        <ExecutiveBrief
          brief={snapshot.executiveBrief}
          onOpenReports={() => onNavigateDomain('executive_reports')}
        />
      </section>

      {/* Section 7: Closed-Loop CAPA Financial Realization Funnel */}
      <section
        data-testid="overview-capa-financial-funnel"
        className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">
              Closed-Loop CAPA Financial Realization Funnel — {snapshot.plant.name}
            </h2>
            <p className="text-xs text-slate-400">
              Tracks rupee exposure from audit identification through shop-floor disposition and finance controller sign-off.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateDomain('actions')}
            className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
          >
            Open Full CAPA Financial Ledger ({capaSummary.totalCapasCount} Items)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 font-mono tabular-nums">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
            <div className="text-[11px] font-sans text-slate-400">1. Identified Exposure</div>
            <div className="text-lg font-bold text-white mt-1">
              ₹{capaSummary.totalIdentifiedExposureInr.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-sans text-slate-500 mt-0.5">
              Across {capaSummary.totalCapasCount} linked P1–P4 records
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
            <div className="text-[11px] font-sans text-sky-400">2. Target Recovery</div>
            <div className="text-lg font-bold text-sky-300 mt-1">
              ₹{capaSummary.totalTargetRecoveryInr.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-sans text-slate-500 mt-0.5">
              Recoverable cash &amp; debit notes
            </div>
          </div>

          <div className="bg-slate-950 border border-amber-500/30 rounded-lg p-3.5">
            <div className="text-[11px] font-sans text-amber-400">3. Pending Finance Sign-Off</div>
            <div className="text-lg font-bold text-amber-300 mt-1">
              ₹{capaSummary.pendingFinanceSignOffInr.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-sans text-slate-500 mt-0.5">
              {capaSummary.byStage.PENDING_FINANCE_SIGN_OFF.count} items awaiting voucher verification
            </div>
          </div>

          <div className="bg-slate-950 border border-emerald-500/30 rounded-lg p-3.5">
            <div className="text-[11px] font-sans text-emerald-400">4. Verified Realized Cash</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">
              ₹{capaSummary.totalRealizedRecoveryInr.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-sans text-slate-500 mt-0.5">
              {capaSummary.byStage.VERIFIED_REALIZED.count} closed &amp; controller-verified
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
            <div className="text-[11px] font-sans text-slate-300">Net Realization Rate</div>
            <div className="text-lg font-bold text-white mt-1">
              {capaSummary.realizationRatePct.toFixed(1)}%
            </div>
            <div className="text-[11px] font-sans text-slate-500 mt-0.5">
              Realized vs. Target Recovery
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: Row-Traceable 4-Pillar Policy & Threshold Sensitivity Simulator */}
      <FourPillarSensitivitySimulatorPanel
        skus={plantDataset.p1Items}
        p1Rules={plantDataset.p1Rules}
        p2Dispatches={plantDataset.p2Dispatches}
        p2Rules={plantDataset.p2Rules}
        p3FreightTrips={plantDataset.p3Trips}
        p3Rules={plantDataset.p3Rules}
        p4WarehouseBins={plantDataset.p4Bins}
        p4Rules={plantDataset.p4Rules}
      />
    </div>
  );
};
