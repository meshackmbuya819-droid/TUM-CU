import { useEffect, useState, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  ArrowUpRight,
  ArrowLeft,
  Home,
  Calendar,
  ChevronDown,
  BookOpen,
  Sparkles,
  Image,
  FileText,
  Smartphone,
  Mail,
  Shield,
  Church,
  Info,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import tumcuLogo from '@/assets/tumcu-logo.png';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { ThemeToggle } from '@/components/ThemeToggle';

// 5 Core primary links for ultra-sleek, non-crowded desktop navigation
const primaryNav = [
  { to: '/', label: 'Home' },
  { to: '/events', label: 'Events', isEvent: true },
  { to: '/leaders', label: 'Leaders' },
  { to: '/ministries', label: 'Ministries' },
  { to: '/about', label: 'About' },
];

// Secondary exploration links nested neatly inside sleek 'More' menu
const moreLinks = [
  { to: '/library', label: 'E-Library & Books', icon: BookOpen, desc: 'Digital books & study materials' },
  { to: '/e-teams', label: 'Evangelism Teams', icon: Sparkles, desc: 'Grassroots missions & fellowships' },
  { to: '/gallery', label: 'Media Gallery', icon: Image, desc: 'Fellowship & service photos' },
  { to: '/constitution', label: 'Constitution 2024', icon: FileText, desc: 'Official governance bylaws' },
  { to: '/download', label: 'Download App', icon: Smartphone, desc: 'Install PWA for mobile & desktop' },
  { to: '/contact', label: 'Contact Leadership', icon: Mail, desc: 'Inquiries & prayer requests' },
];

export function PublicLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    setMoreDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Handle outside click for More dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isEventsPath = location.pathname.startsWith('/events');
  const isLeadersPath = location.pathname.startsWith('/leaders');
  const isMinistriesPath = location.pathname.startsWith('/ministries');
  const isAboutPath = location.pathname === '/about';
  const isHomePath = location.pathname === '/';
  const isMoreActive = moreLinks.some((l) => location.pathname === l.to);

  return (
    <div className="min-h-screen">
      {/* Top Banner (Micro Announcement) */}
      <div className="hidden bg-primary-950 text-white/80 md:block border-b border-primary-900/60">
        <div className="page-shell flex items-center justify-between py-1.5 text-[11px] tracking-wide">
          <span className="font-medium text-slate-300">Technical University of Mombasa Christian Union</span>
          <span className="text-gold-400 font-semibold">Reaching every student • Equipping every believer</span>
        </div>
      </div>

      {/* Sleek Floating Header */}
      <header className="sticky top-2 z-50 mx-2 sm:mx-4 lg:mx-8">
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-slate-200/80 bg-white/90 px-3.5 py-2 shadow-xs backdrop-blur-xl transition-all dark:border-slate-800 dark:bg-slate-900/90 sm:px-5">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-2.5 transition active:scale-95 group">
            <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-white shadow-xs ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 transition group-hover:scale-105">
              <img src={tumcuLogo} alt="TUMCU Christian Union seal" className="h-8 w-8 object-contain" />
            </div>
            <div className="leading-none">
              <span className="block text-sm font-black tracking-tight text-primary-950 dark:text-emerald-400">
                TUMCU
              </span>
              <span className="block text-[9px] font-bold uppercase tracking-[.18em] text-slate-500 dark:text-slate-400 mt-0.5">
                Christian Union
              </span>
            </div>
          </Link>

          {/* Streamlined Desktop Navigation Bar (5 core links + More) */}
          <div className="hidden items-center gap-1 lg:flex">
            {/* 1. Home */}
            <Link
              to="/"
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                isHomePath
                  ? 'bg-slate-900 text-white shadow-xs dark:bg-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              Home
            </Link>

            {/* 2. Events Button — Visually Active, Prominent & Interactive */}
            <Link
              to="/events"
              className={`relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black transition-all duration-200 shadow-xs active:scale-95 ${
                isEventsPath
                  ? 'bg-emerald-800 text-white shadow-md shadow-emerald-950/20 ring-2 ring-emerald-500/50 dark:bg-emerald-600'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-300/80 hover:bg-emerald-100 hover:border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800'
              }`}
              title="View live campus calendar & upcoming gatherings"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Calendar size={13} className={isEventsPath ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'} />
              <span>Events</span>
              <span
                className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                  isEventsPath
                    ? 'bg-emerald-900/60 text-emerald-200'
                    : 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                }`}
              >
                Active
              </span>
            </Link>

            {/* 3. Leaders */}
            <Link
              to="/leaders"
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                isLeadersPath
                  ? 'bg-slate-900 text-white shadow-xs dark:bg-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <span>Leaders</span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                Exec & Ministries
              </span>
            </Link>

            {/* 4. Ministries */}
            <Link
              to="/ministries"
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                isMinistriesPath
                  ? 'bg-slate-900 text-white shadow-xs dark:bg-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              Ministries
            </Link>

            {/* 5. About */}
            <Link
              to="/about"
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                isAboutPath
                  ? 'bg-slate-900 text-white shadow-xs dark:bg-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              About
            </Link>

            {/* 6. Sleek 'More' Dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreDropdownOpen((prev) => !prev)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 ${
                  isMoreActive || moreDropdownOpen
                    ? 'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
                aria-expanded={moreDropdownOpen}
              >
                <span>More</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 text-slate-400 ${
                    moreDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {moreDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1.5">
                    Union Resources & Fellowship
                  </div>
                  {moreLinks.map((item) => {
                    const isItemActive = location.pathname === item.to;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMoreDropdownOpen(false)}
                        className={`flex items-start gap-2.5 rounded-xl px-3 py-2 text-xs transition ${
                          isItemActive
                            ? 'bg-emerald-50 text-emerald-900 font-bold dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon size={14} className="mt-0.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-bold leading-tight">{item.label}</div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{item.desc}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Action Utility Buttons */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <PWAInstallButton variant="pill" className="hidden sm:inline-flex" />

            <div className="hidden items-center gap-1.5 sm:flex">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800 hover:bg-emerald-900 px-4 py-2 text-xs font-black text-white shadow-xs transition dark:bg-emerald-700 dark:hover:bg-emerald-600 active:scale-95"
                >
                  <span>Dashboard</span>
                  <ArrowUpRight size={13} />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-full px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 hover:bg-slate-100 transition dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-full bg-gold-500 hover:bg-gold-400 px-4 py-2 text-xs font-black text-slate-950 shadow-xs transition active:scale-95"
                  >
                    Join TUMCU
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-200 lg:hidden"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {/* Sleek Mobile Navigation Drawer */}
        <div
          className={`mx-auto mt-2 max-w-7xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-2xl backdrop-blur-xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/95 lg:hidden ${
            menuOpen ? 'max-h-[600px] p-4 opacity-100' : 'max-h-0 border-transparent p-0 opacity-0'
          }`}
        >
          {/* Prominent Active Events Link in Mobile Menu */}
          <Link
            to="/events"
            onClick={() => setMenuOpen(false)}
            className={`flex items-center justify-between rounded-2xl p-3.5 mb-3 transition border ${
              isEventsPath
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Calendar size={16} />
              <div className="text-left">
                <span className="font-black text-xs block leading-tight">Campus Events Calendar</span>
                <span className="text-[10px] opacity-80 block">Upcoming services, fellowships & keshas</span>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-white">
              Active
            </span>
          </Link>

          {/* Primary Mobile Links */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {[
              { to: '/', label: 'Home', icon: Home },
              { to: '/leaders', label: 'Leaders', icon: Shield },
              { to: '/ministries', label: 'Ministries', icon: Church },
              { to: '/about', label: 'About', icon: Info },
            ].map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold transition ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-emerald-700'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={14} className="text-emerald-600 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Secondary Mobile Links */}
          <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-2 mb-1">
              Resources & Fellowship
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {moreLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl p-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Icon size={13} className="text-slate-400" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile Auth Actions */}
          <div className="mt-4 border-t border-slate-200/70 pt-3 dark:border-slate-800">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="block rounded-2xl bg-emerald-800 px-4 py-2.5 text-center text-xs font-black text-white shadow-xs dark:bg-emerald-700"
              >
                Go to Member Dashboard
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-center text-xs font-bold text-slate-800 dark:text-emerald-400"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl bg-gold-500 px-4 py-2.5 text-center text-xs font-black text-slate-950 shadow-xs"
                >
                  Join TUMCU
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        {location.pathname !== '/' && (
          <div className="page-shell pt-4 pb-1">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs backdrop-blur-md hover:bg-white hover:text-primary-900 transition active:scale-95"
            >
              <ArrowLeft size={14} />
              <Home size={14} className="text-primary-700" />
              <span>Back to Home</span>
            </Link>
          </div>
        )}
        <Outlet />
      </main>

      <footer className="relative overflow-hidden bg-primary-900 text-white">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="page-shell section-pad relative grid gap-10 md:grid-cols-[1.3fr_.7fr_.7fr]">
          <div>
            <div className="flex items-center gap-3">
              <img src={tumcuLogo} alt="TUMCU logo" className="h-12 w-12 rounded-full bg-white/90 p-1" />
              <div>
                <div className="font-black tracking-wide">TUMCU</div>
                <div className="text-xs text-white/60">Christian Union</div>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/65">
              A Christ-centred university community committed to prayer, the Word, fellowship, service and mission.
            </p>
          </div>
          <div>
            <h3 className="font-bold">Explore</h3>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              <Link className="block hover:text-gold-400" to="/about">
                About TUMCU
              </Link>
              <Link className="block hover:text-gold-400" to="/leaders">
                Leadership Directory
              </Link>
              <Link className="block hover:text-gold-400" to="/ministries">
                Ministries
              </Link>
              <Link className="block hover:text-gold-400" to="/constitution">
                TUMCU Constitution 2024
              </Link>
              <Link className="block hover:text-gold-400" to="/resources">
                Sermons & Resources
              </Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold">Connect</h3>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              <Link className="block hover:text-gold-400" to="/register">
                Become a Member
              </Link>
              <Link className="block hover:text-gold-400" to="/elections">
                Leadership & Nominations
              </Link>
              <Link className="block hover:text-gold-400" to="/events">
                See Upcoming Events
              </Link>
              <Link className="block hover:text-gold-400" to="/contact">
                Contact the Union
              </Link>
              <a
                href="mailto:tumchristianunion@gmail.com"
                className="block text-gold-400 hover:text-gold-300 font-medium transition"
              >
                tumchristianunion@gmail.com
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="page-shell py-5 text-xs text-white/45">
            © {new Date().getFullYear()} Technical University of Mombasa Christian Union. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
