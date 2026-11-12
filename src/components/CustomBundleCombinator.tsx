import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  Package,
  Truck,
  Scale,
  ScanBarcode,
  Radio,
  Sparkles,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Briefcase,
  Building2,
  TrendingUp,
  ShieldCheck,
  Wand2
} from 'lucide-react';
import Project1App from '../project1/Project1App';
import Project2App from '../project2/Project2App';
import Project3App from '../project3/Project3App';
import Project4App from '../project4/Project4App';
import Project5App from '../project5/Project5App';
import { InteractiveDealCloser } from './InteractiveDealCloser';
import { RecoveryActionDocsGenerator } from './RecoveryActionDocsGenerator';

// Live Data Calculations across P1–P5
import { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES as P1_DEFAULT_RULES } from '../project1/data/initialData';
import { generateOwnerReport, formatCurrency } from '../project1/utils/calculations';
import { INITIAL_DISPATCHES, INITIAL_RULES as P2_DEFAULT_RULES } from '../project2/data/initialData';
import { INITIAL_WORKSPACES } from '../project2/data/factoryWorkspaces';
import { calculateOTIFMetrics } from '../project2/utils/otifCalculator';
import { INITIAL_TRIPS, DEFAULT_RULES as P3_DEFAULT_RULES } from '../project3/data/defaultData';
import { calculateAuditMetrics } from '../project3/utils/auditCalculations';
import { INITIAL_SAMPLE_SKUS as P4_INITIAL_SKUS, DEFAULT_RULES as P4_DEFAULT_RULES } from '../project4/data/sampleData';
import { computeSummary as computeP4Summary, computePredictiveShortages } from '../project4/utils/auditCalculations';
import { INITIAL_TOWER_DATA } from '../project5/data/sampleData';

export type EngineKey = 'p1' | 'p2' | 'p3' | 'p4' | 'p5';

interface PresetBundle {
  id: string;
  codeLabel: string;
  commercialName: string;
  tagline: string;
  sequence: EngineKey[];
  targetBuyer: string;
  whyCrazyGood: string;
  uniqueProductIdea: string;
  dfyAgencyPitch: {
    price: string;
    deliverable: string;
    script: string;
  };
  directSaasPitch: {
    price: string;
    users: string;
    script: string;
  };
}

