import { useEffect, useRef, useState, type FormEvent } from "react";
import { correctCategory, getTransactions, leaveIfSignedOut, listCategories, type CategoryItem, type TransactionItem, type TransactionPage } from "../../panel/api";
import { money } from "../../lib/format";
import CategoryMark from "./CategoryMark";
import Icon from "../Icon";

const types: Record<string, string> = { purchase: "Compra", fee: "Tarifa", refund: "Estorno", payment: "Pagamento", income: "Entrada", other: "Outra movimentação" };
const failureMessage = (error: unknown) => error instanceof Error ? error.message : "Não foi possível concluir. Tente de novo.";
const day = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");

export default function TransactionsSection() {
  const [query, setQuery] = useState(window.location.search);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [data, setData] = useState<TransactionPage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState<TransactionItem | null>(null);
  const params = new URLSearchParams(query);
  const activeFilters = [...params.entries()].filter(([key, value]) =>
    !["page", "page_size", "sort"].includes(key) && !(key === "eligibility" && value === "all"),
  );
  const filterLabels: Record<string, string> = { q: "Busca", month: "Mês", category_id: "Categoria", category: "Categoria", uncategorized: "Categoria", merchant: "Estabelecimento", date_from: "Desde", date_to: "Até", min_amount: "Mínimo", max_amount: "Máximo", transaction_type: "Natureza", eligibility: "Composição" };
  const eligibilityLabels: Record<string, string> = { included: "Incluídas no gasto", excluded: "Fora do gasto" };
  useEffect(() => {
    const restore = () => setQuery(window.location.search);
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    listCategories(controller.signal).then(setCategories).catch((failure) => {
      if (!controller.signal.aborted && !leaveIfSignedOut(failure)) setError(failureMessage(failure));
    });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    const controller = new AbortController();
    const filters = new URLSearchParams(query);
    // Older/category-name links are resolved explicitly before calling the API.
    if (filters.has("category")) {
      if (!categories.length) return;
      const selected = categories.find((item) => item.name === filters.get("category"));
      if (!selected) {
        setData(null);
        setBusy(false);
        setError("A categoria deste endereço não está disponível. Remova o filtro para consultar suas transações.");
        return;
      }
      filters.set("category_id", selected.id);
      filters.delete("category");
    }
    setBusy(true);
    setError("");
    setData(null);
    getTransactions(filters, controller.signal).then((result) => {
      if (!controller.signal.aborted) setData(result);
    }).catch((failure) => {
      if (!controller.signal.aborted && !leaveIfSignedOut(failure)) setError(failureMessage(failure));
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(false);
    });
    return () => controller.abort();
  }, [query, categories, attempt]);
  function navigate(next: URLSearchParams) {
    const search = next.size ? `?${next}` : "";
    window.history.pushState(null, "", `/app/transactions${search}`);
    setQuery(search);
    setEditing(null);
  }

  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    values.forEach((value, key) => {
      if (String(value).trim()) next.set(key, String(value).trim());
    });
    if (next.get("category_id") === "uncategorized") {
      next.delete("category_id");
      next.set("uncategorized", "true");
    }
    if (next.has("date_from") || next.has("date_to")) next.delete("month");
    navigate(next);
  }

  function paginate(page: number) {
    const next = new URLSearchParams(query);
    next.set("page", String(page));
    navigate(next);
  }

  return <div className="panel-page">
    <header className="panel-page-head">
      <h1>Transações</h1>
      <p className="lead">Encontre uma despesa e confira o que está por trás de cada total.</p>
    </header>
    <form className="gc-surface gc-filter-form" onSubmit={filter} key={`${query}/${categories.length}`}>
      <label className="gc-filter-search">Buscar estabelecimento ou descrição<input name="q" type="search" defaultValue={params.get("q") ?? ""} placeholder="Ex.: mercado, farmácia…" />
      </label>
      <label>Mês<input name="month" type="month" defaultValue={params.get("month")?.match(/^\d{4}-\d{2}$/)?.[0] ?? ""} />
      </label>
      <label>Categoria<select name="category_id" defaultValue={params.get("uncategorized") === "true" ? "uncategorized" : params.get("category_id") ?? categories.find((item) => item.name === params.get("category"))?.id ?? ""}>
        <option value="">Todas as categorias</option><option value="uncategorized">Sem categoria</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      </label>
      <label>Ordenar<select name="sort" defaultValue={params.get("sort") ?? "date_desc"}>
        <option value="date_desc">Mais recentes</option>
        <option value="date_asc">Mais antigas</option>
        <option value="amount_desc">Maior valor</option>
        <option value="amount_asc">Menor valor</option>
      </select>
      </label>
      <details className="gc-details gc-filter-more">
        <summary>Mais filtros <Icon name="search" size={17} />
        </summary>
        <div className="gc-filter-form">
          <label>Data inicial<input name="date_from" type="date" defaultValue={params.get("date_from") ?? ""} />
          </label>
          <label>Data final<input name="date_to" type="date" defaultValue={params.get("date_to") ?? ""} />
          </label>
          <label>Estabelecimento<input name="merchant" defaultValue={params.get("merchant") ?? ""} />
          </label>
          <label>Valor mínimo<input name="min_amount" type="number" min="0" step="0.01" defaultValue={params.get("min_amount") ?? ""} />
          </label>
          <label>Valor máximo<input name="max_amount" type="number" min="0" step="0.01" defaultValue={params.get("max_amount") ?? ""} />
          </label>
          <label>Natureza<select name="transaction_type" defaultValue={params.get("transaction_type") ?? ""}>
            <option value="">Todas</option>{Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </label>
          <label>Composição do gasto<select name="eligibility" defaultValue={params.get("eligibility") ?? "all"}>
            <option value="all">Todas as movimentações</option>
            <option value="included">Incluídas no gasto</option>
            <option value="excluded">Fora do gasto</option>
          </select>
          </label>
        </div>
        <p className="gc-footnote">Um intervalo de datas substitui o filtro de mês.</p>
      </details>
      <div className="gc-filter-actions">
        <button className="gc-button gc-button-primary" type="submit">Aplicar filtros</button>
        <button className="text-button" type="button" onClick={() => navigate(new URLSearchParams())}>Limpar filtros</button>
      </div>
    </form>
    {activeFilters.length ? <ul className="gc-active-filters" aria-label="Filtros aplicados">{activeFilters.map(([key, value]) => <li key={key}>
      <button onClick={() => {
        const next = new URLSearchParams(query);
        next.delete(key);
        next.delete("page");
        navigate(next);
      }} aria-label={`Remover filtro ${filterLabels[key] ?? key}`}>
        {filterLabels[key] ?? key}: {key === "uncategorized" ? "Sem categoria" : key === "category_id" ? categories.find((item) => item.id === value)?.name ?? "Categoria selecionada" : key === "transaction_type" ? types[value] : key === "eligibility" ? eligibilityLabels[value] ?? value : value}<span aria-hidden="true"> ×</span>
      </button>
    </li>)}</ul> : null}
    {error ? <p className="pd-error" role="alert">{error} <button className="text-button" onClick={() => setAttempt((value) => value + 1)}>Tentar de novo</button>
    </p> : null}
    <section className="gc-surface" aria-busy={busy} aria-labelledby="transactions-heading">
      <div className="gc-section-heading">
        <div>
          <h2 id="transactions-heading">{data ? `${data.total} movimentações encontradas` : "Carregando transações…"}</h2>
          <p>Os totais consideram todos os resultados do filtro, em todas as páginas.</p>
        </div>
      </div>
      {data ? <>
        <dl className="gc-statistics">
          <div>
            <dt>Gasto líquido</dt>
            <dd>{money(data.aggregates.net_spending)}</dd>
          </div>
          <div>
            <dt>Entradas</dt>
            <dd>{money(data.aggregates.income)}</dd>
          </div>
          <div>
            <dt>Pagamentos</dt>
            <dd>{money(data.aggregates.payments)}</dd>
          </div>
        </dl>
        {data.items.length ? <div className="pd-scroll" tabIndex={0} role="region" aria-label="Tabela de transações, role horizontalmente para conferir todas as colunas">
          <table className="pd-table gc-transactions-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Estabelecimento</th>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>{data.items.map((item) => <tr key={item.id}>
              <td>{day(item.date)}</td>
              <td>
                <strong>{item.merchant || item.description}</strong>
                <small>{types[item.transaction_type] ?? item.transaction_type}{item.is_duplicate ? " · duplicata excluída" : item.is_suspected_duplicate ? " · suspeita mantida no gasto" : ""}</small>
              </td>
              <td>
                <span className="gc-inline-category">
                  <CategoryMark name={item.category_name} compact />{item.category_name}</span>
              </td>
              <td>{money(item.amount)}</td>
              <td>
                <button className="text-button" onClick={() => setEditing(item)}>Conferir e categorizar</button>
              </td>
            </tr>)}</tbody>
          </table>
        </div> : <p className="pd-empty">Nenhuma transação neste recorte. Limpe os filtros ou envie outro arquivo.</p>}
        <div className="gc-pagination">
          <button className="gc-button" disabled={data.page <= 1 || busy} onClick={() => paginate(data.page - 1)}>Anterior</button>
          <span>Página {data.page} de {Math.max(1, Math.ceil(data.total / data.page_size))}</span>
          <button className="gc-button" disabled={data.page * data.page_size >= data.total || busy} onClick={() => paginate(data.page + 1)}>Próxima</button>
        </div>
      </> : null}
    </section>
    {editing ? <CategoryEditor key={editing.id} item={editing} categories={categories} onClose={() => setEditing(null)} onSaved={() => {
      setAttempt((value) => value + 1);
      window.dispatchEvent(new Event("gerencia:data-changed"));
    }} /> : null}
  </div>;
}

