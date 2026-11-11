"""Rotas de envio de arquivos: enviar, listar o histórico e remover.

Todas exigem login. O usuário vem da sessão (get_current_user), nunca do
corpo da requisição. O arquivo chega como corpo bruto da requisição, com o nome
na URL (?nome=fatura.csv), o que dispensa a biblioteca python-multipart.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.pipeline.previa import MAX_BYTES, ArquivoInvalido
from app.schemas.uploads import UploadResponse
from app.services import uploads as uploads_service

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


@router.post("", response_model=UploadResponse, status_code=201)
async def enviar(
    request: Request,
    nome: str = "arquivo.csv",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lê o arquivo (CSV ou XLSX), grava as transações e devolve o resumo do envio."""
    tamanho_informado = request.headers.get("content-length")
    if tamanho_informado and tamanho_informado.isdigit() and int(tamanho_informado) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="O arquivo passa de 5 MB.")

    conteudo = await request.body()
    try:
        # O pandas e o banco trabalham de forma síncrona; a thread evita travar o servidor.
        return await run_in_threadpool(uploads_service.enviar_arquivo, db, user, nome=nome, conteudo=conteudo)
    except ArquivoInvalido as erro:
        raise HTTPException(status_code=422, detail=str(erro)) from erro
    except uploads_service.ArquivoJaEnviado as erro:
        raise HTTPException(status_code=409, detail=erro.mensagem) from erro


@router.get("", response_model=list[UploadResponse])
def listar(response: Response, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Histórico de arquivos da pessoa, do mais recente ao mais antigo."""
    response.headers["Cache-Control"] = "no-store"
    return uploads_service.historico(db, user)


@router.delete("/{upload_id}", status_code=204)
def remover(upload_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Remove um arquivo e as transações dele. 404 se o arquivo não for desta pessoa."""
    if not uploads_service.remover(db, user, upload_id):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    return Response(status_code=204)
