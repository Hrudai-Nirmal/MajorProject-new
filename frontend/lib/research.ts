/** Build evidence views on the server so vectors and full text never enter the browser bundle. */
import corpus from "@/research-data/corpus.json";
import index from "@/research-data/index.json";
import {
  rankPassages,
  quarterKey,
  answerSentence,
} from "./research-engine.cjs";

export type Publication = (typeof corpus.documents)[number];
export type Passage = (typeof corpus.passages)[number];
export const publications = [...corpus.documents].sort(
  (a, b) =>
    a.company.localeCompare(b.company) ||
    quarterKey(b.fiscal_period) - quarterKey(a.fiscal_period),
);
export const passages = corpus.passages;
/** Retrieve the sentence in the cited passage most closely related to the question. */
export const answerFromPassage = (
  question: string,
  row: Passage,
): string | null => answerSentence(question, row.text, index);
export const byId = new Map(publications.map((doc) => [doc.id, doc]));
const passageById = new Map(passages.map((row) => [row.id, row]));
const searchIndex = {
  ...index,
  passages: index.passages.map((p) => ({
    ...p,
    text: passageById.get(p.id)?.text,
  })),
};
export const sourceNames: Record<string, string> = {
  summary_excerpt: "Summary excerpt",
  official_release_excerpt: "Release excerpt",
  full_transcript: "Transcript-derived",
};
export const period = (doc: Publication) =>
  doc.fiscal_period.split(" (")[0].replace(/(FY|CY)(\d{2})$/, "$120$2");
export const ticker = (doc: Publication) =>
  ({ HDFC: "HDFCBANK", RIL: "RELIANCE" })[doc.ticker] || doc.ticker;
/** Return only passages within the active disclosure set and above the relevance threshold. */
export function searchEvidence(
  query: string,
  docs: Publication[],
  limit = 8,
): Passage[] {
  const allowed = new Set(docs.map((doc) => doc.id));
  const ranked = rankPassages(
    query.slice(0, 400),
    searchIndex,
    passages.filter((row) => allowed.has(row.document_id)).map((row) => row.id),
  );
  return ranked
    .slice(0, limit)
    .map((hit: { id: string }) => passageById.get(hit.id)!);
}
/** Preserve source and period when evidence is carried into the brief. */
export function cite(row: Passage) {
  const doc = byId.get(row.document_id)!;
  return {
    id: row.id,
    company: doc.company,
    period: period(doc),
    text: row.text,
    url: doc.url,
    href: `/research/source/${doc.id}#passage-${row.id}`,
  };
}
