from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.errors import validation_error_handler
from app.api.uploads import router as uploads_router
from app.api.analytics import router as analytics_router
from app.api.transactions import router as transactions_router
from app.api.budgets import router as budgets_router, notification_router
from app.db.session import engine
from app.api.categories import router as categories_router

app = FastAPI(title="gerenCIA API")
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.include_router(auth_router)
app.include_router(uploads_router)
app.include_router(dashboard_router)
app.include_router(analytics_router)
app.include_router(transactions_router)
app.include_router(budgets_router)
app.include_router(notification_router)
app.include_router(categories_router)

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
