"""Exercise the research workflow against a running Next server in headless Chrome.

Usage: uv run --with playwright python frontend/tests/research-browser.py http://localhost:3000
"""
import sys
from playwright.sync_api import sync_playwright

base = sys.argv[1].rstrip("/")
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome")
    page = browser.new_page(viewport={"width": 1280, "height": 860})
    page.goto(base)
    page.get_by_label("Research question").fill("margin pressure")
    page.get_by_label("Company", exact=True).select_option("INFY")
    page.get_by_role("button", name="Search", exact=True).click()
    page.get_by_text("Matching passages", exact=True).wait_for()
    assert all("INFY" in label for label in page.locator(".meta").all_text_contents())
    page.get_by_role("button", name="+ Save passage").first.click()
    page.get_by_role("link", name="Open passage ↗").first.click()
    page.locator(":target").wait_for()
    page.goto(base + "/brief")
    page.get_by_label("Your note").fill("Check the source.")
    page.reload()
    assert page.get_by_label("Your note").input_value() == "Check the source."
    page.emulate_media(media="print")
    assert page.locator(".brief-sheet").is_visible()
    page.emulate_media(media="screen")
    for route in ["pair", "history"]:
        page.goto(base + "/research/" + route)
        page.get_by_role("button", name="Compare").click()
        page.locator(".pair").wait_for()
        assert page.locator(".pair .answer").count() == 2
    page.goto(base + "/benchmark")
    page.get_by_role("link", name="Inspect disagreements").first.click()
    page.locator(".verdict").first.wait_for()
    page.goto(base + "/research/coverage")
    assert page.locator("tbody tr").count() > 0
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(base)
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    page.goto(base + "/chat")
    page.route("**/api/chat/", lambda route: route.abort())
    page.get_by_placeholder("e.g. What risks did Apple management mention?").fill("Margin pressure")
    page.get_by_role("button", name="Ask", exact=True).click()
    page.get_by_text("Live generation is unavailable", exact=False).wait_for()
    page.get_by_role("button", name="+ Save passage").first.wait_for()
    browser.close()
    print("Passed research browser journeys")
