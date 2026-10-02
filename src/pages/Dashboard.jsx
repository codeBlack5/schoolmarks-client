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

function OverviewCard({ label, value, detail }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-800 sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function ProgressStat({ label, value, className }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <p className={`text-lg font-semibold ${className}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [analysis, setAnalysis] = useState([]);
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");

  useEffect(() => {
    client.get("/dashboard/submission_status").then((res) => setRows(res.data));
    client.get("/dashboard/analysis").then((res) => setAnalysis(res.data));

    client
      .get("/dashboard/overview")
      .then((res) => {
        setOverview(res.data);
        setOverviewError("");
      })
      .catch((error) => {
        console.error("Failed to load dashboard overview:", error);
        setOverviewError("Could not load dashboard overview.");
      })
      .finally(() => setOverviewLoading(false));
  }, []);

  function downloadAssessment(id, name) {
    downloadFile(
      `/exports/assessment/${id}`,
      `${name.replace(/\s+/g, "_")}.xlsx`
    );
  }

  const groupedByGrade = rows.reduce((acc, row) => {
    const grade = (acc[row.grade] ||= {});
    const term = (grade[row.term] ||= {});
    const type = row.assessment_type || "other";

    (term[type] ||= []).push(row);

    return acc;
  }, {});

  const compareNames = (a, b) =>
    String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: "base",
    });

  const assessmentTypeOrder = {
    opener: 0,
    mid_term: 1,
    cat: 2,
    end_term: 3,
    other: 4,
  };

  const assessmentTypeLabels = {
    opener: "Opener",
    mid_term: "Mid-Term",
    cat: "CAT",
    end_term: "End-Term",
    other: "Other",
  };

  const statusLabel = (status) => {
    if (status === "complete") return "Complete";
    if (status === "partial") return "In Progress";
    return "Not Started";
  };

  const summarizeAssessments = (items) => ({
    total: items.length,
    complete: items.filter((item) => item.status === "complete").length,
    partial: items.filter((item) => item.status === "partial").length,
    notStarted: items.filter((item) => item.status === "not_started").length,
  });

  const gradeNames = Object.keys(groupedByGrade).sort(compareNames);

  const sortedTermNames = (terms) => Object.keys(terms).sort(compareNames);

  const sortedAssessmentTypes = (types) =>
    Object.keys(types).sort(
      (a, b) =>
        (assessmentTypeOrder[a] ?? 99) -
          (assessmentTypeOrder[b] ?? 99) ||
        compareNames(a, b)
    );

  const gradeAssessments = (terms) =>
    Object.values(terms)
      .flatMap((types) => Object.values(types))
      .flat();

  const termAssessments = (types) =>
    Object.values(types).flat();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-5 sm:space-y-8 sm:px-6 sm:py-6">
      {/* Dashboard overview */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="text-lg font-semibold sm:text-xl"
              style={{ color: "var(--color-navy)" }}
            >
              School Overview
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              A quick view of the school's current academic and marking activity.
            </p>
          </div>

          {overview?.overview?.current_term && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm sm:text-right">
              <span className="font-medium text-slate-700">
                {overview.overview.current_term.name}{" "}
                {overview.overview.current_term.year}
              </span>
              <span className="mx-1 hidden sm:inline">·</span>
              <span className="block sm:inline">
                {overview.overview.current_term.start_date} –{" "}
                {overview.overview.current_term.end_date}
              </span>
            </div>
          )}
        </div>

        {overviewLoading && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500 shadow-sm">
            Loading school overview...
          </div>
        )}

        {!overviewLoading && overviewError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            {overviewError}
          </div>
        )}

        {!overviewLoading && !overviewError && overview && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <OverviewCard
                label="Students"
                value={overview.overview.students}
                detail="Active students"
              />
              <OverviewCard
                label="Teachers"
                value={overview.overview.teachers}
                detail="Teaching staff"
              />
              <OverviewCard
                label="Subjects"
                value={overview.overview.subjects}
                detail="School subjects"
              />
              <OverviewCard
                label="Grades"
                value={overview.overview.grades}
                detail="Active grades"
              />
              <OverviewCard
                label="Assessments"
                value={overview.overview.assessments}
                detail="All assessments"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800 sm:text-base">
                      Overall Marking Progress
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      School-wide mark submission across all assessments.
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-bold text-slate-800">
                      {overview.marking_progress.completion_percentage}%
                    </p>
                    <p className="text-xs text-slate-500">complete</p>
                  </div>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{
                      width: `${Math.min(
                        overview.marking_progress.completion_percentage || 0,
                        100
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <ProgressStat
                    label="Submitted"
                    value={overview.marking_progress.submitted}
                    className="text-green-700"
                  />
                  <ProgressStat
                    label="Pending"
                    value={overview.marking_progress.pending}
                    className="text-amber-700"
                  />
                  <ProgressStat
                    label="Complete"
                    value={overview.marking_progress.complete}
                    className="text-green-700"
                  />
                  <ProgressStat
                    label="In Progress"
                    value={overview.marking_progress.in_progress}
                    className="text-blue-700"
                  />
                </div>

                <div className="mt-3 text-xs text-slate-400">
                  {overview.marking_progress.not_started} assessments not started
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Current Term
                </p>

                {overview.overview.current_term ? (
                  <div className="mt-2">
                    <h2 className="text-lg font-semibold text-slate-800">
                      {overview.overview.current_term.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Academic year {overview.overview.current_term.year}
                    </p>
                    <div className="mt-4 rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-600">
                      <div>
                        <span className="font-medium">Starts:</span>{" "}
                        {overview.overview.current_term.start_date}
                      </div>
                      <div className="mt-1">
                        <span className="font-medium">Ends:</span>{" "}
                        {overview.overview.current_term.end_date}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    No current term available.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h1
            className="text-lg font-semibold sm:text-xl"
            style={{ color: "var(--color-navy)" }}
          >
        <section className="space-y-4">
          <div>
            <h1
              className="text-lg font-semibold sm:text-xl"
              style={{ color: "var(--color-navy)" }}
            >
              Teacher Marking Workload
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Monitor assessment marking progress across teaching staff.
            </p>
          </div>

          {!overview || overview.teacher_workload.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-400 shadow-sm">
              No teacher workload data available.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {overview?.teacher_workload?.map((teacher) => (
                <div
                  key={teacher.id}
                  className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-slate-800 sm:text-base">
                        {teacher.name}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {teacher.subjects_count}{" "}
                        {teacher.subjects_count === 1 ? "subject" : "subjects"} ·{" "}
                        {teacher.assessments_count}{" "}
                        {teacher.assessments_count === 1 ? "assessment" : "assessments"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold text-slate-800">
                        {teacher.completion_percentage}%
                      </p>
                      <p className="text-[11px] text-slate-400">complete</p>
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{
                        width: `${Math.min(
                          teacher.completion_percentage || 0,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <ProgressStat
                      label="Complete"
                      value={teacher.complete}
                      className="text-green-700"
                    />
                    <ProgressStat
                      label="In Progress"
                      value={teacher.in_progress}
                      className="text-blue-700"
                    />
                    <ProgressStat
                      label="Not Started"
                      value={teacher.not_started}
                      className="text-slate-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h1
              className="text-lg font-semibold sm:text-xl"
              style={{ color: "var(--color-navy)" }}
            >
              Grade Assessment Progress
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Compare assessment marking progress across grades.
            </p>
          </div>

          {!overview || overview.grade_progress.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-400 shadow-sm">
              No grade progress data available.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {overview?.grade_progress?.map((grade) => (
                <div
                  key={grade.id}
                  className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-slate-800 sm:text-base">
                        {grade.name}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {grade.students_count}{" "}
                        {grade.students_count === 1 ? "student" : "students"} ·{" "}
                        {grade.assessments_count}{" "}
                        {grade.assessments_count === 1 ? "assessment" : "assessments"}
                      </p>
                    </div>

                    <span className="shrink-0 text-lg font-bold text-slate-800">
                      {grade.completion_percentage}%
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{
                        width: `${Math.min(
                          grade.completion_percentage || 0,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <ProgressStat
                      label="Complete"
                      value={grade.complete}
                      className="text-green-700"
                    />
                    <ProgressStat
                      label="In Progress"
                      value={grade.in_progress}
                      className="text-blue-700"
                    />
                    <ProgressStat
                      label="Not Started"
                      value={grade.not_started}
                      className="text-slate-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

            Submission Status
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track assessment marking progress by grade, term, and assessment
            type.
          </p>
        </div>

        {gradeNames.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-400 shadow-sm">
            No assessments yet.
          </div>
        )}

        <div className="space-y-4 sm:space-y-5">
          {gradeNames.map((grade) => {
            const gradeTerms = groupedByGrade[grade];
            const gradeRows = gradeAssessments(gradeTerms);
            const gradeSummary = summarizeAssessments(gradeRows);

            return (
              <details
                key={grade}
                open
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-700 sm:text-base">
                      {grade}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {gradeSummary.total} assessments ·{" "}
                      {gradeSummary.complete} complete ·{" "}
                      {gradeSummary.partial} in progress ·{" "}
                      {gradeSummary.notStarted} not started
                    </p>
                  </div>

                  <span
                    aria-hidden="true"
                    className="shrink-0 text-slate-400"
                  >
                    ▾
                  </span>
                </summary>

                <div className="space-y-3 p-3 sm:space-y-4 sm:p-4">
                  {sortedTermNames(gradeTerms).map((term) => {
                    const termTypes = gradeTerms[term];
                    const termRows = termAssessments(termTypes);
                    const termSummary = summarizeAssessments(termRows);

                    return (
                      <details
                        key={term}
                        open
                        className="overflow-hidden rounded-lg border border-slate-200"
                      >
                        <summary className="flex cursor-pointer list-none flex-col gap-2 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-slate-700">
                              {term}
                            </h4>
                          </div>

                          <p className="text-xs leading-5 text-slate-500">
                            {termSummary.total} assessments ·{" "}
                            {termSummary.complete} complete ·{" "}
                            {termSummary.partial} in progress ·{" "}
                            {termSummary.notStarted} not started
                          </p>
                        </summary>

                        <div className="space-y-3 border-t border-slate-100 bg-slate-50/50 p-3">
                          {sortedAssessmentTypes(termTypes).map((type) => {
                            const assessments = termTypes[type];
                            const typeLabel =
                              assessmentTypeLabels[type] ||
                              assessments[0]?.assessment_type_label ||
                              type;

                            const sortedAssessments = [...assessments].sort(
                              (a, b) =>
                                STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
                                compareNames(a.subject, b.subject) ||
                                compareNames(
                                  a.assessment_name,
                                  b.assessment_name
                                )
                            );

                            return (
                              <details
                                key={type}
                                open
                                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                              >
                                <summary className="flex cursor-pointer items-center justify-between gap-3 list-none px-3 py-3 [&::-webkit-details-marker]:hidden">
                                  <div className="min-w-0">
                                    <h5 className="text-sm font-semibold text-slate-700">
                                      {typeLabel}
                                    </h5>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                      {assessments.length}{" "}
                                      {assessments.length === 1
                                        ? "assessment"
                                        : "assessments"}
                                    </p>
                                  </div>

                                  <span
                                    aria-hidden="true"
                                    className="shrink-0 text-slate-400"
                                  >
                                    ▾
                                  </span>
                                </summary>

                                <div className="border-t border-slate-100">
                                  {/* Desktop / tablet table */}
                                  <div className="hidden md:block">
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-left text-slate-600">
                                          <tr>
                                            <th className="px-3 py-3 font-medium">
                                              Assessment
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                              Subject
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                              Students
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                              Submitted
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                              Remaining
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                              Completion
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                              Status
                                            </th>
                                            <th className="px-3 py-3 font-medium" />
                                          </tr>
                                        </thead>

                                        <tbody>
                                          {sortedAssessments.map((r) => {
                                            const remaining =
                                              r.not_submitted ??
                                              Math.max(
                                                (r.total_students || 0) -
                                                  (r.submitted || 0),
                                                0
                                              );

                                            return (
                                              <tr
                                                key={r.assessment_id}
                                                className="border-t border-slate-100"
                                              >
                                                <td className="max-w-[220px] px-3 py-3 font-medium text-slate-700">
                                                  <span className="block truncate">
                                                    {r.assessment_name}
                                                  </span>
                                                </td>

                                                <td className="max-w-[180px] px-3 py-3 text-slate-600">
                                                  <span className="block truncate">
                                                    {r.subject}
                                                  </span>
                                                </td>

                                                <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                                                  {r.total_students}
                                                </td>

                                                <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                                                  {r.submitted}
                                                </td>

                                                <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                                                  {remaining}
                                                </td>

                                                <td className="min-w-[150px] px-3 py-3">
                                                  <div className="flex items-center gap-2">
                                                    <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                                                      <div
                                                        className={`h-full ${
                                                          r.status ===
                                                          "complete"
                                                            ? "bg-green-500"
                                                            : r.status ===
                                                              "partial"
                                                            ? "bg-amber-500"
                                                            : "bg-slate-300"
                                                        }`}
                                                        style={{
                                                          width: `${Math.min(
                                                            Math.max(
                                                              Number(
                                                                r.completion_percentage ||
                                                                  0
                                                              ),
                                                              0
                                                            ),
                                                            100
                                                          )}%`,
                                                        }}
                                                      />
                                                    </div>
                                                    <span className="text-xs text-slate-600">
                                                      {r.completion_percentage ||
                                                        0}
                                                      %
                                                    </span>
                                                  </div>
                                                </td>

                                                <td className="px-3 py-3">
                                                  <span
                                                    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                                                      STATUS_STYLES[r.status]
                                                    }`}
                                                  >
                                                    {statusLabel(r.status)}
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
                                                    style={{
                                                      color:
                                                        "var(--color-gold)",
                                                    }}
                                                  >
                                                    Export .xlsx
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>

                                  {/* Mobile cards */}
                                  <div className="grid gap-3 p-3 md:hidden">
                                    {sortedAssessments.map((r) => {
                                      const remaining =
                                        r.not_submitted ??
                                        Math.max(
                                          (r.total_students || 0) -
                                            (r.submitted || 0),
                                          0
                                        );

                                      return (
                                        <article
                                          key={r.assessment_id}
                                          className="rounded-lg border border-slate-200 bg-white p-3"
                                        >
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                              <h6 className="text-sm font-semibold text-slate-700">
                                                {r.assessment_name}
                                              </h6>
                                              <p className="mt-1 text-xs text-slate-500">
                                                {r.subject}
                                              </p>
                                            </div>

                                            <span
                                              className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                                                STATUS_STYLES[r.status]
                                              }`}
                                            >
                                              {statusLabel(r.status)}
                                            </span>
                                          </div>

                                          <div className="mt-3 grid grid-cols-2 gap-2">
                                            <div className="rounded-md bg-slate-50 p-2">
                                              <p className="text-[11px] text-slate-400">
                                                Students
                                              </p>
                                              <p className="mt-0.5 text-sm font-semibold text-slate-700">
                                                {r.total_students}
                                              </p>
                                            </div>

                                            <div className="rounded-md bg-slate-50 p-2">
                                              <p className="text-[11px] text-slate-400">
                                                Submitted
                                              </p>
                                              <p className="mt-0.5 text-sm font-semibold text-slate-700">
                                                {r.submitted}
                                              </p>
                                            </div>

                                            <div className="rounded-md bg-slate-50 p-2">
                                              <p className="text-[11px] text-slate-400">
                                                Remaining
                                              </p>
                                              <p className="mt-0.5 text-sm font-semibold text-slate-700">
                                                {remaining}
                                              </p>
                                            </div>

                                            <div className="rounded-md bg-slate-50 p-2">
                                              <p className="text-[11px] text-slate-400">
                                                Completion
                                              </p>
                                              <p className="mt-0.5 text-sm font-semibold text-slate-700">
                                                {r.completion_percentage || 0}%
                                              </p>
                                            </div>
                                          </div>

                                          <div className="mt-3">
                                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                              <div
                                                className={`h-full ${
                                                  r.status === "complete"
                                                    ? "bg-green-500"
                                                    : r.status === "partial"
                                                    ? "bg-amber-500"
                                                    : "bg-slate-300"
                                                }`}
                                                style={{
                                                  width: `${Math.min(
                                                    Math.max(
                                                      Number(
                                                        r.completion_percentage ||
                                                          0
                                                      ),
                                                      0
                                                    ),
                                                    100
                                                  )}%`,
                                                }}
                                              />
                                            </div>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              downloadAssessment(
                                                r.assessment_id,
                                                r.assessment_name
                                              )
                                            }
                                            className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-medium underline underline-offset-2 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                            style={{
                                              color: "var(--color-gold)",
                                            }}
                                          >
                                            Export .xlsx
                                          </button>
                                        </article>
                                      );
                                    })}
                                  </div>
                                </div>
                              </details>
                            );
                          })}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </details>
            );
          })}
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
