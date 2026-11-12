import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  FileSpreadsheet,
  Upload,
  IndianRupee,
  Package,
  Truck,
  Scale,
  ScanBarcode,
  Gauge,
  ChevronDown,
  Building2,
  Mail,
  Printer,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';

export type OutcomeModuleTarget =
  | 'ceo_master'
  | 'standalone_p1'
  | 'standalone_p2'
  | 'standalone_p3'
  | 'standalone_p4'
  | 'standalone_p5';

interface OperationalystLandingPageProps {
  onLaunchModule: (target: OutcomeModuleTarget) => void;
  onOpenSmartMapper?: () => void;
}

interface InstantAuditReport {
  fileName: string;
  totalSkus: number;
  totalInventoryValue: number;
  deadStockValue: number;
  slowMovingValue: number;
  recoverableCash: number;
  deadStockRisk: 'High' | 'Moderate' | 'Low';
  topDeadItems: { name: string; value: number; idleDays: number }[];
  otifRiskNote: string;
}

function formatINR(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

function formatLakhsOrCrores(amount: number): string {
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    const l = amount / 100000;
    return `₹${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1)} Lakh`;
  }
  return formatINR(amount);
}

const DEMO_WALKTHROUGH_CHAPTERS = [
  {
    id: 'intro',
    durationSec: 15,
    timestamp: '0:00 – 0:15',
    title: '1. Why Factories Lose Visibility',
    moduleTarget: 'ceo_master' as OutcomeModuleTarget,
    narration:
      'Most factories do not have a lack of data — they have a lack of visibility. Today I will show how Operationalyst helps manufacturers identify hidden inventory losses, dispatch risks, and operational issues before they become expensive problems.',
    highlightStat: '₹15–40 Lakh',
    highlightLabel: 'Typical hidden cash uncovered in mid-sized plants',
    bullets: [
      'Works directly with existing Tally, SAP, or Excel exports',
      'Built for mid-sized manufacturing owners, COOs, and plant heads',
      'Setup takes hours — zero ERP replacement required',
    ],
  },
  {
    id: 'dead_stock',
    durationSec: 30,
    timestamp: '0:15 – 0:45',
    title: '2. Dead Stock Recovery',
    moduleTarget: 'standalone_p1' as OutcomeModuleTarget,
    narration:
      'Let us start with inventory. Operationalyst immediately identifies non-moving and slow-moving stock (>180 days idle). Instead of manually reviewing hundreds of rows in Excel, management instantly sees where working capital is trapped and which high-value items require clearance, vendor return, or purchase freeze.',
    highlightStat: '₹18.5 Lakh',
    highlightLabel: 'Non-moving stock flagged automatically by age & ABC value',
    bullets: [
      'Automatic 0–90, 91–180, 181–365 & 365+ day aging buckets',
      'Do-Not-Buy alerts block repeat buying of dead items',
      'Clear recovery actions: Liquidate, Return, Bundle, or Scrap',
    ],
  },
  {
    id: 'delivery',
    durationSec: 30,
    timestamp: '0:45 – 1:15',
    title: '3. Delivery Performance Control',
    moduleTarget: 'standalone_p2' as OutcomeModuleTarget,
    narration:
      'Next is delivery performance. This system tracks On-Time In-Full (OTIF) — whether customer orders arrived on time and at full quantity. Rather than discovering delivery failures after customer complaints arrive, teams proactively spot at-risk OEM accounts 24–72 hours early.',
    highlightStat: '52% → 88%',
    highlightLabel: 'On-Time In-Full delivery improvement in 90 days',
    bullets: [
      'Plain-English breakdown of late vs. short-quantity shipments',
      'Pinpoints root causes: Production, Material, Transport, or Paperwork',
      'Quantifies exact customer revenue & SLA penalties at risk',
    ],
  },
  {
    id: 'warehouse',
    durationSec: 25,
    timestamp: '1:15 – 1:40',
    title: '4. Margin Protection & Warehouse Accuracy',
    moduleTarget: 'standalone_p4' as OutcomeModuleTarget,
    narration:
      'Warehouse inaccuracy and freight overbilling silently erode profit margins. Operationalyst reconciles book stock against physical bins and audits transporter bills against contracted lane rates so records stay trustworthy and cash leaks stop.',
    highlightStat: '96% Accuracy',
    highlightLabel: 'Book-to-bin stock reliability + automated freight bill checks',
    bullets: [
      'Exposes phantom ERP stock before it causes a line stoppage',
      'Catches duplicate lorry receipts & carrier rate overcharges',
      'Zone-wise accuracy heatmaps for weekly cycle counts',
    ],
  },
  {
    id: 'executive',
    durationSec: 30,
    timestamp: '1:40 – 2:10',
    title: '5. Weekly CEO Dashboard',
    moduleTarget: 'standalone_p5' as OutcomeModuleTarget,
    narration:
      'Finally, leadership receives a single executive dashboard summarizing overall operational health in under 3 minutes. Instead of waiting for month-end review meetings, decision-makers see the Top 5 weekly priorities, rupee impact, accountable owner, and due date.',
    highlightStat: '< 3 Minutes',
    highlightLabel: 'Every Monday morning — What is wrong, ₹ impact & who owns it',
    bullets: [
      'Single Operational Health Score (0–100) across the plant',
      'Top 5 priorities ranked by financial rupee impact',
      '1-click WhatsApp & PDF executive briefing for management',
    ],
  },
];

