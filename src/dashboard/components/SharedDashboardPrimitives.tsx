/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Eye,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Info,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  Database,
  RefreshCw,
  Filter,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import {
  OperationalStatus,
  ValueClassification,
  PriorityAttentionItem,
  ExecutiveKPICardData,
  InvestigationQueueRow,
  PlatformNavId,
  DEMO_ENVIRONMENT_CONFIG,
  MetricMethodology,
} from '../dashboardConfig';

export const StatusBadge: React.FC<{ status: OperationalStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'sm',
}) => {
  const styles: Record<
    OperationalStatus,
    { bg: string; text: string; border: string; icon: React.ReactNode; label: string }
  > = {
    Critical: {
      bg: 'bg-rose-950/70',
      text: 'text-rose-200',
      border: 'border-rose-500/40',
      icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
      label: 'Critical',
    },
    'Requires attention': {
      bg: 'bg-amber-950/70',
      text: 'text-amber-200',
      border: 'border-amber-500/40',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
      label: 'Requires attention',
    },
    Monitoring: {
      bg: 'bg-sky-950/70',
      text: 'text-sky-200',
      border: 'border-sky-500/40',
      icon: <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
      label: 'Monitoring',
    },
    Verified: {
      bg: 'bg-emerald-950/70',
      text: 'text-emerald-200',
      border: 'border-emerald-500/40',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
      label: 'Verified',
    },
    Incomplete: {
      bg: 'bg-slate-800/90',
      text: 'text-slate-300',
      border: 'border-slate-600/60',
      icon: <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
      label: 'Incomplete',
    },
  };

  const cfg = styles[status] || styles.Monitoring;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-semibold tracking-tight ${cfg.bg} ${cfg.text} ${cfg.border} ${padding}`}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
    </span>
  );
};

export const ValueClassificationBadge: React.FC<{ type: ValueClassification }> = ({ type }) => {
  const map: Record<ValueClassification, { cls: string; desc: string }> = {
    Actual: {
      cls: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
      desc: 'Recorded ledger or gate figure',
    },
    Calculated: {
      cls: 'bg-sky-950/60 text-sky-300 border-sky-500/30',
      desc: 'Directly calculated from loaded records',
    },
    Estimate: {
      cls: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
      desc: 'Calculated directional estimate',
    },
    Scenario: {
      cls: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30',
      desc: 'Simulated what-if outcome',
    },
    Assumption: {
      cls: 'bg-slate-800 text-slate-300 border-slate-600',
      desc: 'Configurable management input parameter',
    },
    Unavailable: {
      cls: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
      desc: 'Required source field not provided in dataset',
    },
  };
  const cfg = map[type] || map.Estimate;
  return (
    <span
      title={cfg.desc}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-mono font-semibold uppercase tracking-wider ${cfg.cls}`}
    >
      {type}
    </span>
  );
};

export const EnvironmentBadge: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <span
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-500/30 text-amber-200 text-[11px] font-mono font-semibold tracking-wider uppercase"
    title={DEMO_ENVIRONMENT_CONFIG.noticeText}
  >
    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
    <span>{compact ? 'DEMO ENVIRONMENT' : DEMO_ENVIRONMENT_CONFIG.badgeLabel}</span>
  </span>
);

