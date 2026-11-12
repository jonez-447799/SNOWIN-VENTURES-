import React from 'react';
import { 
  BookOpen, 
  IndianRupee, 
  AlertOctagon, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  MapPin, 
  Compass, 
  HelpCircle,
  Briefcase,
  UserCheck,
  Award,
  ArrowRight
} from 'lucide-react';
import { RulesConfig } from '../types/otif';

interface FieldGuideProps {
  rules?: RulesConfig;
  onOpenFounderKit?: () => void;
  onOpenPricing?: () => void;
}

export const FieldGuide: React.FC<FieldGuideProps> = ({
  rules,
  onOpenFounderKit,
  onOpenPricing,
}) => {
  const profile = rules?.factoryProfile;
  const starterPrice = profile?.monthlyPriceStarter ?? 2999;
  const proPrice = profile?.monthlyPricePro ?? 4999;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Consultant Field Guide &amp; Tactical Manual</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          What You Are Actually Selling in Sriperumbudur &amp; Oragadam
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          "A small component unit around Sriperumbudur or Oragadam promises a date on a purchase order or on WhatsApp. 
          The truck often leaves the next morning. Sometimes it leaves on time with half the quantity. 
          The owner feels this as <strong className="text-white">‘the customer is shouting.’</strong> 
          He cannot say what percent failed last fortnight, or whether the shout is about lateness or about a short load. 
          Those are different fixes. A late full load needs a vehicle or a QC release. A short load needs material. You separate them."
        </p>
      </div>

      {/* FOUNDER IDENTITY: What to Call Yourself */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">How to Introduce Yourself at the Factory Gate</h3>
              <p className="text-xs text-slate-400">Never say you are a student or IT guy. Use these respected professional titles.</p>
            </div>
          </div>

          {onOpenFounderKit && (
            <button
              onClick={onOpenFounderKit}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Open Full Pitch Kit &amp; Scripts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <span className="font-bold text-amber-300 block flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Plant Dispatch Auditor
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Factory owners respect auditors because auditors find where money is leaking and don't sell bloated products.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <span className="font-bold text-blue-300 block flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              OEM Rating Specialist
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Auto suppliers fear losing their OEM vendor rating with Hyundai or Tata. You help them protect their rating.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-300 block flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              Operations Partner
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Positions you as a mature operational peer fixing gate-out bottlenecks rather than a vendor selling software.
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-300">
          <strong className="text-amber-300">Your 15-Second Door-Opener: </strong>
          <em>"Sir, we help auto suppliers stop customer penalty debit notes. If your trucks leave the gate on time, you should never pay a late-delivery fine. We provide the gate-stamped defense certificates."</em>
        </div>
      </div>

      {/* Commercial SaaS Subscription & Plant Rollout Card */}
      <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <IndianRupee className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Commercial Software Subscription &amp; Rollout</h3>
          </div>
          <div className="flex items-center gap-2">
            {onOpenPricing && (
              <button
                onClick={onOpenPricing}
                className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 cursor-pointer"
              >
                Change Prices
              </button>
            )}
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500 text-slate-950 font-mono">
              PLANT LICENSE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Starter Single Plant Edition:</span>
            <div className="text-2xl font-black text-amber-400 font-mono">
              ₹{starterPrice.toLocaleString('en-IN')} / month
            </div>
            <p className="text-xs text-slate-400 pt-1">
              For standalone machine shops. Includes real-time gate logging, daily WhatsApp summaries, and 1-page owner audit scorecards.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Pro Industrial Auto Supplier Edition:</span>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              ₹{proPrice.toLocaleString('en-IN')} / month
            </div>
            <p className="text-xs text-slate-400 pt-1">
              Full plant deployment with Gate Touchscreen Tablet, What-If Kaizen simulator, automated 8D CAPA generator, and official OEM SLA dispatch certificates.
            </p>
          </div>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
          <strong className="text-white">Rapid Rollout:</strong> Factory onboarding completes in under 3 days: 
          <span className="text-amber-300 font-semibold font-mono"> "Upload last 14 days of gate passes or connect Excel/SAP to go live immediately."</span>
        </div>
      </div>

      {/* What You Do NOT Do (The Guardrails) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-rose-400" />
          <span>What You Do NOT Do (Strict Disciplines)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1 text-slate-300">
            <span className="font-bold text-rose-300 block flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              Do NOT offer GPS or highway tracking
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              This is not a transport tracking app. You are not tracking whether the vehicle gets stuck in the Red Hills traffic jam. He controls his gate, not the highway.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1 text-slate-300">
            <span className="font-bold text-rose-300 block flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              Do NOT call 50% a live client result
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              The 18-row sample is a practice engine built on a simulated Oragadam component supplier so you can master the flips before touching his real book.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1 text-slate-300">
            <span className="font-bold text-rose-300 block flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              Do NOT mix Project 1 into the meeting
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Dead stock is cash on the shelf (Project 1). This is promises at the gate (Project 2). Keep them completely separate in your client conversation.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1 text-slate-300">
            <span className="font-bold text-rose-300 block flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              Do NOT hand him five simultaneous actions
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Three reasons cover 7 of the 9 fails. Tell him to fix material shortage first. Overwhelming an SME factory owner with five actions ensures none will happen.
            </p>
          </div>
        </div>
      </div>

      {/* The Industry Vocabulary (The Words) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-blue-400" />
          <span>The Industry Vocabulary (The Words)</span>
        </h3>

        <div className="divide-y divide-slate-800 text-xs">
          <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <span className="w-36 font-bold text-amber-300 font-mono shrink-0">Dispatch</span>
            <p className="text-slate-300">The moment goods physically leave his factory gate, tied to the security gate pass.</p>
          </div>

          <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <span className="w-36 font-bold text-amber-300 font-mono shrink-0">OTIF / DIFOT</span>
            <p className="text-slate-300">On Time In Full (some auto plants say Delivery In Full On Time). Both tests must pass, or the line is scored as Fail.</p>
          </div>

          <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <span className="w-36 font-bold text-amber-300 font-mono shrink-0">Short Shipment</span>
            <p className="text-slate-300">A partial dispatch. Sending 28 of 40 pieces today and the rest tomorrow does not save this row from failing.</p>
          </div>

          <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <span className="w-36 font-bold text-amber-300 font-mono shrink-0">OEM / Tier-1 / Tier-2</span>
            <p className="text-slate-300">OEM is the automaker (Hyundai, Royal Enfield, Ashok Leyland). Tier-1 supplies OEM directly. Your owner is usually Tier-2. The pain still lands on him because the Tier-1 passes the OEM scorecard down.</p>
          </div>

          <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <span className="w-36 font-bold text-amber-300 font-mono shrink-0">Gate Register</span>
            <p className="text-slate-300">The physical security guard notebook: vehicle registration plate, in-time, out-time. Often the plant's only true clock.</p>
          </div>

          <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <span className="w-36 font-bold text-amber-300 font-mono shrink-0">Detention</span>
            <p className="text-slate-300">When a truck waits at loading bay or customer dock. That is a freight logistics audit, not factory gate OTIF. Only enter it if it made the load leave late, with reason "No vehicle".</p>
          </div>
        </div>
      </div>
    </div>
  );
};
