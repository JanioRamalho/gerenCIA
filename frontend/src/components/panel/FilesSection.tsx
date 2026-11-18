import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError } from "../../auth/api";
import { deleteUpload, getUploadDetail, leaveIfSignedOut, listUploads, money, sendFile, type UploadDetail, type UploadItem } from "../../panel/api";
import Icon from "../Icon";
import "../../styles/panel-tasks.css";

const FORMATOS: Record<string, string> = {
  fatura_nubank: "Fatura Nubank",
  extrato_nubank: "Extrato Nubank",
  planilha_modelo: "Planilha-modelo",
};
const qualityNames: Record<string, string> = {
  completude: "Completude", validade: "Validade", unicidade: "Unicidade", consistencia: "Consistência",
};
const qualityReason = (reason: string | null) => reason === "saldo_ou_ordem_insuficiente"
  ? "O arquivo não contém saldos suficientes ou a sequência necessária para esta verificação."
  : reason;

const formatDay = (iso: string | null) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR") : "—");
const formatSent = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");
const displayTotal = (value: string | number | null | undefined) => value == null ? "Indisponível" : money(value);

/**
 * Página /app/files: envio de faturas e extratos e histórico de arquivos.
 *
 * O arquivo é lido no servidor com pandas; as transações e o relatório de
 * qualidade ficam gravados no banco, e o painel (/app) mostra a análise.
 */
