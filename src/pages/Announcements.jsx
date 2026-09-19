import { useEffect, useState } from "react";
import {
  Bell,
  Megaphone,
  Plus,
  Send,
  Users,
  X,
} from "lucide-react";
import client from "../api/client";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
  });

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await client.get("/announcements");

      setAnnouncements(response.data?.announcements || []);
    } catch (err) {
      console.error("Failed to load announcements:", err);

      setError(
        err.response?.data?.error ||
          "Failed to load announcements."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.message.trim()) {
      setError("Please enter both a title and message.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await client.post("/announcements", {
        announcement: {
          title: form.title.trim(),
          message: form.message.trim(),
        },
      });

      const created = response.data;

      setAnnouncements((current) => [
        created,
        ...current,
      ]);

      setForm({
        title: "",
        message: "",
      });

      setShowForm(false);

      setSuccess(
        `Announcement sent to ${created.recipients_count || 0} teachers.`
      );
    } catch (err) {
      console.error("Failed to create announcement:", err);

      setError(
        err.response?.data?.error ||
          "Failed to create announcement."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Megaphone className="text-blue-600" size={24} />
              <h1 className="text-2xl font-bold text-slate-900">
                Announcements
              </h1>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Send important announcements and updates to teachers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setError("");
              setSuccess("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            New Announcement
          </button>
        </div>

        {/* Messages */}
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  New Announcement
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  This announcement will be sent as a notification to all
                  teachers in the current school.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Recipients */}
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                    <Users size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      All Teachers
                    </p>
                    <p className="text-xs text-slate-500">
                      Every teacher in this school will receive a notification.
                    </p>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label
                  htmlFor="announcement-title"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Title
                </label>

                <input
                  id="announcement-title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Staff Meeting Reminder"
                  maxLength={255}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  disabled={submitting}
                />
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="announcement-message"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Message
                </label>

                <textarea
                  id="announcement-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Write your announcement here..."
                  rows={6}
                  className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  disabled={submitting}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !form.title.trim() ||
                    !form.message.trim()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={17} />
                  {submitting ? "Sending..." : "Send Announcement"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Announcement history */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              Announcement History
            </h2>
          </div>

          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              Loading announcements...
            </div>
          ) : announcements.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Bell
                size={32}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-medium text-slate-700">
                No announcements yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create your first announcement to notify teachers.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-5 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900">
                        {announcement.title}
                      </h3>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {announcement.message}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        <Users size={13} />
                        {announcement.recipients_count || 0} teachers
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>
                      Sent by {announcement.created_by?.name || "Admin"}
                    </span>

                    <span>
                      {formatDate(announcement.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
