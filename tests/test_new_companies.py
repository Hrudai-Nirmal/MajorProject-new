"""Guard source provenance and bounded corpus size for the 2026 company expansion."""

import json
import unittest
from pathlib import Path

from scripts.chunk_documents import parse_header, chunk_text

ROOT = Path(__file__).resolve().parents[1]
DOCUMENTS = {
    "us/IBM_Q3CY26_official_release.txt": ("IBM", "US", "Q3 CY2026"),
    "us/ABNB_Q3CY26_official_release.txt": ("Airbnb, Inc.", "US", "Q3 CY2026"),
    "us/GOOGL_Q3CY26_official_release.txt": ("Alphabet Inc.", "US", "Q3 CY2026"),
    "india/WIPRO_Q2FY27_official_release.txt": ("Wipro Limited", "India", "Q2 FY2027"),
    "india/ICICIBANK_Q2FY27_official_release.txt": ("ICICI Bank Limited", "India", "Q2 FY2027"),
    "india/MARUTI_Q2FY27_official_release.txt": ("Maruti Suzuki India Limited", "India", "Q2 FY2027"),
}


class NewCompanyTests(unittest.TestCase):
    def test_releases_are_sourced_and_bounded(self):
        for filename, (company, market, period) in DOCUMENTS.items():
            with self.subTest(filename=filename):
                raw_text = (ROOT / "data/raw" / filename).read_text()
                metadata, body = parse_header(raw_text)
                self.assertIn(company, metadata["Company"])
                self.assertEqual(metadata["Market"], market)
                self.assertEqual(metadata["Period"], period)
                self.assertEqual(metadata["Source fidelity"], "official_release_excerpt")
                self.assertTrue(metadata["Source"].startswith("https://"))
                self.assertGreaterEqual(len(body.split()), 100)
                self.assertLessEqual(len(body.split()), 650)
                self.assertLessEqual(len(chunk_text(body)), 5)

    def test_published_catalog_includes_new_companies(self):
        catalog = json.loads((ROOT / "frontend/research-data/catalog.json").read_text())
        expected_tickers = {Path(filename).name.split("_")[0] for filename in DOCUMENTS}
        published_tickers = {document["ticker"] for document in catalog["documents"]}
        self.assertTrue(expected_tickers <= published_tickers)


if __name__ == "__main__":
    unittest.main()
