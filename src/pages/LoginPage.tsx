import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Home, Sparkles, AlertCircle, Lock, Mail, CheckCircle2, Shield } from 'lucide-react';
import { Button } from '@/components/Button';
import { fetchCurrentSession, login } from '@/features/auth/auth.api';
import { useAuthStore } from '@/store/auth.store';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sessionExpired = searchParams.get('session') === 'expired';
  const justRegistered = Boolean((location.state as { justRegistered?: boolean } | null)?.justRegistered);
  const requestedRedirect = searchParams.get('redirect') || (location.state as any)?.from?.pathname;
  const redirectPath =
    requestedRedirect && !['/personal-information', '/constitution', '/dashboard/constitution'].includes(requestedRedirect)
      ? requestedRedirect
      : '/dashboard';
  const setSession = useAuthStore((s) => s.setSession);
  const setPermissions = useAuthStore((s) => s.setPermissions);
  const setRoles = useAuthStore((s) => s.setRoles);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async (result) => {
      setSession(result.accessToken, result.refreshToken, result.user as never);

      try {
        const session = await fetchCurrentSession();
        setPermissions((session.permissions as string[]) ?? []);
        setRoles((session.roles as Parameters<typeof setRoles>[0]) ?? []);
      } catch {
        // Non-fatal session permissions sync
      }

      const liveRoles = (useAuthStore.getState().roles || []).map((r) => r.code);
      const roleDestination =
        liveRoles.includes('noret_chairperson') || liveRoles.includes('soret_chairperson')
          ? '/dashboard/e-teams'
          : liveRoles.some((r) => r === 'ministry_leader' || r === 'ministry_secretary' || r === 'ministry_treasurer')
            ? '/dashboard/ministry-portal'
            : '/dashboard';

      // Never restore a stale declaration/constitution redirect after login.
      const safeRedirect =
        requestedRedirect &&
        !['/personal-information', '/constitution', '/dashboard/constitution'].includes(requestedRedirect)
          ? requestedRedirect
          : roleDestination;

      navigate(safeRedirect, { replace: true });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid credentials. Please verify your email, admission number, or password.';
      setError(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Please provide your login identifier and password.');
      return;
    }
    mutation.mutate({ identifier: identifier.trim(), password });
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 sm:px-6 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/auth-background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark translucent overlay with subtle gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.48) 0%, rgba(2, 26, 14, 0.58) 50%, rgba(0, 0, 0, 0.65) 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Navigation & Branding bar */}
        <div className="mb-5 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/30 px-3.5 py-1.5 text-xs font-semibold text-white/90 shadow-md backdrop-blur-md hover:bg-white/20 hover:text-white transition active:scale-95"
          >
            <ArrowLeft size={14} />
            <Home size={14} className="text-emerald-300" />
            <span>Back to Home</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-950/40 px-3 py-1 text-[11px] font-semibold text-emerald-200 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>TUMCU Portal</span>
          </div>
        </div>

        {/* Glassmorphism Auth Card */}
        <div
          className="w-full rounded-3xl p-7 sm:p-9 shadow-2xl transition-all"
          style={{
            background: 'rgba(255, 255, 255, 0.14)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-white/15">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gold-300">
                Member Access
              </span>
              <h1 className="mt-0.5 text-2xl font-black tracking-tight text-white">Welcome Back</h1>
              <p className="mt-1 text-xs text-slate-200">
                Sign in to your Christian Union management portal
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-gold-300 shadow-inner">
              <Sparkles size={20} />
            </div>
          </div>

          {sessionExpired && (
            <div className="mt-5 rounded-2xl border border-amber-300/40 bg-amber-950/60 p-3.5 text-xs text-amber-200 backdrop-blur-sm">
              Your session has expired. Please sign in below to continue.
            </div>
          )}

          {requestedRedirect === '/leaders' && !sessionExpired && (
  <div className="mt-5 rounded-2xl border border-emerald-400/40 bg-emerald-950/70 p-3.5 text-xs text-emerald-200 backdrop-blur-sm flex items-center gap-2.5">
    <Shield size={16} className="text-gold-300 shrink-0" />
    <span>Please sign in with your TUMCU account to view the Leaders Directory.</span>
  </div>
)}
          {justRegistered && (
            <div className="mt-5 rounded-2xl border border-emerald-300/40 bg-emerald-950/60 p-3.5 text-xs text-emerald-200 flex items-start gap-2 backdrop-blur-sm">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Registration received successfully! Once approved by the executive committee, your account will be active for sign in.
              </span>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-2xl border border-rose-400/40 bg-rose-950/60 p-3.5 text-xs font-medium text-rose-200 flex items-start gap-2.5 backdrop-blur-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-300" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="mt-6 flex flex-col gap-4.5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-100">
                Email, Admission Number, or Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-300">
                  <Mail size={16} />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="TUM admission / registration number or university email"
                  required
                  className="w-full rounded-xl border border-white/30 bg-black/35 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-300 shadow-inner backdrop-blur-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/30 transition"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-100">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-300">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-xl border border-white/30 bg-black/35 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-300 shadow-inner backdrop-blur-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/30 transition"
                />
              </div>
            </div>

            <Button
              type="submit"
              loading={mutation.isPending}
              className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-primary-700 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 border border-emerald-400/30 active:scale-[0.99] transition"
            >
              Sign In to Portal
            </Button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-white/15 text-center text-xs text-slate-200">
            <span>Don't have an account yet? </span>
            <Link
              to="/register"
              className="font-bold text-gold-300 hover:text-gold-200 underline decoration-gold-400/50 underline-offset-2 transition"
            >
              Register for Membership
            </Link>
          </div>
        </div>

        {/* Security badge footer */}
        <p className="mt-5 text-center text-[11px] text-white/70 flex items-center justify-center gap-1.5">
          <span>Technical University of Mombasa Christian Union</span>
          <span>•</span>
          <span>Official Portal</span>
        </p>
      </div>
    </div>
  );
}
