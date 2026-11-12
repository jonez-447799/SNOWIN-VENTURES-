/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Calendar, Building2, SlidersHorizontal, ArrowRight, ShieldCheck } from 'lucide-react';
import { PlantId } from '../context/PlantContext';
import { trackEvent } from '../utils/analytics';
import { FirebaseCloudSyncBar } from '../components/FirebaseCloudSyncBar';

export interface PlatformDemoPlantPreset {
  id: PlantId;
  name: string;
  location: string;
  skuCount: number;
  skuCountFormatted: string;
  totalStockValue: number;
  totalStockFormatted: string;
  nonMovingValue: number;
  nonMovingFormatted: string;
  nonMovingSkus: number;
  slowMovingValue: number;
  slowMovingFormatted: string;
  slowMovingSkus: number;
  prioritySkus: number;
  carryingCostPct: number;
  annualCarryingBurn: number;
  annualCarryingBurnFormatted: string;
  otifPercent: number;
  otifPassed: number;
  otifTotal: number;
  otifSummary: string;
  freightLeakValue: number;
  freightLeakFormatted: string;
  flaggedLRs: number;
  freightSummary: string;
  binMatchPercent: number;
  binVarianceValue: number;
  binVarianceFormatted: string;
  auditedBins: number;
  binSummary: string;
  summaryLine: string;
}

export const PLATFORM_DEMO_PLANTS: Record<PlantId, PlatformDemoPlantPreset> = {
  ambattur: {
    id: 'ambattur',
    name: 'Ambattur Baseline Unit',
    location: 'Chennai, TN',
    skuCount: 20,
    skuCountFormatted: '20 SKUs',
    totalStockValue: 645650,
    totalStockFormatted: '₹6,45,650',
    nonMovingValue: 223110,
    nonMovingFormatted: '₹2,23,110',
    nonMovingSkus: 8,
    slowMovingValue: 63600,
    slowMovingFormatted: '₹63,600',
    slowMovingSkus: 2,
    prioritySkus: 10,
    carryingCostPct: 22,
    annualCarryingBurn: Math.round(223110 * 0.22), // 49084
    annualCarryingBurnFormatted: '₹49,084',
    otifPercent: 50,
    otifPassed: 9,
    otifTotal: 18,
    otifSummary: '50% OTIF (9/18)',
    freightLeakValue: 13944,
    freightLeakFormatted: '₹13,944',
    flaggedLRs: 12,
    freightSummary: '₹13,944 Freight Leak across 12 Flagged LRs',
    binMatchPercent: 60,
    binVarianceValue: 24800,
    binVarianceFormatted: '₹24,800',
    auditedBins: 6,
    binSummary: '60% Bin Match / ₹24,800 Variance across 6 Bins',
    summaryLine:
      '20 SKUs · ₹6,45,650 Total Stock · ₹2,23,110 Non-Moving (8 SKUs) · ₹63,600 Slow-Moving (2 SKUs) · 50% OTIF (9/18) · ₹13,944 Freight Leak across 12 Flagged LRs · 60% Bin Match / ₹24,800 Variance across 6 Bins',
  },
  sriperumbudur: {
    id: 'sriperumbudur',
    name: 'Sriperumbudur Press & Machining',
    location: 'Kanchipuram, TN',
    skuCount: 45,
    skuCountFormatted: '45 SKUs',
    totalStockValue: 1840000,
    totalStockFormatted: '₹18,40,000',
    nonMovingValue: 512000,
    nonMovingFormatted: '₹5,12,000',
    nonMovingSkus: 14,
    slowMovingValue: 195000,
    slowMovingFormatted: '₹1,95,000',
    slowMovingSkus: 6,
    prioritySkus: 20,
    carryingCostPct: 22,
    annualCarryingBurn: Math.round(512000 * 0.22), // 112640
    annualCarryingBurnFormatted: '₹1,12,640',
    otifPercent: 68,
    otifPassed: 17,
    otifTotal: 25,
    otifSummary: '68% OTIF (17/25)',
    freightLeakValue: 28400,
    freightLeakFormatted: '₹28,400',
    flaggedLRs: 9,
    freightSummary: '₹28,400 Freight Leak across 9 Flagged LRs',
    binMatchPercent: 75,
    binVarianceValue: 41200,
    binVarianceFormatted: '₹41,200',
    auditedBins: 5,
    binSummary: '75% Bin Match / ₹41,200 Variance across 5 Bins',
    summaryLine:
      '45 SKUs · ₹18,40,000 Total Stock · ₹5,12,000 Non-Moving (14 SKUs) · ₹1,95,000 Slow-Moving (6 SKUs) · 68% OTIF (17/25) · ₹28,400 Freight Leak across 9 Flagged LRs · 75% Bin Match / ₹41,200 Variance across 5 Bins',
  },
  hosur: {
    id: 'hosur',
    name: 'Hosur Auto Components Unit',
    location: 'Krishnagiri, TN',
    skuCount: 12400,
    skuCountFormatted: '12,400 SKUs',
    totalStockValue: 48250000,
    totalStockFormatted: '₹4,82,50,000',
    nonMovingValue: 1842000,
    nonMovingFormatted: '₹18,42,000',
    nonMovingSkus: 24,
    slowMovingValue: 3260000,
    slowMovingFormatted: '₹32,60,000',
    slowMovingSkus: 41,
    prioritySkus: 18,
    carryingCostPct: 22,
    annualCarryingBurn: Math.round(1842000 * 0.22), // 405240
    annualCarryingBurnFormatted: '₹4,05,240',
    otifPercent: 74,
    otifPassed: 37,
    otifTotal: 50,
    otifSummary: '74% OTIF (37/50)',
    freightLeakValue: 46500,
    freightLeakFormatted: '₹46,500',
    flaggedLRs: 15,
    freightSummary: '₹46,500 Freight Leak across 15 Flagged LRs',
    binMatchPercent: 82,
    binVarianceValue: 68000,
    binVarianceFormatted: '₹68,000',
    auditedBins: 8,
    binSummary: '82% Bin Match / ₹68,000 Variance across 8 Bins',
    summaryLine:
      '12,400 SKUs · ₹4,82,50,000 Total Stock · ₹18,42,000 Non-Moving (24 SKUs) · ₹32,60,000 Slow-Moving (41 SKUs) · 74% OTIF (37/50) · ₹46,500 Freight Leak across 15 Flagged LRs · 82% Bin Match / ₹68,000 Variance across 8 Bins',
  },
};

