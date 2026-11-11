"""Leitura, limpeza e regras de texto de faturas e extratos, com pandas.

Este módulo cuida da primeira metade do caminho, sem depender do FastAPI nem do
banco: ler o arquivo, reconhecer o formato, limpar as linhas (cada uma vira
transação ou rejeição, com o motivo) e dar nome, categoria, tipo e parcela a
cada descrição. O cálculo das medidas do dashboard fica em analise.py.

    ler_arquivo -> adaptar -> limpar          (este módulo)
    preparar_transacoes -> calcular_analise   (analise.py)
"""

from __future__ import annotations

import csv
import io
import re
import unicodedata
from datetime import date, datetime, timedelta
from decimal import Decimal

import pandas as pd

MAX_BYTES = 5 * 1024 * 1024  # limite de 5 MB do planejamento

CATEGORIAS = (
    "Alimentação", "Transporte", "Lazer", "Saúde", "Educação", "Moradia",
    "Compras", "Assinaturas", "Serviços", "Viagens", "Outros",
)

MESES = ("jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez")


class ArquivoInvalido(ValueError):
    """O arquivo não pôde ser lido ou não tem o formato esperado."""


def _sem_acento(texto: str) -> str:
    base = unicodedata.normalize("NFKD", str(texto))
    return base.encode("ascii", "ignore").decode("ascii")


def _chave_coluna(nome: str) -> str:
    """'Descrição' -> 'descricao'; 'Valor (R$)' -> 'valorr'."""
    return re.sub(r"[^a-z0-9]", "", _sem_acento(nome).lower())


# --------------------------------------------------------------------------- #
# 1. Leitura: tudo como texto, para o pandas não "adivinhar" nenhum valor
# --------------------------------------------------------------------------- #

def _ler_csv(conteudo: bytes) -> pd.DataFrame:
    try:
        texto = conteudo.decode("utf-8-sig")
    except UnicodeDecodeError:
        texto = conteudo.decode("latin-1")

    primeira_linha = texto.splitlines()[0] if texto.strip() else ""
    candidatos = {";": primeira_linha.count(";"), ",": primeira_linha.count(","), "\t": primeira_linha.count("\t")}
    separador = max(candidatos, key=candidatos.get)
    if candidatos[separador] == 0:
        raise ArquivoInvalido("Não encontrei colunas no arquivo. Confira se é um CSV com cabeçalho.")

    try:
        return pd.read_csv(
            io.StringIO(texto), sep=separador, dtype=str, keep_default_na=False,
            quoting=csv.QUOTE_MINIMAL, skip_blank_lines=True,
        )
    except (pd.errors.ParserError, pd.errors.EmptyDataError) as exc:
        raise ArquivoInvalido("Não foi possível ler o CSV. Confira o separador e as aspas.") from exc


def ler_arquivo(conteudo: bytes, nome: str) -> pd.DataFrame:
    """Lê CSV ou XLSX e devolve um DataFrame só de texto, com a linha de origem."""
    if not conteudo:
        raise ArquivoInvalido("O arquivo está vazio.")
    if len(conteudo) > MAX_BYTES:
        raise ArquivoInvalido("O arquivo passa de 5 MB.")

    nome_minusculo = nome.lower()
    if nome_minusculo.endswith(".csv"):
        df = _ler_csv(conteudo)
    elif nome_minusculo.endswith(".xlsx"):
        try:
            df = pd.read_excel(io.BytesIO(conteudo), dtype=str, engine="openpyxl")
        except Exception as exc:  # openpyxl levanta vários tipos de erro para arquivos corrompidos
            raise ArquivoInvalido("Não foi possível abrir a planilha XLSX.") from exc
    else:
        raise ArquivoInvalido("Formato não aceito. Envie um arquivo CSV ou XLSX.")

    df.columns = [str(coluna).strip() for coluna in df.columns]
    df = df.fillna("")
    df = df.loc[~(df.apply(lambda coluna: coluna.astype(str).str.strip()) == "").all(axis=1)]
    # O cabeçalho é a linha 1 do arquivo; o índice do pandas começa em 0 na linha 2.
    df = df.assign(linha_origem=df.index + 2)
    if df.empty:
        raise ArquivoInvalido("O arquivo não tem nenhum lançamento abaixo do cabeçalho.")
    return df


