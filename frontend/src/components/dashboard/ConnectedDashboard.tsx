import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, XAxis, YAxis,
} from "recharts";
import {
  categoryRows, demo, formatPercentage, money, monthKeys,
  monthlyDelta, periodLabel, totalOf, transactionsFor, valuesFor,
  type Category, type DemoState, type Period,
} from "./demoModel";

type Props = { state: DemoState; onChange: (patch: Partial<DemoState>) => void };
type Sort = "value" | "category";
const axisNumber = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const axisMoney = (value: number) => value === 0 ? "0" : value < 1000 ? axisNumber.format(value) : `${axisNumber.format(value / 1000)} mil`;

function readSort(): Sort {
  try { return localStorage.getItem("gerencia-demo-sort") === "category" ? "category" : "value"; }
  catch { return "value"; }
}

function ChartDetail({ category, period }: { category: Category | null; period: Period }) {
  const rows = categoryRows(period);
  const item = rows.find((row) => row.name === category);
  if (!item) return <p className="chart-detail" role="status">Selecione uma categoria no gráfico ou na lista para examinar seu valor e os lançamentos de exemplo.</p>;
  return <p className="chart-detail" role="status"><span className="category-dot" style={{ backgroundColor: item.color }} /> <strong>{item.name}</strong> soma <strong>{money(item.value)}</strong>, ou <strong>{formatPercentage(item.share)}</strong> das saídas de {periodLabel(period).toLowerCase()}.</p>;
}

