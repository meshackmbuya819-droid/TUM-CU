import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  RotateCcw,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  Phone,
  Mail,
  ChevronRight,
  X,
  Edit2,
  Trash2,
  FileText,
  Download,
  ShieldCheck,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  fetchLibraryStats,
  fetchBorrowings,
  fetchLibraryResources,
  recordBookLoan,
  returnBook,
  extendDueDate,
  createLibraryResource,
  updateLibraryResource,
  deleteLibraryResource,
  searchBorrowerMembers,
  suggestBookTitles,
  type LibraryBorrowing,
  type LibraryResource,
  type BorrowerMember,
} from '@/features/library/library.api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export function LibrarianPortalPage() {
  const queryClient = useQueryClient();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'loans' | 'overdue' | 'returns' | 'history' | 'elibrary'>('loans');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'active' | 'overdue' | 'returned'>('all');
  const [historySearch, setHistorySearch] = useState('');

  // Notifications
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  const showFeedback = (message: string, isError = false) => {
    setFeedback({ message, isError });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['library-stats'],
    queryFn: fetchLibraryStats,
    refetchInterval: 15000,
  });

  const { data: allBorrowings = [], isLoading: loadingBorrowings } = useQuery({
    queryKey: ['librarian-borrowings'],
    queryFn: () => fetchBorrowings('all'),
  });

  const { data: elibraryResources = [], isLoading: loadingElibrary } = useQuery({
    queryKey: ['library-resources-librarian'],
    queryFn: () => fetchLibraryResources(),
  });

  // Filtered lists
  const currentLoans = allBorrowings.filter((b) => b.status === 'active' || (b.status === 'overdue' && !b.returned_at));
  const overdueLoans = allBorrowings.filter((b) => b.status === 'overdue' || (b.is_overdue && !b.returned_at));
  const recentReturns = allBorrowings.filter((b) => b.status === 'returned');
  
  const historyList = allBorrowings.filter((b) => {
    if (historyFilter !== 'all' && b.status !== historyFilter) return false;
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const matchTitle = b.book_title?.toLowerCase().includes(q);
      const matchBorrower = b.borrower_name?.toLowerCase().includes(q);
      const matchPhone = b.borrower_phone?.toLowerCase().includes(q);
      const matchEmail = b.borrower_email?.toLowerCase().includes(q);
      return matchTitle || matchBorrower || matchPhone || matchEmail;
    }
    return true;
  });

  // =========================================================================
  // MODAL STATES
  // =========================================================================
  // 1. Lend a Book Modal
  const [isLendModalOpen, setIsLendModalOpen] = useState(false);
  const [lendBookTitle, setLendBookTitle] = useState('');
  const [borrowerSearchQuery, setBorrowerSearchQuery] = useState('');
  const [selectedBorrower, setSelectedBorrower] = useState<BorrowerMember | null>(null);
  const [lendDueDays, setLendDueDays] = useState(14);
  const [lendDueDate, setLendDueDate] = useState(() => {
    const d = new Date(Date.now() + 14 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [lendNotes, setLendNotes] = useState('');

  // 2. Return Confirmation Modal
  const [returnModalBorrowing, setReturnModalBorrowing] = useState<LibraryBorrowing | null>(null);

  // 3. Quick Record Return Modal (Search active loan)
  const [isQuickReturnModalOpen, setIsQuickReturnModalOpen] = useState(false);
  const [quickReturnSearch, setQuickReturnSearch] = useState('');

  // 4. Manage E-Book Modal (Add / Edit)
  const [isEbookModalOpen, setIsEbookModalOpen] = useState(false);
  const [editingEbook, setEditingEbook] = useState<Partial<LibraryResource> | null>(null);

  // Queries for autocomplete
  const { data: borrowerCandidates = [] } = useQuery({
    queryKey: ['borrower-search', borrowerSearchQuery],
    queryFn: () => searchBorrowerMembers(borrowerSearchQuery),
    enabled: isLendModalOpen && borrowerSearchQuery.length >= 1,
  });

  const { data: titleSuggestions = [] } = useQuery({
    queryKey: ['title-suggestions', lendBookTitle],
    queryFn: () => suggestBookTitles(lendBookTitle),
    enabled: isLendModalOpen && lendBookTitle.length >= 2,
  });

  // =========================================================================
  // MUTATIONS
  // =========================================================================
  const lendMutation = useMutation({
    mutationFn: recordBookLoan,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['librarian-borrowings'] });
      queryClient.invalidateQueries({ queryKey: ['library-stats'] });
      queryClient.invalidateQueries({ queryKey: ['my-borrowings'] });
      showFeedback(data.message || 'Loan recorded successfully');
      setIsLendModalOpen(false);
      resetLendForm();
    },
    onError: (err: any) => {
      showFeedback(err?.response?.data?.message || err.message || 'Failed to record loan', true);
    },
  });

  const returnMutation = useMutation({
    mutationFn: returnBook,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['librarian-borrowings'] });
      queryClient.invalidateQueries({ queryKey: ['library-stats'] });
      queryClient.invalidateQueries({ queryKey: ['my-borrowings'] });
      showFeedback(data.message || 'Book returned successfully');
      setReturnModalBorrowing(null);
      setIsQuickReturnModalOpen(false);
    },
    onError: (err: any) => {
      showFeedback(err?.response?.data?.message || err.message || 'Failed to mark book returned', true);
    },
  });

  const extendMutation = useMutation({
    mutationFn: (vars: { id: string; days?: number }) => extendDueDate(vars.id, vars.days),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['librarian-borrowings'] });
      queryClient.invalidateQueries({ queryKey: ['library-stats'] });
      showFeedback(data.message || 'Due date extended');
    },
    onError: (err: any) => {
      showFeedback(err?.response?.data?.message || err.message || 'Failed to extend due date', true);
    },
  });

  const saveEbookMutation = useMutation({
    mutationFn: (payload: Partial<LibraryResource>) => {
      if (payload.id) {
        return updateLibraryResource(payload.id, payload);
      }
      return createLibraryResource(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-resources-librarian'] });
      queryClient.invalidateQueries({ queryKey: ['library-resources'] });
      queryClient.invalidateQueries({ queryKey: ['library-stats'] });
      showFeedback('E-Book saved successfully');
      setIsEbookModalOpen(false);
      setEditingEbook(null);
    },
    onError: (err: any) => {
      showFeedback(err?.response?.data?.message || err.message || 'Failed to save E-Book', true);
    },
  });

  const deleteEbookMutation = useMutation({
    mutationFn: deleteLibraryResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-resources-librarian'] });
      queryClient.invalidateQueries({ queryKey: ['library-resources'] });
      queryClient.invalidateQueries({ queryKey: ['library-stats'] });
      showFeedback('E-Book removed from library');
    },
    onError: (err: any) => {
      showFeedback(err?.response?.data?.message || err.message || 'Failed to delete E-Book', true);
    },
  });

  const resetLendForm = () => {
    setLendBookTitle('');
    setBorrowerSearchQuery('');
    setSelectedBorrower(null);
    setLendDueDays(14);
    const d = new Date(Date.now() + 14 * 86400000);
    setLendDueDate(d.toISOString().split('T')[0]);
    setLendNotes('');
  };

  const handleQuickDueDays = (days: number) => {
    setLendDueDays(days);
    const d = new Date(Date.now() + days * 86400000);
    setLendDueDate(d.toISOString().split('T')[0]);
  };

  const handleLendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lendBookTitle.trim()) {
      showFeedback('Please enter the book title', true);
      return;
    }
    if (!selectedBorrower) {
      showFeedback('Please search and select a registered member as the borrower', true);
      return;
    }

    lendMutation.mutate({
      book_title: lendBookTitle.trim(),
      user_id: selectedBorrower.id,
      due_at: new Date(lendDueDate).toISOString(),
      notes: lendNotes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in ${
            feedback.isError
              ? 'bg-rose-50 border border-rose-200 text-rose-900'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
          }`}
        >
          {feedback.isError ? (
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header and Top Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-[#006633] border border-emerald-200 mb-1">
            <ShieldCheck size={13} />
            <span>Christian Union Library Register</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Librarian Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record physical book loans, monitor overdue books, process returns, and manage downloadable E-books.
          </p>
        </div>

        {/* Two Large Primary Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => {
              resetLendForm();
              setIsLendModalOpen(true);
            }}
            variant="primary"
            className="gap-2 bg-[#006633] hover:bg-[#005229] text-white shadow-xs font-bold text-xs sm:text-sm px-4 py-2.5"
          >
            <Plus size={16} />
            <span>+ Lend a Book</span>
          </Button>

          <Button
            onClick={() => {
              setQuickReturnSearch('');
              setIsQuickReturnModalOpen(true);
            }}
            variant="outline"
            className="gap-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-50 font-bold text-xs sm:text-sm px-4 py-2.5 shadow-2xs"
          >
            <RotateCcw size={15} className="text-indigo-600" />
            <span>Record Return</span>
          </Button>
        </div>
      </div>

      {/* 4 Summary Cards: BOOKS OUT, DUE SOON, OVERDUE, RETURNED */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Books Out
            </span>
            <BookOpen size={16} className="text-[#006633]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {stats?.booksOut ?? currentLoans.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Currently on active loan</p>
        </div>

        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Due Soon
            </span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-950 mt-2">
            {stats?.dueSoon ?? currentLoans.filter((b) => b.is_due_soon).length}
          </div>
          <p className="text-[11px] text-amber-700 mt-1">Due within the next 3 days</p>
        </div>

        <div className="rounded-2xl border border-rose-200/90 bg-rose-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
              Overdue
            </span>
            <AlertCircle size={16} className="text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-950 mt-2">
            {stats?.overdue ?? overdueLoans.length}
          </div>
          <p className="text-[11px] text-rose-700 mt-1">Past due return date</p>
        </div>

        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Returned
            </span>
            <CheckCircle2 size={16} className="text-[#006633]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 mt-2">
            {stats?.returned ?? recentReturns.length}
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">Historical returned books</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('loans')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'loans'
              ? 'bg-[#006633] text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80'
          }`}
        >
          <span>Current Loans</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
            {currentLoans.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'overdue'
              ? 'bg-rose-700 text-white shadow-2xs'
              : 'text-rose-700 hover:text-rose-900 bg-rose-50 border border-rose-200'
          }`}
        >
          <AlertCircle size={13} />
          <span>Overdue Books</span>
          <span className="rounded-full bg-white/30 px-1.5 py-0.2 text-[10px]">
            {overdueLoans.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('returns')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'returns'
              ? 'bg-[#006633] text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80'
          }`}
        >
          <span>Recent Returns</span>
          <span className="rounded-full bg-slate-100 text-slate-700 px-1.5 py-0.2 text-[10px]">
            {recentReturns.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'history'
              ? 'bg-[#006633] text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80'
          }`}
        >
          <span>Borrowing History</span>
        </button>

        <button
          onClick={() => setActiveTab('elibrary')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'elibrary'
              ? 'bg-[#006633] text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80'
          }`}
        >
          <FileText size={13} />
          <span>Manage E-Library</span>
          <span className="rounded-full bg-slate-100 text-slate-700 px-1.5 py-0.2 text-[10px]">
            {elibraryResources.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: CURRENT LOANS TABLE                                             */}
      {/* ========================================================================= */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Active Borrowings ({currentLoans.length})
            </h2>
            <span className="text-xs text-slate-500">
              Click "Return" to mark a book as returned
            </span>
          </div>

          {loadingBorrowings ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading loans...</div>
          ) : currentLoans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No active book loans</p>
              <p className="text-xs text-slate-500 mt-1">All borrowed books have been returned.</p>
              <Button
                onClick={() => {
                  resetLendForm();
                  setIsLendModalOpen(true);
                }}
                variant="outline"
                size="sm"
                className="mt-4 text-xs font-bold gap-1 text-[#006633]"
              >
                <Plus size={13} /> Lend a Book Now
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Book Title</th>
                      <th className="py-3 px-4">Borrower</th>
                      <th className="py-3 px-4">Phone / Email</th>
                      <th className="py-3 px-4">Borrowed</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {currentLoans.map((item) => {
                      const isOverdue = item.status === 'overdue' || item.is_overdue;
                      const daysOverdue = item.days_overdue || 1;
                      const daysRemaining = item.days_remaining ?? 0;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {item.book_title}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800">{item.borrower_name}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            <div>{item.borrower_phone || '—'}</div>
                            <div className="text-[11px] text-slate-400">{item.borrower_email}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(item.borrowed_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={isOverdue ? 'font-bold text-rose-700' : 'text-slate-700 font-semibold'}>
                              {new Date(item.due_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isOverdue ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200">
                                Overdue ({daysOverdue}d)
                              </span>
                            ) : daysRemaining <= 3 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                                Due Soon ({daysRemaining === 0 ? 'Today' : `${daysRemaining}d`})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                                Active ({daysRemaining}d left)
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReturnModalBorrowing(item)}
                                className="h-7 text-xs font-bold text-emerald-800 hover:bg-emerald-50 border-emerald-300"
                              >
                                Return
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => extendMutation.mutate({ id: item.id, days: 7 })}
                                className="h-7 text-[11px] text-slate-500 hover:text-slate-800"
                                title="Extend loan by 7 days"
                              >
                                +7d
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: OVERDUE BOOKS SECTION                                          */}
      {/* ========================================================================= */}
      {activeTab === 'overdue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle size={15} className="text-rose-600" />
                Overdue Physical Books ({overdueLoans.length})
              </h2>
              <p className="text-xs text-slate-500">
                Books that have passed their return deadline and require follow-up.
              </p>
            </div>
          </div>

          {overdueLoans.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-10 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-[#006633] mb-2" />
              <p className="text-sm font-bold text-slate-800">No Overdue Books!</p>
              <p className="text-xs text-slate-600 mt-0.5">
                All physical books currently on loan are within their valid return periods.
              </p>
            </div>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2">
              {overdueLoans.map((item) => {
                const daysOverdue = item.days_overdue || 1;
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-rose-300 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="rounded-full bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-0.5 text-xs font-black">
                          OVERDUE — {daysOverdue} {daysOverdue === 1 ? 'DAY' : 'DAYS'}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          Due: {new Date(item.due_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {item.book_title}
                      </h3>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-700 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-900">{item.borrower_name}</span>
                        </div>
                        {item.borrower_phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={13} className="text-slate-400 shrink-0" />
                            <a
                              href={`tel:${item.borrower_phone}`}
                              className="text-indigo-700 hover:underline font-medium"
                            >
                              {item.borrower_phone}
                            </a>
                          </div>
                        )}
                        {item.borrower_email && (
                          <div className="flex items-center gap-2">
                            <Mail size={13} className="text-slate-400 shrink-0" />
                            <a
                              href={`mailto:${item.borrower_email}?subject=TUMCU%20Library%20Book%20Return:%20${encodeURIComponent(
                                item.book_title
                              )}`}
                              className="text-indigo-700 hover:underline truncate"
                            >
                              {item.borrower_email}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                          <Calendar size={12} className="text-slate-400 shrink-0" />
                          <span>Borrowed on {new Date(item.borrowed_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.borrower_phone && (
                          <a
                            href={`tel:${item.borrower_phone}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700"
                          >
                            <Phone size={12} /> Call
                          </a>
                        )}
                        {item.borrower_email && (
                          <a
                            href={`mailto:${item.borrower_email}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700"
                          >
                            <Mail size={12} /> Email
                          </a>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setReturnModalBorrowing(item)}
                        className="bg-[#006633] hover:bg-[#005229] text-white text-xs font-bold gap-1"
                      >
                        <CheckCircle2 size={13} />
                        <span>Mark Returned</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: RECENT RETURNS                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'returns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Recent Returns ({recentReturns.length})
            </h2>
          </div>

          {recentReturns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-xs text-slate-500">
              No returned books recorded yet.
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Book Title</th>
                      <th className="py-3 px-4">Borrower</th>
                      <th className="py-3 px-4">Borrowed Date</th>
                      <th className="py-3 px-4">Returned Date</th>
                      <th className="py-3 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentReturns.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.book_title}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{item.borrower_name}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(item.borrowed_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            {item.returned_at ? new Date(item.returned_at).toLocaleDateString() : 'Returned'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] italic">
                          {item.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: BORROWING HISTORY & SEARCH                                      */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <Input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search by book title, borrower name, phone..."
                className="pl-9 text-xs sm:text-sm bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'active', 'overdue', 'returned'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setHistoryFilter(mode)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition shrink-0 ${
                    historyFilter === mode
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4">Borrower</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Borrowed</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {historyList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.book_title}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{item.borrower_name}</td>
                      <td className="py-3 px-4 text-slate-500">{item.borrower_phone || '—'}</td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(item.borrowed_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {new Date(item.due_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'returned'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {item.status !== 'returned' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReturnModalBorrowing(item)}
                            className="h-7 text-xs font-bold text-emerald-800 hover:bg-emerald-50 border-emerald-300"
                          >
                            Return
                          </Button>
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

      {/* ========================================================================= */}
      {/* SECTION 5: MANAGE E-LIBRARY                                               */}
      {/* ========================================================================= */}
      {activeTab === 'elibrary' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Digital E-Books & Materials ({elibraryResources.length})
              </h2>
              <p className="text-xs text-slate-500">
                Manage digital resources and documents available for member download.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingEbook({
                  title: '',
                  author: 'TUMCU Ministry',
                  category: 'Theology',
                  description: '',
                  cover_image_url: '',
                  file_url: '',
                });
                setIsEbookModalOpen(true);
              }}
              variant="primary"
              size="sm"
              className="gap-1.5 bg-[#006633] text-white font-bold text-xs"
            >
              <Plus size={14} /> Add E-Book / Document
            </Button>
          </div>

          {loadingElibrary ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading digital resources...</div>
          ) : elibraryResources.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No E-Books published yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Upload and publish digital books, Bible study guides, and discipleship materials for students.
              </p>
            </div>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {elibraryResources.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#006633] border border-emerald-200">
                        {item.category || 'General'}
                      </span>
                      {item.file_url && (
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-[#006633] hover:underline flex items-center gap-1"
                        >
                          <Download size={11} /> File
                        </a>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500">By {item.author || 'TUMCU Ministry'}</p>
                    {item.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingEbook({ ...item });
                        setIsEbookModalOpen(true);
                      }}
                      className="text-xs font-semibold gap-1 text-slate-700"
                    >
                      <Edit2 size={12} /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to remove "${item.title}" from the E-Library?`)) {
                          deleteEbookMutation.mutate(item.id);
                        }
                      }}
                      className="text-xs font-semibold gap-1 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: LEND A PHYSICAL BOOK                                             */}
      {/* ========================================================================= */}
      {isLendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 my-8 space-y-5 animate-in fade-in">
            <button
              onClick={() => setIsLendModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-[#006633] mb-1">
                <BookOpen size={12} /> Direct Lending Register
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Lend a Physical Book
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Record who is taking a physical book and when they are required to return it.
              </p>
            </div>

            <form onSubmit={handleLendSubmit} className="space-y-4">
              {/* Step 1: Book Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Step 1: Book Title *
                </label>
                <Input
                  value={lendBookTitle}
                  onChange={(e) => setLendBookTitle(e.target.value)}
                  placeholder="e.g. Knowing God / Spiritual Leadership"
                  required
                  className="bg-white text-sm"
                />

                {/* Suggestions dropdown if previous titles match */}
                {titleSuggestions.length > 0 && !titleSuggestions.includes(lendBookTitle) && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      Previous Titles:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {titleSuggestions.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setLendBookTitle(t)}
                          className="rounded-lg bg-white border border-slate-200 px-2 py-0.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-[#006633] hover:border-emerald-300 transition"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Registered Borrower Search */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Step 2: Registered Borrower *
                </label>

                {selectedBorrower ? (
                  /* Confirmed Borrower Card */
                  <div className="rounded-2xl border border-emerald-300 bg-emerald-50/50 p-3.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                        <CheckCircle2 size={14} className="text-[#006633]" />
                        <span>{selectedBorrower.full_name}</span>
                        {selectedBorrower.admission_number && (
                          <span className="text-[10px] font-normal text-slate-500">
                            ({selectedBorrower.admission_number})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600">
                        {selectedBorrower.email} · {selectedBorrower.phone_number || 'No phone'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBorrower(null);
                        setBorrowerSearchQuery('');
                      }}
                      className="text-xs font-bold text-emerald-800 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <Input
                        value={borrowerSearchQuery}
                        onChange={(e) => setBorrowerSearchQuery(e.target.value)}
                        placeholder="Search member name, email or phone..."
                        className="pl-8 bg-white text-xs sm:text-sm"
                      />
                    </div>

                    {borrowerCandidates.length > 0 && (
                      <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 shadow-xs">
                        {borrowerCandidates.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setSelectedBorrower(m);
                              setBorrowerSearchQuery('');
                            }}
                            className="w-full text-left p-2.5 hover:bg-emerald-50 transition flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{m.full_name}</div>
                              <div className="text-[11px] text-slate-500">
                                {m.email} · {m.phone_number || 'No phone'}
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 3: Return Date & Quick Durations */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Step 3: Return Due Date *
                </label>

                {/* Quick Period Buttons */}
                <div className="flex items-center gap-2">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handleQuickDueDays(days)}
                      className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition border ${
                        lendDueDays === days
                          ? 'bg-[#006633] text-white border-[#006633]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>

                <Input
                  type="date"
                  value={lendDueDate}
                  onChange={(e) => {
                    setLendDueDate(e.target.value);
                    setLendDueDays(0);
                  }}
                  required
                  className="bg-white text-xs sm:text-sm"
                />
              </div>

              {/* Step 4: Notes (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Step 4: Optional Notes
                </label>
                <Input
                  value={lendNotes}
                  onChange={(e) => setLendNotes(e.target.value)}
                  placeholder="e.g. Borrowing for BEST group preparation"
                  className="bg-white text-xs sm:text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLendModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={lendMutation.isPending}
                  className="bg-[#006633] hover:bg-[#005229] text-white font-bold"
                >
                  {lendMutation.isPending ? 'Recording...' : 'Record Loan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIRM RETURN MODAL                                             */}
      {/* ========================================================================= */}
      {returnModalBorrowing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in">
            <button
              onClick={() => setReturnModalBorrowing(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-[#006633]">
                <RotateCcw size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Book Return</h3>
                <p className="text-xs text-slate-500">Record this loan as successfully returned.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2 text-xs text-slate-700">
              <div>
                <span className="text-slate-500 font-medium">Book: </span>
                <strong className="text-slate-900 text-sm font-bold block">
                  {returnModalBorrowing.book_title}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Borrower: </span>
                <strong className="text-slate-800">{returnModalBorrowing.borrower_name}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Due Date: </span>
                <span>{new Date(returnModalBorrowing.due_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReturnModalBorrowing(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={returnMutation.isPending}
                onClick={() => returnMutation.mutate(returnModalBorrowing.id)}
                className="bg-[#006633] hover:bg-[#005229] text-white font-bold"
              >
                {returnMutation.isPending ? 'Marking...' : 'Confirm Return'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: QUICK RECORD RETURN (SEARCH ACTIVE LOANS)                        */}
      {/* ========================================================================= */}
      {isQuickReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in">
            <button
              onClick={() => setIsQuickReturnModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900">Record a Return</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Search active loans by book title or borrower name to process a return.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                value={quickReturnSearch}
                onChange={(e) => setQuickReturnSearch(e.target.value)}
                placeholder="Search book or borrower name..."
                className="pl-8 bg-white text-xs sm:text-sm"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 divide-y divide-slate-100">
              {currentLoans
                .filter((b) => {
                  if (!quickReturnSearch.trim()) return true;
                  const q = quickReturnSearch.toLowerCase();
                  return (
                    b.book_title?.toLowerCase().includes(q) ||
                    b.borrower_name?.toLowerCase().includes(q) ||
                    b.borrower_phone?.includes(q)
                  );
                })
                .map((b) => (
                  <div
                    key={b.id}
                    className="pt-2 flex items-center justify-between text-xs hover:bg-slate-50/80 p-2 rounded-xl"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{b.book_title}</div>
                      <div className="text-[11px] text-slate-500">
                        {b.borrower_name} · Due {new Date(b.due_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setReturnModalBorrowing(b)}
                      className="bg-[#006633] text-white text-xs font-bold h-7"
                    >
                      Return
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: MANAGE E-BOOK MODAL                                              */}
      {/* ========================================================================= */}
      {isEbookModalOpen && editingEbook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 my-8 space-y-4 animate-in fade-in">
            <button
              onClick={() => {
                setIsEbookModalOpen(false);
                setEditingEbook(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingEbook.id ? 'Edit E-Book / Resource' : 'Add New E-Book / Document'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Publish a digital Christian resource for members to read or download.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveEbookMutation.mutate(editingEbook);
              }}
              className="space-y-3 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Book / Document Title *</label>
                <Input
                  value={editingEbook.title || ''}
                  onChange={(e) => setEditingEbook({ ...editingEbook, title: e.target.value })}
                  placeholder="e.g. Knowing God Study Guide"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Author</label>
                  <Input
                    value={editingEbook.author || ''}
                    onChange={(e) => setEditingEbook({ ...editingEbook, author: e.target.value })}
                    placeholder="e.g. J.I. Packer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category</label>
                  <select
                    value={editingEbook.category || 'Theology'}
                    onChange={(e) => setEditingEbook({ ...editingEbook, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="Theology">Theology</option>
                    <option value="Doctrine">Doctrine</option>
                    <option value="Christian Living">Christian Living</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Apologetics">Apologetics</option>
                    <option value="Governance & Constitution">Governance & Constitution</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Downloadable Document / PDF URL</label>
                <Input
                  value={editingEbook.file_url || ''}
                  onChange={(e) => setEditingEbook({ ...editingEbook, file_url: e.target.value })}
                  placeholder="https://... /uploads/resource.pdf"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Cover Image URL (Optional)</label>
                <Input
                  value={editingEbook.cover_image_url || ''}
                  onChange={(e) => setEditingEbook({ ...editingEbook, cover_image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Short Description</label>
                <textarea
                  rows={3}
                  value={editingEbook.description || ''}
                  onChange={(e) => setEditingEbook({ ...editingEbook, description: e.target.value })}
                  placeholder="Brief synopsis or purpose of this resource..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEbookModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saveEbookMutation.isPending}
                  className="bg-[#006633] text-white font-bold"
                >
                  {saveEbookMutation.isPending ? 'Saving...' : 'Save E-Book'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
