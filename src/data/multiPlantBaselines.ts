/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { StockItem, RulesConfig as P1RulesConfig } from '../project1/types.ts';
import {
  AMBATTUR_FABRICATION_SAMPLE,
  DEFAULT_RULES as P1_DEFAULT_RULES,
} from '../project1/data/initialData.ts';
import { evaluateStockEngine, generateOwnerReport } from '../project1/utils/calculations.ts';

import type { DispatchRow, RulesConfig as P2RulesConfig } from '../project2/types/otif.ts';
import {
  INITIAL_DISPATCHES as AMBATTUR_P2_DISPATCHES,
  INITIAL_RULES as P2_DEFAULT_RULES,
} from '../project2/data/initialData.ts';
import { calculateOTIFMetrics } from '../project2/utils/otifCalculator.ts';

import type { Trip, RulesConfig as P3RulesConfig } from '../project3/types/freight.ts';
import {
  INITIAL_TRIPS as AMBATTUR_P3_TRIPS,
  DEFAULT_RULES as P3_DEFAULT_RULES,
} from '../project3/data/defaultData.ts';
import { calculateAuditMetrics } from '../project3/utils/auditCalculations.ts';

import type { AuditItem, AuditRules as P4RulesConfig } from '../project4/types/audit.ts';
import {
  INITIAL_SAMPLE_SKUS as AMBATTUR_P4_BINS,
  DEFAULT_RULES as P4_DEFAULT_RULES,
} from '../project4/data/sampleData.ts';
import { computeSummary } from '../project4/utils/auditCalculations.ts';

import {
  normalizeCapaItem,
  type CapaPillar,
  type CapaDispositionType,
  type CapaVerificationStage,
} from '../utils/capaLedger.ts';

export type PlantId = 'ambattur' | 'sriperumbudur' | 'hosur';

export const ALLOWED_PLANT_IDS: PlantId[] = ['ambattur', 'sriperumbudur', 'hosur'];

export interface PlantCapaItem {
  id: string;
  title: string;
  domain: 'inventory' | 'delivery' | 'profit_risk' | 'warehouse';
  domainLabel: string;
  priority: 'Critical' | 'Requires attention' | 'Monitoring';
  evidenceRef: string;
  owner: string;
  dueDate: string;
  status: 'Open' | 'In progress' | 'Awaiting verification' | 'Resolved';
  notes: string;
  pillar?: CapaPillar;
  dispositionType?: CapaDispositionType;
  linkedRecordId?: string;
  identifiedExposureInr?: number;
  targetRecoveryInr?: number;
  realizedRecoveryInr?: number;
  verificationStage?: CapaVerificationStage;
}

export interface PlantBaselineDataset {
  plantId: PlantId;
  plantName: string;
  division: string;
  clusterLocation: string;
  industry: string;
  p1Items: StockItem[];
  p1Rules: P1RulesConfig;
  p2Dispatches: DispatchRow[];
  p2Rules: P2RulesConfig;
  p3Trips: Trip[];
  p3Rules: P3RulesConfig;
  p4Bins: AuditItem[];
  p4Rules: P4RulesConfig;
  capaItems: PlantCapaItem[];
}

export interface PlantDeterministicSummary {
  plantId: PlantId;
  plantName: string;
  clusterLocation: string;
  p1: {
    totalSkus: number;
    totalBookValue: number;
    deadStockValue: number;
    deadSkusCount: number;
    slowMovingValue: number;
    slowSkusCount: number;
    annualCarryingCostDrain: number;
    targetCashRelease: number;
  };
  p2: {
    totalDispatches: number;
    passes: number;
    fails: number;
    failsLateOnly: number;
    failsShortOnly: number;
    failsLateAndShort: number;
    otifPercent: number;
  };
  p3: {
    totalTrips: number;
    flaggedTrips: number;
    freightPaid: number;
    rateLeak: number;
    detention: number;
    totalLeak: number;
  };
  p4: {
    totalBins: number;
    linesMatched: number;
    linesMismatch: number;
    binAccuracyPercent: number;
    shelfShortRupees: number;
    foundStockRupees: number;
    absVarianceRupees: number;
  };
  capaCount: number;
}

// ============================================================================
// 1. AMBATTUR BASELINE (Canonical 20 SKUs, 18 P2, 12 P3, 15 P4)
// ============================================================================
const AMBATTUR_CAPA_ITEMS: PlantCapaItem[] = [
  {
    id: 'AMB-CAPA-01',
    title: 'Freeze repeat purchase indents on 8 Dead SKUs (>180d) locking ₹2,23,110',
    domain: 'inventory',
    domainLabel: 'Inventory (P1)',
    priority: 'Critical',
    evidenceRef: '8 stock ledger rows (FG-PBX-G1, FG-FLG-150)',
    owner: 'Inventory Manager (S. Venkat)',
    dueDate: 'Within 5 days',
    status: 'In progress',
    notes: 'Separate mandatory machine breakdown spares from obsolete fabrication batches.',
    pillar: 'P1_INVENTORY',
    dispositionType: 'B2B_LIQUIDATION_SCRAP',
    linkedRecordId: 'FG-PBX-G1',
    identifiedExposureInr: 223110,
    targetRecoveryInr: 156177,
    realizedRecoveryInr: 68500,
    verificationStage: 'IN_EXECUTION',
  },
  {
    id: 'AMB-CAPA-02',
    title: 'Enforce T-24h pre-dispatch gate staging for Hyundai Vendor Park (40% OTIF)',
    domain: 'delivery',
    domainLabel: 'Delivery (P2)',
    priority: 'Critical',
    evidenceRef: '9 failed dispatch lines',
    owner: 'Dispatch Head (R. Karthik)',
    dueDate: 'Within 72 hrs',
    status: 'Open',
    notes: 'Require QC release stamp 4 hours prior to promised gate-out cut-off.',
    pillar: 'P2_OTIF',
    dispositionType: 'DISPATCH_SCHEDULING_FIX',
    linkedRecordId: 'DISP-102',
    identifiedExposureInr: 84000,
    targetRecoveryInr: 72000,
    realizedRecoveryInr: 0,
    verificationStage: 'OPEN',
  },
  {
    id: 'AMB-CAPA-03',
    title: 'Issue debit note for Siva Transport rate & detention variance (₹10,178)',
    domain: 'profit_risk',
    domainLabel: 'Profit & Risk (P3)',
    priority: 'Requires attention',
    evidenceRef: 'LR-SIV-1049, LR-SIV-1088',
    owner: 'Logistics Head (A. Kumar)',
    dueDate: 'Within 5 days',
    status: 'Awaiting verification',
    notes: 'Reconcile 5-hour gate detention claims against physical security register.',
    pillar: 'P3_FREIGHT',
    dispositionType: 'FREIGHT_DEBIT_NOTE',
    linkedRecordId: 'LR-SIV-1049',
    identifiedExposureInr: 13944,
    targetRecoveryInr: 10178,
    realizedRecoveryInr: 10178,
    verificationStage: 'PENDING_FINANCE_SIGN_OFF',
  },
  {
    id: 'AMB-CAPA-04',
    title: 'Run blind morning cycle count on 6 mismatched counter/mezzanine bins (₹24,240 short)',
    domain: 'warehouse',
    domainLabel: 'Warehouse (P4)',
    priority: 'Critical',
    evidenceRef: '6 bin audit sheets (EV-CHG-01, EV-BRK-04)',
    owner: 'Stores Head (M. Prabhu)',
    dueDate: 'Within 72 hrs',
    status: 'Resolved',
    notes: 'Relocate fast-moving brake pads from mezzanine to ground counter rack.',
    pillar: 'P4_WAREHOUSE',
    dispositionType: 'BIN_RECONCILIATION_RECOUNT',
    linkedRecordId: 'EV-CHG-01',
    identifiedExposureInr: 24240,
    targetRecoveryInr: 24240,
    realizedRecoveryInr: 18400,
    verificationStage: 'VERIFIED_REALIZED',
  },
];

