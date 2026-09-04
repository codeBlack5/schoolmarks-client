export default function StudentDetailsSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Back link */}
      <div className="mb-5 h-4 w-32 rounded bg-slate-200" />

      {/* Student header */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 shrink-0 rounded-full bg-slate-200" />

            <div className="space-y-3">
              <div className="h-6 w-48 rounded bg-slate-200" />

              <div className="h-4 w-64 rounded bg-slate-200" />

              <div className="h-3 w-36 rounded bg-slate-100" />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="h-9 w-28 rounded-lg bg-slate-200" />
            <div className="h-9 w-20 rounded-lg bg-slate-200" />
          </div>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="h-3 w-72 rounded bg-slate-100" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="h-4 w-20 rounded bg-slate-200" />

            <div className="mt-3 h-7 w-12 rounded bg-slate-200" />

            <div className="mt-2 h-3 w-28 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-6 border-b border-slate-200">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-8 w-20 rounded bg-slate-100"
          />
        ))}
      </div>

      {/* Overview sections */}
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, sectionIndex) => (
          <div
            key={sectionIndex}
            className="rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="h-4 w-32 rounded bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, itemIndex) => (
                <div key={itemIndex}>
                  <div className="h-3 w-20 rounded bg-slate-100" />

                  <div className="mt-2 h-4 w-32 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}