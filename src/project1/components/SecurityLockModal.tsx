import React from 'react';
import { Info, Unlock, Trash2 } from 'lucide-react';
import { clearLocalDemonstrationStorage } from '../utils/cryptoVault';

interface SecurityLockModalProps {
  isLocked: boolean;
  onUnlock: (pin: string) => boolean;
  onHardReset: () => void;
}

export const SecurityLockModal: React.FC<SecurityLockModalProps> = ({
  isLocked,
  onUnlock,
  onHardReset,
}) => {
  if (!isLocked) return null;

  const handleReset = () => {
    if (confirm('Reset local demonstration data in this browser back to the baseline sample?')) {
      clearLocalDemonstrationStorage();
      onHardReset();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-md w-full p-6 shadow-2xl text-neutral-100">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Info className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Demonstration Screen Paused
              </h2>
              <p className="text-xs text-neutral-400">
                DEMONSTRATION ENVIRONMENT
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/60 text-amber-400 border border-amber-800">
            LOCAL DEMO
          </span>
        </div>

        <div className="mt-4 p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs space-y-2">
          <p className="text-amber-300 font-semibold">
            Authentication is not enabled in this demonstration environment.
          </p>
          <p className="text-neutral-400 leading-relaxed">
            Figures and records shown here are illustrative unless a user imports data locally. Operational information is currently stored only in this browser.
          </p>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => onUnlock('')}
            className="w-full py-2.5 px-4 text-xs font-bold text-neutral-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
            <span>Resume Demonstration Session</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleReset}
            className="text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Local Demonstration Data</span>
          </button>
          <span className="text-neutral-500 text-[11px]">Browser localStorage only</span>
        </div>
      </div>
    </div>
  );
};
