import React from 'react';
import { 
  Building2, 
  Moon, 
  Sun, 
  ShieldCheck, 
  HelpCircle,
  Globe,
  Radio,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Language, UserRole } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface TopBarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  isOffline: boolean;
  onOpenHabitGuide: () => void;
  clientName: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  setCurrentTab,
  language,
  setLanguage,
  isDarkMode,
  setIsDarkMode,
  role,
  setRole,
  isOffline,
  onOpenHabitGuide,
  clientName,
}) => {
  const t = TRANSLATIONS[language];

  const roleLabels: Record<UserRole, string> = {
    owner: 'Factory Owner',
    supply_chain_head: 'SCM Head',
    floor_dispatcher: 'Floor Dispatcher',
    consultant: 'Tower Consultant',
  };

  const navItems = [
    { id: 'tower', label: 'Control Tower' },
    { id: 'huddle', label: 'Daily Huddle', isHighlight: true },
    { id: 'sheet', label: 'Inputs Sheet' },
    { id: 'fleet', label: 'Fleet Radar' },
    { id: 'chat', label: 'Dispatcher Chat' },
    { id: 'erp', label: 'ERP & Sync' },
    { id: 'reports', label: 'Quarterly' },
  ];

  return (
    <header className={`relative z-20 w-full transition-colors border-b ${
      isDarkMode 
        ? 'bg-neutral-900/95 border-neutral-800 backdrop-blur-md text-neutral-100' 
        : 'bg-white/95 border-neutral-200 backdrop-blur-md text-neutral-900'
    } no-print`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark as per Constitution */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentTab('tower')}
                className="text-left font-bold text-base sm:text-lg tracking-tight hover:text-amber-500 transition-colors whitespace-nowrap"
              >
                {t.appName}
              </button>
              <span className="hidden lg:inline-block px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-400 uppercase">
                P5 • Executive Control Tower
              </span>
            </div>
            <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline truncate max-w-[260px]">
              {clientName}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                  isActive
                    ? isDarkMode
                      ? 'bg-neutral-800 text-amber-400 border border-neutral-700 shadow-sm'
                      : 'bg-neutral-100 text-neutral-900 border border-neutral-300 shadow-sm'
                    : isDarkMode
                      ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>{item.label}</span>
                  {item.id === 'huddle' && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
                      Top 3
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions & Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Offline / Online Indicator */}
          <div 
            title={isOffline ? 'Working in offline mode (local cache synced)' : 'Connected to live warehouse gateway'}
            className={`hidden lg:flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono border ${
              isOffline
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
            }`}
          >
            {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3 text-emerald-400" />}
            <span>{isOffline ? 'Offline Cache' : 'Live Gateway'}</span>
          </div>

          {/* Role Switcher */}
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className={`text-xs font-mono py-1 px-2 rounded border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                isDarkMode 
                  ? 'bg-neutral-800 border-neutral-700 text-neutral-200' 
                  : 'bg-neutral-100 border-neutral-300 text-neutral-800'
              }`}
              title="Role-Based Access View"
            >
              <option value="owner">Role: Owner</option>
              <option value="supply_chain_head">Role: SCM Head</option>
              <option value="floor_dispatcher">Role: Dispatcher</option>
              <option value="consultant">Role: Consultant</option>
            </select>
          </div>

          {/* Multi-Language Selector */}
          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 text-neutral-400 absolute left-2 pointer-events-none" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className={`text-xs pl-7 pr-2 py-1 rounded border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                isDarkMode 
                  ? 'bg-neutral-800 border-neutral-700 text-neutral-200' 
                  : 'bg-neutral-100 border-neutral-300 text-neutral-800'
              }`}
              title="Language (Multi-Language Support)"
            >
              <option value="en">EN</option>
              <option value="ta">தமிழ் (TA)</option>
              <option value="hi">हिन्दी (HI)</option>
              <option value="de">DE</option>
              <option value="es">ES</option>
            </select>
          </div>

          {/* Warehouse Dark/Light Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-1.5 rounded-md border transition-colors ${
              isDarkMode
                ? 'bg-neutral-800 border-neutral-700 text-amber-400 hover:bg-neutral-700'
                : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
            }`}
            title={isDarkMode ? 'Switch to Day Mode' : 'Switch to Warehouse Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Retainer Model Info Button */}
          <button
            onClick={onOpenHabitGuide}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
              isDarkMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
            title="The ₹5,000–₹8,000/mo Retainer Habit Guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">The Habit</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className={`md:hidden flex items-center justify-between overflow-x-auto px-4 py-2 border-t text-xs scrollbar-none ${
        isDarkMode ? 'border-neutral-800 bg-neutral-900/80' : 'border-neutral-200 bg-neutral-50'
      }`}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
              currentTab === item.id
                ? isDarkMode
                  ? 'bg-neutral-800 text-amber-400'
                  : 'bg-neutral-200 text-neutral-900'
                : 'text-neutral-500'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
