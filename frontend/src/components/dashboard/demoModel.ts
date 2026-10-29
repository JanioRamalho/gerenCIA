import { categories, demo, monthKeys, money, type Category, type MonthKey, type Period, type Transaction } from "./demoData";

export type ChartType = "bar" | "donut";
export type DemoFocus = "categories" | "transactions";
export type DemoState = { period: Period; category: Category | null; chart: ChartType };
export type DemoPreset = Partial<DemoState> & { focus: DemoFocus };
export type StoryKey = "evolution" | "categories" | "transactions";

/** Uma categoria num período: o nome, a cor, o valor gasto e a parte do total (0,25 = 25%). */
export type CategoryRow = { name: Category; color: string; value: number; share: number };

/** Comparação de um mês com o mês anterior. */
export type MonthlyDelta = {
  month: MonthKey;
  previousMonth: MonthKey;
  currentTotal: number;
  previousTotal: number;
  amount: number; // diferença em reais; negativa quando o mês gastou menos
  change: number; // diferença como fração do mês anterior: -0,09 quer dizer 9% a menos
};

export const initialDemoState: DemoState = { period: "ago", category: null, chart: "bar" };

export const daysInMonth: Record<MonthKey, number> = { jun: 30, jul: 31, ago: 31 };

// As três leituras da Figura 2. Cada letra abre o seu recorte na demonstração.
export const storySteps: {
  key: StoryKey;
  letter: string;
  title: string;
  description: string;
  preset: DemoPreset;
}[] = [
  {
    key: "evolution",
    letter: "a",
    title: "Saídas mensais, junho a agosto",
    description: "Agosto fechou abaixo de julho; a diferença aparece desenhada entre as colunas.",
    preset: { period: "quarter", category: null, chart: "bar", focus: "categories" },
  },
  {
    key: "categories",
    letter: "b",
    title: "Composição das saídas de agosto",
    description: "Cada faixa é a parte de uma categoria no total do mês.",
    preset: { period: "ago", category: null, chart: "donut", focus: "categories" },
  },
  {
    key: "transactions",
    letter: "c",
    title: "Lançamentos de alimentação, agosto",
    description: "Os três maiores lançamentos e a soma dos demais fecham o maior total do mês.",
    preset: { period: "ago", category: "Alimentação", chart: "bar", focus: "transactions" },
  },
];

/** Soma os valores de todas as categorias. */
export const totalOf = (values: Record<Category, number>) =>
  categories.reduce((sum, item) => sum + values[item.name], 0);

// Uma cor só, do claro ao escuro: quanto mais recente o mês, mais escura a coluna.
export const monthColors: Record<MonthKey, string> = { jun: "#8AB7B0", jul: "#3F7F79", ago: "#0F3440" };

export const categoryColor = (name: Category) =>
  categories.find((item) => item.name === name)?.color ?? "#3A78B4";

/** Soma o valor de uma lista de lançamentos. */
export const sumOf = (items: Transaction[]) => items.reduce((total, item) => total + item.amount, 0);

/** Os lançamentos de uma categoria num período, do maior para o menor, e a soma deles. */
export function entriesFor(period: Period, category: Category) {
  const items = transactionsFor(period).filter((item) => item.category === category);
  items.sort((a, b) => b.amount - a.amount);
  return { items, sum: sumOf(items) };
}

/** Uma linha por mês, com o nome e o total gasto. */
export const monthRows = monthKeys.map((key) => ({
  key,
  label: demo[key].label,
  total: totalOf(demo[key].values),
}));

/** O valor gasto em cada categoria no período. */
export function valuesFor(period: Period): Record<Category, number> {
  if (period !== "quarter") {
    return demo[period].values;
  }

  // No trimestre, o valor de cada categoria é a soma dos três meses.
  const quarterValues = {} as Record<Category, number>;
  for (const { name } of categories) {
    quarterValues[name] = monthKeys.reduce((sum, key) => sum + demo[key].values[name], 0);
  }
  return quarterValues;
}

/** Os lançamentos do período, do mais recente ao mais antigo. */
export function transactionsFor(period: Period) {
  if (period !== "quarter") {
    return demo[period].transactions;
  }
  // Cada mês já vem do mais recente ao mais antigo; basta começar por agosto.
  const newestMonthFirst = [...monthKeys].reverse();
  return newestMonthFirst.flatMap((key) => demo[key].transactions);
}

/** As categorias do período, na ordem fixa das cores, com o valor e a parte de cada uma. */
export function categoryRows(period: Period): CategoryRow[] {
  const values = valuesFor(period);
  const total = totalOf(values);
  return categories.map((category) => ({
    ...category,
    value: values[category.name],
    share: total ? values[category.name] / total : 0,
  }));
}

/** Uma cópia das linhas, da categoria que mais gastou para a que menos gastou. */
export function sortByValue(rows: CategoryRow[]): CategoryRow[] {
  return [...rows].sort((a, b) => b.value - a.value);
}

/** A categoria que mais gastou no período. */
export function largestCategory(period: Period): CategoryRow {
  return sortByValue(categoryRows(period))[0];
}

export function periodLabel(period: Period) {
  if (period === "quarter") {
    return "Junho a agosto de 2026";
  }
  return `${demo[period].label} de 2026`;
}

/** Quantos dias o período tem: 30 ou 31 num mês, 92 no trimestre. */
export function daysInPeriod(period: Period): number {
  if (period === "quarter") {
    return monthKeys.reduce((sum, key) => sum + daysInMonth[key], 0);
  }
  return daysInMonth[period];
}

/** Compara o mês com o anterior. Junho é o primeiro mês e o trimestre não é um mês, então não há comparação. */
export function monthlyDelta(period: Period): MonthlyDelta | null {
  if (period === "jun" || period === "quarter") {
    return null;
  }

  let previousMonth: MonthKey = "jul";
  if (period === "jul") {
    previousMonth = "jun";
  }

  const currentTotal = totalOf(demo[period].values);
  const previousTotal = totalOf(demo[previousMonth].values);
  return {
    month: period,
    previousMonth,
    currentTotal,
    previousTotal,
    amount: currentTotal - previousTotal,
    change: currentTotal / previousTotal - 1,
  };
}

/**
 * Formata uma diferença em reais com o sinal de menos tipográfico (−), que fica
 * mais legível que o hífen: -298 vira "−R$ 298,00".
 */
export function formatMoneyDifference(value: number) {
  return money(value).replace("-", "−");
}

/** Formata uma fração como porcentagem inteira: 0,253 vira "25%". */
export function formatPercentage(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 }).format(value);
}

export { categories, demo, monthKeys, money };
export type { Category, MonthKey, Period, Transaction };
