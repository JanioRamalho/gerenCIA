"""Testes unitários do modelo próprio de regressão linear e detecção de anomalias."""

from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from app.ai.perfil import (
    LIMIAR_DESVIOS,
    MINIMO_DE_MESES,
    analisar_perfil,
    totais_por_mes,
)
from app.ai.regressao import RegressaoLinear
from app.pipeline.analise import processar_arquivo

pytestmark = pytest.mark.unit

EXEMPLOS_IA = Path(__file__).resolve().parents[2] / "scripts" / "exemplos" / "ia"


# --- regressão linear (mínimos quadrados) ----------------------------------------

def test_regressao_ajusta_reta_exata_sem_erro():
    x = [0, 1, 2, 3, 4]
    y = [5000.0, 5200.0, 5400.0, 5600.0, 5800.0]

    modelo = RegressaoLinear.treinar(x, y)

    assert modelo.intercepto == pytest.approx(5000.0)
    assert modelo.inclinacao == pytest.approx(200.0)
    assert modelo.desvio_residual == pytest.approx(0.0)
    assert modelo.r2 == pytest.approx(1.0)
    assert modelo.prever(5) == pytest.approx(6000.0)


def test_regressao_bate_com_numpy_polyfit():
    x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    y = [6580.0, 5420.0, 5310.0, 6120.0, 5890.0, 6340.0, 5760.0, 6930.0, 6210.0, 5650.0, 6470.0]

    modelo = RegressaoLinear.treinar(x, y)
    inclinacao_np, intercepto_np = np.polyfit(x, y, 1)

    assert modelo.inclinacao == pytest.approx(inclinacao_np)
    assert modelo.intercepto == pytest.approx(intercepto_np)
    assert modelo.desvio_residual > 0
    assert 0.0 <= modelo.r2 <= 1.0


def test_erro_da_previsao_cresce_longe_do_centro():
    x = [0, 1, 2, 3, 4, 5]
    y = [5800.0, 6200.0, 5900.0, 6100.0, 6400.0, 6000.0]
    modelo = RegressaoLinear.treinar(x, y)

    no_centro = modelo.erro_da_previsao(modelo.media_x)
    na_borda = modelo.erro_da_previsao(5)
    extrapolado = modelo.erro_da_previsao(8)

    assert no_centro < na_borda < extrapolado


@pytest.mark.parametrize("x, y", [
    ([0, 1], [100.0, 200.0]),          # menos de 3 pontos
    ([0, 1, 2], [100.0, 200.0]),       # tamanhos diferentes
    ([2, 2, 2], [100.0, 200.0, 300.0]),  # x constante
])
def test_regressao_rejeita_entradas_invalidas(x, y):
    with pytest.raises(ValueError):
        RegressaoLinear.treinar(x, y)


# --- perfil de gastos e anomalias ------------------------------------------------

def test_historico_curto_nao_treina_o_modelo():
    por_mes = [
        {"mes": "2026-08", "total": 5500.0},
        {"mes": "2026-09", "total": 6100.0},
        {"mes": "2026-10", "total": 5900.0},
    ]

    resultado = analisar_perfil(por_mes, renda=5000.0)

    assert resultado["suficiente"] is False
    assert resultado["perfil"] is None
    assert resultado["anomalias"] == []
    assert resultado["meses_analisados"] == 3
    assert resultado["minimo_de_meses"] == MINIMO_DE_MESES
    assert any("pelo menos 4 meses" in aviso for aviso in resultado["avisos"])


