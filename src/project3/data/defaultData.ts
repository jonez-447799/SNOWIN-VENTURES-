import type { Trip, RulesConfig, ScaleProfile, CarrierCapacityProfile } from '../types/freight.ts';

export const DEFAULT_RULES: RulesConfig = {
  detentionRatePerHour: 200,
  minWeightThresholdKg: 500,
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  unitLocation: 'Ambattur Industrial Estate, Chennai'
};

export const INITIAL_TRIPS: Trip[] = [
  {
    id: 'TRIP-01',
    date: '2026-09-02',
    lane: 'Ambattur to Oragadam',
    km: 42,
    transporter: 'Murugan',
    weightKg: 2830,
    bill: 4200,
    waitHours: 0.5,
    split: 'No',
    emptyReturn: 'Yes',
    notes: 'Lane benchmark: ~₹1,484/tonne clean run. Empty return explained rate.',
    sourceDoc: 'LR-MUR-8821'
  },
  {
    id: 'TRIP-02',
    date: '2026-09-04',
    lane: 'Ambattur to Oragadam',
    km: 42,
    transporter: 'Siva Transport',
    weightKg: 3000,
    bill: 6100,
    waitHours: 3.5,
    split: 'No',
    emptyReturn: 'Yes',
    notes: 'Same road 2 days later: ₹2,033/t vs ₹1,484/t. ₹1,648 rate leak + ₹700 waiting.',
    sourceDoc: 'LR-SIV-1049'
  },
  {
    id: 'TRIP-03',
    date: '2026-09-05',
    lane: 'Ambattur to Sriperumbudur',
    km: 35,
    transporter: 'Murugan',
    weightKg: 2500,
    bill: 2970,
    waitHours: 0.5,
    split: 'No',
    emptyReturn: 'Yes',
    notes: 'Sriperumbudur lane benchmark: ₹1,188/tonne clean day rate.',
    sourceDoc: 'LR-MUR-8835'
  },
  {
    id: 'TRIP-04',
    date: '2026-09-07',
    lane: 'Ambattur to Maraimalai Nagar',
    km: 48,
    transporter: 'Murugan',
    weightKg: 4490,
    bill: 7184,
    waitHours: 0.5,
    split: 'No',
    emptyReturn: 'Yes',
    notes: 'Maraimalai Nagar lane benchmark: ₹1,600/tonne clean run.',
    sourceDoc: 'LR-MUR-8849'
  },
  {
    id: 'TRIP-05',
    date: '2026-09-10',
    lane: 'Ambattur to Oragadam',
    km: 42,
    transporter: 'Murugan',
    weightKg: 2500,
    bill: 4545,
    waitHours: 1.0,
    split: 'No',
    emptyReturn: 'Yes',
    notes: 'Murugan secondary trip. Moderate ₹835 variance over own benchmark.',
    sourceDoc: 'LR-MUR-8862'
  },
  {
    id: 'TRIP-06',
    date: '2026-09-12',
    lane: 'Ambattur to Sriperumbudur',
    km: 35,
    transporter: 'Siva Transport',
    weightKg: 3000,
    bill: 7033,
    waitHours: 5.0,
    split: 'No',
    emptyReturn: 'Yes',
    notes: 'Worst single leak on worst lane: ₹3,469 rate leak + 5 hours gate delay (₹1,000).',
    sourceDoc: 'LR-SIV-1088'
  },
  {
    id: 'TRIP-07',
    date: '2026-09-15',
    lane: 'Ambattur to Sriperumbudur',
    km: 35,
    transporter: 'Ravi',
    weightKg: 1000,
    bill: 2319,
    waitHours: 2.0,
    split: 'No',
    emptyReturn: 'No',
    notes: 'Broker dispatch above 500kg (>500kg & non-split enters leak math: ₹1,131 leak).',
    sourceDoc: 'LR-RAV-0412'
  },
  {
    id: 'TRIP-08',
    date: '2026-09-16',
    lane: 'Ambattur to Maraimalai Nagar',
    km: 48,
    transporter: 'Siva Transport',
    weightKg: 2500,
    bill: 5960,
    waitHours: 5.0,
    split: 'No',
    emptyReturn: 'Yes',
    notes: '₹2,384/t vs ₹1,600/t benchmark (₹1,960 leak) + 5 hrs detention (₹1,000).',
    sourceDoc: 'LR-SIV-1102'
  },
  {
    id: 'TRIP-09',
    date: '2026-09-18',
    lane: 'Ambattur to Oragadam',
    km: 42,
    transporter: 'Siva Transport',
    weightKg: 3000,
    bill: 4407,
    waitHours: 2.0,
    split: 'Yes',
    emptyReturn: 'No',
    notes: 'Split load (two unloads on one truck). Excluded from rate leak calculation.',
    sourceDoc: 'LR-SIV-1115'
  },
  {
    id: 'TRIP-10',
    date: '2026-09-21',
    lane: 'Ambattur to Sriperumbudur',
    km: 35,
    transporter: 'Murugan',
    weightKg: 3200,
    bill: 3801,
    waitHours: 1.0,
    split: 'No',
    emptyReturn: 'Yes',
    notes: 'Re-affirms Murugan clean benchmark at ₹1,188/tonne on Sriperumbudur lane.',
    sourceDoc: 'LR-MUR-8890'
  },
  {
    id: 'TRIP-11',
    date: '2026-09-24',
    lane: 'Ambattur to Oragadam',
    km: 42,
    transporter: 'Ravi',
    weightKg: 2500,
    bill: 3710,
    waitHours: 0.5,
    split: 'No',
    emptyReturn: 'No',
    notes: 'Matched benchmark ₹1,484/tonne via return load dispatch. Zero rate leak.',
    sourceDoc: 'LR-RAV-0448'
  },
  {
    id: 'TRIP-12',
    date: '2026-09-28',
    lane: 'Ambattur to Maraimalai Nagar',
    km: 48,
    transporter: 'Ravi',
    weightKg: 3500,
    bill: 6371,
    waitHours: 3.0,
    split: 'Yes',
    emptyReturn: 'No',
    notes: 'Split load across 2 customer gates. Excluded from rate leak calculation.',
    sourceDoc: 'LR-RAV-0471'
  }
];

