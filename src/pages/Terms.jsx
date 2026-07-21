import { useEffect, useState } from "react";
import client from "../api/client";
import { useAlert } from "../context/AlertContext";

export default function Terms() {
  const { confirm, notify } = useAlert();
  const [terms, setTerms] = useState([]);
  const [form, setForm] = useState({ name: "", year: "", start_date: "", end_date: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState("");

  function load() {
    client.get("/terms").then((res) => setTerms(res.data));
  }
  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await client.post("/terms", { term: form });
      setForm({ name: "", year: "", start_date: "", end_date: "" });
      notify({ type: "success", message: `${form.name} created.` });
      load();
    } catch (err) {
      setError(err.response?.data?.errors?.join(", ") || "Could not create term");
    }
  }

  function startEdit(t) {
    setEditingId(t.id);
    setEditForm({ name: t.name, year: t.year, start_date: t.start_date || "", end_date: t.end_date || "" });
  }

  async function saveEdit(id) {
    try {
      await client.patch(`/terms/${id}`, { term: editForm });
      setEditingId(null);
      notify({ type: "success", message: "Term updated." });
      load();
    } catch (err) {
      notify({ type: "error", message: err.response?.data?.errors?.join(", ") || "Could not update" });
    }
  }

  async function handleDelete(id) {
    const ok = await confirm({
      title: "Delete this term?",
      message: "Its assessments and marks will be removed too. This cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await client.delete(`/terms/${id}`);
      notify({ type: "success", message: "Term deleted." });
      load();
    } catch (err) {
      notify({ type: "error", message: err.response?.data?.error || "Could not delete" });
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-lg font-semibold mb-4" style={{ color: "var(--color-navy)" }}>Terms</h1>

      <form onSubmit={handleCreate} className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Year</label>
          <input required type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Start</label>
          <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">End</label>
          <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm" />
        </div>
        <button className="rounded-md px-4 py-2 text-sm font-medium text-white h-fit" style={{ backgroundColor: "var(--color-navy)" }}>
          Add
        </button>
      </form>

      {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-100 text-slate-600 text-left">
            <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Year</th><th className="px-3 py-2">Start</th><th className="px-3 py-2">End</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody>
            {terms.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                {editingId === t.id ? (
                  <>
                    <td className="px-3 py-2"><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="rounded border border-slate-300 px-2 py-1 w-full" /></td>
                    <td className="px-3 py-2"><input type="number" value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: e.target.value })} className="rounded border border-slate-300 px-2 py-1 w-20" /></td>
                    <td className="px-3 py-2"><input type="date" value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} className="rounded border border-slate-300 px-2 py-1" /></td>
                    <td className="px-3 py-2"><input type="date" value={editForm.end_date} onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })} className="rounded border border-slate-300 px-2 py-1" /></td>
                    <td className="px-3 py-2 space-x-2">
                      <button onClick={() => saveEdit(t.id)} className="underline" style={{ color: "var(--color-gold)" }}>Save</button>
                      <button onClick={() => setEditingId(null)} className="underline text-slate-500">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2">{t.name}</td>
                    <td className="px-3 py-2">{t.year}</td>
                    <td className="px-3 py-2">{t.start_date}</td>
                    <td className="px-3 py-2">{t.end_date}</td>
                    <td className="px-3 py-2 space-x-3">
                      <button onClick={() => startEdit(t)} className="underline text-slate-500">Edit</button>
                      <button onClick={() => handleDelete(t.id)} className="underline text-red-600">Delete</button>
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
