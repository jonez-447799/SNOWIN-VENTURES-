/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet,
  PhoneCall,
  Sparkles,
  Layers,
  Clock,
  Mail,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Building2,
  ExternalLink,
} from 'lucide-react';

interface AdToDemoFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuditPage: () => void;
  onLaunchLiveDemo: (engine?: string) => void;
}

export const AdToDemoFunnelModal: React.FC<AdToDemoFunnelModalProps> = ({
  isOpen,
  onClose,
  onOpenAuditPage,
  onLaunchLiveDemo,
}) => {
  const [activeStage, setActiveStage] = useState<number>(1);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="funnel-modal-title"
    >
      <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-4xl w-full p-4 sm:p-6 md:p-7 shadow-2xl border border-indigo-500/40 relative space-y-6 my-6 max-h-[92vh] overflow-y-auto font-sans">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
                Commercial Go-To-Market Engine
              </span>
              <span className="text-xs text-slate-400 font-mono">Stage {activeStage} of 6</span>
            </div>
            <h2 id="funnel-modal-title" className="text-lg sm:text-2xl font-black text-white">
              The 6-Stage Ad ➔ Factory Audit ➔ Demo Sales Machine
            </h2>
            <p className="text-xs text-slate-400">
              How Operationalyst converts cold factory owners into high-intent retained clients by selling outcomes, not software.
            </p>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
            aria-label="Close Funnel Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 Stage Navigation Stepper */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 font-mono text-[11px] font-bold">
          {[
            { num: 1, title: 'Ad Creative' },
            { num: 2, title: 'Audit Landing' },
            { num: 3, title: 'Email Response' },
            { num: 4, title: '5-Min Call' },
            { num: 5, title: 'Audit Reveal' },
            { num: 6, title: 'Software' },
          ].map((stg) => (
            <button
              key={stg.num}
              onClick={() => setActiveStage(stg.num)}
              className={`py-2 px-1 rounded-lg cursor-pointer transition text-center truncate ${
                activeStage === stg.num
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              {stg.num}. {stg.title}
            </button>
          ))}
        </div>

        {/* STAGE CONTENTS */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 min-h-[340px] flex flex-col justify-between space-y-4">
          {/* STAGE 1: THE AD */}
          {activeStage === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  Stage 1: LinkedIn &amp; Meta Targeted B2B Ad
                </span>
                <span className="text-[11px] font-mono text-slate-400">Targeting: Factory Owners, COOs, Plant Heads</span>
              </div>

              {/* Social Ad Mockup */}
              <div className="max-w-xl mx-auto rounded-xl bg-slate-900 border border-slate-750 p-4 space-y-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    OP
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Operationalyst · Sponsored</div>
                    <div className="text-[10px] text-slate-400">Manufacturing &amp; Inventory Intelligence</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-200">
                  <p className="font-bold text-white text-sm">
                    How Much Money Is Trapped In Your Factory Inventory?
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    Most factories have hidden working capital locked inside slow-moving and non-moving inventory. Upload your inventory report and receive a free operational audit.
                  </p>
                  <div className="space-y-1 text-slate-300 font-mono text-[11px] pt-1">
                    <div>✅ Dead stock exposure</div>
                    <div>✅ Working capital opportunity</div>
                    <div>✅ Delivery OTIF risks</div>
                    <div>✅ Priority actions for Monday standups</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="text-xs font-bold text-emerald-300">
                    Get Free Factory Audit · 100% Confidential
                  </div>
                  <button
                    onClick={() => setActiveStage(2)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black cursor-pointer"
                  >
                    Click Ad ➔
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
                💡 <strong>The Hard Truth:</strong> If you advertise &ldquo;Manufacturing Command Center&rdquo; you get curiosity. If you advertise &ldquo;We found ₹14 Lakhs trapped in inventory&rdquo; you get meetings.
              </div>
            </div>
          )}

          {/* STAGE 2: AUDIT LANDING PAGE */}
          {activeStage === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  Stage 2: Factory Audit Landing Page (Ad Destination)
                </span>
                <span className="text-[11px] font-mono text-slate-400">Conversion Rate Benchmark: 18–26%</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="text-base font-bold text-white">
                  Upload Your Inventory Report And Discover Where You&apos;re Losing Money
                </h3>
                <p className="text-xs text-slate-300">
                  Receive a free executive-level Factory Audit identifying dead stock, slow-moving inventory, and working capital release potential.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Accepted Files:</span>
                    <div className="text-white font-bold mt-0.5">Excel Sheet, Tally Export, ERP Dump, CSV</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">User Provides:</span>
                    <div className="text-white font-bold mt-0.5">Name, Company, Email, Phone</div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAuditPage();
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Live Factory Audit Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveStage(3)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    Next: View Confirmation Email ➔
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 3: AUTOMATED RESPONSE */}
          {activeStage === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  Stage 3: Automated Immediate Response Receipt
                </span>
                <span className="text-[11px] font-mono text-slate-400">Sent within 60 seconds</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-sans">
                <div className="border-b border-slate-800 pb-2 text-xs font-mono text-slate-400 space-y-1">
                  <div><strong>From:</strong> C. Jones Snowin &lt;joneszz2004@gmail.com&gt;</div>
                  <div><strong>Subject:</strong> Your Factory Audit Request Has Been Received</div>
                </div>

                <div className="space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
                  <p>Dear Factory Leader,</p>
                  <p>
                    Thank you. We&apos;ll review your inventory data and prepare an operational summary highlighting key opportunities and potential risks.
                  </p>
                  <p>
                    You will also receive a 15-minute walkthrough showing exactly which SKUs are trapping capital and how Operationalyst identifies these insights.
                  </p>
                  <p className="text-slate-400 font-mono text-[11px] pt-1">
                    Warm regards,<br />
                    <strong>C. Jones Snowin</strong><br />
                    Operations &amp; Manufacturing Analytics Builder
                  </p>
                </div>

                <button
                  onClick={() => setActiveStage(4)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Next: See 5-Minute Demo Call Script ➔
                </button>
              </div>
            </div>
          )}

          {/* STAGE 4: THE 5-MINUTE DEMO CALL */}
          {activeStage === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest">
                  Stage 4: The 5-Minute Discovery Call (Golden Rule)
                </span>
                <span className="text-[11px] font-mono text-rose-400 font-bold">⚠️ DO NOT SHOW DASHBOARD FIRST!</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <p className="text-xs text-slate-300">
                  Most founders rush to screenshare complex charts. Instead, spend the first 5 minutes asking these 4 specific questions:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-emerald-400 font-bold">Question 1:</span>
                    <p className="text-white mt-1">&ldquo;What is your total active inventory value right now?&rdquo;</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-amber-400 font-bold">Question 2:</span>
                    <p className="text-white mt-1">&ldquo;What is your biggest operational headache this month?&rdquo;</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-cyan-400 font-bold">Question 3:</span>
                    <p className="text-white mt-1">&ldquo;Which ERP or accounting system are you using (Tally, SAP, Excel)?&rdquo;</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-fuchsia-400 font-bold">Question 4:</span>
                    <p className="text-white mt-1">&ldquo;How long does your team spend compiling monthly review reports?&rdquo;</p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveStage(5)}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs cursor-pointer"
                  >
                    Next: Reveal The Audit Numbers ➔
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 5: SHOW THE AUDIT */}
          {activeStage === 5 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  Stage 5: Present Their Personalized Factory Audit
                </span>
                <span className="text-[11px] font-mono text-emerald-300 font-bold">Rupee Impact First</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-3 font-mono">
                <div className="text-xs text-slate-300">
                  Share the 1-page executive diagnostic on their factory data:
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Health Score</div>
                    <div className="text-lg font-black text-amber-400">68 / 100</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Dead Stock</div>
                    <div className="text-lg font-black text-rose-400">₹18.2 Lakhs</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Slow Moving</div>
                    <div className="text-lg font-black text-amber-300">₹42.0 Lakhs</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-500/40">
                    <div className="text-[10px] text-emerald-300 font-bold">Capital Recovery</div>
                    <div className="text-lg font-black text-emerald-400">₹14.5 Lakhs</div>
                  </div>
                </div>

                <div className="text-xs text-slate-300 font-sans pt-1">
                  <strong>Highest Risk Category:</strong> Raw Materials &amp; Structural Plates (38% of trapped cash).
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveStage(6)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer"
                  >
                    Next: Transition to Software Command Center ➔
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 6: THE SOFTWARE REVEAL */}
          {activeStage === 6 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
                  Stage 6: The Software Reveal (Context Earned)
                </span>
                <span className="text-[11px] font-mono text-emerald-300 font-bold">High Buyer Readiness</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/40 space-y-3 font-sans">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Now you say:
                </p>
                <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs sm:text-sm font-semibold text-indigo-200 italic">
                  &ldquo;Here&apos;s exactly how Operationalyst found these issues and how your team can monitor them continuously every Monday morning.&rdquo;
                </div>
                <p className="text-xs text-slate-400">
                  Now the dashboard has context. Now it feels like a high-ROI investment that pays for itself in the first 30 days.
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onLaunchLiveDemo('ceo_master');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>Launch CEO Master Command Center ➔</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onLaunchLiveDemo('standalone_p1');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    Open P1 Cash Recovery
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Footer Controls */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-3">
            <button
              onClick={() => setActiveStage((p) => Math.max(1, p - 1))}
              disabled={activeStage === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white disabled:opacity-40 text-xs font-mono font-bold cursor-pointer"
            >
              ← Previous Stage
            </button>

            <span className="text-[11px] font-mono text-slate-500">
              Interactive Funnel Walkthrough
            </span>

            <button
              onClick={() => setActiveStage((p) => Math.min(6, p + 1))}
              disabled={activeStage === 6}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-emerald-400 hover:text-emerald-300 disabled:opacity-40 text-xs font-mono font-bold cursor-pointer"
            >
              Next Stage →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
