import { STUDENT_DETAIL_TABS } from "../config/tabs";
import { getTabCount } from "../utils/studentDetails";

export default function StudentTabs({
  activeTab,
  onTabChange,
  studentData,
}) {
  return (
    <div className="mb-6 overflow-x-auto border-b border-slate-200">
      <div className="flex min-w-max gap-6">
        {STUDENT_DETAIL_TABS.map((tab) => {
          const count = getTabCount(tab.id, studentData);
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-2 pb-3 text-sm font-medium transition ${
                isActive
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}

              {count !== null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    isActive
                      ? "bg-slate-100 text-slate-700"
                      : "bg-slate-50 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              )}

              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-slate-900" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