export interface CfoPolicyPreset {
  id: 'strict_cfo' | 'standard_baseline' | 'lenient_buffer';
  label: string;
  cutoffDays: 120 | 180 | 270;
  carryingCostPct: 24 | 22 | 18;
}

export const CFO_POLICY_PRESETS: CfoPolicyPreset[] = [
  {
    id: 'strict_cfo',
    label: 'Strict CFO: 120d / 24%',
    cutoffDays: 120,
    carryingCostPct: 24,
  },
  {
    id: 'standard_baseline',
    label: 'Standard Baseline: 180d / 22%',
    cutoffDays: 180,
    carryingCostPct: 22,
  },
  {
    id: 'lenient_buffer',
    label: 'Lenient Buffer: 270d / 18%',
    cutoffDays: 270,
    carryingCostPct: 18,
  },
];

export interface SimulatedPolicyInput {
  plantId?: PlantId;
  cutoffDays?: number;
  carryingCostPct?: number;
  excludeReserveSpares?: boolean;
  baseDeadStock?: number;
  baseSlowStock?: number;
}

export interface SimulatedPolicyOutput {
  plantId: PlantId;
  cutoffDays: number;
  carryingCostPct: number;
  excludeReserveSpares: boolean;
  rawDeadStock: number;
  reserveSparesProtectedValue: number;
  simulatedDeadStock: number;
  simulatedDeadStockFormatted: string;
  annualCarryingBurn: number;
  annualCarryingBurnFormatted: string;
  targetRecovery35Pct: number;
  targetRecoveryFormatted: string;
  flaggedLRs: number;
  freightLeakValue: number;
  otifPercent: number;
  binMatchPercent: number;
  binVarianceValue: number;
}

