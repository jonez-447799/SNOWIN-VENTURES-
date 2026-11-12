/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Backward-Compatible Closed-Loop CAPA Financial Realization Ledger (Phase 7).
 * Normalizes legacy and enriched CAPA items across Ambattur, Sriperumbudur, and Hosur
 * and computes deterministic financial recovery funnel metrics.
 */

export type CapaPillar = 'P1_INVENTORY' | 'P2_OTIF' | 'P3_FREIGHT' | 'P4_WAREHOUSE';

export type CapaDispositionType =
  | 'VENDOR_RETURN_CONTRA'
  | 'ALTERNATE_BOM_CONSUMPTION'
  | 'B2B_LIQUIDATION_SCRAP'
  | 'FREIGHT_DEBIT_NOTE'
  | 'BIN_RECONCILIATION_RECOUNT'
  | 'DISPATCH_SCHEDULING_FIX';

export type CapaVerificationStage =
  | 'OPEN'
  | 'IN_EXECUTION'
  | 'PENDING_FINANCE_SIGN_OFF'
  | 'VERIFIED_REALIZED';

export interface NormalizedCapaItem {
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

  // Phase 7 Financial Realization Ledger Fields
  pillar: CapaPillar;
  dispositionType: CapaDispositionType;
  linkedRecordId: string;
  identifiedExposureInr: number;
  targetRecoveryInr: number;
  realizedRecoveryInr: number;
  verificationStage: CapaVerificationStage;
}

export interface CapaPillarFinancialBreakdown {
  count: number;
  identifiedExposureInr: number;
  targetRecoveryInr: number;
  pendingFinanceSignOffInr: number;
  realizedRecoveryInr: number;
}

export interface CapaStageFinancialBreakdown {
  count: number;
  identifiedExposureInr: number;
  targetRecoveryInr: number;
  realizedRecoveryInr: number;
}

export interface CapaFinancialSummary {
  totalCapasCount: number;
  totalIdentifiedExposureInr: number;
  totalTargetRecoveryInr: number;
  pendingFinanceSignOffInr: number;
  totalRealizedRecoveryInr: number;
  realizationRatePct: number;
  byPillar: Record<CapaPillar, CapaPillarFinancialBreakdown>;
  byStage: Record<CapaVerificationStage, CapaStageFinancialBreakdown>;
}

const VALID_PILLARS: readonly CapaPillar[] = [
  'P1_INVENTORY',
  'P2_OTIF',
  'P3_FREIGHT',
  'P4_WAREHOUSE',
];

const VALID_DISPOSITIONS: readonly CapaDispositionType[] = [
  'VENDOR_RETURN_CONTRA',
  'ALTERNATE_BOM_CONSUMPTION',
  'B2B_LIQUIDATION_SCRAP',
  'FREIGHT_DEBIT_NOTE',
  'BIN_RECONCILIATION_RECOUNT',
  'DISPATCH_SCHEDULING_FIX',
];

const VALID_STAGES: readonly CapaVerificationStage[] = [
  'OPEN',
  'IN_EXECUTION',
  'PENDING_FINANCE_SIGN_OFF',
  'VERIFIED_REALIZED',
];

/**
 * Deterministic lookup table for canonical plant CAPA IDs so legacy saved workspaces
 * in ./data/plant_workspaces.json or localStorage automatically receive exact row-linked
 * financial figures without requiring a destructive reset.
 */
const CANONICAL_CAPA_FINANCIAL_DEFAULTS: Record<
  string,
  {
    pillar: CapaPillar;
    dispositionType: CapaDispositionType;
    linkedRecordId: string;
    identifiedExposureInr: number;
    targetRecoveryInr: number;
    realizedRecoveryInr: number;
    verificationStage: CapaVerificationStage;
  }
