import { demo, monthKeys } from "./dashboard/demoModel";

const daysIn = { jun: 30, jul: 31, ago: 31 } as const;

// Spending per day across the fictitious quarter, in calendar order.
const days = monthKeys.flatMap((key) => {
  const totals = Array.from({ length: daysIn[key] }, () => 0);
  demo[key].transactions.forEach((item) => { totals[Number(item.date.split(" ")[0]) - 1] += item.amount; });
  return totals;
});
const peak = Math.max(...days);

// The ground is drawn from the data itself: 92 faint columns, one per day, rising from a section's base.
export default function GroundChart() {
  return <svg className="ground-chart" viewBox={`0 0 ${days.length * 10} 100`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
    {days.map((value, index) => <rect key={index} x={index * 10 + 2} y={100 - value / peak * 100} width="6" height={value / peak * 100} />)}
  </svg>;
}
