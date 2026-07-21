// src/components/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600 hover:bg-slate-50"
  }`;

const ROLE_LABELS = {
  admin: "ICT Admin",
  headteacher: "Headteacher",
  deputy: "Deputy Headteacher",
  dos: "Director of Studies",
  teacher: "Teacher",
};

export default function Sidebar({ open, onClose }) {
  const { user, school, logout, isAdmin, isSystemAdmin, activeTenant } = useAuth();

  // Show platform-level links if user is a System Admin not actively inspecting a specific school
  const isPlatformView = isSystemAdmin && !activeTenant;

  // Display role label appropriately
  const roleDisplay = isPlatformView
    ? "Platform Admin"
    : ROLE_LABELS[user?.role] || user?.role;

  // Determine logo URL if available
  const schoolLogo = school?.logo_url || school?.logo;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-4 flex flex-col
        transform transition-transform duration-200 ease-in-out
        md:static md:z-auto md:w-56 md:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {/* School Logo or Fallback Avatar */}
          {schoolLogo ? (
            <img
              src={schoolLogo}
              alt={school?.name || "School Logo"}
              className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: "var(--color-navy, #0f172a)" }}
            >
              {school?.name?.[0]?.toUpperCase() || (isPlatformView ? "P" : "S")}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-sm font-semibold leading-tight" style={{ color: "var(--color-navy)" }}>
              Steelo Analytics
            </h1>
            <p className="text-xs text-slate-500 truncate">
              {school?.name || (isPlatformView ? "Global Platform" : "School Portal")}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="md:hidden text-slate-400 text-xl leading-none px-1 shrink-0"
          aria-label="Close menu"
        >
          &times;
        </button>
      </div>

      {/* User Info */}
      <p className="text-xs text-slate-400 mb-4 truncate">
        {user?.name} · {roleDisplay}
      </p>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {isPlatformView ? (
          /* --- System Admin Platform Links --- */
          <>
            <div className="pt-1 pb-1 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Platform Admin
            </div>
            <NavLink to="/admin/schools" className={linkClass} onClick={onClose}>
              🏫 Schools Directory
            </NavLink>
            <NavLink to="/admin/schools/new" className={linkClass} onClick={onClose}>
              ➕ Onboard New School
            </NavLink>
          </>
        ) : (
          /* --- School Workspace Links --- */
          <>
            {/* Quick return button when System Admin is inspecting a tenant */}
            {isSystemAdmin && activeTenant && (
              <NavLink
                to="/admin/schools"
                className="block px-3 py-2 mb-2 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                onClick={onClose}
              >
                ← Back to Schools Directory
              </NavLink>
            )}

            {isAdmin && <NavLink to="/dashboard" className={linkClass} onClick={onClose}>Dashboard</NavLink>}
            {isAdmin && <NavLink to="/assessments" className={linkClass} onClick={onClose}>Assessments</NavLink>}
            {isAdmin && <NavLink to="/reports" className={linkClass} onClick={onClose}>Reports</NavLink>}
            {isAdmin && <NavLink to="/edit-requests" className={linkClass} onClick={onClose}>Edit Requests</NavLink>}
            {!isAdmin && <NavLink to="/my-classes" className={linkClass} onClick={onClose}>My Classes</NavLink>}

            {isAdmin && (
              <>
                <div className="pt-3 pb-1 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Setup
                </div>
                <NavLink to="/grades" className={linkClass} onClick={onClose}>Grades</NavLink>
                <NavLink to="/subjects" className={linkClass} onClick={onClose}>Subjects</NavLink>
                <NavLink to="/students" className={linkClass} onClick={onClose}>Students</NavLink>
                <NavLink to="/terms" className={linkClass} onClick={onClose}>Terms</NavLink>
                <NavLink to="/teachers" className={linkClass} onClick={onClose}>Teachers</NavLink>
                <NavLink to="/assignments" className={linkClass} onClick={onClose}>Assignments</NavLink>
                <NavLink to="/staff" className={linkClass} onClick={onClose}>Staff</NavLink>
              </>
            )}
          </>
        )}
      </nav>

      {/* Footer Navigation */}
      <div className="space-y-1 pt-2 border-t border-slate-100">
        <NavLink to="/profile" className={linkClass} onClick={onClose}>My Profile</NavLink>
        <button
          onClick={logout}
          className="w-full text-sm text-left px-3 py-2 rounded-md text-slate-500 hover:bg-slate-50"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}