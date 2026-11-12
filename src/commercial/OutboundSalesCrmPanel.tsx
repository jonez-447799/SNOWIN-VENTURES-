/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Copy,
  CheckCircle2,
  ExternalLink,
  Plus,
  Download,
  Save,
  Building2,
  MessageSquare,
  Filter,
} from 'lucide-react';
import {
  type OutboundTargetCompany,
  type OutboundClusterName,
  type OutboundTargetStatus,
  OUTBOUND_CLUSTERS,
  OUTBOUND_STATUS_LABELS,
  getTargetCompanyDayBatch,
  buildLinkedInXRaySearchUrl,
  buildLinkedInConnectionNote,
  buildWhatsAppTeaserPitch,
  buildWhatsAppLaunchUrl,
  exportOutboundCrmToCsv,
  saveOutboundCrmToBrowser,
} from '../data/outboundTargetCompanies.ts';

interface OutboundSalesCrmPanelProps {
  companies: OutboundTargetCompany[];
  adminKey: string;
  onCompaniesChange: (nextCompanies: OutboundTargetCompany[]) => void;
  onNotice?: (msg: string) => void;
}

export const OutboundSalesCrmPanel: React.FC<OutboundSalesCrmPanelProps> = ({
  companies,
  adminKey,
  onCompaniesChange,
  onNotice,
}) => {
  const [selectedCluster, setSelectedCluster] = useState<'ALL' | OutboundClusterName>('ALL');
  const [selectedDayBatch, setSelectedDayBatch] = useState<'ALL' | 1 | 2 | 3 | 4 | 5>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | OutboundTargetStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedBadge, setCopiedBadge] = useState<string | null>(null);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  // Add New Target Factory modal/drawer state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [newCluster, setNewCluster] = useState<OutboundClusterName>(
    'Ambattur Industrial Estate'
  );
  const [newSegment, setNewSegment] = useState<string>(
    'Auto Components & Precision Machining'
  );
  const [newTargetRole, setNewTargetRole] = useState<string>(
    'Managing Director / Plant Head / Materials Head'
  );
  const [newContactName, setNewContactName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [addingCompany, setAddingCompany] = useState<boolean>(false);

  // Local draft edits for inline contact/phone/notes fields
  const [rowDrafts, setRowDrafts] = useState<
    Record<
      string,
      {
        contactName: string;
        phoneOrWhatsapp: string;
        email: string;
        notes: string;
      }
    >
  >({});

  const getDraftForRow = (company: OutboundTargetCompany) => {
    return (
      rowDrafts[company.id] || {
        contactName: company.contactName || '',
        phoneOrWhatsapp: company.phoneOrWhatsapp || '',
        email: company.email || '',
        notes: company.notes || '',
      }
    );
  };

  const updateRowDraft = (
    company: OutboundTargetCompany,
    field: 'contactName' | 'phoneOrWhatsapp' | 'email' | 'notes',
    value: string
  ) => {
    const existing = getDraftForRow(company);
    setRowDrafts((prev) => ({
      ...prev,
      [company.id]: {
        ...existing,
        [field]: value,
      },
    }));
  };

  // Pipeline KPI counters
  const kpiMetrics = useMemo(() => {
    const total = companies.length;
    const notContacted = companies.filter((c) => c.status === 'NOT_CONTACTED').length;
    const linkedInSent = companies.filter((c) => c.status === 'LINKEDIN_SENT').length;
    const teaserOffered = companies.filter((c) => c.status === 'TEASER_OFFERED').length;
    const csvReceived = companies.filter((c) => c.status === 'CSV_RECEIVED').length;
    const utrPending = companies.filter((c) => c.status === 'UTR_PENDING').length;
    const paid14999 = companies.filter((c) => c.status === 'PAID_14999').length;
    const closedRevenueInr = paid14999 * 14999;

    return {
      total,
      notContacted,
      linkedInSent,
      teaserOffered,
      csvReceived,
      utrPending,
      paid14999,
      closedRevenueInr,
    };
  }, [companies]);

  // Filtered companies with their original 0-based index for Day Batch calculation
  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return companies
      .map((company, idx) => ({
        company,
        dayBatch: getTargetCompanyDayBatch(idx),
        indexOneBased: idx + 1,
      }))
      .filter(({ company, dayBatch }) => {
        if (selectedCluster !== 'ALL' && company.cluster !== selectedCluster) {
          return false;
        }
        if (selectedDayBatch !== 'ALL' && dayBatch !== selectedDayBatch) {
          return false;
        }
        if (selectedStatus !== 'ALL' && company.status !== selectedStatus) {
          return false;
        }
        if (!q) return true;
        return (
          company.companyName.toLowerCase().includes(q) ||
          company.cluster.toLowerCase().includes(q) ||
          company.segment.toLowerCase().includes(q) ||
          company.contactName.toLowerCase().includes(q) ||
          company.notes.toLowerCase().includes(q) ||
          company.id.toLowerCase().includes(q)
        );
      });
  }, [companies, selectedCluster, selectedDayBatch, selectedStatus, searchQuery]);

  const persistRowPatch = async (
    companyId: string,
    patch: Partial<Omit<OutboundTargetCompany, 'id'>>,
    toastMessage?: string
  ) => {
    setSavingRowId(companyId);
    const nowIso = new Date().toISOString();
    const optimisticList = companies.map((item) =>
      item.id === companyId
        ? {
            ...item,
            ...patch,
            lastFollowUpAt: patch.lastFollowUpAt ?? nowIso,
          }
        : item
    );
    const savedLocal = saveOutboundCrmToBrowser(optimisticList);
    onCompaniesChange(savedLocal);

    try {
      const res = await fetch(`/api/admin/outbound-crm/${encodeURIComponent(companyId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey.trim(),
        },
        body: JSON.stringify({
          ...patch,
          lastFollowUpAt: patch.lastFollowUpAt ?? nowIso,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && Array.isArray(data.companies)) {
        const synced = saveOutboundCrmToBrowser(data.companies as OutboundTargetCompany[]);
        onCompaniesChange(synced);
      }
    } catch {
      // Static browser fallback already saved
    } finally {
      setSavingRowId(null);
      if (toastMessage && onNotice) {
        onNotice(toastMessage);
      }
    }
  };

  const handleCopyLinkedInNote = async (company: OutboundTargetCompany) => {
    const draft = getDraftForRow(company);
    const note = buildLinkedInConnectionNote({
      companyName: company.companyName,
      cluster: company.cluster,
      contactName: draft.contactName || company.contactName,
    });

    try {
      await navigator.clipboard.writeText(note);
    } catch {
      // Clipboard fallback
    }

    setCopiedBadge(`li-${company.id}`);
    setTimeout(() => setCopiedBadge(null), 2500);

    if (company.status === 'NOT_CONTACTED') {
      await persistRowPatch(
        company.id,
        {
          status: 'LINKEDIN_SENT',
          contactName: draft.contactName,
          phoneOrWhatsapp: draft.phoneOrWhatsapp,
          email: draft.email,
          notes: draft.notes,
        },
        `Copied <300-char LinkedIn note (${note.length} chars) for ${company.companyName} & marked LINKEDIN_SENT.`
      );
    } else if (onNotice) {
      onNotice(
        `Copied LinkedIn Connection Note (${note.length}/300 chars) for ${company.companyName}.`
      );
    }
  };

  const handleCopyWhatsAppPitch = async (company: OutboundTargetCompany) => {
    const draft = getDraftForRow(company);
    const liveSiteUrl =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://operationalyst.in';
    const pitch = buildWhatsAppTeaserPitch(
      {
        companyName: company.companyName,
        cluster: company.cluster,
        contactName: draft.contactName || company.contactName,
      },
      liveSiteUrl
    );

    try {
      await navigator.clipboard.writeText(pitch);
    } catch {
      // Clipboard fallback
    }

    setCopiedBadge(`wa-${company.id}`);
    setTimeout(() => setCopiedBadge(null), 2500);

    const nextStatus: OutboundTargetStatus =
      company.status === 'NOT_CONTACTED' || company.status === 'LINKEDIN_SENT'
        ? 'TEASER_OFFERED'
        : company.status;

    await persistRowPatch(
      company.id,
      {
        status: nextStatus,
        contactName: draft.contactName,
        phoneOrWhatsapp: draft.phoneOrWhatsapp,
        email: draft.email,
        notes: draft.notes,
      },
      `Copied Free 3-SKU Teaser WhatsApp pitch for ${company.companyName} (${nextStatus}).`
    );
  };

  const handleSaveRowDetails = async (company: OutboundTargetCompany) => {
    const draft = getDraftForRow(company);
    await persistRowPatch(
      company.id,
      {
        contactName: draft.contactName,
        phoneOrWhatsapp: draft.phoneOrWhatsapp,
        email: draft.email,
        notes: draft.notes,
      },
      `Saved contact & follow-up notes for ${company.companyName}.`
    );
  };

  const handleAddTargetFactory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompanyName.trim().length < 2) return;
    setAddingCompany(true);

    const nextId = `TARGET-${String(companies.length + 1).padStart(3, '0')}`;
    const newItem: OutboundTargetCompany = {
      id: nextId,
      companyName: newCompanyName.trim(),
      cluster: newCluster,
      segment: newSegment.trim() || 'Discrete Manufacturing & Engineering',
      targetBuyerRole:
        newTargetRole.trim() || 'Managing Director / Plant Head / Materials Head',
      contactName: newContactName.trim(),
      phoneOrWhatsapp: newPhone.trim(),
      email: newEmail.trim(),
      status: 'NOT_CONTACTED',
      notes: newNotes.trim(),
      lastFollowUpAt: '',
    };

    try {
      const res = await fetch('/api/admin/outbound-crm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey.trim(),
        },
        body: JSON.stringify(newItem),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && Array.isArray(data.companies)) {
        const synced = saveOutboundCrmToBrowser(data.companies as OutboundTargetCompany[]);
        onCompaniesChange(synced);
      } else {
        const localUpdated = saveOutboundCrmToBrowser([...companies, newItem]);
        onCompaniesChange(localUpdated);
      }
    } catch {
      const localUpdated = saveOutboundCrmToBrowser([...companies, newItem]);
      onCompaniesChange(localUpdated);
    } finally {
      setAddingCompany(false);
      setShowAddForm(false);
      setNewCompanyName('');
      setNewContactName('');
      setNewPhone('');
      setNewEmail('');
      setNewNotes('');
      if (onNotice) {
        onNotice(`Added ${newItem.companyName} (${newItem.cluster}) to Outbound Sales CRM.`);
      }
    }
  };

  const handleExportCsv = () => {
    const csvContent = exportOutboundCrmToCsv(companies);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Operationalyst_Outbound_50_Plant_CRM.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (onNotice) {
      onNotice(
        `Exported ${companies.length} Chennai & Hosur target factories to Operationalyst_Outbound_50_Plant_CRM.csv.`
      );
    }
  };

  const liveSiteOrigin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://operationalyst.in';

  return (
    <section
      data-testid="outbound-sales-crm-panel"
      className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-5"
    >
      {/* Top Header & Action Buttons */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>
              PHASE 18 • OUTBOUND 50-PLANT SALES CRM (CHENNAI &amp; HOSUR INDUSTRIAL CORRIDORS)
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Outbound 50-Plant Sales CRM (Chennai &amp; Hosur) &amp; 1-Click LinkedIn / WhatsApp Pitch Launcher
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl">
            Pre-loaded with 50 real mid-sized discrete manufacturing targets across Ambattur, Guindy/Thirumudivakkam, Sriperumbudur/Oragadam, and SIPCOT Hosur. Run 10 plants/day (Days 1–5) to book Free 3-SKU Diagnostic Teasers and close ₹14,999 4-Pillar Plant Audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            data-testid="outbound-crm-add-btn"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add New Target Factory</span>
          </button>

          <button
            type="button"
            data-testid="outbound-crm-export-csv-btn"
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CRM (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Pipeline KPI Counters */}
      <div
        data-testid="outbound-crm-kpi-strip"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 font-mono"
      >
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">Total Target Plants</div>
          <div
            data-testid="outbound-kpi-total"
            className="text-lg font-bold text-white mt-0.5"
          >
            {kpiMetrics.total}
          </div>
          <div className="text-[10px] text-slate-500">4 TN Clusters</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">Not Contacted</div>
          <div className="text-lg font-bold text-slate-300 mt-0.5">
            {kpiMetrics.notContacted}
          </div>
          <div className="text-[10px] text-slate-500">Ready to Pitch</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-sky-500/30">
          <div className="text-[10px] text-sky-400 uppercase">LinkedIn Sent</div>
          <div className="text-lg font-bold text-sky-300 mt-0.5">
            {kpiMetrics.linkedInSent}
          </div>
          <div className="text-[10px] text-slate-500">&lt;300-Char Note</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30">
          <div className="text-[10px] text-indigo-400 uppercase">Teaser Offered</div>
          <div className="text-lg font-bold text-indigo-300 mt-0.5">
            {kpiMetrics.teaserOffered}
          </div>
          <div className="text-[10px] text-slate-500">Free 3-SKU Pitch</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30">
          <div className="text-[10px] text-amber-400 uppercase">5-Col CSV Received</div>
          <div className="text-lg font-bold text-amber-300 mt-0.5">
            {kpiMetrics.csvReceived}
          </div>
          <div className="text-[10px] text-slate-500">Teaser Generated</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/30">
          <div className="text-[10px] text-purple-400 uppercase">UTR Pending</div>
          <div className="text-lg font-bold text-purple-300 mt-0.5">
            {kpiMetrics.utrPending}
          </div>
          <div className="text-[10px] text-slate-500">Awaiting Unlock</div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
          <div className="text-[10px] text-emerald-400 uppercase">Paid ₹14,999</div>
          <div className="text-lg font-bold text-emerald-300 mt-0.5">
            {kpiMetrics.paid14999}{' '}
            <span className="text-xs font-normal text-emerald-400">
              (₹{kpiMetrics.closedRevenueInr.toLocaleString('en-IN')})
            </span>
          </div>
          <div className="text-[10px] text-emerald-400/80">Closed Audits</div>
        </div>
      </div>

      {/* Optional Add New Target Factory Inline Form */}
      {showAddForm && (
        <form
          data-testid="outbound-crm-add-form"
          onSubmit={handleAddTargetFactory}
          className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3 font-mono text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-emerald-300 font-bold uppercase">
              + Add New Target Manufacturing Plant to Outbound CRM
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Company / Factory Name *
              </label>
              <input
                type="text"
                required
                data-testid="outbound-new-company-name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="e.g., Ennore Precision Castings Pvt Ltd"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Industrial Cluster *
              </label>
              <select
                data-testid="outbound-new-cluster"
                value={newCluster}
                onChange={(e) => setNewCluster(e.target.value as OutboundClusterName)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
              >
                {OUTBOUND_CLUSTERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Manufacturing Segment
              </label>
              <input
                type="text"
                value={newSegment}
                onChange={(e) => setNewSegment(e.target.value)}
                placeholder="CNC Machining / Auto Parts"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Target Buyer Role
              </label>
              <input
                type="text"
                value={newTargetRole}
                onChange={(e) => setNewTargetRole(e.target.value)}
                placeholder="MD / Plant Head / Materials Head"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="e.g., Mr. Karthik Sundaram"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                WhatsApp / Phone Number
              </label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+91 98400 XXXXX"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Work Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="md@company.in"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Notes</label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Key SKU / ERP context..."
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              data-testid="outbound-save-new-company-btn"
              disabled={addingCompany}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
            >
              {addingCompany ? 'Saving Factory...' : 'Save Target Factory to CRM'}
            </button>
          </div>
        </form>
      )}

      {/* Cluster Filter Tabs + Daily 10-Plant Batch Filter + Search Bar */}
      <div className="space-y-3">
        {/* Cluster Filter Tabs */}
        <div
          data-testid="outbound-cluster-tabs"
          className="flex flex-wrap items-center gap-2"
        >
          <button
            type="button"
            data-testid="cluster-tab-ALL"
            onClick={() => setSelectedCluster('ALL')}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border cursor-pointer transition-colors ${
              selectedCluster === 'ALL'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            All 4 Clusters ({companies.length})
          </button>

          {OUTBOUND_CLUSTERS.map((cluster) => {
            const count = companies.filter((c) => c.cluster === cluster).length;
            return (
              <button
                key={cluster}
                type="button"
                data-testid={`cluster-tab-${cluster}`}
                onClick={() => setSelectedCluster(cluster)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border cursor-pointer transition-colors ${
                  selectedCluster === cluster
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {cluster} ({count})
              </button>
            );
          })}
        </div>

        {/* Daily 10-Plant Batch Filter + Search + Status Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            data-testid="outbound-day-batch-tabs"
            className="flex flex-wrap items-center gap-1.5"
          >
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 mr-1">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>10-Plant Daily Sprint:</span>
            </span>

            <button
              type="button"
              data-testid="day-batch-ALL"
              onClick={() => setSelectedDayBatch('ALL')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border cursor-pointer ${
                selectedDayBatch === 'ALL'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              All Days
            </button>

            {([1, 2, 3, 4, 5] as const).map((dayNum) => (
              <button
                key={dayNum}
                type="button"
                data-testid={`day-batch-${dayNum}`}
                onClick={() => setSelectedDayBatch(dayNum)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border cursor-pointer ${
                  selectedDayBatch === dayNum
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                Day {dayNum} Batch
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-initial justify-end">
            <select
              data-testid="outbound-status-filter"
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as 'ALL' | OutboundTargetStatus)
              }
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
            >
              <option value="ALL">All Statuses</option>
              {(Object.keys(OUTBOUND_STATUS_LABELS) as OutboundTargetStatus[]).map(
                (st) => (
                  <option key={st} value={st}>
                    {OUTBOUND_STATUS_LABELS[st]}
                  </option>
                )
              )}
            </select>

            <div className="relative min-w-[230px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                data-testid="outbound-crm-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company, cluster, role, notes..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Showing count bar */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>
          Showing <strong className="text-white">{filteredEntries.length}</strong> of{' '}
          <strong className="text-white">{companies.length}</strong> target factories
        </span>
        <span>
          Tip: Click &ldquo;Find MD / Plant Head on LinkedIn&rdquo; &rarr; Copy &lt;300-char Note &rarr; Launch WhatsApp Free 3-SKU Teaser
        </span>
      </div>

      {/* Company Rows List */}
      <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
        {filteredEntries.map(({ company, dayBatch, indexOneBased }) => {
          const draft = getDraftForRow(company);
          const xRayUrl = buildLinkedInXRaySearchUrl(company.companyName);
          const previewNote = buildLinkedInConnectionNote({
            companyName: company.companyName,
            cluster: company.cluster,
            contactName: draft.contactName || company.contactName,
          });
          const waPitch = buildWhatsAppTeaserPitch(
            {
              companyName: company.companyName,
              cluster: company.cluster,
              contactName: draft.contactName || company.contactName,
            },
            liveSiteOrigin
          );
          const waLaunchUrl = buildWhatsAppLaunchUrl(
            draft.phoneOrWhatsapp || company.phoneOrWhatsapp,
            waPitch
          );

          return (
            <div
              key={company.id}
              data-testid={`outbound-crm-row-${company.id}`}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
            >
              {/* Row Top Line: Index, Company Name, Cluster Badge, Day Batch Badge, Status Select */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-400">
                      #{indexOneBased} · {company.id}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300">
                      Day {dayBatch} Batch
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-300">
                      {company.cluster}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {company.companyName}
                    </h3>
                  </div>

                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                      <strong className="text-slate-300">Segment:</strong> {company.segment}
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-300">Target Buyer:</strong>{' '}
                      {company.targetBuyerRole}
                    </span>
                    {company.lastFollowUpAt && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400 font-mono text-[11px]">
                          Last touch: {new Date(company.lastFollowUpAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Inline Status Dropdown */}
                <div className="flex items-center gap-2">
                  <select
                    data-testid={`outbound-status-select-${company.id}`}
                    value={company.status}
                    onChange={(e) =>
                      persistRowPatch(
                        company.id,
                        {
                          status: e.target.value as OutboundTargetStatus,
                          contactName: draft.contactName,
                          phoneOrWhatsapp: draft.phoneOrWhatsapp,
                          email: draft.email,
                          notes: draft.notes,
                        },
                        `Updated ${company.companyName} status to ${e.target.value}.`
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border cursor-pointer ${
                      company.status === 'PAID_14999'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : company.status === 'UTR_PENDING'
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                        : company.status === 'CSV_RECEIVED'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : company.status === 'TEASER_OFFERED'
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                        : company.status === 'LINKEDIN_SENT'
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    {(Object.keys(OUTBOUND_STATUS_LABELS) as OutboundTargetStatus[]).map(
                      (st) => (
                        <option key={st} value={st} className="bg-slate-950 text-white">
                          {OUTBOUND_STATUS_LABELS[st]}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* 1-Click Automation Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Action A: Find MD / Plant Head on LinkedIn X-Ray */}
                <a
                  href={xRayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`outbound-xray-link-${company.id}`}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 font-mono text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Find MD / Plant Head on LinkedIn</span>
                </a>

                {/* Action B: Copy LinkedIn Note (<300 chars) */}
                <button
                  type="button"
                  data-testid={`outbound-copy-linkedin-btn-${company.id}`}
                  onClick={() => handleCopyLinkedInNote(company)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedBadge === `li-${company.id}` ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">
                        Copied Note ({previewNote.length}/300 chars)!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-sky-400" />
                      <span>
                        Copy LinkedIn Note ({previewNote.length}/300 chars)
                      </span>
                    </>
                  )}
                </button>

                {/* Action C: Copy / Launch WhatsApp Pitch */}
                <button
                  type="button"
                  data-testid={`outbound-whatsapp-btn-${company.id}`}
                  onClick={() => handleCopyWhatsAppPitch(company)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedBadge === `wa-${company.id}` ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Free 3-SKU WhatsApp Pitch!</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copy / Launch WhatsApp Pitch</span>
                    </>
                  )}
                </button>

                {waLaunchUrl && (
                  <a
                    href={waLaunchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`outbound-wa-direct-link-${company.id}`}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold inline-flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open wa.me</span>
                  </a>
                )}
              </div>

              {/* Inline Contact & Quick-Save Notes Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 font-mono text-xs">
                <input
                  type="text"
                  data-testid={`outbound-contact-input-${company.id}`}
                  value={draft.contactName}
                  onChange={(e) =>
                    updateRowDraft(company, 'contactName', e.target.value)
                  }
                  placeholder="MD / Plant Head Name"
                  className="sm:col-span-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500"
                />

                <input
                  type="text"
                  data-testid={`outbound-phone-input-${company.id}`}
                  value={draft.phoneOrWhatsapp}
                  onChange={(e) =>
                    updateRowDraft(company, 'phoneOrWhatsapp', e.target.value)
                  }
                  placeholder="WhatsApp (+91 9840X...)"
                  className="sm:col-span-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500"
                />

                <input
                  type="email"
                  data-testid={`outbound-email-input-${company.id}`}
                  value={draft.email}
                  onChange={(e) => updateRowDraft(company, 'email', e.target.value)}
                  placeholder="Work Email"
                  className="sm:col-span-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500"
                />

                <input
                  type="text"
                  data-testid={`outbound-notes-input-${company.id}`}
                  value={draft.notes}
                  onChange={(e) => updateRowDraft(company, 'notes', e.target.value)}
                  placeholder="Follow-up notes..."
                  className="sm:col-span-4 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500"
                />

                <button
                  type="button"
                  data-testid={`outbound-save-row-btn-${company.id}`}
                  disabled={savingRowId === company.id}
                  onClick={() => handleSaveRowDetails(company)}
                  className="sm:col-span-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 font-bold inline-flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingRowId === company.id ? '...' : 'Save'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
