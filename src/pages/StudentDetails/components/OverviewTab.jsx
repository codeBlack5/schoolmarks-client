import { STATUS_CONFIG } from "../config/lifecycle";
import { formatDate } from "../utils/studentDetails";

export default function OverviewTab({
  studentData,
  onTabChange,
}) {
  const {
    student,
    profile,
    guardians = [],
    documents = [],
    history = [],
  } = studentData;

  const primaryGuardian =
    guardians.find((guardian) => guardian.is_primary) ||
    guardians[0];

  return (
    <div className="space-y-5">
      <Section
        title="Basic Information"
        action={
          <button
            type="button"
            onClick={() => onTabChange("profile")}
            className="text-sm font-medium text-[var(--color-navy)] hover:underline"
          >
            View Profile →
          </button>
        }
      >
        <InfoGrid>
          <InfoItem label="Name" value={student.name} />

          <InfoItem
            label="Admission Number"
            value={student.admission_number}
          />

          <InfoItem
            label="Grade"
            value={student.grade?.name}
          />

          <InfoItem
            label="Status"
            value={
              STATUS_CONFIG[
                String(student.status || "active").toLowerCase()
              ]?.label
            }
          />

          <InfoItem
            label="Student ID"
            value={student.id}
          />

          <InfoItem
            label="Admission Date"
            value={
              profile?.admission_date ||
              student.admission_date
            }
            date
          />
        </InfoGrid>
      </Section>

      <Section
        title="Profile"
        action={
          <button
            type="button"
            onClick={() => onTabChange("profile")}
            className="text-sm font-medium text-[var(--color-navy)] hover:underline"
          >
            {profile
              ? "Edit Profile →"
              : "Create Profile →"}
          </button>
        }
      >
        {profile ? (
          <InfoGrid>
            <InfoItem
              label="Date of Birth"
              value={profile.date_of_birth}
              date
            />

            <InfoItem
              label="Gender"
              value={profile.gender}
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

            <InfoItem
              label="County"
              value={profile.county}
            />

            <InfoItem
              label="Sub County"
              value={profile.sub_county}
            />

            <InfoItem
              label="Address"
              value={profile.address}
            />

            <InfoItem
              label="Special Needs"
              value={
                profile.special_needs
                  ? "Yes"
                  : "No"
              }
            />
          </InfoGrid>
        ) : (
          <EmptyState
            title="No student profile"
            message="Add the student's personal and demographic information."
            actionLabel="Create Profile"
            onAction={() => onTabChange("profile")}
          />
        )}
      </Section>

      <Section
        title="Primary Guardian"
        action={
          <button
            type="button"
            onClick={() => onTabChange("guardians")}
            className="text-sm font-medium text-[var(--color-navy)] hover:underline"
          >
            Manage Guardians →
          </button>
        }
      >
        {primaryGuardian ? (
          <InfoGrid>
            <InfoItem
              label="Name"
              value={primaryGuardian.name}
            />

            <InfoItem
              label="Relationship"
              value={primaryGuardian.relationship}
            />

            <InfoItem
              label="Phone"
              value={primaryGuardian.phone}
            />

            <InfoItem
              label="Alternative Phone"
              value={
                primaryGuardian.alternative_phone
              }
            />

            <InfoItem
              label="Email"
              value={primaryGuardian.email}
            />

            <InfoItem
              label="Occupation"
              value={primaryGuardian.occupation}
            />
          </InfoGrid>
        ) : (
          <EmptyState
            title="No guardian added"
            message="Add a guardian to maintain the student's emergency and communication contacts."
            actionLabel="Add Guardian"
            onAction={() => onTabChange("guardians")}
          />
        )}
      </Section>

      <Section title="Student Records">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <RecordCard
            label="Guardians"
            value={guardians.length}
            description="Student guardians"
            onClick={() =>
              onTabChange("guardians")
            }
          />

          <RecordCard
            label="Documents"
            value={documents.length}
            description="Student documents"
            onClick={() =>
              onTabChange("documents")
            }
          />

          <RecordCard
            label="History"
            value={history.length}
            description="Recorded events"
            onClick={() =>
              onTabChange("history")
            }
          />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-800">
          {title}
        </h2>

        {action}
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

function InfoGrid({ children }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

function InfoItem({ label, value, date = false }) {
  let displayValue = value;

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    displayValue = "—";
  } else if (date) {
    displayValue = formatDate(value);
  }

  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>

      <dd className="mt-1 text-sm font-medium text-slate-700">
        {displayValue}
      </dd>
    </div>
  );
}

function RecordCard({
  label,
  value,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
    >
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-2 text-2xl font-semibold text-slate-900">
        {value}
      </div>

      <div className="mt-1 text-xs text-slate-500">
        {description}
      </div>
    </button>
  );
}

function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <h3 className="text-sm font-semibold text-slate-700">
        {title}
      </h3>

      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        {message}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-lg bg-[var(--color-navy)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}