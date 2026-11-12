/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Megaphone,
  Video,
  FileText,
  Send,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Target,
  Sparkles,
  Users,
  Compass,
  Building2,
  Clock,
  ShieldAlert,
  Play,
  RotateCcw,
  Sliders,
  DollarSign,
  TrendingDown,
  Info,
} from 'lucide-react';
import { trackEvent } from '../utils/analytics';

interface CampaignAssetStudioProps {
  onNavigateToAuditWithAd?: (adId: 'A' | 'B' | 'C' | 'D' | 'E' | 'F') => void;
  onClose?: () => void;
}

export const CampaignAssetStudio: React.FC<CampaignAssetStudioProps> = ({
  onNavigateToAuditWithAd,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'ads' | 'founder_video' | 'linkedin' | 'outreach' | 'tracker'>('ads');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedAdId, setSelectedAdId] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F'>('A');

  // Teleprompter state for Founder Video
  const [teleprompterSpeed, setTeleprompterSpeed] = useState<number>(3);
  const [isTeleprompterRunning, setIsTeleprompterRunning] = useState<boolean>(false);

  // Validation Tracker State (Target: 1 Real Manufacturer -> 1 Real Audit -> 1 Useful Result -> 1 Case Study -> 1 Paid Customer)
  const [trackerStep, setTrackerStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('op_validation_tracker_step');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSetTrackerStep = (step: number) => {
    setTrackerStep(step);
    try {
      localStorage.setItem('op_validation_tracker_step', step.toString());
    } catch {}
  };

  // The 6 Exact Ad Variations Specified
  const AD_VARIATIONS = [
    {
      id: 'A' as const,
      name: 'Loss-Awareness',
      headline: 'How Much of Your Inventory Hasn’t Moved?',
      body: 'Your total inventory value doesn’t show which individual items may have been inactive for months.\n\nOperationalyst helps turn existing inventory data into clear review priorities.',
      cta: 'Request Factory Audit →',
      psychologicalFrame: 'Loss Aversion (Prospect Theory)',
      targetRole: 'Owner / Managing Director / Plant Head',
      destinationPath: '/audit?frame=loss',
      visualConcept: 'Close-up of high warehouse racking followed by a highlighted spreadsheet showing a ₹14.8L part inactive for 240 days.',
    },
    {
      id: 'B' as const,
      name: 'Money & Capital',
      headline: 'Your Inventory Is Capital. Is All of It Working?',
      body: 'Analyse non-moving stock, slow-moving items and high-value inventory exposure using your existing operational data.',
      cta: 'View Factory Audit →',
      psychologicalFrame: 'Mental Accounting & Working Capital Trapping',
      targetRole: 'CFO / Managing Director / Finance Controller',
      destinationPath: '/audit?frame=money',
      visualConcept: 'Split screen: balance sheet line showing inventory total on left vs. idle cash stagnation breakdown on right.',
    },
    {
      id: 'C' as const,
      name: 'Control & Review Readiness',
      headline: 'Before Your Next Inventory Review, Can You Answer These 3 Questions?',
      body: 'What hasn’t moved?\nFor how long?\nWhat value does it represent?\n\nOperationalyst structures your stock data so management walks in with clear answers.',
      cta: 'Request Pilot Audit →',
      psychologicalFrame: 'Regret Aversion & Epistemic Control',
      targetRole: 'Plant Head / Head of Operations',
      destinationPath: '/audit?frame=control',
      visualConcept: 'Plant manager walking into a meeting room holding a 2-page structured audit deliverable with confidence.',
    },
    {
      id: 'D' as const,
      name: 'Curiosity & The Existing Export',
      headline: 'Your Inventory Export May Already Contain the Answer.',
      body: 'The difficulty isn’t always collecting more data.\n\nIt’s knowing where management attention should go.',
      cta: 'See How Operationalyst Works →',
      psychologicalFrame: 'Cognitive Load Reduction & Information Scent',
      targetRole: 'Stores In-Charge / Plant Head / Operations',
      destinationPath: '/audit?frame=export',
      visualConcept: 'A standard Excel stock dump transforming cleanly into a Top-15 prioritized investigation table.',
    },
    {
      id: 'E' as const,
      name: 'Complexity Reduction',
      headline: 'Thousands of SKUs. Which Ones Need Attention First?',
      body: 'Operationalyst structures existing inventory data into clearer review priorities.',
      cta: 'View Sample Audit →',
      psychologicalFrame: 'Hick’s Law & Decision Simplification',
      targetRole: 'Materials Manager / Stores Controller / COO',
      destinationPath: '/audit?frame=skus',
      visualConcept: 'A massive 12,000-line spreadsheet filtered down to the Pareto 80/20 critical exposure SKUs.',
    },
    {
      id: 'F' as const,
      name: 'Founder-Led (On Camera)',
      headline: '“I’m building Operationalyst around a simple manufacturing problem...”',
      body: '“Companies already have inventory data, but understanding which items haven’t moved, where value is concentrated and what deserves attention can still require significant manual analysis.\n\nI’m currently looking for manufacturing teams willing to test our Factory Inventory Audit and give me brutally honest feedback.\n\nIf this sounds relevant to your operation, let’s talk.”',
      cta: 'Apply for Pilot Audit →',
      psychologicalFrame: 'Founder Authenticity, Mayer’s Trust Triad (Benevolence & Integrity)',
      targetRole: 'All Manufacturing Leaders',
      destinationPath: '/audit?frame=founder',
      visualConcept: 'C. Jones Snowin directly addressing the camera from an industrial workspace, holding an actual inventory export printout.',
    },
  ];

  // 5 Formatted LinkedIn Posts
  const LINKEDIN_POSTS = [
    {
      id: 'li_post_1',
      title: 'Post 1: The Gross Inventory Illusion (Loss Aversion)',
      hook: 'Most manufacturing CEOs know their total inventory figure to the rupee. Almost none know which 15 SKUs have been dead for 180 days.',
      body: `Most manufacturing CEOs know their total inventory figure to the rupee.

Almost none know which 15 SKUs have been dead for 180 days.

Here is what happens on the factory floor:

1. Inventory reports are delivered as a massive Excel dump or Tally ledger.
2. The number on the balance sheet looks acceptable: ₹5 Crores.
3. But hidden inside that ₹5 Cr is ₹38 Lakhs of raw materials and machined parts that haven’t experienced a single store issue in 6 months.

By the time it's discovered during the annual stock audit, the parts have oxidized, the customer BOM has revised, and you're forced to write them down as scrap.

The data to catch this already exists in your ERP closing stock export.

You don't need a ₹20 Lakh software overhaul. You just need to classify inventory by days since last movement before your next review meeting.

I'm currently running founder-led pilot audits for mid-sized factory owners to show you exactly which SKUs are stagnating. 

Zero software installation. Zero automated billing.

Drop a comment or DM me if you'd like an illustrative sample report.`,
    },
    {
      id: 'li_post_2',
      title: 'Post 2: Why Your ERP Won’t Solve Dead Stock (System Architecture)',
      hook: '“We already have SAP/Tally. Why would we need inventory analytics?”',
      body: `“We already have SAP / Tally. Why would we need another inventory tool?”

This is the #1 question I get from plant directors.

Here is the honest truth about ERPs:

Your ERP is a transactional ledger. It is designed to record that a transaction happened:
- PO generated
- Goods received
- Store issue logged
- Dispatch invoiced

What ERPs do NOT do:
❌ They don't proactively calculate the velocity decay curve across 90/180/365-day brackets.
❌ They don't isolate the Pareto 80/20 cluster locking up the majority of your working capital.
❌ They don't present plant managers with a 15-SKU floor investigation list for Monday morning.

That is why operations teams spend 15 hours each month wrestling Excel formulas before every management review.

Operationalyst doesn't replace your ERP. It acts as an analytical lens on top of your existing spreadsheet exports.

If you want to see what this looks like on demonstration manufacturing data, check the link in the comments.`,
    },
    {
      id: 'li_post_3',
      title: 'Post 3: The 5-Question Factory Test (Self-Diagnosis)',
      hook: 'Can your stores team answer these 5 questions before your next monthly review?',
      body: `Before your next plant review, ask your stores and procurement heads these 5 questions:

1. Does our team classify inventory by the date of last physical movement?
2. Do stores and purchasing work from the exact same real-time stock register?
3. Which specific 15 SKUs represent 70%+ of our dormant working capital?
4. How quickly do we know if a customer PO revision has made raw material obsolete?
5. Are vendor defect returns systematically backed by logged debit contra notes?

If two or more answers are "Unsure" or "No", your factory is paying an invisible 18–24% annual holding tax on stagnant parts.

I built a free 60-second diagnostic widget that benchmarks your plant's visibility score with zero login or contact details required.

Link in the comments below.`,
    },
    {
      id: 'li_post_4',
      title: 'Post 4: Founder Build Log: Why I’m Doing Free Pilot Audits (Epistemic Honesty)',
      hook: 'I am building Operationalyst in public. Here is why I am offering founder-led pilot audits at zero software cost.',
      body: `I am building Operationalyst in public.

I'm going to be completely transparent: we are not selling a ₹10,000/month subscription today.

Why?

Because manufacturing software fails when software builders build what they think factories need instead of what plant managers actually experience.

Right now, I am looking for 3 manufacturing teams to run a Factory Inventory Audit on real operational data.

Here is what you get:
- Full classification of non-moving and slow-moving SKUs (>90d, >180d, >365d)
- Pareto 80/20 financial exposure ranking
- 2-page executive summary for your board or plant head
- 30-minute findings walkthrough call directly with me

What I ask in return:
- Your brutally honest feedback on whether the report gave you actionable clarity.

Zero automated billing. 100% offline spreadsheet compatibility. Anonymization fully supported.

If you run a plant and want clear eyes on your stock register, DM me directly or email joneszz2004@gmail.com.`,
    },
    {
      id: 'li_post_5',
      title: 'Post 5: The Pareto Rule on the Warehouse Floor (Educational)',
      hook: 'In almost every factory warehouse, 80% of idle capital is locked inside fewer than 20 part numbers.',
      body: `In almost every manufacturing plant with 10,000+ SKUs, a predictable mathematical pattern occurs:

80% of your trapped working capital is concentrated in fewer than 20 part numbers.

The mistake most operations teams make:
They try to audit all 10,000 SKUs uniformly.
Stores staff get overwhelmed counting nuts, washers, and low-cost consumables.
Meanwhile, four dormant castings and five obsolete imported bearings worth ₹25 Lakhs continue gathering dust unnoticed in the back aisle.

Stop treating all inventory equally.

When you audit your stock register:
1. Isolate items with zero issues in the last 180 days.
2. Multiply inactive quantity by unit valuation.
3. Sort descending.
4. Focus your entire floor team on the Top 15.

That is how you reclaim working capital without disrupting factory production.`,
    },
  ];

  // Direct 1-on-1 Outreach Scripts
  const OUTREACH_SCRIPTS = [
    {
      role: 'Plant Head / Head of Operations',
      channel: 'LinkedIn / WhatsApp',
      subject: 'Quick question about non-moving inventory review at [Company Name]',
      body: `Hi [Name],

I noticed your work leading operations at [Company Name].

I'm building an operational inventory tool called Operationalyst specifically for manufacturing plants that want to identify non-moving stock and slow-moving SKUs before monthly review meetings.

Rather than asking you to buy anything, I'm currently running founder-led pilot audits for 3 manufacturing teams to validate our analytical methodology on real operational data.

We take a standard exported stock spreadsheet, run it through our velocity classification, and deliver a clean 2-page briefing showing which specific SKUs represent the majority of dormant capital.

Would you be open to reviewing an illustrative sample report to see if this could be useful for your team?

Best regards,
C. Jones Snowin
Founder, Operationalyst
joneszz2004@gmail.com`,
    },
    {
      role: 'Owner / Managing Director / CFO',
      channel: 'Email / LinkedIn InMail',
      subject: 'Recovering working capital locked in [Company Name] inventory',
      body: `Dear [Name],

In many manufacturing facilities, between 5% and 12% of total stock valuation sits inactive across 180+ days, tying up working capital while continuing to incur 18–24% annual holding costs.

I am the founder of Operationalyst. We help manufacturing leadership turn existing ERP and stock ledger dumps into a structured, executive audit of stagnant inventory and priority review items.

We are currently conducting collaborative pilot audits at zero software cost for a select group of manufacturing units in [Location/Sector].

The review requires only 5 standard inventory fields, supports full SKU anonymisation, and delivers an executive summary ready for management discussion.

If you are interested in seeing a sample report with neutral demonstration data, I'd be glad to share it with your office.

Sincerely,
C. Jones Snowin
Founder, Operationalyst
joneszz2004@gmail.com`,
    },
    {
      role: 'Stores In-Charge / Materials Manager',
      channel: 'LinkedIn / WhatsApp',
      subject: 'Automating monthly dead stock classification from Excel dumps',
      body: `Hi [Name],

Hope your shifts are running smoothly.

I'm developing an analysis tool to help factory stores teams stop spending hours manually wrangling Excel VLOOKUPs to figure out which SKUs haven't moved in 90 or 180 days.

It reads your standard closing stock export and automatically isolates the top dormant items with zero daily data entry.

I'd value your practical feedback as a stores professional. Would you be willing to take a quick look at a sample output and tell me if the format matches what you actually need on the floor?

Thanks,
C. Jones Snowin
Operationalyst`,
    },
  ];

  return (
    <div className="bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl p-4 sm:p-6 md:p-8 space-y-8 font-sans">
      {/* Header & Target Tracker Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold tracking-wider uppercase">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Phase 2: Commercial Campaign Studio &amp; Sales Foundation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Finish the Foundation ➔ Switch Into Sales Mode
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Pre-built ad variations, founder teleprompter script, LinkedIn organic posts, and our 1-manufacturer validation pipeline.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-start md:self-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition cursor-pointer"
          >
            Close Studio
          </button>
        )}
      </div>

      {/* THE IMMEDIATE TARGET: 1 REAL MANUFACTURER PIPELINE */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/20 border border-emerald-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              The Immediate Target: 1 Manufacturer Foundation
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Qualified Conversations Over Empty Views
          </span>
        </div>

        {/* 5 Milestone Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 font-mono text-xs">
          {[
            { step: 1, label: '1 Real Manufacturer', desc: 'Identify plant with >10,000 SKUs' },
            { step: 2, label: '1 Real Audit', desc: 'Process stock ledger dump' },
            { step: 3, label: '1 Useful Result', desc: 'Isolate top-15 dormant capital' },
            { step: 4, label: '1 Case Study', desc: 'Approved factual testimonial' },
            { step: 5, label: '1 Paid Customer', desc: 'First recurring contract' },
          ].map((m) => {
            const isCompleted = trackerStep > m.step;
            const isCurrent = trackerStep === m.step;
            return (
              <button
                key={m.step}
                onClick={() => handleSetTrackerStep(m.step)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                  isCurrent
                    ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500/40'
                    : isCompleted
                    ? 'bg-slate-950 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400">Step 0{m.step}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ) : null}
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">{m.label}</div>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">{m.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* The Golden Rule */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between gap-2 text-xs font-mono text-slate-300">
          <span className="text-slate-400">The Golden Marketing Funnel:</span>
          <span className="text-emerald-400 font-bold truncate">
            Ad Impression ➔ Qualified Visitor ➔ Sample Audit ➔ Pilot Form ➔ Conversation ➔ Audit ➔ First Customer
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none font-mono text-xs">
        <button
          onClick={() => setActiveTab('ads')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'ads'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>1. Six Ad Variations ({AD_VARIATIONS.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('founder_video')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'founder_video'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>2. Founder Teleprompter</span>
        </button>

        <button
          onClick={() => setActiveTab('linkedin')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'linkedin'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. LinkedIn Posts ({LINKEDIN_POSTS.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('outreach')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'outreach'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>4. 1-on-1 Outreach Playbook</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: SIX AD VARIATIONS                                              */}
      {/* ===================================================================== */}
      {activeTab === 'ads' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white">The 6 Psychological Ad Creative Angles</h3>
              <p className="text-xs text-slate-400">
                Testing distinct cognitive frames to identify which message generates qualified manufacturing inquiries.
              </p>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-xs">
              {AD_VARIATIONS.map((ad) => (
                <button
                  key={ad.id}
                  onClick={() => setSelectedAdId(ad.id)}
                  className={`px-3 py-1.5 rounded-lg border transition cursor-pointer font-bold ${
                    selectedAdId === ad.id
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Ad {ad.id}
                </button>
              ))}
            </div>
          </div>

          {/* Active Ad Variation Detail Card */}
          {(() => {
            const ad = AD_VARIATIONS.find((a) => a.id === selectedAdId) || AD_VARIATIONS[0];
            return (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                        Variation {ad.id} · {ad.name}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {ad.psychologicalFrame}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">Target Role: <strong className="text-white">{ad.targetRole}</strong></div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(`ad_${ad.id}`, `${ad.headline}\n\n${ad.body}\n\n${ad.cta}`)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedId === `ad_${ad.id}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied Copy</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Ad Text</span>
                        </>
                      )}
                    </button>

                    {onNavigateToAuditWithAd && (
                      <button
                        onClick={() => onNavigateToAuditWithAd(ad.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition cursor-pointer shadow-md"
                      >
                        <span>Preview Landing Page</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Ad Creative Mockup Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Text & Copy Display */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Headline:</span>
                      <h4 className="text-lg font-black text-white leading-snug">{ad.headline}</h4>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Body Copy:</span>
                      <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed whitespace-pre-line">
                        {ad.body}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">CTA Button:</span>
                      <span className="text-xs font-mono font-black text-emerald-400">{ad.cta}</span>
                    </div>
                  </div>

                  {/* Right: Visual Storyboard & Destination Context */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        <span>Recommended Visual Asset / B-Roll Concept:</span>
                      </span>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        {ad.visualConcept}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Traffic Destination:</span>
                      <div className="text-xs font-mono text-emerald-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 truncate">
                        https://operationalyst.com{ad.destinationPath}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Loads the dedicated Factory Audit page matching this exact psychological angle.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {AD_VARIATIONS.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedAdId(item.id)}
                className={`p-4 rounded-xl border transition cursor-pointer space-y-2 ${
                  selectedAdId === item.id
                    ? 'bg-slate-900 border-amber-500 text-white'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-amber-400">Ad {item.id}</span>
                  <span className="text-slate-500">{item.name}</span>
                </div>
                <div className="text-xs font-bold text-white line-clamp-2">{item.headline}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: FOUNDER VIDEO TELEPROMPTER                                     */}
      {/* ===================================================================== */}
      {activeTab === 'founder_video' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Founder On-Camera Video Script &amp; Teleprompter</h3>
              <p className="text-xs text-slate-400">
                Spoken word teleprompter for C. Jones Snowin (Duration: ~35–40 seconds). No polished corporate jargon.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTeleprompterRunning(!isTeleprompterRunning)}
                className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isTeleprompterRunning
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isTeleprompterRunning ? 'Pause Teleprompter' : 'Start Rehearsal'}</span>
              </button>
            </div>
          </div>

          {/* Teleprompter Display Box */}
          <div className="p-6 sm:p-10 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-6 text-center shadow-2xl relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-amber-400 text-xs font-mono font-bold">
              <span>Estimated Reading Time: 36 Seconds · 98 Words</span>
            </div>

            <div className="max-w-2xl mx-auto space-y-6 text-lg sm:text-2xl font-bold text-white leading-relaxed font-sans">
              <p className="text-slate-300">
                “I’m building Operationalyst around a simple manufacturing problem.
              </p>
              <p className="text-white">
                Companies already have inventory data... but understanding which items haven’t moved, where value is concentrated, and what deserves attention can still require significant manual analysis.
              </p>
              <p className="text-emerald-300">
                I’m currently looking for manufacturing teams willing to test our Factory Inventory Audit and give me brutally honest feedback.
              </p>
              <p className="text-amber-300">
                If this sounds relevant to your operation, let’s talk.”
              </p>
            </div>

            {/* Visual Production Directives */}
            <div className="pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold">Camera Framing:</span>
                <p className="text-slate-400 text-[11px] font-sans">
                  Mid-chest up. Natural office or warehouse background. Direct eye contact with lens.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-bold">Visual Cue (Sec 12):</span>
                <p className="text-slate-400 text-[11px] font-sans">
                  Hold up a standard printed Excel stock sheet or point to your laptop screen with the sample audit.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-cyan-400 font-bold">End Screen CTA:</span>
                <p className="text-slate-400 text-[11px] font-sans">
                  “Apply for Pilot Audit ➔ operationalyst.com/audit” overlay with contact email.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: LINKEDIN ORGANIC POST PACK                                     */}
      {/* ===================================================================== */}
      {activeTab === 'linkedin' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">5 High-Impact LinkedIn Organic Posts</h3>
            <p className="text-xs text-slate-400">
              Battle-tested, operator-focused posts formatted with proper line spacing and authentic engineering tone.
            </p>
          </div>

          <div className="space-y-4">
            {LINKEDIN_POSTS.map((post) => (
              <div key={post.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">{post.title}</h4>
                    <p className="text-xs text-amber-400 italic font-sans mt-0.5 font-bold">“{post.hook}”</p>
                  </div>

                  <button
                    onClick={() => handleCopy(post.id, post.body)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    {copiedId === post.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied Post</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Post</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 font-sans text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {post.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: 1-ON-1 OUTREACH PLAYBOOK                                       */}
      {/* ===================================================================== */}
      {activeTab === 'outreach' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Direct 1-on-1 Outreach Scripts</h3>
            <p className="text-xs text-slate-400">
              Respectful, non-pushy outreach for connecting directly with manufacturing decision-makers.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {OUTREACH_SCRIPTS.map((script, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">
                      Target Role: {script.role}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white font-mono">
                      Subject: {script.subject}
                    </h4>
                  </div>

                  <button
                    onClick={() => handleCopy(`outreach_${idx}`, `${script.subject}\n\n${script.body}`)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    {copiedId === `outreach_${idx}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied Script</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 font-sans text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {script.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
