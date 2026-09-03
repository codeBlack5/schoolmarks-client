import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import client from "../api/client";
import StudentProfile from "../components/students/StudentProfile";
import StudentGuardians from "../components/students/StudentGuardians";
import StudentDocuments from "../components/students/StudentDocuments";
import StudentHistory from "../components/students/StudentHistory";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "profile", label: "Profile" },
  { id: "guardians", label: "Guardians" },
  { id: "documents", label: "Documents" },
  { id: "history", label: "History" },
];

export default function StudentDetails() {
  const { id } = useParams();

  const [studentData, setStudentData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

    const loadStudent = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
        const { data } = await client.get(`/students/${id}/overview`);
        setStudentData(data);
    } catch (err) {
        setError(
        err.response?.data?.error || "Could not load student records."
        );
    } finally {
        setLoading(false);
    }
    }, [id]);

    useEffect(() => {
    loadStudent();
    }, [loadStudent]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <p className="text-sm text-slate-500">Loading student records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <Link
          to="/students"
          className="text-sm underline text-slate-500"
        >
          ← Back to Students
        </Link>

        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!studentData?.student) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <p className="text-sm text-slate-500">Student not found.</p>
      </div>
    );
  }

  const { student } = studentData;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <Link
        to="/students"
        className="inline-block mb-5 text-sm underline text-slate-500 hover:text-slate-700"
      >
        ← Back to Students
      </Link>

      {/* Student header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-xl font-semibold"
              style={{ color: "var(--color-navy)" }}
            >
              {student.name}
            </h1>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
              <span>
                <strong>Admission:</strong>{" "}
                {student.admission_number}
              </span>

              <span>
                <strong>Grade:</strong>{" "}
                {student.grade?.name || "—"}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Student ID: {student.id}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6 overflow-x-auto">
        <nav className="flex min-w-max gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? "border-[var(--color-navy)] text-[var(--color-navy)]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === "overview" && (
        <OverviewTab studentData={studentData} />
      )}

      {activeTab === "profile" && (
        <StudentProfile
          studentId={id}
          profile={studentData.profile}
          onUpdated={loadStudent}
        />
      )}

      {activeTab === "guardians" && (
        <StudentGuardians
          studentId={id}
          guardians={studentData.guardians || []}
          onUpdated={loadStudent}
        />
      )}

      {activeTab === "documents" && (
        <StudentDocuments
          studentId={id}
          documents={studentData?.documents || []}
          onUpdated={loadStudent}
        />
      )}

      {activeTab === "history" && (
        <StudentHistory
          studentId={id}
          history={studentData?.history || []}
          onUpdated={loadStudent}
        />
      )}
    </div>
  );
}

function OverviewTab({ studentData }) {
  const { profile, guardians, documents, history } = studentData;

  const primaryGuardian =
    guardians?.find((guardian) => guardian.is_primary) ||
    guardians?.[0];

  return (
    <div className="space-y-5">
      {/* Basic information */}
      <Section title="Basic Information">
        <InfoGrid>
          <InfoItem label="Name" value={studentData.student.name} />
          <InfoItem
            label="Admission Number"
            value={studentData.student.admission_number}
          />
          <InfoItem
            label="Grade"
            value={studentData.student.grade?.name}
          />
          <InfoItem
            label="Student ID"
            value={studentData.student.id}
          />
        </InfoGrid>
      </Section>

      {/* Profile summary */}
      <Section title="Profile">
        {profile ? (
          <InfoGrid>
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
          </InfoGrid>
        ) : (
          <p className="text-sm text-slate-500">
            No student profile has been created yet.
          </p>
        )}
      </Section>

      {/* Guardian summary */}
      <Section title="Primary Guardian">
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
              label="Email"
              value={primaryGuardian.email}
            />
          </InfoGrid>
        ) : (
          <p className="text-sm text-slate-500">
            No guardian has been added.
          </p>
        )}
      </Section>

      {/* Record counts */}
      <Section title="Student Records">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <CountCard
            label="Guardians"
            value={guardians?.length || 0}
          />

          <CountCard
            label="Documents"
            value={documents?.length || 0}
          />

          <CountCard
            label="History Events"
            value={history?.length || 0}
          />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2
        className="text-base font-semibold mb-4"
        style={{ color: "var(--color-navy)" }}
      >
        {title}
      </h2>

      {children}
    </section>
  );
}

function InfoGrid({ children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm text-slate-700">
        {value || "—"}
      </p>
    </div>
  );
}

function CountCard({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className="mt-1 text-xl font-semibold"
        style={{ color: "var(--color-navy)" }}
      >
        {value}
      </p>
    </div>
  );
}