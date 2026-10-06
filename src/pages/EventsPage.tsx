import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Download,
  Upload,
  Search,
  Filter,
  Bell,
  BellRing,
  User,
  CheckCircle2,
  CalendarPlus,
  LayoutGrid,
  ListTree,
  Repeat,
  ChevronRight,
  RotateCcw,
  FileText,
  FileSpreadsheet,
  X,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import {
  fetchPublicEvents,
  fetchProgrammes,
  fetchCalendarInfo,
  downloadOfficialCalendar,
  type PublicEvent,
  type WeeklyProgramme,
  type DownloadableCalendarInfo,
  EVENT_TYPE_LABELS,
  formatEventDate,
} from '@/features/events/events.api';
import { isEventReminderSet, getGoogleCalendarUrl } from '@/features/events/event-reminder';
import { EventReminderModal } from '@/components/EventReminderModal';
import { EventDetailsModal } from '@/components/EventDetailsModal';
import { UploadCalendarModal } from '@/components/UploadCalendarModal';
import { useAuthStore } from '@/store/auth.store';

type ViewMode = 'grid' | 'timeline' | 'weekly';
type CategoryFilter = 'all' | 'services' | 'missions' | 'gatherings' | 'meetings';
type MonthFilter = 'all' | '9' | '10' | '11' | '12'; // 9 = Sep, 10 = Oct, 11 = Nov, 12 = Dec

