// src/pages/admin/SchoolsManager.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import EditSchoolModal from "./EditSchoolModal";

export default function SchoolsManager() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [editingSchool, setEditingSchool] = useState(null);
  const { switchTenant } = useAuth();

  useEffect(() => {
    client
      .get("/schools")
      .then(({ data }) => {
        setSchools(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch system schools.");
        setLoading(false);
      });
  }, []);

  const handleSchoolUpdated = (updatedSchool) => {
    setSchools((prev) =>
      prev.map((s) => (s.id === updatedSchool.id ? updatedSchool : s))
    );
  };

  const handleDeleteSchool = async (school) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${school.name}"? This action is permanent and will remove all tenant records.`
    );

    if (!confirmDelete) return;

    setDeletingId(school.id);
    try {
      await client.delete(`/schools/${school.id}`);
      setSchools((prev) => prev.filter((s) => s.id !== school.id));
    } catch (err) {
      alert(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to delete the school portal."
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading schools...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registered School Tenants</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage all onboarded schools on the CBC platform.
          </p>
        </div>
        <Link
          to="/admin/schools/new"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          + Add New School
        </Link>
      </div>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <div
            key={school.id}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                {/* Logo or Initial Fallback */}
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl font-bold text-slate-700 overflow-hidden border border-slate-200 shrink-0">
                  {school.logo_url ? (
                    <img
                      src={school.logo_url}
                      alt={school.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    school.name.charAt(0)
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full">
                    ID: #{school.id}
                  </span>
                  <button
                    onClick={() => setEditingSchool(school)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"
                  >
                    <span>✏️ Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSchool(school)}
                    disabled={deletingId === school.id}
                    className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <span>🗑️ {deletingId === school.id ? "..." : "Delete"}</span>
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">{school.name}</h3>
              <p className="text-xs text-slate-500 mb-4">{school.address || "No address provided"}</p>

              <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 mb-6">
                <div>✉️ {school.email || "No email"}</div>
                <div>📞 {school.phone || "No phone"}</div>
              </div>
            </div>

            {/* Inspect Button */}
            <button
              onClick={() => switchTenant(school)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>Inspect Workspace</span>
              <span>→</span>
            </button>
          </div>
        ))}
      </div>

      {/* Edit School Modal */}
      <EditSchoolModal
        school={editingSchool}
        isOpen={Boolean(editingSchool)}
        onClose={() => setEditingSchool(null)}
        onSchoolUpdated={handleSchoolUpdated}
      />
    </div>
  );
}