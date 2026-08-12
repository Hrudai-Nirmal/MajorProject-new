import Link from "next/link";
import { ArrowRight, Frown, GitCompareArrows, Meh, Smile, TriangleAlert } from "lucide-react";
import { listDocuments, getFinancials, type Document, type FinancialSnapshot } from "@/lib/api";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import { CompareSelector } from "@/components/CompareSelector";

// Sector pairing from README.md's company table -- shown as quick-pick
// shortcuts below the free-form dropdowns. Not stored in the DB since it's
// fixed metadata for this fixed 20-company pilot.
const SECTOR_PAIRS = [
  { sector: "Technology", us: "MSFT", india: "INFY" },
  { sector: "Technology", us: "AAPL", india: "TCS" },
  { sector: "Banking", us: "JPM", india: "HDFC" },
  { sector: "Pharma", us: "PFE", india: "Sun" },
  { sector: "Retail / Consumer", us: "WMT", india: "RIL" },
  { sector: "Energy", us: "XOM", india: "ONGC" },
  { sector: "Automotive", us: "F", india: "TATAMOTORS" },
  { sector: "Telecom", us: "VZ", india: "BHARTIARTL" },
  { sector: "Consumer Staples / FMCG", us: "PG", india: "HINDUNILVR" },
  { sector: "Financial Services", us: "V", india: "BAJFINANCE" },
];

const SENTIMENT_ICON: Record<string, { icon: typeof Smile; cls: string }> = {
  positive: { icon: Smile, cls: "text-emerald-600" },
  negative: { icon: Frown, cls: "text-rose-600" },
  neutral: { icon: Meh, cls: "text-slate-400" },
};

function fmtMoney(value: number | null | undefined, unit: string | null | undefined, currency: string | null | undefined) {
  if (value === null || value === undefined) return "—";
  return [value.toLocaleString(), unit, currency].filter(Boolean).join(" ");
}

function fmtPct(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${value}%`;
}

function CompanyPanel({ doc, financials }: { doc: Document | undefined; financials: FinancialSnapshot }) {
  if (!doc) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-400">
        No document found for this ticker.
      </div>
    );
  }
  const sentiment = doc.sentiment_label ? SENTIMENT_ICON[doc.sentiment_label] ?? SENTIMENT_ICON.neutral : null;
  const SentimentIcon = sentiment?.icon;

  return (
    <Link
      href={`/documents/${doc.id}`}
      className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <CompanyAvatar ticker={doc.ticker} size="lg" />
          <div>
            <p className="font-semibold leading-tight text-slate-900">{doc.company}</p>
            <p className="text-xs text-slate-400">
              {doc.ticker} · {doc.fiscal_period ?? "period n/a"}
            </p>
          </div>
        </div>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-slate-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-500 group-hover:opacity-100"
          strokeWidth={2.25}
        />
      </div>

      <div className="mb-4 flex items-center justify-between border-y border-slate-100 py-2.5">
        {sentiment && SentimentIcon ? (
          <span className={`flex items-center gap-1.5 text-sm font-medium capitalize ${sentiment.cls}`}>
            <SentimentIcon className="h-4 w-4" strokeWidth={2.25} />
            {doc.sentiment_label}
          </span>
        ) : (
          <span className="text-sm text-slate-400">No sentiment data</span>
        )}
        {!!doc.risk_count && (
          <span className="text-xs font-medium text-amber-600">
            {doc.risk_count} risk{doc.risk_count === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[11px] text-slate-400">Revenue</dt>
          <dd className="font-semibold text-slate-900">
            {fmtMoney(financials?.revenue, financials?.revenue_unit, financials?.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-slate-400">Revenue growth (YoY)</dt>
          <dd className="font-semibold text-slate-900">{fmtPct(financials?.revenue_growth_yoy_pct)}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-slate-400">Gross margin</dt>
          <dd className="font-semibold text-slate-900">{fmtPct(financials?.gross_margin_pct)}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-slate-400">Operating margin</dt>
          <dd className="font-semibold text-slate-900">{fmtPct(financials?.operating_margin_pct)}</dd>
        </div>
      </dl>
    </Link>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { us?: string; india?: string };
}) {
  let documents: Document[] = [];
  let error: string | null = null;
  try {
    documents = await listDocuments();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load documents";
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

  const usDocs = documents.filter((d) => d.market === "US");
  const indiaDocs = documents.filter((d) => d.market === "India");

  const usTicker = usDocs.some((d) => d.ticker === searchParams.us)
    ? searchParams.us!
    : usDocs[0]?.ticker ?? "";
  const indiaTicker = indiaDocs.some((d) => d.ticker === searchParams.india)
    ? searchParams.india!
    : indiaDocs[0]?.ticker ?? "";

  const usDoc = usDocs.find((d) => d.ticker === usTicker);
  const indiaDoc = indiaDocs.find((d) => d.ticker === indiaTicker);

  const [usFinancials, indiaFinancials] = await Promise.all([
    usDoc ? getFinancials(usDoc.id).catch(() => null) : Promise.resolve(null),
    indiaDoc ? getFinancials(indiaDoc.id).catch(() => null) : Promise.resolve(null),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <GitCompareArrows className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Company comparison
        </h1>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-slate-500">
        Pick any US company and any India company to compare side by side. Only figures
        explicitly stated in the collected transcripts are shown.
      </p>

      <CompareSelector
        usOptions={usDocs.map((d) => ({ ticker: d.ticker, company: d.company }))}
        indiaOptions={indiaDocs.map((d) => ({ ticker: d.ticker, company: d.company }))}
        selectedUs={usTicker}
        selectedIndia={indiaTicker}
      />

      <div className="mb-6 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Sector-matched shortcuts:
        </span>
        {SECTOR_PAIRS.map((p) => (
          <Link
            key={p.sector + p.us}
            href={`/compare?us=${p.us}&india=${p.india}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              p.us === usTicker && p.india === indiaTicker
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
            }`}
          >
            {p.sector} · {p.us} / {p.india}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CompanyPanel doc={usDoc} financials={usFinancials} />
        <CompanyPanel doc={indiaDoc} financials={indiaFinancials} />
      </div>
    </div>
  );
}
