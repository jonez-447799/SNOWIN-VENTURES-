import React, { useState } from 'react';
import {
  X,
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  HardDrive,
  Lock
} from 'lucide-react';

interface MultiDeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncImported: () => void;
}

export const SYNC_KEYS = [
  'p1_stock_items',
  'p1_stock_rules',
  'otif_workspaces_v2',
  'otif_active_workspace_id_v2',
  'freight_audit_trips_v1',
  'freight_audit_rules_v1',
  'binaudit_skus_v1',
  'binaudit_rules_v1',
  'monday_control_tower_v1',
  'monday_tower_data_v1',
  'p5_unpaid_bills_v1',
  'p5_executive_actions_v2',
  'p1_recovery_tracker_v2',
];

export const MultiDeviceSyncModal: React.FC<MultiDeviceSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [statusMessage, setStatusMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleDownloadJsonFile = () => {
    const payload: Record<string, unknown> = {
      exportType: 'LOCAL_DEMONSTRATION_EXPORT',
      notice:
        'Local demonstration export only. Operational data remains inside this browser in the current demonstration environment.',
      timestamp: new Date().toISOString(),
      engines: {},
    };
    const enginesObj = payload.engines as Record<string, unknown>;
    SYNC_KEYS.forEach((k) => {
      const val = localStorage.getItem(k);
      if (val) {
        try {
          enginesObj[k] = JSON.parse(val);
        } catch {
          enginesObj[k] = val;
        }
      }
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Operationalyst_Local_Demo_Export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage({
      type: 'ok',
      text: 'Downloaded local demonstration export (.JSON) to your device.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  Local Browser Storage &amp; Sync Status
                </h2>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold uppercase">
                  DEMONSTRATION ENVIRONMENT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Browser-local demonstration state management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Disabled Organization Sync Notice */}
          <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-amber-200">
                  Secure organization sync is not yet available.
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Operational data remains inside this browser in the current demonstration environment.
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  Unauthenticated external cloud relays, third-party JSON endpoints, and shareable URL state links are disabled to prevent accidental exposure of operational records.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-lg bg-slate-800/80 text-slate-500 border border-slate-700/80 text-xs font-bold flex items-center gap-2 cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Generate Live Sync Link (Disabled)</span>
              </button>
              <span className="text-[11px] text-slate-400 font-mono">
                Requires authenticated organization backend
              </span>
            </div>
          </div>

          {/* Local Demonstration Export */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Local demonstration export
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Browser-only JSON snapshot</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              You may download a local JSON copy of the current browser workspace for offline inspection. Figures and records shown here are illustrative unless you have imported data locally in this browser.
            </p>
            <div className="pt-1">
              <button
                onClick={handleDownloadJsonFile}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer transition"
              >
                <DownloadCloud className="w-4 h-4 text-cyan-400" />
                <span>Download Local demonstration export (.JSON)</span>
              </button>
            </div>
          </div>

          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                statusMessage.type === 'ok'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              {statusMessage.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Operational data remains inside this browser in the current demonstration environment.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