/**
 * Pure, deterministic helper that formats the trailing 14 days in 'en-IN' format:
 * "Current Fortnight (DD Mon YYYY – DD Mon YYYY)"
 */
export function getDynamicFortnightLabel(referenceDate: Date = new Date()): string {
  const endDate = new Date(referenceDate.getTime());
  const startDate = new Date(referenceDate.getTime() - 13 * 24 * 60 * 60 * 1000);

  const fmt = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return `Current Fortnight (${fmt.format(startDate)} – ${fmt.format(endDate)})`;
}

/**
 * Pure, deterministic CFO Policy Simulator calculation engine across 120d / 180d / 270d cutoffs,
 * carrying-cost percentages (default 22%), and the 15% critical machine spares reserve buffer toggle.
 */
export function computeSimulatedPolicyMetrics(input: SimulatedPolicyInput = {}): SimulatedPolicyOutput {
  const plantId: PlantId = input.plantId ?? 'ambattur';
  const preset = PLATFORM_DEMO_PLANTS[plantId] ?? PLATFORM_DEMO_PLANTS.ambattur;

  const cutoffDays = input.cutoffDays ?? 180;
  const carryingCostPct = input.carryingCostPct ?? 22;
  const excludeReserveSpares = Boolean(input.excludeReserveSpares);

  const baseDead = input.baseDeadStock ?? preset.nonMovingValue;
  const baseSlow = input.baseSlowStock ?? preset.slowMovingValue;

  let rawDeadStock = baseDead;
  if (cutoffDays < 180) {
    // Stricter threshold (e.g. 120d) reclassifies a proportional share of the 90-180d slow-moving cohort into non-moving
    const reclassifiedRatio = Math.min(1, Math.max(0, (180 - cutoffDays) / 90));
    rawDeadStock = Math.round(baseDead + baseSlow * reclassifiedRatio);
  } else if (cutoffDays > 180) {
    // More lenient threshold (e.g. 270d) retains only deeper aged items
    rawDeadStock = Math.round(baseDead * (180 / cutoffDays));
  }

  const reserveSparesProtectedValue = excludeReserveSpares ? Math.round(rawDeadStock * 0.15) : 0;
  const simulatedDeadStock = rawDeadStock - reserveSparesProtectedValue;
  const annualCarryingBurn = Math.round(simulatedDeadStock * (carryingCostPct / 100));
  const targetRecovery35Pct = Math.round(simulatedDeadStock * 0.35);

  const formatINR = (val: number) => `₹${Math.round(val).toLocaleString('en-IN')}`;

  return {
    plantId,
    cutoffDays,
    carryingCostPct,
    excludeReserveSpares,
    rawDeadStock,
    reserveSparesProtectedValue,
    simulatedDeadStock,
    simulatedDeadStockFormatted: formatINR(simulatedDeadStock),
    annualCarryingBurn,
    annualCarryingBurnFormatted: formatINR(annualCarryingBurn),
    targetRecovery35Pct,
    targetRecoveryFormatted: formatINR(targetRecovery35Pct),
    flaggedLRs: preset.flaggedLRs,
    freightLeakValue: preset.freightLeakValue,
    otifPercent: preset.otifPercent,
    binMatchPercent: preset.binMatchPercent,
    binVarianceValue: preset.binVarianceValue,
  };
}

interface PlatformTopBarProps {
  selectedPlantId: PlantId;
  onSelectPlant: (plantId: PlantId) => void;
  showOperatorTools: boolean;
  onToggleOperatorTools: () => void;
  onBackToWebsite: () => void;
  onRequestPilotAudit: () => void;
}

