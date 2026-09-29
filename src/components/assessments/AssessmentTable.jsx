import { Link } from "react-router-dom";

export default function AssessmentTable({
  items,
  renderMarkingBadge,
  handleDelete,
}) {
  return (
    <div>
      {/* Mobile assessment cards */}
      <div className="space-y-3 p-3 md:hidden">
        {items.map((a) => (
          <article
            key={a.id}
            className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="break-words font-semibold leading-5 text-slate-900">
                  {a.name}
                </h3>
                <p className="mt-1 break-words text-xs text-slate-500">
                  {a.subject?.name || "No subject"}
                </p>
              </div>

              <div className="shrink-0">
                {renderMarkingBadge(a.marking)}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
              <div>
                <p className="text-slate-400">Type</p>
                <p className="mt-0.5 font-medium capitalize text-slate-700">
                  {a.assessment_type.replace("_", " ")}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Max Score</p>
                <p className="mt-0.5 font-medium text-slate-700">
                  {a.max_score}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Link
                to={`/marks/${a.id}`}
                className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold underline"
                style={{
                  color: "var(--color-gold)",
                }}
              >
                Enter Marks
              </Link>

              <Link
                to={`/assessments/${a.id}/edit`}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Edit
              </Link>

              <button
                type="button"
                onClick={() => handleDelete(a.id, a.name)}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-100 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </article>
        ))}

        {items.length === 0 && (
          <div className="px-3 py-6 text-center text-sm text-slate-500">
            No assessments found.
          </div>
        )}
      </div>

      {/* Desktop assessment table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Assessment</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Subject</th>
              <th className="px-3 py-2">Max Score</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((a) => (
              <tr
                key={a.id}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="break-words px-3 py-2 font-medium">
                  {a.name}
                </td>

                <td className="px-3 py-2 capitalize">
                  {a.assessment_type.replace("_", " ")}
                </td>

                <td className="px-3 py-2">
                  {a.subject?.name}
                </td>

                <td className="px-3 py-2">
                  {a.max_score}
                </td>

                <td className="px-3 py-2">
                  {renderMarkingBadge(a.marking)}
                </td>

                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <Link
                    to={`/marks/${a.id}`}
                    className="mr-4 underline"
                    style={{
                      color: "var(--color-gold)",
                    }}
                  >
                    Enter Marks
                  </Link>

                  <Link
                    to={`/assessments/${a.id}/edit`}
                    className="mr-4 underline text-slate-600"
                  >
                    Edit
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(a.id, a.name)}
                    className="underline text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  No assessments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
