"""Do arquivo limpo às medidas do dashboard: tipos, categorias e estatística.

Segunda metade do caminho (a primeira está em previa.py). Tudo aqui trabalha
com DataFrames do pandas e não depende do FastAPI nem do banco. O mesmo cálculo
(`calcular_analise`) serve a dois usos:

- a prévia de um arquivo recém-enviado (`analisar_arquivo`);
- o painel, com as transações já gravadas (`quadro_de_transacoes`).

Os valores circulam em centavos inteiros e só viram reais na saída.
"""

from __future__ import annotations

import calendar
from dataclasses import dataclass
from decimal import Decimal

import pandas as pd

from app.pipeline.previa import (
    MESES,
    _categoria_com_origem,
    _estabelecimento,
    _parcela_info,
    _texto_busca,
    _tipo_transacao,
    adaptar,
    ler_arquivo,
    limpar,
)

TIPOS_DE_GASTO = ("purchase", "fee")  # os únicos tipos que aumentam o gasto


# --------------------------------------------------------------------------- #
# 1. Preparar: dar tipo, categoria, parcela e duplicidade a cada linha válida
# --------------------------------------------------------------------------- #

def _definir_saidas(df: pd.DataFrame, formato: str) -> tuple[pd.Series, str, str]:
    """Descobre quais linhas são saída de dinheiro, pela convenção de sinais do arquivo.

    Devolve a máscara, a regra aplicada (em texto) e o modo, 'fatura' ou
    'extrato'. Fatura Nubank: compra positiva; pagamento e estorno negativos.
    Extrato e planilha-modelo: saída negativa. Em arquivos de outros bancos o
    sinal pode vir invertido, então vale o sinal da maioria.
    """
    negativas = int((df["centavos"] < 0).sum())
    positivas = int((df["centavos"] > 0).sum())

    if formato == "fatura_nubank":
        return df["centavos"] > 0, "Fatura Nubank: valores positivos são compras; negativos são pagamentos e estornos.", "fatura"
    if formato == "extrato_nubank":
        return df["centavos"] < 0, "Extrato Nubank: valores negativos são saídas.", "extrato"
    if negativas == 0:
        return df["centavos"] > 0, "Todos os valores são positivos; tratei como compras de uma fatura.", "fatura"
    if negativas >= positivas:
        return df["centavos"] < 0, "Planilha-modelo: valores negativos são saídas e positivos são entradas.", "extrato"
    return (
        df["centavos"] > 0,
        "A maioria dos valores é positiva; tratei como fatura (positivo = compra, negativo = pagamento ou estorno).",
        "fatura",
    )


def preparar_transacoes(formato: str, validas: pd.DataFrame) -> tuple[pd.DataFrame, str]:
    """Acrescenta às linhas válidas tudo o que a análise e o banco precisam."""
    df = validas.copy()
    df["data"] = pd.to_datetime(df["data"])
    saiu, regra, modo = _definir_saidas(df, formato)

    df["valor_abs"] = df["centavos"].abs()
    df["mes"] = df["data"].dt.strftime("%Y-%m")
    df["estabelecimento"] = df["descricao"].apply(_estabelecimento)

    parcelas = [_parcela_info(texto) for texto in df["descricao"]]
    df["parcela"] = [info is not None for info in parcelas]
    df["parcela_atual"] = pd.Series([info[0] if info else None for info in parcelas], index=df.index, dtype="object")
    df["parcela_total"] = pd.Series([info[1] if info else None for info in parcelas], index=df.index, dtype="object")

    categorias = [_categoria_com_origem(d, c) for d, c in zip(df["descricao"], df["categoria_banco"])]
    df["categoria"] = [item[0] for item in categorias]
    df["origem_categoria"] = [item[1] for item in categorias]

    df["tipo"] = [_tipo_transacao(d, bool(s), modo) for d, s in zip(df["descricao"], saiu)]
    df["eh_gasto"] = df["tipo"].isin(TIPOS_DE_GASTO)
    # Repetições exatas ficam sinalizadas, mas não são removidas: podem ser compras reais.
    df["duplicada"] = df.duplicated(subset=["data", "descricao", "centavos"], keep="first")
    return df, regra


