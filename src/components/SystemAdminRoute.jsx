// src/components/SystemAdminRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SystemAdminRoute() {
  const { user, isSystemAdmin, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading auth state...</div>;
  }

  // Redirect to login if unauthenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to main dashboard if authenticated but NOT a System Admin
  if (!isSystemAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render child routes if authorized
  return <Outlet />;
}