/** Server-rendered evidence views share filters, citations, and stable URLs. */
import Link from "next/link";
import {
  ArrowUpRight,
  Search,
  GitCompareArrows,
  History,
  Layers,
  Scale,
} from "lucide-react";
import {
  answerFromPassage,
  byId,
  cite,
  passages,
  period,
  publications,
  searchEvidence,
  sourceNames,
  ticker,
  type Passage,
  type Publication,
} from "@/lib/research";
import { quarterKey } from "@/lib/research-engine.cjs";
import { SaveEvidence } from "./evidence-brief";
import { ResearchForm } from "./research-form";

type Params = Record<string, string | undefined>;
/** Treat repeated URL parameters as one selection, as the filter controls do. */
export function singleFilters(
  input: Record<string, string | string[] | undefined>,
): Params {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
}
const unique = (items: string[]) => Array.from(new Set(items)).sort();
const label = (doc: Publication) =>
  [ticker(doc), period(doc), sourceNames[doc.source_fidelity]].join(" · ");
const TOOLS = [
  [
    "/research/pair",
    "Ask both companies",
    "Compare answers to one question.",
    GitCompareArrows,
  ],
  [
    "/research/history",
    "Quarterly changes",
    "Trace a topic across two periods.",
    History,
  ],
  [
    "/research/disagreements",
    "Label disagreements",
    "Inspect the passages behind the score.",
    Scale,
  ],
  [
    "/research/coverage",
    "Dataset coverage",
    "Browse periods, sources, and models.",
    Layers,
  ],
] as const;

function Select({
  name,
  title,
  values,
  current,
  all,
}: {
  name: string;
  title: string;
  values: string[][];
  current?: string;
  all?: string;
}) {
  return (
    <label className="field">
      {title}
      <select aria-label={title} name={name} defaultValue={current || ""}>
        {all && <option value="">{all}</option>}
        {values.map(([value, title]) => (
          <option key={value} value={value}>
            {title || value}
          </option>
        ))}
      </select>
    </label>
  );
}
function Query({
  current,
  placeholder,
}: {
  current?: string;
  placeholder: string;
}) {
  return (
    <label className="query">
      <Search size={19} />
      <input
        aria-label="Research question"
        name="q"
        type="search"
        maxLength={400}
        required
        defaultValue={current}
        placeholder={placeholder}
      />
    </label>
  );
}
function Evidence({ row, question }: { row: Passage; question?: string }) {
  const doc = byId.get(row.document_id)!;
  const citation = cite(row);
  return (
    <article className="panel">
      <div className="meta">
        {ticker(doc)} <span>·</span> {doc.market} <span>·</span> {period(doc)}
      </div>
      <h3>{doc.company}</h3>
      {question && (
        <p className="answer">
          {answerFromPassage(question, row) ||
            "No clear answer found. Inspect the related passage below."}
        </p>
      )}
      <details open={!question}>
        <summary>
          Source passage {row.chunk_index + 1} ·{" "}
          {sourceNames[doc.source_fidelity]}
        </summary>
        <blockquote>{row.text}</blockquote>
      </details>
      <div className="actions">
        <SaveEvidence citation={citation} />
        <a className="desk-link" href={citation.href}>
          Open passage ↗
        </a>
      </div>
    </article>
  );
}
const marketOptions = [["US"], ["India"]];
function filterDocs(params: Params) {
  return publications.filter(
    (d) =>
      (!params.market || params.market === d.market) &&
      (!params.ticker || params.ticker === ticker(d)) &&
      (!params.period || params.period === period(d)) &&
      (!params.source || params.source === d.source_fidelity),
  );
}
function Filters({ params }: { params: Params }) {
  return (
    <div className="fields">
      <Select
        name="market"
        title="Market"
        all="Both markets"
        current={params.market}
        values={marketOptions}
      />
      <Select
        name="ticker"
        title="Company"
        all="All companies"
        current={params.ticker}
        values={unique(publications.map(ticker)).map((v) => [v])}
      />
      <Select
        name="period"
        title="Quarter"
        all="All quarters"
        current={params.period}
        values={unique(publications.map(period)).map((v) => [v])}
      />
      <Select
        name="source"
        title="Source"
        all="All source types"
        current={params.source}
        values={Object.entries(sourceNames)}
      />
    </div>
  );
}

