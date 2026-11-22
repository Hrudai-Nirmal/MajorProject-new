"""Publish a read-only research snapshot and a latent semantic search index.

Run from the repository root with uv run --with numpy --with-requirements
backend/requirements.txt python scripts/export_research.py. NumPy (BSD) is
used only at export time for singular value decomposition.
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from app.services.supabase_client import get_client
from app.routers.documents import _attach_sentiment_summary

STOP = set("about after also an and are as at be before by can company did do does during for from had has have how in into is it its management of on or our quarter said say that the their this to was we were what which who with would year".split())


def fetch_rows(client, table, fields):
    """Page in stable order so the export also works beyond one API page."""
    rows = []
    while True:
        page = client.table(table).select(fields).order("id").range(len(rows), len(rows)+499).execute().data
        rows.extend(page)
        if len(page) < 500:
            return rows


def build_index(passages):
    """Project query terms and disclosure text into the same TF-IDF/SVD space."""
    counts = []
    for row in passages:
        content = " ".join([row["text"],row["summary"] or "", *row["topics"]])
        counts.append(Counter(term for term in re.findall(r"[a-z]{2,}", content.lower()) if term not in STOP))
    vocabulary = sorted(set().union(*counts))
    matrix = np.array([[row[t] for t in vocabulary] for row in counts], dtype=float)
    idf = 1 + np.log((1+len(counts))/(1+(matrix>0).sum(axis=0)))
    matrix = np.log1p(matrix)*idf
    matrix /= np.maximum(1e-9,np.linalg.norm(matrix,axis=1,keepdims=True))
    _, _, basis = np.linalg.svd(matrix, full_matrices=False)
    basis = basis[:48].T
    vectors = matrix @ basis
    vectors /= np.maximum(1e-9,np.linalg.norm(vectors,axis=1,keepdims=True))
    return {"terms":dict(zip(vocabulary,(basis*idf[:,None]).round(5).tolist())),
            "passages":[{"id":row["id"],"vector":vec} for row,vec in zip(passages,vectors.round(5).tolist())]}


def build_catalog(client):
    """Publish card summaries and financials once for the two browse routes."""
    docs = fetch_rows(client, "documents", "id,doc_id,company,ticker,market,doc_type,source_url,fiscal_period,source_fidelity,created_at")
    financials = fetch_rows(client, "financial_snapshots", "*")
    return {"documents": _attach_sentiment_summary(client, docs), "financials": financials}


def main():
    """Export public fields, keeping credentials and embeddings out of client bundles."""
    client = get_client()
    docs = fetch_rows(client,"documents","id,company,ticker,market,fiscal_period,source_fidelity,source_url")
    chunks = fetch_rows(client,"chunks","id,document_id,text,chunk_index")
    predictions = {r["chunk_id"]:r for r in fetch_rows(client,"extraction_results","chunk_id,model_used,sentiment_label,topics,summary")}
    labels = {r["chunk_id"]:r["gold_sentiment"] for r in fetch_rows(client,"benchmark_labels","chunk_id,gold_sentiment")}
    for doc in docs:
        url = re.search(r"https?://[^\s)]+",doc.pop("source_url") or "")
        doc["url"] = url.group().rstrip(".,") if url else None
    for chunk in chunks:
        pred = predictions.get(chunk["id"],{})
        chunk.update(model=pred.get("model_used"), label=pred.get("sentiment_label"), gold=labels.get(chunk["id"]),
                     topics=pred.get("topics") or [],summary=pred.get("summary"))
    output = ROOT/"frontend"/"research-data"
    output.mkdir(exist_ok=True)
    metrics=json.loads((ROOT/"benchmark"/"metrics.json").read_text())
    if metrics["labeled_rows"] != sum(bool(row["gold"]) for row in chunks):
        raise ValueError("Rerun benchmark evaluation before publishing the snapshot.")
    for name, content in [("corpus",{"documents":docs,"passages":chunks}),("index",build_index(chunks)),("metrics",metrics),("catalog",build_catalog(client))]:
        (output/f"{name}.json").write_text(json.dumps(content,separators=(",",":"))+"\n")


if __name__ == "__main__":
    main()
