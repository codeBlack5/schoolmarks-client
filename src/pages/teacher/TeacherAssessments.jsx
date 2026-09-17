import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ClipboardList,
  ChevronRight,
  Search,
  CheckCircle2,
  Clock3,
  AlertCircle,
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

function groupAssessmentsByType(assessments) {
  const groups = {};

  assessments.forEach((assessment) => {
    const type = assessment.assessment_type || "other";

    if (!groups[type]) {
      groups[type] = [];
    }

    groups[type].push(assessment);
  });

  return groups;
}

const assessmentTypeOrder = [
  "opener",
  "cat",
  "mid_term",
  "end_term",
];

function sortAssessmentTypes(types) {
  return [...types].sort((a, b) => {
    const indexA = assessmentTypeOrder.indexOf(a);
    const indexB = assessmentTypeOrder.indexOf(b);

    const orderA = indexA === -1 ? 999 : indexA;
    const orderB = indexB === -1 ? 999 : indexB;

    return orderA - orderB;
  });
}

function getProgress(assessment) {
    const marking = assessment.marking;
  if (marking) {
    return marking.processing_percentage || 0;
  }

  if (!assessment.students_count) return 0;

  return Math.round(
    (assessment.marked_count / assessment.students_count) * 100
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

  if (assessment.marked_count > 0) {
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

export default function TeacherAssessments() {
  const [searchParams] = useSearchParams();

  const requestedGradeId = searchParams.get("grade_id") || "";

  const [classes, setClasses] = useState([]);
  const [gradeId, setGradeId] = useState(requestedGradeId);

  const [data, setData] = useState(null);

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  const [error, setError] = useState("");

  const [subjectFilter, setSubjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  /*
   * Load the classes the teacher is allowed to access.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadClasses() {
      setLoadingClasses(true);
      setError("");

      try {
        const response = await client.get("/teacher/classes");

        if (cancelled) return;

        const availableClasses = response.data?.classes || [];

        setClasses(availableClasses);

        /*
         * If the URL supplied a grade_id and that class is accessible,
         * keep it selected.
         *
         * Otherwise automatically select the first available class.
         */
        const requestedClass = availableClasses.find(
          (grade) => String(grade.id) === String(requestedGradeId)
        );

        if (requestedClass) {
          setGradeId(String(requestedClass.id));
        } else if (availableClasses.length > 0) {
          setGradeId(String(availableClasses[0].id));
        } else {
          setGradeId("");
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
          setLoadingClasses(false);
        }
      }
    }

    loadClasses();

    return () => {
      cancelled = true;
    };
  }, [requestedGradeId]);

  /*
   * Load assessments whenever the selected class changes.
   */
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
              "Could not load teacher assessments."
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
  const subjects = data?.subjects || [];

  const filteredAssessments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assessments.filter((assessment) => {
      const matchesSubject =
        subjectFilter === "all" ||
        String(assessment.subject?.id) === String(subjectFilter);

      const matchesType =
        typeFilter === "all" ||
        assessment.assessment_type === typeFilter;

      const matchesSearch =
        !query ||
        assessment.name?.toLowerCase().includes(query) ||
        assessment.subject?.name?.toLowerCase().includes(query) ||
        assessment.term?.name?.toLowerCase().includes(query);

      return matchesSubject && matchesType && matchesSearch;
    });
  }, [assessments, subjectFilter, typeFilter, search]);

  const groupedAssessments = useMemo(() => {
  const groups = groupAssessmentsByType(filteredAssessments);

  return sortAssessmentTypes(Object.keys(groups)).map((type) => ({
    type,
    assessments: groups[type],
  }));
}, [filteredAssessments]);

  const statistics = useMemo(() => {
    const total = assessments.length;

    const completed = assessments.filter(
      (assessment) => assessment.marking_complete
    ).length;

    const inProgress = assessments.filter(
    (assessment) =>
        !assessment.marking_complete &&
        (assessment.marking?.processed || assessment.marked_count || 0) > 0
    ).length;

    const notStarted = assessments.filter(
    (assessment) =>
        (assessment.marking?.processed || assessment.marked_count || 0) === 0
    ).length;


    return {
      total,
      completed,
      inProgress,
      notStarted,
    };
  }, [assessments]);

  function handleClassChange(event) {
    const value = event.target.value;

    setGradeId(value);

    setSubjectFilter("all");
    setTypeFilter("all");
    setSearch("");
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: "var(--color-navy)" }}
          >
            <ClipboardList className="text-white" size={20} />
          </div>

          <div>
            <h1
              className="text-xl font-semibold"
              style={{ color: "var(--color-navy)" }}
            >
              Assessments
            </h1>

            <p className="text-sm text-slate-500">
              Review assessments and continue marking your students.
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
          onChange={handleClassChange}
          disabled={loadingClasses || classes.length === 0}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-50 sm:max-w-sm"
        >
          {loadingClasses && (
            <option value="">Loading classes...</option>
          )}

          {!loadingClasses && classes.length === 0 && (
            <option value="">No classes available</option>
          )}

          {!loadingClasses && classes.length > 0 && (
            <>
              {!gradeId && (
                <option value="">Select a class</option>
              )}

              {classes.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </>
          )}
        </select>

        {data?.grade && (
          <p className="mt-2 text-xs text-slate-500">
            {data.grade.students_count} active students
          </p>
        )}
      </div>

      {error && !loadingClasses && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loadingAssessments && gradeId && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">
            Loading assessments...
          </p>
        </div>
      )}

      {!loadingAssessments &&
        !error &&
        !gradeId &&
        !loadingClasses && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <BookOpen
              className="mx-auto mb-3 text-slate-400"
              size={36}
            />

            <h2 className="font-medium text-slate-800">
              Select a class
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose one of your classes to view its assessments.
            </p>
          </div>
        )}

      {data && !loadingAssessments && !error && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Total"
              value={statistics.total}
            />

            <StatCard
              label="Complete"
              value={statistics.completed}
            />

            <StatCard
              label="In progress"
              value={statistics.inProgress}
            />

            <StatCard
              label="Not started"
              value={statistics.notStarted}
            />
          </div>

          {/* Filters */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search assessments..."
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm"
                />
              </div>

              <select
                value={subjectFilter}
                onChange={(event) =>
                  setSubjectFilter(event.target.value)
                }
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="all">All subjects</option>

                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value)
                }
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="all">All assessment types</option>
                <option value="opener">Opener</option>
                <option value="cat">CAT</option>
                <option value="mid_term">Mid Term</option>
                <option value="end_term">End Term</option>
              </select>
            </div>
          </div>

          {/* Assessment list */}
          {filteredAssessments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <ClipboardList
                className="mx-auto mb-3 text-slate-400"
                size={36}
              />

              <h2 className="font-medium text-slate-800">
                {assessments.length === 0
                  ? "No assessments yet"
                  : "No matching assessments"}
              </h2>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                {assessments.length === 0
                  ? "There are currently no assessments for the subjects you teach in this class."
                  : "Try changing the search or filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedAssessments.map(({ type, assessments }) => (
                <AssessmentTypeGroup
                  key={type}
                  type={type}
                  assessments={assessments}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
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

function AssessmentTypeGroup({ type, assessments }) {
  const [open, setOpen] = useState(true);

  const completed = assessments.filter(
    (assessment) => assessment.marking_complete
  ).length;

  const total = assessments.length;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Group header */}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: "var(--color-navy)",
            }}
          >
            <ClipboardList
              size={17}
              className="text-white"
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className="font-semibold"
                style={{
                  color: "var(--color-navy)",
                }}
              >
                {getAssessmentTypeLabel(type)}
              </h2>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {total} {total === 1 ? "assessment" : "assessments"}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              {completed} of {total} complete
            </p>
          </div>
        </div>

        <ChevronRight
          size={20}
          className={`shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>

      {/* Group contents */}
      {open && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-3 sm:p-4">
          <div className="space-y-3">
            {assessments.map((assessment) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AssessmentCard({ assessment }) {
  const progress = getProgress(assessment);
  const status = getStatus(assessment);
  const StatusIcon = status.icon;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-slate-900">
              {assessment.name}
            </h2>

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
                {assessment.marking?.processed ?? assessment.marked_count} /{" "}
                {assessment.students_count} processed
            </p>

            <p className="mt-1 text-xs text-slate-500">
                {assessment.marking?.scored ?? 0} scored
                {" · "}
                {assessment.marking?.absent ?? 0} absent
                {" · "}
                {assessment.marking?.incomplete ?? 0} incomplete
            </p>

            <p className="mt-1 text-xs text-slate-500">
                Max score: {assessment.max_score}
            </p>
            </div>
        </div>

        <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span>Processing progress</span>
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
          {assessment.marking_complete
            ? "Review marks"
            : "Continue marking"}

          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}