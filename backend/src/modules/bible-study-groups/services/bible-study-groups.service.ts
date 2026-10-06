import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { query } from '../../../config/database';
import {
  BibleStudyGroup,
  BibleStudyMember,
  CandidateMember,
  GroupGenerationOptions,
  GenerationResult,
  GeneratedGroupPreview,
} from '../interfaces/bible-study-groups.interface';

const DEFAULT_GROUP_NAMES = [
  'Bereans (Acts 17:11)',
  'Timothy Disciples (2 Tim 2:2)',
  'Barnabas Sons of Encouragement',
  'Cornerstone Fellowship (Eph 2:20)',
  'Mount Zion Believers (Heb 12:22)',
  'Alpha & Omega (Rev 22:13)',
  'Living Stones (1 Peter 2:5)',
  'Grace & Truth (John 1:14)',
  'Bethel Altar (Gen 28:19)',
  'Shiloh Seekers (1 Sam 1:3)',
  'Emmaus Walkers (Luke 24:32)',
  'Antioch Ambassadors (Acts 11:26)',
  'Overcomers in Christ (Rev 12:11)',
  'Salt & Light (Matthew 5:13-14)',
  'Ebenezer Cohort (1 Sam 7:12)',
  'Pacesetters of Faith (Heb 11:1)',
];

export class BibleStudyGroupsService {
  /**
   * List all saved Bible study groups with member counts and gender balance.
   */
  async listGroups(cohortName?: string): Promise<BibleStudyGroup[]> {
    let groups: any[] = [];
    try {
      if (cohortName) {
        groups = await query<any[]>(
          'SELECT * FROM bible_study_groups WHERE cohort_name = :cohortName ORDER BY created_at ASC',
          { cohortName }
        );
      } else {
        groups = await query<any[]>('SELECT * FROM bible_study_groups ORDER BY created_at ASC', {});
      }
    } catch {
      groups = [];
    }

    // Load members for each group to compute accurate live stats
    const enrichedGroups: BibleStudyGroup[] = [];

    for (const group of groups) {
      let members: any[] = [];
      try {
        members = await query<any[]>(
          `SELECT bsm.id, bsm.group_id, bsm.user_id, bsm.role, bsm.joined_at,
                  u.full_name, u.admission_number, u.gender, u.phone_number, u.email,
                  u.year_of_study, u.school, u.department, u.course
             FROM bible_study_members bsm
             JOIN users u ON u.id = bsm.user_id
            WHERE bsm.group_id = :groupId
            ORDER BY u.full_name ASC`,
          { groupId: group.id }
        );
      } catch {
        members = [];
      }

      // Leader info
      let leaderName = null;
      let leaderPhone = null;
      if (group.leader_id) {
        const leader = members.find((m) => m.user_id === group.leader_id);
        if (leader) {
          leaderName = leader.full_name;
          leaderPhone = leader.phone_number;
        } else {
          try {
            const leaderUser = await query<any[]>(
              'SELECT full_name, phone_number FROM users WHERE id = :id LIMIT 1',
              { id: group.leader_id }
            );
            if (leaderUser && leaderUser.length > 0) {
              leaderName = leaderUser[0].full_name;
              leaderPhone = leaderUser[0].phone_number;
            }
          } catch {
            // ignore
          }
        }
      }

      const maleCount = members.filter((m) => String(m.gender).toLowerCase() === 'male').length;
      const femaleCount = members.filter((m) => String(m.gender).toLowerCase() === 'female').length;

      enrichedGroups.push({
        ...group,
        leader_name: leaderName,
        leader_phone: leaderPhone,
        member_count: members.length,
        male_count: maleCount,
        female_count: femaleCount,
        members,
      });
    }

    return enrichedGroups;
  }

  /**
   * Get single group details with complete member roster.
   */
  async getGroupById(id: string): Promise<BibleStudyGroup | null> {
    const rows = await query<any[]>('SELECT * FROM bible_study_groups WHERE id = :id LIMIT 1', { id });
    if (!rows || rows.length === 0) return null;

    const group = rows[0];
    const members = await query<any[]>(
      `SELECT bsm.id, bsm.group_id, bsm.user_id, bsm.role, bsm.joined_at,
              u.full_name, u.admission_number, u.gender, u.phone_number, u.email,
              u.year_of_study, u.school, u.department, u.course
         FROM bible_study_members bsm
         JOIN users u ON u.id = bsm.user_id
        WHERE bsm.group_id = :groupId
        ORDER BY u.full_name ASC`,
      { groupId: id }
    );

    let leaderName = null;
    let leaderPhone = null;
    if (group.leader_id) {
      const leader = members.find((m) => m.user_id === group.leader_id);
      if (leader) {
        leaderName = leader.full_name;
        leaderPhone = leader.phone_number;
      }
    }

    const maleCount = members.filter((m) => String(m.gender).toLowerCase() === 'male').length;
    const femaleCount = members.filter((m) => String(m.gender).toLowerCase() === 'female').length;

    return {
      ...group,
      leader_name: leaderName,
      leader_phone: leaderPhone,
      member_count: members.length,
      male_count: maleCount,
      female_count: femaleCount,
      members,
    };
  }

