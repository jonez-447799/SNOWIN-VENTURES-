/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type PlantId = 'ambattur' | 'sriperumbudur' | 'hosur';
export type PeriodId = 'fortnight_sep' | 'month_sep' | 'q3_fy26';

export interface PlantConfig {
  id: PlantId;
  name: string;
  division: string;
  cluster: string;
  industry: string;
  currencySymbol: string;
  managerPhone: string;
  managerEmail: string;
  kpis: {
    deadStockRupees: number;
    deadStockDisplay: string;
    recoverableRupees: number;
    recoverableDisplay: string;
    aClassDeadRupees: number;
    aClassDeadDisplay: string;
    otifPercent: number;
    totalDispatches: number;
    passDispatches: number;
    failDispatches: number;
    freightLeakRupees: number;
    freightLeakDisplay: string;
    totalFreightPaid: number;
    binAccuracyPercent: number;
    unreliabilityCostRupees: number;
    factoryHealthScore: number;
    subScores: {
      inventory: number;
      otif: number;
      freight: number;
      warehouse: number;
    };
    unpaidBillsRupees: number;
    unpaidBillsDisplay: string;
    topPriorities: {
      rank: number;
      headline: string;
      owner: string;
      pillar: string;
      engine: 'p1' | 'p2' | 'p3' | 'p4' | 'p5';
      badge: string;
    }[];
  };
}

export interface PeriodConfig {
  id: PeriodId;
  label: string;
  shortLabel: string;
  dateRange: string;
  asOfDate: string;
}

import { MULTI_PLANT_BASELINES, computePlantBaselineMetrics } from '../data/multiPlantBaselines';

const ambatturMetrics = computePlantBaselineMetrics(MULTI_PLANT_BASELINES.ambattur);
const sriperumbudurMetrics = computePlantBaselineMetrics(MULTI_PLANT_BASELINES.sriperumbudur);
const hosurMetrics = computePlantBaselineMetrics(MULTI_PLANT_BASELINES.hosur);

