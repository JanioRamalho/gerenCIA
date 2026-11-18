import type { IconName } from "../components/Icon";

export const panelRoutes = [
  { path: "/app", label: "Painel", icon: "home" },
  { path: "/app/files", label: "Arquivos", icon: "files" },
  { path: "/app/transactions", label: "Transações", icon: "receipt" },
  { path: "/app/budgets", label: "Limites", icon: "target" },
  { path: "/app/account", label: "Conta", icon: "user" },
] satisfies { path: string; label: string; icon: IconName }[];
