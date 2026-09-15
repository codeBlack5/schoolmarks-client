import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function AssessmentBatchForm() {
  const navigate = useNavigate();

  const [grades, setGrades] = useState([]);
  const [terms, setTerms] = useState([]);

  const [form, setForm] = useState({
    grade_id: "",
    term_id: "",
    assessment_type: "opener",
    name: "",
    date_administered: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [gradesResponse, termsResponse] = await Promise.all([
          client.get("/grades"),
          client.get("/terms"),
        ]);

        setGrades(gradesResponse.data?.data || gradesResponse.data || []);
        setTerms(termsResponse.data?.data || termsResponse.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load grades and terms.");
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await client.post("/assessments/batch", {
        grade_id: form.grade_id,
        term_id: form.term_id,
        assessment_type: form.assessment_type,
        name: form.name.trim(),
        date_administered: form.date_administered || null,
      });

      setResult(response.data);
    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to create assessments.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Assessments</h1>
        <p className="text-gray-600 mt-1">
          Create the assessment across all learning areas for a grade.
          Maximum scores are configured separately for each learning area.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="font-medium text-green-800">
            Assessments created successfully.
          </p>

          {result.created?.length > 0 && (
            <p className="mt-1 text-sm text-green-700">
              Created: {result.created.length}
            </p>
          )}

          {result.skipped_existing?.length > 0 && (
            <p className="mt-1 text-sm text-amber-700">
              Already existed: {result.skipped_existing.join(", ")}
            </p>
          )}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium mb-1">
            Grade
          </label>

          <select
            name="grade_id"
            value={form.grade_id}
            onChange={handleChange}
            required
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">Select grade</option>

            {grades.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Term
          </label>

          <select
            name="term_id"
            value={form.term_id}
            onChange={handleChange}
            required
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">Select term</option>

            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Assessment Type
          </label>

          <select
            name="assessment_type"
            value={form.assessment_type}
            onChange={handleChange}
            required
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="opener">Opener</option>
            <option value="mid_term">Mid Term</option>
            <option value="end_term">End Term</option>
            <option value="cat">CAT</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Assessment Name
          </label>

          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. CAT 1"
            required
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Date Administered
          </label>

          <input
            type="date"
            name="date_administered"
            value={form.date_administered}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          <strong>Maximum score:</strong> This is configured separately for
          each learning area after the assessments are created.
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-white disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Assessments"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/assessments")}
            className="rounded-lg border px-5 py-2.5"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}