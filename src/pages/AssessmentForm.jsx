import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../api/client";

const TYPES = [
  { value: "cat", label: "CAT" },
  { value: "mid_term", label: "Mid-Term Exam" },
  { value: "end_term", label: "End-Term Exam" },
];

export default function AssessmentForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [grades, setGrades] = useState([]);
  const [terms, setTerms] = useState([]);
  const [gradeId, setGradeId] = useState("");
  const [form, setForm] = useState({
    name: "",
    assessment_type: "cat",
    subject_id: "",
    term_id: "",
    max_score: "",
    date_administered: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    client.get("/grades").then((res) => setGrades(res.data));
    client.get("/terms").then((res) => setTerms(res.data));

    if (isEditing) {
      client.get(`/assessments/${id}`).then((res) => {
        const a = res.data;
        setForm({
          name: a.name,
          assessment_type: a.assessment_type,
          subject_id: a.subject_id,
          term_id: a.term_id,
          max_score: a.max_score,
          date_administered: a.date_administered || "",
        });
        setGradeId(a.subject?.grade_id || "");
      });
    }
  }, [id, isEditing]);

  const subjectsForGrade = grades.find((g) => g.id === Number(gradeId))?.subjects || [];

  function update(changes) {
    setForm((prev) => ({ ...prev, ...changes }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isEditing) {
        await client.patch(`/assessments/${id}`, { assessment: form });
      } else {
        await client.post("/assessments", { assessment: form });
      }
      navigate("/assessments");
    } catch (err) {
      setError(err.response?.data?.errors?.join(", ") || "Could not save assessment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
      <h1 className="text-lg font-semibold mb-4" style={{ color: "var(--color-navy)" }}>
        {isEditing ? "Edit Assessment" : "New Assessment"}
      </h1>

      {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. CAT 1"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
          <select
            value={form.assessment_type}
            onChange={(e) => update({ assessment_type: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
          <select
            required
            value={gradeId}
            onChange={(e) => { setGradeId(e.target.value); update({ subject_id: "" }); }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select a grade...</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
          <select
            required
            disabled={!gradeId}
            value={form.subject_id}
            onChange={(e) => update({ subject_id: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          >
            <option value="">Select a subject...</option>
            {subjectsForGrade.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Term</label>
          <select
            required
            value={form.term_id}
            onChange={(e) => update({ term_id: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select a term...</option>
            {terms.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.year})</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Max Score</label>
          <input
            required
            type="number"
            step="0.01"
            min="0.01"
            value={form.max_score}
            onChange={(e) => update({ max_score: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date Administered</label>
          <input
            type="date"
            value={form.date_administered}
            onChange={(e) => update({ date_administered: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--color-navy)" }}
        >
          {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Assessment"}
        </button>
      </form>
    </div>
  );
}