export const PLANTS: Record<PlantId, PlantConfig> = {
  ambattur: {
    id: 'ambattur',
    name: 'Ambattur Baseline Unit',
    division: 'Unit 1 - Precision Machined Castings & Valves',
    cluster: 'Ambattur Industrial Estate, Chennai (TN)',
    industry: 'Precision Machined Castings & Industrial Valves',
    currencySymbol: '₹',
    managerPhone: '+91 98401 54321',
    managerEmail: 'planthead.ambattur@factorytower.in',
    kpis: {
      deadStockRupees: ambatturMetrics.p1.deadStockValue,
      deadStockDisplay: '₹2.23L',
      recoverableRupees: ambatturMetrics.p1.targetCashRelease,
      recoverableDisplay: `₹${(ambatturMetrics.p1.targetCashRelease / 100000).toFixed(2)}L`,
      aClassDeadRupees: 115000,
      aClassDeadDisplay: '₹1.15L',
      otifPercent: ambatturMetrics.p2.otifPercent,
      totalDispatches: ambatturMetrics.p2.totalDispatches,
      passDispatches: ambatturMetrics.p2.passes,
      failDispatches: ambatturMetrics.p2.fails,
      freightLeakRupees: ambatturMetrics.p3.totalLeak,
      freightLeakDisplay: '₹14K',
      totalFreightPaid: ambatturMetrics.p3.freightPaid,
      binAccuracyPercent: ambatturMetrics.p4.binAccuracyPercent,
      unreliabilityCostRupees: ambatturMetrics.p4.absVarianceRupees,
      factoryHealthScore: 69,
      subScores: {
        inventory: 69,
        otif: ambatturMetrics.p2.otifPercent,
        freight: 74,
        warehouse: ambatturMetrics.p4.binAccuracyPercent,
      },
      unpaidBillsRupees: 485000,
      unpaidBillsDisplay: '₹4.85L',
      topPriorities: [
        {
          rank: 1,
          headline: '₹2.23L Dead Stock Locked (8 SKUs >180 Days)',
          owner: 'Inventory Manager',
          pillar: 'P1 • Cash Recovery',
          engine: 'p1',
          badge: '🔴 Critical',
        },
        {
          rank: 2,
          headline: 'Hyundai vendor park (50% OTIF, 9/18 loads failed)',
          owner: 'Dispatch Head',
          pillar: 'P2 • Revenue Protection',
          engine: 'p2',
          badge: '🔴 Critical',
        },
        {
          rank: 3,
          headline: 'Siva Transport — ₹13,944 Freight Leakage',
          owner: 'Logistics Head',
          pillar: 'P3 • Profit Protection',
          engine: 'p3',
          badge: '🔴 Critical',
        },
        {
          rank: 4,
          headline: '6 Mismatched Bins (60% Bin Match Accuracy)',
          owner: 'Warehouse Head',
          pillar: 'P4 • Inventory Trust',
          engine: 'p4',
          badge: '🟡 Warning',
        },
        {
          rank: 5,
          headline: '4 Active Plant CAPAs Assigned Across Pillars',
          owner: 'Plant Head',
          pillar: 'P5 • Control Tower',
          engine: 'p5',
          badge: '🟡 Monitor',
        },
      ],
    },
  },
  sriperumbudur: {
    id: 'sriperumbudur',
    name: 'Sriperumbudur Press & Machining',
    division: 'Unit 2 - Tier-1 Stamping & BIW Sub-Assemblies',
    cluster: 'Sriperumbudur Auto Corridor, Chennai (TN)',
    industry: 'Automotive Tier-1 Sheet Metal Stamping & BIW',
    currencySymbol: '₹',
    managerPhone: '+91 98401 23456',
    managerEmail: 'planthead.sriperumbudur@apexprecision.com',
    kpis: {
      deadStockRupees: sriperumbudurMetrics.p1.deadStockValue,
      deadStockDisplay: '₹18.4L',
      recoverableRupees: sriperumbudurMetrics.p1.targetCashRelease,
      recoverableDisplay: `₹${(sriperumbudurMetrics.p1.targetCashRelease / 100000).toFixed(2)}L`,
      aClassDeadRupees: 752000,
      aClassDeadDisplay: '₹7.52L',
      otifPercent: 91,
      totalDispatches: sriperumbudurMetrics.p2.totalDispatches,
      passDispatches: sriperumbudurMetrics.p2.passes,
      failDispatches: sriperumbudurMetrics.p2.fails,
      freightLeakRupees: sriperumbudurMetrics.p3.totalLeak,
      freightLeakDisplay: '₹74K',
      totalFreightPaid: sriperumbudurMetrics.p3.freightPaid,
      binAccuracyPercent: 96,
      unreliabilityCostRupees: sriperumbudurMetrics.p4.absVarianceRupees,
      factoryHealthScore: 76,
      subScores: {
        inventory: 74,
        otif: sriperumbudurMetrics.p2.otifPercent,
        freight: 79,
        warehouse: sriperumbudurMetrics.p4.binAccuracyPercent,
      },
      unpaidBillsRupees: 1420000,
      unpaidBillsDisplay: '₹14.2L',
      topPriorities: [
        {
          rank: 1,
          headline: `₹${(sriperumbudurMetrics.p1.deadStockValue / 100000).toFixed(2)}L Dead Stock in Legacy BS-IV Dies & Coils`,
          owner: 'Inventory Manager',
          pillar: 'P1 • Cash Recovery',
          engine: 'p1',
          badge: '🔴 Critical',
        },
        {
          rank: 2,
          headline: `Hyundai & Renault-Nissan JIT (${sriperumbudurMetrics.p2.otifPercent}% OTIF, ${sriperumbudurMetrics.p2.fails}/${sriperumbudurMetrics.p2.totalDispatches} failed)`,
          owner: 'Dispatch Head',
          pillar: 'P2 • Revenue Protection',
          engine: 'p2',
          badge: '🟡 Warning',
        },
        {
          rank: 3,
          headline: `Sriperumbudur Express — ₹${Math.round(sriperumbudurMetrics.p3.totalLeak / 1000)}K Freight & Detention Leak`,
          owner: 'Logistics Head',
          pillar: 'P3 • Profit Protection',
          engine: 'p3',
          badge: '🔴 Critical',
        },
        {
          rank: 4,
          headline: `${sriperumbudurMetrics.p4.linesMismatch} Mismatched Stamping Bins (${sriperumbudurMetrics.p4.binAccuracyPercent}% Accuracy)`,
          owner: 'Warehouse Head',
          pillar: 'P4 • Inventory Trust',
          engine: 'p4',
          badge: '🟡 Warning',
        },
        {
          rank: 5,
          headline: '4 Active Stamping & BIW CAPA Investigations',
          owner: 'Plant Head',
          pillar: 'P5 • Control Tower',
          engine: 'p5',
          badge: '🟡 Monitor',
        },
      ],
    },
  },
  hosur: {
    id: 'hosur',
    name: 'Hosur Auto Components Unit',
    division: 'Unit 3 - Heavy Drivetrain Forgings & CNC Gears',
    cluster: 'Hosur SIPCOT Phase-II Industrial Complex (TN)',
    industry: 'Heavy Drivetrain Forgings & Heat-Treated CNC Gears',
    currencySymbol: '₹',
    managerPhone: '+91 94432 11223',
    managerEmail: 'factoryhead@hosurforgings.in',
    kpis: {
      deadStockRupees: hosurMetrics.p1.deadStockValue,
      deadStockDisplay: '₹8.75L',
      recoverableRupees: hosurMetrics.p1.targetCashRelease,
      recoverableDisplay: `₹${(hosurMetrics.p1.targetCashRelease / 100000).toFixed(2)}L`,
      aClassDeadRupees: 1094000,
      aClassDeadDisplay: '₹10.94L',
      otifPercent: 84,
      totalDispatches: hosurMetrics.p2.totalDispatches,
      passDispatches: hosurMetrics.p2.passes,
      failDispatches: hosurMetrics.p2.fails,
      freightLeakRupees: hosurMetrics.p3.totalLeak,
      freightLeakDisplay: '₹36K',
      totalFreightPaid: hosurMetrics.p3.freightPaid,
      binAccuracyPercent: 88,
      unreliabilityCostRupees: hosurMetrics.p4.absVarianceRupees,
      factoryHealthScore: 73,
      subScores: {
        inventory: 71,
        otif: hosurMetrics.p2.otifPercent,
        freight: 72,
        warehouse: hosurMetrics.p4.binAccuracyPercent,
      },
      unpaidBillsRupees: 1650000,
      unpaidBillsDisplay: '₹16.5L',
      topPriorities: [
        {
          rank: 1,
          headline: `₹${(hosurMetrics.p1.deadStockValue / 100000).toFixed(2)}L Trapped in Obsolete Forging Billets & Dies`,
          owner: 'Inventory Manager',
          pillar: 'P1 • Cash Recovery',
          engine: 'p1',
          badge: '🔴 Critical',
        },
        {
          rank: 2,
          headline: `Ashok Leyland & TVS Lines (${hosurMetrics.p2.otifPercent}% OTIF, ${hosurMetrics.p2.fails}/${hosurMetrics.p2.totalDispatches} failed)`,
          owner: 'Dispatch Head',
          pillar: 'P2 • Revenue Protection',
          engine: 'p2',
          badge: '🟡 Warning',
        },
        {
          rank: 3,
          headline: `Kaveri Heavy Haulage — ₹${Math.round(hosurMetrics.p3.totalLeak / 1000)}K Interstate Rate Leak`,
          owner: 'Logistics Head',
          pillar: 'P3 • Profit Protection',
          engine: 'p3',
          badge: '🔴 Critical',
        },
        {
          rank: 4,
          headline: `${hosurMetrics.p4.linesMismatch} Forging Yard & Gear Store Bin Variances`,
          owner: 'Warehouse Head',
          pillar: 'P4 • Inventory Trust',
          engine: 'p4',
          badge: '🟡 Warning',
        },
        {
          rank: 5,
          headline: '4 Active Forging & Heat-Treat CAPA Actions',
          owner: 'Plant Head',
          pillar: 'P5 • Control Tower',
          engine: 'p5',
          badge: '🟡 Monitor',
        },
      ],
    },
  },
};

