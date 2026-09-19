import { useCallback, useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Clock, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

const TYPE_CONFIG = {
  assessment_due: {
    label: "Assessment Due",
    icon: Clock,
  },
  marks_pending: {
    label: "Marks Pending",
    icon: Bell,
  },
  assignment_deadline: {
    label: "Assignment Deadline",
    icon: Clock,
  },
  attendance_concern: {
    label: "Attendance Concern",
    icon: Bell,
  },
  intervention_follow_up: {
    label: "Intervention Follow-up",
    icon: Clock,
  },
  new_resource: {
    label: "New Resource",
    icon: Bell,
  },
  admin_announcement: {
    label: "Announcement",
    icon: Bell,
  },
};

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await client.get("/notifications");

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      console.error("Failed to load notifications:", err);

      setError(
        err?.response?.data?.error ||
          "Unable to load notifications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (notification) => {
    if (notification.read) {
      return;
    }

    try {
      await client.patch(`/notifications/${notification.id}/read`);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                read: true,
                read_at: new Date().toISOString(),
              }
            : item
        )
      );

      setUnreadCount((current) => Math.max(0, current - 1));
      window.dispatchEvent(
        new CustomEvent("schoolmarks:notifications-updated")
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) {
      return;
    }

    try {
      setMarkingAll(true);

      await client.patch("/notifications/read_all");

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
          read_at: notification.read_at || new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
      window.dispatchEvent(
        new CustomEvent("schoolmarks:notifications-updated")
     );
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const openNotification = async (notification) => {
    await markAsRead(notification);

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Bell size={21} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Notifications
                </h1>

                <p className="text-sm text-slate-500">
                  Stay up to date with your SchoolMarks workspace.
                </p>
              </div>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={markingAll}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCheck size={17} />

              {markingAll ? "Marking..." : "Mark all as read"}
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="mb-5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              {notifications.length}{" "}
              {notifications.length === 1 ? "notification" : "notifications"}
            </span>

            <span
              className={`text-sm font-semibold ${
                unreadCount > 0 ? "text-blue-600" : "text-slate-400"
              }`}
            >
              {unreadCount} unread
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />

            <p className="text-sm text-slate-500">
              Loading notifications...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && notifications.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Check size={25} className="text-slate-500" />
            </div>

            <h2 className="text-lg font-semibold text-slate-900">
              You're all caught up
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              New SchoolMarks notifications will appear here.
            </p>
          </div>
        )}

        {/* Notifications */}
        {!loading && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const config =
                TYPE_CONFIG[notification.notification_type] ||
                TYPE_CONFIG.admin_announcement;

              const Icon = config.icon;

              return (
                <div
                  key={notification.id}
                  className={`rounded-xl border bg-white shadow-sm transition ${
                    notification.read
                      ? "border-slate-200"
                      : "border-blue-200 bg-blue-50/30"
                  }`}
                >
                  <div className="flex gap-4 p-4 sm:p-5">
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        notification.read
                          ? "bg-slate-100 text-slate-500"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      <Icon size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-semibold text-slate-900">
                              {notification.title}
                            </h2>

                            {!notification.read && (
                              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                                NEW
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                            {config.label}
                          </p>
                        </div>

                        <span className="shrink-0 text-xs text-slate-400">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {notification.action_url && (
                          <button
                            type="button"
                            onClick={() => openNotification(notification)}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                          >
                            Open
                            <ExternalLink size={14} />
                          </button>
                        )}

                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            <Check size={14} />
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}