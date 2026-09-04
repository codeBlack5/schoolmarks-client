import { useState } from "react";
import client from "../../../api/client";

import {
  ALLOWED_TRANSITIONS,
  STATUS_CONFIG,
} from "../config/lifecycle";

import {
  formatDate,
  normalizeStatus,
} from "../utils/studentDetails";

import { StatusBadge } from "./StudentHeader";

export default function ChangeStatusModal({
  student,
  onClose,
  onUpdated,
}) {
  const currentStatus = normalizeStatus(student.status);
  const allowedStatuses =
    ALLOWED_TRANSITIONS[currentStatus] || [];

  const [newStatus, setNewStatus] = useState(
    allowedStatuses[0] || ""
  );

  const [transferDate, setTransferDate] = useState("");
  const [destinationSchool, setDestinationSchool] =
    useState("");
  const [transferReason, setTransferReason] =
    useState("");

  const [withdrawalDate, setWithdrawalDate] =
    useState("");
  const [withdrawalReason, setWithdrawalReason] =
    useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedStatus =
    STATUS_CONFIG[newStatus] || STATUS_CONFIG.active;

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!newStatus) {
      setError("Please select a new status.");
      return;
    }

    if (newStatus === "transferred") {
      if (!transferDate) {
        setError("Transfer date is required.");
        return;
      }

      if (!destinationSchool.trim()) {
        setError("Destination school is required.");
        return;
      }

      if (!transferReason.trim()) {
        setError("Transfer reason is required.");
        return;
      }
    }

    if (newStatus === "withdrawn") {
      if (!withdrawalDate) {
        setError("Withdrawal date is required.");
        return;
      }

      if (!withdrawalReason.trim()) {
        setError("Withdrawal reason is required.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        status: newStatus,
      };

      if (newStatus === "transferred") {
        payload.transfer_date = transferDate;
        payload.destination_school =
          destinationSchool.trim();
        payload.reason = transferReason.trim();
      }

      if (newStatus === "withdrawn") {
        payload.withdrawal_date = withdrawalDate;
        payload.reason = withdrawalReason.trim();
      }

      await client.patch(
        `/students/${student.id}/status`,
        {
          student: payload,
        }
      );

      await onUpdated();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Could not update student status."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (allowedStatuses.length === 0) {
    return (
      <ModalShell onClose={onClose}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Change Student Status
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            This student is currently{" "}
            <strong>{STATUS_CONFIG[currentStatus]?.label}</strong>{" "}
            and has no available status transitions.
          </p>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Change Student Status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update the lifecycle status for{" "}
                <span className="font-medium text-slate-700">
                  {student.name}
                </span>
                .
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-xl leading-none text-slate-400 hover:text-slate-600"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {/* Current status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Current Status
            </label>

            <StatusBadge status={student.status} />
          </div>

          {/* New status */}
          <div>
            <label
              htmlFor="new-status"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              New Status
            </label>

            <select
              id="new-status"
              value={newStatus}
              onChange={(event) =>
                setNewStatus(event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            >
              {allowedStatuses.map((status) => (
                <option key={status} value={status}>
                  {STATUS_CONFIG[status]?.label || status}
                </option>
              ))}
            </select>
          </div>

          {/* Transfer fields */}
          {newStatus === "transferred" && (
            <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div>
                <h3 className="text-sm font-semibold text-blue-900">
                  Transfer Details
                </h3>

                <p className="mt-1 text-xs text-blue-700">
                  Provide the information about the student's
                  transfer.
                </p>
              </div>

              <FormField
                label="Transfer Date"
                type="date"
                value={transferDate}
                onChange={setTransferDate}
                required
              />

              <FormField
                label="Destination School"
                value={destinationSchool}
                onChange={setDestinationSchool}
                placeholder="Enter destination school"
                required
              />

              <FormField
                label="Reason"
                value={transferReason}
                onChange={setTransferReason}
                placeholder="Enter reason for transfer"
                textarea
                required
              />
            </div>
          )}

          {/* Graduation */}
          {newStatus === "graduated" && (
            <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
              <h3 className="text-sm font-semibold text-purple-900">
                Graduation Confirmation
              </h3>

              <p className="mt-2 text-sm text-purple-800">
                You are about to mark this student as
                graduated.
              </p>

              <div className="mt-3 space-y-1 text-sm text-purple-800">
                <p>
                  <span className="font-medium">
                    Student:
                  </span>{" "}
                  {student.name}
                </p>

                <p>
                  <span className="font-medium">
                    Current Grade:
                  </span>{" "}
                  {student.grade?.name || "—"}
                </p>

                <p>
                  <span className="font-medium">
                    Graduation Date:
                  </span>{" "}
                  {formatDate(new Date())}
                </p>
              </div>

              <p className="mt-3 text-xs text-purple-700">
                The graduation date will be recorded as
                today's date.
              </p>
            </div>
          )}

          {/* Withdrawal */}
          {newStatus === "withdrawn" && (
            <div className="space-y-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
              <div>
                <h3 className="text-sm font-semibold text-amber-900">
                  Withdrawal Details
                </h3>

                <p className="mt-1 text-xs text-amber-700">
                  Provide the information about the student's
                  withdrawal.
                </p>
              </div>

              <FormField
                label="Withdrawal Date"
                type="date"
                value={withdrawalDate}
                onChange={setWithdrawalDate}
                required
              />

              <FormField
                label="Reason"
                value={withdrawalReason}
                onChange={setWithdrawalReason}
                placeholder="Enter reason for withdrawal"
                textarea
                required
              />
            </div>
          )}

          {/* Archive */}
          {newStatus === "archived" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Archive Student
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                This will archive the student's record while
                retaining their existing records and history.
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Archived students remain accessible using the
                Students status filter.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[var(--color-navy)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Updating..."
              : `Mark as ${selectedStatus.label}`}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        {children}
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  textarea = false,
  required = false,
}) {
  const commonProps = {
    value,
    onChange: (event) => onChange(event.target.value),
    placeholder,
    required,
    className:
      "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500",
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      {textarea ? (
        <textarea
          {...commonProps}
          rows={3}
        />
      ) : (
        <input
          {...commonProps}
          type={type}
        />
      )}
    </div>
  );
}