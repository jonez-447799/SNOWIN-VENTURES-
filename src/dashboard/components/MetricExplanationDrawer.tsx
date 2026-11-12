/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import {
  X,
  BookOpen,
  Calculator,
  Database,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { MetricMethodology, PlatformNavId, DEMO_ENVIRONMENT_CONFIG } from '../dashboardConfig';
import { EnvironmentBadge } from './SharedDashboardPrimitives';

interface MetricExplanationDrawerProps {
  methodology: MetricMethodology | null;
  onClose: () => void;
  onNavigateDomain: (domain: PlatformNavId) => void;
}

export const MetricExplanationDrawer: React.FC<MetricExplanationDrawerProps> = ({
  methodology,
  onClose,
  onNavigateDomain,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && methodology) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [methodology, onClose]);

  if (!methodology) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-metric-title"
    >
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col justify-between overflow-y-auto shadow-2xl">
        <div className="p-5 sm:p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-sky-400 font-semibold">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Metric Methodology &amp; Audit Basis</span>
                </span>
                <EnvironmentBadge compact />
              </div>
              <h2 id="drawer-metric-title" className="text-lg font-bold text-white">
                {methodology.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              aria-label="Close calculation explanation drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Plain-Language Explanation */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-300 mb-1">
              What this metric measures
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">{methodology.plainExplanation}</p>
          </div>

          {/* 2. Formula & Actual Numerator / Denominator */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Exact Calculation Formula &amp; Live Values</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-white font-semibold">
              {methodology.formula}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 mb-0.5">Numerator</div>
                <div className="font-mono font-bold text-white text-sm">
                  {methodology.numeratorValue}
                </div>
                <div className="text-[11px] text-slate-300 mt-1">{methodology.numeratorLabel}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 mb-0.5">Denominator</div>
                <div className="font-mono font-bold text-white text-sm">
                  {methodology.denominatorValue}
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  {methodology.denominatorLabel}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Key Definitions */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-white">Operational Definitions</div>
            <div className="space-y-2">
              {methodology.keyDefinitions.map((def) => (
                <div
                  key={def.term}
                  className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3 text-xs"
                >
                  <div className="font-semibold text-sky-300 mb-0.5">{def.term}</div>
                  <div className="text-slate-300 leading-relaxed">{def.definition}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Included / Excluded Records, Thresholds & Source */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Data Scope, Thresholds &amp; Provenance</span>
            </div>
            <div>
              <span className="text-slate-400">Included records: </span>
              <span className="text-slate-200">{methodology.includedRecords}</span>
            </div>
            <div>
              <span className="text-slate-400">Excluded records: </span>
              <span className="text-slate-200">{methodology.excludedRecords}</span>
            </div>
            <div>
              <span className="text-slate-400">Date range: </span>
              <span className="font-mono text-slate-200">{methodology.dateRangeUsed}</span>
            </div>
            <div>
              <span className="text-slate-400">Threshold rule: </span>
              <span className="font-mono text-amber-300">{methodology.thresholdRule}</span>
            </div>
            <div>
              <span className="text-slate-400">Data source: </span>
              <span className="text-slate-200">{methodology.dataSource}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 pt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{methodology.lastRefresh}</span>
            </div>
          </div>

          {/* 5. Known Limitations */}
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 text-xs">
            <div className="font-semibold text-amber-200 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Known Limitations &amp; Interpretation Boundaries</span>
            </div>
            <ul className="list-disc list-inside text-slate-200 space-y-1.5 leading-relaxed">
              {methodology.knownLimitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
              <li>{DEMO_ENVIRONMENT_CONFIG.noticeText}</li>
            </ul>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              onNavigateDomain(methodology.recommendedDomain);
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>{methodology.recommendedInvestigationLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