// ============================================================================
// 2. SRIPERUMBUDUR BASELINE (16 Stamping SKUs, 16 P2, 10 P3, 12 P4, 4 CAPAs)
// ============================================================================
export const SRIPERUMBUDUR_P1_SKUS: StockItem[] = [
  // Dead items (>180 days as of 2026-10-01 => lastMovement before 2026-04-04)
  {
    id: 'sri-sku-01',
    itemCode: 'SRI-STAMP-101',
    itemName: 'BIW Dash Panel Stamping (Legacy Gen-2)',
    category: 'Finished Goods',
    qtyOnHand: 45,
    costRate: 6400,
    lastMovement: '2025-11-12', // 323 days idle => ₹2,88,000
    movementDates: ['2025-07-10', '2025-09-18', '2025-11-12'],
  },
  {
    id: 'sri-sku-02',
    itemCode: 'SRI-STAMP-102',
    itemName: 'High-Tensile Cross Member Bracket RH',
    category: 'Finished Goods',
    qtyOnHand: 80,
    costRate: 2950,
    lastMovement: '2026-01-19', // 255 days idle => ₹2,36,000
    movementDates: ['2025-10-04', '2025-12-01', '2026-01-19'],
  },
  {
    id: 'sri-sku-03',
    itemCode: 'SRI-STAMP-103',
    itemName: 'Galvanized Coil Slit 1.2mm x 420mm (Obsolete Width)',
    category: 'Raw Material',
    qtyOnHand: 120,
    costRate: 1850,
    lastMovement: '2025-12-22', // 283 days idle => ₹2,22,000
    movementDates: ['2025-08-14', '2025-10-29', '2025-12-22'],
  },
  {
    id: 'sri-sku-04',
    itemCode: 'SRI-STAMP-104',
    itemName: 'Progressive Blank Die Insert Set #4 (800T Press)',
    category: 'Spares',
    qtyOnHand: 12,
    costRate: 14500,
    lastMovement: '2026-02-08', // 235 days idle => ₹1,74,000
    movementDates: ['2025-09-15', '2026-02-08'],
  },
  {
    id: 'sri-sku-05',
    itemCode: 'SRI-STAMP-105',
    itemName: 'Door Impact Beam Side-Intrusion Tube LH',
    category: 'Finished Goods',
    qtyOnHand: 65,
    costRate: 2100,
    lastMovement: '2026-03-10', // 205 days idle => ₹1,36,500
    movementDates: ['2025-11-19', '2026-01-14', '2026-03-10'],
  },
  {
    id: 'sri-sku-06',
    itemCode: 'SRI-STAMP-106',
    itemName: 'Deep-Draw Lubrication Compound Drum 50L',
    category: 'Consumable',
    qtyOnHand: 18,
    costRate: 4200,
    lastMovement: '2026-03-22', // 193 days idle => ₹75,600
    movementDates: ['2025-12-10', '2026-03-22'],
  },
  // Slow-moving items (90 to 179 days as of 2026-10-01 => 2026-04-05 to 2026-07-03)
  {
    id: 'sri-sku-07',
    itemCode: 'SRI-STAMP-107',
    itemName: 'Spot-Weld Projection Nut M8x1.25 Cage Sub-Assy',
    category: 'Raw Material',
    qtyOnHand: 150,
    costRate: 920,
    lastMovement: '2026-05-18', // 136 days idle => ₹1,38,000
    movementDates: ['2026-02-11', '2026-04-02', '2026-05-18'],
  },
  {
    id: 'sri-sku-08',
    itemCode: 'SRI-STAMP-108',
    itemName: 'Rear Wheel House Inner Stamping Panel',
    category: 'Finished Goods',
    qtyOnHand: 40,
    costRate: 3450,
    lastMovement: '2026-06-12', // 111 days idle => ₹1,38,000
    movementDates: ['2026-03-15', '2026-05-01', '2026-06-12'],
  },
  {
    id: 'sri-sku-09',
    itemCode: 'SRI-STAMP-109',
    itemName: 'Pneumatic Cushion Pin Guide Bushing 65mm',
    category: 'Spares',
    qtyOnHand: 28,
    costRate: 2600,
    lastMovement: '2026-06-25', // 98 days idle => ₹72,800
    movementDates: ['2026-04-10', '2026-06-25'],
  },
  // Active moving items (<90 days idle)
  {
    id: 'sri-sku-10',
    itemCode: 'SRI-STAMP-110',
    itemName: 'CRCA EDD Grade Steel Coil 0.8mm x 1250mm',
    category: 'Raw Material',
    qtyOnHand: 95,
    costRate: 4800,
    lastMovement: '2026-09-26', // 5 days idle => ₹4,56,000
    movementDates: ['2026-09-05', '2026-09-15', '2026-09-26'],
  },
  {
    id: 'sri-sku-11',
    itemCode: 'SRI-STAMP-111',
    itemName: 'Front Strut Tower Reinforcement Assembly',
    category: 'Finished Goods',
    qtyOnHand: 110,
    costRate: 2400,
    lastMovement: '2026-09-28', // 3 days idle => ₹2,64,000
    movementDates: ['2026-09-10', '2026-09-20', '2026-09-28'],
  },
  {
    id: 'sri-sku-12',
    itemCode: 'SRI-STAMP-112',
    itemName: 'B-Pillar Upper Hinge Reinforcement Stamping',
    category: 'Finished Goods',
    qtyOnHand: 130,
    costRate: 1650,
    lastMovement: '2026-09-24', // 7 days idle => ₹2,14,500
    movementDates: ['2026-09-02', '2026-09-14', '2026-09-24'],
  },
  {
    id: 'sri-sku-13',
    itemCode: 'SRI-STAMP-113',
    itemName: 'Copper-Chromium Spot Welding Electrode Cap 16mm',
    category: 'Consumable',
    qtyOnHand: 240,
    costRate: 380,
    lastMovement: '2026-09-27', // 4 days idle => ₹91,200
    movementDates: ['2026-09-08', '2026-09-19', '2026-09-27'],
  },
  {
    id: 'sri-sku-14',
    itemCode: 'SRI-STAMP-114',
    itemName: 'Radiator Core Support Lower Tie-Bar',
    category: 'Finished Goods',
    qtyOnHand: 75,
    costRate: 1920,
    lastMovement: '2026-08-19', // 43 days idle => ₹1,44,000
    movementDates: ['2026-07-12', '2026-08-04', '2026-08-19'],
  },
  {
    id: 'sri-sku-15',
    itemCode: 'SRI-STAMP-115',
    itemName: 'Floor Tunnel Heat Shield Embossed Aluminum',
    category: 'Finished Goods',
    qtyOnHand: 90,
    costRate: 1150,
    lastMovement: '2026-08-28', // 34 days idle => ₹1,03,500
    movementDates: ['2026-07-22', '2026-08-11', '2026-08-28'],
  },
  {
    id: 'sri-sku-16',
    itemCode: 'SRI-STAMP-116',
    itemName: 'Anti-Rust VCI Poly Bag Liner Roll 1200mm',
    category: 'Consumable',
    qtyOnHand: 60,
    costRate: 850,
    lastMovement: '2026-09-22', // 9 days idle => ₹51,000
    movementDates: ['2026-09-01', '2026-09-12', '2026-09-22'],
  },
];

export const SRIPERUMBUDUR_P2_DISPATCHES: DispatchRow[] = [
  // 12 PASS dispatches + 4 FAIL dispatches = 16 total (75.0% OTIF)
  {
    id: 'SRI-DISP-01',
    customer: 'Hyundai Motor India (Irungattukottai)',
    po: 'PO-HMIL-9101',
    part: 'Front Strut Tower Reinforcement Assembly',
    orderedQty: 200,
    shippedQty: 200,
    promisedDate: '2026-09-16',
    actualOut: '2026-09-16 11:15',
    vehicle: 'TN-21-AT-4401',
    delayReason: '',
  },
  {
    id: 'SRI-DISP-02',
    customer: 'Renault Nissan Automotive (Oragadam)',
    po: 'PO-RNAIPL-4402',
    part: 'B-Pillar Upper Hinge Reinforcement Stamping',
    orderedQty: 180,
    shippedQty: 180,
    promisedDate: '2026-09-16',
    actualOut: '2026-09-16 14:10',
    vehicle: 'TN-21-AT-4402',
    delayReason: '',
  },
  {
    id: 'SRI-DISP-03',
    customer: 'Hyundai Mobis Module Plant',
    po: 'PO-MOBIS-3109',
    part: 'BIW Dash Panel Stamping',
    orderedQty: 120,
    shippedQty: 120,
    promisedDate: '2026-09-17',
    actualOut: '2026-09-18 10:40', // Late only (1 day late)
    vehicle: 'TN-21-AT-4408',
    delayReason: 'QC hold',
    notes: '3D CMM fixture re-verification required after die change.',
  },
  {
    id: 'SRI-DISP-04',
    customer: 'Daimler India Commercial Vehicles (Oragadam)',
    po: 'PO-DICV-7720',
    part: 'High-Tensile Cross Member Bracket RH',
    orderedQty: 150,
    shippedQty: 120, // Short only
    promisedDate: '2026-09-18',
    actualOut: '2026-09-18 13:20',
    vehicle: 'TN-21-AT-4411',
    delayReason: 'Material short',
    notes: '30 brackets held due to M8 weld nut feed shortage at projection press.',
  },
  {
    id: 'SRI-DISP-05',
    customer: 'Royal Enfield (Oragadam Plant)',
    po: 'PO-RE-5582',
    part: 'Floor Tunnel Heat Shield Embossed Aluminum',
    orderedQty: 250,
    shippedQty: 250,
    promisedDate: '2026-09-19',
    actualOut: '2026-09-19 10:00',
    vehicle: 'TN-21-AT-4415',
    delayReason: '',
  },
  {
    id: 'SRI-DISP-06',
    customer: 'Hyundai Motor India (Irungattukottai)',
    po: 'PO-HMIL-9114',
    part: 'Radiator Core Support Lower Tie-Bar',
    orderedQty: 160,
    shippedQty: 160,
    promisedDate: '2026-09-20',
    actualOut: '2026-09-20 12:15',
    vehicle: 'TN-21-AT-4419',
    delayReason: '',
  },
  {
    id: 'SRI-DISP-07',
    customer: 'Lear Corporation Seating (Sriperumbudur)',
    po: 'PO-LEAR-2204',
    part: 'Spot-Weld Projection Nut M8x1.25 Cage Sub-Assy',
    orderedQty: 300,
    shippedQty: 300,
    promisedDate: '2026-09-21',
    actualOut: '2026-09-21 11:45',
    vehicle: 'TN-21-AT-4423',
    delayReason: '',
  },
  {
    id: 'SRI-DISP-08',
    customer: 'Renault Nissan Automotive (Oragadam)',
    po: 'PO-RNAIPL-4418',
    part: 'Rear Wheel House Inner Stamping Panel',
    orderedQty: 140,
    shippedQty: 110, // Both Late & Short
    promisedDate: '2026-09-21',
    actualOut: '2026-09-22 16:30',
    vehicle: 'TN-21-AT-4429',
    delayReason: 'Labour short',
    notes: '800T tandem press pneumatic cushion seal replacement.',
  },
  {
    id: 'SRI-DISP-09',
    customer: 'Hyundai Motor India (Irungattukottai)',
    po: 'PO-HMIL-9128',
    part: 'Front Strut Tower Reinforcement Assembly',
    orderedQty: 220,
    shippedQty: 220,
    promisedDate: '2026-09-22',
    actualOut: '2026-09-22 10:30',
    vehicle: 'TN-21-AT-4432',
    delayReason: '',
  },
  {
    id: 'SRI-DISP-10',
    customer: 'Yamaha Motor India (Vallam Vadagal)',
    po: 'PO-YMI-6012',
    part: 'B-Pillar Upper Hinge Reinforcement Stamping',
    orderedQty: 200,
    shippedQty: 200,
    promisedDate: '2026-09-23',
    actualOut: '2026-09-23 13:05',
    vehicle: 'TN-21-AT-4436',
    delayReason: '',
  },
  {
    id: 'SRI-DISP-11',
    customer: 'Daimler India Commercial Vehicles (Oragadam)',
    po: 'PO-DICV-7745',
    part: 'Door Impact Beam Side-Intrusion Tube LH',
    orderedQty: 100,
    shippedQty: 100,
    promisedDate: '2026-09-24',
    actualOut: '2026-09-25 11:40', // Late only
    vehicle: 'TN-21-AT-4441',
    delayReason: 'No vehicle',
    notes: 'Dedicated milk-run container delayed at Oragadam toll plaza.',
  },
  {
    id: 'SRI-DISP-12',
    customer: 'Hyundai Mobis Module Plant',
    po: 'PO-MOBIS-3140',
    part: 'Radiator Core Support Lower Tie-Bar',
    orderedQty: 180,
    shippedQty: 180,
    promisedDate: '2026-09-25',
    actualOut: '2026-09-25 10:15',
    vehicle: 'TN-21-AT-4445',
    delayReason: '',
  },
  {
    id: 'SRI-DISP-13',
    customer: 'Royal Enfield (Oragadam Plant)',
    po: 'PO-RE-5601',
    part: 'Floor Tunnel Heat Shield Embossed Aluminum',
    orderedQty: 240,
    shippedQty: 240,
    promisedDate: '2026-09-26',
    actualOut: '2026-09-26 11:00',
    vehicle: 'TN-21-AT-4449',
    delayReason: '',
  },
  {
    id: 'SRI-DISP-14',
    customer: 'Renault Nissan Automotive (Oragadam)',
    po: 'PO-RNAIPL-4439',
    part: 'Front Strut Tower Reinforcement Assembly',
    orderedQty: 160,
    shippedQty: 160,
    promisedDate: '2026-09-27',
    actualOut: '2026-09-27 12:45',
    vehicle: 'TN-21-AT-4452',
    delayReason: '',
  },
  {
    id: 'SRI-DISP-15',
    customer: 'Lear Corporation Seating (Sriperumbudur)',
    po: 'PO-LEAR-2231',
    part: 'B-Pillar Upper Hinge Reinforcement Stamping',
    orderedQty: 150,
    shippedQty: 150,
    promisedDate: '2026-09-28',
    actualOut: '2026-09-28 10:20',
    vehicle: 'TN-21-AT-4456',
    delayReason: '',
  },
  {
    id: 'SRI-DISP-16',
    customer: 'Hyundai Motor India (Irungattukottai)',
    po: 'PO-HMIL-9150',
    part: 'Front Strut Tower Reinforcement Assembly',
    orderedQty: 200,
    shippedQty: 200,
    promisedDate: '2026-09-28',
    actualOut: '2026-09-28 13:30',
    vehicle: 'TN-21-AT-4460',
    delayReason: '',
  },
];