# --------------------------------------------------------------------------- #
# 2. Adaptação: reconhece o formato pelas colunas e renomeia para os campos internos
# --------------------------------------------------------------------------- #

_ALIAS = {
    "data": {"data", "datadacompra", "datacompra", "datalancamento", "datadolancamento", "date"},
    "descricao": {"descricao", "estabelecimento", "historico", "lancamento", "title", "detalhes"},
    "valor": {"valor", "valorr", "valorrs", "valoremr", "amount"},
    "categoria": {"categoria", "category"},
}


def adaptar(df: pd.DataFrame) -> tuple[str, pd.DataFrame]:
    """Devolve o formato reconhecido e um DataFrame com colunas data, descricao, valor, categoria."""
    por_chave = {_chave_coluna(c): c for c in df.columns if c != "linha_origem"}

    if {"date", "title", "amount"} <= por_chave.keys():
        formato = "fatura_nubank"
    elif {"data", "valor", "identificador", "descricao"} <= por_chave.keys():
        formato = "extrato_nubank"
    else:
        formato = "planilha_modelo"

    escolhidas: dict[str, str] = {}
    for campo, apelidos in _ALIAS.items():
        for chave, original in por_chave.items():
            if chave in apelidos:
                escolhidas[campo] = original
                break

    faltando = [campo for campo in ("data", "descricao", "valor") if campo not in escolhidas]
    if faltando:
        raise ArquivoInvalido(
            "Não reconheci o formato do arquivo. Colunas encontradas: "
            + ", ".join(c for c in df.columns if c != "linha_origem")
            + ". São necessárias colunas de data, descrição e valor (planilha-modelo do gerenCIA)."
        )

    adaptado = pd.DataFrame({
        "linha_origem": df["linha_origem"],
        "data": df[escolhidas["data"]],
        "descricao": df[escolhidas["descricao"]],
        "valor": df[escolhidas["valor"]],
        "categoria": df[escolhidas["categoria"]] if "categoria" in escolhidas else "",
    })
    return formato, adaptado


# --------------------------------------------------------------------------- #
# 3. Limpeza: converte datas e valores; toda linha vira transação ou rejeição
# --------------------------------------------------------------------------- #

_NAO_TRANSACAO = {
    "saldo anterior", "saldo final", "saldo inicial", "saldo do dia", "saldo",
    "total", "total da fatura", "total a pagar", "subtotal",
}


def _converter_data(texto: str) -> date | None:
    texto = texto.strip()
    if not texto:
        return None
    texto = re.split(r"[ T]", texto, maxsplit=1)[0]  # remove a hora ("2026-06-15 00:00:00")
    try:
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", texto):
            return datetime.strptime(texto, "%Y-%m-%d").date()
        if re.fullmatch(r"\d{2}/\d{2}/\d{4}", texto):
            return datetime.strptime(texto, "%d/%m/%Y").date()
        if re.fullmatch(r"\d{5}", texto):  # número de série do Excel
            return (datetime(1899, 12, 30) + timedelta(days=int(texto))).date()
    except ValueError:
        return None  # data que não existe, como 31/02
    return None


_BR = re.compile(r"-?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|-?\d+(?:,\d{1,2})?")
_PONTO = re.compile(r"-?\d+(?:\.\d{1,2})?")


def _usa_ponto_decimal(valores: pd.Series) -> bool:
    """Nubank exporta '55.90'; planilhas brasileiras usam '55,90'. Decide pela coluna inteira."""
    textos = valores.astype(str)
    if textos.str.contains(",", regex=False).any():
        return False
    return bool(textos.str.contains(r"\.\d{1,2}\s*$", regex=True).any())


def _converter_valor(texto: str, ponto_decimal: bool) -> int | None:
    """Converte o texto em centavos inteiros (sem float, para não errar centavos)."""
    limpo = re.sub(r"(?i)r\$", "", texto).strip().replace(" ", "")
    if not limpo:
        return None
    if ponto_decimal:
        if not _PONTO.fullmatch(limpo):
            return None
        numero = Decimal(limpo)
    else:
        if not _BR.fullmatch(limpo):
            return None
        numero = Decimal(limpo.replace(".", "").replace(",", "."))
    return int((numero * 100).to_integral_value())


