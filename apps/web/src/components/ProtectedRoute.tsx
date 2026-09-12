import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '@sih/shared-types';
import { useAuthStore } from '../store/authStore.js';

export function ProtectedRoute({ allow }: { allow?: UserRole[] }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    if (location.pathname.startsWith('/industry')) {
      return <Navigate to="/login?role=industry" state={{ from: location.pathname }} replace />;
    }
    if (location.pathname.startsWith('/university') || location.pathname === '/student') {
      return <Navigate to="/login?role=university" state={{ from: location.pathname }} replace />;
    }
    if (location.pathname.startsWith('/government')) {
      return <Navigate to="/login?role=government" state={{ from: location.pathname }} replace />;
    }
    if (location.pathname === '/submit') {
      return <Navigate to="/login?role=citizen&for=submit" state={{ from: location.pathname }} replace />;
    }
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allow && !allow.includes(user.role)) {
    const isIndustry = location.pathname.startsWith('/industry');
    const isUniv = location.pathname.startsWith('/university') || location.pathname === '/student';
    const isGov = location.pathname.startsWith('/government');
    const targetRole = isIndustry ? 'industry' : isUniv ? 'university' : isGov ? 'government' : allow[0];
    const targetUrl = isIndustry ? '/login?role=industry' : isUniv ? '/login?role=university' : isGov ? '/login?role=government' : '/login';
    return (
      <Navigate
        to={targetUrl}
        state={{
          from: location.pathname,
          requiredRole: targetRole,
          message: isIndustry
            ? `This portal requires an Industry / CSR account. You are currently logged in as ${user.full_name} (${user.role}). Please sign in with an industry account.`
            : isGov
            ? `This portal requires a Government account. You are currently logged in as ${user.full_name} (${user.role}). Please sign in with a government account.`
            : `This portal requires a ${allow.join('/')} account. You are currently logged in as ${user.full_name} (${user.role}). Please sign in with a correct account.`,
        }}
        replace
      />
    );
  }

  return <Outlet />;
}
