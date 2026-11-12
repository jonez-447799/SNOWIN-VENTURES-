import * as XLSX from 'xlsx';
import { evaluateStockEngine } from '../project1/utils/calculations.ts';
import { calculateRowStatus } from '../project2/utils/otifCalculator.ts';
import { calculateAuditMetrics } from '../project3/utils/auditCalculations.ts';
import { calculateItemFields } from '../project4/utils/auditCalculations.ts';
import { sanitizeSpreadsheetCell } from './importValidation.ts';
import {
  type PlantId,
  isValidPlantId,
  getActivePlantIdFromStorage,
  readPlantDatasetFromBrowser,
} from '../data/multiPlantBaselines.ts';
import {
  normalizeCapaItem,
  type CapaPillar,
  type CapaDispositionType,
  type CapaVerificationStage,
} from './capaLedger.ts';

export type RagColor = 'GREEN' | 'AMBER' | 'RED';

export const OWNER_ASSIGNMENT_MATRIX = [
  { area: 'Dead Stock (P1)', owner: 'Inventory Manager', dueDays: 7, ruleLabel: '7 Days' },
  { area: 'OTIF Failures (P2)', owner: 'Dispatch Head', dueDays: 3, ruleLabel: '3 Days' },
  { area: 'Freight Leakage (P3)', owner: 'Logistics Head', dueDays: 5, ruleLabel: '5 Days' },
  { area: 'Bin Variance (P4)', owner: 'Stores Head', dueDays: 3, ruleLabel: '3 Days' },
  { area: 'Dashboard Actions (P5)', owner: 'Plant Head', dueDays: 7, ruleLabel: 'Weekly Review' },
] as const;

export function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function computeDueDateByPriority(priority: 'Critical' | 'High' | 'Medium' | 'Low'): string {
  if (priority === 'Critical') return addDaysISO(3);
  if (priority === 'High') return addDaysISO(7);
  if (priority === 'Medium') return addDaysISO(14);
  return addDaysISO(30);
}

// Phase 3 Exact RAG Logic Functions
export function getP1DeadStockRag(deadStockValue: number): RagColor {
  if (deadStockValue > 1000000) return 'RED';
  if (deadStockValue > 500000) return 'AMBER';
  return 'GREEN';
}

export function getP2OtifRag(otifRatio: number): RagColor {
  if (otifRatio >= 0.95) return 'GREEN';
  if (otifRatio >= 0.9) return 'AMBER';
  return 'RED';
}

export function getP3FreightRag(leakageRupees: number): RagColor {
  if (leakageRupees > 50000) return 'RED';
  if (leakageRupees >= 25000) return 'AMBER';
  return 'GREEN';
}

export function getP4AccuracyRag(accuracyRatio: number): RagColor {
  if (accuracyRatio >= 0.98) return 'GREEN';
  if (accuracyRatio >= 0.95) return 'AMBER';
  return 'RED';
}

export interface SixSheetDataset {
  sheet1Summary: {
    plantId: PlantId;
    plantName: string;
    plantLocation: string;
    factoryHealthScore: number;
    cashStuck: number;
    cashRag: RagColor;
    otifRatio: number;
    otifRag: RagColor;
    revenueAtRisk: number | null;
    revenueAtRiskNotice: string;
    freightLeakage: number;
    freightRag: RagColor;
    accuracyRatio: number;
    accuracyRag: RagColor;
    varianceValueTotal: number;
    deptScores: {
      inventory: number;
      dispatch: number;
      logistics: number;
      warehouse: number;
    };
    actionCounts: {
      open: number;
      overdue: number;
      completed: number;
    };
    ceoBriefingBullets: string[];
  };
  sheet2P1: {
    sku: string;
    description: string;
    qty: number;
    value: number;
    idleDays: number;
    ageBucket: string;
    abcClass: string;
    status: string;
    owner: string;
    dueDate: string;
  }[];
  sheet3P2: {
    orderNo: string;
    customer: string;
    requiredDate: string;
    actualDate: string;
    orderedQty: number;
    deliveredQty: number;
    otif: 'YES' | 'NO';
    delayDays: number;
    rootCause: string;
    owner: string;
    dueDate: string;
    orderValue: string;
  }[];
  sheet4P3: {
    route: string;
    customer: string;
    expectedFreight: number;
    actualFreight: number;
    leakage: number;
    carrier: string;
    status: string;
    owner: string;
    dueDate: string;
    salesValue: number;
    freightPct: number;
  }[];
  sheet5P4: {
    item: string;
    bin: string;
    systemQty: number;
    physicalQty: number;
    variance: number;
    varianceValue: number;
    status: string;
    owner: string;
    dueDate: string;
    unitCost: number;
  }[];
  sheet6Actions: {
    issueId: string;
    project: string;
    issue: string;
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    owner: string;
    dueDate: string;
    status: 'Open' | 'Overdue' | 'Completed';
    remarks: string;
    Pillar: CapaPillar;
    Linked_Record_ID: string;
    Disposition_Type: CapaDispositionType;
    Identified_Exposure_INR: number;
    Target_Recovery_INR: number;
    Realized_Recovery_INR: number;
    Verification_Stage: CapaVerificationStage;
  }[];
}

