import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAlert } from "../context/AlertContext";

export default function AssessmentsList() {
  const { confirm, notify } = useAlert();
  const [assessments, setAssessments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [years, setYears] = useState([]);
  const [expandedGrades, setExpandedGrades] = useState(() => {
  const saved = localStorage.getItem("assessment-expanded-grades");
    return saved ? JSON.parse(saved) : {};
  });

  const [expandedTerms, setExpandedTerms] = useState(() => {
    const saved = localStorage.getItem("assessment-expanded-terms");
    return saved ? JSON.parse(saved) : {};
  });

  function load(searchValue = search, yearValue = year) {
    client
      .get("/assessments", {
        params: {
          page,
          per_page: 20,
          search: searchValue || undefined,
          year: yearValue || undefined,
        },
      })
      .then((res) => {
        const { data, pagination } = res.data;

        setAssessments(data);
        setPagination(pagination);

        // Populate academic years dropdown
        const uniqueYears = [
          ...new Set(
            data
              .map((assessment) => assessment.term?.year)
              .filter(Boolean)
          ),
        ].sort((a, b) => b - a);

        setYears(uniqueYears);
      })
      .catch(() => setError("Could not load assessments"));
  }

  // Reset to first page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, year]);

  // Load whenever page or filters change
  useEffect(() => {
    load(search, year);
  }, [page, search, year]);

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
      load();
    } catch (err) {
      notify({
        type: "error",
        message: err.response?.data?.error || "Could not delete",
      });
    }
  }

  // Grade -> Term -> Assessments
  const groupedAssessments = useMemo(() => {
    return assessments.reduce((groups, assessment) => {
      const grade = assessment.subject?.grade?.name || "Unknown Grade";
      const term = assessment.term?.name || "Unknown Term";

      if (!groups[grade]) groups[grade] = {};

      if (!groups[grade][term]) groups[grade][term] = [];

      groups[grade][term].push(assessment);

      return groups;
    }, {});
  }, [assessments]);

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
    if (!marking) return null;

    const { submitted, total_students, complete } = marking;

    let bg = "bg-red-100 text-red-700";
    let label = "Not started";

    if (complete) {
      bg = "bg-green-100 text-green-700";
      label = `${submitted}/${total_students} marked`;
    } else if (submitted > 0) {
      bg = "bg-yellow-100 text-yellow-700";
      label = `${submitted}/${total_students} marked`;
    }

    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bg}`}
      >
        {label}
      </span>
    );
  }

  function getTermColor(term) {
    const value = term.toLowerCase();

    if (value.includes("term 1")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }

    if (value.includes("term 2")) {
      return "bg-green-100 text-green-800 border-green-200";
    }

    if (value.includes("term 3")) {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }

    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  const stats = useMemo(() => {
    return assessments.reduce(
      (acc, assessment) => {
        acc.total++;

        if (assessment.marking?.complete) {
          acc.completed++;
        } else if ((assessment.marking?.submitted ?? 0) > 0) {
          acc.inProgress++;
        } else {
          acc.notStarted++;
        }

        return acc;
      },
      {
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
      }
    );
  }, [assessments]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--color-navy)" }}
        >
          Assessments
        </h1>

        <Link
          to="/assessments/new"
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-navy)" }}
        >
          + New Assessment
        </Link>
      </div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="text"
          placeholder="Search assessment or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Years</option>

          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Assessments</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-800">
            {stats.total}
          </h2>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-sm text-green-700">Completed</p>
          <h2 className="mt-2 text-3xl font-bold text-green-700">
            {stats.completed}
          </h2>
        </div>

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <p className="text-sm text-yellow-700">In Progress</p>
          <h2 className="mt-2 text-3xl font-bold text-yellow-700">
            {stats.inProgress}
          </h2>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-sm text-red-700">Not Started</p>
          <h2 className="mt-2 text-3xl font-bold text-red-700">
            {stats.notStarted}
          </h2>
        </div>
      </div>
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
      {assessments.length > 0 && Object.entries(groupedAssessments).map(([grade, terms]) => {
        const assessmentCount = Object.values(terms).reduce(
          (total, assessments) => total + assessments.length,
          0
        );

        return (
          <div
            key={grade}
            className="mb-6 overflow-hidden rounded-lg border border-slate-200"
          >
            {/* Grade Header */}
            <button
              type="button"
              onClick={() => toggleGrade(grade)}
              className="flex w-full items-center justify-between px-4 py-3 font-semibold text-white"
              style={{ backgroundColor: "var(--color-navy)" }}
            >
              <div className="flex items-center gap-3">
                <span>{grade}</span>

                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {assessmentCount}{" "}
                  {assessmentCount === 1
                    ? "assessment"
                    : "assessments"}
                </span>
              </div>

              <span
                className={`text-xl transition-transform duration-300 ${
                  expandedGrades[grade] ? "rotate-90" : "rotate-0"
                }`}
              >
                ▶
              </span>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                expandedGrades[grade]
                  ? "max-h-[5000px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-4 bg-slate-50 p-4">
                {Object.entries(terms).map(([term, items]) => {
                  const key = `${grade}-${term}`;

                  return (
                    <div
                      key={term}
                      className="overflow-hidden rounded-md border border-slate-200 bg-white"
                    >
                      {/* Term Header */}
                      <button
                        type="button"
                        onClick={() => toggleTerm(grade, term)}
                        className={`flex w-full items-center justify-between border-b px-4 py-3 font-medium transition-all duration-200 hover:brightness-95 ${getTermColor(
                          term
                        )}`}
                      >
                        <div className="flex items-center gap-3">
                          <span>{term}</span>

                          <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold">
                            {items.length}{" "}
                            {items.length === 1 ? "assessment" : "assessments"}
                          </span>
                        </div>

                        <span
                          className={`text-lg transition-transform duration-300 ${
                            expandedTerms[key] ? "rotate-90" : "rotate-0"
                          }`}
                        >
                          ▶
                        </span>
                      </button>

                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          expandedTerms[key]
                            ? "max-h-[2500px] opacity-100"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="overflow-x-auto">
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
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