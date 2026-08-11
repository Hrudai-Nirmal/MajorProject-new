import { ShieldAlert, TriangleAlert } from "lucide-react";
import { getRisksTopics } from "@/lib/api";
import { RisksExplorer } from "@/components/RisksExplorer";

export default async function RisksPage() {
  let data;
  let error: string | null = null;
  try {
    data = await getRisksTopics();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load risks/topics";
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
        <div>
          <p className="font-medium">Couldn&apos;t reach the backend.</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <ShieldAlert className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Risk &amp; topic explorer
        </h1>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-slate-500">
        Every risk flag and topic tag extracted across all 10 companies, in one place. Click a
        topic to filter risks by companies that discussed it, or search directly.
      </p>
      {data && <RisksExplorer data={data} />}
    </div>
  );
}
