"""Regression checks for the expanded raw disclosure corpus."""

import unittest
from pathlib import Path

from scripts.chunk_documents import chunk_text, parse_header


EXPECTED_EXPANSION_FILES = [
    Path("data/raw/us/NVDA_Q2FY26_earnings_transcript.txt"),
    Path("data/raw/india/DIXON_Q1FY27_concall_transcript.txt"),
    Path("data/raw/us/CAT_Q2FY26_earnings_transcript.txt"),
    Path("data/raw/india/LT_Q1FY27_concall_transcript.txt"),
    Path("data/raw/us/KO_Q2FY26_earnings_transcript.txt"),
    Path("data/raw/india/VBL_Q2CY26_concall_transcript.txt"),
]


class RawExpansionTests(unittest.TestCase):
    def test_expansion_files_are_parseable_and_chunkable(self):
        for path in EXPECTED_EXPANSION_FILES:
            with self.subTest(path=str(path)):
                self.assertTrue(path.exists(), f"missing raw disclosure file: {path}")
                meta, body = parse_header(path.read_text())

                self.assertEqual({"Company", "Market", "Doc type", "Period", "Source"}, set(meta))
                self.assertGreaterEqual(len(body.split()), 220)
                self.assertGreaterEqual(len(chunk_text(body)), 2)


if __name__ == "__main__":
    unittest.main()
