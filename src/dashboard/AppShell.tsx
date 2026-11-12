/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Gauge,
  Package,
  Truck,
  Scale,
  ScanBarcode,
  FileText,
  Database,
  CheckSquare,
  Shield,
  BookOpen,
  HelpCircle,
  Home,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
  CalendarClock,
  Bell,
  Search,
  Upload,
  Menu,
  X,
  UserCheck,
  Unlock,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import {
  PlatformNavId,
  RoleViewMode,
  PLATFORM_NAVIGATION,
  DEMO_ENVIRONMENT_CONFIG,
  buildLivePlatformSnapshot,
} from './dashboardConfig';
import { EnvironmentBadge } from './components/SharedDashboardPrimitives';
import { MetricExplanationDrawer } from './components/MetricExplanationDrawer';
import { OnboardingModal } from './components/OnboardingModal';
import { ExecutiveOverviewView } from './views/ExecutiveOverviewView';
import {
  InventoryDomainView,
  DeliveryDomainView,
  ProfitRiskDomainView,
  WarehouseDomainView,
} from './views/DomainViews';
import {
  ExecutiveReportsView,
  ActionsView,
  DataImportsView,
  AdministrationView,
} from './views/ExecutiveReportsAndActionsViews';
import { GateTabletView } from '../project2/components/GateTabletView';
import { INITIAL_RULES as P2_DEFAULT_RULES } from '../project2/data/initialData';
import { PlantId, PeriodId, PlantConfig, PeriodConfig } from '../context/PlantContext';
import { TargetEngineType } from '../components/SmartTallyMapperModal';
import { trackEvent } from '../utils/analytics';
import {
  writePlantDatasetToBrowser,
  clearPlantDatasetInBrowser,
} from '../data/multiPlantBaselines';
import { PlatformTopBar } from '../commercial/PlatformTopBar';
import { FactoryAuditModal } from '../commercial/FactoryAuditModal';

interface AppShellProps {
  initialTab: PlatformNavId;
  activePlant: PlantConfig;
  activePeriod: PeriodConfig;
  allPlants: PlantConfig[];
  allPeriods: PeriodConfig[];
  onSelectPlant: (id: PlantId) => void;
  onSelectPeriod: (id: PeriodId) => void;
  onOpenPublicHome: () => void;
  onOpenFactoryAudit: () => void;
  onOpenLeadInbox?: () => void;
  onOpenSmartMapper: (engine?: TargetEngineType) => void;
  onOpenDeviceSync: () => void;
  isClientLocked: boolean;
  onToggleClientLock: () => void;
  clientSlots: { id: string; name: string }[];
  activeClientId: string;
  onSwitchClientSlot: (id: string) => void;
  onAddNewClientSlot: () => void;
  syncRefreshKey: number;
}

const NAV_ICONS: Record<PlatformNavId, React.ReactNode> = {
  overview: <Gauge className="w-4 h-4 shrink-0" />,
  inventory: <Package className="w-4 h-4 shrink-0" />,
  delivery: <Truck className="w-4 h-4 shrink-0" />,
  profit_risk: <Scale className="w-4 h-4 shrink-0" />,
  warehouse: <ScanBarcode className="w-4 h-4 shrink-0" />,
  executive_reports: <FileText className="w-4 h-4 shrink-0" />,
  data_imports: <Database className="w-4 h-4 shrink-0" />,
  actions: <CheckSquare className="w-4 h-4 shrink-0" />,
  administration: <Shield className="w-4 h-4 shrink-0" />,
};

const ONBOARDING_SEEN_KEY = 'operationalyst_onboarding_seen_v2';

