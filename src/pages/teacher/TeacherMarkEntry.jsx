import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  PenLine,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import client from "../../api/client";

const assessmentTypeLabels = {
  opener: "Opener",
  cat: "CAT",
  mid_term: "Mid Term",
  end_term: "End Term",
};

function getAssessmentTypeLabel(type) {
  return assessmentTypeLabels[type] || type || "Assessment";
}

function getProgress(assessment) {
  if (assessment.marking) {
    return assessment.marking.processing_percentage || 0;
  }

  if (!assessment.students_count) return 0;

  return Math.round(
    ((assessment.marked_count || 0) / assessment.students_count) * 100
  );
}

function getStatus(assessment) {
  if (assessment.marking_complete) {
    return {
      label: "Complete",
      className: "bg-green-100 text-green-700",
      icon: CheckCircle2,
    };
  }

  if ((assessment.marking?.processed || assessment.marked_count || 0) > 0) {
    return {
      label: "In progress",
      className: "bg-yellow-100 text-yellow-700",
      icon: Clock3,
    };
  }

  return {
    label: "Not started",
    className: "bg-red-100 text-red-700",
    icon: AlertCircle,
  };
}

export default function TeacherMarkEntry() {
  const [classes, setClasses] = useState([]);
  const [gradeId, setGradeId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadClasses() {
      setLoading(true);
      setError("");

      try {
        const response = await client.get("/teacher/classes");

        if (cancelled) return;

        const availableClasses = response.data?.classes || [];

        setClasses(availableClasses);

        if (availableClasses.length > 0) {
          setGradeId(String(availableClasses[0].id));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.error ||
              "Could not load your classes."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadClasses();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!gradeId) {
      setData(null);
      return;
    }

    let cancelled = false;

    async function loadAssessments() {
      setLoadingAssessments(true);
      setError("");

      try {
        const response = await client.get("/teacher/assessments", {
          params: {
            grade_id: gradeId,
          },
        });

        if (!cancelled) {
          setData(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.error ||
              "Could not load assessments for this class."
          );
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingAssessments(false);
        }
      }
    }

    loadAssessments();

    return () => {
      cancelled = true;
    };
  }, [gradeId]);

  const assessments = data?.assessments || [];

  const needsMarking = useMemo(
    () => assessments.filter((assessment) => !assessment.marking_complete),
    [assessments]
  );

  const completed = useMemo(
    () => assessments.filter((assessment) => assessment.marking_complete),
    [assessments]
  );

  const markingStats = useMemo(() => {
    const total = assessments.length;
    const complete = completed.length;
    const remaining = needsMarking.length;

    return {
      total,
      complete,
      remaining,
    };
  }, [assessments, completed, needsMarking]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: "var(--color-navy)" }}
          >
            <PenLine className="text-white" size={20} />
          </div>

          <div>
            <h1
              className="text-xl font-semibold"
              style={{ color: "var(--color-navy)" }}
            >
              Mark Entry
            </h1>

            <p className="text-sm text-slate-500">
              Enter and complete marks for your assessments.
            </p>
          </div>
        </div>
      </div>

      {/* Class selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Class
        </label>

        <select
          value={gradeId}
          onChange={(event) => setGradeId(event.target.value)}
          disabled={loading || classes.length === 0}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-50 sm:max-w-sm"
        >
          {loading && <option value="">Loading classes...</option>}

          {!loading && classes.length === 0 && (
            <option value="">No classes available</option>
          )}

          {!loading &&
            classes.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
        </select>

        {data?.grade && (
          <p className="mt-2 text-xs text-slate-500">
            {data.grade.students_count} active students
          </p>
        )}
      </div>

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary */}
      {!loadingAssessments && data && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <SummaryCard
            label="Assessments"
            value={markingStats.total}
          />

          <SummaryCard
            label="Needs marking"
            value={markingStats.remaining}
          />

          <SummaryCard
            label="Completed"
            value={markingStats.complete}
          />
        </div>
      )}

      {/* Loading */}
      {loadingAssessments && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">
            Loading marking queue...
          </p>
        </div>
      )}

      {/* Marking queue */}
      {!loadingAssessments && data && (
        <>
          <section>
            <div className="mb-3">
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--color-navy)" }}
              >
                Needs marking
              </h2>

              <p className="text-sm text-slate-500">
                Continue unfinished assessments or start marking a new one.
              </p>
            </div>

            {needsMarking.length === 0 ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                <CheckCircle2
                  className="mx-auto mb-2 text-green-600"
                  size={30}
                />

                <p className="font-medium text-green-800">
                  All assessments are fully marked.
                </p>

                <p className="mt-1 text-sm text-green-700">
                  There is no outstanding marking for this class.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {needsMarking.map((assessment) => (
                  <MarkingCard
                    key={assessment.id}
                    assessment={assessment}
                  />
                ))}
              </div>
            )}
          </section>

          {completed.length > 0 && (
            <section>
              <div className="mb-3">
                <h2
                  className="text-base font-semibold"
                  style={{ color: "var(--color-navy)" }}
                >
                  Completed assessments
                </h2>

                <p className="text-sm text-slate-500">
                  Review marks that have already been entered.
                </p>
              </div>

              <div className="space-y-3">
                {completed.map((assessment) => (
                  <MarkingCard
                    key={assessment.id}
                    assessment={assessment}
                    completed
                  />
                ))}
              </div>
            </section>
          )}

          {assessments.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <BookOpen
                className="mx-auto mb-3 text-slate-400"
                size={36}
              />

              <h2 className="font-medium text-slate-800">
                No assessments available
              </h2>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                There are currently no assessments for the subjects you teach
                in this class.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p
        className="mt-1 text-2xl font-semibold"
        style={{ color: "var(--color-navy)" }}
      >
        {value}
      </p>
    </div>
  );
}

function MarkingCard({ assessment, completed = false }) {
  const progress = getProgress(assessment);
  const status = getStatus(assessment);
  const StatusIcon = status.icon;

  const processed =
    assessment.marking?.processed ??
    assessment.marked_count ??
    0;

  const students = assessment.students_count || 0;
  const remaining = Math.max(students - processed, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">
              {assessment.name}
            </h3>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
            >
              <StatusIcon size={13} />
              {status.label}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {assessment.subject?.name}
            {" · "}
            {assessment.term?.name}
            {" · "}
            {getAssessmentTypeLabel(assessment.assessment_type)}
          </p>
        </div>

        <div className="text-left lg:text-right">
          <p className="text-sm font-medium text-slate-700">
            {processed} / {students} processed
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {completed
              ? "All students processed"
              : `${remaining} student${remaining === 1 ? "" : "s"} remaining`}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Max score: {assessment.max_score}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>Marking progress</span>
          <span>{progress}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              backgroundColor: "var(--color-navy)",
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {assessment.date_administered
            ? `Administered ${assessment.date_administered}`
            : "Date not recorded"}
        </p>

        <Link
          to={`/teacher/mark-entry/${assessment.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-navy)" }}
        >
          {completed ? "Review marks" : processed > 0 ? "Continue marking" : "Enter marks"}

          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
