/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  ExternalLink,
  Package,
  Truck,
  Scale,
  ScanBarcode,
  Sparkles,
  AlertTriangle,
  Copy,
  Check,
  RotateCcw,
  Plus,
  Filter,
  Share2,
  Building2,
  Calendar,
  User,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Flame,
  Zap,
} from 'lucide-react';
import { MondayTowerData, UserRole, Language } from '../types';
import { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES as P1_DEFAULT_RULES } from '../../project1/data/initialData';
import { generateOwnerReport } from '../../project1/utils/calculations';
import { INITIAL_DISPATCHES, INITIAL_RULES as P2_DEFAULT_RULES } from '../../project2/data/initialData';
import { INITIAL_WORKSPACES } from '../../project2/data/factoryWorkspaces';
import { calculateOTIFMetrics } from '../../project2/utils/otifCalculator';
import { INITIAL_TRIPS, DEFAULT_RULES as P3_DEFAULT_RULES } from '../../project3/data/defaultData';
import { calculateAuditMetrics } from '../../project3/utils/auditCalculations';
import { INITIAL_SAMPLE_SKUS as P4_INITIAL_SKUS, DEFAULT_RULES as P4_DEFAULT_RULES } from '../../project4/data/sampleData';
import { computePredictiveShortages } from '../../project4/utils/auditCalculations';

export type HuddleEngineKey = 'p1' | 'p2' | 'p3' | 'p4';

export interface HuddleActionItem {
  id: string;
  engine: HuddleEngineKey;
  engineBadge: string;
  engineTitle: string;
  rank: number; // 1, 2, or 3
  isTopCrossEngine: boolean; // Flagged as one of the CEO super-critical 3
  title: string;
  description: string;
  rootCause: string;
  impactRupees: number;
  impactLabel: string;
  owner: string;
  targetTime: string; // e.g. "09:30 AM"
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  resolutionNote?: string;
}

interface DailyHuddleViewProps {
  towerData: MondayTowerData;
  isDarkMode: boolean;
  language: Language;
  role: UserRole;
  onJumpToEngine?: (engine: 'p1' | 'p2' | 'p3' | 'p4') => void;
}

const STORAGE_KEY_HUDDLE_ACTIONS = 'monday_control_tower_daily_huddle_v2';
const STORAGE_KEY_HUDDLE_DATE = 'monday_control_tower_huddle_date_v2';

