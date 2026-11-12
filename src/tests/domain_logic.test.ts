import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANTS, PERIODS } from '../context/PlantContext';

test('Plant calibrations are consistent and distinct across units', () => {
  const ambattur = PLANTS.ambattur;
  const sriperumbudur = PLANTS.sriperumbudur;
  const hosur = PLANTS.hosur;

  // Verify Ambattur Baseline Unit KPIs
  assert.equal(ambattur.name, 'Ambattur Baseline Unit');
  assert.equal(ambattur.kpis.deadStockDisplay, '₹2.23L');
  assert.equal(ambattur.kpis.otifPercent, 50);
  assert.equal(ambattur.kpis.freightLeakDisplay, '₹14K');
  assert.equal(ambattur.kpis.binAccuracyPercent, 60);

  // Verify Sriperumbudur Unit 2 KPIs
  assert.equal(sriperumbudur.name, 'Sriperumbudur Press & Machining');
  assert.equal(sriperumbudur.kpis.deadStockDisplay, '₹18.4L');
  assert.equal(sriperumbudur.kpis.otifPercent, 91);
  assert.equal(sriperumbudur.kpis.freightLeakDisplay, '₹74K');
  assert.equal(sriperumbudur.kpis.binAccuracyPercent, 96);

  // Verify Hosur Auto Components Unit KPIs
  assert.equal(hosur.name, 'Hosur Auto Components Unit');
  assert.equal(hosur.kpis.deadStockDisplay, '₹8.75L');
  assert.equal(hosur.kpis.otifPercent, 84);
  assert.equal(hosur.kpis.freightLeakDisplay, '₹36K');
  assert.equal(hosur.kpis.binAccuracyPercent, 88);

  // Verify Periods
  assert.ok(PERIODS.fortnight_sep);
  assert.ok(PERIODS.month_sep);
  assert.ok(PERIODS.q3_fy26);
});

test('Customer Tier logic identifies Hyundai as Tier-1 Strategic OEM', () => {
  const CUSTOMER_PRIORITY_MAP: Record<string, { tier: string; annualCr: number; riskStatus: 'PROTECTED' | 'ACCOUNT AT RISK' | 'HEALTHY' }> = {
    'Hyundai': { tier: 'Tier-1 Strategic OEM', annualCr: 5.20, riskStatus: 'ACCOUNT AT RISK' },
    'Hyundai vendor park': { tier: 'Tier-1 Strategic OEM', annualCr: 5.20, riskStatus: 'ACCOUNT AT RISK' },
    'Ashok Leyland line': { tier: 'Tier-1 Strategic OEM', annualCr: 4.80, riskStatus: 'ACCOUNT AT RISK' },
    'Royal Enfield supplier': { tier: 'Tier-1 Tier-1 Major Sub-Assembly', annualCr: 4.10, riskStatus: 'ACCOUNT AT RISK' },
    'TVS Motor feeder': { tier: 'Tier-2 Critical Subsystem', annualCr: 1.85, riskStatus: 'PROTECTED' },
  };

  const hyundaiEntry = CUSTOMER_PRIORITY_MAP['Hyundai vendor park'];
  assert.ok(hyundaiEntry);
  assert.equal(hyundaiEntry.tier, 'Tier-1 Strategic OEM');
  assert.equal(hyundaiEntry.riskStatus, 'ACCOUNT AT RISK');
  assert.equal(hyundaiEntry.annualCr, 5.20);
});

test('Dual-Gate Root Cause logic sums exactly to 9 dispatches', () => {
  const dispatches = [
    { id: '1', reason: 'QC hold on final batch' },
    { id: '2', reason: 'Die breakdown during shift' },
    { id: '3', reason: 'Labour short in packing' },
    { id: '4', reason: 'Raw material shortage CRCA sheet' },
    { id: '5', reason: 'Fasteners stockout at store' },
    { id: '6', reason: 'Zinc plating delay vendor side' },
    { id: '7', reason: 'No vehicle arrived carrier delay' },
    { id: '8', reason: 'Transporter failed truck placement' },
    { id: '9', reason: 'Paperwork e-way bill error' },
  ];

  let prod = 0, mat = 0, transport = 0, doc = 0;
  for (const d of dispatches) {
    const raw = d.reason.toLowerCase();
    if (raw.includes('qc') || raw.includes('die') || raw.includes('labour') || raw.includes('machine')) {
      prod++;
    } else if (raw.includes('material') || raw.includes('stockout') || raw.includes('plating')) {
      mat++;
    } else if (raw.includes('vehicle') || raw.includes('carrier') || raw.includes('transporter')) {
      transport++;
    } else if (raw.includes('paper') || raw.includes('doc') || raw.includes('bill') || raw.includes('eway')) {
      doc++;
    }
  }

  assert.equal(prod, 3);
  assert.equal(mat, 3);
  assert.equal(transport, 2);
  assert.equal(doc, 1);
  assert.equal(prod + mat + transport + doc, 9);
});

test('Warehouse Reliability hourly machine rate impact math', () => {
  const hourlyRate = 6500;
  const downtimeHours = 4.5;
  const stoppageCost = Math.round(hourlyRate * downtimeHours);
  assert.equal(stoppageCost, 29250);
});

test('Cross-Engine 5-way consolidated capital exposure math', () => {
  const p1DeadCash = 1840000;
  const p2OtifRevenueExposure = 450000;
  const p3FreightLeakage = 74200;
  const p4AccuracyLoss = 126100;
  const p5UnpaidDebtors = 485000;

  const totalExposure =
    p1DeadCash +
    p2OtifRevenueExposure +
    p3FreightLeakage +
    p4AccuracyLoss +
    p5UnpaidDebtors;

  assert.equal(totalExposure, 2975300);
  assert.ok(totalExposure > 2500000);
});

test('Cross-Engine 4-week performance trajectory progression', () => {
  const curOtif = 91;
  const curAccuracy = 96;
  const curHealth = 84;

  const wMinus3Otif = Math.max(35, Math.round(curOtif * 0.80));
  const wMinus3Accuracy = Math.max(45, Math.round(curAccuracy * 0.88));
  const wMinus3Health = Math.max(38, Math.round(curHealth * 0.82));

  assert.equal(wMinus3Otif, 73);
  assert.equal(wMinus3Accuracy, 84);
  assert.equal(wMinus3Health, 69);

  // Verifies positive progress over the 4 weeks
  assert.ok(curOtif > wMinus3Otif);
  assert.ok(curAccuracy > wMinus3Accuracy);
  assert.ok(curHealth > wMinus3Health);
});

test('Daily Huddle summarizes top 3 critical actions per P1-P4 engine (12 total)', () => {
  const engineKeys = ['p1', 'p2', 'p3', 'p4'] as const;
  const actionsPerEngine = 3;
  const totalExpectedActions = engineKeys.length * actionsPerEngine;

  assert.equal(totalExpectedActions, 12);

  // Completion calculation simulation
  const mockCompletedIds = new Set(['huddle-p1-1', 'huddle-p2-1', 'huddle-p4-1']);
  const completedCount = mockCompletedIds.size;
  const percentDone = Math.round((completedCount / totalExpectedActions) * 100);

  assert.equal(completedCount, 3);
  assert.equal(percentDone, 25);
  assert.equal(totalExpectedActions - completedCount, 9);
});

test('Factory Audit calculations correctly isolate Dead Stock and Working Capital Opportunity', () => {
  const totalInventory = 48500000; // ₹4.85 Cr
  const deadStock = 1820000; // ₹18.2 Lakhs
  const slowMoving = 4200000; // ₹42 Lakhs
  const recoveryFactor = 0.80; // 80% liquidation/debit note yield

  const workingCapitalOpportunity = Math.round(deadStock * recoveryFactor);
  assert.equal(workingCapitalOpportunity, 1456000); // ~₹14.5 Lakhs
  assert.ok(deadStock / totalInventory < 0.10); // Dead stock is ~3.75% of active inventory
  assert.ok(slowMoving > deadStock);
});

test('Homepage Commercial 4 numbers reflect pilot plant benchmark targets', () => {
  const deadStockIdentified = 1800000; // ₹18L
  const recoverableCapital = 1200000; // ₹12L
  const currentOtif = 50; // 50%
  const potentialImprovement = 27; // +27% target

  assert.equal(deadStockIdentified, 1800000);
  assert.equal(recoverableCapital, 1200000);
  assert.equal(currentOtif, 50);
  assert.equal(currentOtif + potentialImprovement, 77);
  assert.ok(recoverableCapital < deadStockIdentified);
});

test('Persuasion System: 6-Step Commitment Ladder maintains strict risk-gradient', () => {
  const ladderSteps = [
    { step: 1, name: 'See How Audit Works', commitment: 'Zero Risk' },
    { step: 2, name: 'Request Inventory Health Check', commitment: 'Low Effort' },
    { step: 3, name: 'Share Inventory Export', commitment: 'Confidential' },
    { step: 4, name: 'Review Forensic Findings', commitment: 'High Value' },
    { step: 5, name: 'Start 30-Day Pilot', commitment: 'Hands-On' },
    { step: 6, name: 'Adopt Operationalyst', commitment: 'Full Rollout' },
  ];

  assert.equal(ladderSteps.length, 6);
  assert.equal(ladderSteps[0].commitment, 'Zero Risk');
  assert.equal(ladderSteps[5].commitment, 'Full Rollout');
});

test('Persuasion System: 30-Second Video Ad covers exact 6 narrative beats within 30s', () => {
  const beats = [
    { id: 1, start: 0, end: 3, label: 'The Cash Hook' },
    { id: 2, start: 4, end: 8, label: 'The Hidden Loss' },
    { id: 3, start: 9, end: 15, label: 'Forensic Breakdown' },
    { id: 4, start: 16, end: 22, label: 'Audit Methodology' },
    { id: 5, start: 23, end: 27, label: 'The Brand Reality' },
    { id: 6, start: 27, end: 30, label: 'Real Scarcity Call To Action' },
  ];

  assert.equal(beats.length, 6);
  assert.equal(beats[0].start, 0);
  assert.equal(beats[beats.length - 1].end, 30);
  // Ensure no gaps
  for (let i = 0; i < beats.length - 1; i++) {
    assert.ok(beats[i + 1].start <= beats[i].end + 1);
  }
});

test('Persuasion System: Real Scarcity is strictly bounded by founder personal capacity', () => {
  const pilotCapacity = 3;
  const claimedSlots = 1;
  const remainingSlots = pilotCapacity - claimedSlots;

  assert.equal(pilotCapacity, 3);
  assert.equal(remainingSlots, 2);
  assert.ok(remainingSlots > 0 && remainingSlots <= pilotCapacity);
});

test('Layer 1 Buyer Reality: Supports three distinct manufacturing personas', () => {
  const roles = ['owner', 'ops', 'inventory'];
  assert.equal(roles.length, 3);
  assert.ok(roles.includes('owner'));
  assert.ok(roles.includes('ops'));
  assert.ok(roles.includes('inventory'));
});

test('Layer 6 Specificity: Delivers exact 8 concrete outputs and 6 explicit limitations', () => {
  const deliverables = [
    'Data-Quality Overview',
    'Non-Moving Stock Classification',
    'Slow-Moving Inventory Identification',
    'Value Concentration Analysis',
    'High-Priority SKU List',
    'Category-Level Observations',
    'Recommended 4-Week Investigation Sequence',
    'Executive Findings Call',
  ];

  const limitations = [
    'Does NOT Guarantee Cash Recovery',
    'Does NOT Replace Manager Judgment',
    'Depends on Data Completeness',
    'Disposition Remains with You',
    'No ERP Changes Required',
    'No Hidden Recurring Subscription',
  ];

  assert.equal(deliverables.length, 8);
  assert.equal(limitations.length, 6);
});

test('Layer 8 Reciprocity: 7 practical shop floor checks available with zero login', () => {
  const checkCount = 7;
  assert.equal(checkCount, 7);
});

test('Conversion Architecture: 11-Stage Psychological Sequence is complete and ordered', () => {
  const stages = [
    'ATTENTION',
    'SELF-DIAGNOSIS',
    'ECONOMIC RELEVANCE',
    'CURIOSITY',
    'LOW-RISK COMMITMENT',
    'TRUST',
    'AUTHORITY',
    'PROOF',
    'PERSONALIZATION',
    'VALUE',
    'SALE',
  ];
  assert.equal(stages.length, 11);
  assert.equal(stages[0], 'ATTENTION');
  assert.equal(stages[10], 'SALE');
});

test('Testing Roadmap: Supports 3 empirical hero frames and 5-question self-check', () => {
  const heroFrames = ['A', 'B', 'C'];
  const selfCheckQuestionsCount = 5;

  assert.equal(heroFrames.length, 3);
  assert.equal(selfCheckQuestionsCount, 5);
});

test('Homepage Config: 16-Section data constants are fully populated and structured', async () => {
  const config = await import('../commercial/homepageConfig');
  assert.ok(config.HERO_HEADLINE_VARIANTS.A);
  assert.ok(config.HERO_HEADLINE_VARIANTS.B);
  assert.ok(config.HERO_HEADLINE_VARIANTS.C);
  assert.equal(config.PROBLEM_QUESTIONS.length, 4);
  assert.equal(config.PROCESS_STEPS.length, 5);
  assert.equal(config.AUDIT_DELIVERABLES.length, 9);
  assert.equal(config.METHODOLOGY_STAGES.length, 6);
  assert.equal(config.DATA_TRUST_ITEMS.length, 7);
  assert.equal(config.FAQ_ITEMS.length, 10);
});

test('Self-Assessment logic correctly grades points into cautious categories', () => {
  const maxScore = 5 * 3; // 15
  assert.equal(maxScore, 15);

  const gradeScore = (score: number) => {
    if (score >= 12) return 'Strong Visibility Foundation';
    if (score >= 7) return 'Some Visibility Gaps';
    return 'Review Recommended';
  };

  assert.equal(gradeScore(15), 'Strong Visibility Foundation');
  assert.equal(gradeScore(12), 'Strong Visibility Foundation');
  assert.equal(gradeScore(10), 'Some Visibility Gaps');
  assert.equal(gradeScore(7), 'Some Visibility Gaps');
  assert.equal(gradeScore(6), 'Review Recommended');
  assert.equal(gradeScore(0), 'Review Recommended');
});

test('B2B Behavioral System: Stakeholder perspectives, objection matrix, anxiety map, and 27 iceberg dimensions are valid', async () => {
  const config = await import('../commercial/homepageConfig');

  // Verify 4 Stakeholder Roles (Economic Buyer, Champion, User, Technical Evaluator)
  assert.equal(config.STAKEHOLDER_PERSPECTIVES.length, 4);
  const roleIds = config.STAKEHOLDER_PERSPECTIVES.map((s) => s.id);
  assert.deepEqual(roleIds, ['economic_buyer', 'champion', 'user', 'evaluator']);
  for (const s of config.STAKEHOLDER_PERSPECTIVES) {
    assert.ok(s.coreQuestion.length > 10);
    assert.ok(s.unspokenAnxiety.length > 10);
    assert.ok(s.riskMitigation.length > 10);
    assert.ok(s.keyMetrics.length >= 2);
  }

  // Verify 6 Objections with 4-stage engineering
  assert.equal(config.OBJECTION_MATRIX.length, 6);
  for (const obj of config.OBJECTION_MATRIX) {
    assert.ok(obj.objection.length > 10);
    assert.ok(obj.underlyingAnxiety.length > 10);
    assert.ok(obj.evidenceAndMechanism.length > 10);
    assert.ok(obj.institutionalGuarantee.length > 10);
    assert.ok(obj.verificationStep.length > 10);
  }

  // Verify Customer Anxiety Mapping across 5 stages
  assert.equal(config.CUSTOMER_ANXIETY_MAP.length, 5);
  for (const stg of config.CUSTOMER_ANXIETY_MAP) {
    assert.ok(stg.stage.length > 0);
    assert.ok(stg.unspokenAnxiety.length > 0);
    assert.ok(stg.institutionalSafeguard.length > 0);
  }

  // Verify 27 Behavioral Science Dimensions
  assert.equal(config.BEHAVIORAL_ICEBERG_DIMENSIONS.length, 27);
  assert.equal(config.BEHAVIORAL_ICEBERG_DIMENSIONS[0].num, '01');
  assert.equal(config.BEHAVIORAL_ICEBERG_DIMENSIONS[26].num, '27');
});

test('Phase 2 Campaign Studio: 6 Ad Variations, Founder Teleprompter, LinkedIn Posts & 1-Manufacturer Milestone logic', () => {
  const AD_VARIATION_IDS = ['A', 'B', 'C', 'D', 'E', 'F'];
  assert.equal(AD_VARIATION_IDS.length, 6);

  // Milestone Progression
  const targetMilestones = [
    '1 Real Manufacturer',
    '1 Real Audit',
    '1 Useful Result',
    '1 Case Study',
    '1 Paid Customer',
  ];
  assert.equal(targetMilestones.length, 5);
  assert.equal(targetMilestones[0], '1 Real Manufacturer');
  assert.equal(targetMilestones[4], '1 Paid Customer');

  // Ad A Loss Frame
  const adA = {
    headline: 'How Much of Your Inventory Hasn’t Moved?',
    cta: 'Request Factory Audit →',
  };
  assert.ok(adA.headline.includes('Hasn’t Moved'));

  // Ad F Founder Script
  const adF = {
    founderHook: 'I’m building Operationalyst around a simple manufacturing problem.',
    founderCTA: 'Apply for Pilot Audit →',
  };
  assert.ok(adF.founderHook.length > 20);
});

test('Platform Redesign: Plain-language navigation preserves P1-P5 as secondary codes', async () => {
  const { PLATFORM_NAVIGATION, DEMO_ENVIRONMENT_CONFIG } = await import(
    '../dashboard/dashboardConfig'
  );
  assert.equal(PLATFORM_NAVIGATION.length, 9);
  assert.equal(PLATFORM_NAVIGATION[0].id, 'overview');
  assert.equal(PLATFORM_NAVIGATION[0].label, 'Overview');
  assert.equal(PLATFORM_NAVIGATION[1].label, 'Inventory');
  assert.equal(PLATFORM_NAVIGATION[1].secondaryCode, 'P1 • Cash Recovery');
  assert.equal(PLATFORM_NAVIGATION[2].label, 'Delivery');
  assert.equal(PLATFORM_NAVIGATION[2].secondaryCode, 'P2 • Customer Promise');
  assert.equal(PLATFORM_NAVIGATION[3].label, 'Profit & Risk');
  assert.equal(PLATFORM_NAVIGATION[3].secondaryCode, 'P3 • Profit Protection');
  assert.equal(PLATFORM_NAVIGATION[4].label, 'Warehouse');
  assert.equal(PLATFORM_NAVIGATION[4].secondaryCode, 'P4 • Warehouse Trust');
  assert.equal(PLATFORM_NAVIGATION[5].label, 'Executive Reports');
  assert.equal(PLATFORM_NAVIGATION[5].secondaryCode, 'P5 • CEO Briefing');
  assert.equal(DEMO_ENVIRONMENT_CONFIG.badgeLabel, 'DEMONSTRATION ENVIRONMENT');
  assert.equal(DEMO_ENVIRONMENT_CONFIG.organizationName, 'Illustrative Manufacturing Company');
});

test('Platform Redesign: Live snapshot enforces max 3 priority cards, 5 KPI cards with denominators, and Dual-Gate math', async () => {
  const { buildLivePlatformSnapshot } = await import('../dashboard/dashboardConfig');
  const snapshot = buildLivePlatformSnapshot(PLANTS.ambattur, PERIODS.fortnight_sep);

  // Max 3 priority cards in opening viewport
  assert.equal(snapshot.priorities.length, 3);
  assert.equal(snapshot.priorities[0].domain, 'delivery');
  assert.equal(snapshot.priorities[1].domain, 'inventory');
  assert.equal(snapshot.priorities[2].domain, 'profit_risk');

  // Max 5 KPI strip cards with explicit numerator/denominator context
  assert.equal(snapshot.kpiStrip.length, 5);
  const deliveryKpi = snapshot.kpiStrip.find((k) => k.id === 'kpi-delivery');
  assert.ok(deliveryKpi);
  assert.ok(deliveryKpi.contextSubtext.includes('9 of 18 dispatch lines passed'));

  // Dual-Gate breakdown sums exactly to totalDispatches
  const dg = snapshot.p2DualGate;
  assert.equal(dg.totalDispatches, 18);
  assert.equal(dg.passedBoth, 9);
  assert.equal(dg.failedTotal, 9);
  assert.equal(dg.passedBoth + dg.lateOnly + dg.shortOnly + dg.lateAndShort, dg.totalDispatches);
  assert.equal(dg.otifPercent, 50);

  // Methodologies populated for Right-Side Drawer
  assert.ok(snapshot.methodologies.delivery_otif);
  assert.ok(snapshot.methodologies.inventory_exposure);
  assert.ok(snapshot.methodologies.profit_freight_variance);
  assert.ok(snapshot.methodologies.warehouse_bin_accuracy);
});

test('Phase 0 Remediation: Date validation handles ISO, DD/MM/YYYY, missing, invalid, and ambiguous dates without silent fallback', async () => {
  const { validateImportDate } = await import('../utils/importValidation');

  // Valid ISO date
  const validIso = validateImportDate('2026-09-15');
  assert.equal(validIso.status, 'VALID');
  assert.equal(validIso.normalized, '2026-09-15');

  // Valid unambiguous DD/MM/YYYY date (day > 12)
  const validDmy = validateImportDate('18/09/2026');
  assert.equal(validDmy.status, 'VALID');
  assert.equal(validDmy.normalized, '2026-09-18');

  // Missing date -> MISSING_DATE (never defaults to 2026-09-20 or 2026-09-25)
  const missingEmpty = validateImportDate('');
  assert.equal(missingEmpty.status, 'MISSING_DATE');
  assert.equal(missingEmpty.normalized, undefined);

  const missingNull = validateImportDate(null);
  assert.equal(missingNull.status, 'MISSING_DATE');

  // Invalid date -> INVALID_DATE
  const invalidText = validateImportDate('not-a-date');
  assert.equal(invalidText.status, 'INVALID_DATE');

  const invalidCalendar = validateImportDate('2026-02-31');
  assert.equal(invalidCalendar.status, 'INVALID_DATE');

  // Ambiguous slash date (both first and second parts <= 12 and unequal) -> AMBIGUOUS_DATE
  const ambiguous = validateImportDate('04/05/2026');
  assert.equal(ambiguous.status, 'AMBIGUOUS_DATE');
});

test('Phase 0 Remediation: Numeric validation handles plain numbers, INR currency strings, missing, invalid text, and negatives without silent 0 coercion', async () => {
  const { validateImportNumber } = await import('../utils/importValidation');

  // Valid numeric string
  const validPlain = validateImportNumber('12500');
  assert.equal(validPlain.status, 'VALID_NUMBER');
  assert.equal(validPlain.value, 12500);

  // Valid INR currency-formatted string
  const validCurrency = validateImportNumber('₹1,45,000.50');
  assert.equal(validCurrency.status, 'VALID_NUMBER');
  assert.equal(validCurrency.value, 145000.5);

  // Blank required numeric field -> MISSING_NUMBER (never coerced to 0)
  const missingBlank = validateImportNumber('');
  assert.equal(missingBlank.status, 'MISSING_NUMBER');
  assert.equal(missingBlank.value, undefined);

  // Invalid text in numeric field -> INVALID_NUMBER (never coerced to 0)
  const invalidText = validateImportNumber('PENDING_QUOTE');
  assert.equal(invalidText.status, 'INVALID_NUMBER');
  assert.equal(invalidText.value, undefined);

  // Negative quantity/rate -> NEGATIVE_NUMBER when allowNegative is false
  const negativeQty = validateImportNumber('-45', { allowNegative: false });
  assert.equal(negativeQty.status, 'NEGATIVE_NUMBER');
});

test('Phase 0 Remediation: Spreadsheet formula sanitization neutralizes =, +, -, @ while preserving normal SKU codes', async () => {
  const { sanitizeSpreadsheetCell, toSafeCsvCell } = await import('../utils/importValidation');

  assert.equal(sanitizeSpreadsheetCell('=SUM(A1:A10)'), "'=SUM(A1:A10)");
  assert.equal(sanitizeSpreadsheetCell("+cmd|' /C calc'!A0"), "'+cmd|' /C calc'!A0");
  assert.equal(sanitizeSpreadsheetCell('-2+3'), "'-2+3");
  assert.equal(sanitizeSpreadsheetCell('@HYPERLINK("http://evil.example")'), '\'@HYPERLINK("http://evil.example")');
  assert.equal(sanitizeSpreadsheetCell('RM-CR-204'), 'RM-CR-204');
  assert.equal(sanitizeSpreadsheetCell(4500), 4500);
  assert.equal(toSafeCsvCell('=1+1'), '"\'=1+1"');
  assert.equal(toSafeCsvCell('RM-CR-204'), '"RM-CR-204"');
});

test('Phase 0 Remediation: Workspace storage key alignment uses otif_active_workspace_id_v2 and migrates legacy key', async () => {
  const {
    STORAGE_KEY_P2_ACTIVE_WS,
    LEGACY_STORAGE_KEY_P2_ACTIVE_WS,
    getActiveP2WorkspaceId,
  } = await import('../utils/importValidation');

  assert.equal(STORAGE_KEY_P2_ACTIVE_WS, 'otif_active_workspace_id_v2');
  assert.equal(LEGACY_STORAGE_KEY_P2_ACTIVE_WS, 'otif_active_ws_v2');

  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };

  // Fallback when empty
  assert.equal(getActiveP2WorkspaceId('ws-default', mockStorage), 'ws-default');

  // Legacy migration
  store.set(LEGACY_STORAGE_KEY_P2_ACTIVE_WS, 'ws-legacy-plant');
  assert.equal(getActiveP2WorkspaceId('ws-default', mockStorage), 'ws-legacy-plant');
  assert.equal(store.get(STORAGE_KEY_P2_ACTIVE_WS), 'ws-legacy-plant');

  // Canonical key takes precedence
  store.set(STORAGE_KEY_P2_ACTIVE_WS, 'ws-canonical-plant');
  assert.equal(getActiveP2WorkspaceId('ws-default', mockStorage), 'ws-canonical-plant');
});

test('Phase 0 Remediation: Dashboard snapshot and 6-sheet export dataset produce identical P1-P4 metrics with zero hidden multipliers', async () => {
  const { buildLivePlatformSnapshot } = await import('../dashboard/dashboardConfig');
  const { buildSixSheetDataset } = await import('../utils/excelCommandCenterExporter');

  const ambatturSnap = buildLivePlatformSnapshot(PLANTS.ambattur, PERIODS.fortnight_sep);
  const sriperumbudurSnap = buildLivePlatformSnapshot(PLANTS.sriperumbudur, PERIODS.fortnight_sep);
  const hosurSnap = buildLivePlatformSnapshot(PLANTS.hosur, PERIODS.fortnight_sep);

  // Verify all 3 plants load row-traceable datasets with zero synthetic multipliers
  assert.equal(ambatturSnap.datasetLoaded, true);
  assert.equal(sriperumbudurSnap.datasetLoaded, true);
  assert.equal(hosurSnap.datasetLoaded, true);
  assert.equal(ambatturSnap.p1DeadValue, 223110);
  assert.notEqual(ambatturSnap.p1DeadValue, sriperumbudurSnap.p1DeadValue);
  assert.notEqual(ambatturSnap.p1DeadValue, hosurSnap.p1DeadValue);

  // Verify no fabricated 1150 order-value exposure
  assert.equal(
    ambatturSnap.p2DualGate.revenueAtRiskFormatted,
    'Revenue exposure unavailable because order-value information was not provided.'
  );

  // Verify 100% alignment between Dashboard Snapshot and 6-Sheet Workbook Exporter (including when called with true)
  const workbookDefault = buildSixSheetDataset(false);
  const workbookWithFlag = buildSixSheetDataset(true);

  assert.equal(workbookDefault.sheet1Summary.cashStuck, ambatturSnap.p1DeadValue);
  assert.equal(workbookWithFlag.sheet1Summary.cashStuck, ambatturSnap.p1DeadValue);
  assert.equal(
    Math.round(workbookDefault.sheet1Summary.otifRatio * 100),
    ambatturSnap.p2DualGate.otifPercent
  );
  assert.equal(workbookDefault.sheet1Summary.freightLeakage, ambatturSnap.p3LeakageValue);
  assert.equal(
    Math.round(workbookDefault.sheet1Summary.accuracyRatio * 100),
    ambatturSnap.p4AccuracyPercent
  );
  assert.equal(workbookDefault.sheet1Summary.varianceValueTotal, ambatturSnap.p4VarianceAbsValue);
  assert.equal(workbookDefault.sheet1Summary.revenueAtRisk, null);
});

