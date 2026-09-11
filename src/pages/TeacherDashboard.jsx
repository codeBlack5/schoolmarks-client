import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  AlertCircle,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function TeacherDashboard() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const { data } = await client.get("/teacher/dashboard");

        setDashboard(data);
      } catch (err) {
        console.error("Failed to load teacher dashboard:", err);

        setError(
          err.response?.data?.error ||
            "Unable to load your teacher dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      loadDashboard();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 text-red-600" size={22} />

          <div>
            <h2 className="font-semibold text-red-800">
              Unable to load teacher workspace
            </h2>

            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const summary = dashboard?.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-blue-600">
          Teacher Workspace
        </p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
          Good morning, {dashboard?.teacher?.name || user?.name}
        </h1>

        <p className="mt-2 text-gray-600">
          Here is an overview of your classes, subjects and pending work.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          icon={<GraduationCap size={22} />}
          label="My Classes"
          value={summary.classes_count || 0}
        />

        <SummaryCard
          icon={<BookOpen size={22} />}
          label="My Subjects"
          value={summary.subjects_count || 0}
        />

        <SummaryCard
          icon={<Users size={22} />}
          label="My Students"
          value={summary.students_count || 0}
        />

        <SummaryCard
          icon={<ClipboardCheck size={22} />}
          label="Pending Marking"
          value={summary.pending_marking_count || 0}
          warning={summary.pending_marking_count > 0}
        />
      </div>

      {/* Classes */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h2 className="font-semibold text-gray-900">My Classes</h2>
            <p className="text-sm text-gray-500">
              Classes where you are a class teacher or teach a subject
            </p>
          </div>

          <Link
            to="/teacher/classes"
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {dashboard?.classes?.length ? (
            dashboard.classes.map((grade) => (
              <div
                key={grade.id}
                className="flex items-center justify-between p-5"
              >
                <div>
                  <h3 className="font-medium text-gray-900">
                    {grade.name}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {grade.students_count} students
                  </p>

                  {grade.class_teacher && (
                    <p className="mt-1 text-xs text-gray-400">
                      Class teacher: {grade.class_teacher.name}
                    </p>
                  )}
                </div>

                <Link
                  to={`/teacher/classes/${grade.id}`}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Open
                </Link>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-gray-500">
              No classes have been assigned to you yet.
            </div>
          )}
        </div>
      </section>

      {/* Subjects */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900">My Subjects</h2>
          <p className="text-sm text-gray-500">
            Subjects currently assigned to you
          </p>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {dashboard?.subjects?.length ? (
            dashboard.subjects.map((subject) => (
              <div
                key={subject.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                    <BookOpen size={18} />
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900">
                      {subject.name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {subject.grade?.name}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-4 text-center text-sm text-gray-500">
              No subjects have been assigned to you yet.
            </div>
          )}
        </div>
      </section>

      {/* Pending marking */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h2 className="font-semibold text-gray-900">
              Pending Marking
            </h2>

            <p className="text-sm text-gray-500">
              Assessments that still have students without marks
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {dashboard?.pending_marking?.length ? (
            dashboard.pending_marking.map((assessment) => (
              <div
                key={assessment.id}
                className="flex items-center justify-between gap-4 p-5"
              >
                <div>
                  <h3 className="font-medium text-gray-900">
                    {assessment.name}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {assessment.subject} · {assessment.grade}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {assessment.marked_count} /{" "}
                    {assessment.students_count} students marked
                  </p>
                </div>

                <Link
                  to={`/marks/${assessment.id}`}
                  className="whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Continue marking
                </Link>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <ClipboardCheck
                className="mx-auto text-green-500"
                size={30}
              />

              <p className="mt-2 font-medium text-gray-700">
                You're all caught up!
              </p>

              <p className="mt-1 text-sm text-gray-500">
                There are no pending assessments to mark.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ icon, label, value, warning = false }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
          {icon}
        </div>

        {warning && (
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
        )}
      </div>

      <p className="mt-4 text-sm text-gray-500">{label}</p>

      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}