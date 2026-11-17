"""Normalização das transações e fachada compatível da análise financeira."""
from dataclasses import dataclass
from decimal import Decimal
import pandas as pd
from app.pipeline.analytics import TIPOS_DE_GASTO, calcular_analytics, base_elegivel, _ordenar, _item, _opcional, rotulo_mes
from app.pipeline.previa import (
    ArquivoInvalido, _categoria_com_origem, _estabelecimento, _parcela_info,
    _texto_busca, _tipo_transacao, adaptar, ler_arquivo, limpar,
)


def _tipo_documento(formato, document_type):
    if formato != "planilha_modelo":
        return "fatura" if formato == "fatura_nubank" else "extrato"
    normalizado = {"statement": "extrato", "invoice": "fatura"}.get(document_type, document_type)
    if normalizado not in ("fatura", "extrato"):
        raise ArquivoInvalido("Escolha o tipo do documento da planilha-modelo: extrato ou fatura.")
    return normalizado


def preparar_transacoes(formato, validas, document_type=None):
    """Sinais vêm do formato, nunca da maioria de valores da planilha."""
    modo = _tipo_documento(formato, document_type)
    df = validas.copy()
    df["data"] = pd.to_datetime(df["data"])
    saida = df["centavos"] > 0 if formato == "fatura_nubank" else df["centavos"] < 0
    regra = ("Fatura Nubank: positivo é compra, negativo é pagamento ou estorno." if formato == "fatura_nubank"
             else "Valores negativos são saídas e positivos são entradas; o tipo do documento não inverte o sinal.")
    df["valor_abs"] = df["centavos"].abs()
    df["mes"] = df["data"].dt.strftime("%Y-%m")
    df["estabelecimento"] = df["descricao"].apply(_estabelecimento)
    parcelas = [_parcela_info(texto) for texto in df["descricao"]]
    df["parcela"] = [p is not None for p in parcelas]
    df["parcela_atual"] = pd.Series([p[0] if p else None for p in parcelas], index=df.index, dtype="object")
    df["parcela_total"] = pd.Series([p[1] if p else None for p in parcelas], index=df.index, dtype="object")
    categorias = [_categoria_com_origem(d, c) for d, c in zip(df["descricao"], df["categoria_banco"])]
    df["categoria"] = [c[0] for c in categorias]
    df["origem_categoria"] = [c[1] for c in categorias]
    modo_sinais = "fatura" if formato == "fatura_nubank" else "extrato"
    df["tipo"] = [_tipo_transacao(d, bool(s), modo_sinais) if int(v) else "other"
                  for d, s, v in zip(df["descricao"], saida, df["centavos"])]
    if "natureza" in df:
        permitidos = {*TIPOS_DE_GASTO, "refund", "payment", "income", "other"}
        for indice, natureza in df["natureza"].items():
            if natureza:
                if natureza not in permitidos:
                    raise ArquivoInvalido("Natureza desconhecida na planilha-modelo.")
                df.at[indice, "tipo"] = natureza
    df["eh_gasto"] = df["tipo"].isin(TIPOS_DE_GASTO)
    # A coluna antiga apenas sinaliza suspeitas; não exclui compras legítimas.
    df["duplicada"] = df.duplicated(subset=["data", "descricao", "centavos"], keep="first")
    df["is_suspected_duplicate"] = df["duplicada"]
    df["is_duplicate"] = False
    df["document_type"] = modo
    return df, regra


def linhas_para_gravar(df):
    linhas = []
    for i in df.to_dict("records"):
        saldo = i.get("saldo_centavos")
        linhas.append(dict(transaction_date=i["data"].date(), description_raw=i["descricao"],
            description_normalized=_texto_busca(i["descricao"]).strip() or None,
            merchant=i["estabelecimento"] or None, amount=Decimal(int(i["valor_abs"])) / 100,
            transaction_type=i["tipo"], category_name=i["categoria"], category_source=i["origem_categoria"],
            installment_current=None if pd.isna(i["parcela_atual"]) else int(i["parcela_atual"]),
            installment_total=None if pd.isna(i["parcela_total"]) else int(i["parcela_total"]),
            source_row=int(i["linha"]), source_sheet=_opcional(i.get("source_sheet"), str), bank_transaction_id=_opcional(i.get("bank_transaction_id"), str),
            balance=None if pd.isna(saldo) else Decimal(int(saldo)) / 100,
            is_duplicate=bool(i.get("is_duplicate", False)), is_suspected_duplicate=bool(i.get("is_suspected_duplicate", False))))
    return linhas