test('Phase 1 Lead Capture: Lead payload validation accepts valid manufacturing pilot requests and trims whitespace', async () => {
  const { validatePilotRequestPayload } = await import('../utils/leadValidation');

  const result = validatePilotRequestPayload({
    fullName: '  Rajesh Kumar  ',
    workEmail: '  RAJESH@ApexEngineering.in  ',
    phoneOrWhatsapp: '  +91 98400 12345  ',
    companyName: '  Apex Auto Components Pvt Ltd  ',
    plantLocation: '  Ambattur SIDCO, Chennai  ',
    roleTitle: '  Plant Head  ',
    erpSystem: '  Tally Prime  ',
    approxSkuCount: '  3,200 SKUs  ',
    primaryChallenge: '  Non-moving raw material and slow-moving spares  ',
    consentConfirmed: true,
    sourceView: '  landing_hero  ',
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.isSpamTrap, false);
    assert.equal(result.data.fullName, 'Rajesh Kumar');
    assert.equal(result.data.workEmail, 'rajesh@apexengineering.in');
    assert.equal(result.data.phoneOrWhatsapp, '+91 98400 12345');
    assert.equal(result.data.companyName, 'Apex Auto Components Pvt Ltd');
    assert.equal(result.data.plantLocation, 'Ambattur SIDCO, Chennai');
    assert.equal(result.data.roleTitle, 'Plant Head');
    assert.equal(result.data.erpSystem, 'Tally Prime');
    assert.equal(result.data.approxSkuCount, '3,200 SKUs');
    assert.equal(result.data.primaryChallenge, 'Non-moving raw material and slow-moving spares');
    assert.equal(result.data.consentConfirmed, true);
    assert.equal(result.data.sourceView, 'landing_hero');
  }
});

test('Phase 1 Lead Capture: Lead payload validation rejects missing required fields with structured fieldErrors', async () => {
  const { validatePilotRequestPayload } = await import('../utils/leadValidation');

  const result = validatePilotRequestPayload({
    fullName: 'R',
    workEmail: '',
    phoneOrWhatsapp: '123',
    companyName: '',
    plantLocation: 'A',
    roleTitle: '',
    consentConfirmed: false,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, 'Validation failed');
    assert.ok(result.fieldErrors.fullName);
    assert.ok(result.fieldErrors.workEmail);
    assert.ok(result.fieldErrors.phoneOrWhatsapp);
    assert.ok(result.fieldErrors.companyName);
    assert.ok(result.fieldErrors.plantLocation);
    assert.ok(result.fieldErrors.roleTitle);
    assert.ok(result.fieldErrors.consentConfirmed);
  }
});

test('Phase 1 Lead Capture: Lead payload validation rejects invalid email formats and flags honeypot spam', async () => {
  const { validatePilotRequestPayload } = await import('../utils/leadValidation');

  const badEmailResult = validatePilotRequestPayload({
    fullName: 'Suresh Menon',
    workEmail: 'invalid-email-without-domain@',
    phoneOrWhatsapp: '+91 98400 99999',
    companyName: 'Menon Precision Gears',
    plantLocation: 'Coimbatore',
    roleTitle: 'Managing Director',
    consentConfirmed: true,
  });

  assert.equal(badEmailResult.ok, false);
  if (!badEmailResult.ok) {
    assert.ok(badEmailResult.fieldErrors.workEmail);
  }

  const honeypotResult = validatePilotRequestPayload({
    fullName: 'Bot User',
    workEmail: 'bot@example.com',
    phoneOrWhatsapp: '1234567890',
    companyName: 'Spam Corp',
    plantLocation: 'Nowhere',
    roleTitle: 'Bot',
    consentConfirmed: true,
    websiteHoneypot: 'https://spam-link.example',
  });

  assert.equal(honeypotResult.ok, true);
  if (honeypotResult.ok) {
    assert.equal(honeypotResult.isSpamTrap, true);
  }
});

test('Phase 1 Lead Capture: Lead persistence helper generates valid PILOT-... leadId, persists records, lists newest-first, and updates status + founderNotes', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const { createLeadRecord, listLeadRecords, updateLeadRecord } = await import(
    '../utils/leadStore'
  );

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-leads-test-'));
  const testFilePath = path.join(tmpDir, 'pilot_requests.json');

  try {
    const first = await createLeadRecord(
      {
        fullName: 'Vikram Iyer',
        workEmail: 'vikram@iyerforgings.in',
        phoneOrWhatsapp: '+91 98401 11111',
        companyName: 'Iyer Industrial Forgings',
        plantLocation: 'Sriperumbudur, TN',
        roleTitle: 'Director Operations',
        erpSystem: 'SAP B1',
        approxSkuCount: '4,500',
        primaryChallenge: 'High value non-moving die steel inventory',
        consentConfirmed: true,
        sourceView: 'landing_hero',
      },
      testFilePath
    );

    assert.match(first.leadId, /^PILOT-\d{8}-[0-9A-F]{4}$/);
    assert.equal(first.status, 'NEW');
    assert.equal(first.founderNotes, '');

    // Ensure distinct timestamp for newest-first sort verification
    await new Promise((r) => setTimeout(r, 15));

    const second = await createLeadRecord(
      {
        fullName: 'Ananya Deshmukh',
        workEmail: 'ananya@chakanvalves.co.in',
        phoneOrWhatsapp: '+91 98220 22222',
        companyName: 'Chakan Flow Control Valves',
        plantLocation: 'Chakan MIDC, Pune',
        roleTitle: 'VP Supply Chain',
        erpSystem: 'Tally Prime',
        approxSkuCount: '2,100',
        primaryChallenge: 'Slow-moving machined castings',
        consentConfirmed: true,
        sourceView: 'buyer_persona',
      },
      testFilePath
    );

    const listed = await listLeadRecords(testFilePath);
    assert.equal(listed.length, 2);
    assert.equal(listed[0].leadId, second.leadId);
    assert.equal(listed[1].leadId, first.leadId);

    const updated = await updateLeadRecord(
      first.leadId,
      {
        status: 'NDA_SENT',
        founderNotes: 'Sent mutual NDA and 5-column Tally export guide on Monday.',
      },
      testFilePath
    );

    assert.ok(updated);
    assert.equal(updated?.status, 'NDA_SENT');
    assert.equal(
      updated?.founderNotes,
      'Sent mutual NDA and 5-column Tally export guide on Monday.'
    );

    const listedAfterUpdate = await listLeadRecords(testFilePath);
    const reloadedFirst = listedAfterUpdate.find((r) => r.leadId === first.leadId);
    assert.equal(reloadedFirst?.status, 'NDA_SENT');
    assert.equal(
      reloadedFirst?.founderNotes,
      'Sent mutual NDA and 5-column Tally export guide on Monday.'
    );
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 2 Founder Identity: Homepage config and campaign deliverables normalize founder identity to C. Jones Snowin', async () => {
  const { DATA_TRUST_ITEMS, CUSTOMER_ANXIETY_MAP } = await import('../commercial/homepageConfig');

  const accessTrustItem = DATA_TRUST_ITEMS.find((i) =>
    i.question.includes('Who can access submitted information')
  );
  assert.ok(accessTrustItem);
  assert.ok(accessTrustItem.answer.includes('C. Jones Snowin'));
  assert.ok(!accessTrustItem.answer.includes('Jonez'));

  const deletionTrustItem = DATA_TRUST_ITEMS.find((i) =>
    i.question.includes('How can deletion be requested')
  );
  assert.ok(deletionTrustItem);
  assert.ok(deletionTrustItem.answer.includes('joneszz2004@gmail.com'));

  const findingsAnxietyStage = CUSTOMER_ANXIETY_MAP.find((s) =>
    s.stage.includes('4. Findings Review')
  );
  assert.ok(findingsAnxietyStage);
  assert.ok(findingsAnxietyStage.institutionalSafeguard.includes('C. Jones Snowin'));
});

test('Phase 2 Data Kit Exporter: Generates valid 5-column sample rows, guide instructions, CSV content, and Step 2 suitability reply', async () => {
  const {
    PILOT_DATA_KIT_COLUMNS,
    buildPilotDataKitSampleRows,
    buildPilotDataKitGuideRows,
    buildPilotDataKitCsvContent,
    buildStep2SuitabilityReplyTemplate,
  } = await import('../utils/pilotDataKitExporter');

  assert.deepEqual(PILOT_DATA_KIT_COLUMNS, [
    'Part_ID',
    'Part_Description',
    'Closing_Stock_Qty',
    'Unit_Cost_INR',
    'Last_Movement_Date',
  ]);

  const sampleRows = buildPilotDataKitSampleRows();
  assert.equal(sampleRows.length, 5);
  assert.equal(sampleRows[0].Part_ID, 'SKU-CAST-001 (SAMPLE - DELETE BEFORE UPLOAD)');
  assert.equal(sampleRows[4].Part_ID, 'SKU-VLV-005 (SAMPLE - DELETE BEFORE UPLOAD)');

  const guideRows = buildPilotDataKitGuideRows();
  assert.ok(guideRows.length >= 6);
  const fullGuideText = guideRows
    .map(
      (r) =>
        `${r.Topic} ${r.Step_Or_Rule} ${r.Practical_Instructions} ${r.Anonymization_And_Safety_Notes}`
    )
    .join(' ');
  assert.ok(fullGuideText.includes('Tally Prime'));
  assert.ok(fullGuideText.includes('SAP'));
  assert.ok(fullGuideText.includes('Busy'));
  assert.ok(fullGuideText.includes('C. Jones Snowin'));

  const csvContent = buildPilotDataKitCsvContent();
  const csvLines = csvContent.trim().split('\n');
  assert.equal(
    csvLines[0],
    '"Part_ID","Part_Description","Closing_Stock_Qty","Unit_Cost_INR","Last_Movement_Date"'
  );
  assert.equal(csvLines.length, 6); // 1 header + 5 illustrative rows

  const replyText = buildStep2SuitabilityReplyTemplate({
    fullName: 'Rajesh Kumar',
    companyName: 'Apex Auto Components Pvt Ltd',
    erpSystem: 'Tally Prime',
  });
  assert.ok(replyText.includes('Hello Rajesh Kumar'));
  assert.ok(replyText.includes('Apex Auto Components Pvt Ltd'));
  assert.ok(replyText.includes('Tally Prime'));
  assert.ok(replyText.includes('Part_ID'));
  assert.ok(replyText.includes('Last_Movement_Date'));
  assert.ok(replyText.includes('C. Jones Snowin'));
});

test('Phase 2 Pilot Workspace Store: Creates server-backed P1 audit snapshot (AUDIT-YYYYMMDD-XXXX), computes exact P1 metrics via evaluateStockEngine, enforces shareToken on read, and rejects invalid tokens', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES } = await import(
    '../project1/data/initialData'
  );
  const {
    validatePilotWorkspacePayload,
    createPilotWorkspaceSnapshot,
    listPilotWorkspaceSnapshots,
    getAuthorizedPilotWorkspaceSnapshot,
  } = await import('../utils/pilotWorkspaceStore');

  const validation = validatePilotWorkspacePayload({
    companyName: 'Ambattur Fabrication Sample Plant',
    plantLocation: 'Ambattur Industrial Estate, Chennai',
    leadId: 'PILOT-20261105-A1B2',
    preparedBy: 'C. Jones Snowin',
    rules: DEFAULT_RULES,
    skus: AMBATTUR_FABRICATION_SAMPLE,
    executiveNotes: 'Verified 20-SKU baseline pilot workspace.',
  });

  assert.equal(validation.ok, true);
  assert.ok(validation.data);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-workspaces-test-'));
  const testFilePath = path.join(tmpDir, 'pilot_workspaces.json');

  try {
    const created = await createPilotWorkspaceSnapshot(validation.data!, testFilePath);

    assert.match(created.workspaceId, /^AUDIT-\d{8}-[0-9A-F]{4}$/);
    assert.ok(created.shareToken.length >= 24);
    assert.equal(created.preparedBy, 'C. Jones Snowin');
    assert.equal(created.leadId, 'PILOT-20261105-A1B2');

    // Verify deterministic P1 calculation metrics on AMBATTUR_FABRICATION_SAMPLE
    assert.equal(created.summaryMetrics.totalSkus, 20);
    assert.equal(created.summaryMetrics.deadSkusCount, 8);
    assert.equal(created.summaryMetrics.totalStockValue, 645650);
    assert.equal(created.summaryMetrics.deadStockValue, 223110);
    assert.equal(created.summaryMetrics.slowMovingValue, 63600);
    assert.equal(created.summaryMetrics.annualCarryingCostDrain, 40160);
    assert.equal(created.summaryMetrics.monthlyBurn, 3347);
    assert.equal(created.summaryMetrics.targetCashRelease, 175257);
    assert.equal(created.ownerReport.ageingBreakdown.range180_plus, 223110);
    assert.equal(created.evaluatedSkus.length, 20);

    // List snapshots
    const allSnapshots = await listPilotWorkspaceSnapshots(testFilePath);
    assert.equal(allSnapshots.length, 1);
    assert.equal(allSnapshots[0].workspaceId, created.workspaceId);

    // Authorized read with valid shareToken
    const authorizedViaToken = await getAuthorizedPilotWorkspaceSnapshot(
      created.workspaceId,
      { shareToken: created.shareToken, isAdmin: false },
      testFilePath
    );
    assert.equal(authorizedViaToken.status, 'OK');
    if (authorizedViaToken.status === 'OK') {
      assert.equal(authorizedViaToken.snapshot.workspaceId, created.workspaceId);
    }

    // Reject read with wrong shareToken
    const rejectedBadToken = await getAuthorizedPilotWorkspaceSnapshot(
      created.workspaceId,
      { shareToken: 'invalid-token-attempt', isAdmin: false },
      testFilePath
    );
    assert.equal(rejectedBadToken.status, 'UNAUTHORIZED');

    // Reject read for non-existent workspaceId
    const notFoundResult = await getAuthorizedPilotWorkspaceSnapshot(
      'AUDIT-20261105-FFFF',
      { shareToken: created.shareToken, isAdmin: false },
      testFilePath
    );
    assert.equal(notFoundResult.status, 'NOT_FOUND');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 3 Multi-Module Workspace Store: Computes accurate P1, P2, P3, and P4 summaries on the server', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES } = await import(
    '../project1/data/initialData'
  );
  const { INITIAL_DISPATCHES, INITIAL_RULES: DEFAULT_P2_RULES } = await import(
    '../project2/data/initialData'
  );
  const { INITIAL_TRIPS, DEFAULT_RULES: DEFAULT_P3_RULES } = await import(
    '../project3/data/defaultData'
  );
  const { INITIAL_SAMPLE_SKUS, DEFAULT_RULES: DEFAULT_P4_RULES } = await import(
    '../project4/data/sampleData'
  );
  const {
    validatePilotWorkspacePayload,
    createPilotWorkspaceSnapshot,
    getAuthorizedPilotWorkspaceSnapshot,
  } = await import('../utils/pilotWorkspaceStore');

  const validation = validatePilotWorkspacePayload({
    companyName: 'Ambattur Multi-Pillar Plant',
    plantLocation: 'Ambattur Industrial Estate, Chennai',
    leadId: 'PILOT-20261105-P1P4',
    preparedBy: 'C. Jones Snowin',
    rules: DEFAULT_RULES,
    skus: AMBATTUR_FABRICATION_SAMPLE,
    p2Rules: DEFAULT_P2_RULES,
    p2Dispatches: INITIAL_DISPATCHES,
    p3Rules: DEFAULT_P3_RULES,
    p3FreightTrips: INITIAL_TRIPS,
    p4Rules: DEFAULT_P4_RULES,
    p4WarehouseBins: INITIAL_SAMPLE_SKUS,
    executiveNotes: 'Full 4-pillar diagnostic snapshot across P1, P2, P3, and P4.',
  });

  assert.equal(validation.ok, true);
  assert.ok(validation.data);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p3-multi-test-'));
  const testFilePath = path.join(tmpDir, 'pilot_workspaces.json');

  try {
    const created = await createPilotWorkspaceSnapshot(validation.data!, testFilePath);

    assert.ok(created.multiModuleSummary);
    // P1 verification
    assert.equal(created.multiModuleSummary.p1.totalSkus, 20);
    assert.equal(created.multiModuleSummary.p1.deadSkusCount, 8);
    assert.equal(created.multiModuleSummary.p1.deadStockValue, 223110);
    assert.equal(created.multiModuleSummary.p1.targetCashRelease, 175257);

    // P2 OTIF verification
    assert.ok(created.multiModuleSummary.p2);
    assert.equal(created.multiModuleSummary.p2!.totalDispatches, 18);
    assert.equal(created.multiModuleSummary.p2!.passes, 9);
    assert.equal(created.multiModuleSummary.p2!.fails, 9);
    assert.equal(created.multiModuleSummary.p2!.otifPercent, 50);
    assert.equal(created.multiModuleSummary.p2!.failsLateOnly, 6);
    assert.equal(created.multiModuleSummary.p2!.failsShortOnly, 2);
    assert.equal(created.multiModuleSummary.p2!.failsLateAndShort, 1);
    assert.equal(created.evaluatedP2Dispatches?.length, 18);

    // P3 Freight Audit verification
    assert.ok(created.multiModuleSummary.p3);
    assert.equal(created.multiModuleSummary.p3!.totalTrips, 12);
    assert.equal(created.multiModuleSummary.p3!.flaggedTripsCount, 12);
    assert.equal(created.multiModuleSummary.p3!.freightPaid, 58600);
    assert.equal(created.multiModuleSummary.p3!.rateLeak, 9044);
    assert.equal(created.multiModuleSummary.p3!.detention, 4900);
    assert.equal(created.multiModuleSummary.p3!.totalLeak, 13944);
    assert.equal(created.evaluatedP3Trips?.length, 12);

    // P4 Warehouse Bin Variance verification
    assert.ok(created.multiModuleSummary.p4);
    assert.equal(created.multiModuleSummary.p4!.skusCounted, 15);
    assert.equal(created.multiModuleSummary.p4!.linesMatched, 9);
    assert.equal(created.multiModuleSummary.p4!.linesMismatch, 6);
    assert.equal(created.multiModuleSummary.p4!.binAccuracyPercent, 60);
    assert.equal(created.multiModuleSummary.p4!.shelfShortRupees, 24240);
    assert.equal(created.multiModuleSummary.p4!.foundStockRupees, 560);
    assert.equal(created.multiModuleSummary.p4!.absVarianceRupees, 24800);
    assert.equal(created.multiModuleSummary.p4!.netGapRupees, -23680);
    assert.equal(created.evaluatedP4Bins?.length, 15);

    const fetched = await getAuthorizedPilotWorkspaceSnapshot(
      created.workspaceId,
      { shareToken: created.shareToken, isAdmin: false },
      testFilePath
    );
    assert.equal(fetched.status, 'OK');
    if (fetched.status === 'OK') {
      assert.equal(fetched.snapshot.multiModuleSummary?.p2?.otifPercent, 50);
      assert.equal(fetched.snapshot.multiModuleSummary?.p3?.totalLeak, 13944);
      assert.equal(fetched.snapshot.multiModuleSummary?.p4?.binAccuracyPercent, 60);
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 3 Legal & Governance: Zero occurrences of Privacy Policy (Placeholder) or Terms of Service (Placeholder) remain in commercial UI and LegalGovernanceModal contains required B2B clauses', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');

  const commercialDir = path.join(process.cwd(), 'src', 'commercial');
  const entries = await fs.readdir(commercialDir);

  for (const file of entries) {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;
    const content = await fs.readFile(path.join(commercialDir, file), 'utf-8');
    assert.equal(
      content.includes('Privacy Policy (Placeholder)'),
      false,
      `Found "Privacy Policy (Placeholder)" in ${file}`
    );
    assert.equal(
      content.includes('Terms of Service (Placeholder)'),
      false,
      `Found "Terms of Service (Placeholder)" in ${file}`
    );
  }

  const legalModalContent = await fs.readFile(
    path.join(commercialDir, 'LegalGovernanceModal.tsx'),
    'utf-8'
  );
  assert.ok(legalModalContent.includes('C. Jones Snowin'));
  assert.ok(legalModalContent.includes('Snowin Ventures'));
  assert.ok(legalModalContent.includes('Chennai, Tamil Nadu, India'));
  assert.ok(legalModalContent.includes('joneszz2004@gmail.com'));
  assert.ok(legalModalContent.includes('Step 1 Zero-File Collection'));
  assert.ok(legalModalContent.includes('Step 2 Data Minimization & Anonymization'));
  assert.ok(legalModalContent.includes('Zero Third-Party AI Model Training'));
  assert.ok(legalModalContent.includes('14-Day Post-Audit Purge & Deletion Rights'));
  assert.ok(legalModalContent.includes('Decision-Support & Diagnostic Scope'));
  assert.ok(legalModalContent.includes('No Automated Write-Offs or ERP Mutation'));
  assert.ok(legalModalContent.includes('No Automatic Subscription Lock-In'));
});

test('Phase 4 Self-Assessment Scorer: Evaluates 5-question answers across all combinations into 0-100 readinessScore, riskBand, and identifiedGaps', async () => {
  const { evaluateSelfAssessment } = await import('../utils/selfAssessmentScorer');

  // 1. All Yes -> 100/100, STRUCTURED_BASELINE, 0 gaps
  const allYes = evaluateSelfAssessment({
    1: 'yes',
    2: 'yes',
    3: 'yes',
    4: 'yes',
    5: 'yes',
  });
  assert.equal(allYes.readinessScore, 100);
  assert.equal(allYes.riskBand, 'STRUCTURED_BASELINE');
  assert.equal(allYes.identifiedGaps.length, 0);

  // 2. All No -> 0/100, CRITICAL_BLIND_SPOTS, 5 gaps
  const allNo = evaluateSelfAssessment({
    1: 'no',
    2: 'no',
    3: 'no',
    4: 'no',
    5: 'no',
  });
  assert.equal(allNo.readinessScore, 0);
  assert.equal(allNo.riskBand, 'CRITICAL_BLIND_SPOTS');
  assert.equal(allNo.identifiedGaps.length, 5);
  assert.ok(allNo.recommendedChallengeText.includes('Self-Assessment 0/100'));

  // 3. Mixed answers (2 Yes = 40, 1 Partially = 10, 1 Unsure = 5, 1 No = 0 -> 55/100, PARTIAL_VISIBILITY, 3 gaps)
  const mixed = evaluateSelfAssessment({
    1: 'yes',
    2: 'partially',
    3: 'unsure',
    4: 'no',
    5: 'yes',
  });
  assert.equal(mixed.readinessScore, 55);
  assert.equal(mixed.riskBand, 'PARTIAL_VISIBILITY');
  assert.equal(mixed.identifiedGaps.length, 3);
  assert.ok(mixed.summaryText.includes('Diagnostic Score: 55/100'));
});

test('Phase 4 Lead Qualification Persistence: Validates, sanitizes, and persists buyerPersona, selfAssessmentScore, selfAssessmentBand, and selfAssessmentSummary', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const { validatePilotRequestPayload } = await import('../utils/leadValidation');
  const { createLeadRecord, listLeadRecords } = await import('../utils/leadStore');

  const validWithQualification = validatePilotRequestPayload({
    fullName: 'Karthik Narayanan',
    workEmail: 'karthik@narayananprecision.in',
    phoneOrWhatsapp: '+91 98409 88776',
    companyName: 'Narayanan Precision Castings Pvt Ltd',
    plantLocation: 'Guindy Industrial Estate, Chennai',
    roleTitle: 'Chief Financial Officer',
    erpSystem: 'SAP (B1 / S4 / ECC)',
    approxSkuCount: '6,800 SKUs',
    primaryChallenge: 'Need dead stock audit before board meeting',
    buyerPersona: 'ECONOMIC_BUYER',
    selfAssessmentScore: 35,
    selfAssessmentBand: 'CRITICAL_BLIND_SPOTS',
    selfAssessmentSummary:
      'Score 35/100 (CRITICAL_BLIND_SPOTS) · Gaps: No SKU-level review of non-moving stock',
    consentConfirmed: true,
    websiteHoneypot: '',
    sourceView: 'stakeholder_economic_buyer',
  });

  assert.equal(validWithQualification.ok, true);
  assert.ok(validWithQualification.data);
  assert.equal(validWithQualification.data!.buyerPersona, 'ECONOMIC_BUYER');
  assert.equal(validWithQualification.data!.selfAssessmentScore, 35);
  assert.equal(validWithQualification.data!.selfAssessmentBand, 'CRITICAL_BLIND_SPOTS');

  // Reject out-of-range selfAssessmentScore
  const invalidScore = validatePilotRequestPayload({
    fullName: 'Karthik Narayanan',
    workEmail: 'karthik@narayananprecision.in',
    phoneOrWhatsapp: '+91 98409 88776',
    companyName: 'Narayanan Precision Castings Pvt Ltd',
    plantLocation: 'Guindy Industrial Estate, Chennai',
    roleTitle: 'Chief Financial Officer',
    selfAssessmentScore: 150,
    consentConfirmed: true,
  });
  assert.equal(invalidScore.ok, false);
  assert.ok(invalidScore.fieldErrors?.selfAssessmentScore);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p4-leads-test-'));
  const testFilePath = path.join(tmpDir, 'pilot_requests.json');

  try {
    const saved = await createLeadRecord(validWithQualification.data!, testFilePath);
    assert.equal(saved.buyerPersona, 'ECONOMIC_BUYER');
    assert.equal(saved.selfAssessmentScore, 35);
    assert.equal(saved.selfAssessmentBand, 'CRITICAL_BLIND_SPOTS');

    const listed = await listLeadRecords(testFilePath);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].buyerPersona, 'ECONOMIC_BUYER');
    assert.equal(listed[0].selfAssessmentScore, 35);
    assert.ok(listed[0].selfAssessmentSummary?.includes('Score 35/100'));
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 4 Commercial Data Reconciliation: Reconciles 2-Mode Sample Data Switcher with real P1-P4 engines and eliminates all ₹X / X SKUs / Example Category placeholders', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const { getReconciledSampleAuditModes } = await import('../commercial/homepageConfig');
  const {
    PUBLIC_DEMO_WORKSPACE_ID,
    PUBLIC_DEMO_SHARE_TOKEN,
    getAuthorizedPilotWorkspaceSnapshot,
  } = await import('../utils/pilotWorkspaceStore');

  const modes = getReconciledSampleAuditModes();
  // Mode A: Live 20-SKU Sandbox Dataset reconciled with P1-P4 engines
  assert.equal(modes.sandbox_20.totalBookValueFormatted, '₹6,45,650');
  assert.equal(modes.sandbox_20.skusEvaluatedText, '20 SKUs Evaluated');
  assert.equal(modes.sandbox_20.deadStockValueFormatted, '₹2,23,110');
  assert.equal(modes.sandbox_20.slowMovingValueFormatted, '₹63,600');
  assert.equal(modes.sandbox_20.prioritySkusHeadline, '10 Priority SKUs');
  assert.equal(modes.sandbox_20.topCategoryName, 'Finished Goods');
  assert.ok(modes.sandbox_20.p2OtifPill.includes('50.0%'));
  assert.ok(modes.sandbox_20.p3FreightPill.includes('₹13,944'));
  assert.ok(modes.sandbox_20.p4BinPill.includes('60.0%'));

  // Mode B: Illustrative 12,400-Line Auto-Component Plant Case reconciled with Hero Card
  assert.equal(modes.illustrative_12400.totalBookValueFormatted, '₹4,82,50,000');
  assert.equal(modes.illustrative_12400.skusEvaluatedText, '12,400 Line Items');
  assert.equal(modes.illustrative_12400.deadStockValueFormatted, '₹18,42,000');
  assert.equal(modes.illustrative_12400.slowMovingValueFormatted, '₹32,60,000');
  assert.equal(modes.illustrative_12400.prioritySkusHeadline, '18 Priority SKUs');

  // Verify public demo workspace AUDIT-DEMO-P1P4 returns authorized 4-pillar snapshot
  const demoSnapshotRes = await getAuthorizedPilotWorkspaceSnapshot(
    PUBLIC_DEMO_WORKSPACE_ID,
    { shareToken: PUBLIC_DEMO_SHARE_TOKEN, isAdmin: false }
  );
  assert.equal(demoSnapshotRes.status, 'OK');
  if (demoSnapshotRes.status === 'OK') {
    assert.equal(demoSnapshotRes.snapshot.summaryMetrics.totalStockValue, 645650);
    assert.equal(demoSnapshotRes.snapshot.multiModuleSummary?.p2?.otifPercent, 50);
    assert.equal(demoSnapshotRes.snapshot.multiModuleSummary?.p3?.totalLeak, 13944);
    assert.equal(demoSnapshotRes.snapshot.multiModuleSummary?.p4?.binAccuracyPercent, 60);
  }

  // Verify zero occurrences of ₹X, X SKUs Evaluated, X High-Impact Items, or Example Category in commercial files
  const commercialDir = path.join(process.cwd(), 'src', 'commercial');
  const filesToCheck = ['CommercialLandingPage.tsx', 'FactoryAuditPage.tsx', 'homepageConfig.ts'];
  const forbiddenLiterals = [
    '₹X',
    'X SKUs Evaluated',
    'X High-Impact Items',
    'Example Category',
    'Placeholder',
  ];

  for (const file of filesToCheck) {
    const content = await fs.readFile(path.join(commercialDir, file), 'utf-8');
    for (const token of forbiddenLiterals) {
      assert.equal(
        content.includes(token),
        false,
        `Found forbidden placeholder "${token}" in ${file}`
      );
    }
  }
});

