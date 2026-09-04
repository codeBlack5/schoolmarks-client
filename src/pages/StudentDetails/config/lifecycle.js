export const STATUS_CONFIG = {
  active: {
    label: "Active",
    badge: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  transferred: {
    label: "Transferred",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  graduated: {
    label: "Graduated",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  withdrawn: {
    label: "Withdrawn",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  archived: {
    label: "Archived",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
};

export const ALLOWED_TRANSITIONS = {
  active: ["transferred", "graduated", "withdrawn", "archived"],
  transferred: ["archived"],
  graduated: ["archived"],
  withdrawn: ["archived"],
  archived: [],
};
