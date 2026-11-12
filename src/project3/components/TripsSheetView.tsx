import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { CalculatedTrip, Trip, RulesConfig } from '../types/freight';
import { formatINR, formatTonneRate } from '../utils/auditCalculations';

interface TripsSheetViewProps {
  trips: CalculatedTrip[];
  rules: RulesConfig;
  onUpdateTrip: (trip: Trip) => void;
  onDeleteTrip: (id: string) => void;
  onOpenAddTrip: () => void;
  onResetData: () => void;
  onExportCSV: () => void;
  initialLaneFilter?: string;
  initialTransporterFilter?: string;
}

export const TripsSheetView: React.FC<TripsSheetViewProps> = ({
  trips,
  rules,
  onUpdateTrip,
  onDeleteTrip,
  onOpenAddTrip,
  onResetData,
  onExportCSV,
  initialLaneFilter = 'ALL',
  initialTransporterFilter = 'ALL'
}) => {
  const [laneFilter, setLaneFilter] = useState<string>(initialLaneFilter);
  const [transporterFilter, setTransporterFilter] = useState<string>(initialTransporterFilter);
  const [splitFilter, setSplitFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Inline editing state: tripId -> field -> value
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Trip>>({});

  // Filtered trips
  const filteredTrips = trips.filter(t => {
    if (laneFilter !== 'ALL' && t.lane !== laneFilter) return false;
    if (transporterFilter !== 'ALL' && t.transporter !== transporterFilter) return false;
    if (splitFilter !== 'ALL' && t.split !== splitFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = t.lane.toLowerCase().includes(q) ||
                    t.transporter.toLowerCase().includes(q) ||
                    t.id.toLowerCase().includes(q) ||
                    (t.notes && t.notes.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Calculate totals for currently filtered set
  const filteredBill = filteredTrips.reduce((s, t) => s + t.bill, 0);
  const filteredWeight = filteredTrips.reduce((s, t) => s + t.weightKg, 0);
  const filteredWait = filteredTrips.reduce((s, t) => s + t.waitHours, 0);
  const filteredRateLeak = filteredTrips.reduce((s, t) => s + t.rateLeak, 0);
  const filteredDetention = filteredTrips.reduce((s, t) => s + t.detention, 0);
  const filteredTotalLeak = filteredTrips.reduce((s, t) => s + t.totalLeak, 0);

  const startEdit = (t: CalculatedTrip) => {
    setEditingTripId(t.id);
    setEditForm({ ...t });
  };

  const cancelEdit = () => {
    setEditingTripId(null);
    setEditForm({});
  };

  const saveEdit = (original: CalculatedTrip) => {
    const updated: Trip = {
      ...original,
      ...editForm,
      weightKg: Number(editForm.weightKg ?? original.weightKg),
      bill: Number(editForm.bill ?? original.bill),
      waitHours: Number(editForm.waitHours ?? original.waitHours)
    };
    onUpdateTrip(updated);
    setEditingTripId(null);
    setEditForm({});
  };

  // Distinct options
  const uniqueLanes = Array.from(new Set(trips.map(t => t.lane)));
  const uniqueTransporters = Array.from(new Set(trips.map(t => t.transporter)));

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Top Banner & Guide */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Trips & Gate Notebook Sheet</h1>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              The file is the product
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-amber-100 border border-amber-300 rounded-xs inline-block"></span>
              <span><strong>Yellow cells:</strong> Copied from lorry bill & gate notebook</span>
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-white border border-slate-300 rounded-xs inline-block"></span>
              <span><strong>White cells:</strong> Calculated rate/leak math</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddTrip}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Bill</span>
          </button>
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Lane filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Lane:</span>
            <select
              value={laneFilter}
              onChange={(e) => setLaneFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
            >
              <option value="ALL">All Lanes ({uniqueLanes.length})</option>
              {uniqueLanes.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Transporter filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Transporter:</span>
            <select
              value={transporterFilter}
              onChange={(e) => setTransporterFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
            >
              <option value="ALL">All Transporters ({uniqueTransporters.length})</option>
              {uniqueTransporters.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Split filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Split Load:</span>
            <select
              value={splitFilter}
              onChange={(e) => setSplitFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
            >
              <option value="ALL">All (Clean & Split)</option>
              <option value="No">Clean Loads Only</option>
              <option value="Yes">Split Loads (2 Drops)</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search lane, driver, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-semibold tracking-tight">
                <th className="py-2.5 px-3 text-center w-12 font-mono">#</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Lane</th>
                <th className="py-2.5 px-2 text-right">Km</th>
                <th className="py-2.5 px-3">Transporter</th>
                {/* Yellow Inputs */}
                <th className="py-2.5 px-3 text-right bg-amber-100/70 border-x border-amber-200 text-amber-900">
                  Weight (kg)
                </th>
                <th className="py-2.5 px-3 text-right bg-amber-100/70 border-r border-amber-200 text-amber-900">
                  Bill (₹)
                </th>
                <th className="py-2.5 px-2 text-right bg-amber-100/70 border-r border-amber-200 text-amber-900">
                  Wait (h)
                </th>
                <th className="py-2.5 px-2 text-center bg-amber-100/70 border-r border-amber-200 text-amber-900">
                  Empty Return
                </th>
                <th className="py-2.5 px-2 text-center bg-amber-100/70 border-r border-amber-200 text-amber-900">
                  Split
                </th>
                {/* Calculated White Cells */}
                <th className="py-2.5 px-3 text-right font-mono">₹ / Tonne</th>
                <th className="py-2.5 px-3 text-right font-mono">Best ₹/t</th>
                <th className="py-2.5 px-3 text-right font-mono text-amber-800">Rate Leak</th>
                <th className="py-2.5 px-3 text-right font-mono text-rose-800">Detention</th>
                <th className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50">Total Leak</th>
                <th className="py-2.5 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredTrips.map((trip, idx) => {
                const isEditing = editingTripId === trip.id;
                const isRowBenchmark = trip.isBenchmark;
                const isSplit = trip.split === 'Yes';
                const hasLeak = trip.rateLeak > 0;

                return (
                  <tr 
                    key={trip.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isRowBenchmark ? 'bg-emerald-50/20' : isSplit ? 'bg-slate-50/40 text-slate-500' : ''
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2 px-3 text-center font-mono text-slate-400 text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Date */}
                    <td className="py-2 px-3 font-mono whitespace-nowrap text-slate-800">
                      {trip.date}
                    </td>

                    {/* Lane */}
                    <td className="py-2 px-3 font-medium text-slate-900 whitespace-nowrap">
                      {trip.lane}
                    </td>

                    {/* Km */}
                    <td className="py-2 px-2 text-right font-mono text-slate-500">
                      {trip.km}
                    </td>

                    {/* Transporter */}
                    <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {trip.transporter}
                      {trip.transporter === 'Murugan' && (
                        <span className="ml-1.5 text-[10px] text-emerald-700 font-normal">(Cheap day)</span>
                      )}
                    </td>

                    {/* Yellow: Weight */}
                    <td className="py-2 px-3 text-right font-mono bg-amber-50/60 border-x border-amber-100">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.weightKg ?? trip.weightKg}
                          onChange={(e) => setEditForm(prev => ({ ...prev, weightKg: Number(e.target.value) }))}
                          className="w-16 px-1.5 py-0.5 text-right font-mono bg-white border border-amber-400 rounded text-xs"
                        />
                      ) : (
                        <span>{trip.weightKg.toLocaleString()}</span>
                      )}
                    </td>

                    {/* Yellow: Bill */}
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 bg-amber-50/60 border-r border-amber-100">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.bill ?? trip.bill}
                          onChange={(e) => setEditForm(prev => ({ ...prev, bill: Number(e.target.value) }))}
                          className="w-20 px-1.5 py-0.5 text-right font-mono font-bold bg-white border border-amber-400 rounded text-xs"
                        />
                      ) : (
                        <span>₹{trip.bill.toLocaleString()}</span>
                      )}
                    </td>

                    {/* Yellow: Wait Hours */}
                    <td className="py-2 px-2 text-right font-mono bg-amber-50/60 border-r border-amber-100">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.5"
                          value={editForm.waitHours ?? trip.waitHours}
                          onChange={(e) => setEditForm(prev => ({ ...prev, waitHours: Number(e.target.value) }))}
                          className="w-14 px-1.5 py-0.5 text-right font-mono bg-white border border-amber-400 rounded text-xs"
                        />
                      ) : (
                        <span className={trip.waitHours >= 3.0 ? 'text-rose-700 font-bold' : ''}>
                          {trip.waitHours}h
                        </span>
                      )}
                    </td>

                    {/* Yellow: Empty Return */}
                    <td className="py-2 px-2 text-center bg-amber-50/60 border-r border-amber-100">
                      {isEditing ? (
                        <select
                          value={editForm.emptyReturn ?? trip.emptyReturn}
                          onChange={(e) => setEditForm(prev => ({ ...prev, emptyReturn: e.target.value as 'Yes' | 'No' }))}
                          className="text-[11px] bg-white border border-amber-400 rounded px-1"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      ) : (
                        <span className={trip.emptyReturn === 'Yes' ? 'text-amber-800' : 'text-slate-500'}>
                          {trip.emptyReturn}
                        </span>
                      )}
                    </td>

                    {/* Yellow: Split */}
                    <td className="py-2 px-2 text-center bg-amber-50/60 border-r border-amber-100">
                      {isEditing ? (
                        <select
                          value={editForm.split ?? trip.split}
                          onChange={(e) => setEditForm(prev => ({ ...prev, split: e.target.value as 'Yes' | 'No' }))}
                          className="text-[11px] bg-white border border-amber-400 rounded px-1"
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      ) : (
                        <span className={trip.split === 'Yes' ? 'text-slate-700 font-semibold' : 'text-slate-400'}>
                          {trip.split}
                        </span>
                      )}
                    </td>

                    {/* White: Rate / Tonne */}
                    <td className="py-2 px-3 text-right font-mono">
                      ₹{Math.round(trip.ratePerTonne).toLocaleString()}
                    </td>

                    {/* White: Best Rate / Tonne */}
                    <td className="py-2 px-3 text-right font-mono text-slate-500">
                      ₹{Math.round(trip.bestRate).toLocaleString()}
                    </td>

                    {/* White: Rate Leak */}
                    <td className="py-2 px-3 text-right font-mono">
                      {isSplit ? (
                        <span className="text-slate-400 italic">Excluded</span>
                      ) : trip.rateLeak > 0 ? (
                        <span className="font-bold text-amber-800">₹{trip.rateLeak.toLocaleString()}</span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">₹0 (Best)</span>
                      )}
                    </td>

                    {/* White: Detention */}
                    <td className="py-2 px-3 text-right font-mono">
                      {trip.detention > 0 ? (
                        <span className="text-rose-700 font-medium">₹{trip.detention.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>

                    {/* White: Total Leak */}
                    <td className="py-2 px-3 text-right font-mono font-bold bg-slate-50/80">
                      {trip.totalLeak > 0 ? (
                        <span className="text-slate-900">₹{trip.totalLeak.toLocaleString()}</span>
                      ) : (
                        <span className="text-emerald-700">₹0</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => saveEdit(trip)}
                            className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                            title="Save changes"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded text-[10px]"
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEdit(trip)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                            title="Edit yellow cells"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTrip(trip.id)}
                            className="p-1 text-slate-300 hover:text-rose-600 rounded hover:bg-rose-50"
                            title="Delete bill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Footer Totals */}
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-900 font-mono">
                <td colSpan={5} className="py-3 px-3 text-left">
                  Summary Totals ({filteredTrips.length} bills shown)
                </td>
                <td className="py-3 px-3 text-right">
                  {filteredWeight.toLocaleString()} kg
                </td>
                <td className="py-3 px-3 text-right text-base text-slate-900 bg-amber-100/50">
                  {formatINR(filteredBill)}
                </td>
                <td className="py-3 px-2 text-right">
                  {filteredWait} hrs
                </td>
                <td colSpan={4} className="py-3 px-3 text-right text-amber-900">
                  Total Rate Leak: {formatINR(filteredRateLeak)}
                </td>
                <td className="py-3 px-3 text-right text-rose-900">
                  {formatINR(filteredDetention)}
                </td>
                <td className="py-3 px-3 text-right text-base bg-amber-300/40 text-slate-900">
                  {formatINR(filteredTotalLeak)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Explanatory notes below table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <strong className="text-slate-900 block mb-1">Why ₹ per tonne?</strong>
          Freight rate is compared per tonne (1,000 kg). A 2,500 kg load is 2.5 tonnes. Never compare lump-sum bills across different weight batches.
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <strong className="text-slate-900 block mb-1">Split Loads Excluded</strong>
          A split has two separate drop points. The rate structure is mixed, so it cannot be called clean or expensive. It is excluded from setting or receiving a leak benchmark.
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <strong className="text-slate-900 block mb-1">Empty Return Meaning</strong>
          Empty return means you paid for the lorry both ways but only loaded goods on one leg. It explains why a rate was high, but does not forgive the waste.
        </div>
      </div>
    </div>
  );
};
