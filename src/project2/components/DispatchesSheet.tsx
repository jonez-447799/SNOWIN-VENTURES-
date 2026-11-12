import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  HelpCircle,
  FileSpreadsheet,
  MessageSquare,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Award
} from 'lucide-react';
import { DispatchRow, RulesConfig, DelayReason } from '../types/otif';
import { calculateRowStatus, formatDateTime } from '../utils/otifCalculator';

interface DispatchesSheetProps {
  dispatches: DispatchRow[];
  rules: RulesConfig;
  onUpdateDispatch: (id: string, updates: Partial<DispatchRow>) => void;
  onDeleteDispatch: (id: string) => void;
  onAddNewDispatch: () => void;
  onOpenBulkImport?: () => void;
  onOpenCertificate?: (dispatch: DispatchRow) => void;
  initialCustomerFilter?: string;
  initialReasonFilter?: string;
}

export const DispatchesSheet: React.FC<DispatchesSheetProps> = ({
  dispatches,
  rules,
  onUpdateDispatch,
  onDeleteDispatch,
  onAddNewDispatch,
  onOpenBulkImport,
  onOpenCertificate,
  initialCustomerFilter = '',
  initialReasonFilter = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState(initialCustomerFilter);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pass' | 'fail' | 'late' | 'short' | 'late_short'>('all');
  const [reasonFilter, setReasonFilter] = useState(initialReasonFilter);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  // Compute calculated statuses for all rows
  const calculatedRows = useMemo(() => {
    return dispatches.map(r => calculateRowStatus(r, rules));
  }, [dispatches, rules]);

  // Unique customers and reasons for filters
  const customers = useMemo(() => {
    return Array.from(new Set(dispatches.map(d => d.customer)));
  }, [dispatches]);

  const reasons: DelayReason[] = [
    'Material short',
    'QC hold',
    'No vehicle',
    'Labour short',
    'Paperwork',
    'Customer hold',
  ];

  // Filtered rows
  const filteredRows = useMemo(() => {
    return calculatedRows.filter(r => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matches = 
          r.customer.toLowerCase().includes(query) ||
          r.part.toLowerCase().includes(query) ||
          r.po.toLowerCase().includes(query) ||
          r.vehicle.toLowerCase().includes(query) ||
          (r.notes && r.notes.toLowerCase().includes(query));
        if (!matches) return false;
      }

      // Customer
      if (customerFilter && r.customer !== customerFilter) {
        return false;
      }

      // Reason
      if (reasonFilter && r.delayReason !== reasonFilter) {
        return false;
      }

      // Status
      if (statusFilter === 'pass' && !r.otif) return false;
      if (statusFilter === 'fail' && r.otif) return false;
      if (statusFilter === 'late' && r.failType !== 'Late') return false;
      if (statusFilter === 'short' && r.failType !== 'Short') return false;
      if (statusFilter === 'late_short' && r.failType !== 'Late and short') return false;

      return true;
    });
  }, [calculatedRows, searchQuery, customerFilter, reasonFilter, statusFilter]);

  // Stats for the active view
  const passesCount = filteredRows.filter(r => r.otif).length;
  const failsCount = filteredRows.length - passesCount;

  return (
    <div className="space-y-4">
      {/* Legend & Sheet Concept Header */}
      <div className="industrial-card rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Dispatches Master Sheet</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                1 Row = 1 Promise Line
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Source inputs copied from Security Gate Log &amp; Customer PO. Engine SLA formulas calculate automatically.
            </p>
          </div>
        </div>

        {/* Legend & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-900 border border-slate-700 inline-block" />
            <span className="text-slate-300 font-medium font-mono text-[11px]">Source Inputs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-800/80 border border-slate-600 inline-block" />
            <span className="text-slate-300 font-medium font-mono text-[11px]">SLA Verified</span>
          </div>

          {onOpenBulkImport && (
            <button
              onClick={onOpenBulkImport}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow ml-2"
              title="Import daily Excel or CSV file from SAP/Tally"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              <span>Bulk Excel Import</span>
            </button>
          )}
          <button
            onClick={onAddNewDispatch}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dispatch Row</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="industrial-card rounded-2xl border border-white/10 p-4 space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          {/* Search box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search part, PO, customer, vehicle plate..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Customer filter */}
          <select
            value={customerFilter}
            onChange={e => setCustomerFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Customers ({dispatches.length})</option>
            {customers.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Reason filter */}
          <select
            value={reasonFilter}
            onChange={e => setReasonFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Delay Causes</option>
            {reasons.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Reset filters */}
          {(searchQuery || customerFilter || reasonFilter || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCustomerFilter('');
                setReasonFilter('');
                setStatusFilter('all');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Quick filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Quick Views:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Rows ({calculatedRows.length})
          </button>
          <button
            onClick={() => setStatusFilter('pass')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition ${
              statusFilter === 'pass'
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'bg-slate-900/60 text-slate-400 hover:text-emerald-400 border border-slate-800'
            }`}
          >
            Passes ({calculatedRows.filter(r => r.otif).length})
          </button>
          <button
            onClick={() => setStatusFilter('fail')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition ${
              statusFilter === 'fail'
                ? 'bg-rose-950/40 text-rose-300 border border-rose-500/40 font-semibold'
                : 'bg-slate-900/60 text-slate-400 hover:text-rose-400 border border-slate-800'
            }`}
          >
            Fails ({calculatedRows.filter(r => !r.otif).length})
          </button>
          <button
            onClick={() => setStatusFilter('short')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition ${
              statusFilter === 'short'
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-slate-800 text-purple-300 hover:bg-slate-700'
            }`}
          >
            Short Only ({calculatedRows.filter(r => r.failType === 'Short').length})
          </button>
          <button
            onClick={() => setStatusFilter('late')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition ${
              statusFilter === 'late'
                ? 'bg-orange-600 text-white font-bold'
                : 'bg-slate-800 text-orange-300 hover:bg-slate-700'
            }`}
          >
            Late Only ({calculatedRows.filter(r => r.failType === 'Late').length})
          </button>
          <button
            onClick={() => setStatusFilter('late_short')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition ${
              statusFilter === 'late_short'
                ? 'bg-red-700 text-white font-bold'
                : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
            }`}
          >
            Late &amp; Short ({calculatedRows.filter(r => r.failType === 'Late and short').length})
          </button>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="industrial-card rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left text-xs border-collapse font-sans whitespace-nowrap">
            {/* Table Header: Grouped by Source Inputs vs Engine SLA Verifications */}
            <thead className="sticky top-0 z-20 shadow-md">
              <tr className="bg-slate-950 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-800 font-mono">
                <th colSpan={9} className="py-1.5 px-3 bg-slate-900/90 text-slate-300 border-r border-slate-800 text-center">
                  Source Inputs: Gate Register Notebook &amp; Customer PO
                </th>
                <th colSpan={4} className="py-1.5 px-3 bg-slate-850 text-slate-200 text-center">
                  Engine SLA Formulas (Outputs)
                </th>
                <th className="py-1.5 px-3 bg-slate-950 text-slate-400 text-center">Actions</th>
              </tr>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-mono text-[11px]">
                <th className="py-2.5 px-3 text-slate-500 text-center">#</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">PO Ref</th>
                <th className="py-2.5 px-3">Part Description</th>
                <th className="py-2.5 px-3 text-right">Ordered Qty</th>
                <th className="py-2.5 px-3 text-right text-slate-200 font-bold border-l border-r border-slate-800 bg-slate-850/60">
                  Shipped Qty ✎
                </th>
                <th className="py-2.5 px-3">Promised Date/Time</th>
                <th className="py-2.5 px-3 text-slate-200 font-bold border-l border-r border-slate-800 bg-slate-850/60">
                  Actual Gate Out ✎
                </th>
                <th className="py-2.5 px-3 border-r border-slate-800">Vehicle Plate</th>
                <th className="py-2.5 px-3 border-r border-slate-750">Delay Reason</th>
                
                {/* Calculated White Cells */}
                <th className="py-2.5 px-3 bg-slate-850/40 text-center">On Time?</th>
                <th className="py-2.5 px-3 bg-slate-850/40 text-center">In Full?</th>
                <th className="py-2.5 px-3 bg-slate-850/60 text-center font-bold">OTIF Result</th>
                <th className="py-2.5 px-3 bg-slate-850/40 text-center">Fail Type</th>
                <th className="py-2.5 px-3 bg-slate-900 text-center">Edit</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/70 text-slate-200">
              {filteredRows.map((row, idx) => {
                const isSpecialDrill1 = row.part.toLowerCase().includes('flange 80nb');
                const isSpecialDrill2 = row.part.toLowerCase().includes('base frame');
                const isLateAndShort = row.failType === 'Late and short';
                const isEditing = editingRowId === row.id;

                return (
                  <tr 
                    key={row.id}
                    className={`transition group ${
                      isSpecialDrill1 || isSpecialDrill2 
                        ? 'bg-amber-500/5 hover:bg-amber-500/10' 
                        : isLateAndShort
                        ? 'bg-rose-950/20 hover:bg-rose-950/30'
                        : row.otif
                        ? 'hover:bg-slate-800/40'
                        : 'bg-rose-950/10 hover:bg-rose-950/20'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-center">
                      {idx + 1}
                    </td>

                    {/* Customer */}
                    <td className="py-2.5 px-3 font-medium text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span>{row.customer}</span>
                        {row.customer === 'Hyundai vendor park' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" title="Weakest account in fortnight" />
                        )}
                      </div>
                    </td>

                    {/* PO */}
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      <div className="flex items-center gap-1">
                        <span>{row.po}</span>
                        {row.isWhatsAppOrder && (
                          <span className="px-1 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-sans" title="WhatsApp commitment">
                            WA
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Part */}
                    <td className="py-2.5 px-3 font-medium text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span>{row.part}</span>
                        {(isSpecialDrill1 || isSpecialDrill2) && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Drill Target
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Ordered Qty */}
                    <td className="py-2.5 px-3 font-mono text-right text-slate-300">
                      {row.orderedQty}
                    </td>

                    {/* Shipped Qty (Editable) */}
                    <td className="py-2.5 px-3 font-mono text-right bg-amber-500/5 border-l border-r border-amber-500/20">
                      <input
                        type="number"
                        min="0"
                        value={row.shippedQty}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          onUpdateDispatch(row.id, { shippedQty: val });
                        }}
                        className={`w-16 text-right px-1.5 py-0.5 rounded font-mono font-bold text-xs bg-slate-950 border transition ${
                          row.shippedQty < row.orderedQty
                            ? 'text-rose-400 border-rose-500/40 bg-rose-950/20'
                            : 'text-amber-200 border-slate-700 focus:border-amber-400'
                        }`}
                        title="Click to edit shipped quantity"
                      />
                    </td>

                    {/* Promised Date */}
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {formatDateTime(row.promisedDate)}
                    </td>

                    {/* Actual Gate Out (Editable) */}
                    <td className="py-2.5 px-3 font-mono bg-amber-500/5 border-l border-r border-amber-500/20">
                      <input
                        type="datetime-local"
                        value={row.actualOut}
                        onChange={e => {
                          if (e.target.value) {
                            onUpdateDispatch(row.id, { actualOut: e.target.value });
                          }
                        }}
                        className="bg-slate-950 text-slate-200 border border-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono focus:border-amber-400"
                        title="Security gate register out timestamp"
                      />
                    </td>

                    {/* Vehicle */}
                    <td className="py-2.5 px-3 font-mono text-slate-300 border-r border-amber-500/20">
                      {row.vehicle}
                    </td>

                    {/* Delay Reason */}
                    <td className="py-2.5 px-3 border-r border-slate-700">
                      {row.otif ? (
                        <span className="text-slate-600 font-mono text-[11px]">—</span>
                      ) : (
                        <select
                          value={row.delayReason}
                          onChange={e => {
                            onUpdateDispatch(row.id, { delayReason: e.target.value as DelayReason });
                          }}
                          className={`bg-slate-950 border px-1.5 py-0.5 rounded text-xs focus:outline-none ${
                            row.delayReason === 'Material short'
                              ? 'text-amber-300 border-amber-500/40'
                              : 'text-slate-300 border-slate-700'
                          }`}
                        >
                          <option value="">Select reason...</option>
                          {reasons.map(r => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Calculated: On Time? */}
                    <td className="py-2.5 px-3 text-center bg-slate-950/40">
                      {row.onTime ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold font-mono">
                          <CheckCircle className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-bold font-mono">
                          <XCircle className="w-3.5 h-3.5" /> No
                        </span>
                      )}
                    </td>

                    {/* Calculated: In Full? */}
                    <td className="py-2.5 px-3 text-center bg-slate-950/40">
                      {row.inFull ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold font-mono">
                          <CheckCircle className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-bold font-mono">
                          <XCircle className="w-3.5 h-3.5" /> No
                        </span>
                      )}
                    </td>

                    {/* Calculated: OTIF */}
                    <td className="py-2.5 px-3 text-center bg-slate-950/60">
                      {row.otif ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Pass
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Fail
                        </span>
                      )}
                    </td>

                    {/* Calculated: Fail Type */}
                    <td className="py-2.5 px-3 text-center bg-slate-950/40 font-mono text-[11px]">
                      {row.failType === 'Late and short' ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-950/50 text-rose-200 border border-rose-500/50 font-bold">
                          Late &amp; Short
                        </span>
                      ) : row.failType === 'Short' ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/40 font-medium">
                          Short Qty
                        </span>
                      ) : row.failType === 'Late' ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-500/30 font-medium">
                          Late Gate-Out
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onOpenCertificate && (
                          <button
                            onClick={() => onOpenCertificate(row)}
                            className="p-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition cursor-pointer"
                            title="Generate Official OEM Dispatch SLA Certificate"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteDispatch(row.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title="Delete line"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-500">
                    No dispatch lines match current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-4 font-mono">
            <span>Showing: <strong className="text-white">{filteredRows.length}</strong> lines</span>
            <span>•</span>
            <span>Passes: <strong className="text-emerald-400">{passesCount}</strong></span>
            <span>•</span>
            <span>Fails: <strong className="text-rose-400">{failsCount}</strong></span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span className="italic text-[11px]">
              "If the register has only a date and no clock time, use end of that day, 18:00, and write that you did so."
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
