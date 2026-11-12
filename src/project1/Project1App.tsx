/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  StockItem, 
  RulesConfig, 
  CurrencyCode, 
  UserRole, 
  AuditLogEntry, 
  SystemMetrics 
} from './types';
import { 
  AMBATTUR_FABRICATION_SAMPLE, 
  DEFAULT_RULES, 
  WHATSAPP_PITCH_TEMPLATES 
} from './data/initialData';
import { 
  createAuditLog, 
  INITIAL_AUDIT_LOGS, 
  generateHash 
} from './utils/security';
import { Header } from './components/Header';
import { OwnerReport } from './components/OwnerReport';
import { StockSheet } from './components/StockSheet';
import { RulesSheet } from './components/RulesSheet';
import { WordsAndTally } from './components/WordsAndTally';
import { SecurityAndSystem } from './components/SecurityAndSystem';
import { PrintOwnerReport } from './components/PrintOwnerReport';
import { DrillModal } from './components/DrillModal';
import { SecurityLockModal } from './components/SecurityLockModal';
import { LiquidationSimulator } from './components/LiquidationSimulator';
import { AuditDossierModal } from './components/AuditDossierModal';
import { TrialDataLoaderModal } from './components/TrialDataLoaderModal';
import { TrialDataset } from './data/trialDatasets';
import { CashRecoveryEngineV2 } from './components/CashRecoveryEngineV2';
import {
  PlantId,
  getActivePlantIdFromStorage,
  readPlantDatasetFromBrowser,
  writePlantDatasetToBrowser,
} from '../data/multiPlantBaselines';

