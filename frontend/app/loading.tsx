export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-56 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-96 max-w-full rounded bg-slate-100" />
      </div>
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="h-3 w-16 rounded bg-slate-100" />
            <div className="mt-2 h-6 w-8 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, g) => (
        <div key={g} className="mb-10">
          <div className="mb-4 h-4 w-28 rounded bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-slate-100" />
                  <div className="flex-1">
                    <div className="h-3.5 w-24 rounded bg-slate-200" />
                    <div className="mt-1.5 h-2.5 w-12 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="h-3 w-32 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
