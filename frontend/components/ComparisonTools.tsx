"use client";

import { useState } from "react";
import { BarChart3, Check, Download, Link2 } from "lucide-react";
import type { Document, FinancialSnapshot } from "@/lib/api";

type ComparisonCompany = Pick<Document, "company" | "ticker" | "market"> & {
  financials: FinancialSnapshot;
};

const METRICS: { key: keyof NonNullable<FinancialSnapshot>; label: string }[] = [
  { key: "revenue_growth_yoy_pct", label: "Revenue growth (YoY)" },
  { key: "gross_margin_pct", label: "Gross margin" },
  { key: "operating_margin_pct", label: "Operating margin" },
  { key: "net_margin_pct", label: "Net margin" },
  { key: "ebitda_margin_pct", label: "EBITDA margin" },
  { key: "eps_growth_yoy_pct", label: "EPS growth (YoY)" },
  { key: "constant_currency_growth_pct", label: "Constant-currency growth" },
];

export function ComparisonTools({ us, india }: { us: ComparisonCompany | null; india: ComparisonCompany | null }) {
  const [copied, setCopied] = useState(false);
  const availableMetrics = METRICS.filter(({ key }) => {
    const usValue = us?.financials?.[key];
    const indiaValue = india?.financials?.[key];
    return typeof usValue === "number" || typeof indiaValue === "number";
  });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function downloadCsv() {
    const headers = ["Metric", us?.ticker ?? "US", india?.ticker ?? "India"];
    const rows = [
      ["Company", us?.company ?? "", india?.company ?? ""],
      ["Revenue", formatRevenue(us?.financials), formatRevenue(india?.financials)],
      ...METRICS.map(({ key, label }) => [label, csvValue(us?.financials?.[key]), csvValue(india?.financials?.[key])]),
    ];
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${us?.ticker ?? "us"}-${india?.ticker ?? "india"}-comparison.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="comparison-insights" aria-labelledby="comparison-insights-title">
      <div className="section-heading-row">
        <div><span className="mono-label">Comparable signals</span><h2 id="comparison-insights-title">Percentage comparison</h2></div>
        <div className="comparison-actions">
          <button type="button" onClick={copyLink}>{copied ? <Check aria-hidden="true" size={15} /> : <Link2 aria-hidden="true" size={15} />}{copied ? "Copied" : "Copy link"}</button>
          <button type="button" onClick={downloadCsv}><Download aria-hidden="true" size={15} /> Export CSV</button>
        </div>
      </div>
      <p className="comparison-note">Percentage metrics are directly comparable. Revenue is excluded from the chart because companies may report different currencies and units.</p>
      {availableMetrics.length === 0 ? <div className="empty-state">No comparable percentage metrics were disclosed for this pair.</div> : (
        <div className="metric-comparison-list">
          {availableMetrics.map(({ key, label }) => {
            const usValue = numericValue(us?.financials?.[key]);
            const indiaValue = numericValue(india?.financials?.[key]);
            const max = Math.max(Math.abs(usValue ?? 0), Math.abs(indiaValue ?? 0), 1);
            return <div className="metric-comparison" key={key}>
              <div className="metric-comparison-title"><BarChart3 aria-hidden="true" size={15} /><strong>{label}</strong></div>
              <MetricBar label={us?.ticker ?? "US"} value={usValue} max={max} />
              <MetricBar label={india?.ticker ?? "India"} value={indiaValue} max={max} />
            </div>;
          })}
        </div>
      )}
    </section>
  );
}

function MetricBar({ label, value, max }: { label: string; value: number | null; max: number }) {
  const width = value === null ? 0 : Math.max((Math.abs(value) / max) * 100, 2);
  return <div className="metric-bar-row"><span>{label}</span><div className="metric-bar-track"><i style={{ width: `${width}%` }} /></div><strong>{value === null ? "—" : `${value}%`}</strong></div>;
}

function numericValue(value: unknown) {
  return typeof value === "number" ? value : null;
}

function csvValue(value: unknown) {
  return typeof value === "number" ? `${value}%` : "";
}

function formatRevenue(financials: FinancialSnapshot | undefined) {
  if (!financials || financials.revenue === null) return "";
  return [String(financials.revenue), financials.revenue_unit, financials.currency].filter(Boolean).join(" ");
}
