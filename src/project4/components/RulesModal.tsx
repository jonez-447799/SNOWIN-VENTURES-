import React, { useState } from 'react';
import { Sliders, AlertTriangle, ShieldCheck, Calendar, Info, Check } from 'lucide-react';
import { AuditRules } from '../types/audit';

interface RulesModalProps {
  rules: AuditRules;
  onSaveRules: (updated: AuditRules) => void;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  rules,
  onSaveRules,
  onClose,
}) => {
  const [formData, setFormData] = useState<AuditRules>({ ...rules });
  const [hasChanged, setHasChanged] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRules(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Audit Rules &amp; Cutoff Thresholds</h3>
              <p className="text-xs text-slate-400">Pre-shutter cycle count configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Rule 1: Count Date */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Count Date (Morning before shutter opens)</span>
              </label>
              <span className="text-[11px] font-mono text-amber-300">Yellow Cell</span>
            </div>
            <input
              type="date"
              value={formData.countDate}
              onChange={(e) => {
                setFormData({ ...formData, countDate: e.target.value });
                setHasChanged(true);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono focus:outline-none focus:border-amber-400"
            />
            <p className="text-[11px] text-slate-400 leading-normal">
              <strong>Audit Rule:</strong> The morning you counted. Do not stretch a count across two days. Sales during the count make the gap a lie.
            </p>
          </div>

          {/* Rule 2: Fast Mover Cutoff */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200">
                Fast Mover Cutoff (Issues / Month)
              </label>
              <span className="text-[11px] font-mono text-amber-300">Yellow Cell</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="100"
                value={formData.fastMoverCutoff}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    fastMoverCutoff: parseInt(e.target.value) || 8,
                  });
                  setHasChanged(true);
                }}
                className="w-24 bg-slate-900 border border-slate-700 rounded p-2 text-white font-bold text-base text-center font-mono focus:outline-none focus:border-amber-400"
              />
              <span className="text-xs text-slate-300">issues/month threshold</span>
            </div>
            <div className="bg-amber-950/30 border border-amber-800/40 p-2 rounded text-[11px] text-amber-200/90 leading-relaxed">
              <strong>Integrity Rule:</strong> Eight is the default for a small counter. A bigger store might use 20. Change the yellow cell before you count. <em>Do not change it after you have seen the result, to make the story neater.</em>
            </div>
          </div>

          {/* Rule 3: Shrink Tolerance */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200">
                Shrink Tolerance (%)
              </label>
              <span className="text-[11px] font-mono text-amber-300">Yellow Cell</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={formData.shrinkTolerancePercent}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    shrinkTolerancePercent: parseFloat(e.target.value) || 2,
                  });
                  setHasChanged(true);
                }}
                className="w-24 bg-slate-900 border border-slate-700 rounded p-2 text-white font-bold text-base text-center font-mono focus:outline-none focus:border-amber-400"
              />
              <span className="text-xs text-slate-300">% allowable variance</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              A 2% gap can be dust, a broken piece, or rounding. Above that, name it. The sample gaps are far above 2%. The tolerance is there so a real store with a ₹40 fuse short by one piece does not become a theft story.
            </p>
          </div>

          {/* Store Name & Auditor Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Store / Counter Name</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => {
                  setFormData({ ...formData, storeName: e.target.value });
                  setHasChanged(true);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Lead Auditor</label>
              <input
                type="text"
                value={formData.auditorName}
                onChange={(e) => {
                  setFormData({ ...formData, auditorName: e.target.value });
                  setHasChanged(true);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Rules</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
