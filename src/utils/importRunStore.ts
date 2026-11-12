/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {
  validateP1InventoryRows,
  validateP2DispatchRows,
  validateP3FreightRows,
  validateP4WarehouseBinRows,
  anonymizeP1ToP4DatasetClientSide,
  type PillarQualitySummary,
  type QuarantinedRowRecord,
} from './importValidation.ts';
import {
  createPilotWorkspaceSnapshot,
  DEFAULT_WORKSPACES_FILE_PATH,
  type PilotWorkspaceSnapshot,
  type SnapshotDataQualityOverview,
  type SnapshotAssumptionsAndExclusions,
} from './pilotWorkspaceStore.ts';
import {
  createLeadRecord,
  getLeadRecordById,
  updateLeadRecord,
  DEFAULT_LEADS_FILE_PATH,
} from './leadStore.ts';
import type { PilotRequestRecord } from './leadValidation.ts';
import { recordServerAuditEvent, DEFAULT_AUDIT_EVENTS_FILE_PATH } from './serverAuditLog.ts';
import {
  triggerLeadArrivalAgentPipeline,
  triggerIngestionAgentPipeline,
} from './agentWorkforceEngine.ts';
import { dispatchFounderAlert } from './founderAlertNotifier.ts';
import type { RulesConfig as StockRuleConfig } from '../project1/types.ts';
import type { DispatchRow as P2DispatchItem } from '../project2/types/otif.ts';
import { DEFAULT_RULES } from '../project1/data/initialData.ts';
import { INITIAL_DISPATCHES, INITIAL_RULES as P2_DEFAULT_RULES } from '../project2/data/initialData.ts';
import { INITIAL_TRIPS, DEFAULT_RULES as P3_DEFAULT_RULES } from '../project3/data/defaultData.ts';
import { INITIAL_SAMPLE_SKUS, DEFAULT_RULES as P4_DEFAULT_RULES } from '../project4/data/sampleData.ts';

export const DEFAULT_IMPORT_RUNS_FILE_PATH = path.resolve(
  process.cwd(),
  'data',
  'import_runs.json'
);

export interface ImportRunRecord {
  importRunId: string;
  createdAt: string;
  leadId: string;
  plantId?: 'ambattur' | 'sriperumbudur' | 'hosur' | 'custom';
  companyName: string;
  plantLocation: string;
  datasetSha256: string;
  anonymizationApplied: boolean;
  excludeReserveSpares: boolean;
  columnMappingUsed: Record<string, Record<string, string>>;
  p1Quality: {
    totalSubmitted: number;
    validAccepted: number;
    quarantinedRejected: number;
    reserveSparesCount: number;
    reserveSparesValueINR: number;
  };
  p2Quality?: {
    totalSubmitted: number;
    validAccepted: number;
    quarantinedRejected: number;
  };
  p3Quality?: {
    totalSubmitted: number;
    validAccepted: number;
    quarantinedRejected: number;
  };
  p4Quality?: {
    totalSubmitted: number;
    validAccepted: number;
    quarantinedRejected: number;
  };
  generatedWorkspaceId: string;
  generatedWalkthroughUrl: string;
  quarantinedRows?: {
    P1: QuarantinedRowRecord[];
    P2?: QuarantinedRowRecord[];
    P3?: QuarantinedRowRecord[];
    P4?: QuarantinedRowRecord[];
    p1?: QuarantinedRowRecord[];
    p2?: QuarantinedRowRecord[];
    p3?: QuarantinedRowRecord[];
    p4?: QuarantinedRowRecord[];
  };
  quarantinedRowsScrubbed?: boolean;
  scrubbedAt?: string;
  deletionCertificateId?: string;
}

export interface Step2PilotIngestionInput {
  leadId: string;
  companyName?: string;
  plantLocation?: string;
  plantId?: 'ambattur' | 'sriperumbudur' | 'hosur' | 'custom';
  p1Rows: Array<Record<string, unknown>>;
  p2Rows?: Array<Record<string, unknown>>;
  p3Rows?: Array<Record<string, unknown>>;
  p4Rows?: Array<Record<string, unknown>>;
  excludeReserveSpares?: boolean;
  anonymizationApplied?: boolean;
  applyServerSideAnonymization?: boolean;
  rules?: Partial<StockRuleConfig>;
  executiveNotes?: string;
  preparedBy?: string;
  commercialAccessMode?: 'TEASER_LOCKED' | 'UTR_PENDING_VERIFICATION' | 'FULL_UNLOCKED';
}

export interface Step2PilotIngestionResult {
  ok: boolean;
  error?: string;
  importRun?: ImportRunRecord;
  snapshot?: PilotWorkspaceSnapshot;
  updatedLead?: PilotRequestRecord | null;
  quarantinedByPillar?: {
    P1: QuarantinedRowRecord[];
    P2: QuarantinedRowRecord[];
    P3: QuarantinedRowRecord[];
    P4: QuarantinedRowRecord[];
  };
}

const writeLocks = new Map<string, Promise<unknown>>();

function withSerializedLock<T>(filePath: string, task: () => Promise<T>): Promise<T> {
  const prev = writeLocks.get(filePath) ?? Promise.resolve();
  const next = prev.then(task, task);
  writeLocks.set(
    filePath,
    next.catch(() => {})
  );
  return next;
}