export default function ConnectedDashboard({ state, onChange }: Props) {
  const { period, category, chart } = state;
  const [sort, setSort] = useState<Sort>(readSort);
  const [preview, setPreview] = useState<Category | null>(null);
  const values = useMemo(() => valuesFor(period), [period]);
  const total = totalOf(values);
  const rows = useMemo(() => categoryRows(period).sort((a, b) => sort === "value" ? b.value - a.value : a.name.localeCompare(b.name, "pt-BR")), [period, sort]);
  const topCategory = [...rows].sort((a, b) => b.value - a.value)[0];
  const delta = monthlyDelta(period);
  const days = period === "quarter" ? 92 : period === "jun" ? 30 : 31;
  const examples = transactionsFor(period).filter((item) => !category || item.category === category);
  const toggleCategory = (next: Category) => onChange({ category: category === next ? null : next });

  useEffect(() => {
    try { localStorage.setItem("gerencia-demo-sort", sort); }
    catch { /* Sorting remains usable without storage. */ }
  }, [sort]);
  useEffect(() => setPreview(null), [period, chart, sort]);
  useEffect(() => {
    const target = window.location.hash.slice(1);
    if (!["demo-categories", "demo-transactions"].includes(target)) return;
    const frame = window.requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return <div className="analytics-workspace" aria-label="Demonstração financeira com dados fictícios">
    <div className="analytics-heading"><div><p className="workspace-path">gerenCIA / demonstração</p><h3>Visão do cenário</h3><p>Explore o mesmo cenário apresentado acima. Os valores e lançamentos são fictícios.</p></div><span className="demo-badge">Dados fictícios</span></div>

    <div className="period-toolbar" role="group" aria-label="Escolher período">
      <span className="period-toolbar-label" aria-hidden="true">Período</span>
      {monthKeys.map((key) => <button key={key} type="button" aria-pressed={period === key} onClick={() => onChange({ period: key, category: null })}>{demo[key].label}</button>)}
      <button type="button" aria-pressed={period === "quarter"} onClick={() => onChange({ period: "quarter", category: null })}>3 meses</button>
    </div>

    <div className="metric-strip">
      <div className="metric-main"><span>Total de saídas</span><strong>{money(total)}</strong><small>{periodLabel(period)}</small></div>
      <div><span>Variação mensal</span><strong>{delta ? `${delta.percentage > 0 ? "+" : ""}${formatPercentage(delta.percentage / 100)}` : "—"}</strong><small>{delta ? `${money(Math.abs(delta.amount))} ${delta.amount < 0 ? "a menos" : "a mais"} que no mês anterior` : "Selecione julho ou agosto"}</small></div>
      <div><span>Média por dia</span><strong>{money(total / days)}</strong><small>Total dividido por {days} dias</small></div>
      <div><span>Maior categoria</span><strong>{topCategory.name}</strong><small>{formatPercentage(topCategory.share)} do total</small></div>
    </div>

    <section className="analysis-block category-block" id="demo-categories" aria-labelledby="category-title">
      <div className="block-heading"><div><h4 id="category-title">Para onde foi o dinheiro?</h4><p>{periodLabel(period)} · selecione uma categoria para ver os exemplos relacionados.</p></div><div className="chart-switch" role="group" aria-label="Tipo de gráfico"><button type="button" aria-pressed={chart === "bar"} onClick={() => onChange({ chart: "bar" })}>Barras</button><button type="button" aria-pressed={chart === "donut"} onClick={() => onChange({ chart: "donut" })}>Rosca</button></div></div>
      <div className="category-layout"><div className="category-chart-area">
        <div className="category-chart" role="img" aria-label={`Gráfico de ${chart === "bar" ? "barras" : "rosca"} para a distribuição das saídas. A lista ao lado oferece os valores e filtros por teclado.`}>
          <ResponsiveContainer width="100%" height="100%">
            {chart === "bar" ? <BarChart data={rows} accessibilityLayer={false} layout="vertical" margin={{ top: 8, right: 22, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="#42636A" strokeDasharray="2 6" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "#C7DDD7", fontSize: 13 }} tickFormatter={axisMoney} />
              <YAxis type="category" dataKey="name" width={116} tickLine={false} axisLine={false} tick={{ fill: "#ECF5EE", fontSize: 14 }} />
              <Bar dataKey="value" barSize={32} radius={[0, 8, 8, 0]} onMouseEnter={(_, index) => setPreview(rows[index]?.name ?? null)} onMouseLeave={() => setPreview(null)} onClick={(_, index) => { if (rows[index]) toggleCategory(rows[index].name); }}>{rows.map((row) => <Cell key={row.name} fill={row.color} opacity={category && category !== row.name ? 0.35 : 1} cursor="pointer" />)}</Bar>
            </BarChart> : <PieChart accessibilityLayer={false}><Pie data={rows} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="56%" outerRadius="81%" paddingAngle={3} onMouseEnter={(_, index) => setPreview(rows[index]?.name ?? null)} onMouseLeave={() => setPreview(null)} onClick={(_, index) => { if (rows[index]) toggleCategory(rows[index].name); }}>{rows.map((row) => <Cell key={row.name} fill={row.color} opacity={category && category !== row.name ? 0.35 : 1} cursor="pointer" />)}</Pie></PieChart>}
          </ResponsiveContainer>
          {chart === "donut" && <div className="donut-center" aria-hidden="true"><small>Total</small><strong>{money(total)}</strong></div>}
        </div>
        <ChartDetail category={preview ?? category} period={period} />
      </div>
      <div className="category-ledger"><div className="ledger-heading"><strong>Resumo por categoria</strong><div className="sort-switch" role="group" aria-label="Ordenar categorias"><button type="button" aria-pressed={sort === "value"} onClick={() => setSort("value")}>Maior gasto</button><button type="button" aria-pressed={sort === "category"} onClick={() => setSort("category")}>A–Z</button></div></div>
        <div className="category-options">{rows.map((row) => <button type="button" key={row.name} aria-pressed={category === row.name} onClick={() => toggleCategory(row.name)} onFocus={() => setPreview(row.name)} onBlur={() => setPreview(null)} onMouseEnter={() => setPreview(row.name)} onMouseLeave={() => setPreview(null)}><span><i style={{ backgroundColor: row.color }} />{row.name}</span><strong>{money(row.value)}</strong><small>{formatPercentage(row.share)}</small></button>)}</div>
        {category && <button className="clear-category" type="button" onClick={() => onChange({ category: null })}>Mostrar todas as categorias</button>}
      </div></div>
    </section>

    <section className="analysis-block transactions-block" id="demo-transactions" aria-labelledby="transactions-title"><div className="block-heading"><div><h4 id="transactions-title">Por trás dos números</h4><p>{category ? `Exemplos de ${category.toLowerCase()} em ${periodLabel(period).toLowerCase()}.` : `Alguns lançamentos de ${periodLabel(period).toLowerCase()}.`}</p></div><span>{examples.length} {examples.length === 1 ? "exemplo" : "exemplos"}</span></div>
      {examples.length ? <ul className="transaction-list">{examples.map((item, index) => <li key={`${item.name}-${item.detail}-${index}`}><span className="transaction-symbol" aria-hidden="true">{item.name.charAt(0)}</span><span className="transaction-info"><strong>{item.name}</strong><small>{item.detail} · {item.category}</small></span><strong>{money(item.amount)}</strong></li>)}</ul> : <div className="transactions-empty"><p>Não há lançamentos de exemplo para esta categoria neste período.</p><button type="button" onClick={() => onChange({ category: null })}>Ver todas as categorias</button></div>}
      <p className="data-note">Estes lançamentos são exemplos ilustrativos, não um extrato completo. Os totais incluem outras saídas fictícias.</p>
    </section>
  </div>;
}
