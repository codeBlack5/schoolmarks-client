export default function PerformanceDistribution({
  distribution = {},
}) {
  const ee = Number(distribution.ee ?? 0);
  const me = Number(distribution.me ?? 0);
  const ae = Number(distribution.ae ?? 0);
  const be = Number(distribution.be ?? 0);

  const total = Number(
    distribution.total ?? ee + me + ae + be
  );

  const categories = [
    {
      key: "EE",
      label: "Exceeds Expectations",
      range: "75–100%",
      count: ee,
      description: "Learners performing above the expected level.",
    },
    {
      key: "ME",
      label: "Meeting Expectations",
      range: "50–74%",
      count: me,
      description: "Learners achieving the expected performance level.",
    },
    {
      key: "AE",
      label: "Approaching Expectations",
      range: "30–49%",
      count: ae,
      description: "Learners who are below the expected target.",
    },
    {
      key: "BE",
      label: "Below Expectations",
      range: "0–29%",
      count: be,
      description: "Learners requiring significant support.",
    },
  ];

  const meetingTarget = ee + me;
  const belowTarget = ae + be;

  const meetingTargetPercentage = percentage(
    meetingTarget,
    total
  );

  const belowTargetPercentage = percentage(
    belowTarget,
    total
  );

  const largestCategory =
    [...categories].sort((a, b) => b.count - a.count)[0];

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--color-navy)" }}
        >
          Performance Distribution
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Understand how learner results are distributed across the
          four performance levels.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 border-b border-slate-100">
        <SummaryCard
          label="Total results"
          value={total}
          detail="Recorded marks"
        />

        <SummaryCard
          label="Meeting target"
          value={`${meetingTargetPercentage}%`}
          detail={`${meetingTarget} results at 50% or above`}
        />

        <SummaryCard
          label="Below target"
          value={`${belowTargetPercentage}%`}
          detail={`${belowTarget} results below 50%`}
        />
      </div>

      {/* Distribution */}
      <div className="p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-700">
            Results by performance level
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            Each result is classified according to the school's
            existing grading scale.
          </p>
        </div>

        <div className="space-y-5">
          {categories.map((category) => {
            const percentageValue = percentage(
              category.count,
              total
            );

            const width = Math.min(
              Math.max(percentageValue, 0),
              100
            );

            return (
              <div key={category.key}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-bold bg-slate-100 text-slate-700"
                      >
                        {category.key}
                      </span>

                      <span className="text-sm font-medium text-slate-700">
                        {category.label}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      {category.range} · {category.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-700">
                      {category.count}
                    </p>

                    <p className="text-xs text-slate-400">
                      {percentageValue}%
                    </p>
                  </div>
                </div>

                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${width}%`,
                      backgroundColor: getCategoryColor(
                        category.key
                      ),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target comparison */}
      <div className="px-5 pb-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Meeting Expectations target
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {meetingTargetPercentage}% of recorded results
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-400">
                Target threshold
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                50%+
              </p>
            </div>
          </div>

          <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(
                  meetingTargetPercentage,
                  100
                )}%`,
                backgroundColor: "var(--color-navy)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Insight */}
      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-600">
            Performance insight:
          </span>{" "}
          {buildInsight(
            largestCategory,
            meetingTargetPercentage,
            belowTargetPercentage,
            total
          )}
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
        <p className="mt-1 text-xs text-slate-400">
          {detail}
        </p>
      )}
    </div>
  );
}

function percentage(part, total) {
  if (!total) return 0;

  return Number(((part / total) * 100).toFixed(2));
}

function getCategoryColor(category) {
  if (category === "EE") {
    return "var(--color-navy)";
  }

  if (category === "ME") {
    return "var(--color-gold)";
  }

  if (category === "AE") {
    return "var(--color-gold)";
  }

  return "var(--color-gold)";
}

function buildInsight(
  largestCategory,
  meetingTargetPercentage,
  belowTargetPercentage,
  total
) {
  if (!total) {
    return "There are no recorded results for this selection.";
  }

  if (meetingTargetPercentage >= 75) {
    return `A strong ${meetingTargetPercentage}% of recorded results are meeting or exceeding the 50% target.`;
  }

  if (belowTargetPercentage >= 50) {
    return `${belowTargetPercentage}% of recorded results are below the 50% target. This area may require focused intervention.`;
  }

  return `${largestCategory.label} is the largest performance group, containing ${largestCategory.count} recorded results (${percentage(
    largestCategory.count,
    total
  )}%).`;
}
