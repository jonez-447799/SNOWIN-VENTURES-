/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cloud Run 7-Store System Backup & Dry-Run Restore Engine (Phase 8).
 * Exports and restores all 7 server JSON stores with canonical SHA-256 integrity verification:
 * 1. pilotRequests (./data/pilot_requests.json)
 * 2. pilotWorkspaces (./data/pilot_workspaces.json)
 * 3. plantWorkspaces (./data/plant_workspaces.json)
 * 4. importRuns (./data/import_runs.json)
 * 5. verifiedProofs (./data/verified_proof_registry.json)
 * 6. auditEvents (./data/audit_events.json)
 * 7. deletionCertificates (./data/deletion_certificates.json)
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { DEFAULT_LEADS_FILE_PATH } from './leadStore.ts';
import { DEFAULT_WORKSPACES_FILE_PATH } from './pilotWorkspaceStore.ts';
import { DEFAULT_PLANT_WORKSPACES_FILE_PATH, type StoredPlantWorkspaceRecord } from './plantWorkspaceServerStore.ts';
import { DEFAULT_IMPORT_RUNS_FILE_PATH } from './importRunStore.ts';
import { DEFAULT_VERIFIED_PROOFS_FILE_PATH } from './verifiedProofRegistryStore.ts';
import { DEFAULT_AUDIT_EVENTS_FILE_PATH, recordServerAuditEvent } from './serverAuditLog.ts';
import { DEFAULT_DELETION_CERTIFICATES_FILE_PATH } from './dataPurgeEngine.ts';
import { isValidPlantId, type PlantId } from '../data/multiPlantBaselines.ts';

export interface SystemBackupStorePaths {
  pilotRequestsFilePath?: string;
  pilotWorkspacesFilePath?: string;
  plantWorkspacesFilePath?: string;
  importRunsFilePath?: string;
  verifiedProofsFilePath?: string;
  auditEventsFilePath?: string;
  deletionCertificatesFilePath?: string;
  pilotRequests?: string;
  pilotWorkspaces?: string;
  plantWorkspaces?: string;
  importRuns?: string;
  verifiedProofs?: string;
  auditEvents?: string;
  deletionCertificates?: string;
}

export interface SystemBackupStoresPayload {
  pilotRequests: unknown[];
  pilotWorkspaces: unknown[];
  plantWorkspaces: unknown[];
  importRuns: unknown[];
  verifiedProofs: unknown[];
  auditEvents: unknown[];
  deletionCertificates: unknown[];
}

export interface SystemBackupStoreCounts {
  pilotRequests: number;
  pilotWorkspaces: number;
  plantWorkspaces: number;
  importRuns: number;
  verifiedProofs: number;
  auditEvents: number;
  deletionCertificates: number;
}

export interface SystemBackupBundle {
  schemaVersion: '1.0';
  bundleVersion: '1.0';
  exportedAt: string;
  exportedBy: string;
  storeCounts: SystemBackupStoreCounts;
  bundleIntegrityHash: string;
  stores: SystemBackupStoresPayload;
}

export interface RestoreSystemBackupResult {
  ok: boolean;
  dryRun: boolean;
  integrityVerified: boolean;
  storeCounts: SystemBackupStoreCounts;
  restoredAt?: string;
  error?: string;
}

const REQUIRED_STORE_KEYS: Array<keyof SystemBackupStoresPayload> = [
  'pilotRequests',
  'pilotWorkspaces',
  'plantWorkspaces',
  'importRuns',
  'verifiedProofs',
  'auditEvents',
  'deletionCertificates',
];

const ZERO_COUNTS: SystemBackupStoreCounts = {
  pilotRequests: 0,
  pilotWorkspaces: 0,
  plantWorkspaces: 0,
  importRuns: 0,
  verifiedProofs: 0,
  auditEvents: 0,
  deletionCertificates: 0,
};

async function readArrayStoreSafe(filePath: string): Promise<unknown[]> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function readPlantWorkspacesArraySafe(filePath: string): Promise<unknown[]> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') {
      return Object.values(parsed).filter((item) => item && typeof item === 'object');
    }
    return [];
  } catch {
    return [];
  }
}

async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await fs.rename(tempPath, filePath);
}

/**
 * Computes the canonical SHA-256 bundleIntegrityHash across the 7 stores in fixed key order.
 */
export function computeSystemBackupIntegrityHash(stores: SystemBackupStoresPayload): string {
  const orderedPayload: SystemBackupStoresPayload = {
    pilotRequests: Array.isArray(stores.pilotRequests) ? stores.pilotRequests : [],
    pilotWorkspaces: Array.isArray(stores.pilotWorkspaces) ? stores.pilotWorkspaces : [],
    plantWorkspaces: Array.isArray(stores.plantWorkspaces) ? stores.plantWorkspaces : [],
    importRuns: Array.isArray(stores.importRuns) ? stores.importRuns : [],
    verifiedProofs: Array.isArray(stores.verifiedProofs) ? stores.verifiedProofs : [],
    auditEvents: Array.isArray(stores.auditEvents) ? stores.auditEvents : [],
    deletionCertificates: Array.isArray(stores.deletionCertificates)
      ? stores.deletionCertificates
      : [],
  };
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(orderedPayload), 'utf8')
    .digest('hex');
}

