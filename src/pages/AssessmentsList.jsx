import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAlert } from "../context/AlertContext";

export default function AssessmentsList() {
  const { confirm, notify } = useAlert();
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState("");
  const [expandedGrades, setExpandedGrades] = useState({});
  

  function load() {
    client
      .get("/assessments")
      .then((res) => setAssessments(res.data))
      .catch(() => setError("Could not load assessments"));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id, name) {
    const ok = await confirm({
      title: `Delete "${name}"?`,
      message: "This cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });

    if (!ok) return;

    try {
      await client.delete(`/assessments/${id}`);
      notify({ type: "success", message: "Assessment deleted." });
      load();
    } catch (err) {
      notify({
        type: "error",
        message: err.response?.data?.error || "Could not delete",
      });
    }
  }

  // Group assessments by grade
  const groupedAssessments = useMemo(() => {
    return assessments.reduce((groups, assessment) => {
      const grade = assessment.subject?.grade?.name || "Unknown Grade";

      if (!groups[grade]) {
        groups[grade] = [];
      }

      groups[grade].push(assessment);

      return groups;
    }, {});
  }, [assessments]);

  useEffect(() => {
    const expanded = {};

    Object.keys(groupedAssessments).forEach((grade) => {
      expanded[grade] = false;
    });

    setExpandedGrades(expanded);
  }, [groupedAssessments]);

  function toggleGrade(grade) {
    setExpandedGrades((prev) => ({
      ...prev,
      [grade]: !prev[grade],
    }));
  }
  
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--color-navy)" }}
        >
          Assessments
        </h1>

        <Link
          to="/assessments/new"
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-navy)" }}
        >
          + New Assessment
        </Link>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {Object.entries(groupedAssessments).map(([grade, items]) => (
        <div
          key={grade}
          className="mb-6 overflow-hidden rounded-lg border border-slate-200"
        >
          {/* Grade Header */}
          <button
            type="button"
            onClick={() => toggleGrade(grade)}
            className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold text-white transition hover:opacity-95"
            style={{ backgroundColor: "var(--color-navy)" }}
          >
            <div className="flex items-center gap-3">
              <span>{grade}</span>

              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {items.length} {items.length === 1 ? "assessment" : "assessments"}
              </span>
            </div>

            <span className="text-xl">
              {expandedGrades[grade] ? "▼" : "▶"}
            </span>
          </button>

          {expandedGrades[grade] && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-600 text-left">
                  <tr>
                    <th className="px-3 py-2">Assessment</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Subject</th>
                    <th className="px-3 py-2">Term</th>
                    <th className="px-3 py-2">Max Score</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((a) => (
                    <tr
                      key={a.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-3 py-2 font-medium">{a.name}</td>

                      <td className="px-3 py-2 capitalize">
                        {a.assessment_type.replace("_", " ")}
                      </td>

                      <td className="px-3 py-2">
                        {a.subject?.name}
                      </td>

                      <td className="px-3 py-2">
                        {a.term?.name}
                      </td>

                      <td className="px-3 py-2">
                        {a.max_score}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <Link
                          to={`/marks/${a.id}`}
                          className="mr-4 underline"
                          style={{ color: "var(--color-gold)" }}
                        >
                          Enter Marks
                        </Link>

                        <Link
                          to={`/assessments/${a.id}/edit`}
                          className="mr-4 underline text-slate-600"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => handleDelete(a.id, a.name)}
                          className="underline text-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        No assessments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}