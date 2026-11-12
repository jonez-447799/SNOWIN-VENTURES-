export type SpotType = 'Counter' | 'Back rack' | 'Mezzanine' | 'Drawer' | string;

export type SpeedType = 'Fast' | 'Slow';

export type UserRole = 'owner' | 'auditor' | 'counter_boy' | 'warehouse_mgr';

export interface AuditItem {
  id: string;
  code: string;
  part: string;
  spot: SpotType;
  systemQty: number;
  physicalQty: number;
  cost: number;
  issuesPerMonth: number;
  imageUrl?: string;
  // Computed fields
  gapQty?: number;
  gapRupees?: number;
  speed?: SpeedType;
  action?: string;
  statusNote?: string;
  recounted?: boolean;
  movedToCounter?: boolean;
  receiptEntered?: boolean;
}

export interface AuditRules {
  countDate: string; // e.g. "2026-10-01"
  fastMoverCutoff: number; // default: 8
  shrinkTolerancePercent: number; // default: 2%
  storeName: string;
  auditorName: string;
}

export interface AuditSummary {
  skusCounted: number;
  shelfShortRupees: number; // strictly positive absolute sum of negative gaps
  foundStockRupees: number; // strictly positive sum of positive gaps
  linesMismatch: number;
  linesMatched: number;
  fastMoversHidden: number;
  slowAtCounter: number;
  netGapRupees: number;
  totalSystemValue: number;
  totalPhysicalValue: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  itemCode?: string;
  details: string;
}

export interface PredictiveShortage {
  code: string;
  part: string;
  physicalQty: number;
  monthlyVelocity: number;
  daysRemaining: number;
  severity: 'critical' | 'warning' | 'stable';
  recommendedReorderQty: number;
}
