import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function SystemAdminDashboard() {
  const { isSystemAdmin } = useAuth();
  const [schools, setSchools] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Editing state
  const [editingSchool, setEditingSchool] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [editLogo, setEditLogo] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load all schools
  const loadSchools = async () => {
    try {
      setLoading(true);
      const { data } = await client.get("/schools");
      setSchools(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load schools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSystemAdmin) loadSchools();
  }, [isSystemAdmin]);

  // Client-side search filtering
  const filteredSchools = useMemo(() => {
    return schools.filter((s) => {
      const query = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.phone?.includes(query)
      );
    });
  }, [schools, search]);

  // Handle Delete School
  const handleDelete = async (school) => {
    if (!window.confirm(`Are you sure you want to delete "${school.name}"? This action removes all associated data.`)) {
      return;
    }

    try {
      await client.delete(`/schools/${school.id}`);
      setSchools((prev) => prev.filter((s) => s.id !== school.id));
    } catch (err) {
      alert(err.response?.data?.error || "Could not delete school");
    }
  };

  // Open Edit Modal
  const startEdit = (school) => {
    setEditingSchool(school);
    setEditForm({
      name: school.name || "",
      email: school.email || "",
      phone: school.phone || "",
      address: school.address || "",
    });
    setEditLogo(null);
  };

  // Handle Edit Submit
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("school[name]", editForm.name);
      formData.append("school[email]", editForm.email);
      formData.append("school[phone]", editForm.phone);
      formData.append("school[address]", editForm.address);
      if (editLogo) formData.append("school[logo]", editLogo);

      const { data } = await client.patch(`/schools/${editingSchool.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSchools((prev) => prev.map((s) => (s.id === data.id ? data : s)));
      setEditingSchool(null);
    } catch (err) {
      alert(err.response?.data?.errors?.join(", ") || "Failed to update school");
    } finally {
      setSaving(false);
    }
  };

  if (!isSystemAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 text-center max-w-md">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-600">
            This page is restricted to platform System Admins.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-navy)" }}>
            System Administration
          </h1>
          <p className="text-sm text-slate-500">
            Manage all onboarded school tenants across the platform.
          </p>
        </div>
        <Link
          to="/schools/new"
          className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-navy)" }}
        >
          + Onboard New School
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total School Tenants
          </p>
          <p className="text-3xl font-bold mt-1 text-slate-800">{schools.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Filtered View
          </p>
          <p className="text-3xl font-bold mt-1 text-slate-800">{filteredSchools.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            System Status
          </p>
          <span className="inline-block mt-2 px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
            Active Multi-Tenancy
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by school name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Clear
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Schools Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading schools...</div>
        ) : filteredSchools.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No school tenants found {search ? `matching "${search}"` : ""}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">School</th>
                  <th className="px-4 py-3">Contact Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchools.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <div className="flex items-center gap-3">
                        {s.logo_url ? (
                          <img
                            src={s.logo_url}
                            alt={s.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full text-white font-bold flex items-center justify-center text-xs"
                            style={{ backgroundColor: "var(--color-navy)" }}
                          >
                            {s.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.email || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{s.phone || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-xs">{s.address || "—"}</td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        onClick={() => startEdit(s)}
                        className="text-xs font-semibold underline text-slate-600 hover:text-slate-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="text-xs font-semibold underline text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit School Modal */}
      {editingSchool && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-navy)" }}>
              Edit {editingSchool.name}
            </h2>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">School Name</label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
                <input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Update Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditLogo(e.target.files[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSchool(null)}
                  className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
                  style={{ backgroundColor: "var(--color-navy)" }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}