export function generateImportRunId(now: Date = new Date()): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `IMPRUN-${yyyy}${mm}${dd}-${suffix}`;
}

export function computePayloadSha256(payload: unknown): string {
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload ?? {});
  return crypto.createHash('sha256').update(serialized, 'utf8').digest('hex');
}

async function ensureImportRunsFile(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '[]\n', 'utf8');
  }
}

async function readAllImportRunsUnsafe(filePath: string): Promise<ImportRunRecord[]> {
  await ensureImportRunsFile(filePath);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ImportRunRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeAllImportRunsUnsafe(
  filePath: string,
  records: ImportRunRecord[]
): Promise<void> {
  await ensureImportRunsFile(filePath);
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
  await fs.writeFile(tempPath, JSON.stringify(records, null, 2) + '\n', 'utf8');
  await fs.rename(tempPath, filePath);
}

export async function createImportRunRecord(
  recordInput: Omit<ImportRunRecord, 'importRunId' | 'createdAt'> & {
    importRunId?: string;
    createdAt?: string;
  },
  filePath: string = DEFAULT_IMPORT_RUNS_FILE_PATH
): Promise<ImportRunRecord> {
  return withSerializedLock(filePath, async () => {
    const existing = await readAllImportRunsUnsafe(filePath);
    const now = new Date();
    let importRunId = recordInput.importRunId || generateImportRunId(now);
    while (existing.some((r) => r.importRunId === importRunId)) {
      importRunId = generateImportRunId(now);
    }

    const record: ImportRunRecord = {
      ...recordInput,
      importRunId,
      createdAt: recordInput.createdAt || now.toISOString(),
    };

    existing.push(record);
    await writeAllImportRunsUnsafe(filePath, existing);
    return record;
  });
}

export async function listImportRunRecords(
  filePath: string = DEFAULT_IMPORT_RUNS_FILE_PATH
): Promise<ImportRunRecord[]> {
  return withSerializedLock(filePath, async () => {
    const records = await readAllImportRunsUnsafe(filePath);
    return [...records].sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (diff !== 0) return diff;
      return b.importRunId.localeCompare(a.importRunId);
    });
  });
}

export async function getImportRunRecordById(
  importRunId: string,
  filePath: string = DEFAULT_IMPORT_RUNS_FILE_PATH
): Promise<ImportRunRecord | null> {
  return withSerializedLock(filePath, async () => {
    const records = await readAllImportRunsUnsafe(filePath);
    return records.find((r) => r.importRunId === importRunId) || null;
  });
}

/**
 * Scrubs any retained quarantinedRows raw payloads linked to a workspaceId, importRunId, or leadId
 * while keeping row count totals (p1Quality..p4Quality) and datasetSha256 checksum intact.
 */
export async function scrubImportRunsForWorkspaceOrLead(
  params: {
    workspaceId?: string;
    leadId?: string;
    importRunId?: string;
    deletionCertificateId: string;
    purgedAt: string;
  },
  filePath: string = DEFAULT_IMPORT_RUNS_FILE_PATH
): Promise<number> {
  return withSerializedLock(filePath, async () => {
    const records = await readAllImportRunsUnsafe(filePath);
    let scrubbedCount = 0;

    const updated = records.map((rec) => {
      const matchesWorkspace =
        Boolean(params.workspaceId) && rec.generatedWorkspaceId === params.workspaceId;
      const matchesLead = Boolean(params.leadId) && rec.leadId === params.leadId;
      const matchesRun = Boolean(params.importRunId) && rec.importRunId === params.importRunId;

      if (matchesWorkspace || matchesLead || matchesRun) {
        scrubbedCount += 1;
        return {
          ...rec,
          quarantinedRows: {
            P1: [],
            P2: [],
            P3: [],
            P4: [],
          },
          quarantinedRowsScrubbed: true,
          scrubbedAt: params.purgedAt,
          deletionCertificateId: params.deletionCertificateId,
        };
      }
      return rec;
    });

    if (scrubbedCount > 0) {
      await writeAllImportRunsUnsafe(filePath, updated);
    }
    return scrubbedCount;
  });
}

/**
 * Executes the complete Step-2 Pilot Upload Ingestion pipeline:
 * 1. Resolves Tally/SAP/Busy header aliases across P1–P4.
 * 2. Runs strict 4-pillar quarantine validation (never silently coercing bad dates or numbers).
 * 3. Computes SHA-256 dataset digest (`datasetSha256`) and creates `IMPRUN-YYYYMMDD-XXXX`.
 * 4. Creates the server-backed 4-pillar `PilotWorkspaceSnapshot` (`AUDIT-YYYYMMDD-XXXX`)
 *    with Item 01 (`dataQualityOverview`) and Item 07 (`assumptionsAndExclusions`).
 * 5. Updates the linked lead record (`APPROVED_FOR_UPLOAD` / `SNAPSHOT_READY`, `lastImportRunId`, `dataQualityOverview`).
 * 6. Appends a `PILOT_DATA_INGESTED` governance event to `./data/audit_events.json`.
 */
