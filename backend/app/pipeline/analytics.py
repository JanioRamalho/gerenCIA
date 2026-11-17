"""Cálculos financeiros comuns do Painel e dos limites.

Entradas em centavos inteiros; nenhuma soma financeira depende de HTTP, banco
ou arredondamento binário. A fachada antiga apenas adapta os tipos da saída.
"""

import calendar
import re
from datetime import date
from decimal import Decimal
from zoneinfo import ZoneInfo
from datetime import datetime

import pandas as pd

from app.pipeline.estatisticas import estatisticas, moeda
from app.pipeline.previa import MESES, _categoria_com_origem

TIPOS_DE_GASTO = ("purchase", "fee")


def mes_anterior(mes: str) -> str:
    ano, numero = map(int, mes.split("-"))
    return f"{ano if numero > 1 else ano - 1:04d}-{numero - 1 if numero > 1 else 12:02d}"


def meses_entre(inicio: str, fim: str) -> list[str]:
    return [str(p) for p in pd.period_range(inicio, fim, freq="M")]


def rotulo_mes(mes):
    return f"{MESES[int(mes[5:]) - 1]}/{mes[:4]}"


def _validar_mes(mes):
    if not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", mes):
        raise ValueError("Mês inválido; use AAAA-MM.")
    date(int(mes[:4]), int(mes[5:]), 1)


def base_elegivel(df):
    """Suspeitas permanecem; somente duplicatas confirmadas saem da análise."""
    df = df.copy()
    if "is_duplicate" in df:
        df = df[~df["is_duplicate"].fillna(False).astype(bool)].copy()
    df["contribuicao_centavos"] = [int(v) if t in TIPOS_DE_GASTO else -int(v) if t == "refund" else 0
                                    for v, t in zip(df["valor_abs"], df["tipo"])]
    return df


def _total(df):
    return sum(int(v) for v in df["contribuicao_centavos"])


def _id_categoria(grupo):
    if "category_id" not in grupo:
        return None
    valores = grupo["category_id"].dropna()
    return str(valores.iloc[0]) if len(valores) else None


def _identidade_categoria(categoria, category_id):
    # Categorias pessoais podem ter o mesmo nome de uma categoria global.
    # Linhas sem categoria não devem ser imputadas ao UUID global de Outros.
    return ("id", str(category_id)) if pd.notna(category_id) else ("sem_id", categoria)


def _grupos(df, coluna):
    saida = []
    financeiros = df[df["tipo"].isin((*TIPOS_DE_GASTO, "refund"))].copy()
    total = _total(financeiros)
    if coluna == "categoria":
        ids = financeiros["category_id"] if "category_id" in financeiros else [None] * len(financeiros)
        financeiros["_grupo_categoria"] = [_identidade_categoria(nome, identificador) for nome, identificador in zip(financeiros["categoria"], ids)]
        grupos = [(g["categoria"].iloc[0], g, _total(g)) for _, g in financeiros.groupby("_grupo_categoria", sort=False)]
    else:
        grupos = [(nome, g, _total(g)) for nome, g in financeiros.groupby(coluna)]
    composicao_valida = total > 0 and all(valor >= 0 for _, _, valor in grupos)
    for nome, grupo, valor in grupos:
        saida.append({coluna: nome, "total": moeda(valor), "quantidade": len(grupo),
                      "participacao": round(valor / total, 6) if composicao_valida else None,
                      **({"category_id": _id_categoria(grupo), "estatisticas": estatisticas(grupo[grupo["tipo"].isin(TIPOS_DE_GASTO)])} if coluna == "categoria" else {})})
    return sorted(saida, key=lambda r: (-Decimal(r["total"]), r[coluna], r.get("category_id") or ""))


def _cobertura(df, mes, hoje):
    return dict(inicio=df["data"].min().date().isoformat() if len(df) else None,
                fim=df["data"].max().date().isoformat() if len(df) else None,
                mes_em_andamento=mes == hoje.strftime("%Y-%m"),
                contexto="Intervalo observado nos dados importados; não comprova cobertura bancária integral.")


def _diferenca(total, referencia):
    diferenca = total - referencia
    return dict(total=moeda(total), total_referencia=moeda(referencia), diferenca=moeda(diferenca),
                percentual=round(diferenca / referencia, 6) if referencia > 0 else None,
                motivo=None if referencia > 0 else "base_nao_positiva")


