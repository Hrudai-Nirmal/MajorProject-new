"use client";

import { useState } from "react";
import { askQuestion, type ChatSource } from "@/lib/api";

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const [market, setMarket] = useState<string>("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<ChatSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await askQuestion(question, market || undefined);
      setAnswer(res.answer);
      setSources(res.sources);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Ask a question</h1>
      <p className="mb-4 text-sm text-slate-600">
        Answers are grounded only in the retrieved disclosure excerpts below — for
        research/educational purposes only, not investment advice.
      </p>

      <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What risks did Apple management mention?"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All markets</option>
          <option value="US">US</option>
          <option value="India">India</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Asking..." : "Ask"}
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {answer && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <p className="whitespace-pre-wrap text-sm">{answer}</p>
        </div>
      )}

      {sources.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-slate-500">Source excerpts</h2>
          <div className="space-y-2">
            {sources.map((s) => (
              <div key={s.chunk_id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {s.company} · {s.market} · {s.doc_type}
                  </span>
                  <span>similarity {s.similarity.toFixed(3)}</span>
                </div>
                <p className="text-slate-700">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
