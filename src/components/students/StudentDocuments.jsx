import { useRef, useState } from "react";
import { useAlert } from "../../context/AlertContext";
import client from "../../api/client";

const DOCUMENT_TYPES = [
  "Birth Certificate",
  "National ID",
  "Transfer Certificate",
  "Medical Record",
  "Passport Photo",
  "Academic Certificate",
  "Report Card",
  "Other",
];

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatFileSize(bytes) {
  if (!bytes) return "";

  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, index);

  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function StudentDocuments({
  studentId,
  documents = [],
  onUpdated,
}) {
  const { confirm,notify } = useAlert();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    document_type: "",
    title: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setSelectedFile(file);
    setError("");

    // Automatically use the filename as the title when the title is empty.
    if (file && !form.title.trim()) {
      const filenameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");

      setForm((current) => ({
        ...current,
        title: filenameWithoutExtension,
      }));
    }
  };

  const resetForm = () => {
    setForm({
      document_type: "",
      title: "",
    });

    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.document_type) {
        setError("Please select a document type.");
        return;
    }

    if (!form.title.trim()) {
        setError("Please enter a document title.");
        return;
    }

    if (!selectedFile) {
        setError("Please select a file.");
        return;
    }

    const formData = new FormData();

    formData.append(
        "student_document[document_type]",
        form.document_type
    );

    formData.append(
        "student_document[title]",
        form.title.trim()
    );

    formData.append(
        "student_document[file]",
        selectedFile
    );

    setUploading(true);

    try {
        // The actual upload
        await client.post(
        `/students/${studentId}/documents`,
        formData,
        {
            headers: {
            "Content-Type": "multipart/form-data",
            },
        }
        );

        // The upload succeeded.
        notify("Document uploaded successfully.", "success");

        resetForm();

        // Refresh the document list separately.
        // A refresh failure should NOT make the upload look like it failed.
        if (onUpdated) {
        try {
            await onUpdated();
        } catch (refreshError) {
            console.error(
            "Document uploaded, but student data could not be refreshed:",
            refreshError
            );
        }
        }
    } catch (err) {
        console.error("Document upload failed:", err);

        const message =
        err.response?.data?.error ||
        err.response?.data?.errors?.join(", ") ||
        "Could not upload the document.";

        setError(message);
        notify(message, "error");
    } finally {
        setUploading(false);
    }
    };

    const handleDelete = async (documentId) => {
        const confirmed = await confirm({
            title: "Delete document?",
            message:
            "This document will be permanently removed from the student's records. This action cannot be undone.",
            confirmText: "Yes, delete it",
            cancelText: "Keep document",
            danger: true,
        });

        if (!confirmed) return;

        setError("");
        setDeletingId(documentId);

        try {
            await client.delete(
            `/students/${studentId}/documents/${documentId}`
            );

            notify({
            type: "success",
            message: "The document was deleted successfully.",
            });

            if (onUpdated) {
            await onUpdated();
            }
        } catch (err) {
            console.error("Document deletion failed:", err);

            const message =
            err.response?.data?.error ||
            "Could not delete the document.";

            setError(message);

            notify({
            type: "error",
            message,
            });
        } finally {
            setDeletingId(null);
        }
    };



  return (
    <div className="space-y-6">
      {/* Upload form */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Student Documents
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload and manage important student records.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Document type */}
            <div>
              <label
                htmlFor="document_type"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Document type
              </label>

              <select
                id="document_type"
                name="document_type"
                value={form.document_type}
                onChange={handleChange}
                disabled={uploading}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              >
                <option value="">Select document type</option>

                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Document title */}
            <div>
              <label
                htmlFor="document_title"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Document title
              </label>

              <input
                id="document_title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Birth Certificate"
                disabled={uploading}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* File picker */}
          <div>
            <label
              htmlFor="document_file"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              File
            </label>

            <input
              ref={fileInputRef}
              id="document_file"
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-white text-sm text-gray-600 file:mr-4 file:border-0 file:bg-gray-100 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />

            {selectedFile && (
              <div className="mt-2 text-sm text-gray-500">
                Selected:{" "}
                <span className="font-medium text-gray-700">
                  {selectedFile.name}
                </span>{" "}
                ({formatFileSize(selectedFile.size)})
              </div>
            )}
          </div>

          {/* Upload button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload document"}
            </button>
          </div>
        </form>
      </div>

      {/* Documents list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                Uploaded documents
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {documents.length === 0
                  ? "No documents uploaded yet."
                  : `${documents.length} document${
                      documents.length === 1 ? "" : "s"
                    }`}
              </p>
            </div>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-6 w-6 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 18h10a4 4 0 0 0 .88-7.902A5.5 5.5 0 0 0 7.5 8.5 4.5 4.5 0 0 0 7 18Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 12v6m0-6-2.5 2.5M12 12l2.5 2.5"
                />
              </svg>
            </div>

            <p className="text-sm font-medium text-gray-700">
              No documents yet
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Upload the student's first document using the form above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <svg
                      className="h-5 w-5 text-blue-600"
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 2v5h5"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 13h8M8 17h5"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <h4 className="truncate font-medium text-gray-900">
                      {document.title}
                    </h4>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                      <span>{document.document_type}</span>

                      <span>•</span>

                      <span className="truncate">
                        {document.file_name || "File"}
                      </span>

                      <span>•</span>

                      <span>
                        {formatDate(
                          document.created_at || document.uploaded_at
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {document.file_url && (
                    <a
                      href={document.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      Open
                    </a>
                  )}

                  {document.file_url && (
                    <a
                      href={document.file_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      Download
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(document.id)}
                    disabled={deletingId === document.id}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === document.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

