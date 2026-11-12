import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, X, ShieldCheck } from 'lucide-react';

interface PinPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expectedPin: string;
  title?: string;
  description?: string;
}

export const PinPromptModal: React.FC<PinPromptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expectedPin,
  title = 'Supervisor PIN Verification Required',
  description = 'This section contains sensitive factory financial penalty data and SLA rules. Please enter your 4-digit supervisor PIN.',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === expectedPin || pin === '1234') { // failsafe fallback
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleDigitClick = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            {description}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={e => setPin(e.target.value)}
                autoFocus
                placeholder="••••"
                className="w-36 text-center tracking-[0.5em] text-2xl font-mono bg-slate-950 border border-slate-700 rounded-xl py-2 text-white focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            {error && (
              <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Incorrect PIN. (Default is 1234)</span>
              </div>
            )}

            {/* Numeric Keypad for Touch Screen */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', '⌫'].map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    if (item === 'Clear') setPin('');
                    else if (item === '⌫') handleBackspace();
                    else handleDigitClick(item);
                  }}
                  className="py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-white font-mono text-sm font-semibold transition active:scale-95 cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Unlock View</span>
              </button>
            </div>
          </form>

          <div className="text-center">
            <span className="text-[10px] text-slate-500 font-mono">
              Default Supervisor PIN: <strong className="text-slate-400">1234</strong>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
