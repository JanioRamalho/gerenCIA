"""Caso de uso da IA: montar o perfil de gastos da pessoa logada.

A rota (api/ai.py) chama esta função. As transações vêm do repositório, os
totais mensais e o modelo ficam em ai/; aqui só se junta tudo.
"""

from sqlalchemy.orm import Session

from app.ai.perfil import analisar_perfil, totais_por_mes
from app.models import User
from app.pipeline.analise import quadro_de_transacoes
from app.repositories import uploads as uploads_repo


def perfil_de_gastos(db: Session, user: User) -> dict:
    """Perfil de gastos e meses anômalos de quem está logado."""
    registros = uploads_repo.transactions_for_analysis(db, user_id=user.id)
    if not registros:
        return {"tem_dados": False}
    por_mes = totais_por_mes(quadro_de_transacoes(registros))
    renda = float(user.monthly_income) if user.monthly_income is not None else None
    return {"tem_dados": True, **analisar_perfil(por_mes, renda)}
