"""Importação, histórico, transações, painel e avisos no navegador com banco descartável."""

import os
import sys
from datetime import datetime
from pathlib import Path
from uuid import uuid4
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".audit-tools"))
from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("GERENCIA_TEST_URL", "http://127.0.0.1:5173").rstrip("/")
MONTH = datetime.now(ZoneInfo("America/Sao_Paulo")).strftime("%Y-%m")
FATURA = {
    "name": "fatura-teste.csv",
    "mimeType": "text/csv",
    "buffer": f"date,title,amount\n{MONTH}-01,Netflix.Com,85.00\n".encode("utf-8"),
}


def enviar_fatura(page, status):
    page.get_by_label("Arquivo", exact=True).set_input_files(FATURA)
    with page.expect_response(lambda response: "/api/uploads?" in response.url) as upload:
        page.get_by_role("button", name="Enviar arquivo").click()
    assert upload.value.status == status, upload.value.text()


def check_finance_flow(page):
    page.goto(BASE + "/register")
    page.fill("#register-name", "Conta Financeira")
    page.fill("#register-email", f"financeiro-{uuid4().hex}@exemplo.test")
    page.fill("#register-password", "senha-de-teste-1")
    page.fill("#register-confirm", "senha-de-teste-1")
    page.get_by_role("button", name="Criar conta").click()
    expect(page).to_have_url(BASE + "/app")

    page.get_by_role("link", name="Limites", exact=True).click()
    page.get_by_role("button", name="Definir limite de Assinaturas").click()
    dialog = page.get_by_role("dialog", name="Limite de Assinaturas")
    dialog.get_by_label("Valor do limite (R$)").fill("100,00")
    dialog.get_by_role("button", name="Salvar limite").click()
    expect(page.get_by_role("heading", name="Assinaturas", exact=True)).to_be_visible()

    page.get_by_role("link", name="Arquivos", exact=True).click()
    expect(page.get_by_text("Nenhum arquivo enviado")).to_be_visible()
    enviar_fatura(page, 201)
    expect(page.get_by_text("Arquivo lido e gravado.")).to_be_visible()
    historico = page.get_by_role("region", name="Histórico de importações")
    expect(historico.get_by_text(FATURA["name"], exact=True)).to_be_visible()

    enviar_fatura(page, 409)
    expect(page.get_by_role("alert")).to_contain_text("Este arquivo já foi enviado")
    expect(historico.get_by_role("listitem")).to_have_count(1)

    historico.get_by_role("link", name=f"Ver transações de {FATURA['name']}").click()
    expect(page.get_by_role("button", name="Netflix", exact=True)).to_be_visible()
    expect(page.get_by_text("1 transação", exact=True)).to_be_visible()

    page.get_by_role("link", name="Painel", exact=True).click()
    expect(page.get_by_text("Total de saídas", exact=True)).to_be_visible()
    expect(page.locator(".dashboard-total")).to_contain_text("85,00")
    sino = page.locator("summary[aria-label^='Notificações']")
    expect(sino).to_have_attribute("aria-label", "Notificações, 1 não lida")
    sino.click()
    expect(page.get_by_text("Atingiu a faixa de 80%", exact=False)).to_be_visible()
    page.get_by_role("button", name="Marcar todas como lidas").click()
    expect(sino).to_have_attribute("aria-label", "Notificações")

    page.get_by_role("link", name="Arquivos", exact=True).click()
    page.get_by_role("button", name=f"Remover {FATURA['name']}").click()
    page.get_by_role("dialog", name="Remover arquivo").get_by_role("button", name="Remover arquivo").click()
    expect(page.get_by_text("Nenhum arquivo enviado")).to_be_visible()


if __name__ == "__main__":
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", headless=True)
        try:
            check_finance_flow(browser.new_page(viewport={"width": 1440, "height": 900}))
        finally:
            browser.close()
    print("Fluxo financeiro aprovado: limite, importação, reenvio recusado, histórico, transações, painel, aviso e remoção.")
