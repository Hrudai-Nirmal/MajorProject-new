import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Frown,
  GitCompareArrows,
  Globe2,
  Meh,
  MessageSquareText,
  SearchCheck,
  Smile,
  Target,
  TriangleAlert,
} from "lucide-react";
import { listDocuments, type Document } from "@/lib/api";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import { MvpInsightBanner } from "@/components/MvpInsightBanner";

/**
 * Server-rendered dashboard overview; counts come from the backend so deployed copy cannot drift
 * from the live disclosure set.
 */
function MarketBadge({ market }: { market: "US" | "India" }) {
  const cls =
    market === "US"
      ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200"
      : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{market}</span>
  );
}

const SENTIMENT_ICON: Record<string, { icon: typeof Smile; cls: string }> = {
  positive: { icon: Smile, cls: "text-indigo-600" },
  negative: { icon: Frown, cls: "text-rose-600" },
  neutral: { icon: Meh, cls: "text-slate-400" },
};

function SentimentIndicator({ label }: { label?: string | null }) {
  if (!label) return null;
  const entry = SENTIMENT_ICON[label] ?? SENTIMENT_ICON.neutral;
  const Icon = entry.icon;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium capitalize ${entry.cls}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      {label}
    </span>
  );
}

function getSourceFidelity(doc: Document) {
  return doc.source_fidelity ?? (doc.doc_id.includes("_full_") ? "full_transcript" : "summary_excerpt");
}

function SourceFidelityBadge({ doc }: { doc: Document }) {
  const sourceFidelity = getSourceFidelity(doc);
  const isFullTranscript = sourceFidelity === "full_transcript";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
        isFullTranscript
          ? "bg-sky-50 text-sky-700 ring-sky-200"
          : "bg-stone-50 text-stone-600 ring-stone-200"
      }`}
    >
      {isFullTranscript ? "Full transcript" : "Summary excerpt"}
    </span>
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

const DEMO_STEPS = [
  {
    href: "/benchmark",
    icon: Target,
    title: "See the gap narrow",
    copy: "128 labeled chunks; US 0.717 vs India 0.653.",
  },
  {
    href: "/",
    icon: SearchCheck,
    title: "Inspect full-source India",
    copy: "Look for the Full transcript badge on India records.",
  },
  {
    href: "/compare?us=KO&india=VBL",
    icon: GitCompareArrows,
    title: "Compare beverages",
    copy: "Coca-Cola vs Varun Beverages side by side.",
  },
  {
    href: "/chat",
    icon: MessageSquareText,
    title: "Ask the research desk",
    copy: "Try the Infosys margins prompt with cited sources.",
  },
];

function DemoModeSection() {
  return (
    <section className="mb-10 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Demo mode
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
            Four-click reviewer path
          </h2>
        </div>
        <span className="hidden rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200 sm:inline-flex">
          3–5 minute walkthrough
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DEMO_STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.title}
              href={step.href}
              className="group rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-600 ring-1 ring-inset ring-slate-200">
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <span className="text-xs font-semibold text-slate-300">0{index + 1}</span>
              </div>
              <p className="font-medium text-slate-900">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{step.copy}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                Open <ArrowRight className="h-3 w-3" strokeWidth={2.25} />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** Renders the top-level company disclosure dashboard. */
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
          <p className="font-medium">Couldn&apos;t load disclosure data.</p>
          <p className="text-sm">{error}</p>
          <p className="mt-2 text-sm">
            If <code className="rounded bg-rose-100 px-1 py-0.5">/api/health</code> is healthy,
            check the backend&apos;s Supabase project status plus{" "}
            <code className="rounded bg-rose-100 px-1 py-0.5">SUPABASE_URL</code> and{" "}
            <code className="rounded bg-rose-100 px-1 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code>.
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
                <CompanyAvatar ticker={doc.ticker} />
                <div>
                  <p className="font-medium leading-tight text-slate-900">{doc.company}</p>
                  <p className="text-xs text-slate-400">{doc.ticker}</p>
                </div>
              </div>
              <MarketBadge market={market} />
            </div>
            <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
              <FileText className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="capitalize">{doc.doc_type.replace(/_/g, " ")}</span>
              <span className="text-slate-300">·</span>
              <span>{doc.fiscal_period ?? "period n/a"}</span>
            </div>
            <div className="mb-3">
              <SourceFidelityBadge doc={doc} />
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
              <SentimentIndicator label={doc.sentiment_label} />
              {!!doc.risk_count && (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                  {doc.risk_count} risk{doc.risk_count === 1 ? "" : "s"} flagged
                </span>
              )}
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
          Sentiment, risk, and financial signals extracted from 32 US/India disclosure records
          across 13 sector-matched pairs, including six full-source India variants.
        </p>
      </div>

      <MvpInsightBanner showBenchmarkLink />

      <DemoModeSection />

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
