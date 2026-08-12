"use client";

import { useRouter } from "next/navigation";

type Option = { ticker: string; company: string };

export function CompareSelector({
  usOptions,
  indiaOptions,
  selectedUs,
  selectedIndia,
}: {
  usOptions: Option[];
  indiaOptions: Option[];
  selectedUs: string;
  selectedIndia: string;
}) {
  const router = useRouter();

  function go(us: string, india: string) {
    router.push(`/compare?us=${encodeURIComponent(us)}&india=${encodeURIComponent(india)}`);
  }

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
          US company
        </span>
        <select
          aria-label="US company"
          value={selectedUs}
          onChange={(e) => go(e.target.value, selectedIndia)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        >
          {usOptions.map((o) => (
            <option key={o.ticker} value={o.ticker}>
              {o.company} ({o.ticker})
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
          India company
        </span>
        <select
          aria-label="India company"
          value={selectedIndia}
          onChange={(e) => go(selectedUs, e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        >
          {indiaOptions.map((o) => (
            <option key={o.ticker} value={o.ticker}>
              {o.company} ({o.ticker})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
