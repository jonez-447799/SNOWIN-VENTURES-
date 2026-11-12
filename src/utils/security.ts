import type { AuditLogEntry, UserRole } from '../types.ts';

/**
 * Generates a non-cryptographic local reference ID for browser-stored demonstration activity entries.
 * Note: This is NOT a cryptographic hash or tamper-proof server-side signature.
 */
export function generateHash(content: string): string {
  let checksum = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    checksum = (checksum << 5) - checksum + char;
    checksum |= 0;
  }
  const hex = Math.abs(checksum).toString(16).padStart(8, '0');
  return `local_ref_${hex}`;
}

/**
 * UI Role preview matrix (Demonstration interface visibility only — does not enforce server-side authorization)
 */
export const ROLE_PERMISSIONS: Record<
  UserRole,
  {
    canEditStock: boolean;
    canEditRules: boolean;
    canImportTally: boolean;
    canRunDrill: boolean;
    canConfigureSecurity: boolean;
    canExportReports: boolean;
    canManageBackups: boolean;
  }
> = {
  Owner: {
    canEditStock: true,
    canEditRules: true,
    canImportTally: true,
    canRunDrill: true,
    canConfigureSecurity: true,
    canExportReports: true,
    canManageBackups: true,
  },
  'Plant Head': {
    canEditStock: true,
    canEditRules: true,
    canImportTally: true,
    canRunDrill: true,
    canConfigureSecurity: false,
    canExportReports: true,
    canManageBackups: true,
  },
  Accounts: {
    canEditStock: true,
    canEditRules: false,
    canImportTally: true,
    canRunDrill: true,
    canConfigureSecurity: false,
    canExportReports: true,
    canManageBackups: false,
  },
  Auditor: {
    canEditStock: false,
    canEditRules: false,
    canImportTally: false,
    canRunDrill: false,
    canConfigureSecurity: false,
    canExportReports: true,
    canManageBackups: false,
  },
  'Read Only': {
    canEditStock: false,
    canEditRules: false,
    canImportTally: false,
    canRunDrill: false,
    canConfigureSecurity: false,
    canExportReports: false,
    canManageBackups: false,
  },
};

/**
 * Creates a local browser activity history entry for demonstration purposes
 */
export function createAuditLog(
  user: string,
  role: UserRole,
  action: string,
  details: string
): AuditLogEntry {
  const timestamp = new Date().toISOString();
  const rawData = `${timestamp}|${user}|${role}|${action}|${details}`;
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp,
    user,
    role,
    action,
    details,
    ip: 'Local Browser Session',
    hash: generateHash(rawData),
  };
}

/**
 * Illustrative local activity history entries for the demonstration environment
 */
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-001',
    timestamp: '2026-10-01T08:00:00Z',
    user: 'R. Sundaram (Plant Head)',
    role: 'Plant Head',
    action: 'TALLY_IMPORT',
    details: 'Loaded Ambattur fabrication unit demonstration stock summary: 20 SKUs, Total ₹6,45,650.',
    ip: 'Local Browser Session',
    hash: 'local_ref_e83b9f1a',
  },
  {
    id: 'log-002',
    timestamp: '2026-10-01T08:05:12Z',
    user: 'M. Natarajan (Owner)',
    role: 'Owner',
    action: 'RULES_CONFIGURED',
    details: 'Set Dead threshold = 180 days, Slow = 90 days, Holding Burn = 18% p.a.',
    ip: 'Local Browser Session',
    hash: 'local_ref_7a9c1d4f',
  },
  {
    id: 'log-003',
    timestamp: '2026-10-01T08:15:30Z',
    user: 'M. Natarajan (Owner)',
    role: 'Owner',
    action: 'OWNER_REPORT_GENERATED',
    details: 'Generated 1-page report: Dead Cash ₹2,23,110 (34.6%), Annual Burn ₹40,160.',
    ip: 'Local Browser Session',
    hash: 'local_ref_c41e8093',
  },
];