export async function executeStep2PilotIngestion(
  input: Step2PilotIngestionInput,
  options?: {
    importRunsFilePath?: string;
    workspacesFilePath?: string;
    leadsFilePath?: string;
    auditEventsFilePath?: string;
  }
): Promise<Step2PilotIngestionResult> {
  const importRunsFilePath = options?.importRunsFilePath || DEFAULT_IMPORT_RUNS_FILE_PATH;
  const workspacesFilePath = options?.workspacesFilePath || DEFAULT_WORKSPACES_FILE_PATH;
  const leadsFilePath = options?.leadsFilePath || DEFAULT_LEADS_FILE_PATH;
  const auditEventsFilePath = options?.auditEventsFilePath || DEFAULT_AUDIT_EVENTS_FILE_PATH;

  if (!Array.isArray(input.p1Rows) || input.p1Rows.length === 0) {
    return {
      ok: false,
      error: 'At least 1 P1 Inventory row is required to run the Step-2 Pilot Audit ingestion.',
    };
  }

  const excludeReserveSpares = Boolean(input.excludeReserveSpares);
  const anonymizationApplied = Boolean(
    input.anonymizationApplied || input.applyServerSideAnonymization
  );

  // Optional server-side fallback anonymization if requested
  const datasetToValidate = input.applyServerSideAnonymization
    ? anonymizeP1ToP4DatasetClientSide({
        p1Rows: input.p1Rows,
        p2Rows: input.p2Rows,
        p3Rows: input.p3Rows,
        p4Rows: input.p4Rows,
      })
    : {
        p1Rows: input.p1Rows,
        p2Rows: input.p2Rows,
        p3Rows: input.p3Rows,
        p4Rows: input.p4Rows,
      };

  // Validate P1
  const p1Result = validateP1InventoryRows(datasetToValidate.p1Rows, {
    excludeReserveSpares,
  });

  if (p1Result.validRows.length === 0) {
    return {
      ok: false,
      error: `All ${p1Result.qualitySummary.totalSubmitted} P1 Inventory rows were quarantined due to missing/corrupted fields. Repair or provide at least 1 valid row before committing.`,
      quarantinedByPillar: {
        P1: p1Result.quarantinedRows,
        P2: [],
        P3: [],
        P4: [],
      },
    };
  }

  // Validate optional P2, P3, P4 (or fall back to canonical plant sample if omitted so 4-pillar snapshot is complete)
  const hasSubmittedP2 = Array.isArray(datasetToValidate.p2Rows) && datasetToValidate.p2Rows.length > 0;
  const p2Result = hasSubmittedP2
    ? validateP2DispatchRows(datasetToValidate.p2Rows!)
    : null;

  const hasSubmittedP3 = Array.isArray(datasetToValidate.p3Rows) && datasetToValidate.p3Rows.length > 0;
  const p3Result = hasSubmittedP3
    ? validateP3FreightRows(datasetToValidate.p3Rows!)
    : null;

  const hasSubmittedP4 = Array.isArray(datasetToValidate.p4Rows) && datasetToValidate.p4Rows.length > 0;
  const p4Result = hasSubmittedP4
    ? validateP4WarehouseBinRows(datasetToValidate.p4Rows!)
    : null;

  // Lookup lead if available
  const existingLead = input.leadId
    ? await getLeadRecordById(input.leadId, leadsFilePath)
    : null;

  const companyName =
    (input.companyName && input.companyName.trim()) ||
    existingLead?.companyName ||
    'Pilot Manufacturing Client (Step-2 Upload)';
  const plantLocation =
    (input.plantLocation && input.plantLocation.trim()) ||
    existingLead?.plantLocation ||
    'Chennai Industrial Corridor, Tamil Nadu';

  const datasetSha256 = computePayloadSha256({
    leadId: input.leadId,
    p1Rows: datasetToValidate.p1Rows,
    p2Rows: datasetToValidate.p2Rows || [],
    p3Rows: datasetToValidate.p3Rows || [],
    p4Rows: datasetToValidate.p4Rows || [],
    excludeReserveSpares,
    anonymizationApplied,
  });

  const now = new Date();
  const preGeneratedImportRunId = generateImportRunId(now);

  const columnMappingUsed: Record<string, Record<string, string>> = {
    P1: p1Result.qualitySummary.columnMappingUsed,
    ...(p2Result ? { P2: p2Result.qualitySummary.columnMappingUsed } : {}),
    ...(p3Result ? { P3: p3Result.qualitySummary.columnMappingUsed } : {}),
    ...(p4Result ? { P4: p4Result.qualitySummary.columnMappingUsed } : {}),
  };

  const p1Q: PillarQualitySummary = p1Result.qualitySummary;
  const p2Q = p2Result?.qualitySummary;
  const p3Q = p3Result?.qualitySummary;
  const p4Q = p4Result?.qualitySummary;

  const totalSubmittedAll =
    p1Q.totalSubmitted +
    (p2Q?.totalSubmitted || 0) +
    (p3Q?.totalSubmitted || 0) +
    (p4Q?.totalSubmitted || 0);
  const validAcceptedAll =
    p1Q.validAccepted +
    (p2Q?.validAccepted || 0) +
    (p3Q?.validAccepted || 0) +
    (p4Q?.validAccepted || 0);
  const quarantinedRejectedAll =
    p1Q.quarantinedRejected +
    (p2Q?.quarantinedRejected || 0) +
    (p3Q?.quarantinedRejected || 0) +
    (p4Q?.quarantinedRejected || 0);

  const completenessPctAll =
    totalSubmittedAll > 0
      ? Math.round((validAcceptedAll / totalSubmittedAll) * 1000) / 10
      : 100;
  const duplicateKeysCountAll =
    (p1Q.duplicateKeysCount || 0) +
    (p2Q?.duplicateKeysCount || 0) +
    (p3Q?.duplicateKeysCount || 0) +
    (p4Q?.duplicateKeysCount || 0);

  const dataQualityOverview: SnapshotDataQualityOverview = {
    importRunId: preGeneratedImportRunId,
    datasetSha256,
    totalSubmitted: totalSubmittedAll,
    validAccepted: validAcceptedAll,
    quarantinedRejected: quarantinedRejectedAll,
    completenessPct: completenessPctAll,
    duplicateKeysCount: duplicateKeysCountAll,
    reserveSparesFlaggedCount: p1Q.reserveSparesCount || 0,
    reserveSparesExcludedValue: p1Q.reserveSparesValueINR || 0,
    p1Quality: {
      totalSubmitted: p1Q.totalSubmitted,
      validAccepted: p1Q.validAccepted,
      quarantinedRejected: p1Q.quarantinedRejected,
      reserveSparesCount: p1Q.reserveSparesCount || 0,
      reserveSparesValueINR: p1Q.reserveSparesValueINR || 0,
    },
    ...(p2Q
      ? {
          p2Quality: {
            totalSubmitted: p2Q.totalSubmitted,
            validAccepted: p2Q.validAccepted,
            quarantinedRejected: p2Q.quarantinedRejected,
          },
        }
      : {}),
    ...(p3Q
      ? {
          p3Quality: {
            totalSubmitted: p3Q.totalSubmitted,
            validAccepted: p3Q.validAccepted,
            quarantinedRejected: p3Q.quarantinedRejected,
          },
        }
      : {}),
    ...(p4Q
      ? {
          p4Quality: {
            totalSubmitted: p4Q.totalSubmitted,
            validAccepted: p4Q.validAccepted,
            quarantinedRejected: p4Q.quarantinedRejected,
          },
        }
      : {}),
    columnMappingUsed,
  };

  const mergedRules: StockRuleConfig = {
    ...DEFAULT_RULES,
    ...(input.rules || {}),
  };

  const assumptionsAndExclusions: SnapshotAssumptionsAndExclusions = {
    excludeReserveSpares,
    reserveSparesExcludedCount: p1Q.reserveSparesCount || 0,
    reserveSparesExcludedValue: p1Q.reserveSparesValueINR || 0,
    dateReferenceUsed: mergedRules.asOfDate,
    carryingCostPercentUsed: mergedRules.holdingCostPercent,
    quarantineExclusionsCount: quarantinedRejectedAll,
    anonymizationApplied,
    notes: [
      `Evaluation baseline date fixed at ${mergedRules.asOfDate} (Dead Stock threshold > ${mergedRules.deadThresholdDays}d, Slow-Moving threshold ${mergedRules.slowThresholdDays + 1}–${mergedRules.deadThresholdDays}d).`,
      `Annual inventory carrying cost rate modeled at ${mergedRules.holdingCostPercent}% p.a. (working capital cost + storage & obsolescence).`,
      excludeReserveSpares
        ? `${p1Q.reserveSparesCount || 0} critical machine / insurance spares (₹${(p1Q.reserveSparesValueINR || 0).toLocaleString('en-IN')}) flagged under Item 07 to retain as operational insurance rather than liquidate.`
        : `Critical machine / insurance spares (${p1Q.reserveSparesCount || 0} items, ₹${(p1Q.reserveSparesValueINR || 0).toLocaleString('en-IN')}) evaluated under standard movement rules.`,
      quarantinedRejectedAll > 0
        ? `${quarantinedRejectedAll} malformed ERP export rows were quarantined prior to P1–P4 math engine execution (zero silent date/zero coercions).`
        : '100% of submitted ERP rows passed strict schema & date validation.',
    ],
  };

  // Map validated P1 rows to SKUItem[]
  const skusForEngine = p1Result.validRows.map((row, index) => ({
    id: `ing-sku-${index + 1}`,
    itemCode: row.itemCode,
    itemName:
      excludeReserveSpares && row.isReserveSpare && !row.itemName.includes('[RESERVE SPARE]')
        ? `${row.itemName} [RESERVE SPARE]`
        : row.itemName,
    category: row.category,
    qtyOnHand: row.qtyOnHand,
    costRate: row.costRate,
    lastMovement: row.lastMovement,
    isReserveSpare: row.isReserveSpare,
  }));

  const p2DispatchesToUse: P2DispatchItem[] =
    p2Result && p2Result.validRows.length > 0
      ? (p2Result.validRows as unknown as P2DispatchItem[])
      : INITIAL_DISPATCHES;
  const p3TripsToUse =
    p3Result && p3Result.validRows.length > 0 ? p3Result.validRows : INITIAL_TRIPS;
  const p4BinsToUse =
    p4Result && p4Result.validRows.length > 0 ? p4Result.validRows : INITIAL_SAMPLE_SKUS;

  const defaultExecNotes = `Step-2 Ingestion Run ${preGeneratedImportRunId} (SHA-256: ${datasetSha256.slice(0, 16)}...): ${validAcceptedAll} valid rows accepted, ${quarantinedRejectedAll} rows quarantined. ${
    excludeReserveSpares && (p1Q.reserveSparesCount || 0) > 0
      ? `Item 07 Reserve Spares Exclusion applied to ${p1Q.reserveSparesCount} critical spares (₹${(p1Q.reserveSparesValueINR || 0).toLocaleString('en-IN')}).`
      : ''
  }`.trim();

  // Create PilotWorkspaceSnapshot
  const snapshot = await createPilotWorkspaceSnapshot(
    {
      companyName,
      plantLocation,
      leadId: input.leadId,
      preparedBy: input.preparedBy || 'C. Jones Snowin',
      executiveNotes: input.executiveNotes || defaultExecNotes,
      rules: mergedRules,
      skus: skusForEngine,
      p2Dispatches: p2DispatchesToUse,
      p2Rules: P2_DEFAULT_RULES,
      p3FreightTrips: p3TripsToUse,
      p3Rules: P3_DEFAULT_RULES,
      p4WarehouseBins: p4BinsToUse,
      p4Rules: P4_DEFAULT_RULES,
      importRunId: preGeneratedImportRunId,
      datasetSha256,
      excludeReserveSpares,
      anonymizationApplied,
      dataQualityOverview,
      assumptionsAndExclusions,
      commercialAccessMode: input.commercialAccessMode,
    },
    workspacesFilePath
  );

  const generatedWalkthroughUrl = `?view=pilot-walkthrough&workspaceId=${encodeURIComponent(
    snapshot.workspaceId
  )}&token=${encodeURIComponent(snapshot.shareToken)}`;

  // Persist ImportRunRecord
  const importRun = await createImportRunRecord(
    {
      importRunId: preGeneratedImportRunId,
      leadId: input.leadId,
      plantId: input.plantId || 'ambattur',
      companyName,
      plantLocation,
      datasetSha256,
      anonymizationApplied,
      excludeReserveSpares,
      columnMappingUsed,
      p1Quality: {
        totalSubmitted: p1Q.totalSubmitted,
        validAccepted: p1Q.validAccepted,
        quarantinedRejected: p1Q.quarantinedRejected,
        reserveSparesCount: p1Q.reserveSparesCount || 0,
        reserveSparesValueINR: p1Q.reserveSparesValueINR || 0,
      },
      ...(p2Q
        ? {
            p2Quality: {
              totalSubmitted: p2Q.totalSubmitted,
              validAccepted: p2Q.validAccepted,
              quarantinedRejected: p2Q.quarantinedRejected,
            },
          }
        : {}),
      ...(p3Q
        ? {
            p3Quality: {
              totalSubmitted: p3Q.totalSubmitted,
              validAccepted: p3Q.validAccepted,
              quarantinedRejected: p3Q.quarantinedRejected,
            },
          }
        : {}),
      ...(p4Q
        ? {
            p4Quality: {
              totalSubmitted: p4Q.totalSubmitted,
              validAccepted: p4Q.validAccepted,
              quarantinedRejected: p4Q.quarantinedRejected,
            },
          }
        : {}),
      quarantinedRows: {
        P1: p1Result.quarantinedRows,
        P2: p2Result?.quarantinedRows || [],
        P3: p3Result?.quarantinedRows || [],
        P4: p4Result?.quarantinedRows || [],
      },
      quarantinedRowsScrubbed: false,
      generatedWorkspaceId: snapshot.workspaceId,
      generatedWalkthroughUrl,
    },
    importRunsFilePath
  );

  // Update Lead Record if it exists in leadStore
  let updatedLead: PilotRequestRecord | null = null;
  if (existingLead) {
    updatedLead = await updateLeadRecord(
      existingLead.leadId,
      {
        status: 'APPROVED_FOR_UPLOAD',
        linkedWorkspaceId: snapshot.workspaceId,
        linkedWalkthroughUrl: generatedWalkthroughUrl,
        lastImportRunId: importRun.importRunId,
        lastImportAt: importRun.createdAt,
        dataQualityOverview: {
          totalSubmitted: totalSubmittedAll,
          validAccepted: validAcceptedAll,
          quarantinedRejected: quarantinedRejectedAll,
          reserveSparesExcludedValue: p1Q.reserveSparesValueINR || 0,
        },
      },
      leadsFilePath
    );
  }

  // Record governance event
  await recordServerAuditEvent(
    {
      actor: companyName,
      category: 'PILOT_WALKTHROUGH',
      action: 'PILOT_DATA_INGESTED',
      plantId:
        input.plantId && input.plantId !== 'custom' ? input.plantId : 'ambattur',
      details: `Ingested ${validAcceptedAll}/${totalSubmittedAll} valid rows (${quarantinedRejectedAll} quarantined) under ${importRun.importRunId} (SHA-256: ${datasetSha256.slice(0, 12)}...) -> Snapshot ${snapshot.workspaceId}`,
    },
    auditEventsFilePath
  );

  return {
    ok: true,
    importRun,
    snapshot,
    updatedLead,
    quarantinedByPillar: {
      P1: p1Result.quarantinedRows,
      P2: p2Result?.quarantinedRows || [],
      P3: p3Result?.quarantinedRows || [],
      P4: p4Result?.quarantinedRows || [],
    },
  };
}

