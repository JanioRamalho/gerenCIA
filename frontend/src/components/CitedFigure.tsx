import { useId, useState } from "react";
import DemoLink from "./DemoLink";
import {
  categoryRows, demo, entriesFor, formatPercentage, largestCategory, monthKeys, money, sortByValue, totalOf,
  type Category, type CategoryRow, type DemoPreset, type MonthKey,
} from "./dashboard/demoModel";

// Quantos lançamentos a nota mostra antes do link para a demonstração.
const shownEntries = 3;

type Props = {
  number: string; // o número da figura na página
  onOpenPreset: (preset: DemoPreset) => void;
};

/**
 * Figura 1: uma pilha de faturas mensais. A fatura da frente cita os seus
 * totais: cada categoria leva o número de uma nota, e a nota aberta lista os
 * maiores lançamentos e soma todos eles até chegar ao total.
 */
export default function CitedFigure({ number, onOpenPreset }: Props) {
  const [period, setPeriod] = useState<MonthKey>("ago");
  const [selected, setSelected] = useState<Category>(() => largestCategory("ago").name);
  // "reading" liga a animação de virar a fatura depois do primeiro clique.
  const [reading, setReading] = useState(false);
  // useId cria um id único, para ligar a legenda e a nota aos botões.
  const noteId = useId();

  const rows = sortByValue(categoryRows(period));
  const month = demo[period].label.toLowerCase();

  // Trocar de mês mostra a nota da maior categoria daquele mês.
  function choosePeriod(next: MonthKey) {
    setPeriod(next);
    setSelected(largestCategory(next).name);
    setReading(true);
  }

  function chooseCategory(name: Category) {
    setSelected(name);
    setReading(true);
  }

  return <figure className={`cited-figure${reading ? " is-reading" : ""}`} aria-labelledby={`${noteId}-caption`}>
    <div className="statement-tabs" role="group" aria-label="Escolher a fatura do mês">
      {monthKeys.map((key) => <button key={key} type="button" aria-pressed={period === key} onClick={() => choosePeriod(key)}>
        <b>{demo[key].label}</b><span>{money(totalOf(demo[key].values))}</span>
      </button>)}
    </div>

    {/* A key recria a fatura ao trocar de mês, o que dispara a animação de entrada. */}
    <div className="statement-sheet" key={period}>
      <p id={`${noteId}-caption`} className="figure-caption"><b>Figura {number}</b> Saídas de {month} de 2026 por categoria</p>
      <p className="cited-hint" id={`${noteId}-hint`}>
        Total do mês: <strong>{money(totalOf(demo[period].values))}</strong>. Selecione uma categoria para ver os lançamentos dela.
      </p>
      <div className="cited-rows" role="group" aria-labelledby={`${noteId}-hint`}>
        {rows.map((row, index) => <CitedRow
          key={row.name}
          row={row}
          noteNumber={index + 1}
          widthPercent={row.value / rows[0].value * 100}
          selected={selected === row.name}
          noteId={noteId}
          onChoose={chooseCategory}
        />)}
      </div>
      <CitedNote period={period} category={selected} noteNumber={rows.findIndex((row) => row.name === selected) + 1} noteId={noteId} onOpenPreset={onOpenPreset} />
      <p className="figure-source">Fonte: dados fictícios do gerenCIA, {month} de 2026.</p>
    </div>
  </figure>;
}

type CitedRowProps = {
  row: CategoryRow;
  noteNumber: number;
  widthPercent: number; // largura da barra; a maior categoria ocupa 100%
  selected: boolean;
  noteId: string; // id da nota que este botão controla
  onChoose: (name: Category) => void;
};

/** Uma linha da fatura: a categoria, uma barra, o valor com o número da nota e a parte do total. */
function CitedRow({ row, noteNumber, widthPercent, selected, noteId, onChoose }: CitedRowProps) {
  return <button type="button" className="cited-row" aria-pressed={selected} aria-controls={noteId} onClick={() => onChoose(row.name)}>
    <span className="cited-name">{row.name}</span>
    <span className="cited-track" aria-hidden="true"><i style={{ width: `${widthPercent}%` }} /></span>
    <span className="cited-value">{money(row.value)}<sup className="note-mark"><span className="sr-only">nota </span>{noteNumber}</sup></span>
    <span className="cited-share">{formatPercentage(row.share)}</span>
  </button>;
}

type CitedNoteProps = {
  period: MonthKey;
  category: Category;
  noteNumber: number;
  noteId: string;
  onOpenPreset: (preset: DemoPreset) => void;
};

/**
 * A nota da categoria escolhida: os maiores lançamentos, a soma de todos e um
 * link para ver o resto na demonstração. aria-live faz o leitor de tela ler a
 * nota de novo quando ela muda.
 */
function CitedNote({ period, category, noteNumber, noteId, onOpenPreset }: CitedNoteProps) {
  const { items, sum } = entriesFor(period, category);
  const hiddenCount = items.length - shownEntries;
  const preset: DemoPreset = { period, category, chart: "bar", focus: "transactions" };

  return <div className="cited-note" id={noteId} aria-live="polite">
    <div className="cited-note-body" key={category}>
      <p className="cited-note-head">
        <sup className="note-mark is-filled">{noteNumber}</sup> {category}: os {Math.min(shownEntries, items.length)} maiores de {items.length} lançamentos
      </p>
      <ul>
        {items.slice(0, shownEntries).map((item) => <li key={`${item.name}-${item.date}-${item.amount}`}>
          <span>{item.date}</span><span>{item.name}</span><span>{money(item.amount)}</span>
        </li>)}
      </ul>
      <p className="cited-sum"><span>Soma dos {items.length} lançamentos</span><strong>{money(sum)}</strong></p>
      {hiddenCount > 0 && <DemoLink className="text-link cited-more" preset={preset} onOpen={onOpenPreset}>
        Ver os outros {hiddenCount} na demonstração
      </DemoLink>}
    </div>
  </div>;
}
