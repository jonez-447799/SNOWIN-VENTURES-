/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PilotLeadStatus =
  | 'NEW'
  | 'SUITABILITY_REVIEW'
  | 'NDA_SENT'
  | 'APPROVED_FOR_UPLOAD'
  | 'CLOSED';

export const ALLOWED_PILOT_LEAD_STATUSES: PilotLeadStatus[] = [
  'NEW',
  'SUITABILITY_REVIEW',
  'NDA_SENT',
  'APPROVED_FOR_UPLOAD',
  'CLOSED',
];

export type BuyerPersona =
  | 'ECONOMIC_BUYER'
  | 'INTERNAL_CHAMPION'
  | 'PRIMARY_USER'
  | 'TECHNICAL_EVALUATOR'
  | 'GENERAL';

export const ALLOWED_BUYER_PERSONAS: BuyerPersona[] = [
  'ECONOMIC_BUYER',
  'INTERNAL_CHAMPION',
  'PRIMARY_USER',
  'TECHNICAL_EVALUATOR',
  'GENERAL',
];

export interface ValidatedPilotRequestInput {
  fullName: string;
  workEmail: string;
  phoneOrWhatsapp: string;
  companyName: string;
  plantLocation: string;
  roleTitle: string;
  erpSystem: string;
  approxSkuCount: string;
  primaryChallenge: string;
  consentConfirmed: true;
  sourceView: string;
  buyerPersona?: BuyerPersona;
  selfAssessmentScore?: number;
  selfAssessmentBand?: string;
  selfAssessmentSummary?: string;
}

export type LinkedPlantId = 'ambattur' | 'sriperumbudur' | 'hosur';
export const ALLOWED_LINKED_PLANT_IDS: LinkedPlantId[] = ['ambattur', 'sriperumbudur', 'hosur'];

export interface LeadDataQualityOverview {
  totalSubmitted: number;
  validAccepted: number;
  quarantinedRejected: number;
  reserveSparesExcludedValue: number;
  reserveSparesCount?: number;
  datasetSha256?: string;
}

export interface PilotRequestRecord extends ValidatedPilotRequestInput {
  leadId: string;
  createdAt: string;
  updatedAt: string;
  status: PilotLeadStatus;
  founderNotes: string;
  linkedWorkspaceId?: string;
  linkedWalkthroughUrl?: string;
  linkedPlantId?: LinkedPlantId;
  uploadToken?: string;
  uploadPortalUrl?: string;
  lastImportRunId?: string;
  lastImportAt?: string;
  dataQualityOverview?: LeadDataQualityOverview;
  deletionCertificateId?: string;
  purgedAt?: string;
}

export interface PilotRequestValidationResult {
  ok: boolean;
  isSpamTrap?: boolean;
  data?: ValidatedPilotRequestInput;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface AdminLeadPatchInput {
  status?: PilotLeadStatus;
  founderNotes?: string;
  linkedWorkspaceId?: string;
  linkedWalkthroughUrl?: string;
  linkedPlantId?: LinkedPlantId;
  lastImportRunId?: string;
  lastImportAt?: string;
  dataQualityOverview?: LeadDataQualityOverview;
  uploadToken?: string;
  uploadPortalUrl?: string;
  deletionCertificateId?: string;
  purgedAt?: string;
}

export interface AdminLeadPatchValidationResult {
  ok: boolean;
  data?: {
    status?: PilotLeadStatus;
    founderNotes?: string;
    linkedWorkspaceId?: string;
    linkedWalkthroughUrl?: string;
    linkedPlantId?: LinkedPlantId;
  };
  error?: string;
  fieldErrors?: Record<string, string>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function sanitizeText(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

/**
 * Pure validation function for POST /api/pilot-requests payloads.
 */
export function validatePilotRequestPayload(raw: unknown): PilotRequestValidationResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: { form: 'Invalid JSON request payload.' },
    };
  }

  const body = raw as Record<string, unknown>;

