import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import {
  categories,
  demo,
  monthKeys,
  money,
  type Category,
  type Period,
} from "./demoData";

export default function DemoDashboard() {
  const [chartType, setChartType] = useState<"bar" | "pie">(() => {
    try {
      return localStorage.getItem("gerencia-demo-chart") === "pie"
        ? "pie"
        : "bar";
    } catch {
      return "bar";
    }
  });
  const [sortBy, setSortBy] = useState<"value" | "category">(() => {
    try {
      return localStorage.getItem("gerencia-demo-sort") === "category"
        ? "category"
        : "value";
    } catch {
      return "value";
    }
  });
  const [chartWidth, setChartWidth] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("gerencia-demo-chart", chartType);
      localStorage.setItem("gerencia-demo-sort", sortBy);
    } catch {
      /* The controls still work when browser storage is unavailable. */
    }
  }, [chartType, sortBy]);
  const [period, setPeriod] = useState<Period>("ago");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null);
  useEffect(() => setHoveredCategory(null), [period, chartType, sortBy]);
  const [hasInteracted, setHasInteracted] = useState(false);

  const values = useMemo(() => {
    if (period !== "quarter") return demo[period].values;
    return Object.fromEntries(
      categories.map(({ name }) => [
        name,
        monthKeys.reduce((sum, key) => sum + demo[key].values[name], 0),
      ]),
    ) as Record<Category, number>;
  }, [period]);

  const total = Object.values(values).reduce((sum, value) => sum + value, 0);
  const [animatedTotal, setAnimatedTotal] = useState(total);
  const previousTotal = useRef(total);

  useEffect(() => {
    const from = previousTotal.current;
    previousTotal.current = total;
    if (!hasInteracted || reducedMotion) {
      setAnimatedTotal(total);
      return;
    }
    let frame = 0;
    let start = 0;
    const duration = 360;
    const tick = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedTotal(from + (total - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [total, hasInteracted, reducedMotion]);

  const chartData = useMemo(
    () =>
      categories
        .map(({ name, color }) => ({ name, value: values[name], color }))
        .sort((a, b) =>
          sortBy === "value"
            ? b.value - a.value
            : a.name.localeCompare(b.name, "pt-BR"),
        ),
    [values, sortBy],
  );
  const daysInPeriod = period === "quarter" ? 92 : period === "jun" ? 30 : 31;
  const dailyAverage = total / daysInPeriod;
  const selectedCategory = chartData.find(
    (item) => item.name === activeCategory,
  );
  const previewCategory = chartData.find(
    (item) => item.name === (hoveredCategory ?? activeCategory),
  );
  const pieRadius = Math.min(138, Math.max(68, (chartWidth - 64) / 2));
  const toggleCategory = (name: Category) =>
    setActiveCategory((current) => (current === name ? null : name));
  const selectedLabel =
    period === "quarter"
      ? "Junho a agosto de 2026"
      : demo[period].label + " de 2026";
  const topCategory = [...chartData].sort((a, b) => b.value - a.value)[0];
  const filteredTransactions = (
    period === "quarter"
      ? monthKeys.flatMap((key) => demo[key].transactions)
      : demo[period].transactions
  ).filter(
    (transaction) => !activeCategory || transaction.category === activeCategory,
  );
  const displayedTransactions = filteredTransactions.slice(0, 4);
  const previousMonthTotal =
    period === "jul"
      ? Object.values(demo.jun.values).reduce((a, b) => a + b, 0)
      : period === "ago"
        ? Object.values(demo.jul.values).reduce((a, b) => a + b, 0)
        : null;
  const delta =
    previousMonthTotal === null
      ? null
      : Math.round(((total - previousMonthTotal) / previousMonthTotal) * 100);
  const deltaText =
    period === "quarter"
      ? "Três meses no recorte"
      : period === "jun"
        ? "Primeiro mês do recorte"
        : (delta! > 0 ? "+" : "") + delta + "% vs. mês anterior";

  const selectPeriod = (next: Period) => {
    if (next === period) return;
    setHasInteracted(true);
    setPeriod(next);
    setActiveCategory(null);
  };

  return (
    <div
      className="dashboard dashboard-customizable"
      aria-label="Demonstração de análise financeira com dados fictícios"
    >
      <div className="dashboard-head">
        <div className="dash-identity">
          <span className="dash-brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <div>
            <span className="dash-path">gerenCIA / Análise</span>
            <h3>Visão do extrato</h3>
          </div>
        </div>
        <div className="dash-head-actions">
          <span className="demo-status">
            <span /> Dados fictícios
          </span>
          <div
            className="period-filter"
            role="group"
            aria-label="Filtrar período da demonstração"
          >
            {monthKeys.map((key) => (
              <button
                key={key}
                type="button"
                className={period === key ? "active" : ""}
                onClick={() => selectPeriod(key)}
                aria-pressed={period === key}
              >
                {demo[key].label}
              </button>
            ))}
            <button
              type="button"
              className={period === "quarter" ? "active" : ""}
              onClick={() => selectPeriod("quarter")}
              aria-pressed={period === "quarter"}
            >
              3 meses
            </button>
          </div>
        </div>
        <span
          key={period}
          className={
            hasInteracted ? "dashboard-refresh animate" : "dashboard-refresh"
          }
          aria-hidden="true"
        />
      </div>

      <div className="dashboard-metrics">
        <div className="metric-primary">
          <span className="metric-label">Total de saídas</span>
          <strong>
            <span className="sr-only">{money(total)}</span>
            <span aria-hidden="true">{money(animatedTotal)}</span>
          </strong>
          <span className="metric-period">{selectedLabel}</span>
        </div>
        <div className="metric-secondary">
          <span className="metric-label">
            {period === "quarter" ? "Período analisado" : "Variação mensal"}
          </span>
          <strong
            className={delta !== null && delta > 0 ? "delta-up" : "delta-down"}
          >
            {deltaText}
          </strong>
          <small>
            {delta !== null && delta > 0
              ? "As saídas aumentaram"
              : delta !== null
                ? "As saídas diminuíram"
                : "Acompanhe a evolução mensal"}
          </small>
        </div>
        <div className="metric-secondary">
          <span className="metric-label">Média por dia</span>
          <strong>{money(dailyAverage)}</strong>
          <small>Total dividido por {daysInPeriod} dias do período</small>
        </div>
        <div className="metric-secondary metric-leader">
          <span className="metric-label">Categoria principal</span>
          <strong>
            <span
              className="leader-dot"
              style={{ backgroundColor: topCategory.color }}
            />
            {topCategory.name}
          </strong>
          <small>
            {Math.round((topCategory.value / total) * 100)}% das saídas
          </small>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="chart-panel">
          <div className="chart-title-row">
            <div>
              <h4>Gastos por categoria</h4>
              <p>Distribuição dos gastos por categoria</p>
            </div>
            <span>{selectedLabel}</span>
          </div>
          <div className="chart-toolbar">
            <div
              className="chart-type-switch"
              role="group"
              aria-label="Tipo de gráfico"
            >
              <button
                type="button"
                aria-pressed={chartType === "bar"}
                onClick={() => setChartType("bar")}
              >
                Barras
              </button>
              <button
                type="button"
                aria-pressed={chartType === "pie"}
                onClick={() => setChartType("pie")}
              >
                Pizza
              </button>
            </div>
            <div className="chart-sort">
              <span id="sort-heading">Ordenar por</span>
              <div
                className="chart-sort-switch"
                role="group"
                aria-labelledby="sort-heading"
              >
                <button
                  type="button"
                  aria-label="Ordenar por maior gasto"
                  aria-pressed={sortBy === "value"}
                  onClick={() => setSortBy("value")}
                >
                  <span className="sort-value-icon" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>{" "}
                  Maior gasto
                </button>
                <button
                  type="button"
                  aria-label="Ordenar por categoria"
                  aria-pressed={sortBy === "category"}
                  onClick={() => setSortBy("category")}
                >
                  A–Z
                </button>
              </div>
            </div>
          </div>
          <div className="chart-caption">
            <span>
              {chartType === "bar"
                ? "Compare os valores por categoria"
                : "Veja a participação de cada categoria"}
            </span>
            <span>
              {chartType === "bar" ? "Valores em R$" : "Participação em %"}
            </span>
          </div>
          <div
            className={`chart-wrap ${chartType === "pie" ? "chart-wrap-pie" : ""}`}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              onResize={(width) => setChartWidth(width)}
            >
              {chartType === "bar" ? (
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{
                    top: 8,
                    right: chartWidth > 460 ? 82 : 12,
                    bottom: 8,
                    left: 0,
                  }}
                  barCategoryGap="30%"
                  accessibilityLayer={false}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="#E1E9E7"
                    strokeDasharray="3 5"
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("pt-BR", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(Number(value))
                    }
                    tick={{ fill: "#48676E", fontSize: 12 }}
                    minTickGap={32}
                    tickCount={chartWidth < 360 ? 3 : 5}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={96}
                    tick={{ fill: "#31535A", fontSize: 13, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 5, 5, 0]}
                    maxBarSize={30}
                    isAnimationActive={hasInteracted && !reducedMotion}
                    animationDuration={360}
                    onMouseEnter={(_, index) =>
                      setHoveredCategory(chartData[index].name)
                    }
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={(_, index) =>
                      toggleCategory(chartData[index].name)
                    }
                  >
                    {chartData.map((item) => (
                      <Cell
                        key={item.name}
                        fill={item.color}
                        opacity={
                          activeCategory && activeCategory !== item.name
                            ? 0.3
                            : 1
                        }
                        cursor="pointer"
                      />
                    ))}
                    {chartWidth > 460 && (
                      <LabelList
                        dataKey="value"
                        position="right"
                        formatter={(value) => money(Number(value))}
                        fill="#31535A"
                        fontSize={12}
                      />
                    )}
                  </Bar>
                </BarChart>
              ) : (
                <PieChart accessibilityLayer={false}>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={pieRadius * 0.66}
                    outerRadius={pieRadius}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={2}
                    stroke="#ffffff"
                    strokeWidth={2}
                    labelLine={false}
                    label={({
                      cx,
                      cy,
                      midAngle,
                      outerRadius,
                      innerRadius,
                      percent,
                    }) => {
                      const radius =
                        Number(innerRadius) +
                        (Number(outerRadius) - Number(innerRadius)) * 0.54;
                      const angle = (-Number(midAngle) * Math.PI) / 180;
                      return (
                        <text
                          className="recharts-pie-label-text"
                          x={Number(cx) + radius * Math.cos(angle)}
                          y={Number(cy) + radius * Math.sin(angle)}
                          fill="#103742"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={12}
                          fontWeight={600}
                        >
                          {Math.round((percent ?? 0) * 100)}%
                        </text>
                      );
                    }}
                    isAnimationActive={!reducedMotion}
                    animationDuration={360}
                    onMouseEnter={(_, index) =>
                      setHoveredCategory(chartData[index].name)
                    }
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={(_, index) =>
                      toggleCategory(chartData[index].name)
                    }
                  >
                    {chartData.map((item) => (
                      <Cell
                        key={item.name}
                        fill={item.color}
                        opacity={
                          activeCategory && activeCategory !== item.name
                            ? 0.3
                            : 1
                        }
                        cursor="pointer"
                      />
                    ))}
                  </Pie>
                </PieChart>
              )}
            </ResponsiveContainer>
            {chartType === "pie" && (
              <div
                className="pie-center"
                aria-hidden="true"
                style={{ width: pieRadius * 1.15 }}
              >
                <span>
                  {selectedCategory
                    ? selectedCategory.name
                    : "Total do período"}
                </span>
                <strong>{money(selectedCategory?.value ?? total)}</strong>
                <small>
                  {selectedCategory
                    ? `${Math.round((selectedCategory.value / total) * 100)}% das saídas`
                    : `${chartData.length} categorias`}
                </small>
              </div>
            )}
          </div>
          <div
            className={`chart-detail ${previewCategory ? "has-preview" : ""}`}
            aria-label="Detalhes da categoria"
          >
            {previewCategory ? (
              <>
                <span className="chart-detail-name">
                  <i
                    style={{ backgroundColor: previewCategory.color }}
                    aria-hidden="true"
                  />
                  {previewCategory.name}
                </span>
                <strong>{money(previewCategory.value)}</strong>
                <span className="chart-detail-share">
                  {Math.round((previewCategory.value / total) * 100)}% do
                  período
                </span>
              </>
            ) : (
              <p>
                Passe o mouse sobre o gráfico ou selecione uma categoria para
                ver os detalhes.
              </p>
            )}
          </div>
          <p className="sr-only">
            Gráfico de {chartType === "pie" ? "pizza" : "barras"} em{" "}
            {selectedLabel}.{" "}
            {chartData
              .map(
                (item) =>
                  `${item.name}: ${money(item.value)}, ${Math.round((item.value / total) * 100)}%.`,
              )
              .join(" ")}
          </p>
          <div className="chart-foot">
            <span className="chart-foot-pulse" />
            Selecione uma categoria no gráfico ou no resumo para ver os
            lançamentos.
          </div>
        </div>

        <aside className="breakdown-panel" aria-label="Resumo por categoria">
          <div className="breakdown-heading">
            <span>Resumo por categoria</span>
            <strong>100%</strong>
          </div>
          <div className="breakdown-stack" aria-hidden="true">
            {chartData.map((item) => (
              <span
                key={item.name}
                style={{
                  width: (item.value / total) * 100 + "%",
                  backgroundColor: item.color,
                }}
              />
            ))}
          </div>
          <div className="breakdown-list">
            {chartData.map(({ name, value, color }) => (
              <button
                key={name}
                type="button"
                className={activeCategory === name ? "selected" : ""}
                onMouseEnter={() => setHoveredCategory(name)}
                onMouseLeave={() => setHoveredCategory(null)}
                onFocus={() => setHoveredCategory(name)}
                onBlur={() => setHoveredCategory(null)}
                onClick={() => toggleCategory(name)}
                aria-pressed={activeCategory === name}
                aria-controls="demo-transactions"
              >
                <span className="breakdown-name">
                  <i style={{ backgroundColor: color }} aria-hidden="true" />
                  {name}
                </span>
                <span className="breakdown-value">
                  {money(value)}
                  <small>{Math.round((value / total) * 100)}%</small>
                </span>
              </button>
            ))}
          </div>
          <div className="breakdown-note">
            <span aria-hidden="true">↗</span>
            <p>
              <strong>{topCategory.name}</strong> concentra a maior parte dos
              gastos neste período.
            </p>
          </div>
        </aside>
      </div>

      <div className="transaction-panel" id="demo-transactions">
        <div className="transaction-heading">
          <div>
            <span className="transaction-kicker">Movimentações</span>
            <h4>
              {activeCategory
                ? "Lançamentos em " + activeCategory
                : "Por trás dos números"}
            </h4>
          </div>
          <span role="status" aria-live="polite" aria-atomic="true">
            {displayedTransactions.length} de {filteredTransactions.length}{" "}
            exemplos
            {activeCategory ? " em " + activeCategory : " no período"}
            <span className="sr-only">
              . {selectedLabel}. Total de saídas: {money(total)}. Visualização
              em {chartType === "pie" ? "pizza" : "barras"}
            </span>
          </span>
        </div>
        {activeCategory && (
          <button
            className="clear-filter"
            type="button"
            onClick={() => setActiveCategory(null)}
          >
            Mostrar todas as categorias
          </button>
        )}
        <div
          key={period + (activeCategory || "all")}
          className="transaction-list"
        >
          {displayedTransactions.map((transaction, index) => (
            <div
              className="transaction"
              key={transaction.name + transaction.detail + index}
            >
              <span
                className="transaction-icon"
                aria-hidden="true"
                style={
                  {
                    "--category-color": categories.find(
                      (category) => category.name === transaction.category,
                    )?.color,
                  } as CSSProperties
                }
              >
                {transaction.name.slice(0, 1)}
              </span>
              <span className="transaction-name">
                <strong>{transaction.name}</strong>
                <small>{transaction.detail}</small>
              </span>
              <span className="transaction-tag">{transaction.category}</span>
              <strong className="transaction-amount">
                − {money(transaction.amount)}
              </strong>
            </div>
          ))}
        </div>
      </div>
      <p className="demo-disclaimer">
        Prévia com dados ilustrativos. Nenhum extrato real é usado nesta
        demonstração.
      </p>
    </div>
  );
}
