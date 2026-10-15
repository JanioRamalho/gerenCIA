"""Checks the cited notes of Figure 1 and the keyboard path through Figure 2."""
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".audit-tools"))
from playwright.sync_api import sync_playwright

BASE = os.environ.get("GERENCIA_TEST_URL", "http://127.0.0.1:5173")
results = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome", headless=True)
    for width, height in [(320, 740), (390, 844), (768, 1024), (1440, 992)]:
        page = browser.new_page(viewport={"width": width, "height": height}, reduced_motion="reduce")
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(BASE, wait_until="networkidle")

        figure = page.locator(".hero .cited-figure")
        rows = figure.locator(".cited-row")
        assert rows.count() == 5
        assert figure.locator(".cited-row sup").count() == 5
        # Keyboard: every total is a button and its note follows the selection.
        rows.nth(2).focus()
        page.keyboard.press("Enter")
        assert rows.nth(2).get_attribute("aria-pressed") == "true"
        assert figure.locator(".cited-note-head sup").inner_text() == "3"
        assert "Soma dos" in figure.locator(".cited-sum").inner_text()
        assert figure.locator(".cited-note li").count() == 3

        login = browser.new_page(viewport={"width": width, "height": height}, reduced_motion="reduce")
        login.goto(BASE + "/login", wait_until="networkidle")
        assert login.locator(".access-form input").count() == 2
        assert not login.evaluate("document.documentElement.scrollWidth > innerWidth"), width
        login.close()

        panel = page.locator("#figura-2b")
        panel.scroll_into_view_if_needed()
        panel.locator(".reading-link").focus()
        page.keyboard.press("Enter")
        assert "chart=donut" in page.url
        assert page.locator(".category-chart .recharts-pie-sector").count() == 5
        assert not page.evaluate("document.documentElement.scrollWidth > innerWidth"), width
        assert not errors, errors
        results.append({"width": width, "cited_keyboard": True, "readings_keyboard": True, "errors": errors})
        page.close()
    browser.close()

print(json.dumps(results, ensure_ascii=False, indent=2))
