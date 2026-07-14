import { useEffect, useState } from "react";
import client from "../api/client";

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
  const [error, setError] = useState("");

  function load() {
    client.get("/users?role=teacher").then((res) => setTeachers(res.data));
  }
  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await client.post("/users", { user: { ...form, role: "teacher" } });
      setForm({ name: "", email: "", password: "", password_confirmation: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.errors?.join(", ") || "Could not create teacher account");
    }
  }

  async function handlePromote(id, name) {
    if (!confirm(`Promote ${name} to admin? They will gain full access to all school data.`)) return;
    try {
      await client.patch(`/users/${id}`, { user: { role: "admin" } });
      load(); // promoted user drops off this teacher-only list, which is expected
    } catch (err) {
      alert(err.response?.data?.error || "Could not promote");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this teacher account? Their subject assignments will be removed too.")) return;
    try {
      await client.delete(`/users/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Could not delete");
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <h1 className="text-lg font-semibold mb-4" style={{ color: "var(--color-navy)" }}>Teachers</h1>

      <form onSubmit={handleCreate} className="space-y-2 mb-6 border border-slate-200 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input required type="password" placeholder="Confirm password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <button className="rounded-md px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "var(--color-navy)" }}>
          Create Teacher Account
        </button>
      </form>

      {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-100 text-slate-600 text-left">
            <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{t.name}</td>
                <td className="px-3 py-2">{t.email}</td>
                <td className="px-3 py-2 space-x-3 whitespace-nowrap">
                  <button onClick={() => handlePromote(t.id, t.name)} className="underline" style={{ color: "var(--color-gold)" }}>Promote to Admin</button>
                  <button onClick={() => handleDelete(t.id)} className="underline text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