/**
 * Collects all records from all 7 server stores and returns a signed SystemBackupBundle.
 */
export async function exportSystemBackupBundle(
  paths: SystemBackupStorePaths = {},
  exportedBy: string = 'C. Jones Snowin'
): Promise<SystemBackupBundle> {
  const pilotRequestsPath =
    paths.pilotRequestsFilePath || paths.pilotRequests || DEFAULT_LEADS_FILE_PATH;
  const pilotWorkspacesPath =
    paths.pilotWorkspacesFilePath || paths.pilotWorkspaces || DEFAULT_WORKSPACES_FILE_PATH;
  const plantWorkspacesPath =
    paths.plantWorkspacesFilePath ||
    paths.plantWorkspaces ||
    DEFAULT_PLANT_WORKSPACES_FILE_PATH;
  const importRunsPath =
    paths.importRunsFilePath || paths.importRuns || DEFAULT_IMPORT_RUNS_FILE_PATH;
  const verifiedProofsPath =
    paths.verifiedProofsFilePath ||
    paths.verifiedProofs ||
    DEFAULT_VERIFIED_PROOFS_FILE_PATH;
  const auditEventsPath =
    paths.auditEventsFilePath || paths.auditEvents || DEFAULT_AUDIT_EVENTS_FILE_PATH;
  const deletionCertificatesPath =
    paths.deletionCertificatesFilePath ||
    paths.deletionCertificates ||
    DEFAULT_DELETION_CERTIFICATES_FILE_PATH;

  const [
    pilotRequests,
    pilotWorkspaces,
    plantWorkspaces,
    importRuns,
    verifiedProofs,
    auditEvents,
    deletionCertificates,
  ] = await Promise.all([
    readArrayStoreSafe(pilotRequestsPath),
    readArrayStoreSafe(pilotWorkspacesPath),
    readPlantWorkspacesArraySafe(plantWorkspacesPath),
    readArrayStoreSafe(importRunsPath),
    readArrayStoreSafe(verifiedProofsPath),
    readArrayStoreSafe(auditEventsPath),
    readArrayStoreSafe(deletionCertificatesPath),
  ]);

  const stores: SystemBackupStoresPayload = {
    pilotRequests,
    pilotWorkspaces,
    plantWorkspaces,
    importRuns,
    verifiedProofs,
    auditEvents,
    deletionCertificates,
  };

  const storeCounts: SystemBackupStoreCounts = {
    pilotRequests: pilotRequests.length,
    pilotWorkspaces: pilotWorkspaces.length,
    plantWorkspaces: plantWorkspaces.length,
    importRuns: importRuns.length,
    verifiedProofs: verifiedProofs.length,
    auditEvents: auditEvents.length,
    deletionCertificates: deletionCertificates.length,
  };

  const bundleIntegrityHash = computeSystemBackupIntegrityHash(stores);

  return {
    schemaVersion: '1.0',
    bundleVersion: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy: exportedBy || 'C. Jones Snowin',
    storeCounts,
    bundleIntegrityHash,
    stores,
  };
}

/**
 * Validates and restores a 7-Store SystemBackupBundle.
 */
