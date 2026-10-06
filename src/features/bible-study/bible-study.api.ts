import * as XLSX from 'xlsx';
import { api, type ApiResponse } from '@/services/api';

export interface BibleStudyMember {
  id: string;
  group_id: string;
  user_id: string;
  full_name: string;
  admission_number?: string;
  gender: 'male' | 'female' | string;
  phone_number?: string;
  email?: string;
  year_of_study?: number;
  school?: string;
  department?: string;
  course?: string;
  role?: 'member' | 'leader' | 'assistant_leader';
  joined_at?: string;
}

export interface BibleStudyGroup {
  id: string;
  name: string;
  cohort_name: string;
  leader_id?: string | null;
  leader_name?: string | null;
  leader_phone?: string | null;
  assistant_leader_id?: string | null;
  assistant_leader_name?: string | null;
  meeting_day?: string | null;
  meeting_time?: string | null;
  location?: string | null;
  study_book_guide?: string | null;
  is_active?: boolean | number;
  created_at?: string;
  updated_at?: string;
  member_count?: number;
  male_count?: number;
  female_count?: number;
  members?: BibleStudyMember[];
}

export interface CandidateMember {
  id: string;
  full_name: string;
  admission_number?: string;
  gender: 'male' | 'female' | string;
  phone_number?: string;
  email?: string;
  year_of_study?: number;
  school?: string;
  department?: string;
  course?: string;
  account_status?: string;
  assigned_group_id?: string | null;
  assigned_group_name?: string | null;
}

export interface GroupGenerationOptions {
  cohortName?: string;
  targetGroupsCount?: number;
  targetGroupSize?: number;
  groupNames?: string[];
  meetingDay?: string;
  meetingTime?: string;
  locationPrefix?: string;
  studyBookGuide?: string;
  selectedMemberIds?: string[];
  filterYearOfStudy?: number | 'all';
  includeCurrentlyAssigned?: boolean;
}

export interface GeneratedGroupPreview {
  id: string;
  name: string;
  cohort_name: string;
  meeting_day: string;
  meeting_time: string;
  location: string;
  study_book_guide: string;
  leader?: CandidateMember | null;
  members: CandidateMember[];
  male_count: number;
  female_count: number;
  total_count: number;
  male_ratio_pct: number;
  female_ratio_pct: number;
}

export interface GenerationResult {
  cohort_name: string;
  total_members: number;
  total_males: number;
  total_females: number;
  overall_gender_ratio: string;
  groups_count: number;
  groups: GeneratedGroupPreview[];
}

export async function fetchBibleStudyGroups(cohortName?: string): Promise<BibleStudyGroup[]> {
  const { data } = await api.get<ApiResponse<BibleStudyGroup[]>>('/bible-study-groups', {
    params: cohortName ? { cohortName } : undefined,
  });
  return data.data || [];
}

export async function fetchBibleStudyGroup(id: string): Promise<BibleStudyGroup> {
  const { data } = await api.get<ApiResponse<BibleStudyGroup>>(`/bible-study-groups/${id}`);
  return data.data;
}

export async function fetchCandidateMembers(): Promise<CandidateMember[]> {
  const { data } = await api.get<ApiResponse<CandidateMember[]>>('/bible-study-groups/candidates');
  return data.data || [];
}

export async function autoBalanceBibleStudyGroups(
  options: GroupGenerationOptions
): Promise<GenerationResult> {
  const { data } = await api.post<ApiResponse<GenerationResult>>(
    '/bible-study-groups/auto-balance',
    options
  );
  return data.data;
}

export async function batchSaveBibleStudyGroups(payload: {
  cohortName: string;
  groups: Array<{
    name: string;
    leader_id?: string | null;
    meeting_day?: string;
    meeting_time?: string;
    location?: string;
    study_book_guide?: string;
    member_ids: string[];
  }>;
}): Promise<{ savedCount: number; membersAssigned: number }> {
  const { data } = await api.post<ApiResponse<{ savedCount: number; membersAssigned: number }>>(
    '/bible-study-groups/batch-save',
    payload
  );
  return data.data;
}

