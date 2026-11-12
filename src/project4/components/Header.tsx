import React from 'react';
import { 
  ShieldCheck, 
  Calendar, 
  QrCode, 
  Sliders, 
  History, 
  Printer, 
  Download, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Store,
  UserCheck
} from 'lucide-react';
import { AuditRules, UserRole } from '../types/audit';

interface HeaderProps {
  rules: AuditRules;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenRules: () => void;
  onOpenScanner: () => void;
  onOpenAuditLog: () => void;
  onPrint: () => void;
  onExportCSV: () => void;
  onResetSample: () => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  pendingSyncCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  rules,
  activeRole,
  onRoleChange,
  onOpenRules,
  onOpenScanner,
  onOpenAuditLog,
  onPrint,
  onExportCSV,
  onResetSample,
  isOffline,
  onToggleOffline,
  pendingSyncCount,
}) => {
  const roleLabels: Record<UserRole, { title: string; badge: string; desc: string }> = {
    owner: { title: 'Store Owner', badge: 'Rupee & Loss Focus', desc: 'Financial loss, shrinkage approval' },
    auditor: { title: 'Senior Auditor', badge: 'Full Audit Rights', desc: 'Rules, discrepancies, verification' },
    counter_boy: { title: 'Counter Boy', badge: 'Hand Count Mode', desc: 'Count entry, rack relocation' },
    warehouse_mgr: { title: 'Warehouse Mgr', badge: 'Slotting & Stock', desc: 'Mezzanine & back rack slotting' },
  };

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 relative z-20 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand & Store Details */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-inner">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Warehouse Reliability Engine</span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-700/50">
                    P4 • Inventory Accuracy Intelligence
                  </span>
                </h1>
                <span className="text-xs text-slate-400 hidden sm:inline">•</span>
                <span className="text-xs text-slate-300 hidden sm:inline font-medium">
                  {rules.storeName} (BinAudit EV)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Count Date: <strong className="text-white font-mono">{rules.countDate} (Pre-Shutter Morning)</strong>
                </span>
                <span className="hidden md:inline text-slate-600">|</span>
                <span className="hidden md:inline text-slate-400">
                  Cutoff: <span className="text-amber-300 font-mono font-semibold">≥{rules.fastMoverCutoff} issues/mo</span>
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Role, Sync, Barcode Scanner, Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {/* RBAC Role Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400 font-medium">Role:</span>
              <select
                value={activeRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-emerald-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="owner" className="bg-slate-800 text-white">Owner View (₹ Focus)</option>
                <option value="auditor" className="bg-slate-800 text-white">Lead Auditor (Full)</option>
                <option value="counter_boy" className="bg-slate-800 text-white">Counter Boy (Hand Count)</option>
                <option value="warehouse_mgr" className="bg-slate-800 text-white">Warehouse Mgr (Slotting)</option>
              </select>
            </div>

            {/* Offline & ERP Sync Indicator */}
            <button
              onClick={onToggleOffline}
              title={isOffline ? 'Offline mode enabled. Click to go online.' : 'Connected to ERP. Click to simulate offline.'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                isOffline
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800/80 hover:bg-amber-900/60'
                  : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-750'
              }`}
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Offline ({pendingSyncCount} queued)</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tally ERP Synced</span>
                </>
              )}
            </button>

            {/* Barcode Scanner Button */}
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Scan SKU</span>
            </button>

            {/* Rules Button */}
            <button
              onClick={onOpenRules}
              title="Audit Rules & Cutoff Thresholds"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Rules</span>
            </button>

            {/* Audit Log */}
            <button
              onClick={onOpenAuditLog}
              title="Audit Trail & Change Logs"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline">Audit Log</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={onExportCSV}
              title="Export Count Sheet to CSV"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden xl:inline">CSV</span>
            </button>

            {/* Print Owner Report */}
            <button
              onClick={onPrint}
              title="Print Executive Owner Report"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Print Report</span>
            </button>

            {/* Reset to 1 Oct Sample */}
            <button
              onClick={onResetSample}
              title="Reset to 1 Oct 2026 Sample Audit (15 SKUs)"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
