import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

// Teacher landing page showing assigned classes and assessments
export default function MyClasses() {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [assessmentsBySubject, setAssessmentsBySubject] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const { data: assignments } = await client.get(
          `/teacher_subject_assignments?user_id=${user.id}`
        );

        setAssignments(assignments);

        const responses = await Promise.all(
          assignments.map((assignment) =>
            client.get("/assessments", {
              params: {
                subject_id: assignment.subject.id,
                per_page: 1000,
              },
            })
          )
        );

        const subjectMap = {};

        assignments.forEach((assignment, index) => {
          const response = responses[index].data;

          subjectMap[assignment.subject.id] = Array.isArray(response.data)
            ? response.data
            : [];
        });

        setAssessmentsBySubject(subjectMap);
      } catch (error) {
        console.error("Failed to load teacher classes:", error);
        setAssignments([]);
        setAssessmentsBySubject({});
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      load();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <h1
          className="mb-4 text-lg font-semibold"
          style={{ color: "var(--color-navy)" }}
        >
          My Classes
        </h1>

        <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-500">
          Loading classes...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1
        className="mb-4 text-lg font-semibold"
        style={{ color: "var(--color-navy)" }}
      >
        My Classes
      </h1>

      {assignments.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-500">
          No subject assignments found.
        </div>
      ) : (
        assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="mb-6 rounded-lg border border-slate-200 p-4"
          >
            <h2 className="font-medium text-slate-800">
              {assignment.subject.name} — {assignment.subject.grade.name}
            </h2>

            <ul className="mt-3 space-y-2">
              {(assessmentsBySubject[assignment.subject.id] || []).map(
                (assessment) => (
                  <li key={assessment.id}>
                    <Link
                      to={`/marks/${assessment.id}`}
                      className="text-sm underline hover:opacity-80"
                      style={{ color: "var(--color-gold)" }}
                    >
                      {assessment.name} — enter/view marks
                    </Link>
                  </li>
                )
              )}

              {(assessmentsBySubject[assignment.subject.id] || []).length ===
                0 && (
                <li className="text-sm text-slate-500">
                  No assessments available.
                </li>
              )}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}