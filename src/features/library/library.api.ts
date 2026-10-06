import { api, type ApiResponse } from '@/services/api';

export interface LibraryResource {
  id: string;
  title: string;
  author: string;
  category: string;
  is_digital?: boolean | number;
  cover_image_url?: string | null;
  file_url?: string | null;
  description?: string | null;
  status?: 'available' | 'maintenance' | 'archived';
  created_at: string;
  updated_at?: string | null;
}

export interface LibraryBorrowing {
  id: string;
  book_title: string;
  user_id: string;
  borrower_name: string;
  borrower_email: string;
  borrower_phone?: string | null;
  user_admission_number?: string | null;
  borrowed_at: string;
  due_at: string;
  returned_at?: string | null;
  status: 'active' | 'overdue' | 'returned';
  notes?: string | null;
  issued_by?: string | null;
  returned_to?: string | null;
  created_at?: string;
  updated_at?: string | null;
  // Dynamic computed fields
  days_overdue?: number;
  days_remaining?: number;
  is_overdue?: boolean;
  is_due_soon?: boolean;
}

export interface BorrowerMember {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  admission_number?: string | null;
}

export interface LibraryStats {
  booksOut: number;
  dueSoon: number;
  overdue: number;
  returned: number;
  totalLoansRecorded: number;
  totalDigitalResources: number;
  // Compatibility fields if needed
  totalPhysicalBooks?: number;
  totalPhysicalCopies?: number;
  availableCopies?: number;
  currentlyBorrowed?: number;
  overdueBooks?: number;
  pendingRequests?: number;
}

// ============================================================================
// E-LIBRARY (Digital Books & Documents)
// ============================================================================

export async function fetchLibraryResources(params?: {
  category?: string;
  search?: string;
  type?: string;
}): Promise<LibraryResource[]> {
  const { data } = await api.get<ApiResponse<LibraryResource[]>>('/library/resources', {
    params: {
      category: params?.category,
      search: params?.search,
    },
  });
  return data.data || [];
}

export async function fetchLibraryResource(id: string): Promise<LibraryResource> {
  const { data } = await api.get<ApiResponse<LibraryResource>>(`/library/resources/${id}`);
  return data.data;
}

export async function createLibraryResource(payload: Partial<LibraryResource>): Promise<LibraryResource> {
  const { data } = await api.post<ApiResponse<LibraryResource>>('/library/resources', payload);
  return data.data;
}

export async function updateLibraryResource(id: string, payload: Partial<LibraryResource>): Promise<LibraryResource> {
  const { data } = await api.put<ApiResponse<LibraryResource>>(`/library/resources/${id}`, payload);
  return data.data;
}

export async function deleteLibraryResource(id: string): Promise<void> {
  await api.delete(`/library/resources/${id}`);
}

// ============================================================================
// PHYSICAL BOOK LENDING REGISTER
// ============================================================================

export async function recordBookLoan(payload: {
  book_title: string;
  user_id: string;
  due_at?: string;
  due_days?: number;
  notes?: string;
}): Promise<{ id: string; book_title: string; borrower_name: string; due_at: string; message: string }> {
  const { data } = await api.post<ApiResponse<any>>('/library/borrowings', payload);
  return data.data;
}

// Backward compatible checkout alias
export async function checkoutBook(payload: any): Promise<any> {
  const { data } = await api.post<ApiResponse<any>>('/library/checkout', payload);
  return data.data;
}

export async function returnBook(borrowingId: string): Promise<{ id: string; status: string; message: string }> {
  const { data } = await api.post<ApiResponse<any>>(`/library/borrowings/${borrowingId}/return`);
  return data.data;
}

export async function extendDueDate(borrowingId: string, days = 7): Promise<{ id: string; due_at: string; message: string }> {
  const { data } = await api.post<ApiResponse<any>>(`/library/borrowings/${borrowingId}/extend`, { days });
  return data.data;
}

export async function fetchBorrowings(paramsOrStatus?: string | { status?: string; search?: string }): Promise<LibraryBorrowing[]> {
  const params = typeof paramsOrStatus === 'string' ? { status: paramsOrStatus } : paramsOrStatus;
  const { data } = await api.get<ApiResponse<LibraryBorrowing[]>>('/library/borrowings', { params });
  return data.data || [];
}

export async function fetchMyBorrowings(): Promise<LibraryBorrowing[]> {
  const { data } = await api.get<ApiResponse<LibraryBorrowing[]>>('/library/my-borrowings');
  return data.data || [];
}

// Backward compatibility alias for my library requests
export async function fetchMyLibraryRequests(): Promise<{
  borrowings: LibraryBorrowing[];
  reservations: any[];
}> {
  const { data } = await api.get<ApiResponse<any>>('/library/my-requests');
  if (Array.isArray(data.data)) {
    return { borrowings: data.data, reservations: [] };
  }
  return {
    borrowings: data.data?.borrowings || [],
    reservations: data.data?.reservations || [],
  };
}

export async function fetchLibraryStats(): Promise<LibraryStats> {
  const { data } = await api.get<ApiResponse<LibraryStats>>('/library/reports/stats');
  return data.data;
}

// ============================================================================
// SEARCH & AUTOCOMPLETE HELPERS
// ============================================================================

export async function searchBorrowerMembers(query: string): Promise<BorrowerMember[]> {
  const { data } = await api.get<ApiResponse<BorrowerMember[]>>('/library/members/search', {
    params: { q: query },
  });
  return data.data || [];
}

export async function suggestBookTitles(query: string): Promise<string[]> {
  const { data } = await api.get<ApiResponse<string[]>>('/library/titles/suggest', {
    params: { q: query },
  });
  return data.data || [];
}

// Stubs for legacy imports to prevent compile breaks
export type LibraryReservation = any;
export async function requestPhysicalBook(_id: string, _payload: any): Promise<any> {
  return { message: 'Physical book requests have been replaced by the direct physical lending register' };
}
export async function fetchLibrarianRequests(): Promise<any[]> {
  return [];
}
export async function approveLibraryRequest(_id: string): Promise<any> {
  return {};
}
export async function rejectLibraryRequest(_id: string, _reason?: string): Promise<any> {
  return {};
}
