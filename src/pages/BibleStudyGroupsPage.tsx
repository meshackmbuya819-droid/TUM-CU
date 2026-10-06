import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Users,
  Sparkles,
  Download,
  Printer,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Trash2,
  Edit3,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  ChevronUp,
  Award,
  Phone,
  Mail,
  GraduationCap,
  Building,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import {
  fetchBibleStudyGroups,
  fetchCandidateMembers,
  autoBalanceBibleStudyGroups,
  batchSaveBibleStudyGroups,
  deleteBibleStudyGroup,
  exportBibleStudyGroupsToExcel,
  type BibleStudyGroup,
  type CandidateMember,
  type GenerationResult,
  type GeneratedGroupPreview,
} from '@/features/bible-study/bible-study.api';
import { useAuthStore } from '@/store/auth.store';
import { useViewAsStore } from '@/store/viewAs.store';

export function BibleStudyGroupsPage() {
  const queryClient = useQueryClient();
  const { user, permissions } = useAuthStore();
  const { isSimulating, simulatedRole } = useViewAsStore();

  const isDiscipleshipChair =
    user?.role === 'discipleship_chairperson' ||
    user?.role === 'super_admin' ||
    user?.role === 'system_admin' ||
    user?.role === 'chairperson' ||
    user?.role === 'second_vice_chairperson' ||
    permissions.includes('discipleship.create') ||
    permissions.includes('discipleship.edit') ||
    (isSimulating &&
      (simulatedRole === 'super_admin' ||
        simulatedRole === 'chairperson' ||
        simulatedRole === ('discipleship_chairperson' as any)));

  const [activeTab, setActiveTab] = useState<'groups' | 'generator' | 'candidates'>('groups');
  const [selectedCohort, setSelectedCohort] = useState('2026/2027 Discipleship Cohort');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  // Generator form state
  const [cohortName, setCohortName] = useState('2026/2027 Discipleship Cohort');
  const [balanceMode, setBalanceMode] = useState<'count' | 'size'>('count');
  const [targetGroupsCount, setTargetGroupsCount] = useState<number>(4);
  const [targetGroupSize, setTargetGroupSize] = useState<number>(8);
  const [selectedDay, setSelectedDay] = useState('Wednesday');
  const [selectedTime, setSelectedTime] = useState('5:00 PM – 6:30 PM');
  const [selectedLocation, setSelectedLocation] = useState('Main Chapel Grounds');
  const [selectedStudyGuide, setSelectedStudyGuide] = useState(
    'Foundations of Biblical Discipleship (Gospel of John)'
  );
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');
  const [includeAssigned, setIncludeAssigned] = useState<boolean>(false);

  // Generated preview state for interactive fine-tuning
  const [previewResult, setPreviewResult] = useState<GenerationResult | null>(null);
  const [customGroups, setCustomGroups] = useState<GeneratedGroupPreview[]>([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries
  const {
    data: groups = [],
    isLoading: isLoadingGroups,
    refetch: refetchGroups,
  } = useQuery({
    queryKey: ['bible-study', 'groups', selectedCohort],
    queryFn: () => fetchBibleStudyGroups(selectedCohort),
  });

  const { data: candidates = [], isLoading: isLoadingCandidates } = useQuery({
    queryKey: ['bible-study', 'candidates'],
    queryFn: fetchCandidateMembers,
  });

  // Mutations
  const generateMutation = useMutation({
    mutationFn: autoBalanceBibleStudyGroups,
    onSuccess: (data) => {
      setPreviewResult(data);
      setCustomGroups(data.groups);
      setSaveSuccessMessage(null);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.message || 'Failed to auto-balance groups');
    },
  });

  const saveBatchMutation = useMutation({
    mutationFn: batchSaveBibleStudyGroups,
    onSuccess: (res) => {
      setSaveSuccessMessage(
        `Successfully saved ${res.savedCount} Bible study groups with ${res.membersAssigned} members assigned!`
      );
      setPreviewResult(null);
      setCustomGroups([]);
      queryClient.invalidateQueries({ queryKey: ['bible-study'] });
      setActiveTab('groups');
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.message || 'Failed to save groups to database');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBibleStudyGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bible-study'] });
    },
  });

  // Handle auto-balancing trigger
  function handleGenerate() {
    setErrorMessage(null);
    setSaveSuccessMessage(null);
    generateMutation.mutate({
      cohortName,
      targetGroupsCount: balanceMode === 'count' ? targetGroupsCount : undefined,
      targetGroupSize: balanceMode === 'size' ? targetGroupSize : undefined,
      meetingDay: selectedDay,
      meetingTime: selectedTime,
      locationPrefix: selectedLocation,
      studyBookGuide: selectedStudyGuide,
      filterYearOfStudy: filterYear,
      includeCurrentlyAssigned: includeAssigned,
    });
  }

  // Handle moving a member between generated groups
  function handleMoveMember(memberId: string, fromGroupIdx: number, toGroupIdx: number) {
    if (fromGroupIdx === toGroupIdx) return;
    const next = customGroups.map((g) => ({ ...g, members: [...g.members] }));
    const memberIdx = next[fromGroupIdx].members.findIndex((m) => m.id === memberId);
    if (memberIdx === -1) return;

    const [movedMember] = next[fromGroupIdx].members.splice(memberIdx, 1);
    next[toGroupIdx].members.push(movedMember);

    // Recalculate group stats
    for (const g of next) {
      g.male_count = g.members.filter((m) => m.gender === 'male').length;
      g.female_count = g.members.filter((m) => m.gender === 'female').length;
      g.total_count = g.members.length;
      g.male_ratio_pct = g.total_count > 0 ? Math.round((g.male_count / g.total_count) * 100) : 0;
      g.female_ratio_pct =
        g.total_count > 0 ? Math.round((g.female_count / g.total_count) * 100) : 0;
    }

    setCustomGroups(next);
  }

  // Handle designating group leader
  function handleAssignLeader(groupIdx: number, memberId: string) {
    const next = [...customGroups];
    const leader = next[groupIdx].members.find((m) => m.id === memberId) || null;
    next[groupIdx] = { ...next[groupIdx], leader };
    setCustomGroups(next);
  }

  // Save published groups to server
  function handleSaveGroups() {
    if (customGroups.length === 0) return;
    saveBatchMutation.mutate({
      cohortName,
      groups: customGroups.map((g) => ({
        name: g.name,
        leader_id: g.leader?.id || null,
        meeting_day: g.meeting_day,
        meeting_time: g.meeting_time,
        location: g.location,
        study_book_guide: g.study_book_guide,
        member_ids: g.members.map((m) => m.id),
      })),
    });
  }

  // Filter saved groups
  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.leader_name && g.leader_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.location && g.location.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Calculate live overall stats
  const totalEnrolled = groups.reduce((acc, g) => acc + (g.member_count || 0), 0);
  const totalMales = groups.reduce((acc, g) => acc + (g.male_count || 0), 0);
  const totalFemales = groups.reduce((acc, g) => acc + (g.female_count || 0), 0);
  const overallMaleRatio = totalEnrolled > 0 ? Math.round((totalMales / totalEnrolled) * 100) : 0;
  const overallFemaleRatio =
    totalEnrolled > 0 ? Math.round((totalFemales / totalEnrolled) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Official Header & Discipleship Chairperson Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 p-7 sm:p-9 text-white shadow-xl border border-emerald-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-gold-300 backdrop-blur-md">
              <ShieldCheck size={14} className="text-gold-400" />
              <span>TUMCU Discipleship Committee • BEST Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <BookOpen className="text-emerald-400" size={28} />
              Bible Study Groups & Gender Balancer
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Create and manage discipleship cohorts with intelligent gender and headcount
              balancing. Form balanced fellowship groups, assign leaders, and export official
              registers directly to Excel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportBibleStudyGroupsToExcel(groups, selectedCohort)}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-xs"
              title="Download full workbook with Summary, Master Roster & Facilitator Sheets"
            >
              <FileSpreadsheet size={15} className="text-emerald-300" />
              <span>Export Excel (.xlsx)</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-xs"
              title="Print official Bible study groups register"
            >
              <Printer size={15} className="text-gold-300" />
              <span>Print Register</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setActiveTab('generator');
                if (!previewResult) handleGenerate();
              }}
              className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-black text-xs shadow-md"
            >
              <Sparkles size={15} />
              <span>Smart Balancer</span>
            </Button>
          </div>
        </div>

        {/* Biblical Quote Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-300/80 gap-2">
          <span>
            <strong className="text-gold-300">2 Timothy 2:2</strong> — &ldquo;And the things you
            have heard me say in the presence of many witnesses entrust to reliable people who will
            also be qualified to teach others.&rdquo;
          </span>
          <span className="font-mono text-emerald-400 font-bold shrink-0">
            Active Cohort: {selectedCohort}
          </span>
        </div>
      </div>

      {/* Live Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Active Groups
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {groups.length}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">cohorts</span>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Enrolled Students
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {totalEnrolled}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">members</span>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Gender Balance
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-black text-indigo-700 dark:text-indigo-400">
              {overallMaleRatio}% M / {overallFemaleRatio}% F
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            <div style={{ width: `${overallMaleRatio}%` }} className="bg-sky-500 h-full" />
            <div style={{ width: `${overallFemaleRatio}%` }} className="bg-rose-500 h-full" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Pool Available
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 dark:text-amber-400">
              {candidates.filter((c) => !c.assigned_group_id).length}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">unassigned</span>
          </div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'groups'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers size={15} />
            <span>Active Groups ({groups.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'generator'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles size={15} className="text-gold-500" />
            <span>Smart Group Balancer</span>
          </button>

          <button
            onClick={() => setActiveTab('candidates')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'candidates'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users size={15} />
            <span>Candidate Directory ({candidates.length})</span>
          </button>
        </div>

        {/* Cohort Selector */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span className="font-semibold">Cohort:</span>
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="2026/2027 Discipleship Cohort">2026/2027 Discipleship Cohort</option>
            <option value="2025/2026 Discipleship Cohort">2025/2026 Discipleship Cohort</option>
            <option value="All Cohorts">All Cohorts</option>
          </select>
        </div>
      </div>

      {/* TAB 1: ACTIVE GROUPS */}
      {activeTab === 'groups' && (
        <div className="space-y-6">
          {/* Search & Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Search group name, leader, venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchGroups()}
                className="text-xs gap-1.5"
              >
                <RefreshCw size={13} className={isLoadingGroups ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => exportBibleStudyGroupsToExcel(groups, selectedCohort)}
                className="text-xs bg-emerald-800 hover:bg-emerald-900 text-white gap-1.5"
              >
                <FileSpreadsheet size={14} />
                <span>Download Excel Register</span>
              </Button>
            </div>
          </div>

          {saveSuccessMessage && (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {isLoadingGroups ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <RefreshCw size={28} className="mx-auto animate-spin text-emerald-600" />
              <p className="text-xs font-bold">Loading Bible study cohorts...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <Card className="text-center py-16 p-8 border-dashed space-y-4">
              <BookOpen size={40} className="mx-auto text-slate-400" />
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white">
                  No Bible study groups created yet
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Use the Smart Group Balancer to generate balanced Bible study groups from
                  registered members.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('generator')}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs"
              >
                <Sparkles size={14} />
                <span>Launch Smart Balancer</span>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredGroups.map((group) => {
                const isExpanded = expandedGroupId === group.id;
                const mCount = group.male_count || 0;
                const fCount = group.female_count || 0;
                const tCount = group.member_count || (group.members ? group.members.length : 0);
                const mPct = tCount > 0 ? Math.round((mCount / tCount) * 100) : 0;
                const fPct = tCount > 0 ? Math.round((fCount / tCount) * 100) : 0;

                return (
                  <Card
                    key={group.id}
                    className="p-5 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition space-y-4"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                          {group.cohort_name}
                        </span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                          {group.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                          <Award size={13} className="text-gold-600" />
                          <span>Leader: {group.leader_name || 'Unassigned Leader'}</span>
                          {group.leader_phone && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              ({group.leader_phone})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Headcount Badge */}
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300">
                          {tCount} Members
                        </span>
                      </div>
                    </div>

                    {/* Schedule & Location Pills */}
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                      <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 px-2 py-1">
                        <Calendar size={12} className="text-emerald-700 dark:text-emerald-400" />
                        <span>Every {group.meeting_day || 'Wednesday'}</span>
                      </div>
                      <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 px-2 py-1">
                        <Clock size={12} className="text-emerald-700 dark:text-emerald-400" />
                        <span>{group.meeting_time || '5:00 PM'}</span>
                      </div>
                      <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 px-2 py-1">
                        <MapPin size={12} className="text-emerald-700 dark:text-emerald-400" />
                        <span className="truncate max-w-[180px]">
                          {group.location || 'Chapel Grounds'}
                        </span>
                      </div>
                    </div>

                    {/* Gender Balance Indicator */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Gender Ratio:
                        </span>
                        <div className="flex items-center gap-2 text-[11px] font-black">
                          <span className="text-sky-700 dark:text-sky-400">
                            {mCount} Males ({mPct}%)
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-rose-700 dark:text-rose-400">
                            {fCount} Females ({fPct}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                        <div style={{ width: `${mPct}%` }} className="bg-sky-500 h-full" />
                        <div style={{ width: `${fPct}%` }} className="bg-rose-500 h-full" />
                      </div>
                    </div>

                    {/* Study Guide */}
                    {group.study_book_guide && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl flex items-center gap-1.5">
                        <BookOpen size={12} className="text-slate-500 shrink-0" />
                        <span className="truncate">
                          <strong>Study Topic:</strong> {group.study_book_guide}
                        </span>
                      </div>
                    )}

                    {/* Expandable Member List */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                          Group Member Roster ({group.members?.length || 0})
                        </span>
                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                          {(group.members || []).map((m, idx) => (
                            <div
                              key={m.id || idx}
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs border border-slate-100 dark:border-slate-800"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-black ${
                                    m.gender === 'female'
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                      : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                  }`}
                                >
                                  {m.gender === 'female' ? 'F' : 'M'}
                                </span>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>{m.full_name}</span>
                                    {m.user_id === group.leader_id && (
                                      <span className="text-[9px] bg-gold-400 text-slate-950 px-1.5 py-0.2 rounded-full font-black">
                                        LEADER
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-500">
                                    {m.admission_number || 'No ADM'} • Year {m.year_of_study || 1} •{' '}
                                    {m.department || m.course || 'TUM'}
                                  </span>
                                </div>
                              </div>

                              {m.phone_number && (
                                <a
                                  href={`tel:${m.phone_number}`}
                                  className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
                                >
                                  {m.phone_number}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <button
                        onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                        className="font-bold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={14} /> Hide Roster
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} /> View Roster ({tCount})
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportBibleStudyGroupsToExcel([group], group.cohort_name)}
                          className="h-7 px-2 text-[11px] font-bold"
                          title="Export single group to Excel"
                        >
                          <FileSpreadsheet size={12} />
                          <span>Excel</span>
                        </Button>

                        {isDiscipleshipChair && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${group.name}"?`)) {
                                deleteMutation.mutate(group.id);
                              }
                            }}
                            className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 grid place-items-center transition"
                            title="Delete this Bible study group"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SMART GROUP BALANCER (THE CORE REQUESTED FEATURE) */}
      {activeTab === 'generator' && (
        <div className="space-y-8">
          {/* Informational Guidance Box */}
          <div className="rounded-2xl border border-gold-300/80 bg-gold-50/70 dark:bg-gold-950/30 p-5 text-slate-800 dark:text-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-gold-600 dark:text-gold-400 shrink-0" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                How the Intelligent Gender & Headcount Balancer Works
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              The Discipleship algorithm pulls active student members from the authoritative TUMCU
              register. It partitions students into separate gender pools and uses an alternating
              snake distribution algorithm. This guarantees{' '}
              <strong className="text-slate-900 dark:text-white font-bold">
                equalized 50/50 male-to-female ratios
              </strong>{' '}
              (or nearest matching proportion) while strictly ensuring each group has identical
              headcounts (maximum difference of 1 member). Academic years are also sorted so each
              group contains senior student facilitators (Years 3 & 4) alongside freshers.
            </p>
          </div>

          {/* Generator Controls Card */}
          <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Cohort & Distribution Parameters
                </h3>
                <p className="text-xs text-slate-500">
                  Configure how the system balances and creates groups
                </p>
              </div>
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-300">
                {candidates.length} Available Members
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Cohort Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Cohort / Semester Name
                </label>
                <Input
                  value={cohortName}
                  onChange={(e) => setCohortName(e.target.value)}
                  placeholder="e.g. 2026/2027 Discipleship Cohort"
                  className="h-10 text-xs"
                />
              </div>

              {/* Balancing Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Distribution Strategy
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBalanceMode('count')}
                    className={`h-10 rounded-xl text-xs font-bold transition border ${
                      balanceMode === 'count'
                        ? 'bg-emerald-800 text-white border-emerald-900'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Target Groups
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceMode('size')}
                    className={`h-10 rounded-xl text-xs font-bold transition border ${
                      balanceMode === 'size'
                        ? 'bg-emerald-800 text-white border-emerald-900'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Group Size
                  </button>
                </div>
              </div>

              {/* Target Count or Size */}
              {balanceMode === 'count' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Number of Groups (K)
                  </label>
                  <select
                    value={targetGroupsCount}
                    onChange={(e) => setTargetGroupsCount(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value={2}>2 Groups (~12 members each)</option>
                    <option value={3}>3 Groups (~8 members each)</option>
                    <option value={4}>4 Groups (~6 members each)</option>
                    <option value={5}>5 Groups (~5 members each)</option>
                    <option value={6}>6 Groups (~4 members each)</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Target Members Per Group
                  </label>
                  <select
                    value={targetGroupSize}
                    onChange={(e) => setTargetGroupSize(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value={6}>6 Members per group</option>
                    <option value={8}>8 Members per group</option>
                    <option value={10}>10 Members per group</option>
                    <option value={12}>12 Members per group</option>
                  </select>
                </div>
              )}

              {/* Meeting Day */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Default Meeting Day
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="Wednesday">Wednesdays (Weekly)</option>
                  <option value="Thursday">Thursdays (Weekly)</option>
                  <option value="Tuesday">Tuesdays (BEST)</option>
                  <option value="Sunday">Sundays (Post-Service)</option>
                </select>
              </div>

              {/* Meeting Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Meeting Time
                </label>
                <Input
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              {/* Location Prefix */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Meeting Venue
                </label>
                <Input
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            {/* Study Guide Topic */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Foundational Study Guide / Bible Book
              </label>
              <Input
                value={selectedStudyGuide}
                onChange={(e) => setSelectedStudyGuide(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            {/* Candidate Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeAssigned}
                    onChange={(e) => setIncludeAssigned(e.target.checked)}
                    className="rounded accent-emerald-600 h-4 w-4"
                  />
                  <span>Re-shuffle all active students (include currently assigned)</span>
                </label>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Filter by Year:
                </span>
                <select
                  value={filterYear}
                  onChange={(e) =>
                    setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-bold"
                >
                  <option value="all">All Academic Years (1 to 4)</option>
                  <option value={1}>1st Years Only (Freshers)</option>
                  <option value={2}>2nd Years Only</option>
                  <option value={3}>3rd Years Only</option>
                  <option value={4}>4th Years Only</option>
                </select>
              </div>
            </div>

            {/* Trigger Button */}
            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs h-11 px-6 gap-2 shadow-md"
              >
                <Sparkles size={16} className={generateMutation.isPending ? 'animate-spin' : ''} />
                <span>
                  {generateMutation.isPending
                    ? 'Balancing Cohorts...'
                    : 'Generate Balanced Bible Study Groups'}
                </span>
              </Button>
            </div>
          </Card>

          {errorMessage && (
            <div className="rounded-2xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs font-semibold text-rose-900 dark:text-rose-200 flex items-center gap-2.5">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* GENERATION LIVE PREVIEW & FINE-TUNING PANEL */}
          {customGroups.length > 0 && (
            <div className="space-y-6 pt-4 border-t-2 border-emerald-500/30">
              {/* Executive Balancing Banner */}
              <div className="rounded-3xl bg-slate-900 text-white p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> Algorithmic Gender & Size Equilibrium Achieved
                    </span>
                    <h3 className="text-lg font-black text-white mt-1">
                      Previewing {customGroups.length} Balanced Bible Study Groups
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportBibleStudyGroupsToExcel(customGroups, cohortName)}
                      className="bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs font-bold gap-1.5"
                    >
                      <FileSpreadsheet size={15} className="text-emerald-300" />
                      <span>Print to Excel (.xlsx)</span>
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveGroups}
                      disabled={saveBatchMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs gap-1.5 shadow-md"
                    >
                      <CheckCircle2 size={15} />
                      <span>
                        {saveBatchMutation.isPending
                          ? 'Publishing Groups...'
                          : 'Save & Commit Groups to Database'}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Total Students
                    </span>
                    <span className="text-xl font-black text-white">
                      {previewResult?.total_members ||
                        customGroups.reduce((acc, g) => acc + g.members.length, 0)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Gender Equilibrium
                    </span>
                    <span className="text-sm font-black text-emerald-400">
                      {previewResult?.overall_gender_ratio || '50% Male / 50% Female'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Average Group Size
                    </span>
                    <span className="text-xl font-black text-white">
                      {Math.round(
                        customGroups.reduce((acc, g) => acc + g.members.length, 0) /
                          customGroups.length
                      )}{' '}
                      members
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Size Variance
                    </span>
                    <span className="text-sm font-black text-gold-400">Strict (≤ 1 person)</span>
                  </div>
                </div>
              </div>

              {/* Group Cards Grid for Fine-Tuning */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {customGroups.map((g, gIdx) => {
                  const mCount = g.male_count;
                  const fCount = g.female_count;
                  const tCount = g.total_count;

                  return (
                    <Card
                      key={g.id || gIdx}
                      className="p-5 bg-white dark:bg-slate-900 border-2 border-emerald-500/20 dark:border-emerald-500/30 shadow-md space-y-4"
                    >
                      {/* Group Header & Name Input */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                            Group #{gIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={g.name}
                            onChange={(e) => {
                              const next = [...customGroups];
                              next[gIdx].name = e.target.value;
                              setCustomGroups(next);
                            }}
                            className="text-base font-black text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 w-full outline-none focus:border-emerald-600"
                            title="Click to customize group name"
                          />
                        </div>

                        <span className="shrink-0 font-black text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300">
                          {tCount} Members
                        </span>
                      </div>

                      {/* Group Leader Selector */}
                      <div className="space-y-1 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/60 text-xs">
                        <div className="flex justify-between items-center font-bold text-amber-900 dark:text-amber-300">
                          <span className="flex items-center gap-1.5">
                            <Award size={13} className="text-amber-600" />
                            Group Facilitator:
                          </span>
                          <span className="text-[10px] text-amber-700">Recommended: Senior</span>
                        </div>
                        <select
                          value={g.leader?.id || ''}
                          onChange={(e) => handleAssignLeader(gIdx, e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                        >
                          {g.members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.full_name} ({m.gender?.toUpperCase()}, Yr {m.year_of_study || 1})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Gender Balance Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Gender Balance:
                          </span>
                          <div className="flex items-center gap-2 text-[11px] font-black">
                            <span className="text-sky-700 dark:text-sky-400">
                              {mCount} Males ({g.male_ratio_pct}%)
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-rose-700 dark:text-rose-400">
                              {fCount} Females ({g.female_ratio_pct}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                          <div style={{ width: `${g.male_ratio_pct}%` }} className="bg-sky-500 h-full" />
                          <div
                            style={{ width: `${g.female_ratio_pct}%` }}
                            className="bg-rose-500 h-full"
                          />
                        </div>
                      </div>

                      {/* Members Roster with Move Options */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                          Assigned Students ({g.members.length})
                        </span>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {g.members.map((m) => {
                            const isFacilitator = g.leader?.id === m.id;
                            return (
                              <div
                                key={m.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs border border-slate-100 dark:border-slate-800 gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-black shrink-0 ${
                                      m.gender === 'female'
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                        : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                    }`}
                                  >
                                    {m.gender === 'female' ? 'F' : 'M'}
                                  </span>
                                  <div className="truncate">
                                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                      <span className="truncate">{m.full_name}</span>
                                      {isFacilitator && (
                                        <span className="text-[8px] bg-gold-400 text-slate-950 px-1 rounded-sm font-black shrink-0">
                                          LEADER
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-500 block truncate">
                                      Yr {m.year_of_study || 1} • {m.department || m.course || 'TUM'}
                                    </span>
                                  </div>
                                </div>

                                {/* Reassign to other group */}
                                <select
                                  value={gIdx}
                                  onChange={(e) =>
                                    handleMoveMember(m.id, gIdx, Number(e.target.value))
                                  }
                                  className="text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md px-1.5 py-0.5 text-slate-700 dark:text-slate-300 outline-none shrink-0"
                                  title="Move student to another group"
                                >
                                  {customGroups.map((otherG, otherIdx) => (
                                    <option key={otherIdx} value={otherIdx}>
                                      {otherIdx === gIdx ? 'Here' : `Move to Grp ${otherIdx + 1}`}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Bottom Commit & Excel Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    Satisfied with the Gender Balance & Group Sizes?
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Publishing will commit all groups and student assignments to the authoritative
                    database.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportBibleStudyGroupsToExcel(customGroups, cohortName)}
                    className="text-xs font-bold gap-1.5"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-600" />
                    <span>Download Excel Sheet</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveGroups}
                    disabled={saveBatchMutation.isPending}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    <span>
                      {saveBatchMutation.isPending ? 'Committing...' : 'Commit Groups to Database'}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CANDIDATE DIRECTORY & UNASSIGNED STUDENTS */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Search candidate by name, admission no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs"
              />
            </div>

            <span className="text-xs font-bold text-slate-500">
              Showing {candidates.length} active registered students
            </span>
          </div>

          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Student Member</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Academic Year</th>
                    <th className="py-3 px-4">Department / Course</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Group Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {candidates
                    .filter(
                      (c) =>
                        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (c.admission_number &&
                          c.admission_number.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {c.full_name}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
                              c.gender === 'female'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                            }`}
                          >
                            {c.gender === 'female' ? 'Female' : 'Male'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {c.admission_number || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                          Year {c.year_of_study || 1}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {c.department || c.course || c.school || 'TUM'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {c.phone_number || '—'}
                        </td>
                        <td className="py-3 px-4">
                          {c.assigned_group_name ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 size={12} />
                              {c.assigned_group_name}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-300">
                              Unassigned
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
