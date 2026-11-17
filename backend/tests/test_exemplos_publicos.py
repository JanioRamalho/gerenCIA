"""Os downloads reais da tela Arquivos devem ser importáveis e reconciliáveis."""
from pathlib import Path
import json

import pandas as pd
import pytest

from app.pipeline.analise import processar_arquivo, calcular_analytics, linhas_para_gravar, quadro_de_transacoes

EXEMPLOS = Path(__file__).resolve().parents[2] / "frontend/public/exemplos"


@pytest.mark.parametrize("extensao", ["csv", "xlsx"])
def test_exemplos_tres_meses_sao_equivalentes_e_reconciliaveis(extensao):
    extrato = EXEMPLOS / f"exemplo-extrato-3-meses.{extensao}"
    fatura = EXEMPLOS / f"exemplo-fatura-3-meses.{extensao}"
    e = processar_arquivo(extrato.read_bytes(), extrato.name)
    f = processar_arquivo(fatura.read_bytes(), fatura.name)
    assert len(e.transacoes) == 23 and len(f.transacoes) == 29
    assert not e.rejeitadas and not f.rejeitadas
    assert e.dimensoes["consistencia"]["percentual"] == 100
    juntos = pd.concat([e.transacoes, f.transacoes], ignore_index=True)
    a = calcular_analytics(juntos, "all")
    assert [m["mes"] for m in a["por_mes"]] == ["2026-09", "2026-10", "2026-11"]
    assert [m["total"] for m in a["por_mes"]] == ["1820.00", "1735.00", "1990.00"]
    assert a["resumo"]["total_saidas"] == "5545.00"
    assert a["resumo"]["total_entradas"] == "9300.00"
    assert a["resumo"]["total_pagamentos"] == "1750.00"
    assert a["resumo"]["total_estornos"] == "10.00"
    netflix = next(s for s in a["servicos"] if s["estabelecimento"] == "Netflix")
    assert netflix["total_periodo"] == "80.00"
    assert netflix["base_mensal"] == "40.00" and netflix["anualizado"] == "480.00"
    assert len(juntos["bank_transaction_id"].unique()) == len(juntos)


@pytest.mark.parametrize("extensao", ["csv", "xlsx"])
def test_exemplo_lacuna_separado_confere_com_entrevista(extensao):
    arquivo = EXEMPLOS / f"exemplo-comparacao-com-lacuna.{extensao}"
    p = processar_arquivo(arquivo.read_bytes(), arquivo.name, "extrato")
    a = calcular_analytics(p.transacoes, "2026-10", "2026-08")
    assert a["comparacao"]["diferenca"] == "-40.00"
    assert a["meses_disponiveis"] == ["2026-08", "2026-10"]


def test_csv_e_xlsx_no_mesmo_historico_preservam_origem_e_json_estrito():
    registros = []
    for nome in ("exemplo-extrato-3-meses.csv", "exemplo-fatura-3-meses.xlsx"):
        arquivo = EXEMPLOS / nome
        processado = processar_arquivo(arquivo.read_bytes(), nome)
        for i, linha in enumerate(linhas_para_gravar(processado.transacoes)):
            registros.append(dict(id=f"{nome}-{i}", upload_id=nome,
                data=linha["transaction_date"], descricao=linha["description_raw"],
                estabelecimento=linha["merchant"], categoria=linha["category_name"],
                valor=linha["amount"], tipo=linha["transaction_type"],
                parcela_atual=linha["installment_current"], parcela_total=linha["installment_total"],
                source_row=linha["source_row"], source_sheet=linha["source_sheet"], category_id=None))
    data = calcular_analytics(quadro_de_transacoes(registros), "all")
    json.dumps(data, allow_nan=False)
    assert data["resumo"]["total_saidas"] == "5545.00"
    assert {item["source_sheet"] for item in data["recentes"]} == {None, "Movimentos fictícios"}
    assert all(isinstance(item["source_row"], int) for item in data["recentes"])
