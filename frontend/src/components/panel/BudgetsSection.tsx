import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "../../auth/api";
import { leaveIfSignedOut, listBudgets, money, removeBudget, saveBudget, type BudgetCategory, type BudgetData } from "../../panel/api";
import { categoryColor } from "../../panel/categoryColor";
import Icon from "../Icon";
import BudgetUsage, { BudgetStatus } from "./BudgetUsage";
import { formatMonth, isPanelMonth } from "./formatDate";
import PanelDialog from "./PanelDialog";

export default function BudgetsSection({ onChanged }: { onChanged: () => void }) {
  const [month, setMonth] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get("mes") ?? "";
    return isPanelMonth(requested) ? requested : "";
  });
  const [data, setData] = useState<BudgetData | null>(null);
  const [selected, setSelected] = useState<{ item: BudgetCategory; month: string } | null>(null);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    listBudgets(month, controller.signal).then((result) => {
      if (!controller.signal.aborted) setData(result);
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted && !leaveIfSignedOut(failure)) setFailed(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [month, reload]);

  const chosenMonth = month || data?.current_month || "";
  const tracked = data?.categories.filter((item) => item.amount !== null) ?? [];
  const untracked = data?.categories.filter((item) => item.amount === null) ?? [];
  const closeToLimit = tracked.filter((item) => item.status === "near").length;
  const over = tracked.filter((item) => item.status === "over").length;

  function budgetChanged(text: string) {
    setSelected(null);
    setMessage(text);
    setReload((value) => value + 1);
    onChanged();
  }

  function chooseMonth(value: string) {
    if (!isPanelMonth(value)) return;
    setMonth(value);
    setMessage("");
    const url = new URL(window.location.href);
    url.searchParams.set("mes", value);
    window.history.replaceState(null, "", url);
  }

  function edit(item: BudgetCategory, budgetMonth: string) {
    setMessage("");
    setSelected({ item, month: budgetMonth });
  }

  return <div className="panel-page">
    <header className="panel-page-head panel-heading-row">
      <div><h1>Limites</h1><p className="lead">Planeje quanto gastar por categoria a cada mês.</p></div>
      <label className="panel-field panel-month">Mês de referência
        <input type="month" min="1000-01" max="9999-12" value={chosenMonth} onChange={(event) => chooseMonth(event.target.value)} />
      </label>
    </header>

    <p className="sr-only" role="status">{message}</p>
    {failed ? <section className="panel-card panel-stack" aria-label="Carregamento de limites">
      <p className="pd-error" role="alert">Não foi possível carregar os limites.</p>
      <button className="text-button" type="button" onClick={() => setReload((value) => value + 1)}>Tentar de novo</button>
    </section> : loading || data?.month !== chosenMonth ? <p className="panel-card" role="status">Carregando limites…</p> : data && <>
      <section className="budget-summary" aria-labelledby="budget-summary-title">
        <div>
          <p className="panel-period"><Icon name="calendar" size={17} /> {formatMonth(data.month)}</p>
          <h2 id="budget-summary-title">Visão do mês</h2>
          <p>Defina os valores para este mês. O sino avisa sobre os limites do mês atual.</p>
        </div>
        <dl>
          <div><dt>Limites ativos</dt><dd>{tracked.length}</dd></div>
          <div><dt>A partir de 80%</dt><dd>{closeToLimit}</dd></div>
          <div><dt>Ultrapassados</dt><dd>{over}</dd></div>
        </dl>
      </section>

      <section className="panel-stack" aria-labelledby="budget-list-title">
        <h2 className="panel-section-title" id="budget-list-title">Acompanhamento</h2>
        {tracked.length ? <ul className="budget-grid">
          {tracked.map((item) => <li className={`panel-card budget-card is-${item.status}`} key={item.id}>
            <div className="panel-heading-row"><h3 className="category-name"><i aria-hidden="true" className="category-dot" style={{ backgroundColor: categoryColor(item.name, item.color) }} />{item.name}</h3><BudgetStatus status={item.status} /></div>
            <BudgetUsage item={item} />
            <button className="text-button" type="button" aria-label={`Editar limite de ${item.name}`} onClick={() => edit(item, data.month)}>Editar limite</button>
          </li>)}
        </ul> : <div className="panel-card panel-empty">
          <span className="panel-icon-tile"><Icon name="target" /></span>
          <strong>Nenhum limite definido</strong>
          <p>Escolha uma categoria abaixo para definir seu primeiro limite.</p>
        </div>}
        <p className="pd-hint">O gasto do mês soma compras e tarifas e deduz estornos. Entradas, pagamentos de fatura e possíveis repetições ficam fora desse cálculo.</p>
      </section>

      {untracked.length > 0 && <section className="panel-card panel-stack" aria-labelledby="budget-untracked-title">
        <h2 id="budget-untracked-title">Categorias sem limite</h2>
        <ul className="budget-untracked">
          {untracked.map((item) => <li key={item.id}>
            <div><strong className="category-name"><i aria-hidden="true" className="category-dot" style={{ backgroundColor: categoryColor(item.name, item.color) }} />{item.name}</strong><span>{money(item.spent)} no mês</span></div>
            <button className="text-button" type="button" aria-label={`Definir limite de ${item.name}`} onClick={() => edit(item, data.month)}>Definir limite</button>
          </li>)}
        </ul>
      </section>}
    </>}
    {selected && <BudgetEditor item={selected.item} month={selected.month} onClose={() => setSelected(null)} onSaved={budgetChanged} />}
  </div>;
}

