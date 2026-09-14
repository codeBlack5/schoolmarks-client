import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Users,
  X,
  BookOpen,
  Save,
  AlertCircle,
} from "lucide-react";

import client from "../../api/client";

const STATUS_OPTIONS = [
  {
    value: "present",
    label: "Present",
    shortLabel: "P",
    icon: CheckCircle2,
  },
  {
    value: "absent",
    label: "Absent",
    shortLabel: "A",
    icon: X,
  },
  {
    value: "late",
    label: "Late",
    shortLabel: "L",
    icon: Clock3,
  },
  {
    value: "excused",
    label: "Excused",
    shortLabel: "E",
    icon: Check,
  },
];

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function TeacherAttendance() {
  const [grades, setGrades] = useState([]);
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [selectedDate, setSelectedDate] = useState(today());

  const [students, setStudents] = useState([]);
  const [grade, setGrade] = useState(null);

  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * Load classes available to the teacher.
   *
   * We use the existing teacher classes endpoint rather than
   * allowing the frontend to invent class access.
   */
  useEffect(() => {
    let mounted = true;

    async function loadGrades() {
      try {
        setLoadingGrades(true);
        setError("");

        const response = await client.get("/teacher/classes");

        if (!mounted) return;

        const loadedGrades = response.data?.classes || [];

        setGrades(loadedGrades);

        if (loadedGrades.length > 0) {
          setSelectedGradeId(String(loadedGrades[0].id));
        }
      } catch (err) {
        if (mounted) {
          setError(
            err.response?.data?.error ||
              "Could not load your classes."
          );
        }
      } finally {
        if (mounted) {
          setLoadingGrades(false);
        }
      }
    }

    loadGrades();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * Load attendance whenever class or date changes.
   */
  useEffect(() => {
    if (!selectedGradeId || !selectedDate) return;

    let mounted = true;

    async function loadAttendance() {
      try {
        setLoadingAttendance(true);
        setError("");
        setSuccess("");

        const response = await client.get(
          `/teacher/attendance/${selectedGradeId}`,
          {
            params: {
              date: selectedDate,
            },
          }
        );

        if (!mounted) return;

        setGrade(response.data?.grade || null);

        setStudents(
          (response.data?.students || []).map((student) => ({
            ...student,
            attendance_status:
              student.attendance?.status || "present",
          }))
        );
      } catch (err) {
        if (mounted) {
          setError(
            err.response?.data?.error ||
              "Could not load attendance."
          );
          setStudents([]);
          setGrade(null);
        }
      } finally {
        if (mounted) {
          setLoadingAttendance(false);
        }
      }
    }

    loadAttendance();

    return () => {
      mounted = false;
    };
  }, [selectedGradeId, selectedDate]);

  const summary = useMemo(() => {
    return students.reduce(
      (result, student) => {
        const status = student.attendance_status;

        if (result[status] !== undefined) {
          result[status] += 1;
        }

        result.total += 1;

        return result;
      },
      {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0,
      }
    );
  }, [students]);

  function updateStudentStatus(studentId, status) {
    setStudents((current) =>
      current.map((student) =>
        student.id === studentId
          ? {
              ...student,
              attendance_status: status,
            }
          : student
      )
    );

    setSuccess("");
  }

  function markAll(status) {
    setStudents((current) =>
      current.map((student) => ({
        ...student,
        attendance_status: status,
      }))
    );

    setSuccess("");
  }

  async function handleSaveAttendance() {
    if (!selectedGradeId || students.length === 0) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const attendance = students.map((student) => ({
        student_id: student.id,
        status: student.attendance_status,
      }));

      const response = await client.post(
        `/teacher/attendance/${selectedGradeId}`,
        {
          date: selectedDate,
          attendance,
        }
      );

      setSuccess(
        response.data?.message ||
          "Attendance saved successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.errors?.join(", ") ||
          "Could not save attendance."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleClassChange(event) {
    setSelectedGradeId(event.target.value);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--color-navy) 10%, white)",
              }}
            >
              <CalendarDays
                className="w-5 h-5"
                style={{ color: "var(--color-navy)" }}
              />
            </div>

            <div>
              <h1
                className="text-xl sm:text-2xl font-semibold"
                style={{ color: "var(--color-navy)" }}
              >
                Attendance
              </h1>

              <p className="text-sm text-slate-500">
                Record and manage daily attendance for your classes
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />

            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />

            <p className="text-sm text-green-700">
              {success}
            </p>
          </div>
        )}

        {/* Controls */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Class */}
            <div>
              <label
                htmlFor="attendance-class"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Class
              </label>

              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />

                <select
                  id="attendance-class"
                  value={selectedGradeId}
                  onChange={handleClassChange}
                  disabled={
                    loadingGrades || grades.length === 0
                  }
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                >
                  {loadingGrades ? (
                    <option>Loading classes...</option>
                  ) : grades.length === 0 ? (
                    <option>No classes available</option>
                  ) : (
                    grades.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Date */}
            <div>
              <label
                htmlFor="attendance-date"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Attendance Date
              </label>

              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />

                <input
                  id="attendance-date"
                  type="date"
                  value={selectedDate}
                  max={today()}
                  onChange={(event) =>
                    setSelectedDate(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {grade && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                <span className="font-medium text-slate-700">
                  {grade.name}
                </span>
              </div>

              {grade.level && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                  Level {grade.level}
                </span>
              )}

              <span className="hidden sm:inline text-slate-300">
                •
              </span>

              <span>
                {students.length} students
              </span>
            </div>
          )}
        </section>

        {/* Summary */}
        {!loadingAttendance && students.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <SummaryCard
              label="Total"
              value={summary.total}
              icon={Users}
            />

            <SummaryCard
              label="Present"
              value={summary.present}
              icon={CheckCircle2}
              valueClassName="text-green-700"
            />

            <SummaryCard
              label="Absent"
              value={summary.absent}
              icon={X}
              valueClassName="text-red-700"
            />

            <SummaryCard
              label="Late"
              value={summary.late}
              icon={Clock3}
              valueClassName="text-amber-700"
            />

            <SummaryCard
              label="Excused"
              value={summary.excused}
              icon={Check}
              valueClassName="text-blue-700"
            />
          </div>
        )}

        {/* Loading roster */}
        {loadingAttendance && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-sm text-slate-500">
              Loading attendance...
            </p>
          </div>
        )}

        {/* Empty roster */}
        {!loadingAttendance &&
          selectedGradeId &&
          students.length === 0 &&
          !error && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <Users className="w-8 h-8 mx-auto text-slate-300" />

              <h2 className="mt-3 font-semibold text-slate-800">
                No students found
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                There are no active students in this class.
              </p>
            </div>
          )}

        {/* Roster */}
        {!loadingAttendance && students.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">

            {/* Roster header */}
            <div className="px-4 sm:px-5 py-4 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <div>
                  <h2 className="font-semibold text-slate-800">
                    Class Roster
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Mark the attendance status for each student
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => markAll("present")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    All Present
                  </button>

                  <button
                    type="button"
                    onClick={() => markAll("absent")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    <X className="w-3.5 h-3.5" />
                    All Absent
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      #
                    </th>

                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Student
                    </th>

                    <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Attendance
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {students.map((student, index) => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4 text-sm text-slate-400">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-slate-500" />
                          </div>

                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {student.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <AttendanceButtons
                          status={student.attendance_status}
                          onChange={(status) =>
                            updateStudentStatus(
                              student.id,
                              status
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile roster */}
            <div className="md:hidden divide-y divide-slate-100">
              {students.map((student, index) => (
                <div
                  key={student.id}
                  className="p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-slate-400 pt-2 w-5">
                      {index + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                        </div>

                        <p className="text-sm font-medium text-slate-800 truncate">
                          {student.name}
                        </p>
                      </div>

                      <AttendanceButtons
                        status={student.attendance_status}
                        onChange={(status) =>
                          updateStudentStatus(
                            student.id,
                            status
                          )
                        }
                        mobile
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Save footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-5 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <div className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    {summary.total}
                  </span>{" "}
                  students marked for{" "}
                  <span className="font-medium text-slate-700">
                    {selectedDate}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--color-navy)",
                  }}
                >
                  <Save className="w-4 h-4" />

                  {saving
                    ? "Saving Attendance..."
                    : "Save Attendance"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Helpful navigation */}
        {grade && (
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to={`/teacher/classes/${grade.id}`}
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: "var(--color-navy)" }}
            >
              <GraduationCap className="w-4 h-4" />
              Open class workspace
            </Link>

            <Link
              to="/teacher/classes"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              <BookOpen className="w-4 h-4" />
              My Classes
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  valueClassName = "text-slate-800",
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          {label}
        </p>

        <Icon className="w-4 h-4 text-slate-400" />
      </div>

      <p
        className={`text-xl font-semibold mt-2 ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}

function AttendanceButtons({
  status,
  onChange,
  mobile = false,
}) {
  return (
    <div
      className={`flex ${
        mobile ? "w-full" : "justify-center"
      } gap-2`}
    >
      {STATUS_OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = status === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            title={option.label}
            className={`
              ${
                mobile
                  ? "flex-1"
                  : "min-w-[92px]"
              }
              inline-flex items-center justify-center gap-1.5
              rounded-lg border px-2.5 py-2
              text-xs font-medium transition
              ${
                active
                  ? statusClasses[option.value].active
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }
            `}
          >
            <Icon className="w-3.5 h-3.5" />

            <span className="hidden sm:inline">
              {option.label}
            </span>

            <span className="sm:hidden">
              {option.shortLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const statusClasses = {
  present: {
    active:
      "border-green-300 bg-green-50 text-green-700",
  },
  absent: {
    active:
      "border-red-300 bg-red-50 text-red-700",
  },
  late: {
    active:
      "border-amber-300 bg-amber-50 text-amber-700",
  },
  excused: {
    active:
      "border-blue-300 bg-blue-50 text-blue-700",
  },
};