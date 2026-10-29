import { daysInMonth, demo, monthKeys } from "./dashboard/demoModel";

// Quanto se gastou em cada dia do trimestre fictício, na ordem do calendário.
const days = monthKeys.flatMap((key) => {
  const totals = Array.from({ length: daysInMonth[key] }, () => 0);
  for (const item of demo[key].transactions) {
    // A data vem como "30 jun": o número antes do espaço é o dia do mês.
    const day = Number(item.date.split(" ")[0]);
    totals[day - 1] += item.amount;
  }
  return totals;
});
const peak = Math.max(...days);

/**
 * O "chão" de uma seção, desenhado com os próprios dados: 92 colunas claras,
 * uma por dia, subindo da base da seção. A coluna mais alta é o dia de maior gasto.
 */
export default function GroundChart() {
  return <svg className="ground-chart" viewBox={`0 0 ${days.length * 10} 100`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
    {days.map((value, index) => <rect key={index} x={index * 10 + 2} y={100 - value / peak * 100} width="6" height={value / peak * 100} />)}
  </svg>;
}