def quadro_de_transacoes(registros):
    """Preserva metadata e natureza histórica; jamais infere sinais perdidos."""
    colunas = ["data", "descricao", "estabelecimento", "categoria", "valor", "tipo", "parcela_atual", "parcela_total"]
    df = pd.DataFrame(registros) if registros else pd.DataFrame(columns=colunas)
    df["data"] = pd.to_datetime(df["data"])
    df["mes"] = df["data"].dt.strftime("%Y-%m")
    df["valor_abs"] = [int(Decimal(str(v)) * 100) for v in df["valor"]]
    for coluna in ("parcela_atual", "parcela_total"):
        if coluna not in df:
            df[coluna] = None
    df["eh_gasto"] = df["tipo"].isin(TIPOS_DE_GASTO)
    df["parcela"] = df["parcela_atual"].notna()
    return df


def _lancamento_legado(i):
    return dict(data=pd.Timestamp(i["data"]).strftime("%d/%m/%Y"), estabelecimento=i["estabelecimento"],
                descricao=i["descricao"], categoria=i["categoria"], valor=float(i["valor"]), parcela=i["parcela"])


def _analise_vazia():
    return dict(resumo=None, variacao=None, por_mes=[], meses_com_gastos=0, por_categoria=[],
                maiores_lancamentos=[], lancamentos=[], recorrentes=[], assinaturas_pelo_nome=[])


def calcular_analise(df, mes=None, incluir_lancamentos=False):
    """Adapta os nomes/tipos legados; a matemática vem do núcleo compartilhado."""
    if df.empty:
        return _analise_vazia()
    a = calcular_analytics(df, mes=mes or "all")
    r, e = a["resumo"], a["estatisticas"]
    resumo = dict(total_saidas=float(r["total_saidas"]),
        total_entradas=float(Decimal(r["total_entradas"]) + Decimal(r["total_pagamentos"])),
        quantidade_saidas=r["quantidade_saidas"], media=float(e["media"]) if e["media"] else None,
        mediana=float(e["mediana"]) if e["mediana"] else None, maior=float(e["maximo"]) if e["maximo"] else None,
        media_por_dia=float(r["media_por_dia"]) if r["media_por_dia"] is not None else None, dias=r["dias"],
        periodo_inicio=pd.Timestamp(a["cobertura"]["inicio"]).strftime("%d/%m/%Y") if a["cobertura"]["inicio"] else None,
        periodo_fim=pd.Timestamp(a["cobertura"]["fim"]).strftime("%d/%m/%Y") if a["cobertura"]["fim"] else None)
    c = a["comparacao"]
    variacao = None if c["diferenca"] is None else dict(mes_anterior=c["mes_referencia"], rotulo_anterior=rotulo_mes(c["mes_referencia"]),
        total_anterior=float(c["total_referencia"]), diferenca=float(c["diferenca"]),
        percentual=round(c["percentual"], 4) if c["percentual"] is not None else None)
    periodo = base_elegivel(df)
    if mes:
        periodo = periodo[periodo["mes"] == mes]
    periodo = periodo[periodo["tipo"].isin(TIPOS_DE_GASTO)]
    recorrentes, assinaturas = [], []
    for s in a["servicos"]:
        if "recorrencia_confirmada" in s["classificacoes"]:
            recorrentes.append(dict(estabelecimento=s["estabelecimento"], valor=float(s["base_mensal"]),
                dia_mais_recente=int(s["ultima_cobranca"][-2:]), total_por_mes=float(s["base_mensal"]),
                custo_no_ano=float(s["anualizado"]), meses=len(s["meses_evidencia"])))
        if "assinatura_identificada" in s["classificacoes"]:
            assinaturas.append(dict(estabelecimento=s["estabelecimento"], valor=float(s["base_mensal"]),
                ultima_cobranca=pd.Timestamp(s["ultima_cobranca"]).strftime("%d/%m/%Y"), custo_no_ano=float(s["anualizado"])))
    return dict(resumo=resumo, variacao=variacao,
        por_mes=[{**p, "total":float(p["total"]) if p["total"] is not None else None} for p in a["por_mes"]],
        meses_com_gastos=len(a["meses_disponiveis"]),
        por_categoria=[dict(categoria=c["categoria"], total=float(c["total"]), quantidade=c["quantidade"], participacao=c["participacao"]) for c in a["por_categoria"]],
        maiores_lancamentos=[_lancamento_legado(i) for i in a["maiores_lancamentos"]],
        lancamentos=[_lancamento_legado(_item(i)) for i in _ordenar(periodo).head(300).to_dict("records")] if incluir_lancamentos else [],
        recorrentes=sorted(recorrentes, key=lambda s:-s["custo_no_ano"]),
        assinaturas_pelo_nome=sorted(assinaturas, key=lambda s:-s["custo_no_ano"]))


