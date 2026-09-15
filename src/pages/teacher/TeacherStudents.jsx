import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Users,
  User,
  ChevronRight,
  Loader2,
} from "lucide-react";

import client from "../../api/client";

export default function TeacherStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadStudents() {
      try {
        setLoading(true);
        setError("");

        const response = await client.get("/teacher/students");

        if (!mounted) return;

        setStudents(response.data?.students || []);
      } catch (err) {
        console.error("Failed to load teacher students:", err);

        if (mounted) {
          setError(
            err.response?.data?.error ||
              "Unable to load students."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStudents();

    return () => {
      mounted = false;
    };
  }, []);

  const grades = useMemo(() => {
    const uniqueGrades = new Map();

    students.forEach((student) => {
      if (student.grade?.id) {
        uniqueGrades.set(student.grade.id, student.grade);
      }
    });

    return Array.from(uniqueGrades.values()).sort(
      (a, b) => (a.level ?? 0) - (b.level ?? 0)
    );
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        student.name?.toLowerCase().includes(query) ||
        student.admission_number
          ?.toLowerCase()
          .includes(query);

      const matchesGrade =
        !gradeFilter ||
        String(student.grade?.id) === String(gradeFilter);

      return matchesSearch && matchesGrade;
    });
  }, [students, search, gradeFilter]);

  if (loading) {
    return (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2
            size={28}
            className="animate-spin text-blue-600"
          />
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Users size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Students
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  View and manage students in your teaching workspace.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">
              {students.length}
            </span>{" "}
            students
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by student name or admission number..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={gradeFilter}
              onChange={(event) =>
                setGradeFilter(event.target.value)
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All classes</option>

              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Student list */}
        {filteredStudents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <div className="mx-auto mb-4 w-fit rounded-full bg-blue-50 p-4 text-blue-600">
              <Users size={28} />
            </div>

            <h2 className="text-lg font-semibold text-gray-900">
              No students found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Try changing your search or class filter.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <Link
                  key={student.id}
                  to={`/teacher/students/${student.id}`}
                  className="flex items-center gap-4 p-4 transition hover:bg-gray-50"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                    <User size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">
                      {student.name}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span>
                        Adm No:{" "}
                        {student.admission_number || "—"}
                      </span>

                      <span>
                        {student.grade?.name || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="hidden shrink-0 sm:block">
                    {student.attendance_today ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          student.attendance_today.status ===
                          "present"
                            ? "bg-green-50 text-green-700"
                            : student.attendance_today.status ===
                              "absent"
                            ? "bg-red-50 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {student.attendance_today.status}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">
                        No attendance
                      </span>
                    )}
                  </div>

                  <ChevronRight
                    size={19}
                    className="shrink-0 text-gray-400"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        {filteredStudents.length > 0 && (
          <p className="text-center text-xs text-gray-400">
            Showing {filteredStudents.length} of{" "}
            {students.length} students
          </p>
        )}
      </div>
  );
}
