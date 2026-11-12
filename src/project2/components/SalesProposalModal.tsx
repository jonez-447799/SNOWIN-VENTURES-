import React, { useState } from 'react';
import { FileCheck, Printer, Check, X, ShieldCheck, CreditCard, Building2, Sparkles, Award } from 'lucide-react';
import { RulesConfig } from '../types/otif';

interface SalesProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: RulesConfig;
}

export const SalesProposalModal: React.FC<SalesProposalModalProps> = ({
  isOpen,
  onClose,
  rules,
}) => {
  if (!isOpen) return null;

  const profile = rules.factoryProfile;
  const company = profile?.companyName || 'Apex Precision Automotive Ltd';
  const plant = profile?.plantName || 'Plant 1';
  const location = profile?.clusterLocation || 'Sriperumbudur - Oragadam Industrial Corridor';
  const tier = profile?.planTier || 'Pro Industrial';
  const currency = profile?.currencySymbol || '₹';

  const defaultStarter = profile?.monthlyPriceStarter ?? 2999;
  const defaultPro = profile?.monthlyPricePro ?? 4999;
  const defaultEnterprise = profile?.monthlyPriceEnterprise ?? 9999;

  const priceMap: Record<string, number> = {
    'Starter': defaultStarter,
    'Pro Industrial': defaultPro,
    'Enterprise': defaultEnterprise,
  };

  const [customPriceOverride, setCustomPriceOverride] = useState<number | null>(null);
  const monthlyPrice = customPriceOverride !== null ? customPriceOverride : (priceMap[tier] || defaultPro);
  const annualPrice = Math.round(monthlyPrice * 12 * 0.80); // 20% discount for annual

  const firmName = profile?.founderFirmName || 'Industrial OTIF Systems & Audit';
  const founderTitle = profile?.founderTitle || 'Plant Dispatch Compliance Auditor';
  const founderName = profile?.founderName || 'Operations Audit Lead';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Enterprise SaaS Client Proposal &amp; Contract Quote</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready to Sign
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official commercial proposal customized for {company} ready to present to CFO/Plant Director.
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

        {/* Printable Proposal Document */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-950 text-xs text-slate-200">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            {/* Proposal Title Header */}
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400">
                  Commercial SaaS Agreement &amp; SLA Proposal
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">DISPATCH OTIF ENTERPRISE SUITE</h3>
                <p className="text-slate-400 text-xs mt-1">Prepared Exclusively For: <strong className="text-white">{company}</strong></p>
                <p className="text-[11px] text-slate-400">{plant} • {location}</p>
              </div>

              <div className="text-right font-mono text-xs">
                <span className="text-slate-500 block">Proposal Quote #: OTIF-PROP-2026-081</span>
                <span className="text-slate-300 font-bold">Valid Until: 30 Days From Issue</span>
                <div className="mt-1 px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 inline-block font-bold">
                  {tier} Package
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="space-y-1.5 leading-relaxed text-slate-300">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                1. Executive Summary &amp; Business Objective
              </span>
              <p>
                This proposal provides <strong className="text-white">{company}</strong> with the automated <strong>Dispatch OTIF Enterprise System</strong> to eliminate OEM delivery penalties, automate daily gate-out security timestamps, and elevate customer delivery ratings for tier-1 OEMs (Hyundai, Ashok Leyland, Royal Enfield, Lear Corp) to $\ge$85% SLA compliance within 30 days.
              </p>
            </div>

            {/* Scope of Modules */}
            <div className="space-y-2">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                2. Included Enterprise Modules &amp; Capabilities
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div><strong>Security Gate Tablet View:</strong> Touch-stamping of vehicle exit times; zero fake logbook entries.</div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div><strong>Daily 8 PM WhatsApp Digest:</strong> Automated mobile KPI scorecard delivered directly to management.</div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div><strong>Excel / ERP Ingestion Engine:</strong> 1-click bulk import from Tally, SAP, or manual Excel registers.</div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div><strong>OEM SLA Defense Certificates:</strong> Instant printable evidence to counter unjust liquidated damage debit notes.</div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div><strong>Automated 8D / CAPA Problem Solving:</strong> Instant IATF 16949 root-cause reports for OEM quality audits.</div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div><strong>Supervisor Training Drill:</strong> Gamified 2-minute simulation module to train shop-floor supervisors.</div>
                </div>
              </div>
            </div>

            {/* Commercial Pricing & Terms */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                  3. Commercial Investment &amp; Terms
                </span>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span>Adjust Quote:</span>
                  <input
                    type="number"
                    step="500"
                    value={monthlyPrice}
                    onChange={e => setCustomPriceOverride(Number(e.target.value))}
                    className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-amber-300 font-bold font-mono focus:outline-none focus:border-amber-400 text-xs"
                    title="Change monthly subscription price for this quote"
                  />
                  <span className="text-slate-500 font-mono">/mo</span>
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
                <div>
                  <div className="text-xs text-slate-400">Monthly Subscription ({tier}):</div>
                  <div className="text-2xl font-black text-emerald-400">
                    {currency}{monthlyPrice.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">/ month</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Billed monthly; cancel anytime with 30 days notice.</div>
                </div>

                <div className="border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-6 pt-3 sm:pt-0">
                  <div className="text-xs text-slate-400">Annual Advance Plan (20% Savings):</div>
                  <div className="text-2xl font-black text-blue-400">
                    {currency}{annualPrice.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">/ year</span>
                  </div>
                  <div className="text-[11px] text-amber-300 font-bold mt-0.5">Includes free on-site gate tablet deployment</div>
                </div>
              </div>
            </div>

            {/* Signatures & Execution Block */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-slate-400 block text-[10px]">ACCEPTED &amp; CONFIRMED FOR CLIENT:</span>
                <div className="w-48 border-b border-slate-700 pb-1 font-bold text-white">______________________</div>
                <div className="text-[11px] text-slate-400">{company}</div>
                <div className="text-[10px] text-slate-500">Authorized Signatory / Plant Director</div>
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-slate-400 block text-[10px]">FOR AUDITING FIRM / VENDOR:</span>
                <div className="w-48 border-b border-slate-700 pb-1 font-bold text-emerald-400 sm:ml-auto">{firmName}</div>
                <div className="text-[11px] text-slate-400">{founderTitle} ({founderName})</div>
                <div className="text-[10px] text-emerald-400">100% Satisfaction SLA Guarantee</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Print this proposal or save as PDF to hand directly to the prospective factory owner.
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
              <span>Print Official Client Proposal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
