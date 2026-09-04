import { useState } from "react";
import client from "../../api/client";
import { useAlert } from "../../context/AlertContext";

const EVENT_TYPES = [
  { value: "admission", label: "Admission" },
  { value: "transfer", label: "Transfer" },
  { value: "promotion", label: "Promotion" },
  { value: "graduation", label: "Graduation" },
  { value: "withdrawal", label: "Withdrawal" },
  { value: "status_change", label: "Status Change" },
  { value: "archive", label: "Archived" },
  { value: "academic", label: "Academic" },
  { value: "attendance", label: "Attendance" },
  { value: "disciplinary", label: "Disciplinary" },
  { value: "medical", label: "Medical" },
  { value: "guardian", label: "Guardian Update" },
  { value: "document", label: "Document" },
  { value: "profile", label: "Profile Update" },
  { value: "other", label: "Other" },
];

const EVENT_ICONS = {
  admission: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path strokeLinecap="round" d="M12 6v12M6 12h12" />
    </svg>
  ),

  transfer: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 7h11m0 0-3-3m3 3-3 3M17 17H6m0 0 3-3m-3 3 3 3"
      />
    </svg>
  ),

  promotion: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 19V5m0 0-5 5m5-5 5 5"
      />
    </svg>
  ),

  disciplinary: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3 4 7v5c0 4.5 3.4 7.6 8 9 4.6-1.4 8-4.5 8-9V7l-8-4Z"
      />
      <path strokeLinecap="round" d="M12 8v4m0 3h.01" />
    </svg>
  ),

  academic: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m3 9 9-5 9 5-9 5-9-5Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 11v4c0 1.7 2.2 3 5 3s5-1.3 5-3v-4"
      />
    </svg>
  ),

  attendance: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path strokeLinecap="round" d="M8 3v4m8-4v4M7 10h10" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8 15 2 2 5-5"
      />
    </svg>
  ),

  medical: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path strokeLinecap="round" d="M9 5V4h6v1m-3 4v6m-3-3h6" />
    </svg>
  ),

  guardian: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="9" cy="8" r="3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.5 19c.6-3.2 2.4-5 5.5-5s4.9 1.8 5.5 5"
      />
      <circle cx="17" cy="9" r="2" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 14c2.5.2 4.2 1.8 4.7 4"
      />
    </svg>
  ),

  document: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v5h5" />
      <path strokeLinecap="round" d="M8 13h8m-8 4h5" />
    </svg>
  ),

  profile: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="8" r="3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6"
      />
    </svg>
  ),
    graduation: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 8.5 12 4l8 4.5-8 4.5L4 8.5Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 11v4c0 1.7 2.2 3 5 3s5-1.3 5-3v-4"
      />
      <path
        strokeLinecap="round"
        d="M20 9v5"
      />
    </svg>
  ),

  withdrawal: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        d="M8 12h8"
      />
    </svg>
  ),

  status_change: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 7h10m0 0-3-3m3 3-3 3M17 17H7m0 0 3-3m-3 3 3 3"
      />
    </svg>
  ),

  archive: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7h16l-1 13H5L4 7Z"
      />
      <path
        strokeLinecap="round"
        d="M6 7V4h12v3M9 11h6"
      />
    </svg>
  ),

  other: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
    </svg>
  ),
};

function normalizeEventType(eventType) {
  return String(eventType || "other").toLowerCase();
}

