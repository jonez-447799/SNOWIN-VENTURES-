/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Truck,
  Package,
  Scale,
  ScanBarcode,
  Radio,
  Sparkles,
  Wand2,
  RefreshCw,
  Lock,
  Unlock,
  Briefcase,
  Building2,
  Plus,
  Gauge,
  Menu,
  X,
  Smartphone,
  CalendarClock,
  Home
} from 'lucide-react';
import Project1App from './project1/Project1App';
import Project2App from './project2/Project2App';
import Project3App from './project3/Project3App';
import Project4App from './project4/Project4App';
import Project5App from './project5/Project5App';
import { MergedCommandCenter } from './MergedCommandCenter';
import { CustomBundleCombinator } from './components/CustomBundleCombinator';
import { SmartTallyMapperModal, TargetEngineType } from './components/SmartTallyMapperModal';
import { MultiDeviceSyncModal, SYNC_KEYS } from './components/MultiDeviceSyncModal';
import { MasterExecutiveDashboard } from './components/MasterExecutiveDashboard';
import { CommercialLandingPage } from './commercial/CommercialLandingPage';
import { FactoryAuditPage } from './commercial/FactoryAuditPage';
import { SampleAuditPage } from './commercial/SampleAuditPage';
import { AdToDemoFunnelModal } from './commercial/AdToDemoFunnelModal';
import { FounderLeadInbox } from './commercial/FounderLeadInbox';
import { AgentWorkforceDashboard } from './commercial/AgentWorkforceDashboard';
import { PilotFindingsWalkthroughView } from './commercial/PilotFindingsWalkthroughView';
import { ApprovedPilotUploadView } from './commercial/ApprovedPilotUploadView';
import { AppShell } from './dashboard/AppShell';
import { PlatformNavId } from './dashboard/dashboardConfig';
import { usePlant, PlantId, PeriodId } from './context/PlantContext';

type ArchitectureVersion =
  | 'commercial_home'
  | 'factory_audit'
  | 'sample_audit'
  | 'ad_funnel'
  | 'lead_inbox'
  | 'agent_workforce'
  | 'pilot_findings'
  | 'pilot_upload'
  | 'ceo_master'
  | 'standalone_p1'
  | 'standalone_p2'
  | 'standalone_p3'
  | 'standalone_p4'
  | 'standalone_p5'
  | 'custom_combos'
  | 'merged_suite';

interface ClientWorkspaceSlot {
  id: string;
  name: string;
  snapshots: Record<string, string>;
}

const STORAGE_KEY_VERSION_MODE = 'industrial_architecture_version_mode_v6';
const STORAGE_KEY_CLIENTS = 'suite_client_workspaces_v1';
const STORAGE_KEY_ACTIVE_CLIENT = 'suite_active_client_id_v1';