export const LANE_CONFIG = {
  'Ambattur to Oragadam': { km: 42, expectedTimeHrs: 1.5 },
  'Ambattur to Sriperumbudur': { km: 35, expectedTimeHrs: 1.25 },
  'Ambattur to Maraimalai Nagar': { km: 48, expectedTimeHrs: 1.75 }
};

export const TRANSPORTER_PROFILES = {
  'Murugan': {
    role: 'Benchmark carrier',
    summary: 'The cheapest clean day on every lane. Always call Murugan first. Do not fight him.',
    recommendation: 'Target carrier for volume consolidation. Increase lane allocation.'
  },
  'Siva Transport': {
    role: 'High leak carrier',
    summary: 'Carried ₹7,077 of rate leak and ₹3,100 of waiting. 4 trips cost ₹23,500 with 15.5 hours detention.',
    recommendation: 'The confrontation meeting. Show his bills vs Murugan bills. Match rates or stop bookings.'
  },
  'Ravi': {
    role: 'Broker / ad-hoc',
    summary: '3 trips billed ₹12,400. 1 split load, 1 benchmark match, 1 small Sriperumbudur premium of ₹1,131.',
    recommendation: 'Use only for overflow or when Murugan has no available lorry.'
  }
};

export const SCALE_PROFILES: ScaleProfile[] = [
  {
    id: 'small_msme',
    name: 'Small Machining Unit (MSME)',
    cluster: 'Ambattur Industrial Estate',
    monthlySpendLabel: '₹58,600 / mo',
    monthlySpend: 58600,
    multiplier: 1.0,
    description: 'Current sample plant: 12 monthly trips, localized routes, manual gate book.',
    typicalTripsPerMonth: 12
  },
  {
    id: 'mid_ancillary',
    name: 'Mid-Sized Auto Ancillary Plant',
    cluster: 'Guindy / Sriperumbudur Hub',
    monthlySpendLabel: '₹6,45,000 / mo',
    monthlySpend: 645000,
    multiplier: 11.0,
    description: 'Supplies Tier-1 brake & chassis parts: ~130 trips/month, ₹1.53 Lakhs/mo leak.',
    typicalTripsPerMonth: 132
  },
  {
    id: 'enterprise_tier1',
    name: 'Large Foundry & Stamping Tier-1',
    cluster: 'Oragadam Mega Industrial Park',
    monthlySpendLabel: '₹38,50,000 / mo',
    monthlySpend: 3850000,
    multiplier: 65.7,
    description: 'Supplies OEM vehicle plants: ~780 trips/month, ₹9.16 Lakhs/mo leak (₹1.1 Crore/yr).',
    typicalTripsPerMonth: 788
  }
];

