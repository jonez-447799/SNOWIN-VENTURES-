import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  AlertCircle, 
  AlertTriangle,
  Check, 
  SlidersHorizontal,
  ChevronDown,
  Info,
  MapPin,
  TrendingDown,
  ArrowUpDown,
  ImageIcon,
  Eye,
  Camera,
  ExternalLink,
  Barcode,
  QrCode,
  ScanLine,
  Crosshair,
  Volume2,
  Sparkles,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { AuditItem, AuditRules, UserRole } from '../types/audit';
import { formatINR } from '../utils/auditCalculations';
import { getPartImageUrl, PART_PLACEHOLDER_IMAGES } from '../utils/partImages';

interface CountSheetProps {
  items: AuditItem[];
  rules: AuditRules;
  activeRole: UserRole;
  onUpdateItem: (id: string, updates: Partial<AuditItem>, logNote: string) => void;
  onAddItem: (newItem: Omit<AuditItem, 'id'>) => void;
  onDeleteItem: (id: string, partName: string) => void;
  filterMode: string;
  setFilterMode: (filter: string) => void;
  selectedCode?: string | null;
}

export const CountSheet: React.FC<CountSheetProps> = ({
  items,
  rules,
  activeRole,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
  filterMode,
  setFilterMode,
  selectedCode,
}) => {
  const [searchTerm, setSearchTerm] = useState(selectedCode || '');
  const [quickScanInput, setQuickScanInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; code: string } | null>(null);

  // Row scanning & highlighting state
  const [activeScanItem, setActiveScanItem] = useState<AuditItem | null>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const [scannedNotification, setScannedNotification] = useState<{ code: string; part: string } | null>(null);

  // References for scrolling and auto-focusing
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const countInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [newSKU, setNewSKU] = useState<{
    code: string;
    part: string;
    spot: string;
    systemQty: number;
    physicalQty: number;
    cost: number;
    issuesPerMonth: number;
    imageUrl?: string;
  }>({
    code: '',
    part: '',
    spot: 'Counter',
    systemQty: 10,
    physicalQty: 10,
    cost: 500,
    issuesPerMonth: 8,
    imageUrl: '',
  });

  const availableSpots = ['Counter', 'Back rack', 'Mezzanine', 'Drawer'];

  // Audio beep feedback using Web Audio API
  const playScanBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  };

  // Function to highlight row, scroll it into view, and focus hand count input
  const highlightAndFocusRow = (itemId: string, code: string, part: string) => {
    setHighlightedRowId(itemId);
    playScanBeep();
    setScannedNotification({ code, part });

    // Ensure the item is visible by switching to 'all' if filtered out
    const isVisibleInCurrentFilter = filteredItems.some((it) => it.id === itemId);
    if (!isVisibleInCurrentFilter) {
      setFilterMode('all');
    }

    // Scroll into view & focus input
    setTimeout(() => {
      const rowEl = rowRefs.current[itemId];
      if (rowEl) {
        rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const inputEl = countInputRefs.current[itemId];
      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      }
    }, 120);

    // Auto-dismiss notification after 4.5s
    setTimeout(() => {
      setScannedNotification(null);
    }, 4500);
  };

  // Handle row scanner button trigger
  const handleTriggerRowScanner = (item: AuditItem) => {
    setActiveScanItem(item);
  };

  // Handle confirmation from the scanner dialog
  const handleConfirmScan = (item: AuditItem) => {
    setActiveScanItem(null);
    highlightAndFocusRow(item.id, item.code, item.part);
  };

  // Handle quick scan input (from physical handheld scanner or quick bar)
  const handleQuickScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickScanInput.trim()) return;
    const query = quickScanInput.trim().toLowerCase();
    const matched = items.find(
      (it) =>
        it.code.toLowerCase() === query ||
        it.part.toLowerCase().includes(query)
    );

    if (matched) {
      highlightAndFocusRow(matched.id, matched.code, matched.part);
      setQuickScanInput('');
    } else {
      alert(`No SKU found matching barcode "${quickScanInput}". Please check the part code.`);
    }
  };

  // If selectedCode is passed as a prop, focus and highlight it
  useEffect(() => {
    if (selectedCode) {
      const matched = items.find((it) => it.code.toLowerCase() === selectedCode.toLowerCase());
      if (matched) {
        highlightAndFocusRow(matched.id, matched.code, matched.part);
      }
    }
  }, [selectedCode]);

  // Filter items
  const filteredItems = items.filter((item) => {
    // Search query
    const matchesSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.part.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.spot.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Filter pill modes
    const gap = item.gapQty ?? 0;
    const isFast = item.issuesPerMonth >= rules.fastMoverCutoff;
    const isHidden = item.spot.trim().toLowerCase() !== 'counter';

    if (filterMode === 'discrepancy') return gap !== 0;
    if (filterMode === 'hidden_fast') return isFast && isHidden;
    if (filterMode === 'found_stock') return gap > 0;
    if (filterMode === 'matched') return gap === 0;
    if (filterMode === 'low_stock') return item.physicalQty < 2;
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSKU.code || !newSKU.part) return;
    const resolvedImageUrl = newSKU.imageUrl && newSKU.imageUrl.trim().length > 0 
      ? newSKU.imageUrl.trim() 
      : getPartImageUrl(newSKU.code);

    onAddItem({
      ...newSKU,
      imageUrl: resolvedImageUrl,
    });
    setShowAddModal(false);
    setNewSKU({
      code: '',
      part: '',
      spot: 'Counter',
      systemQty: 10,
      physicalQty: 10,
      cost: 500,
      issuesPerMonth: 8,
      imageUrl: '',
    });
  };

  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');

  const handleBulkPasteImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkPasteText.trim()) return;
    const lines = bulkPasteText.trim().split('\n');
    let count = 0;
    lines.forEach((line) => {
      const cols = line.includes('\t') ? line.split('\t') : line.split(',');
      if (cols.length >= 2) {
        const code = cols[0].trim();
        const part = cols[1].trim();
        if (!code || !part || code.toLowerCase() === 'code') return;
        const spot = (cols[2]?.trim() || 'Counter');
        const systemQty = Number(cols[3]?.replace(/[^0-9.-]/g, '')) || 10;
        const physicalQty = Number(cols[4]?.replace(/[^0-9.-]/g, '')) || systemQty;
        const cost = Number(cols[5]?.replace(/[^0-9.-]/g, '')) || 500;
        const issuesPerMonth = Number(cols[6]?.replace(/[^0-9.-]/g, '')) || 5;
        onAddItem({
          code,
          part,
          spot,
          systemQty,
          physicalQty,
          cost,
          issuesPerMonth,
          imageUrl: getPartImageUrl(code),
        });
        count++;
      }
    });
    if (count > 0) {
      setBulkPasteText('');
      setShowBulkImportModal(false);
    }
  };

  const discrepancyCount = items.filter((it) => (it.gapQty ?? 0) !== 0).length;
  const hiddenFastCount = items.filter(
    (it) => it.issuesPerMonth >= rules.fastMoverCutoff && it.spot.trim().toLowerCase() !== 'counter'
  ).length;
  const foundStockCount = items.filter((it) => (it.gapQty ?? 0) > 0).length;
  const matchedCount = items.filter((it) => (it.gapQty ?? 0) === 0).length;

  const isEditable = activeRole === 'auditor' || activeRole === 'owner' || activeRole === 'counter_boy';

  return (
    <div className="space-y-3">
      {/* Floating Scanned Row Notification */}
      {scannedNotification && (
        <div className="fixed top-20 right-6 z-40 bg-slate-900 border-2 border-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Barcode className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-mono font-bold text-emerald-300">{scannedNotification.code}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-semibold">{scannedNotification.part}</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Row highlighted — Hand Physical Count input focused!</span>
            </div>
          </div>
          <button
            onClick={() => setScannedNotification(null)}
            className="text-slate-400 hover:text-white text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Control bar: Search, Barcode Gun Scanner, Filter tabs, Legend, Add SKU */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, part, spot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Barcode Scanner Input */}
          <form onSubmit={handleQuickScanSubmit} className="relative min-w-[200px] sm:min-w-[240px]">
            <Barcode className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Scan barcode gun / SKU..."
              value={quickScanInput}
              onChange={(e) => setQuickScanInput(e.target.value)}
              className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg pl-9 pr-14 py-1.5 text-xs text-emerald-300 font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
            >
              Scan
            </button>
          </form>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs overflow-x-auto">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilterMode('discrepancy')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterMode === 'discrepancy'
                  ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800/80'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              Discrepancies ({discrepancyCount})
            </button>
            <button
              onClick={() => setFilterMode('hidden_fast')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterMode === 'hidden_fast'
                  ? 'bg-violet-950 text-violet-300 font-bold border border-violet-800/80'
                  : 'text-slate-400 hover:text-violet-300'
              }`}
            >
              Fast &amp; Hidden ({hiddenFastCount})
            </button>
            <button
              onClick={() => setFilterMode('found_stock')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterMode === 'found_stock'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/80'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              Found Stock ({foundStockCount})
            </button>
            <button
              onClick={() => setFilterMode('matched')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterMode === 'matched'
                  ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/80'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Matched ({matchedCount})
            </button>
            <button
              onClick={() => setFilterMode('low_stock')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                filterMode === 'low_stock'
                  ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800/80 ring-1 ring-rose-500/50'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Low Stock &lt;2 ({items.filter((it) => it.physicalQty < 2).length})</span>
            </button>
          </div>
        </div>

        {/* Legend & Add Action */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          >
            <span>Bulk CSV / Paste</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add SKU Row</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90 shadow-md">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-bold">
              <th className="py-2.5 px-3">#</th>
              {/* Image thumbnail header */}
              <th className="py-2.5 px-2 text-center bg-slate-950 border-r border-slate-800">
                Visual
              </th>
              <th className="py-2.5 px-3 bg-amber-950/20 text-amber-300 border-r border-slate-800">
                Code (Yellow)
              </th>
              <th className="py-2.5 px-3 bg-amber-950/20 text-amber-300 border-r border-slate-800">
                Part Name (Yellow)
              </th>
              <th className="py-2.5 px-3 bg-amber-950/20 text-amber-300 border-r border-slate-800">
                Spot (Yellow)
              </th>
              <th className="py-2.5 px-3 bg-amber-950/20 text-amber-300 border-r border-slate-800 text-right">
                System Qty
              </th>
              <th className="py-2.5 px-3 bg-amber-500/20 text-amber-200 border-r border-slate-800 text-right font-extrabold">
                Hand Physical
              </th>
              <th className="py-2.5 px-3 bg-amber-950/20 text-amber-300 border-r border-slate-800 text-right">
                Cost (₹)
              </th>
              <th className="py-2.5 px-3 bg-amber-950/20 text-amber-300 border-r border-slate-800 text-right">
                Issues / Mo
              </th>
              {/* White Calculated Headers */}
              <th className="py-2.5 px-3 text-right bg-slate-900 border-r border-slate-800 font-bold">
                Gap Qty
              </th>
              <th className="py-2.5 px-3 text-right bg-slate-900 border-r border-slate-800 font-bold">
                Gap Rupees
              </th>
              <th className="py-2.5 px-3 bg-slate-900 border-r border-slate-800 text-center font-bold">
                Speed
              </th>
              <th className="py-2.5 px-3 bg-slate-900 font-bold min-w-[220px]">
                Action Plan
              </th>
              {/* Row Actions Header: Barcode Scanner Trigger */}
              <th className="py-2.5 px-3 bg-slate-900 text-center font-bold border-l border-slate-800 min-w-[110px]">
                Row Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
            {filteredItems.map((item, idx) => {
              const gapQty = item.gapQty ?? 0;
              const gapRupees = item.gapRupees ?? 0;
              const isMismatch = gapQty !== 0;
              const isNegative = gapQty < 0;
              const isPositive = gapQty > 0;
              const isFast = item.speed === 'Fast';
              const isHidden = item.spot.trim().toLowerCase() !== 'counter';
              const itemImg = getPartImageUrl(item.code, item.imageUrl);
              const isRowHighlighted = highlightedRowId === item.id;
              const isLowStock = item.physicalQty < 2;

              return (
                <tr
                  key={item.id}
                  ref={(el) => {
                    rowRefs.current[item.id] = el;
                  }}
                  className={`transition-all duration-300 ${
                    isRowHighlighted
                      ? 'bg-emerald-950/80 ring-2 ring-emerald-400 shadow-xl shadow-emerald-950/60 relative z-10'
                      : isLowStock
                      ? 'bg-rose-950/20 border-l-4 border-l-rose-500 hover:bg-rose-950/30'
                      : isNegative
                      ? 'bg-rose-950/10 hover:bg-slate-800/50'
                      : isPositive
                      ? 'bg-cyan-950/10 hover:bg-slate-800/50'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  {/* Row index */}
                  <td className="py-2 px-3 text-slate-500 font-sans text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {isRowHighlighted && (
                        <Crosshair className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                      )}
                      {isLowStock && !isRowHighlighted && (
                        <span title="Physical stock is below 2 units!">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        </span>
                      )}
                      <span>{idx + 1}</span>
                    </div>
                  </td>

                  {/* Visual Part Image Thumbnail */}
                  <td className="py-1.5 px-2 text-center border-r border-slate-800">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImage({
                          url: itemImg,
                          title: item.part,
                          code: item.code,
                        })
                      }
                      title={`Click to view visual identification for ${item.part}`}
                      className="group relative inline-block rounded-lg overflow-hidden border border-slate-700 hover:border-emerald-400 focus:outline-none transition-all shadow-sm"
                    >
                      <img
                        src={itemImg}
                        alt={item.part}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 object-cover rounded bg-slate-950 transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-3.5 h-3.5 text-white" />
                      </div>
                    </button>
                  </td>

                  {/* Code (Yellow editable cell) */}
                  <td className="py-1.5 px-2 bg-amber-500/5 border-r border-slate-800">
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={item.code}
                      onChange={(e) =>
                        onUpdateItem(item.id, { code: e.target.value }, `Updated SKU code to ${e.target.value}`)
                      }
                      className="w-24 bg-transparent text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-transparent hover:border-amber-500/40 focus:bg-slate-950 focus:border-amber-400 focus:outline-none"
                    />
                  </td>

                  {/* Part Name (Yellow editable cell) */}
                  <td className="py-1.5 px-2 bg-amber-500/5 border-r border-slate-800 font-sans">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                      <input
                        type="text"
                        disabled={!isEditable}
                        value={item.part}
                        onChange={(e) =>
                          onUpdateItem(item.id, { part: e.target.value }, `Renamed SKU to ${e.target.value}`)
                        }
                        className="w-full min-w-[150px] bg-transparent text-slate-100 font-medium px-1.5 py-0.5 rounded border border-transparent hover:border-amber-500/40 focus:bg-slate-950 focus:border-amber-400 focus:outline-none"
                      />
                      {isLowStock && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/90 border border-rose-500/80 text-rose-400 font-sans text-[10px] font-bold shrink-0 shadow-sm animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                          <span className="text-rose-500 font-extrabold uppercase tracking-tight">Low Stock (&lt;2)</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Spot (Yellow editable cell - dropdown) */}
                  <td className="py-1.5 px-2 bg-amber-500/5 border-r border-slate-800 font-sans">
                    <select
                      disabled={!isEditable}
                      value={item.spot}
                      onChange={(e) =>
                        onUpdateItem(
                          item.id,
                          { spot: e.target.value },
                          `Relocated ${item.code} from ${item.spot} to ${e.target.value}`
                        )
                      }
                      className={`text-xs px-2 py-1 rounded font-semibold border cursor-pointer focus:outline-none ${
                        item.spot === 'Counter'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                          : isFast
                          ? 'bg-violet-950/80 text-violet-300 border-violet-700/60 animate-pulse'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {availableSpots.map((spot) => (
                        <option key={spot} value={spot} className="bg-slate-900 text-white">
                          {spot}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* System Qty (Yellow editable cell) */}
                  <td className="py-1.5 px-2 bg-amber-500/5 border-r border-slate-800 text-right">
                    <input
                      type="number"
                      disabled={activeRole === 'counter_boy'}
                      value={item.systemQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        onUpdateItem(item.id, { systemQty: val }, `Updated system qty for ${item.code} to ${val}`);
                      }}
                      className="w-14 text-right bg-transparent text-slate-300 px-1 py-0.5 rounded border border-transparent hover:border-amber-500/40 focus:bg-slate-950 focus:border-amber-400 focus:outline-none"
                    />
                  </td>

                  {/* Hand Physical Count (Key count cell - Auto focused on Scan!) */}
                  <td className={`py-1 px-2 border-r border-slate-800 text-right ${
                    isRowHighlighted 
                      ? 'bg-emerald-500/30' 
                      : isLowStock 
                      ? 'bg-rose-950/40' 
                      : 'bg-amber-500/15'
                  }`}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          const newCount = Math.max(0, item.physicalQty - 1);
                          onUpdateItem(item.id, { physicalQty: newCount }, `Hand count decremented for ${item.code}`);
                        }}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs"
                      >
                        -
                      </button>
                      <input
                        ref={(el) => {
                          countInputRefs.current[item.id] = el;
                        }}
                        type="number"
                        value={item.physicalQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          onUpdateItem(item.id, { physicalQty: val }, `Hand count set to ${val} for ${item.code}`);
                        }}
                        className={`w-12 text-right font-black px-1 py-0.5 rounded border transition-all focus:outline-none ${
                          isRowHighlighted
                            ? 'bg-emerald-400 text-slate-950 border-emerald-300 font-mono text-sm font-extrabold ring-2 ring-emerald-300'
                            : isLowStock
                            ? 'bg-rose-950/70 text-rose-400 border-rose-500 font-mono text-sm font-black ring-1 ring-rose-500/50'
                            : isMismatch
                            ? 'bg-amber-300 text-slate-950 border-amber-400 font-mono text-sm'
                            : 'bg-transparent text-amber-200 border-transparent hover:border-amber-400/50'
                        }`}
                      />
                      <button
                        onClick={() => {
                          const newCount = item.physicalQty + 1;
                          onUpdateItem(item.id, { physicalQty: newCount }, `Hand count incremented for ${item.code}`);
                        }}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    {/* Visual Low Stock Warning Threshold */}
                    {isLowStock && (
                      <div className="flex items-center justify-end gap-1 mt-1 text-rose-500 font-bold font-sans text-[10px] tracking-tight animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="text-rose-500 font-extrabold uppercase tracking-tight">
                          Low Stock (&lt;2)
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Cost (Yellow editable cell) */}
                  <td className="py-1.5 px-2 bg-amber-500/5 border-r border-slate-800 text-right">
                    <div className="flex items-center justify-end">
                      <span className="text-slate-500 text-[10px] mr-0.5">₹</span>
                      <input
                        type="number"
                        disabled={!isEditable}
                        value={item.cost}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          onUpdateItem(item.id, { cost: val }, `Updated cost for ${item.code} to ₹${val}`);
                        }}
                        className="w-16 text-right bg-transparent text-slate-300 px-1 py-0.5 rounded border border-transparent hover:border-amber-500/40 focus:bg-slate-950 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </td>

                  {/* Issues / Month (Speed cell) */}
                  <td className="py-1.5 px-2 bg-amber-500/5 border-r border-slate-800 text-right">
                    <input
                      type="number"
                      disabled={!isEditable}
                      value={item.issuesPerMonth}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        onUpdateItem(item.id, { issuesPerMonth: val }, `Updated issues/mo for ${item.code} to ${val}`);
                      }}
                      className="w-12 text-right bg-transparent text-slate-300 px-1 py-0.5 rounded border border-transparent hover:border-amber-500/40 focus:bg-slate-950 focus:border-amber-400 focus:outline-none"
                    />
                  </td>

                  {/* Calculated White Cells */}
                  {/* Gap Qty */}
                  <td
                    className={`py-2 px-3 text-right font-black border-r border-slate-800 ${
                      isNegative
                        ? 'text-rose-400'
                        : isPositive
                        ? 'text-cyan-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {gapQty === 0 ? '0' : gapQty > 0 ? `+${gapQty}` : gapQty}
                  </td>

                  {/* Gap Rupees */}
                  <td
                    className={`py-2 px-3 text-right font-black border-r border-slate-800 ${
                      isNegative
                        ? 'text-rose-400 font-mono'
                        : isPositive
                        ? 'text-cyan-400 font-mono'
                        : 'text-slate-500'
                    }`}
                  >
                    {gapRupees === 0 ? '₹0' : formatINR(gapRupees)}
                  </td>

                  {/* Speed Badge */}
                  <td className="py-2 px-2 text-center border-r border-slate-800">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isFast
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.speed}
                    </span>
                  </td>

                  {/* Action Plan sentence */}
                  <td className="py-2 px-3 font-sans text-xs">
                    <div className="flex items-center gap-1.5">
                      {isNegative && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                      )}
                      {isPositive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                      )}
                      {gapQty === 0 && isFast && isHidden && (
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0"></span>
                      )}
                      <span className="text-slate-300 leading-tight">
                        {item.action}
                      </span>
                    </div>
                  </td>

                  {/* Row Actions: Barcode Scanner Trigger Button */}
                  <td className="py-1.5 px-2 text-center border-l border-slate-800">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleTriggerRowScanner(item)}
                        title={`Scan part label barcode for ${item.code} (${item.part})`}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all active:scale-95 shadow-sm ${
                          isRowHighlighted
                            ? 'bg-emerald-500 text-slate-950 font-bold ring-2 ring-emerald-300 shadow-emerald-500/20'
                            : 'bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-slate-700 hover:border-emerald-500'
                        }`}
                      >
                        <Barcode className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline font-mono">Scan</span>
                      </button>

                      {/* Auditor Delete */}
                      {activeRole === 'auditor' && (
                        <button
                          onClick={() => onDeleteItem(item.id, item.part)}
                          title="Delete SKU row"
                          className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Row Barcode Scanner Dialog */}
      {activeScanItem && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 text-center relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Barcode className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-white">Scan Part Shelf Label</h3>
                  <p className="text-[11px] text-slate-400">Trigger scanner beam or tap to confirm label</p>
                </div>
              </div>
              <button
                onClick={() => setActiveScanItem(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Part Preview Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3 text-left">
              <img
                src={getPartImageUrl(activeScanItem.code, activeScanItem.imageUrl)}
                alt={activeScanItem.part}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-lg object-cover bg-slate-900 border border-slate-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/80">
                  {activeScanItem.code}
                </span>
                <h4 className="text-sm font-bold text-white truncate mt-1">{activeScanItem.part}</h4>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    Spot: <strong className="text-amber-300">{activeScanItem.spot}</strong>
                  </span>
                  <span>•</span>
                  <span>System: <strong className="text-white">{activeScanItem.systemQty}</strong></span>
                </div>
              </div>
            </div>

            {/* Simulated 1D Barcode Graphic */}
            <div className="bg-white rounded-xl p-4 text-slate-950 border-2 border-slate-300 relative shadow-inner">
              <div className="text-[10px] font-mono tracking-widest text-slate-600 mb-1 font-bold">
                PART PACKAGING BARCODE
              </div>

              {/* Barcode vector lines */}
              <div className="h-16 flex items-center justify-center gap-1 px-4 overflow-hidden relative">
                {/* Laser beam animation */}
                <div className="absolute inset-x-0 h-0.5 bg-rose-500 shadow-lg shadow-rose-500/80 animate-pulse top-1/2 -translate-y-1/2" />

                <div className="w-1 h-full bg-black"></div>
                <div className="w-2 h-full bg-black"></div>
                <div className="w-0.5 h-full bg-black"></div>
                <div className="w-1.5 h-full bg-black"></div>
                <div className="w-3 h-full bg-black"></div>
                <div className="w-1 h-full bg-black"></div>
                <div className="w-0.5 h-full bg-black"></div>
                <div className="w-2 h-full bg-black"></div>
                <div className="w-1 h-full bg-black"></div>
                <div className="w-3 h-full bg-black"></div>
                <div className="w-0.5 h-full bg-black"></div>
                <div className="w-2 h-full bg-black"></div>
                <div className="w-1.5 h-full bg-black"></div>
                <div className="w-1 h-full bg-black"></div>
                <div className="w-2.5 h-full bg-black"></div>
                <div className="w-0.5 h-full bg-black"></div>
                <div className="w-2 h-full bg-black"></div>
                <div className="w-1.5 h-full bg-black"></div>
                <div className="w-3 h-full bg-black"></div>
                <div className="w-1 h-full bg-black"></div>
                <div className="w-0.5 h-full bg-black"></div>
              </div>

              <div className="text-center font-mono font-black text-sm tracking-widest mt-1 text-slate-900">
                *{activeScanItem.code}*
              </div>
            </div>

            {/* Confirmation & Laser Scan Trigger */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleConfirmScan(activeScanItem)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 text-xs"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Simulate Label Scan &amp; Focus Count Row</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveScanItem(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Part Image Zoom / Inspection Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-3 text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-emerald-400">
                {previewImage.code}
              </span>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                referrerPolicy="no-referrer"
                className="w-48 h-48 mx-auto object-contain rounded-lg"
              />
            </div>
            <div className="text-sm font-bold text-white">{previewImage.title}</div>
            <p className="text-xs text-slate-400">
              Visual identification guide for counter boys to confirm item packaging &amp; connector pins before hand counting.
            </p>
            <button
              onClick={() => setPreviewImage(null)}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Add SKU Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add SKU Line to Bin Audit</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EV-BAT-02"
                    value={newSKU.code}
                    onChange={(e) => setNewSKU({ ...newSKU, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Spot Location *</label>
                  <select
                    value={newSKU.spot}
                    onChange={(e) => setNewSKU({ ...newSKU, spot: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {availableSpots.map((spot) => (
                      <option key={spot} value={spot}>
                        {spot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Part Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lithium Cell Pack 12V"
                  value={newSKU.part}
                  onChange={(e) => setNewSKU({ ...newSKU, part: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Optional Image URL field */}
              <div>
                <label className="block text-slate-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Part Image / Visual URL (Optional)</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Auto placeholder if blank</span>
                </label>
                <input
                  type="url"
                  placeholder="https://... or leave blank for auto EV schematic"
                  value={newSKU.imageUrl || ''}
                  onChange={(e) => setNewSKU({ ...newSKU, imageUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Billing Screen Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={newSKU.systemQty}
                    onChange={(e) =>
                      setNewSKU({ ...newSKU, systemQty: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Hand Count Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={newSKU.physicalQty}
                    onChange={(e) =>
                      setNewSKU({ ...newSKU, physicalQty: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold text-amber-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Store Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newSKU.cost}
                    onChange={(e) =>
                      setNewSKU({ ...newSKU, cost: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Issues / Month</label>
                  <input
                    type="number"
                    min="0"
                    value={newSKU.issuesPerMonth}
                    onChange={(e) =>
                      setNewSKU({
                        ...newSKU,
                        issuesPerMonth: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Add to Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV / Paste Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white">Bulk Import Spares (CSV / Excel Paste)</h3>
              <button
                onClick={() => setShowBulkImportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleBulkPasteImport} className="space-y-3 text-xs">
              <p className="text-slate-400 leading-relaxed">
                Paste comma- or tab-separated rows from Tally / Excel in this column order:<br />
                <code className="text-emerald-400 font-mono">Code, Part Name, Spot, System Qty, Hand Qty, Cost, Issues/Mo</code>
              </p>
              <textarea
                rows={6}
                value={bulkPasteText}
                onChange={(e) => setBulkPasteText(e.target.value)}
                placeholder={`SKU-201, Brake Disc Rotor, Back rack, 18, 15, 1450, 14\nSKU-202, Fork Oil Seal Kit, Counter, 40, 40, 320, 22`}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    setBulkPasteText(
                      `SKU-201, Front Brake Disc Rotor, Back rack, 18, 15, 1450, 14\nSKU-202, Telescopic Fork Seal Kit, Counter, 40, 40, 320, 22\nSKU-203, 48V DC-DC Converter Module, Mezzanine, 12, 9, 2800, 11`
                    )
                  }
                  className="text-emerald-400 hover:underline font-mono text-[11px] cursor-pointer"
                >
                  Load 3 Sample Rows
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkImportModal(false)}
                    className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                  >
                    Import SKUs
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