def _comparar(df, periodo, mes, referencia, meses, hoje):
    base = dict(mes=mes, mes_referencia=referencia, total=moeda(_total(periodo)), total_referencia=None,
                diferenca=None, percentual=None, motivo="visao_historica" if mes is None else "referencia_ausente", por_categoria=[])
    if mes is None:
        if referencia is not None:
            raise ValueError("Escolha um mês específico para comparar.")
        return base
    if referencia is None:
        anterior = mes_anterior(mes)
        referencia = anterior if anterior in meses else None
        base["mes_referencia"] = referencia
    if referencia is None:
        return base
    _validar_mes(referencia)
    if referencia == mes:
        raise ValueError("Os meses comparados precisam ser distintos.")
    if referencia not in meses:
        raise ValueError("Mês de referência sem registros disponíveis.")
    outro = df[df["mes"] == referencia]
    atual = {_identidade_categoria(r["categoria"], r["category_id"]): r for r in _grupos(periodo, "categoria")}
    anterior = {_identidade_categoria(r["categoria"], r["category_id"]): r for r in _grupos(outro, "categoria")}
    categorias = []
    for chave in sorted(atual.keys() | anterior.keys()):
        a, b = atual.get(chave, {}), anterior.get(chave, {})
        categorias.append(dict(categoria=a.get("categoria") or b["categoria"], category_id=a.get("category_id") or b.get("category_id"),
                               **_diferenca(int(Decimal(a.get("total", "0")) * 100), int(Decimal(b.get("total", "0")) * 100))))
    categorias.sort(key=lambda r: (r["categoria"], r["category_id"] or ""))
    return {**base, **_diferenca(_total(periodo), _total(outro)), "por_categoria": categorias,
            "cobertura": _cobertura(periodo, mes, hoje), "cobertura_referencia": _cobertura(outro, referencia, hoje)}


def _item(linha):
    parcela = f"{int(linha['parcela_atual'])}/{int(linha['parcela_total'])}" if linha.get("parcela") and pd.notna(linha.get("parcela_total")) else None
    origem = _opcional(linha.get("source_row"), int)
    return dict(id=_opcional(linha.get("id"), str),
                upload_id=_opcional(linha.get("upload_id"), str),
                category_id=_opcional(linha.get("category_id"), str),
                data=linha["data"].date().isoformat(), descricao=linha.get("descricao", ""), estabelecimento=linha["estabelecimento"],
                categoria=linha["categoria"], valor=moeda(int(linha["valor_abs"])), tipo=linha["tipo"],
                contribuicao=moeda(int(linha["contribuicao_centavos"])), parcela=parcela,
                source_row=origem if origem is not None else _opcional(linha.get("linha"), int),
                source_sheet=_opcional(linha.get("source_sheet"), str))


def _opcional(valor, converter=None):
    """Ausências escalares do pandas viram JSON null, sem apagar textos válidos."""
    if valor is None or pd.isna(valor):
        return None
    return converter(valor) if converter else valor


def _ordenar(df):
    df = df.copy()
    df["_ordem_id"] = df["id"].astype(str) if "id" in df else [f"{i:012d}" for i in range(len(df))]
    return df.sort_values(["data", "_ordem_id"], ascending=[False, True], kind="stable")


def _servicos(df, mes, meses):
    cobrancas = df[df["tipo"].isin(TIPOS_DE_GASTO) & ~df["parcela"].astype(bool)]
    saida = []
    for nome, grupo in cobrancas.groupby("estabelecimento"):
        identificada = any(_categoria_com_origem(d, "")[0] == "Assinaturas" for d in grupo["descricao"])
        recorrente = len(meses) >= 2 and any(sorted(g["mes"].unique()) == meses for _, g in grupo.groupby("valor_abs"))
        if not identificada and not recorrente:
            continue
        # Só um vínculo explícito a uma cobrança permite atribuir o estorno ao serviço.
        vinculos = set(grupo["id"].dropna().astype(str)) if "id" in grupo else set()
        estornos = df[(df["tipo"] == "refund") & df["refund_of_id"].astype(str).isin(vinculos)] if "refund_of_id" in df else df.iloc[:0]
        movimentos = pd.concat([grupo, estornos])
        mes_base = max(movimentos["mes"])
        base = _total(movimentos[movimentos["mes"] == mes_base])
        observado = movimentos[movimentos["mes"] == mes] if mes else movimentos
        evidencia = sorted(grupo["mes"].unique())
        classificacoes = (["assinatura_identificada"] if identificada else []) + (["recorrencia_confirmada"] if recorrente else [])
        saida.append(dict(estabelecimento=nome, classificacoes=classificacoes, total_periodo=moeda(_total(observado)),
                          base_mensal=moeda(base), mes_base=mes_base, anualizado=moeda(base * 12),
                          ultima_cobranca=grupo["data"].max().date().isoformat(), meses_evidencia=evidencia,
                          lacunas=[m for m in meses_entre(evidencia[0], evidencia[-1]) if m not in evidencia]))
    return sorted(saida, key=lambda r: (-Decimal(r["total_periodo"]), r["estabelecimento"]))


