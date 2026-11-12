import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  Truck, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Trip, RulesConfig } from '../types/freight';
import { formatINR } from '../utils/auditCalculations';

interface BatchReconcilerViewProps {
  onAddTrip: (trip: Trip) => void;
  rules: RulesConfig;
  onNavigateToTrips: () => void;
  existingLanes: string[];
  existingTransporters: string[];
}

interface DraftRow {
  id: string;
  date: string;
  gateIn: string;
  gateOut: string;
  transporter: string;
  lane: string;
  km: number;
  weightKg: number;
  bill: number;
  split: 'Yes' | 'No';
  emptyReturn: 'Yes' | 'No';
  lrNumber: string;
}

const SAMPLE_BATCH_ROWS: DraftRow[] = [
  {
    id: 'DRAFT-1',
    date: '2026-10-02',
    gateIn: '08:30',
    gateOut: '09:00',
    transporter: 'Murugan',
    lane: 'Ambattur to Oragadam',
    km: 42,
    weightKg: 2900,
    bill: 4305,
    split: 'No',
    emptyReturn: 'Yes',
    lrNumber: 'LR-MUR-9901'
  },
  {
    id: 'DRAFT-2',
    date: '2026-10-03',
    gateIn: '10:00',
    gateOut: '14:30',
    transporter: 'Siva Transport',
    lane: 'Ambattur to Oragadam',
    km: 42,
    weightKg: 3100,
    bill: 6300,
    split: 'No',
    emptyReturn: 'Yes',
    lrNumber: 'LR-SIV-2041'
  },
  {
    id: 'DRAFT-3',
    date: '2026-10-05',
    gateIn: '09:15',
    gateOut: '10:15',
    transporter: 'Murugan',
    lane: 'Ambattur to Sriperumbudur',
    km: 35,
    weightKg: 2600,
    bill: 3090,
    split: 'No',
    emptyReturn: 'Yes',
    lrNumber: 'LR-MUR-9915'
  },
  {
    id: 'DRAFT-4',
    date: '2026-10-07',
    gateIn: '11:00',
    gateOut: '15:00',
    transporter: 'Siva Transport',
    lane: 'Ambattur to Sriperumbudur',
    km: 35,
    weightKg: 3400,
    bill: 7956,
    split: 'No',
    emptyReturn: 'Yes',
    lrNumber: 'LR-SIV-2055'
  }
];

