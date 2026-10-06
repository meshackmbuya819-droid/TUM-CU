import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthRole {
  role_id?: string;
  code: string;
  name: string;
  category: string;
  scope_type: string;
  scope_id: string | null;
}

interface AuthUser {
  full_name: string;
  email: string;
  account_status: string;
  [key: string]: unknown;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  permissions: string[];
  roles: AuthRole[];
  isAuthenticated: boolean;
  isSuperAdmin: () => boolean;
  setSession: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setPermissions: (permissions: string[]) => void;
  setRoles: (roles: AuthRole[]) => void;
  hasPermission: (code: string) => boolean;
  hasRole: (roleCode: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      permissions: [],
      roles: [],
      isAuthenticated: false,
      isSuperAdmin: () => {
        const state = get();
        if (!state.isAuthenticated || !state.accessToken || !state.user) return false;
        const role = String(state.user?.role || '').toLowerCase().trim();
        if (role === 'super_admin') return true;

        return state.roles.some((r) => r.code === 'super_admin');
      },
      setSession: (accessToken, _refreshToken, user) =>
        set({ accessToken, refreshToken: null, user, permissions: [], roles: [], isAuthenticated: true }),
      setUser: (user) => set({ user }),
      setTokens: (accessToken, _refreshToken) => set({ accessToken, refreshToken: null }),
      setPermissions: (permissions) => set({ permissions }),
      setRoles: (roles) => set({ roles }),
      hasPermission: (code) => {
        const state = get();
        if (!state.isAuthenticated || !state.accessToken) return false;
        if (state.isSuperAdmin()) return true;
        return state.permissions.includes(code);
      },
      hasRole: (roleCode: string) => {
        const state = get();
        if (!state.isAuthenticated || !state.user) return false;
        if (state.isSuperAdmin()) return true;
        const target = (roleCode || '').toLowerCase().trim();
        const userRole = String(state.user?.role || '').toLowerCase().trim();
        if (userRole === target) return true;
        return (state.roles || []).some(
          (r) => (r.code || '').toLowerCase().trim() === target || (r.role_id || '').toLowerCase().trim() === target
        );
      },
      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null, permissions: [], roles: [], isAuthenticated: false }),
    }),
    { name: 'tecump-auth' }
  )
);
