import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

/** Route guard: redirects to the dashboard overview if the user lacks the given permission. */
export function RequirePermission({ permission }: { permission: string }) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  if (!hasPermission(permission)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/** Route guard: redirects unless the user holds at least one of the permissions. */
export function RequireAnyPermission({ permissions }: { permissions: string[] }) {
  const hasAnyPermission = useAuthStore((s) => permissions.some((permission) => s.hasPermission(permission)));
  if (!hasAnyPermission) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/**
 * The technical Admin Center is intentionally restricted to the Super Admin
 * role. Other leaders receive their own scoped portals and must never be able
 * to reach the Admin Center by typing its URL directly.
 */
export function RequireSuperAdmin() {
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin());
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}


/**
 * Dedicated leader portals must not be reachable by every authenticated member.
 * Access is granted only when the active session contains an assigned role or
 * one of the explicit permissions for that portal. The backend must enforce
 * the same permissions on every data-changing/read API.
 */
export function RequireRoleOrPermission({
  roles,
  permissions,
}: {
  roles: string[];
  permissions: string[];
}) {
  const hasRole = useAuthStore((s) => s.hasRole);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const allowed = roles.some((role) => hasRole(role)) || permissions.some((permission) => hasPermission(permission));
  if (!allowed) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
