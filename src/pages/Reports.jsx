import { useEffect, useState } from "react";
import client from "../api/client";
import { downloadFile } from "../api/download";

export default function Reports() {
  const [grades, setGrades] = useState([]);
  const [terms, setTerms] = useState([]);

  const [rankingForm, setRankingForm] = useState({ grade_id: "", term_id: "", assessment_type: "end_term" });
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState("");

  const [cardsForm, setCardsForm] = useState({ grade_id: "", term_id: "" });
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
      setRankingError("Could not generate the ranking PDF. Make sure marks exist for this selection.");
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

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-10">
      <h1 className="text-lg font-semibold" style={{ color: "var(--color-navy)" }}>Reports</h1>

      <section>
        <h2 className="text-base font-semibold mb-1">Class Ranking (PDF)</h2>
        <p className="text-sm text-slate-500 mb-3">Ranks a class top-to-bottom on a chosen assessment, with a per-subject breakdown.</p>
        <form onSubmit={handleRanking} className="flex flex-col sm:flex-row gap-2">
          <select required value={rankingForm.grade_id} onChange={(e) => setRankingForm({ ...rankingForm, grade_id: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Grade...</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select required value={rankingForm.term_id} onChange={(e) => setRankingForm({ ...rankingForm, term_id: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Term...</option>
            {terms.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.year})</option>)}
          </select>
          <select value={rankingForm.assessment_type} onChange={(e) => setRankingForm({ ...rankingForm, assessment_type: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="opener">Opener Exam</option>
            <option value="mid_term">Mid-Term Exam</option>
            <option value="end_term">End-Term Exam</option>
          </select>
          <button disabled={rankingLoading} className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60" style={{ backgroundColor: "var(--color-navy)" }}>
            {rankingLoading ? "Generating..." : "Download PDF"}
          </button>
        </form>
        {rankingError && <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{rankingError}</div>}
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">Student Report Cards (PDF)</h2>
        <p className="text-sm text-slate-500 mb-3">One PDF, one page per student — term performance plus year-to-date summary.</p>
        <form onSubmit={handleCards} className="flex flex-col sm:flex-row gap-2">
          <select required value={cardsForm.grade_id} onChange={(e) => setCardsForm({ ...cardsForm, grade_id: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Grade...</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select required value={cardsForm.term_id} onChange={(e) => setCardsForm({ ...cardsForm, term_id: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Term...</option>
            {terms.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.year})</option>)}
          </select>
          <button disabled={cardsLoading} className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60" style={{ backgroundColor: "var(--color-navy)" }}>
            {cardsLoading ? "Generating..." : "Download PDFs"}
          </button>
        </form>
        {cardsError && <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{cardsError}</div>}
      </section>
    </div>
  );
}
