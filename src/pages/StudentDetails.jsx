import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import client from "../api/client";

import StudentProfile from "../components/students/StudentProfile";
import StudentGuardians from "../components/students/StudentGuardians";
import StudentDocuments from "../components/students/StudentDocuments";
import StudentHistory from "../components/students/StudentHistory";

import StudentHeader from "./StudentDetails/components/StudentHeader";
import QuickSummary from "./StudentDetails/components/QuickSummary";
import StudentTabs from "./StudentDetails/components/StudentTabs";
import ChangeStatusModal from "./StudentDetails/components/ChangeStatusModal";
import OverviewTab from "./StudentDetails/components/OverviewTab";
import StudentDetailsSkeleton from "./StudentDetails/components/StudentDetailsSkeleton";

export default function StudentDetails() {
  const { id } = useParams();

  const [studentData, setStudentData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);

  const loadStudent = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const { data } = await client.get(
          `/students/${id}/overview`
        );

        setStudentData(data);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Could not load student records."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  const refreshStudent = useCallback(async () => {
    await loadStudent({ refresh: true });
  }, [loadStudent]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <StudentDetailsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <StudentDetailsError
        error={error}
        onRetry={() => loadStudent()}
      />
    );
  }

  if (!studentData?.student) {
    return <StudentNotFound />;
  }

  const { student } = studentData;
  const guardians = studentData.guardians || [];
  const documents = studentData.documents || [];
  const history = studentData.history || [];

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <Link
        to="/students"
        className="mb-5 inline-flex text-sm text-slate-500 hover:text-slate-700"
      >
        ← Back to Students
      </Link>

      <StudentHeader
        student={student}
        profile={studentData.profile}
        refreshing={refreshing}
        onRefresh={refreshStudent}
        onChangeStatus={() => setShowStatusModal(true)}
      />

      <QuickSummary
        guardians={guardians}
        documents={documents}
        history={history}
        profile={studentData.profile}
      />

      <StudentTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        studentData={studentData}
      />

      <StudentTabContent
        activeTab={activeTab}
        studentId={id}
        studentData={studentData}
        guardians={guardians}
        documents={documents}
        history={history}
        onTabChange={setActiveTab}
        onUpdated={refreshStudent}
      />

      {showStatusModal && (
        <ChangeStatusModal
          student={student}
          onClose={() => setShowStatusModal(false)}
          onUpdated={refreshStudent}
        />
      )}
    </div>
  );
}

function StudentTabContent({
  activeTab,
  studentId,
  studentData,
  guardians,
  documents,
  history,
  onTabChange,
  onUpdated,
}) {
  switch (activeTab) {
    case "overview":
      return (
        <OverviewTab
          studentData={studentData}
          onTabChange={onTabChange}
        />
      );

    case "profile":
      return (
        <StudentProfile
          studentId={studentId}
          profile={studentData.profile}
          onUpdated={onUpdated}
        />
      );

    case "guardians":
      return (
        <StudentGuardians
          studentId={studentId}
          guardians={guardians}
          onUpdated={onUpdated}
        />
      );

    case "documents":
      return (
        <StudentDocuments
          studentId={studentId}
          documents={documents}
          onUpdated={onUpdated}
        />
      );

    case "history":
      return (
        <StudentHistory
          studentId={studentId}
          history={history}
          onUpdated={onUpdated}
        />
      );

    default:
      return null;
  }
}

function StudentDetailsError({ error, onRetry }) {
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <Link
        to="/students"
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ← Back to Students
      </Link>

      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="font-semibold text-red-800">
          Unable to load student
        </h2>

        <p className="mt-1 text-sm text-red-700">
          {error}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function StudentNotFound() {
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <Link
        to="/students"
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ← Back to Students
      </Link>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="font-semibold text-slate-800">
          Student not found
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          This student record could not be found.
        </p>
      </div>
    </div>
  );
}