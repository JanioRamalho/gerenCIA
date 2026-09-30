import { categoryRows, demo, formatPercentage, money, totalOf } from "./dashboard/demoModel";

const rows = categoryRows("ago").sort((a, b) => b.value - a.value).slice(0, 3);

export default function SampleReport() {
  return <aside className="sample-report" aria-label="Recorte da demonstração fictícia de agosto de 2026">
    <div className="sample-report-head"><span>gerenCIA / leitura de exemplo</span><span>Agosto 2026</span></div>
    <div className="sample-report-total"><span>Saídas do período</span><strong>{money(totalOf(demo.ago.values))}</strong><small>Dados fictícios para explorar a análise</small></div>
    <div className="sample-report-rows">{rows.map((row) => <div key={row.name}>
      <span><i style={{ backgroundColor: row.color }} />{row.name}</span>
      <strong>{money(row.value)}</strong>
      <small>{formatPercentage(row.share)}</small>
    </div>)}</div>
    <div className="sample-report-foot"><span>3 categorias em destaque</span><span>Cenário fictício</span></div>
  </aside>;
}