function formatINR(val: number): string {
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

function formatShortINR(val: number): string {
  if (Math.abs(val) >= 10000000) {
    const cr = val / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (Math.abs(val) >= 100000) {
    const lakhs = val / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  if (Math.abs(val) >= 1000) {
    return `₹${Math.round(val / 1000)}K`;
  }
  return formatINR(val);
}

function getTodayFormatted(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Builds the calibrated top 3 actions for P1, P2, P3, P4
 * based on live storage or standard factory benchmarks.
 */
function buildDefaultHuddleActions(): HuddleActionItem[] {
  // P1 Live Data Check
  let p1DeadCash = 223110;
  try {
    const p1Items = JSON.parse(localStorage.getItem('p1_stock_items') || 'null') || AMBATTUR_FABRICATION_SAMPLE;
    const p1Rules = JSON.parse(localStorage.getItem('p1_stock_rules') || 'null') || P1_DEFAULT_RULES;
    const rep = generateOwnerReport(p1Items, p1Rules);
    p1DeadCash = rep.deadCash || 223110;
  } catch {}

  // P2 Live Data Check
  let p2LateCount = 7;
  try {
    let p2Dispatches = INITIAL_DISPATCHES;
    let p2Rules = P2_DEFAULT_RULES;
    const savedWsList = localStorage.getItem('otif_workspaces_v2');
    const savedActiveId = localStorage.getItem('otif_active_workspace_id_v2') || INITIAL_WORKSPACES[0].id;
    if (savedWsList) {
      const parsed = JSON.parse(savedWsList);
      const found = parsed.find((w: any) => w.id === savedActiveId) || parsed[0];
      if (found) {
        p2Dispatches = found.dispatches || INITIAL_DISPATCHES;
        p2Rules = found.rules || P2_DEFAULT_RULES;
      }
    }
    const metrics = calculateOTIFMetrics(p2Dispatches, p2Rules);
    p2LateCount = metrics.failsLateOnly + metrics.failsLateAndShort;
  } catch {}

  return [
    // ==========================================
    // P1: DEAD STOCK RECOVERY ENGINE (3 ACTIONS)
    // ==========================================
    {
      id: 'huddle-p1-1',
      engine: 'p1',
      engineBadge: 'P1 • Cash Recovery',
      engineTitle: 'Dead Stock Recovery',
      rank: 1,
      isTopCrossEngine: true, // Super-critical #1
      title: 'Issue Tally Prime Debit Note for Dead SS Flanges (FG-FLG-150)',
      description: '25 units of 150NB SS Flanges have remained untouched for 232 days in Rack D-04. Issue contra debit note to original supplier or book authorized scrap salvage.',
      rootCause: 'Engineering revision switched to PN16 flanges; cancelled project inventory never flagged to purchasing.',
      impactRupees: 46250,
      impactLabel: '₹46.2K Dead Cash',
      owner: 'Stores Incharge & Plant Accounts',
      targetTime: '10:30 AM',
      urgency: 'CRITICAL',
      completed: false,
    },
    {
      id: 'huddle-p1-2',
      engine: 'p1',
      engineBadge: 'P1 • Cash Recovery',
      engineTitle: 'Dead Stock Recovery',
      rank: 2,
      isTopCrossEngine: false,
      title: 'Authorize Scrap Disposition for Obsolete Gen-1 Panel Boxes (FG-PBX-G1)',
      description: '14 units idle for 413 days (>1 year) occupying 4 critical pallet positions. Floor space holding cost exceeds scrap recovery.',
      rootCause: 'OEM customer phased out Gen-1 enclosure specifications in mid-2025.',
      impactRupees: 71400,
      impactLabel: '₹71.4K Blocked Cash',
      owner: 'Production Head & Scrap Committee',
      targetTime: '01:30 PM',
      urgency: 'HIGH',
      completed: false,
    },
    {
      id: 'huddle-p1-3',
      engine: 'p1',
      engineBadge: 'P1 • Cash Recovery',
      engineTitle: 'Dead Stock Recovery',
      rank: 3,
      isTopCrossEngine: false,
      title: 'Initiate Supplier Buyback for Surplus 15mm Copper Pipe (RM-COP-15)',
      description: '120 meters idle for 198 days. Coordinate with approved copper vendor for 85% raw material buyback contra entry.',
      rootCause: 'Safety buffer over-purchased during volatile copper commodity market surge.',
      impactRupees: 38400,
      impactLabel: '₹38.4K Trapped Working Capital',
      owner: 'Procurement Executive',
      targetTime: '03:45 PM',
      urgency: 'MEDIUM',
      completed: false,
    },

    // ==========================================
    // P2: PROMISE OTIF DISPATCHES (3 ACTIONS)
    // ==========================================
    {
      id: 'huddle-p2-1',
      engine: 'p2',
      engineBadge: 'P2 • Promise OTIF',
      engineTitle: 'Customer Promise & Delivery',
      rank: 1,
      isTopCrossEngine: true, // Super-critical #2
      title: 'Expedite Hyundai Tier-1 Brake Drum Mounts (SO-8842)',
      description: 'Critical OEM consignment for Sriperumbudur plant. Dedicated carrier truck must pass factory security gate by 11:30 AM cutoff to prevent ₹75,000 hourly line-stoppage penalty.',
      rootCause: 'Machining cell 3 tooling changeover delayed final QA dimensional signoff by 45 minutes.',
      impactRupees: 75000,
      impactLabel: '₹75K Penalty & SLA Risk',
      owner: 'Dispatch Desk & Floor QC Lead',
      targetTime: '11:15 AM (Gate Cutoff)',
      urgency: 'CRITICAL',
      completed: false,
    },
    {
      id: 'huddle-p2-2',
      engine: 'p2',
      engineBadge: 'P2 • Promise OTIF',
      engineTitle: 'Customer Promise & Delivery',
      rank: 2,
      isTopCrossEngine: false,
      title: 'Enforce Dual-Gate Security Signoff on Ashok Leyland Load (SO-8839)',
      description: 'Vehicle TN-04-E-4819 arriving at loading bay. Security kiosk must verify actual piece count matches ERP e-Way bill before final gate-out timestamping.',
      rootCause: 'Past dispatch discrepancy where driver departed before secondary gate guard count.',
      impactRupees: 185000,
      impactLabel: '₹1.85L Consignment Protection',
      owner: 'Security Gate Sergeant & Dispatch Clerk',
      targetTime: '02:00 PM',
      urgency: 'HIGH',
      completed: false,
    },
    {
      id: 'huddle-p2-3',
      engine: 'p2',
      engineBadge: 'P2 • Promise OTIF',
      engineTitle: 'Customer Promise & Delivery',
      rank: 3,
      isTopCrossEngine: false,
      title: 'Pre-Pack & Seal TVS Motor Steering Knuckles (SO-8845)',
      description: 'Ensure 100% full quantity (320 units) packed in barcoded returnable plastic crates to maintain Tier-1 98% OTIF ranking for Q3.',
      rootCause: 'Last fortnight suffered 83% In-Full due to short-shipping 18 units in loose cartons.',
      impactRupees: 112000,
      impactLabel: 'Tier-1 Supplier Rating Shield',
      owner: 'Packaging Supervisor',
      targetTime: '04:15 PM',
      urgency: 'MEDIUM',
      completed: false,
    },

    // ==========================================
    // P3: FREIGHT & MARGIN PROTECTION (3 ACTIONS)
    // ==========================================
    {
      id: 'huddle-p3-1',
      engine: 'p3',
      engineBadge: 'P3 • Margin Protection',
      engineTitle: 'Freight Leaks & Profit',
      rank: 1,
      isTopCrossEngine: false,
      title: 'Issue ₹8,400 Carrier Debit Note on VRL Logistics Trip (TR-4420)',
      description: 'Transporter billed off-contract rate of ₹36,400 for Chennai -> Hosur 10-ton lane vs contracted rate of ₹28,000. Generate formal Debit Note contra voucher.',
      rootCause: 'Transporter submitted spot-rate invoice claiming diesel price fluctuation not in agreed SLA.',
      impactRupees: 8400,
      impactLabel: '₹8.4K Recoverable Overcharge',
      owner: 'Logistics Accounts Clerk',
      targetTime: '12:00 PM',
      urgency: 'HIGH',
      completed: false,
    },
    {
      id: 'huddle-p3-2',
      engine: 'p3',
      engineBadge: 'P3 • Margin Protection',
      engineTitle: 'Freight Leaks & Profit',
      rank: 2,
      isTopCrossEngine: false,
      title: 'Reject SafeXpress Unverified ₹4,200 Detention Surcharge (TR-4428)',
      description: 'SafeXpress logged 3.5 hour detention at gate. Cross-verify with security biometric in/out logs which confirm turnaround was under 75 minutes.',
      rootCause: 'Driver logged GPS delay outside factory perimeter as plant detention.',
      impactRupees: 4200,
      impactLabel: '₹4.2K False Detention Claim',
      owner: 'Transport Coordinator',
      targetTime: '03:15 PM',
      urgency: 'MEDIUM',
      completed: false,
    },
    {
      id: 'huddle-p3-3',
      engine: 'p3',
      engineBadge: 'P3 • Margin Protection',
      engineTitle: 'Freight Leaks & Profit',
      rank: 3,
      isTopCrossEngine: false,
      title: 'Reconcile ARC Return Empty Container Credit Voucher (₹3,600)',
      description: 'Associated Road Carriers return haul of 40 collapsible metal stillages. Deduct agreed container backhaul rebate from weekly billing sheet.',
      rootCause: 'Reverse logistics rebate credited to suspense ledger instead of freight clearing.',
      impactRupees: 3600,
      impactLabel: '₹3.6K Freight Credit Recovery',
      owner: 'Accounts Payable',
      targetTime: '04:45 PM',
      urgency: 'MEDIUM',
      completed: false,
    },

    // ==========================================
    // P4: WAREHOUSE ACCURACY & TRUST (3 ACTIONS)
    // ==========================================
    {
      id: 'huddle-p4-1',
      engine: 'p4',
      engineBadge: 'P4 • Warehouse Trust',
      engineTitle: 'Warehouse Accuracy & Bins',
      rank: 1,
      isTopCrossEngine: true, // Super-critical #3
      title: '8:30 AM Morning Shutter 4-Bin Audit for SKF Bearings (Bin B-04-12)',
      description: 'Physical count shows 12 units while ERP records 48 units. 36 units missing will halt Assembly Line 1 at 02:00 PM. Locate misplaced overflow batch immediately.',
      rootCause: 'Saturday night shift received consignment into temporary staging bin without barcode scan.',
      impactRupees: 34000,
      impactLabel: '₹8,500/hr Line Stoppage Risk',
      owner: 'Stores Controller & Lead QC Auditor',
      targetTime: '08:45 AM (Pre-Shift Start)',
      urgency: 'CRITICAL',
      completed: false,
    },
    {
      id: 'huddle-p4-2',
      engine: 'p4',
      engineBadge: 'P4 • Warehouse Trust',
      engineTitle: 'Warehouse Accuracy & Bins',
      rank: 2,
      isTopCrossEngine: false,
      title: 'Cycle Count Verification of High-Tensile M12 Fasteners (Bin A-02-08)',
      description: 'High consumption discrepancy flagged. Count 400 pcs in Bin A-02-08 before Shift B kitting begins to verify zero unaccounted shrinkage.',
      rootCause: 'Sub-assembly technicians taking fasteners without requisition slip.',
      impactRupees: 18500,
      impactLabel: '₹18.5K Kitting Discrepancy',
      owner: 'Hardware Stores Assistant',
      targetTime: '11:45 AM',
      urgency: 'HIGH',
      completed: false,
    },
    {
      id: 'huddle-p4-3',
      engine: 'p4',
      engineBadge: 'P4 • Warehouse Trust',
      engineTitle: 'Warehouse Accuracy & Bins',
      rank: 3,
      isTopCrossEngine: false,
      title: 'Audit Tool Crib & Tungsten Carbide Inserts Signoff (Bin C-01-05)',
      description: 'Reconcile physical stock of CNC turning inserts against operator punch-in records. Maintain audit-ready tool room inventory record.',
      rootCause: 'Tool room drawer key left accessible over weekend maintenance shift.',
      impactRupees: 28000,
      impactLabel: '₹28K Tool Crib Security',
      owner: 'Tool Room Incharge',
      targetTime: '03:00 PM',
      urgency: 'MEDIUM',
      completed: false,
    },
  ];
}

export const DailyHuddleView: React.FC<DailyHuddleViewProps> = ({
  towerData,
  isDarkMode,
  language,
  role,
  onJumpToEngine,
}) => {
  const [actions, setActions] = useState<HuddleActionItem[]>(() => {
    try {
      const savedDate = localStorage.getItem(STORAGE_KEY_HUDDLE_DATE);
      const todayISO = getTodayISO();
      const saved = localStorage.getItem(STORAGE_KEY_HUDDLE_ACTIONS);
      if (saved && savedDate === todayISO) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return buildDefaultHuddleActions();
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed' | 'p1' | 'p2' | 'p3' | 'p4'>('all');
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState<string>('');
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);

  // New Custom Action form state
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customEngine, setCustomEngine] = useState<HuddleEngineKey>('p2');
  const [customOwner, setCustomOwner] = useState('Floor Supervisor');
  const [customTime, setCustomTime] = useState('02:00 PM');
  const [customImpact, setCustomImpact] = useState(25000);

  // Save to localStorage whenever actions change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HUDDLE_ACTIONS, JSON.stringify(actions));
      localStorage.setItem(STORAGE_KEY_HUDDLE_DATE, getTodayISO());
    } catch (e) {
      console.warn('Failed to save huddle actions', e);
    }
  }, [actions]);

  // Handle Action Completion Toggle
  const toggleAction = (id: string) => {
    const timeString = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const roleLabel = role === 'owner' ? 'Factory Owner' : role === 'supply_chain_head' ? 'SCM Head' : 'Operations Lead';
    
    setActions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextCompleted = !item.completed;
          return {
            ...item,
            completed: nextCompleted,
            completedAt: nextCompleted ? `Today ${timeString}` : undefined,
            completedBy: nextCompleted ? roleLabel : undefined,
          };
        }
        return item;
      })
    );
  };

  // Save Resolution Note
  const saveResolutionNote = (id: string) => {
    setActions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, resolutionNote: tempNote.trim() } : item))
    );
    setEditingNoteId(null);
    setTempNote('');
  };

  // Reset Checklist to baseline
  const handleResetChecklist = () => {
    if (window.confirm("Reset today's Daily Huddle actions to baseline? All completion marks and notes will be cleared.")) {
      const fresh = buildDefaultHuddleActions();
      setActions(fresh);
      try {
        localStorage.setItem(STORAGE_KEY_HUDDLE_ACTIONS, JSON.stringify(fresh));
      } catch {}
    }
  };

  // Add Custom Action
  const handleAddCustomAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newAction: HuddleActionItem = {
      id: `huddle-custom-${Date.now()}`,
      engine: customEngine,
      engineBadge: customEngine === 'p1' ? 'P1 • Cash Recovery' : customEngine === 'p2' ? 'P2 • Promise OTIF' : customEngine === 'p3' ? 'P3 • Margin Protection' : 'P4 • Warehouse Trust',
      engineTitle: customEngine === 'p1' ? 'Dead Stock Recovery' : customEngine === 'p2' ? 'Customer Promise & Delivery' : customEngine === 'p3' ? 'Freight Leaks & Profit' : 'Warehouse Accuracy & Bins',
      rank: 4,
      isTopCrossEngine: false,
      title: customTitle.trim(),
      description: customDesc.trim() || 'Custom operational action logged during daily morning standup.',
      rootCause: 'Factory floor operational priority identified during morning shift huddle.',
      impactRupees: Number(customImpact) || 10000,
      impactLabel: `₹${(Number(customImpact) / 1000).toFixed(0)}K Priority Value`,
      owner: customOwner,
      targetTime: customTime,
      urgency: 'HIGH',
      completed: false,
    };

    setActions((prev) => [newAction, ...prev]);
    setShowAddCustomModal(false);
    setCustomTitle('');
    setCustomDesc('');
  };

  // Calculate Metrics
  const stats = useMemo(() => {
    const total = actions.length;
    const completedCount = actions.filter((a) => a.completed).length;
    const pendingCount = total - completedCount;
    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    const totalImpact = actions.reduce((sum, a) => sum + a.impactRupees, 0);
    const completedImpact = actions.filter((a) => a.completed).reduce((sum, a) => sum + a.impactRupees, 0);

    const p1Total = actions.filter((a) => a.engine === 'p1').length;
    const p1Done = actions.filter((a) => a.engine === 'p1' && a.completed).length;

    const p2Total = actions.filter((a) => a.engine === 'p2').length;
    const p2Done = actions.filter((a) => a.engine === 'p2' && a.completed).length;

    const p3Total = actions.filter((a) => a.engine === 'p3').length;
    const p3Done = actions.filter((a) => a.engine === 'p3' && a.completed).length;

    const p4Total = actions.filter((a) => a.engine === 'p4').length;
    const p4Done = actions.filter((a) => a.engine === 'p4' && a.completed).length;

    const topCrossEngineActions = actions.filter((a) => a.isTopCrossEngine);

    return {
      total,
      completedCount,
      pendingCount,
      percent,
      totalImpact,
      completedImpact,
      p1Total,
      p1Done,
      p2Total,
      p2Done,
      p3Total,
      p3Done,
      p4Total,
      p4Done,
      topCrossEngineActions,
    };
  }, [actions]);

  // Filtered Actions
  const filteredActions = useMemo(() => {
    switch (activeFilter) {
      case 'pending':
        return actions.filter((a) => !a.completed);
      case 'completed':
        return actions.filter((a) => a.completed);
      case 'p1':
        return actions.filter((a) => a.engine === 'p1');
      case 'p2':
        return actions.filter((a) => a.engine === 'p2');
      case 'p3':
        return actions.filter((a) => a.engine === 'p3');
      case 'p4':
        return actions.filter((a) => a.engine === 'p4');
      case 'all':
      default:
        return actions;
    }
  }, [actions, activeFilter]);

  // Generate WhatsApp Standup Text
  const generateWhatsAppHuddleText = (): string => {
    const todayStr = getTodayFormatted();
    let text = `🏭 *${towerData.clientName || 'FACTORY'} • DAILY OPERATIONS HUDDLE*\n`;
    text += `📅 ${todayStr} | Shift A Standup\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `⚡ *Progress:* ${stats.completedCount}/${stats.total} Actions Done (${stats.percent}%)\n`;
    text += `💰 *Value Protected:* ${formatShortINR(stats.completedImpact)} / ${formatShortINR(stats.totalImpact)}\n\n`;

    // Cross-Engine Top 3
    text += `🎯 *TOP 3 SUPER-CRITICAL FOCUS FOR TODAY:*\n`;
    stats.topCrossEngineActions.forEach((act, idx) => {
      const statusIcon = act.completed ? '✅' : '⏳';
      text += `${idx + 1}. [${statusIcon}] *${act.engineBadge}*: ${act.title}\n`;
      text += `   Target: ${act.targetTime} | Owner: ${act.owner} (${act.impactLabel})\n`;
    });
    text += `\n`;

    // Breakdown by engine
    const engines: HuddleEngineKey[] = ['p1', 'p2', 'p3', 'p4'];
    engines.forEach((eng) => {
      const engActions = actions.filter((a) => a.engine === eng);
      const engDone = engActions.filter((a) => a.completed).length;
      const engName = eng === 'p1' ? 'P1 DEAD STOCK RECOVERY' : eng === 'p2' ? 'P2 PROMISE OTIF DISPATCHES' : eng === 'p3' ? 'P3 MARGIN & FREIGHT PROTECTION' : 'P4 WAREHOUSE ACCURACY';
      
      text += `📦 *${engName}* (${engDone}/${engActions.length})\n`;
      engActions.forEach((act) => {
        const mark = act.completed ? '✅' : '⏳';
        text += `• ${mark} ${act.title} [Due: ${act.targetTime}]\n`;
        if (act.completed && act.resolutionNote) {
          text += `  ↳ Note: ${act.resolutionNote}\n`;
        }
      });
      text += `\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Next Check-in: 04:30 PM Shift Handover\n`;
    text += `Managed via Operationalyst Monday Control Tower`;
    return text;
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppHuddleText();
    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* 1. HUDDLE EXECUTIVE HEADER & SHIFT BANNER                                */}
      {/* ========================================================================= */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-all ${
          isDarkMode
            ? 'bg-gradient-to-br from-neutral-900 via-neutral-900/95 to-neutral-950 border-neutral-800 shadow-xl'
            : 'bg-white border-neutral-200 shadow-md text-neutral-900'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                <span>DAILY OPERATIONS HUDDLE</span>
              </span>
              <span className="text-xs font-mono text-neutral-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>{getTodayFormatted()}</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Shift A (08:30 AM – 04:30 PM)</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>9:00 AM Factory Standup Action Board</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
              Top 3 tactical priorities from each operational engine (<strong>P1 Cash</strong>, <strong>P2 OTIF</strong>, <strong>P3 Margin</strong>, and <strong>P4 Warehouse</strong>) required to maintain delivery promises and protect working capital today.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddCustomModal(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition touch-manipulation active:scale-[0.98]"
              title="Add emergency tactical task for today's shift"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Custom Task</span>
            </button>

            <button
              onClick={handleCopyWhatsApp}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md touch-manipulation active:scale-[0.98]"
              title="Copy formatted 9:00 AM WhatsApp briefing for the factory operations group"
            >
              {copiedToast ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4 text-white" />}
              <span>{copiedToast ? 'Copied to Clipboard!' : 'Copy WhatsApp Huddle'}</span>
            </button>

            <button
              onClick={handleResetChecklist}
              className="min-h-[44px] p-2.5 rounded-xl bg-neutral-800 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-300 border border-neutral-700 hover:border-rose-500/40 transition cursor-pointer"
              title="Reset all tasks to fresh state"
              aria-label="Reset checklist"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress & Metrics Summary Strip */}
        <div className="mt-6 pt-5 border-t border-neutral-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/70 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span>Huddle Completion</span>
              <span className="font-bold text-emerald-400">{stats.percent}%</span>
            </div>
            <div className="text-lg sm:text-xl font-mono font-black text-white">
              {stats.completedCount} <span className="text-xs font-normal text-neutral-500">of {stats.total} tasks</span>
            </div>
            {/* Visual mini progress bar */}
            <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/70 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span>Value Protected</span>
              <span className="text-amber-400">Resolved</span>
            </div>
            <div className="text-lg sm:text-xl font-mono font-black text-amber-400">
              {formatShortINR(stats.completedImpact)}
            </div>
            <div className="text-[11px] font-mono text-neutral-500 truncate">
              of {formatShortINR(stats.totalImpact)} total exposure
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/70 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span>Pending Tasks</span>
              <span className="text-rose-400">Urgent</span>
            </div>
            <div className="text-lg sm:text-xl font-mono font-black text-rose-400">
              {stats.pendingCount}
            </div>
            <div className="text-[11px] font-mono text-neutral-500">
              require floor action today
            </div>
          </div>

          {/* 4 Engine Badges Summary */}
          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/70 space-y-1.5 flex flex-col justify-center">
            <div className="text-[11px] font-mono text-neutral-400 flex items-center justify-between">
              <span>Engine Status</span>
              <span className="text-neutral-500 text-[10px]">P1–P4</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
              <div className={`py-1 rounded border ${stats.p1Done === stats.p1Total ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-neutral-900 border-neutral-800 text-amber-400'}`}>
                P1 {stats.p1Done}/{stats.p1Total}
              </div>
              <div className={`py-1 rounded border ${stats.p2Done === stats.p2Total ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-neutral-900 border-neutral-800 text-emerald-400'}`}>
                P2 {stats.p2Done}/{stats.p2Total}
              </div>
              <div className={`py-1 rounded border ${stats.p3Done === stats.p3Total ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-neutral-900 border-neutral-800 text-cyan-400'}`}>
                P3 {stats.p3Done}/{stats.p3Total}
              </div>
              <div className={`py-1 rounded border ${stats.p4Done === stats.p4Total ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-neutral-900 border-neutral-800 text-fuchsia-400'}`}>
                P4 {stats.p4Done}/{stats.p4Total}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE TOP 3 SUPER-CRITICAL FOCUS STRIP                           */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <h3 className="text-sm font-black uppercase tracking-wider text-neutral-200">
              Top 3 Super-Critical Cross-Engine Focus (Today's Executive Standing)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            Ranked by Rupee Exposure &amp; Delivery SLA Risk
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {stats.topCrossEngineActions.map((item, idx) => {
            const isCompleted = item.completed;
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border relative transition-all ${
                  isCompleted
                    ? 'bg-neutral-900/40 border-neutral-800/50 opacity-75'
                    : item.engine === 'p2'
                    ? 'bg-gradient-to-br from-emerald-950/30 to-neutral-900 border-emerald-500/40 shadow-lg'
                    : item.engine === 'p1'
                    ? 'bg-gradient-to-br from-amber-950/30 to-neutral-900 border-amber-500/40 shadow-lg'
                    : 'bg-gradient-to-br from-fuchsia-950/30 to-neutral-900 border-fuchsia-500/40 shadow-lg'
                }`}
              >
                {/* Top Badge & Target Time */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      item.engine === 'p1'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : item.engine === 'p2'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : item.engine === 'p3'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                    }`}
                  >
                    #{idx + 1} Focus • {item.engineBadge}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    <span>{item.targetTime}</span>
                  </span>
                </div>

                <h4
                  className={`text-sm font-bold tracking-tight mb-1.5 transition-all ${
                    isCompleted ? 'line-through text-neutral-500' : 'text-white'
                  }`}
                >
                  {item.title}
                </h4>

                <p className="text-xs text-neutral-400 mb-3 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="pt-2.5 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {item.impactLabel}
                  </span>

                  <button
                    onClick={() => toggleAction(item.id)}
                    className={`min-h-[38px] px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition touch-manipulation active:scale-95 ${
                      isCompleted
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/60'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    <span>{isCompleted ? 'Completed' : 'Mark Done'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FILTER TABS STRIP                                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-1.5 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800 text-xs font-mono">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Actions ({stats.total})
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeFilter === 'pending'
                ? 'bg-rose-950/70 text-rose-300 border border-rose-800/70'
                : 'text-neutral-400 hover:text-rose-300'
            }`}
          >
            Pending ({stats.pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeFilter === 'completed'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/70'
                : 'text-neutral-400 hover:text-emerald-300'
            }`}
          >
            Completed ({stats.completedCount})
          </button>
          <span className="text-neutral-700 mx-1">|</span>
          <button
            onClick={() => setActiveFilter('p1')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'p1' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-neutral-400 hover:text-amber-300'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>P1 Cash</span>
          </button>
          <button
            onClick={() => setActiveFilter('p2')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'p2' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-neutral-400 hover:text-emerald-300'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>P2 OTIF</span>
          </button>
          <button
            onClick={() => setActiveFilter('p3')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'p3' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-neutral-400 hover:text-cyan-300'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>P3 Margin</span>
          </button>
          <button
            onClick={() => setActiveFilter('p4')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'p4' ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40' : 'text-neutral-400 hover:text-fuchsia-300'
            }`}
          >
            <ScanBarcode className="w-3.5 h-3.5" />
            <span>P4 Warehouse</span>
          </button>
        </div>

        <div className="text-xs text-neutral-400 font-mono hidden sm:block">
          Showing {filteredActions.length} of {stats.total} actions
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN ACTION CARDS LIST                                                */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {filteredActions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-neutral-800 text-neutral-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-bold text-white text-base">All Filtered Tasks Cleared!</p>
            <p className="text-xs text-neutral-500">
              No tasks currently match the selected filter. Change filters above or reset the checklist.
            </p>
          </div>
        ) : (
          filteredActions.map((action) => {
            const isCompleted = action.completed;
            const isEditingNote = editingNoteId === action.id;

            return (
              <div
                key={action.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-neutral-900/35 border-neutral-800/60 opacity-80'
                    : isDarkMode
                    ? 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 shadow-md'
                    : 'bg-white border-neutral-200 shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left: Checkbox & Content */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <button
                      onClick={() => toggleAction(action.id)}
                      className={`min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-1 mt-0.5 rounded-lg transition cursor-pointer touch-manipulation flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                      }`}
                      title={isCompleted ? 'Mark as incomplete' : 'Mark task completed'}
                      aria-label="Toggle task completion"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <Circle className="w-6 h-6 text-neutral-500" />
                      )}
                    </button>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Badge strip */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                            action.engine === 'p1'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : action.engine === 'p2'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : action.engine === 'p3'
                              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                              : 'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30'
                          }`}
                        >
                          {action.engineBadge}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            action.urgency === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                              : action.urgency === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                          }`}
                        >
                          {action.urgency}
                        </span>

                        <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>Target: {action.targetTime}</span>
                        </span>

                        <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                          <User className="w-3 h-3 text-neutral-500" />
                          <span>{action.owner}</span>
                        </span>
                      </div>

                      {/* Title */}
                      <h4
                        className={`text-sm sm:text-base font-bold tracking-tight transition-all ${
                          isCompleted ? 'line-through text-neutral-500 font-medium' : 'text-white'
                        }`}
                      >
                        {action.title}
                      </h4>

                      {/* Description & Root cause */}
                      <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                        {action.description}
                      </p>

                      <div className="pt-1 text-[11px] text-neutral-400 font-mono flex items-center gap-1.5">
                        <span className="text-neutral-500">Root Cause:</span>
                        <span className="italic">{action.rootCause}</span>
                      </div>

                      {/* Resolution Note if present */}
                      {action.resolutionNote && (
                        <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold font-mono text-emerald-300 mr-1.5">Standup Note:</span>
                            <span>{action.resolutionNote}</span>
                          </div>
                        </div>
                      )}

                      {/* Inline Note Editor */}
                      {isEditingNote && (
                        <div className="mt-2.5 p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                          <label className="text-[11px] font-mono text-neutral-400 block font-bold">
                            Add Standup Resolution Memo:
                          </label>
                          <textarea
                            value={tempNote}
                            onChange={(e) => setTempNote(e.target.value)}
                            placeholder="e.g., Driver signed gate pass at 10:15 AM; scrap contra entry confirmed in Tally."
                            rows={2}
                            className="w-full text-xs p-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveResolutionNote(action.id)}
                              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold cursor-pointer"
                            >
                              Save Note
                            </button>
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="px-3 py-1 rounded bg-neutral-800 text-neutral-300 text-xs font-mono cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Completed audit stamp */}
                      {isCompleted && action.completedAt && (
                        <div className="pt-1 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Cleared by {action.completedBy || 'Lead'} • {action.completedAt}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Impact & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-amber-400">
                        {action.impactLabel}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500">
                        Daily Exposure
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onJumpToEngine && (
                        <button
                          onClick={() => onJumpToEngine(action.engine)}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 font-mono text-[11px] flex items-center gap-1 cursor-pointer transition touch-manipulation"
                          title={`Jump to full ${action.engineBadge} workspace`}
                        >
                          <ExternalLink className="w-3 h-3 text-neutral-400" />
                          <span className="hidden sm:inline">Engine</span>
                        </button>
                      )}

                      {!isEditingNote && (
                        <button
                          onClick={() => {
                            setEditingNoteId(action.id);
                            setTempNote(action.resolutionNote || '');
                          }}
                          className="px-2 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 border border-neutral-700 text-[11px] cursor-pointer transition"
                          title="Add resolution note"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        onClick={() => toggleAction(action.id)}
                        className={`min-h-[36px] px-3 py-1.5 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition touch-manipulation active:scale-95 ${
                          isCompleted
                            ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                        }`}
                      >
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                        <span>{isCompleted ? 'Done' : 'Mark Done'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. ADD CUSTOM ACTION MODAL                                                */}
      {/* ========================================================================= */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-neutral-100 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <h3 className="font-black text-base">Add Emergency Shift Task</h3>
              </div>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="text-neutral-400 hover:text-white text-xs font-mono p-1"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleAddCustomAction} className="space-y-3.5 text-xs">
              <div>
                <label className="font-mono font-bold text-neutral-300 block mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Expedite Tooling Die Replacement for Line 2"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-mono font-bold text-neutral-300 block mb-1">
                  Operational Context / Action Details
                </label>
                <textarea
                  placeholder="Explain why this action is required today and what the floor team must do."
                  rows={2}
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono font-bold text-neutral-300 block mb-1">
                    Target Engine Pillar
                  </label>
                  <select
                    value={customEngine}
                    onChange={(e) => setCustomEngine(e.target.value as HuddleEngineKey)}
                    className="w-full p-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-white focus:outline-none"
                  >
                    <option value="p1">P1 • Dead Stock Recovery</option>
                    <option value="p2">P2 • Promise OTIF</option>
                    <option value="p3">P3 • Margin Protection</option>
                    <option value="p4">P4 • Warehouse Trust</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono font-bold text-neutral-300 block mb-1">
                    Target Time Today
                  </label>
                  <input
                    type="text"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    placeholder="e.g. 11:30 AM"
                    className="w-full p-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono font-bold text-neutral-300 block mb-1">
                    Action Owner
                  </label>
                  <input
                    type="text"
                    value={customOwner}
                    onChange={(e) => setCustomOwner(e.target.value)}
                    placeholder="e.g. Tool Room Lead"
                    className="w-full p-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-mono font-bold text-neutral-300 block mb-1">
                    Estimated Rupee Exposure (₹)
                  </label>
                  <input
                    type="number"
                    value={customImpact}
                    onChange={(e) => setCustomImpact(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold cursor-pointer"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