export default function FilesSection() {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<UploadItem | null>(null);
  const [uploads, setUploads] = useState<UploadItem[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoval, setConfirmRemoval] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(() => new URLSearchParams(window.location.search).get("upload"));
  const [detail, setDetail] = useState<UploadDetail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [detailAttempt, setDetailAttempt] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
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

  useEffect(() => {
    if (detail) detailHeading.current?.focus();
  }, [detail]);
  useEffect(() => {
    if (!selected) {
      setDetail(null);
      return;
    }
    const controller = new AbortController();
    setDetail(null);
    setDetailError("");
    getUploadDetail(selected, controller.signal).then((result) => {
      if (!controller.signal.aborted) setDetail(result);
    }).catch((failure) => {
      if (!controller.signal.aborted && !leaveIfSignedOut(failure)) setDetailError(failure instanceof Error ? failure.message : "Não foi possível consultar a qualidade.");
    });
    return () => controller.abort();
  }, [selected, detailAttempt]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || sending) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("O arquivo deve ter no máximo 4 MB. Escolha um arquivo menor.");
      return;
    }
    setSending(true);
    setError(null);
    setLastSent(null);
    try {
      setLastSent(await sendFile(file, documentType || undefined));
      setFile(null);
      if (input.current) input.current.value = "";
      await load();
      window.dispatchEvent(new Event("gerencia:data-changed"));
    } catch (failure) {
      if (leaveIfSignedOut(failure)) return;
      setError(failure instanceof ApiError ? failure.message : "Não foi possível enviar o arquivo.");
    } finally {
      setSending(false);
    }
  }

  async function remove(item: UploadItem) {
    setRemovingId(item.id);
    setError(null);
    try {
      await deleteUpload(item.id);
      if (lastSent?.id === item.id) setLastSent(null);
      if (selected === item.id) setSelected(null);
      setConfirmRemoval(null);
      await load();
      window.dispatchEvent(new Event("gerencia:data-changed"));
    } catch (failure) {
      if (leaveIfSignedOut(failure)) return;
      setError(failure instanceof ApiError ? failure.message : "Não foi possível remover o arquivo.");
    } finally {
      setRemovingId(null);
    }
  }

  return <div className="panel-page gc-task-page gc-files-page">
    <header className="panel-page-head">
      <h1>Arquivos</h1>
      <p className="lead">Envie a fatura ou o extrato e acompanhe o que foi lido de cada arquivo.</p>
    </header>

    <section className="panel-card" aria-labelledby="upload-title">
      <h2 id="upload-title">Enviar um arquivo</h2>
      <p className="pd-hint">CSV ou XLSX, até 4 MB. Fatura e extrato do Nubank são reconhecidos automaticamente; a planilha-modelo requer o tipo do documento.</p>
      <form className="pd-upload" onSubmit={submit}>
        <label className="pd-file">
          <span>Arquivo</span>
          <input ref={input} type="file" accept=".csv,.xlsx" onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setError(null);
            setLastSent(null);
          }} />
        </label>
        <label className="pd-file">Tipo do documento<select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
          <option value="">Reconhecer Nubank automaticamente</option>
          <option value="extrato">Extrato bancário / modelo de extrato</option>
          <option value="fatura">Fatura de cartão / modelo de fatura</option>
        </select>
        </label>
        <button className="primary-button is-night" type="submit" disabled={!file || sending}>{sending ? "Enviando…" : "Enviar arquivo"}</button>
      </form>
      <p className="gc-footnote">Use os exemplos fictícios para experimentar. Ao enviar dados reais, suas transações ficam guardadas no servidor até a exclusão do arquivo ou da conta. O arquivo original é descartado.</p>
      <div className="sr-only" role="status" aria-live="polite">{sending ? "Enviando e lendo o arquivo…" : ""}</div>
      {error && <p className="pd-error" role="alert" tabIndex={-1} ref={errorRef}>{error}</p>}

      {lastSent && <div className="pd-success" role="status">
        <strong>{lastSent.reused ? "Este arquivo já havia sido enviado. O registro existente foi preservado." : "Arquivo lido e gravado."}</strong>
        <p>
          {lastSent.linhas_validas} transações válidas, {lastSent.linhas_rejeitadas} rejeitadas
          {lastSent.linhas_duplicadas > 0 ? `, ${lastSent.linhas_duplicadas} repetições sinalizadas` : ""}.{" "}
          {lastSent.percentual == null ? "Qualidade indisponível." : `Qualidade de ${lastSent.percentual.toLocaleString("pt-BR")}%.`} Saídas: {displayTotal(lastSent.total_saidas)}. Entradas: {displayTotal(lastSent.total_entradas)}.
        </p>
        <a className="text-link" href="/app">Ver a análise no painel</a>
      </div>}
    </section>

    <section className="panel-card" aria-labelledby="history-title">
      <h2 id="history-title">Histórico</h2>
      {loadFailed && <p className="pd-error" role="alert">Não foi possível carregar o histórico. <button className="text-button" type="button" onClick={() => void load()}>Tentar de novo</button>
      </p>}
      {uploads === null && !loadFailed && <p className="pd-hint">Carregando…</p>}
      {uploads !== null && uploads.length === 0 && <p className="pd-empty">Nenhum arquivo enviado ainda.</p>}
      {uploads !== null && uploads.length > 0 && <div className="pd-scroll">
        <table className="pd-table gc-upload-history">
          <caption className="sr-only">Arquivos enviados, do mais recente ao mais antigo</caption>
          <thead>
            <tr>
              <th scope="col">Arquivo</th>
              <th scope="col">Enviado em</th>
              <th scope="col">Período</th>
              <th scope="col">Válidas</th>
              <th scope="col">Rejeitadas</th>
              <th scope="col">Qualidade</th>
              <th scope="col">Saídas</th>
              <th scope="col">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>{uploads.map((item) => <tr key={item.id}>
            <td className="gc-upload-name">
              <button className="text-button" onClick={() => {
                setSelected(item.id);
                window.history.replaceState(null, "", `/app/files?upload=${item.id}`);
              }}>{item.original_filename}</button>
              <small>{item.formato ? FORMATOS[item.formato] ?? item.formato : ""}</small>
            </td>
            <td className="gc-upload-sent" data-label="Enviado em">{formatSent(item.created_at)}</td>
            <td className="gc-upload-period" data-label="Período">{formatDay(item.periodo_inicio)} a {formatDay(item.periodo_fim)}</td>
            <td className="gc-upload-valid" data-label="Válidas">{item.linhas_validas}</td>
            <td className="gc-upload-rejected" data-label="Rejeitadas">{item.linhas_rejeitadas}</td>
            <td className="gc-upload-quality" data-label="Qualidade">{item.percentual === null ? "—" : `${item.percentual.toLocaleString("pt-BR")}%`}</td>
            <td className="gc-upload-total" data-label="Saídas">{displayTotal(item.total_saidas)}</td>
            <td className="gc-upload-actions">{confirmRemoval === item.id ? <div className="gc-inline-confirm">
              <p>Remover este arquivo e suas transações? As análises serão atualizadas.</p>
              <button className="text-button" disabled={removingId === item.id} onClick={() => void remove(item)}>{removingId === item.id ? "Removendo…" : "Confirmar exclusão"}</button>
              <button className="text-button" onClick={() => setConfirmRemoval(null)}>Cancelar</button>
            </div> : <button className="text-button" type="button" onClick={() => setConfirmRemoval(item.id)}>Remover</button>}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </section>
    {selected ? <section className="gc-surface" aria-labelledby="quality-heading">
      <div className="gc-section-heading">
        <div>
          <h2 id="quality-heading" ref={detailHeading} tabIndex={-1}>Qualidade da importação</h2>
          <p>{detail?.arquivo.original_filename ?? (detailError ? "Não foi possível consultar o arquivo." : "Consultando o arquivo…")}</p>
        </div>
        <button className="text-button" onClick={() => {
          setSelected(null);
          window.history.replaceState(null, "", "/app/files");
        }}>Fechar</button>
      </div>
      {detailError ? <p className="pd-error" role="alert">{detailError} <button className="text-button" onClick={() => setDetailAttempt((value) => value + 1)}>Tentar de novo</button>
      </p> : null}
      {detail ? <>
        <p className="gc-footnote">Registro da qualidade no momento do envio. Correções posteriores de categoria não alteram este relatório.</p>
        <dl className="gc-statistics">{Object.entries(detail.dimensoes ?? {}).map(([name, dimension]) => <div key={name}>
          <dt>{qualityNames[name] ?? name}</dt>
          <dd>{dimension.percentual == null ? "Indisponível" : `${dimension.percentual.toLocaleString("pt-BR")}%`}
            <span className="gc-quality-context gc-footnote">{name === "unicidade" ? `${dimension.quantidade} duplicadas em ${dimension.total} linhas` : `${dimension.quantidade} de ${dimension.total}`}{dimension.motivo ? ` · ${qualityReason(dimension.motivo)}` : ""}{dimension.suspeitas ? ` · ${dimension.suspeitas} suspeitas` : ""}</span>
          </dd>
        </div>)}</dl>{!detail.dimensoes ? <p className="pd-empty">Este registro histórico não possui as quatro dimensões detalhadas.</p> : null}<h3 className="gc-detail-title">Linhas rejeitadas ({detail.rejeitadas.length})</h3>{detail.rejeitadas.length ? <>
          <a className="text-link" href={`/api/uploads/${selected}/rejections.csv`} download>Baixar rejeições em CSV</a>
          <div className="pd-scroll">
            <table className="pd-table">
              <thead>
                <tr>
                  <th>Linha de origem</th>
                  <th>Motivo</th>
                  <th>Conteúdo</th>
                </tr>
              </thead>
              <tbody>{detail.rejeitadas.map((row, index) => <tr key={`${row.linha}-${index}`}>
                <td>{row.linha}</td>
                <td>{row.mensagem}<small>{row.codigo}</small>
                </td>
                <td>
                  <code>{JSON.stringify(row.conteudo)}</code>
                </td>
              </tr>)}</tbody>
            </table>
          </div>
        </> : <p className="pd-empty">Nenhuma linha rejeitada neste arquivo.</p>}</> : null}
    </section> : null}
    <details className="gc-details gc-file-examples">
      <summary>Experimentar com arquivos de exemplo <Icon name="arrow" size={18} /></summary>
      <p className="pd-hint">Dados fictícios para conhecer o painel. Escolha uma versão CSV ou XLSX e envie o arquivo acima.</p>
      <div className="gc-download-grid">{[
        ["modelo-vazio", "Planilha-modelo", "Colunas fixas para outro banco. Escolha Extrato ou Fatura no envio. Negativo é saída; positivo é entrada."],
        ["exemplo-extrato-3-meses", "Extrato de exemplo", "Nubank fictício de setembro a novembro, com receitas e despesas."],
        ["exemplo-fatura-3-meses", "Fatura de exemplo", "Nubank fictício de setembro a novembro, com assinaturas e estornos."],
        ["exemplo-comparacao-com-lacuna", "Comparação com intervalo", "Agosto e outubro sem setembro. Use em uma conta separada dos outros exemplos e escolha Extrato."],
      ].map(([fileName, title, text]) => <article key={fileName}>
        <h3>{title}</h3><p>{text}</p>
        <div className="gc-filter-actions">
          <a className="text-link" href={`/exemplos/${fileName}.csv`} download>Baixar CSV</a>
          <a className="text-link" href={`/exemplos/${fileName}.xlsx`} download>Baixar XLSX</a>
        </div>
      </article>)}</div>
    </details>
  </div>;
}
