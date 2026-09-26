"""Configuration regression tests for provider model defaults."""

import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-supabase-key")

from app.config import GROQ_GENERATION_MODEL  # noqa: E402


class ConfigTests(unittest.TestCase):
    def test_groq_generation_model_defaults_to_available_json_capable_model(self):
        self.assertEqual(GROQ_GENERATION_MODEL, "openai/gpt-oss-120b")


if __name__ == "__main__":
    unittest.main()
