from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.session import engine, get_db
from app.models import Category
from app.schemas.categories import CategoryResponse

app = FastAPI(title="gerenCIA API")

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/health/database")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível conectar ao banco de dados.",
        ) from exc

    return {"status": "ok", "database": "connected"}


@app.get("/api/categories", response_model=list[CategoryResponse])
def list_system_categories(db: Session = Depends(get_db)):
    """List active built-in categories; personal categories require auth."""
    try:
        statement = (
            select(Category)
            .where(Category.user_id.is_(None), Category.is_active.is_(True))
            .order_by(Category.name)
        )
        return list(db.scalars(statement).all())
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível consultar as categorias.",
        ) from exc

