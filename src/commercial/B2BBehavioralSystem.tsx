/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
  ChevronRight,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  Sliders,
  Compass,
  Check,
  ExternalLink,
  Target,
  BarChart3,
  Search,
} from 'lucide-react';
import {
  STAKEHOLDER_PERSPECTIVES,
  OBJECTION_MATRIX,
  CUSTOMER_ANXIETY_MAP,
  BEHAVIORAL_ICEBERG_DIMENSIONS,
  StakeholderPerspective,
  ObjectionItem,
} from './homepageConfig';
import { trackEvent } from '../utils/analytics';

import type { BuyerPersona } from '../utils/leadValidation';

interface B2BBehavioralSystemProps {
  onRequestAudit: (source: string, buyerPersona?: BuyerPersona) => void;
  onViewSampleReport: (source: string) => void;
  onOpenIcebergModal: () => void;
  isFounderMode?: boolean;
}

const STAKEHOLDER_TO_PERSONA: Record<
  'economic_buyer' | 'champion' | 'user' | 'evaluator',
  BuyerPersona
> = {
  economic_buyer: 'ECONOMIC_BUYER',
  champion: 'INTERNAL_CHAMPION',
  user: 'PRIMARY_USER',
  evaluator: 'TECHNICAL_EVALUATOR',
};

