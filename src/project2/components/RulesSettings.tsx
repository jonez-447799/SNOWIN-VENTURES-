import React, { useMemo } from 'react';
import { Sliders, AlertTriangle, ShieldCheck, Calendar, RotateCcw, Download, Upload, Check, Bell, AlertOctagon, Building2, CreditCard, MessageSquare, Sparkles } from 'lucide-react';
import { RulesConfig, DispatchRow } from '../types/otif';
import { calculateOTIFMetrics } from '../utils/otifCalculator';
import { INDUSTRY_PRESETS } from '../data/initialData';

interface RulesSettingsProps {
  rules: RulesConfig;
  onUpdateRules: (newRules: RulesConfig) => void;
  dispatches: DispatchRow[];
  onResetBenchmark: () => void;
  onImportData: (data: DispatchRow[]) => void;
}

export const RulesSettings: React.FC<RulesSettingsProps> = ({
  rules,
  onUpdateRules,
  dispatches,
  onResetBenchmark,
  onImportData,
}) => {
  const metrics = useMemo(() => calculateOTIFMetrics(dispatches, rules), [dispatches, rules]);
  const alertThreshold = rules.criticalAlertThreshold ?? 60;
  const isAlertActive = metrics.otifPercent < alertThreshold;

  const profile = rules.factoryProfile || INDUSTRY_PRESETS[0].profile;

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ rules, dispatches }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `dispatch_otif_${rules.weekStart}_to_${rules.weekEnd}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = ['Customer', 'PO', 'Part', 'Ordered Qty', 'Shipped Qty', 'Promised Date/Time', 'Actual Gate Out', 'Vehicle Plate', 'Delay Reason', 'Notes'];
    const rows = dispatches.map(d => [
      `"${d.customer}"`,
      `"${d.po}"`,
      `"${d.part}"`,
      d.orderedQty,
      d.shippedQty,
      `"${d.promisedDate}"`,
      `"${d.actualOut}"`,
      `"${d.vehicle}"`,
      `"${d.delayReason || ''}"`,
      `"${(d.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `oragadam_dispatch_register_${rules.weekStart}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = event => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed.dispatches)) {
            onImportData(parsed.dispatches);
            if (parsed.rules) onUpdateRules(parsed.rules);
          } else if (Array.isArray(parsed)) {
            onImportData(parsed);
          }
        } catch {
          alert('Invalid JSON file format.');
        }
      };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Commercial SaaS & Factory White-Labeling Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{profile.companyName}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {profile.planTier} License
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {profile.plantName} • {profile.clusterLocation} ({profile.industryType})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ✓ Commercial Active
            </span>
          </div>
        </div>

        {/* 1-Click Quick Preset Switcher for Sales Pitches */}
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Quick Switch Client Pitch Demo (1-Click Industry Re-Branding):
          </span>
          <div className="flex flex-wrap gap-2">
            {INDUSTRY_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onUpdateRules({ ...rules, factoryProfile: preset.profile })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  profile.companyName === preset.profile.companyName
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rules sheet header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Rules Sheet Configuration</h2>
            <p className="text-xs text-slate-400">
              The contract cutoffs that govern On-Time, In-Full, and OTIF calculations.
            </p>
          </div>
        </div>
      </div>

      {/* Grace Hours Setting */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Grace Hours:</span>
              <span className="font-mono text-amber-400 font-bold">{rules.graceHours} Hours</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              "The truck must leave on the promised day. Put 4 only if that customer has a written same-day grace. 
              <strong className="text-rose-400"> Do not add grace to make the score look kinder.</strong>"
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => onUpdateRules({ ...rules, graceHours: 0 })}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
                rules.graceHours === 0
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              0h (Strict OEM)
            </button>
            <button
              onClick={() => onUpdateRules({ ...rules, graceHours: 4 })}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
                rules.graceHours === 4
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              4h (Written Grace)
            </button>
          </div>
        </div>

        {rules.graceHours > 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Warning: 4 hours grace is active. Verify you have a formal OEM SLA or contract addendum allowing same-day delay before presenting this to the customer.
            </span>
          </div>
        )}
      </div>

      {/* In Full Cutoff Setting */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>In Full Cutoff:</span>
              <span className="font-mono text-amber-400 font-bold">{rules.inFullCutoff}%</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              "Shipped quantity must be at least ordered quantity. A 95% cutoff means a 5% short still passes. 
              <strong className="text-rose-400"> Do not loosen it unless his OEM contract says a short is allowed.</strong>"
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => onUpdateRules({ ...rules, inFullCutoff: 100 })}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
                rules.inFullCutoff === 100
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              100% (Strict)
            </button>
            <button
              onClick={() => onUpdateRules({ ...rules, inFullCutoff: 95 })}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
                rules.inFullCutoff === 95
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              95% (Tolerance)
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alert Threshold Setting */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-400" />
                <span>Critical Alert Threshold:</span>
                <span className="font-mono text-rose-400 font-bold">{alertThreshold}% OTIF</span>
              </h3>
              {isAlertActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  <AlertOctagon className="w-3 h-3 text-rose-400" />
                  Alert Triggered (Score: {metrics.otifPercent}%)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Score Compliant ({metrics.otifPercent}%)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              If real-time gate OTIF drops below this threshold, a <strong className="text-rose-400">warning icon and critical alert</strong> activate immediately in the Owner Report header to notify executive management.
            </p>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {[85, 75, 60, 50].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => onUpdateRules({ ...rules, criticalAlertThreshold: val })}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
                  alertThreshold === val
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={`Set threshold to ${val}%`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input & Range Slider */}
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Custom Threshold Level:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={alertThreshold}
                onChange={e => {
                  const val = Math.min(100, Math.max(1, Number(e.target.value) || 0));
                  onUpdateRules({ ...rules, criticalAlertThreshold: val });
                }}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white focus:border-rose-400 focus:outline-none"
              />
              <span className="text-slate-400 font-bold">%</span>
            </div>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min={10}
              max={95}
              step={1}
              value={alertThreshold}
              onChange={e => onUpdateRules({ ...rules, criticalAlertThreshold: Number(e.target.value) })}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>10% (Permissive)</span>
              <span>50% (Break-even)</span>
              <span>60% (Turnaround)</span>
              <span>85% (OEM Standard)</span>
              <span>95% (World Class)</span>
            </div>
          </div>
        </div>

        {/* Dynamic warning banner preview */}
        {isAlertActive ? (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-start gap-2.5">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-rose-200">Management Warning Active:</strong> Current real-time OTIF is{' '}
              <span className="font-mono font-bold text-white">{metrics.otifPercent}%</span>, which is below your{' '}
              <span className="font-mono font-bold text-rose-300">{alertThreshold}%</span> critical threshold. 
              The warning icon is actively displayed in the Owner Report header.
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-emerald-200">Management Status Normal:</strong> Current real-time OTIF is{' '}
              <span className="font-mono font-bold text-white">{metrics.otifPercent}%</span>, satisfying your{' '}
              <span className="font-mono font-bold text-emerald-300">{alertThreshold}%</span> threshold. 
              Standard gate audit status is displayed in the Owner Report header.
            </div>
          </div>
        )}
      </div>

      {/* Fortnight Window */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Fortnight Window: 15 Sep 2026 to 28 Sep 2026</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              "Week start and week end are 15 Sep and 28 Sep 2026. Two weeks is the right first window. 
              A single day is noise. A quarter is too much to copy from a notebook."
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Fortnight Start Date:</label>
            <input
              type="date"
              value={rules.weekStart}
              onChange={e => onUpdateRules({ ...rules, weekStart: e.target.value })}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-400 w-full"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Fortnight End Date:</label>
            <input
              type="date"
              value={rules.weekEnd}
              onChange={e => onUpdateRules({ ...rules, weekEnd: e.target.value })}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-400 w-full"
            />
          </div>
        </div>
      </div>

      {/* Data Management & Benchmark Reset */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white">Data Management &amp; Benchmark Backup</h3>
        <p className="text-xs text-slate-400">
          Restore the pristine 18-row benchmark dataset, or export current register data for client delivery.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={onResetBenchmark}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to 18-Row Benchmark (50% OTIF)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Register CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Engine JSON</span>
          </button>

          <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
