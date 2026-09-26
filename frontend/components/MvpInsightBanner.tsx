import Link from "next/link";

/**
 * Highlights the MVP's main empirical takeaway so reviewers see the project result immediately.
 */
export function MvpInsightBanner({ showBenchmarkLink = false }: { showBenchmarkLink?: boolean }) {
  return (
    <div className="mb-8 rounded-xl border border-indigo-200 bg-indigo-50/80 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
        MVP insight
      </p>
      <p className="mt-1 text-sm leading-relaxed text-slate-700">
        After adding fuller India source variants, India macro-F1 improved to{" "}
        <span className="font-semibold text-slate-900">0.653</span> and the US–India gap narrowed
        to <span className="font-semibold text-slate-900">0.063</span>. The strongest takeaway is
        that source quality is a major confound in cross-market disclosure analysis.
      </p>
      {showBenchmarkLink && (
        <Link
          href="/benchmark"
          className="mt-3 inline-flex text-xs font-semibold text-indigo-700 hover:underline"
        >
          View benchmark evidence →
        </Link>
      )}
    </div>
  );
}
