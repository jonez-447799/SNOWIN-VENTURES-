import React from 'react';
import { 
  FileSpreadsheet, 
  HelpCircle, 
  RotateCcw, 
  Save, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MondayTowerData, Language } from '../types';
import { INITIAL_TOWER_DATA } from '../data/sampleData';
import { formatINR, formatPercent } from '../utils/formatters';
import { TRANSLATIONS } from '../utils/translations';

interface ThisWeekSheetProps {
  towerData: MondayTowerData;
  setTowerData: React.Dispatch<React.SetStateAction<MondayTowerData>>;
  language: Language;
  isDarkMode: boolean;
}

export const ThisWeekSheet: React.FC<ThisWeekSheetProps> = ({
  towerData,
  setTowerData,
  language,
  isDarkMode,
}) => {
  const t = TRANSLATIONS[language];

  const freightPerTrip = towerData.tripsCount > 0 
    ? towerData.freightPaidRupees / towerData.tripsCount 
    : 0;
  
  const otifPercent = towerData.dispatchesCount > 0 
    ? (towerData.otifPassesCount / towerData.dispatchesCount) * 100 
    : 0;

  const handleInputChange = (field: keyof MondayTowerData, value: any) => {
    setTowerData(prev => ({
      ...prev,
      [field]: value,
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST (Local Edit)',
    }));
  };

  const handleResetToSample = () => {
    if (confirm('Reset inputs back to Ambattur sample week ending 05 Oct 2026?')) {
      setTowerData(INITIAL_TOWER_DATA);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className={`rounded-xl border p-5 sm:p-6 ${
        isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-500" />
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                This Week Sheet — Every Yellow Cell
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              The backup working sheet. You type the yellow cells. The tower calculates the percents and writes the WhatsApp message.
            </p>
          </div>

          <button
            onClick={handleResetToSample}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Ambattur Sample</span>
          </button>
        </div>

        {/* Client & Week Configuration Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span>Client Name (Prints on the Note)</span>
              <span className="text-[10px] font-mono text-neutral-500">One tower = One client</span>
            </label>
            <input
              type="text"
              value={towerData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              className={`w-full text-xs sm:text-sm font-semibold p-2.5 rounded-lg border focus:ring-1 focus:ring-amber-500 focus:outline-none ${
                isDarkMode 
                  ? 'bg-yellow-950/20 text-yellow-300 border-yellow-700/60' 
                  : 'bg-yellow-50 text-neutral-900 border-yellow-400'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span>Week Ending (The Sunday just gone)</span>
              <span className="text-[10px] font-mono text-neutral-500">Note goes out Monday morning</span>
            </label>
            <input
              type="text"
              value={towerData.weekEndingDate}
              onChange={(e) => handleInputChange('weekEndingDate', e.target.value)}
              className={`w-full text-xs sm:text-sm font-semibold p-2.5 rounded-lg border focus:ring-1 focus:ring-amber-500 focus:outline-none ${
                isDarkMode 
                  ? 'bg-yellow-950/20 text-yellow-300 border-yellow-700/60' 
                  : 'bg-yellow-50 text-neutral-900 border-yellow-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* The 8 Yellow Inputs Matrix */}
      <div className={`rounded-xl border overflow-hidden ${
        isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <div className="p-4 bg-neutral-950/60 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-200">
              The 8 User-Typed Inputs Behind the 6 Lines
            </span>
          </div>
          <span className="text-[11px] text-neutral-500 font-mono">
            Yellow = Manual / ERP Source · Grey = Auto-calculated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b font-mono ${
              isDarkMode ? 'bg-neutral-950 text-neutral-400 border-neutral-800' : 'bg-neutral-100 text-neutral-700 border-neutral-300'
            }`}>
              <tr>
                <th className="py-3 px-4">Line</th>
                <th className="py-3 px-4">Metric Input Name</th>
                <th className="py-3 px-4">Your Input (Yellow Cell)</th>
                <th className="py-3 px-4">Calculated Outcome</th>
                <th className="py-3 px-4">Where It Comes From (Provenance)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 font-mono">
              {/* Row 1: Dead Cash */}
              <tr className="hover:bg-neutral-800/20 transition-colors">
                <td className="py-3 px-4 text-neutral-500 font-bold">1</td>
                <td className="py-3 px-4 font-sans font-medium text-neutral-200">
                  Dead cash (Rupees)
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400">₹</span>
                    <input
                      type="number"
                      value={towerData.deadCashRupees}
                      onChange={(e) => handleInputChange('deadCashRupees', Number(e.target.value))}
                      className={`w-36 px-2 py-1.5 font-bold rounded border ${
                        isDarkMode 
                          ? 'bg-yellow-950/40 text-yellow-300 border-yellow-600' 
                          : 'bg-yellow-100 text-neutral-900 border-yellow-400'
                      }`}
                    />
                  </div>
                </td>
                <td className="py-3 px-4 text-neutral-300 font-bold">
                  {formatINR(towerData.deadCashRupees)}
                </td>
                <td className="py-3 px-4 text-neutral-400 font-sans text-[11px]">
                  Project 1 owner page. Only refresh when a new stock file is sent.
                  <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={towerData.deadCashFileUnchanged}
                      onChange={(e) => handleInputChange('deadCashFileUnchanged', e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span className="text-[10px] text-amber-400 font-mono">Stock file unchanged (keep number)</span>
                  </label>
                </td>
              </tr>

              {/* Row 2: Stockout Count */}
              <tr className="hover:bg-neutral-800/20 transition-colors">
                <td className="py-3 px-4 text-neutral-500 font-bold">2</td>
                <td className="py-3 px-4 font-sans font-medium text-neutral-200">
                  Stockout count (SKUs)
                </td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={towerData.stockoutRiskCount}
                    onChange={(e) => handleInputChange('stockoutRiskCount', Number(e.target.value))}
                    className={`w-24 px-2 py-1.5 font-bold rounded border ${
                      isDarkMode 
                        ? 'bg-yellow-950/40 text-yellow-300 border-yellow-600' 
                        : 'bg-yellow-100 text-neutral-900 border-yellow-400'
                    }`}
                  />
                </td>
                <td className="py-3 px-4 text-neutral-300 font-bold">
                  {towerData.stockoutRiskCount} SKUs
                </td>
                <td className="py-3 px-4 text-neutral-400 font-sans text-[11px]">
                  Opposite of dead stock. Important A-items with under 2 weeks left on shelf.
                </td>
              </tr>

              {/* Row 3 & 5: Dispatches & OTIF Passes & Orders Late */}
              <tr className="hover:bg-neutral-800/20 transition-colors">
                <td className="py-3 px-4 text-neutral-500 font-bold">3 & 5</td>
                <td className="py-3 px-4 font-sans font-medium text-neutral-200">
                  Dispatches (Loads) & Passes
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-sans">Total Dispatches</span>
                      <input
                        type="number"
                        value={towerData.dispatchesCount}
                        onChange={(e) => handleInputChange('dispatchesCount', Number(e.target.value))}
                        className={`w-20 px-2 py-1 font-bold rounded border ${
                          isDarkMode ? 'bg-yellow-950/40 text-yellow-300 border-yellow-600' : 'bg-yellow-100 text-neutral-900 border-yellow-400'
                        }`}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-sans">OTIF Passes</span>
                      <input
                        type="number"
                        value={towerData.otifPassesCount}
                        onChange={(e) => handleInputChange('otifPassesCount', Number(e.target.value))}
                        className={`w-20 px-2 py-1 font-bold rounded border ${
                          isDarkMode ? 'bg-yellow-950/40 text-yellow-300 border-yellow-600' : 'bg-yellow-100 text-neutral-900 border-yellow-400'
                        }`}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-purple-400 font-bold">
                  OTIF: {formatPercent(otifPercent)} ({towerData.otifPassesCount} of {towerData.dispatchesCount})
                </td>
                <td className="py-3 px-4 text-neutral-400 font-sans text-[11px]">
                  Project 2 file for that week. Dispatches and passes exist so OTIF can be calculated.
                </td>
              </tr>

              {/* Row 3: Orders Late */}
              <tr className="hover:bg-neutral-800/20 transition-colors">
                <td className="py-3 px-4 text-neutral-500 font-bold">3</td>
                <td className="py-3 px-4 font-sans font-medium text-neutral-200">
                  Orders late (Clock fail)
                </td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={towerData.ordersLateCount}
                    onChange={(e) => handleInputChange('ordersLateCount', Number(e.target.value))}
                    className={`w-24 px-2 py-1.5 font-bold rounded border ${
                      isDarkMode 
                        ? 'bg-yellow-950/40 text-yellow-300 border-yellow-600' 
                        : 'bg-yellow-100 text-neutral-900 border-yellow-400'
                    }`}
                  />
                </td>
                <td className="py-3 px-4 text-orange-400 font-bold">
                  {towerData.ordersLateCount} of {towerData.dispatchesCount} late
                </td>
                <td className="py-3 px-4 text-neutral-400 font-sans text-[11px]">
                  Project 2 file. Missed promised time. Only the clock, not short loads.
                </td>
              </tr>

              {/* Row 4: Freight Paid & Trips */}
              <tr className="hover:bg-neutral-800/20 transition-colors">
                <td className="py-3 px-4 text-neutral-500 font-bold">4</td>
                <td className="py-3 px-4 font-sans font-medium text-neutral-200">
                  Freight paid & Completed trips
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-sans">Freight Paid (₹)</span>
                      <input
                        type="number"
                        value={towerData.freightPaidRupees}
                        onChange={(e) => handleInputChange('freightPaidRupees', Number(e.target.value))}
                        className={`w-28 px-2 py-1 font-bold rounded border ${
                          isDarkMode ? 'bg-yellow-950/40 text-yellow-300 border-yellow-600' : 'bg-yellow-100 text-neutral-900 border-yellow-400'
                        }`}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-sans">Trips</span>
                      <input
                        type="number"
                        value={towerData.tripsCount}
                        onChange={(e) => handleInputChange('tripsCount', Number(e.target.value))}
                        className={`w-16 px-2 py-1 font-bold rounded border ${
                          isDarkMode ? 'bg-yellow-950/40 text-yellow-300 border-yellow-600' : 'bg-yellow-100 text-neutral-900 border-yellow-400'
                        }`}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-yellow-400 font-bold">
                  {formatINR(Math.round(freightPerTrip))} / trip
                </td>
                <td className="py-3 px-4 text-neutral-400 font-sans text-[11px]">
                  Project 3 freight bills for that week. Bill divided by trips.
                </td>
              </tr>

              {/* Row 6: Unpaid Bills */}
              <tr className="hover:bg-neutral-800/20 transition-colors">
                <td className="py-3 px-4 text-neutral-500 font-bold">6</td>
                <td className="py-3 px-4 font-sans font-medium text-neutral-200">
                  Unpaid bills (Overdue Debtors)
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400">₹</span>
                    <input
                      type="number"
                      value={towerData.unpaidBillsRupees}
                      onChange={(e) => handleInputChange('unpaidBillsRupees', Number(e.target.value))}
                      className={`w-36 px-2 py-1.5 font-bold rounded border ${
                        isDarkMode 
                          ? 'bg-yellow-950/40 text-yellow-300 border-yellow-600' 
                          : 'bg-yellow-100 text-neutral-900 border-yellow-400'
                      }`}
                    />
                  </div>
                </td>
                <td className="py-3 px-4 text-red-400 font-bold">
                  {formatINR(towerData.unpaidBillsRupees)}
                </td>
                <td className="py-3 px-4 text-neutral-400 font-sans text-[11px]">
                  From Tally outstandings. Only bills older than his normal {towerData.normalCreditDays} credit days.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