export const SRIPERUMBUDUR_P3_TRIPS: Trip[] = [
  {
    id: 'SRI-LR-01',
    date: '2026-09-03',
    lane: 'Sriperumbudur to Oragadam OEM Park',
    km: 24,
    transporter: 'KPN Logistics',
    weightKg: 4000,
    bill: 4800, // ₹1,200/t benchmark
    waitHours: 0.5,
    split: 'No',
    emptyReturn: 'No',
    notes: 'Clean milk-run benchmark on Oragadam corridor (₹1,200/tonne).',
    sourceDoc: 'SRI-INV-201',
  },
  {
    id: 'SRI-LR-02',
    date: '2026-09-05',
    lane: 'Sriperumbudur to Oragadam OEM Park',
    km: 24,
    transporter: 'Sri Lakshmi Carriers',
    weightKg: 4000,
    bill: 6600, // ₹1,650/t => ₹1,800 rate leak + 3.5h wait (₹700)
    waitHours: 3.5,
    split: 'No',
    emptyReturn: 'Yes',
    notes: 'Spot vehicle hired above ₹1,200/t lane rate card + 3.5h dock wait.',
    sourceDoc: 'SRI-INV-204',
  },
  {
    id: 'SRI-LR-03',
    date: '2026-09-08',
    lane: 'Sriperumbudur to Irungattukottai SIPCOT',
    km: 14,
    transporter: 'KPN Logistics',
    weightKg: 3500,
    bill: 3500, // ₹1,000/t benchmark
    waitHours: 0.5,
    split: 'No',
    emptyReturn: 'No',
    notes: 'Contracted ₹1,000/tonne shuttle benchmark.',
    sourceDoc: 'SRI-INV-209',
  },
  {
    id: 'SRI-LR-04',
    date: '2026-09-11',
    lane: 'Sriperumbudur to Irungattukottai SIPCOT',
    km: 14,
    transporter: 'VRL Fast Cargo',
    weightKg: 3500,
    bill: 5250, // ₹1,500/t => ₹1,750 rate leak + 4.0h wait (₹800)
    waitHours: 4.0,
    split: 'No',
    emptyReturn: 'Yes',
    notes: 'Unapproved night-shift surcharge + 4.0h gate detention.',
    sourceDoc: 'SRI-INV-215',
  },
  {
    id: 'SRI-LR-05',
    date: '2026-09-14',
    lane: 'Sriperumbudur to Maraimalai Nagar Ford Park',
    km: 38,
    transporter: 'KPN Logistics',
    weightKg: 5000,
    bill: 7000, // ₹1,400/t benchmark
    waitHours: 1.0,
    split: 'No',
    emptyReturn: 'No',
    notes: 'Clean 5-tonne flatbed run on Maraimalai Nagar lane.',
    sourceDoc: 'SRI-INV-220',
  },
  {
    id: 'SRI-LR-06',
    date: '2026-09-17',
    lane: 'Sriperumbudur to Maraimalai Nagar Ford Park',
    km: 38,
    transporter: 'Sri Lakshmi Carriers',
    weightKg: 5000,
    bill: 9400, // ₹1,880/t => ₹2,400 rate leak + 4.5h wait (₹900)
    waitHours: 4.5,
    split: 'No',
    emptyReturn: 'Yes',
    notes: 'Ad-hoc 19ft vehicle billed above rate card + 4.5h unloading wait.',
    sourceDoc: 'SRI-INV-226',
  },
  {
    id: 'SRI-LR-07',
    date: '2026-09-20',
    lane: 'Sriperumbudur to Oragadam OEM Park',
    km: 24,
    transporter: 'KPN Logistics',
    weightKg: 4200,
    bill: 5040, // ₹1,200/t clean
    waitHours: 0.5,
    split: 'No',
    emptyReturn: 'No',
    notes: 'Matched contracted rate card.',
    sourceDoc: 'SRI-INV-231',
  },
  {
    id: 'SRI-LR-08',
    date: '2026-09-23',
    lane: 'Sriperumbudur to Irungattukottai SIPCOT',
    km: 14,
    transporter: 'Sri Lakshmi Carriers',
    weightKg: 3000,
    bill: 4350, // ₹1,450/t => ₹1,350 rate leak + 3.0h wait (₹600)
    waitHours: 3.0,
    split: 'No',
    emptyReturn: 'Yes',
    notes: 'Billed fixed full-truck minimum on 3T load + 3h gate wait.',
    sourceDoc: 'SRI-INV-238',
  },
  {
    id: 'SRI-LR-09',
    date: '2026-09-26',
    lane: 'Sriperumbudur to Oragadam OEM Park',
    km: 24,
    transporter: 'VRL Fast Cargo',
    weightKg: 3800,
    bill: 5700, // ₹1,500/t => ₹1,140 rate leak + 2.5h wait (₹500)
    waitHours: 2.5,
    split: 'No',
    emptyReturn: 'No',
    notes: 'Weekend dispatch premium billed without purchase head sign-off.',
    sourceDoc: 'SRI-INV-244',
  },
  {
    id: 'SRI-LR-10',
    date: '2026-09-28',
    lane: 'Sriperumbudur to Maraimalai Nagar Ford Park',
    km: 38,
    transporter: 'KPN Logistics',
    weightKg: 4800,
    bill: 6720, // ₹1,400/t clean
    waitHours: 1.0,
    split: 'No',
    emptyReturn: 'No',
    notes: 'Clean contracted run.',
    sourceDoc: 'SRI-INV-249',
  },
];

