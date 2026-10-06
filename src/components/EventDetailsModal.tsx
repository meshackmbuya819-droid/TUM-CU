import { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Share2,
  Check,
  CalendarPlus,
  Download,
  Bell,
  Sparkles,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/Button';
import {
  type PublicEvent,
  EVENT_TYPE_LABELS,
  formatEventDate,
} from '@/features/events/events.api';
import { getGoogleCalendarUrl, downloadEventReminderIcs } from '@/features/events/event-reminder';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: PublicEvent | null;
  onOpenReminder: (event: PublicEvent) => void;
  isReminderActive?: boolean;
}

export function EventDetailsModal({
  isOpen,
  onClose,
  event,
  onOpenReminder,
  isReminderActive = false,
}: EventDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !event) return null;

  const startDate = new Date(event.start_at);
  const timeString = startDate.toLocaleTimeString('en-KE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const formattedDate = formatEventDate(event.start_at);
  const typeLabel = EVENT_TYPE_LABELS[event.event_type] || event.event_type || 'Gathering';

  // Compute countdown
  const now = new Date();
  const diffMs = startDate.getTime() - now.getTime();
  const isPast = diffMs < 0;
  const daysDiff = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const handleShare = () => {
    const text = `TUMCU Event: ${event.title}\nDate: ${formattedDate} at ${timeString}\nVenue: ${event.venue || event.location || 'Assembly Hall'}\nMinister: ${event.preacher || 'TUMCU Leadership'}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoogleCalendar = () => {
    const gUrl = getGoogleCalendarUrl({
      title: event.title,
      description: event.description,
      start_at: event.start_at,
      end_at: event.end_at,
      venue: event.venue || event.location,
    });
    window.open(gUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadIcs = () => {
    downloadEventReminderIcs({
      title: event.title,
      description: event.description,
      start_at: event.start_at,
      end_at: event.end_at,
      venue: event.venue || event.location,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Banner with gradient */}
        <div className="bg-gradient-to-r from-primary-950 via-primary-900 to-slate-900 px-6 sm:px-8 pt-6 pb-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition"
          >
            <X size={16} />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30 px-3 py-1 text-xs font-black uppercase tracking-wider">
              {typeLabel}
            </span>
            {!isPast && (
              <span className="rounded-full bg-gold-400/20 text-gold-300 ring-1 ring-gold-400/30 px-2.5 py-0.5 text-[11px] font-bold">
                {daysDiff <= 0 ? 'Today / Imminent' : daysDiff === 1 ? 'Tomorrow' : `In ${daysDiff} days`}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
            {event.title}
          </h2>

          {event.theme && (
            <p className="mt-2 text-xs font-semibold text-gold-300 flex items-center gap-1.5">
              <Sparkles size={13} /> Theme: &ldquo;{event.theme}&rdquo;
            </p>
          )}
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Key metadata grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-emerald-400">
                <Calendar size={18} />
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Date</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{formattedDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-emerald-400">
                <Clock size={18} />
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Time</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {event.start_time || timeString}
                  {event.end_time ? ` – ${event.end_time}` : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-emerald-400">
                <MapPin size={18} />
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Venue</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {event.venue || event.location || 'Assembly Hall, TUM Main Campus'}
                </span>
              </div>
            </div>

            {event.preacher && (
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-emerald-400">
                  <User size={18} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Speaker / Minister</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{event.preacher}</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                About this service / fellowship
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}

          {/* Action Hub */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenReminder(event);
                }}
                className={`text-xs gap-1.5 font-bold ${
                  isReminderActive
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-primary-900 hover:bg-primary-800 text-white'
                }`}
              >
                <Bell size={14} />
                <span>{isReminderActive ? 'Reminder Scheduled' : 'Remind Me'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleGoogleCalendar}
                className="text-xs gap-1.5 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <CalendarPlus size={14} className="text-emerald-600" />
                <span>Google Calendar</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadIcs}
                className="text-xs gap-1.5 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download size={14} className="text-primary-600" />
                <span>iCal / Outlook</span>
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="text-xs gap-1.5 text-slate-600 dark:text-slate-400"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-600" /> Copied!
                </>
              ) : (
                <>
                  <Share2 size={14} /> Share
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
