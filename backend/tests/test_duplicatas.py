from decimal import Decimal

import pytest

from app.pipeline.duplicatas import decidir_duplicatas, ConflitoDuplicata


def registro(**campos):
    return dict(id="a", user_id="u", upload_id="old", upload_created_at="2026-08-01T00:00:00Z", source_row=2,
                source_format="extrato_nubank", document_type="extrato", bank_transaction_id="banco-1",
                data="2026-08-01", valor=Decimal("10.00"), tipo="purchase", descricao="Loja", **campos)


def test_selecao_canonica_promocao_e_ordem_independente():
    primeiro = registro()
    segundo = {**primeiro, "id":"b", "upload_id":"new", "upload_created_at":"2026-08-02T00:00:00Z"}
    a, b = decidir_duplicatas([segundo, primeiro])
    assert a["is_duplicate"] and not b["is_duplicate"]
    assert not decidir_duplicatas([segundo])[0]["is_duplicate"]


@pytest.mark.parametrize("campo,valor", [("data", "2026-08-02"), ("valor", Decimal("11")), ("tipo", "refund")])
def test_conflito_recusa_alteracao_com_mesmo_id(campo, valor):
    primeiro = registro()
    with pytest.raises(ConflitoDuplicata) as exc:
        decidir_duplicatas([primeiro, {**primeiro, "id":"b", campo:valor}])
    assert exc.value.ids == ["a", "b"]


def test_sem_id_igualdade_e_so_suspeita_e_isolamento_de_escopo():
    a = {**registro(), "bank_transaction_id":None}
    b = {**a, "id":"b", "descricao":"  LOJA  "}
    decisoes = decidir_duplicatas([a, b])
    assert all(d["is_suspected_duplicate"] and not d["is_duplicate"] for d in decisoes)
    for campo in ("user_id", "source_format", "document_type"):
        assert not any(d["is_duplicate"] for d in decidir_duplicatas([registro(), {**registro(), campo:"outro"}]))


def test_instante_real_do_upload_e_desempate_nao_dependem_do_fuso():
    a = {**registro(), "upload_created_at":"2026-08-01T00:00:00-03:00"}
    b = {**registro(), "id":"b", "upload_created_at":"2026-08-01T01:00:00Z"}
    assert decidir_duplicatas([a, b])[0]["is_duplicate"]
