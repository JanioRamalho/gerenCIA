"""Browser checks for the connected public demonstration."""
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".audit-tools"))
from playwright.sync_api import sync_playwright

BASE = os.environ.get("GERENCIA_TEST_URL", "http://127.0.0.1:5173")
OUT = ROOT / ".impeccable" / "review"
OUT.mkdir(parents=True, exist_ok=True)
results = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome", headless=True)
    for width, height in [(320, 740), (390, 844), (768, 1024), (1440, 992)]:
        page = browser.new_page(viewport={"width": width, "height": height}, reduced_motion="reduce")
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(BASE, wait_until="networkidle")
        assert page.get_by_role("heading", name="Sua fatura diz mais que o total.").is_visible()
        assert page.locator(".mascot-playground").count() == 1
        assert page.locator(".analytics-workspace").count() == 1
        assert page.locator("#demo-trend").count() == 0
        assert page.locator("#demo-categories").count() == 1
        assert page.locator(".insight-carousel").count() == 1
        assert not page.evaluate("document.documentElement.scrollWidth > innerWidth"), width

        assert page.locator(".mascot-file").count() == 2
        page.locator(".mascot-file--pdf").click()
        page.locator(".mascot-playground[data-phase=result]").wait_for()
        assert "25%" in page.locator(".mascot-result > p").inner_text()
        assert "Nenhum arquivo foi lido" in page.locator(".mascot-result").inner_text()
        page.get_by_role("button", name="Testar outro arquivo").click()
        page.locator(".mascot-file--csv").focus()
        page.keyboard.press("Enter")
        page.locator(".mascot-playground[data-phase=result]").wait_for()
        assert "42%" in page.locator(".mascot-result > p").inner_text()

        page.locator(".hero-actions .primary-button").click()
        assert "period=quarter" in page.url
        assert page.locator(".period-toolbar button[aria-pressed=true]").inner_text() == "3 meses"

        page.locator(".insight-carousel").scroll_into_view_if_needed()
        page.get_by_role("button", name="Próxima descoberta").click()
        assert "Categorias" in page.locator(".insight-slide").get_attribute("aria-label")
        page.locator(".insight-copy .secondary-button").click()
        assert "chart=donut" in page.url
        assert page.locator(".chart-switch button[aria-pressed=true]").inner_text() == "Rosca"

        page.locator(".period-toolbar button").first.click()
        assert "period=jun" in page.url
        assert "2.976,00" in page.locator(".metric-main").inner_text()
        page.locator(".category-options button").first.focus()
        page.keyboard.press("Enter")
        assert page.locator(".category-options button[aria-pressed=true]").count() == 1
        page.reload(wait_until="networkidle")
        assert page.locator(".category-options button[aria-pressed=true]").count() == 1
        page.get_by_role("button", name="Mostrar todas as categorias").click()
        page.get_by_role("button", name="Barras", exact=True).click()
        page.locator(".category-chart .recharts-bar-rectangle path").first.click()
        assert page.locator(".category-options button[aria-pressed=true]").count() == 1
        assert not page.evaluate("document.documentElement.scrollWidth > innerWidth"), width
        assert not errors, errors
        if width in (320, 390, 768, 1440):
            page.goto(BASE, wait_until="networkidle")
            page.screenshot(path=str(OUT / f"home-{width}.png"), full_page=True)
            if width in (390, 1440):
                page.locator(".insight-carousel").screenshot(path=str(OUT / f"insights-{width}.png"))
                page.locator(".analytics-workspace").screenshot(path=str(OUT / f"dashboard-{width}.png"))
        results.append({"width": width, "no_overflow": True, "connected_links": True, "url_state": True, "errors": errors})
        page.close()

    page = browser.new_page(viewport={"width": 1440, "height": 992})
    page.goto(BASE + "/?period=quarter&chart=donut#demo-categories", wait_until="networkidle")
    assert page.locator(".period-toolbar button[aria-pressed=true]").inner_text() == "3 meses"
    page.wait_for_function("Math.abs(document.getElementById('demo-categories').getBoundingClientRect().top) < 130", timeout=5000)
    page.close()
    page = browser.new_page(viewport={"width": 1440, "height": 992})
    page.goto(BASE, wait_until="networkidle")
    page.screenshot(path=str(OUT / "desktop-motion.png"), full_page=False)
    assert page.locator(".mascot-playground").count() == 1
    results.append({"mascot_experience": True})
    page.close()

    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto(BASE, wait_until="networkidle")
    assert page.locator(".mascot-playground").count() == 1
    results.append({"responsive_mascot": True})
    page.close()

    page = browser.new_page(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
    page.add_init_script("""() => { Storage.prototype.getItem = () => { throw Error('blocked'); }; Storage.prototype.setItem = () => { throw Error('blocked'); }; }""")
    page.goto(BASE, wait_until="networkidle")
    page.locator(".sort-switch button").last.click()
    assert page.locator(".sort-switch button[aria-pressed=true]").inner_text() == "A–Z"
    results.append({"storage_blocked": True})
    page.close()
    browser.close()

(OUT / "interaction-checks.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(results, ensure_ascii=False, indent=2))
