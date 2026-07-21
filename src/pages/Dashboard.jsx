import { useEffect, useState } from "react";
import client from "../api/client";
import { downloadFile } from "../api/download";

const STATUS_STYLES = {
  complete: "bg-green-100 text-green-700",
  partial: "bg-amber-100 text-amber-700",
  not_started: "bg-slate-100 text-slate-500",
};
const STATUS_RANK = { complete: 0, partial: 1, not_started: 2 };

function Sparkline({ values }) {
  if (values.length < 2) return <span className="text-xs text-slate-400">not enough terms yet</span>;

  const width = 120, height = 32, pad = 4;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const trendingUp = values[values.length - 1] >= values[0];

  return (
    <svg width={width} height={height} className="inline-block align-middle">
      <polyline points={points} fill="none" stroke={trendingUp ? "#16a34a" : "#dc2626"} strokeWidth="2" />
    </svg>
  );
}

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [analysis, setAnalysis] = useState([]);

  useEffect(() => {
    client.get("/dashboard/submission_status").then((res) => setRows(res.data));
    client.get("/dashboard/analysis").then((res) => setAnalysis(res.data));
  }, []);

  function downloadAssessment(id, name) {
    downloadFile(`/exports/assessment/${id}`, `${name.replace(/\s+/g, "_")}.xlsx`);
  }

  const groupedByGrade = rows.reduce((acc, r) => {
    (acc[r.grade] ||= []).push(r);
    return acc;
  }, {});
  Object.values(groupedByGrade).forEach((list) =>
    list.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.subject.localeCompare(b.subject))
  );
  const gradeNames = Object.keys(groupedByGrade).sort();

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-10">
      <section>
        <h1 className="text-lg font-semibold mb-4" style={{ color: "var(--color-navy)" }}>
          Submission Status
        </h1>

        {gradeNames.length === 0 && <p className="text-sm text-slate-400">No assessments yet.</p>}

        <div className="space-y-6">
          {gradeNames.map((grade) => (
            <div key={grade}>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">{grade}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-600 text-left">
                    <tr>
                      <th className="px-3 py-2">Subject</th>
                      <th className="px-3 py-2">Assessment</th>
                      <th className="px-3 py-2">Term</th>
                      <th className="px-3 py-2">Progress</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedByGrade[grade].map((r) => (
                      <tr key={r.assessment_id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{r.subject}</td>
                        <td className="px-3 py-2">{r.assessment_name}</td>
                        <td className="px-3 py-2">{r.term}</td>
                        <td className="px-3 py-2">{r.submitted}/{r.total_students}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                            {r.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => downloadAssessment(r.assessment_id, r.assessment_name)} className="text-xs font-medium underline" style={{ color: "var(--color-gold)" }}>
                            Export .xlsx
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--color-navy)" }}>
          School Analysis
        </h2>
        <p className="text-sm text-slate-500 mb-4">Mean score trend by subject, term over term.</p>

        {analysis.length === 0 ? (
          <p className="text-sm text-slate-400">No marked assessments yet — trends will appear here once terms have data.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 text-left">
                <tr>
                  <th className="px-3 py-2">Subject</th>
                  <th className="px-3 py-2">Grade</th>
                  <th className="px-3 py-2">Trend</th>
                  <th className="px-3 py-2">Latest Mean</th>
                  <th className="px-3 py-2">Latest Pass Rate</th>
                  <th className="px-3 py-2">By Term</th>
                </tr>
              </thead>
              <tbody>
                {analysis.map((row) => {
                  const latest = row.terms[row.terms.length - 1];
                  return (
                    <tr key={`${row.subject}-${row.grade}`} className="border-t border-slate-100 align-middle">
                      <td className="px-3 py-2">{row.subject}</td>
                      <td className="px-3 py-2">{row.grade}</td>
                      <td className="px-3 py-2"><Sparkline values={row.terms.map((t) => t.mean)} /></td>
                      <td className="px-3 py-2">{latest.mean}%</td>
                      <td className="px-3 py-2">{latest.pass_rate}%</td>
                      <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                        {row.terms.map((t) => `${t.term_name}: ${t.mean}%`).join(" · ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
