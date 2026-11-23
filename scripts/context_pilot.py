"""Run a reproducible, model-referenced context experiment on local disclosures.

Samples one passage per company from summary excerpts in each market. A separate
model judges the target sentence with its source chunk visible. Results remain
model-referenced pilot observations until independent reviewers label them.
"""
import argparse
import json
import os
import random
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PREDICTOR = "qwen/qwen3.8-27b"
JUDGE = "openai/gpt-oss-120b"
LABELS = {"positive", "negative", "neutral"}


def get_target_sentence(text: str) -> str | None:
    """Find a substantive sentence that can be judged alone and in context."""
    for sentence in re.split(r"(?<=[.!?])\s+", text.replace("\n", " ")):
        candidate = re.sub(r"\[[^]]+\]", "", sentence).strip()
        word_count = len(candidate.split())
        if 18 <= word_count <= 45 and candidate[-1:] in ".!?":
            return candidate
    return None


def get_sample(chunks: list[dict], per_market: int = 10) -> list[dict]:
    """Choose a fixed, company-diverse sample with comparable source fidelity."""
    randomizer = random.Random(20261123)
    sample = []
    for market in ("US", "India"):
        candidates = [chunk for chunk in chunks if chunk["market"] == market
                      and chunk.get("source_fidelity") == "summary_excerpt"
                      and 90 <= len(chunk["text"].split()) <= 220
                      and get_target_sentence(chunk["text"])]
        randomizer.shuffle(candidates)
        selected_companies = set()
        for chunk in candidates:
            if chunk["company"] in selected_companies:
                continue
            sample.append(chunk)
            selected_companies.add(chunk["company"])
            if len(selected_companies) == per_market:
                break
        if len(selected_companies) < per_market:
            raise ValueError(f"Only {len(selected_companies)} eligible companies for {market}")
    return sample


def get_model_label(api_key: str, model: str, target: str, context: str = "") -> str:
    """Ask Groq for the sentiment of one fixed target sentence."""
    if not api_key or not target or model not in {PREDICTOR, JUDGE}:
        raise ValueError("API key, target, and supported model are required")
    prompt = ("Classify the sentiment expressed by the TARGET statement in a financial "
              "disclosure as positive, negative, or neutral. Judge the TARGET only. "
              "Use CONTEXT to interpret it when provided. Return JSON with one key, label.\n"
              f"TARGET: {target}\n")
    if context:
        prompt += f"CONTEXT: {context}\n"
    payload = json.dumps({"model": model, "temperature": 0,
                          "response_format": {"type": "json_object"},
                          "messages": [{"role": "user", "content": prompt}]}).encode()
    request = urllib.request.Request("https://api.groq.com/openai/v1/chat/completions",
                                     data=payload, headers={"Authorization": f"Bearer {api_key}",
                                                            "Content-Type": "application/json",
                                                            "User-Agent": "curl/8.7.1"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                answer = json.load(response)
            label = json.loads(answer["choices"][0]["message"]["content"])["label"].lower()
            if label not in LABELS:
                raise ValueError(f"Unsupported label: {label}")
            return label
        except urllib.error.HTTPError as error:
            if error.code not in {429, 500, 502, 503} or attempt == 3:
                detail = error.read().decode(errors="replace")[:300]
                raise RuntimeError(f"Groq request failed with HTTP {error.code}: {detail}") from None
            time.sleep(min(30, 5 * (attempt + 1)))
    raise RuntimeError("Groq request failed after retries")


def main() -> None:
    """Run paired predictions and save results outside the published benchmark."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "benchmark" / "context_pilot.json")
    arguments = parser.parse_args()
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise ValueError("GROQ_API_KEY is required")
    chunks = [json.loads(line) for line in (ROOT / "data/processed/chunks.jsonl").open()]
    sample = get_sample(chunks)
    observations = []
    for index, chunk in enumerate(sample, 1):
        target = get_target_sentence(chunk["text"])
        observation = {"doc_id": chunk["doc_id"], "chunk_index": chunk["chunk_index"],
                       "market": chunk["market"], "company": chunk["company"],
                       "target": target, "context_words": len(chunk["text"].split()),
                       "short_label": get_model_label(api_key, PREDICTOR, target),
                       "context_label": get_model_label(api_key, PREDICTOR, target, chunk["text"]),
                       "reference_label": get_model_label(api_key, JUDGE, target, chunk["text"])}
        observations.append(observation)
        print(f"Completed {index}/{len(sample)} {chunk['market']} {chunk['company']}", flush=True)
        arguments.output.parent.mkdir(parents=True, exist_ok=True)
        arguments.output.write_text(json.dumps({"predictor": PREDICTOR, "reference_model": JUDGE,
                                                 "sample_seed": 20261123,
                                                 "observations": observations}, indent=2) + "\n")


if __name__ == "__main__":
    main()