export const BatchReconcilerView: React.FC<BatchReconcilerViewProps> = ({
  onAddTrip,
  rules,
  onNavigateToTrips,
  existingLanes,
  existingTransporters
}) => {
  const [rows, setRows] = useState<DraftRow[]>(SAMPLE_BATCH_ROWS);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper to compute hours from time strings
  const calculateWaitHours = (gateIn: string, gateOut: string): number => {
    if (!gateIn || !gateOut) return 0.5;
    const [h1, m1] = gateIn.split(':').map(Number);
    const [h2, m2] = gateOut.split(':').map(Number);
    if (isNaN(h1) || isNaN(h2)) return 0.5;
    let diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // overnight
    return Math.max(0, Math.round((diffMinutes / 60) * 10) / 10);
  };

  const handleUpdateRow = (id: string, field: keyof DraftRow, value: any) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleAddRow = () => {
    const newRow: DraftRow = {
      id: `DRAFT-${Date.now().toString().slice(-4)}`,
      date: '2026-10-08',
      gateIn: '09:00',
      gateOut: '10:00',
      transporter: existingTransporters[0] || 'Murugan',
      lane: existingLanes[0] || 'Ambattur to Oragadam',
      km: 42,
      weightKg: 2500,
      bill: 4000,
      split: 'No',
      emptyReturn: 'Yes',
      lrNumber: `LR-${Date.now().toString().slice(-4)}`
    };
    setRows(prev => [...prev, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleCommitAll = () => {
    if (rows.length === 0) return;

    rows.forEach(r => {
      const waitHours = calculateWaitHours(r.gateIn, r.gateOut);
      const trip: Trip = {
        id: `TRIP-BATCH-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`,
        date: r.date,
        lane: r.lane,
        km: r.km,
        transporter: r.transporter,
        weightKg: Number(r.weightKg) || 1000,
        bill: Number(r.bill) || 2000,
        waitHours: waitHours,
        split: r.split,
        emptyReturn: r.emptyReturn,
        notes: `Reconciled from gate book (In: ${r.gateIn}, Out: ${r.gateOut}) & ${r.lrNumber}`,
        sourceDoc: r.lrNumber
      };
      onAddTrip(trip);
    });

    setSuccessMessage(`Successfully committed ${rows.length} verified trips into the audit ledger!`);
    setRows([]);
    setTimeout(() => {
      setSuccessMessage(null);
      onNavigateToTrips();
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                Operational Friction Buster
              </span>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Hurdle #1: Paper Bills & Greasy Gate Registers
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Fast Gate Register & Paper LR Batch Ingestion
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Don’t force factory dispatch clerks to navigate slow forms. Type gate register timestamps and paper lorry receipt (LR) values into this rapid-entry grid. 
              Waiting hours and rate per tonne are calculated instantly.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setRows(SAMPLE_BATCH_ROWS)}
              className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sample Batch</span>
            </button>
            <button
              onClick={handleAddRow}
              className="px-3 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Row</span>
            </button>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Rapid Ingest Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">LR Number</th>
                <th className="py-3 px-3">Transporter</th>
                <th className="py-3 px-3">Lane</th>
                <th className="py-3 px-3">Gate In</th>
                <th className="py-3 px-3">Gate Out</th>
                <th className="py-3 px-3">Wait (Hrs)</th>
                <th className="py-3 px-3">Weight (kg)</th>
                <th className="py-3 px-3">Bill (₹)</th>
                <th className="py-3 px-3">₹ / Tonne</th>
                <th className="py-3 px-3">Split?</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {rows.map((row) => {
                const waitHrs = calculateWaitHours(row.gateIn, row.gateOut);
                const tonnes = (row.weightKg || 0) / 1000;
                const ratePerTonne = tonnes > 0 ? Math.round(row.bill / tonnes) : 0;

                return (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => handleUpdateRow(row.id, 'date', e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded bg-white w-28"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={row.lrNumber}
                        onChange={(e) => handleUpdateRow(row.id, 'lrNumber', e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded bg-white w-24 font-mono"
                        placeholder="LR-0000"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={row.transporter}
                        onChange={(e) => handleUpdateRow(row.id, 'transporter', e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded bg-white w-32 font-sans font-medium"
                      >
                        <option value="Murugan">Murugan</option>
                        <option value="Siva Transport">Siva Transport</option>
                        <option value="Ravi (Broker)">Ravi (Broker)</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={row.lane}
                        onChange={(e) => handleUpdateRow(row.id, 'lane', e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded bg-white w-44 font-sans font-medium"
                      >
                        <option value="Ambattur to Oragadam">Ambattur to Oragadam</option>
                        <option value="Ambattur to Sriperumbudur">Ambattur to Sriperumbudur</option>
                        <option value="Ambattur to Maraimalai Nagar">Ambattur to Maraimalai Nagar</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="time"
                        value={row.gateIn}
                        onChange={(e) => handleUpdateRow(row.id, 'gateIn', e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded bg-white w-20"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="time"
                        value={row.gateOut}
                        onChange={(e) => handleUpdateRow(row.id, 'gateOut', e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded bg-white w-20"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-bold">
                      <span className={waitHrs > 2.0 ? 'text-rose-600 font-extrabold' : 'text-slate-700'}>
                        {waitHrs.toFixed(1)}h
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        value={row.weightKg}
                        onChange={(e) => handleUpdateRow(row.id, 'weightKg', Number(e.target.value))}
                        className="px-2 py-1 text-xs border border-slate-200 rounded bg-white w-20"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        value={row.bill}
                        onChange={(e) => handleUpdateRow(row.id, 'bill', Number(e.target.value))}
                        className="px-2 py-1 text-xs border border-slate-200 rounded bg-white w-20"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900">
                        ₹{ratePerTonne.toLocaleString('en-IN')}/t
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={row.split}
                        onChange={(e) => handleUpdateRow(row.id, 'split', e.target.value as any)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded bg-white w-16 font-sans"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 text-xs font-sans">
                    No draft rows in queue. Click "Add Row" or "Reset Sample Batch" to begin typing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Commit Button */}
        {rows.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-600">
              <strong>{rows.length} paper records</strong> queued. Gate in/out times auto-compute detention at ₹{rules.detentionRatePerHour}/hr.
            </span>

            <button
              onClick={handleCommitAll}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Commit Batch to Live Audit Ledger</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
