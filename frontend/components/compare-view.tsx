"use client";

/** Market columns keep their own search and company selection in view. */
import Link from "next/link";
import {useMemo, useState} from "react";
import {GitCompareArrows} from "lucide-react";
import {documents} from "@/lib/catalog";
import {getCompanyOptions} from "@/lib/company-browser.cjs";
import {CompanyBrowser, type CompanyOption} from "@/components/company-browser";
import {CompanyDetails} from "@/components/company-details";

const COMPANY_OPTIONS = getCompanyOptions(documents) as CompanyOption[];
const US_OPTIONS = COMPANY_OPTIONS.filter(option => option.market === "US");
const INDIA_OPTIONS = COMPANY_OPTIONS.filter(option => option.market === "India");

/** Compare one selected company from each market without navigation. */
export default function CompareView({searchParams}: {searchParams?: {us?: string; india?: string}}) {
  const initialUs = US_OPTIONS.find(option => option.documents.some(document => document.ticker === searchParams?.us))?.ticker ?? US_OPTIONS[0]?.ticker;
  const initialIndia = INDIA_OPTIONS.find(option => option.documents.some(document => document.ticker === searchParams?.india))?.ticker ?? INDIA_OPTIONS[0]?.ticker;
  const [usTicker, setUsTicker] = useState(initialUs);
  const [indiaTicker, setIndiaTicker] = useState(initialIndia);
  const usCompany = useMemo(() => US_OPTIONS.find(option => option.ticker === usTicker), [usTicker]);
  const indiaCompany = useMemo(() => INDIA_OPTIONS.find(option => option.ticker === indiaTicker), [indiaTicker]);

  return <div>
    <header className="mb-7"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#444444] text-white"><GitCompareArrows className="h-4 w-4" /></span><h1 className="text-3xl font-semibold tracking-tight text-[#f4f4f4]">Compare markets</h1></div><p className="mt-2 max-w-2xl text-sm text-[#a9a9a9]">Choose a US company on the left and an India company on the right. Search and financial details stay visible for each market.</p></header>
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <div className="space-y-4"><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#b1b1b1]">United States</h2><CompanyBrowser options={US_OPTIONS} selectedTicker={usTicker} onSelect={setUsTicker} label="US companies" compact /><CompanyDetails option={usCompany} /></div>
      <div className="space-y-4"><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#b1b1b1]">India</h2><CompanyBrowser options={INDIA_OPTIONS} selectedTicker={indiaTicker} onSelect={setIndiaTicker} label="India companies" compact /><CompanyDetails option={indiaCompany} /></div>
    </div>
    {usCompany && indiaCompany && <p className="mt-5 text-center text-sm"><Link href={`/research/pair?left=${usCompany.documents[0].id}&right=${indiaCompany.documents[0].id}`} className="font-semibold text-[#f4f4f4] underline underline-offset-4 hover:text-[#b1b1b1]">Ask a question about this pair →</Link></p>}
  </div>;
}
