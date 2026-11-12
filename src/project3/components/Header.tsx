import React from 'react';
import { FileSpreadsheet, Settings, Download, Plus, RotateCcw, AlertTriangle, Briefcase, Smartphone, ShieldAlert, BookOpen } from 'lucide-react';
import { RulesConfig } from '../types/freight';

export type AppTab = 'report' | 'proposal' | 'objections' | 'reconcile' | 'ingest' | 'trips' | 'carriers' | 'lanes' | 'dossier';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  rules: RulesConfig;
  onOpenRules: () => void;
  onOpenAddTrip: () => void;
  onResetData: () => void;
  onExportCSV: () => void;
  alertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  rules,
  onOpenRules,
  onOpenAddTrip,
  onResetData,
  onExportCSV,
  alertCount
}) => {
  return (
    <header className="bg-white border-b border-slate-200 relative z-20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight text-slate-900 cursor-pointer" onClick={() => setActiveTab('report')}>
              Profit Protection Engine
            </span>
            <span className="hidden lg:inline-block text-xs font-mono font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
              P3 • Freight Leak Audit
            </span>
          </div>

          {/* Zone 2: Clean text navigation links */}
          <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium overflow-x-auto py-2">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-2 py-1.5 transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'report'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Owner Report
            </button>
            <button
              onClick={() => setActiveTab('proposal')}
              className={`px-2 py-1.5 transition-colors border-b-2 whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'proposal'
                  ? 'border-amber-600 text-amber-950 font-bold'
                  : 'border-transparent text-slate-600 hover:text-amber-700'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-600 hidden sm:inline" />
              <span>Commercial ROI & Proposal</span>
            </button>
            <button
              onClick={() => setActiveTab('objections')}
              className={`px-2 py-1.5 transition-colors border-b-2 whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'objections'
                  ? 'border-rose-600 text-rose-950 font-bold'
                  : 'border-transparent text-slate-600 hover:text-rose-700'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 hidden sm:inline" />
              <span>Objection-Buster</span>
            </button>
            <button
              onClick={() => setActiveTab('reconcile')}
              className={`px-2 py-1.5 transition-colors border-b-2 whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'reconcile'
                  ? 'border-emerald-600 text-emerald-950 font-bold'
                  : 'border-transparent text-slate-600 hover:text-emerald-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600 hidden sm:inline" />
              <span>Gate & LR Ingest</span>
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className={`px-2 py-1.5 transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'trips'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Trips Sheet
            </button>
            <button
              onClick={() => setActiveTab('carriers')}
              className={`hidden md:block px-2 py-1.5 transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'carriers'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Transporters
            </button>
            <button
              onClick={() => setActiveTab('lanes')}
              className={`hidden lg:block px-2 py-1.5 transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'lanes'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Lanes
            </button>
            <button
              onClick={() => setActiveTab('dossier')}
              className={`hidden sm:block px-2 py-1.5 transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'dossier'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Dossier
            </button>
          </nav>

          {/* Zone 3: Primary actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenRules}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors whitespace-nowrap"
              title="Configure detention rate and rules"
            >
              <Settings className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Wait: ₹{rules.detentionRatePerHour}/hr</span>
              <span className="sm:hidden">₹{rules.detentionRatePerHour}</span>
            </button>

            <button
              onClick={onOpenAddTrip}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Bill</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
