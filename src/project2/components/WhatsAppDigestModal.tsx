import React, { useState } from 'react';
import { MessageSquare, Send, Check, Copy, ExternalLink, X, Smartphone, Bell, AlertTriangle } from 'lucide-react';
import { OTIFMetrics, RulesConfig } from '../types/otif';

interface WhatsAppDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: OTIFMetrics;
  rules: RulesConfig;
}

export const WhatsAppDigestModal: React.FC<WhatsAppDigestModalProps> = ({
  isOpen,
  onClose,
  metrics,
  rules,
}) => {
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState(rules.factoryProfile?.managerPhone || '+919840123456');
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const company = rules.factoryProfile?.companyName || 'Apex Precision Automotive Ltd';
  const plant = rules.factoryProfile?.plantName || 'Oragadam Plant 1';
  const location = rules.factoryProfile?.clusterLocation || 'Sriperumbudur Industrial Cluster';
  const threshold = rules.criticalAlertThreshold ?? 60;
  const isBreached = metrics.otifPercent < threshold;

  // Format executive WhatsApp digest text
  const messageText = `🚨 *${company.toUpperCase()}*
📍 *Plant:* ${plant} (${location})
📅 *Fortnight Window:* ${rules.weekStart} to ${rules.weekEnd}

${isBreached ? '⚠️ *CRITICAL ALERT: OTIF SLA BREACH*' : '✅ *DAILY DISPATCH OTIF STATUS*'}
------------------------------------
🎯 *Gate OTIF Score:* *${metrics.otifPercent}%* (${metrics.passes} of ${metrics.totalDispatches} Passed)
⏰ *On-Time Alone:* ${metrics.onTimePercent}% (${metrics.onTimeCount} loads)
📦 *In-Full Alone:* ${metrics.inFullPercent}% (${metrics.inFullCount} loads)
❌ *Total Failures:* ${metrics.fails} (${metrics.failsLateOnly} Late, ${metrics.failsShortOnly} Short, ${metrics.failsLateAndShort} Both)

📊 *Customer Performance:*
${metrics.customerStats.map(c => `• ${c.customer}: ${c.otifPercent}% (${c.passes}/${c.dispatches})`).join('\n')}

⚠️ *Top Delay Bottleneck:* ${metrics.topFailureReason?.reason || 'Material shortage'} (${metrics.topFailureReason?.count || 4} loads)
${isBreached ? `🚨 *Action Required:* Score is below management's ${threshold}% critical threshold. Expedite raw material and gate sign-offs immediately.` : '✨ *Status:* Gate operations compliant.'}

_Dispatched via Enterprise OTIF Engine_`;

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(messageText);
  const whatsappUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendSimulation = () => {
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Executive WhatsApp &amp; SMS Dispatch</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Daily 8:00 PM Digest
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Send an immediate executive scorecard briefing directly to the factory owner or plant head's phone.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Recipient Input */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Plant Manager / Owner WhatsApp Number:</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98401 23456"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">Country code included</span>
            </div>
          </div>

          {/* Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Message Preview (Formatted for Mobile):</span>
              <button
                onClick={handleCopy}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto border-l-4 border-l-emerald-500">
              {messageText}
            </div>
          </div>

          {sentSuccess && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Simulated API trigger dispatched to {phone}! In production, this hooks into Twilio/WhatsApp Business API.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSendSimulation}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Scheduled 8 PM Webhook</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Open in WhatsApp</span>
              <ExternalLink className="w-3 h-3 text-emerald-200" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
