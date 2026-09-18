import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  BookOpen,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";
import client from "../../api/client";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const lessonStatusStyles = {
  draft: "border-yellow-200 bg-yellow-50 text-yellow-800",
  completed: "border-green-200 bg-green-50 text-green-800",
};

const schemeStatusStyles = {
  planned: "bg-slate-100 text-slate-600",
  partially_taught: "bg-yellow-100 text-yellow-700",
  taught: "bg-green-100 text-green-700",
};

export default function TeacherPlanningCalendar() {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [lessonPlans, setLessonPlans] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [schemeEntries, setSchemeEntries] = useState([]);

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [terms, setTerms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [termFilter, setTermFilter] = useState("all");

  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedSchemeEntry, setSelectedSchemeEntry] = useState(null);

  async function loadCalendarData() {
    try {
      setLoading(true);
      setError("");

      const [
        lessonPlansResponse,
        schemesResponse,
        classesResponse,
        subjectsResponse,
        termsResponse,
      ] = await Promise.all([
        client.get("/teacher/lesson_plans"),
        client.get("/teacher/schemes"),
        client.get("/teacher/classes"),
        client.get("/teacher/subjects"),
        client.get("/terms"),
      ]);

      const plans = lessonPlansResponse.data?.data || [];
      const schemeList = schemesResponse.data?.data || [];

      setLessonPlans(plans);
      setSchemes(schemeList);

      setClasses(classesResponse.data?.classes || []);
      setSubjects(subjectsResponse.data?.subjects || []);
      setTerms(termsResponse.data || []);

      /*
       * Scheme index returns summary information.
       * Fetch entries separately because entries contain
       * the actual planning dates.
       */
      const entryResponses = await Promise.all(
        schemeList.map((scheme) =>
          client.get(`/teacher/schemes/${scheme.id}/entries`)
        )
      );

      const entries = entryResponses.flatMap((response, index) => {
        const scheme = schemeList[index];

        return (response.data?.data || []).map((entry) => ({
          ...entry,
          scheme_id: scheme.id,
          grade_id: scheme.grade_id,
          grade_name: scheme.grade_name,
          subject_id: scheme.subject_id,
          subject_name: scheme.subject_name,
          term_id: scheme.term_id,
          term_name: scheme.term_name,
          term_year: scheme.term_year,
          scheme_title: scheme.title,
          scheme_status: scheme.status,
        }));
      });

      setSchemeEntries(entries);
    } catch (err) {
      console.error("Failed to load planning calendar:", err);

      setError(
        err.response?.data?.error ||
          "Unable to load your planning calendar."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCalendarData();
  }, []);

  const filteredLessonPlans = useMemo(() => {
    return lessonPlans.filter((plan) => {
      const matchesClass =
        classFilter === "all" ||
        String(plan.grade_id) === String(classFilter);

      const matchesSubject =
        subjectFilter === "all" ||
        String(plan.subject_id) === String(subjectFilter);

      const matchesTerm =
        termFilter === "all" ||
        String(plan.term_id) === String(termFilter);

      return matchesClass && matchesSubject && matchesTerm;
    });
  }, [
    lessonPlans,
    classFilter,
    subjectFilter,
    termFilter,
  ]);

  const filteredSchemeEntries = useMemo(() => {
    return schemeEntries.filter((entry) => {
      const matchesClass =
        classFilter === "all" ||
        String(entry.grade_id) === String(classFilter);

      const matchesSubject =
        subjectFilter === "all" ||
        String(entry.subject_id) === String(subjectFilter);

      const matchesTerm =
        termFilter === "all" ||
        String(entry.term_id) === String(termFilter);

      return matchesClass && matchesSubject && matchesTerm;
    });
  }, [
    schemeEntries,
    classFilter,
    subjectFilter,
    termFilter,
  ]);

  const calendarDays = useMemo(() => {
    return buildCalendarDays(currentDate);
  }, [currentDate]);

  const monthLabel = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  function goToPreviousMonth() {
    setCurrentDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1
        )
    );
  }

  function goToNextMonth() {
    setCurrentDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1
        )
    );
  }

  function goToToday() {
    const now = new Date();

    setCurrentDate(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      )
    );
  }

  function lessonsForDate(date) {
    const dateKey = toDateKey(date);

    return filteredLessonPlans
      .filter(
        (plan) => plan.lesson_date === dateKey
      )
      .sort(
        (a, b) =>
          (a.lesson_number || 999) -
          (b.lesson_number || 999)
      );
  }

  function schemesForDate(date) {
    const dateKey = toDateKey(date);

    return filteredSchemeEntries.filter((entry) => {
      if (!entry.start_date && !entry.end_date) {
        return false;
      }

      const start =
        entry.start_date || entry.end_date;

      const end =
        entry.end_date || entry.start_date;

      return dateKey >= start && dateKey <= end;
    });
  }

  const totalLessonsThisMonth =
    filteredLessonPlans.filter((plan) => {
      if (!plan.lesson_date) return false;

      const date = parseDate(plan.lesson_date);

      return (
        date.getFullYear() === currentDate.getFullYear() &&
        date.getMonth() === currentDate.getMonth()
      );
    }).length;

  const completedLessonsThisMonth =
    filteredLessonPlans.filter((plan) => {
      if (
        plan.status !== "completed" ||
        !plan.lesson_date
      ) {
        return false;
      }

      const date = parseDate(plan.lesson_date);

      return (
        date.getFullYear() === currentDate.getFullYear() &&
        date.getMonth() === currentDate.getMonth()
      );
    }).length;

  const schemeWeeksThisMonth = new Set(
    filteredSchemeEntries
      .filter((entry) => {
        const start =
          entry.start_date || entry.end_date;

        if (!start) return false;

        const date = parseDate(start);

        return (
          date.getFullYear() === currentDate.getFullYear() &&
          date.getMonth() === currentDate.getMonth()
        );
      })
      .map(
        (entry) =>
          `${entry.scheme_id}-${entry.week_number}`
      )
  ).size;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full min-w-0 items-center justify-center overflow-x-hidden">
        <div className="px-4 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="text-gray-600">
            Loading your planning calendar...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="space-y-5 px-0 py-0 sm:space-y-6">
        {/* Header */}
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: "var(--color-navy)",
                }}
              >
                <CalendarDays
                  size={20}
                  className="text-white"
                />
              </div>

              <div className="min-w-0">
                <h1
                  className="truncate text-xl font-semibold"
                  style={{
                    color: "var(--color-navy)",
                  }}
                >
                  Planning Calendar
                </h1>

                <p className="text-sm text-slate-500">
                  See your schemes and lesson plans together.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setSelectedLesson({
                create: true,
              })
            }
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
          >
            <Plus size={18} />
            New Lesson Plan
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="w-full min-w-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <select
              value={classFilter}
              onChange={(event) =>
                setClassFilter(event.target.value)
              }
              className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">
                All classes
              </option>

              {classes.map((grade) => (
                <option
                  key={grade.id}
                  value={grade.id}
                >
                  {grade.name}
                </option>
              ))}
            </select>

            <select
              value={subjectFilter}
              onChange={(event) =>
                setSubjectFilter(event.target.value)
              }
              className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">
                All subjects
              </option>

              {subjects.map((subject) => (
                <option
                  key={subject.id}
                  value={subject.id}
                >
                  {subject.name}
                </option>
              ))}
            </select>

            <select
              value={termFilter}
              onChange={(event) =>
                setTermFilter(event.target.value)
              }
              className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">
                All terms
              </option>

              {terms.map((term) => (
                <option
                  key={term.id}
                  value={term.id}
                >
                  {term.name} {term.year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Month navigation + Calendar */}
        <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex min-w-0 flex-col gap-3 border-b border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-start">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="shrink-0 rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>

              <h2 className="min-w-0 flex-1 truncate px-2 text-center text-base font-semibold text-gray-900 sm:min-w-[180px] sm:flex-none sm:text-lg">
                {monthLabel}
              </h2>

              <button
                type="button"
                onClick={goToNextMonth}
                className="shrink-0 rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={goToToday}
              className="w-full shrink-0 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 sm:w-auto"
            >
              Today
            </button>
          </div>

          {/* Calendar scroll container */}
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
            <div className="min-w-[700px]">
              {/* Weekday header */}
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {DAY_NAMES.map((day) => (
                  <div
                    key={day}
                    className="min-w-0 px-1.5 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500 sm:px-2 sm:py-3 sm:text-xs"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const lessons =
                    lessonsForDate(day.date);

                  const schemeDayEntries =
                    schemesForDate(day.date);

                  const isCurrentMonth =
                    day.date.getMonth() ===
                      currentDate.getMonth() &&
                    day.date.getFullYear() ===
                      currentDate.getFullYear();

                  const isToday =
                    toDateKey(day.date) ===
                    toDateKey(new Date());

                  return (
                    <div
                      key={day.key}
                      className={`min-w-0 min-h-[125px] overflow-hidden border-b border-r border-gray-100 p-1.5 sm:min-h-[145px] sm:p-2 ${
                        isCurrentMonth
                          ? "bg-white"
                          : "bg-gray-50/70"
                      }`}
                    >
                      {/* Date */}
                      <div className="mb-1.5 flex min-w-0 items-center justify-between gap-1 sm:mb-2">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold sm:h-7 sm:w-7 sm:text-xs ${
                            isToday
                              ? "bg-blue-600 text-white"
                              : isCurrentMonth
                                ? "text-gray-700"
                                : "text-gray-400"
                          }`}
                        >
                          {day.date.getDate()}
                        </span>

                        {lessons.length > 0 && (
                          <span className="min-w-0 truncate text-[9px] font-medium text-gray-400 sm:text-[10px]">
                            {lessons.length}{" "}
                            {lessons.length === 1
                              ? "lesson"
                              : "lessons"}
                          </span>
                        )}
                      </div>

                      {/* Scheme entries */}
                      <div className="min-w-0 space-y-1">
                        {schemeDayEntries
                          .filter(
                            (entry, index, array) =>
                              array.findIndex(
                                (item) =>
                                  item.id ===
                                  entry.id
                              ) === index
                          )
                          .slice(0, 2)
                          .map((entry) => (
                            <button
                              key={`scheme-${entry.id}`}
                              type="button"
                              onClick={() =>
                                setSelectedSchemeEntry(
                                  entry
                                )
                              }
                              className="block w-full min-w-0 overflow-hidden rounded-md bg-indigo-50 px-1.5 py-1 text-left text-[9px] text-indigo-700 hover:bg-indigo-100 sm:px-2 sm:text-[10px]"
                            >
                              <div className="truncate font-semibold">
                                Week{" "}
                                {entry.week_number}
                              </div>

                              <div className="truncate">
                                {entry.subject_name}
                              </div>
                            </button>
                          ))}

                        {/* Lesson plans */}
                        {lessons
                          .slice(0, 3)
                          .map((plan) => (
                            <button
                              key={`lesson-${plan.id}`}
                              type="button"
                              onClick={() =>
                                setSelectedLesson(plan)
                              }
                              className={`block w-full min-w-0 overflow-hidden rounded-md border px-1.5 py-1.5 text-left text-[9px] hover:shadow-sm sm:px-2 sm:text-[10px] ${
                                lessonStatusStyles[
                                  plan.status
                                ] ||
                                lessonStatusStyles.draft
                              }`}
                            >
                              <div className="flex min-w-0 items-center gap-1 font-semibold">
                                <Clock3
                                  size={9}
                                  className="shrink-0"
                                />

                                <span className="truncate">
                                  {plan.lesson_number
                                    ? `Lesson ${plan.lesson_number}`
                                    : plan.subject_name}
                                </span>
                              </div>

                              <div className="truncate font-medium">
                                {plan.topic}
                              </div>

                              <div className="truncate opacity-75">
                                {plan.grade_name}
                              </div>
                            </button>
                          ))}

                        {lessons.length > 3 && (
                          <div className="truncate px-1 text-[9px] font-medium text-gray-400 sm:text-[10px]">
                            +{lessons.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly summary */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <SummaryCard
            icon={<BookOpen size={20} />}
            label="Lessons This Month"
            value={totalLessonsThisMonth}
          />

          <SummaryCard
            icon={<CheckCircle2 size={20} />}
            label="Completed"
            value={completedLessonsThisMonth}
          />

          <SummaryCard
            icon={<CalendarDays size={20} />}
            label="Scheme Weeks"
            value={schemeWeeksThisMonth}
          />
        </div>

        {/* Lesson details */}
        {selectedLesson && (
          <LessonDetailsModal
            lesson={selectedLesson}
            onClose={() =>
              setSelectedLesson(null)
            }
          />
        )}

        {/* Scheme details */}
        {selectedSchemeEntry && (
          <SchemeEntryDetailsModal
            entry={selectedSchemeEntry}
            onClose={() =>
              setSelectedSchemeEntry(null)
            }
          />
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="shrink-0 rounded-lg bg-gray-100 p-2 text-gray-600">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-xs text-gray-500">
            {label}
          </p>

          <p className="text-xl font-bold text-gray-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function LessonDetailsModal({
  lesson,
  onClose,
}) {
  if (lesson.create) {
    return (
      <ModalShell
        title="New Lesson Plan"
        onClose={onClose}
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            Use the existing Lesson Plans workspace
            to create a lesson plan with its full
            teaching details.
          </div>

          <a
            href="/teacher/lesson-plans"
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
          >
            Open Lesson Plans
          </a>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title={lesson.topic || "Lesson Plan"}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            {lesson.grade_name}
          </span>

          <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
            {lesson.subject_name}
          </span>

          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
              lessonStatusStyles[
                lesson.status
              ] || lessonStatusStyles.draft
            }`}
          >
            {lesson.status === "completed"
              ? "Completed"
              : "Draft"}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Detail
            label="Date"
            value={formatDate(lesson.lesson_date)}
          />

          <Detail
            label="Lesson Number"
            value={
              lesson.lesson_number
                ? `Lesson ${lesson.lesson_number}`
                : "Not specified"
            }
          />

          <Detail
            label="Term"
            value={`${lesson.term_name || ""} ${
              lesson.term_year || ""
            }`}
          />

          <Detail
            label="Subtopic"
            value={
              lesson.subtopic ||
              "No subtopic"
            }
          />
        </div>

        <Detail
          label="Learning Objectives"
          value={lesson.learning_objectives}
        />

        <Detail
          label="Learning Activities"
          value={lesson.learning_activities}
        />

        <Detail
          label="Resources"
          value={lesson.resources}
        />

        <Detail
          label="Assessment Evidence"
          value={lesson.assessment_evidence}
        />

        {lesson.teacher_reflection && (
          <Detail
            label="Teacher Reflection"
            value={lesson.teacher_reflection}
          />
        )}

        <a
          href="/teacher/lesson-plans"
          className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
        >
          Open Lesson Plans
        </a>
      </div>
    </ModalShell>
  );
}

function SchemeEntryDetailsModal({
  entry,
  onClose,
}) {
  const status =
    entry.coverage_status || "planned";

  return (
    <ModalShell
      title={`Week ${entry.week_number}`}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            {entry.grade_name}
          </span>

          <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
            {entry.subject_name}
          </span>

          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
              schemeStatusStyles[status] ||
              schemeStatusStyles.planned
            }`}
          >
            {formatCoverageStatus(status)}
          </span>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Scheme
          </p>

          <p className="mt-1 break-words text-sm font-medium text-gray-900">
            {entry.scheme_title}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Detail
            label="Start Date"
            value={formatDate(entry.start_date)}
          />

          <Detail
            label="End Date"
            value={formatDate(entry.end_date)}
          />
        </div>

        <Detail
          label="Topic"
          value={entry.topic}
        />

        <Detail
          label="Subtopic"
          value={entry.subtopic}
        />

        <Detail
          label="Learning Objectives"
          value={entry.learning_objectives}
        />

        <Detail
          label="Learning Activities"
          value={entry.learning_activities}
        />

        <Detail
          label="Resources"
          value={entry.resources}
        />

        <Detail
          label="Assessment Methods"
          value={entry.assessment_methods}
        />

        <Detail
          label="Remarks"
          value={entry.remarks}
        />

        <a
          href={`/teacher/schemes/${entry.scheme_id}`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
        >
          Open Scheme
        </a>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-3 sm:p-4">
      <div className="flex min-h-full items-center justify-center py-4 sm:py-8">
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="flex min-w-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="min-w-0 truncate text-base font-semibold text-gray-900 sm:text-lg">
              {title}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="max-h-[calc(100vh-120px)] overflow-y-auto p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  if (!value) return null;

  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words whitespace-pre-line text-sm leading-6 text-gray-700">
        {value}
      </p>
    </div>
  );
}

function buildCalendarDays(currentDate) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const previousMonthDays = firstWeekday;

  const totalCells =
    Math.ceil(
      (previousMonthDays + daysInMonth) / 7
    ) * 7;

  const days = [];

  for (
    let index = 0;
    index < totalCells;
    index += 1
  ) {
    const date = new Date(
      year,
      month,
      1 - previousMonthDays + index
    );

    days.push({
      date,
      key: toDateKey(date),
    });
  }

  return days;
}

function parseDate(value) {
  if (!value) return new Date();

  return new Date(`${value}T00:00:00`);
}

function toDateKey(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "";

  return parseDate(value).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function formatCoverageStatus(status) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}