// src/pages/RegisterSchool.jsx (or OnboardSchool.jsx)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function RegisterSchool() {
  const navigate = useNavigate();
  const { isSystemAdmin } = useAuth();

  const [school, setSchool] = useState({ name: "", address: "", phone: "", email: "" });
  const [logoFile, setLogoFile] = useState(null);
  const [admin, setAdmin] = useState({ name: "", email: "", password: "", password_confirmation: "" });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Restrict access to System Admins only
  if (!isSystemAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 text-center max-w-md">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-600">
            Only platform System Admins can onboard new schools.
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);

    try {
      // Build FormData to support the school logo file upload
      const formData = new FormData();
      formData.append("school[name]", school.name);
      formData.append("school[address]", school.address);
      formData.append("school[phone]", school.phone);
      formData.append("school[email]", school.email);
      if (logoFile) {
        formData.append("school[logo]", logoFile);
      }

      formData.append("admin[name]", admin.name);
      formData.append("admin[email]", admin.email);
      formData.append("admin[password]", admin.password);
      formData.append("admin[password_confirmation]", admin.password_confirmation);

      const { data } = await client.post("/schools", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Show success state without changing the System Admin's logged-in session
      setSuccess({
        schoolName: data.school.name,
        adminEmail: data.user.email,
      });

      // Reset form
      setSchool({ name: "", address: "", phone: "", email: "" });
      setAdmin({ name: "", email: "", password: "", password_confirmation: "" });
      setLogoFile(null);
    } catch (err) {
      setError(err.response?.data?.errors?.join(", ") || "Could not onboard school");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="bg-white shadow-sm rounded-xl p-6 sm:p-8 border border-slate-200">
        <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--color-navy)" }}>
          Onboard New School
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Provision a new school tenant and create its initial ICT Admin account.
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md p-4 space-y-1">
            <p className="font-semibold">✓ {success.schoolName} successfully onboarded!</p>
            <p className="text-xs text-emerald-700">
              Initial ICT Admin created for <strong>{success.adminEmail}</strong>. A verification email has been dispatched.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">School Information</h2>
          <div className="space-y-3 mb-6">
            <input
              required
              placeholder="School name *"
              value={school.name}
              onChange={(e) => setSchool({ ...school, name: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                placeholder="Phone"
                value={school.phone}
                onChange={(e) => setSchool({ ...school, phone: e.target.value })}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="email"
                placeholder="School contact email"
                value={school.email}
                onChange={(e) => setSchool({ ...school, email: e.target.value })}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <input
              placeholder="Address"
              value={school.address}
              onChange={(e) => setSchool({ ...school, address: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                School Logo (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>
          </div>

          <h2 className="text-sm font-semibold text-slate-700 mb-3">Initial ICT Admin Credentials</h2>
          <div className="space-y-3 mb-6">
            <input
              required
              placeholder="Full name *"
              value={admin.name}
              onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              type="email"
              placeholder="Login email *"
              value={admin.email}
              onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                required
                type="password"
                placeholder="Password *"
                value={admin.password}
                onChange={(e) => setAdmin({ ...admin, password: e.target.value })}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                required
                type="password"
                placeholder="Confirm password *"
                value={admin.password_confirmation}
                onChange={(e) => setAdmin({ ...admin, password_confirmation: e.target.value })}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--color-navy)" }}
            >
              {loading ? "Onboarding..." : "Create School Tenant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}