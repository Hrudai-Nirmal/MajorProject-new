/** Server-side browse catalog, refreshed alongside the published research corpus. */
import catalog from "@/research-data/catalog.json";
import type {Document, FinancialSnapshot} from "./api";

export const documents = catalog.documents as Document[];
const financialsByDocument = new Map(catalog.financials.map(row => [row.document_id, row]));

/** Missing financial disclosures retain their empty snapshot state. */
export function publishedFinancials(documentId?: string): FinancialSnapshot {
  return (documentId && financialsByDocument.get(documentId) || null) as FinancialSnapshot;
}