/** Search the published corpus using a precomputed semantic index. */
export function SearchDesk({ params }: { params: Params }) {
  const query = params.q?.trim();
  const results = query ? searchEvidence(query, filterDocs(params)) : [];
  const filtered = Object.values(params).some(Boolean);
  return (
    <section className="desk">
      <div className="mast">
        <p className="eyebrow">Disclosure research desk</p>
        <h1>Search disclosures</h1>
        <p className="lede">
          Find what companies in the US and India said about a topic, then read
          the passage in context.
        </p>
        <ResearchForm
          key={JSON.stringify(params)}
          action="/"
          className="search-form"
        >
          <div className="query-line">
            <Query
              current={query}
              placeholder="What did management say about demand?"
            />
            <button className="action">Search</button>
          </div>
          <Filters params={params} />
        </ResearchForm>
        <div className="actions">
          <span className="muted">Try a topic</span>
          {["Margin pressure", "Delayed client spending", "AI investment"].map(
            (q) => (
              <Link
                className="chip"
                key={q}
                href={`/?q=${encodeURIComponent(q)}`}
              >
                {q}
              </Link>
            ),
          )}
        </div>
      </div>
      {query ? (
        <>
          <div className="section-line">
            <h2>
              {results.length ? "Matching passages" : "No matching passages"}
            </h2>
            <Link href="/">Clear search</Link>
          </div>
          {!results.length && <p>Try a broader topic or remove a filter.</p>}
          {results.map((row) => (
            <Evidence row={row} key={row.id} />
          ))}
        </>
      ) : (
        <>
          <div className="section-line">
            <h2>Research tools</h2>
            <Link href="/library">Document library ↗</Link>
          </div>
          <div className="tool-grid">
            {TOOLS.map(([href, title, desc, Icon]) => (
              <Link className="tool" href={href} key={href}>
                <Icon size={22} />
                <h3>{title}</h3>
                <p>{desc}</p>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
        </>
      )}
      {!filtered && (
        <p className="footnote">
          {publications.length} disclosures · {passages.length} passages ·{" "}
          {passages.filter((p) => p.gold).length} benchmark labels
        </p>
      )}
    </section>
  );
}
/** Inspect source and model coverage or the subset where predictions disagree. */
export function AuditDesk({
  params,
  coverage,
}: {
  params: Params;
  coverage: boolean;
}) {
  const docs = filterDocs(params);
  const ids = new Set(docs.map((d) => d.id));
  const rows = passages.filter((r) => ids.has(r.document_id));
  const labeled = rows.filter((r) => r.gold && r.label);
  const disagreements = labeled.filter((r) => r.gold !== r.label);
  return (
    <section className="desk">
      <p className="eyebrow">Corpus audit</p>
      <h1>{coverage ? "Dataset coverage" : "Label disagreements"}</h1>
      <p className="lede">
        {coverage
          ? "Inspect the sources and models behind each disclosure."
          : "Compare the extraction model’s prediction with the AI benchmark label, then read the passage yourself."}
      </p>
      <ResearchForm key={JSON.stringify(params)} className="panel">
        <Filters params={params} />
        <button className="action">Apply filters</button>
      </ResearchForm>
      <div className="section-line">
        <h2>
          {coverage
            ? `${docs.length} disclosures`
            : `${disagreements.length} disagreements`}
        </h2>
        <span>
          {labeled.length} labeled / {rows.length} passages
        </span>
      </div>
      {coverage ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  "Company / quarter",
                  "Market",
                  "Source",
                  "Extraction model",
                  "Labeled / total",
                ].map((v) => (
                  <th key={v}>{v}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => {
                const group = rows.filter((r) => r.document_id === doc.id);
                return (
                  <tr key={doc.id}>
                    <td>
                      <Link href={`/research/source/${doc.id}`}>
                        {ticker(doc)} · {period(doc)}
                      </Link>
                    </td>
                    <td>{doc.market}</td>
                    <td>{sourceNames[doc.source_fidelity]}</td>
                    <td>
                      {unique(group.map((r) => r.model || "Pending")).join(
                        ", ",
                      )}
                    </td>
                    <td>
                      {group.filter((r) => r.gold).length} / {group.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        disagreements.map((r) => (
          <div key={r.id}>
            <p className="verdict">
              Prediction <strong>{r.label}</strong> <span> / </span> Benchmark{" "}
              <strong>{r.gold}</strong>
            </p>
            <Evidence row={r} />
          </div>
        ))
      )}
      {(!docs.length || (!coverage && !disagreements.length)) && (
        <p>
          No records match this view. Adjust the filters to explore more
          evidence.
        </p>
      )}
    </section>
  );
}

/** Compare the strongest matching evidence from two explicitly selected disclosures. */
export function CompareDesk({
  params,
  history,
}: {
  params: Params;
  history: boolean;
}) {
  const tickers = unique(publications.map(ticker)).filter(
    (t) =>
      new Set(
        publications
          .filter((d) => ticker(d) === t)
          .map((d) => quarterKey(period(d))),
      ).size > 1,
  );
  const selectedTicker = tickers.includes(params.ticker || "")
    ? params.ticker!
    : "INFY";
  const docs = history
    ? publications
        .filter((d) => ticker(d) === selectedTicker)
        .sort((a, b) => quarterKey(period(a)) - quarterKey(period(b)))
    : publications;
  const first =
    docs.find((d) => d.id === params.left) ||
    (history ? docs[0] : docs.find((d) => d.ticker === "MSFT")!);
  const second =
    docs.find((d) => d.id === params.right) ||
    (history ? docs[docs.length - 1] : docs.find((d) => d.ticker === "INFY")!);
  const error = history
    ? quarterKey(period(first)) >= quarterKey(period(second))
    : ticker(first) === ticker(second);
  const query = params.q?.trim();
  const options = docs.map((d) => [d.id, label(d)]);
  return (
    <section className="desk">
      <p className="eyebrow">
        {history ? "Company history" : "Cross-company research"}
      </p>
      <h1>{history ? "Quarterly changes" : "Ask both companies"}</h1>
      <p className="lede">
        {history
          ? "Choose an earlier and a later disclosure, then trace the same topic across both."
          : "Ask one question across two disclosures. Each side shows the closest matching sentence and its source passage."}
      </p>
      {history && (
        <div className="actions">
          {tickers.map((t) => (
            <Link
              className={t === selectedTicker ? "chip selected" : "chip"}
              href={`/research/history?ticker=${t}`}
              key={t}
            >
              {t}
            </Link>
          ))}
        </div>
      )}
      <ResearchForm key={JSON.stringify(params)} className="panel">
        {history && (
          <input type="hidden" name="ticker" value={selectedTicker} />
        )}
        <div className="fields">
          <Select
            name="left"
            title={history ? "Earlier disclosure" : "First disclosure"}
            current={first.id}
            values={options}
          />
          <Select
            name="right"
            title={history ? "Later disclosure" : "Second disclosure"}
            current={second.id}
            values={options}
          />
        </div>
        <div className="query-line">
          <Query
            current={query || "How did revenue change?"}
            placeholder="Ask about demand, risks, or margins"
          />
          <button className="action">Compare</button>
        </div>
      </ResearchForm>
      {query &&
        (error ? (
          <p role="alert">
            {history
              ? "Select two distinct quarters in chronological order."
              : "Select disclosures from two different companies."}
          </p>
        ) : (
          <div className="pair">
            {[first, second].map((doc) => {
              const hit = searchEvidence(query, [doc], 1)[0];
              return (
                <div key={doc.id}>
                  <p className="eyebrow">{label(doc)}</p>
                  {hit ? (
                    <Evidence question={query} row={hit} />
                  ) : (
                    <p className="panel">
                      No matching passage found for this question.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
    </section>
  );
}