export const STRATEGIC_BUNDLE_PRESETS: PresetBundle[] = [
  {
    id: 'p1_p4',
    codeLabel: 'P1 + P4',
    commercialName: 'Total Inventory Truth Engine (Macro Tally + Micro Bins)',
    tagline: 'Cross-verifies Tally accounting valuation (P1) against physical shelf counts & counter velocity (P4).',
    sequence: ['p1', 'p4'],
    targetBuyer: 'Auto-Component, EV Assembly & Engineering Spares Depots (₹15Cr–₹120Cr)',
    whyCrazyGood:
      'Looking at P1 alone trusts Tally’s book quantities—which are often wrong due to unbilled issues or theft. Looking at P4 alone counts bins without knowing total working capital carrying burn. Merging P1 + P4 exposes two lethal factory blind spots: (1) "Moving Class-A Ghost Stock" where Tally says you have stock so Purchase doesn’t reorder, while the physical shelf is empty; and (2) "Golden-Zone Dead Hoarding" where front counter racks are clogged with 200-day dead items while fast movers sit in dark back racks where pilferage happens.',
    uniqueProductIdea:
      '"The Pre-March Statutory Stock & Ghost-Inventory Cleanse": Sell a 5-day physical + Tally reconciliation sprint that guarantees zero audit qualification and stops emergency spot-buying.',
    dfyAgencyPitch: {
      price: '₹45,000 fixed 5-day audit + 10% of liquidated dead stock',
      deliverable: 'Tally Dead-Stock Liquidation Ledger (P1) + 100-Bin Blind Physical Variance & Re-Slotting Map (P4)',
      script:
        '"Your Tally Stock Summary says you have ₹10.4L in inventory, but your service bay is still turning away jobs for missing fast-movers. In 5 days, we cross-audit your Tally ledger (P1) against a blind physical count of your top 100 bins (P4) to liquidate dead metal and eliminate phantom stockouts."',
    },
    directSaasPitch: {
      price: '₹12,000 / month subscription',
      users: 'Storekeeper (P4 Mobile Scanner/Count Sheet) + Purchase Head & MD (P1 Working Capital Console)',
      script:
        '"Give your storekeeper the P4 morning blind-count sheet for 15 fast-moving bins a day, linked directly to your Purchase Manager’s P1 Dead-Stock freeze list so nobody ever reorders a dead part or stocks out of an A-item."',
    },
  },
  {
    id: 'p1_p3_p5',
    codeLabel: 'P1 + P3 + P5',
    commercialName: 'CFO Back-Office Cash & Margin Recovery Suite',
    tagline: '100% Back-Office Audit (Dead Stock + Freight Bills + Overdue Debtors + Monday 9AM Board). Zero shop-floor friction.',
    sequence: ['p3', 'p1', 'p5'],
    targetBuyer: 'Promoter / MD / CFO of Manufacturing & Distribution MSMEs',
    whyCrazyGood:
      'Why do 80% of factory software rollouts fail? Because gate guards (P2) and store helpers (P4) resist daily data entry on the shop floor. By combining ONLY P1 + P3 + P5 in sequence (Lead with P3 Freight, expand to P1 Dead Stock, lock in P5 Monday Board with Overdue Debtors), you never need a single shop-floor worker to touch a tablet! You only need 3 exports from the Accountant on Friday afternoon to unlock trapped cash across Inventory, Transport, and Receivables every Monday at 9:00 AM.',
    uniqueProductIdea:
      '"Fractional AI CFO / Working Capital Recovery Retainer": You operate as an external cash-recovery partner using only accounting exports—zero IT integration, zero worker training.',
    dfyAgencyPitch: {
      price: '₹20,000 72-Hr Diagnostic ➔ ₹45,000/month Monday Retainer + 15% Freight/Scrap Recovery',
      deliverable: 'Every Monday at 9:00 AM: Signed 6-Number Control Tower + Transporter Debit Note List + Dead Stock Freeze List + Overdue Debtor Stop-Supply List.',
      script:
        '"We don’t disturb your shop floor or ask your workers to learn new software. Every Friday, your accountant sends us 3 Tally/Excel exports: Stock Summary (P1), Lorry Bills (P3), and Overdue Debtors (P5). Every Monday at 9 AM, we hand you the exact rupees to recover."',
    },
    directSaasPitch: {
      price: '₹18,000 / month CFO License',
      users: 'Accounts Head + Promoter / MD',
      script:
        '"Your Accounts Head drops 3 Tally files into the Smart Mapper every Saturday morning, and by Monday 9:00 AM your phone has the bilingual Executive Control Tower with 1-click WhatsApp collection and debit-note dispatches."',
    },
  },
  {
    id: 'p2_p3',
    codeLabel: 'P2 + P3',
    commercialName: 'Gate-to-Corridor Dispatch & Detention Eliminator',
    tagline: 'Links internal shop-floor gate delays (P2) directly to external transporter detention charges & rate leaks (P3).',
    sequence: ['p3', 'p2'],
    targetBuyer: 'High-Tonnage Steel, Fabrication, Chemical & Auto-Tier-1 Plants Shipping 40+ Trucks/Month',
    whyCrazyGood:
      'In P3, the owner sees he is bleeding lakhs in lorry waiting/detention charges and spot-truck rate spikes. Transporters blame the factory gate; the dispatch clerk blames the transporter. Combining P2 + P3 cross-matches the exact P2 Gate-Out timestamps and "Final QC Hold / Packing Delay" codes against P3 Lorry Detention Bills. It proves mathematically which internal department caused the external freight overcharge!',
    uniqueProductIdea:
      '"Zero-Detention Dock & Transporter SLA Contract": Guarantee a 50% reduction in lorry halting bills and OEM late-delivery penalties within 30 days.',
    dfyAgencyPitch: {
      price: '25% of verified freight & detention savings (or ₹30,000/month)',
      deliverable: 'Corridor Rate Benchmark Card + Gate Loading Turnaround Audit linking QC/Packing holds to lorry bills.',
      script:
        '"Last month you paid ₹60,000+ in lorry halting charges and emergency truck premiums. By cross-auditing your P3 Lorry Bills against your P2 Gate Register, we show you which transporter is overcharging per tonne AND which internal department is holding trucks at the gate."',
    },
    directSaasPitch: {
      price: '₹15,000 / month Logistics & Gate Suite',
      users: 'Security Gate Tablet (P2) + Logistics/Accounts Payable Clerk (P3)',
      script:
        '"When the security guard stamps Gate-In and Gate-Out on the P2 tablet, P3 automatically calculates the exact allowable lorry detention before your accounts clerk approves the transporter’s bill."',
    },
  },
  {
    id: 'p2_p4',
    codeLabel: 'P2 + P4',
    commercialName: 'Spares-to-Gate Fulfillment & Zero-Short-Ship Engine',
    tagline: 'Stops "On-Time but Short-Shipped" OTIF failures (P2) by verifying physical bin stock (P4) before promising POs.',
    sequence: ['p4', 'p2'],
    targetBuyer: 'OEM Tier-1 Suppliers & Regional Spares Distribution Hubs with strict OTIF SLAs',
    whyCrazyGood:
      'Why do factories fail OTIF because of "Short Shipments" (e.g., shipping 420 pcs against 500 ordered at the last minute)? Because PPC checks Tally computer stock in the morning, sees 500 pcs, and promises the load in P2. At 4:00 PM, packing walks to the rack (P4) and discovers only 420 pcs are physically in the bin! Combining P4 + P2 creates a Pre-Dispatch Physical Verification gate that kills short-shipped penalties.',
    uniqueProductIdea:
      '"95% Strict OTIF Guarantee System": Morning 15-minute physical bin check on scheduled PO parts so no truck is ever called for a short load.',
    dfyAgencyPitch: {
      price: '₹55,000 30-Day Shop-Floor Turnaround Sprint',
      deliverable: 'Class-A Bin Accuracy Cleanup (P4) + Gate OTIF Root-Cause Elimination (P2).',
      script:
        '"Nearly half of your OTIF failures happen because your team discovers a part shortage AFTER the truck is already at the gate. We link morning physical bin verification (P4) to your daily dispatch schedule (P2) to eliminate short-shipments."',
    },
    directSaasPitch: {
      price: '₹14,000 / month Shop-Floor Ops License',
      users: 'Store Picker (P4) + Dispatch Supervisor & Gate Guard (P2)',
      script:
        '"Connects your store rack counts directly to today’s gate dispatch board so any bin shortage triggers an alert at 8:30 AM instead of 5:00 PM."',
    },
  },
  {
    id: 'p1_p3',
    codeLabel: 'P1 + P3',
    commercialName: 'The 72-Hour Cash & Freight Diagnostic Wedge',
    tagline: 'Your fastest cold-outreach closer: 2 CSV files from Accounts = Immediate Balance Sheet + P&L Proof.',
    sequence: ['p1', 'p3'],
    targetBuyer: 'Any skeptical MSME Factory Owner (First-Time Prospect)',
    whyCrazyGood:
      'When pitching a cold prospect, 5 modules is too big and 1 module can feel narrow. P1 (Dead Inventory) + P3 (Freight Leak) is the ultimate 1-2 punch: P1 finds ₹5L–₹15L trapped on the Balance Sheet, and P3 finds ₹1.5L–₹4L/yr bleeding on the P&L. Both require zero shop-floor visits—just 2 spreadsheets from the accountant.',
    uniqueProductIdea:
      '"The ₹15,000 No-Cure-No-Pay 72-Hour Factory Leak Audit": Guarantee finding at least ₹3 Lakhs in combined dead cash + freight overcharges or the audit is free.',
    dfyAgencyPitch: {
      price: '₹15,000 – ₹25,000 one-time 72-hour diagnostic',
      deliverable: 'Dual 1-Page Executive Brief: Dead Stock Liquidation Plan + Transporter Rate/Detention Claim Sheet.',
      script:
        '"Send me two exports: your Tally Stock Summary and 60 days of Transporter Bills. In 72 hours, I will show you every rupee trapped in dead inventory and every rupee overpaid to transporters. If I don’t find at least ₹3 Lakhs, you pay ₹0."',
    },
    directSaasPitch: {
      price: '₹9,500 / month Self-Serve Auditor',
      users: 'Factory Owner / Commercial Manager',
      script:
        '"Upload your monthly stock summary and lorry bills in 2 minutes to automatically generate your purchase freeze list and transporter rate-cap audit."',
    },
  },
  {
    id: 'p1_p2',
    codeLabel: 'P1 + P2',
    commercialName: 'Cash Recovery + Customer Promise Alignment Bundle',
    tagline: 'P1 unlocks dead cash trapped in >180d idle inventory while P2 tracks strict customer OTIF delivery promises.',
    sequence: ['p1', 'p2'],
    targetBuyer: 'Custom Fabrication, Machining & Stamping Plants with Trapped Stock & Late POs',
    whyCrazyGood:
      'Strictly separates concerns: P1 focuses ONLY on recovering cash locked in dead inventory (never touching production planning, purchase planning, dispatch tracking, or OTIF), while P2 serves as the dedicated Customer Promise Reliability Engine measuring On-Time In-Full delivery accuracy. Pairing them recovers balance-sheet cash via P1 while protecting customer revenue via P2!',
    uniqueProductIdea:
      '"Dual Cash & Customer Promise Diagnostic": Liquidate dead >180d inventory in P1 while eliminating customer late/short delivery penalties in P2.',
    dfyAgencyPitch: {
      price: '₹40,000 30-Day Cash Recovery + Customer Promise Audit',
      deliverable: 'Dead Inventory Liquidation Ledger (P1) + Customer OTIF Root-Cause & Penalty Shield (P2).',
      script:
        '"P1 shows you exact rupees locked in dead stock (>180 days idle), while P2 shows why customer orders fail On-Time In-Full promises. Together they recover trapped cash and protect customer revenue."',
    },
    directSaasPitch: {
      price: '₹13,500 / month Cash + OTIF Suite',
      users: 'Finance / Inventory Controller (P1) + Dispatch & Customer Service Head (P2)',
      script:
        '"Keep P1 focused strictly on dead-inventory cash recovery while P2 tracks every customer PO commitment at the factory gate."',
    },
  },
  {
    id: 'p3_p4',
    codeLabel: 'P3 + P4',
    commercialName: 'Spares Depot Shrinkage & Outbound Parcel Audit',
    tagline: 'Built for Auto/EV Spares Distributors: Stops back-rack bin pilferage (P4) AND regional parcel/lorry overcharges (P3).',
    sequence: ['p4', 'p3'],
    targetBuyer: 'Regional Auto/EV Spares Distributors, Wholesalers & Aftermarket Depots',
    whyCrazyGood:
      'Spares distributors don’t manufacture—their entire margin is eaten by two silent killers: (1) high-value chargers, controllers, and brake pads disappearing from warehouse bins (P4), and (2) regional parcel/lorry transporters overcharging on daily dealer dispatches (P3). Merging P4 + P3 is a tailor-made profit shield for aftermarket depots.',
    uniqueProductIdea:
      '"The Aftermarket Depot Margin Shield": Pre-shutter morning bin verification (P4) + monthly transporter rate-card audit (P3).',
    dfyAgencyPitch: {
      price: '₹35,000 Depot Audit + 20% of Freight & Shrinkage Recovery',
      deliverable: 'Top-200 Bin Variance Report (P4) + Regional Transporter Rate Benchmark Audit (P3).',
      script:
        '"In wholesale spares distribution, 3% bin shrinkage and 10% freight overbilling wipe out nearly a third of your net profit. We audit your bins and your lorry bills together in 72 hours."',
    },
    directSaasPitch: {
      price: '₹11,500 / month Distributor Suite',
      users: 'Depot Storekeeper (P4) + Dispatch Billing Clerk (P3)',
      script:
        '"Morning 15-SKU blind counter on mobile (P4) paired with automated corridor rate-cap checking on every outbound lorry bill (P3)."',
    },
  },
  {
    id: 'p1_p2_p4',
    codeLabel: 'P4 ➔ P1 ➔ P2',
    commercialName: 'Zero-Stoppage Plant Operations Trilogy',
    tagline: 'Complete internal plant loop: Physical Bin Truth (P4) ➔ Working Capital Freeze (P1) ➔ 95%+ Strict Gate OTIF (P2).',
    sequence: ['p4', 'p1', 'p2'],
    targetBuyer: 'Tier-1 OEM Suppliers & Precision Engineering Plants (₹30Cr–₹150Cr)',
    whyCrazyGood:
      'Fixes the entire internal factory floor from stores to gate: P4 ensures physical bin counts match Tally and fast movers never stock out; P1 liquidates dead >180d stock to free cash; and P2 enforces strict on-time, in-full gate departures.',
    uniqueProductIdea:
      '"The 30-Day OEM Vendor-Rating Upgrade Program": Take a Tier-1 supplier from 72% OTIF to 94% OTIF while releasing ₹8L+ in trapped inventory.',
    dfyAgencyPitch: {
      price: '₹75,000 30-Day Plant Turnaround Sprint',
      deliverable: 'Full Store Re-Slotting & Ghost-Stock Cleanup (P4) + Dead Stock Liquidation (P1) + Gate Clock OTIF Deployment (P2).',
      script:
        '"If an OEM customer is threatening to cut your vendor rating for late or short deliveries, we fix the root cause from your physical bins (P4) to your purchase ledger (P1) to your factory gate clock (P2) in 30 days."',
    },
    directSaasPitch: {
      price: '₹19,500 / month Plant Ops OS',
      users: 'Storekeeper (P4) + Purchase Head (P1) + Gate Guard & Plant Head (P2)',
      script:
        '"Complete shop-floor visibility from bin count to purchase freeze to gate departure timestamp."',
    },
  },
];

