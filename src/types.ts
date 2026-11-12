/**
 * Core type definitions for Project 1: Factory Dead Inventory Engine
 */

export type StockCategory = 'Raw Material' | 'Finished Goods' | 'Spares' | 'Consumable';

export type StockStatus = 'Dead' | 'Slow' | 'Moving';

export type ABCClass = 'A' | 'B' | 'C';

export interface StockItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: StockCategory;
  qtyOnHand: number;
  costRate: number;
  lastMovement: string; // YYYY-MM-DD
  movementDates?: string[]; // Historical movement dates (YYYY-MM-DD) over past 12+ months
  // Computed fields (White cells)
  closingValue?: number;
  daysIdle?: number;
  status?: StockStatus;
  valueRank?: number;
  cumulativePercent?: number;
  abcClass?: ABCClass;
  action?: string;
  deadValue?: number;
}

export interface RulesConfig {
  asOfDate: string; // YYYY-MM-DD
  deadThresholdDays: number;
  slowThresholdDays: number;
  classACutoff: number; // e.g. 80
  classBCutoff: number; // e.g. 95
  holdingCostPercent: number; // e.g. 18
}

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rateToINR: number; // e.g., INR=1, USD=0.012, etc.
  format: (value: number) => string;
}

export type UserRole = 'Owner' | 'Plant Head' | 'Accounts' | 'Auditor' | 'Read Only';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  details: string;
  ip: string;
  hash: string;
}

export interface SystemMetrics {
  calculationLatencyMs: number;
  memoryFootprintMb: number;
  activeSkuCount: number;
  uptimeSeconds: number;
  lastBackupTimestamp: string;
  encryptionMode: 'AES-256-GCM' | 'DISABLED';
}

export interface ScheduledReportConfig {
  enabled: boolean;
  cadence: 'Daily (08:00 AM IST)' | 'Weekly (Monday)' | 'Real-time on Dead Spike';
  channel: 'WhatsApp' | 'Encrypted Email' | 'Webhook';
  recipient: string;
  encryptionEnabled: boolean;
  lastSentTimestamp: string | null;
}

export interface OwnerReportSummary {
  asOfDate: string;
  totalStockValue: number;
  deadCash: number;
  deadCashPercent: number;
  deadItemCount: number;
  totalItemCount: number;
  slowCash: number;
  slowCashPercent: number;
  slowItemCount: number;
  movingCash: number;
  movingCashPercent: number;
  movingItemCount: number;
  annualHoldingBurn: number;
  holdingCostRate: number;
  topDeadItems: StockItem[];
  ageingBreakdown: {
    range0_30: number;
    range0_30_pct: number;
    range31_89: number;
    range31_89_pct: number;
    range90_179: number;
    range90_179_pct: number;
    range180_plus: number;
    range180_plus_pct: number;
  };
  categoryDeadBreakdown: Record<StockCategory, { value: number; count: number; percent: number }>;
}

export interface LiquidationScenario {
  discountPercent: number;
  categoryDiscounts: Record<StockCategory, number>;
  totalDeadBookValue: number;
  cashRecovered: number;
  haircutLoss: number;
  annualHoldingBurnEliminated: number;
  netFirstYearBenefit: number;
  reinvestmentRoiMonths: number;
}
