"""Decisões de duplicidade com evidência, sem consultas ou efeitos no banco."""

from collections import defaultdict
from decimal import Decimal
from datetime import datetime, timezone

from app.pipeline.previa import _texto_busca


class ConflitoDuplicata(ValueError):
    def __init__(self, ids):
        self.ids = list(ids)
        super().__init__("Identificador bancário repetido com data, valor ou natureza divergente.")


def decidir_duplicatas(registros: list[dict]) -> list[dict]:
    """Eleição canônica estável. Sem ID bancário, semelhança é só suspeita.

    O chamador fornece todos os registros relevantes do usuário dentro da mesma
    transação de gravação/exclusão. Cada decisão corresponde à posição de entrada.
    """
    decisoes = [dict(id=r.get("id"), is_duplicate=False, is_suspected_duplicate=False) for r in registros]
    confirmadas, suspeitas = defaultdict(list), defaultdict(list)
    for pos, r in enumerate(registros):
        identificador = str(r.get("bank_transaction_id") or "").strip()
        if identificador:
            chave = (str(r.get("user_id")), r.get("source_format"), r.get("document_type"), identificador)
            confirmadas[chave].append(pos)
        else:
            chave = (str(r.get("user_id")), str(r["data"]), _texto_busca(r.get("descricao", "")), Decimal(str(r["valor"])))
            suspeitas[chave].append(pos)
    for posicoes in confirmadas.values():
        assinaturas = {(str(registros[i]["data"]), Decimal(str(registros[i]["valor"])), registros[i]["tipo"]) for i in posicoes}
        if len(assinaturas) > 1:
            raise ConflitoDuplicata(registros[i].get("id") for i in posicoes)
        def ordem(i):
            r = registros[i]
            criado = r.get("upload_created_at")
            if isinstance(criado, str):
                criado = datetime.fromisoformat(criado.replace("Z", "+00:00"))
            criado = criado or datetime.min.replace(tzinfo=timezone.utc)
            criado = criado.replace(tzinfo=timezone.utc) if criado.tzinfo is None else criado.astimezone(timezone.utc)
            return (criado, str(r.get("upload_id") or ""), int(r.get("source_row") or 0), str(r.get("id") or ""), str(r.get("source_sheet") or ""))
        for i in sorted(posicoes, key=ordem)[1:]:
            decisoes[i]["is_duplicate"] = True
    for posicoes in suspeitas.values():
        if len(posicoes) > 1:
            for i in posicoes:
                decisoes[i]["is_suspected_duplicate"] = True
    return decisoes
