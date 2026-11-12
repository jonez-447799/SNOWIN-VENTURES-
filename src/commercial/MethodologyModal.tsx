/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, CheckCircle2, ArrowRight, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { METHODOLOGY_STAGES } from './homepageConfig';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestAudit: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({
  isOpen,
  onClose,
  onRequestAudit,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="methodology-modal-title"
    >
      <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-800 relative space-y-5 my-6 max-h-[92vh] overflow-y-auto font-sans">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
              EXPLAINABLE INVENTORY METHODOLOGY
            </span>
            <h2 id="methodology-modal-title" className="text-lg sm:text-xl font-bold text-white">
              The 6-Stage Inventory Audit Methodology
            </h2>
            <p className="text-xs text-slate-400">
              Every finding is directly linked to supplied records, agreed thresholds, and explicit assumptions.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
            aria-label="Close Methodology Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 Stages */}
        <div className="space-y-3">
          {METHODOLOGY_STAGES.map((stg, idx) => (
            <div
              key={stg.stage}
              className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  {stg.stage}
                </span>
                <span className="text-[11px] font-mono text-slate-400">Step {idx + 1} of 6</span>
              </div>
              <h3 className="text-sm font-bold text-white">{stg.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{stg.summary}</p>
              <div className="pt-1.5 border-t border-slate-800/80 space-y-1 text-[11px] font-mono">
                <div className="text-emerald-300">
                  <span className="text-slate-400">Formula: </span>
                  <code>{stg.formula}</code>
                </div>
                <div className="text-slate-300">
                  <span className="text-slate-400">Inputs: </span>
                  <span>{stg.inputs}</span>
                </div>
                <div className="text-cyan-300">
                  <span className="text-slate-400">Output: </span>
                  <span>{stg.outputs}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Rigor Commitment */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-xs text-slate-300 space-y-1">
          <div className="font-bold text-emerald-300 font-mono uppercase text-[11px]">
            Audit Standard Commitment:
          </div>
          <p className="leading-relaxed">
            Every finding must be linked to the supplied data, the agreed definitions and documented assumptions. No synthetic estimations or unverifiable assumptions are introduced into your plant&apos;s analysis.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 font-mono">
            Zero proprietary lock-in · Standard spreadsheet audit logic
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-lg hover:bg-slate-800 text-slate-300 text-xs cursor-pointer transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestAudit();
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow"
            >
              <span>Apply for Pilot Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
