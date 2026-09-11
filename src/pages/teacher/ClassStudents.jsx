import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Users,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

import client from "../../api/client";

export default function ClassStudents() {
  const { id } = useParams();

  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStudents() {
      try {
        setLoading(true);
        setError("");

        const { data } = await client.get(
          `/teacher/classes/${id}/students`
        );

        setClassInfo(data.class);
        setStudents(data.students || []);
      } catch (err) {
        console.error("Failed to load class students:", err);

        setError(
          err.response?.data?.error ||
            "Unable to load students."
        );
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, [id]);

  const filteredStudents = students.filter((student) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    return (
      student.name?.toLowerCase().includes(query) ||
      student.admission_number
        ?.toLowerCase()
        .includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="text-gray-600">
            Loading students...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          to={`/teacher/classes/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={17} />
          Back to Class Workspace
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="text-red-600"
              size={22}
            />

            <div>
              <h2 className="font-semibold text-red-800">
                Unable to load students
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

  return (
    <div className="space-y-6">

      <Link
        to={`/teacher/classes/${id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={17} />
        Back to Class Workspace
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="text-sm font-medium text-blue-600">
            {classInfo?.name}
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            Class Students
          </h1>

          <p className="mt-2 text-gray-600">
            {students.length} students
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search student..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

      </div>

      {/* Summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
            <Users size={20} />
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Students in {classInfo?.name}
            </p>

            <p className="text-2xl font-bold text-gray-900">
              {filteredStudents.length}
            </p>
          </div>
        </div>
      </div>

      {/* Student list */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Student Roster
          </h2>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="divide-y divide-gray-100">

            {filteredStudents.map((student, index) => (
              <Link
                key={student.id}
                to={`/teacher/students/${student.id}`}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-gray-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                  {student.name
                    ?.charAt(0)
                    ?.toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {student.name}
                    </p>

                    {student.status !== "active" && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {student.status}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    Adm No:{" "}
                    {student.admission_number || "—"}
                  </p>

                </div>

                <span className="hidden text-xs text-gray-400 sm:block">
                  #{index + 1}
                </span>

                <ChevronRight
                  size={18}
                  className="text-gray-400"
                />
              </Link>
            ))}

          </div>
        ) : (
          <div className="p-10 text-center">
            <Users
              className="mx-auto text-gray-400"
              size={38}
            />

            <p className="mt-3 font-medium text-gray-700">
              No students found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Try a different search term.
            </p>
          </div>
        )}

      </section>
    </div>
  );
}