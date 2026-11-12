import React, { useState, useEffect, useMemo } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  ExecutiveBanner 
} from './components/ExecutiveBanner';
import { 
  ActionBoard 
} from './components/ActionBoard';
import { 
  CountSheet 
} from './components/CountSheet';
import { 
  PredictiveAnalytics 
} from './components/PredictiveAnalytics';
import {
  WarehouseReliabilityEngineV2
} from './components/WarehouseReliabilityEngineV2';
import { 
  RulesModal 
} from './components/RulesModal';
import { 
  ScannerModal 
} from './components/ScannerModal';
import { 
  AuditLogModal 
} from './components/AuditLogModal';
import { 
  PrintReport 
} from './components/PrintReport';

import { 
  AuditItem, 
  AuditRules, 
  UserRole, 
  AuditLogEntry 
} from './types/audit';
import { 
  INITIAL_SAMPLE_SKUS, 
  DEFAULT_RULES 
} from './data/sampleData';
import { 
  computeSummary, 
  calculateItemFields, 
  generateCSV, 
  formatINR 
} from './utils/auditCalculations';
import { getPartImageUrl } from './utils/partImages';
import {
  PlantId,
  getActivePlantIdFromStorage,
  readPlantDatasetFromBrowser,
  writePlantDatasetToBrowser,
} from '../data/multiPlantBaselines';

