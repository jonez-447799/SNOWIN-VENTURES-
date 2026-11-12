/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  Building2,
  Calendar,
  Truck,
  IndianRupee,
  ShieldAlert
} from 'lucide-react';
import { TransporterSummary, CalculatedTrip, RulesConfig } from '../types/freight';
import { formatINR } from '../utils/auditCalculations';

interface CarrierDebitNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  transporter: TransporterSummary;
  trips: CalculatedTrip[];
  rules: RulesConfig;
  plantName?: string;
  plantDivision?: string;
}

export const CarrierDebitNoteModal: React.FC<CarrierDebitNoteModalProps> = ({
  isOpen,
  onClose,
  transporter,
  trips,
  rules,
  plantName = 'Ambattur Baseline Unit',
  plantDivision = 'Unit 1 - Industrial Fabrication & Machinery',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const carrierTrips = trips.filter(
    (t) => t.transporter.toLowerCase().trim() === transporter.transporter.toLowerCase().trim()
  );

  const debitNoteNumber = `DN-${transporter.transporter.slice(0, 4).toUpperCase()}-2026-09`;
  const issueDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const totalRateDeduction = transporter.totalRateLeak;
  const totalDetentionDeduction = transporter.totalDetention;
  const totalDeductionRupees = transporter.totalWaste;

  const handleCopyWhatsApp = () => {
    const text = `🚨 *OFFICIAL CARRIER DEBIT NOTE: ${debitNoteNumber}*
*To:* ${transporter.transporter} (Attn: Transport Proprietor / Accounts)
*From:* ${plantName} — ${plantDivision}
*Audit Window:* ${rules.startDate} to ${rules.endDate}

*Summary of Deductions:*
• Contracted Benchmark Rate Variance: ${formatINR(totalRateDeduction)} (across ${transporter.tripsCount} trips)
• Unapproved Gate Detention: ${formatINR(totalDetentionDeduction)} (${(transporter as any).totalDetentionHours ?? transporter.totalDetention ?? 0} hrs excess wait)
━━━━━━━━━━━━━━━━━━━━
*TOTAL RECOVERY DEDUCTION: ${formatINR(totalDeductionRupees)}*
━━━━━━━━━━━━━━━━━━━━

*Itemized Triplist Under Dispute:*
${carrierTrips
  .map(
    (t, idx) =>
      `${idx + 1}. Date: ${t.date} | Lane: ${t.lane} | Billed: ${formatINR(t.bill)} | Benchmark: ${formatINR(
        t.bestRate * (t.weightKg / 1000)
      )} | Leak: ${formatINR(t.totalLeak)}`
  )
  .join('\n')}

*Action Required:*
This amount (${formatINR(totalDeductionRupees)}) is withheld from your upcoming freight payout. For reconciliation or rate-matching, contact Factory Logistics Head before Monday 11:00 AM.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-300 relative space-y-5 my-8">
        {/* Header Controls (No Print) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 no-print">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-rose-100 text-rose-800">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Carrier Overbilling Debit Note</h2>
              <p className="text-xs text-slate-500 font-mono">Formal Logistics Disallowance Claim</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyWhatsApp}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer shadow-sm transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Claim Copied!' : 'Copy WhatsApp Claim'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Debit Note Document */}
        <div className="p-6 rounded-xl border border-slate-300 bg-white space-y-5 font-sans print:border-none print:p-0">
          {/* Company & Note Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <div className="text-xs font-mono uppercase font-black tracking-wider text-rose-700">
                Logistics Disallowance Certificate
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{plantName}</h1>
              <p className="text-xs text-slate-600 font-mono">{plantDivision}</p>
              <p className="text-xs text-slate-500">Factory Accounts &amp; Commercial Logistics Section</p>
            </div>
            <div className="text-right font-mono text-xs space-y-1">
              <div className="text-sm font-black text-rose-700">{debitNoteNumber}</div>
              <div className="text-slate-600">Date: {issueDate}</div>
              <div className="text-slate-600">Audit: {rules.startDate} to {rules.endDate}</div>
            </div>
          </div>

          {/* Transporter Details */}
          <div className="grid grid-cols-2 gap-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">Billed Carrier / Transporter</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{transporter.transporter}</div>
              <div className="text-slate-600 font-mono text-[11px]">Vendor Code: VND-TRN-{transporter.transporter.slice(0, 4).toUpperCase()}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">Total Withheld Deduction</div>
              <div className="text-xl font-black font-mono text-rose-700 mt-0.5">
                {formatINR(totalDeductionRupees)}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Held from Next Payout Voucher</div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[10px] uppercase">
                <tr>
                  <th className="py-2 px-2.5">Date</th>
                  <th className="py-2 px-2.5">Lane</th>
                  <th className="py-2 px-2.5 text-right">Weight (kg)</th>
                  <th className="py-2 px-2.5 text-right">Billed (₹)</th>
                  <th className="py-2 px-2.5 text-right">Benchmark (₹)</th>
                  <th className="py-2 px-2.5 text-right">Rate Leak</th>
                  <th className="py-2 px-2.5 text-right">Detention</th>
                  <th className="py-2 px-2.5 text-right text-rose-700">Net Deduction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {carrierTrips.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-2.5 text-slate-800">{t.date}</td>
                    <td className="py-2 px-2.5 font-sans font-medium text-slate-900">{t.lane}</td>
                    <td className="py-2 px-2.5 text-right">{t.weightKg.toLocaleString()}</td>
                    <td className="py-2 px-2.5 text-right">{formatINR(t.bill)}</td>
                    <td className="py-2 px-2.5 text-right text-emerald-700 font-semibold">
                      {formatINR(Math.round(t.bestRate * (t.weightKg / 1000)))}
                    </td>
                    <td className="py-2 px-2.5 text-right text-amber-700 font-bold">{formatINR(t.rateLeak)}</td>
                    <td className="py-2 px-2.5 text-right text-slate-700">{formatINR(t.detention)}</td>
                    <td className="py-2 px-2.5 text-right font-black text-rose-700">{formatINR(t.totalLeak)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <tr>
                  <td colSpan={5} className="py-2.5 px-2.5 font-sans text-slate-900">
                    Total Disallowed Variance Across {carrierTrips.length} Audited Trips:
                  </td>
                  <td className="py-2.5 px-2.5 text-right text-amber-800">{formatINR(totalRateDeduction)}</td>
                  <td className="py-2.5 px-2.5 text-right text-slate-800">{formatINR(totalDetentionDeduction)}</td>
                  <td className="py-2.5 px-2.5 text-right text-rose-800 font-black text-sm">
                    {formatINR(totalDeductionRupees)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legal / Operational Terms */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
            <strong>Commercial Audit Findings:</strong> As per contract terms, billing rates must match clean market benchmarks established on identical lanes. Billed gate detention exceeding 1.0 hour requires security timestamp verification. The disallowance of <strong>{formatINR(totalDeductionRupees)}</strong> will be credited back via accounts contra entry.
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs text-slate-600 border-t border-slate-200 font-mono">
            <div>
              <div className="h-10 border-b border-dashed border-slate-400" />
              <div className="mt-1 font-bold text-slate-800">Logistics Audit Lead</div>
              <div className="text-[10px] text-slate-500">Prepared &amp; Verified</div>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-400" />
              <div className="mt-1 font-bold text-slate-800">Plant Finance Head</div>
              <div className="text-[10px] text-slate-500">Deduction Approved</div>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-400" />
              <div className="mt-1 font-bold text-slate-800">Carrier Representative</div>
              <div className="text-[10px] text-slate-500">Acknowledgment Copy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
