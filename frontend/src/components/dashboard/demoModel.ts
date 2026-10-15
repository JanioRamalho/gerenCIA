import { categories, demo, monthKeys, money, type Category, type MonthKey, type Period, type Transaction } from "./demoData";

export type ChartType = "bar" | "donut";
export type DemoFocus = "categories" | "transactions";
export type DemoState = { period: Period; category: Category | null; chart: ChartType };
export type DemoPreset = Partial<DemoState> & { focus: DemoFocus };
export type StoryKey = "evolution" | "categories" | "transactions";

export const initialDemoState: DemoState = { period: "ago", category: null, chart: "bar" };

// The three readings of Figure 2; each letter opens its slice of the demonstration.
export const storySteps: {
  key: StoryKey;
  letter: string;
  label: string;
  title: string;
  description: string;
  preset: DemoPreset;
}[] = [
  {
    key: "evolution",
    letter: "a",
    label: "Evolução",
    title: "Saídas mensais, junho a agosto",
    description: "Agosto fechou abaixo de julho; a diferença aparece desenhada entre as colunas.",
    preset: { period: "quarter", category: null, chart: "bar", focus: "categories" },
  },
  {
    key: "categories",
    letter: "b",
    label: "Composição",
    title: "Composição das saídas de agosto",
    description: "Cada faixa é a parte de uma categoria no total do mês.",
    preset: { period: "ago", category: null, chart: "donut", focus: "categories" },
  },
  {
    key: "transactions",
    letter: "c",
    label: "Lançamentos",
    title: "Lançamentos de alimentação, agosto",
    description: "Os três maiores lançamentos e a soma dos demais fecham o maior total do mês.",
    preset: { period: "ago", category: "Alimentação", chart: "bar", focus: "transactions" },
  },
];

export const totalOf = (values: Record<Category, number>) =>
  categories.reduce((sum, item) => sum + values[item.name], 0);

// Ordinal ramp (one hue, light to dark): later months read darker.
export const monthColors: Record<MonthKey, string> = { jun: "#8AB7B0", jul: "#3F7F79", ago: "#0F3440" };

export const categoryColor = (name: Category) =>
  categories.find((item) => item.name === name)?.color ?? "#3A78B4";

// Every category total is the exact sum of its entries; the largest come first.
export function entriesFor(period: Period, category: Category) {
  const items = transactionsFor(period).filter((item) => item.category === category).sort((a, b) => b.amount - a.amount);
  const sum = items.reduce((total, item) => total + item.amount, 0);
  return { items, sum, total: valuesFor(period)[category] };
}

export const sumOf = (items: Transaction[]) => items.reduce((total, item) => total + item.amount, 0);

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
    ? [...monthKeys].reverse().flatMap((key) => demo[key].transactions)
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
export type { Category, MonthKey, Period, Transaction };
