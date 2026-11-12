/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  Building2,
  CalendarClock,
  Database,
  CheckCircle2,
  Layers,
  Search,
  ArrowRight,
} from 'lucide-react';
import { DEMO_ENVIRONMENT_CONFIG } from '../dashboardConfig';
import { StatusBadge, EnvironmentBadge } from './SharedDashboardPrimitives';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDataImports: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onOpenDataImports,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: '1',
      icon: <Building2 className="w-4 h-4 text-sky-400" />,
      title: 'Select Factory or Unit',
      desc: 'Switch between manufacturing units (Ambattur, Sriperumbudur, Hosur) in the left navigation or top header.',
    },
    {
      num: '2',
      icon: <CalendarClock className="w-4 h-4 text-sky-400" />,
      title: 'Confirm Reporting Period',
      desc: 'Select the active audit window (Fortnight, Monthly, or Quarterly) to align all domain calculations.',
    },
    {
      num: '3',
      icon: <Database className="w-4 h-4 text-sky-400" />,
      title: 'Review Data-Source Status',
      desc: 'Inspect preloaded demonstration data or upload your own Tally Prime / ERP CSV files via Data & Imports.',
    },
    {
      num: '4',
      icon: <CheckCircle2 className="w-4 h-4 text-sky-400" />,
      title: 'Understand Status Indicators',
      desc: 'Every metric pairs color, icon, and plain-language labels: Critical, Requires attention, Monitoring, Verified, or Incomplete.',
    },
    {
      num: '5',
      icon: <Layers className="w-4 h-4 text-sky-400" />,
      title: 'Start with Executive Overview',
      desc: 'See the top 3 operational priorities, numerator/denominator KPIs, and the exception-first Investigation Queue.',
    },
    {
      num: '6',
      icon: <Search className="w-4 h-4 text-sky-400" />,
      title: 'Drill from Signal to Evidence',
      desc: 'Move from Level 1 (Executive signal) to Level 2 (Manager root cause) to Level 3 (Analyst raw records & formulas).',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="mb-2">
              <EnvironmentBadge />
            </div>
            <h2 id="onboarding-title" className="text-xl font-bold text-white">
              Welcome to Operationalyst
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Start with the Executive Overview to see which operational areas require attention, then drill into Inventory, Delivery, Profit &amp; Risk, or Warehouse evidence.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Skip and close orientation guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs space-y-1.5"
            >
              <div className="flex items-center gap-2 font-bold text-white">
                <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-mono text-sky-300">
                  {step.num}
                </span>
                {step.icon}
                <span>{step.title}</span>
              </div>
              <p className="text-slate-300 leading-relaxed pl-7">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 font-medium">Status Legend:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status="Critical" />
            <StatusBadge status="Requires attention" />
            <StatusBadge status="Monitoring" />
            <StatusBadge status="Verified" />
            <StatusBadge status="Incomplete" />
          </div>
        </div>

        <div className="text-[11px] text-slate-400 bg-slate-950/50 border border-slate-800/60 rounded-lg px-3 py-2">
          <strong className="text-slate-200">{DEMO_ENVIRONMENT_CONFIG.organizationName}:</strong>{' '}
          {DEMO_ENVIRONMENT_CONFIG.noticeText}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              onOpenDataImports();
            }}
            className="text-xs font-semibold text-sky-300 hover:text-sky-200 underline underline-offset-4 cursor-pointer"
          >
            Or import your own Tally / CSV data first
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              Skip Guide
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Open Executive Overview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
