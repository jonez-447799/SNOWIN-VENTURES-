/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  FileCheck2,
  Building2,
  Layers,
  RotateCcw,
  Sparkles,
  Lock,
  Eye,
  CheckSquare,
  Square,
  Clock,
  Play,
  Upload,
  Workflow,
  BarChart3,
  FlaskConical,
  Scale,
  Megaphone,
  Check,
  ChevronRight,
  Download,
} from 'lucide-react';
import { SampleAuditReportModal } from './SampleAuditReportModal';
import { InventoryChecklistModal } from './InventoryChecklistModal';
import { FactoryAuditModal } from './FactoryAuditModal';
import { CampaignAssetStudio } from './CampaignAssetStudio';
import { trackEvent } from '../utils/analytics';
import {
  downloadPilotDataKitCsv,
  downloadPilotDataKitXlsx,
} from '../utils/pilotDataKitExporter';
import { LegalGovernanceModal, LegalGovernanceTab } from './LegalGovernanceModal';
import { getReconciledSampleAuditModes, type SampleAuditModeId } from './homepageConfig';
import { SelfAssessmentWidget } from './SelfAssessmentWidget';
import type { BuyerPersona } from '../utils/leadValidation';
import type { SelfAssessmentEvaluation } from '../utils/selfAssessmentScorer';

interface FactoryAuditPageProps {
  onBackToHome?: () => void;
  onLaunchLiveDemo: (engine?: string) => void;
  onOpenSmartMapper?: () => void;
  onOpenLeadInbox?: () => void;
}

