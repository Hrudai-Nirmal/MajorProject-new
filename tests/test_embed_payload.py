"""Regression checks for document metadata sent to Supabase."""

import unittest

from scripts.embed_and_store import build_document_payload, should_embed_chunk


class EmbedPayloadTests(unittest.TestCase):
    def test_document_payload_includes_source_fidelity(self):
        chunk = {
            "doc_id": "INFY_Q1FY26_full_concall_transcript",
            "market": "India",
            "company": "Infosys Ltd",
            "ticker": "INFY",
            "doc_type": "concall_transcript",
            "source": "https://www.infosys.com/",
            "period": "Q1 FY26",
            "source_fidelity": "full_transcript",
        }

        payload = build_document_payload(chunk)

        self.assertEqual("full_transcript", payload["source_fidelity"])

    def test_unchanged_chunk_does_not_need_embedding(self):
        self.assertFalse(should_embed_chunk({"text": "same"}, "same"))
        self.assertTrue(should_embed_chunk({"text": "old"}, "new"))
        self.assertTrue(should_embed_chunk(None, "new"))


if __name__ == "__main__":
    unittest.main()
