// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  adminOnly = false,
  systemAdminOnly = false,
  children,
}) {
  const { user, isAdmin, isSystemAdmin, activeTenant, loading } = useAuth();

  if (loading) return null;

  // 1. Unauthenticated users -> /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Non-system admins trying to access System Admin routes -> /dashboard
  if (systemAdminOnly && !isSystemAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. System Admin trying to access school pages WITHOUT an active tenant -> /admin/schools
  if (!systemAdminOnly && isSystemAdmin && !activeTenant) {
    return <Navigate to="/admin/schools" replace />;
  }

  // 4. Regular users without admin access trying to view admin pages -> /my-classes
  if (adminOnly && !isAdmin && !isSystemAdmin) {
    return <Navigate to="/my-classes" replace />;
  }

  return children ? children : <Outlet />;
}