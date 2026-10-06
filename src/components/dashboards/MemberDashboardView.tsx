import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  CalendarDays,
  Users,
  HandHeart,
  Church,
  ArrowRight,
  Clock,
  MapPin,
  Sparkles,
  QrCode,
  Music2,
  Globe2,
  BookOpen,
  Zap,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/Button';
import heroImage from '@/assets/hero.png';
import musicImg from '@/assets/community/community-1.jpg';
import mediaImg from '@/assets/community/community-2.jpg';
import prayerImg from '@/assets/community/community-3.jpg';
import outreachImg from '@/assets/community/community-4.jpg';
import { MyResponsibilitiesWidget } from '@/components/MyResponsibilitiesWidget';
import { fetchProgrammes, type WeeklyProgramme } from '@/features/events/events.api';

interface MemberDashboardViewProps {
  user: any;
  membership: any;
  myMinistries: any[];
  onOpenCheckIn: () => void;
}

const CANONICAL_SCHEDULE = [
  {
    day: 'MON',
    name: 'Monday',
    dayIndex: 1,
    Icon: Globe2,
    iconColor: 'text-amber-700 bg-amber-50 border-amber-200/80',
    title: 'Door to Door & E-Teams Fellowship',
    time: '5:00 PM – 7:00 PM',
    venue: 'Assembly Grounds & Designated Centers',
    description: 'Alternating weekly evangelism: E-Teams Fellowship one Monday, Door to Door Evangelism the next.',
  },
  {
    day: 'TUE',
    name: 'Tuesday',
    dayIndex: 2,
    Icon: BookOpen,
    iconColor: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
    title: 'Bible Study (BEST)',
    time: '5:00 PM – 7:00 PM',
    venue: 'Lecture Theatres & Designated Classes',
    description: 'Systematic verse-by-verse scripture study, discipleship cohorts, and small groups.',
  },
  {
    day: 'WED',
    name: 'Wednesday',
    dayIndex: 3,
    Icon: GraduationCap,
    iconColor: 'text-blue-700 bg-blue-50 border-blue-200/80',
    title: 'Discipleship Class',
    time: '5:00 PM – 7:00 PM',
    venue: 'Main Sanctuary / Assembly Hall',
    description: 'Foundational Christian doctrine and spiritual growth mentorship for disciples.',
  },
  {
    day: 'THU',
    name: 'Thursday',
    dayIndex: 4,
    Icon: Zap,
    iconColor: 'text-purple-700 bg-purple-50 border-purple-200/80',
    title: 'Empowerment Service',
    time: '5:00 PM – 7:00 PM',
    venue: 'Main Sanctuary / Assembly Hall',
    description: 'Spiritual, academic, leadership, and career empowerment for campus believers.',
  },
  {
    day: 'FRI',
    name: 'Friday',
    dayIndex: 5,
    Icon: Music2,
    iconColor: 'text-[#006633] bg-[#EAF5EF] border-[#006633]/25',
    title: 'Friday Main Service',
    time: '6:00 PM – 8:30 PM',
    venue: 'Assembly Hall',
    description: 'Dynamic campus fellowship, deep worship, testimonies, and practical scriptural preaching.',
  },
  {
    day: 'SUN',
    name: 'Sunday',
    dayIndex: 0,
    Icon: Church,
    iconColor: 'text-indigo-700 bg-indigo-50 border-indigo-200/80',
    title: 'Sunday Service',
    time: '8:00 AM – 12:30 PM',
    venue: 'Main Assembly Hall / Sanctuary',
    description: 'Sunday morning corporate worship, celebration, Word, and communion.',
  },
];

