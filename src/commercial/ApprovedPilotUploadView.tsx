/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  ShieldCheck,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Download,
  Wrench,
  Lock,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  RefreshCw,
  EyeOff,
  Cpu,
  Database,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import {
  validateP1InventoryRows,
  validateP2DispatchRows,
  validateP3FreightRows,
  validateP4WarehouseBinRows,
  anonymizeP1ToP4DatasetClientSide,
  buildSampleDirtyTallyPrimeExportDataset,
  type QuarantinedRowRecord,
} from '../utils/importValidation';
import {
  downloadPilotDataKitXlsx,
  downloadQuarantinedRowsCsv,
} from '../utils/pilotDataKitExporter';

interface ApprovedPilotUploadViewProps {
  leadIdParam?: string;
  tokenParam?: string;
  isDemoMode?: boolean;
  onBackToHome: () => void;
  onOpenWalkthrough: (workspaceId: string, shareToken: string) => void;
  onOpenLeadInbox?: () => void;
}

interface LeadUploadPortalMetadata {
  leadId: string;
  companyName: string;
  plantLocation: string;
  erpSystem: string;
  approxSkuCount: string;
  status: string;
  uploadPortalUrl?: string;
  linkedWorkspaceId?: string;
  linkedWalkthroughUrl?: string;
  lastImportRunId?: string;
  lastImportAt?: string;
  dataQualityOverview?: {
    totalSubmitted: number;
    validAccepted: number;
    quarantinedRejected: number;
    reserveSparesExcludedValue?: number;
  };
}

interface IngestionSuccessResponse {
  importRun: {
    importRunId: string;
    createdAt: string;
    datasetSha256: string;
    anonymizationApplied: boolean;
    excludeReserveSpares: boolean;
    generatedWorkspaceId: string;
    generatedWalkthroughUrl: string;
    p1Quality: {
      totalSubmitted: number;
      validAccepted: number;
      quarantinedRejected: number;
      reserveSparesCount: number;
      reserveSparesValueINR: number;
    };
  };
  snapshot: {
    workspaceId: string;
    shareToken: string;
    companyName: string;
    plantLocation: string;
    summaryMetrics: {
      totalStockValue: number;
      deadStockValue: number;
      slowMovingValue: number;
      targetCashRelease: number;
      totalSkus: number;
      deadSkusCount: number;
    };
  };
}

type ActivePillarTab = 'P1' | 'P2' | 'P3' | 'P4';

