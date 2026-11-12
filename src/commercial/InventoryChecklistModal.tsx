/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  Square,
  FileCheck2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Building2,
  HelpCircle,
} from 'lucide-react';

interface InventoryChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestAudit: () => void;
}

interface ChecklistItem {
  id: number;
  title: string;
  symptom: string;
  howToInvestigate: string;
  financialRisk: string;
  category: string;
}

const SEVEN_CHECKS: ChecklistItem[] = [
  {
    id: 1,
    title: 'The Dust & Seal Physical Inspection',
    symptom: 'Racks or crates with unbroken original vendor tags or heavy dust accumulation.',
    howToInvestigate: 'Walk Bay 3 and Bay 4. Look for raw material pallets that have not moved in 90+ days.',
    financialRisk: 'Tied-up working capital in parts no longer called on current bill of materials.',
    category: 'Physical Stores',
  },
  {
    id: 2,
    title: 'Engineering Change Notice (ECN) Dead Stock',
    symptom: 'Part drawing was updated to Rev-B or Rev-C, but Rev-A inventory remains in active stock.',
    howToInvestigate: 'Cross-reference QA drawing revision history with store stock codes for all forged/machined parts.',
    financialRisk: 'Immediate scrap write-down risk if mistakenly assembled onto client products.',
    category: 'Design & Quality',
  },
  {
    id: 3,
    title: 'Minimum Order Quantity (MOQ) Traps',
    symptom: 'Bought 5,000 units to get vendor volume discount when annual consumption is only 350 units.',
    howToInvestigate: 'Filter your stock dump by (QtyOnHand / AverageMonthlyIssue) > 24 months.',
    financialRisk: 'Over 14 years of carrying cost paying for a theoretical 8% vendor price cut.',
    category: 'Procurement',
  },
  {
    id: 4,
    title: 'Ghost Stock vs Physical Line Stoppage',
    symptom: 'ERP records 250 available units; shop floor finds the bin empty during 9 AM shift start.',
    howToInvestigate: 'Audit the top 10 highest-value fast-moving bins right before shift transition.',
    financialRisk: 'Unplanned CNC machine line stop costing ₹8,500/hour in idle labor and overhead.',
    category: 'Production Reliability',
  },
  {
    id: 5,
    title: 'Vendor Defect Consignment Returns',
    symptom: 'Rejected vendor lots stored in quarantine area waiting for inspection for >60 days.',
    howToInvestigate: 'Check Goods Receipt Note (GRN) rejection logs against accounting debit notes.',
    financialRisk: 'Vendor closes ledger or rejects contra debit note due to delayed return window.',
    category: 'Accounts & Commercial',
  },
  {
    id: 6,
    title: 'Duplicate Part Numbers Under Varied Codes',
    symptom: 'Same generic bearing or fastener stored under two different internal SKU codes.',
    howToInvestigate: 'Run text similarity search across SKU descriptions for standard hardware.',
    financialRisk: 'Purchase order placed for stock that already exists under a parallel bin code.',
    category: 'Master Data',
  },
  {
    id: 7,
    title: 'Open POs Arriving for Inactive SKUs',
    symptom: 'Transporter delivers fresh shipment of items that haven\'t moved from stores in 180 days.',
    howToInvestigate: 'Match open PO list against 180-day non-moving inventory register.',
    financialRisk: 'Adding fresh cash outflow to an already stagnant inventory cluster.',
    category: 'Supply Chain Governance',
  },
];

export const InventoryChecklistModal: React.FC<InventoryChecklistModalProps> = ({
  isOpen,
  onClose,
  onRequestAudit,
}) => {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleCheck = (id: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const flaggedCount = Object.values(checkedItems).filter(Boolean).length;

  const handleCopy = () => {
    const text = SEVEN_CHECKS.map(
      (c) =>
        `[${checkedItems[c.id] ? 'X' : ' '}] Check ${c.id}: ${c.title}\nSymptom: ${c.symptom}\nInvestigation: ${c.howToInvestigate}\nRisk: ${c.financialRisk}\n`
    ).join('\n---\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checklist-title"
    >
      <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-3xl w-full p-4 sm:p-6 md:p-8 shadow-2xl border border-slate-750 relative space-y-6 my-6 max-h-[92vh] overflow-y-auto font-sans">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Free Practical Tool · Zero Login Required
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs font-mono text-slate-400">7 Self-Audit Checks</span>
            </div>
            <h2 id="checklist-title" className="text-xl sm:text-2xl font-black text-white">
              7 Checks for Identifying High-Risk Factory Inventory
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Take this checklist to your stores and dispatch bay. Tap any check that currently occurs in your plant.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Scorecard Banner */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Items Flagged in Your Plant:</span>
            <span
              className={`font-black text-sm px-2 py-0.5 rounded ${
                flaggedCount >= 3
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : flaggedCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {flaggedCount} of 7 Flagged
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Checklist'}</span>
            </button>
          </div>
        </div>

        {/* Checklist Rows */}
        <div className="space-y-3">
          {SEVEN_CHECKS.map((item) => {
            const isChecked = Boolean(checkedItems[item.id]);
            return (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-4 rounded-xl border transition cursor-pointer space-y-2 select-none ${
                  isChecked
                    ? 'bg-rose-950/20 border-rose-500/50 shadow-md'
                    : 'bg-slate-950/70 hover:bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-slate-400">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-rose-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-sm font-bold ${isChecked ? 'text-white' : 'text-slate-200'}`}>
                        {item.id}. {item.title}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-slate-400 font-mono text-[11px]">Symptom: </strong>
                      {item.symptom}
                    </p>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      <strong className="text-slate-400 font-mono text-[11px]">Where to look: </strong>
                      {item.howToInvestigate}
                    </p>

                    <div className="text-[11px] font-mono text-rose-300 pt-0.5">
                      ⚠️ Risk: {item.financialRisk}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer CTAs */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono text-slate-400 text-center sm:text-left">
            <span>
              {flaggedCount >= 2
                ? 'Your plant shows symptoms of trapped working capital. A forensic file audit can isolate exact SKUs.'
                : 'Run this during your next weekly floor inspection to safeguard working capital.'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer transition"
            >
              Close Checklist
            </button>
            <button
              onClick={() => {
                onClose();
                onRequestAudit();
              }}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md touch-manipulation active:scale-95"
            >
              <span>Request Full File Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
