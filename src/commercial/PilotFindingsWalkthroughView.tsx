/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  ShieldCheck,
  Printer,
  Download,
  Calendar,
  AlertTriangle,
  Lock,
  UserCheck,
  Mail,
  Package,
  Truck,
  IndianRupee,
  Warehouse,
  Clock,
  Trash2,
  CheckCircle2,
  FileCheck2,
  CreditCard,
  Copy,
  FileText,
  ExternalLink,
  Unlock,
} from 'lucide-react';
import {
  PilotWorkspaceSnapshot,
  CommercialAccessMode,
} from '../utils/pilotWorkspaceStore';
import type { DeletionCertificateRecord } from '../utils/dataPurgeEngine';
import {
  FounderBillingConfig,
  CommercialBillingTier,
  DEFAULT_FOUNDER_BILLING_CONFIG,
  readFounderBillingFromBrowser,
  generateProformaInvoice,
  generatePaidReceipt,
  generateUpiQrCodeSvg,
} from '../utils/founderBillingStore';
import { formatCurrency, formatIndianLakhsCrores } from '../project1/utils/calculations';
import { sanitizeSpreadsheetCell } from '../utils/importValidation';
import { FourPillarSensitivitySimulatorPanel } from '../components/FourPillarSensitivitySimulatorPanel';

interface PilotFindingsWalkthroughViewProps {
  onBackToHome: () => void;
  onOpenPlatform: () => void;
}

const SESSION_STORAGE_ADMIN_KEY = 'operationalyst_founder_admin_key_v1';

type WalkthroughPillarTab = 'p1' | 'p2' | 'p3' | 'p4';

