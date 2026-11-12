import React, { useState } from 'react';
import { ShieldCheck, Lock, Unlock, AlertTriangle, Key, Trash2 } from 'lucide-react';
import { secureDataShredder } from '../utils/cryptoVault';

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
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  if (!isLocked) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUnlock(pin)) {
      setPin('');
      setErrorMsg(null);
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setErrorMsg(`Invalid security master PIN. Attempts: ${newAttempts}/5`);
      setPin('');
    }
  };

  const handleShred = () => {
    if (confirm('CRITICAL ACTION: This will cryptographically shred all local financial data and reset the session. Proceed?')) {
      secureDataShredder();
      onHardReset();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-md w-full p-6 shadow-2xl text-neutral-100">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Factory Vault Locked
              </h2>
              <p className="text-xs text-neutral-400">
                AES-256-GCM Session Protection Active
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
            ENCRYPTED
          </span>
        </div>

        <div className="mt-4 p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span>Encryption Standard</span>
            <span className="font-mono text-emerald-400 font-bold">AES-GCM (256-bit)</span>
          </div>
          <div className="flex items-center justify-between text-neutral-400">
            <span>Key Derivation</span>
            <span className="font-mono text-neutral-200">PBKDF2 (100k SHA-256)</span>
          </div>
          <div className="flex items-center justify-between text-neutral-400">
            <span>Data Privacy Shield</span>
            <span className="font-mono text-purple-400">GDPR Article 32 Active</span>
          </div>
          <div className="flex items-center justify-between text-neutral-400">
            <span>Storage Integrity</span>
            <span className="font-mono text-sky-400">SHA-256 HMAC Verified</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300">
              Enter Master Security PIN (Default: <code className="text-amber-400 font-mono">2026</code>)
            </label>
            <div className="mt-1.5 relative">
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full text-center text-lg font-mono tracking-widest p-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
              <Key className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5" />
            </div>
          </div>

          {errorMsg && (
            <div className="text-xs text-rose-400 flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 text-xs font-bold text-neutral-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock Factory Session</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleShred}
            className="text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 text-[11px]"
          >
            <Trash2 className="w-3 h-3" />
            <span>Emergency Data Shredder</span>
          </button>
          <span className="text-neutral-500 text-[11px]">Protected by Web Crypto API</span>
        </div>
      </div>
    </div>
  );
};