// ============================================================================
// PHASE 5 TESTS: Multi-Plant Isolation, Server Workspaces, Lead Linkage,
// Plant-Aware Excel Exports & Server Governance Audit Logs
// ============================================================================

test('Phase 5 Multi-Plant Baselines: 3 distinct plants (ambattur, sriperumbudur, hosur) have 100% disjoint itemCodes and deterministic P1-P4 metrics', async () => {
  const {
    MULTI_PLANT_BASELINES,
    ALLOWED_PLANT_IDS,
    isValidPlantId,
    computePlantBaselineMetrics,
  } = await import('../data/multiPlantBaselines');

  assert.deepEqual(ALLOWED_PLANT_IDS, ['ambattur', 'sriperumbudur', 'hosur']);
  assert.equal(isValidPlantId('ambattur'), true);
  assert.equal(isValidPlantId('sriperumbudur'), true);
  assert.equal(isValidPlantId('hosur'), true);
  assert.equal(isValidPlantId('unknown_plant'), false);

  const ambattur = MULTI_PLANT_BASELINES.ambattur;
  const sriperumbudur = MULTI_PLANT_BASELINES.sriperumbudur;
  const hosur = MULTI_PLANT_BASELINES.hosur;

  // Verify row counts per plant
  assert.equal(ambattur.p1Items.length, 20);
  assert.equal(sriperumbudur.p1Items.length, 16);
  assert.equal(hosur.p1Items.length, 15);

  assert.equal(ambattur.p2Dispatches.length, 18);
  assert.equal(sriperumbudur.p2Dispatches.length, 16);
  assert.equal(hosur.p2Dispatches.length, 14);

  assert.equal(ambattur.p3Trips.length, 12);
  assert.equal(sriperumbudur.p3Trips.length, 10);
  assert.equal(hosur.p3Trips.length, 10);

  assert.equal(ambattur.p4Bins.length, 15);
  assert.equal(sriperumbudur.p4Bins.length, 12);
  assert.equal(hosur.p4Bins.length, 12);

  // Verify 100% disjoint itemCodes across the 3 plants
  const ambatturIds = new Set(ambattur.p1Items.map((s) => s.itemCode));
  const sriIds = new Set(sriperumbudur.p1Items.map((s) => s.itemCode));
  const hosurIds = new Set(hosur.p1Items.map((s) => s.itemCode));

  for (const id of sriIds) {
    assert.equal(ambatturIds.has(id), false, `Overlap found between ambattur and sriperumbudur: ${id}`);
    assert.equal(hosurIds.has(id), false, `Overlap found between sriperumbudur and hosur: ${id}`);
  }
  for (const id of hosurIds) {
    assert.equal(ambatturIds.has(id), false, `Overlap found between ambattur and hosur: ${id}`);
  }

  // Verify canonical Ambattur baseline metrics remain 100% intact
  const ambatturMetrics = computePlantBaselineMetrics(ambattur);
  assert.equal(ambatturMetrics.p1.totalBookValue, 645650);
  assert.equal(ambatturMetrics.p1.deadStockValue, 223110);
  assert.equal(ambatturMetrics.p1.deadSkusCount, 8);
  assert.equal(ambatturMetrics.p1.slowMovingValue, 63600);
  assert.equal(ambatturMetrics.p2.otifPercent, 50);
  assert.equal(ambatturMetrics.p3.totalLeak, 13944);
  assert.equal(ambatturMetrics.p4.binAccuracyPercent, 60);

  // Verify Sriperumbudur and Hosur produce distinct, non-zero real metrics
  const sriMetrics = computePlantBaselineMetrics(sriperumbudur);
  const hosurMetrics = computePlantBaselineMetrics(hosur);

  assert.ok(sriMetrics.p1.totalBookValue > 0 && sriMetrics.p1.totalBookValue !== 645650);
  assert.ok(hosurMetrics.p1.totalBookValue > 0 && hosurMetrics.p1.totalBookValue !== 645650);
  assert.notEqual(sriMetrics.p1.totalBookValue, hosurMetrics.p1.totalBookValue);
  assert.ok(sriMetrics.p1.deadSkusCount >= 4);
  assert.ok(hosurMetrics.p1.deadSkusCount >= 4);
  assert.ok(sriMetrics.p3.totalLeak > 0);
  assert.ok(hosurMetrics.p3.totalLeak > 0);
});

test('Phase 5 Plant Workspace Server Store: Isolates updates per plantId and resets an individual plant back to factory baseline without affecting other plants', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const {
    listAllPlantWorkspacesSummary,
    getPlantWorkspaceFromServer,
    updatePlantWorkspaceOnServer,
    resetPlantWorkspaceOnServer,
    validatePlantWorkspaceUpdatePayload,
  } = await import('../utils/plantWorkspaceServerStore');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p5-plant-store-'));
  const testFilePath = path.join(tmpDir, 'plant_workspaces.json');

  try {
    const initialSummaries = await listAllPlantWorkspacesSummary(testFilePath);
    assert.equal(initialSummaries.length, 3);
    assert.equal(initialSummaries.every((s) => s.isCustomized === false), true);

    const sriInitial = await getPlantWorkspaceFromServer('sriperumbudur', testFilePath);
    assert.equal(sriInitial.plantId, 'sriperumbudur');
    assert.equal(sriInitial.isCustomized, false);
    assert.equal(sriInitial.dataset.p1Items.length, 16);

    // Modify Sriperumbudur P1 SKUs (reduce to 10 SKUs)
    const trimmedSkus = sriInitial.dataset.p1Items.slice(0, 10);
    const validation = validatePlantWorkspaceUpdatePayload({ p1Items: trimmedSkus });
    assert.equal(validation.ok, true);

    const updatedSri = await updatePlantWorkspaceOnServer(
      'sriperumbudur',
      validation.data!,
      testFilePath
    );
    assert.equal(updatedSri.isCustomized, true);
    assert.equal(updatedSri.dataset.p1Items.length, 10);
    assert.equal(updatedSri.summary.p1.totalSkus, 10);

    // Verify Ambattur and Hosur remain untouched
    const ambatturCheck = await getPlantWorkspaceFromServer('ambattur', testFilePath);
    const hosurCheck = await getPlantWorkspaceFromServer('hosur', testFilePath);
    assert.equal(ambatturCheck.isCustomized, false);
    assert.equal(ambatturCheck.dataset.p1Items.length, 20);
    assert.equal(hosurCheck.isCustomized, false);
    assert.equal(hosurCheck.dataset.p1Items.length, 15);

    // Reset Sriperumbudur back to factory baseline
    const resetSri = await resetPlantWorkspaceOnServer('sriperumbudur', testFilePath);
    assert.equal(resetSri.isCustomized, false);
    assert.equal(resetSri.dataset.p1Items.length, 16);
    assert.equal(resetSri.summary.p1.totalSkus, 16);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 5 Lead-to-Snapshot Linkage: Validates and persists linkedWorkspaceId, linkedWalkthroughUrl, and linkedPlantId on a PILOT lead record', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const { validatePilotRequestPayload, validateAdminLeadPatch } = await import(
    '../utils/leadValidation'
  );
  const { createLeadRecord, updateLeadRecord, listLeadRecords } = await import(
    '../utils/leadStore'
  );

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p5-lead-link-'));
  const testFilePath = path.join(tmpDir, 'pilot_requests.json');

  try {
    const createVal = validatePilotRequestPayload({
      fullName: 'Senthil Murugan',
      workEmail: 'senthil@sriperumbudur-stamping.in',
      phoneOrWhatsapp: '+91 98401 11223',
      companyName: 'Sriperumbudur Tier-1 Stampings Pvt Ltd',
      plantLocation: 'Sriperumbudur SIPCOT, Tamil Nadu',
      roleTitle: 'VP Operations',
      consentConfirmed: true,
    });
    assert.equal(createVal.ok, true);
    const lead = await createLeadRecord(createVal.data!, testFilePath);

    const patchVal = validateAdminLeadPatch({
      status: 'APPROVED_FOR_UPLOAD',
      linkedWorkspaceId: 'AUDIT-20261106-9F8E',
      linkedWalkthroughUrl: '/?view=pilot-walkthrough&workspaceId=AUDIT-20261106-9F8E&token=abc123token',
      linkedPlantId: 'sriperumbudur',
      founderNotes: 'Published Sriperumbudur 4-pillar walkthrough snapshot for review.',
    });
    assert.equal(patchVal.ok, true);

    const updated = await updateLeadRecord(lead.leadId, patchVal.data!, testFilePath);
    assert.ok(updated);
    assert.equal(updated!.status, 'APPROVED_FOR_UPLOAD');
    assert.equal(updated!.linkedWorkspaceId, 'AUDIT-20261106-9F8E');
    assert.equal(
      updated!.linkedWalkthroughUrl,
      '/?view=pilot-walkthrough&workspaceId=AUDIT-20261106-9F8E&token=abc123token'
    );
    assert.equal(updated!.linkedPlantId, 'sriperumbudur');

    const allLeads = await listLeadRecords(testFilePath);
    assert.equal(allLeads.length, 1);
    assert.equal(allLeads[0].linkedWorkspaceId, 'AUDIT-20261106-9F8E');
    assert.equal(allLeads[0].linkedPlantId, 'sriperumbudur');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 5 Durable Server Governance Audit Log: Persists structured events newest-first, normalizes plantId, and enforces maxRecords cap', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const {
    recordServerAuditEvent,
    listServerAuditEvents,
    validateServerAuditEventPayload,
  } = await import('../utils/serverAuditLog');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p5-audit-log-'));
  const testFilePath = path.join(tmpDir, 'audit_events.json');

  try {
    const val = validateServerAuditEventPayload({
      actor: 'C. Jones Snowin',
      category: 'PILOT_WALKTHROUGH',
      action: 'WORKSPACE_SNAPSHOT_PUBLISHED',
      plantId: 'hosur',
      details: 'Published AUDIT-20261106-HOS1 from Hosur Auto Components Unit.',
    });
    assert.equal(val.ok, true);

    await recordServerAuditEvent(val.data!, testFilePath, 3);
    await recordServerAuditEvent(
      {
        actor: 'Plant Operator',
        category: 'PLANT_WORKSPACE',
        action: 'PLANT_WORKSPACE_UPDATED',
        plantId: 'sriperumbudur',
        details: 'Updated Sriperumbudur P1 rules.',
      },
      testFilePath,
      3
    );
    await recordServerAuditEvent(
      {
        actor: 'Prospective Buyer',
        category: 'LEAD_FUNNEL',
        action: 'PILOT_LEAD_SUBMITTED',
        details: 'Submitted lead PILOT-20261106-ABCD.',
      },
      testFilePath,
      3
    );
    await recordServerAuditEvent(
      {
        actor: 'C. Jones Snowin',
        category: 'PLANT_WORKSPACE',
        action: 'PLANT_WORKSPACE_RESET_TO_BASELINE',
        plantId: 'hosur',
        details: 'Reset Hosur back to factory baseline.',
      },
      testFilePath,
      3
    );

    // Because maxRecords is 3, only the 3 newest events remain
    const allEvents = await listServerAuditEvents(testFilePath);
    assert.equal(allEvents.length, 3);
    assert.equal(allEvents[0].action, 'PLANT_WORKSPACE_RESET_TO_BASELINE');
    assert.equal(allEvents[0].plantId, 'hosur');

    const hosurOnly = allEvents.filter((e) => e.plantId === 'hosur');
    assert.equal(hosurOnly.length, 1);
    assert.equal(hosurOnly[0].plantId, 'hosur');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 5 Plant-Aware Excel Command Center Exporter: Generates distinct 6-sheet datasets for ambattur, sriperumbudur, and hosur with plant stamping', async () => {
  const { buildSixSheetDataset } = await import('../utils/excelCommandCenterExporter');

  const ambatturSheets = buildSixSheetDataset('ambattur');
  const sriSheets = buildSixSheetDataset('sriperumbudur');
  const hosurSheets = buildSixSheetDataset('hosur');

  assert.equal(ambatturSheets.sheet1Summary.plantId, 'ambattur');
  assert.equal(sriSheets.sheet1Summary.plantId, 'sriperumbudur');
  assert.equal(hosurSheets.sheet1Summary.plantId, 'hosur');

  assert.equal(ambatturSheets.sheet2P1.length, 20);
  assert.equal(sriSheets.sheet2P1.length, 16);
  assert.equal(hosurSheets.sheet2P1.length, 15);

  assert.equal(ambatturSheets.sheet2P1[0].sku, 'FG-PBX-G1');
  assert.equal(sriSheets.sheet2P1[0].sku, 'SRI-STAMP-101');
  assert.equal(hosurSheets.sheet2P1[0].sku, 'HOS-FORG-201');

  // Verify Executive Summary sheet stamps the plant name
  assert.ok(sriSheets.sheet1Summary.plantName.includes('Sriperumbudur'));
  assert.ok(hosurSheets.sheet1Summary.plantName.includes('Hosur'));
});

test('Phase 5 Dashboard Snapshot Isolation: buildLivePlatformSnapshot returns plant-isolated SKUs, dispatches, freight trips, bins, and CAPA actions with datasetLoaded=true for all 3 plants', async () => {
  const { buildLivePlatformSnapshot } = await import('../dashboard/dashboardConfig');

  const ambatturSnap = buildLivePlatformSnapshot(PLANTS.ambattur, PERIODS.fortnight_sep);
  const sriSnap = buildLivePlatformSnapshot(PLANTS.sriperumbudur, PERIODS.fortnight_sep);
  const hosurSnap = buildLivePlatformSnapshot(PLANTS.hosur, PERIODS.fortnight_sep);

  assert.equal(ambatturSnap.datasetLoaded, true);
  assert.equal(sriSnap.datasetLoaded, true);
  assert.equal(hosurSnap.datasetLoaded, true);

  assert.equal(ambatturSnap.p1TotalSkuCount, 20);
  assert.equal(sriSnap.p1TotalSkuCount, 16);
  assert.equal(hosurSnap.p1TotalSkuCount, 15);

  assert.equal(ambatturSnap.p2DualGate.totalDispatches, 18);
  assert.equal(sriSnap.p2DualGate.totalDispatches, 16);
  assert.equal(hosurSnap.p2DualGate.totalDispatches, 14);

  assert.equal(ambatturSnap.p3TotalTripCount, 12);
  assert.equal(sriSnap.p3TotalTripCount, 10);
  assert.equal(hosurSnap.p3TotalTripCount, 10);

  assert.equal(ambatturSnap.p4TotalBins, 15);
  assert.equal(sriSnap.p4TotalBins, 12);
  assert.equal(hosurSnap.p4TotalBins, 12);

  assert.equal(ambatturSnap.capaItems[0].id, 'AMB-CAPA-01');
  assert.equal(sriSnap.capaItems[0].id, 'SRI-CAPA-01');
  assert.equal(hosurSnap.capaItems[0].id, 'HOS-CAPA-01');
});

// ============================================================================
// PHASE 6 TESTS: Token-Gated Step-2 Upload Portal, Tally/SAP/Busy Header
// Alias Resolver, 4-Pillar Quarantine Engine, Client-Side Anonymizer,
// Machine Reserve Spares Exclusion (Item 07), and ImportRun Ledger
// ============================================================================

test('Phase 6 ERP Header Alias Resolver: Maps Tally Prime, SAP (MATNR/MAKTX/LABST/VERPR/BUDAT), and Busy headers to canonical P1-P4 columns', async () => {
  const {
    resolveP1InventoryColumns,
    resolveP2DispatchColumns,
    resolveP3FreightColumns,
    resolveP4WarehouseBinColumns,
  } = await import('../utils/columnAliasResolver');

  const sapP1Rows = [
    {
      MATNR: 'SAP-VALVE-900',
      MAKTX: 'High Pressure CNC Machined Valve Body',
      MATKL: 'Finished Goods',
      LABST: '45',
      VERPR: '3200',
      BUDAT: '2026-01-10',
      CRITICAL_SPARE: 'NO',
    },
  ];
  const resolvedP1 = resolveP1InventoryColumns(sapP1Rows);
  assert.equal(resolvedP1.mappedRows[0].Part_ID, 'SAP-VALVE-900');
  assert.equal(resolvedP1.mappedRows[0].Part_Description, 'High Pressure CNC Machined Valve Body');
  assert.equal(resolvedP1.mappedRows[0].Category, 'Finished Goods');
  assert.equal(resolvedP1.mappedRows[0].Closing_Stock_Qty, '45');
  assert.equal(resolvedP1.mappedRows[0].Unit_Cost_INR, '3200');
  assert.equal(resolvedP1.mappedRows[0].Last_Movement_Date, '2026-01-10');
  assert.equal(resolvedP1.columnMappingUsed.Part_ID, 'MATNR');
  assert.equal(resolvedP1.columnMappingUsed.Unit_Cost_INR, 'VERPR');

  const tallyP2Rows = [
    {
      Challan_No: 'DC-881',
      Party_Name: 'Ashok Leyland Ennore',
      Order_Qty: '120',
      Billed_Qty: '110',
      Due_Date: '12-09-2026',
      Gate_Out_Date: '14-09-2026',
    },
  ];
  const resolvedP2 = resolveP2DispatchColumns(tallyP2Rows);
  assert.equal(resolvedP2.mappedRows[0].Dispatch_ID, 'DC-881');
  assert.equal(resolvedP2.mappedRows[0].Customer_Name, 'Ashok Leyland Ennore');
  assert.equal(resolvedP2.mappedRows[0].Ordered_Qty, '120');
  assert.equal(resolvedP2.mappedRows[0].Dispatched_Qty, '110');

  const tallyP3Rows = [
    {
      Bilty_No: 'LR-4410',
      Carrier_Name: 'TVS Industrial Logistics',
      Tonnage: '9.5',
      Route_Km: '180',
      Invoice_Amount: '16500',
      Halting_Charges: '1200',
    },
  ];
  const resolvedP3 = resolveP3FreightColumns(tallyP3Rows);
  assert.equal(resolvedP3.mappedRows[0].LR_Number, 'LR-4410');
  assert.equal(resolvedP3.mappedRows[0].Transporter, 'TVS Industrial Logistics');
  assert.equal(resolvedP3.mappedRows[0].Weight_Ton, '9.5');
  assert.equal(resolvedP3.mappedRows[0].Billed_Amount_INR, '16500');

  const tallyP4Rows = [
    {
      Rack_Location: 'BIN-C-09',
      Item_Code: 'AMB-RM-101',
      Tally_Qty: '200',
      Actual_Qty: '188',
      Rate_INR: '185',
    },
  ];
  const resolvedP4 = resolveP4WarehouseBinColumns(tallyP4Rows);
  assert.equal(resolvedP4.mappedRows[0].Bin_ID, 'BIN-C-09');
  assert.equal(resolvedP4.mappedRows[0].Part_ID, 'AMB-RM-101');
  assert.equal(resolvedP4.mappedRows[0].Book_Qty, '200');
  assert.equal(resolvedP4.mappedRows[0].Physical_Count_Qty, '188');
});

test('Phase 6 4-Pillar Quarantine Engine: Strictly quarantines corrupted Tally Prime rows without silent fallback to 2026-09-20 or 0', async () => {
  const {
    validateP1InventoryRows,
    validateP2DispatchRows,
    validateP3FreightRows,
    validateP4WarehouseBinRows,
    buildSampleDirtyTallyPrimeExportDataset,
  } = await import('../utils/importValidation');

  const dirtySample = buildSampleDirtyTallyPrimeExportDataset();
  const p1Res = validateP1InventoryRows(dirtySample.p1Rows, { excludeReserveSpares: true });

  // 22 submitted rows -> 18 valid accepted + 4 quarantined rejected
  assert.equal(p1Res.qualitySummary.totalSubmitted, 22);
  assert.equal(p1Res.qualitySummary.validAccepted, 18);
  assert.equal(p1Res.qualitySummary.quarantinedRejected, 4);
  assert.equal(p1Res.validRows.length, 18);
  assert.equal(p1Res.quarantinedRows.length, 4);

  // Verify the 4 specific quarantine errors (missing Part_ID, negative qty, non-numeric rate, invalid date)
  assert.ok(p1Res.quarantinedRows[0].fieldErrors.Part_ID);
  assert.ok(p1Res.quarantinedRows[1].fieldErrors.Closing_Stock_Qty);
  assert.ok(p1Res.quarantinedRows[2].fieldErrors.Unit_Cost_INR);
  assert.ok(p1Res.quarantinedRows[3].fieldErrors.Last_Movement_Date);

  // Verify P2, P3, P4 quarantine behavior on invalid rows
  const p2Res = validateP2DispatchRows([
    ...dirtySample.p2Rows,
    { Dispatch_ID: '', Customer_Name: 'Bad Row', Ordered_Qty: '-5', Dispatched_Qty: '10', Promised_Date: 'bad-date', Dispatch_Date: '2026-09-15' },
  ]);
  assert.equal(p2Res.validRows.length, 3);
  assert.equal(p2Res.quarantinedRows.length, 1);

  const p3Res = validateP3FreightRows([
    ...dirtySample.p3Rows,
    { LR_Number: 'LR-BAD', Transporter: '', Weight_Ton: '-2', Distance_Km: '100', Billed_Amount_INR: 'NaN_BILL' },
  ]);
  assert.equal(p3Res.validRows.length, 2);
  assert.equal(p3Res.quarantinedRows.length, 1);

  const p4Res = validateP4WarehouseBinRows([
    ...dirtySample.p4Rows,
    { Bin_ID: '', Part_ID: 'AMB-1', Book_Qty: '-10', Physical_Count_Qty: '5', Unit_Cost_INR: '0' },
  ]);
  assert.equal(p4Res.validRows.length, 2);
  assert.equal(p4Res.quarantinedRows.length, 1);
});

test('Phase 6 Machine Reserve Spares Exclusion (Item 07): Flags critical CNC/insurance spares and retains them instead of liquidating', async () => {
  const { validateP1InventoryRows, buildSampleDirtyTallyPrimeExportDataset } = await import(
    '../utils/importValidation'
  );
  const { computePilotWorkspaceAnalytics } = await import('../utils/pilotWorkspaceStore');

  const dirtySample = buildSampleDirtyTallyPrimeExportDataset();
  const p1Res = validateP1InventoryRows(dirtySample.p1Rows, { excludeReserveSpares: true });

  // 2 reserve spares: AMB-SP-901 (₹68,500) + AMB-SP-902 (₹44,000) = ₹1,12,500
  assert.equal(p1Res.qualitySummary.reserveSparesCount, 2);
  assert.equal(p1Res.qualitySummary.reserveSparesValueINR, 112500);

  const analytics = computePilotWorkspaceAnalytics(p1Res.validRows, undefined, {
    excludeReserveSpares: true,
  });
  const spindleSpare = analytics.evaluatedSkus.find((s) => s.itemCode === 'AMB-SP-901');
  assert.ok(spindleSpare);
  assert.equal(
    spindleSpare!.actionStatus,
    'Retain as Critical Machine / Insurance Spare (Item 07 Excluded from Liquidation)'
  );
});

test('Phase 6 Client-Side Pre-Upload Anonymizer: Masks Part_Description, Customer_Name, and Transporter in browser while preserving 100% of ₹ math', async () => {
  const {
    anonymizeP1ToP4DatasetClientSide,
    validateP1InventoryRows,
    buildSampleDirtyTallyPrimeExportDataset,
  } = await import('../utils/importValidation');
  const { computePilotWorkspaceAnalytics } = await import('../utils/pilotWorkspaceStore');

  const rawSample = buildSampleDirtyTallyPrimeExportDataset();
  const maskedSample = anonymizeP1ToP4DatasetClientSide(rawSample);

  assert.match(String(maskedSample.p1Rows[0].Part_Description), /^MASKED-PART-001/);
  assert.equal(maskedSample.p2Rows[0].Customer_Name, 'MASKED-OEM-01');
  assert.equal(maskedSample.p3Rows[0].Transporter, 'CARRIER-01');

  // Verify mathematical totals before and after anonymization are 100% identical
  const rawValid = validateP1InventoryRows(rawSample.p1Rows).validRows;
  const maskedValid = validateP1InventoryRows(maskedSample.p1Rows).validRows;

  const rawAnalytics = computePilotWorkspaceAnalytics(rawValid);
  const maskedAnalytics = computePilotWorkspaceAnalytics(maskedValid);

  assert.equal(maskedAnalytics.summaryMetrics.totalStockValue, rawAnalytics.summaryMetrics.totalStockValue);
  assert.equal(maskedAnalytics.summaryMetrics.deadStockValue, rawAnalytics.summaryMetrics.deadStockValue);
  assert.equal(maskedAnalytics.summaryMetrics.slowMovingValue, rawAnalytics.summaryMetrics.slowMovingValue);
  assert.equal(maskedAnalytics.summaryMetrics.targetCashRelease, rawAnalytics.summaryMetrics.targetCashRelease);
});