> = {
  'AMB-CAPA-01': {
    pillar: 'P1_INVENTORY',
    dispositionType: 'B2B_LIQUIDATION_SCRAP',
    linkedRecordId: 'FG-PBX-G1',
    identifiedExposureInr: 223110,
    targetRecoveryInr: 156177,
    realizedRecoveryInr: 68500,
    verificationStage: 'IN_EXECUTION',
  },
  'AMB-CAPA-02': {
    pillar: 'P2_OTIF',
    dispositionType: 'DISPATCH_SCHEDULING_FIX',
    linkedRecordId: 'DISP-102',
    identifiedExposureInr: 84000,
    targetRecoveryInr: 72000,
    realizedRecoveryInr: 0,
    verificationStage: 'OPEN',
  },
  'AMB-CAPA-03': {
    pillar: 'P3_FREIGHT',
    dispositionType: 'FREIGHT_DEBIT_NOTE',
    linkedRecordId: 'LR-SIV-1049',
    identifiedExposureInr: 13944,
    targetRecoveryInr: 10178,
    realizedRecoveryInr: 10178,
    verificationStage: 'PENDING_FINANCE_SIGN_OFF',
  },
  'AMB-CAPA-04': {
    pillar: 'P4_WAREHOUSE',
    dispositionType: 'BIN_RECONCILIATION_RECOUNT',
    linkedRecordId: 'EV-CHG-01',
    identifiedExposureInr: 24240,
    targetRecoveryInr: 24240,
    realizedRecoveryInr: 18400,
    verificationStage: 'VERIFIED_REALIZED',
  },
  'SRI-CAPA-01': {
    pillar: 'P1_INVENTORY',
    dispositionType: 'VENDOR_RETURN_CONTRA',
    linkedRecordId: 'SRI-STAMP-101',
    identifiedExposureInr: 1132100,
    targetRecoveryInr: 792470,
    realizedRecoveryInr: 310000,
    verificationStage: 'IN_EXECUTION',
  },
  'SRI-CAPA-02': {
    pillar: 'P2_OTIF',
    dispositionType: 'DISPATCH_SCHEDULING_FIX',
    linkedRecordId: 'SRI-DISP-02',
    identifiedExposureInr: 145000,
    targetRecoveryInr: 120000,
    realizedRecoveryInr: 45000,
    verificationStage: 'PENDING_FINANCE_SIGN_OFF',
  },
  'SRI-CAPA-03': {
    pillar: 'P3_FREIGHT',
    dispositionType: 'FREIGHT_DEBIT_NOTE',
    linkedRecordId: 'SRI-LR-02',
    identifiedExposureInr: 11940,
    targetRecoveryInr: 11940,
    realizedRecoveryInr: 11940,
    verificationStage: 'VERIFIED_REALIZED',
  },
  'SRI-CAPA-04': {
    pillar: 'P4_WAREHOUSE',
    dispositionType: 'BIN_RECONCILIATION_RECOUNT',
    linkedRecordId: 'SRI-BIN-01',
    identifiedExposureInr: 34260,
    targetRecoveryInr: 34260,
    realizedRecoveryInr: 0,
    verificationStage: 'OPEN',
  },
  'HOS-CAPA-01': {
    pillar: 'P1_INVENTORY',
    dispositionType: 'ALTERNATE_BOM_CONSUMPTION',
    linkedRecordId: 'HOS-FORG-201',
    identifiedExposureInr: 961000,
    targetRecoveryInr: 672700,
    realizedRecoveryInr: 240000,
    verificationStage: 'IN_EXECUTION',
  },
  'HOS-CAPA-02': {
    pillar: 'P2_OTIF',
    dispositionType: 'DISPATCH_SCHEDULING_FIX',
    linkedRecordId: 'HOS-DISP-03',
    identifiedExposureInr: 112000,
    targetRecoveryInr: 95000,
    realizedRecoveryInr: 95000,
    verificationStage: 'VERIFIED_REALIZED',
  },
  'HOS-CAPA-03': {
    pillar: 'P3_FREIGHT',
    dispositionType: 'FREIGHT_DEBIT_NOTE',
    linkedRecordId: 'HOS-LR-02',
    identifiedExposureInr: 9875,
    targetRecoveryInr: 9875,
    realizedRecoveryInr: 0,
    verificationStage: 'PENDING_FINANCE_SIGN_OFF',
  },
  'HOS-CAPA-04': {
    pillar: 'P4_WAREHOUSE',
    dispositionType: 'BIN_RECONCILIATION_RECOUNT',
    linkedRecordId: 'HOS-BIN-01',
    identifiedExposureInr: 34400,
    targetRecoveryInr: 34400,
    realizedRecoveryInr: 0,
    verificationStage: 'OPEN',
  },
};

function inferPillarFromDomain(
  domain?: string,
  domainLabel?: string
): CapaPillar {
  const d = String(domain || '').toLowerCase();
  const l = String(domainLabel || '').toLowerCase();
  if (d === 'delivery' || l.includes('p2') || l.includes('otif') || l.includes('delivery')) {
    return 'P2_OTIF';
  }
  if (d === 'profit_risk' || l.includes('p3') || l.includes('freight')) {
    return 'P3_FREIGHT';
  }
  if (d === 'warehouse' || l.includes('p4') || l.includes('warehouse') || l.includes('bin')) {
    return 'P4_WAREHOUSE';
  }
  return 'P1_INVENTORY';
}

