"""Verificações da demonstração (Figura 3): gráficos, filtros, endereço e teclado."""

from helpers import (
    BASE, SCREEN_SIZES, block_storage, has_horizontal_scroll, new_page,
    print_results, storage_is_blocked, sync_playwright, watch_errors,
)

SELECTED_CATEGORY = ".category-options button[aria-pressed=true]"


def check_dashboard(browser, width, height):
    """Troca gráfico, período e categoria, e confere que o endereço guarda a escolha."""
    page = new_page(browser, width, height)
    errors = watch_errors(page)
    page.goto(BASE, wait_until="networkidle")

    # Agosto é o período inicial, com barras.
    assert page.locator(".analytics-workspace").is_visible()
    assert "2.913,00" in page.locator(".metric-main").inner_text()
    assert page.locator("#demo-categories").count() == 1
    assert page.locator(".category-chart .recharts-bar-rectangle").count() == 5

    # Rosca pelo teclado e troca de período: o endereço acompanha.
    page.get_by_role("button", name="Rosca", exact=True).focus()
    page.keyboard.press("Enter")
    assert page.locator(".category-chart .recharts-pie-sector").count() == 5
    assert "chart=donut" in page.url
    page.get_by_role("button", name="Julho", exact=True).click()
    assert "3.211,00" in page.locator(".metric-main").inner_text()
    assert "period=jul" in page.url

    # A categoria escolhida pelo teclado continua escolhida depois de recarregar.
    page.locator(".category-options button").first.focus()
    page.keyboard.press("Enter")
    assert page.locator(SELECTED_CATEGORY).count() == 1
    selected = page.locator(SELECTED_CATEGORY).inner_text()
    page.reload(wait_until="networkidle")
    assert selected == page.locator(SELECTED_CATEGORY).inner_text()

    # Clicar numa barra também escolhe a categoria.
    page.get_by_role("button", name="Mostrar todas as categorias").click()
    page.get_by_role("button", name="Barras", exact=True).click()
    page.locator(".category-chart .recharts-bar-rectangle path").first.click()
    assert page.locator(SELECTED_CATEGORY).count() == 1

    assert not has_horizontal_scroll(page)
    assert not errors, errors
    page.close()
    return {"width": width, "chart_modes": True, "url_reload": True, "category_keyboard": True, "errors": errors}


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
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", headless=True)
        for width, height in SCREEN_SIZES:
            results.append(check_dashboard(browser, width, height))
        results.append(check_sort_without_storage(browser))
        browser.close()
    print_results(results)


if __name__ == "__main__":
    main()
