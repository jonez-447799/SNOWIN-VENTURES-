/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import type {
  PilotRequestRecord,
  PilotLeadStatus,
  ValidatedPilotRequestInput,
  LinkedPlantId,
  LeadDataQualityOverview,
} from './leadValidation.ts';
import { syncRecordToCloud } from './cloudPersistenceStore.ts';

export const DEFAULT_LEADS_FILE_PATH = path.resolve(process.cwd(), 'data', 'pilot_requests.json');

// Serialized mutex queue per file path so concurrent requests never corrupt JSON storage
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

/**
 * Generates a unique cryptographic lead reference ID in format PILOT-YYYYMMDD-XXXX
 */
export function generateLeadId(now: Date = new Date()): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `PILOT-${yyyy}${mm}${dd}-${randomSuffix}`;
}

/**
 * Generates a cryptographic Step-2 upload token (upl_<20 hex chars>)
 */
export function generateUploadToken(): string {
  return `upl_${crypto.randomBytes(10).toString('hex')}`;
}

export function buildUploadPortalUrl(leadId: string, uploadToken: string): string {
  return `?view=pilot-upload&leadId=${encodeURIComponent(leadId)}&token=${encodeURIComponent(
    uploadToken
  )}`;
}

async function ensureStorageFile(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '[]\n', 'utf8');
  }
}

async function writeAllRecordsUnsafe(
  filePath: string,
  records: PilotRequestRecord[]
): Promise<void> {
  await ensureStorageFile(filePath);
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
  await fs.writeFile(tempPath, JSON.stringify(records, null, 2) + '\n', 'utf8');
  await fs.rename(tempPath, filePath);
}

/**
 * Reads all records from disk and auto-backfills uploadToken and uploadPortalUrl on any legacy records.
 */
async function readAllRecordsUnsafe(filePath: string): Promise<PilotRequestRecord[]> {
  await ensureStorageFile(filePath);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    let mutated = false;
    const records = (parsed as PilotRequestRecord[]).map((rec) => {
      if (!rec.uploadToken || !rec.uploadPortalUrl) {
        mutated = true;
        const uploadToken = rec.uploadToken || generateUploadToken();
        const uploadPortalUrl = buildUploadPortalUrl(rec.leadId, uploadToken);
        return {
          ...rec,
          uploadToken,
          uploadPortalUrl,
        };
      }
      return rec;
    });
    if (mutated) {
      await writeAllRecordsUnsafe(filePath, records);
    }
    return records;
  } catch {
    return [];
  }
}

/**
 * Creates and persists a new PilotRequestRecord to disk using serialized write locking,
 * and triggers a non-blocking Supabase PostgREST sync when configured.
 */
export async function createLeadRecord(
  input: ValidatedPilotRequestInput,
  filePath: string = DEFAULT_LEADS_FILE_PATH
): Promise<PilotRequestRecord> {
  return withSerializedLock(filePath, async () => {
    const existing = await readAllRecordsUnsafe(filePath);
    const now = new Date();
    const isoNow = now.toISOString();

    let leadId = generateLeadId(now);
    while (existing.some((r) => r.leadId === leadId)) {
      leadId = generateLeadId(now);
    }

    const uploadToken = generateUploadToken();
    const uploadPortalUrl = buildUploadPortalUrl(leadId, uploadToken);

    const record: PilotRequestRecord = {
      leadId,
      createdAt: isoNow,
      updatedAt: isoNow,
      status: 'NEW',
      founderNotes: '',
      uploadToken,
      uploadPortalUrl,
      ...input,
    };

    existing.push(record);
    await writeAllRecordsUnsafe(filePath, existing);
    void syncRecordToCloud('pilot_leads', record.leadId, record).catch(() => {});
    return record;
  });
}

/**
 * Lists all stored PilotRequestRecords sorted newest first.
 */
export async function listLeadRecords(
  filePath: string = DEFAULT_LEADS_FILE_PATH
): Promise<PilotRequestRecord[]> {
  return withSerializedLock(filePath, async () => {
    const records = await readAllRecordsUnsafe(filePath);
    return [...records].sort((a, b) => {
      const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (timeDiff !== 0) return timeDiff;
      return b.leadId.localeCompare(a.leadId);
    });
  });
}

/**
 * Retrieves a single PilotRequestRecord by leadId.
 */
export async function getLeadRecordById(
  leadId: string,
  filePath: string = DEFAULT_LEADS_FILE_PATH
): Promise<PilotRequestRecord | null> {
  return withSerializedLock(filePath, async () => {
    const records = await readAllRecordsUnsafe(filePath);
    return records.find((r) => r.leadId === leadId) || null;
  });
}

/**
 * Updates status, founderNotes, linked walkthrough snapshot details, and/or Step-2 import run metadata on an existing lead record by leadId.
 */
export async function updateLeadRecord(
  leadId: string,
  patch: {
    status?: PilotLeadStatus;
    founderNotes?: string;
    linkedWorkspaceId?: string;
    linkedWalkthroughUrl?: string;
    linkedPlantId?: LinkedPlantId;
    lastImportRunId?: string;
    lastImportAt?: string;
    dataQualityOverview?: LeadDataQualityOverview;
    uploadToken?: string;
    uploadPortalUrl?: string;
    deletionCertificateId?: string;
    purgedAt?: string;
  },
  filePath: string = DEFAULT_LEADS_FILE_PATH
): Promise<PilotRequestRecord | null> {
  return withSerializedLock(filePath, async () => {
    const records = await readAllRecordsUnsafe(filePath);
    const idx = records.findIndex((r) => r.leadId === leadId);
    if (idx === -1) return null;

    const updated: PilotRequestRecord = {
      ...records[idx],
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.founderNotes !== undefined ? { founderNotes: patch.founderNotes } : {}),
      ...(patch.linkedWorkspaceId !== undefined ? { linkedWorkspaceId: patch.linkedWorkspaceId } : {}),
      ...(patch.linkedWalkthroughUrl !== undefined
        ? { linkedWalkthroughUrl: patch.linkedWalkthroughUrl }
        : {}),
      ...(patch.linkedPlantId !== undefined ? { linkedPlantId: patch.linkedPlantId } : {}),
      ...(patch.lastImportRunId !== undefined ? { lastImportRunId: patch.lastImportRunId } : {}),
      ...(patch.lastImportAt !== undefined ? { lastImportAt: patch.lastImportAt } : {}),
      ...(patch.dataQualityOverview !== undefined
        ? { dataQualityOverview: patch.dataQualityOverview }
        : {}),
      ...(patch.uploadToken !== undefined ? { uploadToken: patch.uploadToken } : {}),
      ...(patch.uploadPortalUrl !== undefined ? { uploadPortalUrl: patch.uploadPortalUrl } : {}),
      ...(patch.deletionCertificateId !== undefined
        ? { deletionCertificateId: patch.deletionCertificateId }
        : {}),
      ...(patch.purgedAt !== undefined ? { purgedAt: patch.purgedAt } : {}),
      updatedAt: new Date().toISOString(),
    };

    records[idx] = updated;
    await writeAllRecordsUnsafe(filePath, records);
    void syncRecordToCloud('pilot_leads', updated.leadId, updated).catch(() => {});
    return updated;
  });
}