export interface InstantSelfServeAuditInput {
  fullName: string;
  companyName: string;
  workEmail?: string;
  phoneOrWhatsapp?: string;
  plantLocation?: string;
  p1Rows: Array<Record<string, unknown>>;
}

export interface InstantSelfServeAuditResult {
  ok: boolean;
  error?: string;
  leadId?: string;
  workspaceId?: string;
  accessToken?: string;
  shareToken?: string;
  walkthroughUrl?: string;
  snapshot?: PilotWorkspaceSnapshot;
  importRun?: ImportRunRecord;
  lead?: PilotRequestRecord;
}

/**
 * 24/7 Zero-Touch Self-Serve CSV-to-Paywall Converter:
 * 1. Creates a PilotRequestRecord in `leadStore.ts`.
 * 2. Runs `executeStep2PilotIngestion` on the visitor's 5-column CSV rows to generate a
 *    4-pillar `PilotWorkspaceSnapshot` in `TEASER_LOCKED` mode.
 * 3. Triggers the 5-Agent Workforce pipeline (`triggerLeadArrivalAgentPipeline` + `triggerIngestionAgentPipeline`)
 *    and dispatches a `CLIENT_FILE_UPLOADED` founder alert.
 * 4. Returns `{ ok: true, leadId, workspaceId, accessToken, walkthroughUrl, snapshot }`.
 */
