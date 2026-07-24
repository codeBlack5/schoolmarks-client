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
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`rounded-lg border p-4 shadow-sm ${card.color}`}
        >
          <div className="text-sm font-medium opacity-80">
            {card.title}
          </div>

          <div className="mt-2 text-3xl font-bold">
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}