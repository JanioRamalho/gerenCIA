import { useId, useState, type MouseEvent } from "react";
import { categoryRows, demo, entriesFor, formatPercentage, monthKeys, money, totalOf, type Category, type DemoPreset, type MonthKey } from "./dashboard/demoModel";
import { demoHref } from "../hooks/useDemoExperience";

type Props = {
  period?: MonthKey;
  number: string;
  onOpenPreset?: (preset: DemoPreset) => void;
};

const shownEntries = 3;
const topCategory = (month: MonthKey) => categoryRows(month).sort((a, b) => b.value - a.value)[0].name;

// A stack of monthly statements. The front sheet cites its totals: each category carries a note mark,
// and the open note lists the largest entries and sums all of them back to the total.
export default function CitedFigure({ period: initialPeriod = "ago", number, onOpenPreset }: Props) {
  const [period, setPeriod] = useState<MonthKey>(initialPeriod);
  const [selected, setSelected] = useState<Category>(() => topCategory(initialPeriod));
  const [reading, setReading] = useState(false);
  const noteId = useId();
  const rows = categoryRows(period).sort((a, b) => b.value - a.value);
  const total = totalOf(demo[period].values);
  const maximum = rows[0].value;
  const noteIndex = rows.findIndex((row) => row.name === selected) + 1;
  const note = entriesFor(period, selected);
  const hidden = note.items.length - shownEntries;
  const month = demo[period].label.toLowerCase();
  const preset: DemoPreset = { period, category: selected, chart: "bar", focus: "transactions" };
  const openRest = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onOpenPreset || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onOpenPreset(preset);
  };
  const choosePeriod = (next: MonthKey) => {
    setPeriod(next);
    setSelected(topCategory(next));
    setReading(true);
  };

  return <figure className={`cited-figure${reading ? " is-reading" : ""}`} aria-labelledby={`${noteId}-caption`}>
    <div className="statement-tabs" role="group" aria-label="Escolher a fatura do mês">
      {monthKeys.map((key) => <button key={key} type="button" aria-pressed={period === key} onClick={() => choosePeriod(key)}>
        <b>{demo[key].label}</b><span>{money(totalOf(demo[key].values))}</span>
      </button>)}
    </div>
    <div className="statement-sheet" key={period}>
      <p id={`${noteId}-caption`} className="figure-caption"><b>Figura {number}</b> Saídas de {month} de 2026 por categoria</p>
      <p className="cited-hint" id={`${noteId}-hint`}>Total do mês: <strong>{money(total)}</strong>. Selecione uma categoria para ver os lançamentos dela.</p>
      <div className="cited-rows" role="group" aria-labelledby={`${noteId}-hint`}>
        {rows.map((row, index) => <button
          key={row.name}
          type="button"
          className="cited-row"
          aria-pressed={selected === row.name}
          aria-controls={noteId}
          onClick={() => { setSelected(row.name); setReading(true); }}
        >
          <span className="cited-name">{row.name}</span>
          <span className="cited-track" aria-hidden="true"><i style={{ width: `${row.value / maximum * 100}%` }} /></span>
          <span className="cited-value">{money(row.value)}<sup className="note-mark"><span className="sr-only">nota </span>{index + 1}</sup></span>
          <span className="cited-share">{formatPercentage(row.share)}</span>
        </button>)}
      </div>
      <div className="cited-note" id={noteId} aria-live="polite">
        <div className="cited-note-body" key={selected}>
          <p className="cited-note-head"><sup className="note-mark is-filled">{noteIndex}</sup> {selected}: os {Math.min(shownEntries, note.items.length)} maiores de {note.items.length} lançamentos</p>
          <ul>{note.items.slice(0, shownEntries).map((item) => <li key={`${item.name}-${item.date}-${item.amount}`}><span>{item.date}</span><span>{item.name}</span><span>{money(item.amount)}</span></li>)}</ul>
          <p className="cited-sum"><span>Soma dos {note.items.length} lançamentos</span><strong>{money(note.sum)}</strong></p>
          {hidden > 0 && <a className="text-link cited-more" href={demoHref(preset)} onClick={openRest}>Ver os outros {hidden} na demonstração</a>}
        </div>
      </div>
      <p className="figure-source">Fonte: dados fictícios do gerenCIA, {month} de 2026.</p>
    </div>
  </figure>;
}
