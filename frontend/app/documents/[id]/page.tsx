import { getDocument, getExtractions, type Extraction } from "@/lib/api";
import { notFound } from "next/navigation";

const SENTIMENT_COLOR: Record<string, string> = {
  positive: "text-green-700 bg-green-50",
  negative: "text-red-700 bg-red-50",
  neutral: "text-slate-700 bg-slate-100",
};

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const [doc, extractions] = await Promise.all([
    getDocument(params.id),
    getExtractions(params.id).catch(() => [] as Extraction[]),
  ]);

  if (!doc) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{doc.company}</h1>
        <p className="text-slate-600">
          {doc.ticker} · {doc.market} · {doc.doc_type} · {doc.fiscal_period ?? "period n/a"}
        </p>
        {doc.source_url && (
          <a
            href={doc.source_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Source
          </a>
        )}
      </div>

      {extractions.length === 0 ? (
        <p className="text-slate-600">
          No extraction results yet for this document. Run{" "}
          <code>scripts/run_extraction.py</code>.
        </p>
      ) : (
        <div className="space-y-4">
          {extractions.map((ex) => (
            <div key={ex.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    SENTIMENT_COLOR[ex.sentiment_label ?? ""] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {ex.sentiment_label ?? "unknown"} ({ex.sentiment_score ?? "?"})
                </span>
                {ex.model_used && (
                  <span className="text-xs text-slate-400">{ex.model_used}</span>
                )}
              </div>
              {ex.summary && <p className="mb-2 text-sm">{ex.summary}</p>}
              {ex.risk_flags?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-slate-500">Risk flags</p>
                  <ul className="list-inside list-disc text-sm text-slate-700">
                    {ex.risk_flags.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {ex.topics?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {ex.topics.map((t, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
