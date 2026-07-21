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

  const [editRequestRow, setEditRequestRow] = useState(null); // row being edited via modal
  const [editRequestForm, setEditRequestForm] = useState({ new_score: "", new_status: "present", reason: "" });
  const [editRequestError, setEditRequestError] = useState("");
  const [editRequestSaving, setEditRequestSaving] = useState(false);

  function load() {
    Promise.all([
      client.get(`/assessments/${assessmentId}`),
      client.get(`/assessments/${assessmentId}/roster`),
    ]).then(([assessmentRes, rosterRes]) => {
      setAssessment(assessmentRes.data);
      setRows(rosterRes.data);
    });
  }

  useEffect(load, [assessmentId]);

  function updateRow(index, changes) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...changes } : r)));
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

    const newRows = rows.filter((r) => !r.mark_id);

    try {
      const { data } = await client.post("/marks/bulk_upsert", {
        assessment_id: assessmentId,
        marks: newRows.map((r) => ({
          student_id: r.student_id,
          score: r.status === "present" ? r.score : null,
          status: r.status,
        })),
      });
      setMessage(`Saved ${data.created.length} marks.`);
      load();
    } catch (err) {
      setErrors(err.response?.data?.details || []);
      setMessage(err.response?.data?.error || "Could not save marks.");
    } finally {
      setSaving(false);
    }
  }

  function openEditRequest(row) {
    setEditRequestRow(row);
    setEditRequestForm({ new_score: row.score ?? "", new_status: row.status, reason: "" });
    setEditRequestError("");
  }

  async function submitEditRequest(e) {
    e.preventDefault();
    setEditRequestSaving(true);
    setEditRequestError("");
    try {
      await client.post("/edit_requests", {
        mark_id: editRequestRow.mark_id,
        new_score: editRequestForm.new_status === "present" ? editRequestForm.new_score : null,
        new_status: editRequestForm.new_status,
        reason: editRequestForm.reason,
      });
      setEditRequestRow(null);
      setMessage(`Edit request submitted for ${editRequestRow.name} — pending admin approval.`);
    } catch (err) {
      setEditRequestError(err.response?.data?.errors?.join(", ") || "Could not submit edit request");
    } finally {
      setEditRequestSaving(false);
    }
  }

  if (!assessment) return <div className="p-8 text-slate-500">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold" style={{ color: "var(--color-navy)" }}>
          {assessment.name} — Max score: {assessment.max_score}
        </h1>
        <Link to={`/assessments/${assessmentId}/edit`} className="text-sm underline" style={{ color: "var(--color-gold)" }}>
          Edit Assessment Details
        </Link>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Enter scores as marked on paper. Rows already saved are locked — request an edit if a correction is needed.
      </p>

      {message && (
        <div className="mb-3 text-sm rounded-md px-3 py-2 bg-slate-100 text-slate-700">{message}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-100 text-slate-600 text-left">
            <tr>
              <th className="px-3 py-2">Adm No</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2 w-28">Score</th>
              <th className="px-3 py-2 w-36">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const locked = Boolean(row.mark_id);
              const rowError = errors.find((e) => e.student_id === row.student_id);
              return (
                <tr key={row.student_id} className={`border-t border-slate-100 ${locked ? "bg-slate-50" : ""}`}>
                  <td className="px-3 py-2 text-slate-500">{row.admission_number}</td>
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">
                    <input
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="number"
                      step="0.01"
                      disabled={locked || row.status !== "present"}
                      value={row.score ?? ""}
                      onChange={(e) => updateRow(i, { score: e.target.value })}
                      onKeyDown={(e) => handleKeyDown(e, i)}
                      className="w-20 rounded border border-slate-300 px-2 py-1 disabled:bg-slate-100"
                    />
                    {rowError && (
                      <div className="text-xs text-red-600 mt-1">{rowError.errors.join(", ")}</div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      disabled={locked}
                      value={row.status}
                      onChange={(e) => updateRow(i, { status: e.target.value, score: e.target.value === "present" ? row.score : null })}
                      className="rounded border border-slate-300 px-2 py-1 disabled:bg-slate-100"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="incomplete">Incomplete</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {locked && (
                      <button onClick={() => openEditRequest(row)} className="text-xs underline" style={{ color: "var(--color-gold)" }}>
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
        style={{ backgroundColor: "var(--color-navy)" }}
      >
        {saving ? "Saving..." : "Save Marks"}
      </button>

      {editRequestRow && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <form onSubmit={submitEditRequest} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold mb-1" style={{ color: "var(--color-navy)" }}>
              Request Edit — {editRequestRow.name}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Current: {editRequestRow.status === "present" ? `${editRequestRow.score}` : editRequestRow.status}
            </p>

            {editRequestError && (
              <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{editRequestError}</div>
            )}

            <label className="block text-sm font-medium text-slate-700 mb-1">New Status</label>
            <select
              value={editRequestForm.new_status}
              onChange={(e) => setEditRequestForm({ ...editRequestForm, new_status: e.target.value })}
              className="w-full mb-3 rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="incomplete">Incomplete</option>
            </select>

            {editRequestForm.new_status === "present" && (
              <>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Score</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={editRequestForm.new_score}
                  onChange={(e) => setEditRequestForm({ ...editRequestForm, new_score: e.target.value })}
                  className="w-full mb-3 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </>
            )}

            <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
            <textarea
              required
              value={editRequestForm.reason}
              onChange={(e) => setEditRequestForm({ ...editRequestForm, reason: e.target.value })}
              placeholder="e.g. Recount after dispute"
              className="w-full mb-4 rounded-md border border-slate-300 px-3 py-2 text-sm"
              rows={2}
            />

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditRequestRow(null)} className="px-3 py-2 text-sm text-slate-500">
                Cancel
              </button>
              <button
                type="submit"
                disabled={editRequestSaving}
                className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: "var(--color-navy)" }}
              >
                {editRequestSaving ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
