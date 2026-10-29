import type { ReactNode } from "react";

export type IconName = "calendar" | "receipt" | "tags" | "rows" | "columns";

// Todos os ícones seguem o mesmo desenho: grade de 24px, traço de 1,75 e
// pontas arredondadas. A cor vem do texto ao redor (currentColor).
const shapes: Record<IconName, ReactNode> = {
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
  receipt: <><path d="M6.5 3.5h11v17l-2.75-1.75L12 20.5l-2.75-1.75L6.5 20.5v-17Z" /><path d="M9.5 8.5h5M9.5 12h5M9.5 15.5h3" /></>,
  tags: <><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></>,
  rows: <path d="M4.5 6.5h15M4.5 12h9M4.5 17.5h12" />,
  columns: <path d="M6 19.5v-6M12 19.5V9M18 19.5V4.5" />,
};

export default function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}
