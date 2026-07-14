import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

export default function AssessmentsList() {
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState("");

  function load() {
    client.get("/assessments").then((res) => setAssessments(res.data)).catch(() => setError("Could not load assessments"));
  }

  useEffect(load, []);

  async function handleDelete(id) {
    if (!confirm("Delete this assessment? This cannot be undone.")) return;
    try {
      await client.delete(`/assessments/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Could not delete");
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-lg font-semibold" style={{ color: "var(--color-navy)" }}>Assessments</h1>
        <Link
          to="/assessments/new"
          className="rounded-md px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-navy)" }}
        >
          + New Assessment
        </Link>
      </div>

      {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      <div className="overflow-x-auto"><table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
        <thead className="bg-slate-100 text-slate-600 text-left">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Subject</th>
            <th className="px-3 py-2">Term</th>
            <th className="px-3 py-2">Max Score</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {assessments.map((a) => (
            <tr key={a.id} className="border-t border-slate-100">
              <td className="px-3 py-2">{a.name}</td>
              <td className="px-3 py-2 capitalize">{a.assessment_type.replace("_", " ")}</td>
              <td className="px-3 py-2">{a.subject?.name}</td>
              <td className="px-3 py-2">{a.term?.name}</td>
              <td className="px-3 py-2">{a.max_score}</td>
              <td className="px-3 py-2 space-x-3">
                <Link to={`/marks/${a.id}`} className="underline" style={{ color: "var(--color-gold)" }}>Enter marks</Link>
                <Link to={`/assessments/${a.id}/edit`} className="underline text-slate-500">Edit</Link>
                <button onClick={() => handleDelete(a.id)} className="underline text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}
