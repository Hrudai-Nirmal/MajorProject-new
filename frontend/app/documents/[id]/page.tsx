import { getDocument, getExtractions, getFinancials, type Extraction } from "@/lib/api";
import { notFound } from "next/navigation";

const SENTIMENT_COLOR: Record<string, string> = {
  positive: "text-green-700 bg-green-50",
  negative: "text-red-700 bg-red-50",
  neutral: "text-slate-700 bg-slate-100",
};

const SECTOR_LABELS: Record<string, string> = {
  rotce_pct: "ROTCE",
  credit_deposit_ratio_pct: "Credit-Deposit Ratio",
  attrition_rate_pct: "Attrition Rate",
};

function fmtMoney(value: number | null, unit: string | null, currency: string | null) {
  if (value === null) return "—";
  const parts = [value.toLocaleString(), unit, currency].filter(Boolean);
  return parts.join(" ");
}

function fmtPct(value: number | null) {
  return value === null || value === undefined ? "—" : `${value}%`;
}

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const [doc, extractions, financials] = await Promise.all([
    getDocument(params.id),
    getExtractions(params.id).catch(() => [] as Extraction[]),
    getFinancials(params.id).catch(() => null),
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

      {financials && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-medium">Financial snapshot</h2>
          <p className="mb-3 text-xs text-slate-500">
            Only figures explicitly stated in the collected transcript excerpt are shown — a dash
            means it wasn&apos;t disclosed in what we have, not zero.
          </p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-slate-500">Revenue</dt>
              <dd className="font-medium">
                {fmtMoney(financials.revenue, financials.revenue_unit, financials.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Revenue growth (YoY)</dt>
              <dd className="font-medium">{fmtPct(financials.revenue_growth_yoy_pct)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Revenue growth (QoQ)</dt>
              <dd className="font-medium">{fmtPct(financials.revenue_growth_qoq_pct)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Gross margin</dt>
              <dd className="font-medium">{fmtPct(financials.gross_margin_pct)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Operating margin</dt>
              <dd className="font-medium">{fmtPct(financials.operating_margin_pct)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Net margin</dt>
              <dd className="font-medium">{fmtPct(financials.net_margin_pct)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">EBITDA margin</dt>
              <dd className="font-medium">{fmtPct(financials.ebitda_margin_pct)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">EPS growth (YoY)</dt>
              <dd className="font-medium">{fmtPct(financials.eps_growth_yoy_pct)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Free cash flow</dt>
              <dd className="font-medium">
                {fmtMoney(financials.free_cash_flow, financials.free_cash_flow_unit, financials.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Constant-currency growth</dt>
              <dd className="font-medium">{fmtPct(financials.constant_currency_growth_pct)}</dd>
            </div>
            {Object.entries(financials.sector_specific ?? {}).map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs text-slate-500">{SECTOR_LABELS[key] ?? key}</dt>
                <dd className="font-medium">{fmtPct(value)}</dd>
              </div>
            ))}
          </dl>
          {financials.notes && (
            <p className="mt-3 text-xs text-slate-500">{financials.notes}</p>
          )}
        </div>
      )}

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
                <div className="mb-2 flex flex-wrap gap-1">
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
              {ex.chunks?.text && (
                <details className="mt-1 rounded border border-slate-100 bg-slate-50 px-3 py-1.5">
                  <summary className="cursor-pointer text-xs font-medium text-slate-500">
                    Source excerpt — verify the summary and risk flags above against the actual
                    text (chunk #{ex.chunks.chunk_index})
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {ex.chunks.text}
                  </p>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
