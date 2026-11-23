/** Compact disclosure details shown beside company selection on browse routes. */
import Link from "next/link";
import {ArrowUpRight, FileText} from "lucide-react";
import type {FinancialSnapshot} from "@/lib/api";
import {publishedFinancials} from "@/lib/catalog";
import {CompanyAvatar} from "@/components/CompanyAvatar";
import type {CompanyOption} from "@/components/company-browser";

function formatMoney(value: number | null | undefined, unit: string | null | undefined, currency: string | null | undefined) {
  return value == null ? "Not disclosed" : [value.toLocaleString(), unit, currency].filter(Boolean).join(" ");
}

function formatPercent(value: number | null | undefined) {
  return value == null ? "Not disclosed" : `${value}%`;
}

/** Show the most recent snapshot and links to every collected disclosure. */
export function CompanyDetails({option}: {option?: CompanyOption}) {
  if (!option) return <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-[#505050] bg-[#101010] p-8 text-center text-sm text-[#a9a9a9]">Select a company to inspect its disclosures.</div>;
  const document = option.documents[0];
  const financials: FinancialSnapshot = publishedFinancials(document.id);
  const metrics = [
    ["Revenue", formatMoney(financials?.revenue, financials?.revenue_unit, financials?.currency)],
    ["Revenue growth YoY", formatPercent(financials?.revenue_growth_yoy_pct)],
    ["Gross margin", formatPercent(financials?.gross_margin_pct)],
    ["Operating margin", formatPercent(financials?.operating_margin_pct)],
  ];
  return <section className="rounded-2xl border border-[#393939] bg-white p-5 shadow-sm sm:p-6" aria-label={`${option.company} details`}>
    <div className="flex items-start gap-4 border-b border-[#393939] pb-5">
      <CompanyAvatar ticker={option.ticker} size="lg" />
      <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#a9a9a9]">{option.market} · {option.ticker}</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-[#f4f4f4]">{option.company}</h2><p className="mt-1 text-sm text-[#a9a9a9]">{option.documents.length} collected disclosure{option.documents.length === 1 ? "" : "s"}</p></div>
    </div>
    <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium"><span className="rounded-full bg-[#292929] px-3 py-1 text-[#dedede]">{document.fiscal_period || "Period unavailable"}</span><span className="rounded-full bg-[#292929] px-3 py-1 capitalize text-[#dedede]">{document.sentiment_label || "Analysis pending"} sentiment</span>{document.risk_count ? <span className="rounded-full bg-[#40351d] px-3 py-1 text-amber-200">{document.risk_count} risk flags</span> : null}</div>
    <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-[#a9a9a9]">Financial snapshot</h3>
    <dl className="mt-3 grid grid-cols-2 gap-3">{metrics.map(([label, value]) => <div key={label} className="rounded-xl border border-[#393939] bg-[#101010] p-3"><dt className="text-xs text-[#a9a9a9]">{label}</dt><dd className="mt-1 text-sm font-semibold text-[#f4f4f4]">{value}</dd></div>)}</dl>
    {financials?.notes && <p className="mt-3 text-xs leading-relaxed text-[#a9a9a9]">{financials.notes}</p>}
    <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-[#a9a9a9]">Disclosures</h3>
    <div className="mt-2 space-y-2">{option.documents.map(item => <Link key={item.id} href={`/documents/${item.id}`} className="flex items-center gap-3 rounded-xl border border-[#393939] p-3 text-sm transition-colors hover:border-[#e0e0e0] hover:bg-[#101010] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0e0e0]"><FileText className="h-4 w-4 shrink-0 text-[#a9a9a9]" /><span className="min-w-0 flex-1"><span className="block font-medium text-[#f4f4f4]">{item.fiscal_period || item.doc_type.replaceAll("_", " ")}</span><span className="block text-xs text-[#a9a9a9]">{item.doc_type.replaceAll("_", " ")} · {item.source_fidelity?.replaceAll("_", " ") || "Source excerpt"}</span></span><ArrowUpRight className="h-4 w-4 text-[#a9a9a9]" /></Link>)}</div>
  </section>;
}
