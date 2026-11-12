export interface Trip {
  id: string;
  date: string;
  lane: string;
  km: number;
  transporter: string;
  weightKg: number;
  bill: number;
  waitHours: number;
  split: 'Yes' | 'No';
  emptyReturn: 'Yes' | 'No';
  notes?: string;
  sourceDoc?: string;
}

export interface CalculatedTrip extends Trip {
  tonnes: number;
  ratePerTonne: number;
  bestRate: number;
  rateLeak: number;
  detention: number;
  totalLeak: number;
  isBenchmark: boolean;
  isClean: boolean;
}

export interface RulesConfig {
  detentionRatePerHour: number;
  minWeightThresholdKg: number;
  startDate: string;
  endDate: string;
  unitLocation: string;
  benchmarkMode?: 'per_tonne' | 'fixed_trip';
}

export interface LaneSummary {
  lane: string;
  km: number;
  tripsCount: number;
  cleanTripsCount: number;
  bestCleanRate: number;
  totalFreightPaid: number;
  totalRateLeak: number;
  totalWaitHours: number;
  totalDetention: number;
  totalWaste: number;
  bestTransporter: string;
  worstRatePerTonne: number;
}

export interface TransporterSummary {
  transporter: string;
  category: 'benchmark' | 'primary_leak' | 'broker';
  tripsCount: number;
  cleanTripsCount: number;
  splitTripsCount: number;
  totalBilled: number;
  totalRateLeak: number;
  totalWaitHours: number;
  totalDetention: number;
  totalWaste: number;
  rateLeakShare: number;
  detentionShare: number;
  avgWaitHours: number;
}

export interface AuditTotals {
  totalTrips: number;
  splitTrips: number;
  cleanTrips: number;
  freightPaid: number;
  rateLeak: number;
  detention: number;
  totalLeak: number;
  totalWaitHours: number;
}

export interface AnomalyAlert {
  id: string;
  type: 'gate_delay' | 'rate_gouging' | 'empty_return';
  severity: 'high' | 'medium' | 'info';
  tripId: string;
  lane: string;
  transporter: string;
  title: string;
  description: string;
  impactAmount: number;
}

export type ScaleProfileId = 'small_msme' | 'mid_ancillary' | 'enterprise_tier1';

export interface ScaleProfile {
  id: ScaleProfileId;
  name: string;
  cluster: string;
  monthlySpendLabel: string;
  monthlySpend: number;
  multiplier: number;
  description: string;
  typicalTripsPerMonth: number;
}

export interface GainShareConfig {
  contingencyPercentage: number; // e.g. 25%
  auditFeeUpfront: number;        // e.g. 0
  engagementMonths: number;      // e.g. 6 or 12
  clientName: string;
  clientIndustry: string;
  consultantName: string;
}

export interface SavingsForecastParameters {
  targetRateLeakReductionPct: number; // e.g. 80%
  targetDetentionReductionPct: number; // e.g. 65%
  annualVolumeGrowthPct: number;       // e.g. 5%
}

export interface CarrierCapacityProfile {
  transporter: string;
  estimatedFleet: number;
  dailyAvailabilityConfidence: number; // 0 to 100%
  operationalRisk: 'Low' | 'Medium' | 'High';
  currentSpendSharePct: number;
  recommendedAllocationPct: number;
  riskJustification: string;
}

export type CommercialModelId = 'contingency' | 'fixed_diagnostic' | 'monthly_retainer';

export interface CommercialProposalTerms {
  model: CommercialModelId;
  clientName: string;
  plantLocation: string;
  decisionMaker: string;
  contingencyPct: number; // e.g., 25% or 30%
  diagnosticFeeINR: number; // e.g., 15000
  retainerMonthlyFeeINR: number; // e.g., 7500
  retainerMonths: number; // e.g., 12
}

export interface TransporterObjection {
  id: string;
  transporter: string;
  excuse: string;
  realityCheck: string;
  unarguableProof: string;
  counterScript: string;
  supportingTripIdA: string;
  supportingTripIdB: string;
}