  /**
   * Get candidate active members for Bible study group assignment.
   */
  async getCandidateMembers(): Promise<CandidateMember[]> {
    // 1. Fetch all active members from users table
    const users = await query<any[]>(
      `SELECT id, full_name, admission_number, gender, phone_number, email,
              year_of_study, school, department, course, account_status
         FROM users
        WHERE (account_status = 'active' OR account_status IS NULL)
          AND deleted_at IS NULL
        ORDER BY full_name ASC`,
      {}
    );

    // 2. Fetch existing group assignments
    let currentMemberships: any[] = [];
    try {
      currentMemberships = await query<any[]>(
        `SELECT bsm.user_id, bsm.group_id, bsg.name AS group_name
           FROM bible_study_members bsm
           JOIN bible_study_groups bsg ON bsg.id = bsm.group_id`,
        {}
      );
    } catch {
      currentMemberships = [];
    }

    const membershipMap = new Map<string, { groupId: string; groupName: string }>();
    for (const m of currentMemberships) {
      membershipMap.set(m.user_id, { groupId: m.group_id, groupName: m.group_name });
    }

    return users.map((u) => {
      const assigned = membershipMap.get(u.id);
      return {
        id: u.id,
        full_name: u.full_name,
        admission_number: u.admission_number || undefined,
        gender: u.gender ? String(u.gender).toLowerCase() : 'unspecified',
        phone_number: u.phone_number || undefined,
        email: u.email || undefined,
        year_of_study: u.year_of_study ? Number(u.year_of_study) : 1,
        school: u.school || undefined,
        department: u.department || undefined,
        course: u.course || undefined,
        account_status: u.account_status || 'active',
        assigned_group_id: assigned ? assigned.groupId : null,
        assigned_group_name: assigned ? assigned.groupName : null,
      };
    });
  }

