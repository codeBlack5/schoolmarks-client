import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  User,
  Mail,
  Phone,
  School,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Users,
  KeyRound,
  CheckCircle2,
  Pencil,
  X,
  Save,
  Lock,
} from "lucide-react";

import client from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function TeacherProfile() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await client.get("/teacher/profile");

        if (mounted) {
          setProfile(response.data);

          setProfileForm({
            name: response.data?.user?.name || "",
            email: response.data?.user?.email || "",
          });
        }
      } catch (err) {
        if (mounted) {
          setError(
            err.response?.data?.error ||
              "Could not load your profile."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  function formatRole(role) {
    if (!role) return "—";

    return role
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function handleProfileChange(event) {
    const { name, value } = event.target;

    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;

    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function startEditingProfile() {
    setSuccess("");
    setError("");

    setProfileForm({
      name: profile?.user?.name || "",
      email: profile?.user?.email || "",
    });

    setEditingProfile(true);
  }

  function cancelEditingProfile() {
    setProfileForm({
      name: profile?.user?.name || "",
      email: profile?.user?.email || "",
    });

    setEditingProfile(false);
    setError("");
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    setSavingProfile(true);
    setError("");
    setSuccess("");

    try {
      const response = await client.patch("/teacher/profile", {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
      });

      setProfile(response.data);

      setProfileForm({
        name: response.data?.user?.name || "",
        email: response.data?.user?.email || "",
      });

      setEditingProfile(false);
      setSuccess("Your profile was updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.errors?.join(", ") ||
          "Could not update your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();

    setChangingPassword(true);
    setError("");
    setSuccess("");

    if (passwordForm.password.length < 8) {
      setError("Your new password must be at least 8 characters.");
      setChangingPassword(false);
      return;
    }

    if (
      passwordForm.password !==
      passwordForm.password_confirmation
    ) {
      setError("Your new passwords do not match.");
      setChangingPassword(false);
      return;
    }

    try {
      const response = await client.patch("/teacher/profile", {
        current_password: passwordForm.current_password,
        password: passwordForm.password,
        password_confirmation:
          passwordForm.password_confirmation,
      });

      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });

      setSuccess(
        response.data?.message ||
          "Password updated successfully. Please log in again."
      );

      /*
       * The backend rotates the user's JTI after a successful
       * password change. Therefore the current JWT is no longer
       * valid and we must log the teacher out.
       */
      setTimeout(() => {
        logout();
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.errors?.join(", ") ||
          "Could not change your password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-sm text-slate-500">
              Loading your profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const user = profile?.user;
  const school = profile?.school;
  const subjects = profile?.assigned_subjects || [];
  const classes = profile?.classes || [];
  const account = profile?.account;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--color-navy) 10%, white)",
              }}
            >
              <User
                className="w-5 h-5"
                style={{ color: "var(--color-navy)" }}
              />
            </div>

            <div>
              <h1
                className="text-xl sm:text-2xl font-semibold"
                style={{ color: "var(--color-navy)" }}
              >
                My Profile
              </h1>

              <p className="text-sm text-slate-500">
                Your teacher account, school and workspace information
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />

            <p className="text-sm text-green-700">
              {success}
            </p>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Personal information */}
          <section className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-800">
                    Personal Information
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Update the information associated with your teacher account
                  </p>
                </div>

                {!editingProfile && (
                  <button
                    type="button"
                    onClick={startEditingProfile}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
                    style={{
                      backgroundColor: "var(--color-navy)",
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      Edit Profile
                    </span>
                    <span className="sm:hidden">Edit</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-5">
              {editingProfile ? (
                <form
                  onSubmit={handleSaveProfile}
                  className="space-y-5"
                >
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="profile-name"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Name
                    </label>

                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                      <input
                        id="profile-name"
                        name="name"
                        type="text"
                        value={profileForm.name}
                        onChange={handleProfileChange}
                        required
                        maxLength={255}
                        className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="profile-email"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Email
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                      <input
                        id="profile-email"
                        name="email"
                        type="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        required
                        maxLength={255}
                        autoComplete="email"
                        className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {/* Read-only role */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Role
                    </label>

                    <div className="flex items-center gap-3 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                      <ShieldCheck className="w-4 h-4 text-slate-400" />

                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {formatRole(user?.role)}
                        </p>

                        <p className="text-xs text-slate-500 mt-0.5">
                          Managed by school administration
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                      style={{
                        backgroundColor: "var(--color-navy)",
                      }}
                    >
                      <Save className="w-4 h-4" />

                      {savingProfile
                        ? "Saving..."
                        : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      onClick={cancelEditingProfile}
                      disabled={savingProfile}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  <ProfileRow
                    icon={User}
                    label="Name"
                    value={user?.name}
                  />

                  <ProfileRow
                    icon={Mail}
                    label="Email"
                    value={user?.email}
                  />

                  {user?.phone && (
                    <ProfileRow
                      icon={Phone}
                      label="Phone"
                      value={user.phone}
                      readOnly
                    />
                  )}

                  <ProfileRow
                    icon={ShieldCheck}
                    label="Role"
                    value={formatRole(user?.role)}
                    readOnly
                  />
                </div>
              )}
            </div>
          </section>

          {/* Account/session */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">
                Account & Session
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Current account information
              </p>
            </div>

            <div className="p-5 space-y-4">
              <InfoItem
                icon={KeyRound}
                label="User ID"
                value={account?.user_id}
              />

              <InfoItem
                icon={ShieldCheck}
                label="Account role"
                value={formatRole(account?.role)}
              />

              <InfoItem
                icon={CheckCircle2}
                label="Session"
                value="Active"
                valueClassName="text-green-700"
              />
            </div>
          </section>

          {/* Change password */}
          <section className="lg:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Lock
                  className="w-5 h-5"
                  style={{ color: "var(--color-navy)" }}
                />

                <div>
                  <h2 className="font-semibold text-slate-800">
                    Change Password
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Verify your current password before choosing a new one
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleChangePassword}
              className="p-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* Current password */}
                <div>
                  <label
                    htmlFor="current-password"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Current Password
                  </label>

                  <input
                    id="current-password"
                    name="current_password"
                    type="password"
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                    required
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* New password */}
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    New Password
                  </label>

                  <input
                    id="new-password"
                    name="password"
                    type="password"
                    value={passwordForm.password}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="text-xs text-slate-400 mt-1.5">
                    Minimum 8 characters
                  </p>
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="password-confirmation"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Confirm New Password
                  </label>

                  <input
                    id="password-confirmation"
                    name="password_confirmation"
                    type="password"
                    value={passwordForm.password_confirmation}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />

                <p className="text-sm text-amber-800">
                  After changing your password, you will be signed out
                  and must log in again using your new password.
                </p>
              </div>

              <div className="mt-5">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />

                  {changingPassword
                    ? "Updating Password..."
                    : "Change Password"}
                </button>
              </div>
            </form>
          </section>

          {/* School */}
          <section className="lg:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <School
                  className="w-5 h-5"
                  style={{ color: "var(--color-navy)" }}
                />

                <div>
                  <h2 className="font-semibold text-slate-800">
                    My School
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Your school association is managed by the school
                    administration
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <InfoItem
                icon={School}
                label="School"
                value={school?.name}
              />

              <InfoItem
                icon={School}
                label="Address"
                value={school?.address || "Not provided"}
              />

              <InfoItem
                icon={Phone}
                label="School phone"
                value={school?.phone || "Not provided"}
              />

              <InfoItem
                icon={Mail}
                label="School email"
                value={school?.email || "Not provided"}
              />
            </div>
          </section>

          {/* Assigned subjects */}
          <section className="lg:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <BookOpen
                  className="w-5 h-5"
                  style={{ color: "var(--color-gold)" }}
                />

                <div>
                  <h2 className="font-semibold text-slate-800">
                    Assigned Subjects
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Subjects currently assigned to your account
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              {subjects.length === 0 ? (
                <EmptyState message="No subject assignments found." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="border border-slate-200 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <BookOpen
                            className="w-4 h-4"
                            style={{ color: "var(--color-gold)" }}
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium text-slate-800">
                            {subject.name}
                          </p>

                          <p className="text-sm text-slate-500 mt-1">
                            {subject.grade?.name ||
                              "Class not specified"}
                          </p>

                          {subject.grade?.level && (
                            <p className="text-xs text-slate-400 mt-1">
                              Level {subject.grade.level}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Classes */}
          <section className="lg:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <GraduationCap
                  className="w-5 h-5"
                  style={{ color: "var(--color-navy)" }}
                />

                <div>
                  <h2 className="font-semibold text-slate-800">
                    My Classes
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Classes available in your teacher workspace
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              {classes.length === 0 ? (
                <EmptyState message="No classes are currently available in your workspace." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {classes.map((grade) => (
                    <div
                      key={grade.id}
                      className="border border-slate-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <GraduationCap
                            className="w-5 h-5 mt-0.5"
                            style={{
                              color: "var(--color-navy)",
                            }}
                          />

                          <div>
                            <p className="font-medium text-slate-800">
                              {grade.name}
                            </p>

                            {grade.level && (
                              <p className="text-xs text-slate-500 mt-1">
                                Level {grade.level}
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                          {grade.students_count} students
                        </span>
                      </div>

                      {grade.class_teacher && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400" />

                          <span className="text-xs text-slate-500">
                            Class teacher:
                          </span>

                          <span className="text-xs font-medium text-slate-700">
                            {grade.class_teacher.name}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Read-only notice */}
          <section className="lg:col-span-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-700">
                  Account permissions:
                </span>{" "}
                You can update your name, email and password. Your
                school, role, subject assignments and class access are
                managed by authorized school administrators.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  value,
  readOnly = false,
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-500">
            {label}
          </p>

          {readOnly && (
            <span className="text-[10px] uppercase tracking-wide text-slate-400">
              Read only
            </span>
          )}
        </div>

        <p className="text-sm font-medium text-slate-800 mt-1 break-words">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  valueClassName = "text-slate-800",
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />

      <div className="min-w-0">
        <p className="text-xs text-slate-500">
          {label}
        </p>

        <p
          className={`text-sm font-medium mt-1 break-words ${valueClassName}`}
        >
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="py-6 text-center">
      <p className="text-sm text-slate-500">
        {message}
      </p>
    </div>
  );
}