import AssessmentTable from "./AssessmentTable";

const assessmentTypeLabels = {
  opener: "Opener",
  cat: "CAT",
  mid_term: "Mid Term",
  end_term: "End Term",
};

const assessmentTypeOrder = [
  "opener",
  "cat",
  "mid_term",
  "end_term",
];

function getAssessmentTypeLabel(type) {
  return (
    assessmentTypeLabels[type] ||
    type
      ?.replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) ||
    "Other"
  );
}

function sortAssessmentTypes(types) {
  return [...types].sort((a, b) => {
    const indexA = assessmentTypeOrder.indexOf(a);
    const indexB = assessmentTypeOrder.indexOf(b);

    const orderA = indexA === -1 ? 999 : indexA;
    const orderB = indexB === -1 ? 999 : indexB;

    return orderA - orderB;
  });
}

export default function AssessmentTermGroup({
  grade,
  term,
  types,
  expanded,
  toggle,
  expandedTypes,
  toggleType,
  getTermColor,
  renderMarkingBadge,
  handleDelete,
}) {
  const assessmentCount = Object.values(types).reduce(
    (sum, items) => sum + items.length,
    0
  );

  const orderedTypes = sortAssessmentTypes(
    Object.keys(types)
  );

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      {/* Term header */}
      <button
        type="button"
        onClick={toggle}
        className={`flex w-full items-center justify-between border-b px-4 py-3 font-medium transition-colors ${getTermColor(
          term
        )}`}
      >
        <div className="flex items-center gap-3">
          <span>{term}</span>

          <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold">
            {assessmentCount}{" "}
            {assessmentCount === 1
              ? "assessment"
              : "assessments"}
          </span>
        </div>

        <span className="text-lg">
          {expanded ? "▼" : "▶"}
        </span>
      </button>

      {/* Assessment types */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded
            ? "max-h-[10000px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-3 bg-slate-50 p-3 sm:p-4">
          {orderedTypes.map((type) => {
            const items = types[type];
            const key = `${grade}-${term}-${type}`;
            const typeExpanded = expandedTypes[key];

            return (
              <div
                key={key}
                className="overflow-hidden rounded-md border border-slate-200 bg-white"
              >
                {/* Assessment type header */}
                <button
                  type="button"
                  onClick={() =>
                    toggleType(grade, term, type)
                  }
                  className="flex w-full items-center justify-between border-b border-slate-200 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="font-semibold"
                      style={{
                        color: "var(--color-navy)",
                      }}
                    >
                      {getAssessmentTypeLabel(type)}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {items.length}{" "}
                      {items.length === 1
                        ? "assessment"
                        : "assessments"}
                    </span>
                  </div>

                  <span className="text-lg text-slate-500">
                    {typeExpanded ? "▼" : "▶"}
                  </span>
                </button>

                {/* Assessment table */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    typeExpanded
                      ? "max-h-[5000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <AssessmentTable
                    items={items}
                    renderMarkingBadge={
                      renderMarkingBadge
                    }
                    handleDelete={handleDelete}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}