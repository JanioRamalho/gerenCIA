"""Cadastro, login, painel e saída pela interface real.

Precisa da API e do frontend rodando com um banco descartável. O frontend deve
repassar /api para essa API (GERENCIA_API_URL no Vite). Nunca rode contra o
banco do projeto: este roteiro cria usuários.

    GERENCIA_TEST_URL=http://127.0.0.1:5199 python scripts/frontend/check_auth_flow.py
"""
import json
import os
import sys
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".audit-tools"))
from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("GERENCIA_TEST_URL", "http://127.0.0.1:5173").rstrip("/")
OUT = ROOT / ".impeccable" / "review"
OUT.mkdir(parents=True, exist_ok=True)

EMAIL = f"teste-{uuid4().hex[:8]}@exemplo.test"
PASSWORD = "senha-de-teste-1"
results = []


AXE = ROOT / ".audit-tools-js" / "node_modules" / "axe-core" / "axe.min.js"


def axe_violations(page):
    """Roda o axe (verificador de acessibilidade) e devolve as violações encontradas."""
    page.add_script_tag(path=str(AXE))
    report = page.evaluate("""async () => await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})""")
    return [{"id": item["id"], "nodes": [node["target"] for node in item["nodes"]]} for item in report["violations"]]


def no_overflow(page, label):
    """Confere que a página não rola para os lados."""
    assert not page.evaluate("document.documentElement.scrollWidth > innerWidth"), label


