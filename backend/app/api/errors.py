from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

_GENERIC = {
    "missing": "Campo obrigatório.",
    "string_type": "Informe um texto.",
    "string_too_short": "Texto curto demais.",
    "string_too_long": "Texto longo demais.",
}


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Answer with one message per field, in Portuguese, so the interface can show them inline."""
    fields: dict[str, str] = {}
    for error in exc.errors():
        location = [str(part) for part in error["loc"] if part not in ("body", "query", "path")]
        name = location[-1] if location else "request"
        message = error["msg"].removeprefix("Value error, ")
        if error["type"] in _GENERIC:
            message = _GENERIC[error["type"]]
        elif error["type"] != "value_error":
            message = "Valor inválido."
        fields.setdefault(name, message)
    return JSONResponse(status_code=422, content={"detail": "Revise os campos informados.", "fields": fields})