def test_estudo_ficticio_de_12_meses_detecta_anomalia_em_novembro():
    historico = processar_arquivo(
        (EXEMPLOS_IA / "historico_11_meses.csv").read_bytes(), "historico_11_meses.csv",
    ).transacoes
    anomala = processar_arquivo(
        (EXEMPLOS_IA / "fatura_nov_2026_anomala.csv").read_bytes(), "fatura_nov_2026_anomala.csv",
    ).transacoes
    por_mes = totais_por_mes(pd.concat([historico, anomala], ignore_index=True))

    resultado = analisar_perfil(por_mes, renda=5000.0)

    assert resultado["suficiente"] is True
    assert resultado["meses_analisados"] == 12
    assert resultado["confiabilidade"] == "razoavel"
    assert [item["mes"] for item in resultado["anomalias"]] == ["2026-11"]

    alerta = resultado["anomalias"][0]
    assert alerta["total"] == pytest.approx(10880.0)
    assert alerta["desvios"] > LIMIAR_DESVIOS
    assert alerta["percentual_da_renda"] == pytest.approx(10880.0 / 5000.0, abs=1e-4)
    assert "nov/2026" in alerta["mensagem"]

    # O perfil final exclui o mês anômalo para não distorcer o gasto típico.
    perfil = resultado["perfil"]
    assert perfil["meses_no_treino"] == 11
    assert 5500.0 < perfil["gasto_tipico"] < 6500.0
    assert perfil["comprometimento_da_renda"] == pytest.approx(perfil["gasto_tipico"] / 5000.0, abs=1e-3)


def test_historico_normal_de_11_meses_nao_dispara_falso_alerta():
    historico = processar_arquivo(
        (EXEMPLOS_IA / "historico_11_meses.csv").read_bytes(), "historico_11_meses.csv",
    ).transacoes

    resultado = analisar_perfil(totais_por_mes(historico), renda=5000.0)

    assert resultado["suficiente"] is True
    assert resultado["confiabilidade"] == "moderada"
    assert resultado["anomalias"] == []
    assert any("11 meses" in aviso for aviso in resultado["avisos"])


def test_perfil_se_adapta_a_pessoas_com_padroes_de_gasto_diferentes():
    # Quem gasta entre 20 e 24 mil todo mês não tem anomalia ao gastar 22 mil,
    # mas dispara alerta quando passa para 38 mil.
    perfil_alto = [
        {"mes": f"2026-{m:02d}", "total": valor}
        for m, valor in enumerate([21000, 22500, 20400, 23100, 21800, 22200, 22900], start=1)
    ]
    assert analisar_perfil(perfil_alto, renda=30000.0)["anomalias"] == []

    com_extrapolacao = [*perfil_alto, {"mes": "2026-08", "total": 38000.0}]
    resultado = analisar_perfil(com_extrapolacao, renda=30000.0)
    assert [item["mes"] for item in resultado["anomalias"]] == ["2026-08"]


def test_mes_muito_abaixo_do_padrao_nao_gera_alerta_de_anomalia():
    por_mes = [
        {"mes": "2026-01", "total": 6000.0},
        {"mes": "2026-02", "total": 6100.0},
        {"mes": "2026-03", "total": 5900.0},
        {"mes": "2026-04", "total": 6050.0},
        {"mes": "2026-05", "total": 5950.0},
        {"mes": "2026-06", "total": 400.0},  # mês incompleto ou muito econômico
    ]

    resultado = analisar_perfil(por_mes)

    assert resultado["anomalias"] == []


def test_piso_de_variacao_evita_alerta_por_centavos_em_gasto_constante():
    por_mes = [
        {"mes": "2026-01", "total": 6000.0},
        {"mes": "2026-02", "total": 6000.0},
        {"mes": "2026-03", "total": 6000.0},
        {"mes": "2026-04", "total": 6000.0},
        {"mes": "2026-05", "total": 6015.0},  # só 0,25% acima
    ]

    resultado = analisar_perfil(por_mes)

    assert resultado["anomalias"] == []


def test_sem_renda_e_com_mes_vazio_no_meio_emite_avisos_claros():
    por_mes = [
        {"mes": "2026-01", "total": 5800.0},
        {"mes": "2026-02", "total": 6100.0},
        {"mes": "2026-04", "total": 5950.0},  # pula março
        {"mes": "2026-05", "total": 6050.0},
    ]

    resultado = analisar_perfil(por_mes, renda=None)

    assert resultado["perfil"]["comprometimento_da_renda"] is None
    assert any("renda mensal" in aviso for aviso in resultado["avisos"])
    assert any("meses sem gastos" in aviso for aviso in resultado["avisos"])
