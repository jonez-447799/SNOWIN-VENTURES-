/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  Headphones,
  Rocket,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';

interface CommitmentLadderProps {
  onSeeHowItWorks: () => void;
  onRequestHealthCheck: () => void;
  onExploreSoftware: () => void;
}

interface LadderStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  commitmentLevel: 'Zero Risk' | 'Low Effort' | 'Confidential' | 'High Value' | 'Hands-On' | 'Full Rollout';
  commitmentBadgeColor: 'emerald' | 'cyan' | 'indigo' | 'amber' | 'purple' | 'rose';
  duration: string;
  description: string;
  whatYouGive: string;
  whatYouGet: string;
  ctaText: string;
  action: 'tour' | 'audit' | 'software';
}

const LADDER_STEPS: LadderStep[] = [
  {
    stepNumber: 1,
    title: 'See How Audit Works',
    subtitle: 'Zero Commitment · Instant',
    commitmentLevel: 'Zero Risk',
    commitmentBadgeColor: 'emerald',
    duration: '2 minutes',
    description: 'Explore the live interactive simulator or watch a 2-minute walkthrough of a real factory inventory audit.',
    whatYouGive: 'Nothing required — no email, no credit card',
    whatYouGet: 'Clear understanding of dead stock detection & OTIF calculations',
    ctaText: 'Watch 2-Min Demo',
    action: 'tour',
  },
  {
    stepNumber: 2,
    title: 'Request Inventory Health Check',
    subtitle: 'Low Friction Request',
    commitmentLevel: 'Low Effort',
    commitmentBadgeColor: 'cyan',
    duration: '60 seconds',
    description: 'Fill a short form with your plant profile (industry, inventory size, key pain point) to reserve 1 of 3 pilot slots.',
    whatYouGive: 'Company name, plant size, primary operational challenge',
    whatYouGet: 'Audit readiness checklist & direct slot reservation with founder',
    ctaText: 'Request Health Check',
    action: 'audit',
  },
  {
    stepNumber: 3,
    title: 'Share Inventory Export',
    subtitle: 'Confidential Local Processing',
    commitmentLevel: 'Confidential',
    commitmentBadgeColor: 'indigo',
    duration: '5 minutes',
    description: 'Export an existing inventory stock register from Tally, SAP, Busy, or Excel and drop it into the Smart Mapper.',
    whatYouGive: 'Stock dump spreadsheet (.xlsx or .csv)',
    whatYouGet: 'Smart column matching and private local session analysis',
    ctaText: 'Open Smart Mapper',
    action: 'audit',
  },
  {
    stepNumber: 4,
    title: 'Review Forensic Findings',
    subtitle: 'Direct 1-on-1 Founder Consultation',
    commitmentLevel: 'High Value',
    commitmentBadgeColor: 'amber',
    duration: '48-hour delivery',
    description: 'Founder C. Jones Snowin personally reviews your inventory anomalies and presents an executive diagnostic report.',
    whatYouGive: '30 minutes of operational leadership time',
    whatYouGet: 'Dead stock ₹ amount, top 10 trapped SKUs, and debit note drafts',
    ctaText: 'Book Audit Review',
    action: 'audit',
  },
  {
    stepNumber: 5,
    title: 'Start 30-Day Pilot',
    subtitle: 'Targeted Proof of Value',
    commitmentLevel: 'Hands-On',
    commitmentBadgeColor: 'purple',
    duration: '30 days',
    description: 'Run Operationalyst across 1 production line, warehouse bay, or supplier cluster to prove capital recovery in practice.',
    whatYouGive: 'Active weekly standup involvement',
    whatYouGet: 'Verified working capital recovered and OTIF increase proof',
    ctaText: 'Explore Pilot Terms',
    action: 'software',
  },
  {
    stepNumber: 6,
    title: 'Adopt Operationalyst',
    subtitle: 'Full Multi-Engine Operating System',
    commitmentLevel: 'Full Rollout',
    commitmentBadgeColor: 'emerald',
    duration: 'Ongoing',
    description: 'Deploy all 5 engines (Dead Stock, OTIF, Margin Protection, Warehouse Trust, CEO Tower) factory-wide.',
    whatYouGive: 'Standard plant license once ROI is mathematically proven',
    whatYouGet: 'Permanent 3-minute Monday review and recurring margin protection',
    ctaText: 'Launch Live Software',
    action: 'software',
  },
];

export const CommitmentLadder: React.FC<CommitmentLadderProps> = ({
  onSeeHowItWorks,
  onRequestHealthCheck,
  onExploreSoftware,
}) => {
  const [selectedStep, setSelectedStep] = useState<number>(2);

  const activeStep = LADDER_STEPS.find((s) => s.stepNumber === selectedStep) || LADDER_STEPS[1];

  const handleStepCta = (action: 'tour' | 'audit' | 'software') => {
    if (action === 'tour') onSeeHowItWorks();
    else if (action === 'audit') onRequestHealthCheck();
    else onExploreSoftware();
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-7 md:p-8 space-y-6 shadow-2xl">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
          The 6-Step Commitment Ladder · No Forced Marriages
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-white">
          Small, Natural Steps Before Ever Buying Software
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          We don&apos;t ask you to overhaul your factory or sign multi-lakh contracts upfront.
          Every step delivers standalone value before you ever spend a rupee.
        </p>
      </div>

      {/* Interactive Step Navigator */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
        {LADDER_STEPS.map((s) => {
          const isSelected = selectedStep === s.stepNumber;
          return (
            <button
              key={s.stepNumber}
              onClick={() => setSelectedStep(s.stepNumber)}
              className={`p-3 rounded-xl text-left transition cursor-pointer border flex flex-col justify-between min-h-[92px] ${
                isSelected
                  ? 'bg-slate-950 border-amber-500/60 ring-1 ring-amber-500/30 shadow-lg'
                  : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800/80 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs font-mono font-bold ${
                    isSelected ? 'text-amber-400' : 'text-slate-500'
                  }`}
                >
                  Step 0{s.stepNumber}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{s.duration}</span>
              </div>
              <div
                className={`text-xs font-bold leading-tight mt-1 ${
                  isSelected ? 'text-white' : 'text-slate-300'
                }`}
              >
                {s.title}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                {s.commitmentLevel}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Deep-Dive Card */}
      <div className="p-5 sm:p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                Step 0{activeStep.stepNumber} of 06
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {activeStep.commitmentLevel}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs font-mono text-slate-400">{activeStep.duration}</span>
            </div>
            <h4 className="text-lg sm:text-xl font-black text-white">{activeStep.title}</h4>
          </div>

          <button
            onClick={() => handleStepCta(activeStep.action)}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md touch-manipulation active:scale-95 shrink-0"
          >
            <span>{activeStep.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {activeStep.description}
        </p>

        {/* What You Give vs What You Get */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs">
          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="text-[10px] uppercase text-slate-400 font-bold">What you provide:</div>
            <div className="text-slate-200 font-semibold">{activeStep.whatYouGive}</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900 border border-emerald-500/30 bg-emerald-950/10 space-y-1">
            <div className="text-[10px] uppercase text-emerald-300 font-bold">What you receive:</div>
            <div className="text-emerald-300 font-semibold">{activeStep.whatYouGet}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
