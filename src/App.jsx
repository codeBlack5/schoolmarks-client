// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

function Home() {
  const { user, isAdmin, isSystemAdmin, activeTenant } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // System admins landing page (when not inspecting a specific school tenant)
  if (isSystemAdmin && !activeTenant) {
    return <Navigate to="/admin/schools" replace />;
  }

  return <Navigate to={isAdmin ? "/dashboard" : "/my-classes"} replace />;
}

function withLayout(element) {
  return <Layout>{element}</Layout>;
}

function systemAdmin(element) {
  return <ProtectedRoute systemAdminOnly>{withLayout(element)}</ProtectedRoute>;
}

function admin(element) {
  return <ProtectedRoute adminOnly>{withLayout(element)}</ProtectedRoute>;
}

function anyUser(element) {
  return <ProtectedRoute>{withLayout(element)}</ProtectedRoute>;
}

export default function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register-school" element={<RegisterSchool />} />

            {/* Platform Management Routes (System Admin) */}
            <Route path="/admin/schools" element={systemAdmin(<SchoolsManager />)} />
            <Route path="/admin/schools/new" element={systemAdmin(<NewSchool />)} />

            {/* School Workspace Routes */}
            <Route path="/dashboard" element={admin(<Dashboard />)} />
            <Route path="/my-classes" element={anyUser(<MyClasses />)} />
            <Route path="/marks/:assessmentId" element={anyUser(<MarkEntryGrid />)} />
            <Route path="/assessments" element={admin(<AssessmentsList />)} />
            <Route path="/assessments/new" element={admin(<AssessmentBatchForm />)} />
            <Route path="/assessments/:id/edit" element={anyUser(<AssessmentForm />)} />
            <Route path="/grades" element={admin(<Grades />)} />
            <Route path="/subjects" element={admin(<Subjects />)} />
            <Route path="/students" element={admin(<Students />)} />
            <Route path="/terms" element={admin(<Terms />)} />
            <Route path="/teachers" element={admin(<Teachers />)} />
            <Route path="/assignments" element={admin(<Assignments />)} />
            <Route path="/edit-requests" element={admin(<EditRequestsQueue />)} />
            <Route path="/reports" element={admin(<Reports />)} />
            <Route path="/staff" element={admin(<Staff />)} />
            <Route path="/profile" element={anyUser(<Profile />)} />
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AlertProvider>
  );
}