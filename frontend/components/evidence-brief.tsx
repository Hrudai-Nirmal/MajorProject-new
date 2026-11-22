"use client";
/** Browser-local evidence collection shared by search, comparisons, and chat. */
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";

export type Citation = {
  id: string;
  company: string;
  period: string;
  text: string;
  url: string | null;
  href: string;
};
type Entry = Citation & { note: string };
const KEY = "disclosure-research-brief-v1";
function snapshot() {
  try {
    return localStorage.getItem(KEY) || "[]";
  } catch {
    return "[]";
  }
}
function subscribe(update: () => void) {
  window.addEventListener("storage", update);
  window.addEventListener(KEY, update);
  return () => {
    window.removeEventListener("storage", update);
    window.removeEventListener(KEY, update);
  };
}
function read(serialized: string): Entry[] {
  try {
    const rows = JSON.parse(serialized);
    return Array.isArray(rows)
      ? rows.filter(
          (r) => r && typeof r.id === "string" && typeof r.text === "string",
        )
      : [];
  } catch {
    return [];
  }
}
function store(rows: Entry[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event(KEY));
}
function useEntries() {
  return read(useSyncExternalStore(subscribe, snapshot, () => "[]"));
}
/** Save a cited passage with immediate confirmation. */
export function SaveEvidence({ citation }: { citation: Citation }) {
  const entries = useEntries(),
    saved = entries.some((r) => r.id === citation.id);
  const [error, setError] = useState("");
  return (
    <span>
      {saved ? (
        <Link className="desk-link" href="/brief">
          Saved · Open brief ↗
        </Link>
      ) : (
        <button
          className="desk-link"
          onClick={() => {
            try {
              const latest = read(snapshot());
              if (!latest.some((r) => r.id === citation.id))
                store([...latest, { ...citation, note: "" }]);
              setError("");
            } catch {
              setError("Browser storage is unavailable.");
            }
          }}
        >
          + Save passage
        </button>
      )}{" "}
      {error}
    </span>
  );
}
/** Edit notes, remove evidence, and export a concise printable research brief. */
export function Brief() {
  const entries = useEntries();
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  function change(id: string, note?: string) {
    try {
      const latest = read(snapshot());
      store(
        note === undefined
          ? latest.filter((r) => r.id !== id)
          : latest.map((r) => (r.id === id ? { ...r, note } : r)),
      );
      setError("");
    } catch {
      setError("Your browser could not save this change.");
    }
  }
  return (
    <section className="desk">
      <p className="eyebrow">Personal collection</p>
      <h1>Research brief</h1>
      <p className="lede">
        Collect passages, add your interpretation, and print your brief to PDF.
      </p>
      {error && <p role="alert">{error}</p>}
      {entries.length > 0 && (
        <div className="no-print">
          <button className="action" onClick={() => window.print()}>
            Export one-page brief
          </button>
          <p className="footnote">
            Print or save a PDF with highlights from your first three saved
            passages. Your full collection stays here.
          </p>
        </div>
      )}
      <div className="brief-sheet">
        <h2>Evidence highlights</h2>
        {entries.slice(0, 3).map((r) => (
          <article key={r.id}>
            <h3>
              {r.company} · {r.period}
            </h3>
            <p>{r.text.length > 330 ? r.text.slice(0, 327) + "…" : r.text}</p>
            {r.note && (
              <p>
                <strong>Note </strong>
                {r.note.length > 150 ? r.note.slice(0, 147) + "…" : r.note}
              </p>
            )}
            <a href={r.url || r.href}>Open cited disclosure ↗</a>
          </article>
        ))}
      </div>
      {ready && !entries.length && (
        <div className="panel">
          <h2>Your brief is empty</h2>
          <p>
            Use “Save passage” on a search result or comparison to start your
            brief.
          </p>
          <Link href="/" className="desk-link">
            Search disclosures →
          </Link>
        </div>
      )}
      {entries.map((r) => (
        <article className="panel" key={r.id}>
          <p className="eyebrow">
            {r.company} · {r.period}
          </p>
          <blockquote>{r.text}</blockquote>
          <a className="desk-link" href={r.url || r.href}>
            Disclosure source ↗
          </a>
          <label className="field no-print">
            Your note
            <textarea
              value={r.note}
              onChange={(e) => change(r.id, e.target.value)}
            />
          </label>
          <p className="print-note">{r.note}</p>
          <button className="desk-link no-print" onClick={() => change(r.id)}>
            Remove passage
          </button>
        </article>
      ))}
    </section>
  );
}
