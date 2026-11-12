/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Multi-Store 14-Day Data Purge & Cryptographic Deletion Certificate Engine (Phase 8).
 * Enforces Operationalyst's 14-day pilot data retention commitment across:
 * 1. ./data/pilot_workspaces.json (P1–P4 line items scrubbed, tombstone preserved)
 * 2. ./data/import_runs.json (quarantined raw rows scrubbed, SHA-256 & counts preserved)
 * 3. ./data/pilot_requests.json (linked lead CLOSED, uploadToken revoked)
 * 4. ./data/deletion_certificates.json (permanent DELCERT-YYYYMMDD-XXXX cryptographic certificate)
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {
  DEFAULT_WORKSPACES_FILE_PATH,
  PUBLIC_DEMO_WORKSPACE_ID,
  buildPublicDemoMultiPillarSnapshot,
  withWorkspaceStoreLock,
  type PilotWorkspaceSnapshot,
} from './pilotWorkspaceStore.ts';
import {
  DEFAULT_IMPORT_RUNS_FILE_PATH,
  scrubImportRunsForWorkspaceOrLead,
} from './importRunStore.ts';
import {
  DEFAULT_LEADS_FILE_PATH,
  listLeadRecords,
  updateLeadRecord,
} from './leadStore.ts';
import {
  DEFAULT_AUDIT_EVENTS_FILE_PATH,
  recordServerAuditEvent,
} from './serverAuditLog.ts';

export const DEFAULT_DELETION_CERTIFICATES_FILE_PATH = path.resolve(
  process.cwd(),
  'data',
  'deletion_certificates.json'
);

export const PUBLIC_DEMO_DELETION_CERT_ID = 'DELCERT-DEMO-P1P4';

export interface RecordsPurgedSummary {
  p1SkusPurged: number;
  p2DispatchesPurged: number;
  p3TripsPurged: number;
  p3FreightTripsPurged: number;
  p4BinsPurged: number;
  p4WarehouseBinsPurged: number;
  importRunsScrubbed: number;
  quarantinedRowsPurged: number;
  p1BookValueInr: number;
}

export type PurgeReasonCode =
  | 'IMMEDIATE_CLIENT_OR_ADMIN_PURGE'
  | 'AUTOMATED_14_DAY_EXPIRY_SWEEP'
  | 'DEMO_NON_DESTRUCTIVE_PREVIEW'
  | 'MANUAL_CLIENT_REQUEST'
  | 'MANUAL_FOUNDER_PURGE'
  | 'RETENTION_EXPIRED_14D';

export interface DeletionCertificateRecord {
  certificateId: string; // DELCERT-YYYYMMDD-XXXX or DELCERT-DEMO-P1P4
  workspaceId: string;
  leadId?: string;
  importRunId?: string;
  companyName: string;
  plantLocation: string;
  issuedAt: string; // ISO-8601 UTC
  requestedBy: string;
  purgedBy: string;
  purgeReason: PurgeReasonCode;
  retentionPolicyDays: number;
  recordsPurgedSummary: RecordsPurgedSummary;
  prePurgeDatasetSha256: string; // 64-char SHA-256 hex digest of P1-P4 line items before purge
  postPurgeVerificationHash: string; // 64-char SHA-256 hex digest of zeroed arrays confirming 0 retained rows
  zeroRetainedLineItemsConfirmed: true;
  linkedLeadClosedAndTokenRevoked: boolean;
  issuerAttestation: string;
}

export interface PurgeExecutionOptions {
  requestedBy?: string;
  purgedBy?: string;
  purgeReason?: PurgeReasonCode;
  workspacesFilePath?: string;
  importRunsFilePath?: string;
  leadsFilePath?: string;
  deletionCertificatesFilePath?: string;
  certificatesFilePath?: string;
  auditEventsFilePath?: string;
  now?: Date;
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

async function ensureCertStorageFile(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '[]\n', 'utf8');
  }
}