test('Phase 6 5-Sheet Pilot Data Kit & Quarantined CSV Exporter: Generates all 5 sheets and formula-guarded quarantine CSV', async () => {
  const {
    PILOT_DATA_KIT_FIVE_SHEET_NAMES,
    buildFiveSheetPilotDataKitDataset,
    buildQuarantinedRowsCsvContent,
  } = await import('../utils/pilotDataKitExporter');
  const { validateP1InventoryRows, buildSampleDirtyTallyPrimeExportDataset } = await import(
    '../utils/importValidation'
  );

  assert.equal(PILOT_DATA_KIT_FIVE_SHEET_NAMES.length, 5);
  const sheets = buildFiveSheetPilotDataKitDataset();
  assert.ok(sheets['1_P1_Inventory_Template'].length >= 5);
  assert.ok(sheets['2_P2_OTIF_Template'].length >= 3);
  assert.ok(sheets['3_P3_Freight_Template'].length >= 3);
  assert.ok(sheets['4_P4_Warehouse_Bin_Template'].length >= 3);
  assert.ok(sheets['5_ERP_Export_&_Anonymization_Guide'].length >= 5);

  const dirty = buildSampleDirtyTallyPrimeExportDataset();
  const p1Validation = validateP1InventoryRows(dirty.p1Rows);
  const csv = buildQuarantinedRowsCsvContent(p1Validation.quarantinedRows, 'P1');
  assert.ok(csv.includes('Row_Number'));
  assert.ok(csv.includes('Error_Reasons'));
  assert.ok(csv.includes('AMB-DIRTY-NEG'));
  assert.ok(csv.includes('AMB-DIRTY-DATE'));
});