import { getDynamicFortnightLabel } from '../commercial/PlatformTopBar';

export const PERIODS: Record<PeriodId, PeriodConfig> = {
  fortnight_sep: {
    id: 'fortnight_sep',
    label: getDynamicFortnightLabel(),
    shortLabel: 'Current Fortnight',
    dateRange: getDynamicFortnightLabel().replace(/^Current Fortnight \(|\)$/g, ''),
    asOfDate: '2026-11-09',
  },
  month_sep: {
    id: 'month_sep',
    label: 'Full Month: Nov 2026',
    shortLabel: 'Nov 2026',
    dateRange: '01 Nov – 30 Nov 2026',
    asOfDate: '2026-11-30',
  },
  q3_fy26: {
    id: 'q3_fy26',
    label: 'Quarter: Q3 FY26 (Oct–Dec 2026)',
    shortLabel: 'Q3 FY26',
    dateRange: '01 Oct – 31 Dec 2026',
    asOfDate: '2026-11-09',
  },
};

interface PlantContextType {
  activePlantId: PlantId;
  activePlant: PlantConfig;
  setActivePlantId: (plantId: PlantId) => void;
  activePeriodId: PeriodId;
  activePeriod: PeriodConfig;
  setActivePeriodId: (periodId: PeriodId) => void;
  allPlants: PlantConfig[];
  allPeriods: PeriodConfig[];
}

