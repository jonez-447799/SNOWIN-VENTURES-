/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs/promises';
import path from 'path';
import {
  type PlantId,
  type PlantBaselineDataset,
  type PlantDeterministicSummary,
  type PlantCapaItem,
  ALLOWED_PLANT_IDS,
  isValidPlantId,
  getPlantBaseline,
  computePlantBaselineMetrics,
} from '../data/multiPlantBaselines.ts';
import type { StockItem, RulesConfig as P1RulesConfig } from '../project1/types.ts';
import type { DispatchRow, RulesConfig as P2RulesConfig } from '../project2/types/otif.ts';
import type { Trip, RulesConfig as P3RulesConfig } from '../project3/types/freight.ts';
import type { AuditItem, AuditRules as P4RulesConfig } from '../project4/types/audit.ts';
import { normalizeCapaItem } from './capaLedger.ts';

export const DEFAULT_PLANT_WORKSPACES_FILE_PATH = path.resolve(
  process.cwd(),
  'data',
  'plant_workspaces.json'
);

export interface StoredPlantWorkspaceRecord {
  plantId: PlantId;
  isCustomized: boolean;
  lastSyncedAt: string;
  dataset: PlantBaselineDataset;
  summary: PlantDeterministicSummary;
}

export interface PlantWorkspaceSummaryItem {
  plantId: PlantId;
  plantName: string;
  division: string;
  clusterLocation: string;
  industry: string;
  isCustomized: boolean;
  lastSyncedAt: string;
  summary: PlantDeterministicSummary;
}

export interface PlantWorkspaceUpdatePayload {
  p1Items?: StockItem[];
  p1Rules?: P1RulesConfig;
  p2Dispatches?: DispatchRow[];
  p2Rules?: P2RulesConfig;
  p3Trips?: Trip[];
  p3Rules?: P3RulesConfig;
  p4Bins?: AuditItem[];
  p4Rules?: P4RulesConfig;
  capaItems?: PlantCapaItem[];
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

async function ensureStorageFile(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '{}\n', 'utf8');
  }
}