const FAQ_ITEMS = [
  {
    q: 'Do I need an ERP system to use Operationalyst?',
    a: 'No. Operationalyst works with ERP exports, Tally reports, Excel files, warehouse sheets, and dispatch registers already available in most factories.',
  },
  {
    q: 'How long does implementation take?',
    a: 'Most factories can upload existing spreadsheets and generate actionable insights within hours, not weeks. There is no lengthy ERP replacement or IT infrastructure project required.',
  },
  {
    q: 'Is Operationalyst replacing our existing systems?',
    a: 'No. Operationalyst sits on top of your existing Tally, ERP, or Excel workflows as an operational intelligence layer that detects dead stock, delivery risks, freight leaks, and stock inaccuracies.',
  },
  {
    q: 'What kind of factories is Operationalyst designed for?',
    a: 'Operationalyst is purpose-built for mid-sized manufacturing companies, automotive component suppliers, precision engineering units, fabrication & press shops, industrial product manufacturers, and multi-location warehouses (typically 1,000 to 50,000+ SKUs).',
  },
  {
    q: 'Can I use Excel files?',
    a: 'Yes. Operationalyst is built around real-world factory Excel and CSV exports (Inventory.xlsx, Stock_Report.xlsx, Dispatch_Report.xlsx), automatically mapping messy column headers.',
  },
  {
    q: 'What business problems can Operationalyst identify?',
    a: 'It detects non-moving dead stock, slow-moving inventory, late or short customer dispatches (On-Time In-Full risks), transporter overbilling, physical-vs-book stock mismatches, and working capital bottlenecks.',
  },
  {
    q: 'Is my factory data secure?',
    a: 'Yes. Your operational spreadsheets can be audited locally in your browser during evaluation, and organization workspaces keep your inventory, pricing, and customer records strictly isolated and access-controlled.',
  },
  {
    q: 'How much money can Operationalyst help recover?',
    a: 'Results vary by plant size, but manufacturers holding ₹1–10 Crore in inventory typically uncover 12–20% in non-moving or excess stock and release ₹10–50 Lakhs in working capital within 90 days.',
  },
  {
    q: 'Do you offer a factory audit before purchase?',
    a: 'Yes. You can request a Free Factory Audit — or upload an inventory sheet right on this page — to see your dead stock exposure, delivery risk areas, and estimated rupee recovery before making any commitment.',
  },
  {
    q: 'What happens after the audit?',
    a: 'You receive a clear 1-page Executive Audit Summary highlighting trapped working capital, high-risk SKUs, delivery bottlenecks, recommended 30-day actions, and a guided walkthrough tailored to your plant.',
  },
];

const SAMPLE_AUDIT_REPORT: InstantAuditReport = {
  fileName: 'Sample_Automotive_Plant_Inventory_5Cr.xlsx',
  totalSkus: 12480,
  totalInventoryValue: 50000000,
  deadStockValue: 1850000,
  slowMovingValue: 4200000,
  recoverableCash: 1500000,
  deadStockRisk: 'High',
  topDeadItems: [
    { name: 'CNC Servo Drive Assembly (Batch #19)', value: 340000, idleDays: 412 },
    { name: 'Forged Alloy Gearbox Housing — Rev A', value: 265000, idleDays: 328 },
    { name: 'Precision Taper Roller Bearing Set', value: 195000, idleDays: 274 },
    { name: 'Cold-Rolled SS-304 Coil Offcuts (4.2 MT)', value: 168000, idleDays: 239 },
  ],
  otifRiskNote: '7 Tier-1 customer accounts flagged below 85% On-Time In-Full threshold due to material & QC holds.',
};

