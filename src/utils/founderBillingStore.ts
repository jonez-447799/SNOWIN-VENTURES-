/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import QRCode from 'qrcode';
import type { PilotWorkspaceSnapshot } from './pilotWorkspaceStore.ts';
import type { PilotRequestRecord } from './leadValidation.ts';

export type CommercialBillingTier =
  | 'TIER2_FULL_AUDIT'
  | 'TIER3_MONTHLY_RETAINER';

export interface FounderBillingConfig {
  beneficiaryName: string;
  upiId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  udyamMsmeNumber: string;
  gstinOptional: string;
  razorpayPaymentLinkTier2: string;
  razorpayPaymentLinkTier3: string;
  tier1PriceInr: 0;
  tier2FullAuditPriceInr: number;
  tier3MonthlyRetainerInr: number;
  founderAlertEmail?: string;
  founderWebhookUrl?: string;
  resendApiKey?: string;
  supabaseUrl?: string;
  supabaseServiceKey?: string;
  updatedAt: string;
}

export interface PublicFounderBillingConfig {
  beneficiaryName: string;
  upiId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  udyamMsmeNumber: string;
  gstinOptional: string;
  razorpayPaymentLinkTier2: string;
  razorpayPaymentLinkTier3: string;
  tier1PriceInr: 0;
  tier2FullAuditPriceInr: number;
  tier3MonthlyRetainerInr: number;
  founderAlertEmail?: string;
  hasResendApiKey: boolean;
  hasWebhookUrl: boolean;
  hasSupabaseConfig: boolean;
  maskedResendApiKey: string;
  maskedSupabaseServiceKey: string;
  updatedAt: string;
}

export interface ProformaInvoiceLineItem {
  itemNo: number;
  description: string;
  hsnSacCode: string;
  sacCode: string;
  qty: number;
  quantity: number;
  unitPriceInr: number;
  lineTotalInr: number;
}

export interface ProformaInvoiceRecord {
  invoiceId: string;
  issuedAt: string;
  issueDate: string;
  dueDate: string;
  status: 'UNPAID_PROFORMA' | 'UTR_PENDING_VERIFICATION' | 'PAID_VERIFIED';
  paymentStatus: 'UNPAID_PROFORMA' | 'UTR_PENDING_VERIFICATION' | 'PAID_VERIFIED';
  tier: CommercialBillingTier;
  tierTitle: string;
  amountInr: number;
  currency: 'INR';
  workspaceId: string;
  leadId?: string;
  companyName: string;
  plantLocation: string;
  clientCompanyName: string;
  clientPlantLocation: string;
  clientContactName: string;
  clientContactEmail: string;
  sellerName: string;
  sellerBrand: string;
  sellerLocation: string;
  sellerEmail: string;
  udyamMsmeNumber: string;
  gstinOptional: string;
  beneficiaryName: string;
  upiId: string;
  upiPaymentUri: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  razorpayPaymentLink: string;
  submittedUtrNumber?: string;
  utrReferenceNumber?: string;
  paidAt?: string;
  verifiedBy?: string;
  neftImpsInstructions: {
    beneficiaryName: string;
    upiId: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    paymentNote: string;
  };
  lineItems: ProformaInvoiceLineItem[];
}

export interface PaidReceiptRecord {
  receiptId: string;
  invoiceId: string;
  workspaceId: string;
  leadId?: string;
  companyName: string;
  plantLocation: string;
  tier: CommercialBillingTier;
  tierTitle: string;
  amountPaidInr: number;
  currency: 'INR';
  utrNumber: string;
  paidAt: string;
  verifiedBy: string;
  stamp: 'PAID & VERIFIED';
  beneficiaryName: string;
  upiId: string;
  udyamMsmeNumber: string;
  gstinOptional: string;
  sellerBrand: string;
  sellerLocation: string;
  sellerEmail: string;
  lineItems: ProformaInvoiceLineItem[];
}

export const BROWSER_FOUNDER_BILLING_STORAGE_KEY = 'operationalyst_founder_billing_v1';

const isBrowserEnv =
  typeof window !== 'undefined' && typeof window.document !== 'undefined';

export const DEFAULT_FOUNDER_BILLING_FILE_PATH =
  !isBrowserEnv && typeof process !== 'undefined' && typeof process.cwd === 'function'
    ? `${process.cwd()}/data/founder_billing.json`
    : './data/founder_billing.json';

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

