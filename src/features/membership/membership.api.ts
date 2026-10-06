import { api, type ApiResponse } from '@/services/api';
import * as XLSX from 'xlsx';

export interface Membership {
  id: string;
  membership_number: string;
  membership_type_id: string;
  spiritual_year_id: string;
  status: 'pending' | 'active' | 'expired' | 'suspended';
  registration_date: string;
  renewal_date: string | null;
}

export interface MembershipApplication {
  id: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
}

export interface MyMembershipStatus {
  memberships: Membership[];
  applications: MembershipApplication[];
}

export async function fetchMyMembershipStatus() {
  const { data } = await api.get<ApiResponse<MyMembershipStatus>>('/membership/me');
  return data.data;
}

export interface PendingApplication {
  id: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  user_id: string;
  full_name: string;
  email: string;
  admission_number: string | null;
  membership_type_name: string;
  phone?: string | null;
  phone_number?: string | null;
  year_of_study?: string | number | null;
  course?: string | null;
  school?: string | null;
  department?: string | null;
}

export async function fetchPendingApplications() {
  const statuses = ['submitted', 'under_review'] as const;
  const responses = await Promise.all(
    statuses.map((status) =>
      api.get<ApiResponse<PendingApplication[]>>('/membership/applications', {
        params: { status, page: 1, pageSize: 100 },
      })
    )
  );

  return responses
    .flatMap((response) => response.data.data || [])
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function approveApplication(applicationId: string) {
  const { data } = await api.post<ApiResponse<Membership>>(
    `/membership/applications/${applicationId}/approve`,
    {}
  );
  return data.data;
}

export async function rejectApplication(applicationId: string, rejectionReason: string) {
  const { data } = await api.post<ApiResponse<PendingApplication>>(
    `/membership/applications/${applicationId}/reject`,
    { rejectionReason }
  );
  return data.data;
}

export interface MemberListItem {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  admission_number: string;
  year_of_study: string;
  department: string;
  membership_number: string;
  membership_type: string;
  status: string;
  registration_date: string;
  role_name: string;
  ministries: string;
  services_attended?: number;
}

export interface MemberListResult {
  rows: MemberListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export async function fetchAllMembers(filters?: {
  search?: string;
  yearOfStudy?: string;
  department?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<MemberListResult> {
  const params: Record<string, string> = {};
  if (filters?.search) params.search = filters.search;
  if (filters?.yearOfStudy) params.year_of_study = filters.yearOfStudy;
  if (filters?.department) params.department = filters.department;
  if (filters?.status) params.status = filters.status;
  if (filters?.page) params.page = String(filters.page);
  if (filters?.pageSize) params.pageSize = String(filters.pageSize);

  const { data } = await api.get<ApiResponse<MemberListItem[]> & {
    meta?: { page?: number; pageSize?: number; total?: number; totalPages?: number };
  }>('/membership/all-members', { params });

  const meta = data.meta || {};
  return {
    rows: data.data || [],
    page: Number(meta.page || filters?.page || 1),
    pageSize: Number(meta.pageSize || filters?.pageSize || 50),
    total: Number(meta.total || data.data?.length || 0),
    totalPages: Number(meta.totalPages || 1),
  };
}

export async function deleteMemberApi(memberId: string): Promise<void> {
  await api.delete(`/membership/${memberId}`);
}

async function fetchAllMemberExportRows(): Promise<MemberListItem[]> {
  const first = await fetchAllMembers({ page: 1, pageSize: 200 });
  const rows = [...first.rows];

  // Export is intentionally paged so the API never returns the entire register
  // in one HTTP response. The browser assembles the final document only for
  // explicit user-requested exports.
  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = await fetchAllMembers({ page, pageSize: 200 });
    rows.push(...next.rows);
  }
  return rows;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadMembershipCsv(): Promise<void> {
  const res = await api.get('/membership/export', { responseType: 'blob' });
  triggerBlobDownload(
    new Blob([res.data], { type: 'text/csv;charset=utf-8;' }),
    `TUMCU_Membership_Register_${new Date().toISOString().split('T')[0]}.csv`
  );
}

export async function downloadMembershipExcel(): Promise<void> {
  const members = await fetchAllMemberExportRows();
  const rows = members.map((m) => ({
    'Membership No': m.membership_number,
    'Full Name': m.full_name,
    'Admission No': m.admission_number,
    'Year of Study': m.year_of_study,
    'Department / Faculty': m.department,
    Email: m.email,
    'Phone Number': m.phone_number,
    Role: m.role_name,
    Ministries: m.ministries,
    'Services Attended': m.services_attended ?? 0,
    Status: m.status,
    'Registered Date': m.registration_date,
  }));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'TUMCU Members');
  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  triggerBlobDownload(
    new Blob([output], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `TUMCU_Membership_Register_${new Date().toISOString().split('T')[0]}.xlsx`
  );
}

export async function downloadMembershipPdf(): Promise<void> {
  const members = await fetchAllMemberExportRows();

  // Lightweight dependency-free PDF writer. It intentionally uses plain
  // Helvetica text so even a large register can be exported without loading
  // a heavyweight PDF renderer into the application bundle.
  const pageWidth = 842; // A4 landscape points
  const pageHeight = 595;
  const margin = 24;
  const lineHeight = 9;
  const linesPerPage = 57;
  const maxChars = 150;

  const clean = (value: unknown) =>
    String(value ?? '')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

  const header =
    'MEMBERSHIP NO | FULL NAME | ADMISSION | YEAR | DEPARTMENT | EMAIL | PHONE | ROLE | STATUS';

  const rows = members.map((m) =>
    [
      m.membership_number, m.full_name, m.admission_number, m.year_of_study,
      m.department, m.email, m.phone_number, m.role_name, m.status,
    ].map((v) => String(v ?? '')).join(' | ').slice(0, maxChars)
  );

  const pageTexts: string[][] = [];
  for (let i = 0; i < rows.length; i += linesPerPage - 3) {
    const chunk = rows.slice(i, i + linesPerPage - 3);
    pageTexts.push([
      'Technical University of Mombasa Christian Union (TUMCU)',
      `Membership Register — Generated ${new Date().toLocaleString('en-KE')}`,
      `Total records: ${members.length}`,
      header,
      ...chunk,
    ]);
  }
  if (pageTexts.length === 0) pageTexts.push([
    'Technical University of Mombasa Christian Union (TUMCU)',
    'Membership Register',
    'No records found.',
  ]);

  const objects: string[] = [];
  const offsets: number[] = [0];
  const addObject = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = addObject('<< /Type /Catalog /Pages 2 0 R >>');
  const pagesId = addObject('<< /Type /Pages /Kids [] /Count 0 >>');
  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');

  const pageIds: number[] = [];
  for (const lines of pageTexts) {
    const content = [
      'BT',
      '/F1 7 Tf',
      `${margin} ${pageHeight - 30} Td`,
      ...lines.flatMap((line, index) => {
        const prefix = index === 0 ? '' : `0 -${lineHeight} Td\n`;
        return [`${prefix}(${clean(line)}) Tj`];
      }),
      'ET',
    ].join('\n');

    const contentId = addObject(
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
    );
    const pageId = addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
      `/Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  }

  objects[pagesId - 1] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  for (let i = 0; i < objects.length; i += 1) {
    offsets[i + 1] = new TextEncoder().encode(pdf).length;
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  triggerBlobDownload(
    new Blob([pdf], { type: 'application/pdf' }),
    `TUMCU_Membership_Register_${new Date().toISOString().split('T')[0]}.pdf`
  );
}
