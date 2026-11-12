import React, { useState } from 'react';
import { ShieldCheck, Truck, Clock, AlertTriangle, FileText, CheckCircle2, XCircle, Search } from 'lucide-react';
import { DispatchRow, RulesConfig } from '../types/otif';
import { calculateRowStatus, formatDateTime } from '../utils/otifCalculator';

interface GateRegisterViewerProps {
  dispatches: DispatchRow[];
  rules: RulesConfig;
}

export const GateRegisterViewer: React.FC<GateRegisterViewerProps> = ({ dispatches, rules }) => {
  const [selectedRowId, setSelectedRowId] = useState<string>(dispatches[0]?.id || 'disp-01');

  const selectedRow = dispatches.find(d => d.id === selectedRowId) || dispatches[0];
  const calculated = selectedRow ? calculateRowStatus(selectedRow, rules) : null;

  return (
    <div className="space-y-6">
      {/* Principle header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              The Security Notebook vs Customer Purchase Order
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              "The security notebook and the PO already have the truth. You turn them into one page. 
              This is the factory gate, not the highway. You time when the vehicle left his gate. 
              You do not time when it reached Hyundai. He controls the gate. He does not control the Red Hills jam after the truck has gone."
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Gate Out-Time (True Clock)</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Written by security guard when wheels cross the factory perimeter. Undeniable physical proof.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="font-semibold text-rose-300 flex items-center gap-1.5 mb-1">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Why Invoices Lie</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Accounts raises the GST invoice at 17:00, but the vehicle often sits overnight and leaves at 10:00 next day.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="font-semibold text-blue-300 flex items-center gap-1.5 mb-1">
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <span>Highway Detention Excluded</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Sriperumbudur / Poonamallee bypass gridlock is freight, not factory gate OTIF. He controls the gate.
            </p>
          </div>
        </div>
      </div>

      {/* Row selector pills */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
        <label className="text-xs font-semibold text-slate-300 block">
          Select Dispatch Load to Inspect Security Book vs PO:
        </label>
        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
          {dispatches.map(d => {
            const isSelected = d.id === selectedRowId;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedRowId(d.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>{d.vehicle}</span>
                <span className="text-[10px] opacity-75">({d.customer.split(' ')[0]})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Side-by-side: Simulated Physical Security Notebook vs PO Details */}
      {selectedRow && calculated && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Physical Security Register Card */}
          <div className="bg-amber-50 border-2 border-amber-300 text-amber-950 rounded-xl p-5 shadow-lg relative font-mono text-xs">
            {/* Security stamp effect */}
            <div className="absolute top-4 right-4 border-2 border-rose-700 text-rose-800 uppercase px-2 py-1 text-[10px] font-black tracking-widest rotate-6 opacity-85 select-none rounded">
              GATE 1 SECURITY • ORAGADAM
            </div>

            <div className="border-b border-amber-300 pb-3 mb-4">
              <div className="text-[11px] tracking-widest font-black uppercase text-amber-900">
                SRI KRISHNA COMPONENTS PVT LTD — PLANT 2 GATE
              </div>
              <div className="text-[10px] text-amber-700">
                DAILY VEHICLE INWARD / OUTWARD LOG BOOK (REGISTER 2026-B)
              </div>
            </div>

            <div className="space-y-3 font-mono">
              <div className="grid grid-cols-2 gap-2 border-b border-amber-200 pb-2">
                <div>
                  <span className="text-[10px] text-amber-800 block">SECURITY LOG DATE:</span>
                  <span className="font-bold text-amber-950 text-sm">
                    {selectedRow.actualOut.split('T')[0]}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 block">VEHICLE REGN NO:</span>
                  <span className="font-extrabold text-amber-950 text-base underline">
                    {selectedRow.vehicle}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-amber-200 pb-2">
                <div>
                  <span className="text-[10px] text-amber-800 block">GATE OUT TIMESTAMP:</span>
                  <span className="font-black text-amber-950 text-base bg-amber-200/80 px-1 py-0.5 rounded">
                    {selectedRow.actualOut.replace('T', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 block">GATE PASS STATUS:</span>
                  <span className="font-bold text-amber-900">
                    GP-2026-{selectedRow.id.replace('disp-', '08')} / Signed
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-amber-200 pb-2">
                <div>
                  <span className="text-[10px] text-amber-800 block">DESTINATION CLIENT:</span>
                  <span className="font-bold text-amber-950">{selectedRow.customer}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 block">SECURITY ON DUTY:</span>
                  <span className="font-bold text-amber-900">K. Murugan (Badge #04)</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[10px] text-amber-800 block">REGISTER DISPATCH REMARKS:</span>
                <p className="text-amber-950 italic bg-amber-100/70 p-2 rounded border border-amber-200 text-[11px]">
                  "{selectedRow.notes || 'Loaded normal condition, tarp tied, seal intact.'}"
                </p>
              </div>

              <div className="pt-2 text-[10px] text-amber-800 flex items-center justify-between">
                <span>Guard Signature: [K. Murugan]</span>
                <span>Driver Thumb/Sign: [Verified]</span>
              </div>
            </div>
          </div>

          {/* Customer Purchase Order Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs uppercase font-bold text-amber-400">Written Promise Document</span>
                <h3 className="text-sm font-bold text-white font-mono">{selectedRow.po}</h3>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold font-mono ${
                calculated.otif ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {calculated.otif ? 'OTIF PASS ✓' : 'OTIF FAIL ✗'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px] block">CUSTOMER:</span>
                  <span className="text-white font-medium">{selectedRow.customer}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">PART PROMISED:</span>
                  <span className="text-amber-300 font-semibold">{selectedRow.part}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block">PROMISED DATE/TIME:</span>
                  <span className="text-white font-bold">{formatDateTime(selectedRow.promisedDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">ACTUAL GATE OUT:</span>
                  <span className="text-white font-bold">{formatDateTime(selectedRow.actualOut)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block">ORDERED QUANTITY:</span>
                  <span className="text-white font-bold">{selectedRow.orderedQty} units</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">SHIPPED QUANTITY:</span>
                  <span className={`font-bold ${
                    selectedRow.shippedQty < selectedRow.orderedQty ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {selectedRow.shippedQty} units ({Math.round((selectedRow.shippedQty / selectedRow.orderedQty) * 100)}%)
                  </span>
                </div>
              </div>

              {/* Engine Diagnosis for this row */}
              <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                calculated.otif 
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' 
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
              }`}>
                <div className="font-bold flex items-center gap-1.5">
                  {calculated.otif ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  <span>Row Verdict: {calculated.otif ? 'Early and Complete (Pass)' : `Failed (${calculated.failType})`}</span>
                </div>
                {!calculated.otif && (
                  <p className="text-[11px] text-slate-300">
                    Primary cause logged: <strong className="text-amber-300">{selectedRow.delayReason}</strong>. 
                    {calculated.failType === 'Short' && ' Truck left on time, but quantity was partial.'}
                    {calculated.failType === 'Late' && ' Full quantity was ready, but truck left after promised deadline.'}
                    {calculated.failType === 'Late and short' && ' Left next day AND quantity was short. Worst category.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