export const LEGACY_FOUNDER_UPI_ID = 'cjonessnowin@okaxis';
export const LIVE_FOUNDER_UPI_ID = '9080540047@yespop';

export const DEFAULT_FOUNDER_BILLING_CONFIG: FounderBillingConfig = {
  beneficiaryName: 'C. Jones Snowin (Operationalyst / Snowin Ventures)',
  upiId: LIVE_FOUNDER_UPI_ID,
  bankName: 'HDFC / ICICI / Indian Bank (Configure in Agent Workforce Billing Settings)',
  accountNumber: '00001234567890 (Configure in Billing Settings)',
  ifscCode: 'HDFC0000123 (Configure in Billing Settings)',
  udyamMsmeNumber: 'UDYAM-TN-02-XXXXXXX (Configure in Billing Settings)',
  gstinOptional: '',
  razorpayPaymentLinkTier2: 'https://razorpay.me/@operationalyst',
  razorpayPaymentLinkTier3: 'https://razorpay.me/@operationalyst',
  tier1PriceInr: 0,
  tier2FullAuditPriceInr: 14999,
  tier3MonthlyRetainerInr: 24999,
  founderAlertEmail: getEnvString('FOUNDER_ALERT_EMAIL') || 'joneszz2004@gmail.com',
  founderWebhookUrl:
    getEnvString('FOUNDER_WEBHOOK_URL') ||
    getEnvString('LEAD_NOTIFICATION_WEBHOOK_URL') ||
    '',
  resendApiKey: getEnvString('RESEND_API_KEY') || '',
  supabaseUrl: getEnvString('SUPABASE_URL') || '',
  supabaseServiceKey: getEnvString('SUPABASE_SERVICE_ROLE_KEY') || '',
  updatedAt: '2026-11-09T09:00:00.000Z',
};

function sanitizeText(val: unknown, fallback: string, maxLen: number = 180): string {
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLen);
}

function sanitizeOptionalSecret(val: unknown, fallback: string, maxLen: number = 512): string {
  if (typeof val !== 'string') return fallback;
  return val.trim().slice(0, maxLen);
}

function sanitizePositivePrice(val: unknown, fallback: number): number {
  const num = Number(val);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.round(num);
}

export function maskSecretValue(secret?: string): string {
  if (!secret || typeof secret !== 'string') return '';
  const trimmed = secret.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}

