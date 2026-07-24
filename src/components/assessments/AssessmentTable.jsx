import { Link } from "react-router-dom";
import { getMarkingStatus } from "../../utils/assessmentHelpers";

export default function AssessmentTable({
  items,
  renderMarkingBadge,
  handleDelete,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-3 py-2">Assessment</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Subject</th>
            <th className="px-3 py-2">Max Score</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2 text-right">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {items.map((a) => (
            <tr
              key={a.id}
              className="border-t border-slate-100 hover:bg-slate-50"
            >
              <td className="px-3 py-2 font-medium">
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
                  onClick={() =>
                    handleDelete(a.id, a.name)
                  }
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
  );
}