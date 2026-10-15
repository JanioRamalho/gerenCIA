"""Browser checks for the public page: report structure, figures and connected demonstration."""
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
        assert page.locator(".hero .cited-figure").count() == 1
        assert page.locator(".readings-figure .reading-panel").count() == 3
        assert page.locator(".source-table tbody tr").count() == 4
        assert page.locator(".analytics-workspace").count() == 1
        assert page.locator("#demo-categories").count() == 1
        assert page.locator(".demo-badge").count() == 1
        assert not page.evaluate("document.documentElement.scrollWidth > innerWidth"), width

        # Figure 1: the largest total is cited first and its note lists the example entries.
        figure = page.locator(".hero .cited-figure")
        assert figure.locator(".cited-row[aria-pressed=true] .cited-name").inner_text() == "Alimentação"
        assert "1.186,70" in figure.locator(".cited-sum").inner_text()
        figure.locator(".cited-row", has_text="Transporte").click()
        assert "Transporte" in figure.locator(".cited-note-head").inner_text()
        assert figure.locator(".cited-note li").count() == 3
        assert "734,30" in figure.locator(".cited-sum").inner_text()
        figure.locator(".cited-more").click()
        assert "category=Transporte" in page.url
        assert page.locator(".category-options button[aria-pressed=true]").inner_text().startswith("Transporte")
        page.get_by_role("button", name="Mostrar todas as categorias").click()

        page.locator(".hero .primary-button").click()
        page.wait_for_function("location.hash === '#demo'")

        # Figure 2 opens named slices of Figure 3 through the URL.
        page.locator("#figura-2b .reading-link").click()
        assert "chart=donut" in page.url
        assert page.locator(".chart-switch button[aria-pressed=true]").inner_text() == "Rosca"
        page.locator("#figura-2a .reading-link").click()
        assert "period=quarter" in page.url
        assert page.locator(".period-toolbar button[aria-pressed=true]").inner_text() == "3 meses"
        page.locator("#figura-2c .reading-link").click()
        assert "category=" in page.url
        assert page.locator(".category-options button[aria-pressed=true]").inner_text().startswith("Alimentação")

        page.get_by_role("button", name="Mostrar todas as categorias").click()
        page.locator(".period-toolbar button").first.click()
        assert "period=jun" in page.url
        assert "2.976,00" in page.locator(".metric-main").inner_text()
        # Every entry of the period sums back to the period total.
        page.locator(".show-entries").click()
        assert "2.976,00" in page.locator(".transaction-table tfoot").inner_text()
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

        page.goto(BASE, wait_until="networkidle")
        page.screenshot(path=str(OUT / f"home-{width}.png"), full_page=True)
        if width in (390, 1440):
            page.locator(".readings-figure").screenshot(path=str(OUT / f"readings-{width}.png"))
            page.locator(".analytics-workspace").screenshot(path=str(OUT / f"dashboard-{width}.png"))
        results.append({"width": width, "no_overflow": True, "cited_notes": True, "connected_links": True, "url_state": True, "errors": errors})
        page.close()

    page = browser.new_page(viewport={"width": 1440, "height": 992})
    page.goto(BASE + "/?period=quarter&chart=donut#demo-categories", wait_until="networkidle")
    assert page.locator(".period-toolbar button[aria-pressed=true]").inner_text() == "3 meses"
    page.wait_for_function("Math.abs(document.getElementById('demo-categories').getBoundingClientRect().top) < 130", timeout=5000)
    results.append({"deep_link": True})
    page.close()

    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto(BASE, wait_until="networkidle")
    menu = page.get_by_role("button", name="Abrir menu")
    menu.click()
    assert page.locator("#site-navigation.is-open").count() == 1
    page.keyboard.press("Escape")
    assert page.locator("#site-navigation.is-open").count() == 0
    assert page.evaluate("document.activeElement.classList.contains('menu-toggle')")
    results.append({"mobile_menu": True})
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