@dataclass
class ArquivoProcessado:
    """O que sai da leitura e da limpeza de um arquivo."""

    nome: str
    formato: str
    linhas_lidas: int
    transacoes: pd.DataFrame  # vazio quando nenhuma linha é válida
    rejeitadas: list[dict]
    regra: str | None
    document_type: str | None = None

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

    @property
    def dimensoes(self) -> dict:
        """Evidência de origem; a unicidade persistida será refeita pelo serviço."""
        total = self.linhas_lidas
        incompletas = sum(r["codigo"] == "empty_description" or any(not str(r["conteudo"].get(k, "")).strip() for k in ("data", "descricao", "valor")) for r in self.rejeitadas)
        suspeitas = int(self.transacoes["duplicada"].sum()) if len(self.transacoes) else 0
        ids = self.transacoes.get("bank_transaction_id", pd.Series(dtype="object")).dropna()
        confirmadas = int(ids[ids.astype(str).str.strip() != ""].duplicated().sum())
        def medida(validas):
            return dict(percentual=round(validas / total * 100, 1) if total else None,
                        quantidade=validas, total=total, motivo=None if total else "sem_linhas")
        return dict(completude=medida(total - incompletas), validade=medida(len(self.transacoes)),
                    unicidade=dict(quantidade=confirmadas, total=len(self.transacoes), suspeitas=suspeitas,
                                   percentual=round((len(self.transacoes) - confirmadas) / len(self.transacoes) * 100, 1) if len(self.transacoes) else None,
                                   motivo=None if len(self.transacoes) else "sem_linhas",
                                   contexto="Duplicatas por identificador bancário; suspeitas permanecem contabilizadas."),
                    consistencia=_conferir_saldos(self.transacoes, self.formato))


def _conferir_saldos(df, formato):
    """Confere só transições adjacentes com saldo pós-lançamento conhecido.

    Não inventa saldo inicial nem ordem de movimentos de uma fonte descendente.
    Linhas rejeitadas/sem saldo interrompem uma cadeia verificável.
    """
    indisponivel = dict(percentual=None, quantidade=0, total=0, motivo="saldo_ou_ordem_insuficiente")
    if df.empty or "saldo_centavos" not in df or formato == "fatura_nubank" or not df["data"].is_monotonic_increasing:
        return indisponivel
    verificadas = 0
    registros = df.to_dict("records")
    for anterior, atual in zip(registros, registros[1:]):
        if pd.isna(anterior.get("saldo_centavos")) or pd.isna(atual.get("saldo_centavos")) or atual["linha"] != anterior["linha"] + 1:
            continue
        verificadas += 1
        if int(anterior["saldo_centavos"]) + int(atual["centavos"]) != int(atual["saldo_centavos"]):
            raise ArquivoInvalido(f"Saldo não reconciliado na linha {atual['linha']}; confira a sequência do extrato.")
    return dict(percentual=100.0, quantidade=verificadas, total=verificadas, motivo=None,
                contexto="Transições observadas; saldo inicial não informado.") if verificadas else indisponivel


def processar_arquivo(conteudo: bytes, nome: str, document_type: str | None = None) -> ArquivoProcessado:
    """Lê, reconhece, limpa e prepara um arquivo. Levanta ArquivoInvalido se não der."""
    bruto = ler_arquivo(conteudo, nome)
    formato, adaptado = adaptar(bruto)
    tipo = _tipo_documento(formato, document_type)
    validas, rejeitadas = limpar(adaptado)
    if validas.empty:
        return ArquivoProcessado(nome, formato, len(adaptado), validas, rejeitadas, None, tipo)
    preparadas, regra = preparar_transacoes(formato, validas, tipo)
    _conferir_saldos(preparadas, formato)
    return ArquivoProcessado(nome, formato, len(adaptado), preparadas, rejeitadas, regra, tipo)


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


def analisar_arquivo(conteudo: bytes, nome: str, document_type: str | None = None) -> dict:
    """Caminho completo da prévia: bytes do arquivo -> dicionário pronto para virar JSON."""
    return resultado_da_previa(processar_arquivo(conteudo, nome, document_type))
