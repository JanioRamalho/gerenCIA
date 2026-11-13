import { useEffect, useState } from "react";
import type { User } from "../../auth/api";
import { leaveIfSignedOut, listUploads, type UploadItem } from "../../panel/api";
import PanelEmptyState from "./PanelEmptyState";
import { formatDate } from "./formatDate";

/** Visão geral enquanto ainda não há transações para analisar. */
export default function PanelHome({ user }: { user: User }) {
  const [history, setHistory] = useState<UploadItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    listUploads(controller.signal).then((data) => {
      if (!controller.signal.aborted) setHistory(data);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted && !leaveIfSignedOut(error)) setFailed(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [revision]);

  const today = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return <div className="panel-page overview-page">
    <header className="panel-overview-header">
      <div>
        <p className="panel-greeting">Olá, {user.name.split(" ")[0]}.</p>
        <h1>Seu painel financeiro</h1>
        <p className="panel-date">{today}</p>
      </div>
      <a className="primary-button is-night" href="/app/files">Enviar arquivo</a>
    </header>

    <div className="panel-availability">
      <span className="status-line"><i className="status-mark" aria-hidden="true" />Aguardando seu primeiro arquivo</span>
      <p>Envie um extrato ou uma fatura para acompanhar os indicadores e os gráficos da sua conta.</p>
    </div>

    <PanelEmptyState />

    <section className="panel-section" aria-labelledby="recent-files-title" aria-busy={loading}>
      <div className="panel-section-heading">
        <h2 id="recent-files-title">Arquivos recentes</h2>
        <a className="text-link" href="/app/files">Ver todos os arquivos</a>
      </div>
      <div className="panel-card panel-recent-files">
        {loading ? <p className="panel-note" role="status">Consultando seus arquivos…</p>
          : failed ? <div className="panel-inline-state">
            <p role="alert">Não foi possível consultar os arquivos. Tente novamente.</p>
            <button className="secondary-button" onClick={() => setRevision((value) => value + 1)}>Tentar novamente</button>
          </div>
          : !history?.length ? <div className="panel-inline-state">
            <h3>Comece pelo seu primeiro arquivo.</h3>
            <p>Envie um extrato ou uma fatura em CSV ou XLSX. Você também pode experimentar com um arquivo fictício.</p>
            <a className="text-link" href="/app/files">Escolher um arquivo</a>
          </div>
          : <>
            <p className="panel-note">{history.length} {history.length === 1 ? "arquivo na sua conta" : "arquivos na sua conta"}. Confira os envios mais recentes abaixo.</p>
            <ol className="panel-recent-list">{history.slice(0, 3).map((file) => <li key={file.id}>
              <span className="panel-file-format">{file.original_filename.split(".").pop()?.toUpperCase()}</span>
              <div><h3>{file.original_filename}</h3><p>Enviado em {formatDate(file.created_at)}</p></div>
              <a className="text-link" href="/app/files">Ver histórico<span className="sr-only"> de {file.original_filename}</span></a>
            </li>)}</ol>
          </>}
      </div>
    </section>
  </div>;
}
