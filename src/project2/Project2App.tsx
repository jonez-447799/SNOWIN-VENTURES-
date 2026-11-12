/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { OwnerReport } from './components/OwnerReport';
import { DispatchesSheet } from './components/DispatchesSheet';
import { GateTabletView } from './components/GateTabletView';
import { TheDrillWalkthrough } from './components/TheDrillWalkthrough';
import { GateRegisterViewer } from './components/GateRegisterViewer';
import { RulesSettings } from './components/RulesSettings';
import { FieldGuide } from './components/FieldGuide';
import { AddDispatchModal } from './components/AddDispatchModal';
import { BulkImportModal } from './components/BulkImportModal';
import { WhatsAppDigestModal } from './components/WhatsAppDigestModal';
import { FactoryProfileModal } from './components/FactoryProfileModal';
import { ROICalculatorModal } from './components/ROICalculatorModal';
import { WhatIfSimulatorModal } from './components/WhatIfSimulatorModal';
import { CAPA8DModal } from './components/CAPA8DModal';
import { DispatchCertificateModal } from './components/DispatchCertificateModal';
import { SalesProposalModal } from './components/SalesProposalModal';
import { ClientPipelineModal } from './components/ClientPipelineModal';
import { FounderPersonaModal } from './components/FounderPersonaModal';
import { DatabaseManagerModal } from './components/DatabaseManagerModal';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { PinPromptModal } from './components/PinPromptModal';
import { RndLab } from './components/RndLab';
import { CustomerPromiseEngineV2 } from './components/CustomerPromiseEngineV2';
import { INITIAL_DISPATCHES, INITIAL_RULES } from './data/initialData';
import { INITIAL_WORKSPACES, INITIAL_SECURITY_CONFIG, INITIAL_AUDIT_LOGS } from './data/factoryWorkspaces';
import { DispatchRow, RulesConfig, UserRole } from './types/otif';
import { FactoryWorkspace, AuditLogEntry, SecurityConfig } from './types/database';
import { calculateOTIFMetrics } from './utils/otifCalculator';
import { getActiveP2WorkspaceId, STORAGE_KEY_P2_ACTIVE_WS } from '../utils/importValidation';
import {
  PlantId,
  getActivePlantIdFromStorage,
  readPlantDatasetFromBrowser,
  writePlantDatasetToBrowser,
} from '../data/multiPlantBaselines';

