"""Regression tests for user-facing document API failure handling."""

import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import httpx
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-supabase-key")

from app.main import app  # noqa: E402


class FailingQuery:
    """Mimics the Supabase query builder enough to raise at execute time."""

    def select(self, _columns: str):
        return self

    def execute(self):
        raise httpx.ConnectError("database host unavailable")


class FailingClient:
    """Mimics the Supabase client table entrypoint used by document routes."""

    def table(self, _table_name: str):
        return FailingQuery()


class DocumentRouteErrorTests(unittest.TestCase):
    def test_list_documents_returns_service_unavailable_for_database_outage(self):
        client = TestClient(app, raise_server_exceptions=False)

        with patch("app.routers.documents.get_client", return_value=FailingClient()):
            response = client.get("/api/documents/")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json()["detail"],
            "Disclosure database is unavailable. Check the Supabase URL and service role key.",
        )


if __name__ == "__main__":
    unittest.main()
