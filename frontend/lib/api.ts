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
  avg_sentiment_score?: number | null;
  sentiment_label?: string | null;
  risk_count?: number;
};

export type RiskEntry = {
  flag: string;
  company: string;
  ticker: string;
  market: string;
  document_id: string;
};

export type TopicEntry = {
  topic: string;
  count: number;
  companies: string[];
};

export type RisksTopics = {
  risks: RiskEntry[];
  topics: TopicEntry[];
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
  chunks: { chunk_index: number; text: string } | null;
};

export type ClassMetrics = {
  precision: number;
  recall: number;
  f1: number;
  support: number;
};

export type MarketMetrics = {
  per_class: Record<string, ClassMetrics>;
  macro_f1: number;
  accuracy: number;
  n: number;
};

export type Metrics = {
  status: string;
  total_benchmark_rows?: number;
  labeled_rows?: number;
  note?: string;
  skipped_missing_model_prediction?: number;
  US?: MarketMetrics;
  India?: MarketMetrics;
  cross_market_gap?: {
    macro_f1_us: number;
    macro_f1_india: number;
    gap: number;
  };
};

export type FinancialSnapshot = {
  id: string;
  document_id: string;
  currency: string | null;
  revenue: number | null;
  revenue_unit: string | null;
  revenue_growth_yoy_pct: number | null;
  revenue_growth_qoq_pct: number | null;
  gross_margin_pct: number | null;
  operating_margin_pct: number | null;
  net_margin_pct: number | null;
  ebitda_margin_pct: number | null;
  eps_growth_yoy_pct: number | null;
  free_cash_flow: number | null;
  free_cash_flow_unit: string | null;
  constant_currency_growth_pct: number | null;
  sector_specific: Record<string, number>;
  notes: string | null;
  model_used: string | null;
} | null;

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

export class NoModelOutputError extends Error {
  constructor(message = "The model completed the request without returning an answer.") {
    super(message);
    this.name = "NoModelOutputError";
  }
}

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

export async function getFinancials(documentId: string): Promise<FinancialSnapshot> {
  const res = await fetch(`${API_URL}/api/documents/${documentId}/financials`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load financials (${res.status})`);
  return res.json();
}

export async function getRisksTopics(): Promise<RisksTopics> {
  const res = await fetch(`${API_URL}/api/documents/risks-topics`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load risks/topics (${res.status})`);
  return res.json();
}

export async function getMetrics(): Promise<Metrics> {
  const res = await fetch(`${API_URL}/api/documents/metrics`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load metrics (${res.status})`);
  return res.json();
}

export async function askQuestion(
  question: string,
  market?: string,
  top_k = 5
): Promise<ChatResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const res = await fetch(`${API_URL}/api/chat/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, market: market || null, top_k }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Chat request failed (${res.status})`);

    const rawPayload = await res.text();
    if (!rawPayload.trim()) {
      throw new NoModelOutputError();
    }

    let payload: Partial<ChatResponse>;
    try {
      payload = JSON.parse(rawPayload) as Partial<ChatResponse>;
    } catch {
      throw new NoModelOutputError("The model response arrived in an unreadable format.");
    }
    if (typeof payload.answer !== "string" || !payload.answer.trim()) {
      throw new NoModelOutputError();
    }

    return {
      answer: payload.answer.trim(),
      sources: Array.isArray(payload.sources) ? payload.sources : [],
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new NoModelOutputError("The model did not return an answer within 45 seconds.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