function parseRequestedArchitecture(): ArchitectureVersion | null {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const explicitParam = (
      searchParams.get('project') ||
      searchParams.get('p') ||
      searchParams.get('engine') ||
      searchParams.get('view') ||
      searchParams.get('page')
    )?.toLowerCase();

    const pathnameLower = window.location.pathname.toLowerCase();
    // Check for /app, /platform, or /audit in pathname
    if (
      pathnameLower === '/app' ||
      pathnameLower.endsWith('/app') ||
      pathnameLower.includes('/platform')
    ) {
      return 'ceo_master';
    }
    if (pathnameLower === '/audit' || pathnameLower.endsWith('/audit')) {
      return 'sample_audit';
    }

    if (explicitParam) {
      if (
        explicitParam === 'sample-audit' ||
        explicitParam === 'sample_audit' ||
        explicitParam === 'sample-report' ||
        explicitParam === 'sample_report'
      ) {
        return 'sample_audit';
      }
      if (
        explicitParam === 'pilot-upload' ||
        explicitParam === 'pilot_upload' ||
        explicitParam === 'step2-upload' ||
        explicitParam === 'upload'
      ) {
        return 'pilot_upload';
      }
      if (
        explicitParam === 'pilot-findings' ||
        explicitParam === 'pilot_findings' ||
        explicitParam === 'pilot-walkthrough' ||
        explicitParam === 'pilot_walkthrough' ||
        explicitParam === 'walkthrough' ||
        explicitParam === 'findings'
      ) {
        return 'pilot_findings';
      }
      if (
        explicitParam === 'agent-workforce' ||
        explicitParam === 'agent_workforce' ||
        explicitParam === 'agents' ||
        explicitParam === 'workforce' ||
        explicitParam === 'paperclip'
      ) {
        return 'agent_workforce';
      }
      if (
        explicitParam === 'lead-inbox' ||
        explicitParam === 'lead_inbox' ||
        explicitParam === 'leads' ||
        explicitParam === 'inbox'
      ) {
        return 'lead_inbox';
      }
      if (explicitParam === 'home' || explicitParam === 'landing' || explicitParam === 'commercial' || explicitParam === 'commercial_home') {
        return 'commercial_home';
      }
      if (explicitParam === 'platform' || explicitParam === 'app' || explicitParam === 'dashboard') {
        return 'ceo_master';
      }
      if (explicitParam === 'audit' || explicitParam === 'factory_audit' || explicitParam === 'free_audit') {
        return 'factory_audit';
      }
      if (explicitParam === 'funnel' || explicitParam === 'ad_funnel') {
        return 'ad_funnel';
      }
      if (explicitParam === 'p1' || explicitParam === 'cash' || explicitParam === 'inventory' || explicitParam === 'standalone_p1') {
        return 'standalone_p1';
      }
      if (explicitParam === 'p2' || explicitParam === 'otif' || explicitParam === 'dispatch' || explicitParam === 'standalone_p2') {
        return 'standalone_p2';
      }
      if (explicitParam === 'p3' || explicitParam === 'freight' || explicitParam === 'profit' || explicitParam === 'standalone_p3') {
        return 'standalone_p3';
      }
      if (explicitParam === 'p4' || explicitParam === 'binaudit' || explicitParam === 'warehouse' || explicitParam === 'standalone_p4') {
        return 'standalone_p4';
      }
      if (explicitParam === 'p5' || explicitParam === 'tower' || explicitParam === 'controltower' || explicitParam === 'standalone_p5') {
        return 'standalone_p5';
      }
      if (explicitParam === 'ceo' || explicitParam === 'master' || explicitParam === 'ceo_master') {
        return 'ceo_master';
      }
      if (explicitParam === 'suite' || explicitParam === 'merged' || explicitParam === 'merged_suite') {
        return 'merged_suite';
      }
      if (explicitParam === 'combos' || explicitParam === 'custom_combos') {
        return 'custom_combos';
      }
    }
  } catch {}
  return null;
}

