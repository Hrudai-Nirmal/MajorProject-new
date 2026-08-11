import {
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  Frown,
  Meh,
  Quote,
  Smile,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getDocument, getExtractions, getFinancials, type Extraction } from "@/lib/api";
import { notFound } from "next/navigation";

const SENTIMENT_STYLE: Record<
  string,
  { text: string; bg: string; ring: string; bar: string; icon: typeof Smile }
> = {
  positive: {
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
    bar: "bg-emerald-300",
    icon: Smile,
  },
  negative: {
    text: "text-rose-700",
    bg: "bg-rose-50",
    ring: "ring-rose-200",
    bar: "bg-rose-300",
    icon: Frown,
  },
  neutral: {
    text: "text-slate-600",
    bg: "bg-slate-100",
    ring: "ring-slate-200",
    bar: "bg-slate-300",
    icon: Meh,
  },
};

const SECTOR_LABELS: Record<string, string> = {
  rotce_pct: "ROTCE",
  credit_deposit_ratio_pct: "Credit-Deposit Ratio",
  attrition_rate_pct: "Attrition Rate",
};

function fmtMoney(value: number | null, unit: string | null, currency: string | null) {
  if (value === null || value === undefined) return "—";
  const parts = [value.toLocaleString(), unit, currency].filter(Boolean);
  return parts.join(" ");
}

function fmtPct(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${value}%`;
}

function GrowthValue({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) {
    return <span className="font-semibold text-slate-300">—</span>;
  }
  const positive = value > 0;
  const flat = value === 0;
  const Icon = flat ? Meh : positive ? TrendingUp : TrendingDown;
  const color = flat ? "text-slate-500" : positive ? "text-emerald-600" : "text-rose-600";
  return (
    <span className={`flex items-center gap-1 font-semibold ${color}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      {value}%
    </span>
  );
}

function StatCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3.5 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
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
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {doc.company}
              </h1>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  doc.market === "US"
                    ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200"
                    : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200"
                }`}
              >
                {doc.market}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {doc.ticker} · <span className="capitalize">{doc.doc_type.replace(/_/g, " ")}</span>{" "}
              · {doc.fiscal_period ?? "period n/a"}
            </p>
          </div>
          {doc.source_url && (
            <a
              href={doc.source_url}
              target="_blank"
              rel="noreferrer"
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-200 hover:text-indigo-600"
            >
              Source <ExternalLink className="h-3 w-3" strokeWidth={2.25} />
            </a>
          )}
        </div>
      </div>

      {financials && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
              <Wallet className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
            <h2 className="font-semibold text-slate-900">Financial snapshot</h2>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            Only figures explicitly stated in the collected transcript excerpt are shown — a dash
            means it wasn&apos;t disclosed in what we have, not zero.
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Revenue">
              <span className="font-semibold text-slate-900">
                {fmtMoney(financials.revenue, financials.revenue_unit, financials.currency)}
              </span>
            </StatCard>
            <StatCard label="Revenue growth (YoY)">
              <GrowthValue value={financials.revenue_growth_yoy_pct} />
            </StatCard>
            <StatCard label="Revenue growth (QoQ)">
              <GrowthValue value={financials.revenue_growth_qoq_pct} />
            </StatCard>
            <StatCard label="Gross margin">
              <span className="font-semibold text-slate-900">{fmtPct(financials.gross_margin_pct)}</span>
            </StatCard>
            <StatCard label="Operating margin">
              <span className="font-semibold text-slate-900">{fmtPct(financials.operating_margin_pct)}</span>
            </StatCard>
            <StatCard label="Net margin">
              <span className="font-semibold text-slate-900">{fmtPct(financials.net_margin_pct)}</span>
            </StatCard>
            <StatCard label="EBITDA margin">
              <span className="font-semibold text-slate-900">{fmtPct(financials.ebitda_margin_pct)}</span>
            </StatCard>
            <StatCard label="EPS growth (YoY)">
              <GrowthValue value={financials.eps_growth_yoy_pct} />
            </StatCard>
            <StatCard label="Free cash flow">
              <span className="font-semibold text-slate-900">
                {fmtMoney(financials.free_cash_flow, financials.free_cash_flow_unit, financials.currency)}
              </span>
            </StatCard>
            <StatCard label="Constant-currency growth">
              <GrowthValue value={financials.constant_currency_growth_pct} />
            </StatCard>
            {Object.entries(financials.sector_specific ?? {}).map(([key, value]) => (
              <StatCard key={key} label={SECTOR_LABELS[key] ?? key}>
                <span className="font-semibold text-slate-900">{fmtPct(value)}</span>
              </StatCard>
            ))}
          </div>
          {financials.notes && (
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              {financials.notes}
            </p>
          )}
        </div>
      )}

      {extractions.length === 0 ? (
        <p className="text-slate-600">
          No extraction results yet for this document. Run{" "}
          <code>scripts/run_extraction.py</code>.
        </p>
      ) : (
        <div className="space-y-3">
          {extractions.map((ex) => {
            const style = SENTIMENT_STYLE[ex.sentiment_label ?? ""] ?? {
              text: "text-slate-600",
              bg: "bg-slate-100",
              ring: "ring-slate-200",
              bar: "bg-slate-300",
              icon: Meh,
            };
            const SentimentIcon = style.icon;
            return (
              <div
                key={ex.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className={`h-1 ${style.bar}`} />
                <div className="p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.text} ${style.bg} ${style.ring}`}
                    >
                      <SentimentIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
                      <span className="capitalize">{ex.sentiment_label ?? "unknown"}</span>
                      <span className="font-normal opacity-70">
                        {ex.sentiment_score !== null ? `(${ex.sentiment_score})` : ""}
                      </span>
                    </span>
                    {ex.model_used && (
                      <span className="text-[11px] text-slate-400">{ex.model_used}</span>
                    )}
                  </div>

                  {ex.summary && (
                    <p className="mb-3 text-sm leading-relaxed text-slate-700">{ex.summary}</p>
                  )}

                  {ex.risk_flags?.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-slate-500">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" strokeWidth={2.25} />
                        Risk flags
                      </p>
                      <ul className="space-y-1">
                        {ex.risk_flags.map((r, i) => (
                          <li
                            key={i}
                            className="rounded-lg bg-amber-50 px-2.5 py-1 text-sm text-amber-800 ring-1 ring-inset ring-amber-100"
                          >
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {ex.topics?.length > 0 && (
                    <div className="mb-1 flex flex-wrap gap-1.5">
                      {ex.topics.map((t, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {ex.chunks?.text && (
                    <details className="group mt-3 rounded-lg border border-slate-100 bg-slate-50/70">
                      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs font-medium text-slate-500 hover:text-indigo-600">
                        <span className="flex items-center gap-1.5">
                          <Quote className="h-3.5 w-3.5" strokeWidth={2.25} />
                          Source excerpt (chunk #{ex.chunks.chunk_index}) — verify above against
                          the actual text
                        </span>
                        <ChevronDown
                          className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180"
                          strokeWidth={2.25}
                        />
                      </summary>
                      <p className="whitespace-pre-wrap border-t border-slate-100 px-3 py-3 text-sm leading-relaxed text-slate-600">
                        {ex.chunks.text}
                      </p>
                    </details>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
