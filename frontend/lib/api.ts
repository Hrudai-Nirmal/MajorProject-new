const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Document = {
  id: string;
  doc_id: string;
  market: "US" | "India";
  company: string;
  ticker: string;
  doc_type: string;
  source_url: string | null;
  fiscal_period: string | null;
  created_at: string;
};

export type Extraction = {
  id: string;
  chunk_id: string;
  sentiment_label: string | null;
  sentiment_score: number | null;
  risk_flags: string[];
  topics: string[];
  summary: string | null;
  model_used: string | null;
};

export type ChatSource = {
  chunk_id: string;
  document_id: string;
  text: string;
  company: string;
  market: string;
  doc_type: string;
  similarity: number;
};

export type ChatResponse = {
  answer: string;
  sources: ChatSource[];
};

export async function listDocuments(market?: string): Promise<Document[]> {
  const url = new URL(`${API_URL}/api/documents/`);
  if (market) url.searchParams.set("market", market);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load documents (${res.status})`);
  return res.json();
}

export async function getDocument(documentId: string): Promise<Document | null> {
  const res = await fetch(`${API_URL}/api/documents/${documentId}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load document (${res.status})`);
  return res.json();
}

export async function getExtractions(documentId: string): Promise<Extraction[]> {
  const res = await fetch(`${API_URL}/api/documents/${documentId}/extractions`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load extractions (${res.status})`);
  return res.json();
}

export async function getMetrics(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_URL}/api/documents/metrics`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load metrics (${res.status})`);
  return res.json();
}

export async function askQuestion(
  question: string,
  market?: string,
  top_k = 5
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, market: market || null, top_k }),
  });
  if (!res.ok) throw new Error(`Chat request failed (${res.status})`);
  return res.json();
}
