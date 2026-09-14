import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Filter,
  History,
  Search,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  ChevronRight,
  Minus,
} from "lucide-react";

import client from "../../api/client";

const COMPETENCY_STYLES = {
  EE: "bg-green-100 text-green-700",
  ME: "bg-blue-100 text-blue-700",
  AE: "bg-amber-100 text-amber-700",
  BE: "bg-red-100 text-red-700",
};

const COMPETENCY_LABELS = {
  EE: "Exceeding Expectations",
  ME: "Meeting Expectations",
  AE: "Approaching Expectations",
  BE: "Below Expectations",
};

const TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: User,
  },
  {
    id: "performance",
    label: "Performance",
    icon: BarChart3,
  },
  {
    id: "marks",
    label: "Marks",
    icon: ClipboardCheck,
  },
];

export default function TeacherStudentProfile() {
  const { id } = useParams();

  /*
   * IMPORTANT:
   * ALL hooks must be declared before any conditional return.
   *
   * This prevents:
   * "Rendered more hooks than during the previous render."
   */
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    let mounted = true;

    async function loadStudent() {
      try {
        setLoading(true);
        setError("");

        const response = await client.get(
          `/teacher/students/${id}`
        );

        if (mounted) {
          setData(response.data);
        }
      } catch (err) {
        console.error(
          "Failed to load student profile:",
          err
        );

        if (mounted) {
          setError(
            err.response?.data?.error ||
              "Unable to load student profile."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadStudent();
    } else {
      setError("Student ID is missing.");
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  /*
   * These values are calculated BEFORE any conditional return.
   *
   * This is important because useMemo itself is a hook.
   */
  const performance = data?.performance || [];
  const marks = data?.marks || [];
  const summary = data?.summary || {};

  const fallbackOverallAverage = useMemo(() => {
    const validPercentages = marks
      .map((mark) => {
        if (
          mark?.percentage !== null &&
          mark?.percentage !== undefined &&
          !Number.isNaN(Number(mark.percentage))
        ) {
          return Number(mark.percentage);
        }

        const score = Number(mark?.score);
        const maxScore = Number(mark?.assessment?.max_score);

        if (
          Number.isFinite(score) &&
          Number.isFinite(maxScore) &&
          maxScore > 0
        ) {
          return (score / maxScore) * 100;
        }

        return null;
      })
      .filter(
        (percentage) =>
          percentage !== null &&
          Number.isFinite(percentage)
      );

    if (!validPercentages.length) {
      return null;
    }

    return (
      validPercentages.reduce(
        (total, percentage) => total + percentage,
        0
      ) / validPercentages.length
    );
  }, [marks]);

  const overallAverage =
    summary.overall_average !== null &&
    summary.overall_average !== undefined
      ? Number(summary.overall_average)
      : fallbackOverallAverage;

  const calculatedCompetency =
    summary.competency ||
    competencyFor(overallAverage);

  const needsAttention = useMemo(() => {
    return performance.filter(
      (subject) =>
        Number(subject.average) < 50 ||
        subject.competency === "BE"
    );
  }, [performance]);

  const strongestSubject = useMemo(() => {
    if (!performance.length) {
      return null;
    }

    return [...performance].sort(
      (a, b) =>
        Number(b.average) - Number(a.average)
    )[0];
  }, [performance]);

  const weakestSubject = useMemo(() => {
    if (!performance.length) {
      return null;
    }

    return [...performance].sort(
      (a, b) =>
        Number(a.average) - Number(b.average)
    )[0];
  }, [performance]);

  /*
   * ---------------------------------------------------------
   * CONDITIONAL RETURNS
   * ---------------------------------------------------------
   *
   * All hooks are above this point.
   */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="text-gray-600">
            Loading student profile...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          to="/teacher/classes"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={17} />
          Back to My Classes
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={22}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <h2 className="font-semibold text-red-800">
                Unable to load student
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.student) {
    return (
      <div className="space-y-4">
        <Link
          to="/teacher/classes"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={17} />
          Back to My Classes
        </Link>

        <EmptyState message="Student information is unavailable." />
      </div>
    );
  }

  const student = data.student;

  return (
    <div className="space-y-6">
      {/* =====================================================
          BACK
      ====================================================== */}

      <Link
        to={`/teacher/classes/${student.grade?.id}/students`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
      >
        <ArrowLeft size={17} />
        Back to {student.grade?.name || "Class"}
      </Link>

      {/* =====================================================
          STUDENT HEADER
      ====================================================== */}

      <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl font-bold">
              {getInitials(student.name)}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-300">
                Student Profile
              </p>

              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                {student.name}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300">
                <span>
                  Adm No:{" "}
                  {student.admission_number || "—"}
                </span>

                <span className="hidden sm:inline">
                  ·
                </span>

                <span>
                  {student.grade?.name || "—"}
                </span>

                <span className="hidden sm:inline">
                  ·
                </span>

                <span className="capitalize">
                  {student.status || "active"}
                </span>
              </div>
            </div>
          </div>

          {/* Overall competency */}

          <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Overall Competency
            </p>

            <div className="mt-2 flex items-center gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${
                  COMPETENCY_STYLES[
                    calculatedCompetency
                  ] || "bg-white/10 text-white"
                }`}
              >
                {calculatedCompetency || "—"}
              </span>

              <span className="text-sm text-slate-300">
                {calculatedCompetency
                  ? COMPETENCY_LABELS[
                      calculatedCompetency
                    ] || "Performance level"
                  : "No assessment yet"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          TABS
      ====================================================== */}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <nav className="flex min-w-max border-b border-gray-200">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveTab(tab.id)
                  }
                  className={`relative flex items-center gap-2 px-5 py-4 text-sm font-medium transition ${
                    active
                      ? "text-blue-700"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Icon size={17} />

                  {tab.label}

                  {tab.id === "marks" && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {marks.length}
                    </span>
                  )}

                  {active && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </section>

      {/* =====================================================
          TAB CONTENT
      ====================================================== */}

      {activeTab === "overview" && (
        <OverviewTab
          student={student}
          summary={summary}
          overallAverage={overallAverage}
          performance={performance}
          marks={marks}
          needsAttention={needsAttention}
          strongestSubject={strongestSubject}
          weakestSubject={weakestSubject}
          onViewMarks={() => setActiveTab("marks")}
        />
      )}

      {activeTab === "performance" && (
        <PerformanceTab
          performance={performance}
          needsAttention={needsAttention}
        />
      )}

      {activeTab === "marks" && (
        <MarksTab marks={marks} />
      )}
    </div>
  );
}

/* ============================================================
   OVERVIEW
============================================================ */

function OverviewTab({
  student,
  summary,
  overallAverage,
  performance,
  marks,
  needsAttention,
  strongestSubject,
  weakestSubject,
  onViewMarks,
}) {
  return (
    <div className="space-y-6">
      {/* Summary cards */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          icon={<TrendingUp size={21} />}
          label="Overall Average"
          value={
            overallAverage !== null &&
            overallAverage !== undefined &&
            Number.isFinite(Number(overallAverage))
              ? `${Number(overallAverage).toFixed(2)}%`
              : "—"
          }
        />

        <SummaryCard
          icon={<BookOpen size={21} />}
          label="Subjects"
          value={
            summary.subjects_count ??
            performance.length
          }
        />

        <SummaryCard
          icon={<ClipboardCheck size={21} />}
          label="Assessments"
          value={summary.assessments_count ?? 0}
        />

        <SummaryCard
          icon={<Target size={21} />}
          label="Needs Attention"
          value={needsAttention.length}
          warning={needsAttention.length > 0}
        />
      </div>

      {/* Academic attention */}

      {needsAttention.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0 text-amber-600"
            />

            <div>
              <h2 className="font-semibold text-amber-900">
                Academic attention recommended
              </h2>

              <p className="mt-1 text-sm text-amber-800">
                {student.name} currently has{" "}
                {needsAttention.length} subject
                {needsAttention.length === 1
                  ? ""
                  : "s"} requiring attention.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {needsAttention.map((subject) => (
                  <span
                    key={subject.subject.id}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-800 shadow-sm"
                  >
                    {subject.subject.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Student information */}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
            <User size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Student Information
            </h2>

            <p className="text-xs text-gray-500">
              Basic academic information
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            label="Full Name"
            value={student.name}
          />

          <InfoItem
            label="Admission Number"
            value={
              student.admission_number || "—"
            }
          />

          <InfoItem
            label="Class"
            value={student.grade?.name || "—"}
          />

          <InfoItem
            label="Status"
            value={
              <span className="capitalize">
                {student.status || "active"}
              </span>
            }
          />
        </div>
      </section>

      {/* Strength / support */}

      <div className="grid gap-4 md:grid-cols-2">
        <SubjectInsight
          title="Strongest Subject"
          description="Highest recorded subject average"
          subject={strongestSubject}
          positive
        />

        <SubjectInsight
          title="Area Needing Support"
          description="Lowest recorded subject average"
          subject={weakestSubject}
        />
      </div>

      {/* Recent marks */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <ClipboardCheck size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Recent Marks
              </h2>

              <p className="text-xs text-gray-500">
                Latest recorded assessment results
              </p>
            </div>
          </div>

          {marks.length > 0 && (
            <button
              type="button"
              onClick={onViewMarks}
              className="hidden text-sm font-medium text-blue-600 hover:text-blue-800 sm:block"
            >
              View all ({marks.length})
            </button>
          )}
        </div>

        {marks.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {marks.slice(0, 5).map((mark) => (
              <MarkRow
                key={mark.id}
                mark={mark}
              />
            ))}

            {marks.length > 5 && (
              <div className="border-t border-gray-100 p-4 text-center sm:hidden">
                <button
                  type="button"
                  onClick={onViewMarks}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  View all {marks.length} marks
                </button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState message="No marks have been recorded yet." />
        )}
      </section>

      {/* Student support */}

      <StudentSupportLinks
        studentId={student.id}
      />
    </div>
  );
}

/* ============================================================
   PERFORMANCE TAB
============================================================ */

function PerformanceTab({
  performance,
  needsAttention,
}) {
  if (!performance.length) {
    return (
      <EmptyState message="No performance data available yet." />
    );
  }

  const sortedPerformance = [...performance].sort(
    (a, b) =>
      Number(b.average) - Number(a.average)
  );

  return (
    <div className="space-y-6">
      {/* Header */}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
            <BarChart3 size={21} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Subject Performance
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Performance from recorded assessments
              available to you.
            </p>
          </div>
        </div>
      </section>

      {/* Attention banner */}

      {needsAttention.length > 0 && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <TrendingDown
              size={20}
              className="mt-0.5 text-red-600"
            />

            <div>
              <h3 className="font-semibold text-red-800">
                Subjects requiring support
              </h3>

              <p className="mt-1 text-sm text-red-700">
                These areas may need further
                investigation and targeted
                intervention.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Performance rows */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="divide-y divide-gray-100">
          {sortedPerformance.map((item) => (
            <PerformanceRow
              key={item.subject.id}
              item={item}
            />
          ))}
        </div>
      </section>

      {/* Competency legend */}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900">
          CBC Competency Guide
        </h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(
            COMPETENCY_LABELS
          ).map(([code, label]) => (
            <div
              key={code}
              className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                  COMPETENCY_STYLES[code]
                }`}
              >
                {code}
              </span>

              <span className="text-sm text-gray-700">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   MARKS TAB
============================================================ */

function MarksTab({ marks }) {
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] =
    useState("all");

  const subjects = useMemo(() => {
    return Array.from(
      new Set(
        marks
          .map((mark) => mark.subject?.name)
          .filter(Boolean)
      )
    ).sort();
  }, [marks]);

  const filteredMarks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return marks.filter((mark) => {
      const matchesSearch =
        !query ||
        mark.assessment?.name
          ?.toLowerCase()
          .includes(query) ||
        mark.subject?.name
          ?.toLowerCase()
          .includes(query) ||
        mark.term?.name
          ?.toLowerCase()
          .includes(query);

      const matchesSubject =
        subjectFilter === "all" ||
        mark.subject?.name === subjectFilter;

      return matchesSearch && matchesSubject;
    });
  }, [marks, search, subjectFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search assessment, subject or term..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="relative">
            <Filter
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <select
              value={subjectFilter}
              onChange={(event) =>
                setSubjectFilter(event.target.value)
              }
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:w-52"
            >
              <option value="all">
                All subjects
              </option>

              {subjects.map((subject) => (
                <option
                  key={subject}
                  value={subject}
                >
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Showing {filteredMarks.length} of{" "}
          {marks.length} marks
        </div>
      </section>

      {/* Desktop table */}

      <section className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Assessment
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Subject
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Type
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Term
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Date
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Score
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  %
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredMarks.map((mark) => (
                <tr
                  key={mark.id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">
                      {mark.assessment?.name || "—"}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-700">
                    {mark.subject?.name || "—"}
                  </td>

                  <td className="px-5 py-4 text-sm capitalize text-gray-600">
                    {formatAssessmentType(
                      mark.assessment
                        ?.assessment_type
                    )}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {mark.term?.name || "—"}

                    {mark.term?.year
                      ? ` ${mark.term.year}`
                      : ""}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {formatDate(
                      mark.assessment
                        ?.date_administered
                    )}
                  </td>

                  <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900">
                    {mark.score ?? "—"} /{" "}
                    {mark.assessment?.max_score ??
                      "—"}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <ScoreBadge
                      percentage={mark.percentage}
                    />
                  </td>
                </tr>
              ))}

              {filteredMarks.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No marks match the selected
                    filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Mobile cards */}

      <section className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:hidden">
        {filteredMarks.map((mark) => (
          <MarkRow
            key={mark.id}
            mark={mark}
            detailed
          />
        ))}

        {filteredMarks.length === 0 && (
          <EmptyState message="No marks match the selected filters." />
        )}
      </section>
    </div>
  );
}

/* ============================================================
   PERFORMANCE ROW
============================================================ */

function PerformanceRow({ item }) {
  const average = Number(item.average) || 0;
  const competency =
    item.competency ||
    competencyFor(average);

  let TrendIcon = Minus;
  let trendClass = "text-gray-400";

  if (average >= 75) {
    TrendIcon = TrendingUp;
    trendClass = "text-green-600";
  } else if (average < 50) {
    TrendIcon = TrendingDown;
    trendClass = "text-red-600";
  }

  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">
            {item.subject?.name || "Unknown Subject"}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {item.assessments_count ?? 0} assessment
            {Number(item.assessments_count) === 1
              ? ""
              : "s"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <TrendIcon
            size={19}
            className={trendClass}
          />

          <div className="text-right">
            <p className="font-bold text-gray-900">
              {formatPercentage(average)}
            </p>

            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                COMPETENCY_STYLES[competency] ||
                "bg-gray-100 text-gray-600"
              }`}
            >
              {competency || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}

      <div className="mt-4">
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{
              width: `${Math.min(
                Math.max(average, 0),
                100
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Range */}

      <div className="mt-2 flex justify-between text-xs text-gray-400">
        <span>
          Lowest: {formatPercentage(item.lowest)}
        </span>

        <span>
          Highest: {formatPercentage(item.highest)}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   MARK ROW
============================================================ */

function MarkRow({
  mark,
  detailed = false,
}) {
  return (
    <div
      className={`flex flex-col gap-3 p-5 ${
        detailed
          ? "hover:bg-gray-50"
          : "sm:flex-row sm:items-center sm:justify-between"
      }`}
    >
      <div className="min-w-0">
        <p className="font-medium text-gray-900">
          {mark.assessment?.name || "—"}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
          <span>
            {mark.subject?.name || "—"}
          </span>

          {mark.term?.name && (
            <>
              <span>·</span>
              <span>
                {mark.term.name}
                {mark.term.year
                  ? ` ${mark.term.year}`
                  : ""}
              </span>
            </>
          )}

          {mark.assessment
            ?.date_administered && (
            <>
              <span>·</span>

              <span>
                {formatDate(
                  mark.assessment
                    .date_administered
                )}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-left sm:text-right">
          <p className="font-bold text-gray-900">
            {mark.score ?? "—"} /{" "}
            {mark.assessment?.max_score ?? "—"}
          </p>

          {detailed && (
            <p className="mt-1 text-xs capitalize text-gray-500">
              {formatAssessmentType(
                mark.assessment
                  ?.assessment_type
              )}
            </p>
          )}
        </div>

        <ScoreBadge
          percentage={mark.percentage}
        />
      </div>
    </div>
  );
}

/* ============================================================
   STUDENT SUPPORT
============================================================ */

function StudentSupportLinks({
  studentId,
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <Link
        to={`/teacher/students/${studentId}/interventions`}
        className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
      >
        <div className="mb-4 w-fit rounded-lg bg-amber-50 p-2.5 text-amber-600">
          <Target size={20} />
        </div>

        <h3 className="font-semibold text-gray-900">
          Interventions
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Record concerns, targets, actions and
          review progress.
        </p>

        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600">
          Open interventions

          <ChevronRight
            size={16}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </div>
      </Link>

      <Link
        to={`/teacher/students/${studentId}/history`}
        className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
      >
        <div className="mb-4 w-fit rounded-lg bg-blue-50 p-2.5 text-blue-600">
          <History size={20} />
        </div>

        <h3 className="font-semibold text-gray-900">
          Academic History
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Follow this student's academic progress
          over time.
        </p>

        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600">
          View history

          <ChevronRight
            size={16}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </div>
      </Link>
    </section>
  );
}

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function SummaryCard({
  icon,
  label,
  value,
  warning = false,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
          {icon}
        </div>

        {warning && (
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
        )}
      </div>

      <p className="mt-4 text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 font-medium text-gray-900">
        {value}
      </p>
    </div>
  );
}

function SubjectInsight({
  title,
  description,
  subject,
  positive = false,
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`rounded-lg p-2 ${
            positive
              ? "bg-green-50 text-green-600"
              : "bg-amber-50 text-amber-600"
          }`}
        >
          {positive ? (
            <TrendingUp size={20} />
          ) : (
            <TrendingDown size={20} />
          )}
        </div>

        <div>
          <h3 className="font-semibold text-gray-900">
            {title}
          </h3>

          <p className="text-xs text-gray-500">
            {description}
          </p>
        </div>
      </div>

      {subject ? (
        <div className="mt-5 flex items-center justify-between rounded-lg bg-gray-50 p-4">
          <div>
            <p className="font-medium text-gray-900">
              {subject.subject?.name ||
                "Unknown Subject"}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {subject.assessments_count ?? 0}{" "}
              assessment
              {Number(
                subject.assessments_count
              ) === 1
                ? ""
                : "s"}
            </p>
          </div>

          <ScoreBadge
            percentage={subject.average}
          />
        </div>
      ) : (
        <p className="mt-5 text-sm text-gray-500">
          No performance data available.
        </p>
      )}
    </section>
  );
}

function ScoreBadge({ percentage }) {
  if (
    percentage === null ||
    percentage === undefined ||
    Number.isNaN(Number(percentage))
  ) {
    return (
      <span className="text-sm text-gray-400">
        —
      </span>
    );
  }

  const score = Number(percentage);

  let classes =
    "bg-gray-100 text-gray-700";

  if (score >= 75) {
    classes =
      "bg-green-100 text-green-700";
  } else if (score >= 50) {
    classes =
      "bg-blue-100 text-blue-700";
  } else if (score >= 30) {
    classes =
      "bg-amber-100 text-amber-700";
  } else {
    classes =
      "bg-red-100 text-red-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {formatPercentage(score)}
    </span>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function competencyFor(score) {
  const numericScore = Number(score);

  if (
    !Number.isFinite(numericScore)
  ) {
    return null;
  }

  if (numericScore >= 75) {
    return "EE";
  }

  if (numericScore >= 50) {
    return "ME";
  }

  if (numericScore >= 30) {
    return "AE";
  }

  return "BE";
}

function getInitials(name) {
  if (!name) {
    return "?";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function formatPercentage(value) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return `${Number(value).toFixed(1)}%`;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAssessmentType(value) {
  if (!value) {
    return "—";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}
