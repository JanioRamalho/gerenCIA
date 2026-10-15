import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, LabelList, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  categoryRows, demo, formatPercentage, money, monthKeys,
  monthlyDelta, periodLabel, totalOf, transactionsFor, valuesFor,
  categoryColor, sumOf, type Category, type DemoState, type MonthKey, type Period,
} from "./demoModel";

type Props = { state: DemoState; onChange: (patch: Partial<DemoState>) => void };
type Sort = "value" | "category";

const ink = "#0F3440";
const barRest = "#5B8A88";
const barMuted = "#B9CDC9";
const paper = "#FFFFFF";
const firstEntries = 10;

function readSort(): Sort {
  try { return localStorage.getItem("gerencia-demo-sort") === "category" ? "category" : "value"; }
  catch { return "value"; }
}

function ChartDetail({ category, period }: { category: Category | null; period: Period }) {
  const rows = categoryRows(period);
  const item = rows.find((row) => row.name === category);
  if (!item) return <p className="chart-detail" role="status">Selecione uma categoria no gráfico ou na lista para ver o valor e os lançamentos dela.</p>;
  return <p className="chart-detail" role="status"><span className="category-dot" style={{ backgroundColor: item.color }} /> <strong>{item.name}</strong> soma <strong>{money(item.value)}</strong>, ou <strong>{formatPercentage(item.share)}</strong> das saídas de {periodLabel(period).toLowerCase()}.</p>;
}

// The monthly change drawn as a difference: previous month above, selected month below.
function DeltaBars({ current, previous, previousLabel, currentLabel }: { current: number; previous: number; previousLabel: string; currentLabel: string }) {
  const maximum = Math.max(current, previous);
  return <span className="delta-bars" role="img" aria-label={`${previousLabel}: ${money(previous)}. ${currentLabel}: ${money(current)}.`}>
    <span><b>{previousLabel.slice(0, 3)}</b><i style={{ width: `${previous / maximum * 100}%` }} /></span>
    <span className="is-current"><b>{currentLabel.slice(0, 3)}</b><i style={{ width: `${current / maximum * 100}%` }} /></span>
  </span>;
}

