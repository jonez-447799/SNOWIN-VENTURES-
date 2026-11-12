import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  Printer,
  Briefcase,
  Building2,
  ArrowRight,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Target,
  Flame
} from 'lucide-react';
import { EngineKey } from './CustomBundleCombinator';
import { formatCurrency } from '../project1/utils/calculations';

interface InteractiveDealCloserProps {
  onApplyRecommendedSequence: (sequence: EngineKey[], presetId?: string) => void;
}

export const InteractiveDealCloser: React.FC<InteractiveDealCloserProps> = ({
  onApplyRecommendedSequence,
}) => {
  // Client Profile & Live Discovery Answers
  const [prospectName, setProspectName] = useState('Sri Murugan Auto Ancillaries Pvt Ltd');
  const [promoterName, setPromoterName] = useState('Mr. Rajeshwari / Karthik (MD)');
  const [annualTurnoverCr, setAnnualTurnoverCr] = useState<number>(35);
  const [totalInventoryLakhs, setTotalInventoryLakhs] = useState<number>(140);
  const [monthlyFreightLakhs, setMonthlyFreightLakhs] = useState<number>(8.5);
  const [monthlyDispatchesCount, setMonthlyDispatchesCount] = useState<number>(65);
  const [overdueDebtorsLakhs, setOverdueDebtorsLakhs] = useState<number>(48);

  // Operational Readiness Questions (Determines DFY vs SaaS & Which Combo Order)
  const [q1BiggestPain, setQ1BiggestPain] = useState<'working_capital' | 'freight_cost' | 'oem_penalties' | 'ghost_stock'>('working_capital');
  const [q2FloorReadiness, setQ2FloorReadiness] = useState<'paper_only' | 'whatsapp_basic' | 'erp_coordinator'>('paper_only');
  const [q3ExecutionPreference, setQ3ExecutionPreference] = useState<'done_for_you' | 'hybrid' | 'self_serve_saas'>('done_for_you');
  const [q4DataAccessSpeed, setQ4DataAccessSpeed] = useState<'tally_same_day' | 'ca_controls_tally' | 'custom_erp'>('tally_same_day');

  const [copiedProposal, setCopiedProposal] = useState(false);

  // Calculate Conservative Realistic Rupee Recovery & Recommended Rollout Order
  const recommendation = useMemo(() => {
    // Conservative recovery benchmarks in Indian MSMEs:
    // 1. Dead Stock Liquidation + Prevented Reorders: ~14% of total inventory
    const estDeadCashUnlock = Math.round(totalInventoryLakhs * 100000 * 0.14);
    const estAnnualCarryingSaved = Math.round(estDeadCashUnlock * 0.22);

    // 2. Freight Rate Spread + Detention Recovery: ~9.5% of annual freight spend
    const estAnnualFreightSaved = Math.round(monthlyFreightLakhs * 100000 * 12 * 0.095);

    // 3. OTIF Penalty & Expedite Freight Reduction: ~₹3,500 per dispatch on 18% failed loads
    const estAnnualOtifSaved = Math.round(monthlyDispatchesCount * 12 * 0.18 * 4500);

    // 4. Ghost Stock Shrinkage + Spot-Buy Prevention: ~3.5% of inventory value
    const estAnnualBinShrinkageSaved = Math.round(totalInventoryLakhs * 100000 * 0.035);

    // 5. Overdue Debtor Accelerated Collection (30% of >45d overdue unlocked)
    const estDebtorCashUnlocked = Math.round(overdueDebtorsLakhs * 100000 * 0.3);

    // Determine Optimal Sequence & Preset ID based on Q1 + Q2
    let sequence: EngineKey[] = ['p3', 'p1', 'p5'];
    let presetId = 'p1_p3_p5';
    let comboTitle = 'P3 ➔ P1 ➔ P5 (CFO Back-Office Cash & Margin Recovery Suite)';
    let whyThisSequence =
      'Because the shop floor runs on paper registers, deploying tablets to gate guards (P2) or store helpers (P4) in Week 1 will face heavy staff resistance. Starting with P3 (Freight Bills) + P1 (Tally Dead Stock) + P5 (Overdue Debtors) requires ZERO shop-floor worker compliance and unlocks maximum cash from Accounts data alone.';

    if (q1BiggestPain === 'ghost_stock') {
      if (q2FloorReadiness === 'paper_only') {
        sequence = ['p1', 'p4'];
        presetId = 'p1_p4';
        comboTitle = 'P1 ➔ P4 (Total Inventory Truth Engine: Tally Ledger first, then Top-50 Bin Count)';
        whyThisSequence =
          'Start with P1 (Tally Stock Summary) on Day 1 to identify high-value Class-A items, then run a focused 2-hour physical blind count (P4) on only the top 50 bins so store helpers are not overwhelmed.';
      } else {
        sequence = ['p4', 'p1', 'p2'];
        presetId = 'p1_p2_p4';
        comboTitle = 'P4 ➔ P1 ➔ P2 (Zero-Stoppage Plant Operations Trilogy)';
        whyThisSequence =
          'Their team is already digital-ready. Lead with a morning physical bin audit (P4) to stop service/line stockouts, cross-check Tally dead stock (P1), and connect to daily gate OTIF (P2).';
      }
    } else if (q1BiggestPain === 'oem_penalties') {
      if (q2FloorReadiness === 'paper_only') {
        sequence = ['p3', 'p2'];
        presetId = 'p2_p3';
        comboTitle = 'P3 ➔ P2 (Gate-to-Corridor Dispatch & Detention Eliminator)';
        whyThisSequence =
          'Audit last 60 days of Lorry Bills (P3) and Gate Outward Registers (P2) retrospectively first to prove whether Final QC or Packing is causing the late dispatches before putting a tablet at the gate.';
      } else {
        sequence = ['p4', 'p2', 'p5'];
        presetId = 'p2_p4';
        comboTitle = 'P4 ➔ P2 ➔ P5 (Spares-to-Gate Fulfillment & Monday SLA Command)';
        whyThisSequence =
          'Eliminate "On-Time but Short-Shipped" OEM failures by verifying physical bin stock (P4) at 8:30 AM before promising gate slots (P2).';
      }
    } else if (q1BiggestPain === 'freight_cost') {
      sequence = ['p3', 'p2', 'p5'];
      presetId = 'p3_p2_p5';
      comboTitle = 'P3 ➔ P2 ➔ P5 (Outbound Logistics, Detention & Corridor SLA Suite)';
      whyThisSequence =
        'Lead with P3 (Lorry Bill Rate & Halting Audit) to recover immediate rupees from transporters, then add P2 (Gate Clock) to stop internal loading delays that cause halting charges.';
    } else if (q1BiggestPain === 'working_capital' && q2FloorReadiness !== 'paper_only') {
      sequence = ['p1', 'p3', 'p5'];
      presetId = 'p1_p3_p5';
      comboTitle = 'P1 ➔ P3 ➔ P5 (Working Capital, Freight Recovery & Monday Control Tower)';
      whyThisSequence =
        'Lead with P1 (Dead Stock Liquidation) to free up CC bank limit, layer in P3 (Freight Audit) for immediate P&L savings, and anchor the monthly retainer with P5 (Monday 9AM Board + Overdue Debtors).';
    }

    // Recommend Commercial Model (DFY vs Hybrid vs SaaS)
    let recommendedModel: 'DFY Agency Retainer' | 'Hybrid (DFY Setup + SaaS)' | 'Direct Factory SaaS' =
      'DFY Agency Retainer';
    let diagnosticFee = 20000;
    let monthlyFee = 40000;

    if (q2FloorReadiness === 'paper_only' || q3ExecutionPreference === 'done_for_you' || q4DataAccessSpeed === 'ca_controls_tally') {
      recommendedModel = 'DFY Agency Retainer';
      diagnosticFee = annualTurnoverCr >= 50 ? 35000 : 20000;
      monthlyFee = annualTurnoverCr >= 50 ? 55000 : 35000;
    } else if (q3ExecutionPreference === 'self_serve_saas' && q2FloorReadiness === 'erp_coordinator') {
      recommendedModel = 'Direct Factory SaaS';
      diagnosticFee = 25000; // Onboarding + setup
      monthlyFee = annualTurnoverCr >= 50 ? 22000 : 14000;
    } else {
      recommendedModel = 'Hybrid (DFY Setup + SaaS)';
      diagnosticFee = 30000;
      monthlyFee = 25000;
    }

    const totalFirstYearValue =
      estDeadCashUnlock +
      estDebtorCashUnlocked +
      estAnnualCarryingSaved +
      estAnnualFreightSaved +
      estAnnualOtifSaved +
      estAnnualBinShrinkageSaved;

    const totalFirstYearCost = diagnosticFee + monthlyFee * 12;
    const roiMultiple = Math.max(2, Math.round((totalFirstYearValue / totalFirstYearCost) * 10) / 10);

    return {
      estDeadCashUnlock,
      estDebtorCashUnlocked,
      estAnnualCarryingSaved,
      estAnnualFreightSaved,
      estAnnualOtifSaved,
      estAnnualBinShrinkageSaved,
      totalBalanceSheetUnlock: estDeadCashUnlock + estDebtorCashUnlocked,
      totalAnnualPnLSaved:
        estAnnualCarryingSaved + estAnnualFreightSaved + estAnnualOtifSaved + estAnnualBinShrinkageSaved,
      sequence,
      presetId,
      comboTitle,
      whyThisSequence,
      recommendedModel,
      diagnosticFee,
      monthlyFee,
      roiMultiple,
    };
  }, [
    annualTurnoverCr,
    totalInventoryLakhs,
    monthlyFreightLakhs,
    monthlyDispatchesCount,
    overdueDebtorsLakhs,
    q1BiggestPain,
    q2FloorReadiness,
    q3ExecutionPreference,
    q4DataAccessSpeed,
  ]);

  const generateWhatsAppProposalText = () => {
    return `*72-HOUR CASH & MARGIN RECOVERY PROPOSAL — ${prospectName.toUpperCase()}*
Prepared for: ${promoterName}
Plant Scale: ₹${annualTurnoverCr} Cr Turnover | ₹${totalInventoryLakhs}L Inventory

*1. RECOMMENDED PHASED ROLLOUT:*
*${recommendation.comboTitle}*
Why this order: ${recommendation.whyThisSequence}

*2. CONSERVATIVE 12-MONTH FINANCIAL IMPACT:*
• One-Time Balance Sheet Cash Unlock (Dead Stock + Overdue Debtors): *${formatCurrency(recommendation.totalBalanceSheetUnlock, 'INR')}*
• Recurring Annual P&L Bleed Stopped (Freight + Carrying + OTIF + Shrinkage): *${formatCurrency(recommendation.totalAnnualPnLSaved, 'INR')}/yr*
• Projected ROI Multiple: *${recommendation.roiMultiple}x Return on Fee*

*3. COMMERCIAL ENGAGEMENT OPTIONS (CHOOSE ONE):*
• *Option A (Done-For-You Audit & Monday Retainer — Zero Staff Load):* ₹${recommendation.diagnosticFee.toLocaleString('en-IN')} 72-Hr Diagnostic (100% Risk-Free Guarantee) ➔ ₹${recommendation.monthlyFee.toLocaleString('en-IN')}/mo Weekly Monday 9AM Control Tower Execution.
• *Option B (Direct Factory SaaS License — Your Team Runs It):* ₹25,000 One-Time Smart-Tally Onboarding ➔ ₹14,500/mo Multi-Device Cloud/Tablet License.

*4. NEXT STEP TO START THIS FRIDAY:*
Reply "APPROVE OPTION A" or "APPROVE OPTION B" and have Accounts share:
1) Tally Stock Summary CSV (Alt+F1)
2) Last 60 Days Transporter Lorry Bills`;
  };

  const handleCopyProposal = () => {
    navigator.clipboard.writeText(generateWhatsAppProposalText());
    setCopiedProposal(true);
    setTimeout(() => setCopiedProposal(false), 3000);
  };

  return (
    <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono uppercase font-bold">
            <Flame className="w-3.5 h-3.5" />
            <span>Live Client Qualification, Sequence Recommender &amp; Dual Proposal Builder</span>
          </div>
          <h2 className="text-xl font-black text-white">
            Ask These Exact Questions Live ➔ Auto-Generate Your Contract &amp; Rollout Order
          </h2>
          <p className="text-xs text-slate-400">
            Fill in the prospect&apos;s numbers during your discovery call. The engine diagnoses whether to pitch <strong>Done-For-You (DFY)</strong> or <strong>Direct SaaS</strong>, picks the lowest-risk project combination (`P1+P4`, `P3➔P1➔P5`, etc.), and builds a ready-to-send dual proposal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onApplyRecommendedSequence(recommendation.sequence, recommendation.presetId)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load Recommended Sequence ({recommendation.sequence.map((s) => s.toUpperCase()).join('➔')})</span>
          </button>
          <button
            onClick={handleCopyProposal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer transition"
          >
            {copiedProposal ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedProposal ? 'Copied WhatsApp Proposal!' : 'Copy Dual Proposal (WhatsApp)'}</span>
          </button>
        </div>
      </div>

      {/* Step 1: Quantitative Factory Scale Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider font-mono text-indigo-400 flex items-center gap-1.5">
            <Target className="w-4 h-4" />
            <span>Part A: 5 Quantitative Baseline Questions (Ask the Owner / CFO)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                Factory / Prospect Name
              </label>
              <input
                type="text"
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                Decision Maker (MD / Promoter)
              </label>
              <input
                type="text"
                value={promoterName}
                onChange={(e) => setPromoterName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-semibold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                Q1. &ldquo;What is your approx. annual turnover (₹ Cr)?&rdquo;
              </label>
              <input
                type="number"
                value={annualTurnoverCr}
                onChange={(e) => setAnnualTurnoverCr(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-amber-300 font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                Q2. &ldquo;How much total stock sits in Tally today (₹ Lakhs)?&rdquo;
              </label>
              <input
                type="number"
                value={totalInventoryLakhs}
                onChange={(e) => setTotalInventoryLakhs(Math.max(5, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-amber-300 font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                Q3. &ldquo;What is your monthly outward lorry bill spend (₹ Lakhs)?&rdquo;
              </label>
              <input
                type="number"
                step="0.5"
                value={monthlyFreightLakhs}
                onChange={(e) => setMonthlyFreightLakhs(Math.max(0.5, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                Q4. &ldquo;How many customer dispatches leave your gate per month?&rdquo;
              </label>
              <input
                type="number"
                value={monthlyDispatchesCount}
                onChange={(e) => setMonthlyDispatchesCount(Math.max(5, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-300 font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                Q5. &ldquo;How much customer payment is overdue past 45 days in Tally Sundry Debtors (₹ Lakhs)?&rdquo;
              </label>
              <input
                type="number"
                value={overdueDebtorsLakhs}
                onChange={(e) => setOverdueDebtorsLakhs(Math.max(0, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-rose-300 font-bold"
              />
            </div>
          </div>

          {/* Part B: 4 Strategic Diagnostic Questions */}
          <div className="text-xs font-bold uppercase tracking-wider font-mono text-emerald-400 flex items-center gap-1.5 pt-2">
            <HelpCircle className="w-4 h-4" />
            <span>Part B: 4 Diagnostic Questions That Dictate Sequence &amp; Business Model (DFY vs SaaS)</span>
          </div>

          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <div>
              <label className="font-bold text-slate-200 block mb-1">
                Q6. &ldquo;Which bleed hurts you most right now—bank CC interest on dead stock, transporter rate/halting overcharges, OEM late penalties, or missing fast-moving spares on the shelf?&rdquo;
              </label>
              <select
                value={q1BiggestPain}
                onChange={(e) => setQ1BiggestPain(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-300 font-semibold"
              >
                <option value="working_capital">Bank CC Interest / Cash Trapped in Dead Stock (Lead with P1)</option>
                <option value="freight_cost">Transporter Rate Overcharges &amp; Lorry Halting Bills (Lead with P3)</option>
                <option value="oem_penalties">OEM Late Delivery Penalties &amp; Short Shipments (Lead with P2+P3 or P4+P2)</option>
                <option value="ghost_stock">Tally Says In-Stock But Physical Bin Is Empty / Theft (Lead with P1+P4)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-200 block mb-1">
                Q7. &ldquo;Do your gate guards and store helpers use smartphones/tablets at work, or is the shop floor strictly paper registers?&rdquo;
              </label>
              <select
                value={q2FloorReadiness}
                onChange={(e) => setQ2FloorReadiness(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 font-semibold"
              >
                <option value="paper_only">Paper Registers Only — Staff will resist tablets (Avoid P2/P4 Day 1 ➔ Pitch P3+P1+P5 Back-Office)</option>
                <option value="whatsapp_basic">Guards &amp; Storekeepers use WhatsApp / Android Phones (Ready for P4/P2 with Device Sync)</option>
                <option value="erp_coordinator">Dedicated MIS / PPC Engineer on floor (Ready for Full Direct SaaS Rollout)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Q8. &ldquo;Who will run this every week?&rdquo;
                </label>
                <select
                  value={q3ExecutionPreference}
                  onChange={(e) => setQ3ExecutionPreference(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-300 font-semibold"
                >
                  <option value="done_for_you">Owner wants Done-For-You Monday Report (Model A)</option>
                  <option value="hybrid">We set it up for 30 days, then hand over (Hybrid)</option>
                  <option value="self_serve_saas">Their internal team wants software access (Model B SaaS)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Q9. &ldquo;How fast can your accountant export Tally CSVs?&rdquo;
                </label>
                <select
                  value={q4DataAccessSpeed}
                  onChange={(e) => setQ4DataAccessSpeed(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-indigo-300 font-semibold"
                >
                  <option value="tally_same_day">In-house Tally Clerk (Same-day export)</option>
                  <option value="ca_controls_tally">External CA / Reluctant Clerk (Use Smart Tally Mapper)</option>
                  <option value="custom_erp">SAP B1 / Zoho / Busy Excel Export</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Auto-Diagnosed Proposal & Dual Pricing Sheet */}
        <div className="lg:col-span-5 bg-slate-950 border border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                  AI Deal Diagnosis for {prospectName}
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  Best Fit: {recommendation.recommendedModel}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-black">
                {recommendation.roiMultiple}x First-Year ROI
              </span>
            </div>

            {/* Recommended Rollout Order */}
            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-indigo-300 font-bold">
                Recommended Combination &amp; Sequence:
              </div>
              <div className="text-sm font-black text-white">
                {recommendation.comboTitle}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {recommendation.whyThisSequence}
              </p>
            </div>

            {/* Conservative Financial Recovery Breakdown */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Projected Recoverable Cash &amp; Stopped Margin Bleed:
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30">
                  <div className="text-[10px] text-amber-300 font-mono uppercase">Balance Sheet Cash Unlock</div>
                  <div className="text-lg font-black font-mono text-amber-400">
                    {formatCurrency(recommendation.totalBalanceSheetUnlock, 'INR')}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Dead Stock ({formatCurrency(recommendation.estDeadCashUnlock, 'INR')}) + Debtors
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-300 font-mono uppercase">Annual P&amp;L Bleed Saved</div>
                  <div className="text-lg font-black font-mono text-emerald-400">
                    {formatCurrency(recommendation.totalAnnualPnLSaved, 'INR')}/yr
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Freight ({formatCurrency(recommendation.estAnnualFreightSaved, 'INR')}) + OTIF + Shrinkage
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-Side Option A (DFY) vs Option B (SaaS) so Owner Chooses HOW to Pay You */}
            <div className="space-y-2 pt-1">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Present Both Options Side-by-Side (The &ldquo;Choice Close&rdquo;):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-1">
                  <div className="font-mono text-[10px] uppercase text-emerald-400 font-bold">
                    Option A: Done-For-You Agency
                  </div>
                  <div className="font-black text-white text-sm">
                    ₹{recommendation.diagnosticFee.toLocaleString('en-IN')} Diagnostic
                  </div>
                  <div className="text-emerald-300 font-mono font-bold text-xs">
                    + ₹{recommendation.monthlyFee.toLocaleString('en-IN')}/mo Retainer
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Your team just emails raw Tally/LR files every Friday. We clean, audit, and deliver the Monday 9AM Owner Board.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/40 space-y-1">
                  <div className="font-mono text-[10px] uppercase text-indigo-400 font-bold">
                    Option B: Direct Factory SaaS
                  </div>
                  <div className="font-black text-white text-sm">
                    ₹25,000 Onboarding
                  </div>
                  <div className="text-indigo-300 font-mono font-bold text-xs">
                    + ₹14,500/mo Cloud License
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Includes Smart Tally Mapper, Multi-Device Gate/Store Sync, and unlimited weekly Owner Reports run by your staff.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print 1-Page Proposal</span>
            </button>
            <button
              onClick={handleCopyProposal}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer transition"
            >
              {copiedProposal ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedProposal ? 'Copied to Clipboard!' : 'Copy WhatsApp SOW'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