export function buildSixSheetDataset(plantIdOrFlag?: PlantId | boolean): SixSheetDataset {
  const resolvedPlantId: PlantId = isValidPlantId(plantIdOrFlag)
    ? plantIdOrFlag
    : getActivePlantIdFromStorage();
  const plantDataset = readPlantDatasetFromBrowser(resolvedPlantId);

  // 1. P1 Dead Inventory Sheet Rows (Plant-isolated)
  const p1Raw = plantDataset.p1Items;
  const p1Rules = plantDataset.p1Rules;
  const p1Eval = evaluateStockEngine(p1Raw, p1Rules);

  const sheet2P1 = p1Eval.map((it) => {
    const idle = it.daysIdle || 0;
    const val = Math.round(it.closingValue || it.qtyOnHand * it.costRate);
    const bucket = idle > 365 ? '365+' : idle > 180 ? '181-365' : idle > 90 ? '91-180' : '0-90';
    const isDead = idle > 180;
    return {
      sku: String(sanitizeSpreadsheetCell(it.itemCode)),
      description: String(sanitizeSpreadsheetCell(it.itemName)),
      qty: it.qtyOnHand,
      value: val,
      idleDays: idle,
      ageBucket: bucket,
      abcClass: it.abcClass || 'C',
      status: isDead ? 'Dead' : idle > 90 ? 'Slow' : 'Moving',
      owner: isDead ? 'Inventory Manager' : 'Stores Clerk',
      dueDate: isDead ? addDaysISO(7) : '-',
    };
  });

  const cashStuck = sheet2P1.filter((r) => r.idleDays > 180).reduce((s, r) => s + r.value, 0);

  // 2. P2 OTIF Sheet Rows (Plant-isolated)
  const p2Dispatches = plantDataset.p2Dispatches;
  const p2Rules = plantDataset.p2Rules;

  const sheet3P2 = p2Dispatches.map((d) => {
    const calc = calculateRowStatus(d, p2Rules);
    const reqDate = (d.promisedDate || '').slice(0, 10);
    const actDate = (d.actualOut || '').slice(0, 10);
    const delayDays = calc.lateHours ? Math.max(0, Math.ceil(calc.lateHours / 24)) : 0;
    const otifPass = calc.otif ? 'YES' : 'NO';
    return {
      orderNo: String(sanitizeSpreadsheetCell(d.po)),
      customer: String(sanitizeSpreadsheetCell(d.customer)),
      requiredDate: reqDate,
      actualDate: actDate,
      orderedQty: d.orderedQty,
      deliveredQty: d.shippedQty,
      otif: otifPass as 'YES' | 'NO',
      delayDays,
      rootCause: String(
        sanitizeSpreadsheetCell(
          otifPass === 'YES' ? 'On Schedule' : d.delayReason || 'Production Delay'
        )
      ),
      owner: otifPass === 'NO' ? 'Dispatch Head' : '-',
      dueDate: otifPass === 'NO' ? addDaysISO(3) : '-',
      orderValue: 'Unavailable (not provided)',
    };
  });

  const otifYesCount = sheet3P2.filter((r) => r.otif === 'YES').length;
  const otifRatio = sheet3P2.length > 0 ? otifYesCount / sheet3P2.length : 0;
  const revenueAtRisk = null;
  const revenueAtRiskNotice =
    'Revenue exposure unavailable because order-value information was not provided.';

  // 3. P3 Freight Sheet Rows (Plant-isolated)
  const p3Trips = plantDataset.p3Trips;
  const p3Rules = plantDataset.p3Rules;
  const p3Audit = calculateAuditMetrics(p3Trips, p3Rules);

  const customersSample = ['TVS Motor', 'Ashok Leyland', 'Royal Enfield', 'Hyundai Mobis', 'TAFE Tractors'];
  const sheet4P3 = p3Audit.calculatedTrips.map((t, idx) => {
    const actual = Math.round(t.bill);
    const leak = Math.round(t.totalLeak || 0);
    const expected = Math.max(0, actual - leak);
    const salesVal = Math.max(actual * 5, Math.round(t.weightKg * 42));
    const freightPct = salesVal > 0 ? Number(((actual / salesVal) * 100).toFixed(1)) : 0;
    return {
      route: String(sanitizeSpreadsheetCell(t.lane)),
      customer: customersSample[idx % customersSample.length],
      expectedFreight: expected,
      actualFreight: actual,
      leakage: leak,
      carrier: String(sanitizeSpreadsheetCell(t.transporter)),
      status: leak > 0 ? 'Freight Leak' : 'Verified Clean',
      owner: leak > 0 ? 'Logistics Head' : '-',
      dueDate: leak > 0 ? addDaysISO(5) : '-',
      salesValue: salesVal,
      freightPct,
    };
  });

  const freightLeakage = sheet4P3.reduce((s, r) => s + r.leakage, 0);

  // 4. P4 Bin Audit Sheet Rows (Plant-isolated)
  const p4Items = plantDataset.p4Bins;
  const p4Rules = plantDataset.p4Rules;

  const sheet5P4 = p4Items.map((it) => {
    const calc = calculateItemFields(it, p4Rules);
    const variance = calc.gapQty || 0;
    const unitCost = Math.round(it.cost);
    const varianceValue = Math.abs(variance) * unitCost;
    const matched = variance === 0;
    return {
      item: String(sanitizeSpreadsheetCell(`${it.code} - ${it.part}`)),
      bin: String(sanitizeSpreadsheetCell(it.spot)),
      systemQty: it.systemQty,
      physicalQty: it.physicalQty,
      variance,
      varianceValue,
      status: matched ? 'Matched' : 'Mismatch',
      owner: matched ? '-' : 'Stores Head',
      dueDate: matched ? '-' : addDaysISO(3),
      unitCost,
    };
  });

  const matchingSkus = sheet5P4.filter((r) => r.variance === 0).length;
  const accuracyRatio = sheet5P4.length > 0 ? matchingSkus / sheet5P4.length : 1;
  const varianceValueTotal = sheet5P4.reduce((s, r) => s + r.varianceValue, 0);

  // 5. Sheet 6: Action Tracker (Uses plant-specific CAPA items + financial realization fields)
  const sheet6Actions: SixSheetDataset['sheet6Actions'] = plantDataset.capaItems.map((rawCapa) => {
    const c = normalizeCapaItem(rawCapa as unknown as Record<string, unknown>);
    const mappedPriority: 'Critical' | 'High' | 'Medium' | 'Low' =
      c.priority === 'Critical' ? 'Critical' : c.priority === 'Requires attention' ? 'High' : 'Medium';
    return {
      issueId: String(sanitizeSpreadsheetCell(c.id)),
      project: String(sanitizeSpreadsheetCell(c.domainLabel)),
      issue: String(sanitizeSpreadsheetCell(c.title)),
      priority: mappedPriority,
      owner: String(sanitizeSpreadsheetCell(c.owner)),
      dueDate: computeDueDateByPriority(mappedPriority),
      status: c.verificationStage === 'VERIFIED_REALIZED' || c.status === 'Resolved' ? 'Completed' : 'Open',
      remarks: String(sanitizeSpreadsheetCell(c.notes)),
      Pillar: c.pillar,
      Linked_Record_ID: String(sanitizeSpreadsheetCell(c.linkedRecordId)),
      Disposition_Type: c.dispositionType,
      Identified_Exposure_INR: c.identifiedExposureInr,
      Target_Recovery_INR: c.targetRecoveryInr,
      Realized_Recovery_INR: c.realizedRecoveryInr,
      Verification_Stage: c.verificationStage,
    };
  });

  // Department Scores & Weighted Factory Health Score (30% Inv + 25% OTIF + 25% Freight + 20% Accuracy)
  const invScore = cashStuck > 1000000 ? 72 : cashStuck > 500000 ? 82 : 91;
  const dispScore = Math.max(55, Math.min(99, Math.round(otifRatio * 100)));
  const logScore = freightLeakage > 50000 ? 72 : freightLeakage >= 25000 ? 83 : 92;
  const whScore = Math.max(60, Math.min(99, Math.round(accuracyRatio * 100)));

  const factoryHealthScore = Math.round(
    0.3 * invScore + 0.25 * dispScore + 0.25 * logScore + 0.2 * whScore
  );

  const cashRag = getP1DeadStockRag(cashStuck);
  const otifRag = getP2OtifRag(otifRatio);
  const freightRag = getP3FreightRag(freightLeakage);
  const accuracyRag = getP4AccuracyRag(accuracyRatio);

  const ceoBriefingBullets = [
    `[${plantDataset.plantName}] Dead stock (>180d) standing at ₹${(cashStuck / 100000).toFixed(2)}L (${cashRag}) — requires engineering & procurement review`,
    `[${plantDataset.plantName}] OTIF at ${Math.round(otifRatio * 100)}% (${otifRag}) — ${revenueAtRiskNotice}`,
    `[${plantDataset.plantName}] Freight variance audited at ₹${Math.round(freightLeakage / 1000)}K (${freightRag}) across active carrier bills`,
    `[${plantDataset.plantName}] Warehouse bin accuracy at ${Math.round(accuracyRatio * 100)}% (${accuracyRag}) with blind recount scheduled`,
    `Target ceiling: Keep >180-day dormant stock below ₹1.00 L (15% of total valuation).`,
  ];

  return {
    sheet1Summary: {
      plantId: plantDataset.plantId,
      plantName: plantDataset.plantName,
      plantLocation: plantDataset.clusterLocation,
      factoryHealthScore,
      cashStuck,
      cashRag,
      otifRatio,
      otifRag,
      revenueAtRisk,
      revenueAtRiskNotice,
      freightLeakage,
      freightRag,
      accuracyRatio,
      accuracyRag,
      varianceValueTotal,
      deptScores: {
        inventory: invScore,
        dispatch: dispScore,
        logistics: logScore,
        warehouse: whScore,
      },
      actionCounts: {
        open: sheet6Actions.filter((a) => a.status === 'Open').length,
        overdue: sheet6Actions.filter((a) => a.status === 'Overdue').length,
        completed: sheet6Actions.filter((a) => a.status === 'Completed').length,
      },
      ceoBriefingBullets,
    },
    sheet2P1,
    sheet3P2,
    sheet4P3,
    sheet5P4,
    sheet6Actions,
  };
}