const PlantContext = createContext<PlantContextType | undefined>(undefined);

const STORAGE_KEY_PLANT = 'suite_active_plant_id_v2';
const STORAGE_KEY_PERIOD = 'suite_active_period_id_v2';

export const PlantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activePlantId, setActivePlantIdState] = useState<PlantId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLANT) as PlantId;
      if (saved && PLANTS[saved]) return saved;
    } catch {}
    return 'ambattur';
  });

  const [activePeriodId, setActivePeriodIdState] = useState<PeriodId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PERIOD) as PeriodId;
      if (saved && PERIODS[saved]) return saved;
    } catch {}
    return 'fortnight_sep';
  });

  const setActivePlantId = (plantId: PlantId) => {
    if (!PLANTS[plantId]) return;
    setActivePlantIdState(plantId);
    try {
      localStorage.setItem(STORAGE_KEY_PLANT, plantId);
      // Sync P2 active workspace key
      if (plantId === 'ambattur') {
        localStorage.setItem('otif_active_workspace_id_v2', 'ws_apex_01');
      } else if (plantId === 'sriperumbudur') {
        localStorage.setItem('otif_active_workspace_id_v2', 'ws_apex_01');
      } else if (plantId === 'hosur') {
        localStorage.setItem('otif_active_workspace_id_v2', 'ws_sundaram_03');
      }
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

  const setActivePeriodId = (periodId: PeriodId) => {
    if (!PERIODS[periodId]) return;
    setActivePeriodIdState(periodId);
    try {
      localStorage.setItem(STORAGE_KEY_PERIOD, periodId);
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

  useEffect(() => {
    const handleStorage = () => {
      try {
        const p = localStorage.getItem(STORAGE_KEY_PLANT) as PlantId;
        if (p && PLANTS[p] && p !== activePlantId) setActivePlantIdState(p);
        const per = localStorage.getItem(STORAGE_KEY_PERIOD) as PeriodId;
        if (per && PERIODS[per] && per !== activePeriodId) setActivePeriodIdState(per);
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [activePlantId, activePeriodId]);

  const value: PlantContextType = {
    activePlantId,
    activePlant: PLANTS[activePlantId],
    activePeriodId,
    activePeriod: PERIODS[activePeriodId],
    setActivePlantId,
    setActivePeriodId,
    allPlants: Object.values(PLANTS),
    allPeriods: Object.values(PERIODS),
  };

  return <PlantContext.Provider value={value}>{children}</PlantContext.Provider>;
};

export const usePlant = (): PlantContextType => {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error('usePlant must be used within a PlantProvider');
  }
  return context;
};
