"""Accessibility checks for the refactored public page."""
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".audit-tools"))
from playwright.sync_api import sync_playwright

axe_path = ROOT / ".audit-tools-js" / "node_modules" / "axe-core" / "axe.min.js"
assert axe_path.exists(), axe_path
results = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome", headless=True)
    for width, height in [(390, 844), (1440, 992)]:
        page = browser.new_page(viewport={"width": width, "height": height}, reduced_motion="reduce")
        page.goto(os.environ.get("GERENCIA_TEST_URL", "http://127.0.0.1:5173"), wait_until="networkidle")
        page.add_script_tag(path=str(axe_path))
        report = page.evaluate("""async () => await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})""")
        violations = [{"id": item["id"], "nodes": [node["target"] for node in item["nodes"]]} for item in report["violations"]]
        results.append({"width": width, "violations": violations})
        page.close()
    for route in ("login", "register"):
        page = browser.new_page(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
        page.goto(os.environ.get("GERENCIA_TEST_URL", "http://127.0.0.1:5173") + "/" + route, wait_until="networkidle")
        if route == "login":
            assert page.locator(".access-shell").count() == 1
            assert page.locator(".access-copy .primary-button").count() == 1
        else:
            assert page.locator(".registration-page").count() == 1
            assert page.locator(".registration-field input").count() == 4
        page.add_script_tag(path=str(axe_path))
        report = page.evaluate("""async () => await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})""")
        violations = [{"id": item["id"], "nodes": [node["target"] for node in item["nodes"]]} for item in report["violations"]]
        results.append({"route": route, "violations": violations})
        page.close()
    browser.close()

print(json.dumps(results, ensure_ascii=False, indent=2))
assert all(not item["violations"] for item in results), "axe violations found"
