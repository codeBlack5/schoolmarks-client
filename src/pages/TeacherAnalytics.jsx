import { useEffect, useMemo, useState } from "react";
import client from "../api/client";
import { useTeacherAnalytics } from "../hooks/useTeacherAnalytics";
import LearningAreaPerformance from "../components/analytics/LearningAreaPerformance";
import AssessmentAnalysis from "../components/analytics/AssessmentAnalysis";
import PerformanceDistribution from "../components/analytics/PerformanceDistribution";
import StudentPerformanceRanking from "../components/analytics/StudentPerformanceRanking";
import StudentIntervention from "../components/analytics/StudentIntervention";


export default function TeacherAnalytics() {
  const [terms, setTerms] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [termId, setTermId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState("");

  const {
    data,
    loading: analyticsLoading,
    error: analyticsError,
    exporting,
    exportPdf,
  } = useTeacherAnalytics({
    termId,
    gradeId,
    subjectId,
  });

  // Load filter data
  useEffect(() => {
    async function loadFilters() {
      setFiltersLoading(true);
      setFiltersError("");

      try {
        const [termsResponse, gradesResponse] = await Promise.all([
          client.get("/terms"),
          client.get("/grades"),
        ]);

        const loadedTerms = termsResponse.data || [];
        const loadedGrades = gradesResponse.data || [];

        setTerms(loadedTerms);
        setGrades(loadedGrades);

        // Select the most recent term by default.
        if (loadedTerms.length > 0) {
          const sortedTerms = [...loadedTerms].sort((a, b) => {
            if (Number(b.year) !== Number(a.year)) {
              return Number(b.year) - Number(a.year);
            }

            return Number(b.id) - Number(a.id);
          });

          setTermId(String(sortedTerms[0].id));
        }
      } catch (err) {
        console.error("Failed to load analytics filters:", err);

        setFiltersError(
          err.response?.data?.errors?.join(", ") ||
            err.response?.data?.error ||
            "Failed to load terms and grades."
        );
      } finally {
        setFiltersLoading(false);
      }
    }

    loadFilters();
  }, []);

  // Load subjects whenever the selected grade changes.
  useEffect(() => {
    async function loadSubjects() {
      setSubjectId("");

      if (!gradeId) {
        setSubjects([]);
        return;
      }

      try {
        const response = await client.get(`/grades/${gradeId}/subjects`);
        setSubjects(response.data || []);
      } catch (err) {
        console.error("Failed to load subjects:", err);
        setSubjects([]);
      }
    }

    loadSubjects();
  }, [gradeId]);

  const selectedTerm = useMemo(
    () => terms.find((term) => String(term.id) === String(termId)),
    [terms, termId]
  );

  const selectedGrade = useMemo(
    () => grades.find((grade) => String(grade.id) === String(gradeId)),
    [grades, gradeId]
  );

  const selectedSubject = useMemo(
    () => subjects.find((subject) => String(subject.id) === String(subjectId)),
    [subjects, subjectId]
  );

  function handleGradeChange(event) {
    setGradeId(event.target.value);
    setSubjectId("");
  }

  function handleReset() {
    setGradeId("");
    setSubjectId("");
  }

  if (filtersLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading analytics filters...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Teacher Analytics
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Analyse learner performance across learning areas and assessments.
        </p>
      </div>

      <button
        type="button"
        onClick={async () => {
          try {
            await exportPdf();
          } catch (err) {
            alert(err.message);
          }
        }}
        disabled={!termId || analyticsLoading || exporting}
        className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {exporting ? "Generating PDF..." : "Download PDF"}
      </button>
    </div>

      {/* Filter error */}
      {filtersError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {filtersError}
        </div>
      )}

      {/* Filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Analysis filters
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select the scope you want to analyse.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            Clear filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Term */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Term
            </label>

            <select
              value={termId}
              onChange={(event) => setTermId(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Select a term...</option>

              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name} {term.year ? `— ${term.year}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Grade */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Grade / Class
            </label>

            <select
              value={gradeId}
              onChange={handleGradeChange}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">All grades</option>

              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Learning Area
            </label>

            <select
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              disabled={!gradeId || subjects.length === 0}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">
                {!gradeId
                  ? "Select a grade first"
                  : subjects.length === 0
                    ? "No learning areas"
                    : "All learning areas"}
              </option>

              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active scope */}
        {termId && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
            {selectedTerm && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {selectedTerm.name} {selectedTerm.year}
              </span>
            )}

            {selectedGrade && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {selectedGrade.name}
              </span>
            )}

            {selectedSubject && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {selectedSubject.name}
              </span>
            )}
          </div>
        )}
      </section>

      {/* Analytics loading */}
      {analyticsLoading && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading analytics...
        </div>
      )}

      {/* Analytics error */}
      {!analyticsLoading && analyticsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            Could not load analytics
          </p>
          <p className="mt-1 text-sm text-red-700">{analyticsError}</p>

          <button
            type="button"
            onClick={refetch}
            className="mt-3 rounded-md px-3 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-navy)" }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!analyticsLoading && !analyticsError && !data && termId && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            No analytics data is available for the selected term.
          </p>
        </div>
      )}

      {/* Overview */}
      {!analyticsLoading && !analyticsError && data?.overview && (
        <section>
          <div className="mb-3">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--color-navy)" }}
            >
              Performance overview
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Students"
              value={data.overview.students ?? 0}
            />

            <MetricCard
              label="Learning areas"
              value={data.overview.learning_areas ?? 0}
            />

            <MetricCard
              label="Assessments"
              value={data.overview.assessments ?? 0}
            />

            <MetricCard
              label="Mean score"
              value={
                data.overview.mean_score != null
                  ? `${data.overview.mean_score}%`
                  : "—"
              }
            />

            <MetricCard
              label="Highest score"
              value={
                data.overview.highest_score != null
                  ? `${data.overview.highest_score}%`
                  : "—"
              }
            />

            <MetricCard
              label="Lowest score"
              value={
                data.overview.lowest_score != null
                  ? `${data.overview.lowest_score}%`
                  : "—"
              }
            />

            <MetricCard
              label="Meeting expectations"
              value={data.overview.meeting_expectations ?? 0}
            />

            <MetricCard
              label="Target achievement"
              value={
                data.overview.meeting_expectations_percentage != null
                  ? `${data.overview.meeting_expectations_percentage}%`
                  : "—"
              }
            />
          </div>
        </section>
      )}

      {/* Temporary data check */}
      {!analyticsLoading && !analyticsError && data && (
        <div className="space-y-6">
          <LearningAreaPerformance
            learningAreas={data.learning_areas || []}
          />

          <AssessmentAnalysis
            assessments={data.assessment_comparison || []}
          />

          <PerformanceDistribution
            distribution={data.performance_distribution || []}
          />

          <StudentPerformanceRanking
            overallRanking={data.overall_ranking || []}
            subjectRanking={data.subject_ranking || []}
          />

          <StudentIntervention
            decliningStudents={data.declining_students || [] }
            interventionStudents={data.intervention_students || [] }
          />  
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p
        className="mt-2 text-xl sm:text-2xl font-semibold"
        style={{ color: "var(--color-navy)" }}
      >
        {value}
      </p>
    </div>
  );
}

function StatusPill({ label, count }) {
  return (
    <span className="rounded-full bg-white border border-slate-200 px-3 py-1 text-slate-600">
      {label}: <strong>{count}</strong>
    </span>
  );
}