export const SRIPERUMBUDUR_P4_BINS: AuditItem[] = [
  // 9 matched + 3 mismatched out of 12 bins => 75.0% bin accuracy
  {
    id: 'SRI-BIN-01',
    code: 'SRI-STAMP-107',
    part: 'Spot-Weld Projection Nut M8x1.25 Cage Sub-Assy',
    spot: 'Press Line Bay A1',
    systemQty: 150,
    physicalQty: 132, // -18 pcs => ₹16,560 ghost stock
    cost: 920,
    issuesPerMonth: 18,
    statusNote: '18 cages issued to night shift weld line without ERP material slip.',
  },
  {
    id: 'SRI-BIN-02',
    code: 'SRI-STAMP-102',
    part: 'High-Tensile Cross Member Bracket RH',
    spot: 'FG Dispatch Rack B4',
    systemQty: 80,
    physicalQty: 74, // -6 pcs => ₹17,700 ghost stock
    cost: 2950,
    issuesPerMonth: 14,
    statusNote: '6 brackets rejected at pre-dispatch CMM inspection not yet posted.',
  },
  {
    id: 'SRI-BIN-03',
    code: 'SRI-STAMP-113',
    part: 'Copper-Chromium Spot Welding Electrode Cap 16mm',
    spot: 'Tool Crib Drawer C2',
    systemQty: 240,
    physicalQty: 255, // +15 pcs => ₹5,700 unrecorded surplus
    cost: 380,
    issuesPerMonth: 26,
    statusNote: 'Supplier replacement box on shelf awaiting GRN voucher entry.',
  },
  {
    id: 'SRI-BIN-04',
    code: 'SRI-STAMP-110',
    part: 'CRCA EDD Grade Steel Coil 0.8mm x 1250mm',
    spot: 'Coil Yard Bay 01',
    systemQty: 95,
    physicalQty: 95,
    cost: 4800,
    issuesPerMonth: 22,
    statusNote: 'Verified coil tag count matches Tally stock summary.',
  },
  {
    id: 'SRI-BIN-05',
    code: 'SRI-STAMP-111',
    part: 'Front Strut Tower Reinforcement Assembly',
    spot: 'FG Dispatch Rack A2',
    systemQty: 110,
    physicalQty: 110,
    cost: 2400,
    issuesPerMonth: 25,
    statusNote: 'Verified bin trolley count matches system.',
  },
  {
    id: 'SRI-BIN-06',
    code: 'SRI-STAMP-112',
    part: 'B-Pillar Upper Hinge Reinforcement Stamping',
    spot: 'FG Dispatch Rack A3',
    systemQty: 130,
    physicalQty: 130,
    cost: 1650,
    issuesPerMonth: 20,
    statusNote: 'Verified pallet count matches ERP.',
  },
  {
    id: 'SRI-BIN-07',
    code: 'SRI-STAMP-101',
    part: 'BIW Dash Panel Stamping (Legacy Gen-2)',
    spot: 'Mezzanine Quarantine M1',
    systemQty: 45,
    physicalQty: 45,
    cost: 6400,
    issuesPerMonth: 0,
    statusNote: 'Dormant Gen-2 batch verified on mezzanine rack.',
  },
  {
    id: 'SRI-BIN-08',
    code: 'SRI-STAMP-104',
    part: 'Progressive Blank Die Insert Set #4 (800T Press)',
    spot: 'Tool Room Rack T4',
    systemQty: 12,
    physicalQty: 12,
    cost: 14500,
    issuesPerMonth: 1,
    statusNote: 'Verified tool crib count.',
  },
  {
    id: 'SRI-BIN-09',
    code: 'SRI-STAMP-105',
    part: 'Door Impact Beam Side-Intrusion Tube LH',
    spot: 'Rack B2',
    systemQty: 65,
    physicalQty: 65,
    cost: 2100,
    issuesPerMonth: 2,
    statusNote: 'Matched physical count.',
  },
  {
    id: 'SRI-BIN-10',
    code: 'SRI-STAMP-114',
    part: 'Radiator Core Support Lower Tie-Bar',
    spot: 'FG Rack C1',
    systemQty: 75,
    physicalQty: 75,
    cost: 1920,
    issuesPerMonth: 12,
    statusNote: 'Matched physical count.',
  },
  {
    id: 'SRI-BIN-11',
    code: 'SRI-STAMP-115',
    part: 'Floor Tunnel Heat Shield Embossed Aluminum',
    spot: 'FG Rack C3',
    systemQty: 90,
    physicalQty: 90,
    cost: 1150,
    issuesPerMonth: 15,
    statusNote: 'Matched physical count.',
  },
  {
    id: 'SRI-BIN-12',
    code: 'SRI-STAMP-116',
    part: 'Anti-Rust VCI Poly Bag Liner Roll 1200mm',
    spot: 'Packing Store P2',
    systemQty: 60,
    physicalQty: 60,
    cost: 850,
    issuesPerMonth: 19,
    statusNote: 'Matched physical count.',
  },
];

const SRIPERUMBUDUR_CAPA_ITEMS: PlantCapaItem[] = [
  {
    id: 'SRI-CAPA-01',
    title: 'Liquidate or OEM-claim 6 non-moving BIW stamping SKUs (>180d) locking ₹11,32,100',
    domain: 'inventory',
    domainLabel: 'Inventory (P1)',
    priority: 'Critical',
    evidenceRef: '6 stamping ledger rows (SRI-STAMP-101..106)',
    owner: 'Press Shop Materials Head (K. Sundaram)',
    dueDate: 'Within 5 days',
    status: 'In progress',
    notes: 'Submit obsolete Gen-2 BIW dash panel & 420mm slit coil claim to OEM commercial desk.',
    pillar: 'P1_INVENTORY',
    dispositionType: 'VENDOR_RETURN_CONTRA',
    linkedRecordId: 'SRI-STAMP-101',
    identifiedExposureInr: 1132100,
    targetRecoveryInr: 792470,
    realizedRecoveryInr: 310000,
    verificationStage: 'IN_EXECUTION',
  },
  {
    id: 'SRI-CAPA-02',
    title: 'Eliminate 800T tandem press pneumatic cushion downtime & M8 weld-nut short-shipments',
    domain: 'delivery',
    domainLabel: 'Delivery (P2)',
    priority: 'Requires attention',
    evidenceRef: '4 failed OEM dispatches (75.0% Gate OTIF)',
    owner: 'Dispatch & PPC Lead (V. Murugesan)',
    dueDate: 'Within 72 hrs',
    status: 'Awaiting verification',
    notes: 'Maintain 48-hour safety buffer on M8 projection nuts before DICV & RNAIPL schedules.',
    pillar: 'P2_OTIF',
    dispositionType: 'DISPATCH_SCHEDULING_FIX',
    linkedRecordId: 'SRI-DISP-02',
    identifiedExposureInr: 145000,
    targetRecoveryInr: 120000,
    realizedRecoveryInr: 45000,
    verificationStage: 'PENDING_FINANCE_SIGN_OFF',
  },
  {
    id: 'SRI-CAPA-03',
    title: 'Recover ₹11,940 carrier rate & detention leakage from Sri Lakshmi & VRL Fast Cargo',
    domain: 'profit_risk',
    domainLabel: 'Profit & Risk (P3)',
    priority: 'Requires attention',
    evidenceRef: '5 flagged LR bills (SRI-LR-02, 04, 06, 08, 09)',
    owner: 'Corridor Logistics Head (P. Rajesh)',
    dueDate: 'Within 5 days',
    status: 'Resolved',
    notes: 'Enforce KPN contracted milk-run rates (₹1,200/t Oragadam, ₹1,000/t Irungattukottai).',
    pillar: 'P3_FREIGHT',
    dispositionType: 'FREIGHT_DEBIT_NOTE',
    linkedRecordId: 'SRI-LR-02',
    identifiedExposureInr: 11940,
    targetRecoveryInr: 11940,
    realizedRecoveryInr: 11940,
    verificationStage: 'VERIFIED_REALIZED',
  },
  {
    id: 'SRI-CAPA-04',
    title: 'Reconcile ₹34,260 ghost stock on Press Line Bay A1 & FG Rack B4 before shift change',
    domain: 'warehouse',
    domainLabel: 'Warehouse (P4)',
    priority: 'Critical',
    evidenceRef: '3 mismatched bins (SRI-BIN-01, 02, 03)',
    owner: 'Stores In-Charge (T. Senthil)',
    dueDate: 'Within 48 hrs',
    status: 'Open',
    notes: 'Mandate barcode scan before night-shift weld nut cage withdrawals.',
    pillar: 'P4_WAREHOUSE',
    dispositionType: 'BIN_RECONCILIATION_RECOUNT',
    linkedRecordId: 'SRI-BIN-01',
    identifiedExposureInr: 34260,
    targetRecoveryInr: 34260,
    realizedRecoveryInr: 0,
    verificationStage: 'OPEN',
  },
];

