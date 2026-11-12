/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Package,
  Layers,
  CheckCircle2,
  Building2,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface VideoAdSimulatorProps {
  onOpenAudit: () => void;
  className?: string;
}

interface StoryBeat {
  id: number;
  timeRange: string;
  startSec: number;
  endSec: number;
  label: string;
  screenVisual: string;
  hookLine: string;
  voiceoverScript: string;
  visualDetails: {
    title: string;
    description: string;
    dataPoint?: string;
    accentColor: 'rose' | 'amber' | 'emerald' | 'cyan' | 'indigo';
  };
}

const STORY_BEATS: StoryBeat[] = [
  {
    id: 1,
    timeRange: '0:00 - 0:03',
    startSec: 0,
    endSec: 3,
    label: 'The Cash Hook',
    screenVisual: 'Dark graphite screen + Glowing Excel spreadsheet row',
    hookLine: '₹? You know how much inventory you own.',
    voiceoverScript:
      '"You know how much inventory you own. Every month the balance sheet shows crores in raw materials and finished goods..."',
    visualDetails: {
      title: 'Gross Inventory On Books: ₹4,82,50,000',
      description: 'Standard ERP dump showing 12,400 line items across 4 store locations.',
      dataPoint: 'Total Value: ₹4.82 Cr',
      accentColor: 'indigo',
    },
  },
  {
    id: 2,
    timeRange: '0:04 - 0:08',
    startSec: 4,
    endSec: 8,
    label: 'The Hidden Loss',
    screenVisual: 'Red highlighted spreadsheet rows with >180 days idle timestamps',
    hookLine: '...But do you know how much of it isn\'t moving?',
    voiceoverScript:
      '"...But do you know how much of that inventory hasn\'t moved in 180 days? Behind every neat spreadsheet row, dead stock is silently eating working capital."',
    visualDetails: {
      title: 'Silent Cash Trap: Stagnant Stock (>180 Days)',
      description: 'SKU #BRG-4092 & #CSG-8812 flagged: Last movement 214 days ago.',
      dataPoint: 'Trapped Capital: ₹18.5 Lakhs',
      accentColor: 'rose',
    },
  },
  {
    id: 3,
    timeRange: '0:09 - 0:15',
    startSec: 9,
    endSec: 15,
    label: 'Forensic Breakdown',
    screenVisual: 'Automated Pareto analysis categorizing Non-Moving, Slow, and Active',
    hookLine: 'Operationalyst audits your existing sheets in minutes.',
    voiceoverScript:
      '"Operationalyst parses your existing Excel or Tally files, categorizes every SKU by velocity, and reveals exact recoverable capital — before monthly review meetings."',
    visualDetails: {
      title: 'Automated SKU Velocity & Recovery Breakdown',
      description: 'Pareto 80/20 segregation: ₹18.5L Non-Moving · ₹42L Slow-Moving · ₹12L Recoverable',
      dataPoint: 'Recovery Potential: ₹12.0L (80%)',
      accentColor: 'amber',
    },
  },
  {
    id: 4,
    timeRange: '0:16 - 0:22',
    startSec: 16,
    endSec: 22,
    label: 'Audit Methodology',
    screenVisual: 'Executive Factory Audit scorecard & 1-click debit note generation',
    hookLine: 'No ERP replacement. No software installation.',
    voiceoverScript:
      '"No ERP replacement. No multi-month IT overhaul. Just export your stock register, upload, and get an executive audit detailing dead stock, OTIF bottlenecks, and vendor contra debit notes."',
    visualDetails: {
      title: 'Forensic Audit Report Generated in 48 Hours',
      description: 'Auto-maps column headers, generates Tally-ready contra notes, identifies delivery risks.',
      dataPoint: 'Implementation Time: < 2 Hours',
      accentColor: 'cyan',
    },
  },
  {
    id: 5,
    timeRange: '0:23 - 0:27',
    startSec: 23,
    endSec: 27,
    label: 'The Brand Reality',
    screenVisual: 'Clean industrial manufacturing command view + CEO overview',
    hookLine: 'See what your inventory is really costing you.',
    voiceoverScript:
      '"Stop waiting for month-end surprises. See what your inventory is really costing you and recover your working capital today."',
    visualDetails: {
      title: 'Clear Operational Truth Over Disjointed Excel Tabs',
      description: 'A single command center combining Dead Stock, Dispatch OTIF, and Margin Leaks.',
      dataPoint: 'Average ROI: 8.4x Audit Value',
      accentColor: 'emerald',
    },
  },
  {
    id: 6,
    timeRange: '0:27 - 0:30',
    startSec: 27,
    endSec: 30,
    label: 'Real Scarcity Call To Action',
    screenVisual: 'High-contrast CTA card: Accepting 3 Pilot Audits for Founder Review',
    hookLine: 'Request Free Factory Audit (3 Pilot Spots Available)',
    voiceoverScript:
      '"Founder C. Jones Snowin is accepting 3 factory audits this month for direct personal review. Upload your data or request a confidential audit today."',
    visualDetails: {
      title: 'Accepting 3 Pilot Factory Audits for Founder Review',
      description: 'Founder personally reviews your inventory file and presents the 1-on-1 audit report.',
      dataPoint: 'Pilot Batch: 3 Factories Max',
      accentColor: 'emerald',
    },
  },
];