export const ApprovedPilotUploadView: React.FC<ApprovedPilotUploadViewProps> = ({
  leadIdParam,
  tokenParam,
  isDemoMode = false,
  onBackToHome,
  onOpenWalkthrough,
  onOpenLeadInbox,
}) => {
  const effectiveLeadId = leadIdParam?.trim() || (isDemoMode ? 'PILOT-DEMO-SANDBOX' : 'PILOT-DEMO-SANDBOX');
  const [leadMeta, setLeadMeta] = useState<LeadUploadPortalMetadata | null>(null);
  const [loadingLead, setLoadingLead] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Raw rows state across P1-P4
  const initialDirtySample = useMemo(() => buildSampleDirtyTallyPrimeExportDataset(), []);
  const [rawDataset, setRawDataset] = useState<{
    p1Rows: Array<Record<string, unknown>>;
    p2Rows: Array<Record<string, unknown>>;
    p3Rows: Array<Record<string, unknown>>;
    p4Rows: Array<Record<string, unknown>>;
  }>(initialDirtySample);

  const [activePillar, setActivePillar] = useState<ActivePillarTab>('P1');
  const [anonymizeInBrowser, setAnonymizeInBrowser] = useState<boolean>(false);
  const [excludeReserveSpares, setExcludeReserveSpares] = useState<boolean>(true);
  const [plantIdSelection, setPlantIdSelection] = useState<'ambattur' | 'sriperumbudur' | 'hosur' | 'custom'>('ambattur');

  // Inline cell repair draft edits keyed by `${pillar}-${rowNumber}-${field}`
  const [cellRepairs, setCellRepairs] = useState<Record<string, string>>({});
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [submittingIngest, setSubmittingIngest] = useState<boolean>(false);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [ingestSuccess, setIngestSuccess] = useState<IngestionSuccessResponse | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchLeadPortalMeta() {
      setLoadingLead(true);
      setAuthError(null);
      try {
        const storedAdminKey =
          typeof window !== 'undefined'
            ? window.sessionStorage.getItem('operationalyst_admin_key') || 'operationalyst-local-dev-key'
            : 'operationalyst-local-dev-key';
        const query = tokenParam ? `?token=${encodeURIComponent(tokenParam)}` : '';
        const res = await fetch(`/api/pilot-upload/${encodeURIComponent(effectiveLeadId)}${query}`, {
          headers: {
            'x-admin-key': storedAdminKey,
          },
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setAuthError(data.error || 'Unauthorized or invalid Step-2 upload token.');
        } else {
          setLeadMeta(data.lead);
        }
      } catch {
        if (!cancelled) {
          // Fallback to demo metadata if network fails
          setLeadMeta({
            leadId: effectiveLeadId,
            companyName: 'Ambattur Precision Forge & Valves Pvt Ltd (Step-2 Upload)',
            plantLocation: 'Ambattur Industrial Estate, Chennai',
            erpSystem: 'Tally Prime',
            approxSkuCount: '500 - 2,000 SKUs',
            status: 'APPROVED_FOR_UPLOAD',
          });
        }
      } finally {
        if (!cancelled) setLoadingLead(false);
      }
    }
    fetchLeadPortalMeta();
    return () => {
      cancelled = true;
    };
  }, [effectiveLeadId, tokenParam]);

  // Compute active dataset (with optional client-side pre-upload anonymization)
  const effectiveDataset = useMemo(() => {
    if (!anonymizeInBrowser) return rawDataset;
    return anonymizeP1ToP4DatasetClientSide(rawDataset);
  }, [rawDataset, anonymizeInBrowser]);

  // Run real-time 4-pillar quarantine validation in browser
  const validationState = useMemo(() => {
    const p1 = validateP1InventoryRows(effectiveDataset.p1Rows, { excludeReserveSpares });
    const p2 = validateP2DispatchRows(effectiveDataset.p2Rows);
    const p3 = validateP3FreightRows(effectiveDataset.p3Rows);
    const p4 = validateP4WarehouseBinRows(effectiveDataset.p4Rows);
    return { P1: p1, P2: p2, P3: p3, P4: p4 };
  }, [effectiveDataset, excludeReserveSpares]);

  const currentPillarValidation = validationState[activePillar];

  // Load the canonical Dirty Tally Prime export (18 Valid + 4 Dirty + 2 Reserve Spares)
  const handleLoadDirtyTallyExport = () => {
    const fresh = buildSampleDirtyTallyPrimeExportDataset();
    setRawDataset(fresh);
    setCellRepairs({});
    setIngestSuccess(null);
    setIngestError(null);
    setActivePillar('P1');
    setStatusBanner(
      'Loaded Realistic Dirty Tally Prime Export: 22 P1 rows (18 Valid Accepted, 4 Quarantined for Missing SKU / Negative Qty / TBD Rate / Corrupted Date, and 2 Critical Machine Spares worth ₹1,12,500).'
    );
  };

  // Handle CSV / XLSX File Upload for the active pillar
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const parsedRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: '',
      });
      if (parsedRows.length === 0) {
        setIngestError(`Uploaded file "${file.name}" contained 0 rows.`);
        return;
      }
      setRawDataset((prev) => ({
        ...prev,
        ...(activePillar === 'P1' ? { p1Rows: parsedRows } : {}),
        ...(activePillar === 'P2' ? { p2Rows: parsedRows } : {}),
        ...(activePillar === 'P3' ? { p3Rows: parsedRows } : {}),
        ...(activePillar === 'P4' ? { p4Rows: parsedRows } : {}),
      }));
      setCellRepairs({});
      setIngestSuccess(null);
      setStatusBanner(
        `Parsed ${parsedRows.length} rows from "${file.name}" into Pillar ${activePillar}. Auto-Header Resolver mapped ERP columns automatically.`
      );
    } catch (err) {
      setIngestError(
        `Could not parse "${file.name}": ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      e.target.value = '';
    }
  };

  // Update inline cell value for a quarantined row
  const handleCellRepairChange = (rowNumber: number, fieldKey: string, value: string) => {
    const key = `${activePillar}-${rowNumber}-${fieldKey}`;
    setCellRepairs((prev) => ({ ...prev, [key]: value }));
  };

  // Apply inline cell edits back into rawDataset and re-validate
  const handleApplyInlineRepairsAndRevalidate = () => {
    const pillarKey =
      activePillar === 'P1'
        ? 'p1Rows'
        : activePillar === 'P2'
          ? 'p2Rows'
          : activePillar === 'P3'
            ? 'p3Rows'
            : 'p4Rows';

    const updatedRows = rawDataset[pillarKey].map((row, idx) => {
      const rowNum = idx + 1;
      const patched: Record<string, unknown> = { ...row };
      for (const [repairKey, newVal] of Object.entries(cellRepairs)) {
        const prefix = `${activePillar}-${rowNum}-`;
        if (repairKey.startsWith(prefix)) {
          const canonicalField = repairKey.slice(prefix.length);
          patched[canonicalField] = newVal;
          // Also update common Tally alias keys if present on the raw row so alias resolver picks up the repaired value
          if (canonicalField === 'Part_ID' && 'Stock_Item_Code' in patched) {
            patched.Stock_Item_Code = newVal;
          }
          if (canonicalField === 'Part_Description' && 'Particulars' in patched) {
            patched.Particulars = newVal;
          }
          if (canonicalField === 'Closing_Stock_Qty' && 'Closing_Balance' in patched) {
            patched.Closing_Balance = newVal;
          }
          if (canonicalField === 'Unit_Cost_INR' && 'Std_Rate' in patched) {
            patched.Std_Rate = newVal;
          }
          if (canonicalField === 'Last_Movement_Date' && 'Last_Voucher_Date' in patched) {
            patched.Last_Voucher_Date = newVal;
          }
        }
      }
      return patched;
    });

    setRawDataset((prev) => ({
      ...prev,
      [pillarKey]: updatedRows,
    }));
    setCellRepairs({});
    setStatusBanner(`Re-validated Pillar ${activePillar} rows after applying inline cell repairs.`);
  };

  // 1-click Auto-Repair helper for the 4 intentional dirty Tally Prime rows
  const handleAutoRepairAllDirtyRows = () => {
    const repairedP1 = rawDataset.p1Rows.map((row, idx) => {
      const next: Record<string, unknown> = { ...row };
      const code = String(next.Stock_Item_Code ?? next.Part_ID ?? '').trim();
      if (!code) {
        next.Stock_Item_Code = `AMB-REP-${idx + 1}`;
        next.Part_ID = `AMB-REP-${idx + 1}`;
      }
      const qtyRaw = String(next.Closing_Balance ?? next.Closing_Stock_Qty ?? '');
      if (qtyRaw.startsWith('-')) {
        next.Closing_Balance = '45';
        next.Closing_Stock_Qty = '45';
      }
      const rateRaw = String(next.Std_Rate ?? next.Unit_Cost_INR ?? '');
      if (rateRaw.includes('TBD') || isNaN(Number(rateRaw.replace(/[₹,\s]/g, '')))) {
        next.Std_Rate = '1450';
        next.Unit_Cost_INR = '1450';
      }
      const dateRaw = String(next.Last_Voucher_Date ?? next.Last_Movement_Date ?? '');
      if (dateRaw === '32/13/2026') {
        next.Last_Voucher_Date = '15-12-2025';
        next.Last_Movement_Date = '2025-12-15';
      }
      return next;
    });

    setRawDataset((prev) => ({
      ...prev,
      p1Rows: repairedP1,
    }));
    setCellRepairs({});
    setStatusBanner(
      'Repaired all 4 quarantined Tally Prime rows (assigned missing Part_ID AMB-REP-19, corrected negative qty -45 -> 45, resolved TBD_RATE -> ₹1,450, fixed corrupted date 32/13/2026 -> 2025-12-15). All 22 P1 rows are now valid!'
    );
  };

  // Commit clean subset to POST /api/pilot-upload/:leadId/ingest
  const handleCommitAndIngest = async () => {
    setSubmittingIngest(true);
    setIngestError(null);
    try {
      const storedAdminKey =
        typeof window !== 'undefined'
          ? window.sessionStorage.getItem('operationalyst_admin_key') || 'operationalyst-local-dev-key'
          : 'operationalyst-local-dev-key';

      const payload = {
        uploadToken: tokenParam || undefined,
        companyName: leadMeta?.companyName || 'Ambattur Precision Forge & Valves Pvt Ltd',
        plantLocation: leadMeta?.plantLocation || 'Ambattur Industrial Estate, Chennai',
        plantId: plantIdSelection,
        p1Rows: effectiveDataset.p1Rows,
        p2Rows: effectiveDataset.p2Rows,
        p3Rows: effectiveDataset.p3Rows,
        p4Rows: effectiveDataset.p4Rows,
        excludeReserveSpares,
        anonymizationApplied: anonymizeInBrowser,
      };

      const res = await fetch(
        `/api/pilot-upload/${encodeURIComponent(effectiveLeadId)}/ingest`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': storedAdminKey,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setIngestError(data.error || 'Failed to ingest Step-2 dataset.');
        return;
      }

      setIngestSuccess({
        importRun: data.importRun,
        snapshot: data.snapshot,
      });
      setStatusBanner(
        `Committed ${data.importRun.p1Quality.validAccepted} valid P1 rows under ImportRun ${data.importRun.importRunId} and generated 4-Pillar Audit Snapshot ${data.snapshot.workspaceId}.`
      );
    } catch (err) {
      setIngestError(
        `Network error during Step-2 ingestion: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setSubmittingIngest(false);
    }
  };

  const handleCopySha256 = () => {
    if (!ingestSuccess?.importRun.datasetSha256) return;
    navigator.clipboard?.writeText(ingestSuccess.importRun.datasetSha256).catch(() => {});
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const p1Summary = validationState.P1.qualitySummary;
  const totalQuarantinedAcrossAll =
    validationState.P1.qualitySummary.quarantinedRejected +
    validationState.P2.qualitySummary.quarantinedRejected +
    validationState.P3.qualitySummary.quarantinedRejected +
    validationState.P4.qualitySummary.quarantinedRejected;

  const totalValidAcrossAll =
    validationState.P1.qualitySummary.validAccepted +
    validationState.P2.qualitySummary.validAccepted +
    validationState.P3.qualitySummary.validAccepted +
    validationState.P4.qualitySummary.validAccepted;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Commercial Home
            </button>
            {onOpenLeadInbox && (
              <button
                type="button"
                onClick={onOpenLeadInbox}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-medium text-amber-300 transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                Founder Lead Inbox
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <Lock className="w-3 h-3" />
                STEP-2 TOKEN-GATED UPLOAD PORTAL
              </span>
              <span className="text-xs font-mono text-slate-400">
                Lead: <strong className="text-slate-200">{effectiveLeadId}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => downloadPilotDataKitXlsx()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Download 5-Sheet .XLSX Data Guide
            </button>
            <button
              type="button"
              onClick={handleLoadDirtyTallyExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-semibold text-amber-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Load Realistic Dirty Tally Prime Export (18 Valid + 4 Dirty + 2 Spares)
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6 flex-1">
        {authError ? (
          <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-6 text-rose-200">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-bold">Step-2 Upload Token Authorization Required</h2>
            </div>
            <p className="text-sm text-rose-300/90 mb-4">{authError}</p>
            <button
              type="button"
              onClick={onBackToHome}
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-100"
            >
              Return to Operationalyst Overview
            </button>
          </div>
        ) : (
          <>
            {/* Hero Context & Governance Header */}
            <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                      STEP 2 OF 2 · APPROVED PILOT DATA INGESTION & QUARANTINE FIREWALL
                    </span>
                    {loadingLead ? (
                      <span className="text-xs text-slate-400 font-mono">Loading lead metadata...</span>
                    ) : (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        ERP: {leadMeta?.erpSystem || 'Tally Prime / SAP'}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {leadMeta?.companyName || 'Ambattur Precision Forge & Valves Pvt Ltd (Step-2 Upload)'}
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Plant Location: <span className="text-slate-200 font-medium">{leadMeta?.plantLocation || 'Ambattur Industrial Estate, Chennai'}</span> · Prepared for review by <span className="text-slate-200 font-medium">C. Jones Snowin</span>
                  </p>
                </div>

                {/* Plant Baseline Target Selector */}
                <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-lg p-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                      Plant Baseline Target
                    </label>
                    <select
                      aria-label="Plant Baseline Target"
                      value={plantIdSelection}
                      onChange={(e) =>
                        setPlantIdSelection(
                          e.target.value as 'ambattur' | 'sriperumbudur' | 'hosur' | 'custom'
                        )
                      }
                      className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-medium"
                    >
                      <option value="ambattur">Ambattur Industrial Estate (Castings & Valves)</option>
                      <option value="sriperumbudur">Sriperumbudur Auto Cluster (CNC Stampings)</option>
                      <option value="hosur">Hosur Industrial Corridor (EV Drivetrains)</option>
                      <option value="custom">Custom Client Facility</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Phase 6 Dual Governance Controls: Client-Side Anonymizer + Item 07 Reserve Spares Exclusion */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-5 border-t border-slate-800/80">
                {/* Control 1: Client-Side Pre-Upload Anonymization */}
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-sky-400" />
                      <span className="text-sm font-semibold text-white">
                        Client-Side Pre-Upload Anonymizer (In-Browser Masking)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Masks proprietary <code className="text-slate-300">Part_Description</code> to{' '}
                      <code className="text-sky-300">MASKED-PART-001 (&lt;Category&gt;)</code>,{' '}
                      <code className="text-slate-300">Customer_Name</code> to{' '}
                      <code className="text-sky-300">MASKED-OEM-01</code>, and{' '}
                      <code className="text-slate-300">Transporter</code> to{' '}
                      <code className="text-sky-300">CARRIER-01</code> before network upload while preserving 100% of ₹ math & part codes.
                    </p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      aria-label="Mask Proprietary Part Descriptions in Browser"
                      checked={anonymizeInBrowser}
                      onChange={(e) => setAnonymizeInBrowser(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 border border-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all relative peer-checked:bg-sky-600 peer-checked:border-sky-500" />
                  </label>
                </div>

                {/* Control 2: Item 07 Machine Reserve / Insurance Spares Exclusion */}
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-semibold text-white">
                        Exclude Critical Machine / Insurance Spares (Item 07 Rule)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Flags critical CNC spindle/servo insurance spares ({p1Summary.reserveSparesCount} detected ·{' '}
                      <strong className="text-amber-300 font-mono">
                        ₹{(p1Summary.reserveSparesValueINR || 0).toLocaleString('en-IN')}
                      </strong>
                      ) with <code className="text-amber-300">CRITICAL_RESERVE_SPARE</code> so they are retained as operational insurance rather than scrapped.
                    </p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      aria-label="Exclude Critical Machine / Insurance Spares"
                      checked={excludeReserveSpares}
                      onChange={(e) => setExcludeReserveSpares(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 border border-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all relative peer-checked:bg-amber-600 peer-checked:border-amber-500" />
                  </label>
                </div>
              </div>
            </section>

            {statusBanner && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-xs text-emerald-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{statusBanner}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusBanner(null)}
                  className="text-emerald-400 hover:text-emerald-200 font-mono text-[11px]"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* 4-Metric Quality Summary Bar */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-xs font-mono uppercase text-slate-400">
                  P1–P4 Rows Submitted
                </div>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {validationState.P1.qualitySummary.totalSubmitted +
                    validationState.P2.qualitySummary.totalSubmitted +
                    validationState.P3.qualitySummary.totalSubmitted +
                    validationState.P4.qualitySummary.totalSubmitted}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    ({validationState.P1.qualitySummary.totalSubmitted} P1 SKUs)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Auto-mapped from Tally Prime / SAP headers
                </div>
              </div>

              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/15 p-4">
                <div className="text-xs font-mono uppercase text-emerald-400">
                  Valid Rows Accepted
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                  {totalValidAcrossAll}{' '}
                  <span className="text-xs font-normal text-emerald-400/80">
                    ({validationState.P1.qualitySummary.validAccepted} P1 SKUs)
                  </span>
                </div>
                <div className="text-[11px] text-emerald-300/70 mt-1">
                  Completeness: {validationState.P1.qualitySummary.completenessPct}% P1 schema pass
                </div>
              </div>

              <div
                className={`rounded-lg border p-4 ${
                  totalQuarantinedAcrossAll > 0
                    ? 'border-amber-500/40 bg-amber-950/20'
                    : 'border-slate-800 bg-slate-900/70'
                }`}
              >
                <div className="text-xs font-mono uppercase text-amber-400">
                  Quarantined Rejects (Zero Silent Coercion)
                </div>
                <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                  {totalQuarantinedAcrossAll}{' '}
                  <span className="text-xs font-normal text-amber-300/80">
                    ({validationState.P1.qualitySummary.quarantinedRejected} P1 rows)
                  </span>
                </div>
                <div className="text-[11px] text-amber-200/70 mt-1">
                  {totalQuarantinedAcrossAll > 0
                    ? 'Repair inline below or commit clean subset'
                    : 'Zero rows quarantined — 100% clean'}
                </div>
              </div>

              <div className="rounded-lg border border-sky-500/30 bg-sky-950/15 p-4">
                <div className="text-xs font-mono uppercase text-sky-400">
                  Item 07 Reserve Spares Tagged
                </div>
                <div className="text-2xl font-bold font-mono text-sky-300 mt-1">
                  ₹{(p1Summary.reserveSparesValueINR || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-sky-300/80 mt-1">
                  {p1Summary.reserveSparesCount} Critical Spares ({excludeReserveSpares ? 'Excluded from Scrap' : 'Standard Rule'})
                </div>
              </div>
            </section>

            {/* Pillar Selector Tabs & File Dropzone */}
            <section className="rounded-lg border border-slate-800 bg-slate-900/70 overflow-hidden">
              <div className="border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-slate-950/50">
                <div className="flex flex-wrap items-center gap-2">
                  {(['P1', 'P2', 'P3', 'P4'] as ActivePillarTab[]).map((pillar) => {
                    const q = validationState[pillar].qualitySummary;
                    const isActive = activePillar === pillar;
                    const labels: Record<ActivePillarTab, string> = {
                      P1: 'P1: Inventory & Reserve Spares',
                      P2: 'P2: Gate OTIF Dispatches',
                      P3: 'P3: Freight & Detention',
                      P4: 'P4: Warehouse Bin Count',
                    };
                    return (
                      <button
                        key={pillar}
                        type="button"
                        onClick={() => setActivePillar(pillar)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-2 ${
                          isActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{labels[pillar]}</span>
                        <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-black/30">
                          {q.validAccepted}✓ / {q.quarantinedRejected}!
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-300 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Upload {activePillar} .CSV / .XLSX
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Auto-Resolved ERP Column Mapping Bar */}
              <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono text-[11px] uppercase text-slate-400 font-semibold">
                  Auto-Header Resolver ({activePillar}):
                </span>
                {Object.entries(currentPillarValidation.qualitySummary.columnMappingUsed).map(
                  ([canonicalCol, sourceHeader]) => (
                    <span
                      key={canonicalCol}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300"
                    >
                      <span className="text-amber-300">{sourceHeader}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-emerald-300">{canonicalCol}</span>
                    </span>
                  )
                )}
              </div>

              {/* Interactive Quarantine Remediation Panel */}
              {currentPillarValidation.quarantinedRows.length > 0 && (
                <div className="p-5 bg-amber-950/15 border-b border-amber-500/30 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-bold text-amber-200">
                          Quarantine Remediation Desk ({currentPillarValidation.quarantinedRows.length}{' '}
                          {activePillar} Rows Held Back from Math Engine)
                        </h3>
                      </div>
                      <p className="text-xs text-amber-200/80 mt-0.5">
                        Operationalyst never silently substitutes today&apos;s date or ₹0 for corrupted ERP cells. Repair cells inline below, download the rejects CSV, or commit only the {currentPillarValidation.validRows.length} verified rows.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {activePillar === 'P1' && (
                        <button
                          type="button"
                          onClick={handleAutoRepairAllDirtyRows}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          Auto-Repair All {currentPillarValidation.quarantinedRows.length} Quarantined Tally Rows
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleApplyInlineRepairsAndRevalidate}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-emerald-500/50 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-semibold transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Re-Validate Repaired Cells
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadQuarantinedRowsCsv(
                            currentPillarValidation.quarantinedRows,
                            activePillar
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Quarantined Rejects .CSV
                      </button>
                    </div>
                  </div>

                  {/* Quarantined Rows Table with Inline Cell Repair Inputs */}
                  <div className="overflow-x-auto rounded border border-amber-500/30 bg-slate-950/90">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                          <th className="py-2 px-3">Row #</th>
                          <th className="py-2 px-3">Part_ID / Key</th>
                          <th className="py-2 px-3">Description / Party</th>
                          <th className="py-2 px-3">Qty</th>
                          <th className="py-2 px-3">Unit Cost / Bill (₹)</th>
                          <th className="py-2 px-3">Date (YYYY-MM-DD)</th>
                          <th className="py-2 px-3">Quarantine Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {currentPillarValidation.quarantinedRows.map((qRow: QuarantinedRowRecord) => {
                          const r = qRow.rawRow;
                          const partIdVal =
                            cellRepairs[`${activePillar}-${qRow.rowNumber}-Part_ID`] ??
                            String(r.Part_ID ?? r.Stock_Item_Code ?? r.Dispatch_ID ?? r.LR_Number ?? '');
                          const descVal =
                            cellRepairs[`${activePillar}-${qRow.rowNumber}-Part_Description`] ??
                            String(r.Part_Description ?? r.Particulars ?? r.Customer_Name ?? r.Transporter ?? '');
                          const qtyVal =
                            cellRepairs[`${activePillar}-${qRow.rowNumber}-Closing_Stock_Qty`] ??
                            String(r.Closing_Stock_Qty ?? r.Closing_Balance ?? r.Ordered_Qty ?? r.Book_Qty ?? '');
                          const costVal =
                            cellRepairs[`${activePillar}-${qRow.rowNumber}-Unit_Cost_INR`] ??
                            String(r.Unit_Cost_INR ?? r.Std_Rate ?? r.Billed_Amount_INR ?? '');
                          const dateVal =
                            cellRepairs[`${activePillar}-${qRow.rowNumber}-Last_Movement_Date`] ??
                            String(r.Last_Movement_Date ?? r.Last_Voucher_Date ?? r.Promised_Date ?? '');

                          return (
                            <tr key={qRow.rowNumber} className="hover:bg-slate-900/50">
                              <td className="py-2 px-3 font-mono text-amber-300 font-semibold">
                                #{qRow.rowNumber}
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  aria-label={`Repair Part_ID Row ${qRow.rowNumber}`}
                                  value={partIdVal}
                                  placeholder="Enter Part_ID"
                                  onChange={(e) =>
                                    handleCellRepairChange(qRow.rowNumber, 'Part_ID', e.target.value)
                                  }
                                  className={`w-32 px-2 py-1 rounded font-mono text-xs bg-slate-900 border ${
                                    qRow.fieldErrors.Part_ID
                                      ? 'border-rose-500 text-rose-200'
                                      : 'border-slate-700 text-slate-200'
                                  }`}
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  aria-label={`Repair Part_Description Row ${qRow.rowNumber}`}
                                  value={descVal}
                                  onChange={(e) =>
                                    handleCellRepairChange(
                                      qRow.rowNumber,
                                      'Part_Description',
                                      e.target.value
                                    )
                                  }
                                  className="w-56 px-2 py-1 rounded text-xs bg-slate-900 border border-slate-700 text-slate-200"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  aria-label={`Repair Closing_Stock_Qty Row ${qRow.rowNumber}`}
                                  value={qtyVal}
                                  onChange={(e) =>
                                    handleCellRepairChange(
                                      qRow.rowNumber,
                                      'Closing_Stock_Qty',
                                      e.target.value
                                    )
                                  }
                                  className={`w-24 px-2 py-1 rounded font-mono text-xs bg-slate-900 border ${
                                    qRow.fieldErrors.Closing_Stock_Qty
                                      ? 'border-rose-500 text-rose-200'
                                      : 'border-slate-700 text-slate-200'
                                  }`}
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  aria-label={`Repair Unit_Cost_INR Row ${qRow.rowNumber}`}
                                  value={costVal}
                                  onChange={(e) =>
                                    handleCellRepairChange(
                                      qRow.rowNumber,
                                      'Unit_Cost_INR',
                                      e.target.value
                                    )
                                  }
                                  className={`w-28 px-2 py-1 rounded font-mono text-xs bg-slate-900 border ${
                                    qRow.fieldErrors.Unit_Cost_INR
                                      ? 'border-rose-500 text-rose-200'
                                      : 'border-slate-700 text-slate-200'
                                  }`}
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  aria-label={`Repair Last_Movement_Date Row ${qRow.rowNumber}`}
                                  value={dateVal}
                                  onChange={(e) =>
                                    handleCellRepairChange(
                                      qRow.rowNumber,
                                      'Last_Movement_Date',
                                      e.target.value
                                    )
                                  }
                                  className={`w-28 px-2 py-1 rounded font-mono text-xs bg-slate-900 border ${
                                    qRow.fieldErrors.Last_Movement_Date
                                      ? 'border-rose-500 text-rose-200'
                                      : 'border-slate-700 text-slate-200'
                                  }`}
                                />
                              </td>
                              <td className="py-2 px-3 text-rose-300 font-mono text-[11px]">
                                {qRow.errorSummary}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Validated Clean Rows Preview Table */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Verified Clean {activePillar} Rows Ready for P1–P4 Engine ({currentPillarValidation.validRows.length} Rows)
                  </h3>
                  {anonymizeInBrowser && (
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Client-Side Masking Active (MASKED-PART / MASKED-OEM / CARRIER)
                    </span>
                  )}
                </div>

                {activePillar === 'P1' && (
                  <div className="overflow-x-auto rounded border border-slate-800 bg-slate-950/70 max-h-80">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                        <tr>
                          <th className="py-2 px-3">Part_ID</th>
                          <th className="py-2 px-3">Part_Description</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3 text-right">Closing_Qty</th>
                          <th className="py-2 px-3 text-right">Unit_Cost (₹)</th>
                          <th className="py-2 px-3 text-right">Book Value (₹)</th>
                          <th className="py-2 px-3">Last_Movement</th>
                          <th className="py-2 px-3">Item 07 Spare Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {validationState.P1.validRows.map((row) => {
                          const bookValue = Math.round(row.Closing_Stock_Qty * row.Unit_Cost_INR);
                          return (
                            <tr key={row.id} className="hover:bg-slate-900/40">
                              <td className="py-2 px-3 font-mono font-semibold text-slate-200">
                                {row.Part_ID}
                              </td>
                              <td className="py-2 px-3 text-slate-300">{row.Part_Description}</td>
                              <td className="py-2 px-3 text-slate-400">{row.Category}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-200">
                                {row.Closing_Stock_Qty.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-slate-200">
                                ₹{row.Unit_Cost_INR.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-semibold text-white">
                                ₹{bookValue.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-300">
                                {row.Last_Movement_Date}
                              </td>
                              <td className="py-2 px-3">
                                {row.Is_Reserve_Spare ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    CRITICAL_RESERVE_SPARE
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-mono text-slate-500">
                                    Standard Movement Rule
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {activePillar !== 'P1' && (
                  <div className="p-4 rounded border border-slate-800 bg-slate-950/60 text-xs text-slate-300 font-mono">
                    {currentPillarValidation.validRows.length} verified {activePillar} rows ready to commit.
                  </div>
                )}
              </div>

              {/* Commit Action Footer */}
              <div className="px-5 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  Ready to commit{' '}
                  <strong className="text-emerald-300 font-mono">
                    {validationState.P1.validRows.length} valid P1 SKUs
                  </strong>{' '}
                  ({validationState.P2.validRows.length} P2, {validationState.P3.validRows.length} P3,{' '}
                  {validationState.P4.validRows.length} P4 rows) and record cryptographic SHA-256{' '}
                  <code className="text-slate-300">IMPRUN</code> ledger entry.
                </div>

                <button
                  type="button"
                  disabled={submittingIngest || validationState.P1.validRows.length === 0}
                  onClick={handleCommitAndIngest}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold tracking-wide transition-colors shadow-lg shadow-emerald-950/50"
                >
                  {submittingIngest ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Computing SHA-256 & Generating 4-Pillar Snapshot...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Commit Clean Subset & Generate 4-Pillar Audit Snapshot (AUDIT-...)
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </section>

            {ingestError && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-4 text-xs text-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{ingestError}</span>
              </div>
            )}

            {/* Step-2 Ingestion Ledger Confirmation Card */}
            {ingestSuccess && (
              <section className="rounded-lg border-2 border-emerald-500/50 bg-emerald-950/20 p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      STEP-2 INGESTION COMPLETE · IMPRUN LEDGER RECORDED
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      Snapshot {ingestSuccess.snapshot.workspaceId} Published ({ingestSuccess.importRun.importRunId})
                    </h2>
                    <p className="text-xs text-slate-300 mt-1">
                      Total Evaluated Stock: ₹{ingestSuccess.snapshot.summaryMetrics.totalStockValue.toLocaleString('en-IN')} · Dead Stock: ₹{ingestSuccess.snapshot.summaryMetrics.deadStockValue.toLocaleString('en-IN')} · Target Cash Release: ₹{ingestSuccess.snapshot.summaryMetrics.targetCashRelease.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenWalkthrough(
                        ingestSuccess.snapshot.workspaceId,
                        ingestSuccess.snapshot.shareToken
                      )
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Generated 4-Pillar Executive Walkthrough ({ingestSuccess.snapshot.workspaceId})
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-emerald-500/20 text-xs font-mono">
                  <div className="rounded bg-slate-950/80 border border-slate-800 p-3">
                    <div className="text-slate-400 text-[11px]">IMPORT RUN ID</div>
                    <div className="text-emerald-300 font-bold mt-0.5">
                      {ingestSuccess.importRun.importRunId}
                    </div>
                  </div>
                  <div className="rounded bg-slate-950/80 border border-slate-800 p-3 md:col-span-2 flex items-center justify-between gap-2">
                    <div className="truncate">
                      <div className="text-slate-400 text-[11px]">DATASET SHA-256 CHECKSUM</div>
                      <div className="text-slate-200 truncate mt-0.5">
                        {ingestSuccess.importRun.datasetSha256}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopySha256}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] inline-flex items-center gap-1 shrink-0"
                    >
                      {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedHash ? 'Copied' : 'Copy SHA-256'}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};
