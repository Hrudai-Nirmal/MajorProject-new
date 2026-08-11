-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query)

create extension if not exists vector;

create table if not exists documents (
    id uuid primary key default gen_random_uuid(),
    doc_id text unique not null, -- stable slug from scripts/chunk_documents.py, e.g. AAPL_Q3FY25_earnings_transcript; lets embed_and_store.py upsert idempotently
    market text not null check (market in ('US', 'India')),
    company text not null,
    ticker text not null,
    doc_type text not null, -- '10-K' | '10-Q' | 'earnings_transcript' | 'annual_report' | 'nse_bse_announcement' | 'concall_transcript'
    source_url text,
    fiscal_period text,
    raw_text text,
    created_at timestamptz default now()
);

create table if not exists chunks (
    id uuid primary key default gen_random_uuid(),
    document_id uuid references documents(id) on delete cascade,
    chunk_index int not null,
    text text not null,
    embedding vector(768), -- gemini-embedding-001, truncated via outputDimensionality=768 (pgvector ivfflat/hnsw index cap out at 2000 dims, native 3072 output won't index)
    created_at timestamptz default now(),
    unique (document_id, chunk_index) -- lets embed_and_store.py upsert idempotently without re-embedding on rerun
);

-- NO ivfflat/hnsw index at this scale (deliberately). An ivfflat index with
-- lists=50 was tried and dropped after it caused match_chunks to silently
-- return ZERO rows for some real queries in production (confirmed live,
-- 2026-08-10: e.g. "What did Infosys say about margins?" returned empty via
-- both the RPC and raw SQL, while a sequential scan on the same query found
-- 5 clearly relevant chunks at similarity 0.68-0.76). Root cause: lists=50
-- massively over-partitions an index over just 36 rows, and ivfflat's
-- default single-probe search can miss the right list entirely for some
-- query vectors. A sequential scan over a few thousand rows is both exact
-- and effectively instant, so there's no reason to reintroduce an
-- approximate index until the table is large enough (pgvector's own
-- guidance: roughly rows/1000 lists, so this becomes worth revisiting
-- somewhere past ~10k+ chunks) -- and even then, re-tune lists/probes
-- rather than copying the value below back in.

create table if not exists extraction_results (
    id uuid primary key default gen_random_uuid(),
    chunk_id uuid references chunks(id) on delete cascade,
    sentiment_label text, -- positive | negative | neutral
    sentiment_score numeric,
    risk_flags jsonb,
    topics jsonb,
    summary text,
    model_used text,
    created_at timestamptz default now()
);

create table if not exists benchmark_labels (
    id uuid primary key default gen_random_uuid(),
    chunk_id uuid references chunks(id) on delete cascade,
    market text not null,
    gold_sentiment text,
    gold_risk_flags jsonb,
    gold_topics jsonb,
    lm_dictionary_score numeric, -- Loughran-McDonald precomputed aid
    labeled_by text,
    created_at timestamptz default now()
);

-- docs/METHODOLOGY.md §B: traditional financial ratios, one row per document.
-- Values are only ever what scripts/extract_financials.py's prompt found
-- EXPLICITLY STATED in the transcript text -- nulls mean "not disclosed in
-- this excerpt," not zero. sector_specific holds the per-sector ratios
-- (ROTCE for banks, credit-deposit ratio for HDFC, attrition rate for
-- TCS/Infosys) since those only apply to a subset of the 10 companies.
create table if not exists financial_snapshots (
    id uuid primary key default gen_random_uuid(),
    document_id uuid unique references documents(id) on delete cascade,
    currency text,
    revenue numeric,
    revenue_unit text, -- e.g. 'billion', 'crore' -- revenue alone is meaningless/misleading without this
    revenue_growth_yoy_pct numeric,
    revenue_growth_qoq_pct numeric,
    gross_margin_pct numeric,
    operating_margin_pct numeric,
    net_margin_pct numeric,
    ebitda_margin_pct numeric,
    eps_growth_yoy_pct numeric,
    free_cash_flow numeric,
    free_cash_flow_unit text,
    constant_currency_growth_pct numeric,
    sector_specific jsonb,
    notes text, -- model's caveats, e.g. which figures weren't disclosed
    model_used text,
    created_at timestamptz default now()
);

-- Row level security: lock down writes to service_role only, allow anon read
alter table documents enable row level security;
alter table chunks enable row level security;
alter table extraction_results enable row level security;
alter table benchmark_labels enable row level security;
alter table financial_snapshots enable row level security;

create policy "public read documents" on documents for select using (true);
create policy "public read chunks" on chunks for select using (true);
create policy "public read extraction_results" on extraction_results for select using (true);
create policy "public read benchmark_labels" on benchmark_labels for select using (true);
create policy "public read financial_snapshots" on financial_snapshots for select using (true);

-- service_role bypasses RLS by default, so no insert/update policy needed for the backend

-- RPC used by backend/app/services/retrieval.py for similarity search
create or replace function match_chunks(
    query_embedding vector(768),
    match_count int default 5,
    filter_market text default null
)
returns table (
    chunk_id uuid,
    document_id uuid,
    text text,
    company text,
    market text,
    doc_type text,
    similarity float
)
language sql stable
as $$
    select
        c.id as chunk_id,
        d.id as document_id,
        c.text,
        d.company,
        d.market,
        d.doc_type,
        1 - (c.embedding <=> query_embedding) as similarity
    from chunks c
    join documents d on d.id = c.document_id
    where filter_market is null or d.market = filter_market
    order by c.embedding <=> query_embedding
    limit match_count;
$$;
