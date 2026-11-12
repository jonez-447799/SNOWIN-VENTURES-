/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES } from '../project1/data/initialData';
import { evaluateStockEngine } from '../project1/utils/calculations';
import type { StockItem } from '../project1/types';
import {
  downloadAuditTemplate,
  downloadPilotDataKitXlsx,
} from '../utils/pilotDataKitExporter';
import { trackEvent } from '../utils/analytics';

export interface InstantCsvAuditRow {
  partId: string;
  partDescription: string;
  closingStockQty: number;
  unitCostInr: number;
  lastMovementDate: string;
  totalValueInr: number;
  daysIdle: number;
  bucket: 'NON_MOVING_180D' | 'SLOW_MOVING_90_179D' | 'ACTIVE_UNDER_90D';
}

export interface InstantCsvAuditSummary {
  totalSkus: number;
  totalValuationInr: number;
  totalValuationFormatted: string;
  nonMovingValueInr: number;
  nonMovingFormatted: string;
  nonMovingSkuCount: number;
  nonMovingSharePct: number;
  slowMovingValueInr: number;
  slowMovingFormatted: string;
  slowMovingSkuCount: number;
  slowMovingSharePct: number;
  prioritySkuCount: number;
  carryingCostPct: number;
  annualCarryingBurnInr: number;
  annualCarryingBurnFormatted: string;
  rows: InstantCsvAuditRow[];
  topNonMovingRows: InstantCsvAuditRow[];
}

/**
 * Generates the canonical 20-SKU Ambattur 5-Column CSV string directly from AMBATTUR_FABRICATION_SAMPLE.
 */
export function buildAmbattur20SkuSampleCsv(): string {
  const header = 'Part_ID,Part_Description,Closing_Stock_Qty,Unit_Cost_INR,Last_Movement_Date';
  const lines = AMBATTUR_FABRICATION_SAMPLE.map(
    (item) =>
      `${item.itemCode},"${item.itemName.replace(/"/g, '""')}",${item.qtyOnHand},${item.costRate},${item.lastMovement}`
  );
  return [header, ...lines].join('\n');
}

export const AMBATTUR_20_SKU_SAMPLE_CSV = buildAmbattur20SkuSampleCsv();

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

/**
 * Pure, deterministic 5-column CSV parser & evaluator (100% local in-browser).
 * Uses canonical P1 evaluateStockEngine so all Ambattur 20-SKU totals match 100%.
 */