export const FactoryAuditPage: React.FC<FactoryAuditPageProps> = ({
  onBackToHome,
  onLaunchLiveDemo,
  onOpenSmartMapper,
  onOpenLeadInbox,
}) => {
  // Top Navigation View: Landing Page vs Persuasion Framework vs Testing Roadmap vs Campaign Studio
  const [activeSystemView, setActiveSystemView] = useState<'landing' | 'campaign' | 'framework' | 'roadmap'>('landing');

  // Active Hero Angle / Frame
  // A: Loss frame ("How Much of Your Inventory Has Stopped Moving?")
  // B: Money frame ("Find Working Capital Hidden Inside Inventory")
  // C: Control frame ("Know Which Inventory Needs Attention Before Your Next Review")
  const [heroFrame, setHeroFrame] = useState<'A' | 'B' | 'C'>('A');
  const [auditSampleModeId, setAuditSampleModeId] = useState<SampleAuditModeId>('sandbox_20');
  const auditSampleModes = getReconciledSampleAuditModes();
  const activeAuditSampleMode = auditSampleModes[auditSampleModeId] || auditSampleModes.sandbox_20;

  // Modal States
  const [isSampleReportOpen, setIsSampleReportOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalGovernanceTab>('privacy');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditModalSource, setAuditModalSource] = useState<string>('factory_audit_page');
  const [auditModalPersona, setAuditModalPersona] = useState<BuyerPersona | undefined>(undefined);
  const [auditModalDiagnostic, setAuditModalDiagnostic] = useState<
    SelfAssessmentEvaluation | undefined
  >(undefined);

  const handleOpenSampleModal = () => {
    trackEvent('sample_report_clicked', { source: 'factory_audit_page' });
    setIsSampleReportOpen(true);
  };

  const handleOpenAuditModal = (
    source: string,
    persona?: BuyerPersona,
    diagnostic?: SelfAssessmentEvaluation
  ) => {
    trackEvent('pilot_form_started', { source, persona });
    setAuditModalSource(source);
    setAuditModalPersona(persona);
    setAuditModalDiagnostic(diagnostic);
    setIsAuditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* ===================================================================== */}
      {/* TOP SYSTEM NAV: UNIFIED CONTROL STRIP                                 */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="min-h-[40px] px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-750 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition touch-manipulation"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Overview</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-base font-black text-white tracking-tight">
                  Factory Inventory Audit
                </span>
                <span className="hidden md:inline-block ml-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Ad Destination &amp; Conversion Hub
                </span>
              </div>
            </div>
          </div>

          {/* 4-in-1 Unified Architecture Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveSystemView('landing')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSystemView === 'landing'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Audit Landing Page</span>
            </button>

            <button
              onClick={() => setActiveSystemView('campaign')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSystemView === 'campaign'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                  : 'text-amber-400 hover:text-white'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Campaign Studio</span>
              <span className="sm:hidden">Ads</span>
            </button>

            <button
              onClick={() => setActiveSystemView('framework')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSystemView === 'framework'
                  ? 'bg-slate-800 text-white font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Persuasion Flow</span>
            </button>

            <button
              onClick={() => setActiveSystemView('roadmap')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSystemView === 'roadmap'
                  ? 'bg-slate-800 text-white font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Roadmap</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* VIEW 1: FACTORY AUDIT LANDING PAGE (AD DESTINATION)                    */}
      {/* ===================================================================== */}
      {activeSystemView === 'landing' && (
        <div className="space-y-16 sm:space-y-24 pb-20">
          {/* SECTION 1: HERO */}
          <section className="relative pt-12 pb-14 sm:pt-20 sm:pb-20 px-4 sm:px-6 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-gradient-to-b from-emerald-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

            <div className="max-w-4xl mx-auto text-center space-y-6 relative">
              {/* Eyebrow Label */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-mono font-bold tracking-widest uppercase">
                <span>FACTORY INVENTORY AUDIT</span>
              </div>

              {/* Dominant Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                {heroFrame === 'A' && 'How Much of Your Inventory Has Stopped Moving?'}
                {heroFrame === 'B' && 'Find Working Capital Hidden Inside Inventory'}
                {heroFrame === 'C' && 'Know Which Inventory Needs Attention Before Your Next Review'}
              </h1>

              {/* Supporting Copy */}
              <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                Operationalyst turns existing manufacturing inventory data into a structured analysis of
                non-moving stock, slow-moving inventory, ageing exposure and items requiring management attention.
              </p>

              {/* Primary & Secondary Call to Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handleOpenAuditModal('audit_page_hero')}
                  className="w-full sm:w-auto min-h-[50px] px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition shadow-xl touch-manipulation active:scale-95"
                >
                  <span>Request a Pilot Audit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleOpenSampleModal}
                  className="w-full sm:w-auto min-h-[50px] px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-200 font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition touch-manipulation active:scale-95"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>View Sample Audit</span>
                </button>
              </div>

              {/* Small Trust Line */}
              <p className="text-xs text-slate-400 max-w-xl mx-auto font-mono">
                Start with an existing inventory export. Scope and data requirements are agreed before analysis.
              </p>
            </div>
          </section>

          {/* SECTION 2: PROBLEM RECOGNITION */}
          <section className="px-4 sm:px-6 max-w-4xl mx-auto">
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  PROBLEM RECOGNITION
                </span>
                <h2 className="text-xl sm:text-3xl font-black text-white">
                  Your Inventory Total Doesn’t Tell the Whole Story.
                </h2>
              </div>

              {/* Four Direct Questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                  <div className="text-amber-400 font-bold text-[10px] uppercase">Question 01</div>
                  <h3 className="text-sm font-bold text-white">Which SKUs haven’t moved?</h3>
                  <p className="text-slate-400 font-sans text-xs">
                    Items sitting on store racks with zero issue transactions across multiple quarters.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                  <div className="text-amber-400 font-bold text-[10px] uppercase">Question 02</div>
                  <h3 className="text-sm font-bold text-white">How long have they been inactive?</h3>
                  <p className="text-slate-400 font-sans text-xs">
                    Classifying velocity decay across 90, 180, and 365+ day aging brackets.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                  <div className="text-amber-400 font-bold text-[10px] uppercase">Question 03</div>
                  <h3 className="text-sm font-bold text-white">Where is inventory value concentrated?</h3>
                  <p className="text-slate-400 font-sans text-xs">
                    Isolating the Pareto 80/20 parts that carry the majority of idle capital.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                  <div className="text-amber-400 font-bold text-[10px] uppercase">Question 04</div>
                  <h3 className="text-sm font-bold text-white">Which items deserve attention first?</h3>
                  <p className="text-slate-400 font-sans text-xs">
                    Clear priority ranking so floor teams focus on actionable high-impact items.
                  </p>
                </div>
              </div>

              {/* Section Note */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center">
                <p className="text-xs sm:text-sm font-bold text-emerald-300">
                  The answers may already exist inside your inventory data.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 2B: 5-QUESTION SELF-ASSESSMENT */}
          <section className="px-4 sm:px-6 max-w-4xl mx-auto">
            <SelfAssessmentWidget
              onRequestAudit={(diagnostic) =>
                handleOpenAuditModal('audit_page_self_assessment', 'GENERAL', diagnostic)
              }
              onViewSampleReport={handleOpenSampleModal}
            />
          </section>

          {/* SECTION 3: HOW OPERATIONALYST WORKS (5 STEPS) */}
          <section className="px-4 sm:px-6 max-w-5xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                HOW OPERATIONALYST WORKS
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                5 Structured Steps to Clear Inventory Action
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                { step: '01', title: 'Export', desc: 'Use an approved ERP or inventory export.' },
                { step: '02', title: 'Validate', desc: 'Agree on definitions, fields and analysis scope.' },
                { step: '03', title: 'Analyse', desc: 'Review movement, ageing, value concentration and relevant inventory patterns.' },
                { step: '04', title: 'Prioritise', desc: 'Identify SKUs and categories requiring investigation.' },
                { step: '05', title: 'Review', desc: 'Receive structured findings and discuss possible next actions.' },
              ].map((s) => (
                <div
                  key={s.step}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-lg font-black font-mono text-emerald-400">{s.step}</span>
                    <h3 className="text-sm font-bold text-white font-mono">{s.title}</h3>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4: WHAT YOU RECEIVE */}
          <section className="px-4 sm:px-6 max-w-5xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                DELIVERABLE SCOPE
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                What You Receive: Factory Inventory Audit
              </h2>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs font-mono">
                {[
                  'Data-quality overview',
                  'Non-moving-stock classification',
                  'Slow-moving-stock analysis',
                  'Inventory-ageing review',
                  'High-value exposure',
                  'Priority SKU/category list',
                  'Documented assumptions',
                  'Executive findings summary',
                  'Findings review call',
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 flex items-center gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-200 font-semibold">{item}</span>
                  </div>
                ))}
              </div>

              {/* Crucial Trust Statement */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-3xl mx-auto">
                  Operationalyst identifies patterns and review priorities from supplied data. Findings depend
                  on data completeness and agreed definitions and do not guarantee financial recovery.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 5: SAMPLE AUDIT (RECONCILED 2-MODE DEMO) */}
          <section className="px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                SAMPLE AUDIT • RECONCILED METRICS
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                See What the Analysis Looks Like
              </h2>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
              {/* Prominent Label & Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  {activeAuditSampleMode.badge}
                </span>
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setAuditSampleModeId('sandbox_20')}
                    className={`px-3 py-1 rounded-lg border font-bold cursor-pointer transition ${
                      auditSampleModeId === 'sandbox_20'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Mode A: 20-SKU Sandbox
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditSampleModeId('illustrative_12400')}
                    className={`px-3 py-1 rounded-lg border font-bold cursor-pointer transition ${
                      auditSampleModeId === 'illustrative_12400'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Mode B: 12,400-SKU Plant Case
                  </button>
                </div>
              </div>

              {/* Reconciled Representation Box */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-850 font-mono text-xs space-y-3">
                <div className="text-[11px] font-bold text-slate-300 uppercase pb-2 border-b border-slate-850">
                  INVENTORY REVIEW ({activeAuditSampleMode.shortLabel})
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">Inventory analysed</span>
                    <span className="text-white font-bold">
                      {activeAuditSampleMode.totalBookValueFormatted}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">SKUs analysed</span>
                    <span className="text-white font-bold">
                      {activeAuditSampleMode.skusEvaluatedText}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">Potentially non-moving</span>
                    <span className="text-rose-400 font-bold">
                      {activeAuditSampleMode.deadStockValueFormatted} ({activeAuditSampleMode.deadStockSubtext})
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">Slow-moving</span>
                    <span className="text-amber-400 font-bold">
                      {activeAuditSampleMode.slowMovingValueFormatted} ({activeAuditSampleMode.slowMovingSubtext})
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">Priority review</span>
                    <span className="text-emerald-400 font-bold">
                      {activeAuditSampleMode.prioritySkusHeadline} ({activeAuditSampleMode.prioritySkusSubtext})
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Highest exposure category</span>
                    <span className="text-cyan-400 font-bold">
                      {activeAuditSampleMode.topCategoryName}
                    </span>
                  </div>
                </div>

                {/* Connected Multi-Pillar Pills */}
                <div className="pt-3 border-t border-slate-850 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-400 font-bold uppercase">
                    Connected Plant Modules:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 font-bold">
                      {activeAuditSampleMode.p2OtifPill}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                      {activeAuditSampleMode.p3FreightPill}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
                      {activeAuditSampleMode.p4BinPill}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={handleOpenSampleModal}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs font-mono transition cursor-pointer"
                >
                  [ View Full Sample Audit ]
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 6: TRUST & DATA POLICIES (8 EXPLICIT POLICIES) */}
          <section className="px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                DATA &amp; GOVERNANCE
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Know What Happens Before Sharing Data
              </h2>
              <p className="text-xs text-slate-400 max-w-xl mx-auto">
                Review our exact policies before requesting an audit:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-mono text-slate-300">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <strong className="text-white">1. Required fields:</strong>
                <p className="text-slate-400 font-sans text-xs">
                  Only 5 fields: Part Identifier, Description, Quantity on Hand, Unit Cost, and Last Movement Date.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <strong className="text-white">2. Optional fields:</strong>
                <p className="text-slate-400 font-sans text-xs">
                  Bin location, category group, and reorder levels (helpful for floor action, but completely optional).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <strong className="text-white">3. Anonymisation:</strong>
                <p className="text-slate-400 font-sans text-xs">
                  You can mask part numbers and delete vendor/customer account names prior to sharing.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <strong className="text-white">4. Data access:</strong>
                <p className="text-slate-400 font-sans text-xs">
                  Only founder C. Jones Snowin accesses submitted information during manual analysis.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <strong className="text-white">5. Processing:</strong>
                <p className="text-slate-400 font-sans text-xs">
                  Processed in isolated sessions. Never transferred to public AI models or data brokers.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <strong className="text-white">6. Retention:</strong>
                <p className="text-slate-400 font-sans text-xs">
                  Retained strictly for the duration of the audit discussion (maximum 14 days) then permanently purged.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <strong className="text-white">7. Deletion:</strong>
                <p className="text-slate-400 font-sans text-xs">
                  Request immediate deletion anytime by emailing joneszz2004@gmail.com. Handled within 24 hours.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <strong className="text-white">8. Analytical limitations:</strong>
                <p className="text-slate-400 font-sans text-xs">
                  Does not make scrap decisions or replace engineering judgment regarding essential insurance spares.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 7: PILOT CTA */}
          <section id="pilot-form" className="px-4 sm:px-6 max-w-3xl mx-auto space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  FOUNDER-LED PILOT PROGRAM
                </span>
                <h2 className="text-xl sm:text-3xl font-black text-white">
                  Help Us Validate Operationalyst With Real Manufacturing Data
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-sans">
                  We&apos;re looking for manufacturing teams willing to evaluate the Factory Inventory Audit
                  and give direct feedback on its usefulness and clarity.
                </p>
              </div>

              {/* Benefits Checklist */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-2 font-mono text-xs">
                {[
                  'Founder-led review',
                  'Defined scope',
                  'Clear deliverables',
                  'Findings discussion',
                  'No automatic subscription',
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs text-slate-300 space-y-3">
                <div className="font-mono font-bold text-emerald-300">
                  Do not upload confidential inventory files in Step 1.
                </div>
                <p>
                  Data scope, the 5-column export template, and part-number anonymization options are confirmed after suitability review. You can preview the exact 5-column template below:
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => downloadPilotDataKitXlsx()}
                    className="px-3.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download 5-Column Data Guide (.XLSX)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadPilotDataKitCsv()}
                    className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    <span>Download Blank CSV Template</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAuditModal('audit_page_pilot_section')}
                className="w-full min-h-[48px] py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-xl touch-manipulation active:scale-95"
              >
                <span>Request a Pilot Audit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: CAMPAIGN ASSET STUDIO & SALES ENGINE (PHASE 2)                 */}
      {/* ===================================================================== */}
      {activeSystemView === 'campaign' && (
        <section className="py-8 px-4 sm:px-6 max-w-6xl mx-auto animate-in fade-in duration-200">
          <CampaignAssetStudio
            onNavigateToAuditWithAd={(adId) => {
              setActiveSystemView('landing');
              if (adId === 'A') setHeroFrame('A');
              if (adId === 'B') setHeroFrame('B');
              if (adId === 'C') setHeroFrame('C');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onClose={() => setActiveSystemView('landing')}
          />
        </section>
      )}

      {/* ===================================================================== */}
      {/* VIEW 3: THE PERSUASION FRAMEWORK (11-STAGE SEQUENCE)                  */}
      {/* ===================================================================== */}
      {activeSystemView === 'framework' && (
        <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              Behavioral Science Without Manipulation · Cialdini &amp; NN/g Aligned
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              The 11-Stage Buyer Psychological Sequence
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
              How a sophisticated factory buyer moves naturally from latent curiosity to verified pilot adoption without deception.
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {[
              {
                step: '01',
                stage: 'ATTENTION',
                prompt: '“Could some of our inventory actually be inactive?”',
                action: 'First screen directs focus to inactive capital, not software complexity.',
              },
              {
                step: '02',
                stage: 'SELF-DIAGNOSIS',
                prompt: '“How much? Which SKUs? For how long?”',
                action: 'Self-recognition warning signs allow prospect to recognize pain internally.',
              },
              {
                step: '03',
                stage: 'ECONOMIC RELEVANCE',
                prompt: '“This may deserve investigation.”',
                action: '4 core diagnostic questions prove relevance without asking for personal information.',
              },
              {
                step: '04',
                stage: 'CURIOSITY',
                prompt: '“Can Operationalyst show me?”',
                action: 'Visual flow demonstrates spreadsheet Ingestion ➔ Analysis ➔ Breakdown.',
              },
              {
                step: '05',
                stage: 'LOW-RISK COMMITMENT',
                prompt: '“Let me see the sample audit.”',
                action: 'Transparent sample preview with watermarked neutral numbers.',
              },
              {
                step: '06',
                stage: 'TRUST',
                prompt: '“The methodology makes sense.”',
                action: '6 explainable algorithmic steps published openly.',
              },
              {
                step: '07',
                stage: 'AUTHORITY',
                prompt: '“They seem to understand this problem.”',
                action: 'Operator-to-operator language written around warehouse realities.',
              },
              {
                step: '08',
                stage: 'PROOF',
                prompt: '“This produces useful findings on actual manufacturing data.”',
                action: 'Documented deliverables schema with verified findings.',
              },
              {
                step: '09',
                stage: 'PERSONALIZATION',
                prompt: '“Let’s analyse our data.”',
                action: 'Confidential founder-led pilot audit application.',
              },
              {
                step: '10',
                stage: 'VALUE',
                prompt: '“These findings are relevant to us.”',
                action: '1-on-1 findings review call with founder C. Jones Snowin.',
              },
              {
                step: '11',
                stage: 'SALE',
                prompt: '“Let’s continue using this.”',
                action: 'Natural adoption after verified value, zero bait-and-switch.',
              },
            ].map((s) => (
              <div
                key={s.step}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-amber-400 shrink-0">
                    {s.step}
                  </span>
                  <div>
                    <span className="text-white font-bold text-sm">{s.stage}</span>
                    <span className="text-slate-400 block text-xs font-sans italic mt-0.5">
                      {s.prompt}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-300 font-sans sm:text-right max-w-sm">
                  {s.action}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* VIEW 4: TESTING ROADMAP & HERO FRAMES                                 */}
      {/* ===================================================================== */}
      {activeSystemView === 'roadmap' && (
        <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
              Empirical Optimization · One Variable At A Time
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              The Operationalyst Testing Roadmap
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
              We test psychology rather than merely believing in it. Measure qualified audit requests, not empty clicks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Experiment 01: Hero Frame Testing</h3>
                <p className="text-xs text-slate-400">Three distinct cognitive angles testing response rates.</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-xs">
                <button
                  onClick={() => setHeroFrame('A')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
                    heroFrame === 'A'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A: Loss Frame
                </button>
                <button
                  onClick={() => setHeroFrame('B')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
                    heroFrame === 'B'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  B: Money Frame
                </button>
                <button
                  onClick={() => setHeroFrame('C')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
                    heroFrame === 'C'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  C: Control Frame
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Currently Active Hero Headline (Variant {heroFrame}):
              </span>
              <div className="text-lg sm:text-xl font-black text-white">
                {heroFrame === 'A' && '“How Much of Your Inventory Has Stopped Moving?” (Loss Frame)'}
                {heroFrame === 'B' && '“Find Working Capital Hidden Inside Inventory” (Money Frame)'}
                {heroFrame === 'C' && '“Know Which Inventory Needs Attention Before Your Next Review” (Control Frame)'}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-850 bg-slate-950 py-6 px-4 sm:px-6 text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Operationalyst Factory Inventory Audit · Built by C. Jones Snowin
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setLegalModalTab('privacy');
                setIsLegalModalOpen(true);
              }}
              className="text-slate-400 hover:text-emerald-300 underline underline-offset-4 cursor-pointer"
            >
              Privacy &amp; Data Governance Policy
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                setLegalModalTab('terms');
                setIsLegalModalOpen(true);
              }}
              className="text-slate-400 hover:text-emerald-300 underline underline-offset-4 cursor-pointer"
            >
              Pilot Audit Terms of Service
            </button>
          </div>
        </div>
      </footer>

      <FactoryAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        sourceView={auditModalSource}
        initialBuyerPersona={auditModalPersona}
        diagnosticAttachment={auditModalDiagnostic}
      />

      <LegalGovernanceModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
        onRequestAudit={() => handleOpenAuditModal('audit_page_legal_modal')}
      />

      {/* Sample Report & Checklist Modals */}
      <SampleAuditReportModal
        isOpen={isSampleReportOpen}
        onClose={() => setIsSampleReportOpen(false)}
        onRequestAudit={() => {
          setIsSampleReportOpen(false);
          handleOpenAuditModal('sample_report_modal');
        }}
      />

      <InventoryChecklistModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        onRequestAudit={() => {
          setIsChecklistOpen(false);
          handleOpenAuditModal('checklist_modal');
        }}
      />
    </div>
  );
};