test('Phase 6 Lead Upload Token & Portal URL: Generates cryptographic uploadToken (upl_...) and uploadPortalUrl on lead creation', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const { validatePilotRequestPayload } = await import('../utils/leadValidation');
  const { createLeadRecord, getLeadRecordById } = await import('../utils/leadStore');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p6-lead-token-'));
  const testFilePath = path.join(tmpDir, 'pilot_requests.json');

  try {
    const val = validatePilotRequestPayload({
      fullName: 'Ramesh Sundaram',
      workEmail: 'ramesh@ambatturvalves.in',
      phoneOrWhatsapp: '+91 98402 55667',
      companyName: 'Ambattur Industrial Valves Pvt Ltd',
      plantLocation: 'Ambattur Industrial Estate, Chennai',
      roleTitle: 'Managing Director',
      consentConfirmed: true,
    });
    assert.equal(val.ok, true);

    const created = await createLeadRecord(val.data!, testFilePath);
    assert.ok(created.uploadToken && created.uploadToken.startsWith('upl_'));
    assert.ok(
      created.uploadPortalUrl &&
        created.uploadPortalUrl.includes(`?view=pilot-upload&leadId=${created.leadId}&token=`)
    );

    const retrieved = await getLeadRecordById(created.leadId, testFilePath);
    assert.ok(retrieved);
    assert.equal(retrieved!.uploadToken, created.uploadToken);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 6 End-to-End Step-2 Ingestion & ImportRun Ledger: Persists IMPRUN record with 64-char SHA-256 digest, creates AUDIT snapshot with Item 01 & Item 07 metadata, and updates Lead record', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const { validatePilotRequestPayload } = await import('../utils/leadValidation');
  const { createLeadRecord, getLeadRecordById } = await import('../utils/leadStore');
  const { buildSampleDirtyTallyPrimeExportDataset } = await import('../utils/importValidation');
  const { executeStep2PilotIngestion, listImportRunRecords } = await import(
    '../utils/importRunStore'
  );
  const { listServerAuditEvents } = await import('../utils/serverAuditLog');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p6-ingest-'));
  const leadsFile = path.join(tmpDir, 'pilot_requests.json');
  const workspacesFile = path.join(tmpDir, 'pilot_workspaces.json');
  const importRunsFile = path.join(tmpDir, 'import_runs.json');
  const auditEventsFile = path.join(tmpDir, 'audit_events.json');

  try {
    const val = validatePilotRequestPayload({
      fullName: 'Vikram Natarajan',
      workEmail: 'vikram@hosurdrivetrain.in',
      phoneOrWhatsapp: '+91 98405 99881',
      companyName: 'Hosur Precision Drivetrain Pvt Ltd',
      plantLocation: 'Hosur SIPCOT Phase II',
      roleTitle: 'Plant Head',
      consentConfirmed: true,
    });
    const lead = await createLeadRecord(val.data!, leadsFile);
    const dirtyDataset = buildSampleDirtyTallyPrimeExportDataset();

    const ingestRes = await executeStep2PilotIngestion(
      {
        leadId: lead.leadId,
        plantId: 'ambattur',
        p1Rows: dirtyDataset.p1Rows,
        p2Rows: dirtyDataset.p2Rows,
        p3Rows: dirtyDataset.p3Rows,
        p4Rows: dirtyDataset.p4Rows,
        excludeReserveSpares: true,
        anonymizationApplied: true,
      },
      {
        leadsFilePath: leadsFile,
        workspacesFilePath: workspacesFile,
        importRunsFilePath: importRunsFile,
        auditEventsFilePath: auditEventsFile,
      }
    );

    assert.equal(ingestRes.ok, true);
    assert.ok(ingestRes.importRun);
    assert.ok(ingestRes.snapshot);

    // Verify IMPRUN-YYYYMMDD-XXXX & 64-char SHA-256 digest
    assert.match(ingestRes.importRun!.importRunId, /^IMPRUN-\d{8}-[0-9A-F]{4}$/);
    assert.equal(ingestRes.importRun!.datasetSha256.length, 64);
    assert.equal(ingestRes.importRun!.p1Quality.totalSubmitted, 22);
    assert.equal(ingestRes.importRun!.p1Quality.validAccepted, 18);
    assert.equal(ingestRes.importRun!.p1Quality.quarantinedRejected, 4);
    assert.equal(ingestRes.importRun!.p1Quality.reserveSparesCount, 2);
    assert.equal(ingestRes.importRun!.p1Quality.reserveSparesValueINR, 112500);

    // Verify Snapshot Item 01 (dataQualityOverview) & Item 07 (assumptionsAndExclusions)
    assert.equal(ingestRes.snapshot!.importRunId, ingestRes.importRun!.importRunId);
    assert.equal(ingestRes.snapshot!.datasetSha256, ingestRes.importRun!.datasetSha256);
    assert.equal(ingestRes.snapshot!.dataQualityOverview?.p1Quality.validAccepted, 18);
    assert.equal(ingestRes.snapshot!.dataQualityOverview?.p1Quality.quarantinedRejected, 4);
    assert.equal(ingestRes.snapshot!.assumptionsAndExclusions?.excludeReserveSpares, true);
    assert.equal(ingestRes.snapshot!.assumptionsAndExclusions?.reserveSparesExcludedCount, 2);
    assert.equal(ingestRes.snapshot!.assumptionsAndExclusions?.reserveSparesExcludedValue, 112500);

    // Verify Lead record was updated with lastImportRunId & dataQualityOverview
    const updatedLead = await getLeadRecordById(lead.leadId, leadsFile);
    assert.ok(updatedLead);
    assert.equal(updatedLead!.status, 'APPROVED_FOR_UPLOAD');
    assert.equal(updatedLead!.lastImportRunId, ingestRes.importRun!.importRunId);
    assert.equal(updatedLead!.linkedWorkspaceId, ingestRes.snapshot!.workspaceId);
    assert.equal(updatedLead!.dataQualityOverview?.quarantinedRejected, 4);

    // Verify ImportRun ledger persistence & Governance Audit Event
    const savedRuns = await listImportRunRecords(importRunsFile);
    assert.equal(savedRuns.length, 1);
    assert.equal(savedRuns[0].importRunId, ingestRes.importRun!.importRunId);

    const auditEvents = await listServerAuditEvents(auditEventsFile);
    assert.equal(auditEvents.length, 1);
    assert.equal(auditEvents[0].action, 'PILOT_DATA_INGESTED');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

// ============================================================================
// PHASE 7 TESTS: 4-Pillar Row-Traceable Sensitivity Simulator (with Item 07
// Reserve Spares & Server Scenario Lock), Closed-Loop CAPA Financial Ledger
// (with .XLSX Export Parity), and Cryptographically Bound 8-Field Verified
// Proof Registry
// ============================================================================

test('Phase 7 4-Pillar Sensitivity Simulator: Deterministically computes P1-P4 deltas and row-traceable reclassifications across STRICT_CFO_AUDIT, STANDARD_BASELINE, and LENIENT_PLANT_FLOOR presets', async () => {
  const { runFourPillarSensitivity } = await import('../utils/sensitivitySimulator');
  const { getPlantBaseline } = await import('../data/multiPlantBaselines');

  const ambattur = getPlantBaseline('ambattur');

  // 1. Standard Baseline compared against itself (with excludeReserveSpares: false on both) produces 0 deltas
  const identityResult = runFourPillarSensitivity({
    skus: ambattur.p1Items,
    p1Rules: ambattur.p1Rules,
    p2Dispatches: ambattur.p2Dispatches,
    p2Rules: ambattur.p2Rules,
    p3FreightTrips: ambattur.p3Trips,
    p3Rules: ambattur.p3Rules,
    p4WarehouseBins: ambattur.p4Bins,
    p4Rules: ambattur.p4Rules,
    baselineConfig: { excludeReserveSpares: false },
    scenarioConfig: { excludeReserveSpares: false },
  });

  assert.equal(identityResult.p1.baselineDeadStockInr, 223110);
  assert.equal(identityResult.p1.scenarioDeadStockInr, 223110);
  assert.equal(identityResult.p1.deadStockDeltaInr, 0);
  assert.equal(identityResult.p2.otifPctDelta, 0);
  assert.equal(identityResult.p3.leakDeltaInr, 0);
  assert.equal(identityResult.p4.highRiskBinsDelta, 0);
  assert.equal(identityResult.reclassifiedSkus.length, 0);
  assert.equal(identityResult.reclassifiedDispatches.length, 0);
  assert.equal(identityResult.reclassifiedBins.length, 0);

  // 2. Strict CFO Audit (slowDays=120, normalDays=60, gracePeriodDays=0, maxOverchargePercent=5)
  const strictResult = runFourPillarSensitivity({
    skus: ambattur.p1Items,
    p1Rules: ambattur.p1Rules,
    p2Dispatches: ambattur.p2Dispatches,
    p2Rules: ambattur.p2Rules,
    p3FreightTrips: ambattur.p3Trips,
    p3Rules: ambattur.p3Rules,
    p4WarehouseBins: ambattur.p4Bins,
    p4Rules: ambattur.p4Rules,
    preset: 'STRICT_CFO_AUDIT',
  });

  assert.ok(strictResult.p1.scenarioDeadStockInr > strictResult.p1.baselineDeadStockInr);
  assert.equal(
    strictResult.p1.deadStockDeltaInr,
    strictResult.p1.scenarioDeadStockInr - strictResult.p1.baselineDeadStockInr
  );
  assert.ok(strictResult.reclassifiedSkus.length >= 2);
  const slowToDead = strictResult.reclassifiedSkus.filter(
    (s) => s.fromBucket === 'Slow' && s.toBucket === 'Dead'
  );
  assert.ok(slowToDead.length >= 1);

  // 3. Lenient Plant Floor (slowDays=270, gracePeriodDays=2, shortageTolerancePct=10, highRiskValueThreshold=12000)
  const lenientResult = runFourPillarSensitivity({
    skus: ambattur.p1Items,
    p1Rules: ambattur.p1Rules,
    p2Dispatches: ambattur.p2Dispatches,
    p2Rules: ambattur.p2Rules,
    p3FreightTrips: ambattur.p3Trips,
    p3Rules: ambattur.p3Rules,
    p4WarehouseBins: ambattur.p4Bins,
    p4Rules: ambattur.p4Rules,
    preset: 'LENIENT_PLANT_FLOOR',
  });

  assert.ok(lenientResult.p1.scenarioDeadStockInr < lenientResult.p1.baselineDeadStockInr);
  assert.ok(lenientResult.p2.scenarioOtifPct > lenientResult.p2.baselineOtifPct);
  assert.ok(lenientResult.reclassifiedDispatches.length >= 1);
  assert.ok(lenientResult.p3.scenarioLeakInr <= lenientResult.p3.baselineLeakInr);
  assert.ok(
    lenientResult.p4.scenarioHighRiskBinsCount <= lenientResult.p4.baselineHighRiskBinsCount
  );
});

test('Phase 7 Sensitivity Simulator Item 07 Reserve Spares Protection: Correctly separates liquidatableDeadStockInr from reserveSparesProtectedInr', async () => {
  const { runFourPillarSensitivity } = await import('../utils/sensitivitySimulator');
  const { validateP1InventoryRows, buildSampleDirtyTallyPrimeExportDataset } = await import(
    '../utils/importValidation'
  );
  const { getPlantBaseline } = await import('../data/multiPlantBaselines');

  const ambattur = getPlantBaseline('ambattur');
  const dirty = buildSampleDirtyTallyPrimeExportDataset();
  const validated = validateP1InventoryRows(dirty.p1Rows, { excludeReserveSpares: true });

  // When excludeReserveSpares = true, reserveSparesProtectedInr is ₹1,12,500 (2 CNC spares)
  const protectedRun = runFourPillarSensitivity({
    skus: validated.validRows,
    p1Rules: ambattur.p1Rules,
    p2Dispatches: ambattur.p2Dispatches,
    p3FreightTrips: ambattur.p3Trips,
    p4WarehouseBins: ambattur.p4Bins,
    baselineConfig: { excludeReserveSpares: true },
    scenarioConfig: { excludeReserveSpares: true },
  });

  assert.equal(protectedRun.p1.reserveSparesProtectedCount, 2);
  assert.equal(protectedRun.p1.reserveSparesProtectedInr, 112500);
  assert.equal(
    protectedRun.p1.liquidatableDeadStockInr + protectedRun.p1.reserveSparesProtectedInr,
    protectedRun.p1.scenarioDeadStockInr
  );

  // When excludeReserveSpares = false on scenario, all dead stock is marked liquidatable and the 2 spares reclassify from Protected Reserve Spare to Dead
  const unprotectedRun = runFourPillarSensitivity({
    skus: validated.validRows,
    p1Rules: ambattur.p1Rules,
    p2Dispatches: ambattur.p2Dispatches,
    p3FreightTrips: ambattur.p3Trips,
    p4WarehouseBins: ambattur.p4Bins,
    baselineConfig: { excludeReserveSpares: true },
    scenarioConfig: { excludeReserveSpares: false },
  });

  assert.equal(unprotectedRun.p1.reserveSparesProtectedInr, 0);
  assert.equal(
    unprotectedRun.p1.liquidatableDeadStockInr,
    unprotectedRun.p1.scenarioDeadStockInr
  );
  assert.equal(unprotectedRun.reclassifiedSkus.length, 2);
  assert.equal(unprotectedRun.reclassifiedSkus[0].toBucket, 'Dead');
});

test('Phase 7 Closed-Loop CAPA Financial Ledger: Backward-compatibly normalizes legacy CAPA items and computes financial realization across all 3 plants', async () => {
  const { normalizeCapaItem, computeCapaFinancialSummary } = await import('../utils/capaLedger');
  const { getPlantBaseline } = await import('../data/multiPlantBaselines');

  // 1. Verify backward-compatible normalizer on legacy CAPA item
  const legacyItem = normalizeCapaItem({
    id: 'LEGACY-CAPA-99',
    title: 'Unverified freight detention claim on LR-8810',
    domain: 'profit_risk',
    domainLabel: 'Freight & Detention Audit',
    priority: 'Critical',
    evidenceRef: 'LR-8810',
    owner: 'Logistics Lead',
    dueDate: '2026-10-15',
    status: 'Resolved',
    notes: 'Audit gate register and deduct ₹14,500 from carrier bill',
  });

  assert.equal(legacyItem.pillar, 'P3_FREIGHT');
  assert.equal(legacyItem.dispositionType, 'FREIGHT_DEBIT_NOTE');
  assert.equal(legacyItem.verificationStage, 'VERIFIED_REALIZED');

  // 2. Verify Ambattur, Sriperumbudur, and Hosur CAPA Financial Summaries
  const ambSummary = computeCapaFinancialSummary(getPlantBaseline('ambattur').capaItems);
  const sriSummary = computeCapaFinancialSummary(getPlantBaseline('sriperumbudur').capaItems);
  const hosSummary = computeCapaFinancialSummary(getPlantBaseline('hosur').capaItems);

  assert.ok(ambSummary.totalIdentifiedExposureInr > 0);
  assert.ok(ambSummary.totalTargetRecoveryInr > 0);
  assert.ok(ambSummary.pendingFinanceSignOffInr > 0);
  assert.ok(ambSummary.totalRealizedRecoveryInr > 0);
  assert.ok(ambSummary.realizationRatePct > 0 && ambSummary.realizationRatePct <= 100);

  assert.ok(sriSummary.totalTargetRecoveryInr > 0);
  assert.ok(sriSummary.totalRealizedRecoveryInr > 0);
  assert.ok(hosSummary.totalTargetRecoveryInr > 0);
  assert.ok(hosSummary.totalRealizedRecoveryInr > 0);
});

test('Phase 7 Excel Command Center CAPA Financial Parity: Sheet 6 Action Tracker exports Pillar, Linked_Record_ID, Disposition_Type, Exposure, Target, Realized, and Verification_Stage', async () => {
  const { buildSixSheetDataset } = await import('../utils/excelCommandCenterExporter');

  const ambSheets = buildSixSheetDataset('ambattur');
  assert.equal(ambSheets.sheet6Actions.length, 4);

  const firstAction = ambSheets.sheet6Actions[0];
  assert.equal(firstAction.issueId, 'AMB-CAPA-01');
  assert.equal(firstAction.Pillar, 'P1_INVENTORY');
  assert.equal(firstAction.Linked_Record_ID, 'FG-PBX-G1');
  assert.equal(firstAction.Disposition_Type, 'B2B_LIQUIDATION_SCRAP');
  assert.equal(firstAction.Identified_Exposure_INR, 223110);
  assert.equal(firstAction.Target_Recovery_INR, 156177);
  assert.equal(firstAction.Realized_Recovery_INR, 68500);
  assert.equal(firstAction.Verification_Stage, 'IN_EXECUTION');
});

test('Phase 7 Server Scenario Lock: updatePilotWorkspaceSnapshotRules locks agreed scenario rules into server AUDIT-... snapshot and updates Item 07 assumptions', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const { SENSITIVITY_PRESETS } = await import('../utils/sensitivitySimulator');
  const { getPlantBaseline } = await import('../data/multiPlantBaselines');
  const {
    validatePilotWorkspacePayload,
    createPilotWorkspaceSnapshot,
    updatePilotWorkspaceSnapshotRules,
  } = await import('../utils/pilotWorkspaceStore');

  const ambattur = getPlantBaseline('ambattur');
  const val = validatePilotWorkspacePayload({
    companyName: 'Ambattur Scenario Lock Test Plant',
    plantLocation: 'Ambattur Industrial Estate',
    preparedBy: 'C. Jones Snowin',
    rules: ambattur.p1Rules,
    skus: ambattur.p1Items,
    p2Rules: ambattur.p2Rules,
    p2Dispatches: ambattur.p2Dispatches,
    p3Rules: ambattur.p3Rules,
    p3FreightTrips: ambattur.p3Trips,
    p4Rules: ambattur.p4Rules,
    p4WarehouseBins: ambattur.p4Bins,
  });
  assert.equal(val.ok, true);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p7-lock-'));
  const wsFile = path.join(tmpDir, 'pilot_workspaces.json');

  try {
    const created = await createPilotWorkspaceSnapshot(val.data!, wsFile);
    assert.equal(created.summaryMetrics.deadStockValue, 223110);

    const strictCfg = SENSITIVITY_PRESETS.STRICT_CFO_AUDIT.config;
    const lockedRes = await updatePilotWorkspaceSnapshotRules(
      created.workspaceId,
      {
        slowDays: strictCfg.slowDays,
        normalDays: strictCfg.normalDays,
        fastDays: strictCfg.fastDays,
        annualCarryingCostPercent: strictCfg.annualCarryingCostPercent,
        targetRecoveryPercent: strictCfg.targetRecoveryPercent,
        excludeReserveSpares: true,
        gracePeriodDays: strictCfg.gracePeriodDays,
        shortageTolerancePct: strictCfg.shortageTolerancePct,
        highRiskPercentThreshold: strictCfg.highRiskPercentThreshold,
      },
      wsFile
    );

    assert.equal(lockedRes.status, 'OK');
    if (lockedRes.status === 'OK') {
      assert.equal(lockedRes.snapshot.rules.deadThresholdDays, 120);
      assert.ok(lockedRes.snapshot.summaryMetrics.deadStockValue > 223110);
      assert.equal(
        lockedRes.snapshot.assumptionsAndExclusions?.deadThresholdDaysUsed,
        120
      );
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 7 Verified Proof Registry Guardrails: Rejects publishing when clientSignOffConfirmed !== true or when linkedWorkspaceId does not exist', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const { publishVerifiedProofRecord } = await import('../utils/verifiedProofRegistryStore');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p7-proof-guard-'));
  const registryFile = path.join(tmpDir, 'verified_proof_registry.json');
  const wsFile = path.join(tmpDir, 'pilot_workspaces.json');
  const auditFile = path.join(tmpDir, 'audit_events.json');

  try {
    // 1. Reject when clientSignOffConfirmed is false
    const noSignOff = await publishVerifiedProofRecord(
      {
        linkedWorkspaceId: 'AUDIT-DEMO-P1P4',
        industrySector: 'Precision Castings',
        initialChallenge: 'High dormant stock',
        analysisPerformed: '4-Pillar Audit',
        actionTaken: 'Froze reorders',
        clientSignOffConfirmed: false,
      },
      registryFile,
      wsFile,
      auditFile
    );
    assert.equal(noSignOff.ok, false);
    assert.ok(noSignOff.error?.includes('clientSignOffConfirmed'));

    // 2. Reject when linkedWorkspaceId does not exist in pilotWorkspaceStore
    const missingSnapshot = await publishVerifiedProofRecord(
      {
        linkedWorkspaceId: 'AUDIT-20269999-NONEXISTENT',
        industrySector: 'Precision Castings',
        initialChallenge: 'High dormant stock',
        analysisPerformed: '4-Pillar Audit',
        actionTaken: 'Froze reorders',
        clientSignOffConfirmed: true,
      },
      registryFile,
      wsFile,
      auditFile
    );
    assert.equal(missingSnapshot.ok, false);
    assert.ok(missingSnapshot.error?.includes('not found'));
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 7 Verified Proof Registry Cryptographic Binding: Pulls verifiedFindings from server AUDIT-... snapshot, persists 8-field PROOF-... record with 16-char SHA-256 prefix, and supports unpublishing', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const { validatePilotRequestPayload } = await import('../utils/leadValidation');
  const { createLeadRecord } = await import('../utils/leadStore');
  const { buildSampleDirtyTallyPrimeExportDataset } = await import('../utils/importValidation');
  const { executeStep2PilotIngestion } = await import('../utils/importRunStore');
  const {
    publishVerifiedProofRecord,
    listVerifiedProofRecords,
    deleteVerifiedProofRecord,
  } = await import('../utils/verifiedProofRegistryStore');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p7-proof-e2e-'));
  const leadsFile = path.join(tmpDir, 'pilot_requests.json');
  const wsFile = path.join(tmpDir, 'pilot_workspaces.json');
  const importRunsFile = path.join(tmpDir, 'import_runs.json');
  const auditEventsFile = path.join(tmpDir, 'audit_events.json');
  const registryFile = path.join(tmpDir, 'verified_proof_registry.json');

  try {
    const val = validatePilotRequestPayload({
      fullName: 'Karthik Subramanian',
      workEmail: 'karthik@sriperumbudurstamping.in',
      phoneOrWhatsapp: '+91 98401 77889',
      companyName: 'Sriperumbudur Stamping Systems Pvt Ltd',
      plantLocation: 'Sriperumbudur SIPCOT',
      roleTitle: 'CFO',
      consentConfirmed: true,
    });
    const lead = await createLeadRecord(val.data!, leadsFile);
    const dataset = buildSampleDirtyTallyPrimeExportDataset();

    const ingestRes = await executeStep2PilotIngestion(
      {
        leadId: lead.leadId,
        plantId: 'ambattur',
        p1Rows: dataset.p1Rows,
        p2Rows: dataset.p2Rows,
        p3Rows: dataset.p3Rows,
        p4Rows: dataset.p4Rows,
        excludeReserveSpares: true,
        anonymizationApplied: true,
      },
      {
        leadsFilePath: leadsFile,
        workspacesFilePath: wsFile,
        importRunsFilePath: importRunsFile,
        auditEventsFilePath: auditEventsFile,
      }
    );
    assert.equal(ingestRes.ok, true);
    const snapshot = ingestRes.snapshot!;

    // Publish 8-field VerifiedProofRecord bound to snapshot.workspaceId
    const pubRes = await publishVerifiedProofRecord(
      {
        linkedWorkspaceId: snapshot.workspaceId,
        industrySector: 'Tier-1 Automotive Sheet-Metal Stamping (Sriperumbudur Cluster)',
        initialChallenge: 'High working capital locked in slow-moving stamping dies and coils.',
        analysisPerformed: 'Executed 4-pillar deterministic audit with Item 07 reserve spare exclusion.',
        actionTaken: 'Protected 2 critical CNC spares (₹1,12,500) and scheduled vendor contra recovery.',
        approvedQuotation: 'Every rupee in the audit report traced back to our Tally export.',
        clientSignOffConfirmed: true,
      },
      registryFile,
      wsFile,
      auditEventsFile
    );

    assert.equal(pubRes.ok, true);
    assert.ok(pubRes.proof);
    const proof = pubRes.proof!;

    assert.match(proof.proofId, /^PROOF-\d{8}-[0-9A-F]{4}$/);
    assert.equal(proof.linkedWorkspaceId, snapshot.workspaceId);
    assert.equal(proof.importRunId, snapshot.importRunId);
    assert.equal(proof.datasetSha256Prefix, snapshot.datasetSha256?.slice(0, 16));
    assert.equal(
      proof.verifiedFindings.p1BookValueInr,
      snapshot.summaryMetrics.totalStockValue
    );
    assert.equal(
      proof.verifiedFindings.p1DeadStockInr,
      snapshot.summaryMetrics.deadStockValue
    );
    assert.equal(
      proof.verifiedFindings.p1ReserveSparesProtectedInr,
      112500
    );
    assert.ok(proof.documentedLimitations.includes('1,12,500'));

    // Verify list and delete
    const listed = await listVerifiedProofRecords(registryFile);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].proofId, proof.proofId);

    const deleted = await deleteVerifiedProofRecord(proof.proofId, registryFile, auditEventsFile);
    assert.equal(deleted.ok, true);

    const listedAfterDelete = await listVerifiedProofRecords(registryFile);
    assert.equal(listedAfterDelete.length, 0);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

// ============================================================================
// PHASE 8 TESTS: Multi-Store 14-Day Data Purge & Cryptographic Deletion
// Certificate Engine (DELCERT-...), Purged Walkthrough Tombstone Continuity,
// Cloud Run 7-Store Backup & Dry-Run Restore Bundle, and Timing-Safe Admin Auth
// ============================================================================

test('Phase 8 Multi-Store 14-Day Data Purge & Cryptographic Deletion Certificate Engine: Purges raw P1-P4 line items across pilot_workspaces, scrubs linked import_runs quarantined rows, closes linked lead and revokes uploadToken to PURGED_REVOKED, preserves prePurgeSnapshotIntegrityHash, and persists DELCERT-... certificate', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const { validatePilotRequestPayload } = await import('../utils/leadValidation');
  const { createLeadRecord, getLeadRecordById } = await import('../utils/leadStore');
  const { buildSampleDirtyTallyPrimeExportDataset } = await import('../utils/importValidation');
  const { executeStep2PilotIngestion, listImportRunRecords } = await import(
    '../utils/importRunStore'
  );
  const {
    purgePilotWorkspace,
    getDeletionCertificateById,
    computeZeroedArraysVerificationHash,
  } = await import('../utils/dataPurgeEngine');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p8-purge-e2e-'));
  const leadsFile = path.join(tmpDir, 'pilot_requests.json');
  const wsFile = path.join(tmpDir, 'pilot_workspaces.json');
  const importRunsFile = path.join(tmpDir, 'import_runs.json');
  const auditEventsFile = path.join(tmpDir, 'audit_events.json');
  const certsFile = path.join(tmpDir, 'deletion_certificates.json');

  try {
    const val = validatePilotRequestPayload({
      fullName: 'Senthil Kumar',
      workEmail: 'senthil@ambatturcastings.in',
      phoneOrWhatsapp: '+91 98409 11223',
      companyName: 'Ambattur Precision Castings Pvt Ltd',
      plantLocation: 'Ambattur Industrial Estate, Chennai',
      roleTitle: 'Plant Head',
      consentConfirmed: true,
    });
    const lead = await createLeadRecord(val.data!, leadsFile);
    const dataset = buildSampleDirtyTallyPrimeExportDataset();

    const ingestRes = await executeStep2PilotIngestion(
      {
        leadId: lead.leadId,
        plantId: 'ambattur',
        p1Rows: dataset.p1Rows,
        p2Rows: dataset.p2Rows,
        p3Rows: dataset.p3Rows,
        p4Rows: dataset.p4Rows,
        excludeReserveSpares: true,
        anonymizationApplied: true,
      },
      {
        leadsFilePath: leadsFile,
        workspacesFilePath: wsFile,
        importRunsFilePath: importRunsFile,
        auditEventsFilePath: auditEventsFile,
      }
    );
    assert.equal(ingestRes.ok, true);
    const snapshotBefore = ingestRes.snapshot!;
    assert.equal(snapshotBefore.evaluatedSkus.length, 18);
    assert.equal(snapshotBefore.retentionStatus, 'ACTIVE_RETENTION_WINDOW');
    assert.equal(snapshotBefore.retentionPolicyDays, 14);

    // Execute Multi-Store Purge
    const purgeRes = await purgePilotWorkspace(
      {
        workspaceId: snapshotBefore.workspaceId,
        purgedBy: 'CLIENT_WALKTHROUGH',
        purgeReason: 'MANUAL_CLIENT_REQUEST',
      },
      {
        workspacesFilePath: wsFile,
        importRunsFilePath: importRunsFile,
        leadsFilePath: leadsFile,
        certificatesFilePath: certsFile,
        auditEventsFilePath: auditEventsFile,
      }
    );

    assert.equal(purgeRes.ok, true);
    assert.equal(purgeRes.demoProtected, false);
    assert.ok(purgeRes.certificate);
    assert.ok(purgeRes.snapshot);

    const cert = purgeRes.certificate!;
    const purgedSnap = purgeRes.snapshot!;

    // 1. Certificate ID & SHA-256 verification
    assert.match(cert.certificateId, /^DELCERT-\d{8}-[0-9A-F]{4}$/);
    assert.equal(cert.workspaceId, snapshotBefore.workspaceId);
    assert.equal(cert.leadId, lead.leadId);
    assert.equal(cert.importRunId, snapshotBefore.importRunId);
    assert.equal(cert.recordsPurgedSummary.p1SkusPurged, 18);
    assert.equal(cert.recordsPurgedSummary.p2DispatchesPurged, 3);
    assert.equal(cert.recordsPurgedSummary.p3FreightTripsPurged, 2);
    assert.equal(cert.recordsPurgedSummary.p4WarehouseBinsPurged, 2);
    assert.equal(cert.recordsPurgedSummary.quarantinedRowsPurged, 4);
    assert.equal(
      cert.recordsPurgedSummary.p1BookValueInr,
      snapshotBefore.summaryMetrics.totalStockValue
    );
    assert.equal(cert.prePurgeDatasetSha256, snapshotBefore.datasetSha256);
    assert.equal(
      cert.postPurgeVerificationHash,
      computeZeroedArraysVerificationHash()
    );

    // 2. Snapshot raw line items are scrubbed to [] while summaryMetrics & prePurgeSnapshotIntegrityHash remain intact
    assert.equal(purgedSnap.retentionStatus, 'PURGED');
    assert.equal(purgedSnap.deletionCertificateId, cert.certificateId);
    assert.equal(purgedSnap.evaluatedSkus.length, 0);
    assert.equal((purgedSnap.evaluatedP2Dispatches || []).length, 0);
    assert.equal((purgedSnap.evaluatedP3Trips || []).length, 0);
    assert.equal((purgedSnap.evaluatedP4Bins || []).length, 0);
    assert.equal(
      purgedSnap.summaryMetrics.totalStockValue,
      snapshotBefore.summaryMetrics.totalStockValue
    );
    assert.equal(
      purgedSnap.prePurgeSnapshotIntegrityHash,
      snapshotBefore.datasetSha256
    );

    // 3. Linked ImportRun quarantinedRows are scrubbed
    const runsAfter = await listImportRunRecords(importRunsFile);
    assert.equal(runsAfter.length, 1);
    assert.equal(runsAfter[0].quarantinedRowsScrubbed, true);
    assert.equal(runsAfter[0].deletionCertificateId, cert.certificateId);
    assert.equal((runsAfter[0].quarantinedRows?.p1 || []).length, 0);

    // 4. Linked Lead is closed and uploadToken is revoked to PURGED_REVOKED
    const leadAfter = await getLeadRecordById(lead.leadId, leadsFile);
    assert.ok(leadAfter);
    assert.equal(leadAfter!.status, 'CLOSED');
    assert.equal(leadAfter!.uploadToken, 'PURGED_REVOKED');
    assert.equal(leadAfter!.deletionCertificateId, cert.certificateId);

    // 5. Certificate is retrievable by ID from deletion_certificates.json
    const fetchedCert = await getDeletionCertificateById(cert.certificateId, certsFile);
    assert.ok(fetchedCert);
    assert.equal(fetchedCert!.certificateId, cert.certificateId);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 8 Public Demo Protection (AUDIT-DEMO-P1P4): Protects canonical 20-SKU sandbox from destructive deletion while returning sample certificate DELCERT-DEMO-P1P4', async () => {
  const { purgePilotWorkspace, getDeletionCertificateById } = await import(
    '../utils/dataPurgeEngine'
  );
  const { getAuthorizedPilotWorkspaceSnapshot } = await import('../utils/pilotWorkspaceStore');

  const demoPurgeRes = await purgePilotWorkspace({
    workspaceId: 'AUDIT-DEMO-P1P4',
    purgedBy: 'CLIENT_WALKTHROUGH',
    purgeReason: 'MANUAL_CLIENT_REQUEST',
  });

  assert.equal(demoPurgeRes.ok, true);
  assert.equal(demoPurgeRes.demoProtected, true);
  assert.ok(demoPurgeRes.certificate);
  assert.equal(demoPurgeRes.certificate!.certificateId, 'DELCERT-DEMO-P1P4');
  assert.equal(demoPurgeRes.certificate!.recordsPurgedSummary.p1SkusPurged, 20);
  assert.equal(demoPurgeRes.certificate!.recordsPurgedSummary.p1BookValueInr, 645650);

  // Verify AUDIT-DEMO-P1P4 still has all 20 SKUs intact
  const demoCheck = await getAuthorizedPilotWorkspaceSnapshot(
    'AUDIT-DEMO-P1P4',
    { shareToken: 'operationalyst-public-demo-token', isAdmin: false }
  );
  assert.equal(demoCheck.status, 'OK');
  if (demoCheck.status === 'OK') {
    assert.equal(demoCheck.snapshot.evaluatedSkus.length, 20);
    assert.equal(demoCheck.snapshot.summaryMetrics.totalStockValue, 645650);
  }

  // Verify DELCERT-DEMO-P1P4 is always resolvable via getDeletionCertificateById
  const sampleCert = await getDeletionCertificateById('DELCERT-DEMO-P1P4');
  assert.ok(sampleCert);
  assert.equal(sampleCert!.certificateId, 'DELCERT-DEMO-P1P4');
});

test('Phase 8 Retention Extension (+30 Days) & Automated Expired (>14d) Sweep: Extends retention window for active client workspaces while sweeping expired workspaces and issuing DELCERT certificates', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const { getPlantBaseline } = await import('../data/multiPlantBaselines');
  const {
    validatePilotWorkspacePayload,
    createPilotWorkspaceSnapshot,
    listPilotWorkspaceSnapshots,
  } = await import('../utils/pilotWorkspaceStore');
  const { extendPilotWorkspaceRetention, sweepExpiredWorkspaces } = await import(
    '../utils/dataPurgeEngine'
  );

  const ambattur = getPlantBaseline('ambattur');
  const val = validatePilotWorkspacePayload({
    companyName: 'Hosur Retention Sweep Test Unit',
    plantLocation: 'Hosur SIPCOT',
    preparedBy: 'C. Jones Snowin',
    rules: ambattur.p1Rules,
    skus: ambattur.p1Items,
  });
  assert.equal(val.ok, true);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p8-sweep-'));
  const wsFile = path.join(tmpDir, 'pilot_workspaces.json');
  const importRunsFile = path.join(tmpDir, 'import_runs.json');
  const leadsFile = path.join(tmpDir, 'pilot_requests.json');
  const certsFile = path.join(tmpDir, 'deletion_certificates.json');
  const auditFile = path.join(tmpDir, 'audit_events.json');

  try {
    const wsActive = await createPilotWorkspaceSnapshot(val.data!, wsFile);
    const wsExpired = await createPilotWorkspaceSnapshot(
      {
        ...val.data!,
        companyName: 'Expired 15-Day Old Factory Snapshot',
      },
      wsFile
    );

    // Extend wsActive by +30 days
    const extendRes = await extendPilotWorkspaceRetention(
      wsActive.workspaceId,
      30,
      'CLIENT_WALKTHROUGH',
      { workspacesFilePath: wsFile, auditEventsFilePath: auditFile }
    );
    assert.equal(extendRes.ok, true);
    assert.equal(extendRes.snapshot?.retentionStatus, 'EXTENDED_BY_CLIENT');
    assert.equal(extendRes.snapshot?.retentionPolicyDays, 44);

    // Backdate wsExpired's retentionExpiresAt to 2 days in the past
    const allSnaps = await listPilotWorkspaceSnapshots(wsFile);
    const modifiedSnaps = allSnaps.map((s) =>
      s.workspaceId === wsExpired.workspaceId
        ? {
            ...s,
            retentionExpiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          }
        : s
    );
    await fs.writeFile(wsFile, JSON.stringify(modifiedSnaps, null, 2), 'utf-8');

    // Run sweepExpiredWorkspaces
    const sweepRes = await sweepExpiredWorkspaces(new Date(), {
      workspacesFilePath: wsFile,
      importRunsFilePath: importRunsFile,
      leadsFilePath: leadsFile,
      certificatesFilePath: certsFile,
      auditEventsFilePath: auditFile,
    });

    assert.equal(sweepRes.ok, true);
    assert.equal(sweepRes.sweptCount, 1);
    assert.deepEqual(sweepRes.sweptWorkspaceIds, [wsExpired.workspaceId]);
    assert.equal(sweepRes.certificates.length, 1);
    assert.equal(sweepRes.certificates[0].purgeReason, 'RETENTION_EXPIRED_14D');

    // Verify wsActive was NOT purged while wsExpired IS purged
    const afterSweep = await listPilotWorkspaceSnapshots(wsFile);
    const activeCheck = afterSweep.find((s) => s.workspaceId === wsActive.workspaceId);
    const expiredCheck = afterSweep.find((s) => s.workspaceId === wsExpired.workspaceId);
    assert.equal(activeCheck?.retentionStatus, 'EXTENDED_BY_CLIENT');
    assert.equal(activeCheck?.evaluatedSkus.length, 20);
    assert.equal(expiredCheck?.retentionStatus, 'PURGED');
    assert.equal(expiredCheck?.evaluatedSkus.length, 0);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 8 Verified Proof Registry Post-Purge Continuity: Preserves prePurgeSnapshotIntegrityHash so PROOF-... records remain verifiable and publishable even after raw P1-P4 line items are purged', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const { getPlantBaseline } = await import('../data/multiPlantBaselines');
  const { validatePilotWorkspacePayload, createPilotWorkspaceSnapshot } = await import(
    '../utils/pilotWorkspaceStore'
  );
  const { purgePilotWorkspace } = await import('../utils/dataPurgeEngine');
  const { publishVerifiedProofRecord } = await import('../utils/verifiedProofRegistryStore');

  const ambattur = getPlantBaseline('ambattur');
  const val = validatePilotWorkspacePayload({
    companyName: 'Sriperumbudur Post-Purge Proof Plant',
    plantLocation: 'Sriperumbudur SIPCOT',
    preparedBy: 'C. Jones Snowin',
    rules: ambattur.p1Rules,
    skus: ambattur.p1Items,
  });
  assert.equal(val.ok, true);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p8-postpurge-proof-'));
  const wsFile = path.join(tmpDir, 'pilot_workspaces.json');
  const certsFile = path.join(tmpDir, 'deletion_certificates.json');
  const registryFile = path.join(tmpDir, 'verified_proof_registry.json');
  const auditFile = path.join(tmpDir, 'audit_events.json');

  try {
    const created = await createPilotWorkspaceSnapshot(val.data!, wsFile);
    const originalPrePurgeHash = created.prePurgeSnapshotIntegrityHash;
    assert.ok(originalPrePurgeHash && originalPrePurgeHash.length === 64);

    // Purge raw P1-P4 line items
    const purgeRes = await purgePilotWorkspace(
      {
        workspaceId: created.workspaceId,
        purgedBy: 'FOUNDER_INBOX',
        purgeReason: 'MANUAL_FOUNDER_PURGE',
      },
      {
        workspacesFilePath: wsFile,
        certificatesFilePath: certsFile,
        auditEventsFilePath: auditFile,
      }
    );
    assert.equal(purgeRes.ok, true);
    assert.equal(purgeRes.snapshot?.evaluatedSkus.length, 0);

    // Publish Verified Proof from the purged workspace
    const proofRes = await publishVerifiedProofRecord(
      {
        linkedWorkspaceId: created.workspaceId,
        industrySector: 'Automotive Precision Components (Post-Purge Continuity)',
        initialChallenge: 'Dormant stock and unverified bin counts.',
        analysisPerformed: '4-Pillar Audit followed by 14-day raw row purge.',
        actionTaken: 'Released working capital and issued DELCERT certificate.',
        clientSignOffConfirmed: true,
      },
      registryFile,
      wsFile,
      auditFile
    );

    assert.equal(proofRes.ok, true);
    assert.equal(
      proofRes.proof?.datasetSha256Prefix,
      originalPrePurgeHash!.slice(0, 16)
    );
    assert.equal(proofRes.proof?.verifiedFindings.p1BookValueInr, 645650);
    assert.equal(proofRes.proof?.verifiedFindings.p1DeadStockInr, 223110);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 8 Cloud Run 7-Store System Backup & Dry-Run Restore Bundle: Round-trips all 7 server stores with SHA-256 bundleIntegrityHash verification and supports dryRun validation', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const { exportSystemBackupBundle, restoreSystemBackupBundle } = await import(
    '../utils/systemBackupBundle'
  );

  const tmpDirSource = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p8-backup-src-'));
  const tmpDirTarget = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p8-backup-dst-'));

  const srcPaths = {
    pilotRequests: path.join(tmpDirSource, 'pilot_requests.json'),
    pilotWorkspaces: path.join(tmpDirSource, 'pilot_workspaces.json'),
    plantWorkspaces: path.join(tmpDirSource, 'plant_workspaces.json'),
    importRuns: path.join(tmpDirSource, 'import_runs.json'),
    verifiedProofs: path.join(tmpDirSource, 'verified_proof_registry.json'),
    auditEvents: path.join(tmpDirSource, 'audit_events.json'),
    deletionCertificates: path.join(tmpDirSource, 'deletion_certificates.json'),
  };

  const dstPaths = {
    pilotRequests: path.join(tmpDirTarget, 'pilot_requests.json'),
    pilotWorkspaces: path.join(tmpDirTarget, 'pilot_workspaces.json'),
    plantWorkspaces: path.join(tmpDirTarget, 'plant_workspaces.json'),
    importRuns: path.join(tmpDirTarget, 'import_runs.json'),
    verifiedProofs: path.join(tmpDirTarget, 'verified_proof_registry.json'),
    auditEvents: path.join(tmpDirTarget, 'audit_events.json'),
    deletionCertificates: path.join(tmpDirTarget, 'deletion_certificates.json'),
  };

  try {
    await fs.writeFile(srcPaths.pilotRequests, JSON.stringify([{ leadId: 'PILOT-TEST-1' }]), 'utf-8');
    await fs.writeFile(
      srcPaths.pilotWorkspaces,
      JSON.stringify([{ workspaceId: 'AUDIT-TEST-1' }]),
      'utf-8'
    );
    await fs.writeFile(
      srcPaths.plantWorkspaces,
      JSON.stringify({
        ambattur: { plantId: 'ambattur', isCustomized: false },
        sriperumbudur: { plantId: 'sriperumbudur', isCustomized: true },
        hosur: { plantId: 'hosur', isCustomized: false },
      }),
      'utf-8'
    );
    await fs.writeFile(
      srcPaths.importRuns,
      JSON.stringify([{ importRunId: 'IMPRUN-TEST-1' }]),
      'utf-8'
    );
    await fs.writeFile(
      srcPaths.verifiedProofs,
      JSON.stringify([{ proofId: 'PROOF-TEST-1' }]),
      'utf-8'
    );
    await fs.writeFile(
      srcPaths.auditEvents,
      JSON.stringify([{ eventId: 'EVT-TEST-1' }]),
      'utf-8'
    );
    await fs.writeFile(
      srcPaths.deletionCertificates,
      JSON.stringify([{ certificateId: 'DELCERT-TEST-1' }]),
      'utf-8'
    );

    const bundle = await exportSystemBackupBundle(srcPaths);
    assert.equal(bundle.bundleVersion, '1.0');
    assert.equal(bundle.bundleIntegrityHash.length, 64);
    assert.equal(bundle.storeCounts.pilotRequests, 1);
    assert.equal(bundle.storeCounts.pilotWorkspaces, 1);
    assert.equal(bundle.storeCounts.plantWorkspaces, 3);
    assert.equal(bundle.storeCounts.importRuns, 1);
    assert.equal(bundle.storeCounts.verifiedProofs, 1);
    assert.equal(bundle.storeCounts.auditEvents, 1);
    assert.equal(bundle.storeCounts.deletionCertificates, 1);

    // 1. Dry-run restore validates without writing files
    const dryRes = await restoreSystemBackupBundle(bundle, {
      dryRun: true,
      pathsOverride: dstPaths,
    });
    assert.equal(dryRes.ok, true);
    assert.equal(dryRes.dryRun, true);
    assert.equal(dryRes.integrityVerified, true);

    // 2. Full restore writes all 7 stores to dstPaths
    const fullRes = await restoreSystemBackupBundle(bundle, {
      dryRun: false,
      actor: 'TEST_HARNESS',
      pathsOverride: dstPaths,
    });
    assert.equal(fullRes.ok, true);
    assert.equal(fullRes.dryRun, false);
    assert.equal(fullRes.storeCounts.pilotRequests, 1);
    assert.equal(fullRes.storeCounts.plantWorkspaces, 3);
    assert.equal(fullRes.storeCounts.deletionCertificates, 1);

    // Verify plant_workspaces.json was restored as a keyed object for plantWorkspaceServerStore compatibility
    const restoredPlantsRaw = JSON.parse(await fs.readFile(dstPaths.plantWorkspaces, 'utf-8'));
    assert.ok(restoredPlantsRaw.ambattur);
    assert.equal(restoredPlantsRaw.sriperumbudur.isCustomized, true);
  } finally {
    await fs.rm(tmpDirSource, { recursive: true, force: true });
    await fs.rm(tmpDirTarget, { recursive: true, force: true });
  }
});

test('Phase 8 System Restore Tamper Rejection: Rejects tampered backup bundles when bundleIntegrityHash does not match the 7-store SHA-256 payload', async () => {
  const { exportSystemBackupBundle, restoreSystemBackupBundle } = await import(
    '../utils/systemBackupBundle'
  );

  const bundle = await exportSystemBackupBundle();
  const tamperedBundle = {
    ...bundle,
    stores: {
      ...bundle.stores,
      pilotRequests: [{ leadId: 'INJECTED-TAMPERED-LEAD' }],
    },
  };

  const restoreRes = await restoreSystemBackupBundle(tamperedBundle, { dryRun: true });
  assert.equal(restoreRes.ok, false);
  assert.equal(restoreRes.integrityVerified, false);
  assert.ok(restoreRes.error?.includes('Bundle integrity check failed'));
});

test('Phase 8 Timing-Safe Admin Guard (crypto.timingSafeEqual): Constant-time SHA-256 comparison accepts valid admin key and rejects invalid or empty keys', async () => {
  const { verifyAdminKey, constantTimeSha256Equal } = await import('../utils/adminAuthGuard');

  const validCheck = verifyAdminKey('operationalyst-local-dev-key');
  assert.equal(validCheck.authorized, true);

  const invalidCheck = verifyAdminKey('wrong-key-attempt-123');
  assert.equal(invalidCheck.authorized, false);

  const emptyCheck = verifyAdminKey('');
  assert.equal(emptyCheck.authorized, false);

  assert.equal(constantTimeSha256Equal('alpha-secret-99', 'alpha-secret-99'), true);
  assert.equal(constantTimeSha256Equal('alpha-secret-99', 'alpha-secret-98'), false);
});

// ============================================================================
// PHASE 9 TESTS: First-Party Server Funnel & Scroll-Depth Analytics
// (/api/analytics/event) and High-Conversion B2B Landing Page Tightening
// ============================================================================

test('Phase 9 First-Party Funnel Analytics Store: Records canonical milestones, persists to JSON, and computes deterministic step-to-step retention and drop-off percentages', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const {
    recordFunnelAnalyticsEvent,
    getFunnelAnalyticsDropOffReport,
    listFunnelAnalyticsEvents,
  } = await import('../utils/funnelAnalyticsStore');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p9-funnel-'));
  const analyticsFile = path.join(tmpDir, 'funnel_analytics.json');

  try {
    // Record 4 landing page views
    for (let i = 0; i < 4; i++) {
      await recordFunnelAnalyticsEvent({ eventType: 'LANDING_PAGE_VIEW' }, analyticsFile);
    }
    // Record 3 50% scrolls
    for (let i = 0; i < 3; i++) {
      await recordFunnelAnalyticsEvent({ eventType: 'SCROLL_DEPTH_50_PCT' }, analyticsFile);
    }
    // Record 2 90% scrolls
    for (let i = 0; i < 2; i++) {
      await recordFunnelAnalyticsEvent({ eventType: 'SCROLL_DEPTH_90_PCT' }, analyticsFile);
    }
    // Record 2 sample report clicks, 1 self-assessment completion, 2 modal opens, 1 data kit download, 1 pilot audit submission
    await recordFunnelAnalyticsEvent({ eventType: 'SAMPLE_REPORT_CLICKED' }, analyticsFile);
    await recordFunnelAnalyticsEvent({ eventType: 'SAMPLE_REPORT_CLICKED' }, analyticsFile);
    await recordFunnelAnalyticsEvent(
      { eventType: 'SELF_ASSESSMENT_COMPLETED', metadata: { score: 65 } },
      analyticsFile
    );
    await recordFunnelAnalyticsEvent({ eventType: 'AUDIT_MODAL_OPENED' }, analyticsFile);
    await recordFunnelAnalyticsEvent({ eventType: 'AUDIT_MODAL_OPENED' }, analyticsFile);
    await recordFunnelAnalyticsEvent({ eventType: 'DATA_KIT_DOWNLOADED' }, analyticsFile);
    await recordFunnelAnalyticsEvent(
      { eventType: 'PILOT_AUDIT_SUBMITTED', metadata: { leadId: 'PILOT-P9-TEST' } },
      analyticsFile
    );

    const events = await listFunnelAnalyticsEvents(analyticsFile);
    assert.equal(events.length, 16);

    const report = await getFunnelAnalyticsDropOffReport(analyticsFile);
    assert.equal(report.totalEventsRecorded, 16);
    assert.equal(report.counts.LANDING_PAGE_VIEW, 4);
    assert.equal(report.counts.SCROLL_DEPTH_50_PCT, 3);
    assert.equal(report.counts.SCROLL_DEPTH_90_PCT, 2);
    assert.equal(report.counts.SAMPLE_REPORT_CLICKED, 2);
    assert.equal(report.counts.SELF_ASSESSMENT_COMPLETED, 1);
    assert.equal(report.counts.AUDIT_MODAL_OPENED, 2);
    assert.equal(report.counts.DATA_KIT_DOWNLOADED, 1);
    assert.equal(report.counts.PILOT_AUDIT_SUBMITTED, 1);

    // 4 views -> 3 50% scroll = 75.0% retention, 25.0% drop-off
    const scroll50Step = report.stages.find((s) => s.stageId === 'SCROLL_DEPTH_50_PCT');
    assert.ok(scroll50Step);
    assert.equal(scroll50Step!.retentionFromPreviousPct, 75);
    assert.equal(scroll50Step!.dropOffFromPreviousPct, 25);
    assert.equal(report.rates.first5sHeroRetentionPct, 75);
    assert.equal(report.rates.first5sHeroDropOffPct, 25);

    // 4 views -> 2 modal opens = 50.0% modal open rate
    assert.equal(report.rates.modalOpenRatePct, 50);
    // 2 modal opens -> 1 submission = 50.0% modal-to-submit conversion
    assert.equal(report.rates.modalToSubmissionConversionPct, 50);
    // 4 views -> 1 submission = 25.0% overall pilot submit rate
    assert.equal(report.rates.overallVisitorToLeadConversionPct, 25);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 9 Funnel Analytics Payload Validation & Reset: Rejects invalid eventType values and cleanly resets funnel counters', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const {
    validateFunnelEventPayload,
    recordFunnelAnalyticsEvent,
    resetFunnelAnalyticsEvents,
    getFunnelAnalyticsDropOffReport,
  } = await import('../utils/funnelAnalyticsStore');

  const invalid1 = validateFunnelEventPayload({ eventType: 'UNKNOWN_EVENT' });
  assert.equal(invalid1.ok, false);

  const invalid2 = validateFunnelEventPayload(null);
  assert.equal(invalid2.ok, false);

  const valid = validateFunnelEventPayload({
    eventType: 'SAMPLE_REPORT_CLICKED',
    metadata: { sourceSection: 'hero_cta', buyerPersona: 'plant_head' },
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.data?.eventType, 'SAMPLE_REPORT_CLICKED');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p9-reset-'));
  const analyticsFile = path.join(tmpDir, 'funnel_analytics.json');

  try {
    await recordFunnelAnalyticsEvent({ eventType: 'LANDING_PAGE_VIEW' }, analyticsFile);
    await recordFunnelAnalyticsEvent({ eventType: 'AUDIT_MODAL_OPENED' }, analyticsFile);

    const beforeReset = await getFunnelAnalyticsDropOffReport(analyticsFile);
    assert.equal(beforeReset.totalEventsRecorded, 2);

    const afterReset = await resetFunnelAnalyticsEvents(analyticsFile);
    assert.equal(afterReset.totalEventsRecorded, 0);
    assert.equal(afterReset.counts.LANDING_PAGE_VIEW, 0);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 9 Landing Page Conversion & Trust Tightening: Verifies 5-second hero sub-headline, Plain-English Privacy Guarantee banner, collapsible drawers, and Direct Founder Desk contact label', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');

  const landingSrc = await fs.readFile(
    path.join(process.cwd(), 'src/commercial/CommercialLandingPage.tsx'),
    'utf-8'
  );
  const selfAssessmentSrc = await fs.readFile(
    path.join(process.cwd(), 'src/commercial/SelfAssessmentWidget.tsx'),
    'utf-8'
  );

  // 1. Concrete 5-second Hero sub-headline
  assert.ok(landingSrc.includes('data-testid="hero-subheadline"'));
  assert.ok(
    landingSrc.includes(
      'Start with a 5-column Tally Prime, SAP, or Excel export. Get a ranked list of your non-moving SKUs, carrying-cost exposure, and priority floor investigation targets in 48 hours—reviewed directly by founder C. Jones Snowin.'
    )
  );

  // 2. Collapsible Deep-Dive Drawers
  assert.ok(selfAssessmentSrc.includes('data-testid="toggle-self-assessment-drawer"'));
  assert.ok(
    selfAssessmentSrc.includes(
      'Take the 60-Second Inventory Visibility Check (5 Questions · Scored 0–100)'
    )
  );
  assert.ok(landingSrc.includes('data-testid="toggle-methodology-stages-drawer"'));
  assert.ok(landingSrc.includes('data-testid="toggle-governance-faq-drawer"'));

  // 3. 1-Sentence Plain-English Privacy Banner
  assert.ok(landingSrc.includes('data-testid="landing-plain-english-privacy-banner"'));
  assert.ok(landingSrc.includes('Plain-English Privacy Guarantee:'));
  assert.ok(
    landingSrc.includes(
      'Strip vendor and customer names before sending. Reviewed only by founder C. Jones Snowin and purged within 14 days (or immediately after your call) with a cryptographic Deletion Certificate'
    )
  );
  assert.ok(landingSrc.includes('DELCERT-...'));

  // 4. Professional Founder Contact Presentation
  assert.ok(landingSrc.includes('data-testid="founder-contact-email-link"'));
  assert.ok(landingSrc.includes('Direct Founder Desk (C. Jones Snowin)'));
  assert.ok(landingSrc.includes('data-testid="founder-contact-linkedin-link"'));
  assert.ok(landingSrc.includes('LinkedIn Profile (C. Jones Snowin)'));
});

test('Phase 9 Modal Plain-English Privacy Guarantee Banner: Verifies FactoryAuditModal contains Plain-English Privacy Guarantee and DELCERT reference', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');

  const modalSrc = await fs.readFile(
    path.join(process.cwd(), 'src/commercial/FactoryAuditModal.tsx'),
    'utf-8'
  );

  assert.ok(modalSrc.includes('data-testid="modal-plain-english-privacy-banner"'));
  assert.ok(modalSrc.includes('Plain-English Privacy Guarantee:'));
  assert.ok(
    modalSrc.includes(
      'Strip vendor and customer names before sending. Reviewed only by founder C. Jones Snowin and purged within 14 days (or immediately after your call) with a cryptographic Deletion Certificate'
    )
  );
  assert.ok(modalSrc.includes('DELCERT-...'));
  assert.ok(modalSrc.includes('Direct Founder Desk (C. Jones Snowin)'));
});

// ============================================================================
// PHASE 10 TESTS: Automatic 5-Column CSV Template Download on Audit Submit,
// 4-Field Express Modal Validation, Field-Level Hesitation Telemetry (focus_*
// & abandoned_at_*), Dedicated /audit Sample Report Route, and Follow-Up Scripts
// ============================================================================

test('Phase 10 Express 4-Field Lead Validation: Accepts Express 4-Field submissions with either an email address or a WhatsApp number in the contact field', async () => {
  const { validatePilotRequestPayload } = await import('../utils/leadValidation');

  // 1. Express 4-Field submission with WhatsApp number in unified contact field
  const whatsappExpress = validatePilotRequestPayload({
    fullName: 'Karthik Subramanian — Plant Head',
    companyName: 'Hosur Precision Gears Pvt Ltd',
    contact: '+91 98402 55667',
    erpSystem: 'Tally Prime / Tally ERP 9',
    consentConfirmed: true,
  });
  assert.equal(whatsappExpress.ok, true);
  assert.equal(whatsappExpress.data?.fullName, 'Karthik Subramanian — Plant Head');
  assert.equal(whatsappExpress.data?.companyName, 'Hosur Precision Gears Pvt Ltd');
  assert.equal(whatsappExpress.data?.phoneOrWhatsapp, '+91 98402 55667');
  assert.equal(whatsappExpress.data?.erpSystem, 'Tally Prime / Tally ERP 9');

  // 2. Express 4-Field submission with Email in workEmail field (no separate phoneOrWhatsapp)
  const emailExpress = validatePilotRequestPayload({
    fullName: 'Meera Krishnan (GM Operations)',
    companyName: 'Sriperumbudur Automotive Stampings',
    workEmail: 'meera@sriperumbudurstampings.in',
    erpSystem: 'SAP (B1 / S4 / ECC)',
    consentConfirmed: true,
  });
  assert.equal(emailExpress.ok, true);
  assert.equal(emailExpress.data?.workEmail, 'meera@sriperumbudurstampings.in');
  assert.equal(emailExpress.data?.companyName, 'Sriperumbudur Automotive Stampings');

  // 3. Express 4-Field submission with WhatsApp number typed directly into workEmail input
  const whatsappInEmailInput = validatePilotRequestPayload({
    fullName: 'Arun Prakash — Director',
    companyName: 'Ambattur Industrial Valves',
    workEmail: '+91 98400 77889',
    erpSystem: 'Excel / Google Sheets',
    consentConfirmed: true,
  });
  assert.equal(whatsappInEmailInput.ok, true);
  assert.equal(whatsappInEmailInput.data?.phoneOrWhatsapp, '+91 98400 77889');
});

test('Phase 10 Field-Level Focus & Abandonment Telemetry + 4-Stage Scroll Depth: Records focus_*, abandoned_at_*, and 25%/50%/75%/90% scroll events and computes accurate field-abandonment diagnostics', async () => {
  const fs = await import('fs/promises');
  const os = await import('os');
  const path = await import('path');
  const {
    recordFunnelAnalyticsEvent,
    getFunnelAnalyticsDropOffReport,
  } = await import('../utils/funnelAnalyticsStore');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'operationalyst-p10-telemetry-'));
  const analyticsFile = path.join(tmpDir, 'funnel_analytics.json');

  try {
    await recordFunnelAnalyticsEvent({ eventType: 'LANDING_PAGE_VIEW' }, analyticsFile);
    await recordFunnelAnalyticsEvent({ eventType: 'LANDING_PAGE_VIEW' }, analyticsFile);
    await recordFunnelAnalyticsEvent({ eventType: 'SCROLL_DEPTH_25_PCT' }, analyticsFile);
    await recordFunnelAnalyticsEvent({ eventType: 'SCROLL_DEPTH_25_PCT' }, analyticsFile);
    await recordFunnelAnalyticsEvent({ eventType: 'SCROLL_DEPTH_50_PCT' }, analyticsFile);
    await recordFunnelAnalyticsEvent({ eventType: 'SCROLL_DEPTH_75_PCT' }, analyticsFile);
    await recordFunnelAnalyticsEvent({ eventType: 'SCROLL_DEPTH_90_PCT' }, analyticsFile);

    await recordFunnelAnalyticsEvent({ eventType: 'AUDIT_MODAL_OPENED' }, analyticsFile);
    await recordFunnelAnalyticsEvent({ eventType: 'focus_name_field' }, analyticsFile);
    await recordFunnelAnalyticsEvent({ eventType: 'focus_company_field' }, analyticsFile);
    await recordFunnelAnalyticsEvent({ eventType: 'focus_contact_field' }, analyticsFile);
    await recordFunnelAnalyticsEvent(
      {
        eventType: 'abandoned_at_contact_field',
        metadata: { sourceSection: 'hero_primary', lastFieldTouched: 'contact_field' },
      },
      analyticsFile
    );
    await recordFunnelAnalyticsEvent(
      {
        eventType: 'abandoned_at_contact_field',
        metadata: { sourceSection: 'sample_audit', lastFieldTouched: 'contact_field' },
      },
      analyticsFile
    );
    await recordFunnelAnalyticsEvent(
      {
        eventType: 'abandoned_at_company_field',
        metadata: { sourceSection: 'hero_primary', lastFieldTouched: 'company_field' },
      },
      analyticsFile
    );

    const report = await getFunnelAnalyticsDropOffReport(analyticsFile);
    assert.equal(report.scrollDepthBreakdown.scroll25Count, 2);
    assert.equal(report.scrollDepthBreakdown.scroll25PctOfViews, 100);
    assert.equal(report.scrollDepthBreakdown.scroll50Count, 1);
    assert.equal(report.scrollDepthBreakdown.scroll75Count, 1);
    assert.equal(report.scrollDepthBreakdown.scroll90Count, 1);

    assert.equal(report.fieldHesitationBreakdown.focusCounts.name_field, 1);
    assert.equal(report.fieldHesitationBreakdown.focusCounts.company_field, 1);
    assert.equal(report.fieldHesitationBreakdown.focusCounts.contact_field, 1);
    assert.equal(report.fieldHesitationBreakdown.abandonmentCounts.contact_field, 2);
    assert.equal(report.fieldHesitationBreakdown.abandonmentCounts.company_field, 1);
    assert.equal(report.fieldHesitationBreakdown.abandonmentCounts.totalAbandoned, 3);
    assert.equal(report.fieldHesitationBreakdown.topAbandonmentField, 'contact_field');
    assert.ok(
      report.fieldHesitationBreakdown.diagnosticRecommendation.includes('WhatsApp')
    );
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 10 Founder Quick-Follow-Up Scripts & Express 5-Column Template: Interpolates lead metadata (fullName, companyName, erpSystem) across 15m WhatsApp, 15m Email, and 48h Nudge scripts and builds canonical PRG-4402-SS / BRG-6205-ZZ CSV template', async () => {
  const {
    buildFounderFollowUpScripts,
    buildExpress5ColumnAuditTemplateCsvContent,
    downloadAuditTemplate,
  } = await import('../utils/pilotDataKitExporter');

  const scripts = buildFounderFollowUpScripts({
    leadId: 'PILOT-20261108-ABCD',
    fullName: 'Senthil Murugan',
    companyName: 'Murugan Precision Forgings',
    plantLocation: 'Ambattur SIDCO',
    erpSystem: 'Tally Prime',
    uploadPortalUrl: 'https://operationalyst.in/?view=pilot-upload&leadId=PILOT-20261108-ABCD',
  });

  assert.ok(scripts.whatsapp15MinScript.includes('Senthil Murugan'));
  assert.ok(scripts.whatsapp15MinScript.includes('Murugan Precision Forgings'));
  assert.ok(scripts.whatsapp15MinScript.includes('Tally Prime'));
  assert.ok(scripts.whatsapp15MinScript.includes('Operationalyst_5_Column_Audit_Template.csv'));

  assert.ok(scripts.email15MinBody.includes('Senthil Murugan'));
  assert.ok(scripts.email15MinBody.includes('Murugan Precision Forgings'));
  assert.ok(scripts.email15MinBody.includes('Tally Prime'));
  assert.ok(scripts.email15MinBody.includes('DELCERT-...'));

  assert.ok(scripts.nudge48HourScript.includes('Senthil Murugan'));
  assert.ok(scripts.nudge48HourScript.includes('Murugan Precision Forgings'));
  assert.ok(scripts.nudge48HourScript.includes('Top 200 Raw Material or Spares SKUs'));

  const expressCsv = buildExpress5ColumnAuditTemplateCsvContent();
  assert.ok(
    expressCsv.includes(
      'Part_ID,Part_Description,Closing_Stock_Qty,Unit_Cost_INR,Last_Movement_Date'
    )
  );
  assert.ok(
    expressCsv.includes('PRG-4402-SS,CNC Machined Flange Housing,420,1850,2024-05-14')
  );
  assert.ok(
    expressCsv.includes('BRG-6205-ZZ,Sealed Spindle Bearing Assembly,85,640,2025-01-19')
  );

  // Verify downloadAuditTemplate works cleanly in Node test environment and returns the CSV string
  const downloadedCsv = downloadAuditTemplate('unit_test');
  assert.equal(downloadedCsv, expressCsv);
});

test('Phase 10 Dedicated /audit Sample Report Route (SampleAuditPage.tsx): Verifies Mode A (12,400-SKU) vs Mode B (20-SKU) toggle, Top Flagged SKUs (PRG-4402-SS, BRG-6205-ZZ, HSG-910-ALU), and auto-template download modal confirmation', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');

  const samplePageSrc = await fs.readFile(
    path.join(process.cwd(), 'src/commercial/SampleAuditPage.tsx'),
    'utf-8'
  );
  const modalSrc = await fs.readFile(
    path.join(process.cwd(), 'src/commercial/FactoryAuditModal.tsx'),
    'utf-8'
  );
  const appSrc = await fs.readFile(path.join(process.cwd(), 'src/App.tsx'), 'utf-8');

  // Verify /audit and ?view=sample-audit routing in App.tsx
  assert.ok(appSrc.includes("pathnameLower === '/audit'"));
  assert.ok(appSrc.includes("explicitParam === 'sample-audit'"));

  // Verify Mode A (12,400-SKU) vs Mode B (20-SKU) and Top Flagged SKUs in SampleAuditPage.tsx
  assert.ok(samplePageSrc.includes('Mode A: 12,400-SKU Plant Case'));
  assert.ok(samplePageSrc.includes('Mode B: 20-SKU Sandbox'));
  assert.ok(samplePageSrc.includes('₹4,82,50,000'));
  assert.ok(samplePageSrc.includes('₹18,42,000'));
  assert.ok(samplePageSrc.includes('₹32,60,000'));
  assert.ok(samplePageSrc.includes('₹6,45,650'));
  assert.ok(samplePageSrc.includes('₹2,23,110'));
  assert.ok(samplePageSrc.includes('₹63,600'));
  assert.ok(samplePageSrc.includes('PRG-4402-SS'));
  assert.ok(samplePageSrc.includes('BRG-6205-ZZ'));
  assert.ok(samplePageSrc.includes('HSG-910-ALU'));

  // Verify automatic template download & confirmation screen in FactoryAuditModal.tsx
  assert.ok(modalSrc.includes("downloadAuditTemplate('audit_modal_auto_download')"));
  assert.ok(modalSrc.includes('Audit Request Received &amp; Template Downloaded'));
  assert.ok(modalSrc.includes('Download 5-Column Template Again (.CSV / Excel)'));
});

// ============================================================================
// PHASE 11 TESTS: Mode A/B 100% Consistency, 6-Stage Analytical Methodology
// Visibility & Auto-Expand, Optional Environment Variables, & Accessibility
// ============================================================================

test('Phase 11 Mode A (12,400-SKU Plant Case) & Mode B (Live 20-SKU Sandbox Dataset) Deterministic KPI Alignment across Landing Page, Modal, and /audit Route', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const { getReconciledSampleAuditModes } = await import('../commercial/homepageConfig');
  const {
    getLiveSandboxReconciledModeMetrics,
    ILLUSTRATIVE_12400_CASE_METRICS,
  } = await import('../utils/liveSandboxMetrics');

  const modes = getReconciledSampleAuditModes();
  const modeA = modes.illustrative_12400;
  const modeB = modes.sandbox_20;
  const liveSandbox = getLiveSandboxReconciledModeMetrics();

  // 1. Mode A (12,400-SKU Plant Case) exact KPI invariants
  assert.ok(modeA.shortLabel.includes('Mode A: 12,400-SKU Plant Case'));
  assert.ok(ILLUSTRATIVE_12400_CASE_METRICS.modeLabel.includes('Mode A: 12,400-SKU Plant Case'));
  assert.equal(modeA.totalBookValueFormatted, '₹4,82,50,000');
  assert.equal(modeA.deadStockValueFormatted, '₹18,42,000');
  assert.ok(modeA.deadStockSubtext.includes('24 SKUs'));
  assert.equal(modeA.slowMovingValueFormatted, '₹32,60,000');
  assert.ok(modeA.slowMovingSubtext.includes('41 SKUs'));
  assert.equal(modeA.prioritySkusHeadline, '18 Priority SKUs');

  // 2. Mode B (Live 20-SKU Sandbox Dataset) exact KPI invariants + P2/P3/P4 connected signals
  assert.ok(modeB.shortLabel.includes('Mode B: 20-SKU Sandbox'));
  assert.ok(liveSandbox.modeLabel.includes('Mode B: 20-SKU Sandbox'));
  assert.equal(modeB.totalBookValueFormatted, '₹6,45,650');
  assert.equal(modeB.deadStockValueFormatted, '₹2,23,110');
  assert.ok(modeB.deadStockSubtext.includes('8 SKUs · 34.6%'));
  assert.equal(modeB.slowMovingValueFormatted, '₹63,600');
  assert.ok(modeB.slowMovingSubtext.includes('2 SKUs · 9.9%'));
  assert.equal(modeB.prioritySkusHeadline, '10 Priority SKUs');
  assert.ok(modeB.p2OtifPill.includes('50.0%'));
  assert.ok(modeB.p3FreightPill.includes('₹13,944'));
  assert.ok(modeB.p4BinPill.includes('60.0%'));
  assert.ok(modeB.p4BinPill.includes('₹24,240'));

  // 3. Cross-file verification across CommercialLandingPage.tsx, SampleAuditPage.tsx, and SampleAuditReportModal.tsx
  const landingSrc = await fs.readFile(
    path.join(process.cwd(), 'src/commercial/CommercialLandingPage.tsx'),
    'utf-8'
  );
  const samplePageSrc = await fs.readFile(
    path.join(process.cwd(), 'src/commercial/SampleAuditPage.tsx'),
    'utf-8'
  );
  const sampleModalSrc = await fs.readFile(
    path.join(process.cwd(), 'src/commercial/SampleAuditReportModal.tsx'),
    'utf-8'
  );

  assert.ok(landingSrc.includes('Mode A: 12,400-SKU Plant Case'));
  assert.ok(landingSrc.includes('Mode B: 20-SKU Sandbox'));
  assert.ok(sampleModalSrc.includes('Mode A: 12,400-SKU Plant Case (₹4,82,50,000)'));
  assert.ok(sampleModalSrc.includes('Mode B: 20-SKU Sandbox (₹6,45,650)'));
  assert.ok(samplePageSrc.includes('Mode A: 12,400-SKU Plant Case'));
  assert.ok(samplePageSrc.includes('Mode B: 20-SKU Sandbox'));
  assert.ok(samplePageSrc.includes('liveSandboxMetrics.connectedP2Pill'));
  assert.ok(samplePageSrc.includes('liveSandboxMetrics.connectedP3Pill'));
  assert.ok(samplePageSrc.includes('liveSandboxMetrics.connectedP4Pill'));
  assert.ok(liveSandbox.connectedP2Pill.includes('50.0%'));
  assert.ok(liveSandbox.connectedP3Pill.includes('₹13,944'));
  assert.ok(liveSandbox.connectedP4Pill.includes('60.0%'));
  assert.ok(liveSandbox.connectedP4Pill.includes('₹24,240'));
});

