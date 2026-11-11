"""Formato dos dados de arquivos enviados que saem da API."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class UploadResponse(BaseModel):
    """Uma linha do histórico: o arquivo e o resumo do que foi lido dele."""

    id: UUID
    code: int
    original_filename: str
    created_at: datetime
    formato: str | None
    periodo_inicio: date | None
    periodo_fim: date | None
    linhas_validas: int
    linhas_rejeitadas: int
    linhas_duplicadas: int
    percentual: float | None
    total_saidas: float
    total_entradas: float
