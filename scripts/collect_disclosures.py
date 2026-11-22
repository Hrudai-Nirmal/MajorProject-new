"""Collect bounded excerpts from verified company earnings releases.

The source list is deliberately curated. Each record retains its original URL and
is marked as an excerpt so the benchmark never treats it as a full transcript.
"""

import re
import html
import subprocess
import tempfile
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

MAX_WORDS_PER_DOCUMENT = 650
MIN_WORDS_PER_DOCUMENT = 100
USER_AGENT = "MajorProject research collector (academic, contact via repository)"

SOURCES = [
    ("us", "Microsoft Corporation", "MSFT", "Q4 FY2026", "MSFT_Q4FY26_official_release", "https://www.microsoft.com/en-us/investor/earnings/fy-2026-q4/press-release-webcast"),
    ("us", "Microsoft Corporation", "MSFT", "Q1 FY2027", "MSFT_Q1FY27_official_release", "https://www.microsoft.com/en-us/investor/earnings/fy-2027-q1/press-release-webcast"),
    ("us", "Apple Inc.", "AAPL", "Q3 FY2026", "AAPL_Q3FY26_official_release", "https://www.apple.com/newsroom/2026/07/apple-reports-third-quarter-results/"),
    ("us", "Apple Inc.", "AAPL", "Q4 FY2026", "AAPL_Q4FY26_official_release", "https://www.apple.com/newsroom/2026/11/apple-reports-fourth-quarter-results/"),
    ("india", "Tata Consultancy Services", "TCS", "Q1 FY2027", "TCS_Q1FY27_official_release", "https://www.tcs.com/who-we-are/newsroom/press-release/tcs-financial-results-q1-fy-2027"),
    ("india", "Tata Consultancy Services", "TCS", "Q2 FY2027", "TCS_Q2FY27_official_release", "https://www.tcs.com/who-we-are/newsroom/press-release/tcs-financial-results-q2-fy-2027"),
    ("india", "Infosys Ltd", "INFY", "Q1 FY2027", "INFY_Q1FY27_official_release", "https://www.infosys.com/investors/reports-filings/quarterly-results/2026-2027/q1/documents/ifrs-usd-press-release.pdf"),
    ("india", "Infosys Ltd", "INFY", "Q2 FY2027", "INFY_Q2FY27_official_release", "https://www.infosys.com/investors/reports-filings/quarterly-results/2026-2027/q2/documents/ifrs-usd-press-release.pdf"),
]


class MainTextParser(HTMLParser):
    """Keep readable blocks inside the primary page content."""

    def __init__(self):
        super().__init__()
        self.depth = 0
        self.skip_depth = 0
        self.blocks = []
        self.current = []

    def handle_starttag(self, tag, attrs):
        if tag in {"main", "article"}:
            self.depth += 1
        if self.depth and tag in {"script", "style", "nav", "footer", "header"}:
            self.skip_depth += 1
        if self.depth and not self.skip_depth and tag in {"p", "h1", "h2", "h3", "li"}:
            self.current = []

    def handle_data(self, value):
        if self.depth and not self.skip_depth:
            self.current.append(value)

    def handle_endtag(self, tag):
        if self.depth and not self.skip_depth and tag in {"p", "h1", "h2", "h3", "li"}:
            block = re.sub(r"\s+", " ", "".join(self.current)).strip()
            if block:
                self.blocks.append(block)
            self.current = []
        if self.depth and tag in {"script", "style", "nav", "footer", "header"} and self.skip_depth:
            self.skip_depth -= 1
        if tag in {"main", "article"} and self.depth:
            self.depth -= 1


def extract_html_text(content: bytes) -> str:
    """Extract primary article text while excluding page chrome."""
    decoded = content.decode("utf-8", errors="replace")
    apple_blocks = re.findall(r'<div class="pagebody-copy"[^>]*>(.*?)</div>', decoded, re.DOTALL)
    if apple_blocks:
        return "\n\n".join(
            re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", block))).strip()
            for block in apple_blocks
        )
    parser = MainTextParser()
    parser.feed(decoded)
    return "\n\n".join(parser.blocks)


def select_excerpt(content: str, max_words: int = MAX_WORDS_PER_DOCUMENT) -> str:
    """Select complete leading paragraphs within a predictable chunk budget."""
    selected = []
    word_count = 0
    for paragraph in content.split("\n\n"):
        paragraph = paragraph.strip()
        count = len(paragraph.split())
        if not paragraph or not count:
            continue
        if word_count + count > max_words:
            break
        selected.append(paragraph)
        word_count += count
    return "\n\n".join(selected)


def fetch_source(url: str) -> str:
    """Fetch a public company release and extract its text."""
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        content = response.read()
    if url.endswith(".pdf"):
        with tempfile.NamedTemporaryFile(suffix=".pdf") as pdf_file:
            pdf_file.write(content)
            pdf_file.flush()
            result = subprocess.run(["pdftotext", "-layout", pdf_file.name, "-"], capture_output=True, text=True, check=True)
            return "\n\n".join(line.strip() for line in result.stdout.splitlines() if line.strip())
    return extract_html_text(content)


def main():
    """Write source-backed excerpts, retaining originals and reporting failures."""
    created = 0
    for market, company, ticker, period, doc_id, url in SOURCES:
        path = Path("data/raw") / market / f"{doc_id}.txt"
        if path.exists():
            print(f"SKIP existing {doc_id}")
            continue
        try:
            excerpt = select_excerpt(fetch_source(url))
            if len(excerpt.split()) < MIN_WORDS_PER_DOCUMENT:
                raise ValueError(f"Only {len(excerpt.split())} readable words")
            header = (
                f"Company: {company} ({ticker})\nMarket: {'US' if market == 'us' else 'India'}\n"
                f"Doc type: earnings_release\nPeriod: {period}\nSource fidelity: official_release_excerpt\n"
                f"Source: {url}\n\n"
            )
            path.write_text(header + excerpt + "\n", encoding="utf-8")
            created += 1
            print(f"ADDED {doc_id}: {len(excerpt.split())} words")
        except (OSError, ValueError, subprocess.CalledProcessError) as error:
            print(f"FAILED {doc_id}: {error}")
    print(f"Added {created} documents")


if __name__ == "__main__":
    main()
