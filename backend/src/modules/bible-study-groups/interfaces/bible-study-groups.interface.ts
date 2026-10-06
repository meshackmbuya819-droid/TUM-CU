export type BibleStudyGroups = BibleStudyGroup;

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
