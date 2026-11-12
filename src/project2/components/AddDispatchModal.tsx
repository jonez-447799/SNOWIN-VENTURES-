import React, { useState } from 'react';
import { X, Plus, AlertTriangle } from 'lucide-react';
import { DispatchRow, DelayReason } from '../types/otif';

interface AddDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (row: DispatchRow) => void;
}

export const AddDispatchModal: React.FC<AddDispatchModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [customer, setCustomer] = useState('Hyundai vendor park');
  const [customCustomer, setCustomCustomer] = useState('');
  const [po, setPo] = useState('');
  const [isWhatsApp, setIsWhatsApp] = useState(false);
  const [part, setPart] = useState('');
  const [orderedQty, setOrderedQty] = useState<number>(50);
  const [shippedQty, setShippedQty] = useState<number>(50);
  const [promisedDate, setPromisedDate] = useState('2026-09-20T17:00');
  const [actualOut, setActualOut] = useState('2026-09-20T16:30');
  const [vehicle, setVehicle] = useState('TN-21-AZ-4410');
  const [delayReason, setDelayReason] = useState<DelayReason>('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCustomer = customer === 'Custom' ? (customCustomer.trim() || 'Custom Client') : customer;
    const finalPo = isWhatsApp && !po.startsWith('WA-') ? `WA-${po || new Date().toISOString().split('T')[0]}` : po || `PO-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRow: DispatchRow = {
      id: `disp-${Date.now().toString().slice(-4)}`,
      customer: finalCustomer,
      po: finalPo,
      part: part.trim() || 'Machined Component',
      orderedQty: Number(orderedQty) || 1,
      shippedQty: Number(shippedQty) || 0,
      promisedDate,
      actualOut,
      vehicle: vehicle.trim() || 'TN-21-XX-0000',
      delayReason,
      notes: notes.trim(),
      isWhatsAppOrder: isWhatsApp,
    };

    onSave(newRow);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Add Dispatch Line (Gate Register Copy)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Test Scenario Autofill Buttons */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡ Quick Test Scenarios (1-Click Autofill)</span>
            </span>
            <span className="text-[10px] text-slate-400">Click any button to populate form fields instantly</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setCustomer('Hyundai vendor park');
                setPo('PO-HMI-9280');
                setIsWhatsApp(false);
                setPart('Bracket Sub-Assy M10');
                setOrderedQty(150);
                setShippedQty(150);
                setPromisedDate('2026-09-22T14:00');
                setActualOut('2026-09-22T13:40');
                setVehicle('TN-21-AZ-4410');
                setDelayReason('');
                setNotes('Passed both On-Time & In-Full (Security Gate Out 20 min early)');
              }}
              className="px-2 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-medium text-left transition cursor-pointer"
            >
              <div className="font-bold text-[10px] text-emerald-400">✓ Test Case 1</div>
              <div className="truncate">OTIF 100% Pass</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomer('Ashok Leyland line');
                setPo('PO-ALL-8430');
                setIsWhatsApp(false);
                setPart('Engine Mounting Flange');
                setOrderedQty(100);
                setShippedQty(65);
                setPromisedDate('2026-09-23T11:00');
                setActualOut('2026-09-23T10:45');
                setVehicle('TN-04-E-8812');
                setDelayReason('Material short');
                setNotes('Short dispatch (65/100). Forged blanks delayed by tier-2 raw vendor.');
              }}
              className="px-2 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[11px] font-medium text-left transition cursor-pointer"
            >
              <div className="font-bold text-[10px] text-amber-400">⚠ Test Case 2</div>
              <div className="truncate">Short Qty (Material)</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomer('Royal Enfield supplier');
                setPo('PO-RE-7712');
                setIsWhatsApp(false);
                setPart('Handlebar Pivot Lug');
                setOrderedQty(200);
                setShippedQty(200);
                setPromisedDate('2026-09-24T15:00');
                setActualOut('2026-09-24T18:45');
                setVehicle('TN-11-F-1190');
                setDelayReason('QC hold');
                setNotes('3hr 45m Gate Delay. CMM inspection rework on inner bore tolerance.');
              }}
              className="px-2 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[11px] font-medium text-left transition cursor-pointer"
            >
              <div className="font-bold text-[10px] text-rose-400">✗ Test Case 3</div>
              <div className="truncate">Gate Delay (QC Hold)</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomer('Custom');
                setCustomCustomer('Maruti Suzuki Manesar');
                setPo('WA-MSIL-RUSH-09');
                setIsWhatsApp(true);
                setPart('Exhaust Manifold Gasket');
                setOrderedQty(80);
                setShippedQty(80);
                setPromisedDate('2026-09-25T16:00');
                setActualOut('2026-09-25T15:30');
                setVehicle('HR-26-BR-9901');
                setDelayReason('');
                setNotes('WhatsApp emergency PO cleared under 3 hours to prevent line stop');
              }}
              className="px-2 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[11px] font-medium text-left transition cursor-pointer"
            >
              <div className="font-bold text-[10px] text-blue-400">⚡ Test Case 4</div>
              <div className="truncate">WhatsApp Rush PO</div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Customer Account</label>
              <select
                value={customer}
                onChange={e => setCustomer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              >
                <option value="Hyundai vendor park">Hyundai vendor park</option>
                <option value="Royal Enfield supplier">Royal Enfield supplier</option>
                <option value="Ashok Leyland line">Ashok Leyland line</option>
                <option value="Local Tier-2">Local Tier-2</option>
                <option value="Custom">+ Other Account</option>
              </select>
              {customer === 'Custom' && (
                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={customCustomer}
                  onChange={e => setCustomCustomer(e.target.value)}
                  className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  required
                />
              )}
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">PO / Promise Ref</label>
              <input
                type="text"
                placeholder="e.g. PO-HMI-7900 or date"
                value={po}
                onChange={e => setPo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
              />
              <label className="flex items-center gap-1.5 mt-1.5 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isWhatsApp}
                  onChange={e => setIsWhatsApp(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950"
                />
                <span>WhatsApp Order (Use message date as ref)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-slate-300 font-semibold block mb-1">Part Name / Line Item</label>
              <input
                type="text"
                placeholder="e.g. Bracket L, Flange 80NB"
                value={part}
                onChange={e => setPart(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                required
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Ordered Quantity</label>
              <input
                type="number"
                min="1"
                value={orderedQty}
                onChange={e => setOrderedQty(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-right"
                required
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Shipped Quantity</label>
              <input
                type="number"
                min="0"
                value={shippedQty}
                onChange={e => setShippedQty(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-right"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Promised Date &amp; Time</label>
              <input
                type="datetime-local"
                value={promisedDate}
                onChange={e => setPromisedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                required
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Actual Gate Out (Security Clock)
              </label>
              <input
                type="datetime-local"
                value={actualOut}
                onChange={e => setActualOut(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Vehicle Plate No.</label>
              <input
                type="text"
                placeholder="e.g. TN-21-AZ-4410"
                value={vehicle}
                onChange={e => setVehicle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                required
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Delay Reason (Leave blank if Pass)</label>
              <select
                value={delayReason}
                onChange={e => setDelayReason(e.target.value as DelayReason)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              >
                <option value="">None (Clean Pass)</option>
                <option value="Material short">Material short</option>
                <option value="QC hold">QC hold</option>
                <option value="No vehicle">No vehicle</option>
                <option value="Labour short">Labour short</option>
                <option value="Paperwork">Paperwork</option>
                <option value="Customer hold">Customer hold</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Register Remarks / Notes</label>
            <input
              type="text"
              placeholder="e.g. Forged blank delivery short, salt spray test delayed..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition cursor-pointer shadow"
            >
              Save Line to Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
