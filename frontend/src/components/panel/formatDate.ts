/** Formata uma data vinda da API, por exemplo "20 de outubro de 2026". */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}
