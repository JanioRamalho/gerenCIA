import type { IconName } from "../components/Icon";

type CategoryPresentation = { color: string; wash: string; icon: IconName };

/** Presentation only: category names and financial identity come from the API. */
const categories: Record<string, CategoryPresentation> = {
  "Alimentação": { color: "#b64b24", wash: "#fff0e7", icon: "food" },
  "Transporte": { color: "#306bbb", wash: "#eaf1ff", icon: "car" },
  "Saúde": { color: "#b54371", wash: "#fcecf2", icon: "heart" },
  "Educação": { color: "#6c56a8", wash: "#f1edfb", icon: "book" },
  "Moradia": { color: "#756136", wash: "#f5f0e4", icon: "home" },
  "Compras": { color: "#a33e80", wash: "#faedf6", icon: "bag" },
  "Assinaturas": { color: "#7a50b5", wash: "#f1eafb", icon: "repeat" },
  "Serviços": { color: "#337975", wash: "#e6f3f0", icon: "tool" },
  "Viagens": { color: "#29758c", wash: "#e7f3f8", icon: "plane" },
  "Lazer": { color: "#a66c19", wash: "#fff3dc", icon: "spark" },
  "Outros": { color: "#617174", wash: "#edf1f0", icon: "more" },
};

export function categoryPresentation(name: string): CategoryPresentation {
  return categories[name] ?? categories.Outros;
}
