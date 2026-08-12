export default function CompareLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-7 w-56 rounded bg-slate-200" />
      <div className="mb-6 h-4 w-full max-w-xl rounded bg-slate-100" />
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="h-9 rounded-lg border border-slate-200 bg-white" />
        <div className="h-9 rounded-lg border border-slate-200 bg-white" />
      </div>
      <div className="mb-6 flex flex-wrap gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-7 w-32 rounded-full bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="h-12 w-12 rounded-lg bg-slate-100" />
              <div className="flex-1">
                <div className="h-3.5 w-28 rounded bg-slate-200" />
                <div className="mt-1.5 h-2.5 w-16 rounded bg-slate-100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j}>
                  <div className="h-2.5 w-16 rounded bg-slate-100" />
                  <div className="mt-1.5 h-4 w-12 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
