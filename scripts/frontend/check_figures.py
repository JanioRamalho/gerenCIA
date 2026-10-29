"""Verificações das figuras: as notas da Figura 1 e o caminho pelo teclado na Figura 2."""

from helpers import BASE, SCREEN_SIZES, has_horizontal_scroll, new_page, print_results, sync_playwright, watch_errors


def check_login_fits(browser, width, height):
    """O formulário de login cabe na largura da tela, sem rolar para os lados."""
    login = new_page(browser, width, height)
    login.goto(BASE + "/login", wait_until="networkidle")
    assert login.locator(".access-form input").count() == 2
    assert not has_horizontal_scroll(login), width
    login.close()


def check_figures(browser, width, height):
    """Escolhe uma categoria da Figura 1 pelo teclado e abre a leitura 2b na demonstração."""
    page = new_page(browser, width, height)
    errors = watch_errors(page)
    page.goto(BASE, wait_until="networkidle")

    # Figura 1: cada total é um botão, e a nota acompanha a escolha.
    figure = page.locator(".hero .cited-figure")
    rows = figure.locator(".cited-row")
    assert rows.count() == 5
    assert figure.locator(".cited-row sup").count() == 5
    rows.nth(2).focus()
    page.keyboard.press("Enter")
    assert rows.nth(2).get_attribute("aria-pressed") == "true"
    assert figure.locator(".cited-note-head sup").inner_text() == "3"
    assert "Soma dos" in figure.locator(".cited-sum").inner_text()
    assert figure.locator(".cited-note li").count() == 3

    check_login_fits(browser, width, height)

    # Figura 2: o link da leitura (b), pelo teclado, abre a rosca na demonstração.
    panel = page.locator("#figura-2b")
    panel.scroll_into_view_if_needed()
    panel.locator(".reading-link").focus()
    page.keyboard.press("Enter")
    assert "chart=donut" in page.url
    assert page.locator(".category-chart .recharts-pie-sector").count() == 5

    assert not has_horizontal_scroll(page), width
    assert not errors, errors
    page.close()
    return {"width": width, "cited_keyboard": True, "readings_keyboard": True, "errors": errors}


def main():
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", headless=True)
        for width, height in SCREEN_SIZES:
            results.append(check_figures(browser, width, height))
        browser.close()
    print_results(results)


if __name__ == "__main__":
    main()
