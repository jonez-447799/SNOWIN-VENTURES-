import React from 'react';
import { Printer, Download, ArrowLeft, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { AuditTotals, LaneSummary, TransporterSummary, CalculatedTrip, RulesConfig } from '../types/freight';
import { formatINR, formatTonneRate } from '../utils/auditCalculations';

interface PrintDossierProps {
  totals: AuditTotals;
  laneSummaries: LaneSummary[];
  transporterSummaries: TransporterSummary[];
  trips: CalculatedTrip[];
  rules: RulesConfig;
  onBack: () => void;
  onExportCSV: () => void;
}

export const PrintDossier: React.FC<PrintDossierProps> = ({
  totals,
  laneSummaries,
  transporterSummaries,
  trips,
  rules,
  onBack,
  onExportCSV
}) => {
  const handlePrint = () => {
    window.print();
  };

  const siva = transporterSummaries.find(t => t.transporter.toLowerCase().includes('siva'));
  const murugan = transporterSummaries.find(t => t.transporter.toLowerCase().includes('murugan'));

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto px-4 sm:px-6 pt-6">
      {/* Action controls (hidden when printing) */}
      <div className="no-print flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Executive Dossier</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="print-page bg-white border border-slate-300 rounded-xl p-8 sm:p-10 shadow-xs space-y-6 text-slate-900">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-slate-500 block">
              Factory Logistics Audit · Confidential
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1">
              Freight Leak Audit: Ambattur Unit
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Audit Window: 1 Sep 2026 – 30 Sep 2026 · Benchmark Method: Own Cheapest Clean Trip
            </p>
          </div>
          <div className="text-right sm:text-right font-mono text-xs">
            <span className="text-slate-400 block">Scope: Freight Only</span>
            <span className="font-bold text-slate-800">12 Verified Lorry Bills</span>
          </div>
        </div>

        {/* The 4 Big Numbers Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="border-r border-slate-200 pr-2">
            <span className="text-[11px] text-slate-500 block">1. Freight Paid</span>
            <strong className="text-xl font-mono font-bold text-slate-900 block mt-0.5">
              {formatINR(totals.freightPaid)}
            </strong>
            <span className="text-[10px] text-slate-500 block mt-1">12 total trips</span>
          </div>

          <div className="border-r border-slate-200 pr-2">
            <span className="text-[11px] text-amber-800 font-semibold block">2. Rate Leak</span>
            <strong className="text-xl font-mono font-bold text-amber-900 block mt-0.5">
              {formatINR(totals.rateLeak)}
            </strong>
            <span className="text-[10px] text-slate-500 block mt-1">vs own best clean rate</span>
          </div>

          <div className="border-r border-slate-200 pr-2">
            <span className="text-[11px] text-rose-800 font-semibold block">3. Gate Detention</span>
            <strong className="text-xl font-mono font-bold text-rose-900 block mt-0.5">
              {formatINR(totals.detention)}
            </strong>
            <span className="text-[10px] text-slate-500 block mt-1">{totals.totalWaitHours}h @ ₹{rules.detentionRatePerHour}/hr</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-900 font-bold block">4. Total Waste</span>
            <strong className="text-xl font-mono font-extrabold text-slate-900 block mt-0.5">
              {formatINR(totals.totalLeak)}
            </strong>
            <span className="text-[10px] text-slate-500 block mt-1">Rate leak + detention</span>
          </div>
        </div>

        {/* Headline Quote */}
        <div className="bg-amber-50/70 border-l-4 border-amber-500 p-4 rounded-r-lg text-xs leading-relaxed text-amber-950">
          <strong className="font-bold">Core Finding:</strong> "About {formatINR(totals.totalLeak)} in September that your own cheap day says you did not have to spend. You are not arguing against market indices; both bills are yours."
        </div>

        {/* Lane Summary Table */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Lane Benchmarks & Rate Leaks
          </h2>
          <table className="w-full text-xs border border-slate-200 divide-y divide-slate-200">
            <thead className="bg-slate-100 font-semibold text-slate-700">
              <tr>
                <th className="py-2 px-3 text-left">Lane</th>
                <th className="py-2 px-2 text-right">Km</th>
                <th className="py-2 px-2 text-center">Trips</th>
                <th className="py-2 px-3 text-right">Best Clean Rate</th>
                <th className="py-2 px-3 text-right">Rate Leak</th>
                <th className="py-2 px-3 text-right">Detention</th>
                <th className="py-2 px-3 text-right">Total Waste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {laneSummaries.map((lane) => (
                <tr key={lane.lane}>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">{lane.lane}</td>
                  <td className="py-2 px-2 text-right text-slate-500">{lane.km}</td>
                  <td className="py-2 px-2 text-center text-slate-600">{lane.tripsCount}</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-700">{formatTonneRate(lane.bestCleanRate)}</td>
                  <td className="py-2 px-3 text-right font-bold text-amber-800">{formatINR(lane.totalRateLeak)}</td>
                  <td className="py-2 px-3 text-right text-rose-800">{formatINR(lane.totalDetention)}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatINR(lane.totalWaste)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Transporter Performance Breakdown */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Transporter Performance & Cost Attribution
          </h2>
          <table className="w-full text-xs border border-slate-200 divide-y divide-slate-200">
            <thead className="bg-slate-100 font-semibold text-slate-700">
              <tr>
                <th className="py-2 px-3 text-left">Transporter</th>
                <th className="py-2 px-2 text-center">Trips</th>
                <th className="py-2 px-3 text-right">Billed Amount</th>
                <th className="py-2 px-3 text-right">Rate Leak</th>
                <th className="py-2 px-3 text-right">Gate Wait (hrs)</th>
                <th className="py-2 px-3 text-right">Detention</th>
                <th className="py-2 px-3 text-right">Total Waste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {transporterSummaries.map((t) => (
                <tr key={t.transporter}>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">
                    {t.transporter}
                    {t.transporter === 'Murugan' && ' (Benchmark)'}
                    {t.transporter === 'Siva Transport' && ' (Primary Leak)'}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-600">{t.tripsCount}</td>
                  <td className="py-2 px-3 text-right">{formatINR(t.totalBilled)}</td>
                  <td className="py-2 px-3 text-right font-bold text-amber-800">{formatINR(t.totalRateLeak)}</td>
                  <td className="py-2 px-3 text-right">{t.totalWaitHours}h</td>
                  <td className="py-2 px-3 text-right text-rose-800">{formatINR(t.totalDetention)}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatINR(t.totalWaste)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Specific Case Study Row: Oragadam */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2 text-xs">
          <strong className="text-slate-900 block font-bold">
            The Irrefutable Comparison (Ambattur to Oragadam):
          </strong>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 p-2.5 rounded">
              <span className="text-[11px] text-emerald-800 font-bold block">Murugan · 02 Sep</span>
              <span className="font-mono text-xs block text-slate-700">2,800 kg · Bill ₹4,200 · Wait 0.5h</span>
              <strong className="font-mono text-emerald-700 block mt-0.5">₹1,484 / tonne (Benchmark)</strong>
            </div>

            <div className="bg-white border border-slate-200 p-2.5 rounded">
              <span className="text-[11px] text-rose-800 font-bold block">Siva Transport · 04 Sep</span>
              <span className="font-mono text-xs block text-slate-700">3,000 kg · Bill ₹6,100 · Wait 3.5h</span>
              <strong className="font-mono text-rose-700 block mt-0.5">₹2,033 / tonne (+₹1,648 leak + ₹700 wait)</strong>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 italic mt-1">
            "The highway did not change in 4 days. Siva billed ₹1,900 more for 200 kg extra cargo, while the truck sat 3.5 hours at the gate."
          </p>
        </div>

        {/* Meeting Action Plan & Sign-off */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-700 block mb-1">Mandate for Siva Transport Meeting:</span>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
              <li>Match Murugan clean rates on Oragadam (₹1,484/t) and Sriperumbudur (₹1,188/t).</li>
              <li>Eliminate gate waiting charges beyond 1.0 hour buffer.</li>
              <li>Reallocate 100% of Sriperumbudur trips to Murugan if rates are not matched.</li>
            </ul>
          </div>
          <div className="flex flex-col justify-end text-right">
            <div className="border-t border-slate-400 pt-2 inline-block ml-auto w-48 text-center text-[10px] text-slate-500">
              Factory Owner / Managing Director
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
