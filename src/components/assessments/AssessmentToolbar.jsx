import { Link } from "react-router-dom";

export default function AssessmentToolbar({
  search,
  setSearch,
  year,
  setYear,
  years,
}) {
  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:mb-6 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Search assessments or subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-10 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm"
          />

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-auto sm:min-w-36 sm:text-sm"
          >
            <option value="">All Years</option>

            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex w-full lg:w-auto">
          <Link
            to="/assessments/new"
            className="inline-flex min-h-10 w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-slate-300 lg:w-auto"
            style={{ backgroundColor: "var(--color-navy)" }}
          >
            + New Assessment
          </Link>
        </div>
      </div>
    </div>
  );
}
