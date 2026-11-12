/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import type { PlantId } from '../data/multiPlantBaselines.ts';
import { isValidPlantId } from '../data/multiPlantBaselines.ts';

export const DEFAULT_AUDIT_EVENTS_FILE_PATH = path.resolve(
  process.cwd(),
  'data',
  'audit_events.json'
);

export const MAX_SERVER_AUDIT_EVENTS = 500;

export type ServerAuditCategory =
  | 'LEAD_FUNNEL'
  | 'PLANT_WORKSPACE'
  | 'PILOT_WALKTHROUGH'
  | 'GOVERNANCE';

export const ALLOWED_AUDIT_CATEGORIES: ServerAuditCategory[] = [
  'LEAD_FUNNEL',
  'PLANT_WORKSPACE',
  'PILOT_WALKTHROUGH',
  'GOVERNANCE',
];

export interface ServerAuditEventRecord {
  eventId: string;
  timestamp: string;
  actor: string;
  category: ServerAuditCategory;
  action: string;
  plantId?: PlantId;
  details: string;
}

export interface CreateServerAuditEventInput {
  actor?: string;
  category: ServerAuditCategory;
  action: string;
  plantId?: PlantId | string;
  details: string;
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

function sanitizeText(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
}

export function generateAuditEventId(now: Date = new Date()): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `EVT-${yyyy}${mm}${dd}-${suffix}`;
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

async function readEventsUnsafe(filePath: string): Promise<ServerAuditEventRecord[]> {
  await ensureStorageFile(filePath);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ServerAuditEventRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeEventsUnsafe(
  filePath: string,
  events: ServerAuditEventRecord[]
): Promise<void> {
  await ensureStorageFile(filePath);
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
  await fs.writeFile(tempPath, JSON.stringify(events, null, 2) + '\n', 'utf8');
  await fs.rename(tempPath, filePath);
}

/**
 * Validates a client-submitted audit event payload (POST /api/audit-events).
 */
export function validateServerAuditEventPayload(raw: unknown): {
  ok: boolean;
  data?: CreateServerAuditEventInput;
  error?: string;
} {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Audit event payload must be a JSON object.' };
  }
  const body = raw as Record<string, unknown>;
  const categoryRaw = sanitizeText(body.category, 40) as ServerAuditCategory;
  const category: ServerAuditCategory = ALLOWED_AUDIT_CATEGORIES.includes(categoryRaw)
    ? categoryRaw
    : 'GOVERNANCE';

  const action = sanitizeText(body.action, 120);
  if (!action) {
    return { ok: false, error: 'Action identifier is required.' };
  }

  const details = sanitizeText(body.details, 600);
  if (!details) {
    return { ok: false, error: 'Event details are required.' };
  }

  const actor = sanitizeText(body.actor, 120) || 'Operations Reviewer';
  const plantIdRaw = sanitizeText(body.plantId, 40);
  const plantId = isValidPlantId(plantIdRaw) ? plantIdRaw : undefined;

  return {
    ok: true,
    data: {
      actor,
      category,
      action,
      ...(plantId ? { plantId } : {}),
      details,
    },
  };
}

/**
 * Appends a structured governance audit event to ./data/audit_events.json,
 * keeping at most MAX_SERVER_AUDIT_EVENTS (500) newest records.
 */
export async function recordServerAuditEvent(
  input: CreateServerAuditEventInput,
  filePath: string = DEFAULT_AUDIT_EVENTS_FILE_PATH,
  maxRecords: number = MAX_SERVER_AUDIT_EVENTS
): Promise<ServerAuditEventRecord> {
  return withSerializedLock(filePath, async () => {
    const existing = await readEventsUnsafe(filePath);
    const now = new Date();
    let eventId = generateAuditEventId(now);
    while (existing.some((e) => e.eventId === eventId)) {
      eventId = generateAuditEventId(now);
    }

    const plantIdClean =
      input.plantId && isValidPlantId(input.plantId) ? input.plantId : undefined;

    const record: ServerAuditEventRecord = {
      eventId,
      timestamp: now.toISOString(),
      actor: sanitizeText(input.actor, 120) || 'System / C. Jones Snowin',
      category: ALLOWED_AUDIT_CATEGORIES.includes(input.category)
        ? input.category
        : 'GOVERNANCE',
      action: sanitizeText(input.action, 120) || 'SYSTEM_EVENT',
      ...(plantIdClean ? { plantId: plantIdClean } : {}),
      details: sanitizeText(input.details, 600),
    };

    const updated = [record, ...existing].slice(0, Math.max(1, maxRecords));
    await writeEventsUnsafe(filePath, updated);
    return record;
  });
}

/**
 * Lists all server governance audit events sorted newest-first.
 */
export async function listServerAuditEvents(
  filePathOrOptions:
    | string
    | { plantId?: string; limit?: number; filePath?: string } = DEFAULT_AUDIT_EVENTS_FILE_PATH
): Promise<ServerAuditEventRecord[]> {
  const filePath =
    typeof filePathOrOptions === 'string'
      ? filePathOrOptions
      : filePathOrOptions?.filePath || DEFAULT_AUDIT_EVENTS_FILE_PATH;
  const plantIdFilter =
    typeof filePathOrOptions === 'object' && filePathOrOptions?.plantId
      ? filePathOrOptions.plantId.trim()
      : undefined;
  const limit =
    typeof filePathOrOptions === 'object' &&
    typeof filePathOrOptions?.limit === 'number' &&
    Number.isFinite(filePathOrOptions.limit) &&
    filePathOrOptions.limit > 0
      ? Math.min(MAX_SERVER_AUDIT_EVENTS, Math.floor(filePathOrOptions.limit))
      : MAX_SERVER_AUDIT_EVENTS;

  return withSerializedLock(filePath, async () => {
    const events = await readEventsUnsafe(filePath);
    const sorted = [...events].sort((a, b) => {
      const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (diff !== 0) return diff;
      return b.eventId.localeCompare(a.eventId);
    });
    const filtered =
      plantIdFilter && plantIdFilter !== 'all'
        ? sorted.filter((e) => e.plantId === plantIdFilter)
        : sorted;
    return filtered.slice(0, limit);
  });
}
