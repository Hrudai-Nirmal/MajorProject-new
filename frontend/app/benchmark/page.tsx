import { Info, Target, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { MvpInsightBanner } from "@/components/MvpInsightBanner";
import type { MarketMetrics } from "@/lib/api";
import metrics from "@/research-data/metrics.json";
import expandedSample from "@/research-data/expanded-same-model.json";
import { getMatchedMetrics } from "@/lib/benchmark-sensitivity.cjs";

const CLASS_STYLE: Record<string, string> = {
  positive: "bg-indigo-50 text-indigo-700 ring-indigo-200",
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
        <Link className="desk-link" href={`/research/disagreements?market=${label}`}>Macro-F1 {metrics.macro_f1.toFixed(3)} · Inspect disagreements →</Link>
      </p>
    </div>
  );
}

export default async function BenchmarkPage() {

  const usF1 = metrics.US?.macro_f1 ?? 0;
  const indiaF1 = metrics.India?.macro_f1 ?? 0;
  const maxF1 = Math.max(usF1, indiaF1, 0.01);
  const matchedMetrics = getMatchedMetrics(expandedSample.rows, expandedSample.matched_chunk_ids);

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

      <MvpInsightBanner />

      <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Expanded same-model pilot</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">Comparable disclosure excerpts</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Qwen classified {matchedMetrics.US.count} US and {matchedMetrics.India.count} India excerpts
          with matched sentiment-label counts. Macro-F1 was {matchedMetrics.US.macroF1.toFixed(3)}
          {" "}for the US and {matchedMetrics.India.macroF1.toFixed(3)} for India, a gap of
          {" "}{(matchedMetrics.US.macroF1 - matchedMetrics.India.macroF1).toFixed(3)}.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          The difference remains preliminary. Resampling disclosures produced gaps in either direction,
          and the reference labels are AI-generated.
        </p>
      </div>

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
