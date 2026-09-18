import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Plus,
  X,
  Save,
  Trash2,
  Pencil,
  MapPin,
  Users,
  BookOpen,
} from "lucide-react";
import api from "../api/client";

const DAYS = [
  { key: "monday", label: "Monday", short: "Mon" },
  { key: "tuesday", label: "Tuesday", short: "Tue" },
  { key: "wednesday", label: "Wednesday", short: "Wed" },
  { key: "thursday", label: "Thursday", short: "Thu" },
  { key: "friday", label: "Friday", short: "Fri" },
  { key: "saturday", label: "Saturday", short: "Sat" },
];

const EMPTY_LESSON = {
  day_of_week: "monday",
  start_time: "08:00",
  end_time: "09:00",
  grade_id: "",
  subject_id: "",
  teacher_id: "",
  room: "",
};

function AdminTimetableEditor() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [timetable, setTimetable] = useState(null);
  const [entries, setEntries] = useState([]);

  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [form, setForm] = useState(EMPTY_LESSON);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        timetableResponse,
        entriesResponse,
        gradesResponse,
        teachersResponse,
      ] = await Promise.all([
        api.get(`/timetables/${id}`),
        api.get(`/timetables/${id}/entries`),
        api.get("/grades"),
        api.get("/users"),
      ]);

      setTimetable(timetableResponse.data);

      setEntries(
        Array.isArray(entriesResponse.data)
          ? entriesResponse.data
          : []
      );

      setGrades(
        Array.isArray(gradesResponse.data)
          ? gradesResponse.data
          : []
      );

      const users = Array.isArray(teachersResponse.data)
        ? teachersResponse.data
        : [];

      setTeachers(
        users.filter(
          (user) =>
            user.role === "teacher" ||
            user.role === "headteacher" ||
            user.role === "deputy" ||
            user.role === "dos"
        )
      );
    } catch (err) {
      console.error("Failed to load timetable editor:", err);

      setError(
        err?.response?.data?.error ||
          "Unable to load timetable."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSubjects(gradeId) {
    if (!gradeId) {
      setSubjects([]);
      return;
    }

    try {
      const response = await api.get(
        `/grades/${gradeId}/subjects`
      );

      setSubjects(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error("Failed to load subjects:", err);

      setSubjects([]);
      setFormError(
        "Unable to load subjects for this grade."
      );
    }
  }

  function openCreateForm(
    day = "monday",
    startTime = "08:00",
    endTime = "09:00"
  ) {
    setEditingEntry(null);

    setForm({
      ...EMPTY_LESSON,
      day_of_week: day,
      start_time: startTime,
      end_time: endTime,
    });

    setSubjects([]);
    setFormError("");
    setShowForm(true);
  }

  async function openEditForm(entry) {
    setEditingEntry(entry);

    setForm({
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time,
      grade_id: String(entry.grade?.id || ""),
      subject_id: String(entry.subject?.id || ""),
      teacher_id: String(entry.teacher?.id || ""),
      room: entry.room || "",
    });

    setFormError("");
    setShowForm(true);

    await loadSubjects(entry.grade?.id);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingEntry(null);
    setFormError("");
    setSubjects([]);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    if (name === "grade_id") {
      setForm((current) => ({
        ...current,
        grade_id: value,
        subject_id: "",
        teacher_id: "",
      }));

      setSubjects([]);
      setFormError("");

      loadSubjects(value);
      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    if (form.start_time >= form.end_time) {
      setFormError(
        "End time must be later than start time."
      );
      setSaving(false);
      return;
    }

    const payload = {
      timetable_entry: {
        ...form,
        grade_id: Number(form.grade_id),
        subject_id: Number(form.subject_id),
        teacher_id: Number(form.teacher_id),
      },
    };

    try {
      if (editingEntry) {
        await api.patch(
          `/timetables/${id}/entries/${editingEntry.id}`,
          payload
        );
      } else {
        await api.post(
          `/timetables/${id}/entries`,
          payload
        );
      }

      closeForm();
      await loadData();
    } catch (err) {
      console.error(
        "Failed to save timetable entry:",
        err
      );

      const errors = err?.response?.data?.errors;

      if (Array.isArray(errors) && errors.length > 0) {
        setFormError(errors.join(", "));
      } else {
        setFormError(
          err?.response?.data?.error ||
            "Unable to save timetable lesson."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(entry) {
    setDeleteTarget(entry);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    setError("");

    try {
      await api.delete(
        `/timetables/${id}/entries/${deleteTarget.id}`
      );

      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error(
        "Failed to delete timetable entry:",
        err
      );

      setError(
        err?.response?.data?.error ||
          "Unable to delete timetable lesson."
      );
    } finally {
      setDeleting(false);
    }
  }

  /*
   * Build timetable rows from the actual lesson start times.
   *
   * Example:
   * 08:00
   * 09:00
   * 10:00
   * 11:00
   *
   * This means the grid automatically adapts to the school's
   * actual timetable instead of relying on hard-coded periods.
   */
  const timeSlots = useMemo(() => {
    const uniqueTimes = new Set();

    entries.forEach((entry) => {
      if (entry.start_time) {
        uniqueTimes.add(entry.start_time);
      }
    });

    /*
     * Give an empty timetable a useful starting period so
     * the grid is still visually usable.
     */
    if (uniqueTimes.size === 0) {
      uniqueTimes.add("08:00");
    }

    return Array.from(uniqueTimes).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [entries]);

  const entriesByCell = useMemo(() => {
    const grouped = {};

    entries.forEach((entry) => {
      const key = `${entry.day_of_week}-${entry.start_time}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(entry);
    });

    return grouped;
  }, [entries]);

  const statistics = useMemo(() => {
    const classes = new Set();
    const subjectsSet = new Set();
    const teachersSet = new Set();

    entries.forEach((entry) => {
      if (entry.grade?.id) {
        classes.add(entry.grade.id);
      }

      if (entry.subject?.id) {
        subjectsSet.add(entry.subject.id);
      }

      if (entry.teacher?.id) {
        teachersSet.add(entry.teacher.id);
      }
    });

    return {
      lessons: entries.length,
      classes: classes.size,
      subjects: subjectsSet.size,
      teachers: teachersSet.size,
    };
  }, [entries]);

  function getEntriesForCell(dayKey, startTime) {
    return (
      entriesByCell[`${dayKey}-${startTime}`] || []
    );
  }

  function getSuggestedEndTime(startTime, rowIndex) {
    const nextTime = timeSlots[rowIndex + 1];

    if (nextTime && nextTime > startTime) {
      return nextTime;
    }

    const [hours, minutes] = startTime
      .split(":")
      .map(Number);

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() + 60);

    return `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  }

  function handleEmptyCellClick(dayKey, startTime, rowIndex) {
    openCreateForm(
      dayKey,
      startTime,
      getSuggestedEndTime(startTime, rowIndex)
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          Loading timetable...
        </div>
      </div>
    );
  }

  if (!timetable) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error || "Timetable not found."}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* =======================================================
            HEADER
        ======================================================== */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate("/timetable")}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Timetables
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {timetable.name}
                </h1>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>
                    {timetable.term?.name}{" "}
                    {timetable.term?.year}
                  </span>

                  <span className="text-slate-300">
                    •
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      timetable.status === "published"
                        ? "bg-emerald-100 text-emerald-700"
                        : timetable.status === "archived"
                          ? "bg-slate-100 text-slate-500"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {timetable.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openCreateForm()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add Lesson
          </button>
        </div>

        {/* =======================================================
            ERROR
        ======================================================== */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =======================================================
            SUMMARY CARDS
        ======================================================== */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Lessons
              </span>

              <Clock3 className="h-4 w-4 text-slate-400" />
            </div>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {statistics.lessons}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Scheduled periods
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Classes
              </span>

              <Users className="h-4 w-4 text-slate-400" />
            </div>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {statistics.classes}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Classes on timetable
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Subjects
              </span>

              <BookOpen className="h-4 w-4 text-slate-400" />
            </div>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {statistics.subjects}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Subjects scheduled
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Teachers
              </span>

              <Users className="h-4 w-4 text-slate-400" />
            </div>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {statistics.teachers}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Teachers scheduled
            </p>
          </div>
        </div>

        {/* =======================================================
            TIMETABLE GRID
        ======================================================== */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Weekly Timetable
                </h2>

                <p className="text-xs text-slate-500">
                  Click an empty cell to schedule a lesson.
                </p>
              </div>

              <div className="text-xs text-slate-400">
                {entries.length}{" "}
                {entries.length === 1
                  ? "lesson"
                  : "lessons"}{" "}
                scheduled
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[1180px]">
              {/* Day headers */}
              <div className="grid grid-cols-[90px_repeat(6,minmax(175px,1fr))] border-b border-slate-200 bg-white">
                <div className="sticky left-0 z-20 flex items-center justify-center border-r border-slate-200 bg-slate-50 px-3 py-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Time
                  </span>
                </div>

                {DAYS.map((day) => (
                  <div
                    key={day.key}
                    className="border-r border-slate-200 px-4 py-4 last:border-r-0"
                  >
                    <div className="hidden text-sm font-semibold text-slate-900 sm:block">
                      {day.label}
                    </div>

                    <div className="text-sm font-semibold text-slate-900 sm:hidden">
                      {day.short}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time rows */}
              <div>
                {timeSlots.map((time, rowIndex) => (
                  <div
                    key={time}
                    className="grid grid-cols-[90px_repeat(6,minmax(175px,1fr))] border-b border-slate-200 last:border-b-0"
                  >
                    {/* Time */}
                    <div className="sticky left-0 z-10 flex min-h-[150px] items-start justify-center border-r border-slate-200 bg-slate-50 px-2 py-5">
                      <div className="text-center">
                        <Clock3 className="mx-auto mb-1 h-3.5 w-3.5 text-slate-400" />

                        <span className="text-xs font-semibold text-slate-600">
                          {time}
                        </span>
                      </div>
                    </div>

                    {/* Days */}
                    {DAYS.map((day) => {
                      const cellEntries =
                        getEntriesForCell(
                          day.key,
                          time
                        );

                      return (
                        <div
                          key={`${day.key}-${time}`}
                          className="group relative min-h-[150px] border-r border-slate-200 bg-white p-2 last:border-r-0"
                        >
                          {cellEntries.length === 0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleEmptyCellClick(
                                  day.key,
                                  time,
                                  rowIndex
                                )
                              }
                              className="flex h-full min-h-[134px] w-full items-center justify-center rounded-lg border border-dashed border-transparent text-slate-300 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-500"
                            >
                              <span className="flex items-center gap-1 text-xs opacity-0 transition group-hover:opacity-100">
                                <Plus className="h-3.5 w-3.5" />
                                Add lesson
                              </span>
                            </button>
                          ) : (
                            <div className="space-y-2">
                              {cellEntries.map(
                                (entry) => (
                                  <div
                                    key={entry.id}
                                    className="group/card relative rounded-xl border border-blue-200 bg-blue-50 p-3 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                                  >
                                    {/* Lesson header */}
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <h3 className="truncate text-sm font-bold text-slate-900">
                                          {entry.subject
                                            ?.name ||
                                            "Subject"}
                                        </h3>

                                        <p className="mt-0.5 truncate text-xs font-medium text-blue-700">
                                          {entry.grade
                                            ?.name ||
                                            "Class"}
                                        </p>
                                      </div>

                                      <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover/card:opacity-100">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openEditForm(
                                              entry
                                            )
                                          }
                                          className="rounded-md p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900"
                                          aria-label="Edit lesson"
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            requestDelete(
                                              entry
                                            )
                                          }
                                          className="rounded-md p-1.5 text-red-500 transition hover:bg-white hover:text-red-700"
                                          aria-label="Delete lesson"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Time */}
                                    <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                      <Clock3 className="h-3.5 w-3.5 shrink-0 text-blue-600" />

                                      <span>
                                        {
                                          entry.start_time
                                        }{" "}
                                        –{" "}
                                        {
                                          entry.end_time
                                        }
                                      </span>
                                    </div>

                                    {/* Teacher */}
                                    {entry.teacher
                                      ?.name && (
                                      <div className="mt-1.5 truncate text-xs text-slate-600">
                                        <span className="font-medium">
                                          Teacher:
                                        </span>{" "}
                                        {
                                          entry
                                            .teacher
                                            .name
                                        }
                                      </div>
                                    )}

                                    {/* Room */}
                                    {entry.room && (
                                      <div className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-slate-500">
                                        <MapPin className="h-3.5 w-3.5 shrink-0" />

                                        <span className="truncate">
                                          {entry.room}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Empty timetable */}
                {timeSlots.length === 1 &&
                  timeSlots[0] === "08:00" &&
                  entries.length === 0 && (
                    <div className="border-t border-slate-200 bg-slate-50 px-6 py-10 text-center">
                      <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />

                      <h3 className="mt-3 text-sm font-semibold text-slate-700">
                        No lessons scheduled yet
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Start building the timetable by
                        adding the first lesson.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          openCreateForm()
                        }
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                      >
                        <Plus className="h-4 w-4" />
                        Add First Lesson
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Grid footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">
                Tip:
              </span>{" "}
              Select any empty timetable cell to create a
              lesson starting at that time.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================
          ADD / EDIT LESSON MODAL
      ========================================================== */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingEntry
                    ? "Edit Lesson"
                    : "Add Lesson"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add an official teaching period to the
                  school timetable.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              {/* Day + Room */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Day
                  </label>

                  <select
                    name="day_of_week"
                    value={form.day_of_week}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  >
                    {DAYS.map((day) => (
                      <option
                        key={day.key}
                        value={day.key}
                      >
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Room
                  </label>

                  <input
                    type="text"
                    name="room"
                    value={form.room}
                    onChange={handleFormChange}
                    placeholder="e.g. Room 1"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Start Time
                  </label>

                  <input
                    type="time"
                    name="start_time"
                    value={form.start_time}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    End Time
                  </label>

                  <input
                    type="time"
                    name="end_time"
                    value={form.end_time}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              {/* Grade */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Grade
                </label>

                <select
                  name="grade_id"
                  value={form.grade_id}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">
                    Select grade
                  </option>

                  {grades.map((grade) => (
                    <option
                      key={grade.id}
                      value={grade.id}
                    >
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Subject
                </label>

                <select
                  name="subject_id"
                  value={form.subject_id}
                  onChange={handleFormChange}
                  required
                  disabled={!form.grade_id}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none disabled:bg-slate-100 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">
                    {form.grade_id
                      ? "Select subject"
                      : "Select a grade first"}
                  </option>

                  {subjects.map((subject) => (
                    <option
                      key={subject.id}
                      value={subject.id}
                    >
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Teacher
                </label>

                <select
                  name="teacher_id"
                  value={form.teacher_id}
                  onChange={handleFormChange}
                  required
                  disabled={!form.subject_id}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none disabled:bg-slate-100 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">
                    {form.subject_id
                      ? "Select teacher"
                      : "Select a subject first"}
                  </option>

                  {teachers.map((teacher) => (
                    <option
                      key={teacher.id}
                      value={teacher.id}
                    >
                      {teacher.name}
                    </option>
                  ))}
                </select>

                <p className="mt-1.5 text-xs text-slate-500">
                  The server will verify that the teacher is
                  assigned to the selected subject.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />

                  {saving
                    ? "Saving..."
                    : editingEntry
                      ? "Update Lesson"
                      : "Save Lesson"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          DELETE CONFIRMATION
      ========================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-lesson-title"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>

                <div>
                  <h2
                    id="delete-lesson-title"
                    className="text-lg font-semibold text-slate-900"
                  >
                    Delete timetable lesson?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Are you sure you want to delete the{" "}
                    <span className="font-semibold text-slate-900">
                      {deleteTarget.subject?.name}
                    </span>{" "}
                    lesson for{" "}
                    <span className="font-semibold text-slate-900">
                      {deleteTarget.grade?.name}
                    </span>
                    ? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setDeleteTarget(null)
                  }
                  disabled={deleting}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting
                    ? "Deleting..."
                    : "Delete Lesson"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminTimetableEditor;