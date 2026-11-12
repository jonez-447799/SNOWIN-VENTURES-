/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ScanBarcode,
  ShieldCheck,
  Smartphone,
  Check,
  RefreshCw
} from 'lucide-react';
import { AuditItem, AuditRules } from '../types/audit';
import { formatINR } from '../utils/auditCalculations';

interface MorningShutterCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: AuditItem[];
  rules: AuditRules;
  onUpdateItem: (id: string, updates: Partial<AuditItem>, note: string) => void;
}

export const MorningShutterCheckModal: React.FC<MorningShutterCheckModalProps> = ({
  isOpen,
  onClose,
  items,
  rules,
  onUpdateItem,
}) => {
  if (!isOpen) return null;

  // Isolate the 4 fastest-moving critical items for the morning pre-shutter check
  const morningBins = items
    .filter((i) => i.issuesPerMonth >= rules.fastMoverCutoff || i.cost >= 4000)
    .slice(0, 4);

  const [binStatuses, setBinStatuses] = useState<Record<string, 'passed' | 'failed' | 'pending'>>(() => {
    const init: Record<string, 'passed' | 'failed' | 'pending'> = {};
    morningBins.forEach((b) => {
      init[b.id] = b.systemQty === b.physicalQty ? 'passed' : 'failed';
    });
    return init;
  });

  const [auditedTime, setAuditedTime] = useState<string>('08:28 AM');
  const [isApproved, setIsApproved] = useState<boolean>(false);

  const handleSetStatus = (id: string, status: 'passed' | 'failed') => {
    setBinStatuses((prev) => ({ ...prev, [id]: status }));
    const target = items.find((i) => i.id === id);
    if (target && status === 'passed') {
      onUpdateItem(id, { physicalQty: target.systemQty }, `Morning shutter check verified: ${target.code} bin matched at ${auditedTime}`);
    }
  };

  const passedCount = Object.values(binStatuses).filter((s) => s === 'passed').length;
  const isAllClear = passedCount === morningBins.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-fuchsia-500/40 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative space-y-5 my-8 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
              <Smartphone className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold text-fuchsia-400">
                  Pre-Shutter 08:30 AM Tablet Mode
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {auditedTime}
                </span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                4-Bin Morning Audit Gate-Check
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The Stores Head must physically verify the <strong>4 highest-velocity counter bins</strong> before the factory shutter opens at 8:30 AM. Tap to confirm count:
        </p>

        {/* 4 Bins List */}
        <div className="space-y-3">
          {morningBins.map((b, idx) => {
            const st = binStatuses[b.id] || 'pending';
            return (
              <div
                key={b.id}
                className={`p-3.5 rounded-xl border transition ${
                  st === 'passed'
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400">{b.code}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        Bin: {b.spot}
                      </span>
                      <span className="text-[10px] font-mono text-fuchsia-300">
                        {b.issuesPerMonth} issues/mo
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white truncate">{b.part}</div>
                    <div className="text-xs font-mono text-slate-400">
                      System Book Qty: <strong className="text-white">{b.systemQty} pcs</strong> · Unit Cost: {formatINR(b.cost)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleSetStatus(b.id, 'passed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1 cursor-pointer transition ${
                        st === 'passed'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pass</span>
                    </button>
                    <button
                      onClick={() => handleSetStatus(b.id, 'failed')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono cursor-pointer transition ${
                        st === 'failed'
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-slate-800 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      Fail
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Verification Summary */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
          <div>
            <div className="text-slate-400">Checklist Progress:</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {passedCount} of {morningBins.length} Bins Verified
            </div>
          </div>
          <button
            onClick={() => {
              setIsApproved(true);
              setTimeout(() => onClose(), 1500);
            }}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition shadow-md ${
              isAllClear || isApproved
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isApproved ? 'Shutter Open Approved!' : 'Authorize Shutter Open'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
