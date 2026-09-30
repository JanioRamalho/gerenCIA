import { categories, demo, monthKeys, money, type Category, type MonthKey, type Period } from "./demoData";

export type ChartType = "bar" | "donut";
export type DemoFocus = "categories" | "transactions";
export type DemoState = { period: Period; category: Category | null; chart: ChartType };
export type DemoPreset = Partial<DemoState> & { focus: DemoFocus };
export type StoryKey = "evolution" | "categories" | "transactions";

export const initialDemoState: DemoState = { period: "ago", category: null, chart: "bar" };

export const storySteps: {
  key: StoryKey;
  label: string;
  title: string;
  description: string;
  preset: DemoPreset;
}[] = [
  {
    key: "evolution",
    label: "Evolução",
    title: "Compare os meses",
    description: "Veja como as saídas mudaram de junho a agosto de 2026.",
    preset: { period: "quarter", category: null, chart: "bar", focus: "categories" },
  },
  {
    key: "categories",
    label: "Categorias",
    title: "Entenda a distribuição",
    description: "Descubra quanto cada categoria representa em agosto.",
    preset: { period: "ago", category: null, chart: "donut", focus: "categories" },
  },
  {
    key: "transactions",
    label: "Lançamentos",
    title: "Chegue ao detalhe",
    description: "Abra os exemplos que ajudam a explicar o total de alimentação.",
    preset: { period: "ago", category: "Alimentação", chart: "bar", focus: "transactions" },
  },
];

export const totalOf = (values: Record<Category, number>) =>
  categories.reduce((sum, item) => sum + values[item.name], 0);

export const monthColors: Record<MonthKey, string> = { jun: "#E9AD83", jul: "#72C8B6", ago: "#91BBD1" };

export const monthRows = monthKeys.map((key) => ({
  key,
  label: demo[key].label,
  total: totalOf(demo[key].values),
  ...demo[key].values,
}));

export function valuesFor(period: Period): Record<Category, number> {
  if (period !== "quarter") return demo[period].values;
  return Object.fromEntries(categories.map(({ name }) => [
    name,
    monthKeys.reduce((sum, key) => sum + demo[key].values[name], 0),
  ])) as Record<Category, number>;
}

export function transactionsFor(period: Period) {
  return period === "quarter"
    ? monthKeys.flatMap((key) => demo[key].transactions)
    : demo[period].transactions;
}

export function categoryRows(period: Period) {
  const values = valuesFor(period);
  const total = totalOf(values);
  return categories.map((category) => ({
    ...category,
    value: values[category.name],
    share: total ? values[category.name] / total : 0,
  }));
}

export function periodLabel(period: Period) {
  return period === "quarter" ? "Junho a agosto de 2026" : `${demo[period].label} de 2026`;
}

export function monthlyDelta(period: Period) {
  if (period === "jun" || period === "quarter") return null;
  const previous = period === "jul" ? "jun" : "jul";
  const currentTotal = totalOf(demo[period].values);
  const previousTotal = totalOf(demo[previous].values);
  return { amount: currentTotal - previousTotal, percentage: (currentTotal / previousTotal - 1) * 100 };
}

export function formatPercentage(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits }).format(value);
}

export { categories, demo, monthKeys, money };
export type { Category, Period };
