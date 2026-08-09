"""
Clean + chunk the raw disclosure text files in data/raw/{us,india}/ into
~500-800 word chunks with metadata, ready for embedding.

Usage:
    python scripts/chunk_documents.py

Output:
    data/processed/chunks.jsonl  -- one JSON object per chunk:
        {
            "company": "Microsoft Corporation",
            "ticker": "MSFT",
            "market": "US",
            "doc_type": "earnings_transcript",
            "period": "Q4 FY2025",
            "source": "...",
            "doc_id": "MSFT_Q4FY25_earnings_transcript",
            "chunk_index": 0,
            "text": "..."
        }

No network calls, no external deps beyond the stdlib -- safe to run
anywhere, including this dev sandbox.
"""
import json
import re
from pathlib import Path

RAW_DIRS = [Path("data/raw/us"), Path("data/raw/india")]
OUT_PATH = Path("data/processed/chunks.jsonl")

CHUNK_TARGET_WORDS = 180   # smaller chunks so the shorter search-summary
                            # documents still split into multiple chunks
CHUNK_OVERLAP_WORDS = 30

HEADER_FIELDS = ["Company", "Market", "Doc type", "Period", "Call date", "Source"]


def parse_header(text: str) -> tuple[dict, str]:
    """Split the leading 'Field: value' header block from the body text."""
    lines = text.splitlines()
    meta = {}
    body_start = 0
    for i, line in enumerate(lines):
        m = re.match(r"^([A-Za-z ]+):\s*(.*)$", line)
        if m and m.group(1).strip() in HEADER_FIELDS:
            meta[m.group(1).strip()] = m.group(2).strip()
            body_start = i + 1
        elif line.strip() == "" and meta:
            body_start = i + 1
            break
    body = "\n".join(lines[body_start:]).strip()
    return meta, body


def extract_ticker(company_field: str) -> str:
    m = re.search(r"\(([A-Z]+)\)", company_field)
    return m.group(1) if m else company_field.split()[0]


def clean_text(text: str) -> str:
    # strip the "--- SECTION HEADER ---" markers but keep them as light
    # separators so downstream chunking doesn't glue unrelated sections
    text = re.sub(r"-{3,}\s*(.*?)\s*-{3,}", r"\n[\1]\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_text(text: str, target_words=CHUNK_TARGET_WORDS, overlap=CHUNK_OVERLAP_WORDS) -> list[str]:
    """Chunk on paragraph boundaries, packing paragraphs up to ~target_words,
    with a small word-overlap carried into the next chunk for retrieval
    continuity."""
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks = []
    current_words: list[str] = []

    for para in paragraphs:
        para_words = para.split()
        if len(current_words) + len(para_words) > target_words and current_words:
            chunks.append(" ".join(current_words))
            # carry the tail of the previous chunk forward as overlap
            current_words = current_words[-overlap:] if overlap else []
        current_words.extend(para_words)

    if current_words:
        chunks.append(" ".join(current_words))

    return chunks


def main():
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    total_chunks = 0

    with open(OUT_PATH, "w") as out_f:
        for raw_dir in RAW_DIRS:
            if not raw_dir.exists():
                continue
            for file_path in sorted(raw_dir.glob("*.txt")):
                raw_text = file_path.read_text()
                meta, body = parse_header(raw_text)
                if not meta:
                    print(f"WARNING: no header parsed for {file_path}, skipping")
                    continue

                company_field = meta.get("Company", file_path.stem)
                ticker = extract_ticker(company_field)
                company_name = re.sub(r"\s*\([A-Z]+\)\s*$", "", company_field).strip()

                cleaned = clean_text(body)
                text_chunks = chunk_text(cleaned)

                for idx, chunk in enumerate(text_chunks):
                    record = {
                        "company": company_name,
                        "ticker": ticker,
                        "market": meta.get("Market", ""),
                        "doc_type": meta.get("Doc type", ""),
                        "period": meta.get("Period", ""),
                        "source": meta.get("Source", ""),
                        "doc_id": file_path.stem,
                        "chunk_index": idx,
                        "word_count": len(chunk.split()),
                        "text": chunk,
                    }
                    out_f.write(json.dumps(record) + "\n")
                    total_chunks += 1

                print(f"{file_path.name}: {len(text_chunks)} chunks")

    print(f"\nTotal chunks written to {OUT_PATH}: {total_chunks}")


if __name__ == "__main__":
    main()
