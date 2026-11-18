import { money, percent, type BudgetCategory } from "../../panel/api";

export function BudgetStatus({ status }: { status: BudgetCategory["status"] }) {
  const labels = { ok: "Dentro do limite", near: "A partir de 80%", over: "Limite ultrapassado", unset: "Sem limite" };
  return <span className={`budget-status is-${status}`}>{labels[status]}</span>;
}

export default function BudgetUsage({ item }: { item: BudgetCategory }) {
  if (item.amount === null || item.used === null || item.remaining === null) return null;
  const used = percent(item.used, 1);
  const remaining = Number(item.remaining);
  return <div className={`budget-usage is-${item.status}`}>
    <p className="budget-amount"><strong>{money(item.spent)}</strong> <span>de {money(item.amount)}</span></p>
    <div className="budget-meter" role="meter" aria-label={`Uso do limite de ${item.name}`}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.max(0, Math.min(1, item.used)) * 1000) / 10}
      aria-valuetext={`${used} usado`}>
      <span aria-hidden="true" style={{ width: `${Math.max(0, Math.min(1, item.used)) * 100}%` }} />
    </div>
    <p className="budget-caption">
      <span>{used} usado</span>
      <span>{remaining < 0 ? `${money(-remaining)} acima do limite` : `${money(remaining)} restante`}</span>
    </p>
  </div>;
}
