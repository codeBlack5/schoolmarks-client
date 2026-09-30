import { useEffect, useState } from "react";
import client from "../api/client";
import { downloadFile } from "../api/download";

export default function Reports() {
  const [grades, setGrades] = useState([]);
  const [terms, setTerms] = useState([]);

  const [rankingForm, setRankingForm] = useState({
    grade_id: "",
    term_id: "",
    assessment_type: "end_term",
  });
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState("");

  const [cardsForm, setCardsForm] = useState({
    grade_id: "",
    term_id: "",
  });
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState("");

  useEffect(() => {
    client.get("/grades").then((res) => setGrades(res.data));
    client.get("/terms").then((res) => setTerms(res.data));
  }, []);

  async function handleRanking(e) {
    e.preventDefault();
    setRankingError("");
    setRankingLoading(true);

    try {
      await downloadFile(
        `/reports/class_ranking?grade_id=${rankingForm.grade_id}&term_id=${rankingForm.term_id}&assessment_type=${rankingForm.assessment_type}`,
        "class_ranking.pdf"
      );
    } catch {
      setRankingError(
        "Could not generate the ranking PDF. Make sure marks exist for this selection."
      );
    } finally {
      setRankingLoading(false);
    }
  }

  async function handleCards(e) {
    e.preventDefault();
    setCardsError("");
    setCardsLoading(true);

    try {
      await downloadFile(
        `/reports/report_cards?grade_id=${cardsForm.grade_id}&term_id=${cardsForm.term_id}`,
        "report_cards.pdf"
      );
    } catch {
      setCardsError("Could not generate report cards.");
    } finally {
      setCardsLoading(false);
    }
  }

  const selectClassName =
    "min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition focus:border-[var(--color-navy)] focus:ring-2 focus:ring-slate-200 sm:text-sm";

  const buttonClassName =
    "min-h-11 w-full rounded-md px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-slate-300 sm:w-auto";

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl px-3 py-4 sm:px-6 sm:py-6 lg:py-8">
      <div className="mb-6">
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--color-navy)" }}
        >
          Reports
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Generate class rankings and student report cards.
        </p>
      </div>

      <div className="space-y-6">
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-800">
              Class Ranking (PDF)
            </h2>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Ranks a class top-to-bottom on a chosen assessment, with a
              per-subject breakdown.
            </p>
          </div>

          <form
            onSubmit={handleRanking}
            className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <select
              required
              value={rankingForm.grade_id}
              onChange={(e) =>
                setRankingForm({
                  ...rankingForm,
                  grade_id: e.target.value,
                })
              }
              className={selectClassName}
              aria-label="Ranking grade"
            >
              <option value="">Grade...</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <select
              required
              value={rankingForm.term_id}
              onChange={(e) =>
                setRankingForm({
                  ...rankingForm,
                  term_id: e.target.value,
                })
              }
              className={selectClassName}
              aria-label="Ranking term"
            >
              <option value="">Term...</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.year})
                </option>
              ))}
            </select>

            <select
              value={rankingForm.assessment_type}
              onChange={(e) =>
                setRankingForm({
                  ...rankingForm,
                  assessment_type: e.target.value,
                })
              }
              className={selectClassName}
              aria-label="Ranking assessment type"
            >
              <option value="cat">CAT Exam</option>
              <option value="opener">Opener Exam</option>
              <option value="mid_term">Mid-Term Exam</option>
              <option value="end_term">End-Term Exam</option>
            </select>

            <button
              type="submit"
              disabled={rankingLoading}
              className={buttonClassName}
              style={{ backgroundColor: "var(--color-navy)" }}
            >
              {rankingLoading ? "Generating..." : "Download PDF"}
            </button>
          </form>

          {rankingError && (
            <div className="mt-3 break-words rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-700">
              {rankingError}
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-800">
              Student Report Cards (PDF)
            </h2>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              One PDF, one page per student — term performance plus
              year-to-date summary.
            </p>
          </div>

          <form
            onSubmit={handleCards}
            className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <select
              required
              value={cardsForm.grade_id}
              onChange={(e) =>
                setCardsForm({
                  ...cardsForm,
                  grade_id: e.target.value,
                })
              }
              className={selectClassName}
              aria-label="Report card grade"
            >
              <option value="">Grade...</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <select
              required
              value={cardsForm.term_id}
              onChange={(e) =>
                setCardsForm({
                  ...cardsForm,
                  term_id: e.target.value,
                })
              }
              className={selectClassName}
              aria-label="Report card term"
            >
              <option value="">Term...</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.year})
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={cardsLoading}
              className={buttonClassName}
              style={{ backgroundColor: "var(--color-navy)" }}
            >
              {cardsLoading ? "Generating..." : "Download PDFs"}
            </button>
          </form>

          {cardsError && (
            <div className="mt-3 break-words rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-700">
              {cardsError}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