export async function executeInstantSelfServeAudit(
  input: InstantSelfServeAuditInput,
  options?: {
    importRunsFilePath?: string;
    workspacesFilePath?: string;
    leadsFilePath?: string;
    auditEventsFilePath?: string;
    workforceFilePath?: string;
    alertLogsFilePath?: string;
  }
): Promise<InstantSelfServeAuditResult> {
  const fullName = typeof input.fullName === 'string' ? input.fullName.trim() : '';
  const companyName = typeof input.companyName === 'string' ? input.companyName.trim() : '';
  const workEmail = typeof input.workEmail === 'string' ? input.workEmail.trim() : '';
  const phoneOrWhatsapp =
    typeof input.phoneOrWhatsapp === 'string' ? input.phoneOrWhatsapp.trim() : '';
  const plantLocation =
    typeof input.plantLocation === 'string' && input.plantLocation.trim()
      ? input.plantLocation.trim()
      : 'Chennai Industrial Corridor, Tamil Nadu';

  if (fullName.length < 2) {
    return { ok: false, error: 'Please enter your name (at least 2 characters).' };
  }
  if (companyName.length < 2) {
    return { ok: false, error: 'Please enter your company or factory name.' };
  }
  if (!workEmail && !phoneOrWhatsapp) {
    return {
      ok: false,
      error: 'Please enter either your work email or WhatsApp/phone number.',
    };
  }
  if (!Array.isArray(input.p1Rows) || input.p1Rows.length === 0) {
    return {
      ok: false,
      error: 'Please load or upload a valid 5-column CSV before generating your audit workspace.',
    };
  }

  const createdLead = await createLeadRecord(
    {
      fullName,
      companyName,
      plantLocation,
      workEmail,
      phoneOrWhatsapp,
      roleTitle: 'Plant / Operations Leadership (24/7 Self-Serve Sandbox)',
      erpSystem: '5-Column CSV Self-Serve Upload',
      approxSkuCount: `${input.p1Rows.length} SKUs (Instant Sandbox)`,
      primaryChallenge: '24/7 Self-Serve 5-Column CSV Upload -> Teaser Workspace',
      sourceView: 'instant_dropzone',
      consentConfirmed: true,
    },
    options?.leadsFilePath || DEFAULT_LEADS_FILE_PATH
  );

  const ingestion = await executeStep2PilotIngestion(
    {
      leadId: createdLead.leadId,
      companyName,
      plantLocation,
      plantId: 'ambattur',
      p1Rows: input.p1Rows,
      excludeReserveSpares: true,
      preparedBy: 'C. Jones Snowin',
      commercialAccessMode: 'TEASER_LOCKED',
    },
    {
      importRunsFilePath: options?.importRunsFilePath,
      workspacesFilePath: options?.workspacesFilePath,
      leadsFilePath: options?.leadsFilePath,
      auditEventsFilePath: options?.auditEventsFilePath,
    }
  );

  if (!ingestion.ok || !ingestion.snapshot || !ingestion.importRun) {
    return {
      ok: false,
      error:
        ingestion.error ||
        'Unable to generate your Teaser Audit Workspace from the uploaded CSV rows.',
    };
  }

  const snap = ingestion.snapshot;
  const walkthroughUrl = `?view=pilot-findings&id=${encodeURIComponent(
    snap.workspaceId
  )}&token=${encodeURIComponent(snap.shareToken)}`;

  await triggerLeadArrivalAgentPipeline(createdLead, options?.workforceFilePath).catch(
    () => {}
  );
  await triggerIngestionAgentPipeline(
    createdLead.leadId,
    ingestion.importRun,
    snap,
    options?.workforceFilePath
  ).catch(() => {});

  void dispatchFounderAlert(
    {
      eventType: 'CLIENT_FILE_UPLOADED',
      companyName: snap.companyName,
      plantLocation: snap.plantLocation,
      contactName: fullName,
      contactEmailOrPhone: workEmail || phoneOrWhatsapp,
      workEmail,
      phoneOrWhatsapp,
      leadId: createdLead.leadId,
      workspaceId: snap.workspaceId,
      shareToken: snap.shareToken,
      actionUrl: walkthroughUrl,
      skuCount: snap.summaryMetrics.totalSkus,
      deadStockValueInr: snap.summaryMetrics.deadStockValue,
      quarantinedRowsCount: ingestion.importRun.p1Quality?.quarantinedRejected || 0,
      notes: '24/7 Self-Serve Homepage CSV Sandbox -> Teaser Paywall Workspace',
    },
    options?.alertLogsFilePath ? { logFilePath: options.alertLogsFilePath } : undefined
  ).catch(() => {});

  return {
    ok: true,
    leadId: createdLead.leadId,
    workspaceId: snap.workspaceId,
    accessToken: snap.shareToken,
    shareToken: snap.shareToken,
    walkthroughUrl,
    snapshot: snap,
    importRun: ingestion.importRun,
    lead: ingestion.updatedLead || createdLead,
  };
}

