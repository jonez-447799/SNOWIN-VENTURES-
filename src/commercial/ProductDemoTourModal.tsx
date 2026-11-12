/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Package,
  Truck,
  Warehouse,
  Radio,
  ArrowRight,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ProductDemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchLiveDemo: () => void;
  onOpenAuditModal: () => void;
}

interface TourChapter {
  id: string;
  timeLabel: string;
  durationSec: number;
  title: string;
  speakerScript: string;
  keyMetric: string;
  metricLabel: string;
  highlightPillar: 'Dead Stock' | 'OTIF' | 'Warehouse' | 'Executive';
  icon: React.ReactNode;
  bulletPoints: string[];
}

const CHAPTERS: TourChapter[] = [
  {
    id: 'intro',
    timeLabel: '0:00 - 0:25',
    durationSec: 25,
    title: 'The Visibility Problem in Modern Factories',
    speakerScript:
      '"Most factories don\'t have a lack of data. They have a lack of visibility. Everyday reports are trapped in multiple Excel sheets and ERP exports. Today I\'ll show how Operationalyst helps manufacturers identify hidden inventory losses, dispatch risks, and operational leaks before they become expensive problems."',
    keyMetric: '₹18.5 Lakhs',
    metricLabel: 'Average Recoverable Capital Trapped in Pilot Units',
    highlightPillar: 'Executive',
    icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
    bulletPoints: [
      'Data scattered across Tally, ERP, gate registers & Excel sheets',
      'Management learns about failures weeks late in monthly meetings',
      'Operationalyst unifies fragmented data into one actionable view',
    ],
  },
  {
    id: 'dead_stock',
    timeLabel: '0:25 - 0:55',
    durationSec: 30,
    title: 'Dead Stock Recovery: Exposing Locked Capital',
    speakerScript:
      '"Let\'s start with inventory. Over here Operationalyst immediately identifies non-moving and slow-moving stock older than 180 days. Instead of manually reviewing hundreds of rows in Excel, management can instantly see where capital is trapped, which A-Class items are at risk, and generate 1-click vendor return debit notes."',
    keyMetric: '₹2.23L - ₹18.4L',
    metricLabel: 'Idle Inventory Flagged for Immediate Salvage / Return',
    highlightPillar: 'Dead Stock',
    icon: <Package className="w-5 h-5 text-rose-400" />,
    bulletPoints: [
      'Automated 180-day non-movement detection without manual filtering',
      'Pareto 80/20 analysis isolating top high-value locked items',
      'One-click export of Tally Debit Notes & Liquidation salvage quotes',
    ],
  },
  {
    id: 'otif',
    timeLabel: '0:55 - 1:25',
    durationSec: 30,
    title: 'Customer Delivery Performance (OTIF)',
    speakerScript:
      '"Next is delivery performance. This dashboard tracks On-Time In-Full (OTIF) customer fulfillment. Rather than discovering delivery failures after customer complaints and penalties arrive, dispatch teams can proactively spot root causes — whether machine breakdowns or transporter delays — and protect key OEM accounts."',
    keyMetric: '52% ➔ 88%',
    metricLabel: 'Customer Promise OTIF Reliability Improvement',
    highlightPillar: 'OTIF',
    icon: <Truck className="w-5 h-5 text-amber-400" />,
    bulletPoints: [
      'Strict On-Time + In-Full evaluation on factory gate departures',
      'Root-cause grouping: Production, Material, Carrier, or E-way bill',
      'Account-at-risk ranking identifying Tier-1 OEM revenue exposure',
    ],
  },
  {
    id: 'warehouse',
    timeLabel: '1:25 - 1:45',
    durationSec: 20,
    title: 'Warehouse Accuracy & 8:30 AM Gate Checks',
    speakerScript:
      '"Warehouse accuracy is another common challenge. Operationalyst compares physical count patterns and highlights potential control weaknesses before the factory shutter opens. The mobile 8:30 AM gate-check ensures high-velocity parts never cause unexpected assembly-line stoppages."',
    keyMetric: '96% Match',
    metricLabel: 'Physical Bin-to-System Inventory Accuracy Target',
    highlightPillar: 'Warehouse',
    icon: <Warehouse className="w-5 h-5 text-fuchsia-400" />,
    bulletPoints: [
      'Tablet-friendly 4-bin morning shutter audit before 8:30 AM shift',
      'Dynamic machine-hour stoppage loss calculation (₹8,500/hr)',
      'Pinpoint discrepancy tracking by specific warehouse spot & zone',
    ],
  },
  {
    id: 'executive',
    timeLabel: '1:45 - 2:05',
    durationSec: 20,
    title: 'CEO Dashboard: The 3-Minute Monday Morning Deck',
    speakerScript:
      '"Finally, leadership receives a single executive dashboard summarizing the overall health of operations. Instead of waiting for monthly review meetings, decision-makers get immediate visibility into cash, revenue, profit leaks, and weekly top priorities with accountable owners and deadlines."',
    keyMetric: '3 Minutes',
    metricLabel: 'Monday 9:00 AM Executive Operations Review Time',
    highlightPillar: 'Executive',
    icon: <Radio className="w-5 h-5 text-cyan-400" />,
    bulletPoints: [
      'Composite Factory Health Score (0-100) mapped to department heads',
      'Top 5 Monday Morning Priorities with SLA deadlines & escalation paths',
      'One-click WhatsApp Executive Briefing copy ready for leadership',
    ],
  },
];