def linhas_para_gravar(df: pd.DataFrame) -> list[dict]:
    """Converte as transações preparadas nos campos da tabela transactions."""
    linhas = []
    for item in df.itertuples():
        linhas.append({
            "transaction_date": item.data.date(),
            "description_raw": item.descricao,
            "description_normalized": _texto_busca(item.descricao).strip() or None,
            "merchant": item.estabelecimento or None,
            "amount": (Decimal(int(item.valor_abs)) / 100).quantize(Decimal("0.01")),
            "transaction_type": item.tipo,
            "category_name": item.categoria,
            "category_source": item.origem_categoria,
            "installment_current": None if pd.isna(item.parcela_atual) else int(item.parcela_atual),
            "installment_total": None if pd.isna(item.parcela_total) else int(item.parcela_total),
            "source_row": int(item.linha),
            "is_duplicate": bool(item.duplicada),
        })
    return linhas


def quadro_de_transacoes(registros: list[dict]) -> pd.DataFrame:
    """Monta o DataFrame da análise a partir de transações já gravadas no banco.

    Cada registro traz: data, descricao, estabelecimento, categoria, valor
    (Decimal), tipo, parcela_atual e parcela_total.
    """
    colunas = [
        "data", "mes", "descricao", "estabelecimento", "categoria", "valor_abs",
        "tipo", "eh_gasto", "parcela", "parcela_atual", "parcela_total",
    ]
    if not registros:
        return pd.DataFrame(columns=colunas)

    df = pd.DataFrame(registros)
    df["data"] = pd.to_datetime(df["data"])
    df["mes"] = df["data"].dt.strftime("%Y-%m")
    df["valor_abs"] = [int((Decimal(str(valor)) * 100).to_integral_value()) for valor in df["valor"]]
    df["eh_gasto"] = df["tipo"].isin(TIPOS_DE_GASTO)
    df["parcela"] = df["parcela_atual"].notna()
    return df[colunas]


# --------------------------------------------------------------------------- #
# 2. Calcular: totais, categorias, estatística descritiva e recorrência
# --------------------------------------------------------------------------- #

def _reais(centavos: int | float) -> float:
    return round(float(centavos) / 100, 2)


def _rotulo_mes(mes: str) -> str:
    ano, numero = mes.split("-")
    return f"{MESES[int(numero) - 1]}/{ano}"


def _recorrentes(gastos: pd.DataFrame, meses_do_arquivo: list[str]) -> list[dict]:
    """Mesmo estabelecimento e mesmo valor em todos os meses enviados; parcelas ficam de fora."""
    if len(meses_do_arquivo) < 2:
        return []
    base = gastos[~gastos["parcela"]]
    resultado = []
    for (estabelecimento, centavos), grupo in base.groupby(["estabelecimento", "valor_abs"]):
        meses = sorted(grupo["mes"].unique())
        if meses != meses_do_arquivo:
            continue
        ultimo = grupo.loc[grupo["data"].idxmax()]
        no_ultimo_mes = int(grupo.loc[grupo["mes"] == meses[-1], "valor_abs"].sum())
        resultado.append({
            "estabelecimento": estabelecimento,
            "valor": _reais(centavos),
            "dia_mais_recente": int(ultimo["data"].day),
            "total_por_mes": _reais(no_ultimo_mes),
            "custo_no_ano": _reais(no_ultimo_mes * 12),
            "meses": len(meses),
        })
    return sorted(resultado, key=lambda item: item["custo_no_ano"], reverse=True)


