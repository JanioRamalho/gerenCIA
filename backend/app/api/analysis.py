"""Rota de prévia da análise: recebe uma fatura e devolve as medidas, sem gravar nada.

Serve para testar o caminho completo (arquivo -> pandas -> dashboard) antes de
existirem o upload definitivo e o banco de dados. Por isso:

- não exige login e não usa o banco;
- fica desligada em produção (APP_ENV=production responde 404);
- recebe o arquivo como corpo bruto da requisição, com o nome na URL
  (?nome=fatura.csv), o que dispensa a biblioteca python-multipart.
"""

from fastapi import APIRouter, HTTPException, Request
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.pipeline.analise import analisar_arquivo
from app.pipeline.previa import MAX_BYTES, ArquivoInvalido

router = APIRouter(prefix="/api/analise", tags=["analise"])


@router.post("/previa")
async def previa_da_analise(request: Request, nome: str = "arquivo.csv"):
    """Analisa o arquivo enviado (CSV ou XLSX) e devolve o resultado em JSON."""
    if settings.app_env == "production":
        raise HTTPException(status_code=404, detail="Recurso indisponível.")

    tamanho_informado = request.headers.get("content-length")
    if tamanho_informado and tamanho_informado.isdigit() and int(tamanho_informado) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="O arquivo passa de 5 MB.")

    conteudo = await request.body()
    try:
        # O pandas trabalha de forma síncrona; a thread evita travar o servidor.
        return await run_in_threadpool(analisar_arquivo, conteudo, nome)
    except ArquivoInvalido as erro:
        raise HTTPException(status_code=422, detail=str(erro)) from erro
