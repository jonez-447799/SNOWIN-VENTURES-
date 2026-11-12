import React from 'react';
import { Printer, Download, ArrowLeft, CheckCircle2, AlertOctagon, PackagePlus, EyeOff } from 'lucide-react';
import { AuditItem, AuditRules, AuditSummary } from '../types/audit';
import { formatINR } from '../utils/auditCalculations';
import { getPartImageUrl } from '../utils/partImages';

interface PrintReportProps {
  items: AuditItem[];
  rules: AuditRules;
  summary: AuditSummary;
  onBack: () => void;
}

export const PrintReport: React.FC<PrintReportProps> = ({
  items,
  rules,
  summary,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const executiveSentence = `Counted ${summary.skusCounted} SKUs, shelf short by ${formatINR(
    summary.shelfShortRupees
  )}, long by ${formatINR(summary.foundStockRupees)}, ${summary.fastMoversHidden} fast movers hidden.`;

  // Sorted discrepancies
  const discrepancies = items
    .filter((it) => (it.gapQty ?? 0) !== 0)
    .sort((a, b) => Math.abs(b.gapRupees ?? 0) - Math.abs(a.gapRupees ?? 0));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      {/* Top Action Bar (hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Audit Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Save to PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (white bg with dark text on paper) */}
      <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-xl shadow-xl p-8 border border-slate-300 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs uppercase tracking-widest font-black text-emerald-700">
                Official Bin Audit Certificate • Project 4
              </span>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                {rules.storeName}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Pre-Shutter Morning Spares Cycle Count &amp; Slotting Audit
              </p>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold text-slate-900">Audit Date: {rules.countDate}</div>
              <div className="text-slate-600">Auditor: {rules.auditorName}</div>
              <div className="text-slate-500 text-[10px] mt-1 font-mono">
                Threshold: ≥{rules.fastMoverCutoff} issues/mo | Tol: {rules.shrinkTolerancePercent}%
              </div>
            </div>
          </div>
        </div>

        {/* Executive Verdict Banner */}
        <div className="bg-slate-100 border-l-4 border-amber-600 p-4 rounded-r-lg mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Executive Summary for Store Owner
          </div>
          <div className="text-lg font-black text-slate-900 mt-1 leading-snug">
            &ldquo;{executiveSentence}&rdquo;
          </div>
          <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
            The screen shows stock the shelf does not have. Missing items create lost sales at the counter while the store assistant climbs to look for parts. Below is the verified rupee shrinkage and the exact list of stock to move to the front counter before opening.
          </p>
        </div>

        {/* 4 Key Numbers */}
        <div className="grid grid-cols-4 gap-3 mb-6 text-center">
          <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-500">SKUs Audited</div>
            <div className="text-xl font-black text-slate-900 font-mono">{summary.skusCounted}</div>
            <div className="text-[10px] text-slate-600">{summary.linesMatched} matched screen</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded p-2.5">
            <div className="text-[10px] uppercase font-bold text-rose-700">Shelf Short</div>
            <div className="text-xl font-black text-rose-700 font-mono">
              {formatINR(summary.shelfShortRupees)}
            </div>
            <div className="text-[10px] text-rose-800 font-medium">5 shrinkage lines</div>
          </div>
          <div className="bg-cyan-50 border border-cyan-200 rounded p-2.5">
            <div className="text-[10px] uppercase font-bold text-cyan-800">Found Stock</div>
            <div className="text-xl font-black text-cyan-800 font-mono">
              +{formatINR(summary.foundStockRupees)}
            </div>
            <div className="text-[10px] text-cyan-900 font-medium">Unrecorded inward</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded p-2.5">
            <div className="text-[10px] uppercase font-bold text-purple-700">Hidden Fast Movers</div>
            <div className="text-xl font-black text-purple-800 font-mono">
              {summary.fastMoversHidden}
            </div>
            <div className="text-[10px] text-purple-900 font-medium">Back rack &amp; mezzanine</div>
          </div>
        </div>

        {/* Priority Action Board: Fix This Week, In Rupee Order */}
        <div className="mb-6">
          <h2 className="text-xs uppercase tracking-wider font-black text-slate-900 mb-2 border-b border-slate-300 pb-1">
            Fix This Week, in Rupee Order
          </h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-[10px] uppercase text-slate-600 font-bold">
                <th className="py-1.5 px-2">#</th>
                <th className="py-1.5 px-2">Code</th>
                <th className="py-1.5 px-2">Part Name</th>
                <th className="py-1.5 px-2">Spot</th>
                <th className="py-1.5 px-2 text-right">System</th>
                <th className="py-1.5 px-2 text-right">Physical</th>
                <th className="py-1.5 px-2 text-right">Rupee Impact</th>
                <th className="py-1.5 px-2">Operational Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {discrepancies.map((item, idx) => {
                const isShort = (item.gapQty ?? 0) < 0;
                return (
                  <tr key={item.id} className={isShort ? 'bg-rose-50/40' : 'bg-cyan-50/40'}>
                    <td className="py-1.5 px-2 text-slate-500 font-sans font-bold">{idx + 1}</td>
                    <td className="py-1.5 px-2 font-bold text-slate-900">{item.code}</td>
                    <td className="py-1.5 px-2 font-sans font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <img
                          src={getPartImageUrl(item.code, item.imageUrl)}
                          alt={item.part}
                          referrerPolicy="no-referrer"
                          className="w-5 h-5 rounded object-cover border border-slate-300 shrink-0"
                        />
                        <span>{item.part}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 font-sans">{item.spot}</td>
                    <td className="py-1.5 px-2 text-right text-slate-700">{item.systemQty}</td>
                    <td className="py-1.5 px-2 text-right font-black text-slate-950">{item.physicalQty}</td>
                    <td className={`py-1.5 px-2 text-right font-black ${isShort ? 'text-rose-700' : 'text-cyan-800'}`}>
                      {isShort ? `-${formatINR(Math.abs(item.gapRupees ?? 0))}` : `+${formatINR(item.gapRupees ?? 0)}`}
                    </td>
                    <td className="py-1.5 px-2 font-sans text-[10.5px] text-slate-800 leading-tight">
                      {item.action}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Full 15-SKU Table */}
        <div className="mb-6">
          <h2 className="text-xs uppercase tracking-wider font-black text-slate-900 mb-2 border-b border-slate-300 pb-1">
            Complete Pre-Shutter Count Sheet (15 Lines)
          </h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-[10px] uppercase text-slate-600 font-bold">
                <th className="py-1 px-1.5">Code</th>
                <th className="py-1 px-1.5">Part Name</th>
                <th className="py-1 px-1.5">Spot</th>
                <th className="py-1 px-1.5 text-right">System</th>
                <th className="py-1 px-1.5 text-right">Hand Count</th>
                <th className="py-1 px-1.5 text-right">Cost (₹)</th>
                <th className="py-1 px-1.5 text-right">Issues/Mo</th>
                <th className="py-1 px-1.5 text-right">Gap Qty</th>
                <th className="py-1 px-1.5 text-right">Gap ₹</th>
                <th className="py-1 px-1.5 text-center">Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[10.5px]">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-1 px-1.5 font-bold">{item.code}</td>
                  <td className="py-1 px-1.5 font-sans font-medium">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getPartImageUrl(item.code, item.imageUrl)}
                        alt={item.part}
                        referrerPolicy="no-referrer"
                        className="w-4 h-4 rounded object-cover border border-slate-300 shrink-0"
                      />
                      <span>{item.part}</span>
                    </div>
                  </td>
                  <td className="py-1 px-1.5 font-sans">{item.spot}</td>
                  <td className="py-1 px-1.5 text-right">{item.systemQty}</td>
                  <td className="py-1 px-1.5 text-right font-black">{item.physicalQty}</td>
                  <td className="py-1 px-1.5 text-right">{item.cost}</td>
                  <td className="py-1 px-1.5 text-right">{item.issuesPerMonth}</td>
                  <td className="py-1 px-1.5 text-right font-bold">
                    {(item.gapQty ?? 0) === 0 ? '0' : (item.gapQty ?? 0) > 0 ? `+${item.gapQty}` : item.gapQty}
                  </td>
                  <td className={`py-1 px-1.5 text-right font-black ${
                    (item.gapRupees ?? 0) < 0 ? 'text-rose-700' : (item.gapRupees ?? 0) > 0 ? 'text-cyan-800' : 'text-slate-500'
                  }`}>
                    {(item.gapRupees ?? 0) === 0 ? '₹0' : formatINR(item.gapRupees ?? 0)}
                  </td>
                  <td className="py-1 px-1.5 text-center font-sans font-semibold text-[10px]">
                    {item.speed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sign-off signatures */}
        <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-xs text-slate-700">
          <div>
            <div className="font-bold text-slate-900">Physical Counted By:</div>
            <div className="mt-8 border-b border-slate-400 w-3/4"></div>
            <div className="text-[10px] text-slate-500 mt-1">Lead Store Assistant (Morning)</div>
          </div>
          <div>
            <div className="font-bold text-slate-900">Auditor Verified:</div>
            <div className="mt-8 border-b border-slate-400 w-3/4"></div>
            <div className="text-[10px] text-slate-500 mt-1">{rules.auditorName}</div>
          </div>
          <div>
            <div className="font-bold text-slate-900">Store Owner Acceptance:</div>
            <div className="mt-8 border-b border-slate-400 w-3/4"></div>
            <div className="text-[10px] text-slate-500 mt-1">Shrinkage &amp; Re-slotting Approved</div>
          </div>
        </div>
      </div>
    </div>
  );
};