export const ProductDemoTourModal: React.FC<ProductDemoTourModalProps> = ({
  isOpen,
  onClose,
  onLaunchLiveDemo,
  onOpenAuditModal,
}) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressSec, setProgressSec] = useState(0);

  const chapter = CHAPTERS[activeChapterIndex];

  // Auto-advance timer when playing
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = setInterval(() => {
      setProgressSec((prev) => {
        if (prev + 1 >= chapter.durationSec) {
          if (activeChapterIndex + 1 < CHAPTERS.length) {
            setActiveChapterIndex((idx) => idx + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return chapter.durationSec;
          }
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, activeChapterIndex, chapter.durationSec]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-modal-title"
    >
      <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-4xl w-full p-4 sm:p-6 md:p-7 shadow-2xl border border-indigo-500/30 relative space-y-5 my-6 max-h-[92vh] overflow-y-auto font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Interactive Guided Walkthrough · 2-Minute Product Tour</span>
              </span>
            </div>
            <h2 id="tour-modal-title" className="text-lg sm:text-xl md:text-2xl font-black text-white">
              How Operationalyst Recovers Factory Working Capital
            </h2>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
            aria-label="Close Product Tour Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Simulation Screen */}
        <div className="relative rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 p-4 sm:p-6 space-y-4 shadow-xl overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar of Video Player */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                {chapter.icon}
              </span>
              <div>
                <span className="text-[11px] font-mono uppercase text-indigo-400 font-bold">
                  Chapter {activeChapterIndex + 1} of {CHAPTERS.length} · {chapter.timeLabel}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {chapter.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer transition touch-manipulation active:scale-95 shadow-sm"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play Tour'}</span>
              </button>
              <button
                onClick={() => {
                  setProgressSec(0);
                  setIsPlaying(true);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title="Restart Chapter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Speaker Voiceover / Script Simulation Box */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-indigo-500/20 text-slate-200 text-xs sm:text-sm leading-relaxed italic relative">
            <div className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest not-italic mb-1">
              🎙️ Narration (Founder Walkthrough):
            </div>
            {chapter.speakerScript}
          </div>

          {/* Chapter Live Metrics & Bullet Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30 sm:col-span-1 flex flex-col justify-between">
              <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                Impact Highlight
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono my-1">
                {chapter.keyMetric}
              </div>
              <div className="text-[11px] text-slate-400 leading-tight">
                {chapter.metricLabel}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 sm:col-span-2 space-y-2">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                What This Delivers In Your Factory:
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {chapter.bulletPoints.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Progress Timeline Scrubber */}
          <div className="space-y-1.5 pt-2">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
              {CHAPTERS.map((ch, idx) => {
                let fillPct = 0;
                if (idx < activeChapterIndex) fillPct = 100;
                else if (idx === activeChapterIndex) fillPct = (progressSec / ch.durationSec) * 100;

                return (
                  <div
                    key={ch.id}
                    onClick={() => {
                      setActiveChapterIndex(idx);
                      setProgressSec(0);
                      setIsPlaying(true);
                    }}
                    className="flex-1 border-r border-slate-900 h-full bg-slate-800 cursor-pointer relative"
                    title={ch.title}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span>0:00</span>
              <span>Click any chapter to jump</span>
              <span>2:05 Total</span>
            </div>
          </div>
        </div>

        {/* Chapter Quick Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {CHAPTERS.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => {
                setActiveChapterIndex(idx);
                setProgressSec(0);
                setIsPlaying(true);
              }}
              className={`min-h-[44px] p-2 rounded-xl text-left border text-xs transition cursor-pointer touch-manipulation ${
                activeChapterIndex === idx
                  ? 'bg-indigo-600 text-white border-indigo-400 font-bold shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850'
              }`}
            >
              <div className="text-[10px] font-mono opacity-80">{ch.timeLabel}</div>
              <div className="truncate font-semibold mt-0.5">{ch.title.split(':')[0]}</div>
            </button>
          ))}
        </div>

        {/* Footer CTAs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Ready to test this with your own inventory and dispatch numbers?
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onLaunchLiveDemo();
              }}
              className="min-h-[44px] sm:min-h-0 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition touch-manipulation"
            >
              <span>Explore Live Command Center</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenAuditModal();
              }}
              className="min-h-[44px] sm:min-h-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md touch-manipulation active:scale-95"
            >
              <span>Get Free Factory Audit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
