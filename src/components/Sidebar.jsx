import {
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Users,
  ClipboardCheck,
  PenLine,
  ClipboardList,
  CalendarDays,
  Library,
  BarChart3,
  FileText,
  Bell,
  UserCircle,
  Megaphone,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import { playNotificationSound } from "../utils/notificationSound";

const linkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? "bg-slate-100 text-slate-900 font-semibold"
      : "text-slate-600 hover:bg-slate-50"
  }`;

const ROLE_LABELS = {
  admin: "ICT Admin",
  headteacher: "Headteacher",
  deputy: "Deputy Headteacher",
  dos: "Director of Studies",
  teacher: "Teacher",
};

const TEACHER_WORKSPACE_ROLES = [
  "teacher",
  "headteacher",
  "deputy",
  "dos",
];

const teacherNavItems = [
  {
    label: "Dashboard",
    path: "/teacher/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Classes",
    path: "/teacher/classes",
    icon: GraduationCap,
  },
  {
    label: "My Subjects",
    path: "/teacher/subjects",
    icon: BookOpen,
  },
  {
    label: "Students",
    path: "/teacher/students",
    icon: Users,
  },
  {
    label: "Assessments",
    path: "/teacher/assessments",
    icon: ClipboardCheck,
  },
  {
    label: "Mark Entry",
    path: "/teacher/mark-entry",
    icon: PenLine,
  },
  {
    label: "Attendance",
    path: "/teacher/attendance",
    icon: ClipboardList,
  },
  {
    label: "Lesson Plans",
    path: "/teacher/lesson-plans",
    icon: CalendarDays,
  },
  {
    label: "Calendar",
    path: "/teacher/calendar",
    icon: CalendarDays,
  },
  {
    label: "Timetable",
    path: "/teacher/timetable",
    icon: CalendarDays,
  },
  {
    label: "Schemes of Work",
    path: "/teacher/schemes",
    icon: BookOpen,
  },
  {
    label: "Resources",
    path: "/teacher/resources",
    icon: Library,
  },
  {
    label: "Assignments",
    path: "/teacher/assignments",
    icon: ClipboardList,
  },
  {
    label: "Analytics",
    path: "/teacher/analytics",
    icon: BarChart3,
  },
  {
    label: "Reports",
    path: "/teacher/reports",
    icon: FileText,
  },
  {
    label: "My Profile",
    path: "/teacher/profile",
    icon: UserCircle,
  },
];

export default function Sidebar({ open, onClose }) {
  const {
    user,
    school,
    logout,
    isAdmin,
    isSystemAdmin,
    activeTenant,
  } = useAuth();

  const location = useLocation();

  const [unreadNotifications, setUnreadNotifications] =
    useState(0);
  const previousUnreadNotifications = useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadUnreadNotifications = async (playSound = true) => {
      try {
        const response = await client.get("/notifications/unread_count");

        if (!mounted) {
          return;
        }

        const nextCount = response.data?.unread_count || 0;
        const previousCount = previousUnreadNotifications.current;

        setUnreadNotifications(nextCount);

        // Do not play sound on the initial load.
        if (
          playSound &&
          previousCount !== null &&
          nextCount > previousCount
        ) {
          playNotificationSound();
        }

        previousUnreadNotifications.current = nextCount;
      } catch (error) {
        console.error(
          "Failed to load notification count:",
          error
        );
      }
    };

    // Initial load — silent.
    loadUnreadNotifications(false);

    const handleNotificationsUpdated = () => {
      loadUnreadNotifications(false);
    };

    window.addEventListener(
      "schoolmarks:notifications-updated",
      handleNotificationsUpdated
    );

    // Check for new notifications every 15 seconds.
    const interval = window.setInterval(() => {
      loadUnreadNotifications(true);
    }, 15000);

    return () => {
      mounted = false;
      window.clearInterval(interval);

      window.removeEventListener(
        "schoolmarks:notifications-updated",
        handleNotificationsUpdated
      );
    };
  }, [user?.id, school?.id]);
  /*
   * Platform-level navigation
   *
   * A system admin without an active tenant sees the
   * platform administration navigation.
   */
  const isPlatformView =
    isSystemAdmin && !activeTenant;

  /*
   * Teacher Workspace users:
   * teacher, headteacher, deputy and DOS.
   */
  const isTeacherWorkspaceUser =
    TEACHER_WORKSPACE_ROLES.includes(user?.role);

  /*
   * Determine workspace from the URL.
   *
   * This allows headteachers, deputies and DOS users to
   * move between the normal admin area and Teacher Workspace.
   */
  const isTeacherWorkspace =
    isTeacherWorkspaceUser &&
    location.pathname.startsWith("/teacher");

  /*
   * Display role label.
   */
  const roleDisplay = isPlatformView
    ? "Platform Admin"
    : ROLE_LABELS[user?.role] || user?.role;

  /*
   * School logo.
   */
  const schoolLogo =
    school?.logo_url || school?.logo;

  /*
   * Teacher notification navigation item.
   *
   * Notifications are available to every authenticated
   * user, including teachers.
   */
  const teacherNotificationsItem = (
    <NavLink
      to="/notifications"
      onClick={onClose}
      className={({ isActive }) => `
        flex items-center justify-between gap-3
        rounded-md px-3 py-2.5
        text-sm font-medium
        transition-colors
        ${
          isActive
            ? "bg-blue-50 text-blue-700 font-semibold"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }
      `}
    >
      <span className="flex items-center gap-3">
        <Bell size={18} />

        <span>Notifications</span>
      </span>

      {unreadNotifications > 0 && (
        <span className="min-w-[22px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[11px] font-bold text-white">
          {unreadNotifications > 99
            ? "99+"
            : unreadNotifications}
        </span>
      )}
    </NavLink>
  );

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-64
        bg-white border-r border-slate-200
        p-4 flex flex-col
        transform transition-transform duration-200 ease-in-out
        md:static md:z-auto md:w-56 md:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {schoolLogo ? (
            <img
              src={schoolLogo}
              alt={school?.name || "School Logo"}
              className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{
                backgroundColor:
                  "var(--color-navy, #0f172a)",
              }}
            >
              {school?.name?.[0]?.toUpperCase() ||
                (isPlatformView ? "P" : "S")}
            </div>
          )}

          <div className="min-w-0">
            <h1
              className="text-sm font-semibold leading-tight"
              style={{
                color: "var(--color-navy)",
              }}
            >
              Steelo Analytics
            </h1>

            <p className="text-xs text-slate-500 truncate">
              {school?.name ||
                (isPlatformView
                  ? "Global Platform"
                  : "School Portal")}
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

      {/* =====================================================
          USER INFO
      ===================================================== */}

      <p className="text-xs text-slate-400 mb-4 truncate">
        {user?.name} · {roleDisplay}
      </p>

      {/* =====================================================
          MAIN NAVIGATION
      ===================================================== */}

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {isPlatformView ? (
          /*
           * ===================================================
           * SYSTEM ADMIN PLATFORM NAVIGATION
           * ===================================================
           */
          <>
            <div className="pt-1 pb-1 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Platform Admin
            </div>

            <NavLink
              to="/admin/schools"
              className={linkClass}
              onClick={onClose}
            >
              🏫 Schools Directory
            </NavLink>

            <NavLink
              to="/admin/schools/new"
              className={linkClass}
              onClick={onClose}
            >
              ➕ Onboard New School
            </NavLink>
          </>
        ) : isTeacherWorkspace ? (
          /*
           * ===================================================
           * TEACHER WORKSPACE NAVIGATION
           * ===================================================
           */
          <>
            <div className="pt-1 pb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Teacher Workspace
            </div>

            {teacherNavItems.map((item) => {
              const Icon = item.icon;

              const active =
                location.pathname === item.path ||
                location.pathname.startsWith(
                  `${item.path}/`
                );

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3
                    rounded-md px-3 py-2.5
                    text-sm font-medium
                    transition-colors
                    ${
                      active
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.2 : 1.8}
                  />

                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            {/* Notifications are available to all teachers */}
            {teacherNotificationsItem}
          </>
        ) : (
          /*
           * ===================================================
           * EXISTING SCHOOL / ADMIN NAVIGATION
           * ===================================================
           */
          <>
            {/* -----------------------------------------------
                System Admin tenant return
            ------------------------------------------------ */}
            {isSystemAdmin && activeTenant && (
              <NavLink
                to="/admin/schools"
                className="
                  block px-3 py-2 mb-2
                  rounded-md text-xs font-semibold
                  bg-amber-50 text-amber-800
                  border border-amber-200
                  hover:bg-amber-100
                "
                onClick={onClose}
              >
                ← Back to Schools Directory
              </NavLink>
            )}

            {/* -----------------------------------------------
                Main navigation
            ------------------------------------------------ */}
            {isAdmin && (
              <NavLink
                to="/dashboard"
                className={linkClass}
                onClick={onClose}
              >
                Dashboard
              </NavLink>
            )}

            <NavLink
              to="/teacher/analytics"
              className={linkClass}
              onClick={onClose}
            >
              Analytics
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/assessments"
                className={linkClass}
                onClick={onClose}
              >
                Assessments
              </NavLink>
            )}

            {isAdmin && (
              <NavLink
                to="/reports"
                className={linkClass}
                onClick={onClose}
              >
                Reports
              </NavLink>
            )}

            {isAdmin && (
              <NavLink
                to="/edit-requests"
                className={linkClass}
                onClick={onClose}
              >
                Edit Requests
              </NavLink>
            )}

            {!isAdmin && (
              <NavLink
                to="/my-classes"
                className={linkClass}
                onClick={onClose}
              >
                My Classes
              </NavLink>
            )}

            {/* -----------------------------------------------
                COMMUNICATION
            ------------------------------------------------ */}
            {isAdmin && (
              <>
                <div className="pt-4 pb-1 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Communication
                </div>

                <NavLink
                  to="/announcements"
                  className={({ isActive }) =>
                    `
                      flex items-center gap-3
                      px-3 py-2.5
                      rounded-md
                      text-sm font-medium
                      transition-colors
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                    `
                  }
                  onClick={onClose}
                >
                  <Megaphone size={18} />

                  <span>Announcements</span>
                </NavLink>

                <NavLink
                  to="/notifications"
                  className={({ isActive }) =>
                    `
                      flex items-center justify-between gap-3
                      px-3 py-2.5
                      rounded-md
                      text-sm font-medium
                      transition-colors
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                    `
                  }
                  onClick={onClose}
                >
                  <span className="flex items-center gap-3">
                    <Bell size={18} />

                    <span>Notifications</span>
                  </span>

                  {unreadNotifications > 0 && (
                    <span className="min-w-[22px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[11px] font-bold text-white">
                      {unreadNotifications > 99
                        ? "99+"
                        : unreadNotifications}
                    </span>
                  )}
                </NavLink>
              </>
            )}

            {/* -----------------------------------------------
                SETUP
            ------------------------------------------------ */}
            {isAdmin && (
              <>
                <div className="pt-4 pb-1 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Setup
                </div>

                <NavLink
                  to="/grades"
                  className={linkClass}
                  onClick={onClose}
                >
                  Grades
                </NavLink>

                <NavLink
                  to="/timetable"
                  className={linkClass}
                  onClick={onClose}
                >
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <span>Timetable</span>
                  </span>
                </NavLink>

                <NavLink
                  to="/subjects"
                  className={linkClass}
                  onClick={onClose}
                >
                  Subjects
                </NavLink>

                <NavLink
                  to="/students"
                  className={linkClass}
                  onClick={onClose}
                >
                  Students
                </NavLink>

                <NavLink
                  to="/terms"
                  className={linkClass}
                  onClick={onClose}
                >
                  Terms
                </NavLink>

                <NavLink
                  to="/teachers"
                  className={linkClass}
                  onClick={onClose}
                >
                  Teachers
                </NavLink>

                <NavLink
                  to="/assignments"
                  className={linkClass}
                  onClick={onClose}
                >
                  Assignments
                </NavLink>

                <NavLink
                  to="/staff"
                  className={linkClass}
                  onClick={onClose}
                >
                  Staff
                </NavLink>
              </>
            )}
          </>
        )}
      </nav>

      {/* =====================================================
          FOOTER NAVIGATION
      ===================================================== */}

      <div className="space-y-1 pt-2 border-t border-slate-100">
        {/* Profile */}
        {isTeacherWorkspace ? (
          <NavLink
            to="/teacher/profile"
            className={linkClass}
            onClick={onClose}
          >
            My Profile
          </NavLink>
        ) : (
          <NavLink
            to="/profile"
            className={linkClass}
            onClick={onClose}
          >
            My Profile
          </NavLink>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="
            w-full text-sm text-left
            px-3 py-2 rounded-md
            text-slate-500
            hover:bg-slate-50
          "
        >
          Log out
        </button>
      </div>
    </aside>
  );
}