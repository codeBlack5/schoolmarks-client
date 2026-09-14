import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Users,
  BookOpen,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import client from "../../api/client";

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadClasses() {
    try {
      setLoading(true);
      setError("");

      const { data } = await client.get("/teacher/dashboard");

      setClasses(data.classes || []);
    } catch (err) {
      console.error("Failed to load teacher classes:", err);

      setError(
        err.response?.data?.error ||
          "Unable to load your classes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClasses();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="text-gray-600">
            Loading your classes...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle
            className="mt-0.5 text-red-600"
            size={22}
          />

          <div className="flex-1">
            <h2 className="font-semibold text-red-800">
              Unable to load classes
            </h2>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

            <button
              onClick={loadClasses}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <p className="text-sm font-medium text-blue-600">
          Teacher Workspace
        </p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
          My Classes
        </h1>

        <p className="mt-2 text-gray-600">
          Manage your classes, students, assessments and
          academic progress from one workspace.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">

        <SummaryCard
          icon={<GraduationCap size={22} />}
          label="My Classes"
          value={classes.length}
        />

        <SummaryCard
          icon={<Users size={22} />}
          label="Total Students"
          value={classes.reduce(
            (total, grade) =>
              total + (grade.students_count || 0),
            0
          )}
        />

        <SummaryCard
          icon={<BookOpen size={22} />}
          label="Teaching Classes"
          value={classes.length}
        />

      </div>

      {/* Classes */}
      {classes.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <GraduationCap
            className="mx-auto text-gray-400"
            size={42}
          />

          <h2 className="mt-4 font-semibold text-gray-900">
            No classes assigned
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            You will see a class here when you are assigned as
            its class teacher or assigned to teach a subject
            in the class.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((grade) => (
            <ClassCard
              key={grade.id}
              grade={grade}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClassCard({ grade }) {
  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between gap-4">

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <GraduationCap size={22} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              {grade.name}
            </h2>

            <p className="text-sm text-gray-500">
              Level {grade.level}
            </p>
          </div>
        </div>

      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">

        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">
            Students
          </p>

          <p className="mt-1 text-lg font-bold text-gray-900">
            {grade.students_count || 0}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">
            Class Teacher
          </p>

          <p className="mt-1 truncate text-sm font-medium text-gray-800">
            {grade.class_teacher?.name || "Not assigned"}
          </p>
        </div>

      </div>

      <Link
        to={`/teacher/classes/${grade.id}`}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        Open Class Workspace
        <ArrowRight size={17} />
      </Link>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
          {icon}
        </div>
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