import React, { useState } from 'react';
import { 
  Send, 
  Copy, 
  Check, 
  Clock, 
  ExternalLink, 
  MessageSquare, 
  Smartphone,
  Sparkles,
  Info
} from 'lucide-react';
import { MondayTowerData, Language } from '../types';
import { buildWhatsAppNote } from '../utils/formatters';
import { TRANSLATIONS } from '../utils/translations';

interface MondayNoteCardProps {
  towerData: MondayTowerData;
  language: Language;
  isDarkMode: boolean;
  onOpenProject: (projectId: number) => void;
}

export const MondayNoteCard: React.FC<MondayNoteCardProps> = ({
  towerData,
  language,
  isDarkMode,
  onOpenProject,
}) => {
  const [copied, setCopied] = useState(false);
  const t = TRANSLATIONS[language];

  const freightPerTrip = towerData.tripsCount > 0 
    ? towerData.freightPaidRupees / towerData.tripsCount 
    : 0;
  
  const otifPercent = towerData.dispatchesCount > 0 
    ? (towerData.otifPassesCount / towerData.dispatchesCount) * 100 
    : 0;

  const noteText = buildWhatsAppNote({
    clientName: towerData.clientName,
    weekEndingDate: towerData.weekEndingDate,
    deadCash: towerData.deadCashRupees,
    stockoutSKUs: towerData.stockoutRiskCount,
    ordersLate: towerData.ordersLateCount,
    dispatches: towerData.dispatchesCount,
    freightPerTrip,
    otifPercent,
    unpaidBills: towerData.unpaidBillsRupees,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(noteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppSend = () => {
    const encoded = encodeURIComponent(noteText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className={`rounded-xl border transition-all overflow-hidden ${
      isDarkMode
        ? 'bg-neutral-900 border-neutral-800 shadow-xl'
        : 'bg-white border-neutral-200 shadow-md'
    }`}>
      {/* Header Bar */}
      <div className={`px-4 sm:px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
        isDarkMode ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                The Monday WhatsApp Note
              </h2>
              <span className="text-[11px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                The Product
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Week ending {towerData.weekEndingDate} · {towerData.clientName}
            </p>
          </div>
        </div>

        {/* 9:00 AM Urgency pill */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${
          isDarkMode
            ? 'bg-amber-950/30 border-amber-800/60 text-amber-300'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <Clock className="w-3.5 h-3.5 animate-pulse text-amber-500" />
          <span className="font-semibold">Send Before 09:00 AM IST</span>
          <span className="hidden lg:inline text-neutral-400">· Gate opens soon</span>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Quote explanation from prompt */}
        <div className="text-xs text-neutral-400 leading-relaxed italic border-l-2 border-amber-500/60 pl-3">
          "Every Monday before 9 am he gets six numbers on WhatsApp. The sheet is only the backup if he asks how you got them. 
          Those six lines are the product. You are selling the repetition, not a new tool."
        </div>

        {/* The Authentic WhatsApp Message Bubble */}
        <div className={`rounded-xl p-4 sm:p-5 border transition-all ${
          isDarkMode
            ? 'bg-[#0B141A] border-[#222E35] text-neutral-100'
            : 'bg-[#EFEAE2] border-neutral-300 text-neutral-900'
        }`}>
          <div className="flex items-center justify-between text-xs mb-3 text-neutral-400 pb-2 border-b border-neutral-700/30">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-medium">WhatsApp Dispatch to Factory Owner</span>
            </div>
            <span className="font-mono text-[11px]">08:30 AM · Delivered</span>
          </div>

          <div className={`rounded-lg p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed font-mono shadow-sm border ${
            isDarkMode 
              ? 'bg-[#1F2C34] text-neutral-100 border-[#2A3942]' 
              : 'bg-white text-neutral-900 border-neutral-200'
          }`}>
            <p className="font-semibold text-amber-400 mb-2">
              Monday note, week ending {towerData.weekEndingDate}.
            </p>
            
            <div className="space-y-1 my-2">
              <div 
                onClick={() => onOpenProject(1)}
                className="cursor-pointer hover:underline text-emerald-400 flex items-center justify-between group"
              >
                <span>Dead cash <strong className="text-white">₹{towerData.deadCashRupees.toLocaleString('en-IN')}</strong>.</span>
                <span className="text-[10px] text-neutral-500 group-hover:text-amber-400">Open P1 ➔</span>
              </div>
              
              <div 
                onClick={() => onOpenProject(2)}
                className="cursor-pointer hover:underline text-emerald-400 flex items-center justify-between group"
              >
                <span>Stockout risk <strong className="text-white">{towerData.stockoutRiskCount} SKUs</strong>.</span>
                <span className="text-[10px] text-neutral-500 group-hover:text-amber-400">Open P4 ➔</span>
              </div>
              
              <div 
                onClick={() => onOpenProject(3)}
                className="cursor-pointer hover:underline text-emerald-400 flex items-center justify-between group"
              >
                <span>Orders late <strong className="text-white">{towerData.ordersLateCount} of {towerData.dispatchesCount}</strong>.</span>
                <span className="text-[10px] text-neutral-500 group-hover:text-amber-400">Open P2 ➔</span>
              </div>
              
              <div 
                onClick={() => onOpenProject(4)}
                className="cursor-pointer hover:underline text-emerald-400 flex items-center justify-between group"
              >
                <span>Freight per trip <strong className="text-white">₹{Math.round(freightPerTrip).toLocaleString('en-IN')}</strong>.</span>
                <span className="text-[10px] text-neutral-500 group-hover:text-amber-400">Open P3 ➔</span>
              </div>
              
              <div 
                onClick={() => onOpenProject(5)}
                className="cursor-pointer hover:underline text-emerald-400 flex items-center justify-between group"
              >
                <span>OTIF <strong className="text-white">{Math.round(otifPercent)}%</strong>.</span>
                <span className="text-[10px] text-neutral-500 group-hover:text-amber-400">Open OTIF ➔</span>
              </div>
              
              <div 
                onClick={() => onOpenProject(6)}
                className="cursor-pointer hover:underline text-emerald-400 flex items-center justify-between group"
              >
                <span>Unpaid bills <strong className="text-white">₹{towerData.unpaidBillsRupees.toLocaleString('en-IN')}</strong>.</span>
                <span className="text-[10px] text-neutral-500 group-hover:text-amber-400">Open Tally ➔</span>
              </div>
            </div>

            <p className="font-semibold text-emerald-400 pt-2 border-t border-neutral-700/30">
              Reply with the one you want opened today.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>Click any line above to test the "Reply" flow.</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : isDarkMode
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
                    : 'bg-neutral-100 border-neutral-300 text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t.copied : t.copyWhatsApp}</span>
            </button>

            <button
              onClick={handleWhatsAppSend}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>{t.openInWhatsApp}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
