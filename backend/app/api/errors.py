"""Tradução dos erros de validação para mensagens em português.

Quando os dados de uma requisição não passam na validação do Pydantic, o
FastAPI gera um erro em inglês. Este arquivo transforma esse erro numa resposta
com uma mensagem por campo, que o frontend mostra ao lado de cada campo do
formulário. Exemplo de resposta:

    {
        "detail": "Revise os campos informados.",
        "fields": {"email": "Informe um e-mail válido, como nome@exemplo.com."}
    }
"""

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

# Mensagens em português para os tipos de erro mais comuns do Pydantic.
GENERIC_MESSAGES = {
    "missing": "Campo obrigatório.",
    "string_type": "Informe um texto.",
    "string_too_short": "Texto curto demais.",
    "string_too_long": "Texto longo demais.",
}

# Partes do caminho do erro que só dizem de onde o dado veio, e não qual campo.
SOURCE_NAMES = ("body", "query", "path")


def get_field_name(error: dict) -> str:
    """Descobre o nome do campo que falhou.

    O Pydantic informa onde está o erro na chave "loc", por exemplo
    ("body", "email"). Ignoramos "body", "query" e "path" e ficamos com a
    última parte que sobrar, nesse caso "email".
    """
    parts = []
    for part in error["loc"]:
        if part not in SOURCE_NAMES:
            parts.append(str(part))

    if not parts:
        return "request"
    return parts[-1]


def get_message(error: dict) -> str:
    """Escolhe a mensagem em português para um erro de validação."""
    error_type = error["type"]

    if error_type in GENERIC_MESSAGES:
        return GENERIC_MESSAGES[error_type]

    if error_type == "value_error":
        # São os erros dos nossos validadores (schemas/auth.py), que já estão
        # em português. O Pydantic só acrescenta "Value error, " na frente.
        return error["msg"].removeprefix("Value error, ")

    # Qualquer outro tipo de erro recebe uma mensagem genérica.
    return "Valor inválido."


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Monta a resposta 422 com uma mensagem por campo.

    O FastAPI exige o parâmetro `request` nesta função, mesmo sem usá-lo.
    """
    fields: dict[str, str] = {}

    for error in exc.errors():
        field_name = get_field_name(error)
        # Se o mesmo campo tiver mais de um erro, mostramos só o primeiro.
        if field_name not in fields:
            fields[field_name] = get_message(error)

    return JSONResponse(
        status_code=422,
        content={"detail": "Revise os campos informados.", "fields": fields},
    )