export const CARRIER_CAPACITY_DATA: CarrierCapacityProfile[] = [
  {
    transporter: 'Murugan',
    estimatedFleet: 3,
    dailyAvailabilityConfidence: 65,
    operationalRisk: 'Medium',
    currentSpendSharePct: 38.7,
    recommendedAllocationPct: 70,
    riskJustification: 'Murugan is a small owner-operator with only 3 trucks. Forcing 100% volume onto him risks vehicle shortage and factory line-stop penalties during peak dispatches. Cap at 70%.'
  },
  {
    transporter: 'Siva Transport',
    estimatedFleet: 16,
    dailyAvailabilityConfidence: 95,
    operationalRisk: 'Low',
    currentSpendSharePct: 40.1,
    recommendedAllocationPct: 25,
    riskJustification: 'Siva has large fleet availability (16 trucks). Do NOT cut him off completely. Use Murugan rate benchmark to force Siva into a rate-match agreement for 25% quota as guaranteed reserve.'
  },
  {
    transporter: 'Ravi (Broker)',
    estimatedFleet: 45,
    dailyAvailabilityConfidence: 98,
    operationalRisk: 'Low',
    currentSpendSharePct: 21.2,
    recommendedAllocationPct: 5,
    riskJustification: 'Broker with infinite spot capacity via market broker network. Keep 5% allocation for emergency spillover when regular carriers are delayed or unavailable.'
  }
];

// Sample OCR / Document extraction templates for the Smart Ingestion tool
export const SAMPLE_OCR_TEMPLATES = [
  {
    id: 'DOC-OCT-01',
    name: 'Lorry Receipt #LR-9904 (Murugan)',
    date: '2026-10-02',
    lane: 'Ambattur to Oragadam',
    km: 42,
    transporter: 'Murugan',
    weightKg: 2900,
    bill: 4305,
    waitHours: 0.5,
    split: 'No' as const,
    emptyReturn: 'Yes' as const,
    confidence: '98%',
    sampleSnippet: 'Receipt No: 9904 | Ambattur -> Oragadam | 2.9 Tonnes | Paid: Rs. 4,305 | Gate In: 08:30, Gate Out: 09:00'
  },
  {
    id: 'DOC-OCT-02',
    name: 'Handwritten Gate Register #SIV-812',
    date: '2026-10-04',
    lane: 'Ambattur to Sriperumbudur',
    km: 35,
    transporter: 'Siva Transport',
    weightKg: 3200,
    bill: 7488,
    waitHours: 4.5,
    split: 'No' as const,
    emptyReturn: 'Yes' as const,
    confidence: '92%',
    sampleSnippet: 'TN-04-AB-3920 | Siva Trnsp | Amb to Sriperumbudur | G.W: 3200kg | Rs 7488 cash | Gate In: 10:15, Out: 14:45 (4.5h wait)'
  },
  {
    id: 'DOC-OCT-03',
    name: 'Delivery Challan #RAV-551',
    date: '2026-10-06',
    lane: 'Ambattur to Maraimalai Nagar',
    km: 48,
    transporter: 'Ravi',
    weightKg: 2400,
    bill: 3840,
    waitHours: 1.0,
    split: 'No' as const,
    emptyReturn: 'No' as const,
    confidence: '95%',
    sampleSnippet: 'Broker: Ravi | Maraimalai Ngr | 2400 kg | Billed: 3840 | In: 13:00, Out: 14:00 | Return: Matched backhaul'
  }
];

