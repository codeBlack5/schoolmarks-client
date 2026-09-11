import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  GraduationCap,
  Users,
  ChevronRight,
} from "lucide-react";

import client from "../../api/client";

export default function TeacherSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSubjects() {
      try {
        setLoading(true);
        setError("");

        const response = await client.get("/teacher/subjects");

        if (mounted) {
          setSubjects(response.data?.subjects || []);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err.response?.data?.error ||
              "Could not load your assigned subjects."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSubjects();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--color-navy) 10%, white)",
              }}
            >
              <BookOpen
                className="w-5 h-5"
                style={{ color: "var(--color-navy)" }}
              />
            </div>

            <div>
              <h1
                className="text-xl sm:text-2xl font-semibold"
                style={{ color: "var(--color-navy)" }}
              >
                My Subjects
              </h1>

              <p className="text-sm text-slate-500">
                Subjects assigned to you across your classes
              </p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-sm text-slate-500">
              Loading your subjects...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && subjects.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-slate-400" />
            </div>

            <h2 className="mt-4 font-semibold text-slate-800">
              No subjects assigned
            </h2>

            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              You currently do not have any subjects assigned to your
              teacher account. Contact your school administrator if this
              is incorrect.
            </p>
          </div>
        )}

        {/* Subjects */}
        {!loading && !error && subjects.length > 0 && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">
                    {subjects.length}
                  </span>{" "}
                  {subjects.length === 1 ? "subject" : "subjects"} assigned
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SubjectCard({ subject }) {
  const grade = subject.grade;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-amber-50">
            <BookOpen className="w-5 h-5 text-amber-600" />
          </div>

          <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
            Level {grade?.level ?? "—"}
          </span>
        </div>

        <h2 className="mt-4 text-base font-semibold text-slate-800">
          {subject.name}
        </h2>

        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <GraduationCap className="w-4 h-4 shrink-0" />

          <span>{grade?.name || "Class not specified"}</span>
        </div>
      </div>

      <div className="border-t border-slate-100 px-5 py-3">
        <Link
          to={`/teacher/classes/${grade?.id}`}
          className="flex items-center justify-between text-sm font-medium transition hover:opacity-80"
          style={{ color: "var(--color-navy)" }}
        >
          <span>Open class workspace</span>

          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}