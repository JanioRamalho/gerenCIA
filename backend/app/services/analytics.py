"""Uma análise financeira para telas, comparação, limites e diagnóstico."""

from app.pipeline import analise
from app.repositories import transactions, uploads


class InvalidPeriod(ValueError):
    pass


def summary(db, user, month="latest", reference_month=None):
    records = transactions.analysis_records(db, user.id)
    months = {row["data"].strftime("%Y-%m") for row in records}
    if reference_month:
        actual = max(months) if month == "latest" and months else month
        if actual in ("all", reference_month) or actual not in months or reference_month not in months:
            raise InvalidPeriod("Escolha dois meses distintos com registros para comparar.")
    try:
        result = analise.calcular_analytics(analise.quadro_de_transacoes(records), mes=month,
                                           reference_month=reference_month)
    except ValueError as exc:
        raise InvalidPeriod(str(exc)) from exc
    return {**result, "arquivos": uploads.count(db, user_id=user.id), "tem_dados": bool(records)}