  // Check hidden spam trap (websiteHoneypot) first:
  // If non-empty string, return ok: true with isSpamTrap: true so server returns 200 OK silently without saving.
  const websiteHoneypot = sanitizeText(body.websiteHoneypot);
  if (websiteHoneypot.length > 0) {
    return {
      ok: true,
      isSpamTrap: true,
      data: {
        fullName: 'Spam Trap Ignored',
        workEmail: 'noreply@spamtrap.invalid',
        phoneOrWhatsapp: '0000000',
        companyName: 'Spam Trap',
        plantLocation: 'N/A',
        roleTitle: 'N/A',
        erpSystem: '',
        approxSkuCount: '',
        primaryChallenge: '',
        consentConfirmed: true,
        sourceView: sanitizeText(body.sourceView).slice(0, 80) || 'honeypot',
      },
    };
  }

  const fieldErrors: Record<string, string> = {};

  const fullName = sanitizeText(body.fullName);
  if (!fullName || fullName.length < 2 || fullName.length > 120) {
    fieldErrors.fullName = 'Full name is required (2–120 characters).';
  }

  // Phase 10 Express 4-Field Contact Resolution:
  // Accepts unified `contact` / `workEmailOrWhatsapp` field OR single `workEmail` / `phoneOrWhatsapp` field
  const rawContact = sanitizeText(body.contact ?? body.workEmailOrWhatsapp);
  let rawWorkEmail = sanitizeText(body.workEmail).toLowerCase();
  let rawPhone = sanitizeText(body.phoneOrWhatsapp);

  // If unified contact is provided, or if workEmail was given a phone number in Express Mode
  if (rawContact.length > 0) {
    if (EMAIL_REGEX.test(rawContact.toLowerCase())) {
      rawWorkEmail = rawWorkEmail || rawContact.toLowerCase();
      rawPhone = rawPhone || 'Express Email Intake';
    } else if (rawContact.length >= 7 && rawContact.length <= 25 && !rawContact.includes('@')) {
      rawPhone = rawPhone || rawContact;
      rawWorkEmail = rawWorkEmail || 'whatsapp-express@operationalyst.in';
    } else {
      fieldErrors.workEmail = 'Please provide a valid work email or WhatsApp number.';
    }
  } else if (
    rawWorkEmail.length >= 7 &&
    rawWorkEmail.length <= 25 &&
    !rawWorkEmail.includes('@') &&
    /[0-9]{7,}/.test(rawWorkEmail.replace(/[\s+\-()]/g, '')) &&
    body.phoneOrWhatsapp === undefined
  ) {
    // Express contact field passed via workEmail containing a phone/WhatsApp number
    rawPhone = rawWorkEmail;
    rawWorkEmail = 'whatsapp-express@operationalyst.in';
  } else if (
    rawWorkEmail &&
    EMAIL_REGEX.test(rawWorkEmail) &&
    body.phoneOrWhatsapp === undefined
  ) {
    // Express contact field passed via workEmail containing a valid email address
    rawPhone = 'Express Email Intake';
  } else if (
    rawPhone.length >= 7 &&
    rawPhone.length <= 25 &&
    body.workEmail === undefined
  ) {
    // Express contact field passed via phoneOrWhatsapp only
    rawWorkEmail = 'whatsapp-express@operationalyst.in';
  }

  const workEmail = rawWorkEmail;
  if (!workEmail || workEmail.length > 160 || !EMAIL_REGEX.test(workEmail)) {
    fieldErrors.workEmail = 'A valid work email address is required (max 160 characters).';
  }

  const phoneOrWhatsapp = rawPhone;
  if (!phoneOrWhatsapp || phoneOrWhatsapp.length < 7 || phoneOrWhatsapp.length > 25) {
    fieldErrors.phoneOrWhatsapp = 'Phone or WhatsApp number is required (7–25 characters).';
  }

  const companyName = sanitizeText(body.companyName);
  if (!companyName || companyName.length < 2 || companyName.length > 160) {
    fieldErrors.companyName = 'Company or factory name is required (2–160 characters).';
  }