export function normalizeFounderBillingConfig(
  raw?: Partial<FounderBillingConfig> | null
): FounderBillingConfig {
  if (!raw || typeof raw !== 'object') {
    return {
      ...DEFAULT_FOUNDER_BILLING_CONFIG,
      founderAlertEmail:
        getEnvString('FOUNDER_ALERT_EMAIL') ||
        DEFAULT_FOUNDER_BILLING_CONFIG.founderAlertEmail,
      founderWebhookUrl:
        getEnvString('FOUNDER_WEBHOOK_URL') ||
        getEnvString('LEAD_NOTIFICATION_WEBHOOK_URL') ||
        DEFAULT_FOUNDER_BILLING_CONFIG.founderWebhookUrl,
      resendApiKey:
        getEnvString('RESEND_API_KEY') || DEFAULT_FOUNDER_BILLING_CONFIG.resendApiKey,
      supabaseUrl:
        getEnvString('SUPABASE_URL') || DEFAULT_FOUNDER_BILLING_CONFIG.supabaseUrl,
      supabaseServiceKey:
        getEnvString('SUPABASE_SERVICE_ROLE_KEY') ||
        DEFAULT_FOUNDER_BILLING_CONFIG.supabaseServiceKey,
    };
  }

  const rawUpi = typeof raw.upiId === 'string' ? raw.upiId.trim() : '';
  const migratedUpi =
    !rawUpi || rawUpi.toLowerCase() === LEGACY_FOUNDER_UPI_ID
      ? LIVE_FOUNDER_UPI_ID
      : rawUpi.slice(0, 100);

  return {
    beneficiaryName: sanitizeText(
      raw.beneficiaryName,
      DEFAULT_FOUNDER_BILLING_CONFIG.beneficiaryName,
      140
    ),
    upiId: migratedUpi,
    bankName: sanitizeText(raw.bankName, DEFAULT_FOUNDER_BILLING_CONFIG.bankName, 140),
    accountNumber: sanitizeText(
      raw.accountNumber,
      DEFAULT_FOUNDER_BILLING_CONFIG.accountNumber,
      80
    ),
    ifscCode: sanitizeText(raw.ifscCode, DEFAULT_FOUNDER_BILLING_CONFIG.ifscCode, 40),
    udyamMsmeNumber: sanitizeText(
      raw.udyamMsmeNumber,
      DEFAULT_FOUNDER_BILLING_CONFIG.udyamMsmeNumber,
      100
    ),
    gstinOptional: sanitizeOptionalSecret(
      raw.gstinOptional !== undefined
        ? raw.gstinOptional
        : DEFAULT_FOUNDER_BILLING_CONFIG.gstinOptional,
      '',
      40
    ),
    razorpayPaymentLinkTier2: sanitizeText(
      raw.razorpayPaymentLinkTier2,
      DEFAULT_FOUNDER_BILLING_CONFIG.razorpayPaymentLinkTier2,
      240
    ),
    razorpayPaymentLinkTier3: sanitizeText(
      raw.razorpayPaymentLinkTier3,
      DEFAULT_FOUNDER_BILLING_CONFIG.razorpayPaymentLinkTier3,
      240
    ),
    tier1PriceInr: 0,
    tier2FullAuditPriceInr: sanitizePositivePrice(
      raw.tier2FullAuditPriceInr,
      DEFAULT_FOUNDER_BILLING_CONFIG.tier2FullAuditPriceInr
    ),
    tier3MonthlyRetainerInr: sanitizePositivePrice(
      raw.tier3MonthlyRetainerInr,
      DEFAULT_FOUNDER_BILLING_CONFIG.tier3MonthlyRetainerInr
    ),
    founderAlertEmail: sanitizeText(
      raw.founderAlertEmail,
      getEnvString('FOUNDER_ALERT_EMAIL') ||
        DEFAULT_FOUNDER_BILLING_CONFIG.founderAlertEmail ||
        'joneszz2004@gmail.com',
      160
    ),
    founderWebhookUrl: sanitizeOptionalSecret(
      raw.founderWebhookUrl !== undefined
        ? raw.founderWebhookUrl
        : getEnvString('FOUNDER_WEBHOOK_URL') ||
            getEnvString('LEAD_NOTIFICATION_WEBHOOK_URL') ||
            '',
      '',
      512
    ),
    resendApiKey: sanitizeOptionalSecret(
      raw.resendApiKey !== undefined ? raw.resendApiKey : getEnvString('RESEND_API_KEY') || '',
      '',
      256
    ),
    supabaseUrl: sanitizeOptionalSecret(
      raw.supabaseUrl !== undefined ? raw.supabaseUrl : getEnvString('SUPABASE_URL') || '',
      '',
      256
    ),
    supabaseServiceKey: sanitizeOptionalSecret(
      raw.supabaseServiceKey !== undefined
        ? raw.supabaseServiceKey
        : getEnvString('SUPABASE_SERVICE_ROLE_KEY') || '',
      '',
      512
    ),
    updatedAt:
      typeof raw.updatedAt === 'string' && raw.updatedAt.trim()
        ? raw.updatedAt.trim()
        : new Date().toISOString(),
  };
}

/**
 * Strips sensitive API keys & webhook URLs before returning config on public unauthenticated endpoints.
 */
