export type DelayReason = 
  | 'Material short'
  | 'QC hold'
  | 'No vehicle'
  | 'Labour short'
  | 'Paperwork'
  | 'Customer hold'
  | '';

export type FailType = 'Late' | 'Short' | 'Late and short' | null;

export type UserRole = 'owner' | 'clerk' | 'gate';

export interface ActiveUser {
  id: string;
  name: string;
  role: UserRole;
  designation: string;
}

export interface FactoryProfile {
  id: string;
  companyName: string;
  plantName: string;
  clusterLocation: string;
  industryType: 'Automotive' | 'Heavy Engineering' | 'FMCG Packaging' | 'Pharma & Chemicals' | 'General Precision';
  currencySymbol: string;
  planTier: 'Starter' | 'Pro Industrial' | 'Enterprise';
  licenseStatus: 'Active' | 'Trial' | 'Enterprise Verified';
  managerPhone: string;
  managerEmail: string;
  // Customizable subscription pricing
  monthlyPriceStarter?: number; // e.g. 2999
  monthlyPricePro?: number;     // e.g. 4999
  monthlyPriceEnterprise?: number; // e.g. 9999
  customMonthlyPrice?: number;
  // Founder sales persona & authority title
  founderTitle?: string;        // e.g. 'Plant Dispatch Auditor' | 'OEM Delivery Compliance Specialist'
  founderName?: string;
  founderFirmName?: string;
}

export interface NotificationConfig {
  enableWhatsAppAlerts: boolean;
  enableEmailAlerts: boolean;
  managerWhatsAppPhone: string;
  managerEmail: string;
  alertOnCriticalBreach: boolean;
  dailyDigestTime: string;
}

export interface DispatchRow {
  id: string;
  customer: string;
  po: string;
  part: string;
  orderedQty: number;
  shippedQty: number;
  promisedDate: string; // ISO string or 'YYYY-MM-DDTHH:mm'
  actualOut: string;    // ISO string or 'YYYY-MM-DDTHH:mm'
  vehicle: string;
  delayReason: DelayReason;
  // Computed fields (can also be evaluated on the fly)
  onTime?: boolean;
  inFull?: boolean;
  otif?: boolean;
  failType?: FailType;
  lateHours?: number;
  notes?: string;
  isWhatsAppOrder?: boolean;
}

export interface RulesConfig {
  graceHours: number;       // default: 0. Max 4 if written customer grace.
  inFullCutoff: number;     // default: 100%. Shipped / ordered >= cutoff
  weekStart: string;        // '2026-09-15'
  weekEnd: string;          // '2026-09-28'
  criticalAlertThreshold?: number; // Custom threshold percentage (default: 60%). If real-time OTIF drops below this, triggers management warning
  factoryProfile?: FactoryProfile;
  notifications?: NotificationConfig;
}

export interface CustomerStats {
  customer: string;
  dispatches: number;
  passes: number;
  otifPercent: number;
  onTimeCount: number;
  inFullCount: number;
  fails: number;
}

export interface ReasonStats {
  reason: DelayReason;
  count: number;
  percentageOfFails: number;
}

export interface OTIFMetrics {
  totalDispatches: number;
  passes: number;
  otifPercent: number;
  onTimeCount: number;
  onTimePercent: number;
  inFullCount: number;
  inFullPercent: number;
  fails: number;
  failsLateOnly: number;
  failsShortOnly: number;
  failsLateAndShort: number;
  customerStats: CustomerStats[];
  reasonStats: ReasonStats[];
  weakestCustomer: CustomerStats | null;
  topFailureReason: ReasonStats | null;
}
