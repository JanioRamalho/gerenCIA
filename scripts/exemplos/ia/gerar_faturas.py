"""Gera as faturas fictícias do estudo da IA (perfil de quem ganha R$ 5.000).

Uso, a partir da pasta principal do projeto:

    .\\.venv\\Scripts\\python.exe scripts\\exemplos\\ia\\gerar_faturas.py

Cria:
1. Os dois arquivos usados pelos testes automatizados:
   - historico_11_meses.csv: dez/2025 a out/2026, gastos entre R$ 5,3 mil e R$ 7 mil;
   - fatura_nov_2026_anomala.csv: nov/2026 com R$ 10.880,00.
2. As 12 faturas mensais individuais de jan/2026 a dez/2026 em faturas_2026/:
   - 10 meses normais entre R$ 5.380,00 e R$ 6.480,00;
   - 2 meses anômalos em R$ 12.000,00 (maio/2026 e novembro/2026).

Os valores são sorteados com semente fixa, então o resultado é sempre o mesmo.
"""

import random
from pathlib import Path

PASTA = Path(__file__).resolve().parent
PASTA_12_MESES = PASTA / "faturas_2026"

# Estudo original (mantido intacto para os testes automatizados).
TOTAIS_NORMAIS = {
    "2025-12": 6580.00, "2026-01": 5420.00, "2026-02": 5310.00, "2026-03": 6120.00,
    "2026-04": 5890.00, "2026-05": 6340.00, "2026-06": 5760.00, "2026-07": 6930.00,
    "2026-08": 6210.00, "2026-09": 5650.00, "2026-10": 6470.00,
}
MES_ANOMALO, TOTAL_ANOMALO = "2026-11", 10880.00

# 12 faturas separadas de janeiro a dezembro de 2026, com 2 anomalias de R$ 12.000.
FATURAS_ANO_2026 = [
    ("01_fatura_jan_2026.csv", "2026-01", 5620.00, ()),
    ("02_fatura_fev_2026.csv", "2026-02", 5380.00, ()),
    ("03_fatura_mar_2026.csv", "2026-03", 6140.00, ()),
    ("04_fatura_abr_2026.csv", "2026-04", 5890.00, ()),
    (
        "05_fatura_mai_2026.csv",
        "2026-05",
        12000.00,
        [(7, "Leroy Merlin Reforma", 2890.00), (12, "Magazine Luiza Geladeira", 2450.00), (18, "Conserto Auto Oficina", 1180.00)],
    ),
    ("06_fatura_jun_2026.csv", "2026-06", 5760.00, ()),
    ("07_fatura_jul_2026.csv", "2026-07", 6480.00, ()),
    ("08_fatura_ago_2026.csv", "2026-08", 6190.00, ()),
    ("09_fatura_set_2026.csv", "2026-09", 5690.00, ()),
    ("10_fatura_out_2026.csv", "2026-10", 6410.00, ()),
    (
        "11_fatura_nov_2026.csv",
        "2026-11",
        12000.00,
        [(6, "Latam Airlines Passagem", 2680.00), (9, "Fast Shop Notebook", 2590.00), (14, "Hotel Beira Mar", 1390.00)],
    ),
    ("12_fatura_dez_2026.csv", "2026-12", 6280.00, ()),
]

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
EXTRAS_DO_MES_ANOMALO = [
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
    falta = round(total - sum(v for *_, v in linhas), 2)
    linhas.append((f"{mes}-27", "Supermercado Bom Preço", falta))
    linhas.append((f"{mes}-20", "Pagamento recebido", -round(total * 0.9, 2)))  # pagamento não é gasto
    return sorted(linhas)


def gravar(caminho: Path, linhas: list[tuple[str, str, float]]) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    texto = "date,title,amount\n" + "".join(f"{data},{titulo},{valor:.2f}\n" for data, titulo, valor in linhas)
    caminho.write_text(texto, encoding="utf-8", newline="\n")


def main() -> None:
    sorteio = random.Random(2026)
    historico = []
    for mes, total in TOTAIS_NORMAIS.items():
        historico += gerar_mes(sorteio, mes, total)
    gravar(PASTA / "historico_11_meses.csv", historico)
    gravar(PASTA / "fatura_nov_2026_anomala.csv", gerar_mes(sorteio, MES_ANOMALO, TOTAL_ANOMALO, EXTRAS_DO_MES_ANOMALO))

    sorteio_ano = random.Random(202612)
    for nome_arquivo, mes, total, extras in FATURAS_ANO_2026:
        gravar(PASTA_12_MESES / nome_arquivo, gerar_mes(sorteio_ano, mes, total, extras))

    print("Arquivos gerados em", PASTA, "e", PASTA_12_MESES)


if __name__ == "__main__":
    main()
