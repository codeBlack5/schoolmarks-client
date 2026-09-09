import { useCallback, useEffect, useState } from "react";
import client from "../api/client";

export function useTeacherAnalytics({
  termId,
  gradeId = null,
  subjectId = null,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    if (!termId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        term_id: termId,
      };

      if (gradeId) {
        params.grade_id = gradeId;
      }

      if (subjectId) {
        params.subject_id = subjectId;
      }

      const response = await client.get("/teacher_analytics", {
        params,
      });

      setData(response.data.data);
    } catch (err) {
      console.error("Failed to load teacher analytics:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.errors?.join(", ") ||
          "Failed to load teacher analytics."
      );

      setData(null);
    } finally {
      setLoading(false);
    }
  }, [termId, gradeId, subjectId]);

  const exportPdf = useCallback(async () => {
    if (!termId) {
      return;
    }

    setExporting(true);

    try {
      const params = {
        term_id: termId,
      };

      if (gradeId) {
        params.grade_id = gradeId;
      }

      if (subjectId) {
        params.subject_id = subjectId;
      }

      const response = await client.get("/teacher_analytics/export", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const contentDisposition =
        response.headers["content-disposition"];

      let filename = "teacher-analytics.pdf";

      if (contentDisposition) {
        const filenameMatch =
          contentDisposition.match(/filename="?([^"]+)"?/);

        if (filenameMatch?.[1]) {
          filename = filenameMatch[1];
        }
      }

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export teacher analytics:", err);

      throw new Error(
        err.response?.data?.error ||
          "Failed to generate teacher analytics PDF."
      );
    } finally {
      setExporting(false);
    }
  }, [termId, gradeId, subjectId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    exporting,
    error,
    refetch: fetchAnalytics,
    exportPdf,
  };
}