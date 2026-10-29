import DemoLink from "./DemoLink";
import {
  categoryRows, demo, entriesFor, formatMoneyDifference, formatPercentage, money, monthColors, monthRows,
  monthlyDelta, storySteps, sumOf, totalOf, type DemoPreset,
} from "./dashboard/demoModel";

/** Leitura (a): uma coluna por mês, com a queda de julho para agosto desenhada. */
function MonthlyColumns() {
  const maximum = Math.max(...monthRows.map((row) => row.total));
  const delta = monthlyDelta("ago")!;
  const july = monthRows.find((row) => row.key === "jul")!;

  // Alturas em porcentagem da maior coluna.
  const heightOf = (value: number) => `${value / maximum * 100}%`;

  return <div className="reading-columns">
    {monthRows.map((row) => <div key={row.key} className="reading-column">
      <span className="reading-plot" aria-hidden="true">
        {/* Em agosto, a faixa acima da coluna mostra quanto falta para chegar a julho. */}
        {row.key === "ago" && <span className="reading-gap" style={{ height: heightOf(july.total - row.total), bottom: heightOf(row.total) }}>
          <em>{formatMoneyDifference(delta.amount)}</em>
        </span>}
        <i style={{ height: heightOf(row.total), backgroundColor: monthColors[row.key] }} />
      </span>
      <b>{row.label}</b>
      <strong>{money(row.total)}</strong>
    </div>)}
  </div>;
}

/** Leitura (b): uma barra dividida na parte de cada categoria em agosto. */
function Composition() {
  const rows = categoryRows("ago");
  return <div className="reading-composition">
    <div className="composition-bar" aria-hidden="true">
      {rows.map((row) => <i key={row.name} style={{ flexGrow: row.value, backgroundColor: row.color }} />)}
    </div>
    <ul className="composition-legend">
      {rows.map((row) => <li key={row.name}>
        <i style={{ backgroundColor: row.color }} aria-hidden="true" /><span>{row.name}</span><strong>{formatPercentage(row.share)}</strong>
      </li>)}
    </ul>
  </div>;
}

/** Leitura (c): os três maiores lançamentos de alimentação e a soma dos demais. */
function FoodEntries() {
  const note = entriesFor("ago", "Alimentação");
  const largest = note.items.slice(0, 3);
  const rest = note.items.slice(3);
  return <table className="reading-table">
    <caption className="sr-only">Maiores lançamentos de alimentação em agosto e soma dos demais</caption>
    <thead><tr><th scope="col">Data</th><th scope="col">Estabelecimento</th><th scope="col">Valor</th></tr></thead>
    <tbody>
      {largest.map((item) => <tr key={`${item.name}-${item.date}-${item.amount}`}>
        <td>{item.date}</td><td>{item.name}</td><td>{money(item.amount)}</td>
      </tr>)}
      <tr className="is-rest"><td colSpan={2}>Demais {rest.length} lançamentos</td><td>{money(sumOf(rest))}</td></tr>
    </tbody>
    <tfoot><tr><th scope="row" colSpan={2}>Total da categoria</th><td>{money(note.sum)}</td></tr></tfoot>
  </table>;
}

// Um desenho para cada leitura, na mesma ordem de storySteps.
const visuals = [MonthlyColumns, Composition, FoodEntries];

/**
 * Figura 2: três painéis, um por leitura do trimestre. Cada painel tem o nome
 * da leitura, o desenho numa tela branca e um link que abre o mesmo recorte na
 * demonstração.
 */
export default function ReadingsFigure({ onOpenPreset }: { onOpenPreset: (preset: DemoPreset) => void }) {
  const augustTotal = totalOf(demo.ago.values);

  return <figure className="readings-figure" id="figura-2" aria-labelledby="readings-caption">
    <figcaption id="readings-caption" className="figure-caption"><b>Figura 2</b> Três leituras do mesmo trimestre</figcaption>
    <div className="readings-grid">
      {storySteps.map((step, index) => {
        const Visual = visuals[index];
        // A leitura (b) acrescenta o total do mês à descrição.
        let description = step.description;
        if (step.key === "categories") {
          description = `${step.description} Total de ${money(augustTotal)}.`;
        }

        return <section key={step.key} className="reading-panel" id={`figura-2${step.letter}`} aria-labelledby={`reading-${step.key}`}>
          <div className="reading-head">
            <h3 id={`reading-${step.key}`}><span>({step.letter})</span> {step.title}</h3>
            <p>{description}</p>
            <DemoLink className="pill-link reading-link" preset={step.preset} onOpen={onOpenPreset}>Abrir 2{step.letter} na demonstração</DemoLink>
          </div>
          <div className="reading-screen"><Visual /></div>
        </section>;
      })}
    </div>
    <p className="figure-source">Fonte: dados fictícios do gerenCIA, junho a agosto de 2026.</p>
  </figure>;
}
