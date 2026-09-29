export default function AssessmentStats({ stats }) {
  const cards = [
    {
      title: "Assessments",
      value: stats.total,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      title: "Completed",
      value: stats.completed,
      color: "bg-green-50 text-green-700 border-green-200",
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    {
      title: "Not Started",
      value: stats.notStarted,
      color: "bg-red-50 text-red-700 border-red-200",
    },
  ];

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`rounded-xl border p-3 shadow-sm sm:p-4 ${card.color}`}
        >
          <div className="text-xs font-medium opacity-80 sm:text-sm">
            {card.title}
          </div>

          <div className="mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl">
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
