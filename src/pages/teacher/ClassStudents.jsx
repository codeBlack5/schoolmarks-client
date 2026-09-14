import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Users,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock3,
  XCircle,
  MinusCircle,
  Eye,
} from "lucide-react";

import client from "../../api/client";

const attendanceConfig = {
  present: {
    label: "Present",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700",
  },
  absent: {
    label: "Absent",
    icon: XCircle,
    className: "bg-red-50 text-red-700",
  },
  late: {
    label: "Late",
    icon: Clock3,
    className: "bg-amber-50 text-amber-700",
  },
  excused: {
    label: "Excused",
    icon: MinusCircle,
    className: "bg-gray-100 text-gray-700",
  },
};

const competencyConfig = {
  EE: "bg-green-50 text-green-700",
  ME: "bg-blue-50 text-blue-700",
  AE: "bg-amber-50 text-amber-700",
  BE: "bg-red-50 text-red-700",
};

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

  const filteredStudents = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return students;

    return students.filter((student) => {
      return (
        student.name?.toLowerCase().includes(query) ||
        student.admission_number
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [students, search]);

  const attendanceSummary = useMemo(() => {
    return students.reduce(
      (summary, student) => {
        const status = student.attendance_today?.status;

        if (status && summary[status] !== undefined) {
          summary[status] += 1;
        }

        return summary;
      },
      {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      }
    );
  }, [students]);

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
      {/* Back */}
      <Link
        to={`/teacher/classes/${id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={17} />
        Back to Class Workspace
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
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

        <div className="relative w-full lg:w-80">
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Students"
          value={students.length}
          icon={Users}
          className="text-blue-600"
        />

        <SummaryCard
          label="Present"
          value={attendanceSummary.present}
          icon={CheckCircle2}
          className="text-green-600"
        />

        <SummaryCard
          label="Absent"
          value={attendanceSummary.absent}
          icon={XCircle}
          className="text-red-600"
        />

        <SummaryCard
          label="Late"
          value={attendanceSummary.late}
          icon={Clock3}
          className="text-amber-600"
        />
      </div>

      {/* Roster */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Student Roster
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Today's attendance and current academic summary
              </p>
            </div>

            {search && (
              <p className="text-xs text-gray-500">
                Showing {filteredStudents.length} of{" "}
                {students.length}
              </p>
            )}
          </div>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredStudents.map((student, index) => {
              const attendanceStatus =
                student.attendance_today?.status;

              const attendance =
                attendanceConfig[attendanceStatus];

              const AttendanceIcon = attendance?.icon;

              const academic =
                student.academic_summary || {};

              const competencyClass =
                competencyConfig[academic.competency] ||
                "bg-gray-100 text-gray-700";

              return (
                <div
                  key={student.id}
                  className="px-4 py-4 transition hover:bg-gray-50 sm:px-5"
                >
                  {/* Desktop/tablet row */}
                  <div className="hidden items-center gap-4 md:flex">
                    {/* Number */}
                    <div className="w-8 text-center text-xs text-gray-400">
                      #{index + 1}
                    </div>

                    {/* Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                      {student.name
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </div>

                    {/* Student */}
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/teacher/students/${student.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {student.name}
                      </Link>

                      <p className="mt-1 text-xs text-gray-500">
                        Adm No:{" "}
                        {student.admission_number || "—"}
                      </p>
                    </div>

                    {/* Attendance */}
                    <div className="w-28">
                      {attendance ? (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${attendance.className}`}
                        >
                          <AttendanceIcon size={14} />
                          {attendance.label}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Not recorded
                        </span>
                      )}
                    </div>

                    {/* Academic */}
                    <div className="w-28">
                      {academic.average !== null &&
                      academic.average !== undefined ? (
                        <div>
                          <p className="font-semibold text-gray-900">
                            {academic.average}%
                          </p>

                          <p className="text-xs text-gray-500">
                            {academic.marks_count || 0} marks
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          No marks
                        </span>
                      )}
                    </div>

                    {/* Competency */}
                    <div className="w-16 text-center">
                      {academic.competency ? (
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${competencyClass}`}
                        >
                          {academic.competency}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          —
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    <Link
                      to={`/teacher/students/${student.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Eye size={15} />
                      View
                    </Link>

                    <ChevronRight
                      size={18}
                      className="text-gray-300"
                    />
                  </div>

                  {/* Mobile row */}
                  <div className="md:hidden">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                        {student.name
                          ?.charAt(0)
                          ?.toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Link
                              to={`/teacher/students/${student.id}`}
                              className="font-medium text-gray-900 hover:text-blue-600"
                            >
                              {student.name}
                            </Link>

                            <p className="mt-1 text-xs text-gray-500">
                              Adm No:{" "}
                              {student.admission_number || "—"}
                            </p>
                          </div>

                          <Link
                            to={`/teacher/students/${student.id}`}
                            className="shrink-0 rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                            aria-label={`View ${student.name}`}
                          >
                            <ChevronRight size={18} />
                          </Link>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-gray-50 p-2.5">
                            <p className="text-[11px] uppercase tracking-wide text-gray-400">
                              Attendance
                            </p>

                            <div className="mt-1">
                              {attendance ? (
                                <span
                                  className={`inline-flex items-center gap-1 text-xs font-medium ${attendance.className
                                    .replace(
                                      "bg-green-50 ",
                                      ""
                                    )
                                    .replace(
                                      "bg-red-50 ",
                                      ""
                                    )
                                    .replace(
                                      "bg-amber-50 ",
                                      ""
                                    )
                                    .replace(
                                      "bg-gray-100 ",
                                      ""
                                    )}`}
                                >
                                  <AttendanceIcon size={13} />
                                  {attendance.label}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  Not recorded
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="rounded-lg bg-gray-50 p-2.5">
                            <p className="text-[11px] uppercase tracking-wide text-gray-400">
                              Average
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {academic.average !== null &&
                              academic.average !== undefined
                                ? `${academic.average}%`
                                : "No marks"}
                            </p>
                          </div>

                          <div className="rounded-lg bg-gray-50 p-2.5">
                            <p className="text-[11px] uppercase tracking-wide text-gray-400">
                              Competency
                            </p>

                            <div className="mt-1">
                              {academic.competency ? (
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${competencyClass}`}
                                >
                                  {academic.competency}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  —
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="rounded-lg bg-gray-50 p-2.5">
                            <p className="text-[11px] uppercase tracking-wide text-gray-400">
                              Marks
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {academic.marks_count || 0}
                            </p>
                          </div>
                        </div>

                        <Link
                          to={`/teacher/students/${student.id}`}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Eye size={15} />
                          View Student Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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

function SummaryCard({
  label,
  value,
  icon: Icon,
  className,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`rounded-lg bg-gray-50 p-2 ${className}`}
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-gray-500">
            {label}
          </p>

          <p className="text-xl font-bold text-gray-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}