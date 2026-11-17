/** Formata uma data vinda da API, por exemplo "20 de outubro de 2026". */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

export const monthLabel = (month: string) => new Intl.DateTimeFormat("pt-BR", {
  month: "long", year: "numeric", timeZone: "UTC",
}).format(new Date(`${month}-01T12:00:00Z`));

export const shortMonth = (month: string) => new Intl.DateTimeFormat("pt-BR", {
  month: "short", year: "numeric", timeZone: "UTC",
}).format(new Date(`${month}-01T12:00:00Z`));

export const dayLabel = (day: string) => new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit", month: "short", timeZone: "UTC",
}).format(new Date(`${day}T12:00:00Z`));

export const currentMonth = () => new Date().toLocaleDateString("sv-SE", {
  timeZone: "America/Sao_Paulo",
}).slice(0, 7);