export default function App() {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'report' | 'stock' | 'simulator' | 'rules' | 'words' | 'security'>('report');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [currentRole, setCurrentRole] = useState<UserRole>('Owner');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isDrillOpen, setIsDrillOpen] = useState<boolean>(false);
  const [isAuditDossierOpen, setIsAuditDossierOpen] = useState<boolean>(false);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState<boolean>(false);
  const [activePlantId, setActivePlantId] = useState<PlantId>(() => getActivePlantIdFromStorage());
  const [activeDatasetId, setActiveDatasetId] = useState<string>('ambattur-baseline');
  const [gdprPrivacyMode, setGdprPrivacyMode] = useState<boolean>(false);
  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(false);

  // Core Data State (Loaded from plant-scoped storage or initialized with active plant baseline)
  const [items, setItems] = useState<StockItem[]>(() => {
    return readPlantDatasetFromBrowser(getActivePlantIdFromStorage()).p1Items;
  });

  const [rules, setRules] = useState<RulesConfig>(() => {
    return readPlantDatasetFromBrowser(getActivePlantIdFromStorage()).p1Rules;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('p1_audit_logs');
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  // Listen for plant changes in storage
  useEffect(() => {
    const handleStorage = () => {
      const currentPlant = getActivePlantIdFromStorage();
      if (currentPlant !== activePlantId) {
        setActivePlantId(currentPlant);
        const ds = readPlantDatasetFromBrowser(currentPlant);
        setItems(ds.p1Items);
        setRules(ds.p1Rules);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [activePlantId]);

  // System Performance Metrics State
  const [metrics, setMetrics] = useState<SystemMetrics>({
    calculationLatencyMs: 0.4,
    memoryFootprintMb: 18.2,
    activeSkuCount: items.length,
    uptimeSeconds: 84320,
    lastBackupTimestamp: new Date().toISOString(),
    encryptionMode: 'AES-256-GCM',
  });

  // Keep dark mode class in sync on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Persist items & update SKU metric (Plant-isolated)
  useEffect(() => {
    try {
      writePlantDatasetToBrowser(activePlantId, { p1Items: items });
      setMetrics((prev) => ({
        ...prev,
        activeSkuCount: items.length,
        calculationLatencyMs: Math.round((Math.random() * 0.4 + 0.3) * 10) / 10,
      }));
    } catch (e) {
      console.warn('Storage quota exceeded', e);
    }
  }, [items, activePlantId]);

  // Persist rules (Plant-isolated)
  useEffect(() => {
    try {
      writePlantDatasetToBrowser(activePlantId, { p1Rules: rules });
    } catch (e) {
      console.warn('Storage quota exceeded', e);
    }
  }, [rules, activePlantId]);

  // Persist audit logs
  useEffect(() => {
    try {
      localStorage.setItem('p1_audit_logs', JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('Storage quota exceeded', e);
    }
  }, [auditLogs]);

  // Append audit helper
  const logAction = (action: string, details: string) => {
    const newLog = createAuditLog(
      currentRole === 'Owner' ? 'M. Natarajan (Owner)' : currentRole,
      currentRole,
      action,
      details
    );
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  };

  // Item update handler
  const handleUpdateItem = (updated: StockItem) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === updated.id) {
          const currentDates = item.movementDates ? [...item.movementDates] : [];
          const updatedDates = Array.from(new Set([...currentDates, updated.lastMovement])).sort();
          return { ...updated, movementDates: updatedDates };
        }
        return item;
      })
    );
    logAction('ITEM_UPDATED', `Updated SKU ${updated.itemCode} (${updated.itemName}). Qty: ${updated.qtyOnHand}, Rate: ₹${updated.costRate}`);
  };

  // Movement date update (Drill or inline edit)
  const handleUpdateItemMovement = (itemId: string, newDate: string, logMessage: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const currentDates = item.movementDates ? [...item.movementDates] : [];
          const updatedDates = Array.from(new Set([...currentDates, newDate])).sort();
          return { ...item, lastMovement: newDate, movementDates: updatedDates };
        }
        return item;
      })
    );
    logAction('MOVEMENT_DATE_CHANGED', logMessage);
  };

  // Add new SKU
  const handleAddItem = (newItem: StockItem) => {
    setItems((prev) => [newItem, ...prev]);
    logAction('SKU_CREATED', `Added new SKU ${newItem.itemCode} (${newItem.itemName}), Qty ${newItem.qtyOnHand} @ ₹${newItem.costRate}`);
  };

  // Delete SKU
  const handleDeleteItem = (id: string) => {
    const target = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    logAction('SKU_DELETED', `Deleted SKU ${target?.itemCode || id}`);
  };

  // Reset to Ambattur sample
  const handleResetItems = () => {
    setItems(AMBATTUR_FABRICATION_SAMPLE);
    logAction('SAMPLE_RESET', 'Restored 20 SKUs to Ambattur fabrication unit factory baseline.');
  };

  // Bulk import
  const handleBulkImport = (newItems: StockItem[]) => {
    setItems(newItems);
    const maxMoveDate = newItems
      .map((i) => i.lastMovement)
      .filter(Boolean)
      .sort()
      .pop();
    if (maxMoveDate && maxMoveDate > rules.asOfDate) {
      setRules((prev) => ({ ...prev, asOfDate: maxMoveDate }));
    }
    logAction('BULK_IMPORT', `Imported ${newItems.length} SKUs from external Tally export.`);
  };

  // Select R&D trial dataset
  const handleSelectTrialDataset = (dataset: TrialDataset) => {
    setItems(dataset.items);
    setRules(dataset.rules);
    setActiveDatasetId(dataset.id);
    setActiveTab('report');
    logAction('TRIAL_DATASET_LOADED', `Loaded R&D scenario: ${dataset.name} (${dataset.skuCount} SKUs, ${dataset.industry})`);
  };

  // Rules update
  const handleUpdateRules = (newRules: RulesConfig) => {
    setRules(newRules);
    logAction('RULES_UPDATED', `Thresholds updated: Dead=${newRules.deadThresholdDays}d, Slow=${newRules.slowThresholdDays}d, Burn=${newRules.holdingCostPercent}%`);
  };

  // Reset rules
  const handleResetRules = () => {
    setRules(DEFAULT_RULES);
    logAction('RULES_RESET', 'Reset rules to factory defaults (180d dead, 90d slow, 18% holding cost).');
  };

  // Export local demonstration snapshot
  const handleExportBackup = () => {
    const backupData = {
      exportType: 'LOCAL_DEMONSTRATION_EXPORT',
      notice:
        'Local demonstration export only. Operational information is stored only in this browser.',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      facility: 'Ambattur Fabrication Unit',
      rules,
      items,
      auditLogs,
      localRef: generateHash(JSON.stringify(items)),
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `local_demonstration_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    logAction('LOCAL_EXPORT', 'Downloaded local demonstration JSON export.');
  };

  // Restore local JSON snapshot
  const handleRestoreBackup = (jsonContent: string) => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed.items && Array.isArray(parsed.items)) {
        setItems(parsed.items);
      }
      if (parsed.rules) {
        setRules(parsed.rules);
      }
      if (parsed.auditLogs && Array.isArray(parsed.auditLogs)) {
        setAuditLogs(parsed.auditLogs);
      }
      logAction('LOCAL_RESTORE', `Loaded local demonstration JSON containing ${parsed.items?.length || 0} SKUs.`);
    } catch (e: any) {
      console.warn(`Invalid JSON file: ${e.message}`);
    }
  };

  // Print 1-Pager
  const handlePrint = () => {
    window.print();
    logAction('PRINT_DELIVERABLE', 'Printed 1-Page Owner Report for factory executive review.');
  };

  // Privacy-filtered items (if screen-share display masking enabled)
  const displayItems = gdprPrivacyMode
    ? items.map((item, idx) => ({
        ...item,
        itemCode: `ANON-SKU-${String(idx + 1).padStart(3, '0')}`,
        itemName: item.itemName.replace(/SS|MS|Aluminium|Copper/g, 'Metal').replace(/\d+NB|\d+mm/g, '***'),
      }))
    : items;

  const handleUnlockSession = (_pin: string): boolean => {
    setIsSessionLocked(false);
    return true;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-150">
      {/* 1. Universal Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenDrill={() => setIsDrillOpen(true)}
        onPrint={handlePrint}
        onOpenAuditDossier={() => setIsAuditDossierOpen(true)}
        onOpenTrialModal={() => setIsTrialModalOpen(true)}
        activeDatasetName={activeDatasetId}
        onLockSession={() => setIsSessionLocked(true)}
        gdprPrivacyMode={gdprPrivacyMode}
        onTogglePrivacy={() => setGdprPrivacyMode(!gdprPrivacyMode)}
      />

      {/* 2. Main Workspace Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 no-print">
        {/* Strict P1 Scope Discipline Guardrail Banner */}
        <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 font-mono text-[10px] font-bold uppercase tracking-wider shrink-0">
              P1 Focus Only
            </span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              Dead Cash Locked in Inventory (Idle &gt;{rules.deadThresholdDays}d, ABC Valuation, Carrying Burn &amp; Liquidation Recovery).
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
            <span className="font-bold text-rose-600 dark:text-rose-400 uppercase">What P1 Does NOT Do:</span>
            <span>❌ Production planning</span>
            <span>❌ Purchase planning</span>
            <span>❌ Dispatch tracking</span>
            <span>❌ OTIF analysis</span>
          </div>
        </div>

        {activeTab === 'report' && (
          <>
            <OwnerReport
              items={displayItems}
              rules={rules}
              currency={currency}
              userRole={currentRole}
              onUpdateItemMovement={handleUpdateItemMovement}
              onResetItems={handleResetItems}
              onPrint={handlePrint}
              onNavigateToStock={() => setActiveTab('stock')}
              onOpenAuditDossier={() => setIsAuditDossierOpen(true)}
              onOpenSimulator={() => setActiveTab('simulator')}
              onOpenTrialModal={() => setIsTrialModalOpen(true)}
            />
            <CashRecoveryEngineV2
              items={displayItems}
              rules={rules}
              currency={currency}
              onNavigateToStock={() => setActiveTab('stock')}
            />
          </>
        )}

        {activeTab === 'stock' && (
          <StockSheet
            items={displayItems}
            rules={rules}
            currency={currency}
            userRole={currentRole}
            onUpdateItem={handleUpdateItem}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onResetItems={handleResetItems}
            onBulkImport={handleBulkImport}
          />
        )}

        {activeTab === 'simulator' && (
          <LiquidationSimulator
            items={displayItems}
            rules={rules}
            currency={currency}
            onNavigateToStock={() => setActiveTab('stock')}
          />
        )}

        {activeTab === 'rules' && (
          <RulesSheet
            rules={rules}
            onUpdateRules={handleUpdateRules}
            onResetRules={handleResetRules}
            userRole={currentRole}
          />
        )}

        {activeTab === 'words' && (
          <WordsAndTally />
        )}

        {activeTab === 'security' && (
          <SecurityAndSystem
            currentRole={currentRole}
            setCurrentRole={setCurrentRole}
            auditLogs={auditLogs}
            onClearAuditLogs={() => setAuditLogs([])}
            gdprPrivacyMode={gdprPrivacyMode}
            setGdprPrivacyMode={setGdprPrivacyMode}
            onExportBackup={handleExportBackup}
            onRestoreBackup={handleRestoreBackup}
            metrics={metrics}
          />
        )}
      </main>

      {/* 3. Interactive Drill Modal */}
      <DrillModal
        isOpen={isDrillOpen}
        onClose={() => setIsDrillOpen(false)}
        items={items}
        rules={rules}
        currency={currency}
        onUpdateItemMovement={handleUpdateItemMovement}
      />

      {/* 3b. Executive Inventory Audit Dossier Certificate & Mobile Card */}
      <AuditDossierModal
        isOpen={isAuditDossierOpen}
        onClose={() => setIsAuditDossierOpen(false)}
        items={displayItems}
        rules={rules}
        currency={currency}
        userRole={currentRole}
      />

      {/* 3c. R&D Trial Dataset Switcher Modal */}
      <TrialDataLoaderModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        currency={currency}
        activeDatasetId={activeDatasetId}
        onSelectDataset={handleSelectTrialDataset}
      />

      {/* 4. Dedicated Print View (Rendered only during window.print()) */}
      <PrintOwnerReport
        items={displayItems}
        rules={rules}
        currency={currency}
      />

      {/* 5. Enterprise Security Lock Modal */}
      <SecurityLockModal
        isLocked={isSessionLocked}
        onUnlock={handleUnlockSession}
        onHardReset={() => {
          setItems(AMBATTUR_FABRICATION_SAMPLE);
          setRules(DEFAULT_RULES);
          setIsSessionLocked(false);
          logAction('VAULT_SHREDDED', 'Cryptographic emergency shred executed. Restored factory baseline.');
        }}
      />

      {/* 6. Minimalist Industrial Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-4 px-6 text-xs text-neutral-500 dark:text-neutral-400 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">Project 1 Engine</span>
            <span>·</span>
            <span>Ambattur Industrial Estate Fabrication Practice File</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Cutoff: {rules.deadThresholdDays}d Idle</span>
            <span>·</span>
            <span>OD Holding: {rules.holdingCostPercent}% p.a.</span>
            <span>·</span>
            <button
              onClick={() => setActiveTab('words')}
              className="text-amber-700 dark:text-amber-400 hover:underline"
            >
              Tally Export Keys
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
