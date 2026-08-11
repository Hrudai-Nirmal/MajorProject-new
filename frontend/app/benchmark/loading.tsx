export default function BenchmarkLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-7 w-64 rounded bg-slate-200" />
      <div className="mb-6 h-4 w-full max-w-xl rounded bg-slate-100" />
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="h-3 w-40 rounded bg-slate-100" />
        <div className="mt-2 h-9 w-24 rounded bg-slate-200" />
        <div className="mt-5 space-y-3">
          <div className="h-3 w-full rounded-full bg-slate-100" />
          <div className="h-3 w-full rounded-full bg-slate-100" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 h-4 w-16 rounded bg-slate-200" />
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-3 w-full rounded-full bg-slate-100" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
