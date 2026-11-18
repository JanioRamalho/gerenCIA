import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "../../auth/api";
import { categoryColor } from "../../panel/categoryColor";
import {
  changeTransactionCategory, leaveIfSignedOut, listTransactionFilters, listTransactions, money, transactionTypes,
  type Transaction, type TransactionFilters, type TransactionPage,
} from "../../panel/api";
import Icon from "../Icon";
import { formatDay, formatMonth } from "./formatDate";
import PanelDialog from "./PanelDialog";

const filterDefaults = { q: "", mes: "", categoria: "", tipo: "", minimo: "", maximo: "", ordem: "recent", arquivo: "" };
type Filters = typeof filterDefaults;

function initialFilters(): Filters {
  const url = new URLSearchParams(window.location.search);
  const month = url.get("mes") ?? "";
  const file = url.get("arquivo") ?? "";
  return {
    ...filterDefaults,
    mes: /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month) ? month : "",
    categoria: url.get("categoria")?.slice(0, 160) ?? "",
    arquivo: /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(file) ? file : "",
  };
}

export default function TransactionsSection({ onChanged }: { onChanged: () => void }) {
  const [draft, setDraft] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);
  const [options, setOptions] = useState<TransactionFilters | null>(null);
  const [result, setResult] = useState<TransactionPage | null>(null);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [optionsError, setOptionsError] = useState(false);
  const [rangeError, setRangeError] = useState(false);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [saved, setSaved] = useState(false);
  const categories = Array.from(new Set(options?.categories.map((item) => item.name) ?? []));
  const hasFilters = Object.entries(applied).some(([key, value]) => value !== filterDefaults[key as keyof Filters]);

  useEffect(() => {
    const controller = new AbortController();
    listTransactionFilters(controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      setOptions(data);
      setOptionsError(false);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted && !leaveIfSignedOut(error)) setOptionsError(true);
    });
    return () => controller.abort();
  }, [reload]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ pagina: String(page) });
    for (const [key, value] of Object.entries(applied)) {
      if (value.trim()) params.set(key, value.trim());
    }
    setLoadError(false);
    setLoading(true);
    listTransactions(params, controller.signal).then((data) => {
      if (!controller.signal.aborted) setResult(data);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted && !leaveIfSignedOut(error)) setLoadError(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [applied, page, reload]);

  function field(key: keyof Filters, value: string) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setRangeError(false);
  }

  function apply(event: FormEvent) {
    event.preventDefault();
    if (draft.minimo && draft.maximo && Number(draft.minimo) > Number(draft.maximo)) {
      setRangeError(true);
      return;
    }
    setPage(1);
    setApplied({ ...draft });
  }

  function clear() {
    setPage(1);
    setDraft(filterDefaults);
    setApplied(filterDefaults);
    setRangeError(false);
    if (window.location.search) window.history.replaceState(null, "", "/app/transactions");
  }

  function categorySaved() {
    setSelected(null);
    setSaved(true);
    setReload((value) => value + 1);
    onChanged();
  }

  return <div className="panel-page">
    <header className="panel-page-head panel-heading-row">
      <div><h1>Transações</h1><p className="lead">Consulte e revise os lançamentos dos seus arquivos.</p></div>
      <a className="secondary-button" href="/app/files"><Icon name="files" size={18} /> Ver arquivos</a>
    </header>

    <section className="panel-card panel-stack" aria-labelledby="transaction-filters-title">
      <h2 id="transaction-filters-title">Filtrar transações</h2>
      <form className="panel-stack" onSubmit={apply}>
        <div className="transaction-filters">
          <label className="panel-field is-search">Buscar lançamento
            <span><Icon name="search" size={18} /><input type="search" value={draft.q} maxLength={120} placeholder="Descrição ou estabelecimento" onChange={(event) => field("q", event.target.value)} /></span>
          </label>
          <label className="panel-field">Mês
            <select value={draft.mes} onChange={(event) => field("mes", event.target.value)}>
              <option value="">Todos os meses</option>
              {draft.mes && !options?.months.includes(draft.mes) && <option value={draft.mes}>{formatMonth(draft.mes)}</option>}
              {options?.months.map((month) => <option key={month} value={month}>{formatMonth(month)}</option>)}
            </select>
          </label>
          <label className="panel-field">Categoria
            <select value={draft.categoria} onChange={(event) => field("categoria", event.target.value)}>
              <option value="">Todas</option>
              {draft.categoria && !categories.includes(draft.categoria) && <option>{draft.categoria}</option>}
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="panel-field">Tipo
            <select value={draft.tipo} onChange={(event) => field("tipo", event.target.value)}>
              <option value="">Todos os tipos</option>
              {Object.entries(transactionTypes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
        </div>
        <details className="transaction-advanced">
          <summary>Valor e ordenação</summary>
          <div className="transaction-filters is-secondary">
            <label className="panel-field">Valor mínimo (R$)
              <input type="number" min="0" max="999999999999.99" step="0.01" value={draft.minimo} onChange={(event) => field("minimo", event.target.value)} />
            </label>
            <label className="panel-field">Valor máximo (R$)
              <input type="number" min="0" max="999999999999.99" step="0.01" value={draft.maximo} onChange={(event) => field("maximo", event.target.value)} />
            </label>
            <label className="panel-field">Ordenar por
              <select value={draft.ordem} onChange={(event) => field("ordem", event.target.value)}>
                <option value="recent">Mais recentes</option><option value="oldest">Mais antigas</option>
                <option value="highest">Maior valor</option><option value="lowest">Menor valor</option>
              </select>
            </label>
          </div>
        </details>
        {draft.arquivo && <p className="panel-inline-status">Mostrando lançamentos do arquivo selecionado no histórico.</p>}
        {rangeError && <p className="pd-error" role="alert">O valor máximo deve ser maior ou igual ao mínimo.</p>}
        {optionsError && <p className="pd-error" role="alert">Não foi possível carregar os meses e as categorias. <button className="text-button" type="button" onClick={() => setReload((value) => value + 1)}>Tentar de novo</button></p>}
        <div className="action-row">
          <button className="primary-button is-night" type="submit">Aplicar filtros</button>
          <button className="text-button" type="button" onClick={clear}>Limpar filtros</button>
        </div>
      </form>
    </section>

    <section className="panel-card panel-stack" aria-labelledby="transaction-list-title">
      <div className="panel-heading-row">
        <h2 id="transaction-list-title">Lançamentos</h2>
        <p className="panel-inline-status" role="status">{loading ? "Carregando lançamentos…" : !loadError && result ? `${result.total} ${result.total === 1 ? "transação" : "transações"}` : ""}</p>
      </div>
      <p className="sr-only" role="status">{saved ? "Categoria atualizada." : ""}</p>
      {loadError ? <p className="pd-error" role="alert">Não foi possível carregar as transações. <button className="text-button" type="button" onClick={() => setReload((value) => value + 1)}>Tentar de novo</button></p>
        : !loading && result?.total === 0 ? <div className="panel-empty">
          <span className="panel-icon-tile"><Icon name="receipt" /></span>
          <strong>{hasFilters ? "Nenhuma transação com esses filtros" : "Nenhuma transação importada"}</strong>
          {hasFilters ? <button className="text-button" type="button" onClick={clear}>Limpar filtros</button>
            : <a className="text-link" href="/app/files">Enviar um arquivo</a>}
        </div> : result && <div className="transaction-results" aria-busy={loading}>
          <div className="transaction-row transaction-labels" aria-hidden="true"><span>Lançamento</span><span>Data</span><span>Categoria</span><span>Valor</span></div>
          <ul>
            {result.items.map((item) => <li className="transaction-row" key={item.id}>
              <div className="transaction-name">
                <button className="transaction-link" type="button" onClick={() => { setSaved(false); setSelected(item); }}>{item.merchant}</button>
                <small>{transactionTypes[item.type]}{item.installment ? ` · Parcela ${item.installment}` : ""}</small>
                {item.duplicate && <small className="transaction-duplicate">Possível repetição</small>}
              </div>
              <time dateTime={item.date}>{formatDay(item.date)}</time>
              <span className="transaction-category"><i aria-hidden="true" style={{ backgroundColor: categoryColor(item.category, item.category_color) }} />{item.category}</span>
              <strong className="transaction-amount">{money(item.amount)}</strong>
            </li>)}
          </ul>
          {result.pages > 1 && <div className="transaction-pagination">
            <button className="secondary-button" type="button" disabled={loading || result.page === 1} onClick={() => setPage(result.page - 1)}>Anterior</button>
            <span>Página {result.page} de {result.pages}</span>
            <button className="secondary-button" type="button" disabled={loading || result.page === result.pages} onClick={() => setPage(result.page + 1)}>Próxima</button>
          </div>}
        </div>}
    </section>

    {selected && <TransactionDetails item={selected} categories={options?.categories ?? []} onClose={() => setSelected(null)} onSaved={categorySaved} />}
  </div>;
}

function TransactionDetails({ item, categories, onClose, onSaved }: {
  item: Transaction;
  categories: TransactionFilters["categories"];
  onClose: () => void;
  onSaved: () => void;
}) {
  const activeCategories = categories.filter((value) => value.active);
  const [category, setCategory] = useState(() => activeCategories.some((value) => value.id === item.category_id) ? item.category_id ?? "" : "");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || !category) return;
    setBusy(true);
    setError("");
    try {
      await changeTransactionCategory(item.id, category, remember);
      onSaved();
    } catch (failure) {
      if (!leaveIfSignedOut(failure)) setError(failure instanceof ApiError ? failure.message : "Não foi possível salvar a categoria.");
    } finally {
      setBusy(false);
    }
  }

  return <PanelDialog title={item.merchant} onClose={onClose} busy={busy}>
    <dl className="panel-facts is-wide">
      <div><dt>Valor</dt><dd>{money(item.amount)}</dd></div>
      <div><dt>Data</dt><dd>{formatDay(item.date)}</dd></div>
      <div><dt>Tipo</dt><dd>{transactionTypes[item.type]}</dd></div>
      <div><dt>Descrição original</dt><dd>{item.description}</dd></div>
      <div><dt>Arquivo de origem</dt><dd>{item.file}</dd></div>
      {item.installment && <div><dt>Parcela</dt><dd>{item.installment}</dd></div>}
      {item.duplicate && <div><dt>Importação</dt><dd>Possível repetição</dd></div>}
    </dl>
    <form className="panel-stack" onSubmit={save}>
      <label className="panel-field">Categoria
        <select required value={category} disabled={busy || !activeCategories.length} onChange={(event) => setCategory(event.target.value)}>
          <option value="">{item.category} (atual)</option>
          {activeCategories.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}
        </select>
      </label>
      {item.can_remember_merchant && <label className="panel-checkbox"><input type="checkbox" checked={remember} disabled={busy} onChange={(event) => setRemember(event.target.checked)} /> Usar esta categoria em futuros lançamentos deste estabelecimento</label>}
      {error && <p className="pd-error" role="alert">{error}</p>}
      <div className="action-row">
        <button className="primary-button is-night" type="submit" disabled={busy || !category || (category === item.category_id && !remember)}>{busy ? "Salvando…" : "Salvar categoria"}</button>
        <button className="secondary-button" type="button" disabled={busy} onClick={onClose}>Fechar</button>
      </div>
    </form>
  </PanelDialog>;
}
