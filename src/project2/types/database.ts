import type { DispatchRow, RulesConfig, FactoryProfile } from './otif.ts';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  action: 'DISPATCH_CREATED' | 'DISPATCH_MODIFIED' | 'DISPATCH_DELETED' | 'RULES_UPDATED' | 'PIN_VERIFIED' | 'DATABASE_SWITCHED' | 'BACKUP_EXPORTED';
  userRole: string;
  userName: string;
  details: string;
  recordId?: string;
  digitalSignature: string; // SHA-256 style verification hash
  ipHash?: string;
}

export interface FactoryWorkspace {
  id: string; // unique workspace ID, e.g. 'ws_apex_01'
  name: string; // e.g. 'Apex Precision Automotive Ltd'
  plantLocation: string; // e.g. 'Sriperumbudur, Chennai'
  industry: 'Automotive' | 'Heavy Engineering' | 'FMCG Packaging' | 'Pharma & Chemicals' | 'General Precision';
  currencySymbol: string;
  licenseTier: 'Starter' | 'Pro Industrial' | 'Enterprise';
  status: 'Active' | 'Trial' | 'Archived';
  createdAt: string;
  lastActive: string;
  totalRecordsCount?: number;
  profile: FactoryProfile;
  rules: RulesConfig;
  dispatches: DispatchRow[];
}

export interface SecurityConfig {
  isPinLockEnabled: boolean;
  supervisorPin: string; // 4-digit PIN, default '1234'
  isCurrentlyLocked: boolean; // When true, owner/rules/pricing tabs require PIN
  autoLockMinutes: number; // e.g. 15
  requireReasonForLateDispatch: boolean;
  enableTamperAuditLog: boolean;
}