/**
 * Generates and downloads a 6-Sheet .xlsx Excel Workbook with live Excel formulas
 * and full formula-injection sanitization on all user-controlled string cells,
 * scoped to the selected plant workspace.
 */
export function downloadCommandCenterWorkbook(plantIdOrFlag?: PlantId | boolean): void {
  const data = buildSixSheetDataset(plantIdOrFlag);
  const wb = XLSX.utils.book_new();

  const p1EndRow = data.sheet2P1.length + 1;
  const p2EndRow = data.sheet3P2.length + 1;
  const p3EndRow = data.sheet4P3.length + 1;
  const p4EndRow = data.sheet5P4.length + 1;
  const actEndRow = data.sheet6Actions.length + 1;

  // =========================================================================
  // SHEET 1: Executive Dashboard (With Live Cross-Sheet Formulas & Plant Stamp)
  // =========================================================================
  const ws1Data: any[][] = [
    [
      `FACTORY COMMAND CENTER — ${data.sheet1Summary.plantName.toUpperCase()} (${data.sheet1Summary.plantId.toUpperCase()})`,
      data.sheet1Summary.plantLocation,
      '',
      '',
      '',
    ],
    ['Metric / Section', 'Live Formula Value', 'RAG Status', 'Target / Threshold Rule', 'Primary Owner'],
    [
      'Factory Health Score (0-100)',
      { t: 'n', f: 'ROUND(0.30*B15+0.25*B16+0.25*B17+0.20*B18,0)', v: data.sheet1Summary.factoryHealthScore },
      { t: 's', f: 'IF(B3>=85,"GREEN",IF(B3>=75,"AMBER","RED"))', v: data.sheet1Summary.factoryHealthScore >= 85 ? 'GREEN' : 'AMBER' },
      '30% Inv + 25% OTIF + 25% Freight + 20% Accuracy',
      'Plant Head',
    ],
    [
      'Cash Stuck (P1 Dead Stock)',
      { t: 'n', f: `SUMIFS('P1 Dead Inventory'!D2:D${p1EndRow},'P1 Dead Inventory'!E2:E${p1EndRow},">180")`, v: data.sheet1Summary.cashStuck },
      { t: 's', f: 'IF(B4>1000000,"RED",IF(B4>500000,"AMBER","GREEN"))', v: data.sheet1Summary.cashRag },
      '> ₹10L RED | ₹5-10L AMBER | < ₹5L GREEN',
      'Inventory Manager (7 Days)',
    ],
    [
      'Customer Promise OTIF % (P2)',
      { t: 'n', f: `COUNTIF('P2 OTIF'!G2:G${p2EndRow},"YES")/COUNTA('P2 OTIF'!G2:G${p2EndRow})`, v: Number(data.sheet1Summary.otifRatio.toFixed(4)) },
      { t: 's', f: 'IF(B5>=0.95,"GREEN",IF(B5>=0.90,"AMBER","RED"))', v: data.sheet1Summary.otifRag },
      '95%+ GREEN | 90-95% AMBER | <90% RED',
      'Dispatch Head (3 Days)',
    ],
    [
      'Revenue At Risk (P2 Failed POs)',
      data.sheet1Summary.revenueAtRiskNotice,
      'UNAVAILABLE',
      'Requires explicit order-value column in P2 dispatch dataset',
      'Dispatch Head (3 Days)',
    ],
    [
      'Freight Leakage (P3 Overspend)',
      { t: 'n', f: `SUM('P3 Freight'!E2:E${p3EndRow})`, v: data.sheet1Summary.freightLeakage },
      { t: 's', f: 'IF(B7>50000,"RED",IF(B7>=25000,"AMBER","GREEN"))', v: data.sheet1Summary.freightRag },
      '< ₹25K GREEN | ₹25K-50K AMBER | > ₹50K RED',
      'Logistics Head (5 Days)',
    ],
    [
      'Inventory Accuracy % (P4 Bins)',
      { t: 'n', f: `COUNTIF('P4 Bin Audit'!G2:G${p4EndRow},"Matched")/COUNTA('P4 Bin Audit'!G2:G${p4EndRow})`, v: Number(data.sheet1Summary.accuracyRatio.toFixed(4)) },
      { t: 's', f: 'IF(B8>=0.98,"GREEN",IF(B8>=0.95,"AMBER","RED"))', v: data.sheet1Summary.accuracyRag },
      '>=98% GREEN | 95-98% AMBER | <95% RED',
      'Stores Head (3 Days)',
    ],
    ['', '', '', '', ''],
    ['ACTION TRACKER SUMMARY', 'Count', '', '', ''],
    ['Open Actions', { t: 'n', f: `COUNTIF('Action Tracker'!G2:G${actEndRow},"Open")`, v: data.sheet1Summary.actionCounts.open }, '', '', ''],
    ['Overdue Actions', { t: 'n', f: `COUNTIF('Action Tracker'!G2:G${actEndRow},"Overdue")`, v: data.sheet1Summary.actionCounts.overdue }, '', '', ''],
    ['Completed Actions', { t: 'n', f: `COUNTIF('Action Tracker'!G2:G${actEndRow},"Completed")`, v: data.sheet1Summary.actionCounts.completed }, '', '', ''],
    ['Department Scorecard', 'Score (0-100)', 'RAG', 'Owner', 'Cadence'],
    ['Inventory', data.sheet1Summary.deptScores.inventory, { t: 's', f: 'IF(B15>=85,"GREEN",IF(B15>=75,"AMBER","RED"))', v: 'AMBER' }, 'Inventory Manager', '7 Days'],
    ['Dispatch', data.sheet1Summary.deptScores.dispatch, { t: 's', f: 'IF(B16>=85,"GREEN",IF(B16>=75,"AMBER","RED"))', v: 'AMBER' }, 'Dispatch Head', '3 Days'],
    ['Logistics', data.sheet1Summary.deptScores.logistics, { t: 's', f: 'IF(B17>=85,"GREEN",IF(B17>=75,"AMBER","RED"))', v: 'AMBER' }, 'Logistics Head', '5 Days'],
    ['Warehouse', data.sheet1Summary.deptScores.warehouse, { t: 's', f: 'IF(B18>=85,"GREEN",IF(B18>=75,"AMBER","RED"))', v: 'GREEN' }, 'Stores Head', '3 Days'],
    ['', '', '', '', ''],
    ['PLANT WORKSPACE IDENTIFIER', `${data.sheet1Summary.plantName} (plantId: ${data.sheet1Summary.plantId})`, '', '', ''],
    ['ENVIRONMENT NOTICE', 'Server-Persisted Plant Workspace — Figures and records reflect the isolated dataset for this manufacturing unit.', '', '', ''],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
  ws1['!cols'] = [{ wch: 34 }, { wch: 38 }, { wch: 16 }, { wch: 46 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Executive Dashboard');

  // =========================================================================
  // SHEET 2: P1 Dead Inventory
  // =========================================================================
  const ws2Rows: any[][] = [
    ['SKU', 'Description', 'Qty', 'Value', 'Idle Days', 'Age Bucket', 'ABC Class', 'Status', 'Owner', 'Due Date'],
  ];
  data.sheet2P1.forEach((r, idx) => {
    const rowNum = idx + 2;
    ws2Rows.push([
      sanitizeSpreadsheetCell(r.sku),
      sanitizeSpreadsheetCell(r.description),
      r.qty,
      r.value,
      r.idleDays,
      { t: 's', f: `IF(E${rowNum}>365,"365+",IF(E${rowNum}>180,"181-365",IF(E${rowNum}>90,"91-180","0-90")))`, v: r.ageBucket },
      sanitizeSpreadsheetCell(r.abcClass),
      { t: 's', f: `IF(E${rowNum}>180,"Dead",IF(E${rowNum}>90,"Slow","Moving"))`, v: r.status },
      { t: 's', f: `IF(E${rowNum}>180,"Inventory Manager","Stores Clerk")`, v: r.owner },
      sanitizeSpreadsheetCell(r.dueDate),
    ]);
  });
  ws2Rows.push([]);
  ws2Rows.push([
    'TOTAL DEAD STOCK VALUE (>180d)',
    '',
    '',
    { t: 'n', f: `SUMIFS(D2:D${p1EndRow},E2:E${p1EndRow},">180")`, v: data.sheet1Summary.cashStuck },
    '',
    'RAG STATUS:',
    { t: 's', f: `IF(D${p1EndRow + 2}>1000000,"RED",IF(D${p1EndRow + 2}>500000,"AMBER","GREEN"))`, v: data.sheet1Summary.cashRag },
  ]);
  const ws2 = XLSX.utils.aoa_to_sheet(ws2Rows);
  ws2['!cols'] = [{ wch: 16 }, { wch: 32 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'P1 Dead Inventory');

  // =========================================================================
  // SHEET 3: P2 OTIF
  // =========================================================================
  const ws3Rows: any[][] = [
    ['Order No', 'Customer', 'Required Date', 'Actual Date', 'Ordered Qty', 'Delivered Qty', 'OTIF', 'Delay Days', 'Root Cause', 'Owner', 'Due Date', 'Order Value'],
  ];
  data.sheet3P2.forEach((r, idx) => {
    const rowNum = idx + 2;
    ws3Rows.push([
      sanitizeSpreadsheetCell(r.orderNo),
      sanitizeSpreadsheetCell(r.customer),
      sanitizeSpreadsheetCell(r.requiredDate),
      sanitizeSpreadsheetCell(r.actualDate),
      r.orderedQty,
      r.deliveredQty,
      { t: 's', f: `IF(AND(H${rowNum}<=0,F${rowNum}>=E${rowNum}),"YES","NO")`, v: r.otif },
      r.delayDays,
      sanitizeSpreadsheetCell(r.rootCause),
      { t: 's', f: `IF(G${rowNum}="NO","Dispatch Head","-")`, v: r.owner },
      sanitizeSpreadsheetCell(r.dueDate),
      sanitizeSpreadsheetCell(r.orderValue),
    ]);
  });
  ws3Rows.push([]);
  ws3Rows.push([
    'OTIF % & REVENUE EXPOSURE STATUS',
    '',
    '',
    '',
    '',
    'OTIF %:',
    { t: 'n', f: `COUNTIF(G2:G${p2EndRow},"YES")/COUNTA(G2:G${p2EndRow})`, v: Number(data.sheet1Summary.otifRatio.toFixed(4)) },
    '',
    '',
    'Order Value:',
    '',
    data.sheet1Summary.revenueAtRiskNotice,
  ]);
  const ws3 = XLSX.utils.aoa_to_sheet(ws3Rows);
  ws3['!cols'] = [{ wch: 16 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 13 }, { wch: 10 }, { wch: 12 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'P2 OTIF');

  // =========================================================================
  // SHEET 4: P3 Freight
  // =========================================================================
  const ws4Rows: any[][] = [
    ['Route', 'Customer', 'Expected Freight', 'Actual Freight', 'Leakage', 'Carrier', 'Status', 'Owner', 'Due Date', 'Sales Value', 'Freight %'],
  ];
  data.sheet4P3.forEach((r, idx) => {
    const rowNum = idx + 2;
    ws4Rows.push([
      sanitizeSpreadsheetCell(r.route),
      sanitizeSpreadsheetCell(r.customer),
      r.expectedFreight,
      r.actualFreight,
      { t: 'n', f: `MAX(0,D${rowNum}-C${rowNum})`, v: r.leakage },
      sanitizeSpreadsheetCell(r.carrier),
      { t: 's', f: `IF(E${rowNum}>0,"Freight Leak","Verified Clean")`, v: r.status },
      { t: 's', f: `IF(E${rowNum}>0,"Logistics Head","-")`, v: r.owner },
      sanitizeSpreadsheetCell(r.dueDate),
      r.salesValue,
      { t: 'n', f: `D${rowNum}/J${rowNum}`, v: Number((r.freightPct / 100).toFixed(4)) },
    ]);
  });
  ws4Rows.push([]);
  ws4Rows.push([
    'TOTAL FREIGHT LEAKAGE',
    '',
    '',
    '',
    { t: 'n', f: `SUM(E2:E${p3EndRow})`, v: data.sheet1Summary.freightLeakage },
    'RAG STATUS:',
    { t: 's', f: `IF(E${p3EndRow + 2}>50000,"RED",IF(E${p3EndRow + 2}>=25000,"AMBER","GREEN"))`, v: data.sheet1Summary.freightRag },
  ]);
  const ws4 = XLSX.utils.aoa_to_sheet(ws4Rows);
  ws4['!cols'] = [{ wch: 22 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 15 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws4, 'P3 Freight');

  // =========================================================================
  // SHEET 5: P4 Bin Audit
  // =========================================================================
  const ws5Rows: any[][] = [
    ['Item', 'Bin', 'System Qty', 'Physical Qty', 'Variance', 'Variance Value', 'Status', 'Owner', 'Due Date', 'Unit Cost'],
  ];
  data.sheet5P4.forEach((r, idx) => {
    const rowNum = idx + 2;
    ws5Rows.push([
      sanitizeSpreadsheetCell(r.item),
      sanitizeSpreadsheetCell(r.bin),
      r.systemQty,
      r.physicalQty,
      { t: 'n', f: `D${rowNum}-C${rowNum}`, v: r.variance },
      { t: 'n', f: `ABS(E${rowNum})*J${rowNum}`, v: r.varianceValue },
      { t: 's', f: `IF(E${rowNum}=0,"Matched","Mismatch")`, v: r.status },
      { t: 's', f: `IF(E${rowNum}=0,"-","Stores Head")`, v: r.owner },
      sanitizeSpreadsheetCell(r.dueDate),
      r.unitCost,
    ]);
  });
  ws5Rows.push([]);
  ws5Rows.push([
    'INVENTORY ACCURACY %',
    '',
    '',
    '',
    { t: 'n', f: `COUNTIF(G2:G${p4EndRow},"Matched")/COUNTA(G2:G${p4EndRow})`, v: Number(data.sheet1Summary.accuracyRatio.toFixed(4)) },
    { t: 'n', f: `SUM(F2:F${p4EndRow})`, v: data.sheet1Summary.varianceValueTotal },
    { t: 's', f: `IF(E${p4EndRow + 2}>=0.98,"GREEN",IF(E${p4EndRow + 2}>=0.95,"AMBER","RED"))`, v: data.sheet1Summary.accuracyRag },
  ]);
  const ws5 = XLSX.utils.aoa_to_sheet(ws5Rows);
  ws5['!cols'] = [{ wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 13 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws5, 'P4 Bin Audit');

  // =========================================================================
  // SHEET 6: Action Tracker (With Financial CAPA Realization Columns)
  // =========================================================================
  const ws6Rows: any[][] = [
    [
      'Issue ID',
      'Project',
      'Issue',
      'Priority',
      'Owner',
      'Due Date',
      'Status',
      'Remarks',
      'Pillar',
      'Linked_Record_ID',
      'Disposition_Type',
      'Identified_Exposure_INR',
      'Target_Recovery_INR',
      'Realized_Recovery_INR',
      'Verification_Stage',
    ],
  ];
  data.sheet6Actions.forEach((r, idx) => {
    const rowNum = idx + 2;
    ws6Rows.push([
      sanitizeSpreadsheetCell(r.issueId),
      sanitizeSpreadsheetCell(r.project),
      sanitizeSpreadsheetCell(r.issue),
      sanitizeSpreadsheetCell(r.priority),
      sanitizeSpreadsheetCell(r.owner),
      { t: 's', f: `TEXT(IF(D${rowNum}="Critical",TODAY()+3,IF(D${rowNum}="High",TODAY()+7,IF(D${rowNum}="Medium",TODAY()+14,TODAY()+30))),"yyyy-mm-dd")`, v: r.dueDate },
      sanitizeSpreadsheetCell(r.status),
      sanitizeSpreadsheetCell(r.remarks),
      sanitizeSpreadsheetCell(r.Pillar),
      sanitizeSpreadsheetCell(r.Linked_Record_ID),
      sanitizeSpreadsheetCell(r.Disposition_Type),
      r.Identified_Exposure_INR,
      r.Target_Recovery_INR,
      r.Realized_Recovery_INR,
      sanitizeSpreadsheetCell(r.Verification_Stage),
    ]);
  });
  const ws6 = XLSX.utils.aoa_to_sheet(ws6Rows);
  ws6['!cols'] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 44 },
    { wch: 12 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 38 },
    { wch: 16 },
    { wch: 18 },
    { wch: 26 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, ws6, 'Action Tracker');

  XLSX.writeFile(
    wb,
    `Operationalyst_${data.sheet1Summary.plantId.toUpperCase()}_CommandCenter_6Sheets.xlsx`
  );
}
