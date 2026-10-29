import { useEffect } from "react";
import CategoryBlock from "./CategoryBlock";
import MetricStrip from "./MetricStrip";
import TransactionsBlock from "./TransactionsBlock";
import { demo, monthKeys, type DemoState, type Period } from "./demoModel";

type Props = {
  state: DemoState; // o recorte escolhido: período, categoria e tipo de gráfico
  onChange: (patch: Partial<DemoState>) => void;
};

// Blocos que um link pode abrir direto, como "/?period=jul#demo-transactions".
const linkedBlocks = ["demo-categories", "demo-transactions"];

/**
 * Figura 3: a demonstração interativa. Os números do topo, o gráfico das
 * categorias e a tabela de lançamentos mostram sempre o mesmo recorte.
 */
export default function ConnectedDashboard({ state, onChange }: Props) {
  const { period, category } = state;

  // Esta figura é carregada depois do resto da página. Quando a página abre
  // por um link com #demo-categories ou #demo-transactions, o navegador ainda
  // não encontrou o bloco, então a rolagem é feita aqui, quando ele aparece.
  useEffect(() => {
    const target = window.location.hash.slice(1);
    if (!linkedBlocks.includes(target)) {
      return;
    }
    const frame = window.requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Trocar de período limpa a categoria escolhida.
  function choosePeriod(next: Period) {
    onChange({ period: next, category: null });
  }

  return <figure className="analytics-workspace" aria-labelledby="workspace-caption">
    <div className="workspace-head">
      <figcaption id="workspace-caption" className="figure-caption"><b>Figura 3</b> Demonstração interativa</figcaption>
      <span className="demo-badge">Dados fictícios</span>
    </div>

    <div className="period-toolbar" role="group" aria-label="Escolher período">
      <span className="toolbar-label" aria-hidden="true">Período</span>
      {monthKeys.map((key) => <button key={key} type="button" aria-pressed={period === key} onClick={() => choosePeriod(key)}>{demo[key].label}</button>)}
      <button type="button" aria-pressed={period === "quarter"} onClick={() => choosePeriod("quarter")}>3 meses</button>
    </div>

    <MetricStrip period={period} />
    <CategoryBlock state={state} onChange={onChange} />
    {/* A key faz o React recriar o bloco quando o período ou a categoria
        mudam. Assim a tabela volta a mostrar só os primeiros lançamentos. */}
    <TransactionsBlock key={`${period}|${category}`} period={period} category={category} onChange={onChange} />

    <p className="figure-source">Fonte: dados fictícios do gerenCIA, junho a agosto de 2026.</p>
  </figure>;
}