export const VideoAdSimulator: React.FC<VideoAdSimulatorProps> = ({ onOpenAudit, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSecond, setCurrentSecond] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Identify current beat based on currentSecond
  const currentBeat = STORY_BEATS.find(
    (b) => currentSecond >= b.startSec && currentSecond <= b.endSec
  ) || STORY_BEATS[0];

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentSecond((prev) => {
          if (prev >= 30) {
            setIsPlaying(false);
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (currentSecond >= 30) {
      setCurrentSecond(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handleSeek = (sec: number) => {
    setCurrentSecond(sec);
  };

  const restart = () => {
    setCurrentSecond(0);
    setIsPlaying(true);
  };

  const progressPercent = Math.min(100, Math.round((currentSecond / 30) * 100));

  return (
    <div className={`rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl ${className}`}>
      {/* Component Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Interactive 30-Second Video Ad Storyboard
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white">
            How Operationalyst Hooks Factory Owners in 30 Seconds
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
            title={soundEnabled ? 'Captions Enabled' : 'Mute Captions'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            <span className="text-[11px]">{soundEnabled ? 'Voiceover On' : 'Muted'}</span>
          </button>

          <span className="text-xs font-mono text-slate-400 tabular-nums px-2 py-1 rounded bg-slate-950 border border-slate-800">
            0:{currentSecond < 10 ? `0${currentSecond}` : currentSecond} / 0:30
          </span>
        </div>
      </div>

      {/* Main Video Simulator Viewport */}
      <div className="relative aspect-video sm:aspect-[21/9] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between p-4 sm:p-6 md:p-8 overflow-hidden select-none">
        {/* Subtle Grid Lines Overlay for Engineering Precision */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top Beat Status Tag */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950/80 border border-slate-700 text-xs font-mono font-bold text-slate-200 backdrop-blur-sm">
            <span className="text-amber-400">Beat {currentBeat.id}/6:</span>
            <span>{currentBeat.label}</span>
            <span className="text-slate-500">({currentBeat.timeRange})</span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-800">
            <Building2 className="w-3 h-3 text-indigo-400" />
            <span>Target: Mid-Sized Plant Owners</span>
          </div>
        </div>

        {/* Center Visual Mockup of What Video Frame Shows */}
        <div className="relative z-10 my-auto py-2 text-center max-w-2xl mx-auto space-y-3">
          {/* Main Visual Hook */}
          <div className="inline-block">
            <h4
              className={`text-xl sm:text-3xl md:text-4xl font-black tracking-tight ${
                currentBeat.visualDetails.accentColor === 'rose'
                  ? 'text-rose-300'
                  : currentBeat.visualDetails.accentColor === 'amber'
                  ? 'text-amber-300'
                  : currentBeat.visualDetails.accentColor === 'cyan'
                  ? 'text-cyan-300'
                  : currentBeat.visualDetails.accentColor === 'emerald'
                  ? 'text-emerald-300'
                  : 'text-indigo-200'
              }`}
            >
              {currentBeat.hookLine}
            </h4>
          </div>

          {/* Screen Content Simulation */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-left space-y-2 max-w-xl mx-auto shadow-xl">
            <div className="flex items-center justify-between gap-2 border-b border-slate-850 pb-2">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                {currentBeat.visualDetails.title}
              </span>
              {currentBeat.visualDetails.dataPoint && (
                <span className="text-xs font-mono font-black text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                  {currentBeat.visualDetails.dataPoint}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentBeat.visualDetails.description}
            </p>
          </div>
        </div>

        {/* Bottom Voiceover Caption Bar */}
        <div className="relative z-10">
          {soundEnabled && (
            <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/90 backdrop-blur-md text-center max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 text-[10px] uppercase font-mono text-amber-400 font-bold mb-0.5">
                <Volume2 className="w-3 h-3" />
                <span>Voiceover Narration (0:{currentSecond < 10 ? `0${currentSecond}` : currentSecond})</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-sans italic">
                {currentBeat.voiceoverScript}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress & Scrubbing Bar */}
      <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 space-y-3">
        {/* Timeline Slider */}
        <div className="space-y-1">
          <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden cursor-pointer">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="30"
            value={currentSecond}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full h-1 opacity-0 cursor-pointer -mt-3 absolute z-20"
            title="Scrub video timeline"
          />
        </div>

        {/* Control Buttons & Beat Jumpers */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Play/Pause & Reset Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="min-h-[38px] px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs font-mono flex items-center gap-1.5 cursor-pointer transition shadow-md touch-manipulation active:scale-95"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{currentSecond >= 30 ? 'Replay' : 'Play Ad (30s)'}</span>
                </>
              )}
            </button>

            <button
              onClick={restart}
              className="min-h-[38px] p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs transition cursor-pointer touch-manipulation"
              title="Restart from 0:00"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Beat Jump Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {STORY_BEATS.map((beat) => {
              const isActive = currentBeat.id === beat.id;
              return (
                <button
                  key={beat.id}
                  onClick={() => handleSeek(beat.startSec)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800'
                  }`}
                >
                  {beat.id}. {beat.label.split(' ')[0]}
                </button>
              );
            })}
          </div>

          {/* Trigger Audit CTA Button */}
          <button
            onClick={onOpenAudit}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition touch-manipulation active:scale-95"
          >
            <span>Request Free Audit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