export const DEFAULT_OBJECTIONS = [
  {
    id: 'OBJ-01',
    transporter: 'Siva Transport',
    excuse: 'Diesel prices jumped that week, so the rate had to go up!',
    realityCheck: 'Diesel price did not change by 37% in 48 hours on the same Ambattur–Oragadam highway.',
    unarguableProof: 'On 02 Sep, Murugan billed ₹1,484/tonne (₹4,200 for 2,830 kg). Just 2 days later on 04 Sep, Siva billed ₹2,033/tonne (₹6,100 for 3,000 kg). That is an unprovoked ₹1,648 rate leak on the exact same road.',
    counterScript: '"Siva-anna, look at both bills from my desk. Murugan moved 2.8 tonnes on Wednesday for ₹1,484/tonne. On Friday you moved 3.0 tonnes for ₹2,033/tonne. The highway did not grow longer and diesel did not jump 37%. We need you to match Murugan’s ₹1,484 rate if you want the Oragadam loads."',
    supportingTripIdA: 'TRIP-01',
    supportingTripIdB: 'TRIP-02'
  },
  {
    id: 'OBJ-02',
    transporter: 'Siva Transport',
    excuse: 'My truck had to come back empty to Ambattur, so I had to charge dry-run cost.',
    realityCheck: 'Murugan also had an empty return and still charged ₹1,484/tonne.',
    unarguableProof: 'Trip #TRIP-01 (Murugan) is explicitly recorded in gate register as Empty Return = YES, billed at ₹1,484/t. Trip #TRIP-02 (Siva) is also Empty Return = YES, but billed at ₹2,033/t. An empty return is normal in this cluster, not an excuse for an extra ₹1,648.',
    counterScript: '"Both of you came back empty. Murugan’s rate already absorbs the empty return and still gives me ₹1,484 a tonne. You cannot charge me for an empty return twice."',
    supportingTripIdA: 'TRIP-01',
    supportingTripIdB: 'TRIP-02'
  },
  {
    id: 'OBJ-03',
    transporter: 'Siva Transport',
    excuse: 'Your dispatch yard and customer gate delayed my driver for half the day.',
    realityCheck: 'Waiting is accounted for separately in the gate log at ₹200/hr, not bundled into freight.',
    unarguableProof: 'On Trip #TRIP-02, Siva waited 3.5 hours (₹700 detention). On Trip #TRIP-05, Siva waited 4.5 hours (₹900 detention). Siva accounted for ₹3,100 of the company’s total ₹4,900 detention. You cannot charge an inflated rate per tonne AND then let the truck idle.',
    counterScript: '"If the truck waited 3.5 hours, here is the gate book timestamp. We recognize ₹700 detention at the standard ₹200/hr rate. But you cannot hike the freight per tonne from ₹1,188 to ₹2,340 and also claim detention. Rate is rate, detention is detention."',
    supportingTripIdA: 'TRIP-03',
    supportingTripIdB: 'TRIP-05'
  },
  {
    id: 'OBJ-04',
    transporter: 'Ravi (Broker)',
    excuse: 'Market spot rates are volatile and you had multi-drop split loads.',
    realityCheck: 'Split loads are already excluded from the benchmark. But single drops leaked ₹1,131.',
    unarguableProof: 'Trip #TRIP-09 was a 2-drop split load and was given ₹0 leak in our audit. But on Trip #TRIP-10 (Sriperumbudur, 1,400 kg), Ravi charged ₹2,800 (₹2,000/tonne) vs Murugan’s benchmark of ₹1,188/tonne, leaking ₹1,137.',
    counterScript: '"Ravi, we didn’t touch your split loads because we know two drops cost more. But on this clean 1.4-tonne run to Sriperumbudur, you charged ₹2,000/tonne while Murugan ran the lane at ₹1,188. We know what a clean trip costs now."',
    supportingTripIdA: 'TRIP-03',
    supportingTripIdB: 'TRIP-10'
  }
];
