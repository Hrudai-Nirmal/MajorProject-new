export default function RisksLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-7 w-64 rounded bg-slate-200" />
      <div className="mb-6 h-4 w-full max-w-xl rounded bg-slate-100" />
      <div className="mb-6 h-11 rounded-xl border border-slate-200 bg-white" />
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 h-4 w-20 rounded bg-slate-200" />
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-6 w-20 rounded-full bg-slate-100" />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
