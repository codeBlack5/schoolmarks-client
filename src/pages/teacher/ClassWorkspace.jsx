import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Users,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

import client from "../../api/client";

export default function ClassWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadWorkspace() {
    try {
      setLoading(true);
      setError("");

      const { data } = await client.get(
        `/teacher/classes/${id}`
      );

      setWorkspace(data);
    } catch (err) {
      console.error(
        "Failed to load class workspace:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable to load this class."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="text-gray-600">
            Loading class workspace...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/teacher/classes")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={17} />
          Back to My Classes
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="text-red-600"
              size={22}
            />

            <div>
              <h2 className="font-semibold text-red-800">
                Unable to load class
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const classInfo = workspace.class;
  const students = workspace.students || [];
  const subjects = workspace.subjects || [];
  const assessments = workspace.assessments || [];

  const completedAssessments = assessments.filter(
    (assessment) => assessment.marking_complete
  ).length;

  const pendingAssessments =
    assessments.length - completedAssessments;

  return (
    <div className="space-y-6">

      {/* Back */}
      <button
        onClick={() => navigate("/teacher/classes")}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={17} />
        Back to My Classes
      </button>

      {/* Class Header */}
      <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <p className="text-sm font-medium text-blue-300">
              Class Workspace
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              {classInfo.name}
            </h1>

            <p className="mt-2 text-sm text-slate-300">
              Level {classInfo.level}
              {" · "}
              {classInfo.students_count} students
            </p>

            {classInfo.class_teacher && (
              <p className="mt-1 text-sm text-slate-400">
                Class teacher:{" "}
                {classInfo.class_teacher.name}
              </p>
            )}
          </div>

          <Link
            to={`/teacher/classes/${id}/students`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            <Users size={17} />
            View Students
          </Link>

        </div>
      </section>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        <StatCard
          icon={<Users size={21} />}
          label="Students"
          value={students.length}
        />

        <StatCard
          icon={<BookOpen size={21} />}
          label="Subjects"
          value={subjects.length}
        />

        <StatCard
          icon={<CheckCircle2 size={21} />}
          label="Completed Assessments"
          value={completedAssessments}
        />

        <StatCard
          icon={<Clock3 size={21} />}
          label="Pending Marking"
          value={pendingAssessments}
          warning={pendingAssessments > 0}
        />

      </div>

      {/* Main Workspace */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* Students */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm xl:col-span-2">

          <SectionHeader
            icon={<Users size={20} />}
            title="Students"
            description="Students currently enrolled in this class"
            action={
              <Link
                to={`/teacher/classes/${id}/students`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all
              </Link>
            }
          />

          <div className="divide-y divide-gray-100">
            {students.slice(0, 8).map((student) => (
              <Link
                key={student.id}
                to={`/teacher/students/${student.id}`}
                className="flex items-center justify-between gap-4 p-4 transition hover:bg-gray-50"
              >
                <div className="flex min-w-0 items-center gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                    {student.name?.charAt(0)?.toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {student.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      Admission No:{" "}
                      {student.admission_number || "—"}
                    </p>
                  </div>
                </div>

                <ChevronRight
                  size={17}
                  className="shrink-0 text-gray-400"
                />
              </Link>
            ))}

            {students.length === 0 && (
              <EmptyState message="No students found in this class." />
            )}
          </div>

        </section>

        {/* Subjects */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

          <SectionHeader
            icon={<BookOpen size={20} />}
            title="Subjects"
            description="Subjects taught in this class"
          />

          <div className="space-y-3 p-5">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="rounded-lg border border-gray-200 p-3"
              >
                <p className="font-medium text-gray-900">
                  {subject.name}
                </p>

                {subject.teachers?.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {subject.teachers
                      .map((teacher) => teacher.name)
                      .join(", ")}
                  </p>
                )}
              </div>
            ))}

            {subjects.length === 0 && (
              <EmptyState message="No subjects found." />
            )}
          </div>

        </section>

      </div>

      {/* Assessments */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

        <SectionHeader
          icon={<ClipboardCheck size={20} />}
          title="Assessments"
          description="Assessment and marking progress for this class"
        />

        <div className="divide-y divide-gray-100">

          {assessments.length > 0 ? (
            assessments.slice(0, 10).map((assessment) => (
              <AssessmentRow
                key={assessment.id}
                assessment={assessment}
              />
            ))
          ) : (
            <EmptyState message="No assessments found for this class." />
          )}

        </div>

      </section>

      {/* Coming Workspace Areas */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <WorkspaceLink
          icon={<Users size={20} />}
          title="Students"
          description="Class roster and student profiles"
          to={`/teacher/classes/${id}/students`}
        />

        <WorkspaceLink
          icon={<ClipboardCheck size={20} />}
          title="Assessments"
          description="Assess and mark this class"
          to={`/teacher/assessments?grade_id=${id}`}
        />

        <WorkspaceLink
          icon={<BarChart3 size={20} />}
          title="Performance"
          description="Understand class performance"
          to={`/teacher/analytics?grade_id=${id}`}
        />

        <WorkspaceLink
          icon={<Clock3 size={20} />}
          title="Attendance"
          description="Track class attendance"
          to={`/teacher/attendance?grade_id=${id}`}
        />

      </section>

    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  warning = false,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
          {icon}
        </div>

        {warning && (
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
        )}
      </div>

      <p className="mt-4 text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
  action,
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 p-5">

      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          {icon}
        </div>

        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900">
            {title}
          </h2>

          <p className="mt-0.5 text-xs text-gray-500">
            {description}
          </p>
        </div>
      </div>

      {action}
    </div>
  );
}

function AssessmentRow({ assessment }) {
  const complete = assessment.marking_complete;

  const processed =
    assessment.marking?.processed ??
    assessment.marked_count ??
    0;

  const scored =
    assessment.marking?.scored ??
    0;

  const absent =
    assessment.marking?.absent ??
    0;

  const incomplete =
    assessment.marking?.incomplete ??
    0;

  const percentage =
    assessment.marking?.processing_percentage ??
    (assessment.students_count > 0
      ? Math.round(
          (processed / assessment.students_count) * 100
        )
      : 0);

  return (
    <div className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-medium text-gray-900">
            {assessment.name}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {assessment.subject?.name}
            {" · "}
            {assessment.term?.name}
          </p>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            complete
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700"
          }`}
        >
          {complete ? (
            <CheckCircle2 size={14} />
          ) : (
            <Clock3 size={14} />
          )}

          {complete ? "Complete" : "Pending"}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>
            {processed} / {assessment.students_count} processed
          </span>

          <span>{percentage}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>
          <strong className="text-gray-700">{scored}</strong> scored
        </span>

        <span>
          <strong className="text-gray-700">{absent}</strong> absent
        </span>

        <span>
          <strong className="text-gray-700">{incomplete}</strong> incomplete
        </span>
      </div>

      <div className="mt-4">
        <Link
          to={`/marks/${assessment.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {complete
            ? "Review marks"
            : "Continue marking"}

          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function WorkspaceLink({
  icon,
  title,
  description,
  to,
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="mb-4 w-fit rounded-lg bg-blue-50 p-2.5 text-blue-600">
        {icon}
      </div>

      <h3 className="font-semibold text-gray-900">
        {title}
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>

      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600">
        Open
        <ChevronRight size={16} />
      </div>
    </Link>
  );
}

function EmptyState({ message }) {
  return (
    <div className="p-8 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}