"""Aplicação FastAPI: junta as rotas e define como os erros de validação respondem.

As rotas de autenticação ficam em api/auth.py. Aqui ficam as rotas de saúde,
que dizem se a API e o banco estão no ar, e a lista de categorias.
"""

from fastapi import Depends, FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.auth import router as auth_router
from app.api.errors import validation_error_handler
from app.db.session import engine, get_db
from app.repositories import categories
from app.schemas.categories import CategoryResponse

app = FastAPI(title="gerenCIA API")
# Dados inválidos numa requisição viram uma resposta 422 com uma mensagem por campo.
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.include_router(auth_router)


@app.get("/api/health")
def health():
    """Responde se a API está no ar, sem consultar o banco."""
    return {"status": "ok"}


@app.get("/api/health/database")
def database_health():
    """Responde se a API consegue falar com o banco. Devolve 503 quando não consegue."""
    try:
        with engine.connect() as connection:
            # SELECT 1 é a consulta mais simples possível: só confirma que o banco responde.
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível conectar ao banco de dados.",
        ) from exc

    return {"status": "ok", "database": "connected"}


@app.get("/api/categories", response_model=list[CategoryResponse])
def list_system_categories(db: Session = Depends(get_db)):
    """Lista as categorias do sistema que estão ativas. Não exige login."""
    try:
        return categories.list_active_system(db)
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível consultar as categorias.",
        ) from exc