export const PlatformTopBar: React.FC<PlatformTopBarProps> = ({
  selectedPlantId,
  onSelectPlant,
  showOperatorTools,
  onToggleOperatorTools,
  onBackToWebsite,
  onRequestPilotAudit,
}) => {
  const fortnightLabel = getDynamicFortnightLabel();
  const activePlant = PLATFORM_DEMO_PLANTS[selectedPlantId] ?? PLATFORM_DEMO_PLANTS.ambattur;

  return (
    <div
      data-testid="platform-executive-topbar"
      className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-50"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back to Website + Active Sandbox Fortnight Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-testid="platform-back-to-website-btn"
            onClick={() => {
              trackEvent('click_back_to_website', { source: 'platform_topbar' });
              onBackToWebsite();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
            <span>Website Overview</span>
          </button>

          <div
            data-testid="platform-fortnight-badge"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-950/70 border border-blue-800/70 text-[11px] font-medium text-blue-200"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white">Executive Sandbox:</span>
            <Calendar className="w-3 h-3 text-blue-400 shrink-0 ml-0.5" />
            <span>{fortnightLabel}</span>
          </div>
        </div>

        {/* Center: Clean Demo Plant Switcher + Operator Tools Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1">
            <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <label
              htmlFor="platform-plant-switcher-select"
              className="text-[11px] font-semibold uppercase tracking-wider text-slate-400"
            >
              Select Demo Plant:
            </label>
            <select
              id="platform-plant-switcher-select"
              data-testid="platform-plant-switcher"
              value={selectedPlantId}
              onChange={(e) => onSelectPlant(e.target.value as PlantId)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
            >
              <option value="ambattur" className="bg-slate-900 text-white">
                Ambattur Baseline Unit ({PLATFORM_DEMO_PLANTS.ambattur.skuCountFormatted} · {PLATFORM_DEMO_PLANTS.ambattur.totalStockFormatted})
              </option>
              <option value="sriperumbudur" className="bg-slate-900 text-white">
                Sriperumbudur Press &amp; Machining ({PLATFORM_DEMO_PLANTS.sriperumbudur.skuCountFormatted} · {PLATFORM_DEMO_PLANTS.sriperumbudur.totalStockFormatted})
              </option>
              <option value="hosur" className="bg-slate-900 text-white">
                Hosur Auto Components Unit ({PLATFORM_DEMO_PLANTS.hosur.skuCountFormatted} · {PLATFORM_DEMO_PLANTS.hosur.totalStockFormatted})
              </option>
            </select>
          </div>

          <button
            type="button"
            data-testid="toggle-operator-tools"
            onClick={onToggleOperatorTools}
            aria-pressed={showOperatorTools}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              showOperatorTools
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
              {showOperatorTools ? 'Hide Shop-Floor & Operator Tools' : 'Show Shop-Floor & Operator Tools'}
            </span>
          </button>
        </div>

        {/* Right: Firebase Cloud Sync + Direct Conversion CTA */}
        <div className="flex flex-wrap items-center gap-2">
          <FirebaseCloudSyncBar activePlantId={selectedPlantId} compact />
          <button
            type="button"
            data-testid="platform-request-pilot-btn"
            onClick={() => {
              trackEvent('hero_primary_cta_clicked', { source: 'platform_topbar' });
              onRequestPilotAudit();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer"
          >
            <span>Run on Your Plant Data (Free 48h Pilot)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-strip: Selected Plant Canonical Summary Strip */}
      <div className="bg-slate-900/90 border-t border-slate-800/80 px-4 sm:px-6 py-1.5">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-400">{activePlant.name}:</span>
            <span data-testid="platform-active-plant-summary" className="text-slate-300">
              {activePlant.summaryLine}
            </span>
          </div>
          <span className="text-slate-400 hidden xl:inline">
            Mode: {showOperatorTools ? 'Full Plant + Shop-Floor Operator Tools' : 'Executive Overview Mode (MD / CFO / Plant Head)'}
          </span>
        </div>
      </div>
    </div>
  );
};
