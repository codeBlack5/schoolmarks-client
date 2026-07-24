import { useCallback, useEffect, useState } from "react";
import client from "../api/client";
import useDebounce from "./useDebounce";

export default function useAssessments() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [years, setYears] = useState([]);

  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 20,
  });

  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const res = await client.get("/assessments", {
        params: {
          search: debouncedSearch || undefined,
          year: year || undefined,
          page,
        },
      });

      setAssessments(res.data.data);

      setPagination(res.data.pagination);

      const uniqueYears = [
        ...new Set(
          res.data.data
            .map((assessment) => assessment.term?.year)
            .filter(Boolean)
        ),
      ].sort((a, b) => b - a);

      setYears(uniqueYears);

      setError("");
    } catch {
      setError("Could not load assessments");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, year, page]);

  useEffect(() => {
    load();
  }, [load]);

  return {
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

    reload: load,
  };
}