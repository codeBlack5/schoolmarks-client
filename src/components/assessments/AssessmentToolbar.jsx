import { Link } from "react-router-dom";

export default function AssessmentToolbar({
  search,
  setSearch,
  year,
  setYear,
  years,
}) {
  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Side */}
        <div className="flex flex-1 flex-col gap-3 md:flex-row">
          {/* Search */}
          <input
            type="text"
            placeholder="Search assessments or subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />

          {/* Academic Year */}
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">All Years</option>

            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <Link
            to="/assessments/new"
            className="rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-navy)" }}
          >
            + New Assessment
          </Link>
        </div>
      </div>
    </div>
  );
}