import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { downloadFile } from "../api/download";
import { useAlert } from "../context/AlertContext";

const emptyForm = {
  name: "",
  admission_number: "",
  guardian_name: "",
  guardian_phone: "",
  guardian_relationship: "",
};

const STATUS_OPTIONS = [
  { value: "active", label: "Active Students" },
  { value: "archived", label: "Archived Students" },
  { value: "transferred", label: "Transferred Students" },
  { value: "graduated", label: "Graduated Students" },
  { value: "withdrawn", label: "Withdrawn Students" },
];

const STATUS_LABELS = {
  active: "Active",
  archived: "Archived",
  transferred: "Transferred",
  graduated: "Graduated",
  withdrawn: "Withdrawn",
};

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

  const [statusFilter, setStatusFilter] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    client
      .get("/grades")
      .then((res) => setGrades(res.data))
      .catch((err) => {
        notify({
          type: "error",
          message:
            err.response?.data?.error ||
            "Could not load grades.",
        });
      });
  }, []);

  function loadStudents(id, status = statusFilter) {
    if (!id) {
      setStudents([]);
      return;
    }

    client
      .get(`/grades/${id}/students`, {
        params: { status },
      })
      .then((res) => setStudents(res.data))
      .catch((err) => {
        setStudents([]);

        notify({
          type: "error",
          message:
            err.response?.data?.error ||
            "Could not load students.",
        });
      });
  }

  useEffect(() => {
    loadStudents(gradeId, statusFilter);
  }, [gradeId, statusFilter]);

  const filteredStudents = students.filter((student) => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return true;

    return (
      student.name?.toLowerCase().includes(query) ||
      student.admission_number?.toLowerCase().includes(query)
    );
  });

  async function handleCreate(e) {
    e.preventDefault();
    setError("");

    if (!gradeId) {
      setError("Please select a grade first.");
      return;
    }

    try {
      await client.post(`/grades/${gradeId}/students`, {
        student: {
          ...form,
          grade_id: gradeId,
        },
      });

      setForm(emptyForm);

      notify({
        type: "success",
        message: `${form.name} added.`,
      });

      loadStudents(gradeId, statusFilter);
    } catch (err) {
      setError(
        err.response?.data?.errors?.join(", ") ||
          err.response?.data?.error ||
          "Could not add student"
      );
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
      await client.patch(`/students/${id}`, {
        student: editForm,
      });

      setEditingId(null);

      notify({
        type: "success",
        message: "Student updated.",
      });

      loadStudents(gradeId, statusFilter);
    } catch (err) {
      notify({
        type: "error",
        message:
          err.response?.data?.errors?.join(", ") ||
          err.response?.data?.error ||
          "Could not update",
      });
    }
  }

  async function handleArchive(student) {
    const ok = await confirm({
      title: `Archive ${student.name}?`,
      message:
        "The student will be removed from the active student list, but their marks, attendance, interventions, documents, profile and history will be preserved.",
      confirmText: "Archive",
      danger: false,
    });

    if (!ok) return;

    try {
      await client.patch(`/students/${student.id}/status`, {
        student: {
          status: "archived",
        },
      });

      notify({
        type: "success",
        message: `${student.name} has been archived.`,
      });

      loadStudents(gradeId, statusFilter);
    } catch (err) {
      notify({
        type: "error",
        message:
          err.response?.data?.error ||
          "Could not archive student.",
      });
    }
  }

  async function handleRestore(student) {
    const ok = await confirm({
      title: `Restore ${student.name}?`,
      message:
        "The student will be restored to the active student list.",
      confirmText: "Restore",
      danger: false,
    });

    if (!ok) return;

    try {
      await client.patch(`/students/${student.id}/status`, {
        student: {
          status: "active",
        },
      });

      notify({
        type: "success",
        message: `${student.name} has been restored.`,
      });

      loadStudents(gradeId, statusFilter);
    } catch (err) {
      notify({
        type: "error",
        message:
          err.response?.data?.error ||
          "Could not restore student.",
      });
    }
  }

  async function handlePermanentDelete(student) {
    const ok = await confirm({
      title: `Permanently delete ${student.name}?`,
      message:
        "This will permanently remove the student and their marks, attendance, interventions, documents, guardianship links, profile and history. This action cannot be undone.",
      confirmText: "Permanently Delete",
      danger: true,
    });

    if (!ok) return;

    try {
      await client.delete(`/students/${student.id}`);

      notify({
        type: "success",
        message: `${student.name} was permanently deleted.`,
      });

      loadStudents(gradeId, statusFilter);
    } catch (err) {
      notify({
        type: "error",
        message:
          err.response?.data?.error ||
          "Could not permanently delete student.",
      });
    }
  }

  async function handleTemplateDownload() {
    await downloadFile(
      "/students/template",
      "student_upload_template.xlsx"
    );
  }

  async function handleUpload(e) {
    const file = e.target.files[0];

    if (!file) return;

    if (!gradeId) {
      notify({
        type: "error",
        message: "Please select a grade first.",
      });

      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setUploadResult(null);

    try {
      const { data } = await client.post(
        `/grades/${gradeId}/students/bulk_upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadResult(data);

      notify({
        type: data.errors.length ? "error" : "success",
        message: `Uploaded: ${data.created.length} created, ${data.errors.length} skipped.`,
      });

      loadStudents(gradeId, statusFilter);
    } catch (err) {
      const message =
        err.response?.data?.error || "Upload failed";

      setUploadResult({
        error: message,
      });

      notify({
        type: "error",
        message,
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="mb-5">
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--color-navy)" }}
        >
          Students
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Manage students, records and student lifecycle.
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Grade
          </label>

          <select
            value={gradeId}
            onChange={(e) => setGradeId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">Select a grade...</option>

            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Student Status
          </label>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            {STATUS_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Search Student
          </label>

          <div className="relative">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name or admission number..."
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {gradeId && (
        <>
          {/* Tools */}
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
            <button
              type="button"
              onClick={handleTemplateDownload}
              className="underline"
              style={{ color: "var(--color-gold)" }}
            >
              Download Excel Template
            </button>

            <label
              className="underline cursor-pointer"
              style={{ color: "var(--color-gold)" }}
            >
              {uploading
                ? "Uploading..."
                : "Upload Students (.xlsx/.csv)"}

              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Upload errors */}
          {uploadResult &&
            !uploadResult.error &&
            uploadResult.errors?.length > 0 && (
              <div className="mb-6 text-sm rounded-md border border-slate-200 p-3">
                <ul className="space-y-1 text-red-600 text-xs">
                  {uploadResult.errors.map((e, i) => (
                    <li key={i}>
                      Row {e.row} (
                      {e.admission_number ||
                        "no adm. no."}
                      ): {e.errors.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Add student */}
          {statusFilter === "active" && (
            <form
              onSubmit={handleCreate}
              className="mb-6 border border-slate-200 rounded-lg p-4 space-y-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  required
                  placeholder="Student name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />

                <input
                  required
                  placeholder="Admission No."
                  value={form.admission_number}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      admission_number: e.target.value,
                    })
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <p className="text-xs text-slate-400 pt-1">
                Guardian contact (optional)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  placeholder="Guardian name"
                  value={form.guardian_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      guardian_name: e.target.value,
                    })
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />

                <input
                  placeholder="Guardian phone"
                  value={form.guardian_phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      guardian_phone: e.target.value,
                    })
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />

                <input
                  placeholder="Relationship (e.g. Mother)"
                  value={form.guardian_relationship}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      guardian_relationship: e.target.value,
                    })
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <button
                className="rounded-md px-4 py-2 text-sm font-medium text-white"
                style={{
                  backgroundColor: "var(--color-navy)",
                }}
              >
                Add Student
              </button>
            </form>
          )}

          {error && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {/* Student count */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2
                className="font-medium text-sm"
                style={{ color: "var(--color-navy)" }}
              >
                {STATUS_LABELS[statusFilter] || "Students"}
              </h2>

              <p className="text-xs text-slate-400">
                {searchTerm
                  ? `${filteredStudents.length} matching student${
                      filteredStudents.length === 1
                        ? ""
                        : "s"
                    }`
                  : `${students.length} student${
                      students.length === 1 ? "" : "s"
                    }`}
              </p>
            </div>
          </div>

          {/* Student table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 text-left">
                <tr>
                  <th className="px-3 py-2">Adm No</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Guardian</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-slate-100"
                  >
                    {editingId === s.id ? (
                      <>
                        <td className="px-3 py-2">
                          <input
                            value={editForm.admission_number}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                admission_number:
                                  e.target.value,
                              })
                            }
                            className="rounded border border-slate-300 px-2 py-1 w-full"
                          />
                        </td>

                        <td className="px-3 py-2">
                          <input
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                name: e.target.value,
                              })
                            }
                            className="rounded border border-slate-300 px-2 py-1 w-full"
                          />
                        </td>

                        <td className="px-3 py-2 space-y-1">
                          <input
                            placeholder="Guardian name"
                            value={editForm.guardian_name}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                guardian_name:
                                  e.target.value,
                              })
                            }
                            className="rounded border border-slate-300 px-2 py-1 w-full"
                          />

                          <input
                            placeholder="Relationship"
                            value={
                              editForm.guardian_relationship
                            }
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                guardian_relationship:
                                  e.target.value,
                              })
                            }
                            className="rounded border border-slate-300 px-2 py-1 w-full"
                          />
                        </td>

                        <td className="px-3 py-2">
                          <input
                            placeholder="Phone"
                            value={editForm.guardian_phone}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                guardian_phone:
                                  e.target.value,
                              })
                            }
                            className="rounded border border-slate-300 px-2 py-1 w-full"
                          />
                        </td>

                        <td className="px-3 py-2">
                          <span className="text-xs text-slate-500">
                            {STATUS_LABELS[s.status] ||
                              s.status}
                          </span>
                        </td>

                        <td className="px-3 py-2 space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => saveEdit(s.id)}
                            className="underline"
                            style={{
                              color: "var(--color-gold)",
                            }}
                          >
                            Save
                          </button>

                          <button
                            onClick={() => setEditingId(null)}
                            className="underline text-slate-500"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-slate-500">
                          {s.admission_number}
                        </td>

                        <td className="px-3 py-2 font-medium">
                          {s.name}
                        </td>

                        <td className="px-3 py-2 text-xs text-slate-500">
                          {s.guardian_name
                            ? `${s.guardian_name}${
                                s.guardian_relationship
                                  ? ` (${s.guardian_relationship})`
                                  : ""
                              }`
                            : "—"}
                        </td>

                        <td className="px-3 py-2 text-xs text-slate-500">
                          {s.guardian_phone || "—"}
                        </td>

                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${
                              s.status === "active"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : s.status === "archived"
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {STATUS_LABELS[s.status] ||
                              s.status}
                          </span>
                        </td>

                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <Link
                              to={`/students/${s.id}`}
                              className="underline"
                              style={{
                                color:
                                  "var(--color-navy)",
                              }}
                            >
                              Records
                            </Link>

                            <button
                              onClick={() => startEdit(s)}
                              className="underline text-slate-500"
                            >
                              Edit
                            </button>

                            {s.status === "active" && (
                              <button
                                onClick={() =>
                                  handleArchive(s)
                                }
                                className="underline text-amber-600"
                              >
                                Archive
                              </button>
                            )}

                            {s.status === "archived" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleRestore(s)
                                  }
                                  className="underline text-green-700"
                                >
                                  Restore
                                </button>

                                <button
                                  onClick={() =>
                                    handlePermanentDelete(
                                      s
                                    )
                                  }
                                  className="underline text-red-600"
                                >
                                  Permanently Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-8 text-center text-sm text-slate-400"
                    >
                      {searchTerm
                        ? `No students found matching "${searchTerm}".`
                        : `No ${
                            STATUS_LABELS[
                              statusFilter
                            ]?.toLowerCase() || ""
                          } students found in this grade.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}