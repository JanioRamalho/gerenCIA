import { useState } from "react";
import { money, percent, type MonthlySpending } from "../../panel/api";
import Icon from "../Icon";
import { formatMonth } from "./formatDate";

type Props = {
  months: MonthlySpending[];
  selected: string | null;
  onSelect: (month: string) => void;
};

type Orientation = "horizontal" | "vertical";

export default function MonthlySpendingChart({ months, selected, onSelect }: Props) {
  const [pair, setPair] = useState<[string, string] | null>(null);
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const first = months.find((item) => item.mes === pair?.[0]);
  const second = months.find((item) => item.mes === pair?.[1]);
  const comparing = Boolean(first && second);
  const shown = months.slice(-6);
  const selectedMonth = months.find((item) => item.mes === selected);
  if (selectedMonth && !shown.includes(selectedMonth)) shown.unshift(selectedMonth);

  function openComparison() {
    const target = selectedMonth ?? months.at(-1);
    const index = target ? months.indexOf(target) : -1;
    const base = index > 0 ? months[index - 1] : months[1];
    if (base && target) setPair([base.mes, target.mes]);
  }

  return <section className="panel-card panel-stack" aria-labelledby="month-title">
    <div className="panel-heading-row">
      <h2 id="month-title">Saídas por mês</h2>
      {months.length > 1 && <button className="monthly-toggle" type="button" aria-expanded={comparing} aria-controls="month-comparison"
        onClick={() => comparing ? setPair(null) : openComparison()}>
        <Icon name="columns" size={17} />{comparing ? "Fechar comparação" : "Comparar meses"}
      </button>}
    </div>
    <div>
      <div className="segmented monthly-layout" role="group" aria-label="Orientação das barras">
        <button type="button" aria-pressed={orientation === "horizontal"} onClick={() => setOrientation("horizontal")}>
          <Icon name="rows" size={16} />Horizontais
        </button>
        <button type="button" aria-pressed={orientation === "vertical"} onClick={() => setOrientation("vertical")}>
          <Icon name="columns" size={16} />Verticais
        </button>
      </div>
    </div>
    <div id="month-comparison" hidden={!comparing}>
      {first && second && <Comparison first={first} second={second} months={months} orientation={orientation} onChange={setPair} />}
    </div>
    {!comparing && <>
      <MonthlyBars months={shown} orientation={orientation} selection={{ selected, onSelect }} />
      {months.length < 2 && <p className="pd-hint">Importe lançamentos de outro mês para comparar as saídas.</p>}
      {months.length > 6 && <p className="pd-hint">Veja os seis meses mais recentes. Em Comparar meses, você pode escolher qualquer mês com saídas.</p>}
    </>}
  </section>;
}

function Comparison({ first, second, months, orientation, onChange }: {
  first: MonthlySpending;
  second: MonthlySpending;
  months: MonthlySpending[];
  orientation: Orientation;
  onChange: (pair: [string, string]) => void;
}) {
  const baseCents = Math.round(first.total * 100);
  const difference = Math.round(second.total * 100) - baseCents;
  const relative = baseCents > 0 ? percent(Math.abs(difference / baseCents), 1) : null;
  const options = months.map((item) => <option key={item.mes} value={item.mes}>{formatMonth(item.mes)}</option>);

  return <div className="panel-stack">
    <div className="month-compare-fields">
      <label className="panel-field">Mês base
        <select value={first.mes} onChange={(event) => onChange([event.target.value, event.target.value === second.mes ? first.mes : second.mes])}>
          {options}
        </select>
      </label>
      <label className="panel-field">Comparar com
        <select value={second.mes} onChange={(event) => onChange([event.target.value === first.mes ? second.mes : first.mes, event.target.value])}>
          {options}
        </select>
      </label>
    </div>
    <MonthlyBars months={[first, second]} orientation={orientation} />
    <div className="month-difference" role="status">
      <span>Diferença em {formatMonth(second.mes)} em relação ao mês base</span>
      <strong>{difference === 0 ? "Mesmo total de saídas" : `${money(Math.abs(difference) / 100)} ${difference > 0 ? "a mais" : "a menos"}`}</strong>
      {difference !== 0 && relative && <span>{difference > 0 ? "+" : "−"}{relative}</span>}
    </div>
  </div>;
}

function MonthlyBars({ months, orientation, selection }: {
  months: MonthlySpending[];
  orientation: Orientation;
  selection?: { selected: string | null; onSelect: (month: string) => void };
}) {
  const scale = Math.max(1, ...months.map((item) => item.total));
  const vertical = orientation === "vertical";
  const rows = <ul className={`monthly-bars is-${orientation}`} aria-label={selection ? "Saídas importadas por mês" : "Comparação de saídas"}
    style={vertical ? { gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`, minWidth: `max(100%, ${months.length * 68}px)` } : undefined}>
    {months.map((item, index) => {
      const name = formatMonth(item.mes);
      const value = `${Math.max(0, item.total / scale) * 100}%`;
      const amount = money(item.total);
      const compactMonth = vertical && months.length > 2;
      const content = <>
        <span className="monthly-label">
          {compactMonth ? <><span className="sr-only">{name}</span><span aria-hidden="true">{item.rotulo.replace(/\/(\d{2})(\d{2})$/, "/$2")}</span></> : name}
        </span>
        <strong>{vertical ? amount.replace("\u00a0", " ") : amount}</strong>
        <span className="monthly-track" aria-hidden="true"><i style={vertical ? { height: value } : { width: value }} /></span>
      </>;
      return selection ? <li key={item.mes}>
        <button className="monthly-row" type="button" aria-pressed={selection.selected === item.mes} onClick={() => selection.onSelect(item.mes)}>{content}</button>
      </li> : <li className={`monthly-row${index === 0 ? " is-base" : ""}`} key={item.mes}>{content}</li>;
    })}
  </ul>;
  return vertical ? <div className="monthly-plot">{rows}</div> : rows;
}
