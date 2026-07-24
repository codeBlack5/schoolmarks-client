import AssessmentTable from "./AssessmentTable";

export default function AssessmentTermGroup({
  grade,
  term,
  items,
  expanded,
  toggle,
  getTermColor,
  renderMarkingBadge,
  handleDelete,
}) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
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
            {items.length}{" "}
            {items.length === 1
              ? "assessment"
              : "assessments"}
          </span>
        </div>

        <span className="text-lg">
          {expanded ? "▼" : "▶"}
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded
            ? "max-h-[2000px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <AssessmentTable
          items={items}
          renderMarkingBadge={renderMarkingBadge}
          handleDelete={handleDelete}
        />
      </div>
    </div>
  );
}