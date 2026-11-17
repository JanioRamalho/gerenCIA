from app.pipeline.analise import calcular_analytics
from app.pipeline.analytics import mes_anterior
from test_analise_financeira import quadro


def test_servicos_dupla_classificacao_base_mensal_e_historico_sem_dupla_contagem():
    df = quadro(("2026-08-01", 20, "purchase", "Assinaturas", "Netflix"),
                ("2026-10-01", 20, "purchase", "Assinaturas", "Netflix"),
                ("2026-10-02", 20, "purchase", "Assinaturas", "Netflix"),
                ("2026-08-03", 15, "purchase", "Assinaturas", "Spotify"),
                ("2026-10-03", 20, "refund", "Assinaturas", "Netflix"))
    servicos = {s["estabelecimento"]:s for s in calcular_analytics(df, "2026-10")["servicos"]}
    netflix, spotify = servicos["Netflix"], servicos["Spotify"]
    assert netflix["classificacoes"] == ["assinatura_identificada", "recorrencia_confirmada"]
    assert netflix["total_periodo"] == netflix["base_mensal"] == "40.00"
    assert netflix["anualizado"] == "480.00"
    assert netflix["mes_base"] == "2026-10"
    assert netflix["lacunas"] == ["2026-09"]
    assert spotify["classificacoes"] == ["assinatura_identificada"]
    assert spotify["total_periodo"] == "0.00"
    assert spotify["mes_base"] == "2026-08"
    assert spotify["anualizado"] == "180.00"
    for mes in ("all", "2026-08"):
        outros = {s["estabelecimento"]:s for s in calcular_analytics(df, mes)["servicos"]}
        assert outros["Netflix"]["base_mensal"] == "40.00"
        assert outros["Spotify"]["base_mensal"] == "15.00"
    assert next(s for s in calcular_analytics(df, "all")["servicos"] if s["estabelecimento"] == "Netflix")["total_periodo"] == "60.00"


def test_parcela_e_copia_confirmada_nao_confirmam_recorrencia():
    df = quadro(("2026-08-01", 20, "purchase", "Assinaturas", "Netflix"),
                ("2026-10-01", 20, "purchase", "Assinaturas", "Netflix"),
                ("2026-08-01", 50, "purchase", "Compras", "Loja"),
                ("2026-10-01", 50, "purchase", "Compras", "Loja"))
    df["parcela"] = [False, True, True, True]
    s = calcular_analytics(df)["servicos"]
    assert len(s) == 1
    assert s[0]["classificacoes"] == ["assinatura_identificada"]
    assert s[0]["base_mensal"] == "20.00"


def test_meses_com_receita_tambem_sao_evidencia_de_historico():
    df = quadro(("2026-08-01", 20, "purchase", "Assinaturas", "Netflix"),
                ("2026-10-01", 20, "purchase", "Assinaturas", "Netflix"),
                ("2026-09-01", 1000, "income", "Outros", "Salário"))
    assert calcular_analytics(df)["servicos"][0]["classificacoes"] == ["assinatura_identificada"]
    assert mes_anterior("2026-01") == "2025-12"


def test_estorno_com_vinculo_explicito_entra_no_servico_uma_vez():
    df = quadro(("2026-08-01", 20, "purchase", "Assinaturas", "Netflix"),
                ("2026-08-02", 5, "refund", "Assinaturas", "Crédito"))
    df["refund_of_id"] = [None, "0000"]
    assert calcular_analytics(df)["servicos"][0]["base_mensal"] == "15.00"


def test_ausencias_nan_nao_criam_vinculo_de_estorno_com_servico():
    df = quadro(("2026-08-01", 20, "purchase", "Assinaturas", "Netflix"),
                ("2026-08-02", 5, "refund", "Outros", "Crédito sem vínculo"))
    df["id"] = [float("nan"), float("nan")]
    df["refund_of_id"] = [float("nan"), float("nan")]
    assert calcular_analytics(df)["servicos"][0]["base_mensal"] == "20.00"