export const AppShell: React.FC<AppShellProps> = ({
  initialTab,
  activePlant,
  activePeriod,
  allPlants,
  allPeriods,
  onSelectPlant,
  onSelectPeriod,
  onOpenPublicHome,
  onOpenFactoryAudit,
  onOpenLeadInbox,
  onOpenSmartMapper,
  onOpenDeviceSync,
  isClientLocked,
  onToggleClientLock,
  clientSlots,
  activeClientId,
  onSwitchClientSlot,
  onAddNewClientSlot,
  syncRefreshKey,
}) => {
  const [activeTab, setActiveTab] = useState<PlatformNavId>(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlTab = new URLSearchParams(window.location.search).get('tab') as PlatformNavId | null;
        if (urlTab && PLATFORM_NAVIGATION.some((n) => n.id === urlTab)) {
          return urlTab;
        }
      }
    } catch {}
    return initialTab;
  });
  const [roleView, setRoleView] = useState<RoleViewMode>('executive');
  const [hideOperatorTools, setHideOperatorTools] = useState<boolean>(true);
  const showOperatorTools = !hideOperatorTools;
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [showPilotAuditModal, setShowPilotAuditModal] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [activeMethodologyId, setActiveMethodologyId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [quickSearch, setQuickSearch] = useState<string>('');
  const [plantSyncTick, setPlantSyncTick] = useState<number>(0);
  const [serverSyncState, setServerSyncState] = useState<{
    synced: boolean;
    isCustomized: boolean;
    lastSyncedAt: string;
    resetting: boolean;
  }>({
    synced: true,
    isCustomized: false,
    lastSyncedAt: '',
    resetting: false,
  });

  // Sync when parent route changes initialTab (unless URL explicitly specifies ?tab=)
  useEffect(() => {
    try {
      const urlTab = new URLSearchParams(window.location.search).get('tab') as PlatformNavId | null;
      if (urlTab && PLATFORM_NAVIGATION.some((n) => n.id === urlTab)) {
        setActiveTab(urlTab);
        return;
      }
    } catch {}
    setActiveTab(initialTab);
  }, [initialTab]);

  // Track demonstration environment view once on mount
  useEffect(() => {
    trackEvent('demo_environment_viewed', { role: roleView });
  }, []);

  // Fetch active plant workspace from server on mount & plant change
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/plant-workspaces/${activePlant.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (cancelled || !payload?.ok || !payload.workspace) return;
        const ws = payload.workspace;
        writePlantDatasetToBrowser(activePlant.id, {
          p1Items: ws.p1Items,
          p1Rules: ws.p1Rules,
          p2Dispatches: ws.p2Dispatches,
          p2Rules: ws.p2Rules,
          p3Trips: ws.p3Trips,
          p3Rules: ws.p3Rules,
          p4Bins: ws.p4Bins,
          p4Rules: ws.p4Rules,
          capaItems: ws.capaItems,
        });
        setServerSyncState({
          synced: true,
          isCustomized: Boolean(ws.isCustomized),
          lastSyncedAt: ws.lastSyncedAt || new Date().toISOString(),
          resetting: false,
        });
        setPlantSyncTick((t) => t + 1);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activePlant.id, syncRefreshKey]);

  const handleResetPlantWorkspace = async () => {
    setIsResetting(true);
    setServerSyncState((prev) => ({ ...prev, resetting: true }));

    // Immediately reset local browser state so UI updates right away
    clearPlantDatasetInBrowser(activePlant.id);
    setPlantSyncTick((t) => t + 1);
    window.dispatchEvent(new Event('storage'));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    try {
      const res = await fetch(`/api/plant-workspaces/${activePlant.id}/reset`, {
        method: 'POST',
        signal: controller.signal,
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload?.workspace) {
          const ws = payload.workspace;
          writePlantDatasetToBrowser(activePlant.id, {
            p1Items: ws.p1Items,
            p1Rules: ws.p1Rules,
            p2Dispatches: ws.p2Dispatches,
            p2Rules: ws.p2Rules,
            p3Trips: ws.p3Trips,
            p3Rules: ws.p3Rules,
            p4Bins: ws.p4Bins,
            p4Rules: ws.p4Rules,
            capaItems: ws.capaItems,
          });
          setServerSyncState({
            synced: true,
            isCustomized: false,
            lastSyncedAt: ws.lastSyncedAt || new Date().toISOString(),
            resetting: false,
          });
        }
      }
    } catch {
      // Local browser state is already restored; ignore network or timeout errors
    } finally {
      clearTimeout(timeoutId);
      setIsResetting(false);
      setServerSyncState((prev) => ({
        ...prev,
        isCustomized: false,
        resetting: false,
      }));
      setPlantSyncTick((t) => t + 1);
      window.dispatchEvent(new Event('storage'));
    }
  };

  // Build live platform snapshot from P1-P5 engines
  const snapshot = useMemo(
    () => buildLivePlatformSnapshot(activePlant, activePeriod),
    [activePlant, activePeriod, syncRefreshKey, plantSyncTick]
  );

  // Local state for Gate Kiosk dispatch updates
  const [kioskDispatches, setKioskDispatches] = useState(snapshot.p2Dispatches);
  useEffect(() => {
    setKioskDispatches(snapshot.p2Dispatches);
  }, [snapshot.p2Dispatches]);

  const currentNavConfig =
    PLATFORM_NAVIGATION.find((n) => n.id === activeTab) || PLATFORM_NAVIGATION[0];

  const activeMethodology = activeMethodologyId
    ? snapshot.methodologies[activeMethodologyId] || snapshot.methodologies.delivery_otif
    : null;

  const handleNavigate = (tab: PlatformNavId) => {
    setActiveTab(tab);
    setMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleOperatorTools = () => {
    setHideOperatorTools((prevHide) => {
      const nextHide = !prevHide;
      if (nextHide) {
        if (roleView !== 'executive') {
          setRoleView('executive');
        }
        if (activeTab === 'administration') {
          setActiveTab('overview');
        }
      }
      return nextHide;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {!isClientLocked && (
        <PlatformTopBar
          selectedPlantId={activePlant.id}
          onSelectPlant={onSelectPlant}
          showOperatorTools={showOperatorTools}
          onToggleOperatorTools={handleToggleOperatorTools}
          onBackToWebsite={onOpenPublicHome}
          onRequestPilotAudit={() => setShowPilotAuditModal(true)}
        />
      )}
      <div className="flex-1 flex min-w-0">
      {/* =====================================================================
          DESKTOP LEFT NAVIGATION SIDEBAR
      ===================================================================== */}
      {!isClientLocked && (
        <aside
          aria-label="Primary Platform Navigation"
          className={`hidden md:flex flex-col justify-between bg-slate-900 border-r border-slate-800 shrink-0 transition-all duration-200 no-print ${
            sidebarCollapsed ? 'w-18' : 'w-68'
          }`}
        >
          <div className="p-3.5 space-y-4 overflow-y-auto">
            {/* Wordmark & Collapse Toggle */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-sky-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                      O
                    </div>
                    <span className="font-bold text-white text-sm tracking-tight truncate">
                      Operationalyst
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {DEMO_ENVIRONMENT_CONFIG.organizationName}
                  </div>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed((c) => !c)}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                aria-label={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Environment Badge & Factory Selector */}
            {!sidebarCollapsed && (
              <div className="space-y-2">
                <EnvironmentBadge compact />
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2">
                  <label
                    htmlFor="sidebar-plant-select"
                    className="block text-[10px] font-mono uppercase text-slate-400 mb-1"
                  >
                    Manufacturing Unit
                  </label>
                  <select
                    id="sidebar-plant-select"
                    value={activePlant.id}
                    onChange={(e) => onSelectPlant(e.target.value as PlantId)}
                    className="w-full bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
                  >
                    {allPlants.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Primary Navigation Items */}
            <nav className="space-y-1" aria-label="Operational Domains">
              {!sidebarCollapsed && (
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Core Intelligence
                </div>
              )}
              {PLATFORM_NAVIGATION.filter((i) => i.group !== 'bottom').map((item) => {
                const isActive = activeTab === item.id && roleView === 'executive';
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setRoleView('executive');
                      handleNavigate(item.id);
                    }}
                    title={
                      item.secondaryCode ? `${item.label} (${item.secondaryCode})` : item.label
                    }
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs transition cursor-pointer ${
                      isActive
                        ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {NAV_ICONS[item.id]}
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!sidebarCollapsed && item.secondaryCode && (
                      <span
                        className={`text-[10px] font-mono shrink-0 ${
                          isActive ? 'text-slate-900 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {item.secondaryCode.split('•')[0].trim()}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Navigation Items (Administration, Methodology, Help, Public Links, Profile) */}
          <div className="p-3.5 border-t border-slate-800 space-y-1.5 text-xs">
            {showOperatorTools && (
              <button
                onClick={() => {
                  setRoleView('executive');
                  handleNavigate('administration');
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition cursor-pointer ${
                  activeTab === 'administration'
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title="Administration & Governance"
              >
                <Shield className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Administration</span>}
              </button>
            )}

            <button
              onClick={() => {
                trackEvent('metric_methodology_opened', { metricId: 'delivery_otif' });
                setActiveMethodologyId('delivery_otif');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              title="Open Calculation Methodology Drawer"
            >
              <BookOpen className="w-4 h-4 shrink-0 text-sky-400" />
              {!sidebarCollapsed && <span>Methodology</span>}
            </button>

            <button
              onClick={() => setShowOnboarding(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              title="Open Orientation Guide"
            >
              <HelpCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              {!sidebarCollapsed && <span>Help &amp; Orientation</span>}
            </button>

            {!sidebarCollapsed && (
              <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                <button
                  onClick={onOpenPublicHome}
                  className="flex-1 px-2.5 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Home className="w-3 h-3" />
                  <span>Website</span>
                </button>
                <button
                  onClick={onOpenFactoryAudit}
                  className="flex-1 px-2.5 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-300 hover:text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Audit Page</span>
                </button>
              </div>
            )}

            {!sidebarCollapsed && (
              <div className="pt-2 flex items-center gap-2 px-2 text-[11px] text-slate-400">
                <UserCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">Operations Reviewer • Demo Session</span>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* =====================================================================
          MAIN APPLICATION COLUMN (TOP BAR + WORKSPACE)
      ===================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* COMPACT TOP BAR */}
        {!isClientLocked ? (
          <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 sticky top-0 z-40 no-print">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Left: Mobile Drawer Button + Current Page Title + Unit/Period Context */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMobileDrawerOpen((v) => !v)}
                  className="md:hidden p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 cursor-pointer"
                  aria-label="Toggle Navigation Drawer"
                >
                  {mobileDrawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">
                      {roleView === 'gate_kiosk'
                        ? 'Gate Kiosk (Vehicle Departure Stamp)'
                        : roleView === 'dispatch_desk'
                        ? 'Dispatch Desk Operations'
                        : currentNavConfig.label}
                    </span>
                    {currentNavConfig.secondaryCode && roleView === 'executive' && (
                      <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400">
                        ({currentNavConfig.secondaryCode})
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span>
                      {activePlant.name} • {activePeriod.label}
                    </span>
                    {showOperatorTools && (
                      <>
                        <span
                          data-testid="server-workspace-sync-badge"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-mono text-[10px]"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Workspace Baseline · {activePlant.name}</span>
                        </span>
                        <button
                          type="button"
                          data-testid="reset-plant-baseline-btn"
                          onClick={handleResetPlantWorkspace}
                          disabled={isResetting}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-[10px] cursor-pointer"
                          title={`Reset ${activePlant.name} back to its deterministic factory baseline`}
                        >
                          <RotateCcw className="w-2.5 h-2.5 text-sky-400" />
                          <span>
                            {isResetting ? 'Resetting...' : 'Reset Plant to Baseline'}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Role View Switcher + Quick Domain Jump + Issue Count + Primary Action */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Role-Based UI Preview Switcher (Reveals Shop-Floor Operator Views when showOperatorTools is toggled ON) */}
                {showOperatorTools && (
                  <div
                    className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5"
                    role="group"
                    aria-label="Preview interface as"
                    title="Role previews change the interface only. They do not provide security or authorization in this demonstration environment."
                  >
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 hidden lg:inline">
                      Preview interface as:
                    </span>
                    {(
                      [
                        { id: 'executive', label: 'Executive' },
                        { id: 'dispatch_desk', label: 'Dispatch Desk' },
                        { id: 'gate_kiosk', label: 'Gate Kiosk' },
                      ] as const
                    ).map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setRoleView(mode.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                          roleView === mode.id
                            ? 'bg-sky-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Global Search / Jump */}
                <div className="hidden xl:flex items-center relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={quickSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuickSearch(val);
                      const lower = val.toLowerCase();
                      if (lower.includes('otif') || lower.includes('gate')) {
                        handleNavigate('delivery');
                      } else if (lower.includes('dead') || lower.includes('sku')) {
                        handleNavigate('inventory');
                      } else if (lower.includes('freight') || lower.includes('carrier')) {
                        handleNavigate('profit_risk');
                      } else if (lower.includes('bin')) {
                        handleNavigate('warehouse');
                      }
                    }}
                    placeholder="Jump to domain (e.g. OTIF, SKU, Bin)..."
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500 w-52"
                  />
                </div>

                {/* Active Issues / Notifications Pill */}
                <button
                  onClick={() => {
                    setRoleView('executive');
                    handleNavigate('actions');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-200 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  title="3 Critical Areas Require Attention"
                >
                  <Bell className="w-3.5 h-3.5 text-rose-400" />
                  <span>3 Critical</span>
                </button>

                {/* Contextual Primary Action */}
                <button
                  onClick={() => {
                    trackEvent('import_started', { source: 'topbar' });
                    onOpenSmartMapper();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Import Data</span>
                </button>
              </div>
            </div>

            {/* MOBILE NAVIGATION DRAWER */}
            {mobileDrawerOpen && (
              <div className="md:hidden mt-3 pt-3 border-t border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  {PLATFORM_NAVIGATION.filter(
                    (item) => showOperatorTools || item.id !== 'administration'
                  ).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setRoleView('executive');
                        handleNavigate(item.id);
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                        activeTab === item.id
                          ? 'bg-sky-500 text-slate-950 font-bold'
                          : 'bg-slate-950 text-slate-200 border border-slate-800'
                      }`}
                    >
                      {NAV_ICONS[item.id]}
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
                  <button
                    onClick={onOpenPublicHome}
                    className="px-3 py-1.5 rounded bg-slate-950 text-slate-300 border border-slate-800"
                  >
                    Public Homepage
                  </button>
                  <button
                    onClick={onOpenFactoryAudit}
                    className="px-3 py-1.5 rounded bg-slate-950 text-emerald-300 border border-slate-800"
                  >
                    Factory Audit Page
                  </button>
                </div>
              </div>
            )}
          </header>
        ) : (
          <button
            onClick={onToggleClientLock}
            className="fixed bottom-4 left-4 z-50 no-print px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-sky-500 text-slate-300 hover:text-slate-950 border border-slate-700 shadow-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Exit Client Presentation Lock</span>
          </button>
        )}

        {/* MAIN CONTENT CONTAINER (Max-width 1600px, generous padding) */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6">
          {!snapshot.datasetLoaded && (
            <div
              role="alert"
              className="mb-6 bg-amber-950/70 border border-amber-500/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-amber-100"
            >
              <div>
                <div className="font-bold text-amber-300 text-sm mb-1">
                  No dataset loaded for this plant in the demonstration environment
                </div>
                <p className="text-amber-200/90 leading-relaxed">
                  <strong>{activePlant.name}</strong> does not have a separate underlying SKU, dispatch, carrier, or bin dataset loaded. Figures shown below remain unscaled records from <strong>Ambattur Baseline Unit</strong> (no synthetic plant multipliers are applied).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onSelectPlant('ambattur')}
                  className="px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold cursor-pointer"
                >
                  Switch to Ambattur Baseline Unit
                </button>
                <button
                  onClick={() => handleNavigate('data_imports')}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-200 font-semibold cursor-pointer"
                >
                  Import Local Plant Dataset
                </button>
              </div>
            </div>
          )}
          {roleView === 'gate_kiosk' ? (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-white">
                    Gate Guard Touch Kiosk Mode — {activePlant.name}
                  </span>
                  <span className="text-slate-400 ml-2">
                    Simplified interface for security gate personnel to stamp vehicle departures without executive analytics clutter.
                  </span>
                </div>
                <button
                  onClick={() => setRoleView('executive')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold cursor-pointer"
                >
                  Return to Executive View
                </button>
              </div>
              <GateTabletView
                dispatches={kioskDispatches}
                rules={P2_DEFAULT_RULES}
                onUpdateDispatch={(id, updates) => {
                  setKioskDispatches((prev) =>
                    prev.map((row) => (row.id === id ? { ...row, ...updates } : row))
                  );
                }}
                onAddNewDispatch={() => {}}
              />
            </div>
          ) : roleView === 'dispatch_desk' ? (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-white">
                    Dispatch Desk Operational View — {activePlant.name}
                  </span>
                  <span className="text-slate-400 ml-2">
                    Focused on Dual-Gate OTIF exceptions, late departures, and short-shipment verification.
                  </span>
                </div>
                <button
                  onClick={() => setRoleView('executive')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold cursor-pointer"
                >
                  Return to Executive View
                </button>
              </div>
              <DeliveryDomainView
                snapshot={snapshot}
                onNavigateDomain={handleNavigate}
                onOpenMethodology={(mId) => setActiveMethodologyId(mId)}
              />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <ExecutiveOverviewView
                  snapshot={snapshot}
                  allPlants={allPlants}
                  allPeriods={allPeriods}
                  onSelectPlant={onSelectPlant}
                  onSelectPeriod={onSelectPeriod}
                  onNavigateDomain={handleNavigate}
                  onOpenMethodology={(mId) => setActiveMethodologyId(mId)}
                  onOpenOnboarding={() => setShowOnboarding(true)}
                />
              )}
              {activeTab === 'inventory' && (
                <InventoryDomainView
                  snapshot={snapshot}
                  onNavigateDomain={handleNavigate}
                  onOpenMethodology={(mId) => setActiveMethodologyId(mId)}
                  onOpenPilotAuditModal={() => setShowPilotAuditModal(true)}
                />
              )}
              {activeTab === 'delivery' && (
                <DeliveryDomainView
                  snapshot={snapshot}
                  onNavigateDomain={handleNavigate}
                  onOpenMethodology={(mId) => setActiveMethodologyId(mId)}
                />
              )}
              {activeTab === 'profit_risk' && (
                <ProfitRiskDomainView
                  snapshot={snapshot}
                  onNavigateDomain={handleNavigate}
                  onOpenMethodology={(mId) => setActiveMethodologyId(mId)}
                />
              )}
              {activeTab === 'warehouse' && (
                <WarehouseDomainView
                  snapshot={snapshot}
                  onNavigateDomain={handleNavigate}
                  onOpenMethodology={(mId) => setActiveMethodologyId(mId)}
                />
              )}
              {activeTab === 'executive_reports' && (
                <ExecutiveReportsView
                  snapshot={snapshot}
                  onNavigateDomain={handleNavigate}
                />
              )}
              {activeTab === 'actions' && (
                <ActionsView
                  snapshot={snapshot}
                  onNavigateDomain={handleNavigate}
                />
              )}
              {activeTab === 'data_imports' && (
                <DataImportsView
                  snapshot={snapshot}
                  onOpenSmartMapper={(eng) => onOpenSmartMapper(eng)}
                />
              )}
              {activeTab === 'administration' && (
                <AdministrationView
                  isClientLocked={isClientLocked}
                  onToggleClientLock={onToggleClientLock}
                  onOpenDeviceSync={onOpenDeviceSync}
                  onOpenLeadInbox={onOpenLeadInbox}
                  clientSlots={clientSlots}
                  activeClientId={activeClientId}
                  onSwitchClientSlot={onSwitchClientSlot}
                  onAddNewClientSlot={onAddNewClientSlot}
                />
              )}
            </>
          )}
        </main>
      </div>
      </div>

      {/* Contextual Right-Side Calculation & Methodology Drawer */}
      <MetricExplanationDrawer
        methodology={activeMethodology}
        onClose={() => setActiveMethodologyId(null)}
        onNavigateDomain={handleNavigate}
      />

      {/* Restrained, Skippable, Reopenable Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          try {
            localStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
          } catch {}
        }}
        onOpenDataImports={() => handleNavigate('data_imports')}
      />

      {/* Direct In-Platform Pilot Audit Modal */}
      <FactoryAuditModal
        isOpen={showPilotAuditModal}
        onClose={() => setShowPilotAuditModal(false)}
        sourceView="platform_topbar"
        onOpenSmartMapper={() => {
          setShowPilotAuditModal(false);
          onOpenSmartMapper();
        }}
      />
    </div>
  );
};
