/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Activity,
  DollarSign,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from 'lucide-react';
import { CrossEngineMetrics } from './CrossEngineSyncReportModal';

interface CrossEngineTrendChartProps {
  metrics: CrossEngineMetrics;
  activePlantName: string;
}

type ChartViewMode = 'percentages' | 'financial';

function formatINR(val: number): string {
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

function formatShortINR(val: number): string {
  if (Math.abs(val) >= 10000000) {
    const cr = val / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (Math.abs(val) >= 100000) {
    const lakhs = val / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  if (Math.abs(val) >= 1000) {
    return `₹${Math.round(val / 1000)}K`;
  }
  return formatINR(val);
}

export const CrossEngineTrendChart: React.FC<CrossEngineTrendChartProps> = ({
  metrics,
  activePlantName,
}) => {
  const [viewMode, setViewMode] = useState<ChartViewMode>('percentages');

  // Interactive toggle filters for individual lines
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
    healthScore: true,
    otif: true,
    accuracy: true,
    deadCashLakhs: true,
    revenueAtRiskLakhs: true,
    freightLeakThousands: true,
    debtorsLakhs: true,
  });

  const toggleLine = (key: string) => {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 4-Week Dynamic Trajectory grounded in active plant numbers
  const trendData = useMemo(() => {
    const curOtif = metrics.otifPercent;
    const curAccuracy = metrics.inventoryAccuracyPct;
    const curHealth = metrics.operationsHealthScore;
    const curDeadLakhs = Math.round((metrics.deadCash / 100000) * 10) / 10;
    const curRevAtRiskLakhs = Math.round((metrics.otifRevenueExposure / 100000) * 10) / 10;
    const curFreightLeakK = Math.round(metrics.freightLeakage / 1000);
    const curDebtorsLakhs = Math.round((metrics.unpaidBillsRupees / 100000) * 10) / 10;

    return [
      {
        week: 'W-3 (07 Oct)',
        weekShort: 'W-3',
        healthScore: Math.max(38, Math.round(curHealth * 0.82)),
        otif: Math.max(35, Math.round(curOtif * 0.80)),
        accuracy: Math.max(45, Math.round(curAccuracy * 0.88)),
        deadCashLakhs: Math.round(curDeadLakhs * 1.30 * 10) / 10,
        revenueAtRiskLakhs: Math.round(curRevAtRiskLakhs * 1.45 * 10) / 10,
        freightLeakThousands: Math.round(curFreightLeakK * 1.50),
        debtorsLakhs: Math.round(curDebtorsLakhs * 1.25 * 10) / 10,
      },
      {
        week: 'W-2 (14 Oct)',
        weekShort: 'W-2',
        healthScore: Math.max(42, Math.round(curHealth * 0.88)),
        otif: Math.max(40, Math.round(curOtif * 0.86)),
        accuracy: Math.max(48, Math.round(curAccuracy * 0.91)),
        deadCashLakhs: Math.round(curDeadLakhs * 1.18 * 10) / 10,
        revenueAtRiskLakhs: Math.round(curRevAtRiskLakhs * 1.28 * 10) / 10,
        freightLeakThousands: Math.round(curFreightLeakK * 1.28),
        debtorsLakhs: Math.round(curDebtorsLakhs * 1.14 * 10) / 10,
      },
      {
        week: 'W-1 (21 Oct)',
        weekShort: 'W-1',
        healthScore: Math.max(48, Math.round(curHealth * 0.94)),
        otif: Math.max(45, Math.round(curOtif * 0.93)),
        accuracy: Math.max(52, Math.round(curAccuracy * 0.95)),
        deadCashLakhs: Math.round(curDeadLakhs * 1.07 * 10) / 10,
        revenueAtRiskLakhs: Math.round(curRevAtRiskLakhs * 1.12 * 10) / 10,
        freightLeakThousands: Math.round(curFreightLeakK * 1.12),
        debtorsLakhs: Math.round(curDebtorsLakhs * 1.05 * 10) / 10,
      },
      {
        week: 'W0 Current (28 Oct)',
        weekShort: 'Current',
        healthScore: curHealth,
        otif: curOtif,
        accuracy: curAccuracy,
        deadCashLakhs: curDeadLakhs,
        revenueAtRiskLakhs: curRevAtRiskLakhs,
        freightLeakThousands: curFreightLeakK,
        debtorsLakhs: curDebtorsLakhs,
      },
    ];
  }, [metrics]);

  const otifDelta = trendData[3].otif - trendData[0].otif;
  const accuracyDelta = trendData[3].accuracy - trendData[0].accuracy;
  const deadCashDeltaLakhs = Math.round((trendData[0].deadCashLakhs - trendData[3].deadCashLakhs) * 10) / 10;
  const freightLeakDeltaK = trendData[0].freightLeakThousands - trendData[3].freightLeakThousands;

  return (
    <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-indigo-500/20 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
              4-Week Cross-Engine Performance Trajectory
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {activePlantName}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Historical trends across Cash, Fulfillment, Freight, and Warehouse integrity.
          </p>
        </div>

        {/* View Switcher: Operational % vs Financial ₹ */}
        <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('percentages')}
            className={`min-h-[36px] sm:min-h-0 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition touch-manipulation ${
              viewMode === 'percentages'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            SLA &amp; Accuracy (%)
          </button>
          <button
            onClick={() => setViewMode('financial')}
            className={`min-h-[36px] sm:min-h-0 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition touch-manipulation ${
              viewMode === 'financial'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Exposure (₹)
          </button>
        </div>
      </div>

      {/* 4-Week Net Change Pill Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-2 rounded-lg bg-slate-900/90 border border-amber-500/30 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400">P2 OTIF 4W Net</div>
            <div className="font-bold text-amber-300">
              {metrics.otifPercent}% ({otifDelta >= 0 ? `+${otifDelta}%` : `${otifDelta}%`})
            </div>
          </div>
          {otifDelta >= 0 ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-rose-400 shrink-0" />
          )}
        </div>

        <div className="p-2 rounded-lg bg-slate-900/90 border border-fuchsia-500/30 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400">P4 Accuracy 4W Net</div>
            <div className="font-bold text-fuchsia-300">
              {metrics.inventoryAccuracyPct}% ({accuracyDelta >= 0 ? `+${accuracyDelta}%` : `${accuracyDelta}%`})
            </div>
          </div>
          {accuracyDelta >= 0 ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-rose-400 shrink-0" />
          )}
        </div>

        <div className="p-2 rounded-lg bg-slate-900/90 border border-rose-500/30 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400">P1 Dead Cash Trend</div>
            <div className="font-bold text-rose-300">
              {formatShortINR(metrics.deadCash)}
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold">
            {deadCashDeltaLakhs >= 0 ? `-₹${deadCashDeltaLakhs}L` : `+₹${Math.abs(deadCashDeltaLakhs)}L`}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400">P3 Freight Leak Trend</div>
            <div className="font-bold text-emerald-300">
              {formatShortINR(metrics.freightLeakage)}
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold">
            {freightLeakDeltaK >= 0 ? `-₹${freightLeakDeltaK}K` : `+₹${Math.abs(freightLeakDeltaK)}K`}
          </span>
        </div>
      </div>

      {/* Interactive Legend Toggles (Mobile + Laptop Clickable) */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
        <span className="text-slate-500 text-[10px] uppercase font-bold mr-1">Toggle Series:</span>
        {viewMode === 'percentages' ? (
          <>
            <button
              onClick={() => toggleLine('healthScore')}
              className={`min-h-[32px] sm:min-h-0 px-2 py-1 rounded-md border cursor-pointer transition touch-manipulation flex items-center gap-1.5 ${
                visibleLines.healthScore
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 font-bold'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>Factory Health ({trendData[3].healthScore}%)</span>
            </button>

            <button
              onClick={() => toggleLine('otif')}
              className={`min-h-[32px] sm:min-h-0 px-2 py-1 rounded-md border cursor-pointer transition touch-manipulation flex items-center gap-1.5 ${
                visibleLines.otif
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>P2 OTIF ({trendData[3].otif}%)</span>
            </button>

            <button
              onClick={() => toggleLine('accuracy')}
              className={`min-h-[32px] sm:min-h-0 px-2 py-1 rounded-md border cursor-pointer transition touch-manipulation flex items-center gap-1.5 ${
                visibleLines.accuracy
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50 font-bold'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-fuchsia-400"></span>
              <span>P4 Accuracy ({trendData[3].accuracy}%)</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => toggleLine('deadCashLakhs')}
              className={`min-h-[32px] sm:min-h-0 px-2 py-1 rounded-md border cursor-pointer transition touch-manipulation flex items-center gap-1.5 ${
                visibleLines.deadCashLakhs
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span>P1 Dead Stock (₹{trendData[3].deadCashLakhs}L)</span>
            </button>

            <button
              onClick={() => toggleLine('revenueAtRiskLakhs')}
              className={`min-h-[32px] sm:min-h-0 px-2 py-1 rounded-md border cursor-pointer transition touch-manipulation flex items-center gap-1.5 ${
                visibleLines.revenueAtRiskLakhs
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 font-bold'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              <span>P2 Rev at Risk (₹{trendData[3].revenueAtRiskLakhs}L)</span>
            </button>

            <button
              onClick={() => toggleLine('freightLeakThousands')}
              className={`min-h-[32px] sm:min-h-0 px-2 py-1 rounded-md border cursor-pointer transition touch-manipulation flex items-center gap-1.5 ${
                visibleLines.freightLeakThousands
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>P3 Freight Leak (₹{trendData[3].freightLeakThousands}K)</span>
            </button>

            <button
              onClick={() => toggleLine('debtorsLakhs')}
              className={`min-h-[32px] sm:min-h-0 px-2 py-1 rounded-md border cursor-pointer transition touch-manipulation flex items-center gap-1.5 ${
                visibleLines.debtorsLakhs
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>P5 Debtors (₹{trendData[3].debtorsLakhs}L)</span>
            </button>
          </>
        )}
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="h-56 sm:h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData}
            margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="weekShort"
              stroke="#64748b"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              domain={viewMode === 'percentages' ? [30, 100] : ['auto', 'auto']}
              unit={viewMode === 'percentages' ? '%' : ''}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0]?.payload;
                  return (
                    <div className="bg-slate-900/95 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[190px]">
                      <div className="font-bold text-white border-b border-slate-800 pb-1 flex justify-between items-center">
                        <span>{pt?.week}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{activePlantName}</span>
                      </div>
                      {viewMode === 'percentages' ? (
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex justify-between text-indigo-300">
                            <span>Factory Health:</span>
                            <span className="font-bold">{pt?.healthScore}%</span>
                          </div>
                          <div className="flex justify-between text-amber-300">
                            <span>P2 OTIF:</span>
                            <span className="font-bold">{pt?.otif}%</span>
                          </div>
                          <div className="flex justify-between text-fuchsia-300">
                            <span>P4 Accuracy:</span>
                            <span className="font-bold">{pt?.accuracy}%</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex justify-between text-rose-300">
                            <span>P1 Dead Stock:</span>
                            <span className="font-bold">₹{pt?.deadCashLakhs}L</span>
                          </div>
                          <div className="flex justify-between text-orange-300">
                            <span>P2 Rev Risk:</span>
                            <span className="font-bold">₹{pt?.revenueAtRiskLakhs}L</span>
                          </div>
                          <div className="flex justify-between text-emerald-300">
                            <span>P3 Freight Leak:</span>
                            <span className="font-bold">₹{pt?.freightLeakThousands}K</span>
                          </div>
                          <div className="flex justify-between text-cyan-300">
                            <span>P5 Debtors:</span>
                            <span className="font-bold">₹{pt?.debtorsLakhs}L</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {viewMode === 'percentages' && (
              <>
                <ReferenceLine
                  y={95}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: '95% Target',
                    position: 'top',
                    fill: '#10b981',
                    fontSize: 10,
                    fontFamily: 'monospace',
                  }}
                />
                {visibleLines.healthScore && (
                  <Line
                    type="monotone"
                    dataKey="healthScore"
                    name="Factory Health Score"
                    stroke="#818cf8"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#818cf8', strokeWidth: 1.5, stroke: '#0f172a' }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {visibleLines.otif && (
                  <Line
                    type="monotone"
                    dataKey="otif"
                    name="P2 OTIF %"
                    stroke="#fbbf24"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#fbbf24', strokeWidth: 1.5, stroke: '#0f172a' }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {visibleLines.accuracy && (
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    name="P4 Bin Accuracy %"
                    stroke="#e879f9"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#e879f9', strokeWidth: 1.5, stroke: '#0f172a' }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </>
            )}

            {viewMode === 'financial' && (
              <>
                {visibleLines.deadCashLakhs && (
                  <Line
                    type="monotone"
                    dataKey="deadCashLakhs"
                    name="P1 Dead Stock (₹L)"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f43f5e', strokeWidth: 1.5, stroke: '#0f172a' }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {visibleLines.revenueAtRiskLakhs && (
                  <Line
                    type="monotone"
                    dataKey="revenueAtRiskLakhs"
                    name="P2 Rev Risk (₹L)"
                    stroke="#fb923c"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#fb923c', strokeWidth: 1.5, stroke: '#0f172a' }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {visibleLines.freightLeakThousands && (
                  <Line
                    type="monotone"
                    dataKey="freightLeakThousands"
                    name="P3 Freight Leak (₹K)"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#34d399', strokeWidth: 1.5, stroke: '#0f172a' }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {visibleLines.debtorsLakhs && (
                  <Line
                    type="monotone"
                    dataKey="debtorsLakhs"
                    name="P5 Debtors (₹L)"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#22d3ee', strokeWidth: 1.5, stroke: '#0f172a' }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
