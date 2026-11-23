"use client";

/** Shared company picker for Library and Compare; filtering never changes alphabetical order. */
import {useId, useMemo, useState} from "react";
import {Search} from "lucide-react";
import type {Document} from "@/lib/api";
import {CompanyAvatar} from "@/components/CompanyAvatar";
import {searchCompanies} from "@/lib/company-browser.cjs";

export type CompanyOption = {company: string; ticker: string; market: "US" | "India"; documents: Document[]};

/** Show matching suggestions above a scrollable, single-column company list. */
export function CompanyBrowser({options, selectedTicker, onSelect, label, compact = false}: {
  options: CompanyOption[];
  selectedTicker?: string;
  onSelect: (ticker: string) => void;
  label: string;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const matches = useMemo(() => searchCompanies(options, query) as CompanyOption[], [options, query]);
  const suggestions = matches.slice(0, 3);

  return (
    <section className="rounded-2xl border border-[#393939] bg-white p-4 shadow-sm sm:p-5" aria-label={label}>
      <label htmlFor={inputId} className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#a9a9a9]">Search companies</label>
      <div className="flex items-center gap-2 rounded-xl border border-[#505050] bg-[#101010] px-3 focus-within:border-[#e0e0e0] focus-within:ring-2 focus-within:ring-[#555555]">
        <Search className="h-4 w-4 shrink-0 text-[#a9a9a9]" aria-hidden="true" />
        <input id={inputId} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${label.toLowerCase()} by name or ticker`} className="w-full bg-transparent py-3 text-sm text-[#f4f4f4] outline-none placeholder:text-[#999999]" />
      </div>
      <div className="mt-4 border-b border-[#393939] pb-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#999999]">Suggestions</p>
        <div className="flex flex-wrap gap-2" aria-label={`${label} suggestions`}>
          {suggestions.length ? suggestions.map(option => (
            <button key={option.ticker} type="button" onClick={() => onSelect(option.ticker)} className="rounded-full border border-[#393939] bg-[#101010] px-3 py-1 text-xs font-medium text-[#dedede] transition-colors hover:border-[#e0e0e0] hover:text-[#f4f4f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0e0e0]">
              {option.company}
            </button>
          )) : <span className="text-xs text-[#999999]">No suggestions match.</span>}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-[#999999]">
        <span>All companies · A–Z</span><span>{matches.length}</span>
      </div>
      <div className={`mt-2 space-y-2 overflow-y-auto pr-1 ${compact ? "max-h-[250px]" : "max-h-[540px]"}`} role="list">
        {matches.map(option => {
          const isSelected = option.ticker === selectedTicker;
          return <div key={`${option.market}:${option.ticker}`} role="listitem">
            <button type="button" onClick={() => onSelect(option.ticker)} aria-pressed={isSelected} className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0e0e0] ${isSelected ? "border-[#e0e0e0] bg-[#292929] shadow-sm" : "border-[#393939] bg-white hover:border-[#8d8d8d] hover:bg-[#101010]"}`}>
              <CompanyAvatar ticker={option.ticker} />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#f4f4f4]">{option.company}</span><span className="text-xs text-[#a9a9a9]">{option.ticker} · {option.documents.length} disclosure{option.documents.length === 1 ? "" : "s"}</span></span>
              <span className="text-xs font-semibold text-[#999999]" aria-hidden="true">→</span>
            </button>
          </div>;
        })}
        {!matches.length && <p className="rounded-xl border border-dashed border-[#393939] p-5 text-center text-sm text-[#a9a9a9]">No companies match “{query}”.</p>}
      </div>
    </section>
  );
}