export function parseAndEvaluateFiveColumnCsv(
  csvText: string,
  asOfDate: string = DEFAULT_RULES.asOfDate
): InstantCsvAuditSummary {
  const rawLines = (csvText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (rawLines.length === 0) {
    return {
      totalSkus: 0,
      totalValuationInr: 0,
      totalValuationFormatted: '₹0',
      nonMovingValueInr: 0,
      nonMovingFormatted: '₹0',
      nonMovingSkuCount: 0,
      nonMovingSharePct: 0,
      slowMovingValueInr: 0,
      slowMovingFormatted: '₹0',
      slowMovingSkuCount: 0,
      slowMovingSharePct: 0,
      prioritySkuCount: 0,
      carryingCostPct: 22,
      annualCarryingBurnInr: 0,
      annualCarryingBurnFormatted: '₹0',
      rows: [],
      topNonMovingRows: [],
    };
  }

  const headerCells = splitCsvLine(rawLines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]/g, '')
  );

  // Detect whether first line is a header row
  const hasHeader =
    headerCells.some((h) =>
      ['partid', 'itemcode', 'sku', 'partno', 'matnr', 'stockitemcode'].includes(h)
    ) ||
    headerCells.some((h) =>
      ['closingstockqty', 'qty', 'closingbalance', 'closingqty', 'quantity'].includes(h)
    );

  const findColIdx = (candidates: string[], fallbackIdx: number): number => {
    if (!hasHeader) return fallbackIdx;
    const idx = headerCells.findIndex((h) => candidates.includes(h));
    return idx >= 0 ? idx : fallbackIdx;
  };

  const partIdIdx = findColIdx(
    ['partid', 'itemcode', 'sku', 'partno', 'matnr', 'stockitemcode'],
    0
  );
  const descIdx = findColIdx(
    ['partdescription', 'description', 'stockitemname', 'materialdescription', 'particulars', 'itemname'],
    1
  );
  const qtyIdx = findColIdx(
    ['closingstockqty', 'qty', 'closingbalance', 'closingqty', 'labst', 'quantity', 'qtyonhand'],
    2
  );
  const costIdx = findColIdx(
    ['unitcostinr', 'rate', 'unitprice', 'standardprice', 'verpr', 'cost', 'costrate'],
    3
  );
  const dateIdx = findColIdx(
    ['lastmovementdate', 'lastissue', 'lasttxn', 'lastused', 'budat', 'lastmovement'],
    4
  );

  const dataLines = hasHeader ? rawLines.slice(1) : rawLines;
  const stockItems: StockItem[] = [];

  dataLines.forEach((line, index) => {
    const cols = splitCsvLine(line);
    if (cols.length < 3) return;
    const partId = (cols[partIdIdx] || `SKU-${index + 1}`).trim();
    const partDescription = (cols[descIdx] || partId).trim();
    const rawQty = Number(String(cols[qtyIdx] || '0').replace(/[^0-9.-]/g, ''));
    const rawCost = Number(String(cols[costIdx] || '0').replace(/[^0-9.-]/g, ''));
    const lastMovement = (cols[dateIdx] || '2026-01-01').trim();

    if (!Number.isFinite(rawQty) || !Number.isFinite(rawCost) || rawQty < 0 || rawCost < 0) {
      return;
    }

    stockItems.push({
      id: `csv-sku-${index + 1}`,
      itemCode: partId,
      itemName: partDescription,
      category: 'Raw Material',
      qtyOnHand: rawQty,
      costRate: rawCost,
      lastMovement,
    });
  });

  const evaluated = evaluateStockEngine(stockItems, {
    ...DEFAULT_RULES,
    asOfDate,
    holdingCostPercent: 22,
  });

  let totalValuationInr = 0;
  let nonMovingValueInr = 0;
  let nonMovingSkuCount = 0;
  let slowMovingValueInr = 0;
  let slowMovingSkuCount = 0;

  const rows: InstantCsvAuditRow[] = evaluated.map((item) => {
    const val = Math.round(item.closingValue ?? item.qtyOnHand * item.costRate);
    const days = item.daysIdle ?? 0;
    totalValuationInr += val;

    let bucket: InstantCsvAuditRow['bucket'] = 'ACTIVE_UNDER_90D';
    if (days >= 180) {
      bucket = 'NON_MOVING_180D';
      nonMovingValueInr += val;
      nonMovingSkuCount++;
    } else if (days >= 90) {
      bucket = 'SLOW_MOVING_90_179D';
      slowMovingValueInr += val;
      slowMovingSkuCount++;
    }

    return {
      partId: item.itemCode,
      partDescription: item.itemName,
      closingStockQty: item.qtyOnHand,
      unitCostInr: item.costRate,
      lastMovementDate: item.lastMovement,
      totalValueInr: val,
      daysIdle: days,
      bucket,
    };
  });

  const prioritySkuCount = nonMovingSkuCount + slowMovingSkuCount;
  const carryingCostPct = 22;
  const annualCarryingBurnInr = Math.round(nonMovingValueInr * (carryingCostPct / 100));
  const nonMovingSharePct =
    totalValuationInr > 0 ? Math.round((nonMovingValueInr / totalValuationInr) * 1000) / 10 : 0;
  const slowMovingSharePct =
    totalValuationInr > 0 ? Math.round((slowMovingValueInr / totalValuationInr) * 1000) / 10 : 0;

  const formatINR = (val: number) => `₹${Math.round(val).toLocaleString('en-IN')}`;

  const topNonMovingRows = rows
    .filter((r) => r.bucket === 'NON_MOVING_180D')
    .sort((a, b) => b.totalValueInr - a.totalValueInr)
    .slice(0, 5);

  return {
    totalSkus: rows.length,
    totalValuationInr,
    totalValuationFormatted: formatINR(totalValuationInr),
    nonMovingValueInr,
    nonMovingFormatted: formatINR(nonMovingValueInr),
    nonMovingSkuCount,
    nonMovingSharePct,
    slowMovingValueInr,
    slowMovingFormatted: formatINR(slowMovingValueInr),
    slowMovingSkuCount,
    slowMovingSharePct,
    prioritySkuCount,
    carryingCostPct,
    annualCarryingBurnInr,
    annualCarryingBurnFormatted: formatINR(annualCarryingBurnInr),
    rows,
    topNonMovingRows,
  };
}