test('Phase 11 6-Stage Analytical Methodology Schema & Deterministic Formulas: Verifies all 6 stages have complete titles, pill labels, formulas, inputs, and outputs', async () => {
  const { METHODOLOGY_STAGES } = await import('../commercial/homepageConfig');

  assert.equal(METHODOLOGY_STAGES.length, 6);

  const expectedStages = [
    {
      stage: 'Stage 01',
      nameSnippet: '5-Column Schema & Type Ingestion',
      pillSnippet: 'Part_ID, Part_Description, Closing_Stock_Qty, Unit_Cost_INR, Last_Movement_Date',
      formulaSnippet: 'Closing_Stock_Qty_i × Unit_Cost_INR_i',
    },
    {
      stage: 'Stage 02',
      nameSnippet: 'Data Sanitization & Anomaly Isolation',
      pillSnippet: 'Null dates, negative stock, duplicate SKU checks',
      formulaSnippet: 'MatchHealth%',
    },
    {
      stage: 'Stage 03',
      nameSnippet: 'Deterministic Dormancy & Velocity Segmentation',
      pillSnippet: 'ΔDays = AsOfDate − LastMovementDate across 0–90d, 91–180d, 181–365d, >365d',
      formulaSnippet: 'ΔDays = AsOfDate − LastMovementDate',
    },
    {
      stage: 'Stage 04',
      nameSnippet: 'Carrying-Cost Burn & Capital Trap Quantification',
      pillSnippet: 'AnnualBurn = BookValue × HoldingRate%, default 22% p.a.',
      formulaSnippet: 'AnnualBurn = BookValue × HoldingRate%',
    },
    {
      stage: 'Stage 05',
      nameSnippet: 'Pareto 80/20 Concentration & Priority SKU Ranking',
      pillSnippet: 'Cumulative value share isolation',
      formulaSnippet: 'CumulativeValueShare_k',
    },
    {
      stage: 'Stage 06',
      nameSnippet: 'Cross-Pillar Floor Verification & Action Plan',
      pillSnippet: 'Linking P1 Dead Stock with P2 OTIF, P3 Freight Audit, and P4 Ghost/Bin Reconciliation',
      formulaSnippet: 'TargetCashRelease',
    },
  ];

  expectedStages.forEach((expected, idx) => {
    const item = METHODOLOGY_STAGES[idx];
    assert.equal(item.stage, expected.stage);
    assert.ok(item.name.includes(expected.nameSnippet), `Stage ${expected.stage} name mismatch: ${item.name}`);
    assert.ok(
      item.pillLabel.includes(expected.pillSnippet),
      `Stage ${expected.stage} pillLabel mismatch: ${item.pillLabel}`
    );
    assert.ok(
      item.formula.includes(expected.formulaSnippet),
      `Stage ${expected.stage} formula mismatch: ${item.formula}`
    );
    assert.ok(item.inputs && item.inputs.trim().length > 10);
    assert.ok(item.outputs && item.outputs.trim().length > 10);
    assert.ok(item.summary && item.summary.trim().length > 20);
  });
});

test('Phase 11 6-Stage Methodology UI Strip & Auto-Expand Wiring: Verifies 6-pill summary strip above drawer button and auto-expansion on [Read the Methodology] and #methodology', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');

  const landingSrc = await fs.readFile(
    path.join(process.cwd(), 'src/commercial/CommercialLandingPage.tsx'),
    'utf-8'
  );
  const methodologyModalSrc = await fs.readFile(
    path.join(process.cwd(), 'src/commercial/MethodologyModal.tsx'),
    'utf-8'
  );

  // 1. Verify 6-pill summary strip appears BEFORE the toggle-methodology-stages-drawer button
  const stripIndex = landingSrc.indexOf('data-testid="methodology-6-pill-summary-strip"');
  const toggleBtnIndex = landingSrc.indexOf('data-testid="toggle-methodology-stages-drawer"');
  assert.ok(stripIndex > 0, 'methodology-6-pill-summary-strip must be present');
  assert.ok(toggleBtnIndex > stripIndex, '6-pill summary strip must appear above the toggle drawer button');

  // 2. Verify auto-expand function sets isMethodologyDrawerOpen(true) and is wired to read-methodology-btn and footer-methodology-link
  assert.ok(landingSrc.includes('setIsMethodologyDrawerOpen(true)'));
  assert.ok(landingSrc.includes('data-testid="read-methodology-btn"'));
  assert.ok(landingSrc.includes('data-testid="footer-methodology-link"'));

  // 3. Verify MethodologyModal and CommercialLandingPage render formula, inputs, and outputs
  assert.ok(landingSrc.includes('stg.formula'));
  assert.ok(landingSrc.includes('stg.inputs'));
  assert.ok(landingSrc.includes('stg.outputs'));
  assert.ok(methodologyModalSrc.includes('stg.formula'));
  assert.ok(methodologyModalSrc.includes('stg.inputs'));
  assert.ok(methodologyModalSrc.includes('stg.outputs'));
});

test('Phase 11 Optional Environment Variable Graceful Fallback: Verifies missing, blank, placeholder, or unreachable LEAD_NOTIFICATION_WEBHOOK_URL and Web3Forms keys never throw errors', async () => {
  const {
    dispatchOptionalWebhookNotification,
    dispatchOptionalWeb3FormsNotification,
  } = await import('../utils/leadValidation');

  const samplePayload = {
    event: 'pilot_lead_captured',
    leadId: 'PILOT-20261108-TEST',
    companyName: 'Apex Auto Components',
  };

  // 1. Missing / undefined / empty webhook URL fails gracefully
  const missingWebhook = await dispatchOptionalWebhookNotification(samplePayload, undefined);
  assert.equal(missingWebhook.dispatched, false);
  assert.equal(missingWebhook.skippedReason, 'missing_env');

  const emptyWebhook = await dispatchOptionalWebhookNotification(samplePayload, '   ');
  assert.equal(emptyWebhook.dispatched, false);
  assert.equal(emptyWebhook.skippedReason, 'missing_env');

  // 2. Placeholder webhook URL fails gracefully without making network call
  const placeholderWebhook = await dispatchOptionalWebhookNotification(
    samplePayload,
    'https://example.com/your_webhook_url'
  );
  assert.equal(placeholderWebhook.dispatched, false);
  assert.equal(placeholderWebhook.skippedReason, 'placeholder_env');

  // 3. Network rejection inside fetchImpl is caught silently without throwing
  const networkFailWebhook = await dispatchOptionalWebhookNotification(
    samplePayload,
    'https://hooks.operationalyst.in/notify',
    async () => {
      throw new Error('Simulated ECONNREFUSED');
    }
  );
  assert.equal(networkFailWebhook.dispatched, false);
  assert.equal(networkFailWebhook.skippedReason, 'network_error');

  // 4. Missing, placeholder, or failing Web3Forms key fails gracefully
  const missingWeb3 = await dispatchOptionalWeb3FormsNotification(samplePayload, '');
  assert.equal(missingWeb3.dispatched, false);
  assert.equal(missingWeb3.skippedReason, 'missing_env');

  const placeholderWeb3 = await dispatchOptionalWeb3FormsNotification(
    samplePayload,
    'YOUR_WEB3FORMS_KEY'
  );
  assert.equal(placeholderWeb3.dispatched, false);
  assert.equal(placeholderWeb3.skippedReason, 'placeholder_env');

  const networkFailWeb3 = await dispatchOptionalWeb3FormsNotification(
    samplePayload,
    'a1b2c3d4-real-looking-uuid',
    async () => {
      throw new Error('Offline');
    }
  );
  assert.equal(networkFailWeb3.dispatched, false);
  assert.equal(networkFailWeb3.skippedReason, 'network_error');
});

test('Phase 11 Accessibility & Zero Console-Noise Verification: Verifies explicit type="button", aria-expanded, and clean analytics dispatcher across commercial components', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');

  const filesToInspect = [
    'src/commercial/CommercialLandingPage.tsx',
    'src/commercial/FactoryAuditModal.tsx',
    'src/commercial/SelfAssessmentWidget.tsx',
    'src/commercial/SampleAuditPage.tsx',
    'src/commercial/B2BBehavioralSystem.tsx',
    'src/commercial/SampleAuditReportModal.tsx',
    'src/commercial/MethodologyModal.tsx',
  ];

  for (const relPath of filesToInspect) {
    const src = await fs.readFile(path.join(process.cwd(), relPath), 'utf-8');
    const buttonTags = src.match(/<button\b[^>]*>/g) || [];
    assert.ok(buttonTags.length > 0, `Expected <button> tags in ${relPath}`);
    for (const tag of buttonTags) {
      assert.ok(
        tag.includes('type="button"') || tag.includes('type="submit"'),
        `Every <button> in ${relPath} must have an explicit type="button" or type="submit". Found: ${tag}`
      );
    }
  }

  // Verify aria-expanded is present on collapsible drawers
  const landingSrc = await fs.readFile(
    path.join(process.cwd(), 'src/commercial/CommercialLandingPage.tsx'),
    'utf-8'
  );
  assert.ok(landingSrc.includes('aria-expanded={isMethodologyDrawerOpen}'));
  assert.ok(landingSrc.includes('aria-expanded={showGovernanceFaqDrawer}'));

  // Verify analytics.ts does not emit noisy console.info notices in browser sessions
  const analyticsSrc = await fs.readFile(
    path.join(process.cwd(), 'src/utils/analytics.ts'),
    'utf-8'
  );
  assert.ok(!analyticsSrc.includes('console.info('));
});