export default function ConnectedDashboard({ state, onChange }: Props) {
  const { period, category, chart } = state;
  const [sort, setSort] = useState<Sort>(readSort);
  const [preview, setPreview] = useState<Category | null>(null);
  const [showAll, setShowAll] = useState(false);
  const values = useMemo(() => valuesFor(period), [period]);
  const total = totalOf(values);
  const rows = useMemo(() => categoryRows(period).sort((a, b) => sort === "value" ? b.value - a.value : a.name.localeCompare(b.name, "pt-BR")), [period, sort]);
  // The donut keeps the fixed category order so neighbouring colours stay distinguishable.
  const donutRows = useMemo(() => categoryRows(period), [period]);
  const topCategory = [...rows].sort((a, b) => b.value - a.value)[0];
  const delta = monthlyDelta(period);
  const previousKey = period === "ago" ? "jul" : period === "jul" ? "jun" : null;
  const days = period === "quarter" ? 92 : period === "jun" ? 30 : 31;
  const entries = transactionsFor(period).filter((item) => !category || item.category === category);
  const visibleEntries = showAll ? entries : entries.slice(0, firstEntries);
  const focus = preview ?? category;
  const toggleCategory = (next: Category) => onChange({ category: category === next ? null : next });
  const barFill = (name: Category) => focus === name ? ink : category ? barMuted : barRest;

  useEffect(() => {
    try { localStorage.setItem("gerencia-demo-sort", sort); }
    catch { /* Sorting remains usable without storage. */ }
  }, [sort]);
  useEffect(() => setPreview(null), [period, chart, sort]);
  useEffect(() => setShowAll(false), [period, category]);
  useEffect(() => {
    const target = window.location.hash.slice(1);
    if (!["demo-categories", "demo-transactions"].includes(target)) return;
    const frame = window.requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return <figure className="analytics-workspace" aria-labelledby="workspace-caption">
    <div className="workspace-head">
      <figcaption id="workspace-caption" className="figure-caption"><b>Figura 3</b> Demonstração interativa</figcaption>
      <span className="demo-badge">Dados fictícios</span>
    </div>

    <div className="period-toolbar" role="group" aria-label="Escolher período">
      <span className="toolbar-label" aria-hidden="true">Período</span>
      {monthKeys.map((key) => <button key={key} type="button" aria-pressed={period === key} onClick={() => onChange({ period: key, category: null })}>{demo[key].label}</button>)}
      <button type="button" aria-pressed={period === "quarter"} onClick={() => onChange({ period: "quarter", category: null })}>3 meses</button>
    </div>

    <dl className="metric-strip">
      <div className="metric-main"><dt>Total de saídas</dt><dd><strong>{money(total)}</strong><small>{periodLabel(period)}</small></dd></div>
      <div><dt>Variação mensal</dt><dd>
        <strong>{delta ? `${delta.percentage > 0 ? "+" : "−"}${formatPercentage(Math.abs(delta.percentage) / 100)}` : "—"}</strong>
        {delta && previousKey
          ? <><DeltaBars current={total} previous={totalOf(demo[previousKey].values)} previousLabel={demo[previousKey].label} currentLabel={demo[period as MonthKey].label} /><small>{money(Math.abs(delta.amount))} {delta.amount < 0 ? "a menos" : "a mais"} que em {demo[previousKey].label.toLowerCase()}</small></>
          : <small>Escolha julho ou agosto para comparar</small>}
      </dd></div>
      <div><dt>Média por dia</dt><dd><strong>{money(total / days)}</strong><small>Total dividido por {days} dias</small></dd></div>
      <div><dt>Maior categoria</dt><dd><strong>{topCategory.name}</strong><small>{formatPercentage(topCategory.share)} do total</small></dd></div>
    </dl>

    <section className="analysis-block category-block" id="demo-categories" aria-labelledby="category-title">
      <div className="block-heading">
        <div><h3 id="category-title"><span>(a)</span> Para onde foi o dinheiro</h3><p>{periodLabel(period)}. Selecione uma categoria para filtrar os lançamentos.</p></div>
        <div className="chart-switch segmented" role="group" aria-label="Tipo de gráfico"><button type="button" aria-pressed={chart === "bar"} onClick={() => onChange({ chart: "bar" })}>Barras</button><button type="button" aria-pressed={chart === "donut"} onClick={() => onChange({ chart: "donut" })}>Rosca</button></div>
      </div>
      <div className="category-layout">
        <div className="category-chart-area">
          <div className={`category-chart is-${chart}`} role="img" aria-label={`Gráfico de ${chart === "bar" ? "barras" : "rosca"} com a distribuição das saídas. A lista ao lado traz os mesmos valores e permite filtrar pelo teclado.`}>
            <ResponsiveContainer width="100%" height="100%">
              {chart === "bar" ? <BarChart data={rows} accessibilityLayer={false} layout="vertical" barCategoryGap="28%" margin={{ top: 4, right: 104, bottom: 4, left: 0 }}>
                <XAxis type="number" hide domain={[0, "dataMax"]} />
                <YAxis type="category" dataKey="name" width={112} tickLine={false} axisLine={{ stroke: ink, strokeWidth: 1 }} tick={{ fill: ink, fontSize: 16 }} />
                <Bar dataKey="value" maxBarSize={24} radius={[0, 4, 4, 0]} isAnimationActive={false} onMouseEnter={(_, index) => setPreview(rows[index]?.name ?? null)} onMouseLeave={() => setPreview(null)} onClick={(_, index) => { if (rows[index]) toggleCategory(rows[index].name); }}>
                  {rows.map((row) => <Cell key={row.name} fill={barFill(row.name)} cursor="pointer" />)}
                  <LabelList dataKey="value" position="right" offset={10} formatter={(value) => money(Number(value))} style={{ fill: ink, fontSize: 16, fontVariantNumeric: "tabular-nums" }} />
                </Bar>
              </BarChart> : <PieChart accessibilityLayer={false}>
                <Pie data={donutRows} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="60%" outerRadius="88%" startAngle={90} endAngle={-270} stroke={paper} strokeWidth={2} isAnimationActive={false} onMouseEnter={(_, index) => setPreview(donutRows[index]?.name ?? null)} onMouseLeave={() => setPreview(null)} onClick={(_, index) => { if (donutRows[index]) toggleCategory(donutRows[index].name); }}>
                  {donutRows.map((row) => <Cell key={row.name} fill={row.color} opacity={focus && focus !== row.name ? 0.28 : 1} cursor="pointer" />)}
                </Pie>
              </PieChart>}
            </ResponsiveContainer>
            {chart === "donut" && <div className="donut-center" aria-hidden="true"><small>{focus ? focus : "Total"}</small><strong>{money(focus ? values[focus] : total)}</strong></div>}
          </div>
          <ChartDetail category={focus} period={period} />
        </div>
        <div className="category-ledger">
          <div className="ledger-heading"><strong>Resumo por categoria</strong><div className="sort-switch segmented" role="group" aria-label="Ordenar categorias"><button type="button" aria-pressed={sort === "value"} onClick={() => setSort("value")}>Maior gasto</button><button type="button" aria-pressed={sort === "category"} onClick={() => setSort("category")}>A–Z</button></div></div>
          <div className="category-options">{rows.map((row) => <button type="button" key={row.name} aria-pressed={category === row.name} onClick={() => toggleCategory(row.name)} onFocus={() => setPreview(row.name)} onBlur={() => setPreview(null)} onMouseEnter={() => setPreview(row.name)} onMouseLeave={() => setPreview(null)}><span>{chart === "donut" && <i style={{ backgroundColor: row.color }} />}{row.name}</span><strong>{money(row.value)}</strong><small>{formatPercentage(row.share)}</small></button>)}</div>
          {category && <button className="clear-category text-button" type="button" onClick={() => onChange({ category: null })}>Mostrar todas as categorias</button>}
        </div>
      </div>
    </section>

    <section className="analysis-block transactions-block" id="demo-transactions" aria-labelledby="transactions-title">
      <div className="block-heading">
        <div><h3 id="transactions-title"><span>(b)</span> Lançamentos</h3><p>{category ? `${category} em ${periodLabel(period).toLowerCase()}, do mais recente ao mais antigo.` : `Todas as categorias em ${periodLabel(period).toLowerCase()}, do mais recente ao mais antigo.`}</p></div>
        <span className="block-count">{entries.length} {entries.length === 1 ? "lançamento" : "lançamentos"}</span>
      </div>
      {entries.length ? <><table className="transaction-table">
        <caption className="sr-only">Lançamentos {category ? `de ${category.toLowerCase()} ` : ""}em {periodLabel(period).toLowerCase()}</caption>
        <thead><tr><th scope="col">Data</th><th scope="col">Estabelecimento</th><th scope="col">Categoria</th><th scope="col">Valor</th></tr></thead>
        <tbody>{visibleEntries.map((item, index) => <tr key={`${item.name}-${item.date}-${item.amount}-${index}`}>
          <td>{item.date}</td>
          <td><strong>{item.name}</strong><small>{item.detail}</small></td>
          <td><span className="category-key"><i style={{ backgroundColor: categoryColor(item.category) }} aria-hidden="true" />{item.category}</span></td>
          <td>{money(item.amount)}</td>
        </tr>)}</tbody>
        {showAll || entries.length <= firstEntries ? <tfoot><tr><th scope="row" colSpan={3}>Soma dos {entries.length} lançamentos{category ? ` = total de ${category.toLowerCase()}` : " = total de saídas"}</th><td>{money(sumOf(entries))}</td></tr></tfoot> : null}
      </table>
      {entries.length > firstEntries && <button className="text-button show-entries" type="button" aria-expanded={showAll} onClick={() => setShowAll((value) => !value)}>{showAll ? "Mostrar só os 10 mais recentes" : `Mostrar todos os ${entries.length} lançamentos e a soma`}</button>}</> : <div className="transactions-empty"><p>Não há lançamentos desta categoria neste período.</p><button className="text-button" type="button" onClick={() => onChange({ category: null })}>Ver todas as categorias</button></div>}
    </section>
    <p className="figure-source">Fonte: dados fictícios do gerenCIA, junho a agosto de 2026.</p>
  </figure>;
}