function inferDomainFromPillar(pillar: CapaPillar): {
  domain: 'inventory' | 'delivery' | 'profit_risk' | 'warehouse';
  domainLabel: string;
} {
  switch (pillar) {
    case 'P2_OTIF':
      return { domain: 'delivery', domainLabel: 'Delivery (P2)' };
    case 'P3_FREIGHT':
      return { domain: 'profit_risk', domainLabel: 'Profit & Risk (P3)' };
    case 'P4_WAREHOUSE':
      return { domain: 'warehouse', domainLabel: 'Warehouse (P4)' };
    case 'P1_INVENTORY':
    default:
      return { domain: 'inventory', domainLabel: 'Inventory (P1)' };
  }
}

function inferDispositionFromPillar(pillar: CapaPillar): CapaDispositionType {
  switch (pillar) {
    case 'P2_OTIF':
      return 'DISPATCH_SCHEDULING_FIX';
    case 'P3_FREIGHT':
      return 'FREIGHT_DEBIT_NOTE';
    case 'P4_WAREHOUSE':
      return 'BIN_RECONCILIATION_RECOUNT';
    case 'P1_INVENTORY':
    default:
      return 'B2B_LIQUIDATION_SCRAP';
  }
}

function inferStageFromLegacyStatus(
  status?: string
): CapaVerificationStage {
  const s = String(status || '').toLowerCase();
  if (s === 'resolved' || s === 'completed') return 'VERIFIED_REALIZED';
  if (s === 'awaiting verification') return 'PENDING_FINANCE_SIGN_OFF';
  if (s === 'in progress') return 'IN_EXECUTION';
  return 'OPEN';
}

function inferLegacyStatusFromStage(
  stage: CapaVerificationStage
): 'Open' | 'In progress' | 'Awaiting verification' | 'Resolved' {
  switch (stage) {
    case 'VERIFIED_REALIZED':
      return 'Resolved';
    case 'PENDING_FINANCE_SIGN_OFF':
      return 'Awaiting verification';
    case 'IN_EXECUTION':
      return 'In progress';
    case 'OPEN':
    default:
      return 'Open';
  }
}

function parseRupeesFromTitleOrNotes(text: string): number {
  const match = String(text || '').match(/₹\s*([\d,]+)/);
  if (!match) return 0;
  const cleaned = match[1].replace(/,/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) && num >= 0 ? Math.round(num) : 0;
}

function parseLinkedRecordFromEvidence(evidenceRef: string, pillar: CapaPillar): string {
  const text = String(evidenceRef || '');
  const codeMatch = text.match(/([A-Z]{2,5}-[A-Z0-9]{2,8}(?:-[A-Z0-9]{1,6})?)/);
  if (codeMatch) return codeMatch[1];
  switch (pillar) {
    case 'P2_OTIF':
      return 'DISP-101';
    case 'P3_FREIGHT':
      return 'LR-1001';
    case 'P4_WAREHOUSE':
      return 'BIN-01';
    case 'P1_INVENTORY':
    default:
      return 'SKU-001';
  }
}

function toSafeNonNegativeInt(val: unknown, fallback: number): number {
  if (typeof val === 'number' && Number.isFinite(val)) {
    return Math.max(0, Math.round(val));
  }
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = Number(val.replace(/,/g, '').trim());
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.round(parsed));
    }
  }
  return Math.max(0, Math.round(fallback));
}

export type RawCapaInput = Partial<NormalizedCapaItem> & {
  [key: string]: any;
};

/**
 * Safely normalizes any legacy or Phase 7 CAPA item into a full NormalizedCapaItem
 * with guaranteed financial fields and enum integrity.
 */