export async function updateBibleStudyGroup(
  id: string,
  payload: Partial<BibleStudyGroup>
): Promise<boolean> {
  const { data } = await api.put<ApiResponse<{ success: boolean }>>(
    `/bible-study-groups/${id}`,
    payload
  );
  return !!data.data?.success;
}

export async function deleteBibleStudyGroup(id: string): Promise<boolean> {
  const { data } = await api.delete<ApiResponse<{ success: boolean }>>(`/bible-study-groups/${id}`);
  return !!data.data?.success;
}

function getGroupTotalCount(g: BibleStudyGroup | GeneratedGroupPreview): number {
  if ('total_count' in g && typeof g.total_count === 'number') return g.total_count;
  if ('member_count' in g && typeof (g as any).member_count === 'number') return (g as any).member_count;
  if ('members' in g && Array.isArray(g.members)) return g.members.length;
  return 0;
}

/**
 * Downloads high-fidelity Excel (.xlsx) workbook directly in the client.
 * Supports both saved groups and generated previews.
 */
export function exportBibleStudyGroupsToExcel(
  groups: Array<BibleStudyGroup | GeneratedGroupPreview>,
  cohortName = '2026/2027 Discipleship Cohort'
) {
  const workbook = XLSX.utils.book_new();

  const totalMembers = groups.reduce((acc, g) => acc + getGroupTotalCount(g), 0);
  const totalMales = groups.reduce((acc, g) => acc + (g.male_count || 0), 0);
  const totalFemales = groups.reduce((acc, g) => acc + (g.female_count || 0), 0);

  // 1. SUMMARY SHEET
  const summaryAoa: any[] = [
    ['TECHNICAL UNIVERSITY OF MOMBASA CHRISTIAN UNION (T.U.M.C.U.)'],
    ['DISCIPLESHIP COMMITTEE — BIBLE STUDY GROUPS (BEST) REGISTER & GENDER BALANCE REPORT'],
    [`Cohort: ${cohortName} | Generated: ${new Date().toLocaleString()}`],
    [],
    ['EXECUTIVE SUMMARY'],
    ['Total Groups Created', groups.length],
    ['Total Members Enrolled', totalMembers],
    ['Total Male Members', totalMales],
    ['Total Female Members', totalFemales],
    [
      'Overall Gender Balance Ratio',
      `${totalMembers > 0 ? Math.round((totalMales / totalMembers) * 100) : 0}% Male / ${
        totalMembers > 0 ? Math.round((totalFemales / totalMembers) * 100) : 0
      }% Female`,
    ],
    [],
    [
      'S/N',
      'Group Name',
      'Group Leader',
      'Meeting Day',
      'Time',
      'Venue / Location',
      'Males',
      'Females',
      'Total Members',
      'Gender Ratio',
      'Study Book / Guide',
    ],
  ];

  groups.forEach((g, idx) => {
    const leaderName =
      'leader_name' in g && g.leader_name
        ? g.leader_name
        : 'leader' in g && g.leader
        ? g.leader.full_name
        : 'Unassigned';
    const total = getGroupTotalCount(g);
    const m = g.male_count || 0;
    const f = g.female_count || 0;
    const ratio = total > 0 ? `${Math.round((m / total) * 100)}% M / ${Math.round((f / total) * 100)}% F` : '0%';

    summaryAoa.push([
      idx + 1,
      g.name,
      leaderName,
      g.meeting_day || 'Wednesday',
      g.meeting_time || '5:00 PM',
      g.location || 'Chapel Grounds',
      m,
      f,
      total,
      ratio,
      g.study_book_guide || 'Foundations of Discipleship',
    ]);
  });

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryAoa);
  summaryWs['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 25 },
    { wch: 15 },
    { wch: 18 },
    { wch: 26 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 22 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary & Gender Balance');

  // 2. MASTER ALL MEMBERS SHEET
  const masterAoa: any[] = [
    ['T.U.M.C.U. BIBLE STUDY GROUPS — MASTER MEMBERS ROSTER'],
    [`Cohort: ${cohortName} | Discipleship Committee Authoritative Register`],
    [],
    [
      'S/N',
      'Group Name',
      'Member Full Name',
      'Gender',
      'Admission No.',
      'Phone Number',
      'Email Address',
      'Year of Study',
      'Department / Course',
      'Role in Group',
      'Meeting Schedule & Venue',
    ],
  ];

  let sn = 1;
  groups.forEach((g) => {
    const leaderId =
      'leader_id' in g && g.leader_id
        ? g.leader_id
        : 'leader' in g && g.leader
        ? g.leader.id
        : null;

    (g.members || []).forEach((m) => {
      const isLeader =
        ('role' in m && m.role === 'leader') ||
        m.id === leaderId ||
        ('user_id' in m && m.user_id === leaderId);

      masterAoa.push([
        sn++,
        g.name,
        m.full_name,
        m.gender ? m.gender.toUpperCase() : 'N/A',
        m.admission_number || 'N/A',
        m.phone_number || 'N/A',
        m.email || 'N/A',
        m.year_of_study ? `Year ${m.year_of_study}` : 'Year 1',
        m.department || m.course || 'TUM',
        isLeader ? 'GROUP LEADER' : 'Member',
        `${g.meeting_day} ${g.meeting_time} (${g.location})`,
      ]);
    });
  });

  const masterWs = XLSX.utils.aoa_to_sheet(masterAoa);
  masterWs['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 26 },
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
    { wch: 26 },
    { wch: 14 },
    { wch: 30 },
    { wch: 16 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(workbook, masterWs, 'Master Members Roster');

  // 3. INDIVIDUAL GROUP SHEETS (with attendance tracker columns for facilitators)
  groups.forEach((g, gIdx) => {
    const cleanSheetName = g.name.replace(/[\\/*?[\]:]/g, ' ').slice(0, 26);
    const leaderName =
      'leader_name' in g && g.leader_name
        ? g.leader_name
        : 'leader' in g && g.leader
        ? g.leader.full_name
        : 'Unassigned';
    const leaderPhone =
      'leader_phone' in g && g.leader_phone
        ? g.leader_phone
        : 'leader' in g && g.leader
        ? g.leader.phone_number
        : 'N/A';
    const total = getGroupTotalCount(g);

    const groupAoa: any[] = [
      [`TUMCU BIBLE STUDY — ${g.name.toUpperCase()}`],
      [`Leader: ${leaderName} | Contact: ${leaderPhone} | Venue: ${g.location}`],
      [`Meeting Schedule: Every ${g.meeting_day} at ${g.meeting_time} | Guide: ${g.study_book_guide}`],
      [
        `Enrollment: ${total} Students (${g.male_count} Males, ${g.female_count} Females — ${
          total > 0 ? Math.round(((g.male_count || 0) / total) * 100) : 0
        }% M / ${total > 0 ? Math.round(((g.female_count || 0) / total) * 100) : 0}% F)`,
      ],
      [],
      [
        'S/N',
        'Full Name',
        'Gender',
        'Admission No.',
        'Phone Number',
        'Year',
        'Role',
        'W1',
        'W2',
        'W3',
        'W4',
        'W5',
        'W6',
        'W7',
        'W8',
        'Weekly Remarks / Prayer Request',
      ],
    ];

    (g.members || []).forEach((m, mIdx) => {
      const leaderId =
        'leader_id' in g && g.leader_id
          ? g.leader_id
          : 'leader' in g && g.leader
          ? g.leader.id
          : null;
      const isLeader =
        ('role' in m && m.role === 'leader') ||
        m.id === leaderId ||
        ('user_id' in m && m.user_id === leaderId);

      groupAoa.push([
        mIdx + 1,
        m.full_name,
        m.gender ? m.gender.toUpperCase() : 'N/A',
        m.admission_number || 'N/A',
        m.phone_number || 'N/A',
        m.year_of_study ? `Yr ${m.year_of_study}` : 'Yr 1',
        isLeader ? 'LEADER' : 'Member',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ]);
    });

    const groupWs = XLSX.utils.aoa_to_sheet(groupAoa);
    groupWs['!cols'] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 8 },
      { wch: 15 },
      { wch: 15 },
      { wch: 8 },
      { wch: 10 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(workbook, groupWs, `${cleanSheetName} (Grp ${gIdx + 1})`.slice(0, 31));
  });

  const safeCohort = cohortName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `TUMCU_Bible_Study_Groups_${safeCohort}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(workbook, filename);
}
