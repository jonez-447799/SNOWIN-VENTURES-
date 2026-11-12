/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PilotLeadPayload {
  name: string;
  email: string;
  company: string;
  role?: string;
  sector?: string;
  inventorySize?: string;
  primaryChallenge: string;
  preferredContact?: string;
  approxSkus?: string;
  currentSystem?: string;
  additionalContext?: string;
  sourcePage: string;
}

const FOUNDER_EMAIL = 'joneszz2004@gmail.com';

export function buildPilotMailtoHref(payload: PilotLeadPayload): string {
  const subject = encodeURIComponent(
    `Factory Inventory Audit Request — ${payload.company || payload.name}`
  );
  const lines = [
    `Hello Jonez,`,
    ``,
    `We would like to request a Pilot Factory Inventory Audit with Operationalyst.`,
    ``,
    `• Name: ${payload.name}`,
    `• Work Email: ${payload.email}`,
    `• Company: ${payload.company}`,
    payload.role ? `• Role: ${payload.role}` : '',
    payload.sector ? `• Sector: ${payload.sector}` : '',
    payload.inventorySize ? `• Inventory Scale: ${payload.inventorySize}` : '',
    payload.approxSkus ? `• Approximate SKUs: ${payload.approxSkus}` : '',
    payload.currentSystem ? `• Current System: ${payload.currentSystem}` : '',
    payload.preferredContact ? `• Preferred Contact: ${payload.preferredContact}` : '',
    `• Primary Challenge: ${payload.primaryChallenge}`,
    payload.additionalContext ? `• Additional Context: ${payload.additionalContext}` : '',
    ``,
    `Please share the scope confirmation and 5-column data checklist.`,
  ].filter(Boolean);

  return `mailto:${FOUNDER_EMAIL}?subject=${subject}&body=${encodeURIComponent(lines.join('\n'))}`;
}

export async function submitPilotLead(
  payload: PilotLeadPayload
): Promise<{ deliveredRemotely: boolean; mailtoHref: string }> {
  const enriched = {
    ...payload,
    submittedAt: new Date().toISOString(),
  };

  // 1. Always persist locally in browser session so nothing is lost on refresh
  try {
    const existing = JSON.parse(localStorage.getItem('audit_pilot_requests_v1') || '[]');
    existing.push(enriched);
    localStorage.setItem('audit_pilot_requests_v1', JSON.stringify(existing));
  } catch {
    // Ignore storage quota errors
  }

  const mailtoHref = buildPilotMailtoHref(payload);

  // 2. Deliver lead asynchronously via FormSubmit AJAX endpoint to founder inbox
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${FOUNDER_EMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: `Operationalyst Pilot Audit Request — ${payload.company} (${payload.name})`,
        _template: 'table',
        _captcha: 'false',
        Name: payload.name,
        Email: payload.email,
        Company: payload.company,
        Role: payload.role || 'Not specified',
        Sector: payload.sector || 'Not specified',
        Inventory_Scale: payload.inventorySize || 'Not specified',
        Approx_SKUs: payload.approxSkus || 'Not specified',
        Current_System: payload.currentSystem || 'Not specified',
        Preferred_Contact: payload.preferredContact || 'Email',
        Primary_Challenge: payload.primaryChallenge,
        Additional_Context: payload.additionalContext || 'None',
        Source_Page: payload.sourcePage,
        Submitted_At: enriched.submittedAt,
      }),
    });

    if (res.ok) {
      return { deliveredRemotely: true, mailtoHref };
    }
  } catch {
    // Network or ad-blocker fallback handled gracefully via mailtoHref on confirmation screen
  }

  return { deliveredRemotely: false, mailtoHref };
}
