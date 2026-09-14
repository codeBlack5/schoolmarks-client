import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Loader2,
  Plus,
  Target,
  User,
  XCircle,
} from "lucide-react";

import client from "../../api/client";

const STATUS_OPTIONS = [
  {
    value: "planned",
    label: "Planned",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "discontinued",
    label: "Discontinued",
  },
];

const STATUS_STYLES = {
  planned: "bg-blue-50 text-blue-700 border-blue-200",
  active: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  discontinued: "bg-gray-100 text-gray-600 border-gray-200",
};

const EMPTY_FORM = {
  subject_id: "",
  reason: "",
  baseline_score: "",
  target_score: "",
  strategy: "",
  action_taken: "",
  start_date: "",
  review_date: "",
  status: "planned",
  outcome: "",
  notes: "",
};

export default function TeacherStudentInterventions() {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [studentResponse, interventionsResponse] =
          await Promise.all([
            client.get(`/teacher/students/${id}`),
            client.get(`/teacher/students/${id}/interventions`),
          ]);

        if (!mounted) return;

        setStudent(studentResponse.data);
        setInterventions(
          interventionsResponse.data?.interventions || []
        );
      } catch (err) {
        console.error(
          "Failed to load student interventions:",
          err
        );

        if (mounted) {
          setError(
            err.response?.data?.error ||
              "Unable to load student interventions."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadData();
    } else {
      setError("Student ID is missing.");
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  const subjects = useMemo(() => {
    const candidates = [];

    if (Array.isArray(student?.subjects)) {
      candidates.push(...student.subjects);
    }

    if (Array.isArray(student?.performance)) {
      candidates.push(...student.performance);
    }

    const unique = new Map();

    candidates.forEach((subject) => {
      const subjectId =
        subject?.id ??
        subject?.subject_id ??
        subject?.subject?.id;

      const subjectName =
        subject?.name ??
        subject?.subject_name ??
        subject?.subject?.name;

      if (subjectId && subjectName) {
        unique.set(String(subjectId), {
          id: subjectId,
          name: subjectName,
        });
      }
    });

    return Array.from(unique.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [student]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateForm() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      start_date: todayString(),
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(intervention) {
    setEditingId(intervention.id);

    setForm({
      subject_id: intervention.subject?.id || "",
      reason: intervention.reason || "",
      baseline_score:
        intervention.baseline_score ?? "",
      target_score:
        intervention.target_score ?? "",
      strategy: intervention.strategy || "",
      action_taken:
        intervention.action_taken || "",
      start_date:
        intervention.start_date || "",
      review_date:
        intervention.review_date || "",
      status: intervention.status || "planned",
      outcome: intervention.outcome || "",
      notes: intervention.notes || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  const [reviewingIntervention, setReviewingIntervention] =
  useState(null);

const [reviewForm, setReviewForm] = useState({
  review_date: todayString(),
  current_evidence: "",
  what_worked: "",
  what_did_not_work: "",
  comment: "",
  decision: "continue",
  next_review_date: "",
});

const [reviewSaving, setReviewSaving] = useState(false);

function openReviewForm(intervention, decision) {
  const subjectId = intervention.subject?.id;

  const latestMark = Array.isArray(student?.marks)
    ? student.marks.find(
        (mark) =>
          mark?.subject?.id === subjectId &&
          ["present", "incomplete"].includes(
            mark?.status
          ) &&
          mark?.percentage !== null &&
          mark?.percentage !== undefined
      )
    : null;

  setReviewingIntervention(intervention);

  setReviewForm({
    review_date: todayString(),
    current_evidence:
      latestMark?.percentage !== null &&
      latestMark?.percentage !== undefined
        ? String(latestMark.percentage)
        : "",
    what_worked: "",
    what_did_not_work: "",
    comment: "",
    decision,
    next_review_date: "",
  });

  setError("");
  setSuccess("");
}

function closeReviewForm() {
  if (reviewSaving) return;

  setReviewingIntervention(null);

  setReviewForm({
    review_date: todayString(),
    current_evidence: "",
    what_worked: "",
    what_did_not_work: "",
    comment: "",
    decision: "continue",
    next_review_date: "",
  });
}

function updateReviewField(field, value) {
  setReviewForm((current) => ({
    ...current,
    [field]: value,
  }));
}

async function handleReviewSubmit(event) {
  event.preventDefault();

  if (!reviewingIntervention) return;

  try {
    setReviewSaving(true);
    setError("");
    setSuccess("");

    const response = await client.post(
      `/teacher/interventions/${reviewingIntervention.id}/reviews`,
      {
        review: {
          review_date: reviewForm.review_date,
          current_evidence:
            reviewForm.current_evidence === ""
              ? null
              : Number(reviewForm.current_evidence),
          what_worked:
            reviewForm.what_worked || null,
          what_did_not_work:
            reviewForm.what_did_not_work || null,
          comment:
            reviewForm.comment || null,
          decision: reviewForm.decision,
          next_review_date:
            reviewForm.next_review_date || null,
        },
      }
    );

    const updatedIntervention = response.data?.intervention;

    setInterventions((current) =>
      current.map((item) =>
        item.id === reviewingIntervention.id
          ? {
              ...item,
              status:
                updatedIntervention?.status ||
                item.status,
            }
          : item
      )
    );

    const decisionLabels = {
      continue: "Intervention continued.",
      modify_strategy:
        "Intervention strategy marked for modification.",
      complete: "Intervention completed.",
      discontinue: "Intervention discontinued.",
    };

    setSuccess(
      decisionLabels[reviewForm.decision] ||
        "Intervention review recorded successfully."
    );

    closeReviewForm();
  } catch (err) {
    console.error(
      "Failed to save intervention review:",
      err
    );

    const validationErrors =
      err.response?.data?.errors;

    setError(
      Array.isArray(validationErrors)
        ? validationErrors.join(", ")
        : err.response?.data?.error ||
            "Unable to save intervention review."
    );
  } finally {
    setReviewSaving(false);
  }
}

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingId) {
        const response = await client.patch(
          `/teacher/interventions/${editingId}`,
          {
            intervention: {
              reason: form.reason,
              baseline_score:
                form.baseline_score === ""
                  ? null
                  : Number(form.baseline_score),
              target_score:
                form.target_score === ""
                  ? null
                  : Number(form.target_score),
              strategy: form.strategy,
              action_taken:
                form.action_taken || null,
              start_date: form.start_date,
              review_date:
                form.review_date || null,
              status: form.status,
              outcome: form.outcome || null,
              notes: form.notes || null,
            },
          }
        );

        setInterventions((current) =>
          current.map((item) =>
            item.id === editingId
              ? response.data
              : item
          )
        );

        setSuccess("Intervention updated successfully.");
      } else {
        const response = await client.post(
          `/teacher/students/${id}/interventions`,
          {
            intervention: {
              subject_id: Number(form.subject_id),
              reason: form.reason,
              baseline_score:
                form.baseline_score === ""
                  ? null
                  : Number(form.baseline_score),
              target_score:
                form.target_score === ""
                  ? null
                  : Number(form.target_score),
              strategy: form.strategy,
              action_taken:
                form.action_taken || null,
              start_date: form.start_date,
              review_date:
                form.review_date || null,
              status: form.status,
              outcome: form.outcome || null,
              notes: form.notes || null,
            },
          }
        );

        setInterventions((current) => [
          response.data,
          ...current,
        ]);

        setSuccess("Intervention created successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error(
        "Failed to save intervention:",
        err
      );

      const validationErrors =
        err.response?.data?.errors;

      setError(
        Array.isArray(validationErrors)
          ? validationErrors.join(", ")
          : err.response?.data?.error ||
              "Unable to save intervention."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2
            size={28}
            className="animate-spin text-blue-600"
          />
                  {reviewingIntervention && (
          <InterventionReviewForm
            intervention={reviewingIntervention}
            form={reviewForm}
            saving={reviewSaving}
            onChange={updateReviewField}
            onSubmit={handleReviewSubmit}
            onCancel={closeReviewForm}
          />
        )}
        </div>
      </PageShell>
    );
  }

  if (error && !student) {
    return (
      <PageShell>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>
      </PageShell>
    );
  }

  const activeCount = interventions.filter(
    (item) => item.status === "active"
  ).length;

  const completedCount = interventions.filter(
    (item) => item.status === "completed"
  ).length;

  return (
    <PageShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              to={`/teacher/students/${id}`}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600"
            >
              <ArrowLeft size={16} />
              Back to student profile
            </Link>

            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Target size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Interventions
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  {student?.student?.name ||
                    student?.name ||
                    "Student"}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            New intervention
          </button>
        </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total interventions"
            value={interventions.length}
            icon={ClipboardList}
          />

          <SummaryCard
            label="Active"
            value={activeCount}
            icon={Target}
          />

          <SummaryCard
            label="Completed"
            value={completedCount}
            icon={CheckCircle2}
          />
        </div>

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {error && student && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <InterventionForm
            form={form}
            subjects={subjects}
            editing={Boolean(editingId)}
            saving={saving}
            onChange={updateField}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        )}

        {/* Intervention list */}
        {interventions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <div className="mx-auto mb-4 w-fit rounded-full bg-amber-50 p-4 text-amber-600">
              <Target size={28} />
            </div>

            <h2 className="text-lg font-semibold text-gray-900">
              No interventions recorded
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              When a student needs targeted academic
              support, create an intervention here and
              track it through review and completion.
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={17} />
              Create intervention
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {interventions.map((intervention) => (
              <InterventionCard
                key={intervention.id}
                intervention={intervention}
                student={student}
                onEdit={openEditForm}
                onReviewDecision={openReviewForm}
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function InterventionForm({
  form,
  subjects,
  editing,
  saving,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {editing
              ? "Update intervention"
              : "Create intervention"}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Record the concern, target, strategy and
            follow-up plan.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <XCircle size={20} />
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {!editing && (
          <Field label="Subject" required>
            <select
              required
              value={form.subject_id}
              onChange={(event) =>
                onChange(
                  "subject_id",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="">
                Select subject
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

            {!subjects.length && (
              <p className="mt-1 text-xs text-amber-600">
                No visible subjects were found for this
                student.
              </p>
            )}
          </Field>
        )}

        <Field label="Status" required>
          <select
            required
            value={form.status}
            onChange={(event) =>
              onChange("status", event.target.value)
            }
            className={inputClass}
          >
            {STATUS_OPTIONS.map((status) => (
              <option
                key={status.value}
                value={status.value}
              >
                {status.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Baseline score (%)"
          hint="Optional"
        >
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.baseline_score}
            onChange={(event) =>
              onChange(
                "baseline_score",
                event.target.value
              )
            }
            className={inputClass}
            placeholder="e.g. 42"
          />
        </Field>

        <Field
          label="Target score (%)"
          hint="Optional"
        >
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.target_score}
            onChange={(event) =>
              onChange(
                "target_score",
                event.target.value
              )
            }
            className={inputClass}
            placeholder="e.g. 65"
          />
        </Field>

        <Field label="Start date" required>
          <input
            type="date"
            required
            value={form.start_date}
            onChange={(event) =>
              onChange(
                "start_date",
                event.target.value
              )
            }
            className={inputClass}
          />
        </Field>

        <Field label="Review date">
          <input
            type="date"
            value={form.review_date}
            onChange={(event) =>
              onChange(
                "review_date",
                event.target.value
              )
            }
            className={inputClass}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Reason / identified need" required>
            <textarea
              required
              rows={3}
              value={form.reason}
              onChange={(event) =>
                onChange(
                  "reason",
                  event.target.value
                )
              }
              className={textareaClass}
              placeholder="Describe the learning need or concern."
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Intervention strategy" required>
            <textarea
              required
              rows={4}
              value={form.strategy}
              onChange={(event) =>
                onChange(
                  "strategy",
                  event.target.value
                )
              }
              className={textareaClass}
              placeholder="Describe the targeted support that will be provided."
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Action taken">
            <textarea
              rows={3}
              value={form.action_taken}
              onChange={(event) =>
                onChange(
                  "action_taken",
                  event.target.value
                )
              }
              className={textareaClass}
              placeholder="Record support already provided."
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Outcome">
            <textarea
              rows={3}
              value={form.outcome}
              onChange={(event) =>
                onChange(
                  "outcome",
                  event.target.value
                )
              }
              className={textareaClass}
              placeholder="Record the result when the intervention is reviewed."
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Notes">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) =>
                onChange("notes", event.target.value)
              }
              className={textareaClass}
              placeholder="Additional notes."
            />
          </Field>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving || (!editing && !form.subject_id)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && (
            <Loader2
              size={16}
              className="animate-spin"
            />
          )}

          {editing
            ? "Save changes"
            : "Create intervention"}
        </button>
      </div>
    </form>
  );
}

function InterventionCard({
  intervention,
  student,
  onEdit,
  onReviewDecision,
}) {
  const statusStyle =
    STATUS_STYLES[intervention.status] ||
    STATUS_STYLES.planned;

  const subjectId = intervention.subject?.id;

  const subjectMarks = Array.isArray(student?.marks)
    ? student.marks
        .filter(
          (mark) =>
            mark?.subject?.id === subjectId &&
            ["present", "incomplete"].includes(
              mark?.status
            ) &&
            mark?.percentage !== null &&
            mark?.percentage !== undefined
        )
    : [];

  const latestMark = subjectMarks[0] || null;

  const baseline =
    intervention.baseline_score !== null &&
    intervention.baseline_score !== undefined
      ? Number(intervention.baseline_score)
      : null;

  const target =
    intervention.target_score !== null &&
    intervention.target_score !== undefined
      ? Number(intervention.target_score)
      : null;

  const current =
    latestMark?.percentage !== null &&
    latestMark?.percentage !== undefined
      ? Number(latestMark.percentage)
      : null;

  const improvement =
    baseline !== null && current !== null
      ? Number((current - baseline).toFixed(2))
      : null;

  const targetReached =
    target !== null &&
    current !== null &&
    current >= target;

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
            <Target size={20} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">
              {intervention.subject?.name || "Subject"}
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Created by{" "}
              {intervention.created_by?.name || "Teacher"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusStyle}`}
          >
            {intervention.status}
          </span>

          <button
            type="button"
            onClick={() => onEdit(intervention)}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-blue-600"
            title="Edit intervention"
          >
            <Edit3 size={16} />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              Intervention progress
            </h4>

            <p className="mt-1 text-xs text-gray-500">
              Based on the latest recorded {intervention.subject?.name} mark.
            </p>
          </div>

          {targetReached && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              Target achieved
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <InfoBlock
            label="Baseline"
            value={
              baseline !== null
                ? `${baseline}%`
                : "Not recorded"
            }
          />

          <InfoBlock
            label="Current"
            value={
              current !== null
                ? `${current}%`
                : "No assessment"
            }
          />

          <InfoBlock
            label="Target"
            value={
              target !== null
                ? `${target}%`
                : "Not recorded"
            }
          />
        </div>

        {current !== null && baseline !== null && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-600">
                Progress from baseline
              </span>

              <span
                className={`font-semibold ${
                  improvement >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {improvement >= 0 ? "+" : ""}
                {improvement} points
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{
                  width: `${Math.min(
                    Math.max(current, 0),
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {latestMark ? (
          <p className="mt-3 text-xs text-gray-500">
            Latest assessment:{" "}
            <span className="font-medium text-gray-700">
              {latestMark.assessment?.name || "Assessment"}
            </span>
          </p>
        ) : (
          <p className="mt-3 text-xs text-amber-600">
            No post-intervention assessment has been recorded yet.
          </p>
        )}
      </div>

      {/* Intervention details */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <InfoBlock
          label="Review date"
          value={
            intervention.review_date
              ? formatDate(intervention.review_date)
              : "Not set"
          }
          icon={Calendar}
        />

        <InfoBlock
          label="Started"
          value={
            intervention.start_date
              ? formatDate(intervention.start_date)
              : "Not recorded"
          }
        />

        <InfoBlock
          label="Created by"
          value={
            intervention.created_by?.name || "Teacher"
          }
        />
      </div>

      <div className="mt-5 space-y-4">
        <TextSection
          label="Identified need"
          value={intervention.reason}
        />

        <TextSection
          label="Strategy"
          value={intervention.strategy}
        />

        {intervention.action_taken && (
          <TextSection
            label="Action taken"
            value={intervention.action_taken}
          />
        )}

        {intervention.outcome && (
          <TextSection
            label="Outcome"
            value={intervention.outcome}
          />
        )}

        {intervention.notes && (
          <TextSection
            label="Notes"
            value={intervention.notes}
          />
        )}
      </div>

      {/* Review actions */}
      {/* Review actions */}
      <div className="mt-5 border-t border-gray-100 pt-4">
        <p className="mb-3 text-sm font-semibold text-gray-800">
          Review decision
        </p>

        <p className="mb-3 text-xs text-gray-500">
          Record a teacher review before changing the
          intervention outcome.
        </p>

        <div className="flex flex-wrap gap-2">
          {intervention.status !== "completed" &&
            intervention.status !== "discontinued" && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    onReviewDecision(
                      intervention,
                      "continue"
                    )
                  }
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  Continue intervention
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onReviewDecision(
                      intervention,
                      "modify_strategy"
                    )
                  }
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                >
                  Modify strategy
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onReviewDecision(
                      intervention,
                      "complete"
                    )
                  }
                  className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100"
                >
                  Mark completed
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onReviewDecision(
                      intervention,
                      "discontinue"
                    )
                  }
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Discontinue
                </button>
              </>
            )}

          {intervention.status === "completed" && (
            <span className="text-xs font-medium text-green-700">
              This intervention has been completed.
            </span>
          )}

          {intervention.status === "discontinued" && (
            <span className="text-xs font-medium text-gray-600">
              This intervention has been discontinued.
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function InterventionReviewForm({
  intervention,
  form,
  saving,
  onChange,
  onSubmit,
  onCancel,
}) {
  const decisionLabels = {
    continue: "Continue",
    modify_strategy: "Modify strategy",
    complete: "Complete",
    discontinue: "Discontinue",
  };

  const requiresNextReview =
    form.decision === "continue" ||
    form.decision === "modify_strategy";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/40"
          onClick={saving ? undefined : onCancel}
        />

        <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-xl">
          <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Review intervention
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {intervention.subject?.name || "Subject"}{" "}
                  intervention
                </p>
              </div>

              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                aria-label="Close review form"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="max-h-[80vh] overflow-y-auto"
          >
            <div className="space-y-5 px-5 py-5 sm:px-6">
              {/* Review date + evidence */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Review date
                  </label>

                  <input
                    type="date"
                    value={form.review_date}
                    onChange={(event) =>
                      onChange(
                        "review_date",
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Current evidence (%)
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.current_evidence}
                    onChange={(event) =>
                      onChange(
                        "current_evidence",
                        event.target.value
                      )
                    }
                    placeholder="e.g. 83.33"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Pre-filled from the latest recorded
                    assessment where available.
                  </p>
                </div>
              </div>

              {/* What worked */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  What worked?
                </label>

                <textarea
                  value={form.what_worked}
                  onChange={(event) =>
                    onChange(
                      "what_worked",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Describe strategies or support that helped the student."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* What did not work */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  What did not work?
                </label>

                <textarea
                  value={form.what_did_not_work}
                  onChange={(event) =>
                    onChange(
                      "what_did_not_work",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Describe challenges, gaps, or strategies that were not effective."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Teacher comment */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Teacher's review / comment
                </label>

                <textarea
                  value={form.comment}
                  onChange={(event) =>
                    onChange(
                      "comment",
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Summarize your professional judgement about the intervention."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Decision */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Decision
                </label>

                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(decisionLabels).map(
                    ([value, label]) => {
                      const selected =
                        form.decision === value;

                      return (
                        <label
                          key={value}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                            selected
                              ? "border-blue-300 bg-blue-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="intervention-review-decision"
                            value={value}
                            checked={selected}
                            onChange={(event) =>
                              onChange(
                                "decision",
                                event.target.value
                              )
                            }
                            className="h-4 w-4"
                          />

                          <span className="text-sm font-medium text-gray-800">
                            {label}
                          </span>
                        </label>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Next review date */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Next review date
                  {requiresNextReview && (
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  )}
                </label>

                <input
                  type="date"
                  value={form.next_review_date}
                  onChange={(event) =>
                    onChange(
                      "next_review_date",
                      event.target.value
                    )
                  }
                  required={requiresNextReview}
                  disabled={!requiresNextReview}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                />

                <p className="mt-1 text-xs text-gray-500">
                  A next review is required when continuing
                  or modifying the intervention.
                </p>
              </div>

              {/* Existing intervention summary */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Intervention target
                </p>

                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">
                      Baseline
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {intervention.baseline_score !==
                        null &&
                      intervention.baseline_score !==
                        undefined
                        ? `${intervention.baseline_score}%`
                        : "Not recorded"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Target
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {intervention.target_score !==
                        null &&
                      intervention.target_score !==
                        undefined
                        ? `${intervention.target_score}%`
                        : "Not recorded"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Subject
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {intervention.subject?.name ||
                        "Subject"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                {saving
                  ? "Saving review..."
                  : "Save review"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
        {Icon && <Icon size={14} />}
        {value}
      </div>
    </div>
  );
}

function TextSection({ label, value }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-800">
        {label}
      </h4>

      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  required = false,
hint,
  children,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}

        {hint && (
          <span className="ml-2 text-xs font-normal text-gray-400">
            {hint}
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {children}
      </div>
    </div>
  );
}

function todayString() {
  const date = new Date();
  const offset =
    date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 10);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const textareaClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm leading-6 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