def log_in(page):
    """Entra com a conta de teste e espera chegar ao painel."""
    page.goto(BASE + "/login", wait_until="networkidle")
    page.fill("#login-email", EMAIL)
    page.fill("#login-password", PASSWORD)
    page.get_by_role("button", name="Entrar", exact=True).click()
    page.wait_for_url(BASE + "/app", timeout=10000)
    page.wait_for_load_state("networkidle")


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome", headless=True)

    # Visitante sem sessão: vê os links públicos, e o painel o manda para o login.
    page = browser.new_page(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(BASE, wait_until="networkidle")
    expect(page.locator(".nav-account").get_by_role("link", name="Entrar")).to_be_visible()
    expect(page.locator(".nav-account").get_by_role("link", name="Cadastrar")).to_be_visible()
    page.goto(BASE + "/app", wait_until="networkidle")
    page.wait_for_url(BASE + "/login", timeout=10000)
    results.append({"anonymous_header": True, "anonymous_panel_goes_to_login": True})

    # Cadastro: primeiro a validação local, depois o servidor; no fim, o painel.
    page.goto(BASE + "/register", wait_until="networkidle")
    page.get_by_role("button", name="Criar conta").click()
    assert page.locator(".field-error").count() >= 3
    assert page.evaluate("document.activeElement.id") == "register-name"
    page.screenshot(path=str(OUT / "auth-register-errors.png"))
    assert axe_violations(page) == [], "register error state"

    page.fill("#register-name", "Teste da Silva")
    page.fill("#register-email", EMAIL)
    page.fill("#register-password", PASSWORD)
    page.fill("#register-confirm", PASSWORD)
    page.get_by_role("button", name="Criar conta").click()
    page.wait_for_url(BASE + "/app", timeout=10000)
    page.wait_for_load_state("networkidle")
    expect(page.get_by_role("heading", level=1)).to_have_text("Olá, Teste.")
    expect(page.locator(".panel-account-name")).to_have_text("Teste da Silva")
    expect(page.locator(".panel-menu-item[aria-current='page']")).to_have_text("Painel")
    cookies = [c for c in page.context.cookies() if c["name"] == "gerencia_session"]
    assert len(cookies) == 1 and cookies[0]["httpOnly"] and cookies[0]["sameSite"] == "Lax"
    assert page.evaluate("document.cookie").find("gerencia_session") == -1  # o JavaScript não lê o cookie
    page.screenshot(path=str(OUT / "desktop.png"), full_page=True)
    assert axe_violations(page) == [], "panel home"
    results.append({"register_goes_to_panel": True, "cookie_httponly": True, "axe_panel": True})

    # A sessão sobrevive ao recarregar, e quem está logado é levado ao painel.
    page.reload(wait_until="networkidle")
    expect(page.get_by_role("heading", level=1)).to_have_text("Olá, Teste.")
    for route in ("/login", "/register", "/"):
        page.goto(BASE + route, wait_until="networkidle")
        page.wait_for_url(BASE + "/app", timeout=10000)
    results.append({"session_persists": True, "signed_in_pages_redirect_to_panel": True})

    # Página da conta: mostra os dados do cadastro.
    page.get_by_role("link", name="Conta", exact=True).click()
    page.wait_for_url(BASE + "/app/account", timeout=10000)
    page.wait_for_load_state("networkidle")
    expect(page.get_by_role("region", name="Dados da conta")).to_contain_text(EMAIL)
    expect(page.locator(".panel-menu-item[aria-current='page']")).to_have_text("Conta")
    page.screenshot(path=str(OUT / "panel-account.png"), full_page=True)
    assert axe_violations(page) == [], "account page"
    results.append({"account_page": True})

    # Sair encerra a sessão no servidor e volta à página inicial.
    page.get_by_role("button", name="Sair").click()
    page.wait_for_url(BASE + "/", timeout=10000)
    expect(page.locator(".nav-account").get_by_role("link", name="Entrar")).to_be_visible()
    page.reload(wait_until="networkidle")
    expect(page.locator(".nav-account").get_by_role("link", name="Entrar")).to_be_visible()
    assert not [c for c in page.context.cookies() if c["name"] == "gerencia_session" and c["value"]]
    results.append({"logout": True})

    # Login: senha errada mostra uma mensagem clara e mantém o formulário.
    page.goto(BASE + "/login", wait_until="networkidle")
    page.fill("#login-email", EMAIL)
    page.fill("#login-password", "senha-errada-9")
    page.get_by_role("button", name="Entrar", exact=True).click()
    expect(page.get_by_role("alert")).to_have_text("E-mail ou senha incorretos.")
    assert page.evaluate("document.activeElement.getAttribute('role')") == "alert"
    assert page.input_value("#login-email") == EMAIL
    page.screenshot(path=str(OUT / "auth-login-error.png"))
    assert axe_violations(page) == [], "login error state"

    page.fill("#login-password", PASSWORD)
    page.get_by_role("button", name="Entrar", exact=True).click()
    page.wait_for_url(BASE + "/app", timeout=10000)
    page.wait_for_load_state("networkidle")
    expect(page.get_by_role("heading", level=1)).to_have_text("Olá, Teste.")
    results.append({"login_error": True, "login_goes_to_panel": True, "axe_error_states": True})

    # Um segundo cadastro com o mesmo e-mail é recusado no campo de e-mail.
    other = browser.new_context(viewport={"width": 1440, "height": 900})
    page2 = other.new_page()
    page2.goto(BASE + "/register", wait_until="networkidle")
    page2.fill("#register-name", "Outra Pessoa")
    page2.fill("#register-email", EMAIL.upper())
    page2.fill("#register-password", PASSWORD)
    page2.fill("#register-confirm", PASSWORD)
    page2.get_by_role("button", name="Criar conta").click()
    expect(page2.locator("#register-email-error")).to_contain_text("já tem cadastro")
    assert page2.evaluate("document.activeElement.id") == "register-email"
    other.close()
    results.append({"duplicate_email": True})
    assert not errors, errors
    page.close()

    # Telas estreitas: os formulários cabem, e o painel tem o menu atrás do botão.
    for width, height in [(320, 740), (390, 844)]:
        context = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce")
        mobile = context.new_page()
        for route in ("/login", "/register"):
            mobile.goto(BASE + route, wait_until="networkidle")
            no_overflow(mobile, f"{route}@{width}")
        mobile.goto(BASE, wait_until="networkidle")
        mobile.get_by_role("button", name="Abrir menu").click()
        expect(mobile.locator("#site-navigation").get_by_role("link", name="Entrar")).to_be_visible()
        no_overflow(mobile, f"/@{width}")

        log_in(mobile)
        no_overflow(mobile, f"/app@{width}")
        if width == 390:
            mobile.screenshot(path=str(OUT / "mobile.png"), full_page=True)
        mobile.get_by_role("button", name="Abrir menu").click()
        expect(mobile.locator("#panel-navigation").get_by_role("button", name="Sair")).to_be_visible()
        if width == 390:
            mobile.screenshot(path=str(OUT / "mobile-menu.png"))
        mobile.keyboard.press("Escape")
        expect(mobile.get_by_role("button", name="Abrir menu")).to_be_focused()
        context.close()
    results.append({"mobile": True})

    # Com a API fora do ar, o site público continua funcionando e o painel avisa.
    offline = browser.new_page(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    offline.route("**/api/**", lambda route: route.abort())
    offline.goto(BASE, wait_until="networkidle")
    expect(offline.get_by_role("heading", name="Sua fatura diz mais que o total.")).to_be_visible()
    expect(offline.locator(".nav-account").get_by_role("link", name="Entrar")).to_be_visible()
    offline.goto(BASE + "/app", wait_until="networkidle")
    expect(offline.get_by_role("heading", name="Não foi possível abrir o painel.")).to_be_visible()
    offline.screenshot(path=str(OUT / "panel-unavailable.png"))
    offline.goto(BASE + "/login", wait_until="networkidle")
    offline.fill("#login-email", EMAIL)
    offline.fill("#login-password", PASSWORD)
    offline.get_by_role("button", name="Entrar", exact=True).click()
    expect(offline.get_by_role("alert")).to_contain_text("Não foi possível falar com o servidor")
    offline.close()
    results.append({"api_down_site_works": True, "api_down_panel_warns": True})

    browser.close()

print(json.dumps(results, ensure_ascii=False, indent=2))
