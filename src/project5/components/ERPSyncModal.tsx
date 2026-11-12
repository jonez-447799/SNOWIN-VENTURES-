import React, { useState } from 'react';
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Download, 
  Server, 
  WifiOff, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { ERPConnection, MondayTowerData, Language } from '../types';
import { INITIAL_ERP_CONNECTIONS } from '../data/sampleData';

interface ERPSyncModalProps {
  towerData: MondayTowerData;
  setTowerData: React.Dispatch<React.SetStateAction<MondayTowerData>>;
  isDarkMode: boolean;
  language: Language;
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
}

export const ERPSyncModal: React.FC<ERPSyncModalProps> = ({
  towerData,
  setTowerData,
  isDarkMode,
  language,
  isOffline,
  setIsOffline,
}) => {
  const [connections, setConnections] = useState<ERPConnection[]>(INITIAL_ERP_CONNECTIONS);
  const [syncingSystem, setSyncingSystem] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const handleTriggerSync = (sysName: string) => {
    if (isOffline) {
      alert('Offline mode active. ERP sync requests are queued in local IndexedDB until gateway reconnects.');
      return;
    }

    setSyncingSystem(sysName);
    setTimeout(() => {
      setSyncingSystem(null);
      setSyncSuccessMsg(`Successfully synchronized latest records from ${sysName}. 8 Yellow inputs updated.`);
      
      // Update timestamp and slight realistic refresh
      setTowerData(prev => ({
        ...prev,
        lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST (ERP Synced)',
      }));

      setTimeout(() => setSyncSuccessMsg(null), 4000);
    }, 1400);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              ERP & Accounting Data Synchronization
            </h2>
            <p className="text-xs text-neutral-400">
              Bi-directional connector for Tally Prime, SAP S/4HANA, and logistics gate-pass systems.
            </p>
          </div>
        </div>

        {/* Offline Mode Toggle Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
              isOffline
                ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>{isOffline ? 'Simulating Offline Mode' : 'Toggle Offline Mode'}</span>
          </button>
        </div>
      </div>

      {syncSuccessMsg && (
        <div className="p-3.5 rounded-xl border border-emerald-800/80 bg-emerald-950/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* Connection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {connections.map((conn) => {
          const isSyncing = syncingSystem === conn.system;

          return (
            <div
              key={conn.system}
              className={`p-5 rounded-xl border flex flex-col justify-between ${
                isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-sm text-neutral-200">{conn.system}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {conn.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-neutral-400 font-mono">
                  <div>Endpoint: <span className="text-neutral-300">{conn.endpoint}</span></div>
                  <div>Last Synced: <span className="text-neutral-300">{conn.lastSync}</span></div>
                  <div>Records: <span className="text-neutral-300">{conn.syncedRecords} items</span></div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">Auto-sync 08:00 AM</span>
                <button
                  disabled={isSyncing}
                  onClick={() => handleTriggerSync(conn.system)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mapping Provenance Panel */}
      <div className={`p-5 rounded-xl border ${
        isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
      }`}>
        <h3 className="font-bold text-xs uppercase tracking-wider font-mono text-neutral-400 mb-3">
          Field-Level ERP Provenance Mapping
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/40">
            <span className="text-amber-400 font-bold block mb-1">Dead Cash (₹2,23,110)</span>
            <span className="text-neutral-400 text-[11px]">Source: SAP MM (Materials Management) Movement Code 900+ (Age &gt; 180 Days)</span>
          </div>
          <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/40">
            <span className="text-amber-400 font-bold block mb-1">Orders Late & OTIF (7 of 18)</span>
            <span className="text-neutral-400 text-[11px]">Source: SAP SD / Dispatch Bay Gate Register timestamp vs Sales Order Promising Time</span>
          </div>
          <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/40">
            <span className="text-amber-400 font-bold block mb-1">Unpaid Bills (₹3,40,000)</span>
            <span className="text-neutral-400 text-[11px]">Source: Tally Prime 'Sundry Debtors &gt; 30 Days Outstandings' Ledger Group</span>
          </div>
        </div>
      </div>
    </div>
  );
};