  // In Express 4-Field mode, plantLocation and roleTitle may be omitted (undefined)
  const rawPlantLocation =
    body.plantLocation === undefined && companyName.length >= 2
      ? 'Manufacturing Unit (Express Intake)'
      : sanitizeText(body.plantLocation);
  const plantLocation = rawPlantLocation;
  if (!plantLocation || plantLocation.length < 2 || plantLocation.length > 160) {
    fieldErrors.plantLocation = 'Plant location (City / Industrial Estate) is required (2–160 characters).';
  }

  const rawRoleTitle =
    body.roleTitle === undefined && fullName.length >= 2
      ? 'Plant / Operations Leadership'
      : sanitizeText(body.roleTitle);
  const roleTitle = rawRoleTitle;
  if (!roleTitle || roleTitle.length < 2 || roleTitle.length > 120) {
    fieldErrors.roleTitle = 'Role or job title is required (2–120 characters).';
  }

  const erpSystem = sanitizeText(body.erpSystem);
  if (erpSystem.length > 80) {
    fieldErrors.erpSystem = 'ERP / inventory system must be 80 characters or fewer.';
  }

  const approxSkuCount = sanitizeText(body.approxSkuCount);
  if (approxSkuCount.length > 80) {
    fieldErrors.approxSkuCount = 'Approximate SKU count must be 80 characters or fewer.';
  }

  const primaryChallenge = sanitizeText(body.primaryChallenge);
  if (primaryChallenge.length > 1000) {
    fieldErrors.primaryChallenge = 'Primary inventory challenge must be 1,000 characters or fewer.';
  }

  const sourceView = sanitizeText(body.sourceView);
  if (sourceView.length > 80) {
    fieldErrors.sourceView = 'Source view identifier must be 80 characters or fewer.';
  }

  // Optional Phase 4 structured qualification fields
  let buyerPersona: BuyerPersona | undefined;
  if (body.buyerPersona !== undefined && body.buyerPersona !== null && body.buyerPersona !== '') {
    const rawPersona = sanitizeText(body.buyerPersona);
    if (!ALLOWED_BUYER_PERSONAS.includes(rawPersona as BuyerPersona)) {
      fieldErrors.buyerPersona = `Buyer persona must be one of: ${ALLOWED_BUYER_PERSONAS.join(', ')}.`;
    } else {
      buyerPersona = rawPersona as BuyerPersona;
    }
  }

  let selfAssessmentScore: number | undefined;
  if (
    body.selfAssessmentScore !== undefined &&
    body.selfAssessmentScore !== null &&
    body.selfAssessmentScore !== ''
  ) {
    const numericScore = Number(body.selfAssessmentScore);
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100) {
      fieldErrors.selfAssessmentScore = 'Self-assessment score must be a number between 0 and 100.';
    } else {
      selfAssessmentScore = Math.round(numericScore);
    }
  }

  let selfAssessmentBand: string | undefined;
  if (
    body.selfAssessmentBand !== undefined &&
    body.selfAssessmentBand !== null &&
    body.selfAssessmentBand !== ''
  ) {
    const cleanedBand = sanitizeText(body.selfAssessmentBand);
    if (cleanedBand.length > 60) {
      fieldErrors.selfAssessmentBand = 'Self-assessment band must be 60 characters or fewer.';
    } else if (cleanedBand.length > 0) {
      selfAssessmentBand = cleanedBand;
    }
  }

  let selfAssessmentSummary: string | undefined;
  if (
    body.selfAssessmentSummary !== undefined &&
    body.selfAssessmentSummary !== null &&
    body.selfAssessmentSummary !== ''
  ) {
    const cleanedSummary = sanitizeText(body.selfAssessmentSummary).slice(0, 600);
    if (cleanedSummary.length > 0) {
      selfAssessmentSummary = cleanedSummary;
    }
  }

  if (body.consentConfirmed !== true) {
    fieldErrors.consentConfirmed =
      'Explicit consent is required to submit a Pilot Audit request.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors,
    };
  }

  return {
    ok: true,
    isSpamTrap: false,
    data: {
      fullName,
      workEmail,
      phoneOrWhatsapp,
      companyName,
      plantLocation,
      roleTitle,
      erpSystem,
      approxSkuCount,
      primaryChallenge,
      consentConfirmed: true,
      sourceView: sourceView || 'modal',
      ...(buyerPersona !== undefined ? { buyerPersona } : {}),
      ...(selfAssessmentScore !== undefined ? { selfAssessmentScore } : {}),
      ...(selfAssessmentBand !== undefined ? { selfAssessmentBand } : {}),
      ...(selfAssessmentSummary !== undefined ? { selfAssessmentSummary } : {}),
    },
  };
}

