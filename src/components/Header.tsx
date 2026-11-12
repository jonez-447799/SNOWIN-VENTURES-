import React from 'react';
import { CurrencyCode, UserRole } from '../types';
import { CURRENCY_CONFIGS } from '../utils/calculations';
import { 
  FileSpreadsheet, 
  FileText, 
  Sliders, 
  BookOpen, 
  ShieldCheck, 
  Printer, 
  PlayCircle,
  Sun,
  Moon,
  Lock,
  ChevronDown,
  Zap,
  Award,
  Database
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'report' | 'stock' | 'simulator' | 'rules' | 'words' | 'security';
  setActiveTab: (tab: 'report' | 'stock' | 'simulator' | 'rules' | 'words' | 'security') => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  onOpenDrill: () => void;
  onPrint: () => void;
  onOpenAuditDossier?: () => void;
  onOpenTrialModal?: () => void;
  activeDatasetName?: string;
  onLockSession?: () => void;
  gdprPrivacyMode?: boolean;
  onTogglePrivacy?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  currentRole,
  setCurrentRole,
  darkMode,
  setDarkMode,
  onOpenDrill,
  onPrint,
  onOpenAuditDossier,
  onOpenTrialModal,
  activeDatasetName,
  onLockSession,
  gdprPrivacyMode,
  onTogglePrivacy,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded bg-amber-600 dark:bg-amber-500 text-white font-mono font-bold flex items-center justify-center text-sm shadow-sm">
              P1
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Project 1 : Factory Cash Audit
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                Ambattur Unit Sample
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation tabs with clean text & subtle states */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'report'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Owner Report
            </button>

            <button
              onClick={() => setActiveTab('stock')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'stock'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Stock Engine
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'simulator'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Cash Simulator
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'rules'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Rules (Cutoffs)
            </button>

            <button
              onClick={() => setActiveTab('words')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'words'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Words &amp; Tally
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'security'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Security &amp; API
            </button>
          </nav>

          {/* Zone 3: Primary actions & controls */}
          <div className="flex items-center gap-2">
            {/* Currency selector */}
            <div className="relative">
              <select
                aria-label="Select currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="appearance-none bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-medium rounded-md pl-2 pr-6 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {(Object.keys(CURRENCY_CONFIGS) as CurrencyCode[]).map((c) => (
                  <option key={c} value={c}>
                    {c} ({CURRENCY_CONFIGS[c].symbol.trim()})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-1.5 top-2.5 pointer-events-none" />
            </div>

            {/* Quick Drill CTA */}
            <button
              onClick={onOpenDrill}
              className="px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/80 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Test date change on SS flange 150NB"
            >
              <PlayCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">The Drill</span>
            </button>

            {/* Print 1-Pager CTA */}
            <button
              onClick={onPrint}
              className="px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Print 1-Page Owner Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Print 1-Pager</span>
            </button>

            {/* Audit Dossier Certificate CTA */}
            {onOpenAuditDossier && (
              <button
                onClick={onOpenAuditDossier}
                className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800/80 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                title="View Certified Audit Certificate & WhatsApp Share Card"
              >
                <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Audit Dossier</span>
              </button>
            )}

            {/* Trial Data Center CTA */}
            {onOpenTrialModal && (
              <button
                onClick={onOpenTrialModal}
                className="px-2.5 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-300 dark:border-indigo-800/80 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                title="Switch Trial R&D Datasets (Auto Ancillary, Spares, Control Group)"
              >
                <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">R&amp;D Trial Data</span>
              </button>
            )}

            {/* Role Switcher */}
            <div className="relative hidden xl:block">
              <select
                aria-label="Active User Role"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="appearance-none bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium rounded-md pl-2 pr-6 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="Owner">Role: Owner</option>
                <option value="Plant Head">Role: Plant Head</option>
                <option value="Accounts">Role: Accounts</option>
                <option value="Auditor">Role: Auditor</option>
                <option value="Read Only">Role: Read Only</option>
              </select>
              <Lock className="w-3 h-3 text-neutral-400 absolute right-1.5 top-2.5 pointer-events-none" />
            </div>

            {/* Lock Session Quick Action */}
            {onLockSession && (
              <button
                onClick={onLockSession}
                className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Lock Factory Vault (AES-256)"
                aria-label="Lock Session"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-neutral-200 dark:border-neutral-800 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('report')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'report' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-500'
            }`}
          >
            Report
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'stock' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-500'
            }`}
          >
            Stock Engine
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'rules' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-500'
            }`}
          >
            Rules
          </button>
          <button
            onClick={() => setActiveTab('words')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'words' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-500'
            }`}
          >
            Words &amp; Tally
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'security' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-500'
            }`}
          >
            Security
          </button>
        </div>
      </div>
    </header>
  );
};