// ============================================================================
// 3. HOSUR BASELINE (15 Drivetrain Forging SKUs, 14 P2, 10 P3, 12 P4, 4 CAPAs)
// ============================================================================
export const HOSUR_P1_SKUS: StockItem[] = [
  // Dead items (>180 days as of 2026-10-01 => lastMovement before 2026-04-04)
  {
    id: 'hos-sku-01',
    itemCode: 'HOS-FORG-201',
    itemName: 'Alloy Steel Crown Wheel Blank 20MnCr5 (Export Spec)',
    category: 'Finished Goods',
    qtyOnHand: 35,
    costRate: 7800,
    lastMovement: '2025-10-14', // 352 days idle => ₹2,73,000
    movementDates: ['2025-06-12', '2025-08-20', '2025-10-14'],
  },
  {
    id: 'hos-sku-02',
    itemCode: 'HOS-FORG-202',
    itemName: 'CNC Splined Pinion Shaft 18CrNiMo7-6',
    category: 'Finished Goods',
    qtyOnHand: 40,
    costRate: 5400,
    lastMovement: '2026-01-08', // 266 days idle => ₹2,16,000
    movementDates: ['2025-09-11', '2025-11-18', '2026-01-08'],
  },
  {
    id: 'hos-sku-03',
    itemCode: 'HOS-FORG-203',
    itemName: 'Broaching Tool Insert Set Module-4 (Helical Gear)',
    category: 'Spares',
    qtyOnHand: 10,
    costRate: 18500,
    lastMovement: '2025-12-03', // 302 days idle => ₹1,85,000
    movementDates: ['2025-07-19', '2025-12-03'],
  },
  {
    id: 'hos-sku-04',
    itemCode: 'HOS-FORG-204',
    itemName: 'Induction Hardened Axle Sleeve 42CrMo4',
    category: 'Finished Goods',
    qtyOnHand: 50,
    costRate: 3100,
    lastMovement: '2026-02-19', // 224 days idle => ₹1,55,000
    movementDates: ['2025-10-25', '2026-02-19'],
  },
  {
    id: 'hos-sku-05',
    itemCode: 'HOS-FORG-205',
    itemName: 'Forged Billet Round Bar EN353 Dia 90mm (Off-Spec Heat)',
    category: 'Raw Material',
    qtyOnHand: 60,
    costRate: 2200,
    lastMovement: '2026-03-14', // 201 days idle => ₹1,32,000
    movementDates: ['2025-11-30', '2026-03-14'],
  },
  // Slow-moving items (90 to 179 days as of 2026-10-01 => 2026-04-05 to 2026-07-03)
  {
    id: 'hos-sku-06',
    itemCode: 'HOS-FORG-206',
    itemName: 'Planetary Carrier Ductile Iron Casting SG500/7',
    category: 'Finished Goods',
    qtyOnHand: 32,
    costRate: 4900,
    lastMovement: '2026-05-12', // 142 days idle => ₹1,56,800
    movementDates: ['2026-02-14', '2026-05-12'],
  },
  {
    id: 'hos-sku-07',
    itemCode: 'HOS-FORG-207',
    itemName: 'Quenching Oil Polymer Additive Tank Batch 200L',
    category: 'Consumable',
    qtyOnHand: 14,
    costRate: 6800,
    lastMovement: '2026-06-08', // 115 days idle => ₹95,200
    movementDates: ['2026-03-20', '2026-06-08'],
  },
  {
    id: 'hos-sku-08',
    itemCode: 'HOS-FORG-208',
    itemName: 'Synchro Ring Forged Brass Blank CW617N',
    category: 'Raw Material',
    qtyOnHand: 85,
    costRate: 1120,
    lastMovement: '2026-06-28', // 95 days idle => ₹95,200
    movementDates: ['2026-04-15', '2026-06-28'],
  },
  // Active moving items (<90 days idle)
  {
    id: 'hos-sku-09',
    itemCode: 'HOS-FORG-209',
    itemName: '20MnCr5 Case-Hardening Steel Bar Dia 65mm',
    category: 'Raw Material',
    qtyOnHand: 140,
    costRate: 3400,
    lastMovement: '2026-09-27', // 4 days idle => ₹4,76,000
    movementDates: ['2026-09-04', '2026-09-16', '2026-09-27'],
  },
  {
    id: 'hos-sku-10',
    itemCode: 'HOS-FORG-210',
    itemName: 'CNC Hobbed Transmission Countershaft 6-Speed',
    category: 'Finished Goods',
    qtyOnHand: 65,
    costRate: 4600,
    lastMovement: '2026-09-28', // 3 days idle => ₹2,99,000
    movementDates: ['2026-09-08', '2026-09-19', '2026-09-28'],
  },
  {
    id: 'hos-sku-11',
    itemCode: 'HOS-FORG-211',
    itemName: 'Differential Spider Bevel Gear Kit',
    category: 'Finished Goods',
    qtyOnHand: 90,
    costRate: 2750,
    lastMovement: '2026-09-25', // 6 days idle => ₹2,47,500
    movementDates: ['2026-09-02', '2026-09-14', '2026-09-25'],
  },
  {
    id: 'hos-sku-12',
    itemCode: 'HOS-FORG-212',
    itemName: 'CBN Grinding Wheel Vitreous Bond 400mm',
    category: 'Spares',
    qtyOnHand: 8,
    costRate: 16200,
    lastMovement: '2026-08-22', // 40 days idle => ₹1,29,600
    movementDates: ['2026-07-15', '2026-08-22'],
  },
  {
    id: 'hos-sku-13',
    itemCode: 'HOS-FORG-213',
    itemName: 'Rear Axle Drive Flange Forged Hub',
    category: 'Finished Goods',
    qtyOnHand: 110,
    costRate: 1950,
    lastMovement: '2026-09-23', // 8 days idle => ₹2,14,500
    movementDates: ['2026-09-01', '2026-09-12', '2026-09-23'],
  },
  {
    id: 'hos-sku-14',
    itemCode: 'HOS-FORG-214',
    itemName: 'Carbide Turning Insert CNMG 120408 Box-10',
    category: 'Consumable',
    qtyOnHand: 45,
    costRate: 2400,
    lastMovement: '2026-09-26', // 5 days idle => ₹1,08,000
    movementDates: ['2026-09-06', '2026-09-18', '2026-09-26'],
  },
  {
    id: 'hos-sku-15',
    itemCode: 'HOS-FORG-215',
    itemName: 'Shot-Blasting Steel Grit S330 Bag 25kg',
    category: 'Consumable',
    qtyOnHand: 70,
    costRate: 1350,
    lastMovement: '2026-08-30', // 32 days idle => ₹94,500
    movementDates: ['2026-07-28', '2026-08-30'],
  },
];

export const HOSUR_P2_DISPATCHES: DispatchRow[] = [
  // 11 PASS dispatches + 3 FAIL dispatches = 14 total (78.6% OTIF)
  {
    id: 'HOS-DISP-01',
    customer: 'Ashok Leyland Unit-II (Hosur)',
    po: 'PO-ALH-8011',
    part: 'CNC Hobbed Transmission Countershaft 6-Speed',
    orderedQty: 80,
    shippedQty: 80,
    promisedDate: '2026-09-15',
    actualOut: '2026-09-15 11:20',
    vehicle: 'TN-24-BZ-1101',
    delayReason: '',
  },
  {
    id: 'HOS-DISP-02',
    customer: 'TVS Motor Company (Hosur Plant)',
    po: 'PO-TVSM-3304',
    part: 'Differential Spider Bevel Gear Kit',
    orderedQty: 120,
    shippedQty: 120,
    promisedDate: '2026-09-16',
    actualOut: '2026-09-16 12:10',
    vehicle: 'TN-24-BZ-1104',
    delayReason: '',
  },
  {
    id: 'HOS-DISP-03',
    customer: 'Caterpillar India Drivetrain (Thiruvallur)',
    po: 'PO-CAT-5102',
    part: 'Planetary Carrier Ductile Iron Casting SG500/7',
    orderedQty: 40,
    shippedQty: 40,
    promisedDate: '2026-09-17',
    actualOut: '2026-09-18 14:15', // Late only
    vehicle: 'TN-24-BZ-1108',
    delayReason: 'QC hold',
    notes: 'Ultrasonic flaw detection & case-depth lab certificate awaited.',
  },
  {
    id: 'HOS-DISP-04',
    customer: 'Ashok Leyland Unit-I (Hosur)',
    po: 'PO-ALH-8025',
    part: 'Rear Axle Drive Flange Forged Hub',
    orderedQty: 100,
    shippedQty: 100,
    promisedDate: '2026-09-18',
    actualOut: '2026-09-18 10:30',
    vehicle: 'TN-24-BZ-1112',
    delayReason: '',
  },
  {
    id: 'HOS-DISP-05',
    customer: 'Meritor HVS India (Mysuru)',
    po: 'PO-MER-1908',
    part: 'Alloy Steel Crown Wheel Blank 20MnCr5',
    orderedQty: 60,
    shippedQty: 45, // Short only
    promisedDate: '2026-09-19',
    actualOut: '2026-09-19 11:50',
    vehicle: 'TN-24-BZ-1116',
    delayReason: 'Material short',
    notes: '15 blanks quarantined due to heat-treatment distortion.',
  },
  {
    id: 'HOS-DISP-06',
    customer: 'TVS Motor Company (Hosur Plant)',
    po: 'PO-TVSM-3319',
    part: 'CNC Hobbed Transmission Countershaft 6-Speed',
    orderedQty: 90,
    shippedQty: 90,
    promisedDate: '2026-09-20',
    actualOut: '2026-09-20 10:05',
    vehicle: 'TN-24-BZ-1120',
    delayReason: '',
  },
  {
    id: 'HOS-DISP-07',
    customer: 'Toyota Kirloskar Auto Parts (Bidadi)',
    po: 'PO-TKAP-7201',
    part: 'Differential Spider Bevel Gear Kit',
    orderedQty: 110,
    shippedQty: 110,
    promisedDate: '2026-09-21',
    actualOut: '2026-09-21 12:30',
    vehicle: 'TN-24-BZ-1124',
    delayReason: '',
  },
  {
    id: 'HOS-DISP-08',
    customer: 'Volvo Trucks India (Hosakote)',
    po: 'PO-VTI-4110',
    part: 'CNC Splined Pinion Shaft 18CrNiMo7-6',
    orderedQty: 50,
    shippedQty: 38, // Both Late & Short
    promisedDate: '2026-09-22',
    actualOut: '2026-09-23 15:40',
    vehicle: 'TN-24-BZ-1129',
    delayReason: 'Labour short',
    notes: 'CNC spline grinder spindle encoder fault.',
  },
  {
    id: 'HOS-DISP-09',
    customer: 'Ashok Leyland Unit-II (Hosur)',
    po: 'PO-ALH-8042',
    part: 'Rear Axle Drive Flange Forged Hub',
    orderedQty: 120,
    shippedQty: 120,
    promisedDate: '2026-09-23',
    actualOut: '2026-09-23 11:00',
    vehicle: 'TN-24-BZ-1133',
    delayReason: '',
  },
  {
    id: 'HOS-DISP-10',
    customer: 'TVS Motor Company (Hosur Plant)',
    po: 'PO-TVSM-3340',
    part: 'Differential Spider Bevel Gear Kit',
    orderedQty: 100,
    shippedQty: 100,
    promisedDate: '2026-09-24',
    actualOut: '2026-09-24 10:20',
    vehicle: 'TN-24-BZ-1137',
    delayReason: '',
  },
  {
    id: 'HOS-DISP-11',
    customer: 'Toyota Kirloskar Auto Parts (Bidadi)',
    po: 'PO-TKAP-7219',
    part: 'CNC Hobbed Transmission Countershaft 6-Speed',
    orderedQty: 75,
    shippedQty: 75,
    promisedDate: '2026-09-25',
    actualOut: '2026-09-25 11:30',
    vehicle: 'TN-24-BZ-1141',
    delayReason: '',
  },
  {
    id: 'HOS-DISP-12',
    customer: 'Caterpillar India Drivetrain (Thiruvallur)',
    po: 'PO-CAT-5128',
    part: 'Induction Hardened Axle Sleeve 42CrMo4',
    orderedQty: 60,
    shippedQty: 60,
    promisedDate: '2026-09-26',
    actualOut: '2026-09-26 12:00',
    vehicle: 'TN-24-BZ-1145',
    delayReason: '',
  },
  {
    id: 'HOS-DISP-13',
    customer: 'Meritor HVS India (Mysuru)',
    po: 'PO-MER-1932',
    part: 'Rear Axle Drive Flange Forged Hub',
    orderedQty: 90,
    shippedQty: 90,
    promisedDate: '2026-09-27',
    actualOut: '2026-09-27 10:50',
    vehicle: 'TN-24-BZ-1149',
    delayReason: '',
  },
  {
    id: 'HOS-DISP-14',
    customer: 'Ashok Leyland Unit-I (Hosur)',
    po: 'PO-ALH-8060',
    part: 'CNC Hobbed Transmission Countershaft 6-Speed',
    orderedQty: 85,
    shippedQty: 85,
    promisedDate: '2026-09-28',
    actualOut: '2026-09-28 11:10',
    vehicle: 'TN-24-BZ-1153',
    delayReason: '',
  },
];

