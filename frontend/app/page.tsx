import Link from "next/link";
import { listDocuments, type Document } from "@/lib/api";

function Badge({ children, tone }: { children: React.ReactNode; tone: "us" | "india" }) {
  const cls =
    tone === "us"
      ? "bg-blue-100 text-blue-800"
      : "bg-orange-100 text-orange-800";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>
  );
}

export default async function DashboardPage() {
  let documents: Document[] = [];
  let error: string | null = null;
  try {
    documents = await listDocuments();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load documents";
  }

  const us = documents.filter((d) => d.market === "US");
  const india = documents.filter((d) => d.market === "India");

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Couldn&apos;t reach the backend.</p>
        <p className="text-sm">{error}</p>
        <p className="mt-2 text-sm">
          Is the FastAPI backend running and is <code>NEXT_PUBLIC_API_URL</code> set correctly?
        </p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="text-slate-600">
        No documents in the database yet. Run <code>scripts/embed_and_store.py</code> first.
      </p>
    );
  }

  const renderGroup = (label: string, tone: "us" | "india", docs: Document[]) => (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold">{label}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {docs.map((doc) => (
          <Link
            key={doc.id}
            href={`/documents/${doc.id}`}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-400"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="font-medium">{doc.company}</span>
              <Badge tone={tone}>{doc.ticker}</Badge>
            </div>
            <p className="text-sm text-slate-600">
              {doc.doc_type} · {doc.fiscal_period ?? "period n/a"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Companies</h1>
      {renderGroup("US", "us", us)}
      {renderGroup("India", "india", india)}
    </div>
  );
}
