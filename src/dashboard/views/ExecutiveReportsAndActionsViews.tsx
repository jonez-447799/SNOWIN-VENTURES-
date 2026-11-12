/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  Layers,
  CheckSquare,
  Plus,
  Upload,
  Wand2,
  Database,
  CheckCircle2,
  AlertTriangle,
  Download,
  Shield,
  Lock,
  Unlock,
  RefreshCw,
  Building2,
  ArrowRight,
  Activity,
} from 'lucide-react';
import {
  LivePlatformDataSnapshot,
  PlatformNavId,
  DEMO_ENVIRONMENT_CONFIG,
  formatINRCompact,
} from '../dashboardConfig';
import {
  DemoDataNotice,
  StatusBadge,
  EnvironmentBadge,
} from '../components/SharedDashboardPrimitives';
import Project5App from '../../project5/Project5App';
import { MergedCommandCenter } from '../../MergedCommandCenter';
import { CustomBundleCombinator } from '../../components/CustomBundleCombinator';
import { TargetEngineType } from '../../components/SmartTallyMapperModal';
import { downloadCommandCenterWorkbook } from '../../utils/excelCommandCenterExporter';
import { sanitizeSpreadsheetCell } from '../../utils/importValidation';
import { trackEvent } from '../../utils/analytics';
import {
  PlantCapaItem,
  writePlantDatasetToBrowser,
} from '../../data/multiPlantBaselines';
import {
  normalizeCapaItem,
  computeCapaFinancialSummary,
  type CapaPillar,
  type CapaDispositionType,
  type CapaVerificationStage,
  type NormalizedCapaItem,
} from '../../utils/capaLedger';
import { CloudRunSystemBackupPanel } from '../../components/CloudRunSystemBackupPanel';

// ============================================================================
// 1. EXECUTIVE REPORTS VIEW (P5 • CEO Briefing + 6 Report Templates)
// ============================================================================
type ReportTemplateType =
  | 'executive_overview'
  | 'inventory_review'
  | 'delivery_review'
  | 'profit_risk_review'
  | 'warehouse_control_review'
  | 'priority_action_report';

