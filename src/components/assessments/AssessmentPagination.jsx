{pagination && pagination.total_pages > 1 && (
      <div className="mt-8 flex flex-col items-center gap-4">

        <div className="text-sm text-slate-600">
          Showing page{" "}
          <strong>{pagination.current_page}</strong>
          {" "}of{" "}
          <strong>{pagination.total_pages}</strong>

          {" • "}

          {pagination.total_count} assessments
        </div>

        <div className="flex items-center gap-2">

          <button
            disabled={!pagination.prev_page}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>

          {Array.from(
            { length: pagination.total_pages },
            (_, i) => i + 1
          )
            .filter((number) => {
              return (
                number === 1 ||
                number === pagination.total_pages ||
                Math.abs(number - pagination.current_page) <= 2
              );
            })
            .map((number) => (
              <button
                key={number}
                onClick={() => setPage(number)}
                className={`h-10 w-10 rounded border transition ${
                  number === pagination.current_page
                    ? "bg-blue-600 text-white"
                    : "bg-white hover:bg-slate-100"
                }`}
              >
                {number}
              </button>
            ))}

          <button
            disabled={!pagination.next_page}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>

        </div>
      </div>
    )}