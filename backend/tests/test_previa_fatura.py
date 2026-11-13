"""Testes da prévia de análise: leitura, limpeza, categorização e recorrência."""

import io
from decimal import Decimal
from pathlib import Path

import pandas as pd
import pytest

from app.pipeline.analise import (
    analisar_arquivo,
    calcular_analise,
    linhas_para_gravar,
    processar_arquivo,
    quadro_de_transacoes,
)
from app.pipeline.previa import (
    ArquivoInvalido,
    _categoria,
    _converter_data,
    _converter_valor,
    _estabelecimento,
    _parcela_info,
    _tipo_transacao,
)

EXEMPLOS = Path(__file__).resolve().parents[2] / "scripts" / "exemplos"


def csv(texto: str) -> bytes:
    return texto.strip().encode("utf-8")


# ---- valores e datas -------------------------------------------------------

@pytest.mark.parametrize("texto, ponto, esperado", [
    ("R$ 1.234,56", False, 123456),
    ("89,90", False, 8990),
    ("-25,00", False, -2500),
    ("1.234", False, 123400),       # no padrão brasileiro o ponto é milhar
    ("55.90", True, 5590),          # padrão do Nubank
    ("-58.70", True, -5870),
    ("", False, None),
    ("abc", False, None),
    ("12.34,56", False, None),
])
def test_converter_valor(texto, ponto, esperado):
    assert _converter_valor(texto, ponto) == esperado


@pytest.mark.parametrize("texto, esperado", [
    ("15/06/2026", "2026-06-15"),
    ("2026-06-15", "2026-06-15"),
    ("2026-06-15 00:00:00", "2026-06-15"),
    ("46188", "2026-06-15"),
    ("31/02/2026", None),
    ("", None),
])
def test_converter_data(texto, esperado):
    resultado = _converter_data(texto)
    assert (resultado.isoformat() if resultado else None) == esperado


# ---- estabelecimento e categoria ------------------------------------------

def test_estabelecimento_e_categoria():
    assert _estabelecimento("Compra no débito - IFD*IFOOD  ") == "iFood"
    assert _estabelecimento("Mercadolivre*Fone - Parcela 2/5") == "Mercadolivre*Fone"
    assert _categoria("Netflix.Com", "") == "Assinaturas"
    assert _categoria("Uber *Trip", "") == "Transporte"
    assert _categoria("Loja qualquer", "") == "Outros"
    assert _categoria("Loja qualquer", "saúde") == "Saúde"  # categoria válida do arquivo vence


# ---- arquivos completos -----------------------------------------------------

def test_fatura_nubank_exemplo():
    resultado = analisar_arquivo((EXEMPLOS / "fatura_nubank_exemplo.csv").read_bytes(), "fatura.csv")
    assert resultado["arquivo"]["formato"] == "fatura_nubank"
    assert resultado["qualidade"]["percentual"] == 100.0
    assert resultado["resumo"]["total_saidas"] == 1410.70
    assert resultado["resumo"]["total_entradas"] == 1200.00  # o pagamento da fatura não é gasto
    assert [m["total"] for m in resultado["por_mes"]] == [624.55, 786.15]
    assert [r["estabelecimento"] for r in resultado["recorrentes"]] == ["Netflix", "Spotify"]
    # a parcela se repete, mas não conta como recorrente
    assert all("Mercadolivre" not in r["estabelecimento"] for r in resultado["recorrentes"])
    # as categorias fecham com o total
    assert round(sum(c["total"] for c in resultado["por_categoria"]), 2) == resultado["resumo"]["total_saidas"]


def test_planilha_modelo_rejeita_com_motivo():
    resultado = analisar_arquivo((EXEMPLOS / "planilha_modelo_exemplo.csv").read_bytes(), "modelo.csv")
    assert resultado["qualidade"] == {
        "linhas_lidas": 7, "linhas_validas": 5, "linhas_rejeitadas": 2, "linhas_duplicadas": 0, "percentual": 71.4,
    }
    assert {r["codigo"] for r in resultado["rejeitadas"]} == {"invalid_date", "not_transaction"}
    assert resultado["rejeitadas"][0]["linha"] == 3  # linha do arquivo, contando o cabeçalho


def test_um_unico_mes_nao_confirma_recorrencia():
    resultado = analisar_arquivo(csv("date,title,amount\n2026-08-02,Netflix.Com,55.90\n2026-08-05,Padaria,12.00"), "f.csv")
    assert resultado["recorrentes"] == []
    assert [a["estabelecimento"] for a in resultado["assinaturas_pelo_nome"]] == ["Netflix"]
    assert any("único mês" in aviso for aviso in resultado["avisos"])


def test_csv_latin1_com_ponto_e_virgula_e_cabecalho_de_outro_banco():
    texto = "Data;Estabelecimento;Valor (R$)\n05/08/2026;PADARIA SÃO JOÃO;12,50\n06/08/2026;FARMÁCIA CENTRAL;30,00"
    resultado = analisar_arquivo(texto.encode("latin-1"), "banco.csv")
    assert resultado["resumo"]["total_saidas"] == 42.50
    assert {c["categoria"] for c in resultado["por_categoria"]} == {"Alimentação", "Saúde"}


def test_xlsx():
    quadro = pd.DataFrame({"Data": ["15/06/2026", "20/06/2026"], "Descrição": ["Netflix", "Uber"], "Valor": ["-55,90", "-20,00"]})
    memoria = io.BytesIO()
    quadro.to_excel(memoria, index=False)
    resultado = analisar_arquivo(memoria.getvalue(), "modelo.xlsx")
    assert resultado["resumo"]["total_saidas"] == 75.90


