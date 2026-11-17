"""Casos pequenos reconciliados à mão, sem banco nem credenciais."""
from datetime import date
from decimal import Decimal
import json

import pandas as pd

import pytest

from app.pipeline.analise import calcular_analytics, calcular_analise, quadro_de_transacoes


def quadro(*linhas):
    registros = []
    for i, linha in enumerate(linhas):
        data, valor, tipo, categoria, *nome = linha
        registros.append(dict(id=f"{i:04d}", data=data, valor=Decimal(str(valor)), tipo=tipo,
                              categoria=categoria, descricao=nome[0] if nome else categoria,
                              estabelecimento=nome[0] if nome else categoria, parcela_atual=None, parcela_total=None))
    return quadro_de_transacoes(registros)


def test_financeiro_comum_estorno_receita_e_pagamento_separados():
    df = quadro(("2026-08-01", 100, "purchase", "Alimentação"), ("2026-08-02", 10, "fee", "Serviços"),
                ("2026-08-03", 20, "refund", "Alimentação"), ("2026-08-04", 1000, "income", "Outros"),
                ("2026-08-05", 500, "payment", "Outros"))
    a = calcular_analytics(df)
    assert a["resumo"]["total_saidas"] == "90.00"
    assert a["resumo"]["total_entradas"] == "1000.00"
    assert a["resumo"]["total_pagamentos"] == "500.00"
    assert a["estatisticas"]["media"] == "55.00"
    assert a["estatisticas"]["quantidade"] == 2
    assert a["estatisticas"]["desvio_padrao"] is None
    assert sum(Decimal(c["total"]) for c in a["por_categoria"]) == Decimal("90.00")
    assert calcular_analise(df)["resumo"]["total_saidas"] == 90.0


def test_categoria_negativa_nao_ganha_participacao_ou_maior_categoria_falsa():
    df = quadro(("2026-08-01", 90, "purchase", "Alimentação"), ("2026-08-03", 50, "refund", "Saúde"))
    a = calcular_analytics(df)
    assert a["resumo"]["total_saidas"] == "40.00"
    assert all(c["participacao"] is None for c in a["por_categoria"])
    assert next(c for c in a["por_categoria"] if c["categoria"] == "Saúde")["total"] == "-50.00"
    b = calcular_analytics(quadro(("2026-08-03", 50, "refund", "Saúde")))
    assert b["resumo"]["maior_categoria"] is None


def test_confirmadas_excluidas_suspeitas_preservadas_com_identidade():
    df = quadro(*[("2026-08-01", "0.10", "purchase", "Alimentação")] * 3)
    df["is_duplicate"] = [False, False, True]
    df["is_suspected_duplicate"] = [True, True, False]
    a = calcular_analytics(df)
    assert a["resumo"]["total_saidas"] == "0.20"
    assert len(a["recentes"]) == 2


def test_vazio_nao_inventa_medidas():
    a = calcular_analytics(quadro_de_transacoes([]))
    assert a["meses_disponiveis"] == []
    assert a["estatisticas"]["media"] is None
    assert a["resumo"]["maior_categoria"] is None
    assert a["recentes"] == []


def test_meses_parciais_lacunas_e_comparacao_livre():
    df = quadro(("2026-08-01", 100, "purchase", "Alimentação"), ("2026-08-02", 50, "purchase", "Transporte"),
                ("2026-10-03", 80, "purchase", "Alimentação"), ("2026-10-04", 30, "purchase", "Saúde"))
    a = calcular_analytics(df, "2026-10", "2026-08")
    assert a["comparacao"]["diferenca"] == "-40.00"
    assert a["comparacao"]["percentual"] == pytest.approx(-.266667)
    categorias = {c["categoria"]: c for c in a["comparacao"]["por_categoria"]}
    assert categorias["Transporte"]["percentual"] == -1
    assert categorias["Saúde"]["diferenca"] == "30.00"
    assert categorias["Saúde"]["percentual"] is None
    assert a["por_mes"][1]["total"] is None
    assert calcular_analytics(df, "2026-10")["comparacao"]["motivo"] == "referencia_ausente"
    assert calcular_analytics(df, "all")["comparacao"]["motivo"] == "visao_historica"
    parcial = calcular_analytics(df, "2026-10", hoje=date(2026, 10, 16))
    assert parcial["cobertura"]["mes_em_andamento"]
    assert len(parcial["por_dia"]) == 16


@pytest.mark.parametrize("referencia,esperado", [("2026-07", "10.00"), ("2026-08", "30.00")])
def test_referencia_zero_ou_negativa_sem_percentual(referencia, esperado):
    df = quadro(("2026-07-01", 100, "income", "Outros"), ("2026-08-01", 20, "refund", "Outros"),
                ("2026-10-01", 10, "purchase", "Outros"))
    a = calcular_analytics(df, "2026-10", referencia)
    assert a["comparacao"]["diferenca"] == esperado
    assert a["comparacao"]["percentual"] is None
    assert a["comparacao"]["motivo"] == "base_nao_positiva"
    assert "2026-07" in a["meses_disponiveis"]