export default function App() {
  const {
    activePlantId,
    setActivePlantId,
    activePlant,
    activePeriodId,
    setActivePeriodId,
    activePeriod,
    allPlants,
    allPeriods,
  } = usePlant();

  const [versionMode, setVersionMode] = useState<ArchitectureVersion>(() => {
    const fromUrl = parseRequestedArchitecture();
    if (fromUrl) return fromUrl;
    // Default to Commercial Landing Page for first-time visitors
    return 'commercial_home';
  });

  // Commercial Rebranding Mode (P1-P5 Codes vs Manufacturing Control Tower Commercial Names)
  const [useCommercialNames, setUseCommercialNames] = useState<boolean>(() => {
    return localStorage.getItem('suite_commercial_names_v1') === 'true';
  });

  // Client Presentation Lock (Hides top multi-project switcher bar during live client screen-share)
  const [isClientLocked, setIsClientLocked] = useState<boolean>(false);

  // Multi-Client Workspace Switcher (Prevents overwriting Client A when auditing Client B)
  const [clientSlots, setClientSlots] = useState<ClientWorkspaceSlot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLIENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { id: 'client-ambattur', name: 'Ambattur Baseline Unit', snapshots: {} },
    ];
  });

  const [activeClientId, setActiveClientId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_CLIENT) || 'client-ambattur';
  });

  // Universal Modals (Dirty Tally Mapper & Multi-Device Sync Hub)
  const [showSmartMapper, setShowSmartMapper] = useState<boolean>(false);
  const [mapperDefaultEngine, setMapperDefaultEngine] = useState<TargetEngineType>('p1');
  const [showDeviceSync, setShowDeviceSync] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [syncRefreshKey, setSyncRefreshKey] = useState<number>(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VERSION_MODE, versionMode);
    } catch {}
  }, [versionMode]);

  useEffect(() => {
    try {
      localStorage.setItem('suite_commercial_names_v1', String(useCommercialNames));
    } catch {}
  }, [useCommercialNames]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clientSlots));
      localStorage.setItem(STORAGE_KEY_ACTIVE_CLIENT, activeClientId);
    } catch {}
  }, [clientSlots, activeClientId]);

  // Listen for URL navigation changes only (automatic #client_sync URL state injection removed for security)
  useEffect(() => {
    const handleUrlNavigation = () => {
      const requested = parseRequestedArchitecture();
      if (requested) {
        setVersionMode(requested);
      }
    };
    window.addEventListener('hashchange', handleUrlNavigation);
    window.addEventListener('popstate', handleUrlNavigation);
    return () => {
      window.removeEventListener('hashchange', handleUrlNavigation);
      window.removeEventListener('popstate', handleUrlNavigation);
    };
  }, []);

  // Listen for cross-tab BroadcastChannel & storage updates so Gate Tablet (P2) & Store Count Sheet (P4) sync live
  useEffect(() => {
    const handleStorage = () => setSyncRefreshKey((k) => k + 1);
    window.addEventListener('storage', handleStorage);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('factory_suite_live_sync');
      bc.onmessage = () => setSyncRefreshKey((k) => k + 1);
    } catch {}

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
    };
  }, []);

  const captureCurrentSnapshots = (): Record<string, string> => {
    const snap: Record<string, string> = {};
    SYNC_KEYS.forEach((k) => {
      const val = localStorage.getItem(k);
      if (val !== null) snap[k] = val;
    });
    return snap;
  };

  const handleSwitchClientSlot = (nextClientId: string) => {
    if (nextClientId === activeClientId) return;
    const outgoingSnap = captureCurrentSnapshots();
    const updatedSlots = clientSlots.map((slot) =>
      slot.id === activeClientId ? { ...slot, snapshots: outgoingSnap } : slot
    );
    const targetSlot = updatedSlots.find((s) => s.id === nextClientId);

    // Clear active keys and restore target client's snapshot (or clean baseline defaults)
    SYNC_KEYS.forEach((k) => localStorage.removeItem(k));
    if (targetSlot && targetSlot.snapshots) {
      Object.entries(targetSlot.snapshots).forEach(([k, val]) => {
        localStorage.setItem(k, String(val));
      });
    }

    setClientSlots(updatedSlots);
    setActiveClientId(nextClientId);
    setSyncRefreshKey((k) => k + 1);
    window.dispatchEvent(new Event('storage'));
  };

  const handleAddNewClientSlot = () => {
    const name = window.prompt('Enter new Factory / Client Workspace name (e.g., "Sri Murugan Auto Parts - Hosur"):');
    if (!name || !name.trim()) return;
    const outgoingSnap = captureCurrentSnapshots();
    const newId = `client-${Date.now()}`;
    const newSlot: ClientWorkspaceSlot = {
      id: newId,
      name: name.trim(),
      snapshots: {},
    };
    const updated = [
      ...clientSlots.map((s) => (s.id === activeClientId ? { ...s, snapshots: outgoingSnap } : s)),
      newSlot,
    ];
    SYNC_KEYS.forEach((k) => localStorage.removeItem(k));
    setClientSlots(updated);
    setActiveClientId(newId);
    setSyncRefreshKey((k) => k + 1);
    window.dispatchEvent(new Event('storage'));
  };

  const openMapperForEngine = (eng?: TargetEngineType) => {
    if (eng) {
      setMapperDefaultEngine(eng);
    } else if (versionMode === 'standalone_p1') {
      setMapperDefaultEngine('p1');
    } else if (versionMode === 'standalone_p2') {
      setMapperDefaultEngine('p2');
    } else if (versionMode === 'standalone_p3') {
      setMapperDefaultEngine('p3');
    } else if (versionMode === 'standalone_p4') {
      setMapperDefaultEngine('p4');
    } else if (versionMode === 'standalone_p5') {
      setMapperDefaultEngine('p5');
    } else {
      setMapperDefaultEngine('p1');
    }
    setShowSmartMapper(true);
  };

  if (versionMode === 'pilot_upload') {
    const searchParams =
      typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const leadIdParam = searchParams?.get('leadId') || searchParams?.get('id') || undefined;
    const tokenParam = searchParams?.get('token') || undefined;
    const isDemoMode = searchParams?.get('demo') === 'true' || !leadIdParam;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <ApprovedPilotUploadView
          leadIdParam={leadIdParam}
          tokenParam={tokenParam}
          isDemoMode={isDemoMode}
          onBackToHome={() => {
            setVersionMode('commercial_home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenLeadInbox={() => {
            setVersionMode('lead_inbox');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenWalkthrough={(workspaceId, shareToken) => {
            try {
              window.history.pushState(
                {},
                '',
                `?view=pilot-findings&id=${encodeURIComponent(
                  workspaceId
                )}&token=${encodeURIComponent(shareToken)}`
              );
            } catch {}
            setVersionMode('pilot_findings');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  if (versionMode === 'pilot_findings') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <PilotFindingsWalkthroughView
          onBackToHome={() => {
            setVersionMode('commercial_home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenPlatform={() => {
            setVersionMode('ceo_master');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  if (versionMode === 'agent_workforce') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <AgentWorkforceDashboard
          onBackToHome={() => {
            setVersionMode('commercial_home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenLeadInbox={() => {
            try {
              window.history.pushState({}, '', '?view=lead-inbox');
            } catch {}
            setVersionMode('lead_inbox');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenPlatform={() => {
            setVersionMode('ceo_master');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenWalkthrough={(workspaceId, shareToken) => {
            try {
              window.history.pushState(
                {},
                '',
                `?view=pilot-findings&id=${encodeURIComponent(
                  workspaceId
                )}&token=${encodeURIComponent(shareToken)}&paywall=teaser`
              );
            } catch {}
            setVersionMode('pilot_findings');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  if (versionMode === 'lead_inbox') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <FounderLeadInbox
          onBackToHome={() => {
            setVersionMode('commercial_home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenPlatform={() => {
            setVersionMode('ceo_master');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAgentWorkforce={() => {
            try {
              window.history.pushState({}, '', '?view=agent-workforce');
            } catch {}
            setVersionMode('agent_workforce');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenWalkthrough={(workspaceId, shareToken) => {
            try {
              window.history.pushState(
                {},
                '',
                `?view=pilot-findings&id=${encodeURIComponent(
                  workspaceId
                )}&token=${encodeURIComponent(shareToken)}`
              );
            } catch {}
            setVersionMode('pilot_findings');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenUploadPortal={(leadId, uploadToken) => {
            try {
              window.history.pushState(
                {},
                '',
                `?view=pilot-upload&leadId=${encodeURIComponent(
                  leadId
                )}${uploadToken ? `&token=${encodeURIComponent(uploadToken)}` : ''}`
              );
            } catch {}
            setVersionMode('pilot_upload');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  if (versionMode === 'sample_audit') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <SampleAuditPage
          onBackToHome={() => {
            try {
              window.history.pushState({}, '', '/');
            } catch {}
            setVersionMode('commercial_home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenPlatform={() => {
            setVersionMode('ceo_master');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenLeadInbox={() => {
            setVersionMode('lead_inbox');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  if (versionMode === 'commercial_home') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500/20 selection:text-amber-200">
        <CommercialLandingPage
          onLaunchEngine={(eng) => {
            setVersionMode(eng);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenSmartMapper={() => openMapperForEngine()}
          onOpenAuditPage={() => {
            setVersionMode('factory_audit');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenSampleAuditPage={() => {
            try {
              window.history.pushState({}, '', '?view=sample-audit');
            } catch {}
            setVersionMode('sample_audit');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenLeadInbox={() => {
            setVersionMode('lead_inbox');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Universal Dirty Tally / Excel Smart Column-Mapper Modal */}
        <SmartTallyMapperModal
          isOpen={showSmartMapper}
          onClose={() => setShowSmartMapper(false)}
          defaultEngine={mapperDefaultEngine}
          onImportSuccess={() => {
            setSyncRefreshKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  if (versionMode === 'factory_audit') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-300">
        <FactoryAuditPage
          onBackToHome={() => {
            setVersionMode('commercial_home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onLaunchLiveDemo={(eng) => {
            setVersionMode((eng as any) || 'ceo_master');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenSmartMapper={() => openMapperForEngine()}
          onOpenLeadInbox={() => {
            setVersionMode('lead_inbox');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Universal Dirty Tally / Excel Smart Column-Mapper Modal */}
        <SmartTallyMapperModal
          isOpen={showSmartMapper}
          onClose={() => setShowSmartMapper(false)}
          defaultEngine={mapperDefaultEngine}
          onImportSuccess={() => {
            setSyncRefreshKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  if (versionMode === 'ad_funnel') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <CommercialLandingPage
          onLaunchEngine={(eng) => {
            setVersionMode(eng);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenSmartMapper={() => openMapperForEngine()}
          onOpenAuditPage={() => {
            setVersionMode('factory_audit');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenLeadInbox={() => {
            setVersionMode('lead_inbox');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        <AdToDemoFunnelModal
          isOpen={true}
          onClose={() => setVersionMode('commercial_home')}
          onOpenAuditPage={() => setVersionMode('factory_audit')}
          onLaunchLiveDemo={(eng) => setVersionMode((eng as any) || 'ceo_master')}
        />
      </div>
    );
  }

  const initialPlatformTab: PlatformNavId =
    versionMode === 'standalone_p1'
      ? 'inventory'
      : versionMode === 'standalone_p2'
      ? 'delivery'
      : versionMode === 'standalone_p3'
      ? 'profit_risk'
      : versionMode === 'standalone_p4'
      ? 'warehouse'
      : versionMode === 'standalone_p5' ||
        versionMode === 'merged_suite' ||
        versionMode === 'custom_combos'
      ? 'executive_reports'
      : 'overview';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <AppShell
        initialTab={initialPlatformTab}
        activePlant={activePlant}
        activePeriod={activePeriod}
        allPlants={allPlants}
        allPeriods={allPeriods}
        onSelectPlant={(id) => setActivePlantId(id)}
        onSelectPeriod={(id) => setActivePeriodId(id)}
        onOpenPublicHome={() => {
          try {
            window.history.pushState({}, '', '/');
          } catch {}
          setVersionMode('commercial_home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenFactoryAudit={() => {
          setVersionMode('factory_audit');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenLeadInbox={() => {
          setVersionMode('lead_inbox');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSmartMapper={(eng) => openMapperForEngine(eng)}
        onOpenDeviceSync={() => setShowDeviceSync(true)}
        isClientLocked={isClientLocked}
        onToggleClientLock={() => setIsClientLocked((v) => !v)}
        clientSlots={clientSlots}
        activeClientId={activeClientId}
        onSwitchClientSlot={handleSwitchClientSlot}
        onAddNewClientSlot={handleAddNewClientSlot}
        syncRefreshKey={syncRefreshKey}
      />

      {/* Universal Dirty Tally / Excel Smart Column-Mapper Modal */}
      <SmartTallyMapperModal
        isOpen={showSmartMapper}
        onClose={() => setShowSmartMapper(false)}
        defaultEngine={mapperDefaultEngine}
        onImportSuccess={() => {
          setSyncRefreshKey((k) => k + 1);
        }}
      />

      {/* Multi-Device Field-to-Owner Sync Modal */}
      <MultiDeviceSyncModal
        isOpen={showDeviceSync}
        onClose={() => setShowDeviceSync(false)}
        onSyncImported={() => {
          setSyncRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}
