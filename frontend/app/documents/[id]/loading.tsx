export default function DocumentLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="h-6 w-52 rounded bg-slate-200" />
        <div className="mt-2 h-3.5 w-64 rounded bg-slate-100" />
      </div>
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 h-4 w-40 rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-slate-50 px-3.5 py-3">
              <div className="h-2.5 w-16 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-12 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 h-5 w-24 rounded-full bg-slate-100" />
            <div className="h-3.5 w-full rounded bg-slate-100" />
            <div className="mt-1.5 h-3.5 w-3/4 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