export function sanitizePublicFounderBillingConfig(
  config: FounderBillingConfig
): PublicFounderBillingConfig {
  const normalized = normalizeFounderBillingConfig(config);
  const effectiveResend = normalized.resendApiKey || getEnvString('RESEND_API_KEY');
  const effectiveSupabaseUrl = normalized.supabaseUrl || getEnvString('SUPABASE_URL');
  const effectiveSupabaseKey =
    normalized.supabaseServiceKey || getEnvString('SUPABASE_SERVICE_ROLE_KEY');
  const effectiveWebhook =
    normalized.founderWebhookUrl ||
    getEnvString('FOUNDER_WEBHOOK_URL') ||
    getEnvString('LEAD_NOTIFICATION_WEBHOOK_URL');

  return {
    beneficiaryName: normalized.beneficiaryName,
    upiId: normalized.upiId,
    bankName: normalized.bankName,
    accountNumber: normalized.accountNumber,
    ifscCode: normalized.ifscCode,
    udyamMsmeNumber: normalized.udyamMsmeNumber,
    gstinOptional: normalized.gstinOptional,
    razorpayPaymentLinkTier2: normalized.razorpayPaymentLinkTier2,
    razorpayPaymentLinkTier3: normalized.razorpayPaymentLinkTier3,
    tier1PriceInr: 0,
    tier2FullAuditPriceInr: normalized.tier2FullAuditPriceInr,
    tier3MonthlyRetainerInr: normalized.tier3MonthlyRetainerInr,
    founderAlertEmail: normalized.founderAlertEmail,
    hasResendApiKey: Boolean(effectiveResend),
    hasWebhookUrl: Boolean(effectiveWebhook),
    hasSupabaseConfig: Boolean(effectiveSupabaseUrl && effectiveSupabaseKey),
    maskedResendApiKey: maskSecretValue(effectiveResend),
    maskedSupabaseServiceKey: maskSecretValue(effectiveSupabaseKey),
    updatedAt: normalized.updatedAt,
  };
}

/**
 * Browser-safe reader/writer for Vercel static fallback
 */
export function readFounderBillingFromBrowser(): FounderBillingConfig {
  if (!isBrowserEnv) {
    return normalizeFounderBillingConfig(null);
  }
  try {
    const raw = window.localStorage.getItem(BROWSER_FOUNDER_BILLING_STORAGE_KEY);
    if (!raw) return normalizeFounderBillingConfig(null);
    const parsed = JSON.parse(raw) as Partial<FounderBillingConfig>;
    const normalized = normalizeFounderBillingConfig(parsed);
    if (!parsed.upiId || parsed.upiId.trim().toLowerCase() === LEGACY_FOUNDER_UPI_ID) {
      window.localStorage.setItem(
        BROWSER_FOUNDER_BILLING_STORAGE_KEY,
        JSON.stringify(normalized)
      );
    }
    return normalized;
  } catch {
    return normalizeFounderBillingConfig(null);
  }
}

export function saveFounderBillingToBrowser(
  partial: Partial<FounderBillingConfig>
): FounderBillingConfig {
  const current = readFounderBillingFromBrowser();
  const merged = normalizeFounderBillingConfig({
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  });
  if (isBrowserEnv) {
    try {
      window.localStorage.setItem(
        BROWSER_FOUNDER_BILLING_STORAGE_KEY,
        JSON.stringify(merged)
      );
    } catch {
      // Ignore storage quota errors
    }
  }
  return merged;
}

interface FounderBillingStoreFileSchema {
  version?: 1;
  config: FounderBillingConfig;
  invoices?: ProformaInvoiceRecord[];
}

async function readStoreFileNode(
  filePath: string = DEFAULT_FOUNDER_BILLING_FILE_PATH
): Promise<FounderBillingConfig> {
  if (isBrowserEnv) {
    return readFounderBillingFromBrowser();
  }

  const fs = await import('fs/promises');
  const path = await import('path');

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<FounderBillingStoreFileSchema> &
      Partial<FounderBillingConfig>;
    const rawConfig =
      parsed && typeof parsed.config === 'object' ? parsed.config : parsed;
    const wasLegacyUpi =
      !rawConfig?.upiId ||
      rawConfig.upiId.trim().toLowerCase() === LEGACY_FOUNDER_UPI_ID;
    const normalized = normalizeFounderBillingConfig(rawConfig);

    if (wasLegacyUpi) {
      await writeStoreFileNode(normalized, filePath).catch(() => {});
    }
    return normalized;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'ENOENT') {
      const seed = normalizeFounderBillingConfig(null);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await writeStoreFileNode(seed, filePath);
      return seed;
    }
    return normalizeFounderBillingConfig(null);
  }
}

async function writeStoreFileNode(
  config: FounderBillingConfig,
  filePath: string = DEFAULT_FOUNDER_BILLING_FILE_PATH
): Promise<void> {
  if (isBrowserEnv) {
    saveFounderBillingToBrowser(config);
    return;
  }

  const fs = await import('fs/promises');
  const path = await import('path');

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const payload: FounderBillingStoreFileSchema = {
    version: 1,
    config,
  };
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(payload, null, 2), 'utf-8');
  await fs.rename(tempPath, filePath);
}