def limpar(adaptado: pd.DataFrame) -> tuple[pd.DataFrame, list[dict]]:
    """Separa as linhas válidas das rejeitadas, sempre com o motivo da rejeição."""
    ponto = _usa_ponto_decimal(adaptado["valor"])
    validas: list[dict] = []
    rejeitadas: list[dict] = []

    for linha in adaptado.to_dict("records"):
        descricao = re.sub(r"\s+", " ", str(linha["descricao"])).strip()
        conteudo = {"data": linha["data"], "descricao": descricao, "valor": linha["valor"]}

        def rejeitar(codigo: str, mensagem: str) -> None:
            rejeitadas.append({"linha": int(linha["linha_origem"]), "codigo": codigo, "mensagem": mensagem, "conteudo": conteudo})

        if _sem_acento(descricao).lower() in _NAO_TRANSACAO:
            rejeitar("not_transaction", "Linha de saldo ou total, que não é um lançamento.")
            continue
        if not descricao:
            rejeitar("empty_description", "A descrição está vazia.")
            continue
        data = _converter_data(str(linha["data"]))
        if data is None:
            rejeitar("invalid_date", f"A data '{linha['data']}' não existe ou está em formato desconhecido.")
            continue
        centavos = _converter_valor(str(linha["valor"]), ponto)
        if centavos is None:
            rejeitar("invalid_value", f"O valor '{linha['valor']}' não pôde ser convertido.")
            continue

        validas.append({
            "linha": int(linha["linha_origem"]),
            "data": data,
            "descricao": descricao,
            "centavos": centavos,
            "categoria_banco": str(linha["categoria"]).strip(),
        })

    colunas = ["linha", "data", "descricao", "centavos", "categoria_banco"]
    return pd.DataFrame(validas, columns=colunas), rejeitadas


# --------------------------------------------------------------------------- #
# 4. Estabelecimento, parcela e categoria
# --------------------------------------------------------------------------- #

_PARCELA = re.compile(r"(?i)\bparcela\s*\d{1,2}\s*(?:/|de)\s*\d{1,2}\b|\b\d{1,2}\s*/\s*\d{1,2}\s*$")
_PREFIXOS = re.compile(r"(?i)^(compra no d[eé]bito|compra no cr[eé]dito|pix enviado|pagamento de boleto|transfer[eê]ncia enviada pelo pix)\s*-\s*")

_NOMES_CONHECIDOS = (
    ("ifd", "iFood"), ("ifood", "iFood"), ("uber eats", "Uber Eats"), ("uber", "Uber"),
    ("99app", "99"), ("99 *", "99"), ("netflix", "Netflix"), ("spotify", "Spotify"),
    ("amazon prime", "Amazon Prime"), ("amazon", "Amazon"), ("mcdonald", "McDonald's"),
)

_PALAVRAS_CHAVE = (
    ("Assinaturas", ("netflix", "spotify", "disney", "hbo", "prime video", "amazon prime", "youtube premium", "deezer", "globoplay", "icloud", "google one", "microsoft 365", "adobe", "chatgpt", "openai", "canva", "apple com bill")),
    ("Compras", ("amazon", "mercadolivre", "mercado livre", "shopee", "shein", "magazine luiza", "magalu", "americanas", "aliexpress", "renner", "riachuelo", "casas bahia", "kabum", "zara")),
    ("Alimentação", ("ifood", "ifd", "uber eats", "rappi", "mcdonald", "burger king", "subway", "restaurante", "padaria", "lanchonete", "pizza", "supermercado", "mercado", "atacadao", "assai", "carrefour", "pao de acucar", "acougue", "hortifruti", "cafe", "sorveteria")),
    ("Transporte", ("uber", "99", "99app", "cabify", "posto", "shell", "ipiranga", "combustivel", "estacionamento", "pedagio", "sem parar", "metro", "onibus", "bilhete unico", "taxi")),
    ("Viagens", ("latam", "gol linhas", "azul", "hotel", "booking", "airbnb", "decolar", "cvc", "hospedagem", "passagem")),
    ("Saúde", ("farmacia", "drogaria", "drogasil", "raia", "pacheco", "pague menos", "hospital", "clinica", "laboratorio", "dentista", "unimed", "plano de saude")),
    ("Educação", ("escola", "faculdade", "curso", "udemy", "alura", "coursera", "livraria", "livro", "universidade")),
    ("Moradia", ("aluguel", "condominio", "energia", "enel", "cpfl", "equatorial", "agua", "saneamento", "leroy", "telhanorte")),
    ("Lazer", ("cinema", "ingresso", "steam", "playstation", "xbox", "nintendo", "teatro", "show", "sympla", "bar")),
    ("Serviços", ("claro", "vivo", "tim", "internet", "seguro", "tarifa", "anuidade", "iof", "juros", "multa", "lavanderia", "correios")),
)


