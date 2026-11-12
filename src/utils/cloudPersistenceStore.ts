/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getFounderBillingConfig } from './founderBillingStore.ts';

export type CloudSyncCollection =
  | 'pilot_leads'
  | 'pilot_workspaces'
  | 'founder_billing'
  | 'agent_workforce'
  | 'import_runs'
  | 'verified_proofs'
  | 'deletion_certificates'
  | 'outbound_crm';

export interface CloudSyncResult {
  synced: boolean;
  status: 'SYNCED' | 'SKIPPED_NOT_CONFIGURED' | 'FAILED';
  collection: string;
  recordId: string;
  timestamp: string;
  error?: string;
}

export interface CloudLoadResult<T = unknown> {
  ok: boolean;
  status: 'LOADED' | 'SKIPPED_NOT_CONFIGURED' | 'FAILED';
  collection: string;
  records: T[];
  error?: string;
}

export const SUPABASE_TABLE_SQL_SNIPPET = `-- Copy & Run in Supabase SQL Editor (https://supabase.com/dashboard)
create table if not exists public.operationalyst_records (
  id text primary key,
  collection text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_operationalyst_records_collection
  on public.operationalyst_records (collection, updated_at desc);`;

const isBrowserEnv =
  typeof window !== 'undefined' && typeof window.document !== 'undefined';

function getEnvString(key: string): string {
  if (
    !isBrowserEnv &&
    typeof process !== 'undefined' &&
    process.env &&
    typeof process.env[key] === 'string'
  ) {
    return process.env[key]!.trim();
  }
  return '';
}

export async function resolveSupabaseCredentials(customConfig?: {
  supabaseUrl?: string;
  supabaseServiceKey?: string;
}): Promise<{ supabaseUrl: string; supabaseServiceKey: string; configured: boolean }> {
  let supabaseUrl = customConfig?.supabaseUrl?.trim() || getEnvString('SUPABASE_URL');
  let supabaseServiceKey =
    customConfig?.supabaseServiceKey?.trim() || getEnvString('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    try {
      const stored = await getFounderBillingConfig();
      if (!supabaseUrl && stored.supabaseUrl) {
        supabaseUrl = stored.supabaseUrl.trim();
      }
      if (!supabaseServiceKey && stored.supabaseServiceKey) {
        supabaseServiceKey = stored.supabaseServiceKey.trim();
      }
    } catch {
      // Ignore fallback read errors
    }
  }

  // Normalize trailing slash on URL
  supabaseUrl = supabaseUrl.replace(/\/+$/, '');
  const configured = Boolean(
    supabaseUrl &&
      supabaseServiceKey &&
      /^https?:\/\//i.test(supabaseUrl) &&
      !supabaseServiceKey.includes('••••')
  );

  return {
    supabaseUrl,
    supabaseServiceKey,
    configured,
  };
}

/**
 * Non-blocking upsert to Supabase PostgREST (`public.operationalyst_records`).
 * If Supabase is not configured or unreachable, returns `SKIPPED_NOT_CONFIGURED` / `FAILED`
 * without throwing so local `./data/*.json` stores remain 100% operational.
 */
export async function syncRecordToCloud(
  collection: CloudSyncCollection | string,
  recordId: string,
  payload: unknown,
  customConfig?: { supabaseUrl?: string; supabaseServiceKey?: string }
): Promise<CloudSyncResult> {
  const timestamp = new Date().toISOString();
  const cleanCollection = String(collection || 'general').trim();
  const cleanRecordId = String(recordId || 'default').trim();

  try {
    const creds = await resolveSupabaseCredentials(customConfig);
    if (!creds.configured || typeof fetch !== 'function') {
      return {
        synced: false,
        status: 'SKIPPED_NOT_CONFIGURED',
        collection: cleanCollection,
        recordId: cleanRecordId,
        timestamp,
      };
    }

    const compositeId = `${cleanCollection}:${cleanRecordId}`;
    const endpoint = `${creds.supabaseUrl}/rest/v1/operationalyst_records`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: creds.supabaseServiceKey,
        Authorization: `Bearer ${creds.supabaseServiceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        id: compositeId,
        collection: cleanCollection,
        payload,
        updated_at: timestamp,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => `HTTP ${response.status}`);
      return {
        synced: false,
        status: 'FAILED',
        collection: cleanCollection,
        recordId: cleanRecordId,
        timestamp,
        error: `Supabase PostgREST HTTP ${response.status}: ${errText.slice(0, 180)}`,
      };
    }

    return {
      synced: true,
      status: 'SYNCED',
      collection: cleanCollection,
      recordId: cleanRecordId,
      timestamp,
    };
  } catch (err) {
    return {
      synced: false,
      status: 'FAILED',
      collection: cleanCollection,
      recordId: cleanRecordId,
      timestamp,
      error: err instanceof Error ? err.message : 'Network error during Supabase sync',
    };
  }
}

/**
 * Loads all records for a given collection from Supabase PostgREST (`public.operationalyst_records`).
 * Gracefully returns `SKIPPED_NOT_CONFIGURED` with an empty array when Supabase is not configured.
 */
export async function loadCollectionFromCloud<T = unknown>(
  collection: CloudSyncCollection | string,
  customConfig?: { supabaseUrl?: string; supabaseServiceKey?: string }
): Promise<CloudLoadResult<T>> {
  const cleanCollection = String(collection || 'general').trim();

  try {
    const creds = await resolveSupabaseCredentials(customConfig);
    if (!creds.configured || typeof fetch !== 'function') {
      return {
        ok: true,
        status: 'SKIPPED_NOT_CONFIGURED',
        collection: cleanCollection,
        records: [],
      };
    }

    const endpoint = `${creds.supabaseUrl}/rest/v1/operationalyst_records?collection=eq.${encodeURIComponent(
      cleanCollection
    )}&select=id,collection,payload,updated_at&order=updated_at.desc`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: creds.supabaseServiceKey,
        Authorization: `Bearer ${creds.supabaseServiceKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => `HTTP ${response.status}`);
      return {
        ok: false,
        status: 'FAILED',
        collection: cleanCollection,
        records: [],
        error: `Supabase PostgREST HTTP ${response.status}: ${errText.slice(0, 180)}`,
      };
    }

    const rows = (await response.json().catch(() => [])) as Array<{
      id?: string;
      collection?: string;
      payload?: T;
      updated_at?: string;
    }>;

    const payloads = Array.isArray(rows)
      ? rows
          .filter((r) => r && r.payload !== undefined && r.payload !== null)
          .map((r) => r.payload as T)
      : [];

    return {
      ok: true,
      status: 'LOADED',
      collection: cleanCollection,
      records: payloads,
    };
  } catch (err) {
    return {
      ok: false,
      status: 'FAILED',
      collection: cleanCollection,
      records: [],
      error: err instanceof Error ? err.message : 'Network error loading from Supabase',
    };
  }
}