@pytest.mark.parametrize("conteudo, nome", [
    (b"", "vazio.csv"),
    (b"texto solto sem colunas", "sem_colunas.csv"),
    (b"a,b\n1,2", "colunas_desconhecidas.csv"),
    (b"data,descricao,valor\n01/01/2026,x,1,00", "arquivo.pdf"),
])
def test_arquivo_invalido(conteudo, nome):
    with pytest.raises(ArquivoInvalido):
        analisar_arquivo(conteudo, nome)


def test_acima_de_5_mb():
    with pytest.raises(ArquivoInvalido, match="5 MB"):
        analisar_arquivo(b"x" * (5 * 1024 * 1024 + 1), "grande.csv")


# ---- tipo, parcela, duplicidade e gravação ----------------------------------

@pytest.mark.parametrize("descricao, esperado", [
    ("Mercadolivre*Fone - Parcela 2/5", (2, 5)),
    ("Loja Central 03/12", (3, 12)),
    ("Posto 31/12", None),       # parcela atual maior que o total: é uma data
    ("Parcela 7/5", None),
    ("Netflix.Com", None),
])
def test_parcela_info(descricao, esperado):
    assert _parcela_info(descricao) == esperado


@pytest.mark.parametrize("descricao, saiu_dinheiro, modo, esperado", [
    ("Pagamento recebido", False, "fatura", "payment"),
    ("Pagamento da fatura", True, "extrato", "payment"),   # não é um gasto novo
    ("Pagamento de boleto - Condomínio", True, "extrato", "purchase"),
    ("Netflix.Com", True, "fatura", "purchase"),
    ("IOF compra internacional", True, "fatura", "fee"),
    ("Estorno Loja X", False, "fatura", "refund"),
    ("Salário", False, "extrato", "other"),
])
def test_tipo_transacao(descricao, saiu_dinheiro, modo, esperado):
    assert _tipo_transacao(descricao, saiu_dinheiro, modo) == esperado


def test_duplicadas_ficam_sinalizadas_e_nao_somem():
    texto = "date,title,amount\n2026-08-02,Uber *Trip,23.40\n2026-08-02,Uber *Trip,23.40\n2026-08-03,Padaria,10.00"
    processado = processar_arquivo(csv(texto), "f.csv")
    assert processado.qualidade["linhas_validas"] == 3
    assert processado.qualidade["linhas_duplicadas"] == 1
    assert list(processado.transacoes["duplicada"]) == [False, True, False]


def _exemplo():
    return processar_arquivo((EXEMPLOS / "fatura_nubank_exemplo.csv").read_bytes(), "fatura.csv")


def test_linhas_para_gravar_seguem_a_tabela_transactions():
    linhas = linhas_para_gravar(_exemplo().transacoes)
    assert len(linhas) == 16
    parcela = next(linha for linha in linhas if linha["installment_current"] == 2)
    assert parcela["installment_total"] == 5
    assert parcela["amount"] == Decimal("89.90")
    assert parcela["source_row"] == 7            # o cabeçalho é a linha 1
    assert parcela["category_name"] == "Compras"
    pagamento = next(linha for linha in linhas if linha["transaction_type"] == "payment")
    assert pagamento["amount"] == Decimal("1200.00")  # o banco guarda o valor absoluto
    assert {linha["transaction_type"] for linha in linhas} == {"purchase", "payment"}
    # as regras de integridade do banco: parcela completa ou ausente
    for linha in linhas:
        assert (linha["installment_current"] is None) == (linha["installment_total"] is None)


def test_analise_de_um_mes_compara_com_o_anterior():
    analise = calcular_analise(_exemplo().transacoes, mes="2026-08", incluir_lancamentos=True)
    assert analise["resumo"]["total_saidas"] == 786.15
    assert analise["resumo"]["dias"] == 31
    assert analise["variacao"] == {
        "mes_anterior": "2026-07", "rotulo_anterior": "jul/2026",
        "total_anterior": 624.55, "diferenca": 161.60, "percentual": 0.2587,
    }
    assert len(analise["lancamentos"]) == 8
    assert [m["rotulo"] for m in analise["por_mes"]] == ["jul/2026", "ago/2026"]  # o gráfico mensal mostra todos
    assert [r["estabelecimento"] for r in analise["recorrentes"]] == ["Netflix", "Spotify"]


def test_analise_do_banco_e_igual_a_analise_do_arquivo():
    """O painel analisa as transações gravadas; o resultado precisa ser o mesmo do arquivo."""
    processado = _exemplo()
    registros = [
        {
            "data": linha["transaction_date"], "descricao": linha["description_raw"],
            "estabelecimento": linha["merchant"], "categoria": linha["category_name"],
            "valor": linha["amount"], "tipo": linha["transaction_type"],
            "parcela_atual": linha["installment_current"], "parcela_total": linha["installment_total"],
        }
        for linha in linhas_para_gravar(processado.transacoes)
    ]
    do_banco = calcular_analise(quadro_de_transacoes(registros))
    do_arquivo = calcular_analise(processado.transacoes)
    assert do_banco == do_arquivo


def test_sem_transacoes_a_analise_vem_vazia():
    analise = calcular_analise(quadro_de_transacoes([]))
    assert analise["resumo"] is None
    assert analise["por_mes"] == [] and analise["recorrentes"] == []
