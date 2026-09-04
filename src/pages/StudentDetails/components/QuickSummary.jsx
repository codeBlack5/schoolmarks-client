export default function QuickSummary({
  guardians,
  documents,
  history,
  profile,
}) {
  const profileComplete = Boolean(profile);

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <QuickSummaryCard
        label="Guardians"
        value={guardians.length}
        description={
          guardians.length === 1
            ? "Guardian linked"
            : "Guardians linked"
        }
      />

      <QuickSummaryCard
        label="Documents"
        value={documents.length}
        description={
          documents.length === 1
            ? "Document uploaded"
            : "Documents uploaded"
        }
      />

      <QuickSummaryCard
        label="History"
        value={history.length}
        description="Recorded events"
      />

      <QuickSummaryCard
        label="Profile"
        value={profileComplete ? "Complete" : "Missing"}
        description={
          profileComplete
            ? "Student profile available"
            : "Profile not created"
        }
      />
    </div>
  );
}

function QuickSummaryCard({
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-medium text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-2xl font-semibold text-slate-900">
        {value}
      </div>

      <div className="mt-1 text-xs text-slate-400">
        {description}
      </div>
    </div>
  );
}
