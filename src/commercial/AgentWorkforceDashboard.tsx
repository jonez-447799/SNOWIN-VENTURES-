/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  CreditCard,
  Sparkles,
  Inbox,
  Play,
  Save,
  Copy,
  Unlock,
  RefreshCw,
  BellRing,
  Database,
  Send,
} from 'lucide-react';
import {
  type AgentWorkforceState,
  type AgentWorkforceTask,
  readAgentWorkforceStateFromBrowser,
  saveAgentWorkforceStateToBrowser,
  buildDecomposedGoalTasks,
} from '../utils/agentWorkforceEngine.ts';
import {
  type FounderBillingConfig,
  LIVE_FOUNDER_UPI_ID,
  readFounderBillingFromBrowser,
  saveFounderBillingToBrowser,
  buildUpiPaymentUri,
} from '../utils/founderBillingStore.ts';
import { SUPABASE_TABLE_SQL_SNIPPET } from '../utils/cloudPersistenceStore.ts';
import {
  type FounderAlertDeliveryLog,
  readFounderAlertLogsFromBrowser,
  saveFounderAlertLogsToBrowser,
} from '../utils/founderAlertNotifier.ts';
import type { PilotWorkspaceSnapshot } from '../utils/pilotWorkspaceStore.ts';
import {
  type OutboundTargetCompany,
  readOutboundCrmFromBrowser,
  saveOutboundCrmToBrowser,
} from '../data/outboundTargetCompanies.ts';
import { OutboundSalesCrmPanel } from './OutboundSalesCrmPanel.tsx';

interface AgentWorkforceDashboardProps {
  onBackToHome: () => void;
  onOpenLeadInbox: () => void;
  onOpenPlatform: () => void;
  onOpenWalkthrough?: (workspaceId: string, shareToken: string) => void;
}

const DEFAULT_DEMO_KEY = 'operationalyst-local-dev-key';
const SESSION_STORAGE_ADMIN_KEY = 'operationalyst_founder_admin_key_v1';

