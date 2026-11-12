import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Truck, Info, ArrowRight, ShieldCheck } from 'lucide-react';
import { CARRIER_CAPACITY_DATA } from '../data/defaultData';
import { formatINR } from '../utils/auditCalculations';

interface CapacityRiskMatrixProps {
  onNavigateToTrips: (filter?: { transporter?: string }) => void;
}

export const CapacityRiskMatrix: React.FC<CapacityRiskMatrixProps> = ({ onNavigateToTrips }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Solving Hardest Truth #4: Operational Risk & Production Line Stoppage</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Carrier Capacity & Dual-Sourcing Optimization Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Never cut off an expensive carrier without checking fleet size. A factory line shutdown costs ₹1,00,000/hr—10x more than a freight leak.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
          Supply Chain Resilience
        </span>
      </div>

      {/* The Dilemma Explanation Box */}
      <div className="bg-amber-50/70 border-l-4 border-amber-500 p-4 rounded-r-lg text-xs leading-relaxed text-amber-950 space-y-1">
        <strong className="font-bold block">The Operational Trap Most Naive Consultants Fall Into:</strong>
        <p>
          Murugan is the cheapest transporter, but he only owns <strong>3 trucks</strong>. If you greedily shift 100% of your factory's dispatches to Murugan, his fleet will be fully booked on Day 12. 
          When Hyundai or Ashok Leyland demands urgent parts and Murugan has no truck, your factory faces ₹1 Lakh/hr OEM line-stoppage penalties. 
          <strong>Siva Transport has 16 trucks.</strong> You do not fire Siva; you use Murugan's invoice to force Siva to match the benchmark rate for a guaranteed 25% allocation.
        </p>
      </div>

      {/* Carrier Capacity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CARRIER_CAPACITY_DATA.map((carrier) => {
          const isHighRisk = carrier.operationalRisk === 'High';
          const isMediumRisk = carrier.operationalRisk === 'Medium';

          return (
            <div 
              key={carrier.transporter}
              className={`rounded-xl border p-5 space-y-4 flex flex-col justify-between ${
                carrier.transporter === 'Murugan' 
                  ? 'border-emerald-200 bg-emerald-50/20' 
                  : carrier.transporter.includes('Siva')
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200 bg-slate-50/40'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{carrier.transporter}</h3>
                    <span className="text-xs text-slate-500 font-mono">
                      Estimated Fleet: <strong>{carrier.estimatedFleet} Trucks</strong>
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    carrier.transporter === 'Murugan'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}>
                    {carrier.dailyAvailabilityConfidence}% Fleet Availability
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Current Volume Share:</span>
                    <strong className="font-mono text-slate-900">{carrier.currentSpendSharePct}%</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Recommended Allocation:</span>
                    <strong className="font-mono font-bold text-emerald-700 text-sm">
                      {carrier.recommendedAllocationPct}% Target
                    </strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed bg-white/80 p-3 rounded-lg border border-slate-200">
                  {carrier.riskJustification}
                </p>
              </div>

              <button
                onClick={() => onNavigateToTrips({ transporter: carrier.transporter })}
                className="w-full py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <span>Inspect Carrier Runs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* The 70 / 25 / 5 Dual Sourcing Recommendation */}
      <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 max-w-2xl">
          <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
            Optimized Dual-Sourcing Solution
          </span>
          <h3 className="text-lg font-bold text-white">
            The 70 / 25 / 5 Production-Safe Contract Strategy
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            • <strong>70% to Murugan:</strong> Captures maximum benchmark savings without exceeding his 3-truck capacity.<br />
            • <strong>25% to Siva Transport:</strong> Guaranteed secondary volume, provided he matches Murugan's clean rate card.<br />
            • <strong>5% to Ravi (Broker):</strong> Retains spot market safety valve for high-demand dispatch spikes.
          </p>
        </div>

        <div className="shrink-0 bg-slate-800 border border-slate-700 p-4 rounded-lg text-center font-mono">
          <span className="text-xs text-slate-400 block">Line Stoppage Risk</span>
          <span className="text-2xl font-bold text-emerald-400 block mt-0.5">NEAR ZERO</span>
          <span className="text-[10px] text-slate-400 block mt-1">94.8% Leak Captured</span>
        </div>
      </div>
    </div>
  );
};
