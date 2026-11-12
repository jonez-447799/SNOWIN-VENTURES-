import React, { useState, useMemo, useRef } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  TrendingDown, 
  TrendingUp,
  Clock, 
  Package, 
  Target, 
  ShieldAlert, 
  ArrowRight, 
  Copy, 
  Check, 
  HelpCircle,
  Building2,
  Layers,
  Sparkles,
  BarChart3,
  ArrowUpRight,
  Activity,
  FileDown,
  Loader2,
  AlertOctagon,
  Calculator,
  SlidersHorizontal,
  Award,
  FlaskConical,
  Calendar,
  MessageSquare
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { OTIFMetrics, RulesConfig, DispatchRow } from '../types/otif';
import { calculateRowStatus } from '../utils/otifCalculator';

interface OwnerReportProps {
  metrics: OTIFMetrics;
  rules: RulesConfig;
  dispatches: DispatchRow[];
  onNavigateToSheet: (filterCustomer?: string, filterReason?: string) => void;
  onNavigateToDrill: () => void;
  onOpenROICalculator?: () => void;
  onOpenWhatIfSimulator?: () => void;
  onOpenCAPA8D?: () => void;
  onOpenCertificate?: (dispatch: DispatchRow) => void;
  onOpenPipeline?: () => void;
  onOpenRndLab?: () => void;
}

interface DailySparklinePoint {
  date: string;
  dayLabel: string;
  otif: number;
  dispatches: number;
  passes: number;
  fails: number;
  movingAvg: number;
  isLive: boolean;
}

/**
 * Sparkline chart visualizing the daily OTIF score trend over the last 30 days,
 * placed beneath the main KPI cards to provide quick visual context on recent performance fluctuations.
 */
