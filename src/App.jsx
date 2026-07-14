import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MyClasses from "./pages/MyClasses";
import MarkEntryGrid from "./pages/MarkEntryGrid";
import AssessmentsList from "./pages/AssessmentsList";
import AssessmentForm from "./pages/AssessmentForm";
import Grades from "./pages/Grades";
import Subjects from "./pages/Subjects";
import Students from "./pages/Students";
import Terms from "./pages/Terms";
import Teachers from "./pages/Teachers";
import Assignments from "./pages/Assignments";
import EditRequestsQueue from "./pages/EditRequestsQueue";
import Reports from "./pages/Reports";

function Home() {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? "/dashboard" : "/my-classes"} replace />;
}

function withLayout(element) {
  return <Layout>{element}</Layout>;
}

function admin(element) {
  return <ProtectedRoute adminOnly>{withLayout(element)}</ProtectedRoute>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={admin(<Dashboard />)} />
          <Route path="/my-classes" element={<ProtectedRoute>{withLayout(<MyClasses />)}</ProtectedRoute>} />
          <Route path="/marks/:assessmentId" element={<ProtectedRoute>{withLayout(<MarkEntryGrid />)}</ProtectedRoute>} />
          <Route path="/assessments" element={admin(<AssessmentsList />)} />
          <Route path="/assessments/new" element={admin(<AssessmentForm />)} />
          <Route path="/assessments/:id/edit" element={admin(<AssessmentForm />)} />
          <Route path="/grades" element={admin(<Grades />)} />
          <Route path="/subjects" element={admin(<Subjects />)} />
          <Route path="/students" element={admin(<Students />)} />
          <Route path="/terms" element={admin(<Terms />)} />
          <Route path="/teachers" element={admin(<Teachers />)} />
          <Route path="/assignments" element={admin(<Assignments />)} />
          <Route path="/edit-requests" element={admin(<EditRequestsQueue />)} />
          <Route path="/reports" element={admin(<Reports />)} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
