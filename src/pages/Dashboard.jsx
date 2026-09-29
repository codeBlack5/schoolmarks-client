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
  if (values.length < 2) {
    return <span className="text-xs text-slate-400">not enough terms yet</span>;
  }

  const width = 120;
  const height = 32;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (width - pad * 2);
      const y = height - pad - ((v - min) / range) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const trendingUp = values[values.length - 1] >= values[0];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block h-8 w-[120px] max-w-full align-middle"
      aria-label={trendingUp ? "Trending upward" : "Trending downward"}
      role="img"
    >
      <polyline
        points={points}
        fill="none"
        stroke={trendingUp ? "#16a34a" : "#dc2626"}
        strokeWidth="2"
      />
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
    downloadFile(
      `/exports/assessment/${id}`,
      `${name.replace(/\s+/g, "_")}.xlsx`
    );
  }

  const groupedByGrade = rows.reduce((acc, r) => {
    (acc[r.grade] ||= []).push(r);
    return acc;
  }, {});

  Object.values(groupedByGrade).forEach((list) =>
    list.sort(
      (a, b) =>
        STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
        a.subject.localeCompare(b.subject)
    )
  );

  const gradeNames = Object.keys(groupedByGrade).sort();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-5 sm:space-y-8 sm:px-6 sm:py-6">
      <section className="space-y-4">
        <div>
          <h1
            className="text-lg font-semibold sm:text-xl"
            style={{ color: "var(--color-navy)" }}
          >
            Submission Status
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track assessment marking progress by grade.
          </p>
        </div>

        {gradeNames.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-400 shadow-sm">
            No assessments yet.
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          {gradeNames.map((grade) => (
            <div
              key={grade}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  {grade}
                </h3>
              </div>

              <div className="overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-slate-100 text-left text-slate-600">
                    <tr>
                      <th className="px-3 py-3 font-medium">Subject</th>
                      <th className="px-3 py-3 font-medium">Assessment</th>
                      <th className="px-3 py-3 font-medium">Term</th>
                      <th className="px-3 py-3 font-medium">Progress</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium" />
                    </tr>
                  </thead>

                  <tbody>
                    {groupedByGrade[grade].map((r) => (
                      <tr
                        key={r.assessment_id}
                        className="border-t border-slate-100"
                      >
                        <td className="max-w-[180px] px-3 py-3 font-medium text-slate-700">
                          <span className="block truncate">{r.subject}</span>
                        </td>

                        <td className="max-w-[220px] px-3 py-3 text-slate-600">
                          <span className="block truncate">
                            {r.assessment_name}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                          {r.term}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                          {r.submitted}/{r.total_students}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                              STATUS_STYLES[r.status]
                            }`}
                          >
                            {r.status.replace("_", " ")}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              downloadAssessment(
                                r.assessment_id,
                                r.assessment_name
                              )
                            }
                            className="inline-flex min-h-10 items-center rounded-lg px-3 text-xs font-medium underline underline-offset-2 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            style={{ color: "var(--color-gold)" }}
                          >
                            Export .xlsx
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400 sm:hidden">
                Swipe left or right to view all columns.
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2
            className="text-lg font-semibold sm:text-xl"
            style={{ color: "var(--color-navy)" }}
          >
            School Analysis
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Mean score trend by subject, term over term.
          </p>
        </div>

        {analysis.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-400 shadow-sm">
            No marked assessments yet — trends will appear here once terms have
            data.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-100 text-left text-slate-600">
                  <tr>
                    <th className="px-3 py-3 font-medium">Subject</th>
                    <th className="px-3 py-3 font-medium">Grade</th>
                    <th className="px-3 py-3 font-medium">Trend</th>
                    <th className="px-3 py-3 font-medium">Latest Mean</th>
                    <th className="px-3 py-3 font-medium">
                      Latest Pass Rate
                    </th>
                    <th className="px-3 py-3 font-medium">By Term</th>
                  </tr>
                </thead>

                <tbody>
                  {analysis.map((row) => {
                    const latest = row.terms[row.terms.length - 1];

                    return (
                      <tr
                        key={`${row.subject}-${row.grade}`}
                        className="border-t border-slate-100 align-middle"
                      >
                        <td className="max-w-[180px] px-3 py-3 font-medium text-slate-700">
                          <span className="block truncate">{row.subject}</span>
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                          {row.grade}
                        </td>

                        <td className="px-3 py-3">
                          <Sparkline
                            values={row.terms.map((term) => term.mean)}
                          />
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                          {latest.mean}%
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                          {latest.pass_rate}%
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">
                          {row.terms
                            .map((term) => `${term.term_name}: ${term.mean}%`)
                            .join(" · ")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400 sm:hidden">
              Swipe left or right to view all columns.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
