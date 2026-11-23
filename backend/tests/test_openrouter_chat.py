"""Regression tests for evidence chat failover between free OpenRouter models."""

import os
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

import httpx
from openai import AuthenticationError, RateLimitError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-supabase-key")
os.environ.setdefault("OPENROUTER_API_KEY", "test-openrouter-key")

from app.services import openrouter_chat  # noqa: E402


def make_api_error(error_type, status_code):
    """Create an SDK error with a realistic HTTP status."""
    request = httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions")
    response = httpx.Response(status_code, request=request)
    return error_type("provider unavailable", response=response, body=None)


class OpenRouterChatTests(unittest.TestCase):
    def setUp(self):
        self.chunks = [{"company": "Example Corp", "market": "US", "doc_type": "earnings_transcript", "text": "Revenue rose."}]

    def test_uses_next_free_model_after_rate_limit(self):
        response = SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content="Revenue rose [Example Corp]."))])
        completion = Mock(side_effect=[make_api_error(RateLimitError, 429), response])
        with patch.object(openrouter_chat.client.chat.completions, "create", completion):
            answer = openrouter_chat.answer_question("What happened?", self.chunks)
        self.assertIn("Revenue rose", answer)
        self.assertEqual([call.kwargs["model"] for call in completion.call_args_list], list(openrouter_chat.CHAT_MODELS[:2]))
        self.assertEqual(completion.call_args_list[0].kwargs["extra_body"], {"reasoning": {"enabled": False}})
        self.assertNotIn("extra_body", completion.call_args_list[1].kwargs)

    def test_does_not_switch_models_for_invalid_key(self):
        completion = Mock(side_effect=make_api_error(AuthenticationError, 401))
        with patch.object(openrouter_chat.client.chat.completions, "create", completion):
            with self.assertRaises(AuthenticationError):
                openrouter_chat.answer_question("What happened?", self.chunks)
        self.assertEqual(completion.call_count, 1)

    def test_raises_after_all_free_models_are_rate_limited(self):
        completion = Mock(side_effect=make_api_error(RateLimitError, 429))
        with patch.object(openrouter_chat.client.chat.completions, "create", completion):
            with self.assertRaises(RateLimitError):
                openrouter_chat.answer_question("What happened?", self.chunks)
        self.assertEqual(completion.call_count, 3)

    def test_uses_third_model_after_both_earlier_models_are_limited(self):
        response = SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content="Revenue rose."))])
        completion = Mock(side_effect=[make_api_error(RateLimitError, 429), make_api_error(RateLimitError, 429), response])
        with patch.object(openrouter_chat.client.chat.completions, "create", completion):
            answer = openrouter_chat.answer_question("What happened?", self.chunks)
        self.assertEqual(answer, "Revenue rose.")
        self.assertEqual([call.kwargs["model"] for call in completion.call_args_list], list(openrouter_chat.CHAT_MODELS))


if __name__ == "__main__":
    unittest.main()
