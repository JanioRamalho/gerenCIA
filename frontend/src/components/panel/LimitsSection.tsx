import { useEffect, useState, type FormEvent } from "react";
import { getBudgets, leaveIfSignedOut, removeBudget, saveBudget, type BudgetData, type BudgetItem } from "../../panel/api";
import { money, percent } from "../../lib/format";
import CategoryMark from "./CategoryMark";
import { currentMonth, monthLabel } from "./formatDate";
import { categoryPresentation } from "../../panel/categoryPresentation";

export default function LimitsSection() {
  const [month, setMonth] = useState(() => new URLSearchParams(window.location.search).get("month") ?? currentMonth());
  const [data, setData] = useState<BudgetData | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError("");
    setData(null);
    getBudgets(month, controller.signal).then((result) => {
      if (!controller.signal.aborted) setData(result);
    })
      .catch((failure) => {
        if (!controller.signal.aborted && !leaveIfSignedOut(failure)) setError(failure instanceof Error ? failure.message : "Não foi possível abrir os limites.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [month, attempt]);
  function changeMonth(value: string) {
    if (!value) return;
    setMonth(value);
    window.history.replaceState(null, "", `/app/budgets?month=${value}`);
  }

  return <div className="panel-page" aria-busy={busy}>
    <header className="panel-page-head">
      <h1>Limites que fazem sentido para você</h1>
      <p className="lead">Defina um teto mensal por categoria. O aviso chega aos 80% e quando o gasto passa de 100%.</p>
    </header>
    <div className="gc-period-bar">
      <label>Mês consultado<input type="month" value={month} onChange={(event) => changeMonth(event.target.value)} />
      </label>
      <p>Configurações mensais, sem obrigação de definir todas.</p>
    </div>
    {error ? <p className="pd-error" role="alert">{error} <button className="text-button" onClick={() => setAttempt((value) => value + 1)}>Tentar de novo</button>
    </p> : null}
    {data && !data.coverage_available ? <p className="pd-empty">Não há dados importados em {monthLabel(month)}. Isso não comprova gasto zero. Você pode configurar limites e enviar arquivos para acompanhar o uso.</p> : null}
    <div className="gc-budget-grid">{data?.items.map((item) => <BudgetCard key={`${item.category_id}-${attempt}`} item={item} hasCoverage={data.coverage_available} onSaved={() => {
      setAttempt((value) => value + 1);
      window.dispatchEvent(new Event("gerencia:data-changed"));
    }} />)}</div>
    {!data && !error ? <p role="status">Carregando limites…</p> : null}
    <p className="gc-data-note">O mesmo limite configurado é usado ao consultar outros meses. Avisos novos são gerados somente para o mês corrente; os anteriores permanecem como histórico.</p>
  </div>;
}

function BudgetCard({ item, hasCoverage, onSaved }: { item: BudgetItem; hasCoverage: boolean; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(item.amount ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const presentation = categoryPresentation(item.category_name);
  const ratio = item.used_percentage;
  const exceeded = ratio != null && ratio > 1;
  async function mutate(remove: boolean) {
    setBusy(true);
    setError("");
    try {
      if (remove) await removeBudget(item.category_id); else await saveBudget(item.category_id, amount);
      setEditing(false);
      setConfirmRemoval(false);
      onSaved();
    } catch (failure) {
      if (!leaveIfSignedOut(failure)) setError(failure instanceof Error ? failure.message : "Não foi possível salvar o limite.");
    }
    finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void mutate(false);
  }

  return <section className={`gc-surface gc-budget-card${exceeded ? " is-exceeded" : ""}`}>
    <div className="gc-section-heading">
      <div className="gc-inline-category">
        <CategoryMark name={item.category_name} />
        <h2>{item.category_name}</h2>
      </div>
      <span className="gc-small-tag">{exceeded ? "Acima do limite" : item.amount ? "Limite ativo" : "Sem limite"}</span>
    </div>
    <p className="gc-budget-spent">{hasCoverage ? money(item.spent) : "Sem dados"}<span>{item.amount ? ` de ${money(item.amount)}` : " no mês consultado"}</span>
    </p>
    {item.amount && hasCoverage ? <>
      <div className="gc-budget-track" role="img" aria-label={`${ratio == null ? "Uso indisponível" : percent(ratio)} do limite utilizado`}>
        <span style={{ width: `${Math.min(100, Math.max(0, (ratio ?? 0) * 100))}%`, background: presentation.color }} />
      </div>
      <div className="gc-budget-status">
        <strong>{ratio == null ? "—" : percent(ratio)} utilizado</strong>
        <span>{item.remaining == null ? "Restante indisponível" : `${money(item.remaining)} restante`}</span>
      </div>
    </> : null}
    {editing ? <form className="gc-edit-form" onSubmit={submit}>
      <label>Limite mensal em reais<input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} min="0.01" step="0.01" required autoFocus />
      </label>
      <div className="gc-filter-actions">
        <button className="gc-button gc-button-primary" disabled={busy}>{busy ? "Salvando…" : "Salvar limite"}</button>
        <button className="text-button" type="button" onClick={() => {
          setEditing(false);
          setAmount(item.amount ?? "");
        }}>Cancelar</button>
      </div>
    </form> : <div className="gc-filter-actions">
      <button className="text-button" onClick={() => setEditing(true)}>{item.amount ? "Alterar limite" : "Definir limite"}</button>{item.amount ? <button className="text-button" onClick={() => setConfirmRemoval(true)}>Remover</button> : null}</div>}
    {confirmRemoval ? <div className="gc-inline-confirm">
      <p>Remover o limite de {item.category_name}? Os avisos anteriores permanecem no histórico.</p>
      <div className="gc-filter-actions">
        <button className="gc-button" disabled={busy} onClick={() => void mutate(true)}>Confirmar remoção</button>
        <button className="text-button" onClick={() => setConfirmRemoval(false)}>Cancelar</button>
      </div>
    </div> : null}
    {error ? <p className="pd-error" role="alert">{error}</p> : null}
  </section>;
}
