import React, { useState, useMemo } from 'react';
import { TrendingUp, ShieldCheck, Target, ArrowUpRight, Calendar, DollarSign, Sparkles } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { AuditTotals, RulesConfig, ScaleProfile } from '../types/freight';
import { formatINR } from '../utils/auditCalculations';

interface CostSavingsForecastProps {
  totals: AuditTotals;
  rules: RulesConfig;
  currentScale: ScaleProfile;
}

export const CostSavingsForecast: React.FC<CostSavingsForecastProps> = ({
  totals,
  rules,
  currentScale
}) => {
  // Reduction target sliders
  const [rateLeakTargetPct, setRateLeakTargetPct] = useState<number>(85); // 85% rate leak capture
  const [detentionTargetPct, setDetentionTargetPct] = useState<number>(70); // 70% detention reduction
  const [forecastHorizonMonths, setForecastHorizonMonths] = useState<number>(12); // 12 or 36 months

  // Scaled monthly figures
  const monthlyRateLeak = totals.rateLeak * currentScale.multiplier;
  const monthlyDetention = totals.detention * currentScale.multiplier;
  const monthlyTotalSpend = totals.freightPaid * currentScale.multiplier;

  // Monthly addressable savings based on targets
  const targetMonthlyRateSavings = Math.round(monthlyRateLeak * (rateLeakTargetPct / 100));
  const targetMonthlyDetentionSavings = Math.round(monthlyDetention * (detentionTargetPct / 100));
  const targetMonthlyTotalSavings = targetMonthlyRateSavings + targetMonthlyDetentionSavings;

  // Annual projection
  const annualProjectedSavings = targetMonthlyTotalSavings * 12;
  const annualSpendRatioPct = monthlyTotalSpend > 0 ? ((annualProjectedSavings / (monthlyTotalSpend * 12)) * 100).toFixed(1) : '0';

  // Generate monthly cumulative forecast data for AreaChart
  const forecastData = useMemo(() => {
    const data = [];
    let cumSavings = 0;
    let cumRateSavings = 0;
    let cumDetentionSavings = 0;
    const months = forecastHorizonMonths;

    const monthNames = ['M1 (Oct)', 'M2 (Nov)', 'M3 (Dec)', 'M4 (Jan)', 'M5 (Feb)', 'M6 (Mar)', 'M7 (Apr)', 'M8 (May)', 'M9 (Jun)', 'M10 (Jul)', 'M11 (Aug)', 'M12 (Sep)'];

    for (let i = 1; i <= months; i++) {
      // Ramp-up model: Month 1 achieves 60%, Month 2 80%, Month 3+ 100% of target
      const rampFactor = i === 1 ? 0.6 : i === 2 ? 0.85 : 1.0;
      const mRate = Math.round(targetMonthlyRateSavings * rampFactor);
      const mDetention = Math.round(targetMonthlyDetentionSavings * rampFactor);
      const mTotal = mRate + mDetention;

      cumRateSavings += mRate;
      cumDetentionSavings += mDetention;
      cumSavings += mTotal;

      const label = i <= 12 ? monthNames[i - 1] : `M${i}`;

      data.push({
        month: label,
        monthIndex: i,
        monthlyRateSavings: mRate,
        monthlyDetentionSavings: mDetention,
        monthlyTotal: mTotal,
        cumRateSavings,
        cumDetentionSavings,
        cumTotalSavings: cumSavings
      });
    }
    return data;
  }, [targetMonthlyRateSavings, targetMonthlyDetentionSavings, forecastHorizonMonths]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            <Target className="w-4 h-4 text-emerald-600" />
            <span>Prescriptive Financial Projection</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Cost Savings Forecast & Reduction Milestones
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Projected cash recovery over {forecastHorizonMonths} months based on identified leak patterns and implementation targets
          </p>
        </div>

        {/* Forecast Horizon Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setForecastHorizonMonths(12)}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              forecastHorizonMonths === 12
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            12-Month Horizon
          </button>
          <button
            onClick={() => setForecastHorizonMonths(24)}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              forecastHorizonMonths === 24
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            24-Month Horizon
          </button>
        </div>
      </div>

      {/* Target Setting Sliders & Forecast Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Panel */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-5 lg:col-span-1">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
            Savings Target Calibrators
          </span>

          {/* Slider 1: Rate Leak Capture Target */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700">
                Rate Leak Renegotiation Target
              </label>
              <span className="font-mono font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded text-xs">
                {rateLeakTargetPct}%
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="100"
              step="5"
              value={rateLeakTargetPct}
              onChange={(e) => setRateLeakTargetPct(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <p className="text-[11px] text-slate-500">
              Recoverable by forcing dearer carriers (Siva) to match Murugan benchmark or shifting volume.
            </p>
          </div>

          {/* Slider 2: Gate Detention Reduction Target */}
          <div className="space-y-2 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700">
                Gate Detention Reduction Target
              </label>
              <span className="font-mono font-bold text-rose-800 bg-rose-100/70 px-2 py-0.5 rounded text-xs">
                {detentionTargetPct}%
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="95"
              step="5"
              value={detentionTargetPct}
              onChange={(e) => setDetentionTargetPct(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
            />
            <p className="text-[11px] text-slate-500">
              Recoverable via 1-hour gate SLA, staggered dispatch windows, and driver staging control.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200 text-xs text-slate-600">
            Current Profile: <strong className="text-slate-900">{currentScale.name}</strong> ({currentScale.monthlySpendLabel})
          </div>
        </div>

        {/* 2 Big Forecast Metric Banners */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>Target Monthly Recovery</span>
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-emerald-950 mt-2">
                {formatINR(targetMonthlyTotalSavings)} <span className="text-xs font-sans text-emerald-700 font-normal">/ mo</span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-emerald-900/90 font-mono">
                <div className="flex justify-between">
                  <span>Rate Leak Recovered:</span>
                  <span className="font-bold">{formatINR(targetMonthlyRateSavings)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Detention Recovered:</span>
                  <span className="font-bold">{formatINR(targetMonthlyDetentionSavings)}</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-emerald-800 mt-4 pt-3 border-t border-emerald-200/60">
              Captures {annualSpendRatioPct}% of annual outward freight budget back into bottom-line profit.
            </p>
          </div>

          <div className="bg-slate-900 text-white rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>12-Month Cumulative Cash Gain</span>
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-amber-400 mt-2">
                {formatINR(annualProjectedSavings)}
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Over 1 year, eliminating unmanaged rate variances and gate bottlenecks restores <strong className="text-white font-bold">{formatINR(annualProjectedSavings)}</strong> in working capital without changing haulage volume.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Ramp Period: 60-90 Days</span>
              <span className="text-emerald-400 font-bold">100% Deterministic</span>
            </div>
          </div>
        </div>
      </div>

      {/* Area Chart: Cumulative Savings Trajectory */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="font-bold text-slate-800">
            Cumulative Working Capital Recovery Curve (INR ₹)
          </span>
          <span className="font-mono text-slate-500">
            Reflects 90-day implementation ramp
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                axisLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(v) => `₹${(v >= 100000 ? (v / 100000).toFixed(1) + 'L' : (v / 1000).toFixed(0) + 'k')}`}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 shadow-md rounded-lg p-3 text-xs space-y-1">
                        <span className="font-bold text-slate-900 block border-b border-slate-100 pb-1">{d.month}</span>
                        <div className="flex justify-between gap-4 text-emerald-700 font-bold">
                          <span>Total Cumulative Cash Saved:</span>
                          <span className="font-mono">{formatINR(d.cumTotalSavings)}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-amber-700">
                          <span>Cumulative Rate Recovery:</span>
                          <span className="font-mono">{formatINR(d.cumRateSavings)}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-rose-700">
                          <span>Cumulative Detention Recovery:</span>
                          <span className="font-mono">{formatINR(d.cumDetentionSavings)}</span>
                        </div>
                        <div className="pt-1 border-t border-slate-100 text-slate-500 flex justify-between">
                          <span>Monthly Rate Run-rate:</span>
                          <span className="font-mono font-semibold">{formatINR(d.monthlyTotal)} / mo</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area 
                type="monotone" 
                dataKey="cumTotalSavings" 
                name="Total Cumulative Savings (₹)" 
                stroke="#10b981" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
              />
              <Area 
                type="monotone" 
                dataKey="cumRateSavings" 
                name="Rate Variance Recovery (₹)" 
                stroke="#d97706" 
                strokeWidth={1.5}
                fillOpacity={1} 
                fill="url(#colorRate)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
