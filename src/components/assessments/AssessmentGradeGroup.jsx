import AssessmentTermGroup from "./AssessmentTermGroup";

export default function AssessmentGradeGroup({
  grade,
  terms,
  expanded,
  toggleGrade,
  expandedTerms,
  toggleTerm,
  expandedTypes,
  toggleType,
  getTermColor,
  renderMarkingBadge,
  handleDelete,
}) {
  const assessmentCount = Object.values(terms).reduce(
    (sum, types) =>
      sum +
      Object.values(types).reduce(
        (typeSum, items) => typeSum + items.length,
        0
      ),
    0
  );

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-slate-200">
      <button
        type="button"
        onClick={toggleGrade}
        className="flex w-full items-center justify-between px-4 py-3 font-semibold text-white"
        style={{
          backgroundColor: "var(--color-navy)",
        }}
      >
        <div className="flex items-center gap-3">
          <span>{grade}</span>

          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
            {assessmentCount}{" "}
            {assessmentCount === 1
              ? "assessment"
              : "assessments"}
          </span>
        </div>

        <span className="text-xl">
          {expanded ? "▼" : "▶"}
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded
            ? "max-h-[10000px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-4 bg-slate-50 p-4">
          {Object.entries(terms).map(([term, types]) => {
            const key = `${grade}-${term}`;

            return (
              <AssessmentTermGroup
                key={key}
                grade={grade}
                term={term}
                types={types}
                expanded={expandedTerms[key]}
                toggle={() => toggleTerm(grade, term)}
                expandedTypes={expandedTypes}
                toggleType={toggleType}
                getTermColor={getTermColor}
                renderMarkingBadge={renderMarkingBadge}
                handleDelete={handleDelete}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}