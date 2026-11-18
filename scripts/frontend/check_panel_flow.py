"""Percurso interno real. Exige serve_disposable_api.py e Vite em 5199.

Cria e exclui somente contas fictícias depois de conferir o marcador da API
descartável. Relatórios e capturas ficam ignorados em .impeccable/review.
"""

import json
import os
import re
import sys
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".audit-tools"))
from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("GERENCIA_TEST_URL", "http://127.0.0.1:5199").rstrip("/")
OUT = ROOT / ".impeccable/review"
OUT.mkdir(parents=True, exist_ok=True)
EXAMPLES = ROOT / "frontend/public/exemplos"
AXE = ROOT / ".audit-tools-js/node_modules/axe-core/axe.min.js"
report = {"checks": [], "screens": [], "issues": []}


def visit(page, path):
    page.goto(BASE + path, wait_until="networkidle")
    expect(page.locator("h1")).to_be_visible()


def check_layout(page, name):
    overflow = page.evaluate("document.documentElement.scrollWidth > innerWidth")
    if overflow: report["issues"].append({"screen": name, "overflow": True})
    page.add_script_tag(path=str(AXE))
    violations = page.evaluate("""async () => (await axe.run(document, {
      runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa','wcag22aa']}
    })).violations.map(v => ({id:v.id, targets:v.nodes.map(n=>n.target)}))""")
    if violations: report["issues"].append({"screen": name, "axe": violations})
    page.screenshot(path=str(OUT / f"real-{name}.png"), full_page=True)
    report["screens"].append(name)


def upload(page, filename, kind):
    page.locator('input[type="file"]').set_input_files(EXAMPLES / filename)
    page.get_by_label("Tipo do documento").select_option(kind)
    page.get_by_role("button", name="Enviar arquivo", exact=True).click()
    expect(page.locator(".pd-success")).to_be_visible(timeout=20000)
    page.wait_for_load_state("networkidle")


