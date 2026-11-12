import React, { useState } from 'react';
import { AlertTriangle, Clock, Bell, X, Check, Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface DelayAlertsBannerProps {
  language: Language;
  isDarkMode: boolean;
  onOpenProject: (projectId: number) => void;
  ordersLateCount: number;
  stockoutCount: number;
}

export const DelayAlertsBanner: React.FC<DelayAlertsBannerProps> = ({
  language,
  isDarkMode,
  onOpenProject,
  ordersLateCount,
  stockoutCount,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const t = TRANSLATIONS[language];

  const alerts = [
    {
      id: 'alert-time',
      type: 'urgent',
      icon: Clock,
      title: 'Monday 08:30 AM — Send Note Before 9:00 AM',
      message: 'Factory gate opens at 09:00 AM. After 9:00 he is on the shop floor and the note is dead.',
      actionLabel: 'Review Note',
      action: () => {},
      badge: '28m to Gate Open',
    },
    {
      id: 'alert-late',
      type: 'warning',
      icon: AlertTriangle,
      title: `${ordersLateCount} Dispatches Delayed Clock Times`,
      message: 'Trip #TR-101 (Sriperumbudur) delayed 135 mins; Bay 2 crane hook issue reported.',
      actionLabel: 'Open Late Orders',
      action: () => onOpenProject(3), // Project 2: Orders Late
      badge: 'Project 2',
    },
    {
      id: 'alert-stockout',
      type: 'critical',
      icon: AlertTriangle,
      title: `${stockoutCount} Critical A-SKUs Run-out Risk`,
      message: 'M12 Grade 8.8 Hex Bolts down to 6.5 days supply (lead time is 10 days).',
      actionLabel: 'Open Stockout SKUs',
      action: () => onOpenProject(2), // Project 4: Stockout Risk
      badge: 'Project 4',
    }
  ].filter(alert => !dismissedAlerts.includes(alert.id));

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-6 no-print">
      {alerts.map((alert) => {
        const Icon = alert.icon;
        const isUrgent = alert.type === 'urgent';
        const isCritical = alert.type === 'critical';

        return (
          <div
            key={alert.id}
            className={`rounded-lg p-3 sm:p-4 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isUrgent
                ? isDarkMode
                  ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
                : isCritical
                  ? isDarkMode
                    ? 'bg-red-950/30 border-red-800/60 text-red-200'
                    : 'bg-red-50 border-red-300 text-red-900'
                  : isDarkMode
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-200'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-md shrink-0 mt-0.5 ${
                isUrgent 
                  ? 'bg-amber-500/20 text-amber-400' 
                  : isCritical 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-neutral-800 text-neutral-400'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-xs sm:text-sm tracking-tight">{alert.title}</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-black/20 border border-current/20">
                    {alert.badge}
                  </span>
                </div>
                <p className="text-xs opacity-90 mt-0.5">
                  {alert.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={alert.action}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1 transition-all ${
                  isUrgent
                    ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-sm'
                    : isCritical
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm'
                      : isDarkMode
                        ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100'
                        : 'bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300'
                }`}
              >
                <span>{alert.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 text-neutral-400 hover:text-neutral-200 transition-colors"
                title={soundEnabled ? 'Mute alert sounds' : 'Enable alert chimes'}
                aria-label="Toggle alert sound"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setDismissedAlerts([...dismissedAlerts, alert.id])}
                className="p-1.5 text-neutral-400 hover:text-neutral-200 transition-colors"
                title="Dismiss alert"
                aria-label="Dismiss alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