def _assinaturas_pelo_nome(gastos: pd.DataFrame) -> list[dict]:
    """Serviços de assinatura conhecidos (Netflix, Spotify...), úteis mesmo com um único mês."""
    base = gastos[(gastos["categoria"] == "Assinaturas") & (~gastos["parcela"])]
    resultado = []
    for estabelecimento, grupo in base.groupby("estabelecimento"):
        ultimo = grupo.loc[grupo["data"].idxmax()]
        resultado.append({
            "estabelecimento": estabelecimento,
            "valor": _reais(ultimo["valor_abs"]),
            "ultima_cobranca": ultimo["data"].strftime("%d/%m/%Y"),
            "custo_no_ano": _reais(ultimo["valor_abs"] * 12),
        })
    return sorted(resultado, key=lambda item: item["custo_no_ano"], reverse=True)


def _lancamento(linha) -> dict:
    parcela = None
    if linha.parcela and not pd.isna(linha.parcela_atual):
        parcela = f"{int(linha.parcela_atual)}/{int(linha.parcela_total)}"
    return {
        "data": linha.data.strftime("%d/%m/%Y"),
        "estabelecimento": linha.estabelecimento,
        "descricao": linha.descricao,
        "categoria": linha.categoria,
        "valor": _reais(linha.valor_abs),
        "parcela": parcela,
    }


def _analise_vazia() -> dict:
    return {
        "resumo": None, "variacao": None, "por_mes": [], "meses_com_gastos": 0, "por_categoria": [],
        "maiores_lancamentos": [], "lancamentos": [], "recorrentes": [], "assinaturas_pelo_nome": [],
    }


def calcular_analise(df: pd.DataFrame, mes: str | None = None, incluir_lancamentos: bool = False) -> dict:
    """Calcula as medidas do dashboard.

    `df` precisa ter as colunas de preparar_transacoes ou de quadro_de_transacoes.
    Com `mes` (por exemplo '2026-08'), o resumo, as categorias e os lançamentos
    valem só para o mês; o gráfico mensal e a recorrência sempre olham todos os
    meses, porque só assim dá para comparar e confirmar repetição.
    """
    if df.empty:
        return _analise_vazia()
    gastos = df[df["eh_gasto"]]
    outros = df[~df["eh_gasto"]]
    meses_do_arquivo = sorted(gastos["mes"].unique())

    totais_por_mes = gastos.groupby("mes")["valor_abs"].sum()
    por_mes = [{"mes": m, "rotulo": _rotulo_mes(m), "total": _reais(total)} for m, total in totais_por_mes.items()]

    periodo = gastos[gastos["mes"] == mes] if mes else gastos
    periodo_outros = outros[outros["mes"] == mes] if mes else outros

    resumo = None
    variacao = None
    por_categoria: list[dict] = []
    maiores: list[dict] = []
    lancamentos: list[dict] = []

    if not periodo.empty:
        if mes:
            ano, numero = (int(parte) for parte in mes.split("-"))
            dias = calendar.monthrange(ano, numero)[1]
        else:
            dias = (periodo["data"].max() - periodo["data"].min()).days + 1
        total = int(periodo["valor_abs"].sum())
        resumo = {
            "total_saidas": _reais(total),
            "total_entradas": _reais(periodo_outros["valor_abs"].sum()),
            "quantidade_saidas": int(len(periodo)),
            "media": _reais(periodo["valor_abs"].mean()),
            "mediana": _reais(periodo["valor_abs"].median()),
            "maior": _reais(periodo["valor_abs"].max()),
            "media_por_dia": _reais(total / dias),
            "dias": int(dias),
            "periodo_inicio": periodo["data"].min().strftime("%d/%m/%Y"),
            "periodo_fim": periodo["data"].max().strftime("%d/%m/%Y"),
        }

        if mes and mes in meses_do_arquivo and meses_do_arquivo.index(mes) > 0:
            anterior = meses_do_arquivo[meses_do_arquivo.index(mes) - 1]
            total_anterior = int(totais_por_mes[anterior])
            variacao = {
                "mes_anterior": anterior,
                "rotulo_anterior": _rotulo_mes(anterior),
                "total_anterior": _reais(total_anterior),
                "diferenca": _reais(total - total_anterior),
                "percentual": round(total / total_anterior - 1, 4),
            }

        for categoria, grupo in periodo.groupby("categoria"):
            soma = int(grupo["valor_abs"].sum())
            por_categoria.append({
                "categoria": categoria,
                "total": _reais(soma),
                "quantidade": int(len(grupo)),
                "participacao": round(soma / total, 4),
            })
        por_categoria.sort(key=lambda item: item["total"], reverse=True)

        maiores = [_lancamento(linha) for linha in periodo.sort_values("valor_abs", ascending=False).head(10).itertuples()]
        if incluir_lancamentos:
            ordenados = periodo.sort_values(["data", "valor_abs"], ascending=False).head(300)
            lancamentos = [_lancamento(linha) for linha in ordenados.itertuples()]

    return {
        "resumo": resumo,
        "variacao": variacao,
        "por_mes": por_mes,
        "meses_com_gastos": len(meses_do_arquivo),
        "por_categoria": por_categoria,
        "maiores_lancamentos": maiores,
        "lancamentos": lancamentos,
        "recorrentes": _recorrentes(gastos, meses_do_arquivo),
        "assinaturas_pelo_nome": _assinaturas_pelo_nome(gastos),
    }


