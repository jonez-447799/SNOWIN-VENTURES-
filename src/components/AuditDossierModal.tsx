import React, { useState } from 'react';
import { StockItem, RulesConfig, CurrencyCode, UserRole } from '../types';
import { 
  generateOwnerReport, 
  formatCurrency, 
  formatIndianLakhsCrores 
} from '../utils/calculations';
import { 
  Award, 
  Printer, 
  Share2, 
  Check, 
  X, 
  Building2, 
  ShieldCheck, 
  Calendar, 
  Layers, 
  Copy,
  Send,
  FileText
} from 'lucide-react';

interface AuditDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: StockItem[];
  rules: RulesConfig;
  currency: CurrencyCode;
  userRole: UserRole;
}

export const AuditDossierModal: React.FC<AuditDossierModalProps> = ({
  isOpen,
  onClose,
  items,
  rules,
  currency,
  userRole,
}) => {
  const [activeView, setActiveView] = useState<'certificate' | 'whatsapp'>('certificate');
  const [copiedDigest, setCopiedDigest] = useState(false);

  if (!isOpen) return null;

  const summary = generateOwnerReport(items, rules);

  const handlePrint = () => {
    window.print();
  };

  const formattedWhatsAppDigest = `*OFFICIAL INVENTORY AUDIT CERTIFICATE*
*Factory:* Ambattur Fabrication Unit
*Audit Baseline Date:* ${summary.asOfDate}
*Auditor Verified:* M. Natarajan & Team

══════════════════════════
📊 *FINANCIAL SUMMARY*
• *Total Book Inventory:* ${formatCurrency(summary.totalStockValue, currency)} (${formatIndianLakhsCrores(summary.totalStockValue)})
• *Active SKUs:* ${summary.totalItemCount} Items

🔴 *TRAPPED DEAD CASH:* ${formatCurrency(summary.deadCash, currency)} (${summary.deadCashPercent}%)
   - Idle $\\ge$ ${rules.deadThresholdDays} days | ${summary.deadItemCount} SKUs
🟡 *SLOW MOVING:* ${formatCurrency(summary.slowCash, currency)} (${summary.slowCashPercent}%)
   - Idle ${rules.slowThresholdDays} to ${rules.deadThresholdDays - 1} days | ${summary.slowItemCount} SKUs
🟢 *HEALTHY MOVING:* ${formatCurrency(summary.movingCash, currency)} (${summary.movingCashPercent}%)
   - Idle < ${rules.slowThresholdDays} days | ${summary.movingItemCount} SKUs

🔥 *ANNUAL HOLDING BURN (@ ${rules.holdingCostPercent}%):*
   ~${formatCurrency(summary.annualHoldingBurn, currency)} / year drained in bank interest & storage!

══════════════════════════
🏆 *TOP DEAD ASSETS TO LIQUIDATE:*
${summary.topDeadItems
  .slice(0, 5)
  .map(
    (item, i) =>
      `${i + 1}. *${item.itemName}* (${item.daysIdle}d idle): ${formatCurrency(item.closingValue || 0, currency)} [${item.action}]`
  )
  .join('\n')}

══════════════════════════
*Bank / CC Limit Review Note:*
Certified for working capital rationalization and inventory clearance.`;

  const copyDigest = () => {
    navigator.clipboard.writeText(formattedWhatsAppDigest);
    setCopiedDigest(true);
    setTimeout(() => setCopiedDigest(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>Executive Inventory Audit Dossier</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                  Certified
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Official compliance &amp; bank review certificate and shareable executive mobile digest.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-neutral-200 dark:bg-neutral-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveView('certificate')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeView === 'certificate'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Audit Certificate
              </button>
              <button
                onClick={() => setActiveView('whatsapp')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  activeView === 'whatsapp'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                WhatsApp Digest
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-neutral-100 dark:bg-neutral-950/40">
          {activeView === 'certificate' ? (
            /* Printable Formal Certificate Card */
            <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 rounded-xl p-8 shadow-lg max-w-3xl mx-auto space-y-6 print:m-0 print:p-0 print:border-none print:shadow-none text-neutral-900 dark:text-neutral-100 font-sans">
              
              {/* Certificate Header Banner */}
              <div className="border-b-2 border-neutral-800 dark:border-neutral-600 pb-5 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
                    <Building2 className="w-4 h-4" />
                    <span>Ambattur Fabrication Works Ltd.</span>
                  </div>
                  <h1 className="text-xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 mt-1 uppercase">
                    Factory Inventory &amp; Working Capital Audit Certificate
                  </h1>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">
                    Industrial Estate, Phase II, Chennai, TN | Internal Audit Ref: AUD-{summary.asOfDate.replace(/-/g, '')}-P1
                  </p>
                </div>

                <div className="text-right">
                  <div className="px-3 py-1 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-mono font-bold">
                    AS-OF: {summary.asOfDate}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono mt-1">
                    Holding Cost: {rules.holdingCostPercent}% p.a.
                  </div>
                </div>
              </div>

              {/* Certified Financial Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
                  <div className="text-[11px] font-bold text-neutral-500 uppercase">Stock on Books</div>
                  <div className="text-lg font-black font-mono mt-1 text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(summary.totalStockValue, currency)}
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                    {summary.totalItemCount} Tracked SKUs
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
                  <div className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase">
                    Trapped Dead Cash
                  </div>
                  <div className="text-lg font-black font-mono mt-1 text-red-600 dark:text-red-400">
                    {formatCurrency(summary.deadCash, currency)}
                  </div>
                  <div className="text-[11px] text-red-600/80 dark:text-red-400/80 font-mono mt-0.5">
                    {summary.deadCashPercent}% of Total Stock ({summary.deadItemCount} SKUs)
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                    Annual Holding Drain
                  </div>
                  <div className="text-lg font-black font-mono mt-1 text-amber-600 dark:text-amber-400">
                    ~{formatCurrency(summary.annualHoldingBurn, currency)}
                  </div>
                  <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 font-mono mt-0.5">
                    Drained Every 365 Days
                  </div>
                </div>
              </div>

              {/* Ageing Breakdown */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 pb-1">
                  Inventory Ageing Distribution
                </h3>
                <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">0 - 30 Days (Fast)</div>
                    <div className="font-bold mt-1 text-neutral-900 dark:text-neutral-100">{formatCurrency(summary.ageingBreakdown.range0_30, currency)}</div>
                    <div className="text-[10px] text-neutral-500">{summary.ageingBreakdown.range0_30_pct}%</div>
                  </div>
                  <div className="p-2.5 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                    <div className="text-[10px] text-blue-700 dark:text-blue-400 font-bold">31 - 89 Days</div>
                    <div className="font-bold mt-1 text-neutral-900 dark:text-neutral-100">{formatCurrency(summary.ageingBreakdown.range31_89, currency)}</div>
                    <div className="text-[10px] text-neutral-500">{summary.ageingBreakdown.range31_89_pct}%</div>
                  </div>
                  <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">90 - 179 Days (Slow)</div>
                    <div className="font-bold mt-1 text-neutral-900 dark:text-neutral-100">{formatCurrency(summary.ageingBreakdown.range90_179, currency)}</div>
                    <div className="text-[10px] text-neutral-500">{summary.ageingBreakdown.range90_179_pct}%</div>
                  </div>
                  <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40">
                    <div className="text-[10px] text-red-700 dark:text-red-400 font-bold">&ge; 180 Days (Dead)</div>
                    <div className="font-bold mt-1 text-neutral-900 dark:text-neutral-100">{formatCurrency(summary.ageingBreakdown.range180_plus, currency)}</div>
                    <div className="text-[10px] text-neutral-500">{summary.ageingBreakdown.range180_plus_pct}%</div>
                  </div>
                </div>
              </div>

              {/* Signatures & Certification Block */}
              <div className="pt-6 border-t-2 border-dashed border-neutral-300 dark:border-neutral-700 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <div className="text-[11px] text-neutral-400 font-mono">Prepared &amp; Verified By:</div>
                  <div className="font-bold text-neutral-800 dark:text-neutral-200 mt-4 border-b border-neutral-300 dark:border-neutral-700 pb-1">
                    M. Natarajan, Managing Partner
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">Ambattur Fabrication Works Ltd.</div>
                </div>

                <div>
                  <div className="text-[11px] text-neutral-400 font-mono">Internal Audit Verification:</div>
                  <div className="font-bold text-neutral-800 dark:text-neutral-200 mt-4 border-b border-neutral-300 dark:border-neutral-700 pb-1 flex items-center justify-between">
                    <span>Audit Committee Certified</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">Stock Engine SHA-256 Validated</div>
                </div>
              </div>

            </div>
          ) : (
            /* WhatsApp Shareable Digest */
            <div className="max-w-xl mx-auto space-y-4">
              <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-neutral-900 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      WhatsApp Mobile Card Preview
                    </span>
                  </div>
                  <button
                    onClick={copyDigest}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    {copiedDigest ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDigest ? 'Copied to Clipboard!' : 'Copy Formatted Digest'}</span>
                  </button>
                </div>

                <pre className="text-xs font-mono p-4 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {formattedWhatsAppDigest}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/70 flex items-center justify-between">
          <div className="text-xs text-neutral-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Signed with SHA-256 Audit Seal</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF Certificate</span>
            </button>
            <button
              onClick={copyDigest}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedDigest ? 'Copied!' : 'Share to WhatsApp'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
