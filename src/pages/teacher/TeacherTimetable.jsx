import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  BookOpen,
  UserRound,
  Plus,
  X,
  Save,
} from "lucide-react";
import api from "../../api/client";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
];

const ENTRY_TYPE_LABELS = {
  personal: "Personal",
  preparation: "Preparation",
  meeting: "Meeting",
  club: "Club",
  remedial: "Remedial",
  other: "Other",
};

const EMPTY_FORM = {
  day_of_week: "monday",
  start_time: "09:00",
  end_time: "10:00",
  title: "",
  description: "",
  location: "",
  entry_type: "personal",
};

function formatTime(time) {
  if (!time) return "";

  const [hours, minutes] = time.split(":");
  const date = new Date();

  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function TeacherTimetable() {
  const [schoolEntries, setSchoolEntries] = useState([]);
  const [personalEntries, setPersonalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTimetable();
  }, []);

  async function loadTimetable() {
    try {
      setLoading(true);
      setError("");

      const timetablesResponse = await api.get("/timetables");

      const timetables = Array.isArray(timetablesResponse.data)
        ? timetablesResponse.data
        : [];

      if (timetables.length > 0) {
        const activeTimetable = timetables[0];

        const entriesResponse = await api.get(
          `/timetables/${activeTimetable.id}/entries`
        );

        setSchoolEntries(
          Array.isArray(entriesResponse.data)
            ? entriesResponse.data
            : []
        );
      } else {
        setSchoolEntries([]);
      }

      const personalResponse = await api.get(
        "/teacher_timetable_entries"
      );

      setPersonalEntries(
        Array.isArray(personalResponse.data)
          ? personalResponse.data
          : []
      );
    } catch (err) {
      console.error("Failed to load timetable:", err);

      setError(
        err?.response?.data?.error ||
          "Unable to load your timetable."
      );
    } finally {
      setLoading(false);
    }
  }

  function openForm() {
    setEditingEntry(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(entry) {
    setEditingEntry(entry);
    setForm({
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time,
      title: entry.title,
      description: entry.description || "",
      location: entry.location || "",
      entry_type: entry.entry_type,
    });
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingEntry(null);
    setFormError("");
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    try {
      if (editingEntry) {
        await api.patch(
          `/teacher_timetable_entries/${editingEntry.id}`,
          {
            teacher_timetable_entry: form,
          }
        );
      } else {
        await api.post("/teacher_timetable_entries", {
          teacher_timetable_entry: form,
        });
      }

      setShowForm(false);
      setEditingEntry(null);
      setForm(EMPTY_FORM);

      await loadTimetable();
    } catch (err) {
      console.error(
        editingEntry
          ? "Failed to update personal activity:"
          : "Failed to create personal activity:",
        err
      );

      const errors = err?.response?.data?.errors;

      if (Array.isArray(errors) && errors.length > 0) {
        setFormError(errors.join(", "));
      } else {
        setFormError(
          err?.response?.data?.error ||
            `Unable to ${
              editingEntry ? "update" : "create"
            } personal activity.`
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
      `/teacher_timetable_entries/${deleteTarget.id}`
    );

    setDeleteTarget(null);
    await loadTimetable();
  } catch (err) {
    console.error("Failed to delete personal activity:", err);

    setError(
      err?.response?.data?.error ||
        "Unable to delete personal activity."
    );
  } finally {
    setDeleting(false);
  }
}

  const groupedEntries = useMemo(() => {
    const grouped = {};

    DAYS.forEach((day) => {
      grouped[day.key] = [];
    });

    schoolEntries.forEach((entry) => {
      if (!grouped[entry.day_of_week]) return;

      grouped[entry.day_of_week].push({
        id: `school-${entry.id}`,
        source: "school",
        day_of_week: entry.day_of_week,
        start_time: entry.start_time,
        end_time: entry.end_time,
        title: entry.subject?.name || "Lesson",
        subtitle: entry.grade?.name || "",
        location: entry.room,
        teacher: entry.teacher?.name,
      });
    });

    personalEntries.forEach((entry) => {
      if (!grouped[entry.day_of_week]) return;

      grouped[entry.day_of_week].push({
        id: `personal-${entry.id}`,
        source: "personal",
        day_of_week: entry.day_of_week,
        start_time: entry.start_time,
        end_time: entry.end_time,
        title: entry.title,
        subtitle:
          ENTRY_TYPE_LABELS[entry.entry_type] ||
          entry.entry_type,
        location: entry.location,
        description: entry.description,
      });
    });

    Object.values(grouped).forEach((entries) => {
      entries.sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      );
    });

    return grouped;
  }, [schoolEntries, personalEntries]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-slate-500">
          Loading your timetable...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-slate-700" />
              <h1 className="text-2xl font-bold text-slate-900">
                My Timetable
              </h1>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Your official teaching schedule and personal activities.
            </p>
          </div>

          <button
            type="button"
            onClick={openForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add Personal Activity
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {DAYS.map((day) => {
            const entries = groupedEntries[day.key] || [];

            return (
              <div
                key={day.key}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <h2 className="font-semibold text-slate-900">
                    {day.label}
                  </h2>
                </div>

                <div className="space-y-3 p-4">
                  {entries.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-400">
                      No scheduled activities
                    </p>
                  ) : (
                    entries.map((entry) => (
                      <div
                        key={entry.id}
                        className={`rounded-lg border p-3 ${
                          entry.source === "school"
                            ? "border-blue-200 bg-blue-50"
                            : "border-amber-200 bg-amber-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              {entry.source === "school" ? (
                                <BookOpen className="h-4 w-4 text-blue-600" />
                              ) : (
                                <CalendarDays className="h-4 w-4 text-amber-600" />
                              )}

                              <h3 className="font-semibold text-slate-900">
                                {entry.title}
                              </h3>
                            </div>

                            <p className="mt-1 text-sm text-slate-600">
                              {entry.subtitle}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-600">
                              {entry.source === "school"
                                ? "School"
                                : "Personal"}
                            </span>

                            {entry.source === "personal" && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const originalEntry = personalEntries.find(
                                      (item) => item.id === Number(entry.id.replace("personal-", ""))
                                    );

                                    if (originalEntry) {
                                      openEditForm(originalEntry);
                                    }
                                  }}
                                  className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:text-slate-900"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const originalEntry = personalEntries.find(
                                      (item) =>
                                        item.id ===
                                        Number(entry.id.replace("personal-", ""))
                                    );

                                    if (originalEntry) {
                                      requestDelete(originalEntry);
                                    }
                                  }}
                                  className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-white hover:text-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {formatTime(entry.start_time)} –{" "}
                              {formatTime(entry.end_time)}
                            </span>
                          </div>

                          {entry.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{entry.location}</span>
                            </div>
                          )}

                          {entry.source === "school" &&
                            entry.teacher && (
                              <div className="flex items-center gap-2">
                                <UserRound className="h-3.5 w-3.5" />
                                <span>{entry.teacher}</span>
                              </div>
                            )}
                        </div>

                        {entry.description && (
                          <p className="mt-3 border-t border-slate-200/70 pt-2 text-xs text-slate-500">
                            {entry.description}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingEntry
                    ? "Edit Personal Activity"
                    : "Add Personal Activity"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add preparation, meetings, clubs or other activities.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Day
                  </label>
                  <select
                    name="day_of_week"
                    value={form.day_of_week}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  >
                    {DAYS.map((day) => (
                      <option key={day.key} value={day.key}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Type
                  </label>
                  <select
                    name="entry_type"
                    value={form.entry_type}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  >
                    {Object.entries(ENTRY_TYPE_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Lesson Preparation"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

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

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleFormChange}
                  placeholder="e.g. Staff Room"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Optional notes..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
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
                  {saving ? "Saving..." : editingEntry ? "Update Activity" : "Save Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <X className="h-5 w-5 text-red-600" />
                </div>

                <div>
                  <h2
                    id="delete-dialog-title"
                    className="text-lg font-semibold text-slate-900"
                  >
                    Delete personal activity?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-slate-900">
                      "{deleteTarget.title}"
                    </span>
                    ? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
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
                  {deleting ? "Deleting..." : "Delete Activity"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TeacherTimetable;