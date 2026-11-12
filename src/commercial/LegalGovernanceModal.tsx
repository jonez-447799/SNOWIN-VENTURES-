/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  Lock,
  Trash2,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Mail,
  ArrowRight,
  Scale,
} from 'lucide-react';

export type LegalGovernanceTab = 'privacy' | 'terms';

interface LegalGovernanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalGovernanceTab;
  onRequestAudit?: () => void;
}

export const LegalGovernanceModal: React.FC<LegalGovernanceModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
  onRequestAudit,
}) => {
  const [activeTab, setActiveTab] = useState<LegalGovernanceTab>(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-governance-modal-title"
    >
      <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 sm:px-7 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 block">
                B2B MANUFACTURING DATA GOVERNANCE &amp; LEGAL TERMS
              </span>
              <h2
                id="legal-governance-modal-title"
                className="text-base sm:text-lg font-black text-white leading-tight"
              >
                Operationalyst Privacy Policy &amp; Pilot Audit Terms of Service
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close legal and data governance modal"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-5 sm:px-7 pt-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="legal-tab-privacy"
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold inline-flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-emerald-400 text-emerald-300 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy &amp; Data Handling Policy</span>
          </button>

          <button
            type="button"
            data-testid="legal-tab-terms"
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold inline-flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'terms'
                ? 'border-emerald-400 text-emerald-300 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Pilot Audit Terms of Service &amp; Analytical Scope</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Operator Identity Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-400">Operated by:</span>{' '}
              <strong className="text-white">
                C. Jones Snowin / Snowin Ventures
              </strong>{' '}
              <span className="text-slate-400">· Chennai, Tamil Nadu, India</span>
            </div>
            <a
              href="mailto:joneszz2004@gmail.com"
              className="text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-1.5 font-bold"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>joneszz2004@gmail.com</span>
            </a>
          </div>

          {activeTab === 'privacy' ? (
            <div data-testid="legal-privacy-content" className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-white">
                  B2B Manufacturing Privacy &amp; Data Handling Policy
                </h3>
                <p className="text-xs text-slate-400">
                  Operationalyst is engineered around strict data minimization, column anonymization, and isolated deterministic processing for Indian and global manufacturing teams.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Rule 1 */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-mono font-bold text-emerald-300 text-xs uppercase">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>1. Step 1 Zero-File Collection</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Initial Pilot Audit inquiries collect only business contact and plant qualification metadata (
                    <code className="text-emerald-300 font-mono text-xs">
                      fullName, workEmail, phoneOrWhatsapp, companyName, plantLocation, roleTitle, erpSystem, approxSkuCount, primaryChallenge
                    </code>
                    ). Prospective manufacturing buyers are never asked to upload confidential ERP spreadsheets during initial inquiry submission.
                  </p>
                </div>

                {/* Rule 2 */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-mono font-bold text-emerald-300 text-xs uppercase">
                    <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{'2. Step 2 Data Minimization & Anonymization'}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Approved Pilot Audits require only the 5 standard inventory columns:{' '}
                    <code className="text-emerald-300 font-mono text-xs">
                      Part_ID, Part_Description, Closing_Stock_Qty, Unit_Cost_INR, Last_Movement_Date
                    </code>
                    . Proprietary vendor names, customer names, and exact internal engineering drawing numbers may be masked or anonymized prior to upload while preserving full mathematical accuracy.
                  </p>
                </div>

                {/* Rule 3 */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-mono font-bold text-emerald-300 text-xs uppercase">
                    <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>3. Zero Third-Party AI Model Training</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Submitted operational spreadsheets are processed deterministically by Operationalyst&apos;s mathematical calculation engines (P1–P4) and are never sold, shared with third-party data brokers, or used to train external public AI models.
                  </p>
                </div>

                {/* Rule 4 */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-mono font-bold text-emerald-300 text-xs uppercase">
                    <Trash2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{'4. 14-Day Post-Audit Purge & Deletion Rights'}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Pilot datasets are purged within 14 days of findings handover unless ongoing workspace retention is explicitly requested in writing by the client, or immediately upon email request to{' '}
                    <a
                      href="mailto:joneszz2004@gmail.com"
                      className="text-emerald-300 underline font-mono"
                    >
                      joneszz2004@gmail.com
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div data-testid="legal-terms-content" className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {'Pilot Audit Terms of Service & Analytical Scope'}
                </h3>
                <p className="text-xs text-slate-400">
                  Clear operational boundaries governing Founder-Led Pilot Factory Audits and the P1–P4 analytical engines.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Term 1 */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-mono font-bold text-sky-300 text-xs uppercase">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>{'1. Decision-Support & Diagnostic Scope'}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Operationalyst provides deterministic mathematical classifications (non-moving stock, ageing velocity, OTIF dual-gate status, freight rate-card breaches, and warehouse bin variances) based strictly on client-supplied ERP/spreadsheet exports.
                  </p>
                </div>

                {/* Term 2 */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-mono font-bold text-amber-300 text-xs uppercase">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>2. No Automated Write-Offs or ERP Mutation</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Operationalyst operates strictly read-only on exported files and does not modify live ERP ledgers, guarantee specific financial liquidation recovery, or replace physical engineering/quality inspection before scrap or vendor contra actions.
                  </p>
                </div>

                {/* Term 3 */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-mono font-bold text-emerald-300 text-xs uppercase">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>3. No Automatic Subscription Lock-In</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Requesting or completing a Founder-Led Pilot Factory Audit carries zero automatic subscription or recurring billing obligation. All executive findings summaries and exported priority schedules delivered during the pilot remain the client&apos;s property for internal review.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] font-mono text-slate-400">
            Questions or bilateral NDA requests:{' '}
            <a
              href="mailto:joneszz2004@gmail.com"
              className="text-emerald-300 hover:underline"
            >
              joneszz2004@gmail.com
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            {onRequestAudit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestAudit();
                }}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Request a Pilot Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
