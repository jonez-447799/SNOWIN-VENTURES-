import React, { useState, useRef, useEffect } from 'react';
import { 
  Truck, 
  RotateCcw, 
  FileText, 
  Table, 
  Target, 
  BookOpen, 
  Sliders, 
  ShieldCheck, 
  Printer, 
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  MessageSquare,
  UserCheck,
  ChevronDown,
  Sparkles,
  Database,
  Lock,
  User,
  ClipboardList,
  Shield,
  Briefcase,
  Layers,
  CheckCircle2,
  FlaskConical
} from 'lucide-react';
import { OTIFMetrics, RulesConfig, UserRole } from '../types/otif';
import { usePlant } from '../../context/PlantContext';

interface HeaderProps {
  currentTab: 'report' | 'sheet' | 'gate' | 'drill' | 'register' | 'rules' | 'guide' | 'rnd';
  setCurrentTab: (tab: 'report' | 'sheet' | 'gate' | 'drill' | 'register' | 'rules' | 'guide' | 'rnd') => void;
  metrics: OTIFMetrics;
  rules?: RulesConfig;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenBulkImport: () => void;
  onOpenWhatsAppModal: () => void;
  onOpenFactoryProfile: () => void;
  onResetBenchmark: () => void;
  isBenchmarkModified: boolean;
  onPrint: () => void;
  onOpenSalesProposal?: () => void;
  onOpenROICalculator?: () => void;
  onOpenPipeline?: () => void;
  onOpenFounderKit?: () => void;
  onOpenDatabaseManager?: () => void;
  activeDatabaseName?: string;
  databaseCount?: number;
  onOpenSecurityAudit?: () => void;
  isPinLockEnabled?: boolean;
  onLockNow?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  metrics,
  rules,
  currentRole,
  onRoleChange,
  onOpenBulkImport,
  onOpenWhatsAppModal,
  onOpenFactoryProfile,
  onResetBenchmark,
  isBenchmarkModified,
  onPrint,
  onOpenSalesProposal,
  onOpenROICalculator,
  onOpenPipeline,
  onOpenFounderKit,
  onOpenDatabaseManager,
  activeDatabaseName,
  databaseCount = 1,
  onOpenSecurityAudit,
  isPinLockEnabled = false,
  onLockNow,
}) => {
  const { activePlant } = usePlant();
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  const alertThreshold = rules?.criticalAlertThreshold ?? 60;
  const isCriticalAlertActive = metrics.otifPercent < alertThreshold;

  const factoryProfile = rules?.factoryProfile;
  const companyName = activePlant ? activePlant.name : (factoryProfile?.companyName || 'Apex Precision Automotive Ltd');
  const plantName = activePlant ? activePlant.division : (factoryProfile?.plantName || 'Unit 1 Operations');
  const clusterLocation = activePlant ? activePlant.cluster : (factoryProfile?.clusterLocation || 'Sriperumbudur Industrial Corridor');
  const planTier = factoryProfile?.planTier || 'Pro Industrial';

  // Close tools dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-950 text-white border-b border-slate-800/80 relative z-20 backdrop-blur-md bg-slate-950/95 no-print">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-850 text-xs">
        
        {/* Left: Client Vault Identifier & Plant Info */}
        <div className="flex items-center gap-2">
          {onOpenDatabaseManager && (
            <button
              onClick={onOpenDatabaseManager}
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-750 transition cursor-pointer font-medium group"
              title="Switch or create client factory databases"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 transition" />
              <span className="font-semibold text-white max-w-[150px] sm:max-w-[180px] truncate">
                {activeDatabaseName || companyName}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-mono border border-slate-700">
                {databaseCount} {databaseCount === 1 ? 'Vault' : 'Vaults'} ▾
              </span>
            </button>
          )}

          <button
            onClick={onOpenFactoryProfile}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
            title="Configure Factory Name, Plant, and Cluster"
          >
            <Building2 className="w-3 h-3 text-slate-400" />
            <span className="truncate max-w-[130px]">{plantName}</span>
          </button>

          <span className="text-slate-600 hidden md:inline">•</span>
          <span className="text-slate-400 hidden lg:inline">{clusterLocation}</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-slate-900 text-slate-300 border border-slate-800 hidden sm:inline">
            IATF 16949 / ISO 9001
          </span>
        </div>

        {/* Right: Security, Role Selector & Executive Actions */}
        <div className="flex items-center gap-2">
          
          {/* Security & Audit Center Pill */}
          {onOpenSecurityAudit && (
            <button
              onClick={onOpenSecurityAudit}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 transition text-xs font-medium cursor-pointer"
              title="Enterprise Security Center: Immutable Timestamps, Supervisor PIN & Audit Logs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Security &amp; Audit</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </button>
          )}

          {/* Quick Lock toggle if PIN is configured */}
          {isPinLockEnabled && onLockNow && (
            <button
              onClick={onLockNow}
              className="p-1 rounded-md bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 transition cursor-pointer"
              title="Lock System into Gate Kiosk Mode (Supervisor PIN Required to Unlock)"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Precision Industrial Segmented Role Switcher (Zero Cartoon Emojis) */}
          <div className="flex items-center bg-slate-900 rounded-md p-0.5 border border-slate-800 text-[11px] font-medium">
            <button
              onClick={() => onRoleChange('owner')}
              className={`px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1.5 ${
                currentRole === 'owner'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Executive / Plant Head Dashboard"
            >
              <User className="w-3 h-3 text-slate-300" />
              <span>Executive</span>
            </button>
            <button
              onClick={() => onRoleChange('clerk')}
              className={`px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1.5 ${
                currentRole === 'clerk'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Warehouse / Stores Dispatch Desk"
            >
              <ClipboardList className="w-3 h-3 text-slate-300" />
              <span>Dispatch Desk</span>
            </button>
            <button
              onClick={() => onRoleChange('gate')}
              className={`px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1.5 ${
                currentRole === 'gate'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Security Gate Tablet View"
            >
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Gate Kiosk</span>
            </button>
          </div>

          {/* Clean Excel Import Action */}
          <button
            onClick={onOpenBulkImport}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-750 transition text-xs font-medium cursor-pointer"
            title="Import Excel or CSV file from SAP/Tally"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Excel Import</span>
          </button>

          {/* R&D Lab Quick Trigger */}
          <button
            onClick={() => setCurrentTab('rnd')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition text-xs font-semibold cursor-pointer shadow-sm ${
              currentTab === 'rnd'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-750'
            }`}
            title="Open Automated R&D QA Suite, Diagnostics & Stress Benchmarks"
          >
            <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">R&amp;D &amp; QA Lab</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          </button>

          {/* Unified Commercial & Sales Tools Dropdown (Replaces Rainbow Button Clutter) */}
          <div className="relative" ref={toolsMenuRef}>
            <button
              onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-750 transition text-xs font-semibold cursor-pointer shadow-sm"
              title="Commercial Client Kit & Executive Tools"
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>Sales &amp; Tools</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isToolsMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-0.5 animate-in fade-in duration-150">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-800/80 mb-1">
                  Commercial &amp; Audit Suite
                </div>

                {onOpenSalesProposal && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenSalesProposal();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Client Sales Proposal</div>
                      <div className="text-[10px] text-slate-400">Formal SaaS quote &amp; contract terms</div>
                    </div>
                  </button>
                )}

                {onOpenROICalculator && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenROICalculator();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
                    <div>
                      <div className="font-semibold">CFO Penalty &amp; ROI Calculator</div>
                      <div className="text-[10px] text-slate-400">Prove financial payback from stopped debit notes</div>
                    </div>
                  </button>
                )}

                {onOpenPipeline && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenPipeline();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Client Sales Pipeline</div>
                      <div className="text-[10px] text-slate-400">Track factory leads and monthly deal stages</div>
                    </div>
                  </button>
                )}

                {onOpenFounderKit && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenFounderKit();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Pitch Kit &amp; Price Controls</div>
                      <div className="text-[10px] text-slate-400">Authority scripts &amp; monthly fee editor</div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    onOpenWhatsAppModal();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold">WhatsApp Executive Digest</div>
                    <div className="text-[10px] text-slate-400">Automated shift dispatch scorecard alert</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    setCurrentTab('rnd');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 flex items-center gap-2.5 transition cursor-pointer border-t border-slate-800/80 pt-2"
                >
                  <FlaskConical className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-semibold">R&amp;D Innovation &amp; QA Lab</div>
                    <div className="text-[10px] text-slate-400">24 automated QA tests &amp; gate OCR simulator</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Reset benchmark if modified */}
          {isBenchmarkModified && (
            <button
              onClick={onResetBenchmark}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition text-xs cursor-pointer"
              title="Reset sample data back to standard benchmark"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}

          {/* Print button */}
          <button
            onClick={onPrint}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition text-xs font-medium cursor-pointer"
            title="Print executive scorecard report"
          >
            <Printer className="w-3 h-3" />
            <span className="hidden md:inline">Print</span>
          </button>

          {/* High-Precision Real-Time Metric Chip */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-md border font-mono transition ${
            isCriticalAlertActive
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}>
            {isCriticalAlertActive && (
              <span className="inline-flex items-center text-rose-400" title={`Critical alert: OTIF is below ${alertThreshold}%`}>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              </span>
            )}
            <span className="text-slate-400 text-[11px] hidden sm:inline">Gate OTIF:</span>
            <span className={`font-bold tabular-nums ${
              metrics.otifPercent >= 80 ? 'text-emerald-400' : metrics.otifPercent >= alertThreshold ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {metrics.otifPercent}%
            </span>
          </div>

        </div>
      </div>

      {/* Main Brand & Tab Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
            <Truck className="w-5 h-5 text-slate-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                Customer Promise Reliability Engine
              </h1>
              <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                P2 • Revenue &amp; Service Protection
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Customer Fulfillment, Gate-Out Verification &amp; OEM Revenue Protection Tower
            </p>
          </div>
        </div>

        {/* Executive Tab Strip */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 overflow-x-auto text-xs font-medium">
          
          <button
            onClick={() => setCurrentTab('report')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition whitespace-nowrap cursor-pointer ${
              currentTab === 'report'
                ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-slate-300" />
            <span>Executive Report</span>
          </button>

          <button
            onClick={() => setCurrentTab('sheet')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition whitespace-nowrap cursor-pointer ${
              currentTab === 'sheet'
                ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-slate-300" />
            <span>Dispatches Sheet</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-300 font-mono border border-slate-800">
              {metrics.totalDispatches}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('gate')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition whitespace-nowrap cursor-pointer ${
              currentTab === 'gate'
                ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
            title="Gate security guard touch tablet view"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gate Cabin Tablet</span>
          </button>

          <button
            onClick={() => setCurrentTab('drill')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition whitespace-nowrap cursor-pointer ${
              currentTab === 'drill'
                ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-rose-400" />
            <span>The Drill</span>
          </button>

          <button
            onClick={() => setCurrentTab('register')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition whitespace-nowrap cursor-pointer ${
              currentTab === 'register'
                ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-300" />
            <span>Register vs PO</span>
          </button>

          <button
            onClick={() => setCurrentTab('rules')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition whitespace-nowrap cursor-pointer ${
              currentTab === 'rules'
                ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-slate-300" />
            <span>Rules &amp; SLA</span>
          </button>

          <button
            onClick={() => setCurrentTab('guide')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition whitespace-nowrap cursor-pointer ${
              currentTab === 'guide'
                ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-300" />
            <span>Field Guide</span>
          </button>

          <button
            onClick={() => setCurrentTab('rnd')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition whitespace-nowrap cursor-pointer ${
              currentTab === 'rnd'
                ? 'bg-cyan-950/80 text-cyan-200 font-semibold shadow-sm border border-cyan-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
            title="Automated regression tests, stress benchmarker, and R&D gate prototypes"
          >
            <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
            <span>R&amp;D &amp; Test Lab</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800">
              24 QA
            </span>
          </button>

        </nav>
      </div>
    </header>
  );
};
