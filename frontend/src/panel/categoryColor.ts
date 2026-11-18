export function categoryColor(name: string, savedColor: string | null) {
  if (savedColor) return savedColor;
  if (name === "Outros") return "#64748B";
  // Quando a categoria ainda não tem uma cor cadastrada, o nome mantém a cor estável.
  let hue = 0;
  for (const letter of name.toLowerCase()) {
    hue = (hue * 31 + (letter.codePointAt(0) ?? 0)) % 360;
  }
  return `hsl(${hue} 53% 39%)`;
}
