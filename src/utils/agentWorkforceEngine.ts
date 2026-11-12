/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PilotRequestRecord } from './leadValidation.ts';
import type { PilotWorkspaceSnapshot } from './pilotWorkspaceStore.ts';
import {
  DEFAULT_FOUNDER_BILLING_CONFIG,
  generateProformaInvoice,
} from './founderBillingStore.ts';
import { buildStep2SuitabilityReplyTemplate } from './pilotDataKitExporter.ts';

export type AgentId =
  | 'AGENT_01_CEO_ORCHESTRATOR'
  | 'AGENT_02_SDR_OUTREACH'
  | 'AGENT_03_ERP_INGESTION'
  | 'AGENT_04_AUDIT_ANALYST'
  | 'AGENT_05_COMMERCIAL_CLOSER';

export type AgentTaskStatus =
  | 'COMPLETED'
  | 'AWAITING_FOUNDER_APPROVAL'
  | 'IN_PROGRESS'
  | 'REJECTED';

export type AgentTaskType =
  | 'GOAL_DECOMPOSITION'
  | 'SDR_OUTREACH_DRAFT'
  | 'ERP_QUARANTINE_INGESTION'
  | 'FOUR_PILLAR_QUANTIFICATION'
  | 'PROFORMA_INVOICE_GENERATION'
  | 'UTR_PAYMENT_VERIFICATION';

export interface AutonomousAgentProfile {
  agentId: AgentId;
  code: 'AGENT_01' | 'AGENT_02' | 'AGENT_03' | 'AGENT_04' | 'AGENT_05';
  name: string;
  nickname: string;
  roleDescription: string;
  status: 'ACTIVE' | 'AWAITING_FOUNDER_APPROVAL' | 'IDLE';
  activeTaskTitle: string;
  completedTasksCount: number;
  apiTokenBudgetCapInr: 0;
  computeCostSpentInr: 0;
}

export interface AgentWorkforceTask {
  taskId: string;
  goalId?: string;
  agentId: AgentId;
  agentCode: 'AGENT_01' | 'AGENT_02' | 'AGENT_03' | 'AGENT_04' | 'AGENT_05';
  agentName: string;
  title: string;
  description: string;
  taskType: AgentTaskType;
  status: AgentTaskStatus;
  requiresFounderApproval: boolean;
  computeCostInr: 0;
  linkedLeadId?: string;
  linkedWorkspaceId?: string;
  linkedInvoiceId?: string;
  submittedUtrNumber?: string;
  paidByEmail?: string;
  amountInr?: number;
  draftPayload?: string;
  createdAt: string;
  updatedAt: string;
  decidedAt?: string;
  decisionNotes?: string;
}

export interface FounderRevenueGoalRecord {
  goalId: string;
  goalText: string;
  targetRevenueInr: number;
  targetPaidAuditsCount: number;
  unitAuditPriceInr: number;
  apiTokenBudgetCapInr: 0;
  computeCostSpentInr: 0;
  createdAt: string;
  subTaskIds: string[];
}

export interface AgentWorkforceState {
  activeGoal: FounderRevenueGoalRecord;
  agents: AutonomousAgentProfile[];
  tasks: AgentWorkforceTask[];
  budgetGuardrail: {
    mode: 'DETERMINISTIC_ZERO_COST';
    apiTokenBudgetCapInr: 0;
    computeCostSpentInr: 0;
    externalLlmCallsPermitted: false;
  };
  updatedAt: string;
}

export const BROWSER_AGENT_WORKFORCE_STORAGE_KEY = 'operationalyst_agent_workforce_v1';

const isBrowserEnv =
  typeof window !== 'undefined' && typeof window.document !== 'undefined';

export const DEFAULT_AGENT_WORKFORCE_FILE_PATH =
  !isBrowserEnv && typeof process !== 'undefined' && typeof process.cwd === 'function'
    ? `${process.cwd()}/data/agent_workforce.json`
    : './data/agent_workforce.json';