function BudgetEditor({ item, month, onClose, onSaved }: { item: BudgetCategory; month: string; onClose: () => void; onSaved: (message: string) => void }) {
  const [amount, setAmount] = useState(item.amount?.replace(".", ",") ?? "");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  async function update(remove = false) {
    if (busy) return;
    const raw = amount.trim();
    const input = /^\d{1,3}(\.\d{3}){1,3}(,\d{1,2})?$/.test(raw) ? raw.replaceAll(".", "") : raw;
    if (!remove && (!/^\d{1,12}([,.]\d{1,2})?$/.test(input) || Number(input.replace(",", ".")) <= 0)) {
      setError("Informe um valor maior que zero, com até duas casas decimais.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (remove) await removeBudget(item.id, month);
      else await saveBudget(item.id, input.replace(",", "."), month);
      onSaved(remove ? "Limite removido." : "Limite salvo.");
    } catch (failure) {
      if (!leaveIfSignedOut(failure)) setError(failure instanceof ApiError ? failure.message : "Não foi possível salvar a alteração.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void update();
  }

  return <PanelDialog title={`Limite de ${item.name}`} onClose={onClose} busy={busy}>
    {removing ? <div className="panel-stack">
      <p>Remover o limite de {item.name} em {formatMonth(month)}?</p>
      {error && <p className="pd-error" role="alert">{error}</p>}
      <div className="action-row">
        <button className="primary-button is-night" type="button" disabled={busy} onClick={() => void update(true)}>{busy ? "Removendo…" : "Confirmar remoção"}</button>
        <button className="secondary-button" type="button" disabled={busy} onClick={() => { setRemoving(false); setError(""); }}>Voltar</button>
      </div>
    </div> : <form className="panel-stack" onSubmit={submit}>
      <p className="pd-hint">Limite para {formatMonth(month)}.</p>
      <label className="panel-field">Valor do limite (R$)
        <input autoFocus inputMode="decimal" maxLength={18} required value={amount} disabled={busy} placeholder="0,00" onChange={(event) => setAmount(event.target.value)} />
      </label>
      {error && <p className="pd-error" role="alert">{error}</p>}
      <div className="action-row">
        <button className="primary-button is-night" type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar limite"}</button>
        <button className="secondary-button" type="button" disabled={busy} onClick={onClose}>Cancelar</button>
        {item.amount !== null && <button className="text-button panel-danger" type="button" disabled={busy} onClick={() => { setRemoving(true); setError(""); }}>Remover limite</button>}
      </div>
    </form>}
  </PanelDialog>;
}