  /**
   * Intelligent automated Bible study group generator.
   * Balances:
   * 1. Gender distribution (males and females evenly distributed)
   * 2. Number of members per group (balanced total headcount across groups)
   * 3. Year of study representation (peer mentorship mix)
   */
  async autoBalanceGroups(options: GroupGenerationOptions): Promise<GenerationResult> {
    const allCandidates = await this.getCandidateMembers();

    // Filter candidate pool
    let pool = allCandidates;

    if (options.selectedMemberIds && options.selectedMemberIds.length > 0) {
      const selectedSet = new Set(options.selectedMemberIds);
      pool = pool.filter((m) => selectedSet.has(m.id));
    } else if (!options.includeCurrentlyAssigned) {
      // By default, only include unassigned members, or if unassigned are few, all members
      const unassigned = pool.filter((m) => !m.assigned_group_id);
      if (unassigned.length >= 6) {
        pool = unassigned;
      }
    }

    if (options.filterYearOfStudy && options.filterYearOfStudy !== 'all') {
      const yr = Number(options.filterYearOfStudy);
      pool = pool.filter((m) => m.year_of_study === yr);
    }

    if (pool.length === 0) {
      pool = allCandidates;
    }

    // Determine target number of groups K
    let k = 4;
    if (options.targetGroupsCount && options.targetGroupsCount > 0) {
      k = Math.max(1, Math.min(options.targetGroupsCount, pool.length));
    } else if (options.targetGroupSize && options.targetGroupSize > 0) {
      k = Math.max(1, Math.ceil(pool.length / options.targetGroupSize));
    } else {
      // Default to groups of 6 to 10
      k = Math.max(2, Math.round(pool.length / 8)) || 3;
    }

    // Split pool by gender
    const males = pool.filter((m) => m.gender === 'male');
    const females = pool.filter((m) => m.gender === 'female');
    const others = pool.filter((m) => m.gender !== 'male' && m.gender !== 'female');

    // Sort within gender by year_of_study descending to balance senior and junior students
    const sortFn = (a: CandidateMember, b: CandidateMember) =>
      (b.year_of_study || 1) - (a.year_of_study || 1) || a.full_name.localeCompare(b.full_name);

    males.sort(sortFn);
    females.sort(sortFn);
    others.sort(sortFn);

    // Initialize K buckets
    const buckets: CandidateMember[][] = Array.from({ length: k }, () => []);

    // 1. Distribute Females with Snake Round-Robin
    let forward = true;
    let idx = 0;
    for (const f of females) {
      buckets[idx].push(f);
      if (forward) {
        if (idx === k - 1) {
          forward = false;
        } else {
          idx++;
        }
      } else {
        if (idx === 0) {
          forward = true;
        } else {
          idx--;
        }
      }
    }

    // 2. Distribute Males in Reverse Direction to equalize both gender and total headcount
    // Sort buckets by current size ascending before placing each male, or snake opposite
    // To strictly equalize gender balance and headcount:
    // We sort bucket indices by (current male count, then current total count)
    for (const m of males) {
      // Find bucket with lowest male count (and lowest total count)
      let minIdx = 0;
      let minMales = buckets[0].filter((p) => p.gender === 'male').length;
      let minTotal = buckets[0].length;

      for (let i = 1; i < k; i++) {
        const bMales = buckets[i].filter((p) => p.gender === 'male').length;
        const bTotal = buckets[i].length;
        if (bMales < minMales || (bMales === minMales && bTotal < minTotal)) {
          minIdx = i;
          minMales = bMales;
          minTotal = bTotal;
        }
      }
      buckets[minIdx].push(m);
    }

    // 3. Distribute any others to smallest buckets
    for (const o of others) {
      let minIdx = 0;
      let minTotal = buckets[0].length;
      for (let i = 1; i < k; i++) {
        if (buckets[i].length < minTotal) {
          minIdx = i;
          minTotal = buckets[i].length;
        }
      }
      buckets[minIdx].push(o);
    }

    // Build generated group structures
    const cohortName = options.cohortName || '2026/2027 Discipleship Cohort';
    const customNames = options.groupNames || [];

    const previewGroups: GeneratedGroupPreview[] = buckets.map((members, i) => {
      const gName =
        customNames[i] ||
        DEFAULT_GROUP_NAMES[i % DEFAULT_GROUP_NAMES.length] ||
        `Bible Study Group ${i + 1}`;

      const maleCount = members.filter((m) => m.gender === 'male').length;
      const femaleCount = members.filter((m) => m.gender === 'female').length;
      const totalCount = members.length;

      // Recommended leader: Choose the highest year of study student (Year 4 or 3)
      const potentialLeaders = [...members].sort(
        (a, b) => (b.year_of_study || 1) - (a.year_of_study || 1)
      );
      const recommendedLeader = potentialLeaders[0] || null;

      const meetingDay = options.meetingDay || (i % 2 === 0 ? 'Wednesday' : 'Thursday');
      const meetingTime = options.meetingTime || '5:00 PM – 6:30 PM';
      const location = options.locationPrefix
        ? `${options.locationPrefix} - Hall ${String.fromCharCode(65 + i)}`
        : `Main Chapel Grounds - Zone ${i + 1}`;
      const studyBookGuide =
        options.studyBookGuide || 'Foundations of Biblical Discipleship & The Gospel of John';

      return {
        id: uuidv4(),
        name: gName,
        cohort_name: cohortName,
        meeting_day: meetingDay,
        meeting_time: meetingTime,
        location,
        study_book_guide: studyBookGuide,
        leader: recommendedLeader,
        members,
        male_count: maleCount,
        female_count: femaleCount,
        total_count: totalCount,
        male_ratio_pct: totalCount > 0 ? Math.round((maleCount / totalCount) * 100) : 0,
        female_ratio_pct: totalCount > 0 ? Math.round((femaleCount / totalCount) * 100) : 0,
      };
    });

    const totalMales = pool.filter((m) => m.gender === 'male').length;
    const totalFemales = pool.filter((m) => m.gender === 'female').length;

    return {
      cohort_name: cohortName,
      total_members: pool.length,
      total_males: totalMales,
      total_females: totalFemales,
      overall_gender_ratio: `${totalMales} Males : ${totalFemales} Females (${
        pool.length > 0 ? Math.round((totalMales / pool.length) * 100) : 0
      }% M / ${pool.length > 0 ? Math.round((totalFemales / pool.length) * 100) : 0}% F)`,
      groups_count: previewGroups.length,
      groups: previewGroups,
    };
  }