export const CANONICAL_FIVE_AGENTS: AutonomousAgentProfile[] = [
  {
    agentId: 'AGENT_01_CEO_ORCHESTRATOR',
    code: 'AGENT_01',
    name: 'Agent 01 — CEO Orchestrator',
    nickname: 'Revenue & Goal Commander',
    roleDescription:
      'Decomposes founder monthly revenue targets (e.g., ₹74,995 = 5 Paid Plant Audits @ ₹14,999) into deterministic sub-tasks across Agents 02–05 with a strict ₹0.00 token budget cap.',
    status: 'ACTIVE',
    activeTaskTitle: 'Orchestrating 5 Paid Plant Audits in Chennai Cluster (₹74,995 Target)',
    completedTasksCount: 12,
    apiTokenBudgetCapInr: 0,
    computeCostSpentInr: 0,
  },
  {
    agentId: 'AGENT_02_SDR_OUTREACH',
    code: 'AGENT_02',
    name: 'Agent 02 — B2B SDR & Outreach Agent',
    nickname: '15-Min Lead Responder',
    roleDescription:
      'Monitors incoming pilot requests, scores plant SKU scale & ERP readiness, and drafts personalized 15-minute email + WhatsApp follow-up scripts with Step-2 Upload Tokens.',
    status: 'AWAITING_FOUNDER_APPROVAL',
    activeTaskTitle: 'Drafting 15-Min Suitability Reply & Step-2 Upload Token for Ambattur Leads',
    completedTasksCount: 19,
    apiTokenBudgetCapInr: 0,
    computeCostSpentInr: 0,
  },
  {
    agentId: 'AGENT_03_ERP_INGESTION',
    code: 'AGENT_03',
    name: 'Agent 03 — ERP Ingestion & Quarantine Agent',
    nickname: 'Tally/SAP Sanitizer',
    roleDescription:
      'Validates incoming 5-column Tally Prime, SAP, and Excel exports, quarantines malformed/negative rows, neutralizes CSV formula injection, and stamps SHA-256 dataset digests.',
    status: 'ACTIVE',
    activeTaskTitle: 'Sanitizing 5-Column ERP Stock Ledgers & Stamping SHA-256 Proofs',
    completedTasksCount: 24,
    apiTokenBudgetCapInr: 0,
    computeCostSpentInr: 0,
  },
  {
    agentId: 'AGENT_04_AUDIT_ANALYST',
    code: 'AGENT_04',
    name: 'Agent 04 — 4-Pillar Audit Analyst Agent',
    nickname: 'Working Capital Quantifier',
    roleDescription:
      'Executes deterministic P1 Dead Stock, P2 Dual-Gate OTIF, P3 Freight Leakage, and P4 Bin Variance math, protecting critical machine reserve spares under Item 07.',
    status: 'ACTIVE',
    activeTaskTitle: 'Computing 4-Pillar Working Capital Exposure & 3-SKU Teaser Snapshots',
    completedTasksCount: 24,
    apiTokenBudgetCapInr: 0,
    computeCostSpentInr: 0,
  },
  {
    agentId: 'AGENT_05_COMMERCIAL_CLOSER',
    code: 'AGENT_05',
    name: 'Agent 05 — Commercial Closer & Bank Billing Agent',
    nickname: 'Invoice & UTR Verifier',
    roleDescription:
      'Generates printable Proforma Invoices (INV-...), 0%-fee NPCI UPI deep-links, and queues client-submitted 12-digit UTR bank references for 1-click founder unlock.',
    status: 'AWAITING_FOUNDER_APPROVAL',
    activeTaskTitle: 'Monitoring Teaser-to-Paid Paywall (₹14,999) & Queuing UTR Bank Verifications',
    completedTasksCount: 9,
    apiTokenBudgetCapInr: 0,
    computeCostSpentInr: 0,
  },
];

