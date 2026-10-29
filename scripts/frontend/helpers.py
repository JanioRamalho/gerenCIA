"""Peças comuns dos scripts de verificação da interface.

Cada script check_*.py abre o site num Chrome sem janela (Playwright), clica
como uma pessoa faria e confere o resultado com assert. Veja o README desta
pasta para preparar as ferramentas e rodar os scripts.
"""

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# O Playwright fica instalado em .audit-tools, fora do .venv do projeto.
sys.path.insert(0, str(ROOT / ".audit-tools"))
from playwright.sync_api import expect, sync_playwright  # noqa: E402,F401  (os scripts importam daqui)

# Endereço do frontend que está sendo testado.
BASE = os.environ.get("GERENCIA_TEST_URL", "http://127.0.0.1:5173").rstrip("/")

# Larguras de tela conferidas: celular pequeno, celular, tablet e computador.
SCREEN_SIZES = [(320, 740), (390, 844), (768, 1024), (1440, 992)]

# Pasta das capturas de tela. Fica fora do Git (.gitignore).
OUT = ROOT / ".impeccable" / "review"

AXE = ROOT / ".audit-tools-js" / "node_modules" / "axe-core" / "axe.min.js"
WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]

# Script que roda antes da página carregar e faz o localStorage falhar, como
# acontece quando o navegador bloqueia o armazenamento do site.
STORAGE_BLOCKER = """
Storage.prototype.getItem = () => { throw new Error("armazenamento bloqueado"); };
Storage.prototype.setItem = () => { throw new Error("armazenamento bloqueado"); };
"""


def new_page(browser, width, height):
    """Abre uma aba no tamanho pedido, com animações reduzidas para o teste não esperar por elas."""
    return browser.new_page(viewport={"width": width, "height": height}, reduced_motion="reduce")


def watch_errors(page):
    """Devolve uma lista que vai receber cada erro de JavaScript da página."""
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    return errors


def has_horizontal_scroll(page):
    """Diz se a página ficou mais larga que a tela, o que faria rolar para os lados."""
    return page.evaluate("document.documentElement.scrollWidth > innerWidth")


def block_storage(page):
    """Faz o localStorage falhar nesta aba a partir do próximo carregamento.

    add_init_script roda o código antes de qualquer script da página. Ele recebe
    instruções soltas: uma função "() => {...}" passada como texto só seria
    criada, nunca executada.
    """
    page.add_init_script(STORAGE_BLOCKER)


def storage_is_blocked(page):
    """Diz se ler o localStorage dá erro na página aberta."""
    return page.evaluate("() => { try { localStorage.getItem('teste'); return false; } catch { return true; } }")


def axe_violations(page):
    """Roda o axe (verificador de acessibilidade) e devolve as violações encontradas."""
    assert AXE.exists(), f"axe não encontrado em {AXE}; veja o README desta pasta"
    page.add_script_tag(path=str(AXE))
    report = page.evaluate(
        "async (tags) => await axe.run(document, {runOnly: {type: 'tag', values: tags}})",
        WCAG_TAGS,
    )
    violations = []
    for item in report["violations"]:
        nodes = [node["target"] for node in item["nodes"]]
        violations.append({"id": item["id"], "nodes": nodes})
    return violations


def print_results(results):
    """Mostra o resumo das verificações em JSON."""
    print(json.dumps(results, ensure_ascii=False, indent=2))
