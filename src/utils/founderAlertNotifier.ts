/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getFounderBillingConfig,
  LIVE_FOUNDER_UPI_ID,
} from './founderBillingStore.ts';

export type FounderAlertEventType =
  | 'NEW_PILOT_LEAD'
  | 'CLIENT_FILE_UPLOADED'
  | 'UTR_PAYMENT_SUBMITTED'
  | 'TEST_PAYMENT_ALERT';

export type AlertDeliveryChannelStatus =
  | 'SENT'
  | 'SKIPPED_NOT_CONFIGURED'
  | 'FAILED';

export interface FounderAlertPayload {
  eventType: FounderAlertEventType;
  title?: string;
  companyName: string;
  plantLocation?: string;
  contactName?: string;
  workEmail?: string;
  phoneOrWhatsapp?: string;
  contactEmailOrPhone?: string;
  erpSystem?: string;
  approxSkuCount?: string;
  leadId?: string;
  workspaceId?: string;
  shareToken?: string;
  invoiceId?: string;
  utrNumber?: string;
  amountInr?: number;
  upiId?: string;
  tier?: string;
  skuCount?: number;
  deadStockValueInr?: number;
  quarantinedRowsCount?: number;
  actionUrl?: string;
  notes?: string;
}

export interface FounderAlertDeliveryLog {
  alertId: string;
  timestamp: string;
  eventType: FounderAlertEventType;
  title: string;
  summary: string;
  companyName: string;
  leadId?: string;
  workspaceId?: string;
  utrNumber?: string;
  amountInr?: number;
  upiId: string;
  actionUrl: string;
  recipientEmail: string;
  webhookConfigured: boolean;
  emailStatus: AlertDeliveryChannelStatus;
  webhookStatus: AlertDeliveryChannelStatus;
  overallStatus: AlertDeliveryChannelStatus;
  errorDetails?: string;
}

export const BROWSER_FOUNDER_ALERT_LOGS_KEY = 'operationalyst_founder_alert_logs_v1';

const isBrowserEnv =
  typeof window !== 'undefined' && typeof window.document !== 'undefined';

export const DEFAULT_FOUNDER_ALERT_LOGS_FILE_PATH =
  !isBrowserEnv && typeof process !== 'undefined' && typeof process.cwd === 'function'
    ? `${process.cwd()}/data/founder_alert_logs.json`
    : './data/founder_alert_logs.json';

const MAX_ALERT_LOGS = 20;

function getEnvString(key: string): string {
  if (
    !isBrowserEnv &&
    typeof process !== 'undefined' &&
    process.env &&
    typeof process.env[key] === 'string'
  ) {
    return process.env[key]!.trim();
  }
  return '';
}

export function readFounderAlertLogsFromBrowser(): FounderAlertDeliveryLog[] {
  if (!isBrowserEnv) return [];
  try {
    const raw = window.localStorage.getItem(BROWSER_FOUNDER_ALERT_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FounderAlertDeliveryLog[]).slice(0, MAX_ALERT_LOGS) : [];
  } catch {
    return [];
  }
}

export function saveFounderAlertLogsToBrowser(
  logs: FounderAlertDeliveryLog[]
): FounderAlertDeliveryLog[] {
  const trimmed = logs.slice(0, MAX_ALERT_LOGS);
  if (isBrowserEnv) {
    try {
      window.localStorage.setItem(BROWSER_FOUNDER_ALERT_LOGS_KEY, JSON.stringify(trimmed));
    } catch {}
  }
  return trimmed;
}

interface AlertLogFileSchema {
  version: 1;
  logs: FounderAlertDeliveryLog[];
}

async function readAlertLogsNode(
  filePath: string = DEFAULT_FOUNDER_ALERT_LOGS_FILE_PATH
): Promise<FounderAlertDeliveryLog[]> {
  if (isBrowserEnv) {
    return readFounderAlertLogsFromBrowser();
  }

  const fs = await import('fs/promises');
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AlertLogFileSchema> | FounderAlertDeliveryLog[];
    if (Array.isArray(parsed)) {
      return parsed.slice(0, MAX_ALERT_LOGS);
    }
    if (parsed && Array.isArray(parsed.logs)) {
      return parsed.logs.slice(0, MAX_ALERT_LOGS);
    }
    return [];
  } catch {
    return [];
  }
}

