"""Perfil de gastos e detecção de meses fora do padrão.

A partir do total gasto em cada mês, o modelo aprende o perfil da pessoa
(nível de gasto, tendência e variação normal) e aponta os meses em que ela
gastou muito acima do que o próprio histórico previa.

Como cada mês é avaliado (validação "deixa um de fora", leave-one-out):

1. tira o mês do conjunto;
2. treina a regressão linear com os outros meses;
3. prevê quanto a pessoa deveria ter gastado naquele mês;
4. mede a distância entre o real e o previsto em "desvios" (z), dividindo a
   diferença pela incerteza da previsão;
5. se o gasto real passa de LIMIAR_DESVIOS desvios acima do previsto, o mês é
   uma anomalia.

Tirar o mês do treino é essencial: se o mês de R$ 10 mil entrasse no treino,
ele mesmo puxaria a reta para cima e aumentaria a variação "normal",
escondendo a própria anomalia.

Só gastos acima do esperado geram alerta. Um mês barato não é um problema
financeiro, e o mês corrente, ainda incompleto, sempre parece barato.
"""

from __future__ import annotations

import pandas as pd

from app.ai.regressao import RegressaoLinear
from app.pipeline.previa import MESES

LIMIAR_DESVIOS = 2.0     # ~95% dos meses normais ficam abaixo desse limite, se os erros forem normais
PISO_DE_VARIACAO = 0.05  # a incerteza nunca é menor que 5% do gasto médio
MINIMO_DE_MESES = 4      # cada treino deixa um mês de fora e a reta precisa de 3 pontos
MESES_RECOMENDADOS = 12  # um ano completo, para o perfil cobrir todas as épocas


# --------------------------------------------------------------------------- #
# Preparação: do DataFrame de transações aos totais por mês
# --------------------------------------------------------------------------- #

def totais_por_mes(df: pd.DataFrame) -> list[dict]:
    """Soma as saídas (compras e tarifas) de cada mês, em reais.

    `df` tem as colunas de pipeline.analise.quadro_de_transacoes. É o mesmo
    total mostrado no gráfico mensal do painel.
    """
    if df.empty:
        return []
    gastos = df[df["eh_gasto"]]
    somas = gastos.groupby("mes")["valor_abs"].sum()
    return [{"mes": mes, "total": round(int(centavos) / 100, 2)} for mes, centavos in somas.sort_index().items()]


def _posicao(mes: str) -> int:
    """Número do mês contado desde o ano zero; meses vizinhos diferem em 1."""
    ano, numero = mes.split("-")
    return int(ano) * 12 + int(numero) - 1


def _mes_da_posicao(posicao: int) -> str:
    return f"{posicao // 12:04d}-{posicao % 12 + 1:02d}"


def _rotulo(mes: str) -> str:
    ano, numero = mes.split("-")
    return f"{MESES[int(numero) - 1]}/{ano}"


def _brl(valor: float) -> str:
    """1234.5 -> 'R$ 1.234,50'."""
    texto = f"{abs(valor):,.2f}".replace(",", "_").replace(".", ",").replace("_", ".")
    return f"{'-' if valor < 0 else ''}R$ {texto}"


def _confiabilidade(meses: int) -> str:
    if meses < 6:
        return "baixa"
    if meses < MESES_RECOMENDADOS:
        return "moderada"
    return "razoavel"


# --------------------------------------------------------------------------- #
# Avaliação de cada mês e montagem do perfil
# --------------------------------------------------------------------------- #

def _incerteza(modelo: RegressaoLinear, x: float, totais_do_treino: list[float]) -> float:
    """Erro da previsão com um piso, para não acusar centavos num histórico quase constante."""
    piso = PISO_DE_VARIACAO * (sum(totais_do_treino) / len(totais_do_treino))
    return max(modelo.erro_da_previsao(x), piso, 0.01)


def _avaliar_deixando_um_de_fora(x: list[int], y: list[float]) -> list[dict]:
    avaliacoes = []
    for i in range(len(x)):
        x_treino = x[:i] + x[i + 1:]
        y_treino = y[:i] + y[i + 1:]
        modelo = RegressaoLinear.treinar(x_treino, y_treino)
        esperado = modelo.prever(x[i])
        incerteza = _incerteza(modelo, x[i], y_treino)
        desvios = (y[i] - esperado) / incerteza
        avaliacoes.append({
            "esperado": esperado,
            "limite": esperado + LIMIAR_DESVIOS * incerteza,
            "desvios": desvios,
            "anomalia": desvios > LIMIAR_DESVIOS,
        })
    return avaliacoes


def _mensagem(rotulo: str, total: float, esperado: float, desvios: float) -> str:
    """Frase do alerta, por exemplo: 'Em nov/2026 você gastou R$ 10.900,00, 74% acima...'."""
    proporcao = f", {round((total / esperado - 1) * 100)}% acima" if esperado > 0 else ""
    desvios_texto = f"{desvios:.1f}".replace(".", ",")
    return (
        f"Em {rotulo} você gastou {_brl(total)}{proporcao} dos {_brl(esperado)} esperados "
        f"para o seu perfil ({desvios_texto} desvios acima do normal)."
    )