def _texto_busca(descricao: str) -> str:
    return " " + re.sub(r"[^a-z0-9]+", " ", _sem_acento(descricao).lower()).strip() + " "


def _estabelecimento(descricao: str) -> str:
    """Nome limpo do estabelecimento: sem prefixo de operação, sem parcela, com nomes conhecidos."""
    nome = _PREFIXOS.sub("", descricao)
    nome = _PARCELA.sub("", nome).strip(" -")
    busca = _sem_acento(nome).lower()
    for trecho, bonito in _NOMES_CONHECIDOS:
        if trecho in busca:
            return bonito
    nome = re.sub(r"^\w{2,5}\*\s*", "", nome)  # prefixos de maquininha como "PAG*"
    return nome.title() if nome.isupper() else nome


def _categoria_com_origem(descricao: str, categoria_banco: str) -> tuple[str, str]:
    """Devolve a categoria e de onde ela veio: 'bank', 'keyword' ou 'uncategorized'."""
    escolhida = _sem_acento(categoria_banco).lower().strip()
    if escolhida:  # categoria válida fornecida pelo arquivo vence a palavra-chave
        for valida in CATEGORIAS:
            if escolhida == _sem_acento(valida).lower():
                return valida, "bank"
    texto = _texto_busca(descricao)
    for categoria, palavras in _PALAVRAS_CHAVE:
        if any(f" {palavra} " in texto for palavra in palavras):
            return categoria, "keyword"
    return "Outros", "uncategorized"


def _categoria(descricao: str, categoria_banco: str) -> str:
    return _categoria_com_origem(descricao, categoria_banco)[0]


# Parcela "2/5" ou "Parcela 2 de 5". Só vale se 0 < atual <= total.
_PARCELA_INFO = (
    re.compile(r"(?i)\bparcela\s*(\d{1,2})\s*(?:/|de)\s*(\d{1,2})\b"),
    re.compile(r"\b(\d{1,2})\s*/\s*(\d{1,2})\s*$"),
)


def _parcela_info(descricao: str) -> tuple[int, int] | None:
    """Devolve (parcela atual, total de parcelas), ou None se a descrição não tem parcela."""
    for padrao in _PARCELA_INFO:
        achado = padrao.search(descricao)
        if achado:
            atual, total = int(achado.group(1)), int(achado.group(2))
            if 0 < atual <= total:
                return atual, total
    return None


_PAGAMENTO_FATURA = re.compile(r" (pagamento (recebido|efetuado|da fatura|de fatura|fatura)|fatura (do )?cartao) ")
_TARIFA = re.compile(r" (juros|iof|multa|tarifa|anuidade|encargos?) ")


def _tipo_transacao(descricao: str, saiu_dinheiro: bool, modo: str) -> str:
    """Tipo da transação, entre os valores aceitos pelo banco.

    purchase e fee aumentam o gasto. payment (pagamento da fatura), refund
    (estorno ou crédito) e other (entrada do extrato) ficam fora do gasto.
    """
    texto = _texto_busca(descricao)
    if _PAGAMENTO_FATURA.search(texto):
        return "payment"
    if saiu_dinheiro:
        return "fee" if _TARIFA.search(texto) else "purchase"
    return "refund" if modo == "fatura" else "other"
