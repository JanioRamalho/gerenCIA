/** Formata uma data vinda da API, por exemplo "20 de outubro de 2026". */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

const dayFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });
const monthFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" });

export function formatDay(day: string) {
  return dayFormat.format(new Date(`${day}T00:00:00Z`));
}

export function formatMonth(month: string) {
  return monthFormat.format(new Date(`${month}-01T00:00:00Z`));
}

export function isPanelMonth(month: string) {
  return /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month);
}
