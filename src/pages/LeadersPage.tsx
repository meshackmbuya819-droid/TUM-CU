import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  Shield,
  Award,
  BookOpen,
  Search,
  Phone,
  Mail,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Filter,
  Sparkles,
  Info,
  Calendar,
  GraduationCap,
  Heart,
  Music,
  Mic,
  Camera,
  Layers,
  X,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import {
  fetchLeadershipDirectory,
  type LeaderDirectoryItem,
} from '@/features/leadership/leadership.api';
import { useAuthStore } from '@/store/auth.store';

type FilterCategory = 'all' | 'executive' | 'committee' | 'ministry';

export function LeadersPage() {
  const { user, isSuperAdmin } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLeaderModal, setActiveLeaderModal] = useState<LeaderDirectoryItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: leaders = [], isLoading } = useQuery<LeaderDirectoryItem[]>({
    queryKey: ['leadership-directory'],
    queryFn: fetchLeadershipDirectory,
    staleTime: 30_000,
  });

  // Filtered leaders
  const filteredLeaders = useMemo(() => {
    return leaders.filter((leader) => {
      // Category filter
      if (selectedCategory === 'executive' && leader.category !== 'executive') return false;
      if (selectedCategory === 'committee' && leader.category !== 'committee') return false;
      if (selectedCategory === 'ministry' && leader.category !== 'ministry') return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = leader.full_name?.toLowerCase().includes(query);
        const matchesPosition = leader.position_name?.toLowerCase().includes(query);
        const matchesEmail = leader.email?.toLowerCase().includes(query);
        const matchesCourse = leader.course?.toLowerCase().includes(query);
        const matchesRef = leader.constitutional_reference?.toLowerCase().includes(query);
        return Boolean(matchesName || matchesPosition || matchesEmail || matchesCourse || matchesRef);
      }

      return true;
    });
  }, [leaders, selectedCategory, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const executiveCount = leaders.filter((l) => l.category === 'executive').length;
    const committeeCount = leaders.filter((l) => l.category === 'committee').length;
    const ministryCount = leaders.filter((l) => l.category === 'ministry').length;
    return {
      total: leaders.length,
      executive: executiveCount,
      committee: committeeCount,
      ministry: ministryCount,
    };
  }, [leaders]);

  const handleCopyContact = (leader: LeaderDirectoryItem) => {
    const text = `${leader.full_name} (${leader.position_name}) — Phone: ${leader.phone_number}, Email: ${leader.email}`;
    navigator.clipboard.writeText(text);
    setCopiedId(leader.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F7F9F7] dark:bg-slate-950 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-primary-950 via-primary-900 to-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-primary-800/60 shadow-md">
        <div className="page-shell max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                <Shield size={14} className="text-emerald-400" />
                <span>Verified Constitutional Leadership Directory</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                TUMCU <span className="text-gold-400">Leaders Directory</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Serving the body of Christ with humility and diligence. View official portfolios,
                constitutional references, and direct contacts for all executive officers,
                committee chairpersons, and ministry leaders.
              </p>
            </div>

            {/* Quick Admin Navigation if user is admin */}
            {isSuperAdmin() && (
              <div className="shrink-0 flex items-center gap-2">
                <Link to="/dashboard/admin?tab=leadership">
                  <Button variant="secondary" className="text-xs font-bold gap-1.5 shadow-sm">
                    <UserCheck size={14} />
                    <span>Manage Leadership Roles</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/10">
              <span className="text-xs font-semibold text-slate-300 block">Total Leaders</span>
              <span className="text-2xl sm:text-3xl font-black text-white">{stats.total}</span>
              <span className="text-[11px] text-emerald-300 font-medium block mt-0.5">Active Tenure 2026/2027</span>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/10">
              <span className="text-xs font-semibold text-slate-300 block">Executive Board</span>
              <span className="text-2xl sm:text-3xl font-black text-gold-400">{stats.executive}</span>
              <span className="text-[11px] text-slate-300 font-medium block mt-0.5">Governance & Oversight</span>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/10">
              <span className="text-xs font-semibold text-slate-300 block">Committee Chairs</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.committee}</span>
              <span className="text-[11px] text-slate-300 font-medium block mt-0.5">Standing Subcommittees</span>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/10">
              <span className="text-xs font-semibold text-slate-300 block">Ministry Leaders</span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-300">{stats.ministry}</span>
              <span className="text-[11px] text-slate-300 font-medium block mt-0.5">12 Constitutional Ministries</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="page-shell max-w-7xl mx-auto -mt-6 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Search & Category Filter Navigation */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-lg shadow-slate-200/50 dark:shadow-none space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'all' as FilterCategory, label: 'All Leaders', count: stats.total },
                { key: 'executive' as FilterCategory, label: 'Executive Board', count: stats.executive },
                { key: 'committee' as FilterCategory, label: 'Committee Chairs', count: stats.committee },
                { key: 'ministry' as FilterCategory, label: 'Ministry Leaders', count: stats.ministry },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedCategory(tab.key)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedCategory === tab.key
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.2 text-[10px] font-black ${
                      selectedCategory === tab.key
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leader by name, office, or course..."
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Leaders Grid */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Loading verified leadership roster…</p>
          </div>
        ) : filteredLeaders.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 p-12 text-center space-y-3">
            <Users size={36} className="mx-auto text-slate-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">No leaders match your search</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search criteria or switching between the Executive Board, Committee Chairs, or Ministry Leaders tabs.
            </p>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="text-xs font-bold">
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredLeaders.map((leader) => {
              const initials = leader.full_name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'CU';

              const isExecutive = leader.category === 'executive';
              const isMinistry = leader.category === 'ministry';
              const isCommittee = leader.category === 'committee';

              const categoryBadge = isExecutive
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : isMinistry
                ? 'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                : 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';

              const categoryLabel = isExecutive
                ? 'Executive Board'
                : isMinistry
                ? 'Ministry Leader'
                : 'Committee Chairperson';

              return (
                <div
                  key={leader.id || leader.position_id}
                  className="group rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between hover:-translate-y-1 space-y-4"
                >
                  <div className="space-y-3.5">
                    {/* Header with Photo/Avatar and Category Badge */}
                    <div className="flex items-start gap-3.5">
                      {leader.avatar_url ? (
                        <img
                          src={leader.avatar_url}
                          alt={leader.full_name}
                          className="h-16 w-16 rounded-2xl object-cover border-2 border-emerald-100 dark:border-slate-700 shadow-xs shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          className={`h-16 w-16 rounded-2xl text-white font-black text-lg grid place-items-center shrink-0 shadow-xs border-2 ${
                            isExecutive
                              ? 'bg-gradient-to-br from-emerald-800 to-primary-950 border-emerald-200 dark:border-emerald-700'
                              : isMinistry
                              ? 'bg-gradient-to-br from-blue-700 to-slate-900 border-blue-200 dark:border-blue-700'
                              : 'bg-gradient-to-br from-amber-700 to-slate-900 border-amber-200 dark:border-amber-700'
                          }`}
                        >
                          {initials}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <span className={`inline-block rounded-md text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border mb-1 truncate max-w-full ${categoryBadge}`}>
                          {categoryLabel}
                        </span>
                        <h3 className="font-bold text-slate-950 dark:text-white text-base leading-tight truncate" title={leader.full_name}>
                          {leader.full_name}
                        </h3>
                        <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 truncate mt-0.5">
                          {leader.position_name}
                        </p>
                      </div>
                    </div>

                    {/* Academic course & constitutional reference */}
                    <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 truncate">
                        <GraduationCap size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{leader.course || 'Technical University of Mombasa'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-medium text-slate-600 dark:text-slate-400">
                          {leader.year_of_study ? `Year ${leader.year_of_study}` : 'Undergraduate'}
                        </span>
                        {leader.constitutional_reference && (
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {leader.constitutional_reference}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Responsibilities summary */}
                    {leader.responsibilities && leader.responsibilities.length > 0 && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        <p className="line-clamp-2 italic">
                          &ldquo;{leader.responsibilities[0]}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions & Contacts */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`tel:${leader.phone_number}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 py-2 text-xs font-bold transition"
                        title={`Call ${leader.full_name}`}
                      >
                        <Phone size={12} className="text-emerald-600" />
                        <span>Call</span>
                      </a>

                      <a
                        href={`mailto:${leader.email}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 py-2 text-xs font-bold transition"
                        title={`Email ${leader.full_name}`}
                      >
                        <Mail size={12} className="text-slate-400" />
                        <span>Email</span>
                      </a>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopyContact(leader)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                      >
                        {copiedId === leader.id ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy info</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveLeaderModal(leader)}
                        className="inline-flex items-center gap-1 text-xs font-black text-emerald-800 dark:text-emerald-400 hover:underline"
                      >
                        <span>Portfolio</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leader Portfolio Modal */}
      {activeLeaderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveLeaderModal(null)}
              className="absolute top-5 right-5 h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white grid place-items-center transition"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>

            <div className="space-y-1.5 pr-8">
              <span className="inline-block rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 border border-emerald-300/60">
                {activeLeaderModal.constitutional_reference || 'Constitutional Portfolio'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white leading-tight">
                {activeLeaderModal.position_name}
              </h2>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                Incumbent: {activeLeaderModal.full_name}
              </p>
            </div>

            {/* Leader Details Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Academic Year:</span>
                <span className="font-bold text-slate-800 dark:text-white">{activeLeaderModal.academic_year || '2026/2027'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Course:</span>
                <span className="font-bold text-slate-800 dark:text-white">{activeLeaderModal.course || 'Technical University of Mombasa'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Year of Study:</span>
                <span className="font-bold text-slate-800 dark:text-white">{activeLeaderModal.year_of_study ? `Year ${activeLeaderModal.year_of_study}` : 'Undergraduate'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Official Email:</span>
                <a href={`mailto:${activeLeaderModal.email}`} className="font-bold text-emerald-800 dark:text-emerald-400 hover:underline">{activeLeaderModal.email}</a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Direct Phone:</span>
                <a href={`tel:${activeLeaderModal.phone_number}`} className="font-bold text-emerald-800 dark:text-emerald-400 hover:underline">{activeLeaderModal.phone_number}</a>
              </div>
            </div>

            {/* Responsibilities list */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BookOpen size={14} className="text-emerald-700 dark:text-emerald-400" />
                <span>Constitutional Duties & Responsibilities</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {activeLeaderModal.responsibilities && activeLeaderModal.responsibilities.length > 0 ? (
                  activeLeaderModal.responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] grid place-items-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{resp}</span>
                    </li>
                  ))
                ) : (
                  <li className="italic text-slate-400">Standard ministerial leadership responsibilities per TUMCU Constitution 2024.</li>
                )}
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setActiveLeaderModal(null)}
                className="text-xs font-bold"
              >
                Close
              </Button>
              <a href={`mailto:${activeLeaderModal.email}`}>
                <Button variant="primary" className="text-xs font-bold gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white">
                  <Mail size={13} />
                  <span>Send Message</span>
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
