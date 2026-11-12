import React, { useState } from 'react';
import { MapPin, Navigation, TrendingUp, AlertTriangle, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { LaneSummary, CalculatedTrip } from '../types/freight';
import { formatINR, formatTonneRate } from '../utils/auditCalculations';

interface LaneAnalysisViewProps {
  laneSummaries: LaneSummary[];
  trips: CalculatedTrip[];
  onNavigateToTrips: (filter?: { lane?: string }) => void;
}

export const LaneAnalysisView: React.FC<LaneAnalysisViewProps> = ({
  laneSummaries,
  trips,
  onNavigateToTrips
}) => {
  const [activeLaneName, setActiveLaneName] = useState<string>(laneSummaries[0]?.lane || 'Ambattur to Oragadam');

  const selectedLane = laneSummaries.find(l => l.lane === activeLaneName) || laneSummaries[0];
  const laneTrips = trips.filter(t => t.lane === activeLaneName);

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Overview header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="max-w-3xl space-y-2">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
            Route-by-Route Analysis
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Efficiency Gaps by Individual Route
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            A lane is one specific route. Ambattur to Oragadam is one lane; Ambattur to Sriperumbudur is another. <strong>Never average them</strong>. A longer lane looks expensive and hides the leak, while a short lane with high rates escapes scrutiny.
          </p>
        </div>

        {/* Lane Selector Pills (functional tab controls) */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
          {laneSummaries.map((lane) => {
            const isActive = lane.lane === activeLaneName;
            return (
              <button
                key={lane.lane}
                onClick={() => setActiveLaneName(lane.lane)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{lane.lane}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isActive ? 'bg-slate-800 text-amber-300' : 'bg-slate-200 text-slate-700'
                }`}>
                  {lane.tripsCount} trips
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedLane && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lane Headline Card */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <span>{selectedLane.km} km distance</span>
                <span aria-hidden="true">·</span>
                <span>{selectedLane.tripsCount} runs</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {selectedLane.lane}
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <span className="text-emerald-800 block text-[11px]">Best Clean Benchmark Rate</span>
                <span className="text-2xl font-bold font-mono text-emerald-900 block mt-0.5">
                  {formatTonneRate(selectedLane.bestCleanRate)}
                </span>
                <span className="text-[11px] text-emerald-700 mt-1 block">
                  Set by <strong>{selectedLane.bestTransporter}</strong> (Single-drop clean trip)
                </span>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3">
                <span className="text-amber-800 block text-[11px]">Total Rate Leak</span>
                <span className="text-2xl font-bold font-mono text-amber-900 block mt-0.5">
                  {formatINR(selectedLane.totalRateLeak)}
                </span>
                <span className="text-[11px] text-amber-700 mt-1 block">
                  Extra paid on dearer trips on this same road
                </span>
              </div>

              <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-3">
                <span className="text-rose-800 block text-[11px]">Gate Detention Cost</span>
                <span className="text-2xl font-bold font-mono text-rose-900 block mt-0.5">
                  {formatINR(selectedLane.totalDetention)}
                </span>
                <span className="text-[11px] text-rose-700 mt-1 block">
                  {selectedLane.totalWaitHours} total waiting hours incurred at gates
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Combined Lane Waste</span>
              <strong className="text-base font-mono text-slate-900 font-bold">
                {formatINR(selectedLane.totalWaste)}
              </strong>
            </div>

            <button
              onClick={() => onNavigateToTrips({ lane: selectedLane.lane })}
              className="w-full py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Filter Trips on this Lane</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lane Trips Breakdown & Visual Gap */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visual Rate Gap Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Rate Variance on {selectedLane.lane}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Every bar is one trip's bill divided by tonnes. Compare against the clean benchmark line.
              </p>

              <div className="space-y-4">
                {laneTrips.map((t) => {
                  const variance = t.ratePerTonne - selectedLane.bestCleanRate;
                  const variancePct = selectedLane.bestCleanRate > 0 
                    ? Math.round((variance / selectedLane.bestCleanRate) * 100) 
                    : 0;
                  const isBenchmark = t.isBenchmark;
                  const isSplit = t.split === 'Yes';

                  return (
                    <div key={t.id} className="border border-slate-100 rounded-lg p-3.5 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400">{t.date}</span>
                          <span className="font-bold text-slate-900">{t.transporter}</span>
                          {isBenchmark && (
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                              Benchmark
                            </span>
                          )}
                          {isSplit && (
                            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              Split Load
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <span className="text-slate-500">{t.weightKg} kg · Bill {formatINR(t.bill)}</span>
                          <span className="font-bold text-slate-900">{formatTonneRate(t.ratePerTonne)}</span>
                        </div>
                      </div>

                      {/* Bar indicator */}
                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden flex">
                          <div 
                            className={`h-full ${isBenchmark ? 'bg-emerald-500' : isSplit ? 'bg-slate-300' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(100, (t.ratePerTonne / (selectedLane.worstRatePerTonne * 1.05)) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono shrink-0 w-28 text-right">
                          {isSplit ? (
                            <span className="text-slate-400">Excluded (Split)</span>
                          ) : variance <= 1 ? (
                            <span className="text-emerald-700 font-semibold">Baseline</span>
                          ) : (
                            <span className="text-amber-800 font-bold">+{variancePct}% ({formatINR(t.rateLeak)})</span>
                          )}
                        </span>
                      </div>

                      {t.waitHours > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{t.waitHours}h gate wait = {formatINR(t.detention)} detention</span>
                          {t.notes && <span className="text-slate-400">· {t.notes}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lane specific story / insight */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-700 space-y-2">
              <strong className="text-slate-900 block font-semibold">
                {activeLaneName.includes('Oragadam') && "The Oragadam Story: Same Road, 4 Days Apart"}
                {activeLaneName.includes('Sriperumbudur') && "The Sriperumbudur Story: The Worst Leak Lane"}
                {activeLaneName.includes('Maraimalai') && "The Maraimalai Nagar Story: High Distance & Long Gate Queues"}
              </strong>
              <p className="leading-relaxed">
                {activeLaneName.includes('Oragadam') && (
                  "Murugan on 2 Sep charged ₹1,484 a tonne (bill ₹4,200 for 2.8 tonnes) with 30 minutes wait. Four days later on 4 Sep, Siva Transport charged ₹2,033 a tonne (bill ₹6,100 for 3 tonnes) and sat 3.5 hours at the gate. The road between Ambattur and Oragadam did not change. The leak was ₹1,648 in rate plus ₹700 in waiting."
                )}
                {activeLaneName.includes('Sriperumbudur') && (
                  "Sriperumbudur has the largest rate gap: Murugan clean benchmark is ₹1,188/tonne, whereas Siva Transport billed ₹2,344/tonne on 12 Sep (₹3,469 leak) and Ravi billed ₹2,319/tonne. Sriperumbudur alone accounts for ₹4,600 (over 50%) of your total monthly rate leak."
                )}
                {activeLaneName.includes('Maraimalai') && (
                  "At 48 km, Maraimalai Nagar is your longest lane. Murugan provided the clean benchmark at ₹1,600/tonne with minimal gate wait. Siva charged ₹2,384/tonne with 5 hours of detention, leaking ₹1,960 in rate and ₹1,000 in waiting."
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