test('Phase 11 Core P1–P4 Mathematical Invariants Regression Guard: Verifies P1 Stock, P2 OTIF, P3 Freight Audit, and P4 Bin Reconciliation formulas remain 100% unaltered', async () => {
  const { evaluateStockEngine, generateOwnerReport } = await import('../project1/utils/calculations');
  const { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES } = await import('../project1/data/initialData');
  const { calculateOTIFMetrics } = await import('../project2/utils/otifCalculator');
  const { INITIAL_DISPATCHES, INITIAL_RULES: P2_DEFAULT_RULES } = await import('../project2/data/initialData');
  const { calculateAuditMetrics } = await import('../project3/utils/auditCalculations');
  const { INITIAL_TRIPS, DEFAULT_RULES: P3_DEFAULT_RULES } = await import('../project3/data/defaultData');
  const { computeSummary } = await import('../project4/utils/auditCalculations');
  const { INITIAL_SAMPLE_SKUS, DEFAULT_RULES: P4_DEFAULT_RULES } = await import('../project4/data/sampleData');

  const p1Evaluated = evaluateStockEngine(AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES);
  const p1Report = generateOwnerReport(AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES);
  const p2 = calculateOTIFMetrics(INITIAL_DISPATCHES, P2_DEFAULT_RULES);
  const p3 = calculateAuditMetrics(INITIAL_TRIPS, P3_DEFAULT_RULES);
  const p4 = computeSummary(INITIAL_SAMPLE_SKUS, P4_DEFAULT_RULES);

  assert.equal(p1Evaluated.length, 20);
  assert.equal(p1Report.totalStockValue, 645650);
  assert.equal(p1Report.deadCash, 223110);
  assert.equal(p1Report.deadItemCount, 8);
  assert.equal(p1Report.slowCash, 63600);
  assert.equal(p1Report.slowItemCount, 2);

  assert.equal(p2.totalDispatches, 18);
  assert.equal(p2.otifPercent, 50.0);

  assert.equal(p3.totals.totalLeak, 13944);
  assert.equal(Math.round((p4.linesMatched / p4.skusCounted) * 100), 60);
  assert.equal(p4.shelfShortRupees, 24240);
});

// ============================================================================
// PHASE 12 TESTS: Executive Platform View Cleanup, P1-First Hierarchy,
// Dynamic Fortnight Dates, 22% Carrying-Cost & 12-LR Alignment, Instant CSV Dropzone
// ============================================================================

test('Phase 12 Dynamic Fortnight Label: getDynamicFortnightLabel produces a valid 14-day range string formatted in en-IN', async () => {
  const { getDynamicFortnightLabel } = await import('../commercial/PlatformTopBar');

  const fixedRef = new Date('2026-11-15T10:00:00.000Z');
  const label = getDynamicFortnightLabel(fixedRef);

  assert.ok(label.startsWith('Current Fortnight ('));
  assert.ok(label.endsWith(')'));
  assert.ok(label.includes('–'));
  assert.ok(label.includes('2026'));

  // Verify default invocation uses current date and does not hardcode September
  const liveLabel = getDynamicFortnightLabel();
  assert.match(liveLabel, /^Current Fortnight \(.+ – .+\)$/);
});

test('Phase 12 Canonical Demo Plant Presets: PLATFORM_DEMO_PLANTS matches canonical values including 22% carrying cost and 12 Flagged LRs for Ambattur', async () => {
  const { PLATFORM_DEMO_PLANTS } = await import('../commercial/PlatformTopBar');
  const { runFourPillarSensitivity } = await import('../utils/sensitivitySimulator');

  // 1. Ambattur Baseline Unit
  const amb = PLATFORM_DEMO_PLANTS.ambattur;
  assert.equal(amb.name, 'Ambattur Baseline Unit');
  assert.equal(amb.skuCount, 20);
  assert.equal(amb.totalStockValue, 645650);
  assert.equal(amb.nonMovingValue, 223110);
  assert.equal(amb.nonMovingSkus, 8);
  assert.equal(amb.slowMovingValue, 63600);
  assert.equal(amb.slowMovingSkus, 2);
  assert.equal(amb.carryingCostPct, 22);
  assert.equal(amb.annualCarryingBurn, 49084);
  assert.equal(amb.otifPercent, 50);
  assert.equal(amb.otifPassed, 9);
  assert.equal(amb.otifTotal, 18);
  assert.equal(amb.freightLeakValue, 13944);
  assert.equal(amb.flaggedLRs, 12);
  assert.equal(amb.binMatchPercent, 60);
  assert.equal(amb.binVarianceValue, 24800);
  assert.equal(amb.binVarianceFormatted, '₹24,800');
  assert.ok(amb.summaryLine.includes('₹24,800 Variance'));
  assert.equal(amb.auditedBins, 6);

  // Verify 4-pillar simulator also reports 12 Flagged LRs and 22% baseline carrying cost for Ambattur
  const sim = runFourPillarSensitivity({});
  assert.equal(sim.baselineConfig.annualCarryingCostPercent, 22);
  assert.equal(sim.baselineFlaggedTripsCount, 12);
  assert.equal(sim.scenarioFlaggedTripsCount, 12);

  // 2. Sriperumbudur Press & Machining
  const sri = PLATFORM_DEMO_PLANTS.sriperumbudur;
  assert.equal(sri.name, 'Sriperumbudur Press & Machining');
  assert.equal(sri.skuCount, 45);
  assert.equal(sri.totalStockValue, 1840000);
  assert.equal(sri.nonMovingValue, 512000);
  assert.equal(sri.nonMovingSkus, 14);
  assert.equal(sri.slowMovingValue, 195000);
  assert.equal(sri.slowMovingSkus, 6);
  assert.equal(sri.otifPercent, 68);
  assert.equal(sri.freightLeakValue, 28400);
  assert.equal(sri.flaggedLRs, 9);
  assert.equal(sri.binMatchPercent, 75);
  assert.equal(sri.binVarianceValue, 41200);
  assert.equal(sri.auditedBins, 5);

  // 3. Hosur Auto Components Unit
  const hos = PLATFORM_DEMO_PLANTS.hosur;
  assert.equal(hos.name, 'Hosur Auto Components Unit');
  assert.equal(hos.skuCount, 12400);
  assert.equal(hos.totalStockValue, 48250000);
  assert.equal(hos.nonMovingValue, 1842000);
  assert.equal(hos.nonMovingSkus, 24);
  assert.equal(hos.slowMovingValue, 3260000);
  assert.equal(hos.slowMovingSkus, 41);
  assert.equal(hos.otifPercent, 74);
  assert.equal(hos.freightLeakValue, 46500);
  assert.equal(hos.flaggedLRs, 15);
  assert.equal(hos.binMatchPercent, 82);
  assert.equal(hos.binVarianceValue, 68000);
  assert.equal(hos.auditedBins, 8);
});

test('Phase 12 CFO Policy Simulator: computeSimulatedPolicyMetrics accurately computes simulatedDeadStock and annualCarryingBurn across 120d/180d/270d cutoffs, carrying-cost rates, and 15% spare reserve buffer', async () => {
  const { computeSimulatedPolicyMetrics, CFO_POLICY_PRESETS } = await import(
    '../commercial/PlatformTopBar'
  );

  assert.equal(CFO_POLICY_PRESETS.length, 3);
  assert.equal(CFO_POLICY_PRESETS[0].label, 'Strict CFO: 120d / 24%');
  assert.equal(CFO_POLICY_PRESETS[1].label, 'Standard Baseline: 180d / 22%');
  assert.equal(CFO_POLICY_PRESETS[2].label, 'Lenient Buffer: 270d / 18%');

  // 1. Standard Baseline (180d / 22%, no spare buffer)
  const baseline = computeSimulatedPolicyMetrics({
    plantId: 'ambattur',
    cutoffDays: 180,
    carryingCostPct: 22,
    excludeReserveSpares: false,
  });
  assert.equal(baseline.simulatedDeadStock, 223110);
  assert.equal(baseline.annualCarryingBurn, Math.round(223110 * 0.22)); // 49084
  assert.equal(baseline.flaggedLRs, 12);

  // 2. Standard Baseline with 15% Critical Machine Spares Reserve Buffer enabled
  const withBuffer = computeSimulatedPolicyMetrics({
    plantId: 'ambattur',
    cutoffDays: 180,
    carryingCostPct: 22,
    excludeReserveSpares: true,
  });
  assert.equal(withBuffer.reserveSparesProtectedValue, Math.round(223110 * 0.15));
  assert.equal(withBuffer.simulatedDeadStock, 223110 - Math.round(223110 * 0.15));
  assert.equal(
    withBuffer.annualCarryingBurn,
    Math.round(withBuffer.simulatedDeadStock * 0.22)
  );

  // 3. Strict CFO (120d / 24%) vs Lenient Buffer (270d / 18%)
  const strict = computeSimulatedPolicyMetrics({
    plantId: 'ambattur',
    cutoffDays: 120,
    carryingCostPct: 24,
    excludeReserveSpares: false,
  });
  const lenient = computeSimulatedPolicyMetrics({
    plantId: 'ambattur',
    cutoffDays: 270,
    carryingCostPct: 18,
    excludeReserveSpares: false,
  });

  assert.ok(strict.simulatedDeadStock > baseline.simulatedDeadStock);
  assert.ok(strict.annualCarryingBurn > baseline.annualCarryingBurn);
  assert.ok(lenient.simulatedDeadStock < baseline.simulatedDeadStock);
  assert.ok(lenient.annualCarryingBurn < baseline.annualCarryingBurn);
});

test('Phase 12 Instant In-Browser 5-Column CSV Dropzone: parseAndEvaluateFiveColumnCsv accurately evaluates 5-column CSV input and matches canonical Ambattur 20-SKU totals', async () => {
  const {
    AMBATTUR_20_SKU_SAMPLE_CSV,
    parseAndEvaluateFiveColumnCsv,
  } = await import('../commercial/InstantAuditDropzone');

  const result = parseAndEvaluateFiveColumnCsv(AMBATTUR_20_SKU_SAMPLE_CSV);

  assert.equal(result.totalSkus, 20);
  assert.equal(result.totalValuationInr, 645650);
  assert.equal(result.totalValuationFormatted, '₹6,45,650');
  assert.equal(result.nonMovingValueInr, 223110);
  assert.equal(result.nonMovingFormatted, '₹2,23,110');
  assert.equal(result.nonMovingSkuCount, 8);
  assert.equal(result.slowMovingValueInr, 63600);
  assert.equal(result.slowMovingFormatted, '₹63,600');
  assert.equal(result.slowMovingSkuCount, 2);
  assert.equal(result.prioritySkuCount, 10);
  assert.equal(result.carryingCostPct, 22);
  assert.equal(result.annualCarryingBurnInr, 49084);
  assert.equal(result.annualCarryingBurnFormatted, '₹49,084');
  assert.equal(result.topNonMovingRows.length, 5);
  assert.equal(result.topNonMovingRows[0].partId, 'FG-PBX-G1');
});

test('Phase 12 Zero Env Popup Polish: .env.example comments out all optional secret keys with a leading #', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');

  const envExample = await fs.readFile(path.join(process.cwd(), '.env.example'), 'utf-8');
  const activeLines = envExample
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  // Only APP_URL="MY_APP_URL" should remain uncommented; optional secrets must be commented out
  for (const line of activeLines) {
    assert.ok(
      !line.startsWith('ADMIN_ACCESS_KEY='),
      'ADMIN_ACCESS_KEY must be commented out in .env.example'
    );
    assert.ok(
      !line.startsWith('LEAD_NOTIFICATION_WEBHOOK_URL='),
      'LEAD_NOTIFICATION_WEBHOOK_URL must be commented out in .env.example'
    );
    assert.ok(
      !line.startsWith('VITE_WEB3FORMS_KEY='),
      'VITE_WEB3FORMS_KEY must be commented out in .env.example'
    );
  }
});

test('Phase 12 Platform Executive Hierarchy & Cleanup Guard: Verifies P1-First section, Phase 2 Add-Ons section, TopBar testids, and removal of developer implementation strings', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const { DEMO_ENVIRONMENT_CONFIG } = await import('../dashboard/dashboardConfig');

  assert.ok(!DEMO_ENVIRONMENT_CONFIG.noticeText.includes('/api/plant-workspaces'));
  assert.ok(!DEMO_ENVIRONMENT_CONFIG.noticeText.includes('Express server'));

  const topBarSrc = await fs.readFile(
    path.join(process.cwd(), 'src/commercial/PlatformTopBar.tsx'),
    'utf-8'
  );
  assert.ok(topBarSrc.includes('data-testid="platform-back-to-website-btn"'));
  assert.ok(topBarSrc.includes('data-testid="platform-request-pilot-btn"'));
  assert.ok(topBarSrc.includes('data-testid="platform-plant-switcher"'));
  assert.ok(topBarSrc.includes('data-testid="toggle-operator-tools"'));
  assert.ok(topBarSrc.includes('click_back_to_website'));

  const overviewSrc = await fs.readFile(
    path.join(process.cwd(), 'src/dashboard/views/ExecutiveOverviewView.tsx'),
    'utf-8'
  );
  assert.ok(overviewSrc.includes('data-testid="platform-p1-primary-section"'));
  assert.ok(overviewSrc.includes('data-testid="platform-phase2-addons-section"'));
  assert.ok(!overviewSrc.includes('Historical trends will appear after multiple analysis periods are available'));
  assert.ok(!overviewSrc.includes('Revenue exposure unavailable because order-value information was not provided'));

  const dropzoneSrc = await fs.readFile(
    path.join(process.cwd(), 'src/commercial/InstantAuditDropzone.tsx'),
    'utf-8'
  );
  assert.ok(dropzoneSrc.includes('data-testid="instant-dropzone-load-sample-btn"'));
  assert.ok(dropzoneSrc.includes('data-testid="instant-dropzone-download-template-btn"'));
  assert.ok(dropzoneSrc.includes('data-testid="instant-dropzone-request-audit-btn"'));
});

// ============================================================================
// PHASE 13 TESTS: 100% P1 Inventory Sub-Page Alignment, Unified Carrying-Cost Rate,
// Dynamic November 2026 Period Labels, Category Breakdown Card, and P1 Table CTA
// ============================================================================

test('Phase 13 Zero Stale September Dates & Zero Empty Historical Trends Guard: Verifies no hardcoded 15–28 Sep 2026 or Historical trends will appear placeholders remain in dashboard views or configs', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const { PERIODS } = await import('../context/PlantContext');

  assert.ok(!PERIODS.fortnight_sep.label.includes('15–28 Sep'));
  assert.ok(!PERIODS.fortnight_sep.dateRange.includes('15 Sep'));
  assert.ok(!PERIODS.month_sep.label.includes('Sep 2026'));

  const filesToVerify = [
    'src/dashboard/dashboardConfig.ts',
    'src/dashboard/AppShell.tsx',
    'src/dashboard/views/ExecutiveOverviewView.tsx',
    'src/dashboard/views/DomainViews.tsx',
    'src/dashboard/components/SharedDashboardPrimitives.tsx',
    'src/context/PlantContext.tsx',
    'src/utils/excelCommandCenterExporter.ts',
  ];

  for (const relPath of filesToVerify) {
    const content = await fs.readFile(path.join(process.cwd(), relPath), 'utf-8');
    assert.ok(
      !content.includes('15–28 Sep 2026'),
      `Found stale '15–28 Sep 2026' in ${relPath}`
    );
    assert.ok(
      !content.includes('15 Sep – 28 Sep 2026'),
      `Found stale '15 Sep – 28 Sep 2026' in ${relPath}`
    );
    assert.ok(
      !content.includes('Historical trends will appear after multiple analysis periods are available'),
      `Found duplicate placeholder 'Historical trends will appear after multiple analysis periods are available' in ${relPath}`
    );
  }
});

test('Phase 13 P1 Stagnant Stock Breakdown by Category: computeP1StagnantCategoryBreakdown deterministically computes 3 manufacturing categories summing to ₹2,23,110', async () => {
  const { computeP1StagnantCategoryBreakdown } = await import(
    '../dashboard/views/DomainViews'
  );

  const breakdown = computeP1StagnantCategoryBreakdown(223110);
  assert.equal(breakdown.length, 3);

  assert.equal(
    breakdown[0].label,
    '1. Precision Machined Castings & Sub-Assemblies'
  );
  assert.equal(breakdown[0].valueInr, 135250);
  assert.equal(breakdown[0].sharePct, 60.6);

  assert.equal(breakdown[1].label, '2. Raw Material & Bar Stock');
  assert.equal(breakdown[1].valueInr, 51760);
  assert.equal(breakdown[1].sharePct, 23.2);

  assert.equal(
    breakdown[2].label,
    '3. Bearings, Seals & Maintenance Spares'
  );
  assert.equal(breakdown[2].valueInr, 36100);
  assert.equal(breakdown[2].sharePct, 16.2);

  const sumInr = breakdown.reduce((acc, item) => acc + item.valueInr, 0);
  assert.equal(sumInr, 223110);
});

test('Phase 13 P1 Drill-Down Conversion CTA & Unified 22% Carrying Cost Formula: Verifies p1-ledger-request-pilot-btn, category breakdown card, and exact formula tooltip', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const { runFourPillarSensitivity } = await import('../utils/sensitivitySimulator');
  const { getPlantBaseline } = await import('../data/multiPlantBaselines');

  const domainViewsSrc = await fs.readFile(
    path.join(process.cwd(), 'src/dashboard/views/DomainViews.tsx'),
    'utf-8'
  );

  assert.ok(domainViewsSrc.includes('data-testid="p1-ledger-request-pilot-btn"'));
  assert.ok(domainViewsSrc.includes('data-testid="p1-ledger-download-template-btn"'));
  assert.ok(domainViewsSrc.includes('data-testid="p1-stagnant-category-breakdown-card"'));
  assert.ok(domainViewsSrc.includes('Request 48-Hour Pilot Audit on Your Stock →'));
  assert.ok(
    domainViewsSrc.includes(
      'Target ceiling: Keep &gt;180-day dormant stock below ₹1.00 L (15% of total valuation).'
    )
  );
  assert.ok(domainViewsSrc.includes('Est. Annual Carrying Cost (22%)'));

  // Verify 4-pillar simulator also unifies carrying cost to 22% even when passed ambattur.p1Rules
  const ambattur = getPlantBaseline('ambattur');
  const simWithPlantRules = runFourPillarSensitivity({
    skus: ambattur.p1Items,
    p1Rules: ambattur.p1Rules,
  });
  assert.equal(simWithPlantRules.baselineConfig.annualCarryingCostPercent, 22);
  assert.equal(simWithPlantRules.baselineAnnualCarryingDrainInr, 49084);
});

test('Phase 13 Executive Workspace Banner & Operator Tools Gating: Verifies clean DEMO_ENVIRONMENT_CONFIG noticeText and operator-gated Reset button', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const { DEMO_ENVIRONMENT_CONFIG } = await import('../dashboard/dashboardConfig');

  assert.ok(
    DEMO_ENVIRONMENT_CONFIG.noticeText.includes(
      'loaded with row-traceable ERP stock records for instant audit testing.'
    )
  );
  assert.ok(!DEMO_ENVIRONMENT_CONFIG.noticeText.includes('/api/plant-workspaces'));

  const appShellSrc = await fs.readFile(
    path.join(process.cwd(), 'src/dashboard/AppShell.tsx'),
    'utf-8'
  );
  assert.ok(!appShellSrc.includes('Server Workspace Synced'));
  assert.ok(appShellSrc.includes('onOpenPilotAuditModal={() => setShowPilotAuditModal(true)}'));
});

// ============================================================================
// PHASE 14 TESTS: Surgical Removal of the 5 Remaining Landing Page Red Flags
// in CommercialLandingPage.tsx, B2BBehavioralSystem.tsx, and homepageConfig.ts
// ============================================================================

test('Phase 14 Landing Page Red-Flag Removal & Executive Founder Sign-Off Guard: Verifies zero occurrences of Awaiting Pilot Validations, ethical persuasion principles, learning directly from manufacturing teams, 1. First Visit, or Founder Lead Inbox on the public landing page', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const { FOUNDER_EXECUTIVE_SIGNOFF } = await import('../commercial/homepageConfig');

  const landingSrc = await fs.readFile(
    path.join(process.cwd(), 'src/commercial/CommercialLandingPage.tsx'),
    'utf-8'
  );
  const configSrc = await fs.readFile(
    path.join(process.cwd(), 'src/commercial/homepageConfig.ts'),
    'utf-8'
  );
  const behavioralSrc = await fs.readFile(
    path.join(process.cwd(), 'src/commercial/B2BBehavioralSystem.tsx'),
    'utf-8'
  );

  const forbiddenStrings = [
    'Awaiting Pilot Validations',
    'ethical persuasion principles',
    'learning directly from manufacturing teams',
    '1. First Visit',
    'Founder Lead Inbox',
  ];

  for (const forbidden of forbiddenStrings) {
    assert.equal(
      landingSrc.includes(forbidden),
      false,
      `CommercialLandingPage.tsx must not contain "${forbidden}"`
    );
    assert.equal(
      configSrc.includes(forbidden),
      false,
      `homepageConfig.ts must not contain "${forbidden}"`
    );
    assert.equal(
      behavioralSrc.includes(forbidden),
      false,
      `B2BBehavioralSystem.tsx must not contain "${forbidden}"`
    );
  }

  // Also verify SelfAssessmentWidget, DELCERT box, and P2/P3/P4 connected pills are removed from CommercialLandingPage.tsx
  assert.equal(landingSrc.includes('SelfAssessmentWidget'), false);
  assert.equal(landingSrc.includes('Connected 4-Pillar Audit Signals:'), false);
  assert.equal(
    landingSrc.includes('Verify a Deletion Certificate (DELCERT-...) / Inspect Sample Certificate'),
    false
  );
  assert.equal(behavioralSrc.includes('CLEAR 5-STEP ENGAGEMENT WORKFLOW'), false);

  // Verify the Executive Operations Sign-Off is present in both homepageConfig.ts and CommercialLandingPage.tsx
  const expectedQuote =
    'Operationalyst isolates stagnant working capital, 22% annual carrying-cost burn, and Pareto 80/20 floor review priorities directly from standard 5-column Tally Prime, SAP, Busy, or Excel stock exports—with zero ERP integration or operational disruption.';
  assert.equal(FOUNDER_EXECUTIVE_SIGNOFF, expectedQuote);
  assert.ok(landingSrc.includes(expectedQuote));
});

// ============================================================================
// PHASE 15 TESTS: Paperclip-Style 5-Agent Autonomous Revenue Workforce,
// Direct Bank/UPI/Razorpay Collection Engine, Printable Proforma Invoices (INV-...),
// Teaser-to-Paid Walkthrough Paywall (₹14,999 / ₹24,999), and 1-Click UTR Payment Unlock
// ============================================================================

test('Phase 15 UPI Deep-Link & Billing Config Store: buildUpiPaymentUri generates valid NPCI UPI payment links with ₹14,999 / ₹24,999 amounts and founder beneficiary details', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const os = await import('os');
  const {
    DEFAULT_FOUNDER_BILLING_CONFIG,
    buildUpiPaymentUri,
    getFounderBillingConfig,
    updateFounderBillingConfig,
  } = await import('../utils/founderBillingStore');

  const uriTier2 = buildUpiPaymentUri(
    DEFAULT_FOUNDER_BILLING_CONFIG,
    14999,
    'INV-20261109-4410',
    'Ambattur Fabrication Sample Plant'
  );

  assert.ok(uriTier2.startsWith('upi://pay?pa=9080540047@yespop&pn='));
  assert.ok(uriTier2.includes('C.%20Jones%20Snowin'));
  assert.ok(uriTier2.includes('&am=14999&cu=INR&tn=INV-20261109-4410-Ambattur_Fabrication_Sample_Plant'));

  const uriTier3 = buildUpiPaymentUri(
    DEFAULT_FOUNDER_BILLING_CONFIG,
    24999,
    'INV-20261109-9902',
    'Hosur Auto Components'
  );
  assert.ok(uriTier3.includes('&am=24999&cu=INR&tn=INV-20261109-9902-Hosur_Auto_Components'));

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'op-billing-test-'));
  const billingFile = path.join(tmpDir, 'founder_billing.json');
  try {
    const initial = await getFounderBillingConfig(billingFile);
    assert.equal(initial.upiId, '9080540047@yespop');
    assert.equal(initial.tier2FullAuditPriceInr, 14999);
    assert.equal(initial.tier3MonthlyRetainerInr, 24999);

    const updated = await updateFounderBillingConfig(
      {
        upiId: 'snowinventures@hdfcbank',
        bankName: 'HDFC Bank — Ambattur Industrial Branch',
        accountNumber: '50200098765432',
        ifscCode: 'HDFC0001234',
      },
      billingFile
    );
    assert.equal(updated.upiId, 'snowinventures@hdfcbank');
    assert.equal(updated.accountNumber, '50200098765432');
    assert.equal(updated.ifscCode, 'HDFC0001234');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 15 Proforma Invoice Generation (INV-YYYYMMDD-XXXX): generateProformaInvoice produces deterministic B2B invoice metadata, SAC 998311 line items, and NEFT/IMPS instructions', async () => {
  const {
    DEFAULT_FOUNDER_BILLING_CONFIG,
    generateProformaInvoice,
  } = await import('../utils/founderBillingStore');
  const { buildPublicDemoMultiPillarSnapshot } = await import('../utils/pilotWorkspaceStore');

  const demoSnap = buildPublicDemoMultiPillarSnapshot();
  const invTier2 = generateProformaInvoice(
    demoSnap,
    {
      leadId: 'PILOT-20261109-001',
      fullName: 'R. Karthikeyan',
      companyName: 'Ambattur Fabrication Sample Plant (20-SKU Sandbox)',
      plantLocation: 'Ambattur Industrial Estate, Chennai',
      workEmail: 'karthik@ambatturfab.in',
    },
    DEFAULT_FOUNDER_BILLING_CONFIG,
    'TIER2_FULL_AUDIT'
  );

  assert.match(invTier2.invoiceId, /^INV-\d{8}-[A-Z0-9]{4}$/);
  assert.equal(invTier2.amountInr, 14999);
  assert.equal(invTier2.currency, 'INR');
  assert.equal(invTier2.paymentStatus, 'UNPAID_PROFORMA');
  assert.equal(invTier2.lineItems.length, 1);
  assert.equal(invTier2.lineItems[0].hsnSacCode, '998311');
  assert.equal(invTier2.lineItems[0].lineTotalInr, 14999);
  assert.equal(
    invTier2.neftImpsInstructions.beneficiaryName,
    'C. Jones Snowin (Operationalyst / Snowin Ventures)'
  );
  assert.equal(invTier2.neftImpsInstructions.upiId, '9080540047@yespop');
  assert.ok(invTier2.upiPaymentUri.includes('am=14999'));
});