export async function getFounderBillingConfig(
  filePath: string = DEFAULT_FOUNDER_BILLING_FILE_PATH
): Promise<FounderBillingConfig> {
  return readStoreFileNode(filePath);
}

export async function updateFounderBillingConfig(
  patch: Partial<FounderBillingConfig>,
  filePath: string = DEFAULT_FOUNDER_BILLING_FILE_PATH
): Promise<FounderBillingConfig> {
  const current = await readStoreFileNode(filePath);
  const nextPatch = { ...patch };

  if (typeof nextPatch.resendApiKey === 'string' && nextPatch.resendApiKey.includes('••••')) {
    delete nextPatch.resendApiKey;
  }
  if (
    typeof nextPatch.supabaseServiceKey === 'string' &&
    nextPatch.supabaseServiceKey.includes('••••')
  ) {
    delete nextPatch.supabaseServiceKey;
  }

  const updated = normalizeFounderBillingConfig({
    ...current,
    ...nextPatch,
    updatedAt: new Date().toISOString(),
  });
  await writeStoreFileNode(updated, filePath);
  if (!isBrowserEnv && filePath === DEFAULT_FOUNDER_BILLING_FILE_PATH) {
    void import('./cloudPersistenceStore.ts')
      .then((m) =>
        m.syncRecordToCloud(
          'founder_billing',
          'default',
          sanitizePublicFounderBillingConfig(updated)
        )
      )
      .catch(() => {});
  }
  return updated;
}

/**
 * Generates an NPCI-compliant `upi://pay` deep link for 0%-fee direct bank collection.
 */
export function buildUpiPaymentUri(
  config: FounderBillingConfig,
  amountInr: number,
  invoiceId: string,
  companyShortName: string = 'PlantAudit'
): string {
  const pa = (config.upiId || LIVE_FOUNDER_UPI_ID).trim();
  const pn = encodeURIComponent(config.beneficiaryName.trim());
  const am = Math.max(1, Math.round(amountInr));
  const cleanCompany = companyShortName
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  const tn = `${invoiceId.trim()}${cleanCompany ? `-${cleanCompany}` : ''}`;
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}

/**
 * Generates a 100% genuine, scannable NPCI UPI QR code SVG string from any `upi://pay?...` URI.
 */
export async function generateUpiQrCodeSvg(upiUri: string): Promise<string> {
  const safeUri =
    typeof upiUri === 'string' && upiUri.trim().startsWith('upi://pay')
      ? upiUri.trim()
      : buildUpiPaymentUri(DEFAULT_FOUNDER_BILLING_CONFIG, 14999, 'INV-20261110-P1P4');
  return QRCode.toString(safeUri, {
    type: 'svg',
    margin: 1,
    width: 180,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#020617',
      light: '#ffffff',
    },
  });
}

function buildDeterministicInvoiceId(workspaceId: string, createdAt?: string): string {
  const createdDate = new Date(createdAt || Date.now());
  const safeDate = Number.isNaN(createdDate.getTime()) ? new Date() : createdDate;
  const datePart = safeDate.toISOString().slice(0, 10).replace(/-/g, '');
  const rawSuffix = workspaceId
    .replace(/^AUDIT-(\d{8}-)?/i, '')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase();
  const suffix4 = (rawSuffix + 'P1P4').slice(0, 4);
  return `INV-${datePart}-${suffix4}`;
}

function buildDeterministicReceiptId(workspaceId: string, paidAt?: string): string {
  const paidDate = new Date(paidAt || Date.now());
  const safeDate = Number.isNaN(paidDate.getTime()) ? new Date() : paidDate;
  const datePart = safeDate.toISOString().slice(0, 10).replace(/-/g, '');
  const rawSuffix = workspaceId
    .replace(/^AUDIT-(\d{8}-)?/i, '')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase();
  const suffix4 = (rawSuffix + 'P1P4').slice(0, 4);
  return `RCPT-${datePart}-${suffix4}`;
}

/**
 * Generates a deterministic B2B Proforma Invoice / Paid Receipt for any Pilot Workspace or Lead.
 */