function buildInitialSeedState(): AgentWorkforceState {
  const nowIso = '2026-11-09T09:00:00.000Z';
  const defaultGoalText =
    'Close 5 Paid Plant Audits in Chennai This Month — ₹74,995 Target (5 × ₹14,999 Direct Bank / UPI Collection)';
  const seedTasks: AgentWorkforceTask[] = [
    {
      taskId: 'TASK-20261109-A01',
      goalId: 'GOAL-20261109-INIT',
      agentId: 'AGENT_01_CEO_ORCHESTRATOR',
      agentCode: 'AGENT_01',
      agentName: 'Agent 01 — CEO Orchestrator',
      title: 'Decomposed Monthly Revenue Target: ₹74,995 (5 Paid Audits @ ₹14,999)',
      description:
        'Mapped 5-plant conversion funnel across Ambattur, Sriperumbudur, and Hosur industrial clusters: 20 outbound/inbound leads → 8 3-SKU Teaser Walkthroughs → 5 Paid ₹14,999 Full Audits.',
      taskType: 'GOAL_DECOMPOSITION',
      status: 'COMPLETED',
      requiresFounderApproval: false,
      computeCostInr: 0,
      amountInr: 74995,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      taskId: 'TASK-20261109-A02',
      goalId: 'GOAL-20261109-INIT',
      agentId: 'AGENT_02_SDR_OUTREACH',
      agentCode: 'AGENT_02',
      agentName: 'Agent 02 — B2B SDR & Outreach Agent',
      title: 'Approve 15-Min SDR Outreach & Step-2 Upload Link — Ambattur Fabrication Sample Plant',
      description:
        'Prepared personalized WhatsApp + Email outreach script with 5-Column CSV Template and Step-2 Upload Portal token. Held at founder approval gate before external dispatch.',
      taskType: 'SDR_OUTREACH_DRAFT',
      status: 'AWAITING_FOUNDER_APPROVAL',
      requiresFounderApproval: true,
      computeCostInr: 0,
      linkedLeadId: 'PILOT-DEMO-SANDBOX',
      linkedWorkspaceId: 'AUDIT-DEMO-P1P4',
      draftPayload: buildStep2SuitabilityReplyTemplate({
        leadId: 'PILOT-DEMO-SANDBOX',
        fullName: 'Plant Managing Director',
        companyName: 'Ambattur Fabrication Sample Plant',
        plantLocation: 'Ambattur Industrial Estate, Chennai',
        erpSystem: 'Tally Prime',
      }),
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      taskId: 'TASK-20261109-A03',
      goalId: 'GOAL-20261109-INIT',
      agentId: 'AGENT_03_ERP_INGESTION',
      agentCode: 'AGENT_03',
      agentName: 'Agent 03 — ERP Ingestion & Quarantine Agent',
      title: 'Sanitized 65 Multi-Pillar ERP Records (IMPRUN-20261012-DEMO)',
      description:
        'Validated 20 P1 SKUs, 18 P2 Dispatches, 12 P3 Trips, and 15 P4 Bins with 0 formula-injection risks and stamped SHA-256 digest.',
      taskType: 'ERP_QUARANTINE_INGESTION',
      status: 'COMPLETED',
      requiresFounderApproval: false,
      computeCostInr: 0,
      linkedWorkspaceId: 'AUDIT-DEMO-P1P4',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      taskId: 'TASK-20261109-A04',
      goalId: 'GOAL-20261109-INIT',
      agentId: 'AGENT_04_AUDIT_ANALYST',
      agentCode: 'AGENT_04',
      agentName: 'Agent 04 — 4-Pillar Audit Analyst Agent',
      title: 'Quantified ₹2,23,110 Dead Stock & ₹1,75,257 Target Cash Release (AUDIT-DEMO-P1P4)',
      description:
        'Isolated Top 3 Dormant SKUs for Free Executive Teaser and locked remaining 17 SKUs + 6-Sheet .XLSX Action Workbook behind ₹14,999 Direct UPI/NEFT Paywall.',
      taskType: 'FOUR_PILLAR_QUANTIFICATION',
      status: 'COMPLETED',
      requiresFounderApproval: false,
      computeCostInr: 0,
      linkedWorkspaceId: 'AUDIT-DEMO-P1P4',
      amountInr: 14999,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      taskId: 'TASK-20261109-A05',
      goalId: 'GOAL-20261109-INIT',
      agentId: 'AGENT_05_COMMERCIAL_CLOSER',
      agentCode: 'AGENT_05',
      agentName: 'Agent 05 — Commercial Closer & Bank Billing Agent',
      title: 'Issued Proforma Invoice INV-20261012-P1P4 (₹14,999) with 0%-Fee UPI Deep-Link',
      description:
        'Generated official B2B Proforma Invoice for Tier 2 Full 4-Pillar Audit (₹14,999) payable via UPI (9080540047@yespop) or NEFT/IMPS with 12-digit UTR verification.',
      taskType: 'PROFORMA_INVOICE_GENERATION',
      status: 'COMPLETED',
      requiresFounderApproval: false,
      computeCostInr: 0,
      linkedWorkspaceId: 'AUDIT-DEMO-P1P4',
      linkedInvoiceId: 'INV-20261012-P1P4',
      amountInr: 14999,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  return {
    activeGoal: {
      goalId: 'GOAL-20261109-INIT',
      goalText: defaultGoalText,
      targetRevenueInr: 74995,
      targetPaidAuditsCount: 5,
      unitAuditPriceInr: 14999,
      apiTokenBudgetCapInr: 0,
      computeCostSpentInr: 0,
      createdAt: nowIso,
      subTaskIds: seedTasks.map((t) => t.taskId),
    },
    agents: CANONICAL_FIVE_AGENTS.map((a) => ({ ...a })),
    tasks: seedTasks,
    budgetGuardrail: {
      mode: 'DETERMINISTIC_ZERO_COST',
      apiTokenBudgetCapInr: 0,
      computeCostSpentInr: 0,
      externalLlmCallsPermitted: false,
    },
    updatedAt: nowIso,
  };
}

function parseTargetRevenueFromGoalText(goalText: string, explicitTarget?: number): number {
  if (typeof explicitTarget === 'number' && Number.isFinite(explicitTarget) && explicitTarget > 0) {
    return Math.round(explicitTarget);
  }
  const rupeeMatch = goalText.match(/₹\s*([\d,]+)/);
  if (rupeeMatch && rupeeMatch[1]) {
    const parsed = Number(rupeeMatch[1].replace(/,/g, ''));
    if (Number.isFinite(parsed) && parsed > 0) return Math.round(parsed);
  }
  const countMatch = goalText.match(/\b(\d+)\s+(?:paid\s+)?(?:plant\s+)?audits?\b/i);
  if (countMatch && countMatch[1]) {
    const count = Number(countMatch[1]);
    if (Number.isFinite(count) && count > 0) return count * 14999;
  }
  return 74995;
}

export function buildDecomposedGoalTasks(
  goalText: string,
  targetRevenueInr?: number,
  now: Date = new Date()
): { goal: FounderRevenueGoalRecord; tasks: AgentWorkforceTask[] } {
  const cleanGoalText =
    (typeof goalText === 'string' && goalText.trim()) ||
    'Close 5 Paid Plant Audits in Chennai This Month — ₹74,995 Target';
  const resolvedRevenue = parseTargetRevenueFromGoalText(cleanGoalText, targetRevenueInr);
  const unitPrice = DEFAULT_FOUNDER_BILLING_CONFIG.tier2FullAuditPriceInr;
  const targetAuditsCount = Math.max(1, Math.ceil(resolvedRevenue / unitPrice));
  const targetTeasersCount = Math.max(targetAuditsCount + 2, Math.ceil(targetAuditsCount * 1.6));
  const targetLeadsCount = targetTeasersCount * 2;

  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.floor(1000 + Math.random() * 9000)
    .toString(16)
    .toUpperCase()
    .slice(0, 4);
  const goalId = `GOAL-${dateStr}-${suffix}`;
  const nowIso = now.toISOString();

  const tasks: AgentWorkforceTask[] = [
    {
      taskId: `TASK-${dateStr}-${suffix}-01`,
      goalId,
      agentId: 'AGENT_01_CEO_ORCHESTRATOR',
      agentCode: 'AGENT_01',
      agentName: 'Agent 01 — CEO Orchestrator',
      title: `CEO Goal Decomposition: ₹${resolvedRevenue.toLocaleString('en-IN')} Target (${targetAuditsCount} Paid Audits @ ₹${unitPrice.toLocaleString('en-IN')})`,
      description: `Decomposed founder directive "${cleanGoalText}" into a deterministic 5-agent quota: ${targetLeadsCount} qualified factory leads → ${targetTeasersCount} 3-SKU Teaser Walkthroughs → ${targetAuditsCount} Direct Bank/UPI closures (₹0.00 API token spend).`,
      taskType: 'GOAL_DECOMPOSITION',
      status: 'COMPLETED',
      requiresFounderApproval: false,
      computeCostInr: 0,
      amountInr: resolvedRevenue,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      taskId: `TASK-${dateStr}-${suffix}-02`,
      goalId,
      agentId: 'AGENT_02_SDR_OUTREACH',
      agentCode: 'AGENT_02',
      agentName: 'Agent 02 — B2B SDR & Outreach Agent',
      title: `Prepare 15-Min Outreach & Step-2 Upload Kits for ${targetLeadsCount} Target Plants`,
      description: `Queued personalized 5-column CSV data request templates and WhatsApp follow-up scripts for ${targetLeadsCount} discrete manufacturers. Held for 1-click founder approval.`,
      taskType: 'SDR_OUTREACH_DRAFT',
      status: 'AWAITING_FOUNDER_APPROVAL',
      requiresFounderApproval: true,
      computeCostInr: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      taskId: `TASK-${dateStr}-${suffix}-03`,
      goalId,
      agentId: 'AGENT_03_ERP_INGESTION',
      agentCode: 'AGENT_03',
      agentName: 'Agent 03 — ERP Ingestion & Quarantine Agent',
      title: `Enforce 5-Column ERP Quarantine & SHA-256 Integrity Across ${targetTeasersCount} Plant Uploads`,
      description: `Configured automated schema mapper for Tally Prime / SAP / Excel exports with formula-injection sanitization and Item 01 Data-Quality Ledger generation.`,
      taskType: 'ERP_QUARANTINE_INGESTION',
      status: 'COMPLETED',
      requiresFounderApproval: false,
      computeCostInr: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      taskId: `TASK-${dateStr}-${suffix}-04`,
      goalId,
      agentId: 'AGENT_04_AUDIT_ANALYST',
      agentCode: 'AGENT_04',
      agentName: 'Agent 04 — 4-Pillar Audit Analyst Agent',
      title: `Generate ${targetTeasersCount} Teaser-Locked Walkthroughs (Top 3 Dormant SKUs + Blurred Rows #4–#20)`,
      description: `Configured P1–P4 deterministic audit engine to expose headline KPIs and Top 3 Dead SKUs while locking full 20-SKU schedule & 6-Sheet .XLSX workbook behind the ₹${unitPrice.toLocaleString('en-IN')} paywall.`,
      taskType: 'FOUR_PILLAR_QUANTIFICATION',
      status: 'COMPLETED',
      requiresFounderApproval: false,
      computeCostInr: 0,
      amountInr: unitPrice,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      taskId: `TASK-${dateStr}-${suffix}-05`,
      goalId,
      agentId: 'AGENT_05_COMMERCIAL_CLOSER',
      agentCode: 'AGENT_05',
      agentName: 'Agent 05 — Commercial Closer & Bank Billing Agent',
      title: `Collect ${targetAuditsCount} × ₹${unitPrice.toLocaleString('en-IN')} via 0%-Fee UPI / NEFT Proforma Invoices`,
      description: `Armed Proforma Invoice generator (INV-...) and 12-digit UTR verification queue to collect ₹${resolvedRevenue.toLocaleString('en-IN')} directly into founder bank account.`,
      taskType: 'PROFORMA_INVOICE_GENERATION',
      status: 'COMPLETED',
      requiresFounderApproval: false,
      computeCostInr: 0,
      amountInr: resolvedRevenue,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const goal: FounderRevenueGoalRecord = {
    goalId,
    goalText: cleanGoalText,
    targetRevenueInr: resolvedRevenue,
    targetPaidAuditsCount: targetAuditsCount,
    unitAuditPriceInr: unitPrice,
    apiTokenBudgetCapInr: 0,
    computeCostSpentInr: 0,
    createdAt: nowIso,
    subTaskIds: tasks.map((t) => t.taskId),
  };

  return { goal, tasks };
}

function normalizeWorkforceState(raw?: Partial<AgentWorkforceState> | null): AgentWorkforceState {
  const fallback = buildInitialSeedState();
  if (!raw || typeof raw !== 'object') return fallback;

  const tasks: AgentWorkforceTask[] = Array.isArray(raw.tasks)
    ? raw.tasks.map((t) => ({
        ...t,
        description:
          typeof t.description === 'string'
            ? t.description.replace(/cjonessnowin@okaxis/gi, '9080540047@yespop')
            : t.description,
        draftPayload:
          typeof t.draftPayload === 'string'
            ? t.draftPayload.replace(/cjonessnowin@okaxis/gi, '9080540047@yespop')
            : t.draftPayload,
        computeCostInr: 0,
      }))
    : fallback.tasks;

  const agents: AutonomousAgentProfile[] = CANONICAL_FIVE_AGENTS.map((canonical) => {
    const existing = Array.isArray(raw.agents)
      ? raw.agents.find((a) => a.agentId === canonical.agentId)
      : undefined;
    const pendingForAgent = tasks.some(
      (t) => t.agentId === canonical.agentId && t.status === 'AWAITING_FOUNDER_APPROVAL'
    );
    const latestAgentTask = tasks.find((t) => t.agentId === canonical.agentId);

    return {
      ...canonical,
      ...(existing ? { completedTasksCount: existing.completedTasksCount } : {}),
      status: pendingForAgent ? 'AWAITING_FOUNDER_APPROVAL' : 'ACTIVE',
      activeTaskTitle: latestAgentTask ? latestAgentTask.title : canonical.activeTaskTitle,
      apiTokenBudgetCapInr: 0,
      computeCostSpentInr: 0,
    };
  });

  return {
    activeGoal:
      raw.activeGoal && typeof raw.activeGoal === 'object'
        ? {
            ...raw.activeGoal,
            apiTokenBudgetCapInr: 0,
            computeCostSpentInr: 0,
          }
        : fallback.activeGoal,
    agents,
    tasks,
    budgetGuardrail: {
      mode: 'DETERMINISTIC_ZERO_COST',
      apiTokenBudgetCapInr: 0,
      computeCostSpentInr: 0,
      externalLlmCallsPermitted: false,
    },
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : fallback.updatedAt,
  };
}

export function readAgentWorkforceStateFromBrowser(): AgentWorkforceState {
  if (!isBrowserEnv) return buildInitialSeedState();
  try {
    const raw = window.localStorage.getItem(BROWSER_AGENT_WORKFORCE_STORAGE_KEY);
    if (!raw) return buildInitialSeedState();
    return normalizeWorkforceState(JSON.parse(raw));
  } catch {
    return buildInitialSeedState();
  }
}

export function saveAgentWorkforceStateToBrowser(
  state: AgentWorkforceState
): AgentWorkforceState {
  const normalized = normalizeWorkforceState(state);
  if (isBrowserEnv) {
    try {
      window.localStorage.setItem(
        BROWSER_AGENT_WORKFORCE_STORAGE_KEY,
        JSON.stringify(normalized)
      );
    } catch {}
  }
  return normalized;
}

const writeLocks = new Map<string, Promise<unknown>>();

function withSerializedLock<T>(filePath: string, task: () => Promise<T>): Promise<T> {
  const prev = writeLocks.get(filePath) ?? Promise.resolve();
  const next = prev.then(task, task);
  writeLocks.set(
    filePath,
    next.catch(() => {})
  );
  return next;
}

async function readStateNode(filePath: string): Promise<AgentWorkforceState> {
  if (isBrowserEnv) {
    return readAgentWorkforceStateFromBrowser();
  }
  try {
    const fsMod = 'fs/promises';
    const pathMod = 'path';
    const fs = await import(/* @vite-ignore */ fsMod);
    const path = await import(/* @vite-ignore */ pathMod);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      return normalizeWorkforceState(JSON.parse(raw));
    } catch {
      const initial = buildInitialSeedState();
      await fs.writeFile(filePath, JSON.stringify(initial, null, 2) + '\n', 'utf8');
      return initial;
    }
  } catch {
    return buildInitialSeedState();
  }
}

async function writeStateNode(
  filePath: string,
  state: AgentWorkforceState
): Promise<AgentWorkforceState> {
  const normalized = normalizeWorkforceState({
    ...state,
    updatedAt: new Date().toISOString(),
  });
  if (isBrowserEnv) {
    return saveAgentWorkforceStateToBrowser(normalized);
  }
  const fsMod = 'fs/promises';
  const pathMod = 'path';
  const fs = await import(/* @vite-ignore */ fsMod);
  const path = await import(/* @vite-ignore */ pathMod);
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
  await fs.writeFile(tempPath, JSON.stringify(normalized, null, 2) + '\n', 'utf8');
  await fs.rename(tempPath, filePath);
  return normalized;
}

export async function getAgentWorkforceState(
  filePath: string = DEFAULT_AGENT_WORKFORCE_FILE_PATH
): Promise<AgentWorkforceState> {
  return withSerializedLock(filePath, async () => {
    return readStateNode(filePath);
  });
}

/**
 * Paperclip CEO Goal Decomposition Engine:
 * Decomposes a founder revenue goal into 5 concrete agent tasks across Agents 01–05
 * while enforcing a strict ₹0.00 token/compute budget guardrail.
 */
export async function decomposeFounderRevenueGoal(
  goalText: string,
  targetRevenueInr?: number,
  filePath: string = DEFAULT_AGENT_WORKFORCE_FILE_PATH
): Promise<{
  ok: true;
  goal: FounderRevenueGoalRecord;
  tasksCreated: AgentWorkforceTask[];
  state: AgentWorkforceState;
}> {
  return withSerializedLock(filePath, async () => {
    const current = await readStateNode(filePath);
    const { goal, tasks } = buildDecomposedGoalTasks(goalText, targetRevenueInr);
    const updatedAgents = current.agents.map((ag) => ({
      ...ag,
      completedTasksCount:
        ag.agentId === 'AGENT_01_CEO_ORCHESTRATOR'
          ? ag.completedTasksCount + 1
          : ag.completedTasksCount,
      apiTokenBudgetCapInr: 0 as const,
      computeCostSpentInr: 0 as const,
    }));

    const nextState = await writeStateNode(filePath, {
      ...current,
      activeGoal: goal,
      agents: updatedAgents,
      tasks: [...tasks, ...current.tasks].slice(0, 100),
    });

    return {
      ok: true,
      goal,
      tasksCreated: tasks,
      state: nextState,
    };
  });
}

/**
 * Triggered when a new B2B lead is captured on POST /api/pilot-requests.
 */
export async function triggerLeadArrivalAgentPipeline(
  lead: Partial<PilotRequestRecord> & {
    leadId: string;
    companyName: string;
    plantLocation: string;
    fullName?: string;
    erpSystem?: string;
  },
  filePath: string = DEFAULT_AGENT_WORKFORCE_FILE_PATH
): Promise<AgentWorkforceTask[]> {
  return withSerializedLock(filePath, async () => {
    const current = await readStateNode(filePath);
    const now = new Date();
    const nowIso = now.toISOString();
    const suffix = lead.leadId.slice(-4).toUpperCase();

    const sdrDraft = buildStep2SuitabilityReplyTemplate({
      leadId: lead.leadId,
      fullName: lead.fullName || 'Operations Director',
      companyName: lead.companyName,
      plantLocation: lead.plantLocation,
      erpSystem: lead.erpSystem || 'Tally Prime / SAP',
    });

    const newTasks: AgentWorkforceTask[] = [
      {
        taskId: `TASK-SDR-${suffix}-${Date.now().toString(36).slice(-3).toUpperCase()}`,
        goalId: current.activeGoal.goalId,
        agentId: 'AGENT_02_SDR_OUTREACH',
        agentCode: 'AGENT_02',
        agentName: 'Agent 02 — B2B SDR & Outreach Agent',
        title: `Approve 15-Min Outreach & Step-2 Upload Link — ${lead.companyName} (${lead.plantLocation})`,
        description: `Drafted personalized 15-minute suitability response and Step-2 Upload Token for ${lead.fullName || 'Plant Head'} at ${lead.companyName} (${lead.erpSystem || 'ERP'}). Held at founder approval gate.`,
        taskType: 'SDR_OUTREACH_DRAFT',
        status: 'AWAITING_FOUNDER_APPROVAL',
        requiresFounderApproval: true,
        computeCostInr: 0,
        linkedLeadId: lead.leadId,
        draftPayload: sdrDraft,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ];

    await writeStateNode(filePath, {
      ...current,
      tasks: [...newTasks, ...current.tasks].slice(0, 100),
    });

    return newTasks;
  });
}

/**
 * Triggered when a client uploads 5-column ERP data via POST /api/pilot-upload/:leadId/ingest.
 */
export async function triggerIngestionAgentPipeline(
  leadId: string,
  importRun: {
    importRunId: string;
    totalSubmitted?: number;
    validAccepted?: number;
    quarantinedRejected?: number;
    datasetSha256?: string;
  },
  snapshot: PilotWorkspaceSnapshot,
  filePath: string = DEFAULT_AGENT_WORKFORCE_FILE_PATH
): Promise<AgentWorkforceTask[]> {
  return withSerializedLock(filePath, async () => {
    const current = await readStateNode(filePath);
    const nowIso = new Date().toISOString();
    const suffix = snapshot.workspaceId.slice(-4).toUpperCase();
    const invoice = generateProformaInvoice(
      snapshot,
      undefined,
      DEFAULT_FOUNDER_BILLING_CONFIG,
      'TIER2_FULL_AUDIT'
    );

    const newTasks: AgentWorkforceTask[] = [
      {
        taskId: `TASK-CLOSER-${suffix}-${Date.now().toString(36).slice(-3).toUpperCase()}`,
        goalId: current.activeGoal.goalId,
        agentId: 'AGENT_05_COMMERCIAL_CLOSER',
        agentCode: 'AGENT_05',
        agentName: 'Agent 05 — Commercial Closer & Bank Billing Agent',
        title: `Issued Proforma Invoice ${invoice.invoiceId} (₹${invoice.amountInr.toLocaleString('en-IN')}) — ${snapshot.companyName}`,
        description: `Generated 0%-fee UPI deep-link (${DEFAULT_FOUNDER_BILLING_CONFIG.upiId}) and NEFT/IMPS instructions for ${snapshot.companyName} (${snapshot.workspaceId}). Ready for client UTR submission.`,
        taskType: 'PROFORMA_INVOICE_GENERATION',
        status: 'COMPLETED',
        requiresFounderApproval: false,
        computeCostInr: 0,
        linkedLeadId: leadId,
        linkedWorkspaceId: snapshot.workspaceId,
        linkedInvoiceId: invoice.invoiceId,
        amountInr: invoice.amountInr,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        taskId: `TASK-AUDIT-${suffix}-${Date.now().toString(36).slice(-3).toUpperCase()}`,
        goalId: current.activeGoal.goalId,
        agentId: 'AGENT_04_AUDIT_ANALYST',
        agentCode: 'AGENT_04',
        agentName: 'Agent 04 — 4-Pillar Audit Analyst Agent',
        title: `Quantified ₹${snapshot.summaryMetrics.deadStockValue.toLocaleString('en-IN')} Dead Stock (${snapshot.summaryMetrics.totalSkus} SKUs) — ${snapshot.companyName}`,
        description: `Completed deterministic P1–P4 evaluation for ${snapshot.companyName}. Target working-capital release: ₹${snapshot.summaryMetrics.targetCashRelease.toLocaleString('en-IN')}.`,
        taskType: 'FOUR_PILLAR_QUANTIFICATION',
        status: 'COMPLETED',
        requiresFounderApproval: false,
        computeCostInr: 0,
        linkedLeadId: leadId,
        linkedWorkspaceId: snapshot.workspaceId,
        amountInr: snapshot.summaryMetrics.deadStockValue,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        taskId: `TASK-INGEST-${suffix}-${Date.now().toString(36).slice(-3).toUpperCase()}`,
        goalId: current.activeGoal.goalId,
        agentId: 'AGENT_03_ERP_INGESTION',
        agentCode: 'AGENT_03',
        agentName: 'Agent 03 — ERP Ingestion & Quarantine Agent',
        title: `Sanitized ImportRun ${importRun.importRunId} (${importRun.validAccepted ?? snapshot.summaryMetrics.totalSkus} Valid / ${importRun.quarantinedRejected ?? 0} Quarantined)`,
        description: `Verified 5-column ERP upload for ${snapshot.companyName} and stamped SHA-256 integrity hash.`,
        taskType: 'ERP_QUARANTINE_INGESTION',
        status: 'COMPLETED',
        requiresFounderApproval: false,
        computeCostInr: 0,
        linkedLeadId: leadId,
        linkedWorkspaceId: snapshot.workspaceId,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ];

    await writeStateNode(filePath, {
      ...current,
      tasks: [...newTasks, ...current.tasks].slice(0, 100),
    });

    return newTasks;
  });
}

/**
 * Triggered when a client submits a 12-digit UTR / Bank Reference number on ?view=pilot-findings.
 */
export async function queueAgentUtrVerificationTask(
  snapshot: PilotWorkspaceSnapshot,
  utrNumber: string,
  paidByEmail?: string,
  tier: 'TIER2_FULL_AUDIT' | 'TIER3_MONTHLY_RETAINER' = 'TIER2_FULL_AUDIT',
  filePath: string = DEFAULT_AGENT_WORKFORCE_FILE_PATH
): Promise<AgentWorkforceTask> {
  return withSerializedLock(filePath, async () => {
    const current = await readStateNode(filePath);
    const nowIso = new Date().toISOString();
    const amountInr = tier === 'TIER3_MONTHLY_RETAINER' ? 24999 : 14999;
    const suffix = snapshot.workspaceId.slice(-4).toUpperCase();

    const utrTask: AgentWorkforceTask = {
      taskId: `TASK-UTR-${suffix}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
      goalId: current.activeGoal.goalId,
      agentId: 'AGENT_05_COMMERCIAL_CLOSER',
      agentCode: 'AGENT_05',
      agentName: 'Agent 05 — Commercial Closer & Bank Billing Agent',
      title: `Confirm ₹${amountInr.toLocaleString('en-IN')} Bank Credit (UTR: ${utrNumber}) — ${snapshot.companyName}`,
      description: `Client submitted 12-digit UTR / Bank Ref ${utrNumber}${paidByEmail ? ` (${paidByEmail})` : ''} for Workspace ${snapshot.workspaceId} (${snapshot.invoiceId || 'INV-AUDIT'}). Verify bank/UPI credit to unlock all 20 SKUs & 6-Sheet .XLSX Action Workbook.`,
      taskType: 'UTR_PAYMENT_VERIFICATION',
      status: 'AWAITING_FOUNDER_APPROVAL',
      requiresFounderApproval: true,
      computeCostInr: 0,
      linkedWorkspaceId: snapshot.workspaceId,
      linkedLeadId: snapshot.leadId,
      linkedInvoiceId: snapshot.invoiceId,
      submittedUtrNumber: utrNumber,
      ...(paidByEmail ? { paidByEmail } : {}),
      amountInr,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await writeStateNode(filePath, {
      ...current,
      tasks: [utrTask, ...current.tasks].slice(0, 100),
    });

    return utrTask;
  });
}

/**
 * Founder 1-click approval or rejection of a queued agent task.
 */
export async function decideAgentWorkforceTask(
  taskId: string,
  decision: 'APPROVE' | 'REJECT',
  notes?: string,
  filePath: string = DEFAULT_AGENT_WORKFORCE_FILE_PATH
): Promise<
  | { ok: true; task: AgentWorkforceTask; state: AgentWorkforceState }
  | { ok: false; error: string }
> {
  return withSerializedLock(filePath, async () => {
    const current = await readStateNode(filePath);
    const idx = current.tasks.findIndex((t) => t.taskId === taskId);
    if (idx === -1) {
      return { ok: false, error: `Agent task '${taskId}' not found.` };
    }

    const target = current.tasks[idx];
    const nowIso = new Date().toISOString();
    const updatedTask: AgentWorkforceTask = {
      ...target,
      status: decision === 'APPROVE' ? 'COMPLETED' : 'REJECTED',
      updatedAt: nowIso,
      decidedAt: nowIso,
      ...(notes ? { decisionNotes: notes.trim() } : {}),
      computeCostInr: 0,
    };

    const nextTasks = [...current.tasks];
    nextTasks[idx] = updatedTask;

    const nextAgents = current.agents.map((ag) =>
      ag.agentId === target.agentId && decision === 'APPROVE'
        ? { ...ag, completedTasksCount: ag.completedTasksCount + 1 }
        : ag
    );

    const nextState = await writeStateNode(filePath, {
      ...current,
      agents: nextAgents,
      tasks: nextTasks,
    });

    return { ok: true, task: updatedTask, state: nextState };
  });
}