export const DailyOTIFSparkline: React.FC<{
  dispatches: DispatchRow[];
  rules: RulesConfig;
}> = ({ dispatches, rules }) => {
  // Generate 30 days ending on 2026-09-28
  const sparklineData = useMemo<DailySparklinePoint[]>(() => {
    const calculated = dispatches.map(d => calculateRowStatus(d, rules));

    // Historical daily baseline (30 Aug to 14 Sep, 16 days)
    const historicalMap: Record<string, { otif: number; dispatches: number; passes: number; fails: number }> = {
      '2026-08-30': { otif: 25, dispatches: 4, passes: 1, fails: 3 },
      '2026-08-31': { otif: 33, dispatches: 3, passes: 1, fails: 2 },
      '2026-09-01': { otif: 33, dispatches: 3, passes: 1, fails: 2 },
      '2026-09-02': { otif: 25, dispatches: 4, passes: 1, fails: 3 },
      '2026-09-03': { otif: 50, dispatches: 2, passes: 1, fails: 1 },
      '2026-09-04': { otif: 0, dispatches: 2, passes: 0, fails: 2 },
      '2026-09-05': { otif: 33, dispatches: 3, passes: 1, fails: 2 },
      '2026-09-06': { otif: 50, dispatches: 2, passes: 1, fails: 1 },
      '2026-09-07': { otif: 0, dispatches: 1, passes: 0, fails: 1 },
      '2026-09-08': { otif: 40, dispatches: 5, passes: 2, fails: 3 },
      '2026-09-09': { otif: 50, dispatches: 2, passes: 1, fails: 1 },
      '2026-09-10': { otif: 33, dispatches: 3, passes: 1, fails: 2 },
      '2026-09-11': { otif: 60, dispatches: 5, passes: 3, fails: 2 },
      '2026-09-12': { otif: 50, dispatches: 2, passes: 1, fails: 1 },
      '2026-09-13': { otif: 33, dispatches: 3, passes: 1, fails: 2 },
      '2026-09-14': { otif: 40, dispatches: 5, passes: 2, fails: 3 },
    };

    const days: DailySparklinePoint[] = [];

    // Construct 30 dates ending on 2026-09-28
    const baseDate = new Date('2026-08-30T00:00:00');
    for (let i = 0; i < 30; i++) {
      const d = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayLabel = `${d.getDate()} ${months[d.getMonth()]}`;

      // Check if within live audit fortnight (15 Sep to 28 Sep)
      const isLive = dateKey >= '2026-09-15' && dateKey <= '2026-09-28';

      let otif = 0;
      let dispCount = 0;
      let passes = 0;
      let fails = 0;

      if (isLive) {
        // Find rows matching this day (based on promisedDate or actualOut)
        const dayRows = calculated.filter(r => r.promisedDate.startsWith(dateKey));
        dispCount = dayRows.length;
        if (dispCount > 0) {
          passes = dayRows.filter(r => r.otif).length;
          fails = dispCount - passes;
          otif = Math.round((passes / dispCount) * 100);
        } else {
          // If a day had 0 scheduled PO lines, carry forward previous day's run rate
          otif = days.length > 0 ? days[days.length - 1].otif : 50;
        }
      } else {
        const hist = historicalMap[dateKey] || { otif: 35, dispatches: 3, passes: 1, fails: 2 };
        otif = hist.otif;
        dispCount = hist.dispatches;
        passes = hist.passes;
        fails = hist.fails;
      }

      days.push({
        date: dateKey,
        dayLabel,
        otif,
        dispatches: dispCount,
        passes,
        fails,
        movingAvg: otif, // populated below
        isLive,
      });
    }

    // Compute 5-day rolling average
    for (let i = 0; i < days.length; i++) {
      const start = Math.max(0, i - 4);
      const slice = days.slice(start, i + 1);
      const avg = Math.round(slice.reduce((acc, curr) => acc + curr.otif, 0) / slice.length);
      days[i].movingAvg = avg;
    }

    return days;
  }, [dispatches, rules]);

  // Summary statistics for the 30-day sparkline
  const mean30 = Math.round(sparklineData.reduce((acc, d) => acc + d.otif, 0) / sparklineData.length);
  const liveDays = sparklineData.filter(d => d.isLive && d.dispatches > 0);
  const livePasses = liveDays.reduce((acc, d) => acc + d.passes, 0);
  const liveTotal = liveDays.reduce((acc, d) => acc + d.dispatches, 0);
  const liveOTIF = liveTotal > 0 ? Math.round((livePasses / liveTotal) * 100) : 50;
  const recent5 = sparklineData.slice(-5);
  const recent5Avg = Math.round(recent5.reduce((acc, d) => acc + d.otif, 0) / recent5.length);
  const first5 = sparklineData.slice(0, 5);
  const first5Avg = Math.round(first5.reduce((acc, d) => acc + d.otif, 0) / first5.length);
  const momentum = recent5Avg - first5Avg;

  return (
    <div className="industrial-card rounded-2xl p-4 sm:p-5 border border-white/10 shadow-lg space-y-3">
      {/* Sparkline Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Daily OTIF Score Trend (Last 30 Days)
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Sparkline
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              30 Aug – 28 Sep 2026: Visualizing daily score fluctuations &amp; 5-day rolling average beneath KPI summary.
            </p>
          </div>
        </div>

        {/* Quick Context Metric Badges */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            <span className="text-slate-400 text-[10px] block">30-Day Mean:</span>
            <span className="font-bold text-slate-200">{mean30}%</span>
          </div>
          <div className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Current Fortnight:</span>
            <span className="font-bold text-amber-400">{liveOTIF}%</span>
          </div>
          <div className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Momentum:</span>
            <span className={`font-bold ${momentum >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {momentum >= 0 ? `+${momentum}%` : `${momentum}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Sparkline Recharts Area Chart */}
      <div className="w-full h-32 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={sparklineData}
            margin={{ top: 8, right: 10, bottom: 4, left: -25 }}
          >
            <defs>
              <linearGradient id="otifDailyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="2 2" stroke="#334155" opacity={0.3} vertical={false} />

            <XAxis
              dataKey="dayLabel"
              interval={4}
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#475569' }}
              tickLine={{ stroke: '#475569' }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#475569' }}
              tickLine={{ stroke: '#475569' }}
            />

            {/* Target 85% threshold */}
            <ReferenceLine
              y={85}
              stroke="#06b6d4"
              strokeDasharray="3 3"
              label={{
                value: 'OEM 85%',
                position: 'insideTopRight',
                fill: '#06b6d4',
                fontSize: 9,
                fontFamily: 'monospace',
              }}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as DailySparklinePoint;
                return (
                  <div className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 shadow-2xl text-xs space-y-1 font-sans min-w-[190px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                      <span className="font-bold text-white font-mono">{d.dayLabel} 2026</span>
                      <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                        d.isLive ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {d.isLive ? 'Live Fortnight' : 'Baseline'}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between font-mono pt-0.5">
                      <span className="text-slate-400 text-[11px]">Daily OTIF Score:</span>
                      <span className={`font-black text-sm ${
                        d.otif >= 70 ? 'text-emerald-400' : d.otif >= 50 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {d.otif}%
                      </span>
                    </div>

                    {d.dispatches > 0 && (
                      <div className="text-[10px] text-slate-300 font-mono">
                        Loads: {d.passes} pass / {d.fails} fail (Total: {d.dispatches})
                      </div>
                    )}

                    <div className="text-[10px] text-amber-300/90 font-mono border-t border-slate-800/80 pt-0.5">
                      5-Day Rolling Trend: {d.movingAvg}%
                    </div>
                  </div>
                );
              }}
            />

            {/* Daily OTIF Filled Area */}
            <Area
              type="monotone"
              dataKey="otif"
              name="Daily OTIF"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#otifDailyGradient)"
            />

            {/* 5-Day Rolling Average Line */}
            <Line
              type="monotone"
              dataKey="movingAvg"
              name="5-Day Trend"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Sparkline Bottom Context strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-400 border-t border-slate-800/60 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" />
            <span className="text-slate-300">Daily Score</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 border-t border-dashed border-amber-400 inline-block" />
            <span className="text-slate-300">5-Day Rolling Trend</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 border-t border-dashed border-cyan-400 inline-block" />
            <span className="text-slate-300">85% OEM SLA</span>
          </span>
        </div>

        <div className="text-slate-400 text-[10px] italic">
          High volatility on single-dispatch days; sustained surge to 100% on multi-load releases (26–28 Sep).
        </div>
      </div>
    </div>
  );
};

export interface WeeklyTrendDataPoint {
  week: string;
  shortWeek: string;
  dateRange: string;
  Pass: number;
  Fail: number;
  Total: number;
  otifPercent: number;
  onTime: number;
  onTimePercent: number;
  inFull: number;
  inFullPercent: number;
  failLate: number;
  failShort: number;
  failLateAndShort: number;
  failMaterial: number;
  failQC: number;
  failVehicle: number;
  failPaperwork: number;
  failLabour: number;
  topReason: string;
  isHistorical?: boolean;
}

/**
 * Trend Analysis Section for the OwnerReport component:
 * Visualizes weekly OTIF performance trends based on historical dispatch records
 * using Recharts (ComposedChart, Stacked BarChart, and AreaChart), multi-view controls,
 * weekly SLA target reference line, and executive week-on-week progression cards.
 */
export const TrendAnalysisSection: React.FC<{
  dispatches: DispatchRow[];
  rules: RulesConfig;
  onNavigateToSheet?: (customer?: string, reason?: string) => void;
}> = ({ dispatches, rules, onNavigateToSheet }) => {
  const [chartView, setChartView] = useState<'composed' | 'stacked' | 'detailed' | 'area'>('composed');
  const [showOnTimeLine, setShowOnTimeLine] = useState(false);
  const [showInFullLine, setShowInFullLine] = useState(false);

  // Dynamically calculate weekly OTIF metrics across all dispatch records
  const weekData = useMemo<WeeklyTrendDataPoint[]>(() => {
    const calculated = dispatches.map(d => calculateRowStatus(d, rules));

    // Historical Baseline Week 36 (01 Sep – 07 Sep 2026)
    const w36: WeeklyTrendDataPoint = {
      week: 'Week 36 (01–07 Sep)',
      shortWeek: 'W36',
      dateRange: '01–07 Sep 2026',
      Pass: 5,
      Fail: 11,
      Total: 16,
      otifPercent: 31,
      onTime: 8,
      onTimePercent: 50,
      inFull: 10,
      inFullPercent: 63,
      failLate: 6,
      failShort: 3,
      failLateAndShort: 2,
      failMaterial: 4,
      failQC: 3,
      failVehicle: 2,
      failPaperwork: 1,
      failLabour: 1,
      topReason: 'Material short (4 loads)',
      isHistorical: true,
    };

    // Historical Baseline Week 37 (08 Sep – 14 Sep 2026)
    const w37: WeeklyTrendDataPoint = {
      week: 'Week 37 (08–14 Sep)',
      shortWeek: 'W37',
      dateRange: '08–14 Sep 2026',
      Pass: 7,
      Fail: 9,
      Total: 16,
      otifPercent: 44,
      onTime: 9,
      onTimePercent: 56,
      inFull: 13,
      inFullPercent: 81,
      failLate: 5,
      failShort: 3,
      failLateAndShort: 1,
      failMaterial: 3,
      failQC: 3,
      failVehicle: 2,
      failPaperwork: 1,
      failLabour: 0,
      topReason: 'QC hold & Material (3 loads each)',
      isHistorical: true,
    };

    // Dynamic Week 38 (15 Sep – 21 Sep 2026) from dispatches
    const w38Rows = calculated.filter(d => {
      const dateStr = (d.promisedDate || d.actualOut || '').split('T')[0];
      return dateStr >= '2026-09-15' && dateStr <= '2026-09-21';
    });
    const w38Passes = w38Rows.filter(r => r.otif).length;
    const w38Fails = w38Rows.length - w38Passes;
    const w38Total = w38Rows.length;
    const w38OnTime = w38Rows.filter(r => r.onTime).length;
    const w38InFull = w38Rows.filter(r => r.inFull).length;
    const w38OTIF = w38Total > 0 ? Math.round((w38Passes / w38Total) * 100) : 56;
    const w38OnTimePct = w38Total > 0 ? Math.round((w38OnTime / w38Total) * 100) : 67;
    const w38InFullPct = w38Total > 0 ? Math.round((w38InFull / w38Total) * 100) : 78;

    const w38FailLate = w38Rows.filter(r => !r.otif && r.failType === 'Late').length;
    const w38FailShort = w38Rows.filter(r => !r.otif && r.failType === 'Short').length;
    const w38FailLateAndShort = w38Rows.filter(r => !r.otif && r.failType === 'Late and short').length;
    const w38FailMat = w38Rows.filter(r => !r.otif && r.delayReason === 'Material short').length;
    const w38FailQC = w38Rows.filter(r => !r.otif && r.delayReason === 'QC hold').length;
    const w38FailVeh = w38Rows.filter(r => !r.otif && r.delayReason === 'No vehicle').length;
    const w38FailPaper = w38Rows.filter(r => !r.otif && r.delayReason === 'Paperwork').length;
    const w38FailLabour = w38Rows.filter(r => !r.otif && r.delayReason === 'Labour short').length;

    const w38: WeeklyTrendDataPoint = {
      week: 'Week 38 (15–21 Sep)',
      shortWeek: 'W38',
      dateRange: '15–21 Sep 2026',
      Pass: w38Total > 0 ? w38Passes : 5,
      Fail: w38Total > 0 ? w38Fails : 4,
      Total: w38Total > 0 ? w38Total : 9,
      otifPercent: w38Total > 0 ? w38OTIF : 56,
      onTime: w38Total > 0 ? w38OnTime : 6,
      onTimePercent: w38Total > 0 ? w38OnTimePct : 67,
      inFull: w38Total > 0 ? w38InFull : 7,
      inFullPercent: w38Total > 0 ? w38InFullPct : 78,
      failLate: w38Total > 0 ? w38FailLate : 2,
      failShort: w38Total > 0 ? w38FailShort : 2,
      failLateAndShort: w38Total > 0 ? w38FailLateAndShort : 0,
      failMaterial: w38Total > 0 ? w38FailMat : 2,
      failQC: w38Total > 0 ? w38FailQC : 1,
      failVehicle: w38Total > 0 ? w38FailVeh : 1,
      failPaperwork: w38Total > 0 ? w38FailPaper : 0,
      failLabour: w38Total > 0 ? w38FailLabour : 0,
      topReason: 'Material short & QC hold',
      isHistorical: false,
    };

    // Dynamic Week 39+ (22 Sep 2026 onwards, including newly added dispatches)
    const w39Rows = calculated.filter(d => {
      const dateStr = (d.promisedDate || d.actualOut || '').split('T')[0];
      return dateStr >= '2026-09-22';
    });
    const w39Passes = w39Rows.filter(r => r.otif).length;
    const w39Fails = w39Rows.length - w39Passes;
    const w39Total = w39Rows.length;
    const w39OnTime = w39Rows.filter(r => r.onTime).length;
    const w39InFull = w39Rows.filter(r => r.inFull).length;
    const w39OTIF = w39Total > 0 ? Math.round((w39Passes / w39Total) * 100) : 67;
    const w39OnTimePct = w39Total > 0 ? Math.round((w39OnTime / w39Total) * 100) : 78;
    const w39InFullPct = w39Total > 0 ? Math.round((w39InFull / w39Total) * 100) : 89;

    const w39FailLate = w39Rows.filter(r => !r.otif && r.failType === 'Late').length;
    const w39FailShort = w39Rows.filter(r => !r.otif && r.failType === 'Short').length;
    const w39FailLateAndShort = w39Rows.filter(r => !r.otif && r.failType === 'Late and short').length;
    const w39FailMat = w39Rows.filter(r => !r.otif && r.delayReason === 'Material short').length;
    const w39FailQC = w39Rows.filter(r => !r.otif && r.delayReason === 'QC hold').length;
    const w39FailVeh = w39Rows.filter(r => !r.otif && r.delayReason === 'No vehicle').length;
    const w39FailPaper = w39Rows.filter(r => !r.otif && r.delayReason === 'Paperwork').length;
    const w39FailLabour = w39Rows.filter(r => !r.otif && r.delayReason === 'Labour short').length;

    const w39: WeeklyTrendDataPoint = {
      week: 'Week 39 (22–28 Sep)',
      shortWeek: 'W39',
      dateRange: '22–28 Sep 2026',
      Pass: w39Total > 0 ? w39Passes : 6,
      Fail: w39Total > 0 ? w39Fails : 3,
      Total: w39Total > 0 ? w39Total : 9,
      otifPercent: w39Total > 0 ? w39OTIF : 67,
      onTime: w39Total > 0 ? w39OnTime : 7,
      onTimePercent: w39Total > 0 ? w39OnTimePct : 78,
      inFull: w39Total > 0 ? w39InFull : 8,
      inFullPercent: w39Total > 0 ? w39InFullPct : 89,
      failLate: w39Total > 0 ? w39FailLate : 2,
      failShort: w39Total > 0 ? w39FailShort : 1,
      failLateAndShort: w39Total > 0 ? w39FailLateAndShort : 0,
      failMaterial: w39Total > 0 ? w39FailMat : 1,
      failQC: w39Total > 0 ? w39FailQC : 1,
      failVehicle: w39Total > 0 ? w39FailVeh : 1,
      failPaperwork: w39Total > 0 ? w39FailPaper : 0,
      failLabour: w39Total > 0 ? w39FailLabour : 0,
      topReason: 'Transporter release delay',
      isHistorical: false,
    };

    return [w36, w37, w38, w39];
  }, [dispatches, rules]);

  // Overall trajectory calculations
  const baselineOTIF = weekData[0]?.otifPercent || 0;
  const latestOTIF = weekData[weekData.length - 1]?.otifPercent || 0;
  const overallImprovement = latestOTIF - baselineOTIF;
  const isImproving = overallImprovement >= 0;
  const avgWeeklyVolume = Math.round(weekData.reduce((acc, curr) => acc + curr.Total, 0) / weekData.length);
  const targetSLA = 85;

  return (
    <div id="trend-analysis-section" className="industrial-card rounded-2xl p-5 border border-white/10 shadow-lg space-y-5">
      {/* Trend Analysis Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Trend Analysis</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Weekly OTIF Trajectory
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-900 text-slate-300 border border-slate-750">
              Recharts Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Weekly OTIF performance trends and operational trajectory based on historical dispatch records (Week 36 to Week 39).
          </p>
        </div>

        {/* Executive Trajectory Badges */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${
            isImproving
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          }`}>
            <ArrowUpRight className={`w-4 h-4 ${isImproving ? 'text-emerald-400' : 'text-rose-400 rotate-90'}`} />
            <span>{isImproving ? `+${overallImprovement}% 4-Week Net Gain` : `${overallImprovement}% Decline`}</span>
            <span className="text-slate-400 text-[10px] font-normal">({baselineOTIF}% → {latestOTIF}%)</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-950 text-cyan-300 border border-cyan-500/30">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span>OEM SLA Target: {targetSLA}%</span>
          </div>
        </div>
      </div>

      {/* View Switcher & Secondary Line Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        {/* Chart View Modes */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="text-[11px] font-mono text-slate-400 mr-1 hidden sm:inline">Visualization:</span>
          <button
            onClick={() => setChartView('composed')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
              chartView === 'composed'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Dual-Axis Trajectory (Loads + OTIF %)
          </button>
          <button
            onClick={() => setChartView('stacked')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
              chartView === 'stacked'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Pass vs Fail Volume
          </button>
          <button
            onClick={() => setChartView('detailed')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
              chartView === 'detailed'
                ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Failure Root-Causes Stack
          </button>
          <button
            onClick={() => setChartView('area')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
              chartView === 'area'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            OTIF % vs 85% SLA Area
          </button>
        </div>

        {/* Optional Secondary Line Toggles for Composed View */}
        {chartView === 'composed' && (
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-slate-400 text-[10px]">Show Lines:</span>
            <button
              onClick={() => setShowOnTimeLine(!showOnTimeLine)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition border cursor-pointer ${
                showOnTimeLine
                  ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              On-Time % {showOnTimeLine ? '✓' : '+'}
            </button>
            <button
              onClick={() => setShowInFullLine(!showInFullLine)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition border cursor-pointer ${
                showInFullLine
                  ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              In-Full % {showInFullLine ? '✓' : '+'}
            </button>
          </div>
        )}
      </div>

      {/* Main Recharts Visualization Component */}
      <div className="w-full h-80 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartView === 'composed' ? (
            <ComposedChart
              data={weekData}
              margin={{ top: 16, right: 20, bottom: 20, left: -10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="shortWeek"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
              />
              {/* Left YAxis: Load counts */}
              <YAxis
                yAxisId="loads"
                orientation="left"
                domain={[0, 20]}
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
                label={{
                  value: 'Loads (Dispatches)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 20,
                  fill: '#64748b',
                  fontSize: 10,
                }}
              />
              {/* Right YAxis: OTIF % */}
              <YAxis
                yAxisId="percent"
                orientation="right"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 85, 100]}
                tickFormatter={val => `${val}%`}
                tick={{ fill: '#f59e0b', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
                label={{
                  value: 'OTIF %',
                  angle: 90,
                  position: 'insideRight',
                  offset: 0,
                  fill: '#f59e0b',
                  fontSize: 10,
                }}
              />

              {/* 85% Target SLA Reference Line */}
              <ReferenceLine
                yAxisId="percent"
                y={85}
                stroke="#06b6d4"
                strokeDasharray="4 4"
                label={{
                  value: 'OEM SLA 85%',
                  position: 'top',
                  fill: '#06b6d4',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload as WeeklyTrendDataPoint;
                  return (
                    <div className="bg-slate-950 border border-slate-700 rounded-lg p-3 shadow-2xl text-xs font-sans space-y-2 min-w-[240px]">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="font-bold text-white font-mono">{d.week}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          d.isHistorical ? 'bg-slate-800 text-slate-400' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {d.isHistorical ? 'Historical Baseline' : 'Live Record'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                        <div className="bg-emerald-950/30 p-2 rounded border border-emerald-500/30">
                          <span className="text-emerald-300 font-bold block text-[10px]">Passes (OTIF):</span>
                          <span className="text-emerald-400 font-black text-base">{d.Pass} loads</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">({d.otifPercent}% of week)</span>
                        </div>
                        <div className="bg-rose-950/30 p-2 rounded border border-rose-500/30">
                          <span className="text-rose-300 font-bold block text-[10px]">Fails:</span>
                          <span className="text-rose-400 font-black text-base">{d.Fail} loads</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">({100 - d.otifPercent}% of week)</span>
                        </div>
                      </div>

                      <div className="bg-slate-900 p-2 rounded border border-slate-800 text-[10px] text-slate-300 space-y-0.5 font-mono">
                        <div>Total Dispatches: <strong className="text-white">{d.Total} loads</strong></div>
                        <div>• On-Time Rate: {d.onTime}/{d.Total} ({d.onTimePercent}%)</div>
                        <div>• In-Full Rate: {d.inFull}/{d.Total} ({d.inFullPercent}%)</div>
                        <div>• Key Bottleneck: <span className="text-amber-300">{d.topReason}</span></div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 font-mono">
                        <span className="text-slate-300 text-xs">OTIF Score:</span>
                        <span className={`font-black text-sm ${
                          d.otifPercent >= 70 ? 'text-emerald-400' : d.otifPercent >= 45 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {d.otifPercent}% ({d.Pass} of {d.Total})
                        </span>
                      </div>
                    </div>
                  );
                }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
              />

              <Bar
                yAxisId="loads"
                dataKey="Pass"
                name="Pass Loads"
                stackId="loads"
                fill="#10b981"
              />
              <Bar
                yAxisId="loads"
                dataKey="Fail"
                name="Fail Loads"
                stackId="loads"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
              />

              <Line
                yAxisId="percent"
                type="monotone"
                dataKey="otifPercent"
                name="OTIF %"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 5, stroke: '#1e293b', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#fbbf24' }}
              />

              {showOnTimeLine && (
                <Line
                  yAxisId="percent"
                  type="monotone"
                  dataKey="onTimePercent"
                  name="On-Time Alone %"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ fill: '#06b6d4', r: 4 }}
                />
              )}

              {showInFullLine && (
                <Line
                  yAxisId="percent"
                  type="monotone"
                  dataKey="inFullPercent"
                  name="In-Full Alone %"
                  stroke="#818cf8"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  dot={{ fill: '#818cf8', r: 4 }}
                />
              )}
            </ComposedChart>
          ) : chartView === 'stacked' ? (
            <BarChart
              data={weekData}
              margin={{ top: 16, right: 20, bottom: 20, left: -10 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="shortWeek"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
              />
              <YAxis
                domain={[0, 20]}
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
                label={{
                  value: 'Loads (Dispatches)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 20,
                  fill: '#64748b',
                  fontSize: 10,
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload as WeeklyTrendDataPoint;
                  return (
                    <div className="bg-slate-950 border border-slate-700 rounded-lg p-3 shadow-2xl text-xs font-sans space-y-1.5 min-w-[200px]">
                      <div className="font-bold text-white font-mono border-b border-slate-800 pb-1">
                        {d.week}
                      </div>
                      <div className="font-mono text-emerald-400">Pass: {d.Pass} loads ({d.otifPercent}%)</div>
                      <div className="font-mono text-rose-400">Fail: {d.Fail} loads ({100 - d.otifPercent}%)</div>
                      <div className="font-mono text-slate-400 text-[10px]">Total: {d.Total} loads</div>
                    </div>
                  );
                }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }} />
              <Bar dataKey="Pass" name="Pass (On-Time & In-Full)" fill="#10b981" stackId="otif" />
              <Bar dataKey="Fail" name="Fail (Late or Short)" fill="#f43f5e" stackId="otif" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartView === 'detailed' ? (
            <BarChart
              data={weekData}
              margin={{ top: 16, right: 20, bottom: 20, left: -10 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="shortWeek"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
              />
              <YAxis
                domain={[0, 20]}
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
              />
              <Tooltip />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }} />
              <Bar dataKey="Pass" name="Pass" fill="#10b981" stackId="breakdown" />
              <Bar dataKey="failLate" name="Fail: Late Only" fill="#f97316" stackId="breakdown" />
              <Bar dataKey="failShort" name="Fail: Short Only" fill="#a855f7" stackId="breakdown" />
              <Bar dataKey="failLateAndShort" name="Fail: Late & Short" fill="#e11d48" stackId="breakdown" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart
              data={weekData}
              margin={{ top: 16, right: 20, bottom: 20, left: -10 }}
            >
              <defs>
                <linearGradient id="otifTrendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="shortWeek"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 85, 100]}
                tickFormatter={val => `${val}%`}
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
              />
              <ReferenceLine
                y={85}
                stroke="#06b6d4"
                strokeDasharray="4 4"
                label={{
                  value: 'OEM SLA 85%',
                  position: 'top',
                  fill: '#06b6d4',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="otifPercent"
                name="OTIF %"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#otifTrendAreaGradient)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Week-on-Week Performance Progression Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {weekData.map((w, idx) => {
          const prev = idx > 0 ? weekData[idx - 1] : null;
          const wowDelta = prev ? w.otifPercent - prev.otifPercent : 0;
          return (
            <div
              key={w.week}
              className={`p-3 rounded-xl border text-xs font-mono transition ${
                idx === weekData.length - 1
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200 ring-1 ring-emerald-500/20'
                  : idx === weekData.length - 2
                  ? 'bg-amber-950/15 border-amber-500/30 text-slate-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="font-bold text-white">{w.shortWeek}</span>
                <span className="text-slate-400">{w.dateRange.split(' ')[0]}</span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="text-base sm:text-lg font-black font-mono text-white">
                  {w.Pass} <span className="text-xs font-normal text-slate-400">Pass / {w.Fail} Fail</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                  w.otifPercent >= 60 ? 'bg-emerald-500/20 text-emerald-300' : w.otifPercent >= 45 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {w.otifPercent}%
                </span>
              </div>

              {/* Progress Visualizer: Pass vs Fail Ratio */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2 flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${(w.Pass / (w.Total || 1)) * 100}%` }}
                  title={`Passes: ${w.Pass}`}
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{ width: `${(w.Fail / (w.Total || 1)) * 100}%` }}
                  title={`Fails: ${w.Fail}`}
                />
              </div>

              {/* WoW Delta & Bottleneck */}
              <div className="mt-2 text-[10px] flex items-center justify-between border-t border-slate-800/60 pt-1.5">
                <span className="text-slate-500">WoW Change:</span>
                {prev ? (
                  <span className={`font-bold ${wowDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {wowDelta >= 0 ? `+${wowDelta}%` : `${wowDelta}%`}
                  </span>
                ) : (
                  <span className="text-slate-500">Baseline</span>
                )}
              </div>

              <div className="mt-1 text-[9px] text-slate-400 truncate" title={w.topReason}>
                Issue: <span className="text-slate-300">{w.topReason}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Strategic Owner Insight Box */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
        <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-white flex items-center gap-2">
            <span>Executive Trend Trajectory: Validating Plant Gate Discipline</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
              IATF 16949 Audit Ready
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            In <span className="text-rose-400 font-mono font-semibold">Week 36 Baseline</span>, 
            only 5 of 16 loads passed (<span className="text-rose-400 font-mono font-bold">31% OTIF</span>, 69% failure rate) primarily due to unverified subcontractor QC releases and late vehicle placement. 
            Over four consecutive weeks of strict gate timestamp logging, the green Pass volume expanded to 
            <span className="text-emerald-400 font-mono font-bold"> {weekData[3].otifPercent}% in Week 39</span>. 
            Presenting this verified upward trajectory during quarterly customer vendor audits proves operational stability and halts debit penalties.
          </p>
        </div>
      </div>
    </div>
  );
};

export const WeeklyOTIFTrendBarChart = TrendAnalysisSection;
export const WeeklyOTIFPassFailBarChart = TrendAnalysisSection;

export const OwnerReport: React.FC<OwnerReportProps> = ({
  metrics,
  rules,
  dispatches,
  onNavigateToSheet,
  onNavigateToDrill,
  onOpenROICalculator,
  onOpenWhatIfSimulator,
  onOpenCAPA8D,
  onOpenCertificate,
  onOpenPipeline,
  onOpenRndLab,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      // Small pause to ensure all SVG charts, layouts & fonts are fully settled
      await new Promise(resolve => setTimeout(resolve, 200));

      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // 2x resolution for crisp executive print quality
        useCORS: true,
        backgroundColor: '#020617', // Match dark slate-950 theme
        logging: false,
        windowWidth: element.scrollWidth,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const safeStart = rules.weekStart.replace(/[^a-zA-Z0-9]/g, '_');
      const safeEnd = rules.weekEnd.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`OTIF_Executive_Report_${safeStart}_to_${safeEnd}.pdf`);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('PDF generation error, defaulting to browser print:', error);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopySummary = () => {
    const compName = rules.factoryProfile?.companyName || 'Apex Precision Automotive Ltd';
    const plName = rules.factoryProfile?.plantName || 'Plant 1 Gate Audit';
    const loc = rules.factoryProfile?.clusterLocation || 'Industrial Cluster';

    const text = `DISPATCH OTIF EXECUTIVE SUMMARY (${rules.weekStart} to ${rules.weekEnd})
Enterprise: ${compName}
Facility: ${plName} (${loc})
Dispatches: ${metrics.totalDispatches} lines
OTIF Passes: ${metrics.passes} of ${metrics.totalDispatches} (${metrics.otifPercent}%)
On-Time Alone: ${metrics.onTimeCount} of ${metrics.totalDispatches} (${metrics.onTimePercent}%)
In-Full Alone: ${metrics.inFullCount} of ${metrics.totalDispatches} (${metrics.inFullPercent}%)
Total Failures: ${metrics.fails} (${metrics.failsLateOnly} Late only, ${metrics.failsShortOnly} Short only, ${metrics.failsLateAndShort} Late & Short)

By Customer:
${metrics.customerStats.map(c => `- ${c.customer}: ${c.passes} of ${c.dispatches} (${c.otifPercent}%)`).join('\n')}

Weakest Customer: ${metrics.weakestCustomer?.customer} (${metrics.weakestCustomer?.passes} of ${metrics.weakestCustomer?.dispatches}, ${metrics.weakestCustomer?.otifPercent}%)
Top Failure Cause: ${metrics.topFailureReason?.reason} (${metrics.topFailureReason?.count} loads, ${metrics.topFailureReason?.percentageOfFails}% of fails)
Action: Fix material shortage first. Gate measurement excludes transit/highway delays.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const prev30DayStats = {
    otifPercent: 32,
    onTimePercent: 46,
    inFullPercent: 68,
    dispatchesBaseline: 16,
    periodLabel: '31 Jul – 29 Aug 2026',
  };

  const otifDelta = metrics.otifPercent - prev30DayStats.otifPercent;
  const onTimeDelta = metrics.onTimePercent - prev30DayStats.onTimePercent;
  const inFullDelta = metrics.inFullPercent - prev30DayStats.inFullPercent;

  // Real-time Critical Alert check
  const alertThreshold = rules.criticalAlertThreshold ?? 60;
  const isCriticalAlertActive = metrics.otifPercent < alertThreshold;

  return (
    <div ref={reportRef} id="owner-report-dashboard" className="space-y-6">
      {/* Executive Management Critical Alert Warning Banner */}
      {isCriticalAlertActive && (
        <div className="industrial-card border-l-4 border-l-rose-500 border border-rose-500/30 p-4 rounded-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  Management SLA Threshold Breach
                </span>
                <span className="text-slate-500">·</span>
                <span className="font-mono text-xs text-rose-300 font-semibold">
                  Threshold: {alertThreshold}%
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Gate OTIF has fallen to <strong className="text-rose-400 font-mono text-sm">{metrics.otifPercent}%</strong> ({metrics.passes} of {metrics.totalDispatches} loads passed), breaching management's critical threshold of <strong className="text-white font-mono">{alertThreshold}%</strong>. Immediate gate intervention required.
              </p>
            </div>
          </div>

          <div data-html2canvas-ignore="true" className="flex items-center gap-2 shrink-0">
            <button
              onClick={onNavigateToDrill}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Inspect Delays</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Banner & Control Bar */}
      <div className={`p-4 rounded-xl industrial-card flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
        isCriticalAlertActive
          ? 'border-l-4 border-l-rose-500 border border-white/10'
          : 'border-l-4 border-l-amber-500 border border-white/10'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            {isCriticalAlertActive ? (
              <>
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="text-rose-400 font-bold uppercase tracking-wider">
                  Critical Fortnight Gate Audit Scorecard
                </span>
                <span className="text-slate-500">·</span>
                <span className="font-mono text-rose-300">
                  OTIF &lt; {alertThreshold}%
                </span>
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-200 font-bold uppercase tracking-wider">Fortnight Gate Audit Scorecard</span>
                <span className="text-slate-500">·</span>
                <span className="text-emerald-400 font-mono">
                  SLA Target Met (&ge;{alertThreshold}%)
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-300 mt-1">
            <span className="font-semibold text-white font-mono">{metrics.totalDispatches} loads</span> logged between{' '}
            <span className="font-mono text-slate-200">{rules.weekStart}</span> and{' '}
            <span className="font-mono text-slate-200">{rules.weekEnd}</span> ·{' '}
            <span className="font-bold text-emerald-400 font-mono">{metrics.passes} passed</span> ·{' '}
            OTIF is{' '}
            <span className={`font-bold font-mono text-sm ${isCriticalAlertActive ? 'text-rose-400' : 'text-amber-400'}`}>
              {metrics.otifPercent}%
            </span>{' '}
            ({metrics.passes} of {metrics.totalDispatches}).
          </p>
        </div>

        <div data-html2canvas-ignore="true" className="flex flex-wrap items-center gap-2">
          {/* CFO ROI & Penalties Button */}
          {onOpenROICalculator && (
            <button
              onClick={onOpenROICalculator}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-750 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Calculate OEM debit notes and financial ROI of this software"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              <span>CFO ROI</span>
            </button>
          )}

          {/* What-If Kaizen Simulator Button */}
          {onOpenWhatIfSimulator && (
            <button
              onClick={onOpenWhatIfSimulator}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-750 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Simulate score gains from fixing materials, QC, or logistics"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>What-If</span>
            </button>
          )}

          {/* Automated 8D CAPA Generator Button */}
          {onOpenCAPA8D && (
            <button
              onClick={onOpenCAPA8D}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-750 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Generate formal IATF 16949 8D root-cause report"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-400" />
              <span>8D CAPA</span>
            </button>
          )}

          {/* Client Pipeline Button */}
          {onOpenPipeline && (
            <button
              onClick={onOpenPipeline}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-750 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Manage prospective factory leads, trial demos, and subscriptions"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Pipeline</span>
            </button>
          )}

          {/* R&D QA Lab Trigger Button */}
          {onOpenRndLab && (
            <button
              onClick={onOpenRndLab}
              className="px-2.5 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-800/80 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Execute automated QA regression tests, stress benchmarker, and R&D gate prototypes"
            >
              <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
              <span>R&amp;D QA Lab</span>
            </button>
          )}

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-slate-200 border border-slate-750 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Export full executive dashboard as PDF with charts preserved"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                <span>Exporting...</span>
              </>
            ) : exportSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Downloaded</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Export PDF</span>
              </>
            )}
          </button>

          <button
            onClick={onNavigateToDrill}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Target className="w-3.5 h-3.5" />
            <span>2-Min Drill</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-750 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied' : 'Copy 1-Pager'}</span>
          </button>
        </div>
      </div>

      {/* 4 Scorecard KPI Cards with Industrial Contrast & Monospace Math */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Dispatches */}
        <div className="industrial-card rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5 text-slate-300">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Dispatches
              </span>
              <span className="font-mono text-[11px] text-blue-400 font-semibold">
                +12% volume
              </span>
            </div>
            <div className="text-3xl font-bold text-white font-mono tracking-tight">{metrics.totalDispatches}</div>
            <div className="mt-2 text-xs text-slate-300 leading-relaxed">
              Every row in the 2-week window. <span className="text-white font-medium">One row = one dispatch line</span>, not one truck.
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Prior 30d Run Rate:</span>
            <span className="text-slate-200 font-semibold">16 loads / fortnight</span>
          </div>
        </div>

        {/* KPI 2: OTIF Passes */}
        <div className="industrial-card rounded-xl p-5 border-amber-500/30 flex flex-col justify-between ring-1 ring-amber-500/20">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5 text-slate-300">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                OTIF Passes
              </span>
              <div 
                className={`font-mono text-[11px] font-semibold flex items-center gap-1 ${
                  otifDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
                title={`OTIF is trending ${otifDelta >= 0 ? 'UP' : 'DOWN'} by ${Math.abs(otifDelta)}% compared to the prior 30-day period (${prev30DayStats.periodLabel}: ${prev30DayStats.otifPercent}%)`}
              >
                {otifDelta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{otifDelta >= 0 ? `+${otifDelta}%` : `${otifDelta}%`} vs 30d</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold font-mono tracking-tight ${otifDelta >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                {metrics.otifPercent}%
              </span>
              <span className="text-sm font-semibold text-slate-300 font-mono">({metrics.passes} of {metrics.totalDispatches})</span>
            </div>
            <div className="mt-2 text-xs text-slate-300 leading-relaxed">
              Both tests passed. Always say <span className="text-amber-300 font-medium font-mono">"{metrics.passes} of {metrics.totalDispatches}"</span>.
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Previous 30-Day Score:</span>
            <div className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span>{prev30DayStats.otifPercent}%</span>
              <span className="text-[10px] text-slate-400 font-normal">({otifDelta >= 0 ? '▲ Trending Up' : '▼ Trending Down'})</span>
            </div>
          </div>
        </div>

        {/* KPI 3: On Time Alone */}
        <div className="industrial-card rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                On Time Alone
              </span>
              <div 
                className={`font-mono text-[11px] font-semibold flex items-center gap-1 ${
                  onTimeDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
                title={`On-time rate trending ${onTimeDelta >= 0 ? 'UP' : 'DOWN'} by ${Math.abs(onTimeDelta)}% vs prior 30 days (${prev30DayStats.periodLabel}: ${prev30DayStats.onTimePercent}%)`}
              >
                {onTimeDelta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{onTimeDelta >= 0 ? `+${onTimeDelta}%` : `${onTimeDelta}%`} vs 30d</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-400 font-mono tracking-tight">{metrics.onTimePercent}%</span>
              <span className="text-sm font-semibold text-slate-300 font-mono">({metrics.onTimeCount} of {metrics.totalDispatches})</span>
            </div>
            <div className="mt-2 text-xs text-slate-300 leading-relaxed">
              <span className="text-white font-medium">{metrics.onTimeCount} loads</span> departed by promised cutoff.
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Previous 30-Day Rate:</span>
            <div className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span>{prev30DayStats.onTimePercent}%</span>
              <span className="text-[10px] text-slate-400 font-normal">({onTimeDelta >= 0 ? '▲ Up' : '▼ Down'})</span>
            </div>
          </div>
        </div>

        {/* KPI 4: In Full Alone */}
        <div className="industrial-card rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5 text-slate-300">
                <Package className="w-3.5 h-3.5 text-indigo-400" />
                In Full Alone
              </span>
              <div 
                className={`font-mono text-[11px] font-semibold flex items-center gap-1 ${
                  inFullDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
                title={`In-full delivery rate trending ${inFullDelta >= 0 ? 'UP' : 'DOWN'} by ${Math.abs(inFullDelta)}% vs prior 30 days (${prev30DayStats.periodLabel}: ${prev30DayStats.inFullPercent}%)`}
              >
                {inFullDelta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{inFullDelta >= 0 ? `+${inFullDelta}%` : `${inFullDelta}%`} vs 30d</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-indigo-400 font-mono tracking-tight">{metrics.inFullPercent}%</span>
              <span className="text-sm font-semibold text-slate-300 font-mono">({metrics.inFullCount} of {metrics.totalDispatches})</span>
            </div>
            <div className="mt-2 text-xs text-slate-300 leading-relaxed">
              <span className="text-white font-medium">{metrics.inFullCount} loads</span> fulfilled at $\ge${rules.inFullCutoff}% qty.
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Previous 30-Day Rate:</span>
            <div className="flex items-center gap-1 text-indigo-300 font-semibold">
              <span>{prev30DayStats.inFullPercent}%</span>
              <span className="text-[10px] text-slate-400 font-normal">({inFullDelta >= 0 ? '▲ Up' : '▼ Down'})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 30-Day Daily OTIF Score Sparkline Chart (Beneath Main KPI Cards) */}
      <DailyOTIFSparkline dispatches={dispatches} rules={rules} />

      {/* The Core Formula Insight Box */}
      <div className="industrial-card rounded-xl p-5">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              The Dual-Gate Mathematical Rule: Why Fails = {metrics.fails}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              "A late full load and an on-time short load both fail. That is the whole idea. Early and complete is the only pass."
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-900 text-rose-300 border border-slate-800">
                Late Only: <strong className="text-white">{metrics.failsLateOnly}</strong>
              </span>
              <span className="text-slate-600">+</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-rose-300 border border-slate-800">
                Short Only: <strong className="text-white">{metrics.failsShortOnly}</strong>
              </span>
              <span className="text-slate-600">+</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-rose-300 border border-rose-500/30">
                Late &amp; Short: <strong className="text-rose-400">{metrics.failsLateAndShort}</strong> (Ashok Leyland Bracket L)
              </span>
              <span className="text-slate-600">=</span>
              <span className="px-2 py-0.5 rounded bg-rose-950/40 text-rose-200 border border-rose-500/50 font-bold">
                Total Fails: {metrics.fails}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Analysis Section (Weekly OTIF Performance Trends using Recharts) */}
      <TrendAnalysisSection dispatches={dispatches} rules={rules} onNavigateToSheet={onNavigateToSheet} />

      {/* Two Column Section: Customers & Failure Causes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Performance Table */}
        <div id="p2-customer-scorecard" className="lg:col-span-7 industrial-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Customer Scorecards (By Weakest First)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                The account to open first is the one with the worst score, not the biggest badge.
              </p>
            </div>
            <button
              onClick={() => onNavigateToSheet()}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>View rows</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-400 uppercase text-[10px] font-semibold tracking-wider font-mono">
                  <th className="py-2.5 px-3">Customer Account</th>
                  <th className="py-2.5 px-3 text-center">Loads</th>
                  <th className="py-2.5 px-3 text-center">Passes</th>
                  <th className="py-2.5 px-3 text-center">OTIF %</th>
                  <th className="py-2.5 px-3 text-center">On-Time</th>
                  <th className="py-2.5 px-3 text-center">In-Full</th>
                  <th className="py-2.5 px-3 text-right">Priority</th>
                  <th className="py-2.5 px-2 text-center">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-sans">
                {metrics.customerStats.map((c, idx) => {
                  const isWeakest = idx === 0 && c.otifPercent <= 50;
                  return (
                    <tr 
                      key={c.customer}
                      className={`hover:bg-slate-800/40 transition cursor-pointer ${
                        isWeakest ? 'bg-rose-950/20' : ''
                      }`}
                      onClick={() => onNavigateToSheet(c.customer)}
                    >
                      <td className="py-3 px-3 font-medium text-slate-100">
                        <div className="flex items-center gap-2">
                          <span>{c.customer}</span>
                          {isWeakest && (
                            <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold uppercase rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Open First
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-200">{c.dispatches}</td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-400 font-semibold">{c.passes}</td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          c.otifPercent < 50 
                            ? 'bg-rose-500/20 text-rose-300' 
                            : c.otifPercent <= 60 
                            ? 'bg-amber-500/20 text-amber-300' 
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {c.otifPercent}%
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">({c.passes} of {c.dispatches})</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">{c.onTimeCount}/{c.dispatches}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">{c.inFullCount}/{c.dispatches}</td>
                      <td className="py-3 px-3 text-right font-mono text-xs">
                        {isWeakest ? (
                          <span className="text-rose-400 font-bold">High (Critical)</span>
                        ) : c.otifPercent < 60 ? (
                          <span className="text-amber-400 font-medium">Moderate</span>
                        ) : (
                          <span className="text-slate-400">Stable</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            const msg = `Alert [Dispatch Head]: ${c.customer} OTIF is at ${c.otifPercent}% (${c.passes}/${c.dispatches} loads). Primary cause: Material short (3 loads). Action required before Monday 9 AM review.`;
                            navigator.clipboard.writeText(msg);
                            alert(`WhatsApp Alert Copied for ${c.customer}!\nPre-formatted for CEO Monday review.`);
                          }}
                          className="p-1 rounded bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
                          title="Copy pre-formatted WhatsApp alert for CEO review"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Customer Focus Note */}
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300">Hyundai vendor park (2 of 5, 40%):</span>{' '}
              This is the account to open with the owner first. Not because the Hyundai logo is prestigious, but because its OTIF score is the worst in this window (3 fails out of 5). When the owner says "the customer is shouting," Hyundai is the loudest.
            </div>
          </div>
        </div>

        {/* Right Column: Why They Failed & Pareto */}
        <div className="lg:col-span-5 industrial-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span>Why They Failed ({metrics.fails} Fails)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                One reason per fail. If you write two, the fix disappears.
              </p>
            </div>
          </div>

          {/* Pareto Chart Bars */}
          <div className="space-y-3 pt-1">
            {metrics.reasonStats.map((r, i) => {
              const isTop = i === 0;
              return (
                <div 
                  key={r.reason}
                  onClick={() => onNavigateToSheet(undefined, r.reason)}
                  className="group cursor-pointer hover:bg-slate-800/40 p-1.5 rounded-lg transition"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-medium ${isTop ? 'text-amber-300 font-bold' : 'text-slate-200'}`}>
                      {r.reason}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      <span className="text-white font-bold">{r.count} loads</span> ({r.percentageOfFails}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTop 
                          ? 'bg-amber-500' 
                          : i < 3 
                          ? 'bg-rose-500/80' 
                          : 'bg-slate-600'
                      }`}
                      style={{ width: `${(r.count / (metrics.fails || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* The Prescription Callout */}
          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <span>Fix Material Short First</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded font-black">ACTION</span>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed">
              Three reasons cover <span className="font-semibold text-white">7 of the 9 fails</span> (Material short 3, QC hold 2, No vehicle 2). 
              <span className="text-amber-300 font-semibold"> Do not hand him five actions.</span> Tell him to fix material short first.
            </p>
          </div>

          {/* Late vs Short Difference Box */}
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-slate-200">The Two Different Fixes:</div>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li><strong className="text-slate-200">Late full load:</strong> Needs a vehicle arranged earlier or a QC release signed.</li>
              <li><strong className="text-slate-200">Short load:</strong> Needs raw material / forged blank procurement.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Factory Gate vs Highway Truth Box */}
      <div className="industrial-card rounded-xl p-5 text-xs text-slate-200 leading-relaxed">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              The Factory Gate Ground Truth (Excluding Highway Delays)
            </h4>
            <p>
              "You time when the vehicle left his gate. You do not time when it reached Hyundai. He controls the gate. 
              He does not control the Red Hills jam after the truck has gone."
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-slate-400 font-mono text-[11px]">
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Gate Register timestamp is ground truth
              </span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                Never rely on invoice time (raised before truck moves)
              </span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                No GPS required — the security notebook has the facts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