/**
 * Pure validation function for PATCH /api/admin/pilot-requests/:leadId payloads.
 */
export function validateAdminLeadPatch(raw: unknown): AdminLeadPatchValidationResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      ok: false,
      error: 'Invalid patch payload',
      fieldErrors: { form: 'Request body must be a JSON object.' },
    };
  }

  const body = raw as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};
  const result: {
    status?: PilotLeadStatus;
    founderNotes?: string;
    linkedWorkspaceId?: string;
    linkedWalkthroughUrl?: string;
    linkedPlantId?: LinkedPlantId;
  } = {};

  if (body.status !== undefined) {
    if (
      typeof body.status !== 'string' ||
      !ALLOWED_PILOT_LEAD_STATUSES.includes(body.status as PilotLeadStatus)
    ) {
      fieldErrors.status = `Status must be one of: ${ALLOWED_PILOT_LEAD_STATUSES.join(', ')}.`;
    } else {
      result.status = body.status as PilotLeadStatus;
    }
  }

  if (body.founderNotes !== undefined) {
    if (typeof body.founderNotes !== 'string') {
      fieldErrors.founderNotes = 'Founder notes must be a string.';
    } else {
      const cleaned = sanitizeText(body.founderNotes);
      if (cleaned.length > 2000) {
        fieldErrors.founderNotes = 'Founder notes must be 2,000 characters or fewer.';
      } else {
        result.founderNotes = cleaned;
      }
    }
  }

  if (body.linkedWorkspaceId !== undefined) {
    if (typeof body.linkedWorkspaceId !== 'string') {
      fieldErrors.linkedWorkspaceId = 'Linked workspace ID must be a string.';
    } else {
      const cleaned = sanitizeText(body.linkedWorkspaceId);
      if (cleaned.length > 80) {
        fieldErrors.linkedWorkspaceId = 'Linked workspace ID must be 80 characters or fewer.';
      } else {
        result.linkedWorkspaceId = cleaned;
      }
    }
  }

  if (body.linkedWalkthroughUrl !== undefined) {
    if (typeof body.linkedWalkthroughUrl !== 'string') {
      fieldErrors.linkedWalkthroughUrl = 'Linked walkthrough URL must be a string.';
    } else {
      const cleaned = sanitizeText(body.linkedWalkthroughUrl);
      if (cleaned.length > 500) {
        fieldErrors.linkedWalkthroughUrl = 'Linked walkthrough URL must be 500 characters or fewer.';
      } else {
        result.linkedWalkthroughUrl = cleaned;
      }
    }
  }

  if (body.linkedPlantId !== undefined) {
    if (
      typeof body.linkedPlantId !== 'string' ||
      !ALLOWED_LINKED_PLANT_IDS.includes(body.linkedPlantId as LinkedPlantId)
    ) {
      fieldErrors.linkedPlantId = `Linked plant ID must be one of: ${ALLOWED_LINKED_PLANT_IDS.join(', ')}.`;
    } else {
      result.linkedPlantId = body.linkedPlantId as LinkedPlantId;
    }
  }

  if (
    result.status === undefined &&
    result.founderNotes === undefined &&
    result.linkedWorkspaceId === undefined &&
    result.linkedWalkthroughUrl === undefined &&
    result.linkedPlantId === undefined &&
    Object.keys(fieldErrors).length === 0
  ) {
    fieldErrors.form = 'Provide at least status, founderNotes, or linked workspace details to update.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors,
    };
  }

  return {
    ok: true,
    data: result,
  };
}