export function EventsPage() {
  const { user, hasPermission, isSuperAdmin } = useAuthStore();
  const isAdmin =
    isSuperAdmin() ||
    hasPermission('events.create') ||
    hasPermission('events.edit') ||
    hasPermission('system.manage_roles') ||
    user?.role === 'super_admin' ||
    user?.role === 'admin';

  // Navigation & filter states
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedMonth, setSelectedMonth] = useState<MonthFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reminderVersion, setReminderVersion] = useState(0);

  // Modals state
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<PublicEvent | null>(null);
  const [selectedEventForReminder, setSelectedEventForReminder] = useState<PublicEvent | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Queries
  const {
    data: events = [],
    isLoading: eventsLoading,
    isError: eventsError,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ['events', 'public-all'],
    queryFn: () => fetchPublicEvents(100),
    staleTime: 60_000,
  });

  const { data: programmes = [], isLoading: programmesLoading } = useQuery<WeeklyProgramme[]>({
    queryKey: ['programmes', 'weekly-all'],
    queryFn: fetchProgrammes,
    staleTime: 60_000,
  });

  const { data: calendarInfo, isLoading: calendarInfoLoading } = useQuery<DownloadableCalendarInfo>({
    queryKey: ['downloadable-calendar-info'],
    queryFn: fetchCalendarInfo,
    staleTime: 30_000,
  });

  // Listen to reminder updates in localStorage
  useEffect(() => {
    const handleUpdate = () => setReminderVersion((v) => v + 1);
    window.addEventListener('tumcu_reminder_updated', handleUpdate);
    return () => window.removeEventListener('tumcu_reminder_updated', handleUpdate);
  }, []);

  // Sort events chronologically
  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    );
  }, [events]);

  // Identify next imminent gathering
  const imminentEvent = useMemo(() => {
    const now = new Date().getTime();
    // Return first event that starts in the future, or the closest one
    const future = sortedEvents.find((e) => new Date(e.start_at).getTime() >= now - 4 * 3600000);
    return future || sortedEvents[0] || null;
  }, [sortedEvents]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return sortedEvents.filter((event) => {
      const eventDate = new Date(event.start_at);
      const eventMonth = (eventDate.getMonth() + 1).toString(); // 9 for September, etc.

      // Month filter
      if (selectedMonth !== 'all' && eventMonth !== selectedMonth) {
        return false;
      }

      // Category filter
      if (selectedCategory === 'services') {
        const type = (event.event_type || '').toLowerCase();
        if (!type.includes('service') && !type.includes('worship') && !type.includes('sunday') && !type.includes('friday')) {
          return false;
        }
      } else if (selectedCategory === 'missions') {
        const type = (event.event_type || '').toLowerCase();
        if (!type.includes('mission') && !type.includes('evangelism')) {
          return false;
        }
      } else if (selectedCategory === 'gatherings') {
        const type = (event.event_type || '').toLowerCase();
        if (!type.includes('retreat') && !type.includes('conference') && !type.includes('fellowship') && !type.includes('camp')) {
          return false;
        }
      } else if (selectedCategory === 'meetings') {
        const type = (event.event_type || '').toLowerCase();
        if (!type.includes('meeting') && !type.includes('agm') && !type.includes('sgm') && !type.includes('training')) {
          return false;
        }
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = event.title?.toLowerCase().includes(q);
        const matchesDesc = event.description?.toLowerCase().includes(q);
        const matchesPreacher = event.preacher?.toLowerCase().includes(q);
        const matchesVenue = (event.venue || event.location)?.toLowerCase().includes(q);
        const matchesType = (EVENT_TYPE_LABELS[event.event_type] || event.event_type)?.toLowerCase().includes(q);
        return Boolean(matchesTitle || matchesDesc || matchesPreacher || matchesVenue || matchesType);
      }

      return true;
    });
  }, [sortedEvents, selectedMonth, selectedCategory, searchQuery]);

  // Category statistics counts
  const categoryCounts = useMemo(() => {
    const counts = {
      all: sortedEvents.length,
      services: 0,
      missions: 0,
      gatherings: 0,
      meetings: 0,
    };

    for (const e of sortedEvents) {
      const type = (e.event_type || '').toLowerCase();
      if (type.includes('service') || type.includes('worship') || type.includes('sunday') || type.includes('friday')) {
        counts.services++;
      } else if (type.includes('mission') || type.includes('evangelism')) {
        counts.missions++;
      } else if (type.includes('retreat') || type.includes('conference') || type.includes('fellowship') || type.includes('camp')) {
        counts.gatherings++;
      } else if (type.includes('meeting') || type.includes('agm') || type.includes('sgm') || type.includes('training')) {
        counts.meetings++;
      }
    }
    return counts;
  }, [sortedEvents]);

  const handleOpenReminder = (event: PublicEvent) => {
    setSelectedEventForReminder(event);
    setIsReminderModalOpen(true);
  };

  const handleOpenDetails = (event: PublicEvent) => {
    setSelectedEventForDetails(event);
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedMonth('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedMonth !== 'all' || searchQuery.trim().length > 0;

  // Format date badge helpers
  const getEventBadgeParts = (iso: string) => {
    const d = new Date(iso);
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: d.getDate(),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    };
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 pb-24 text-slate-800 dark:text-slate-100">
      {/* 1. Header Banner */}
      <section className="bg-gradient-to-b from-primary-950 via-primary-900 to-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-primary-800/60 shadow-md">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300 ring-1 ring-emerald-400/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Active Semester Schedule • 2026/2027</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Gatherings &amp; Events
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Stay anchored in fellowship. Access Sunday services, Friday worship nights, missions, and the official downloadable semester calendar.
              </p>
            </div>

            {/* Downloadable Calendar Hero Widget */}
            <div className="bg-white/10 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 dark:border-slate-700/60 shadow-lg shrink-0 max-w-md w-full">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30 shrink-0">
                    {calendarInfo?.filename?.endsWith('.pdf') ? (
                      <FileText size={20} className="text-red-400" />
                    ) : calendarInfo?.filename?.endsWith('.xlsx') ? (
                      <FileSpreadsheet size={20} className="text-emerald-400" />
                    ) : (
                      <Calendar size={20} className="text-emerald-400" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300">
                        {calendarInfo?.is_custom ? 'Approved Calendar' : 'Semester Calendar'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300">
                        {calendarInfo?.file_format || 'ICS'} • {calendarInfo?.formatted_size || '18 KB'}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white truncate mt-0.5" title={calendarInfo?.title}>
                      {calendarInfo?.title || 'TUMCU Official Semester Calendar'}
                    </h3>
                  </div>
                </div>

                {calendarInfo?.is_custom && (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/30 text-emerald-300" title="Leadership verified calendar">
                    <ShieldCheck size={14} />
                  </span>
                )}
              </div>

              {calendarInfo?.uploaded_by_name && (
                <p className="mt-2 text-[11px] text-slate-300/80 truncate">
                  Uploaded by <span className="font-semibold text-white">{calendarInfo.uploaded_by_name}</span>
                </p>
              )}

              <div className="mt-3.5 flex items-center gap-2">
                <Button
                  onClick={() => downloadOfficialCalendar(calendarInfo)}
                  variant="primary"
                  size="sm"
                  className="w-full text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                >
                  <Download size={14} />
                  <span>Download {calendarInfo?.is_custom ? 'Official' : ''} Calendar ({calendarInfo?.file_format || 'ICS'})</span>
                </Button>

                {isAdmin && (
                  <Button
                    onClick={() => setIsUploadModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-xs font-bold border-white/30 text-white hover:bg-white/10 gap-1.5"
                    title="Upload or replace official downloadable calendar file"
                  >
                    <Upload size={14} />
                    <span>Upload</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 space-y-8">
        {/* 2. Spotlight: Next Imminent Gathering */}
        {imminentEvent && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                {/* Visual Date Tile */}
                {(() => {
                  const parts = getEventBadgeParts(imminentEvent.start_at);
                  return (
                    <div className="grid place-items-center h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-br from-emerald-800 to-primary-900 text-white shadow-md text-center p-2 shrink-0">
                      <span className="text-[10px] sm:text-xs font-black tracking-wider text-emerald-300 uppercase">
                        {parts.month}
                      </span>
                      <span className="text-2xl sm:text-3xl font-black leading-none my-0.5">
                        {parts.day}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase">
                        {parts.weekday}
                      </span>
                    </div>
                  );
                })()}

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                      Next Gathering
                    </span>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 text-[10px] font-bold">
                      {EVENT_TYPE_LABELS[imminentEvent.event_type] || imminentEvent.event_type}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                    {imminentEvent.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-emerald-600 dark:text-emerald-400" />
                      {imminentEvent.start_time || new Date(imminentEvent.start_at).toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-emerald-600 dark:text-emerald-400" />
                      {imminentEvent.venue || imminentEvent.location || 'Assembly Hall'}
                    </span>
                    {imminentEvent.preacher && (
                      <span className="flex items-center gap-1.5">
                        <User size={13} className="text-emerald-600 dark:text-emerald-400" />
                        Minister: <span className="font-semibold text-slate-800 dark:text-slate-200">{imminentEvent.preacher}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => handleOpenReminder(imminentEvent)}
                  size="sm"
                  className={`text-xs gap-1.5 font-bold ${
                    isEventReminderSet(imminentEvent.id)
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-primary-900 hover:bg-primary-800 text-white'
                  }`}
                >
                  <Bell size={13} />
                  <span>{isEventReminderSet(imminentEvent.id) ? 'Reminder Active' : 'Remind Me'}</span>
                </Button>

                <Button
                  onClick={() => handleOpenDetails(imminentEvent)}
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span>Event Details</span>
                  <ChevronRight size={13} />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Smart Controls & View Navigation Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* View Switcher Tabs */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <LayoutGrid size={14} />
                <span>Grid View</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'timeline'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <ListTree size={14} />
                <span>Schedule Timeline</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('weekly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'weekly'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Repeat size={14} />
                <span>Weekly Roster</span>
              </button>
            </div>

            {/* Instant Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, preacher, topic, or venue…"
                className="w-full pl-9 pr-9 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Sub-Filters: Categories & Month Horizon */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Category pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 dark:bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                All ({categoryCounts.all})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('services')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  selectedCategory === 'services'
                    ? 'bg-slate-900 dark:bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Services ({categoryCounts.services})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('missions')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  selectedCategory === 'missions'
                    ? 'bg-slate-900 dark:bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Missions &amp; Outreach ({categoryCounts.missions})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('gatherings')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  selectedCategory === 'gatherings'
                    ? 'bg-slate-900 dark:bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Conferences &amp; Retreats ({categoryCounts.gatherings})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('meetings')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  selectedCategory === 'meetings'
                    ? 'bg-slate-900 dark:bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                AGM &amp; Workshops ({categoryCounts.meetings})
              </button>
            </div>

            {/* Month Horizon Select */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                Month:
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value as MonthFilter)}
                className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Full Semester (Sep – Dec)</option>
                <option value="9">September 2026</option>
                <option value="10">October 2026</option>
                <option value="11">November 2026</option>
                <option value="12">December 2026</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-[11px] font-bold text-primary-600 dark:text-emerald-400 hover:underline"
                >
                  <RotateCcw size={12} /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Error state */}
        {eventsError && (
          <Card variant="glass" className="p-8 text-center border-red-200 dark:border-red-900/50">
            <div className="mx-auto max-w-md space-y-3">
              <AlertCircle size={32} className="mx-auto text-red-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Unable to load calendar events
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We encountered an issue reaching the event service. Please check your network and try again.
              </p>
              <Button onClick={() => refetchEvents()} size="sm" variant="primary">
                Retry loading
              </Button>
            </div>
          </Card>
        )}

        {/* 5. Loading State */}
        {eventsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4"
              >
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
                <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* 6. Main View Renderers */}
        {!eventsLoading && !eventsError && (
          <>
            {/* View A: GRID VIEW */}
            {viewMode === 'grid' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Showing <strong className="text-slate-800 dark:text-slate-200">{filteredEvents.length}</strong> events
                  </span>
                  {hasActiveFilters && (
                    <span>Filters active • Showing matching gatherings</span>
                  )}
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800">
                    <CalendarDays size={36} className="mx-auto text-slate-400 mb-2" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      No events match your current filters
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Try resetting your search query, selecting another category, or viewing the full semester.
                    </p>
                    <Button onClick={clearFilters} variant="outline" size="sm" className="mt-4 text-xs">
                      Reset All Filters
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredEvents.map((event) => {
                      const parts = getEventBadgeParts(event.start_at);
                      const isReminderActive = isEventReminderSet(event.id);
                      const typeLabel = EVENT_TYPE_LABELS[event.event_type] || event.event_type;

                      return (
                        <div
                          key={event.id}
                          className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:-translate-y-0.5"
                        >
                          <div className="space-y-3.5">
                            {/* Top row: Calendar badge & Event type */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <div className="grid place-items-center h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 text-center shrink-0">
                                  <span className="text-[9px] font-black uppercase leading-none">
                                    {parts.month}
                                  </span>
                                  <span className="text-base font-black leading-none mt-0.5">
                                    {parts.day}
                                  </span>
                                </div>
                                <div className="leading-tight">
                                  <span className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    {parts.weekday}
                                  </span>
                                  <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    {event.start_time || new Date(event.start_at).toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                  </span>
                                </div>
                              </div>

                              <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 text-[10px] font-bold shrink-0">
                                {typeLabel}
                              </span>
                            </div>

                            {/* Title */}
                            <div>
                              <h3
                                onClick={() => handleOpenDetails(event)}
                                className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-emerald-400 cursor-pointer transition line-clamp-2 leading-snug"
                              >
                                {event.title}
                              </h3>
                              {event.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                  {event.description}
                                </p>
                              )}
                            </div>

                            {/* Key Metadata badges */}
                            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-1.5 truncate">
                                <MapPin size={13} className="text-slate-400 shrink-0" />
                                <span className="truncate">{event.venue || event.location || 'Assembly Hall'}</span>
                              </div>
                              {event.preacher && (
                                <div className="flex items-center gap-1.5 truncate">
                                  <User size={13} className="text-slate-400 shrink-0" />
                                  <span className="truncate">Minister: <strong className="text-slate-800 dark:text-slate-200">{event.preacher}</strong></span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenReminder(event)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                                isReminderActive
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                              title={isReminderActive ? 'Reminder is set for this event' : 'Set browser reminder & calendar chime'}
                            >
                              {isReminderActive ? <BellRing size={12} className="text-emerald-600" /> : <Bell size={12} />}
                              <span>{isReminderActive ? 'Active' : 'Remind'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenDetails(event)}
                              className="text-xs font-bold text-primary-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              <span>Details</span>
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* View B: TIMELINE / CHRONOLOGICAL SCHEDULE VIEW */}
            {viewMode === 'timeline' && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-8">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Semester 1 Sequential Schedule Timeline
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chronological roadmap of all upcoming fellowships, Sunday corporate services, and regional missions.
                  </p>
                </div>

                <div className="relative pl-6 sm:pl-8 border-l-2 border-emerald-500/30 space-y-8">
                  {filteredEvents.map((event, idx) => {
                    const parts = getEventBadgeParts(event.start_at);
                    const isReminderActive = isEventReminderSet(event.id);
                    const isNext = idx === 0;

                    return (
                      <div key={event.id} className="relative group">
                        {/* Timeline Node Icon */}
                        <div
                          className={`absolute -left-[31px] sm:-left-[39px] top-1.5 grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full border-2 ${
                            isNext
                              ? 'bg-emerald-600 border-emerald-300 text-white shadow-md'
                              : 'bg-white dark:bg-slate-900 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          <Calendar size={13} />
                        </div>

                        {/* Content Card */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/60 transition group-hover:border-emerald-500/50">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-300">
                                  {parts.weekday}, {formatEventDate(event.start_at)}
                                </span>
                                <span className="text-slate-400">•</span>
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                  {event.start_time || new Date(event.start_at).toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </span>
                                <span className="rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 text-[10px] font-bold">
                                  {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                                </span>
                              </div>

                              <h4
                                onClick={() => handleOpenDetails(event)}
                                className="text-base font-black text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-emerald-400 cursor-pointer transition"
                              >
                                {event.title}
                              </h4>

                              {event.description && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                                  {event.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                onClick={() => handleOpenReminder(event)}
                                size="sm"
                                variant="outline"
                                className={`text-xs gap-1 font-bold ${
                                  isReminderActive
                                    ? 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40'
                                    : 'border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                <Bell size={12} />
                                <span>{isReminderActive ? 'Active' : 'Remind'}</span>
                              </Button>

                              <Button
                                onClick={() => handleOpenDetails(event)}
                                size="sm"
                                variant="ghost"
                                className="text-xs font-bold text-primary-700 dark:text-emerald-400"
                              >
                                Details
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/50 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} /> {event.venue || event.location || 'Assembly Hall'}
                            </span>
                            {event.preacher && (
                              <span className="flex items-center gap-1">
                                <User size={12} /> Minister: <strong className="text-slate-700 dark:text-slate-300">{event.preacher}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* View C: WEEKLY ROSTER VIEW */}
            {viewMode === 'weekly' && (
              <div className="space-y-6">
                <div className="bg-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-md">
                  <div className="max-w-2xl space-y-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
                      <Repeat size={13} /> Recurring Weekly Rhythms
                    </span>
                    <h3 className="text-2xl font-black tracking-tight">
                      Weekly TUMCU Programme Guide
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Every day of the week on campus has dedicated gatherings for fellowship, prayer, deep Bible study, and grassroots evangelism.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {programmes.map((prog) => {
                    const isMonday = prog.day?.toLowerCase() === 'monday';

                    return (
                      <div
                        key={prog.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-primary-100 dark:bg-primary-950/70 text-primary-800 dark:text-emerald-300">
                            {prog.day}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            {prog.time}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-slate-900 dark:text-white">
                            {prog.title}
                          </h4>
                          {isMonday && prog.active_this_week_title && (
                            <div className="mt-1.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                              <span className="font-bold">This Monday Active Focus:</span>{' '}
                              <span className="underline font-black">{prog.active_this_week_title}</span>
                            </div>
                          )}
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                            {prog.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={12} className="text-slate-400" />
                            <span>Venue: <strong>{prog.venue}</strong></span>
                          </div>
                          {prog.leader && (
                            <div className="flex items-center gap-1.5">
                              <User size={12} className="text-slate-400" />
                              <span>Steward: <strong>{prog.leader}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <EventReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        event={selectedEventForReminder}
        onReminderSaved={() => setReminderVersion((v) => v + 1)}
      />

      <EventDetailsModal
        isOpen={Boolean(selectedEventForDetails)}
        onClose={() => setSelectedEventForDetails(null)}
        event={selectedEventForDetails}
        onOpenReminder={handleOpenReminder}
        isReminderActive={selectedEventForDetails ? isEventReminderSet(selectedEventForDetails.id) : false}
      />

      {isAdmin && (
        <UploadCalendarModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}
    </div>
  );
}