  /**
   * Batch save generated groups and assign members into the database.
   */
  async batchSaveGroups(payload: {
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
    let savedCount = 0;
    let membersAssigned = 0;

    for (const g of payload.groups) {
      const groupId = uuidv4();
      await query(
        `INSERT INTO bible_study_groups (id, name, cohort_name, leader_id, meeting_day, meeting_time, location, study_book_guide, is_active, created_at)
         VALUES (:id, :name, :cohort_name, :leader_id, :meeting_day, :meeting_time, :location, :study_book_guide, 1, NOW())`,
        {
          id: groupId,
          name: g.name,
          cohort_name: payload.cohortName,
          leader_id: g.leader_id || null,
          meeting_day: g.meeting_day || 'Wednesday',
          meeting_time: g.meeting_time || '5:00 PM – 6:30 PM',
          location: g.location || 'Main Chapel Grounds',
          study_book_guide: g.study_book_guide || 'Foundations of Biblical Discipleship',
        }
      );
      savedCount++;

      for (const userId of g.member_ids) {
        const isLeader = g.leader_id === userId;
        const memberId = uuidv4();
        await query(
          `INSERT INTO bible_study_members (id, group_id, user_id, role, joined_at, created_at)
           VALUES (:id, :group_id, :user_id, :role, NOW(), NOW())`,
          {
            id: memberId,
            group_id: groupId,
            user_id: userId,
            role: isLeader ? 'leader' : 'member',
          }
        );
        membersAssigned++;
      }
    }

    return { savedCount, membersAssigned };
  }

  /**
   * Delete a Bible study group and its membership linkages.
   */
  async deleteGroup(id: string): Promise<boolean> {
    await query('DELETE FROM bible_study_members WHERE group_id = :id', { id });
    await query('DELETE FROM bible_study_groups WHERE id = :id', { id });
    return true;
  }

  /**
   * Update group details.
   */
  async updateGroup(id: string, data: Partial<BibleStudyGroup>): Promise<boolean> {
    await query(
      `UPDATE bible_study_groups
          SET name = COALESCE(:name, name),
              leader_id = COALESCE(:leader_id, leader_id),
              meeting_day = COALESCE(:meeting_day, meeting_day),
              meeting_time = COALESCE(:meeting_time, meeting_time),
              location = COALESCE(:location, location),
              study_book_guide = COALESCE(:study_book_guide, study_book_guide),
              updated_at = NOW()
        WHERE id = :id`,
      {
        id,
        name: data.name,
        leader_id: data.leader_id,
        meeting_day: data.meeting_day,
        meeting_time: data.meeting_time,
        location: data.location,
        study_book_guide: data.study_book_guide,
      }
    );
    return true;
  }

  /**
   * Generate high-fidelity Excel workbook buffer with:
   * 1. Summary sheet (Gender balance stats, groups count, leaders)
   * 2. Master roster (All students, group, gender, contact, admission)
   * 3. Group-by-group sheets with attendance columns
   */
  async exportExcel(cohortName?: string): Promise<Buffer> {
    const groups = await this.listGroups(cohortName);

    const workbook = XLSX.utils.book_new();

    // 1. SUMMARY SHEET
    const totalMembers = groups.reduce((acc, g) => acc + (g.member_count || 0), 0);
    const totalMales = groups.reduce((acc, g) => acc + (g.male_count || 0), 0);
    const totalFemales = groups.reduce((acc, g) => acc + (g.female_count || 0), 0);

    const summaryData: any[] = [
      ['TECHNICAL UNIVERSITY OF MOMBASA CHRISTIAN UNION (T.U.M.C.U.)'],
      ['DISCIPLESHIP COMMITTEE — BIBLE STUDY GROUPS REGISTER & GENDER BALANCE REPORT'],
      [`Cohort: ${cohortName || 'All Active Cohorts'} | Generated: ${new Date().toLocaleString()}`],
      [],
      ['EXECUTIVE SUMMARY'],
      ['Total Groups', groups.length],
      ['Total Members Enrolled', totalMembers],
      ['Total Male Members', totalMales],
      ['Total Female Members', totalFemales],
      [
        'Overall Gender Balance',
        `${totalMembers > 0 ? Math.round((totalMales / totalMembers) * 100) : 0}% Male / ${
          totalMembers > 0 ? Math.round((totalFemales / totalMembers) * 100) : 0
        }% Female`,
      ],
      [],
      [
        'GROUP ROSTER & GENDER BREAKDOWN',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ],
      [
        'S/N',
        'Group Name',
        'Group Leader',
        'Meeting Day',
        'Time',
        'Venue',
        'Males',
        'Females',
        'Total',
        'Gender Ratio (M/F)',
        'Study Topic / Book',
      ],
    ];

    groups.forEach((g, idx) => {
      const m = g.male_count || 0;
      const f = g.female_count || 0;
      const t = g.member_count || 0;
      const ratio = t > 0 ? `${Math.round((m / t) * 100)}% M / ${Math.round((f / t) * 100)}% F` : '0%';
      summaryData.push([
        idx + 1,
        g.name,
        g.leader_name || 'Unassigned',
        g.meeting_day || 'Wednesday',
        g.meeting_time || '5:00 PM',
        g.location || 'Main Chapel Grounds',
        m,
        f,
        t,
        ratio,
        g.study_book_guide || 'Foundations of Faith',
      ]);
    });

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [
      { wch: 6 },
      { wch: 32 },
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 25 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 22 },
      { wch: 35 },
    ];
    XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary & Statistics');

    // 2. MASTER ALL MEMBERS SHEET
    const masterData: any[] = [
      ['T.U.M.C.U. BIBLE STUDY GROUPS — MASTER MEMBERS ROSTER'],
      [`Cohort: ${cohortName || 'Current'} | Official Discipleship Committee Register`],
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
        'School / Faculty',
        'Department / Course',
        'Role in Group',
        'Meeting Schedule',
      ],
    ];

