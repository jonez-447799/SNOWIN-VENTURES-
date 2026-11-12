/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  KeyRound,
  RefreshCw,
  Download,
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  Save,
  Inbox,
  Copy,
  Share2,
  ExternalLink,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  PilotRequestRecord,
  PilotLeadStatus,
  ALLOWED_PILOT_LEAD_STATUSES,
} from '../utils/leadValidation';
import { toSafeCsvCell } from '../utils/importValidation';
import {
  downloadAuditTemplate,
  downloadPilotDataKitCsv,
  downloadPilotDataKitXlsx,
  buildStep2SuitabilityReplyTemplate,
  buildFounderFollowUpScripts,
} from '../utils/pilotDataKitExporter';
import { PilotWorkspaceSnapshot } from '../utils/pilotWorkspaceStore';
import { StockItem, RulesConfig } from '../project1/types';
import { formatCurrency } from '../project1/utils/calculations';
import { DispatchRow, RulesConfig as P2RulesConfig } from '../project2/types/otif';
import { Trip, RulesConfig as P3RulesConfig } from '../project3/types/freight';
import { AuditItem, AuditRules as P4RulesConfig } from '../project4/types/audit';
import {
  PlantId,
  MULTI_PLANT_BASELINES,
  readPlantDatasetFromBrowser,
} from '../data/multiPlantBaselines';
import type { VerifiedProofRecord } from '../utils/verifiedProofRegistryStore';
import type { FunnelDropOffReport } from '../utils/funnelAnalyticsStore';
import { CloudRunSystemBackupPanel } from '../components/CloudRunSystemBackupPanel';

interface FounderLeadInboxProps {
  onBackToHome: () => void;
  onOpenPlatform: () => void;
  onOpenAgentWorkforce?: () => void;
  onOpenWalkthrough?: (workspaceId: string, shareToken: string) => void;
  onOpenUploadPortal?: (leadId: string, uploadToken?: string) => void;
}

const DEFAULT_DEMO_KEY = 'operationalyst-local-dev-key';
const SESSION_STORAGE_ADMIN_KEY = 'operationalyst_founder_admin_key_v1';

const STATUS_LABELS: Record<PilotLeadStatus, string> = {
  NEW: 'NEW',
  SUITABILITY_REVIEW: 'SUITABILITY_REVIEW',
  NDA_SENT: 'NDA_SENT',
  APPROVED_FOR_UPLOAD: 'APPROVED_FOR_UPLOAD',
  CLOSED: 'CLOSED',
};

const STATUS_BADGE_STYLES: Record<PilotLeadStatus, string> = {
  NEW: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  SUITABILITY_REVIEW: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  NDA_SENT: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
  APPROVED_FOR_UPLOAD: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  CLOSED: 'bg-slate-800 text-slate-300 border-slate-700',
};

function loadPlantP1ToP4Dataset(plantId: PlantId): {
  skus: StockItem[];
  rules: RulesConfig;
  p2Dispatches: DispatchRow[];
  p2Rules: P2RulesConfig;
  p3FreightTrips: Trip[];
  p3Rules: P3RulesConfig;
  p4WarehouseBins: AuditItem[];
  p4Rules: P4RulesConfig;
} {
  const ds = readPlantDatasetFromBrowser(plantId);
  return {
    skus: ds.p1Items,
    rules: ds.p1Rules,
    p2Dispatches: ds.p2Dispatches,
    p2Rules: ds.p2Rules,
    p3FreightTrips: ds.p3Trips,
    p3Rules: ds.p3Rules,
    p4WarehouseBins: ds.p4Bins,
    p4Rules: ds.p4Rules,
  };
}

