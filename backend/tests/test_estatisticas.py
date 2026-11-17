from app.pipeline.analise import calcular_analytics
from test_analise_financeira import quadro


def test_medidas_documentais_e_histograma_com_bordas():
    df = quadro(*[("2026-08-01", valor, "purchase", "Outros") for valor in [10, 20, 30, 40]])
    e = calcular_analytics(df)["estatisticas"]
    assert {k:e[k] for k in ("media", "mediana", "minimo", "maximo", "amplitude", "q1", "q3", "iqr", "desvio_padrao")} == dict(
        media="25.00", mediana="25.00", minimo="10.00", maximo="40.00", amplitude="30.00", q1="17.50", q3="32.50", iqr="15.00", desvio_padrao="11.18")
    assert sum(b["quantidade"] for b in e["histograma"]) == 4
    assert e["histograma"][-1]["fim_inclusivo"]


def test_valores_iguais_moda_empates_e_faixa_unica():
    df = quadro(("2026-08-01", 10, "purchase", "Saúde", "A"), ("2026-08-01", 10, "purchase", "Alimentação", "B"))
    e = calcular_analytics(df)["estatisticas"]
    assert e["moda_categoria"] == ["Alimentação", "Saúde"]
    assert e["histograma"] == [dict(inicio="10.00", fim="10.00", quantidade=2, fim_inclusivo=True)]
    assert e["motivo_dispersao"] == "dados_insuficientes"
