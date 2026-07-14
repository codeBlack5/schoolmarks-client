import { useEffect, useState } from "react";
import client from "../api/client";

export default function EditRequestsQueue() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("pending");

  function load() {
    client.get(`/edit_requests?status=${filter}`).then((res) => setRequests(res.data));
  }
  useEffect(load, [filter]);

  async function handleApprove(id) {
    await client.patch(`/edit_requests/${id}/approve`);
    load();
  }

  async function handleReject(id) {
    await client.patch(`/edit_requests/${id}/reject`);
    load();
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-lg font-semibold" style={{ color: "var(--color-navy)" }}>Edit Requests</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {requests.length === 0 && <p className="text-sm text-slate-400">No {filter} edit requests.</p>}

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="border border-slate-200 rounded-lg p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{r.mark.student.name} — {r.mark.assessment.subject.name} / {r.mark.assessment.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Current: {r.mark.status === "present" ? r.mark.score : r.mark.status}
                  {" → "}
                  Requested: {r.new_status === "present" ? r.new_score : r.new_status}
                </p>
                <p className="text-xs text-slate-500 mt-1">Reason: {r.reason}</p>
                <p className="text-xs text-slate-400 mt-1">Requested by {r.requested_by.name}</p>
              </div>
              {filter === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleApprove(r.id)} className="text-xs underline" style={{ color: "var(--color-gold)" }}>Approve</button>
                  <button onClick={() => handleReject(r.id)} className="text-xs underline text-red-600">Reject</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
