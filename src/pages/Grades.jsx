import { useEffect, useState } from "react";
import client from "../api/client";
import { useAlert } from "../context/AlertContext";

export default function Grades() {
  const { confirm, notify } = useAlert();
  const [grades, setGrades] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ name: "", level: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState("");

  function load() {
    client.get("/grades").then((res) => setGrades(res.data));
  }
  useEffect(() => {
    load();
    client.get("/users?role=teacher").then((res) => setTeachers(res.data));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await client.post("/grades", { grade: form });
      setForm({ name: "", level: "" });
      notify({ type: "success", message: `Grade "${form.name}" created.` });
      load();
    } catch (err) {
      setError(err.response?.data?.errors?.join(", ") || "Could not create grade");
    }
  }

  function startEdit(grade) {
    setEditingId(grade.id);
    setEditForm({ name: grade.name, level: grade.level, class_teacher_id: grade.class_teacher?.id || "" });
  }

  async function saveEdit(id) {
    try {
      await client.patch(`/grades/${id}`, { grade: editForm });
      setEditingId(null);
      notify({ type: "success", message: "Grade updated." });
      load();
    } catch (err) {
      notify({ type: "error", message: err.response?.data?.errors?.join(", ") || "Could not update" });
    }
  }

  async function handleDelete(id) {
    const ok = await confirm({
      title: "Delete this grade?",
      message: "All its subjects and students will be removed too. This cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await client.delete(`/grades/${id}`);
      notify({ type: "success", message: "Grade deleted." });
      load();
    } catch (err) {
      notify({ type: "error", message: err.response?.data?.error || "Could not delete" });
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-lg font-semibold mb-4" style={{ color: "var(--color-navy)" }}>Grades</h1>

      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          required
          placeholder="Name (e.g. Grade 9)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          required
          type="number"
          placeholder="Level (e.g. 9)"
          value={form.level}
          onChange={(e) => setForm({ ...form, level: e.target.value })}
          className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button className="rounded-md px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "var(--color-navy)" }}>
          Add
        </button>
      </form>

      {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-100 text-slate-600 text-left">
            <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Level</th><th className="px-3 py-2">Class Teacher</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody>
            {grades.map((g) => (
              <tr key={g.id} className="border-t border-slate-100">
                {editingId === g.id ? (
                  <>
                    <td className="px-3 py-2">
                      <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="rounded border border-slate-300 px-2 py-1 w-full" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={editForm.level} onChange={(e) => setEditForm({ ...editForm, level: e.target.value })} className="rounded border border-slate-300 px-2 py-1 w-20" />
                    </td>
                    <td className="px-3 py-2">
                      <select value={editForm.class_teacher_id} onChange={(e) => setEditForm({ ...editForm, class_teacher_id: e.target.value })} className="rounded border border-slate-300 px-2 py-1 w-full">
                        <option value="">None</option>
                        {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 space-x-2">
                      <button onClick={() => saveEdit(g.id)} className="underline" style={{ color: "var(--color-gold)" }}>Save</button>
                      <button onClick={() => setEditingId(null)} className="underline text-slate-500">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2">{g.name}</td>
                    <td className="px-3 py-2">{g.level}</td>
                    <td className="px-3 py-2 text-slate-500">{g.class_teacher?.name || "—"}</td>
                    <td className="px-3 py-2 space-x-3">
                      <button onClick={() => startEdit(g)} className="underline text-slate-500">Edit</button>
                      <button onClick={() => handleDelete(g.id)} className="underline text-red-600">Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
