import React from 'react';
import { History, ShieldCheck, Download, Trash2, Clock, UserCheck } from 'lucide-react';
import { AuditLogEntry } from '../types/audit';

interface AuditLogModalProps {
  logs: AuditLogEntry[];
  onClearLogs: () => void;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  logs,
  onClearLogs,
  onClose,
}) => {
  const exportLogJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bin_audit_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-2xl w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">System Audit &amp; Compliance Trail</h3>
              <p className="text-xs text-slate-400">Immutable ledger of physical count edits and slot relocations</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Total Logged Events: <strong className="text-white">{logs.length}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={exportLogJSON}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Log JSON</span>
            </button>
          </div>
        </div>

        {/* Log Entries List */}
        <div className="max-h-96 overflow-y-auto space-y-2 pr-1 text-xs">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No audit modifications logged yet in this session.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {log.timestamp}
                    </span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {log.action}
                    </span>
                    {log.itemCode && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px] font-semibold">
                        {log.itemCode}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-xs">{log.details}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium text-[10px] border border-slate-700 block">
                    {log.user} ({log.role})
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