import { 
  LayoutDashboard, 
  Table, 
  TrendingUp, 
  Sliders, 
  CheckCircle2, 
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [activePlantId, setActivePlantId] = useState<PlantId>(() => getActivePlantIdFromStorage());

  // Persistence in plant-isolated localStorage
  const [items, setItems] = useState<AuditItem[]>(() => {
    const raw = readPlantDatasetFromBrowser(getActivePlantIdFromStorage()).p4Bins || INITIAL_SAMPLE_SKUS;
    return raw.map((it) => ({
      ...it,
      imageUrl: it.imageUrl || getPartImageUrl(it.code),
    }));
  });

  const [rules, setRules] = useState<AuditRules>(() => {
    return readPlantDatasetFromBrowser(getActivePlantIdFromStorage()).p4Rules || DEFAULT_RULES;
  });

  // Listen for plant changes in storage
  useEffect(() => {
    const handleStorage = () => {
      const currentPlant = getActivePlantIdFromStorage();
      if (currentPlant !== activePlantId) {
        setActivePlantId(currentPlant);
        const ds = readPlantDatasetFromBrowser(currentPlant);
        setItems(
          ds.p4Bins.map((it) => ({
            ...it,
            imageUrl: it.imageUrl || getPartImageUrl(it.code),
          }))
        );
        setRules(ds.p4Rules);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [activePlantId]);

  const [activeRole, setActiveRole] = useState<UserRole>('owner');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'countsheet' | 'predictive'>('dashboard');
  const [selectedSKUCode, setSelectedSKUCode] = useState<string | null>(null);

  // Modals & Views
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showAuditLogModal, setShowAuditLogModal] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  // Offline Simulation
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Immutable Audit Log
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => {
    return [
      {
        id: 'log-init',
        timestamp: '01 Oct 2026 08:30:15',
        user: 'System Boot',
        role: 'auditor',
        action: 'AUDIT_INITIALIZED',
        details: 'Pre-shutter morning bin audit initialized with plant baseline SKUs.',
      },
      {
        id: 'log-rules',
        timestamp: '01 Oct 2026 08:31:00',
        user: 'Lead Auditor',
        role: 'auditor',
        action: 'RULES_LOCKED',
        details: 'Cutoff set to ≥8 issues/mo, shrink tolerance set to 2.0%.',
      },
    ];
  });

  // Keep items synced to plant-isolated localStorage
  useEffect(() => {
    try {
      writePlantDatasetToBrowser(activePlantId, { p4Bins: items });
    } catch {}
  }, [items, activePlantId]);

  useEffect(() => {
    try {
      writePlantDatasetToBrowser(activePlantId, { p4Rules: rules });
    } catch {}
  }, [rules, activePlantId]);

  // Log an event helper
  const addLog = (action: string, details: string, itemCode?: string) => {
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      user: activeRole === 'owner' ? 'Store Owner' : activeRole === 'auditor' ? 'Lead Auditor' : activeRole === 'counter_boy' ? 'Counter Boy' : 'Warehouse Mgr',
      role: activeRole,
      action,
      itemCode,
      details,
    };
    setLogs((prev) => [newEntry, ...prev]);

    if (isOffline) {
      setPendingSyncCount((prev) => prev + 1);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Re-calculate enriched items and summary
  const enrichedItems = useMemo(() => {
    return items.map((it) => calculateItemFields(it, rules));
  }, [items, rules]);

  const summary = useMemo(() => {
    return computeSummary(items, rules);
  }, [items, rules]);

  // Handlers
  const handleUpdateItem = (id: string, updates: Partial<AuditItem>, logNote: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );
    const target = items.find((it) => it.id === id);
    addLog('ITEM_MODIFIED', logNote, target?.code);
    showToast(logNote);
  };

  const handleAddItem = (newItem: Omit<AuditItem, 'id'>) => {
    const id = `sku-${Date.now()}`;
    const added: AuditItem = { ...newItem, id };
    setItems((prev) => [...prev, added]);
    addLog('SKU_ADDED', `Added new SKU row ${newItem.code} (${newItem.part}) to audit`, newItem.code);
    showToast(`Added ${newItem.code} to count sheet`);
  };

  const handleDeleteItem = (id: string, partName: string) => {
    const item = items.find((it) => it.id === id);
    setItems((prev) => prev.filter((it) => it.id !== id));
    addLog('SKU_DELETED', `Deleted SKU row ${item?.code} (${partName}) from audit`, item?.code);
    showToast(`Removed ${partName} from count`);
  };

  const handleSaveRules = (updated: AuditRules) => {
    setRules(updated);
    addLog('RULES_UPDATED', `Threshold changed to ≥${updated.fastMoverCutoff} issues/mo, tol ${updated.shrinkTolerancePercent}%`);
    showToast('Audit rules and cutoff updated');
  };

  const handleResetSample = () => {
    if (window.confirm('Reset count sheet to the official 1 Oct 2026 sample (15 SKUs, ₹24,240 short, ₹560 found)?')) {
      setItems(INITIAL_SAMPLE_SKUS);
      setRules(DEFAULT_RULES);
      addLog('SAMPLE_RESET', 'Reset entire count sheet back to official 1 Oct 2026 baseline.');
      showToast('Reset to 1 Oct 2026 EV Spares sample');
    }
  };

  const handleExportCSV = () => {
    const csvContent = generateCSV(items, rules, summary);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BinAudit_${rules.countDate}_15SKUs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog('CSV_EXPORTED', `Exported count sheet with ${items.length} SKUs to CSV.`);
    showToast('Downloaded CSV count sheet');
  };

  const handleToggleOffline = () => {
    if (isOffline) {
      // Syncing back
      setIsOffline(false);
      showToast(`Online mode restored. ${pendingSyncCount} changes synced to Tally ERP.`);
      setPendingSyncCount(0);
      addLog('ERP_SYNC', 'Synchronized offline queue with central ERP database.');
    } else {
      setIsOffline(true);
      showToast('Switched to Offline Mode. Changes queued locally.');
    }
  };

  // If in Print View mode
  if (showPrintView) {
    return (
      <PrintReport
        items={enrichedItems}
        rules={rules}
        summary={summary}
        onBack={() => setShowPrintView(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Header */}
      <Header
        rules={rules}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        onOpenRules={() => setShowRulesModal(true)}
        onOpenScanner={() => setShowScannerModal(true)}
        onOpenAuditLog={() => setShowAuditLogModal(true)}
        onPrint={() => setShowPrintView(true)}
        onExportCSV={handleExportCSV}
        onResetSample={handleResetSample}
        isOffline={isOffline}
        onToggleOffline={handleToggleOffline}
        pendingSyncCount={pendingSyncCount}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
        {/* Toast alert */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500/60 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Executive Verdict Sentence & Scorecard */}
        <ExecutiveBanner
          summary={summary}
          onFilterDiscrepancies={() => {
            setFilterMode('discrepancy');
            setActiveTab('countsheet');
          }}
          onFilterHiddenFastMovers={() => {
            setFilterMode('hidden_fast');
            setActiveTab('countsheet');
          }}
          onFilterFoundStock={() => {
            setFilterMode('found_stock');
            setActiveTab('countsheet');
          }}
          onFilterAll={() => {
            setFilterMode('all');
          }}
          activeFilter={filterMode}
        />

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'dashboard'
                  ? 'border-emerald-500 text-white bg-slate-900/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              <span>Fix This Week (Action Board)</span>
              {summary.linesMismatch > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950 text-rose-300 font-mono font-bold border border-rose-800">
                  {summary.linesMismatch}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('countsheet')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'countsheet'
                  ? 'border-emerald-500 text-white bg-slate-900/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-4 h-4 text-amber-400" />
              <span>Count Sheet (The Product)</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                {items.length} SKUs
              </span>
            </button>

            <button
              onClick={() => setActiveTab('predictive')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'predictive'
                  ? 'border-emerald-500 text-white bg-slate-900/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Predictive &amp; Slotting Analytics</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Pre-Shutter Morning Session Active</span>
          </div>
        </div>

        {/* Tab 1: Action Board ("Fix this week, in rupee order") + V2.0 Warehouse Reliability Engine */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <ActionBoard
              items={enrichedItems}
              rules={rules}
              onUpdateItem={handleUpdateItem}
              onSelectSKU={(code) => {
                setSelectedSKUCode(code);
                setActiveTab('countsheet');
              }}
            />
            <WarehouseReliabilityEngineV2
              items={enrichedItems}
              rules={rules}
              summary={summary}
              onUpdateItem={handleUpdateItem}
              onSelectSKU={(code) => {
                setSelectedSKUCode(code);
                setActiveTab('countsheet');
              }}
            />
          </div>
        )}

        {/* Tab 2: Count Sheet (Spreadsheet Mode) */}
        {activeTab === 'countsheet' && (
          <CountSheet
            items={enrichedItems}
            rules={rules}
            activeRole={activeRole}
            onUpdateItem={handleUpdateItem}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            filterMode={filterMode}
            setFilterMode={setFilterMode}
            selectedCode={selectedSKUCode}
          />
        )}

        {/* Tab 3: Predictive & Slotting Analytics */}
        {activeTab === 'predictive' && (
          <PredictiveAnalytics
            items={enrichedItems}
            rules={rules}
            summary={summary}
          />
        )}
      </main>

      {/* Footer / Context Guidelines from Prompt */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Project 4 Bin Audit:</span>
            <span>Counted on 1 Oct 2026 before shutter opens. 15 SKUs sample counter.</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-3">
            <span>Shrinkage calculated at store cost rate (not MRP)</span>
            <span>•</span>
            <span>Zero lines slow at counter</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showRulesModal && (
        <RulesModal
          rules={rules}
          onSaveRules={handleSaveRules}
          onClose={() => setShowRulesModal(false)}
        />
      )}

      {showScannerModal && (
        <ScannerModal
          items={enrichedItems}
          onUpdateCount={(id, newCount, partName) => {
            handleUpdateItem(id, { physicalQty: newCount }, `Updated hand count via scanner for ${partName}: ${newCount} units`);
          }}
          onClose={() => setShowScannerModal(false)}
        />
      )}

      {showAuditLogModal && (
        <AuditLogModal
          logs={logs}
          onClearLogs={() => setLogs([])}
          onClose={() => setShowAuditLogModal(false)}
        />
      )}
    </div>
  );
}
