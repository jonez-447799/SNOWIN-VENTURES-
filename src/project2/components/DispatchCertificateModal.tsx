import React from 'react';
import { ShieldCheck, Award, Printer, CheckCircle2, X, Download, FileText, Check, AlertTriangle } from 'lucide-react';
import { DispatchRow, RulesConfig } from '../types/otif';
import { calculateRowStatus } from '../utils/otifCalculator';

interface DispatchCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatch: DispatchRow | null;
  rules: RulesConfig;
}

export const DispatchCertificateModal: React.FC<DispatchCertificateModalProps> = ({
  isOpen,
  onClose,
  dispatch,
  rules,
}) => {
  if (!isOpen || !dispatch) return null;

  const calculated = calculateRowStatus(dispatch, rules);
  const company = rules.factoryProfile?.companyName || 'Apex Precision Automotive Ltd';
  const plant = rules.factoryProfile?.plantName || 'Plant 1 - Press & Machining Division';
  const location = rules.factoryProfile?.clusterLocation || 'Oragadam Industrial Corridor, Sriperumbudur';

  const handlePrint = () => {
    window.print();
  };

  const certificateId = `CERT-SLA-${dispatch.id.toUpperCase()}-${dispatch.po.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Official OEM Dispatch SLA Certificate</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  IATF 16949 Auditable
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official dispute defense proof for OEM vendor rating audits and procurement teams.
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

        {/* Certificate Printable Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-950">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 space-y-5 text-slate-100 shadow-xl relative overflow-hidden">
            {/* Watermark / Seal background */}
            <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none">
              <Award className="w-64 h-64 text-white" />
            </div>

            {/* Top Company Info */}
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black tracking-wide text-white uppercase">{company}</h3>
                <p className="text-xs text-slate-400">{plant} • {location}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">IATF 16949:2016 Certified Facility | Gate Quality Assurance</p>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 block">Certificate ID:</span>
                <span className="text-xs font-bold text-amber-400">{certificateId}</span>
                <span className="text-[10px] text-slate-500 block">Date: {dispatch.actualOut.slice(0, 10)}</span>
              </div>
            </div>

            {/* Certificate Title */}
            <div className="text-center py-1">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 block">
                Certificate of Dispatch Verification
              </span>
              <h4 className="text-lg font-black text-white tracking-tight mt-0.5">
                ON-TIME IN-FULL (OTIF) COMPLIANCE RECORD
              </h4>
            </div>

            {/* Dispatch Data Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">Customer OEM:</span>
                <span className="font-bold text-white text-sm">{dispatch.customer}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Purchase Order (PO):</span>
                <span className="font-bold text-amber-400 text-sm">{dispatch.po}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Vehicle Registration:</span>
                <span className="font-bold text-white text-sm">{dispatch.vehicle}</span>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-500 block text-[10px]">Part Description:</span>
                <span className="font-bold text-slate-200">{dispatch.part}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Ordered / Shipped:</span>
                <span className="font-bold text-emerald-400">{dispatch.shippedQty} / {dispatch.orderedQty} pcs</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Fill Rate:</span>
                <span className="font-bold text-white">{Math.round((dispatch.shippedQty / dispatch.orderedQty) * 100)}%</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">Promised Cutoff:</span>
                <span className="text-slate-300 font-semibold">{dispatch.promisedDate.replace('T', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Actual Gate Exit:</span>
                <span className="text-emerald-400 font-bold">{dispatch.actualOut.replace('T', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Audit Status:</span>
                {calculated.otif ? (
                  <span className="text-emerald-400 font-black">✓ PASS (OTIF Validated)</span>
                ) : (
                  <span className="text-rose-400 font-black">FAIL ({calculated.failType})</span>
                )}
              </div>
            </div>

            {/* Official Legal Affirmation */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-300 leading-relaxed">
              <span className="font-bold text-white block text-[11px] uppercase tracking-wider">
                Official Gate Master Certification:
              </span>
              <p className="text-[11px]">
                This document certifies that vehicle <strong className="text-white font-mono">{dispatch.vehicle}</strong> carrying consignment <strong className="text-white font-mono">{dispatch.po}</strong> was inspected and officially stamped out of the factory security gate at <strong className="text-white font-mono">{dispatch.actualOut.replace('T', ' ')}</strong>. Physical vehicle seal and tax invoices were audited prior to boom barrier clearance.
              </p>
            </div>

            {/* Signatures Row */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <div>
                <div className="text-[10px] text-slate-500">Security In-Charge:</div>
                <div className="font-bold text-slate-200 mt-1">G. Selvam (Gate Cabin 1)</div>
                <div className="text-[9px] text-slate-500">Digital Timestamp Verified</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-2 border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="text-[9px] font-bold text-emerald-400 mt-1">VERIFIED SLA</div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-500">Head of Supply Chain:</div>
                <div className="font-bold text-slate-200 mt-1">K. Ramanathan, VP Operations</div>
                <div className="text-[9px] text-slate-500">Apex Precision Automotive</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Attach this certificate to defend against OEM debit notes &amp; line stoppage claims.
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save Defense PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
