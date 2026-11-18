import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError } from "../../auth/api";
import { deleteUpload, leaveIfSignedOut, listUploads, money, sendFile, transactionLink, type UploadItem } from "../../panel/api";
import Icon from "../Icon";
import { formatDay } from "./formatDate";
import PanelDialog from "./PanelDialog";

const FORMATOS: Record<string, string> = {
  fatura_nubank: "Fatura Nubank",
  extrato_nubank: "Extrato Nubank",
  planilha_modelo: "Planilha-modelo",
};

const sentFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

/**
 * Página /app/files: envio de faturas e extratos e histórico de arquivos.
 *
 * O arquivo é lido no servidor com pandas; as transações e o relatório de
 * qualidade ficam gravados no banco, e o painel (/app) mostra a análise.
 */
export default function FilesSection({ onChanged }: { onChanged: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<UploadItem | null>(null);
  const [uploads, setUploads] = useState<UploadItem[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selected, setSelected] = useState<UploadItem | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const [status, setStatus] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const loadVersion = useRef(0);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    try {
      const items = await listUploads();
      if (version !== loadVersion.current) return;
      setUploads(items);
      setLoadFailed(false);
    } catch (failure) {
      if (version === loadVersion.current && !leaveIfSignedOut(failure)) setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => { loadVersion.current++; };
  }, [load]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || sending) return;
    setSending(true);
    setError(null);
    setLastSent(null);
    try {
      setLastSent(await sendFile(file));
      setFile(null);
      if (input.current) input.current.value = "";
      onChanged();
      await load();
    } catch (failure) {
      if (leaveIfSignedOut(failure)) return;
      setError(failure instanceof ApiError ? failure.message : "Não foi possível enviar o arquivo.");
    } finally {
      setSending(false);
    }
  }

  async function remove() {
    if (!selected || removing) return;
    setRemoving(true);
    setRemoveError("");
    try {
      await deleteUpload(selected.id);
      if (lastSent?.id === selected.id) setLastSent(null);
      setSelected(null);
      setStatus("Arquivo removido.");
      onChanged();
      await load();
    } catch (failure) {
      if (leaveIfSignedOut(failure)) return;
      setRemoveError(failure instanceof ApiError ? failure.message : "Não foi possível remover o arquivo.");
    } finally {
      setRemoving(false);
    }
  }

  return <div className="panel-page">
    <header className="panel-page-head panel-heading-row">
      <div><h1>Arquivos</h1><p className="lead">Importe faturas e extratos e confira o resultado da leitura.</p></div>
      <a className="secondary-button" href="/app/transactions"><Icon name="receipt" size={18} /> Ver transações</a>
    </header>

    <section className="panel-card panel-stack" aria-labelledby="upload-title">
      <div className="panel-feature-title">
        <span className="panel-icon-tile"><Icon name="upload" /></span>
        <div><h2 id="upload-title">Importar arquivo</h2><p className="pd-hint" id="file-info">CSV ou XLSX de até 5 MB. Use uma fatura ou um extrato do Nubank, ou uma planilha com as colunas data, descrição e valor.</p></div>
      </div>
      <form className="pd-upload" onSubmit={submit}>
        <label className="pd-file">
          <span>Arquivo</span>
          <input ref={input} type="file" accept=".csv,.xlsx" aria-describedby="file-info" disabled={sending} onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(null); setLastSent(null); }} />
        </label>
        <button className="primary-button is-night" type="submit" disabled={!file || sending}>{sending ? "Enviando…" : "Enviar arquivo"}</button>
      </form>
      <div className="sr-only" role="status" aria-live="polite">{sending ? "Enviando e lendo o arquivo…" : ""}</div>
      {error && <p className="pd-error" role="alert" tabIndex={-1} ref={errorRef}>{error}</p>}

      {lastSent && <div className="pd-success" role="status">
        <strong>Arquivo lido e gravado.</strong>
        <p>
          {lastSent.linhas_validas} transações válidas, {lastSent.linhas_rejeitadas} rejeitadas
          {lastSent.linhas_duplicadas > 0 ? `, ${lastSent.linhas_duplicadas} repetidas (mantidas e sinalizadas)` : ""}.
          Qualidade de {lastSent.percentual?.toLocaleString("pt-BR")}%. Saídas: {money(lastSent.total_saidas)}.
        </p>
        <div className="action-row">
          <a className="text-link" href={transactionLink({ arquivo: lastSent.id })}>Ver transações deste arquivo</a>
          <a className="text-link" href="/app">Ver análise no painel</a>
        </div>
      </div>}
    </section>

    <section className="panel-card panel-stack" aria-labelledby="history-title">
      <div className="panel-heading-row">
        <h2 id="history-title">Histórico de importações</h2>
        {uploads && <span className="panel-inline-status">{uploads.length} {uploads.length === 1 ? "arquivo" : "arquivos"}</span>}
      </div>
      <p className="sr-only" role="status">{status}</p>
      {loadFailed && <p className="pd-error" role="alert">Não foi possível carregar o histórico. <button className="text-button" type="button" onClick={() => void load()}>Tentar de novo</button></p>}
      {uploads === null && !loadFailed && <p className="pd-hint" role="status">Carregando histórico…</p>}
      {uploads?.length === 0 && <div className="panel-empty">
        <span className="panel-icon-tile"><Icon name="files" /></span>
        <strong>Nenhum arquivo enviado</strong><p>Os arquivos importados aparecem aqui.</p>
      </div>}
      {uploads && uploads.length > 0 && <ul className="file-history">
        {uploads.map((item) => <li key={item.id}>
          <div className="file-history-name">
            <span className="panel-icon-tile"><Icon name="receipt" size={20} /></span>
            <div><strong>{item.original_filename}</strong><small>{item.formato ? FORMATOS[item.formato] ?? item.formato : "Arquivo importado"} · {sentFormat.format(new Date(item.created_at))}</small></div>
          </div>
          <dl>
            <div><dt>Período</dt><dd>{item.periodo_inicio && item.periodo_fim ? `${formatDay(item.periodo_inicio)} a ${formatDay(item.periodo_fim)}` : "Indisponível"}</dd></div>
            <div><dt>Linhas</dt><dd>{item.linhas_validas} válidas, {item.linhas_rejeitadas} rejeitadas{item.linhas_duplicadas ? `, ${item.linhas_duplicadas} possíveis repetições` : ""}</dd></div>
            <div><dt>Qualidade</dt><dd>{item.percentual === null ? "Indisponível" : `${item.percentual.toLocaleString("pt-BR")}%`}</dd></div>
            <div><dt>Saídas</dt><dd>{money(item.total_saidas)}</dd></div>
          </dl>
          <div className="action-row">
            <a className="text-link" href={transactionLink({ arquivo: item.id })} aria-label={`Ver transações de ${item.original_filename}`}>Ver transações</a>
            <button className="text-button panel-danger" type="button" aria-label={`Remover ${item.original_filename}`} onClick={() => { setStatus(""); setRemoveError(""); setSelected(item); }}>Remover</button>
          </div>
        </li>)}
      </ul>}
    </section>
    {selected && <PanelDialog title="Remover arquivo" busy={removing} onClose={() => setSelected(null)}>
      <div className="panel-stack">
        <p>Ao remover <strong>{selected.original_filename}</strong>, as transações importadas deste arquivo também serão excluídas.</p>
        {removeError && <p className="pd-error" role="alert">{removeError}</p>}
        <div className="action-row">
          <button className="secondary-button" type="button" disabled={removing} onClick={() => setSelected(null)}>Cancelar</button>
          <button className="primary-button is-night" type="button" disabled={removing} onClick={() => void remove()}>{removing ? "Removendo…" : "Remover arquivo"}</button>
        </div>
      </div>
    </PanelDialog>}
  </div>;
}