export const B2BBehavioralSystem: React.FC<B2BBehavioralSystemProps> = ({
  onRequestAudit,
  onViewSampleReport,
  onOpenIcebergModal,
  isFounderMode = false,
}) => {
  // 1. Stakeholder Perspective Active Tab
  const [activeStakeholderId, setActiveStakeholderId] = useState<
    'economic_buyer' | 'champion' | 'user' | 'evaluator'
  >('economic_buyer');

  // 2. Objection Matrix Active Accordion
  const [activeObjectionId, setActiveObjectionId] = useState<string>('erp_exists');

  const activeStakeholder =
    STAKEHOLDER_PERSPECTIVES.find((s) => s.id === activeStakeholderId) ||
    STAKEHOLDER_PERSPECTIVES[0];

  const handleSelectStakeholder = (id: 'economic_buyer' | 'champion' | 'user' | 'evaluator') => {
    setActiveStakeholderId(id);
    trackEvent('data_trust_opened', { stakeholderLens: id });
  };

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* ===================================================================== */}
      {/* 1. PLANT STAKEHOLDER PERSPECTIVES                                     */}
      {/* ===================================================================== */}
      <section className="py-12 px-4 sm:px-6 bg-slate-900/60 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto space-y-8 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase">
                <Users className="w-3.5 h-3.5" />
                <span>Built for Every Seat in Plant Leadership</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Built for Owners, Plant Heads, Materials Teams &amp; Finance.
              </h2>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Inventory decisions involve operations, stores, procurement, and finance together. Select
                your role to see the exact questions and metrics the Factory Inventory Audit prepares for you:
              </p>
            </div>

            {isFounderMode && (
              <button
                type="button"
                onClick={onOpenIcebergModal}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-2 transition cursor-pointer self-start md:self-auto shrink-0"
                title="Inspect the 27 Behavioral Science Foundations"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Behavioral Science Iceberg</span>
              </button>
            )}
          </div>

          {/* Stakeholder Selector Tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5" role="tablist" aria-label="Plant Stakeholder Perspectives">
            {STAKEHOLDER_PERSPECTIVES.map((s) => {
              const isSelected = s.id === activeStakeholderId;
              return (
                <button
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  key={s.id}
                  onClick={() => handleSelectStakeholder(s.id)}
                  className={`p-3.5 rounded-2xl text-left transition cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-950 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-400">
                    {s.stakeholderType}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white mt-1 leading-snug">
                    {s.roleTitle}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stakeholder Deep-Dive Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-950 border border-slate-800 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: The Core Question & Outcome */}
              <div className="lg:col-span-2 space-y-5">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    The Primary Question You Need Answered:
                  </span>
                  <div className="text-base sm:text-lg font-bold text-white leading-snug">
                    “{activeStakeholder.coreQuestion}”
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
                    Target Operational Outcome:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeStakeholder.priorityOutcome}
                  </p>
                </div>

                {/* Operational Concern vs Safeguard */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Typical Operational Concern</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {activeStakeholder.unspokenAnxiety}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Operationalyst Safeguard</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {activeStakeholder.riskMitigation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Key Decision Metrics & Role CTA */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                    Priority Decision Metrics
                  </span>
                  <div className="space-y-2">
                    {activeStakeholder.keyMetrics.map((metric) => (
                      <div
                        key={metric}
                        className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-300 flex items-center gap-2"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{metric}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    data-testid={`request-audit-stakeholder-${activeStakeholder.id}`}
                    onClick={() =>
                      onRequestAudit(
                        `stakeholder_${activeStakeholder.id}`,
                        STAKEHOLDER_TO_PERSONA[activeStakeholder.id]
                      )
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md touch-manipulation active:scale-95"
                  >
                    <span>Request Audit for {activeStakeholder.stakeholderType}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[10px] text-slate-500 text-center font-mono">
                    Zero software installation · Works from existing Excel / ERP exports
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. STRAIGHT ANSWERS FOR PLANT LEADERSHIP                              */}
      {/* ===================================================================== */}
      <section className="py-12 px-4 sm:px-6 bg-slate-950 border border-slate-850 rounded-3xl shadow-xl">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>STRAIGHT ANSWERS FOR PLANT LEADERSHIP</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Practical Questions Manufacturing Teams Ask Before Sharing Data
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Skeptical questions are healthy in plant operations. Select any concern below to inspect how
              the audit handles your ERP setup, data confidentiality, and engineering judgement:
            </p>
          </div>

          {/* Interactive Objection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* List of Objections on Left/Mobile Top */}
            <div className="md:col-span-1 space-y-2">
              {OBJECTION_MATRIX.map((item) => {
                const isActive = item.id === activeObjectionId;
                return (
                  <button
                    type="button"
                    aria-expanded={isActive}
                    key={item.id}
                    onClick={() => setActiveObjectionId(item.id)}
                    className={`w-full p-3.5 rounded-xl text-left transition cursor-pointer border text-xs leading-snug flex items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-slate-900 border-amber-500/60 text-white font-bold shadow-md'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span>{item.objection}</span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        isActive ? 'text-amber-400 translate-x-0.5' : 'text-slate-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Detailed Objection Breakdown Card on Right */}
            {(() => {
              const selectedObjection =
                OBJECTION_MATRIX.find((o) => o.id === activeObjectionId) || OBJECTION_MATRIX[0];
              return (
                <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
                  <div className="space-y-1.5 border-b border-slate-800 pb-3">
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                      Common Question:
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {selectedObjection.objection}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="text-[11px] font-mono text-slate-400 uppercase font-bold">
                        Why Teams Ask This:
                      </div>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        {selectedObjection.underlyingAnxiety}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1">
                      <div className="text-[11px] font-mono text-emerald-400 uppercase font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>How Operationalyst Works:</span>
                      </div>
                      <p className="text-xs text-slate-200 font-sans leading-relaxed">
                        {selectedObjection.evidenceAndMechanism}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-1">
                      <div className="text-[11px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Operational Safeguard:</span>
                      </div>
                      <p className="text-xs text-slate-200 font-sans leading-relaxed">
                        {selectedObjection.institutionalGuarantee}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs font-mono text-slate-400">
                      <strong className="text-white">Next Safe Step:</strong> {selectedObjection.verificationStep}
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewSampleReport('objection_matrix')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold transition cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      Verify in Sample Audit
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>
    </div>
  );
};

// ============================================================================
// BEHAVIORAL SCIENCE ICEBERG MODAL (27 Dimensions Explored)
// ============================================================================

interface BehavioralIcebergModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVariant: (v: 'A' | 'B' | 'C') => void;
  currentVariant: 'A' | 'B' | 'C';
}

export const BehavioralIcebergModal: React.FC<BehavioralIcebergModalProps> = ({
  isOpen,
  onClose,
  onSelectVariant,
  currentVariant,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredDimensions = BEHAVIORAL_ICEBERG_DIMENSIONS.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.scope.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="iceberg-modal-title"
    >
      <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-4xl w-full p-4 sm:p-6 md:p-8 shadow-2xl border border-slate-750 relative space-y-6 my-6 max-h-[92vh] overflow-y-auto font-sans">
        {/* Top Watermark & Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                Behavioral Architecture v2.0
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs font-mono text-slate-400">Decision Science &amp; B2B Buying Systems</span>
            </div>
            <h2 id="iceberg-modal-title" className="text-xl sm:text-2xl font-black text-white">
              The Real Iceberg: 27 Dimensions of Behavioral Economics
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Moving beyond superficial marketing tricks (colors, timers, fake badges) into institutional trust,
              risk psychology, and organizational choice architecture.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Visual Iceberg Metaphor */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-850">
            <span className="font-bold uppercase text-slate-300">The Visual Contrast:</span>
            <span>Surface Tactics vs Deep Decision Science</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 space-y-1">
              <div className="text-[11px] font-bold text-rose-400 uppercase">Above Water (Superficial):</div>
              <p className="text-[11px] text-slate-300">
                Colors · Big CTA Buttons · Countdown Timers · Fake Reviews · Artificial Scarcity · Empty Jargon
              </p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <div className="text-[11px] font-bold text-emerald-400 uppercase">Below Water (Operationalyst):</div>
              <p className="text-[11px] text-slate-300">
                Prospect Theory · Risk Psychology · Choice Architecture · Cognitive Load · Mayer Trust Triad · JTBD
              </p>
            </div>
          </div>
        </div>

        {/* Live A/B/C Narrative Switcher */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase">
              Live Narrative Test (Message-Market Fit #22):
            </div>
            <span className="text-[10px] font-mono text-slate-400">Active Variant: Option {currentVariant}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onSelectVariant('A')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer font-mono text-xs ${
                currentVariant === 'A'
                  ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-[10px] text-emerald-400 uppercase">Variant A: Loss Aversion</div>
              <div className="text-[11px] mt-1 text-slate-200">“How Much of Your Inventory Has Stopped Moving?”</div>
            </button>

            <button
              type="button"
              onClick={() => onSelectVariant('B')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer font-mono text-xs ${
                currentVariant === 'B'
                  ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-[10px] text-cyan-400 uppercase">Variant B: Working Capital (JTBD)</div>
              <div className="text-[11px] mt-1 text-slate-200">“Find Working Capital Hidden Inside Inventory”</div>
            </button>

            <button
              type="button"
              onClick={() => onSelectVariant('C')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer font-mono text-xs ${
                currentVariant === 'C'
                  ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-[10px] text-amber-400 uppercase">Variant C: Risk &amp; Control</div>
              <div className="text-[11px] mt-1 text-slate-200">“Know Which Inventory Needs Attention Before Review”</div>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search all 27 behavioral dimensions (e.g. risk, cognitive load, trust, JTBD)..."
            className="bg-transparent w-full text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
          />
        </div>

        {/* 27 Dimensions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredDimensions.map((item) => (
            <div
              key={item.num}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-emerald-400 font-bold">{item.num}</span>
                <span className="text-slate-600">Implemented</span>
              </div>
              <div className="text-xs font-bold text-white">{item.name}</div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{item.scope}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs font-mono text-slate-400">
            Validated against empirical manufacturing decision science.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono cursor-pointer transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
