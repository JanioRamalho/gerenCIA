"""Verificações da página inicial: estrutura, figuras e a ligação com a demonstração."""

import json

from helpers import (
    BASE, OUT, SCREEN_SIZES, block_storage, has_horizontal_scroll, new_page,
    print_results, storage_is_blocked, sync_playwright, watch_errors,
)

SELECTED_CATEGORY = ".category-options button[aria-pressed=true]"


def check_page_structure(page, width):
    """As partes principais da página existem e nada passa da largura da tela."""
    assert page.get_by_role("heading", name="Sua fatura diz mais que o total.").is_visible()
    assert page.locator(".hero .cited-figure").count() == 1
    assert page.locator(".readings-figure .reading-panel").count() == 3
    assert page.locator(".source-table tbody tr").count() == 4
    assert page.locator(".analytics-workspace").count() == 1
    assert page.locator("#demo-categories").count() == 1
    assert page.locator(".demo-badge").count() == 1
    assert not has_horizontal_scroll(page), width


def check_cited_notes(page):
    """Figura 1: a maior categoria vem citada primeiro, e o link da nota abre a demonstração."""
    figure = page.locator(".hero .cited-figure")
    assert figure.locator(".cited-row[aria-pressed=true] .cited-name").inner_text() == "Alimentação"
    assert "1.186,70" in figure.locator(".cited-sum").inner_text()

    figure.locator(".cited-row", has_text="Transporte").click()
    assert "Transporte" in figure.locator(".cited-note-head").inner_text()
    assert figure.locator(".cited-note li").count() == 3
    assert "734,30" in figure.locator(".cited-sum").inner_text()

    figure.locator(".cited-more").click()
    assert "category=Transporte" in page.url
    assert page.locator(SELECTED_CATEGORY).inner_text().startswith("Transporte")
    page.get_by_role("button", name="Mostrar todas as categorias").click()


def check_reading_links(page):
    """Figura 2: cada leitura abre o seu recorte da Figura 3 pelo endereço."""
    page.locator(".hero .primary-button").click()
    page.wait_for_function("location.hash === '#demo'")

    page.locator("#figura-2b .reading-link").click()
    assert "chart=donut" in page.url
    assert page.locator(".chart-switch button[aria-pressed=true]").inner_text() == "Rosca"

    page.locator("#figura-2a .reading-link").click()
    assert "period=quarter" in page.url
    assert page.locator(".period-toolbar button[aria-pressed=true]").inner_text() == "3 meses"

    page.locator("#figura-2c .reading-link").click()
    assert "category=" in page.url
    assert page.locator(SELECTED_CATEGORY).inner_text().startswith("Alimentação")


def check_demo_state(page, width):
    """A soma dos lançamentos fecha com o total, e o endereço guarda a categoria escolhida."""
    page.get_by_role("button", name="Mostrar todas as categorias").click()
    page.locator(".period-toolbar button").first.click()
    assert "period=jun" in page.url
    assert "2.976,00" in page.locator(".metric-main").inner_text()

    # Com todos os lançamentos à vista, a soma no rodapé é o total do período.
    page.locator(".show-entries").click()
    assert "2.976,00" in page.locator(".transaction-table tfoot").inner_text()

    page.locator(".category-options button").first.focus()
    page.keyboard.press("Enter")
    assert page.locator(SELECTED_CATEGORY).count() == 1
    page.reload(wait_until="networkidle")
    assert page.locator(SELECTED_CATEGORY).count() == 1

    page.get_by_role("button", name="Mostrar todas as categorias").click()
    page.get_by_role("button", name="Barras", exact=True).click()
    page.locator(".category-chart .recharts-bar-rectangle path").first.click()
    assert page.locator(SELECTED_CATEGORY).count() == 1
    assert not has_horizontal_scroll(page), width


def save_screenshots(page, width):
    """Guarda capturas da página para revisão visual em .impeccable/review/."""
    page.goto(BASE, wait_until="networkidle")
    page.screenshot(path=str(OUT / f"home-{width}.png"), full_page=True)
    if width in (390, 1440):
        page.locator(".readings-figure").screenshot(path=str(OUT / f"readings-{width}.png"))
        page.locator(".analytics-workspace").screenshot(path=str(OUT / f"dashboard-{width}.png"))


def check_home(browser, width, height):
    """Percorre a página inicial inteira numa largura de tela."""
    page = new_page(browser, width, height)
    errors = watch_errors(page)
    page.goto(BASE, wait_until="networkidle")

    check_page_structure(page, width)
    check_cited_notes(page)
    check_reading_links(page)
    check_demo_state(page, width)
    assert not errors, errors

    save_screenshots(page, width)
    page.close()
    return {"width": width, "no_overflow": True, "cited_notes": True, "connected_links": True, "url_state": True, "errors": errors}


def check_deep_link(browser):
    """Um link direto para a demonstração abre o recorte e rola até o bloco certo."""
    page = browser.new_page(viewport={"width": 1440, "height": 992})
    page.goto(BASE + "/?period=quarter&chart=donut#demo-categories", wait_until="networkidle")
    assert page.locator(".period-toolbar button[aria-pressed=true]").inner_text() == "3 meses"
    page.wait_for_function("Math.abs(document.getElementById('demo-categories').getBoundingClientRect().top) < 130", timeout=5000)
    page.close()
    return {"deep_link": True}


def check_mobile_menu(browser):
    """No celular, o menu abre, fecha com Esc e devolve o foco ao botão."""
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto(BASE, wait_until="networkidle")
    page.get_by_role("button", name="Abrir menu").click()
    assert page.locator("#site-navigation.is-open").count() == 1
    page.keyboard.press("Escape")
    assert page.locator("#site-navigation.is-open").count() == 0
    assert page.evaluate("document.activeElement.classList.contains('menu-toggle')")
    page.close()
    return {"mobile_menu": True}


def check_sort_without_storage(browser):
    """Com o localStorage bloqueado, a ordem da lista ainda troca; só não é lembrada."""
    page = new_page(browser, 390, 844)
    block_storage(page)
    page.goto(BASE, wait_until="networkidle")
    assert storage_is_blocked(page)

    page.locator(".sort-switch button").last.click()
    assert page.locator(".sort-switch button[aria-pressed=true]").inner_text() == "A–Z"
    page.close()
    return {"storage_blocked": True}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", headless=True)
        for width, height in SCREEN_SIZES:
            results.append(check_home(browser, width, height))
        results.append(check_deep_link(browser))
        results.append(check_mobile_menu(browser))
        results.append(check_sort_without_storage(browser))
        browser.close()

    (OUT / "interaction-checks.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print_results(results)


if __name__ == "__main__":
    main()
