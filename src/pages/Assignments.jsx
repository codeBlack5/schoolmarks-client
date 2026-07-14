import { useEffect, useState } from "react";
import client from "../api/client";

export default function Assignments() {
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [gradeId, setGradeId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    client.get("/users?role=teacher").then((res) => setTeachers(res.data));
    client.get("/grades").then((res) => setGrades(res.data));
  }, []);

  function loadAssignments(id) {
    if (!id) return setAssignments([]);
    client.get(`/teacher_subject_assignments?user_id=${id}`).then((res) => setAssignments(res.data));
  }

  useEffect(() => loadAssignments(teacherId), [teacherId]);

  const subjectsForGrade = grades.find((g) => g.id === Number(gradeId))?.subjects || [];

  async function handleAssign(e) {
    e.preventDefault();
    setError("");
    try {
      await client.post("/teacher_subject_assignments", {
        teacher_subject_assignment: { user_id: teacherId, subject_id: subjectId },
      });
      setGradeId("");
      setSubjectId("");
      loadAssignments(teacherId);
    } catch (err) {
      setError(err.response?.data?.errors?.join(", ") || "Could not create assignment");
    }
  }

  async function handleRemove(id) {
    if (!confirm("Remove this subject assignment?")) return;
    try {
      await client.delete(`/teacher_subject_assignments/${id}`);
      loadAssignments(teacherId);
    } catch (err) {
      alert(err.response?.data?.error || "Could not remove");
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <h1 className="text-lg font-semibold mb-4" style={{ color: "var(--color-navy)" }}>Teacher Assignments</h1>

      <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
      <select
        value={teacherId}
        onChange={(e) => setTeacherId(e.target.value)}
        className="w-full mb-4 rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">Select a teacher...</option>
        {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      {teacherId && (
        <>
          <form onSubmit={handleAssign} className="flex flex-col sm:flex-row gap-2 mb-6">
            <select
              required
              value={gradeId}
              onChange={(e) => { setGradeId(e.target.value); setSubjectId(""); }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Grade...</option>
              {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <select
              required
              disabled={!gradeId}
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
            >
              <option value="">Subject...</option>
              {subjectsForGrade.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button className="rounded-md px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "var(--color-navy)" }}>
              Assign
            </button>
          </form>

          {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

          <div className="overflow-x-auto"><table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-600 text-left">
              <tr><th className="px-3 py-2">Grade</th><th className="px-3 py-2">Subject</th><th className="px-3 py-2"></th></tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{a.subject?.grade?.name}</td>
                  <td className="px-3 py-2">{a.subject?.name}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => handleRemove(a.id)} className="underline text-red-600">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </>
      )}
    </div>
  );
}
