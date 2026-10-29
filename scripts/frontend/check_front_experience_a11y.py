"""Acessibilidade da página inicial, do login e do cadastro, conferida pelo axe."""

from helpers import BASE, axe_violations, new_page, print_results, sync_playwright


def check_home(browser, width, height):
    """Roda o axe na página inicial numa largura de tela."""
    page = new_page(browser, width, height)
    page.goto(BASE, wait_until="networkidle")
    violations = axe_violations(page)
    page.close()
    return {"width": width, "violations": violations}


def check_account_page(browser, route):
    """Confere que o formulário certo abriu e roda o axe na página de login ou de cadastro."""
    page = new_page(browser, 390, 844)
    page.goto(BASE + "/" + route, wait_until="networkidle")
    if route == "login":
        assert page.locator(".access-shell").count() == 1
        assert page.locator(".access-form .form-submit").count() == 1
        assert page.locator(".access-form input").count() == 2
    else:
        assert page.locator(".registration-page").count() == 1
        assert page.locator(".form-field input").count() == 4
    violations = axe_violations(page)
    page.close()
    return {"route": route, "violations": violations}


def main():
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", headless=True)
        for width, height in [(390, 844), (1440, 992)]:
            results.append(check_home(browser, width, height))
        for route in ("login", "register"):
            results.append(check_account_page(browser, route))
        browser.close()

    print_results(results)
    # O resumo sai antes, para mostrar quais violações apareceram.
    assert all(not item["violations"] for item in results), "o axe encontrou violações"


if __name__ == "__main__":
    main()
