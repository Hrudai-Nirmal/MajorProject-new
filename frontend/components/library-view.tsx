"use client";

/** Library browse keeps selection in place so users can scan several companies quickly. */
import {useMemo, useState} from "react";
import {documents} from "@/lib/catalog";
import {getCompanyOptions} from "@/lib/company-browser.cjs";
import {CompanyBrowser, type CompanyOption} from "@/components/company-browser";
import {CompanyDetails} from "@/components/company-details";

const COMPANY_OPTIONS = getCompanyOptions(documents) as CompanyOption[];

/** Render a centered list that becomes a split workspace after selection. */
export default function LibraryView({searchParams}: {searchParams?: {company?: string}}) {
  const initialTicker = COMPANY_OPTIONS.find(option => option.documents.some(document => document.ticker === searchParams?.company))?.ticker;
  const [selectedTicker, setSelectedTicker] = useState(initialTicker);
  const selectedCompany = useMemo(() => COMPANY_OPTIONS.find(option => option.ticker === selectedTicker), [selectedTicker]);

  return <div className="workspace-wide">
    <header className="mb-7 text-center"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a9a9a9]">Disclosure library</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#f4f4f4]">Explore companies</h1><p className="mx-auto mt-2 max-w-xl text-sm text-[#a9a9a9]">Search {COMPANY_OPTIONS.length} companies across US and India, then inspect their financial signals and source disclosures here.</p></header>
    <div className={selectedCompany ? "workspace-split" : "mx-auto max-w-2xl"}>
      <div className={selectedCompany ? "workspace-half" : ""}><CompanyBrowser options={COMPANY_OPTIONS} selectedTicker={selectedTicker} onSelect={setSelectedTicker} label="All companies" /></div>
      {selectedCompany && <div className="workspace-half"><CompanyDetails option={selectedCompany} /></div>}
    </div>
  </div>;
}
