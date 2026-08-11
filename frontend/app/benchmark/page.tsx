import { getMetrics, type MarketMetrics } from "@/lib/api";

function MarketTable({ label, metrics }: { label: string; metrics: MarketMetrics }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-medium">{label}</h3>
        <span className="text-sm text-slate-500">
          n={metrics.n} · accuracy {(metrics.accuracy * 100).toFixed(1)}%
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            <th className="pb-1 pr-2">Class</th>
            <th className="pb-1 pr-2">Precision</th>
            <th className="pb-1 pr-2">Recall</th>
            <th className="pb-1 pr-2">F1</th>
            <th className="pb-1">Support</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(metrics.per_class).map(([label, c]) => (
            <tr key={label} className="border-b border-slate-100 last:border-0">
              <td className="py-1 pr-2 capitalize">{label}</td>
              <td className="py-1 pr-2">{c.precision.toFixed(2)}</td>
              <td className="py-1 pr-2">{c.recall.toFixed(2)}</td>
              <td className="py-1 pr-2">{c.f1.toFixed(2)}</td>
              <td className="py-1">{c.support}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-sm font-medium">
        Macro-F1: <span className="text-slate-900">{metrics.macro_f1.toFixed(3)}</span>
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
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Couldn&apos;t reach the backend.</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!metrics || metrics.status !== "ok") {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-semibold">Benchmark</h1>
        <p className="text-slate-600">
          {metrics?.note ??
            "No benchmark result yet. Run scripts/compute_lm_scores.py, then label gold_sentiment for the benchmark chunks, then scripts/evaluate.py."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Benchmark: US vs India</h1>
      <p className="mb-6 text-sm text-slate-600">
        {metrics.labeled_rows}/{metrics.total_benchmark_rows} chunks labeled. Sentiment
        classification (positive/negative/neutral), macro-F1, segmented by market — the
        cross-market generalization gap is the pilot&apos;s primary research question (see{" "}
        <code>docs/METHODOLOGY.md</code> §A.2).
      </p>

      {metrics.cross_market_gap && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Cross-market generalization gap</p>
          <p className="text-3xl font-semibold">
            {metrics.cross_market_gap.gap.toFixed(3)}
          </p>
          <p className="text-sm text-slate-600">
            US macro-F1 {metrics.cross_market_gap.macro_f1_us.toFixed(3)} − India macro-F1{" "}
            {metrics.cross_market_gap.macro_f1_india.toFixed(3)}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {metrics.US && <MarketTable label="US" metrics={metrics.US} />}
        {metrics.India && <MarketTable label="India" metrics={metrics.India} />}
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Gold labels used for this benchmark are AI-generated adjudications (Gemini /
        openai-gpt-oss-120b via Groq), not independent human labels — see{" "}
        <code>REQUIREMENTS.md</code> for the full provenance disclosure. Treat these numbers as
        illustrative for this course pilot, not a rigorous research result.
      </p>
    </div>
  );
}