interface InstantAuditDropzoneProps {
  onOpenRequestAuditModal: () => void;
  onOpenSelfServeWalkthrough?: (workspaceId: string, shareToken: string) => void;
}

export const InstantAuditDropzone: React.FC<InstantAuditDropzoneProps> = ({
  onOpenRequestAuditModal,
  onOpenSelfServeWalkthrough,
}) => {
  const [auditResult, setAuditResult] = useState<InstantCsvAuditSummary | null>(null);
  const [activeSourceName, setActiveSourceName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showAllRows, setShowAllRows] = useState<boolean>(false);
  const [selfServeName, setSelfServeName] = useState<string>('');
  const [selfServeCompany, setSelfServeCompany] = useState<string>('');
  const [selfServeEmail, setSelfServeEmail] = useState<string>('');
  const [selfServePhone, setSelfServePhone] = useState<string>('');
  const [selfServeBusy, setSelfServeBusy] = useState<boolean>(false);
  const [selfServeError, setSelfServeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLoadSampleCsv = () => {
    trackEvent('import_started', { source: 'instant_dropzone_sample_20sku' });
    const summary = parseAndEvaluateFiveColumnCsv(AMBATTUR_20_SKU_SAMPLE_CSV);
    setAuditResult(summary);
    setShowAllRows(false);
    setSelfServeError(null);
    setActiveSourceName('Ambattur_20_SKU_Sample_Export.csv (20 SKUs)');
  };

  const handleFileText = (text: string, fileName: string) => {
    trackEvent('import_validation_completed', { source: 'instant_dropzone_upload' });
    const summary = parseAndEvaluateFiveColumnCsv(text);
    setAuditResult(summary);
    setShowAllRows(false);
    setSelfServeError(null);
    setActiveSourceName(fileName);
  };

  const handleGenerateSelfServeWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditResult || auditResult.rows.length === 0) return;

    const fullName = selfServeName.trim();
    const companyName = selfServeCompany.trim();
    const workEmail = selfServeEmail.trim();
    const phoneOrWhatsapp = selfServePhone.trim();

    if (fullName.length < 2) {
      setSelfServeError('Please enter your name (at least 2 characters).');
      return;
    }
    if (companyName.length < 2) {
      setSelfServeError('Please enter your company or plant name.');
      return;
    }
    if (!workEmail && !phoneOrWhatsapp) {
      setSelfServeError('Please enter your work email or WhatsApp/phone number.');
      return;
    }

    setSelfServeBusy(true);
    setSelfServeError(null);

    const p1Rows = auditResult.rows.map((r) => ({
      Part_ID: r.partId,
      Part_Description: r.partDescription,
      Closing_Stock_Qty: String(r.closingStockQty),
      Unit_Cost_INR: String(r.unitCostInr),
      Last_Movement_Date: r.lastMovementDate,
    }));

    const navigateToWalkthrough = (workspaceId: string, token: string) => {
      if (onOpenSelfServeWalkthrough) {
        onOpenSelfServeWalkthrough(workspaceId, token);
        return;
      }
      try {
        window.history.pushState(
          {},
          '',
          `?view=pilot-findings&id=${encodeURIComponent(
            workspaceId
          )}&token=${encodeURIComponent(token)}&paywall=teaser`
        );
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch {
        window.location.href = `?view=pilot-findings&id=${encodeURIComponent(
          workspaceId
        )}&token=${encodeURIComponent(token)}&paywall=teaser`;
      }
    };

    try {
      const res = await fetch('/api/public/instant-self-serve-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          companyName,
          workEmail,
          phoneOrWhatsapp,
          p1Rows,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.workspaceId && data.accessToken) {
        trackEvent('hero_primary_cta_clicked', {
          source: 'instant_self_serve_converter',
          workspaceId: data.workspaceId,
        });
        navigateToWalkthrough(String(data.workspaceId), String(data.accessToken));
      } else if (data?.error) {
        setSelfServeError(String(data.error));
      } else {
        navigateToWalkthrough('AUDIT-DEMO-P1P4', 'operationalyst-public-demo-token');
      }
    } catch {
      navigateToWalkthrough('AUDIT-DEMO-P1P4', 'operationalyst-public-demo-token');
    } finally {
      setSelfServeBusy(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      handleFileText(String(reader.result || ''), file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      handleFileText(String(reader.result || ''), file.name);
    };
    reader.readAsText(file);
  };

  const visibleRows = auditResult
    ? showAllRows
      ? auditResult.rows
      : auditResult.rows.slice(0, 8)
    : [];

  return (
    <section
      data-testid="instant-audit-dropzone"
      className="py-10 bg-slate-900 text-white border-b border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Header & Value Prop */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Instant In-Browser 5-Column CSV Audit Sandbox (100% Local Browser Processing)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Test the 5-Column Stock Aging Engine Right Now — Zero Sign-Up Required
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Drop a 5-column CSV (<code className="text-blue-300 font-mono">Part_ID, Part_Description, Closing_Stock_Qty, Unit_Cost_INR, Last_Movement_Date</code>) or load the 20-SKU Ambattur sample to calculate Non-Moving (&gt;180d) exposure and 22% Annual Carrying Burn in milliseconds.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                data-testid="instant-dropzone-load-sample-btn"
                onClick={handleLoadSampleCsv}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Load 20-SKU Ambattur Sample CSV</span>
              </button>

              <button
                type="button"
                data-testid="instant-dropzone-download-template-btn"
                onClick={() => downloadAuditTemplate('instant_dropzone')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download Blank 5-Column CSV Template</span>
              </button>

              <button
                type="button"
                data-testid="instant-dropzone-download-xlsx-btn"
                onClick={() => downloadPilotDataKitXlsx()}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Download 5-Sheet Data Kit (.XLSX)</span>
              </button>
            </div>
          </div>

          {/* Drag-and-Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
              isDragging
                ? 'border-blue-400 bg-blue-950/30'
                : 'border-slate-700 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              data-testid="instant-dropzone-file-input"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-white">
                Drop your 5-column Tally Prime, SAP, Busy, or Excel <code className="text-blue-300">.csv</code> export here, or <span className="text-blue-400 underline">browse file</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% local browser execution — your file is parsed in memory and never uploaded automatically.</span>
              </div>
            </div>
          </div>

          {/* Instant Computed Results */}
          {auditResult && auditResult.totalSkus === 0 && (
            <div
              data-testid="instant-dropzone-error-banner"
              className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  No valid 5-column stock rows were detected in <strong>{activeSourceName || 'uploaded file'}</strong>. Ensure columns include <code className="font-mono">Part_ID, Part_Description, Closing_Stock_Qty, Unit_Cost_INR, Last_Movement_Date</code>.
                </span>
              </div>
              <button
                type="button"
                onClick={handleLoadSampleCsv}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold cursor-pointer shrink-0"
              >
                Load 20-SKU Sample Instead
              </button>
            </div>
          )}

          {auditResult && auditResult.totalSkus > 0 && (
            <div
              data-testid="instant-dropzone-results"
              className="bg-slate-900 border border-blue-500/40 rounded-xl p-5 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">
                    Instant Audit Computed: {activeSourceName} ({auditResult.totalSkus} SKUs Evaluated)
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded">
                  P1 Engine Verified · 22% Annual Carrying Rate
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] font-semibold text-slate-400">1. Total Valuation</div>
                  <div
                    data-testid="instant-dropzone-total-valuation"
                    className="text-xl font-mono font-bold text-white mt-1"
                  >
                    {auditResult.totalValuationFormatted}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Across {auditResult.totalSkus} audited SKUs
                  </div>
                </div>

                <div className="bg-slate-950 border border-l-4 border-l-rose-500 border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] font-semibold text-rose-300">
                    2. Non-Moving (&gt;180d)
                  </div>
                  <div
                    data-testid="instant-dropzone-nonmoving-value"
                    className="text-xl font-mono font-bold text-rose-400 mt-1"
                  >
                    {auditResult.nonMovingFormatted}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {auditResult.nonMovingSkuCount} SKUs · {auditResult.nonMovingSharePct}% of stock
                  </div>
                </div>

                <div className="bg-slate-950 border border-l-4 border-l-amber-500 border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] font-semibold text-amber-300">
                    3. Slow-Moving (90–179d)
                  </div>
                  <div
                    data-testid="instant-dropzone-slowmoving-value"
                    className="text-xl font-mono font-bold text-amber-300 mt-1"
                  >
                    {auditResult.slowMovingFormatted}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {auditResult.slowMovingSkuCount} SKUs · {auditResult.slowMovingSharePct}% of stock
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] font-semibold text-blue-300">4. Priority SKUs</div>
                  <div
                    data-testid="instant-dropzone-priority-skus"
                    className="text-xl font-mono font-bold text-white mt-1"
                  >
                    {auditResult.prioritySkuCount} Priority SKUs
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Flagged for floor disposition review
                  </div>
                </div>

                <div className="bg-slate-950 border border-l-4 border-l-sky-500 border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] font-semibold text-sky-300">
                    5. 22% Annual Carrying Burn
                  </div>
                  <div
                    data-testid="instant-dropzone-carrying-burn"
                    className="text-xl font-mono font-bold text-sky-300 mt-1"
                  >
                    {auditResult.annualCarryingBurnFormatted}/yr
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Estimated capital &amp; storage drain
                  </div>
                </div>
              </div>

              {/* Populated 5-Column + Aging Preview Table */}
              <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className="font-bold text-slate-200">
                    5-Column ERP Export &amp; P1 Aging Ledger ({visibleRows.length} of {auditResult.rows.length} rows shown)
                  </span>
                  {auditResult.rows.length > 8 && (
                    <button
                      type="button"
                      data-testid="instant-dropzone-toggle-rows-btn"
                      onClick={() => setShowAllRows((prev) => !prev)}
                      className="text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
                    >
                      {showAllRows
                        ? 'Show Top 8 Rows'
                        : `View All ${auditResult.rows.length} Audited SKUs`}
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table
                    data-testid="instant-dropzone-5col-table"
                    className="w-full text-left border-collapse text-xs font-mono"
                  >
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-950">
                        <th className="py-2.5 px-3">Part_ID</th>
                        <th className="py-2.5 px-3">Part_Description</th>
                        <th className="py-2.5 px-3 text-right">Closing_Stock_Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit_Cost_INR</th>
                        <th className="py-2.5 px-3">Last_Movement_Date</th>
                        <th className="py-2.5 px-3 text-right">Book_Value</th>
                        <th className="py-2.5 px-3">Aging_Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {visibleRows.map((row) => (
                        <tr key={row.partId} className="hover:bg-slate-900/60">
                          <td className="py-2 px-3 font-bold text-white">{row.partId}</td>
                          <td className="py-2 px-3 text-slate-300 font-sans">{row.partDescription}</td>
                          <td className="py-2 px-3 text-right text-slate-200">{row.closingStockQty}</td>
                          <td className="py-2 px-3 text-right text-slate-200">
                            ₹{row.unitCostInr.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3 text-slate-300">{row.lastMovementDate}</td>
                          <td className="py-2 px-3 text-right font-bold text-white">
                            ₹{row.totalValueInr.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                row.bucket === 'NON_MOVING_180D'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : row.bucket === 'SLOW_MOVING_90_179D'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {row.daysIdle}d ·{' '}
                              {row.bucket === 'NON_MOVING_180D'
                                ? 'NON-MOVING (>180d)'
                                : row.bucket === 'SLOW_MOVING_90_179D'
                                ? 'SLOW (90-179d)'
                                : 'ACTIVE (<90d)'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Phase 17: 24/7 Zero-Touch Sandbox-to-Paywall Converter Bar */}
              <div
                data-testid="instant-self-serve-converter-bar"
                className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-mono font-bold text-emerald-400 uppercase">
                      24/7 ZERO-TOUCH AUDIT GENERATOR • FREE 3-SKU EXECUTIVE TEASER + ₹14,999 FULL UNLOCK
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                      Want the Full 4-Pillar Plant Audit &amp; 6-Sheet Action Workbook? Generate Your Official Executive Teaser Workspace Instantly
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold">
                    Instant Shareable Walkthrough URL
                  </span>
                </div>

                <form
                  onSubmit={handleGenerateSelfServeWorkspace}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs font-mono"
                >
                  <input
                    type="text"
                    data-testid="instant-self-serve-name-input"
                    value={selfServeName}
                    onChange={(e) => setSelfServeName(e.target.value)}
                    placeholder="Your Name *"
                    className="px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                  <input
                    type="text"
                    data-testid="instant-self-serve-company-input"
                    value={selfServeCompany}
                    onChange={(e) => setSelfServeCompany(e.target.value)}
                    placeholder="Company / Plant Name *"
                    className="px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                  <input
                    type="email"
                    data-testid="instant-self-serve-email-input"
                    value={selfServeEmail}
                    onChange={(e) => setSelfServeEmail(e.target.value)}
                    placeholder="Work Email *"
                    className="px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                  <input
                    type="text"
                    data-testid="instant-self-serve-phone-input"
                    value={selfServePhone}
                    onChange={(e) => setSelfServePhone(e.target.value)}
                    placeholder="WhatsApp / Phone Number *"
                    className="px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                  <button
                    type="submit"
                    data-testid="instant-self-serve-submit-btn"
                    disabled={selfServeBusy}
                    className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>
                      {selfServeBusy
                        ? 'Generating Workspace...'
                        : 'Generate My Official Audit Workspace ->'}
                    </span>
                  </button>
                </form>

                {selfServeError && (
                  <div
                    role="alert"
                    className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-mono"
                  >
                    {selfServeError}
                  </div>
                )}
              </div>

              {/* Top Non-Moving SKUs Summary & Conversion CTA */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-2 border-t border-slate-800">
                <div className="text-xs text-slate-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Top non-moving exposure:{' '}
                    {auditResult.topNonMovingRows
                      .slice(0, 3)
                      .map(
                        (r) =>
                          `${r.partId} (₹${r.totalValueInr.toLocaleString('en-IN')} · ${r.daysIdle}d idle)`
                      )
                      .join(', ')}
                  </span>
                </div>

                <button
                  type="button"
                  data-testid="instant-dropzone-request-audit-btn"
                  onClick={() => {
                    trackEvent('hero_primary_cta_clicked', { source: 'instant_dropzone_results' });
                    onOpenRequestAuditModal();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer shrink-0"
                >
                  <span>Get Full 48-Hour Verified Audit &amp; PDF Brief →</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
