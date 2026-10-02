import { useCallback, useEffect, useRef, useState } from "react";
import client from "../api/client";

export function useTeacherAnalytics({
  termId,
  gradeId = null,
  subjectId = null,
  assessmentType = null,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const cacheRef = useRef(new Map());
  const requestRef = useRef(null);

  const buildParams = useCallback(() => {
    const params = {
      term_id: termId,
    };

    if (gradeId) {
      params.grade_id = gradeId;
    }

    if (subjectId) {
      params.subject_id = subjectId;
    }

    if (assessmentType) {
      params.assessment_type = assessmentType;
    }

    return params;
  }, [termId, gradeId, subjectId, assessmentType]);

  const buildCacheKey = useCallback(() => {
    return JSON.stringify({
      termId: termId || null,
      gradeId: gradeId || null,
      subjectId: subjectId || null,
      assessmentType: assessmentType || null,
    });
  }, [termId, gradeId, subjectId, assessmentType]);

  const fetchAnalytics = useCallback(async () => {
    if (!termId) {
      if (requestRef.current) {
        requestRef.current.abort();
        requestRef.current = null;
      }

      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const cacheKey = buildCacheKey();
    const cachedData = cacheRef.current.get(cacheKey);

    if (cachedData) {
      setData(cachedData);
      setError(null);
      setLoading(false);
      return;
    }

    if (requestRef.current) {
      requestRef.current.abort();
    }

    const controller = new AbortController();
    requestRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await client.get("/teacher_analytics", {
        params: buildParams(),
        signal: controller.signal,
      });

      const analyticsData = response.data.data;

      cacheRef.current.set(cacheKey, analyticsData);
      setData(analyticsData);
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }

      console.error("Failed to load teacher analytics:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.errors?.join(", ") ||
          "Failed to load teacher analytics."
      );
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }, [termId, buildParams, buildCacheKey]);

  const exportPdf = useCallback(async () => {
    if (!termId) {
      return;
    }

    setExporting(true);

    try {
      const response = await client.get("/teacher_analytics/export", {
        params: buildParams(),
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
  }, [termId, buildParams]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        requestRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    exporting,
    error,
    refetch: fetchAnalytics,
    exportPdf,
  };
}
