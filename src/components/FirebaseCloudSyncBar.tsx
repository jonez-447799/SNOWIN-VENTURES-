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
  X,
  AlertTriangle,
  ExternalLink,
  UserCheck,
  Plus,
  Trash2,
  ClipboardList,
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import type { PlantId } from '../context/PlantContext';
import { ALLOWED_NOTE_PILLARS, type NotePillar } from '../firebase';

interface FirebaseCloudSyncBarProps {
  activePlantId?: PlantId;
  compact?: boolean;
}

const PILLAR_LABELS: Record<NotePillar, string> = {
  P1_INVENTORY: 'Pillar 1 · Dead Stock & Working Capital',
  P2_OTIF: 'Pillar 2 · Dispatch OTIF',
  P3_FREIGHT: 'Pillar 3 · Freight & Detention',
  P4_WAREHOUSE: 'Pillar 4 · Bin & Physical Accuracy',
  EXECUTIVE: 'Executive Disposition',
};

export const FirebaseCloudSyncBar: React.FC<FirebaseCloudSyncBarProps> = ({
  activePlantId = 'ambattur',
  compact = false,
}) => {
  const {
    user,
    authReady,
    publicProfile,
    syncedWorkspaces,
    syncedLeads,
    auditNotes,
    lastSyncedAt,
    syncing,
    errorMessage,
    quotaExceededUrl,
    signInWithGoogle,
    signOutUser,
    syncActivePlant,
    removeSyncedWorkspace,
    addAuditNote,
    resolveAuditNote,
    clearError,
  } = useFirebase();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);
  const [notePillar, setNotePillar] = useState<NotePillar>('P1_INVENTORY');
  const [noteText, setNoteText] = useState('');
  const [noteValidationError, setNoteValidationError] = useState<string | null>(null);

  const handleSyncPlantClick = async () => {
    const ok = await syncActivePlant(activePlantId);
    if (ok) {
      setSyncSuccessToast(`Saved ${activePlantId.toUpperCase()} plant snapshot to your cloud workspace.`);
      setTimeout(() => setSyncSuccessToast(null), 3500);
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = noteText.trim();
    if (trimmed.length < 2) {
      setNoteValidationError('Enter at least 2 characters for the floor disposition note.');
      return;
    }
    const targetWorkspace = syncedWorkspaces[0];
    if (!targetWorkspace) {
      setNoteValidationError('Save a plant snapshot first so notes can attach to your workspace.');
      return;
    }
    setNoteValidationError(null);
    const ok = await addAuditNote({
      workspaceId: targetWorkspace.workspaceId,
      pillar: notePillar,
      summaryText: trimmed,
    });
    if (ok) {
      setNoteText('');
      setSyncSuccessToast('Saved floor disposition note to cloud workspace.');
      setTimeout(() => setSyncSuccessToast(null), 3000);
    }
  };

  return (
    <>
      <button
        type="button"
        data-testid="firebase-cloud-sync-trigger"
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-lg border font-mono transition cursor-pointer ${
          compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
        } ${
          user
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/70'
            : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
        }`}
        title="Manage Google Sign-In and saved plant snapshots"
      >
        <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="font-bold">
          {user
            ? `Workspace (${user.displayName?.split(' ')[0] || 'Account'})`
            : 'Cloud Sync'}
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
                    <Cloud className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h2 id="firebase-hub-modal-title" className="text-sm font-bold text-white">
                      Cloud Workspace &amp; Executive Sync
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Save 4-pillar plant snapshots, pilot audit requests, and floor disposition notes across devices
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close Cloud Workspace Dialog"
                  data-testid="close-firebase-hub-modal"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
                {/* Account & Quick Sync Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        {!authReady
                          ? 'Checking account...'
                          : user
                          ? `${publicProfile?.displayName || user.displayName || 'Executive Reviewer'}`
                          : 'Sign in with Google to Save Plant Workspaces'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {user
                        ? `${user.email || 'Verified account'} · ${publicProfile?.companyName || 'Ambattur Manufacturing Unit'}`
                        : 'Sign in with your verified work Google account to back up plant KPI snapshots and review notes across sessions.'}
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
                          <span>Save {activePlantId.toUpperCase()} Snapshot</span>
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

                {/* Saved Records Summary */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-200 uppercase text-[11px]">
                      Saved Cloud Records
                    </span>
                    {lastSyncedAt && (
                      <span className="text-[10px] font-mono text-emerald-400">
                        Updated {new Date(lastSyncedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Plant Snapshots</div>
                      <div className="text-base font-bold text-sky-300 mt-0.5 tabular-nums">
                        {syncedWorkspaces.length}
                      </div>
                      <div className="text-[10px] text-slate-500">4-Pillar KPI Baselines</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Pilot Audit Requests</div>
                      <div className="text-base font-bold text-amber-300 mt-0.5 tabular-nums">
                        {syncedLeads.length}
                      </div>
                      <div className="text-[10px] text-slate-500">Submitted Audit Intake</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Floor Audit Notes</div>
                      <div className="text-base font-bold text-emerald-300 mt-0.5 tabular-nums">
                        {auditNotes.length}
                      </div>
                      <div className="text-[10px] text-slate-500">Action Dispositions</div>
                    </div>
                  </div>

                  {syncedWorkspaces.length > 0 ? (
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        Saved Plant Baselines
                      </div>
                      {syncedWorkspaces.map((ws) => (
                        <div
                          key={ws.workspaceId}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-white">{ws.plantName}</span>
                            <div className="text-slate-400 text-[10px] mt-0.5">
                              {ws.skuCount} SKUs · ₹{ws.nonMovingValueInr.toLocaleString('en-IN')} Non-Moving · {ws.otifPercent}% OTIF · {ws.binMatchPercent}% Bin Match
                            </div>
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${ws.plantName} snapshot`}
                            onClick={() => removeSyncedWorkspace(ws.workspaceId)}
                            disabled={syncing}
                            className="p-1.5 rounded-md bg-slate-950 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 cursor-pointer transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 pt-1">
                      {user
                        ? `No plant snapshots saved yet. Click "Save ${activePlantId.toUpperCase()} Snapshot" above to store your current plant baseline.`
                        : 'Sign in above to view and manage your saved plant baselines and floor review notes.'}
                    </p>
                  )}
                </div>

                {/* Floor Disposition Notes (Active when user has a saved workspace) */}
                {user && syncedWorkspaces.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-emerald-400 shrink-0" />
                      <h3 className="font-mono font-bold text-slate-200 uppercase text-[11px]">
                        Floor Disposition Notes ({syncedWorkspaces[0].plantName})
                      </h3>
                    </div>

                    <form onSubmit={handleAddNoteSubmit} className="space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label htmlFor="cloud-note-pillar" className="sr-only">
                            Audit Pillar
                          </label>
                          <select
                            id="cloud-note-pillar"
                            value={notePillar}
                            onChange={(e) => setNotePillar(e.target.value as NotePillar)}
                            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          >
                            {ALLOWED_NOTE_PILLARS.map((pillar) => (
                              <option key={pillar} value={pillar}>
                                {PILLAR_LABELS[pillar]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2 flex gap-2">
                          <label htmlFor="cloud-note-summary" className="sr-only">
                            Floor observation or action note
                          </label>
                          <input
                            id="cloud-note-summary"
                            type="text"
                            maxLength={500}
                            value={noteText}
                            onChange={(e) => {
                              setNoteText(e.target.value);
                              if (noteValidationError) setNoteValidationError(null);
                            }}
                            placeholder="Log reorder freeze, dispatch bottleneck, or bin variance..."
                            className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="submit"
                            disabled={syncing}
                            className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                      {noteValidationError && (
                        <p className="text-[11px] text-amber-300 font-mono">{noteValidationError}</p>
                      )}
                    </form>

                    {auditNotes.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {auditNotes.map((note) => (
                          <div
                            key={note.noteId}
                            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 font-mono text-[10px]">
                                <span className="text-sky-300 font-bold">
                                  {PILLAR_LABELS[note.pillar] || note.pillar}
                                </span>
                                <span
                                  className={
                                    note.actionStatus === 'RESOLVED'
                                      ? 'text-emerald-400'
                                      : 'text-amber-300'
                                  }
                                >
                                  {note.actionStatus}
                                </span>
                              </div>
                              <p className="text-xs text-slate-200">{note.summaryText}</p>
                            </div>
                            {note.actionStatus !== 'RESOLVED' && (
                              <button
                                type="button"
                                onClick={() =>
                                  resolveAuditNote({
                                    workspaceId: note.workspaceId,
                                    noteId: note.noteId,
                                    summaryText: note.summaryText,
                                  })
                                }
                                disabled={syncing}
                                className="px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold cursor-pointer shrink-0"
                              >
                                Mark Resolved
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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
                          <span>Open Database Upgrade Dialog</span>
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
