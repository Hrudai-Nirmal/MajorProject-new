import Link from "next/link";
import { ArrowRight, Building2, FileText, Globe2, TriangleAlert } from "lucide-react";
import { listDocuments, type Document } from "@/lib/api";

function MarketBadge({ market }: { market: "US" | "India" }) {
  const cls =
    market === "US"
      ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200"
      : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{market}</span>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  let documents: Document[] = [];
  let error: string | null = null;
  try {
    documents = await listDocuments();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load documents";
  }

  const us = documents.filter((d) => d.market === "US");
  const india = documents.filter((d) => d.market === "India");

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
        <div>
          <p className="font-medium">Couldn&apos;t reach the backend.</p>
          <p className="text-sm">{error}</p>
          <p className="mt-2 text-sm">
            Is the FastAPI backend running and is <code className="rounded bg-rose-100 px-1 py-0.5">NEXT_PUBLIC_API_URL</code> set
            correctly?
          </p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="text-slate-600">
        No documents in the database yet. Run <code>scripts/embed_and_store.py</code> first.
      </p>
    );
  }

  const renderGroup = (label: string, market: "US" | "India", docs: Document[]) => (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-2">
        <Globe2 className="h-4 w-4 text-slate-400" strokeWidth={2} />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {label} market
        </h2>
        <span className="text-xs text-slate-400">({docs.length})</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((doc) => (
          <Link
            key={doc.id}
            href={`/documents/${doc.id}`}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:ring-indigo-200">
                  <Building2 className="h-4.5 w-4.5" strokeWidth={2} />
                </span>
                <div>
                  <p className="font-medium leading-tight text-slate-900">{doc.company}</p>
                  <p className="text-xs text-slate-400">{doc.ticker}</p>
                </div>
              </div>
              <MarketBadge market={market} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <FileText className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="capitalize">{doc.doc_type.replace(/_/g, " ")}</span>
              <span className="text-slate-300">·</span>
              <span>{doc.fiscal_period ?? "period n/a"}</span>
            </div>
            <ArrowRight
              className="absolute bottom-4 right-4 h-4 w-4 text-slate-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-500 group-hover:opacity-100"
              strokeWidth={2.25}
            />
          </Link>
        ))}
      </div>
    </section>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Company disclosures
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Sentiment, risk, and financial signals extracted from earnings calls — 5 sector-matched
          US/India company pairs.
        </p>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill label="Companies" value={String(documents.length)} />
        <StatPill label="Markets" value="2" />
        <StatPill label="US disclosures" value={String(us.length)} />
        <StatPill label="India disclosures" value={String(india.length)} />
      </div>

      {renderGroup("US", "US", us)}
      {renderGroup("India", "India", india)}
    </div>
  );
}