export async function restoreSystemBackupBundle(
  rawBundle: unknown,
  options: {
    dryRun?: boolean;
    actor?: string;
    paths?: SystemBackupStorePaths;
    pathsOverride?: SystemBackupStorePaths;
  } = {}
): Promise<RestoreSystemBackupResult> {
  const dryRun = Boolean(options.dryRun);

  if (!rawBundle || typeof rawBundle !== 'object' || Array.isArray(rawBundle)) {
    return {
      ok: false,
      dryRun,
      integrityVerified: false,
      storeCounts: ZERO_COUNTS,
      error: 'Invalid backup bundle payload: root must be a JSON object.',
    };
  }

  const bundle = rawBundle as Record<string, unknown>;
  const version = bundle.schemaVersion ?? bundle.bundleVersion;
  if (version !== '1.0') {
    return {
      ok: false,
      dryRun,
      integrityVerified: false,
      storeCounts: ZERO_COUNTS,
      error: `Unsupported backup schemaVersion '${String(version)}'. Expected '1.0'.`,
    };
  }

  if (typeof bundle.bundleIntegrityHash !== 'string' || !bundle.bundleIntegrityHash.trim()) {
    return {
      ok: false,
      dryRun,
      integrityVerified: false,
      storeCounts: ZERO_COUNTS,
      error: 'Missing bundleIntegrityHash in backup bundle.',
    };
  }

  if (!bundle.stores || typeof bundle.stores !== 'object' || Array.isArray(bundle.stores)) {
    return {
      ok: false,
      dryRun,
      integrityVerified: false,
      storeCounts: ZERO_COUNTS,
      error: 'Missing or invalid stores object in backup bundle.',
    };
  }

  const rawStores = bundle.stores as Record<string, unknown>;
  for (const key of REQUIRED_STORE_KEYS) {
    if (!Array.isArray(rawStores[key])) {
      return {
        ok: false,
        dryRun,
        integrityVerified: false,
        storeCounts: ZERO_COUNTS,
        error: `Invalid store format: stores.${key} must be an array.`,
      };
    }
  }

  const validatedStores: SystemBackupStoresPayload = {
    pilotRequests: rawStores.pilotRequests as unknown[],
    pilotWorkspaces: rawStores.pilotWorkspaces as unknown[],
    plantWorkspaces: rawStores.plantWorkspaces as unknown[],
    importRuns: rawStores.importRuns as unknown[],
    verifiedProofs: rawStores.verifiedProofs as unknown[],
    auditEvents: rawStores.auditEvents as unknown[],
    deletionCertificates: rawStores.deletionCertificates as unknown[],
  };

  const recomputedHash = computeSystemBackupIntegrityHash(validatedStores);
  const providedHash = bundle.bundleIntegrityHash.trim().toLowerCase();

  if (recomputedHash.toLowerCase() !== providedHash) {
    return {
      ok: false,
      dryRun,
      integrityVerified: false,
      storeCounts: ZERO_COUNTS,
      error:
        'Bundle integrity check failed: bundleIntegrityHash does not match the SHA-256 digest of the 7 stores payload (bundle may be tampered or corrupted).',
    };
  }

  const storeCounts: SystemBackupStoreCounts = {
    pilotRequests: validatedStores.pilotRequests.length,
    pilotWorkspaces: validatedStores.pilotWorkspaces.length,
    plantWorkspaces: validatedStores.plantWorkspaces.length,
    importRuns: validatedStores.importRuns.length,
    verifiedProofs: validatedStores.verifiedProofs.length,
    auditEvents: validatedStores.auditEvents.length,
    deletionCertificates: validatedStores.deletionCertificates.length,
  };

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      integrityVerified: true,
      storeCounts,
    };
  }

  const paths = options.paths || options.pathsOverride || {};
  const pilotRequestsPath =
    paths.pilotRequestsFilePath || paths.pilotRequests || DEFAULT_LEADS_FILE_PATH;
  const pilotWorkspacesPath =
    paths.pilotWorkspacesFilePath || paths.pilotWorkspaces || DEFAULT_WORKSPACES_FILE_PATH;
  const plantWorkspacesPath =
    paths.plantWorkspacesFilePath ||
    paths.plantWorkspaces ||
    DEFAULT_PLANT_WORKSPACES_FILE_PATH;
  const importRunsPath =
    paths.importRunsFilePath || paths.importRuns || DEFAULT_IMPORT_RUNS_FILE_PATH;
  const verifiedProofsPath =
    paths.verifiedProofsFilePath ||
    paths.verifiedProofs ||
    DEFAULT_VERIFIED_PROOFS_FILE_PATH;
  const auditEventsPath =
    paths.auditEventsFilePath || paths.auditEvents || DEFAULT_AUDIT_EVENTS_FILE_PATH;
  const deletionCertificatesPath =
    paths.deletionCertificatesFilePath ||
    paths.deletionCertificates ||
    DEFAULT_DELETION_CERTIFICATES_FILE_PATH;

  // Convert plantWorkspaces array back to the keyed map format expected by plantWorkspaceServerStore.ts
  const plantStoreMap: Partial<Record<PlantId, StoredPlantWorkspaceRecord>> = {};
  for (const item of validatedStores.plantWorkspaces) {
    if (item && typeof item === 'object') {
      const rec = item as StoredPlantWorkspaceRecord;
      if (rec.plantId && isValidPlantId(rec.plantId)) {
        plantStoreMap[rec.plantId] = rec;
      }
    }
  }

  await Promise.all([
    writeJsonAtomic(pilotRequestsPath, validatedStores.pilotRequests),
    writeJsonAtomic(pilotWorkspacesPath, validatedStores.pilotWorkspaces),
    writeJsonAtomic(plantWorkspacesPath, plantStoreMap),
    writeJsonAtomic(importRunsPath, validatedStores.importRuns),
    writeJsonAtomic(verifiedProofsPath, validatedStores.verifiedProofs),
    writeJsonAtomic(auditEventsPath, validatedStores.auditEvents),
    writeJsonAtomic(deletionCertificatesPath, validatedStores.deletionCertificates),
  ]);

  await recordServerAuditEvent(
    {
      actor: options.actor || 'C. Jones Snowin',
      category: 'GOVERNANCE',
      action: 'SYSTEM_BACKUP_RESTORED',
      details: `Restored 7-store system backup bundle (SHA-256: ${recomputedHash.slice(0, 16)}...): ${storeCounts.pilotRequests} leads, ${storeCounts.pilotWorkspaces} workspaces, ${storeCounts.plantWorkspaces} plants, ${storeCounts.importRuns} import runs, ${storeCounts.verifiedProofs} proofs, ${storeCounts.deletionCertificates} deletion certs.`,
    },
    auditEventsPath
  );

  return {
    ok: true,
    dryRun: false,
    integrityVerified: true,
    storeCounts,
    restoredAt: new Date().toISOString(),
  };
}
