"""Checks mascot dragging and the connected discovery carousel."""
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

        page.locator(".mascot-playground").scroll_into_view_if_needed()
        file = page.locator(".mascot-file--pdf").bounding_box()
        mascot = page.locator(".mascot-character").bounding_box()
        page.mouse.move(file["x"] + file["width"] / 2, file["y"] + file["height"] / 2)
        page.mouse.down()
        page.mouse.move(mascot["x"] + mascot["width"] * .5, mascot["y"] + mascot["height"] * .39, steps=10)
        page.mouse.up()
        page.locator(".mascot-playground[data-phase=result]").wait_for()
        assert "25%" in page.locator(".mascot-result").inner_text()
        page.get_by_role("button", name="Testar outro arquivo").click()
        page.locator(".hero-actions .primary-button").click()
        assert "period=quarter" in page.url

        carousel = page.locator(".insight-carousel")
        carousel.scroll_into_view_if_needed()
        carousel.get_by_role("button", name="Próxima descoberta").focus()
        page.keyboard.press("ArrowRight")
        assert "Categorias" in page.locator(".insight-slide").get_attribute("aria-label")
        page.locator(".insight-copy .secondary-button").click()
        assert "chart=donut" in page.url
        assert page.locator(".chart-switch button[aria-pressed=true]").inner_text() == "Rosca"
        assert not page.evaluate("document.documentElement.scrollWidth > innerWidth")
        assert not errors, errors
        results.append({"width": width, "mascot_drag": True, "connected_links": True, "insight_keyboard": True, "errors": errors})
        page.close()
    browser.close()

print(json.dumps(results, ensure_ascii=False, indent=2))