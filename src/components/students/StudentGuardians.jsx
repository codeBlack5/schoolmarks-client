import { useState } from "react";
import client from "../../api/client";
import { useAlert } from "../../context/AlertContext";

const emptyGuardian = {
  name: "",
  phone: "",
  alternative_phone: "",
  email: "",
  occupation: "",
  address: "",
  relationship: "",
  is_primary: false,
  receives_sms: true,
  receives_email: true,
};

export default function StudentGuardians({
  studentId,
  guardians = [],
  onUpdated,
}) {
  const { confirm, notify } = useAlert();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyGuardian);
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function openCreateForm() {
    setEditingId(null);
    setForm({ ...emptyGuardian });
    setShowForm(true);
  }

  function openEditForm(guardian) {
    setEditingId(guardian.id);

    setForm({
      name: guardian.name || "",
      phone: guardian.phone || "",
      alternative_phone: guardian.alternative_phone || "",
      email: guardian.email || "",
      occupation: guardian.occupation || "",
      address: guardian.address || "",
      relationship: guardian.relationship || "",
      is_primary: Boolean(guardian.is_primary),
      receives_sms: guardian.receives_sms !== false,
      receives_email: guardian.receives_email !== false,
    });

    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyGuardian });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        await client.patch(
          `/students/${studentId}/guardians/${editingId}`,
          {
            student_guardian: {
              relationship: form.relationship,
              is_primary: form.is_primary,
              receives_sms: form.receives_sms,
              receives_email: form.receives_email,
            },
          }
        );

        notify({
          type: "success",
          message: "Guardian relationship updated.",
        });
      } else {
        await client.post(`/students/${studentId}/guardians`, {
          guardian: {
            name: form.name,
            phone: form.phone,
            alternative_phone: form.alternative_phone,
            email: form.email,
            occupation: form.occupation,
            address: form.address,
          },
          student_guardian: {
            relationship: form.relationship,
            is_primary: form.is_primary,
            receives_sms: form.receives_sms,
            receives_email: form.receives_email,
          },
        });

        notify({
          type: "success",
          message: "Guardian added successfully.",
        });
      }

      closeForm();

      if (onUpdated) {
        await onUpdated();
      }
    } catch (err) {
      const message =
        err.response?.data?.errors?.join(", ") ||
        err.response?.data?.error ||
        "Could not save guardian.";

      notify({
        type: "error",
        message,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(guardian) {
    const ok = await confirm({
      title: "Remove this guardian?",
      message: `${guardian.name} will be removed from this student's guardian list.`,
      confirmText: "Remove",
      danger: true,
    });

    if (!ok) {
      return;
    }

    try {
      await client.delete(
        `/students/${studentId}/guardians/${guardian.id}`
      );

      notify({
        type: "success",
        message: "Guardian removed.",
      });

      if (onUpdated) {
        await onUpdated();
      }
    } catch (err) {
      const message =
        err.response?.data?.error ||
        "Could not remove guardian.";

      notify({
        type: "error",
        message,
      });
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--color-navy)" }}
            >
              Guardians
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage the people responsible for this student.
            </p>
          </div>

          {!showForm && (
            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-navy)" }}
            >
              Add Guardian
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <GuardianForm
          form={form}
          editing={Boolean(editingId)}
          saving={saving}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      )}

      {guardians.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            No guardians have been added for this student.
          </p>

          {!showForm && (
            <button
              type="button"
              onClick={openCreateForm}
              className="mt-4 text-sm font-medium underline"
              style={{ color: "var(--color-navy)" }}
            >
              Add the first guardian
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {guardians.map((guardian) => (
            <GuardianCard
              key={guardian.id}
              guardian={guardian}
              onEdit={() => openEditForm(guardian)}
              onDelete={() => handleDelete(guardian)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GuardianCard({ guardian, onEdit, onDelete }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--color-navy)" }}
            >
              {guardian.name || "Unnamed Guardian"}
            </h3>

            {guardian.is_primary && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                Primary
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {guardian.relationship || "Relationship not specified"}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoItem label="Phone" value={guardian.phone} />

        <InfoItem
          label="Alternative Phone"
          value={guardian.alternative_phone}
        />

        <InfoItem label="Email" value={guardian.email} />

        <InfoItem label="Occupation" value={guardian.occupation} />

        <div className="sm:col-span-2">
          <InfoItem label="Address" value={guardian.address} />
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          Notifications
        </p>

        <div className="flex flex-wrap gap-2">
          <NotificationBadge
            label="SMS"
            enabled={guardian.receives_sms}
          />

          <NotificationBadge
            label="Email"
            enabled={guardian.receives_email}
          />
        </div>
      </div>
    </div>
  );
}

function GuardianForm({
  form,
  editing,
  saving,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="mb-6">
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--color-navy)" }}
        >
          {editing ? "Edit Guardian" : "Add Guardian"}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {editing
            ? "Update this guardian's relationship and notification settings."
            : "Add a guardian and their contact information for this student."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {!editing && (
          <>
            <Field
              label="Full Name"
              name="name"
              value={form.name}
              onChange={onChange}
              required
              placeholder="e.g. Mary Chebet"
            />

            <Field
              label="Phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={onChange}
              placeholder="e.g. 0712345678"
            />

            <Field
              label="Alternative Phone"
              name="alternative_phone"
              type="tel"
              value={form.alternative_phone}
              onChange={onChange}
              placeholder="Alternative contact number"
            />

            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="e.g. parent@example.com"
            />

            <Field
              label="Occupation"
              name="occupation"
              value={form.occupation}
              onChange={onChange}
              placeholder="e.g. Teacher"
            />

            <Field
              label="Address"
              name="address"
              value={form.address}
              onChange={onChange}
              placeholder="Home address"
            />
          </>
        )}

        <SelectField
          label="Relationship"
          name="relationship"
          value={form.relationship}
          onChange={onChange}
          options={[
            { value: "Mother", label: "Mother" },
            { value: "Father", label: "Father" },
            { value: "Guardian", label: "Guardian" },
            { value: "Grandmother", label: "Grandmother" },
            { value: "Grandfather", label: "Grandfather" },
            { value: "Aunt", label: "Aunt" },
            { value: "Uncle", label: "Uncle" },
            { value: "Sibling", label: "Sibling" },
            { value: "Other", label: "Other" },
          ]}
          required
        />
      </div>

      <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
        <CheckboxField
          name="is_primary"
          checked={form.is_primary}
          onChange={onChange}
          label="Primary guardian"
          description="Use this guardian as the main contact for the student."
        />

        <CheckboxField
          name="receives_sms"
          checked={form.receives_sms}
          onChange={onChange}
          label="Receives SMS"
          description="Allow school SMS notifications to this guardian."
        />

        <CheckboxField
          name="receives_email"
          checked={form.receives_email}
          onChange={onChange}
          label="Receives email"
          description="Allow school email notifications to this guardian."
        />
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--color-navy)" }}
        >
          {saving
            ? "Saving..."
            : editing
              ? "Save Changes"
              : "Add Guardian"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]"
      >
        <option value="">Select relationship</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({
  name,
  checked,
  onChange,
  label,
  description,
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 rounded border-slate-300"
      />

      <span>
        <span className="block text-sm font-medium text-slate-700">
          {label}
        </span>

        <span className="mt-0.5 block text-xs text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
        {value || "—"}
      </p>
    </div>
  );
}

function NotificationBadge({ label, enabled }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        enabled
          ? "bg-green-50 text-green-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {label}: {enabled ? "Enabled" : "Disabled"}
    </span>
  );
}

