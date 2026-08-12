"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bot,
  Clock3,
  ExternalLink,
  Loader2,
  MessageSquareText,
  Search,
  SendHorizontal,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { askQuestion, NoModelOutputError, type ChatSource } from "@/lib/api";
import { ModelOutputModal } from "@/components/ModelOutputModal";

const SUGGESTIONS = [
  "What risks did Apple management mention?",
  "How did TCS attrition trend?",
  "What did Infosys say about margins?",
];

type ChatHistoryItem = {
  id: string;
  question: string;
  market: string;
  answer: string;
  sources: ChatSource[];
  createdAt: string;
};

const CHAT_HISTORY_KEY = "cross-market-chat-history";

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const [market, setMarket] = useState<string>("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<ChatSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askedQuestion, setAskedQuestion] = useState<string | null>(null);
  const [modelOutputError, setModelOutputError] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [historyReady, setHistoryReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CHAT_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) setHistory(parsed.filter(isChatHistoryItem).slice(0, 10));
      }
    } catch {
      window.localStorage.removeItem(CHAT_HISTORY_KEY);
    } finally {
      setHistoryReady(true);
    }
  }, []);

  useEffect(() => {
    if (!historyReady) return;
    try {
      window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
    } catch {
      // History is an enhancement; chat remains usable if storage is unavailable.
    }
  }, [history, historyReady]);

  async function runQuestion(q: string, marketOverride = market) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setSources([]);
    setAskedQuestion(q);
    setModelOutputError(null);
    try {
      const res = await askQuestion(q, marketOverride || undefined);
      setAnswer(res.answer);
      setSources(res.sources);
      setHistory((current) => [{ id: `${Date.now()}`, question: q.trim(), market: marketOverride, answer: res.answer, sources: res.sources, createdAt: new Date().toISOString() }, ...current].slice(0, 10));
    } catch (err) {
      if (err instanceof NoModelOutputError) {
        setModelOutputError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  function restoreHistory(item: ChatHistoryItem) {
    setQuestion(item.question);
    setMarket(item.market);
    setAskedQuestion(item.question);
    setAnswer(item.answer);
    setSources(item.sources);
    setError(null);
    setModelOutputError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runQuestion(question);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <MessageSquareText className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Ask a question
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Answers are grounded only in the retrieved disclosure excerpts below — for
          research/educational purposes only, not investment advice.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row"
      >
        <div className="flex flex-1 items-center gap-2 px-2">
          <Search className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} />
          <input
            type="text"
            aria-label="Question for the disclosure corpus"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What risks did Apple management mention?"
            className="w-full border-0 bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Filter question by market"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All markets</option>
            <option value="US">US</option>
            <option value="India">India</option>
          </select>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
            ) : (
              <SendHorizontal className="h-4 w-4" strokeWidth={2.25} />
            )}
            {loading ? "Asking" : "Ask"}
          </button>
        </div>
      </form>

      {history.length > 0 && (
        <section className="chat-history" aria-labelledby="chat-history-title">
          <div className="chat-history-heading"><h2 id="chat-history-title"><Clock3 aria-hidden="true" size={15} /> Recent research</h2><button type="button" onClick={() => setHistory([])}><Trash2 aria-hidden="true" size={14} /> Clear</button></div>
          <div className="chat-history-list">
            {history.slice(0, 5).map((item) => <button type="button" key={item.id} onClick={() => restoreHistory(item)}><span>{item.question}</span><small>{item.market || "All markets"} / {formatHistoryTime(item.createdAt)}</small></button>)}
          </div>
        </section>
      )}

      {!askedQuestion && !loading && (
        <div className="mb-6 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => {
                setQuestion(s);
                runQuestion(s);
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-indigo-200 hover:text-indigo-600"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" strokeWidth={2.25} />
          Retrieving relevant excerpts and generating an answer…
        </div>
      )}

      {answer && !loading && (
        <div className="chat-answer mb-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Bot className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{answer}</p>
        </div>
      )}

      {answer && !loading && (
        <div className="follow-up-actions" aria-label="Suggested follow-up questions">
          <span className="mono-label">Continue research</span>
          {["Which risks were mentioned?", "Summarize the financial signals.", market === "US" ? "How does India compare?" : "How does the US compare?"].map((suggestion) => <button type="button" key={suggestion} onClick={() => { setQuestion(suggestion); runQuestion(suggestion); }}>{suggestion}</button>)}
        </div>
      )}

      {sources.length > 0 && !loading && (
        <div>
          <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Source excerpts
          </h2>
          <div className="space-y-2.5">
            {sources.map((s) => {
              const pct = Math.round(s.similarity * 100);
              return (
                <div
                  key={s.chunk_id}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          s.market === "US"
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {s.market}
                      </span>
                      {s.company} · <span className="capitalize">{s.doc_type.replace(/_/g, " ")}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span className="h-1 w-14 overflow-hidden rounded-full bg-slate-100">
                        <span
                          role="progressbar"
                          aria-label={`${s.company} source match`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={pct}
                          className="block h-full rounded-full bg-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      {pct}% match
                    </span>
                  </div>
                  <p className="leading-relaxed text-slate-700">{s.text}</p>
                  <Link className="source-link" href={`/documents/${s.document_id}#chunk-${encodeURIComponent(s.chunk_id)}`}><ExternalLink aria-hidden="true" size={13} /> Open cited disclosure</Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ModelOutputModal
        open={modelOutputError !== null}
        question={askedQuestion ?? question}
        reason={modelOutputError ?? "The model did not return an answer."}
        onClose={() => setModelOutputError(null)}
        onRetry={() => runQuestion(askedQuestion ?? question)}
      />
    </div>
  );
}

function isChatHistoryItem(value: unknown): value is ChatHistoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ChatHistoryItem>;
  return typeof item.id === "string" && typeof item.question === "string" && typeof item.answer === "string" && typeof item.createdAt === "string" && Array.isArray(item.sources);
}

function formatHistoryTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Earlier";
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(date);
}