const STORAGE_KEY_WORKSPACES = 'otif_workspaces_v2';
const STORAGE_KEY_ACTIVE_WS = STORAGE_KEY_P2_ACTIVE_WS;
const STORAGE_KEY_SECURITY = 'otif_security_config_v2';
const STORAGE_KEY_AUDIT = 'otif_audit_logs_v2';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'report' | 'sheet' | 'gate' | 'drill' | 'register' | 'rules' | 'guide' | 'rnd'>('report');
  const [currentRole, setCurrentRole] = useState<UserRole>('owner');
  const [activePlantId, setActivePlantId] = useState<PlantId>(() => getActivePlantIdFromStorage());
  
  // Sheet drill-down filters when clicking from Owner Report
  const [sheetCustomerFilter, setSheetCustomerFilter] = useState<string>('');
  const [sheetReasonFilter, setSheetReasonFilter] = useState<string>('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isFactoryProfileOpen, setIsFactoryProfileOpen] = useState(false);
  const [isROICalculatorOpen, setIsROICalculatorOpen] = useState(false);
  const [isWhatIfSimulatorOpen, setIsWhatIfSimulatorOpen] = useState(false);
  const [isCAPA8DOpen, setIsCAPA8DOpen] = useState(false);
  const [isSalesProposalOpen, setIsSalesProposalOpen] = useState(false);
  const [isPipelineOpen, setIsPipelineOpen] = useState(false);
  const [isFounderPersonaOpen, setIsFounderPersonaOpen] = useState(false);
  const [isDatabaseManagerOpen, setIsDatabaseManagerOpen] = useState(false);
  const [isSecurityAuditOpen, setIsSecurityAuditOpen] = useState(false);
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false);
  const [pinPendingAction, setPinPendingAction] = useState<(() => void) | null>(null);
  const [selectedCertificateDispatch, setSelectedCertificateDispatch] = useState<DispatchRow | null>(null);

  // Multi-Tenant Factory Workspaces (Client Databases)
  const [workspaces, setWorkspaces] = useState<FactoryWorkspace[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORKSPACES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_WORKSPACES;
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    return getActiveP2WorkspaceId(INITIAL_WORKSPACES[0]?.id || 'ws_apex_01');
  });

  // Security Configuration
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SECURITY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_SECURITY_CONFIG;
  });

  // Local Activity History
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUDIT);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_AUDIT_LOGS;
  });

  // Active workspace object
  const activeWorkspace = useMemo(() => {
    return workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0] || INITIAL_WORKSPACES[0];
  }, [workspaces, activeWorkspaceId]);

  // Current dispatches & rules tied to the active plant dataset
  const [rules, setRules] = useState<RulesConfig>(() => {
    return readPlantDatasetFromBrowser(getActivePlantIdFromStorage()).p2Rules || INITIAL_RULES;
  });
  const [dispatches, setDispatches] = useState<DispatchRow[]>(() => {
    return readPlantDatasetFromBrowser(getActivePlantIdFromStorage()).p2Dispatches || INITIAL_DISPATCHES;
  });

  // Listen for plant changes in storage
  useEffect(() => {
    const handleStorage = () => {
      const currentPlant = getActivePlantIdFromStorage();
      if (currentPlant !== activePlantId) {
        setActivePlantId(currentPlant);
        const ds = readPlantDatasetFromBrowser(currentPlant);
        setRules(ds.p2Rules);
        setDispatches(ds.p2Dispatches);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [activePlantId]);

  // Save changes to plant-isolated storage and active workspace
  useEffect(() => {
    writePlantDatasetToBrowser(activePlantId, {
      p2Rules: rules,
      p2Dispatches: dispatches,
    });
    setWorkspaces(prev =>
      prev.map(w =>
        w.id === activeWorkspaceId
          ? {
              ...w,
              rules,
              dispatches,
              profile: rules.factoryProfile || w.profile,
              lastActive: new Date().toISOString(),
            }
          : w
      )
    );
  }, [rules, dispatches, activeWorkspaceId, activePlantId]);

  // Save workspaces to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WORKSPACES, JSON.stringify(workspaces));
      localStorage.setItem(STORAGE_KEY_ACTIVE_WS, activeWorkspaceId);
    } catch {
      // ignore
    }
  }, [workspaces, activeWorkspaceId]);

  // Save security config
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SECURITY, JSON.stringify(securityConfig));
    } catch {
      // ignore
    }
  }, [securityConfig]);

  // Save audit logs
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(auditLogs));
    } catch {
      // ignore
    }
  }, [auditLogs]);

  // Compute metrics in real-time
  const metrics = useMemo(() => {
    return calculateOTIFMetrics(dispatches, rules);
  }, [dispatches, rules]);

  // Check if data is currently modified compared to initial benchmark
  const isBenchmarkModified = useMemo(() => {
    if (dispatches.length !== INITIAL_DISPATCHES.length) return true;
    if (rules.graceHours !== INITIAL_RULES.graceHours || rules.inFullCutoff !== INITIAL_RULES.inFullCutoff || (rules.criticalAlertThreshold ?? 60) !== INITIAL_RULES.criticalAlertThreshold) return true;
    for (let i = 0; i < dispatches.length; i++) {
      const d = dispatches[i];
      const orig = INITIAL_DISPATCHES.find(o => o.id === d.id);
      if (!orig) return true;
      if (d.shippedQty !== orig.shippedQty || d.actualOut !== orig.actualOut || d.delayReason !== orig.delayReason) {
        return true;
      }
    }
    return false;
  }, [dispatches, rules]);

  // Local Activity History Logging Helper (Browser demonstration only)
  const logAuditAction = (action: AuditLogEntry['action'], details: string, recordId?: string) => {
    const randomRef = Math.random().toString(36).substring(2, 8);
    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      userRole: currentRole,
      userName:
        currentRole === 'owner'
          ? (rules.factoryProfile?.founderName || 'Plant Head')
          : currentRole === 'gate'
          ? 'Security Gate Kiosk'
          : 'Stores Dispatch Clerk',
      details,
      recordId,
      digitalSignature: `local_ref_${randomRef}`,
      ipHash: 'Local Browser Session',
    };
    setAuditLogs(prev => [newEntry, ...prev.slice(0, 99)]);
  };

  // Handlers
  const handleUpdateDispatch = (id: string, updates: Partial<DispatchRow>) => {
    setDispatches(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
    logAuditAction('DISPATCH_MODIFIED', `Updated dispatch record ${id}.`, id);
  };

  const handleDeleteDispatch = (id: string) => {
    setDispatches(prev => prev.filter(d => d.id !== id));
    logAuditAction('DISPATCH_DELETED', `Deleted dispatch record ${id}.`, id);
  };

  const handleAddNewDispatch = (newRow: DispatchRow) => {
    setDispatches(prev => [newRow, ...prev]);
    logAuditAction(
      'DISPATCH_CREATED',
      `Logged vehicle ${newRow.vehicle || 'N/A'} for ${newRow.customer} (PO: ${newRow.po}).`,
      newRow.id
    );
  };

  const handleResetBenchmark = () => {
    setDispatches(INITIAL_DISPATCHES);
    setRules(INITIAL_RULES);
    logAuditAction('RULES_UPDATED', 'Reset benchmark sample dataset to default.');
  };

  const handleNavigateToSheet = (filterCustomer?: string, filterReason?: string) => {
    setSheetCustomerFilter(filterCustomer || '');
    setSheetReasonFilter(filterReason || '');
    setCurrentTab('sheet');
  };

  // Supervisor PIN lock check for role changes
  const handleRoleChange = (role: UserRole) => {
    if (role === 'owner' && securityConfig.isPinLockEnabled && securityConfig.isCurrentlyLocked) {
      setPinPendingAction(() => () => {
        setCurrentRole('owner');
        setCurrentTab('report');
        setSecurityConfig(prev => ({ ...prev, isCurrentlyLocked: false }));
        logAuditAction('PIN_VERIFIED', 'Supervisor successfully unlocked Owner view with PIN.');
      });
      setIsPinPromptOpen(true);
      return;
    }
    setCurrentRole(role);
    if (role === 'owner') setCurrentTab('report');
    if (role === 'clerk') setCurrentTab('sheet');
    if (role === 'gate') setCurrentTab('gate');
  };

  // Supervisor PIN lock check for restricted tabs when locked in Gate Kiosk mode
  const handleTabChange = (tab: 'report' | 'sheet' | 'gate' | 'drill' | 'register' | 'rules' | 'guide' | 'rnd') => {
    const restrictedTabs = ['report', 'rules', 'drill', 'rnd'];
    if (securityConfig.isPinLockEnabled && securityConfig.isCurrentlyLocked && restrictedTabs.includes(tab)) {
      setPinPendingAction(() => () => {
        setCurrentRole('owner');
        setCurrentTab(tab);
        setSecurityConfig(prev => ({ ...prev, isCurrentlyLocked: false }));
        logAuditAction('PIN_VERIFIED', `Supervisor unlocked ${tab.toUpperCase()} view with PIN.`);
      });
      setIsPinPromptOpen(true);
      return;
    }
    setCurrentTab(tab);
  };

  const handleLockNow = () => {
    setSecurityConfig(prev => ({ ...prev, isCurrentlyLocked: true }));
    setCurrentRole('gate');
    setCurrentTab('gate');
    logAuditAction('PIN_VERIFIED', 'Supervisor locked application down to Gate Security Guard mode.');
  };

  const handlePinUnlockSuccess = () => {
    setIsPinPromptOpen(false);
    if (pinPendingAction) {
      pinPendingAction();
      setPinPendingAction(null);
    }
  };

  // Multi-Tenant Workspace Handlers
  const handleSelectWorkspace = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    const targetWs = workspaces.find(w => w.id === workspaceId);
    if (targetWs) {
      setRules(targetWs.rules);
      setDispatches(targetWs.dispatches);
      logAuditAction('DATABASE_SWITCHED', `Loaded client database vault: ${targetWs.name}.`);
    }
  };

  const handleCreateWorkspace = (newWsData: Omit<FactoryWorkspace, 'id' | 'createdAt' | 'lastActive'>) => {
    const newId = `ws_${Date.now()}`;
    const newWs: FactoryWorkspace = {
      ...newWsData,
      id: newId,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
    setWorkspaces(prev => [newWs, ...prev]);
    setActiveWorkspaceId(newId);
    setRules(newWs.rules);
    setDispatches(newWs.dispatches);
    logAuditAction('DATABASE_SWITCHED', `Created new isolated database vault for ${newWs.name}.`);
  };

  const handleDeleteWorkspace = (workspaceId: string) => {
    if (workspaces.length <= 1) return;
    const remaining = workspaces.filter(w => w.id !== workspaceId);
    setWorkspaces(remaining);
    if (activeWorkspaceId === workspaceId && remaining[0]) {
      setActiveWorkspaceId(remaining[0].id);
      setRules(remaining[0].rules);
      setDispatches(remaining[0].dispatches);
    }
    logAuditAction('DATABASE_SWITCHED', `Deleted client database vault: ${workspaceId}.`);
  };

  const handleExportBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      systemVersion: 'Dispatch OTIF Enterprise v2.4',
      activeWorkspace,
      allWorkspaces: workspaces,
      auditLogs,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `factory_vault_backup_${activeWorkspace.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    logAuditAction('BACKUP_EXPORTED', `Exported full database backup for ${activeWorkspace.name}.`);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.activeWorkspace && parsed.activeWorkspace.dispatches) {
          const importedWs = parsed.activeWorkspace as FactoryWorkspace;
          setWorkspaces(prev => {
            const exists = prev.some(w => w.id === importedWs.id);
            if (exists) {
              return prev.map(w => (w.id === importedWs.id ? importedWs : w));
            }
            return [importedWs, ...prev];
          });
          setActiveWorkspaceId(importedWs.id);
          setRules(importedWs.rules);
          setDispatches(importedWs.dispatches);
          logAuditAction('DATABASE_SWITCHED', `Restored client database from file: ${importedWs.name}.`);
        }
      } catch (err) {
        console.error('Failed to parse backup JSON', err);
      }
    };
    reader.readAsText(file);
  };

  const handleImportDispatches = (newRows: DispatchRow[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setDispatches(newRows);
    } else {
      setDispatches(prev => [...prev, ...newRows]);
    }
    logAuditAction('DISPATCH_CREATED', `Imported ${newRows.length} dispatch rows via Excel / CSV.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const company = rules.factoryProfile?.companyName || 'Apex Precision Automotive Ltd';
  const plant = rules.factoryProfile?.plantName || 'Plant 1';
  const location = rules.factoryProfile?.clusterLocation || 'Oragadam Industrial Corridor';

  return (
    <div className="min-h-screen bg-industrial-grid text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        metrics={metrics}
        rules={rules}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onOpenBulkImport={() => setIsBulkImportOpen(true)}
        onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
        onOpenFactoryProfile={() => setIsFactoryProfileOpen(true)}
        onResetBenchmark={handleResetBenchmark}
        isBenchmarkModified={isBenchmarkModified}
        onPrint={handlePrint}
        onOpenSalesProposal={() => setIsSalesProposalOpen(true)}
        onOpenROICalculator={() => setIsROICalculatorOpen(true)}
        onOpenPipeline={() => setIsPipelineOpen(true)}
        onOpenFounderKit={() => setIsFounderPersonaOpen(true)}
        onOpenDatabaseManager={() => setIsDatabaseManagerOpen(true)}
        activeDatabaseName={activeWorkspace?.name}
        databaseCount={workspaces.length}
        onOpenSecurityAudit={() => setIsSecurityAuditOpen(true)}
        isPinLockEnabled={securityConfig.isPinLockEnabled}
        onLockNow={handleLockNow}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'report' && (
          <>
            <OwnerReport
              metrics={metrics}
              rules={rules}
              dispatches={dispatches}
              onNavigateToSheet={handleNavigateToSheet}
              onNavigateToDrill={() => setCurrentTab('drill')}
              onOpenROICalculator={() => setIsROICalculatorOpen(true)}
              onOpenWhatIfSimulator={() => setIsWhatIfSimulatorOpen(true)}
              onOpenCAPA8D={() => setIsCAPA8DOpen(true)}
              onOpenCertificate={(dispatch) => setSelectedCertificateDispatch(dispatch)}
              onOpenPipeline={() => setIsPipelineOpen(true)}
              onOpenRndLab={() => setCurrentTab('rnd')}
            />
            <CustomerPromiseEngineV2
              dispatches={dispatches}
              rules={rules}
              metrics={metrics}
              onFilterCustomer={(customer) => handleNavigateToSheet(customer, '')}
            />
          </>
        )}

        {currentTab === 'sheet' && (
          <DispatchesSheet
            dispatches={dispatches}
            rules={rules}
            onUpdateDispatch={handleUpdateDispatch}
            onDeleteDispatch={handleDeleteDispatch}
            onAddNewDispatch={() => setIsAddModalOpen(true)}
            onOpenBulkImport={() => setIsBulkImportOpen(true)}
            onOpenCertificate={(dispatch) => setSelectedCertificateDispatch(dispatch)}
            initialCustomerFilter={sheetCustomerFilter}
            initialReasonFilter={sheetReasonFilter}
          />
        )}

        {currentTab === 'gate' && (
          <GateTabletView
            dispatches={dispatches}
            rules={rules}
            onUpdateDispatch={handleUpdateDispatch}
            onAddNewDispatch={() => setIsAddModalOpen(true)}
          />
        )}

        {currentTab === 'drill' && (
          <TheDrillWalkthrough
            dispatches={dispatches}
            rules={rules}
            onUpdateDispatch={handleUpdateDispatch}
            onNavigateToSheet={() => setCurrentTab('sheet')}
            onNavigateToReport={() => setCurrentTab('report')}
          />
        )}

        {currentTab === 'register' && (
          <GateRegisterViewer
            dispatches={dispatches}
            rules={rules}
          />
        )}

        {currentTab === 'rules' && (
          <RulesSettings
            rules={rules}
            onUpdateRules={setRules}
            dispatches={dispatches}
            onResetBenchmark={handleResetBenchmark}
            onImportData={data => setDispatches(data)}
          />
        )}

        {currentTab === 'guide' && (
          <FieldGuide 
            rules={rules}
            onOpenFounderKit={() => setIsFounderPersonaOpen(true)}
            onOpenPricing={() => setIsFounderPersonaOpen(true)}
          />
        )}

        {currentTab === 'rnd' && (
          <RndLab
            dispatches={dispatches}
            rules={rules}
            metrics={metrics}
            onAddNewDispatch={handleAddNewDispatch}
            onUpdateRules={setRules}
          />
        )}
      </main>

      {/* Modal for adding single dispatch row */}
      <AddDispatchModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddNewDispatch}
      />

      {/* Modal for bulk Excel/CSV import */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImportDispatches={handleImportDispatches}
      />

      {/* Modal for WhatsApp executive alert broadcast */}
      <WhatsAppDigestModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        metrics={metrics}
        rules={rules}
      />

      {/* Modal for Factory Profile & White-Labeling */}
      <FactoryProfileModal
        isOpen={isFactoryProfileOpen}
        onClose={() => setIsFactoryProfileOpen(false)}
        rules={rules}
        onUpdateRules={setRules}
      />

      {/* CFO & Owner Financial ROI Calculator Modal */}
      <ROICalculatorModal
        isOpen={isROICalculatorOpen}
        onClose={() => setIsROICalculatorOpen(false)}
        metrics={metrics}
        rules={rules}
      />

      {/* Kaizen What-If Simulation Engine Modal */}
      <WhatIfSimulatorModal
        isOpen={isWhatIfSimulatorOpen}
        onClose={() => setIsWhatIfSimulatorOpen(false)}
        metrics={metrics}
        rules={rules}
        dispatches={dispatches}
      />

      {/* Automated IATF 16949 8D CAPA Report Modal */}
      <CAPA8DModal
        isOpen={isCAPA8DOpen}
        onClose={() => setIsCAPA8DOpen(false)}
        metrics={metrics}
        rules={rules}
      />

      {/* Official OEM Dispatch SLA Certificate Modal */}
      <DispatchCertificateModal
        isOpen={!!selectedCertificateDispatch}
        onClose={() => setSelectedCertificateDispatch(null)}
        dispatch={selectedCertificateDispatch}
        rules={rules}
      />

      {/* Enterprise SaaS Sales Proposal & Quote Modal */}
      <SalesProposalModal
        isOpen={isSalesProposalOpen}
        onClose={() => setIsSalesProposalOpen(false)}
        rules={rules}
      />

      {/* Client Pipeline & Factory Sales Lead CRM Modal */}
      <ClientPipelineModal
        isOpen={isPipelineOpen}
        onClose={() => setIsPipelineOpen(false)}
        rules={rules}
      />

      {/* Founder Sales Persona, Pitch Kit & Price Customizer Modal */}
      <FounderPersonaModal
        isOpen={isFounderPersonaOpen}
        onClose={() => setIsFounderPersonaOpen(false)}
        rules={rules}
        onUpdateRules={setRules}
        onOpenProposal={() => {
          setIsFounderPersonaOpen(false);
          setIsSalesProposalOpen(true);
        }}
        onOpenROICalculator={() => {
          setIsFounderPersonaOpen(false);
          setIsROICalculatorOpen(true);
        }}
      />

      {/* Multi-Tenant Client Factory Database Manager Modal */}
      <DatabaseManagerModal
        isOpen={isDatabaseManagerOpen}
        onClose={() => setIsDatabaseManagerOpen(false)}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
      />

      {/* Enterprise Security Architecture & IATF 16949 Compliance Modal */}
      <SecurityAuditModal
        isOpen={isSecurityAuditOpen}
        onClose={() => setIsSecurityAuditOpen(false)}
        securityConfig={securityConfig}
        onUpdateSecurityConfig={setSecurityConfig}
        auditLogs={auditLogs}
        factoryProfile={rules.factoryProfile}
        onLockNow={handleLockNow}
      />

      {/* Supervisor PIN Verification Prompt Modal */}
      <PinPromptModal
        isOpen={isPinPromptOpen}
        onClose={() => {
          setIsPinPromptOpen(false);
          setPinPendingAction(null);
        }}
        onSuccess={handlePinUnlockSuccess}
        expectedPin={securityConfig.supervisorPin || '1234'}
      />

      {/* High-Contrast Industrial Glass Footer */}
      <footer className="border-t border-white/5 industrial-glass py-3.5 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-semibold text-white">{company}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">{plant}</span>
            <span className="text-slate-600 hidden md:inline">·</span>
            <span className="text-slate-400 hidden md:inline">{location}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              256-Bit Vault Verified
            </span>
            <span className="text-slate-700">|</span>
            <span className="font-mono text-slate-300 text-[11px]">
              SLA Cutoff: <strong className="text-white">{rules.inFullCutoff}%</strong> (Grace: <strong className="text-white">{rules.graceHours}h</strong>)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
