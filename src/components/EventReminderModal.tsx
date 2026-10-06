import { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Calendar,
  Clock,
  MapPin,
  Check,
  CheckCircle2,
  CalendarPlus,
  Download,
  AlertCircle,
  X,
  Volume2,
  Mail,
  Smartphone,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/Button';
import {
  type EventReminder,
  getEventReminder,
  saveEventReminder,
  removeEventReminder,
  requestBrowserNotificationPermission,
  triggerNativeNotification,
  playChimeSound,
  getGoogleCalendarUrl,
  downloadEventReminderIcs,
} from '@/features/events/event-reminder';
import { useAuthStore } from '@/store/auth.store';

interface EventReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    description?: string | null;
    start_at: string;
    end_at?: string | null;
    venue?: string | null;
    location?: string | null;
  } | null;
  onReminderSaved?: (isSet: boolean) => void;
}

export function EventReminderModal({
  isOpen,
  onClose,
  event,
  onReminderSaved,
}: EventReminderModalProps) {
  const { user } = useAuthStore();
  const [leadMinutes, setLeadMinutes] = useState<number>(30);
  const [notifyOnDevice, setNotifyOnDevice] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [existingReminder, setExistingReminder] = useState<EventReminder | undefined>(undefined);

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, [isOpen]);

  useEffect(() => {
    if (event) {
      const saved = getEventReminder(event.id);
      setExistingReminder(saved);
      if (saved) {
        setLeadMinutes(saved.leadTimeMinutes ?? 30);
        setNotifyOnDevice(saved.notifyOnDevice ?? true);
        setEmail(saved.email ?? user?.email ?? '');
      } else {
        setEmail(user?.email ?? '');
      }
      setFeedback(null);
    }
  }, [event, isOpen, user]);

  if (!isOpen || !event) return null;

  const eventDate = new Date(event.start_at);
  const formattedDate = eventDate.toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate countdown
  const nowMs = Date.now();
  const diffMs = eventDate.getTime() - nowMs;
  const isPast = diffMs < 0;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let countdownText = 'Happening Soon';
  if (isPast) {
    countdownText = 'Event In Progress or Concluded';
  } else if (diffDays > 0) {
    countdownText = `Starts in ${diffDays} day${diffDays > 1 ? 's' : ''}, ${diffHours} hr${
      diffHours > 1 ? 's' : ''
    }`;
  } else if (diffHours > 0) {
    countdownText = `Starts in ${diffHours} hr${diffHours > 1 ? 's' : ''}, ${diffMinutes} min`;
  } else {
    countdownText = `Starts in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  }

  const handleRequestPermission = async () => {
    const perm = await requestBrowserNotificationPermission();
    setPermissionState(perm);
    if (perm === 'granted') {
      playChimeSound();
      triggerNativeNotification('🔔 Device Notifications Enabled', {
        body: `You will be alerted before "${event.title}" begins!`,
      });
      setFeedback('Device notifications enabled successfully!');
    } else {
      setFeedback('Browser notifications were declined or blocked in your browser settings.');
    }
  };

  const handleTestChime = () => {
    playChimeSound();
    if (permissionState === 'granted') {
      triggerNativeNotification(`🔔 Reminder Test: ${event.title}`, {
        body: `Service starts at ${formattedTime} at ${event.venue || 'Assembly Hall'}.`,
      });
    }
    setFeedback('Notification preview triggered on your device!');
  };

  const handleSaveReminder = async () => {
    // If device notifications requested and permission is default, ask for permission
    if (notifyOnDevice && permissionState !== 'granted') {
      const perm = await requestBrowserNotificationPermission();
      setPermissionState(perm);
    }

    const reminder: EventReminder = {
      eventId: event.id,
      title: event.title,
      startAt: event.start_at,
      endAt: event.end_at,
      venue: event.venue || event.location,
      description: event.description,
      leadTimeMinutes: leadMinutes,
      email: email.trim() || undefined,
      notifyOnDevice,
      createdAt: new Date().toISOString(),
      notified: false,
    };

    saveEventReminder(reminder);
    setExistingReminder(reminder);
    playChimeSound();

    if (permissionState === 'granted' && notifyOnDevice) {
      triggerNativeNotification(`✓ Reminder Confirmed: ${event.title}`, {
        body: `We will notify you ${
          leadMinutes === 0 ? 'at start time' : `${leadMinutes} minutes before`
        } on ${formattedDate}.`,
      });
    }

    setFeedback('Reminder successfully set! You will be alerted when this event is due.');
    onReminderSaved?.(true);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleRemove = () => {
    removeEventReminder(event.id);
    setExistingReminder(undefined);
    setFeedback('Reminder cancelled.');
    onReminderSaved?.(false);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white grid place-items-center transition"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 px-3 py-0.5 text-xs font-black uppercase tracking-wider border border-emerald-300/60">
            <BellRing size={13} className="text-emerald-600 animate-pulse" />
            <span>Event Due Notification</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white leading-tight">
            Remind Me: {event.title}
          </h2>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
            <Clock size={13} />
            <span>{countdownText}</span>
          </div>
        </div>

        {/* Event Snapshot Card */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
            <Calendar size={14} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
            <Clock size={14} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>Starts at {formattedTime}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
            <MapPin size={14} className="text-rose-600 shrink-0" />
            <span>{event.venue || event.location || 'TUM Main Assembly Hall'}</span>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Notification Alert Settings
          </h3>

          {/* Lead Time Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              When would you like to be notified?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'At Start', value: 0 },
                { label: '15 min before', value: 15 },
                { label: '30 min before', value: 30 },
                { label: '1 hour before', value: 60 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLeadMinutes(opt.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                    leadMinutes === opt.value
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Device Alert Toggle */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Smartphone className="text-emerald-700 dark:text-emerald-400 shrink-0" size={18} />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Browser & Device Notification
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Receive a push/system alert on this device when event is due
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyOnDevice}
                onChange={(e) => setNotifyOnDevice(e.target.checked)}
                className="mt-1 h-4 w-4 rounded accent-emerald-700 cursor-pointer"
              />
            </div>

            {/* Browser Permission Prompt if needed */}
            {notifyOnDevice && permissionState !== 'granted' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-amber-800 dark:text-amber-300 flex items-center gap-1 font-semibold text-[11px]">
                  <AlertCircle size={13} /> Browser permission needed
                </span>
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="text-xs font-black text-emerald-800 dark:text-emerald-400 hover:underline"
                >
                  Enable Permissions &rarr;
                </button>
              </div>
            )}

            {notifyOnDevice && permissionState === 'granted' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-bold text-[11px]">
                  <CheckCircle2 size={13} /> Active on this device
                </span>
                <button
                  type="button"
                  onClick={handleTestChime}
                  className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center gap-1"
                >
                  <Volume2 size={12} /> Test Sound
                </button>
              </div>
            )}
          </div>

          {/* Email Reminder (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Mail size={13} className="text-slate-500" />
              <span>Email Reminder (Optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yourname@students.tum.ac.ke"
              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {/* 1-Click Calendar Sync Shortcuts */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Sync Directly to Your Calendar
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href={getGoogleCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 transition"
            >
              <CalendarPlus size={14} className="text-blue-600" />
              <span>Google Calendar</span>
              <ExternalLink size={11} className="text-slate-400" />
            </a>

            <button
              type="button"
              onClick={() => downloadEventReminderIcs(event, leadMinutes)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 transition"
            >
              <Download size={14} className="text-emerald-700 dark:text-emerald-400" />
              <span>Download (.ics with Alarm)</span>
            </button>
          </div>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
          {existingReminder ? (
            <button
              type="button"
              onClick={handleRemove}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            >
              <Trash2 size={13} />
              <span>Cancel Reminder</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Dismiss
            </button>
          )}

          <Button
            variant="primary"
            onClick={handleSaveReminder}
            className="w-full sm:w-auto bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs h-11 px-6 shadow-md gap-2"
          >
            <Bell size={15} />
            <span>{existingReminder ? 'Update Reminder' : 'Set Event Reminder'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
