import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import client from "../../api/client";
import { useAlert } from "../../context/AlertContext";

const initialEntry = {
  week_number: "",
  start_date: "",
  end_date: "",
  topic: "",
  subtopic: "",
  learning_objectives: "",
  learning_activities: "",
  resources: "",
  assessment_methods: "",
  coverage_status: "planned",
  remarks: "",
};

const coverageStyles = {
  planned: {
    label: "Planned",
    className: "bg-slate-100 text-slate-700",
    icon: Clock3,
  },
  partially_taught: {
    label: "Partially Taught",
    className: "bg-yellow-100 text-yellow-700",
    icon: Clock3,
  },
  taught: {
    label: "Taught",
    className: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
};

export default function TeacherSchemeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { confirm, notify } = useAlert();

  const [scheme, setScheme] = useState(null);
  const [entries, setEntries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [form, setForm] = useState(initialEntry);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [schemeResponse, entriesResponse] =
        await Promise.all([
          client.get(`/teacher/schemes/${id}`),
          client.get(`/teacher/schemes/${id}/entries`),
        ]);

      setScheme(schemeResponse.data?.data || null);
      setEntries(entriesResponse.data?.data || []);
    } catch (err) {
      console.error("Failed to load scheme:", err);

      setError(
        err.response?.data?.error ||
          "Unable to load this scheme of work."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  const coverage = useMemo(() => {
    const total = entries.length;

    if (!total) {
      return {
        total: 0,
        planned: 0,
        partial: 0,
        taught: 0,
        percentage: 0,
      };
    }

    const planned = entries.filter(
      (entry) => entry.coverage_status === "planned"
    ).length;

    const partial = entries.filter(
      (entry) =>
        entry.coverage_status === "partially_taught"
    ).length;

    const taught = entries.filter(
      (entry) => entry.coverage_status === "taught"
    ).length;

    /*
     * Partial teaching counts as half coverage.
     */
    const percentage = Math.round(
      ((taught + partial * 0.5) / total) * 100
    );

    return {
      total,
      planned,
      partial,
      taught,
      percentage,
    };
  }, [entries]);

  function openCreateEntry() {
    const nextWeek =
      entries.length > 0
        ? Math.max(
            ...entries.map((entry) =>
              Number(entry.week_number) || 0
            )
          ) + 1
        : 1;

    setEditingEntry(null);

    setForm({
      ...initialEntry,
      week_number: nextWeek,
    });

    setError("");
    setShowForm(true);
  }

  function openEditEntry(entry) {
    setEditingEntry(entry);

    setForm({
      week_number: entry.week_number || "",
      start_date: entry.start_date || "",
      end_date: entry.end_date || "",
      topic: entry.topic || "",
      subtopic: entry.subtopic || "",
      learning_objectives:
        entry.learning_objectives || "",
      learning_activities:
        entry.learning_activities || "",
      resources: entry.resources || "",
      assessment_methods:
        entry.assessment_methods || "",
      coverage_status:
        entry.coverage_status || "planned",
      remarks: entry.remarks || "",
    });

    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingEntry(null);
    setForm(initialEntry);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        scheme_entry: {
          ...form,
          week_number: Number(form.week_number),
        },
      };

      let response;

      if (editingEntry) {
        response = await client.patch(
          `/teacher/schemes/${id}/entries/${editingEntry.id}`,
          payload
        );
      } else {
        response = await client.post(
          `/teacher/schemes/${id}/entries`,
          payload
        );
      }

      const savedEntry = response.data?.data;

      if (editingEntry) {
        setEntries((current) =>
          current.map((entry) =>
            entry.id === savedEntry.id
              ? savedEntry
              : entry
          )
        );
      } else {
        setEntries((current) => [
          ...current,
          savedEntry,
        ]);
      }

      closeForm();

      notify({
        type: "success",
        message: editingEntry
          ? "Scheme entry updated."
          : "Scheme entry added.",
      });
    } catch (err) {
      console.error("Failed to save scheme entry:", err);

      const errors = err.response?.data?.errors;

      setError(
        Array.isArray(errors)
          ? errors.join(", ")
          : err.response?.data?.error ||
              "Unable to save the scheme entry."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(entry) {
    const confirmed = await confirm({
      title: `Delete Week ${entry.week_number}?`,
      message:
        "This weekly scheme entry will be permanently removed.",
      confirmText: "Delete",
      danger: true,
    });

    if (!confirmed) return;

    try {
      await client.delete(
        `/teacher/schemes/${id}/entries/${entry.id}`
      );

      setEntries((current) =>
        current.filter(
          (item) => item.id !== entry.id
        )
      );

      notify({
        type: "success",
        message: "Scheme entry deleted.",
      });
    } catch (err) {
      console.error("Failed to delete scheme entry:", err);

      setError(
        err.response?.data?.error ||
          "Unable to delete the scheme entry."
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="text-gray-600">
            Loading scheme of work...
          </p>
        </div>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">
          {error || "Scheme of work not found."}
        </p>

        <button
          type="button"
          onClick={() => navigate("/teacher/schemes")}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          <ArrowLeft size={16} />
          Back to Schemes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate("/teacher/schemes")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Schemes
        </button>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: "var(--color-navy)",
                  }}
                >
                  <BookOpen
                    size={21}
                    className="text-white"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {scheme.grade_name}
                  </p>

                  <h1 className="text-2xl font-bold text-slate-900">
                    {scheme.subject_name}
                  </h1>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium text-slate-700">
                {scheme.title}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {scheme.term_name} {scheme.term_year}
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateEntry}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus size={18} />
              Add Week
            </button>
          </div>

          {/* Coverage */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Syllabus Coverage
                </p>

                <p className="text-xs text-slate-500">
                  Based on the teaching status of weekly entries.
                </p>
              </div>

              <span className="text-lg font-bold text-slate-900">
                {coverage.percentage}%
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-700 transition-all"
                style={{
                  width: `${coverage.percentage}%`,
                }}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              <span>
                Total:{" "}
                <strong className="text-slate-700">
                  {coverage.total}
                </strong>
              </span>

              <span>
                Planned:{" "}
                <strong className="text-slate-700">
                  {coverage.planned}
                </strong>
              </span>

              <span>
                Partial:{" "}
                <strong className="text-slate-700">
                  {coverage.partial}
                </strong>
              </span>

              <span>
                Taught:{" "}
                <strong className="text-slate-700">
                  {coverage.taught}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Weekly entries */}
      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <CalendarDays
            className="mx-auto mb-3 text-slate-400"
            size={38}
          />

          <h2 className="text-lg font-semibold text-slate-800">
            No weekly entries yet
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Start building your scheme by adding the first
            teaching week.
          </p>

          <button
            type="button"
            onClick={openCreateEntry}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={17} />
            Add Week 1
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const status =
              coverageStyles[
                entry.coverage_status
              ] || coverageStyles.planned;

            const StatusIcon = status.icon;

            return (
              <article
                key={entry.id}
                className="rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                      W{entry.week_number}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">
                          {entry.topic}
                        </h2>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                        >
                          <StatusIcon size={13} />
                          {status.label}
                        </span>
                      </div>

                      {entry.subtopic && (
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          {entry.subtopic}
                        </p>
                      )}

                      {(entry.start_date ||
                        entry.end_date) && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarDays size={14} />

                          {entry.start_date || "—"}{" "}
                          → {entry.end_date || "—"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        openEditEntry(entry)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteEntry(entry)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid gap-5 p-5 md:grid-cols-2">
                  <InfoBlock
                    title="Learning Objectives"
                    value={entry.learning_objectives}
                  />

                  <InfoBlock
                    title="Learning Activities"
                    value={entry.learning_activities}
                  />

                  <InfoBlock
                    title="Resources"
                    value={entry.resources}
                  />

                  <InfoBlock
                    title="Assessment Methods"
                    value={entry.assessment_methods}
                  />

                  {entry.remarks && (
                    <InfoBlock
                      title="Remarks"
                      value={entry.remarks}
                    />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Entry modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingEntry
                    ? "Edit Weekly Entry"
                    : `Add Week ${form.week_number}`}
                </h2>

                <p className="text-sm text-slate-500">
                  Plan the teaching content for this week.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  label="Week Number"
                  name="week_number"
                  type="number"
                  min="1"
                  value={form.week_number}
                  onChange={handleChange}
                  required
                />

                <Field
                  label="Start Date"
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={handleChange}
                />

                <Field
                  label="End Date"
                  name="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={handleChange}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Topic"
                  name="topic"
                  value={form.topic}
                  onChange={handleChange}
                  required
                />

                <Field
                  label="Subtopic"
                  name="subtopic"
                  value={form.subtopic}
                  onChange={handleChange}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextArea
                  label="Learning Objectives"
                  name="learning_objectives"
                  value={form.learning_objectives}
                  onChange={handleChange}
                />

                <TextArea
                  label="Learning Activities"
                  name="learning_activities"
                  value={form.learning_activities}
                  onChange={handleChange}
                />

                <TextArea
                  label="Resources"
                  name="resources"
                  value={form.resources}
                  onChange={handleChange}
                />

                <TextArea
                  label="Assessment Methods"
                  name="assessment_methods"
                  value={form.assessment_methods}
                  onChange={handleChange}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Coverage Status
                  </span>

                  <select
                    name="coverage_status"
                    value={form.coverage_status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  >
                    <option value="planned">
                      Planned
                    </option>
                    <option value="partially_taught">
                      Partially Taught
                    </option>
                    <option value="taught">
                      Taught
                    </option>
                  </select>
                </label>

                <TextArea
                  label="Remarks"
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingEntry
                    ? "Save Changes"
                    : "Add Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ title, value }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </h3>

      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">
        {value || "—"}
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  min,
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
      />
    </label>
  );
}