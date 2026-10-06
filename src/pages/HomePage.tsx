import { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  HeartHandshake,
  Users,
  Sparkles,
  Clock,
  MapPin,
  CalendarDays,
  Download,
  Calendar,
  Mail,
  Megaphone,
  Copy,
  Check,
  RefreshCw,
  Award,
  ChevronRight,
  ChevronLeft,
  Share2,
  Bookmark,
  Star,
  Flame,
  Bell,
  BellRing,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HeroCarousel } from '@/components/HeroCarousel';
import { PrayerArt } from '@/components/hero-art/PrayerArt';
import { BibleStudyArt } from '@/components/hero-art/BibleStudyArt';
import { CommunityArt } from '@/components/hero-art/CommunityArt';
import { EventReminderModal } from '@/components/EventReminderModal';
import {
  isEventReminderSet,
  checkDueReminders,
  markReminderNotified,
  triggerNativeNotification,
  playChimeSound,
  type EventReminder,
} from '@/features/events/event-reminder';
import { fetchLandingMedia } from '@/features/landing-media/landing-media.api';
import {
  fetchProgrammes,
  fetchPublicEvents,
  downloadSemesterCalendarIcs,
  type PublicEvent,
  type WeeklyProgramme,
} from '@/features/events/events.api';
import {
  fetchPublicAnnouncements,
  type PublicAnnouncement,
} from '@/features/broadcast-messages/broadcast-messages.api';
import { getDailyMidnightScripture } from '@/data/dailyScriptures';
import tumGateImage from '@/assets/tum-gate-monument.jpg';
import photo1 from '@/assets/community/community-1.jpg';
import photo2 from '@/assets/community/community-2.jpg';
import photo3 from '@/assets/community/community-3.jpg';
import photo4 from '@/assets/community/community-4.jpg';
import photo5 from '@/assets/community/community-5.jpg';

const stats = [
  { label: 'Active Ministries', value: '10', icon: Users },
  { label: 'Faith & Fellowship', value: '24/7', icon: HeartHandshake },
  { label: 'Word-Centred', value: '100%', icon: BookOpen },
];

const moments = [
  {
    title: 'Prayer that moves us',
    text: 'We gather to seek God, carry one another and intercede for our campus and nation.',
    Art: PrayerArt,
    tag: 'PRAYER',
  },
  {
    title: 'The Word that forms us',
    text: 'Bible study, discipleship, and grounded hermeneutics taking faith beyond Sunday into life.',
    Art: BibleStudyArt,
    tag: 'THE WORD',
  },
  {
    title: 'Community that sends us',
    text: 'We serve, evangelize, and build lifelong friendships that reflect the love of Christ.',
    Art: CommunityArt,
    tag: 'MISSION',
  },
];