export function normalizeCapaItem(rawCapa: RawCapaInput): NormalizedCapaItem {
  const id = String(rawCapa?.id || `CAPA-${Date.now()}`).trim();
  const canonicalDefault = CANONICAL_CAPA_FINANCIAL_DEFAULTS[id];

  const rawPillar = rawCapa?.pillar as CapaPillar | undefined;
  const pillar: CapaPillar =
    rawPillar && VALID_PILLARS.includes(rawPillar)
      ? rawPillar
      : canonicalDefault?.pillar ||
        inferPillarFromDomain(
          typeof rawCapa?.domain === 'string' ? rawCapa.domain : undefined,
          typeof rawCapa?.domainLabel === 'string' ? rawCapa.domainLabel : undefined
        );

  const inferredDomain = inferDomainFromPillar(pillar);
  const domain =
    rawCapa?.domain === 'inventory' ||
    rawCapa?.domain === 'delivery' ||
    rawCapa?.domain === 'profit_risk' ||
    rawCapa?.domain === 'warehouse'
      ? rawCapa.domain
      : inferredDomain.domain;

  const domainLabel =
    typeof rawCapa?.domainLabel === 'string' && rawCapa.domainLabel.trim()
      ? rawCapa.domainLabel.trim()
      : inferredDomain.domainLabel;

  const rawDisp = rawCapa?.dispositionType as CapaDispositionType | undefined;
  const dispositionType: CapaDispositionType =
    rawDisp && VALID_DISPOSITIONS.includes(rawDisp)
      ? rawDisp
      : canonicalDefault?.dispositionType || inferDispositionFromPillar(pillar);

  const title =
    typeof rawCapa?.title === 'string' && rawCapa.title.trim()
      ? rawCapa.title.trim()
      : 'Operational Corrective Action';
  const evidenceRef =
    typeof rawCapa?.evidenceRef === 'string' && rawCapa.evidenceRef.trim()
      ? rawCapa.evidenceRef.trim()
      : 'Audit Ledger Row';

  const linkedRecordId =
    typeof rawCapa?.linkedRecordId === 'string' && rawCapa.linkedRecordId.trim()
      ? rawCapa.linkedRecordId.trim()
      : canonicalDefault?.linkedRecordId || parseLinkedRecordFromEvidence(evidenceRef, pillar);

  const rawStage = rawCapa?.verificationStage as CapaVerificationStage | undefined;
  const verificationStage: CapaVerificationStage =
    rawStage && VALID_STAGES.includes(rawStage)
      ? rawStage
      : rawCapa?.status
      ? canonicalDefault && rawCapa.status === undefined
        ? canonicalDefault.verificationStage
        : rawStage ||
          (canonicalDefault &&
          inferStageFromLegacyStatus(String(rawCapa.status)) ===
            inferStageFromLegacyStatus(
              inferLegacyStatusFromStage(canonicalDefault.verificationStage)
            )
            ? canonicalDefault.verificationStage
            : inferStageFromLegacyStatus(String(rawCapa.status)))
      : canonicalDefault?.verificationStage || 'OPEN';

  const fallbackExposure =
    canonicalDefault?.identifiedExposureInr ||
    parseRupeesFromTitleOrNotes(`${title} ${rawCapa?.notes || ''}`) ||
    25000;

  const identifiedExposureInr = toSafeNonNegativeInt(
    rawCapa?.identifiedExposureInr,
    fallbackExposure
  );

  const fallbackTarget =
    canonicalDefault?.targetRecoveryInr !== undefined
      ? canonicalDefault.targetRecoveryInr
      : Math.round(identifiedExposureInr * 0.75);

  const targetRecoveryInr = toSafeNonNegativeInt(
    rawCapa?.targetRecoveryInr,
    fallbackTarget
  );

  const fallbackRealized =
    canonicalDefault?.realizedRecoveryInr !== undefined
      ? canonicalDefault.realizedRecoveryInr
      : verificationStage === 'VERIFIED_REALIZED'
      ? targetRecoveryInr
      : 0;

  const realizedRecoveryInr = toSafeNonNegativeInt(
    rawCapa?.realizedRecoveryInr,
    fallbackRealized
  );

  const priority: 'Critical' | 'Requires attention' | 'Monitoring' =
    rawCapa?.priority === 'Critical' ||
    rawCapa?.priority === 'Requires attention' ||
    rawCapa?.priority === 'Monitoring'
      ? rawCapa.priority
      : 'Requires attention';

  const status = inferLegacyStatusFromStage(verificationStage);

  return {
    id,
    title,
    domain,
    domainLabel,
    priority,
    evidenceRef,
    owner:
      typeof rawCapa?.owner === 'string' && rawCapa.owner.trim()
        ? rawCapa.owner.trim()
        : 'Plant Operations Lead',
    dueDate:
      typeof rawCapa?.dueDate === 'string' && rawCapa.dueDate.trim()
        ? rawCapa.dueDate.trim()
        : 'Within 5 days',
    status,
    notes:
      typeof rawCapa?.notes === 'string' ? rawCapa.notes.trim() : '',
    pillar,
    dispositionType,
    linkedRecordId,
    identifiedExposureInr,
    targetRecoveryInr,
    realizedRecoveryInr,
    verificationStage,
  };
}