async function writeAlertLogsNode(
  logs: FounderAlertDeliveryLog[],
  filePath: string = DEFAULT_FOUNDER_ALERT_LOGS_FILE_PATH
): Promise<void> {
  const trimmed = logs.slice(0, MAX_ALERT_LOGS);
  if (isBrowserEnv) {
    saveFounderAlertLogsToBrowser(trimmed);
    return;
  }

  const fs = await import('fs/promises');
  const path = await import('path');
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const payload: AlertLogFileSchema = {
    version: 1,
    logs: trimmed,
  };
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(payload, null, 2), 'utf-8');
  await fs.rename(tempPath, filePath);
}

export async function listFounderAlertLogs(
  filePath: string = DEFAULT_FOUNDER_ALERT_LOGS_FILE_PATH
): Promise<FounderAlertDeliveryLog[]> {
  return readAlertLogsNode(filePath);
}

export async function clearFounderAlertLogs(
  filePath: string = DEFAULT_FOUNDER_ALERT_LOGS_FILE_PATH
): Promise<void> {
  await writeAlertLogsNode([], filePath);
}

function buildAlertTitleAndSummary(
  event: FounderAlertPayload,
  upiId: string
): { title: string; summary: string; htmlBody: string; actionUrl: string } {
  const appBaseUrl = getEnvString('APP_URL').replace(/\/+$/, '');
  const amountFormatted = `₹${(event.amountInr ?? 14999).toLocaleString('en-IN')}`;

  if (event.eventType === 'UTR_PAYMENT_SUBMITTED' || event.eventType === 'TEST_PAYMENT_ALERT') {
    const actionUrl =
      event.actionUrl ||
      (appBaseUrl && /^https?:\/\//i.test(appBaseUrl)
        ? `${appBaseUrl}/?view=agent-workforce`
        : '?view=agent-workforce');
    const title =
      event.title ||
      `[${event.eventType === 'TEST_PAYMENT_ALERT' ? 'TEST ' : ''}URGENT UTR PAYMENT ALERT] ${amountFormatted} Submitted — ${event.companyName}`;
    const summary = `UTR ${event.utrNumber || '431298765432'} submitted for ${
      event.workspaceId || 'AUDIT-DEMO-P1P4'
    } (${amountFormatted} · ${event.tier || 'TIER2_FULL_AUDIT'} · Invoice ${
      event.invoiceId || 'INV-20261109'
    } to Receiver UPI ${upiId}). Open ${actionUrl} to verify bank credit and unlock in 1 click.`;
    const htmlBody = `
      <div style="font-family: monospace, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; border-radius: 12px;">
        <h2 style="color: #34d399; margin-top: 0;">${title}</h2>
        <p>${summary}</p>
        <ul style="line-height: 1.7;">
          <li><strong>Company:</strong> ${event.companyName} (${event.plantLocation || 'India'})</li>
          <li><strong>Workspace ID:</strong> ${event.workspaceId || 'AUDIT-DEMO-P1P4'}</li>
          <li><strong>Invoice ID:</strong> ${event.invoiceId || 'INV-20261109'}</li>
          <li><strong>Submitted 12-Digit UTR / Bank Ref:</strong> ${event.utrNumber || '431298765432'}</li>
          <li><strong>Tier &amp; Amount:</strong> ${amountFormatted} (${event.tier || 'TIER2_FULL_AUDIT'})</li>
          <li><strong>Receiver UPI ID:</strong> ${upiId}</li>
          <li><strong>Client Contact:</strong> ${event.contactEmailOrPhone || event.workEmail || 'Not provided'}</li>
          <li><strong>1-Click Unlock Link:</strong> <a href="${actionUrl}" style="color: #34d399;">${actionUrl}</a></li>
        </ul>
      </div>
    `;
    return { title, summary, htmlBody, actionUrl };
  }

  if (event.eventType === 'CLIENT_FILE_UPLOADED') {
    const findingsQuery = `?view=pilot-findings&id=${encodeURIComponent(
      event.workspaceId || 'AUDIT-DEMO-P1P4'
    )}${event.shareToken ? `&token=${encodeURIComponent(event.shareToken)}` : ''}`;
    const actionUrl =
      event.actionUrl ||
      (appBaseUrl && /^https?:\/\//i.test(appBaseUrl)
        ? `${appBaseUrl}/${findingsQuery}`
        : findingsQuery);
    const title =
      event.title ||
      `[STEP-2 ERP FILE INGESTED] ${event.companyName} (${event.skuCount ?? 20} SKUs)`;
    const deadFormatted =
      typeof event.deadStockValueInr === 'number'
        ? `₹${event.deadStockValueInr.toLocaleString('en-IN')}`
        : 'Computed';
    const quarantinedCount = event.quarantinedRowsCount ?? 0;
    const summary = `Step-2 ERP export ingested for ${event.companyName} (Lead ${
      event.leadId || 'PILOT'
    } → Snapshot ${event.workspaceId || 'AUDIT'}). Row Count: ${
      event.skuCount ?? 20
    }, Non-Moving (>180d) Exposure: ${deadFormatted}, Quarantined Rows: ${quarantinedCount}. View snapshot: ${actionUrl}`;
    const htmlBody = `
      <div style="font-family: monospace, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; border-radius: 12px;">
        <h2 style="color: #38bdf8; margin-top: 0;">${title}</h2>
        <p>${summary}</p>
        <ul style="line-height: 1.7;">
          <li><strong>Company:</strong> ${event.companyName} (${event.plantLocation || 'India'})</li>
          <li><strong>Lead ID:</strong> ${event.leadId || 'N/A'}</li>
          <li><strong>Walkthrough Snapshot:</strong> ${event.workspaceId || 'N/A'}</li>
          <li><strong>Evaluated Row Count:</strong> ${event.skuCount ?? 0} SKUs</li>
          <li><strong>Non-Moving (&gt;180d) Exposure:</strong> ${deadFormatted}</li>
          <li><strong>Quarantined Rows:</strong> ${quarantinedCount}</li>
          <li><strong>Direct Walkthrough Link:</strong> <a href="${actionUrl}" style="color: #38bdf8;">${actionUrl}</a></li>
        </ul>
      </div>
    `;
    return { title, summary, htmlBody, actionUrl };
  }

  const actionUrl =
    event.actionUrl ||
    (appBaseUrl && /^https?:\/\//i.test(appBaseUrl)
      ? `${appBaseUrl}/?view=lead-inbox`
      : '?view=lead-inbox');
  const title =
    event.title ||
    `[NEW 48-HR PILOT LEAD] ${event.companyName} (${event.leadId || 'PILOT-NEW'})`;
  const summary = `New Pilot Audit request from ${event.contactName || 'Plant Lead'} at ${
    event.companyName
  } (Email: ${event.workEmail || event.contactEmailOrPhone || 'N/A'}, Phone: ${
    event.phoneOrWhatsapp || 'N/A'
  }, ERP: ${event.erpSystem || 'Tally/SAP/Excel'}, SKUs: ${
    event.approxSkuCount || 'Standard'
  }). Review in Lead Inbox: ${actionUrl}`;
  const htmlBody = `
    <div style="font-family: monospace, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; border-radius: 12px;">
      <h2 style="color: #fbbf24; margin-top: 0;">${title}</h2>
      <p>${summary}</p>
      <ul style="line-height: 1.7;">
        <li><strong>Lead ID:</strong> ${event.leadId || 'N/A'}</li>
        <li><strong>Company:</strong> ${event.companyName} (${event.plantLocation || 'India'})</li>
        <li><strong>Contact Name:</strong> ${event.contactName || 'N/A'}</li>
        <li><strong>Work Email:</strong> ${event.workEmail || event.contactEmailOrPhone || 'N/A'}</li>
        <li><strong>Phone / WhatsApp:</strong> ${event.phoneOrWhatsapp || 'N/A'}</li>
        <li><strong>ERP System:</strong> ${event.erpSystem || 'Tally Prime / SAP / Excel'}</li>
        <li><strong>Approx. SKU Count:</strong> ${event.approxSkuCount || 'Not specified'}</li>
        <li><strong>Founder Lead Inbox:</strong> <a href="${actionUrl}" style="color: #fbbf24;">${actionUrl}</a></li>
      </ul>
    </div>
  `;
  return { title, summary, htmlBody, actionUrl };
}

