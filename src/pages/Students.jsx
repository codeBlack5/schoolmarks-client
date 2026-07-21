import { useEffect, useState } from "react";
import client from "../api/client";
import { downloadFile } from "../api/download";
import { useAlert } from "../context/AlertContext";

const emptyForm = { name: "", admission_number: "", guardian_name: "", guardian_phone: "", guardian_relationship: "" };

export default function Students() {
  const { confirm, notify } = useAlert();
  const [grades, setGrades] = useState([]);
  const [gradeId, setGradeId] = useState("");
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    client.get("/grades").then((res) => setGrades(res.data));
  }, []);

  function loadStudents(id) {
    if (!id) return setStudents([]);
    client.get(`/grades/${id}/students`).then((res) => setStudents(res.data));
  }

  useEffect(() => loadStudents(gradeId), [gradeId]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await client.post(`/grades/${gradeId}/students`, { student: { ...form, grade_id: gradeId } });
      setForm(emptyForm);
      notify({ type: "success", message: `${form.name} added.` });
      loadStudents(gradeId);
    } catch (err) {
      setError(err.response?.data?.errors?.join(", ") || "Could not add student");
    }
  }

  function startEdit(s) {
    setEditingId(s.id);
    setEditForm({
      name: s.name,
      admission_number: s.admission_number,
      guardian_name: s.guardian_name || "",
      guardian_phone: s.guardian_phone || "",
      guardian_relationship: s.guardian_relationship || "",
    });
  }

  async function saveEdit(id) {
    try {
      await client.patch(`/students/${id}`, { student: editForm });
      setEditingId(null);
      notify({ type: "success", message: "Student updated." });
      loadStudents(gradeId);
    } catch (err) {
      notify({ type: "error", message: err.response?.data?.errors?.join(", ") || "Could not update" });
    }
  }

  async function handleDelete(id) {
    const ok = await confirm({
      title: "Delete this student?",
      message: "Their marks will be removed too. This cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await client.delete(`/students/${id}`);
      notify({ type: "success", message: "Student deleted." });
      loadStudents(gradeId);
    } catch (err) {
      notify({ type: "error", message: err.response?.data?.error || "Could not delete" });
    }
  }

  async function handleTemplateDownload() {
    await downloadFile("/students/template", "student_upload_template.xlsx");
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    setUploadResult(null);
    try {
      const { data } = await client.post(`/grades/${gradeId}/students/bulk_upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadResult(data);
      notify({ type: data.errors.length ? "error" : "success", message: `Uploaded: ${data.created.length} created, ${data.errors.length} skipped.` });
      loadStudents(gradeId);
    } catch (err) {
      const message = err.response?.data?.error || "Upload failed";
      setUploadResult({ error: message });
      notify({ type: "error", message });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-lg font-semibold mb-4" style={{ color: "var(--color-navy)" }}>Students</h1>

      <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
      <select value={gradeId} onChange={(e) => setGradeId(e.target.value)} className="w-full mb-4 rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="">Select a grade...</option>
        {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>

      {gradeId && (
        <>
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
            <button type="button" onClick={handleTemplateDownload} className="underline" style={{ color: "var(--color-gold)" }}>
              Download Excel Template
            </button>
            <label className="underline cursor-pointer" style={{ color: "var(--color-gold)" }}>
              {uploading ? "Uploading..." : "Upload Students (.xlsx/.csv)"}
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleUpload} disabled={uploading} className="hidden" />
            </label>
          </div>

          {uploadResult && !uploadResult.error && uploadResult.errors?.length > 0 && (
            <div className="mb-6 text-sm rounded-md border border-slate-200 p-3">
              <ul className="space-y-1 text-red-600 text-xs">
                {uploadResult.errors.map((e, i) => (
                  <li key={i}>Row {e.row} ({e.admission_number || "no adm. no."}): {e.errors.join(", ")}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleCreate} className="mb-6 border border-slate-200 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input required placeholder="Student name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input required placeholder="Admission No." value={form.admission_number} onChange={(e) => setForm({ ...form, admission_number: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <p className="text-xs text-slate-400 pt-1">Guardian contact (optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input placeholder="Guardian name" value={form.guardian_name} onChange={(e) => setForm({ ...form, guardian_name: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input placeholder="Guardian phone" value={form.guardian_phone} onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input placeholder="Relationship (e.g. Mother)" value={form.guardian_relationship} onChange={(e) => setForm({ ...form, guardian_relationship: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button className="rounded-md px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "var(--color-navy)" }}>
              Add Student
            </button>
          </form>

          {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 text-left">
                <tr>
                  <th className="px-3 py-2">Adm No</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Guardian</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    {editingId === s.id ? (
                      <>
                        <td className="px-3 py-2"><input value={editForm.admission_number} onChange={(e) => setEditForm({ ...editForm, admission_number: e.target.value })} className="rounded border border-slate-300 px-2 py-1 w-full" /></td>
                        <td className="px-3 py-2"><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="rounded border border-slate-300 px-2 py-1 w-full" /></td>
                        <td className="px-3 py-2 space-y-1">
                          <input placeholder="Guardian name" value={editForm.guardian_name} onChange={(e) => setEditForm({ ...editForm, guardian_name: e.target.value })} className="rounded border border-slate-300 px-2 py-1 w-full" />
                          <input placeholder="Relationship" value={editForm.guardian_relationship} onChange={(e) => setEditForm({ ...editForm, guardian_relationship: e.target.value })} className="rounded border border-slate-300 px-2 py-1 w-full" />
                        </td>
                        <td className="px-3 py-2">
                          <input placeholder="Phone" value={editForm.guardian_phone} onChange={(e) => setEditForm({ ...editForm, guardian_phone: e.target.value })} className="rounded border border-slate-300 px-2 py-1 w-full" />
                        </td>
                        <td className="px-3 py-2 space-x-2 whitespace-nowrap">
                          <button onClick={() => saveEdit(s.id)} className="underline" style={{ color: "var(--color-gold)" }}>Save</button>
                          <button onClick={() => setEditingId(null)} className="underline text-slate-500">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-slate-500">{s.admission_number}</td>
                        <td className="px-3 py-2">{s.name}</td>
                        <td className="px-3 py-2 text-xs text-slate-500">
                          {s.guardian_name ? `${s.guardian_name}${s.guardian_relationship ? ` (${s.guardian_relationship})` : ""}` : "—"}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500">{s.guardian_phone || "—"}</td>
                        <td className="px-3 py-2 space-x-3 whitespace-nowrap">
                          <button onClick={() => startEdit(s)} className="underline text-slate-500">Edit</button>
                          <button onClick={() => handleDelete(s.id)} className="underline text-red-600">Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
