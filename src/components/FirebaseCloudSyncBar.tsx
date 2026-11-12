/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Cloud,
  CheckCircle2,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Database,
  X,
  AlertTriangle,
  UserCheck,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import type { PlantId } from '../context/PlantContext';

interface FirebaseCloudSyncBarProps {
  activePlantId?: PlantId;
  compact?: boolean;
}

export const FirebaseCloudSyncBar: React.FC<FirebaseCloudSyncBarProps> = ({
  activePlantId = 'ambattur',
  compact = false,
}) => {
  const {
    user,
    authReady,
    connectionStatus,
    projectId,
    databaseId,
    publicProfile,
    privateInfo,
    syncedWorkspaces,
    syncedLeads,
    lastSyncedAt,
    syncing,
    errorMessage,
    quotaExceededUrl,
    signInWithGoogle,
    signOutUser,
    syncActivePlant,
    clearError,
  } = useFirebase();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);

  const handleSyncPlantClick = async () => {
    const ok = await syncActivePlant(activePlantId);
    if (ok) {
      setSyncSuccessToast(`Synced ${activePlantId.toUpperCase()} 4-Pillar Snapshot to Firestore`);
      setTimeout(() => setSyncSuccessToast(null), 3500);
    }
  };

  return (
    <>
      <button
        type="button"
        data-testid="firebase-cloud-sync-trigger"
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-lg border font-mono transition cursor-pointer ${
          compact
            ? 'px-2.5 py-1 text-[11px]'
            : 'px-3 py-1.5 text-xs'
        } ${
          user
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/70'
            : connectionStatus === 'connected'
            ? 'bg-slate-900 border-sky-500/40 text-sky-300 hover:bg-slate-800'
            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
        }`}
        title="Open Firebase Auth & Firestore Cloud Persistence Hub"
      >
        <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="font-bold">
          {user
            ? `Cloud Synced (${user.displayName?.split(' ')[0] || 'Signed In'})`
            : connectionStatus === 'connected'
            ? 'Firebase Ready'
            : 'Firebase Cloud'}
        </span>
      </button>

      {isModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="firebase-hub-modal-title"
            data-testid="firebase-cloud-sync-modal"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          >
            <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
                  <Database className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 id="firebase-hub-modal-title" className="text-sm font-bold text-white">
                    Firebase Firestore &amp; Google Auth Persistence Hub
                  </h2>
                  <p className="text-[11px] font-mono text-slate-400">
                    Project: {projectId} • Region: asia-southeast1
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close Firebase Cloud Hub"
                data-testid="close-firebase-hub-modal"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* Connection & Database Status Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Firestore Status</div>
                  <div
                    data-testid="firebase-connection-status"
                    className="mt-1 flex items-center gap-1.5 font-bold text-emerald-400"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {connectionStatus === 'connected'
                        ? 'ONLINE (Enterprise)'
                        : connectionStatus === 'connecting'
                        ? 'CONNECTING...'
                        : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5" title={databaseId}>
                    DB: {databaseId}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Authentication</div>
                  <div className="mt-1 flex items-center gap-1.5 font-bold text-sky-300 truncate">
                    <UserCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {!authReady
                        ? 'Checking...'
                        : user
                        ? user.email || user.displayName || 'Authenticated'
                        : 'Not Signed In'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Provider: Google Sign-In (Popup)
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Security Rules</div>
                  <div className="mt-1 flex items-center gap-1.5 font-bold text-amber-300">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>ABAC Zero-Trust v2</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Split-PII &amp; Master Gate Active
                  </div>
                </div>
              </div>

              {/* Auth Action Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {user
                        ? `Signed in as ${publicProfile?.displayName || user.displayName || user.email}`
                        : 'Sign in with Google to Sync Plant Workspaces'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {user
                      ? `PII isolated in /users/${user.uid.slice(0, 8)}.../private/info (${
                          privateInfo?.email || user.email
                        })`
                      : 'Authenticate with your verified Google account to persist plant snapshots and pilot audit requests to Firestore.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {!user ? (
                    <button
                      type="button"
                      data-testid="firebase-google-signin-btn"
                      onClick={signInWithGoogle}
                      disabled={syncing}
                      className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{syncing ? 'Signing In...' : 'Sign In with Google'}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        data-testid="firebase-sync-plant-btn"
                        onClick={handleSyncPlantClick}
                        disabled={syncing}
                        className="px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                        <span>Sync {activePlantId.toUpperCase()} Snapshot</span>
                      </button>
                      <button
                        type="button"
                        data-testid="firebase-signout-btn"
                        onClick={signOutUser}
                        className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Synced Firestore Collections Overview */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-200 uppercase text-[11px]">
                    Active Firestore Collections &amp; Live Document Counts
                  </span>
                  {lastSyncedAt && (
                    <span className="text-[10px] font-mono text-emerald-400">
                      Last Synced: {new Date(lastSyncedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">/users/&#123;uid&#125;</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {publicProfile ? '1 Active' : '0'}
                    </div>
                    <div className="text-[9px] text-slate-500">Public Profile</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">/private/info</div>
                    <div className="text-sm font-bold text-emerald-300 mt-0.5">
                      {privateInfo ? 'Isolated' : '0'}
                    </div>
                    <div className="text-[9px] text-slate-500">Split PII Vault</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">/plant_workspaces</div>
                    <div className="text-sm font-bold text-sky-300 mt-0.5">
                      {syncedWorkspaces.length}
                    </div>
                    <div className="text-[9px] text-slate-500">4-Pillar Snapshots</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">/pilot_requests</div>
                    <div className="text-sm font-bold text-amber-300 mt-0.5">
                      {syncedLeads.length}
                    </div>
                    <div className="text-[9px] text-slate-500">Pilot Audit Leads</div>
                  </div>
                </div>

                {syncedWorkspaces.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">
                      Synced Plant Workspaces in Firestore:
                    </div>
                    {syncedWorkspaces.map((ws) => (
                      <div
                        key={ws.workspaceId}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]"
                      >
                        <span className="font-bold text-white">{ws.plantName}</span>
                        <span className="text-slate-300">
                          {ws.skuCount} SKUs • ₹{ws.nonMovingValueInr.toLocaleString('en-IN')} Non-Moving • {ws.otifPercent}% OTIF
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {syncSuccessToast && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{syncSuccessToast}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 font-mono text-[11px] space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearError}
                      className="text-[10px] text-rose-300 underline cursor-pointer shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                  {quotaExceededUrl && (
                    <div className="pt-1 flex flex-wrap items-center gap-3">
                      <a
                        href={quotaExceededUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-amber-300 hover:underline font-bold"
                      >
                        <span>Open Firestore Database Upgrade Dialog</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://firebase.google.com/pricing#cloud-firestore"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sky-300 hover:underline"
                      >
                        <span>View Spark Plan Enterprise Limits</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

