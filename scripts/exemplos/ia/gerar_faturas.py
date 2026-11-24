"""Gera as faturas fictícias do estudo da IA (perfil de quem ganha R$ 5.000).

Uso, a partir da pasta principal do projeto:

    .\\.venv\\Scripts\\python.exe scripts\\exemplos\\ia\\gerar_faturas.py

Cria dois arquivos no formato da fatura Nubank (date,title,amount):

- historico_11_meses.csv: dez/2025 a out/2026, gastos entre R$ 5,3 mil e R$ 7 mil;
- fatura_nov_2026_anomala.csv: nov/2026 com cerca de R$ 10,9 mil.

Os valores são sorteados com semente fixa, então o resultado é sempre o mesmo.
"""

import random
from pathlib import Path

PASTA = Path(__file__).resolve().parent

# Total de cada mês, em reais. Variam de propósito em torno de R$ 6 mil.
TOTAIS_NORMAIS = {
    "2025-12": 6580.00, "2026-01": 5420.00, "2026-02": 5310.00, "2026-03": 6120.00,
    "2026-04": 5890.00, "2026-05": 6340.00, "2026-06": 5760.00, "2026-07": 6930.00,
    "2026-08": 6210.00, "2026-09": 5650.00, "2026-10": 6470.00,
}
MES_ANOMALO, TOTAL_ANOMALO = "2026-11", 10880.00

FIXOS = [  # (dia, descrição, valor): repetem todo mês
    (2, "Netflix.Com", 55.90), (3, "Spotify", 21.90), (5, "Smart Fit", 129.90),
    (10, "Claro Celular", 89.99), (15, "Seguro Auto Porto", 310.00),
]
VARIAVEIS = [  # (descrição, mínimo, máximo)
    ("Supermercado Bom Preço", 280, 620), ("Atacadão", 350, 780), ("IFD*IFOOD", 35, 120),
    ("Uber *Trip", 18, 65), ("Posto Ipiranga", 150, 320), ("Drogasil", 40, 180),
    ("Restaurante Sabor Caseiro", 60, 190), ("Padaria Pão Quente", 15, 55),
    ("Mercadolivre", 80, 450), ("Cinema Kinoplex", 40, 95), ("Pet Shop Amigo", 70, 240),
]
EXTRAS_DO_MES_ANOMALO = [  # o que fez novembro fugir do padrão
    (6, "Latam Airlines Passagem", 2380.00), (9, "Fast Shop Notebook", 2150.00),
    (14, "Hotel Beira Mar", 1240.00),
]


def gerar_mes(sorteio: random.Random, mes: str, total: float, extras=()) -> list[tuple[str, str, float]]:
    linhas = [(f"{mes}-{dia:02d}", nome, valor) for dia, nome, valor in [*FIXOS, *extras]]
    # Para 800 abaixo do total (acima do maior valor sorteado), então a compra
    # final que fecha o mês é sempre positiva.
    while sum(v for *_, v in linhas) < total - 800:
        nome, minimo, maximo = sorteio.choice(VARIAVEIS)
        linhas.append((f"{mes}-{sorteio.randint(1, 28):02d}", nome, round(sorteio.uniform(minimo, maximo), 2)))
    # A última compra fecha o total exato do mês.
    falta = round(total - sum(v for *_, v in linhas), 2)
    linhas.append((f"{mes}-27", "Supermercado Bom Preço", falta))
    linhas.append((f"{mes}-20", "Pagamento recebido", -round(total * 0.9, 2)))  # pagamento não é gasto
    return sorted(linhas)


def gravar(nome: str, linhas: list[tuple[str, str, float]]) -> None:
    texto = "date,title,amount\n" + "".join(f"{data},{titulo},{valor:.2f}\n" for data, titulo, valor in linhas)
    (PASTA / nome).write_text(texto, encoding="utf-8", newline="\n")


def main() -> None:
    sorteio = random.Random(2026)
    historico = []
    for mes, total in TOTAIS_NORMAIS.items():
        historico += gerar_mes(sorteio, mes, total)
    gravar("historico_11_meses.csv", historico)
    gravar("fatura_nov_2026_anomala.csv", gerar_mes(sorteio, MES_ANOMALO, TOTAL_ANOMALO, EXTRAS_DO_MES_ANOMALO))
    print("Arquivos gerados em", PASTA)


if __name__ == "__main__":
    main()
