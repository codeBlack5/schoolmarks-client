export default function LearningAreaPerformance({ learningAreas = [] }) {
  if (learningAreas.length === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--color-navy)" }}
          >
            Learning Area Performance
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Performance by learning area for the selected scope.
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-8 text-center">
          <p className="text-sm text-slate-500">
            No learning areas have recorded marks for this selection.
          </p>
        </div>
      </section>
    );
  }

  const sortedLearningAreas = [...learningAreas].sort(
    (a, b) => (b.mean_score ?? 0) - (a.mean_score ?? 0)
  );

  const highestMean = Math.max(
    ...sortedLearningAreas.map((area) => area.mean_score ?? 0)
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--color-navy)" }}
        >
          Learning Area Performance
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Compare mean scores, target achievement, and assessment coverage
          across learning areas.
        </p>
      </div>

      {/* Visual comparison */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">
              Mean score comparison
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Learning areas ranked from highest to lowest mean score.
            </p>
          </div>

          <span className="text-xs text-slate-400">Target: 50%</span>
        </div>

        <div className="space-y-4">
          {sortedLearningAreas.map((area) => {
            const score = area.mean_score ?? 0;
            const width = Math.min(score, 100);

            return (
              <div key={area.subject_id}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {area.subject_name}
                    </p>

                    <p className="text-xs text-slate-400">
                      {area.grade_name}
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-slate-700 shrink-0">
                    {score}%
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
                Learning Area
              </th>

              <th className="px-4 py-3 text-left font-semibold">
                Grade
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
            {sortedLearningAreas.map((area) => {
              const targetPercentage =
                area.meeting_expectations_percentage ?? 0;

              return (
                <tr
                  key={area.subject_id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {area.subject_name}
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    {area.grade_name}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <ScoreBadge score={area.mean_score} />
                  </td>

                  <td className="px-4 py-3 text-right text-slate-600">
                    {formatScore(area.highest_score)}
                  </td>

                  <td className="px-4 py-3 text-right text-slate-600">
                    {formatScore(area.lowest_score)}
                  </td>

                  <td className="px-4 py-3 text-right text-slate-600">
                    {area.students_assessed ?? 0}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-medium text-slate-700">
                        {area.meeting_expectations ?? 0}
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

      {/* Footer insight */}
      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-600">
            Strongest learning area:
          </span>{" "}
          {sortedLearningAreas[0]?.subject_name} with a mean score of{" "}
          {formatScore(sortedLearningAreas[0]?.mean_score)}%.
          {highestMean >= 50
            ? " This is above the 50% Meeting Expectations target."
            : " This is currently below the 50% Meeting Expectations target."}
        </p>
      </div>
    </section>
  );
}

function formatScore(score) {
  return score == null ? "—" : `${Number(score).toFixed(2)}%`;
}

function ScoreBadge({ score }) {
  if (score == null) {
    return <span className="text-slate-400">—</span>;
  }

  const meetsTarget = Number(score) >= 50;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        meetsTarget
          ? "bg-slate-100 text-slate-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {Number(score).toFixed(2)}%
    </span>
  );
}
