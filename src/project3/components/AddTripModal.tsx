import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { Trip } from '../types/freight';
import { LANE_CONFIG } from '../data/defaultData';

interface AddTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrip: (trip: Trip) => void;
  existingLanes: string[];
  existingTransporters: string[];
}

export const AddTripModal: React.FC<AddTripModalProps> = ({
  isOpen,
  onClose,
  onAddTrip,
  existingLanes,
  existingTransporters
}) => {
  const [date, setDate] = useState('2026-09-30');
  const [lane, setLane] = useState('Ambattur to Oragadam');
  const [customLane, setCustomLane] = useState('');
  const [transporter, setTransporter] = useState('Murugan');
  const [customTransporter, setCustomTransporter] = useState('');
  const [weightKg, setWeightKg] = useState(2800);
  const [bill, setBill] = useState(4200);
  const [waitHours, setWaitHours] = useState(1.0);
  const [split, setSplit] = useState<'Yes' | 'No'>('No');
  const [emptyReturn, setEmptyReturn] = useState<'Yes' | 'No'>('Yes');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLane = lane === 'CUSTOM' ? customLane.trim() : lane;
    const finalTransporter = transporter === 'CUSTOM' ? customTransporter.trim() : transporter;

    if (!finalLane || !finalTransporter || weightKg <= 0 || bill <= 0) {
      alert('Please fill out all required trip fields with valid numbers.');
      return;
    }

    const km = LANE_CONFIG[finalLane as keyof typeof LANE_CONFIG]?.km || 40;

    const newTrip: Trip = {
      id: `TRIP-${Date.now().toString().slice(-4)}`,
      date,
      lane: finalLane,
      km,
      transporter: finalTransporter,
      weightKg: Number(weightKg),
      bill: Number(bill),
      waitHours: Number(waitHours),
      split,
      emptyReturn,
      notes: notes.trim() || undefined
    };

    onAddTrip(newTrip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">Add Lorry Bill & Gate Record</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter yellow bill values and gate notebook idle hours</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Row 1: Date & Transporter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Departure Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-amber-50/50 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Transporter / Broker</label>
              <select
                value={transporter}
                onChange={(e) => setTransporter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-amber-50/50 border border-amber-300 rounded-lg font-medium"
              >
                {existingTransporters.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
                <option value="CUSTOM">+ New Transporter</option>
              </select>
              {transporter === 'CUSTOM' && (
                <input
                  type="text"
                  placeholder="Carrier name"
                  value={customTransporter}
                  onChange={(e) => setCustomTransporter(e.target.value)}
                  className="mt-1.5 w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  required
                />
              )}
            </div>
          </div>

          {/* Row 2: Lane */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Lane (Keep exact naming consistent)
            </label>
            <select
              value={lane}
              onChange={(e) => setLane(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-amber-50/50 border border-amber-300 rounded-lg font-medium"
            >
              {existingLanes.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
              <option value="CUSTOM">+ New Lane</option>
            </select>
            {lane === 'CUSTOM' && (
              <input
                type="text"
                placeholder="e.g., Ambattur to Gummidipoondi"
                value={customLane}
                onChange={(e) => setCustomLane(e.target.value)}
                className="mt-1.5 w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                required
              />
            )}
          </div>

          {/* Row 3: Weight & Bill Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Weight (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="50"
                  step="10"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono bg-amber-50/50 border border-amber-300 rounded-lg"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 font-mono">kg</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Clean rate cutoff: ≥500 kg</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Lorry Bill Paid (₹)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-mono text-slate-500">₹</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={bill}
                  onChange={(e) => setBill(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-amber-50/50 border border-amber-300 rounded-lg"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Actual bill from bank account</p>
            </div>
          </div>

          {/* Row 4: Gate Wait & Drop Configuration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Gate Wait (hrs)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                required
                value={waitHours}
                onChange={(e) => setWaitHours(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono bg-amber-50/50 border border-amber-300 rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Split Load?</label>
              <select
                value={split}
                onChange={(e) => setSplit(e.target.value as 'Yes' | 'No')}
                className="w-full px-3 py-2 text-xs bg-amber-50/50 border border-amber-300 rounded-lg font-medium"
              >
                <option value="No">No (Single Drop)</option>
                <option value="Yes">Yes (Two Drops)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Empty Return?</label>
              <select
                value={emptyReturn}
                onChange={(e) => setEmptyReturn(e.target.value as 'Yes' | 'No')}
                className="w-full px-3 py-2 text-xs bg-amber-50/50 border border-amber-300 rounded-lg font-medium"
              >
                <option value="Yes">Yes (Came back empty)</option>
                <option value="No">No (Had return load)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Gate / Bill Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Driver waited at customer gate for unloading bay"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              If <strong>Split Load is Yes</strong>, this trip is displayed but automatically excluded from the lane benchmark and gets zero rate leak.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Record Trip</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
