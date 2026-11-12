import React, { useState } from 'react';
import { 
  Database, 
  Plus, 
  Check, 
  Trash2, 
  Download, 
  Upload, 
  Building2, 
  Layers, 
  ShieldCheck, 
  X, 
  ExternalLink,
  RefreshCw,
  FolderLock,
  ChevronRight
} from 'lucide-react';
import { FactoryWorkspace } from '../types/database';

interface DatabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: FactoryWorkspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: (workspace: Omit<FactoryWorkspace, 'id' | 'createdAt' | 'lastActive'>) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onExportBackup: () => void;
  onImportBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
  isOpen,
  onClose,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  onExportBackup,
  onImportBackup,
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newPlantName, setNewPlantName] = useState('Plant 1 - Gate Operations');
  const [newClusterLocation, setNewClusterLocation] = useState('');
  const [newIndustry, setNewIndustry] = useState<FactoryWorkspace['industry']>('Automotive');
  const [newPlanTier, setNewPlanTier] = useState<FactoryWorkspace['licenseTier']>('Pro Industrial');
  const [seedSampleData, setSeedSampleData] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    onCreateWorkspace({
      name: newCompanyName.trim(),
      plantLocation: newClusterLocation.trim() || 'Industrial Estate Area',
      industry: newIndustry,
      currencySymbol: '₹',
      licenseTier: newPlanTier,
      status: 'Active',
      profile: {
        id: `fac-${Date.now()}`,
        companyName: newCompanyName.trim(),
        plantName: newPlantName.trim() || 'Plant 1',
        clusterLocation: newClusterLocation.trim() || 'Industrial Hub',
        industryType: newIndustry,
        currencySymbol: '₹',
        planTier: newPlanTier,
        licenseStatus: 'Active',
        managerPhone: '+91 98000 00000',
        managerEmail: 'dispatch@factory.com',
        monthlyPriceStarter: 2999,
        monthlyPricePro: 4999,
        monthlyPriceEnterprise: 9999,
        founderTitle: 'Operations Audit Partner',
        founderName: 'Industrial Audit Partner',
        founderFirmName: 'Industrial OTIF Systems & Audit',
      },
      rules: {
        graceHours: 0,
        inFullCutoff: 100,
        weekStart: '2026-09-15',
        weekEnd: '2026-09-28',
        criticalAlertThreshold: 65,
        notifications: {
          enableWhatsAppAlerts: true,
          enableEmailAlerts: true,
          managerWhatsAppPhone: '+91 98000 00000',
          managerEmail: 'dispatch@factory.com',
          alertOnCriticalBreach: true,
          dailyDigestTime: '20:00',
        },
      },
      dispatches: seedSampleData
        ? [
            {
              id: `disp-new-1`,
              customer: 'Sample OEM Client A',
              po: 'PO-OEM-101',
              part: 'High-Tensile Sub-Assembly',
              orderedQty: 100,
              shippedQty: 100,
              promisedDate: '2026-09-20T16:00',
              actualOut: '2026-09-20T15:30',
              vehicle: 'TN-09-AA-1001',
              delayReason: '',
            },
            {
              id: `disp-new-2`,
              customer: 'Sample OEM Client B',
              po: 'PO-OEM-202',
              part: 'Precision Precision Component',
              orderedQty: 250,
              shippedQty: 250,
              promisedDate: '2026-09-21T18:00',
              actualOut: '2026-09-21T17:45',
              vehicle: 'TN-09-BB-2002',
              delayReason: '',
            },
          ]
        : [],
    });

    setNewCompanyName('');
    setNewClusterLocation('');
    setIsCreatingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Local Browser Workspace Slots</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Local Demonstration Storage
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Keep each demonstration workspace's dispatches, customers, POs, and rules in separate local browser storage slots.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          
          {/* Active Database Banner */}
          <div className="p-4 bg-gradient-to-r from-indigo-950/40 to-slate-900 rounded-xl border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-mono">
                  Currently Loaded Database
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {activeWorkspace?.id}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                {activeWorkspace?.name}
              </h3>
              <p className="text-xs text-slate-400">
                {activeWorkspace?.plantLocation} • {activeWorkspace?.industry} • {activeWorkspace?.dispatches.length} Total Dispatches Stored
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onExportBackup}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                title="Download this client's complete database as JSON"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Local demonstration export</span>
              </button>
              <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restore Vault</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Create New Client Database Form Toggle */}
          {!isCreatingNew ? (
            <div className="flex items-center justify-between pt-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Your Factory Client Accounts ({workspaces.length})
              </h4>
              <button
                onClick={() => setIsCreatingNew(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Client Factory Database</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateSubmit} className="bg-slate-950 p-5 rounded-xl border border-indigo-500/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Provision New Client Database Vault</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Factory Client Name *</label>
                  <input
                    type="text"
                    required
                    value={newCompanyName}
                    onChange={e => setNewCompanyName(e.target.value)}
                    placeholder="e.g. Acme Auto Components Pvt Ltd"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Plant / Unit Name</label>
                  <input
                    type="text"
                    value={newPlantName}
                    onChange={e => setNewPlantName(e.target.value)}
                    placeholder="e.g. Unit 1 - Press & Machining Division"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Industrial Cluster / Location</label>
                  <input
                    type="text"
                    value={newClusterLocation}
                    onChange={e => setNewClusterLocation(e.target.value)}
                    placeholder="e.g. Sanand Industrial Estate, Gujarat"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Industry Sector</label>
                  <select
                    value={newIndustry}
                    onChange={e => setNewIndustry(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Automotive">Automotive (OEM Tier-1 / Tier-2)</option>
                    <option value="Heavy Engineering">Heavy Engineering & Forgings</option>
                    <option value="FMCG Packaging">FMCG Packaging & Corrugated</option>
                    <option value="Pharma & Chemicals">Pharma & Bulk Chemicals</option>
                    <option value="General Precision">General Precision CNC Machining</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seedSampleData}
                    onChange={e => setSeedSampleData(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-0"
                  />
                  <span>Pre-load with 2 initial sample test dispatches</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="px-3 py-1.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Create Isolated Database</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* List of Client Databases */}
          <div className="grid grid-cols-1 gap-3">
            {workspaces.map(ws => {
              const isActive = ws.id === activeWorkspaceId;
              const isConfirmingDelete = deleteConfirmId === ws.id;

              return (
                <div
                  key={ws.id}
                  className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isActive
                      ? 'bg-indigo-950/20 border-indigo-500/50 ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {ws.name}
                      </span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Active Now
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                        {ws.licenseTier}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {ws.plantLocation} • {ws.industry}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>Records: {ws.dispatches.length} dispatches</span>
                      <span>•</span>
                      <span>Namespace: {ws.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isActive ? (
                      <button
                        onClick={() => onSelectWorkspace(ws.id)}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Switch To This Client</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>Loaded in View</span>
                      </div>
                    )}

                    {workspaces.length > 1 && !isActive && (
                      <div>
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                onDeleteWorkspace(ws.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold transition cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-1 text-slate-400 hover:text-white text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(ws.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition cursor-pointer"
                            title="Delete this client database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Privacy & Air-Gap Explainer */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <FolderLock className="w-4 h-4 text-amber-400" />
              <span>How Client Database Separation Works:</span>
            </div>
            <p className="leading-relaxed">
              Every client database operates in an isolated storage namespace. When you switch clients, the software instantly swaps the active records, rules, customer catalogs, and audit logs. Your Client A will <strong>never</strong> see Client B’s parts, pricing, or gate dispatch records.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-500">
          <span>Local Browser Workspace Slots • Operational data remains inside this browser</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