export interface OptionalNotificationDispatchResult {
  dispatched: boolean;
  skippedReason?: 'missing_env' | 'placeholder_env' | 'invalid_url' | 'fetch_unavailable' | 'network_error';
}

const PLACEHOLDER_WEBHOOK_PATTERNS = [
  'your_webhook_url',
  'your-webhook-url',
  'my_webhook_url',
  'example.com',
  'placeholder',
  'changeme',
];

const PLACEHOLDER_WEB3FORMS_PATTERNS = [
  'your_web3forms_key',
  'your_access_key',
  'placeholder',
  'changeme',
  'my_web3forms_key',
];

/**
 * Pure, safe, non-throwing helper for optional server-side LEAD_NOTIFICATION_WEBHOOK_URL notifications.
 * Never throws or logs noisy errors when the environment variable is unset, blank, a placeholder, or unreachable.
 */
export async function dispatchOptionalWebhookNotification(
  payload: Record<string, unknown>,
  rawWebhookUrl: string | undefined = process.env.LEAD_NOTIFICATION_WEBHOOK_URL,
  fetchImpl: typeof fetch | undefined = typeof fetch === 'function' ? fetch : undefined
): Promise<OptionalNotificationDispatchResult> {
  try {
    const trimmed = typeof rawWebhookUrl === 'string' ? rawWebhookUrl.trim() : '';
    if (!trimmed) {
      return { dispatched: false, skippedReason: 'missing_env' };
    }
    const lower = trimmed.toLowerCase();
    if (PLACEHOLDER_WEBHOOK_PATTERNS.some((p) => lower.includes(p))) {
      return { dispatched: false, skippedReason: 'placeholder_env' };
    }
    if (!lower.startsWith('https://') && !lower.startsWith('http://')) {
      return { dispatched: false, skippedReason: 'invalid_url' };
    }
    if (typeof fetchImpl !== 'function') {
      return { dispatched: false, skippedReason: 'fetch_unavailable' };
    }
    const res = await fetchImpl(trimmed, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { dispatched: Boolean(res && res.ok) };
  } catch {
    return { dispatched: false, skippedReason: 'network_error' };
  }
}

/**
 * Pure, safe, non-throwing helper for optional Web3Forms notifications (VITE_WEB3FORMS_KEY / VITE_WEB3FORMS_ACCESS_KEY).
 * Never throws or logs noisy errors when the environment variable is unset, blank, a placeholder, or unreachable.
 */
export async function dispatchOptionalWeb3FormsNotification(
  payload: Record<string, unknown>,
  rawAccessKey?: string,
  fetchImpl: typeof fetch | undefined = typeof fetch === 'function' ? fetch : undefined
): Promise<OptionalNotificationDispatchResult> {
  try {
    const trimmed = typeof rawAccessKey === 'string' ? rawAccessKey.trim() : '';
    if (!trimmed) {
      return { dispatched: false, skippedReason: 'missing_env' };
    }
    const lower = trimmed.toLowerCase();
    if (PLACEHOLDER_WEB3FORMS_PATTERNS.some((p) => lower.includes(p))) {
      return { dispatched: false, skippedReason: 'placeholder_env' };
    }
    if (typeof fetchImpl !== 'function') {
      return { dispatched: false, skippedReason: 'fetch_unavailable' };
    }
    const res = await fetchImpl('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        access_key: trimmed,
        ...payload,
      }),
    });
    return { dispatched: Boolean(res && res.ok) };
  } catch {
    return { dispatched: false, skippedReason: 'network_error' };
  }
}

