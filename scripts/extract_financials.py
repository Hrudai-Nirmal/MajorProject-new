"""
Extract traditional financial ratios per docs/METHODOLOGY.md §B, one pass
per document (concatenating that document's chunks back into full text,
since the ratios are usually stated once in a "financial results" section
rather than scattered evenly across chunks).

IMPORTANT: the prompt explicitly instructs the model to only report figures
that are EXPLICITLY STATED in the text, and to leave anything not disclosed
as null rather than estimating or computing it from other numbers. This
pilot has only one quarter per company, so YoY/QoQ deltas can only come from
whatever comparison the transcript itself states -- there's no prior-period
data in this database to compute them from independently. Fabricating
plausible-looking numbers here would be worse than leaving fields empty,
since financial figures read as authoritative.

Usage:
    python scripts/extract_financials.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from openai import OpenAI  # noqa: E402
from app.config import GROQ_API_KEY, GROQ_BASE_URL  # noqa: E402
from app.services.supabase_client import get_client  # noqa: E402

MODEL = "openai/gpt-oss-120b"
client_groq = OpenAI(api_key=GROQ_API_KEY, base_url=GROQ_BASE_URL)

PROMPT = """You are a financial analyst extracting structured data from an earnings call /
concall transcript excerpt. Extract ONLY figures that are EXPLICITLY STATED in the text below.
Do NOT compute, estimate, or infer any value that isn't directly stated -- if a figure isn't
mentioned, use null for it. Do not confuse currency: report the currency actually used in the
text (USD, INR, etc.) in the "currency" field.

CRITICAL: for any raw monetary amount (revenue, free_cash_flow), the numeric value ALONE is
meaningless without its magnitude -- "$94 billion" must become {{"revenue": 94, "revenue_unit":
"billion"}}, NOT just {{"revenue": 94}} with no unit (that would misleadingly read as $94). Always
fill in the matching _unit field (e.g. "billion", "million", "crore", "lakh") whenever you report
a raw amount. Percentages (margins, growth rates) don't need a unit field, they're always %.

Company: {company} ({ticker}, {market} market), {doc_type}, {fiscal_period}

Transcript excerpt:
\"\"\"{full_text}\"\"\"

Extract and respond ONLY with valid JSON in exactly this shape (use null for anything not
explicitly stated in the text -- do not guess):
{{
  "currency": "USD" or "INR" or null,
  "revenue": <number or null>,
  "revenue_unit": "billion" or "crore" or null,
  "revenue_growth_yoy_pct": <number or null>,
  "revenue_growth_qoq_pct": <number or null>,
  "gross_margin_pct": <number or null>,
  "operating_margin_pct": <number or null>,
  "net_margin_pct": <number or null>,
  "ebitda_margin_pct": <number or null>,
  "eps_growth_yoy_pct": <number or null>,
  "free_cash_flow": <number or null>,
  "free_cash_flow_unit": "billion" or "crore" or null,
  "constant_currency_growth_pct": <number or null>,
  "sector_specific": {{}},
  "notes": "<1-2 sentences on what standard ratios were NOT disclosed in this excerpt>"
}}

For sector_specific, only include keys that apply and are stated: rotce_pct (banks, e.g. JPMorgan),
credit_deposit_ratio_pct (banks, e.g. HDFC Bank), attrition_rate_pct (IT services, e.g. TCS/Infosys).
Leave sector_specific as {{}} if none of these are stated or don't apply to this company.
"""


def main():
    client = get_client()

    documents = client.table("documents").select("*").execute().data
    existing = client.table("financial_snapshots").select("document_id").execute().data
    already_done = {row["document_id"] for row in existing}

    todo = [d for d in documents if d["id"] not in already_done]
    print(f"{len(documents)} documents total, {len(already_done)} already have a financial snapshot, {len(todo)} to process.")

    for i, doc in enumerate(todo, 1):
        chunks = (
            client.table("chunks")
            .select("chunk_index, text")
            .eq("document_id", doc["id"])
            .order("chunk_index")
            .execute()
            .data
        )
        full_text = "\n\n".join(c["text"] for c in chunks)

        prompt = PROMPT.format(
            company=doc["company"],
            ticker=doc["ticker"],
            market=doc["market"],
            doc_type=doc["doc_type"],
            fiscal_period=doc.get("fiscal_period") or "unknown period",
            full_text=full_text,
        )

        response = client_groq.chat.completions.create(
            model=MODEL,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
        )
        result = json.loads(response.choices[0].message.content)

        client.table("financial_snapshots").insert(
            {
                "document_id": doc["id"],
                "currency": result.get("currency"),
                "revenue": result.get("revenue"),
                "revenue_unit": result.get("revenue_unit"),
                "revenue_growth_yoy_pct": result.get("revenue_growth_yoy_pct"),
                "revenue_growth_qoq_pct": result.get("revenue_growth_qoq_pct"),
                "gross_margin_pct": result.get("gross_margin_pct"),
                "operating_margin_pct": result.get("operating_margin_pct"),
                "net_margin_pct": result.get("net_margin_pct"),
                "ebitda_margin_pct": result.get("ebitda_margin_pct"),
                "eps_growth_yoy_pct": result.get("eps_growth_yoy_pct"),
                "free_cash_flow": result.get("free_cash_flow"),
                "free_cash_flow_unit": result.get("free_cash_flow_unit"),
                "constant_currency_growth_pct": result.get("constant_currency_growth_pct"),
                "sector_specific": result.get("sector_specific", {}),
                "notes": result.get("notes"),
                "model_used": MODEL,
            }
        ).execute()

        print(f"  [{i}/{len(todo)}] {doc['company']}: revenue={result.get('revenue')} {result.get('revenue_unit')} {result.get('currency')}, "
              f"rev_growth_yoy={result.get('revenue_growth_yoy_pct')}%")

    print("\nDone.")


if __name__ == "__main__":
    main()
