import { ALLOWED_TRANSITIONS, STATUS_CONFIG } from "../config/lifecycle";
import {
  formatDate,
  getInitials,
  normalizeStatus,
} from "../utils/studentDetails";

export default function StudentHeader({
  student,
  profile,
  refreshing,
  onRefresh,
  onChangeStatus,
}) {
  const status = normalizeStatus(student.status);
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.active;

  const canChangeStatus =
    (ALLOWED_TRANSITIONS[status] || []).length > 0;

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          {/* Student identity */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-700">
              {getInitials(student.name)}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-slate-900">
                  {student.name}
                </h1>

                <StatusBadge status={student.status} />
              </div>

              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span>
                  Admission No:{" "}
                  <span className="font-medium text-slate-700">
                    {student.admission_number || "—"}
                  </span>
                </span>

                <span>
                  Grade:{" "}
                  <span className="font-medium text-slate-700">
                    {student.grade?.name || "—"}
                  </span>
                </span>
              </div>

              <div className="mt-2 text-xs text-slate-400">
                Admitted: {formatDate(student.admission_date)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {canChangeStatus && (
              <button
                type="button"
                onClick={onChangeStatus}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Change Status
              </button>
            )}

            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Additional information */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
            {student.id && (
              <span>
                Student ID:{" "}
                <span className="font-medium text-slate-700">
                  {student.id}
                </span>
              </span>
            )}

            {profile?.phone && (
              <span>
                Phone:{" "}
                <span className="font-medium text-slate-700">
                  {profile.phone}
                </span>
              </span>
            )}

            {profile?.email && (
              <span>
                Email:{" "}
                <span className="font-medium text-slate-700">
                  {profile.email}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const normalizedStatus = normalizeStatus(status);
  const config =
    STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.active;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.badge}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
      />

      {config.label}
    </span>
  );
}
