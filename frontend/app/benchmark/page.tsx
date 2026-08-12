import { Info, Target, TriangleAlert } from "lucide-react";
import { getMetrics, type MarketMetrics } from "@/lib/api";

const CLASS_STYLE: Record<string, string> = {
  positive: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  negative: "bg-rose-50 text-rose-700 ring-rose-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
};

function MarketCard({
  label,
  metrics,
  accent,
}: {
  label: string;
  metrics: MarketMetrics;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${accent}`} />
          <h3 className="font-semibold text-slate-900">{label}</h3>
        </div>
        <span className="text-xs text-slate-400">
          n={metrics.n} · accuracy {(metrics.accuracy * 100).toFixed(1)}%
        </span>
      </div>

      <div className="mb-4 space-y-2">
        {Object.entries(metrics.per_class).map(([cls, c]) => (
          <div key={cls} className="flex items-center gap-3">
            <span
              className={`w-16 shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-semibold capitalize ring-1 ring-inset ${
                CLASS_STYLE[cls] ?? "bg-slate-100 text-slate-600 ring-slate-200"
              }`}
            >
              {cls}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                role="progressbar"
                aria-label={`${label} ${cls} F1 score`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(c.f1 * 100)}
                className="h-full rounded-full bg-slate-400"
                style={{ width: `${c.f1 * 100}%` }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-xs font-medium text-slate-600">
              {c.f1.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-left text-slate-400">
            <th className="pb-1.5 pr-2 font-medium">Class</th>
            <th className="pb-1.5 pr-2 font-medium">Precision</th>
            <th className="pb-1.5 pr-2 font-medium">Recall</th>
            <th className="pb-1.5 pr-2 font-medium">F1</th>
            <th className="pb-1.5 font-medium">Support</th>
          </tr>
        </thead>
        <tbody className="text-slate-700">
          {Object.entries(metrics.per_class).map(([cls, c]) => (
            <tr key={cls} className="border-b border-slate-50 last:border-0">
              <td className="py-1.5 pr-2 capitalize">{cls}</td>
              <td className="py-1.5 pr-2">{c.precision.toFixed(2)}</td>
              <td className="py-1.5 pr-2">{c.recall.toFixed(2)}</td>
              <td className="py-1.5 pr-2 font-medium">{c.f1.toFixed(2)}</td>
              <td className="py-1.5">{c.support}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4 border-t border-slate-100 pt-3 text-sm">
        Macro-F1 <span className="font-semibold text-slate-900">{metrics.macro_f1.toFixed(3)}</span>
      </p>
    </div>
  );
}

export default async function BenchmarkPage() {
  let metrics;
  let error: string | null = null;
  try {
    metrics = await getMetrics();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load metrics";
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

  if (!metrics || metrics.status !== "ok") {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Benchmark</h1>
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-slate-600 shadow-sm">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" strokeWidth={2} />
          <p className="text-sm">
            {metrics?.note ??
              "No benchmark result yet. Run scripts/compute_lm_scores.py, then label gold_sentiment for the benchmark chunks, then scripts/evaluate.py."}
          </p>
        </div>
      </div>
    );
  }

  const usF1 = metrics.US?.macro_f1 ?? 0;
  const indiaF1 = metrics.India?.macro_f1 ?? 0;
  const maxF1 = Math.max(usF1, indiaF1, 0.01);

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Target className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Benchmark: US vs India
        </h1>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-slate-500">
        {metrics.labeled_rows}/{metrics.total_benchmark_rows} chunks labeled. Sentiment
        classification (positive/negative/neutral), macro-F1, segmented by market — the
        cross-market generalization gap is the pilot&apos;s primary research question.
      </p>

      {metrics.cross_market_gap && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Cross-market generalization gap
          </p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-900">
            {metrics.cross_market_gap.gap.toFixed(3)}
          </p>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-xs font-semibold text-indigo-700">US</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  role="progressbar"
                  aria-label="US macro F1 relative score"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round((usF1 / maxF1) * 100)}
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${(usF1 / maxF1) * 100}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-sm font-medium text-slate-700">
                {usF1.toFixed(3)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-xs font-semibold text-amber-700">India</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  role="progressbar"
                  aria-label="India macro F1 relative score"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round((indiaF1 / maxF1) * 100)}
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${(indiaF1 / maxF1) * 100}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-sm font-medium text-slate-700">
                {indiaF1.toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {metrics.US && <MarketCard label="US" metrics={metrics.US} accent="bg-indigo-500" />}
        {metrics.India && (
          <MarketCard label="India" metrics={metrics.India} accent="bg-amber-500" />
        )}
      </div>

      <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} />
        <p className="text-xs leading-relaxed text-slate-500">
          Gold labels used for this benchmark are AI-generated adjudications (Gemini /
          openai-gpt-oss-120b via Groq), not independent human labels — see the project report for
          the full provenance disclosure. Treat these numbers as illustrative for this course
          pilot, not a rigorous research result.
        </p>
      </div>
    </div>
  );
}