# --------------------------------------------------------------------------- #
# 3. Arquivo completo: bytes -> transações preparadas -> resultado
# --------------------------------------------------------------------------- #

@dataclass
class ArquivoProcessado:
    """O que sai da leitura e da limpeza de um arquivo."""

    nome: str
    formato: str
    linhas_lidas: int
    transacoes: pd.DataFrame  # vazio quando nenhuma linha é válida
    rejeitadas: list[dict]
    regra: str | None

    @property
    def qualidade(self) -> dict:
        validas = int(len(self.transacoes))
        duplicadas = int(self.transacoes["duplicada"].sum()) if validas else 0
        return {
            "linhas_lidas": self.linhas_lidas,
            "linhas_validas": validas,
            "linhas_rejeitadas": len(self.rejeitadas),
            "linhas_duplicadas": duplicadas,
            "percentual": round(validas / self.linhas_lidas * 100, 1) if self.linhas_lidas else 0.0,
        }


def processar_arquivo(conteudo: bytes, nome: str) -> ArquivoProcessado:
    """Lê, reconhece, limpa e prepara um arquivo. Levanta ArquivoInvalido se não der."""
    bruto = ler_arquivo(conteudo, nome)
    formato, adaptado = adaptar(bruto)
    validas, rejeitadas = limpar(adaptado)
    if validas.empty:
        return ArquivoProcessado(nome, formato, len(adaptado), validas, rejeitadas, None)
    preparadas, regra = preparar_transacoes(formato, validas)
    return ArquivoProcessado(nome, formato, len(adaptado), preparadas, rejeitadas, regra)


def resultado_da_previa(processado: ArquivoProcessado) -> dict:
    """Resultado da prévia: qualidade, avisos e as medidas do arquivo."""
    avisos: list[str] = []
    resultado = {
        "arquivo": {"nome": processado.nome, "formato": processado.formato},
        "qualidade": processado.qualidade,
        "avisos": avisos,
        "rejeitadas": processado.rejeitadas[:50],
    }

    if processado.transacoes.empty:
        avisos.append("Nenhuma linha válida: confira as colunas e os formatos de data e valor.")
        return {**resultado, **_analise_vazia()}

    avisos.append(processado.regra)
    analise = calcular_analise(processado.transacoes)
    if analise["resumo"] is None:
        avisos.append("Nenhuma saída encontrada no arquivo.")
    if analise["meses_com_gastos"] == 1:
        avisos.append("O arquivo tem um único mês. Pagamentos recorrentes só podem ser confirmados com dois meses ou mais.")
    return {**resultado, **analise}


def analisar_arquivo(conteudo: bytes, nome: str) -> dict:
    """Caminho completo da prévia: bytes do arquivo -> dicionário pronto para virar JSON."""
    return resultado_da_previa(processar_arquivo(conteudo, nome))