function CategoryEditor({ item, categories, onClose, onSaved }: { item: TransactionItem; categories: CategoryItem[]; onClose: () => void; onSaved: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [category, setCategory] = useState(item.category_id ?? "");
  const [saveRule, setSaveRule] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setSaved(false);
    try {
      await correctCategory(item.id, category, saveRule);
      setSaved(true);
      setMessage("Categoria atualizada. Os totais foram recalculados.");
      onSaved();
    }
    catch (failure) {
      if (!leaveIfSignedOut(failure)) setMessage(failureMessage(failure));
    }
    finally {
      setBusy(false);
    }
  }

  return <section className="gc-surface gc-editor" aria-labelledby="transaction-detail-heading">
    <div className="gc-section-heading">
      <div>
        <h2 id="transaction-detail-heading" ref={heading} tabIndex={-1}>{item.merchant || item.description}</h2>
        <p>{day(item.date)} · {money(item.amount)} · {types[item.transaction_type]}</p>
      </div>
      <button className="text-button" onClick={onClose}>Fechar</button>
    </div>
    <dl className="panel-facts">
      <div>
        <dt>Descrição original</dt>
        <dd>{item.description}</dd>
      </div>
      <div>
        <dt>Origem</dt>
        <dd>Arquivo {item.upload_id}, linha {item.source_row}{item.source_sheet ? `, planilha ${item.source_sheet}` : ""}. <a className="text-link" href={`/app/files?upload=${item.upload_id}`}>Conferir arquivo</a>
        </dd>
      </div>
      <div>
        <dt>Composição do gasto</dt>
        <dd>{money(item.contribution)}{item.is_duplicate ? " · duplicata confirmada, fora dos totais" : item.is_suspected_duplicate ? " · suspeita de repetição, mantida para conferência" : ""}</dd>
      </div>
    </dl>
    <form className="gc-edit-form" onSubmit={submit}>
      <label>Categoria<select value={category} onChange={(event) => setCategory(event.target.value)} required>
        <option value="" disabled>Escolher categoria</option>{categories.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select>
      </label>
      <label className="gc-checkbox">
        <input type="checkbox" checked={saveRule} onChange={(event) => setSaveRule(event.target.checked)} />Usar esta categoria em futuras importações deste estabelecimento</label>
      <p className="gc-footnote">A correção altera este lançamento. A regra opcional vale para novos arquivos; não muda silenciosamente o histórico.</p>
      <button className="gc-button gc-button-primary" disabled={busy || !category}>{busy ? "Salvando…" : "Salvar categoria"}</button>
    </form>
    {message ? <p className={saved ? "pd-success" : "pd-error"} role={saved ? "status" : "alert"}>{message}</p> : null}
  </section>;
}