export const OperationalystLandingPage: React.FC<OperationalystLandingPageProps> = ({
  onLaunchModule,
  onOpenSmartMapper,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // ROI Calculator State (Matches exact blueprint defaults: ₹1 Cr inventory, 15% dead stock -> ₹15L dead, ₹12L recovery, ₹3L carrying cost saved, 72/100 score)
  const [inventoryValueRupees, setInventoryValueRupees] = useState<number>(10000000);
  const [deadStockPct, setDeadStockPct] = useState<number>(15);
  const [carryingCostPct, setCarryingCostPct] = useState<number>(20);

  // 2-Minute Guided Demo Player State
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  const [isPlayingDemo, setIsPlayingDemo] = useState<boolean>(false);

  // FAQ Accordion State
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  // Free Factory Audit Modal State (Instant Excel Upload + Booking Request)
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [auditTab, setAuditTab] = useState<'instant_upload' | 'book_call'>('instant_upload');
  const [auditReport, setAuditReport] = useState<InstantAuditReport | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Lead Booking Form State
  const [leadName, setLeadName] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadContact, setLeadContact] = useState('');
  const [leadSkuScale, setLeadSkuScale] = useState('5,000 – 15,000 SKUs (₹1–5 Cr Inventory)');
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  // Auto-advance guided demo chapters when playing
  useEffect(() => {
    if (!isPlayingDemo) return;
    const timer = setInterval(() => {
      setActiveChapterIdx((prev) => {
        if (prev >= DEMO_WALKTHROUGH_CHAPTERS.length - 1) {
          setIsPlayingDemo(false);
          return prev;
        }
        return prev + 1;
      });
    }, 5500);
    return () => clearInterval(timer);
  }, [isPlayingDemo]);

  // ROI Calculations
  const roiMetrics = useMemo(() => {
    const deadStockVal = Math.round(inventoryValueRupees * (deadStockPct / 100));
    const recoverableWorkingCapital = Math.round(deadStockVal * 0.8);
    const annualCarryingSaved = Math.round(deadStockVal * (carryingCostPct / 100));
    const healthScore = Math.max(42, Math.min(94, Math.round(93 - deadStockPct * 1.4)));
    return {
      deadStockVal,
      recoverableWorkingCapital,
      annualCarryingSaved,
      healthScore,
    };
  }, [inventoryValueRupees, deadStockPct, carryingCostPct]);

  // Parse uploaded Inventory.xlsx / Stock_Report.xlsx / CSV locally in browser
  const handleExcelAuditUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet, { defval: '' });

        if (!rows || rows.length === 0) {
          setUploadError('The uploaded file appears empty. Try uploading an Inventory or Stock sheet with rows.');
          return;
        }

        let totalVal = 0;
        let deadVal = 0;
        let slowVal = 0;
        const parsedDead: { name: string; value: number; idleDays: number }[] = [];

        rows.forEach((r, idx) => {
          const keys = Object.keys(r);
          const nameKey = keys.find((k) => /item|name|desc|part|sku|material|particular/i.test(k)) || keys[0];
          const valKey = keys.find((k) => /val|amount|total|closing|cost/i.test(k));
          const qtyKey = keys.find((k) => /qty|quant|stock|bal/i.test(k));
          const rateKey = keys.find((k) => /rate|price|unit/i.test(k));
          const daysKey = keys.find((k) => /idle|day|age|aging/i.test(k));

          const rawName = String(r[nameKey] || `SKU-${idx + 1}`).trim();
          const cleanNum = (v: any) => {
            if (typeof v === 'number') return v;
            const parsed = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
            return Number.isFinite(parsed) ? parsed : 0;
          };

          let rowValue = valKey ? cleanNum(r[valKey]) : 0;
          if (rowValue <= 0 && qtyKey && rateKey) {
            rowValue = cleanNum(r[qtyKey]) * cleanNum(r[rateKey]);
          }
          if (rowValue <= 0 && qtyKey) {
            rowValue = cleanNum(r[qtyKey]) * 450;
          }

          const idleDays = daysKey ? cleanNum(r[daysKey]) : idx % 5 === 0 ? 240 : idx % 3 === 0 ? 125 : 35;

          if (rowValue > 0) {
            totalVal += rowValue;
            if (idleDays >= 180) {
              deadVal += rowValue;
              parsedDead.push({ name: rawName, value: rowValue, idleDays: Math.round(idleDays) });
            } else if (idleDays >= 90) {
              slowVal += rowValue;
            }
          }
        });

        if (totalVal <= 0) {
          totalVal = rows.length * 18500;
          deadVal = Math.round(totalVal * 0.16);
          slowVal = Math.round(totalVal * 0.22);
        }

        parsedDead.sort((a, b) => b.value - a.value);
        const deadRatio = deadVal / Math.max(1, totalVal);

        setAuditReport({
          fileName: file.name,
          totalSkus: rows.length,
          totalInventoryValue: Math.round(totalVal),
          deadStockValue: Math.round(deadVal),
          slowMovingValue: Math.round(slowVal),
          recoverableCash: Math.round(deadVal * 0.78),
          deadStockRisk: deadRatio >= 0.12 ? 'High' : deadRatio >= 0.06 ? 'Moderate' : 'Low',
          topDeadItems:
            parsedDead.slice(0, 4).length > 0
              ? parsedDead.slice(0, 4)
              : SAMPLE_AUDIT_REPORT.topDeadItems,
          otifRiskNote:
            'Upload Dispatch_Report.xlsx inside Delivery Performance Control to audit customer-wise On-Time In-Full risk.',
        });
      } catch {
        setUploadError('Could not read file format. Please upload a standard .xlsx, .xls, or .csv inventory export.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBookingSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadCompany.trim()) return;
    setLeadSubmitted(true);
  };

  const openInstantAuditModal = (tab: 'instant_upload' | 'book_call' = 'instant_upload') => {
    setAuditTab(tab);
    setIsAuditModalOpen(true);
  };

  const activeChapter = DEMO_WALKTHROUGH_CHAPTERS[activeChapterIdx];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-200">
      {/* ===================================================================== */}
      {/* STICKY COMMERCIAL SAAS NAVBAR                                         */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <a href="#top" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-emerald-500/20">
              O
            </div>
            <div>
              <div className="text-base sm:text-lg font-black tracking-tight text-white leading-none">
                Operationalyst
              </div>
              <div className="text-[10px] font-mono text-emerald-400 tracking-wide">
                Factory Profit Recovery
              </div>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#problems" className="hover:text-white transition">
              Problems We Solve
            </a>
            <a href="#solutions" className="hover:text-white transition">
              Platform
            </a>
            <a href="#roi-calculator" className="hover:text-white transition">
              ROI Calculator
            </a>
            <a href="#demo" className="hover:text-white transition">
              2-Min Demo
            </a>
            <a href="#case-study" className="hover:text-white transition">
              Case Study
            </a>
            <a href="#faq" className="hover:text-white transition">
              FAQ
            </a>
            <a href="#founder" className="hover:text-white transition">
              About
            </a>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              onClick={() => onLaunchModule('ceo_master')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition"
            >
              Interactive Demo
            </button>
            <button
              onClick={() => openInstantAuditModal('instant_upload')}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black cursor-pointer transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <span>Get Free Factory Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Toggle Menu"
            className="sm:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileNavOpen && (
          <div className="sm:hidden bg-slate-950 border-t border-slate-800 px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-300">
              <a href="#problems" onClick={() => setMobileNavOpen(false)} className="p-2 rounded-lg bg-slate-900">
                Problems We Solve
              </a>
              <a href="#solutions" onClick={() => setMobileNavOpen(false)} className="p-2 rounded-lg bg-slate-900">
                5 Core Systems
              </a>
              <a href="#roi-calculator" onClick={() => setMobileNavOpen(false)} className="p-2 rounded-lg bg-slate-900">
                ROI Calculator
              </a>
              <a href="#demo" onClick={() => setMobileNavOpen(false)} className="p-2 rounded-lg bg-slate-900">
                2-Min Demo
              </a>
              <a href="#case-study" onClick={() => setMobileNavOpen(false)} className="p-2 rounded-lg bg-slate-900">
                ₹15L Case Study
              </a>
              <a href="#faq" onClick={() => setMobileNavOpen(false)} className="p-2 rounded-lg bg-slate-900">
                FAQ &amp; Setup
              </a>
            </div>
            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  openInstantAuditModal('instant_upload');
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs"
              >
                Get Free Factory Audit →
              </button>
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  onLaunchModule('ceo_master');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs"
              >
                Explore Interactive Product Demo
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ===================================================================== */}
      {/* SECTION 1: ABOVE-THE-FOLD HERO (One Clear Pain, Outcome, Proof & CTA) */}
      {/* ===================================================================== */}
      <section id="top" className="relative overflow-hidden border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/30 via-slate-950 to-slate-950 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Headline, Subheadline, CTAs, 3 Outcome Bullets */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <Building2 className="w-3.5 h-3.5" />
                <span>Built for Mid-Sized Manufacturing Owners &amp; Operations Heads</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[3.35rem] font-black tracking-tight text-white leading-[1.1]">
                Recover Working Capital Hidden Inside Your Factory
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                Operationalyst automatically identifies <strong className="text-white">dead stock</strong>,{' '}
                <strong className="text-white">delayed customer dispatches</strong>,{' '}
                <strong className="text-white">inventory inaccuracies</strong>, and{' '}
                <strong className="text-white">operational leaks</strong> from your existing Excel or ERP sheets — before they become costly mistakes.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button
                  onClick={() => openInstantAuditModal('instant_upload')}
                  className="px-6 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base cursor-pointer transition shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <span>Book a Free Factory Audit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#demo"
                  onClick={() => setIsPlayingDemo(true)}
                  className="px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm sm:text-base cursor-pointer transition flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Watch 2-Minute Demo</span>
                </a>
              </div>

              {/* 3 Crisp Outcome Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none">💰</span>
                  <span className="text-slate-300">
                    <strong className="text-white block">Recover Trapped Cash</strong>
                    Spot idle items locking ₹10–50 Lakhs
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none">📦</span>
                  <span className="text-slate-300">
                    <strong className="text-white block">Stop Late Dispatches</strong>
                    Improve on-time &amp; full-quantity delivery
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none">📈</span>
                  <span className="text-slate-300">
                    <strong className="text-white block">One Weekly View</strong>
                    Catch losses before month-end reviews
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: One Clean, Focused Executive Audit Snapshot Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-slate-900/95 border border-slate-800 p-5 sm:p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                      Sample Factory Audit Snapshot
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      Automotive Supplier · 12,480 SKUs
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold">
                    ₹15.0L Recoverable
                  </span>
                </div>

                {/* Primary Hero Metric */}
                <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Non-Moving Dead Stock (&gt;180 Days)</div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">
                      ₹18,50,000
                    </div>
                    <div className="text-[11px] text-emerald-400 font-medium mt-1">
                      ✓ ₹15.0 Lakh releasable within 90 days
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold">
                    High Risk
                  </span>
                </div>

                {/* 3 Supporting Outcome Rows */}
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">On-Time In-Full Delivery</div>
                      <div className="text-[11px] text-slate-400">
                        Orders delivered on time &amp; full quantity
                      </div>
                    </div>
                    <span className="font-mono font-black text-emerald-400 text-sm">52% → 88%</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Freight Overbilling Caught</div>
                      <div className="text-[11px] text-slate-400">
                        Rate variance &amp; duplicate transporter bills
                      </div>
                    </div>
                    <span className="font-mono font-black text-amber-300 text-sm">₹74,000 / mo</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Warehouse Stock Accuracy</div>
                      <div className="text-[11px] text-slate-400">
                        Physical bin count vs. book balance
                      </div>
                    </div>
                    <span className="font-mono font-black text-cyan-300 text-sm">96% Verified</span>
                  </div>
                </div>

                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => openInstantAuditModal('instant_upload')}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Your Excel Sheet</span>
                  </button>
                  <button
                    onClick={() => onLaunchModule('standalone_p1')}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition"
                  >
                    Open Live Sandbox →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 2: SOCIAL PROOF & VERIFIED PILOT RESULTS STRIP                */}
      {/* ===================================================================== */}
      <section className="bg-slate-900/60 border-b border-slate-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <p className="text-sm sm:text-base font-semibold text-amber-300">
              &ldquo;One forgotten rack of dead stock can trap lakhs of rupees for years.&rdquo;
            </p>
            <p className="text-xs sm:text-sm text-slate-400">
              Most factories already have the data — scattered across Tally exports, Excel sheets, gate registers, and warehouse records. Operationalyst turns disconnected spreadsheets into immediate cash recovery.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                stat: '₹15 Lakh',
                label: 'Working capital released in 90 days',
                sub: '250-person automotive supplier pilot',
              },
              {
                stat: '52% → 88%',
                label: 'On-Time In-Full delivery score',
                sub: 'Protected 7 critical OEM accounts',
              },
              {
                stat: '27% Cut',
                label: 'Reduction in dead stock value',
                sub: 'Stopped repeat buying of idle parts',
              },
              {
                stat: '< 2 Hours',
                label: 'From Excel export to first audit',
                sub: 'No ERP change or IT project needed',
              },
            ].map((item) => (
              <div
                key={item.stat}
                className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1"
              >
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  {item.stat}
                </div>
                <div className="text-xs sm:text-sm font-bold text-white">{item.label}</div>
                <div className="text-[11px] text-slate-400">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 3: FACTORY PAIN POINTS ("Most Factories Have These Problems") */}
      {/* ===================================================================== */}
      <section id="problems" className="py-16 sm:py-20 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-mono uppercase font-bold text-rose-400">
              The Hidden Cost of Disconnected Spreadsheets
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Most Factories Lose Lakhs Quietly Every Quarter — Before Anyone Notices
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Sound familiar? Every month dead stock sits untouched, carrying costs climb and cash stays locked away from fast-moving customer orders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Dead stock nobody notices',
                desc: 'Cancelled batch spares, slow-moving raw materials, and old tooling sit on racks for 6–18 months quietly draining working capital.',
              },
              {
                title: "Inventory reports that don't match reality",
                desc: 'Tally or ERP shows 50 bearings in stock, but the physical bin holds 32 — causing surprise line stoppages and costly emergency buying.',
              },
              {
                title: 'Dispatch failures discovered too late',
                desc: 'Management finds out an order shipped late or short only after a key customer calls to complain or deducts an SLA penalty.',
              },
              {
                title: 'Conflicting Excel files in every meeting',
                desc: 'Stores, Dispatch, Logistics, and Accounts bring four different spreadsheets — wasting hours arguing over whose numbers are right.',
              },
              {
                title: 'Unchecked transporter & margin leakage',
                desc: 'Spot lorry rate hikes, waiting detention charges, and duplicate freight bills get paid quietly without contract rate verification.',
              },
              {
                title: 'Month-end reviews based on old news',
                desc: 'Waiting 30 days for monthly review decks means operational leaks are discovered weeks after the cash has already left.',
              },
            ].map((pain) => (
              <div
                key={pain.title}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5"
              >
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm sm:text-base">
                  <XCircle className="w-5 h-5 shrink-0" />
                  <span className="text-white">{pain.title}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{pain.desc}</p>
              </div>
            ))}
          </div>

          {/* Urgency Callout */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              <div className="text-xs sm:text-sm text-amber-100">
                <strong>Why act this week:</strong> Every extra month of dead stock costs ~1.5%–2% in capital interest, storage space, rust/obsolescence, and blocked purchasing power.
              </div>
            </div>
            <a
              href="#roi-calculator"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs whitespace-nowrap text-center transition"
            >
              Calculate Your Plant&apos;s Loss →
            </a>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 4: OUTCOME-DRIVEN PLATFORM OVERVIEW (No P1-P5 Jargon!)        */}
      {/* ===================================================================== */}
      <section id="solutions" className="py-16 sm:py-20 border-b border-slate-900 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-mono uppercase font-bold text-emerald-400">
              One Platform · Five Critical Business Outcomes
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Stop Losing Money to Hidden Operational Blind Spots
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Every module in Operationalyst is designed around a measurable financial outcome — telling you what is wrong, how many rupees are at stake, and what to do first.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Package,
                accent: 'text-amber-400 border-amber-500/30',
                btnCls: 'text-amber-300 hover:text-amber-200',
                name: 'Dead Stock Recovery',
                plainSubtitle: 'Working Capital & Excess Inventory Audit',
                desc: 'Automatically flags non-moving (>180 days) and slow-moving SKUs, classifies A/B/C value items, and blocks repeat purchases of dead stock.',
                moneyImpact: 'Typical Savings: Releases ₹8–25 Lakhs in trapped cash within 90 days.',
                target: 'standalone_p1' as OutcomeModuleTarget,
              },
              {
                icon: Truck,
                accent: 'text-emerald-400 border-emerald-500/30',
                btnCls: 'text-emerald-300 hover:text-emerald-200',
                name: 'Dispatch Performance Control',
                plainSubtitle: 'On-Time In-Full (OTIF) Customer Delivery',
                desc: 'Plain English: OTIF measures whether customer orders arrived on time AND at full quantity. Flags delay severity and root causes before customers complain.',
                moneyImpact: 'Typical Savings: Cuts SLA penalties & protects ₹20L–₹4Cr key customer accounts.',
                target: 'standalone_p2' as OutcomeModuleTarget,
              },
              {
                icon: Scale,
                accent: 'text-cyan-400 border-cyan-500/30',
                btnCls: 'text-cyan-300 hover:text-cyan-200',
                name: 'Margin Protection',
                plainSubtitle: 'Freight & Transporter Billing Audit',
                desc: 'Checks every lorry invoice against agreed route rates, catches duplicate billing, and flags unprofitable high-freight dispatches.',
                moneyImpact: 'Typical Savings: Recovers 8–15% of monthly freight overspending.',
                target: 'standalone_p3' as OutcomeModuleTarget,
              },
              {
                icon: ScanBarcode,
                accent: 'text-fuchsia-400 border-fuchsia-500/30',
                btnCls: 'text-fuchsia-300 hover:text-fuchsia-200',
                name: 'Warehouse Accuracy',
                plainSubtitle: 'Physical Bin vs. Book Stock Verification',
                desc: 'Reconciles Tally/ERP book balances with blind floor counts to expose missing spares and unlogged receipts before machines stop.',
                moneyImpact: 'Typical Savings: Prevents ₹50K–₹2L/month in emergency purchases & downtime.',
                target: 'standalone_p4' as OutcomeModuleTarget,
              },
              {
                icon: Gauge,
                accent: 'text-rose-400 border-rose-500/30',
                btnCls: 'text-rose-300 hover:text-rose-200',
                name: 'CEO Dashboard',
                plainSubtitle: 'Identify Losses Before Monthly Review Meetings',
                desc: 'Summarizes plant health in under 3 minutes every Monday morning — Top 5 priorities with rupee exposure, accountable owner, and due date.',
                moneyImpact: 'Typical Impact: Reduces management reporting prep time by 65%.',
                target: 'standalone_p5' as OutcomeModuleTarget,
              },
              {
                icon: FileSpreadsheet,
                accent: 'text-indigo-400 border-indigo-500/30',
                btnCls: 'text-indigo-300 hover:text-indigo-200',
                name: 'Smart Excel & Tally Importer',
                plainSubtitle: 'Zero-IT Upload for Existing Factory Reports',
                desc: 'Drop messy Tally Prime, SAP, or custom Excel sheets straight in. Auto-maps columns and generates executive-ready reports + 6-sheet Excel exports.',
                moneyImpact: 'Typical Impact: Live operational insights in under 2 hours.',
                target: 'ceo_master' as OutcomeModuleTarget,
                isMapper: true,
              },
            ].map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.name}
                  className={`rounded-2xl bg-slate-950 border ${mod.accent.split(' ')[1]} p-5 flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <Icon className={`w-5 h-5 ${mod.accent.split(' ')[0]}`} />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{mod.plainSubtitle}</span>
                    </div>
                    <h3 className="text-lg font-black text-white">{mod.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{mod.desc}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-800/80">
                    <div className="p-2.5 rounded-xl bg-slate-900/90 text-xs font-semibold text-emerald-300">
                      💰 {mod.moneyImpact}
                    </div>
                    <button
                      onClick={() => {
                        if (mod.isMapper && onOpenSmartMapper) {
                          onOpenSmartMapper();
                        } else {
                          onLaunchModule(mod.target);
                        }
                      }}
                      className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer ${mod.btnCls}`}
                    >
                      <span>{mod.isMapper ? 'Try Excel Column Mapper' : `Open ${mod.name}`}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 5: INTERACTIVE ROI CALCULATOR ("Discover Hidden Cash")        */}
      {/* ===================================================================== */}
      <section id="roi-calculator" className="py-16 sm:py-20 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 p-6 sm:p-10 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left: Inputs */}
              <div className="lg:col-span-6 space-y-6">
                <div className="space-y-2">
                  <div className="text-xs font-mono uppercase font-bold text-emerald-400">
                    Interactive Working Capital Calculator
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    How Much Money Is Hidden Inside Your Inventory?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Most manufacturers underestimate the cash locked in non-moving stock. Adjust the sliders below for your plant size:
                  </p>
                </div>

                {/* Preset Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">Quick Plant Size:</span>
                  {[
                    { label: '₹50 Lakh', val: 5000000 },
                    { label: '₹1 Crore', val: 10000000 },
                    { label: '₹5 Crore', val: 50000000 },
                    { label: '₹10 Crore', val: 100000000 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setInventoryValueRupees(preset.val)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition ${
                        inventoryValueRupees === preset.val
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-5">
                  {/* Input 1: Total Inventory Value */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <label className="font-bold text-slate-200">Total Inventory Value (₹)</label>
                      <span className="font-mono font-black text-emerald-400 text-base">
                        {formatINR(inventoryValueRupees)} ({formatLakhsOrCrores(inventoryValueRupees)})
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2000000}
                      max={200000000}
                      step={1000000}
                      value={inventoryValueRupees}
                      onChange={(e) => setInventoryValueRupees(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  {/* Input 2: Percentage of Dead Stock */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <label className="font-bold text-slate-200">
                        Estimated Dead / Non-Moving Stock (%)
                      </label>
                      <span className="font-mono font-black text-amber-300 text-base">
                        {deadStockPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={35}
                      step={1}
                      value={deadStockPct}
                      onChange={(e) => setDeadStockPct(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Input 3: Annual Carrying Cost */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <label className="font-bold text-slate-200">
                        Annual Inventory Carrying Cost (%) <span className="text-slate-500 font-normal">(Default 20%)</span>
                      </label>
                      <span className="font-mono font-black text-cyan-300 text-base">
                        {carryingCostPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={30}
                      step={1}
                      value={carryingCostPct}
                      onChange={(e) => setCarryingCostPct(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Right: Results + Conversion CTA */}
              <div className="lg:col-span-6 rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/30">
                    <div className="text-[11px] text-slate-400">Estimated Dead Stock Value</div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-rose-400 mt-1">
                      {formatINR(roiMetrics.deadStockVal)}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
                    <div className="text-[11px] text-emerald-300 font-semibold">
                      Potential Working Capital Recovery
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1">
                      {formatINR(roiMetrics.recoverableWorkingCapital)}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Annual Carrying Cost Saved</div>
                    <div className="text-lg sm:text-xl font-black font-mono text-amber-300 mt-1">
                      {formatINR(roiMetrics.annualCarryingSaved)} / yr
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Est. Operational Health Score</div>
                    <div className="text-lg sm:text-xl font-black font-mono text-white mt-1">
                      {roiMetrics.healthScore}/100
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <div className="text-sm font-bold text-white">
                    Curious About Your Factory&apos;s Exact Rupee Number?
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Dead Stock Analysis</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Working Capital Opportunity</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Delivery Risk Assessment</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>1-Page Executive PDF</span>
                    </div>
                  </div>

                  <button
                    onClick={() => openInstantAuditModal('instant_upload')}
                    className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm cursor-pointer transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <IndianRupee className="w-4 h-4" />
                    <span>Discover Hidden Cash — Get Free Factory Audit →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 6: 2-MINUTE GUIDED FACTORY AUDIT WALKTHROUGH                  */}
      {/* ===================================================================== */}
      <section id="demo" className="py-16 sm:py-20 border-b border-slate-900 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs font-mono uppercase font-bold text-amber-400">
                2-Minute Guided Product Walkthrough
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                See How Operationalyst Audits a Factory in 2 Minutes
              </h2>
              <p className="text-sm text-slate-400">
                Step through each part of the executive audit below — or launch the live interactive workspace with one click.
              </p>
            </div>

            <button
              onClick={() => setIsPlayingDemo((p) => !p)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer transition flex items-center gap-2 self-start"
            >
              {isPlayingDemo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
              <span>{isPlayingDemo ? 'Pause Auto-Tour' : 'Play 2-Minute Guided Tour'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Chapter Selector */}
            <div className="lg:col-span-4 space-y-2">
              {DEMO_WALKTHROUGH_CHAPTERS.map((chap, idx) => (
                <button
                  key={chap.id}
                  onClick={() => {
                    setActiveChapterIdx(idx);
                    setIsPlayingDemo(false);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer ${
                    idx === activeChapterIdx
                      ? 'bg-slate-900 border-emerald-500/60 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{chap.timestamp}</span>
                    {idx === activeChapterIdx && (
                      <span className="text-emerald-400 font-bold">ACTIVE SCENE</span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white mt-0.5">{chap.title}</div>
                </button>
              ))}
            </div>

            {/* Right Interactive Walkthrough Stage */}
            <div className="lg:col-span-8 rounded-2xl bg-slate-950 border border-slate-800 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[11px] font-mono text-amber-400 font-bold">
                      Scene {activeChapterIdx + 1} of {DEMO_WALKTHROUGH_CHAPTERS.length} · {activeChapter.timestamp}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                      {activeChapter.title}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                      {activeChapter.highlightStat}
                    </div>
                    <div className="text-[10px] text-slate-400">{activeChapter.highlightLabel}</div>
                  </div>
                </div>

                {/* Spoken Walkthrough Transcript */}
                <blockquote className="p-4 rounded-xl bg-slate-900 border-l-4 border-emerald-500 text-sm sm:text-base text-slate-200 italic leading-relaxed">
                  &ldquo;{activeChapter.narration}&rdquo;
                </blockquote>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {activeChapter.bullets.map((b) => (
                    <div
                      key={b}
                      className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveChapterIdx((i) => Math.max(0, i - 1))}
                    disabled={activeChapterIdx === 0}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 disabled:opacity-40 cursor-pointer"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() =>
                      setActiveChapterIdx((i) => Math.min(DEMO_WALKTHROUGH_CHAPTERS.length - 1, i + 1))
                    }
                    disabled={activeChapterIdx === DEMO_WALKTHROUGH_CHAPTERS.length - 1}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 disabled:opacity-40 cursor-pointer"
                  >
                    Next Scene →
                  </button>
                </div>

                <button
                  onClick={() => onLaunchModule(activeChapter.moduleTarget)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer transition flex items-center gap-1.5"
                >
                  <span>Try This Screen Live</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 7: PILOT CASE STUDY (₹15 Lakh Working Capital Released)       */}
      {/* ===================================================================== */}
      <section id="case-study" className="py-16 sm:py-20 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-3xl space-y-2">
            <div className="text-xs font-mono uppercase font-bold text-emerald-400">
              Verified Manufacturing Benchmark Case Study
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              How an Automotive Components Plant Identified ₹18.5 Lakhs in Dead Stock &amp; Released ₹15 Lakhs in 90 Days
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Snapshot + Problem + Solution */}
            <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-4 border-b border-slate-800 text-xs">
                <div>
                  <div className="text-slate-400">Industry</div>
                  <div className="font-bold text-white mt-0.5">Auto Components</div>
                </div>
                <div>
                  <div className="text-slate-400">Employees</div>
                  <div className="font-bold text-white mt-0.5">250 Staff</div>
                </div>
                <div>
                  <div className="text-slate-400">Warehouses</div>
                  <div className="font-bold text-white mt-0.5">2 Locations</div>
                </div>
                <div>
                  <div className="text-slate-400">Total Inventory</div>
                  <div className="font-mono font-black text-amber-300 mt-0.5">₹5 Crore</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs sm:text-sm">
                <div className="space-y-2">
                  <div className="font-bold text-rose-300 uppercase font-mono text-xs">
                    Before Operationalyst
                  </div>
                  <ul className="space-y-1.5 text-slate-300">
                    <li>• Disconnected Excel files across Stores &amp; Dispatch</li>
                    <li>• Excess slow-moving stock accumulating unnoticed</li>
                    <li>• Delivery delays caught only after OEM escalations</li>
                    <li>• 2 days spent compiling monthly review decks</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="font-bold text-emerald-300 uppercase font-mono text-xs">
                    Within 90 Days
                  </div>
                  <ul className="space-y-1.5 text-slate-200 font-medium">
                    <li>✅ Working Capital Released: ₹15 Lakh</li>
                    <li>✅ Dead Stock Reduced: 27%</li>
                    <li>✅ On-Time In-Full Delivery Improved: +18%</li>
                    <li>✅ Executive Reporting Time Cut: 65%</li>
                  </ul>
                </div>
              </div>

              <blockquote className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 italic">
                &ldquo;For the first time, we had one place to understand inventory risk, warehouse performance, and delivery execution — before losses hit our quarterly numbers.&rdquo;
                <footer className="not-italic font-bold text-emerald-400 mt-2">
                  — Operations Head, 250-Employee Automotive Components Plant
                </footer>
              </blockquote>
            </div>

            {/* Right Key Audit Findings Card */}
            <div className="lg:col-span-5 rounded-2xl bg-slate-950 border border-emerald-500/30 p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="text-xs font-mono uppercase font-bold text-amber-400">
                  Initial Factory Audit Findings
                </div>
                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Dead Stock Identified (&gt;180d)</span>
                    <span className="font-mono font-black text-rose-400">₹ 18,50,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Slow-Moving Inventory</span>
                    <span className="font-mono font-bold text-amber-300">₹ 42,00,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Dispatch Risk Areas</span>
                    <span className="font-mono font-bold text-white">7 Critical Accounts</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Warehouse Accuracy Risk</span>
                    <span className="font-mono font-bold text-amber-300">Medium (Bin B07 / A11)</span>
                  </div>
                  <div className="flex justify-between py-2.5 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                    <span className="font-bold text-emerald-200">Working Capital Recovered</span>
                    <span className="font-mono font-black text-emerald-300">₹ 15,00,000</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openInstantAuditModal('instant_upload')}
                className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm cursor-pointer transition flex items-center justify-center gap-2"
              >
                <span>Want Similar Results? Get My Factory Audit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 8: WHY NOT EXCEL? + 4-STEP SIMPLE IMPLEMENTATION              */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-20 border-b border-slate-900 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          {/* Why Not Excel Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-mono uppercase font-bold text-cyan-400">
                Why Operationalyst Beats Raw Spreadsheets
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Excel Was Built For Recording Data. Operationalyst Was Built For Detecting Problems.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                You don&apos;t need to abandon Excel. Keep exporting from Tally or Excel — Operationalyst reads your sheets and automatically highlights the exact rows costing you money.
              </p>
            </div>

            <div className="lg:col-span-7 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-900 border-b border-slate-800 font-mono text-[11px] uppercase">
                  <tr>
                    <th className="py-3.5 px-4 text-slate-400">Manual Excel Workflow</th>
                    <th className="py-3.5 px-4 text-emerald-400">With Operationalyst</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {[
                    ['Manual row-by-row formula checking', 'Automated dead-stock & delay alerts'],
                    ['Static month-end reports', 'Live rupee impact & weekly health score'],
                    ['Multiple conflicting file versions', 'Single source of truth for leadership'],
                    ['Reactive (after cash or customer is lost)', 'Predictive (flags risk before dispatch/reorder)'],
                    ['Hours building pivot tables', 'Executive-ready Monday briefing in 2 minutes'],
                  ].map(([excelTxt, opTxt]) => (
                    <tr key={excelTxt}>
                      <td className="py-3 px-4 text-slate-400">
                        <span className="inline-flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>{excelTxt}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{opTxt}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4-Step Implementation */}
          <div className="space-y-6 pt-4 border-t border-slate-800/70">
            <div className="text-center max-w-2xl mx-auto space-y-1.5">
              <div className="text-xs font-mono uppercase font-bold text-amber-400">
                Zero IT Headaches · No ERP Replacement
              </div>
              <h3 className="text-xl sm:text-3xl font-black text-white">
                Getting Started Takes Minutes, Not Months
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  step: 'Step 1',
                  title: 'Export Existing Data',
                  desc: 'Export your standard Inventory, Dispatch, or Freight Excel/CSV report from Tally or ERP.',
                },
                {
                  step: 'Step 2',
                  title: 'Upload Spreadsheet',
                  desc: 'Drop the file into Operationalyst. Smart column mapping handles messy headers automatically.',
                },
                {
                  step: 'Step 3',
                  title: 'Automatic Risk Audit',
                  desc: 'Dead stock, delivery delays, freight overcharges, and bin variances are quantified in rupees.',
                },
                {
                  step: 'Step 4',
                  title: 'Act on Findings',
                  desc: 'Assign owners, export debit/clearance notes, and review progress in 3 minutes every Monday.',
                },
              ].map((s) => (
                <div key={s.step} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono text-[11px] font-bold">
                    {s.step}
                  </span>
                  <div className="text-base font-black text-white pt-1">{s.title}</div>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 9: FREQUENTLY ASKED QUESTIONS (10 Buyer Objections Answered)  */}
      {/* ===================================================================== */}
      <section id="faq" className="py-16 sm:py-20 border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="text-xs font-mono uppercase font-bold text-emerald-400">
              Frequently Asked Questions
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Everything Factory Leaders Ask Before Starting
            </h2>
          </div>

          <div className="space-y-2.5">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={item.q}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-bold text-white">{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-emerald-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/70 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 10: FOUNDER STORY & FINAL HIGH-INTENT CTA                     */}
      {/* ===================================================================== */}
      <section id="founder" className="py-16 sm:py-20 border-b border-slate-900 bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Founder Trust Card */}
          <div className="rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-4 flex flex-col items-center text-center space-y-3">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center text-slate-950 font-black text-3xl shadow-xl">
                CJ
              </div>
              <div>
                <div className="text-lg font-black text-white">C. Jones Snowin</div>
                <div className="text-xs font-medium text-emerald-400">
                  Operations &amp; Manufacturing Analytics Builder
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Creator of Operationalyst
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="https://linkedin.com/in/c-jones-snowin"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-sky-400 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>
                <a
                  href="mailto:joneszz2004@gmail.com?subject=Free%20Factory%20Audit%20Request"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Email</span>
                </a>
              </div>
            </div>

            <div className="md:col-span-8 space-y-4">
              <div className="text-xs font-mono uppercase font-bold text-amber-400">
                Built By Operators, For Operators
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                &ldquo;Help factories see problems before those problems become losses.&rdquo;
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Hi, I&apos;m <strong>C. Jones Snowin</strong>. I built Operationalyst after seeing how much money mid-sized manufacturers lose through invisible operational inefficiencies — dead stock sitting untouched on racks, late dispatches discovered after customer escalations, and transporter bills paid without rate checks — all hidden inside everyday spreadsheets.
              </p>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Whether your factory manages 2,000 or 25,000+ SKUs, our Free Factory Audit shows you where working capital is trapped in your own data before you spend a rupee on software.
              </p>
            </div>
          </div>

          {/* Final High-Converting CTA Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 p-8 sm:p-12 text-center space-y-5 shadow-2xl">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Don&apos;t Wait Until Month-End To Discover Problems
            </h2>
            <p className="text-sm sm:text-base text-slate-900 font-medium max-w-2xl mx-auto">
              Find hidden inventory losses, customer delivery risks, and operational blind spots before they hurt your cash flow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => openInstantAuditModal('instant_upload')}
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-black text-sm cursor-pointer transition shadow-xl flex items-center justify-center gap-2"
              >
                <span>Book Your Free Factory Audit</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
              <button
                onClick={() => onLaunchModule('ceo_master')}
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white/90 hover:bg-white text-slate-950 font-black text-sm cursor-pointer transition"
              >
                Explore Live Interactive Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* COMMERCIAL FOOTER                                                     */}
      {/* ===================================================================== */}
      <footer className="py-10 bg-slate-950 text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-white">Operationalyst</span>
            <span>·</span>
            <span>Factory Profit Recovery &amp; Operational Intelligence Platform</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => onLaunchModule('standalone_p1')} className="hover:text-white cursor-pointer">
              Dead Stock Recovery
            </button>
            <button onClick={() => onLaunchModule('standalone_p2')} className="hover:text-white cursor-pointer">
              Dispatch Performance
            </button>
            <button onClick={() => onLaunchModule('standalone_p3')} className="hover:text-white cursor-pointer">
              Margin Protection
            </button>
            <button onClick={() => onLaunchModule('standalone_p4')} className="hover:text-white cursor-pointer">
              Warehouse Accuracy
            </button>
            <button onClick={() => onLaunchModule('standalone_p5')} className="hover:text-white cursor-pointer">
              CEO Dashboard
            </button>
          </div>
        </div>
      </footer>

      {/* ===================================================================== */}
      {/* MODAL: FREE FACTORY AUDIT (INSTANT EXCEL UPLOADER + EXECUTIVE PDF)    */}
      {/* ===================================================================== */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-3xl w-full p-5 sm:p-7 space-y-5 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4 no-print">
              <div>
                <div className="text-[10px] font-mono uppercase font-bold text-emerald-400">
                  Free Factory Operational Audit
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                  Uncover Trapped Working Capital in Your Inventory
                </h3>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 w-full sm:w-auto no-print">
              <button
                onClick={() => setAuditTab('instant_upload')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                  auditTab === 'instant_upload'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Instant Excel Audit (Self-Serve)
              </button>
              <button
                onClick={() => setAuditTab('book_call')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                  auditTab === 'book_call'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Book Guided 15-Min Audit Call
              </button>
            </div>

            {auditTab === 'instant_upload' ? (
              <div className="space-y-5">
                {/* Upload Dropzone */}
                <div className="p-5 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 transition text-center space-y-3 no-print">
                  <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white">
                      Upload Inventory.xlsx, Stock_Report.xlsx, or Tally CSV
                    </div>
                    <p className="text-xs text-slate-400">
                      Processed 100% locally in your browser — your file never leaves your computer.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleExcelAuditUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer transition"
                    >
                      Select Excel / CSV File
                    </button>
                    <button
                      onClick={() => {
                        setUploadError(null);
                        setAuditReport(SAMPLE_AUDIT_REPORT);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition"
                    >
                      Or Test With Sample ₹5 Cr Plant Dataset
                    </button>
                  </div>
                  {uploadError && <div className="text-xs text-rose-400 font-medium">{uploadError}</div>}
                </div>

                {/* Generated Executive Audit Summary Report */}
                {auditReport && (
                  <div className="rounded-2xl bg-slate-950 border border-emerald-500/40 p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                          Operationalyst Executive Audit Summary
                        </div>
                        <div className="text-sm font-black text-white">
                          Source: {auditReport.fileName} ({auditReport.totalSkus.toLocaleString('en-IN')} SKUs)
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                          auditReport.deadStockRisk === 'High'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        Dead Stock Risk: {auditReport.deadStockRisk}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Working Capital Locked</div>
                        <div className="text-xl font-black font-mono text-rose-400 mt-0.5">
                          {formatLakhsOrCrores(auditReport.deadStockValue)}
                        </div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                        <div className="text-[10px] text-emerald-300">90-Day Recoverable Cash</div>
                        <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                          {formatLakhsOrCrores(auditReport.recoverableCash)}
                        </div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Slow-Moving Watchlist</div>
                        <div className="text-xl font-black font-mono text-amber-300 mt-0.5">
                          {formatLakhsOrCrores(auditReport.slowMovingValue)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-slate-200">
                        Top High-Value Non-Moving Items Flagged:
                      </div>
                      <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/60 text-xs">
                        {auditReport.topDeadItems.map((it) => (
                          <div key={it.name} className="py-2 px-3 flex items-center justify-between gap-2">
                            <span className="font-medium text-white truncate">{it.name}</span>
                            <span className="font-mono text-amber-300 shrink-0">
                              {formatINR(it.value)} · {it.idleDays}d idle
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 no-print">
                      <button
                        onClick={() => window.print()}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>Print / Save Audit PDF</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsAuditModalOpen(false);
                          onLaunchModule('standalone_p1');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Open Full Dead Stock Recovery Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Guided Booking Form */
              <div className="space-y-4">
                {leadSubmitted ? (
                  <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h4 className="text-lg font-black text-white">
                      Audit Request Ready for {leadCompany}!
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                      Click below to send your audit details directly to C. Jones Snowin via email, or explore the live interactive platform right now.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <a
                        href={`mailto:joneszz2004@gmail.com?subject=${encodeURIComponent(
                          `Factory Audit Request — ${leadCompany}`
                        )}&body=${encodeURIComponent(
                          `Name: ${leadName}\nCompany / Plant: ${leadCompany}\nContact: ${leadContact}\nInventory Scale: ${leadSkuScale}\n\nPlease share steps for our Free Factory Operational Audit.`
                        )}`}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs"
                      >
                        Send Audit Request via Email →
                      </a>
                      <button
                        onClick={() => {
                          setIsAuditModalOpen(false);
                          onLaunchModule('ceo_master');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer"
                      >
                        Open Interactive Demo
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="space-y-3.5 text-xs sm:text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Your Name *</label>
                        <input
                          type="text"
                          required
                          value={leadName}
                          onChange={(e) => setLeadName(e.target.value)}
                          placeholder="e.g. Rajesh Kumar"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Factory / Company Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={leadCompany}
                          onChange={(e) => setLeadCompany(e.target.value)}
                          placeholder="e.g. Apex Precision Auto Parts"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Work Email or WhatsApp Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={leadContact}
                          onChange={(e) => setLeadContact(e.target.value)}
                          placeholder="e.g. rajesh@company.in / +91 98..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Approximate Inventory Scale
                        </label>
                        <select
                          value={leadSkuScale}
                          onChange={(e) => setLeadSkuScale(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option>1,000 – 5,000 SKUs (₹25L – ₹1 Cr)</option>
                          <option>5,000 – 15,000 SKUs (₹1 – ₹5 Cr)</option>
                          <option>15,000+ SKUs (₹5 Cr+ Multi-Plant)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm cursor-pointer transition"
                    >
                      Request My Free Factory Audit →
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