@pytest.mark.parametrize("mes,ref", [("2026-13", None), ("2026-10", "2026-10"), ("2026-10", "2026-09"), ("all", "2026-08")])
def test_periodos_invalidos_rejeitados(mes, ref):
    df = quadro(("2026-10-01", 10, "purchase", "Outros"))
    with pytest.raises(ValueError):
        calcular_analytics(df, mes, ref)


def test_recentes_ordenacao_estavel_de_todo_conjunto():
    df = quadro(*[("2026-08-01", 1, "purchase", "Outros")] * 305, ("2026-08-31", 7, "purchase", "Saúde"))
    a = calcular_analytics(df)
    assert len(a["recentes"]) == 5
    assert a["recentes"][0]["id"] == "0305"
    assert a["resumo"]["total_saidas"] == "312.00"
    assert a["recentes"] == calcular_analytics(df.iloc[::-1])["recentes"]


def test_mes_corrente_inclui_data_futura_importada_na_serie_e_media():
    df = quadro(("2026-11-01", 40, "purchase", "Compras"),
                ("2026-11-20", 100, "purchase", "Compras"),
                ("2026-11-20", 20, "refund", "Compras"))
    a = calcular_analytics(df, "2026-11", hoje=date(2026, 11, 17))
    assert a["resumo"]["total_saidas"] == "120.00"
    assert sum(Decimal(d["total"]) for d in a["por_dia"]) == Decimal("120.00")
    assert a["por_dia"][-1] == dict(data="2026-11-20", total="80.00")
    assert a["resumo"]["dias"] == 20
    assert a["resumo"]["media_por_dia"] == "6.00"
    assert a["cobertura"]["mes_em_andamento"]


def test_categorias_homonimas_e_sem_categoria_preservam_identidade_e_estatisticas():
    df = quadro(("2026-10-01", 10, "purchase", "Transporte"),
                ("2026-10-02", 20, "purchase", "Transporte"),
                ("2026-10-03", 30, "purchase", "Outros"),
                ("2026-10-04", 40, "purchase", "Outros"))
    df["category_id"] = ["transporte-global", "transporte-pessoal", "outros-global", None]
    a = calcular_analytics(df, "2026-10")
    categorias = {r["category_id"]: r for r in a["por_categoria"]}
    assert {k:v["total"] for k,v in categorias.items()} == {
        "transporte-global":"10.00", "transporte-pessoal":"20.00", "outros-global":"30.00", None:"40.00"}
    assert sum(Decimal(c["total"]) for c in categorias.values()) == Decimal(a["resumo"]["total_saidas"])
    assert categorias["transporte-global"]["estatisticas"]["media"] == "10.00"
    assert categorias["transporte-pessoal"]["estatisticas"]["media"] == "20.00"


def test_comparacao_une_ids_homonimos_sem_somar_ou_atribuir_base_de_outro_id():
    df = quadro(("2026-08-01", 10, "purchase", "Transporte"),
                ("2026-08-02", 30, "purchase", "Transporte"),
                ("2026-10-01", 20, "purchase", "Transporte"),
                ("2026-10-02", 40, "purchase", "Transporte"))
    df["category_id"] = ["global", "pessoal-antigo", "global", "pessoal-novo"]
    c = calcular_analytics(df, "2026-10", "2026-08")["comparacao"]
    categorias = {r["category_id"]: r for r in c["por_categoria"]}
    assert set(categorias) == {"global", "pessoal-antigo", "pessoal-novo"}
    assert categorias["global"]["diferenca"] == "10.00"
    assert categorias["global"]["percentual"] == 1
    assert categorias["pessoal-antigo"]["total"] == "0.00"
    assert categorias["pessoal-antigo"]["diferenca"] == "-30.00"
    assert categorias["pessoal-novo"]["total_referencia"] == "0.00"
    assert categorias["pessoal-novo"]["percentual"] is None
    assert sum(Decimal(r["diferenca"]) for r in categorias.values()) == Decimal(c["diferenca"])


def test_metadata_opcional_nao_expoe_nan_ou_texto_nan_em_json():
    df = quadro(("2026-10-01", 10, "purchase", "Compras"), ("2026-10-02", 20, "purchase", "Compras"))
    df["id"] = [float("nan"), "id-real"]
    df["upload_id"] = [pd.NA, "upload-real"]
    df["category_id"] = [float("nan"), "categoria-real"]
    df["source_row"] = [float("nan"), 2]
    df["source_sheet"] = [float("nan"), "nan"]  # O nome literal de uma folha é válido.
    data = calcular_analytics(df)
    json.dumps(data, allow_nan=False)
    sem_origem = next(item for item in data["recentes"] if item["valor"] == "10.00")
    assert all(sem_origem[campo] is None for campo in ("id", "upload_id", "category_id", "source_row", "source_sheet"))
    com_origem = next(item for item in data["recentes"] if item["valor"] == "20.00")
    assert com_origem["source_sheet"] == "nan"
    assert com_origem["source_row"] == 2