export const AgentWorkforceDashboard: React.FC<AgentWorkforceDashboardProps> = ({
  onBackToHome,
  onOpenLeadInbox,
  onOpenPlatform,
  onOpenWalkthrough,
}) => {
  const [adminKey, setAdminKey] = useState<string>(() => {
    try {
      return sessionStorage.getItem(SESSION_STORAGE_ADMIN_KEY) || DEFAULT_DEMO_KEY;
    } catch {
      return DEFAULT_DEMO_KEY;
    }
  });

  const [workforceState, setWorkforceState] = useState<AgentWorkforceState>(() =>
    readAgentWorkforceStateFromBrowser()
  );
  const [billingConfig, setBillingConfig] = useState<FounderBillingConfig>(() =>
    readFounderBillingFromBrowser()
  );
  const [alertLogs, setAlertLogs] = useState<FounderAlertDeliveryLog[]>(() =>
    readFounderAlertLogsFromBrowser()
  );
  const [supabaseSqlSnippet, setSupabaseSqlSnippet] = useState<string>(
    SUPABASE_TABLE_SQL_SNIPPET
  );
  const [showSqlSnippet, setShowSqlSnippet] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [sendingTestAlert, setSendingTestAlert] = useState<boolean>(false);

  const [workspaces, setWorkspaces] = useState<PilotWorkspaceSnapshot[]>([]);
  const [outboundCompanies, setOutboundCompanies] = useState<OutboundTargetCompany[]>(
    () => readOutboundCrmFromBrowser()
  );
  const [goalInput, setGoalInput] = useState<string>(
    'Close 5 Paid Plant Audits in Chennai This Month — ₹74,995 Target'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [decomposingGoal, setDecomposingGoal] = useState<boolean>(false);
  const [decidingTaskId, setDecidingTaskId] = useState<string | null>(null);
  const [verifyingWorkspaceId, setVerifyingWorkspaceId] = useState<string | null>(null);
  const [savingBilling, setSavingBilling] = useState<boolean>(false);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);

  const loadWorkforceAndBilling = useCallback(async (keyToUse: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [wfRes, adminBillRes, pubBillRes, wsRes, crmRes] = await Promise.all([
        fetch('/api/admin/agent-workforce', {
          headers: { 'x-admin-key': keyToUse.trim() },
        }),
        fetch('/api/admin/founder-billing', {
          headers: { 'x-admin-key': keyToUse.trim() },
        }),
        fetch('/api/founder-billing/public'),
        fetch('/api/admin/pilot-workspaces', {
          headers: { 'x-admin-key': keyToUse.trim() },
        }),
        fetch('/api/admin/outbound-crm', {
          headers: { 'x-admin-key': keyToUse.trim() },
        }),
      ]);

      const wfData = await wfRes.json().catch(() => null);
      if (wfRes.ok && wfData?.ok && wfData.state) {
        setWorkforceState(wfData.state as AgentWorkforceState);
        saveAgentWorkforceStateToBrowser(wfData.state as AgentWorkforceState);
        if (wfData.state.activeGoal?.goalText) {
          setGoalInput(wfData.state.activeGoal.goalText);
        }
      }

      const adminBillData = await adminBillRes.json().catch(() => null);
      if (adminBillRes.ok && adminBillData?.ok && adminBillData.config) {
        setBillingConfig(adminBillData.config as FounderBillingConfig);
        saveFounderBillingToBrowser(adminBillData.config as FounderBillingConfig);
        if (Array.isArray(adminBillData.alertLogs)) {
          setAlertLogs(adminBillData.alertLogs as FounderAlertDeliveryLog[]);
          saveFounderAlertLogsToBrowser(adminBillData.alertLogs as FounderAlertDeliveryLog[]);
        }
        if (typeof adminBillData.supabaseSqlSnippet === 'string') {
          setSupabaseSqlSnippet(adminBillData.supabaseSqlSnippet);
        }
      } else {
        const pubBillData = await pubBillRes.json().catch(() => null);
        if (pubBillRes.ok && pubBillData?.ok && pubBillData.config) {
          setBillingConfig(pubBillData.config as FounderBillingConfig);
          saveFounderBillingToBrowser(pubBillData.config as FounderBillingConfig);
        }
      }

      const wsData = await wsRes.json().catch(() => null);
      if (wsRes.ok && wsData?.ok && Array.isArray(wsData.workspaces)) {
        setWorkspaces(wsData.workspaces as PilotWorkspaceSnapshot[]);
      }

      const crmData = await crmRes.json().catch(() => null);
      if (crmRes.ok && crmData?.ok && Array.isArray(crmData.companies)) {
        const syncedCrm = saveOutboundCrmToBrowser(
          crmData.companies as OutboundTargetCompany[]
        );
        setOutboundCompanies(syncedCrm);
      }

      try {
        sessionStorage.setItem(SESSION_STORAGE_ADMIN_KEY, keyToUse.trim());
      } catch {}
    } catch {
      // Static browser fallback
      setWorkforceState(readAgentWorkforceStateFromBrowser());
      setBillingConfig(readFounderBillingFromBrowser());
      setAlertLogs(readFounderAlertLogsFromBrowser());
      setOutboundCompanies(readOutboundCrmFromBrowser());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkforceAndBilling(adminKey);
  }, []);

  const handleDecomposeGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;
    setDecomposingGoal(true);
    setNoticeMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/agent-workforce/goal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey.trim(),
        },
        body: JSON.stringify({
          goalText: goalInput.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.state) {
        setWorkforceState(data.state as AgentWorkforceState);
        saveAgentWorkforceStateToBrowser(data.state as AgentWorkforceState);
        setNoticeMsg(
          `CEO Goal Decomposed (${data.goal?.goalId}): Created ${
            data.tasksCreated?.length || 5
          } deterministic sub-tasks across Agents 01–05 with ₹0.00 API token spend.`
        );
      } else {
        // Browser fallback
        const { goal, tasks } = buildDecomposedGoalTasks(goalInput.trim());
        const nextState: AgentWorkforceState = {
          ...workforceState,
          activeGoal: goal,
          tasks: [...tasks, ...workforceState.tasks].slice(0, 100),
          updatedAt: new Date().toISOString(),
        };
        setWorkforceState(saveAgentWorkforceStateToBrowser(nextState));
        setNoticeMsg(
          `CEO Goal Decomposed (${goal.goalId}): Created ${tasks.length} deterministic sub-tasks across Agents 01–05 with ₹0.00 API token spend.`
        );
      }
    } catch {
      const { goal, tasks } = buildDecomposedGoalTasks(goalInput.trim());
      const nextState: AgentWorkforceState = {
        ...workforceState,
        activeGoal: goal,
        tasks: [...tasks, ...workforceState.tasks].slice(0, 100),
        updatedAt: new Date().toISOString(),
      };
      setWorkforceState(saveAgentWorkforceStateToBrowser(nextState));
      setNoticeMsg(
        `CEO Goal Decomposed (${goal.goalId}): Created ${tasks.length} deterministic sub-tasks across Agents 01–05 with ₹0.00 API token spend.`
      );
    } finally {
      setDecomposingGoal(false);
    }
  };

  const handleTaskDecision = async (
    task: AgentWorkforceTask,
    decision: 'APPROVE' | 'REJECT'
  ) => {
    setDecidingTaskId(task.taskId);
    setNoticeMsg(null);
    setErrorMsg(null);

    try {
      if (
        decision === 'APPROVE' &&
        task.taskType === 'UTR_PAYMENT_VERIFICATION' &&
        task.linkedWorkspaceId
      ) {
        await fetch(
          `/api/admin/pilot-workspaces/${encodeURIComponent(
            task.linkedWorkspaceId
          )}/verify-payment`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-key': adminKey.trim(),
            },
            body: JSON.stringify({
              utrNumber: task.submittedUtrNumber || 'VERIFIED-BANK-CREDIT',
            }),
          }
        ).catch(() => null);
      }

      const res = await fetch(
        `/api/admin/agent-workforce/tasks/${encodeURIComponent(task.taskId)}/decision`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': adminKey.trim(),
          },
          body: JSON.stringify({
            decision,
            notes:
              decision === 'APPROVE'
                ? 'Approved by Founder C. Jones Snowin'
                : 'Rejected by Founder',
          }),
        }
      );
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.state) {
        setWorkforceState(data.state as AgentWorkforceState);
        saveAgentWorkforceStateToBrowser(data.state as AgentWorkforceState);
        setNoticeMsg(
          decision === 'APPROVE'
            ? `Task ${task.taskId} approved and marked COMPLETED.`
            : `Task ${task.taskId} rejected.`
        );
      } else {
        const nextTasks = workforceState.tasks.map((t) =>
          t.taskId === task.taskId
            ? {
                ...t,
                status: (decision === 'APPROVE' ? 'COMPLETED' : 'REJECTED') as AgentWorkforceTask['status'],
                updatedAt: new Date().toISOString(),
              }
            : t
        );
        const nextState = saveAgentWorkforceStateToBrowser({
          ...workforceState,
          tasks: nextTasks,
        });
        setWorkforceState(nextState);
        setNoticeMsg(
          decision === 'APPROVE'
            ? `Task ${task.taskId} approved and marked COMPLETED.`
            : `Task ${task.taskId} rejected.`
        );
      }
    } catch {
      const nextTasks = workforceState.tasks.map((t) =>
        t.taskId === task.taskId
          ? {
              ...t,
              status: (decision === 'APPROVE' ? 'COMPLETED' : 'REJECTED') as AgentWorkforceTask['status'],
              updatedAt: new Date().toISOString(),
            }
          : t
      );
      const nextState = saveAgentWorkforceStateToBrowser({
        ...workforceState,
        tasks: nextTasks,
      });
      setWorkforceState(nextState);
    } finally {
      setDecidingTaskId(null);
    }
  };

  const handleDirectWorkspacePaymentUnlock = async (
    workspaceId: string,
    utrNumber?: string
  ) => {
    setVerifyingWorkspaceId(workspaceId);
    setNoticeMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `/api/admin/pilot-workspaces/${encodeURIComponent(workspaceId)}/verify-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': adminKey.trim(),
          },
          body: JSON.stringify({
            utrNumber: utrNumber || '431298765432',
          }),
        }
      );
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.snapshot) {
        setWorkspaces((prev) =>
          prev.map((w) =>
            w.workspaceId === workspaceId ? (data.snapshot as PilotWorkspaceSnapshot) : w
          )
        );
        setNoticeMsg(
          `Confirmed ₹${(
            data.snapshot.invoiceAmountInr || 14999
          ).toLocaleString('en-IN')} bank credit for ${workspaceId}. Client Walkthrough & 6-Sheet .XLSX Action Plan are now FULL_UNLOCKED.`
        );
        await loadWorkforceAndBilling(adminKey);
      } else {
        setErrorMsg(data?.error || `Failed to verify payment for ${workspaceId}.`);
      }
    } catch {
      setErrorMsg(`Network error while unlocking workspace ${workspaceId}.`);
    } finally {
      setVerifyingWorkspaceId(null);
    }
  };

  const handleSaveBillingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBilling(true);
    setNoticeMsg(null);
    setErrorMsg(null);

    const savedLocal = saveFounderBillingToBrowser(billingConfig);
    setBillingConfig(savedLocal);

    try {
      const res = await fetch('/api/admin/founder-billing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey.trim(),
        },
        body: JSON.stringify(billingConfig),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.config) {
        setBillingConfig(data.config as FounderBillingConfig);
        saveFounderBillingToBrowser(data.config as FounderBillingConfig);
        setNoticeMsg(
          `Saved Founder Bank, UPI (${data.config.upiId}), Cloud & Alert Settings (₹${data.config.tier2FullAuditPriceInr.toLocaleString(
            'en-IN'
          )} / ₹${data.config.tier3MonthlyRetainerInr.toLocaleString('en-IN')}).`
        );
      } else {
        setNoticeMsg(
          `Saved Founder Billing Settings locally (${savedLocal.upiId}).`
        );
      }
    } catch {
      setNoticeMsg(
        `Saved Founder Billing Settings locally (${savedLocal.upiId}).`
      );
    } finally {
      setSavingBilling(false);
    }
  };

  const handleSendTestPaymentAlert = async () => {
    setSendingTestAlert(true);
    setNoticeMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/test-founder-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey.trim(),
        },
        body: JSON.stringify({
          utrNumber: 'TESTUTR9080540047',
          companyName: 'Ambattur Precision Forge (Founder Test Payment Alert)',
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.alertLog) {
        const updatedLogs = Array.isArray(data.alertLogs)
          ? (data.alertLogs as FounderAlertDeliveryLog[])
          : [data.alertLog as FounderAlertDeliveryLog, ...alertLogs].slice(0, 20);
        setAlertLogs(updatedLogs);
        saveFounderAlertLogsToBrowser(updatedLogs);
        setNoticeMsg(
          `Test Payment Alert (${data.alertLog.alertId}) dispatched for ₹${(
            billingConfig.tier2FullAuditPriceInr || 14999
          ).toLocaleString('en-IN')} to UPI ${
            billingConfig.upiId || LIVE_FOUNDER_UPI_ID
          } — Status: ${data.alertLog.overallStatus} (Email: ${data.alertLog.emailStatus}, Webhook: ${data.alertLog.webhookStatus}).`
        );
      } else {
        const fallbackEntry: FounderAlertDeliveryLog = {
          alertId: `ALERT-LOCAL-${Date.now().toString(16).slice(-4).toUpperCase()}`,
          timestamp: new Date().toISOString(),
          eventType: 'TEST_PAYMENT_ALERT',
          title: `[TEST UTR PAYMENT ALERT] ₹${(
            billingConfig.tier2FullAuditPriceInr || 14999
          ).toLocaleString('en-IN')} Submitted — Ambattur Precision Forge`,
          summary: `UTR TESTUTR9080540047 submitted for AUDIT-DEMO-P1P4 (₹14,999 to UPI ${
            billingConfig.upiId || LIVE_FOUNDER_UPI_ID
          }).`,
          companyName: 'Ambattur Precision Forge (Founder Test Payment Alert)',
          workspaceId: 'AUDIT-DEMO-P1P4',
          utrNumber: 'TESTUTR9080540047',
          amountInr: billingConfig.tier2FullAuditPriceInr || 14999,
          upiId: billingConfig.upiId || LIVE_FOUNDER_UPI_ID,
          actionUrl: '?view=agent-workforce',
          recipientEmail: billingConfig.founderAlertEmail || 'joneszz2004@gmail.com',
          webhookConfigured: Boolean(billingConfig.founderWebhookUrl),
          emailStatus: 'SKIPPED_NOT_CONFIGURED',
          webhookStatus: 'SKIPPED_NOT_CONFIGURED',
          overallStatus: 'SKIPPED_NOT_CONFIGURED',
        };
        const updated = saveFounderAlertLogsToBrowser([fallbackEntry, ...alertLogs]);
        setAlertLogs(updated);
        setNoticeMsg(
          `Logged Test Payment Alert (${fallbackEntry.alertId}) for UPI ${fallbackEntry.upiId}.`
        );
      }
    } catch {
      setErrorMsg('Unable to trigger test founder alert.');
    } finally {
      setSendingTestAlert(false);
    }
  };

  const handleCopySupabaseSql = async () => {
    try {
      await navigator.clipboard.writeText(supabaseSqlSnippet);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {}
  };

  const pendingTasks = workforceState.tasks.filter(
    (t) => t.status === 'AWAITING_FOUNDER_APPROVAL'
  );
  const sampleUpiUri = buildUpiPaymentUri(
    billingConfig,
    billingConfig.tier2FullAuditPriceInr || 14999,
    'INV-20261109-DEMO',
    'AmbatturPlant'
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Homepage</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
                  Paperclip 5-Agent Autonomous Revenue Workforce &amp; Direct Bank Billing
                </h1>
                <p className="text-[11px] text-slate-400 font-mono">
                  100% Deterministic Execution · ₹0.00 API Token Spend · Live UPI ({billingConfig.upiId || LIVE_FOUNDER_UPI_ID}) to C. Jones Snowin
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenLeadInbox}
              className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Inbox className="w-3.5 h-3.5 text-emerald-400" />
              <span>Founder Lead Inbox</span>
            </button>
            {onOpenWalkthrough && (
              <button
                type="button"
                data-testid="agent-open-demo-paywall-btn"
                onClick={() =>
                  onOpenWalkthrough('AUDIT-DEMO-P1P4', 'operationalyst-public-demo-token')
                }
                className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Preview Client Paywall Walkthrough</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => loadWorkforceAndBilling(adminKey)}
              className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={onOpenPlatform}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              View Platform
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Notices */}
        {noticeMsg && (
          <div
            data-testid="agent-workforce-notice"
            className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 font-mono text-xs flex items-center justify-between gap-3"
          >
            <span>{noticeMsg}</span>
            <button
              type="button"
              onClick={() => setNoticeMsg(null)}
              className="text-emerald-300 hover:text-white underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
        {errorMsg && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 font-mono text-xs"
          >
            {errorMsg}
          </div>
        )}

        {/* Section 1: Paperclip CEO Goal Bar & ₹0.00 Token Budget Guardrail */}
        <section
          data-testid="paperclip-ceo-goal-bar"
          className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PAPERCLIP CEO GOAL ORCHESTRATOR • AGENT 01</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Founder Revenue Goal Decomposition &amp; Pipeline Quota
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span
                data-testid="zero-token-budget-badge"
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-emerald-500/40 text-emerald-300 font-bold"
              >
                API Token Spend: ₹0.00 / ₹0.00 Cap (100% Free Deterministic Math)
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-amber-500/40 text-amber-300 font-bold">
                Target Revenue: ₹
                {workforceState.activeGoal.targetRevenueInr.toLocaleString('en-IN')} (
                {workforceState.activeGoal.targetPaidAuditsCount} × ₹
                {workforceState.activeGoal.unitAuditPriceInr.toLocaleString('en-IN')})
              </span>
            </div>
          </div>

          <form onSubmit={handleDecomposeGoal} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              data-testid="ceo-goal-input"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Enter monthly revenue goal (e.g., Close 5 Paid Plant Audits in Chennai This Month — ₹74,995 Target)"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              data-testid="decompose-goal-btn"
              disabled={decomposingGoal}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs inline-flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>
                {decomposingGoal
                  ? 'Decomposing Goal...'
                  : 'Decompose Goal & Run 5-Agent Pipeline'}
              </span>
            </button>
          </form>
        </section>

        {/* Section 2: 5-Agent Live Status Grid */}
        <section
          data-testid="agent-workforce-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5"
        >
          {workforceState.agents.map((agent) => (
            <div
              key={agent.agentId}
              data-testid={`agent-card-${agent.code}`}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-emerald-300 font-bold">
                    {agent.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold border ${
                      agent.status === 'AWAITING_FOUNDER_APPROVAL'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    }`}
                  >
                    {agent.status === 'AWAITING_FOUNDER_APPROVAL'
                      ? 'APPROVAL GATE'
                      : 'ACTIVE'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white leading-snug">{agent.name}</h3>
                  <div className="text-[11px] font-mono text-sky-300">
                    &ldquo;{agent.nickname}&rdquo;
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {agent.roleDescription}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 truncate">
                  Active: {agent.activeTaskTitle}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Completed: {agent.completedTasksCount}</span>
                  <span className="text-emerald-400 font-bold">Cost: ₹0.00</span>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Section 3: Founder 1-Click Approval & UTR Bank Verification Queue */}
        <section
          data-testid="founder-approval-queue"
          className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="text-[11px] font-mono font-bold text-amber-400 uppercase">
                HUMAN-IN-THE-LOOP GOVERNANCE • FOUNDER 1-CLICK APPROVAL &amp; UTR VERIFICATION QUEUE
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Pending Outreach Drafts &amp; Client Bank UTR Verifications ({pendingTasks.length} Pending)
              </h2>
            </div>

            <button
              type="button"
              data-testid="confirm-demo-bank-credit-btn"
              disabled={verifyingWorkspaceId === 'AUDIT-DEMO-P1P4'}
              onClick={() =>
                handleDirectWorkspacePaymentUnlock('AUDIT-DEMO-P1P4', '431298765432')
              }
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>
                Confirm ₹14,999 Bank Credit in Account → Unlock Client Audit &amp; Issue Paid Receipt
              </span>
            </button>
          </div>

          <div className="space-y-3">
            {workforceState.tasks.slice(0, 10).map((task) => (
              <div
                key={task.taskId}
                data-testid={`agent-task-row-${task.taskId}`}
                className={`p-4 rounded-xl border space-y-2.5 text-xs ${
                  task.status === 'AWAITING_FOUNDER_APPROVAL'
                    ? 'bg-slate-950 border-amber-500/40'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-300 font-bold">
                        {task.agentCode} · {task.taskId}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold border ${
                          task.status === 'AWAITING_FOUNDER_APPROVAL'
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : task.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        {task.status}
                      </span>
                      {task.submittedUtrNumber && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                          UTR: {task.submittedUtrNumber}
                        </span>
                      )}
                      <span className="text-slate-400">Compute: ₹0.00</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{task.title}</h3>
                    <p className="text-slate-300 leading-relaxed">{task.description}</p>
                  </div>

                  {task.status === 'AWAITING_FOUNDER_APPROVAL' && (
                    <div className="flex flex-wrap items-center gap-2 font-mono shrink-0">
                      {task.draftPayload && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(task.draftPayload || '');
                              setCopiedTaskId(task.taskId);
                              setTimeout(() => setCopiedTaskId(null), 2000);
                            } catch {}
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>
                            {copiedTaskId === task.taskId
                              ? 'Copied Outreach'
                              : 'Copy Outreach Script'}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        data-testid={`approve-task-btn-${task.taskId}`}
                        disabled={decidingTaskId === task.taskId}
                        onClick={() => handleTaskDecision(task, 'APPROVE')}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {task.taskType === 'UTR_PAYMENT_VERIFICATION'
                            ? 'Confirm ₹14,999 Bank Credit & Unlock Client Audit'
                            : 'Approve Task'}
                        </span>
                      </button>
                      <button
                        type="button"
                        disabled={decidingTaskId === task.taskId}
                        onClick={() => handleTaskDecision(task, 'REJECT')}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 border border-slate-700 text-slate-300 hover:text-rose-200 cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Founder Bank, UPI (`9080540047@yespop`), Cloud Sync & Instant Alerts Drawer */}
        <section
          data-testid="founder-billing-settings-panel"
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="text-[11px] font-mono font-bold text-emerald-400 uppercase">
                DIRECT BANK, UPI (`9080540047@yespop`), SUPABASE CLOUD SYNC &amp; INSTANT ALERTS (`./data/founder_billing.json`)
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Founder Bank Account, 0%-Fee UPI ID (`{billingConfig.upiId || LIVE_FOUNDER_UPI_ID}`) &amp; Audit Tier Pricing
              </h2>
              <p className="text-xs text-slate-400">
                Configure where client payments land when unlocking the ₹14,999 Full 4-Pillar Audit or ₹24,999 Monthly Retainer, plus optional Supabase cloud persistence and instant Resend / Webhook alerts.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 font-mono text-[11px] text-slate-300 max-w-md">
              <div className="text-emerald-400 font-bold uppercase text-[10px]">
                Live Generated NPCI UPI Deep-Link Preview
              </div>
              <div
                data-testid="billing-upi-uri-preview"
                className="text-slate-200 truncate mt-0.5"
              >
                {sampleUpiUri}
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveBillingSettings} className="space-y-6 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  Beneficiary Name (Shown on Proforma Invoice &amp; UPI)
                </label>
                <input
                  type="text"
                  data-testid="billing-beneficiary-input"
                  value={billingConfig.beneficiaryName}
                  onChange={(e) =>
                    setBillingConfig((prev) => ({
                      ...prev,
                      beneficiaryName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-emerald-300 font-bold block">
                  Founder UPI ID (0% Gateway Fee · Live Default: 9080540047@yespop)
                </label>
                <input
                  type="text"
                  data-testid="billing-upi-id-input"
                  value={billingConfig.upiId}
                  onChange={(e) =>
                    setBillingConfig((prev) => ({ ...prev, upiId: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-emerald-500/40 text-emerald-300 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  Bank Name (For NEFT / IMPS)
                </label>
                <input
                  type="text"
                  data-testid="billing-bank-name-input"
                  value={billingConfig.bankName}
                  onChange={(e) =>
                    setBillingConfig((prev) => ({ ...prev, bankName: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  data-testid="billing-account-number-input"
                  value={billingConfig.accountNumber}
                  onChange={(e) =>
                    setBillingConfig((prev) => ({
                      ...prev,
                      accountNumber: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  Bank IFSC Code
                </label>
                <input
                  type="text"
                  data-testid="billing-ifsc-input"
                  value={billingConfig.ifscCode}
                  onChange={(e) =>
                    setBillingConfig((prev) => ({ ...prev, ifscCode: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  Optional Razorpay Payment Link (Tier 2)
                </label>
                <input
                  type="text"
                  data-testid="billing-razorpay-input"
                  value={billingConfig.razorpayPaymentLinkTier2}
                  onChange={(e) =>
                    setBillingConfig((prev) => ({
                      ...prev,
                      razorpayPaymentLinkTier2: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-amber-300 font-bold block">
                  Tier 2: Complete 4-Pillar Audit Price (INR)
                </label>
                <input
                  type="number"
                  data-testid="billing-tier2-price-input"
                  value={billingConfig.tier2FullAuditPriceInr}
                  onChange={(e) =>
                    setBillingConfig((prev) => ({
                      ...prev,
                      tier2FullAuditPriceInr: Number(e.target.value) || 14999,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sky-300 font-bold block">
                  Tier 3: Monthly Control Tower Retainer (INR)
                </label>
                <input
                  type="number"
                  data-testid="billing-tier3-price-input"
                  value={billingConfig.tier3MonthlyRetainerInr}
                  onChange={(e) =>
                    setBillingConfig((prev) => ({
                      ...prev,
                      tier3MonthlyRetainerInr: Number(e.target.value) || 24999,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  Udyam MSME Registration No. (Snowin Ventures)
                </label>
                <input
                  type="text"
                  data-testid="billing-udyam-msme-input"
                  value={billingConfig.udyamMsmeNumber || ''}
                  onChange={(e) =>
                    setBillingConfig((prev) => ({
                      ...prev,
                      udyamMsmeNumber: e.target.value,
                    }))
                  }
                  placeholder="UDYAM-TN-02-XXXXXXX"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  GSTIN (Optional — Blank = Exempt / Below Threshold)
                </label>
                <input
                  type="text"
                  data-testid="billing-gstin-input"
                  value={billingConfig.gstinOptional || ''}
                  onChange={(e) =>
                    setBillingConfig((prev) => ({
                      ...prev,
                      gstinOptional: e.target.value,
                    }))
                  }
                  placeholder="Optional 15-Digit GSTIN (or leave blank)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  Admin Key (`x-admin-key`)
                </label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>

            {/* Phase 16 Sub-Section: Cloud Sync (Supabase) & Instant Phone/Email Alerts */}
            <div
              data-testid="cloud-sync-and-alerts-section"
              className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-sky-500/30 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-sky-400 font-bold uppercase text-[11px]">
                    <Database className="w-3.5 h-3.5" />
                    <span>CLOUD SYNC (SUPABASE REST) &amp; INSTANT PHONE/EMAIL ALERTS</span>
                  </div>
                  <p className="text-slate-400 text-[11px] font-sans">
                    100% optional: When configured, every new pilot lead, Step-2 CSV upload, and 12-digit UTR payment (`{billingConfig.upiId || LIVE_FOUNDER_UPI_ID}`) automatically syncs to Supabase and dispatches an instant email/webhook alert.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="copy-supabase-sql-btn"
                    onClick={handleCopySupabaseSql}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-sky-500/40 text-sky-300 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>
                      {copiedSql
                        ? 'Copied Supabase SQL Snippet!'
                        : 'Copy Supabase SQL Table Snippet'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSqlSnippet((prev) => !prev)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] cursor-pointer"
                  >
                    {showSqlSnippet ? 'Hide SQL' : 'View SQL'}
                  </button>
                  <button
                    type="button"
                    data-testid="send-test-alert-btn"
                    disabled={sendingTestAlert}
                    onClick={handleSendTestPaymentAlert}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {sendingTestAlert ? 'Sending Alert...' : 'Send Test Payment Alert'}
                    </span>
                  </button>
                </div>
              </div>

              {showSqlSnippet && (
                <pre
                  data-testid="supabase-sql-snippet-box"
                  className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-sky-200 text-[11px] overflow-x-auto leading-relaxed"
                >
                  {supabaseSqlSnippet}
                </pre>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">
                    Founder Alert Email (Resend Destination)
                  </label>
                  <input
                    type="email"
                    data-testid="billing-founder-alert-email-input"
                    value={billingConfig.founderAlertEmail || ''}
                    onChange={(e) =>
                      setBillingConfig((prev) => ({
                        ...prev,
                        founderAlertEmail: e.target.value,
                      }))
                    }
                    placeholder="joneszz2004@gmail.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">
                    Resend Email API Key (Optional)
                  </label>
                  <input
                    type="password"
                    data-testid="billing-resend-api-key-input"
                    value={billingConfig.resendApiKey || ''}
                    onChange={(e) =>
                      setBillingConfig((prev) => ({
                        ...prev,
                        resendApiKey: e.target.value,
                      }))
                    }
                    placeholder="re_123456789..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">
                    Slack / Discord / WhatsApp Webhook URL
                  </label>
                  <input
                    type="url"
                    data-testid="billing-webhook-url-input"
                    value={billingConfig.founderWebhookUrl || ''}
                    onChange={(e) =>
                      setBillingConfig((prev) => ({
                        ...prev,
                        founderWebhookUrl: e.target.value,
                      }))
                    }
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sky-300 font-bold block">
                    Supabase Project URL (Optional Cloud Sync)
                  </label>
                  <input
                    type="url"
                    data-testid="billing-supabase-url-input"
                    value={billingConfig.supabaseUrl || ''}
                    onChange={(e) =>
                      setBillingConfig((prev) => ({
                        ...prev,
                        supabaseUrl: e.target.value,
                      }))
                    }
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sky-300 font-bold block">
                    Supabase Service Role Key (Server-Only · Masked on Public Routes)
                  </label>
                  <input
                    type="password"
                    data-testid="billing-supabase-key-input"
                    value={billingConfig.supabaseServiceKey || ''}
                    onChange={(e) =>
                      setBillingConfig((prev) => ({
                        ...prev,
                        supabaseServiceKey: e.target.value,
                      }))
                    }
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="submit"
                data-testid="save-founder-billing-btn"
                disabled={savingBilling}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {savingBilling
                    ? 'Saving Payout & Cloud Settings...'
                    : 'Save Founder Bank, UPI, Cloud & Alert Settings'}
                </span>
              </button>
            </div>
          </form>

          {/* Last 20 Alert Delivery Logs */}
          <div
            data-testid="founder-alert-logs-panel"
            className="pt-4 border-t border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-amber-300 uppercase">
                <BellRing className="w-3.5 h-3.5" />
                <span>Last 20 Founder Alert Delivery Logs (`./data/founder_alert_logs.json`)</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Total Logged: {alertLogs.length} / 20 Max
              </span>
            </div>

            {alertLogs.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
                No founder alerts logged yet. Click &ldquo;Send Test Payment Alert&rdquo; above or submit a Pilot Lead / UTR Payment to verify instant delivery logging.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {alertLogs.slice(0, 20).map((log) => (
                  <div
                    key={log.alertId}
                    data-testid={`alert-log-row-${log.alertId}`}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]"
                  >
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-emerald-300 font-bold">{log.alertId}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-300">
                          {log.eventType}
                        </span>
                        <span className="text-white font-bold">{log.title}</span>
                      </div>
                      <div className="text-slate-400">{log.summary}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded border font-bold ${
                          log.overallStatus === 'SENT'
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : log.overallStatus === 'FAILED'
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}
                      >
                        {log.overallStatus}
                      </span>
                      <span className="text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 4. Phase 18: Built-In 50-Company Chennai & Hosur Outbound Sales CRM & 1-Click Pitch Launcher */}
        <OutboundSalesCrmPanel
          companies={outboundCompanies}
          adminKey={adminKey}
          onCompaniesChange={setOutboundCompanies}
          onNotice={(msg) => setNoticeMsg(msg)}
        />
      </main>
    </div>
  );
};
