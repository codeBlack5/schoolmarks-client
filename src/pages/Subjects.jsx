import { useEffect, useState } from "react";
import client from "../api/client";
import { useAlert } from "../context/AlertContext";

export default function Subjects() {
  const { confirm, notify } = useAlert();
  const [grades, setGrades] = useState([]);
  const [gradeId, setGradeId] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    client.get("/grades").then((res) => setGrades(res.data));
  }, []);

  function loadSubjects(id) {
    if (!id) return setSubjects([]);
    client.get(`/grades/${id}/subjects`).then((res) => setSubjects(res.data));
  }

  useEffect(() => loadSubjects(gradeId), [gradeId]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await client.post(`/grades/${gradeId}/subjects`, { subject: { name, grade_id: gradeId } });
      setName("");
      notify({ type: "success", message: `Subject "${name}" added.` });
      loadSubjects(gradeId);
    } catch (err) {
      setError(err.response?.data?.errors?.join(", ") || "Could not create subject");
    }
  }

  async function saveEdit(id) {
    try {
      await client.patch(`/subjects/${id}`, { subject: { name: editName } });
      setEditingId(null);
      notify({ type: "success", message: "Subject updated." });
      loadSubjects(gradeId);
    } catch (err) {
      notify({ type: "error", message: err.response?.data?.errors?.join(", ") || "Could not update" });
    }
  }

  async function handleDelete(id) {
    const ok = await confirm({
      title: "Delete this subject?",
      message: "Its assessments and marks will be removed too. This cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await client.delete(`/subjects/${id}`);
      notify({ type: "success", message: "Subject deleted." });
      loadSubjects(gradeId);
    } catch (err) {
      notify({ type: "error", message: err.response?.data?.error || "Could not delete" });
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <h1 className="text-lg font-semibold mb-4" style={{ color: "var(--color-navy)" }}>Subjects</h1>

      <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
      <select value={gradeId} onChange={(e) => setGradeId(e.target.value)} className="w-full mb-4 rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="">Select a grade...</option>
        {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>

      {gradeId && (
        <>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2 mb-6">
            <input required placeholder="Subject name" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <button className="rounded-md px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "var(--color-navy)" }}>Add</button>
          </form>

          {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 text-left">
                <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2"></th></tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    {editingId === s.id ? (
                      <>
                        <td className="px-3 py-2">
                          <input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded border border-slate-300 px-2 py-1 w-full" />
                        </td>
                        <td className="px-3 py-2 space-x-2">
                          <button onClick={() => saveEdit(s.id)} className="underline" style={{ color: "var(--color-gold)" }}>Save</button>
                          <button onClick={() => setEditingId(null)} className="underline text-slate-500">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2">{s.name}</td>
                        <td className="px-3 py-2 space-x-3">
                          <button onClick={() => { setEditingId(s.id); setEditName(s.name); }} className="underline text-slate-500">Edit</button>
                          <button onClick={() => handleDelete(s.id)} className="underline text-red-600">Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
