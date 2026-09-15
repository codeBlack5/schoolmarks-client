import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock3,
  BookOpen,
  X,
} from "lucide-react";
import client from "../../api/client";
import { useAlert } from "../../context/AlertContext";

const initialForm = {
  grade_id: "",
  subject_id: "",
  term_id: "",
  lesson_date: "",
  lesson_number: "",
  topic: "",
  subtopic: "",
  learning_objectives: "",
  learning_activities: "",
  resources: "",
  assessment_evidence: "",
  teacher_reflection: "",
  status: "draft",
};

const statusStyles = {
  draft: {
    label: "Draft",
    className: "bg-yellow-100 text-yellow-700",
    icon: Clock3,
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
};

export default function TeacherLessonPlans() {
  const { confirm, notify } = useAlert();
  const [lessonPlans, setLessonPlans] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [terms, setTerms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [termFilter, setTermFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");

      const [plansResponse, classesResponse] = await Promise.all([
        client.get("/teacher/lesson_plans"),
        client.get("/teacher/classes"),
      ]);

      setLessonPlans(plansResponse.data?.data || []);
      setClasses(classesResponse.data?.classes || []);

      /*
       * Subjects and terms are loaded separately because the lesson-plan
       * endpoint intentionally returns plans rather than metadata.
       */
      const subjectsResponse = await client.get("/teacher/subjects");
      setSubjects(
        subjectsResponse.data?.subjects || []
      );

      /*
       * Use the existing school terms endpoint. If a teacher-only endpoint
       * is added later, this can be switched without changing the form.
       */
      const termsResponse = await client.get("/terms");
      setTerms(
        termsResponse.data || []
      );
    } catch (err) {
      console.error("Failed to load lesson plans:", err);

      setError(
        err.response?.data?.error ||
          "Unable to load your lesson plans."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();

    return lessonPlans.filter((plan) => {
      const matchesClass =
        classFilter === "all" ||
        String(plan.grade_id) === String(classFilter);

      const matchesSubject =
        subjectFilter === "all" ||
        String(plan.subject_id) === String(subjectFilter);

      const matchesTerm =
        termFilter === "all" ||
        String(plan.term_id) === String(termFilter);

      const matchesDate =
        !dateFilter ||
        plan.lesson_date === dateFilter;

      const matchesSearch =
        !query ||
        plan.topic?.toLowerCase().includes(query) ||
        plan.subtopic?.toLowerCase().includes(query) ||
        plan.subject_name?.toLowerCase().includes(query) ||
        plan.grade_name?.toLowerCase().includes(query);

      return (
        matchesClass &&
        matchesSubject &&
        matchesTerm &&
        matchesDate &&
        matchesSearch
      );
    });
  }, [
    lessonPlans,
    classFilter,
    subjectFilter,
    termFilter,
    dateFilter,
    search,
  ]);

  function openCreateForm() {
    setEditingPlan(null);

    setForm({
      ...initialForm,
      lesson_date: new Date().toISOString().split("T")[0],
    });

    setError("");
    setShowForm(true);
  }

  function openEditForm(plan) {
    setEditingPlan(plan);

    setForm({
      grade_id: plan.grade_id || "",
      subject_id: plan.subject_id || "",
      term_id: plan.term_id || "",
      lesson_date: plan.lesson_date || "",
      lesson_number: plan.lesson_number || "",
      topic: plan.topic || "",
      subtopic: plan.subtopic || "",
      learning_objectives: plan.learning_objectives || "",
      learning_activities: plan.learning_activities || "",
      resources: plan.resources || "",
      assessment_evidence: plan.assessment_evidence || "",
      teacher_reflection: plan.teacher_reflection || "",
      status: plan.status || "draft",
    });

    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingPlan(null);
    setForm(initialForm);
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
        lesson_plan: {
          ...form,
          lesson_number:
            form.lesson_number === ""
              ? null
              : Number(form.lesson_number),
        },
      };

      let response;

      if (editingPlan) {
        response = await client.patch(
          `/teacher/lesson_plans/${editingPlan.id}`,
          payload
        );
      } else {
        response = await client.post(
          "/teacher/lesson_plans",
          payload
        );
      }

      const savedPlan = response.data?.data;

      if (editingPlan) {
        setLessonPlans((current) =>
          current.map((plan) =>
            plan.id === savedPlan.id
              ? savedPlan
              : plan
          )
        );
      } else {
        setLessonPlans((current) => [
          savedPlan,
          ...current,
        ]);
      }

      closeForm();
    } catch (err) {
      console.error("Failed to save lesson plan:", err);

      const errors =
        err.response?.data?.errors;

      setError(
        Array.isArray(errors)
          ? errors.join(", ")
          : err.response?.data?.error ||
              "Unable to save the lesson plan."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deletePlan(plan) {
    const confirmed = await confirm({
      title: `Delete "${plan.topic}"?`,
      message:
        "This lesson plan will be permanently removed. This action cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });

    if (!confirmed) return;

    try {
      setError("");

      await client.delete(
        `/teacher/lesson_plans/${plan.id}`
      );

      setLessonPlans((current) =>
        current.filter(
          (item) => item.id !== plan.id
        )
      );

      notify({
        type: "success",
        message: "Lesson plan deleted.",
      });
    } catch (err) {
      console.error("Failed to delete lesson plan:", err);

      setError(
        err.response?.data?.error ||
          "Unable to delete the lesson plan."
      );
    }
  }

  function clearFilters() {
    setClassFilter("all");
    setSubjectFilter("all");
    setTermFilter("all");
    setDateFilter("");
    setSearch("");
  }

  const hasFilters =
    classFilter !== "all" ||
    subjectFilter !== "all" ||
    termFilter !== "all" ||
    dateFilter ||
    search;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="text-gray-600">
            Loading your lesson plans...
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
              <CalendarDays
                className="text-white"
                size={20}
              />
            </div>

            <div>
              <h1
                className="text-xl font-semibold"
                style={{
                  color: "var(--color-navy)",
                }}
              >
                Lesson Plans
              </h1>

              <p className="text-sm text-slate-500">
                Plan, organize and reflect on your lessons.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          New Lesson Plan
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <select
            value={classFilter}
            onChange={(event) =>
              setClassFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          >
            <option value="all">All classes</option>

            {classes.map((grade) => (
              <option
                key={grade.id}
                value={grade.id}
              >
                {grade.name}
              </option>
            ))}
          </select>

          <select
            value={subjectFilter}
            onChange={(event) =>
              setSubjectFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          >
            <option value="all">All subjects</option>

            {subjects.map((subject) => (
              <option
                key={subject.id}
                value={subject.id}
              >
                {subject.name}
              </option>
            ))}
          </select>

          <select
            value={termFilter}
            onChange={(event) =>
              setTermFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          >
            <option value="all">All terms</option>

            {terms.map((term) => (
              <option
                key={term.id}
                value={term.id}
              >
                {term.name} {term.year}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          />

          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search plans..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm"
            />
          </div>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<BookOpen size={20} />}
          label="Total Plans"
          value={lessonPlans.length}
        />

        <SummaryCard
          icon={<Clock3 size={20} />}
          label="Drafts"
          value={
            lessonPlans.filter(
              (plan) => plan.status === "draft"
            ).length
          }
        />

        <SummaryCard
          icon={<CheckCircle2 size={20} />}
          label="Completed"
          value={
            lessonPlans.filter(
              (plan) => plan.status === "completed"
            ).length
          }
        />
      </div>

      {/* Plans */}
      {filteredPlans.length === 0 ? (
        <EmptyState
          hasFilters={hasFilters}
          onCreate={openCreateForm}
        />
      ) : (
        <div className="space-y-4">
          {filteredPlans.map((plan) => (
            <LessonPlanCard
              key={plan.id}
              plan={plan}
              onEdit={openEditForm}
              onDelete={deletePlan}
            />
          ))}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <LessonPlanForm
          form={form}
          classes={classes}
          subjects={subjects}
          terms={terms}
          editingPlan={editingPlan}
          saving={saving}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
          {icon}
        </div>

        <div>
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

function LessonPlanCard({
  plan,
  onEdit,
  onDelete,
}) {
  const status =
    statusStyles[plan.status] ||
    statusStyles.draft;

  const StatusIcon = status.icon;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              {plan.grade_name}
            </span>

            <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              {plan.subject_name}
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium ${status.className}`}
            >
              <StatusIcon size={13} />
              {status.label}
            </span>
          </div>

          <h2 className="mt-3 text-lg font-semibold text-gray-900">
            {plan.topic}
          </h2>

          {plan.subtopic && (
            <p className="mt-1 text-sm text-gray-500">
              {plan.subtopic}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
            <span>
              {formatDate(plan.lesson_date)}
            </span>

            {plan.lesson_number && (
              <span>
                Lesson {plan.lesson_number}
              </span>
            )}

            <span>
              {plan.term_name} {plan.term_year}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(plan)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Pencil size={16} />
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(plan)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 border-t border-gray-100 pt-5 md:grid-cols-2">
        <Detail
          label="Learning Objectives"
          value={plan.learning_objectives}
        />

        <Detail
          label="Learning Activities"
          value={plan.learning_activities}
        />

        <Detail
          label="Resources"
          value={plan.resources}
        />

        <Detail
          label="Assessment Evidence"
          value={plan.assessment_evidence}
        />

        {plan.teacher_reflection && (
          <Detail
            label="Teacher Reflection"
            value={plan.teacher_reflection}
          />
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  if (!value) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-700">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ hasFilters, onCreate }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <CalendarDays
        className="mx-auto text-gray-400"
        size={42}
      />

      <h2 className="mt-4 font-semibold text-gray-900">
        {hasFilters
          ? "No lesson plans found"
          : "No lesson plans yet"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
        {hasFilters
          ? "Try changing your filters or search terms."
          : "Create your first lesson plan to start organizing your teaching."}
      </p>

      {!hasFilters && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Create Lesson Plan
        </button>
      )}
    </div>
  );
}

function LessonPlanForm({
  form,
  classes,
  subjects,
  terms,
  editingPlan,
  saving,
  onChange,
  onSubmit,
  onClose,
}) {
  const selectedGradeId = String(form.grade_id || "");

  const availableSubjects = subjects.filter(
    (subject) =>
      String(subject.grade?.id) === selectedGradeId
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className="flex min-h-full items-center justify-center py-8">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-4xl rounded-2xl bg-white shadow-xl"
        >
          {/* Modal header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {editingPlan
                  ? "Edit Lesson Plan"
                  : "New Lesson Plan"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Capture what you intend to teach and how you will assess learning.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form body */}
          <div className="grid gap-5 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Class" required>
                <select
                  name="grade_id"
                  value={form.grade_id}
                  onChange={onChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              </Field>

              <Field label="Subject" required>
                <select
                  name="subject_id"
                  value={form.subject_id}
                  onChange={onChange}
                  required
                  disabled={!form.grade_id}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
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
              </Field>

              <Field label="Term" required>
                <select
                  name="term_id"
                  value={form.term_id}
                  onChange={onChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Lesson Date" required>
                <input
                  type="date"
                  name="lesson_date"
                  value={form.lesson_date}
                  onChange={onChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </Field>

              <Field label="Lesson Number">
                <input
                  type="number"
                  name="lesson_number"
                  value={form.lesson_number}
                  onChange={onChange}
                  min="1"
                  placeholder="e.g. 1"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </Field>

              <Field label="Status">
                <select
                  name="status"
                  value={form.status}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="draft">
                    Draft
                  </option>

                  <option value="completed">
                    Completed
                  </option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Topic" required>
                <input
                  type="text"
                  name="topic"
                  value={form.topic}
                  onChange={onChange}
                  required
                  placeholder="e.g. Forces and motion"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </Field>

              <Field label="Subtopic">
                <input
                  type="text"
                  name="subtopic"
                  value={form.subtopic}
                  onChange={onChange}
                  placeholder="Optional subtopic"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </Field>
            </div>

            <TextArea
              label="Learning Objectives"
              name="learning_objectives"
              value={form.learning_objectives}
              onChange={onChange}
              placeholder="What should learners know, understand or be able to do?"
            />

            <TextArea
              label="Learning Activities"
              name="learning_activities"
              value={form.learning_activities}
              onChange={onChange}
              placeholder="Describe the teaching and learner activities."
            />

            <TextArea
              label="Resources"
              name="resources"
              value={form.resources}
              onChange={onChange}
              placeholder="Textbooks, charts, ICT tools, practical materials..."
            />

            <TextArea
              label="Assessment Evidence"
              name="assessment_evidence"
              value={form.assessment_evidence}
              onChange={onChange}
              placeholder="How will you know that learning has taken place?"
            />

            <TextArea
              label="Teacher Reflection"
              name="teacher_reflection"
              value={form.teacher_reflection}
              onChange={onChange}
              placeholder="Add this after the lesson if needed."
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingPlan
                  ? "Save Changes"
                  : "Create Lesson Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
  placeholder,
}) {
  return (
    <Field label={label}>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        placeholder={placeholder}
        className="form-input resize-y"
      />
    </Field>
  );
}

function formatDate(value) {
  if (!value) return "";

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