def analisar_perfil(por_mes: list[dict], renda: float | None = None) -> dict:
    """Aprende o perfil de gastos e aponta os meses anômalos.

    `por_mes` é uma lista de {"mes": "AAAA-MM", "total": reais}; `renda` é a
    renda mensal informada pela pessoa, ou None.
    """
    meses = sorted(por_mes, key=lambda item: item["mes"])
    n = len(meses)
    avisos: list[str] = []
    if renda is None:
        avisos.append("Informe sua renda mensal na página Conta para ver quanto dela os gastos comprometem.")

    base = {
        "meses_analisados": n,
        "minimo_de_meses": MINIMO_DE_MESES,
        "meses_recomendados": MESES_RECOMENDADOS,
        "limiar_desvios": LIMIAR_DESVIOS,
        "renda_mensal": renda,
        "confiabilidade": _confiabilidade(n),
    }

    if n < MINIMO_DE_MESES:
        avisos.insert(0, f"O modelo precisa de pelo menos {MINIMO_DE_MESES} meses com gastos; há {n}.")
        return {
            **base,
            "suficiente": False,
            "perfil": None,
            "meses": [{"mes": m["mes"], "rotulo": _rotulo(m["mes"]), "total": m["total"]} for m in meses],
            "anomalias": [],
            "avisos": avisos,
        }

    inicio = _posicao(meses[0]["mes"])
    x = [_posicao(m["mes"]) - inicio for m in meses]
    y = [float(m["total"]) for m in meses]
    avaliacoes = _avaliar_deixando_um_de_fora(x, y)

    # O perfil final é aprendido só com os meses normais, para que a anomalia
    # não distorça o retrato da pessoa. Se sobrarem poucos, usa todos.
    normais = [i for i, item in enumerate(avaliacoes) if not item["anomalia"]]
    usados = normais if len(normais) >= MINIMO_DE_MESES - 1 else list(range(n))
    x_perfil = [x[i] for i in usados]
    y_perfil = [y[i] for i in usados]
    modelo = RegressaoLinear.treinar(x_perfil, y_perfil)
    gasto_tipico = sum(y_perfil) / len(y_perfil)

    proximo_x = x[-1] + 1
    proximo_esperado = modelo.prever(proximo_x)
    proxima_incerteza = _incerteza(modelo, proximo_x, y_perfil)

    perfil = {
        "gasto_tipico": round(gasto_tipico, 2),
        "intercepto": round(modelo.intercepto, 2),
        "tendencia_mensal": round(modelo.inclinacao, 2),
        "variacao_normal": round(modelo.desvio_residual, 2),
        "r2": round(modelo.r2, 4),
        "meses_no_treino": len(usados),
        "proximo_mes": {
            "mes": _mes_da_posicao(inicio + proximo_x),
            "rotulo": _rotulo(_mes_da_posicao(inicio + proximo_x)),
            "esperado": round(proximo_esperado, 2),
            "limite_alerta": round(proximo_esperado + LIMIAR_DESVIOS * proxima_incerteza, 2),
        },
        "comprometimento_da_renda": round(gasto_tipico / renda, 4) if renda else None,
    }

    resultado_meses = []
    anomalias = []
    for mes, total, avaliacao in zip(meses, y, avaliacoes):
        rotulo = _rotulo(mes["mes"])
        item = {
            "mes": mes["mes"],
            "rotulo": rotulo,
            "total": round(total, 2),
            "esperado": round(avaliacao["esperado"], 2),
            "limite_alerta": round(avaliacao["limite"], 2),
            "desvios": round(avaliacao["desvios"], 2),
            "anomalia": avaliacao["anomalia"],
            "percentual_da_renda": round(total / renda, 4) if renda else None,
        }
        resultado_meses.append(item)
        if avaliacao["anomalia"]:
            anomalias.append({
                "mes": item["mes"],
                "rotulo": rotulo,
                "total": item["total"],
                "esperado": item["esperado"],
                "excesso": round(total - avaliacao["esperado"], 2),
                "desvios": item["desvios"],
                "percentual_da_renda": item["percentual_da_renda"],
                "mensagem": _mensagem(rotulo, total, avaliacao["esperado"], avaliacao["desvios"]),
            })

    if n < MESES_RECOMENDADOS:
        avisos.insert(0, f"Com {n} meses o perfil ainda é instável; o ideal é ter pelo menos {MESES_RECOMENDADOS}.")
    if x[-1] + 1 != n:
        avisos.append("Há meses sem gastos entre o primeiro e o último; eles ficam fora do cálculo.")
    if len(anomalias) > 1:
        avisos.append("Há mais de um mês fora do padrão. Um pode mascarar o outro, porque cada avaliação ainda treina com os demais.")

    return {
        **base,
        "suficiente": True,
        "perfil": perfil,
        "meses": resultado_meses,
        "anomalias": anomalias,
        "avisos": avisos,
    }