export const HOSUR_P3_TRIPS: Trip[] = [
  {
    id: 'HOS-LR-01',
    date: '2026-09-02',
    lane: 'Hosur SIPCOT to Bidadi Industrial Area',
    km: 68,
    transporter: 'Nandi Heavy Haulage',
    weightKg: 5000,
    bill: 6500, // ₹1,300/t benchmark
    waitHours: 0.5,
    split: 'No',
    emptyReturn: 'No',
    notes: 'Clean contracted benchmark on Hosur–Bidadi corridor (₹1,300/tonne).',
    sourceDoc: 'HOS-INV-301',
  },
  {
    id: 'HOS-LR-02',
    date: '2026-09-05',
    lane: 'Hosur SIPCOT to Bidadi Industrial Area',
    km: 68,
    transporter: 'Deccan Express Fleet',
    weightKg: 5000,
    bill: 8250, // ₹1,650/t => ₹1,750 rate leak + 3.0h wait (₹600)
    waitHours: 3.0,
    split: 'No',
    emptyReturn: 'Yes',
    notes: 'Ad-hoc market truck hired above rate card + 3h gate hold at Bidadi.',
    sourceDoc: 'HOS-INV-305',
  },
  {
    id: 'HOS-LR-03',
    date: '2026-09-08',
    lane: 'Hosur SIPCOT to Peenya Bengaluru',
    km: 56,
    transporter: 'Nandi Heavy Haulage',
    weightKg: 4000,
    bill: 4400, // ₹1,100/t benchmark
    waitHours: 0.5,
    split: 'No',
    emptyReturn: 'No',
    notes: 'Contracted ₹1,100/tonne Peenya shuttle benchmark.',
    sourceDoc: 'HOS-INV-310',
  },
  {
    id: 'HOS-LR-04',
    date: '2026-09-11',
    lane: 'Hosur SIPCOT to Peenya Bengaluru',
    km: 56,
    transporter: 'Cauvery Roadlines',
    weightKg: 4000,
    bill: 6000, // ₹1,500/t => ₹1,600 rate leak + 3.5h wait (₹700)
    waitHours: 3.5,
    split: 'No',
    emptyReturn: 'Yes',
    notes: 'Billed Silk Board congestion surcharge + 3.5h waiting.',
    sourceDoc: 'HOS-INV-314',
  },
  {
    id: 'HOS-LR-05',
    date: '2026-09-14',
    lane: 'Hosur SIPCOT to Mysuru Belagola',
    km: 185,
    transporter: 'Nandi Heavy Haulage',
    weightKg: 6000,
    bill: 13200, // ₹2,200/t benchmark
    waitHours: 1.0,
    split: 'No',
    emptyReturn: 'No',
    notes: 'Clean 6T inter-city run to Mysuru axle assembly plant.',
    sourceDoc: 'HOS-INV-319',
  },
  {
    id: 'HOS-LR-06',
    date: '2026-09-18',
    lane: 'Hosur SIPCOT to Mysuru Belagola',
    km: 185,
    transporter: 'Deccan Express Fleet',
    weightKg: 6000,
    bill: 15900, // ₹2,650/t => ₹2,700 rate leak + 4.0h wait (₹800)
    waitHours: 4.0,
    split: 'No',
    emptyReturn: 'Yes',
    notes: 'Unapproved return-empty claim on Mysuru lane + 4h dock wait.',
    sourceDoc: 'HOS-INV-324',
  },
  {
    id: 'HOS-LR-07',
    date: '2026-09-21',
    lane: 'Hosur SIPCOT to Bidadi Industrial Area',
    km: 68,
    transporter: 'Nandi Heavy Haulage',
    weightKg: 4500,
    bill: 5850, // ₹1,300/t clean
    waitHours: 0.5,
    split: 'No',
    emptyReturn: 'No',
    notes: 'Matched contracted rate card.',
    sourceDoc: 'HOS-INV-329',
  },
  {
    id: 'HOS-LR-08',
    date: '2026-09-24',
    lane: 'Hosur SIPCOT to Peenya Bengaluru',
    km: 56,
    transporter: 'Cauvery Roadlines',
    weightKg: 3500,
    bill: 5075, // ₹1,450/t => ₹1,225 rate leak + 2.5h wait (₹500)
    waitHours: 2.5,
    split: 'No',
    emptyReturn: 'Yes',
    notes: 'Spot dispatch for urgent heat-treat subcontracting.',
    sourceDoc: 'HOS-INV-334',
  },
  {
    id: 'HOS-LR-09',
    date: '2026-09-26',
    lane: 'Hosur SIPCOT to Bidadi Industrial Area',
    km: 68,
    transporter: 'Nandi Heavy Haulage',
    weightKg: 5200,
    bill: 6760, // ₹1,300/t clean
    waitHours: 0.5,
    split: 'No',
    emptyReturn: 'No',
    notes: 'Matched contracted rate card.',
    sourceDoc: 'HOS-INV-339',
  },
  {
    id: 'HOS-LR-10',
    date: '2026-09-28',
    lane: 'Hosur SIPCOT to Mysuru Belagola',
    km: 185,
    transporter: 'Nandi Heavy Haulage',
    weightKg: 5500,
    bill: 12100, // ₹2,200/t clean
    waitHours: 1.0,
    split: 'No',
    emptyReturn: 'No',
    notes: 'Matched contracted rate card.',
    sourceDoc: 'HOS-INV-344',
  },
];

export const HOSUR_P4_BINS: AuditItem[] = [
  // 10 matched + 2 mismatched out of 12 bins => 83.3% (83%) bin accuracy
  {
    id: 'HOS-BIN-01',
    code: 'HOS-FORG-201',
    part: 'Alloy Steel Crown Wheel Blank 20MnCr5 (Export Spec)',
    spot: 'Forge Yard Bay F2',
    systemQty: 35,
    physicalQty: 32, // -3 pcs => ₹23,400 ghost stock
    cost: 7800,
    issuesPerMonth: 2,
    statusNote: '3 crown wheel blanks sent to metallurgical lab destructive testing without ERP scrap note.',
  },
  {
    id: 'HOS-BIN-02',
    code: 'HOS-FORG-211',
    part: 'Differential Spider Bevel Gear Kit',
    spot: 'CNC Finishing Rack G4',
    systemQty: 90,
    physicalQty: 86, // -4 pcs => ₹11,000 ghost stock
    cost: 2750,
    issuesPerMonth: 21,
    statusNote: '4 kits packed in emergency spare box without dispatch advice entry.',
  },
  {
    id: 'HOS-BIN-03',
    code: 'HOS-FORG-209',
    part: '20MnCr5 Case-Hardening Steel Bar Dia 65mm',
    spot: 'Raw Bar Rack R1',
    systemQty: 140,
    physicalQty: 140,
    cost: 3400,
    issuesPerMonth: 24,
    statusNote: 'Verified bundle heat-number tags match ERP.',
  },
  {
    id: 'HOS-BIN-04',
    code: 'HOS-FORG-210',
    part: 'CNC Hobbed Transmission Countershaft 6-Speed',
    spot: 'FG Dispatch Cell D1',
    systemQty: 65,
    physicalQty: 65,
    cost: 4600,
    issuesPerMonth: 19,
    statusNote: 'Verified pallet count matches ERP.',
  },
  {
    id: 'HOS-BIN-05',
    code: 'HOS-FORG-202',
    part: 'CNC Splined Pinion Shaft 18CrNiMo7-6',
    spot: 'Gear Store Rack G2',
    systemQty: 40,
    physicalQty: 40,
    cost: 5400,
    issuesPerMonth: 1,
    statusNote: 'Verified physical count.',
  },
  {
    id: 'HOS-BIN-06',
    code: 'HOS-FORG-203',
    part: 'Broaching Tool Insert Set Module-4 (Helical Gear)',
    spot: 'Tool Room Vault V1',
    systemQty: 10,
    physicalQty: 10,
    cost: 18500,
    issuesPerMonth: 1,
    statusNote: 'Verified high-value broaching cutter inventory.',
  },
  {
    id: 'HOS-BIN-07',
    code: 'HOS-FORG-204',
    part: 'Induction Hardened Axle Sleeve 42CrMo4',
    spot: 'Heat-Treat Rack H3',
    systemQty: 50,
    physicalQty: 50,
    cost: 3100,
    issuesPerMonth: 2,
    statusNote: 'Verified physical count.',
  },
  {
    id: 'HOS-BIN-08',
    code: 'HOS-FORG-206',
    part: 'Planetary Carrier Ductile Iron Casting SG500/7',
    spot: 'Foundry Store C2',
    systemQty: 32,
    physicalQty: 32,
    cost: 4900,
    issuesPerMonth: 4,
    statusNote: 'Verified physical count.',
  },
  {
    id: 'HOS-BIN-09',
    code: 'HOS-FORG-212',
    part: 'CBN Grinding Wheel Vitreous Bond 400mm',
    spot: 'Tool Room Vault V3',
    systemQty: 8,
    physicalQty: 8,
    cost: 16200,
    issuesPerMonth: 6,
    statusNote: 'Verified physical count.',
  },
  {
    id: 'HOS-BIN-10',
    code: 'HOS-FORG-213',
    part: 'Rear Axle Drive Flange Forged Hub',
    spot: 'FG Dispatch Cell D3',
    systemQty: 110,
    physicalQty: 110,
    cost: 1950,
    issuesPerMonth: 22,
    statusNote: 'Verified physical count.',
  },
  {
    id: 'HOS-BIN-11',
    code: 'HOS-FORG-214',
    part: 'Carbide Turning Insert CNMG 120408 Box-10',
    spot: 'Tool Crib Cabinet C5',
    systemQty: 45,
    physicalQty: 45,
    cost: 2400,
    issuesPerMonth: 28,
    statusNote: 'Verified physical count.',
  },
  {
    id: 'HOS-BIN-12',
    code: 'HOS-FORG-215',
    part: 'Shot-Blasting Steel Grit S330 Bag 25kg',
    spot: 'Forge Shop Store S1',
    systemQty: 70,
    physicalQty: 70,
    cost: 1350,
    issuesPerMonth: 16,
    statusNote: 'Verified physical count.',
  },
];

