import { useEffect, useState } from "react";
import client from "../api/client";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";

const ROLE_OPTIONS = [
  { value: "admin", label: "ICT Admin" },
  { value: "headteacher", label: "Headteacher" },
  { value: "deputy", label: "Deputy Headteacher" },
  { value: "dos", label: "Director of Studies" },
];
const ROLE_LABELS = Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r.label]));

export default function Staff() {
  const { user: currentUser } = useAuth();
  const { confirm, notify } = useAlert();
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "", role: "dos" });
  const [error, setError] = useState("");

  function load() {
    client.get("/users").then((res) => setStaff(res.data.filter((u) => u.role !== "teacher")));
  }
  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await client.post("/users", { user: form });
      setForm({ name: "", email: "", password: "", password_confirmation: "", role: "dos" });
      notify({ type: "success", message: `${form.name} added as ${ROLE_LABELS[form.role]}.` });
      load();
    } catch (err) {
      setError(err.response?.data?.errors?.join(", ") || "Could not create account");
    }
  }

  async function handleRoleChange(id, name, newRole) {
    try {
      await client.patch(`/users/${id}`, { user: { role: newRole } });
      notify({ type: "success", message: `${name} is now ${ROLE_LABELS[newRole]}.` });
      load();
    } catch (err) {
      notify({ type: "error", message: err.response?.data?.error || "Could not change role" });
    }
  }

  async function handleDelete(id, name) {
    const ok = await confirm({
      title: `Delete ${name}'s account?`,
      message: "This cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await client.delete(`/users/${id}`);
      notify({ type: "success", message: "Account deleted." });
      load();
    } catch (err) {
      notify({ type: "error", message: err.response?.data?.error || "Could not delete" });
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <h1 className="text-lg font-semibold mb-1" style={{ color: "var(--color-navy)" }}>Staff</h1>
      <p className="text-sm text-slate-500 mb-4">ICT Admins, Headteacher, Deputy, and Director of Studies — all share full system access.</p>

      <form onSubmit={handleCreate} className="space-y-2 mb-6 border border-slate-200 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input required type="password" placeholder="Confirm password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <button className="rounded-md px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "var(--color-navy)" }}>
          Create Staff Account
        </button>
      </form>

      {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-100 text-slate-600 text-left">
            <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Role</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody>
            {staff.map((s) => {
              const isSelf = s.id === currentUser.id;
              return (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{s.name}{isSelf && <span className="text-xs text-slate-400"> (you)</span>}</td>
                  <td className="px-3 py-2">{s.email}</td>
                  <td className="px-3 py-2">
                    <select
                      value={s.role}
                      disabled={isSelf}
                      onChange={(e) => handleRoleChange(s.id, s.name, e.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs disabled:bg-slate-100"
                    >
                      {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {!isSelf && <button onClick={() => handleDelete(s.id, s.name)} className="underline text-red-600">Delete</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