/**
 * Generates a realistic Tally Prime / SAP export containing:
 * - 18 Valid P1 rows (using Tally Prime & SAP header names like `Stock_Item_Code`, `Particulars`, `Closing_Balance`, `Std_Rate`, `Last_Voucher_Date`, `Stock_Group`, `Is_Reserve_Spare`)
 * - 2 of those 18 valid rows are Critical Machine / Insurance Spares (`Is_Reserve_Spare: 'YES'`)
 * - 4 Intentional Dirty Rows (missing `Stock_Item_Code`, negative `Closing_Balance: -45`, non-numeric `Std_Rate: 'TBD_RATE'`, corrupted `Last_Voucher_Date: '32/13/2026'`)
 * Plus realistic P2, P3, and P4 sample rows with ERP alias headers.
 */
export function buildSampleDirtyTallyPrimeExportDataset(): {
  p1Rows: Array<Record<string, unknown>>;
  p2Rows: Array<Record<string, unknown>>;
  p3Rows: Array<Record<string, unknown>>;
  p4Rows: Array<Record<string, unknown>>;
} {
  const p1Rows: Array<Record<string, unknown>> = [
    // 16 regular valid rows (using Tally Prime / SAP alias headers)
    {
      Stock_Item_Code: 'AMB-RM-101',
      Particulars: 'EN8 Forged Steel Round Bar 65mm (Tally Batch #441)',
      Stock_Group: 'Raw Material',
      Closing_Balance: '420',
      Std_Rate: '₹185',
      Last_Voucher_Date: '12-08-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-RM-102',
      Particulars: 'SG Iron Casting Housing Blank SG400/15',
      Stock_Group: 'Raw Material',
      Closing_Balance: '95',
      Std_Rate: '₹1,120',
      Last_Voucher_Date: '15-01-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-FG-201',
      Particulars: 'Machined Hydraulic Valve Manifold Assembly V4',
      Stock_Group: 'Finished Goods',
      Closing_Balance: '28',
      Std_Rate: '₹4,450',
      Last_Voucher_Date: '04-02-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-FG-204',
      Particulars: 'High-Pressure Flange Adapter DN80 (Legacy OEM Spec)',
      Stock_Group: 'Finished Goods',
      Closing_Balance: '64',
      Std_Rate: '₹1,650',
      Last_Voucher_Date: '19-11-2025',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-RM-108',
      Particulars: 'SS316L Cold Drawn Hex Bar 32mm',
      Stock_Group: 'Raw Material',
      Closing_Balance: '150',
      Std_Rate: '₹410',
      Last_Voucher_Date: '18-05-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-CN-301',
      Particulars: 'Carbide CNC Turning Insert CNMG 120408 (Box of 10)',
      Stock_Group: 'Consumable',
      Closing_Balance: '35',
      Std_Rate: '₹2,150',
      Last_Voucher_Date: '02-09-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-FG-209',
      Particulars: 'Precision Ground Pump Shaft Ø40x320mm',
      Stock_Group: 'Finished Goods',
      Closing_Balance: '42',
      Std_Rate: '₹1,980',
      Last_Voucher_Date: '10-12-2025',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-RM-114',
      Particulars: 'Phosphor Bronze Bush Blank PB2 Ø90mm',
      Stock_Group: 'Raw Material',
      Closing_Balance: '38',
      Std_Rate: '₹2,400',
      Last_Voucher_Date: '22-01-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-CN-305',
      Particulars: 'Synthetic Water-Soluble CNC Coolant Concentrate 20L',
      Stock_Group: 'Consumable',
      Closing_Balance: '18',
      Std_Rate: '₹3,200',
      Last_Voucher_Date: '28-08-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-FG-215',
      Particulars: 'Actuator Mounting Bracket Sub-Assembly Rev-A (Obsolete)',
      Stock_Group: 'Finished Goods',
      Closing_Balance: '80',
      Std_Rate: '₹890',
      Last_Voucher_Date: '14-10-2025',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-RM-119',
      Particulars: 'Alloy Steel Forged Gear Blank 20MnCr5',
      Stock_Group: 'Raw Material',
      Closing_Balance: '110',
      Std_Rate: '₹760',
      Last_Voucher_Date: '05-06-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-SP-401',
      Particulars: 'Standard V-Belt Drive Set B-68',
      Stock_Group: 'Spares',
      Closing_Balance: '24',
      Std_Rate: '₹650',
      Last_Voucher_Date: '11-02-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-FG-221',
      Particulars: 'Heavy Duty Check Valve Body 4-Inch Class 300',
      Stock_Group: 'Finished Goods',
      Closing_Balance: '19',
      Std_Rate: '₹5,400',
      Last_Voucher_Date: '09-01-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-RM-125',
      Particulars: 'Ductile Iron Manifolds Batch #119',
      Stock_Group: 'Raw Material',
      Closing_Balance: '60',
      Std_Rate: '₹1,350',
      Last_Voucher_Date: '14-08-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-CN-312',
      Particulars: 'VCI Rust Preventive Export Packaging Film Roll',
      Stock_Group: 'Consumable',
      Closing_Balance: '45',
      Std_Rate: '₹920',
      Last_Voucher_Date: '25-07-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-FG-228',
      Particulars: 'Custom Tapered Roller Bearing Housing Assembly',
      Stock_Group: 'Finished Goods',
      Closing_Balance: '32',
      Std_Rate: '₹2,750',
      Last_Voucher_Date: '01-03-2026',
      Is_Reserve_Spare: 'NO',
    },
    // 2 Critical Machine / Insurance Spares (Valid rows, >180d old, tagged as Reserve Spares under Item 07)
    {
      Stock_Item_Code: 'AMB-SP-901',
      Particulars: 'Mazak VTC-800 Main CNC Spindle Cartridge Assembly (Critical Machine Spare)',
      Stock_Group: 'Spares',
      Closing_Balance: '1',
      Std_Rate: '₹68,500',
      Last_Voucher_Date: '12-09-2025',
      Is_Reserve_Spare: 'YES',
    },
    {
      Stock_Item_Code: 'AMB-SP-902',
      Particulars: 'Fanuc Alpha-i Servo Amplifier Drive Module (Insurance Spare)',
      Stock_Group: 'Spares',
      Closing_Balance: '1',
      Std_Rate: '₹44,000',
      Last_Voucher_Date: '20-10-2025',
      Is_Reserve_Spare: 'YES',
    },
    // 4 Intentional Dirty Rows (to trigger Quarantine Engine & Interactive Cell Repair)
    {
      Stock_Item_Code: '',
      Particulars: 'Unindexed Shopfloor Casting Scrap Pallet #7',
      Stock_Group: 'Raw Material',
      Closing_Balance: '50',
      Std_Rate: '₹420',
      Last_Voucher_Date: '10-04-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-DIRTY-NEG',
      Particulars: 'Unreconciled Sub-Contractor Challan Return (Negative Ledger Balance)',
      Stock_Group: 'Raw Material',
      Closing_Balance: '-45',
      Std_Rate: '₹1,150',
      Last_Voucher_Date: '18-03-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-DIRTY-RATE',
      Particulars: 'Imported Special Seal Kit (Pending Customs Valuation)',
      Stock_Group: 'Spares',
      Closing_Balance: '15',
      Std_Rate: 'TBD_RATE',
      Last_Voucher_Date: '05-05-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-DIRTY-DATE',
      Particulars: 'Legacy Forged Coupling Batch (Corrupted Tally Voucher Date)',
      Stock_Group: 'Finished Goods',
      Closing_Balance: '30',
      Std_Rate: '₹1,800',
      Last_Voucher_Date: '32/13/2026',
      Is_Reserve_Spare: 'NO',
    },
  ];

  const p2Rows = INITIAL_DISPATCHES.slice(0, 10).map((d) => ({
    Dispatch_ID: d.id,
    Customer_Name: d.customer,
    PO_Ref: d.po,
    Part_Code: d.part,
    Ordered_Qty: String(d.orderedQty),
    Dispatched_Qty: String(d.shippedQty),
    Promised_Date: d.promisedDate,
    Actual_Gate_Out_Date: d.actualOut,
    Delay_Reason_Category: d.delayReason,
  }));

  const p3Rows = INITIAL_TRIPS.slice(0, 8).map((t) => ({
    Trip_ID: t.id,
    Trip_Date: t.date,
    Route_Lane: t.lane,
    Distance_Km: String(t.km),
    Transporter_Name: t.transporter,
    Load_Weight_Kg: String(t.weightKg),
    Freight_Bill_INR: String(t.bill),
    Gate_Wait_Hours: String(t.waitHours),
    Is_Split_Trip: t.split,
    Is_Empty_Return: t.emptyReturn,
  }));

  const p4Rows = INITIAL_SAMPLE_SKUS.slice(0, 10).map((b) => ({
    Bin_Code: b.code,
    Part_Description: b.part,
    Rack_Zone: b.spot,
    System_Book_Qty: String(b.systemQty),
    Physical_Count_Qty: String(b.physicalQty),
    Unit_Cost_INR: String(b.cost),
    Monthly_Issues_Freq: String(b.issuesPerMonth),
  }));

  return { p1Rows, p2Rows, p3Rows, p4Rows };
}
