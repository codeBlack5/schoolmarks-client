import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

// A teacher's landing page: their assigned subject+grade combos and the
// assessments under each, linking straight into the entry grid.
export default function MyClasses() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [assessmentsBySubject, setAssessmentsBySubject] = useState({});

  useEffect(() => {
    client.get(`/teacher_subject_assignments?user_id=${user.id}`).then(async (res) => {
      setAssignments(res.data);
      const entries = await Promise.all(
        res.data.map((a) => client.get(`/assessments?subject_id=${a.subject.id}`))
      );
      const map = {};
      res.data.forEach((a, i) => (map[a.subject.id] = entries[i].data));
      setAssessmentsBySubject(map);
    });
  }, [user.id]);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-lg font-semibold mb-4" style={{ color: "var(--color-navy)" }}>
        My Classes
      </h1>

      {assignments.map((a) => (
        <div key={a.id} className="mb-6 border border-slate-200 rounded-lg p-4">
          <h2 className="font-medium text-slate-800">
            {a.subject.name} — {a.subject.grade.name}
          </h2>
          <ul className="mt-2 space-y-1">
            {(assessmentsBySubject[a.subject.id] || []).map((assessment) => (
              <li key={assessment.id}>
                <Link
                  to={`/marks/${assessment.id}`}
                  className="text-sm underline"
                  style={{ color: "var(--color-gold)" }}
                >
                  {assessment.name} — enter/view marks
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