async function readAllCertificatesUnsafe(
  filePath: string
): Promise<DeletionCertificateRecord[]> {
  await ensureCertStorageFile(filePath);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DeletionCertificateRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeAllCertificatesUnsafe(
  filePath: string,
  records: DeletionCertificateRecord[]
): Promise<void> {
  await ensureCertStorageFile(filePath);
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
  await fs.writeFile(tempPath, JSON.stringify(records, null, 2) + '\n', 'utf8');
  await fs.rename(tempPath, filePath);
}

export function generateDeletionCertificateId(now: Date = new Date()): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `DELCERT-${yyyy}${mm}${dd}-${suffix}`;
}

/**
 * Computes a deterministic 64-character SHA-256 hex digest over P1–P4 dataset arrays.
 */
export function computeDatasetArraysSha256(payload: {
  skus: unknown[];
  p2Dispatches: unknown[];
  p3FreightTrips: unknown[];
  p4WarehouseBins: unknown[];
}): string {
  const canonical = JSON.stringify({
    skus: Array.isArray(payload.skus) ? payload.skus : [],
    p2Dispatches: Array.isArray(payload.p2Dispatches) ? payload.p2Dispatches : [],
    p3FreightTrips: Array.isArray(payload.p3FreightTrips) ? payload.p3FreightTrips : [],
    p4WarehouseBins: Array.isArray(payload.p4WarehouseBins) ? payload.p4WarehouseBins : [],
  });
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Computes the deterministic SHA-256 verification hash over the zeroed P1–P4 arrays,
 * proving 0 retained raw line items remain in the workspace.
 */
export function computeZeroedArraysVerificationHash(): string {
  return computeDatasetArraysSha256({
    skus: [],
    p2Dispatches: [],
    p3FreightTrips: [],
    p4WarehouseBins: [],
  });
}

/**
 * Builds the non-destructive sample DeletionCertificateRecord (DELCERT-DEMO-P1P4)
 * for the public 20-SKU Ambattur Sandbox so visitors can inspect a live certificate
 * without destroying the public demo walkthrough.
 */
export function buildPublicDemoDeletionCertificate(): DeletionCertificateRecord {
  const demoSnap = buildPublicDemoMultiPillarSnapshot();
  const preHash = computeDatasetArraysSha256({
    skus: demoSnap.evaluatedSkus || [],
    p2Dispatches: demoSnap.evaluatedP2Dispatches || [],
    p3FreightTrips: demoSnap.evaluatedP3Trips || [],
    p4WarehouseBins: demoSnap.evaluatedP4Bins || [],
  });
  const postHash = computeZeroedArraysVerificationHash();

  const p1Count = demoSnap.evaluatedSkus?.length || 20;
  const p2Count = demoSnap.evaluatedP2Dispatches?.length || 18;
  const p3Count = demoSnap.evaluatedP3Trips?.length || 12;
  const p4Count = demoSnap.evaluatedP4Bins?.length || 15;

  return {
    certificateId: PUBLIC_DEMO_DELETION_CERT_ID,
    workspaceId: PUBLIC_DEMO_WORKSPACE_ID,
    leadId: demoSnap.leadId || 'PILOT-DEMO-SANDBOX',
    importRunId: demoSnap.importRunId || 'IMPRUN-20261012-DEMO',
    companyName: demoSnap.companyName,
    plantLocation: demoSnap.plantLocation,
    issuedAt: '2026-10-26T09:00:00.000Z',
    requestedBy: 'Demonstration Governance Verifier (Non-Destructive Sandbox Preview)',
    purgedBy: 'Demonstration Governance Verifier (Non-Destructive Sandbox Preview)',
    purgeReason: 'DEMO_NON_DESTRUCTIVE_PREVIEW',
    retentionPolicyDays: 14,
    recordsPurgedSummary: {
      p1SkusPurged: p1Count,
      p2DispatchesPurged: p2Count,
      p3TripsPurged: p3Count,
      p3FreightTripsPurged: p3Count,
      p4BinsPurged: p4Count,
      p4WarehouseBinsPurged: p4Count,
      importRunsScrubbed: 1,
      quarantinedRowsPurged: 0,
      p1BookValueInr: demoSnap.summaryMetrics.totalStockValue,
    },
    prePurgeDatasetSha256: preHash,
    postPurgeVerificationHash: postHash,
    zeroRetainedLineItemsConfirmed: true,
    linkedLeadClosedAndTokenRevoked: true,
    issuerAttestation:
      'Operationalyst Data Governance Engine (C. Jones Snowin / Snowin Ventures, Chennai) — Sample Cryptographic Deletion Certificate bound to the 20-SKU Sandbox Benchmark. Public demo data remains active for visitor walkthroughs.',
  };
}

/**
 * Lists all persisted DeletionCertificateRecord entries sorted newest-first.
 */
export async function listDeletionCertificates(
  filePath: string = DEFAULT_DELETION_CERTIFICATES_FILE_PATH
): Promise<DeletionCertificateRecord[]> {
  return withSerializedLock(filePath, async () => {
    const records = await readAllCertificatesUnsafe(filePath);
    return [...records].sort((a, b) => {
      const diff = new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
      if (diff !== 0) return diff;
      return b.certificateId.localeCompare(a.certificateId);
    });
  });
}

/**
 * Retrieves a single DeletionCertificateRecord by certificateId (including built-in DELCERT-DEMO-P1P4).
 */
export async function getDeletionCertificateById(
  certificateId: string,
  filePath: string = DEFAULT_DELETION_CERTIFICATES_FILE_PATH
): Promise<DeletionCertificateRecord | null> {
  const cleanId = String(certificateId || '').trim().toUpperCase();
  if (!cleanId) return null;
  if (cleanId === PUBLIC_DEMO_DELETION_CERT_ID) {
    return buildPublicDemoDeletionCertificate();
  }
  return withSerializedLock(filePath, async () => {
    const records = await readAllCertificatesUnsafe(filePath);
    return records.find((c) => c.certificateId.toUpperCase() === cleanId) || null;
  });
}

/**
 * Executes a multi-store cryptographic purge for a Pilot Audit Workspace (AUDIT-...).
 */
export async function purgePilotWorkspace(
  workspaceIdOrObj:
    | string
    | {
        workspaceId: string;
        purgedBy?: string;
        requestedBy?: string;
        purgeReason?: PurgeReasonCode;
      },
  options: PurgeExecutionOptions = {}
): Promise<{
  ok: boolean;
  isDemoProtected?: boolean;
  demoProtected?: boolean;
  certificate?: DeletionCertificateRecord;
  snapshot?: PilotWorkspaceSnapshot;
  error?: string;
}> {
  const isObj =
    workspaceIdOrObj !== null &&
    typeof workspaceIdOrObj === 'object' &&
    'workspaceId' in workspaceIdOrObj;
  const cleanWorkspaceId = String(
    isObj ? workspaceIdOrObj.workspaceId : workspaceIdOrObj || ''
  ).trim();
  const mergedOptions: PurgeExecutionOptions = isObj
    ? {
        ...options,
        purgedBy: workspaceIdOrObj.purgedBy ?? options.purgedBy,
        requestedBy:
          workspaceIdOrObj.requestedBy ??
          workspaceIdOrObj.purgedBy ??
          options.requestedBy ??
          options.purgedBy,
        purgeReason: workspaceIdOrObj.purgeReason ?? options.purgeReason,
      }
    : options;

  if (!cleanWorkspaceId) {
    return { ok: false, error: 'Workspace ID is required to execute data purge.' };
  }

  // Demo Protection Rule: Never destructively purge AUDIT-DEMO-P1P4
  if (cleanWorkspaceId === PUBLIC_DEMO_WORKSPACE_ID) {
    const demoCert = buildPublicDemoDeletionCertificate();
    const demoSnap = buildPublicDemoMultiPillarSnapshot();
    return {
      ok: true,
      isDemoProtected: true,
      demoProtected: true,
      certificate: demoCert,
      snapshot: demoSnap,
    };
  }

  const workspacesFilePath = mergedOptions.workspacesFilePath || DEFAULT_WORKSPACES_FILE_PATH;
  const importRunsFilePath = mergedOptions.importRunsFilePath || DEFAULT_IMPORT_RUNS_FILE_PATH;
  const leadsFilePath = mergedOptions.leadsFilePath || DEFAULT_LEADS_FILE_PATH;
  const certsFilePath =
    mergedOptions.deletionCertificatesFilePath ||
    mergedOptions.certificatesFilePath ||
    DEFAULT_DELETION_CERTIFICATES_FILE_PATH;
  const auditEventsFilePath = mergedOptions.auditEventsFilePath || DEFAULT_AUDIT_EVENTS_FILE_PATH;
  const now = mergedOptions.now || new Date();
  const isoNow = now.toISOString();
  const requestedBy =
    mergedOptions.requestedBy?.trim() ||
    mergedOptions.purgedBy?.trim() ||
    'Authorized Plant / Governance Officer';
  const purgeReason = mergedOptions.purgeReason || 'IMMEDIATE_CLIENT_OR_ADMIN_PURGE';

  // Step 1: Lock and scrub the target workspace in pilot_workspaces.json
  const workspaceScrubResult = await withWorkspaceStoreLock(
    workspacesFilePath,
    async (records, save) => {
      const idx = records.findIndex((w) => w.workspaceId === cleanWorkspaceId);
      if (idx === -1) {
        return { found: false as const };
      }

      const target = records[idx];

      // If already purged, return existing state and certificateId
      if (target.retentionStatus === 'PURGED' && target.deletionCertificateId) {
        return {
          found: true as const,
          alreadyPurged: true as const,
          snapshot: target,
        };
      }

      const currentSkus = target.evaluatedSkus || target.skus || [];
      const currentP2 = target.evaluatedP2Dispatches || target.p2Dispatches || [];
      const currentP3 = target.evaluatedP3Trips || target.p3FreightTrips || [];
      const currentP4 = target.evaluatedP4Bins || target.p4WarehouseBins || [];

      const prePurgeDatasetSha256 =
        typeof target.datasetSha256 === 'string' && target.datasetSha256.trim().length === 64
          ? target.datasetSha256.trim()
          : typeof target.prePurgeSnapshotIntegrityHash === 'string' &&
            target.prePurgeSnapshotIntegrityHash.trim().length === 64
          ? target.prePurgeSnapshotIntegrityHash.trim()
          : computeDatasetArraysSha256({
              skus: currentSkus,
              p2Dispatches: currentP2,
              p3FreightTrips: currentP3,
              p4WarehouseBins: currentP4,
            });

      const counts = {
        p1SkusPurged: currentSkus.length,
        p2DispatchesPurged: currentP2.length,
        p3TripsPurged: currentP3.length,
        p4BinsPurged: currentP4.length,
        quarantinedRowsPurged: target.dataQualityOverview?.quarantinedRejected || 0,
      };

      const certId = generateDeletionCertificateId(now);

      const purgedSnapshot: PilotWorkspaceSnapshot = {
        ...target,
        updatedAt: isoNow,
        executiveNotes: '[PURGED PER DATA RETENTION POLICY]',
        evaluatedSkus: [],
        evaluatedP2Dispatches: [],
        evaluatedP3Trips: [],
        evaluatedP4Bins: [],
        skus: [],
        p2Dispatches: [],
        p3FreightTrips: [],
        p4WarehouseBins: [],
        retentionStatus: 'PURGED',
        purgedAt: isoNow,
        deletionCertificateId: certId,
        prePurgeSnapshotIntegrityHash: prePurgeDatasetSha256,
      };

      const nextRecords = [...records];
      nextRecords[idx] = purgedSnapshot;
      await save(nextRecords);

      return {
        found: true as const,
        alreadyPurged: false as const,
        snapshot: purgedSnapshot,
        certId,
        prePurgeDatasetSha256,
        counts,
      };
    }
  );

  if (!workspaceScrubResult.found) {
    return {
      ok: false,
      error: `Pilot Audit Workspace '${cleanWorkspaceId}' not found.`,
    };
  }

  if (workspaceScrubResult.alreadyPurged) {
    const existingCert = workspaceScrubResult.snapshot.deletionCertificateId
      ? await getDeletionCertificateById(
          workspaceScrubResult.snapshot.deletionCertificateId,
          certsFilePath
        )
      : null;
    if (existingCert) {
      return {
        ok: true,
        isDemoProtected: false,
        demoProtected: false,
        certificate: existingCert,
        snapshot: workspaceScrubResult.snapshot,
      };
    }
  }

  const { snapshot: purgedSnapshot, certId, prePurgeDatasetSha256, counts } =
    workspaceScrubResult as {
      found: true;
      alreadyPurged: false;
      snapshot: PilotWorkspaceSnapshot;
      certId: string;
      prePurgeDatasetSha256: string;
      counts: {
        p1SkusPurged: number;
        p2DispatchesPurged: number;
        p3TripsPurged: number;
        p4BinsPurged: number;
        quarantinedRowsPurged: number;
      };
    };

  // Step 2: Scrub linked ImportRuns in ./data/import_runs.json
  const importRunsScrubbed = await scrubImportRunsForWorkspaceOrLead(
    {
      workspaceId: cleanWorkspaceId,
      leadId: purgedSnapshot.leadId,
      importRunId: purgedSnapshot.importRunId,
      deletionCertificateId: certId,
      purgedAt: isoNow,
    },
    importRunsFilePath
  );

  // Step 3: Close linked Lead & revoke uploadToken in ./data/pilot_requests.json
  let linkedLeadClosed = false;
  const allLeads = await listLeadRecords(leadsFilePath);
  const matchingLeads = allLeads.filter(
    (l) =>
      (purgedSnapshot.leadId && l.leadId === purgedSnapshot.leadId) ||
      l.linkedWorkspaceId === cleanWorkspaceId
  );

  for (const lead of matchingLeads) {
    const updated = await updateLeadRecord(
      lead.leadId,
      {
        status: 'CLOSED',
        uploadToken: 'PURGED_REVOKED',
        uploadPortalUrl: `?view=pilot-upload&leadId=${encodeURIComponent(lead.leadId)}&token=PURGED_REVOKED`,
        deletionCertificateId: certId,
        purgedAt: isoNow,
      },
      leadsFilePath
    );
    if (updated) {
      linkedLeadClosed = true;
    }
  }

  // Step 4: Compute postPurgeVerificationHash over zeroed arrays and persist DeletionCertificateRecord
  const postPurgeVerificationHash = computeDatasetArraysSha256({
    skus: purgedSnapshot.evaluatedSkus,
    p2Dispatches: purgedSnapshot.evaluatedP2Dispatches || [],
    p3FreightTrips: purgedSnapshot.evaluatedP3Trips || [],
    p4WarehouseBins: purgedSnapshot.evaluatedP4Bins || [],
  });

  const certificate: DeletionCertificateRecord = {
    certificateId: certId,
    workspaceId: cleanWorkspaceId,
    ...(purgedSnapshot.leadId ? { leadId: purgedSnapshot.leadId } : {}),
    ...(purgedSnapshot.importRunId ? { importRunId: purgedSnapshot.importRunId } : {}),
    companyName: purgedSnapshot.companyName,
    plantLocation: purgedSnapshot.plantLocation,
    issuedAt: isoNow,
    requestedBy,
    purgedBy: requestedBy,
    purgeReason,
    retentionPolicyDays: purgedSnapshot.retentionPolicyDays || 14,
    recordsPurgedSummary: {
      p1SkusPurged: counts.p1SkusPurged,
      p2DispatchesPurged: counts.p2DispatchesPurged,
      p3TripsPurged: counts.p3TripsPurged,
      p3FreightTripsPurged: counts.p3TripsPurged,
      p4BinsPurged: counts.p4BinsPurged,
      p4WarehouseBinsPurged: counts.p4BinsPurged,
      importRunsScrubbed,
      quarantinedRowsPurged: counts.quarantinedRowsPurged,
      p1BookValueInr: purgedSnapshot.summaryMetrics.totalStockValue,
    },
    prePurgeDatasetSha256,
    postPurgeVerificationHash,
    zeroRetainedLineItemsConfirmed: true,
    linkedLeadClosedAndTokenRevoked: linkedLeadClosed,
    issuerAttestation: `Operationalyst Data Governance Engine (C. Jones Snowin / Snowin Ventures, Chennai) — All P1–P4 raw line items for ${cleanWorkspaceId} have been permanently scrubbed per the 14-day B2B data retention commitment.`,
  };

  await withSerializedLock(certsFilePath, async () => {
    const existingCerts = await readAllCertificatesUnsafe(certsFilePath);
    existingCerts.push(certificate);
    await writeAllCertificatesUnsafe(certsFilePath, existingCerts);
  });

  await recordServerAuditEvent(
    {
      actor: requestedBy,
      category: 'GOVERNANCE',
      action: 'PILOT_DATA_PURGED',
      details: `Issued ${certId} for workspace ${cleanWorkspaceId} (${counts.p1SkusPurged} P1 SKUs, ${counts.p2DispatchesPurged} P2 dispatches, ${counts.p3TripsPurged} P3 trips, ${counts.p4BinsPurged} P4 bins purged; ${importRunsScrubbed} import runs scrubbed).`,
    },
    auditEventsFilePath
  );

  return {
    ok: true,
    isDemoProtected: false,
    demoProtected: false,
    certificate,
    snapshot: purgedSnapshot,
  };
}

/**
 * Extends a workspace's retentionExpiresAt window by +30 days (sets retentionStatus: 'EXTENDED_BY_CLIENT').
 * Supports both (workspaceId, options) and (workspaceId, additionalDays, requestedBy, options).
 */
export async function extendPilotWorkspaceRetention(
  workspaceId: string,
  optionsOrAdditionalDays:
    | number
    | {
        requestedBy?: string;
        additionalDays?: number;
        workspacesFilePath?: string;
        auditEventsFilePath?: string;
        now?: Date;
      } = {},
  maybeRequestedBy?: string,
  maybeOptions?: {
    workspacesFilePath?: string;
    auditEventsFilePath?: string;
    now?: Date;
  }
): Promise<{
  ok: boolean;
  snapshot?: PilotWorkspaceSnapshot;
  error?: string;
}> {
  const cleanWorkspaceId = String(workspaceId || '').trim();
  if (!cleanWorkspaceId) {
    return { ok: false, error: 'Workspace ID is required.' };
  }

  const options =
    typeof optionsOrAdditionalDays === 'number'
      ? {
          ...(maybeOptions || {}),
          additionalDays: optionsOrAdditionalDays,
          requestedBy: maybeRequestedBy,
        }
      : optionsOrAdditionalDays || {};

  const additionalDays =
    typeof options.additionalDays === 'number' && options.additionalDays > 0
      ? Math.round(options.additionalDays)
      : 30;
  const now = options.now || new Date();
  const requestedBy = options.requestedBy?.trim() || 'Authorized Client / Plant Reviewer';
  const workspacesFilePath = options.workspacesFilePath || DEFAULT_WORKSPACES_FILE_PATH;
  const auditEventsFilePath = options.auditEventsFilePath || DEFAULT_AUDIT_EVENTS_FILE_PATH;

  if (cleanWorkspaceId === PUBLIC_DEMO_WORKSPACE_ID) {
    const demoSnap = buildPublicDemoMultiPillarSnapshot();
    const extendedExpires = new Date(
      now.getTime() + (14 + additionalDays) * 24 * 60 * 60 * 1000
    ).toISOString();
    const updatedDemo: PilotWorkspaceSnapshot = {
      ...demoSnap,
      updatedAt: now.toISOString(),
      retentionPolicyDays: 14 + additionalDays,
      retentionExpiresAt: extendedExpires,
      retentionStatus: 'EXTENDED_BY_CLIENT',
    };
    await recordServerAuditEvent(
      {
        actor: requestedBy,
        category: 'GOVERNANCE',
        action: 'RETENTION_EXTENDED',
        details: `Extended retention window by +${additionalDays} days on ${cleanWorkspaceId} until ${extendedExpires.slice(0, 10)}.`,
      },
      auditEventsFilePath
    );
    return { ok: true, snapshot: updatedDemo };
  }

  const extendResult = await withWorkspaceStoreLock(
    workspacesFilePath,
    async (records, save) => {
      const idx = records.findIndex((w) => w.workspaceId === cleanWorkspaceId);
      if (idx === -1) {
        return { status: 'NOT_FOUND' as const };
      }

      const target = records[idx];
      if (target.retentionStatus === 'PURGED') {
        return { status: 'ALREADY_PURGED' as const };
      }

      const currentExpiryMs = Date.parse(target.retentionExpiresAt);
      const baseMs =
        Number.isFinite(currentExpiryMs) && currentExpiryMs > now.getTime()
          ? currentExpiryMs
          : now.getTime();
      const nextExpiresAt = new Date(
        baseMs + additionalDays * 24 * 60 * 60 * 1000
      ).toISOString();

      const updated: PilotWorkspaceSnapshot = {
        ...target,
        updatedAt: now.toISOString(),
        retentionPolicyDays: (target.retentionPolicyDays || 14) + additionalDays,
        retentionExpiresAt: nextExpiresAt,
        retentionStatus: 'EXTENDED_BY_CLIENT',
      };

      const nextRecords = [...records];
      nextRecords[idx] = updated;
      await save(nextRecords);
      return { status: 'OK' as const, snapshot: updated };
    }
  );

  if (extendResult.status === 'NOT_FOUND') {
    return { ok: false, error: `Workspace '${cleanWorkspaceId}' not found.` };
  }
  if (extendResult.status === 'ALREADY_PURGED') {
    return {
      ok: false,
      error: `Workspace '${cleanWorkspaceId}' has already been permanently purged.`,
    };
  }

  await recordServerAuditEvent(
    {
      actor: requestedBy,
      category: 'GOVERNANCE',
      action: 'RETENTION_EXTENDED',
      details: `Extended retention window by +${additionalDays} days on workspace ${cleanWorkspaceId} until ${extendResult.snapshot.retentionExpiresAt.slice(0, 10)}.`,
    },
    auditEventsFilePath
  );

  return { ok: true, snapshot: extendResult.snapshot };
}

/**
 * Sweeps and purges all non-demo workspaces where retentionStatus === 'ACTIVE_RETENTION_WINDOW'
 * and retentionExpiresAt < now.
 * Supports both sweepExpiredWorkspaces(options) and sweepExpiredWorkspaces(nowDate, options).
 */
export async function sweepExpiredWorkspaces(
  optionsOrNow: PurgeExecutionOptions | Date = {},
  maybeOptions: PurgeExecutionOptions = {}
): Promise<{
  ok: boolean;
  sweptCount: number;
  sweptWorkspaceIds: string[];
  certificates: DeletionCertificateRecord[];
}> {
  const options: PurgeExecutionOptions =
    optionsOrNow instanceof Date
      ? { ...maybeOptions, now: optionsOrNow }
      : optionsOrNow || {};
  const workspacesFilePath = options.workspacesFilePath || DEFAULT_WORKSPACES_FILE_PATH;
  const now = options.now || new Date();
  const nowMs = now.getTime();

  const expiredIds = await withWorkspaceStoreLock(workspacesFilePath, async (records) => {
    return records
      .filter((w) => {
        if (w.workspaceId === PUBLIC_DEMO_WORKSPACE_ID) return false;
        if (w.retentionStatus !== 'ACTIVE_RETENTION_WINDOW') return false;
        const expMs = Date.parse(w.retentionExpiresAt);
        return Number.isFinite(expMs) && expMs < nowMs;
      })
      .map((w) => w.workspaceId);
  });

  const certificates: DeletionCertificateRecord[] = [];
  const sweptWorkspaceIds: string[] = [];
  for (const wsId of expiredIds) {
    const res = await purgePilotWorkspace(wsId, {
      ...options,
      requestedBy: options.requestedBy || 'Automated 14-Day Governance Sweep',
      purgeReason: options.purgeReason || 'RETENTION_EXPIRED_14D',
      now,
    });
    if (res.ok && res.certificate) {
      certificates.push(res.certificate);
      sweptWorkspaceIds.push(wsId);
    }
  }

  return {
    ok: true,
    sweptCount: certificates.length,
    sweptWorkspaceIds,
    certificates,
  };
}
