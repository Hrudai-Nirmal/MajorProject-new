"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, FileText, Frown, Meh, Search, Smile, X } from "lucide-react";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import type { Document } from "@/lib/api";

const SENTIMENT_ICON: Record<string, { icon: typeof Smile; className: string }> = {
  positive: { icon: Smile, className: "sentiment-positive" },
  negative: { icon: Frown, className: "sentiment-negative" },
  neutral: { icon: Meh, className: "sentiment-neutral" },
};

type SortOrder = "newest" | "oldest" | "company" | "risks";

export function DashboardExplorer({ documents }: { documents: Document[] }) {
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [docType, setDocType] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");

  const docTypes = useMemo(
    () => Array.from(new Set(documents.map((doc) => doc.doc_type))).sort(),
    [documents],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return documents
      .filter((doc) => {
        if (market && doc.market !== market) return false;
        if (sentiment && doc.sentiment_label !== sentiment) return false;
        if (docType && doc.doc_type !== docType) return false;
        if (!normalizedQuery) return true;
        return [doc.company, doc.ticker, doc.fiscal_period, doc.doc_type]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => {
        if (sort === "company") return a.company.localeCompare(b.company);
        if (sort === "risks") return (b.risk_count ?? 0) - (a.risk_count ?? 0);
        const aTime = new Date(a.created_at).getTime() || 0;
        const bTime = new Date(b.created_at).getTime() || 0;
        return sort === "oldest" ? aTime - bTime : bTime - aTime;
      });
  }, [documents, query, market, sentiment, docType, sort]);

  const us = filtered.filter((doc) => doc.market === "US");
  const india = filtered.filter((doc) => doc.market === "India");
  const totalRisks = documents.reduce((sum, doc) => sum + (doc.risk_count ?? 0), 0);
  const withSentiment = documents.filter((doc) => doc.sentiment_label).length;
  const latestTimestamp = Math.max(...documents.map((doc) => new Date(doc.created_at).getTime() || 0), 0);
  const latestDate = latestTimestamp
    ? new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(latestTimestamp)
    : "Not available";
  const hasFilters = Boolean(query || market || sentiment || docType || sort !== "newest");

  function clearFilters() {
    setQuery("");
    setMarket("");
    setSentiment("");
    setDocType("");
    setSort("newest");
  }

  return (
    <>
      <section className="dashboard-summary" aria-label="Corpus summary">
        <div><span className="mono-label">Corpus size</span><strong>{documents.length}</strong><span>disclosures indexed</span></div>
        <div><span className="mono-label">Risk signals</span><strong>{totalRisks}</strong><span>flags extracted</span></div>
        <div><span className="mono-label">Sentiment coverage</span><strong>{withSentiment}</strong><span>documents scored</span></div>
        <div><span className="mono-label">Latest index</span><strong className="date-stat">{latestDate}</strong><span>API data freshness</span></div>
      </section>

      <section className="disclosure-tools" aria-label="Disclosure search and filters">
        <div className="search-control">
          <Search aria-hidden="true" size={17} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search company, ticker, period, or document type"
            aria-label="Search disclosures"
          />
        </div>
        <select value={market} onChange={(event) => setMarket(event.target.value)} aria-label="Filter disclosures by market">
          <option value="">All markets</option><option value="US">US</option><option value="India">India</option>
        </select>
        <select value={sentiment} onChange={(event) => setSentiment(event.target.value)} aria-label="Filter disclosures by sentiment">
          <option value="">All sentiment</option><option value="positive">Positive</option><option value="neutral">Neutral</option><option value="negative">Negative</option>
        </select>
        <select value={docType} onChange={(event) => setDocType(event.target.value)} aria-label="Filter disclosures by document type">
          <option value="">All document types</option>
          {docTypes.map((type) => <option key={type} value={type}>{type.replace(/_/g, " ")}</option>)}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value as SortOrder)} aria-label="Sort disclosures">
          <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="company">Company A–Z</option><option value="risks">Most risks</option>
        </select>
        {hasFilters && <button type="button" className="clear-filters" onClick={clearFilters}><X aria-hidden="true" size={15} /> Reset</button>}
      </section>

      <div className="filter-status" aria-live="polite">
        <span className="mono-label">Showing {filtered.length} of {documents.length} disclosures</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No disclosures match the current search and filters.</div>
      ) : (
        <div className="market-sections">
          <MarketSection label="United States market" market="US" docs={us} />
          <MarketSection label="India market" market="India" docs={india} />
        </div>
      )}
    </>
  );
}

function DocumentCard({ doc }: { doc: Document }) {
  const sentiment = doc.sentiment_label ? SENTIMENT_ICON[doc.sentiment_label] : null;
  const SentimentIcon = sentiment?.icon;
  return (
    <Link href={`/documents/${doc.id}`} className="document-card">
      <div className="document-card-top"><div className="company-lockup"><CompanyAvatar ticker={doc.ticker} /><div><h3>{doc.company}</h3><span>{doc.ticker}</span></div></div><span className="market-label">{doc.market}</span></div>
      <div className="document-meta"><span><FileText size={14} />{doc.doc_type.replace(/_/g, " ")}</span><span>{doc.fiscal_period ?? "Period n/a"}</span></div>
      <div className="document-card-bottom">{sentiment && SentimentIcon ? <span className={sentiment.className}><SentimentIcon size={15} />{doc.sentiment_label}</span> : <span className="muted-label">No sentiment</span>}{doc.risk_count ? <span className="risk-label">{doc.risk_count} risk{doc.risk_count === 1 ? "" : "s"}</span> : <span className="muted-label">No risks</span>}<ArrowUpRight size={16} /></div>
    </Link>
  );
}

function MarketSection({ label, market, docs }: { label: string; market: "US" | "India"; docs: Document[] }) {
  return <section className="market-section"><div className="market-heading"><div><span className="mono-label">{market === "US" ? "002" : "003"} - Market sample</span><h2>{label}</h2></div><span className="market-count">{docs.length} records</span></div>{docs.length ? <div className="document-grid">{docs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}</div> : <p className="market-empty">No matching {market} disclosures.</p>}</section>;
}