function formatDate(date) {
  if (!date) return "Date not available";

  return new Date(date).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date) {
  if (!date) return "";

  return new Date(date).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEventLabel(eventType) {
  const normalized = normalizeEventType(eventType);

  const match = EVENT_TYPES.find(
    (event) => event.value === normalized
  );

  return (
    match?.label ||
    String(eventType || "Other")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function getEventSource(item) {
  return String(item.event_source || "manual").toLowerCase();
}

function formatMetadataLabel(key) {
  return String(key || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
export default function StudentHistory({
  studentId,
  history = [],
  onUpdated,
}) {
  const { notify } = useAlert();

  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedEvents, setExpandedEvents] = useState({});

  const [form, setForm] = useState({
    event_type: "",
    event_date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const sortedHistory = [...history].sort(
    (a, b) =>
      new Date(b.event_date || b.created_at) -
      new Date(a.event_date || a.created_at)
  );

  const eventTypes = [
    "all",
    ...new Set(
      history
        .map((item) => normalizeEventType(item.event_type))
        .filter(Boolean)
    ),
  ];

  const filteredHistory =
    filter === "all"
      ? sortedHistory
      : sortedHistory.filter(
          (item) => normalizeEventType(item.event_type) === filter
        );

  const openModal = () => {
    setError("");

    setForm({
      event_type: "",
      event_date: new Date().toISOString().split("T")[0],
      description: "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.event_type) {
      setError("Please select an event type.");
      return;
    }

    if (!form.event_date) {
      setError("Please select an event date.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please enter a description.");
      return;
    }

    setSaving(true);

    try {
      await client.post(`/students/${studentId}/history`, {
        student_history: {
          event_type: form.event_type,
          event_date: form.event_date,
          description: form.description.trim(),
        },
      });

      notify({
        type: "success",
        message: "Student history event recorded successfully.",
      });

      setShowModal(false);

      if (onUpdated) {
        await onUpdated();
      }
    } catch (err) {
      console.error("Failed to record student history:", err);

      const message =
        err.response?.data?.error ||
        err.response?.data?.errors?.join(", ") ||
        "Could not record the history event.";

      setError(message);

      notify({
        type: "error",
        message,
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleEventDetails = (eventId) => {
    setExpandedEvents((current) => ({
      ...current,
      [eventId]: !current[eventId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Student History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              A chronological record of important events in the
              student's school history.
            </p>
          </div>

          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>

            Record Event
          </button>
        </div>
      </div>

      {/* Timeline / empty state */}
      {filteredHistory.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <svg
              className="h-7 w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M12 7v5l3 2" />
            </svg>
          </div>

          <h3 className="font-medium text-gray-900">
            No history recorded
          </h3>

          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            {filter === "all"
              ? "Important events for this student will appear here as they are recorded."
              : "There are no events matching the selected filter."}
          </p>

          {filter !== "all" && (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Show all events
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-end">
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "all" ? "All events" : getEventLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <div className="absolute bottom-4 left-5 top-4 w-px bg-gray-200" />

            <div className="space-y-8">
            {filteredHistory.map((item, index) => {
              const type = normalizeEventType(item.event_type);
              const eventDate = item.event_date || item.created_at;
              const eventId =
                item.id || `${type}-${eventDate}-${index}`;

              const eventSource = getEventSource(item);
              const metadata = item.metadata || {};
              const hasMetadata =
                Object.keys(metadata).length > 0;

              const isExpanded = Boolean(expandedEvents[eventId]);

              return (
                <div
                  key={eventId}
                  className="relative flex gap-4"
                >
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white bg-blue-50 text-blue-600 shadow-sm">
                    {EVENT_ICONS[type] || EVENT_ICONS.other}
                  </div>

                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {getEventLabel(item.event_type)}
                          </span>

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              eventSource === "system"
                                ? "bg-slate-100 text-slate-600"
                                : "bg-green-50 text-green-700"
                            }`}
                          >
                            {eventSource === "system"
                              ? "SYSTEM"
                              : "MANUAL"}
                          </span>
                        </div>

                        <h3 className="mt-2 text-sm font-semibold text-gray-900">
                          {item.description ||
                            "No description provided"}
                        </h3>
                      </div>

                      <div className="shrink-0 text-left md:text-right">
                        <p className="text-sm font-medium text-gray-700">
                          {formatDate(eventDate)}
                        </p>

                        {formatTime(eventDate) && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            {formatTime(eventDate)}
                          </p>
                        )}
                      </div>
                    </div>

                    {item.recorded_by && (
                      <p className="mt-2 text-xs text-gray-500">
                        Recorded by{" "}
                        <span className="font-medium text-gray-700">
                          {item.recorded_by.name ||
                            item.recorded_by.email}
                        </span>
                      </p>
                    )}

                    {hasMetadata && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() =>
                            toggleEventDetails(eventId)
                          }
                          className="text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          {isExpanded
                            ? "Hide details ↑"
                            : "View details →"}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {Object.entries(metadata).map(
                                ([key, value]) => (
                                  <div key={key}>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                      {formatMetadataLabel(key)}
                                    </dt>

                                    <dd className="mt-1 text-sm font-medium text-slate-700">
                                      {value === null ||
                                      value === undefined ||
                                      value === ""
                                        ? "—"
                                        : typeof value === "object"
                                        ? JSON.stringify(value)
                                        : String(value)}
                                    </dd>
                                  </div>
                                )
                              )}
                            </dl>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      )}

      {/* Record Event modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Record Student Event
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add an important event to the student's history.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 px-6 py-5">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Event type */}
                <div>
                  <label
                    htmlFor="history-event-type"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Event type
                  </label>

                  <select
                    id="history-event-type"
                    name="event_type"
                    value={form.event_type}
                    onChange={handleChange}
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  >
                    <option value="">Select event type</option>

                    {EVENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event date */}
                <div>
                  <label
                    htmlFor="history-event-date"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Event date
                  </label>

                  <input
                    id="history-event-date"
                    name="event_date"
                    type="date"
                    value={form.event_date}
                    onChange={handleChange}
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="history-description"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>

                  <textarea
                    id="history-description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    disabled={saving}
                    rows={5}
                    placeholder="Describe what happened..."
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Record event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

