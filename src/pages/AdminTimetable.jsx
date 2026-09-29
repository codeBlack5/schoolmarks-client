import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  Plus,
  X,
  Save,
  ChevronRight,
} from "lucide-react";
import api from "../api/client";

function AdminTimetable() {
  const navigate = useNavigate();

  const [timetables, setTimetables] = useState([]);
  const [terms, setTerms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    term_id: "",
    name: "",
    status: "draft",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [timetablesResponse, termsResponse] =
        await Promise.all([
          api.get("/timetables"),
          api.get("/terms"),
        ]);

      setTimetables(
        Array.isArray(timetablesResponse.data)
          ? timetablesResponse.data
          : []
      );

      setTerms(
        Array.isArray(termsResponse.data)
          ? termsResponse.data
          : []
      );
    } catch (err) {
      console.error("Failed to load timetable data:", err);

      setError(
        err?.response?.data?.error ||
          "Unable to load school timetables."
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setForm({
      term_id: terms[0]?.id ? String(terms[0].id) : "",
      name: "",
      status: "draft",
    });

    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setFormError("");
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

    setSaving(true);
    setFormError("");

    try {
      await api.post("/timetables", {
        timetable: {
          ...form,
          term_id: Number(form.term_id),
        },
      });

      setShowForm(false);
      await loadData();
    } catch (err) {
      console.error("Failed to create timetable:", err);

      const errors = err?.response?.data?.errors;

      if (Array.isArray(errors) && errors.length > 0) {
        setFormError(errors.join(", "));
      } else {
        setFormError(
          err?.response?.data?.error ||
            "Unable to create timetable."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-slate-500">
          Loading school timetables...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full min-w-0 space-y-5 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-slate-700" />

              <h1 className="break-words text-xl font-bold text-slate-900 sm:text-2xl">
                School Timetable
              </h1>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Manage the official teaching timetable for your school.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Create Timetable
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {timetables.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No school timetable yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Create the official timetable for a school term,
              then add lessons and publish it for teachers.
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Create Timetable
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {timetables.map((timetable) => (
              <div
                key={timetable.id}
                className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100">
                    <CalendarDays className="h-5 w-5 text-slate-700" />
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
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

                <h2 className="mt-4 break-words font-semibold text-slate-900">
                  {timetable.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {timetable.term?.name}{" "}
                  {timetable.term?.year}
                </p>

                <div className="mt-4 flex min-w-0 items-start gap-2 text-sm text-slate-500">
                  <Clock3 className="h-4 w-4" />
                  <span>
                    {timetable.entries_count || 0} scheduled lessons
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/timetable/${timetable.id}`)}
                  className="mt-5 flex min-h-11 w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <span>Open Timetable</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-3 sm:p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Create School Timetable
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create the official timetable for a term.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="min-h-10 min-w-10 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-4 sm:p-6"
            >
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Term
                </label>

                <select
                  name="term_id"
                  value={form.term_id}
                  onChange={handleChange}
                  required
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 sm:text-sm"
                >
                  <option value="">Select term</option>

                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name} {term.year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Timetable Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 2026 Term 2 Main School Timetable"
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 sm:text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 sm:text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="min-h-11 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Creating..." : "Create Timetable"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminTimetable;