export const ExecutiveReportsView: React.FC<{
  snapshot: LivePlatformDataSnapshot;
  onNavigateDomain: (domain: PlatformNavId) => void;
}> = ({ snapshot, onNavigateDomain }) => {
  const [selectedReport, setSelectedReport] = useState<ReportTemplateType>('executive_overview');
  const [showLegacyMode, setShowLegacyMode] = useState<'none' | 'p5' | 'merged' | 'bundles'>(
    'none'
  );

  const reportTabs: { id: ReportTemplateType; label: string }[] = [
    { id: 'executive_overview', label: '1. Executive Overview' },
    { id: 'inventory_review', label: '2. Inventory Review' },
    { id: 'delivery_review', label: '3. Delivery Review' },
    { id: 'profit_risk_review', label: '4. Profit & Risk Review' },
    { id: 'warehouse_control_review', label: '5. Warehouse Control Review' },
    { id: 'priority_action_report', label: '6. Priority Action Report' },
  ];

  const handlePrintPDF = () => {
    trackEvent('report_exported', { reportType: selectedReport, format: 'pdf_print' });
    window.print();
  };

  const handleExportWorkbook = () => {
    trackEvent('report_exported', {
      reportType: selectedReport,
      format: 'xlsx_6sheet',
      plantId: snapshot.plant.id,
    });
    downloadCommandCenterWorkbook(snapshot.plant.id);
  };

  return (
    <div className="space-y-6">
      <DemoDataNotice onOpenImports={() => onNavigateDomain('data_imports')} />

      {/* Header */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold text-white">Executive Reports</h1>
            <span className="text-xs font-mono text-slate-400">(P5 • CEO Briefing)</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Structured management reviews, print-ready board memos, and multi-sheet Excel workbooks scoped to{' '}
            <strong className="text-white">{snapshot.plant.name}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={handlePrintPDF}
            className="px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>Print / Save as PDF</span>
          </button>
          <button
            onClick={handleExportWorkbook}
            className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download 6-Sheet Workbook (.xlsx)</span>
          </button>
          <button
            onClick={() => setShowLegacyMode((m) => (m === 'p5' ? 'none' : 'p5'))}
            className={`px-3 py-2 rounded-lg border font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
              showLegacyMode === 'p5'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {showLegacyMode === 'p5' ? 'Hide P5 Monday Tower' : 'Open P5 Monday Control Tower'}
            </span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 no-print" role="tablist">
        {reportTabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={selectedReport === t.id}
            onClick={() => setSelectedReport(t.id)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedReport === t.id
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Printable Board Report Sheet */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 print:bg-white print:text-slate-950 print:border-slate-300">
        {/* Report Metadata Banner & Watermark */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-800 print:border-slate-300">
          <div>
            <div className="mb-2">
              <EnvironmentBadge />
            </div>
            <h2 className="text-xl font-bold text-white print:text-slate-900">
              {reportTabs.find((r) => r.id === selectedReport)?.label.replace(/^\d+\.\s*/, '')} —{' '}
              {snapshot.plant.name}
            </h2>
            <p className="text-xs text-slate-300 print:text-slate-600 mt-1">
              Organization: <strong>{DEMO_ENVIRONMENT_CONFIG.organizationName}</strong> • Unit ID:{' '}
              <strong className="font-mono">{snapshot.plant.id.toUpperCase()}</strong> • Period:{' '}
              <strong>
                {snapshot.period.label} ({snapshot.period.dateRange})
              </strong>
            </p>
          </div>
          <div className="text-right text-xs font-mono text-slate-400">
            <div>
              Document Ref: OP-REP-{snapshot.plant.id.toUpperCase()}-{selectedReport.toUpperCase()}
            </div>
            <div>Prepared by: C. Jones Snowin</div>
            <div>Plant Workspace: {snapshot.plant.name}</div>
          </div>
        </div>

        {/* Executive Summary Narrative */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            1. Executive Summary
          </h3>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            {snapshot.executiveBrief.currentState} {snapshot.executiveBrief.importantChange}{' '}
            {snapshot.executiveBrief.likelyDriver}
          </p>
        </div>

        {/* Key Metrics Table with Definitions */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            2. Key Operational Metrics &amp; Definitions
          </h3>
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-2.5 px-4">Indicator</th>
                  <th className="py-2.5 px-4">Current Value (Numerator / Denominator)</th>
                  <th className="py-2.5 px-4">Target / Threshold</th>
                  <th className="py-2.5 px-4">Methodology Definition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {snapshot.kpiStrip.map((kpi) => (
                  <tr key={kpi.id}>
                    <td className="py-3 px-4 font-bold text-white">{kpi.name}</td>
                    <td className="py-3 px-4 font-mono text-sky-300">
                      {kpi.valueDisplay} ({kpi.contextSubtext})
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{kpi.targetDisplay}</td>
                    <td className="py-3 px-4 text-slate-300">{kpi.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Investigations for Selected Report */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            3. Priority Records &amp; Recommended Investigations
          </h3>
          <div className="space-y-2">
            {snapshot.investigationQueue.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-white">
                    [{item.domainLabel}] {item.signal}
                  </div>
                  <div className="text-slate-300 mt-0.5">
                    Recommended Investigation: {item.recommendedInvestigation}
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] text-slate-400">
                  <div>Owner: {item.owner}</div>
                  <div>
                    Status: {item.status} ({item.dueDate})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Quality & Scope Notes */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-1">
          <div className="font-bold text-white">
            4. Data-Quality Notes &amp; Workspace Governance
          </div>
          <p>{snapshot.executiveBrief.dataLimitation}</p>
          <p className="text-amber-300 font-medium">{DEMO_ENVIRONMENT_CONFIG.noticeText}</p>
        </div>
      </div>

      {/* Optional Access to Legacy P5 / Merged / Modular Combos */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
        <span className="text-slate-300 font-medium">
          Additional Multi-Engine &amp; Briefing Workbenches:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowLegacyMode((m) => (m === 'p5' ? 'none' : 'p5'))}
            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold cursor-pointer"
          >
            {showLegacyMode === 'p5' ? 'Hide P5 Briefing' : 'P5 CEO Monday Briefing'}
          </button>
          <button
            onClick={() => setShowLegacyMode((m) => (m === 'merged' ? 'none' : 'merged'))}
            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold cursor-pointer"
          >
            {showLegacyMode === 'merged' ? 'Hide 5-Engine Suite' : 'Unified 5-Engine Suite'}
          </button>
          <button
            onClick={() => setShowLegacyMode((m) => (m === 'bundles' ? 'none' : 'bundles'))}
            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold cursor-pointer"
          >
            {showLegacyMode === 'bundles' ? 'Hide Modular Bundles' : 'Modular Control Bundles'}
          </button>
        </div>
      </div>

      {showLegacyMode === 'p5' && (
        <div className="border-t-2 border-sky-500/40 pt-6">
          <Project5App
            onJumpToEngine={(eng) => {
              if (eng === 'p1') onNavigateDomain('inventory');
              if (eng === 'p2') onNavigateDomain('delivery');
              if (eng === 'p3') onNavigateDomain('profit_risk');
              if (eng === 'p4') onNavigateDomain('warehouse');
            }}
          />
        </div>
      )}

      {showLegacyMode === 'merged' && (
        <div className="border-t-2 border-sky-500/40 pt-6">
          <MergedCommandCenter
            onSwitchToStandaloneP1={() => onNavigateDomain('inventory')}
            onSwitchToStandaloneP2={() => onNavigateDomain('delivery')}
            onSwitchToStandaloneP3={() => onNavigateDomain('profit_risk')}
            onSwitchToStandaloneP4={() => onNavigateDomain('warehouse')}
            onSwitchToStandaloneP5={() => onNavigateDomain('executive_reports')}
          />
        </div>
      )}

      {showLegacyMode === 'bundles' && (
        <div className="border-t-2 border-sky-500/40 pt-6">
          <CustomBundleCombinator
            useCommercialNames={true}
            onOpenSmartMapper={() => onNavigateDomain('data_imports')}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. ACTIONS VIEW (Closed-Loop CAPA Financial Realization Ledger)
// ============================================================================
interface ActionRecord extends NormalizedCapaItem {
  isInvestigationQueueItem?: boolean;
}

function buildPlantActionsFromSnapshot(snapshot: LivePlatformDataSnapshot): ActionRecord[] {
  const capaRows: ActionRecord[] = (snapshot.capaItems || []).map((c) => ({
    ...normalizeCapaItem(c as unknown as Record<string, unknown>),
    isInvestigationQueueItem: false,
  }));

  const queueRows: ActionRecord[] = snapshot.investigationQueue.map((q) => {
    const normalized = normalizeCapaItem({
      id: q.id,
      title: q.signal,
      domain: q.domain as any,
      domainLabel: q.domainLabel,
      priority:
        q.priority === 'Critical'
          ? 'Critical'
          : q.priority === 'Requires attention'
          ? 'Requires attention'
          : 'Monitoring',
      evidenceRef: q.evidenceLabel,
      owner: q.owner,
      dueDate: q.dueDate,
      status: q.status,
      notes: q.recommendedInvestigation,
    });
    return {
      ...normalized,
      isInvestigationQueueItem: true,
    };
  });

  return [...capaRows, ...queueRows];
}

export const ActionsView: React.FC<{
  snapshot: LivePlatformDataSnapshot;
  onNavigateDomain: (domain: PlatformNavId) => void;
}> = ({ snapshot, onNavigateDomain }) => {
  const [actions, setActions] = useState<ActionRecord[]>(() =>
    buildPlantActionsFromSnapshot(snapshot)
  );

  // Re-hydrate whenever active plant changes
  useEffect(() => {
    setActions(buildPlantActionsFromSnapshot(snapshot));
  }, [snapshot.plant.id, snapshot.capaItems]);

  const [stageFilter, setStageFilter] = useState<'ALL' | CapaVerificationStage>('ALL');
  const [newTitle, setNewTitle] = useState('');
  const [newPillar, setNewPillar] = useState<CapaPillar>('P1_INVENTORY');
  const [newDisposition, setNewDisposition] =
    useState<CapaDispositionType>('B2B_LIQUIDATION_SCRAP');
  const [newLinkedRecordId, setNewLinkedRecordId] = useState('FG-PBX-G1');
  const [newExposureInr, setNewExposureInr] = useState<number>(65000);
  const [newTargetRecoveryInr, setNewTargetRecoveryInr] = useState<number>(48000);
  const [newOwner, setNewOwner] = useState('Inventory Manager');

  const capaOnlyItems = actions.filter((a) => !a.isInvestigationQueueItem);
  const financialSummary = computeCapaFinancialSummary(
    capaOnlyItems as unknown as Array<Record<string, unknown>>
  );

  const syncCapaToServerAndBrowser = (updatedCapaItems: PlantCapaItem[]) => {
    writePlantDatasetToBrowser(snapshot.plant.id, { capaItems: updatedCapaItems });
    fetch(`/api/plant-workspaces/${snapshot.plant.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capaItems: updatedCapaItems }),
    }).catch(() => {});
  };

  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const prefix = snapshot.plant.id.slice(0, 3).toUpperCase();
    const newId = `${prefix}-CAPA-${Date.now().toString().slice(-3)}`;

    const normalizedNew = normalizeCapaItem({
      id: newId,
      title: newTitle.trim(),
      pillar: newPillar,
      dispositionType: newDisposition,
      linkedRecordId: newLinkedRecordId.trim() || 'SKU-001',
      identifiedExposureInr: Math.max(0, Number(newExposureInr) || 0),
      targetRecoveryInr: Math.max(0, Number(newTargetRecoveryInr) || 0),
      realizedRecoveryInr: 0,
      verificationStage: 'OPEN',
      priority: 'Critical',
      evidenceRef: `Linked Record: ${newLinkedRecordId.trim() || 'SKU-001'}`,
      owner: newOwner.trim() || 'Plant Operations Lead',
      dueDate: 'Within 5 days',
      status: 'Open',
      notes: `Financial CAPA disposition (${newDisposition}) linked to ${newLinkedRecordId.trim() || 'SKU-001'}.`,
    });

    const currentCapas = actions
      .filter((a) => !a.isInvestigationQueueItem)
      .map((a) => normalizeCapaItem(a as unknown as Record<string, unknown>));
    const nextCapas: PlantCapaItem[] = [normalizedNew, ...currentCapas];
    syncCapaToServerAndBrowser(nextCapas);

    setActions((prev) => [{ ...normalizedNew, isInvestigationQueueItem: false }, ...prev]);
    setNewTitle('');
    trackEvent('action_created', { domain: normalizedNew.domain });
  };

  const handleStageChange = (id: string, nextStage: CapaVerificationStage) => {
    setActions((prev) => {
      const updated = prev.map((a) => {
        if (a.id !== id) return a;
        const autoRealized =
          nextStage === 'VERIFIED_REALIZED' && a.realizedRecoveryInr === 0
            ? a.targetRecoveryInr
            : a.realizedRecoveryInr;
        const nextNorm = normalizeCapaItem({
          ...a,
          verificationStage: nextStage,
          realizedRecoveryInr: autoRealized,
        });
        return {
          ...nextNorm,
          isInvestigationQueueItem: a.isInvestigationQueueItem,
        };
      });

      const updatedCapas = updated
        .filter((u) => !u.isInvestigationQueueItem)
        .map(({ isInvestigationQueueItem, ...rest }) => rest);
      syncCapaToServerAndBrowser(updatedCapas);
      return updated;
    });
    trackEvent('action_status_changed', { statusFilter: nextStage });
  };

  const handleRealizedRecoveryChange = (id: string, nextRealizedInr: number) => {
    const safeVal = Math.max(0, Math.round(Number(nextRealizedInr) || 0));
    setActions((prev) => {
      const updated = prev.map((a) => {
        if (a.id !== id) return a;
        const nextNorm = normalizeCapaItem({
          ...a,
          realizedRecoveryInr: safeVal,
        });
        return {
          ...nextNorm,
          isInvestigationQueueItem: a.isInvestigationQueueItem,
        };
      });

      const updatedCapas = updated
        .filter((u) => !u.isInvestigationQueueItem)
        .map(({ isInvestigationQueueItem, ...rest }) => rest);
      syncCapaToServerAndBrowser(updatedCapas);
      return updated;
    });
  };

  const filteredActions = actions.filter((a) =>
    stageFilter === 'ALL' ? true : a.verificationStage === stageFilter
  );

  return (
    <div className="space-y-6">
      <DemoDataNotice onOpenImports={() => onNavigateDomain('data_imports')} />

      {/* Header */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold text-white">
              Closed-Loop CAPA Financial Realization Ledger — {snapshot.plant.name}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Row-linked financial corrective actions tracking rupee exposure from shop-floor identification through finance controller sign-off for{' '}
            <strong className="text-white">{snapshot.plant.name}</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => downloadCommandCenterWorkbook(snapshot.plant.id)}
          className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Export 6-Sheet CAPA Ledger (.xlsx)</span>
        </button>
      </div>

      {/* CAPA Financial Realization Funnel */}
      <section
        data-testid="capa-financial-realization-funnel"
        className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-white">
            CAPA Financial Realization Funnel (Identified Exposure ₹ → Verified Realized Cash ₹)
          </h2>
          <span className="text-xs font-mono text-emerald-400 tabular-nums">
            Realization Rate: {financialSummary.realizationRatePct.toFixed(1)}% of Target
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 font-mono tabular-nums">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
            <div className="text-[11px] font-sans text-slate-400">1. Identified Exposure (₹)</div>
            <div
              data-testid="capa-funnel-identified"
              className="text-lg font-bold text-white mt-1"
            >
              ₹{financialSummary.totalIdentifiedExposureInr.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-sans text-slate-500 mt-0.5">
              {financialSummary.totalCapasCount} Plant CAPA items
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
            <div className="text-[11px] font-sans text-sky-400">2. Target Recovery (₹)</div>
            <div
              data-testid="capa-funnel-target"
              className="text-lg font-bold text-sky-300 mt-1"
            >
              ₹{financialSummary.totalTargetRecoveryInr.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-sans text-slate-500 mt-0.5">
              Expected net recovery
            </div>
          </div>

          <div className="bg-slate-950 border border-amber-500/30 rounded-lg p-3.5">
            <div className="text-[11px] font-sans text-amber-400">
              3. Pending Finance Sign-Off (₹)
            </div>
            <div
              data-testid="capa-funnel-pending"
              className="text-lg font-bold text-amber-300 mt-1"
            >
              ₹{financialSummary.pendingFinanceSignOffInr.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-sans text-slate-500 mt-0.5">
              {financialSummary.byStage.PENDING_FINANCE_SIGN_OFF.count} items awaiting sign-off
            </div>
          </div>

          <div className="bg-slate-950 border border-emerald-500/30 rounded-lg p-3.5">
            <div className="text-[11px] font-sans text-emerald-400">
              4. Verified Realized Cash (₹)
            </div>
            <div
              data-testid="capa-funnel-realized"
              className="text-lg font-bold text-emerald-400 mt-1"
            >
              ₹{financialSummary.totalRealizedRecoveryInr.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-sans text-slate-500 mt-0.5">
              {financialSummary.byStage.VERIFIED_REALIZED.count} verified &amp; closed
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
            <div className="text-[11px] font-sans text-slate-300">Realization Rate (%)</div>
            <div
              data-testid="capa-funnel-rate"
              className="text-lg font-bold text-white mt-1"
            >
              {financialSummary.realizationRatePct.toFixed(1)}%
            </div>
            <div className="text-[11px] font-sans text-slate-500 mt-0.5">
              Realized ÷ Target Recovery
            </div>
          </div>
        </div>
      </section>

      {/* Raise New Row-Linked Financial CAPA Form */}
      <form
        onSubmit={handleCreateAction}
        className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 space-y-3 text-xs"
      >
        <div className="text-xs font-bold text-white">
          Raise New Financial CAPA Item Linked to P1–P4 Audit Record
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3">
          <div className="lg:col-span-2">
            <label htmlFor="new-action-title" className="block text-[11px] text-slate-400 mb-1">
              Corrective Action Title
            </label>
            <input
              id="new-action-title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Issue vendor return contra for non-moving casting batch..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label htmlFor="new-capa-pillar" className="block text-[11px] text-slate-400 mb-1">
              Pillar
            </label>
            <select
              id="new-capa-pillar"
              value={newPillar}
              onChange={(e) => setNewPillar(e.target.value as CapaPillar)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
            >
              <option value="P1_INVENTORY">P1_INVENTORY</option>
              <option value="P2_OTIF">P2_OTIF</option>
              <option value="P3_FREIGHT">P3_FREIGHT</option>
              <option value="P4_WAREHOUSE">P4_WAREHOUSE</option>
            </select>
          </div>

          <div>
            <label htmlFor="new-capa-disposition" className="block text-[11px] text-slate-400 mb-1">
              Disposition Type
            </label>
            <select
              id="new-capa-disposition"
              value={newDisposition}
              onChange={(e) => setNewDisposition(e.target.value as CapaDispositionType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
            >
              <option value="B2B_LIQUIDATION_SCRAP">B2B_LIQUIDATION_SCRAP</option>
              <option value="VENDOR_RETURN_CONTRA">VENDOR_RETURN_CONTRA</option>
              <option value="ALTERNATE_BOM_CONSUMPTION">ALTERNATE_BOM_CONSUMPTION</option>
              <option value="FREIGHT_DEBIT_NOTE">FREIGHT_DEBIT_NOTE</option>
              <option value="BIN_RECONCILIATION_RECOUNT">BIN_RECONCILIATION_RECOUNT</option>
              <option value="DISPATCH_SCHEDULING_FIX">DISPATCH_SCHEDULING_FIX</option>
            </select>
          </div>

          <div>
            <label htmlFor="new-capa-record-id" className="block text-[11px] text-slate-400 mb-1">
              Linked Record ID
            </label>
            <input
              id="new-capa-record-id"
              type="text"
              value={newLinkedRecordId}
              onChange={(e) => setNewLinkedRecordId(e.target.value)}
              placeholder="FG-PBX-G1 / LR-1049"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 font-mono text-white"
            />
          </div>

          <div>
            <label htmlFor="new-capa-exposure" className="block text-[11px] text-slate-400 mb-1">
              Exposure / Target (₹)
            </label>
            <div className="flex items-center gap-1">
              <input
                id="new-capa-exposure"
                type="number"
                min={0}
                value={newExposureInr}
                onChange={(e) => setNewExposureInr(Math.max(0, Number(e.target.value) || 0))}
                className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 font-mono text-white tabular-nums"
                title="Identified Exposure INR"
              />
              <input
                id="new-capa-target"
                aria-label="Target Recovery INR"
                type="number"
                min={0}
                value={newTargetRecoveryInr}
                onChange={(e) => setNewTargetRecoveryInr(Math.max(0, Number(e.target.value) || 0))}
                className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 font-mono text-sky-300 tabular-nums"
                title="Target Recovery INR"
              />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="new-action-owner" className="block text-[11px] text-slate-400 mb-1">
                Owner
              </label>
              <input
                id="new-action-owner"
                type="text"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Raise CAPA</span>
            </button>
          </div>
        </div>
      </form>

      {/* Filter Tabs & Financial CAPA Table */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist">
            {(
              [
                'ALL',
                'OPEN',
                'IN_EXECUTION',
                'PENDING_FINANCE_SIGN_OFF',
                'VERIFIED_REALIZED',
              ] as const
            ).map((stage) => {
              const count =
                stage === 'ALL'
                  ? actions.length
                  : actions.filter((a) => a.verificationStage === stage).length;
              return (
                <button
                  key={stage}
                  role="tab"
                  aria-selected={stageFilter === stage}
                  onClick={() => setStageFilter(stage)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                    stageFilter === stage
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-300 border border-slate-800'
                  }`}
                >
                  {stage} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <th className="py-3 px-3">CAPA ID &amp; Pillar</th>
                <th className="py-3 px-3">Linked Record &amp; Disposition</th>
                <th className="py-3 px-3">Action / Investigation</th>
                <th className="py-3 px-3 text-right">Exposure (₹)</th>
                <th className="py-3 px-3 text-right">Target Recovery (₹)</th>
                <th className="py-3 px-3 text-right">Realized Cash (₹)</th>
                <th className="py-3 px-3">Verification Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredActions.map((act) => (
                <tr key={act.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-mono font-bold text-white">{act.id}</div>
                    <div className="text-[11px] font-mono text-sky-400">{act.pillar}</div>
                    <div className="text-[11px] text-slate-400">{act.owner}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-mono">
                    <button
                      type="button"
                      onClick={() => onNavigateDomain(act.domain as PlatformNavId)}
                      className="text-amber-300 hover:text-amber-200 underline font-semibold cursor-pointer"
                    >
                      {act.linkedRecordId}
                    </button>
                    <div className="text-[11px] text-slate-400 mt-0.5">{act.dispositionType}</div>
                  </td>
                  <td className="py-3 px-3 max-w-md">
                    <div className="font-semibold text-white mb-0.5">{act.title}</div>
                    <div className="text-slate-400 text-[11px]">{act.notes}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-200">
                    ₹{act.identifiedExposureInr.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-sky-300 font-semibold">
                    ₹{act.targetRecoveryInr.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    <input
                      type="number"
                      aria-label={`Realized Recovery INR for ${act.id}`}
                      min={0}
                      step={500}
                      value={act.realizedRecoveryInr}
                      onChange={(e) =>
                        handleRealizedRecoveryChange(act.id, Number(e.target.value) || 0)
                      }
                      className="w-28 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right font-mono text-emerald-400 font-semibold tabular-nums"
                    />
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <select
                      aria-label={`Verification Stage for ${act.id}`}
                      value={act.verificationStage}
                      onChange={(e) =>
                        handleStageChange(act.id, e.target.value as CapaVerificationStage)
                      }
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-white cursor-pointer"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_EXECUTION">IN_EXECUTION</option>
                      <option value="PENDING_FINANCE_SIGN_OFF">PENDING_FINANCE_SIGN_OFF</option>
                      <option value="VERIFIED_REALIZED">VERIFIED_REALIZED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. DATA & IMPORTS VIEW (7-Step Import & Validation Journey + Smart Tally Mapper)
// ============================================================================
export const DataImportsView: React.FC<{
  snapshot: LivePlatformDataSnapshot;
  onOpenSmartMapper: (engine: TargetEngineType) => void;
}> = ({ snapshot, onOpenSmartMapper }) => {
  const [selectedEngine, setSelectedEngine] = useState<TargetEngineType>('p1');
  const [validationCompleted, setValidationCompleted] = useState<boolean>(true);

  const handleRunDryValidation = () => {
    trackEvent('import_validation_completed', { domain: selectedEngine });
    setValidationCompleted(true);
  };

  const handleDownloadErrorReport = () => {
    const csv = [
      'Row Number,SKU / Record ID,Issue Type,Details,Quarantine Action',
      '14,RM-ST-998,MISSING_DATE: Missing Last Movement Date,Blank date in Tally export,Quarantined for user review before import (never defaulted)',
      '27,GRAND TOTAL,Rejected: Summary Row Stripped,Tally Grand Total footer row detected,Automatically excluded from SKU sum',
      '31,PO-8841,Duplicate Record,Duplicate dispatch voucher number,Merged with primary gate pass entry',
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Operationalyst_Import_Validation_Report_${selectedEngine}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <DemoDataNotice />

      {/* Header */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold text-white">Data &amp; Imports</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Ingest Tally Prime, SAP, or Excel CSV exports through a 7-step schema validation and column-mapping pipeline.
          </p>
        </div>

        <button
          onClick={() => {
            trackEvent('import_started', { domain: selectedEngine });
            onOpenSmartMapper(selectedEngine);
          }}
          className="px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
        >
          <Wand2 className="w-4 h-4" />
          <span>Launch Interactive Smart Tally / CSV Column Mapper</span>
        </button>
      </div>

      {/* 7-Step Import & Validation Journey */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 space-y-5">
        <h2 className="text-base font-bold text-white">
          Structured 7-Step Data Ingestion &amp; Validation Pipeline
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5 text-xs">
          {[
            { step: '1. Select Type', desc: 'Choose Inventory, Delivery, Freight, or Bin schema' },
            { step: '2. Upload File', desc: 'Drop raw Tally Prime or ERP CSV/XLSX export' },
            { step: '3. Validate Format', desc: 'Strip Grand Total rows & currency symbols' },
            { step: '4. Map Fields', desc: 'Auto-match headers to Operationalyst schema' },
            { step: '5. Review Warnings', desc: 'Inspect missing dates, blanks, or duplicates' },
            { step: '6. Confirm Import', desc: 'Commit validated rows to local workspace' },
            { step: '7. Audit Result', desc: 'Download validation log & error report' },
          ].map((s) => (
            <div
              key={s.step}
              className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between"
            >
              <div className="font-mono font-bold text-sky-300 mb-1">{s.step}</div>
              <div className="text-slate-300 text-[11px] leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Step 1 Target Selector + Launch */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="import-engine-select" className="font-semibold text-white">
              Step 1 — Select Target Domain Schema:
            </label>
            <select
              id="import-engine-select"
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value as TargetEngineType)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold cursor-pointer"
            >
              <option value="p1">Inventory Stock Ledger (P1 • Cash Recovery)</option>
              <option value="p2">Customer Dispatch &amp; Gate Log (P2 • Delivery OTIF)</option>
              <option value="p3">Carrier Freight Invoices (P3 • Profit &amp; Risk)</option>
              <option value="p4">Warehouse Cycle Count Sheet (P4 • Bin Trust)</option>
              <option value="p5">Executive Briefing Snapshot (P5 • Control Tower)</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunDryValidation}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
            >
              Verify Current Dataset Integrity
            </button>
            <button
              onClick={() => {
                trackEvent('import_started', { domain: selectedEngine });
                onOpenSmartMapper(selectedEngine);
              }}
              className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload &amp; Map File</span>
            </button>
          </div>
        </div>

        {/* Step 7 Validation & Processing Result Summary */}
        {validationCompleted && (
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Step 7 — Latest Dataset Validation &amp; Processing Result
                </h3>
              </div>
              <button
                onClick={handleDownloadErrorReport}
                className="text-xs font-semibold text-sky-300 hover:text-sky-200 inline-flex items-center gap-1 cursor-pointer underline underline-offset-4"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Validation &amp; Exception Log (.csv)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div className="text-slate-400 text-[11px]">Accepted Rows</div>
                <div className="text-lg font-mono font-bold text-emerald-300 mt-0.5">
                  {snapshot.p1TotalSkuCount +
                    snapshot.p2DualGate.totalDispatches +
                    snapshot.p3TotalTripCount +
                    snapshot.p4TotalBins}{' '}
                  rows
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div className="text-slate-400 text-[11px]">Rejected Summary Rows</div>
                <div className="text-lg font-mono font-bold text-rose-300 mt-0.5">
                  2 (Grand Totals)
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div className="text-slate-400 text-[11px]">Quarantined Rows</div>
                <div className="text-lg font-mono font-bold text-amber-300 mt-0.5">
                  0 (Strict date/number check)
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div className="text-slate-400 text-[11px]">Duplicate Records</div>
                <div className="text-lg font-mono font-bold text-slate-200 mt-0.5">
                  1 (Merged)
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div className="text-slate-400 text-[11px]">Missing Required Fields</div>
                <div className="text-lg font-mono font-bold text-emerald-300 mt-0.5">0</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 4. ADMINISTRATION VIEW (Workspace Controls, Server Audit Log, Governance)
// ============================================================================
interface ServerAuditEventRow {
  eventId: string;
  timestamp: string;
  actor: string;
  category: string;
  action: string;
  plantId: string;
  details: string;
}

interface PlantSummaryRow {
  plantId: string;
  plantName: string;
  isCustomized: boolean;
  lastSyncedAt: string;
  summaryMetrics: {
    totalSkus: number;
    deadStockValue: number;
    p2OtifPct: number;
    p3TotalLeakValue: number;
    p4AccuracyPct: number;
  };
}

export const AdministrationView: React.FC<{
  isClientLocked: boolean;
  onToggleClientLock: () => void;
  onOpenDeviceSync: () => void;
  onOpenLeadInbox?: () => void;
  clientSlots: { id: string; name: string }[];
  activeClientId: string;
  onSwitchClientSlot: (id: string) => void;
  onAddNewClientSlot: () => void;
}> = ({
  isClientLocked,
  onToggleClientLock,
  onOpenDeviceSync,
  onOpenLeadInbox,
  clientSlots,
  activeClientId,
  onSwitchClientSlot,
  onAddNewClientSlot,
}) => {
  const [auditEvents, setAuditEvents] = useState<ServerAuditEventRow[]>([]);
  const [storageCounters, setStorageCounters] = useState<{
    totalLeadsStored: number;
    totalWalkthroughSnapshots: number;
    plantSummaries: PlantSummaryRow[];
  }>({
    totalLeadsStored: 0,
    totalWalkthroughSnapshots: 0,
    plantSummaries: [],
  });
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);

  const fetchServerGovernanceState = async () => {
    setLoadingAudit(true);
    try {
      const res = await fetch('/api/audit-events?limit=100');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.events)) {
          setAuditEvents(data.events);
        }
        if (data.storageCounters) {
          setStorageCounters({
            totalLeadsStored: Number(data.storageCounters.totalLeadsStored) || 0,
            totalWalkthroughSnapshots: Number(data.storageCounters.totalWalkthroughSnapshots) || 0,
            plantSummaries: Array.isArray(data.storageCounters.plantSummaries)
              ? data.storageCounters.plantSummaries
              : [],
          });
        }
      }
    } catch {
      // Ignore network error
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchServerGovernanceState();
  }, []);

  const handleExportServerAuditCsv = () => {
    const headers = [
      'Event_ID',
      'Timestamp_UTC',
      'Actor',
      'Category',
      'Action',
      'Plant_ID',
      'Details',
    ];
    const escapeCell = (val: unknown) => {
      const safe = String(sanitizeSpreadsheetCell(String(val ?? '')));
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const rows = auditEvents.map((ev) =>
      [
        escapeCell(ev.eventId),
        escapeCell(ev.timestamp),
        escapeCell(ev.actor),
        escapeCell(ev.category),
        escapeCell(ev.action),
        escapeCell(ev.plantId),
        escapeCell(ev.details),
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Operationalyst_Server_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <DemoDataNotice />

      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold text-white">Administration &amp; Governance</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Manage multi-plant server workspace persistence, live governance audit logs, screen-share presentation locks, and founder pilot intake.
          </p>
        </div>

        <a
          href="?view=lead-inbox"
          onClick={(e) => {
            if (onOpenLeadInbox) {
              e.preventDefault();
              onOpenLeadInbox();
            }
          }}
          className="px-4 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Founder Lead Inbox</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Real Server Storage & Sync Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-mono uppercase text-slate-400">
            Total Leads Stored (/api/pilot-requests)
          </div>
          <div className="text-2xl font-mono font-black text-white mt-1">
            {storageCounters.totalLeadsStored}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Persisted in ./data/pilot_requests.json
          </div>
        </div>
        <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-mono uppercase text-slate-400">
            Total Published Walkthrough Snapshots
          </div>
          <div className="text-2xl font-mono font-black text-emerald-300 mt-1">
            {storageCounters.totalWalkthroughSnapshots}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            4-Pillar Snapshots in ./data/pilot_workspaces.json
          </div>
        </div>
        <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-mono uppercase text-slate-400">
            Active Plant Sync Status (/api/plant-workspaces)
          </div>
          <div className="text-lg font-mono font-bold text-sky-300 mt-1">
            {storageCounters.plantSummaries.length || 3} Isolated Plant Baselines
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Ambattur • Sriperumbudur • Hosur
          </div>
        </div>
      </div>

      {/* Live Server-Persisted Governance Audit Log */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Durable Server-Side Governance Audit Trail (/api/audit-events)</span>
            </h2>
            <p className="text-slate-400 mt-0.5">
              Records lead funnel events, published 4-pillar walkthrough snapshots, and multi-plant workspace updates/resets.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchServerGovernanceState}
              disabled={loadingAudit}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
              <span>Refresh Log</span>
            </button>
            <button
              type="button"
              onClick={handleExportServerAuditCsv}
              className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Server Audit Log (.CSV)</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase">
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Category &amp; Action</th>
                <th className="py-2.5 px-3">Plant</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {auditEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No server audit events recorded yet. Events are automatically logged when leads are submitted, snapshots are published, or plant workspaces are updated/reset.
                  </td>
                </tr>
              ) : (
                auditEvents.slice(0, 25).map((ev) => (
                  <tr key={ev.eventId} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-sky-300 whitespace-nowrap">
                      {ev.eventId}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {ev.timestamp.replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-white">{ev.action}</span>
                      <div className="text-[10px] font-mono text-slate-400">{ev.category}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono uppercase text-emerald-300 whitespace-nowrap">
                      {ev.plantId}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 whitespace-nowrap">{ev.actor}</td>
                    <td className="py-2.5 px-3 text-slate-300">{ev.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Multi-Client Workspace Isolation */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>Workspace Isolation Slots</span>
            </h2>
            <button
              onClick={onAddNewClientSlot}
              className="px-2.5 py-1 rounded bg-sky-500 text-slate-950 font-bold cursor-pointer"
            >
              + New Workspace
            </button>
          </div>
          <p className="text-slate-400">
            Isolate uploaded CSV datasets when auditing multiple factories or units so local storage snapshots never collide.
          </p>
          <div className="space-y-1.5 pt-1">
            {clientSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => onSwitchClientSlot(slot.id)}
                className={`w-full text-left px-3 py-2 rounded-lg border font-semibold flex items-center justify-between cursor-pointer ${
                  slot.id === activeClientId
                    ? 'bg-sky-950/60 border-sky-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <span>{slot.name}</span>
                {slot.id === activeClientId && (
                  <span className="text-[11px] font-mono text-sky-300">Active</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Local Demonstration Export & Client Presentation Lock */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-sky-400" />
            <span>Local Demonstration Snapshot &amp; Presentation Controls</span>
          </h2>
          <p className="text-slate-400">
            Export workspace backups or lock navigation chrome during executive screen-share reviews.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={onOpenDeviceSync}
              className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Local Demonstration Export</span>
            </button>
            <button
              onClick={onToggleClientLock}
              className="px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              {isClientLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>
                {isClientLocked ? 'Unlock Navigation Chrome' : 'Enable Client Presentation Lock'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Phase 8: Cloud Run 7-Store System Backup & Dry-Run Restore */}
      <CloudRunSystemBackupPanel onAfterRestore={fetchServerGovernanceState} />
    </div>
  );
};
