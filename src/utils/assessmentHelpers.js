// Returns Tailwind classes for each term header
export function getTermColor(term = "") {
  const value = term.toLowerCase();

  if (value.includes("term 1")) {
    return "bg-blue-50 border-blue-200 text-blue-900";
  }

  if (value.includes("term 2")) {
    return "bg-green-50 border-green-200 text-green-900";
  }

  if (value.includes("term 3")) {
    return "bg-purple-50 border-purple-200 text-purple-900";
  }

  return "bg-slate-50 border-slate-200 text-slate-900";
}

// Badge metadata (presentation-independent)
export function getMarkingStatus(marking) {
  if (!marking) {
    return {
      label: "Unknown",
      className: "bg-slate-100 text-slate-700",
    };
  }

  if (marking.complete) {
    return {
      label: "Complete",
      className: "bg-green-100 text-green-700",
    };
  }

  if (marking.submitted === 0) {
    return {
      label: "Not Started",
      className: "bg-red-100 text-red-700",
    };
  }

  return {
    label: `${marking.submitted}/${marking.total_students}`,
    className: "bg-yellow-100 text-yellow-700",
  };
}

// Progress percentage
export function getCompletionPercentage(marking) {
  if (!marking || !marking.total_students) return 0;

  return Math.round(
    (marking.submitted / marking.total_students) * 100
  );
}

// Group assessments by Grade → Term
export function groupAssessments(assessments) {
  return assessments.reduce((groups, assessment) => {
    const grade =
      assessment.subject?.grade?.name || "Unknown Grade";

    const term =
      assessment.term?.name || "Unknown Term";

    if (!groups[grade]) {
      groups[grade] = {};
    }

    if (!groups[grade][term]) {
      groups[grade][term] = [];
    }

    groups[grade][term].push(assessment);

    return groups;
  }, {});
}

// Dashboard statistics
export function calculateStatistics(assessments) {
  const total = assessments.length;

  const completed = assessments.filter(
    (a) => a.marking?.complete
  ).length;

  const inProgress = assessments.filter(
    (a) =>
      a.marking &&
      !a.marking.complete &&
      a.marking.submitted > 0
  ).length;

  const notStarted = assessments.filter(
    (a) => !a.marking || a.marking.submitted === 0
  ).length;

  return {
    total,
    completed,
    inProgress,
    notStarted,
  };
}