/**
 * Dispatches an instant Founder Alert via Resend Email API (if configured) and Webhook URL (if configured),
 * and records the outcome to `./data/founder_alert_logs.json` (last 20 entries).
 * Never throws—safe for fire-and-forget or awaited diagnostic calls.
 */
export async function dispatchFounderAlert(
  event: FounderAlertPayload,
  options?: {
    logFilePath?: string;
    billingFilePath?: string;
  }
): Promise<FounderAlertDeliveryLog> {
  const timestamp = new Date().toISOString();
  const datePart = timestamp.slice(0, 10).replace(/-/g, '');
  const randSuffix = Math.floor(Math.random() * 65536)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0')
    .slice(0, 4);
  const alertId = `ALERT-${datePart}-${randSuffix}`;

  const config = await getFounderBillingConfig(options?.billingFilePath).catch(() => null);
  const upiId = event?.upiId || config?.upiId || LIVE_FOUNDER_UPI_ID;
  const recipientEmail =
    config?.founderAlertEmail?.trim() ||
    getEnvString('FOUNDER_ALERT_EMAIL') ||
    'joneszz2004@gmail.com';
  const resendApiKey =
    (config?.resendApiKey && !config.resendApiKey.includes('••••')
      ? config.resendApiKey.trim()
      : '') || getEnvString('RESEND_API_KEY');
  const webhookUrl =
    config?.founderWebhookUrl?.trim() ||
    getEnvString('FOUNDER_WEBHOOK_URL') ||
    getEnvString('LEAD_NOTIFICATION_WEBHOOK_URL') ||
    '';

  const { title, summary, htmlBody, actionUrl } = buildAlertTitleAndSummary(event, upiId);
  const errors: string[] = [];

  let emailStatus: AlertDeliveryChannelStatus = 'SKIPPED_NOT_CONFIGURED';
  if (resendApiKey && recipientEmail && typeof fetch === 'function') {
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Operationalyst Alerts <onboarding@resend.dev>',
          to: [recipientEmail],
          subject: title,
          html: htmlBody,
          text: summary,
        }),
      });
      if (emailRes.ok) {
        emailStatus = 'SENT';
      } else {
        emailStatus = 'FAILED';
        const errBody = await emailRes.text().catch(() => `HTTP ${emailRes.status}`);
        errors.push(`Resend HTTP ${emailRes.status}: ${errBody.slice(0, 140)}`);
      }
    } catch (err) {
      emailStatus = 'FAILED';
      errors.push(err instanceof Error ? `Resend error: ${err.message}` : 'Resend network error');
    }
  }

  let webhookStatus: AlertDeliveryChannelStatus = 'SKIPPED_NOT_CONFIGURED';
  if (webhookUrl && /^https?:\/\//i.test(webhookUrl) && typeof fetch === 'function') {
    try {
      const whRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId,
          timestamp,
          eventType: event.eventType,
          title,
          text: `${title}\n${summary}`,
          content: `${title}\n${summary}`,
          summary,
          upiId,
          actionUrl,
          payload: event,
        }),
      });
      if (whRes.ok) {
        webhookStatus = 'SENT';
      } else {
        webhookStatus = 'FAILED';
        errors.push(`Webhook HTTP ${whRes.status}`);
      }
    } catch (err) {
      webhookStatus = 'FAILED';
      errors.push(
        err instanceof Error ? `Webhook error: ${err.message}` : 'Webhook network error'
      );
    }
  }

  const overallStatus: AlertDeliveryChannelStatus =
    emailStatus === 'SENT' || webhookStatus === 'SENT'
      ? 'SENT'
      : emailStatus === 'FAILED' || webhookStatus === 'FAILED'
      ? 'FAILED'
      : 'SKIPPED_NOT_CONFIGURED';

  const logEntry: FounderAlertDeliveryLog = {
    alertId,
    timestamp,
    eventType: event.eventType,
    title,
    summary,
    companyName: event.companyName,
    leadId: event.leadId,
    workspaceId: event.workspaceId,
    utrNumber: event.utrNumber,
    amountInr: event.amountInr,
    upiId,
    actionUrl,
    recipientEmail,
    webhookConfigured: Boolean(webhookUrl),
    emailStatus,
    webhookStatus,
    overallStatus,
    ...(errors.length > 0 ? { errorDetails: errors.join(' | ') } : {}),
  };

  try {
    const existing = await readAlertLogsNode(options?.logFilePath);
    await writeAlertLogsNode([logEntry, ...existing], options?.logFilePath);
  } catch {
    // Never fail caller if log write fails
  }

  return logEntry;
}
