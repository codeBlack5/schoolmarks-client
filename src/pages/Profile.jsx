import { useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";

export default function Profile() {
  const { user, updateStoredUser } = useAuth();
  const { notify } = useAlert();

  const [details, setDetails] = useState({ name: user.name, email: user.email });
  const [detailsError, setDetailsError] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  const [password, setPassword] = useState({ password: "", password_confirmation: "" });
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleDetailsSubmit(e) {
    e.preventDefault();
    setDetailsError("");
    setSavingDetails(true);
    try {
      const { data } = await client.patch(`/users/${user.id}`, { user: details });
      updateStoredUser({ ...user, name: data.name, email: data.email });
      notify({ type: "success", message: "Profile updated." });
    } catch (err) {
      setDetailsError(err.response?.data?.errors?.join(", ") || err.response?.data?.error || "Could not update profile");
    } finally {
      setSavingDetails(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError("");
    setSavingPassword(true);
    try {
      await client.patch(`/users/${user.id}`, { user: password });
      setPassword({ password: "", password_confirmation: "" });
      notify({ type: "success", message: "Password changed." });
    } catch (err) {
      setPasswordError(err.response?.data?.errors?.join(", ") || "Could not change password");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-10">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--color-navy)" }}>My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Signed in as {user.name} · {user.role}</p>
      </div>

      <section>
        <h2 className="text-base font-semibold mb-3">Account Details</h2>
        <form onSubmit={handleDetailsSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input required value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input required type="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          {detailsError && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{detailsError}</div>}
          <button disabled={savingDetails} className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60" style={{ backgroundColor: "var(--color-navy)" }}>
            {savingDetails ? "Saving..." : "Save Details"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-3">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input required type="password" value={password.password} onChange={(e) => setPassword({ ...password, password: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
            <input required type="password" value={password.password_confirmation} onChange={(e) => setPassword({ ...password, password_confirmation: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          {passwordError && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{passwordError}</div>}
          <button disabled={savingPassword} className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60" style={{ backgroundColor: "var(--color-navy)" }}>
            {savingPassword ? "Saving..." : "Change Password"}
          </button>
        </form>
      </section>
    </div>
  );
}
