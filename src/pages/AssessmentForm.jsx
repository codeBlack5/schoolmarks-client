import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import { useAlert } from "../context/AlertContext";

export default function AssessmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useAlert();

  const [assessment, setAssessment] = useState(null);
  const [form, setForm] = useState({ max_score: "", date_administered: "" });
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    client.get(`/assessments/${id}`)
      .then((res) => {
        setAssessment(res.data);
        setForm({ max_score: res.data.max_score, date_administered: res.data.date_administered || "" });
      })
      .catch((err) => {
        if (err.response?.status === 403) setForbidden(true);
        else setError("Could not load this assessment.");
      });
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await client.patch(`/assessments/${id}`, { assessment: form });
      notify({ type: "success", message: "Assessment details updated." });
      navigate(-1);
    } catch (err) {
      setError(err.response?.data?.errors?.join(", ") || "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  if (forbidden) {
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6">
        <p className="text-sm text-red-600">You don't have permission to edit this assessment.</p>
      </div>
    );
  }

  if (!assessment) return <div className="p-8 text-slate-500">Loading...</div>;

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
      <h1 className="text-lg font-semibold mb-1" style={{ color: "var(--color-navy)" }}>{assessment.name}</h1>
      <p className="text-sm text-slate-500 mb-6">
        {assessment.subject?.name} · {assessment.subject?.grade?.name} · {assessment.term?.name}
      </p>

      {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Max Score</label>
          <input
            required
            type="number"
            step="0.01"
            min="0.01"
            value={form.max_score}
            onChange={(e) => setForm({ ...form, max_score: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date Administered</label>
          <input
            type="date"
            value={form.date_administered}
            onChange={(e) => setForm({ ...form, date_administered: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--color-navy)" }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
