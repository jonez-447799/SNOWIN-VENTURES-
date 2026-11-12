import React, { useState } from 'react';
import { Truck, ShieldCheck, Clock, Search, CheckCircle2, AlertOctagon, RotateCcw, Plus, Calendar, FileText } from 'lucide-react';
import { DispatchRow, RulesConfig } from '../types/otif';
import { calculateRowStatus } from '../utils/otifCalculator';

interface GateTabletViewProps {
  dispatches: DispatchRow[];
  rules: RulesConfig;
  onUpdateDispatch: (id: string, updates: Partial<DispatchRow>) => void;
  onAddNewDispatch: () => void;
}

export const GateTabletView: React.FC<GateTabletViewProps> = ({
  dispatches,
  rules,
  onUpdateDispatch,
  onAddNewDispatch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'cleared'>('all');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const plantName = rules.factoryProfile?.plantName || 'Plant 1 Gate Cabin';
  const companyName = rules.factoryProfile?.companyName || 'Apex Precision Automotive';

  // Format current system time in YYYY-MM-DDTHH:mm
  const getCurrentSystemTimeISO = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const handleStampDepartureNow = (row: DispatchRow, mode: 'on_time' | 'late_90m' = 'on_time') => {
    const promisedMs = new Date(row.promisedDate).getTime();
    let targetDate: Date;
    if (Number.isFinite(promisedMs)) {
      // Stamp relative to the PO's scheduled day (-15 mins for on-time gate pass, or +90 mins for late gate hold)
      const offsetMinutes = mode === 'on_time' ? -15 : 90;
      targetDate = new Date(promisedMs + offsetMinutes * 60 * 1000);
    } else {
      targetDate = new Date();
    }
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const hh = String(targetDate.getHours()).padStart(2, '0');
    const min = String(targetDate.getMinutes()).padStart(2, '0');
    const stampedISO = `${yyyy}-${mm}-${dd}T${hh}:${min}`;

    onUpdateDispatch(row.id, {
      actualOut: stampedISO,
      ...(mode === 'late_90m' && !row.delayReason ? { delayReason: 'No vehicle' } : {}),
    });
    setSuccessToast(
      mode === 'on_time'
        ? `Truck ${row.vehicle} stamped ON-TIME at ${stampedISO.replace('T', ' ')}!`
        : `Truck ${row.vehicle} stamped LATE (+90m) at ${stampedISO.replace('T', ' ')}!`
    );
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const calculatedRows = dispatches.map(d => calculateRowStatus(d, rules));

  const filteredRows = calculatedRows.filter(row => {
    const query = searchQuery.toLowerCase();
    const matchQuery = 
      row.vehicle.toLowerCase().includes(query) ||
      row.customer.toLowerCase().includes(query) ||
      row.po.toLowerCase().includes(query) ||
      row.part.toLowerCase().includes(query);

    if (!matchQuery) return false;

    // A truck is "cleared" if actualOut is filled and not empty
    const isCleared = Boolean(row.actualOut);
    if (activeFilter === 'cleared') return isCleared;
    if (activeFilter === 'pending') return !isCleared;
    return true;
  });

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Tablet Cabin Header */}
      <div className="industrial-glass border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  Main Security Gate Out-Register
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-300 border border-white/10 uppercase">
                  Tablet Touch Kiosk
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                <span className="font-semibold text-white">{companyName}</span> • {plantName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onAddNewDispatch}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Log Gate Dispatch</span>
            </button>
          </div>
        </div>

        {/* Live Security Guard Guidance */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Gate Clock Synchronized: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Rule: Stamp vehicle out-time the moment the security boom barrier opens.
          </div>
        </div>
      </div>

      {successToast && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold text-emerald-300 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Touch-Friendly Search & Filter Toolbar */}
      <div className="industrial-card border border-white/10 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Truck Plate (e.g. TN-21), PO, or Customer..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Loads ({calculatedRows.length})
          </button>
          <button
            onClick={() => setActiveFilter('cleared')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              activeFilter === 'cleared'
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Stamped Departures ({calculatedRows.filter(r => r.actualOut).length})
          </button>
        </div>
      </div>

      {/* Big Touch Card Dispatch List */}
      <div className="space-y-3">
        {filteredRows.map(row => {
          const isStamped = Boolean(row.actualOut);
          return (
            <div
              key={row.id}
              className={`industrial-card rounded-xl p-4 sm:p-5 transition shadow-lg ${
                isStamped
                  ? row.otif
                    ? 'border-emerald-500/30'
                    : 'border-rose-500/30'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Truck & PO Info */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold font-mono text-white tracking-wider px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-emerald-400" />
                      {row.vehicle || 'Vehicle Unassigned'}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 font-mono">
                      {row.customer}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      PO: <strong className="text-slate-300">{row.po}</strong>
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>Part: <strong className="text-white">{row.part}</strong></span>
                    <span>Quantity: <strong className="text-emerald-400 font-mono">{row.shippedQty}</strong> of {row.orderedQty} pcs</span>
                    <span className="font-mono text-slate-400">Promised: <strong className="text-slate-200">{row.promisedDate.replace('T', ' ')}</strong></span>
                  </div>
                </div>

                {/* Gate Out Stamp Action */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="text-right font-mono text-xs">
                    <span className="text-slate-400 text-[11px] block">Security Gate Out Time:</span>
                    {isStamped ? (
                      <span className="font-bold text-white text-xs bg-slate-950 px-2 py-1 rounded border border-slate-800 inline-block mt-0.5">
                        {row.actualOut.replace('T', ' ')}
                      </span>
                    ) : (
                      <span className="text-amber-400 italic text-[11px] font-semibold">Awaiting Barrier Open</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStampDepartureNow(row, 'on_time')}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-mono font-semibold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                      title="Stamp vehicle gate pass on-time (-15m before promised slot)"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Stamp On-Time</span>
                    </button>
                    <button
                      onClick={() => handleStampDepartureNow(row, 'late_90m')}
                      className="px-2.5 py-2 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/40 active:scale-95 text-slate-300 border border-slate-700 font-mono font-semibold text-[11px] rounded-lg transition cursor-pointer"
                      title="Simulate +90m late gate departure"
                    >
                      +90m Late
                    </button>
                  </div>

                  <div className="flex items-center">
                    {row.otif ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-500/40">
                        PASS (OTIF)
                      </span>
                    ) : isStamped ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-rose-950/40 text-rose-300 border border-rose-500/40">
                        FAIL ({row.failType})
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-slate-900 text-slate-400 border border-slate-800">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredRows.length === 0 && (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
            No trucks found matching "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
};
