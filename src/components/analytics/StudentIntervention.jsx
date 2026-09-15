import { useState } from "react";
import { Link } from "react-router-dom";

export default function StudentIntervention({
  decliningStudents = [],
  interventionStudents = [],
}) {
  const [view, setView] = useState("declining");

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--color-navy)" }}
            >
              Student Support & Intervention
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Identify learners whose performance is declining or who
              may need additional support.
            </p>
          </div>

          <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
            <button
              type="button"
              onClick={() => setView("declining")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                view === "declining"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Declining
              <span className="ml-1.5">
                ({decliningStudents.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setView("intervention")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                view === "intervention"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Intervention
              <span className="ml-1.5">
                ({interventionStudents.length})
              </span>
            </button>
          </div>
        </div>
      </div>

      {view === "declining" ? (
        <DecliningStudents students={decliningStudents} />
      ) : (
        <InterventionStudents students={interventionStudents} />
      )}
    </section>
  );
}

function DecliningStudents({ students }) {
  if (students.length === 0) {
    return (
      <EmptyState
        title="No significant declines detected"
        message="No learner has recorded a drop of 5 or more percentage points between consecutive assessments."
      />
    );
  }

  const sortedStudents = [...students].sort(
    (a, b) => (b.decline ?? 0) - (a.decline ?? 0)
  );

  return (
    <div>
      <div className="p-5 border-b border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryCard
            label="Decline records"
            value={students.length}
            detail="Detected performance drops"
          />

          <SummaryCard
            label="Largest decline"
            value={`${sortedStudents[0].decline}%`}
            detail={sortedStudents[0].student_name}
          />

          <SummaryCard
            label="Learning areas affected"
            value={
              new Set(
                students.map((student) => student.subject_id)
              ).size
            }
            detail="With recorded declines"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">
                Student
              </th>

              <th className="px-4 py-3 text-left font-semibold">
                Learning Area
              </th>

              <th className="px-4 py-3 text-left font-semibold">
                Previous
              </th>

              <th className="px-4 py-3 text-left font-semibold">
                Current
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Decline
              </th>

              <th className="px-4 py-3 text-left font-semibold">
                Assessments
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedStudents.map((student, index) => (
              <tr
                key={`${student.student_id}-${student.subject_id}-${index}`}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-700">
                    {student.student_name}
                  </div>

                  <div className="text-xs text-slate-400">
                    {student.admission_number || "—"}
                  </div>
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {student.subject_name}
                </td>

                <td className="px-4 py-3">
                  <div className="text-slate-600">
                    {formatScore(student.previous_score)}
                  </div>

                  <div className="text-xs text-slate-400">
                    {student.previous_assessment}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="text-slate-600">
                    {formatScore(student.current_score)}
                  </div>

                  <div className="text-xs text-slate-400">
                    {student.current_assessment}
                  </div>
                </td>

                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    -{formatScore(student.decline)}
                  </span>
                </td>

                <td className="px-4 py-3 text-slate-500">
                  {student.previous_assessment} →{" "}
                  {student.current_assessment}
                </td>

                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/teacher/students/${student.student_id}/interventions?subject_id=${student.subject_id}&reason=decline&baseline_score=${student.current_score}`}
                    className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                    style={{ backgroundColor: "var(--color-navy)" }}
                  >
                    Review / Intervene
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-600">
            Teacher action:
          </span>{" "}
          Review the affected learning areas with these learners and
          compare their recent work, attendance, and assessment
          feedback before planning targeted support.
        </p>
      </div>
    </div>
  );
}

function InterventionStudents({ students }) {
  if (students.length === 0) {
    return (
      <EmptyState
        title="No intervention cases detected"
        message="All learners with recorded results currently have learning-area averages at or above the 50% target."
      />
    );
  }

  const sortedStudents = [...students].sort(
    (a, b) => (a.mean_score ?? 0) - (b.mean_score ?? 0)
  );

  return (
    <div>
      <div className="p-5 border-b border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryCard
            label="Learners needing support"
            value={students.length}
            detail="At least one area below target"
          />

          <SummaryCard
            label="Lowest mean"
            value={formatScore(sortedStudents[0].mean_score)}
            detail={sortedStudents[0].student_name}
          />

          <SummaryCard
            label="Areas below target"
            value={students.reduce(
              (total, student) =>
                total + (student.subjects_below_target ?? 0),
              0
            )}
            detail="Across identified learners"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">
                Student
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Overall Mean
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Areas Below Target
              </th>

              <th className="px-4 py-3 text-left font-semibold">
                Learning Areas Requiring Support
              </th>
              <th className="px-4 py-3 text-right font-semibold">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedStudents.map((student) => (
              <tr
                key={student.student_id}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-700">
                    {student.student_name}
                  </div>

                  <div className="text-xs text-slate-400">
                    {student.admission_number || "—"}
                  </div>
                </td>

                <td className="px-4 py-3 text-right">
                  <ScoreBadge score={student.mean_score} />
                </td>

                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    {student.subjects_below_target ?? 0}
                    {" / "}
                    {student.total_subjects ?? 0}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {(student.subjects || []).map((subject) => (
                      <span
                        key={subject.subject_id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-700"
                      >
                        <span className="font-medium">
                          {subject.subject_name}
                        </span>

                        <span>
                          {formatScore(subject.mean_score)}
                        </span>
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  {student.subjects?.length > 0 ? (
                    <div className="flex flex-col items-end gap-2">
                      {student.subjects.map((subject) => (
                        <Link
                          key={subject.subject_id}
                          to={`/teacher/students/${student.student_id}/interventions?subject_id=${subject.subject_id}&reason=below_target&baseline_score=${subject.mean_score}&target_score=50`}
                          className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                          style={{ backgroundColor: "var(--color-navy)" }}
                        >
                          Intervene
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">
                      No subject identified
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-600">
            Teacher action:
          </span>{" "}
          Prioritise learners with the lowest means and multiple
          learning areas below 50%, then create targeted remediation
          activities for the affected areas.
        </p>
      </div>
    </div>
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
        <p className="mt-1 text-xs text-slate-400 truncate">
          {detail}
        </p>
      )}
    </div>
  );
}

function ScoreBadge({ score }) {
  if (score == null) {
    return <span className="text-slate-400">—</span>;
  }

  const numericScore = Number(score);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        numericScore >= 50
          ? "bg-slate-100 text-slate-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {numericScore.toFixed(2)}%
    </span>
  );
}

function formatScore(score) {
  return score == null
    ? "—"
    : `${Number(score).toFixed(2)}%`;
}

function EmptyState({ title, message }) {
  return (
    <div className="p-8 text-center">
      <p className="text-sm font-medium text-slate-700">
        {title}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {message}
      </p>
    </div>
  );
}