/**
 * Computes the complete Closed-Loop CAPA Financial Realization Summary across a list of CAPA items.
 */
export function computeCapaFinancialSummary(
  capas: ReadonlyArray<RawCapaInput>
): CapaFinancialSummary {
  const normalizedList = Array.isArray(capas)
    ? capas.map((c) => normalizeCapaItem(c))
    : [];

  const byPillar: Record<CapaPillar, CapaPillarFinancialBreakdown> = {
    P1_INVENTORY: {
      count: 0,
      identifiedExposureInr: 0,
      targetRecoveryInr: 0,
      pendingFinanceSignOffInr: 0,
      realizedRecoveryInr: 0,
    },
    P2_OTIF: {
      count: 0,
      identifiedExposureInr: 0,
      targetRecoveryInr: 0,
      pendingFinanceSignOffInr: 0,
      realizedRecoveryInr: 0,
    },
    P3_FREIGHT: {
      count: 0,
      identifiedExposureInr: 0,
      targetRecoveryInr: 0,
      pendingFinanceSignOffInr: 0,
      realizedRecoveryInr: 0,
    },
    P4_WAREHOUSE: {
      count: 0,
      identifiedExposureInr: 0,
      targetRecoveryInr: 0,
      pendingFinanceSignOffInr: 0,
      realizedRecoveryInr: 0,
    },
  };

  const byStage: Record<CapaVerificationStage, CapaStageFinancialBreakdown> = {
    OPEN: {
      count: 0,
      identifiedExposureInr: 0,
      targetRecoveryInr: 0,
      realizedRecoveryInr: 0,
    },
    IN_EXECUTION: {
      count: 0,
      identifiedExposureInr: 0,
      targetRecoveryInr: 0,
      realizedRecoveryInr: 0,
    },
    PENDING_FINANCE_SIGN_OFF: {
      count: 0,
      identifiedExposureInr: 0,
      targetRecoveryInr: 0,
      realizedRecoveryInr: 0,
    },
    VERIFIED_REALIZED: {
      count: 0,
      identifiedExposureInr: 0,
      targetRecoveryInr: 0,
      realizedRecoveryInr: 0,
    },
  };

  let totalIdentifiedExposureInr = 0;
  let totalTargetRecoveryInr = 0;
  let pendingFinanceSignOffInr = 0;
  let totalRealizedRecoveryInr = 0;

  for (const item of normalizedList) {
    totalIdentifiedExposureInr += item.identifiedExposureInr;
    totalTargetRecoveryInr += item.targetRecoveryInr;
    totalRealizedRecoveryInr += item.realizedRecoveryInr;

    const pendingAmount =
      item.verificationStage === 'PENDING_FINANCE_SIGN_OFF'
        ? Math.max(item.targetRecoveryInr, item.realizedRecoveryInr)
        : 0;
    pendingFinanceSignOffInr += pendingAmount;

    const pEntry = byPillar[item.pillar];
    if (pEntry) {
      pEntry.count += 1;
      pEntry.identifiedExposureInr += item.identifiedExposureInr;
      pEntry.targetRecoveryInr += item.targetRecoveryInr;
      pEntry.pendingFinanceSignOffInr += pendingAmount;
      pEntry.realizedRecoveryInr += item.realizedRecoveryInr;
    }

    const sEntry = byStage[item.verificationStage];
    if (sEntry) {
      sEntry.count += 1;
      sEntry.identifiedExposureInr += item.identifiedExposureInr;
      sEntry.targetRecoveryInr += item.targetRecoveryInr;
      sEntry.realizedRecoveryInr += item.realizedRecoveryInr;
    }
  }

  const realizationRatePct =
    totalTargetRecoveryInr > 0
      ? Math.round((totalRealizedRecoveryInr / totalTargetRecoveryInr) * 1000) / 10
      : 0;

  return {
    totalCapasCount: normalizedList.length,
    totalIdentifiedExposureInr,
    totalTargetRecoveryInr,
    pendingFinanceSignOffInr,
    totalRealizedRecoveryInr,
    realizationRatePct,
    byPillar,
    byStage,
  };
}
