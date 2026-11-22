"""Tests for choosing the reproducible extraction provider."""

import unittest

from scripts.run_extraction import parse_args


class RunExtractionTests(unittest.TestCase):
    def test_local_provider_is_explicit(self):
        self.assertFalse(parse_args([]).local)
        self.assertTrue(parse_args(["--local"]).local)


if __name__ == "__main__":
    unittest.main()
