"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Download, List, Search, Tag, Users, X } from "lucide-react";
import Link from "next/link";
import type { RisksTopics } from "@/lib/api";

function MarketDot({ market }: { market: string }) {
  return (
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        market === "US" ? "bg-indigo-500" : "bg-amber-500"
      }`}
    />
  );
}

export function RisksExplorer({ data }: { data: RisksTopics }) {
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState<string>("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [groupByCompany, setGroupByCompany] = useState(false);

  const filteredRisks = useMemo(() => {
    return data.risks.filter((r) => {
      if (market && r.market !== market) return false;
      if (activeTopic) {
        // topics aren't attached per-risk directly, so topic filtering only
        // narrows by company (a risk from a company that discussed the topic)
        const key = `${r.ticker}|${r.market}`;
        const topic = data.topics.find((t) => t.topic === activeTopic);
        if (!topic?.companies.includes(key)) return false;
      }
      if (query && !r.flag.toLowerCase().includes(query.toLowerCase()) && !r.company.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [data.risks, data.topics, query, market, activeTopic]);

  const maxTopicCount = Math.max(...data.topics.map((t) => t.count), 1);
  const usCount = data.risks.filter((risk) => risk.market === "US").length;
  const indiaCount = data.risks.filter((risk) => risk.market === "India").length;
  const groupedRisks = useMemo(() => {
    return filteredRisks.reduce<Record<string, typeof filteredRisks>>((groups, risk) => {
      const key = `${risk.company}|${risk.ticker}|${risk.market}`;
      (groups[key] ??= []).push(risk);
      return groups;
    }, {});
  }, [filteredRisks]);

  function resetFilters() {
    setQuery("");
    setMarket("");
    setActiveTopic(null);
  }

  function exportRisks() {
    const rows = [["Company", "Ticker", "Market", "Risk"], ...filteredRisks.map((risk) => [risk.company, risk.ticker, risk.market, risk.flag])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "filtered-disclosure-risks.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <section className="risk-summary" aria-label="Risk summary">
        <div><span className="mono-label">All risks</span><strong>{data.risks.length}</strong></div>
        <div><span className="mono-label">US signals</span><strong>{usCount}</strong></div>
        <div><span className="mono-label">India signals</span><strong>{indiaCount}</strong></div>
        <div><span className="mono-label">Topics</span><strong>{data.topics.length}</strong></div>
      </section>
      <div className="mb-6 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row">
        <div className="flex flex-1 items-center gap-2 px-2">
          <Search className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} />
          <input
            type="text"
            aria-label="Search risks or company"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search risks or company…"
            className="w-full border-0 bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
        </div>
        <select
          aria-label="Filter risks by market"
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All markets</option>
          <option value="US">US</option>
          <option value="India">India</option>
        </select>
        {(query || market || activeTopic) && <button type="button" onClick={resetFilters} className="inline-flex items-center justify-center gap-1.5 px-3 text-xs"><X aria-hidden="true" size={14} /> Reset</button>}
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4 text-slate-400" strokeWidth={2} />
          <h2 className="text-sm font-semibold text-slate-900">
            Topics <span className="font-normal text-slate-400">({data.topics.length})</span>
          </h2>
          {activeTopic && (
            <button
              type="button"
              onClick={() => setActiveTopic(null)}
              className="ml-auto text-xs font-medium text-indigo-600 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.topics.map((t) => {
            const active = activeTopic === t.topic;
            const scale = 0.75 + (t.count / maxTopicCount) * 0.4;
            return (
              <button
                type="button"
                key={t.topic}
                onClick={() => setActiveTopic(active ? null : t.topic)}
                aria-pressed={active}
                style={{ fontSize: `${scale * 0.75}rem` }}
                className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                }`}
              >
                {t.topic} <span className="opacity-60">{t.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="risk-list-heading mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" strokeWidth={2} />
          <h2 className="text-sm font-semibold text-slate-900">
            Risks <span className="font-normal text-slate-400">({filteredRisks.length})</span>
          </h2>
          <div className="risk-view-actions">
            <button type="button" aria-pressed={!groupByCompany} onClick={() => setGroupByCompany(false)}><List aria-hidden="true" size={14} /> List</button>
            <button type="button" aria-pressed={groupByCompany} onClick={() => setGroupByCompany(true)}><Users aria-hidden="true" size={14} /> Companies</button>
            <button type="button" onClick={exportRisks} disabled={!filteredRisks.length}><Download aria-hidden="true" size={14} /> Export</button>
          </div>
        </div>
        {filteredRisks.length === 0 ? (
          <p className="text-sm text-slate-500">No risks match this filter.</p>
        ) : groupByCompany ? (
          <div className="risk-company-groups">
            {Object.entries(groupedRisks).map(([key, risks]) => {
              const first = risks[0];
              return <section key={key} className="risk-company-group"><div className="risk-company-header"><div><strong>{first.company}</strong><span>{first.ticker} / {first.market}</span></div><span className="mono-label">{risks.length} signal{risks.length === 1 ? "" : "s"}</span></div><div>{risks.map((risk, index) => <RiskLink key={`${risk.document_id}-${index}`} risk={risk} />)}</div></section>;
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRisks.map((risk, index) => <RiskLink key={`${risk.document_id}-${index}`} risk={risk} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function RiskLink({ risk }: { risk: RisksTopics["risks"][number] }) {
  return <Link href={`/documents/${risk.document_id}`} className="risk-entry flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-sm shadow-sm transition-colors hover:border-amber-200"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100"><AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.25} /></span><span className="flex-1 text-slate-700">{risk.flag}</span><span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-400"><MarketDot market={risk.market} />{risk.ticker}</span></Link>;
}
