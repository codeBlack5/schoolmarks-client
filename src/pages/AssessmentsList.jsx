import { useEffect, useMemo, useState } from "react";
import client from "../api/client";
import { useAlert } from "../context/AlertContext";
import useAssessments from "../hooks/useAssessments";
import AssessmentToolbar from "../components/assessments/AssessmentToolbar";
import {
  getTermColor,
  groupAssessments,
  getMarkingStatus,
  calculateStatistics,
} from "../utils/assessmentHelpers";
import AssessmentGradeGroup from "../components/assessments/AssessmentGradeGroup";
import AssessmentStats from "../components/assessments/AssessmentStats";

export default function AssessmentsList() {
  const { confirm, notify } = useAlert();
  const {
    assessments,
    loading,
    error,

    years,

    search,
    setSearch,

    year,
    setYear,

    page,
    setPage,

    pagination,

    reload,
  } = useAssessments();
  const [expandedGrades, setExpandedGrades] = useState(() => {
  const saved = localStorage.getItem("assessment-expanded-grades");
    return saved ? JSON.parse(saved) : {};
  });

  const [expandedTerms, setExpandedTerms] = useState(() => {
    const saved = localStorage.getItem("assessment-expanded-terms");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [page]);

  useEffect(() => {
    localStorage.setItem(
      "assessment-expanded-grades",
      JSON.stringify(expandedGrades)
    );

    localStorage.setItem(
      "assessment-expanded-terms",
      JSON.stringify(expandedTerms)
    );
  }, [expandedGrades, expandedTerms]);

  async function handleDelete(id, name) {
    const ok = await confirm({
      title: `Delete "${name}"?`,
      message: "This cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });

    if (!ok) return;

    try {
      await client.delete(`/assessments/${id}`);
      notify({
        type: "success",
        message: "Assessment deleted.",
      });
      reload();
    } catch (err) {
      notify({
        type: "error",
        message: err.response?.data?.error || "Could not delete",
      });
    }
  }

  // Grade -> Term -> Assessments
  const groupedAssessments = useMemo(
    () => groupAssessments(assessments),
    [assessments]
  );

  useEffect(() => {
    setExpandedGrades((prev) => {
      const expanded = { ...prev };

      Object.keys(groupedAssessments).forEach((grade) => {
        if (expanded[grade] === undefined) {
          expanded[grade] = false; // collapsed by default
        }
      });

      return expanded;
    });

    setExpandedTerms((prev) => {
      const expanded = { ...prev };

      Object.entries(groupedAssessments).forEach(([grade, terms]) => {
        Object.keys(terms).forEach((term) => {
          const key = `${grade}-${term}`;

          if (expanded[key] === undefined) {
            expanded[key] = false; // collapsed by default
          }
        });
      });

      return expanded;
    });
  }, [groupedAssessments]);

  function toggleGrade(grade) {
    setExpandedGrades((prev) => ({
      ...prev,
      [grade]: !prev[grade],
    }));
  }

  function toggleTerm(grade, term) {
    const key = `${grade}-${term}`;

    setExpandedTerms((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function renderMarkingBadge(marking) {
    const status = getMarkingStatus(marking);

    if (!status) return null;

    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
      >
        {status.label}
      </span>
    );
  }

  const stats = useMemo(
    () => calculateStatistics(assessments),
    [assessments]
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center text-slate-500">
        Loading assessments...
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <AssessmentToolbar
        search={search}
        setSearch={setSearch}
        year={year}
        setYear={setYear}
        years={years}
      />
      <AssessmentStats stats={stats} />
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {assessments.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white py-10 text-center text-slate-500">
          No assessments match your search.
        </div>
      )}
      {assessments.length > 0 && 
      Object.entries(groupedAssessments).map(([grade, terms]) => (
        <AssessmentGradeGroup
          key={grade}
          grade={grade}
          terms={terms}
          expanded={expandedGrades[grade]}
          toggleGrade={() => toggleGrade(grade)}
          expandedTerms={expandedTerms}
          toggleTerm={toggleTerm}
          getTermColor={getTermColor}
          renderMarkingBadge={renderMarkingBadge}
          handleDelete={handleDelete}
        />
      ))}
      {pagination && pagination.total_pages > 1 && (
      <div className="mt-8 flex flex-col items-center gap-4">

        <div className="text-sm text-slate-600">
          Showing page{" "}
          <strong>{pagination.current_page}</strong>
          {" "}of{" "}
          <strong>{pagination.total_pages}</strong>

          {" • "}

          {pagination.total_count} assessments
        </div>

        <div className="flex items-center gap-2">

          <button
            disabled={!pagination.prev_page}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>

          {Array.from(
            { length: pagination.total_pages },
            (_, i) => i + 1
          )
            .filter((number) => {
              return (
                number === 1 ||
                number === pagination.total_pages ||
                Math.abs(number - pagination.current_page) <= 2
              );
            })
            .map((number) => (
              <button
                key={number}
                onClick={() => setPage(number)}
                className={`h-10 w-10 rounded border transition ${
                  number === pagination.current_page
                    ? "bg-blue-600 text-white"
                    : "bg-white hover:bg-slate-100"
                }`}
              >
                {number}
              </button>
            ))}

          <button
            disabled={!pagination.next_page}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>

        </div>
      </div>
    )}
    </div>
  );
}