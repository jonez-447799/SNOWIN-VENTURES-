import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  FileSpreadsheet,
  CheckCircle,
  Building2
} from 'lucide-react';
import { MondayTowerData, Language } from '../types';
import { formatINR, formatPercent } from '../utils/formatters';

interface QuarterlyAnalyticsProps {
  towerData: MondayTowerData;
  isDarkMode: boolean;
  language: Language;
}

export const QuarterlyAnalytics: React.FC<QuarterlyAnalyticsProps> = ({
  towerData,
  isDarkMode,
  language,
}) => {
  // 13-week history dataset for Q3 / Q4 2026 ending on 05 Oct 2026
  const quarterlyWeeks = [
    { week: '06 Jul 2026', deadCash: 245000, stockouts: 6, ordersLate: 8, dispatches: 18, freightTrip: 5100, otif: 44, unpaid: 390000 },
    { week: '13 Jul 2026', deadCash: 245000, stockouts: 5, ordersLate: 7, dispatches: 17, freightTrip: 4950, otif: 53, unpaid: 380000 },
    { week: '20 Jul 2026', deadCash: 238000, stockouts: 4, ordersLate: 6, dispatches: 19, freightTrip: 4800, otif: 58, unpaid: 365000 },
    { week: '27 Jul 2026', deadCash: 238000, stockouts: 5, ordersLate: 5, dispatches: 16, freightTrip: 4650, otif: 62, unpaid: 350000 },
    { week: '03 Aug 2026', deadCash: 232000, stockouts: 4, ordersLate: 4, dispatches: 18, freightTrip: 4700, otif: 66, unpaid: 345000 },
    { week: '10 Aug 2026', deadCash: 232000, stockouts: 3, ordersLate: 5, dispatches: 20, freightTrip: 4600, otif: 65, unpaid: 340000 },
    { week: '17 Aug 2026', deadCash: 228000, stockouts: 4, ordersLate: 6, dispatches: 19, freightTrip: 4750, otif: 60, unpaid: 335000 },
    { week: '24 Aug 2026', deadCash: 228000, stockouts: 3, ordersLate: 4, dispatches: 17, freightTrip: 4500, otif: 70, unpaid: 330000 },
    { week: '31 Aug 2026', deadCash: 225000, stockouts: 3, ordersLate: 5, dispatches: 18, freightTrip: 4550, otif: 67, unpaid: 320000 },
    { week: '07 Sep 2026', deadCash: 225000, stockouts: 4, ordersLate: 6, dispatches: 16, freightTrip: 4400, otif: 56, unpaid: 325000 },
    { week: '14 Sep 2026', deadCash: 223110, stockouts: 3, ordersLate: 4, dispatches: 18, freightTrip: 4350, otif: 72, unpaid: 315000 },
    { week: '21 Sep 2026', deadCash: 223110, stockouts: 3, ordersLate: 5, dispatches: 16, freightTrip: 4420, otif: 62.5, unpaid: 310000 },
    { week: '05 Oct 2026', deadCash: towerData.deadCashRupees, stockouts: towerData.stockoutRiskCount, ordersLate: towerData.ordersLateCount, dispatches: towerData.dispatchesCount, freightTrip: towerData.tripsCount > 0 ? Math.round(towerData.freightPaidRupees / towerData.tripsCount) : 0, otif: towerData.dispatchesCount > 0 ? Math.round((towerData.otifPassesCount / towerData.dispatchesCount) * 100) : 0, unpaid: towerData.unpaidBillsRupees },
  ];

  const handleExportCSV = () => {
    const headers = ['Week Ending', 'Dead Cash (INR)', 'Stockout SKUs', 'Orders Late', 'Dispatches', 'Freight Per Trip (INR)', 'OTIF (%)', 'Unpaid Bills (INR)'];
    const rows = quarterlyWeeks.map(w => [
      w.week,
      w.deadCash,
      w.stockouts,
      w.ordersLate,
      w.dispatches,
      w.freightTrip,
      w.otif,
      w.unpaid
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quarterly-control-tower-${towerData.clientName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header and Action Bar */}
      <div className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              Quarterly Operations Review & Analytics
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            13-week historical audit trail for executive board & quarterly supply chain reporting.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards across 13 weeks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
          <div className="text-neutral-500 text-[11px]">13-WK DEAD CASH REDUCTION</div>
          <div className="text-lg font-bold text-emerald-400 mt-1">-₹21,890 (-8.9%)</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">₹2.45L ➔ ₹2.23L</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
          <div className="text-neutral-500 text-[11px]">AVG FREIGHT PER TRIP</div>
          <div className="text-lg font-bold text-amber-400 mt-1">₹4,646 / trip</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">13-week mean across corridors</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
          <div className="text-neutral-500 text-[11px]">QUARTERLY AVG OTIF</div>
          <div className="text-lg font-bold text-neutral-200 mt-1">60.7%</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Peak 72% · Low 44%</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
          <div className="text-neutral-500 text-[11px]">OVERDUE TALLY CASH</div>
          <div className="text-lg font-bold text-rose-400 mt-1">₹3,40,000</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Average collection 41 days</div>
        </div>
      </div>

      {/* 13-Week Data Table */}
      <div className={`rounded-xl border overflow-hidden ${
        isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
      }`}>
        <div className="p-4 bg-neutral-950/60 border-b border-neutral-800 flex items-center justify-between text-xs">
          <span className="font-bold uppercase font-mono text-neutral-300">
            Q3 / Q4 2026 Weekly Control Tower Ledger
          </span>
          <span className="text-neutral-500 font-mono">13 Completed Weeks</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b font-mono ${
              isDarkMode ? 'bg-neutral-950 text-neutral-400 border-neutral-800' : 'bg-neutral-100 text-neutral-700 border-neutral-300'
            }`}>
              <tr>
                <th className="py-2.5 px-3">Week Ending</th>
                <th className="py-2.5 px-3 text-right">Dead Cash (P1)</th>
                <th className="py-2.5 px-3 text-right">Stockout SKUs (P4)</th>
                <th className="py-2.5 px-3 text-right">Orders Late (P2)</th>
                <th className="py-2.5 px-3 text-right">Freight / Trip (P3)</th>
                <th className="py-2.5 px-3 text-right">Strict OTIF</th>
                <th className="py-2.5 px-3 text-right">Unpaid Bills (Tally)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 font-mono">
              {quarterlyWeeks.map((row, idx) => {
                const isCurrent = idx === quarterlyWeeks.length - 1;

                return (
                  <tr 
                    key={row.week} 
                    className={`transition-colors ${
                      isCurrent 
                        ? 'bg-amber-500/10 font-bold border-l-2 border-amber-500' 
                        : 'hover:bg-neutral-800/30'
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <span>{row.week}</span>
                      {isCurrent && <span className="ml-2 text-[10px] text-amber-400 font-sans">(This Week)</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right">{formatINR(row.deadCash)}</td>
                    <td className="py-2.5 px-3 text-right">{row.stockouts}</td>
                    <td className="py-2.5 px-3 text-right">{row.ordersLate} of {row.dispatches}</td>
                    <td className="py-2.5 px-3 text-right">{formatINR(row.freightTrip)}</td>
                    <td className="py-2.5 px-3 text-right">{row.otif}%</td>
                    <td className="py-2.5 px-3 text-right">{formatINR(row.unpaid)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
