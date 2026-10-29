import {
  daysInPeriod, demo, formatPercentage, largestCategory, money, monthlyDelta, periodLabel, totalOf, valuesFor,
  type MonthlyDelta, type Period,
} from "./demoModel";

/** Os quatro números do topo da demonstração: total, variação, média por dia e maior categoria. */
export default function MetricStrip({ period }: { period: Period }) {
  const total = totalOf(valuesFor(period));
  const days = daysInPeriod(period);
  const topCategory = largestCategory(period);

  return <dl className="metric-strip">
    <div className="metric-main"><dt>Total de saídas</dt><dd><strong>{money(total)}</strong><small>{periodLabel(period)}</small></dd></div>
    <div><dt>Variação mensal</dt><dd><MonthlyChange delta={monthlyDelta(period)} /></dd></div>
    <div><dt>Média por dia</dt><dd><strong>{money(total / days)}</strong><small>Total dividido por {days} dias</small></dd></div>
    <div><dt>Maior categoria</dt><dd><strong>{topCategory.name}</strong><small>{formatPercentage(topCategory.share)} do total</small></dd></div>
  </dl>;
}

/** A variação em relação ao mês anterior: a porcentagem, as duas barras e a diferença em reais. */
function MonthlyChange({ delta }: { delta: MonthlyDelta | null }) {
  // Junho e o trimestre não têm mês anterior para comparar.
  if (delta === null) {
    return <><strong>—</strong><small>Escolha julho ou agosto para comparar</small></>;
  }

  const currentLabel = demo[delta.month].label;
  const previousLabel = demo[delta.previousMonth].label;
  let direction = "a mais";
  if (delta.amount < 0) {
    direction = "a menos";
  }

  return <>
    <strong>{signedPercentage(delta.change)}</strong>
    <DeltaBars current={delta.currentTotal} previous={delta.previousTotal} currentLabel={currentLabel} previousLabel={previousLabel} />
    <small>{money(Math.abs(delta.amount))} {direction} que em {previousLabel.toLowerCase()}</small>
  </>;
}

/** A variação com sinal, por exemplo "+5%" ou "−9%". */
function signedPercentage(change: number) {
  let sign = "−";
  if (change > 0) {
    sign = "+";
  }
  return sign + formatPercentage(Math.abs(change));
}

type DeltaBarsProps = {
  current: number;
  previous: number;
  currentLabel: string;
  previousLabel: string;
};

/** A variação desenhada como diferença: o mês anterior em cima e o mês escolhido embaixo. */
function DeltaBars({ current, previous, currentLabel, previousLabel }: DeltaBarsProps) {
  // Larguras em porcentagem da barra maior.
  const maximum = Math.max(current, previous);
  const widthOf = (value: number) => `${value / maximum * 100}%`;

  return <span className="delta-bars" role="img" aria-label={`${previousLabel}: ${money(previous)}. ${currentLabel}: ${money(current)}.`}>
    <span><b>{previousLabel.slice(0, 3)}</b><i style={{ width: widthOf(previous) }} /></span>
    <span className="is-current"><b>{currentLabel.slice(0, 3)}</b><i style={{ width: widthOf(current) }} /></span>
  </span>;
}
