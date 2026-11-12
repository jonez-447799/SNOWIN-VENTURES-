import React, { useState, useMemo } from 'react';
import { 
  TrendingDown, 
  Clock, 
  Truck, 
  MapPin, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  AlertOctagon, 
  PhoneCall, 
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { AuditTotals, LaneSummary, TransporterSummary, CalculatedTrip, RulesConfig, ScaleProfile } from '../types/freight';
import { formatINR, formatTonneRate } from '../utils/auditCalculations';
import { SCALE_PROFILES } from '../data/defaultData';
import { CostSavingsForecast } from './CostSavingsForecast';

interface OwnerReportViewProps {
  totals: AuditTotals;
  laneSummaries: LaneSummary[];
  transporterSummaries: TransporterSummary[];
  trips: CalculatedTrip[];
  rules: RulesConfig;
  currentScale: ScaleProfile;
  onChangeScale: (scale: ScaleProfile) => void;
  onNavigateToTrips: (filter?: { lane?: string; transporter?: string }) => void;
  onNavigateToDossier: () => void;
  onNavigateToProposal: () => void;
  onNavigateToIngestion: () => void;
  onNavigateToObjections?: () => void;
}

export const OwnerReportView: React.FC<OwnerReportViewProps> = ({
  totals,
  laneSummaries,
  transporterSummaries,
  trips,
  rules,
  currentScale,
  onChangeScale,
  onNavigateToTrips,
  onNavigateToDossier,
  onNavigateToProposal,
  onNavigateToIngestion,
  onNavigateToObjections
}) => {
  const [selectedLane, setSelectedLane] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<'daily' | 'cumulative'>('daily');

  // Multiplier-adjusted metrics based on selected client spend tier
  const scaledPaid = totals.freightPaid * currentScale.multiplier;
  const scaledRateLeak = totals.rateLeak * currentScale.multiplier;
  const scaledDetention = totals.detention * currentScale.multiplier;
  const scaledTotalLeak = totals.totalLeak * currentScale.multiplier;
  const annualizedLeak = scaledTotalLeak * 12;

  // Siva leak percentage of total rate leak
  const sivaSummary = transporterSummaries.find(t => t.transporter.toLowerCase().includes('siva'));
  const muruganSummary = transporterSummaries.find(t => t.transporter.toLowerCase().includes('murugan'));

  // Prepare chronological trend data for Recharts
  const trendData = useMemo(() => {
    // Sort trips chronologically
    const sorted = [...trips].sort((a, b) => a.date.localeCompare(b.date));
    
    let cumRateLeak = 0;
    let cumDetention = 0;
    let cumTotal = 0;

    return sorted.map((t) => {
      cumRateLeak += t.rateLeak;
      cumDetention += t.detention;
      cumTotal += t.totalLeak;

      // Format date like "02 Sep"
      const dateParts = t.date.split('-');
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]} Sep` : t.date;

      return {
        id: t.id,
        date: formattedDate,
        fullDate: t.date,
        transporter: t.transporter,
        lane: t.lane,
        rateLeak: t.rateLeak,
        detention: t.detention,
        totalLeak: t.totalLeak,
        cumRateLeak,
        cumDetention,
        cumTotal,
        waitHours: t.waitHours,
        isBenchmark: t.isBenchmark,
        isSplit: t.split === 'Yes'
      };
    });
  }, [trips]);

  // First half vs Second half analysis
  const midIndex = Math.floor(trendData.length / 2);
  const firstHalfWaste = trendData.slice(0, midIndex).reduce((s, d) => s + d.totalLeak, 0);
  const secondHalfWaste = trendData.slice(midIndex).reduce((s, d) => s + d.totalLeak, 0);
  const isEscalating = secondHalfWaste > firstHalfWaste;

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* 1. Project Discipline Notice */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <span>Project 3: Freight Leak Audit</span>
            <span aria-hidden="true">·</span>
            <span>Ambattur Unit</span>
            <span aria-hidden="true">·</span>
            <span>September 2026</span>
          </div>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            <strong className="text-white font-semibold">Freight is only the cost of moving goods</strong>, not the cost of the goods. Dead stock is Project 1. Late dispatch is Project 2. Do not mix them in this meeting.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={onNavigateToDossier}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap"
          >
            Owner Meeting Dossier
          </button>
        </div>
      </div>

      {/* 2. Executive Headline Banner with Scale Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        {/* Scale Profile Switcher (Solving Hardest Truth #3: Small Absolute Money) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700">Client Scale & Spend Tier:</span>
            <span className="text-slate-500 hidden md:inline">Select manufacturing plant profile to simulate enterprise impact</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {SCALE_PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => onChangeScale(profile)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  currentScale.id === profile.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>{profile.name}</span>
                <span className="ml-1 text-[10px] font-mono opacity-80">({profile.monthlySpendLabel})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-4xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Executive Audit Finding
            </span>
            <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded">
              {currentScale.name} ({currentScale.cluster})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            About {formatINR(scaledTotalLeak)} in September that your own cheap day says you did not have to spend.
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            You are not being quoted theoretical market averages or online freight rates. We compared every bill directly against your own cheapest clean trip on that exact lane. If your factory has already moved a load cheaper, the dearer trips are waste you can cut. Both bills are yours.
          </p>

          {/* Quick links to Commercial Proposals, Objection-Buster & Paper Reconciler */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToProposal}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Commercial Proposal & ROI</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
            {onNavigateToObjections && (
              <button
                onClick={onNavigateToObjections}
                className="px-3.5 py-1.5 text-xs font-semibold text-rose-950 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Transporter Objection-Buster</span>
                <ArrowRight className="w-3.5 h-3.5 text-rose-700" />
              </button>
            )}
            <button
              onClick={onNavigateToIngestion}
              className="px-3.5 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>Gate & LR Ingest</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
            </button>
          </div>
        </div>

        {/* 3. The Four Headline Numbers */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Freight Paid */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">1. Freight Paid</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
              {formatINR(scaledPaid)}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {currentScale.multiplier > 1 ? `Scaled across ~${currentScale.typicalTripsPerMonth} trips/mo.` : `Every bill in September added up across ${totals.totalTrips} trips.`} What actually left your bank account.
            </p>
          </div>

          {/* Metric 2: Rate Leak */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-5">
            <div className="flex items-center justify-between text-amber-800 mb-2">
              <span className="text-xs font-semibold">2. Rate Leak</span>
              <TrendingDown className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-900">
              {formatINR(scaledRateLeak)}
            </div>
            <p className="text-xs text-amber-800/80 mt-2">
              Extra ₹/tonne paid vs your own lowest clean rate on the same lane. Split loads are excluded.
            </p>
          </div>

          {/* Metric 3: Detention */}
          <div className="bg-rose-50/50 border border-rose-200 rounded-lg p-5">
            <div className="flex items-center justify-between text-rose-800 mb-2">
              <span className="text-xs font-semibold">3. Gate Detention</span>
              <Clock className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-rose-900">
              {formatINR(scaledDetention)}
            </div>
            <p className="text-xs text-rose-800/80 mt-2">
              Gate idle penalty @ ₹{rules.detentionRatePerHour}/hr. Vehicles sat waiting instead of running trips.
            </p>
          </div>

          {/* Metric 4: Total Leak & Wait */}
          <div className="bg-slate-900 text-white rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-300 mb-2">
              <span className="text-xs font-semibold">4. Total Leak + Wait</span>
              <AlertOctagon className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-400">
              {formatINR(scaledTotalLeak)}
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Headline waste. Annualized: <strong className="text-white font-bold">{formatINR(annualizedLeak)}/yr</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 3.5. Cost Escalation Timeline Line Chart using Recharts */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-amber-600" />
              <span>Month Cost Progression Timeline</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              Rate Leak & Detention Cost Trend (September 2026)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualize how rate variances and gate idle penalties accumulated across all 12 departures
            </p>
          </div>

          {/* Segmented control for Chart Mode */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setChartMode('daily')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                chartMode === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per-Trip Incident Leak
            </button>
            <button
              onClick={() => setChartMode('cumulative')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                chartMode === 'cumulative'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cumulative Month-to-Date
            </button>
          </div>
        </div>

        {/* Recharts Line Chart Container */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(val) => `₹${val.toLocaleString('en-IN')}`}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 shadow-lg rounded-lg p-3 text-xs space-y-1.5 z-50">
                        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-1.5">
                          <span className="font-bold text-slate-900">{data.date} (Trip: {data.id})</span>
                          <span className="text-[10px] font-mono text-slate-500">{data.lane}</span>
                        </div>
                        <div className="text-[11px] text-slate-700">
                          Carrier: <strong className="font-semibold text-slate-900">{data.transporter}</strong>
                        </div>
                        
                        {chartMode === 'daily' ? (
                          <>
                            <div className="flex justify-between gap-4 text-amber-800">
                              <span>Rate Leak:</span>
                              <span className="font-mono font-bold">
                                {data.isSplit ? 'Excluded (Split)' : formatINR(data.rateLeak)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4 text-rose-700">
                              <span>Detention ({data.waitHours}h):</span>
                              <span className="font-mono font-bold">{formatINR(data.detention)}</span>
                            </div>
                            <div className="flex justify-between gap-4 pt-1 border-t border-slate-100 font-bold text-slate-900">
                              <span>Total Trip Waste:</span>
                              <span className="font-mono">{formatINR(data.totalLeak)}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between gap-4 text-amber-800">
                              <span>Cum. Rate Leak:</span>
                              <span className="font-mono font-bold">{formatINR(data.cumRateLeak)}</span>
                            </div>
                            <div className="flex justify-between gap-4 text-rose-700">
                              <span>Cum. Detention:</span>
                              <span className="font-mono font-bold">{formatINR(data.cumDetention)}</span>
                            </div>
                            <div className="flex justify-between gap-4 pt-1 border-t border-slate-100 font-bold text-slate-900">
                              <span>Total Cumulative Waste:</span>
                              <span className="font-mono text-amber-600">{formatINR(data.cumTotal)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconType="circle"
              />
              {chartMode === 'daily' ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="rateLeak"
                    name="Rate Leak (₹)"
                    stroke="#d97706"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#d97706', strokeWidth: 1, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="detention"
                    name="Gate Detention (₹)"
                    stroke="#e11d48"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#e11d48', strokeWidth: 1, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalLeak"
                    name="Total Trip Waste (₹)"
                    stroke="#0f172a"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#0f172a' }}
                  />
                </>
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="cumRateLeak"
                    name="Cumulative Rate Leak (₹)"
                    stroke="#d97706"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#d97706' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumDetention"
                    name="Cumulative Detention (₹)"
                    stroke="#e11d48"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#e11d48' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumTotal"
                    name="Total Cumulative Waste (₹)"
                    stroke="#0f172a"
                    strokeWidth={3.5}
                    dot={{ r: 5, fill: '#0f172a' }}
                    activeDot={{ r: 7 }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Narrative & Period Escalation Insight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
            <span className="text-slate-500 font-medium block">Early Month Baseline (Sep 01 - 07)</span>
            <strong className="text-sm font-mono font-bold text-slate-900 block mt-1">
              Murugan Benchmark Phase
            </strong>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Early trips established the lowest clean rates on Oragadam (₹1,484/t) and Sriperumbudur (₹1,188/t) with under 30-minute gate waits.
            </p>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3.5">
            <span className="text-amber-800 font-semibold block">Mid-Month Surge (Sep 12 - 16)</span>
            <strong className="text-sm font-mono font-bold text-amber-900 block mt-1">
              ₹8,493 Leaked Across 3 Trips
            </strong>
            <p className="text-[11px] text-amber-900/80 mt-1 leading-relaxed">
              Costs sharply escalated when Siva Transport ran 12 Sep (₹3,469 rate leak + 5h wait) and 16 Sep (₹1,960 leak + 5h wait), alongside Ravi on 15 Sep.
            </p>
          </div>

          <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-3.5">
            <span className="text-rose-800 font-semibold block">Period Trend Conclusion</span>
            <strong className="text-sm font-mono font-bold text-rose-900 block mt-1">
              Concentrated Leak Surge
            </strong>
            <p className="text-[11px] text-rose-900/80 mt-1 leading-relaxed">
              Costs did not rise gradually across all trips; waste spiked abruptly on specific dates whenever non-benchmark carriers operated with high gate delays.
            </p>
          </div>
        </div>
      </div>

      {/* 3.8. Cost Savings Forecast & Reduction Milestones */}
      <CostSavingsForecast 
        totals={totals}
        rules={rules}
        currentScale={currentScale}
      />

      {/* 4. The Two Big Drivers: Siva vs Murugan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Siva Transport Card */}
        <div className="bg-white border-2 border-rose-200 rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-semibold">
                The Primary Confrontation
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">Siva Transport</h2>
              <p className="text-xs text-slate-500 mt-0.5">4 trips billed ₹23,500</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Waste</span>
              <span className="text-xl font-mono font-bold text-rose-600">
                {sivaSummary ? formatINR(sivaSummary.totalWaste) : '₹10,177'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Rate Leak Carried</span>
              <strong className="font-mono text-slate-900">{sivaSummary ? formatINR(sivaSummary.totalRateLeak) : '₹7,077'} (78% of all leak)</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Gate Detention Incurred</span>
              <strong className="font-mono text-slate-900">{sivaSummary ? formatINR(sivaSummary.totalDetention) : '₹3,100'} (15.5 hours)</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Average Wait per Trip</span>
              <strong className="font-mono text-rose-700 font-semibold">{sivaSummary?.avgWaitHours || 3.9} hours</strong>
            </div>
          </div>

          <p className="text-xs text-slate-600 bg-rose-50/70 p-3 rounded-lg mt-4 leading-relaxed">
            <strong>This is the call:</strong> Siva drove the exact same lanes as Murugan, but charged ₹500–₹1,000 more per tonne, and his trucks sat idle at gates for over 15 hours.
          </p>

          <button
            onClick={() => onNavigateToTrips({ transporter: 'Siva Transport' })}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
          >
            <span>Inspect All 4 Siva Bills</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Murugan Card */}
        <div className="bg-white border-2 border-emerald-200 rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                The Benchmark Carrier
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">Murugan</h2>
              <p className="text-xs text-slate-500 mt-0.5">5 trips billed ₹22,700</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Rate Leak</span>
              <span className="text-xl font-mono font-bold text-emerald-600">
                {muruganSummary ? formatINR(muruganSummary.totalRateLeak) : '₹835'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Benchmark Lane Rates</span>
              <strong className="text-emerald-700 font-semibold">Lowest clean rate on EVERY lane</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Gate Detention Incurred</span>
              <strong className="font-mono text-slate-900">{muruganSummary ? formatINR(muruganSummary.totalDetention) : '₹700'} (3.5 hours)</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Average Wait per Trip</span>
              <strong className="font-mono text-slate-900">{muruganSummary?.avgWaitHours || 0.7} hours (In-and-out fast)</strong>
            </div>
          </div>

          <p className="text-xs text-slate-600 bg-emerald-50/70 p-3 rounded-lg mt-4 leading-relaxed">
            <strong>Do not fight him:</strong> Murugan was the cheap day on every single lane. He loads fast, clears gates with 30-minute turnarounds, and provides your factory's baseline.
          </p>

          <button
            onClick={() => onNavigateToTrips({ transporter: 'Murugan' })}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            <span>Inspect All 5 Murugan Bills</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. Breakdown By Lane */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Breakdown By Lane</h2>
            <p className="text-xs text-slate-500">
              A lane is one route. Never average them. A longer lane looks expensive and hides the leak.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            3 Active Lanes · 12 Verified Runs
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {laneSummaries.map((lane) => {
            const isWorst = lane.lane.includes('Sriperumbudur');
            return (
              <div 
                key={lane.lane}
                className={`rounded-lg border p-5 transition-all ${
                  isWorst 
                    ? 'border-amber-300 bg-amber-50/20' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono text-slate-500">
                      {lane.km} km · {lane.tripsCount} trips
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {lane.lane}
                    </h3>
                  </div>
                  {isWorst && (
                    <span className="text-[10px] font-mono text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-bold">
                      Worst Lane
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Best Clean Rate</span>
                    <strong className="font-mono font-bold text-slate-900">
                      {formatTonneRate(lane.bestCleanRate)}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Rate Leak</span>
                    <strong className="font-mono font-bold text-amber-700">
                      {formatINR(lane.totalRateLeak)}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Gate Detention ({lane.totalWaitHours}h)</span>
                    <strong className="font-mono text-slate-800">
                      {formatINR(lane.totalDetention)}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 font-semibold">
                    <span className="text-slate-700">Combined Waste</span>
                    <strong className="font-mono text-slate-900">
                      {formatINR(lane.totalWaste)}
                    </strong>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Benchmark: <strong>{lane.bestTransporter}</strong>
                  </span>
                  <button
                    onClick={() => onNavigateToTrips({ lane: lane.lane })}
                    className="text-slate-900 hover:text-amber-700 font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    <span>View trips</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. The Meeting Script ("What You Are Actually Selling") */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <PhoneCall className="w-4 h-4 text-slate-900" />
          <span>The Transporter Negotiation Script</span>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">
            How to Confront Siva Transport in the Meeting
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            A small factory owner knows the lorry bill. He does not know that the same lane, Ambattur to Oragadam, cost him ₹1,484 a tonne on a good day and ₹2,033 a tonne four days later. The difference is not the highway. The highway did not change. The transporter, the waiting, and the empty return did.
          </p>

          <div className="bg-white border border-slate-300 rounded-lg p-5 space-y-4 text-xs sm:text-sm text-slate-800">
            <div className="flex items-start gap-3">
              <span className="font-mono font-bold text-slate-400 shrink-0">Point 1</span>
              <p>
                <strong className="text-slate-900">The rate benchmark:</strong> "Siva, on 2 September Murugan took 2.8 tonnes to Oragadam for ₹4,200 (₹1,484 a tonne). Two days later on 4 September, you took 3 tonnes on the exact same road and billed ₹6,100 (₹2,033 a tonne). That single trip cost me ₹1,648 extra."
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="font-mono font-bold text-slate-400 shrink-0">Point 2</span>
              <p>
                <strong className="text-slate-900">The gate waiting:</strong> "On top of the extra rate, your vehicle sat at the gate for 3.5 hours on that trip, and 5 hours on Sriperumbudur. Across your 4 trips, my factory lost 15.5 hours. At Chennai small-fleet standard rate of ₹200 an hour, that is ₹3,100 wasted."
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="font-mono font-bold text-slate-400 shrink-0">Point 3</span>
              <p>
                <strong className="text-slate-900">The action:</strong> "In September alone, your 4 trips leaked ₹7,077 in rate and ₹3,100 in waiting—over ₹10,000 extra. Either you match Murugan's ₹1,484 / ₹1,188 clean lane rates, or all October dispatch goes to Murugan first."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

