import { Bar, BarChart, Cell, LabelList, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { categoryRows, money, totalOf, valuesFor, type Category, type CategoryRow, type Period } from "./demoModel";

// Cores do gráfico de barras: a barra em destaque fica escura, as demais em
// verde, e quando há uma categoria escolhida as outras ficam apagadas.
const ink = "#0F3440";
const barRest = "#5B8A88";
const barMuted = "#B9CDC9";
const paper = "#FFFFFF";

/**
 * No Recharts, os eventos de mouse de Bar e Pie informam a posição (index) da
 * barra ou da fatia na lista de dados. Esta função monta os três tratadores que
 * trocam a posição pela categoria. Barras e rosca usam os mesmos.
 */
function mouseHandlers(rows: CategoryRow[], onPreview: (name: Category | null) => void, onToggle: (name: Category) => void) {
  return {
    showPreview(_: unknown, index: number) {
      onPreview(rows[index]?.name ?? null);
    },
    clearPreview() {
      onPreview(null);
    },
    toggle(_: unknown, index: number) {
      const row = rows[index];
      if (row) {
        onToggle(row.name);
      }
    },
  };
}

type CategoryBarsProps = {
  rows: CategoryRow[]; // já na ordem escolhida na lista
  focus: Category | null; // a categoria em destaque
  category: Category | null; // a categoria escolhida
  onPreview: (name: Category | null) => void;
  onToggle: (name: Category) => void;
};

/** Barras horizontais, na mesma ordem da lista ao lado. */
export function CategoryBars({ rows, focus, category, onPreview, onToggle }: CategoryBarsProps) {
  function barColor(name: Category) {
    if (focus === name) {
      return ink;
    }
    if (category) {
      return barMuted;
    }
    return barRest;
  }

  const handlers = mouseHandlers(rows, onPreview, onToggle);

  return <ResponsiveContainer width="100%" height="100%">
    {/* layout="vertical" deita as barras: os nomes ficam à esquerda e os valores à direita. */}
    <BarChart
      data={rows} accessibilityLayer={false} layout="vertical" barCategoryGap="28%"
      margin={{ top: 4, right: 104, bottom: 4, left: 0 }}
    >
      <XAxis type="number" hide domain={[0, "dataMax"]} />
      <YAxis
        type="category" dataKey="name" width={112} tickLine={false}
        axisLine={{ stroke: ink, strokeWidth: 1 }} tick={{ fill: ink, fontSize: 16 }}
      />
      <Bar
        dataKey="value" maxBarSize={24} radius={[0, 4, 4, 0]} isAnimationActive={false}
        onMouseEnter={handlers.showPreview} onMouseLeave={handlers.clearPreview} onClick={handlers.toggle}
      >
        {rows.map((row) => <Cell key={row.name} fill={barColor(row.name)} cursor="pointer" />)}
        <LabelList
          dataKey="value" position="right" offset={10} formatter={(value) => money(Number(value))}
          style={{ fill: ink, fontSize: 16, fontVariantNumeric: "tabular-nums" }}
        />
      </Bar>
    </BarChart>
  </ResponsiveContainer>;
}

type CategoryDonutProps = {
  period: Period;
  focus: Category | null; // a categoria em destaque
  onPreview: (name: Category | null) => void;
  onToggle: (name: Category) => void;
};

/**
 * Rosca com a parte de cada categoria. Ela segue a ordem fixa das categorias,
 * e não a ordem da lista, para que cores vizinhas continuem fáceis de separar.
 */
export function CategoryDonut({ period, focus, onPreview, onToggle }: CategoryDonutProps) {
  const rows = categoryRows(period);
  const values = valuesFor(period);

  // O centro mostra a categoria em destaque ou, sem destaque, o total.
  let centerLabel = "Total";
  let centerValue = totalOf(values);
  if (focus) {
    centerLabel = focus;
    centerValue = values[focus];
  }

  const handlers = mouseHandlers(rows, onPreview, onToggle);

  return <>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart accessibilityLayer={false}>
        {/* startAngle 90 e endAngle -270 começam a rosca no topo e seguem no sentido do relógio. */}
        <Pie
          data={rows} dataKey="value" nameKey="name" isAnimationActive={false}
          cx="50%" cy="50%" innerRadius="60%" outerRadius="88%" startAngle={90} endAngle={-270}
          stroke={paper} strokeWidth={2}
          onMouseEnter={handlers.showPreview} onMouseLeave={handlers.clearPreview} onClick={handlers.toggle}
        >
          {/* Com uma categoria em destaque, as outras fatias ficam claras. */}
          {rows.map((row) => <Cell key={row.name} fill={row.color} opacity={focus && focus !== row.name ? 0.28 : 1} cursor="pointer" />)}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
    <div className="donut-center" aria-hidden="true"><small>{centerLabel}</small><strong>{money(centerValue)}</strong></div>
  </>;
}
