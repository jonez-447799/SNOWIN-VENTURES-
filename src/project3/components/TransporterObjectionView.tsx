import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Printer, 
  MessageSquare, 
  Scale, 
  FileText, 
  Clock, 
  Fuel, 
  Truck
} from 'lucide-react';
import { CalculatedTrip, RulesConfig } from '../types/freight';
import { DEFAULT_OBJECTIONS } from '../data/defaultData';
import { formatINR } from '../utils/auditCalculations';

interface TransporterObjectionViewProps {
  trips: CalculatedTrip[];
  rules: RulesConfig;
  onNavigateToTrips: (filter?: { transporter?: string; lane?: string }) => void;
}

export const TransporterObjectionView: React.FC<TransporterObjectionViewProps> = ({
  trips,
  rules,
  onNavigateToTrips
}) => {
  const [selectedObjectionId, setSelectedObjectionId] = useState<string>(DEFAULT_OBJECTIONS[0].id);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  const selectedObjection = DEFAULT_OBJECTIONS.find(o => o.id === selectedObjectionId) || DEFAULT_OBJECTIONS[0];
  const tripA = trips.find(t => t.id === selectedObjection.supportingTripIdA);
  const tripB = trips.find(t => t.id === selectedObjection.supportingTripIdB);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(selectedObjection.counterScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handlePrintPlaybook = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded">
                Operational Defense Matrix
              </span>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Hurdle #2: Transporter Resistance
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Transporter Objection-Buster & Negotiation Room
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              When factory owners confront lorry providers, carriers push back with standard excuses: <em>"Diesel jumped"</em>, <em>"Truck returned empty"</em>, or <em>"Your gate delayed me"</em>. 
              Here is the unarguable receipt-to-receipt proof comparing their bills against their own clean benchmark on the same road.
            </p>
          </div>

          <button
            onClick={handlePrintPlaybook}
            className="no-print self-start md:self-center px-3.5 py-2 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 shrink-0"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Negotiation Playbook</span>
          </button>
        </div>
      </div>

      {/* Objection Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {DEFAULT_OBJECTIONS.map((obj) => {
          const isSelected = obj.id === selectedObjectionId;
          return (
            <button
              key={obj.id}
              onClick={() => setSelectedObjectionId(obj.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                  isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
                }`}>
                  {obj.transporter}
                </span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                  {obj.id}
                </span>
              </div>
              <p className={`text-xs font-bold line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                "{obj.excuse}"
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Objection Deep-Dive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: The Evidence & Side-by-Side Lorry Bill Replay */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] font-mono uppercase text-slate-500 font-bold block mb-1">
                The Claim vs. Cold Reality
              </span>
              <h2 className="text-lg font-black text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>Excuse: "{selectedObjection.excuse}"</span>
              </h2>
              <p className="text-xs text-slate-700 mt-2 font-medium bg-slate-50 p-3 rounded-lg border border-slate-200">
                <strong className="text-slate-900">The Hard Truth:</strong> {selectedObjection.realityCheck}
              </p>
            </div>

            {/* Side-by-side trip receipts comparison */}
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-3">
                Receipt-to-Receipt Forensic Proof
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Benchmark Trip */}
                <div className="border-2 border-emerald-300 bg-emerald-50/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      BENCHMARK TRIP
                    </span>
                    <span className="text-[11px] font-mono text-emerald-900">{tripA?.id || 'TRIP-01'}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900">{tripA?.transporter || 'Murugan'}</h3>
                    <p className="text-[11px] text-slate-600 font-mono">{tripA?.date} · {tripA?.lane}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-200/60 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Weight</span>
                      <strong className="text-slate-900">{tripA?.weightKg} kg</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Total Bill</span>
                      <strong className="text-slate-900">{formatINR(tripA?.bill || 0)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Rate / Tonne</span>
                      <strong className="text-emerald-700 font-bold">{formatINR(Math.round(tripA?.ratePerTonne || 1484))}/t</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Empty Return</span>
                      <span className="font-bold text-slate-700">{tripA?.emptyReturn}</span>
                    </div>
                  </div>
                </div>

                {/* Overcharged Trip */}
                <div className="border-2 border-rose-300 bg-rose-50/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                      OVERCHARGED TRIP
                    </span>
                    <span className="text-[11px] font-mono text-rose-900">{tripB?.id || 'TRIP-02'}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900">{tripB?.transporter || 'Siva Transport'}</h3>
                    <p className="text-[11px] text-slate-600 font-mono">{tripB?.date} · {tripB?.lane}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-rose-200/60 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Weight</span>
                      <strong className="text-slate-900">{tripB?.weightKg} kg</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Total Bill</span>
                      <strong className="text-rose-700 font-bold">{formatINR(tripB?.bill || 0)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Rate / Tonne</span>
                      <strong className="text-rose-700 font-bold">{formatINR(Math.round(tripB?.ratePerTonne || 2033))}/t</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Rate Leak</span>
                      <strong className="text-amber-700 font-bold">+{formatINR(tripB?.rateLeak || 0)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Unarguable Math Summary */}
            <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2">
              <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                The Mathematical Fact
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-mono">
                {selectedObjection.unarguableProof}
              </p>
            </div>
          </div>
        </div>

        {/* Right: The Owner's Negotiation Script & Meeting Playbook */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border-2 border-slate-900 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
                  Verbatim Word-for-Word Script
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Meeting Counter-Script
                </h3>
              </div>
              <button
                onClick={handleCopyScript}
                className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                {copiedScript ? '✓ Copied!' : 'Copy Script'}
              </button>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-slate-900 font-medium leading-relaxed italic relative">
              <MessageSquare className="w-5 h-5 text-amber-500 mb-2 not-italic" />
              {selectedObjection.counterScript}
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-200 text-xs">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                Auditor's Meeting Strategy:
              </h4>
              <ul className="space-y-2 text-slate-600 text-xs">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Do not bring up market rates:</strong> Only show the owner’s own bills from Murugan. Siva cannot argue with a rate already achieved in the plant.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Offer guaranteed volume:</strong> Tell Siva he keeps 25% of the factory loads if he matches Murugan's ₹1,484/t benchmark.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Separate detention strictly:</strong> Pay ₹200/hr for verifiable gate notebook waiting, but never allow it to inflate the freight rate.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
