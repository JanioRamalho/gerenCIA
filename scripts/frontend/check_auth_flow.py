"""Sign-up, sign-in and sign-out through the real interface.

Needs the API and the frontend running with a throwaway database. The frontend must proxy /api
to that API (GERENCIA_API_URL for Vite). Never run it against the project database: it creates users.

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
    page.add_script_tag(path=str(AXE))
    report = page.evaluate("""async () => await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})""")
    return [{"id": item["id"], "nodes": [node["target"] for node in item["nodes"]]} for item in report["violations"]]


def no_overflow(page, label):
    assert not page.evaluate("document.documentElement.scrollWidth > innerWidth"), label


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome", headless=True)

    # A visitor without a session sees the public links and a working site.
    page = browser.new_page(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(BASE, wait_until="networkidle")
    expect(page.locator(".nav-account").get_by_role("link", name="Entrar")).to_be_visible()
    expect(page.locator(".nav-account").get_by_role("link", name="Cadastrar")).to_be_visible()
    assert page.locator(".hero-note").count() == 0
    results.append({"anonymous_header": True})

    # Registration: local validation first, then the server.
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
    page.wait_for_url(BASE + "/", timeout=10000)
    page.wait_for_load_state("networkidle")
    expect(page.locator(".nav-user")).to_have_text("Olá, Teste")
    expect(page.locator(".hero-note")).to_contain_text(EMAIL)
    cookies = [c for c in page.context.cookies() if c["name"] == "gerencia_session"]
    assert len(cookies) == 1 and cookies[0]["httpOnly"] and cookies[0]["sameSite"] == "Lax"
    assert page.evaluate("document.cookie").find("gerencia_session") == -1  # not readable from scripts
    results.append({"register": True, "cookie_httponly": True})

    # The session survives a reload, and the auth pages bounce a signed-in visitor home.
    page.reload(wait_until="networkidle")
    expect(page.locator(".nav-user")).to_have_text("Olá, Teste")
    page.goto(BASE + "/login", wait_until="networkidle")
    page.wait_for_url(BASE + "/", timeout=10000)
    results.append({"session_persists": True, "auth_pages_redirect": True})

    # Signing out ends the session on the server too.
    page.get_by_role("button", name="Sair").click()
    expect(page.locator(".nav-account").get_by_role("link", name="Entrar")).to_be_visible()
    assert page.locator(".hero-note").count() == 0
    page.reload(wait_until="networkidle")
    expect(page.locator(".nav-account").get_by_role("link", name="Entrar")).to_be_visible()
    assert not [c for c in page.context.cookies() if c["name"] == "gerencia_session" and c["value"]]
    results.append({"logout": True})

    # Login: a wrong password shows one clear message and keeps the form.
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
    page.wait_for_url(BASE + "/", timeout=10000)
    page.wait_for_load_state("networkidle")
    expect(page.locator(".nav-user")).to_have_text("Olá, Teste")
    results.append({"login_error": True, "login": True, "axe_error_states": True})

    # A second sign-up with the same e-mail is refused on the e-mail field.
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

    # Narrow screens: both forms fit and the mobile menu carries the account area.
    for width, height in [(320, 740), (390, 844)]:
        mobile = browser.new_page(viewport={"width": width, "height": height}, reduced_motion="reduce")
        for route in ("/login", "/register"):
            mobile.goto(BASE + route, wait_until="networkidle")
            no_overflow(mobile, f"{route}@{width}")
        mobile.goto(BASE, wait_until="networkidle")
        mobile.get_by_role("button", name="Abrir menu").click()
        expect(mobile.locator("#site-navigation").get_by_role("link", name="Entrar")).to_be_visible()
        no_overflow(mobile, f"/@{width}")
        mobile.close()
    results.append({"mobile": True})

    # With the API down the public site still works.
    offline = browser.new_page(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    offline.route("**/api/**", lambda route: route.abort())
    offline.goto(BASE, wait_until="networkidle")
    expect(offline.get_by_role("heading", name="Sua fatura diz mais que o total.")).to_be_visible()
    expect(offline.locator(".nav-account").get_by_role("link", name="Entrar")).to_be_visible()
    offline.goto(BASE + "/login", wait_until="networkidle")
    offline.fill("#login-email", EMAIL)
    offline.fill("#login-password", PASSWORD)
    offline.get_by_role("button", name="Entrar", exact=True).click()
    expect(offline.get_by_role("alert")).to_contain_text("Não foi possível falar com o servidor")
    offline.close()
    results.append({"api_down_site_works": True})

    browser.close()

print(json.dumps(results, ensure_ascii=False, indent=2))
