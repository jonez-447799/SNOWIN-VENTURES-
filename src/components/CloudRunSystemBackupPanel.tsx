/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cloud Run Persistence & 7-Store System Backup / Dry-Run Restore Panel (Phase 8).
 * Browser-safe React component used in FounderLeadInbox.tsx and SecurityAndSystem.tsx.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import type {
  SystemBackupBundle,
  SystemBackupStoreCounts,
} from '../utils/systemBackupBundle';
import { FirebaseCloudSyncBar } from './FirebaseCloudSyncBar';

const SESSION_STORAGE_ADMIN_KEY = 'operationalyst_founder_admin_key_v1';
const DEFAULT_DEV_KEY = 'operationalyst-local-dev-key';

interface CloudRunSystemBackupPanelProps {
  adminKey?: string;
  onAfterRestore?: () => void;
}

export const CloudRunSystemBackupPanel: React.FC<CloudRunSystemBackupPanelProps> = ({
  adminKey,
  onAfterRestore,
}) => {
  const effectiveAdminKey =
    adminKey?.trim() ||
    (() => {
      try {
        return sessionStorage.getItem(SESSION_STORAGE_ADMIN_KEY) || DEFAULT_DEV_KEY;
      } catch {
        return DEFAULT_DEV_KEY;
      }
    })();

  const [storeCounts, setStoreCounts] = useState<SystemBackupStoreCounts>({
    pilotRequests: 0,
    pilotWorkspaces: 0,
    plantWorkspaces: 0,
    importRuns: 0,
    verifiedProofs: 0,
    auditEvents: 0,
    deletionCertificates: 0,
  });
  const [bundleIntegrityHash, setBundleIntegrityHash] = useState<string>('');
  const [lastExportedAt, setLastExportedAt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stagedBundleJson, setStagedBundleJson] = useState<string>('');
  const [stagedBundleName, setStagedBundleName] = useState<string>('');
  const [dryRunVerified, setDryRunVerified] = useState<{
    verified: boolean;
    counts?: SystemBackupStoreCounts;
  } | null>(null);

  const fetchLiveBackupSummary = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/system-backup', {
        method: 'GET',
        headers: {
          'x-admin-key': effectiveAdminKey,
        },
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.bundle) {
        const bundle = data.bundle as SystemBackupBundle;
        setStoreCounts(bundle.storeCounts);
        setBundleIntegrityHash(bundle.bundleIntegrityHash || '');
        setLastExportedAt(bundle.exportedAt || new Date().toISOString());
      }
    } catch {
      // Non-fatal in offline preview
    } finally {
      setLoading(false);
    }
  }, [effectiveAdminKey]);

  useEffect(() => {
    fetchLiveBackupSummary();
  }, [fetchLiveBackupSummary]);

  const handleDownloadSystemBackup = async () => {
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/system-backup', {
        method: 'GET',
        headers: {
          'x-admin-key': effectiveAdminKey,
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data.bundle) {
        setErrorMessage(data?.error || 'Failed to export 7-Store System Backup Bundle.');
        return;
      }

      const bundle = data.bundle as SystemBackupBundle;
      setStoreCounts(bundle.storeCounts);
      setBundleIntegrityHash(bundle.bundleIntegrityHash);
      setLastExportedAt(bundle.exportedAt);

      const serialized = JSON.stringify(bundle, null, 2);
      setStagedBundleJson(serialized);
      setStagedBundleName(
        `Operationalyst_7Store_Backup_${new Date().toISOString().slice(0, 10)}.json`
      );

      const blob = new Blob([serialized], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Operationalyst_7Store_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage(
        `Exported 7-Store System Backup Bundle (SHA-256: ${bundle.bundleIntegrityHash.slice(0, 16)}...) and staged in memory for verification.`
      );
    } catch {
      setErrorMessage('Network error while exporting 7-Store System Backup Bundle.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    setStatusMessage(null);
    setDryRunVerified(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = typeof ev.target?.result === 'string' ? ev.target.result : '';
      if (content) {
        setStagedBundleJson(content);
        setStagedBundleName(file.name);
        setStatusMessage(`Loaded backup bundle '${file.name}' (${content.length.toLocaleString()} bytes). Run Dry-Run Verification or Restore below.`);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async (dryRun: boolean) => {
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      let parsedPayload: unknown = null;
      if (stagedBundleJson.trim()) {
        try {
          parsedPayload = JSON.parse(stagedBundleJson);
        } catch {
          setErrorMessage('Staged backup file is not valid JSON.');
          setLoading(false);
          return;
        }
      } else {
        // Fetch live bundle so 1-click Dry-Run works immediately without requiring a file upload dialog
        const backupRes = await fetch('/api/admin/system-backup', {
          method: 'GET',
          headers: { 'x-admin-key': effectiveAdminKey },
        });
        const backupData = await backupRes.json().catch(() => null);
        if (!backupRes.ok || !backupData?.ok || !backupData.bundle) {
          setErrorMessage('Please select a backup .JSON file or export a snapshot first.');
          setLoading(false);
          return;
        }
        parsedPayload = backupData.bundle;
        setStagedBundleJson(JSON.stringify(backupData.bundle, null, 2));
        setStagedBundleName('Live_Server_7Store_Bundle.json');
      }

      const res = await fetch('/api/admin/system-restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': effectiveAdminKey,
        },
        body: JSON.stringify({
          dryRun,
          bundle: parsedPayload,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setDryRunVerified({ verified: false });
        setErrorMessage(
          data?.error ||
            `Backup ${dryRun ? 'dry-run verification' : 'restore'} failed (HTTP ${res.status}).`
        );
        return;
      }

      if (dryRun) {
        setDryRunVerified({
          verified: true,
          counts: data.storeCounts,
        });
        setStatusMessage(
          `Dry-Run Verification Passed (dryRun: true) — Schema v1.0 & SHA-256 bundleIntegrityHash verified across all 7 stores without modifying disk.`
        );
      } else {
        setDryRunVerified({
          verified: true,
          counts: data.storeCounts,
        });
        if (data.storeCounts) {
          setStoreCounts(data.storeCounts);
        }
        setStatusMessage(
          `Full 7-Store System Backup Restored to ./data/*.json and logged SYSTEM_BACKUP_RESTORED.`
        );
        if (onAfterRestore) {
          onAfterRestore();
        }
      }
    } catch {
      setErrorMessage('Network error while communicating with /api/admin/system-restore.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="cloud-run-7store-backup-panel"
      className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Cloud Run Persistence &amp; 7-Store Backup Bundle
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Zero data loss across Cloud Run container redeployments — exports and restores all 7 server JSON stores with canonical SHA-256 integrity verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FirebaseCloudSyncBar compact />
          <button
            type="button"
            onClick={fetchLiveBackupSummary}
            disabled={loading}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[11px] inline-flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Counts</span>
          </button>

          <button
            type="button"
            data-testid="btn-download-7store-backup"
            onClick={handleDownloadSystemBackup}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download 7-Store Backup (.JSON)</span>
          </button>
        </div>
      </div>

      {/* Live 7-Store Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 font-mono">
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400">1. Pilot Leads</div>
          <div className="text-base font-bold text-white tabular-nums mt-0.5">
            {storeCounts.pilotRequests}
          </div>
          <div className="text-[9px] text-slate-500">pilot_requests.json</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400">2. Snapshots</div>
          <div className="text-base font-bold text-amber-300 tabular-nums mt-0.5">
            {storeCounts.pilotWorkspaces}
          </div>
          <div className="text-[9px] text-slate-500">pilot_workspaces.json</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400">3. Plant States</div>
          <div className="text-base font-bold text-sky-300 tabular-nums mt-0.5">
            {storeCounts.plantWorkspaces}
          </div>
          <div className="text-[9px] text-slate-500">plant_workspaces.json</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400">4. Import Runs</div>
          <div className="text-base font-bold text-purple-300 tabular-nums mt-0.5">
            {storeCounts.importRuns}
          </div>
          <div className="text-[9px] text-slate-500">import_runs.json</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400">5. Verified Proofs</div>
          <div className="text-base font-bold text-emerald-300 tabular-nums mt-0.5">
            {storeCounts.verifiedProofs}
          </div>
          <div className="text-[9px] text-slate-500">verified_proof_registry.json</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400">6. Audit Events</div>
          <div className="text-base font-bold text-slate-200 tabular-nums mt-0.5">
            {storeCounts.auditEvents}
          </div>
          <div className="text-[9px] text-slate-500">audit_events.json</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400">7. Deletion Certs</div>
          <div className="text-base font-bold text-rose-300 tabular-nums mt-0.5">
            {storeCounts.deletionCertificates}
          </div>
          <div className="text-[9px] text-slate-500">deletion_certificates.json</div>
        </div>
      </div>

      {/* Integrity Digest & Restore Controls */}
      <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1 font-mono text-[11px]">
          <div className="text-slate-300">
            <span className="text-slate-500">Live 7-Store SHA-256 Digest: </span>
            <span className="text-emerald-400 font-bold break-all">
              {bundleIntegrityHash || 'Computing...'}
            </span>
          </div>
          <div className="text-[10px] text-slate-500">
            {stagedBundleName
              ? `Staged Bundle: ${stagedBundleName}`
              : lastExportedAt
              ? `Last verified at ${new Date(lastExportedAt).toLocaleTimeString()}`
              : 'Select a .JSON bundle or click Dry-Run Verify to validate current stores.'}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono font-semibold text-[11px] inline-flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap shrink-0">
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Select Backup Bundle (.JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelected}
              className="hidden"
            />
          </label>

          <button
            type="button"
            data-testid="btn-dry-run-verify-backup"
            onClick={() => handleExecuteRestore(true)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 font-mono font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verify &amp; Dry-Run Restore (.JSON)</span>
          </button>

          <button
            type="button"
            data-testid="btn-commit-restore-backup"
            onClick={() => handleExecuteRestore(false)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-mono font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap shrink-0"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Restore Backup Bundle (.JSON)</span>
          </button>
        </div>
      </div>

      {dryRunVerified?.verified && dryRunVerified.counts && (
        <div
          data-testid="backup-dry-run-verified-badge"
          className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] flex items-center justify-between gap-2"
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              SHA-256 Bundle Integrity Verified (Schema v1.0): {dryRunVerified.counts.pilotRequests} leads · {dryRunVerified.counts.pilotWorkspaces} workspaces · {dryRunVerified.counts.plantWorkspaces} plants · {dryRunVerified.counts.importRuns} imports · {dryRunVerified.counts.verifiedProofs} proofs · {dryRunVerified.counts.deletionCertificates} deletion certs
            </span>
          </span>
        </div>
      )}

      {statusMessage && (
        <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-[11px] font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
