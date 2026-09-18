// src/App.jsx

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { AlertProvider } from "./context/AlertContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Public & Auth Pages
import Login from "./pages/Login";
import RegisterSchool from "./pages/RegisterSchool";

// Platform Admin Pages
import SchoolsManager from "./pages/admin/SchoolsManager";
import NewSchool from "./pages/admin/NewSchool";

// School Workspace Pages
import Dashboard from "./pages/Dashboard";
import MyClasses from "./pages/MyClasses";
import MarkEntryGrid from "./pages/MarkEntryGrid";
import AssessmentsList from "./pages/AssessmentsList";
import AssessmentBatchForm from "./pages/AssessmentBatchForm";
import AssessmentForm from "./pages/AssessmentForm";
import Grades from "./pages/Grades";
import Subjects from "./pages/Subjects";
import Students from "./pages/Students";
import Terms from "./pages/Terms";
import Teachers from "./pages/Teachers";
import Assignments from "./pages/Assignments";
import EditRequestsQueue from "./pages/EditRequestsQueue";
import Reports from "./pages/Reports";
import Staff from "./pages/Staff";
import Profile from "./pages/Profile";
import VerifyEmail from "./pages/VerifyEmail";
import StudentDetails from "./pages/StudentDetails";
import TeacherAnalytics from "./pages/TeacherAnalytics";

// Teacher Workspace Pages
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import ClassWorkspace from "./pages/teacher/ClassWorkspace";
import ClassStudents from "./pages/teacher/ClassStudents";
import TeacherStudentProfile from "./pages/teacher/TeacherStudentProfile";
import TeacherStudentInterventions from "./pages/teacher/TeacherStudentInterventions";
import TeacherSubjects from "./pages/teacher/TeacherSubjects";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherAssessments from "./pages/teacher/TeacherAssessments";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherMarkEntry from "./pages/teacher/TeacherMarkEntry";
import TeacherLessonPlans from "./pages/teacher/TeacherLessonPlans";
import TeacherSchemes from "./pages/teacher/TeacherSchemes";
import TeacherSchemeDetail from "./pages/teacher/TeacherSchemeDetail";
import TeacherPlanningCalendar from "./pages/teacher/TeacherPlanningCalendar";