with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True)
    context = browser.new_context(viewport={"width": 1280, "height": 900}, reduced_motion="reduce")
    marker = context.request.get(BASE + "/api/__review_context")
    assert marker.ok and marker.json() == {
        "disposable": True, "purpose": "panel-flow", "database": "panel_review"
    }, "Interrompido: a API não confirmou o banco descartável."
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    email = f"painel-{uuid4().hex[:10]}@exemplo.test"
    password = "senha-de-ensaio-123"

    for width in [390, 1440]:
        page.set_viewport_size({"width": width, "height": 900})
        for path, name in [("/", "inicio"), ("/login", "login"), ("/register", "cadastro")]:
            visit(page, path)
            check_layout(page, f"{name}-{width}")
        page.get_by_role("button", name="Criar conta", exact=True).click()
        check_layout(page, f"cadastro-erros-{width}")
    page.set_viewport_size({"width": 1440, "height": 1000})
    visit(page, "/register")
    page.fill("#register-name", "Ensaio Financeiro")
    page.fill("#register-email", email)
    page.fill("#register-password", password)
    page.fill("#register-confirm", password)
    page.get_by_role("button", name="Criar conta").click()
    page.wait_for_url(BASE + "/app")
    page.wait_for_load_state("networkidle")
    expect(page.get_by_role("heading", level=1)).to_have_text("Olá, Ensaio.")

    visit(page, "/app/files")
    upload(page, "exemplo-extrato-3-meses.csv", "extrato")
    upload(page, "exemplo-fatura-3-meses.xlsx", "fatura")
    uploads = context.request.get(BASE + "/api/uploads").json()
    assert len(uploads) == 2, uploads
    upload(page, "exemplo-extrato-3-meses.csv", "extrato")
    assert len(context.request.get(BASE + "/api/uploads").json()) == 2
    expect(page.locator(".pd-success")).to_contain_text("já havia sido enviado")
    page.get_by_role("button", name="exemplo-extrato-3-meses.csv", exact=True).click()
    expect(page.get_by_text("Completude", exact=True)).to_be_visible()
    for width in [390, 1440]:
        page.set_viewport_size({"width": width, "height": 900})
        check_layout(page, f"qualidade-{width}")
    report["checks"].append("CSV/XLSX, reenvio idempotente e detalhe da qualidade")

    visit(page, "/app?month=2026-11&reference_month=2026-10")
    expect(page.locator(".gc-primary-metric strong")).to_contain_text("1.990,00")
    expect(page.locator(".gc-recent-table tbody tr")).to_have_count(5)
    expect(page.locator(".gc-comparison-delta strong")).to_contain_text("255,00")
    for month, total in [("2026-09", "1820.00"), ("2026-10", "1735.00"), ("2026-11", "1990.00")]:
        data = context.request.get(BASE + f"/api/analytics/summary?month={month}").json()
        assert data["resumo"]["total_saidas"] == total, data
    services = data["servicos"]
    assert any(item["estabelecimento"] == "Netflix" for item in services)
    for service in services:
        expect(page.locator(".gc-service-details strong").get_by_text(service["estabelecimento"], exact=True)).to_be_visible()
    expect(page.locator(".gc-services details").first).not_to_have_attribute("open", "")
    expect(page.locator(".gc-services .gc-comparison-column")).to_have_count(2)
    expect(page.locator(".gc-comparison .gc-comparison-column")).to_have_count(2)
    for chart in [".gc-comparison", ".gc-services"]:
        bars = page.locator(f"{chart} .gc-comparison-fill")
        expect(bars).to_have_count(2)
        assert bars.evaluate_all("nodes => nodes.every(n => getComputedStyle(n).backgroundColor !== 'rgba(0, 0, 0, 0)' && n.getBoundingClientRect().height > 0)"), chart
    expect(page.locator(".gc-service-details strong").first).to_have_text("Netflix")
    page.get_by_role("button", name="Ver todas as 9 categorias").click()
    expect(page.locator(".gc-category-bars li")).to_have_count(9)
    page.get_by_role("button", name="Mostrar as 5 maiores").click()
    expect(page.locator(".gc-category-bars li")).to_have_count(5)
    expect(page.locator(".gc-recent").get_by_role("link", name="Ver tudo")).to_have_attribute("href", re.compile("/app/transactions"))
    report["checks"].append("Totais 1820/1735/1990 reconciliados, Netflix e serviços reais visíveis, dois gráficos e cinco recentes")

    # Seletores reais e URL persistente de comparação.
    page.get_by_label("Mês de referência").select_option("2026-09")
    expect(page.locator(".gc-comparison-delta strong")).to_contain_text("170,00")
    page.reload(wait_until="networkidle")
    expect(page.get_by_label("Mês de referência")).to_have_value("2026-09")

    # Falha apenas na referência das recorrências: não inventar valor zero.
    page.route("**/api/analytics/summary?month=2026-10", lambda route: route.fulfill(status=503, json={"detail": "Ensaio de indisponibilidade"}))
    visit(page, "/app?month=2026-11&reference_month=2026-10")
    expect(page.locator(".gc-services .pd-error")).to_be_visible()
    expect(page.locator(".gc-services .gc-comparison-column").first).to_contain_text("Sem dados")
    page.unroute("**/api/analytics/summary?month=2026-10")
    page.locator(".gc-services").get_by_role("button", name="Tentar de novo").click()
    expect(page.locator(".gc-services .pd-error")).to_have_count(0)
    expect(page.locator(".gc-services .gc-comparison-column").first).not_to_contain_text("Sem dados")
    report["checks"].append("Barras dos dois meses visíveis, assinaturas primeiro e referência indisponível sem substituir por zero")

    visit(page, "/app/transactions?month=all&page_size=5")
    expect(page.locator(".gc-transactions-table tbody tr")).to_have_count(5)
    first_rows = page.locator(".gc-transactions-table tbody").inner_text()
    page.get_by_role("button", name="Próxima", exact=True).click()
    expect(page.get_by_text("Página 2 de", exact=False)).to_be_visible()
    assert page.locator(".gc-transactions-table tbody").inner_text() != first_rows
    page.get_by_label("Buscar estabelecimento ou descrição").fill("Netflix")
    page.get_by_role("button", name="Aplicar filtros").click()
    expect(page.locator(".gc-transactions-table tbody tr")).not_to_have_count(0)
    assert "Netflix" in page.locator(".gc-transactions-table tbody").inner_text()
    page.get_by_role("button", name="Conferir e categorizar").first.click()
    editor = page.locator(".gc-editor")
    expect(editor).to_be_visible()
    editor.get_by_role("combobox").select_option(label="Lazer")
    editor.get_by_role("button", name="Salvar categoria").click()
    expect(editor.get_by_text("Categoria atualizada", exact=False)).to_be_visible()
    report["checks"].append("Paginação, busca e correção de categoria persistida")

    visit(page, "/app/budgets?month=2026-11")
    food = page.locator(".gc-budget-card").filter(has=page.get_by_role("heading", name="Alimentação", exact=True))
    food.get_by_role("button", name="Definir limite").click()
    food.get_by_label("Limite mensal em reais").fill("100")
    food.get_by_role("button", name="Salvar limite").click()
    expect(food.get_by_text("Acima do limite", exact=True)).to_be_visible()
    page.get_by_role("button", name=re.compile(r"^Avisos")).click()
    notes = page.locator("#notifications-panel")
    expect(notes.get_by_role("heading", name="Seus avisos")).to_be_visible()
    notes.get_by_role("button", name="Marcar todos como lidos").click()
    expect(page.get_by_role("button", name="Avisos", exact=True)).to_be_visible()
    page.keyboard.press("Escape")
    assert context.request.get(BASE + "/api/notifications").json()["unread_count"] == 0
    report["checks"].append("Limite, avisos e leitura persistidos")

    for width in [320, 390, 1440]:
        page.set_viewport_size({"width": width, "height": 900})
        for path, name in [("/app", "painel"), ("/app/files", "arquivos"),
                           ("/app/transactions", "transacoes"), ("/app/budgets", "limites"),
                           ("/app/account", "conta")]:
            visit(page, path)
            check_layout(page, f"{name}-{width}")

    # Links por teclado e logout/login validam sessão real antes da exclusão final.
    page.set_viewport_size({"width": 1280, "height": 900})
    visit(page, "/app/account")
    page.keyboard.press("Tab")
    assert page.evaluate("document.activeElement.tagName") == "A"
    page.get_by_role("button", name="Sair", exact=True).click()
    page.wait_for_url(BASE + "/")
    visit(page, "/login")
    page.fill("#login-email", email)
    page.fill("#login-password", password)
    page.get_by_role("button", name="Entrar", exact=True).click()
    page.wait_for_url(BASE + "/app")
    visit(page, "/app/files")
    page.get_by_role("button", name="Remover", exact=True).first.click()
    page.get_by_role("button", name="Confirmar exclusão").click()
    expect(page.locator(".pd-error")).to_have_count(0)
    expect(page.get_by_role("button", name="Remover", exact=True)).to_have_count(1)
    visit(page, "/app/account")
    page.get_by_role("button", name="Solicitar exclusão da conta").click()
    page.get_by_role("checkbox").check()
    page.get_by_role("button", name="Excluir definitivamente").click()
    page.wait_for_url(BASE + "/")
    assert context.request.get(BASE + "/api/auth/me").status == 401
    report["checks"].append("Logout/login, exclusão de arquivo e exclusão da conta")

    # Conta separada: setembro precisa continuar ausente neste exemplo.
    visit(page, "/register")
    page.fill("#register-name", "Ensaio Intervalo")
    page.fill("#register-email", f"intervalo-{uuid4().hex[:10]}@exemplo.test")
    page.fill("#register-password", password)
    page.fill("#register-confirm", password)
    page.get_by_role("button", name="Criar conta").click()
    page.wait_for_url(BASE + "/app")
    visit(page, "/app/files")
    upload(page, "exemplo-comparacao-com-lacuna.csv", "extrato")
    visit(page, "/app?month=2026-10")
    expect(page.get_by_label("Mês de referência")).to_have_value("")
    expect(page.locator(".gc-comparison-delta")).to_have_count(0)
    page.get_by_label("Mês de referência").select_option("2026-08")
    expect(page.locator(".gc-comparison-delta strong")).to_contain_text("40,00")
    expect(page.locator(".gc-comparison-delta strong")).to_contain_text("-")
    page.get_by_text("Comparar por categoria", exact=True).click()
    health = page.locator(".gc-comparison tbody tr").filter(has_text="Saúde")
    expect(health).to_contain_text("30,00")
    expect(page.locator(".gc-comparison .gc-comparison-column").first).to_have_attribute("href", re.compile("month=2026-08"))
    page.locator(".gc-comparison .gc-comparison-column").first.click()
    expect(page).to_have_url(re.compile(r"/app/transactions\?.*month=2026-08"))
    expect(page.locator(".gc-statistics")).to_contain_text("150,00")
    page.go_back(wait_until="networkidle")
    expect(page.get_by_label("Mês de referência")).to_have_value("2026-08")
    page.reload(wait_until="networkidle")
    expect(page.locator(".gc-comparison-delta strong")).to_contain_text("40,00")
    assert context.request.delete(BASE + "/api/auth/me").status == 204
    visit(page, "/teste-analise")
    page.wait_for_url(BASE + "/login")
    report["checks"].append("Comparação agosto/outubro com setembro ausente, referência correta, voltar/recarregar e endereço antigo")
    assert not errors, errors
    report["pageerrors"] = errors
    (OUT / "panel-real-flow.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False))
    browser.close()
    assert not report["issues"], report["issues"]
