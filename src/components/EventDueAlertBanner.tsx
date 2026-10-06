import { useState, useEffect } from 'react';
import { BellRing, MapPin, Clock, X, Check } from 'lucide-react';
import {
  type EventReminder,
  checkDueReminders,
  markReminderNotified,
  playChimeSound,
} from '@/features/events/event-reminder';

export function EventDueAlertBanner() {
  const [dueEvents, setDueEvents] = useState<EventReminder[]>([]);

  useEffect(() => {
    // Initial check
    const check = () => {
      const due = checkDueReminders();
      if (due.length > 0) {
        setDueEvents(due);
        playChimeSound();
      }
    };

    check();

    // Periodic check every 30 seconds
    const interval = setInterval(check, 30_000);

    const onUpdate = () => check();
    window.addEventListener('tumcu_reminder_updated', onUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('tumcu_reminder_updated', onUpdate);
    };
  }, []);

  if (dueEvents.length === 0) return null;

  const current = dueEvents[0];
  const eventDate = new Date(current.startAt);
  const formattedTime = eventDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDismiss = (eventId: string) => {
    markReminderNotified(eventId);
    setDueEvents((prev) => prev.filter((e) => e.eventId !== eventId));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] animate-in slide-in-from-bottom-5 duration-300">
      <div className="rounded-3xl border-2 border-amber-400 bg-slate-950 text-white p-5 shadow-2xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-400/40">
              <BellRing size={16} className="animate-bounce text-amber-400" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                Event Reminder Alert
              </span>
              <h4 className="text-sm font-black text-white leading-tight">{current.title}</h4>
            </div>
          </div>

          <button
            onClick={() => handleDismiss(current.eventId)}
            className="text-slate-400 hover:text-white"
            title="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
            <Clock size={12} /> Starts at {formattedTime}
          </span>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <MapPin size={12} /> {current.venue || current.location || 'Assembly Hall'}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 font-medium">Scheduled for your device</span>
          <button
            onClick={() => handleDismiss(current.eventId)}
            className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-xl transition"
          >
            <Check size={13} />
            <span>Got it, thank you</span>
          </button>
        </div>
      </div>
    </div>
  );
}