function Home() {
  const {
    user,
    isAdmin,
    isSystemAdmin,
    isTeacherWorkspaceUser,
    activeTenant,
  } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // System admins landing page when not inspecting a school tenant
  if (isSystemAdmin && !activeTenant) {
    return <Navigate to="/admin/schools" replace />;
  }

  // Teacher Workspace users go directly to their workspace
  if (isTeacherWorkspaceUser) {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  // Existing admin/school routing
  return (
    <Navigate
      to={isAdmin ? "/dashboard" : "/my-classes"}
      replace
    />
  );
}

function withLayout(element, contentClassName = "") {
  return (
    <Layout contentClassName={contentClassName}>
      {element}
    </Layout>
  );
}

// System administrator routes
function systemAdmin(element) {
  return (
    <ProtectedRoute systemAdminOnly>
      {withLayout(element)}
    </ProtectedRoute>
  );
}

// Admin-level school routes
function admin(element) {
  return (
    <ProtectedRoute adminOnly>
      {withLayout(element)}
    </ProtectedRoute>
  );
}

// Existing authenticated-user routes
function anyUser(element) {
  return (
    <ProtectedRoute>
      {withLayout(element)}
    </ProtectedRoute>
  );
}

// Teacher Workspace routes
function teacherWorkspace(element) {
  return (
    <ProtectedRoute teacherWorkspaceOnly>
      {withLayout(
        element,
        "px-4 py-5 sm:px-6 lg:px-8"
      )}
    </ProtectedRoute>
  );
}

function analyticsWorkspace(element) {
  return (
    <ProtectedRoute analyticsOnly>
      {withLayout(
        element,
        "px-4 py-5 sm:px-6 lg:px-8"
      )}
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>

            {/* =====================================================
                PUBLIC ROUTES
            ===================================================== */}

            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register-school"
              element={<RegisterSchool />}
            />

            {/* =====================================================
                PLATFORM MANAGEMENT ROUTES
                System Admin only
            ===================================================== */}

            <Route
              path="/admin/schools"
              element={systemAdmin(<SchoolsManager />)}
            />

            <Route
              path="/admin/schools/new"
              element={systemAdmin(<NewSchool />)}
            />

            {/* =====================================================
                SCHOOL WORKSPACE ROUTES
            ===================================================== */}

            <Route
              path="/dashboard"
              element={admin(<Dashboard />)}
            />

            <Route
              path="/my-classes"
              element={anyUser(<MyClasses />)}
            />

            <Route
              path="/marks/:assessmentId"
              element={anyUser(<MarkEntryGrid />)}
            />

            <Route
              path="/teacher/mark-entry/:assessmentId"
              element={teacherWorkspace(<MarkEntryGrid />)}
            />

            <Route
              path="/teacher/analytics"
              element={analyticsWorkspace(<TeacherAnalytics />)}
            />

            <Route
              path="/teacher-analytics"
              element={anyUser(<TeacherAnalytics />)}
            />

            <Route
              path="/assessments"
              element={admin(<AssessmentsList />)}
            />

            <Route
              path="/assessments/new"
              element={admin(<AssessmentBatchForm />)}
            />

            <Route
              path="/assessments/:id/edit"
              element={anyUser(<AssessmentForm />)}
            />

            <Route
              path="/grades"
              element={admin(<Grades />)}
            />

            <Route
              path="/subjects"
              element={admin(<Subjects />)}
            />

            <Route
              path="/students"
              element={admin(<Students />)}
            />

            <Route
              path="/students/:id"
              element={admin(<StudentDetails />)}
            />

            <Route
              path="/terms"
              element={admin(<Terms />)}
            />

            <Route
              path="/teachers"
              element={admin(<Teachers />)}
            />

            <Route
              path="/assignments"
              element={admin(<Assignments />)}
            />

            <Route
              path="/edit-requests"
              element={admin(<EditRequestsQueue />)}
            />

            <Route
              path="/reports"
              element={admin(<Reports />)}
            />

            <Route
              path="/staff"
              element={admin(<Staff />)}
            />

            <Route
              path="/profile"
              element={anyUser(<Profile />)}
            />

            {/* =====================================================
                TEACHER WORKSPACE ROUTES
            ===================================================== */}

            <Route
              path="/teacher/dashboard"
              element={teacherWorkspace(<TeacherDashboard />)}
            />

            <Route
              path="/teacher/classes"
              element={teacherWorkspace(<TeacherClasses />)}
            />

            <Route
              path="/teacher/classes/:id"
              element={teacherWorkspace(<ClassWorkspace />)}
            />

            <Route path="/teacher/classes/:id/students"
              element={teacherWorkspace(<ClassStudents />)}
            />

            <Route path="/teacher/students/:id/interventions"
              element={teacherWorkspace(<TeacherStudentInterventions />)}
            />

            <Route
              path="/teacher/students"
              element={teacherWorkspace(<TeacherStudents />)}
            />

            <Route path="/teacher/students/:id"
              element={teacherWorkspace(<TeacherStudentProfile />)}
            />

            <Route path="/teacher/subjects"
              element={teacherWorkspace(<TeacherSubjects />)}
            />

            <Route path="/teacher/profile"
              element={teacherWorkspace(<TeacherProfile />)}
            />

            <Route path="/teacher/attendance"
              element={teacherWorkspace(<TeacherAttendance />)}
            />

            <Route path="/teacher/assessments"
              element={teacherWorkspace(<TeacherAssessments />)}
            />
            
            <Route
              path="/teacher/lesson-plans"
              element={teacherWorkspace(<TeacherLessonPlans />)}
            />
            
            <Route
              path="/teacher/schemes"
              element={teacherWorkspace(<TeacherSchemes />)}
            />

            <Route
              path="/teacher/calendar"
              element={teacherWorkspace(<TeacherPlanningCalendar />)}
            />

            <Route
              path="/teacher/schemes/:id"
              element={teacherWorkspace(<TeacherSchemeDetail />)}
            />

            <Route
              path="/teacher/mark-entry"
              element={teacherWorkspace(<TeacherMarkEntry />)}
            />

            {/* =====================================================
                AUTHENTICATION
            ===================================================== */}

            <Route
              path="/verify-email"
              element={<VerifyEmail />}
            />

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AlertProvider>
  );
}

