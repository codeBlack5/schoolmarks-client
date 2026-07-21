import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAlert } from "../context/AlertContext";

const TYPES = [
  { value: "cat", label: "CAT" },
  { value: "mid_term", label: "Mid-Term Exam" },
  { value: "end_term", label: "End-Term Exam" },
];

export default function AssessmentBatchForm() {
  const navigate = useNavigate();
  const { notify } = useAlert();
  const [grades, setGrades] = useState([]);
  const [form, setForm] = useState({ grade_id: "", term_id: "", assessment_type: "cat", name: "" });
  const [terms, setTerms] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    client.get("/grades").then((res) => setGrades(res.data));
    client.get("/terms").then((res) => setTerms(res.data));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const { data } = await client.post("/assessments/batch", form);
      const skippedNote = data.skipped_existing.length
        ? ` (${data.skipped_existing.length} already existed: ${data.skipped_existing.join(", ")})`
        : "";
      notify({ type: "success", message: `Created for ${data.created.length} learning area(s).${skippedNote}` });
      navigate("/assessments");
    } catch (err) {
      setError(err.response?.data?.error || "Could not create assessment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
      <h1 className="text-lg font-semibold mb-1" style={{ color: "var(--color-navy)" }}>New Assessment</h1>
      <p className="text-sm text-slate-500 mb-4">
        Creates this assessment across every learning area (subject) in the grade at once. Each subject's teacher
        sets their own max score before entering marks.
      </p>

      {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. CAT 1"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
          <select value={form.assessment_type} onChange={(e) => setForm({ ...form, assessment_type: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
          <select required value={form.grade_id} onChange={(e) => setForm({ ...form, grade_id: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select a grade...</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Term</label>
          <select required value={form.term_id} onChange={(e) => setForm({ ...form, term_id: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select a term...</option>
            {terms.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.year})</option>)}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--color-navy)" }}
        >
          {saving ? "Creating..." : "Create for All Learning Areas"}
        </button>
      </form>
    </div>
  );
}
