"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Search, Tag } from "lucide-react";
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

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row">
        <div className="flex flex-1 items-center gap-2 px-2">
          <Search className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search risks or company…"
            className="w-full border-0 bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
        </div>
        <select
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All markets</option>
          <option value="US">US</option>
          <option value="India">India</option>
        </select>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4 text-slate-400" strokeWidth={2} />
          <h2 className="text-sm font-semibold text-slate-900">
            Topics <span className="font-normal text-slate-400">({data.topics.length})</span>
          </h2>
          {activeTopic && (
            <button
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
                key={t.topic}
                onClick={() => setActiveTopic(active ? null : t.topic)}
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
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" strokeWidth={2} />
          <h2 className="text-sm font-semibold text-slate-900">
            Risks <span className="font-normal text-slate-400">({filteredRisks.length})</span>
          </h2>
        </div>
        {filteredRisks.length === 0 ? (
          <p className="text-sm text-slate-500">No risks match this filter.</p>
        ) : (
          <div className="space-y-2">
            {filteredRisks.map((r, i) => (
              <Link
                key={`${r.document_id}-${i}`}
                href={`/documents/${r.document_id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-sm shadow-sm transition-colors hover:border-amber-200"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
                  <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
                <span className="flex-1 text-slate-700">{r.flag}</span>
                <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-400">
                  <MarketDot market={r.market} />
                  {r.ticker}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
