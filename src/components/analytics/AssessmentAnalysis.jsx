export default function AssessmentAnalysis({ assessments = [] }) {
  if (assessments.length === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--color-navy)" }}
          >
            Assessment Analysis
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Compare performance across assessments.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm text-slate-500">
            No assessment results are available for this selection.
          </p>
        </div>
      </section>
    );
  }

  const orderedAssessments = [...assessments].sort((a, b) => {
    const dateA = a.date_administered
      ? new Date(a.date_administered).getTime()
      : 0;

    const dateB = b.date_administered
      ? new Date(b.date_administered).getTime()
      : 0;

    return dateA - dateB;
  });

  const means = orderedAssessments
    .map((assessment) => Number(assessment.mean_score))
    .filter((score) => !Number.isNaN(score));

  const highestMean = means.length ? Math.max(...means) : null;
  const lowestMean = means.length ? Math.min(...means) : null;

  const highestAssessment =
    orderedAssessments.find(
      (assessment) => Number(assessment.mean_score) === highestMean
    ) || null;

  const lowestAssessment =
    orderedAssessments.find(
      (assessment) => Number(assessment.mean_score) === lowestMean
    ) || null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--color-navy)" }}
        >
          Assessment Analysis
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Compare assessment performance and track progress toward the 50%
          Meeting Expectations target.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 border-b border-slate-100">
        <SummaryCard
          label="Assessments"
          value={orderedAssessments.length}
        />

        <SummaryCard
          label="Highest mean"
          value={
            highestMean != null
              ? `${highestMean.toFixed(2)}%`
              : "—"
          }
          detail={highestAssessment?.name}
        />

        <SummaryCard
          label="Lowest mean"
          value={
            lowestMean != null
              ? `${lowestMean.toFixed(2)}%`
              : "—"
          }
          detail={lowestAssessment?.name}
        />
      </div>

      {/* Visual comparison */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">
              Mean score trend
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Assessments are shown in chronological order.
            </p>
          </div>

          <span className="text-xs text-slate-400">
            Target: 50%
          </span>
        </div>

        <div className="space-y-4">
          {orderedAssessments.map((assessment) => {
            const score = Number(assessment.mean_score ?? 0);
            const width = Math.min(Math.max(score, 0), 100);

            return (
              <div key={assessment.assessment_id}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {assessment.name}
                    </p>

                    <p className="text-xs text-slate-400">
                      {assessment.subject_name}
                      {assessment.assessment_type
                        ? ` • ${formatAssessmentType(
                            assessment.assessment_type
                          )}`
                        : ""}
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-slate-700 shrink-0">
                    {formatScore(assessment.mean_score)}
                  </span>
                </div>

                <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden">
                  {/* 50% target marker */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-slate-400 z-10"
                    style={{ left: "50%" }}
                    title="Meeting Expectations target"
                  />

                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${width}%`,
                      backgroundColor:
                        score >= 50
                          ? "var(--color-navy)"
                          : "var(--color-gold)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">
                Assessment
              </th>

              <th className="px-4 py-3 text-left font-semibold">
                Learning Area
              </th>

              <th className="px-4 py-3 text-left font-semibold">
                Date
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Mean
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Highest
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Lowest
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Students
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Meeting Target
              </th>
            </tr>
          </thead>

          <tbody>
            {orderedAssessments.map((assessment) => {
              const targetPercentage =
                assessment.meeting_expectations_percentage ?? 0;

              return (
                <tr
                  key={assessment.assessment_id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {assessment.name}
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    {assessment.subject_name}
                  </td>

                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {formatDate(assessment.date_administered)}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <ScoreBadge score={assessment.mean_score} />
                  </td>

                  <td className="px-4 py-3 text-right text-slate-600">
                    {formatScore(assessment.highest_score)}
                  </td>

                  <td className="px-4 py-3 text-right text-slate-600">
                    {formatScore(assessment.lowest_score)}
                  </td>

                  <td className="px-4 py-3 text-right text-slate-600">
                    {assessment.students_assessed ?? 0}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-medium text-slate-700">
                        {assessment.meeting_expectations ?? 0}
                      </span>

                      <span className="text-xs text-slate-400">
                        {targetPercentage}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Interpretation */}
      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-600">
            Assessment insight:
          </span>{" "}
          {buildInsight(highestAssessment, lowestAssessment)}
        </p>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, detail }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p
        className="mt-2 text-xl font-semibold"
        style={{ color: "var(--color-navy)" }}
      >
        {value}
      </p>

      {detail && (
        <p className="mt-1 text-xs text-slate-400 truncate">
          {detail}
        </p>
      )}
    </div>
  );
}

function ScoreBadge({ score }) {
  if (score == null) {
    return <span className="text-slate-400">—</span>;
  }

  const numericScore = Number(score);
  const meetsTarget = numericScore >= 50;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        meetsTarget
          ? "bg-slate-100 text-slate-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {numericScore.toFixed(2)}%
    </span>
  );
}

function formatScore(score) {
  return score == null
    ? "—"
    : `${Number(score).toFixed(2)}%`;
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAssessmentType(type) {
  if (!type) return "";

  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildInsight(highest, lowest) {
  if (!highest && !lowest) {
    return "There is not enough assessment data to provide an insight.";
  }

  if (highest?.assessment_id === lowest?.assessment_id) {
    return `${highest.name} currently has a mean score of ${formatScore(
      highest.mean_score
    )}.`;
  }

  return `${highest.name} recorded the highest mean score at ${formatScore(
    highest.mean_score
  )}, while ${lowest.name} recorded the lowest at ${formatScore(
    lowest.mean_score
  )}.`;
}
