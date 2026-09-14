import { useState } from "react";

export default function StudentPerformanceRanking({
  overallRanking = [],
  subjectRanking = [],
}) {
  const [view, setView] = useState("overall");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const availableSubjects = subjectRanking;

  const selectedSubject =
    subjectRanking.find(
      (subject) =>
        String(subject.subject_id) === String(selectedSubjectId)
    ) || null;

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
              Student Performance & Rankings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review overall learner performance and learning-area
              rankings.
            </p>
          </div>

          <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
            <button
              type="button"
              onClick={() => setView("overall")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                view === "overall"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Overall
            </button>

            <button
              type="button"
              onClick={() => setView("subject")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                view === "subject"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Learning Area
            </button>
          </div>
        </div>
      </div>

      {/* Overall ranking */}
      {view === "overall" && (
        <OverallRanking overallRanking={overallRanking} />
      )}

      {/* Subject ranking */}
      {view === "subject" && (
        <>
          <div className="p-5 border-b border-slate-100">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Learning Area
            </label>

            <select
              value={selectedSubjectId}
              onChange={(event) =>
                setSelectedSubjectId(event.target.value)
              }
              className="w-full sm:max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">
                Select a learning area...
              </option>

              {availableSubjects.map((subject) => (
                <option
                  key={subject.subject_id}
                  value={subject.subject_id}
                >
                  {subject.subject_name} — {subject.grade_name}
                </option>
              ))}
            </select>
          </div>

          {!selectedSubject && (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">
                Select a learning area to view student rankings.
              </p>
            </div>
          )}

          {selectedSubject && (
            <SubjectRanking subject={selectedSubject} />
          )}
        </>
      )}
    </section>
  );
}

function OverallRanking({ overallRanking }) {
  if (overallRanking.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">
          No overall ranking data is available for this selection.
        </p>
      </div>
    );
  }

  return (
    <div>
      {overallRanking.map((grade) => (
        <div key={grade.grade_id}>
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">
              {grade.grade_name}
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Overall learner ranking
            </p>
          </div>

          <RankingTable students={grade.students || []} />
        </div>
      ))}
    </div>
  );
}

function SubjectRanking({ subject }) {
  const students = subject.students || [];

  if (students.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">
          No ranking data is available for this learning area.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">
          {subject.subject_name}
        </h3>

        <p className="mt-1 text-xs text-slate-400">
          {subject.grade_name} · Learning-area ranking
        </p>
      </div>

      <RankingTable students={students} />
    </div>
  );
}

function RankingTable({ students }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-white text-slate-500 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-center font-semibold">
              Rank
            </th>

            <th className="px-4 py-3 text-left font-semibold">
              Student
            </th>

            <th className="px-4 py-3 text-left font-semibold">
              Admission No.
            </th>

            <th className="px-4 py-3 text-right font-semibold">
              Mean Score
            </th>

            <th className="px-4 py-3 text-right font-semibold">
              Learning Areas
            </th>
          </tr>
        </thead>

        <tbody>
          {students.map((student, index) => (
            <tr
              key={student.student_id}
              className={`border-t border-slate-100 hover:bg-slate-50 ${
                index < 3 ? "bg-slate-50/50" : ""
              }`}
            >
              <td className="px-4 py-3 text-center">
                <RankBadge rank={student.rank} />
              </td>

              <td className="px-4 py-3">
                <div className="font-medium text-slate-700">
                  {student.student_name}
                </div>
              </td>

              <td className="px-4 py-3 text-slate-500">
                {student.admission_number || "—"}
              </td>

              <td className="px-4 py-3 text-right">
                <ScoreBadge score={student.mean_score} />
              </td>

              <td className="px-4 py-3 text-right text-slate-500">
                {student.subjects_assessed ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankBadge({ rank }) {
  if (rank == null) {
    return <span className="text-slate-400">—</span>;
  }

  let classes = "bg-slate-100 text-slate-700";

  if (rank === 1) {
    classes = "bg-slate-200 text-slate-800";
  } else if (rank === 2) {
    classes = "bg-slate-100 text-slate-700";
  } else if (rank === 3) {
    classes = "bg-slate-100 text-slate-600";
  }

  return (
    <span
      className={`inline-flex min-w-8 justify-center rounded-full px-2.5 py-1 text-xs font-bold ${classes}`}
    >
      {rank}
    </span>
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