export function MemberDashboardView({
  user,
  membership,
  myMinistries,
  onOpenCheckIn,
}: MemberDashboardViewProps) {
  const firstName = user?.full_name?.split(/\s+/)[0] || 'Brethren';
  const isActiveMember = membership?.memberships?.some((m: any) => m.status === 'active') ?? true;

  const currentDayIndex = new Date().getDay();

  // Query dynamic programmes from backend
  const { data: dynamicProgrammes = [] } = useQuery<WeeklyProgramme[]>({
    queryKey: ['programmes'],
    queryFn: fetchProgrammes,
    staleTime: 60000,
  });

  // Merge canonical fallback with dynamic programmes from admin portal
  const weeklyProgramme = CANONICAL_SCHEDULE.map((canonical) => {
    const remote = dynamicProgrammes.find(
      (p) => p.day?.toLowerCase().trim() === canonical.name.toLowerCase()
    );

    if (remote) {
      let displayTitle = remote.title;
      // If Monday and active_this_week_title is computed by server
      if (remote.day?.toLowerCase() === 'monday' && remote.active_this_week_title) {
        displayTitle = `${remote.active_this_week_title} (Mon Alternating)`;
      }

      return {
        ...canonical,
        title: displayTitle || canonical.title,
        time: remote.time || canonical.time,
        venue: remote.venue || canonical.venue,
        description: remote.description || canonical.description,
      };
    }

    return canonical;
  });

  return (
    <div className="space-y-6">
      {/* Member KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Membership Status */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Membership</span>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-black">
              {isActiveMember ? 'ACTIVE' : 'PENDING'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Admitted TUMCU Member</p>
        </div>

        {/* Next Service / Event */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Next Service</span>
          <p className="text-xs font-black text-slate-900 mt-1 truncate">Check Calendar</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Schedule updates weekly</p>
        </div>

        {/* Attendance Score */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Services Attended</span>
          <p className="text-base font-black text-slate-900 mt-0.5">0</p>
          <p className="text-[11px] text-slate-500">Sign in on Sunday to record</p>
        </div>

        {/* My Ministry */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">My Ministry</span>
          <p className="text-xs font-black text-slate-900 mt-1 truncate">
            {myMinistries.length > 0 ? (myMinistries[0].name || myMinistries[0].ministry_name) : 'Not yet joined'}
          </p>
          <Link to="/ministries" className="text-[11px] text-[#006633] font-bold hover:underline">
            {myMinistries.length > 0 ? 'View activities →' : 'Browse & join ministry →'}
          </Link>
        </div>
      </div>

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 text-white shadow-sm">
        <div className="absolute inset-0">
          <img src={heroImage} alt="TUMCU Fellowship" className="h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/40" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black tracking-widest text-emerald-300 uppercase backdrop-blur-md">
            <Sparkles size={12} /> Student Fellowship Family
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            Welcome back, {firstName}.
          </h2>
          <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed">
            Technical University of Mombasa Christian Union: Grounded in prayer, sound biblical doctrine, and mutual love.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              onClick={onOpenCheckIn}
              className="text-xs font-bold gap-1.5 bg-amber-400 text-slate-950 hover:bg-amber-500 shadow-xs"
            >
              <QrCode size={14} /> Check In to Service
            </Button>
            <Link
              to="/dashboard/prayer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition"
            >
              <HandHeart size={14} /> Request Prayer
            </Link>
          </div>
        </div>
      </div>

      {/* Leadership Responsibilities if assigned */}
      <MyResponsibilitiesWidget />

      {/* Weekly Rhythm */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Weekly Spiritual Rhythm</h3>
            <p className="text-xs text-slate-500">Regular weekly fellowship and prayer gatherings</p>
          </div>
          <Link to="/dashboard/tumcu" className="text-xs font-bold text-[#006633] hover:underline">
            Full Schedule →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {weeklyProgramme.map((prog) => {
            const Icon = prog.Icon;
            const isToday = currentDayIndex === prog.dayIndex;
            return (
              <div
                key={prog.day}
                className={`rounded-2xl p-3.5 border transition ${
                  isToday
                    ? 'border-[#006633] bg-[#EAF5EF] shadow-2xs'
                    : 'border-slate-200/70 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black tracking-wider ${isToday ? 'text-[#006633]' : 'text-slate-400'}`}>
                    {prog.day}
                  </span>
                  {isToday && (
                    <span className="rounded-full bg-[#006633] text-white px-1.5 py-0.2 text-[9px] font-black uppercase">
                      Today
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className={`grid h-7 w-7 place-items-center rounded-lg ${prog.iconColor}`}>
                    <Icon size={14} />
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">{prog.title}</p>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                  <p className="font-semibold text-slate-700">{prog.time}</p>
                  <p className="truncate">{prog.venue}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
