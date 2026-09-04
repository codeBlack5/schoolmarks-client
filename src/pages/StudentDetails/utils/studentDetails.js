export function getInitials(name) {
  if (!name) return "?";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function normalizeStatus(status) {
  return String(status || "active").toLowerCase();
}

export function getTabCount(tabId, studentData) {
  switch (tabId) {
    case "guardians":
      return studentData.guardians?.length || 0;

    case "documents":
      return studentData.documents?.length || 0;

    case "history":
      return studentData.history?.length || 0;

    default:
      return null;
  }
}