const HOSUR_CAPA_ITEMS: PlantCapaItem[] = [
  {
    id: 'HOS-CAPA-01',
    title: 'Disposition 5 non-moving drivetrain forging SKUs (>180d) locking ₹9,61,000',
    domain: 'inventory',
    domainLabel: 'Inventory (P1)',
    priority: 'Critical',
    evidenceRef: '5 forging ledger rows (HOS-FORG-201..205)',
    owner: 'Metallurgy & Stores Head (R.Subramanian)',
    dueDate: 'Within 5 days',
    status: 'In progress',
    notes: 'Re-machining feasibility review on 20MnCr5 Crown Wheel blanks & EN353 off-spec bar.',
    pillar: 'P1_INVENTORY',
    dispositionType: 'ALTERNATE_BOM_CONSUMPTION',
    linkedRecordId: 'HOS-FORG-201',
    identifiedExposureInr: 961000,
    targetRecoveryInr: 672700,
    realizedRecoveryInr: 240000,
    verificationStage: 'IN_EXECUTION',
  },
  {
    id: 'HOS-CAPA-02',
    title: 'Clear ultrasonic lab bottleneck & CNC spline grinder downtime (78.6% Gate OTIF)',
    domain: 'delivery',
    domainLabel: 'Delivery (P2)',
    priority: 'Requires attention',
    evidenceRef: '3 failed dispatches (HOS-DISP-03, 05, 08)',
    owner: 'Gear Shop Dispatch Lead (N. Balaji)',
    dueDate: 'Within 72 hrs',
    status: 'Resolved',
    notes: 'Pre-certify heat-treat case depth 24h before Caterpillar & Volvo dispatch slots.',
    pillar: 'P2_OTIF',
    dispositionType: 'DISPATCH_SCHEDULING_FIX',
    linkedRecordId: 'HOS-DISP-03',
    identifiedExposureInr: 112000,
    targetRecoveryInr: 95000,
    realizedRecoveryInr: 95000,
    verificationStage: 'VERIFIED_REALIZED',
  },
  {
    id: 'HOS-CAPA-03',
    title: 'Audit ₹9,875 rate & detention variance on Deccan Express & Cauvery Roadlines',
    domain: 'profit_risk',
    domainLabel: 'Profit & Risk (P3)',
    priority: 'Monitoring',
    evidenceRef: '4 flagged LR bills (HOS-LR-02, 04, 06, 08)',
    owner: 'Hosur Logistics Officer (M. Naveen)',
    dueDate: 'Within 5 days',
    status: 'Awaiting verification',
    notes: 'Benchmark all Bidadi (₹1,300/t) and Mysuru (₹2,200/t) dispatches against Nandi Heavy Haulage.',
    pillar: 'P3_FREIGHT',
    dispositionType: 'FREIGHT_DEBIT_NOTE',
    linkedRecordId: 'HOS-LR-02',
    identifiedExposureInr: 9875,
    targetRecoveryInr: 9875,
    realizedRecoveryInr: 0,
    verificationStage: 'PENDING_FINANCE_SIGN_OFF',
  },
  {
    id: 'HOS-CAPA-04',
    title: 'Post mandatory destructive-test scrap vouchers for Forge Yard Bay F2 (₹34,400 gap)',
    domain: 'warehouse',
    domainLabel: 'Warehouse (P4)',
    priority: 'Requires attention',
    evidenceRef: '2 mismatched bins (HOS-BIN-01, HOS-BIN-02)',
    owner: 'Tool & Gear Stores Head (G. Prakash)',
    dueDate: 'Within 72 hrs',
    status: 'Open',
    notes: 'Require QA lab gate pass before removing crown wheel blanks from Forge Yard Bay F2.',
    pillar: 'P4_WAREHOUSE',
    dispositionType: 'BIN_RECONCILIATION_RECOUNT',
    linkedRecordId: 'HOS-BIN-01',
    identifiedExposureInr: 34400,
    targetRecoveryInr: 34400,
    realizedRecoveryInr: 0,
    verificationStage: 'OPEN',
  },
];

// ============================================================================
// BASELINE REGISTRY BY PLANT ID
// ============================================================================
export const MULTI_PLANT_BASELINES: Record<PlantId, PlantBaselineDataset> = {
  ambattur: {
    plantId: 'ambattur',
    plantName: 'Ambattur Baseline Unit',
    division: 'Unit 1 - Precision Machined Castings & Valves',
    clusterLocation: 'Ambattur Industrial Estate, Chennai (TN)',
    industry: 'Precision Machined Castings & Valves',
    p1Items: AMBATTUR_FABRICATION_SAMPLE,
    p1Rules: { ...P1_DEFAULT_RULES },
    p2Dispatches: AMBATTUR_P2_DISPATCHES,
    p2Rules: { ...P2_DEFAULT_RULES },
    p3Trips: AMBATTUR_P3_TRIPS,
    p3Rules: { ...P3_DEFAULT_RULES },
    p4Bins: AMBATTUR_P4_BINS,
    p4Rules: {
      ...P4_DEFAULT_RULES,
      storeName: 'Ambattur Fabrication & Valve Stores (Unit #1)',
    },
    capaItems: AMBATTUR_CAPA_ITEMS,
  },
  sriperumbudur: {
    plantId: 'sriperumbudur',
    plantName: 'Sriperumbudur Press & Machining',
    division: 'Unit 2 - Tier-1 Stamping & BIW Sub-Assemblies',
    clusterLocation: 'Sriperumbudur Auto Corridor, Chennai (TN)',
    industry: 'Tier-1 Automotive Stamping & BIW Sub-Assemblies',
    p1Items: SRIPERUMBUDUR_P1_SKUS,
    p1Rules: { ...P1_DEFAULT_RULES },
    p2Dispatches: SRIPERUMBUDUR_P2_DISPATCHES,
    p2Rules: {
      ...P2_DEFAULT_RULES,
      factoryProfile: {
        ...P2_DEFAULT_RULES.factoryProfile,
        id: 'fac-sriperumbudur',
        companyName: 'Operationalyst Tier-1 Stamping Division',
        plantName: 'Sriperumbudur Press & Machining',
        clusterLocation: 'Sriperumbudur Auto Corridor, Chennai (TN)',
      },
    },
    p3Trips: SRIPERUMBUDUR_P3_TRIPS,
    p3Rules: {
      ...P3_DEFAULT_RULES,
      unitLocation: 'Sriperumbudur Auto Corridor, Chennai',
    },
    p4Bins: SRIPERUMBUDUR_P4_BINS,
    p4Rules: {
      ...P4_DEFAULT_RULES,
      storeName: 'Sriperumbudur Press Shop & BIW Stores (Unit #2)',
    },
    capaItems: SRIPERUMBUDUR_CAPA_ITEMS,
  },
  hosur: {
    plantId: 'hosur',
    plantName: 'Hosur Auto Components Unit',
    division: 'Unit 3 - Heavy Drivetrain Forgings & CNC Gears',
    clusterLocation: 'Hosur SIPCOT Phase-II Industrial Complex (TN)',
    industry: 'Heavy Drivetrain Forgings & CNC Gears',
    p1Items: HOSUR_P1_SKUS,
    p1Rules: { ...P1_DEFAULT_RULES },
    p2Dispatches: HOSUR_P2_DISPATCHES,
    p2Rules: {
      ...P2_DEFAULT_RULES,
      factoryProfile: {
        ...P2_DEFAULT_RULES.factoryProfile,
        id: 'fac-hosur',
        companyName: 'Operationalyst Drivetrain Forging Division',
        plantName: 'Hosur Auto Components Unit',
        clusterLocation: 'Hosur SIPCOT Phase-II Industrial Complex (TN)',
      },
    },
    p3Trips: HOSUR_P3_TRIPS,
    p3Rules: {
      ...P3_DEFAULT_RULES,
      unitLocation: 'Hosur SIPCOT Phase-II, Tamil Nadu',
    },
    p4Bins: HOSUR_P4_BINS,
    p4Rules: {
      ...P4_DEFAULT_RULES,
      storeName: 'Hosur Metallurgy & CNC Gear Stores (Unit #3)',
    },
    capaItems: HOSUR_CAPA_ITEMS,
  },
};

export function isValidPlantId(val: unknown): val is PlantId {
  return typeof val === 'string' && ALLOWED_PLANT_IDS.includes(val as PlantId);
}

/**
 * Returns a deep clone of the canonical baseline dataset for the requested plantId.
 */
export function getPlantBaseline(plantId: PlantId): PlantBaselineDataset {
  const base = MULTI_PLANT_BASELINES[plantId] || MULTI_PLANT_BASELINES.ambattur;
  const cloned = JSON.parse(JSON.stringify(base)) as PlantBaselineDataset;
  cloned.capaItems = (cloned.capaItems || []).map((c) =>
    normalizeCapaItem(c as unknown as Record<string, unknown>)
  );
  return cloned;
}

