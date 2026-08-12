import { TriangleAlert } from "lucide-react";
import { listDocuments, type Document } from "@/lib/api";
import { DashboardExplorer } from "@/components/DashboardExplorer";

export default async function DashboardPage() {
  let documents: Document[] = [];
  let error: string | null = null;
  try { documents = await listDocuments(); } catch (e) { error = e instanceof Error ? e.message : "Failed to load documents"; }
  return <div className="dashboard-page page-container">
    <section className="dashboard-hero"><div><p className="eyebrow"><span>001 - Disclosure index</span><i /></p><h1>Read the market<br /><em>between the lines.</em></h1></div><p className="dashboard-intro">A comparative research index for sentiment, risk, and financial signals in corporate disclosures across the United States and India.</p></section>
    <div className="research-ticker"><span>US / India</span><span>10 sector-matched pairs</span><span>Single-quarter pilot</span><span>LLM-assisted extraction</span></div>
    {error ? <div className="editorial-error"><TriangleAlert size={18} /><div><strong>Couldn&apos;t reach the disclosure API.</strong><p>{error}</p><span>Start the FastAPI backend and refresh this index.</span></div></div> : <>
      {documents.length === 0 ? <div className="empty-state">No documents in the database yet. Run <code>scripts/embed_and_store.py</code> to populate the corpus.</div> : <DashboardExplorer documents={documents} />}
    </>}
  </div>;
}
