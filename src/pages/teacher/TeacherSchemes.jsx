import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Clock3,
  PlayCircle,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import client from "../../api/client";
import { useAlert } from "../../context/AlertContext";

const initialForm = {
  grade_id: "",
  subject_id: "",
  term_id: "",
  title: "",
  status: "draft",
};

const statusStyles = {
  draft: {
    label: "Draft",
    className: "bg-yellow-100 text-yellow-700",
    icon: Clock3,
  },
  active: {
    label: "Active",
    className: "bg-blue-100 text-blue-700",
    icon: PlayCircle,
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
};

export default function TeacherSchemes() {
  const navigate = useNavigate();
  const { confirm, notify } = useAlert();

  const [schemes, setSchemes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [terms, setTerms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [termFilter, setTermFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        schemesResponse,
        classesResponse,
        subjectsResponse,
        termsResponse,
      ] = await Promise.all([
        client.get("/teacher/schemes"),
        client.get("/teacher/classes"),
        client.get("/teacher/subjects"),
        client.get("/terms"),
      ]);

      setSchemes(schemesResponse.data?.data || []);
      setClasses(classesResponse.data?.classes || []);
      setSubjects(subjectsResponse.data?.subjects || []);
      setTerms(termsResponse.data || []);
    } catch (err) {
      console.error("Failed to load schemes:", err);

      setError(
        err.response?.data?.error ||
          "Unable to load your schemes of work."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredSchemes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return schemes.filter((scheme) => {
      const matchesClass =
        classFilter === "all" ||
        String(scheme.grade_id) === String(classFilter);

      const matchesSubject =
        subjectFilter === "all" ||
        String(scheme.subject_id) === String(subjectFilter);

      const matchesTerm =
        termFilter === "all" ||
        String(scheme.term_id) === String(termFilter);

      const matchesStatus =
        statusFilter === "all" ||
        scheme.status === statusFilter;

      const matchesSearch =
        !query ||
        scheme.title?.toLowerCase().includes(query) ||
        scheme.grade_name?.toLowerCase().includes(query) ||
        scheme.subject_name?.toLowerCase().includes(query) ||
        scheme.term_name?.toLowerCase().includes(query);

      return (
        matchesClass &&
        matchesSubject &&
        matchesTerm &&
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    schemes,
    classFilter,
    subjectFilter,
    termFilter,
    statusFilter,
    search,
  ]);

  function openCreateForm() {
    setEditingScheme(null);
    setForm(initialForm);
    setError("");
    setShowForm(true);
  }

  function openEditForm(scheme) {
    setEditingScheme(scheme);

    setForm({
      grade_id: scheme.grade_id || "",
      subject_id: scheme.subject_id || "",
      term_id: scheme.term_id || "",
      title: scheme.title || "",
      status: scheme.status || "draft",
    });

    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingScheme(null);
    setForm(initialForm);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  /*
   * The teacher should only see subjects belonging to the selected
   * grade. This also prevents accidentally creating a mismatched
   * grade/subject combination.
   */
  const availableSubjects = useMemo(() => {
    if (!form.grade_id || !Array.isArray(subjects)) {
      return [];
    }

    return subjects.filter(
      (subject) =>
        String(subject.grade_id) === String(form.grade_id)
    );
  }, [subjects, form.grade_id]);

  /*
   * Reset the subject when the grade changes and the selected subject
   * no longer belongs to that grade.
   */
  useEffect(() => {
    if (!form.grade_id || !form.subject_id) return;

    const stillValid = availableSubjects.some(
      (subject) =>
        String(subject.id) === String(form.subject_id)
    );

    if (!stillValid) {
      setForm((current) => ({
        ...current,
        subject_id: "",
      }));
    }
  }, [form.grade_id, form.subject_id, availableSubjects]);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        scheme_of_work: {
          grade_id: Number(form.grade_id),
          subject_id: Number(form.subject_id),
          term_id: Number(form.term_id),
          title: form.title.trim(),
          status: form.status,
        },
      };

      let response;

      if (editingScheme) {
        response = await client.patch(
          `/teacher/schemes/${editingScheme.id}`,
          payload
        );
      } else {
        response = await client.post(
          "/teacher/schemes",
          payload
        );
      }

      const savedScheme = response.data?.data;

      if (editingScheme) {
        setSchemes((current) =>
          current.map((scheme) =>
            scheme.id === savedScheme.id
              ? savedScheme
              : scheme
          )
        );
      } else {
        setSchemes((current) => [
          savedScheme,
          ...current,
        ]);
      }

      closeForm();

      notify({
        type: "success",
        message: editingScheme
          ? "Scheme of work updated."
          : "Scheme of work created.",
      });
    } catch (err) {
      console.error("Failed to save scheme:", err);

      const errors = err.response?.data?.errors;

      setError(
        Array.isArray(errors)
          ? errors.join(", ")
          : err.response?.data?.error ||
              "Unable to save the scheme of work."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteScheme(scheme) {
    const confirmed = await confirm({
      title: `Delete "${scheme.title}"?`,
      message:
        "This will permanently delete the scheme and all of its weekly entries. This action cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });

    if (!confirmed) return;

    try {
      setError("");

      await client.delete(
        `/teacher/schemes/${scheme.id}`
      );

      setSchemes((current) =>
        current.filter(
          (item) => item.id !== scheme.id
        )
      );

      notify({
        type: "success",
        message: "Scheme of work deleted.",
      });
    } catch (err) {
      console.error("Failed to delete scheme:", err);

      setError(
        err.response?.data?.error ||
          "Unable to delete the scheme of work."
      );
    }
  }

  function clearFilters() {
    setClassFilter("all");
    setSubjectFilter("all");
    setTermFilter("all");
    setStatusFilter("all");
    setSearch("");
  }

  const hasFilters =
    classFilter !== "all" ||
    subjectFilter !== "all" ||
    termFilter !== "all" ||
    statusFilter !== "all" ||
    search;

  function coveragePercent(scheme) {
    if (!scheme.entries_count) return 0;

    /*
     * The list endpoint currently returns entries_count only.
     * We therefore display entry availability here rather than
     * pretending that entries_count represents syllabus coverage.
     */
    return scheme.entries_count > 0 ? 100 : 0;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="text-gray-600">
            Loading your schemes of work...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{
                backgroundColor: "var(--color-navy)",
              }}
            >
              <BookOpen
                className="text-white"
                size={20}
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Schemes of Work
              </h1>
              <p className="text-sm text-slate-500">
                Plan, organise and track your teaching coverage.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus size={18} />
          New Scheme
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search schemes..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <select
            value={classFilter}
            onChange={(event) =>
              setClassFilter(event.target.value)
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All Classes</option>

            {classes.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </select>

          <select
            value={subjectFilter}
            onChange={(event) =>
              setSubjectFilter(event.target.value)
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All Subjects</option>

            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>

          <select
            value={termFilter}
            onChange={(event) =>
              setTermFilter(event.target.value)
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All Terms</option>

            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name} {term.year}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Scheme cards */}
      {filteredSchemes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <BookOpen
            className="mx-auto mb-3 text-slate-400"
            size={36}
          />

          <h2 className="text-lg font-semibold text-slate-800">
            No schemes found
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Create a scheme of work for one of your classes and
            subjects to start planning your term.
          </p>

          <button
            type="button"
            onClick={openCreateForm}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={17} />
            Create Scheme
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredSchemes.map((scheme) => {
            const status =
              statusStyles[scheme.status] ||
              statusStyles.draft;

            const StatusIcon = status.icon;
            const coverage = coveragePercent(scheme);

            return (
              <div
                key={scheme.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/teacher/schemes/${scheme.id}`
                      )
                    }
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {scheme.grade_name}
                    </p>

                    <h2 className="mt-1 truncate text-lg font-bold text-slate-900">
                      {scheme.subject_name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {scheme.term_name} {scheme.term_year}
                    </p>
                  </button>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                  >
                    <StatusIcon size={14} />
                    {status.label}
                  </span>
                </div>

                <p className="mt-4 text-sm font-medium text-slate-700">
                  {scheme.title}
                </p>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Weekly entries
                    </span>

                    <span className="font-semibold text-slate-700">
                      {scheme.entries_count || 0}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-700 transition-all"
                      style={{
                        width: `${coverage}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        openEditForm(scheme)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteScheme(scheme)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/teacher/schemes/${scheme.id}`
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Open
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingScheme
                    ? "Edit Scheme of Work"
                    : "New Scheme of Work"}
                </h2>

                <p className="text-sm text-slate-500">
                  Set the class, subject and term for this scheme.
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

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Class
                  </span>

                  <select
                    name="grade_id"
                    value={form.grade_id}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  >
                    <option value="">
                      Select class
                    </option>

                    {classes.map((grade) => (
                      <option
                        key={grade.id}
                        value={grade.id}
                      >
                        {grade.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Subject
                  </span>

                  <select
                    name="subject_id"
                    value={form.subject_id}
                    onChange={handleChange}
                    required
                    disabled={!form.grade_id}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-100"
                  >
                    <option value="">
                      {form.grade_id
                        ? "Select subject"
                        : "Select class first"}
                    </option>

                    {availableSubjects.map((subject) => (
                      <option
                        key={subject.id}
                        value={subject.id}
                      >
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Term
                  </span>

                  <select
                    name="term_id"
                    value={form.term_id}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  >
                    <option value="">
                      Select term
                    </option>

                    {terms.map((term) => (
                      <option
                        key={term.id}
                        value={term.id}
                      >
                        {term.name} {term.year}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Status
                  </span>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">
                      Completed
                    </option>
                  </select>
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">
                  Scheme Title
                </span>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. GRADE 6 KISWAHILI — TERM 1 2026"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                />
              </label>

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
                    : editingScheme
                    ? "Save Changes"
                    : "Create Scheme"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}