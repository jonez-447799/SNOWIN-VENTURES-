import React, { useState } from 'react';
import { AlertTriangle, Clock, TrendingUp, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { AnomalyAlert } from '../types/freight';
import { formatINR } from '../utils/auditCalculations';

interface AlertsBannerProps {
  alerts: AnomalyAlert[];
  onSelectTrip: (tripId: string) => void;
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({ alerts, onSelectTrip }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (alerts.length === 0) return null;

  return (
    <div className="bg-amber-50/80 border-b border-amber-200 text-amber-950 px-4 sm:px-6 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="font-semibold text-amber-900">
            {alerts.length} Audit Anomalies Detected:
          </span>
          <span className="text-amber-800">
            Excessive gate delays and rate deviations identified in September bills.
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-amber-900 hover:text-amber-950 flex items-center gap-1 self-start sm:self-auto"
        >
          <span>{isExpanded ? 'Hide Anomalies' : `View ${alerts.length} Flagged Trips`}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-amber-200/60 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => onSelectTrip(alert.tripId)}
              className="bg-white/90 border border-amber-300/80 rounded-lg p-3 hover:bg-white cursor-pointer transition-colors text-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    {alert.type === 'gate_delay' ? (
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                    ) : (
                      <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                    )}
                    {alert.title}
                  </span>
                  <span className="font-mono font-bold text-rose-700 text-[11px]">
                    {formatINR(alert.impactAmount)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  {alert.description}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Trip: {alert.tripId}</span>
                <span className="text-amber-800 font-semibold flex items-center gap-0.5">
                  Inspect Bill <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
