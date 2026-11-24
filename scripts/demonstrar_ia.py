"""Demonstra a IA do gerenCIA no terminal, sem banco e sem API.

Lê as faturas fictícias, monta os totais de cada mês com o mesmo pipeline do
sistema, treina a regressão linear e mostra o perfil e os meses fora do padrão.

Uso, a partir da pasta principal do projeto:

    .\\.venv\\Scripts\\python.exe scripts\\demonstrar_ia.py
    .\\.venv\\Scripts\\python.exe scripts\\demonstrar_ia.py --renda 5000 --sem-anomalia
    .\\.venv\\Scripts\\python.exe scripts\\demonstrar_ia.py meu_arquivo.csv outro.csv

Sem arquivos, usa scripts/exemplos/ia/historico_11_meses.csv e a fatura
anômala de nov/2026.
"""

import argparse
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "backend"))

import pandas as pd  # noqa: E402

from app.ai.perfil import analisar_perfil, totais_por_mes  # noqa: E402
from app.pipeline.analise import processar_arquivo  # noqa: E402

EXEMPLOS = RAIZ / "scripts" / "exemplos" / "ia"


def brl(valor: float) -> str:
    return "R$ " + f"{valor:,.2f}".replace(",", "_").replace(".", ",").replace("_", ".")


def main() -> None:
    parser = argparse.ArgumentParser(description="Perfil de gastos e anomalias com regressão linear.")
    parser.add_argument("arquivos", nargs="*", type=Path, help="faturas ou extratos em CSV/XLSX")
    parser.add_argument("--renda", type=float, default=5000.0, help="renda mensal em reais (padrão: 5000)")
    parser.add_argument("--sem-anomalia", action="store_true", help="usa só o histórico normal de 11 meses")
    args = parser.parse_args()

    arquivos = args.arquivos or [EXEMPLOS / "historico_11_meses.csv"]
    if not args.arquivos and not args.sem_anomalia:
        arquivos.append(EXEMPLOS / "fatura_nov_2026_anomala.csv")

    quadros = []
    for caminho in arquivos:
        processado = processar_arquivo(caminho.read_bytes(), caminho.name)
        print(f"Lido: {caminho.name} ({processado.qualidade['linhas_validas']} linhas válidas)")
        quadros.append(processado.transacoes)
    resultado = analisar_perfil(totais_por_mes(pd.concat(quadros, ignore_index=True)), args.renda)

    print(f"\nMeses analisados: {resultado['meses_analisados']} | confiabilidade: {resultado['confiabilidade']}")
    if not resultado["suficiente"]:
        print("\n".join(resultado["avisos"]))
        return

    perfil = resultado["perfil"]
    print("\nPERFIL APRENDIDO (regressão com os meses normais)")
    print(f"  Gasto típico ......... {brl(perfil['gasto_tipico'])}")
    print(f"  Tendência ............ {brl(perfil['tendencia_mensal'])} por mês")
    print(f"  Variação normal (s) .. {brl(perfil['variacao_normal'])}")
    print(f"  R² ................... {perfil['r2']:.3f}")
    if perfil["comprometimento_da_renda"] is not None:
        print(f"  Gasto / renda ........ {perfil['comprometimento_da_renda']:.0%} de {brl(args.renda)}")
    proximo = perfil["proximo_mes"]
    print(f"  Previsão {proximo['rotulo']} ... {brl(proximo['esperado'])} (alerta acima de {brl(proximo['limite_alerta'])})")

    print("\nCADA MÊS AVALIADO DEIXANDO-O DE FORA DO TREINO")
    print(f"  {'Mês':<9}{'Real':>14}{'Esperado':>14}{'Limite':>14}{'Desvios':>9}")
    for mes in resultado["meses"]:
        marca = "  <-- ANOMALIA" if mes["anomalia"] else ""
        print(f"  {mes['rotulo']:<9}{brl(mes['total']):>14}{brl(mes['esperado']):>14}"
              f"{brl(mes['limite_alerta']):>14}{mes['desvios']:>9.2f}{marca}")

    print()
    for anomalia in resultado["anomalias"]:
        print("ALERTA:", anomalia["mensagem"])
    if not resultado["anomalias"]:
        print("Nenhum mês fora do padrão.")
    for aviso in resultado["avisos"]:
        print("Aviso:", aviso)


if __name__ == "__main__":
    main()