const ENGINE_META: Record<
  EngineKey,
  { code: string; shortName: string; commercialTitle: string; color: string; badgeBg: string; icon: React.ComponentType<any> }
> = {
  p1: {
    code: 'P1',
    shortName: 'Cash Recovery',
    commercialTitle: 'Cash Recovery Engine (Dead Inventory)',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    icon: Package,
  },
  p2: {
    code: 'P2',
    shortName: 'Promise OTIF',
    commercialTitle: 'Customer Promise Reliability Engine (OTIF)',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    icon: Truck,
  },
  p3: {
    code: 'P3',
    shortName: 'Profit Protection',
    commercialTitle: 'Profit Protection Engine (Freight)',
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
    icon: Scale,
  },
  p4: {
    code: 'P4',
    shortName: 'Warehouse Trust',
    commercialTitle: 'Warehouse Reliability Engine (Bin Accuracy)',
    color: 'text-fuchsia-400',
    badgeBg: 'bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-300',
    icon: ScanBarcode,
  },
  p5: {
    code: 'P5',
    shortName: 'Monday Tower',
    commercialTitle: 'Monday Control Tower & Debtors',
    color: 'text-rose-400',
    badgeBg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
    icon: Radio,
  },
};

interface CustomBundleCombinatorProps {
  useCommercialNames: boolean;
  onOpenSmartMapper: (engine?: 'p1' | 'p2' | 'p3' | 'p4' | 'p5') => void;
}