    let rowNum = 1;
    for (const g of groups) {
      for (const m of g.members || []) {
        masterData.push([
          rowNum++,
          g.name,
          m.full_name,
          m.gender ? m.gender.toUpperCase() : 'N/A',
          m.admission_number || 'N/A',
          m.phone_number || 'N/A',
          m.email || 'N/A',
          m.year_of_study ? `Year ${m.year_of_study}` : 'Year 1',
          m.school || 'TUM',
          m.department || m.course || 'N/A',
          m.user_id === g.leader_id || m.role === 'leader' ? 'GROUP LEADER' : 'Member',
          `${g.meeting_day} ${g.meeting_time}`,
        ]);
      }
    }

    const masterWs = XLSX.utils.aoa_to_sheet(masterData);
    masterWs['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 26 },
      { wch: 10 },
      { wch: 16 },
      { wch: 16 },
      { wch: 26 },
      { wch: 14 },
      { wch: 25 },
      { wch: 30 },
      { wch: 16 },
      { wch: 25 },
    ];
    XLSX.utils.book_append_sheet(workbook, masterWs, 'Master Members Roster');

    // 3. INDIVIDUAL GROUP SHEETS (First 5 or all groups)
    groups.forEach((g, gIdx) => {
      const cleanSheetName = g.name.replace(/[\\/*?[\]:]/g, ' ').slice(0, 28);
      const groupData: any[] = [
        [`TUMCU BIBLE STUDY — ${g.name.toUpperCase()}`],
        [
          `Leader: ${g.leader_name || 'Unassigned'} | Contact: ${g.leader_phone || 'N/A'} | Venue: ${
            g.location || 'Chapel'
          }`,
        ],
        [`Meeting: Every ${g.meeting_day} at ${g.meeting_time} | Study Guide: ${g.study_book_guide}`],
        [
          `Members: ${g.member_count} (${g.male_count} Males, ${g.female_count} Females — Balance: ${
            g.member_count ? Math.round(((g.male_count || 0) / g.member_count) * 100) : 0
          }% M / ${g.member_count ? Math.round(((g.female_count || 0) / g.member_count) * 100) : 0}% F)`,
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
          'Notes / Prayer Requests',
        ],
      ];

      (g.members || []).forEach((m, mIdx) => {
        groupData.push([
          mIdx + 1,
          m.full_name,
          m.gender ? m.gender.toUpperCase() : 'N/A',
          m.admission_number || 'N/A',
          m.phone_number || 'N/A',
          m.year_of_study ? `Yr ${m.year_of_study}` : 'Yr 1',
          m.user_id === g.leader_id || m.role === 'leader' ? 'LEADER' : 'Member',
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

      const groupWs = XLSX.utils.aoa_to_sheet(groupData);
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

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer as Buffer;
  }
}
