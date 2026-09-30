"""Checks for the linked financial dashboard."""
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
        dashboard = page.locator(".analytics-workspace")
        assert dashboard.is_visible()
        assert "2.913,00" in page.locator(".metric-main").inner_text()
        assert page.locator("#demo-trend").count() == 0
        assert page.locator("#demo-categories").count() == 1
        assert page.locator(".category-chart .recharts-bar-rectangle").count() == 5

        page.get_by_role("button", name="Rosca", exact=True).focus()
        page.keyboard.press("Enter")
        assert page.locator(".category-chart .recharts-pie-sector").count() == 5
        assert "chart=donut" in page.url
        page.get_by_role("button", name="Julho", exact=True).click()
        assert "3.211,00" in page.locator(".metric-main").inner_text()
        assert "period=jul" in page.url
        page.locator(".category-options button").first.focus()
        page.keyboard.press("Enter")
        assert page.locator(".category-options button[aria-pressed=true]").count() == 1
        selected = page.locator(".category-options button[aria-pressed=true]").inner_text()
        page.reload(wait_until="networkidle")
        assert selected == page.locator(".category-options button[aria-pressed=true]").inner_text()
        page.get_by_role("button", name="Mostrar todas as categorias").click()
        page.get_by_role("button", name="Barras", exact=True).click()
        page.locator(".category-chart .recharts-bar-rectangle path").first.click()
        assert page.locator(".category-options button[aria-pressed=true]").count() == 1
        assert not page.evaluate("document.documentElement.scrollWidth > innerWidth")
        assert not errors, errors
        results.append({"width": width, "chart_modes": True, "url_reload": True, "category_keyboard": True, "errors": errors})
        page.close()

    page = browser.new_page(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
    page.add_init_script("() => { Storage.prototype.getItem = () => { throw Error('blocked'); }; Storage.prototype.setItem = () => { throw Error('blocked'); }; }")
    page.goto(BASE, wait_until="networkidle")
    page.locator(".sort-switch button").last.click()
    assert page.locator(".sort-switch button[aria-pressed=true]").inner_text() == "A–Z"
    results.append({"storage_blocked": True})
    page.close()
    browser.close()

print(json.dumps(results, ensure_ascii=False, indent=2))