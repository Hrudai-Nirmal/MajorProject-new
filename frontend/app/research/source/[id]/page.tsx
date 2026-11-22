/** Stable citation targets in the same published snapshot as the search results. */
import Link from "next/link";
import { notFound } from "next/navigation";
import { byId, cite, passages, period, sourceNames } from "@/lib/research";
import { SaveEvidence } from "@/components/evidence-brief";
export default function Source({ params }: { params: { id: string } }) {
  const doc = byId.get(params.id);
  if (!doc) notFound();
  return (
    <section className="desk">
      <p className="eyebrow">
        {doc.market} · {sourceNames[doc.source_fidelity]}
      </p>
      <h1>{doc.company}</h1>
      <p className="lede">{period(doc)}</p>
      <div className="actions">
        {doc.url && <a href={doc.url}>Original publication ↗</a>}
        <Link href={`/documents/${doc.id}`}>Financial snapshot →</Link>
      </div>
      {passages
        .filter((r) => r.document_id === doc.id)
        .sort((a, b) => a.chunk_index - b.chunk_index)
        .map((row) => (
          <article
            className="panel cited"
            key={row.id}
            id={`passage-${row.id}`}
          >
            <p className="eyebrow">Passage {row.chunk_index + 1}</p>
            <blockquote>{row.text}</blockquote>
            <SaveEvidence citation={cite(row)} />
          </article>
        ))}
    </section>
  );
}