export function generateProformaInvoice(
  snapshot: Pick<
    PilotWorkspaceSnapshot,
    | 'workspaceId'
    | 'leadId'
    | 'companyName'
    | 'plantLocation'
    | 'createdAt'
    | 'commercialAccessMode'
    | 'submittedUtrNumber'
    | 'paymentVerifiedAt'
    | 'invoiceId'
    | 'paymentTier'
  >,
  lead?: Partial<
    Pick<
      PilotRequestRecord,
      'leadId' | 'fullName' | 'workEmail' | 'companyName' | 'plantLocation' | 'roleTitle'
    >
  > | null,
  config: FounderBillingConfig = DEFAULT_FOUNDER_BILLING_CONFIG,
  requestedTier?: CommercialBillingTier
): ProformaInvoiceRecord {
  const normalizedConfig = normalizeFounderBillingConfig(config);
  const tier: CommercialBillingTier =
    requestedTier || snapshot.paymentTier || 'TIER2_FULL_AUDIT';

  const amountInr =
    tier === 'TIER3_MONTHLY_RETAINER'
      ? normalizedConfig.tier3MonthlyRetainerInr
      : normalizedConfig.tier2FullAuditPriceInr;

  const existingInv = snapshot.invoiceId || '';
  const invoiceId = /^INV-\d{8}-[A-Z0-9]{4}$/.test(existingInv)
    ? existingInv
    : buildDeterministicInvoiceId(snapshot.workspaceId, snapshot.createdAt);

  const createdDate = new Date(snapshot.createdAt || Date.now());
  const safeCreatedMs = Number.isNaN(createdDate.getTime())
    ? Date.now()
    : createdDate.getTime();
  const issuedAt = new Date(safeCreatedMs).toISOString();
  const issueDate = issuedAt.slice(0, 10);
  const dueDate = new Date(safeCreatedMs + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const paymentStatus: ProformaInvoiceRecord['paymentStatus'] =
    snapshot.commercialAccessMode === 'FULL_UNLOCKED' && snapshot.paymentVerifiedAt
      ? 'PAID_VERIFIED'
      : snapshot.commercialAccessMode === 'UTR_PENDING_VERIFICATION' ||
        Boolean(snapshot.submittedUtrNumber)
      ? 'UTR_PENDING_VERIFICATION'
      : 'UNPAID_PROFORMA';

  const tierTitle =
    tier === 'TIER3_MONTHLY_RETAINER'
      ? 'Tier 3: Monthly Multi-Plant Working Capital Control Tower Retainer'
      : 'Tier 2: Complete 4-Pillar Factory Inventory & Logistics Audit (48-Hr Turnaround)';

  const lineItems: ProformaInvoiceLineItem[] =
    tier === 'TIER3_MONTHLY_RETAINER'
      ? [
          {
            itemNo: 1,
            description:
              'Monthly Fortnightly ERP Refresh (P1 Dead Stock, P2 Gate OTIF, P3 Freight Leakage, P4 Bin Variance) + Executive Review',
            hsnSacCode: '998311',
            sacCode: '998311',
            qty: 1,
            quantity: 1,
            unitPriceInr: amountInr,
            lineTotalInr: amountInr,
          },
        ]
      : [
          {
            itemNo: 1,
            description:
              'Complete 4-Pillar Factory Inventory Audit: Full Ranked SKU Priority Schedule, P1–P4 Leakage Quantification & 6-Sheet .XLSX Action Plan',
            hsnSacCode: '998311',
            sacCode: '998311',
            qty: 1,
            quantity: 1,
            unitPriceInr: amountInr,
            lineTotalInr: amountInr,
          },
        ];

  const resolvedCompanyName = lead?.companyName || snapshot.companyName;
  const resolvedPlantLocation = lead?.plantLocation || snapshot.plantLocation;

  const upiPaymentUri = buildUpiPaymentUri(
    normalizedConfig,
    amountInr || normalizedConfig.tier2FullAuditPriceInr,
    invoiceId,
    resolvedCompanyName
  );

  return {
    invoiceId,
    issuedAt,
    issueDate,
    dueDate,
    status: paymentStatus,
    paymentStatus,
    tier,
    tierTitle,
    amountInr,
    currency: 'INR',
    workspaceId: snapshot.workspaceId,
    leadId: lead?.leadId || snapshot.leadId,
    companyName: resolvedCompanyName,
    plantLocation: resolvedPlantLocation,
    clientCompanyName: resolvedCompanyName,
    clientPlantLocation: resolvedPlantLocation,
    clientContactName: lead?.fullName || 'Plant / Operations Leadership',
    clientContactEmail: lead?.workEmail || 'operations@clientplant.in',
    sellerName: 'C. Jones Snowin',
    sellerBrand: 'Operationalyst (A Unit of Snowin Ventures)',
    sellerLocation: 'Chennai, Tamil Nadu, India',
    sellerEmail: 'joneszz2004@gmail.com',
    udyamMsmeNumber: normalizedConfig.udyamMsmeNumber,
    gstinOptional: normalizedConfig.gstinOptional,
    beneficiaryName: normalizedConfig.beneficiaryName,
    upiId: normalizedConfig.upiId,
    upiPaymentUri,
    bankName: normalizedConfig.bankName,
    accountNumber: normalizedConfig.accountNumber,
    ifscCode: normalizedConfig.ifscCode,
    razorpayPaymentLink:
      tier === 'TIER3_MONTHLY_RETAINER'
        ? normalizedConfig.razorpayPaymentLinkTier3
        : normalizedConfig.razorpayPaymentLinkTier2,
    submittedUtrNumber: snapshot.submittedUtrNumber,
    utrReferenceNumber: snapshot.submittedUtrNumber,
    paidAt: snapshot.paymentVerifiedAt,
    verifiedBy: snapshot.paymentVerifiedAt ? 'C. Jones Snowin' : undefined,
    neftImpsInstructions: {
      beneficiaryName: normalizedConfig.beneficiaryName,
      upiId: normalizedConfig.upiId,
      bankName: normalizedConfig.bankName,
      accountNumber: normalizedConfig.accountNumber,
      ifscCode: normalizedConfig.ifscCode,
      paymentNote: `${invoiceId} · ${resolvedCompanyName}`,
    },
    lineItems,
  };
}

/**
 * Generates an Official B2B Paid Receipt (`RCPT-YYYYMMDD-XXXX`) once a workspace payment is verified.
 */
export function generatePaidReceipt(
  snapshot: Pick<
    PilotWorkspaceSnapshot,
    | 'workspaceId'
    | 'leadId'
    | 'companyName'
    | 'plantLocation'
    | 'createdAt'
    | 'commercialAccessMode'
    | 'submittedUtrNumber'
    | 'paymentVerifiedAt'
    | 'invoiceId'
    | 'paymentTier'
  >,
  lead?: Partial<
    Pick<
      PilotRequestRecord,
      'leadId' | 'fullName' | 'workEmail' | 'companyName' | 'plantLocation' | 'roleTitle'
    >
  > | null,
  config: FounderBillingConfig = DEFAULT_FOUNDER_BILLING_CONFIG,
  requestedTier?: CommercialBillingTier
): PaidReceiptRecord {
  const proforma = generateProformaInvoice(snapshot, lead, config, requestedTier);
  const paidAt = snapshot.paymentVerifiedAt || new Date().toISOString();
  const receiptId = buildDeterministicReceiptId(snapshot.workspaceId, paidAt);

  return {
    receiptId,
    invoiceId: proforma.invoiceId,
    workspaceId: snapshot.workspaceId,
    leadId: proforma.leadId,
    companyName: proforma.companyName,
    plantLocation: proforma.plantLocation,
    tier: proforma.tier,
    tierTitle: proforma.tierTitle,
    amountPaidInr: proforma.amountInr,
    currency: 'INR',
    utrNumber: snapshot.submittedUtrNumber || 'VERIFIED_BANK_CREDIT',
    paidAt,
    verifiedBy: 'C. Jones Snowin',
    stamp: 'PAID & VERIFIED',
    beneficiaryName: proforma.beneficiaryName,
    upiId: proforma.upiId,
    udyamMsmeNumber: proforma.udyamMsmeNumber,
    gstinOptional: proforma.gstinOptional,
    sellerBrand: proforma.sellerBrand,
    sellerLocation: proforma.sellerLocation,
    sellerEmail: proforma.sellerEmail,
    lineItems: proforma.lineItems,
  };
}