def calcular_analytics(df, mes="latest", reference_month=None, *, hoje=None):
    """Analisa todo o histórico; ``mes`` só recorta a apresentação.

    Comparação livre usa dois meses explícitos. Sem referência explícita, somente
    o anterior do calendário pode ser selecionado automaticamente.
    """
    hoje = hoje or datetime.now(ZoneInfo("America/Sao_Paulo")).date()
    df = base_elegivel(df)
    meses = sorted(df["mes"].unique())
    mes = meses[-1] if mes == "latest" and meses else None if mes in (None, "all", "latest") else mes
    if mes is not None:
        _validar_mes(mes)
        if mes not in meses:
            raise ValueError("Mês analisado sem registros disponíveis.")
    periodo = df[df["mes"] == mes] if mes else df
    gastos = periodo[periodo["tipo"].isin(TIPOS_DE_GASTO)]
    categorias = _grupos(periodo, "categoria")
    total = _total(periodo)
    if mes:
        ano, numero = map(int, mes.split("-"))
        if mes == hoje.strftime("%Y-%m"):
            # Uma data futura válida já presente no arquivo não pode desaparecer
            # da evolução enquanto continua compondo resumo e média.
            dias = max(hoje.day, int(periodo["data"].dt.day.max()))
        else:
            dias = calendar.monthrange(ano, numero)[1]
    else:
        dias = (periodo["data"].max() - periodo["data"].min()).days + 1 if len(periodo) else 0
    por_mes = []
    if meses:
        for m in meses_entre(meses[0], meses[-1]):
            grupo = df[df["mes"] == m]
            por_mes.append(dict(mes=m, rotulo=rotulo_mes(m), total=moeda(_total(grupo)) if len(grupo) else None))
    por_dia = []
    if mes:
        for dia in pd.date_range(f"{mes}-01", periods=dias):
            grupo = periodo[periodo["data"].dt.normalize() == dia]
            por_dia.append(dict(data=dia.date().isoformat(), total=moeda(_total(grupo))))
    def soma_tipo(tipo):
        return moeda(sum(int(v) for v in periodo.loc[periodo["tipo"] == tipo, "valor_abs"]))
    resumo = dict(total_saidas=moeda(total), total_entradas=soma_tipo("income"), total_pagamentos=soma_tipo("payment"),
                  total_compras=soma_tipo("purchase"), total_tarifas=soma_tipo("fee"), total_estornos=soma_tipo("refund"),
                  quantidade_saidas=len(gastos), quantidade_transacoes=len(periodo), media_por_dia=moeda(Decimal(total) / dias) if dias else None,
                  dias=dias, maior_categoria=next((r["categoria"] for r in categorias if Decimal(r["total"]) > 0), None))
    maiores = gastos.sort_values("valor_abs", ascending=False, kind="stable").head(10)
    return dict(mes=mes, meses_disponiveis=meses, cobertura=_cobertura(periodo, mes, hoje), resumo=resumo,
                por_categoria=categorias, por_estabelecimento=_grupos(periodo, "estabelecimento"), por_mes=por_mes, por_dia=por_dia,
                estatisticas=estatisticas(gastos), comparacao=_comparar(df, periodo, mes, reference_month, meses, hoje),
                servicos=_servicos(df, mes, meses), recentes=[_item(r) for r in _ordenar(periodo).head(5).to_dict("records")],
                maiores_lancamentos=[_item(r) for r in maiores.to_dict("records")])
