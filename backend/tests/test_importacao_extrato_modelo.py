import io
from decimal import Decimal

import pandas as pd
import pytest

from app.pipeline.analise import processar_arquivo, linhas_para_gravar, calcular_analytics
from app.pipeline.previa import ArquivoInvalido


def processar(texto, tipo="extrato"):
    return processar_arquivo(texto.encode("utf-8"), "modelo.csv", tipo)


def test_modelo_exige_tipo_e_maioria_de_receitas_nao_inverte_saidas():
    texto = "data;descricao;valor\n01/08/2026;Uber;-0,10\n02/08/2026;Tarifa;-0,20\n03/08/2026;Salário;1000,00\n04/08/2026;Pix recebido;100,00\n05/08/2026;Pix recebido;200,00"
    with pytest.raises(ArquivoInvalido, match="tipo do documento"):
        processar_arquivo(texto.encode(), "modelo.csv")
    for tipo in ("extrato", "fatura"):
        p = processar(texto, tipo)
        assert list(p.transacoes["tipo"]) == ["purchase", "fee", "income", "income", "income"]
        a = calcular_analytics(p.transacoes)
        assert a["resumo"]["total_saidas"] == "0.30"
        assert a["resumo"]["total_entradas"] == "1300.00"


def test_nubank_preserva_identificador_saldo_e_reconcilia_transicao():
    texto = "Data,Valor,Identificador,Descrição,Saldo\n01/08/2026,1000.00,primeiro,Salário,1000.00\n02/08/2026,-25.50,segundo,Uber,974.50\n03/08/2026,5.50,terceiro,Estorno Uber,980.00"
    p = processar(texto)
    linhas = linhas_para_gravar(p.transacoes)
    assert p.formato == "extrato_nubank"
    assert [l["bank_transaction_id"] for l in linhas] == ["primeiro", "segundo", "terceiro"]
    assert linhas[-1]["balance"] == Decimal("980.00")
    assert linhas[-1]["transaction_type"] == "refund"
    assert p.dimensoes["consistencia"]["quantidade"] == 2
    assert p.dimensoes["consistencia"]["percentual"] == 100
    with pytest.raises(ArquivoInvalido, match="Saldo não reconciliado"):
        processar(texto.replace("974.50", "900.00"))


def test_sem_saldo_inicial_nem_ordem_nao_inventa_reconciliacao():
    p = processar("data;descricao;valor;saldo\n03/08/2026;A;-1,00;10,00\n02/08/2026;B;-1,00;11,00")
    assert p.dimensoes["consistencia"]["percentual"] is None
    assert p.dimensoes["consistencia"]["motivo"]


def test_xlsx_preserva_folha_linha_e_id_com_zero_a_esquerda():
    memoria = io.BytesIO()
    df = pd.DataFrame({"data":["01/08/2026"], "descricao":["Loja"], "valor":["-0,10"], "id":["00012"]})
    with pd.ExcelWriter(memoria, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Movimentos", index=False)
    p = processar_arquivo(memoria.getvalue(), "modelo.xlsx", "extrato")
    linha = linhas_para_gravar(p.transacoes)[0]
    assert linha["source_sheet"] == "Movimentos"
    assert linha["source_row"] == 2
    assert linha["bank_transaction_id"] == "00012"


def test_rejeicoes_e_completude_sao_evidencias_separadas():
    p = processar("data;descricao;valor;saldo;tipo\n01/08/2026;;-1,00;;\n31/02/2026;X;-2,00;;\n02/08/2026;Y;-3,00;inválido;\n03/08/2026;Z;-4,00;;errado\n04/08/2026;Uber;-5,00;;purchase")
    assert {r["codigo"] for r in p.rejeitadas} == {"empty_description", "invalid_date", "invalid_balance", "invalid_type"}
    assert p.dimensoes["completude"]["percentual"] == 80
    assert p.dimensoes["validade"]["percentual"] == 20
    assert len(linhas_para_gravar(p.transacoes)) == 1


def test_csv_preserva_linha_real_com_vazias_e_descricao_multilinha():
    p = processar('data;descricao;valor\n\n01/08/2026;"Loja\nCentral";-1,00\n02/08/2026;Uber;-2,00')
    assert [l["source_row"] for l in linhas_para_gravar(p.transacoes)] == [3, 5]


def test_csv_malformado_recusado_sem_descartar_colunas():
    with pytest.raises(ArquivoInvalido, match="colunas"):
        processar("data;descricao;valor\n01/08/2026;A;-1,00;coluna_extra")


def test_suspeita_igual_sem_id_nao_se_torna_duplicata_confirmada():
    p = processar("data;descricao;valor\n01/08/2026;Uber;-1,00\n01/08/2026;Uber;-1,00")
    linhas = linhas_para_gravar(p.transacoes)
    assert not any(l["is_duplicate"] for l in linhas)
    assert linhas[1]["is_suspected_duplicate"]
    assert calcular_analytics(p.transacoes)["resumo"]["total_saidas"] == "2.00"