export const DemoDataNotice: React.FC<{ onOpenImports?: () => void }> = ({ onOpenImports }) => (
  <div
    role="region"
    aria-label="Demonstration Environment Notice"
    className="bg-slate-900/90 border border-slate-800 rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300"
  >
    <div className="flex items-center gap-2.5">
      <EnvironmentBadge compact />
      <span className="text-slate-300">
        <strong className="text-white font-semibold">{DEMO_ENVIRONMENT_CONFIG.organizationName}:</strong>{' '}
        {DEMO_ENVIRONMENT_CONFIG.noticeText}
      </span>
    </div>
    {onOpenImports && (
      <button
        onClick={onOpenImports}
        className="text-sky-300 hover:text-sky-200 font-semibold inline-flex items-center gap-1 cursor-pointer underline underline-offset-4"
      >
        <span>Upload your own Tally / CSV dataset</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

export const ExecutivePriorityCard: React.FC<{
  item: PriorityAttentionItem;
  onInspectDomain: (domain: PlatformNavId) => void;
  onOpenMethodology: (metricId: string) => void;
}> = ({ item, onInspectDomain, onOpenMethodology }) => {
  const borderAccent =
    item.status === 'Critical'
      ? 'border-l-4 border-l-rose-500 border-slate-800'
      : item.status === 'Requires attention'
      ? 'border-l-4 border-l-amber-500 border-slate-800'
      : 'border-l-4 border-l-sky-500 border-slate-800';

  return (
    <div
      className={`bg-slate-900/95 border ${borderAccent} rounded-xl p-5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {item.domainLabel}
            </span>
            <span className="text-[11px] font-mono text-slate-400">({item.secondaryCode})</span>
          </div>
          <StatusBadge status={item.status} />
        </div>

        <h3 className="text-base font-bold text-white leading-snug mb-3">{item.title}</h3>

        <div className="grid grid-cols-3 gap-2 bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 mb-3 text-xs">
          <div>
            <div className="text-slate-400 text-[11px]">Current</div>
            <div className="font-mono font-bold text-white mt-0.5">{item.currentValue}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Target / Threshold</div>
            <div className="font-mono font-semibold text-slate-200 mt-0.5">{item.targetValue}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Period Change</div>
            <div className="font-mono font-semibold text-amber-300 mt-0.5">{item.changeLabel}</div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          <strong className="text-slate-100">Why it matters: </strong>
          {item.whyItMatters}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => onInspectDomain(item.domain)}
          className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
        >
          <span>{item.primaryActionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => onInspectDomain(item.domain)}
            className="text-slate-300 hover:text-white font-medium underline underline-offset-4 cursor-pointer"
          >
            {item.supportingRecordsCount} records
          </button>
          <button
            onClick={() => onOpenMethodology(item.metricId)}
            className="text-slate-400 hover:text-sky-300 inline-flex items-center gap-1 cursor-pointer"
            title="How is this calculated?"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Methodology</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const KPIStatusCard: React.FC<{
  kpi: ExecutiveKPICardData;
  onInspectDomain: (domain: PlatformNavId) => void;
  onOpenMethodology: (metricId: string) => void;
}> = ({ kpi, onInspectDomain, onOpenMethodology }) => {
  const changeIcon =
    kpi.changeDirection === 'up_bad' || kpi.changeDirection === 'up_good' ? (
      <TrendingUp className="w-3.5 h-3.5" />
    ) : kpi.changeDirection === 'down_bad' || kpi.changeDirection === 'down_good' ? (
      <TrendingDown className="w-3.5 h-3.5" />
    ) : (
      <Minus className="w-3.5 h-3.5" />
    );

  const changeColor =
    kpi.changeDirection === 'up_bad' || kpi.changeDirection === 'down_bad'
      ? 'text-amber-300'
      : kpi.changeDirection === 'up_good' || kpi.changeDirection === 'down_good'
      ? 'text-emerald-300'
      : 'text-slate-300';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-300 leading-tight">{kpi.name}</span>
          <StatusBadge status={kpi.status} size="sm" />
        </div>

        <div className="text-2xl font-mono font-bold text-white tracking-tight my-1">
          {kpi.valueDisplay}
        </div>

        <div className="text-xs font-medium text-sky-200/90 mb-2">{kpi.contextSubtext}</div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950/70 rounded px-2 py-1.5 mb-2.5 border border-slate-800/60">
          <span>Target: {kpi.targetDisplay}</span>
          <span className={`inline-flex items-center gap-1 font-semibold ${changeColor}`}>
            {changeIcon}
            {kpi.changeDisplay}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-3">{kpi.interpretation}</p>
      </div>

      <div className="pt-2.5 border-t border-slate-800/70 flex items-center justify-between gap-2 text-xs">
        <button
          onClick={() => onInspectDomain(kpi.domain)}
          className="text-sky-300 hover:text-sky-200 font-semibold inline-flex items-center gap-1 cursor-pointer"
        >
          <span>{kpi.actionLabel}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onOpenMethodology(kpi.metricId)}
          className="text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer text-[11px]"
          aria-label={`How is ${kpi.name} calculated?`}
        >
          <Info className="w-3 h-3" />
          <span>Formula</span>
        </button>
      </div>
    </div>
  );
};

export const InvestigationQueue: React.FC<{
  rows: InvestigationQueueRow[];
  onInspectDomain: (domain: PlatformNavId) => void;
  onOpenMethodology: (metricId: string) => void;
  onOpenActionsView?: () => void;
}> = ({ rows, onInspectDomain, onOpenMethodology, onOpenActionsView }) => {
  const [filter, setFilter] = useState<
    'All' | 'Critical' | 'Requires attention' | 'Monitoring' | 'Resolved'
  >('All');

  const filtered = rows.filter((r) => (filter === 'All' ? true : r.priority === filter));

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-400" />
            <span>Priority Investigation Queue (Exception-First)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked operational signals requiring root-cause verification across Inventory, Delivery, Profit &amp; Risk, and Warehouse.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter investigation queue">
          {(['All', 'Critical', 'Requires attention', 'Monitoring', 'Resolved'] as const).map(
            (tab) => {
              const count =
                tab === 'All' ? rows.length : rows.filter((r) => r.priority === tab).length;
              const active = filter === tab;
              return (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(tab)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    active
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            }
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 font-semibold">Priority</th>
              <th className="py-3 px-4 font-semibold">Domain</th>
              <th className="py-3 px-4 font-semibold">Operational Signal &amp; Impact</th>
              <th className="py-3 px-4 font-semibold">Evidence</th>
              <th className="py-3 px-4 font-semibold">Owner &amp; Status</th>
              <th className="py-3 px-4 font-semibold">Recommended Next Investigation</th>
              <th className="py-3 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.map((row) => {
              const statusMap: Record<string, OperationalStatus> = {
                Critical: 'Critical',
                'Requires attention': 'Requires attention',
                Monitoring: 'Monitoring',
                Resolved: 'Verified',
              };
              return (
                <tr key={row.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <StatusBadge status={statusMap[row.priority] || 'Monitoring'} />
                  </td>
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <div className="font-bold text-white">{row.domainLabel}</div>
                    <div className="text-[11px] font-mono text-slate-400">{row.id}</div>
                  </td>
                  <td className="py-3.5 px-4 align-top max-w-md">
                    <div className="font-semibold text-white mb-1">{row.signal}</div>
                    <div className="text-slate-300 leading-relaxed">{row.whyItMatters}</div>
                  </td>
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <button
                      onClick={() => onInspectDomain(row.domain)}
                      className="font-mono font-semibold text-sky-300 hover:text-sky-200 underline underline-offset-4 cursor-pointer"
                    >
                      {row.evidenceLabel}
                    </button>
                    <div>
                      <button
                        onClick={() => onOpenMethodology(row.metricId)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 mt-1 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Info className="w-3 h-3" />
                        <span>Definition</span>
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <div className="text-slate-200 font-medium">{row.owner}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Status: <strong className="text-slate-200">{row.status}</strong> • {row.dueDate}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top max-w-xs text-slate-300 leading-relaxed">
                    {row.recommendedInvestigation}
                  </td>
                  <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                    <button
                      onClick={() => onInspectDomain(row.domain)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-slate-100 font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Investigate</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {onOpenActionsView && (
        <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Showing {filtered.length} of {rows.length} tracked operational exceptions
          </span>
          <button
            onClick={onOpenActionsView}
            className="text-sky-300 hover:text-sky-200 font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Open full Actions &amp; 8D CAPA workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export const ExecutiveBrief: React.FC<{
  brief: {
    currentState: string;
    importantChange: string;
    likelyDriver: string;
    priorityInvestigation: string;
    dataLimitation: string;
  };
  onOpenReports: () => void;
}> = ({ brief, onOpenReports }) => (
  <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5">
    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-sky-400" />
        <h2 className="text-base font-bold text-white">Executive Brief (Rule-Based Summary)</h2>
        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">
          Deterministic Data Synthesis
        </span>
      </div>
      <button
        onClick={onOpenReports}
        className="text-xs font-semibold text-sky-300 hover:text-sky-200 inline-flex items-center gap-1 cursor-pointer"
      >
        <span>Open Board Report &amp; Print View</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3.5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold mb-1.5">
          1. Current State
        </div>
        <p className="text-slate-200 leading-relaxed">{brief.currentState}</p>
      </div>
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3.5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold mb-1.5">
          2. Important Change
        </div>
        <p className="text-slate-200 leading-relaxed">{brief.importantChange}</p>
      </div>
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3.5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold mb-1.5">
          3. Associated Operational Driver
        </div>
        <p className="text-slate-200 leading-relaxed">{brief.likelyDriver}</p>
      </div>
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3.5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold mb-1.5">
          4. Priority Investigation
        </div>
        <p className="text-slate-200 leading-relaxed">{brief.priorityInvestigation}</p>
      </div>
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3.5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
          5. Scope &amp; Data Limitation
        </div>
        <p className="text-slate-300 leading-relaxed">{brief.dataLimitation}</p>
      </div>
    </div>
  </div>
);

export const TrendInsightCard: React.FC<{
  title: string;
  dateRange: string;
  unit: string;
  targetLabel: string;
  targetValue: number;
  points: { label: string; value: number; volumeContext: string }[];
  interpretation: string;
  dataSource: string;
  status: OperationalStatus;
}> = ({
  title,
  dateRange,
  unit,
  targetLabel,
  targetValue,
  points,
  interpretation,
  dataSource,
  status,
}) => {
  const maxVal = Math.max(...points.map((p) => p.value), targetValue) * 1.15 || 100;
  const hasMultiplePeriods = points.length > 1;
  const currentPoint = points[points.length - 1];

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <div className="text-[11px] text-slate-400 font-mono">
              Period: {dateRange} • Unit: {unit}
            </div>
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        {hasMultiplePeriods ? (
          <div className="mt-4 mb-3 bg-slate-950/80 border border-slate-800/80 rounded-lg p-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
              <span>Target Reference: {targetLabel}</span>
              <span className="text-sky-300">Bars show period actuals</span>
            </div>
            <div className="grid grid-cols-6 gap-2 items-end h-28 pt-4 relative">
              {points.map((pt, idx) => {
                const heightPct = Math.max(12, Math.min(100, Math.round((pt.value / maxVal) * 100)));
                const isLatest = idx === points.length - 1;
                return (
                  <div key={pt.label} className="flex flex-col items-center h-full justify-end">
                    <div className="text-[11px] font-mono font-bold text-white mb-1">
                      {pt.value}
                      {unit === '%' ? '%' : ''}
                    </div>
                    <div
                      className={`w-full rounded-t transition-all ${
                        isLatest
                          ? 'bg-sky-400 border border-sky-300'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                      style={{ height: `${heightPct}%` }}
                      title={`${pt.label}: ${pt.value}${unit} (${pt.volumeContext})`}
                    />
                    <div className="text-[10px] font-mono text-slate-300 mt-1.5">{pt.label}</div>
                    <div className="text-[9px] font-mono text-slate-400 truncate max-w-full">
                      {pt.volumeContext}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-4 mb-3 bg-slate-950/80 border border-slate-800/80 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Current Period Snapshot:</span>
              {currentPoint && (
                <span className="font-mono font-bold text-sky-300">
                  {currentPoint.value}
                  {unit} ({currentPoint.volumeContext})
                </span>
              )}
            </div>
            <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-medium">
              Verified 14-day audit baseline compared against target threshold ({targetLabel}).
            </div>
          </div>
        )}

        <p className="text-xs text-slate-200 leading-relaxed mb-2">
          <strong className="text-white">Trend takeaway: </strong>
          {interpretation}
        </p>
      </div>

      <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Source: {dataSource}</span>
        <span>Target: {targetLabel}</span>
      </div>
    </div>
  );
};

export const DataQualityBanner: React.FC<{
  sourceName: string;
  lastRefresh: string;
  recordCount: number;
  warningsCount?: number;
  warningText?: string;
  onOpenImports?: () => void;
}> = ({
  sourceName,
  lastRefresh,
  recordCount,
  warningsCount = 0,
  warningText,
  onOpenImports,
}) => (
  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-md">
        <Database className="w-3.5 h-3.5" />
        <span>Source: {sourceName}</span>
      </span>
      <span className="text-slate-300 font-mono">{recordCount} verified records loaded</span>
      <span className="text-slate-400">• {lastRefresh}</span>
      {warningsCount > 0 && warningText && (
        <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>
            {warningsCount} note: {warningText}
          </span>
        </span>
      )}
    </div>
    {onOpenImports && (
      <button
        onClick={onOpenImports}
        className="text-sky-300 hover:text-sky-200 font-semibold inline-flex items-center gap-1 cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Import / Validate Data</span>
      </button>
    )}
  </div>
);

export const MethodologyPanel: React.FC<{
  methodology: MetricMethodology;
  onOpenDrawer?: (id: string) => void;
}> = ({ methodology, onOpenDrawer }) => (
  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 text-xs">
    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-sky-400" />
        <h3 className="text-sm font-bold text-white">
          Methodology &amp; Definitions: {methodology.name}
        </h3>
      </div>
      {onOpenDrawer && (
        <button
          onClick={() => onOpenDrawer(methodology.id)}
          className="text-sky-300 hover:text-sky-200 font-semibold inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Open Full Calculation Inspector</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
        <div className="text-slate-400 text-[11px] uppercase font-mono mb-1">Formula</div>
        <div className="font-mono text-white font-semibold">{methodology.formula}</div>
      </div>
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
        <div className="text-slate-400 text-[11px] uppercase font-mono mb-1">
          Live Numerator / Denominator
        </div>
        <div className="font-mono text-sky-300 font-semibold">
          {methodology.numeratorValue} ÷ {methodology.denominatorValue}
        </div>
        <div className="text-slate-400 text-[11px] mt-1">
          Threshold: {methodology.thresholdRule}
        </div>
      </div>
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
        <div className="text-slate-400 text-[11px] uppercase font-mono mb-1">
          Scope &amp; Known Limitations
        </div>
        <ul className="list-disc list-inside text-slate-300 space-y-1">
          {methodology.knownLimitations.map((lim, i) => (
            <li key={i}>{lim}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  explanation: string;
  suggestion?: string;
  onResetFilters?: () => void;
}> = ({ title, explanation, suggestion, onResetFilters }) => (
  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center max-w-lg mx-auto my-4">
    <Database className="w-8 h-8 text-slate-400 mx-auto mb-3" />
    <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
    <p className="text-xs text-slate-300 mb-2">{explanation}</p>
    {suggestion && <p className="text-xs text-slate-400 mb-4">{suggestion}</p>}
    {onResetFilters && (
      <button
        onClick={onResetFilters}
        className="px-3.5 py-2 rounded-lg bg-sky-500 text-slate-950 font-bold text-xs cursor-pointer"
      >
        Reset Active Filters
      </button>
    )}
  </div>
);