export const FounderLeadInbox: React.FC<FounderLeadInboxProps> = ({
  onBackToHome,
  onOpenPlatform,
  onOpenAgentWorkforce,
  onOpenWalkthrough,
  onOpenUploadPortal,
}) => {
  const [adminKey, setAdminKey] = useState<string>(() => {
    try {
      return sessionStorage.getItem(SESSION_STORAGE_ADMIN_KEY) || DEFAULT_DEMO_KEY;
    } catch {
      return DEFAULT_DEMO_KEY;
    }
  });

  const [leads, setLeads] = useState<PilotRequestRecord[]>([]);
  const [workspaces, setWorkspaces] = useState<PilotWorkspaceSnapshot[]>([]);
  const [isDefaultDevKey, setIsDefaultDevKey] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<boolean>(false);

  // Local draft state for status and founderNotes per leadId
  const [draftEdits, setDraftEdits] = useState<
    Record<string, { status: PilotLeadStatus; founderNotes: string }>
  >({});
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const [savedNoticeId, setSavedNoticeId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedReplyLeadId, setCopiedReplyLeadId] = useState<string | null>(null);

  // Server Pilot Snapshot Publisher State
  const [selectedPlantIdForSnapshot, setSelectedPlantIdForSnapshot] = useState<PlantId>('ambattur');
  const [selectedLeadIdForSnapshot, setSelectedLeadIdForSnapshot] = useState<string>('');
  const [snapshotCompanyName, setSnapshotCompanyName] = useState<string>(
    'Sri Murugan Auto Components Pvt Ltd'
  );
  const [snapshotPlantLocation, setSnapshotPlantLocation] = useState<string>(
    'Ambattur Industrial Estate, Chennai'
  );
  const [snapshotExecutiveNotes, setSnapshotExecutiveNotes] = useState<string>(
    'Initial 5-column stock ledger audit completed by C. Jones Snowin. Priority action: freeze reorders on Class-A items idle >= 180 days and review top 5 dead SKUs in Monday floor meeting.'
  );
  const [publishingSnapshot, setPublishingSnapshot] = useState<boolean>(false);
  const [publishedSnapshot, setPublishedSnapshot] = useState<PilotWorkspaceSnapshot | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [copiedWalkthroughId, setCopiedWalkthroughId] = useState<string | null>(null);
  const [copiedUploadPortalId, setCopiedUploadPortalId] = useState<string | null>(null);

  // Phase 7: Verified Proof Registry Publisher State
  const [verifiedProofs, setVerifiedProofs] = useState<VerifiedProofRecord[]>([]);
  const [proofWorkspaceId, setProofWorkspaceId] = useState<string>('AUDIT-DEMO-P1P4');
  const [proofIndustrySector, setProofIndustrySector] = useState<string>(
    'Precision Machined Castings & Industrial Valves (Ambattur Cluster)'
  );
  const [proofInitialChallenge, setProofInitialChallenge] = useState<string>(
    'High working-capital tie-up in non-moving Class-A castings alongside unverified transporter detention claims.'
  );
  const [proofAnalysisPerformed, setProofAnalysisPerformed] = useState<string>(
    'Executed 4-pillar deterministic audit (P1 Stock Velocity, P2 Dual-Gate OTIF, P3 Freight Rate Matrix, P4 Bin Variance) with Item 07 machine reserve spare protection.'
  );
  const [proofActionTaken, setProofActionTaken] = useState<string>(
    'Froze reorders on 8 dormant SKUs (>180d), protected critical CNC spares under Item 07, and initiated vendor contra recovery.'
  );
  const [proofApprovedQuotation, setProofApprovedQuotation] = useState<string>(
    'The 4-pillar walkthrough separated liquidatable dead stock from essential CNC reserve spares before our Monday floor review.'
  );
  const [proofClientSignOff, setProofClientSignOff] = useState<boolean>(false);
  const [publishingProof, setPublishingProof] = useState<boolean>(false);
  const [proofPublishError, setProofPublishError] = useState<string | null>(null);
  const [proofPublishSuccess, setProofPublishSuccess] = useState<string | null>(null);

  // Phase 8: Pre-Publish Readiness Scorecard & 14-Day Data Purge State
  const [readinessScorecard, setReadinessScorecard] = useState<{
    enginesHealthy: boolean;
    storesHealthy: boolean;
    customAdminKeyConfigured: boolean;
    readyForPublish: boolean;
    storesCounts?: Record<string, number>;
  } | null>(null);
  const [purgingWorkspaceId, setPurgingWorkspaceId] = useState<string | null>(null);
  const [sweepingExpired, setSweepingExpired] = useState<boolean>(false);
  const [purgeNotice, setPurgeNotice] = useState<string | null>(null);

  // Phase 9 & 10: First-Party Server Conversion Funnel, Scroll Depth & Field Hesitation State
  const [funnelReport, setFunnelReport] = useState<FunnelDropOffReport | null>(null);
  const [resettingFunnel, setResettingFunnel] = useState<boolean>(false);
  const [openScriptDrawerLeadId, setOpenScriptDrawerLeadId] = useState<string | null>(null);
  const [copiedScriptKey, setCopiedScriptKey] = useState<string | null>(null);

  const handleCopyFollowUpScript = async (scriptKey: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedScriptKey(scriptKey);
      setTimeout(() => {
        setCopiedScriptKey((prev) => (prev === scriptKey ? null : prev));
      }, 2500);
    } catch {}
  };

  const buildWalkthroughUrl = (workspaceId: string, shareToken: string): string => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
    return `${origin}${pathname}?view=pilot-findings&id=${encodeURIComponent(
      workspaceId
    )}&token=${encodeURIComponent(shareToken)}`;
  };

  const buildUploadPortalFullUrl = (lead: PilotRequestRecord): string => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
    if (lead.uploadPortalUrl) {
      return `${origin}${pathname}${lead.uploadPortalUrl}`;
    }
    return `${origin}${pathname}?view=pilot-upload&leadId=${encodeURIComponent(
      lead.leadId
    )}${lead.uploadToken ? `&token=${encodeURIComponent(lead.uploadToken)}` : ''}`;
  };

  const fetchLeadsAndWorkspaces = useCallback(async (keyToUse: string) => {
    setLoading(true);
    setAuthError(null);
    setSaveError(null);

    try {
      const [leadsRes, wsRes, proofsRes, readinessRes, funnelRes] = await Promise.all([
        fetch('/api/admin/pilot-requests', {
          method: 'GET',
          headers: { 'x-admin-key': keyToUse.trim() },
        }),
        fetch('/api/admin/pilot-workspaces', {
          method: 'GET',
          headers: { 'x-admin-key': keyToUse.trim() },
        }),
        fetch('/api/verified-proofs'),
        fetch('/api/admin/production-readiness', {
          method: 'GET',
          headers: { 'x-admin-key': keyToUse.trim() },
        }),
        fetch('/api/admin/funnel-analytics', {
          method: 'GET',
          headers: { 'x-admin-key': keyToUse.trim() },
        }),
      ]);

      const leadsData = await leadsRes.json().catch(() => null);
      if (!leadsRes.ok || !leadsData || !leadsData.ok) {
        setUnlocked(false);
        setAuthError(
          leadsData?.error ||
            `Authentication failed (HTTP ${leadsRes.status}). Check your Admin Access Key.`
        );
        setLoading(false);
        return;
      }

      const records: PilotRequestRecord[] = Array.isArray(leadsData.requests)
        ? leadsData.requests
        : [];
      setLeads(records);
      setIsDefaultDevKey(Boolean(leadsData.isDefaultDevKey));
      setUnlocked(true);

      if (records.length > 0 && !selectedLeadIdForSnapshot) {
        setSelectedLeadIdForSnapshot(records[0].leadId);
        setSnapshotCompanyName(records[0].companyName);
        setSnapshotPlantLocation(records[0].plantLocation);
      }

      const initialDrafts: Record<string, { status: PilotLeadStatus; founderNotes: string }> = {};
      records.forEach((r) => {
        initialDrafts[r.leadId] = {
          status: r.status,
          founderNotes: r.founderNotes || '',
        };
      });
      setDraftEdits(initialDrafts);

      const wsData = await wsRes.json().catch(() => null);
      if (wsRes.ok && wsData?.ok && Array.isArray(wsData.workspaces)) {
        setWorkspaces(wsData.workspaces);
        if (wsData.workspaces.length > 0) {
          setProofWorkspaceId(wsData.workspaces[0].workspaceId);
        }
      }

      const proofsData = await proofsRes.json().catch(() => null);
      if (proofsRes.ok && proofsData?.ok && Array.isArray(proofsData.proofs)) {
        setVerifiedProofs(proofsData.proofs);
      }

      const readinessData = await readinessRes.json().catch(() => null);
      if (readinessRes.ok && readinessData?.ok) {
        setReadinessScorecard({
          enginesHealthy: Boolean(readinessData.enginesHealthy),
          storesHealthy: Boolean(readinessData.storesHealthy),
          customAdminKeyConfigured: Boolean(readinessData.customAdminKeyConfigured),
          readyForPublish: Boolean(readinessData.readyForPublish),
          storesCounts: readinessData.storesCounts,
        });
      }

      const funnelData = await funnelRes.json().catch(() => null);
      if (funnelRes.ok && funnelData?.ok && funnelData.report) {
        setFunnelReport(funnelData.report as FunnelDropOffReport);
      }

      try {
        sessionStorage.setItem(SESSION_STORAGE_ADMIN_KEY, keyToUse.trim());
      } catch {}
    } catch {
      setAuthError('Failed to connect to /api/admin/pilot-requests.');
    } finally {
      setLoading(false);
    }
  }, [selectedLeadIdForSnapshot]);

  const handleResetFunnelAnalytics = async () => {
    setResettingFunnel(true);
    try {
      const res = await fetch('/api/admin/funnel-analytics/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey.trim(),
        },
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.report) {
        setFunnelReport(data.report as FunnelDropOffReport);
      }
    } catch {
      // Fail silently
    } finally {
      setResettingFunnel(false);
    }
  };

  const handlePurgeWorkspace = async (workspaceIdToPurge: string) => {
    setPurgingWorkspaceId(workspaceIdToPurge);
    setPurgeNotice(null);
    setSaveError(null);
    try {
      const res = await fetch(
        `/api/pilot-workspaces/${encodeURIComponent(workspaceIdToPurge)}/retention`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': adminKey.trim(),
          },
          body: JSON.stringify({
            action: 'PURGE_IMMEDIATELY',
            actor: 'FOUNDER_INBOX',
          }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setSaveError(data?.error || `Failed to purge workspace ${workspaceIdToPurge}.`);
        setPurgingWorkspaceId(null);
        return;
      }
      setPurgeNotice(
        `Purged workspace ${workspaceIdToPurge} and issued Deletion Certificate ${data.certificate?.certificateId}.`
      );
      await fetchLeadsAndWorkspaces(adminKey);
    } catch {
      setSaveError(`Network error while purging workspace ${workspaceIdToPurge}.`);
    } finally {
      setPurgingWorkspaceId(null);
    }
  };

  const handleSweepExpiredWorkspaces = async () => {
    setSweepingExpired(true);
    setPurgeNotice(null);
    setSaveError(null);
    try {
      const res = await fetch('/api/admin/data-purge/sweep-expired', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey.trim(),
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setSaveError(data?.error || 'Failed to sweep expired (>14d) workspaces.');
        setSweepingExpired(false);
        return;
      }
      setPurgeNotice(
        `Sweep completed: ${data.sweptCount || 0} expired (>14d) workspace(s) purged and issued DELCERT certificates.`
      );
      await fetchLeadsAndWorkspaces(adminKey);
    } catch {
      setSaveError('Network error while sweeping expired workspaces.');
    } finally {
      setSweepingExpired(false);
    }
  };

  useEffect(() => {
    fetchLeadsAndWorkspaces(adminKey);
  }, []);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeadsAndWorkspaces(adminKey);
  };

  const handleSelectPlantForSnapshot = (plantId: PlantId) => {
    setSelectedPlantIdForSnapshot(plantId);
    const baseline = MULTI_PLANT_BASELINES[plantId];
    if (!selectedLeadIdForSnapshot && baseline) {
      setSnapshotCompanyName(baseline.plantName);
      setSnapshotPlantLocation(baseline.clusterLocation);
    }
  };

  const handleSelectLeadForSnapshot = (leadId: string) => {
    setSelectedLeadIdForSnapshot(leadId);
    const matching = leads.find((l) => l.leadId === leadId);
    if (matching) {
      setSnapshotCompanyName(matching.companyName);
      setSnapshotPlantLocation(matching.plantLocation);
    } else {
      const baseline = MULTI_PLANT_BASELINES[selectedPlantIdForSnapshot];
      if (baseline) {
        setSnapshotCompanyName(baseline.plantName);
        setSnapshotPlantLocation(baseline.clusterLocation);
      }
    }
  };

  const handlePublishServerSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishingSnapshot(true);
    setPublishError(null);

    const {
      skus,
      rules,
      p2Dispatches,
      p2Rules,
      p3FreightTrips,
      p3Rules,
      p4WarehouseBins,
      p4Rules,
    } = loadPlantP1ToP4Dataset(selectedPlantIdForSnapshot);

    try {
      const res = await fetch('/api/admin/pilot-workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey.trim(),
        },
        body: JSON.stringify({
          companyName: snapshotCompanyName.trim(),
          plantLocation: snapshotPlantLocation.trim(),
          leadId: selectedLeadIdForSnapshot || undefined,
          preparedBy: 'C. Jones Snowin',
          executiveNotes: snapshotExecutiveNotes.trim(),
          rules,
          skus,
          p2Dispatches,
          p2Rules,
          p3FreightTrips,
          p3Rules,
          p4WarehouseBins,
          p4Rules,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.ok || !data.snapshot) {
        setPublishError(
          data?.error || `Failed to publish server pilot snapshot (HTTP ${res.status}).`
        );
        setPublishingSnapshot(false);
        return;
      }

      const created = data.snapshot as PilotWorkspaceSnapshot;
      setPublishedSnapshot(created);
      setWorkspaces((prev) => [created, ...prev.filter((w) => w.workspaceId !== created.workspaceId)]);

      // Automatically link published snapshot to the selected lead record on the server
      if (selectedLeadIdForSnapshot) {
        const walkthroughUrl = buildWalkthroughUrl(created.workspaceId, created.shareToken);
        const linkRes = await fetch(
          `/api/admin/pilot-requests/${encodeURIComponent(selectedLeadIdForSnapshot)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-key': adminKey.trim(),
            },
            body: JSON.stringify({
              linkedWorkspaceId: created.workspaceId,
              linkedWalkthroughUrl: walkthroughUrl,
              linkedPlantId: selectedPlantIdForSnapshot,
            }),
          }
        ).catch(() => null);

        if (linkRes && linkRes.ok) {
          const linkData = await linkRes.json().catch(() => null);
          if (linkData?.ok && linkData.record) {
            const updatedRecord = linkData.record as PilotRequestRecord;
            setLeads((prev) =>
              prev.map((item) =>
                item.leadId === selectedLeadIdForSnapshot ? updatedRecord : item
              )
            );
          }
        }
      }
    } catch {
      setPublishError('Network error while publishing Pilot Audit Workspace.');
    } finally {
      setPublishingSnapshot(false);
    }
  };

  const handleCopyWalkthroughLink = async (workspaceId: string, shareToken: string) => {
    const url = buildWalkthroughUrl(workspaceId, shareToken);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedWalkthroughId(workspaceId);
      setTimeout(() => {
        setCopiedWalkthroughId((curr) => (curr === workspaceId ? null : curr));
      }, 2500);
    } catch {}
  };

  const handleCopyStep2Reply = async (lead: PilotRequestRecord) => {
    const text = buildStep2SuitabilityReplyTemplate({
      leadId: lead.leadId,
      fullName: lead.fullName,
      companyName: lead.companyName,
      plantLocation: lead.plantLocation,
      erpSystem: lead.erpSystem,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopiedReplyLeadId(lead.leadId);
      setTimeout(() => {
        setCopiedReplyLeadId((curr) => (curr === lead.leadId ? null : curr));
      }, 2500);
    } catch {}
  };

  const handleSaveLead = async (leadId: string) => {
    const draft = draftEdits[leadId];
    if (!draft) return;

    setSavingLeadId(leadId);
    setSaveError(null);
    setSavedNoticeId(null);

    try {
      const res = await fetch(`/api/admin/pilot-requests/${encodeURIComponent(leadId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey.trim(),
        },
        body: JSON.stringify({
          status: draft.status,
          founderNotes: draft.founderNotes,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.ok) {
        setSaveError(data?.error || `Failed to update lead ${leadId}.`);
        setSavingLeadId(null);
        return;
      }

      const updatedRecord = data.record as PilotRequestRecord;
      setLeads((prev) => prev.map((item) => (item.leadId === leadId ? updatedRecord : item)));
      setDraftEdits((prev) => ({
        ...prev,
        [leadId]: {
          status: updatedRecord.status,
          founderNotes: updatedRecord.founderNotes || '',
        },
      }));
      setSavedNoticeId(leadId);
      setTimeout(() => {
        setSavedNoticeId((curr) => (curr === leadId ? null : curr));
      }, 2500);
    } catch {
      setSaveError(`Network error while saving lead ${leadId}.`);
    } finally {
      setSavingLeadId(null);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Lead ID',
      'Status',
      'Created At',
      'Updated At',
      'Company Name',
      'Plant Location',
      'Full Name',
      'Role / Title',
      'Buyer Persona',
      'Self-Assessment Score',
      'Self-Assessment Band',
      'Self-Assessment Summary',
      'Work Email',
      'Phone / WhatsApp',
      'ERP System',
      'Approx SKU Count',
      'Primary Challenge',
      'Linked Snapshot ID',
      'Linked Walkthrough URL',
      'Linked Plant ID',
      'Founder Notes',
      'Source View',
    ];

    const rows = leads.map((r) => [
      toSafeCsvCell(r.leadId),
      toSafeCsvCell(r.status),
      toSafeCsvCell(r.createdAt),
      toSafeCsvCell(r.updatedAt),
      toSafeCsvCell(r.companyName),
      toSafeCsvCell(r.plantLocation),
      toSafeCsvCell(r.fullName),
      toSafeCsvCell(r.roleTitle),
      toSafeCsvCell(r.buyerPersona || ''),
      toSafeCsvCell(r.selfAssessmentScore != null ? String(r.selfAssessmentScore) : ''),
      toSafeCsvCell(r.selfAssessmentBand || ''),
      toSafeCsvCell(r.selfAssessmentSummary || ''),
      toSafeCsvCell(r.workEmail),
      toSafeCsvCell(r.phoneOrWhatsapp),
      toSafeCsvCell(r.erpSystem),
      toSafeCsvCell(r.approxSkuCount),
      toSafeCsvCell(r.primaryChallenge),
      toSafeCsvCell(r.linkedWorkspaceId || ''),
      toSafeCsvCell(r.linkedWalkthroughUrl || ''),
      toSafeCsvCell(r.linkedPlantId || ''),
      toSafeCsvCell(r.founderNotes),
      toSafeCsvCell(r.sourceView),
    ]);

    const csvContent = [
      headers.map((h) => toSafeCsvCell(h)).join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Operationalyst_Pilot_Leads_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Compute KPI counts
  const totalLeads = leads.length;
  const newLeadsCount = leads.filter((l) => l.status === 'NEW').length;
  const suitabilityCount = leads.filter((l) => l.status === 'SUITABILITY_REVIEW').length;
  const ndaSentCount = leads.filter((l) => l.status === 'NDA_SENT').length;
  const approvedUploadCount = leads.filter((l) => l.status === 'APPROVED_FOR_UPLOAD').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 sm:px-6 py-3.5">
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
                <Inbox className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
                  Founder Lead Inbox &amp; Pilot Audit Command
                </h1>
                <p className="text-[11px] text-slate-400 font-mono">
                  Managed by C. Jones Snowin · Durable Lead &amp; Server Pilot Workspace Store
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="open-agent-workforce-btn"
              onClick={() => {
                if (onOpenAgentWorkforce) {
                  onOpenAgentWorkforce();
                } else if (typeof window !== 'undefined') {
                  window.location.href = '?view=agent-workforce';
                }
              }}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Agent Workforce &amp; Billing</span>
            </button>
            <button
              type="button"
              onClick={() => downloadPilotDataKitXlsx()}
              className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download 5-Column Data Guide (.XLSX)</span>
            </button>
            <button
              type="button"
              onClick={() => downloadPilotDataKitCsv()}
              className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Download Blank CSV Template</span>
            </button>
            {unlocked && (
              <>
                <button
                  onClick={() => fetchLeadsAndWorkspaces(adminKey)}
                  disabled={loading}
                  className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={handleExportCsv}
                  disabled={leads.length === 0}
                  className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Leads (.CSV)</span>
                </button>
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
        {/* Admin Key Authentication Bar */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
          <form onSubmit={handleUnlockSubmit} className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 space-y-1">
              <label
                htmlFor="founder-admin-key-input"
                className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Access Key (`x-admin-key` Header)</span>
              </label>
              <input
                id="founder-admin-key-input"
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter ADMIN_ACCESS_KEY..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Authenticate & Load Leads'}
            </button>
          </form>

          {isDefaultDevKey && unlocked && (
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">Local Demonstration Key Active:</strong> Using default key{' '}
                <code className="px-1.5 py-0.5 rounded bg-slate-950 text-amber-300 font-mono">
                  operationalyst-local-dev-key
                </code>
                . Set <code className="font-mono">ADMIN_ACCESS_KEY</code> in production environment variables before live deployment.
              </div>
            </div>
          )}

          {authError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200"
            >
              {authError}
            </div>
          )}
        </section>

        {unlocked && (
          <>
            {/* Phase 8: Pre-Publish Production Readiness Scorecard & 14-Day Retention Sweep */}
            <section
              data-testid="founder-readiness-scorecard"
              className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4 sm:p-5 space-y-3"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold uppercase text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {readinessScorecard?.readyForPublish !== false
                          ? 'READY FOR PUBLISH · ALL P1–P4 ENGINES & 7 STORES VERIFIED'
                          : 'READINESS CHECK PENDING'}
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Timing-Safe Auth (`crypto.timingSafeEqual`) · 14-Day Data Purge Engine (`DELCERT-...`)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    All 7 server stores (`pilot_requests`, `pilot_workspaces`, `plant_workspaces`, `import_runs`, `verified_proof_registry`, `audit_events`, `deletion_certificates`) are active and verified.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    data-testid="sweep-expired-workspaces-btn"
                    disabled={sweepingExpired}
                    onClick={handleSweepExpiredWorkspaces}
                    className="px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {sweepingExpired
                        ? 'Sweeping Expired Workspaces...'
                        : 'Sweep Expired (>14d) Workspaces'}
                    </span>
                  </button>
                </div>
              </div>

              {purgeNotice && (
                <div
                  data-testid="founder-purge-notice"
                  className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 font-mono text-xs"
                >
                  {purgeNotice}
                </div>
              )}
            </section>

            {/* Phase 9: Live B2B Conversion & Drop-Off Funnel Scorecard */}
            {funnelReport && (
              <section
                data-testid="founder-funnel-analytics-panel"
                className="bg-slate-900 border border-cyan-500/30 rounded-xl p-4 sm:p-5 space-y-4 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2 font-mono">
                      <span className="px-2.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold uppercase text-[11px]">
                        LIVE B2B CONVERSION &amp; DROP-OFF FUNNEL (`./data/funnel_analytics.json`)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Total Tracked Events: {funnelReport.totalEventsRecorded} · Bottleneck:{' '}
                        <strong className="text-amber-300">{funnelReport.primaryBottleneckStage}</strong>
                      </span>
                    </div>
                    <p className="text-slate-300">
                      First-party, zero-cookie conversion tracking from cold LinkedIn landing view to 50% scroll depth, sample report inspection, audit modal open, and submitted lead.
                    </p>
                  </div>

                  <button
                    type="button"
                    data-testid="reset-funnel-analytics-btn"
                    disabled={resettingFunnel}
                    onClick={handleResetFunnelAnalytics}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-[11px] cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {resettingFunnel ? 'Resetting...' : 'Reset Funnel Counters'}
                  </button>
                </div>

                {/* 5-Stage B2B Funnel Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono">
                  {funnelReport.stages.map((stg, idx) => (
                    <div
                      key={stg.stageId}
                      data-testid={`funnel-stage-card-${stg.stageId}`}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1"
                    >
                      <div className="text-[10px] text-slate-400 font-bold uppercase truncate">
                        {stg.label}
                      </div>
                      <div className="text-xl font-black text-white">{stg.count}</div>
                      {idx === 0 ? (
                        <div className="text-[10px] text-emerald-400">100% Top-of-Funnel</div>
                      ) : (
                        <div className="text-[10px] flex items-center justify-between gap-1">
                          <span className="text-emerald-300">Keep: {stg.retentionFromPreviousPct}%</span>
                          <span className="text-rose-400">Drop: {stg.dropOffFromPreviousPct}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 4 Executive Conversion & Drop-Off Rates */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">First 5s / Hero Drop-Off %</span>
                    <span
                      data-testid="funnel-rate-hero-dropoff"
                      className="text-sm font-bold text-amber-300"
                    >
                      {funnelReport.rates.first5sHeroDropOffPct}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Middle-Page Exploration %</span>
                    <span
                      data-testid="funnel-rate-exploration"
                      className="text-sm font-bold text-cyan-300"
                    >
                      {funnelReport.rates.middlePageExplorationRatePct}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Modal-to-Submission %</span>
                    <span
                      data-testid="funnel-rate-modal-conversion"
                      className="text-sm font-bold text-emerald-300"
                    >
                      {funnelReport.rates.modalToSubmissionConversionPct}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-500/30">
                    <span className="text-slate-400 block">Visitor-to-Lead Conversion %</span>
                    <span
                      data-testid="funnel-rate-overall-conversion"
                      className="text-sm font-bold text-emerald-400"
                    >
                      {funnelReport.rates.overallVisitorToLeadConversionPct}%
                    </span>
                  </div>
                </div>

                {/* Phase 10: 4-Stage Scroll Depth & Field-Level Hesitation / Abandonment Breakdown */}
                <div
                  data-testid="founder-field-hesitation-breakdown"
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-[11px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <span className="text-amber-300 font-bold uppercase">
                      Phase 10 · 4-Stage Scroll Depth &amp; Field-Level Modal Hesitation Telemetry (`focus_*` / `abandoned_at_*`)
                    </span>
                    <span className="text-slate-400">
                      Total Modal Abandonments:{' '}
                      <strong className="text-rose-300">
                        {funnelReport.fieldHesitationBreakdown?.abandonmentCounts.totalAbandoned ?? 0}
                      </strong>
                    </span>
                  </div>

                  {/* 4-Stage Scroll Depth Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">25% Scroll Depth</span>
                      <span className="font-bold text-white">
                        {funnelReport.scrollDepthBreakdown?.scroll25Count ?? 0}{' '}
                        <span className="text-slate-400 text-[10px]">
                          ({funnelReport.scrollDepthBreakdown?.scroll25PctOfViews ?? 0}%)
                        </span>
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">50% Scroll Depth</span>
                      <span className="font-bold text-white">
                        {funnelReport.scrollDepthBreakdown?.scroll50Count ?? 0}{' '}
                        <span className="text-slate-400 text-[10px]">
                          ({funnelReport.scrollDepthBreakdown?.scroll50PctOfViews ?? 0}%)
                        </span>
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">75% Scroll Depth</span>
                      <span className="font-bold text-white">
                        {funnelReport.scrollDepthBreakdown?.scroll75Count ?? 0}{' '}
                        <span className="text-slate-400 text-[10px]">
                          ({funnelReport.scrollDepthBreakdown?.scroll75PctOfViews ?? 0}%)
                        </span>
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">90% Scroll Depth</span>
                      <span className="font-bold text-white">
                        {funnelReport.scrollDepthBreakdown?.scroll90Count ?? 0}{' '}
                        <span className="text-slate-400 text-[10px]">
                          ({funnelReport.scrollDepthBreakdown?.scroll90PctOfViews ?? 0}%)
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Field Focus vs Abandonment Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">No Field Touched</span>
                      <span className="text-rose-300 font-bold">
                        Abandoned: {funnelReport.fieldHesitationBreakdown?.abandonmentCounts.none ?? 0}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">1. Name &amp; Role</span>
                      <span className="text-sky-300">
                        Focus: {funnelReport.fieldHesitationBreakdown?.focusCounts.name_field ?? 0}
                      </span>{' '}
                      ·{' '}
                      <span className="text-rose-300 font-bold">
                        Drop: {funnelReport.fieldHesitationBreakdown?.abandonmentCounts.name_field ?? 0}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">2. Company Name</span>
                      <span className="text-sky-300">
                        Focus: {funnelReport.fieldHesitationBreakdown?.focusCounts.company_field ?? 0}
                      </span>{' '}
                      ·{' '}
                      <span className="text-rose-300 font-bold">
                        Drop: {funnelReport.fieldHesitationBreakdown?.abandonmentCounts.company_field ?? 0}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">3. Email / WhatsApp</span>
                      <span className="text-sky-300">
                        Focus: {funnelReport.fieldHesitationBreakdown?.focusCounts.contact_field ?? 0}
                      </span>{' '}
                      ·{' '}
                      <span className="text-rose-300 font-bold">
                        Drop: {funnelReport.fieldHesitationBreakdown?.abandonmentCounts.contact_field ?? 0}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">4. ERP System</span>
                      <span className="text-sky-300">
                        Focus: {funnelReport.fieldHesitationBreakdown?.focusCounts.erp_field ?? 0}
                      </span>{' '}
                      ·{' '}
                      <span className="text-rose-300 font-bold">
                        Drop: {funnelReport.fieldHesitationBreakdown?.abandonmentCounts.erp_field ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-emerald-300 font-sans">
                    <strong>Diagnostic Insight:</strong>{' '}
                    {funnelReport.fieldHesitationBreakdown?.diagnosticRecommendation}
                  </div>
                </div>
              </section>
            )}

            {/* 5 KPI Summary Cards */}
            <section
              aria-label="Lead Funnel Summary Metrics"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 font-mono">Total Leads</div>
                <div
                  data-testid="kpi-total-leads"
                  className="text-2xl font-mono font-bold text-white mt-1"
                >
                  {totalLeads}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">All captured requests</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-sky-300 font-mono">New Leads</div>
                <div
                  data-testid="kpi-new-leads"
                  className="text-2xl font-mono font-bold text-sky-300 mt-1"
                >
                  {newLeadsCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Awaiting initial review</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-amber-300 font-mono">In Suitability Review</div>
                <div
                  data-testid="kpi-suitability-leads"
                  className="text-2xl font-mono font-bold text-amber-300 mt-1"
                >
                  {suitabilityCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Evaluating ERP &amp; SKU fit</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-indigo-300 font-mono">NDA Sent</div>
                <div
                  data-testid="kpi-nda-leads"
                  className="text-2xl font-mono font-bold text-indigo-300 mt-1"
                >
                  {ndaSentCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Scope &amp; privacy confirmation</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 col-span-2 sm:col-span-1">
                <div className="text-xs text-emerald-300 font-mono">Approved for Upload</div>
                <div
                  data-testid="kpi-approved-leads"
                  className="text-2xl font-mono font-bold text-emerald-300 mt-1"
                >
                  {approvedUploadCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Ready for 5-column export</div>
              </div>
            </section>

            {/* Server-Backed Pilot Audit Workspace Publisher */}
            <section className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Step 3: Server-Backed Pilot Audit Snapshot Publisher</span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-0.5">
                    Publish Current P1 Dataset as Server Pilot Snapshot
                  </h2>
                  <p className="text-xs text-slate-300">
                    Runs the canonical P1 stock engine (`evaluateStockEngine` &amp; `generateOwnerReport`) on the server, persists to `./data/pilot_workspaces.json`, and generates a read-only walkthrough link (`?view=pilot-findings&amp;id=AUDIT-...&amp;token=...`) prepared by C. Jones Snowin.
                  </p>
                </div>
              </div>

              <form onSubmit={handlePublishServerSnapshot} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label
                      htmlFor="snapshot-plant-select"
                      className="font-mono font-bold text-emerald-300 block"
                    >
                      Source Plant Workspace *
                    </label>
                    <select
                      id="snapshot-plant-select"
                      data-testid="snapshot-plant-select"
                      value={selectedPlantIdForSnapshot}
                      onChange={(e) => handleSelectPlantForSnapshot(e.target.value as PlantId)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-emerald-500/40 text-white font-mono text-xs"
                    >
                      <option value="ambattur">Ambattur (20 SKUs · Castings &amp; Valves)</option>
                      <option value="sriperumbudur">
                        Sriperumbudur (16 SKUs · Tier-1 Stamping)
                      </option>
                      <option value="hosur">Hosur (15 SKUs · Drivetrain Forgings)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="snapshot-lead-select"
                      className="font-mono font-bold text-slate-300 block"
                    >
                      Link to Captured Lead (Optional)
                    </label>
                    <select
                      id="snapshot-lead-select"
                      value={selectedLeadIdForSnapshot}
                      onChange={(e) => handleSelectLeadForSnapshot(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                    >
                      <option value="">Standalone Audit Snapshot</option>
                      {leads.map((l) => (
                        <option key={l.leadId} value={l.leadId}>
                          {l.leadId} — {l.companyName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="snapshot-company-input"
                      className="font-mono font-bold text-slate-300 block"
                    >
                      Company / Factory Name *
                    </label>
                    <input
                      id="snapshot-company-input"
                      type="text"
                      required
                      value={snapshotCompanyName}
                      onChange={(e) => setSnapshotCompanyName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="snapshot-location-input"
                      className="font-mono font-bold text-slate-300 block"
                    >
                      Plant Location *
                    </label>
                    <input
                      id="snapshot-location-input"
                      type="text"
                      required
                      value={snapshotPlantLocation}
                      onChange={(e) => setSnapshotPlantLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="snapshot-notes-input"
                    className="font-mono font-bold text-slate-300 block"
                  >
                    Executive Briefing Notes (Prepared by C. Jones Snowin)
                  </label>
                  <textarea
                    id="snapshot-notes-input"
                    rows={2}
                    value={snapshotExecutiveNotes}
                    onChange={(e) => setSnapshotExecutiveNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs resize-none"
                  />
                </div>

                {publishError && (
                  <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-200">
                    {publishError}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] font-mono text-slate-400">
                    Prepared By: <strong className="text-white">C. Jones Snowin</strong> · Source:{' '}
                    <strong className="text-emerald-300 uppercase">
                      {selectedPlantIdForSnapshot}
                    </strong>{' '}
                    P1–P4 Multi-Module Dataset
                  </span>
                  <button
                    type="submit"
                    disabled={publishingSnapshot}
                    data-testid="publish-pilot-snapshot-btn"
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>
                      {publishingSnapshot
                        ? 'Publishing Snapshot...'
                        : 'Publish Current P1–P4 Dataset as Server Pilot Snapshot'}
                    </span>
                  </button>
                </div>
              </form>

              {publishedSnapshot && (
                <div
                  data-testid="published-snapshot-banner"
                  className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 space-y-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Server Pilot Snapshot Created: {publishedSnapshot.workspaceId} (
                        {publishedSnapshot.companyName})
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-300">
                      Dead Stock: {formatCurrency(publishedSnapshot.summaryMetrics.deadStockValue)} / Total:{' '}
                      {formatCurrency(publishedSnapshot.summaryMetrics.totalStockValue)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={buildWalkthroughUrl(
                        publishedSnapshot.workspaceId,
                        publishedSnapshot.shareToken
                      )}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyWalkthroughLink(
                          publishedSnapshot.workspaceId,
                          publishedSnapshot.shareToken
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-[11px] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>
                        {copiedWalkthroughId === publishedSnapshot.workspaceId
                          ? 'Copied Link!'
                          : 'Copy Client Walkthrough Link'}
                      </span>
                    </button>
                    <a
                      href={`?view=pilot-findings&id=${encodeURIComponent(
                        publishedSnapshot.workspaceId
                      )}&token=${encodeURIComponent(publishedSnapshot.shareToken)}`}
                      onClick={(e) => {
                        if (onOpenWalkthrough) {
                          e.preventDefault();
                          onOpenWalkthrough(
                            publishedSnapshot.workspaceId,
                            publishedSnapshot.shareToken
                          );
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Open Walkthrough View</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {workspaces.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                    Saved Server Pilot Audit Snapshots ({workspaces.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    {workspaces.slice(0, 6).map((ws) => (
                      <div
                        key={ws.workspaceId}
                        data-testid={`saved-workspace-card-${ws.workspaceId}`}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-mono font-bold text-emerald-300 truncate">
                              {ws.workspaceId} · {ws.companyName}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {ws.plantLocation} · {ws.summaryMetrics.totalSkus} SKUs · Dead:{' '}
                              {formatCurrency(ws.summaryMetrics.deadStockValue)}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded border font-mono text-[10px] font-bold shrink-0 ${
                              ws.retentionStatus === 'PURGED'
                                ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                            }`}
                          >
                            {ws.retentionStatus === 'PURGED'
                              ? ws.deletionCertificateId || 'PURGED'
                              : `14d Window · Exp ${new Date(
                                  ws.retentionExpiresAt || Date.now()
                                ).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                })}`}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {ws.retentionStatus !== 'PURGED' && (
                            <button
                              type="button"
                              data-testid={`purge-workspace-btn-${ws.workspaceId}`}
                              disabled={purgingWorkspaceId === ws.workspaceId}
                              onClick={() => handlePurgeWorkspace(ws.workspaceId)}
                              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-mono font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>
                                {purgingWorkspaceId === ws.workspaceId
                                  ? 'Purging...'
                                  : 'Purge Workspace & Issue DELCERT'}
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyWalkthroughLink(ws.workspaceId, ws.shareToken)
                            }
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[11px] cursor-pointer"
                          >
                            {copiedWalkthroughId === ws.workspaceId ? 'Copied!' : 'Copy Link'}
                          </button>
                          <a
                            href={`?view=pilot-findings&id=${encodeURIComponent(
                              ws.workspaceId
                            )}&token=${encodeURIComponent(ws.shareToken)}`}
                            onClick={(e) => {
                              if (onOpenWalkthrough) {
                                e.preventDefault();
                                onOpenWalkthrough(ws.workspaceId, ws.shareToken);
                              }
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-[11px] cursor-pointer"
                          >
                            Open
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Step 4: Cryptographically Bound 8-Field Verified Proof Registry Publisher */}
            <section
              data-testid="verified-proof-publisher-section"
              className="bg-slate-900 border border-indigo-500/30 rounded-xl p-5 space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-indigo-400 uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Step 4: Cryptographically Bound 8-Field Verified Proof Registry</span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-0.5">
                    Publish Anonymized Outcome to Verified Proof Registry
                  </h2>
                  <p className="text-xs text-slate-300">
                    Pulls <code className="font-mono text-emerald-300">verifiedFindings</code>,{' '}
                    <code className="font-mono text-emerald-300">datasetScope</code>,{' '}
                    <code className="font-mono text-emerald-300">documentedLimitations</code>, and the 16-char SHA-256 digest directly from the selected server <code className="font-mono">AUDIT-...</code> snapshot so zero numbers can be fabricated.
                  </p>
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setPublishingProof(true);
                  setProofPublishError(null);
                  setProofPublishSuccess(null);

                  try {
                    const res = await fetch('/api/admin/verified-proofs', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-admin-key': adminKey.trim(),
                      },
                      body: JSON.stringify({
                        linkedWorkspaceId: proofWorkspaceId,
                        industrySector: proofIndustrySector.trim(),
                        initialChallenge: proofInitialChallenge.trim(),
                        analysisPerformed: proofAnalysisPerformed.trim(),
                        actionTaken: proofActionTaken.trim(),
                        approvedQuotation: proofApprovedQuotation.trim(),
                        clientSignOffConfirmed: proofClientSignOff,
                      }),
                    });
                    const data = await res.json().catch(() => null);
                    if (!res.ok || !data?.ok || !data.proof) {
                      setProofPublishError(
                        data?.error || `Failed to publish verified proof (HTTP ${res.status}).`
                      );
                      setPublishingProof(false);
                      return;
                    }
                    const createdProof = data.proof as VerifiedProofRecord;
                    setVerifiedProofs((prev) => [
                      createdProof,
                      ...prev.filter((p) => p.proofId !== createdProof.proofId),
                    ]);
                    setProofPublishSuccess(
                      `Published ${createdProof.proofId} bound to snapshot ${createdProof.linkedWorkspaceId}.`
                    );
                  } catch {
                    setProofPublishError('Network error while publishing verified proof.');
                  } finally {
                    setPublishingProof(false);
                  }
                }}
                className="space-y-3 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label
                      htmlFor="proof-workspace-select"
                      className="font-mono font-bold text-indigo-300 block"
                    >
                      Source Server Audit Snapshot (`AUDIT-...`) *
                    </label>
                    <select
                      id="proof-workspace-select"
                      data-testid="proof-workspace-select"
                      value={proofWorkspaceId}
                      onChange={(e) => setProofWorkspaceId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-indigo-500/40 text-white font-mono text-xs"
                    >
                      <option value="AUDIT-DEMO-P1P4">
                        AUDIT-DEMO-P1P4 — Canonical 20-SKU Multi-Pillar Sandbox
                      </option>
                      {workspaces.map((ws) => (
                        <option key={ws.workspaceId} value={ws.workspaceId}>
                          {ws.workspaceId} — {ws.companyName} ({ws.summaryMetrics.totalSkus} SKUs)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="proof-sector-input"
                      className="font-mono font-bold text-slate-300 block"
                    >
                      01 · Anonymized Industry Sector *
                    </label>
                    <input
                      id="proof-sector-input"
                      type="text"
                      required
                      value={proofIndustrySector}
                      onChange={(e) => setProofIndustrySector(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label
                      htmlFor="proof-challenge-input"
                      className="font-mono font-bold text-slate-300 block"
                    >
                      03 · Initial Operational Challenge *
                    </label>
                    <textarea
                      id="proof-challenge-input"
                      rows={2}
                      required
                      value={proofInitialChallenge}
                      onChange={(e) => setProofInitialChallenge(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="proof-analysis-input"
                      className="font-mono font-bold text-slate-300 block"
                    >
                      04 · Analysis Performed *
                    </label>
                    <textarea
                      id="proof-analysis-input"
                      rows={2}
                      required
                      value={proofAnalysisPerformed}
                      onChange={(e) => setProofAnalysisPerformed(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label
                      htmlFor="proof-action-input"
                      className="font-mono font-bold text-slate-300 block"
                    >
                      06 · Action Taken by Plant &amp; Finance *
                    </label>
                    <textarea
                      id="proof-action-input"
                      rows={2}
                      required
                      value={proofActionTaken}
                      onChange={(e) => setProofActionTaken(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="proof-quote-input"
                      className="font-mono font-bold text-slate-300 block"
                    >
                      07 · Approved Client Quotation (Optional)
                    </label>
                    <textarea
                      id="proof-quote-input"
                      rows={2}
                      value={proofApprovedQuotation}
                      onChange={(e) => setProofApprovedQuotation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs resize-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                    <input
                      type="checkbox"
                      data-testid="proof-signoff-checkbox"
                      checked={proofClientSignOff}
                      onChange={(e) => setProofClientSignOff(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-emerald-500"
                    />
                    <span>
                      I confirm written client sign-off has been obtained to publish this anonymized 8-field outcome (`clientSignOffConfirmed: true`).
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={publishingProof}
                    data-testid="publish-verified-proof-btn"
                    className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {publishingProof
                        ? 'Publishing Verified Proof...'
                        : 'Publish 8-Field Outcome to Verified Proof Registry'}
                    </span>
                  </button>
                </div>

                {proofPublishError && (
                  <div
                    role="alert"
                    data-testid="proof-publish-error"
                    className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-200"
                  >
                    {proofPublishError}
                  </div>
                )}

                {proofPublishSuccess && (
                  <div
                    data-testid="proof-publish-success"
                    className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 font-mono"
                  >
                    {proofPublishSuccess}
                  </div>
                )}
              </form>

              {verifiedProofs.length > 0 && (
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                    Published Verified Proof Records ({verifiedProofs.length})
                  </div>
                  <div className="space-y-2">
                    {verifiedProofs.map((vp) => (
                      <div
                        key={vp.proofId}
                        data-testid={`admin-proof-row-${vp.proofId}`}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-mono font-bold text-emerald-300">
                            {vp.proofId} · Bound to {vp.linkedWorkspaceId}{' '}
                            {vp.datasetSha256Prefix ? `(SHA-256: ${vp.datasetSha256Prefix}...)` : ''}
                          </div>
                          <div className="text-slate-300">
                            {vp.industrySector} · Dead Stock:{' '}
                            {formatCurrency(vp.verifiedFindings.p1DeadStockInr)} / Book:{' '}
                            {formatCurrency(vp.verifiedFindings.p1BookValueInr)}
                          </div>
                        </div>
                        <button
                          type="button"
                          data-testid={`delete-proof-btn-${vp.proofId}`}
                          onClick={async () => {
                            try {
                              const res = await fetch(
                                `/api/admin/verified-proofs/${encodeURIComponent(vp.proofId)}`,
                                {
                                  method: 'DELETE',
                                  headers: { 'x-admin-key': adminKey.trim() },
                                }
                              );
                              if (res.ok) {
                                setVerifiedProofs((prev) =>
                                  prev.filter((item) => item.proofId !== vp.proofId)
                                );
                              }
                            } catch {}
                          }}
                          className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-mono text-[11px] cursor-pointer"
                        >
                          Unpublish
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {saveError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200"
              >
                {saveError}
              </div>
            )}

            {/* Submitted Pilot Audit Requests Table */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">
                    Submitted Pilot Audit Requests ({leads.length})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Update status, open the Step-2 Approved Pilot Upload Portal, copy the client upload link, and save founder notes inline.
                  </p>
                </div>
                {onOpenUploadPortal && (
                  <button
                    type="button"
                    onClick={() => onOpenUploadPortal('PILOT-DEMO-SANDBOX')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-mono text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open Step-2 Upload Sandbox</span>
                  </button>
                )}
              </div>

              {leads.length === 0 ? (
                <div className="p-10 text-center space-y-2 text-slate-400 text-xs">
                  <FileSpreadsheet className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="font-bold text-slate-200 text-sm">
                    No Pilot Audit Requests Recorded Yet
                  </div>
                  <p>
                    Submit a request via the public &ldquo;Request a Pilot Audit&rdquo; modal to verify end-to-end persistence.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                        <th className="py-3 px-4">Reference &amp; Date</th>
                        <th className="py-3 px-4">Company &amp; Plant Location</th>
                        <th className="py-3 px-4">Buyer Contact &amp; Step 2 Reply</th>
                        <th className="py-3 px-4">ERP, SKUs &amp; Challenge</th>
                        <th className="py-3 px-4 min-w-[280px]">Stage &amp; Founder Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {leads.map((lead) => {
                        const draft = draftEdits[lead.leadId] || {
                          status: lead.status,
                          founderNotes: lead.founderNotes || '',
                        };
                        const isSaving = savingLeadId === lead.leadId;
                        const isSaved = savedNoticeId === lead.leadId;
                        const cleanPhone = lead.phoneOrWhatsapp.replace(/[^0-9+]/g, '');

                        return (
                          <tr
                            key={lead.leadId}
                            data-testid={`lead-row-${lead.leadId}`}
                            className="hover:bg-slate-950/40 align-top"
                          >
                            {/* Reference & Date */}
                            <td className="py-4 px-4 space-y-1.5 font-mono">
                              <div className="font-bold text-emerald-300">{lead.leadId}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>{new Date(lead.createdAt).toLocaleString()}</span>
                              </div>
                              <div>
                                <span
                                  className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${
                                    STATUS_BADGE_STYLES[lead.status]
                                  }`}
                                >
                                  {STATUS_LABELS[lead.status]}
                                </span>
                              </div>
                              {lead.sourceView && (
                                <div className="text-[10px] text-slate-400">
                                  Source: {lead.sourceView}
                                </div>
                              )}
                              {lead.linkedWorkspaceId && (
                                <div
                                  data-testid={`lead-linked-snapshot-${lead.leadId}`}
                                  className="pt-1 space-y-1"
                                >
                                  <div className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                                    Linked: {lead.linkedWorkspaceId}
                                    {lead.linkedPlantId ? ` (${lead.linkedPlantId})` : ''}
                                  </div>
                                  {lead.linkedWalkthroughUrl && (
                                    <div className="flex flex-col gap-1">
                                      <a
                                        href={lead.linkedWalkthroughUrl}
                                        data-testid={`lead-open-walkthrough-${lead.leadId}`}
                                        className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] inline-flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <span>Open 4-Pillar Walkthrough</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            await navigator.clipboard.writeText(
                                              lead.linkedWalkthroughUrl || ''
                                            );
                                            setCopiedWalkthroughId(lead.leadId);
                                            setTimeout(() => {
                                              setCopiedWalkthroughId((c) =>
                                                c === lead.leadId ? null : c
                                              );
                                            }, 2500);
                                          } catch {}
                                        }}
                                        className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] inline-flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <Copy className="w-2.5 h-2.5" />
                                        <span>
                                          {copiedWalkthroughId === lead.leadId
                                            ? 'Copied Link!'
                                            : 'Copy Walkthrough Link for Call'}
                                        </span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                              {lead.lastImportRunId && (
                                <div
                                  data-testid={`lead-last-import-${lead.leadId}`}
                                  className="px-2 py-1 rounded bg-sky-500/15 border border-sky-500/40 text-sky-300 text-[10px] font-bold"
                                >
                                  Last Import: {lead.lastImportRunId} (
                                  {lead.dataQualityOverview?.validAccepted ?? 0} Valid /{' '}
                                  {lead.dataQualityOverview?.quarantinedRejected ?? 0} Quarantined)
                                </div>
                              )}
                              <div className="pt-1 flex flex-col gap-1">
                                <button
                                  type="button"
                                  data-testid={`lead-open-upload-${lead.leadId}`}
                                  onClick={() => {
                                    if (onOpenUploadPortal) {
                                      onOpenUploadPortal(lead.leadId, lead.uploadToken);
                                    } else {
                                      window.location.href = `?view=pilot-upload&leadId=${encodeURIComponent(
                                        lead.leadId
                                      )}${
                                        lead.uploadToken
                                          ? `&token=${encodeURIComponent(lead.uploadToken)}`
                                          : ''
                                      }`;
                                    }
                                  }}
                                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-[10px] inline-flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <span>Open Step-2 Upload Portal</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  type="button"
                                  data-testid={`lead-copy-upload-${lead.leadId}`}
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(
                                        buildUploadPortalFullUrl(lead)
                                      );
                                      setCopiedUploadPortalId(lead.leadId);
                                      setTimeout(() => {
                                        setCopiedUploadPortalId((c) =>
                                          c === lead.leadId ? null : c
                                        );
                                      }, 2500);
                                    } catch {}
                                  }}
                                  className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[10px] inline-flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                  <span>
                                    {copiedUploadPortalId === lead.leadId
                                      ? 'Copied Client Upload Link!'
                                      : 'Copy Client Upload Link'}
                                  </span>
                                </button>
                              </div>
                            </td>

                            {/* Company & Plant */}
                            <td className="py-4 px-4 space-y-1">
                              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                <span>{lead.companyName}</span>
                              </div>
                              <div className="text-slate-300 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>{lead.plantLocation}</span>
                              </div>
                            </td>

                            {/* Buyer Contact & Step 2 Reply */}
                            <td className="py-4 px-4 space-y-1.5">
                              <div className="font-bold text-white">{lead.fullName}</div>
                              <div className="text-slate-400 text-[11px]">{lead.roleTitle}</div>
                              <div className="pt-0.5 space-y-1 font-mono text-[11px]">
                                <a
                                  href={`mailto:${lead.workEmail}?subject=${encodeURIComponent(
                                    `Operationalyst Factory Audit Scope (${lead.leadId}) — ${lead.companyName}`
                                  )}`}
                                  className="text-sky-300 hover:text-sky-200 underline flex items-center gap-1"
                                >
                                  <Mail className="w-3 h-3 shrink-0" />
                                  <span>{lead.workEmail}</span>
                                </a>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`tel:${cleanPhone}`}
                                    className="text-slate-300 hover:text-white flex items-center gap-1"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span>{lead.phoneOrWhatsapp}</span>
                                  </a>
                                  {cleanPhone.length >= 7 && (
                                    <a
                                      href={`https://wa.me/${cleanPhone.replace(/^\+/, '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px]"
                                    >
                                      WhatsApp
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div className="pt-1 flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCopyStep2Reply(lead)}
                                  className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-emerald-300 font-mono text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>
                                    {copiedReplyLeadId === lead.leadId
                                      ? 'Copied Step 2 Reply!'
                                      : 'Copy Step 2 Data Guide Reply'}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  data-testid={`toggle-followup-scripts-${lead.leadId}`}
                                  onClick={() =>
                                    setOpenScriptDrawerLeadId((prev) =>
                                      prev === lead.leadId ? null : lead.leadId
                                    )
                                  }
                                  className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>
                                    {openScriptDrawerLeadId === lead.leadId
                                      ? 'Hide Quick-Follow-Up Scripts'
                                      : 'Founder Quick-Follow-Up Scripts (WhatsApp / Email / 48h Nudge)'}
                                  </span>
                                </button>
                              </div>

                              {openScriptDrawerLeadId === lead.leadId &&
                                (() => {
                                  const scripts = buildFounderFollowUpScripts({
                                    leadId: lead.leadId,
                                    fullName: lead.fullName,
                                    companyName: lead.companyName,
                                    plantLocation: lead.plantLocation,
                                    erpSystem: lead.erpSystem || 'Tally / SAP / Excel',
                                    uploadPortalUrl: buildUploadPortalFullUrl(lead),
                                  });
                                  return (
                                    <div
                                      data-testid={`founder-followup-scripts-drawer-${lead.leadId}`}
                                      className="mt-2 p-3 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2.5 text-[11px]"
                                    >
                                      <div className="font-mono font-bold text-emerald-300 uppercase text-[10px]">
                                        1-Click Pre-Filled Follow-Up Scripts ({lead.fullName} ·{' '}
                                        {lead.companyName} · {lead.erpSystem || 'Tally / SAP / Excel'})
                                      </div>
                                      <div className="flex flex-wrap gap-1.5 font-mono">
                                        <button
                                          type="button"
                                          data-testid={`copy-whatsapp-15m-${lead.leadId}`}
                                          onClick={() =>
                                            handleCopyFollowUpScript(
                                              `wa-${lead.leadId}`,
                                              scripts.whatsapp15MinScript
                                            )
                                          }
                                          className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                        >
                                          <Copy className="w-2.5 h-2.5" />
                                          <span>
                                            {copiedScriptKey === `wa-${lead.leadId}`
                                              ? 'Copied 15m WhatsApp!'
                                              : 'Copy 15-Min WhatsApp Reply'}
                                          </span>
                                        </button>
                                        <button
                                          type="button"
                                          data-testid={`copy-email-15m-${lead.leadId}`}
                                          onClick={() =>
                                            handleCopyFollowUpScript(
                                              `em-${lead.leadId}`,
                                              scripts.email15MinBody
                                            )
                                          }
                                          className="px-2.5 py-1 rounded bg-sky-500/20 border border-sky-500/40 text-sky-300 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                        >
                                          <Copy className="w-2.5 h-2.5" />
                                          <span>
                                            {copiedScriptKey === `em-${lead.leadId}`
                                              ? 'Copied 15m Email!'
                                              : 'Copy 15-Min Email Script'}
                                          </span>
                                        </button>
                                        <button
                                          type="button"
                                          data-testid={`copy-nudge-48h-${lead.leadId}`}
                                          onClick={() =>
                                            handleCopyFollowUpScript(
                                              `nd-${lead.leadId}`,
                                              scripts.nudge48HourScript
                                            )
                                          }
                                          className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                        >
                                          <Copy className="w-2.5 h-2.5" />
                                          <span>
                                            {copiedScriptKey === `nd-${lead.leadId}`
                                              ? 'Copied 48h Nudge!'
                                              : 'Copy 48-Hour Nudge Script'}
                                          </span>
                                        </button>
                                      </div>
                                      <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 whitespace-pre-wrap font-mono max-h-36 overflow-y-auto">
                                        {scripts.whatsapp15MinScript}
                                      </pre>
                                    </div>
                                  );
                                })()}
                            </td>

                            {/* ERP, SKUs, Qualification & Challenge */}
                            <td className="py-4 px-4 space-y-1.5 max-w-xs">
                              <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                                {lead.buyerPersona && (
                                  <span
                                    data-testid={`lead-persona-${lead.leadId}`}
                                    className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 font-bold"
                                  >
                                    Persona: {lead.buyerPersona}
                                  </span>
                                )}
                                {typeof lead.selfAssessmentScore === 'number' && (
                                  <span
                                    data-testid={`lead-score-${lead.leadId}`}
                                    className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold"
                                  >
                                    Diagnostic: {lead.selfAssessmentScore}/100
                                    {lead.selfAssessmentBand ? ` (${lead.selfAssessmentBand})` : ''}
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                                  ERP: {lead.erpSystem || 'Not specified'}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                                  SKUs: {lead.approxSkuCount || 'Not specified'}
                                </span>
                              </div>
                              {lead.selfAssessmentSummary && (
                                <p className="text-[11px] font-mono text-amber-200/90 bg-slate-950/80 p-2 rounded border border-slate-800">
                                  {lead.selfAssessmentSummary}
                                </p>
                              )}
                              <p className="text-slate-300 leading-relaxed">
                                {lead.primaryChallenge || 'No specific challenge text provided.'}
                              </p>
                            </td>

                            {/* Inline Status & Founder Notes Editor */}
                            <td className="py-4 px-4 space-y-2">
                              <div className="space-y-1">
                                <label
                                  htmlFor={`status-select-${lead.leadId}`}
                                  className="block text-[10px] font-mono uppercase text-slate-400"
                                >
                                  Intake Stage
                                </label>
                                <select
                                  id={`status-select-${lead.leadId}`}
                                  value={draft.status}
                                  onChange={(e) =>
                                    setDraftEdits((prev) => ({
                                      ...prev,
                                      [lead.leadId]: {
                                        ...draft,
                                        status: e.target.value as PilotLeadStatus,
                                      },
                                    }))
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                                >
                                  {ALLOWED_PILOT_LEAD_STATUSES.map((st) => (
                                    <option key={st} value={st}>
                                      {st}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label
                                  htmlFor={`notes-input-${lead.leadId}`}
                                  className="block text-[10px] font-mono uppercase text-slate-400"
                                >
                                  Founder Notes
                                </label>
                                <textarea
                                  id={`notes-input-${lead.leadId}`}
                                  rows={2}
                                  value={draft.founderNotes}
                                  onChange={(e) =>
                                    setDraftEdits((prev) => ({
                                      ...prev,
                                      [lead.leadId]: {
                                        ...draft,
                                        founderNotes: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Add suitability notes, NDA date, or follow-up action..."
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 resize-none"
                                />
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveLead(lead.leadId)}
                                  disabled={isSaving}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                                </button>

                                {isSaved && (
                                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Saved</span>
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Phase 8: Cloud Run 7-Store System Backup & Dry-Run Restore Bundle */}
            <CloudRunSystemBackupPanel
              adminKey={adminKey}
              onAfterRestore={() => fetchLeadsAndWorkspaces(adminKey)}
            />
          </>
        )}
      </main>
    </div>
  );
};