export function HomePage() {
  // Query landing media (hero slides, 5 backdrop pictures, interval)
  const { data: media } = useQuery({
    queryKey: ['landing-media'],
    queryFn: fetchLandingMedia,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  // Query weekly spiritual rhythm programs
  const { data: dynamicProgrammes = [] } = useQuery<WeeklyProgramme[]>({
    queryKey: ['programmes'],
    queryFn: fetchProgrammes,
    staleTime: 60_000,
  });

  // Query upcoming public events (with date, venue, category, preacher)
  const { data: publicEvents = [] } = useQuery<PublicEvent[]>({
    queryKey: ['public-events'],
    queryFn: () => fetchPublicEvents(),
    staleTime: 60_000,
  });

  // Query announcements & notices
  const { data: announcements = [] } = useQuery<PublicAnnouncement[]>({
    queryKey: ['public-announcements'],
    queryFn: fetchPublicAnnouncements,
    staleTime: 60_000,
  });

  // ---------------------------------------------------------------------------
  // 5 ALTERNATING BACKDROP PICTURES (Rotates smoothly & configurable by admin)
  // ---------------------------------------------------------------------------
  const backdropSlides = useMemo(() => {
    if (media?.backdropSlides && media.backdropSlides.length > 0) {
      const activeOnly = media.backdropSlides.filter((b) => b.active);
      if (activeOnly.length > 0) return activeOnly;
    }
    return [
      { id: 'b-1', src: media?.backgroundImage?.src || tumGateImage, title: 'TUM Main Entrance Gate Monument', active: true, order: 1 },
      { id: 'b-2', src: photo1, title: 'Student Intercession & Prayer Gathering', active: true, order: 2 },
      { id: 'b-3', src: photo2, title: 'Joyful Praise & Worship in Unity', active: true, order: 3 },
      { id: 'b-4', src: photo3, title: 'Christian Fellowship & Discipleship', active: true, order: 4 },
      { id: 'b-5', src: photo5, title: 'Campus Evangelism & Servant Leadership', active: true, order: 5 },
    ];
  }, [media]);

  const [currentBackdropIdx, setCurrentBackdropIdx] = useState(0);

  useEffect(() => {
    if (backdropSlides.length <= 1) return;
    const interval = typeof media?.rotateIntervalMs === 'number' && media.rotateIntervalMs >= 2000
      ? media.rotateIntervalMs
      : 4000;
    const timer = setInterval(() => {
      setCurrentBackdropIdx((prev) => (prev + 1) % backdropSlides.length);
    }, interval);
    return () => clearInterval(timer);
  }, [backdropSlides.length, media?.rotateIntervalMs]);

  const bgOpacity = media?.backgroundImage?.opacity ?? 0.82;
  const bgBlurPx = media?.backgroundImage?.blurPx ?? 1;

  // ---------------------------------------------------------------------------
  // DAILY MIDNIGHT SCRIPTURE (Deterministic rotation after every 12:00 AM)
  // ---------------------------------------------------------------------------
  const [scriptureOffset, setScriptureOffset] = useState(0);
  const [copiedScripture, setCopiedScripture] = useState(false);
  const currentDailyScripture = useMemo(
    () => getDailyMidnightScripture(scriptureOffset),
    [scriptureOffset]
  );

  const handleCopyScripture = () => {
    const textToCopy = `${currentDailyScripture.scripture.text} — ${currentDailyScripture.scripture.reference} (TUMCU Daily Scripture)`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedScripture(true);
    setTimeout(() => setCopiedScripture(false), 2500);
  };

  // ---------------------------------------------------------------------------
  // UPCOMING EVENTS (SHOW ONLY THE TOP 2 UPCOMING GATHERINGS) & REMINDERS
  // ---------------------------------------------------------------------------
  const [eventsTab, setEventsTab] = useState<'upcoming' | 'weekly'>('upcoming');
  const [selectedReminderEvent, setSelectedReminderEvent] = useState<PublicEvent | null>(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [, setReminderVersion] = useState(0);
  const [dueReminderNotice, setDueReminderNotice] = useState<EventReminder | null>(null);

  // Sync reminder updates across components and window events
  useEffect(() => {
    const handleUpdate = () => {
      setReminderVersion((v) => v + 1);
    };
    window.addEventListener('tumcu_reminder_updated', handleUpdate);
    return () => window.removeEventListener('tumcu_reminder_updated', handleUpdate);
  }, []);

  // Periodic check for due event reminders (every 25 seconds & on mount)
  useEffect(() => {
    const runReminderCheck = () => {
      const dueList = checkDueReminders();
      if (dueList.length > 0) {
        const item = dueList[0];
        markReminderNotified(item.eventId);
        setDueReminderNotice(item);
        playChimeSound();
        triggerNativeNotification(`🔔 Event Due Alert: ${item.title}`, {
          body: `Starts at ${item.venue || 'Assembly Hall'}. Click to view details.`,
        });
      }
    };

    runReminderCheck();
    const interval = setInterval(runReminderCheck, 25000);
    return () => clearInterval(interval);
  }, []);

  // Compute strictly the next 2 upcoming events chronologically
  const upcomingTwoEvents = useMemo(() => {
    const now = Date.now();
    // Prefer upcoming events starting from now - 6 hours
    const future = publicEvents
      .filter((e) => e.start_at && new Date(e.start_at).getTime() >= now - 6 * 3600 * 1000)
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

    if (future.length >= 2) return future.slice(0, 2);
    if (future.length === 1) {
      const remaining = publicEvents
        .filter((e) => e.id !== future[0].id)
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
      return [future[0], ...remaining.slice(0, 1)];
    }
    return [...publicEvents]
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .slice(0, 2);
  }, [publicEvents]);

  const handleOpenReminder = (event: PublicEvent) => {
    setSelectedReminderEvent(event);
    setReminderModalOpen(true);
  };

  return (
    <div className="overflow-hidden">
      {/* ===================================================================== */}
      {/* HERO SECTION WITH 5 ALTERNATING BACKDROP PICTURES                    */}
      {/* ===================================================================== */}
      <div className="relative overflow-hidden min-h-[640px] lg:min-h-[720px] flex flex-col justify-between">
        {/* 5 Alternating Backdrop Layer: smooth crossfade transition */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {backdropSlides.map((slide, idx) => (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 bg-cover bg-no-repeat transform-gpu transition-all duration-1000 ease-in-out ${
                idx === currentBackdropIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
              style={{
                backgroundImage: `url(${slide.src})`,
                backgroundPosition: 'center 25%',
                filter: `blur(${bgBlurPx}px)`,
              }}
            />
          ))}
        </div>

        {/* Ambient Overlays & Scrim for perfect contrast and readability */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-700"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.58) 50%, rgba(248,251,249,0.95) 100%)',
            opacity: bgOpacity,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.8),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.7),transparent_60%)] pointer-events-none" />

        {/* Backdrop Switcher Indicator (Admin-configurable 5 pictures) */}
        <div className="relative z-10 pt-4 px-5 sm:px-8 max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1 text-[11px] font-bold text-slate-800 backdrop-blur-md border border-white/80 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>TUM Main Campus Fellowship</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-3 py-1 text-white text-[11px] font-medium border border-white/20 shadow-xs ml-auto">
            <span className="text-emerald-300 font-bold">Backdrop #{currentBackdropIdx + 1}/5:</span>
            <span className="max-w-[160px] truncate">{backdropSlides[currentBackdropIdx]?.title}</span>
            <div className="flex gap-1 ml-1.5">
              {backdropSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentBackdropIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentBackdropIdx ? 'w-4 bg-emerald-400' : 'w-1.5 bg-white/50 hover:bg-white'
                  }`}
                  aria-label={`View backdrop photo ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Hero Main Content */}
        <section className="relative px-5 pb-16 pt-10 sm:px-6 lg:pt-16">
          <div className="page-shell relative grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr]">
            <div className="relative z-10">
              <span className="eyebrow shadow-xs bg-white/95 backdrop-blur-md border border-primary-200">
                <Sparkles size={14} className="text-primary-700" /> A community on mission
              </span>
              <div className="mt-6 inline-block rounded-3xl bg-white/45 p-2 sm:p-3 -ml-2 sm:-ml-3 backdrop-blur-[2px]">
                <h1 className="max-w-3xl text-4xl font-black leading-[1.1] tracking-[-.035em] text-slate-950 sm:text-5xl lg:text-6xl drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]">
                  The Technical University of Mombasa <span className="text-primary-700 drop-shadow-xs">Christian Union</span>
                </h1>
              </div>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-900 font-bold sm:text-lg drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)]">
                Welcome to TUMCU — a Christ-centred community where students discover purpose, grow in the Word, find family and learn to serve.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/register">
                  <Button variant="primary" className="px-6 py-3.5 text-sm font-bold shadow-lg shadow-primary-900/25 hover:shadow-xl transition">
                    Join the community <ArrowRight size={17} />
                  </Button>
                </Link>
                <Link to="/ministries">
                  <Button variant="outline" className="px-6 py-3.5 text-sm font-bold border-slate-400/80 bg-white/90 text-primary-950 hover:bg-white transition backdrop-blur-md shadow-xs">
                    Explore ministries
                  </Button>
                </Link>
                <a href="#leadership">
                  <Button variant="outline" className="px-6 py-3.5 text-sm font-bold border-emerald-300 bg-emerald-50/90 text-emerald-900 hover:bg-emerald-100 transition backdrop-blur-md shadow-xs">
                    Executive leaders
                  </Button>
                </a>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-4 border-t border-slate-300/80 pt-8 sm:gap-6">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-2xl bg-white/70 p-3 sm:p-4 backdrop-blur-md border border-white/80 shadow-xs">
                    <div className="text-2xl font-black text-primary-950 sm:text-3xl drop-shadow-2xs">{s.value}</div>
                    <div className="mt-1 text-xs font-black uppercase tracking-[.14em] text-slate-800 flex items-center gap-1.5">
                      <s.icon size={13} className="text-primary-700 shrink-0" />
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:pl-6">
              <div className="absolute -right-4 top-10 h-28 w-28 rounded-full bg-gold-400/35 blur-3xl" />
              <div className="absolute -left-4 bottom-6 h-36 w-36 rounded-full bg-primary-500/25 blur-3xl" />
              <div className="relative rounded-[36px] p-3 shadow-2xl shadow-primary-950/20 bg-white/90 border border-white backdrop-blur-md">
                <div className="photo-frame rounded-[30px] bg-white/80 p-4 sm:p-6">
                  <HeroCarousel
                    slides={media?.heroCarousel}
                    rotateIntervalMs={media?.rotateIntervalMs}
                  />
                </div>
              </div>
              <div className="float-soft absolute -bottom-7 -left-2 hidden max-w-[220px] rounded-3xl p-4 sm:block bg-white/95 border border-white shadow-xl backdrop-blur-md">
                <div className="text-xs font-bold uppercase tracking-[.16em] text-gold-600">Today</div>
                <div className="mt-1 font-bold text-primary-950">Grow. Connect. Serve.</div>
                <div className="mt-1 text-xs leading-5 text-slate-800 font-bold">There is a place for you here.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Gentle transition blend into subsequent content */}
        <div className="h-10 bg-gradient-to-t from-[#f8fbf9] to-transparent pointer-events-none" />
      </div>

      {/* ===================================================================== */}
      {/* OFFICIAL ANNOUNCEMENTS TICKER / BANNER                                */}
      {/* ===================================================================== */}
      {announcements.length > 0 && (
        <section className="bg-amber-50/90 border-y border-amber-200/80 py-3.5 px-4 sm:px-6">
          <div className="page-shell flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start md:items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-amber-500 text-white grid place-items-center shrink-0 shadow-xs">
                <Megaphone size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                    Official Announcement
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {announcements[0].title}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 max-w-3xl line-clamp-1">
                  {announcements[0].body}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
              {announcements[0].venue && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white/80 px-2.5 py-1 rounded-full border border-amber-200">
                  <MapPin size={12} className="text-amber-600" />
                  {announcements[0].venue}
                </span>
              )}
              <Link
                to="/events"
                className="text-xs font-bold text-amber-900 hover:text-amber-950 underline flex items-center gap-1"
              >
                All notices <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* DAILY SCRIPTURE SECTION (Deterministically alternates at 12 midnight) */}
      {/* ===================================================================== */}
      <section className="page-shell py-8 sm:py-10">
        <div className="relative overflow-hidden rounded-[32px] border border-emerald-900/10 bg-gradient-to-br from-emerald-900 via-[#004d26] to-slate-950 p-6 sm:p-10 text-white shadow-xl">
          {/* Subtle decorative glowing background circles */}
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-gold-400/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-400/20 text-gold-300 border border-gold-400/30 px-3 py-1 text-xs font-black uppercase tracking-wider">
                  <Sparkles size={13} /> Scripture of the Day
                </span>
                <span className="text-[11px] font-medium text-emerald-200/80 bg-white/10 px-2.5 py-0.5 rounded-full">
                  Alternates daily after 12:00 midnight
                </span>
                <span className="text-[11px] font-semibold text-emerald-300">
                  • {currentDailyScripture.formattedDate}
                </span>
              </div>

              <div>
                <blockquote className="text-lg sm:text-2xl font-serif font-medium leading-relaxed sm:leading-snug text-white/95 drop-shadow-sm">
                  {currentDailyScripture.scripture.text}
                </blockquote>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-base sm:text-lg font-black tracking-wide text-gold-400">
                    — {currentDailyScripture.scripture.reference}
                  </span>
                  <span className="text-xs font-semibold text-emerald-200/70 bg-emerald-800/40 px-2.5 py-0.5 rounded-md border border-emerald-700/50">
                    {currentDailyScripture.scripture.theme}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-emerald-100/85 leading-relaxed pt-2 border-t border-emerald-800/50">
                <strong className="text-gold-300 font-bold">Devotional Thought: </strong>
                {currentDailyScripture.scripture.reflection}
              </p>
            </div>

            {/* Actions: Copy verse, cycle, or explore library */}
            <div className="flex flex-row lg:flex-col gap-2.5 shrink-0 self-start lg:self-center border-t lg:border-t-0 lg:border-l border-emerald-800/60 pt-4 lg:pt-0 lg:pl-8">
              <button
                type="button"
                onClick={handleCopyScripture}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2.5 text-xs font-bold text-white transition backdrop-blur-sm cursor-pointer"
              >
                {copiedScripture ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span>Copied to clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy verse</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setScriptureOffset((prev) => prev + 1)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 border border-emerald-700/80 px-4 py-2.5 text-xs font-bold text-emerald-100 transition cursor-pointer"
                title="View another biblical meditation"
              >
                <RefreshCw size={14} />
                <span>Next meditation</span>
              </button>

              <Link
                to="/library"
                className="inline-flex items-center gap-2 rounded-xl bg-gold-500 hover:bg-gold-400 px-4 py-2.5 text-xs font-black text-slate-950 transition shadow-sm"
              >
                <BookOpen size={14} />
                <span>Read e-books</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* UPCOMING PROGRAMS, EVENTS, SPECIAL SERVICES & GATHERINGS             */}
      {/* ===================================================================== */}
      <section className="page-shell py-12 sm:py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/80 pb-6">
          <div className="max-w-2xl">
            <span className="eyebrow">
              <Calendar size={13} className="text-primary-700" /> Live Campus Schedules & Gatherings
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-primary-950">
              Upcoming Programs, Events & <span className="text-primary-600">Special Services</span>
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Official TUMCU calendar with live venues, times, and dates updated continuously by leadership.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadSemesterCalendarIcs}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#006633] hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
            >
              <Download size={13} />
              <span>Download Official Calendar</span>
            </button>
            <Link
              to="/events"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800 transition"
            >
              <span>All Events</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Filter Pills: Upcoming Gatherings (Top 2), Weekly Spiritual Rhythm */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEventsTab('upcoming')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              eventsTab === 'upcoming'
                ? 'bg-[#006633] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar size={13} className={eventsTab === 'upcoming' ? 'text-white' : 'text-emerald-700'} />
            Upcoming Events (Next 2)
          </button>
          <button
            type="button"
            onClick={() => setEventsTab('weekly')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              eventsTab === 'weekly'
                ? 'bg-[#006633] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock size={13} className={eventsTab === 'weekly' ? 'text-white' : 'text-emerald-700'} />
            Weekly Spiritual Rhythm ({dynamicProgrammes.length})
          </button>
        </div>

        {/* 1. UPCOMING 2 EVENTS DISPLAY */}
        {eventsTab === 'upcoming' && (
          <div className="mt-8 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {upcomingTwoEvents.map((evt, idx) => {
                const eventDate = evt.start_at ? new Date(evt.start_at) : null;
                const formattedDate = eventDate
                  ? eventDate.toLocaleDateString('en-KE', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Upcoming';
                const formattedTime = eventDate
                  ? eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'TBA';
                const isReminderActive = isEventReminderSet(evt.id);

                return (
                  <div
                    key={evt.id}
                    className="relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs hover:shadow-md transition duration-200 hover:-translate-y-0.5 space-y-5"
                  >
                    <div className="space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-emerald-800 text-white font-black text-xs px-3 py-1 uppercase tracking-wider">
                            {formattedDate}
                          </span>
                          <span className="rounded-full bg-gold-500/15 text-gold-800 text-[10px] font-black px-2.5 py-0.5 border border-gold-400/40 uppercase tracking-wider">
                            {idx === 0 ? 'Next Gathering' : 'Upcoming #2'}
                          </span>
                        </div>

                        {isReminderActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold">
                            <BellRing size={12} className="text-emerald-600 animate-pulse" />
                            <span>Reminder Set</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
                        {evt.title}
                      </h3>

                      {(evt as any).preacher && (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 border border-amber-200/60">
                          <Award size={13} className="text-amber-700" />
                          <span>Preacher: {(evt as any).preacher}</span>
                        </div>
                      )}

                      {evt.description && (
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                          {evt.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <Clock size={13} className="text-emerald-700" />
                          {formattedTime}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                          <MapPin size={13} className="text-rose-600" />
                          {evt.venue || evt.location || 'Main Assembly Hall'}
                        </span>
                      </div>

                      {/* Action Bar with Remind Me Button */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        <Button
                          variant={isReminderActive ? 'outline' : 'primary'}
                          onClick={() => handleOpenReminder(evt)}
                          className={`text-xs font-black gap-2 h-10 px-4 rounded-xl shadow-xs transition ${
                            isReminderActive
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                          }`}
                        >
                          {isReminderActive ? (
                            <>
                              <CheckCircle2 size={15} className="text-emerald-700" />
                              <span>Reminder Active</span>
                            </>
                          ) : (
                            <>
                              <Bell size={15} className="text-gold-300" />
                              <span>Remind Me</span>
                            </>
                          )}
                        </Button>

                        <div className="flex items-center gap-3">
                          <Link
                            to="/events"
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline"
                          >
                            <span>Event Details</span>
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Explore Full Calendar Banner */}
            <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-r from-slate-50 via-emerald-50/20 to-slate-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-sm font-black text-slate-900">
                  Showing the 2 next upcoming services & campus gatherings
                </h4>
                <p className="text-xs text-slate-500">
                  Looking for the entire semester calendar, conferences, keshas, retreats, and special events?
                </p>
              </div>
              <Link to="/events" className="shrink-0">
                <Button variant="outline" className="text-xs font-black gap-1.5 bg-white shadow-xs border-slate-300">
                  <span>Explore Master Calendar ({publicEvents.length} Events)</span>
                  <ArrowRight size={13} />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* 2. WEEKLY PROGRAMMES RHYTHM */}
        {eventsTab === 'weekly' && (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dynamicProgrammes.map((prog: any) => {
              const isMonday = prog.day?.toLowerCase() === 'monday';
              const isSunday = prog.day?.toLowerCase() === 'sunday';

              return (
                <div
                  key={prog.id || `${prog.day}-${prog.title}`}
                  className={`flex flex-col justify-between rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isMonday
                      ? 'border-emerald-300/80 bg-gradient-to-br from-emerald-50/50 via-white to-white'
                      : isSunday
                      ? 'border-amber-200 bg-gradient-to-br from-amber-50/40 via-white to-white'
                      : 'border-slate-200/90 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="rounded-md bg-primary-900 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-white">
                        {prog.day}
                      </span>
                      {isMonday && (
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                          Bi-Weekly Alternating
                        </span>
                      )}
                      {isSunday && (
                        <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                          Sunday Service
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-primary-950 leading-snug">
                      {prog.active_this_week_title ? `${prog.title} (${prog.active_this_week_title})` : prog.title}
                    </h4>
                    {prog.description && (
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {prog.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                      <Clock size={12} className="text-emerald-600" />
                      {prog.time}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <MapPin size={12} className="text-slate-400" />
                      {prog.venue}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* MEMORABLE MOMENTS                                                       */}
      {/* ===================================================================== */}
      <section className="page-shell section-pad">
        <div className="max-w-2xl">
          <span className="eyebrow">Memorable moments</span>
          <h2 className="mt-5 text-4xl font-black tracking-tight text-primary-900 sm:text-5xl">
            Memorable <span className="text-primary-500">Moments.</span>
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            A few moments from TUMCU life, shared by the Union and published by the administrator.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {(media?.galleryPhotos?.length ? media.galleryPhotos.slice(0, 6) : moments).map((item: any, index) => {
            const isPhoto = Boolean(item.src);
            return (
              <Card key={item.id || item.title || index} className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="relative aspect-[16/10] overflow-hidden bg-primary-950">
                  {isPhoto ? (
                    <img
                      src={item.src}
                      alt={item.alt || item.caption || 'TUMCU memorable moment'}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <item.Art />
                  )}
                  <div className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-[.2em] text-gold-300 backdrop-blur-md">
                    {isPhoto ? 'TUMCU LIFE' : item.tag}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-black text-primary-950">
                    {isPhoto ? (item.caption || item.alt || 'A TUMCU memorable moment') : item.title}
                  </h3>
                  {isPhoto && item.caption && (
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.caption}</p>
                  )}
                  {!isPhoto && <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* CALL TO ACTION                                                        */}
      {/* ===================================================================== */}
      <section className="page-shell section-pad">
        <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-primary-900 via-primary-950 to-slate-950 p-8 text-white sm:p-14">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[.2em] text-gold-300 backdrop-blur-md">
              Start your journey
            </div>
            <h2 className="mt-6 text-3xl font-black sm:text-4xl">
              Ready to be part of what God is doing at TUM?
            </h2>
            <p className="mt-4 text-base leading-7 text-white/80">
              Register as a member, find a ministry where your gifts can serve, and connect with fellow students pursuing Christ together.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register">
                <Button variant="secondary" className="px-6 py-3.5 text-sm font-bold">
                  Register for membership <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/ministries">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-6 py-3.5 text-sm font-bold">
                  See our ministries
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* FLOATING DUE EVENT REMINDER NOTIFICATION BANNER                       */}
      {/* ===================================================================== */}
      {dueReminderNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100%-3rem)] sm:w-full p-4 rounded-3xl bg-slate-950 text-white border-2 border-gold-400 shadow-2xl animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gold-500/20 text-gold-300 grid place-items-center shrink-0 border border-gold-400/40">
                <BellRing size={20} className="animate-bounce text-gold-300" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gold-300 bg-gold-400/10 px-2 py-0.5 rounded-full border border-gold-400/30">
                    Live Event Due Alert
                  </span>
                </div>
                <h4 className="text-sm font-black text-white leading-tight">
                  {dueReminderNotice.title}
                </h4>
                <p className="text-xs text-emerald-200">
                  {dueReminderNotice.venue || 'TUM Main Assembly Hall'} — Happening now or starting soon!
                </p>
              </div>
            </div>
            <button
              onClick={() => setDueReminderNotice(null)}
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
              aria-label="Dismiss alert"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* EVENT REMINDER MODAL                                                  */}
      {/* ===================================================================== */}
      <EventReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        event={selectedReminderEvent}
        onReminderSaved={() => setReminderVersion((v) => v + 1)}
      />
    </div>
  );
}