export const CustomBundleCombinator: React.FC<CustomBundleCombinatorProps> = ({
  useCommercialNames,
  onOpenSmartMapper,
}) => {
  const [selectedSequence, setSelectedSequence] = useState<EngineKey[]>(['p1', 'p4']);
  const [activePresetId, setActivePresetId] = useState<string>('p1_p4');
  const [salesModelTab, setSalesModelTab] = useState<'dfy' | 'saas'>('dfy');
  const [activeWorkspaceEngine, setActiveWorkspaceEngine] = useState<EngineKey | 'synergy_lab'>('synergy_lab');
  const [refreshTick, setRefreshTick] = useState<number>(0);

  useEffect(() => {
    const bump = () => setRefreshTick((t) => t + 1);
    window.addEventListener('storage', bump);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('factory_suite_live_sync');
      bc.onmessage = bump;
    } catch {}
    return () => {
      window.removeEventListener('storage', bump);
      if (bc) bc.close();
    };
  }, []);

  // Pull live metrics from localStorage across all 5 engines
  const liveMetrics = useMemo(() => {
    // P1
    const p1Items = JSON.parse(localStorage.getItem('p1_stock_items') || 'null') || AMBATTUR_FABRICATION_SAMPLE;
    const p1Rules = JSON.parse(localStorage.getItem('p1_stock_rules') || 'null') || P1_DEFAULT_RULES;
    const p1Summary = generateOwnerReport(p1Items, p1Rules);

    // P2
    let p2Dispatches = INITIAL_DISPATCHES;
    let p2Rules = P2_DEFAULT_RULES;
    try {
      const savedWs = JSON.parse(localStorage.getItem('otif_workspaces_v2') || 'null');
      const activeId = localStorage.getItem('otif_active_workspace_id_v2') || INITIAL_WORKSPACES[0].id;
      if (savedWs) {
        const found = savedWs.find((w: any) => w.id === activeId) || savedWs[0];
        if (found) {
          p2Dispatches = found.dispatches || INITIAL_DISPATCHES;
          p2Rules = found.rules || P2_DEFAULT_RULES;
        }
      }
    } catch {}
    const p2Summary = calculateOTIFMetrics(p2Dispatches, p2Rules);
    const p2AnnualPenalty = (p2Summary.totalDispatches - p2Summary.passes) * 15000 * 12;

    // P3
    const p3Trips = JSON.parse(localStorage.getItem('freight_audit_trips_v1') || 'null') || INITIAL_TRIPS;
    const p3Rules = JSON.parse(localStorage.getItem('freight_audit_rules_v1') || 'null') || P3_DEFAULT_RULES;
    const p3Summary = calculateAuditMetrics(p3Trips, p3Rules);
    const p3AnnualLeak = p3Summary.totals.totalLeak * 6;

    // P4
    const p4Items = JSON.parse(localStorage.getItem('binaudit_skus_v1') || 'null') || P4_INITIAL_SKUS;
    const p4Rules = JSON.parse(localStorage.getItem('binaudit_rules_v1') || 'null') || P4_DEFAULT_RULES;
    const p4Summary = computeP4Summary(p4Items, p4Rules);
    const p4Shortages = computePredictiveShortages(p4Items, p4Rules);
    const p4AnnualGhostAndSpotBleed = p4Summary.shelfShortRupees * 4 + p4Shortages.filter((s) => s.severity === 'critical').length * 48000;

    // P5
    const p5Tower =
      JSON.parse(localStorage.getItem('monday_tower_data_v1') || localStorage.getItem('monday_control_tower_v1') || 'null') ||
      INITIAL_TOWER_DATA;

    return {
      p1Items,
      p1Summary,
      p2Summary,
      p2AnnualPenalty,
      p3Summary,
      p3AnnualLeak,
      p4Items,
      p4Summary,
      p4Shortages,
      p4AnnualGhostAndSpotBleed,
      p5Tower,
    };
  }, [selectedSequence, activeWorkspaceEngine, refreshTick]);

  const handleSelectPreset = (preset: PresetBundle) => {
    setActivePresetId(preset.id);
    setSelectedSequence(preset.sequence);
    setActiveWorkspaceEngine('synergy_lab');
  };

  const handleToggleEngineInCustom = (eng: EngineKey) => {
    setActivePresetId('custom');
    setSelectedSequence((prev) => {
      if (prev.includes(eng)) {
        if (prev.length === 1) return prev; // Keep at least 1
        return prev.filter((k) => k !== eng);
      }
      return [...prev, eng];
    });
    setActiveWorkspaceEngine('synergy_lab');
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    setActivePresetId('custom');
    setSelectedSequence((prev) => {
      const copy = [...prev];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // Match active preset or synthesize a dynamic custom bundle profile
  const currentPreset = useMemo(() => {
    const exactMatch = STRATEGIC_BUNDLE_PRESETS.find(
      (p) =>
        p.sequence.length === selectedSequence.length &&
        p.sequence.every((val, i) => val === selectedSequence[i])
    );
    if (exactMatch) return exactMatch;

    const codeLabel = selectedSequence.map((k) => k.toUpperCase()).join(' ➔ ');
    const commLabel = selectedSequence.map((k) => ENGINE_META[k].shortName).join(' + ');
    const leadEngine = ENGINE_META[selectedSequence[0]];
    const anchorEngine = ENGINE_META[selectedSequence[selectedSequence.length - 1]];

    return {
      id: 'custom',
      codeLabel,
      commercialName: `Custom Phased Rollout: ${commLabel}`,
      tagline: `Phase 1 Entry via ${leadEngine.commercialTitle} ➔ Scaling into ${anchorEngine.commercialTitle}.`,
      sequence: selectedSequence,
      targetBuyer: 'Custom Tailored Industrial / Distribution Client',
      whyCrazyGood: `By leading with ${leadEngine.code} (${leadEngine.shortName}) as your low-friction Phase-1 wedge, you win immediate trust and self-fund the engagement before introducing ${selectedSequence.slice(1).map((k) => ENGINE_META[k].code).join(' & ')} as your operational expansion and retention anchor.`,
      uniqueProductIdea: `"Phased ${selectedSequence.length}-Stage Factory Transformation": Stage 1 (${leadEngine.shortName}) proves ROI in 72 hours; Stage ${selectedSequence.length} (${anchorEngine.shortName}) locks in the recurring monthly retainer.`,
      dfyAgencyPitch: {
        price: `₹${(selectedSequence.length * 15000).toLocaleString('en-IN')} Phased Diagnostic & Monthly Retainer`,
        deliverable: `Combined Executive Audit across ${commLabel}`,
        script: `"Instead of overwhelming your team with 5 tools at once, we start in Week 1 with ${leadEngine.commercialTitle} to unlock immediate cash, then layer in ${selectedSequence.slice(1).map((k) => ENGINE_META[k].shortName).join(' and ')} once the first audit pays for itself."`,
      },
      directSaasPitch: {
        price: `₹${(selectedSequence.length * 5500).toLocaleString('en-IN')} / month Modular Suite License`,
        users: `Modular Role Access for ${commLabel}`,
        script: `"Activate only the ${selectedSequence.length} modules your plant needs today (${codeLabel}) with unified cross-module alerts."`,
      },
    } as PresetBundle;
  }, [selectedSequence]);

  // Calculate dynamic Balance Sheet Cash vs Annual P&L Bleed strictly for the selected engines in this combination
  const comboFinancials = useMemo(() => {
    let balanceSheetCash = 0;
    let annualPnLBleed = 0;

    if (selectedSequence.includes('p1')) {
      balanceSheetCash += liveMetrics.p1Summary.deadCash + liveMetrics.p1Summary.slowCash;
      annualPnLBleed += liveMetrics.p1Summary.annualHoldingBurn;
    }
    if (selectedSequence.includes('p2')) {
      annualPnLBleed += liveMetrics.p2AnnualPenalty;
    }
    if (selectedSequence.includes('p3')) {
      annualPnLBleed += liveMetrics.p3AnnualLeak;
    }
    if (selectedSequence.includes('p4')) {
      annualPnLBleed += liveMetrics.p4AnnualGhostAndSpotBleed;
    }
    if (selectedSequence.includes('p5')) {
      balanceSheetCash += liveMetrics.p5Tower.unpaidBillsRupees;
    }

    return { balanceSheetCash, annualPnLBleed };
  }, [selectedSequence, liveMetrics]);

  // Generate Dynamic Cross-Engine Forensic Insights based on which pairs are active!
  const crossEngineInsights = useMemo(() => {
    const insights: { title: string; badge: string; detail: string; impact: string }[] = [];
    const has = (k: EngineKey) => selectedSequence.includes(k);

    if (has('p1') && has('p4')) {
      insights.push({
        title: 'P1 × P4 Forensic Cross-Check: "Moving Class-A Ghost Stock" & Counter Hoarding',
        badge: 'P1 + P4 Synergy',
        detail: `P1 shows ${formatCurrency(liveMetrics.p1Summary.deadCash, 'INR')} in Dead Stock (>180d idle), while P4 shows ${liveMetrics.p4Summary.linesMismatch} bins where physical hand count is lower than Tally computer stock (${formatCurrency(liveMetrics.p4Summary.shelfShortRupees, 'INR')} missing). Cross-auditing both prevents Purchase from trusting fake Tally quantities on fast movers while clearing dead metal out of prime bins.`,
        impact: `Protects ${formatCurrency(liveMetrics.p1Summary.deadCash + liveMetrics.p4AnnualGhostAndSpotBleed, 'INR')} in combined stock & bay uptime`,
      });
    }

    if (has('p2') && has('p3')) {
      const qcAndPackingFails = liveMetrics.p2Summary.reasonStats
        .filter((r) => r.reason.includes('QC') || r.reason.includes('Packing'))
        .reduce((acc, r) => acc + r.count, 0);
      insights.push({
        title: 'P2 × P3 Forensic Cross-Check: Internal QC/Packing Holds Driving External Lorry Detention Bills',
        badge: 'P2 + P3 Synergy',
        detail: `In P3, you paid ${formatCurrency(liveMetrics.p3Summary.totals.detention, 'INR')} in lorry gate-waiting detention charges. Cross-checking P2 reveals ${qcAndPackingFails} dispatches were held at the gate due to internal QC Hold & Packing Delays—proving internal shop-floor holds are directly causing transporter halting bills!`,
        impact: `Eliminates ${formatCurrency(liveMetrics.p3AnnualLeak, 'INR')}/yr in freight & detention bleed`,
      });
    }

    if (has('p1') && has('p3')) {
      insights.push({
        title: 'P1 × P3 Back-Office Wedge: Zero-Shop-Floor Balance Sheet + P&L Recovery',
        badge: 'P1 + P3 Synergy',
        detail: `Requires zero shop-floor hardware or worker behavior change. Combines ${formatCurrency(liveMetrics.p1Summary.deadCash, 'INR')} in P1 Dead Stock liquidation with ${formatCurrency(liveMetrics.p3AnnualLeak, 'INR')}/yr in P3 Corridor Rate & Detention recovery using only 2 spreadsheets from Accounts.`,
        impact: `Fastest 72-hour diagnostic proof for skeptical promoters`,
      });
    }

    if (has('p2') && has('p4')) {
      insights.push({
        title: 'P2 × P4 Fulfillment Loop: Pre-Promise Bin Verification Stops Short-Shipments',
        badge: 'P2 + P4 Synergy',
        detail: `P2 recorded ${liveMetrics.p2Summary.failsShortOnly + liveMetrics.p2Summary.failsLateAndShort} Quantity Short-Ship failures. Linking P4’s ${liveMetrics.p4Shortages.filter((s) => s.severity === 'critical').length} critical low-cover bins to the morning dispatch schedule stops short-shipped OEM penalties before the truck arrives.`,
        impact: `Saves ${formatCurrency(liveMetrics.p2AnnualPenalty, 'INR')}/yr in SLA debit notes`,
      });
    }

    if (has('p5')) {
      insights.push({
        title: `P5 Executive Habit Lock-In: Monday 9:00 AM Board + ${formatCurrency(liveMetrics.p5Tower.unpaidBillsRupees, 'INR')} Overdue Debtors`,
        badge: 'P5 Retainer Anchor',
        detail: `Wraps your selected engines (${selectedSequence.map((k) => k.toUpperCase()).join('+')}) into a 15-minute Monday morning owner habit, adding Tally Sundry Debtors overdue >${liveMetrics.p5Tower.normalCreditDays} days so the promoter never cancels your monthly retainer.`,
        impact: `Unlocks ${formatCurrency(liveMetrics.p5Tower.unpaidBillsRupees, 'INR')} in overdue customer receivables`,
      });
    }

    if (insights.length === 0) {
      const first = ENGINE_META[selectedSequence[0]];
      insights.push({
        title: `Focused Single-Engine Deployment: ${first.commercialTitle}`,
        badge: first.code,
        detail: `Add a second or third module above (like P1+P4 or P1+P3+P5) to unlock cross-engine forensic correlations.`,
        impact: `Focused standalone execution`,
      });
    }

    return insights;
  }, [selectedSequence, liveMetrics]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Combinator Hero */}
      <div className="bg-gradient-to-b from-indigo-950/60 via-slate-900 to-slate-950 border-b border-indigo-500/30 px-4 sm:px-6 lg:px-8 py-6 no-print">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[11px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Modular Bundle &amp; Phased Sequence Combinator</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Merge &amp; Sequence Engines in Any Order ({currentPreset.codeLabel})
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Instead of pitching all 5 modules at once, combine specific engines (like <strong>P1 + P4</strong>, <strong>P1 + P3 + P5</strong>, or <strong>P2 + P3</strong>) or change the rollout sequence to discover high-margin product angles, cross-engine forensic truths, and dual DFY/SaaS pitches.
              </p>
            </div>

            {/* Live Financial Totals for the Selected Combination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
              <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-3.5 text-right">
                <div className="text-[10px] font-mono uppercase text-amber-300 font-bold">
                  Combo Balance-Sheet Cash ({currentPreset.codeLabel})
                </div>
                <div className="text-xl font-black font-mono text-amber-400 mt-0.5">
                  {formatCurrency(comboFinancials.balanceSheetCash, 'INR')}
                </div>
                <div className="text-[10px] text-slate-400">One-Time Trapped Cash Unlock</div>
              </div>
              <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-3.5 text-right">
                <div className="text-[10px] font-mono uppercase text-emerald-300 font-bold">
                  Combo Annual P&amp;L Bleed ({currentPreset.codeLabel})
                </div>
                <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                  {formatCurrency(comboFinancials.annualPnLBleed, 'INR')}/yr
                </div>
                <div className="text-[10px] text-slate-400">Recurring Yearly Margin Saved</div>
              </div>
            </div>
          </div>

          {/* 1-Click High-Margin Strategic Presets */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Select a Curated High-Margin Combination Preset:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {STRATEGIC_BUNDLE_PRESETS.map((preset) => {
                const isSelected = currentPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600/25 border-indigo-400 shadow-lg ring-1 ring-indigo-400/50'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-black">
                          {preset.codeLabel}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </div>
                      <div className="text-xs font-bold text-white leading-snug mt-1">
                        {preset.commercialName}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2 line-clamp-2">
                      {preset.tagline}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Interactive Sequence Builder (Toggle Any P1-P5 & Reorder Sequence) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>2. Or Build &amp; Reorder Your Own Custom Engine Sequence (Click to Toggle ON/OFF, Arrows to Change Rollout Order):</span>
              </div>
              <button
                onClick={() => onOpenSmartMapper('p1')}
                className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Smart Tally/Excel Column Mapper</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['p1', 'p2', 'p3', 'p4', 'p5'] as EngineKey[]).map((eng) => {
                const meta = ENGINE_META[eng];
                const Icon = meta.icon;
                const activeIdx = selectedSequence.indexOf(eng);
                const isSelected = activeIdx !== -1;

                return (
                  <button
                    key={eng}
                    onClick={() => handleToggleEngineInCustom(eng)}
                    className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                      isSelected
                        ? `${meta.badgeBg} shadow-sm`
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>
                      {useCommercialNames ? meta.commercialTitle : `${meta.code} (${meta.shortName})`}
                    </span>
                    {isSelected && (
                      <span className="px-1.5 py-0.2 rounded-full bg-slate-950/80 text-white font-mono text-[10px]">
                        Step #{activeIdx + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Phased Sequence Pipeline with Reorder Controls */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase text-slate-400 mr-1">
                Active Rollout Order:
              </span>
              {selectedSequence.map((eng, idx) => {
                const meta = ENGINE_META[eng];
                const roleLabel =
                  idx === 0
                    ? 'Phase 1: Entry Wedge'
                    : idx === selectedSequence.length - 1
                    ? `Phase ${idx + 1}: Retainer Anchor`
                    : `Phase ${idx + 1}: Expansion`;
                return (
                  <React.Fragment key={eng}>
                    {idx > 0 && <ArrowRight className="w-4 h-4 text-slate-500" />}
                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
                      <span className="text-[10px] font-mono text-indigo-400 font-bold">{roleLabel}:</span>
                      <span className="font-bold text-white">
                        {useCommercialNames ? meta.shortName : meta.code}
                      </span>
                      <div className="flex items-center gap-0.5 ml-1">
                        <button
                          onClick={() => handleMoveOrder(idx, 'up')}
                          disabled={idx === 0}
                          className="p-0.5 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300 cursor-pointer"
                          title="Move earlier in rollout sequence"
                        >
                          <ArrowUp className="w-3 h-3 -rotate-90" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(idx, 'down')}
                          disabled={idx === selectedSequence.length - 1}
                          className="p-0.5 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300 cursor-pointer"
                          title="Move later in rollout sequence"
                        >
                          <ArrowDown className="w-3 h-3 -rotate-90" />
                        </button>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Switch between Synergy Lab Analysis & Live Embedded Engines */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Sub-Navigation Bar for Active Combination */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-2 rounded-xl border border-slate-800 no-print">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveWorkspaceEngine('synergy_lab')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                activeWorkspaceEngine === 'synergy_lab'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{currentPreset.codeLabel} Synergy &amp; Pitch Blueprint</span>
            </button>

            {selectedSequence.map((eng, idx) => {
              const meta = ENGINE_META[eng];
              const Icon = meta.icon;
              return (
                <button
                  key={eng}
                  onClick={() => setActiveWorkspaceEngine(eng)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                    activeWorkspaceEngine === eng
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>
                    Open Phase {idx + 1}: {useCommercialNames ? meta.commercialTitle : `${meta.code} (${meta.shortName})`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {activeWorkspaceEngine === 'synergy_lab' ? (
          <div className="space-y-6">
            {/* Why This Combination Is Crazy Good + Unique Product Idea */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono text-xs font-bold">
                    Strategic Forensic Advantage: {currentPreset.codeLabel}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Target: {currentPreset.targetBuyer}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">
                  {currentPreset.commercialName}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentPreset.whyCrazyGood}
                </p>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <div className="text-[11px] font-mono uppercase text-amber-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Standalone Product / Offer Idea Unlocked by {currentPreset.codeLabel}:</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-white">
                    {currentPreset.uniqueProductIdea}
                  </p>
                </div>
              </div>

              {/* Dual Business Model Playbook (Prepared for BOTH DFY Agency & Direct SaaS!) */}
              <div className="lg:col-span-5 bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-emerald-400 font-bold">
                      Dual Monetization Playbook (Prepared for Both Models)
                    </span>
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setSalesModelTab('dfy')}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition flex items-center gap-1 ${
                          salesModelTab === 'dfy'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Briefcase className="w-3 h-3" />
                        <span>Model A: DFY Audit</span>
                      </button>
                      <button
                        onClick={() => setSalesModelTab('saas')}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition flex items-center gap-1 ${
                          salesModelTab === 'saas'
                            ? 'bg-indigo-500 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Building2 className="w-3 h-3" />
                        <span>Model B: Direct SaaS</span>
                      </button>
                    </div>
                  </div>

                  {salesModelTab === 'dfy' ? (
                    <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-slate-400">
                          Done-For-You Agency Pricing (You Run the Tool)
                        </div>
                        <div className="text-base font-black text-emerald-400 mt-0.5">
                          {currentPreset.dfyAgencyPitch.price}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-slate-400">
                          What You Hand the Factory Owner
                        </div>
                        <div className="text-xs text-slate-200 font-medium mt-0.5">
                          {currentPreset.dfyAgencyPitch.deliverable}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-800">
                        <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                          Word-for-Word Promoter Pitch Script:
                        </div>
                        <p className="text-xs italic text-slate-200 mt-1 leading-relaxed">
                          {currentPreset.dfyAgencyPitch.script}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-slate-400">
                          Direct Factory SaaS Pricing (Their Staff Uses It)
                        </div>
                        <div className="text-base font-black text-indigo-400 mt-0.5">
                          {currentPreset.directSaasPitch.price}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-slate-400">
                          Factory Staff Roles Involved
                        </div>
                        <div className="text-xs text-slate-200 font-medium mt-0.5">
                          {currentPreset.directSaasPitch.users}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-800">
                        <div className="text-[10px] font-mono uppercase text-indigo-300 font-bold">
                          Word-for-Word SaaS Demo Pitch Script:
                        </div>
                        <p className="text-xs italic text-slate-200 mt-1 leading-relaxed">
                          {currentPreset.directSaasPitch.script}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live Cross-Engine Forensic Correlations Unlocked by This Combination */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span>
                    Live Cross-Engine Forensic Correlations Unlocked by {currentPreset.codeLabel}
                  </span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Computed from your live localStorage ledgers
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {crossEngineInsights.map((ins, i) => (
                  <div
                    key={i}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-[10px] font-bold uppercase">
                        {ins.badge}
                      </span>
                      <h4 className="text-sm font-bold text-white">{ins.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{ins.detail}</p>
                    </div>
                    <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-emerald-400">{ins.impact}</span>
                      <button
                        onClick={() => setActiveWorkspaceEngine(selectedSequence[0])}
                        className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                      >
                        Inspect Live Data ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* SKU-Level P1 x P4 Cross-Verification Table when both P1 and P4 are selected */}
              {selectedSequence.includes('p1') && selectedSequence.includes('p4') && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2.5 no-print">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold font-mono uppercase text-fuchsia-300">
                      Live P1 (Dead Inventory Ledger) × P4 (Physical Bin Audit) Cross-Verification Matrix
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Matches overlapping SKU codes or flags unverified dead/missing stock
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                        <tr>
                          <th className="py-2 px-3">SKU / Part</th>
                          <th className="py-2 px-3">Source Engine</th>
                          <th className="py-2 px-3 text-right">ERP / Tally Qty</th>
                          <th className="py-2 px-3 text-right">Physical Bin Qty</th>
                          <th className="py-2 px-3">Forensic Verdict</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {liveMetrics.p4Items.slice(0, 5).map((p4Sku: any) => {
                          const matchedP1 = liveMetrics.p1Items.find(
                            (x: any) =>
                              String(x.itemCode || '').toLowerCase() === String(p4Sku.code || '').toLowerCase() ||
                              String(x.itemName || '').toLowerCase().includes(String(p4Sku.part || '').split(' ')[0].toLowerCase())
                          );
                          const diff = p4Sku.physicalQty - p4Sku.systemQty;
                          return (
                            <tr key={p4Sku.id} className="hover:bg-slate-900/50">
                              <td className="py-2 px-3 font-sans">
                                <div className="font-bold text-white">{p4Sku.code} — {p4Sku.part}</div>
                                <div className="text-[10px] text-slate-400">Bin Zone: {p4Sku.spot}</div>
                              </td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 text-[10px]">
                                  {matchedP1 ? 'P1 + P4 Matched SKU' : 'P4 Bin Audit Ledger'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right text-slate-300">{p4Sku.systemQty} pcs</td>
                              <td className="py-2 px-3 text-right font-bold text-white">{p4Sku.physicalQty} pcs</td>
                              <td className="py-2 px-3 font-sans">
                                {diff < 0 ? (
                                  <span className="text-rose-400 font-semibold">
                                    Ghost Stock ({diff} pcs missing — {formatCurrency(Math.abs(diff * p4Sku.cost), 'INR')})
                                  </span>
                                ) : diff > 0 ? (
                                  <span className="text-amber-300 font-semibold">
                                    Unlogged Excess (+{diff} pcs on shelf)
                                  </span>
                                ) : (
                                  <span className="text-emerald-400 font-semibold">✓ Verified 100% Trust</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Live Discovery Questionnaire, Auto-Recommender & Dual-Option Proposal Generator */}
            <InteractiveDealCloser
              onApplyRecommendedSequence={(seq, presetId) => {
                setSelectedSequence(seq);
                if (presetId) setActivePresetId(presetId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* 1-Click Live Cash-Recovery Execution Documents (Debit Notes, Liquidation RFQs, Reorder Indents) */}
            <RecoveryActionDocsGenerator />
          </div>
        ) : (
          /* Render the selected engine directly inside the custom bundle */
          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 shadow-2xl">
            {activeWorkspaceEngine === 'p1' && <Project1App />}
            {activeWorkspaceEngine === 'p2' && <Project2App />}
            {activeWorkspaceEngine === 'p3' && <Project3App />}
            {activeWorkspaceEngine === 'p4' && <Project4App />}
            {activeWorkspaceEngine === 'p5' && (
              <Project5App
                onJumpToEngine={(eng) => {
                  setActiveWorkspaceEngine(eng);
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
