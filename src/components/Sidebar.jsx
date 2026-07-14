import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
  }`;

export default function Sidebar({ open, onClose }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-4 flex flex-col
        transform transition-transform duration-200 ease-in-out
        md:static md:z-auto md:w-56 md:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--color-navy)" }}>
            Steelo Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">{user?.name} · {user?.role}</p>
        </div>
        <button onClick={onClose} className="md:hidden text-slate-400 text-xl leading-none px-1" aria-label="Close menu">
          &times;
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {isAdmin && <NavLink to="/dashboard" className={linkClass} onClick={onClose}>Dashboard</NavLink>}
        {isAdmin && <NavLink to="/assessments" className={linkClass} onClick={onClose}>Assessments</NavLink>}
        {!isAdmin && <NavLink to="/my-classes" className={linkClass} onClick={onClose}>My Classes</NavLink>}
        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Setup</div>
            <NavLink to="/grades" className={linkClass} onClick={onClose}>Grades</NavLink>
            <NavLink to="/subjects" className={linkClass} onClick={onClose}>Subjects</NavLink>
            <NavLink to="/students" className={linkClass} onClick={onClose}>Students</NavLink>
            <NavLink to="/terms" className={linkClass} onClick={onClose}>Terms</NavLink>
            <NavLink to="/teachers" className={linkClass} onClick={onClose}>Teachers</NavLink>
            <NavLink to="/assignments" className={linkClass} onClick={onClose}>Assignments</NavLink>
            <NavLink to="/edit-requests" className={linkClass} onClick={onClose}>Edit Requests</NavLink>
            <NavLink to="/reports" className={linkClass} onClick={onClose}>Reports</NavLink>
          </>
        )}
      </nav>

      <button
        onClick={logout}
        className="text-sm text-left px-3 py-2 rounded-md text-slate-500 hover:bg-slate-50"
      >
        Log out
      </button>
    </aside>
  );
}
