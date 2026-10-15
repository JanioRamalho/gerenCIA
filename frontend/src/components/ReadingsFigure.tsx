import type { MouseEvent } from "react";
import {
  categoryRows, demo, entriesFor, formatPercentage, money, monthColors, monthRows,
  monthlyDelta, storySteps, sumOf, totalOf, type DemoPreset,
} from "./dashboard/demoModel";
import { demoHref } from "../hooks/useDemoExperience";

function MonthlyColumns() {
  const maximum = Math.max(...monthRows.map((row) => row.total));
  const delta = monthlyDelta("ago")!;
  const july = monthRows.find((row) => row.key === "jul")!;
  return <div className="reading-columns">
    {monthRows.map((row) => <div key={row.key} className="reading-column">
      <span className="reading-plot" aria-hidden="true">
        {row.key === "ago" && <span className="reading-gap" style={{ height: `${(july.total - row.total) / maximum * 100}%`, bottom: `${row.total / maximum * 100}%` }}><em>{money(delta.amount).replace("-", "−")}</em></span>}
        <i style={{ height: `${row.total / maximum * 100}%`, backgroundColor: monthColors[row.key] }} />
      </span>
      <b>{row.label}</b>
      <strong>{money(row.total)}</strong>
    </div>)}
  </div>;
}

function Composition() {
  const rows = categoryRows("ago");
  return <div className="reading-composition">
    <div className="composition-bar" aria-hidden="true">{rows.map((row) => <i key={row.name} style={{ flexGrow: row.value, backgroundColor: row.color }} />)}</div>
    <ul className="composition-legend">{rows.map((row) => <li key={row.name}><i style={{ backgroundColor: row.color }} aria-hidden="true" /><span>{row.name}</span><strong>{formatPercentage(row.share)}</strong></li>)}</ul>
  </div>;
}

function FoodEntries() {
  const note = entriesFor("ago", "Alimentação");
  const top = note.items.slice(0, 3);
  const rest = note.items.slice(3);
  return <table className="reading-table">
    <caption className="sr-only">Maiores lançamentos de alimentação em agosto e soma dos demais</caption>
    <thead><tr><th scope="col">Data</th><th scope="col">Estabelecimento</th><th scope="col">Valor</th></tr></thead>
    <tbody>
      {top.map((item) => <tr key={`${item.name}-${item.date}-${item.amount}`}><td>{item.date}</td><td>{item.name}</td><td>{money(item.amount)}</td></tr>)}
      <tr className="is-rest"><td colSpan={2}>Demais {rest.length} lançamentos</td><td>{money(sumOf(rest))}</td></tr>
    </tbody>
    <tfoot><tr><th scope="row" colSpan={2}>Total da categoria</th><td>{money(note.sum)}</td></tr></tfoot>
  </table>;
}

const visuals = [MonthlyColumns, Composition, FoodEntries];

export default function ReadingsFigure({ onOpenPreset }: { onOpenPreset: (preset: DemoPreset) => void }) {
  const open = (event: MouseEvent<HTMLAnchorElement>, preset: DemoPreset) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onOpenPreset(preset);
  };
  const august = totalOf(demo.ago.values);

  // A bento of three panels: each one names its reading and holds the visual on a white screen.
  return <figure className="readings-figure" id="figura-2" aria-labelledby="readings-caption">
    <figcaption id="readings-caption" className="figure-caption"><b>Figura 2</b> Três leituras do mesmo trimestre</figcaption>
    <div className="readings-grid">
      {storySteps.map((step, index) => {
        const Visual = visuals[index];
        return <section key={step.key} className="reading-panel" id={`figura-2${step.letter}`} aria-labelledby={`reading-${step.key}`}>
          <div className="reading-head">
            <h3 id={`reading-${step.key}`}><span>({step.letter})</span> {step.title}</h3>
            <p>{index === 1 ? `${step.description} Total de ${money(august)}.` : step.description}</p>
            <a className="pill-link reading-link" href={demoHref(step.preset)} onClick={(event) => open(event, step.preset)}>Abrir 2{step.letter} na demonstração</a>
          </div>
          <div className="reading-screen"><Visual /></div>
        </section>;
      })}
    </div>
    <p className="figure-source">Fonte: dados fictícios do gerenCIA, junho a agosto de 2026.</p>
  </figure>;
}
