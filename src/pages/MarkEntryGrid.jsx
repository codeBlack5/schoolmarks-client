import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client from "../api/client";

export default function MarkEntryGrid() {
  const { assessmentId } = useParams();

  const [assessment, setAssessment] = useState(null);
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState([]);

  const inputRefs = useRef([]);
  const draftKey = `mark-draft-${assessmentId}`;

  const [editRequestRow, setEditRequestRow] = useState(null);
  const [editRequestForm, setEditRequestForm] = useState({
    new_score: "",
    new_status: "present",
    reason: "",
  });
  const [editRequestError, setEditRequestError] = useState("");
  const [editRequestSaving, setEditRequestSaving] = useState(false);

  // Assessment editing
  const [editingAssessment, setEditingAssessment] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    max_score: "",
    date_administered: "",
  });
  const [assessmentSaving, setAssessmentSaving] = useState(false);
  const [assessmentError, setAssessmentError] = useState("");

  function load() {
    Promise.all([
      client.get(`/assessments/${assessmentId}`),
      client.get(`/assessments/${assessmentId}/roster`),
    ]).then(([assessmentRes, rosterRes]) => {
      setAssessment(assessmentRes.data);

      const roster = rosterRes.data;

      // Restore unsaved draft if available
      const draft = localStorage.getItem(draftKey);

      if (draft) {
        try {
          const savedRows = JSON.parse(draft);

          const merged = roster.map((student) => {
            const saved = savedRows.find(
              (r) => r.student_id === student.student_id
            );

            return saved && !student.mark_id
              ? {
                  ...student,
                  score: saved.score,
                  status: saved.status,
                }
              : student;
          });

          setRows(merged);
        } catch {
          setRows(roster);
        }
      } else {
        setRows(roster);
      }
    });
  }

  useEffect(load, [assessmentId]);

  useEffect(() => {
    if (!rows.length) return;

    const unsaved = rows.filter((r) => !r.mark_id);

    localStorage.setItem(
      draftKey,
      JSON.stringify(unsaved)
    );
  }, [rows, draftKey]);

  function openAssessmentEdit() {
    setAssessmentForm({
      max_score: assessment?.max_score ?? "",
      date_administered:
        assessment?.date_administered ?? "",
    });

    setAssessmentError("");
    setEditingAssessment(true);
  }

  async function handleAssessmentUpdate(e) {
    e.preventDefault();

    const maxScore = Number(assessmentForm.max_score);

    if (!Number.isFinite(maxScore) || maxScore < 0) {
      setAssessmentError(
        "Maximum score must be a valid number greater than or equal to 0."
      );
      return;
    }

    setAssessmentSaving(true);
    setAssessmentError("");
    setMessage(null);

    try {
      const { data } = await client.patch(
        `/assessments/${assessmentId}`,
        {
          assessment: {
            max_score: maxScore,
            date_administered:
              assessmentForm.date_administered || null,
          },
        }
      );

      setAssessment(data);
      setEditingAssessment(false);

      setMessage({
        type: "saved",
        text: "Assessment details updated successfully.",
      });
    } catch (err) {
      setAssessmentError(
        err.response?.data?.error ||
          err.response?.data?.errors?.join(", ") ||
          "Could not update assessment details."
      );
    } finally {
      setAssessmentSaving(false);
    }
  }

  function updateRow(index, changes) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, ...changes } : r
      )
    );
  }

  function handleKeyDown(e, index) {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setErrors([]);

    const newRows = rows.filter((row) => !row.mark_id);

    const readyRows = newRows.filter((row) => {
      if (
        row.status === "absent" ||
        row.status === "incomplete"
      ) {
        return true;
      }

      return row.score !== null && row.score !== "";
    });

    if (readyRows.length === 0) {
      setMessage({
        type: "info",
        text:
          "Enter at least one score or mark a student absent/incomplete before saving.",
      });

      setSaving(false);
      return;
    }

    try {
      const { data } = await client.post(
        "/marks/bulk_upsert",
        {
          assessment_id: assessmentId,
          marks: readyRows.map((row) => ({
            student_id: row.student_id,
            score:
              row.status === "present"
                ? row.score
                : null,
            status: row.status,
          })),
        }
      );

      setMessage({
        type: "saved",
        text: `Saved ${data.created.length} marks.`,
      });

      load();
    } catch (err) {
      setErrors(
        err.response?.data?.details || []
      );

      setMessage({
        type: "error",
        text:
          err.response?.data?.error ||
          "Could not save marks.",
      });
    } finally {
      setSaving(false);
    }
  }

  function openEditRequest(row) {
    setEditRequestRow(row);

    setEditRequestForm({
      new_score: row.score ?? "",
      new_status: row.status,
      reason: "",
    });

    setEditRequestError("");
  }

  useEffect(() => {
    function handleBeforeUnload(e) {
      const hasUnsaved = rows.some(
        (r) =>
          !r.mark_id &&
          ((r.score !== null && r.score !== "") ||
            r.status !== "present")
      );

      if (!hasUnsaved) return;

      e.preventDefault();
      e.returnValue = "";
    }

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () =>
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
  }, [rows]);

  async function submitEditRequest(e) {
    e.preventDefault();

    setEditRequestSaving(true);
    setEditRequestError("");

    try {
      await client.post("/edit_requests", {
        mark_id: editRequestRow.mark_id,
        new_score:
          editRequestForm.new_status === "present"
            ? editRequestForm.new_score
            : null,
        new_status: editRequestForm.new_status,
        reason: editRequestForm.reason,
      });

      setEditRequestRow(null);

      setMessage({
        type: "info",
        text: `Edit request submitted for ${editRequestRow.name} — pending admin approval.`,
      });
    } catch (err) {
      setEditRequestError(
        err.response?.data?.errors?.join(", ") ||
          "Could not submit edit request"
      );
    } finally {
      setEditRequestSaving(false);
    }
  }

  const totalStudents = rows.length;

  const markedCount = rows.filter(
    (row) => row.mark_id
  ).length;

  const unmarkedCount =
    totalStudents - markedCount;

  const scoredCount = rows.filter(
    (row) =>
      row.mark_id &&
      row.status === "present" &&
      row.score !== null
  ).length;

  const absentCount = rows.filter(
    (row) => row.status === "absent"
  ).length;

  const incompleteCount = rows.filter(
    (row) => row.status === "incomplete"
  ).length;

  if (!assessment) {
    return (
      <div className="p-8 text-slate-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p
            className="text-sm font-medium uppercase tracking-wide"
            style={{
              color: "var(--color-gold)",
            }}
          >
            {assessment.subject?.grade?.name ||
              "Class"}{" "}
            ·{" "}
            {assessment.subject?.name ||
              "Subject"}
          </p>

          <h1
            className="text-lg font-semibold"
            style={{
              color: "var(--color-navy)",
            }}
          >
            {assessment.name} — Max score:{" "}
            {assessment.max_score}
          </h1>

          {assessment.date_administered && (
            <p className="mt-1 text-xs text-slate-500">
              Date administered:{" "}
              {assessment.date_administered}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={openAssessmentEdit}
          className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
          style={{
            borderColor:
              "var(--color-navy)",
            color: "var(--color-navy)",
          }}
        >
          Edit assessment
        </button>
      </div>

      {editingAssessment && (
        <form
          onSubmit={handleAssessmentUpdate}
          className="mb-4 mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          <div className="mb-3">
            <h2
              className="text-sm font-semibold"
              style={{
                color:
                  "var(--color-navy)",
              }}
            >
              Update assessment details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              You can update the maximum score and
              date administered. Assessment name,
              subject and term are unchanged.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Maximum score
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={assessmentForm.max_score}
                onChange={(e) =>
                  setAssessmentForm(
                    (current) => ({
                      ...current,
                      max_score:
                        e.target.value,
                    })
                  )
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Date administered
              </label>

              <input
                type="date"
                value={
                  assessmentForm.date_administered ||
                  ""
                }
                onChange={(e) =>
                  setAssessmentForm(
                    (current) => ({
                      ...current,
                      date_administered:
                        e.target.value,
                    })
                  )
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>
          </div>

          {assessmentError && (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {assessmentError}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={assessmentSaving}
              className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{
                backgroundColor:
                  "var(--color-navy)",
              }}
            >
              {assessmentSaving
                ? "Saving..."
                : "Save changes"}
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingAssessment(false);
                setAssessmentError("");
              }}
              disabled={assessmentSaving}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <p className="mb-4 text-sm text-slate-500">
        Enter scores as marked on paper. Rows already
        saved are locked — request an edit if a
        correction is needed.
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs text-slate-500">
            Students
          </div>
          <div className="text-lg font-semibold text-slate-800">
            {totalStudents}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs text-slate-500">
            Marked
          </div>
          <div className="text-lg font-semibold text-slate-800">
            {markedCount}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs text-slate-500">
            Unmarked
          </div>
          <div className="text-lg font-semibold text-slate-800">
            {unmarkedCount}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs text-slate-500">
            Scored
          </div>
          <div className="text-lg font-semibold text-slate-800">
            {scoredCount}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs text-slate-500">
            Absent
          </div>
          <div className="text-lg font-semibold text-slate-800">
            {absentCount}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs text-slate-500">
            Incomplete
          </div>
          <div className="text-lg font-semibold text-slate-800">
            {incompleteCount}
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
          <span>{message.text}</span>

          {message.type === "saved" && (
            <Link
              to={`/teacher/analytics?term_id=${assessment.term?.id}&grade_id=${assessment.subject?.grade?.id}&subject_id=${assessment.subject?.id}`}
              className="inline-flex items-center rounded-md px-3 py-2 font-medium text-white transition hover:opacity-90"
              style={{
                backgroundColor:
                  "var(--color-navy)",
              }}
            >
              Analyze Performance
            </Link>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full overflow-hidden rounded-lg border border-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">
                Adm No
              </th>
              <th className="px-3 py-2">
                Name
              </th>
              <th className="w-28 px-3 py-2">
                Score
              </th>
              <th className="w-36 px-3 py-2">
                Status
              </th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => {
              const locked = Boolean(
                row.mark_id
              );

              const rowError = errors.find(
                (e) =>
                  e.student_id ===
                  row.student_id
              );

              return (
                <tr
                  key={row.student_id}
                  className={`border-t border-slate-100 ${
                    locked
                      ? "bg-slate-50"
                      : ""
                  }`}
                >
                  <td className="px-3 py-2 text-slate-500">
                    {row.admission_number}
                  </td>

                  <td className="px-3 py-2">
                    {row.name}
                  </td>

                  <td className="px-3 py-2">
                    <input
                      ref={(el) =>
                        (inputRefs.current[i] =
                          el)
                      }
                      type="number"
                      step="0.01"
                      disabled={
                        locked ||
                        row.status !==
                          "present"
                      }
                      value={
                        row.score ?? ""
                      }
                      onChange={(e) =>
                        updateRow(i, {
                          score:
                            e.target.value,
                        })
                      }
                      onKeyDown={(e) =>
                        handleKeyDown(
                          e,
                          i
                        )
                      }
                      className="w-20 rounded border border-slate-300 px-2 py-1 disabled:bg-slate-100"
                    />

                    {rowError && (
                      <div className="mt-1 text-xs text-red-600">
                        {rowError.errors.join(
                          ", "
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-2">
                    <select
                      disabled={locked}
                      value={row.status}
                      onChange={(e) =>
                        updateRow(i, {
                          status:
                            e.target.value,
                          score:
                            e.target.value ===
                            "present"
                              ? row.score
                              : null,
                        })
                      }
                      className="rounded border border-slate-300 px-2 py-1 disabled:bg-slate-100"
                    >
                      <option value="present">
                        Present
                      </option>
                      <option value="absent">
                        Absent
                      </option>
                      <option value="incomplete">
                        Incomplete
                      </option>
                    </select>
                  </td>

                  <td className="px-3 py-2">
                    {locked && (
                      <button
                        onClick={() =>
                          openEditRequest(
                            row
                          )
                        }
                        className="text-xs underline"
                        style={{
                          color:
                            "var(--color-gold)",
                        }}
                      >
                        Request Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        style={{
          backgroundColor:
            "var(--color-navy)",
        }}
      >
        {saving ? "Saving..." : "Save Marks"}
      </button>

      {editRequestRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <form
            onSubmit={submitEditRequest}
            className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg"
          >
            <h2
              className="mb-1 text-base font-semibold"
              style={{
                color:
                  "var(--color-navy)",
              }}
            >
              Request Edit —{" "}
              {editRequestRow.name}
            </h2>

            <p className="mb-4 text-xs text-slate-500">
              Current:{" "}
              {editRequestRow.status ===
              "present"
                ? `${editRequestRow.score}`
                : editRequestRow.status}
            </p>

            {editRequestError && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {editRequestError}
              </div>
            )}

            <label className="mb-1 block text-sm font-medium text-slate-700">
              New Status
            </label>

            <select
              value={
                editRequestForm.new_status
              }
              onChange={(e) =>
                setEditRequestForm({
                  ...editRequestForm,
                  new_status:
                    e.target.value,
                })
              }
              className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="present">
                Present
              </option>
              <option value="absent">
                Absent
              </option>
              <option value="incomplete">
                Incomplete
              </option>
            </select>

            {editRequestForm.new_status ===
              "present" && (
              <>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  New Score
                </label>

                <input
                  required
                  type="number"
                  step="0.01"
                  value={
                    editRequestForm.new_score
                  }
                  onChange={(e) =>
                    setEditRequestForm({
                      ...editRequestForm,
                      new_score:
                        e.target.value,
                    })
                  }
                  className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </>
            )}

            <label className="mb-1 block text-sm font-medium text-slate-700">
              Reason
            </label>

            <textarea
              required
              value={
                editRequestForm.reason
              }
              onChange={(e) =>
                setEditRequestForm({
                  ...editRequestForm,
                  reason:
                    e.target.value,
                })
              }
              placeholder="e.g. Recount after dispute"
              className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              rows={2}
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setEditRequestRow(null)
                }
                className="px-3 py-2 text-sm text-slate-500"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  editRequestSaving
                }
                className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                style={{
                  backgroundColor:
                    "var(--color-navy)",
                }}
              >
                {editRequestSaving
                  ? "Submitting..."
                  : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
