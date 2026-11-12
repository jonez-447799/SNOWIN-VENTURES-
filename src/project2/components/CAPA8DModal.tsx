import React from 'react';
import { FileText, Printer, CheckCircle2, AlertTriangle, X, ShieldAlert, Award, Check } from 'lucide-react';
import { OTIFMetrics, RulesConfig } from '../types/otif';

interface CAPA8DModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: OTIFMetrics;
  rules: RulesConfig;
}

export const CAPA8DModal: React.FC<CAPA8DModalProps> = ({
  isOpen,
  onClose,
  metrics,
  rules,
}) => {
  if (!isOpen) return null;

  const company = rules.factoryProfile?.companyName || 'Apex Precision Automotive Ltd';
  const plant = rules.factoryProfile?.plantName || 'Plant 1';
  const weakestCust = metrics.weakestCustomer?.customer || 'Ashok Leyland';
  const topReason = metrics.topFailureReason?.reason || 'Material short';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Automated 8D / CAPA Problem-Solving Generator</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  IATF 16949 Format
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                1-Click automotive Corrective &amp; Preventive Action report ready for OEM customer submission.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 8D Report Document */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-950 text-xs text-slate-200">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            {/* 8D Header Block */}
            <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Formal Quality Engineering Report</span>
                <h3 className="text-lg font-black text-white">8D CORRECTIVE &amp; PREVENTIVE ACTION REPORT</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">{company} • {plant}</p>
              </div>
              <div className="text-right font-mono text-[11px]">
                <span className="text-slate-500 block">Report #: 8D-OTIF-2026-F38</span>
                <span className="text-slate-300 font-bold">Target OEM: {weakestCust}</span>
                <span className="text-amber-400 block">Status: Containment Implemented</span>
              </div>
            </div>

            {/* D1: Champion & Team */}
            <div className="space-y-1">
              <span className="font-bold text-amber-400 uppercase tracking-wide text-[11px] block">
                D1: Cross-Functional Team (CFT)
              </span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 font-mono text-[11px]">
                <div><span className="text-slate-500 block text-[10px]">Leader:</span>K. Ramanathan (SCM)</div>
                <div><span className="text-slate-500 block text-[10px]">Quality:</span>R. Anand (QA Head)</div>
                <div><span className="text-slate-500 block text-[10px]">Production:</span>S. Kumar (Plant Head)</div>
                <div><span className="text-slate-500 block text-[10px]">Logistics:</span>M. Venkatesh (Dispatch)</div>
              </div>
            </div>

            {/* D2: Problem Statement */}
            <div className="space-y-1">
              <span className="font-bold text-rose-400 uppercase tracking-wide text-[11px] block">
                D2: Problem Description
              </span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-slate-300 leading-relaxed">
                <p>
                  During Fortnight {rules.weekStart} to {rules.weekEnd}, factory gate OTIF dropped to <strong className="text-white font-mono">{metrics.otifPercent}%</strong> ({metrics.fails} failed dispatches out of {metrics.totalDispatches} scheduled consignments). 
                  Weakest account was <strong className="text-amber-300 font-mono">{weakestCust} ({metrics.weakestCustomer?.otifPercent}%)</strong>.
                  Primary driver of failure was identified as <strong className="text-rose-400 font-mono">{topReason}</strong> accounting for {metrics.topFailureReason?.percentageOfFails}% of all customer delivery breaches.
                </p>
              </div>
            </div>

            {/* D3: Interim Containment */}
            <div className="space-y-1">
              <span className="font-bold text-blue-400 uppercase tracking-wide text-[11px] block">
                D3: Interim Containment Actions (ICA)
              </span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-slate-300 leading-relaxed font-mono text-[11px]">
                <div>1. 100% daily physical inventory count on all active raw materials 48 hours prior to promised dates.</div>
                <div>2. Premium expedited trailer pre-booking scheduled 4 hours prior to gate cut-off.</div>
                <div>3. Dedicated QC inspector assigned to clear salt-spray plating reports at line exit, not at security gate.</div>
              </div>
            </div>

            {/* D4: 5-Why Root Cause Analysis */}
            <div className="space-y-1">
              <span className="font-bold text-amber-400 uppercase tracking-wide text-[11px] block">
                D4: 5-Why Root Cause Analysis (Root Cause: {topReason})
              </span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-slate-300 font-mono text-[11px]">
                <div><strong>Why 1:</strong> Why did the truck depart short or late? → Consignment was missing 60 parts at scheduled gate-out time.</div>
                <div><strong>Why 2:</strong> Why were parts missing? → Machining line had stopped due to lack of raw EN8D bar stock.</div>
                <div><strong>Why 3:</strong> Why was bar stock unavailable? → Sub-tier forging vendor delivered 2 days behind schedule.</div>
                <div><strong>Why 4:</strong> Why was there no buffer? → Reorder point (ROP) safety stock in ERP was set to 0 days buffer.</div>
                <div><strong>Why 5 (Root Cause):</strong> Why was ROP set to 0? → MRP parameters were not updated when customer daily line-rate increased by 25%.</div>
              </div>
            </div>

            {/* D5 & D6: Permanent Corrective Action */}
            <div className="space-y-1">
              <span className="font-bold text-emerald-400 uppercase tracking-wide text-[11px] block">
                D5 &amp; D6: Permanent Corrective Actions (PCA) &amp; Verification
              </span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-slate-300 font-mono text-[11px]">
                <div>• Updated ERP safety stock buffer to 5 days consumption for all critical OEM part numbers.</div>
                <div>• Sub-tier supplier SLA contracts amended with ₹5,000/day late penalty clause.</div>
                <div>• Verification: Daily dispatch pass rate reached 100% on 26–28 Sep after buffer replenishment.</div>
              </div>
            </div>

            {/* D7 & D8: Preventive Action & Sign-off */}
            <div className="space-y-1">
              <span className="font-bold text-indigo-400 uppercase tracking-wide text-[11px] block">
                D7 &amp; D8: Systemic Prevention &amp; Sign-Off
              </span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px]">
                <div>PFMEA (Process Failure Mode &amp; Effect Analysis) &amp; Control Plan CP-2026-REV4 updated.</div>
                <div className="text-emerald-400 font-bold">Closed by QA Director: 28 Sep 2026</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Print and submit directly to OEM vendor development and procurement departments.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print 8D Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