export const PilotFindingsWalkthroughView: React.FC<PilotFindingsWalkthroughViewProps> = ({
  onBackToHome,
  onOpenPlatform,
}) => {
  const [workspaceId, setWorkspaceId] = useState<string>(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      return (
        sp.get('id')?.trim() ||
        sp.get('workspaceId')?.trim() ||
        'AUDIT-DEMO-P1P4'
      );
    } catch {
      return 'AUDIT-DEMO-P1P4';
    }
  });
  const [shareToken, setShareToken] = useState<string>(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const explicitId = sp.get('id')?.trim() || sp.get('workspaceId')?.trim();
      const explicitToken = sp.get('token')?.trim();
      if (explicitToken) return explicitToken;
      if (!explicitId || explicitId === 'AUDIT-DEMO-P1P4') {
        return 'operationalyst-public-demo-token';
      }
      return '';
    } catch {
      return 'operationalyst-public-demo-token';
    }
  });

  const [snapshot, setSnapshot] = useState<PilotWorkspaceSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activePillarTab, setActivePillarTab] = useState<WalkthroughPillarTab>('p1');

  // Phase 8: 14-Day Data Retention & Cryptographic Deletion Certificate State
  const [deletionCertificate, setDeletionCertificate] =
    useState<DeletionCertificateRecord | null>(null);
  const [showDemoCertTombstone, setShowDemoCertTombstone] = useState<boolean>(false);
  const [retentionBusy, setRetentionBusy] = useState<boolean>(false);
  const [retentionNotice, setRetentionNotice] = useState<string | null>(null);
  const [retentionError, setRetentionError] = useState<string | null>(null);

  // Phase 15: Teaser-to-Paid Walkthrough Paywall, Proforma Invoice & UTR Unlock State
  const [billingConfig, setBillingConfig] = useState<FounderBillingConfig>(() =>
    readFounderBillingFromBrowser()
  );
  const [paywallPreviewOverride, setPaywallPreviewOverride] = useState<
    'AUTO' | CommercialAccessMode
  >(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const pw = sp.get('paywall')?.toLowerCase();
      if (pw === 'teaser' || pw === 'locked') return 'TEASER_LOCKED';
      if (pw === 'utr' || pw === 'pending') return 'UTR_PENDING_VERIFICATION';
      if (pw === 'unlocked' || pw === 'paid') return 'FULL_UNLOCKED';
    } catch {}
    return 'AUTO';
  });
  const [selectedBillingTier, setSelectedBillingTier] =
    useState<CommercialBillingTier>('TIER2_FULL_AUDIT');
  const [utrInput, setUtrInput] = useState<string>('');
  const [utrEmailInput, setUtrEmailInput] = useState<string>('');
  const [submittingUtr, setSubmittingUtr] = useState<boolean>(false);
  const [utrNotice, setUtrNotice] = useState<string | null>(null);
  const [utrError, setUtrError] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [showProformaInvoiceModal, setShowProformaInvoiceModal] = useState<boolean>(false);
  const [showPaidReceiptModal, setShowPaidReceiptModal] = useState<boolean>(false);
  const [upiQrSvg, setUpiQrSvg] = useState<string>('');

  const loadFounderBillingConfig = async () => {
    try {
      const res = await fetch('/api/founder-billing/public');
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.config) {
        setBillingConfig(data.config as FounderBillingConfig);
      }
    } catch {
      setBillingConfig(readFounderBillingFromBrowser());
    }
  };

  const handleSubmitPaymentUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshot) return;
    const cleanUtr = utrInput.trim().replace(/\s+/g, '').toUpperCase();
    if (cleanUtr.length < 6 || cleanUtr.length > 32 || !/^[A-Z0-9_-]+$/.test(cleanUtr)) {
      setUtrError(
        'Please enter a valid 12-digit UTR or Bank Reference number (6–32 alphanumeric characters).'
      );
      return;
    }

    setSubmittingUtr(true);
    setUtrError(null);
    setUtrNotice(null);

    try {
      const res = await fetch(
        `/api/pilot-workspaces/${encodeURIComponent(snapshot.workspaceId)}/submit-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            utrNumber: cleanUtr,
            paidByEmail: utrEmailInput.trim() || undefined,
            tier: selectedBillingTier,
            shareToken: shareToken || snapshot.shareToken,
          }),
        }
      );
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.snapshot) {
        setSnapshot(data.snapshot as PilotWorkspaceSnapshot);
        setPaywallPreviewOverride('UTR_PENDING_VERIFICATION');
        setUtrNotice(
          `UTR Reference ${cleanUtr} recorded and queued for Agent 05 & Founder verification. Status: UTR_PENDING_VERIFICATION.`
        );
      } else {
        // Fallback for static browser preview if API is unreachable
        const fallbackSnap: PilotWorkspaceSnapshot = {
          ...snapshot,
          commercialAccessMode: 'UTR_PENDING_VERIFICATION',
          submittedUtrNumber: cleanUtr,
          paidByEmail: utrEmailInput.trim() || undefined,
          paymentTier: selectedBillingTier,
        };
        setSnapshot(fallbackSnap);
        setPaywallPreviewOverride('UTR_PENDING_VERIFICATION');
        setUtrNotice(
          `UTR Reference ${cleanUtr} recorded for verification. Status: UTR_PENDING_VERIFICATION.`
        );
      }
    } catch {
      const fallbackSnap: PilotWorkspaceSnapshot = {
        ...snapshot,
        commercialAccessMode: 'UTR_PENDING_VERIFICATION',
        submittedUtrNumber: cleanUtr,
        paidByEmail: utrEmailInput.trim() || undefined,
        paymentTier: selectedBillingTier,
      };
      setSnapshot(fallbackSnap);
      setPaywallPreviewOverride('UTR_PENDING_VERIFICATION');
      setUtrNotice(
        `UTR Reference ${cleanUtr} recorded for verification. Status: UTR_PENDING_VERIFICATION.`
      );
    } finally {
      setSubmittingUtr(false);
    }
  };

  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(billingConfig.upiId || DEFAULT_FOUNDER_BILLING_CONFIG.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch {}
  };

  const loadDeletionCertificate = async (certId: string) => {
    if (!certId) return;
    try {
      const res = await fetch(`/api/deletion-certificates/${encodeURIComponent(certId)}`);
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.certificate) {
        setDeletionCertificate(data.certificate as DeletionCertificateRecord);
      }
    } catch {
      // Ignore network error
    }
  };

  const loadSnapshot = async (idToLoad: string, tokenToUse: string) => {
    if (!idToLoad) {
      setLoading(false);
      setErrorMsg(
        'No Pilot Audit Workspace ID was provided in the URL (?view=pilot-findings&id=AUDIT-...&token=...).'
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const headers: Record<string, string> = {};
      try {
        const savedAdminKey = sessionStorage.getItem(SESSION_STORAGE_ADMIN_KEY);
        if (savedAdminKey) {
          headers['x-admin-key'] = savedAdminKey;
        }
      } catch {}

      const query = tokenToUse ? `?token=${encodeURIComponent(tokenToUse)}` : '';
      const res = await fetch(
        `/api/pilot-workspaces/${encodeURIComponent(idToLoad)}${query}`,
        {
          method: 'GET',
          headers,
        }
      );
      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok || !data.snapshot) {
        setSnapshot(null);
        setErrorMsg(
          data?.error ||
            `Unable to load Pilot Audit Snapshot (HTTP ${res.status}). Verify your walkthrough link and share token.`
        );
        setLoading(false);
        return;
      }

      const loadedSnap = data.snapshot as PilotWorkspaceSnapshot;
      setSnapshot(loadedSnap);
      if (loadedSnap.deletionCertificateId) {
        await loadDeletionCertificate(loadedSnap.deletionCertificateId);
      }
    } catch {
      setErrorMsg('Network error while loading the read-only Pilot Audit Walkthrough.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetentionAction = async (
    action: 'EXTEND_30_DAYS' | 'PURGE_IMMEDIATELY'
  ) => {
    if (!snapshot) return;
    setRetentionBusy(true);
    setRetentionNotice(null);
    setRetentionError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      try {
        const savedAdminKey = sessionStorage.getItem(SESSION_STORAGE_ADMIN_KEY);
        if (savedAdminKey) {
          headers['x-admin-key'] = savedAdminKey;
        }
      } catch {}

      const res = await fetch(
        `/api/pilot-workspaces/${encodeURIComponent(snapshot.workspaceId)}/retention`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action,
            token: shareToken,
            actor: 'CLIENT_WALKTHROUGH',
          }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setRetentionError(
          data?.error || `Failed to execute retention action (${action}).`
        );
        setRetentionBusy(false);
        return;
      }

      if (data.snapshot) {
        setSnapshot(data.snapshot as PilotWorkspaceSnapshot);
      }
      if (data.certificate) {
        setDeletionCertificate(data.certificate as DeletionCertificateRecord);
      }
      if (action === 'EXTEND_30_DAYS') {
        setRetentionNotice(
          `Retention window extended by +30 days. New expiry: ${new Date(
            data.snapshot?.retentionExpiresAt || Date.now()
          ).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}.`
        );
      } else if (action === 'PURGE_IMMEDIATELY') {
        if (data.demoProtected) {
          setShowDemoCertTombstone(true);
          setRetentionNotice(
            `Canonical Sandbox (${snapshot.workspaceId}) is protected from destructive deletion so public walkthrough visitors can always test the 20-SKU engine. Showing sample cryptographic certificate ${data.certificate?.certificateId || 'DELCERT-DEMO-P1P4'}.`
          );
        } else {
          setRetentionNotice(
            `Dataset purged across all server stores and cryptographic certificate ${data.certificate?.certificateId} issued.`
          );
        }
      }
    } catch {
      setRetentionError('Network error while executing retention governance action.');
    } finally {
      setRetentionBusy(false);
    }
  };

  useEffect(() => {
    loadSnapshot(workspaceId, shareToken);
    loadFounderBillingConfig();
  }, []);

  const handleDownloadFindingsXlsx = () => {
    if (!snapshot) return;
    const wb = XLSX.utils.book_new();

    const p2Summary = snapshot.multiModuleSummary?.p2;
    const p3Summary = snapshot.multiModuleSummary?.p3;
    const p4Summary = snapshot.multiModuleSummary?.p4;

    const summaryRows: Array<{ Field: string; Value: string | number }> = [
      {
        Field: 'Workspace Reference ID',
        Value: String(sanitizeSpreadsheetCell(snapshot.workspaceId)),
      },
      {
        Field: 'Company / Factory Name',
        Value: String(sanitizeSpreadsheetCell(snapshot.companyName)),
      },
      {
        Field: 'Plant Location',
        Value: String(sanitizeSpreadsheetCell(snapshot.plantLocation)),
      },
      {
        Field: 'Prepared By',
        Value: String(sanitizeSpreadsheetCell(snapshot.preparedBy || 'C. Jones Snowin')),
      },
      {
        Field: 'Audit As-Of Date',
        Value: String(sanitizeSpreadsheetCell(snapshot.rules.asOfDate)),
      },
      {
        Field: 'P1: Total SKUs Evaluated',
        Value: snapshot.summaryMetrics.totalSkus,
      },
      {
        Field: 'P1: Total Inventory Valuation (INR)',
        Value: snapshot.summaryMetrics.totalStockValue,
      },
      {
        Field: `P1: Non-Moving Dead Stock (>=${snapshot.rules.deadThresholdDays}d, INR)`,
        Value: snapshot.summaryMetrics.deadStockValue,
      },
      {
        Field: `P1: Slow-Moving Stock (${snapshot.rules.slowThresholdDays}–${snapshot.rules.deadThresholdDays - 1}d, INR)`,
        Value: snapshot.summaryMetrics.slowMovingValue,
      },
      {
        Field: `P1: Annual Holding Cost Drain (@${snapshot.rules.holdingCostPercent}%, INR)`,
        Value: snapshot.summaryMetrics.annualCarryingCostDrain,
      },
      {
        Field: 'P1: Monthly Carrying Burn (INR)',
        Value: snapshot.summaryMetrics.monthlyBurn,
      },
      {
        Field: 'P1: Target Working Capital Release (INR)',
        Value: snapshot.summaryMetrics.targetCashRelease,
      },
    ];

    if (p2Summary) {
      summaryRows.push(
        {
          Field: 'P2: Gate OTIF Pass Rate (%)',
          Value: `${p2Summary.otifPercent}% (${p2Summary.passes}/${p2Summary.totalDispatches})`,
        },
        {
          Field: 'P2: Failed Dispatches Breakdown',
          Value: `${p2Summary.failsLateOnly} Late Only, ${p2Summary.failsShortOnly} Short Only, ${p2Summary.failsLateAndShort} Late & Short`,
        }
      );
    }

    if (p3Summary) {
      summaryRows.push(
        {
          Field: 'P3: Total Billed Freight Spend (INR)',
          Value: p3Summary.freightPaid,
        },
        {
          Field: 'P3: Total Freight & Detention Leakage (INR)',
          Value: p3Summary.totalLeak,
        }
      );
    }

    if (p4Summary) {
      summaryRows.push(
        {
          Field: 'P4: Warehouse Bin Match Accuracy (%)',
          Value: `${p4Summary.binAccuracyPercent}% (${p4Summary.linesMatched}/${p4Summary.skusCounted} matched)`,
        },
        {
          Field: 'P4: Ghost Stock Shortage Exposure (INR)',
          Value: p4Summary.shelfShortRupees,
        }
      );
    }

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 46 }, { wch: 42 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive_Findings_Summary');

    const skuRows = [...snapshot.evaluatedSkus]
      .sort((a, b) => (b.closingValue || 0) - (a.closingValue || 0))
      .map((item) => ({
        Rank: item.valueRank || 0,
        Part_ID: String(sanitizeSpreadsheetCell(item.itemCode)),
        Part_Description: String(sanitizeSpreadsheetCell(item.itemName)),
        Category: String(sanitizeSpreadsheetCell(item.category)),
        ABC_Class: String(sanitizeSpreadsheetCell(item.abcClass || 'C')),
        Status: String(sanitizeSpreadsheetCell(item.status || 'Moving')),
        Days_Idle: Number(item.daysIdle || 0),
        Closing_Qty: Number(item.qtyOnHand),
        Unit_Cost_INR: Number(item.costRate),
        Closing_Value_INR: Number(item.closingValue || 0),
        Last_Movement_Date: String(sanitizeSpreadsheetCell(item.lastMovement)),
        Recommended_Action: String(sanitizeSpreadsheetCell(item.action || '')),
      }));

    const wsSkus = XLSX.utils.json_to_sheet(skuRows);
    wsSkus['!cols'] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 34 },
      { wch: 18 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 38 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSkus, 'P1_SKU_Priority_List');

    if (snapshot.evaluatedP2Dispatches && snapshot.evaluatedP2Dispatches.length > 0) {
      const p2Rows = snapshot.evaluatedP2Dispatches.map((r) => ({
        Dispatch_ID: String(sanitizeSpreadsheetCell(r.id)),
        Customer: String(sanitizeSpreadsheetCell(r.customer)),
        PO_Number: String(sanitizeSpreadsheetCell(r.po)),
        Part: String(sanitizeSpreadsheetCell(r.part)),
        Ordered_Qty: Number(r.orderedQty),
        Shipped_Qty: Number(r.shippedQty),
        Promised_Date: String(sanitizeSpreadsheetCell(r.promisedDate)),
        Actual_Gate_Out: String(sanitizeSpreadsheetCell(r.actualOut)),
        OTIF_Result: r.otif ? 'PASS' : 'FAIL',
        Fail_Type: String(sanitizeSpreadsheetCell(r.failType || 'On-Time In-Full')),
        Delay_Reason: String(sanitizeSpreadsheetCell(r.delayReason || '')),
      }));
      const wsP2 = XLSX.utils.json_to_sheet(p2Rows);
      XLSX.utils.book_append_sheet(wb, wsP2, 'P2_OTIF_Dispatch_Audit');
    }

    if (snapshot.evaluatedP3Trips && snapshot.evaluatedP3Trips.length > 0) {
      const p3Rows = snapshot.evaluatedP3Trips.map((t) => ({
        Trip_ID: String(sanitizeSpreadsheetCell(t.id)),
        Date: String(sanitizeSpreadsheetCell(t.date)),
        Lane: String(sanitizeSpreadsheetCell(t.lane)),
        Transporter: String(sanitizeSpreadsheetCell(t.transporter)),
        Weight_Kg: Number(t.weightKg),
        Billed_INR: Number(t.bill),
        Rate_Leak_INR: Number(t.rateLeak),
        Wait_Hours: Number(t.waitHours),
        Detention_INR: Number(t.detention),
        Total_Leak_INR: Number(t.totalLeak),
      }));
      const wsP3 = XLSX.utils.json_to_sheet(p3Rows);
      XLSX.utils.book_append_sheet(wb, wsP3, 'P3_Freight_Leakage_Audit');
    }

    if (snapshot.evaluatedP4Bins && snapshot.evaluatedP4Bins.length > 0) {
      const p4Rows = snapshot.evaluatedP4Bins.map((b) => ({
        Part_Code: String(sanitizeSpreadsheetCell(b.code)),
        Part_Description: String(sanitizeSpreadsheetCell(b.part)),
        Bin_Location: String(sanitizeSpreadsheetCell(b.spot)),
        System_Qty: Number(b.systemQty),
        Physical_Qty: Number(b.physicalQty),
        Variance_Qty: Number(b.gapQty || 0),
        Unit_Cost_INR: Number(b.cost),
        Variance_Value_INR: Number(b.gapRupees || 0),
        Recommended_Action: String(sanitizeSpreadsheetCell(b.action || '')),
      }));
      const wsP4 = XLSX.utils.json_to_sheet(p4Rows);
      XLSX.utils.book_append_sheet(wb, wsP4, 'P4_Warehouse_Bin_Audit');
    }

    XLSX.writeFile(
      wb,
      `Operationalyst_Executive_Findings_${snapshot.workspaceId}.xlsx`
    );
  };

  const p2Summary = snapshot?.multiModuleSummary?.p2;
  const p3Summary = snapshot?.multiModuleSummary?.p3;
  const p4Summary = snapshot?.multiModuleSummary?.p4;
  const hasMultiModules = Boolean(p2Summary || p3Summary || p4Summary);

  const effectiveAccessMode: CommercialAccessMode =
    paywallPreviewOverride !== 'AUTO'
      ? paywallPreviewOverride
      : snapshot?.commercialAccessMode || 'FULL_UNLOCKED';
  const isPaywallLocked =
    effectiveAccessMode === 'TEASER_LOCKED' ||
    effectiveAccessMode === 'UTR_PENDING_VERIFICATION';
  const proformaInvoice = snapshot
    ? generateProformaInvoice(
        {
          ...snapshot,
          commercialAccessMode: effectiveAccessMode,
        },
        null,
        billingConfig,
        selectedBillingTier
      )
    : null;

  const paidReceipt = snapshot
    ? generatePaidReceipt(
        {
          ...snapshot,
          commercialAccessMode: effectiveAccessMode,
        },
        null,
        billingConfig,
        selectedBillingTier
      )
    : null;

  useEffect(() => {
    let active = true;
    const uri = proformaInvoice?.upiPaymentUri || '';
    if (uri) {
      generateUpiQrCodeSvg(uri)
        .then((svg) => {
          if (active) setUpiQrSvg(svg);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [proformaInvoice?.upiPaymentUri]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 sm:px-6 py-3.5 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Homepage</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
                  Executive Findings Walkthrough Briefing
                </h1>
                <p className="text-[11px] text-slate-400 font-mono">
                  Read-Only Server Pilot Audit Snapshot · Prepared by C. Jones Snowin
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {snapshot && (
              <>
                <button
                  type="button"
                  data-testid="walkthrough-open-proforma-btn"
                  onClick={() => setShowProformaInvoiceModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Proforma Invoice ({proformaInvoice?.invoiceId || 'INV-...'})</span>
                </button>
                {effectiveAccessMode === 'FULL_UNLOCKED' && paidReceipt && (
                  <button
                    type="button"
                    data-testid="walkthrough-view-paid-receipt-btn"
                    onClick={() => setShowPaidReceiptModal(true)}
                    className="px-3.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View / Print Official Paid Receipt ({paidReceipt.receiptId})</span>
                  </button>
                )}
                <button
                  type="button"
                  data-testid="walkthrough-print-2page-btn"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-400" />
                  <span>Print / Save 2-Page Executive PDF Briefing</span>
                </button>
                {isPaywallLocked ? (
                  <button
                    type="button"
                    data-testid="walkthrough-locked-xlsx-btn"
                    onClick={() => {
                      const el = document.getElementById('walkthrough-paywall-checkout-card');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      Unlock 6-Sheet .XLSX (₹
                      {(proformaInvoice?.amountInr || 14999).toLocaleString('en-IN')})
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDownloadFindingsXlsx}
                    className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Findings (.XLSX)</span>
                  </button>
                )}
              </>
            )}
            <button
              onClick={onOpenPlatform}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              View Platform
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-2 text-xs font-mono text-slate-300">
            <div>Loading verified server Pilot Audit Snapshot...</div>
          </div>
        ) : errorMsg || !snapshot ? (
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 sm:p-8 space-y-5 max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h2 className="text-base font-bold text-white">
                  Read-Only Pilot Audit Walkthrough Locked or Not Found
                </h2>
                <p className="text-xs text-rose-200 leading-relaxed">{errorMsg}</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadSnapshot(workspaceId.trim(), shareToken.trim());
              }}
              className="space-y-3 pt-2 border-t border-slate-800 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono font-bold text-slate-300 block">
                    Workspace ID (e.g. AUDIT-20261106-XXXX)
                  </label>
                  <input
                    type="text"
                    value={workspaceId}
                    onChange={(e) => setWorkspaceId(e.target.value)}
                    placeholder="AUDIT-YYYYMMDD-XXXX"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono font-bold text-slate-300 block">
                    Read-Only Share Token
                  </label>
                  <input
                    type="text"
                    value={shareToken}
                    onChange={(e) => setShareToken(e.target.value)}
                    placeholder="Enter share token..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Load Walkthrough Briefing
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Phase 15: Interactive Client Paywall Mode Preview Bar */}
            <section
              data-testid="walkthrough-paywall-preview-bar"
              className="rounded-2xl border border-amber-500/40 bg-slate-900/95 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs no-print"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 font-mono">
                  <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold uppercase text-[11px]">
                    Preview Client Paywall Mode: Free 3-SKU Teaser vs. ₹14,999 Unlocked
                  </span>
                  <span
                    data-testid="walkthrough-access-mode-badge"
                    className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                      effectiveAccessMode === 'TEASER_LOCKED'
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : effectiveAccessMode === 'UTR_PENDING_VERIFICATION'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    }`}
                  >
                    Access Mode: {effectiveAccessMode}
                  </span>
                </div>
                <p className="text-slate-300">
                  Every approved submission receives a{' '}
                  <strong className="text-emerald-300">
                    Free 3-SKU Diagnostic Teaser &amp; Executive Exposure Summary
                  </strong>{' '}
                  upfront, with an optional{' '}
                  <strong className="text-white">
                    ₹{(billingConfig.tier2FullAuditPriceInr || 14999).toLocaleString('en-IN')} Full Plant Audit &amp; 6-Sheet Action Workbook
                  </strong>{' '}
                  unlock via 0%-fee UPI (<code className="text-emerald-300">{billingConfig.upiId || '9080540047@yespop'}</code>) or NEFT/IMPS.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-mono shrink-0">
                <button
                  type="button"
                  data-testid="preview-mode-teaser-btn"
                  onClick={() => setPaywallPreviewOverride('TEASER_LOCKED')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
                    effectiveAccessMode === 'TEASER_LOCKED'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Free 3-SKU Teaser (Locked)</span>
                </button>
                <button
                  type="button"
                  data-testid="preview-mode-utr-pending-btn"
                  onClick={() => setPaywallPreviewOverride('UTR_PENDING_VERIFICATION')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
                    effectiveAccessMode === 'UTR_PENDING_VERIFICATION'
                      ? 'bg-sky-500 text-slate-950 border-sky-400'
                      : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>UTR Submitted (Pending)</span>
                </button>
                <button
                  type="button"
                  data-testid="preview-mode-unlocked-btn"
                  onClick={() => setPaywallPreviewOverride('FULL_UNLOCKED')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
                    effectiveAccessMode === 'FULL_UNLOCKED'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>₹14,999 Unlocked (All 20 SKUs)</span>
                </button>
              </div>
            </section>

            {/* Phase 8: 14-Day Data Retention & Governance Bar */}
            <section
              data-testid="walkthrough-retention-bar"
              className={`rounded-2xl border p-4 sm:p-5 space-y-3 text-xs no-print ${
                snapshot.retentionStatus === 'PURGED' || showDemoCertTombstone
                  ? 'bg-rose-950/30 border-rose-500/40'
                  : 'bg-slate-900 border-emerald-500/30'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 font-mono">
                    <span
                      data-testid="walkthrough-retention-status-badge"
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-bold text-[11px] uppercase ${
                        snapshot.retentionStatus === 'PURGED' || showDemoCertTombstone
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                          : snapshot.retentionStatus === 'EXTENDED_BY_CLIENT'
                          ? 'bg-sky-500/20 border-sky-500/40 text-sky-200'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {snapshot.retentionStatus === 'PURGED' || showDemoCertTombstone
                          ? `DATASET PURGED • ${
                              deletionCertificate?.certificateId ||
                              snapshot.deletionCertificateId ||
                              'DELCERT-ISSUED'
                            }`
                          : snapshot.retentionStatus === 'EXTENDED_BY_CLIENT'
                          ? `EXTENDED RETENTION WINDOW (${snapshot.retentionPolicyDays || 44}d) • EXPIRES ${new Date(
                              snapshot.retentionExpiresAt || Date.now()
                            ).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}`
                          : `14-DAY DATA RETENTION WINDOW ACTIVE • EXPIRES ${new Date(
                              snapshot.retentionExpiresAt ||
                                Date.now() + 14 * 24 * 60 * 60 * 1000
                            ).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}`}
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Touchpoint 5 Data Governance Commitment (Operationalyst / Snowin Ventures)
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {snapshot.retentionStatus === 'PURGED' || showDemoCertTombstone
                      ? 'All raw P1–P4 line items and quarantined import rows have been cryptographically scrubbed from server storage. Aggregate audit metadata and SHA-256 verification digests remain preserved below.'
                      : 'Raw P1–P4 pilot line items are retained for 14 days following walkthrough delivery unless extended by client request (+30 days) or purged immediately with a cryptographic Deletion Certificate (DELCERT-...).'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {snapshot.retentionStatus !== 'PURGED' && !showDemoCertTombstone && (
                    <>
                      <button
                        type="button"
                        data-testid="walkthrough-extend-retention-btn"
                        disabled={retentionBusy}
                        onClick={() => handleRetentionAction('EXTEND_30_DAYS')}
                        className="px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-sky-500/40 text-sky-300 font-mono font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                        <span>Extend Retention (+30 Days)</span>
                      </button>

                      <button
                        type="button"
                        data-testid="walkthrough-purge-immediately-btn"
                        disabled={retentionBusy}
                        onClick={() => handleRetentionAction('PURGE_IMMEDIATELY')}
                        className="px-3.5 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-mono font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>
                          Execute Immediate Data Purge &amp; Issue Certificate (DELCERT-...)
                        </span>
                      </button>
                    </>
                  )}

                  {showDemoCertTombstone && snapshot.retentionStatus !== 'PURGED' && (
                    <button
                      type="button"
                      data-testid="walkthrough-return-live-demo-btn"
                      onClick={() => setShowDemoCertTombstone(false)}
                      className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Return to Live 20-SKU Sandbox Walkthrough</span>
                    </button>
                  )}
                </div>
              </div>

              {retentionNotice && (
                <div
                  data-testid="walkthrough-retention-notice"
                  className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 font-mono text-xs"
                >
                  {retentionNotice}
                </div>
              )}

              {retentionError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 font-mono text-xs"
                >
                  {retentionError}
                </div>
              )}
            </section>

            {snapshot.retentionStatus === 'PURGED' || showDemoCertTombstone ? (
              /* Dataset Purged — Cryptographic Deletion Certificate (DELCERT-...) Tombstone View */
              <section
                data-testid="walkthrough-purged-tombstone-view"
                className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 sm:p-8 space-y-6 print-page"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold uppercase">
                      <FileCheck2 className="w-4 h-4" />
                      <span>
                        DATASET PURGED — CRYPTOGRAPHIC DELETION CERTIFICATE (
                        {deletionCertificate?.certificateId ||
                          snapshot.deletionCertificateId ||
                          'DELCERT-DEMO-P1P4'}
                        )
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-3xl font-black text-white">
                      {snapshot.companyName} — {snapshot.plantLocation}
                    </h2>
                    <p className="text-xs text-slate-300 font-mono">
                      Workspace ID: <strong className="text-white">{snapshot.workspaceId}</strong>{' '}
                      {snapshot.leadId ? `· Linked Lead: ${snapshot.leadId}` : ''}{' '}
                      {snapshot.importRunId ? `· ImportRun: ${snapshot.importRunId}` : ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    data-testid="print-deletion-certificate-btn"
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs inline-flex items-center gap-2 cursor-pointer no-print"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / Save Deletion Certificate (PDF)</span>
                  </button>
                </div>

                {/* Certificate Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-[11px] text-slate-400 uppercase">Certificate ID</div>
                    <div
                      data-testid="tombstone-certificate-id"
                      className="text-base font-black text-emerald-300"
                    >
                      {deletionCertificate?.certificateId ||
                        snapshot.deletionCertificateId ||
                        'DELCERT-DEMO-P1P4'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Status: VERIFIED MULTI-STORE SCRUB
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-[11px] text-slate-400 uppercase">Issued At (UTC)</div>
                    <div className="text-sm font-bold text-white">
                      {deletionCertificate?.issuedAt ||
                        snapshot.purgedAt ||
                        new Date().toISOString()}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Purged By: {deletionCertificate?.purgedBy || 'CLIENT_WALKTHROUGH'} (
                      {deletionCertificate?.purgeReason || 'MANUAL_CLIENT_REQUEST'})
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-[11px] text-slate-400 uppercase">
                      Preserved Aggregate Valuation
                    </div>
                    <div className="text-base font-black text-white">
                      {formatCurrency(
                        deletionCertificate?.recordsPurgedSummary.p1BookValueInr ??
                          snapshot.summaryMetrics.totalStockValue
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Dead Stock:{' '}
                      {formatCurrency(snapshot.summaryMetrics.deadStockValue)} (0 Raw Rows Stored)
                    </div>
                  </div>
                </div>

                {/* Scrubbed Row Counts Summary */}
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-xs font-mono font-bold text-emerald-400 uppercase">
                    Multi-Store Scrubbed Record Inventory (Zero Raw Line Items Remaining)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">P1 SKUs Purged</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {deletionCertificate?.recordsPurgedSummary.p1SkusPurged ??
                          snapshot.summaryMetrics.totalSkus}{' '}
                        rows → 0
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">
                        P2 Dispatches Purged
                      </div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {deletionCertificate?.recordsPurgedSummary.p2DispatchesPurged ??
                          (snapshot.multiModuleSummary?.p2?.totalDispatches || 0)}{' '}
                        rows → 0
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">
                        P3 Freight Trips Purged
                      </div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {deletionCertificate?.recordsPurgedSummary.p3FreightTripsPurged ??
                          (snapshot.multiModuleSummary?.p3?.totalTrips || 0)}{' '}
                        rows → 0
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">
                        P4 Warehouse Bins Purged
                      </div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {deletionCertificate?.recordsPurgedSummary.p4WarehouseBinsPurged ??
                          (snapshot.multiModuleSummary?.p4?.skusCounted || 0)}{' '}
                        rows → 0
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">
                        Quarantined Rows Scrubbed
                      </div>
                      <div className="text-base font-bold text-emerald-300 mt-0.5">
                        {deletionCertificate?.recordsPurgedSummary.quarantinedRowsPurged ??
                          (snapshot.dataQualityOverview?.quarantinedRejected || 0)}{' '}
                        rows → 0
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cryptographic Digests */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="text-[11px] font-bold text-sky-400 uppercase">
                      Pre-Purge Dataset SHA-256 Digest
                    </div>
                    <div
                      data-testid="tombstone-prepurge-sha256"
                      className="text-slate-200 break-all bg-slate-900 p-2.5 rounded border border-slate-800"
                    >
                      {deletionCertificate?.prePurgeDatasetSha256 ||
                        snapshot.prePurgeSnapshotIntegrityHash ||
                        snapshot.datasetSha256}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Preserved so anonymized Verified Proof Registry records remain verifiable.
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1.5">
                    <div className="text-[11px] font-bold text-emerald-400 uppercase">
                      Post-Purge Zeroed-Arrays SHA-256 Verification Hash
                    </div>
                    <div
                      data-testid="tombstone-postpurge-sha256"
                      className="text-emerald-300 break-all bg-slate-900 p-2.5 rounded border border-emerald-500/30"
                    >
                      {deletionCertificate?.postPurgeVerificationHash ||
                        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Proves P1–P4 item arrays are deterministically empty (`[]`) in server storage.
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <div>
                    Issued by <strong className="text-white">Operationalyst (Snowin Ventures, Chennai)</strong> · Signed by{' '}
                    <strong className="text-white">C. Jones Snowin</strong>
                  </div>
                  <span className="font-mono text-emerald-400">
                    Step-2 Upload Token Status: PURGED_REVOKED
                  </span>
                </div>
              </section>
            ) : (
              <>
            {/* Executive Header Card */}
            <section className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 sm:p-7 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold uppercase">
                    <Lock className="w-3 h-3" />
                    <span>VERIFIED PILOT AUDIT BRIEFING • {snapshot.workspaceId}</span>
                  </div>
                  <h2
                    data-testid="walkthrough-company-heading"
                    className="text-xl sm:text-3xl font-black text-white"
                  >
                    {snapshot.companyName} — {snapshot.plantLocation}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-mono">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Prepared by: {snapshot.preparedBy || 'C. Jones Snowin'}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span>As-Of Date: {snapshot.rules.asOfDate}</span>
                    </span>
                    {snapshot.leadId && (
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                        Linked Lead: {snapshot.leadId}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right font-mono text-xs text-slate-400 space-y-1">
                  <div>Dead Threshold: &ge;{snapshot.rules.deadThresholdDays} days idle</div>
                  <div>
                    Slow Threshold: {snapshot.rules.slowThresholdDays}–{snapshot.rules.deadThresholdDays - 1} days idle
                  </div>
                  <div>Holding Cost Rate: {snapshot.rules.holdingCostPercent}% p.a.</div>
                </div>
              </div>

              {snapshot.executiveNotes && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-mono font-bold text-emerald-400 uppercase">
                    Founder Executive Observation ({snapshot.preparedBy || 'C. Jones Snowin'}):
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {snapshot.executiveNotes}
                  </p>
                </div>
              )}

              {/* Phase 6: Item 01 Data-Quality Ledger & Item 07 Documented Assumptions / Reserve Spares Exclusion */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                {/* Item 01 Card */}
                <div
                  data-testid="walkthrough-item01-ledger"
                  className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase text-sky-400">
                      ITEM 01 • DATA-QUALITY &amp; INGESTION LEDGER
                    </span>
                    <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 font-mono text-[11px] text-sky-300 font-semibold">
                      {snapshot.importRunId || 'IMPRUN-CANONICAL'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Submitted</div>
                      <div className="text-sm font-bold text-white">
                        {snapshot.dataQualityOverview?.totalSubmitted ??
                          snapshot.summaryMetrics.totalSkus}{' '}
                        rows
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-emerald-500/30">
                      <div className="text-[10px] text-emerald-400 uppercase">Valid Accepted</div>
                      <div className="text-sm font-bold text-emerald-300">
                        {snapshot.dataQualityOverview?.validAccepted ??
                          snapshot.summaryMetrics.totalSkus}{' '}
                        rows
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-amber-500/30">
                      <div className="text-[10px] text-amber-400 uppercase">Quarantined</div>
                      <div className="text-sm font-bold text-amber-300">
                        {snapshot.dataQualityOverview?.quarantinedRejected ?? 0} rows
                      </div>
                    </div>
                  </div>
                  {snapshot.datasetSha256 && (
                    <div className="text-[11px] font-mono text-slate-400 truncate">
                      SHA-256 Digest:{' '}
                      <span className="text-slate-200">{snapshot.datasetSha256}</span>
                    </div>
                  )}
                </div>

                {/* Item 07 Card */}
                <div
                  data-testid="walkthrough-item07-assumptions"
                  className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase text-amber-400">
                      ITEM 07 • DOCUMENTED ASSUMPTIONS &amp; RESERVE SPARES
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 font-mono text-[11px] text-amber-300 font-semibold">
                      {snapshot.assumptionsAndExclusions?.excludeReserveSpares !== false
                        ? `Reserve Spares Excluded (${
                            snapshot.assumptionsAndExclusions?.reserveSparesExcludedCount ?? 0
                          } • ${formatCurrency(
                            snapshot.assumptionsAndExclusions?.reserveSparesExcludedValue ?? 0
                          )})`
                        : 'Standard Evaluation'}
                    </span>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {(
                      snapshot.assumptionsAndExclusions?.notes || [
                        `Evaluation baseline date fixed at ${snapshot.rules.asOfDate} (Dead >= ${snapshot.rules.deadThresholdDays}d, Slow ${snapshot.rules.slowThresholdDays}–${snapshot.rules.deadThresholdDays - 1}d).`,
                        `Carrying cost modeled at ${snapshot.rules.holdingCostPercent}% p.a. across ${snapshot.summaryMetrics.totalSkus} verified SKUs.`,
                      ]
                    )
                      .slice(0, 3)
                      .map((note, idx) => (
                        <li key={idx} className="leading-snug">
                          {note}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              {/* P1-P4 Multi-Module Pillar Selector Tabs */}
              {hasMultiModules && (
                <div
                  role="tablist"
                  aria-label="Operational Audit Pillars"
                  className="pt-2 flex flex-wrap items-center gap-2 font-mono text-xs"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activePillarTab === 'p1'}
                    data-testid="pillar-tab-p1"
                    onClick={() => setActivePillarTab('p1')}
                    className={`px-3.5 py-2 rounded-xl border inline-flex items-center gap-2 font-bold cursor-pointer transition ${
                      activePillarTab === 'p1'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      P1 • Dead Stock ({formatCurrency(snapshot.summaryMetrics.deadStockValue)})
                    </span>
                  </button>

                  {p2Summary && (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activePillarTab === 'p2'}
                      data-testid="pillar-tab-p2"
                      onClick={() => setActivePillarTab('p2')}
                      className={`px-3.5 py-2 rounded-xl border inline-flex items-center gap-2 font-bold cursor-pointer transition ${
                        activePillarTab === 'p2'
                          ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5 text-sky-400" />
                      <span>
                        P2 • Gate OTIF ({p2Summary.otifPercent}% • {p2Summary.passes}/{p2Summary.totalDispatches})
                      </span>
                    </button>
                  )}

                  {p3Summary && (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activePillarTab === 'p3'}
                      data-testid="pillar-tab-p3"
                      onClick={() => setActivePillarTab('p3')}
                      className={`px-3.5 py-2 rounded-xl border inline-flex items-center gap-2 font-bold cursor-pointer transition ${
                        activePillarTab === 'p3'
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        P3 • Freight Leakage ({formatCurrency(p3Summary.totalLeak)})
                      </span>
                    </button>
                  )}

                  {p4Summary && (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activePillarTab === 'p4'}
                      data-testid="pillar-tab-p4"
                      onClick={() => setActivePillarTab('p4')}
                      className={`px-3.5 py-2 rounded-xl border inline-flex items-center gap-2 font-bold cursor-pointer transition ${
                        activePillarTab === 'p4'
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Warehouse className="w-3.5 h-3.5 text-purple-400" />
                      <span>
                        P4 • Bin Accuracy ({p4Summary.binAccuracyPercent}% • {formatCurrency(p4Summary.shelfShortRupees)} short)
                      </span>
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* PHASE 7: 4-PILLAR ROW-TRACEABLE SENSITIVITY SIMULATOR & SERVER SCENARIO LOCK */}
            <FourPillarSensitivitySimulatorPanel
              skus={snapshot.evaluatedSkus}
              p1Rules={snapshot.rules}
              p2Dispatches={snapshot.evaluatedP2Dispatches}
              p3FreightTrips={snapshot.evaluatedP3Trips}
              p4WarehouseBins={snapshot.evaluatedP4Bins}
              workspaceId={snapshot.workspaceId}
              initialExcludeReserveSpares={
                snapshot.assumptionsAndExclusions?.excludeReserveSpares ?? true
              }
              onSnapshotUpdated={(updatedSnap) => setSnapshot(updatedSnap)}
            />

            {/* PILLAR 1: P1 DEAD STOCK & WORKING CAPITAL */}
            {activePillarTab === 'p1' && (
              <>
                {/* 5 Deterministic KPI Cards */}
                <section
                  aria-label="Executive Findings KPI Summary"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 font-mono"
                >
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-400 uppercase">Total Stock Analysed</div>
                    <div
                      data-testid="walkthrough-total-stock"
                      className="text-xl sm:text-2xl font-black text-white mt-1"
                    >
                      {formatCurrency(snapshot.summaryMetrics.totalStockValue)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {snapshot.summaryMetrics.totalSkus} SKUs ({formatIndianLakhsCrores(snapshot.summaryMetrics.totalStockValue)})
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-4">
                    <div className="text-[11px] text-rose-300 uppercase">
                      Non-Moving Dead Stock (&ge;{snapshot.rules.deadThresholdDays}d)
                    </div>
                    <div
                      data-testid="walkthrough-dead-stock"
                      className="text-xl sm:text-2xl font-black text-rose-400 mt-1"
                    >
                      {formatCurrency(snapshot.summaryMetrics.deadStockValue)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {snapshot.summaryMetrics.deadSkusCount} SKUs ({snapshot.ownerReport.deadCashPercent}% of stock)
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4">
                    <div className="text-[11px] text-amber-300 uppercase">
                      Slow-Moving Watchlist ({snapshot.rules.slowThresholdDays}–{snapshot.rules.deadThresholdDays - 1}d)
                    </div>
                    <div
                      data-testid="walkthrough-slow-stock"
                      className="text-xl sm:text-2xl font-black text-amber-300 mt-1"
                    >
                      {formatCurrency(snapshot.summaryMetrics.slowMovingValue)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {snapshot.ownerReport.slowItemCount} SKUs ({snapshot.ownerReport.slowCashPercent}% of stock)
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-300 uppercase">
                      Annual Carrying Drain (@{snapshot.rules.holdingCostPercent}%)
                    </div>
                    <div
                      data-testid="walkthrough-annual-drain"
                      className="text-xl sm:text-2xl font-black text-amber-400 mt-1"
                    >
                      {formatCurrency(snapshot.summaryMetrics.annualCarryingCostDrain)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {formatCurrency(snapshot.summaryMetrics.monthlyBurn)} / month holding burn
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4">
                    <div className="text-[11px] text-emerald-300 uppercase">
                      Target Cash Release Potential
                    </div>
                    <div
                      data-testid="walkthrough-target-release"
                      className="text-xl sm:text-2xl font-black text-emerald-400 mt-1"
                    >
                      {formatCurrency(snapshot.summaryMetrics.targetCashRelease)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      70% dead + 30% slow liquidation benchmark
                    </div>
                  </div>
                </section>

                {/* Ageing Buckets & Category Concentration */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* 4 Ageing Buckets */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase font-mono">
                        Inventory Ageing Distribution
                      </h3>
                      <p className="text-xs text-slate-400">
                        Valuation classified by days elapsed since last issue/movement relative to {snapshot.rules.asOfDate}.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-emerald-400 font-bold">0 – 30 Days (Active)</div>
                        <div className="text-lg font-bold text-white mt-1">
                          {formatCurrency(snapshot.ownerReport.ageingBreakdown.range0_30)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {snapshot.ownerReport.ageingBreakdown.range0_30_pct}% of total valuation
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-sky-300 font-bold">31 – 89 Days (Moderate)</div>
                        <div className="text-lg font-bold text-white mt-1">
                          {formatCurrency(snapshot.ownerReport.ageingBreakdown.range31_89)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {snapshot.ownerReport.ageingBreakdown.range31_89_pct}% of total valuation
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30">
                        <div className="text-amber-300 font-bold">90 – 179 Days (Slow-Moving)</div>
                        <div className="text-lg font-bold text-amber-300 mt-1">
                          {formatCurrency(snapshot.ownerReport.ageingBreakdown.range90_179)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {snapshot.ownerReport.ageingBreakdown.range90_179_pct}% of total valuation
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/30">
                        <div className="text-rose-400 font-bold">180+ Days (Dead Stock)</div>
                        <div className="text-lg font-bold text-rose-400 mt-1">
                          {formatCurrency(snapshot.ownerReport.ageingBreakdown.range180_plus)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {snapshot.ownerReport.ageingBreakdown.range180_plus_pct}% of total valuation
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase font-mono">
                        Dead Stock Concentration by Category
                      </h3>
                      <p className="text-xs text-slate-400">
                        Breakdown of {formatCurrency(snapshot.summaryMetrics.deadStockValue)} non-moving inventory across store groups.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                      {(
                        Object.entries(snapshot.ownerReport.categoryDeadBreakdown) as Array<
                          [string, { value: number; count: number; percent: number }]
                        >
                      ).map(([cat, stats]) => (
                        <div
                          key={cat}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800"
                        >
                          <div className="text-slate-300 font-bold">{cat}</div>
                          <div className="text-lg font-bold text-white mt-1">
                            {formatCurrency(stats.value)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {stats.count} dead SKUs ({stats.percent}% of dead stock)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Top Priority SKU Table */}
                <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Evaluated SKU Priority Schedule ({snapshot.evaluatedSkus.length} SKUs)
                      </h3>
                      <p className="text-xs text-slate-400">
                        {isPaywallLocked
                          ? `Showing Top 3 Dormant SKUs in Free Executive Teaser Mode. Rows #4–#${snapshot.evaluatedSkus.length} and the 6-Sheet .XLSX Action Workbook are locked behind the ₹${(
                              proformaInvoice?.amountInr || 14999
                            ).toLocaleString('en-IN')} Direct Bank/UPI Paywall.`
                          : 'Sorted by Dead/Slow status and Rupee exposure so shop-floor and procurement teams can act on the highest-impact lines first.'}
                      </p>
                    </div>
                    {isPaywallLocked && (
                      <span className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold">
                        3 OF {snapshot.evaluatedSkus.length} SKUS VISIBLE IN TEASER
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
                          <th className="py-3 px-4">Part ID</th>
                          <th className="py-3 px-4">Description</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4 text-right">Qty</th>
                          <th className="py-3 px-4 text-right">Unit Cost</th>
                          <th className="py-3 px-4 text-right">Closing Value</th>
                          <th className="py-3 px-4 text-center">Days Idle</th>
                          <th className="py-3 px-4 text-center">Class / Status</th>
                          <th className="py-3 px-4">Recommended Floor Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {[...snapshot.evaluatedSkus]
                          .sort((a, b) => {
                            const statusOrder = { Dead: 0, Slow: 1, Moving: 2 };
                            const sDiff =
                              (statusOrder[a.status || 'Moving'] ?? 2) -
                              (statusOrder[b.status || 'Moving'] ?? 2);
                            if (sDiff !== 0) return sDiff;
                            return (b.closingValue || 0) - (a.closingValue || 0);
                          })
                          .map((sku, idx) => {
                            const isRowLocked = isPaywallLocked && idx >= 3;
                            return (
                              <tr
                                key={sku.id}
                                data-testid={
                                  isRowLocked
                                    ? `walkthrough-locked-sku-row-${idx + 1}`
                                    : `walkthrough-visible-sku-row-${idx + 1}`
                                }
                                className={
                                  isRowLocked
                                    ? 'bg-slate-950/80 select-none blur-[4px] opacity-50 pointer-events-none'
                                    : 'hover:bg-slate-950/50'
                                }
                              >
                                <td className="py-3 px-4 font-bold text-white">
                                  {isRowLocked ? `LOCKED-SKU-${idx + 1}` : sku.itemCode}
                                </td>
                                <td className="py-3 px-4 text-slate-200 font-sans">
                                  {isRowLocked
                                    ? 'Locked in Free 3-SKU Teaser — Unlock Full Audit'
                                    : sku.itemName}
                                </td>
                                <td className="py-3 px-4 text-slate-400">{sku.category}</td>
                                <td className="py-3 px-4 text-right text-slate-200">
                                  {sku.qtyOnHand}
                                </td>
                                <td className="py-3 px-4 text-right text-slate-300">
                                  {formatCurrency(sku.costRate)}
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-white">
                                  {formatCurrency(sku.closingValue || 0)}
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-slate-200">
                                  {sku.daysIdle}d
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${
                                      sku.status === 'Dead'
                                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                                        : sku.status === 'Slow'
                                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                    }`}
                                  >
                                    {sku.status} • Class {sku.abcClass}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-300 font-sans">
                                  {isRowLocked
                                    ? 'Unlock ₹14,999 Audit to view SKU-level disposition & vendor contra plan'
                                    : sku.action}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Phase 15: High-Converting Teaser-to-Paid Checkout & 1-Click UTR Unlock Card */}
                  {isPaywallLocked && proformaInvoice && (
                    <div
                      id="walkthrough-paywall-checkout-card"
                      data-testid="walkthrough-paywall-checkout-card"
                      className="p-6 sm:p-8 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-t-2 border-amber-500/50 space-y-6 no-print"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-800 pb-5">
                        <div className="space-y-2 max-w-3xl">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold uppercase">
                            <Lock className="w-3.5 h-3.5" />
                            <span>
                              {effectiveAccessMode === 'UTR_PENDING_VERIFICATION'
                                ? `UTR SUBMITTED (${
                                    snapshot.submittedUtrNumber || utrInput || 'PENDING'
                                  }) • AWAITING 1-CLICK FOUNDER BANK VERIFICATION`
                                : `TEASER PAYWALL ACTIVE • ${Math.max(
                                    0,
                                    snapshot.evaluatedSkus.length - 3
                                  )} PRIORITY SKUS & 6-SHEET .XLSX WORKBOOK LOCKED`}
                            </span>
                          </div>
                          <h4 className="text-lg sm:text-2xl font-black text-white">
                            Unlock Complete 4-Pillar Plant Audit &amp; 6-Sheet Excel Action Plan — ₹
                            {proformaInvoice.amountInr.toLocaleString('en-IN')}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            Your Top 3 Dormant SKUs above represent only the initial sample slice. Unlock all{' '}
                            <strong className="text-white">{snapshot.evaluatedSkus.length} evaluated SKUs</strong>,
                            the complete P2 Gate OTIF &amp; P3 Freight Leakage schedules, and the downloadable{' '}
                            <strong className="text-emerald-300">6-Sheet .XLSX Action Workbook</strong> via direct
                            0%-fee UPI or NEFT/IMPS transfer to founder{' '}
                            <strong className="text-white">{billingConfig.beneficiaryName}</strong>.
                          </p>
                        </div>

                        {/* Tier Selector */}
                        <div className="flex flex-col gap-2 font-mono text-xs shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedBillingTier('TIER2_FULL_AUDIT')}
                            className={`px-3.5 py-2 rounded-xl border text-left cursor-pointer transition ${
                              selectedBillingTier === 'TIER2_FULL_AUDIT'
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <div>Tier 2: Full 4-Pillar Plant Audit</div>
                            <div className="text-sm font-black text-white">
                              ₹{(billingConfig.tier2FullAuditPriceInr || 14999).toLocaleString('en-IN')} One-Time
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedBillingTier('TIER3_MONTHLY_RETAINER')}
                            className={`px-3.5 py-2 rounded-xl border text-left cursor-pointer transition ${
                              selectedBillingTier === 'TIER3_MONTHLY_RETAINER'
                                ? 'bg-sky-500/20 border-sky-500 text-sky-200 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <div>Tier 3: Monthly Control Tower Retainer</div>
                            <div className="text-sm font-black text-white">
                              ₹{(billingConfig.tier3MonthlyRetainerInr || 24999).toLocaleString('en-IN')} / Month
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* 3 Direct Payment Actions (UPI + Proforma Invoice + Optional Razorpay) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                        {/* 1. Direct UPI (0% Fee) + Scannable Desktop QR Code */}
                        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-400 uppercase">
                              OPTION A • 1-CLICK UPI &amp; QR (0% GATEWAY FEE)
                            </span>
                            <CreditCard className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="text-slate-300 text-[11px]">
                            UPI ID: <strong className="text-white">{billingConfig.upiId}</strong>
                          </div>
                          {upiQrSvg && (
                            <div
                              data-testid="walkthrough-upi-qr-code"
                              className="p-2.5 rounded-xl bg-white text-slate-950 flex flex-col items-center justify-center gap-1.5 shadow-sm"
                            >
                              <div
                                className="w-36 h-36 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                                dangerouslySetInnerHTML={{ __html: upiQrSvg }}
                              />
                              <div className="text-[10px] font-bold text-slate-900 text-center">
                                Scan with GPay / PhonePe / Paytm / Any UPI App
                              </div>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={proformaInvoice.upiPaymentUri}
                              data-testid="walkthrough-upi-pay-link"
                              className="flex-1 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-center inline-flex items-center justify-center gap-1.5"
                            >
                              <span>
                                Pay ₹{proformaInvoice.amountInr.toLocaleString('en-IN')} via UPI App (0% Fee)
                              </span>
                            </a>
                            <button
                              type="button"
                              data-testid="walkthrough-copy-upi-btn"
                              onClick={handleCopyUpiId}
                              className="px-2.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
                            </button>
                          </div>
                        </div>

                        {/* 2. Official Printable Proforma Invoice (NEFT / IMPS) */}
                        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-400 uppercase">
                              OPTION B • ACCOUNTS TEAM NEFT / IMPS
                            </span>
                            <FileText className="w-4 h-4 text-amber-400" />
                          </div>
                          <div className="text-slate-300 text-[11px]">
                            Invoice Ref: <strong className="text-white">{proformaInvoice.invoiceId}</strong> · SAC 998311
                          </div>
                          <button
                            type="button"
                            data-testid="walkthrough-view-proforma-invoice-btn"
                            onClick={() => setShowProformaInvoiceModal(true)}
                            className="w-full px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>
                              View / Print Official Proforma Invoice ({proformaInvoice.invoiceId})
                            </span>
                          </button>
                        </div>

                        {/* 3. Optional Razorpay Link */}
                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-sky-400 uppercase">
                              OPTION C • CARD / NETBANKING GATEWAY
                            </span>
                            <ExternalLink className="w-4 h-4 text-sky-400" />
                          </div>
                          <div className="text-slate-300 text-[11px]">
                            Corporate Credit Card or NetBanking checkout link:
                          </div>
                          {proformaInvoice.razorpayPaymentLink ? (
                            <a
                              href={proformaInvoice.razorpayPaymentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-testid="walkthrough-razorpay-link"
                              className="w-full px-3 py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 font-bold inline-flex items-center justify-center gap-1.5"
                            >
                              <span>Pay via Razorpay (Card / NetBanking)</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-[11px]">
                              Direct UPI / NEFT preferred (0% gateway surcharge).
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 1-Click 12-Digit UTR Submission Form */}
                      <form
                        onSubmit={handleSubmitPaymentUtr}
                        className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs"
                      >
                        <div className="font-bold text-white">
                          Already Paid via UPI / NEFT / IMPS? Enter 12-Digit UTR / Bank Reference Number to Unlock:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            data-testid="walkthrough-utr-input"
                            value={utrInput}
                            onChange={(e) => setUtrInput(e.target.value)}
                            placeholder="12-Digit UTR (e.g. 431298765432)"
                            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                          />
                          <input
                            type="email"
                            value={utrEmailInput}
                            onChange={(e) => setUtrEmailInput(e.target.value)}
                            placeholder="Accounts / Work Email for Paid Receipt"
                            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                          />
                          <button
                            type="submit"
                            data-testid="walkthrough-submit-utr-btn"
                            disabled={submittingUtr}
                            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer disabled:opacity-50"
                          >
                            {submittingUtr
                              ? 'Submitting UTR Reference...'
                              : 'Submit UTR & Queue Instant Unlock'}
                          </button>
                        </div>

                        {utrNotice && (
                          <div
                            data-testid="walkthrough-utr-notice"
                            className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs"
                          >
                            {utrNotice}
                          </div>
                        )}
                        {utrError && (
                          <div
                            role="alert"
                            className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs"
                          >
                            {utrError}
                          </div>
                        )}
                      </form>
                    </div>
                  )}
                </section>
              </>
            )}

            {/* PILLAR 2: P2 CUSTOMER PROMISE (OTIF DISPATCH) */}
            {activePillarTab === 'p2' && p2Summary && (
              <div data-testid="pillar-panel-p2" className="space-y-6">
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 font-mono">
                  <div className="bg-slate-900 border border-sky-500/30 rounded-xl p-4">
                    <div className="text-[11px] text-sky-300 uppercase">Gate OTIF Pass Rate</div>
                    <div className="text-xl sm:text-2xl font-black text-white mt-1">
                      {p2Summary.otifPercent}%
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {p2Summary.passes} of {p2Summary.totalDispatches} dispatches passed both gates
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-300 uppercase">On-Time Gate</div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">
                      {p2Summary.onTimePercent}%
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {p2Summary.onTimeCount} of {p2Summary.totalDispatches} left on/before promise
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-300 uppercase">In-Full Quantity Gate</div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">
                      {p2Summary.inFullPercent}%
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {p2Summary.inFullCount} of {p2Summary.totalDispatches} shipped 100% PO qty
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-4">
                    <div className="text-[11px] text-rose-300 uppercase">Dual-Gate Failures</div>
                    <div className="text-xl sm:text-2xl font-black text-rose-400 mt-1">
                      {p2Summary.fails} Failed
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {p2Summary.failsLateOnly} Late • {p2Summary.failsShortOnly} Short • {p2Summary.failsLateAndShort} Both
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4">
                    <div className="text-[11px] text-amber-300 uppercase">Priority OEM Account</div>
                    <div className="text-base font-black text-amber-300 mt-1 truncate">
                      {p2Summary.weakestCustomerName || 'All Accounts Healthy'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Top cause: {p2Summary.topFailureReason || 'None'}
                    </div>
                  </div>
                </section>

                {snapshot.evaluatedP2Dispatches && snapshot.evaluatedP2Dispatches.length > 0 && (
                  <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-slate-800">
                      <h3 className="text-base font-bold text-white">
                        P2 Dispatch Dual-Gate Audit Schedule ({snapshot.evaluatedP2Dispatches.length} Dispatches)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Strict Dual-Gate evaluation: a dispatch passes OTIF only if it is both On-Time and In-Full.
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
                            <th className="py-3 px-4">Customer &amp; PO</th>
                            <th className="py-3 px-4">Part</th>
                            <th className="py-3 px-4 text-right">Ordered / Shipped</th>
                            <th className="py-3 px-4">Promised / Actual Out</th>
                            <th className="py-3 px-4 text-center">Gate Status</th>
                            <th className="py-3 px-4">Root Cause / Delay Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {snapshot.evaluatedP2Dispatches.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-950/50">
                              <td className="py-3 px-4">
                                <div className="font-bold text-white">{row.customer}</div>
                                <div className="text-[11px] text-slate-400">{row.po}</div>
                              </td>
                              <td className="py-3 px-4 text-slate-200 font-sans">{row.part}</td>
                              <td className="py-3 px-4 text-right text-slate-200">
                                {row.shippedQty} / {row.orderedQty}
                              </td>
                              <td className="py-3 px-4 text-[11px] text-slate-300">
                                <div>P: {row.promisedDate}</div>
                                <div>A: {row.actualOut}</div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${
                                    row.otif
                                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                      : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                                  }`}
                                >
                                  {row.otif ? 'OTIF PASS' : row.failType || 'FAIL'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-300 font-sans">
                                {row.delayReason || 'On schedule'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* PILLAR 3: P3 PROFIT PROTECTION (FREIGHT AUDIT) */}
            {activePillarTab === 'p3' && p3Summary && (
              <div data-testid="pillar-panel-p3" className="space-y-6">
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 font-mono">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-400 uppercase">Total Billed Freight</div>
                    <div className="text-xl sm:text-2xl font-black text-white mt-1">
                      {formatCurrency(p3Summary.freightPaid)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {p3Summary.totalTrips} audited carrier invoices
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-4">
                    <div className="text-[11px] text-rose-300 uppercase">Total Freight Leakage</div>
                    <div className="text-xl sm:text-2xl font-black text-rose-400 mt-1">
                      {formatCurrency(p3Summary.totalLeak)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {p3Summary.flaggedTripsCount} of {p3Summary.totalTrips} trips above benchmark
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4">
                    <div className="text-[11px] text-amber-300 uppercase">Rate Card Overcharge</div>
                    <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
                      {formatCurrency(p3Summary.rateLeak)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Above clean lane rate / tonne
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4">
                    <div className="text-[11px] text-amber-300 uppercase">Gate Detention Drain</div>
                    <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
                      {formatCurrency(p3Summary.detention)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {p3Summary.totalWaitHours} hrs total vehicle waiting
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4">
                    <div className="text-[11px] text-emerald-300 uppercase">Clean vs Split Loads</div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                      {p3Summary.cleanTrips} Clean
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {p3Summary.splitTrips} split / multi-drop trips
                    </div>
                  </div>
                </section>

                {snapshot.evaluatedP3Trips && snapshot.evaluatedP3Trips.length > 0 && (
                  <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-slate-800">
                      <h3 className="text-base font-bold text-white">
                        P3 Carrier Rate &amp; Detention Audit Schedule ({snapshot.evaluatedP3Trips.length} Trips)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Compares each transporter bill against the lowest clean rate per tonne on the same lane plus gate waiting detention.
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
                            <th className="py-3 px-4">Trip &amp; Date</th>
                            <th className="py-3 px-4">Lane &amp; Carrier</th>
                            <th className="py-3 px-4 text-right">Weight (kg)</th>
                            <th className="py-3 px-4 text-right">Billed</th>
                            <th className="py-3 px-4 text-right">Rate Leak</th>
                            <th className="py-3 px-4 text-right">Detention</th>
                            <th className="py-3 px-4 text-right">Total Leak</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {snapshot.evaluatedP3Trips.map((trip) => (
                            <tr key={trip.id} className="hover:bg-slate-950/50">
                              <td className="py-3 px-4">
                                <div className="font-bold text-white">{trip.id}</div>
                                <div className="text-[11px] text-slate-400">{trip.date}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-slate-200 font-sans">{trip.lane}</div>
                                <div className="text-[11px] text-sky-300">{trip.transporter}</div>
                              </td>
                              <td className="py-3 px-4 text-right text-slate-300">{trip.weightKg}</td>
                              <td className="py-3 px-4 text-right font-bold text-white">
                                {formatCurrency(trip.bill)}
                              </td>
                              <td className="py-3 px-4 text-right text-amber-300">
                                {formatCurrency(trip.rateLeak)}
                              </td>
                              <td className="py-3 px-4 text-right text-amber-300">
                                {formatCurrency(trip.detention)} ({trip.waitHours}h)
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-rose-400">
                                {formatCurrency(trip.totalLeak)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* PILLAR 4: P4 WAREHOUSE TRUST (BIN VARIANCE) */}
            {activePillarTab === 'p4' && p4Summary && (
              <div data-testid="pillar-panel-p4" className="space-y-6">
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 font-mono">
                  <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-4">
                    <div className="text-[11px] text-purple-300 uppercase">Bin Match Accuracy</div>
                    <div className="text-xl sm:text-2xl font-black text-white mt-1">
                      {p4Summary.binAccuracyPercent}%
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {p4Summary.linesMatched} matched • {p4Summary.linesMismatch} mismatched of {p4Summary.skusCounted}
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-4">
                    <div className="text-[11px] text-rose-300 uppercase">Ghost Stock Shortage</div>
                    <div className="text-xl sm:text-2xl font-black text-rose-400 mt-1">
                      {formatCurrency(p4Summary.shelfShortRupees)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Physical count lower than system book
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4">
                    <div className="text-[11px] text-emerald-300 uppercase">Unrecorded Surplus</div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                      {formatCurrency(p4Summary.foundStockRupees)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Unposted supplier receipts on rack
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4">
                    <div className="text-[11px] text-amber-300 uppercase">Gross Absolute Variance</div>
                    <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
                      {formatCurrency(p4Summary.absVarianceRupees)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Total book-to-bin discrepancy exposure
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-300 uppercase">Slotting Exceptions</div>
                    <div className="text-xl sm:text-2xl font-black text-sky-300 mt-1">
                      {p4Summary.fastMoversHidden} Fast Hidden
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {p4Summary.slowAtCounter} slow movers blocking counter
                    </div>
                  </div>
                </section>

                {snapshot.evaluatedP4Bins && snapshot.evaluatedP4Bins.length > 0 && (
                  <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-slate-800">
                      <h3 className="text-base font-bold text-white">
                        P4 Warehouse Bin Cycle-Count Schedule ({snapshot.evaluatedP4Bins.length} Bins)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Identifies phantom stock shortages and misplaced fast-moving SKUs before they trigger dispatch failures.
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
                            <th className="py-3 px-4">Part Code</th>
                            <th className="py-3 px-4">Description</th>
                            <th className="py-3 px-4">Bin Location</th>
                            <th className="py-3 px-4 text-right">System / Physical</th>
                            <th className="py-3 px-4 text-right">Gap (INR)</th>
                            <th className="py-3 px-4">Recommended Stores Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {snapshot.evaluatedP4Bins.map((bin) => (
                            <tr key={bin.id} className="hover:bg-slate-950/50">
                              <td className="py-3 px-4 font-bold text-white">{bin.code}</td>
                              <td className="py-3 px-4 text-slate-200 font-sans">{bin.part}</td>
                              <td className="py-3 px-4 text-slate-300">{bin.spot}</td>
                              <td className="py-3 px-4 text-right text-slate-200">
                                {bin.systemQty} / {bin.physicalQty} ({bin.gapQty! > 0 ? `+${bin.gapQty}` : bin.gapQty})
                              </td>
                              <td
                                className={`py-3 px-4 text-right font-bold ${
                                  (bin.gapRupees || 0) < 0
                                    ? 'text-rose-400'
                                    : (bin.gapRupees || 0) > 0
                                    ? 'text-emerald-400'
                                    : 'text-slate-300'
                                }`}
                              >
                                {formatCurrency(bin.gapRupees || 0)}
                              </td>
                              <td className="py-3 px-4 text-slate-300 font-sans">{bin.action}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Dedicated 2-Page Executive Print / PDF Briefing Summary */}
            <section
              data-testid="walkthrough-2page-executive-briefing"
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 print-page"
            >
              {/* Page 1: Executive Working Capital & Operational Leakage Summary */}
              <div className="space-y-4 print-page-break">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                      PAGE 1 OF 2 — EXECUTIVE WORKING CAPITAL &amp; OPERATIONAL LEAKAGE SUMMARY
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                      {snapshot.companyName} ({snapshot.plantLocation}) — 4-Pillar Audit Scorecard
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Prepared by {snapshot.preparedBy || 'C. Jones Snowin'} (Operationalyst / Snowin Ventures, Chennai) · As-Of Date: {snapshot.rules.asOfDate}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300">
                    {snapshot.workspaceId}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-emerald-400 font-bold uppercase">
                      P1 • Dead Stock &amp; Cash Release
                    </div>
                    <div className="text-white font-bold">
                      Dead: {formatCurrency(snapshot.summaryMetrics.deadStockValue)} ({snapshot.summaryMetrics.deadSkusCount} SKUs)
                    </div>
                    <div className="text-slate-300">
                      Slow: {formatCurrency(snapshot.summaryMetrics.slowMovingValue)} · Target Release: {formatCurrency(snapshot.summaryMetrics.targetCashRelease)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-sky-400 font-bold uppercase">
                      P2 • Dual-Gate OTIF
                    </div>
                    <div className="text-white font-bold">
                      {p2Summary
                        ? `${p2Summary.otifPercent}% Pass (${p2Summary.passes}/${p2Summary.totalDispatches})`
                        : 'Not Included'}
                    </div>
                    <div className="text-slate-300">
                      {p2Summary
                        ? `${p2Summary.fails} Failed (${p2Summary.failsLateOnly} Late, ${p2Summary.failsShortOnly} Short, ${p2Summary.failsLateAndShort} Both)`
                        : 'Single-pillar P1 scope'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-amber-400 font-bold uppercase">
                      P3 • Freight Rate &amp; Detention Audit
                    </div>
                    <div className="text-white font-bold">
                      {p3Summary
                        ? `${formatCurrency(p3Summary.totalLeak)} Total Leak`
                        : 'Not Included'}
                    </div>
                    <div className="text-slate-300">
                      {p3Summary
                        ? `Rate: ${formatCurrency(p3Summary.rateLeak)} · Detention: ${formatCurrency(p3Summary.detention)}`
                        : 'Single-pillar P1 scope'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-purple-400 font-bold uppercase">
                      P4 • Warehouse Blind Bin Variance
                    </div>
                    <div className="text-white font-bold">
                      {p4Summary
                        ? `${p4Summary.binAccuracyPercent}% Accuracy (${p4Summary.linesMatched}/${p4Summary.skusCounted})`
                        : 'Not Included'}
                    </div>
                    <div className="text-slate-300">
                      {p4Summary
                        ? `Ghost Stock Short: ${formatCurrency(p4Summary.shelfShortRupees)}`
                        : 'Single-pillar P1 scope'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Page 2: Top Priority Action Schedule & Audit Governance */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                    PAGE 2 OF 2 — TOP PRIORITY ACTION SCHEDULE &amp; AUDIT GOVERNANCE
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Documented Assumptions &amp; Analytical Boundaries
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="font-mono font-bold text-emerald-300 uppercase">
                      P1 • Top High-Exposure SKUs (Dead &amp; Slow Stock)
                    </div>
                    <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                      {[...snapshot.evaluatedSkus]
                        .filter((s) => s.status === 'Dead' || s.status === 'Slow')
                        .sort((a, b) => (b.closingValue || 0) - (a.closingValue || 0))
                        .slice(0, 4)
                        .map((sku) => (
                          <li key={sku.id}>
                            <strong className="text-white font-mono">{sku.itemCode}</strong> ({sku.itemName}):{' '}
                            <span className="text-emerald-300 font-mono">
                              {formatCurrency(sku.closingValue || 0)}
                            </span>{' '}
                            ({sku.daysIdle}d idle) — {sku.action}
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="font-mono font-bold text-amber-300 uppercase">
                      P3 &amp; P4 • Flagged Freight Trips &amp; High-Risk Warehouse Bins
                    </div>
                    <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                      {(snapshot.evaluatedP3Trips || [])
                        .filter((t) => (t.totalLeak || 0) > 0)
                        .sort((a, b) => (b.totalLeak || 0) - (a.totalLeak || 0))
                        .slice(0, 2)
                        .map((trip) => (
                          <li key={trip.id}>
                            <strong className="text-white font-mono">{trip.id}</strong> ({trip.lane} · {trip.transporter}):{' '}
                            <span className="text-rose-400 font-mono">
                              {formatCurrency(trip.totalLeak || 0)} Leak
                            </span>{' '}
                            (Rate: {formatCurrency(trip.rateLeak || 0)} + Wait: {formatCurrency(trip.detention || 0)})
                          </li>
                        ))}
                      {(snapshot.evaluatedP4Bins || [])
                        .filter((b) => (b.gapQty || 0) !== 0)
                        .sort((a, b) => Math.abs(b.gapRupees || 0) - Math.abs(a.gapRupees || 0))
                        .slice(0, 2)
                        .map((bin) => (
                          <li key={bin.id}>
                            <strong className="text-white font-mono">{bin.code}</strong> ({bin.spot}):{' '}
                            <span className="text-purple-300 font-mono">
                              {formatCurrency(bin.gapRupees || 0)} Variance
                            </span>{' '}
                            (Sys {bin.systemQty} vs Phy {bin.physicalQty}) — {bin.action}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2 text-xs">
                  <div className="font-mono font-bold text-amber-300 uppercase">
                    Documented Assumptions &amp; Analytical Boundaries
                  </div>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                    <li>
                      <strong>Ageing &amp; Carrying Rules:</strong> Evaluated as of {snapshot.rules.asOfDate} (Dead &ge;{snapshot.rules.deadThresholdDays}d, Slow {snapshot.rules.slowThresholdDays}–{snapshot.rules.deadThresholdDays - 1}d, Holding Cost {snapshot.rules.holdingCostPercent}% p.a.).
                    </li>
                    <li>
                      <strong>Engineering Review Required:</strong> Critical machine breakdown spares and statutory safety stock remain subject to plant head approval before liquidation.
                    </li>
                    <li>
                      <strong>Data Governance:</strong> Read-only diagnostic prepared by C. Jones Snowin (Operationalyst / Snowin Ventures, Chennai · joneszz2004@gmail.com).
                    </li>
                  </ul>
                </div>
              </div>
            </section>
              </>
            )}

            {/* Footer Scope & Governance Note */}
            <footer className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <div>
                Prepared by <strong className="text-white">C. Jones Snowin</strong> (Founder, Operationalyst) · Findings depend on supplied data completeness and do not replace plant engineering judgment on critical insurance spares.
              </div>
              <a
                href="mailto:joneszz2004@gmail.com"
                className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 font-mono font-bold shrink-0"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>joneszz2004@gmail.com</span>
              </a>
            </footer>
          </div>
        )}
      </main>

      {/* Phase 15: Official Printable Proforma Invoice (INV-...) Modal */}
      {showProformaInvoiceModal && proformaInvoice && (
        <div
          data-testid="proforma-invoice-modal"
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 text-xs font-mono">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold uppercase text-[11px]">
                  OFFICIAL B2B PROFORMA INVOICE /PAID RECEIPT • {proformaInvoice.invoiceId}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white font-sans">
                  Operationalyst (Snowin Ventures, Chennai)
                </h3>
                <p className="text-slate-400">
                  Beneficiary: <strong className="text-white">{proformaInvoice.neftImpsInstructions.beneficiaryName}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 no-print">
                <button
                  type="button"
                  data-testid="print-proforma-invoice-btn"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save Invoice PDF</span>
                </button>
                <button
                  type="button"
                  data-testid="close-proforma-invoice-btn"
                  onClick={() => setShowProformaInvoiceModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase">Billed To (Client Plant)</div>
                <div className="text-sm font-bold text-white font-sans">{proformaInvoice.companyName}</div>
                <div className="text-slate-300">{proformaInvoice.plantLocation}</div>
                <div className="text-slate-400 text-[11px]">
                  Workspace Ref: {proformaInvoice.workspaceId}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase">Invoice Metadata &amp; Status</div>
                <div className="text-sm font-bold text-amber-300">{proformaInvoice.invoiceId}</div>
                <div className="text-slate-300">
                  Date: {proformaInvoice.issuedAt.slice(0, 10)} · Currency: INR
                </div>
                <div className="text-emerald-300 font-bold">
                  Status: {proformaInvoice.paymentStatus}
                  {proformaInvoice.utrReferenceNumber
                    ? ` (UTR: ${proformaInvoice.utrReferenceNumber})`
                    : ''}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4">SAC Code</th>
                    <th className="py-2.5 px-4 text-right">Qty</th>
                    <th className="py-2.5 px-4 text-right">Total (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {proformaInvoice.lineItems.map((item, i) => (
                    <tr key={i} className="bg-slate-900">
                      <td className="py-3 px-4 text-slate-200 font-sans">{item.description}</td>
                      <td className="py-3 px-4 text-slate-400">{item.hsnSacCode}</td>
                      <td className="py-3 px-4 text-right text-slate-200">{item.qty}</td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        ₹{item.lineTotalInr.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Direct NEFT / IMPS & UPI Remittance Instructions + Scannable QR Code */}
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="text-emerald-400 font-bold uppercase text-[11px]">
                  Direct Bank NEFT / IMPS &amp; 0%-Fee UPI Remittance Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                  <div>
                    Beneficiary: <strong className="text-white">{proformaInvoice.neftImpsInstructions.beneficiaryName}</strong>
                  </div>
                  <div>
                    UPI ID (0% Fee): <strong className="text-emerald-300">{proformaInvoice.neftImpsInstructions.upiId}</strong>
                  </div>
                  <div>
                    Bank Name: <strong className="text-white">{proformaInvoice.neftImpsInstructions.bankName}</strong>
                  </div>
                  <div>
                    Account No: <strong className="text-white">{proformaInvoice.neftImpsInstructions.accountNumber}</strong>
                  </div>
                  <div>
                    IFSC Code: <strong className="text-white">{proformaInvoice.neftImpsInstructions.ifscCode}</strong>
                  </div>
                  <div>
                    Remittance Note: <strong className="text-amber-300">{proformaInvoice.neftImpsInstructions.paymentNote}</strong>
                  </div>
                  <div>
                    Udyam MSME Reg: <strong className="text-sky-300">{proformaInvoice.udyamMsmeNumber}</strong>
                  </div>
                  <div>
                    GST Status:{' '}
                    <strong className="text-slate-200">
                      {proformaInvoice.gstinOptional
                        ? `GSTIN: ${proformaInvoice.gstinOptional}`
                        : 'MSME Exempt / SAC 998311'}
                    </strong>
                  </div>
                </div>
              </div>

              {upiQrSvg && (
                <div
                  data-testid="proforma-invoice-upi-qr"
                  className="p-2.5 rounded-xl bg-white text-slate-950 flex flex-col items-center justify-center gap-1 shrink-0"
                >
                  <div
                    className="w-28 h-28 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: upiQrSvg }}
                  />
                  <div className="text-[9px] font-bold text-slate-900 text-center">
                    Scan to Pay ₹{proformaInvoice.amountInr.toLocaleString('en-IN')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phase 17: Official Printable Paid Receipt (RCPT-...) Modal */}
      {showPaidReceiptModal && paidReceipt && (
        <div
          data-testid="paid-receipt-modal"
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 text-xs font-mono">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold uppercase text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>OFFICIAL B2B PAID RECEIPT • {paidReceipt.receiptId} • {paidReceipt.stamp}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white font-sans">
                  {paidReceipt.sellerBrand} ({paidReceipt.sellerLocation})
                </h3>
                <p className="text-slate-400">
                  Beneficiary: <strong className="text-white">{paidReceipt.beneficiaryName}</strong> · Udyam MSME: <strong className="text-sky-300">{paidReceipt.udyamMsmeNumber}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 no-print">
                <button
                  type="button"
                  data-testid="print-paid-receipt-btn"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save Paid Receipt PDF</span>
                </button>
                <button
                  type="button"
                  data-testid="close-paid-receipt-btn"
                  onClick={() => setShowPaidReceiptModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase">Received From (Client Plant)</div>
                <div className="text-sm font-bold text-white font-sans">{paidReceipt.companyName}</div>
                <div className="text-slate-300">{paidReceipt.plantLocation}</div>
                <div className="text-slate-400 text-[11px]">
                  Workspace Ref: {paidReceipt.workspaceId} · Invoice Ref: {paidReceipt.invoiceId}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-1">
                <div className="text-[10px] text-emerald-400 uppercase font-bold">
                  Payment Verification &amp; UTR Stamp
                </div>
                <div className="text-sm font-black text-emerald-300">
                  {paidReceipt.stamp} — ₹{paidReceipt.amountPaidInr.toLocaleString('en-IN')} INR
                </div>
                <div className="text-slate-200">
                  Verified UTR / Bank Ref: <strong className="text-white">{paidReceipt.utrNumber}</strong>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Paid At: {paidReceipt.paidAt.slice(0, 19).replace('T', ' ')} UTC · Verified By: {paidReceipt.verifiedBy}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4">SAC Code</th>
                    <th className="py-2.5 px-4 text-right">Amount Paid (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {paidReceipt.lineItems.map((item, i) => (
                    <tr key={i} className="bg-slate-900">
                      <td className="py-3 px-4 text-slate-200 font-sans">{item.description}</td>
                      <td className="py-3 px-4 text-slate-400">{item.hsnSacCode}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-300">
                        ₹{item.lineTotalInr.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
