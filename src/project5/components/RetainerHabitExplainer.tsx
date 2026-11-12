import React from 'react';
import { X, CheckCircle, IndianRupee, Clock, Smartphone, AlertOctagon } from 'lucide-react';

interface RetainerHabitExplainerProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const RetainerHabitExplainer: React.FC<RetainerHabitExplainerProps> = ({
  isOpen,
  onClose,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
        isDarkMode 
          ? 'bg-neutral-900 border-neutral-800 text-neutral-100' 
          : 'bg-white border-neutral-200 text-neutral-900'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isDarkMode ? 'bg-neutral-950/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <div>
            <span className="text-xs font-mono text-amber-500 uppercase font-bold tracking-wider">
              Project 5 Philosophy
            </span>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              What You Are Actually Selling: The Habit
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed text-neutral-300">
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 font-medium">
            "An owner will look at a dead-stock page once. He will not open Excel every Monday. What he will read is a WhatsApp note that says which number got worse. You are selling the repetition, not a new tool."
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm">Core Operating Rules:</h3>
            
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-neutral-100">Price is ₹5,000–₹8,000 a month, cancel any month:</strong>
                  <p className="text-neutral-400 text-xs">It is not a software subscription. It is the monthly fee for that note.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-neutral-100">Do not sell it on the first visit:</strong>
                  <p className="text-neutral-400 text-xs">Sell it after he has paid for a dead-stock page, an OTIF fortnight, a freight month, or a bin count, and he wants the number again without calling you.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <AlertOctagon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-neutral-100">Strict limit of 6 numbers:</strong>
                  <p className="text-neutral-400 text-xs">One tower is one client. Do not mix two factories into one note. If you add a seventh number, delete one. Six is the limit because he is reading it on a phone before the gate opens.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-neutral-100">Send before 9:00 AM:</strong>
                  <p className="text-neutral-400 text-xs">After 9 he is on the shop floor and the note is dead.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Smartphone className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-neutral-100">"Reply with the one you want opened today":</strong>
                  <p className="text-neutral-400 text-xs">That last line is the point. He picks one. You open that project. You do not send an essay.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex justify-end ${
          isDarkMode ? 'bg-neutral-950/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
