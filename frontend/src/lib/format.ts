export type Money = string | number;
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Conversão somente para apresentação: totais e métricas são calculados no servidor. */
export const money = (value: Money) => brl.format(Number(value));
export const percent = (value: number, digits = 0) =>
  new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: digits }).format(value);