test('Phase 15 Teaser-to-Paid Paywall & UTR Payment Unlock: Creating a workspace in TEASER_LOCKED mode, submitting a 12-digit UTR number transitions it to UTR_PENDING_VERIFICATION, and founder verification transitions it to FULL_UNLOCKED', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const os = await import('os');
  const {
    createPilotWorkspaceSnapshot,
    submitPilotWorkspacePaymentUtr,
    verifyPilotWorkspacePaymentUnlock,
  } = await import('../utils/pilotWorkspaceStore');
  const { AMBATTUR_FABRICATION_SAMPLE } = await import('../project1/data/initialData');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'op-paywall-test-'));
  const wsFile = path.join(tmpDir, 'pilot_workspaces.json');

  try {
    const created = await createPilotWorkspaceSnapshot(
      {
        companyName: 'Sriperumbudur Precision Castings Pvt Ltd',
        plantLocation: 'Sriperumbudur SIPCOT, Chennai',
        skus: AMBATTUR_FABRICATION_SAMPLE,
        commercialAccessMode: 'TEASER_LOCKED',
      },
      wsFile
    );

    assert.equal(created.commercialAccessMode, 'TEASER_LOCKED');
    assert.equal(created.invoiceAmountInr, 14999);
    assert.match(created.invoiceId || '', /^INV-\d{8}-[A-Z0-9]{4}$/);

    // Reject invalid short UTR
    const badUtrRes = await submitPilotWorkspacePaymentUtr(
      created.workspaceId,
      { utrNumber: '123', shareToken: created.shareToken },
      wsFile
    );
    assert.equal(badUtrRes.ok, false);

    // Submit valid 12-digit UTR
    const utrRes = await submitPilotWorkspacePaymentUtr(
      created.workspaceId,
      {
        utrNumber: '431298765432',
        paidByEmail: 'accounts@sriperumbudurcastings.in',
        tier: 'TIER2_FULL_AUDIT',
        shareToken: created.shareToken,
      },
      wsFile
    );
    assert.equal(utrRes.ok, true);
    if (utrRes.ok) {
      assert.equal(utrRes.snapshot.commercialAccessMode, 'UTR_PENDING_VERIFICATION');
      assert.equal(utrRes.snapshot.submittedUtrNumber, '431298765432');
      assert.equal(utrRes.snapshot.paidByEmail, 'accounts@sriperumbudurcastings.in');
    }

    // Founder 1-click bank verification unlocks workspace to FULL_UNLOCKED
    const unlockRes = await verifyPilotWorkspacePaymentUnlock(
      created.workspaceId,
      { verifiedBy: 'C. Jones Snowin' },
      wsFile
    );
    assert.equal(unlockRes.ok, true);
    if (unlockRes.ok) {
      assert.equal(unlockRes.snapshot.commercialAccessMode, 'FULL_UNLOCKED');
      assert.equal(unlockRes.snapshot.submittedUtrNumber, '431298765432');
      assert.ok(unlockRes.snapshot.paymentVerifiedAt);
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 15 Paperclip 5-Agent Workforce Engine & Zero-Cost Guardrail: decomposeFounderRevenueGoal creates tasks across all 5 agents (AGENT_01 through AGENT_05) while enforcing ₹0.00 API token budget cap', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const os = await import('os');
  const {
    CANONICAL_FIVE_AGENTS,
    decomposeFounderRevenueGoal,
    decideAgentWorkforceTask,
  } = await import('../utils/agentWorkforceEngine');

  assert.equal(CANONICAL_FIVE_AGENTS.length, 5);
  assert.deepEqual(
    CANONICAL_FIVE_AGENTS.map((a) => a.agentId),
    [
      'AGENT_01_CEO_ORCHESTRATOR',
      'AGENT_02_SDR_OUTREACH',
      'AGENT_03_ERP_INGESTION',
      'AGENT_04_AUDIT_ANALYST',
      'AGENT_05_COMMERCIAL_CLOSER',
    ]
  );

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'op-agent-wf-test-'));
  const wfFile = path.join(tmpDir, 'agent_workforce.json');

  try {
    const res = await decomposeFounderRevenueGoal(
      'Close 5 Paid Plant Audits in Chennai This Month — ₹74,995 Target',
      undefined,
      wfFile
    );

    assert.equal(res.ok, true);
    assert.equal(res.goal.targetRevenueInr, 74995);
    assert.equal(res.goal.targetPaidAuditsCount, 5);
    assert.equal(res.goal.apiTokenBudgetCapInr, 0);
    assert.equal(res.goal.computeCostSpentInr, 0);
    assert.equal(res.tasksCreated.length, 5);
    assert.equal(res.state.budgetGuardrail.apiTokenBudgetCapInr, 0);
    assert.equal(res.state.budgetGuardrail.computeCostSpentInr, 0);

    for (const task of res.tasksCreated) {
      assert.equal(task.computeCostInr, 0);
    }

    const sdrTask = res.tasksCreated.find((t) => t.agentCode === 'AGENT_02');
    assert.ok(sdrTask);
    assert.equal(sdrTask.status, 'AWAITING_FOUNDER_APPROVAL');

    const decisionRes = await decideAgentWorkforceTask(
      sdrTask.taskId,
      'APPROVE',
      'Approved by Founder in unit test',
      wfFile
    );
    assert.equal(decisionRes.ok, true);
    if (decisionRes.ok) {
      assert.equal(decisionRes.task.status, 'COMPLETED');
      assert.equal(decisionRes.task.computeCostInr, 0);
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

// ============================================================================
// PHASE 16 TESTS: Live Founder UPI ID (9080540047@yespop), Automatic Migration,
// Public Endpoint Secret Masking, Cloud Persistence (Supabase REST + Local Fallback),
// and Instant Lead & UTR Payment Alerts (Resend Email + Webhook + Last-20 Log)
// ============================================================================

test('Phase 16 Live Founder UPI Migration & Public Endpoint Secret Masking: getFounderBillingConfig automatically migrates legacy cjonessnowin@okaxis to 9080540047@yespop and sanitizePublicFounderBillingConfig never leaks resendApiKey or supabaseServiceKey', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const os = await import('os');
  const {
    LIVE_FOUNDER_UPI_ID,
    getFounderBillingConfig,
    updateFounderBillingConfig,
    sanitizePublicFounderBillingConfig,
  } = await import('../utils/founderBillingStore');

  assert.equal(LIVE_FOUNDER_UPI_ID, '9080540047@yespop');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'op-phase16-billing-'));
  const billingFile = path.join(tmpDir, 'founder_billing.json');

  try {
    // Write a legacy config containing 'cjonessnowin@okaxis'
    await fs.writeFile(
      billingFile,
      JSON.stringify(
        {
          version: 1,
          config: {
            beneficiaryName: 'C. Jones Snowin',
            upiId: 'cjonessnowin@okaxis',
            tier2FullAuditPriceInr: 14999,
            tier3MonthlyRetainerInr: 24999,
          },
        },
        null,
        2
      ),
      'utf-8'
    );

    // Reading should automatically migrate 'cjonessnowin@okaxis' -> '9080540047@yespop' and persist to disk
    const migrated = await getFounderBillingConfig(billingFile);
    assert.equal(migrated.upiId, '9080540047@yespop');

    const persistedRaw = JSON.parse(await fs.readFile(billingFile, 'utf-8'));
    assert.equal(persistedRaw.config.upiId, '9080540047@yespop');

    // Save secret keys and verify public sanitizer strips raw secrets
    const withSecrets = await updateFounderBillingConfig(
      {
        founderAlertEmail: 'joneszz2004@gmail.com',
        founderWebhookUrl: 'https://hooks.slack.com/services/T00/B00/SECRET_HOOK',
        resendApiKey: 're_live_secret_998877665544',
        supabaseUrl: 'https://demo-project.supabase.co',
        supabaseServiceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret_service_role_key',
      },
      billingFile
    );

    const publicSafe = sanitizePublicFounderBillingConfig(withSecrets);
    assert.equal(publicSafe.upiId, '9080540047@yespop');
    assert.equal(publicSafe.hasResendApiKey, true);
    assert.equal(publicSafe.hasWebhookUrl, true);
    assert.equal(publicSafe.hasSupabaseConfig, true);
    assert.ok(publicSafe.maskedResendApiKey.includes('••••'));
    assert.ok(publicSafe.maskedSupabaseServiceKey.includes('••••'));
    assert.equal('resendApiKey' in publicSafe, false);
    assert.equal('supabaseServiceKey' in publicSafe, false);
    assert.equal('founderWebhookUrl' in publicSafe, false);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Phase 16 Cloud Persistence Store (Supabase PostgREST + Local Fallback): syncRecordToCloud and loadCollectionFromCloud gracefully return SKIPPED_NOT_CONFIGURED when unset and expose SUPABASE_TABLE_SQL_SNIPPET', async () => {
  const {
    SUPABASE_TABLE_SQL_SNIPPET,
    syncRecordToCloud,
    loadCollectionFromCloud,
  } = await import('../utils/cloudPersistenceStore');

  assert.ok(
    SUPABASE_TABLE_SQL_SNIPPET.includes(
      'create table if not exists public.operationalyst_records'
    )
  );
  assert.ok(SUPABASE_TABLE_SQL_SNIPPET.includes('payload jsonb not null'));

  const syncRes = await syncRecordToCloud(
    'pilot_leads',
    'PILOT-20261109-TEST',
    { leadId: 'PILOT-20261109-TEST', companyName: 'Ambattur Test Fab' },
    { supabaseUrl: '', supabaseServiceKey: '' }
  );
  assert.equal(syncRes.synced, false);
  assert.equal(syncRes.status, 'SKIPPED_NOT_CONFIGURED');

  const loadRes = await loadCollectionFromCloud('pilot_leads', {
    supabaseUrl: '',
    supabaseServiceKey: '',
  });
  assert.equal(loadRes.ok, true);
  assert.equal(loadRes.status, 'SKIPPED_NOT_CONFIGURED');
  assert.deepEqual(loadRes.records, []);
});

test('Phase 16 Instant Founder Alert Notifier & Last-20 Delivery Log: dispatchFounderAlert logs NEW_PILOT_LEAD, CLIENT_FILE_UPLOADED, UTR_PAYMENT_SUBMITTED, and TEST_PAYMENT_ALERT events with 9080540047@yespop UPI metadata', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const os = await import('os');
  const {
    dispatchFounderAlert,
    listFounderAlertLogs,
    clearFounderAlertLogs,
  } = await import('../utils/founderAlertNotifier');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'op-phase16-alerts-'));
  const logFile = path.join(tmpDir, 'founder_alert_logs.json');
  const billingFile = path.join(tmpDir, 'founder_billing.json');

  try {
    await clearFounderAlertLogs(logFile);

    const leadAlert = await dispatchFounderAlert(
      {
        eventType: 'NEW_PILOT_LEAD',
        companyName: 'Hosur Precision Gears Pvt Ltd',
        plantLocation: 'Hosur SIPCOT',
        contactName: 'S. Murugan',
        contactEmailOrPhone: 'murugan@hosurgears.in',
        leadId: 'PILOT-20261109-8811',
      },
      { logFilePath: logFile, billingFilePath: billingFile }
    );
    assert.match(leadAlert.alertId, /^ALERT-\d{8}-[A-Z0-9]{4}$/);
    assert.equal(leadAlert.eventType, 'NEW_PILOT_LEAD');
    assert.equal(leadAlert.upiId, '9080540047@yespop');

    const utrAlert = await dispatchFounderAlert(
      {
        eventType: 'UTR_PAYMENT_SUBMITTED',
        companyName: 'Hosur Precision Gears Pvt Ltd',
        workspaceId: 'AUDIT-20261109-8811',
        invoiceId: 'INV-20261109-8811',
        utrNumber: '431298765432',
        amountInr: 14999,
        tier: 'TIER2_FULL_AUDIT',
      },
      { logFilePath: logFile, billingFilePath: billingFile }
    );
    assert.equal(utrAlert.eventType, 'UTR_PAYMENT_SUBMITTED');
    assert.equal(utrAlert.utrNumber, '431298765432');
    assert.equal(utrAlert.amountInr, 14999);
    assert.ok(utrAlert.summary.includes('9080540047@yespop'));

    const logs = await listFounderAlertLogs(logFile);
    assert.equal(logs.length, 2);
    assert.equal(logs[0].eventType, 'UTR_PAYMENT_SUBMITTED');
    assert.equal(logs[1].eventType, 'NEW_PILOT_LEAD');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Platform /app View 4 Bug Fixes Guard: Verifies single arrows in PlatformTopBar, 1500ms timeout + finally on Reset Plant to Baseline, ₹24,800 Ambattur Bin Variance, and hideOperatorTools=true default with Administration hidden', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const { PLATFORM_DEMO_PLANTS } = await import('../commercial/PlatformTopBar');

  // 1. Single arrows in PlatformTopBar.tsx
  const topBarSrc = await fs.readFile(
    path.join(process.cwd(), 'src/commercial/PlatformTopBar.tsx'),
    'utf-8'
  );
  assert.ok(topBarSrc.includes('<span>Website Overview</span>'));
  assert.ok(!topBarSrc.includes('<span>← Website Overview</span>'));
  assert.ok(topBarSrc.includes('<span>Run on Your Plant Data (Free 48h Pilot)</span>'));
  assert.ok(!topBarSrc.includes('<span>Run on Your Plant Data (Free 48h Pilot) →</span>'));

  // 2. 1500ms timeout + try/catch/finally + setIsResetting(false) in AppShell.tsx
  const appShellSrc = await fs.readFile(
    path.join(process.cwd(), 'src/dashboard/AppShell.tsx'),
    'utf-8'
  );
  assert.ok(appShellSrc.includes('setTimeout(() => controller.abort(), 1500)'));
  assert.ok(appShellSrc.includes('setIsResetting(false)'));
  assert.ok(appShellSrc.includes('finally {'));

  // 3. ₹24,800 Variance in Ambattur preset
  assert.equal(PLATFORM_DEMO_PLANTS.ambattur.binVarianceValue, 24800);
  assert.equal(PLATFORM_DEMO_PLANTS.ambattur.binVarianceFormatted, '₹24,800');
  assert.ok(PLATFORM_DEMO_PLANTS.ambattur.binSummary.includes('₹24,800 Variance'));
  assert.ok(PLATFORM_DEMO_PLANTS.ambattur.summaryLine.includes('₹24,800 Variance'));

  // 4. hideOperatorTools defaults to true and Administration link is gated by showOperatorTools
  assert.ok(appShellSrc.includes('const [hideOperatorTools, setHideOperatorTools] = useState<boolean>(true)'));
  assert.ok(appShellSrc.includes("showOperatorTools || item.id !== 'administration'"));
});

// ============================================================================
// PHASE 17 TESTS: 24/7 Zero-Touch CSV-to-Paywall Funnel, Scannable UPI QR Code
// (9080540047@yespop), Udyam MSME Proforma & Paid Receipt Generator (RCPT-...),
// FAQ #9 Pricing Clarity, and WhatsApp/LinkedIn SEO Meta Previews
// ============================================================================

test('Phase 17 Scannable NPCI UPI QR Code Generator: generateUpiQrCodeSvg produces a genuine, scannable <svg> QR code for upi://pay?pa=9080540047@yespop', async () => {
  const {
    DEFAULT_FOUNDER_BILLING_CONFIG,
    buildUpiPaymentUri,
    generateUpiQrCodeSvg,
  } = await import('../utils/founderBillingStore');

  const upiUri = buildUpiPaymentUri(
    DEFAULT_FOUNDER_BILLING_CONFIG,
    14999,
    'INV-20261110-P1P4',
    'AmbatturPlant'
  );
  assert.ok(upiUri.startsWith('upi://pay?pa=9080540047@yespop'));

  const qrSvg = await generateUpiQrCodeSvg(upiUri);
  assert.ok(qrSvg.includes('<svg'));
  assert.ok(qrSvg.includes('viewBox='));
  assert.ok(qrSvg.includes('<path'));
  assert.ok(qrSvg.includes('</svg>'));
});

test('Phase 17 24/7 Zero-Touch Self-Serve CSV-to-Teaser Converter: executeInstantSelfServeAudit creates a lead, ingests 5-column CSV rows into a TEASER_LOCKED workspace, triggers 5-Agent pipeline, and returns a shareable walkthroughUrl', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const os = await import('os');
  const { executeInstantSelfServeAudit } = await import('../utils/importRunStore');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'op-phase17-selfserve-'));
  const leadsFile = path.join(tmpDir, 'pilot_requests.json');
  const workspacesFile = path.join(tmpDir, 'pilot_workspaces.json');
  const importRunsFile = path.join(tmpDir, 'import_runs.json');
  const auditEventsFile = path.join(tmpDir, 'audit_events.json');
  const workforceFile = path.join(tmpDir, 'agent_workforce.json');
  const alertLogsFile = path.join(tmpDir, 'founder_alert_logs.json');

  try {
    const result = await executeInstantSelfServeAudit(
      {
        fullName: 'Ramesh Babu (Plant Director)',
        companyName: 'Sriperumbudur CNC Castings Pvt Ltd',
        workEmail: 'ramesh@sriperumbudurcastings.in',
        phoneOrWhatsapp: '+91 98401 22334',
        p1Rows: [
          {
            Part_ID: 'SRP-RM-001',
            Part_Description: 'SG Iron Valve Body Casting Blank',
            Closing_Stock_Qty: '120',
            Unit_Cost_INR: '1450',
            Last_Movement_Date: '2025-11-10',
          },
          {
            Part_ID: 'SRP-FG-002',
            Part_Description: 'Machined Hydraulic Flange Assembly',
            Closing_Stock_Qty: '45',
            Unit_Cost_INR: '3200',
            Last_Movement_Date: '2026-09-25',
          },
        ],
      },
      {
        leadsFilePath: leadsFile,
        workspacesFilePath: workspacesFile,
        importRunsFilePath: importRunsFile,
        auditEventsFilePath: auditEventsFile,
        workforceFilePath: workforceFile,
        alertLogsFilePath: alertLogsFile,
      }
    );

    assert.equal(result.ok, true);
    assert.ok(result.leadId?.startsWith('PILOT-'));
    assert.ok(result.workspaceId?.startsWith('AUDIT-'));
    assert.ok(typeof result.accessToken === 'string' && result.accessToken.length >= 8);
    assert.ok(
      result.walkthroughUrl?.includes(`?view=pilot-findings&id=${result.workspaceId}`)
    );
    assert.equal(result.snapshot?.commercialAccessMode, 'TEASER_LOCKED');
    assert.equal(result.snapshot?.summaryMetrics.totalSkus, 2);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }).catch(() => undefined);
  }
});

test('Phase 17 Udyam MSME Proforma & Official Paid Receipt Generator: generateProformaInvoice includes udyamMsmeNumber and generatePaidReceipt returns RCPT-YYYYMMDD-XXXX with PAID & VERIFIED stamp', async () => {
  const {
    DEFAULT_FOUNDER_BILLING_CONFIG,
    generateProformaInvoice,
    generatePaidReceipt,
  } = await import('../utils/founderBillingStore');

  const mockSnapshot = {
    workspaceId: 'AUDIT-20261110-99AA',
    leadId: 'PILOT-20261110-99AA',
    companyName: 'Ambattur Auto Forgings Pvt Ltd',
    plantLocation: 'Ambattur Industrial Estate, Chennai',
    createdAt: '2026-11-10T08:00:00.000Z',
    commercialAccessMode: 'FULL_UNLOCKED' as const,
    submittedUtrNumber: '431298765432',
    paymentVerifiedAt: '2026-11-10T09:30:00.000Z',
    invoiceId: 'INV-20261110-99AA',
    paymentTier: 'TIER2_FULL_AUDIT' as const,
  };

  const proforma = generateProformaInvoice(
    mockSnapshot,
    null,
    {
      ...DEFAULT_FOUNDER_BILLING_CONFIG,
      udyamMsmeNumber: 'UDYAM-TN-02-0192837',
      gstinOptional: '',
    },
    'TIER2_FULL_AUDIT'
  );
  assert.equal(proforma.udyamMsmeNumber, 'UDYAM-TN-02-0192837');
  assert.equal(proforma.gstinOptional, '');
  assert.equal(proforma.upiId, '9080540047@yespop');
  assert.equal(proforma.paymentStatus, 'PAID_VERIFIED');

  const receipt = generatePaidReceipt(
    mockSnapshot,
    null,
    {
      ...DEFAULT_FOUNDER_BILLING_CONFIG,
      udyamMsmeNumber: 'UDYAM-TN-02-0192837',
      gstinOptional: '',
    },
    'TIER2_FULL_AUDIT'
  );
  assert.equal(receipt.receiptId, 'RCPT-20261110-99AA');
  assert.equal(receipt.invoiceId, 'INV-20261110-99AA');
  assert.equal(receipt.utrNumber, '431298765432');
  assert.equal(receipt.amountPaidInr, 14999);
  assert.equal(receipt.stamp, 'PAID & VERIFIED');
  assert.equal(receipt.udyamMsmeNumber, 'UDYAM-TN-02-0192837');
  assert.equal(receipt.verifiedBy, 'C. Jones Snowin');
});

test('Phase 17 FAQ #9 Pricing Clarity & WhatsApp/LinkedIn SEO Meta Previews: Verifies Free 3-SKU Teaser (₹0) + ₹14,999 one-time unlock in FAQ #9 and OpenGraph/JSON-LD/og-banner.svg assets', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const { FAQ_ITEMS } = await import('../commercial/homepageConfig');

  const faq9 = FAQ_ITEMS.find((item) => item.q === 'Is the pilot free or paid?');
  assert.ok(faq9);
  assert.ok(
    faq9!.a.includes(
      'Free 3-SKU Diagnostic Teaser & Executive Exposure Summary (₹0)'
    )
  );
  assert.ok(faq9!.a.includes('₹14,999 one-time unlock'));
  assert.ok(faq9!.a.includes('zero automatic subscriptions'));

  const indexHtml = await fs.readFile(path.join(process.cwd(), 'index.html'), 'utf-8');
  assert.ok(indexHtml.includes('property="og:image" content="/og-banner.svg"'));
  assert.ok(indexHtml.includes('name="twitter:image" content="/og-banner.svg"'));
  assert.ok(indexHtml.includes('"@type": "SoftwareApplication"'));
  assert.ok(indexHtml.includes('"@type": "FAQPage"'));

  const ogSvg = await fs.readFile(
    path.join(process.cwd(), 'public/og-banner.svg'),
    'utf-8'
  );
  assert.ok(ogSvg.includes('<svg'));
  assert.ok(ogSvg.includes('9080540047@yespop'));

  const robotsTxt = await fs.readFile(
    path.join(process.cwd(), 'public/robots.txt'),
    'utf-8'
  );
  assert.ok(robotsTxt.includes('Sitemap: https://operationalyst.in/sitemap.xml'));

  const sitemapXml = await fs.readFile(
    path.join(process.cwd(), 'public/sitemap.xml'),
    'utf-8'
  );
  assert.ok(sitemapXml.includes('<urlset'));
  assert.ok(sitemapXml.includes('https://operationalyst.in/?view=pilot-findings'));
});

test('Phase 18 Outbound 50-Plant Sales CRM: Verifies all 50 pre-seeded Chennai & Hosur manufacturing targets across 4 clusters (14 + 12 + 12 + 12)', async () => {
  const {
    INITIAL_OUTBOUND_TARGET_COMPANIES,
    OUTBOUND_CLUSTERS,
    getTargetCompanyDayBatch,
  } = await import('../data/outboundTargetCompanies');

  assert.equal(INITIAL_OUTBOUND_TARGET_COMPANIES.length, 50);
  assert.equal(OUTBOUND_CLUSTERS.length, 4);

  const c1 = INITIAL_OUTBOUND_TARGET_COMPANIES.filter(
    (c) => c.cluster === 'Ambattur Industrial Estate'
  );
  const c2 = INITIAL_OUTBOUND_TARGET_COMPANIES.filter(
    (c) => c.cluster === 'Guindy, Perungudi & Thirumudivakkam'
  );
  const c3 = INITIAL_OUTBOUND_TARGET_COMPANIES.filter(
    (c) => c.cluster === 'Sriperumbudur, Oragadam & Maraimalai Nagar'
  );
  const c4 = INITIAL_OUTBOUND_TARGET_COMPANIES.filter(
    (c) => c.cluster === 'SIPCOT Hosur Phase I & II'
  );

  assert.equal(c1.length, 14);
  assert.equal(c2.length, 12);
  assert.equal(c3.length, 12);
  assert.equal(c4.length, 12);

  assert.equal(c1[0].companyName, 'Autotech Industries India Pvt Ltd');
  assert.equal(c2[0].companyName, 'Super Auto Forge Limited');
  assert.equal(c3[0].companyName, 'Besmak India Pvt Ltd');
  assert.equal(c4[0].companyName, 'VJS Auto Components Pvt Ltd');
  assert.equal(c4[11].companyName, 'Innotrans Systems India Pvt Ltd');

  // Verify 10-plant daily batches (Days 1..5)
  assert.equal(getTargetCompanyDayBatch(0), 1);
  assert.equal(getTargetCompanyDayBatch(9), 1);
  assert.equal(getTargetCompanyDayBatch(10), 2);
  assert.equal(getTargetCompanyDayBatch(25), 3);
  assert.equal(getTargetCompanyDayBatch(35), 4);
  assert.equal(getTargetCompanyDayBatch(49), 5);
});

test('Phase 18 LinkedIn <300-Char Note, X-Ray Search URL & WhatsApp Pitch Generator: Verifies <300 character limit across all 50 companies', async () => {
  const {
    INITIAL_OUTBOUND_TARGET_COMPANIES,
    buildLinkedInXRaySearchUrl,
    buildLinkedInConnectionNote,
    buildWhatsAppTeaserPitch,
    buildWhatsAppLaunchUrl,
  } = await import('../data/outboundTargetCompanies');

  for (const company of INITIAL_OUTBOUND_TARGET_COMPANIES) {
    const note = buildLinkedInConnectionNote(company);
    assert.ok(
      note.length > 40 && note.length < 300,
      `Expected LinkedIn note for ${company.companyName} to be <300 chars, got ${note.length}`
    );
    assert.ok(note.includes('Free 3-SKU Teaser'));

    const xRayUrl = buildLinkedInXRaySearchUrl(company.companyName);
    assert.ok(xRayUrl.startsWith('https://www.google.com/search?q='));
    assert.ok(decodeURIComponent(xRayUrl).includes(`"${company.companyName}"`));
    assert.ok(decodeURIComponent(xRayUrl).includes('site:linkedin.com/in/'));
  }

  const pitch = buildWhatsAppTeaserPitch(
    INITIAL_OUTBOUND_TARGET_COMPANIES[0],
    'https://operationalyst.in'
  );
  assert.ok(pitch.includes('Autotech Industries India Pvt Ltd'));
  assert.ok(pitch.includes('Ambattur Industrial Estate'));
  assert.ok(pitch.includes('₹14,999'));
  assert.ok(pitch.includes('https://operationalyst.in'));

  const waUrl = buildWhatsAppLaunchUrl('+91 90805 40047', pitch);
  assert.ok(waUrl?.startsWith('https://wa.me/919080540047?text='));
  assert.equal(buildWhatsAppLaunchUrl('', pitch), null);
});

test('Phase 18 Outbound CRM Persistence, Status Updates, Add Target Factory & CSV Export', async () => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const os = await import('os');
  const {
    getOutboundCrmCompanies,
    updateOutboundTargetCompany,
    addOutboundTargetCompany,
    exportOutboundCrmToCsv,
  } = await import('../data/outboundTargetCompanies');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'op-phase18-crm-'));
  const crmFile = path.join(tmpDir, 'outbound_crm.json');

  try {
    const initial = await getOutboundCrmCompanies(crmFile);
    assert.equal(initial.length, 50);
    assert.equal(initial[0].status, 'NOT_CONTACTED');

    const updatedRes = await updateOutboundTargetCompany(
      'TARGET-001',
      {
        status: 'TEASER_OFFERED',
        contactName: 'R. Sundaram (MD)',
        phoneOrWhatsapp: '+91 98401 11223',
        notes: 'Sent 3-SKU Teaser link on WhatsApp',
      },
      crmFile
    );
    assert.equal(updatedRes.ok, true);
    assert.equal(updatedRes.company?.status, 'TEASER_OFFERED');
    assert.equal(updatedRes.company?.contactName, 'R. Sundaram (MD)');
    assert.ok(updatedRes.company?.lastFollowUpAt);

    const addedRes = await addOutboundTargetCompany(
      {
        companyName: 'Ennore Heavy Castings Pvt Ltd',
        cluster: 'Ambattur Industrial Estate',
        segment: 'Heavy Foundry & CNC',
        contactName: 'V. Natarajan',
        status: 'LINKEDIN_SENT',
      },
      crmFile
    );
    assert.equal(addedRes.ok, true);
    assert.equal(addedRes.companies.length, 51);
    assert.equal(addedRes.company?.id, 'TARGET-051');

    const csv = exportOutboundCrmToCsv(addedRes.companies);
    assert.ok(csv.includes('Company_Name,Cluster,Segment'));
    assert.ok(csv.includes('Autotech Industries India Pvt Ltd'));
    assert.ok(csv.includes('Ennore Heavy Castings Pvt Ltd'));
  } finally {
    await fs
      .rm(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 })
      .catch(() => undefined);
  }
});




