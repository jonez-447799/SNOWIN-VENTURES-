import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  Layers, 
  RotateCcw, 
  MoveRight, 
  FileCheck,
  MapPin,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { AuditItem, AuditRules } from '../types/audit';
import { formatINR } from '../utils/auditCalculations';
import { getPartImageUrl } from '../utils/partImages';

interface ActionBoardProps {
  items: AuditItem[];
  rules: AuditRules;
  onUpdateItem: (id: string, updates: Partial<AuditItem>, logNote: string) => void;
  onSelectSKU?: (code: string) => void;
}

export const ActionBoard: React.FC<ActionBoardProps> = ({
  items,
  rules,
  onUpdateItem,
  onSelectSKU,
}) => {
  // Discrepancies and slotting moves sorted by absolute rupee impact descending
  const discrepancyItems = items
    .filter((it) => (it.gapQty ?? 0) !== 0)
    .sort((a, b) => Math.abs(b.gapRupees ?? 0) - Math.abs(a.gapRupees ?? 0));

  // Matched items that are fast movers hidden in back rack or mezzanine
  const hiddenMatchedItems = items.filter(
    (it) =>
      (it.gapQty ?? 0) === 0 &&
      it.issuesPerMonth >= rules.fastMoverCutoff &&
      it.spot.trim().toLowerCase() !== 'counter'
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Fix This Week, in Rupee Order</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-rose-950 text-rose-300 border border-rose-800/60">
              Executive Priority
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Address largest rupee shrinkage first, then clear bottlenecks where fast sellers are hidden from customer sight.
          </p>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse"></span>
          <span>Shrinkage: Top 6 Actions</span>
        </div>
      </div>

      {/* Main Rupee-Ordered Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {discrepancyItems.map((item, index) => {
          const isShort = (item.gapQty ?? 0) < 0;
          const isFast = item.issuesPerMonth >= rules.fastMoverCutoff;
          const isHidden = item.spot.trim().toLowerCase() !== 'counter';
          const rupeeVal = Math.abs(item.gapRupees ?? 0);

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all relative overflow-hidden ${
                isShort
                  ? 'bg-slate-900/90 border-slate-800 hover:border-rose-700/60 shadow-md'
                  : 'bg-slate-900/90 border-slate-800 hover:border-cyan-700/60 shadow-md'
              }`}
            >
              <div className="space-y-2.5">
                {/* Header: Rank + Image + Code + Rupee badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-300 flex items-center justify-center shrink-0">
                      #{index + 1}
                    </span>
                    <img
                      src={getPartImageUrl(item.code, item.imageUrl)}
                      alt={item.part}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-700 shrink-0 shadow-sm"
                    />
                    <div>
                      <span className="text-xs font-mono text-emerald-400 font-semibold cursor-pointer hover:underline"
                        onClick={() => onSelectSKU && onSelectSKU(item.code)}>
                        {item.code}
                      </span>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {item.part}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-mono font-black px-2 py-0.5 rounded border inline-block ${
                        isShort
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                          : 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80'
                      }`}
                    >
                      {isShort ? `-${formatINR(rupeeVal)}` : `+${formatINR(rupeeVal)}`}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {isShort ? `${Math.abs(item.gapQty ?? 0)} pc short` : `+${item.gapQty} pc found`}
                    </div>
                  </div>
                </div>

                {/* Status Badges: Spot, Issues, Speed */}
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    Spot: <strong className="text-white">{item.spot}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    System: <strong className="text-slate-200">{item.systemQty}</strong> | Hand: <strong className="text-amber-300">{item.physicalQty}</strong>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-medium border ${
                      isFast
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800/70'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {item.issuesPerMonth} issues/mo ({isFast ? 'Fast' : 'Slow'})
                  </span>
                  {isFast && isHidden && (
                    <span className="px-1.5 py-0.5 rounded font-semibold bg-violet-950 text-violet-300 border border-violet-800/70 text-[10px]">
                      Hidden Seller!
                    </span>
                  )}
                </div>

                {/* Specific Prescription / Action Text from prompt */}
                <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 text-xs text-slate-200 leading-relaxed">
                  <strong className="text-amber-400 block mb-0.5">Action Plan:</strong>
                  {item.action}
                </div>
              </div>

              {/* Action Buttons for shop workers */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
                {/* Move to Counter Button if currently in back rack or mezzanine */}
                {isHidden && (
                  <button
                    onClick={() => {
                      onUpdateItem(
                        item.id,
                        { spot: 'Counter', movedToCounter: true },
                        `Moved remaining ${item.physicalQty} units from ${item.spot} to Counter`
                      );
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-700 hover:bg-emerald-600 text-white transition-colors"
                  >
                    <MoveRight className="w-3.5 h-3.5" />
                    <span>Move to Counter</span>
                  </button>
                )}

                {/* Recount checkbox/button for missing units */}
                {isShort && (
                  <button
                    onClick={() => {
                      onUpdateItem(
                        item.id,
                        { recounted: !item.recounted },
                        item.recounted
                          ? `Cleared recount verification for ${item.code}`
                          : `Verified recount once before write-off for ${item.code}`
                      );
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                      item.recounted
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{item.recounted ? 'Recount Verified ✓' : 'Recount Once'}</span>
                  </button>
                )}

                {/* Inward receipt button for found stock */}
                {!isShort && (
                  <button
                    onClick={() => {
                      onUpdateItem(
                        item.id,
                        { receiptEntered: !item.receiptEntered, systemQty: item.receiptEntered ? item.systemQty - (item.gapQty ?? 0) : item.physicalQty },
                        item.receiptEntered
                          ? `Reverted inward receipt for ${item.code}`
                          : `Entered supplier receipt into billing screen for ${item.code} (+${item.gapQty} pcs)`
                      );
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                      item.receiptEntered
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                        : 'bg-cyan-700 hover:bg-cyan-600 text-white border-transparent'
                    }`}
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>{item.receiptEntered ? 'Receipt Entered ✓' : 'Enter Receipt'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Matched Fast Movers Hidden (Slotting Bottlenecks) */}
      {hiddenMatchedItems.length > 0 && (
        <div className="mt-4 bg-slate-900/90 border border-violet-800/50 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-violet-300 flex items-center gap-2">
                <span>Slotting Fix: Matched Count, but Fast Mover Stranded</span>
                <span className="text-xs px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800/80">
                  {hiddenMatchedItems.length} SKUs
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                A perfect count can still be a bad bin. Slotting means fast movers near the hand, dead items out of the way.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hiddenMatchedItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={getPartImageUrl(item.code, item.imageUrl)}
                    alt={item.part}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-700 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-emerald-400 font-semibold">{item.code}</span>
                      <span className="text-xs font-bold text-white">{item.part}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Count: {item.physicalQty} pcs • Spot:{' '}
                      <span className="text-amber-300 font-semibold">{item.spot}</span> • Speed:{' '}
                      <strong className="text-emerald-300">{item.issuesPerMonth} issues/mo</strong>
                    </div>
                    <div className="text-[11px] text-violet-300/90 mt-1">
                      {item.part === 'Side mirror pair' && 'Moved 9 times this month. Move forward to counter.'}
                      {item.part === 'LED headlamp' && '10 issues/mo stranded on mezzanine. Move to counter.'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onUpdateItem(
                      item.id,
                      { spot: 'Counter', movedToCounter: true },
                      `Reallocated ${item.code} from ${item.spot} to Counter face`
                    );
                  }}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-violet-700 hover:bg-violet-600 text-white transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Move to Counter</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
