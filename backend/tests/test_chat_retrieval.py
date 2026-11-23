"""Ensure quarter-specific chat questions use disclosures from that quarter."""

import os
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-supabase-key")

from app.services.retrieval import retrieve_top_k  # noqa: E402
from app.routers.chat import chat, ChatRequest  # noqa: E402


class ChatRetrievalTests(unittest.TestCase):
    def test_explicit_quarter_uses_matching_disclosure(self):
        client = MagicMock()
        client.rpc.return_value.execute.return_value = SimpleNamespace(data=[
            {"document_id": "new", "text": "2026 revenue", "similarity": 0.9},
            {"document_id": "old", "text": "2025 revenue", "similarity": 0.8},
        ])
        client.table.return_value.select.return_value.in_.return_value.execute.return_value = SimpleNamespace(data=[
            {"id": "new", "fiscal_period": "Q3 FY2026"},
            {"id": "old", "fiscal_period": "Q3 FY2025"},
        ])
        with patch("app.services.retrieval.embed_text", return_value=[0.1]), patch("app.services.retrieval.get_client", return_value=client):
            chunks = retrieve_top_k("What was Q3 FY2025 revenue?", k=1)
        self.assertEqual([chunk["document_id"] for chunk in chunks], ["old"])
        self.assertEqual(chunks[0]["fiscal_period"], "Q3 FY2025")

    def test_chat_reports_when_requested_period_is_absent(self):
        with patch("app.routers.chat.retrieve_top_k", return_value=[]), patch("app.routers.chat.answer_question") as generate_answer:
            response = chat(ChatRequest(question="What was Q3 FY2025 revenue?"))
        self.assertEqual(response.sources, [])
        self.assertIn("couldn't find", response.answer.lower())
        generate_answer.assert_not_called()


if __name__ == "__main__":
    unittest.main()
