import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError } from "../../auth/api";
import { deleteUpload, leaveIfSignedOut, listUploads, money, sendFile, type UploadItem } from "../../panel/api";

const FORMATOS: Record<string, string> = {
  fatura_nubank: "Fatura Nubank",
  extrato_nubank: "Extrato Nubank",
  planilha_modelo: "Planilha-modelo",
};

const formatDay = (iso: string | null) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR") : "—");
const formatSent = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

/**
 * Página /app/files: envio de faturas e extratos e histórico de arquivos.
 *
 * O arquivo é lido no servidor com pandas; as transações e o relatório de
 * qualidade ficam gravados no banco, e o painel (/app) mostra a análise.
 */
export default function FilesSection() {
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<UploadItem | null>(null);
  const [uploads, setUploads] = useState<UploadItem[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const load = useCallback(async () => {
    try {
      setUploads(await listUploads());
      setLoadFailed(false);
    } catch (failure) {
      if (!leaveIfSignedOut(failure)) setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
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
      await load();
    } catch (failure) {
      if (leaveIfSignedOut(failure)) return;
      setError(failure instanceof ApiError ? failure.message : "Não foi possível enviar o arquivo.");
    } finally {
      setSending(false);
    }
  }

  async function remove(item: UploadItem) {
    const confirmed = window.confirm(`Remover "${item.original_filename}"? As transações dele saem do painel.`);
    if (!confirmed) return;
    setRemovingId(item.id);
    setError(null);
    try {
      await deleteUpload(item.id);
      if (lastSent?.id === item.id) setLastSent(null);
      await load();
    } catch (failure) {
      if (leaveIfSignedOut(failure)) return;
      setError(failure instanceof ApiError ? failure.message : "Não foi possível remover o arquivo.");
    } finally {
      setRemovingId(null);
    }
  }

  return <div className="panel-page">
    <header className="panel-page-head">
      <h1>Arquivos</h1>
      <p className="lead">Envie a fatura ou o extrato e acompanhe o que foi lido de cada arquivo.</p>
    </header>

    <section className="panel-card" aria-labelledby="upload-title">
      <h2 id="upload-title">Enviar um arquivo</h2>
      <p className="pd-hint">CSV ou XLSX, até 5 MB. Aceitamos fatura e extrato do Nubank e a planilha-modelo do gerenCIA (data, descrição e valor).</p>
      <form className="pd-upload" onSubmit={submit}>
        <label className="pd-file">
          <span>Arquivo</span>
          <input ref={input} type="file" accept=".csv,.xlsx" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(null); setLastSent(null); }} />
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
        <a className="text-link" href="/app">Ver a análise no painel</a>
      </div>}
    </section>

    <section className="panel-card" aria-labelledby="history-title">
      <h2 id="history-title">Histórico</h2>
      {loadFailed && <p className="pd-error" role="alert">Não foi possível carregar o histórico. <button className="text-button" type="button" onClick={() => void load()}>Tentar de novo</button></p>}
      {uploads === null && !loadFailed && <p className="pd-hint">Carregando…</p>}
      {uploads !== null && uploads.length === 0 && <p className="pd-empty">Nenhum arquivo enviado ainda.</p>}
      {uploads !== null && uploads.length > 0 && <div className="pd-scroll"><table className="pd-table">
        <caption className="sr-only">Arquivos enviados, do mais recente ao mais antigo</caption>
        <thead><tr>
          <th scope="col">Arquivo</th><th scope="col">Enviado em</th><th scope="col">Período</th>
          <th scope="col">Válidas</th><th scope="col">Rejeitadas</th><th scope="col">Qualidade</th><th scope="col">Saídas</th><th scope="col"><span className="sr-only">Ações</span></th>
        </tr></thead>
        <tbody>{uploads.map((item) => <tr key={item.id}>
          <td><strong>{item.original_filename}</strong><small>{item.formato ? FORMATOS[item.formato] ?? item.formato : ""}</small></td>
          <td>{formatSent(item.created_at)}</td>
          <td>{formatDay(item.periodo_inicio)} a {formatDay(item.periodo_fim)}</td>
          <td>{item.linhas_validas}</td>
          <td>{item.linhas_rejeitadas}</td>
          <td>{item.percentual === null ? "—" : `${item.percentual.toLocaleString("pt-BR")}%`}</td>
          <td>{money(item.total_saidas)}</td>
          <td><button className="text-button" type="button" disabled={removingId === item.id} onClick={() => void remove(item)}>{removingId === item.id ? "Removendo…" : "Remover"}</button></td>
        </tr>)}</tbody>
      </table></div>}
    </section>
  </div>;
}