/**
 * Deterministically computes P1–P4 headline KPIs for any PlantBaselineDataset
 * using the real P1–P4 calculation engines with zero synthetic multipliers.
 */
export function computePlantBaselineMetrics(
  dataset: PlantBaselineDataset
): PlantDeterministicSummary {
  // P1
  const p1Evaluated = evaluateStockEngine(dataset.p1Items, dataset.p1Rules);
  const p1Owner = generateOwnerReport(p1Evaluated, dataset.p1Rules);

  // P2
  const p2Metrics = calculateOTIFMetrics(dataset.p2Dispatches, dataset.p2Rules);

  // P3
  const p3Metrics = calculateAuditMetrics(dataset.p3Trips, dataset.p3Rules);
  const flaggedTrips = p3Metrics.calculatedTrips.filter((t) => (t.totalLeak || 0) > 0).length;

  // P4
  const p4Summary = computeSummary(dataset.p4Bins, dataset.p4Rules);
  const binAccuracyPercent =
    p4Summary.skusCounted > 0
      ? Math.round((p4Summary.linesMatched / p4Summary.skusCounted) * 1000) / 10
      : 100;

  return {
    plantId: dataset.plantId,
    plantName: dataset.plantName,
    clusterLocation: dataset.clusterLocation,
    p1: {
      totalSkus: p1Owner.totalItemCount,
      totalBookValue: Math.round(p1Owner.totalStockValue),
      deadStockValue: Math.round(p1Owner.deadCash),
      deadSkusCount: p1Owner.deadItemCount,
      slowMovingValue: Math.round(p1Owner.slowCash),
      slowSkusCount: p1Owner.slowItemCount,
      annualCarryingCostDrain: Math.round(p1Owner.annualHoldingBurn),
      targetCashRelease: Math.round(p1Owner.deadCash * 0.7 + p1Owner.slowCash * 0.3),
    },
    p2: {
      totalDispatches: p2Metrics.totalDispatches,
      passes: p2Metrics.passes,
      fails: p2Metrics.fails,
      failsLateOnly: p2Metrics.failsLateOnly,
      failsShortOnly: p2Metrics.failsShortOnly,
      failsLateAndShort: p2Metrics.failsLateAndShort,
      otifPercent: Math.round(p2Metrics.otifPercent * 10) / 10,
    },
    p3: {
      totalTrips: p3Metrics.totals.totalTrips,
      flaggedTrips,
      freightPaid: Math.round(p3Metrics.totals.freightPaid),
      rateLeak: Math.round(p3Metrics.totals.rateLeak),
      detention: Math.round(p3Metrics.totals.detention),
      totalLeak: Math.round(p3Metrics.totals.totalLeak),
    },
    p4: {
      totalBins: p4Summary.skusCounted,
      linesMatched: p4Summary.linesMatched,
      linesMismatch: p4Summary.linesMismatch,
      binAccuracyPercent,
      shelfShortRupees: Math.round(p4Summary.shelfShortRupees),
      foundStockRupees: Math.round(p4Summary.foundStockRupees),
      absVarianceRupees: Math.round(p4Summary.shelfShortRupees + p4Summary.foundStockRupees),
    },
    capaCount: dataset.capaItems.length,
  };
}

// ============================================================================
// PLANT-SCOPED LOCALSTORAGE HELPERS (100% Isolation in Browser)
// ============================================================================
export function getPlantStorageKey(domainKey: string, plantId: PlantId): string {
  return `op_plant_${plantId}_${domainKey}`;
}

export function getActivePlantIdFromStorage(): PlantId {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('suite_active_plant_id_v2');
      if (saved && isValidPlantId(saved)) return saved;
    }
  } catch {}
  return 'ambattur';
}

export function readPlantDatasetFromBrowser(plantId: PlantId): PlantBaselineDataset {
  const baseline = getPlantBaseline(plantId);
  if (typeof window === 'undefined') return baseline;

  try {
    const sP1 = localStorage.getItem(getPlantStorageKey('p1_items', plantId));
    const sP1Rules = localStorage.getItem(getPlantStorageKey('p1_rules', plantId));
    const sP2 = localStorage.getItem(getPlantStorageKey('p2_dispatches', plantId));
    const sP2Rules = localStorage.getItem(getPlantStorageKey('p2_rules', plantId));
    const sP3 = localStorage.getItem(getPlantStorageKey('p3_trips', plantId));
    const sP3Rules = localStorage.getItem(getPlantStorageKey('p3_rules', plantId));
    const sP4 = localStorage.getItem(getPlantStorageKey('p4_bins', plantId));
    const sP4Rules = localStorage.getItem(getPlantStorageKey('p4_rules', plantId));
    const sCapa = localStorage.getItem(getPlantStorageKey('capa_items', plantId));

    if (sP1) {
      const parsed = JSON.parse(sP1);
      if (Array.isArray(parsed) && parsed.length > 0) baseline.p1Items = parsed;
    } else if (plantId === 'ambattur') {
      const legacyP1 = localStorage.getItem('p1_stock_items');
      if (legacyP1) {
        const parsed = JSON.parse(legacyP1);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.itemCode && !String(parsed[0].itemCode).startsWith('SRI-') && !String(parsed[0].itemCode).startsWith('HOS-')) {
          baseline.p1Items = parsed;
        }
      }
    }

    if (sP1Rules) {
      const parsed = JSON.parse(sP1Rules);
      if (parsed && typeof parsed === 'object') baseline.p1Rules = parsed;
    }

    if (sP2) {
      const parsed = JSON.parse(sP2);
      if (Array.isArray(parsed) && parsed.length > 0) baseline.p2Dispatches = parsed;
    }

    if (sP2Rules) {
      const parsed = JSON.parse(sP2Rules);
      if (parsed && typeof parsed === 'object') baseline.p2Rules = parsed;
    }

    if (sP3) {
      const parsed = JSON.parse(sP3);
      if (Array.isArray(parsed) && parsed.length > 0) baseline.p3Trips = parsed;
    }

    if (sP3Rules) {
      const parsed = JSON.parse(sP3Rules);
      if (parsed && typeof parsed === 'object') baseline.p3Rules = parsed;
    }

    if (sP4) {
      const parsed = JSON.parse(sP4);
      if (Array.isArray(parsed) && parsed.length > 0) baseline.p4Bins = parsed;
    }

    if (sP4Rules) {
      const parsed = JSON.parse(sP4Rules);
      if (parsed && typeof parsed === 'object') baseline.p4Rules = parsed;
    }

    if (sCapa) {
      const parsed = JSON.parse(sCapa);
      if (Array.isArray(parsed) && parsed.length > 0) {
        baseline.capaItems = parsed.map((c) =>
          normalizeCapaItem(c as Record<string, unknown>)
        );
      }
    }
  } catch {}

  baseline.capaItems = (baseline.capaItems || []).map((c) =>
    normalizeCapaItem(c as unknown as Record<string, unknown>)
  );
  return baseline;
}

export function writePlantDatasetToBrowser(
  plantId: PlantId,
  patch: Partial<
    Pick<
      PlantBaselineDataset,
      | 'p1Items'
      | 'p1Rules'
      | 'p2Dispatches'
      | 'p2Rules'
      | 'p3Trips'
      | 'p3Rules'
      | 'p4Bins'
      | 'p4Rules'
      | 'capaItems'
    >
  >
): void {
  if (typeof window === 'undefined') return;
  try {
    if (patch.p1Items) {
      localStorage.setItem(getPlantStorageKey('p1_items', plantId), JSON.stringify(patch.p1Items));
    }
    if (patch.p1Rules) {
      localStorage.setItem(getPlantStorageKey('p1_rules', plantId), JSON.stringify(patch.p1Rules));
    }
    if (patch.p2Dispatches) {
      localStorage.setItem(
        getPlantStorageKey('p2_dispatches', plantId),
        JSON.stringify(patch.p2Dispatches)
      );
    }
    if (patch.p2Rules) {
      localStorage.setItem(getPlantStorageKey('p2_rules', plantId), JSON.stringify(patch.p2Rules));
    }
    if (patch.p3Trips) {
      localStorage.setItem(getPlantStorageKey('p3_trips', plantId), JSON.stringify(patch.p3Trips));
    }
    if (patch.p3Rules) {
      localStorage.setItem(getPlantStorageKey('p3_rules', plantId), JSON.stringify(patch.p3Rules));
    }
    if (patch.p4Bins) {
      localStorage.setItem(getPlantStorageKey('p4_bins', plantId), JSON.stringify(patch.p4Bins));
    }
    if (patch.p4Rules) {
      localStorage.setItem(getPlantStorageKey('p4_rules', plantId), JSON.stringify(patch.p4Rules));
    }
    if (patch.capaItems) {
      localStorage.setItem(
        getPlantStorageKey('capa_items', plantId),
        JSON.stringify(patch.capaItems)
      );
    }
  } catch {}
}

export function clearPlantDatasetInBrowser(plantId: PlantId): void {
  if (typeof window === 'undefined') return;
  try {
    const keys = [
      'p1_items',
      'p1_rules',
      'p2_dispatches',
      'p2_rules',
      'p3_trips',
      'p3_rules',
      'p4_bins',
      'p4_rules',
      'capa_items',
    ];
    for (const k of keys) {
      localStorage.removeItem(getPlantStorageKey(k, plantId));
    }
    if (plantId === 'ambattur') {
      localStorage.removeItem('p1_stock_items');
      localStorage.removeItem('p1_stock_rules');
      localStorage.removeItem('freight_audit_trips_v1');
      localStorage.removeItem('freight_audit_rules_v1');
      localStorage.removeItem('binaudit_skus_v1');
      localStorage.removeItem('binaudit_rules_v1');
    }
  } catch {}
}