async function readStoreMapUnsafe(
  filePath: string
): Promise<Partial<Record<PlantId, StoredPlantWorkspaceRecord>>> {
  await ensureStorageFile(filePath);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    if (!raw.trim()) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStoreMapUnsafe(
  filePath: string,
  storeMap: Partial<Record<PlantId, StoredPlantWorkspaceRecord>>
): Promise<void> {
  await ensureStorageFile(filePath);
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
  await fs.writeFile(tempPath, JSON.stringify(storeMap, null, 2) + '\n', 'utf8');
  await fs.rename(tempPath, filePath);
}

function buildDefaultStoredRecord(
  plantId: PlantId,
  nowIso: string = '2026-10-01T08:00:00.000Z'
): StoredPlantWorkspaceRecord {
  const dataset = getPlantBaseline(plantId);
  const summary = computePlantBaselineMetrics(dataset);
  return {
    plantId,
    isCustomized: false,
    lastSyncedAt: nowIso,
    dataset,
    summary,
  };
}

/**
 * Validates incoming PUT /api/plant-workspaces/:plantId payload.
 */
export function validatePlantWorkspaceUpdatePayload(raw: unknown): {
  ok: boolean;
  data?: PlantWorkspaceUpdatePayload;
  error?: string;
} {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      ok: false,
      error: 'Workspace update payload must be a JSON object.',
    };
  }

  const body = raw as Record<string, unknown>;
  const patch: PlantWorkspaceUpdatePayload = {};

  if (body.p1Items !== undefined) {
    if (!Array.isArray(body.p1Items) || body.p1Items.length === 0 || body.p1Items.length > 5000) {
      return { ok: false, error: 'p1Items must be a non-empty array (max 5,000 SKUs).' };
    }
    patch.p1Items = body.p1Items as StockItem[];
  }

  if (body.p1Rules !== undefined) {
    if (!body.p1Rules || typeof body.p1Rules !== 'object' || Array.isArray(body.p1Rules)) {
      return { ok: false, error: 'p1Rules must be a valid rules configuration object.' };
    }
    patch.p1Rules = body.p1Rules as P1RulesConfig;
  }

  if (body.p2Dispatches !== undefined) {
    if (
      !Array.isArray(body.p2Dispatches) ||
      body.p2Dispatches.length === 0 ||
      body.p2Dispatches.length > 5000
    ) {
      return { ok: false, error: 'p2Dispatches must be a non-empty array.' };
    }
    patch.p2Dispatches = body.p2Dispatches as DispatchRow[];
  }

  if (body.p2Rules !== undefined) {
    if (!body.p2Rules || typeof body.p2Rules !== 'object' || Array.isArray(body.p2Rules)) {
      return { ok: false, error: 'p2Rules must be a valid rules configuration object.' };
    }
    patch.p2Rules = body.p2Rules as P2RulesConfig;
  }

  if (body.p3Trips !== undefined) {
    if (!Array.isArray(body.p3Trips) || body.p3Trips.length === 0 || body.p3Trips.length > 5000) {
      return { ok: false, error: 'p3Trips must be a non-empty array.' };
    }
    patch.p3Trips = body.p3Trips as Trip[];
  }

  if (body.p3Rules !== undefined) {
    if (!body.p3Rules || typeof body.p3Rules !== 'object' || Array.isArray(body.p3Rules)) {
      return { ok: false, error: 'p3Rules must be a valid rules configuration object.' };
    }
    patch.p3Rules = body.p3Rules as P3RulesConfig;
  }

  if (body.p4Bins !== undefined) {
    if (!Array.isArray(body.p4Bins) || body.p4Bins.length === 0 || body.p4Bins.length > 5000) {
      return { ok: false, error: 'p4Bins must be a non-empty array.' };
    }
    patch.p4Bins = body.p4Bins as AuditItem[];
  }

  if (body.p4Rules !== undefined) {
    if (!body.p4Rules || typeof body.p4Rules !== 'object' || Array.isArray(body.p4Rules)) {
      return { ok: false, error: 'p4Rules must be a valid rules configuration object.' };
    }
    patch.p4Rules = body.p4Rules as P4RulesConfig;
  }

  if (body.capaItems !== undefined) {
    if (!Array.isArray(body.capaItems) || body.capaItems.length > 1000) {
      return { ok: false, error: 'capaItems must be an array (max 1,000 items).' };
    }
    patch.capaItems = body.capaItems as PlantCapaItem[];
  }

  if (Object.keys(patch).length === 0) {
    return {
      ok: false,
      error:
        'Provide at least one plant domain field (p1Items, p1Rules, p2Dispatches, p2Rules, p3Trips, p3Rules, p4Bins, p4Rules, or capaItems).',
    };
  }

  return { ok: true, data: patch };
}

/**
 * Returns summaries of all 3 plants (ambattur, sriperumbudur, hosur) with deterministic KPIs.
 */
export async function listAllPlantWorkspacesSummary(
  filePath: string = DEFAULT_PLANT_WORKSPACES_FILE_PATH
): Promise<PlantWorkspaceSummaryItem[]> {
  return withSerializedLock(filePath, async () => {
    const storeMap = await readStoreMapUnsafe(filePath);
    return ALLOWED_PLANT_IDS.map((plantId) => {
      const stored = storeMap[plantId];
      if (stored && stored.dataset) {
        const freshSummary = computePlantBaselineMetrics(stored.dataset);
        return {
          plantId,
          plantName: stored.dataset.plantName,
          division: stored.dataset.division,
          clusterLocation: stored.dataset.clusterLocation,
          industry: stored.dataset.industry,
          isCustomized: Boolean(stored.isCustomized),
          lastSyncedAt: stored.lastSyncedAt || new Date().toISOString(),
          summary: freshSummary,
        };
      }
      const def = buildDefaultStoredRecord(plantId);
      return {
        plantId,
        plantName: def.dataset.plantName,
        division: def.dataset.division,
        clusterLocation: def.dataset.clusterLocation,
        industry: def.dataset.industry,
        isCustomized: false,
        lastSyncedAt: def.lastSyncedAt,
        summary: def.summary,
      };
    });
  });
}

/**
 * Returns the full workspace state for a specific plantId (initializes from multiPlantBaselines.ts if not customized).
 */
