/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Package,
  Truck,
  Scale,
  ScanBarcode,
  Search,
  Download,
  Info,
  Layers,
  Sliders,
} from 'lucide-react';
import {
  LivePlatformDataSnapshot,
  PlatformNavId,
  formatINRCompact,
  formatINRFull,
} from '../dashboardConfig';
import {
  DemoDataNotice,
  StatusBadge,
  ValueClassificationBadge,
  DataQualityBanner,
  MethodologyPanel,
  TrendInsightCard,
  EmptyState,
} from '../components/SharedDashboardPrimitives';
import Project1App from '../../project1/Project1App';
import Project2App from '../../project2/Project2App';
import Project3App from '../../project3/Project3App';
import Project4App from '../../project4/Project4App';
import { trackEvent } from '../../utils/analytics';
import { toSafeCsvCell } from '../../utils/importValidation';
import { downloadAuditTemplate } from '../../utils/pilotDataKitExporter';
import { FactoryAuditModal } from '../../commercial/FactoryAuditModal';
import { getDynamicFortnightLabel } from '../../commercial/PlatformTopBar';

export interface P1CategoryBreakdownItem {
  id: string;
  label: string;
  valueInr: number;
  valueFormatted: string;
  sharePct: number;
  skuExamples: string;
}

/**
 * Pure, deterministic Stagnant Stock Breakdown by Category across:
 * 1. Precision Machined Castings & Sub-Assemblies (60.6% — ₹1,35,250 on Ambattur baseline)
 * 2. Raw Material & Bar Stock (23.2% — ₹51,760 on Ambattur baseline)
 * 3. Bearings, Seals & Maintenance Spares (16.2% — ₹36,100 on Ambattur baseline)
 */
export function computeP1StagnantCategoryBreakdown(
  totalDeadValueInr: number = 223110
): P1CategoryBreakdownItem[] {
  const safeTotal = Math.max(0, Math.round(totalDeadValueInr));
  const isAmbatturExact = safeTotal === 223110;

  const valCastings = isAmbatturExact ? 135250 : Math.round(safeTotal * 0.6062);
  const valRawMaterial = isAmbatturExact ? 51760 : Math.round(safeTotal * 0.232);
  const valSpares = Math.max(0, safeTotal - valCastings - valRawMaterial);

  const fmt = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;

  return [
    {
      id: 'castings_subassemblies',
      label: '1. Precision Machined Castings & Sub-Assemblies',
      valueInr: valCastings,
      valueFormatted: fmt(valCastings),
      sharePct: 60.6,
      skuExamples: 'FG-PBX-G1, FG-FLG-150, FG-GID-NS',
    },
    {
      id: 'raw_material_bar_stock',
      label: '2. Raw Material & Bar Stock',
      valueInr: valRawMaterial,
      valueFormatted: fmt(valRawMaterial),
      sharePct: 23.2,
      skuExamples: 'RM-COP-15, RM-VAL-1IN, RM-MSA-50',
    },
    {
      id: 'bearings_seals_spares',
      label: '3. Bearings, Seals & Maintenance Spares',
      valueInr: valSpares,
      valueFormatted: fmt(valSpares),
      sharePct: 16.2,
      skuExamples: 'CS-EPX-20L, SP-BRG-6308',
    },
  ];
}

interface SharedDomainProps {
  snapshot: LivePlatformDataSnapshot;
  onNavigateDomain: (domain: PlatformNavId) => void;
  onOpenMethodology: (metricId: string) => void;
  onOpenPilotAuditModal?: () => void;
}

function downloadSimpleCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [
    headers.map(toSafeCsvCell).join(','),
    ...rows.map((r) => r.map(toSafeCsvCell).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// 1. INVENTORY DOMAIN VIEW (P1 • Cash Recovery)
// ============================================================================
export const InventoryDomainView: React.FC<SharedDomainProps> = ({
  snapshot,
  onNavigateDomain,
  onOpenMethodology,
  onOpenPilotAuditModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ageFilter, setAgeFilter] = useState<'ALL' | 'NON_MOVING_180' | 'SLOW_90_180' | 'ACTIVE'>(
    'ALL'
  );
  const [showFullWorkbench, setShowFullWorkbench] = useState(false);
  const [showLocalAuditModal, setShowLocalAuditModal] = useState(false);

  const handleOpenAuditModalFromP1 = () => {
    trackEvent('hero_primary_cta_clicked', { source: 'p1_inventory_ledger_cta' });
    if (onOpenPilotAuditModal) {
      onOpenPilotAuditModal();
    } else {
      setShowLocalAuditModal(true);
    }
  };

  const categoryBreakdown = useMemo(
    () => computeP1StagnantCategoryBreakdown(snapshot.p1DeadValue),
    [snapshot.p1DeadValue]
  );
  const dynamicFortnightRange = useMemo(
    () => getDynamicFortnightLabel().replace(/^Current Fortnight \(|\)$/g, ''),
    []
  );

  const enrichedItems = useMemo(() => {
    return snapshot.p1Items.map((item) => {
      const idleDays = item.daysIdle ?? 0;
      const totalValue = item.closingValue ?? item.qtyOnHand * item.costRate;
      const statusBucket =
        idleDays > 180
          ? 'Inactive >180 days (Requires review)'
          : idleDays >= 90
          ? 'Slow-moving (90–180 days)'
          : 'Active (<90 days)';
      return {
        ...item,
        idleDays,
        totalValue,
        statusBucket,
      };
    });
  }, [snapshot.p1Items]);

  const filteredItems = useMemo(() => {
    return enrichedItems
      .filter((item) => {
        if (ageFilter === 'NON_MOVING_180' && item.idleDays <= 180) return false;
        if (ageFilter === 'SLOW_90_180' && (item.idleDays < 90 || item.idleDays > 180))
          return false;
        if (ageFilter === 'ACTIVE' && item.idleDays >= 90) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            item.itemCode.toLowerCase().includes(q) ||
            item.itemName.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.totalValue - a.totalValue);
  }, [enrichedItems, ageFilter, searchQuery]);

  const handleExportCSV = () => {
    trackEvent('report_exported', { domain: 'inventory', reportType: 'inventory_review_csv' });
    downloadSimpleCSV(
      `Operationalyst_Inventory_Review_${snapshot.plant.id}.csv`,
      [
        'SKU Code',
        'Item Description',
        'Category',
        'Closing Qty',
        'Unit Cost (INR)',
        'Total Valuation (INR)',
        'Last Movement Date',
        'Days Since Last Movement',
        'Review Classification',
      ],
      filteredItems.map((i) => [
        i.itemCode,
        i.itemName,
        i.category,
        i.qtyOnHand,
        i.costRate,
        Math.round(i.totalValue),
        i.lastMovement,
        i.idleDays,
        i.statusBucket,
      ])
    );
  };

  return (
    <div className="space-y-6">
      <DemoDataNotice onOpenImports={() => onNavigateDomain('data_imports')} />

      {/* 1. Domain Status & Header */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Package className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold text-white">Inventory</h1>
            <span className="text-xs font-mono text-slate-400">(P1 • Cash Recovery)</span>
            <StatusBadge
              status={snapshot.p1DeadPercent > 20 ? 'Critical' : 'Requires attention'}
              size="md"
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Working capital exposure, aging distribution, and SKUs requiring engineering or procurement review.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => onOpenMethodology('inventory_exposure')}
            className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>How is this calculated?</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Filtered SKUs (.csv)</span>
          </button>
          <button
            onClick={() => setShowFullWorkbench((v) => !v)}
            className={`px-3.5 py-2 rounded-lg font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
              showFullWorkbench
                ? 'bg-amber-500 text-slate-950'
                : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {showFullWorkbench
                ? 'Hide Deep P1 Liquidation Workbench'
                : 'Open Full P1 Liquidation & Rules Workbench'}
            </span>
          </button>
        </div>
      </div>

      {/* Data Quality Banner */}
      <DataQualityBanner
        sourceName="Tally Prime Stock Summary & Item Movement Register"
        lastRefresh="Synced 4 mins ago"
        recordCount={snapshot.p1TotalSkuCount}
        warningsCount={1}
        warningText="Items flagged >180 days require engineering sign-off to exclude critical insurance spares"
        onOpenImports={() => onNavigateDomain('data_imports')}
      />

      {/* 2. Current Priority & 3. Business Relevance + 4. Key Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Total Valued Inventory</span>
            <ValueClassificationBadge type="Actual" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {formatINRCompact(snapshot.p1TotalValue)}
          </div>
          <div className="text-xs text-slate-300 mt-1">
            Across {snapshot.p1TotalSkuCount} active stock ledger SKUs
          </div>
        </div>

        <div className="bg-slate-900/90 border border-l-4 border-l-rose-500 border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-300 font-semibold">
              Inactive &gt;180 Days (Requires Review)
            </span>
            <ValueClassificationBadge type="Actual" />
          </div>
          <div className="text-2xl font-mono font-bold text-rose-300">
            {formatINRCompact(snapshot.p1DeadValue)}
          </div>
          <div className="text-xs text-slate-300 mt-1">
            {snapshot.p1DeadSkuCount} of {snapshot.p1TotalSkuCount} SKUs ({snapshot.p1DeadPercent}% of total value)
          </div>
        </div>

        <div className="bg-slate-900/90 border border-l-4 border-l-amber-500 border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-300 font-semibold">
              Slow-Moving (90–180 Days Idle)
            </span>
            <ValueClassificationBadge type="Actual" />
          </div>
          <div className="text-2xl font-mono font-bold text-amber-300">
            {formatINRCompact(snapshot.p1SlowValue)}
          </div>
          <div className="text-xs text-slate-300 mt-1">
            {snapshot.p1SlowSkuCount} SKUs approaching 180-day threshold
          </div>
        </div>

        <div
          className="bg-slate-900/90 border border-slate-800 rounded-xl p-4"
          title={`Exact CFO Verification Formula: ₹${snapshot.p1DeadValue.toLocaleString('en-IN')} Non-Moving (>180d) × 22% p.a. = ₹${Math.round(snapshot.p1DeadValue * 0.22).toLocaleString('en-IN')}/yr`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-300 font-semibold">Est. Annual Carrying Cost (22%)</span>
            <ValueClassificationBadge type="Estimate" />
          </div>
          <div className="text-2xl font-mono font-bold text-sky-300">
            ₹{Math.round(snapshot.p1DeadValue * 0.22).toLocaleString('en-IN')}/yr
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Formula: ₹{snapshot.p1DeadValue.toLocaleString('en-IN')} × 22% p.a. ({formatINRCompact(Math.round(snapshot.p1DeadValue * 0.22))})
          </div>
        </div>
      </div>

      {/* 5. Trend & 6. Root-Cause / Aging Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-white">
            Inventory Aging Breakdown (Click Any Bucket to Filter Evidence Table)
          </h2>
          <p className="text-xs text-slate-400">
            Items are classified by days elapsed since the last recorded outward movement in the ERP stock register.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button
              onClick={() => {
                setAgeFilter('NON_MOVING_180');
                trackEvent('inventory_investigation_opened', { category: 'NON_MOVING_180' });
              }}
              className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
                ageFilter === 'NON_MOVING_180'
                  ? 'bg-rose-950/60 border-rose-400'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-rose-300">Inactive &gt;180 Days</div>
              <div className="text-lg font-mono font-bold text-white mt-1">
                {snapshot.p1DeadSkuCount} SKUs
              </div>
              <div className="text-xs font-mono text-slate-300">
                {formatINRCompact(snapshot.p1DeadValue)}
              </div>
              <div className="text-[11px] text-sky-300 mt-2 underline">Filter table →</div>
            </button>

            <button
              onClick={() => {
                setAgeFilter('SLOW_90_180');
                trackEvent('inventory_investigation_opened', { category: 'SLOW_90_180' });
              }}
              className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
                ageFilter === 'SLOW_90_180'
                  ? 'bg-amber-950/60 border-amber-400'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-amber-300">Slow-Moving (90–180d)</div>
              <div className="text-lg font-mono font-bold text-white mt-1">
                {snapshot.p1SlowSkuCount} SKUs
              </div>
              <div className="text-xs font-mono text-slate-300">
                {formatINRCompact(snapshot.p1SlowValue)}
              </div>
              <div className="text-[11px] text-sky-300 mt-2 underline">Filter table →</div>
            </button>

            <button
              onClick={() => {
                setAgeFilter('ALL');
                trackEvent('inventory_investigation_opened', { category: 'ALL' });
              }}
              className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
                ageFilter === 'ALL'
                  ? 'bg-sky-950/60 border-sky-400'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-sky-300">All Audited Stock</div>
              <div className="text-lg font-mono font-bold text-white mt-1">
                {snapshot.p1TotalSkuCount} SKUs
              </div>
              <div className="text-xs font-mono text-slate-300">
                {formatINRCompact(snapshot.p1TotalValue)}
              </div>
              <div className="text-[11px] text-sky-300 mt-2 underline">Show all →</div>
            </button>
          </div>
        </div>

        {/* Replaced Empty Historical Trend Card with Stagnant Stock Breakdown by Category */}
        <div
          data-testid="p1-stagnant-category-breakdown-card"
          className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <h2 className="text-sm font-bold text-white">
                Non-Moving Stock Value (&gt;180 Days) vs Target Ceiling
              </h2>
              <span className="text-[11px] font-mono text-sky-300 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded">
                {dynamicFortnightRange}
              </span>
            </div>
            <p className="text-xs text-amber-300 font-medium">
              Target ceiling: Keep &gt;180-day dormant stock below ₹1.00 L (15% of total valuation).
            </p>
          </div>

          <div className="space-y-3 bg-slate-950/90 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">
                Stagnant Stock Breakdown by Category (₹{snapshot.p1DeadValue.toLocaleString('en-IN')} Total)
              </span>
              <span className="font-mono text-rose-300">
                {snapshot.p1DeadSkuCount} Non-Moving SKUs
              </span>
            </div>

            <div className="space-y-2.5">
              {categoryBreakdown.map((cat, idx) => {
                const barColors = ['bg-rose-500', 'bg-amber-500', 'bg-sky-500'];
                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{cat.label}</span>
                      <span className="font-mono font-bold text-white">
                        {cat.valueFormatted} ({cat.sharePct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${barColors[idx % barColors.length]}`}
                        style={{ width: `${cat.sharePct}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      SKUs: {cat.skuExamples}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Source: Tally Prime Stock Summary</span>
            <span>Annual Burn @ 22%: ₹{Math.round(snapshot.p1DeadValue * 0.22).toLocaleString('en-IN')}/yr</span>
          </div>
        </div>
      </div>

      {/* Top Conversion CTA Bar Directly Above the 20-SKU Ledger Table */}
      <div
        data-testid="p1-ledger-conversion-bar-top"
        className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Run This Exact 5-Column Audit on Your Plant Stock
          </div>
          <p className="text-xs text-slate-200 mt-0.5">
            Export 5 columns from Tally Prime, SAP, Busy, or Excel and receive your ranked Non-Moving SKU list &amp; 22% carrying-cost report in 48 hours.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            data-testid="p1-ledger-request-pilot-btn"
            onClick={handleOpenAuditModalFromP1}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md transition cursor-pointer"
          >
            Request 48-Hour Pilot Audit on Your Stock →
          </button>
          <button
            type="button"
            data-testid="p1-ledger-download-template-btn"
            onClick={() => downloadAuditTemplate('p1_inventory_ledger')}
            className="px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download 5-Column CSV Template</span>
          </button>
        </div>
      </div>

      {/* 7. Priority Records & 9. Supporting Evidence Table */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">
              Supporting Inventory Ledger Records ({filteredItems.length} of{' '}
              {snapshot.p1TotalSkuCount} SKUs)
            </h2>
            <p className="text-xs text-slate-400">
              Cautious classification: items are labeled &ldquo;Potentially non-moving under the selected definition&rdquo; pending engineering review.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU code, description, category..."
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <EmptyState
            title="No inventory SKUs match the active filter"
            explanation="Try clearing the search query or switching the aging bucket filter back to All Audited Stock."
            onResetFilters={() => {
              setSearchQuery('');
              setAgeFilter('ALL');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">SKU Code &amp; Description</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold text-right">Closing Qty</th>
                  <th className="py-3 px-4 font-semibold text-right">Unit Cost</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Valuation</th>
                  <th className="py-3 px-4 font-semibold text-right">Days Idle</th>
                  <th className="py-3 px-4 font-semibold">Review Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredItems.slice(0, 20).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-white">{item.itemCode}</div>
                      <div className="text-slate-300">{item.itemName}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{item.category}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-200">
                      {item.qtyOnHand.toLocaleString('en-IN')} Nos
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {formatINRFull(item.costRate)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {formatINRFull(item.totalValue)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-amber-300">
                      {item.idleDays} days
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={
                          item.idleDays > 180
                            ? 'Critical'
                            : item.idleDays >= 90
                            ? 'Requires attention'
                            : 'Verified'
                        }
                      />
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.statusBucket}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Conversion CTA Bar Directly Below the 20-SKU Ledger Table */}
      <div
        data-testid="p1-ledger-conversion-bar-bottom"
        className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <div className="text-xs font-bold text-white">
            Want to see which 15–25 SKUs are locking up working capital in your warehouse?
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Start with our blank 5-column CSV template or request a founder-reviewed 48-hour Pilot Audit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            data-testid="p1-ledger-request-pilot-bottom-btn"
            onClick={handleOpenAuditModalFromP1}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md transition cursor-pointer"
          >
            Request 48-Hour Pilot Audit on Your Stock →
          </button>
          <button
            type="button"
            onClick={() => downloadAuditTemplate('p1_inventory_ledger_bottom')}
            className="px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download 5-Column CSV Template</span>
          </button>
        </div>
      </div>

      {/* 10. Methodology & Definitions */}
      <MethodologyPanel
        methodology={snapshot.methodologies.inventory_exposure}
        onOpenDrawer={onOpenMethodology}
      />

      {/* Full Existing P1 Workbench (Preserves 100% of Liquidation Simulator, Rules, and Sheets) */}
      {showFullWorkbench && (
        <div className="border-t-2 border-sky-500/40 pt-6">
          <Project1App />
        </div>
      )}

      {/* Fallback Local Pilot Audit Modal if InventoryDomainView is rendered standalone */}
      <FactoryAuditModal
        isOpen={showLocalAuditModal}
        onClose={() => setShowLocalAuditModal(false)}
        sourceView="p1_inventory_ledger"
      />
    </div>
  );
};

// ============================================================================
// 2. DELIVERY DOMAIN VIEW (P2 • Customer Promise & Dual-Gate Rule)
// ============================================================================
export const DeliveryDomainView: React.FC<SharedDomainProps> = ({
  snapshot,
  onNavigateDomain,
  onOpenMethodology,
}) => {
  const [gateFilter, setGateFilter] = useState<
    'ALL' | 'FAILED_ALL' | 'LATE_ONLY' | 'SHORT_ONLY' | 'LATE_AND_SHORT' | 'PASSED_BOTH'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFullWorkbench, setShowFullWorkbench] = useState(false);

  const dg = snapshot.p2DualGate;

  const filteredRows = useMemo(() => {
    return dg.rows.filter((row) => {
      const isOTIF = Boolean(row.otif);
      const isOnTime = Boolean(row.onTime);
      const isInFull = Boolean(row.inFull);

      if (gateFilter === 'FAILED_ALL' && isOTIF) return false;
      if (gateFilter === 'PASSED_BOTH' && !isOTIF) return false;
      if (gateFilter === 'LATE_ONLY' && !(!isOnTime && isInFull)) return false;
      if (gateFilter === 'SHORT_ONLY' && !(isOnTime && !isInFull)) return false;
      if (gateFilter === 'LATE_AND_SHORT' && !(!isOnTime && !isInFull)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          row.po.toLowerCase().includes(q) ||
          row.customer.toLowerCase().includes(q) ||
          row.part.toLowerCase().includes(q) ||
          row.vehicle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dg.rows, gateFilter, searchQuery]);

  const handleSelectGateCategory = (
    cat: 'ALL' | 'FAILED_ALL' | 'LATE_ONLY' | 'SHORT_ONLY' | 'LATE_AND_SHORT' | 'PASSED_BOTH'
  ) => {
    trackEvent('delivery_failure_explanation_opened', { category: cat });
    setGateFilter(cat);
  };

  return (
    <div className="space-y-6">
      <DemoDataNotice onOpenImports={() => onNavigateDomain('data_imports')} />

      {/* Header */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Truck className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold text-white">Delivery</h1>
            <span className="text-xs font-mono text-slate-400">(P2 • Customer Promise)</span>
            <StatusBadge
              status={dg.otifPercent < 60 ? 'Critical' : 'Requires attention'}
              size="md"
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Gate OTIF performance with explicit numerator/denominator context and Dual-Gate failure classification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => onOpenMethodology('delivery_otif')}
            className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>How is Gate OTIF calculated?</span>
          </button>
          <button
            onClick={() => setShowFullWorkbench((v) => !v)}
            className={`px-3.5 py-2 rounded-lg font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
              showFullWorkbench
                ? 'bg-amber-500 text-slate-950'
                : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {showFullWorkbench
                ? 'Hide Deep P2 Dispatch & CAPA Workbench'
                : 'Open Full P2 Dispatch, Gate Kiosk & 8D CAPA Workbench'}
            </span>
          </button>
        </div>
      </div>

      <DataQualityBanner
        sourceName="Gate Register + ERP Dispatch Advice"
        lastRefresh="Synced 4 mins ago"
        recordCount={dg.totalDispatches}
        warningsCount={1}
        warningText="Reflects factory gate-out timestamps; customer dock receipt times may vary by transit lane"
        onOpenImports={() => onNavigateDomain('data_imports')}
      />

      {/* Dual-Gate Rule Interactive Explanation Panel */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">
              Dual-Gate Rule Breakdown — {dg.otifPercent}% Gate OTIF ({dg.passedBoth} of{' '}
              {dg.totalDispatches} dispatch lines passed)
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              A customer dispatch passes <strong className="text-white">only</strong> when it satisfies both Gate 1 (On-Time exit) and Gate 2 (In-Full quantity). Click any box below to filter the supporting dispatch records.
            </p>
          </div>
          <span className="text-xs font-mono text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded">
            Dual-Gate SLA Target: ≥ {dg.targetPercent}% On-Time &amp; In-Full
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            onClick={() => handleSelectGateCategory('PASSED_BOTH')}
            className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
              gateFilter === 'PASSED_BOTH'
                ? 'bg-emerald-950/70 border-emerald-400'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-semibold text-emerald-300">Passed Both Rules</div>
            <div className="text-2xl font-mono font-bold text-white mt-1">
              {dg.passedBoth}{' '}
              <span className="text-xs font-normal text-slate-400">/ {dg.totalDispatches}</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">On-Time AND 100% In-Full</div>
          </button>

          <button
            onClick={() => handleSelectGateCategory('LATE_ONLY')}
            className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
              gateFilter === 'LATE_ONLY'
                ? 'bg-amber-950/70 border-amber-400'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-semibold text-amber-300">Failed: Late Only</div>
            <div className="text-2xl font-mono font-bold text-white mt-1">
              {dg.lateOnly} <span className="text-xs font-normal text-slate-400">lines</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">Full qty, but exited gate late</div>
          </button>

          <button
            onClick={() => handleSelectGateCategory('SHORT_ONLY')}
            className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
              gateFilter === 'SHORT_ONLY'
                ? 'bg-amber-950/70 border-amber-400'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-semibold text-amber-300">Failed: Short Only</div>
            <div className="text-2xl font-mono font-bold text-white mt-1">
              {dg.shortOnly} <span className="text-xs font-normal text-slate-400">lines</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">Exited on time, but qty short</div>
          </button>

          <button
            onClick={() => handleSelectGateCategory('LATE_AND_SHORT')}
            className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
              gateFilter === 'LATE_AND_SHORT'
                ? 'bg-rose-950/70 border-rose-400'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-semibold text-rose-300">Failed: Late &amp; Short</div>
            <div className="text-2xl font-mono font-bold text-white mt-1">
              {dg.lateAndShort} <span className="text-xs font-normal text-slate-400">lines</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">Failed both time &amp; quantity</div>
          </button>

          <button
            onClick={() => handleSelectGateCategory('ALL')}
            className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
              gateFilter === 'ALL'
                ? 'bg-sky-950/70 border-sky-400'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-semibold text-sky-300">All Audited Dispatches</div>
            <div className="text-2xl font-mono font-bold text-white mt-1">
              {dg.totalDispatches} <span className="text-xs font-normal text-slate-400">lines</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">Reset category filter</div>
          </button>
        </div>
      </div>

      {/* Supporting Dispatch Evidence Table */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">
              Supporting Dispatch Records ({filteredRows.length} of {dg.totalDispatches} lines)
            </h2>
            <p className="text-xs text-slate-400">
              Showing active filter: <strong className="text-sky-300">{gateFilter}</strong> • Delay causes reflect recorded dispatch desk logs.
            </p>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PO, customer, part, vehicle..."
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">PO &amp; Customer</th>
                <th className="py-3 px-4 font-semibold">Part &amp; Vehicle</th>
                <th className="py-3 px-4 font-semibold">Promised vs Actual Out</th>
                <th className="py-3 px-4 font-semibold text-right">Ordered vs Shipped</th>
                <th className="py-3 px-4 font-semibold">Dual-Gate Outcome</th>
                <th className="py-3 px-4 font-semibold">Recorded Cause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRows.map((row) => {
                const isOTIF = Boolean(row.otif);
                const isOnTime = Boolean(row.onTime);
                const isInFull = Boolean(row.inFull);
                const shortQty = Math.max(0, row.orderedQty - row.shippedQty);
                const failureMode = isOTIF
                  ? 'Passed Both Gates'
                  : !isOnTime && !isInFull
                  ? 'Failed: Late & Short'
                  : !isOnTime
                  ? 'Failed: Late Only'
                  : 'Failed: Short Only';
                return (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-white">{row.po}</div>
                      <div className="text-slate-300">{row.customer}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-medium">{row.part}</div>
                      <div className="text-[11px] font-mono text-slate-400">{row.vehicle}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="text-slate-300">
                        Promised: {row.promisedDate.replace('T', ' ')}
                      </div>
                      <div className={isOnTime ? 'text-emerald-300' : 'text-amber-300'}>
                        Actual: {row.actualOut ? row.actualOut.replace('T', ' ') : 'Pending'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <div className="text-white font-bold">
                        {row.shippedQty} / {row.orderedQty}
                      </div>
                      {shortQty > 0 && (
                        <div className="text-[11px] text-rose-300">Short: {shortQty} units</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={isOTIF ? 'Verified' : 'Critical'} />
                      <div className="text-[11px] text-slate-300 mt-0.5">{failureMode}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {row.delayReason || (isOTIF ? 'On schedule' : 'Requires verification')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <MethodologyPanel
        methodology={snapshot.methodologies.delivery_otif}
        onOpenDrawer={onOpenMethodology}
      />

      {showFullWorkbench && (
        <div className="border-t-2 border-sky-500/40 pt-6">
          <Project2App />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. PROFIT & RISK DOMAIN VIEW (P3 • Profit Protection + Financial/Scenario Tools)
// ============================================================================
export const ProfitRiskDomainView: React.FC<SharedDomainProps> = ({
  snapshot,
  onNavigateDomain,
  onOpenMethodology,
}) => {
  const [showFullWorkbench, setShowFullWorkbench] = useState(false);
  const [recoveryRateAssumption, setRecoveryRateAssumption] = useState<number>(35);
  const [freightReductionAssumption, setFreightReductionAssumption] = useState<number>(60);

  const modeledInventoryCashRelease = Math.round(
    snapshot.p1DeadValue * (recoveryRateAssumption / 100)
  );
  const modeledAnnualFreightSavings = Math.round(
    snapshot.p3LeakageValue * 12 * (freightReductionAssumption / 100)
  );

  return (
    <div className="space-y-6">
      <DemoDataNotice onOpenImports={() => onNavigateDomain('data_imports')} />

      {/* Header */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Scale className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold text-white">Profit &amp; Risk</h1>
            <span className="text-xs font-mono text-slate-400">(P3 • Profit Protection)</span>
            <StatusBadge
              status={snapshot.p3LeakageValue > 50000 ? 'Requires attention' : 'Monitoring'}
              size="md"
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Carrier freight rate variance, detention audit, and financial scenario modeling with strict separation of actuals vs estimates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => onOpenMethodology('profit_freight_variance')}
            className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>How is Freight Variance calculated?</span>
          </button>
          <button
            onClick={() => setShowFullWorkbench((v) => !v)}
            className={`px-3.5 py-2 rounded-lg font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
              showFullWorkbench
                ? 'bg-amber-500 text-slate-950'
                : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {showFullWorkbench
                ? 'Hide Deep P3 Carrier Audit Workbench'
                : 'Open Full P3 Carrier Rate-Card & Debit Note Workbench'}
            </span>
          </button>
        </div>
      </div>

      <DataQualityBanner
        sourceName="Transporter Bills + Signed Lane Rate-Card Master"
        lastRefresh="Synced 4 mins ago"
        recordCount={snapshot.p3TotalTripCount}
        onOpenImports={() => onNavigateDomain('data_imports')}
      />

      {/* Recorded Actuals vs Scenario Modeling Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Audited Freight Spend</span>
            <ValueClassificationBadge type="Actual" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {formatINRCompact(snapshot.p3TotalBilled)}
          </div>
          <div className="text-xs text-slate-300 mt-1">
            Across {snapshot.p3TotalTripCount} carrier invoices in period
          </div>
        </div>

        <div className="bg-slate-900/90 border border-l-4 border-l-amber-500 border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-300 font-semibold">Flagged Billing Variance</span>
            <ValueClassificationBadge type="Actual" />
          </div>
          <div className="text-2xl font-mono font-bold text-amber-300">
            {formatINRCompact(snapshot.p3LeakageValue)}
          </div>
          <div className="text-xs text-slate-300 mt-1">
            {snapshot.p3FlaggedTripCount} of {snapshot.p3TotalTripCount} trips exceed rate card
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Order Value in Failed OTIF</span>
            <ValueClassificationBadge type="Unavailable" />
          </div>
          <div className="text-xs font-semibold text-amber-300 leading-snug my-1.5">
            {snapshot.p2DualGate.revenueAtRiskFormatted}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Order-value column required to compute rupee exposure
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Modeled Working-Capital Release</span>
            <ValueClassificationBadge type="Scenario" />
          </div>
          <div className="text-2xl font-mono font-bold text-indigo-300">
            {formatINRCompact(modeledInventoryCashRelease)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            At {recoveryRateAssumption}% liquidation assumption on &gt;180d stock
          </div>
        </div>
      </div>

      {/* Financial & Scenario Modeling Panel */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">
              CFO Scenario &amp; Sensitivity Simulator (Assumptions vs Recorded Actuals)
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <ValueClassificationBadge type="Actual" />
            <ValueClassificationBadge type="Assumption" />
            <ValueClassificationBadge type="Scenario" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          <div className="space-y-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">
                1. Non-Moving Inventory Recovery Assumption
              </span>
              <ValueClassificationBadge type="Assumption" />
            </div>
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Target liquidation / alternate consumption rate:</span>
                <span className="font-mono font-bold text-sky-300">{recoveryRateAssumption}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={80}
                step={5}
                value={recoveryRateAssumption}
                onChange={(e) => setRecoveryRateAssumption(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
                aria-label="Non-Moving Inventory Recovery Assumption Percentage"
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-400">
                Recorded Base ({formatINRCompact(snapshot.p1DeadValue)} Actual) ×{' '}
                {recoveryRateAssumption}%:
              </span>
              <span className="font-mono font-bold text-indigo-300 text-sm">
                {formatINRCompact(modeledInventoryCashRelease)} (Scenario)
              </span>
            </div>
          </div>

          <div className="space-y-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">
                2. Carrier Variance &amp; Detention Recovery Assumption
              </span>
              <ValueClassificationBadge type="Assumption" />
            </div>
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Percentage of rate-card &amp; detention variance prevented:</span>
                <span className="font-mono font-bold text-sky-300">
                  {freightReductionAssumption}%
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                step={5}
                value={freightReductionAssumption}
                onChange={(e) => setFreightReductionAssumption(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
                aria-label="Carrier Variance Recovery Assumption Percentage"
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-400">
                Annualized Run-Rate on {formatINRCompact(snapshot.p3LeakageValue)}/mo Actual:
              </span>
              <span className="font-mono font-bold text-indigo-300 text-sm">
                {formatINRCompact(modeledAnnualFreightSavings)} / yr (Scenario)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Supporting Freight Trip Evidence Table */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">
            Supporting Carrier Invoice Audit Records ({snapshot.p3TotalTripCount} trips)
          </h2>
          <p className="text-xs text-slate-400">
            Compares contracted lane base freight against carrier-billed amounts and detention surcharges.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">Trip / LR No</th>
                <th className="py-3 px-4 font-semibold">Transporter &amp; Lane</th>
                <th className="py-3 px-4 font-semibold text-right">Contract Base</th>
                <th className="py-3 px-4 font-semibold text-right">Billed Total</th>
                <th className="py-3 px-4 font-semibold text-right">Variance</th>
                <th className="py-3 px-4 font-semibold">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {snapshot.p3CalculatedTrips.slice(0, 15).map((trip) => {
                const variance = Math.max(0, trip.totalLeak || 0);
                const contractBase = Math.max(0, trip.bill - variance);
                return (
                  <tr key={trip.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {trip.id}
                      <div className="text-[11px] font-normal text-slate-400">{trip.date}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-medium">{trip.transporter}</div>
                      <div className="text-[11px] text-slate-400">
                        {trip.lane} ({trip.weightKg} kg)
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {formatINRFull(contractBase)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {formatINRFull(trip.bill)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-300">
                      {variance > 0 ? `+${formatINRFull(variance)}` : '₹0'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={variance > 0 ? 'Requires attention' : 'Verified'} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <MethodologyPanel
        methodology={snapshot.methodologies.profit_freight_variance}
        onOpenDrawer={onOpenMethodology}
      />

      {showFullWorkbench && (
        <div className="border-t-2 border-sky-500/40 pt-6">
          <Project3App />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. WAREHOUSE DOMAIN VIEW (P4 • Warehouse Trust)
// ============================================================================
export const WarehouseDomainView: React.FC<SharedDomainProps> = ({
  snapshot,
  onNavigateDomain,
  onOpenMethodology,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'MISMATCH' | 'MATCHED'>('ALL');
  const [showFullWorkbench, setShowFullWorkbench] = useState(false);

  const filteredBins = useMemo(() => {
    return snapshot.p4Items.filter((item) => {
      if (filterMode === 'MISMATCH') return item.qtyVariance !== 0;
      if (filterMode === 'MATCHED') return item.qtyVariance === 0;
      return true;
    });
  }, [snapshot.p4Items, filterMode]);

  return (
    <div className="space-y-6">
      <DemoDataNotice onOpenImports={() => onNavigateDomain('data_imports')} />

      {/* Header */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <ScanBarcode className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold text-white">Warehouse</h1>
            <span className="text-xs font-mono text-slate-400">(P4 • Warehouse Trust)</span>
            <StatusBadge
              status={snapshot.p4AccuracyPercent < 90 ? 'Requires attention' : 'Monitoring'}
              size="md"
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Storage bin reconciliation status, book-to-physical variance exceptions, and cycle-count verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => onOpenMethodology('warehouse_bin_accuracy')}
            className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>How is Bin Match calculated?</span>
          </button>
          <button
            onClick={() => setShowFullWorkbench((v) => !v)}
            className={`px-3.5 py-2 rounded-lg font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
              showFullWorkbench
                ? 'bg-amber-500 text-slate-950'
                : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {showFullWorkbench
                ? 'Hide Deep P4 Bin Count Workbench'
                : 'Open Full P4 Mobile Count Sheet & Blind Audit Workbench'}
            </span>
          </button>
        </div>
      </div>

      <DataQualityBanner
        sourceName="Physical Cycle Count Sheets + ERP Bin Balance Report"
        lastRefresh="Synced 4 mins ago"
        recordCount={snapshot.p4TotalBins}
        onOpenImports={() => onNavigateDomain('data_imports')}
      />

      {/* Summary Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Bin Reconciliation Match Rate</div>
          <div className="text-2xl font-mono font-bold text-white mt-1">
            {snapshot.p4AccuracyPercent}% ({snapshot.p4MatchedCount} of {snapshot.p4TotalBins} bins)
          </div>
          <div className="text-xs text-slate-300 mt-1">Target threshold: &gt;= 98% matched</div>
        </div>

        <div className="bg-slate-900/90 border border-l-4 border-l-amber-500 border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-300 font-semibold">
            Exception Status: Requires Verification
          </div>
          <div className="text-2xl font-mono font-bold text-amber-300 mt-1">
            {snapshot.p4MismatchCount} Bins
          </div>
          <div className="text-xs text-slate-300 mt-1">
            Physical count differs from ERP book balance
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Absolute Valuation Discrepancy</div>
          <div className="text-2xl font-mono font-bold text-sky-300 mt-1">
            {formatINRCompact(snapshot.p4VarianceAbsValue)}
          </div>
          <div className="text-xs text-slate-300 mt-1">
            Combined shortage and unrecorded surplus value
          </div>
        </div>
      </div>

      {/* Supporting Bin Records */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">
              Storage Bin Reconciliation Evidence ({filteredBins.length} of {snapshot.p4TotalBins}{' '}
              bins)
            </h2>
            <p className="text-xs text-slate-400">
              Control status highlights phantom stock shortages that can trigger unexpected delivery failures.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {(['ALL', 'MISMATCH', 'MATCHED'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                  filterMode === m
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-300 border border-slate-800'
                }`}
              >
                {m === 'ALL'
                  ? `All (${snapshot.p4TotalBins})`
                  : m === 'MISMATCH'
                  ? `Requires Verification (${snapshot.p4MismatchCount})`
                  : `Verified Match (${snapshot.p4MatchedCount})`}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">Bin Location &amp; SKU</th>
                <th className="py-3 px-4 font-semibold text-right">ERP System Qty</th>
                <th className="py-3 px-4 font-semibold text-right">Physical Count</th>
                <th className="py-3 px-4 font-semibold text-right">Qty Variance</th>
                <th className="py-3 px-4 font-semibold text-right">Variance Value</th>
                <th className="py-3 px-4 font-semibold">Control Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredBins.map((bin) => (
                <tr key={bin.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-white">
                      {bin.binLocation} • {bin.skuCode}
                    </div>
                    <div className="text-slate-300">{bin.description}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-200">{bin.systemQty}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    {bin.physicalQty}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-bold ${
                      bin.qtyVariance < 0
                        ? 'text-rose-300'
                        : bin.qtyVariance > 0
                        ? 'text-amber-300'
                        : 'text-emerald-300'
                    }`}
                  >
                    {bin.qtyVariance > 0 ? `+${bin.qtyVariance}` : bin.qtyVariance}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-200">
                    {formatINRFull(bin.absDiscrepancyValue)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge
                      status={bin.qtyVariance === 0 ? 'Verified' : 'Requires attention'}
                    />
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {bin.qtyVariance === 0
                        ? 'Verified match'
                        : bin.qtyVariance < 0
                        ? 'Phantom shortage — requires verification'
                        : 'Unrecorded surplus — check GRN'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <MethodologyPanel
        methodology={snapshot.methodologies.warehouse_bin_accuracy}
        onOpenDrawer={onOpenMethodology}
      />

      {showFullWorkbench && (
        <div className="border-t-2 border-sky-500/40 pt-6">
          <Project4App />
        </div>
      )}
    </div>
  );
};
