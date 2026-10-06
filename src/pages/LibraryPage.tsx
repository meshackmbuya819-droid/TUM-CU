import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Download,
  ExternalLink,
  Search,
  Bookmark,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Sparkles,
} from 'lucide-react';
import {
  fetchLibraryResources,
  fetchMyBorrowings,
  type LibraryResource,
  type LibraryBorrowing,
} from '@/features/library/library.api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

const CATEGORIES = [
  'All',
  'Theology',
  'Doctrine',
  'Christian Living',
  'Leadership',
  'Apologetics',
  'Governance & Constitution',
  'Discipleship',
  'Missions & Evangelism',
  'Prayer & Worship',
  'Bible Study & Hermeneutics',
];

export function LibraryPage() {
  const { user, isAuthenticated, hasRole, hasPermission } = useAuthStore();

  const isLibrarian =
    hasRole?.('librarian') ||
    hasRole?.('super_admin') ||
    user?.role === 'super_admin' ||
    hasPermission?.('library.manage_inventory') ||
    hasPermission?.('library.checkout');

  const [activeTab, setActiveTab] = useState<'elibrary' | 'my-borrowings'>('elibrary');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // E-Library resources query
  const {
    data: resources = [],
    isLoading: loadingResources,
  } = useQuery<LibraryResource[]>({
    queryKey: ['library-resources', selectedCategory, search],
    queryFn: () =>
      fetchLibraryResources({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search,
      }),
  });

  // Member's personal borrowings query
  const {
    data: myBorrowings = [],
    isLoading: loadingMyBorrowings,
  } = useQuery<LibraryBorrowing[]>({
    queryKey: ['my-borrowings'],
    queryFn: fetchMyBorrowings,
    enabled: isAuthenticated,
  });

  const activeLoans = myBorrowings.filter((b) => b.status !== 'returned');
  const returnedLoans = myBorrowings.filter((b) => b.status === 'returned');

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Hero / Header */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#006633] border border-emerald-200/80 mb-2">
                <BookOpen size={14} />
                <span>Christian Union Resource Centre</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Library
              </h1>
              <p className="text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
                Explore Christian resources and keep track of books you have borrowed from the physical library.
              </p>
            </div>

            {/* Librarian / Super Admin Portal Action */}
            {isLibrarian && (
              <div className="shrink-0">
                <Link to="/dashboard/librarian">
                  <Button
                    variant="primary"
                    className="gap-2 bg-[#006633] hover:bg-[#005229] text-white shadow-xs font-bold text-xs sm:text-sm py-2.5 px-4"
                  >
                    <ShieldCheck size={16} />
                    <span>Librarian Portal</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Primary View Switcher: E-LIBRARY & MY BORROWED BOOKS */}
          <div className="flex items-center gap-3 mt-8 border-b border-slate-100">
            <button
              onClick={() => setActiveTab('elibrary')}
              className={`inline-flex items-center gap-2 pb-3 px-1 border-b-2 font-bold text-sm transition ${
                activeTab === 'elibrary'
                  ? 'border-[#006633] text-[#006633]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText size={16} />
              <span>E-Library</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-semibold">
                {resources.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('my-borrowings')}
              className={`inline-flex items-center gap-2 pb-3 px-1 border-b-2 font-bold text-sm transition ${
                activeTab === 'my-borrowings'
                  ? 'border-[#006633] text-[#006633]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Bookmark size={16} />
              <span>My Borrowed Books</span>
              {isAuthenticated && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    activeLoans.length > 0
                      ? 'bg-amber-100 text-amber-900 font-bold'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {activeLoans.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ========================================================================= */}
        {/* TAB 1: E-LIBRARY (Browse and Download Digital Books & Documents)           */}
        {/* ========================================================================= */}
        {activeTab === 'elibrary' && (
          <div className="space-y-6">
            {/* Search & Category Filter Section */}
            <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white/90 p-4 sm:p-5 shadow-2xs backdrop-blur-xs">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search books, authors, doctrine..."
                    className="pl-9 pr-8 bg-slate-50/70 text-xs sm:text-sm border-slate-200/90 shadow-2xs focus:bg-white transition"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-xs"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-500">
                  <span className="font-medium">
                    Showing <strong className="text-slate-800 font-bold">{resources.length}</strong> {resources.length === 1 ? 'e-book' : 'e-books'}
                  </span>
                  {(selectedCategory !== 'All' || search) && (
                    <button
                      onClick={() => {
                        setSelectedCategory('All');
                        setSearch('');
                      }}
                      className="text-emerald-700 hover:text-emerald-800 font-bold underline transition"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>

              {/* Responsive Category Grid/Chips: Ensures every category is 100% visible on mobile, tablet, and desktop with zero clipping */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-emerald-600" />
                    Browse by Category
                  </span>
                  {selectedCategory !== 'All' && (
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                      Active: {selectedCategory}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`inline-flex items-center justify-center rounded-xl px-3.5 py-2 text-xs font-bold leading-normal transition text-left cursor-pointer ${
                          isSelected
                            ? 'bg-[#006633] text-white shadow-xs ring-2 ring-emerald-600/30'
                            : 'bg-slate-50/80 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <span className="break-words">{cat}</span>
                        {isSelected && (
                          <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-200" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Resources List */}
            {loadingResources ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                <div className="animate-spin inline-block h-6 w-6 border-2 border-[#006633] border-t-transparent rounded-full mb-2" />
                <p>Loading Christian resources...</p>
              </div>
            ) : resources.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-base font-bold text-slate-800">No resources found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {search
                    ? `No materials matched "${search}". Try searching with another term.`
                    : 'No e-books or digital materials have been published in this category yet.'}
                </p>
                {search && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearch('')}
                    className="mt-4 text-xs font-semibold"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {resources.map((item) => {
                  const cover =
                    item.cover_image_url ||
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';

                  return (
                    <div
                      key={item.id}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white shadow-2xs hover:shadow-md transition duration-200 overflow-hidden"
                    >
                      {/* Cover Photo */}
                      <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                        <img
                          src={cover}
                          alt={item.title}
                          className="h-full w-full object-cover object-center group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        <span className="absolute bottom-2.5 left-3 text-[11px] font-bold text-emerald-300 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10">
                          {item.category || 'General'}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5 font-medium line-clamp-1">
                            By {item.author || 'TUMCU Ministry'}
                          </p>
                          {item.description && (
                            <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Action: Read / Download */}
                        <div className="pt-2 border-t border-slate-100">
                          {item.file_url ? (
                            <a
                              href={item.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-[#006633] text-[#006633] hover:text-white border border-emerald-200 px-3 py-2 text-xs font-bold transition shadow-2xs"
                            >
                              <Download size={14} />
                              <span>Read / Download</span>
                            </a>
                          ) : (
                            <div className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-slate-500 px-3 py-2 text-xs font-semibold">
                              <span>Digital Reading Guide</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MY BORROWED BOOKS (Member's Physical Book Lending Status)           */}
        {/* ========================================================================= */}
        {activeTab === 'my-borrowings' && (
          <div className="space-y-6">
            {!isAuthenticated ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center max-w-lg mx-auto shadow-xs">
                <User className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-base font-bold text-slate-800">Member Sign-In Required</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sign in with your registered TUMCU student account to view the physical books you have borrowed from the Christian Union library.
                </p>
                <div className="mt-5">
                  <Link to="/login">
                    <Button variant="primary" className="bg-[#006633] text-white text-xs font-bold px-6">
                      Sign In to Account
                    </Button>
                  </Link>
                </div>
              </div>
            ) : loadingMyBorrowings ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                <div className="animate-spin inline-block h-6 w-6 border-2 border-[#006633] border-t-transparent rounded-full mb-2" />
                <p>Loading your borrowing records...</p>
              </div>
            ) : myBorrowings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center max-w-xl mx-auto">
                <Bookmark className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Borrowed Books Found</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  You have not borrowed any physical books from the Christian Union library yet. Visit the CU desk or physical library during fellowship hours to borrow books!
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => setActiveTab('elibrary')}
                    className="text-xs font-bold text-[#006633] hover:underline"
                  >
                    Browse E-Library materials &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Active & Overdue Borrowings */}
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                    Active Physical Loans ({activeLoans.length})
                  </h2>

                  {activeLoans.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center text-xs text-slate-500">
                      You currently have no active physical book loans. All borrowed books have been returned.
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {activeLoans.map((item) => {
                        const isOverdue = item.status === 'overdue' || item.is_overdue;
                        const daysOverdue = item.days_overdue || 1;
                        const daysRemaining = item.days_remaining ?? 0;

                        return (
                          <div
                            key={item.id}
                            className={`rounded-2xl border bg-white p-5 shadow-2xs flex flex-col justify-between ${
                              isOverdue
                                ? 'border-rose-300 bg-rose-50/20'
                                : 'border-emerald-200/80'
                            }`}
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    isOverdue
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                      : daysRemaining <= 3
                                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                      : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                  }`}
                                >
                                  {isOverdue
                                    ? `Overdue (${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'})`
                                    : daysRemaining === 0
                                    ? 'Due Today'
                                    : `Due in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`}
                                </span>

                                <span className="text-[11px] font-semibold text-slate-400">
                                  Physical Book
                                </span>
                              </div>

                              <h3 className="font-bold text-slate-900 text-base leading-snug">
                                {item.book_title}
                              </h3>

                              <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                                <div className="flex items-center gap-2">
                                  <Calendar size={13} className="text-slate-400 shrink-0" />
                                  <span>
                                    Borrowed:{' '}
                                    <strong className="text-slate-700">
                                      {new Date(item.borrowed_at).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </strong>
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock size={13} className="text-slate-400 shrink-0" />
                                  <span>
                                    Return By:{' '}
                                    <strong className={isOverdue ? 'text-rose-700' : 'text-slate-700'}>
                                      {new Date(item.due_at).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </strong>
                                  </span>
                                </div>
                                {item.notes && (
                                  <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                                    "{item.notes}"
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                              <span>Please return to the CU Librarian</span>
                              {isOverdue && (
                                <span className="text-rose-600 font-bold flex items-center gap-1">
                                  <AlertCircle size={12} /> Overdue
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Returned Borrowings History */}
                {returnedLoans.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                      Previous Returned Books ({returnedLoans.length})
                    </h2>
                    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                            <tr>
                              <th className="py-3 px-4">Book Title</th>
                              <th className="py-3 px-4">Borrowed Date</th>
                              <th className="py-3 px-4">Returned Date</th>
                              <th className="py-3 px-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {returnedLoans.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/50">
                                <td className="py-3 px-4 font-bold text-slate-900">
                                  {item.book_title}
                                </td>
                                <td className="py-3 px-4 text-slate-500">
                                  {new Date(item.borrowed_at).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4 text-slate-500">
                                  {item.returned_at
                                    ? new Date(item.returned_at).toLocaleDateString()
                                    : 'Returned'}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 size={11} className="text-emerald-600" />
                                    Returned
                                  </span>
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
