"""Tests for bounded, source-backed disclosure collection."""

import unittest

from scripts.collect_disclosures import extract_html_text, select_excerpt


class CollectDisclosuresTests(unittest.TestCase):
    def test_extract_html_text_excludes_navigation_and_scripts(self):
        html = b"<nav>Menu</nav><main><h1>Results</h1><p>Revenue grew this quarter.</p><script>bad()</script><p>Demand remains uncertain.</p></main>"
        self.assertEqual(extract_html_text(html), "Results\n\nRevenue grew this quarter.\n\nDemand remains uncertain.")

    def test_select_excerpt_caps_words_without_cutting_paragraphs(self):
        text = "One two three four.\n\nFive six seven eight.\n\nNine ten eleven twelve."
        self.assertEqual(select_excerpt(text, max_words=8), "One two three four.\n\nFive six seven eight.")

    def test_extract_apple_pagebody(self):
        html = b'<main><div class="pagebody-copy">Revenue <b>increased</b> this quarter.</div><div class="pagebody-copy">Margin was stable.</div></main>'
        self.assertEqual(extract_html_text(html), "Revenue increased this quarter.\n\nMargin was stable.")


if __name__ == "__main__":
    unittest.main()
