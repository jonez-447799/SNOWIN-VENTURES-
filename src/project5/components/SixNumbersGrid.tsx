import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  ArrowUpRight, 
  PackageX, 
  Clock, 
  Truck, 
  CheckCircle2, 
  IndianRupee, 
  Layers, 
  AlertTriangle,
  RefreshCw,
  History,
  TrendingDown,
  TrendingUp,
  Database,
  Save,
  RotateCcw
} from 'lucide-react';
import { MondayTowerData, Language } from '../types';
import { formatINR, formatPercent } from '../utils/formatters';
import { TRANSLATIONS } from '../utils/translations';

interface SixNumbersGridProps {
  towerData: MondayTowerData;
  language: Language;
  isDarkMode: boolean;
  onOpenProject: (projectId: number) => void;
}

export interface StoredPreviousWeek {
  deadCashRupees: number;
  stockoutRiskCount: number;
  ordersLateCount: number;
  dispatchesCount: number;
  freightPerTrip: number;
  otifPercent: number;
  unpaidBillsRupees: number;
  weekEndingDate: string;
  source: string;
  updatedAt: string;
}

const LOCAL_STORAGE_KEY = 'monday_control_tower_prev_week_baseline';

export const SixNumbersGrid: React.FC<SixNumbersGridProps> = ({
  towerData,
  language,
  isDarkMode,
  onOpenProject,
}) => {
  const t = TRANSLATIONS[language];
  const [filterMode, setFilterMode] = useState<'all' | 'worsening' | 'improving' | 'stable'>('all');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [storageFeedback, setStorageFeedback] = useState<string | null>(null);

  // Initialize previous week records from localStorage or seed initial baseline
  const [prevWeekRecord, setPrevWeekRecord] = useState<StoredPreviousWeek>(() => {
    const fallback: StoredPreviousWeek = {
      deadCashRupees: towerData.previousMonday.deadCashRupees,
      stockoutRiskCount: towerData.previousMonday.stockoutRiskCount,
      ordersLateCount: towerData.previousMonday.ordersLateCount,
      dispatchesCount: towerData.previousMonday.dispatchesCount,
      freightPerTrip: towerData.previousMonday.freightPerTrip,
      otifPercent: towerData.previousMonday.otifPercent,
      unpaidBillsRupees: towerData.previousMonday.unpaidBillsRupees,
      weekEndingDate: '28 Sep 2026',
      source: 'Local Storage Baseline Archive',
      updatedAt: '28 Sep 2026, 09:00 AM IST'
    };

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fallback));
      return fallback;
    } catch (e) {
      return fallback;
    }
  });

  // Re-fetch from localStorage on demand or sync changes
  const fetchFromLocalStorage = () => {
    setIsSyncing(true);
    setTimeout(() => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          setPrevWeekRecord(JSON.parse(stored));
          setStorageFeedback('Loaded baseline records from local storage');
        } else {
          // Re-seed
          const baseline: StoredPreviousWeek = {
            deadCashRupees: towerData.previousMonday.deadCashRupees,
            stockoutRiskCount: towerData.previousMonday.stockoutRiskCount,
            ordersLateCount: towerData.previousMonday.ordersLateCount,
            dispatchesCount: towerData.previousMonday.dispatchesCount,
            freightPerTrip: towerData.previousMonday.freightPerTrip,
            otifPercent: towerData.previousMonday.otifPercent,
            unpaidBillsRupees: towerData.previousMonday.unpaidBillsRupees,
            weekEndingDate: '28 Sep 2026',
            source: 'Local Storage Baseline Archive',
            updatedAt: '28 Sep 2026, 09:00 AM IST'
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(baseline));
          setPrevWeekRecord(baseline);
          setStorageFeedback('Initialized baseline in local storage');
        }
      } catch (err) {
        console.error(err);
      }
      setIsSyncing(false);
      setTimeout(() => setStorageFeedback(null), 3000);
    }, 400);
  };

  // Helper to save current towerData as the new previous week baseline in localStorage
  const handleSaveCurrentAsPreviousBaseline = () => {
    const freightNow = towerData.tripsCount > 0 
      ? Math.round(towerData.freightPaidRupees / towerData.tripsCount) 
      : 0;
    const otifNow = towerData.dispatchesCount > 0 
      ? Math.round((towerData.otifPassesCount / towerData.dispatchesCount) * 100) 
      : 0;

    const newSnapshot: StoredPreviousWeek = {
      deadCashRupees: towerData.deadCashRupees,
      stockoutRiskCount: towerData.stockoutRiskCount,
      ordersLateCount: towerData.ordersLateCount,
      dispatchesCount: towerData.dispatchesCount,
      freightPerTrip: freightNow,
      otifPercent: otifNow,
      unpaidBillsRupees: towerData.unpaidBillsRupees,
      weekEndingDate: towerData.weekEndingDate,
      source: 'User Stored Snapshot (Local Storage)',
      updatedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST'
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSnapshot));
    setPrevWeekRecord(newSnapshot);
    setStorageFeedback('Current week values saved as previous week baseline in local storage!');
    setTimeout(() => setStorageFeedback(null), 3500);
  };

  const handleResetBaseline = () => {
    const defaultBaseline: StoredPreviousWeek = {
      deadCashRupees: towerData.previousMonday.deadCashRupees,
      stockoutRiskCount: towerData.previousMonday.stockoutRiskCount,
      ordersLateCount: towerData.previousMonday.ordersLateCount,
      dispatchesCount: towerData.previousMonday.dispatchesCount,
      freightPerTrip: towerData.previousMonday.freightPerTrip,
      otifPercent: towerData.previousMonday.otifPercent,
      unpaidBillsRupees: towerData.previousMonday.unpaidBillsRupees,
      weekEndingDate: '28 Sep 2026',
      source: 'Ambattur 28 Sep Baseline',
      updatedAt: '28 Sep 2026, 09:00 AM IST'
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultBaseline));
    setPrevWeekRecord(defaultBaseline);
    setStorageFeedback('Reset baseline in local storage to Ambattur 28 Sep week');
    setTimeout(() => setStorageFeedback(null), 3000);
  };

  // Current Week Metric Calculations
  const freightPerTrip = towerData.tripsCount > 0 
    ? towerData.freightPaidRupees / towerData.tripsCount 
    : 0;
  
  const otifPercent = towerData.dispatchesCount > 0 
    ? (towerData.otifPassesCount / towerData.dispatchesCount) * 100 
    : 0;

  // Real-time comparison of current week's values against previous week stored in localStorage
  const deadCashDiff = towerData.deadCashRupees - prevWeekRecord.deadCashRupees;
  const deadCashPct = prevWeekRecord.deadCashRupees > 0 
    ? ((deadCashDiff / prevWeekRecord.deadCashRupees) * 100).toFixed(1) 
    : '0';

  const stockoutDiff = towerData.stockoutRiskCount - prevWeekRecord.stockoutRiskCount;
  const stockoutPct = prevWeekRecord.stockoutRiskCount > 0
    ? ((stockoutDiff / prevWeekRecord.stockoutRiskCount) * 100).toFixed(0)
    : '0';

  const ordersLateDiff = towerData.ordersLateCount - prevWeekRecord.ordersLateCount;
  const ordersLatePct = prevWeekRecord.ordersLateCount > 0
    ? ((ordersLateDiff / prevWeekRecord.ordersLateCount) * 100).toFixed(0)
    : '0';

  const freightDiff = freightPerTrip - prevWeekRecord.freightPerTrip;
  const freightPct = prevWeekRecord.freightPerTrip > 0 
    ? ((freightDiff / prevWeekRecord.freightPerTrip) * 100).toFixed(1) 
    : '0';

  const otifDiff = otifPercent - prevWeekRecord.otifPercent;
  const otifRelativePct = prevWeekRecord.otifPercent > 0
    ? ((otifDiff / prevWeekRecord.otifPercent) * 100).toFixed(1)
    : '0';

  const unpaidDiff = towerData.unpaidBillsRupees - prevWeekRecord.unpaidBillsRupees;
  const unpaidPct = prevWeekRecord.unpaidBillsRupees > 0
    ? ((unpaidDiff / prevWeekRecord.unpaidBillsRupees) * 100).toFixed(1)
    : '0';

  const metrics = [
    {
      id: 1,
      num: '01',
      title: 'Dead cash',
      value: formatINR(towerData.deadCashRupees),
      prevValue: formatINR(prevWeekRecord.deadCashRupees),
      reading: 'Rupees in items not moving for 180 days',
      source: 'Project 1 owner page',
      provenanceNote: towerData.deadCashFileUnchanged 
        ? 'Stock file unchanged since 28 Sep (Number retained)' 
        : 'Refreshed from uploaded stock file',
      delta: deadCashDiff === 0 
        ? 'Unchanged vs stored baseline' 
        : deadCashDiff > 0 
          ? `+${formatINR(deadCashDiff)} (+${deadCashPct}%)` 
          : `-${formatINR(Math.abs(deadCashDiff))} (${deadCashPct}%)`,
      percentLabel: deadCashDiff === 0 ? '0.0%' : `${deadCashDiff > 0 ? '+' : ''}${deadCashPct}%`,
      arrowDirection: deadCashDiff > 0 ? ('up' as const) : deadCashDiff < 0 ? ('down' as const) : ('flat' as const),
      trendStatus: deadCashDiff > 0 ? ('worsening' as const) : deadCashDiff < 0 ? ('improving' as const) : ('stable' as const),
      projectCode: 'P1',
      icon: PackageX,
      accent: deadCashDiff > 0 ? 'border-l-rose-500' : 'border-l-neutral-600',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      actionTitle: 'Open Dead Stock File',
    },
    {
      id: 2,
      num: '02',
      title: 'Stockout risk',
      value: `${towerData.stockoutRiskCount} SKUs`,
      prevValue: `${prevWeekRecord.stockoutRiskCount} SKUs`,
      reading: 'Important SKUs with under two weeks left',
      source: 'A-items & fast movers < 14d',
      provenanceNote: 'Counted SKUs (M12 bolts, DOM tubes, Nitrile seals, 6204 bearing)',
      delta: stockoutDiff === 0 
        ? 'Same count as stored baseline' 
        : stockoutDiff > 0 
          ? `+${stockoutDiff} SKU (+${stockoutPct}%)` 
          : `${stockoutDiff} SKU (${stockoutPct}%)`,
      percentLabel: stockoutDiff === 0 ? '0%' : `${stockoutDiff > 0 ? '+' : ''}${stockoutPct}%`,
      arrowDirection: stockoutDiff > 0 ? ('up' as const) : stockoutDiff < 0 ? ('down' as const) : ('flat' as const),
      trendStatus: stockoutDiff > 0 ? ('worsening' as const) : stockoutDiff < 0 ? ('improving' as const) : ('stable' as const),
      projectCode: 'P4 / P1',
      icon: Layers,
      accent: stockoutDiff > 0 ? 'border-l-amber-500' : 'border-l-emerald-500',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      actionTitle: 'Open Stockout Parts',
    },
    {
      id: 3,
      num: '03',
      title: 'Orders late',
      value: `${towerData.ordersLateCount} of ${towerData.dispatchesCount}`,
      prevValue: `${prevWeekRecord.ordersLateCount} of ${prevWeekRecord.dispatchesCount}`,
      reading: 'Loads that missed the promised time',
      source: 'Project 2 dispatch logs',
      provenanceNote: 'Clock fail only (pure departure delay, not short load)',
      delta: ordersLateDiff === 0 
        ? 'Same late count as stored baseline' 
        : ordersLateDiff > 0 
          ? `+${ordersLateDiff} late (+${ordersLatePct}%)` 
          : `${ordersLateDiff} late (${ordersLatePct}%)`,
      percentLabel: ordersLateDiff === 0 ? '0%' : `${ordersLateDiff > 0 ? '+' : ''}${ordersLatePct}%`,
      arrowDirection: ordersLateDiff > 0 ? ('up' as const) : ordersLateDiff < 0 ? ('down' as const) : ('flat' as const),
      trendStatus: ordersLateDiff > 0 ? ('worsening' as const) : ordersLateDiff < 0 ? ('improving' as const) : ('stable' as const),
      projectCode: 'P2',
      icon: Clock,
      accent: ordersLateDiff > 0 ? 'border-l-orange-500' : 'border-l-emerald-500',
      badgeColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      actionTitle: 'Open Late Loads',
    },
    {
      id: 4,
      num: '04',
      title: 'Freight per trip',
      value: formatINR(Math.round(freightPerTrip)),
      prevValue: formatINR(prevWeekRecord.freightPerTrip),
      reading: 'Bill divided by trips',
      source: `₹${(towerData.freightPaidRupees / 1000).toFixed(0)}k bills / ${towerData.tripsCount} trips`,
      provenanceNote: `Stored baseline: ${formatINR(prevWeekRecord.freightPerTrip)}/trip`,
      delta: freightDiff === 0 
        ? 'Identical to stored baseline' 
        : freightDiff > 0 
          ? `+${formatINR(Math.round(freightDiff))} (+${freightPct}%)` 
          : `-${formatINR(Math.abs(Math.round(freightDiff)))} (${freightPct}%)`,
      percentLabel: freightDiff === 0 ? '0.0%' : `${freightDiff > 0 ? '+' : ''}${freightPct}%`,
      arrowDirection: freightDiff > 0 ? ('up' as const) : freightDiff < 0 ? ('down' as const) : ('flat' as const),
      trendStatus: freightDiff > 0 ? ('worsening' as const) : freightDiff < 0 ? ('improving' as const) : ('stable' as const),
      projectCode: 'P3',
      icon: Truck,
      accent: freightDiff > 0 ? 'border-l-yellow-500' : 'border-l-emerald-500',
      badgeColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      actionTitle: 'Open Freight Lanes',
    },
    {
      id: 5,
      num: '05',
      title: 'OTIF',
      value: formatPercent(otifPercent),
      prevValue: `${prevWeekRecord.otifPercent}%`,
      reading: 'On time and in full',
      source: `${towerData.otifPassesCount} passes / ${towerData.dispatchesCount} dispatches`,
      provenanceNote: 'Strict rule: late full load and on-time short load both fail',
      delta: otifDiff === 0 
        ? 'Identical to stored baseline' 
        : otifDiff > 0 
          ? `+${Math.round(otifDiff)}% (+${otifRelativePct}%)` 
          : `${Math.round(otifDiff)}% (${otifRelativePct}%)`,
      percentLabel: otifDiff === 0 ? '0.0%' : `${otifDiff > 0 ? '+' : ''}${Math.round(otifDiff)}%`,
      // For OTIF, a downward drop is worsening!
      arrowDirection: otifDiff > 0 ? ('up' as const) : otifDiff < 0 ? ('down' as const) : ('flat' as const),
      trendStatus: otifDiff < 0 ? ('worsening' as const) : otifDiff > 0 ? ('improving' as const) : ('stable' as const),
      projectCode: 'P2',
      icon: CheckCircle2,
      accent: otifDiff < 0 ? 'border-l-purple-500' : 'border-l-emerald-500',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      actionTitle: 'Open OTIF Audit',
    },
    {
      id: 6,
      num: '06',
      title: 'Unpaid bills',
      value: formatINR(towerData.unpaidBillsRupees),
      prevValue: formatINR(prevWeekRecord.unpaidBillsRupees),
      reading: 'Customers holding his cash',
      source: `Tally outstandings > ${towerData.normalCreditDays} credit days`,
      provenanceNote: "Cash blocked outside factory; excludes this week's invoices",
      delta: unpaidDiff === 0 
        ? 'Identical to stored baseline' 
        : unpaidDiff > 0 
          ? `+${formatINR(unpaidDiff)} (+${unpaidPct}%)` 
          : `-${formatINR(Math.abs(unpaidDiff))} (${unpaidPct}%)`,
      percentLabel: unpaidDiff === 0 ? '0.0%' : `${unpaidDiff > 0 ? '+' : ''}${unpaidPct}%`,
      arrowDirection: unpaidDiff > 0 ? ('up' as const) : unpaidDiff < 0 ? ('down' as const) : ('flat' as const),
      trendStatus: unpaidDiff > 0 ? ('worsening' as const) : unpaidDiff < 0 ? ('improving' as const) : ('stable' as const),
      projectCode: 'Tally',
      icon: IndianRupee,
      accent: unpaidDiff > 0 ? 'border-l-red-500' : 'border-l-emerald-500',
      badgeColor: 'text-red-400 bg-red-500/10 border-red-500/20',
      actionTitle: 'Open Tally Debtors',
    },
  ];

  const worseningCount = metrics.filter(m => m.trendStatus === 'worsening').length;
  const improvingCount = metrics.filter(m => m.trendStatus === 'improving').length;
  const stableCount = metrics.filter(m => m.trendStatus === 'stable').length;

  const filteredMetrics = metrics.filter(m => {
    if (filterMode === 'all') return true;
    return m.trendStatus === filterMode;
  });

  return (
    <div className="space-y-4">
      {/* Top Header & Local Storage Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              {t.sixNumbersHeader}
            </h2>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <Database className="w-3 h-3" />
              <span>localStorage Baseline: {prevWeekRecord.weekEndingDate}</span>
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Dynamic Lucide arrows indicate whether each KPI is improving or worsening against local storage records.
          </p>
        </div>

        {/* Local Storage Action Buttons & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className={`flex items-center p-0.5 rounded-lg border text-xs font-mono ${
            isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-300'
          }`}>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded transition-all ${
                filterMode === 'all'
                  ? isDarkMode
                    ? 'bg-neutral-800 text-amber-400 font-bold shadow-xs'
                    : 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All (6)
            </button>
            <button
              onClick={() => setFilterMode('worsening')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition-all ${
                filterMode === 'worsening'
                  ? 'bg-rose-500/20 text-rose-400 font-bold shadow-xs'
                  : 'text-rose-400/80 hover:text-rose-400'
              }`}
            >
              <ArrowUp className="w-3 h-3 text-rose-400 stroke-[3]" />
              <span>Worsening ({worseningCount})</span>
            </button>
            <button
              onClick={() => setFilterMode('improving')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition-all ${
                filterMode === 'improving'
                  ? 'bg-emerald-500/20 text-emerald-400 font-bold shadow-xs'
                  : 'text-emerald-400/80 hover:text-emerald-400'
              }`}
            >
              <ArrowDown className="w-3 h-3 text-emerald-400 stroke-[3]" />
              <span>Improving ({improvingCount})</span>
            </button>
            <button
              onClick={() => setFilterMode('stable')}
              className={`px-2.5 py-1 rounded transition-all ${
                filterMode === 'stable'
                  ? isDarkMode
                    ? 'bg-neutral-800 text-neutral-200 font-bold shadow-xs'
                    : 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Stable ({stableCount})
            </button>
          </div>

          {/* LocalStorage Control Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchFromLocalStorage}
              disabled={isSyncing}
              title="Reload baseline values from localStorage"
              className="p-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <button
              onClick={handleSaveCurrentAsPreviousBaseline}
              title="Save current numbers to local storage as the previous week comparison baseline"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            >
              <Save className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Save as Baseline</span>
            </button>

            <button
              onClick={handleResetBaseline}
              title="Reset local storage baseline to initial Ambattur 28 Sep numbers"
              className="p-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Storage Toast Notification */}
      {storageFeedback && (
        <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono flex items-center justify-between animate-in fade-in">
          <span>{storageFeedback}</span>
          <span className="text-[10px] text-neutral-400">Key: {LOCAL_STORAGE_KEY}</span>
        </div>
      )}

      {/* Grid of 6 Cards with dynamic Lucide trend arrow icons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMetrics.map((item) => {
          const Icon = item.icon;
          const isWorsening = item.trendStatus === 'worsening';
          const isImproving = item.trendStatus === 'improving';

          return (
            <div
              key={item.id}
              onClick={() => onOpenProject(item.id)}
              className={`group relative rounded-xl border border-l-4 ${item.accent} p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between ${
                isDarkMode
                  ? isWorsening
                    ? 'bg-neutral-900/95 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 hover:shadow-lg'
                    : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 hover:shadow-lg'
                  : isWorsening
                    ? 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-md'
                    : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-md'
              }`}
            >
              <div>
                {/* Top header inside card */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-neutral-500">
                      {item.num}.
                    </span>
                    <h3 className="font-semibold text-sm tracking-tight capitalize">
                      {item.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {/* Worsening / Improving / Stable Badge */}
                    {isWorsening && (
                      <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        Worsening
                      </span>
                    )}
                    {isImproving && (
                      <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Improving
                      </span>
                    )}
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${item.badgeColor}`}>
                      {item.projectCode}
                    </span>
                  </div>
                </div>

                {/* Primary Number Hero + Dynamic Lucide Directional Arrow Indicator */}
                <div className="my-2.5 flex items-baseline gap-2.5 flex-wrap">
                  <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums group-hover:text-amber-400 transition-colors">
                    {item.value}
                  </div>

                  {/* Dynamic Lucide Arrow Badge */}
                  <div 
                    title={`Compared against localStorage record (${item.prevValue}): ${item.delta}`}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold transition-all shadow-xs ${
                      isWorsening
                        ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
                        : isImproving
                          ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                          : 'text-neutral-400 bg-neutral-800/90 border border-neutral-700'
                    }`}
                  >
                    {/* Dynamic Lucide Arrow Icons */}
                    {item.arrowDirection === 'up' && (
                      <ArrowUp className="w-4 h-4 shrink-0 stroke-[3]" />
                    )}
                    {item.arrowDirection === 'down' && (
                      <ArrowDown className="w-4 h-4 shrink-0 stroke-[3]" />
                    )}
                    {item.arrowDirection === 'flat' && (
                      <Minus className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                    )}
                    
                    <span className="tabular-nums font-mono text-[11px]">
                      {item.percentLabel}
                    </span>
                  </div>
                </div>

                {/* The One-Line Reading as strictly prescribed */}
                <div className="text-xs font-medium text-neutral-300 mb-2">
                  {item.reading}
                </div>

                {/* Provenance and baseline comparison note against local storage */}
                <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono mt-1">
                  <span>localStorage Baseline: <strong className="text-neutral-400">{item.prevValue}</strong></span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {isWorsening ? '↑ Got Worse' : isImproving ? '↓ Improved' : '— Stable'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug mt-1">
                  {item.provenanceNote}
                </p>
              </div>

              {/* Bottom footer bar with delta comparison */}
              <div className="mt-4 pt-3 border-t border-neutral-800/40 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-1.5">
                  {isWorsening ? (
                    <span className="text-rose-400 flex items-center gap-1 font-semibold">
                      <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.delta}</span>
                    </span>
                  ) : isImproving ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.delta}</span>
                    </span>
                  ) : (
                    <span className="text-neutral-400 flex items-center gap-1">
                      <Minus className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.delta}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-amber-500 opacity-90 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  <span>Open</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMetrics.length === 0 && (
        <div className="p-8 text-center text-xs text-neutral-500 border border-dashed rounded-xl">
          No metrics matching the selected filter ({filterMode}).
        </div>
      )}
    </div>
  );
};
