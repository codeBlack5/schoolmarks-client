
import { useEffect, useState } from "react";
import client from "../../api/client";
import { useAlert } from "../../context/AlertContext";

const emptyProfile = {
  date_of_birth: "",
  gender: "",
  admission_date: "",
  birth_place: "",
  nationality: "",
  home_language: "",
  county: "",
  sub_county: "",
  address: "",
  special_needs: false,
  special_needs_details: "",
  notes: "",
};

export default function StudentProfile({
  studentId,
  profile,
  onUpdated,
}) {
  const { notify } = useAlert();

  const [form, setForm] = useState(emptyProfile);
  const [editing, setEditing] = useState(!profile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        date_of_birth: profile.date_of_birth || "",
        gender: profile.gender || "",
        admission_date: profile.admission_date || "",
        birth_place: profile.birth_place || "",
        nationality: profile.nationality || "",
        home_language: profile.home_language || "",
        county: profile.county || "",
        sub_county: profile.sub_county || "",
        address: profile.address || "",
        special_needs: Boolean(profile.special_needs),
        special_needs_details: profile.special_needs_details || "",
        notes: profile.notes || "",
      });

      setEditing(false);
    } else {
      setForm({ ...emptyProfile });
      setEditing(true);
    }
  }, [profile]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function cancelEdit() {
    if (!profile) {
      return;
    }

    setForm({
      date_of_birth: profile.date_of_birth || "",
      gender: profile.gender || "",
      admission_date: profile.admission_date || "",
      birth_place: profile.birth_place || "",
      nationality: profile.nationality || "",
      home_language: profile.home_language || "",
      county: profile.county || "",
      sub_county: profile.sub_county || "",
      address: profile.address || "",
      special_needs: Boolean(profile.special_needs),
      special_needs_details: profile.special_needs_details || "",
      notes: profile.notes || "",
    });

    setEditing(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        student_profile: form,
      };

      if (profile) {
        await client.patch(`/students/${studentId}/profile`, payload);

        notify({
          type: "success",
          message: "Student profile updated.",
        });
      } else {
        await client.post(`/students/${studentId}/profile`, payload);

        notify({
          type: "success",
          message: "Student profile created.",
        });
      }

      setEditing(false);

      if (onUpdated) {
        await onUpdated();
      }
    } catch (err) {
      const message =
        err.response?.data?.errors?.join(", ") ||
        err.response?.data?.error ||
        "Could not save student profile.";

      notify({
        type: "error",
        message,
      });
    } finally {
      setSaving(false);
    }
  }

  if (!editing && profile) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--color-navy)" }}
            >
              Student Profile
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Personal and background information.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-navy)" }}
          >
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label="Date of Birth"
            value={profile.date_of_birth}
          />

          <InfoItem label="Gender" value={profile.gender} />

          <InfoItem
            label="Admission Date"
            value={profile.admission_date}
          />

          <InfoItem
            label="Birth Place"
            value={profile.birth_place}
          />

          <InfoItem
            label="Nationality"
            value={profile.nationality}
          />

          <InfoItem
            label="Home Language"
            value={profile.home_language}
          />

          <InfoItem label="County" value={profile.county} />

          <InfoItem
            label="Sub County"
            value={profile.sub_county}
          />

          <InfoItem label="Address" value={profile.address} />

          <InfoItem
            label="Special Needs"
            value={profile.special_needs ? "Yes" : "No"}
          />

          {profile.special_needs && (
            <InfoItem
              label="Special Needs Details"
              value={profile.special_needs_details}
            />
          )}

          <div className="sm:col-span-2 lg:col-span-3">
            <InfoItem label="Notes" value={profile.notes} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="mb-6">
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--color-navy)" }}
        >
          {profile ? "Edit Student Profile" : "Create Student Profile"}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Add the student's personal and background information.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="Date of Birth"
          name="date_of_birth"
          type="date"
          value={form.date_of_birth}
          onChange={handleChange}
        />

        <SelectField
          label="Gender"
          name="gender"
          value={form.gender}
          onChange={handleChange}
          options={[
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" },
            { value: "Other", label: "Other" },
          ]}
        />

        <Field
          label="Admission Date"
          name="admission_date"
          type="date"
          value={form.admission_date}
          onChange={handleChange}
        />

        <Field
          label="Birth Place"
          name="birth_place"
          value={form.birth_place}
          onChange={handleChange}
          placeholder="e.g. Nairobi"
        />

        <Field
          label="Nationality"
          name="nationality"
          value={form.nationality}
          onChange={handleChange}
          placeholder="e.g. Kenyan"
        />

        <Field
          label="Home Language"
          name="home_language"
          value={form.home_language}
          onChange={handleChange}
          placeholder="e.g. Kalenjin"
        />

        <Field
          label="County"
          name="county"
          value={form.county}
          onChange={handleChange}
          placeholder="e.g. Uasin Gishu"
        />

        <Field
          label="Sub County"
          name="sub_county"
          value={form.sub_county}
          onChange={handleChange}
          placeholder="e.g. Kesses"
        />

        <Field
          label="Address"
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Home address"
        />

        <div className="sm:col-span-2 lg:col-span-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="special_needs"
              checked={form.special_needs}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300"
            />

            <span className="text-sm font-medium text-slate-700">
              Student has special needs
            </span>
          </label>
        </div>

        {form.special_needs && (
          <div className="sm:col-span-2 lg:col-span-3">
            <label
              htmlFor="special_needs_details"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Special Needs Details
            </label>

            <textarea
              id="special_needs_details"
              name="special_needs_details"
              value={form.special_needs_details}
              onChange={handleChange}
              rows={3}
              placeholder="Describe the student's special needs..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]"
            />
          </div>
        )}

        <div className="sm:col-span-2 lg:col-span-3">
          <label
            htmlFor="notes"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Notes
          </label>

          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={4}
            placeholder="Additional information about the student..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
        {profile && (
          <button
            type="button"
            onClick={cancelEdit}
            disabled={saving}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--color-navy)" }}
        >
          {saving
            ? "Saving..."
            : profile
              ? "Save Changes"
              : "Create Profile"}
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
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
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
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]"
      >
        <option value="">Select gender</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
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