export async function getPlantWorkspaceFromServer(
  plantId: PlantId,
  filePath: string = DEFAULT_PLANT_WORKSPACES_FILE_PATH
): Promise<StoredPlantWorkspaceRecord> {
  if (!isValidPlantId(plantId)) {
    throw new Error(`Invalid plantId: ${String(plantId)}`);
  }

  return withSerializedLock(filePath, async () => {
    const storeMap = await readStoreMapUnsafe(filePath);
    const stored = storeMap[plantId];
    if (stored && stored.dataset) {
      const normalizedCapas = (stored.dataset.capaItems || []).map((c) =>
        normalizeCapaItem(c as unknown as Record<string, unknown>)
      );
      const normalizedDataset: PlantBaselineDataset = {
        ...stored.dataset,
        capaItems: normalizedCapas,
      };
      const summary = computePlantBaselineMetrics(normalizedDataset);
      return {
        ...stored,
        dataset: normalizedDataset,
        summary,
      };
    }
    return buildDefaultStoredRecord(plantId);
  });
}

/**
 * Validates and saves updated plant workspace data for a specific plantId in isolation.
 */
export async function updatePlantWorkspaceOnServer(
  plantId: PlantId,
  patch: PlantWorkspaceUpdatePayload,
  filePath: string = DEFAULT_PLANT_WORKSPACES_FILE_PATH
): Promise<StoredPlantWorkspaceRecord> {
  if (!isValidPlantId(plantId)) {
    throw new Error(`Invalid plantId: ${String(plantId)}`);
  }

  return withSerializedLock(filePath, async () => {
    const storeMap = await readStoreMapUnsafe(filePath);
    const existing = storeMap[plantId] || buildDefaultStoredRecord(plantId);
    const mergedCapas = (
      patch.capaItems !== undefined ? patch.capaItems : existing.dataset.capaItems || []
    ).map((c) => normalizeCapaItem(c as unknown as Record<string, unknown>));
    const mergedDataset: PlantBaselineDataset = {
      ...existing.dataset,
      plantId,
      ...(patch.p1Items !== undefined ? { p1Items: patch.p1Items } : {}),
      ...(patch.p1Rules !== undefined ? { p1Rules: patch.p1Rules } : {}),
      ...(patch.p2Dispatches !== undefined ? { p2Dispatches: patch.p2Dispatches } : {}),
      ...(patch.p2Rules !== undefined ? { p2Rules: patch.p2Rules } : {}),
      ...(patch.p3Trips !== undefined ? { p3Trips: patch.p3Trips } : {}),
      ...(patch.p3Rules !== undefined ? { p3Rules: patch.p3Rules } : {}),
      ...(patch.p4Bins !== undefined ? { p4Bins: patch.p4Bins } : {}),
      ...(patch.p4Rules !== undefined ? { p4Rules: patch.p4Rules } : {}),
      capaItems: mergedCapas,
    };

    const summary = computePlantBaselineMetrics(mergedDataset);
    const updatedRecord: StoredPlantWorkspaceRecord = {
      plantId,
      isCustomized: true,
      lastSyncedAt: new Date().toISOString(),
      dataset: mergedDataset,
      summary,
    };

    storeMap[plantId] = updatedRecord;
    await writeStoreMapUnsafe(filePath, storeMap);
    return updatedRecord;
  });
}

/**
 * Resets a specific plantId on the server back to its factory baseline from multiPlantBaselines.ts.
 */
export async function resetPlantWorkspaceOnServer(
  plantId: PlantId,
  filePath: string = DEFAULT_PLANT_WORKSPACES_FILE_PATH
): Promise<StoredPlantWorkspaceRecord> {
  if (!isValidPlantId(plantId)) {
    throw new Error(`Invalid plantId: ${String(plantId)}`);
  }

  return withSerializedLock(filePath, async () => {
    const storeMap = await readStoreMapUnsafe(filePath);
    const resetRecord = buildDefaultStoredRecord(plantId, new Date().toISOString());
    delete storeMap[plantId];
    await writeStoreMapUnsafe(filePath, storeMap);
    return resetRecord;
  });
}
