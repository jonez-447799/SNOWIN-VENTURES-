import React, { useState } from 'react';
import { 
  QrCode, 
  Barcode, 
  Search, 
  Check, 
  Plus, 
  Volume2, 
  Sparkles,
  MapPin,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AuditItem } from '../types/audit';
import { getPartImageUrl } from '../utils/partImages';

interface ScannerModalProps {
  items: AuditItem[];
  onUpdateCount: (id: string, newCount: number, partName: string) => void;
  onClose: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  items,
  onUpdateCount,
  onClose,
}) => {
  const [scannedCode, setScannedCode] = useState('');
  const [activeItem, setActiveItem] = useState<AuditItem | null>(null);
  const [tempCount, setTempCount] = useState<number>(0);
  const [scanSuccessFeedback, setScanSuccessFeedback] = useState(false);

  const handleScanCode = (code: string) => {
    setScannedCode(code);
    const found = items.find(
      (it) => it.code.toLowerCase() === code.trim().toLowerCase()
    );
    if (found) {
      setActiveItem(found);
      setTempCount(found.physicalQty);
      triggerBeep();
      setScanSuccessFeedback(true);
      setTimeout(() => setScanSuccessFeedback(false), 1200);
    } else {
      setActiveItem(null);
    }
  };

  const triggerBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // AudioContext may be blocked or restricted
    }
  };

  const handleSaveCount = () => {
    if (activeItem) {
      onUpdateCount(activeItem.id, tempCount, activeItem.part);
      setScanSuccessFeedback(true);
      setTimeout(() => {
        setScanSuccessFeedback(false);
        setActiveItem(null);
        setScannedCode('');
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-lg w-full shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Digital Barcode / SKU Scanner</h3>
              <p className="text-xs text-slate-400">Hands-free pre-shutter rack counting</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Viewfinder animation / Barcode input */}
        <div className="relative bg-slate-950 rounded-xl p-4 border border-slate-800 text-center overflow-hidden">
          {/* Laser scanning beam */}
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent top-1/2 -translate-y-1/2 animate-pulse opacity-80" />

          <div className="my-3 space-y-2 relative z-10">
            <Barcode className="w-16 h-12 mx-auto text-emerald-400 opacity-90" />
            <div className="text-xs text-slate-400">
              Point physical barcode reader or select sample SKU below
            </div>
            <div className="flex gap-2 max-w-xs mx-auto">
              <input
                type="text"
                placeholder="Enter SKU barcode..."
                value={scannedCode}
                onChange={(e) => handleScanCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Quick tap sample parts */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Quick-Tap Sample Barcodes (EV Spares):</span>
            <span className="text-emerald-400 text-[10px]">Click to scan</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto pr-1">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => handleScanCode(it.code)}
                className={`p-1.5 rounded text-left border text-[11px] transition-all truncate ${
                  scannedCode.toLowerCase() === it.code.toLowerCase()
                    ? 'bg-emerald-950 text-emerald-200 border-emerald-600 font-bold'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850'
                }`}
              >
                <div className="font-mono text-emerald-400 font-semibold">{it.code}</div>
                <div className="text-[10px] text-slate-400 truncate">{it.part}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Active Scanned Item Hand Count Adjuster */}
        {activeItem && (
          <div className="bg-slate-950 border-2 border-emerald-500/50 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <img
                  src={getPartImageUrl(activeItem.code, activeItem.imageUrl)}
                  alt={activeItem.part}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-slate-700 shrink-0 shadow-sm"
                />
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-400">{activeItem.code}</span>
                  <h4 className="text-sm font-bold text-white">{activeItem.part}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      Spot: <strong className="text-white">{activeItem.spot}</strong>
                    </span>
                    <span>•</span>
                    <span>Billing System: <strong className="text-slate-300">{activeItem.systemQty}</strong></span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Cost: ₹{activeItem.cost}
                </span>
              </div>
            </div>

            {/* Hand count keypad */}
            <div className="bg-slate-900 p-3 rounded-lg flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Physical Hand Count:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTempCount((prev) => Math.max(0, prev - 1))}
                  className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center border border-slate-700"
                >
                  -
                </button>
                <input
                  type="number"
                  value={tempCount}
                  onChange={(e) => setTempCount(parseInt(e.target.value) || 0)}
                  className="w-16 text-center font-mono font-black text-xl text-amber-300 bg-slate-950 rounded border border-slate-700 py-1"
                />
                <button
                  onClick={() => setTempCount((prev) => prev + 1)}
                  className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center border border-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Save Count Button */}
            <button
              onClick={handleSaveCount}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 text-xs"
            >
              <Check className="w-4 h-4" />
              <span>Confirm &amp; Update Hand Count</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
