import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const TEACHER_WORKSPACE_ROLES = [
  "teacher",
  "headteacher",
  "deputy",
  "dos",
];

const ANALYTICS_ROLES = [
  "teacher",
  "admin",
  "headteacher",
  "deputy",
  "dos",
];

export default function ProtectedRoute({
  adminOnly = false,
  systemAdminOnly = false,
  teacherWorkspaceOnly = false,
  analyticsOnly = false,
  children,
}) {
  const {
    user,
    isAdmin,
    isSystemAdmin,
    activeTenant,
    loading,
  } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (systemAdminOnly && !isSystemAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!systemAdminOnly && isSystemAdmin && !activeTenant) {
    return <Navigate to="/admin/schools" replace />;
  }

  if (
    teacherWorkspaceOnly &&
    !TEACHER_WORKSPACE_ROLES.includes(user.role)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  if (
    analyticsOnly &&
    !ANALYTICS_ROLES.includes(user.role)
  ) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (adminOnly && !isAdmin && !isSystemAdmin) {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}